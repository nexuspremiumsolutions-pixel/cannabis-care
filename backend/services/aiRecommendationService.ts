/**
 * Module 7 — AI Recommendation Engine (aiRecommendationService)
 * 
 * Generates personalized, prioritized, and non-overwhelming recommendations
 * integrating Modules 1 to 6 (Profile, THC/CBD Tracks, Journal, Stats & Education).
 * 
 * Strict cognitive overload prevention:
 * - 1 primary next action
 * - 1 relevant educational content
 * - max 1 alternative wellness action
 */
import { db } from '../db/database';
import {
  AIRecommendation,
  AIRecommendationType,
  ProfileType,
} from '../../src/types/entities';

export interface ScoredRecommendation extends AIRecommendation {
  score: number;
  priority: number;
  sourceReference?: string;
}

export interface DescriptiveObservation {
  periodDays: number;
  totalLogs: number;
  activeDaysCount: number;
  dominantContext?: string;
  averageMoodBefore?: number;
  averageMoodAfter?: number;
  observationSummary: string;
  invitationToReflect: string;
}

export class AIRecommendationService {
  /**
   * Generates prioritized recommendations (max 3 items) with scoring
   */
  public static getRecommendationsForUser(userId: string, language: 'fr' | 'en' | 'ar' = 'fr'): ScoredRecommendation[] {
    const profile = db.get('userProfiles').find((p) => p.userId === userId);
    const thcProfile = db.get('thcProfiles').find((t) => t.userId === userId);
    const cbdProfile = db.get('cbdProfiles').find((c) => c.userId === userId);
    const progressList = db.get('educationalProgress').filter((p) => p.userId === userId);
    const completedIds = new Set(
      progressList.filter((p) => p.status === 'completed').map((p) => p.targetId)
    );
    const userEntries = db.get('consumptionEntries').filter((e) => e.userId === userId);
    const userCravings = db.get('thcCravings').filter((c) => c.userId === userId);
    const userGoals = db.get('userGoals').filter((g) => g.userId === userId);
    const educationalContents = db.get('educationalContents');

    const isCBD = profile?.profileType === ProfileType.CBD;
    const isTHC = profile?.profileType === ProfileType.THC || !isCBD;

    const candidates: ScoredRecommendation[] = [];

    // ========================================================
    // 1. PRIMARY ACTIONS (EXERCISE / THC_JOURNEY / JOURNAL)
    // ========================================================
    if (isTHC) {
      // Check if user has recent cravings or high-intensity cravings
      const recentCraving = userCravings[0];
      if (recentCraving && recentCraving.intensity >= 6) {
        candidates.push({
          id: `rec_action_delay_${Date.now()}`,
          userId,
          type: 'EXERCISE',
          theme: 'urge_management',
          title: language === 'en' ? 'The 10-Minute Delay Strategy' : 'Pratique : Différer de 10 minutes',
          suggestion:
            language === 'en'
              ? 'When a strong urge strikes, commit to waiting 10 minutes before deciding. In 80% of cases, the wave recedes.'
              : 'Face à une envie soudaine, engagez-vous à attendre 10 minutes sans prendre de décision immédiate. L’intensité de la vague redescend naturellement.',
          rationalNonMedical:
            'Technique comportementale de temporisation cognitive issue des TCC (Thérapies Cognitivo-Comportementales).',
          actionLabel: language === 'en' ? 'Start 10-min Timer' : 'Lancer le minuteur 10 min',
          actionPayload: { exerciseType: 'delay_10_min', durationMinutes: 10 },
          score: 95,
          priority: 1,
          createdAt: new Date().toISOString(),
        });
      } else if (userEntries.length === 0) {
        candidates.push({
          id: `rec_action_first_log_${Date.now()}`,
          userId,
          type: 'JOURNAL_ACTION',
          theme: 'observation_first',
          title: language === 'en' ? 'Record Your First Observation' : 'Enregistrer votre première observation',
          suggestion:
            language === 'en'
              ? 'Log your context and mood during your next session to understand your triggers without judgment.'
              : 'Notez le contexte et votre humeur lors de votre prochaine prise pour comprendre vos déclencheurs sans aucun jugement.',
          rationalNonMedical: 'L’auto-observation neutre est le premier levier d’autonomie validé par la recherche.',
          actionLabel: language === 'en' ? 'Open Journal' : 'Noter dans le journal',
          actionPayload: { modal: 'journal_entry' },
          score: 90,
          priority: 1,
          createdAt: new Date().toISOString(),
        });
      } else {
        candidates.push({
          id: `rec_action_coherence_${Date.now()}`,
          userId,
          type: 'EXERCISE',
          theme: 'stress_alternative',
          title: language === 'en' ? 'Cardiac Coherence (5 min)' : 'Exercice de Cohérence Cardiaque (5 min)',
          suggestion:
            language === 'en'
              ? 'Inhale 5s, exhale 5s for 5 minutes. Mechanically calms the nervous system and lowers cortisol.'
              : 'Inspirez 5 secondes, expirez 5 secondes pendant 5 minutes pour rééquilibrer le système nerveux autonome.',
          rationalNonMedical: 'Stimulation du nerf vague et réduction du tonus sympathique.',
          actionLabel: language === 'en' ? 'Start Breathing' : 'Démarrer la cohérence',
          actionPayload: { exerciseType: 'cardiac_coherence', durationMinutes: 5 },
          score: 85,
          priority: 1,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // CBD track primary action
      candidates.push({
        id: `rec_action_cbd_tracking_${Date.now()}`,
        userId,
        type: 'CBD_INFORMATION',
        theme: 'evening_routine',
        title: language === 'en' ? 'Observe Your CBD Routine' : 'Suivre votre rituel bien-être CBD',
        suggestion:
          language === 'en'
            ? 'Track your evening sublingual drops and your morning freshness to fine-tune your personal routine.'
            : 'Enregistrez votre prise vespérale et votre fraîcheur au réveil pour ajuster votre rituel de détente.',
        rationalNonMedical: 'Régularité et observation empirique des ressentis qualitatifs.',
        actionLabel: language === 'en' ? 'Log CBD Session' : 'Noter une observation',
        actionPayload: { modal: 'cbd_entry' },
        score: 88,
        priority: 1,
        createdAt: new Date().toISOString(),
      });
    }

    // ========================================================
    // 2. RELEVANT EDUCATIONAL CONTENT (MODULE 6 LINK)
    // ========================================================
    // Pick first uncompleted content matching user's path
    const relevantCategory = isCBD ? 'cbd' : 'reduction_cessation';
    let matchedContent = educationalContents.find(
      (c) => c.category === relevantCategory && !completedIds.has(c.id)
    );
    if (!matchedContent) {
      matchedContent = educationalContents.find(
        (c) => c.category === 'body_brain' && !completedIds.has(c.id)
      ) || educationalContents[0];
    }

    if (matchedContent) {
      const topSource = matchedContent.sourceReferences?.[0];
      let sourceStr = 'Revue scientifique institutionnelle';
      if (typeof topSource === 'string') {
        sourceStr = topSource;
      } else if (topSource && typeof topSource === 'object') {
        const org = (topSource as any).organization || (topSource as any).authors || 'Source scientifique';
        sourceStr = `${org} (${topSource.year || '2023'}), ${topSource.title || ''}`;
      }

      candidates.push({
        id: `rec_edu_${matchedContent.id}_${Date.now()}`,
        userId,
        type: 'EDUCATIONAL_CONTENT',
        theme: matchedContent.category,
        title: matchedContent.title,
        suggestion: matchedContent.summary,
        rationalNonMedical: matchedContent.subtitle || 'Renforcement des connaissances factuelles.',
        actionLabel: language === 'en' ? 'Read Guide' : 'Lire le guide',
        actionPayload: { contentId: matchedContent.id, slug: matchedContent.slug },
        score: 80,
        priority: 2,
        sourceReference: sourceStr,
        createdAt: new Date().toISOString(),
      });
    }

    // ========================================================
    // 3. ALTERNATIVE ACTION (WELLNESS / GOAL / HABIT)
    // ========================================================
    candidates.push({
      id: `rec_alt_sleep_${Date.now()}`,
      userId,
      type: 'WELLNESS_ACTIVITY',
      theme: 'sleep_hygiene',
      title: language === 'en' ? 'Soothing Evening Wind-Down' : 'Rituel Apaisant du Soir',
      suggestion:
        language === 'en'
          ? 'Switch off screens 45 minutes before sleep and hydrate with herbal tea to promote restful rest.'
          : 'Éteignez les écrans 45 minutes avant le coucher et préparez une infusion tiède pour préserver la mélatonine.',
      rationalNonMedical: 'Maintien de l’hygiène circadienne sans écran avant le coucher.',
      actionLabel: language === 'en' ? 'Explore Routine' : 'Voir les conseils sommeil',
      actionPayload: { targetTab: 'education', slug: 'ameliorer-mon-sommeil' },
      score: 72,
      priority: 3,
      createdAt: new Date().toISOString(),
    });

    // Sort by priority ascending (1 = Primary, 2 = Education, 3 = Alternative)
    // Cap to exactly 3 items to avoid cognitive fatigue
    return candidates.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }

  /**
   * Computes objective descriptive observations from Module 5 & 4
   * Non-judgmental and respectful.
   */
  public static getDescriptiveObservation(userId: string): DescriptiveObservation {
    const entries = db.get('consumptionEntries').filter((e) => e.userId === userId);
    const periodDays = 30;

    const totalLogs = entries.length;
    const uniqueDays = new Set(entries.map((e) => e.date)).size;

    // Find dominant context if any
    const contextCounts: Record<string, number> = {};
    let sumMoodBefore = 0;
    let sumMoodAfter = 0;
    let moodCount = 0;

    entries.forEach((e) => {
      if (e.context) {
        contextCounts[e.context] = (contextCounts[e.context] || 0) + 1;
      }
      if (e.moodBefore && e.moodAfter) {
        sumMoodBefore += e.moodBefore;
        sumMoodAfter += e.moodAfter;
        moodCount++;
      }
    });

    let dominantContext: string | undefined = undefined;
    let maxCount = 0;
    Object.entries(contextCounts).forEach(([ctx, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantContext = ctx;
      }
    });

    const averageMoodBefore = moodCount > 0 ? Math.round((sumMoodBefore / moodCount) * 10) / 10 : undefined;
    const averageMoodAfter = moodCount > 0 ? Math.round((sumMoodAfter / moodCount) * 10) / 10 : undefined;

    let observationSummary = '';
    if (totalLogs === 0) {
      observationSummary =
        'Aucune entrée n’a encore été enregistrée dans votre journal sur cette période.';
    } else {
      observationSummary = `Sur les ${periodDays} derniers jours, vous avez enregistré ${totalLogs} entrée(s) réparties sur ${uniqueDays} jour(s).`;
      if (dominantContext) {
        observationSummary += ` Le contexte le plus fréquent mentionné est « ${dominantContext} ».`;
      }
    }

    const invitationToReflect =
      totalLogs > 0
        ? 'Souhaitez-vous que nous observions ensemble les situations et les moments associés à ces journées pour mieux cerner vos habitudes ?'
        : 'Souhaitez-vous consigner une première observation neutre pour initier votre suivi ?';

    return {
      periodDays,
      totalLogs,
      activeDaysCount: uniqueDays,
      dominantContext,
      averageMoodBefore,
      averageMoodAfter,
      observationSummary,
      invitationToReflect,
    };
  }
}
