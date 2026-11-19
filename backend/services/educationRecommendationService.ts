import { db } from '../db/database';
import {
  EducationRecommendation,
  UserProfile,
  ProfileType,
  THCProfile,
  EducationalContent,
  EducationalPath,
} from '../../src/types/entities';

export class EducationRecommendationService {
  /**
   * Generates tailored educational recommendations for a user
   */
  public static getRecommendationsForUser(userId: string): EducationRecommendation[] {
    const recommendations: EducationRecommendation[] = [];

    const userProfiles = db.get('userProfiles');
    const profile = userProfiles.find((p) => p.userId === userId);

    const thcProfiles = db.get('thcProfiles');
    const thcProfile = thcProfiles.find((p) => p.userId === userId);

    const progressList = db.get('educationalProgress').filter((p) => p.userId === userId);
    const completedIds = new Set(
      progressList.filter((p) => p.status === 'completed').map((p) => p.targetId)
    );

    const paths = db.get('educationalPaths');
    const contents = db.get('educationalContents');

    // 1. RECOMMENDATION BASED ON PROFILE TYPE & GOALS
    if (profile?.profileType === ProfileType.CBD) {
      if (!completedIds.has('path_cbd_mastery')) {
        recommendations.push({
          id: 'rec_cbd_path',
          type: 'path',
          targetId: 'path_cbd_mastery',
          title: 'Parcours : Mieux comprendre le CBD',
          reason: 'Idéal pour démystifier les produits, choisir les bons dosages et comprendre les certificats de qualité.',
          priority: 10,
          category: 'cbd',
        });
      }

      if (!completedIds.has('guide_read_cbd_label')) {
        recommendations.push({
          id: 'rec_cbd_label',
          type: 'content',
          targetId: 'guide_read_cbd_label',
          title: 'Guide : Décrypter une étiquette CBD',
          reason: 'Apprenez à repérer la concentration réelle et la pureté des huiles.',
          priority: 8,
          category: 'cbd',
        });
      }
    } else {
      // THC, FORMER_THC or COMBINED
      const isCessation =
        thcProfile?.primaryGoal === 'quit_gradual' ||
        thcProfile?.primaryGoal === 'quit_complete';
      const isReduction = thcProfile?.primaryGoal === 'reduce';

      if (isCessation) {
        if (!completedIds.has('path_cessation_prep')) {
          recommendations.push({
            id: 'rec_cessation_path',
            type: 'path',
            targetId: 'path_cessation_prep',
            title: 'Parcours : Préparer un arrêt',
            reason: 'Vous avez choisi d’arrêter : découvrez le kit pratique pour aborder sereinement les premiers jours.',
            priority: 10,
            category: 'reduction_cessation',
          });
        }
        if (!completedIds.has('ex_4d_technique')) {
          recommendations.push({
            id: 'rec_4d_ex',
            type: 'exercise',
            targetId: 'ex_4d_technique',
            title: 'Exercice pratique : La méthode des 4 D',
            reason: 'Un outil simple de 10 minutes pour laisser retomber une envie soudaine sans stress.',
            priority: 9,
            category: 'reduction_cessation',
          });
        }
      } else if (isReduction) {
        if (!completedIds.has('path_gradual_reduction')) {
          recommendations.push({
            id: 'rec_reduction_path',
            type: 'path',
            targetId: 'path_gradual_reduction',
            title: 'Parcours : Réduire progressivement',
            reason: 'Une approche pas à pas pour espacer les prises et reprendre le contrôle sans pression.',
            priority: 10,
            category: 'reduction_cessation',
          });
        }
        if (!completedIds.has('ex_triggers_mapping')) {
          recommendations.push({
            id: 'rec_triggers_ex',
            type: 'exercise',
            targetId: 'ex_triggers_mapping',
            title: 'Exercice : Identifier mes 3 déclencheurs',
            reason: 'Repérer vos moments de vulnérabilité est la première étape pour réussir une réduction durable.',
            priority: 9,
            category: 'habits_behavior',
          });
        }
      } else {
        // Awareness or General
        if (!completedIds.has('path_understand_consumption')) {
          recommendations.push({
            id: 'rec_understand_path',
            type: 'path',
            targetId: 'path_understand_consumption',
            title: 'Parcours : Mieux comprendre ma consommation',
            reason: 'Auto-observation bienveillante pour explorer vos habitudes et automatismes.',
            priority: 10,
            category: 'habits_behavior',
          });
        }
      }
    }

    // 2. UNIVERSAL WELLNESS RECOMMENDATIONS (Sleep & Daily Freedom)
    if (!completedIds.has('art_sleep_architecture')) {
      recommendations.push({
        id: 'rec_sleep_art',
        type: 'content',
        targetId: 'art_sleep_architecture',
        title: 'Le Sommeil : Comprendre les cycles et l’impact des substances',
        reason: 'Découvrez pourquoi le sommeil naturel est le premier réparateur de votre énergie mentale.',
        priority: 7,
        category: 'wellness',
      });
    }

    if (!completedIds.has('path_substance_free_life')) {
      recommendations.push({
        id: 'rec_freedom_path',
        type: 'path',
        targetId: 'path_substance_free_life',
        title: 'Parcours : Retrouver un quotidien sans dépendance',
        reason: 'Redécouvrez des plaisirs naturels, des loisirs captivants et une vie sociale épanouissante.',
        priority: 6,
        category: 'wellness',
      });
    }

    // Micro-lesson recommendation for quick read
    if (!completedIds.has('ml_habit_loop')) {
      recommendations.push({
        id: 'rec_micro_habit',
        type: 'micro_lesson',
        targetId: 'ml_habit_loop',
        title: 'Micro-leçon (3 min) : Pourquoi une habitude devient automatique',
        reason: 'Un format court pour comprendre en un éclair le fonctionnement de la routine.',
        priority: 8,
        category: 'habits_behavior',
      });
    }

    // Sort by priority descending
    return recommendations.sort((a, b) => b.priority - a.priority);
  }
}
