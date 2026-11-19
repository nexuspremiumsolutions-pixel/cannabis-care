import express, { Request, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth/auth';
import {
  UserRole,
  SupportedCountryCode,
  DisputeStatus,
} from '../../src/types/entities';
import { PaymentProviderRegistry, StripeMarketplaceProvider } from '../services/payment/paymentProviderAdapter';
import { FinancialEngineService } from '../services/payment/financialEngineService';
import { PartnerFinancialService } from '../services/payment/partnerFinancialService';
import { RefundDisputeService } from '../services/payment/refundDisputeService';
import { FinancialReconciliationService } from '../services/payment/reconciliationService';

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

// Helper to determine shopId for authenticated partner user
function getShopIdForUser(req: AuthenticatedRequest): string | null {
  const user = req.user;
  if (!user) return null;
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PLATFORM_ADMIN) {
    return (req.query.shopId as string) || (db.get('partnerShops') || [])[0]?.id || null;
  }
  const shops = db.get('partnerShops') || [];
  const userShop = shops.find((s) => s.ownerUserId === user.id);
  return userShop ? userShop.id : (shops[0]?.id || null);
}

// ----------------------------------------------------------------------------
// 1. Public & Customer: Eligibility & Country Info
// ----------------------------------------------------------------------------

// POST /api/finance/eligibility — Check cart eligibility before checkout
router.post('/eligibility', (req: Request, res: Response) => {
  try {
    const { country = 'FR', currency = 'EUR', cartItems = [] } = req.body;
    const countries = db.get('supportedCountries') || [];
    const countryConfig = countries.find((c) => c.countryCode === country && c.enabled);

    if (!countryConfig) {
      return res.status(400).json({
        eligible: false,
        reason: `La livraison et le paiement en ligne ne sont pas encore disponibles dans le pays sélectionné (${country}).`,
        provider: 'NONE',
        allowedPaymentMethods: [],
        isSandbox: true,
      });
    }

    const provider = PaymentProviderRegistry.getProvider();
    const eligibility = provider.checkEligibility(country as SupportedCountryCode, true);

    return res.json({
      eligible: eligibility.eligible,
      reason: eligibility.reason,
      countryConfig,
      provider: provider.name,
      allowedPaymentMethods: eligibility.allowedPaymentMethods,
      isSandbox: eligibility.isSandbox,
      currency: countryConfig.currency,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erreur lors de la vérification d’éligibilité' });
  }
});

// GET /api/finance/countries — List supported countries
router.get('/countries', (req: Request, res: Response) => {
  const countries = db.get('supportedCountries') || [];
  return res.json({ countries });
});

// GET /api/finance/providers — List providers & capabilities
router.get('/providers', (req: Request, res: Response) => {
  const providers = PaymentProviderRegistry.listProviders();
  const active = PaymentProviderRegistry.getProvider().name;
  return res.json({ providers, activeProvider: active });
});

// GET /api/finance/stripe-config — Public Stripe publishable key & live/test mode
router.get('/stripe-config', (_req: Request, res: Response) => {
  const provider = PaymentProviderRegistry.getProvider('STRIPE_CONNECT') as StripeMarketplaceProvider;
  const publishableKey = provider.getPublishableKey();
  return res.json({
    configured: provider.isRealStripeConfigured() && Boolean(publishableKey),
    publishableKey,
    mode: provider.isLiveMode() ? 'live' : 'test',
  });
});

// GET /api/finance/customer/payments — Customer payment receipts history
router.get('/customer/payments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const orders = (db.get('globalOrders') || []).filter((o) => o.userId === userId);
    const ledger = db.get('financialLedger') || [];

    const payments = orders.map((order) => {
      const charge = ledger.find((l) => l.orderId === order.id && l.type === 'CUSTOMER_CHARGE');
      const refund = ledger.find((l) => l.orderId === order.id && l.type === 'REFUND');
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        paymentTransactionId: order.paymentTransactionId,
        date: order.createdAt,
        chargeAmount: charge ? charge.amount : order.grandTotal,
        refundedAmount: refund ? refund.amount : 0,
        shopsSummary: order.shopOrdersSummary,
      };
    });

    return res.json({ payments });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. Partner Financial Space (Shop Owner / Admin)
// ----------------------------------------------------------------------------

// GET /api/finance/partner/balance — Partner balance & financial KPIs
router.get('/partner/balance', requireAuth, requireRole(...PARTNER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = getShopIdForUser(req);
    if (!shopId) {
      return res.status(404).json({ error: 'Aucune boutique associée à ce compte' });
    }

    const balance = PartnerFinancialService.getPartnerBalance(shopId);
    const shopOrders = (db.get('shopOrders') || []).filter((s) => s.shopId === shopId);
    const ledger = db.get('financialLedger') || [];
    const shopLedger = ledger.filter((l) => l.shopId === shopId);

    // Calculate aggregated KPIs
    const totalGrossRevenue = shopOrders.reduce((sum, s) => sum + s.subtotal + s.deliveryFee, 0);
    const totalCommissionNexus = shopOrders.reduce((sum, s) => sum + s.commissionAmount, 0);
    const totalNetRevenue = Math.round((totalGrossRevenue - totalCommissionNexus) * 100) / 100;
    const completedOrdersCount = shopOrders.filter((s) => s.status === 'COMPLETED' || s.status === 'SHIPPED').length;

    const account = await PartnerFinancialService.getOrCreatePartnerAccount(shopId, 'Boutique Partenaire');

    return res.json({
      shopId,
      balance,
      account,
      kpis: {
        totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
        totalCommissionNexus: Math.round(totalCommissionNexus * 100) / 100,
        totalNetRevenue,
        availableForPayout: balance.availableAmount,
        alreadyPaidOut: balance.paidAmount,
        refundedTotal: balance.refundedAmount,
        disputedTotal: balance.disputedAmount,
        completedOrdersCount,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/partner/transactions — Partner transfers and ledger records
router.get('/partner/transactions', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = getShopIdForUser(req);
    if (!shopId) {
      return res.status(404).json({ error: 'Aucune boutique associée' });
    }

    const ledger = PartnerFinancialService.getPartnerLedger(shopId);
    const transfers = (db.get('transferRecords') || []).filter((t) => t.shopId === shopId);
    const payouts = (db.get('payoutRecords') || []).filter((p) => p.shopId === shopId);

    return res.json({
      shopId,
      ledger,
      transfers,
      payouts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/partner/payouts — Partner initiates a payout
router.post('/partner/payouts', requireAuth, requireRole(...PARTNER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = getShopIdForUser(req);
    if (!shopId) {
      return res.status(404).json({ error: 'Aucune boutique associée' });
    }

    const { amount } = req.body;
    const payout = await PartnerFinancialService.requestPayout(shopId, amount ? Number(amount) : undefined);

    return res.json({
      success: true,
      message: `Reversement de ${payout.amount.toFixed(2)} ${payout.currency} ordonné vers votre compte bancaire.`,
      payout,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/finance/partner/onboarding-link — Generate hosted KYC link
router.post('/partner/onboarding-link', requireAuth, requireRole(...PARTNER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = getShopIdForUser(req);
    if (!shopId) {
      return res.status(404).json({ error: 'Aucune boutique associée' });
    }

    const host = req.get('host') || 'localhost:3000';
    const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.');
    const protocol = forwardedProto || (isLocalhost ? req.protocol : 'https');
    const returnUrl = `${protocol}://${host}/?payout_success=true`;
    const refreshUrl = `${protocol}://${host}/?payout_refresh=true`;

    const link = await PartnerFinancialService.generateOnboardingLink(shopId, returnUrl, refreshUrl);
    return res.json(link);
  } catch (err: any) {
    const msg = err?.message || 'Erreur lors de la génération du lien Stripe Connect';
    if (msg.includes('signed up for Connect') || msg.includes('dashboard.stripe.com/connect')) {
      return res.status(400).json({
        error: 'Stripe Connect doit d’abord être activé sur votre tableau de bord Stripe (https://dashboard.stripe.com/connect) avant de créer des comptes boutiques partenaires.',
      });
    }
    return res.status(500).json({ error: msg });
  }
});

// POST /api/finance/partner/refunds — Partner issues an isolated refund for one of their shop orders
router.post('/partner/refunds', requireAuth, requireRole(...PARTNER_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const shopId = getShopIdForUser(req);
    const { globalOrderId, shopOrderId, amount, reason } = req.body;

    if (!globalOrderId) {
      return res.status(400).json({ error: 'Identifiant globalOrderId requis' });
    }

    // Authorization & Isolation check
    const shopOrders = db.get('shopOrders') || [];
    const target = shopOrders.find((s) => s.id === shopOrderId || (s.globalOrderId === globalOrderId && s.shopId === shopId));

    if (!target) {
      return res.status(404).json({ error: 'Sous-commande boutique introuvable' });
    }

    const isAdminUser = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.SUPER_ADMIN || req.user?.role === UserRole.PLATFORM_ADMIN;
    if (!isAdminUser && target.shopId !== shopId) {
      return res.status(403).json({ error: 'Action non autorisée sur la commande d’une autre boutique' });
    }

    const result = await RefundDisputeService.processRefund({
      globalOrderId,
      shopOrderId: target.id,
      shopId: target.shopId,
      amount: amount ? Number(amount) : undefined,
      reason,
      refundInitiator: isAdminUser ? 'ADMIN' : 'SHOP_OWNER',
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: `Remboursement de ${result.refundedAmount.toFixed(2)} € validé avec succès.`,
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/partner/export — Export CSV for partner
router.get('/partner/export', requireAuth, requireRole(...PARTNER_ROLES), (req: AuthenticatedRequest, res: Response) => {
  const shopId = getShopIdForUser(req);
  if (!shopId) return res.status(404).send('Boutique introuvable');

  const csv = FinancialReconciliationService.exportLedgerCSV(shopId);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="nexus-releve-financier-${shopId}.csv"`);
  return res.send(csv);
});

// ----------------------------------------------------------------------------
// 3. Admin Financial Space (Platform Supervision & Compliance)
// ----------------------------------------------------------------------------

// GET /api/finance/admin/overview — Global marketplace financial overview
router.get('/admin/overview', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = db.get('globalOrders') || [];
    const ledger = db.get('financialLedger') || [];
    const balances = db.get('partnerBalances') || [];
    const disputes = db.get('paymentDisputes') || [];

    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID' || o.paymentStatus === 'PARTIALLY_REFUNDED');
    const gmv = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const commissionsTotal = paidOrders.reduce((sum, o) => sum + o.commissionTotal, 0);

    const totalAvailableToPartners = balances.reduce((sum, b) => sum + b.availableAmount, 0);
    const totalPaidOutToPartners = balances.reduce((sum, b) => sum + b.paidAmount, 0);
    const totalRefunds = ledger.filter((l) => l.type === 'REFUND').reduce((sum, l) => sum + l.amount, 0);
    const openDisputes = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');

    return res.json({
      kpis: {
        totalGMV: Math.round(gmv * 100) / 100,
        totalPlatformCommissions: Math.round(commissionsTotal * 100) / 100,
        totalAvailableToPartners: Math.round(totalAvailableToPartners * 100) / 100,
        totalPaidOutToPartners: Math.round(totalPaidOutToPartners * 100) / 100,
        totalRefundsIssued: Math.round(totalRefunds * 100) / 100,
        openDisputesCount: openDisputes.length,
        totalPaidOrdersCount: paidOrders.length,
      },
      partnersBalances: balances,
      openDisputes,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/admin/ledger — Full immutable financial ledger with filters
router.get('/admin/ledger', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, shopId, orderId, limit = 100 } = req.query;
    let ledger = db.get('financialLedger') || [];

    if (type) {
      ledger = ledger.filter((l) => l.type === type);
    }
    if (shopId) {
      ledger = ledger.filter((l) => l.shopId === shopId);
    }
    if (orderId) {
      ledger = ledger.filter((l) => l.orderId === orderId);
    }

    return res.json({
      count: ledger.length,
      entries: ledger.slice(0, Number(limit)),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/admin/reconciliation — Get or run reconciliation report
router.get('/admin/reconciliation', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = FinancialReconciliationService.runAudit();
    return res.json({ report });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/admin/reconciliation/run — Trigger immediate reconciliation
router.post('/admin/reconciliation/run', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = FinancialReconciliationService.runAudit();
    return res.json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/admin/adjustments — Manual compensatory adjustment
router.post('/admin/adjustments', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shopId, orderId, amount, direction, justification } = req.body;
    if (!shopId || !amount || !direction || !justification) {
      return res.status(400).json({ error: 'Champs obligatoires : shopId, amount, direction, justification' });
    }

    const adj = FinancialEngineService.appendLedgerEntry({
      orderId: orderId || 'MANUAL_ADJUSTMENT',
      shopId,
      type: 'ADJUSTMENT',
      direction,
      amount: Number(amount),
      description: `Ajustement administratif manuel : ${justification}`,
      metadata: { adminId: req.user!.id, justification },
    });

    const adjustments = db.get('financialAdjustments') || [];
    adjustments.push({
      id: `adj_${Date.now()}`,
      adminUserId: req.user!.id,
      shopId,
      orderId,
      amount: Number(amount),
      currency: 'EUR',
      direction,
      justification,
      createdAt: new Date().toISOString(),
    });
    db.set('financialAdjustments', adjustments);

    return res.json({ success: true, adjustment: adj });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/admin/disputes — List disputes
router.get('/admin/disputes', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  const disputes = db.get('paymentDisputes') || [];
  return res.json({ disputes });
});

// PATCH /api/finance/admin/disputes/:id — Resolve dispute
router.patch('/admin/disputes/:id', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, evidenceNotes } = req.body;
    const updated = RefundDisputeService.updateDisputeStatus(req.params.id, status as DisputeStatus, evidenceNotes);
    return res.json({ success: true, dispute: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/admin/export — Global export CSV
router.get('/admin/export', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  const csv = FinancialReconciliationService.exportLedgerCSV();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="nexus-grand-livre-financier-complet.csv"');
  return res.send(csv);
});

// ----------------------------------------------------------------------------
// 4. Webhook Receiver (/api/finance/webhooks/:provider)
// ----------------------------------------------------------------------------
router.post('/webhooks/:provider', (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const providerKey = provider.toUpperCase() === 'STRIPE' ? 'STRIPE_CONNECT' : provider.toUpperCase();
    const signature = (req.headers['stripe-signature'] as string) || (req.headers['x-webhook-signature'] as string) || '';
    const adapter = PaymentProviderRegistry.getProvider(providerKey);
    const rawPayload: string | Buffer = (req as any).rawBody || JSON.stringify(req.body);

    let eventId = req.body?.id || `evt_${Date.now()}`;
    let eventType = req.body?.type || 'payment_intent.succeeded';
    let eventData: any = req.body?.data?.object || req.body;

    // 1. Real Stripe Signature & Event Construction when provider is Stripe
    if (providerKey === 'STRIPE_CONNECT' && adapter instanceof StripeMarketplaceProvider && adapter.isRealStripeConfigured()) {
      const candidateSecrets = Array.from(
        new Set(
          [
            process.env.STRIPE_WEBHOOK_SECRET,
            process.env.STRIPE_SHARED_WEBHOOK_SECRET,
            process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET,
          ].filter((s): s is string => typeof s === 'string' && s.startsWith('whsec_'))
        )
      );
      if (candidateSecrets.length === 0) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET (whsec_...) is missing.');
        return res.status(500).json({ error: 'Secret webhook Stripe (whsec_...) non configuré côté serveur.' });
      }
      let stripeEvent: any = null;
      let lastSigErr: any = null;
      for (const secret of candidateSecrets) {
        try {
          stripeEvent = adapter.constructWebhookEvent(rawPayload, signature, secret);
          break;
        } catch (err: any) {
          lastSigErr = err;
        }
      }
      if (!stripeEvent) {
        console.error('[Stripe Webhook] Signature verification failed:', lastSigErr?.message);
        return res.status(400).json({ error: `Signature webhook Stripe invalide : ${lastSigErr?.message || 'signature invalide'}` });
      }
      eventId = stripeEvent.id;
      eventType = stripeEvent.type;
      eventData = stripeEvent.data.object;
    } else {
      const isValid = adapter.verifyWebhookSignature(rawPayload, signature);
      if (!isValid) {
        return res.status(400).json({ error: 'Signature webhook invalide' });
      }
    }

    // 2. Idempotency verification
    const webhooks = db.get('paymentWebhookEvents') || [];
    const already = webhooks.find((w) => w.providerEventId === eventId);
    if (already) {
      return res.status(200).json({ status: 'duplicate_acknowledged' });
    }

    // 3. Process critical Stripe events
    if (eventType === 'payment_intent.succeeded' && eventData?.id) {
      const orders = db.get('globalOrders') || [];
      const order = orders.find((o) => o.paymentTransactionId === eventData.id);
      if (order && order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.status = 'PAID';
        order.updatedAt = new Date().toISOString();
        db.set('globalOrders', orders);
      }
    } else if (eventType === 'payment_intent.payment_failed' && eventData?.id) {
      const orders = db.get('globalOrders') || [];
      const order = orders.find((o) => o.paymentTransactionId === eventData.id);
      if (order) {
        order.paymentStatus = 'FAILED';
        order.updatedAt = new Date().toISOString();
        db.set('globalOrders', orders);
      }
    } else if (eventType === 'charge.dispute.created' && eventData) {
      const piId = typeof eventData.payment_intent === 'string' ? eventData.payment_intent : '';
      const orders = db.get('globalOrders') || [];
      const order = orders.find((o) => o.paymentTransactionId === piId);
      if (order) {
        RefundDisputeService.registerDispute({
          orderId: order.id,
          amount: (eventData.amount || 0) / 100,
          currency: (eventData.currency || 'eur').toUpperCase(),
          reason: eventData.reason || 'Stripe dispute',
          providerDisputeId: eventData.id,
        });
      }
    } else if (eventType === 'account.updated' && eventData?.id) {
      const accounts = db.get('partnerFinancialAccounts') || [];
      const acc = accounts.find((a) => a.providerAccountId === eventData.id);
      if (acc) {
        acc.chargesEnabled = Boolean(eventData.charges_enabled);
        acc.payoutsEnabled = Boolean(eventData.payouts_enabled);
        acc.payoutStatus = eventData.payouts_enabled ? 'ENABLED' : 'DISABLED';
        acc.verificationStatus = eventData.details_submitted && eventData.payouts_enabled ? 'VERIFIED' : 'PENDING';
        acc.onboardingStatus = eventData.details_submitted ? 'COMPLETED' : 'INCOMPLETE';
        acc.status = eventData.payouts_enabled ? 'ACTIVE' : 'ONBOARDING';
        acc.lastSyncedAt = new Date().toISOString();
        acc.updatedAt = new Date().toISOString();
        db.set('partnerFinancialAccounts', accounts);
      }
    }

    const eventRecord = {
      id: `whevt_${Date.now()}`,
      provider,
      providerEventId: eventId,
      eventType,
      payloadHash: 'hash_' + Date.now(),
      status: 'PROCESSED' as const,
      processedAt: new Date().toISOString(),
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    webhooks.unshift(eventRecord);
    db.set('paymentWebhookEvents', webhooks);

    return res.status(200).json({ received: true, eventType });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
