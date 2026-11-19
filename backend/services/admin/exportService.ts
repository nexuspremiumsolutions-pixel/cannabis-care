import { db } from '../../db/database';
import { AnalyticsEngine } from './analyticsEngine';

export class ExportService {
  /**
   * Escape CSV values
   */
  private static escapeCSV(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Build CSV from array of objects
   */
  private static toCSV(headers: { key: string; label: string }[], rows: Record<string, any>[]): string {
    const headerLine = headers.map((h) => this.escapeCSV(h.label)).join(';');
    const bodyLines = rows.map((row) => headers.map((h) => this.escapeCSV(row[h.key])).join(';'));
    // Prepend UTF-8 BOM for Microsoft Excel compatibility
    return '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');
  }

  public static exportData(type: string, format: 'csv' | 'json' = 'csv'): {
    filename: string;
    contentType: string;
    data: string;
  } {
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'orders') {
      const orders = db.get('globalOrders') || [];
      const rows = orders.map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName || o.billingSnapshot?.fullName || 'Client',
        customerEmail: o.customerEmail || o.billingSnapshot?.email || '',
        status: o.status,
        paymentStatus: o.paymentStatus,
        grandTotal: o.grandTotal,
        currency: o.currency || 'EUR',
        commissionTotal: o.commissionTotal || 0,
        shopsCount: o.shopOrdersCount || 1,
        createdAt: o.createdAt,
      }));

      if (format === 'json') {
        return {
          filename: `nexus_orders_${timestamp}.json`,
          contentType: 'application/json',
          data: JSON.stringify(rows, null, 2),
        };
      }

      const headers = [
        { key: 'orderNumber', label: 'Numéro Commande' },
        { key: 'customerName', label: 'Client' },
        { key: 'customerEmail', label: 'Email' },
        { key: 'status', label: 'Statut Commande' },
        { key: 'paymentStatus', label: 'Statut Paiement' },
        { key: 'grandTotal', label: 'Total TTC (€)' },
        { key: 'commissionTotal', label: 'Commission Nexus (€)' },
        { key: 'shopsCount', label: 'Nombre Boutiques' },
        { key: 'createdAt', label: 'Date Création' },
      ];

      return {
        filename: `nexus_orders_${timestamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        data: this.toCSV(headers, rows),
      };
    }

    if (type === 'shops') {
      const shops = AnalyticsEngine.getShopsAnalytics();
      if (format === 'json') {
        return {
          filename: `nexus_shops_analytics_${timestamp}.json`,
          contentType: 'application/json',
          data: JSON.stringify(shops, null, 2),
        };
      }

      const headers = [
        { key: 'shopId', label: 'ID Boutique' },
        { key: 'commercialName', label: 'Enseigne' },
        { key: 'city', label: 'Ville' },
        { key: 'country', label: 'Pays' },
        { key: 'status', label: 'Statut' },
        { key: 'ordersCount', label: 'Nombre Commandes' },
        { key: 'grossGMV', label: 'GMV Brut (€)' },
        { key: 'nexusCommission', label: 'Commissions Nexus (€)' },
        { key: 'netRevenue', label: 'Revenu Net Vendeur (€)' },
        { key: 'averageOrderValue', label: 'Panier Moyen (€)' },
        { key: 'availableBalance', label: 'Solde Disponible (€)' },
      ];

      return {
        filename: `nexus_shops_analytics_${timestamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        data: this.toCSV(headers, shops),
      };
    }

    if (type === 'ledger') {
      const ledger = db.get('financialLedger') || [];
      const rows = ledger.map((l) => ({
        id: l.id,
        type: l.type,
        direction: l.direction,
        amount: l.amount,
        currency: l.currency,
        orderId: l.orderId,
        shopId: l.shopId || '',
        createdAt: l.createdAt,
      }));

      if (format === 'json') {
        return {
          filename: `nexus_financial_ledger_${timestamp}.json`,
          contentType: 'application/json',
          data: JSON.stringify(rows, null, 2),
        };
      }

      const headers = [
        { key: 'id', label: 'ID Écriture' },
        { key: 'type', label: 'Type Écriture' },
        { key: 'direction', label: 'Direction' },
        { key: 'amount', label: 'Montant' },
        { key: 'currency', label: 'Devise' },
        { key: 'orderId', label: 'ID Commande' },
        { key: 'shopId', label: 'Boutique' },
        { key: 'createdAt', label: 'Date Horodatage' },
      ];

      return {
        filename: `nexus_financial_ledger_${timestamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        data: this.toCSV(headers, rows),
      };
    }

    if (type === 'subscriptions') {
      const subs = db.get('subscriptions') || [];
      const prices = db.get('subscriptionPrices') || [];
      const plans = db.get('subscriptionPlans') || [];

      const rows = subs.map((s) => {
        const plan = plans.find((p) => p.id === s.planId);
        const price = prices.find((p) => p.id === s.priceId);
        return {
          id: s.id,
          userId: s.userId,
          planName: plan?.name || s.planId,
          status: s.status,
          interval: price?.interval || 'MONTH',
          priceAmount: price?.amount || 14.99,
          currentPeriodEnd: s.currentPeriodEnd,
          createdAt: s.createdAt,
        };
      });

      if (format === 'json') {
        return {
          filename: `nexus_subscriptions_${timestamp}.json`,
          contentType: 'application/json',
          data: JSON.stringify(rows, null, 2),
        };
      }

      const headers = [
        { key: 'id', label: 'ID Abonnement' },
        { key: 'userId', label: 'ID Utilisateur' },
        { key: 'planName', label: 'Offre' },
        { key: 'status', label: 'Statut' },
        { key: 'interval', label: 'Périodicité' },
        { key: 'priceAmount', label: 'Prix (€)' },
        { key: 'currentPeriodEnd', label: 'Fin de Période' },
        { key: 'createdAt', label: 'Date Souscription' },
      ];

      return {
        filename: `nexus_subscriptions_${timestamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        data: this.toCSV(headers, rows),
      };
    }

    // Default KPI summary export
    const kpis = AnalyticsEngine.getGlobalKPISummary();
    if (format === 'json') {
      return {
        filename: `nexus_kpi_summary_${timestamp}.json`,
        contentType: 'application/json',
        data: JSON.stringify(kpis, null, 2),
      };
    }

    const kpiRows = [
      { metric: 'Utilisateurs Totaux', value: kpis.users.total },
      { metric: 'Utilisateurs Actifs (MAU)', value: kpis.users.mau },
      { metric: 'DAU / MAU (%)', value: `${kpis.users.dauMauRatio}%` },
      { metric: 'GMV Brut (€)', value: `${kpis.marketplace.grossGMV.toFixed(2)} €` },
      { metric: 'Commandes Marketplace', value: kpis.marketplace.ordersCount },
      { metric: 'Panier Moyen (€)', value: `${kpis.marketplace.averageOrderValue.toFixed(2)} €` },
      { metric: 'Commissions Nexus Plateforme (€)', value: `${kpis.finance.nexusCommissionsTotal.toFixed(2)} €` },
      { metric: 'Revenu Récurrent Mensuel (MRR)', value: `${kpis.subscriptions.mrr.toFixed(2)} €` },
      { metric: 'Revenu Récurrent Annualisé (ARR)', value: `${kpis.subscriptions.arr.toFixed(2)} €` },
      { metric: 'Taux d’Attrition (Churn %)', value: `${kpis.subscriptions.churnRate}%` },
    ];

    return {
      filename: `nexus_kpi_summary_${timestamp}.csv`,
      contentType: 'text/csv; charset=utf-8',
      data: this.toCSV(
        [
          { key: 'metric', label: 'Indicateur Clé' },
          { key: 'value', label: 'Valeur' },
        ],
        kpiRows
      ),
    };
  }
}
