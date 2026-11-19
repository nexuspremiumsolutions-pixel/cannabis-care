import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { verifyToken } from '../auth/auth';
import { CommunicationService } from '../services/communication/communicationService';
import { PreferenceService } from '../services/communication/preferenceService';
import { TemplateService } from '../services/communication/templateService';
import { CRMService } from '../services/communication/crmService';
import { WorkflowEngine } from '../services/communication/workflowEngine';
import { CommunicationAnalyticsService } from '../services/communication/communicationAnalyticsService';
import { DeliveryAdapters } from '../services/communication/deliveryAdapters';
import {
  NotificationCategory,
  NotificationChannel,
  NotificationEventType,
} from '../../src/types/entities';

export const communicationRouter = Router();

// Helper to resolve user ID from header, bearer token or demo patient fallback
function resolveUserId(req: Request): string {
  const headerUser = req.headers['x-user-id'] as string;
  if (headerUser) return headerUser;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.substring(7));
    if (decoded?.sub) return decoded.sub;
  }
  return 'usr_patient_demo';
}

// ==========================================
// 1. IN-APP NOTIFICATIONS (CENTRE DE NOTIFICATIONS)
// ==========================================

/**
 * GET /api/notifications
 * Returns paginated user notifications, category counts and unread count
 */
communicationRouter.get('/notifications', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const status = req.query.status as 'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED' | undefined;
    const category = req.query.category as NotificationCategory | undefined;
    const shopId = req.query.shopId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = CommunicationService.getUserNotifications(userId, {
      status,
      category,
      shopId,
      limit,
      offset,
    });

    res.json({
      success: true,
      items: result.items,
      total: result.total,
      unreadCount: result.unreadCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
communicationRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const notif = CommunicationService.markAsRead(req.params.id, userId);
    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification introuvable' });
    }
    res.json({ success: true, notification: notif });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
communicationRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const shopId = req.body.shopId as string | undefined;
    const updatedCount = CommunicationService.markAllAsRead(userId, shopId);
    res.json({ success: true, updatedCount });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/archive
 */
communicationRouter.patch('/notifications/:id/archive', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const archived = CommunicationService.archiveNotification(req.params.id, userId);
    res.json({ success: archived });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id
 */
communicationRouter.delete('/notifications/:id', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const deleted = CommunicationService.deleteNotification(req.params.id, userId);
    res.json({ success: deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/:id/click
 * Records interaction on a notification deepLink
 */
communicationRouter.post('/notifications/:id/click', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const channel = (req.body.channel as NotificationChannel) || 'IN_APP';
    CommunicationService.recordInteraction(req.params.id, userId, channel);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. PRÉFÉRENCES & CONSENTEMENTS RGPD
// ==========================================

/**
 * GET /api/communication/preferences
 */
communicationRouter.get('/preferences', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || resolveUserId(req);
    const preferences = PreferenceService.getUserPreferences(userId);
    const consents = PreferenceService.getUserConsents(userId);
    res.json({ success: true, preferences, consents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/communication/preferences
 */
communicationRouter.put('/preferences', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const updated = PreferenceService.updateUserPreferences(userId, req.body);
    res.json({ success: true, preferences: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/communication/consent
 * Record or withdraw explicit consent
 */
communicationRouter.post('/consent', (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { purpose, channel, granted, source } = req.body;

    if (!purpose || !channel) {
      return res.status(400).json({ success: false, error: 'Champs purpose et channel obligatoires' });
    }

    if (granted) {
      const record = PreferenceService.recordConsent({
        userId,
        purpose,
        channel,
        granted: true,
        source: source || 'SETTINGS',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      res.json({ success: true, record });
    } else {
      const withdrawn = PreferenceService.withdrawConsent(userId, purpose);
      res.json({ success: true, withdrawn });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. TEMPLATES MULTILINGUES
// ==========================================

/**
 * GET /api/communication/templates
 */
communicationRouter.get('/templates', (_req: Request, res: Response) => {
  try {
    const templates = TemplateService.getAllTemplates();
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/communication/templates
 */
communicationRouter.post('/templates', (req: Request, res: Response) => {
  try {
    const template = TemplateService.createTemplate(req.body);
    res.status(201).json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/communication/templates/:id
 */
communicationRouter.put('/templates/:id', (req: Request, res: Response) => {
  try {
    const updated = TemplateService.updateTemplate(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Template non trouvé' });
    }
    res.json({ success: true, template: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. WORKFLOWS & AUTOMATIONS
// ==========================================

/**
 * GET /api/communication/workflows
 */
communicationRouter.get('/workflows', (_req: Request, res: Response) => {
  try {
    const workflows = WorkflowEngine.getAllWorkflows();
    res.json({ success: true, workflows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/communication/events/trigger
 * Dispatches an event and executes matching automation workflows
 */
communicationRouter.post('/events/trigger', async (req: Request, res: Response) => {
  try {
    const { eventType, userId, payload, shopId, idempotencyKey } = req.body;
    const targetUserId = userId || resolveUserId(req);

    if (!eventType) {
      return res.status(400).json({ success: false, error: 'eventType obligatoire' });
    }

    const result = await WorkflowEngine.triggerEvent(
      eventType as NotificationEventType,
      targetUserId,
      payload || {},
      shopId,
      idempotencyKey
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. CRM & SEGMENTATION (SANS DONNÉES DE SANTÉ)
// ==========================================

/**
 * GET /api/communication/crm/profiles
 */
communicationRouter.get('/crm/profiles', (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const lifecycleStage = req.query.lifecycleStage as any;
    const shopId = req.query.shopId as string | undefined;

    const profiles = CRMService.getAllProfiles({ search, lifecycleStage, shopId });
    res.json({ success: true, count: profiles.length, profiles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/communication/crm/profiles/:userId
 */
communicationRouter.get('/crm/profiles/:userId', (req: Request, res: Response) => {
  try {
    const profile = CRMService.getProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profil CRM introuvable' });
    }
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/communication/crm/segments
 */
communicationRouter.get('/crm/segments', (req: Request, res: Response) => {
  try {
    const ownerId = (req.query.ownerId as string) || 'PLATFORM';
    const segments = CRMService.getAllSegments(ownerId);
    res.json({ success: true, segments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/communication/crm/segments
 */
communicationRouter.post('/crm/segments', (req: Request, res: Response) => {
  try {
    const segment = CRMService.createSegment(req.body);
    res.status(201).json({ success: true, segment });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. FOURNISSEURS & DÉLIVRABILITÉ
// ==========================================

/**
 * GET /api/communication/providers
 * Real connection statuses without simulated fakes
 */
communicationRouter.get('/providers', (_req: Request, res: Response) => {
  try {
    const providers = DeliveryAdapters.getProvidersStatus();
    res.json({ success: true, providers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/communication/test-email
 * Sends a test transactional email via the configured provider (Resend / SendGrid / SMTP)
 */
communicationRouter.post('/test-email', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentification requise.' });
    }
    const decoded = verifyToken(authHeader.substring(7));
    if (!decoded?.sub) {
      return res.status(401).json({ success: false, error: 'Jeton invalide.' });
    }

    const recipient = (req.body?.to as string)?.trim() || decoded.email;
    const result = await DeliveryAdapters.deliver('EMAIL', {
      notificationId: `test_email_${Date.now()}`,
      userId: decoded.sub,
      recipientAddress: recipient,
      subject: 'CANNABIS CARE — Test e-mail transactionnel réussi',
      title: 'Test de messagerie CANNABIS CARE',
      body: 'Cet e-mail confirme que le connecteur transactionnel CANNABIS CARE est bien actif et opérationnel.',
    });

    const httpCode = result.status === 'DELIVERED' ? 200 : 400;
    return res.status(httpCode).json({ success: result.status === 'DELIVERED', result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/communication/analytics
 */
communicationRouter.get('/analytics', (req: Request, res: Response) => {
  try {
    const shopId = req.query.shopId as string | undefined;
    const analytics = CommunicationAnalyticsService.getOverview(shopId);
    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
