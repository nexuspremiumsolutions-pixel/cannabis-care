import { db } from '../../db/database';
import {
  FinancialLedgerEntry,
  FinancialLedgerEntryType,
  FinancialLedgerDirection,
  FinancialOrderSnapshot,
  FinancialShopAllocationSnapshot,
  CommissionRuleType,
  GlobalOrder,
  ShopOrder,
  IdempotencyKey,
} from '../../../src/types/entities';

export interface CalculateOrderFinancialsParams {
  subtotal: number;
  deliveryTotal: number;
  shops: {
    shopId: string;
    shopOrderId?: string;
    shopName: string;
    subtotal: number;
    deliveryFee: number;
  }[];
  currency?: string;
}

export interface CalculatedOrderFinancials {
  currency: string;
  grossAmount: number;
  subtotal: number;
  deliveryTotal: number;
  platformCommissionTotal: number;
  paymentProcessingFee: number;
  shopAllocations: FinancialShopAllocationSnapshot[];
  commissionRuleSnapshot: {
    ruleType: CommissionRuleType;
    percentage: number;
    fixedAmount?: number;
    minCommission?: number;
  };
}

export class FinancialEngineService {
  /**
   * Calculate precise financial breakdown for multi-shop checkout
   */
  public static calculateOrderFinancials(params: CalculateOrderFinancialsParams): CalculatedOrderFinancials {
    const currency = params.currency || 'EUR';
    const subtotal = Math.round(params.subtotal * 100) / 100;
    const deliveryTotal = Math.round(params.deliveryTotal * 100) / 100;
    const grossAmount = Math.round((subtotal + deliveryTotal) * 100) / 100;

    // Default 6% commission rate or read active commission rules from DB
    const activeRules = db.get('commissionRules') || [];
    const globalRule = activeRules.find((r) => r.ruleType === 'PERCENTAGE' && r.isActive) || {
      percentage: 6.0,
      ruleType: 'PERCENTAGE' as const,
    };

    const commissionPercent = globalRule.percentage || 6.0;
    let totalPlatformCommission = 0;

    // Estimate payment processing fee (e.g. standard EU card: 1.4% + 0.25€)
    const paymentProcessingFee = Math.round((grossAmount * 0.014 + 0.25) * 100) / 100;

    const shopAllocations: FinancialShopAllocationSnapshot[] = params.shops.map((shop) => {
      // Find shop-specific commission rule if exists
      const shopRule = activeRules.find((r) => r.shopId === shop.shopId && r.isActive);
      const effectiveRate = shopRule?.percentage !== undefined ? shopRule.percentage : commissionPercent;

      // Platform commission calculated on product subtotal (not delivery)
      let comm = Math.round((shop.subtotal * (effectiveRate / 100)) * 100) / 100;
      if (shopRule?.minCommission && comm < shopRule.minCommission) {
        comm = shopRule.minCommission;
      }
      totalPlatformCommission += comm;

      // Proportional processing fee share
      const shopShare = grossAmount > 0 ? (shop.subtotal + shop.deliveryFee) / grossAmount : 0;
      const shopPspFee = Math.round((paymentProcessingFee * shopShare) * 100) / 100;

      // Net shop amount = (subtotal + deliveryFee) - commission
      const grossShop = Math.round((shop.subtotal + shop.deliveryFee) * 100) / 100;
      const netShop = Math.round((grossShop - comm) * 100) / 100;

      return {
        shopId: shop.shopId,
        shopOrderId: shop.shopOrderId || `sord_pending_${shop.shopId}`,
        shopName: shop.shopName,
        grossAmount: grossShop,
        deliveryFee: shop.deliveryFee,
        platformFee: comm,
        paymentProcessingFee: shopPspFee,
        netAmount: netShop,
      };
    });

    totalPlatformCommission = Math.round(totalPlatformCommission * 100) / 100;

    return {
      currency,
      grossAmount,
      subtotal,
      deliveryTotal,
      platformCommissionTotal: totalPlatformCommission,
      paymentProcessingFee,
      shopAllocations,
      commissionRuleSnapshot: {
        ruleType: globalRule.ruleType,
        percentage: commissionPercent,
        fixedAmount: (globalRule as any).fixedAmount,
        minCommission: (globalRule as any).minCommission,
      },
    };
  }

  /**
   * Append an immutable record to the financial ledger
   */
  public static appendLedgerEntry(entry: {
    orderId: string;
    shopOrderId?: string;
    shopId?: string;
    paymentTransactionId?: string;
    type: FinancialLedgerEntryType;
    direction: FinancialLedgerDirection;
    amount: number;
    currency?: string;
    description: string;
    metadata?: Record<string, any>;
  }): FinancialLedgerEntry {
    const id = `fledg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: FinancialLedgerEntry = {
      id,
      orderId: entry.orderId,
      shopOrderId: entry.shopOrderId,
      shopId: entry.shopId,
      paymentTransactionId: entry.paymentTransactionId,
      type: entry.type,
      direction: entry.direction,
      amount: Math.round(entry.amount * 100) / 100,
      currency: entry.currency || 'EUR',
      status: 'POSTED',
      description: entry.description,
      metadata: entry.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ledger = db.get('financialLedger') || [];
    ledger.unshift(newEntry);
    db.set('financialLedger', ledger);

    // Also update partner balance if applicable
    if (entry.shopId && (entry.type === 'SHOP_ALLOCATION' || entry.type === 'REFUND' || entry.type === 'PAYOUT')) {
      this.updatePartnerBalanceOnLedgerEntry(entry.shopId, entry.type, entry.amount, entry.currency || 'EUR');
    }

    return newEntry;
  }

  /**
   * Record entire financial transaction for a newly paid order
   */
  public static recordOrderPaymentInLedger(
    globalOrder: GlobalOrder,
    shopOrders: ShopOrder[],
    financials: CalculatedOrderFinancials,
    paymentTransactionId: string
  ): FinancialOrderSnapshot {
    // 1. Record Customer Charge
    this.appendLedgerEntry({
      orderId: globalOrder.id,
      paymentTransactionId,
      type: 'CUSTOMER_CHARGE',
      direction: 'CREDIT',
      amount: globalOrder.grandTotal,
      currency: globalOrder.currency,
      description: `Règlement client global enregistré pour la commande #${globalOrder.orderNumber}`,
      metadata: {
        paymentMethod: globalOrder.paymentMethod,
        customerEmail: globalOrder.customerEmail,
      },
    });

    // 2. Record Platform Commission Fee
    this.appendLedgerEntry({
      orderId: globalOrder.id,
      paymentTransactionId,
      type: 'PLATFORM_FEE',
      direction: 'CREDIT',
      amount: financials.platformCommissionTotal,
      currency: globalOrder.currency,
      description: `Frais de plateforme Nexus Marketplace (${financials.commissionRuleSnapshot.percentage}%)`,
    });

    // 3. Record Payment Processing Fee
    this.appendLedgerEntry({
      orderId: globalOrder.id,
      paymentTransactionId,
      type: 'PAYMENT_PROCESSING_FEE',
      direction: 'DEBIT',
      amount: financials.paymentProcessingFee,
      currency: globalOrder.currency,
      description: `Frais estimés d'interchange & traitement PSP`,
    });

    // 4. Record Shop Allocations
    for (const shopOrder of shopOrders) {
      const alloc = financials.shopAllocations.find((a) => a.shopId === shopOrder.shopId);
      const net = alloc ? alloc.netAmount : shopOrder.shopNetAmount;
      this.appendLedgerEntry({
        orderId: globalOrder.id,
        shopOrderId: shopOrder.id,
        shopId: shopOrder.shopId,
        paymentTransactionId,
        type: 'SHOP_ALLOCATION',
        direction: 'CREDIT',
        amount: net,
        currency: shopOrder.currency,
        description: `Allocation nette vendeur : ${shopOrder.shopNameSnapshot} (Cmd #${shopOrder.orderNumber})`,
        metadata: {
          subtotal: shopOrder.subtotal,
          deliveryFee: shopOrder.deliveryFee,
          commission: shopOrder.commissionAmount,
        },
      });
    }

    // 5. Store immutable FinancialOrderSnapshot
    const snapshot: FinancialOrderSnapshot = {
      orderId: globalOrder.id,
      currency: globalOrder.currency,
      grossAmount: globalOrder.grandTotal,
      subtotal: globalOrder.subtotal,
      shippingAmount: globalOrder.deliveryTotal,
      discountAmount: 0,
      taxAmount: 0,
      platformFee: financials.platformCommissionTotal,
      paymentProcessingFee: financials.paymentProcessingFee,
      shopAmounts: financials.shopAllocations,
      commissionRuleSnapshot: financials.commissionRuleSnapshot,
      createdAt: new Date().toISOString(),
    };

    const snapshots = db.get('financialOrderSnapshots') || [];
    snapshots.push(snapshot);
    db.set('financialOrderSnapshots', snapshots);

    return snapshot;
  }

  /**
   * Update partner's balance based on ledger transaction
   */
  private static updatePartnerBalanceOnLedgerEntry(
    shopId: string,
    type: FinancialLedgerEntryType,
    amount: number,
    currency: string
  ) {
    const balances = db.get('partnerBalances') || [];
    let b = balances.find((x) => x.shopId === shopId);
    if (!b) {
      b = {
        shopId,
        currency,
        pendingAmount: 0,
        availableAmount: 0,
        paidAmount: 0,
        refundedAmount: 0,
        disputedAmount: 0,
        updatedAt: new Date().toISOString(),
      };
      balances.push(b);
    }

    if (type === 'SHOP_ALLOCATION') {
      b.availableAmount = Math.round((b.availableAmount + amount) * 100) / 100;
    } else if (type === 'REFUND') {
      b.availableAmount = Math.round(Math.max(0, b.availableAmount - amount) * 100) / 100;
      b.refundedAmount = Math.round((b.refundedAmount + amount) * 100) / 100;
    } else if (type === 'PAYOUT') {
      b.availableAmount = Math.round(Math.max(0, b.availableAmount - amount) * 100) / 100;
      b.paidAmount = Math.round((b.paidAmount + amount) * 100) / 100;
    }

    b.updatedAt = new Date().toISOString();
    db.set('partnerBalances', balances);
  }

  /**
   * Check & Record idempotency key
   */
  public static checkIdempotency(key: string, operation: string, userId: string): { exists: boolean; record?: IdempotencyKey } {
    const keys = db.get('idempotencyKeys') || [];
    const found = keys.find((k) => k.key === key);
    if (found) {
      return { exists: true, record: found };
    }

    const newKey: IdempotencyKey = {
      key,
      operation,
      userId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    keys.push(newKey);
    db.set('idempotencyKeys', keys);

    return { exists: false, record: newKey };
  }

  public static completeIdempotency(key: string, responseReference: string) {
    const keys = db.get('idempotencyKeys') || [];
    const found = keys.find((k) => k.key === key);
    if (found) {
      found.status = 'COMPLETED';
      found.responseReference = responseReference;
      db.set('idempotencyKeys', keys);
    }
  }
}
