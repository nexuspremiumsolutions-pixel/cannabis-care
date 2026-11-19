import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../auth/auth';
import {
  ProfileType,
  THCProfile,
  CBDProfile,
  UserProfile,
  ConsumptionProfile,
  WellnessProfile,
  CommunicationPreferences,
  ConsentRecord,
  ONBOARDING_VERSION,
  THCStatus,
  CBDStatus,
  PrimaryPath,
  Badge,
} from '../../src/types/entities';
import { OnboardingDecisionEngine, OnboardingInputPayload } from '../services/onboardingDecisionEngine';

const router = Router();

/**
 * 1. GET /api/onboarding/status
 * Check user onboarding state and retrieve draft
 */
router.get('/status', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = db.get('userProfiles').find((p) => p.userId === userId);
    
    return res.json({
      userId,
      isOnboarded: profile?.isOnboarded ?? false,
      onboardingCompleted: profile?.onboardingCompleted ?? profile?.isOnboarded ?? false,
      onboardingVersion: profile?.onboardingVersion || ONBOARDING_VERSION,
      currentStep: profile?.currentStep || 1,
      totalSteps: 7,
      draft: profile?.onboardingDraft || null,
      primaryPath: profile?.primaryPath || PrimaryPath.UNDETERMINED,
      thcStatus: profile?.thcStatus || THCStatus.UNKNOWN,
      cbdStatus: profile?.cbdStatus || CBDStatus.UNKNOWN,
      recommendedModules: profile?.recommendedModules || [],
    });
  } catch (err) {
    console.error('Error fetching onboarding status:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du statut d’onboarding.' });
  }
});

/**
 * 2. POST /api/onboarding/start
 * Initialize or resume onboarding draft
 */
router.post('/start', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date().toISOString();
    const profiles = db.get('userProfiles');
    let profile = profiles.find((p) => p.userId === userId);

    if (!profile) {
      profile = {
        id: 'prof_' + userId,
        userId,
        nickname: req.user!.email.split('@')[0],
        profileType: ProfileType.UNDETERMINED,
        primaryPath: PrimaryPath.UNDETERMINED,
        thcStatus: THCStatus.UNKNOWN,
        cbdStatus: CBDStatus.UNKNOWN,
        isOnboarded: false,
        onboardingCompleted: false,
        onboardingVersion: ONBOARDING_VERSION,
        currentStep: 1,
        onboardingDraft: {
          currentStep: 1,
          totalSteps: 7,
          lastSavedAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };
      profiles.push(profile);
      db.save();
    } else if (!profile.onboardingDraft) {
      profile.onboardingDraft = {
        currentStep: profile.currentStep || 1,
        totalSteps: 7,
        lastSavedAt: now,
      };
      profile.updatedAt = now;
      db.save();
    }

    db.logAudit('ONBOARDING_STARTED', 'userProfiles', userId);

    return res.json({
      success: true,
      currentStep: profile.currentStep || 1,
      totalSteps: 7,
      draft: profile.onboardingDraft,
    });
  } catch (err) {
    console.error('Error starting onboarding:', err);
    return res.status(500).json({ error: 'Erreur lors de l’initialisation de l’onboarding.' });
  }
});

/**
 * 3. POST /api/onboarding/step
 * Save intermediate step data in draft
 */
router.post('/step', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { step, data } = req.body;

    if (!step || typeof step !== 'number' || step < 1 || step > 7) {
      return res.status(400).json({ error: 'Numéro d’étape invalide (doit être entre 1 et 7).' });
    }

    const now = new Date().toISOString();
    const profiles = db.get('userProfiles');
    let profile = profiles.find((p) => p.userId === userId);

    if (!profile) {
      profile = {
        id: 'prof_' + userId,
        userId,
        nickname: req.user!.email.split('@')[0],
        profileType: ProfileType.UNDETERMINED,
        primaryPath: PrimaryPath.UNDETERMINED,
        isOnboarded: false,
        onboardingCompleted: false,
        onboardingVersion: ONBOARDING_VERSION,
        currentStep: step,
        createdAt: now,
        updatedAt: now,
      };
      profiles.push(profile);
    }

    // Merge draft data
    const existingDraft = profile.onboardingDraft || {
      currentStep: 1,
      totalSteps: 7,
      lastSavedAt: now,
    };

    profile.onboardingDraft = {
      ...existingDraft,
      ...data,
      currentStep: step,
      lastSavedAt: now,
    };
    profile.currentStep = step;
    profile.updatedAt = now;

    db.save();

    return res.json({
      success: true,
      savedStep: step,
      draft: profile.onboardingDraft,
    });
  } catch (err) {
    console.error('Error saving onboarding step:', err);
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’étape.' });
  }
});

/**
 * 4. POST /api/onboarding/complete
 * Submit final onboarding questionnaire, process decision engine & persist all dimensions
 */
router.post('/complete', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const payload: OnboardingInputPayload = req.body;

    const profiles = db.get('userProfiles');
    let existingProfile = profiles.find((p) => p.userId === userId);

    // Run Decision Engine
    const decision = OnboardingDecisionEngine.process(userId, payload, existingProfile);

    if (!decision.isValid) {
      return res.status(400).json({
        error: 'Données d’onboarding invalides.',
        details: decision.validationErrors,
      });
    }

    const now = new Date().toISOString();

    // 1. Update/Upsert UserProfile
    if (existingProfile) {
      Object.assign(existingProfile, decision.userProfile, {
        isOnboarded: true,
        onboardingCompleted: true,
        onboardingVersion: ONBOARDING_VERSION,
        currentStep: 7,
        onboardingDraft: undefined, // Draft is consumed
        updatedAt: now,
      });
    } else {
      existingProfile = {
        ...(decision.userProfile as UserProfile),
        isOnboarded: true,
        onboardingCompleted: true,
        onboardingVersion: ONBOARDING_VERSION,
        currentStep: 7,
        createdAt: now,
        updatedAt: now,
      };
      profiles.push(existingProfile);
    }

    // 2. Upsert ConsumptionProfile
    const consumptionProfiles = db.get('consumptionProfiles');
    const existingConsIndex = consumptionProfiles.findIndex((c) => c.userId === userId);
    if (existingConsIndex !== -1) {
      consumptionProfiles[existingConsIndex] = {
        ...consumptionProfiles[existingConsIndex],
        ...(decision.consumptionProfile as ConsumptionProfile),
        updatedAt: now,
      };
    } else {
      consumptionProfiles.push({
        ...(decision.consumptionProfile as ConsumptionProfile),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Upsert legacy THCProfile for backwards compatibility
    const thcProfiles = db.get('thcProfiles');
    const existingThcIndex = thcProfiles.findIndex((t) => t.userId === userId);
    if (decision.thcProfile) {
      if (existingThcIndex !== -1) {
        thcProfiles[existingThcIndex] = {
          ...thcProfiles[existingThcIndex],
          ...(decision.thcProfile as THCProfile),
          updatedAt: now,
        };
      } else {
        thcProfiles.push({
          ...(decision.thcProfile as THCProfile),
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // 4. Upsert CBDProfile
    const cbdProfiles = db.get('cbdProfiles');
    const existingCbdIndex = cbdProfiles.findIndex((c) => c.userId === userId);
    if (existingCbdIndex !== -1) {
      cbdProfiles[existingCbdIndex] = {
        ...cbdProfiles[existingCbdIndex],
        ...(decision.cbdProfile as CBDProfile),
        updatedAt: now,
      };
    } else {
      cbdProfiles.push({
        ...(decision.cbdProfile as CBDProfile),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 5. Upsert WellnessProfile
    const wellnessProfiles = db.get('wellnessProfiles');
    const existingWellIndex = wellnessProfiles.findIndex((w) => w.userId === userId);
    if (existingWellIndex !== -1) {
      wellnessProfiles[existingWellIndex] = {
        ...wellnessProfiles[existingWellIndex],
        ...(decision.wellnessProfile as WellnessProfile),
        updatedAt: now,
      };
    } else {
      wellnessProfiles.push({
        ...(decision.wellnessProfile as WellnessProfile),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 6. Upsert CommunicationPreferences
    const commPrefs = db.get('communicationPreferences');
    const existingCommIndex = commPrefs.findIndex((cp) => cp.userId === userId);
    if (existingCommIndex !== -1) {
      commPrefs[existingCommIndex] = {
        ...commPrefs[existingCommIndex],
        ...(decision.communicationPreferences as CommunicationPreferences),
        updatedAt: now,
      };
    } else {
      commPrefs.push({
        ...(decision.communicationPreferences as CommunicationPreferences),
        createdAt: now,
        updatedAt: now,
      });
    }

    // 7. Store granular ConsentRecords
    const consentRecords = db.get('consentRecords');
    // Remove old consent records for this user and push new versioned ones
    const filteredConsents = consentRecords.filter((cr) => cr.userId !== userId);
    decision.consentRecords.forEach((cr) => {
      filteredConsents.push(cr as ConsentRecord);
    });
    db.set('consentRecords', filteredConsents);

    // 8. Add ProfileHistory entry
    const historyEntry = OnboardingDecisionEngine.createHistoryEntry(
      userId,
      null,
      existingProfile,
      'onboarding_completion',
      `Onboarding v${ONBOARDING_VERSION} complété. Profil principal : ${decision.primaryPath}`
    );
    db.get('profileHistories').push(historyEntry);

    // 9. Award Initial Badge if not present
    const badges = db.get('badges');
    const hasBadge = badges.some((b) => b.userId === userId && b.code === 'badge_onboarding_completed');
    if (!hasBadge) {
      badges.push({
        id: 'bdg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        code: 'badge_onboarding_completed',
        title: 'Première Étape Franchie',
        description: 'Vous avez complété votre profil comportemental initial personnalisé.',
        category: 'milestone',
        iconName: 'Compass',
        earnedAt: now,
      });
    }

    db.save();
    db.logAudit('ONBOARDING_COMPLETED', 'userProfiles', userId, {
      primaryPath: decision.primaryPath,
      thcStatus: decision.thcStatus,
      cbdStatus: decision.cbdStatus,
      modules: decision.recommendedModules,
    });

    return res.status(200).json({
      success: true,
      profile: existingProfile,
      consumptionProfile: decision.consumptionProfile,
      cbdProfile: decision.cbdProfile,
      wellnessProfile: decision.wellnessProfile,
      communicationPreferences: decision.communicationPreferences,
      recommendedModules: decision.recommendedModules,
      primaryPath: decision.primaryPath,
    });
  } catch (err) {
    console.error('Error completing onboarding:', err);
    return res.status(500).json({ error: 'Erreur lors de la finalisation de l’onboarding.' });
  }
});

/**
 * 5. GET /api/onboarding/profile
 * Retrieve full integrated user profile
 */
router.get('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = db.get('userProfiles').find((p) => p.userId === userId);
    const consumptionProfile = db.get('consumptionProfiles').find((c) => c.userId === userId);
    const thcProfile = db.get('thcProfiles').find((t) => t.userId === userId);
    const cbdProfile = db.get('cbdProfiles').find((c) => c.userId === userId);
    const wellnessProfile = db.get('wellnessProfiles').find((w) => w.userId === userId);
    const communicationPreferences = db.get('communicationPreferences').find((cp) => cp.userId === userId);
    const consentRecords = db.get('consentRecords').filter((cr) => cr.userId === userId);
    const userPreferences = db.get('userPreferences').find((up) => up.userId === userId);

    return res.json({
      profile,
      consumptionProfile: consumptionProfile || thcProfile,
      thcProfile,
      cbdProfile,
      wellnessProfile,
      communicationPreferences,
      consentRecords,
      userPreferences,
      recommendedModules: profile?.recommendedModules || [],
      primaryPath: profile?.primaryPath || PrimaryPath.UNDETERMINED,
    });
  } catch (err) {
    console.error('Error fetching full profile:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
});

/**
 * 6. PATCH /api/onboarding/profile
 * Update profile post-onboarding (from Settings or Edit Profile modal) and recalculate recommendations
 */
router.patch('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const payload: Partial<OnboardingInputPayload> = req.body;
    const now = new Date().toISOString();

    const profiles = db.get('userProfiles');
    const existingProfile = profiles.find((p) => p.userId === userId);

    if (!existingProfile) {
      return res.status(404).json({ error: 'Profil introuvable.' });
    }

    // Build merged payload
    const mergedPayload: OnboardingInputPayload = {
      nickname: payload.nickname || existingProfile.nickname,
      thcStatus: payload.thcStatus || existingProfile.thcStatus || THCStatus.UNKNOWN,
      formerUsageDetails: payload.formerUsageDetails,
      thcUsage: payload.thcUsage,
      cbdStatus: payload.cbdStatus || existingProfile.cbdStatus || CBDStatus.UNKNOWN,
      cbdUsage: payload.cbdUsage,
      wellness: payload.wellness,
      communication: payload.communication,
      consents: payload.consents,
    };

    const decision = OnboardingDecisionEngine.process(userId, mergedPayload, existingProfile);

    if (!decision.isValid) {
      return res.status(400).json({
        error: 'Modifications invalides.',
        details: decision.validationErrors,
      });
    }

    // Store history entry
    const historyEntry = OnboardingDecisionEngine.createHistoryEntry(
      userId,
      existingProfile,
      decision.userProfile,
      'profile_update',
      'Mise à jour du profil comportemental depuis les paramètres.'
    );
    db.get('profileHistories').push(historyEntry);

    // Apply updates
    Object.assign(existingProfile, decision.userProfile, { updatedAt: now });

    // Update consumption profile
    const consProfiles = db.get('consumptionProfiles');
    const consIndex = consProfiles.findIndex((c) => c.userId === userId);
    if (consIndex !== -1) {
      consProfiles[consIndex] = { ...consProfiles[consIndex], ...(decision.consumptionProfile as ConsumptionProfile), updatedAt: now };
    }

    // Update CBD profile
    const cbdProfiles = db.get('cbdProfiles');
    const cbdIndex = cbdProfiles.findIndex((c) => c.userId === userId);
    if (cbdIndex !== -1) {
      cbdProfiles[cbdIndex] = { ...cbdProfiles[cbdIndex], ...(decision.cbdProfile as CBDProfile), updatedAt: now };
    }

    // Update Wellness profile
    const wellProfiles = db.get('wellnessProfiles');
    const wellIndex = wellProfiles.findIndex((w) => w.userId === userId);
    if (wellIndex !== -1) {
      wellProfiles[wellIndex] = { ...wellProfiles[wellIndex], ...(decision.wellnessProfile as WellnessProfile), updatedAt: now };
    }

    // Update Communication preferences
    const commProfiles = db.get('communicationPreferences');
    const commIndex = commProfiles.findIndex((cp) => cp.userId === userId);
    if (commIndex !== -1) {
      commProfiles[commIndex] = { ...commProfiles[commIndex], ...(decision.communicationPreferences as CommunicationPreferences), updatedAt: now };
    }

    db.save();
    db.logAudit('PROFILE_UPDATED_POST_ONBOARDING', 'userProfiles', userId);

    return res.json({
      success: true,
      profile: existingProfile,
      recommendedModules: decision.recommendedModules,
      primaryPath: decision.primaryPath,
    });
  } catch (err) {
    console.error('Error patching profile:', err);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
});

/**
 * 7. POST /api/onboarding/reset
 * Reset onboarding state to allow re-taking the questionnaire
 */
router.post('/reset', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date().toISOString();
    const profiles = db.get('userProfiles');
    const profile = profiles.find((p) => p.userId === userId);

    if (profile) {
      profile.isOnboarded = false;
      profile.onboardingCompleted = false;
      profile.currentStep = 1;
      profile.onboardingDraft = {
        currentStep: 1,
        totalSteps: 7,
        lastSavedAt: now,
      };
      profile.updatedAt = now;
      db.save();
      db.logAudit('ONBOARDING_RESET', 'userProfiles', userId);
    }

    return res.json({ success: true, message: 'Onboarding réinitialisé avec succès.' });
  } catch (err) {
    console.error('Error resetting onboarding:', err);
    return res.status(500).json({ error: 'Erreur lors de la réinitialisation de l’onboarding.' });
  }
});

/**
 * 8. GET /api/onboarding/history
 * Retrieve profile evolution history logs
 */
router.get('/history', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const history = db.get('profileHistories').filter((h) => h.userId === userId);
    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération de l’historique de profil.' });
  }
});

/**
 * Backwards compatibility: POST /thc
 */
router.post('/thc', requireAuth, (req: AuthenticatedRequest, res) => {
  const payload: OnboardingInputPayload = {
    thcStatus: THCStatus.CURRENT_USER,
    thcUsage: {
      frequency: req.body.frequency,
      quantity: req.body.approxQuantity,
      contexts: req.body.contexts,
      motivations: req.body.declaredReasons,
      goal: req.body.primaryGoal,
      estimatedMonthlyBudget: req.body.averageCostPerMonthEstimated,
    },
    cbdStatus: CBDStatus.UNKNOWN,
  };
  req.body = payload;
  return (router as any).handle(req, res);
});

/**
 * Backwards compatibility: POST /cbd
 */
router.post('/cbd', requireAuth, (req: AuthenticatedRequest, res) => {
  const payload: OnboardingInputPayload = {
    thcStatus: THCStatus.UNKNOWN,
    cbdStatus: CBDStatus.CURRENT_USER,
    cbdUsage: {
      currentUse: 'yes',
      preferredProductTypes: req.body.productTypesUsed,
      consumptionMethods: req.body.consumptionMode,
    },
    wellness: {
      sleepDetails: {
        declaredQualityRating: req.body.sleepQualityRating,
      },
    },
  };
  req.body = payload;
  return (router as any).handle(req, res);
});

export default router;
