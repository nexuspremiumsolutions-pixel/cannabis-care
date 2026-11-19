import { db } from '../../db/database';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionGrant,
  FeatureEntitlement,
  SubscriptionStatus,
} from '../../../src/types/entities';

export interface UserEntitlementsResult {
  plan: SubscriptionPlan;
  status: SubscriptionStatus | 'NONE';
  isActivePremium: boolean;
  isTrial: boolean;
  daysRemainingInPeriod: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  features: {
    code: string;
    name: string;
    category: string;
    allowed: boolean;
    description: string;
  }[];
  limits: Record<string, number>;
  grantActive?: boolean;
}

export class EntitlementService {
  /**
   * Find the effective subscription or grant for a user
   */
  public static getEffectiveSubscription(userId: string): {
    subscription?: Subscription;
    grant?: SubscriptionGrant;
    plan: SubscriptionPlan;
    isActivePremium: boolean;
  } {
    const plans = db.get('subscriptionPlans') || [];
    const freePlan = plans.find((p) => p.code === 'FREE') || {
      id: 'plan_free',
      code: 'FREE',
      name: 'Nexus Découverte',
      description: 'Accès fondamental',
      type: 'FREE' as const,
      target: 'USER' as const,
      status: 'ACTIVE' as const,
      displayOrder: 1,
      features: ['BASIC_JOURNAL', 'BASIC_AI_COACH', 'MARKETPLACE_ACCESS', 'CORE_EDUCATION'],
      limits: { ai_messages_per_day: 5, journal_history_days: 14, advanced_exports: 0, custom_goals: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const now = new Date();

    // 1. Check for active subscription grant (VIP, Partner, Admin grant)
    const grants = db.get('subscriptionGrants') || [];
    const activeGrant = grants.find((g) => {
      if (g.userId !== userId || g.status !== 'ACTIVE') return false;
      const start = new Date(g.startAt);
      const end = new Date(g.endAt);
      return now >= start && now <= end;
    });

    if (activeGrant) {
      const grantPlan = plans.find((p) => p.id === activeGrant.planId);
      if (grantPlan) {
        return {
          grant: activeGrant,
          plan: grantPlan,
          isActivePremium: grantPlan.type === 'PREMIUM' || grantPlan.type === 'BUSINESS',
        };
      }
    }

    // 2. Check for active user subscription
    const subscriptions = db.get('subscriptions') || [];
    const activeSub = subscriptions.find((s) => {
      if (s.userId !== userId) return false;
      // Active states
      if (s.status === 'ACTIVE' || s.status === 'TRIALING') {
        const periodEnd = new Date(s.currentPeriodEnd);
        return periodEnd > now;
      }
      return false;
    });

    if (activeSub) {
      const subPlan = plans.find((p) => p.id === activeSub.planId);
      if (subPlan) {
        return {
          subscription: activeSub,
          plan: subPlan,
          isActivePremium: subPlan.type === 'PREMIUM' || subPlan.type === 'BUSINESS',
        };
      }
    }

    // Default to Free Plan
    return {
      plan: freePlan,
      isActivePremium: false,
    };
  }

  /**
   * Check if a specific user has access to a given feature
   */
  public static hasFeature(userId: string, featureCode: string): boolean {
    const { plan, isActivePremium } = this.getEffectiveSubscription(userId);

    // If plan explicitly includes feature code
    if (plan.features && plan.features.includes(featureCode)) {
      return true;
    }

    // Check catalog entitlements
    const catalog = db.get('featureEntitlements') || [];
    const feat = catalog.find((f) => f.featureCode === featureCode);
    if (!feat) {
      return false;
    }

    if (feat.freeAccess) return true;
    if (feat.premiumAccess && isActivePremium) return true;

    return false;
  }

  /**
   * Get all entitlements & active limits for a user
   */
  public static getUserEntitlements(userId: string): UserEntitlementsResult {
    const { subscription, grant, plan, isActivePremium } = this.getEffectiveSubscription(userId);
    const catalog = db.get('featureEntitlements') || [];

    const now = new Date();
    let daysRemaining = 0;
    let periodEndStr = undefined;

    if (subscription) {
      const end = new Date(subscription.currentPeriodEnd);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      periodEndStr = subscription.currentPeriodEnd;
    } else if (grant) {
      const end = new Date(grant.endAt);
      daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      periodEndStr = grant.endAt;
    }

    const featuresList = catalog.map((feat) => {
      const allowed =
        (plan.features && plan.features.includes(feat.featureCode)) ||
        feat.freeAccess ||
        (feat.premiumAccess && isActivePremium);

      return {
        code: feat.featureCode,
        name: feat.name,
        category: feat.category,
        description: feat.description,
        allowed: !!allowed,
      };
    });

    return {
      plan,
      status: subscription ? subscription.status : (grant ? 'ACTIVE' : 'NONE'),
      isActivePremium,
      isTrial: subscription?.status === 'TRIALING',
      daysRemainingInPeriod: daysRemaining,
      currentPeriodEnd: periodEndStr,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      features: featuresList,
      limits: plan.limits || {},
      grantActive: !!grant,
    };
  }

  /**
   * Get a numeric limit value for user (e.g. ai_messages_per_day)
   */
  public static getFeatureLimit(userId: string, limitKey: string): number {
    const { plan } = this.getEffectiveSubscription(userId);
    if (plan.limits && typeof plan.limits[limitKey] === 'number') {
      return plan.limits[limitKey];
    }
    return 0;
  }

  /**
   * Throws an error if user does not have permission for the feature
   */
  public static requireFeature(userId: string, featureCode: string): void {
    if (!this.hasFeature(userId, featureCode)) {
      throw new Error(`Accès restreint : la fonctionnalité "${featureCode}" requiert un abonnement Nexus Équilibre (Premium).`);
    }
  }
}
