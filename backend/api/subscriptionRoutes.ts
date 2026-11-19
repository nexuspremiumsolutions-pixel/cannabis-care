import express, { Request, Response } from 'express';
import { db } from '../db/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../auth/auth';
import { UserRole } from '../../src/types/entities';
import { SubscriptionService } from '../services/subscription/subscriptionService';
import { EntitlementService } from '../services/subscription/entitlementService';
import { SubscriptionAnalyticsService } from '../services/subscription/subscriptionAnalyticsService';
import { PaymentProviderRegistry, StripeMarketplaceProvider } from '../services/payment/paymentProviderAdapter';
import { DeliveryAdapters } from '../services/communication/deliveryAdapters';

const router = express.Router();

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PLATFORM_ADMIN];

// ----------------------------------------------------------------------------
// 1. Public & Customer Endpoints
// ----------------------------------------------------------------------------

// GET /api/subscriptions/plans — List available subscription plans & prices
router.get('/plans', (req: Request, res: Response) => {
  try {
    const target = (req.query.target as 'USER' | 'PARTNER') || 'USER';
    const currency = (req.query.currency as string) || undefined;
    const plans = SubscriptionService.getPlansAndPrices(target, currency);
    return res.json({ success: true, plans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/trial-eligibility — Check trial eligibility
router.get('/trial-eligibility', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const eligibility = SubscriptionService.checkTrialEligibility(userId);
    return res.json({ success: true, eligibility });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/me/entitlements — Check user permissions, active plan & limits
router.get('/me/entitlements', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entitlements = EntitlementService.getUserEntitlements(userId);
    return res.json({ success: true, entitlements });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/me — Get user's current subscription & recent history
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscription, grant, plan, isActivePremium } = EntitlementService.getEffectiveSubscription(userId);
    const entitlements = EntitlementService.getUserEntitlements(userId);

    const subscriptions = db.get('subscriptions') || [];
    const userSubs = subscriptions.filter((s) => s.userId === userId);

    const events = db.get('subscriptionEvents') || [];
    const userEvents = events.filter((e) => e.userId === userId).slice(0, 20);

    const invoices = db.get('invoices') || [];
    const userInvoices = invoices.filter((i) => i.userId === userId).slice(0, 20);

    return res.json({
      success: true,
      plan,
      subscription: subscription || null,
      grant: grant || null,
      isActivePremium,
      entitlements,
      history: userSubs,
      events: userEvents,
      invoices: userInvoices,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/create-payment-intent — Create Stripe PaymentIntent for a paid subscription
router.post('/create-payment-intent', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email || 'client@nexus-cannabis-care.fr';
    const { planId, priceId, country = 'FR' } = req.body;

    if (!planId || !priceId) {
      return res.status(400).json({ error: 'planId et priceId sont obligatoires.' });
    }

    const plans = db.get('subscriptionPlans') || [];
    const prices = db.get('subscriptionPrices') || [];
    const plan = plans.find((p) => p.id === planId && p.status === 'ACTIVE');
    const price = prices.find((pr) => pr.id === priceId && pr.status === 'ACTIVE');

    if (!plan || !price) {
      return res.status(404).json({ error: 'Formule ou tarif introuvable.' });
    }

    if (price.amount <= 0) {
      return res.json({ success: true, requiresPayment: false, amount: 0, currency: price.currency });
    }

    const provider = PaymentProviderRegistry.getProvider('STRIPE_CONNECT') as StripeMarketplaceProvider;
    if (!provider.isRealStripeConfigured()) {
      return res.status(503).json({ error: 'Stripe n’est pas configuré côté serveur.' });
    }

    const pi = await provider.createPaymentIntent({
      amount: price.amount,
      currency: price.currency || 'EUR',
      orderId: `sub_${plan.id}_${Date.now()}`,
      customerId: userId,
      customerEmail: userEmail,
      description: `Abonnement Cannabis Care - ${plan.name} (${price.interval})`,
      metadata: {
        userId,
        planId: plan.id,
        priceId: price.id,
        country,
        type: 'SUBSCRIPTION',
      },
    });

    return res.json({
      success: true,
      requiresPayment: true,
      clientSecret: pi.clientSecret,
      paymentIntentId: pi.transactionId,
      amount: pi.amount,
      currency: pi.currency,
      publishableKey: provider.getPublishableKey(),
      mode: provider.isLiveMode() ? 'live' : 'test',
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/subscribe — Subscribe to a plan or start trial
router.post('/subscribe', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { planId, priceId, country = 'FR', isTrial = false, paymentMethod, cardLast4, paymentIntentId } = req.body;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;

    if (!planId || !priceId) {
      return res.status(400).json({ error: 'planId et priceId sont obligatoires.' });
    }

    const prices = db.get('subscriptionPrices') || [];
    const price = prices.find((pr) => pr.id === priceId && pr.status === 'ACTIVE');
    const provider = PaymentProviderRegistry.getProvider('STRIPE_CONNECT') as StripeMarketplaceProvider;

    // Verify real Stripe PaymentIntent when activating a paid non-trial subscription
    if (!isTrial && price && price.amount > 0 && provider.isRealStripeConfigured()) {
      if (!paymentIntentId || typeof paymentIntentId !== 'string') {
        return res.status(400).json({ error: 'Paiement Stripe requis pour activer cet abonnement.' });
      }

      const existingPayments = db.get('subscriptionPayments') || [];
      if (existingPayments.some((p) => p.paymentIntentId === paymentIntentId)) {
        return res.status(409).json({ error: 'Ce paiement Stripe a déjà été utilisé.' });
      }

      const verifiedPi = await provider.retrievePaymentIntent(paymentIntentId);
      if (verifiedPi.status !== 'SUCCEEDED' && verifiedPi.status !== 'PROCESSING') {
        return res.status(402).json({ error: `Le paiement Stripe n’est pas validé (statut : ${verifiedPi.status}).` });
      }

      if (verifiedPi.metadata?.userId && verifiedPi.metadata.userId !== userId) {
        return res.status(403).json({ error: 'Ce paiement ne correspond pas à votre compte.' });
      }

      if (verifiedPi.amount + 0.01 < price.amount) {
        return res.status(400).json({ error: 'Le montant payé ne correspond pas au tarif de l’abonnement.' });
      }
    }

    const result = await SubscriptionService.subscribe({
      userId,
      planId,
      priceId,
      country,
      isTrial,
      paymentMethod,
      cardLast4,
      paymentIntentId,
      idempotencyKey,
    });

    if (req.user?.email) {
      void DeliveryAdapters.deliver('EMAIL', {
        notificationId: `sub_conf_${Date.now()}`,
        userId,
        recipientAddress: req.user.email,
        subject: 'CANNABIS CARE — Confirmation de votre abonnement',
        title: 'Votre abonnement CANNABIS CARE est actif',
        body: `Votre formule ${isTrial ? '(période d’essai) ' : ''}a bien été activée sur votre espace CANNABIS CARE. Retrouvez votre facture détaillée à tout moment dans votre onglet Abonnement.`,
      });
    }

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/upgrade — Upgrade plan
router.post('/upgrade', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscriptionId, newPriceId } = req.body;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;

    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({ error: 'subscriptionId et newPriceId sont obligatoires.' });
    }

    const result = await SubscriptionService.upgrade({
      userId,
      subscriptionId,
      newPriceId,
      idempotencyKey,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/downgrade — Downgrade plan at period end
router.post('/downgrade', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscriptionId, newPriceId } = req.body;

    if (!subscriptionId || !newPriceId) {
      return res.status(400).json({ error: 'subscriptionId et newPriceId sont obligatoires.' });
    }

    const result = await SubscriptionService.downgrade({
      userId,
      subscriptionId,
      newPriceId,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/cancel — Cancel subscription
router.post('/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscriptionId, immediate, reason } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId est obligatoire.' });
    }

    const result = await SubscriptionService.cancel({
      userId,
      subscriptionId,
      immediate: !!immediate,
      reason,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/pause — Pause subscription
router.post('/pause', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId est obligatoire.' });
    }

    const sub = await SubscriptionService.pause(userId, subscriptionId);
    return res.json({ success: true, subscription: sub, message: 'Abonnement mis en pause avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/resume — Resume subscription
router.post('/resume', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'subscriptionId est obligatoire.' });
    }

    const sub = await SubscriptionService.resume(userId, subscriptionId);
    return res.json({ success: true, subscription: sub, message: 'Abonnement réactivé avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/subscriptions/invoices — User invoice list
router.get('/invoices', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoices = (db.get('invoices') || []).filter((i) => i.userId === userId);
    return res.json({ success: true, invoices });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/invoices/:id — Single invoice detail
router.get('/invoices/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const invoices = db.get('invoices') || [];
    const invoice = invoices.find((i) => i.id === req.params.id && (i.userId === userId || ADMIN_ROLES.includes(req.user!.role)));

    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable.' });
    }

    return res.json({ success: true, invoice });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. Partner Monetization Endpoints
// ----------------------------------------------------------------------------

// GET /api/subscriptions/partner/current — Get current partner shop subscription
router.get('/partner/current', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const shops = db.get('partnerShops') || [];
    const userShop = shops.find((s) => s.ownerUserId === user.id) || shops[0];

    if (!userShop) {
      return res.status(404).json({ error: 'Boutique partenaire introuvable.' });
    }

    const partnerSubs = db.get('partnerSubscriptions') || [];
    const activeSub = partnerSubs.find((ps) => ps.shopId === userShop.id && ps.status === 'ACTIVE');

    const plans = db.get('subscriptionPlans') || [];
    const currentPlan = plans.find((p) => p.id === activeSub?.planId) || plans.find((p) => p.code === 'PARTNER_FREE');

    return res.json({
      success: true,
      shop: userShop,
      subscription: activeSub || null,
      plan: currentPlan,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/partner/subscribe — Partner Pro upgrade
router.post('/partner/subscribe', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { shopId, planId, priceId } = req.body;

    if (!shopId || !planId || !priceId) {
      return res.status(400).json({ error: 'shopId, planId et priceId sont obligatoires.' });
    }

    const sub = await SubscriptionService.subscribePartner({
      shopId,
      ownerUserId: user.id,
      planId,
      priceId,
    });

    return res.json({ success: true, subscription: sub, message: 'Abonnement partenaire activé avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. Admin Endpoints
// ----------------------------------------------------------------------------

// GET /api/subscriptions/admin/analytics — Live revenue metrics, MRR, ARR, Churn
router.get('/admin/analytics', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = SubscriptionAnalyticsService.getAnalytics();
    return res.json({ success: true, analytics });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/admin/subscriptions — List all subscriptions with plan and user info
router.get('/admin/subscriptions', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriptions = db.get('subscriptions') || [];
    const plans = db.get('subscriptionPlans') || [];
    const prices = db.get('subscriptionPrices') || [];
    const users = db.get('users') || [];

    const enriched = subscriptions.map((sub) => {
      const plan = plans.find((p) => p.id === sub.planId);
      const price = prices.find((pr) => pr.id === sub.priceId);
      const user = users.find((u) => u.id === sub.userId);
      return {
        ...sub,
        planName: plan?.name || 'Inconnu',
        planCode: plan?.code || 'UNKNOWN',
        userEmail: user?.email || 'N/A',
        priceAmount: price?.amount || 0,
        priceInterval: price?.interval || 'MONTH',
        currency: price?.currency || 'EUR',
      };
    });

    return res.json({ success: true, subscriptions: enriched });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/subscriptions/admin/invoices — List all invoices
router.get('/admin/invoices', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = db.get('invoices') || [];
    return res.json({ success: true, invoices });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/admin/refund — Refund subscription invoice
router.post('/admin/refund', requireAuth, requireRole(...ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    const { subscriptionId, invoiceId, reason } = req.body;

    if (!subscriptionId || !invoiceId || !reason) {
      return res.status(400).json({ error: 'subscriptionId, invoiceId et reason sont obligatoires.' });
    }

    const result = await SubscriptionService.refundSubscription({
      subscriptionId,
      invoiceId,
      reason,
      adminUserId: adminUser.id,
    });

    return res.json({ success: true, ...result, message: 'Remboursement traité avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/subscriptions/admin/grant — Admin manual premium grant
router.post('/admin/grant', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminUser = req.user!;
    const { userId, planId, durationDays = 30, reason, source = 'ADMIN' } = req.body;

    if (!userId || !planId || !reason) {
      return res.status(400).json({ error: 'userId, planId et reason sont obligatoires pour un octroi manuel.' });
    }

    const grant = SubscriptionService.grantSubscription({
      userId,
      planId,
      durationDays: Number(durationDays),
      reason,
      adminUserId: adminUser.id,
      adminEmail: adminUser.email,
      source,
    });

    return res.json({ success: true, grant, message: 'Accès offert accordé avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// GET /api/subscriptions/admin/grants — List all grants
router.get('/admin/grants', requireAuth, requireRole(...ADMIN_ROLES), (req: AuthenticatedRequest, res: Response) => {
  try {
    const grants = db.get('subscriptionGrants') || [];
    const users = db.get('users') || [];
    const plans = db.get('subscriptionPlans') || [];

    const enriched = grants.map((g) => {
      const u = users.find((usr) => usr.id === g.userId);
      const p = plans.find((pln) => pln.id === g.planId);
      return {
        ...g,
        userEmail: u?.email || 'N/A',
        planName: p?.name || 'Inconnu',
      };
    });

    return res.json({ success: true, grants: enriched });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/subscriptions/admin/renew/:id — Test or force renewal
router.post('/admin/renew/:id', requireAuth, requireRole(...ADMIN_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await SubscriptionService.renewSubscription(req.params.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.json({ success: true, ...result, message: 'Renouvellement simulé avec succès.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
