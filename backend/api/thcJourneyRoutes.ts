import express, { Response } from 'express';
import { db } from '../db/database';
import { requireAuth as authenticateToken, AuthenticatedRequest as AuthRequest } from '../auth/auth';
import { THCAnalyticsService } from '../services/thcAnalyticsService';
import {
  ConsumptionEntry,
  THCCraving,
  THCReductionPlan,
  THCTrigger,
  THCDailyGoal,
  WellnessChallenge,
  THCBudgetSetting,
  UserEducationProgress,
  THCProfile,
} from '../../src/types/entities';

const router = express.Router();

/**
 * Standard default triggers for new THC profiles
 */
const DEFAULT_TRIGGERS: Omit<THCTrigger, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  { type: 'habit', label: 'Habitude en fin de journée / Soirée', frequencyCount: 0, intensity: 6, active: true },
  { type: 'emotion', label: 'Stress ou surcharge mentale', frequencyCount: 0, intensity: 7, active: true },
  { type: 'emotion', label: 'Ennui ou temps libre inoccupé', frequencyCount: 0, intensity: 5, active: true },
  { type: 'social', label: 'Moments conviviaux / Amis', frequencyCount: 0, intensity: 6, active: true },
  { type: 'habit', label: 'Difficulté à trouver le sommeil', frequencyCount: 0, intensity: 8, active: true },
  { type: 'location', label: 'Après une journée de travail à domicile', frequencyCount: 0, intensity: 5, active: true },
];

/**
 * Standard daily challenges catalog
 */
const DEFAULT_CHALLENGES_CATALOG: Array<Omit<WellnessChallenge, 'id' | 'userId' | 'date' | 'status' | 'createdAt'>> = [
  {
    title: 'Marche de déconnexion de 15 minutes',
    description: 'Sortez marcher sans substance dès la première envie de transition fin de journée.',
    category: 'activity',
    durationMinutes: 15,
    rewardBadgeCode: 'WALK_EXPLORER',
  },
  {
    title: 'Rituel d’infusion apaisante en soirée',
    description: 'Remplacez la prise de 21h par une tisane camomille/verveine ou une boisson chaude.',
    category: 'relaxation',
    durationMinutes: 20,
    rewardBadgeCode: 'TEA_RITUAL',
  },
  {
    title: 'Séance de respiration guidée (4-4-6)',
    description: 'Effectuez 5 minutes d’inspiration lente 4s, rétention 4s, expiration 6s.',
    category: 'relaxation',
    durationMinutes: 5,
    rewardBadgeCode: 'BREATH_MASTER',
  },
  {
    title: 'Écran éteint 30 min avant le coucher',
    description: 'Posez votre téléphone ou ordinateur 30 minutes avant de dormir et lisez un livre.',
    category: 'sleep',
    durationMinutes: 30,
    rewardBadgeCode: 'SLEEP_CALM',
  },
  {
    title: 'Appel ou message à un proche',
    description: 'Partagez un moment d’échange bienveillant sans consommer pendant la discussion.',
    category: 'social',
    durationMinutes: 15,
    rewardBadgeCode: 'SOCIAL_WARMTH',
  },
  {
    title: 'Préparation d’un repas savoureux',
    description: 'Cuisinez un plat fait maison avec attention pour redécouvrir le plaisir gustatif.',
    category: 'nutrition',
    durationMinutes: 30,
    rewardBadgeCode: 'NUTRITION_CHEF',
  },
  {
    title: 'Pause d’hydratation consciente',
    description: 'Buvez un grand verre d’eau fraîche lentement dès qu’une pensée de consommation survient.',
    category: 'pleasure',
    durationMinutes: 5,
    rewardBadgeCode: 'HYDRATION_HERO',
  },
];

/**
 * 1. GET /api/thc-journey/dashboard
 * Complete consolidated dashboard state
 */
router.get('/dashboard', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Profile & Goal
    const user = db.get('users').find((u) => u.id === userId);
    const userProfile = db.get('userProfiles').find((p) => p.userId === userId);
    const thcProfile = db.get('thcProfiles').find((p) => p.userId === userId);
    const consumptionProfile = db.get('consumptionProfiles').find((p) => p.userId === userId);

    // Active Plan
    const plans = db.get('thcReductionPlans').filter((p) => p.userId === userId);
    const activePlan = plans.find((p) => p.status === 'active') || null;

    // Streaks & Stats
    const streaks = THCAnalyticsService.calculateStreaks(userId);
    const temporalStats = THCAnalyticsService.getTemporalComparison(userId);
    const insights = THCAnalyticsService.analyzeTriggersAndHabits(userId);
    const prudenceAlerts = THCAnalyticsService.detectPrudenceAlerts(userId);

    // Badges
    THCAnalyticsService.awardBadges(userId);
    const allBadges = db.get('badges');
    const userBadges = allBadges.filter((b) => b.userId === userId || !b.userId);

    // Today's specific records
    const allEntries = db.get('consumptionEntries').filter((e) => e.userId === userId);
    const todayEntries = allEntries.filter((e) => e.date === todayStr);

    const allCravings = db.get('thcCravings').filter((c) => c.userId === userId);
    const todayCravings = allCravings.filter((c) => c.date === todayStr);

    // Today's Daily Goal
    let todayDailyGoal = db.get('thcDailyGoals').find((g) => g.userId === userId && g.date === todayStr);
    if (!todayDailyGoal) {
      // Auto-create today's daily goal based on active plan or profile
      const targetType = activePlan?.targetQuantity === 0 ? 'zero_consumption' : 'max_quantity';
      const targetValue = activePlan ? activePlan.targetQuantity : 0;
      todayDailyGoal = {
        id: 'dg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        date: todayStr,
        targetType,
        targetValue,
        targetUnit: activePlan?.quantityUnit || 'joints',
        achieved: null,
        createdAt: new Date().toISOString(),
      };
      db.get('thcDailyGoals').push(todayDailyGoal);
      db.save();
    }

    // Ensure initial triggers exist
    let userTriggers = db.get('thcTriggers').filter((t) => t.userId === userId);
    if (userTriggers.length === 0) {
      DEFAULT_TRIGGERS.forEach((dt) => {
        const newTrigger: THCTrigger = {
          id: 'trig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userId,
          ...dt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.get('thcTriggers').push(newTrigger);
      });
      db.save();
      userTriggers = db.get('thcTriggers').filter((t) => t.userId === userId);
    }

    // Ensure challenges for today
    let userChallenges = db.get('wellnessChallenges').filter((c) => c.userId === userId && c.date === todayStr);
    if (userChallenges.length === 0) {
      // Pick 3 diverse challenges from catalog
      const shuffled = [...DEFAULT_CHALLENGES_CATALOG].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      selected.forEach((c) => {
        db.get('wellnessChallenges').push({
          id: 'chal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userId,
          ...c,
          date: todayStr,
          status: 'available',
          createdAt: new Date().toISOString(),
        });
      });
      db.save();
      userChallenges = db.get('wellnessChallenges').filter((c) => c.userId === userId && c.date === todayStr);
    }

    // Budget & Savings
    const budgetSetting = db.get('thcBudgetSettings').find((b) => b.userId === userId);
    const baselineMonthlySpend = budgetSetting?.estimatedMonthlySpend || 120;
    const costPerDay = baselineMonthlySpend / 30;
    const estimatedSaved = Number((streaks.totalTHCFreeDays * costPerDay).toFixed(2));

    return res.json({
      user: {
        id: user?.id,
        nickname: userProfile?.nickname || 'Voyageur',
        primaryGoal: thcProfile?.primaryGoal || 'reduce',
        profileType: userProfile?.profileType,
      },
      streaks,
      activePlan,
      todayDailyGoal,
      todayEntries,
      todayCravings,
      userTriggers,
      dailyChallenges: userChallenges,
      temporalStats,
      insights,
      prudenceAlerts,
      userBadges,
      budget: {
        setting: budgetSetting || {
          userId,
          estimatedMonthlySpend: 120,
          purchaseFrequency: 'weekly',
          costPerPurchase: 30,
          updatedAt: new Date().toISOString(),
        },
        estimatedSaved,
      },
      recentEvents: db
        .get('thcJourneyEvents')
        .filter((e) => e.userId === userId)
        .slice(-10)
        .reverse(),
    });
  } catch (err: any) {
    console.error('Error in THC dashboard endpoint:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du tableau de bord THC.' });
  }
});

/**
 * 2. GET & POST & PUT /api/thc-journey/plan
 * Reduction Plan Management
 */
router.get('/plan', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const plans = db.get('thcReductionPlans').filter((p) => p.userId === userId);
    return res.json({ plans });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du plan.' });
  }
});

router.post('/plan', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      startDate,
      targetDate,
      baselineFrequency,
      baselineQuantity,
      quantityUnit,
      targetFrequency,
      targetQuantity,
      strategy,
      intermediateSteps,
      notes,
    } = req.body;

    if (!startDate || baselineQuantity === undefined || targetQuantity === undefined) {
      return res.status(400).json({ error: 'Données de plan incomplètes.' });
    }

    // Archive previous active plans
    db.get('thcReductionPlans')
      .filter((p) => p.userId === userId && p.status === 'active')
      .forEach((p) => {
        p.status = 'archived';
        p.updatedAt = new Date().toISOString();
      });

    // Create intermediate steps if none provided
    const steps =
      intermediateSteps && intermediateSteps.length > 0
        ? intermediateSteps
        : [
            {
              stepNumber: 1,
              label: 'Stabilisation & Observation',
              targetDate: startDate,
              targetQuantity: baselineQuantity,
              isAchieved: true,
            },
            {
              stepNumber: 2,
              label: 'Premier Palier de Réduction',
              targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              targetQuantity: Math.max(0, Math.round((baselineQuantity + targetQuantity) / 2)),
              isAchieved: false,
            },
            {
              stepNumber: 3,
              label: 'Objectif Cible Défini',
              targetDate: targetDate || new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
              targetQuantity: targetQuantity,
              isAchieved: false,
            },
          ];

    const newPlan: THCReductionPlan = {
      id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      startDate,
      targetDate: targetDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      baselineFrequency: baselineFrequency || 'quotidienne',
      baselineQuantity: Number(baselineQuantity),
      quantityUnit: quantityUnit || 'joints',
      targetFrequency: targetFrequency || 'occasionnelle',
      targetQuantity: Number(targetQuantity),
      strategy: strategy || 'progressive',
      intermediateSteps: steps,
      status: 'active',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.get('thcReductionPlans').push(newPlan);

    // Add journey event
    db.get('thcJourneyEvents').push({
      id: 'ev_' + Date.now(),
      userId,
      type: 'PLAN_UPDATED',
      occurredAt: new Date().toISOString(),
      metadata: { planId: newPlan.id, targetQuantity },
      createdAt: new Date().toISOString(),
    });

    db.logAudit('CREATE_THC_PLAN', 'thcReductionPlans', userId, { planId: newPlan.id });
    THCAnalyticsService.awardBadges(userId);
    db.save();

    return res.status(201).json({ plan: newPlan });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la création du plan.' });
  }
});

router.put('/plan/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const planId = req.params.id;
    const plan = db.get('thcReductionPlans').find((p) => p.id === planId && p.userId === userId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan non trouvé.' });
    }

    const { status, intermediateSteps, targetQuantity, targetDate, notes } = req.body;
    if (status) plan.status = status;
    if (intermediateSteps) plan.intermediateSteps = intermediateSteps;
    if (targetQuantity !== undefined) plan.targetQuantity = Number(targetQuantity);
    if (targetDate) plan.targetDate = targetDate;
    if (notes !== undefined) plan.notes = notes;
    plan.updatedAt = new Date().toISOString();

    db.logAudit('UPDATE_THC_PLAN', 'thcReductionPlans', userId, { planId });
    db.save();

    return res.json({ plan });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du plan.' });
  }
});

/**
 * 3. GET & POST & DELETE /api/thc-journey/cravings
 * Craving Tracker & Emergency Tool Logs
 */
router.get('/cravings', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cravings = db
      .get('thcCravings')
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return res.json({ cravings });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des envies.' });
  }
});

router.post('/cravings', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      intensity,
      context,
      trigger,
      durationMinutes,
      consumedAfter,
      copingMethod,
      outcome,
      notes,
      occurredAt,
    } = req.body;

    const eventDate = occurredAt ? new Date(occurredAt) : new Date();
    const dateStr = eventDate.toISOString().split('T')[0];
    const timeStr = eventDate.toTimeString().substring(0, 5);

    const newCraving: THCCraving = {
      id: 'crav_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      occurredAt: eventDate.toISOString(),
      date: dateStr,
      time: timeStr,
      intensity: Number(intensity) || 5,
      context: context || 'Non précisé',
      trigger: trigger || 'Envie spontanée',
      durationMinutes: Number(durationMinutes) || 10,
      consumedAfter: Boolean(consumedAfter),
      copingMethod: copingMethod || 'breathing_4d',
      outcome: outcome || (consumedAfter ? 'consumed' : 'craving_passed'),
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.get('thcCravings').push(newCraving);

    // Update trigger frequency count
    const matchingTrigger = db
      .get('thcTriggers')
      .find((t) => t.userId === userId && t.label.toLowerCase() === (trigger || '').toLowerCase());
    if (matchingTrigger) {
      matchingTrigger.frequencyCount = (matchingTrigger.frequencyCount || 0) + 1;
      matchingTrigger.updatedAt = new Date().toISOString();
    }

    // Journey event
    db.get('thcJourneyEvents').push({
      id: 'ev_' + Date.now(),
      userId,
      type: 'CRAVING_RECORDED',
      occurredAt: newCraving.occurredAt,
      metadata: { cravingId: newCraving.id, intensity: newCraving.intensity, outcome: newCraving.outcome },
      createdAt: new Date().toISOString(),
    });

    db.logAudit('RECORD_CRAVING', 'thcCravings', userId, { cravingId: newCraving.id });
    THCAnalyticsService.awardBadges(userId);
    db.save();

    return res.status(201).json({ craving: newCraving });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’envie.' });
  }
});

router.put('/cravings/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cravingId = req.params.id;
    const craving = db.get('thcCravings').find((c) => c.id === cravingId && c.userId === userId);

    if (!craving) {
      return res.status(404).json({ error: 'Entrée d’envie non trouvée.' });
    }

    const { intensity, context, trigger, durationMinutes, consumedAfter, copingMethod, outcome, notes } = req.body;
    if (intensity !== undefined) craving.intensity = Number(intensity);
    if (context !== undefined) craving.context = context;
    if (trigger !== undefined) craving.trigger = trigger;
    if (durationMinutes !== undefined) craving.durationMinutes = Number(durationMinutes);
    if (consumedAfter !== undefined) craving.consumedAfter = Boolean(consumedAfter);
    if (copingMethod !== undefined) craving.copingMethod = copingMethod;
    if (outcome !== undefined) craving.outcome = outcome;
    if (notes !== undefined) craving.notes = notes;
    craving.updatedAt = new Date().toISOString();

    db.save();
    return res.json({ craving });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l’envie.' });
  }
});

router.delete('/cravings/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cravingId = req.params.id;
    const initialLen = db.get('thcCravings').length;
    const filtered = db.get('thcCravings').filter((c) => !(c.id === cravingId && c.userId === userId));

    if (filtered.length === initialLen) {
      return res.status(404).json({ error: 'Entrée non trouvée.' });
    }

    db.set('thcCravings', filtered);
    db.logAudit('DELETE_CRAVING', 'thcCravings', userId, { cravingId });
    db.save();

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de l’envie.' });
  }
});

/**
 * 4. GET & POST & PUT & DELETE /api/thc-journey/triggers
 * Trigger management
 */
router.get('/triggers', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const triggers = db.get('thcTriggers').filter((t) => t.userId === userId);
    return res.json({ triggers });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des déclencheurs.' });
  }
});

router.post('/triggers', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { label, type, intensity } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Le libellé du déclencheur est requis.' });
    }

    const newTrigger: THCTrigger = {
      id: 'trig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      label: label.trim(),
      type: type || 'emotion',
      frequencyCount: 0,
      intensity: Number(intensity) || 5,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.get('thcTriggers').push(newTrigger);
    db.save();

    return res.status(201).json({ trigger: newTrigger });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l’ajout du déclencheur.' });
  }
});

router.put('/triggers/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const triggerId = req.params.id;
    const trigger = db.get('thcTriggers').find((t) => t.id === triggerId && t.userId === userId);

    if (!trigger) {
      return res.status(404).json({ error: 'Déclencheur non trouvé.' });
    }

    const { label, type, intensity, active } = req.body;
    if (label !== undefined) trigger.label = label;
    if (type !== undefined) trigger.type = type;
    if (intensity !== undefined) trigger.intensity = Number(intensity);
    if (active !== undefined) trigger.active = Boolean(active);
    trigger.updatedAt = new Date().toISOString();

    db.save();
    return res.json({ trigger });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du déclencheur.' });
  }
});

router.delete('/triggers/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const triggerId = req.params.id;
    const filtered = db.get('thcTriggers').filter((t) => !(t.id === triggerId && t.userId === userId));
    db.set('thcTriggers', filtered);
    db.save();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
});

/**
 * 5. POST /api/thc-journey/slips
 * Record a slip with compassionate 4-step reflection
 */
router.post('/slips', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      date,
      time,
      productType,
      quantity,
      unit,
      context,
      trigger,
      cravingBefore,
      moodBefore,
      moodAfter,
      slipReflection,
      personalNotes,
    } = req.body;

    const entryDate = date || new Date().toISOString().split('T')[0];
    const entryTime = time || new Date().toTimeString().substring(0, 5);

    const newSlipEntry: ConsumptionEntry = {
      id: 'cons_slip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: entryDate,
      time: entryTime,
      productType: productType || 'THC_herb',
      productName: 'Consommation déclarée (écart)',
      quantity: Number(quantity) || 1,
      unit: unit || 'joints',
      consumptionMode: 'combustion',
      context: context || 'Moment particulier',
      trigger: trigger || 'Stress ou émotion',
      cravingBefore: cravingBefore !== undefined ? Number(cravingBefore) : 6,
      moodBefore: moodBefore !== undefined ? Number(moodBefore) : 2,
      moodAfter: moodAfter !== undefined ? Number(moodAfter) : 3,
      isSlip: true,
      slipReflection: slipReflection || {
        whatHappened: 'Écart passager',
        triggerDescription: trigger,
        futureHelpIdea: 'Prendre une pause et respirer avant',
        nextStepChoice: 'continue_plan',
      },
      personalNotes: personalNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.get('consumptionEntries').push(newSlipEntry);

    // Add journey event
    db.get('thcJourneyEvents').push({
      id: 'ev_' + Date.now(),
      userId,
      type: 'SLIP_RECORDED',
      occurredAt: new Date().toISOString(),
      metadata: { entryId: newSlipEntry.id, nextStep: slipReflection?.nextStepChoice || 'continue_plan' },
      createdAt: new Date().toISOString(),
    });

    db.logAudit('RECORD_SLIP_WITH_REFLECTION', 'consumptionEntries', userId, { entryId: newSlipEntry.id });
    THCAnalyticsService.awardBadges(userId);
    db.save();

    return res.status(201).json({
      message: 'Votre entrée a été enregistrée. Votre parcours continue avec bienveillance.',
      entry: newSlipEntry,
      streaks: THCAnalyticsService.calculateStreaks(userId),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement de l’écart.' });
  }
});

/**
 * 6. GET /api/thc-journey/calendar
 * Monthly tracking grid
 */
router.get('/calendar', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const year = parseInt((req.query.year as string) || `${now.getFullYear()}`, 10);
    const month = parseInt((req.query.month as string) || `${now.getMonth() + 1}`, 10);

    const calendar = THCAnalyticsService.getMonthlyCalendar(userId, year, month);
    return res.json({ year, month, calendar });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du calendrier.' });
  }
});

/**
 * 7. GET & POST /api/thc-journey/challenges
 * Wellness micro-challenges
 */
router.get('/challenges', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const challenges = db.get('wellnessChallenges').filter((c) => c.userId === userId);
    return res.json({ challenges });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des défis.' });
  }
});

router.post('/challenges/:id/complete', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const challengeId = req.params.id;
    const challenge = db.get('wellnessChallenges').find((c) => c.id === challengeId && c.userId === userId);

    if (!challenge) {
      return res.status(404).json({ error: 'Défi non trouvé.' });
    }

    challenge.status = 'completed';
    challenge.completedAt = new Date().toISOString();

    db.get('thcJourneyEvents').push({
      id: 'ev_' + Date.now(),
      userId,
      type: 'CHALLENGE_COMPLETED',
      occurredAt: challenge.completedAt,
      metadata: { challengeId: challenge.id, title: challenge.title },
      createdAt: new Date().toISOString(),
    });

    db.logAudit('COMPLETE_WELLNESS_CHALLENGE', 'wellnessChallenges', userId, { challengeId });
    THCAnalyticsService.awardBadges(userId);
    db.save();

    return res.json({ success: true, challenge });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la validation du défi.' });
  }
});

router.post('/challenges/refresh', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Pick 3 new random challenges from catalog
    const shuffled = [...DEFAULT_CHALLENGES_CATALOG].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    const newChallenges: WellnessChallenge[] = [];

    selected.forEach((c) => {
      const ch: WellnessChallenge = {
        id: 'chal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        ...c,
        date: todayStr,
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      db.get('wellnessChallenges').push(ch);
      newChallenges.push(ch);
    });

    db.save();
    return res.json({ challenges: newChallenges });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l’actualisation des défis.' });
  }
});

/**
 * 8. GET & POST /api/thc-journey/budget
 * Budget & Estimated Savings
 */
router.get('/budget', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const setting = db.get('thcBudgetSettings').find((b) => b.userId === userId) || {
      userId,
      costPerPurchase: 30,
      purchaseFrequency: 'weekly',
      estimatedMonthlySpend: 120,
      updatedAt: new Date().toISOString(),
    };
    const streaks = THCAnalyticsService.calculateStreaks(userId);
    const costPerDay = (setting.estimatedMonthlySpend || 120) / 30;
    const saved = Number((streaks.totalTHCFreeDays * costPerDay).toFixed(2));

    return res.json({ setting, estimatedSaved: saved, totalTHCFreeDays: streaks.totalTHCFreeDays });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du budget.' });
  }
});

router.post('/budget', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { costPerPurchase, purchaseFrequency, estimatedMonthlySpend } = req.body;

    let setting = db.get('thcBudgetSettings').find((b) => b.userId === userId);
    if (!setting) {
      setting = {
        userId,
        costPerPurchase: Number(costPerPurchase) || 30,
        purchaseFrequency: purchaseFrequency || 'weekly',
        estimatedMonthlySpend: Number(estimatedMonthlySpend) || 120,
        updatedAt: new Date().toISOString(),
      };
      db.get('thcBudgetSettings').push(setting);
    } else {
      if (costPerPurchase !== undefined) setting.costPerPurchase = Number(costPerPurchase);
      if (purchaseFrequency !== undefined) setting.purchaseFrequency = purchaseFrequency;
      if (estimatedMonthlySpend !== undefined) setting.estimatedMonthlySpend = Number(estimatedMonthlySpend);
      setting.updatedAt = new Date().toISOString();
    }

    db.save();
    return res.json({ setting });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de l’enregistrement du budget.' });
  }
});

/**
 * 9. PUT /api/thc-journey/goal
 * Update primary goal
 */
router.put('/goal', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { primaryGoal } = req.body;

    if (!primaryGoal) {
      return res.status(400).json({ error: 'Objectif requis.' });
    }

    let thcProfile = db.get('thcProfiles').find((p) => p.userId === userId);
    if (thcProfile) {
      thcProfile.primaryGoal = primaryGoal;
      thcProfile.updatedAt = new Date().toISOString();
    }

    db.get('thcJourneyEvents').push({
      id: 'ev_' + Date.now(),
      userId,
      type: 'GOAL_CREATED',
      occurredAt: new Date().toISOString(),
      metadata: { primaryGoal },
      createdAt: new Date().toISOString(),
    });

    db.logAudit('UPDATE_THC_PRIMARY_GOAL', 'thcProfiles', userId, { primaryGoal });
    db.save();

    return res.json({ success: true, primaryGoal });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l’objectif.' });
  }
});

/**
 * 10. GET & POST /api/thc-journey/education-progress
 */
router.get('/education-progress', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const progressList = db.get('userEducationProgress').filter((p) => p.userId === userId);
    return res.json({ progressList });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la récupération de la progression éducative.' });
  }
});

router.post('/education-progress', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { contentId, status, isFavorite, progressPercent } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'contentId requis.' });
    }

    let progress = db.get('userEducationProgress').find((p) => p.userId === userId && p.contentId === contentId);
    if (!progress) {
      progress = {
        id: 'edup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        userId,
        contentId,
        status: status || 'started',
        isFavorite: Boolean(isFavorite),
        progressPercent: progressPercent !== undefined ? Number(progressPercent) : 100,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
      db.get('userEducationProgress').push(progress);
    } else {
      if (status !== undefined) {
        progress.status = status;
        if (status === 'completed' && !progress.completedAt) {
          progress.completedAt = new Date().toISOString();
        }
      }
      if (isFavorite !== undefined) progress.isFavorite = Boolean(isFavorite);
      if (progressPercent !== undefined) progress.progressPercent = Number(progressPercent);
      progress.updatedAt = new Date().toISOString();
    }

    db.save();
    return res.json({ progress });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la progression.' });
  }
});

export default router;
