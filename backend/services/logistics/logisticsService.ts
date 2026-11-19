import { db } from '../../db/database';
import {
  ShippingAddress,
  OrderShippingAddressSnapshot,
  DeliveryOption,
  DeliveryMethod,
  Shipment,
  ShipmentItem,
  ShipmentStatus,
  TrackingEvent,
  PickupLocation,
  PickupSlot,
  PickupConfirmation,
  DeliveryIncident,
  DeliveryIncidentType,
  DeliveryIncidentStatus,
  ReturnRequest,
  ReturnRequestStatus,
  Carrier,
  ShopOrder,
  MarketplaceOrderItem,
} from '../../../src/types/entities';
import { CarrierAdapterRegistry } from './carrierAdapter';
import { DeliveryEstimateService } from './deliveryEstimateService';

export class LogisticsService {
  // ==========================================================================
  // CUSTOMER SAVED ADDRESSES
  // ==========================================================================

  public static getShippingAddresses(userId: string): ShippingAddress[] {
    const all = db.get('shippingAddresses') || [];
    return all.filter((a) => a.userId === userId);
  }

  public static createShippingAddress(
    userId: string,
    data: Omit<ShippingAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): ShippingAddress {
    const existing = db.get('shippingAddresses') || [];
    const isFirst = existing.filter((a) => a.userId === userId).length === 0;

    const newAddress: ShippingAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      postalCode: data.postalCode,
      city: data.city,
      region: data.region,
      country: data.country || 'France',
      phone: data.phone,
      instructions: data.instructions,
      isDefault: data.isDefault !== undefined ? data.isDefault : isFirst,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (newAddress.isDefault) {
      // Unset previous defaults
      existing.forEach((a) => {
        if (a.userId === userId) a.isDefault = false;
      });
    }

    existing.unshift(newAddress);
    db.set('shippingAddresses', existing);

    db.logAudit('CREATE_SHIPPING_ADDRESS', `address:${newAddress.id}`, userId, {
      postalCode: newAddress.postalCode,
      city: newAddress.city,
    });

    return newAddress;
  }

  public static updateShippingAddress(
    userId: string,
    addressId: string,
    data: Partial<ShippingAddress>
  ): ShippingAddress {
    const existing = db.get('shippingAddresses') || [];
    const index = existing.findIndex((a) => a.id === addressId && a.userId === userId);
    if (index === -1) {
      throw new Error('Adresse de livraison introuvable.');
    }

    if (data.isDefault) {
      existing.forEach((a) => {
        if (a.userId === userId) a.isDefault = false;
      });
    }

    const updated: ShippingAddress = {
      ...existing[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    existing[index] = updated;
    db.set('shippingAddresses', existing);
    return updated;
  }

  public static deleteShippingAddress(userId: string, addressId: string): boolean {
    const existing = db.get('shippingAddresses') || [];
    const filtered = existing.filter((a) => !(a.id === addressId && a.userId === userId));
    if (filtered.length === existing.length) return false;

    db.set('shippingAddresses', filtered);
    return true;
  }

  // ==========================================================================
  // DELIVERY OPTIONS & SHIPPING RATES CALCULATION
  // ==========================================================================

  public static getDeliveryOptionsForShop(shopId: string, country = 'France'): DeliveryOption[] {
    const options = db.get('deliveryOptions') || [];
    return options.filter(
      (opt) =>
        opt.shopId === shopId &&
        opt.enabled &&
        (opt.availableCountries.length === 0 || opt.availableCountries.includes(country))
    );
  }

  public static calculateShippingPrice(
    shopId: string,
    country: string,
    subtotal: number,
    optionId?: string
  ): { price: number; freeShippingApplied: boolean; optionName: string; currency: string } {
    const options = this.getDeliveryOptionsForShop(shopId, country);
    const selectedOption = options.find((o) => o.id === optionId) || options[0];

    if (!selectedOption) {
      return { price: 4.90, freeShippingApplied: false, optionName: 'Colissimo Standard', currency: 'EUR' };
    }

    // Check free shipping rules
    const rules = db.get('freeShippingRules') || [];
    const matchingRule = rules.find(
      (r) =>
        r.shopId === shopId &&
        r.enabled &&
        r.deliveryMethod === selectedOption.type &&
        (!r.country || r.country === country) &&
        subtotal >= r.minimumOrderAmount
    );

    if (matchingRule || selectedOption.type === 'PICKUP_IN_STORE' || selectedOption.type === 'CLICK_AND_COLLECT') {
      return {
        price: 0,
        freeShippingApplied: true,
        optionName: selectedOption.name,
        currency: selectedOption.currency || 'EUR',
      };
    }

    return {
      price: selectedOption.price,
      freeShippingApplied: false,
      optionName: selectedOption.name,
      currency: selectedOption.currency || 'EUR',
    };
  }

  // ==========================================================================
  // CLICK & COLLECT / PICKUP
  // ==========================================================================

  public static getPickupLocationsAndSlots(shopId: string) {
    const locations = (db.get('pickupLocations') || []).filter((l) => l.shopId === shopId && l.enabled);
    const slots = (db.get('pickupSlots') || []).filter((s) => s.shopId === shopId && s.enabled);
    return { locations, slots };
  }

  public static verifyPickupCode(
    shopId: string,
    pickupCode: string,
    staffUserId: string
  ): { success: boolean; pickupConfirmation?: PickupConfirmation; shopOrder?: ShopOrder; error?: string } {
    const cleanCode = pickupCode.trim().toUpperCase();
    const confirmations = db.get('pickupConfirmations') || [];
    const match = confirmations.find((c) => c.pickupCode.toUpperCase() === cleanCode);

    if (!match) {
      return { success: false, error: 'Code de retrait invalide ou introuvable.' };
    }

    const shopOrders = db.get('shopOrders') || [];
    const shopOrder = shopOrders.find((so) => so.id === match.shopOrderId);

    if (!shopOrder) {
      return { success: false, error: 'Commande associée introuvable.' };
    }

    if (shopOrder.shopId !== shopId) {
      return {
        success: false,
        error: `Ce code correspond à la boutique "${shopOrder.shopNameSnapshot}" et ne peut être validé ici.`,
      };
    }

    if (match.pickedUpAt) {
      return {
        success: false,
        error: `Ce retrait a déjà été validé le ${new Date(match.pickedUpAt).toLocaleString('fr-FR')}.`,
      };
    }

    // Confirm pickup
    const nowIso = new Date().toISOString();
    match.pickedUpAt = nowIso;
    match.pickedUpBy = staffUserId;
    match.confirmationMethod = 'CODE';
    db.set('pickupConfirmations', confirmations);

    // Update shop order status to DELIVERED / COMPLETED
    shopOrder.status = 'DELIVERED';
    shopOrder.updatedAt = nowIso;
    shopOrder.statusTimeline.push({
      status: 'DELIVERED',
      timestamp: nowIso,
      note: `Commande remise au client en boutique via validation du code ${cleanCode}.`,
      author: `Boutique Staff (${staffUserId})`,
    });
    db.set('shopOrders', shopOrders);

    // Update corresponding shipment if exists
    const shipments = db.get('shipments') || [];
    const shipment = shipments.find((s) => s.shopOrderId === shopOrder.id);
    if (shipment) {
      shipment.status = 'PICKED_UP';
      shipment.deliveredAt = nowIso;
      shipment.updatedAt = nowIso;
      db.set('shipments', shipments);

      const events = db.get('trackingEvents') || [];
      events.unshift({
        id: `trke_${Date.now()}`,
        shipmentId: shipment.id,
        status: 'PICKED_UP',
        description: 'Colis remis en main propre au client après validation du code secret.',
        location: shopOrder.shopNameSnapshot,
        eventDate: nowIso,
        source: 'MANUAL_SHOP',
        createdAt: nowIso,
      });
      db.set('trackingEvents', events);
    }

    db.logAudit('VERIFY_PICKUP_SUCCESS', `shopOrder:${shopOrder.id}`, staffUserId, {
      code: cleanCode,
      shopId,
    });

    return {
      success: true,
      pickupConfirmation: match,
      shopOrder,
    };
  }

  // ==========================================================================
  // INITIAL SHIPMENT & TRACKING INITIALIZATION (CALLED DURING DISPATCH)
  // ==========================================================================

  public static initializeShipmentForShopOrder(
    shopOrder: ShopOrder,
    items: MarketplaceOrderItem[],
    fulfillmentMethod: 'DELIVERY' | 'PICKUP',
    shippingAddress?: OrderShippingAddressSnapshot
  ): Shipment {
    const isPickup = fulfillmentMethod === 'PICKUP';
    const shipmentId = `shpm_${shopOrder.id}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const shipmentItems: ShipmentItem[] = items.map((it) => ({
      id: `shpm_item_${it.id}`,
      shipmentId,
      orderItemId: it.id,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      weightKg: 0.15,
    }));

    let trackingNumber: string | undefined;
    let trackingUrl: string | undefined;
    let carrierName: string | undefined;
    let carrierId: string | undefined;

    if (isPickup) {
      carrierName = 'Retrait Comptoir Boutique';
      // Create pickup confirmation code
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const pickupCode = `NX-${random4}`;

      const confirmations = db.get('pickupConfirmations') || [];
      confirmations.unshift({
        id: `pconf_${shopOrder.id}`,
        shopOrderId: shopOrder.id,
        shipmentId,
        pickupCode,
        qrCodeReference: `NEXUS-PICKUP-${shopOrder.id}-${random4}`,
        createdAt: nowIso,
      });
      db.set('pickupConfirmations', confirmations);
    } else {
      carrierId = 'carrier_colissimo';
      carrierName = 'Colissimo (La Poste)';
      const random9 = Math.floor(100000000 + Math.random() * 900000000);
      trackingNumber = `6A${random9}FR`;
      trackingUrl = `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`;
    }

    const estimate = DeliveryEstimateService.calculateEstimate({
      transitMinDays: isPickup ? 0 : 2,
      transitMaxDays: isPickup ? 0 : 3,
      processingDays: 1,
      cutoffTime: '14:00',
    });

    const newShipment: Shipment = {
      id: shipmentId,
      globalOrderId: shopOrder.globalOrderId,
      shopOrderId: shopOrder.id,
      shopId: shopOrder.shopId,
      carrierId,
      carrierName,
      deliveryMethod: isPickup ? 'CLICK_AND_COLLECT' : 'HOME_DELIVERY',
      status: isPickup ? 'READY_FOR_PROCESSING' : 'CREATED',
      trackingNumber,
      trackingUrl,
      labelUrl: `/api/logistics/shipments/${shipmentId}/label.pdf`,
      shippingCost: shopOrder.deliveryFee,
      currency: 'EUR',
      estimatedDeliveryDate: estimate.maxDeliveryDate,
      items: shipmentItems,
      weightKg: shipmentItems.reduce((sum, i) => sum + (i.weightKg || 0.1), 0),
      packingNotes: isPickup
        ? 'Commande préparée pour retrait physique au comptoir agréé.'
        : 'Emballage éco-responsable certifié discret.',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const shipments = db.get('shipments') || [];
    shipments.unshift(newShipment);
    db.set('shipments', shipments);

    // Initial Tracking Event
    const events = db.get('trackingEvents') || [];
    events.unshift({
      id: `trke_${Date.now()}`,
      shipmentId: newShipment.id,
      status: newShipment.status,
      description: isPickup
        ? 'Ordre de préparation transmis à l’équipe boutique.'
        : 'Prise en charge logistique initialisée sur la plateforme Nexus.',
      location: shopOrder.shopNameSnapshot,
      eventDate: nowIso,
      source: 'SYSTEM',
      createdAt: nowIso,
    });
    db.set('trackingEvents', events);

    return newShipment;
  }

  // ==========================================================================
  // SHIPMENT STATUS PROGRESSION & PACKING
  // ==========================================================================

  public static updateShipmentStatus(
    shipmentId: string,
    status: ShipmentStatus,
    actor: { id: string; role: string },
    details?: {
      trackingNumber?: string;
      carrierName?: string;
      note?: string;
      location?: string;
      weightKg?: number;
      dimensions?: { lengthCm?: number; widthCm?: number; heightCm?: number };
    }
  ): { shipment: Shipment; trackingEvent: TrackingEvent } {
    const shipments = db.get('shipments') || [];
    const shipment = shipments.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Expédition introuvable.');

    const nowIso = new Date().toISOString();
    shipment.status = status;
    shipment.updatedAt = nowIso;

    if (details?.trackingNumber) {
      shipment.trackingNumber = details.trackingNumber;
      shipment.trackingUrl = `https://www.laposte.fr/outils/suivre-vos-envois?code=${details.trackingNumber}`;
    }
    if (details?.carrierName) shipment.carrierName = details.carrierName;
    if (details?.weightKg) shipment.weightKg = details.weightKg;
    if (details?.dimensions) shipment.parcelDimensions = details.dimensions;

    if (status === 'SHIPPED') {
      shipment.shippedAt = nowIso;
    } else if (status === 'DELIVERED' || status === 'PICKED_UP') {
      shipment.deliveredAt = nowIso;
    }

    db.set('shipments', shipments);

    // Add Tracking Event
    const events = db.get('trackingEvents') || [];
    const trackingEvent: TrackingEvent = {
      id: `trke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shipmentId,
      status,
      description: details?.note || `Statut mis à jour vers: ${status}`,
      location: details?.location || 'Atelier Boutique',
      eventDate: nowIso,
      source: actor.role === 'ADMIN' ? 'SYSTEM' : 'MANUAL_SHOP',
      createdAt: nowIso,
    };
    events.unshift(trackingEvent);
    db.set('trackingEvents', events);

    // Synchronize parent ShopOrder status
    const shopOrders = db.get('shopOrders') || [];
    const shopOrder = shopOrders.find((so) => so.id === shipment.shopOrderId);
    if (shopOrder) {
      if (status === 'SHIPPED') {
        shopOrder.status = 'SHIPPED';
        shopOrder.trackingNumber = shipment.trackingNumber;
        shopOrder.carrierName = shipment.carrierName;
      } else if (status === 'DELIVERED') {
        shopOrder.status = 'DELIVERED';
      } else if (status === 'PROCESSING') {
        shopOrder.status = 'PROCESSING';
      } else if (status === 'READY_TO_SHIP' || status === 'READY_FOR_PICKUP') {
        shopOrder.status = 'READY';
      }
      shopOrder.updatedAt = nowIso;
      shopOrder.statusTimeline.push({
        status: shopOrder.status,
        timestamp: nowIso,
        note: details?.note || `Événement colis: ${status}`,
        author: actor.role === 'ADMIN' ? 'Plateforme Nexus' : shopOrder.shopNameSnapshot,
      });
      db.set('shopOrders', shopOrders);
    }

    db.logAudit('UPDATE_SHIPMENT_STATUS', `shipment:${shipmentId}`, actor.id, {
      status,
      trackingNumber: shipment.trackingNumber,
    });

    return { shipment, trackingEvent };
  }

  // ==========================================================================
  // INCIDENTS & DISPUTES REPORTING
  // ==========================================================================

  public static reportIncident(data: {
    globalOrderId: string;
    shopOrderId: string;
    shipmentId?: string;
    shopId: string;
    customerId: string;
    customerEmail?: string;
    type: DeliveryIncidentType;
    description: string;
    customerNote?: string;
  }): DeliveryIncident {
    const existing = db.get('deliveryIncidents') || [];
    const count = existing.length + 1;
    const incidentNumber = `#INC-2026-${String(count).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const incident: DeliveryIncident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      incidentNumber,
      globalOrderId: data.globalOrderId,
      shopOrderId: data.shopOrderId,
      shipmentId: data.shipmentId,
      shopId: data.shopId,
      customerId: data.customerId,
      customerEmail: data.customerEmail,
      type: data.type,
      status: 'OPEN',
      description: data.description,
      customerNote: data.customerNote,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    existing.unshift(incident);
    db.set('deliveryIncidents', existing);

    db.logAudit('REPORT_DELIVERY_INCIDENT', `incident:${incident.id}`, data.customerId, {
      incidentNumber,
      type: data.type,
      shopId: data.shopId,
    });

    return incident;
  }

  public static resolveIncident(
    incidentId: string,
    resolutionNotes: string,
    staffUserId: string
  ): DeliveryIncident {
    const existing = db.get('deliveryIncidents') || [];
    const match = existing.find((i) => i.id === incidentId);
    if (!match) throw new Error('Incident introuvable.');

    const nowIso = new Date().toISOString();
    match.status = 'RESOLVED';
    match.resolutionNotes = resolutionNotes;
    match.resolvedAt = nowIso;
    match.updatedAt = nowIso;

    db.set('deliveryIncidents', existing);

    db.logAudit('RESOLVE_DELIVERY_INCIDENT', `incident:${incidentId}`, staffUserId, {
      resolutionNotes,
    });

    return match;
  }

  // ==========================================================================
  // RETURNS MANAGEMENT
  // ==========================================================================

  public static requestReturn(data: {
    orderId: string;
    shopOrderId: string;
    shopId: string;
    customerId: string;
    reason: string;
    items: { productId: string; productName: string; quantity: number; reason?: string }[];
  }): ReturnRequest {
    const existing = db.get('returnRequests') || [];
    const count = existing.length + 1;
    const returnNumber = `#RET-2026-${String(count).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const ret: ReturnRequest = {
      id: `ret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      returnNumber,
      orderId: data.orderId,
      shopOrderId: data.shopOrderId,
      shopId: data.shopId,
      customerId: data.customerId,
      reason: data.reason,
      status: 'REQUESTED',
      items: data.items,
      requestedAt: nowIso,
    };

    existing.unshift(ret);
    db.set('returnRequests', existing);

    db.logAudit('REQUEST_RETURN', `return:${ret.id}`, data.customerId, {
      returnNumber,
      shopId: data.shopId,
      itemsCount: data.items.length,
    });

    return ret;
  }

  public static updateReturnStatus(
    returnId: string,
    status: ReturnRequestStatus,
    notes?: string,
    staffUserId?: string
  ): ReturnRequest {
    const existing = db.get('returnRequests') || [];
    const match = existing.find((r) => r.id === returnId);
    if (!match) throw new Error('Demande de retour introuvable.');

    const nowIso = new Date().toISOString();
    match.status = status;

    if (status === 'APPROVED') {
      match.approvedAt = nowIso;
      match.returnTrackingNumber = `RET-NX-${Math.floor(100000 + Math.random() * 900000)}`;
      match.returnCarrier = 'Colissimo Retour';
    } else if (status === 'RECEIVED') {
      match.receivedAt = nowIso;
    } else if (status === 'COMPLETED') {
      match.completedAt = nowIso;
    }

    if (notes) {
      match.adminNotes = notes;
    }

    db.set('returnRequests', existing);

    db.logAudit('UPDATE_RETURN_STATUS', `return:${returnId}`, staffUserId || 'system', {
      status,
      notes,
    });

    return match;
  }

  // ==========================================================================
  // DASHBOARDS: PARTNER & ADMIN
  // ==========================================================================

  public static getPartnerLogisticsDashboard(shopId: string) {
    const shipments = (db.get('shipments') || []).filter((s) => s.shopId === shopId);
    const shopOrders = (db.get('shopOrders') || []).filter((so) => so.shopId === shopId);
    const incidents = (db.get('deliveryIncidents') || []).filter((i) => i.shopId === shopId);
    const returns = (db.get('returnRequests') || []).filter((r) => r.shopId === shopId);
    const pickupConfirmations = db.get('pickupConfirmations') || [];

    // Pending pickup orders
    const pendingPickups = shopOrders
      .filter((so) => so.fulfillmentMethod === 'PICKUP' && so.status !== 'DELIVERED')
      .map((so) => {
        const conf = pickupConfirmations.find((c) => c.shopOrderId === so.id);
        return {
          ...so,
          pickupCode: conf?.pickupCode || 'NX-PENDING',
          isPickedUp: !!conf?.pickedUpAt,
        };
      });

    return {
      kpis: {
        totalShipments: shipments.length,
        readyToShip: shipments.filter((s) => s.status === 'READY_TO_SHIP').length,
        inTransit: shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'SHIPPED').length,
        delivered: shipments.filter((s) => s.status === 'DELIVERED' || s.status === 'PICKED_UP').length,
        pendingPickupsCount: pendingPickups.length,
        openIncidentsCount: incidents.filter((i) => i.status === 'OPEN').length,
        activeReturnsCount: returns.filter((r) => r.status === 'REQUESTED' || r.status === 'IN_TRANSIT').length,
      },
      shipments,
      pendingPickups,
      incidents,
      returns,
    };
  }

  public static getAdminLogisticsDashboard() {
    const shipments = db.get('shipments') || [];
    const carriers = db.get('carriers') || [];
    const incidents = db.get('deliveryIncidents') || [];
    const returns = db.get('returnRequests') || [];
    const pickupConfirmations = db.get('pickupConfirmations') || [];
    const deliveryZones = db.get('deliveryZones') || [];

    return {
      kpis: {
        totalShipments: shipments.length,
        activeCarriers: carriers.filter((c) => c.enabled).length,
        inTransit: shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'SHIPPED').length,
        delivered: shipments.filter((s) => s.status === 'DELIVERED' || s.status === 'PICKED_UP').length,
        openIncidents: incidents.filter((i) => i.status === 'OPEN' || i.status === 'UNDER_REVIEW').length,
        activeReturns: returns.filter((r) => r.status === 'REQUESTED' || r.status === 'IN_TRANSIT').length,
      },
      carriers,
      deliveryZones,
      shipments: shipments.slice(0, 50),
      incidents,
      returns,
    };
  }
}
