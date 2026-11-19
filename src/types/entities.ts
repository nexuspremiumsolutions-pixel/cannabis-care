/**
 * CANNABIS CARE — NEXUS PREMIUM SOLUTIONS
 * Comprehensive Domain Entity Definitions
 */

export enum UserRole {
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
  STORE_ADMIN = 'STORE_ADMIN',
  SHOP_OWNER = 'SHOP_OWNER',
  SHOP_MANAGER = 'SHOP_MANAGER',
  SHOP_STAFF = 'SHOP_STAFF',
  CONTENT_EDITOR = 'CONTENT_EDITOR',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ONBOARDING_VERSION = '1.0.0';

export enum ProfileType {
  UNDETERMINED = 'UNDETERMINED',
  THC = 'THC',
  CBD = 'CBD',
  NEITHER = 'NEITHER',
  WELLNESS = 'WELLNESS',
}

export enum THCStatus {
  NEVER_USED = 'NEVER_USED',
  FORMER_USER = 'FORMER_USER',
  CURRENT_USER = 'CURRENT_USER',
  UNKNOWN = 'UNKNOWN',
  DECLINED = 'DECLINED',
}

export enum CBDStatus {
  NEVER_USED = 'NEVER_USED',
  CURRENT_USER = 'CURRENT_USER',
  FORMER_USER = 'FORMER_USER',
  UNKNOWN = 'UNKNOWN',
  DECLINED = 'DECLINED',
}

export enum PrimaryPath {
  THC = 'THC',
  CBD = 'CBD',
  WELLNESS = 'WELLNESS',
  UNDETERMINED = 'UNDETERMINED',
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface OnboardingDraft {
  currentStep: number;
  totalSteps: number;
  thcStatus?: THCStatus;
  formerUsageDetails?: {
    stoppedDuration?: string;
    formerFrequency?: string;
    wantsToUnderstandPast?: boolean;
    wantsToTrackProgression?: boolean;
  };
  thcUsage?: {
    frequency?: string;
    quantity?: string;
    quantityUnit?: string;
    duration?: string;
    contexts?: string[];
    motivations?: string[];
    goal?: string;
    reductionMotivations?: string[];
    estimatedMonthlyBudget?: number;
  };
  cbdStatus?: CBDStatus;
  cbdUsage?: {
    currentUse?: string;
    consumptionMethods?: string[];
    preferredProductTypes?: string[];
    products?: CBDRecordedProduct[];
  };
  wellness?: {
    trackedCategories?: string[];
    sleepDetails?: {
      averageDurationHours?: number;
      declaredQualityRating?: number;
      sleepOnsetDifficulty?: string;
      nightAwakenings?: string;
      generalSatisfaction?: string;
    };
    physicalActivityDetails?: {
      frequency?: string;
      activityTypes?: string[];
    };
  };
  communication?: {
    preferredTone?: 'neutral' | 'motivating' | 'benevolent' | 'direct' | 'pedagogical';
    preferredContentTypes?: string[];
    remindersEnabled?: boolean;
    journalReminderEnabled?: boolean;
    goalReminderEnabled?: boolean;
    encouragementsEnabled?: boolean;
    weeklySummaryEnabled?: boolean;
    programRemindersEnabled?: boolean;
    educationalUpdatesEnabled?: boolean;
    reminderTime?: string;
  };
  consents?: {
    experiencePersonalization?: boolean;
    healthDisclaimer?: boolean;
    remindersNotifications?: boolean;
    anonymizedResearchTelemetry?: boolean;
  };
  lastSavedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  nickname: string;
  profileType: ProfileType;
  primaryPath?: PrimaryPath;
  thcStatus?: THCStatus;
  cbdStatus?: CBDStatus;
  isOnboarded: boolean;
  onboardingCompleted?: boolean;
  onboardingVersion?: string;
  currentStep?: number;
  recommendedModules?: string[];
  onboardingDraft?: OnboardingDraft;
  ageCategory?: '18-25' | '26-35' | '36-50' | '51+';
  createdAt: string;
  updatedAt: string;
}

export interface UserConsent {
  id: string;
  userId: string;
  termsAccepted: boolean;
  healthDisclaimerAccepted: boolean;
  privacyPolicyAccepted: boolean;
  gdprDataProcessingConsent: boolean;
  analyticsConsent: boolean;
  consentTimestamp: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'experience_personalization' | 'health_disclaimer' | 'reminders_notifications' | 'anonymized_research_telemetry' | 'terms_of_service' | 'privacy_policy';
  version: string;
  granted: boolean;
  grantedAt: string;
  revokedAt?: string;
  source: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  notificationsEnabled: boolean;
  dailyReminderTime?: string;
  currency: 'EUR' | 'USD' | 'CHF' | 'CAD';
  language: 'fr' | 'en' | 'ar';
  darkMode: boolean;
  updatedAt: string;
}

export interface ConsumptionProfile {
  id: string;
  userId: string;
  thcStatus: THCStatus;
  thcFrequency?: 'daily_multiple' | 'daily_once' | 'several_per_week' | 'weekly' | 'monthly' | 'stopped' | 'variable' | 'declined';
  thcDuration?: 'less_than_month' | '1_to_6_months' | '6_months_to_1_year' | '1_to_3_years' | '3_to_5_years' | 'more_than_5_years' | 'variable';
  thcTypicalQuantity?: string;
  thcQuantityUnit?: 'grams' | 'joints' | 'sessions' | 'other';
  consumptionContexts?: string[];
  declaredMotivations?: string[];
  reductionGoal?: string;
  preferredGoal?: 'understand' | 'reduce' | 'quit_gradual' | 'quit_complete' | 'prevent_relapse' | 'lifestyle' | 'undecided' | 'observe' | 'explore_without_thc' | 'declined';
  reductionMotivations?: string[];
  averageCostPerMonthEstimated?: number;
  formerUsageDetails?: {
    stoppedDuration?: string;
    formerFrequency?: string;
    wantsToUnderstandPast?: boolean;
    wantsToTrackProgression?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface THCProfile extends ConsumptionProfile {
  firstConsumptionAgeApprox?: number;
  consumptionStatus: 'current' | 'past' | 'occasional' | 'reducing';
  frequency: 'daily_multiple' | 'daily_once' | 'several_per_week' | 'weekly' | 'monthly' | 'stopped';
  approxQuantity: string;
  averageCostPerMonthEstimated: number;
  contexts: string[];
  declaredReasons: string[];
  habits: string[];
  previousReductionAttemptsCount: number;
  primaryGoal: 'understand' | 'reduce' | 'quit_gradual' | 'quit_complete' | 'prevent_relapse' | 'lifestyle';
  quitWish: 'immediate' | 'within_month' | 'within_6_months' | 'undecided' | 'not_aiming_to_quit';
  encounteredDifficulties: string[];
  declaredTriggers: string[];
}

export interface CBDRecordedProduct {
  id: string;
  name: string;
  brand?: string;
  storeName?: string;
  productType: string;
  declaredCbdRate?: number;
  declaredThcRate?: number;
  complementaryCannabinoids?: string[];
  terpeneProfile?: string[];
  quantity?: number;
  unit?: string;
  batchNumber?: string;
  purchaseDate?: string;
  consumptionDate?: string;
  userComment?: string;
}

export interface CBDProfile {
  id: string;
  userId: string;
  cbdStatus: CBDStatus;
  currentUse?: 'yes' | 'no' | 'occasional' | 'unknown' | 'declined';
  consumptionMethods?: ('flowers' | 'oil_drops' | 'resins' | 'capsules' | 'edibles_beverages' | 'vape' | 'other_products' | 'other')[];
  preferredProductTypes?: string[];
  products?: CBDRecordedProduct[];
  productTypesUsed?: ('oil' | 'flower' | 'infusion' | 'topical' | 'capsule' | 'vape')[];
  frequency?: 'daily' | 'several_per_week' | 'as_needed' | 'exploring';
  consumptionMode?: ('sublingual' | 'inhalation' | 'infusion' | 'dermal' | 'ingestion')[];
  declaredQuantity?: string;
  productCharacteristicsPreferred?: string[];
  personalGoals?: ('sleep' | 'stress_relief' | 'muscle_recovery' | 'general_wellness' | 'focus' | 'reduce_intake')[];
  sleepQualityRating?: number;
  relaxationRating?: number;
  physicalActivityLevel?: 'sedentary' | 'moderate' | 'active' | 'very_active';
  generalWellnessRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WellnessProfile {
  id: string;
  userId: string;
  sleepTrackingEnabled: boolean;
  sleepDetails?: {
    averageDurationHours?: number;
    declaredQualityRating?: number; // 1-5
    sleepOnsetDifficulty?: 'never' | 'sometimes' | 'often' | 'always';
    nightAwakenings?: 'none' | '1_2' | '3_plus';
    generalSatisfaction?: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied';
  };
  physicalActivityTrackingEnabled: boolean;
  physicalActivityDetails?: {
    frequency?: 'none' | 'occasional' | '1_2_per_week' | '3_4_per_week' | '5_plus_per_week' | 'variable';
    activityTypes?: string[];
  };
  nutritionTrackingEnabled: boolean;
  socialActivityTrackingEnabled: boolean;
  relaxationTrackingEnabled: boolean;
  hydrationTrackingEnabled: boolean;
  outdoorTimeTrackingEnabled: boolean;
  meditationBreathingTrackingEnabled: boolean;
  trackedCategories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationPreferences {
  id: string;
  userId: string;
  preferredTone: 'neutral' | 'motivating' | 'benevolent' | 'direct' | 'pedagogical';
  preferredContentTypes: string[];
  remindersEnabled: boolean;
  journalReminderEnabled: boolean;
  goalReminderEnabled: boolean;
  encouragementsEnabled: boolean;
  weeklySummaryEnabled: boolean;
  programRemindersEnabled: boolean;
  educationalUpdatesEnabled: boolean;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  previousThcStatus?: THCStatus;
  newThcStatus?: THCStatus;
  previousCbdStatus?: CBDStatus;
  newCbdStatus?: CBDStatus;
  previousPrimaryPath?: PrimaryPath;
  newPrimaryPath?: PrimaryPath;
  triggerReason: 'onboarding_completion' | 'profile_update' | 'manual_change' | 'milestone_reached';
  summaryNote: string;
}

export interface SlipReflection {
  whatHappened?: string;
  triggerDescription?: string;
  futureHelpIdea?: string;
  nextStepChoice?: 'continue_plan' | 'adjust_goal' | 'resume_observation' | 'restart_thc_free_period';
}

export interface ConsumptionEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  productType: 'THC_herb' | 'THC_resin' | 'THC_edible' | 'CBD_oil' | 'CBD_flower' | 'CBD_infusion' | 'CBD_vape' | 'other';
  productName: string;
  quantity: number;
  unit: 'g' | 'joints' | 'drops' | 'mg' | 'puffs' | 'cups' | 'sessions' | 'other';
  consumptionMode: 'combustion' | 'vaporisation' | 'sublingual' | 'infusion' | 'ingestion' | 'other';
  context: string; // e.g. "Soirée seul", "Avec des amis", "Après le travail", "Moment de stress"
  trigger?: string; // e.g. "Habitude", "Stress déclaré", "Ennui", "Social", "Envie spontanée", "Situation particulière"
  cravingBefore?: number; // 0-10
  moodBefore: number; // 1 to 5
  moodAfter: number; // 1 to 5
  isSlip?: boolean;
  slipReflection?: SlipReflection;
  associatedGoalId?: string;
  costEstimated?: number;
  personalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface THCCraving {
  id: string;
  userId: string;
  occurredAt: string; // ISO String
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  intensity: number; // 0 - 10
  context: string;
  trigger: string;
  durationMinutes: number;
  consumedAfter: boolean;
  copingMethod: 'breathing_4d' | 'move_walk' | 'change_context' | 'drink_water' | 'occupy_activity' | 'timer_delay' | 'contact_person' | 'other';
  outcome: 'craving_passed' | 'reduced' | 'consumed' | 'postponed';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReductionPlanStep {
  stepNumber: number;
  label: string;
  targetDate: string;
  targetQuantity: number;
  targetFrequency?: string;
  targetZeroDaysPerWeek?: number;
  isAchieved: boolean;
}

export interface THCReductionPlan {
  id: string;
  userId: string;
  startDate: string;
  targetDate: string;
  baselineFrequency: string;
  baselineQuantity: number;
  quantityUnit: 'joints' | 'g' | 'sessions' | 'puffs' | 'other';
  targetFrequency: string;
  targetQuantity: number;
  strategy: 'progressive' | 'flexible' | 'observation-first' | 'custom';
  intermediateSteps: ReductionPlanStep[];
  status: 'active' | 'completed' | 'paused' | 'archived';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface THCTrigger {
  id: string;
  userId: string;
  type: 'emotion' | 'social' | 'location' | 'time' | 'habit' | 'other';
  label: string;
  frequencyCount: number;
  intensity: number; // 1 - 10
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface THCDailyGoal {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  targetType: 'zero_consumption' | 'max_quantity' | 'time_restriction' | 'observation' | 'mindful';
  targetValue?: number;
  targetUnit?: string;
  achieved: boolean | null; // null = pending / today, true = reached, false = exceeded
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type THCJourneyEventType =
  | 'PROGRAM_STARTED'
  | 'GOAL_CREATED'
  | 'CONSUMPTION_RECORDED'
  | 'CRAVING_RECORDED'
  | 'THC_FREE_DAY'
  | 'GOAL_COMPLETED'
  | 'SLIP_RECORDED'
  | 'PLAN_UPDATED'
  | 'PROGRAM_COMPLETED'
  | 'CHALLENGE_COMPLETED';

export interface THCJourneyEvent {
  id: string;
  userId: string;
  type: THCJourneyEventType;
  occurredAt: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface WellnessChallenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'sleep' | 'activity' | 'pleasure' | 'social' | 'nutrition' | 'relaxation';
  date: string; // YYYY-MM-DD
  durationMinutes?: number;
  status: 'available' | 'active' | 'completed' | 'skipped';
  rewardBadgeCode?: string;
  completedAt?: string;
  createdAt: string;
}

export interface THCBudgetSetting {
  userId: string;
  costPerPurchase?: number;
  purchaseFrequency?: 'daily' | 'several_per_week' | 'weekly' | 'monthly';
  costPerUnitEstimated?: number;
  estimatedMonthlySpend?: number;
  updatedAt: string;
}

export interface UserEducationProgress {
  id: string;
  userId: string;
  contentId: string;
  status: 'started' | 'completed';
  isFavorite: boolean;
  progressPercent: number;
  completedAt?: string;
  updatedAt: string;
}

export interface WellnessEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sleepHours?: number;
  sleepQuality: number; // 1-5
  stressLevel: number; // 1-5 (1=calm, 5=extreme)
  cravingLevel: number; // 1-5 (1=none, 5=high)
  energyLevel: number; // 1-5
  notes?: string;
  createdAt: string;
}

export interface CannabinoidProfile {
  cbd?: number;
  thc?: number; // <= 0.3% certified legal
  cbg?: number;
  cbn?: number;
  cbc?: number;
  otherCannabinoids?: string[];
}

export type CBDProductCategory =
  | 'oil'
  | 'flower'
  | 'resin'
  | 'capsule'
  | 'edible'
  | 'beverage'
  | 'vape'
  | 'infusion'
  | 'cosmetic'
  | 'extract'
  | 'other';

export type CBDConsumptionMethod =
  | 'sublingual'
  | 'ingestion'
  | 'infusion'
  | 'vaporisation'
  | 'inhalation'
  | 'topical'
  | 'other';

export type CBDQuantityUnit =
  | 'g'
  | 'mg'
  | 'ml'
  | 'drops'
  | 'capsules'
  | 'units'
  | 'puffs'
  | 'cups'
  | 'other';

export interface CBDConsumption {
  id: string;
  userId: string;
  productId?: string | null;
  productName: string;
  brand?: string;
  dateTime: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  productType: CBDProductCategory;
  consumptionMethod: CBDConsumptionMethod;
  quantity: number;
  quantityUnit: CBDQuantityUnit;
  context?: string; // 'morning' | 'noon' | 'afternoon' | 'evening' | 'before_sleep' | 'after_sport' | 'relaxation' | 'social' | 'other'
  subjectiveEffects?: string[]; // e.g. ['détente', 'calme', 'confort', 'bien-être', 'neutralité', 'inconfort']
  wellnessRating?: number; // 1 to 5
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CBDProductQualityInfo {
  labName?: string;
  certificateNumber?: string;
  analysisDate?: string;
  analysisUrl?: string;
  cultivationMethod?: string;
  extractionMethod?: string;
  manufacturerName?: string;
}

export interface CBDProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: CBDProductCategory;
  productType?: string;
  imageUrl?: string;
  cbdPercentage?: number | null;
  thcPercentage?: number | null; // certified <= 0.3%
  cbdAmount?: number | null; // e.g. mg
  thcAmount?: number | null;
  cannabinoidProfile?: CannabinoidProfile;
  terpeneProfile?: string[];
  quantity?: number | null;
  quantityUnit?: string | null;
  volumeOrWeight?: string;
  ingredients?: string[];
  carrierOil?: string;
  flavors?: string[];
  batchNumber?: string | null;
  shopId?: string | null;
  storeId?: string; // backward compat with existing store model
  sourceType: 'partner' | 'user' | 'catalog';
  barcode?: string | null;
  qrCode?: string | null;
  price?: number | null;
  currency?: string;
  productUrl?: string | null;
  countryOfOrigin?: string | null;
  qualityInformation?: CBDProductQualityInfo | null;
  inStock?: boolean;
  featured?: boolean;
  isUserCreated?: boolean;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CBDUserProduct {
  id: string;
  userId: string;
  productId: string;
  isFavorite: boolean;
  customNotes?: string;
  timesConsumed: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CBDProductScan {
  id: string;
  userId: string;
  code: string;
  scanType: 'barcode' | 'qr';
  productId?: string | null;
  result: 'found' | 'not_found' | 'created';
  matchedProductName?: string;
  createdAt: string;
}

export interface CBDWellnessObservation {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time?: string;
  sleepQuality?: number; // 1-5
  energy?: number; // 1-5
  stressLevel?: number; // 1-5 (1=très faible, 5=très élevé)
  mood?: number; // 1-5
  relaxation?: number; // 1-5
  physicalActivity?: boolean;
  activityDurationMinutes?: number;
  activityType?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CBDWellnessGoal {
  id: string;
  userId: string;
  category:
    | 'sleep_routine'
    | 'relaxation_management'
    | 'regular_activity'
    | 'habit_observation'
    | 'product_understanding'
    | 'reduce_intake'
    | 'gradual_stop'
    | 'substance_free_coping'
    | 'life_balance';
  title: string;
  description: string;
  targetDaysPerWeek?: number;
  targetDate?: string;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progressPercent: number;
  currentStreakDays: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CBDProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  labCertificateNumber: string;
  testedCbdRate: number;
  testedThcRate: number;
  testDate: string;
  expiryDate: string;
}

export interface CBDStore {
  id: string;
  name: string;
  legalEntity: string;
  registrationNumber: string;
  city: string;
  country: string;
  description: string;
  website?: string;
  verified: boolean;
  createdAt: string;
}

export interface StoreProduct {
  id: string;
  storeId: string;
  productId: string;
  stockCount: number;
  isActive: boolean;
}

export interface StoreAdmin {
  id: string;
  storeId: string;
  userId: string;
  role: 'owner' | 'manager' | 'staff';
}

export interface Order {
  id: string;
  userId: string;
  storeId: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  status: 'initiated' | 'completed' | 'failed' | 'refunded';
  transactionReference: string;
  createdAt: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  category: EducationalCategory | string;
  summary: string;
  content?: string;
  readTimeMinutes: number;
  estimatedMinutes?: number;
  targetAudience: 'ALL' | 'THC' | 'CBD' | 'WELLNESS';
  level?: EducationalLevel;
  contentType?: EducationalContentType;
  coverIcon?: string;
  coverImage?: string;
  status?: EducationalStatus;
  language?: 'fr' | 'en' | 'ar';
  version?: string;
  authorType?: 'medical_committee' | 'health_educator' | 'scientific_editor' | string;
  sourceReferences: (string | ScientificSource)[];
  medicalReviewDisclaimer: string;
  sections?: EducationalSection[];
  keyTakeaways?: string[];
  quizQuestions?: EducationalQuizQuestion[];
  exerciseSteps?: EducationalExerciseStep[];
  journalPromptTemplate?: string;
  translations?: Record<string, Partial<EducationalTranslation>>;
  publishedAt: string;
  updatedAt?: string;
}

export interface Cannabinoid {
  id: string;
  name: string; // e.g. "CBD", "THC", "CBG", "CBN", "CBC"
  fullName: string;
  description: string;
  psychoactive: boolean;
  observedPropertiesNonMedical: string[];
  legalStatusSummary: string;
}

export interface Terpene {
  id: string;
  name: string; // e.g. "Myrcène", "Limonène", "Bêta-Caryophyllène", "Linalol"
  aromaProfile: string;
  naturalSources: string[];
  scientificNotesNonMedical: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetType: 'THC' | 'CBD' | 'BOTH';
  category: 'reduction' | 'cessation' | 'awareness' | 'wellbeing';
  defaultTargetDays: number;
}

export interface UserGoal {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  customTargetDays: number;
  startDate: string;
  currentStreakDays: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Progress {
  id: string;
  userId: string;
  daysActive: number;
  consumptionFreeDaysCount: number;
  estimatedMoneySaved: number;
  estimatedGramsAvoided: number;
  lastCalculatedAt: string;
}

export interface Badge {
  id: string;
  userId?: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  category?: string;
  earnedAt?: string;
  unlockedAt?: string;
}

export type NotificationType =
  | 'TRANSACTIONAL'
  | 'SECURITY'
  | 'FINANCIAL'
  | 'EDUCATIONAL'
  | 'WELLNESS'
  | 'LOYALTY'
  | 'ORDER'
  | 'DELIVERY'
  | 'PICKUP'
  | 'SUBSCRIPTION'
  | 'MARKETING'
  | 'SYSTEM'
  | 'reminder'
  | 'milestone'
  | 'info'
  | 'system';

export type NotificationCategory =
  | 'ORDER'
  | 'DELIVERY'
  | 'PAYMENT'
  | 'SECURITY'
  | 'ACCOUNT'
  | 'LOYALTY'
  | 'SUBSCRIPTION'
  | 'EDUCATION'
  | 'WELLNESS'
  | 'MARKETING'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED' | 'DELETED';
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS' | 'WHATSAPP';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category?: NotificationCategory;
  title: string;
  body?: string; // New primary field
  message?: string; // Backward compatibility
  deepLink?: string;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  isRead: boolean; // Backward compatibility
  readAt?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  shopId?: string | null; // Tenant isolation for partner stores
  metadata?: Record<string, any>;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  language?: 'fr' | 'en' | 'ar';
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CrisisClassification = 'NORMAL' | 'CAUTION' | 'HUMAN_SUPPORT' | 'EMERGENCY';

export interface AIMessageProposedAction {
  type: 'JOURNAL_ENTRY' | 'EDUCATIONAL_GUIDE' | 'CREATE_GOAL' | 'START_EXERCISE' | 'HUMAN_HELP';
  label: string;
  payload: any;
}

export interface AIMessageSource {
  title: string;
  organization?: string;
  authors?: string;
  year?: number | string;
  journalOrInstitution?: string;
  doiOrUrl?: string;
  url?: string;
  sourceType?: string;
  notes?: string;
}

export interface AIMessageSuggestedExercise {
  type: 'breathing_4_7_8' | 'cardiac_coherence' | 'delay_10_min' | 'grounding_54321';
  title: string;
  description: string;
  durationMinutes: number;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  role?: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  disclaimer?: string;
  metadata?: {
    crisisClassification?: CrisisClassification;
    proposedAction?: AIMessageProposedAction;
    sources?: AIMessageSource[];
    recommendedContents?: Array<{
      id: string;
      title: string;
      slug: string;
      readingTimeMinutes: number;
      category?: string;
    }>;
    suggestedExercise?: AIMessageSuggestedExercise;
    personalizationNotice?: string;
  };
  createdAt: string;
}

export type AIRecommendationType =
  | 'EDUCATIONAL_CONTENT'
  | 'EXERCISE'
  | 'JOURNAL_ACTION'
  | 'WELLNESS_ACTIVITY'
  | 'GOAL_ACTION'
  | 'THC_JOURNEY_ACTION'
  | 'CBD_INFORMATION';

export interface AIRecommendation {
  id: string;
  userId: string;
  type?: AIRecommendationType;
  theme: 'urge_management' | 'evening_routine' | 'stress_alternative' | 'sleep_hygiene' | string;
  title?: string;
  suggestion: string;
  rationalNonMedical: string;
  actionLabel?: string;
  actionPayload?: any;
  score?: number;
  priority?: number;
  createdAt: string;
}

export interface AIAssistantSettings {
  id?: string;
  userId: string;
  personalizationEnabled: boolean;
  journalContextAllowed: boolean;
  conciseResponses: boolean;
  tone: 'supportive' | 'direct' | 'pedagogical';
  language: 'fr' | 'en' | 'ar';
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// ==========================================
// MODULE 4: GLOBAL JOURNAL & TRANSVERSAL OBSERVATION
// ==========================================

export interface SleepEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  bedTime: string; // HH:mm
  wakeTime: string; // HH:mm
  durationMinutes: number; // calculated e.g. 440 (7h20)
  sleepQuality: number; // 1-5
  nightAwakenings: number; // 0, 1, 2, 3, 4+
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  rating: number; // 1 to 5 (1=😞, 2=🙁, 3=😐, 4=🙂, 5=😄)
  primaryMood?: string; // Serein, Motivé, Fatigué, Anxieux, Joyeux, Neutre, Irrité, etc.
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StressEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  rating: number; // 1 to 5 (1=Très faible, 5=Très élevé)
  influencingFactors?: string[]; // 'travail' | 'famille' | 'finances' | 'sommeil' | 'relation' | 'événement' | 'environnement' | 'autre'
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnergyEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  time: string; // HH:mm
  rating: number; // 1 to 5 (1=Épuisé, 5=Plein d'énergie)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  activityType: 'marche' | 'course' | 'musculation' | 'velo' | 'sport_collectif' | 'natation' | 'mobilite' | 'yoga' | 'autre';
  customActivityName?: string;
  durationMinutes: number;
  intensity: 'douce' | 'moderee' | 'soutenue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  perceivedQuality: number; // 1 to 5
  appetite: 'faible' | 'normal' | 'bon' | 'tres_bon';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HydrationEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  amountMl: number; // e.g. 250, 500, 1500
  glassCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelaxationEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  activityType: 'meditation' | 'respiration' | 'promenade' | 'musique' | 'lecture' | 'relaxation_musculaire' | 'activite_sociale' | 'autre';
  customActivityName?: string;
  durationMinutes: number;
  perceivedBenefit: number; // 1 to 5
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalNote {
  id: string;
  userId: string;
  dateTime: string; // ISO string
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title?: string | null;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LifeEvent {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  category: 'vacances' | 'travail' | 'examen' | 'competition' | 'famille' | 'social' | 'habitudes' | 'objectif' | 'autre';
  impact?: 'positive' | 'neutral' | 'challenging';
  description?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type JournalEntryType =
  | 'THC_CONSUMPTION'
  | 'CBD_CONSUMPTION'
  | 'SLEEP'
  | 'MOOD'
  | 'STRESS'
  | 'ENERGY'
  | 'ACTIVITY'
  | 'NUTRITION'
  | 'HYDRATION'
  | 'RELAXATION'
  | 'CRAVING'
  | 'TRIGGER'
  | 'NOTE'
  | 'EVENT'
  | 'WELLNESS_OBSERVATION';

export interface UnifiedJournalEntry {
  id: string;
  userId: string;
  entryType: JournalEntryType;
  sourceType: string;
  sourceId: string;
  dateTime: string; // ISO string for chronological ordering
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  summary: string;
  tags?: string[];
  metadata: Record<string, any>;
  rawItem?: any;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// MODULE 5: DASHBOARD CENTRAL & PROGRESSION TYPES
// -------------------------------------------------------------

export interface ProgressMetric {
  id: string;
  userId: string;
  category: 'thc' | 'cbd' | 'wellness' | 'journal' | 'goals';
  metricType: string;
  label: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate?: string;
  targetDate?: string;
  status: 'in_progress' | 'achieved' | 'needs_attention';
  progressPercentage: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  userId: string;
  category: 'thc' | 'cbd' | 'wellness' | 'journal' | 'milestone';
  title: string;
  description: string;
  iconName: string;
  achieved: boolean;
  achievedAt?: string | null;
  progressValue: number;
  targetValue: number;
  unit: string;
}

export interface DashboardPreference {
  id: string;
  userId: string;
  visibleWidgets: string[];
  widgetOrder: string[];
  defaultPeriod: '7days' | '30days' | '90days' | '180days' | '365days' | 'all';
  showAiInsights: boolean;
  updatedAt: string;
}

export interface DashboardTodaySummary {
  date: string;
  hasData: boolean;
  sleep?: { durationHours: number; durationMinutes: number; quality: number; bedTime?: string; wakeTime?: string };
  mood?: { rating: number; primaryMood?: string };
  stress?: { rating: number; context?: string };
  energy?: { rating: number };
  activity?: { totalMinutes: number; count: number };
  relaxation?: { totalMinutes: number; count: number };
  hydration?: { totalMl: number; glasses: number };
  nutrition?: { count: number };
  thc?: { count: number; totalQuantity: number; unit?: string };
  cbd?: { count: number; totalQuantity: number; unit?: string };
  cravings?: { count: number; handledCount: number };
  activeDailyGoal?: string | null;
}

export interface DashboardPrimaryGoal {
  id: string;
  title: string;
  category: 'thc' | 'cbd' | 'wellness';
  type: string;
  targetDescription: string;
  progressPercentage: number;
  nextStep: string;
  daysActive: number;
  currentStreakDays?: number;
  targetDays?: number;
  status: 'active' | 'completed' | 'not_set';
}

export interface DashboardInsight {
  id: string;
  category: 'thc' | 'cbd' | 'wellness' | 'balance';
  type: 'positive' | 'observation' | 'attention' | 'milestone';
  title: string;
  message: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface DashboardTimelineEvent {
  id: string;
  date: string;
  time?: string;
  title: string;
  description?: string;
  type: 'milestone' | 'goal' | 'journey' | 'streak' | 'record';
  category: 'thc' | 'cbd' | 'wellness' | 'system';
  badgeCode?: string;
}

export interface DashboardChartPoint {
  date: string;
  label: string;
  thcCount: number;
  thcQuantity: number;
  cbdCount: number;
  cbdQuantity: number;
  sleepHours: number | null;
  sleepQuality: number | null;
  moodRating: number | null;
  stressRating: number | null;
  energyRating: number | null;
  activityMinutes: number;
  relaxationMinutes: number;
  hydrationMl: number;
  cravingsCount: number;
  journalEntriesCount: number;
}

export interface DashboardPayload {
  userProfile: {
    nickname: string;
    profileType: ProfileType;
    archetype: 'THC' | 'CBD' | 'WELLNESS' | 'COMBINED' | 'FORMER_THC';
    thcStatus?: THCStatus;
    cbdStatus?: CBDStatus;
    primaryPath?: PrimaryPath;
  };
  period: '7days' | '30days' | '90days' | '180days' | '365days' | 'all';
  periodLabel: string;
  hasEnoughDataForCharts: boolean;
  totalHistoricalEntriesCount: number;
  today: DashboardTodaySummary;
  primaryGoal: DashboardPrimaryGoal;
  progressMetrics: ProgressMetric[];
  temporalComparison: {
    currentPeriodLabel: string;
    previousPeriodLabel: string;
    activeDaysCurrent: number;
    activeDaysPrevious: number;
    entriesCurrent: number;
    entriesPrevious: number;
    thcConsumptionsCurrent: number;
    thcConsumptionsPrevious: number;
    cbdConsumptionsCurrent: number;
    cbdConsumptionsPrevious: number;
    avgSleepHoursCurrent: number | null;
    avgSleepHoursPrevious: number | null;
    avgMoodCurrent: number | null;
    avgMoodPrevious: number | null;
    activityMinutesCurrent: number;
    activityMinutesPrevious: number;
    evolutionText: string;
  };
  thcStats?: {
    hasData: boolean;
    consumptionCount: number;
    consumptionDays: number;
    thcFreeDays: number;
    currentStreakDays: number;
    bestStreakDays: number;
    lastConsumptionDate: string | null;
    totalQuantity: number;
    avgQuantityPerDay: number;
    quantityUnit: string;
    cravingsCount: number;
    avgCravingIntensity: number;
    topTriggers: { trigger: string; count: number }[];
    topContexts: { context: string; count: number }[];
    moneySaved?: {
      isConfigured: boolean;
      estimatedSaved: number;
      estimatedSpent: number;
      currency: string;
      message: string;
    };
  };
  cbdStats?: {
    hasData: boolean;
    consumptionCount: number;
    activeDays: number;
    totalQuantity: number;
    favoriteMethod: string | null;
    favoriteProduct: string | null;
    methodDistribution: { method: string; label: string; count: number; percentage: number }[];
    categoryDistribution: { category: string; label: string; count: number; percentage: number }[];
    userCabinetCount: number;
    effectsObserved: { effect: string; count: number }[];
  };
  wellnessStats: {
    hasData: boolean;
    sleep: {
      loggedNights: number;
      avgDurationHours: number | null;
      avgQuality: number | null;
    };
    mood: {
      loggedDays: number;
      avgRating: number | null;
    };
    stress: {
      loggedDays: number;
      avgRating: number | null;
    };
    energy: {
      loggedDays: number;
      avgRating: number | null;
    };
    activity: {
      loggedDays: number;
      totalMinutes: number;
      topTypes: { type: string; count: number }[];
    };
    relaxation: {
      loggedDays: number;
      totalMinutes: number;
    };
    hydration: {
      loggedDays: number;
      avgDailyMl: number | null;
    };
  };
  charts: {
    timeSeries: DashboardChartPoint[];
    thcModeDistribution?: { name: string; value: number }[];
    cbdModeDistribution?: { name: string; value: number }[];
    wellnessRadar?: { subject: string; score: number; fullMark: number }[];
  };
  weeklySynthesis: {
    daysTracked: number;
    totalEntries: number;
    highlight: string;
    thcFreeDaysThisWeek: number;
    cbdLogsThisWeek: number;
    sleepAvgFormatted: string;
    activityTotalFormatted: string;
  };
  observations: DashboardInsight[];
  pointsOfAttention: DashboardInsight[];
  nextSteps: {
    id: string;
    title: string;
    description: string;
    actionTab: string;
    actionType: string;
  }[];
  milestones: Milestone[];
  timeline: DashboardTimelineEvent[];
  preferences: DashboardPreference;
}

// -------------------------------------------------------------
// MODULE 6: BIBLIOTHÈQUE ÉDUCATIVE & PARCOURS PÉDAGOGIQUES
// -------------------------------------------------------------

export type EducationalCategory =
  | 'cannabis_thc'
  | 'cbd'
  | 'body_brain'
  | 'habits_behavior'
  | 'wellness'
  | 'reduction_cessation'
  // Legacy / cross-compatibility categories
  | 'harm_reduction'
  | 'science'
  | 'legislation'
  | 'lifestyle';

export type EducationalContentType =
  | 'article'
  | 'fiche'
  | 'guide'
  | 'micro_lesson'
  | 'exercise'
  | 'quiz';

export type EducationalLevel = 'beginner' | 'intermediate' | 'advanced';

export type EducationalStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface ScientificSource {
  id?: string;
  organization: string; // e.g. 'OMS / WHO', 'Santé publique France', 'Drogues Info Service', 'MILDECA', 'Ameli', 'Inserm'
  title: string;
  year?: number | string;
  url?: string;
  sourceType?: string; // 'Rapport institutionnel' | 'Méta-analyse' | 'Étude clinique' | 'Recommandation sanitaire'
  accessedAt?: string;
}

export interface EducationalSection {
  id: string;
  order: number;
  title?: string;
  body: string;
  type?: 'intro' | 'paragraph' | 'callout' | 'key_points' | 'warning' | 'conclusion';
  bulletPoints?: string[];
  calloutType?: 'info' | 'tip' | 'warning' | 'science';
}

export interface EducationalQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface EducationalExerciseStep {
  stepNumber: number;
  title: string;
  instruction: string;
  inputPrompt?: string;
  inputType?: 'text' | 'choice' | 'checklist' | 'slider';
  options?: string[];
  placeholder?: string;
}

export interface EducationalTranslation {
  id: string;
  contentId: string;
  language: 'fr' | 'en' | 'ar';
  title: string;
  subtitle?: string;
  summary: string;
  body?: string;
  sections?: EducationalSection[];
  keyTakeaways?: string[];
  medicalReviewDisclaimer?: string;
  updatedAt: string;
}

export interface EnrichedEducationalContent {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  summary: string;
  content?: string; // Markdown / plain text fallback
  category: EducationalCategory;
  level: EducationalLevel;
  contentType: EducationalContentType;
  estimatedMinutes: number;
  coverIcon?: string;
  coverImage?: string;
  status: EducationalStatus;
  language: 'fr' | 'en' | 'ar';
  version: string;
  publishedAt: string;
  updatedAt: string;
  authorType: 'medical_committee' | 'health_educator' | 'scientific_editor';
  targetAudience: 'ALL' | 'THC' | 'CBD' | 'WELLNESS';
  sourceReferences: (string | ScientificSource)[];
  medicalReviewDisclaimer?: string;
  sections?: EducationalSection[];
  keyTakeaways?: string[];
  // If quiz
  quizQuestions?: EducationalQuizQuestion[];
  // If exercise
  exerciseSteps?: EducationalExerciseStep[];
  journalPromptTemplate?: string;
  // Multilingual translations
  translations?: Record<string, Partial<EducationalTranslation>>;
}

export interface EducationalPath {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  category: EducationalCategory;
  targetProfile: 'ALL' | 'THC' | 'CBD' | 'WELLNESS' | 'REDUCTION' | 'CESSATION';
  level: EducationalLevel;
  estimatedDurationMinutes: number;
  status: EducationalStatus;
  contentIds: string[];
  order: number;
  version: string;
  iconName: string;
  badgeRewardCode?: string;
  translations?: Record<string, { title: string; subtitle?: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface EducationalProgress {
  id: string;
  userId: string;
  targetType: 'content' | 'path';
  targetId: string; // contentId or pathId
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  lastReadAt: string;
  startedAt: string;
  completedAt?: string | null;
  quizScore?: number | null;
  quizTotal?: number | null;
  exerciseResponses?: Record<string, any> | null;
}

export interface EducationalFavorite {
  id: string;
  userId: string;
  targetType: 'content' | 'path';
  targetId: string;
  createdAt: string;
}

export interface EducationalHistoryItem {
  id: string;
  userId: string;
  contentId: string;
  pathId?: string | null;
  viewedAt: string;
  timeSpentSeconds?: number;
}

export interface EducationRecommendation {
  id: string;
  type: 'path' | 'content' | 'exercise' | 'micro_lesson';
  targetId: string;
  title: string;
  reason: string;
  priority: number; // 1 to 10
  category: EducationalCategory;
}

// ============================================================================
// MODULE 8 — PARTNER SHOPS & CBD MARKETPLACE
// ============================================================================

export type PartnerShopStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'CLOSED' | 'ARCHIVED';
export type PartnerShopVerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type StorefrontTemplateType = 'classic' | 'premium' | 'minimal' | 'wellness';

export interface ShopCustomCategory {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
}

export interface PartnerShop {
  id: string; // shopId
  slug?: string;
  ownerUserId: string;
  legalName: string;
  commercialName: string;
  publicName?: string;
  description: string;
  shortDescription?: string;
  fullDescription?: string;
  logo?: string;
  logoUrl?: string;
  coverImage?: string;
  bannerUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  email: string;
  phone?: string;
  website?: string;
  websiteUrl?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  openingHours?: Record<string, string> | string;
  specialOpeningHours?: Record<string, string>;
  holidayClosures?: string[];
  timezone?: string;
  languages?: string[];
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  estimatedDeliveryDays?: string;
  estimatedPickupTime?: string;
  pickupInstructions?: string;
  status: PartnerShopStatus;
  shopStatus?: PartnerShopStatus;
  storefrontStatus?: 'DRAFT' | 'PUBLISHED' | 'MAINTENANCE';
  verificationStatus: PartnerShopVerificationStatus;
  legalStatus?: 'VERIFIED' | 'PENDING' | 'DOCUMENTS_REQUIRED';
  storefrontTemplate?: StorefrontTemplateType;
  seoTitle?: string;
  seoDescription?: string;
  socialImageUrl?: string;
  publicVisibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
  featuredStatus?: boolean;
  featuredProductIds?: string[];
  customCategories?: ShopCustomCategory[];
  legalInformation?: string;
  termsOfSaleUrl?: string;
  privacyPolicyUrl?: string;
  returnPolicyText?: string;
  badges?: string[];
  moderationReason?: string;
  viewsCount: number;
  favoritesCount: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Module 14 — Team Member
export interface ShopTeamMember {
  id: string;
  shopId: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'SHOP_OWNER' | 'SHOP_MANAGER' | 'SHOP_STAFF';
  permissions: string[];
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  invitedAt?: string;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Module 14 — Preparatory Shop Review
export interface ShopReview {
  id: string;
  shopId: string;
  userId: string;
  userDisplayName?: string;
  orderId?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  moderationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  moderationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Module 14 — Stock Adjustment Record
export interface StockAdjustmentRecord {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  difference: number;
  reason: 'INVENTORY_COUNT' | 'RESTOCK' | 'DAMAGED_EXPIRED' | 'THEFT_LOSS' | 'ONLINE_RETURN' | 'OTHER';
  comment?: string;
  authorUserId: string;
  authorEmail?: string;
  createdAt: string;
}

// Module 14 — Storefront Analytics
export interface StorefrontAnalytics {
  shopId: string;
  period: 'today' | '7d' | '30d' | '3m' | '12m' | 'all';
  grossRevenue: number;
  platformCommissions: number;
  paymentFees: number;
  refundsAmount: number;
  netRevenue: number;
  ordersCount: number;
  averageBasket: number;
  itemsSold: number;
  storefrontViews: number;
  uniqueVisitors: number;
  productViews: number;
  cartAdditions: number;
  conversionRate: number;
  outOfStockCount: number;
  lowStockCount: number;
  pickupOrdersCount: number;
  deliveryOrdersCount: number;
  cancellationRate: number;
  topViewedProducts: { productId: string; name: string; views: number }[];
  topSoldProducts: { productId: string; name: string; quantity: number; revenue: number }[];
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export type ProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ProductConsumptionMode = 'SUBLINGUAL' | 'INFUSION' | 'INHALATION' | 'TOPICAL' | 'INGESTION' | 'ACCESSORY' | 'OTHER';
export type MarketplaceProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'SUSPENDED' | 'ARCHIVED';

export interface CBDMarketplaceProduct {
  id: string;
  shopId: string;
  categoryId: string;
  category: string;
  name: string;
  brand: string;
  description: string;
  shortDescription?: string;
  productType?: string;
  images: string[];
  price: number;
  currency: string; // 'EUR'
  stockQuantity: number;
  stockStatus: ProductStockStatus;
  unit: string; // 'g', 'ml', 'capsule', 'flacon', 'boîte'
  quantityPerUnit: number;
  declaredCBDPercentage: number | null;
  declaredTHCPercentage: number | null; // certified <= 0.3%
  cannabinoidProfile?: {
    cbd?: number;
    thc?: number;
    cbg?: number;
    cbn?: number;
    cbc?: number;
    [key: string]: number | undefined;
  };
  terpeneProfile?: string[];
  ingredients?: string[];
  allergens?: string[];
  batchNumber?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
  origin?: string;
  qualityInformation?: {
    labName?: string;
    certificateNumber?: string;
    analysisDate?: string;
    analysisUrl?: string;
    cultivationMethod?: string;
    extractionMethod?: string;
    manufacturerName?: string;
    labBatch?: any;
  };
  laboratoryInformation?: string;
  manufacturerInformation?: string;
  productWarnings?: string[];
  legalInformation?: string;
  consumptionMode: ProductConsumptionMode;
  status: MarketplaceProductStatus;
  featured?: boolean;
  sku?: string;
  customCategoryId?: string;
  viewsCount: number;
  favoritesCount: number;
  moderationReason?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFavoriteProduct {
  id: string;
  userId: string;
  productId: string;
  shopId: string;
  createdAt: string;
}

export interface UserFavoriteShop {
  id: string;
  userId: string;
  shopId: string;
  createdAt: string;
}

export interface ProductViewHistory {
  id: string;
  userId: string;
  productId: string;
  shopId: string;
  viewedAt: string;
}

export interface ShopViewHistory {
  id: string;
  userId: string;
  shopId: string;
  viewedAt: string;
}

// Preparatory abstractions for Future Marketplace & Commissions
export type CommissionRuleType = 'PERCENTAGE' | 'FIXED' | 'TIERED';

export interface MarketplaceCommissionRule {
  id: string;
  shopId?: string;
  ruleType: CommissionRuleType;
  percentage?: number;
  fixedAmount?: number;
  minCommission?: number;
  isActive: boolean;
  createdAt: string;
}

export type CommerceIntegrationStatus = 'NONE' | 'MANUAL' | 'API' | 'FEED' | 'FUTURE';

export interface ShopCommerceIntegration {
  id: string;
  shopId: string;
  status: CommerceIntegrationStatus;
  provider?: 'shopify' | 'woocommerce' | 'prestashop' | 'custom_api' | 'none';
  apiEndpoint?: string;
  syncFrequencyHours?: number;
  lastSyncAt?: string;
  createdAt: string;
}

// ============================================================================
// MODULE 9 — GLOBAL CART & DISTRIBUTED MULTI-SHOP ORDERS
// ============================================================================

export type FulfillmentMethod = 'DELIVERY' | 'PICKUP';

export interface CartItemModel {
  id: string;
  cartId: string;
  userId: string;
  shopId: string;
  shopNameSnapshot: string;
  productId: string;
  productNameSnapshot: string;
  productImageSnapshot?: string;
  unitPriceSnapshot: number;
  currency: string;
  quantity: number;
  stockSnapshot: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopCartGroup {
  shopId: string;
  shopName: string;
  shopCity: string;
  shopLogo?: string;
  items: CartItemModel[];
  itemsCount: number;
  subtotal: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  estimatedDeliveryDays: string;
  estimatedPickupTime: string;
  pickupAddress: string;
  selectedFulfillmentMethod: FulfillmentMethod;
  shopTotal: number;
  discountAmount?: number;
  appliedPromotionName?: string;
}

export interface GlobalCartModel {
  id: string;
  userId: string;
  items: CartItemModel[];
  groups: ShopCartGroup[];
  totalItemsCount: number;
  subtotal: number;
  deliveryTotal: number;
  discountTotal?: number;
  grandTotal: number;
  currency: string;
  appliedCouponCode?: string;
  promotionSnapshot?: OrderPromotionSnapshot;
  updatedAt: string;
}

export type GlobalOrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PARTIALLY_PROCESSING'
  | 'PROCESSING'
  | 'PARTIALLY_READY'
  | 'READY'
  | 'PARTIALLY_COMPLETED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PARTIALLY_CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FAILED';

export type ShopOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PROCESSING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderAddressSnapshot {
  fullName: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes?: string;
}

export interface GlobalOrder {
  id: string;
  orderNumber: string; // e.g. #NEXUS-2026-000145
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: GlobalOrderStatus;
  currency: string;
  subtotal: number;
  deliveryTotal: number;
  discountTotal?: number;
  commissionTotal: number;
  grandTotal: number;
  promotionSnapshot?: OrderPromotionSnapshot;
  billingSnapshot: OrderAddressSnapshot;
  shippingSnapshot: OrderAddressSnapshot;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
  paymentMethod: string;
  paymentTransactionId?: string;
  shopOrdersCount: number;
  shopOrdersSummary?: {
    shopOrderId: string;
    shopId: string;
    shopName: string;
    orderNumber: string;
    status: ShopOrderStatus;
    fulfillmentMethod: FulfillmentMethod;
    total: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopOrderTimelineEvent {
  status: ShopOrderStatus;
  timestamp: string;
  note?: string;
  author: string;
}

export interface ShopOrder {
  id: string;
  globalOrderId: string;
  globalOrderNumber: string;
  shopId: string;
  shopOwnerId: string;
  shopNameSnapshot: string;
  orderNumber: string; // e.g. #SHOP-A-00072
  status: ShopOrderStatus;
  currency: string;
  subtotal: number;
  discountAmount?: number;
  deliveryFee: number;
  commissionRate: number;
  commissionAmount: number;
  shopNetAmount: number;
  platformSubsidyAmount?: number;
  promotionSnapshot?: OrderPromotionSnapshot;
  fulfillmentMethod: FulfillmentMethod;
  shippingAddressSnapshot?: OrderAddressSnapshot;
  pickupInformation?: {
    shopName: string;
    address: string;
    openingHours?: string;
    instructions?: string;
  };
  trackingNumber?: string;
  carrierName?: string;
  customerNote?: string;
  statusTimeline: ShopOrderTimelineEvent[];
  itemsCount: number;
  items?: MarketplaceOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceOrderItem {
  id: string;
  globalOrderId: string;
  shopOrderId: string;
  shopId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  commissionRate: number;
  commissionAmount: number;
  currency: string;
  productMetadataSnapshot?: {
    category?: string;
    brand?: string;
    cbdPercentage?: number | null;
    thcPercentage?: number | null;
    batchNumber?: string | null;
  };
  createdAt: string;
}

export interface PaymentIntent {
  id: string;
  globalOrderId: string;
  globalOrderNumber: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'REQUIRES_ACTION' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  provider: 'NEXUS_MARKETPLACE_ENGINE' | 'STRIPE_CONNECT';
  allocation: {
    shopId: string;
    shopOrderId: string;
    grossAmount: number;
    deliveryFee: number;
    commission: number;
    netAmount: number;
  }[];
  createdAt: string;
}

// Backward compatibility aliases
export interface MarketplaceCartItem {
  productId: string;
  shopId: string;
  quantity: number;
  unitPrice: number;
}

export interface MarketplaceCart {
  id: string;
  userId: string;
  items: MarketplaceCartItem[];
  updatedAt: string;
}

export interface MarketplaceOrderSummary {
  id: string;
  orderNumber: string;
  userId: string;
  shopId: string;
  totalAmount: number;
  currency: string;
  status: 'PREPARATION' | 'PENDING' | 'CONFIRMED' | 'READY_FOR_PICKUP' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  deliveryMode: 'IN_STORE_PICKUP' | 'STANDARD_DELIVERY';
  createdAt: string;
}

// ============================================================================
// MODULE 10 — PAIEMENTS RÉELS, MARKETPLACE FINANCIÈRE, COMMISSIONS ET REVERSEMENTS
// ============================================================================

export type SupportedCountryCode = 'FR' | 'LU' | 'BE' | 'CH' | 'DE' | 'ES' | 'IT';
export type SupportedCurrency = 'EUR' | 'CHF';

export interface SupportedCountryConfig {
  countryCode: SupportedCountryCode;
  countryName: string;
  currency: SupportedCurrency;
  paymentAvailability: boolean;
  payoutAvailability: boolean;
  marketplaceAvailability: boolean;
  providerAvailability: string[];
  providerRestrictions?: string[];
  enabled: boolean;
}

export type FinancialLedgerEntryType =
  | 'CUSTOMER_CHARGE'
  | 'PLATFORM_FEE'
  | 'SHOP_ALLOCATION'
  | 'PAYMENT_PROCESSING_FEE'
  | 'REFUND'
  | 'REFUND_REVERSAL'
  | 'TRANSFER'
  | 'PAYOUT'
  | 'PAYOUT_REVERSAL'
  | 'ADJUSTMENT'
  | 'CHARGEBACK'
  | 'DISPUTE'
  | 'TAX'
  | 'SUBSCRIPTION_REVENUE'
  | 'SUBSCRIPTION_REFUND'
  | 'SUBSCRIPTION_TAX'
  | 'SUBSCRIPTION_PAYMENT_PROCESSING_FEE'
  | 'OTHER';

export type FinancialLedgerDirection = 'CREDIT' | 'DEBIT';

export interface FinancialLedgerEntry {
  id: string;
  orderId: string;
  shopOrderId?: string;
  shopId?: string;
  paymentTransactionId?: string;
  type: FinancialLedgerEntryType;
  direction: FinancialLedgerDirection;
  amount: number;
  currency: string;
  status: 'POSTED' | 'PENDING' | 'VOID';
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialShopAllocationSnapshot {
  shopId: string;
  shopOrderId: string;
  shopName: string;
  grossAmount: number;
  deliveryFee: number;
  platformFee: number;
  paymentProcessingFee: number;
  netAmount: number;
}

export interface FinancialOrderSnapshot {
  orderId: string;
  currency: string;
  grossAmount: number;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  platformFee: number;
  paymentProcessingFee: number;
  shopAmounts: FinancialShopAllocationSnapshot[];
  commissionRuleSnapshot: {
    ruleType: CommissionRuleType;
    percentage?: number;
    fixedAmount?: number;
    minCommission?: number;
  };
  exchangeRateSnapshot?: {
    currency: string;
    rate: number;
    provider: string;
    timestamp: string;
  };
  createdAt: string;
}

export type PartnerOnboardingStatus =
  | 'NOT_STARTED'
  | 'ONBOARDING'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'DISCONNECTED';

export interface PartnerFinancialAccount {
  id: string;
  shopId: string;
  provider: string; // e.g. 'STRIPE_CONNECT', 'ALTERNATIVE_CBD'
  providerAccountId: string;
  country: SupportedCountryCode;
  currency: SupportedCurrency;
  status: PartnerOnboardingStatus;
  onboardingStatus: 'INCOMPLETE' | 'COMPLETED' | 'ACTION_REQUIRED';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  payoutStatus: 'ENABLED' | 'RESTRICTED' | 'DISABLED';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsStatus?: {
    currentlyDue?: string[];
    eventuallyDue?: string[];
    pastDue?: string[];
  };
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerBalance {
  shopId: string;
  currency: string;
  pendingAmount: number;
  availableAmount: number;
  paidAmount: number;
  refundedAmount: number;
  disputedAmount: number;
  updatedAt: string;
}

export type TransferStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELED'
  | 'BLOCKED';

export interface TransferRecord {
  id: string;
  globalOrderId: string;
  shopOrderId: string;
  shopId: string;
  paymentTransactionId?: string;
  ledgerEntryId?: string;
  providerTransferId?: string;
  amount: number;
  currency: string;
  status: TransferStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PayoutStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';

export interface PayoutRecord {
  id: string;
  shopId: string;
  provider: string;
  providerPayoutId?: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  arrivalDate?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'EVIDENCE_REQUIRED'
  | 'EVIDENCE_SUBMITTED'
  | 'WON'
  | 'LOST'
  | 'CLOSED';

export interface PaymentDispute {
  id: string;
  paymentTransactionId?: string;
  orderId: string;
  shopOrderId?: string;
  shopId?: string;
  provider: string;
  providerDisputeId?: string;
  amount: number;
  currency: string;
  reason: string;
  status: DisputeStatus;
  evidenceStatus?: string;
  evidenceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookEvent {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  payloadHash: string;
  status: 'PROCESSED' | 'FAILED' | 'DUPLICATE';
  processedAt?: string;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface FinancialAuditLog {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  timestamp: string;
  ipHashOrSafeReference?: string;
  metadata?: Record<string, any>;
}

export type ReconciliationSeverity = 'MATCHED' | 'WARNING' | 'MISMATCH' | 'CRITICAL';

export interface FinancialReconciliationIssue {
  id: string;
  type:
    | 'PAYMENT_WITHOUT_ORDER'
    | 'ORDER_WITHOUT_PAYMENT'
    | 'TRANSFER_WITHOUT_ALLOCATION'
    | 'ALLOCATION_WITHOUT_TRANSFER'
    | 'REFUND_WITHOUT_PAYMENT'
    | 'DUPLICATE'
    | 'AMOUNT_MISMATCH'
    | 'CURRENCY_MISMATCH'
    | 'STATUS_MISMATCH';
  severity: ReconciliationSeverity;
  referenceId: string;
  details: string;
  createdAt: string;
}

export interface IdempotencyKey {
  key: string;
  operation: string;
  userId: string;
  orderId?: string;
  provider?: string;
  requestHash?: string;
  responseReference?: string;
  responseBody?: any;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  expiresAt: string;
}

export interface FinancialAdjustment {
  id: string;
  adminUserId: string;
  shopId: string;
  orderId?: string;
  amount: number;
  currency: string;
  direction: FinancialLedgerDirection;
  justification: string;
  createdAt: string;
}

export interface PaymentProviderCapabilities {
  separateChargesAndTransfers: boolean;
  splitPayments: boolean;
  cbdMCCSupported: boolean;
  directPayouts: boolean;
  webhooks: boolean;
}

export interface PaymentProviderEligibility {
  eligible: boolean;
  reason?: string;
  provider: string;
  allowedPaymentMethods: string[];
  allowedPayout: boolean;
  isSandbox: boolean;
}

// ============================================================================
// MODULE 11 — DELIVERY, IN-STORE PICKUP & MARKETPLACE LOGISTICS
// ============================================================================

export interface ShippingAddress {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  region?: string;
  country: string;
  phone?: string;
  instructions?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderShippingAddressSnapshot {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  company?: string;
  addressLine1?: string;
  addressLine2?: string;
  address?: string;
  postalCode: string;
  city: string;
  region?: string;
  country: string;
  phone?: string;
  email?: string;
  instructions?: string;
  notes?: string;
}

export type DeliveryMethod =
  | 'HOME_DELIVERY'
  | 'PICKUP_IN_STORE'
  | 'CLICK_AND_COLLECT'
  | 'LOCAL_DELIVERY'
  | 'OTHER';

export interface DeliveryOption {
  id: string;
  shopId: string;
  type: DeliveryMethod;
  name: string;
  description?: string;
  enabled: boolean;
  price: number;
  currency: string;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  cutoffTime?: string;
  availableCountries: string[];
  availableZones?: string[];
}

export type ShippingRateCalculationMethod =
  | 'FLAT_RATE'
  | 'FREE'
  | 'ORDER_AMOUNT'
  | 'WEIGHT'
  | 'ITEM_COUNT'
  | 'ZONE'
  | 'CUSTOM';

export interface ShippingRate {
  id: string;
  shopId: string;
  name: string;
  calculationMethod: ShippingRateCalculationMethod;
  basePrice: number;
  freeShippingThreshold?: number;
  pricePerKg?: number;
  pricePerItem?: number;
  currency: string;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minWeightKg?: number;
  maxWeightKg?: number;
  enabled: boolean;
}

export interface FreeShippingRule {
  id: string;
  shopId: string;
  minimumOrderAmount: number;
  country?: string;
  zone?: string;
  deliveryMethod: DeliveryMethod;
  enabled: boolean;
}

export interface DeliveryZone {
  id: string;
  shopId?: string;
  name: string;
  type: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  countries: string[];
  regions?: string[];
  postalCodes?: string[];
  enabled: boolean;
}

export interface Carrier {
  id: string;
  name: string;
  code: string; // e.g. "COLISSIMO", "CHRONOPOST", "MONDIAL_RELAY", "DHL", "UPS", "DPD", "GLS", "MANUAL_CARRIER"
  country: string;
  supportedCountries: string[];
  enabled: boolean;
  trackingSupported: boolean;
  labelSupported: boolean;
  apiSupported: boolean;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface CarrierService {
  id: string;
  carrierId: string;
  name: string;
  code: string;
  transitDaysMin: number;
  transitDaysMax: number;
  deliveryMethod: DeliveryMethod;
  enabled: boolean;
}

export type ShipmentStatus =
  | 'CREATED'
  | 'READY_FOR_PROCESSING'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'RETURNED'
  | 'CANCELED'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP';

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  weightKg?: number;
}

export interface Shipment {
  id: string;
  globalOrderId: string;
  shopOrderId: string;
  shopId: string;
  carrierId?: string;
  carrierName?: string;
  carrierServiceId?: string;
  deliveryMethod: DeliveryMethod;
  status: ShipmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  shippingCost: number;
  currency: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: ShipmentItem[];
  weightKg?: number;
  parcelDimensions?: {
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  packingNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  description: string;
  location?: string;
  eventDate: string;
  source: 'CARRIER_API' | 'MANUAL_SHOP' | 'SYSTEM';
  createdAt: string;
}

export interface PickupLocation {
  id: string;
  shopId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  openingHours?: string | Record<string, string>;
  instructions?: string;
  enabled: boolean;
}

export interface PickupSlot {
  id: string;
  pickupLocationId: string;
  shopId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  remainingCapacity: number;
  enabled: boolean;
}

export interface PickupConfirmation {
  id: string;
  shopOrderId: string;
  shipmentId?: string;
  pickupCode: string;
  qrCodeReference: string;
  pickedUpAt?: string;
  pickedUpBy?: string;
  confirmationMethod?: 'CODE' | 'QR' | 'MANUAL_STAFF';
  createdAt: string;
}

export type PackingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PACKED' | 'READY';

export interface ShippingLabel {
  id: string;
  shipmentId: string;
  carrier: string;
  trackingNumber: string;
  labelUrl: string;
  format: 'PDF' | 'ZPL' | 'OTHER';
  createdAt: string;
}

export type DeliveryIncidentType =
  | 'ADDRESS_ERROR'
  | 'DAMAGED_PACKAGE'
  | 'LOST_PACKAGE'
  | 'DELAYED'
  | 'DELIVERY_FAILED'
  | 'WRONG_ITEM'
  | 'MISSING_ITEM'
  | 'OTHER';

export type DeliveryIncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface DeliveryIncident {
  id: string;
  incidentNumber: string;
  globalOrderId: string;
  shopOrderId: string;
  shipmentId?: string;
  shopId: string;
  customerId: string;
  customerEmail?: string;
  type: DeliveryIncidentType;
  status: DeliveryIncidentStatus;
  description: string;
  customerNote?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReturnRequestStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELED';

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  shopOrderId: string;
  shopId: string;
  customerId: string;
  reason: string;
  status: ReturnRequestStatus;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    reason?: string;
  }[];
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  returnTrackingNumber?: string;
  returnCarrier?: string;
  refundId?: string;
  adminNotes?: string;
  shopNotes?: string;
}

export interface ShippingOrderSnapshot {
  shopId: string;
  deliveryMethod: DeliveryMethod;
  deliveryOptionName?: string;
  shippingAddress: OrderShippingAddressSnapshot;
  shippingPrice: number;
  currency: string;
  estimatedDeliveryMinDays?: number;
  estimatedDeliveryMaxDays?: number;
  estimatedDeliveryDate?: string;
  shippingRuleSnapshot?: string;
}

export interface ShippingAuditLog {
  id: string;
  action: string;
  entityType: 'SHIPMENT' | 'PICKUP' | 'INCIDENT' | 'RETURN' | 'CARRIER' | 'ADDRESS';
  entityId: string;
  actorId: string;
  actorRole: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// MODULE 12: FIDÉLITÉ, RÉCOMPENSES, GAMIFICATION & PARRAINAGE
// ============================================================================

export type LoyaltyAccountStatus = 'ACTIVE' | 'FROZEN' | 'SUSPENDED';

export interface LoyaltyAccount {
  id: string;
  userId: string;
  pointsBalance: number;
  lifetimePoints: number;
  currentLevelId: string;
  currentLevelProgress: number; // 0 to 100 percentage
  totalEarned: number;
  totalSpent: number;
  status: LoyaltyAccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type LoyaltyTransactionType =
  | 'EARN'
  | 'SPEND'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'EXPIRATION'
  | 'BONUS'
  | 'REFERRAL'
  | 'REWARD_REDEMPTION';

export type LoyaltyTransactionStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED';

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number; // Positive for gain, negative for spend
  sourceType: string;
  sourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  status: LoyaltyTransactionStatus;
  idempotencyKey?: string;
  createdAt: string;
}

export type LoyaltyRuleFrequency = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'UNLIMITED';

export interface LoyaltyRule {
  id: string;
  code: string;
  name: string;
  description: string;
  points: number;
  maxFrequency?: LoyaltyRuleFrequency;
  dailyLimit?: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  cooldownHours?: number;
  conditions?: Record<string, any>;
  minimumLevelId?: string;
  requiredStatus?: string;
  country?: string; // 'ALL' or 'FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT'
  accountType?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyLevel {
  id: string;
  name: string;
  description: string;
  minimumPoints: number;
  maximumPoints?: number;
  icon: string;
  order: number;
  benefits: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export type AchievementCategory =
  | 'JOURNAL'
  | 'EDUCATION'
  | 'WELLNESS'
  | 'THC_REDUCTION'
  | 'THC_ABSTINENCE'
  | 'CBD_WELLNESS'
  | 'GOALS'
  | 'COMMUNITY'
  | 'REFERRAL'
  | 'MARKETPLACE';

export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  rarity: AchievementRarity;
  criteria: {
    type: string;
    threshold: number;
    metric?: string;
  };
  pointsReward: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievementCode: string;
  unlockedAt: string;
  progress: number;
  metadata?: Record<string, any>;
}

export type StreakType =
  | 'JOURNAL'
  | 'EDUCATION'
  | 'WELLNESS'
  | 'GOAL'
  | 'THC_REDUCTION'
  | 'THC_ABSTINENCE'
  | 'CHALLENGE';

export interface UserStreak {
  id: string;
  userId: string;
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastActivityDate: string; // YYYY-MM-DD
  startedAt: string;
  endedAt?: string;
  status: 'ACTIVE' | 'BROKEN' | 'COMPLETED';
}

export type ChallengeCategory =
  | 'SLEEP'
  | 'RELAXATION'
  | 'ACTIVITY'
  | 'HYDRATION'
  | 'JOURNAL'
  | 'EDUCATION'
  | 'WELLNESS'
  | 'THC_REDUCTION'
  | 'THC_ABSTINENCE'
  | 'HABITS';

export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  durationDays: number;
  objectiveType: string;
  targetValue: number;
  pointsReward: number;
  badgeId?: string;
  badgeCode?: string;
  startAt?: string;
  endAt?: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'TARGETED' | 'LEVEL_RESTRICTED';
  eligibilityRules?: Record<string, any>;
  createdAt: string;
}

export type UserChallengeStatus =
  | 'AVAILABLE'
  | 'JOINED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'EXPIRED';

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  status: UserChallengeStatus;
  progress: number; // Current day or count
  startedAt: string;
  completedAt?: string;
  currentDay: number;
  lastProgressAt?: string;
  rewardGranted: boolean;
  metadata?: Record<string, any>;
}

export interface GoalReward {
  id: string;
  goalId: string;
  pointsReward: number;
  badgeId?: string;
  congratulationsMessage: string;
  triggeredAt?: string;
}

export type RewardType =
  | 'DIGITAL'
  | 'BADGE'
  | 'BENEFIT'
  | 'PARTNER_REWARD'
  | 'MARKETPLACE_BENEFIT'
  | 'COUPON'
  | 'EXPERIENCE'
  | 'ACCESS';

export type RewardStatus = 'ACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  partnerShopId?: string;
  partnerShopName?: string;
  rewardValue?: number;
  currency?: string;
  couponTemplateId?: string;
  stock: number; // -1 for unlimited
  usageLimit?: number;
  startAt?: string;
  endAt?: string;
  eligibilityRules?: {
    minLevel?: number;
    countries?: string[];
    profileTypes?: string[];
  };
  status: RewardStatus;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

export type RewardRedemptionStatus =
  | 'RESERVED'
  | 'ISSUED'
  | 'USED'
  | 'EXPIRED'
  | 'CANCELED'
  | 'REFUNDED';

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitleSnapshot: string;
  partnerShopId?: string;
  pointsSpent: number;
  status: RewardRedemptionStatus;
  redemptionCode: string;
  redeemedAt: string;
  expiresAt?: string;
  usedAt?: string;
  usedByShopId?: string;
  metadata?: Record<string, any>;
}

export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  referrerReward: number;
  referredUserReward: number;
  conditions: {
    minJournalEntries?: number;
    minEducationLessons?: number;
    requireVerifiedEmail?: boolean;
  };
  status: 'ACTIVE' | 'INACTIVE';
  startAt?: string;
  endAt?: string;
}

export type ReferralStatus =
  | 'INVITED'
  | 'REGISTERED'
  | 'QUALIFIED'
  | 'REWARDED'
  | 'CANCELED'
  | 'FRAUD_REVIEW';

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId?: string;
  referralCode: string;
  status: ReferralStatus;
  createdAt: string;
  registeredAt?: string;
  qualifiedAt?: string;
  rewardGrantedAt?: string;
  metadata?: Record<string, any>;
}

export type ReferralRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReferralRiskStatus = 'AUTO_CLEARED' | 'PENDING' | 'REJECTED' | 'APPROVED';

export interface ReferralRiskAssessment {
  id: string;
  referralId: string;
  riskScore: number;
  riskLevel: ReferralRiskLevel;
  signals: string[];
  reviewedAt?: string;
  reviewedBy?: string;
  status: ReferralRiskStatus;
}

export interface WellnessProgress {
  userId: string;
  sleepObservation: string;
  activityObservation: string;
  relaxationObservation: string;
  hydrationObservation: string;
  journalObservation: string;
  learningObservation: string;
  regularityScore: number;
  updatedAt: string;
}

export interface LoyaltyAdminAuditLog {
  id: string;
  adminUserId: string;
  adminEmail?: string;
  action: string;
  entityType: 'POINTS' | 'LEVEL' | 'BADGE' | 'CHALLENGE' | 'REWARD' | 'REFERRAL' | 'RULE';
  entityId: string;
  before?: any;
  after?: any;
  reason: string;
  timestamp: string;
  ip?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// MODULE 13 — ABONNEMENTS, PREMIUM & MONÉTISATION
// ============================================================================

export type SubscriptionPlanType = 'FREE' | 'PREMIUM' | 'PARTNER' | 'BUSINESS' | 'CUSTOM';
export type SubscriptionPlanTarget = 'USER' | 'PARTNER' | 'ADMIN' | 'ORGANIZATION';
export type SubscriptionPlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  type: SubscriptionPlanType;
  target: SubscriptionPlanTarget;
  status: SubscriptionPlanStatus;
  displayOrder: number;
  features: string[];
  limits: Record<string, number>;
  eligibilityRules?: {
    minAge?: number;
    allowedCountries?: string[];
    partnerOnly?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPriceInterval = 'MONTH' | 'YEAR' | 'CUSTOM';

export interface SubscriptionPrice {
  id: string;
  planId: string;
  amount: number;
  currency: string; // 'EUR' | 'CHF'
  interval: SubscriptionPriceInterval;
  intervalCount: number;
  country?: string;
  taxBehavior: 'INCLUSIVE' | 'EXCLUSIVE';
  trialDays: number;
  status: 'ACTIVE' | 'ARCHIVED';
  providerPriceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureEntitlement {
  featureCode: string;
  name: string;
  description: string;
  category: 'ANALYTICS' | 'AI' | 'JOURNAL' | 'EDUCATION' | 'WELLNESS' | 'COMMUNITY' | 'PARTNER';
  freeAccess: boolean;
  premiumAccess: boolean;
  status: 'ACTIVE' | 'DEPRECATED';
}

export type SubscriptionStatus =
  | 'INCOMPLETE'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'PAUSED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'INCOMPLETE_EXPIRED';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  priceId: string;
  status: SubscriptionStatus;
  provider: string; // 'SIMULATED' | 'STRIPE'
  providerSubscriptionId?: string;
  providerCustomerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelAtPeriodEnd: boolean;
  endedAt?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionEventType =
  | 'CREATED'
  | 'TRIAL_STARTED'
  | 'ACTIVATED'
  | 'RENEWED'
  | 'UPGRADED'
  | 'DOWNGRADED'
  | 'PAUSED'
  | 'RESUMED'
  | 'CANCEL_REQUESTED'
  | 'CANCELED'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_RECOVERED'
  | 'REFUNDED'
  | 'PLAN_CHANGED';

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  userId: string;
  type: SubscriptionEventType;
  previousPlanId?: string;
  newPlanId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TrialEligibility {
  userId: string;
  isEligible: boolean;
  reasons: string[];
  previousTrialUsedAt?: string;
  previousSubscriptionCount: number;
}

export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE' | 'REFUNDED';

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId?: string;
  providerInvoiceId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amountSubtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  refundedAt?: string;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  metadata?: Record<string, any>;
}

export interface TaxConfiguration {
  id: string;
  country: string;
  taxRate: number; // e.g. 0.20 for 20%
  taxType: string; // 'TVA' | 'VAT' | 'MWST'
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface SubscriptionGrant {
  id: string;
  userId: string;
  grantedBy: string;
  reason: string;
  planId: string;
  startAt: string;
  endAt: string;
  source: 'ADMIN' | 'PROMO' | 'PARTNERSHIP';
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
}

export interface PartnerSubscription {
  id: string;
  shopId: string;
  ownerUserId: string;
  planId: string;
  priceId: string;
  status: SubscriptionStatus;
  provider: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  paymentIntentId?: string;
  transactionId?: string;
  invoiceId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface SubscriptionAnalytics {
  freeUsersCount: number;
  premiumUsersCount: number;
  newSubscriptionsCount: number;
  canceledSubscriptionsCount: number;
  conversionRate: number;
  trialToPaidRate: number;
  churnRate: number;
  mrr: number;
  arr: number;
  subscriptionGrossRevenue: number;
  subscriptionNetRevenue: number;
  totalRefundedAmount: number;
  failedPaymentsCount: number;
  upgradesCount: number;
  downgradesCount: number;
  revenueByCountry: { country: string; amount: number; currency: string }[];
  revenueByPlan: { planCode: string; planName: string; count: number; amount: number }[];
  partnerMetrics: {
    freePartnersCount: number;
    premiumPartnersCount: number;
    partnerMrr: number;
  };
}

// ============================================================================
// MODULE 15 — MARKETING, PROMOTIONS, CAMPAGNES & ACQUISITION
// ============================================================================

export type CampaignOwnerType = 'PLATFORM' | 'PARTNER';

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ENDED'
  | 'CANCELED'
  | 'ARCHIVED';

export type CampaignType =
  | 'PLATFORM'
  | 'PARTNER'
  | 'ACQUISITION'
  | 'RETENTION'
  | 'REACTIVATION'
  | 'MERCHANDISING'
  | 'EDUCATIONAL'
  | 'WELLNESS'
  | 'SEASONAL';

export type PromotionType =
  | 'PERCENTAGE'
  | 'FIXED_AMOUNT'
  | 'FREE_SHIPPING'
  | 'BUNDLE'
  | 'CONDITIONAL'
  | 'LOYALTY_REWARD'
  | 'PARTNER_OFFER';

export type PromotionStatus = 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'DEPLETED' | 'DISABLED';

export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'DEPLETED' | 'DISABLED';

export type PromotionFundingSource = 'PARTNER' | 'PLATFORM' | 'SHARED';

export interface CampaignAudienceTarget {
  segmentType:
    | 'ALL'
    | 'NEW_CUSTOMERS'
    | 'RETURNING_CUSTOMERS'
    | 'INACTIVE_30D'
    | 'VIP_LOYALTY'
    | 'CITY_LOCAL';
  targetCity?: string;
  targetCountry?: string;
  minimumPreviousOrders?: number;
}

export type MarketingChannel =
  | 'BANNER'
  | 'COUPON'
  | 'QR_CODE'
  | 'NEWSLETTER'
  | 'PUSH_NOTIFICATION'
  | 'SOCIAL_LINK';

export interface MarketingCampaign {
  id: string;
  name: string;
  description: string;
  slug: string;
  ownerType: CampaignOwnerType;
  ownerId: string; // 'NEXUS' or shopId
  shopId?: string; // set if ownerType === 'PARTNER'
  status: CampaignStatus;
  campaignType: CampaignType;
  startAt: string;
  endAt: string;
  budget: number;
  budgetSpent: number;
  budgetAlertThreshold: number; // e.g. 0.8
  currency: string;
  targetAudience: CampaignAudienceTarget;
  channels: MarketingChannel[];
  objectives: string[];
  termsAndConditions?: string;
  complianceChecked: boolean;
  complianceNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingPromotion {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  shopId?: string; // undefined = platform-wide across all or eligible shops
  eligibleShopIds?: string[];
  promotionType: PromotionType;
  value: number; // e.g. 15 for 15%, 5 for 5€
  currency: string;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  eligibleProductIds?: string[];
  excludedProductIds?: string[];
  eligibleCategoryIds?: string[];
  startAt: string;
  endAt: string;
  usageLimit?: number;
  usageCount: number;
  usagePerUserLimit?: number;
  status: PromotionStatus;
  stackable: boolean;
  priority: number;
  fundingSource: PromotionFundingSource;
  partnerFundingRatio: number; // 1.0 = 100% partner, 0 = 100% platform, 0.5 = 50% each
  badgeText?: string; // e.g. "-15% PRINTEMPS"
  createdAt: string;
  updatedAt: string;
}

export interface MarketingCoupon {
  id: string;
  code: string; // uppercase normalized
  campaignId: string;
  promotionId: string;
  shopId?: string;
  description: string;
  usageLimit?: number;
  usageCount: number;
  usagePerUser: number;
  userUsageMap: Record<string, number>;
  validFrom: string;
  validUntil: string;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPromotionSnapshot {
  couponCode?: string;
  campaignId?: string;
  campaignName?: string;
  promotionId?: string;
  promotionType: PromotionType;
  promotionName: string;
  totalDiscountAmount: number;
  discountPerShop: {
    shopId: string;
    shopName: string;
    discountAmount: number;
    partnerShareAmount: number;
    platformShareAmount: number;
  }[];
  fundingSource: PromotionFundingSource;
  partnerFundingRatio: number;
}

export type MerchandisingSlot =
  | 'HOME_HERO'
  | 'HOME_FEATURED'
  | 'MARKETPLACE_TOP_BANNER'
  | 'MARKETPLACE_COLLECTION'
  | 'STOREFRONT_BANNER'
  | 'CART_UPSELL';

export interface MerchandisingItem {
  id: string;
  placementId: string;
  itemType: 'PRODUCT' | 'SHOP' | 'CAMPAIGN' | 'COLLECTION';
  targetId: string; // productId, shopId, or campaignId
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  callToActionText: string;
  destinationUrl: string;
  displayOrder: number;
  startAt?: string;
  endAt?: string;
  isActive: boolean;
}

export interface MerchandisingPlacement {
  id: string;
  slot: MerchandisingSlot;
  title: string;
  description?: string;
  isActive: boolean;
  items: MerchandisingItem[];
}

export type MarketingEventType =
  | 'campaign_view'
  | 'campaign_click'
  | 'shop_view'
  | 'product_view'
  | 'add_to_cart'
  | 'coupon_apply'
  | 'checkout_start'
  | 'purchase'
  | 'campaign_conversion';

export type MarketingAttributionSource =
  | 'ORGANIC'
  | 'DIRECT'
  | 'CAMPAIGN'
  | 'PARTNER'
  | 'REFERRAL'
  | 'QR_CODE'
  | 'SOCIAL'
  | 'EMAIL'
  | 'PUSH'
  | 'INTERNAL';

export interface MarketingTrackingEvent {
  id: string;
  eventType: MarketingEventType;
  campaignId?: string;
  campaignSlug?: string;
  shopId?: string;
  productId?: string;
  couponCode?: string;
  userId?: string;
  sessionId: string;
  source: MarketingAttributionSource;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  orderId?: string;
  orderAmount?: number;
  discountAmount?: number;
  timestamp: string;
}

export interface MarketingAttributionRecord {
  id: string;
  orderId: string;
  userId: string;
  campaignId?: string;
  shopId?: string;
  couponCode?: string;
  source: MarketingAttributionSource;
  grossAmount: number;
  discountAmount: number;
  netPaidAmount: number;
  commissionAmount: number;
  partnerDiscountAbsorbed: number;
  platformDiscountAbsorbed: number;
  convertedAt: string;
}

export interface MarketingUserConsent {
  userId: string;
  emailMarketingOptIn: boolean;
  pushMarketingOptIn: boolean;
  inAppPromoOptIn: boolean;
  partnerOffersOptIn: boolean;
  consentTimestamp: string;
  updatedAt: string;
}

export interface MarketingCountryRule {
  countryCode: string; // 'FR' | 'CH' | 'BE' | 'LU' | 'DE' | 'ES' | 'IT'
  countryName: string;
  maxThcPercent: number;
  prohibitedClaims: string[];
  allowedHealthClaims: string[];
  requireAgeGate: boolean;
  alcoholTobaccoBundlingAllowed: boolean;
  complianceNotes: string;
}

export interface MarketingAuditLog {
  id: string;
  actorUserId: string;
  actorRole: string;
  action:
    | 'CAMPAIGN_CREATE'
    | 'CAMPAIGN_UPDATE'
    | 'CAMPAIGN_APPROVE'
    | 'CAMPAIGN_REJECT'
    | 'CAMPAIGN_PAUSE'
    | 'COUPON_CREATE'
    | 'PROMO_APPLY'
    | 'BUDGET_DEPLETED'
    | 'MERCHANDISING_UPDATE';
  targetType: 'CAMPAIGN' | 'PROMOTION' | 'COUPON' | 'MERCHANDISING';
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface MarketingAnalyticsOverview {
  totalCampaignsCount: number;
  activeCampaignsCount: number;
  totalCouponsIssued: number;
  totalCouponsRedeemed: number;
  totalDiscountsGranted: number;
  totalPlatformDiscountsSubsidized: number;
  totalPartnerDiscountsFunded: number;
  totalRevenueInfluenced: number;
  averageRoi: number; // e.g. 5.4x
  conversionFunnel: {
    views: number;
    clicks: number;
    cartAdditions: number;
    checkoutStarts: number;
    purchases: number;
    conversionRate: number;
  };
  topCampaigns: {
    id: string;
    name: string;
    shopName?: string;
    conversionsCount: number;
    revenueGenerated: number;
    discountCost: number;
    roi: number;
  }[];
  conversionsBySource: {
    source: MarketingAttributionSource;
    count: number;
    revenue: number;
  }[];
}

// ==========================================
// MODULE 16 — ADVANCED NOTIFICATIONS, CRM & AUTOMATED COMMUNICATIONS
// ==========================================

export type NotificationEventType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_SHIPPED'
  | 'SHIPMENT_IN_TRANSIT'
  | 'SHIPMENT_DELIVERED'
  | 'PICKUP_READY'
  | 'PICKUP_COMPLETED'
  | 'SUBSCRIPTION_STARTED'
  | 'SUBSCRIPTION_RENEWAL'
  | 'SUBSCRIPTION_PAYMENT_FAILED'
  | 'SUBSCRIPTION_CANCELED'
  | 'REWARD_EARNED'
  | 'REFERRAL_COMPLETED'
  | 'EDUCATIONAL_PROGRESS'
  | 'WELLNESS_REMINDER'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_ENDED'
  | 'WELCOME'
  | 'ONBOARDING_INCOMPLETE'
  | 'CART_ABANDONED'
  | 'SECURITY_ALERT'
  | 'SYSTEM_ANNOUNCEMENT';

export interface NotificationEvent {
  id: string;
  eventType: NotificationEventType;
  userId: string;
  shopId?: string;
  payload: Record<string, any>;
  timestamp: string;
  idempotencyKey?: string;
}

export type TemplateStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';

export interface NotificationTemplate {
  id: string;
  key: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  locale: 'fr' | 'en' | 'ar';
  subject?: string;
  title: string;
  body: string;
  variables: string[];
  version: number;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'BOUNCED'
  | 'UNSUBSCRIBED'
  | 'OPENED'
  | 'CLICKED';

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  provider: string; // 'INTERNAL_IN_APP' | 'SENDGRID' | 'RESEND' | 'WEB_PUSH' | 'TWILIO' | 'WHATSAPP_BUSINESS' | 'UNCONFIGURED_ADAPTER'
  providerMessageId?: string;
  status: DeliveryStatus;
  attemptedAt: string;
  deliveredAt?: string;
  failedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  openedAt?: string;
  clickedAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
  updatedAt: string;
}

export interface UserCommunicationPreference {
  userId: string;
  // Transactional & security are strictly enforced as required
  transactionalEmail: boolean;
  securityEmail: boolean;
  // User configurable
  orderUpdatesPush: boolean;
  deliveryUpdatesPush: boolean;
  educationalPush: boolean;
  wellnessRemindersPush: boolean;
  marketingEmail: boolean;
  marketingPush: boolean;
  marketingSms: boolean;
  marketingWhatsapp: boolean;
  partnerOffers: boolean;
  // Quiet hours & throttling
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "22:00"
  quietHoursEnd: string; // e.g. "08:00"
  timezone: string; // e.g. "Europe/Paris"
  frequencyLimitPerDay: number;
  updatedAt: string;
}

export type MarketingConsentPurpose =
  | 'MARKETING_NEWSLETTER'
  | 'PARTNER_PROMOTIONS'
  | 'EDUCATIONAL_TIPS'
  | 'WELLNESS_NUDGES';

export interface MarketingConsentRecord {
  id: string;
  userId: string;
  purpose: MarketingConsentPurpose;
  channel: NotificationChannel;
  granted: boolean;
  source: 'REGISTRATION' | 'ONBOARDING' | 'SETTINGS' | 'CHECKOUT' | 'BANNER';
  version: string;
  timestamp: string;
  withdrawnAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

export type CRMLifecycleStage =
  | 'NEW'
  | 'ONBOARDING'
  | 'ACTIVATED'
  | 'ACTIVE'
  | 'DORMANT'
  | 'REACTIVATED'
  | 'CUSTOMER'
  | 'SUBSCRIBER'
  | 'PARTNER_STAFF';

export interface CRMProfile {
  userId: string;
  email: string;
  fullName?: string;
  lifecycleStage: CRMLifecycleStage;
  lastActivityAt: string;
  firstPurchaseAt?: string;
  lastPurchaseAt?: string;
  totalPurchasesCount: number;
  totalSpent: number;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  loyaltyLevel?: string;
  loyaltyPoints: number;
  preferredLocale: 'fr' | 'en' | 'ar';
  preferredTimezone: string;
  associatedShopIds?: string[];
  communicationEligibility: {
    canReceiveMarketing: boolean;
    canReceivePush: boolean;
    canReceiveSms: boolean;
    canReceiveWhatsapp: boolean;
    isUnsubscribed: boolean;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type SegmentRuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'CONTAINS';

export interface CRMSegmentRule {
  field:
    | 'lifecycleStage'
    | 'totalPurchasesCount'
    | 'totalSpent'
    | 'subscriptionStatus'
    | 'loyaltyLevel'
    | 'loyaltyPoints'
    | 'preferredLocale'
    | 'associatedShopIds'
    | 'tags'
    | 'canReceiveMarketing';
  operator: SegmentRuleOperator;
  value: any;
}

export interface CRMSegment {
  id: string;
  name: string;
  description: string;
  ownerType: 'PLATFORM' | 'PARTNER';
  ownerId: string; // 'PLATFORM' or partner shopId
  rules: CRMSegmentRule[];
  status: 'ACTIVE' | 'ARCHIVED';
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface CommunicationWorkflow {
  id: string;
  name: string;
  description?: string;
  triggerEvent: NotificationEventType;
  status: WorkflowStatus;
  channels: NotificationChannel[];
  templateKey: string;
  delayMinutes: number;
  frequencyLimits?: {
    maxPerUserPerWeek: number;
  };
  requiresMarketingConsent: boolean;
  executionsCount: number;
  conversionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationAnalyticsOverview {
  totalMessagesCreated: number;
  totalDelivered: number;
  totalFailed: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  deliveryRate: number; // percentage e.g. 98.4
  openRate: number; // percentage e.g. 42.1
  clickRate: number; // percentage e.g. 14.8
  channelBreakdown: {
    channel: NotificationChannel;
    sent: number;
    delivered: number;
    failed: number;
  }[];
  attributedConversionsCount: number;
  attributedRevenueAmount: number;
}

export interface CommunicationAttributionRecord {
  id: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  deepLink: string;
  conversionType: 'ORDER_COMPLETED' | 'SUBSCRIPTION_PURCHASED' | 'REWARD_REDEEMED';
  targetId: string;
  revenue: number;
  timestamp: string;
}

export interface ProviderStatusInfo {
  channel: NotificationChannel;
  providerName: string;
  isConfigured: boolean;
  statusMessage: string;
  capabilities: string[];
}

// ============================================================================
// MODULE 17 — CENTRAL ADMINISTRATION & GLOBAL ANALYTICS DOMAIN MODELS
// ============================================================================

export enum AdminPermission {
  VIEW_USERS = 'VIEW_USERS',
  VIEW_SHOPS = 'VIEW_SHOPS',
  MANAGE_SHOPS = 'MANAGE_SHOPS',
  VIEW_ORDERS = 'VIEW_ORDERS',
  VIEW_FINANCE = 'VIEW_FINANCE',
  MANAGE_REFUNDS = 'MANAGE_REFUNDS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_MARKETING = 'VIEW_MARKETING',
  MANAGE_MARKETING = 'MANAGE_MARKETING',
  VIEW_COMMUNICATIONS = 'VIEW_COMMUNICATIONS',
  MANAGE_COMMUNICATIONS = 'MANAGE_COMMUNICATIONS',
  VIEW_SYSTEM = 'VIEW_SYSTEM',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  SUPPORT_ACCESS = 'SUPPORT_ACCESS',
  MANAGE_SUPPORT = 'MANAGE_SUPPORT',
}

export interface AnalyticsEvent {
  id: string;
  eventName:
    | 'APP_OPENED'
    | 'SIGNUP_STARTED'
    | 'SIGNUP_COMPLETED'
    | 'ONBOARDING_STARTED'
    | 'ONBOARDING_COMPLETED'
    | 'PRODUCT_VIEWED'
    | 'PRODUCT_ADDED_TO_CART'
    | 'CHECKOUT_STARTED'
    | 'ORDER_CREATED'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'SUBSCRIPTION_STARTED'
    | 'SUBSCRIPTION_CANCELED'
    | 'CAMPAIGN_CLICKED'
    | 'PROMOTION_USED'
    | 'EDUCATION_STARTED'
    | 'EDUCATION_COMPLETED'
    | 'NOTIFICATION_CLICKED'
    | string;
  userId?: string | null;
  anonymousSessionId?: string | null;
  shopId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  country?: string;
  locale?: string;
  source?: string;
  sessionId?: string;
}

export interface SearchEvent {
  id: string;
  userId?: string | null;
  anonymousSessionId?: string | null;
  query: string;
  filters?: Record<string, any>;
  resultCount: number;
  selectedResult?: string | null;
  convertedToCart?: boolean;
  convertedToOrder?: boolean;
  timestamp: string;
}

export type AdminAlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AdminAlertType =
  | 'PAYMENT_FAILURE_SPIKE'
  | 'ORDER_FAILURE_SPIKE'
  | 'DELIVERY_INCIDENT_SPIKE'
  | 'ERROR_SPIKE'
  | 'SUBSCRIPTION_FAILURE_SPIKE'
  | 'FRAUD_RISK'
  | 'LOW_STOCK'
  | 'PROVIDER_FAILURE'
  | 'SYSTEM_HEALTH';

export interface AdminAlert {
  id: string;
  type: AdminAlertType;
  severity: AdminAlertSeverity;
  source: string;
  title: string;
  message: string;
  threshold?: string;
  timestamp: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
}

export type BackgroundJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

export interface BackgroundJob {
  id: string;
  type:
    | 'NOTIFICATION_DISPATCH'
    | 'ANALYTICS_AGGREGATION'
    | 'FINANCIAL_RECONCILIATION'
    | 'DATA_SYNCHRONIZATION'
    | 'MARKETING_REPORT'
    | 'SUBSCRIPTION_RENEWAL'
    | string;
  status: BackgroundJobStatus;
  startedAt: string;
  completedAt?: string | null;
  attempts: number;
  error?: string | null;
  metadata?: Record<string, any>;
}

export interface AdminAuditLogRecord {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export type SupportCaseStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'RESOLVED' | 'CLOSED';
export type SupportCasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface SupportMessage {
  id: string;
  sender: 'CLIENT' | 'SUPPORT' | 'SYSTEM';
  authorName: string;
  text: string;
  timestamp: string;
}

export interface SupportCase {
  id: string;
  userId: string;
  userEmailSnapshot?: string;
  userNameSnapshot?: string;
  orderId?: string | null;
  shopId?: string | null;
  category: 'ORDER' | 'PAYMENT' | 'DELIVERY' | 'ACCOUNT' | 'SUBSCRIPTION' | 'PRODUCT_INQUIRY' | 'OTHER';
  status: SupportCaseStatus;
  priority: SupportCasePriority;
  subject: string;
  assignedTo?: string | null;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface MetricDefinition {
  key: string;
  name: string;
  description: string;
  formula: string;
  source: string;
  unit: 'EUR' | 'PERCENT' | 'COUNT' | 'SECONDS' | 'RATIO';
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'RATE' | 'RATIO';
  permissions: string[];
}

export interface AnalyticsFilterParams {
  period?: 'today' | '7d' | '30d' | '90d' | '12m' | 'custom';
  startDate?: string;
  endDate?: string;
  country?: string;
  shopId?: string;
  category?: string;
  userType?: string;
  subscription?: string;
  currency?: string;
}

export interface ConversionFunnelStep {
  stepIndex: number;
  key: string;
  name: string;
  description: string;
  count: number;
  conversionRateFromTop: number; // % of top step
  stepConversionRate: number; // % of previous step
  dropoffRate: number; // % dropped off from previous step
}

export interface GlobalKPISummary {
  users: {
    total: number;
    newInPeriod: number;
    active: number;
    reactivated: number;
    dormant: number;
    activationRate: number; // %
    retentionRate: number; // %
    dau: number;
    wau: number;
    mau: number;
    dauMauRatio: number;
    trendVsPreviousPeriod: number; // %
  };
  marketplace: {
    ordersCount: number;
    grossGMV: number;
    netGMV: number;
    averageOrderValue: number;
    activeShopsCount: number;
    activeProductsCount: number;
    productsSoldCount: number;
    buyerClientsCount: number;
    conversionRate: number;
    cancellationRate: number;
    refundRate: number;
    trendVsPreviousPeriod: number; // %
  };
  finance: {
    successfulPaymentsCount: number;
    failedPaymentsCount: number;
    refundsTotalAmount: number;
    nexusCommissionsTotal: number;
    subscriptionRevenueTotal: number;
    marketingRevenueTotal: number;
    pspEstimatedFeesTotal: number;
    partnerPendingBalancesTotal: number;
  };
  subscriptions: {
    activeCount: number;
    newCount: number;
    canceledCount: number;
    renewalsCount: number;
    mrr: number;
    arr: number;
    churnRate: number;
    arpu: number;
  };
  engagement: {
    activeSessionsCount: number;
    wellnessActionsLogged: number;
    educationPathwaysCompleted: number;
    challengesCompleted: number;
    loyaltyPointsIssued: number;
    notificationsDelivered: number;
    aiAssistantInteractionsCount: number;
  };
}

export interface TrendTimeSeriesPoint {
  date: string;
  label: string;
  gmv: number;
  orders: number;
  activeUsers: number;
  newUsers: number;
  mrr: number;
}

// -------------------------------------------------------------
// MODULE 18: SÉCURITÉ, CONFORMITÉ, RGPD & PRÉPARATION PRODUCTION
// -------------------------------------------------------------

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';

export interface SecurityIncident {
  id: string;
  type: string;
  severity: IncidentSeverity;
  source: string;
  status: IncidentStatus;
  detectedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  notes?: string;
  auditTrail: {
    timestamp: string;
    action: string;
    author: string;
    details?: string;
  }[];
}

export type DeletionStrategy = 'HARD_DELETE' | 'ANONYMIZE' | 'PSEUDONYMIZE';

export interface RetentionPolicy {
  id: string;
  dataType: string;
  category: 'ACCOUNT' | 'MARKETPLACE' | 'COMMUNICATION' | 'ANALYTICS' | 'SENSITIVE_HEALTH';
  purpose: string;
  retentionPeriodDays: number;
  deletionStrategy: DeletionStrategy;
  legalBasis: string;
  exceptions: string;
  lastExecutedAt?: string;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rules?: {
    environments?: string[];
    countries?: string[];
    roles?: UserRole[];
    rolloutPercentage?: number;
  };
  updatedAt: string;
}

export interface SystemConfiguration {
  id: string;
  activeCountries: string[];
  currencies: string[];
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEstimatedEndTime?: string;
  platformCommissionPercent: number;
  pspProvider: 'STRIPE' | 'MOCK' | 'UNCONFIGURED';
  backupFrequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
  lastBackupAt?: string;
  updatedAt: string;
}

export type ReadinessStatus = 'READY' | 'PARTIAL' | 'NOT_READY';
export type CheckStatus = 'CONFIGURED' | 'NOT_CONFIGURED' | 'TESTED' | 'NOT_TESTED' | 'IMPLEMENTED';

export interface ReadinessCheck {
  id: string;
  name: string;
  status: CheckStatus;
  details: string;
  mandatoryForProd: boolean;
}

export interface ReadinessCategory {
  category: string;
  label: string;
  status: ReadinessStatus;
  score: number; // 0 to 100
  checks: ReadinessCheck[];
}

export interface ProductionReadinessScore {
  overallScore: number;
  overallStatus: ReadinessStatus;
  evaluatedAt: string;
  categories: { [key: string]: ReadinessCategory };
  blockingCount: number;
  recommendedActions: string[];
}

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  sizeBytes: number;
  checksumSha256: string;
  tablesCount: number;
  recordsCount: number;
  status: 'SUCCESS' | 'FAILED' | 'VERIFIED';
  verifiedAt?: string;
  storageLocation: string;
  encrypted: boolean;
}

export interface DataInventoryCategory {
  category: 'ACCOUNT' | 'MARKETPLACE' | 'COMMUNICATION' | 'ANALYTICS' | 'SENSITIVE_HEALTH';
  label: string;
  fields: string[];
  purpose: string;
  storageType: string;
  sanctuaryProtected: boolean;
  exportable: boolean;
  deletableOnRequest: boolean;
  retentionDescription: string;
}

export interface SystemFeatureFlag {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  category: 'CHECKOUT' | 'COMMUNICATION' | 'SECURITY' | 'LOGISTICS' | 'MARKETPLACE';
  updatedAt: string;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceEstimatedEndTime?: string;
  activeCountries: string[];
  enforceHealthSanctuary: boolean;
  allowedOrigins: string[];
  backupRetentionDays: number;
}



