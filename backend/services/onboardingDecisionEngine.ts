import {
  THCStatus,
  CBDStatus,
  PrimaryPath,
  ProfileType,
  ONBOARDING_VERSION,
  UserProfile,
  ConsumptionProfile,
  CBDProfile,
  WellnessProfile,
  CommunicationPreferences,
  ConsentRecord,
  ProfileHistoryEntry,
  THCProfile,
} from '../../src/types/entities';

export interface OnboardingInputPayload {
  nickname?: string;
  thcStatus: THCStatus | string;
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
  cbdStatus: CBDStatus | string;
  cbdUsage?: {
    currentUse?: string;
    consumptionMethods?: string[];
    preferredProductTypes?: string[];
    products?: any[];
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
}

export interface DecisionEngineResult {
  isValid: boolean;
  validationErrors: string[];
  primaryPath: PrimaryPath;
  legacyProfileType: ProfileType;
  thcStatus: THCStatus;
  cbdStatus: CBDStatus;
  recommendedModules: string[];
  userProfile: Partial<UserProfile>;
  consumptionProfile: Partial<ConsumptionProfile>;
  thcProfile?: Partial<THCProfile>;
  cbdProfile: Partial<CBDProfile>;
  wellnessProfile: Partial<WellnessProfile>;
  communicationPreferences: Partial<CommunicationPreferences>;
  consentRecords: Partial<ConsentRecord>[];
}

export class OnboardingDecisionEngine {
  /**
   * Validate and compute behavioral profile and dashboard customization
   */
  public static process(
    userId: string,
    payload: OnboardingInputPayload,
    previousUserProfile?: UserProfile | null
  ): DecisionEngineResult {
    const errors: string[] = [];

    // 1. Validate THC Status
    let normalizedThcStatus: THCStatus = THCStatus.UNKNOWN;
    if (Object.values(THCStatus).includes(payload.thcStatus as THCStatus)) {
      normalizedThcStatus = payload.thcStatus as THCStatus;
    } else {
      errors.push(`Statut THC invalide : ${payload.thcStatus}`);
    }

    // 2. Validate CBD Status
    let normalizedCbdStatus: CBDStatus = CBDStatus.UNKNOWN;
    if (Object.values(CBDStatus).includes(payload.cbdStatus as CBDStatus)) {
      normalizedCbdStatus = payload.cbdStatus as CBDStatus;
    } else {
      errors.push(`Statut CBD invalide : ${payload.cbdStatus}`);
    }

    // 3. Consistency checks
    if (normalizedThcStatus === THCStatus.NEVER_USED) {
      if (payload.thcUsage?.frequency && payload.thcUsage.frequency !== 'declined' && payload.thcUsage.frequency !== 'stopped') {
        errors.push('Incohérence détectée : vous avez indiqué n’avoir jamais consommé de THC tout en déclarant une fréquence active.');
      }
    }

    const now = new Date().toISOString();

    // 4. Determine Primary Path
    let primaryPath: PrimaryPath = PrimaryPath.UNDETERMINED;
    let legacyProfileType: ProfileType = ProfileType.UNDETERMINED;

    if (normalizedThcStatus === THCStatus.CURRENT_USER) {
      primaryPath = PrimaryPath.THC;
      legacyProfileType = ProfileType.THC;
    } else if (
      normalizedThcStatus === THCStatus.FORMER_USER &&
      payload.formerUsageDetails?.wantsToTrackProgression &&
      normalizedCbdStatus !== CBDStatus.CURRENT_USER
    ) {
      primaryPath = PrimaryPath.THC;
      legacyProfileType = ProfileType.THC;
    } else if (normalizedCbdStatus === CBDStatus.CURRENT_USER) {
      primaryPath = PrimaryPath.CBD;
      legacyProfileType = ProfileType.CBD;
    } else if (
      normalizedThcStatus === THCStatus.FORMER_USER ||
      (payload.wellness?.trackedCategories && payload.wellness.trackedCategories.length > 0)
    ) {
      primaryPath = PrimaryPath.WELLNESS;
      legacyProfileType = ProfileType.NEITHER;
    } else {
      primaryPath = PrimaryPath.UNDETERMINED;
      legacyProfileType = ProfileType.NEITHER;
    }

    // 5. Calculate Recommended Modules
    const recommendedModules: string[] = [];

    if (normalizedThcStatus === THCStatus.CURRENT_USER) {
      recommendedModules.push(
        'THC_REDUCTION',
        'CONSUMPTION_JOURNAL',
        'GOALS_TRACKER',
        'TRIGGER_MAPPING',
        'EDUCATION_THC',
        'PROGRESS_STATS',
        'AI_COACH'
      );
    } else if (normalizedThcStatus === THCStatus.FORMER_USER) {
      recommendedModules.push(
        'PROGRESS_STATS',
        'RELAPSE_PREVENTION',
        'WELLNESS_DASHBOARD',
        'EDUCATION_SCIENCE',
        'LIFESTYLE_HABITS',
        'AI_COACH'
      );
    }

    if (normalizedCbdStatus === CBDStatus.CURRENT_USER || normalizedCbdStatus === CBDStatus.FORMER_USER) {
      if (!recommendedModules.includes('CBD_JOURNAL')) recommendedModules.push('CBD_JOURNAL');
      if (!recommendedModules.includes('CBD_PRODUCTS_CATALOG')) recommendedModules.push('CBD_PRODUCTS_CATALOG');
      if (!recommendedModules.includes('STORE_EXPLORER')) recommendedModules.push('STORE_EXPLORER');
      if (!recommendedModules.includes('EDUCATION_SCIENCE')) recommendedModules.push('EDUCATION_SCIENCE');
    }

    if (normalizedThcStatus === THCStatus.NEVER_USED && normalizedCbdStatus !== CBDStatus.CURRENT_USER) {
      recommendedModules.push(
        'WELLNESS_DASHBOARD',
        'EDUCATION_PREVENTION',
        'LIFESTYLE_HABITS',
        'COMMUNITY_INFO'
      );
    }

    // Add wellness specific modules if selected
    const trackedCats = payload.wellness?.trackedCategories || [];
    if (trackedCats.includes('sleep') && !recommendedModules.includes('SLEEP_TRACKING')) {
      recommendedModules.push('SLEEP_TRACKING');
    }
    if (trackedCats.includes('physical_activity') && !recommendedModules.includes('PHYSICAL_ACTIVITY')) {
      recommendedModules.push('PHYSICAL_ACTIVITY');
    }
    if (!recommendedModules.includes('AI_COACH')) {
      recommendedModules.push('AI_COACH');
    }

    // 6. Build UserProfile
    const userProfile: Partial<UserProfile> = {
      id: previousUserProfile?.id || 'prof_' + userId,
      userId,
      nickname: payload.nickname || previousUserProfile?.nickname || 'Explorateur',
      profileType: legacyProfileType,
      primaryPath,
      thcStatus: normalizedThcStatus,
      cbdStatus: normalizedCbdStatus,
      isOnboarded: true,
      onboardingCompleted: true,
      onboardingVersion: ONBOARDING_VERSION,
      currentStep: 7,
      recommendedModules,
      updatedAt: now,
    };

    // 7. Build ConsumptionProfile & legacy THCProfile
    const consumptionProfile: Partial<ConsumptionProfile> = {
      id: 'cons_' + userId,
      userId,
      thcStatus: normalizedThcStatus,
      thcFrequency: (payload.thcUsage?.frequency as any) || (normalizedThcStatus === THCStatus.CURRENT_USER ? 'daily_once' : undefined),
      thcDuration: (payload.thcUsage?.duration as any) || undefined,
      thcTypicalQuantity: payload.thcUsage?.quantity || undefined,
      thcQuantityUnit: (payload.thcUsage?.quantityUnit as any) || 'joints',
      consumptionContexts: payload.thcUsage?.contexts || (normalizedThcStatus === THCStatus.CURRENT_USER ? ['alone_evening'] : []),
      declaredMotivations: payload.thcUsage?.motivations || (normalizedThcStatus === THCStatus.CURRENT_USER ? ['relaxation'] : []),
      reductionGoal: payload.thcUsage?.goal || 'reduce',
      preferredGoal: (payload.thcUsage?.goal as any) || (normalizedThcStatus === THCStatus.CURRENT_USER ? 'reduce' : 'observe'),
      reductionMotivations: payload.thcUsage?.reductionMotivations || ['santé générale', 'sommeil'],
      averageCostPerMonthEstimated: payload.thcUsage?.estimatedMonthlyBudget || 60,
      formerUsageDetails: payload.formerUsageDetails || undefined,
      updatedAt: now,
    };

    const thcProfile: Partial<THCProfile> = {
      ...consumptionProfile,
      firstConsumptionAgeApprox: 18,
      consumptionStatus: normalizedThcStatus === THCStatus.CURRENT_USER ? 'current' : normalizedThcStatus === THCStatus.FORMER_USER ? 'past' : 'occasional',
      frequency: (payload.thcUsage?.frequency as any) || 'daily_once',
      approxQuantity: payload.thcUsage?.quantity || '1 joint/jour',
      averageCostPerMonthEstimated: payload.thcUsage?.estimatedMonthlyBudget || 60,
      contexts: payload.thcUsage?.contexts || ['alone_evening'],
      declaredReasons: payload.thcUsage?.motivations || ['relaxation'],
      habits: [],
      previousReductionAttemptsCount: 0,
      primaryGoal: (payload.thcUsage?.goal as any) || 'reduce',
      quitWish: 'within_month',
      encounteredDifficulties: ['insomnia', 'cravings'],
      declaredTriggers: payload.thcUsage?.contexts || ['stress_work'],
    };

    // 8. Build CBDProfile
    const cbdProfile: Partial<CBDProfile> = {
      id: 'cbd_' + userId,
      userId,
      cbdStatus: normalizedCbdStatus,
      currentUse: (payload.cbdUsage?.currentUse as any) || (normalizedCbdStatus === CBDStatus.CURRENT_USER ? 'yes' : 'no'),
      consumptionMethods: (payload.cbdUsage?.consumptionMethods as any) || (normalizedCbdStatus === CBDStatus.CURRENT_USER ? ['oil_drops'] : []),
      preferredProductTypes: payload.cbdUsage?.preferredProductTypes || ['oil'],
      products: payload.cbdUsage?.products || [],
      productTypesUsed: ['oil'],
      frequency: normalizedCbdStatus === CBDStatus.CURRENT_USER ? 'daily' : 'as_needed',
      consumptionMode: ['sublingual'],
      declaredQuantity: '5 gouttes',
      productCharacteristicsPreferred: ['full_spectrum', 'organic'],
      personalGoals: ['sleep', 'stress_relief'],
      sleepQualityRating: payload.wellness?.sleepDetails?.declaredQualityRating || 3,
      relaxationRating: 3,
      physicalActivityLevel: 'moderate',
      generalWellnessRating: 3,
      updatedAt: now,
    };

    // 9. Build WellnessProfile
    const wellnessProfile: Partial<WellnessProfile> = {
      id: 'well_' + userId,
      userId,
      sleepTrackingEnabled: trackedCats.includes('sleep'),
      sleepDetails: trackedCats.includes('sleep')
        ? {
            averageDurationHours: payload.wellness?.sleepDetails?.averageDurationHours || 7,
            declaredQualityRating: payload.wellness?.sleepDetails?.declaredQualityRating || 3,
            sleepOnsetDifficulty: (payload.wellness?.sleepDetails?.sleepOnsetDifficulty as any) || 'sometimes',
            nightAwakenings: (payload.wellness?.sleepDetails?.nightAwakenings as any) || 'none',
            generalSatisfaction: (payload.wellness?.sleepDetails?.generalSatisfaction as any) || 'satisfied',
          }
        : undefined,
      physicalActivityTrackingEnabled: trackedCats.includes('physical_activity'),
      physicalActivityDetails: trackedCats.includes('physical_activity')
        ? {
            frequency: (payload.wellness?.physicalActivityDetails?.frequency as any) || '1_2_per_week',
            activityTypes: payload.wellness?.physicalActivityDetails?.activityTypes || ['walking'],
          }
        : undefined,
      nutritionTrackingEnabled: trackedCats.includes('nutrition'),
      socialActivityTrackingEnabled: trackedCats.includes('social'),
      relaxationTrackingEnabled: trackedCats.includes('relaxation'),
      hydrationTrackingEnabled: trackedCats.includes('hydration'),
      outdoorTimeTrackingEnabled: trackedCats.includes('outdoor_time'),
      meditationBreathingTrackingEnabled: trackedCats.includes('meditation_breathing'),
      trackedCategories: trackedCats,
      updatedAt: now,
    };

    // 10. Build CommunicationPreferences
    const communicationPreferences: Partial<CommunicationPreferences> = {
      id: 'comm_' + userId,
      userId,
      preferredTone: payload.communication?.preferredTone || 'benevolent',
      preferredContentTypes: payload.communication?.preferredContentTypes || [
        'short_tips',
        'statistics',
        'educational_content',
        'journal',
        'ai_assistant',
      ],
      remindersEnabled: payload.communication?.remindersEnabled ?? true,
      journalReminderEnabled: payload.communication?.journalReminderEnabled ?? true,
      goalReminderEnabled: payload.communication?.goalReminderEnabled ?? true,
      encouragementsEnabled: payload.communication?.encouragementsEnabled ?? true,
      weeklySummaryEnabled: payload.communication?.weeklySummaryEnabled ?? true,
      programRemindersEnabled: payload.communication?.programRemindersEnabled ?? true,
      educationalUpdatesEnabled: payload.communication?.educationalUpdatesEnabled ?? false,
      reminderTime: payload.communication?.reminderTime || '20:30',
      updatedAt: now,
    };

    // 11. Build ConsentRecords
    const consentRecords: Partial<ConsentRecord>[] = [
      {
        id: 'cst_rec_exp_' + userId,
        userId,
        consentType: 'experience_personalization',
        version: ONBOARDING_VERSION,
        granted: payload.consents?.experiencePersonalization ?? true,
        grantedAt: now,
        source: 'onboarding_v1',
      },
      {
        id: 'cst_rec_hlth_' + userId,
        userId,
        consentType: 'health_disclaimer',
        version: ONBOARDING_VERSION,
        granted: payload.consents?.healthDisclaimer ?? true,
        grantedAt: now,
        source: 'onboarding_v1',
      },
      {
        id: 'cst_rec_rem_' + userId,
        userId,
        consentType: 'reminders_notifications',
        version: ONBOARDING_VERSION,
        granted: payload.consents?.remindersNotifications ?? true,
        grantedAt: now,
        source: 'onboarding_v1',
      },
      {
        id: 'cst_rec_res_' + userId,
        userId,
        consentType: 'anonymized_research_telemetry',
        version: ONBOARDING_VERSION,
        granted: payload.consents?.anonymizedResearchTelemetry ?? false,
        grantedAt: now,
        source: 'onboarding_v1',
      },
    ];

    return {
      isValid: errors.length === 0,
      validationErrors: errors,
      primaryPath,
      legacyProfileType,
      thcStatus: normalizedThcStatus,
      cbdStatus: normalizedCbdStatus,
      recommendedModules,
      userProfile,
      consumptionProfile,
      thcProfile,
      cbdProfile,
      wellnessProfile,
      communicationPreferences,
      consentRecords,
    };
  }

  /**
   * Helper to detect differences and create ProfileHistoryEntry if status or goals changed
   */
  public static createHistoryEntry(
    userId: string,
    previous: UserProfile | null | undefined,
    current: Partial<UserProfile>,
    reason: 'onboarding_completion' | 'profile_update' | 'manual_change' | 'milestone_reached',
    note?: string
  ): ProfileHistoryEntry {
    return {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      timestamp: new Date().toISOString(),
      previousThcStatus: previous?.thcStatus,
      newThcStatus: current.thcStatus,
      previousCbdStatus: previous?.cbdStatus,
      newCbdStatus: current.cbdStatus,
      previousPrimaryPath: previous?.primaryPath,
      newPrimaryPath: current.primaryPath,
      triggerReason: reason,
      summaryNote:
        note ||
        `Évolution du profil : THC [${previous?.thcStatus || 'INITIAL'} -> ${current.thcStatus}], CBD [${
          previous?.cbdStatus || 'INITIAL'
        } -> ${current.cbdStatus}], Parcours [${previous?.primaryPath || 'INITIAL'} -> ${current.primaryPath}]`,
    };
  }
}
