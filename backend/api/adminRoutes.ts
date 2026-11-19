import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth/auth';
import { UserRole, AnalyticsEvent, SearchEvent } from '../../src/types/entities';
import { AnalyticsEngine } from '../services/admin/analyticsEngine';
import { MonitoringService } from '../services/admin/monitoringService';
import { SupportService } from '../services/admin/supportService';
import { AuditService } from '../services/admin/auditService';
import { ExportService } from '../services/admin/exportService';

const router = Router();

// ============================================================================
// 1. PUBLIC / INGESTION EVENT TRACKING ENDPOINTS (NO ADMIN AUTH REQUIRED)
// ============================================================================

/**
 * Track client analytics event (e.g. app open, product view, add to cart, etc.)
 */
router.post('/events/track', (req: Request, res: Response) => {
  try {
    const {
      eventName,
      userId,
      anonymousSessionId,
      shopId,
      entityType,
      entityId,
      metadata,
      country,
      locale,
      source,
    } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required.' });
    }

    const events = db.get('analyticsEvents') || [];
    const newEvent: AnalyticsEvent = {
      id: `aevt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventName,
      userId: userId || null,
      anonymousSessionId: anonymousSessionId || null,
      shopId: shopId || null,
      entityType: entityType || 'GENERAL',
      entityId: entityId || undefined,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      country: country || 'FR',
      locale: locale || 'fr',
      source: source || 'WEB_APP',
    };

    events.unshift(newEvent);
    // Keep max 5000 recent events in memory
    if (events.length > 5000) {
      events.pop();
    }
    db.save();

    return res.status(201).json({ success: true, eventId: newEvent.id });
  } catch (err: any) {
    console.error('Error tracking analytics event:', err);
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’événement.' });
  }
});

/**
 * Track catalog search event
 */
router.post('/events/search', (req: Request, res: Response) => {
  try {
    const {
      query,
      userId,
      anonymousSessionId,
      filters,
      resultCount,
      selectedResult,
      convertedToCart,
      convertedToOrder,
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required.' });
    }

    const searchEvents = db.get('searchEvents') || [];
    const newSearchEvent: SearchEvent = {
      id: `srch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      query: query.trim(),
      userId: userId || null,
      anonymousSessionId: anonymousSessionId || null,
      filters: filters || {},
      resultCount: typeof resultCount === 'number' ? resultCount : 0,
      selectedResult: selectedResult || null,
      convertedToCart: Boolean(convertedToCart),
      convertedToOrder: Boolean(convertedToOrder),
      timestamp: new Date().toISOString(),
    };

    searchEvents.unshift(newSearchEvent);
    if (searchEvents.length > 5000) {
      searchEvents.pop();
    }
    db.save();

    return res.status(201).json({ success: true, searchId: newSearchEvent.id });
  } catch (err: any) {
    console.error('Error recording search event:', err);
    return res.status(500).json({ error: 'Erreur enregistrement recherche.' });
  }
});

// ============================================================================
// 2. STRICT ADMIN AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================

router.use(requireAuth);
router.use(
  requireRole(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.PLATFORM_ADMIN,
    UserRole.MODERATOR
  )
);

// Audit helper for administrative actions
const auditAdmin = (req: AuthenticatedRequest, action: string, entityType: string, entityId: string, before?: any, after?: any) => {
  try {
    AuditService.logAction({
      adminId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@nexus.fr',
      action,
      entityType,
      entityId,
      before,
      after,
      ip: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] as string,
    });
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
};

// ============================================================================
// 3. EXECUTIVE & GLOBAL ANALYTICS DASHBOARD
// ============================================================================

/**
 * Global Executive Dashboard KPIs, Funnel, Time Series & Summary
 */
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      period: (req.query.period as any) || '30d',
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      country: req.query.country as string,
      shopId: req.query.shopId as string,
    };

    const kpis = AnalyticsEngine.getGlobalKPISummary(filters);
    const funnel = AnalyticsEngine.getConversionFunnel(filters);
    const timeSeries = AnalyticsEngine.getTimeSeries(filters);
    const executive = AnalyticsEngine.getExecutiveOverview(filters);

    return res.json({
      success: true,
      filters,
      kpis,
      funnel,
      timeSeries,
      executive,
    });
  } catch (err: any) {
    console.error('Error retrieving admin dashboard:', err);
    return res.status(500).json({ error: 'Erreur lors de la génération du tableau de bord.' });
  }
});

/**
 * Granular Users Analytics (Growth, Retention, Churn, DAU/WAU/MAU)
 */
router.get('/analytics/users', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      period: (req.query.period as any) || '30d',
      country: req.query.country as string,
    };
    const kpis = AnalyticsEngine.getGlobalKPISummary(filters);
    const funnel = AnalyticsEngine.getConversionFunnel(filters);
    const timeSeries = AnalyticsEngine.getTimeSeries(filters);

    return res.json({
      success: true,
      usersKpis: kpis.users,
      funnel,
      activitySeries: timeSeries.map((t) => ({
        date: t.date,
        label: t.label,
        activeUsers: t.activeUsers,
        newUsers: t.newUsers,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur récupération analytics utilisateurs.' });
  }
});

/**
 * Conversion Funnel Endpoint
 */
router.get('/analytics/funnel', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      period: (req.query.period as any) || '30d',
      country: req.query.country as string,
    };
    const funnel = AnalyticsEngine.getConversionFunnel(filters);
    return res.json({ success: true, funnel });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur entonnoir de conversion.' });
  }
});

/**
 * Marketplace & Financial Ledger Analytics
 */
router.get('/analytics/marketplace', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      period: (req.query.period as any) || '30d',
      country: req.query.country as string,
      shopId: req.query.shopId as string,
    };

    const kpis = AnalyticsEngine.getGlobalKPISummary(filters);
    const shops = AnalyticsEngine.getShopsAnalytics(filters);
    const timeSeries = AnalyticsEngine.getTimeSeries(filters);

    return res.json({
      success: true,
      marketplaceKpis: kpis.marketplace,
      financeKpis: kpis.finance,
      shops,
      salesSeries: timeSeries.map((t) => ({
        date: t.date,
        label: t.label,
        gmv: t.gmv,
        orders: t.orders,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics marketplace.' });
  }
});

/**
 * All Shops Performance Overview
 */
router.get('/analytics/shops', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      period: (req.query.period as any) || '30d',
      country: req.query.country as string,
    };
    const shops = AnalyticsEngine.getShopsAnalytics(filters);
    return res.json({ success: true, shops });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics boutiques.' });
  }
});

/**
 * Detailed Analytics for Single Shop
 */
router.get('/analytics/shops/:shopId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId } = req.params;
    const filters = { period: (req.query.period as any) || '30d' };
    const shopAnalytics = AnalyticsEngine.getSingleShopAnalytics(shopId, filters);

    if (!shopAnalytics) {
      return res.status(404).json({ error: 'Boutique introuvable.' });
    }

    return res.json({ success: true, shopAnalytics });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics boutique détaillée.' });
  }
});

/**
 * Products Analytics & Inventory Alerts
 */
router.get('/analytics/products', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      period: (req.query.period as any) || '30d',
      category: req.query.category as string,
    };
    const products = AnalyticsEngine.getProductsAnalytics(filters);
    return res.json({ success: true, products });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics produits.' });
  }
});

/**
 * Search Analytics
 */
router.get('/analytics/search', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const searchData = AnalyticsEngine.getSearchAnalytics(filters);
    return res.json({ success: true, searchData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics recherche.' });
  }
});

/**
 * Subscriptions & Recurring MRR Analytics
 */
router.get('/analytics/subscriptions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const subsData = AnalyticsEngine.getSubscriptionsAnalytics(filters);
    return res.json({ success: true, subsData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics abonnements.' });
  }
});

/**
 * Marketing & Promotions Analytics (Module 15)
 */
router.get('/analytics/marketing', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const marketingData = AnalyticsEngine.getMarketingAnalytics(filters);
    return res.json({ success: true, marketingData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics marketing.' });
  }
});

/**
 * Communication & Notifications Analytics (Module 16)
 */
router.get('/analytics/communication', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const communicationData = AnalyticsEngine.getCommunicationAnalytics(filters);
    return res.json({ success: true, communicationData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics communication.' });
  }
});

/**
 * Loyalty & Rewards Analytics (Module 12)
 */
router.get('/analytics/loyalty', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const loyaltyData = AnalyticsEngine.getLoyaltyAnalytics(filters);
    return res.json({ success: true, loyaltyData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics fidélité.' });
  }
});

/**
 * Aggregated Education & Wellness Analytics (Privacy Guaranteed)
 */
router.get('/analytics/education', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const educationData = AnalyticsEngine.getEducationWellnessAnalytics(filters);
    return res.json({ success: true, educationData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics éducation.' });
  }
});

/**
 * AI Assistant Technical Metrics (Privacy Guaranteed)
 */
router.get('/analytics/ai', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const aiData = AnalyticsEngine.getAITechnicalMetrics(filters);
    return res.json({ success: true, aiData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur métriques techniques IA.' });
  }
});

/**
 * Geographic Analytics (FR, LU, BE, CH, DE, ES, IT)
 */
router.get('/analytics/geo', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const geoData = AnalyticsEngine.getGeoAnalytics(filters);
    return res.json({ success: true, geoData });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur analytics géographiques.' });
  }
});

/**
 * Executive C-Level Overview
 */
router.get('/analytics/executive', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = { period: (req.query.period as any) || '30d' };
    const executive = AnalyticsEngine.getExecutiveOverview(filters);
    return res.json({ success: true, executive });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur vue exécutive.' });
  }
});

// ============================================================================
// 4. SUPERVISION, SYSTEM HEALTH & ALERT MANAGEMENT
// ============================================================================

/**
 * System Monitoring & Health Check
 */
router.get('/monitoring', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const health = MonitoringService.getSystemHealth();
    const alerts = MonitoringService.getAlerts();
    const jobs = MonitoringService.getBackgroundJobs();

    return res.json({
      success: true,
      health,
      alerts,
      jobs,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur supervision système.' });
  }
});

/**
 * Acknowledge or Resolve an Administrative Alert
 */
router.patch('/alerts/:alertId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const { action } = req.body; // 'ACKNOWLEDGE' | 'RESOLVE'
    const adminName = req.user?.email || 'Administrateur Nexus';

    let updatedAlert;
    if (action === 'RESOLVE') {
      updatedAlert = MonitoringService.resolveAlert(alertId, adminName);
      auditAdmin(req, 'RESOLVE_ALERT', 'ADMIN_ALERT', alertId, null, { status: 'RESOLVED' });
    } else {
      updatedAlert = MonitoringService.acknowledgeAlert(alertId, adminName);
      auditAdmin(req, 'ACKNOWLEDGE_ALERT', 'ADMIN_ALERT', alertId, null, { status: 'ACKNOWLEDGED' });
    }

    if (!updatedAlert) {
      return res.status(404).json({ error: 'Alerte introuvable.' });
    }

    return res.json({ success: true, alert: updatedAlert });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur mise à jour alerte.' });
  }
});

/**
 * Create Custom Administrative Alert
 */
router.post('/alerts', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, severity, source, title, message, threshold } = req.body;
    if (!type || !severity || !title || !message) {
      return res.status(400).json({ error: 'Champs requis manquants.' });
    }

    const newAlert = MonitoringService.createAlert({
      type,
      severity,
      source: source || 'Administration Nexus',
      title,
      message,
      threshold,
    });

    auditAdmin(req, 'CREATE_ALERT', 'ADMIN_ALERT', newAlert.id, null, newAlert);
    return res.status(201).json({ success: true, alert: newAlert });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur création alerte.' });
  }
});

/**
 * Manually Trigger Background Job
 */
router.post('/jobs/trigger', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, metadata } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Type de job requis.' });
    }

    const newJob = MonitoringService.triggerJob(type, metadata);
    auditAdmin(req, 'TRIGGER_JOB', 'BACKGROUND_JOB', newJob.id, null, { type, metadata });
    return res.status(201).json({ success: true, job: newJob });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur déclenchement job.' });
  }
});

// ============================================================================
// 5. AUDIT LOGS & BI METRIC DEFINITIONS
// ============================================================================

/**
 * System Audit Trail
 */
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      adminEmail: req.query.adminEmail as string,
      search: req.query.search as string,
    };

    const logs = AuditService.getLogs(filters);
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur récupération journal d’audit.' });
  }
});

/**
 * Standardized Business Intelligence Metric Definitions
 */
router.get('/metrics-definitions', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const defs = db.get('metricDefinitions') || [];
    return res.json({ success: true, metricDefinitions: defs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur dictionnaire métriques BI.' });
  }
});

// ============================================================================
// 6. CUSTOMER SUPPORT & SANITIZED USER LOOKUP (PRIVACY ENFORCED)
// ============================================================================

/**
 * Get Support Cases List
 */
router.get('/support/cases', (req: AuthenticatedRequest, res: Response) => {
  try {
    const filters = {
      status: req.query.status as any,
      priority: req.query.priority as any,
      category: req.query.category as string,
      search: req.query.search as string,
    };

    const cases = SupportService.getCases(filters);
    return res.json({ success: true, cases });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur tickets support.' });
  }
});

/**
 * Get Support Case Details
 */
router.get('/support/cases/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const c = SupportService.getCaseById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Ticket introuvable.' });
    return res.json({ success: true, supportCase: c });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur détail ticket.' });
  }
});

/**
 * Create New Support Case
 */
router.post('/support/cases', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, orderId, shopId, category, priority, subject, initialMessage, clientName, clientEmail } = req.body;
    if (!userId || !category || !subject || !initialMessage) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    const newCase = SupportService.createCase({
      userId,
      orderId,
      shopId,
      category,
      priority,
      subject,
      initialMessage,
      clientName,
      clientEmail,
    });

    auditAdmin(req, 'CREATE_SUPPORT_CASE', 'SUPPORT_CASE', newCase.id, null, newCase);
    return res.status(201).json({ success: true, supportCase: newCase });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur création ticket support.' });
  }
});

/**
 * Add Support Reply
 */
router.post('/support/cases/:id/messages', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, sender } = req.body;
    if (!text) return res.status(400).json({ error: 'Texte du message obligatoire.' });

    const authorName = req.user?.email || 'Support Nexus';
    const updated = SupportService.addMessage(req.params.id, sender || 'SUPPORT', authorName, text);
    if (!updated) return res.status(404).json({ error: 'Ticket introuvable.' });

    auditAdmin(req, 'REPLY_SUPPORT_CASE', 'SUPPORT_CASE', req.params.id, null, { text });
    return res.json({ success: true, supportCase: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur réponse support.' });
  }
});

/**
 * Update Support Case Status/Priority
 */
router.patch('/support/cases/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = SupportService.updateCase(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Ticket introuvable.' });

    auditAdmin(req, 'UPDATE_SUPPORT_CASE', 'SUPPORT_CASE', req.params.id, null, req.body);
    return res.json({ success: true, supportCase: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur mise à jour ticket.' });
  }
});

/**
 * Search User for Customer Service
 * STRICT PRIVACY: Returns sanitized account overview, zero medical/THC/journal data!
 */
router.get('/support/search-user', (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const results = SupportService.searchUserForSupport(q);
    return res.json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur recherche utilisateur.' });
  }
});

// ============================================================================
// 7. DATA EXPORTS (CSV / JSON)
// ============================================================================

/**
 * Export Platform Data (Orders, Shops, Ledger, Subscriptions, KPIs)
 */
router.get('/export/:type', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.params;
    const format = req.query.format === 'json' ? 'json' : 'csv';

    const result = ExportService.exportData(type, format);
    auditAdmin(req, 'EXPORT_DATA', 'DATA_EXPORT', type, null, { format });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (err: any) {
    console.error('Error generating export:', err);
    return res.status(500).json({ error: 'Erreur lors de l’export des données.' });
  }
});

// ============================================================================
// 8. LEGACY COMPATIBILITY ENDPOINTS (PRESERVED WITHOUT REGRESSION)
// ============================================================================

router.get('/metrics', (_req, res) => {
  try {
    const users = db.get('users') || [];
    const profiles = db.get('userProfiles') || [];
    const thcProfiles = db.get('thcProfiles') || [];
    const cbdProfiles = db.get('cbdProfiles') || [];
    const entries = db.get('consumptionEntries') || [];
    const stores = db.get('partnerShops') || [];
    const products = db.get('marketplaceProducts') || [];
    const auditLogs = db.get('adminAuditLogs') || [];

    return res.json({
      metrics: {
        totalUsers: users.length,
        thcCount: thcProfiles.length,
        cbdCount: cbdProfiles.length,
        totalJournalEntries: entries.length,
        totalStores: stores.length,
        totalProducts: products.length,
        totalAuditLogs: auditLogs.length,
      },
      recentLogs: auditLogs.slice(0, 20),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération métriques.' });
  }
});

router.get('/users', (_req, res) => {
  try {
    const users = db.get('users') || [];
    const profiles = db.get('userProfiles') || [];

    const sanitizedUsers = users.map((u) => {
      const prof = profiles.find((p) => p.userId === u.id);
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        isEmailVerified: u.isEmailVerified,
        nickname: prof ? prof.nickname : 'Utilisateur',
        profileType: prof ? prof.profileType : 'UNDETERMINED',
        isOnboarded: prof ? prof.isOnboarded : false,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      };
    });

    return res.json({ users: sanitizedUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération utilisateurs.' });
  }
});

export default router;
