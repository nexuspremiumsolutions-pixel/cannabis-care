import { db } from '../../db/database';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionPrice,
  SubscriptionEvent,
  SubscriptionEventType,
  Invoice,
  SubscriptionPayment,
  SubscriptionGrant,
  PartnerSubscription,
  TrialEligibility,
  FinancialLedgerEntry,
  IdempotencyKey,
  Notification,
} from '../../../src/types/entities';
import { PaymentProviderRegistry } from '../payment/paymentProviderAdapter';
import { TaxService } from './taxService';

export interface SubscribeParams {
  userId: string;
  planId: string;
  priceId: string;
  country?: string;
  isTrial?: boolean;
  paymentMethod?: string;
  cardLast4?: string;
  paymentIntentId?: string;
  idempotencyKey?: string;
}

export interface UpgradeParams {
  userId: string;
  subscriptionId: string;
  newPriceId: string;
  idempotencyKey?: string;
}

export interface DowngradeParams {
  userId: string;
  subscriptionId: string;
  newPriceId: string;
}

export interface CancelParams {
  userId: string;
  subscriptionId: string;
  immediate?: boolean;
  reason?: string;
}

export interface GrantParams {
  userId: string;
  planId: string;
  durationDays: number;
  reason: string;
  adminUserId: string;
  adminEmail?: string;
  source?: 'ADMIN' | 'PROMO' | 'PARTNERSHIP';
}

export class SubscriptionService {
  /**
   * Helper: Check idempotency key
   */
  private static checkIdempotency(key?: string): { isDuplicate: boolean; cachedResult?: any } {
    if (!key) return { isDuplicate: false };
    const keys = db.get('idempotencyKeys') || [];
    const existing = keys.find((k) => k.key === key);
    if (existing) {
      return { isDuplicate: true, cachedResult: existing.responseBody };
    }
    return { isDuplicate: false };
  }

  private static recordIdempotency(key: string, endpoint: string, responseBody: any) {
    const keys = db.get('idempotencyKeys') || [];
    const record: IdempotencyKey = {
      key,
      operation: endpoint,
      userId: 'system',
      status: 'COMPLETED',
      responseBody,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    };
    keys.unshift(record);
    db.set('idempotencyKeys', keys);
  }

  /**
   * Generate sequential or timestamped invoice number
   */
  public static generateInvoiceNumber(): string {
    const invoices = db.get('invoices') || [];
    const count = invoices.length + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${count.toString().padStart(5, '0')}`;
  }

  /**
   * List available plans and prices
   */
  public static getPlansAndPrices(target: 'USER' | 'PARTNER' = 'USER', currency?: string) {
    const allPlans = db.get('subscriptionPlans') || [];
    const allPrices = db.get('subscriptionPrices') || [];

    const filteredPlans = allPlans
      .filter((p) => p.status === 'ACTIVE' && p.target === target)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return filteredPlans.map((plan) => {
      let prices = allPrices.filter((pr) => pr.planId === plan.id && pr.status === 'ACTIVE');
      if (currency) {
        prices = prices.filter((pr) => pr.currency.toUpperCase() === currency.toUpperCase());
      }
      return {
        ...plan,
        prices,
      };
    });
  }

  /**
   * Check if a user is eligible for a free trial
   */
  public static checkTrialEligibility(userId: string): TrialEligibility {
    const subscriptions = db.get('subscriptions') || [];
    const userSubs = subscriptions.filter((s) => s.userId === userId);

    const reasons: string[] = [];
    let previousTrialUsedAt: string | undefined = undefined;

    // Check if user has had a trial before
    for (const s of userSubs) {
      if (s.trialStart) {
        previousTrialUsedAt = s.trialStart;
        reasons.push('Un essai gratuit a déjà été utilisé sur ce compte.');
        break;
      }
      if (s.status === 'ACTIVE' || s.status === 'CANCELED' || s.status === 'EXPIRED') {
        reasons.push('Ce compte a déjà bénéficié d’un abonnement.');
        break;
      }
    }

    const isEligible = reasons.length === 0;

    return {
      userId,
      isEligible,
      reasons: isEligible ? ['Éligible à la période d’essai gratuite de 14 jours.'] : reasons,
      previousTrialUsedAt,
      previousSubscriptionCount: userSubs.length,
    };
  }

  /**
   * Subscribe to a plan (Trial or Direct Payment)
   */
  public static async subscribe(params: SubscribeParams) {
    const { userId, planId, priceId, country = 'FR', isTrial = false, paymentMethod = 'STRIPE_CARD', paymentIntentId, idempotencyKey } = params;

    // 1. Check Idempotency
    if (idempotencyKey) {
      const { isDuplicate, cachedResult } = this.checkIdempotency(idempotencyKey);
      if (isDuplicate) {
        return cachedResult;
      }
    }

    // 2. Validate plan and price
    const plans = db.get('subscriptionPlans') || [];
    const prices = db.get('subscriptionPrices') || [];

    const plan = plans.find((p) => p.id === planId && p.status === 'ACTIVE');
    if (!plan) throw new Error('Plan introuvable ou inactif.');

    const price = prices.find((pr) => pr.id === priceId && pr.status === 'ACTIVE');
    if (!price) throw new Error('Tarif introuvable ou inactif.');

    // 3. Prevent duplicate active subscriptions
    const existingSubs = db.get('subscriptions') || [];
    const activeSub = existingSubs.find((s) => s.userId === userId && (s.status === 'ACTIVE' || s.status === 'TRIALING'));
    if (activeSub) {
      throw new Error('Vous disposez déjà d’un abonnement actif. Utilisez l’option de changement de formule.');
    }

    const now = new Date();
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let status: Subscription['status'] = 'ACTIVE';
    let trialStart: string | undefined = undefined;
    let trialEnd: string | undefined = undefined;
    let periodStart = now.toISOString();
    let periodEnd: string;

    // 4. Trial evaluation
    if (isTrial && price.trialDays > 0) {
      const eligibility = this.checkTrialEligibility(userId);
      if (!eligibility.isEligible) {
        throw new Error(`Inéligible à l'essai gratuit : ${eligibility.reasons.join(' ')}`);
      }
      status = 'TRIALING';
      trialStart = now.toISOString();
      const trialEndDate = new Date(now.getTime() + price.trialDays * 24 * 3600000);
      trialEnd = trialEndDate.toISOString();
      periodEnd = trialEnd;
    } else {
      // Direct paid subscription
      const periodEndDate = new Date(now.getTime());
      if (price.interval === 'YEAR') {
        periodEndDate.setFullYear(periodEndDate.getFullYear() + price.intervalCount);
      } else {
        periodEndDate.setMonth(periodEndDate.getMonth() + price.intervalCount);
      }
      periodEnd = periodEndDate.toISOString();
    }

    // 5. Build Subscription entity
    const isRealStripePayment = Boolean(paymentIntentId && paymentIntentId.startsWith('pi_') && !paymentIntentId.startsWith('pi_sub_'));
    const newSubscription: Subscription = {
      id: subId,
      userId,
      planId: plan.id,
      priceId: price.id,
      status,
      provider: isRealStripePayment ? 'STRIPE' : 'SIMULATED',
      providerSubscriptionId: paymentIntentId || `sim_sub_${subId}`,
      providerCustomerId: `cus_${userId}`,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      trialStart,
      trialEnd,
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // 6. Tax and Invoice Calculation
    const taxCalc = TaxService.calculateInclusiveTax(price.amount, country);
    const invoiceNumber = this.generateInvoiceNumber();
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      userId,
      subscriptionId: subId,
      providerInvoiceId: paymentIntentId || `sim_inv_${invoiceId}`,
      invoiceNumber,
      status: status === 'TRIALING' ? 'OPEN' : 'PAID',
      amountSubtotal: status === 'TRIALING' ? 0 : taxCalc.subtotal,
      taxAmount: status === 'TRIALING' ? 0 : taxCalc.taxAmount,
      totalAmount: status === 'TRIALING' ? 0 : price.amount,
      currency: price.currency,
      issuedAt: now.toISOString(),
      dueAt: now.toISOString(),
      paidAt: status === 'TRIALING' ? undefined : now.toISOString(),
      metadata: {
        planCode: plan.code,
        planName: plan.name,
        priceInterval: price.interval,
        country: taxCalc.country,
        taxRate: taxCalc.taxRate,
        isTrial,
        paymentMethod,
      },
    };

    let paymentRecord: SubscriptionPayment | undefined = undefined;

    // 7. Payment and Ledger Entries if Paid
    if (status === 'ACTIVE' && price.amount > 0) {
      const paymentId = `spay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const txId = paymentIntentId || `txn_sub_${subId}`;
      paymentRecord = {
        id: paymentId,
        subscriptionId: subId,
        paymentIntentId: txId,
        transactionId: txId,
        invoiceId,
        periodStart,
        periodEnd,
        amount: price.amount,
        currency: price.currency,
        status: 'SUCCEEDED',
        createdAt: now.toISOString(),
      };

      // Ledger Integration (Module 10)
      const ledger = db.get('financialLedger') || [];
      const ledgerRev: FinancialLedgerEntry = {
        id: `fled_sub_rev_${Date.now()}`,
        orderId: subId,
        paymentTransactionId: paymentRecord.transactionId,
        type: 'SUBSCRIPTION_REVENUE',
        direction: 'CREDIT',
        amount: price.amount,
        currency: price.currency,
        status: 'POSTED',
        description: `Souscription abonnement ${plan.name} (${price.interval}) - ${invoiceNumber}`,
        metadata: { userId, planId: plan.id, priceId: price.id, provider: isRealStripePayment ? 'STRIPE' : 'SIMULATED' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const ledgerTax: FinancialLedgerEntry = {
        id: `fled_sub_tax_${Date.now()}`,
        orderId: subId,
        paymentTransactionId: paymentRecord.transactionId,
        type: 'SUBSCRIPTION_TAX',
        direction: 'DEBIT',
        amount: taxCalc.taxAmount,
        currency: price.currency,
        status: 'POSTED',
        description: `TVA sur abonnement (${taxCalc.country} ${(taxCalc.taxRate * 100).toFixed(1)}%) - ${invoiceNumber}`,
        metadata: { userId, taxRate: taxCalc.taxRate, country: taxCalc.country },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Estimated PSP processing fee (e.g. 1.4% + 0.25€)
      const pspFee = Math.round((price.amount * 0.014 + 0.25) * 100) / 100;
      const ledgerPsp: FinancialLedgerEntry = {
        id: `fled_sub_psp_${Date.now()}`,
        orderId: subId,
        paymentTransactionId: paymentRecord.transactionId,
        type: 'SUBSCRIPTION_PAYMENT_PROCESSING_FEE',
        direction: 'DEBIT',
        amount: pspFee,
        currency: price.currency,
        status: 'POSTED',
        description: `Frais de passerelle de paiement abonnement - ${invoiceNumber}`,
        metadata: { userId, provider: isRealStripePayment ? 'STRIPE' : 'SIMULATED' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      ledger.unshift(ledgerRev, ledgerTax, ledgerPsp);
      db.set('financialLedger', ledger);

      const payments = db.get('subscriptionPayments') || [];
      payments.unshift(paymentRecord);
      db.set('subscriptionPayments', payments);
    }

    // 8. Record Subscription Event
    const events = db.get('subscriptionEvents') || [];
    const event: SubscriptionEvent = {
      id: `sevt_${Date.now()}`,
      subscriptionId: subId,
      userId,
      type: status === 'TRIALING' ? 'TRIAL_STARTED' : 'ACTIVATED',
      newPlanId: plan.id,
      metadata: {
        priceAmount: price.amount,
        currency: price.currency,
        interval: price.interval,
        isTrial,
      },
      createdAt: now.toISOString(),
    };
    events.unshift(event);
    db.set('subscriptionEvents', events);

    // 9. Save Subscription and Invoice
    existingSubs.unshift(newSubscription);
    db.set('subscriptions', existingSubs);

    const invoices = db.get('invoices') || [];
    invoices.unshift(newInvoice);
    db.set('invoices', invoices);

    // 10. Send In-App Notification
    const notifs = db.get('notifications') || [];
    const notif: Notification = {
      id: `notif_sub_${Date.now()}`,
      userId,
      title: status === 'TRIALING' ? 'Période d’essai activée !' : 'Abonnement confirmé !',
      message:
        status === 'TRIALING'
          ? `Votre essai gratuit de 14 jours au plan ${plan.name} est en cours jusqu’au ${new Date(periodEnd).toLocaleDateString('fr-FR')}.`
          : `Bienvenue dans votre formule ${plan.name}. Toutes les fonctionnalités premium sont débloquées.`,
      type: 'milestone',
      isRead: false,
      createdAt: now.toISOString(),
    };
    notifs.unshift(notif);
    db.set('notifications', notifs);

    const result = {
      success: true,
      subscription: newSubscription,
      invoice: newInvoice,
      payment: paymentRecord,
      message: status === 'TRIALING' ? 'Période d’essai gratuite activée avec succès.' : 'Abonnement activé avec succès.',
    };

    if (idempotencyKey) {
      this.recordIdempotency(idempotencyKey, '/api/subscriptions/subscribe', result);
    }

    return result;
  }

  /**
   * Upgrade to a higher plan or annual tier
   */
  public static async upgrade(params: UpgradeParams) {
    const { userId, subscriptionId, newPriceId, idempotencyKey } = params;

    if (idempotencyKey) {
      const { isDuplicate, cachedResult } = this.checkIdempotency(idempotencyKey);
      if (isDuplicate) return cachedResult;
    }

    const subscriptions = db.get('subscriptions') || [];
    const subIndex = subscriptions.findIndex((s) => s.id === subscriptionId && s.userId === userId);
    if (subIndex === -1) throw new Error('Abonnement introuvable.');

    const currentSub = subscriptions[subIndex];
    const prices = db.get('subscriptionPrices') || [];
    const plans = db.get('subscriptionPlans') || [];

    const newPrice = prices.find((p) => p.id === newPriceId && p.status === 'ACTIVE');
    if (!newPrice) throw new Error('Nouveau tarif introuvable.');

    const newPlan = plans.find((p) => p.id === newPrice.planId);
    if (!newPlan) throw new Error('Nouveau plan introuvable.');

    const previousPlanId = currentSub.planId;
    const now = new Date();

    // Reset period for the upgrade
    const periodEndDate = new Date(now.getTime());
    if (newPrice.interval === 'YEAR') {
      periodEndDate.setFullYear(periodEndDate.getFullYear() + newPrice.intervalCount);
    } else {
      periodEndDate.setMonth(periodEndDate.getMonth() + newPrice.intervalCount);
    }

    currentSub.planId = newPlan.id;
    currentSub.priceId = newPrice.id;
    currentSub.status = 'ACTIVE';
    currentSub.currentPeriodStart = now.toISOString();
    currentSub.currentPeriodEnd = periodEndDate.toISOString();
    currentSub.cancelAtPeriodEnd = false;
    currentSub.updatedAt = now.toISOString();

    subscriptions[subIndex] = currentSub;
    db.set('subscriptions', subscriptions);

    // Create Invoice for upgrade
    const invoiceNumber = this.generateInvoiceNumber();
    const invoiceId = `inv_upg_${Date.now()}`;
    const taxCalc = TaxService.calculateInclusiveTax(newPrice.amount, 'FR');

    const newInvoice: Invoice = {
      id: invoiceId,
      userId,
      subscriptionId,
      providerInvoiceId: `sim_inv_${invoiceId}`,
      invoiceNumber,
      status: 'PAID',
      amountSubtotal: taxCalc.subtotal,
      taxAmount: taxCalc.taxAmount,
      totalAmount: newPrice.amount,
      currency: newPrice.currency,
      issuedAt: now.toISOString(),
      dueAt: now.toISOString(),
      paidAt: now.toISOString(),
      metadata: {
        type: 'UPGRADE',
        newPlanName: newPlan.name,
      },
    };

    const invoices = db.get('invoices') || [];
    invoices.unshift(newInvoice);
    db.set('invoices', invoices);

    // Record Event
    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_upg_${Date.now()}`,
      subscriptionId,
      userId,
      type: 'UPGRADED',
      previousPlanId,
      newPlanId: newPlan.id,
      metadata: { newPrice: newPrice.amount, currency: newPrice.currency },
      createdAt: now.toISOString(),
    });
    db.set('subscriptionEvents', events);

    // Post Ledger Entry
    const ledger = db.get('financialLedger') || [];
    ledger.unshift({
      id: `fled_sub_upg_${Date.now()}`,
      orderId: subscriptionId,
      type: 'SUBSCRIPTION_REVENUE',
      direction: 'CREDIT',
      amount: newPrice.amount,
      currency: newPrice.currency,
      status: 'POSTED',
      description: `Surclassement vers ${newPlan.name} (${newPrice.interval}) - ${invoiceNumber}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    db.set('financialLedger', ledger);

    const result = {
      success: true,
      subscription: currentSub,
      invoice: newInvoice,
      message: `Votre abonnement a été mis à niveau avec succès vers ${newPlan.name}.`,
    };

    if (idempotencyKey) {
      this.recordIdempotency(idempotencyKey, '/api/subscriptions/upgrade', result);
    }

    return result;
  }

  /**
   * Downgrade plan (effective at period end, never deletes user data)
   */
  public static async downgrade(params: DowngradeParams) {
    const { userId, subscriptionId, newPriceId } = params;

    const subscriptions = db.get('subscriptions') || [];
    const subIndex = subscriptions.findIndex((s) => s.id === subscriptionId && s.userId === userId);
    if (subIndex === -1) throw new Error('Abonnement introuvable.');

    const currentSub = subscriptions[subIndex];
    const prices = db.get('subscriptionPrices') || [];
    const plans = db.get('subscriptionPlans') || [];

    const newPrice = prices.find((p) => p.id === newPriceId);
    if (!newPrice) throw new Error('Tarif introuvable.');

    const newPlan = plans.find((p) => p.id === newPrice.planId);
    if (!newPlan) throw new Error('Plan introuvable.');

    // Schedule change at period end
    currentSub.cancelAtPeriodEnd = true;
    currentSub.updatedAt = new Date().toISOString();

    subscriptions[subIndex] = currentSub;
    db.set('subscriptions', subscriptions);

    // Log Event
    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_down_${Date.now()}`,
      subscriptionId,
      userId,
      type: 'DOWNGRADED',
      previousPlanId: currentSub.planId,
      newPlanId: newPlan.id,
      metadata: {
        scheduledForDate: currentSub.currentPeriodEnd,
        targetPlanCode: newPlan.code,
      },
      createdAt: new Date().toISOString(),
    });
    db.set('subscriptionEvents', events);

    return {
      success: true,
      subscription: currentSub,
      message: `Votre passage à la formule ${newPlan.name} prendra effet à la fin de votre période en cours (${new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}). Toutes vos données historiques et bilans restent intégralement préservés.`,
    };
  }

  /**
   * Cancel subscription (period end or immediate)
   */
  public static async cancel(params: CancelParams) {
    const { userId, subscriptionId, immediate = false, reason = 'Demande utilisateur' } = params;

    const subscriptions = db.get('subscriptions') || [];
    const subIndex = subscriptions.findIndex((s) => s.id === subscriptionId && s.userId === userId);
    if (subIndex === -1) throw new Error('Abonnement introuvable.');

    const currentSub = subscriptions[subIndex];
    const now = new Date();

    if (immediate) {
      currentSub.status = 'CANCELED';
      currentSub.canceledAt = now.toISOString();
      currentSub.endedAt = now.toISOString();
    } else {
      currentSub.cancelAtPeriodEnd = true;
      currentSub.canceledAt = now.toISOString();
    }
    currentSub.updatedAt = now.toISOString();

    subscriptions[subIndex] = currentSub;
    db.set('subscriptions', subscriptions);

    // Log Event
    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_cancel_${Date.now()}`,
      subscriptionId,
      userId,
      type: immediate ? 'CANCELED' : 'CANCEL_REQUESTED',
      metadata: { reason, immediate },
      createdAt: now.toISOString(),
    });
    db.set('subscriptionEvents', events);

    return {
      success: true,
      subscription: currentSub,
      message: immediate
        ? 'Votre abonnement a été résilié immédiatement.'
        : `Votre abonnement sera résilié à la fin de votre cycle de facturation (${new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}). Vous conservez tous vos droits jusque-là.`,
    };
  }

  /**
   * Pause subscription
   */
  public static async pause(userId: string, subscriptionId: string) {
    const subscriptions = db.get('subscriptions') || [];
    const subIndex = subscriptions.findIndex((s) => s.id === subscriptionId && s.userId === userId);
    if (subIndex === -1) throw new Error('Abonnement introuvable.');

    const sub = subscriptions[subIndex];
    if (sub.status !== 'ACTIVE') throw new Error('Seul un abonnement actif peut être mis en pause.');

    const now = new Date().toISOString();
    sub.status = 'PAUSED';
    sub.pausedAt = now;
    sub.updatedAt = now;

    subscriptions[subIndex] = sub;
    db.set('subscriptions', subscriptions);

    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_pause_${Date.now()}`,
      subscriptionId,
      userId,
      type: 'PAUSED',
      createdAt: now,
    });
    db.set('subscriptionEvents', events);

    return sub;
  }

  /**
   * Resume subscription
   */
  public static async resume(userId: string, subscriptionId: string) {
    const subscriptions = db.get('subscriptions') || [];
    const subIndex = subscriptions.findIndex((s) => s.id === subscriptionId && s.userId === userId);
    if (subIndex === -1) throw new Error('Abonnement introuvable.');

    const sub = subscriptions[subIndex];
    if (sub.status !== 'PAUSED') throw new Error('L’abonnement n’est pas en pause.');

    const now = new Date();
    sub.status = 'ACTIVE';
    sub.pausedAt = undefined;
    sub.updatedAt = now.toISOString();

    subscriptions[subIndex] = sub;
    db.set('subscriptions', subscriptions);

    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_resume_${Date.now()}`,
      subscriptionId,
      userId,
      type: 'RESUMED',
      createdAt: now.toISOString(),
    });
    db.set('subscriptionEvents', events);

    return sub;
  }

  /**
   * Automatic or on-demand renewal handler
   */
  public static async renewSubscription(subscriptionId: string) {
    const subscriptions = db.get('subscriptions') || [];
    const subIndex = subscriptions.findIndex((s) => s.id === subscriptionId);
    if (subIndex === -1) return { success: false, error: 'Abonnement introuvable' };

    const sub = subscriptions[subIndex];
    const prices = db.get('subscriptionPrices') || [];
    const plans = db.get('subscriptionPlans') || [];

    const price = prices.find((p) => p.id === sub.priceId);
    const plan = plans.find((p) => p.id === sub.planId);
    if (!price || !plan) return { success: false, error: 'Plan ou tarif invalide' };

    const now = new Date();
    const periodStartDate = new Date(sub.currentPeriodEnd);
    const periodEndDate = new Date(periodStartDate.getTime());

    if (price.interval === 'YEAR') {
      periodEndDate.setFullYear(periodEndDate.getFullYear() + price.intervalCount);
    } else {
      periodEndDate.setMonth(periodEndDate.getMonth() + price.intervalCount);
    }

    sub.status = 'ACTIVE';
    sub.currentPeriodStart = periodStartDate.toISOString();
    sub.currentPeriodEnd = periodEndDate.toISOString();
    sub.updatedAt = now.toISOString();

    subscriptions[subIndex] = sub;
    db.set('subscriptions', subscriptions);

    // Create Invoice
    const invoiceNumber = this.generateInvoiceNumber();
    const invoiceId = `inv_ren_${Date.now()}`;
    const taxCalc = TaxService.calculateInclusiveTax(price.amount, 'FR');

    const newInvoice: Invoice = {
      id: invoiceId,
      userId: sub.userId,
      subscriptionId,
      providerInvoiceId: `sim_inv_${invoiceId}`,
      invoiceNumber,
      status: 'PAID',
      amountSubtotal: taxCalc.subtotal,
      taxAmount: taxCalc.taxAmount,
      totalAmount: price.amount,
      currency: price.currency,
      issuedAt: now.toISOString(),
      dueAt: now.toISOString(),
      paidAt: now.toISOString(),
      metadata: {
        type: 'RENEWAL',
        planName: plan.name,
      },
    };

    const invoices = db.get('invoices') || [];
    invoices.unshift(newInvoice);
    db.set('invoices', invoices);

    // Ledger entry
    const ledger = db.get('financialLedger') || [];
    ledger.unshift({
      id: `fled_sub_ren_${Date.now()}`,
      orderId: subscriptionId,
      type: 'SUBSCRIPTION_REVENUE',
      direction: 'CREDIT',
      amount: price.amount,
      currency: price.currency,
      status: 'POSTED',
      description: `Renouvellement abonnement ${plan.name} (${price.interval}) - ${invoiceNumber}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    db.set('financialLedger', ledger);

    // Record Event
    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_ren_${Date.now()}`,
      subscriptionId,
      userId: sub.userId,
      type: 'RENEWED',
      metadata: { amount: price.amount, invoiceId },
      createdAt: now.toISOString(),
    });
    db.set('subscriptionEvents', events);

    return { success: true, subscription: sub, invoice: newInvoice };
  }

  /**
   * Refund a subscription payment
   */
  public static async refundSubscription(params: {
    subscriptionId: string;
    invoiceId: string;
    reason: string;
    adminUserId: string;
  }) {
    const { subscriptionId, invoiceId, reason, adminUserId } = params;

    const invoices = db.get('invoices') || [];
    const invIndex = invoices.findIndex((i) => i.id === invoiceId);
    if (invIndex === -1) throw new Error('Facture introuvable.');

    const invoice = invoices[invIndex];
    if (invoice.status === 'REFUNDED') throw new Error('Cette facture a déjà été remboursée.');

    const now = new Date().toISOString();
    invoice.status = 'REFUNDED';
    invoice.refundedAt = now;
    invoices[invIndex] = invoice;
    db.set('invoices', invoices);

    // Financial Ledger entry for refund
    const ledger = db.get('financialLedger') || [];
    ledger.unshift({
      id: `fled_sub_ref_${Date.now()}`,
      orderId: subscriptionId,
      type: 'SUBSCRIPTION_REFUND',
      direction: 'DEBIT',
      amount: invoice.totalAmount,
      currency: invoice.currency,
      status: 'POSTED',
      description: `Remboursement abonnement facture ${invoice.invoiceNumber} - Motif: ${reason}`,
      metadata: { adminUserId, reason },
      createdAt: now,
      updatedAt: now,
    });
    db.set('financialLedger', ledger);

    // Record Event
    const events = db.get('subscriptionEvents') || [];
    events.unshift({
      id: `sevt_ref_${Date.now()}`,
      subscriptionId,
      userId: invoice.userId,
      type: 'REFUNDED',
      metadata: { amount: invoice.totalAmount, reason, adminUserId },
      createdAt: now,
    });
    db.set('subscriptionEvents', events);

    return { success: true, invoice };
  }

  /**
   * Grant free premium subscription to user (Admin manual grant)
   */
  public static grantSubscription(params: GrantParams): SubscriptionGrant {
    const { userId, planId, durationDays, reason, adminUserId, adminEmail, source = 'ADMIN' } = params;

    const plans = db.get('subscriptionPlans') || [];
    const plan = plans.find((p) => p.id === planId);
    if (!plan) throw new Error('Plan introuvable.');

    const now = new Date();
    const endAt = new Date(now.getTime() + durationDays * 24 * 3600000);

    const grant: SubscriptionGrant = {
      id: `grant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      grantedBy: adminUserId,
      reason,
      planId,
      startAt: now.toISOString(),
      endAt: endAt.toISOString(),
      source,
      status: 'ACTIVE',
      createdAt: now.toISOString(),
    };

    const grants = db.get('subscriptionGrants') || [];
    grants.unshift(grant);
    db.set('subscriptionGrants', grants);

    // Log admin audit
    db.logAudit('GRANT_SUBSCRIPTION', 'subscriptionGrants', adminUserId, {
      targetUserId: userId,
      planId,
      durationDays,
      reason,
      adminEmail,
    });

    // Notify user
    const notifs = db.get('notifications') || [];
    notifs.unshift({
      id: `notif_grant_${Date.now()}`,
      userId,
      title: 'Privilège Premium accordé !',
      message: `Vous bénéficiez d’un accès complet au plan ${plan.name} pour une durée de ${durationDays} jours (${reason}).`,
      type: 'milestone',
      isRead: false,
      createdAt: now.toISOString(),
    });
    db.set('notifications', notifs);

    return grant;
  }

  /**
   * Subscribe a partner shop to Pro monetization plan
   */
  public static async subscribePartner(params: {
    shopId: string;
    ownerUserId: string;
    planId: string;
    priceId: string;
  }): Promise<PartnerSubscription> {
    const { shopId, ownerUserId, planId, priceId } = params;

    const plans = db.get('subscriptionPlans') || [];
    const prices = db.get('subscriptionPrices') || [];

    const plan = plans.find((p) => p.id === planId && p.target === 'PARTNER');
    if (!plan) throw new Error('Plan partenaire introuvable.');

    const price = prices.find((p) => p.id === priceId);
    if (!price) throw new Error('Tarif partenaire introuvable.');

    const now = new Date();
    const periodEnd = new Date(now.getTime());
    if (price.interval === 'YEAR') {
      periodEnd.setFullYear(periodEnd.getFullYear() + price.intervalCount);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + price.intervalCount);
    }

    const partnerSub: PartnerSubscription = {
      id: `psub_${Date.now()}`,
      shopId,
      ownerUserId,
      planId,
      priceId,
      status: 'ACTIVE',
      provider: 'SIMULATED',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const partnerSubs = db.get('partnerSubscriptions') || [];
    partnerSubs.unshift(partnerSub);
    db.set('partnerSubscriptions', partnerSubs);

    // Ledger
    if (price.amount > 0) {
      const ledger = db.get('financialLedger') || [];
      ledger.unshift({
        id: `fled_psub_${Date.now()}`,
        orderId: shopId,
        type: 'SUBSCRIPTION_REVENUE',
        direction: 'CREDIT',
        amount: price.amount,
        currency: price.currency,
        status: 'POSTED',
        description: `Abonnement Partenaire Pro pour boutique ${shopId}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      db.set('financialLedger', ledger);
    }

    return partnerSub;
  }
}
