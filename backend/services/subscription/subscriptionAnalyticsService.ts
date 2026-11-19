import { db } from '../../db/database';
import { SubscriptionAnalytics } from '../../../src/types/entities';

export class SubscriptionAnalyticsService {
  /**
   * Compute exact live subscription metrics from database
   */
  public static getAnalytics(): SubscriptionAnalytics {
    const users = db.get('users') || [];
    const subscriptions = db.get('subscriptions') || [];
    const plans = db.get('subscriptionPlans') || [];
    const prices = db.get('subscriptionPrices') || [];
    const invoices = db.get('invoices') || [];
    const grants = db.get('subscriptionGrants') || [];
    const partnerSubs = db.get('partnerSubscriptions') || [];

    const now = new Date();

    // Active subscriptions
    const activeSubs = subscriptions.filter((s) => {
      if (s.status !== 'ACTIVE' && s.status !== 'TRIALING') return false;
      const end = new Date(s.currentPeriodEnd);
      return end > now;
    });

    // Premium active users
    const premiumSubUserIds = new Set(activeSubs.map((s) => s.userId));
    // Also include active grants
    for (const g of grants) {
      if (g.status === 'ACTIVE' && new Date(g.endAt) > now) {
        premiumSubUserIds.add(g.userId);
      }
    }

    const premiumUsersCount = premiumSubUserIds.size;
    const totalUsers = Math.max(users.length, 1);
    const freeUsersCount = Math.max(0, totalUsers - premiumUsersCount);

    // Canceled subscriptions
    const canceledSubs = subscriptions.filter((s) => s.status === 'CANCELED' || s.cancelAtPeriodEnd);
    const canceledSubscriptionsCount = canceledSubs.length;

    // Conversion rate: users who upgraded / total users
    const conversionRate = Math.round((premiumUsersCount / totalUsers) * 1000) / 10;

    // Trial to paid conversion rate
    const trialSubs = subscriptions.filter((s) => !!s.trialStart);
    const convertedFromTrial = subscriptions.filter((s) => !!s.trialStart && s.status === 'ACTIVE');
    const trialToPaidRate =
      trialSubs.length > 0 ? Math.round((convertedFromTrial.length / trialSubs.length) * 1000) / 10 : 0;

    // Churn rate: canceled / (active + canceled)
    const totalEverSubscribed = activeSubs.length + canceledSubscriptionsCount;
    const churnRate =
      totalEverSubscribed > 0 ? Math.round((canceledSubscriptionsCount / totalEverSubscribed) * 1000) / 10 : 0;

    // MRR (Monthly Recurring Revenue) & ARR
    let mrr = 0;
    for (const sub of activeSubs) {
      if (sub.status === 'TRIALING') continue; // Trials don't count towards active MRR
      const price = prices.find((p) => p.id === sub.priceId);
      if (!price) continue;
      if (price.interval === 'YEAR') {
        mrr += price.amount / 12;
      } else {
        mrr += price.amount;
      }
    }

    // Partner MRR
    let partnerMrr = 0;
    for (const psub of partnerSubs) {
      if (psub.status !== 'ACTIVE') continue;
      const price = prices.find((p) => p.id === psub.priceId);
      if (!price) continue;
      if (price.interval === 'YEAR') {
        partnerMrr += price.amount / 12;
      } else {
        partnerMrr += price.amount;
      }
    }

    mrr = Math.round(mrr * 100) / 100;
    partnerMrr = Math.round(partnerMrr * 100) / 100;
    const totalMrr = Math.round((mrr + partnerMrr) * 100) / 100;
    const arr = Math.round(totalMrr * 12 * 100) / 100;

    // Revenue calculations from invoices
    let grossRevenue = 0;
    let refundedAmount = 0;
    const revenueByCountryMap: Record<string, { amount: number; currency: string }> = {};
    const revenueByPlanMap: Record<string, { planCode: string; planName: string; count: number; amount: number }> = {};

    for (const inv of invoices) {
      if (inv.status === 'PAID') {
        grossRevenue += inv.totalAmount;
        const country = inv.metadata?.country || 'FR';
        if (!revenueByCountryMap[country]) {
          revenueByCountryMap[country] = { amount: 0, currency: inv.currency };
        }
        revenueByCountryMap[country].amount += inv.totalAmount;

        const planCode = inv.metadata?.planCode || 'PREMIUM';
        const planName = inv.metadata?.planName || 'Nexus Équilibre';
        if (!revenueByPlanMap[planCode]) {
          revenueByPlanMap[planCode] = { planCode, planName, count: 0, amount: 0 };
        }
        revenueByPlanMap[planCode].count += 1;
        revenueByPlanMap[planCode].amount += inv.totalAmount;
      } else if (inv.status === 'REFUNDED') {
        refundedAmount += inv.totalAmount;
      }
    }

    grossRevenue = Math.round(grossRevenue * 100) / 100;
    refundedAmount = Math.round(refundedAmount * 100) / 100;
    const netRevenue = Math.max(0, Math.round((grossRevenue - refundedAmount) * 100) / 100);

    const revenueByCountry = Object.entries(revenueByCountryMap).map(([country, data]) => ({
      country,
      amount: Math.round(data.amount * 100) / 100,
      currency: data.currency,
    }));

    const revenueByPlan = Object.values(revenueByPlanMap).map((item) => ({
      ...item,
      amount: Math.round(item.amount * 100) / 100,
    }));

    // Partner counts
    const partnerShops = db.get('partnerShops') || [];
    const premiumPartnerShopIds = new Set(
      partnerSubs.filter((p) => p.status === 'ACTIVE').map((p) => p.shopId)
    );
    const premiumPartnersCount = premiumPartnerShopIds.size;
    const freePartnersCount = Math.max(0, partnerShops.length - premiumPartnersCount);

    return {
      freeUsersCount,
      premiumUsersCount,
      newSubscriptionsCount: activeSubs.length,
      canceledSubscriptionsCount,
      conversionRate,
      trialToPaidRate,
      churnRate,
      mrr: totalMrr,
      arr,
      subscriptionGrossRevenue: grossRevenue,
      subscriptionNetRevenue: netRevenue,
      totalRefundedAmount: refundedAmount,
      failedPaymentsCount: 0,
      upgradesCount: 0,
      downgradesCount: 0,
      revenueByCountry,
      revenueByPlan,
      partnerMetrics: {
        freePartnersCount,
        premiumPartnersCount,
        partnerMrr,
      },
    };
  }
}
