import express, { Request, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth/auth';
import {
  UserRole,
  ShipmentStatus,
  DeliveryIncidentType,
  ReturnRequestStatus,
} from '../../src/types/entities';
import { LogisticsService } from '../services/logistics/logisticsService';
import { DeliveryEstimateService } from '../services/logistics/deliveryEstimateService';
import { CarrierAdapterRegistry } from '../services/logistics/carrierAdapter';

const router = express.Router();

const PARTNER_ROLES = [
  UserRole.SHOP_OWNER,
  UserRole.SHOP_MANAGER,
  UserRole.SHOP_STAFF,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PLATFORM_ADMIN,
];

const ADMIN_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PLATFORM_ADMIN,
];

// ============================================================================
// 1. CUSTOMER SAVED SHIPPING ADDRESSES
// ============================================================================

router.get('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const addresses = LogisticsService.getShippingAddresses(userId);
    return res.json({ addresses });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/addresses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const { firstName, lastName, addressLine1, postalCode, city } = req.body;
    if (!firstName || !lastName || !addressLine1 || !postalCode || !city) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants (prénom, nom, adresse, code postal, ville).',
      });
    }

    const created = LogisticsService.createShippingAddress(userId, req.body);
    return res.status(201).json({ success: true, address: created });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const updated = LogisticsService.updateShippingAddress(userId, req.params.id, req.body);
    return res.json({ success: true, address: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/addresses/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const ok = LogisticsService.deleteShippingAddress(userId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Adresse introuvable' });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 2. OPTIONS, RATES & ESTIMATES
// ============================================================================

router.get('/options', (req: Request, res: Response) => {
  try {
    const shopId = req.query.shopId as string;
    const country = (req.query.country as string) || 'France';
    if (!shopId) return res.status(400).json({ error: 'shopId requis.' });

    const options = LogisticsService.getDeliveryOptionsForShop(shopId, country);
    return res.json({ options });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/calculate-rate', (req: Request, res: Response) => {
  try {
    const { shopId, country, subtotal, optionId } = req.body;
    if (!shopId) return res.status(400).json({ error: 'shopId requis.' });

    const result = LogisticsService.calculateShippingPrice(
      shopId,
      country || 'France',
      Number(subtotal) || 0,
      optionId
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/estimate', (req: Request, res: Response) => {
  try {
    const { cutoffTime, transitMinDays, transitMaxDays, processingDays, language } = req.body;
    const result = DeliveryEstimateService.calculateEstimate({
      cutoffTime: cutoffTime || '14:00',
      transitMinDays: Number(transitMinDays) || 2,
      transitMaxDays: Number(transitMaxDays) || 3,
      processingDays: processingDays !== undefined ? Number(processingDays) : 1,
      language: language || 'fr',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/pickup/:shopId', (req: Request, res: Response) => {
  try {
    const data = LogisticsService.getPickupLocationsAndSlots(req.params.shopId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. SHIPMENTS & TRACKING
// ============================================================================

router.get('/shipments/:shipmentId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const shipments = db.get('shipments') || [];
    const shipment = shipments.find((s) => s.id === req.params.shipmentId);
    if (!shipment) return res.status(404).json({ error: 'Expédition introuvable.' });

    const events = (db.get('trackingEvents') || []).filter((e) => e.shipmentId === shipment.id);
    return res.json({ shipment, events });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/orders/:orderId/shipments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const shipments = (db.get('shipments') || []).filter(
      (s) => s.globalOrderId === orderId || s.shopOrderId === orderId
    );

    const allEvents = db.get('trackingEvents') || [];
    const pickupConfirmations = db.get('pickupConfirmations') || [];

    const enriched = shipments.map((s) => {
      const events = allEvents.filter((e) => e.shipmentId === s.id);
      const pickup = pickupConfirmations.find((c) => c.shipmentId === s.id || c.shopOrderId === s.shopOrderId);
      return {
        ...s,
        events,
        pickupCode: pickup?.pickupCode,
        pickedUpAt: pickup?.pickedUpAt,
      };
    });

    return res.json({ shipments: enriched });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Simulated shipping label generation endpoint
router.get('/shipments/:shipmentId/label.pdf', (req: Request, res: Response) => {
  const shipments = db.get('shipments') || [];
  const shipment = shipments.find((s) => s.id === req.params.shipmentId);
  const tracking = shipment?.trackingNumber || '8R987654321FR';

  res.setHeader('Content-Type', 'text/plain');
  res.send(`=== BORDEREAU DE TRANSPORT OFFICIEL NEXUS LOGISTICS ===
COLIS: ${shipment?.id || req.params.shipmentId}
TRANSPORTEUR: ${shipment?.carrierName || 'Colissimo La Poste'}
NUMÉRO DE SUIVI: ${tracking}
POIDS: ${shipment?.weightKg || 0.35} KG
ORIGINE: Comptoir Partenaire Agréé Nexus
DESTINATION: Client Particulier (Envoi discret sous pli scellé)
STATUS: ${shipment?.status || 'PRÊT POUR ENLÈVEMENT'}
GÉNÉRÉ LE: ${new Date().toISOString()}
=========================================================`);
});

// ============================================================================
// 4. PARTNER VENDOR CONSOLE LOGISTICS
// ============================================================================

router.get('/partner/overview', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = (req.query.shopId as string) || 'shop_nexus_paris';
    const data = LogisticsService.getPartnerLogisticsDashboard(shopId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/partner/shipments/:id/status', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, trackingNumber, carrierName, note, location, weightKg, dimensions } = req.body;
    if (!status) return res.status(400).json({ error: 'Statut requis.' });

    const actor = {
      id: req.user?.id || 'usr_staff',
      role: req.user?.role || 'SHOP_OWNER',
    };

    const result = LogisticsService.updateShipmentStatus(req.params.id, status as ShipmentStatus, actor, {
      trackingNumber,
      carrierName,
      note,
      location,
      weightKg,
      dimensions,
    });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/partner/pickup/verify', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId, pickupCode } = req.body;
    if (!shopId || !pickupCode) {
      return res.status(400).json({ error: 'shopId et pickupCode requis.' });
    }

    const staffUserId = req.user?.id || 'usr_staff';
    const result = LogisticsService.verifyPickupCode(shopId, pickupCode, staffUserId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. INCIDENTS & RETURNS (CUSTOMER & ADMIN)
// ============================================================================

router.post('/customer/incidents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { globalOrderId, shopOrderId, shipmentId, shopId, type, description, customerNote } = req.body;

    if (!globalOrderId || !shopOrderId || !shopId || !type || !description) {
      return res.status(400).json({ error: 'Données d’incident incomplètes.' });
    }

    const incident = LogisticsService.reportIncident({
      globalOrderId,
      shopOrderId,
      shipmentId,
      shopId,
      customerId: customerId || 'usr_regular_user',
      customerEmail: req.user?.email || 'client@nexus.fr',
      type: type as DeliveryIncidentType,
      description,
      customerNote,
    });

    return res.status(201).json({ success: true, incident });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/incidents/:id/resolve', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = req.user?.id || 'usr_staff';
    const { resolutionNotes } = req.body;
    if (!resolutionNotes) return res.status(400).json({ error: 'Notes de résolution requises.' });

    const resolved = LogisticsService.resolveIncident(req.params.id, resolutionNotes, staffUserId);
    return res.json({ success: true, incident: resolved });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/customer/returns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = req.user?.id;
    const { orderId, shopOrderId, shopId, reason, items } = req.body;

    if (!orderId || !shopOrderId || !shopId || !reason || !items || items.length === 0) {
      return res.status(400).json({ error: 'Données de demande de retour incomplètes.' });
    }

    const ret = LogisticsService.requestReturn({
      orderId,
      shopOrderId,
      shopId,
      customerId: customerId || 'usr_regular_user',
      reason,
      items,
    });

    return res.status(201).json({ success: true, returnRequest: ret });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/returns/:id/status', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const staffUserId = req.user?.id || 'usr_staff';
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'Statut requis.' });

    const updated = LogisticsService.updateReturnStatus(
      req.params.id,
      status as ReturnRequestStatus,
      notes,
      staffUserId
    );

    return res.json({ success: true, returnRequest: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 6. ADMIN SUPERVISION LOGISTICS
// ============================================================================

router.get('/admin/overview', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = LogisticsService.getAdminLogisticsDashboard();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/carriers/:id', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const carriers = db.get('carriers') || [];
    const carrier = carriers.find((c) => c.id === req.params.id);
    if (!carrier) return res.status(404).json({ error: 'Transporteur introuvable.' });

    if (req.body.enabled !== undefined) carrier.enabled = req.body.enabled;
    if (req.body.supportedCountries) carrier.supportedCountries = req.body.supportedCountries;

    db.set('carriers', carriers);
    return res.json({ success: true, carrier });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
