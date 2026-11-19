import { db } from '../../db/database';
import {
  FinancialReconciliationIssue,
  GlobalOrder,
  FinancialLedgerEntry,
} from '../../../src/types/entities';

export interface ReconciliationReport {
  timestamp: string;
  totalOrdersAudited: number;
  totalVolumeCharged: number;
  totalCommissionsAccrued: number;
  totalAllocationsDistributed: number;
  totalRefundsIssued: number;
  matchedCount: number;
  issuesCount: number;
  issues: FinancialReconciliationIssue[];
}

export class FinancialReconciliationService {
  /**
   * Run automated end-to-end reconciliation audit
   */
  public static runAudit(): ReconciliationReport {
    const orders = db.get('globalOrders') || [];
    const ledger = db.get('financialLedger') || [];
    const transfers = db.get('transferRecords') || [];
    const issues: FinancialReconciliationIssue[] = [];

    let totalVolumeCharged = 0;
    let totalCommissionsAccrued = 0;
    let totalAllocationsDistributed = 0;
    let totalRefundsIssued = 0;
    let matchedCount = 0;

    for (const order of orders) {
      if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'PARTIALLY_REFUNDED' && order.paymentStatus !== 'REFUNDED') {
        continue;
      }

      totalVolumeCharged += order.grandTotal;
      totalCommissionsAccrued += order.commissionTotal;

      // Find ledger charges for this order
      const charges = ledger.filter((l) => l.orderId === order.id && l.type === 'CUSTOMER_CHARGE');
      const allocations = ledger.filter((l) => l.orderId === order.id && l.type === 'SHOP_ALLOCATION');
      const platformFees = ledger.filter((l) => l.orderId === order.id && l.type === 'PLATFORM_FEE');
      const refunds = ledger.filter((l) => l.orderId === order.id && l.type === 'REFUND');

      const sumCharges = charges.reduce((acc, c) => acc + c.amount, 0);
      const sumAllocations = allocations.reduce((acc, a) => acc + a.amount, 0);
      const sumFees = platformFees.reduce((acc, f) => acc + f.amount, 0);
      const sumRefunds = refunds.reduce((acc, r) => acc + r.amount, 0);

      totalAllocationsDistributed += sumAllocations;
      totalRefundsIssued += sumRefunds;

      // 1. Verify charge matches grandTotal
      if (charges.length === 0) {
        issues.push({
          id: `rec_err_${Date.now()}_${issues.length}`,
          type: 'ORDER_WITHOUT_PAYMENT',
          severity: 'CRITICAL',
          referenceId: order.id,
          details: `Commande #${order.orderNumber} marquée PAID mais aucune ligne CUSTOMER_CHARGE dans le grand livre.`,
          createdAt: new Date().toISOString(),
        });
      } else if (Math.abs(sumCharges - order.grandTotal) > 0.05) {
        issues.push({
          id: `rec_err_${Date.now()}_${issues.length}`,
          type: 'AMOUNT_MISMATCH',
          severity: 'CRITICAL',
          referenceId: order.id,
          details: `Écart de montant sur #${order.orderNumber}: Débit enregistré ${sumCharges.toFixed(2)}€ != Commande ${order.grandTotal.toFixed(2)}€`,
          createdAt: new Date().toISOString(),
        });
      }

      // 2. Verify sum of allocations + platform fee ≈ order subtotal + delivery
      const expectedTotal = order.subtotal + order.deliveryTotal;
      const ledgerDistributed = sumAllocations + sumFees;

      if (Math.abs(ledgerDistributed - expectedTotal) > 0.10) {
        issues.push({
          id: `rec_err_${Date.now()}_${issues.length}`,
          type: 'AMOUNT_MISMATCH',
          severity: 'WARNING',
          referenceId: order.id,
          details: `Divergence d'allocation sur #${order.orderNumber}: Vendeurs (${sumAllocations.toFixed(2)}€) + Nexus (${sumFees.toFixed(2)}€) != ${expectedTotal.toFixed(2)}€`,
          createdAt: new Date().toISOString(),
        });
      } else {
        matchedCount++;
      }

      // 3. Verify transfers for shop orders
      const shopOrders = (db.get('shopOrders') || []).filter((s) => s.globalOrderId === order.id);
      for (const so of shopOrders) {
        const soTransfers = transfers.filter((t) => t.shopOrderId === so.id && t.status === 'SUCCEEDED');
        if (soTransfers.length > 1) {
          issues.push({
            id: `rec_err_${Date.now()}_${issues.length}`,
            type: 'DUPLICATE',
            severity: 'CRITICAL',
            referenceId: so.id,
            details: `Doublon de transfert détecté sur sous-commande #${so.orderNumber}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    // Persist issues into DB
    const existingIssues = db.get('reconciliationIssues') || [];
    const updatedIssues = [...issues, ...existingIssues].slice(0, 100);
    db.set('reconciliationIssues', updatedIssues);

    return {
      timestamp: new Date().toISOString(),
      totalOrdersAudited: orders.length,
      totalVolumeCharged: Math.round(totalVolumeCharged * 100) / 100,
      totalCommissionsAccrued: Math.round(totalCommissionsAccrued * 100) / 100,
      totalAllocationsDistributed: Math.round(totalAllocationsDistributed * 100) / 100,
      totalRefundsIssued: Math.round(totalRefundsIssued * 100) / 100,
      matchedCount,
      issuesCount: issues.length,
      issues,
    };
  }

  /**
   * Export financial ledger to CSV
   */
  public static exportLedgerCSV(shopId?: string): string {
    const ledger = db.get('financialLedger') || [];
    const filtered = shopId ? ledger.filter((l) => l.shopId === shopId) : ledger;

    const headers = ['ID', 'Date', 'Type', 'Sens', 'Montant', 'Devise', 'Statut', 'Commande_Ref', 'Boutique_ID', 'Description'];
    const rows = filtered.map((e) => [
      e.id,
      e.createdAt,
      e.type,
      e.direction,
      e.amount.toFixed(2),
      e.currency,
      e.status,
      e.orderId,
      e.shopId || '',
      `"${(e.description || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
