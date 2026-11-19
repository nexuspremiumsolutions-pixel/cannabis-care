import { db } from '../../db/database';
import {
  CRMProfile,
  CRMLifecycleStage,
  CRMSegment,
  CRMSegmentRule,
  GlobalOrder,
  UserRole,
} from '../../../src/types/entities';
import { PreferenceService } from './preferenceService';

// Strictly allowed fields for CRM segmentation (RGPD and Medical privacy compliance)
const ALLOWED_SEGMENT_FIELDS = [
  'lifecycleStage',
  'totalPurchasesCount',
  'totalSpent',
  'subscriptionStatus',
  'loyaltyLevel',
  'loyaltyPoints',
  'preferredLocale',
  'associatedShopIds',
  'tags',
  'canReceiveMarketing',
];

export class CRMService {
  /**
   * Retrieves or synchronizes a user's unified CRM profile
   */
  public static getProfile(userId: string): CRMProfile | null {
    const profiles = db.get('crmProfiles') || [];
    let profile = profiles.find((p) => p.userId === userId);

    if (!profile) {
      // Find base user account
      const users = db.get('users') || [];
      const user = users.find((u) => u.id === userId);
      if (!user) return null;

      profile = this.syncProfile(userId);
    }

    return profile;
  }

  /**
   * Recalculates and persists unified stats from orders, subscriptions, and loyalty
   */
  public static syncProfile(userId: string): CRMProfile {
    const profiles = db.get('crmProfiles') || [];
    const users = db.get('users') || [];
    const user = users.find((u) => u.id === userId);
    const userProfiles = db.get('userProfiles') || [];
    const uProfile = userProfiles.find((p) => p.userId === userId);

    // 1. Gather transactional metrics from global orders
    const globalOrders: GlobalOrder[] = db.get('globalOrders') || [];
    const userOrders = globalOrders.filter(
      (o) => o.userId === userId && o.paymentStatus === 'PAID'
    );
    const totalPurchasesCount = userOrders.length;
    const totalSpent = Number(userOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toFixed(2));

    const sortedOrders = [...userOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const firstPurchaseAt = sortedOrders.length > 0 ? sortedOrders[0].createdAt : undefined;
    const lastPurchaseAt = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1].createdAt : undefined;

    // 2. Gather associated shop IDs from purchase history
    const shopIdsSet = new Set<string>();
    userOrders.forEach((o) => {
      o.shopOrdersSummary?.forEach((s) => shopIdsSet.add(s.shopId));
    });

    // 3. Gather subscription status
    const subscriptions = db.get('subscriptions') || [];
    const userSub = subscriptions.find(
      (s) => s.userId === userId && (s.status === 'ACTIVE' || s.status === 'TRIALING')
    );

    // 4. Gather loyalty data
    const loyaltyAccounts = db.get('loyaltyAccounts') || [];
    const loyalty = loyaltyAccounts.find((l) => l.userId === userId);

    // 5. Gather communication consents
    const prefs = PreferenceService.getUserPreferences(userId);

    // 6. Determine lifecycle stage
    let lifecycleStage: CRMLifecycleStage = 'ACTIVE';
    const isStaffOrAdmin =
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.PLATFORM_ADMIN ||
      user?.role === UserRole.SUPER_ADMIN ||
      user?.role === UserRole.STORE_ADMIN ||
      user?.role === UserRole.SHOP_OWNER ||
      user?.role === UserRole.SHOP_MANAGER ||
      user?.role === UserRole.SHOP_STAFF;

    if (isStaffOrAdmin) {
      lifecycleStage = 'PARTNER_STAFF';
    } else if (userSub) {
      lifecycleStage = 'SUBSCRIBER';
    } else if (totalPurchasesCount > 0) {
      lifecycleStage = 'CUSTOMER';
    } else {
      lifecycleStage = 'ONBOARDING';
    }

    const now = new Date().toISOString();
    let profileIndex = profiles.findIndex((p) => p.userId === userId);

    const updatedProfile: CRMProfile = {
      userId,
      email: user?.email || '',
      fullName: uProfile?.nickname || user?.email?.split('@')[0] || 'Adhérent Nexus',
      lifecycleStage,
      lastActivityAt: now,
      firstPurchaseAt,
      lastPurchaseAt,
      totalPurchasesCount,
      totalSpent,
      subscriptionStatus: userSub ? userSub.status : 'NONE',
      subscriptionPlan: userSub ? userSub.planId : undefined,
      loyaltyLevel: loyalty ? `Niveau ${loyalty.currentLevelId}` : 'Adhérent Initial',
      loyaltyPoints: loyalty ? loyalty.pointsBalance : 0,
      preferredLocale: 'fr',
      preferredTimezone: prefs.timezone || 'Europe/Paris',
      associatedShopIds: Array.from(shopIdsSet),
      communicationEligibility: {
        canReceiveMarketing: prefs.marketingEmail || prefs.marketingPush,
        canReceivePush: prefs.orderUpdatesPush || prefs.deliveryUpdatesPush,
        canReceiveSms: prefs.marketingSms,
        canReceiveWhatsapp: prefs.marketingWhatsapp,
        isUnsubscribed: !prefs.marketingEmail && !prefs.marketingPush,
      },
      tags: profileIndex >= 0 ? profiles[profileIndex].tags : ['Nouveau Compte'],
      createdAt: profileIndex >= 0 ? profiles[profileIndex].createdAt : now,
      updatedAt: now,
    };

    if (profileIndex >= 0) {
      profiles[profileIndex] = updatedProfile;
    } else {
      profiles.push(updatedProfile);
    }

    db.set('crmProfiles', profiles);
    db.save();
    return updatedProfile;
  }

  /**
   * Returns list of CRM profiles with optional filtering
   */
  public static getAllProfiles(options: {
    search?: string;
    lifecycleStage?: CRMLifecycleStage;
    shopId?: string;
  } = {}): CRMProfile[] {
    let profiles = db.get('crmProfiles') || [];

    // Partner store multi-tenant isolation
    if (options.shopId) {
      profiles = profiles.filter((p) => p.associatedShopIds?.includes(options.shopId!));
    }

    if (options.lifecycleStage) {
      profiles = profiles.filter((p) => p.lifecycleStage === options.lifecycleStage);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.email.toLowerCase().includes(q) ||
          p.fullName?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return profiles;
  }

  /**
   * Manages CRM Segments
   */
  public static getAllSegments(ownerId: string = 'PLATFORM'): CRMSegment[] {
    const segments = db.get('crmSegments') || [];
    if (ownerId === 'PLATFORM') {
      return segments;
    }
    // Return platform shared segments plus partner's own segments
    return segments.filter((s) => s.ownerId === 'PLATFORM' || s.ownerId === ownerId);
  }

  /**
   * Creates a new audience segment with strict privacy validation
   */
  public static createSegment(params: {
    name: string;
    description: string;
    ownerType: 'PLATFORM' | 'PARTNER';
    ownerId: string;
    rules: CRMSegmentRule[];
  }): CRMSegment {
    // Strict RGPD verification: ensure rules only target permitted fields
    for (const rule of params.rules) {
      if (!ALLOWED_SEGMENT_FIELDS.includes(rule.field)) {
        throw new Error(
          `Critère de segmentation non autorisé pour des raisons de conformité RGPD / Données de santé : "${rule.field}"`
        );
      }
    }

    const segments = db.get('crmSegments') || [];
    const now = new Date().toISOString();

    const segment: CRMSegment = {
      id: `seg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: params.name,
      description: params.description,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      rules: params.rules,
      status: 'ACTIVE',
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Calculate initial membership
    segment.memberCount = this.calculateSegmentMembers(segment).length;

    segments.push(segment);
    db.set('crmSegments', segments);
    db.save();
    return segment;
  }

  /**
   * Evaluates rules against all profiles to find matching users
   */
  public static calculateSegmentMembers(segment: CRMSegment): CRMProfile[] {
    const profiles = db.get('crmProfiles') || [];
    return profiles.filter((profile) => {
      // If partner owned, must be associated with the partner shop
      if (segment.ownerType === 'PARTNER' && segment.ownerId !== 'PLATFORM') {
        if (!profile.associatedShopIds?.includes(segment.ownerId)) {
          return false;
        }
      }

      // Evaluate every rule (AND logic)
      return segment.rules.every((rule) => {
        const val = (profile as any)[rule.field] ?? (profile.communicationEligibility as any)[rule.field];

        switch (rule.operator) {
          case 'EQUALS':
            return val === rule.value;
          case 'NOT_EQUALS':
            return val !== rule.value;
          case 'GREATER_THAN':
            return Number(val) > Number(rule.value);
          case 'LESS_THAN':
            return Number(val) < Number(rule.value);
          case 'IN':
            return Array.isArray(rule.value) && rule.value.includes(val);
          case 'CONTAINS':
            return Array.isArray(val) && val.includes(rule.value);
          default:
            return true;
        }
      });
    });
  }
}
