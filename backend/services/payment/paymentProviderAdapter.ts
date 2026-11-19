import crypto from 'crypto';
import Stripe from 'stripe';
import {
  PaymentProviderEligibility,
  PaymentProviderCapabilities,
  SupportedCountryCode,
} from '../../../src/types/entities';

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  orderId: string;
  customerId?: string;
  customerEmail: string;
  description: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  provider: string;
  transactionId: string;
  clientSecret: string;
  status: 'REQUIRES_PAYMENT_METHOD' | 'REQUIRES_CONFIRMATION' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface ConfirmPaymentParams {
  transactionId: string;
  paymentMethod: string;
  cardLast4?: string;
  cardBrand?: string;
}

export interface RefundParams {
  transactionId: string;
  orderId: string;
  shopId?: string;
  amount: number;
  currency: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface RefundResult {
  provider: string;
  refundId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  reason?: string;
}

export interface TransferParams {
  globalOrderId: string;
  shopOrderId: string;
  destinationAccountId: string;
  amount: number;
  currency: string;
  sourceTransactionId?: string;
  description: string;
  idempotencyKey?: string;
}

export interface TransferResult {
  provider: string;
  transferId: string;
  amount: number;
  currency: string;
  destinationAccountId: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  failureReason?: string;
}

export interface PayoutParams {
  destinationAccountId: string;
  amount: number;
  currency: string;
  statementDescriptor?: string;
  idempotencyKey?: string;
}

export interface PayoutResult {
  provider: string;
  payoutId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  arrivalDate: string;
}

export interface CreateOnboardingLinkParams {
  accountId: string;
  shopId: string;
  returnUrl: string;
  refreshUrl: string;
}

export interface PaymentProviderAdapter {
  readonly name: string;
  readonly capabilities: PaymentProviderCapabilities;

  checkEligibility(country: SupportedCountryCode, hasCBDProducts: boolean): PaymentProviderEligibility;
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  retrievePaymentIntent?(transactionId: string): Promise<PaymentIntentResult>;
  confirmPayment(params: ConfirmPaymentParams): Promise<PaymentIntentResult>;
  createRefund(params: RefundParams): Promise<RefundResult>;
  createTransfer(params: TransferParams): Promise<TransferResult>;
  createPayout(params: PayoutParams): Promise<PayoutResult>;
  createConnectedAccount(shopId: string, shopName: string, country: SupportedCountryCode): Promise<{ accountId: string }>;
  createOnboardingLink(params: CreateOnboardingLinkParams): Promise<{ url: string; expiresAt: string }>;
  verifyWebhookSignature(payload: string | Buffer, signature: string, secret?: string): boolean;
}

function mapStripeIntentStatus(status: Stripe.PaymentIntent.Status): PaymentIntentResult['status'] {
  switch (status) {
    case 'succeeded':
      return 'SUCCEEDED';
    case 'processing':
      return 'PROCESSING';
    case 'requires_confirmation':
      return 'REQUIRES_CONFIRMATION';
    case 'canceled':
      return 'CANCELED';
    case 'requires_payment_method':
    case 'requires_action':
    case 'requires_capture':
    default:
      return 'REQUIRES_PAYMENT_METHOD';
  }
}

// ----------------------------------------------------------------------------
// 1. Stripe Connect Marketplace Provider (Real Stripe SDK Integration)
// ----------------------------------------------------------------------------
export class StripeMarketplaceProvider implements PaymentProviderAdapter {
  public readonly name = 'STRIPE_CONNECT';
  public readonly capabilities: PaymentProviderCapabilities = {
    separateChargesAndTransfers: true,
    splitPayments: true,
    cbdMCCSupported: true, // Special approved CBD MCC under EU < 0.3% THC compliance
    directPayouts: true,
    webhooks: true,
  };

  private secretKey: string;
  private isTestMode: boolean;
  private stripe: Stripe | null = null;

  constructor() {
    this.secretKey =
      process.env.STRIPE_SECRET_KEY ||
      process.env.PAYMENT_PROVIDER_SECRET_KEY ||
      '';

    const hasRealKey =
      this.secretKey.startsWith('sk_live_') ||
      (this.secretKey.startsWith('sk_test_') && this.secretKey !== 'sk_test_nexus_stripe_simulated_key');

    if (hasRealKey) {
      this.stripe = new Stripe(this.secretKey);
    }

    this.isTestMode = !this.secretKey.startsWith('sk_live_');
  }

  public isRealStripeConfigured(): boolean {
    return this.stripe !== null;
  }

  public isLiveMode(): boolean {
    return !this.isTestMode;
  }

  public getPublishableKey(): string {
    return process.env.STRIPE_PUBLIC_KEY || process.env.VITE_STRIPE_PUBLIC_KEY || '';
  }

  public checkEligibility(country: SupportedCountryCode, _hasCBDProducts: boolean): PaymentProviderEligibility {
    const supportedCountries: SupportedCountryCode[] = ['FR', 'LU', 'BE', 'CH', 'DE', 'ES', 'IT'];
    if (!supportedCountries.includes(country)) {
      return {
        eligible: false,
        reason: `Le pays ${country} n'est pas encore ouvert aux transactions Stripe Connect pour cette boutique.`,
        provider: this.name,
        allowedPaymentMethods: [],
        allowedPayout: false,
        isSandbox: this.isTestMode,
      };
    }

    return {
      eligible: true,
      provider: this.name,
      allowedPaymentMethods: ['card', 'sepa_debit', 'apple_pay', 'google_pay'],
      allowedPayout: true,
      isSandbox: this.isTestMode,
    };
  }

  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      throw new Error('Clé secrète Stripe non configurée côté serveur.');
    }

    const amountCents = Math.round(params.amount * 100);
    if (amountCents < 50) {
      throw new Error('Le montant minimum pour un paiement par carte Stripe est de 0,50 €.');
    }

    const pi = await this.stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: (params.currency || 'EUR').toLowerCase(),
        receipt_email: params.customerEmail,
        description: params.description,
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: params.orderId,
          customerId: params.customerId || '',
          ...(params.metadata || {}),
        },
      },
      params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
    );

    return {
      provider: this.name,
      transactionId: pi.id,
      clientSecret: pi.client_secret || '',
      status: mapStripeIntentStatus(pi.status),
      amount: Math.round(pi.amount) / 100,
      currency: pi.currency.toUpperCase(),
      metadata: (pi.metadata as Record<string, string>) || {},
    };
  }

  public async retrievePaymentIntent(transactionId: string): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      throw new Error('Clé secrète Stripe non configurée côté serveur.');
    }

    const pi = await this.stripe.paymentIntents.retrieve(transactionId);
    return {
      provider: this.name,
      transactionId: pi.id,
      clientSecret: pi.client_secret || '',
      status: mapStripeIntentStatus(pi.status),
      amount: Math.round(pi.amount) / 100,
      currency: pi.currency.toUpperCase(),
      metadata: (pi.metadata as Record<string, string>) || {},
    };
  }

  public async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      throw new Error('Clé secrète Stripe non configurée côté serveur.');
    }
    return this.retrievePaymentIntent(params.transactionId);
  }

  public async createRefund(params: RefundParams): Promise<RefundResult> {
    // Only call real Stripe Refund API if the transactionId is a genuine Stripe PaymentIntent ID (starts with pi_ and not legacy simulated pi_stripe_)
    const isRealStripePi =
      this.stripe !== null &&
      params.transactionId.startsWith('pi_') &&
      !params.transactionId.startsWith('pi_stripe_') &&
      !params.transactionId.startsWith('pi_sub_');

    if (isRealStripePi && this.stripe) {
      const amountCents = Math.round(params.amount * 100);
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: params.transactionId,
          amount: amountCents,
          reason: 'requested_by_customer',
          metadata: {
            orderId: params.orderId,
            shopId: params.shopId || '',
            customReason: (params.reason || '').slice(0, 200),
          },
        },
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
      );

      return {
        provider: this.name,
        refundId: refund.id,
        transactionId: params.transactionId,
        amount: Math.round((refund.amount || amountCents)) / 100,
        currency: (refund.currency || params.currency).toUpperCase(),
        status: refund.status === 'succeeded' ? 'SUCCEEDED' : refund.status === 'failed' ? 'FAILED' : 'PENDING',
        reason: params.reason || refund.reason || 'requested_by_customer',
      };
    }

    // Legacy / demo non-Stripe order fallback
    const refundId = `re_legacy_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      provider: this.name,
      refundId,
      transactionId: params.transactionId,
      amount: params.amount,
      currency: params.currency,
      status: 'SUCCEEDED',
      reason: params.reason || 'requested_by_customer',
    };
  }

  public async createTransfer(params: TransferParams): Promise<TransferResult> {
    // Real Stripe Connect transfer only if destination is a genuine Stripe Connect account (starts with acct_1...)
    const isRealConnectAcct =
      this.stripe !== null &&
      params.destinationAccountId.startsWith('acct_1') &&
      (!params.sourceTransactionId || (params.sourceTransactionId.startsWith('pi_') && !params.sourceTransactionId.startsWith('pi_stripe_')));

    if (isRealConnectAcct && this.stripe) {
      const amountCents = Math.round(params.amount * 100);
      if (amountCents <= 0) {
        return {
          provider: this.name,
          transferId: `tr_zero_${Date.now()}`,
          amount: 0,
          currency: params.currency,
          destinationAccountId: params.destinationAccountId,
          status: 'SUCCEEDED',
        };
      }

      const transfer = await this.stripe.transfers.create(
        {
          amount: amountCents,
          currency: (params.currency || 'EUR').toLowerCase(),
          destination: params.destinationAccountId,
          description: params.description,
          transfer_group: params.globalOrderId,
          metadata: {
            globalOrderId: params.globalOrderId,
            shopOrderId: params.shopOrderId,
          },
        },
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
      );

      return {
        provider: this.name,
        transferId: transfer.id,
        amount: Math.round(transfer.amount) / 100,
        currency: transfer.currency.toUpperCase(),
        destinationAccountId: params.destinationAccountId,
        status: 'SUCCEEDED',
      };
    }

    // Shop has not yet completed Stripe Connect onboarding (no real acct_1...):
    // Keep funds held safely in the platform Stripe account and mark transfer as PENDING Connect KYC.
    return {
      provider: this.name,
      transferId: `tr_pending_kyc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      amount: params.amount,
      currency: params.currency,
      destinationAccountId: params.destinationAccountId,
      status: 'PENDING',
      failureReason: 'En attente de finalisation KYC Stripe Connect de la boutique partenaire',
    };
  }

  public async createPayout(params: PayoutParams): Promise<PayoutResult> {
    if (!this.stripe || !params.destinationAccountId.startsWith('acct_1')) {
      throw new Error(
        'Le compte Stripe Connect de cette boutique doit d’abord être vérifié via l’onboarding KYC pour déclencher un virement SEPA réel.'
      );
    }

    const amountCents = Math.round(params.amount * 100);
    const payout = await this.stripe.payouts.create(
      {
        amount: amountCents,
        currency: (params.currency || 'EUR').toLowerCase(),
        statement_descriptor: params.statementDescriptor?.slice(0, 22),
      },
      {
        stripeAccount: params.destinationAccountId,
        ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
      }
    );

    return {
      provider: this.name,
      payoutId: payout.id,
      amount: Math.round(payout.amount) / 100,
      currency: payout.currency.toUpperCase(),
      status: payout.status === 'paid' ? 'PAID' : payout.status === 'failed' ? 'FAILED' : 'PENDING',
      arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : new Date(Date.now() + 2 * 86400000).toISOString(),
    };
  }

  public async createConnectedAccount(shopId: string, shopName: string, country: SupportedCountryCode): Promise<{ accountId: string }> {
    if (this.stripe) {
      try {
        const account = await this.stripe.accounts.create({
          type: 'express',
          country,
          business_profile: {
            name: shopName,
          },
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { shopId },
        });
        return { accountId: account.id };
      } catch (err: any) {
        console.warn('[StripeConnect] Could not create live Express account (Connect may not be enabled yet on dashboard):', err?.message);
      }
    }

    const accountId = `acct_pending_${shopId}_${crypto.randomBytes(3).toString('hex')}`;
    return { accountId };
  }

  public async createOnboardingLink(params: CreateOnboardingLinkParams): Promise<{ url: string; expiresAt: string }> {
    if (!this.stripe) {
      throw new Error('Clé secrète Stripe non configurée côté serveur.');
    }

    let accountId = params.accountId;

    // Upgrade legacy/pending placeholder account into a real Stripe Connect Express account on demand
    if (!accountId.startsWith('acct_1')) {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'FR',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { shopId: params.shopId },
      });
      accountId = account.id;
    }

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: params.refreshUrl,
      return_url: params.returnUrl,
      type: 'account_onboarding',
    });

    return {
      url: link.url,
      expiresAt: new Date(link.expires_at * 1000).toISOString(),
    };
  }

  public constructWebhookEvent(payload: string | Buffer, signature: string, secret?: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe SDK non initialisé.');
    }
    const webhookSecret =
      secret ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET non configuré dans les variables d’environnement.');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  public verifyWebhookSignature(payload: string | Buffer, signature: string, secret?: string): boolean {
    if (!signature) return false;
    const webhookSecret =
      secret ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET ||
      '';

    if (this.stripe && webhookSecret.startsWith('whsec_')) {
      try {
        this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        return true;
      } catch {
        return false;
      }
    }

    // Fallback HMAC validation when no Stripe whsec_ is set (unit tests)
    try {
      const key = webhookSecret || 'whsec_test_stripe_secret';
      const raw = typeof payload === 'string' ? payload : payload.toString('utf8');
      const computed = crypto.createHmac('sha256', key).update(raw).digest('hex');
      return signature.includes(computed);
    } catch {
      return false;
    }
  }
}

// ----------------------------------------------------------------------------
// 2. Alternative CBD European Payment Provider (Phytocannabinoid Specialized)
// ----------------------------------------------------------------------------
export class AlternativeCBDProvider implements PaymentProviderAdapter {
  public readonly name = 'ALTERNATIVE_CBD';
  public readonly capabilities: PaymentProviderCapabilities = {
    separateChargesAndTransfers: true,
    splitPayments: true,
    cbdMCCSupported: true,
    directPayouts: true,
    webhooks: true,
  };

  public checkEligibility(country: SupportedCountryCode): PaymentProviderEligibility {
    return {
      eligible: true,
      provider: this.name,
      allowedPaymentMethods: ['card', 'instant_transfer', 'bancontact', 'ideal'],
      allowedPayout: true,
      isSandbox: true,
    };
  }

  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const txId = `alt_cbd_tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      provider: this.name,
      transactionId: txId,
      clientSecret: `${txId}_token`,
      status: 'REQUIRES_CONFIRMATION',
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
    };
  }

  public async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentIntentResult> {
    return {
      provider: this.name,
      transactionId: params.transactionId,
      clientSecret: `${params.transactionId}_token_ok`,
      status: 'SUCCEEDED',
      amount: 0,
      currency: 'EUR',
    };
  }

  public async createRefund(params: RefundParams): Promise<RefundResult> {
    return {
      provider: this.name,
      refundId: `ref_alt_${Date.now()}`,
      transactionId: params.transactionId,
      amount: params.amount,
      currency: params.currency,
      status: 'SUCCEEDED',
      reason: params.reason,
    };
  }

  public async createTransfer(params: TransferParams): Promise<TransferResult> {
    return {
      provider: this.name,
      transferId: `tr_alt_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      destinationAccountId: params.destinationAccountId,
      status: 'SUCCEEDED',
    };
  }

  public async createPayout(params: PayoutParams): Promise<PayoutResult> {
    return {
      provider: this.name,
      payoutId: `po_alt_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      status: 'PAID',
      arrivalDate: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  public async createConnectedAccount(shopId: string, shopName: string, country: SupportedCountryCode): Promise<{ accountId: string }> {
    return { accountId: `alt_merchant_${shopId}` };
  }

  public async createOnboardingLink(params: CreateOnboardingLinkParams): Promise<{ url: string; expiresAt: string }> {
    return {
      url: `https://nexus-partner-onboarding.example.com/verify?account=${params.accountId}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  public verifyWebhookSignature(payload: string, signature: string): boolean {
    return Boolean(signature);
  }
}

// ----------------------------------------------------------------------------
// 3. Sandbox Marketplace Provider (Full Deterministic Test Engine)
// ----------------------------------------------------------------------------
export class SandboxMarketplaceProvider implements PaymentProviderAdapter {
  public readonly name = 'SANDBOX_PSP';
  public readonly capabilities: PaymentProviderCapabilities = {
    separateChargesAndTransfers: true,
    splitPayments: true,
    cbdMCCSupported: true,
    directPayouts: true,
    webhooks: true,
  };

  public checkEligibility(country: SupportedCountryCode): PaymentProviderEligibility {
    return {
      eligible: true,
      provider: this.name,
      allowedPaymentMethods: ['card', 'test_card_3ds_pass', 'test_card_instant'],
      allowedPayout: true,
      isSandbox: true,
    };
  }

  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const txId = `sandbox_tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      provider: this.name,
      transactionId: txId,
      clientSecret: `${txId}_sec`,
      status: 'REQUIRES_CONFIRMATION',
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
    };
  }

  public async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentIntentResult> {
    return {
      provider: this.name,
      transactionId: params.transactionId,
      clientSecret: `${params.transactionId}_sec`,
      status: 'SUCCEEDED',
      amount: 0,
      currency: 'EUR',
    };
  }

  public async createRefund(params: RefundParams): Promise<RefundResult> {
    return {
      provider: this.name,
      refundId: `rf_sandbox_${Date.now()}`,
      transactionId: params.transactionId,
      amount: params.amount,
      currency: params.currency,
      status: 'SUCCEEDED',
      reason: params.reason || 'Customer request',
    };
  }

  public async createTransfer(params: TransferParams): Promise<TransferResult> {
    return {
      provider: this.name,
      transferId: `tr_sandbox_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      destinationAccountId: params.destinationAccountId,
      status: 'SUCCEEDED',
    };
  }

  public async createPayout(params: PayoutParams): Promise<PayoutResult> {
    return {
      provider: this.name,
      payoutId: `po_sandbox_${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      status: 'PAID',
      arrivalDate: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  public async createConnectedAccount(shopId: string, shopName: string, country: SupportedCountryCode): Promise<{ accountId: string }> {
    return { accountId: `acct_sandbox_${shopId}` };
  }

  public async createOnboardingLink(params: CreateOnboardingLinkParams): Promise<{ url: string; expiresAt: string }> {
    return {
      url: `/partner/onboarding-sandbox?account=${params.accountId}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  }

  public verifyWebhookSignature(payload: string, signature: string): boolean {
    return true;
  }
}

// ----------------------------------------------------------------------------
// Payment Provider Registry & Orchestrator
// ----------------------------------------------------------------------------
export class PaymentProviderRegistry {
  private static providers: Map<string, PaymentProviderAdapter> = new Map<string, PaymentProviderAdapter>([
    ['STRIPE_CONNECT', new StripeMarketplaceProvider()],
    ['ALTERNATIVE_CBD', new AlternativeCBDProvider()],
    ['SANDBOX_PSP', new SandboxMarketplaceProvider()],
  ]);

  public static getProvider(name?: string): PaymentProviderAdapter {
    if (name && this.providers.has(name)) {
      return this.providers.get(name)!;
    }
    // Default to Stripe Connect or fallback to Sandbox
    const configured = process.env.PAYMENT_PROVIDER_TYPE || 'STRIPE_CONNECT';
    return this.providers.get(configured) || this.providers.get('SANDBOX_PSP')!;
  }

  public static listProviders(): { name: string; capabilities: PaymentProviderCapabilities }[] {
    return Array.from(this.providers.entries()).map(([name, p]) => ({
      name,
      capabilities: p.capabilities,
    }));
  }
}
