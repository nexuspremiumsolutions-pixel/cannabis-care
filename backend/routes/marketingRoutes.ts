import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import {
  MarketingCampaign,
  MarketingPromotion,
  MarketingCoupon,
  MerchandisingPlacement,
  MarketingAuditLog,
} from '../../src/types/entities';
import { PromotionEligibilityService } from '../services/marketing/promotionEligibilityService';
import { MarketingComplianceService } from '../services/marketing/marketingComplianceService';
import { MarketingAttributionService } from '../services/marketing/marketingAttributionService';
import { MarketingQrService } from '../services/marketing/marketingQrService';
import { OrderDispatchService } from '../services/orderDispatchService';

export const marketingRouter = Router();

// Helper to log audit events
function logMarketingAudit(
  action: MarketingAuditLog['action'],
  targetType: MarketingAuditLog['targetType'],
  targetId: string,
  userId: string,
  _userEmail: string,
  details: Record<string, unknown>
) {
  const logs = db.get('marketingAuditLogs') || [];
  const auditLog: MarketingAuditLog = {
    id: `mkt_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    targetType,
    targetId,
    actorUserId: userId,
    actorRole: 'ADMIN',
    details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(auditLog);
  if (logs.length > 500) logs.length = 500;
  db.save();
}

/**
 * GET /api/marketing/campaigns
 * Retrieves campaigns with optional filtering
 */
marketingRouter.get('/campaigns', (req: Request, res: Response) => {
  try {
    const { status, shopId, country } = req.query;
    let campaigns = db.get('marketingCampaigns') || [];

    if (status && typeof status === 'string') {
      campaigns = campaigns.filter((c) => c.status === status);
    }
    if (shopId && typeof shopId === 'string') {
      campaigns = campaigns.filter((c) => c.shopId === shopId || !c.shopId);
    }
    if (country && typeof country === 'string') {
      campaigns = campaigns.filter((c) => c.targetAudience?.targetCountry === country);
    }

    res.json({ success: true, count: campaigns.length, campaigns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/campaigns/:id
 */
marketingRouter.get('/campaigns/:id', (req: Request, res: Response) => {
  try {
    const campaigns = db.get('marketingCampaigns') || [];
    const campaign = campaigns.find((c) => c.id === req.params.id || c.slug === req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campagne introuvable.' });
    }

    const promotions = (db.get('marketingPromotions') || []).filter((p) => p.campaignId === campaign.id);
    const coupons = (db.get('marketingCoupons') || []).filter((c) => c.campaignId === campaign.id);

    res.json({ success: true, campaign, promotions, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/campaigns
 * Creates a new marketing campaign with compliance check
 */
marketingRouter.post('/campaigns', (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      type = 'SEASONAL',
      status = 'DRAFT',
      shopId,
      startAt,
      endAt,
      budget = 1000,
      countryCodes = ['FR', 'BE', 'DE'],
      heroBannerUrl,
      accentColor = '#059669',
      badgeText,
      userId = 'usr_admin',
      userEmail = 'admin@nexus-cbd.com',
    } = req.body;

    if (!name || !startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'Nom, date de début et date de fin requis.' });
    }

    // Verify botanical compliance of text
    const compliance = MarketingComplianceService.verifyCompliance(`${name} ${description || ''}`, countryCodes[0] || 'FR');
    if (!compliance.isCompliant) {
      return res.status(422).json({
        success: false,
        error: 'Le texte de la campagne enfreint la réglementation des allégations de santé.',
        compliance,
      });
    }

    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCampaign: MarketingCampaign = {
      id: campaignId,
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: description || '',
      ownerType: shopId ? 'PARTNER' : 'PLATFORM',
      ownerId: shopId || 'PLATFORM',
      shopId: shopId || undefined,
      campaignType: type || 'SEASONAL',
      status: status || 'DRAFT',
      startAt,
      endAt,
      budget,
      budgetSpent: 0,
      budgetAlertThreshold: 0.8,
      currency: 'EUR',
      targetAudience: { segmentType: 'ALL', targetCountry: countryCodes[0] || 'FR' },
      channels: ['BANNER', 'COUPON', 'QR_CODE'],
      objectives: ['Acquisition', 'Fidélisation'],
      termsAndConditions: 'Offre soumise aux conditions générales de vente.',
      complianceChecked: true,
      complianceNotes: compliance.recommendations?.join(', '),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const campaigns = db.get('marketingCampaigns') || [];
    campaigns.unshift(newCampaign);
    db.save();

    logMarketingAudit('CAMPAIGN_CREATE', 'CAMPAIGN', campaignId, userId, userEmail, { name, budget });

    res.json({ success: true, campaign: newCampaign, compliance });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/marketing/campaigns/:id
 */
marketingRouter.put('/campaigns/:id', (req: Request, res: Response) => {
  try {
    const campaigns = db.get('marketingCampaigns') || [];
    const campaign = campaigns.find((c) => c.id === req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campagne non trouvée.' });
    }

    const { status, budget, endAt, name, description } = req.body;

    if (status) campaign.status = status;
    if (budget !== undefined) campaign.budget = Number(budget);
    if (endAt) campaign.endAt = endAt;
    if (name) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    campaign.updatedAt = new Date().toISOString();

    db.save();

    logMarketingAudit('CAMPAIGN_UPDATE', 'CAMPAIGN', campaign.id, 'usr_admin', 'admin@nexus-cbd.com', {
      status,
      budget,
    });

    res.json({ success: true, campaign });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/promotions
 */
marketingRouter.get('/promotions', (req: Request, res: Response) => {
  try {
    const { campaignId, shopId } = req.query;
    let promotions = db.get('marketingPromotions') || [];

    if (campaignId && typeof campaignId === 'string') {
      promotions = promotions.filter((p) => p.campaignId === campaignId);
    }
    if (shopId && typeof shopId === 'string') {
      promotions = promotions.filter((p) => p.shopId === shopId || !p.shopId);
    }

    res.json({ success: true, count: promotions.length, promotions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/promotions
 */
marketingRouter.post('/promotions', (req: Request, res: Response) => {
  try {
    const {
      campaignId,
      shopId,
      name,
      description,
      promotionType = 'PERCENTAGE',
      value = 10,
      minimumOrderAmount = 0,
      maximumDiscountAmount,
      fundingSource = 'PLATFORM',
      partnerFundingRatio = 0,
      isStackable = false,
      priority = 1,
      eligibleProductIds,
      eligibleCategoryIds,
      eligibleShopIds,
    } = req.body;

    if (!campaignId || !name || value === undefined) {
      return res.status(400).json({ success: false, error: 'Campagne, nom et valeur requis.' });
    }

    const promoId = `promo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPromotion: MarketingPromotion = {
      id: promoId,
      campaignId,
      shopId: shopId || undefined,
      eligibleShopIds,
      name,
      description: description || '',
      promotionType,
      value: Number(value),
      currency: 'EUR',
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      maximumDiscountAmount: maximumDiscountAmount ? Number(maximumDiscountAmount) : undefined,
      fundingSource,
      partnerFundingRatio: Number(partnerFundingRatio) || 0,
      stackable: !!isStackable,
      priority: Number(priority) || 1,
      status: 'ACTIVE',
      eligibleProductIds,
      eligibleCategoryIds,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const promotions = db.get('marketingPromotions') || [];
    promotions.unshift(newPromotion);
    db.save();

    res.json({ success: true, promotion: newPromotion });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/coupons
 */
marketingRouter.get('/coupons', (req: Request, res: Response) => {
  try {
    const { shopId, status } = req.query;
    let coupons = db.get('marketingCoupons') || [];

    if (shopId && typeof shopId === 'string') {
      coupons = coupons.filter((c) => c.shopId === shopId || !c.shopId);
    }
    if (status && typeof status === 'string') {
      coupons = coupons.filter((c) => c.status === status);
    }

    res.json({ success: true, count: coupons.length, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/coupons
 */
marketingRouter.post('/coupons', (req: Request, res: Response) => {
  try {
    const {
      code,
      campaignId,
      promotionId,
      shopId,
      description,
      usageLimit = 500,
      usagePerUser = 1,
      validFrom = new Date().toISOString(),
      validUntil = new Date(Date.now() + 30 * 86400000).toISOString(),
    } = req.body;

    if (!code || !campaignId || !promotionId) {
      return res.status(400).json({ success: false, error: 'Code promo, campagne et promotion requis.' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = (db.get('marketingCoupons') || []).find((c) => c.code.toUpperCase() === normalizedCode);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Ce code promo existe déjà.' });
    }

    const couponId = `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCoupon: MarketingCoupon = {
      id: couponId,
      code: normalizedCode,
      campaignId,
      promotionId,
      shopId: shopId || undefined,
      description: description || '',
      status: 'ACTIVE',
      usageLimit: Number(usageLimit) || undefined,
      usagePerUser: Number(usagePerUser) || 1,
      usageCount: 0,
      validFrom,
      validUntil,
      userUsageMap: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const coupons = db.get('marketingCoupons') || [];
    coupons.unshift(newCoupon);
    db.save();

    res.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/cart/apply-coupon
 */
marketingRouter.post('/cart/apply-coupon', (req: Request, res: Response) => {
  try {
    const { userId = 'usr_demo', couponCode } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, error: 'Veuillez renseigner un code promo.' });
    }

    const result = OrderDispatchService.applyCoupon(userId, couponCode);
    if (!result.success) {
      return res.status(422).json(result);
    }

    // Track coupon application event
    MarketingAttributionService.trackEvent({
      eventType: 'coupon_apply',
      couponCode,
      userId,
      campaignId: result.snapshot?.campaignId,
      discountAmount: result.cart?.discountTotal,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/cart/remove-coupon
 */
marketingRouter.post('/cart/remove-coupon', (req: Request, res: Response) => {
  try {
    const { userId = 'usr_demo' } = req.body;
    const result = OrderDispatchService.removeCoupon(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/compliance/verify
 * Analyzes botanical promotional text
 */
marketingRouter.post('/compliance/verify', (req: Request, res: Response) => {
  try {
    const { text, countryCode = 'FR' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir un texte à vérifier.' });
    }

    const result = MarketingComplianceService.verifyCompliance(text, countryCode);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/marketing/track
 * Logs impressions, clicks, etc.
 */
marketingRouter.post('/track', (req: Request, res: Response) => {
  try {
    const event = MarketingAttributionService.trackEvent(req.body);
    res.json({ success: true, event });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/analytics/overview
 */
marketingRouter.get('/analytics/overview', (req: Request, res: Response) => {
  try {
    const overview = MarketingAttributionService.getAnalyticsOverview();
    res.json({ success: true, overview });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/analytics/partner/:shopId
 */
marketingRouter.get('/analytics/partner/:shopId', (req: Request, res: Response) => {
  try {
    const partnerAnalytics = MarketingAttributionService.getPartnerAnalytics(req.params.shopId);
    res.json({ success: true, partnerAnalytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/qr
 * Generates tracked QR code
 */
marketingRouter.get('/qr', (req: Request, res: Response) => {
  try {
    const { campaignSlug = 'printemps-naturel', shopId, baseUrl } = req.query;
    const origin = (baseUrl as string) || req.headers.referer || 'https://cannabis-care.nexus.eu';

    const qr = MarketingQrService.generateCampaignQr({
      baseUrl: origin,
      campaignSlug: campaignSlug as string,
      shopId: shopId as string | undefined,
    });

    res.json({ success: true, qr });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/marketing/merchandising
 */
marketingRouter.get('/merchandising', (req: Request, res: Response) => {
  try {
    const { slotKey } = req.query;
    let placements = db.get('merchandisingPlacements') || [];

    if (slotKey && typeof slotKey === 'string') {
      placements = placements.filter((p) => (p.slot as string) === slotKey);
    }

    res.json({ success: true, count: placements.length, placements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
