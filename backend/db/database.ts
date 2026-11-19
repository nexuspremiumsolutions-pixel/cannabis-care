import fs from 'fs';
import path from 'path';
import {
  User,
  UserProfile,
  UserConsent,
  ConsentRecord,
  UserPreferences,
  THCProfile,
  ConsumptionProfile,
  CBDProfile,
  WellnessProfile,
  CommunicationPreferences,
  ProfileHistoryEntry,
  ConsumptionEntry,
  WellnessEntry,
  CBDProduct,
  CBDProductBatch,
  CBDStore,
  StoreProduct,
  StoreAdmin,
  Order,
  OrderItem,
  Payment,
  EducationalContent,
  Cannabinoid,
  Terpene,
  Goal,
  UserGoal,
  Progress,
  Badge,
  Notification,
  AIConversation,
  AIMessage,
  AIRecommendation,
  AIAssistantSettings,
  AuditLog,
  UserRole,
  THCCraving,
  THCReductionPlan,
  THCTrigger,
  THCDailyGoal,
  THCJourneyEvent,
  WellnessChallenge,
  THCBudgetSetting,
  UserEducationProgress,
  CBDConsumption,
  CBDUserProduct,
  CBDProductScan,
  CBDWellnessObservation,
  CBDWellnessGoal,
  SleepEntry,
  MoodEntry,
  StressEntry,
  EnergyEntry,
  ActivityEntry,
  NutritionEntry,
  HydrationEntry,
  RelaxationEntry,
  PersonalNote,
  LifeEvent,
  DashboardPreference,
  EducationalPath,
  EducationalProgress,
  EducationalFavorite,
  EducationalHistoryItem,
  EducationalTranslation,
  PartnerShop,
  ProductCategory,
  CBDMarketplaceProduct,
  UserFavoriteProduct,
  UserFavoriteShop,
  ProductViewHistory,
  ShopViewHistory,
  MarketplaceCommissionRule,
  ShopCommerceIntegration,
  GlobalCartModel,
  GlobalOrder,
  ShopOrder,
  MarketplaceOrderItem,
  PaymentIntent,
  SupportedCountryConfig,
  FinancialLedgerEntry,
  FinancialOrderSnapshot,
  PartnerFinancialAccount,
  PartnerBalance,
  TransferRecord,
  PayoutRecord,
  PaymentDispute,
  PaymentWebhookEvent,
  FinancialAuditLog,
  FinancialReconciliationIssue,
  IdempotencyKey,
  FinancialAdjustment,
  ShippingAddress,
  DeliveryOption,
  ShippingRate,
  FreeShippingRule,
  DeliveryZone,
  Carrier,
  CarrierService,
  Shipment,
  ShipmentItem,
  TrackingEvent,
  PickupLocation,
  PickupSlot,
  PickupConfirmation,
  DeliveryIncident,
  ReturnRequest,
  ShippingAuditLog,
  // Module 12
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyRule,
  LoyaltyLevel,
  Achievement,
  UserAchievement,
  UserStreak,
  Challenge,
  UserChallenge,
  GoalReward,
  Reward,
  RewardRedemption,
  ReferralProgram,
  Referral,
  ReferralRiskAssessment,
  LoyaltyAdminAuditLog,
  // Module 13
  SubscriptionPlan,
  SubscriptionPrice,
  FeatureEntitlement,
  Subscription,
  SubscriptionEvent,
  Invoice,
  TaxConfiguration,
  SubscriptionGrant,
  PartnerSubscription,
  SubscriptionPayment,
  // Module 14
  ShopTeamMember,
  ShopReview,
  StockAdjustmentRecord,
  ShopCustomCategory,
  // Module 15
  MarketingCampaign,
  MarketingPromotion,
  MarketingCoupon,
  MerchandisingPlacement,
  MerchandisingItem,
  MarketingTrackingEvent,
  MarketingAttributionRecord,
  MarketingUserConsent,
  MarketingCountryRule,
  MarketingAuditLog,
  NotificationEvent,
  NotificationTemplate,
  NotificationDelivery,
  NotificationPreference,
  UserCommunicationPreference,
  MarketingConsentRecord,
  CRMProfile,
  CRMSegment,
  CommunicationWorkflow,
  CommunicationAttributionRecord,
  AnalyticsEvent,
  SearchEvent,
  AdminAlert,
  BackgroundJob,
  AdminAuditLogRecord,
  SupportCase,
  MetricDefinition,
} from '../../src/types/entities';
import { getSeedUsers } from './userSeeds';
import {
  seedNotificationTemplates,
  seedCommunicationWorkflows,
  seedCRMSegments,
  seedCRMProfiles,
  seedUserCommunicationPreferences,
  seedMarketingConsentRecords,
  seedNotifications,
  seedNotificationDeliveries,
  seedCommunicationAttributions,
} from './communicationSeeds';
import {
  seedMarketingCampaigns,
  seedMarketingPromotions,
  seedMarketingCoupons,
  seedMerchandisingPlacements,
  seedMarketingCountryRules,
  seedMarketingTrackingEvents,
  seedMarketingUserConsents,
} from './marketingSeeds';
import {
  seedEuropeanPartnerShops,
  seedShopTeamMembers,
  seedShopReviews,
  seedShopCustomCategories,
} from './partnerStoreSeeds';
import {
  seedSubscriptionPlans,
  seedSubscriptionPrices,
  seedFeatureEntitlements,
  seedTaxConfigurations,
} from './subscriptionSeeds';
import {
  seedLoyaltyLevels,
  seedLoyaltyRules,
  seedAchievements,
  seedChallenges,
  seedRewards,
  seedReferralPrograms,
} from './loyaltySeeds';
import {
  seedEducationalContents,
  seedEducationalPaths,
  seedCannabinoidsExtended,
  seedTerpenesExtended,
} from './educationSeeds';
import {
  seedProductCategories,
  seedPartnerShops,
  seedMarketplaceProducts,
  seedCommissionRules,
} from './marketplaceSeeds';
import {
  seedSupportedCountries,
  seedPartnerFinancialAccounts,
  seedPartnerBalances,
  seedFinancialLedger,
  seedReconciliationIssues,
} from './financeSeeds';
import {
  seedCarriers,
  seedCarrierServices,
  seedDeliveryZones,
  seedDeliveryOptions,
  seedFreeShippingRules,
  seedPickupLocations,
  seedPickupSlots,
  seedShipments,
  seedTrackingEvents,
  seedPickupConfirmations,
  seedDeliveryIncidents,
  seedReturnRequests,
  seedCustomerShippingAddresses,
} from './logisticsSeeds';
import {
  seedMetricDefinitions,
  seedAdminAlerts,
  seedBackgroundJobs,
  seedSupportCases,
  seedSearchEvents,
  seedAnalyticsEvents,
  seedAdminAuditLogs,
} from './adminSeeds';
import { getServerSupabase, isServerSupabaseConfigured, getSupabaseUrl } from './supabaseClient';

export interface DatabaseSchema {
  users: User[];
  userProfiles: UserProfile[];
  userConsents: UserConsent[];
  consentRecords: ConsentRecord[];
  userPreferences: UserPreferences[];
  communicationPreferences: CommunicationPreferences[];
  thcProfiles: THCProfile[];
  consumptionProfiles: ConsumptionProfile[];
  cbdProfiles: CBDProfile[];
  wellnessProfiles: WellnessProfile[];
  profileHistories: ProfileHistoryEntry[];
  consumptionEntries: ConsumptionEntry[];
  wellnessEntries: WellnessEntry[];
  thcCravings: THCCraving[];
  thcReductionPlans: THCReductionPlan[];
  thcTriggers: THCTrigger[];
  thcDailyGoals: THCDailyGoal[];
  thcJourneyEvents: THCJourneyEvent[];
  wellnessChallenges: WellnessChallenge[];
  thcBudgetSettings: THCBudgetSetting[];
  userEducationProgress: UserEducationProgress[];
  cbdProducts: CBDProduct[];
  cbdProductBatches: CBDProductBatch[];
  cbdStores: CBDStore[];
  storeProducts: StoreProduct[];
  storeAdmins: StoreAdmin[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  educationalContents: EducationalContent[];
  cannabinoids: Cannabinoid[];
  terpenes: Terpene[];
  // Module 6 Collections
  educationalPaths: EducationalPath[];
  educationalProgress: EducationalProgress[];
  educationalFavorites: EducationalFavorite[];
  educationalHistory: EducationalHistoryItem[];
  educationalTranslations: EducationalTranslation[];
  goals: Goal[];
  userGoals: UserGoal[];
  progress: Progress[];
  badges: Badge[];
  notifications: Notification[];
  aiConversations: AIConversation[];
  aiMessages: AIMessage[];
  aiRecommendations: AIRecommendation[];
  aiAssistantSettings: AIAssistantSettings[];
  auditLogs: AuditLog[];
  cbdConsumptions: CBDConsumption[];
  cbdUserProducts: CBDUserProduct[];
  cbdProductScans: CBDProductScan[];
  cbdWellnessObservations: CBDWellnessObservation[];
  cbdWellnessGoals: CBDWellnessGoal[];
  // Module 4 Collections
  sleepEntries: SleepEntry[];
  moodEntries: MoodEntry[];
  stressEntries: StressEntry[];
  energyEntries: EnergyEntry[];
  activityEntries: ActivityEntry[];
  nutritionEntries: NutritionEntry[];
  hydrationEntries: HydrationEntry[];
  relaxationEntries: RelaxationEntry[];
  personalNotes: PersonalNote[];
  lifeEvents: LifeEvent[];
  // Module 5 Collections
  dashboardPreferences: DashboardPreference[];
  // Module 8 Collections — Partner Shops & CBD Marketplace
  partnerShops: PartnerShop[];
  productCategories: ProductCategory[];
  marketplaceProducts: CBDMarketplaceProduct[];
  userFavoriteProducts: UserFavoriteProduct[];
  userFavoriteShops: UserFavoriteShop[];
  productViewHistory: ProductViewHistory[];
  shopViewHistory: ShopViewHistory[];
  commissionRules: MarketplaceCommissionRule[];
  shopIntegrations: ShopCommerceIntegration[];
  // Module 9 Collections — Global Cart & Distributed Multi-Shop Orders
  marketplaceCarts: GlobalCartModel[];
  globalOrders: GlobalOrder[];
  shopOrders: ShopOrder[];
  marketplaceOrderItems: MarketplaceOrderItem[];
  paymentIntents: PaymentIntent[];
  // Module 10 Collections — Real Payments, Financial Marketplace, Commissions & Payouts
  financialLedger: FinancialLedgerEntry[];
  financialOrderSnapshots: FinancialOrderSnapshot[];
  partnerFinancialAccounts: PartnerFinancialAccount[];
  partnerBalances: PartnerBalance[];
  transferRecords: TransferRecord[];
  payoutRecords: PayoutRecord[];
  paymentDisputes: PaymentDispute[];
  paymentWebhookEvents: PaymentWebhookEvent[];
  financialAuditLogs: FinancialAuditLog[];
  reconciliationIssues: FinancialReconciliationIssue[];
  idempotencyKeys: IdempotencyKey[];
  supportedCountries: SupportedCountryConfig[];
  financialAdjustments: FinancialAdjustment[];
  // Module 11 Collections — Delivery, In-Store Pickup & Marketplace Logistics
  shippingAddresses: ShippingAddress[];
  deliveryZones: DeliveryZone[];
  deliveryOptions: DeliveryOption[];
  shippingRates: ShippingRate[];
  freeShippingRules: FreeShippingRule[];
  carriers: Carrier[];
  carrierServices: CarrierService[];
  shipments: Shipment[];
  trackingEvents: TrackingEvent[];
  pickupLocations: PickupLocation[];
  pickupSlots: PickupSlot[];
  pickupConfirmations: PickupConfirmation[];
  deliveryIncidents: DeliveryIncident[];
  returnRequests: ReturnRequest[];
  shippingAuditLogs: ShippingAuditLog[];
  // Module 12 Collections — Fidélité, Récompenses, Gamification & Parrainage
  loyaltyAccounts: LoyaltyAccount[];
  loyaltyTransactions: LoyaltyTransaction[];
  loyaltyRules: LoyaltyRule[];
  loyaltyLevels: LoyaltyLevel[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  userStreaks: UserStreak[];
  challenges: Challenge[];
  userChallenges: UserChallenge[];
  goalRewards: GoalReward[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  referralPrograms: ReferralProgram[];
  referrals: Referral[];
  referralRiskAssessments: ReferralRiskAssessment[];
  loyaltyAdminAuditLogs: LoyaltyAdminAuditLog[];
  // Module 13 Collections — Abonnements, Premium & Monétisation
  subscriptionPlans: SubscriptionPlan[];
  subscriptionPrices: SubscriptionPrice[];
  featureEntitlements: FeatureEntitlement[];
  subscriptions: Subscription[];
  subscriptionEvents: SubscriptionEvent[];
  invoices: Invoice[];
  taxConfigurations: TaxConfiguration[];
  subscriptionGrants: SubscriptionGrant[];
  partnerSubscriptions: PartnerSubscription[];
  subscriptionPayments: SubscriptionPayment[];
  // Module 14 Collections — Mini-Shops Partenaires & Storefronts
  shopTeamMembers: ShopTeamMember[];
  shopReviews: ShopReview[];
  stockAdjustmentRecords: StockAdjustmentRecord[];
  shopCustomCategories: ShopCustomCategory[];
  // Module 15 Collections — Marketing, Promotions, Campagnes & Acquisition
  marketingCampaigns: MarketingCampaign[];
  marketingPromotions: MarketingPromotion[];
  marketingCoupons: MarketingCoupon[];
  merchandisingPlacements: MerchandisingPlacement[];
  marketingTrackingEvents: MarketingTrackingEvent[];
  marketingAttributionRecords: MarketingAttributionRecord[];
  marketingConsents: MarketingUserConsent[];
  marketingCountryRules: MarketingCountryRule[];
  marketingAuditLogs: MarketingAuditLog[];
  // Module 16 Collections — Notifications Avancées, CRM & Communication Automatisée
  notificationEvents: NotificationEvent[];
  notificationTemplates: NotificationTemplate[];
  notificationDeliveries: NotificationDelivery[];
  notificationPreferences: NotificationPreference[];
  userCommunicationPreferences: UserCommunicationPreference[];
  marketingConsentRecords: MarketingConsentRecord[];
  crmProfiles: CRMProfile[];
  crmSegments: CRMSegment[];
  communicationWorkflows: CommunicationWorkflow[];
  communicationAttributions: CommunicationAttributionRecord[];
  // Module 17 Collections — Administration Centrale & Analytics Globaux
  analyticsEvents: AnalyticsEvent[];
  searchEvents: SearchEvent[];
  adminAlerts: AdminAlert[];
  backgroundJobs: BackgroundJob[];
  adminAuditLogs: AdminAuditLogRecord[];
  supportCases: SupportCase[];
  metricDefinitions: MetricDefinition[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cannabis_care_db.json');

class DatabaseEngine {
  private data: DatabaseSchema;
  private supabaseSyncEnabled = false;
  private supabaseStatusMessage = 'Mode local JSON (clés Supabase non configurées)';
  private lastSyncedSnapshots: Map<string, string> = new Map();
  private pendingSyncKeys: Set<string> = new Set();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.data = this.initializeOrLoad();
  }

  private initializeOrLoad(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        // Ensure all arrays exist
        return this.ensureSchemaIntegrity(parsed);
      } catch (err) {
        console.error('Error loading DB file, fallback to fresh seed:', err);
      }
    }

    const fresh = this.getInitialSeed();
    this.saveImmediate(fresh);
    return fresh;
  }

  private ensureSchemaIntegrity(db: Partial<DatabaseSchema>): DatabaseSchema {
    const seed = this.getInitialSeed();
    const isProduction = process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEEDS !== 'true';
    const seedUsersData = isProduction
      ? { users: [], userProfiles: [], userConsents: [], userPreferences: [], thcProfiles: [], cbdProfiles: [], progress: [] }
      : getSeedUsers();

    // Ensure all demo and system users exist with valid credentials (in dev/test)
    const existingUsers = db.users || [];
    const userMap = new Map<string, User>();
    for (const u of existingUsers) {
      userMap.set(u.email.toLowerCase(), u);
    }
    for (const seedUser of seedUsersData.users) {
      const existing = userMap.get(seedUser.email.toLowerCase());
      if (!existing) {
        userMap.set(seedUser.email.toLowerCase(), seedUser);
      } else {
        // Refresh password hash to guarantee demo credentials work
        existing.passwordHash = seedUser.passwordHash;
        existing.role = seedUser.role;
        userMap.set(seedUser.email.toLowerCase(), existing);
      }
    }
    const finalUsers = Array.from(userMap.values());

    // Merge User Profiles
    const existingProfiles = db.userProfiles || [];
    const profileMap = new Map<string, UserProfile>();
    for (const p of existingProfiles) {
      profileMap.set(p.userId, p);
    }
    for (const seedProfile of seedUsersData.userProfiles) {
      const existing = profileMap.get(seedProfile.userId);
      if (!existing) {
        profileMap.set(seedProfile.userId, seedProfile);
      } else {
        existing.isOnboarded = true;
        existing.onboardingCompleted = true;
        profileMap.set(seedProfile.userId, existing);
      }
    }
    const finalProfiles = Array.from(profileMap.values());

    // Merge Consents
    const existingConsents = db.userConsents || [];
    const consentMap = new Map<string, UserConsent>();
    for (const c of existingConsents) consentMap.set(c.userId, c);
    for (const sc of seedUsersData.userConsents) {
      if (!consentMap.has(sc.userId)) consentMap.set(sc.userId, sc);
    }

    // Merge Preferences
    const existingPrefs = db.userPreferences || [];
    const prefMap = new Map<string, UserPreferences>();
    for (const pr of existingPrefs) prefMap.set(pr.userId, pr);
    for (const spr of seedUsersData.userPreferences) {
      if (!prefMap.has(spr.userId)) prefMap.set(spr.userId, spr);
    }

    // Merge THC Profiles
    const existingTHC = db.thcProfiles || [];
    const thcMap = new Map<string, THCProfile>();
    for (const t of existingTHC) thcMap.set(t.userId, t);
    for (const st of seedUsersData.thcProfiles) {
      if (!thcMap.has(st.userId)) thcMap.set(st.userId, st);
    }

    // Merge CBD Profiles
    const existingCBD = db.cbdProfiles || [];
    const cbdMap = new Map<string, CBDProfile>();
    for (const c of existingCBD) cbdMap.set(c.userId, c);
    for (const sc of seedUsersData.cbdProfiles) {
      if (!cbdMap.has(sc.userId)) cbdMap.set(sc.userId, sc);
    }

    // Merge Progress
    const existingProgress = db.progress || [];
    const progressMap = new Map<string, Progress>();
    for (const prg of existingProgress) progressMap.set(prg.userId, prg);
    for (const sprg of seedUsersData.progress) {
      if (!progressMap.has(sprg.userId)) progressMap.set(sprg.userId, sprg);
    }

    return {
      users: finalUsers,
      userProfiles: finalProfiles,
      userConsents: Array.from(consentMap.values()),
      consentRecords: db.consentRecords || seed.consentRecords,
      userPreferences: Array.from(prefMap.values()),
      communicationPreferences: db.communicationPreferences || seed.communicationPreferences,
      thcProfiles: Array.from(thcMap.values()),
      consumptionProfiles: db.consumptionProfiles || seed.consumptionProfiles,
      cbdProfiles: Array.from(cbdMap.values()),
      wellnessProfiles: db.wellnessProfiles || seed.wellnessProfiles,
      profileHistories: db.profileHistories || seed.profileHistories,
      consumptionEntries: db.consumptionEntries || seed.consumptionEntries,
      wellnessEntries: db.wellnessEntries || seed.wellnessEntries,
      thcCravings: db.thcCravings || seed.thcCravings,
      thcReductionPlans: db.thcReductionPlans || seed.thcReductionPlans,
      thcTriggers: db.thcTriggers || seed.thcTriggers,
      thcDailyGoals: db.thcDailyGoals || seed.thcDailyGoals,
      thcJourneyEvents: db.thcJourneyEvents || seed.thcJourneyEvents,
      wellnessChallenges: db.wellnessChallenges || seed.wellnessChallenges,
      thcBudgetSettings: db.thcBudgetSettings || seed.thcBudgetSettings,
      userEducationProgress: db.userEducationProgress || seed.userEducationProgress,
      cbdProducts: db.cbdProducts || seed.cbdProducts,
      cbdProductBatches: db.cbdProductBatches || seed.cbdProductBatches,
      cbdStores: db.cbdStores || seed.cbdStores,
      storeProducts: db.storeProducts || seed.storeProducts,
      storeAdmins: db.storeAdmins || seed.storeAdmins,
      orders: db.orders || seed.orders,
      orderItems: db.orderItems || seed.orderItems,
      payments: db.payments || seed.payments,
      educationalContents: (() => {
        const existing = db.educationalContents || [];
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = seed.educationalContents.filter((s) => !existingIds.has(s.id));
        return [...existing, ...toAdd];
      })(),
      cannabinoids: seed.cannabinoids,
      terpenes: seed.terpenes,
      educationalPaths: (() => {
        const existing = db.educationalPaths || [];
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = seed.educationalPaths.filter((s) => !existingIds.has(s.id));
        return [...existing, ...toAdd];
      })(),
      educationalProgress: db.educationalProgress || seed.educationalProgress,
      educationalFavorites: db.educationalFavorites || seed.educationalFavorites,
      educationalHistory: db.educationalHistory || seed.educationalHistory,
      educationalTranslations: db.educationalTranslations || seed.educationalTranslations,
      goals: db.goals || seed.goals,
      userGoals: db.userGoals || seed.userGoals,
      progress: Array.from(progressMap.values()),
      badges: db.badges || seed.badges,
      notifications: db.notifications || seed.notifications,
      aiConversations: db.aiConversations || seed.aiConversations,
      aiMessages: db.aiMessages || seed.aiMessages,
      aiRecommendations: db.aiRecommendations || seed.aiRecommendations,
      aiAssistantSettings: db.aiAssistantSettings || seed.aiAssistantSettings,
      auditLogs: db.auditLogs || seed.auditLogs,
      cbdConsumptions: db.cbdConsumptions || seed.cbdConsumptions,
      cbdUserProducts: db.cbdUserProducts || seed.cbdUserProducts,
      cbdProductScans: db.cbdProductScans || seed.cbdProductScans,
      cbdWellnessObservations: db.cbdWellnessObservations || seed.cbdWellnessObservations,
      cbdWellnessGoals: db.cbdWellnessGoals || seed.cbdWellnessGoals,
      sleepEntries: db.sleepEntries || seed.sleepEntries,
      moodEntries: db.moodEntries || seed.moodEntries,
      stressEntries: db.stressEntries || seed.stressEntries,
      energyEntries: db.energyEntries || seed.energyEntries,
      activityEntries: db.activityEntries || seed.activityEntries,
      nutritionEntries: db.nutritionEntries || seed.nutritionEntries,
      hydrationEntries: db.hydrationEntries || seed.hydrationEntries,
      relaxationEntries: db.relaxationEntries || seed.relaxationEntries,
      personalNotes: db.personalNotes || seed.personalNotes,
      lifeEvents: db.lifeEvents || seed.lifeEvents,
      dashboardPreferences: db.dashboardPreferences || seed.dashboardPreferences,
      partnerShops: (() => {
        const existing = db.partnerShops || [];
        const allSeedShops = [...seedPartnerShops, ...seedEuropeanPartnerShops];
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = allSeedShops.filter((s) => !existingIds.has(s.id));
        const mergedExisting = existing.map((shop) => {
          const seedShop = allSeedShops.find((s) => s.id === shop.id);
          const computedSlug = shop.slug || seedShop?.slug || shop.commercialName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return {
            ...shop,
            slug: computedSlug,
            publicName: shop.publicName ?? seedShop?.publicName ?? shop.commercialName,
            storefrontTemplate: shop.storefrontTemplate ?? seedShop?.storefrontTemplate ?? 'classic',
            primaryColor: shop.primaryColor ?? seedShop?.primaryColor ?? '#0f766e',
            secondaryColor: shop.secondaryColor ?? seedShop?.secondaryColor ?? '#042f2e',
            accentColor: shop.accentColor ?? seedShop?.accentColor ?? '#f59e0b',
            textColor: shop.textColor ?? seedShop?.textColor ?? '#0f172a',
            backgroundColor: shop.backgroundColor ?? seedShop?.backgroundColor ?? '#ffffff',
            logoUrl: shop.logoUrl ?? shop.logo ?? seedShop?.logoUrl ?? seedShop?.logo,
            bannerUrl: shop.bannerUrl ?? shop.coverImage ?? seedShop?.bannerUrl ?? seedShop?.coverImage,
            shortDescription: shop.shortDescription ?? seedShop?.shortDescription ?? (shop.description ? shop.description.slice(0, 140) : ''),
            fullDescription: shop.fullDescription ?? seedShop?.fullDescription ?? shop.description,
            shopStatus: shop.shopStatus ?? shop.status ?? 'ACTIVE',
            storefrontStatus: shop.storefrontStatus ?? seedShop?.storefrontStatus ?? 'PUBLISHED',
            legalStatus: shop.legalStatus ?? seedShop?.legalStatus ?? (shop.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'),
            customCategories: shop.customCategories ?? seedShop?.customCategories ?? [],
            featuredProductIds: shop.featuredProductIds ?? seedShop?.featuredProductIds ?? [],
            languages: shop.languages ?? seedShop?.languages ?? ['fr', 'en'],
            timezone: shop.timezone ?? seedShop?.timezone ?? 'Europe/Paris',
            legalInformation: shop.legalInformation ?? seedShop?.legalInformation ?? 'RCS Paris B 912 345 678 - TVA FR 32 912345678 - Vente interdite aux mineurs de moins de 18 ans - Produits conformes réglementation UE THC < 0.3%',
            returnPolicyText: shop.returnPolicyText ?? seedShop?.returnPolicyText ?? 'Délai légal de rétractation de 14 jours pour les articles non ouverts et scellés dans leur conditionnement d’origine.',
            deliveryAvailable: shop.deliveryAvailable ?? seedShop?.deliveryAvailable ?? true,
            pickupAvailable: shop.pickupAvailable ?? seedShop?.pickupAvailable ?? true,
            deliveryFee: shop.deliveryFee ?? seedShop?.deliveryFee ?? 4.90,
            freeDeliveryThreshold: shop.freeDeliveryThreshold ?? seedShop?.freeDeliveryThreshold ?? 50,
            estimatedDeliveryDays: shop.estimatedDeliveryDays ?? seedShop?.estimatedDeliveryDays ?? '24-48h',
            estimatedPickupTime: shop.estimatedPickupTime ?? seedShop?.estimatedPickupTime ?? 'Prêt sous 2h',
            pickupInstructions: shop.pickupInstructions ?? seedShop?.pickupInstructions,
          };
        });
        return [...mergedExisting, ...toAdd];
      })(),
      productCategories: (() => {
        const existing = db.productCategories || [];
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = seedProductCategories.filter((s) => !existingIds.has(s.id));
        return [...existing, ...toAdd];
      })(),
      marketplaceProducts: (() => {
        const existing = db.marketplaceProducts || [];
        const existingIds = new Set(existing.map((e) => e.id));
        const toAdd = seedMarketplaceProducts.filter((s) => !existingIds.has(s.id));
        return [...existing, ...toAdd];
      })(),
      userFavoriteProducts: db.userFavoriteProducts || [],
      userFavoriteShops: db.userFavoriteShops || [],
      productViewHistory: db.productViewHistory || [],
      shopViewHistory: db.shopViewHistory || [],
      commissionRules: db.commissionRules || seedCommissionRules,
      shopIntegrations: db.shopIntegrations || [],
      // Module 9
      marketplaceCarts: db.marketplaceCarts || [],
      globalOrders: (() => {
        const existing = db.globalOrders || [];
        if (existing.length > 0) return existing;
        return [
          {
            id: 'gord_sample_demo_101',
            orderNumber: '#NEXUS-2026-000101',
            userId: 'usr_regular_user',
            customerName: 'Alexandre Martin',
            customerEmail: 'alexandre.martin@example.fr',
            customerPhone: '+33 6 12 34 56 78',
            status: 'PARTIALLY_READY',
            currency: 'EUR',
            subtotal: 68.90,
            deliveryTotal: 5.50,
            commissionTotal: 4.13,
            grandTotal: 74.40,
            billingSnapshot: {
              fullName: 'Alexandre Martin',
              email: 'alexandre.martin@example.fr',
              phone: '+33 6 12 34 56 78',
              address: '12 Rue de Rivoli',
              city: 'Paris',
              postalCode: '75001',
              country: 'France',
            },
            shippingSnapshot: {
              fullName: 'Alexandre Martin',
              phone: '+33 6 12 34 56 78',
              address: '12 Rue de Rivoli',
              city: 'Paris',
              postalCode: '75001',
              country: 'France',
              notes: 'Code porte 4B21, 2ème étage.',
            },
            paymentStatus: 'PAID',
            paymentMethod: 'MARKETPLACE_CARD_SIMULATION',
            paymentTransactionId: 'tx_demo_nexus_101',
            shopOrdersCount: 2,
            shopOrdersSummary: [
              {
                shopOrderId: 'sord_demo_paris_101',
                shopId: 'shop_nexus_paris',
                shopName: 'Nexus Botanics Lab Paris',
                orderNumber: '#SHOP-PARIS-000101',
                status: 'READY',
                fulfillmentMethod: 'PICKUP',
                total: 39.90,
              },
              {
                shopOrderId: 'sord_demo_alpes_101',
                shopId: 'shop_alpes_annecy',
                shopName: 'Herboristerie des Alpes',
                orderNumber: '#SHOP-ALPES-000101',
                status: 'SHIPPED',
                fulfillmentMethod: 'DELIVERY',
                total: 34.50,
              },
            ],
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
          },
        ];
      })(),
      shopOrders: (() => {
        const existing = db.shopOrders || [];
        if (existing.length > 0) return existing;
        return [
          {
            id: 'sord_demo_paris_101',
            globalOrderId: 'gord_sample_demo_101',
            globalOrderNumber: '#NEXUS-2026-000101',
            shopId: 'shop_nexus_paris',
            shopOwnerId: 'usr_admin',
            shopNameSnapshot: 'Nexus Botanics Lab Paris',
            orderNumber: '#SHOP-PARIS-000101',
            status: 'READY',
            currency: 'EUR',
            subtotal: 39.90,
            deliveryFee: 0,
            commissionRate: 6,
            commissionAmount: 2.39,
            shopNetAmount: 37.51,
            fulfillmentMethod: 'PICKUP',
            pickupInformation: {
              shopName: 'Nexus Botanics Lab Paris',
              address: '18 Rue de Turenne, 75004 Paris',
              openingHours: '10:00 - 19:30',
              instructions: 'Comptoir Express. Munissez-vous du code #SHOP-PARIS-000101.',
            },
            statusTimeline: [
              {
                status: 'PENDING',
                timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
                note: 'Commande reçue par la boutique.',
                author: 'Nexus Dispatch Engine',
              },
              {
                status: 'ACCEPTED',
                timestamp: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
                note: 'Commande acceptée par le pharmacien.',
                author: 'Nexus Botanics Lab Paris',
              },
              {
                status: 'PROCESSING',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                note: 'Préparation et contrôle du lot.',
                author: 'Nexus Botanics Lab Paris',
              },
              {
                status: 'READY',
                timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
                note: 'Colis disponible au comptoir de retrait.',
                author: 'Nexus Botanics Lab Paris',
              },
            ],
            itemsCount: 1,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
          },
          {
            id: 'sord_demo_alpes_101',
            globalOrderId: 'gord_sample_demo_101',
            globalOrderNumber: '#NEXUS-2026-000101',
            shopId: 'shop_alpes_annecy',
            shopOwnerId: 'usr_owner_annecy',
            shopNameSnapshot: 'Herboristerie des Alpes',
            orderNumber: '#SHOP-ALPES-000101',
            status: 'SHIPPED',
            currency: 'EUR',
            subtotal: 29.00,
            deliveryFee: 5.50,
            commissionRate: 6,
            commissionAmount: 1.74,
            shopNetAmount: 32.76,
            fulfillmentMethod: 'DELIVERY',
            shippingAddressSnapshot: {
              fullName: 'Alexandre Martin',
              phone: '+33 6 12 34 56 78',
              address: '12 Rue de Rivoli',
              city: 'Paris',
              postalCode: '75001',
              country: 'France',
              notes: 'Code porte 4B21, 2ème étage.',
            },
            trackingNumber: '8R987654321FR',
            carrierName: 'Colissimo Suivi',
            statusTimeline: [
              {
                status: 'PENDING',
                timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
                note: 'Commande reçue par la boutique.',
                author: 'Nexus Dispatch Engine',
              },
              {
                status: 'ACCEPTED',
                timestamp: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
                note: 'Prise en charge validée.',
                author: 'Herboristerie des Alpes',
              },
              {
                status: 'PROCESSING',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                note: 'Conditionnement des infusions bio sous vide.',
                author: 'Herboristerie des Alpes',
              },
              {
                status: 'SHIPPED',
                timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
                note: 'Colis confié au transporteur La Poste Colissimo.',
                author: 'Herboristerie des Alpes',
              },
            ],
            itemsCount: 2,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
          },
        ];
      })(),
      marketplaceOrderItems: (() => {
        const existing = db.marketplaceOrderItems || [];
        if (existing.length > 0) return existing;
        return [
          {
            id: 'mitem_demo_1',
            globalOrderId: 'gord_sample_demo_101',
            shopOrderId: 'sord_demo_paris_101',
            shopId: 'shop_nexus_paris',
            productId: 'prod_nexus_oil_10',
            productName: 'Huile CBD 10% Broad Spectrum',
            quantity: 1,
            unitPrice: 39.90,
            subtotal: 39.90,
            commissionRate: 6,
            commissionAmount: 2.39,
            currency: 'EUR',
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
          {
            id: 'mitem_demo_2',
            globalOrderId: 'gord_sample_demo_101',
            shopOrderId: 'sord_demo_alpes_101',
            shopId: 'shop_alpes_annecy',
            productId: 'prod_alpes_infusion_relax',
            productName: 'Infusion Alpage Détente Bio',
            quantity: 2,
            unitPrice: 14.50,
            subtotal: 29.00,
            commissionRate: 6,
            commissionAmount: 1.74,
            currency: 'EUR',
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
        ];
      })(),
      paymentIntents: db.paymentIntents || [],
      // Module 10
      financialLedger: db.financialLedger && db.financialLedger.length > 0 ? db.financialLedger : seedFinancialLedger,
      financialOrderSnapshots: db.financialOrderSnapshots || [],
      partnerFinancialAccounts: db.partnerFinancialAccounts && db.partnerFinancialAccounts.length > 0 ? db.partnerFinancialAccounts : seedPartnerFinancialAccounts,
      partnerBalances: db.partnerBalances && db.partnerBalances.length > 0 ? db.partnerBalances : seedPartnerBalances,
      transferRecords: db.transferRecords || [],
      payoutRecords: db.payoutRecords || [],
      paymentDisputes: db.paymentDisputes || [],
      paymentWebhookEvents: db.paymentWebhookEvents || [],
      financialAuditLogs: db.financialAuditLogs || [],
      reconciliationIssues: db.reconciliationIssues && db.reconciliationIssues.length > 0 ? db.reconciliationIssues : seedReconciliationIssues,
      idempotencyKeys: db.idempotencyKeys || [],
      supportedCountries: db.supportedCountries && db.supportedCountries.length > 0 ? db.supportedCountries : seedSupportedCountries,
      financialAdjustments: db.financialAdjustments || [],
      // Module 11
      shippingAddresses: db.shippingAddresses && db.shippingAddresses.length > 0 ? db.shippingAddresses : seedCustomerShippingAddresses,
      deliveryZones: db.deliveryZones && db.deliveryZones.length > 0 ? db.deliveryZones : seedDeliveryZones,
      deliveryOptions: db.deliveryOptions && db.deliveryOptions.length > 0 ? db.deliveryOptions : seedDeliveryOptions,
      shippingRates: db.shippingRates || [],
      freeShippingRules: db.freeShippingRules && db.freeShippingRules.length > 0 ? db.freeShippingRules : seedFreeShippingRules,
      carriers: db.carriers && db.carriers.length > 0 ? db.carriers : seedCarriers,
      carrierServices: db.carrierServices && db.carrierServices.length > 0 ? db.carrierServices : seedCarrierServices,
      shipments: db.shipments && db.shipments.length > 0 ? db.shipments : seedShipments,
      trackingEvents: db.trackingEvents && db.trackingEvents.length > 0 ? db.trackingEvents : seedTrackingEvents,
      pickupLocations: db.pickupLocations && db.pickupLocations.length > 0 ? db.pickupLocations : seedPickupLocations,
      pickupSlots: db.pickupSlots && db.pickupSlots.length > 0 ? db.pickupSlots : seedPickupSlots,
      pickupConfirmations: db.pickupConfirmations && db.pickupConfirmations.length > 0 ? db.pickupConfirmations : seedPickupConfirmations,
      deliveryIncidents: db.deliveryIncidents && db.deliveryIncidents.length > 0 ? db.deliveryIncidents : seedDeliveryIncidents,
      returnRequests: db.returnRequests && db.returnRequests.length > 0 ? db.returnRequests : seedReturnRequests,
      shippingAuditLogs: db.shippingAuditLogs || [],
      // Module 12
      loyaltyAccounts: db.loyaltyAccounts || [],
      loyaltyTransactions: db.loyaltyTransactions || [],
      loyaltyRules: db.loyaltyRules && db.loyaltyRules.length > 0 ? db.loyaltyRules : seedLoyaltyRules,
      loyaltyLevels: db.loyaltyLevels && db.loyaltyLevels.length > 0 ? db.loyaltyLevels : seedLoyaltyLevels,
      achievements: db.achievements && db.achievements.length > 0 ? db.achievements : seedAchievements,
      userAchievements: db.userAchievements || [],
      userStreaks: db.userStreaks || [],
      challenges: db.challenges && db.challenges.length > 0 ? db.challenges : seedChallenges,
      userChallenges: db.userChallenges || [],
      goalRewards: db.goalRewards || [],
      rewards: db.rewards && db.rewards.length > 0 ? db.rewards : seedRewards,
      rewardRedemptions: db.rewardRedemptions || [],
      referralPrograms: db.referralPrograms && db.referralPrograms.length > 0 ? db.referralPrograms : seedReferralPrograms,
      referrals: db.referrals || [],
      referralRiskAssessments: db.referralRiskAssessments || [],
      loyaltyAdminAuditLogs: db.loyaltyAdminAuditLogs || [],
      // Module 13
      subscriptionPlans: db.subscriptionPlans && db.subscriptionPlans.length > 0 ? db.subscriptionPlans : seedSubscriptionPlans,
      subscriptionPrices: db.subscriptionPrices && db.subscriptionPrices.length > 0 ? db.subscriptionPrices : seedSubscriptionPrices,
      featureEntitlements: db.featureEntitlements && db.featureEntitlements.length > 0 ? db.featureEntitlements : seedFeatureEntitlements,
      subscriptions: db.subscriptions || [],
      subscriptionEvents: db.subscriptionEvents || [],
      invoices: db.invoices || [],
      taxConfigurations: db.taxConfigurations && db.taxConfigurations.length > 0 ? db.taxConfigurations : seedTaxConfigurations,
      subscriptionGrants: db.subscriptionGrants || [],
      partnerSubscriptions: db.partnerSubscriptions || [],
      subscriptionPayments: db.subscriptionPayments || [],
      // Module 14
      shopTeamMembers: db.shopTeamMembers && db.shopTeamMembers.length > 0 ? db.shopTeamMembers : seedShopTeamMembers,
      shopReviews: db.shopReviews && db.shopReviews.length > 0 ? db.shopReviews : seedShopReviews,
      stockAdjustmentRecords: db.stockAdjustmentRecords || [],
      shopCustomCategories: db.shopCustomCategories && db.shopCustomCategories.length > 0 ? db.shopCustomCategories : seedShopCustomCategories,
      // Module 15
      marketingCampaigns: db.marketingCampaigns && db.marketingCampaigns.length > 0 ? db.marketingCampaigns : seedMarketingCampaigns,
      marketingPromotions: db.marketingPromotions && db.marketingPromotions.length > 0 ? db.marketingPromotions : seedMarketingPromotions,
      marketingCoupons: db.marketingCoupons && db.marketingCoupons.length > 0 ? db.marketingCoupons : seedMarketingCoupons,
      merchandisingPlacements: db.merchandisingPlacements && db.merchandisingPlacements.length > 0 ? db.merchandisingPlacements : seedMerchandisingPlacements,
      marketingTrackingEvents: db.marketingTrackingEvents && db.marketingTrackingEvents.length > 0 ? db.marketingTrackingEvents : seedMarketingTrackingEvents,
      marketingAttributionRecords: db.marketingAttributionRecords || [],
      marketingConsents: db.marketingConsents && db.marketingConsents.length > 0 ? db.marketingConsents : seedMarketingUserConsents,
      marketingCountryRules: db.marketingCountryRules && db.marketingCountryRules.length > 0 ? db.marketingCountryRules : seedMarketingCountryRules,
      marketingAuditLogs: db.marketingAuditLogs || [],
      // Module 16
      notificationEvents: db.notificationEvents || [],
      notificationTemplates: db.notificationTemplates && db.notificationTemplates.length > 0 ? db.notificationTemplates : seedNotificationTemplates,
      notificationDeliveries: db.notificationDeliveries && db.notificationDeliveries.length > 0 ? db.notificationDeliveries : seedNotificationDeliveries,
      notificationPreferences: db.notificationPreferences || [],
      userCommunicationPreferences: db.userCommunicationPreferences && db.userCommunicationPreferences.length > 0 ? db.userCommunicationPreferences : seedUserCommunicationPreferences,
      marketingConsentRecords: db.marketingConsentRecords && db.marketingConsentRecords.length > 0 ? db.marketingConsentRecords : seedMarketingConsentRecords,
      crmProfiles: db.crmProfiles && db.crmProfiles.length > 0 ? db.crmProfiles : seedCRMProfiles,
      crmSegments: db.crmSegments && db.crmSegments.length > 0 ? db.crmSegments : seedCRMSegments,
      communicationWorkflows: db.communicationWorkflows && db.communicationWorkflows.length > 0 ? db.communicationWorkflows : seedCommunicationWorkflows,
      communicationAttributions: db.communicationAttributions && db.communicationAttributions.length > 0 ? db.communicationAttributions : seedCommunicationAttributions,
      // Module 17
      analyticsEvents: db.analyticsEvents && db.analyticsEvents.length > 0 ? db.analyticsEvents : seedAnalyticsEvents,
      searchEvents: db.searchEvents && db.searchEvents.length > 0 ? db.searchEvents : seedSearchEvents,
      adminAlerts: db.adminAlerts && db.adminAlerts.length > 0 ? db.adminAlerts : seedAdminAlerts,
      backgroundJobs: db.backgroundJobs && db.backgroundJobs.length > 0 ? db.backgroundJobs : seedBackgroundJobs,
      adminAuditLogs: db.adminAuditLogs && db.adminAuditLogs.length > 0 ? db.adminAuditLogs : seedAdminAuditLogs,
      supportCases: db.supportCases && db.supportCases.length > 0 ? db.supportCases : seedSupportCases,
      metricDefinitions: db.metricDefinitions && db.metricDefinitions.length > 0 ? db.metricDefinitions : seedMetricDefinitions,
    };
  }

  private saveImmediate(dataToSave: DatabaseSchema) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write to database file:', err);
    }
  }

  public save() {
    this.saveImmediate(this.data);
    this.queueDirtySync();
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, val: DatabaseSchema[K]) {
    this.data[key] = val;
    this.pendingSyncKeys.add(String(key));
    this.save();
  }

  public getSupabaseStatus() {
    return {
      configured: isServerSupabaseConfigured(),
      syncActive: this.supabaseSyncEnabled,
      projectUrl: getSupabaseUrl(),
      statusMessage: this.supabaseStatusMessage,
      syncedCollectionsCount: this.lastSyncedSnapshots.size,
    };
  }

  public async initSupabaseSync(): Promise<{ synced: boolean; loaded: number; message: string }> {
    const client = getServerSupabase();
    if (!client) {
      this.supabaseSyncEnabled = false;
      this.supabaseStatusMessage = 'Clés Supabase (SUPABASE_SERVICE_ROLE_KEY / ANON_KEY) manquantes dans .env';
      return { synced: false, loaded: 0, message: this.supabaseStatusMessage };
    }

    try {
      const { data: rows, error } = await client
        .from('app_collections')
        .select('collection_key, data');

      if (error) {
        this.supabaseSyncEnabled = false;
        this.supabaseStatusMessage = `Table app_collections non disponible sur Supabase (${error.message}). Exécutez supabase-schema.sql dans le SQL Editor.`;
        console.warn('[Supabase Sync]', this.supabaseStatusMessage);
        return { synced: false, loaded: 0, message: this.supabaseStatusMessage };
      }

      if (rows && rows.length > 0) {
        const merged: Partial<DatabaseSchema> = { ...this.data };
        for (const row of rows) {
          const key = row.collection_key as keyof DatabaseSchema;
          if (key in this.data && row.data !== undefined && row.data !== null) {
            (merged as any)[key] = row.data;
            this.lastSyncedSnapshots.set(String(key), JSON.stringify(row.data));
          }
        }
        this.data = this.ensureSchemaIntegrity(merged);
        this.saveImmediate(this.data);
        this.supabaseSyncEnabled = true;
        this.supabaseStatusMessage = `Synchronisé avec Supabase PostgreSQL (${rows.length} collections chargées)`;
        console.log(`[Supabase Sync] ✅ ${rows.length} collections restaurées depuis ${getSupabaseUrl()}`);
        return { synced: true, loaded: rows.length, message: this.supabaseStatusMessage };
      }

      // First initialization on empty Supabase table: seed all collections in batches
      const allKeys = Object.keys(this.data) as (keyof DatabaseSchema)[];
      const batchSize = 15;
      for (let i = 0; i < allKeys.length; i += batchSize) {
        const chunk = allKeys.slice(i, i + batchSize).map((k) => {
          const payload = this.data[k];
          this.lastSyncedSnapshots.set(String(k), JSON.stringify(payload));
          return {
            collection_key: String(k),
            data: payload,
            updated_at: new Date().toISOString(),
          };
        });
        const { error: upsertErr } = await client
          .from('app_collections')
          .upsert(chunk, { onConflict: 'collection_key' });
        if (upsertErr) {
          throw new Error(upsertErr.message);
        }
      }

      this.supabaseSyncEnabled = true;
      this.supabaseStatusMessage = `Synchronisé avec Supabase PostgreSQL (${allKeys.length} collections initialisées)`;
      console.log(`[Supabase Sync] ✅ ${allKeys.length} collections initialisées sur ${getSupabaseUrl()}`);
      return { synced: true, loaded: allKeys.length, message: this.supabaseStatusMessage };
    } catch (err: any) {
      this.supabaseSyncEnabled = false;
      this.supabaseStatusMessage = `Erreur connexion Supabase : ${err?.message || 'inconnue'}`;
      console.warn('[Supabase Sync]', this.supabaseStatusMessage);
      return { synced: false, loaded: 0, message: this.supabaseStatusMessage };
    }
  }

  private queueDirtySync() {
    if (!this.supabaseSyncEnabled) return;

    const allKeys = Object.keys(this.data) as (keyof DatabaseSchema)[];
    for (const key of allKeys) {
      const strKey = String(key);
      if (this.pendingSyncKeys.has(strKey)) continue;
      try {
        const serialized = JSON.stringify(this.data[key]);
        if (this.lastSyncedSnapshots.get(strKey) !== serialized) {
          this.pendingSyncKeys.add(strKey);
        }
      } catch {
        // Ignore unserializable objects
      }
    }

    if (this.pendingSyncKeys.size === 0) return;
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      void this.flushSyncToSupabase();
    }, 150);
  }

  private async flushSyncToSupabase() {
    if (!this.supabaseSyncEnabled || this.pendingSyncKeys.size === 0) return;
    const client = getServerSupabase();
    if (!client) return;

    const keysToFlush = Array.from(this.pendingSyncKeys);
    this.pendingSyncKeys.clear();

    const rows = keysToFlush.map((k) => {
      const payload = (this.data as any)[k];
      try {
        this.lastSyncedSnapshots.set(k, JSON.stringify(payload));
      } catch {}
      return {
        collection_key: k,
        data: payload,
        updated_at: new Date().toISOString(),
      };
    });

    try {
      const { error } = await client
        .from('app_collections')
        .upsert(rows, { onConflict: 'collection_key' });
      if (error) {
        console.error('[Supabase Sync] Write failed:', error.message);
      }
    } catch (err: any) {
      console.error('[Supabase Sync] Write exception:', err?.message);
    }
  }

  public logAudit(action: string, resource: string, userId?: string, details?: Record<string, unknown>) {
    const audit: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(audit);
    // Keep max 500 logs in memory
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }

  private getInitialSeed(): DatabaseSchema {
    const isProduction = process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEEDS !== 'true';
    const seedUsersData = isProduction
      ? { users: [], userProfiles: [], userConsents: [], userPreferences: [], thcProfiles: [], cbdProfiles: [], progress: [] }
      : getSeedUsers();
    return {
      users: seedUsersData.users,
      userProfiles: seedUsersData.userProfiles,
      userConsents: seedUsersData.userConsents,
      consentRecords: [],
      userPreferences: seedUsersData.userPreferences,
      communicationPreferences: [],
      thcProfiles: seedUsersData.thcProfiles,
      consumptionProfiles: [],
      cbdProfiles: seedUsersData.cbdProfiles,
      wellnessProfiles: [],
      profileHistories: [],
      consumptionEntries: [],
      wellnessEntries: [],
      thcCravings: [],
      thcReductionPlans: [],
      thcTriggers: [],
      thcDailyGoals: [],
      thcJourneyEvents: [],
      wellnessChallenges: [],
      thcBudgetSettings: [],
      userEducationProgress: [],
      cbdStores: [
        {
          id: 'store_nexus_botanics',
          name: 'Nexus Botanics Lab',
          legalEntity: 'Nexus Premium Solutions SAS',
          registrationNumber: 'FR84910293847',
          city: 'Paris',
          country: 'France',
          description: 'Laboratoire certifié de formulations botaniques et extraits de chanvre légaux.',
          website: 'https://nexus-solutions.example.com',
          verified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'store_alpes_cbd',
          name: 'Herboristerie des Alpes CBD',
          legalEntity: 'Alpes Chanvre Bien-être SARL',
          registrationNumber: 'FR93847291023',
          city: 'Annecy',
          country: 'France',
          description: 'Culture biologique locale et tisanes bien-être aux terpènes naturels.',
          website: 'https://alpes-cbd.example.com',
          verified: true,
          createdAt: new Date().toISOString(),
        },
      ],
      cbdProducts: [
        {
          id: 'prod_oil_relax_10',
          storeId: 'store_nexus_botanics',
          shopId: 'store_nexus_botanics',
          name: 'Huile CBD 10% Broad Spectrum Sérénité',
          brand: 'Nexus Botanics Lab',
          category: 'oil',
          description: 'Huile MCT biologique enrichie en phytocannabinoïdes naturels (sans THC). Arôme menthe douce.',
          cbdPercentage: 10,
          thcPercentage: 0.0,
          cannabinoidProfile: {
            cbd: 10.1,
            thc: 0.0,
            cbg: 1.2,
            cbn: 0.4,
            cbc: 0.2,
          },
          terpeneProfile: ['Myrcène', 'Limonène', 'Linalol'],
          ingredients: ['Huile de coco MCT biologique', 'Extrait de chanvre broad spectrum', 'Huile essentielle de menthe poivrée bio'],
          carrierOil: 'Huile MCT Coco biologique',
          flavors: ['Menthe douce'],
          price: 34.9,
          volumeOrWeight: '10ml (200 gouttes)',
          quantity: 10,
          quantityUnit: 'ml',
          countryOfOrigin: 'France (Chanvre bio certifié)',
          sourceType: 'catalog',
          barcode: '3760123456789',
          batchNumber: 'NEXUS-26-01-OIL',
          qualityInformation: {
            labName: 'Laboratoire Phytocontrol France',
            certificateNumber: 'LAB-CERT-FR-88392',
            analysisDate: '2026-01-15',
            cultivationMethod: 'Agriculture biologique française',
            extractionMethod: 'Extraction CO2 supercritique à froid',
            manufacturerName: 'Nexus Botanics Lab SAS',
          },
          inStock: true,
          featured: true,
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod_tea_sommeil',
          storeId: 'store_alpes_cbd',
          shopId: 'store_alpes_cbd',
          name: 'Infusion Botanique Sommeil & Camomille',
          brand: 'Herboristerie des Alpes',
          category: 'infusion',
          description: 'Mélange de chanvre certifié, camomille matricaire, mélisse et passiflore pour une routine nocturne apaisante.',
          cbdPercentage: 3.5,
          thcPercentage: 0.0,
          cannabinoidProfile: {
            cbd: 3.5,
            thc: 0.0,
            cbg: 0.3,
          },
          terpeneProfile: ['Bisabolol', 'Linalol', 'Caryophyllène'],
          ingredients: ['Chanvre bio (30%)', 'Camomille matricaire bio (25%)', 'Mélisse bio (25%)', 'Passiflore bio (20%)'],
          flavors: ['Camomille', 'Plantes alpines'],
          price: 14.5,
          volumeOrWeight: '50g',
          quantity: 50,
          quantityUnit: 'g',
          countryOfOrigin: 'France (Alpes)',
          sourceType: 'catalog',
          barcode: '3760987654321',
          batchNumber: 'ALP-2026-02-TEA',
          qualityInformation: {
            labName: 'Eurofins Analytics France',
            certificateNumber: 'EUR-FR-99201',
            analysisDate: '2026-01-20',
            cultivationMethod: 'Plein champ biologique certifié AB',
            manufacturerName: 'Alpes Chanvre Bien-être SARL',
          },
          inStock: true,
          featured: true,
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod_balm_muscle',
          storeId: 'store_nexus_botanics',
          shopId: 'store_nexus_botanics',
          name: 'Baume Récupération Active CBD & Arnica',
          brand: 'Nexus Botanics Lab',
          category: 'cosmetic',
          description: 'Formule dermique pour massage décontractant après le sport. 500mg de CBD.',
          cbdPercentage: 2.0,
          thcPercentage: 0.0,
          cbdAmount: 500,
          cannabinoidProfile: {
            cbd: 2.0,
            thc: 0.0,
            cbg: 0.5,
          },
          terpeneProfile: ['Eucalyptol', 'Camphre naturel', 'Bêta-Caryophyllène'],
          ingredients: ['Beurre de karité bio', 'Extrait d’arnica montana bio', 'Isolat de CBD 99.8%', 'Huile essentielle d’eucalyptus globulus'],
          price: 28.0,
          volumeOrWeight: '60ml',
          quantity: 60,
          quantityUnit: 'ml',
          countryOfOrigin: 'France',
          sourceType: 'catalog',
          barcode: '3760555666777',
          batchNumber: 'BALM-26-004',
          qualityInformation: {
            labName: 'Cosmetic Labs Paris',
            certificateNumber: 'COS-LAB-2026-88',
            analysisDate: '2026-02-01',
            manufacturerName: 'Nexus Botanics Lab SAS',
          },
          inStock: true,
          featured: false,
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod_flower_alpine_green',
          storeId: 'store_alpes_cbd',
          shopId: 'store_alpes_cbd',
          name: 'Fleur Alpine Green Terpènes Vifs',
          brand: 'Herboristerie des Alpes',
          category: 'flower',
          description: 'Fleurs séchées de chanvre légal français aux notes citronnées et pinède. Taux certifié conforme législation européenne.',
          cbdPercentage: 8.5,
          thcPercentage: 0.18,
          cannabinoidProfile: {
            cbd: 8.5,
            thc: 0.18,
            cbg: 0.8,
            cbc: 0.3,
          },
          terpeneProfile: ['Limonène', 'Pinène', 'Myrcène'],
          price: 22.0,
          volumeOrWeight: '5g',
          quantity: 5,
          quantityUnit: 'g',
          countryOfOrigin: 'France (Savoie)',
          sourceType: 'catalog',
          barcode: '3760444333221',
          batchNumber: 'ALP-FL-2026-09',
          qualityInformation: {
            labName: 'PhytoAnalytics Grenoble',
            certificateNumber: 'LAB-GRE-2026-104',
            analysisDate: '2026-02-10',
            cultivationMethod: 'Greenhouse sans pesticides',
            manufacturerName: 'Alpes Chanvre Bien-être SARL',
          },
          inStock: true,
          featured: false,
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'prod_caps_omega',
          storeId: 'store_nexus_botanics',
          shopId: 'store_nexus_botanics',
          name: 'Gélules Végétales CBD & Oméga-3',
          brand: 'Nexus Botanics Lab',
          category: 'capsule',
          description: 'Capsules d’huile de graines de chanvre et CBD pour une prise dosée et précise sans goût prononcé.',
          cbdPercentage: null,
          cbdAmount: 25,
          thcPercentage: 0.0,
          cannabinoidProfile: {
            cbd: 5.0,
            thc: 0.0,
          },
          terpeneProfile: ['Caryophyllène'],
          ingredients: ['Huile de graines de chanvre première pression à froid', 'Extrait de CBD', 'Enveloppe végétale (gélule pullulane)'],
          price: 39.0,
          volumeOrWeight: '60 gélules (25mg/gélule)',
          quantity: 60,
          quantityUnit: 'capsules',
          countryOfOrigin: 'France',
          sourceType: 'catalog',
          barcode: '3760888999000',
          batchNumber: 'CAPS-2026-01',
          qualityInformation: {
            labName: 'Laboratoire Phytocontrol France',
            certificateNumber: 'LAB-CERT-FR-91024',
            analysisDate: '2026-01-28',
            manufacturerName: 'Nexus Botanics Lab SAS',
          },
          inStock: true,
          featured: false,
          isUserCreated: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      cbdProductBatches: [
        {
          id: 'batch_2026_01',
          productId: 'prod_oil_relax_10',
          batchNumber: 'NEXUS-26-01-OIL',
          labCertificateNumber: 'LAB-CERT-FR-88392',
          testedCbdRate: 10.12,
          testedThcRate: 0.0,
          testDate: '2026-01-15',
          expiryDate: '2027-01-15',
        },
      ],
      storeProducts: [],
      storeAdmins: [],
      orders: [],
      orderItems: [],
      payments: [],
      educationalContents: [
        ...seedEducationalContents,
        {
          id: 'edu_harm_reduction_combustion',
          title: 'Combustion vs Vaporisation : Réduction des Risques Respiratoires',
          slug: 'combustion-vs-vaporisation',
          category: 'harm_reduction',
          summary: 'Comprendre pourquoi la fumée est la source principale des toxiques et comment préserver sa sphère respiratoire.',
          content: `La combustion de matière végétale (herbe, tabac) génère des goudrons, du monoxyde de carbone (CO) et des hydrocarbures aromatiques polycycliques (HAP), particulièrement délétères pour l'arbre bronchique et le système cardiovasculaire.

La vaporisation chauffe la matière à une température contrôlée (généralement entre 170°C et 200°C), en dessous du point d'ignition (environ 230°C). Cela permet d'extraire les composés volatils sans créer de combustion ni de goudrons.

Conseils de bon sens sanitaire :
1. Éviter impérativement le mélange avec le tabac (qui entraîne une puissante dépendance nicotinique croisée).
2. Ne jamais retenir sa respiration : les alvéoles absorbent les principes actifs en quelques millisecondes, retenir la fumée ne fait qu'augmenter le dépôt de suie.
3. Boire de l'eau pour éviter la sécheresse buccale qui favorise les inflammations dentaires.`,
          readTimeMinutes: 4,
          targetAudience: 'ALL',
          sourceReferences: [
            'Observatoire Français des Drogues et des Tendances Addictives (OFDT)',
            'Inserm - Synthèse Réduction des Risques',
          ],
          medicalReviewDisclaimer: "Contenu informatif et préventif. Ne remplace pas l'avis d'un pneumologue ou d'un tabacologue.",
          publishedAt: '2026-01-10',
        },
        {
          id: 'edu_cravings_4d',
          title: 'Gérer les Envies Fugaces : La Méthode Comportementale des 4 D',
          slug: 'methode-comportementale-4d',
          category: 'lifestyle',
          summary: 'Une envie intense (craving) dure en moyenne entre 5 et 15 minutes. Voici comment la traverser sans céder à l’automatisme.',
          content: `Lorsque le cerveau associe une situation (fin de journée, dispute, ennui) à un automatisme, l'envie apparaît sous forme d'une vague émotionnelle et physiologique.

La technique des 4 D (Delay, Distract, Deep Breathe, Drink Water) :
1. **Delay (Différer)** : Dites-vous « J'attends 10 minutes avant de décider ». Très souvent, le pic d'intensité redescend.
2. **Distract (Se distraire)** : Changez d'environnement immédiat, sortez faire le tour du pâté de maisons ou engagez une activité manuelle.
3. **Deep Breathe (Respiration profonde)** : Pratiquez la cohérence cardiaque (5 secondes d'inspiration, 5 secondes d'expiration pendant 3 minutes) pour abaisser l'adrénaline.
4. **Drink Water (Boire un grand verre d'eau)** : L'action mécanique de déglutition aide à rompre le signal réflexe.`,
          readTimeMinutes: 3,
          targetAudience: 'THC',
          sourceReferences: ['Haute Autorité de Santé (HAS) - Accompagnement de l’arrêt'],
          medicalReviewDisclaimer: 'Outil de soutien comportemental non médical.',
          publishedAt: '2026-01-12',
        },
        {
          id: 'edu_sleep_without_substances',
          title: 'Retrouver un Sommeil Réparateur et Autonome',
          slug: 'sommeil-reparateur-autonomie',
          category: 'wellness',
          summary: 'Comprendre l’impact du THC sur le sommeil paradoxal (REM) et restructurer son hygiène de coucher.',
          content: `Bien que le THC favorise initialement l’endormissement en raison de son action sédative, les études polysomnographiques montrent qu’il réduit substantiellement le temps passé en sommeil paradoxal (sommeil des rêves et de la consolidation émotionnelle).

Lors d’une diminution ou d’un arrêt, il est classique d’observer :
- Des rêves vifs et intenses (phénomène de rebond de sommeil REM), signe que le cerveau retrouve son architecture naturelle.
- Une latence d’endormissement accrue pendant les 5 à 10 premiers jours.

Piliers d'hygiène de vie :
- Respecter une heure fixe de coucher et de lever même le week-end.
- Éteindre les écrans émetteurs de lumière bleue 60 minutes avant le coucher.
- Maintenir une chambre à 18°C-19°C.
- En cas de réveil nocturne, ne pas rester au lit à ruminer plus de 20 minutes : se lever, lire quelques pages à lumière tamisée, puis retourner au lit dès le premier bâillement.`,
          readTimeMinutes: 5,
          targetAudience: 'ALL',
          sourceReferences: ['Institut National du Sommeil et de la Vigilance (INSV)'],
          medicalReviewDisclaimer: 'Informations générales de bien-être.',
          publishedAt: '2026-01-15',
        },
        {
          id: 'edu_help_contacts',
          title: 'Ressources Officielles et Accompagnement Professionnel',
          slug: 'ressources-officielles-aide',
          category: 'legislation',
          summary: 'Numéros gratuits, écoute anonyme et structures de proximité (CSAPA, CJC).',
          content: `Cannabis Care est un outil compagnon et ne se substitue en aucun cas à un professionnel de santé ou à une structure spécialisée.

En France, des professionnels qualifiés vous écoutent de manière totalement anonyme et gratuite :

- **Drogues Info Service** : 0 800 23 13 13 (Appel gratuit 7j/7 de 8h à 2h) ou sur drogues-info-service.fr (chat en ligne).
- **Consultations Jeunes Consommateurs (CJC)** : Lieux d'accueil gratuits et confidentiels pour les 12-25 ans et leurs familles au sein des CSAPA.
- **Fil Santé Jeunes** : 0 800 235 236 ou 3224 (gratuit et anonyme).
- **Numéro d'urgence européen** : 112 (SAMU : 15).

N'hésitez jamais à échanger en toute franchise avec votre médecin traitant.`,
          readTimeMinutes: 2,
          targetAudience: 'ALL',
          sourceReferences: ['Ministère de la Santé et de la Prévention', 'Santé Publique France'],
          medicalReviewDisclaimer: 'Répertoire institutionnel de santé publique.',
          publishedAt: '2026-01-01',
        },
      ],
      cannabinoids: seedCannabinoidsExtended,
      terpenes: seedTerpenesExtended,
      educationalPaths: seedEducationalPaths,
      educationalProgress: [],
      educationalFavorites: [],
      educationalHistory: [],
      educationalTranslations: [],
      goals: [
        {
          id: 'goal_thc_understand',
          title: 'Comprendre et cartographier mes consommations',
          description: 'Noter chaque prise pendant 7 jours sans jugement pour identifier les contextes clés.',
          targetType: 'THC',
          category: 'awareness',
          defaultTargetDays: 7,
        },
        {
          id: 'goal_thc_delay_evening',
          title: 'Pas de consommation avant 20h00',
          description: 'Libérer les journées et préserver la concentration professionnelle et personnelle.',
          targetType: 'THC',
          category: 'reduction',
          defaultTargetDays: 14,
        },
        {
          id: 'goal_thc_reduce_50',
          title: 'Réduire de moitié ma fréquence hebdomadaire',
          description: 'Passer de 6 jours à 3 jours de consommation déclarée par semaine.',
          targetType: 'THC',
          category: 'reduction',
          defaultTargetDays: 21,
        },
        {
          id: 'goal_thc_sober_week',
          title: 'Une semaine complète sans THC',
          description: 'Pause de tolérance de 7 jours consécutifs pour réinitialiser la clarté d’esprit.',
          targetType: 'THC',
          category: 'cessation',
          defaultTargetDays: 7,
        },
        {
          id: 'goal_thc_complete_stop',
          title: 'Arrêt complet et durable',
          description: 'Retrouver une pleine autonomie au quotidien sans dépendre d’une substance.',
          targetType: 'THC',
          category: 'cessation',
          defaultTargetDays: 30,
        },
        {
          id: 'goal_cbd_routine',
          title: 'Établir une routine bien-être CBD régulière',
          description: 'Prendre mes gouttes à heure fixe et observer la qualité de mon sommeil.',
          targetType: 'CBD',
          category: 'wellbeing',
          defaultTargetDays: 14,
        },
        {
          id: 'goal_cbd_optimize_intake',
          title: 'Optimiser et rationaliser mon dosage',
          description: 'Trouver le dosage minimal efficace pour mon confort sans surconsommation.',
          targetType: 'CBD',
          category: 'wellbeing',
          defaultTargetDays: 10,
        },
      ],
      userGoals: [],
      progress: [],
      badges: [
        {
          id: 'badge_first_step',
          code: 'FIRST_STEP',
          title: 'Premier Pas Réfléchi',
          description: 'Inscription et acceptation de la charte de santé préventive.',
          iconName: 'ShieldCheck',
        },
        {
          id: 'badge_first_log',
          code: 'FIRST_LOG',
          title: 'Journaliste Débutant',
          description: 'Première entrée enregistrée dans votre journal de bord.',
          iconName: 'BookOpen',
        },
        {
          id: 'badge_3_days_clean',
          code: '3_DAYS_SOBER',
          title: 'Cap des 72 Heures',
          description: '3 jours consécutifs de réduction ou sans substance.',
          iconName: 'Sparkles',
        },
        {
          id: 'badge_7_days_mastery',
          code: '7_DAYS_SOBER',
          title: 'Semaine de Clarté',
          description: '7 jours de maîtrise de vos habitudes enregistrés.',
          iconName: 'Award',
        },
        {
          id: 'badge_money_saver',
          code: 'MONEY_SAVER',
          title: 'Économie Concrète',
          description: 'Plus de 50 € d’économies estimées grâce à la réduction.',
          iconName: 'Coins',
        },
        {
          id: 'badge_cbd_zen',
          code: 'CBD_EXPLORER',
          title: 'Exploration Équilibrée',
          description: 'Profil CBD initialisé avec objectifs de sommeil et sérénité.',
          iconName: 'HeartHandshake',
        },
        {
          id: 'badge_first_thc_free_day',
          code: 'FIRST_THC_FREE_DAY',
          title: 'Première Journée Sans THC',
          description: 'Une journée complète sans consommation enregistrée.',
          iconName: 'Flame',
        },
        {
          id: 'badge_14_days_clean',
          code: '14_DAYS_SOBER',
          title: '14 Jours d’Autonomie',
          description: 'Deux semaines de maîtrise de vos habitudes.',
          iconName: 'Target',
        },
        {
          id: 'badge_30_days_clean',
          code: '30_DAYS_SOBER',
          title: 'Cap des 30 Jours',
          description: 'Un mois complet sans THC ou d’objectifs atteints.',
          iconName: 'Crown',
        },
        {
          id: 'badge_10_logs_completed',
          code: '10_LOGS_COMPLETED',
          title: 'Régularité Exemplaire',
          description: '10 entrées enregistrées dans votre journal de bord.',
          iconName: 'Layers',
        },
        {
          id: 'badge_craving_surfer',
          code: 'CRAVING_SURFER',
          title: 'Surfeur d’Envies',
          description: 'Une envie intense traversée avec succès grâce à un outil d’urgence.',
          iconName: 'Waves',
        },
        {
          id: 'badge_slip_resilience',
          code: 'FIRST_SLIP_RESILIENCE',
          title: 'Résilience Bienveillante',
          description: 'Reprise immédiate de votre parcours après un écart avec réflexion constructive.',
          iconName: 'RefreshCw',
        },
        {
          id: 'badge_challenge_champ',
          code: 'CHALLENGE_CHAMPION',
          title: 'Explorateur du Quotidien',
          description: 'Premier micro-défi bien-être validé.',
          iconName: 'CheckCircle',
        },
        {
          id: 'badge_plan_builder',
          code: 'FIRST_PLAN_CREATED',
          title: 'Stratège Engagé',
          description: 'Plan personnalisé de réduction configuré avec succès.',
          iconName: 'Compass',
        },
      ],
      notifications: [],
      aiConversations: [],
      aiMessages: [],
      aiRecommendations: [],
      aiAssistantSettings: [],
      auditLogs: [],
      cbdConsumptions: [],
      cbdUserProducts: [],
      cbdProductScans: [],
      cbdWellnessObservations: [],
      cbdWellnessGoals: [],
      sleepEntries: [],
      moodEntries: [],
      stressEntries: [],
      energyEntries: [],
      activityEntries: [],
      nutritionEntries: [],
      hydrationEntries: [],
      relaxationEntries: [],
      personalNotes: [],
      lifeEvents: [],
      dashboardPreferences: [],
      partnerShops: seedPartnerShops,
      productCategories: seedProductCategories,
      marketplaceProducts: seedMarketplaceProducts,
      userFavoriteProducts: [],
      userFavoriteShops: [],
      productViewHistory: [],
      shopViewHistory: [],
      commissionRules: seedCommissionRules,
      shopIntegrations: [],
      marketplaceCarts: [],
      globalOrders: [],
      shopOrders: [],
      marketplaceOrderItems: [],
      paymentIntents: [],
      // Module 10 Initial Seed
      financialLedger: seedFinancialLedger,
      financialOrderSnapshots: [],
      partnerFinancialAccounts: seedPartnerFinancialAccounts,
      partnerBalances: seedPartnerBalances,
      transferRecords: [],
      payoutRecords: [],
      paymentDisputes: [],
      paymentWebhookEvents: [],
      financialAuditLogs: [],
      reconciliationIssues: seedReconciliationIssues,
      idempotencyKeys: [],
      supportedCountries: seedSupportedCountries,
      financialAdjustments: [],
      // Module 11 Initial Seed
      shippingAddresses: seedCustomerShippingAddresses,
      deliveryZones: seedDeliveryZones,
      deliveryOptions: seedDeliveryOptions,
      shippingRates: [],
      freeShippingRules: seedFreeShippingRules,
      carriers: seedCarriers,
      carrierServices: seedCarrierServices,
      shipments: seedShipments,
      trackingEvents: seedTrackingEvents,
      pickupLocations: seedPickupLocations,
      pickupSlots: seedPickupSlots,
      pickupConfirmations: seedPickupConfirmations,
      deliveryIncidents: seedDeliveryIncidents,
      returnRequests: seedReturnRequests,
      shippingAuditLogs: [],
      // Module 12 Initial Seed
      loyaltyAccounts: [],
      loyaltyTransactions: [],
      loyaltyRules: seedLoyaltyRules,
      loyaltyLevels: seedLoyaltyLevels,
      achievements: seedAchievements,
      userAchievements: [],
      userStreaks: [],
      challenges: seedChallenges,
      userChallenges: [],
      goalRewards: [],
      rewards: seedRewards,
      rewardRedemptions: [],
      referralPrograms: seedReferralPrograms,
      referrals: [],
      referralRiskAssessments: [],
      loyaltyAdminAuditLogs: [],
      // Module 13 Initial Seed
      subscriptionPlans: seedSubscriptionPlans,
      subscriptionPrices: seedSubscriptionPrices,
      featureEntitlements: seedFeatureEntitlements,
      subscriptions: [],
      subscriptionEvents: [],
      invoices: [],
      taxConfigurations: seedTaxConfigurations,
      subscriptionGrants: [],
      partnerSubscriptions: [],
      subscriptionPayments: [],
      // Module 14 Initial Seed
      shopTeamMembers: seedShopTeamMembers,
      shopReviews: seedShopReviews,
      stockAdjustmentRecords: [],
      shopCustomCategories: seedShopCustomCategories,
      // Module 15 Initial Seed
      marketingCampaigns: seedMarketingCampaigns,
      marketingPromotions: seedMarketingPromotions,
      marketingCoupons: seedMarketingCoupons,
      merchandisingPlacements: seedMerchandisingPlacements,
      marketingTrackingEvents: seedMarketingTrackingEvents,
      marketingAttributionRecords: [],
      marketingConsents: seedMarketingUserConsents,
      marketingCountryRules: seedMarketingCountryRules,
      marketingAuditLogs: [],
      // Module 16 Initial Seed
      notificationEvents: [],
      notificationTemplates: seedNotificationTemplates,
      notificationDeliveries: seedNotificationDeliveries,
      notificationPreferences: [],
      userCommunicationPreferences: seedUserCommunicationPreferences,
      marketingConsentRecords: seedMarketingConsentRecords,
      crmProfiles: seedCRMProfiles,
      crmSegments: seedCRMSegments,
      communicationWorkflows: seedCommunicationWorkflows,
      communicationAttributions: seedCommunicationAttributions,
      // Module 17 Initial Seed
      analyticsEvents: seedAnalyticsEvents,
      searchEvents: seedSearchEvents,
      adminAlerts: seedAdminAlerts,
      backgroundJobs: seedBackgroundJobs,
      adminAuditLogs: seedAdminAuditLogs,
      supportCases: seedSupportCases,
      metricDefinitions: seedMetricDefinitions,
    };
  }
}

export const db = new DatabaseEngine();
