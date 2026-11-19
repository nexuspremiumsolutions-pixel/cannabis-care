import { db } from '../../db/database';
import {
  ShopOrder,
  GlobalOrder,
  PaymentDispute,
  DisputeStatus,
} from '../../../src/types/entities';
import { FinancialEngineService } from './financialEngineService';
import { PaymentProviderRegistry } from './paymentProviderAdapter';

export interface ProcessRefundParams {
  globalOrderId: string;
  shopOrderId?: string;
  shopId?: string;
  amount?: number; // If not provided, entire shop order is refunded
  reason?: string;
  refundInitiator: string; // 'CUSTOMER' | 'SHOP' | 'ADMIN'
  idempotencyKey?: string;
}

export class RefundDisputeService {
  /**
   * Process isolated partial or full refund for a specific shop order
   */
  public static async processRefund(params: ProcessRefundParams): Promise<{
    success: boolean;
    refundId: string;
    refundedAmount: number;
    shopOrderId?: string;
    error?: string;
  }> {
    const globalOrders = db.get('globalOrders') || [];
    const globalOrder = globalOrders.find((g) => g.id === params.globalOrderId);
    if (!globalOrder) {
      return { success: false, refundId: '', refundedAmount: 0, error: 'Commande globale introuvable' };
    }

    const shopOrders = db.get('shopOrders') || [];
    let targetShopOrder: ShopOrder | undefined;

    if (params.shopOrderId) {
      targetShopOrder = shopOrders.find((s) => s.id === params.shopOrderId);
    } else if (params.shopId) {
      targetShopOrder = shopOrders.find((s) => s.globalOrderId === params.globalOrderId && s.shopId === params.shopId);
    }

    if (!targetShopOrder) {
      return { success: false, refundId: '', refundedAmount: 0, error: 'Sous-commande boutique introuvable' };
    }

    const maxRefundable = targetShopOrder.subtotal + targetShopOrder.deliveryFee;
    const refundAmount = params.amount !== undefined ? Math.min(params.amount, maxRefundable) : maxRefundable;

    if (refundAmount <= 0) {
      return { success: false, refundId: '', refundedAmount: 0, error: 'Montant de remboursement invalide (<= 0)' };
    }

    // Call payment provider adapter
    const provider = PaymentProviderRegistry.getProvider();
    const providerRefund = await provider.createRefund({
      transactionId: globalOrder.paymentTransactionId || `tx_${globalOrder.id}`,
      orderId: globalOrder.id,
      shopId: targetShopOrder.shopId,
      amount: refundAmount,
      currency: targetShopOrder.currency,
      reason: params.reason || 'Remboursement convenu avec la boutique partenaire',
      idempotencyKey: params.idempotencyKey,
    });

    // 1. Calculate proportional commission reversal
    const commRate = (targetShopOrder.commissionRate || 6) / 100;
    const reversedCommission = Math.round(refundAmount * commRate * 100) / 100;
    const reversedShopNet = Math.round((refundAmount - reversedCommission) * 100) / 100;

    // 2. Append immutable REFUND entry to Financial Ledger
    FinancialEngineService.appendLedgerEntry({
      orderId: globalOrder.id,
      shopOrderId: targetShopOrder.id,
      shopId: targetShopOrder.shopId,
      paymentTransactionId: providerRefund.refundId,
      type: 'REFUND',
      direction: 'DEBIT',
      amount: refundAmount,
      currency: targetShopOrder.currency,
      description: `Remboursement partiel émis #${providerRefund.refundId} sur commande boutique ${targetShopOrder.shopNameSnapshot} (${params.reason || 'Motif client'})`,
      metadata: {
        reversedCommission,
        reversedShopNet,
        refundInitiator: params.refundInitiator,
      },
    });

    // 3. Update target ShopOrder status
    targetShopOrder.status = 'CANCELLED';
    targetShopOrder.statusTimeline.push({
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
      note: `Remboursement de ${refundAmount.toFixed(2)} ${targetShopOrder.currency} effectué. (${params.reason || 'Remboursement'})`,
      author: params.refundInitiator,
    });
    db.set('shopOrders', shopOrders);

    // 4. Check whether all shop orders in the GlobalOrder are cancelled/refunded
    const siblings = shopOrders.filter((s) => s.globalOrderId === globalOrder.id);
    const allRefunded = siblings.every((s) => s.status === 'CANCELLED');
    if (allRefunded) {
      globalOrder.status = 'CANCELLED';
      globalOrder.paymentStatus = 'REFUNDED';
    } else {
      globalOrder.paymentStatus = 'PARTIALLY_REFUNDED';
    }
    db.set('globalOrders', globalOrders);

    return {
      success: true,
      refundId: providerRefund.refundId,
      refundedAmount: refundAmount,
      shopOrderId: targetShopOrder.id,
    };
  }

  /**
   * Register a new Dispute / Chargeback on an order
   */
  public static registerDispute(params: {
    orderId: string;
    shopOrderId?: string;
    shopId?: string;
    amount: number;
    currency?: string;
    reason: string;
    providerDisputeId?: string;
  }): PaymentDispute {
    const disputes = db.get('paymentDisputes') || [];
    const newDispute: PaymentDispute = {
      id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: params.orderId,
      shopOrderId: params.shopOrderId,
      shopId: params.shopId,
      provider: 'STRIPE_CONNECT',
      providerDisputeId: params.providerDisputeId || `dp_ext_${Date.now()}`,
      amount: params.amount,
      currency: params.currency || 'EUR',
      reason: params.reason,
      status: 'OPEN',
      evidenceStatus: 'PENDING_UPLOAD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    disputes.unshift(newDispute);
    db.set('paymentDisputes', disputes);

    // Freeze funds in partner balance if shopId identified
    if (params.shopId) {
      const balances = db.get('partnerBalances') || [];
      const b = balances.find((x) => x.shopId === params.shopId);
      if (b) {
        b.disputedAmount = Math.round((b.disputedAmount + params.amount) * 100) / 100;
        b.availableAmount = Math.round(Math.max(0, b.availableAmount - params.amount) * 100) / 100;
        b.updatedAt = new Date().toISOString();
        db.set('partnerBalances', balances);
      }
    }

    // Ledger audit
    FinancialEngineService.appendLedgerEntry({
      orderId: params.orderId,
      shopOrderId: params.shopOrderId,
      shopId: params.shopId,
      type: 'DISPUTE',
      direction: 'DEBIT',
      amount: params.amount,
      currency: params.currency || 'EUR',
      description: `Litige / Réclamation financière ouverte (${params.reason})`,
    });

    return newDispute;
  }

  /**
   * Update dispute status (e.g. resolve as WON or LOST)
   */
  public static updateDisputeStatus(disputeId: string, status: DisputeStatus, evidenceNotes?: string): PaymentDispute {
    const disputes = db.get('paymentDisputes') || [];
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) {
      throw new Error('Litige introuvable');
    }

    dispute.status = status;
    if (evidenceNotes) {
      dispute.evidenceNotes = evidenceNotes;
      dispute.evidenceStatus = 'SUBMITTED';
    }
    dispute.updatedAt = new Date().toISOString();

    // Release disputed funds if dispute is WON or CLOSED
    if (status === 'WON' && dispute.shopId) {
      const balances = db.get('partnerBalances') || [];
      const b = balances.find((x) => x.shopId === dispute.shopId);
      if (b) {
        b.disputedAmount = Math.round(Math.max(0, b.disputedAmount - dispute.amount) * 100) / 100;
        b.availableAmount = Math.round((b.availableAmount + dispute.amount) * 100) / 100;
        b.updatedAt = new Date().toISOString();
        db.set('partnerBalances', balances);
      }
    }

    db.set('paymentDisputes', disputes);
    return dispute;
  }
}
