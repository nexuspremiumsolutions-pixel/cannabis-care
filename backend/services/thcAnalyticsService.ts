import { db } from '../db/database';
import {
  ConsumptionEntry,
  THCCraving,
  THCReductionPlan,
  THCDailyGoal,
  WellnessChallenge,
  Badge,
  Notification,
} from '../../src/types/entities';

export interface StreaksResult {
  currentStreak: number;
  bestStreak: number;
  totalTHCFreeDays: number;
  lastConsumptionDate: string | null;
  daysActive: number;
}

export interface HabitInsight {
  type: 'time' | 'context' | 'trigger' | 'frequency' | 'progress';
  message: string;
  confidence: 'preliminary' | 'established';
}

export interface PrudenceAlert {
  id: string;
  level: 'info' | 'caution';
  title: string;
  message: string;
  helpline: string;
  helplinePhone: string;
}

export interface PeriodStats {
  periodLabel: string;
  hasSufficientData: boolean;
  consumptionCount: number;
  totalQuantity: number;
  avgQuantityPerDay: number;
  thcFreeDays: number;
  cravingsCount: number;
  avgCravingIntensity: number;
  slipsCount: number;
  messageIfNotEnough?: string;
}

export interface TemporalComparison {
  thisWeek: PeriodStats;
  lastWeek: PeriodStats;
  thisMonth: PeriodStats;
  lastMonth: PeriodStats;
  last90Days: PeriodStats;
  sinceStart: PeriodStats;
  evolutionPercentageWeekly: number | null; // e.g. -25%
  evolutionPercentageMonthly: number | null;
}

export interface DayCalendarItem {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  status: 'no_data' | 'consumption_recorded' | 'thc_free_day' | 'goal_achieved' | 'goal_exceeded' | 'slip_recorded';
  entriesCount: number;
  totalQuantity: number;
  unit: string;
  cravingsCount: number;
  isSlip: boolean;
  hasChallengeCompleted: boolean;
  entries: ConsumptionEntry[];
  cravings: THCCraving[];
}

export class THCAnalyticsService {
  /**
   * Filter consumption entries strictly related to THC
   */
  private static getTHCEntries(userId: string): ConsumptionEntry[] {
    return db.get('consumptionEntries').filter(
      (e) => e.userId === userId && (!e.productType || e.productType.startsWith('THC') || e.productType === 'other')
    );
  }

  /**
   * Calculate Real Streaks & Free Days
   */
  public static calculateStreaks(userId: string): StreaksResult {
    const user = db.get('users').find((u) => u.id === userId);
    const profile = db.get('userProfiles').find((p) => p.userId === userId);
    const entries = this.getTHCEntries(userId);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Determine account creation date / first log date
    const startDateStr = (user?.createdAt || profile?.createdAt || todayStr).split('T')[0];
    const startDate = new Date(startDateStr);

    // Days active
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const daysActive = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // Group entries by date
    const consumptionDaysSet = new Set<string>();
    entries.forEach((e) => {
      if (e.quantity > 0 || e.isSlip) {
        consumptionDaysSet.add(e.date);
      }
    });

    // Sort consumption dates ascending
    const sortedConsumptionDates = Array.from(consumptionDaysSet).sort();
    const lastConsumptionDate = sortedConsumptionDates.length > 0 ? sortedConsumptionDates[sortedConsumptionDates.length - 1] : null;

    // Calculate current streak: count backward from today (or yesterday if today not logged yet)
    let currentStreak = 0;
    const checkDate = new Date();
    
    // Check up to 365 days back
    for (let i = 0; i < 365; i++) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (dStr < startDateStr && i > 0) {
        break; // Reached before account creation
      }

      if (consumptionDaysSet.has(dStr)) {
        // Broke streak
        break;
      } else {
        currentStreak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate best streak across all history
    let bestStreak = 0;
    let tempStreak = 0;
    const iteratorDate = new Date(startDateStr);
    const todayDate = new Date(todayStr);

    while (iteratorDate <= todayDate) {
      const dStr = iteratorDate.toISOString().split('T')[0];
      if (consumptionDaysSet.has(dStr)) {
        tempStreak = 0;
      } else {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      }
      iteratorDate.setDate(iteratorDate.getDate() + 1);
    }

    // Best streak is at least current streak
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }

    // Calculate total THC free days
    let totalTHCFreeDays = 0;
    const countDate = new Date(startDateStr);
    while (countDate <= todayDate) {
      const dStr = countDate.toISOString().split('T')[0];
      if (!consumptionDaysSet.has(dStr)) {
        totalTHCFreeDays++;
      }
      countDate.setDate(countDate.getDate() + 1);
    }

    return {
      currentStreak,
      bestStreak,
      totalTHCFreeDays,
      lastConsumptionDate,
      daysActive,
    };
  }

  /**
   * Generate Period Statistics
   */
  private static calculatePeriodStats(
    userId: string,
    label: string,
    startDateStr: string,
    endDateStr: string,
    minDaysRequired: number = 3
  ): PeriodStats {
    const entries = this.getTHCEntries(userId).filter(
      (e) => e.date >= startDateStr && e.date <= endDateStr
    );
    const cravings = db.get('thcCravings').filter(
      (c) => c.userId === userId && c.date >= startDateStr && c.date <= endDateStr
    );

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const hasAnyData = entries.length > 0 || cravings.length > 0;
    const hasSufficientData = hasAnyData && diffDays >= minDaysRequired;

    if (!hasSufficientData) {
      return {
        periodLabel: label,
        hasSufficientData: false,
        consumptionCount: entries.length,
        totalQuantity: 0,
        avgQuantityPerDay: 0,
        thcFreeDays: diffDays,
        cravingsCount: cravings.length,
        avgCravingIntensity: 0,
        slipsCount: 0,
        messageIfNotEnough: 'Pas encore assez de données pour établir cette comparaison.',
      };
    }

    let totalQty = 0;
    let slipsCount = 0;
    const consumptionDays = new Set<string>();

    entries.forEach((e) => {
      totalQty += Number(e.quantity) || 0;
      if (e.isSlip) slipsCount++;
      if (e.quantity > 0) consumptionDays.add(e.date);
    });

    let totalCravingIntensity = 0;
    cravings.forEach((c) => {
      totalCravingIntensity += c.intensity;
    });

    const avgCravingIntensity =
      cravings.length > 0 ? Number((totalCravingIntensity / cravings.length).toFixed(1)) : 0;

    const thcFreeDays = Math.max(0, diffDays - consumptionDays.size);
    const avgQuantityPerDay = Number((totalQty / diffDays).toFixed(2));

    return {
      periodLabel: label,
      hasSufficientData: true,
      consumptionCount: entries.length,
      totalQuantity: Number(totalQty.toFixed(2)),
      avgQuantityPerDay,
      thcFreeDays,
      cravingsCount: cravings.length,
      avgCravingIntensity,
      slipsCount,
    };
  }

  /**
   * Temporal Comparisons (Weekly, Monthly, 90d, All time)
   */
  public static getTemporalComparison(userId: string): TemporalComparison {
    const now = new Date();

    // This week (last 7 days)
    const thisWeekEnd = new Date(now);
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - 6);

    // Last week (prior 7 days)
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);

    // This month (last 30 days)
    const thisMonthEnd = new Date(now);
    const thisMonthStart = new Date(now);
    thisMonthStart.setDate(thisMonthStart.getDate() - 29);

    // Last month (prior 30 days)
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
    const lastMonthStart = new Date(lastMonthEnd);
    lastMonthStart.setDate(lastMonthStart.getDate() - 29);

    // Last 90 days
    const last90End = new Date(now);
    const last90Start = new Date(now);
    last90Start.setDate(last90Start.getDate() - 89);

    // Since start
    const user = db.get('users').find((u) => u.id === userId);
    const startStr = user?.createdAt ? user.createdAt.split('T')[0] : '2026-01-01';

    const thisWeek = this.calculatePeriodStats(
      userId,
      'Cette semaine (7j)',
      thisWeekStart.toISOString().split('T')[0],
      thisWeekEnd.toISOString().split('T')[0],
      2
    );

    const lastWeek = this.calculatePeriodStats(
      userId,
      'Semaine précédente',
      lastWeekStart.toISOString().split('T')[0],
      lastWeekEnd.toISOString().split('T')[0],
      5
    );

    const thisMonth = this.calculatePeriodStats(
      userId,
      'Ce mois (30j)',
      thisMonthStart.toISOString().split('T')[0],
      thisMonthEnd.toISOString().split('T')[0],
      7
    );

    const lastMonth = this.calculatePeriodStats(
      userId,
      'Mois précédent',
      lastMonthStart.toISOString().split('T')[0],
      lastMonthEnd.toISOString().split('T')[0],
      14
    );

    const last90Days = this.calculatePeriodStats(
      userId,
      '90 derniers jours',
      last90Start.toISOString().split('T')[0],
      last90End.toISOString().split('T')[0],
      21
    );

    const sinceStart = this.calculatePeriodStats(
      userId,
      'Depuis le début',
      startStr,
      now.toISOString().split('T')[0],
      1
    );

    // Evolution calculations
    let evolutionPercentageWeekly: number | null = null;
    if (thisWeek.hasSufficientData && lastWeek.hasSufficientData && lastWeek.totalQuantity > 0) {
      const diff = ((thisWeek.totalQuantity - lastWeek.totalQuantity) / lastWeek.totalQuantity) * 100;
      evolutionPercentageWeekly = Number(diff.toFixed(1));
    }

    let evolutionPercentageMonthly: number | null = null;
    if (thisMonth.hasSufficientData && lastMonth.hasSufficientData && lastMonth.totalQuantity > 0) {
      const diff = ((thisMonth.totalQuantity - lastMonth.totalQuantity) / lastMonth.totalQuantity) * 100;
      evolutionPercentageMonthly = Number(diff.toFixed(1));
    }

    return {
      thisWeek,
      lastWeek,
      thisMonth,
      lastMonth,
      last90Days,
      sinceStart,
      evolutionPercentageWeekly,
      evolutionPercentageMonthly,
    };
  }

  /**
   * Behavioral Analysis & Prudent Observations
   */
  public static analyzeTriggersAndHabits(userId: string): HabitInsight[] {
    const entries = this.getTHCEntries(userId);
    const cravings = db.get('thcCravings').filter((c) => c.userId === userId);
    const insights: HabitInsight[] = [];

    if (entries.length < 2 && cravings.length < 2) {
      return [
        {
          type: 'progress',
          message: 'Vos premières observations personnalisées apparaîtront ici au fil de vos enregistrements réguliers.',
          confidence: 'preliminary',
        },
      ];
    }

    // 1. Time breakdown
    let eveningCount = 0;
    let afternoonCount = 0;
    let morningCount = 0;
    let nightCount = 0;

    entries.forEach((e) => {
      const hour = parseInt(e.time?.split(':')[0] || '20', 10);
      if (hour >= 6 && hour < 12) morningCount++;
      else if (hour >= 12 && hour < 18) afternoonCount++;
      else if (hour >= 18 && hour < 23) eveningCount++;
      else nightCount++;
    });

    const totalLogs = entries.length;
    if (totalLogs >= 3) {
      if (eveningCount / totalLogs >= 0.5) {
        const pct = Math.round((eveningCount / totalLogs) * 100);
        insights.push({
          type: 'time',
          message: `Selon vos données déclarées, vos prises sont principalement enregistrées en soirée (${pct} % des entrées).`,
          confidence: totalLogs >= 6 ? 'established' : 'preliminary',
        });
      } else if (afternoonCount / totalLogs >= 0.4) {
        const pct = Math.round((afternoonCount / totalLogs) * 100);
        insights.push({
          type: 'time',
          message: `Vos enregistrements indiquent une concentration notable durant l'après-midi (${pct} % des entrées).`,
          confidence: 'preliminary',
        });
      }
    }

    // 2. Context breakdown
    const contextMap: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.context) {
        contextMap[e.context] = (contextMap[e.context] || 0) + 1;
      }
    });

    const topContext = Object.entries(contextMap).sort((a, b) => b[1] - a[1])[0];
    if (topContext && topContext[1] >= 2) {
      insights.push({
        type: 'context',
        message: `Le contexte le plus souvent renseigné dans vos journaux est « ${topContext[0]} ».`,
        confidence: topContext[1] >= 4 ? 'established' : 'preliminary',
      });
    }

    // 3. Trigger breakdown
    const triggerMap: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.trigger) {
        triggerMap[e.trigger] = (triggerMap[e.trigger] || 0) + 1;
      }
    });
    cravings.forEach((c) => {
      if (c.trigger) {
        triggerMap[c.trigger] = (triggerMap[c.trigger] || 0) + 1;
      }
    });

    const topTrigger = Object.entries(triggerMap).sort((a, b) => b[1] - a[1])[0];
    if (topTrigger && topTrigger[1] >= 2) {
      insights.push({
        type: 'trigger',
        message: `Le déclencheur le plus fréquemment associé à vos envies ou prises semble être « ${topTrigger[0]} ».`,
        confidence: topTrigger[1] >= 4 ? 'established' : 'preliminary',
      });
    }

    // 4. Craving resolution rate
    if (cravings.length >= 2) {
      const passedCount = cravings.filter((c) => c.outcome === 'craving_passed' || !c.consumedAfter).length;
      const successPct = Math.round((passedCount / cravings.length) * 100);
      insights.push({
        type: 'progress',
        message: `Vous avez traversé avec succès ${successPct} % des envies enregistrées sans consommer ensuite.`,
        confidence: 'established',
      });
    }

    return insights;
  }

  /**
   * Safety / Prudence Alerts (Non-medical, compassionate referral)
   */
  public static detectPrudenceAlerts(userId: string): PrudenceAlert[] {
    const alerts: PrudenceAlert[] = [];
    const entries = this.getTHCEntries(userId);
    const cravings = db.get('thcCravings').filter((c) => c.userId === userId);

    // Recent 7 days entries
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSevenStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentEntries = entries.filter((e) => e.date >= recentSevenStr);
    const recentSlips = recentEntries.filter((e) => e.isSlip);
    const highIntensityCravings = cravings.filter((c) => c.date >= recentSevenStr && c.intensity >= 8);

    if (recentSlips.length >= 3) {
      alerts.push({
        id: 'alert_repeated_slips',
        level: 'caution',
        title: 'Accompagnement bienveillant',
        message:
          'Certaines de vos réponses indiquent des difficultés répétées avec votre rythme de réduction. Si cela devient pesant ou inconfortable, n’hésitez pas à échanger avec un professionnel de santé.',
        helpline: 'Drogues Info Service (anonyme et gratuit 7j/7)',
        helplinePhone: '0 800 23 13 13',
      });
    } else if (highIntensityCravings.length >= 3) {
      alerts.push({
        id: 'alert_high_cravings',
        level: 'info',
        title: 'Période d’envies intenses observée',
        message:
          'Vous avez renseigné plusieurs envies d’intensité forte ces derniers jours. Rappelez-vous que ces vagues émotionnelles sont courantes lors des phases de changement et tendent à diminuer en intensité avec le temps.',
        helpline: 'Drogues Info Service',
        helplinePhone: '0 800 23 13 13',
      });
    }

    return alerts;
  }

  /**
   * Monthly Calendar Data
   */
  public static getMonthlyCalendar(userId: string, year: number, month: number): DayCalendarItem[] {
    const entries = this.getTHCEntries(userId);
    const cravings = db.get('thcCravings').filter((c) => c.userId === userId);
    const challenges = db.get('wellnessChallenges').filter((c) => c.userId === userId && c.status === 'completed');
    const plans = db.get('thcReductionPlans').filter((p) => p.userId === userId && p.status === 'active');
    const activePlan = plans[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar: DayCalendarItem[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const dayEntries = entries.filter((e) => e.date === dateStr);
      const dayCravings = cravings.filter((c) => c.date === dateStr);
      const dayChallenges = challenges.filter((c) => c.date === dateStr);

      let totalQuantity = 0;
      let unit = 'joints';
      let hasSlip = false;

      dayEntries.forEach((e) => {
        totalQuantity += Number(e.quantity) || 0;
        if (e.unit) unit = e.unit;
        if (e.isSlip) hasSlip = true;
      });

      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      let status: DayCalendarItem['status'] = 'no_data';

      if (!isFuture) {
        if (hasSlip) {
          status = 'slip_recorded';
        } else if (dayEntries.length > 0) {
          if (activePlan && activePlan.targetQuantity !== undefined && totalQuantity <= activePlan.targetQuantity) {
            status = 'goal_achieved';
          } else if (activePlan && activePlan.targetQuantity !== undefined && totalQuantity > activePlan.targetQuantity) {
            status = 'goal_exceeded';
          } else {
            status = 'consumption_recorded';
          }
        } else if (dateStr <= todayStr) {
          // If past day with no consumption
          status = 'thc_free_day';
        }
      }

      calendar.push({
        date: dateStr,
        dayNumber: day,
        isToday,
        isFuture,
        status,
        entriesCount: dayEntries.length,
        totalQuantity: Number(totalQuantity.toFixed(2)),
        unit,
        cravingsCount: dayCravings.length,
        isSlip: hasSlip,
        hasChallengeCompleted: dayChallenges.length > 0,
        entries: dayEntries,
        cravings: dayCravings,
      });
    }

    return calendar;
  }

  /**
   * Check & Award Badges automatically
   */
  public static awardBadges(userId: string): Badge[] {
    const streaks = this.calculateStreaks(userId);
    const entries = this.getTHCEntries(userId);
    const cravings = db.get('thcCravings').filter((c) => c.userId === userId);
    const slips = entries.filter((e) => e.isSlip && e.slipReflection);
    const challenges = db.get('wellnessChallenges').filter((c) => c.userId === userId && c.status === 'completed');
    const plans = db.get('thcReductionPlans').filter((p) => p.userId === userId);

    const allBadges = db.get('badges');
    const userBadges = allBadges.filter((b) => b.userId === userId);
    const newlyAwarded: Badge[] = [];
    const now = new Date().toISOString();

    const checkAndAward = (code: string, title: string, description: string, iconName: string) => {
      const alreadyHas = userBadges.some((b) => b.code === code);
      if (!alreadyHas) {
        const newBadge: Badge = {
          id: 'badge_' + code.toLowerCase() + '_' + userId.substring(0, 5) + '_' + Date.now(),
          userId,
          code,
          title,
          description,
          iconName,
          category: 'THC',
          earnedAt: now,
          unlockedAt: now,
        };
        allBadges.push(newBadge);
        newlyAwarded.push(newBadge);

        // Notification
        db.get('notifications').push({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userId,
          title: `Nouveau Badge Débloqué : ${title} !`,
          message: description,
          type: 'milestone',
          isRead: false,
          createdAt: now,
        });

        db.logAudit('BADGE_UNLOCKED', 'badges', userId, { code, title });
      }
    };

    // First log
    if (entries.length >= 1) {
      checkAndAward('FIRST_LOG', 'Journaliste Débutant', 'Première entrée enregistrée dans votre journal de bord.', 'BookOpen');
    }

    // 10 logs
    if (entries.length >= 10) {
      checkAndAward('10_LOGS_COMPLETED', 'Régularité Exemplaire', '10 entrées enregistrées dans votre parcours.', 'Layers');
    }

    // First THC Free Day
    if (streaks.totalTHCFreeDays >= 1) {
      checkAndAward('FIRST_THC_FREE_DAY', 'Première Journée Sans THC', 'Une journée complète sans consommation enregistrée.', 'Flame');
    }

    // 3 days
    if (streaks.bestStreak >= 3 || streaks.currentStreak >= 3) {
      checkAndAward('3_DAYS_SOBER', 'Cap des 72 Heures', '3 jours consécutifs de réduction ou sans substance.', 'Sparkles');
    }

    // 7 days
    if (streaks.bestStreak >= 7 || streaks.currentStreak >= 7) {
      checkAndAward('7_DAYS_SOBER', 'Semaine de Clarté', '7 jours consécutifs d’autonomie enregistrés.', 'Award');
    }

    // 14 days
    if (streaks.bestStreak >= 14 || streaks.currentStreak >= 14) {
      checkAndAward('14_DAYS_SOBER', '14 Jours d’Autonomie', 'Deux semaines complètes de maîtrise de vos habitudes.', 'Target');
    }

    // 30 days
    if (streaks.bestStreak >= 30 || streaks.currentStreak >= 30) {
      checkAndAward('30_DAYS_SOBER', 'Cap des 30 Jours', 'Un mois complet sans THC ou d’objectifs atteints.', 'Crown');
    }

    // Craving surfer
    const passedCraving = cravings.some((c) => c.outcome === 'craving_passed' || !c.consumedAfter);
    if (passedCraving) {
      checkAndAward('CRAVING_SURFER', 'Surfeur d’Envies', 'Une envie intense traversée avec succès grâce à un outil d’urgence.', 'Waves');
    }

    // Slip resilience
    if (slips.length >= 1) {
      checkAndAward('FIRST_SLIP_RESILIENCE', 'Résilience Bienveillante', 'Reprise immédiate de votre parcours après un écart avec réflexion constructive.', 'RefreshCw');
    }

    // Challenge champion
    if (challenges.length >= 1) {
      checkAndAward('CHALLENGE_CHAMPION', 'Explorateur du Quotidien', 'Premier micro-défi bien-être validé.', 'CheckCircle');
    }

    // Plan builder
    if (plans.length >= 1) {
      checkAndAward('FIRST_PLAN_CREATED', 'Stratège Engagé', 'Plan personnalisé de réduction configuré avec succès.', 'Compass');
    }

    if (newlyAwarded.length > 0) {
      db.save();
    }

    return newlyAwarded;
  }
}
