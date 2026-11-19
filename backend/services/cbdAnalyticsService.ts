import { db } from '../db/database';
import {
  CBDConsumption,
  CBDProduct,
  CBDUserProduct,
  CBDWellnessObservation,
  CBDWellnessGoal,
  CBDProductScan,
} from '../../src/types/entities';

export interface CBDDashboardSummary {
  userId: string;
  hasData: boolean;
  totalConsumptionsCount: number;
  consumptionsThisWeek: number;
  consumptionsLastWeek: number;
  weeklyEvolutionPercentage: number | null; // e.g. -15% or +10%
  consumptionsThisMonth: number;
  consumptionsLastMonth: number;
  monthlyEvolutionPercentage: number | null;
  favoriteConsumptionMethod: string | null;
  mostUsedProduct: {
    name: string;
    category: string;
    count: number;
  } | null;
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
  recentConsumptions: CBDConsumption[];
  favoriteProducts: CBDProduct[];
  userProductsCount: number;
  recentScans: CBDProductScan[];
  wellnessStats: {
    totalObservations: number;
    avgSleepQuality: number | null;
    avgEnergy: number | null;
    avgStressLevel: number | null;
    avgMood: number | null;
    avgRelaxation: number | null;
    physicalActivityDays: number;
    lastObservationDate: string | null;
  };
  activeGoals: CBDWellnessGoal[];
  disclaimer: string;
}

export interface CBDConsumptionStatsResult {
  period: string;
  totalEntries: number;
  timeSeries: {
    date: string;
    label: string;
    count: number;
    totalQuantity: number;
    avgWellness: number | null;
  }[];
  categoryDistribution: {
    category: string;
    label: string;
    count: number;
    percentage: number;
  }[];
  methodDistribution: {
    method: string;
    label: string;
    count: number;
    percentage: number;
  }[];
  contextDistribution: {
    context: string;
    label: string;
    count: number;
    percentage: number;
  }[];
  effectsDistribution: {
    effect: string;
    label: string;
    count: number;
    percentage: number;
  }[];
  wellnessCorrelations: {
    type: string;
    description: string;
    dataPoints: number;
  }[];
  disclaimer: string;
}

export class CBDAnalyticsService {
  /**
   * Returns all CBD consumption entries for a given user
   */
  public static getUserConsumptions(userId: string): CBDConsumption[] {
    const list = db.get('cbdConsumptions') || [];
    return list
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }

  /**
   * Returns all wellness observations for a given user
   */
  public static getUserWellnessObservations(userId: string): CBDWellnessObservation[] {
    const list = db.get('cbdWellnessObservations') || [];
    return list
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Computes the complete CBD Dashboard Summary
   */
  public static getDashboardSummary(userId: string): CBDDashboardSummary {
    const consumptions = this.getUserConsumptions(userId);
    const wellnessList = this.getUserWellnessObservations(userId);
    const goalsList = (db.get('cbdWellnessGoals') || []).filter((g) => g.userId === userId && g.status === 'active');
    const userFavorites = (db.get('cbdUserProducts') || []).filter((up) => up.userId === userId && up.isFavorite);
    const allProducts = db.get('cbdProducts') || [];
    const recentScans = (db.get('cbdProductScans') || [])
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const thisWeekConsumptions = consumptions.filter((c) => new Date(c.dateTime) >= sevenDaysAgo);
    const lastWeekConsumptions = consumptions.filter((c) => {
      const d = new Date(c.dateTime);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const thisMonthConsumptions = consumptions.filter((c) => new Date(c.dateTime) >= thirtyDaysAgo);
    const lastMonthConsumptions = consumptions.filter((c) => {
      const d = new Date(c.dateTime);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    // Weekly evolution
    let weeklyEvolutionPercentage: number | null = null;
    if (lastWeekConsumptions.length > 0) {
      weeklyEvolutionPercentage = Math.round(
        ((thisWeekConsumptions.length - lastWeekConsumptions.length) / lastWeekConsumptions.length) * 100
      );
    }

    // Monthly evolution
    let monthlyEvolutionPercentage: number | null = null;
    if (lastMonthConsumptions.length > 0) {
      monthlyEvolutionPercentage = Math.round(
        ((thisMonthConsumptions.length - lastMonthConsumptions.length) / lastMonthConsumptions.length) * 100
      );
    }

    // Method breakdown & most used
    const methodCounts: Record<string, number> = {};
    const productCounts: Record<string, { name: string; category: string; count: number }> = {};
    const categoryCounts: Record<string, number> = {};

    consumptions.forEach((c) => {
      methodCounts[c.consumptionMethod] = (methodCounts[c.consumptionMethod] || 0) + 1;
      categoryCounts[c.productType] = (categoryCounts[c.productType] || 0) + 1;

      const pKey = c.productId || c.productName;
      if (!productCounts[pKey]) {
        productCounts[pKey] = {
          name: c.productName,
          category: c.productType,
          count: 0,
        };
      }
      productCounts[pKey].count += 1;
    });

    let favoriteConsumptionMethod: string | null = null;
    let maxMethodCount = 0;
    Object.entries(methodCounts).forEach(([method, count]) => {
      if (count > maxMethodCount) {
        maxMethodCount = count;
        favoriteConsumptionMethod = method;
      }
    });

    let mostUsedProduct: { name: string; category: string; count: number } | null = null;
    let maxProdCount = 0;
    Object.values(productCounts).forEach((prod) => {
      if (prod.count > maxProdCount) {
        maxProdCount = prod.count;
        mostUsedProduct = prod;
      }
    });

    const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: consumptions.length > 0 ? Math.round((count / consumptions.length) * 100) : 0,
    }));

    // Favorite products list enriched
    const favoriteProductIds = new Set(userFavorites.map((f) => f.productId));
    const favoriteProducts = allProducts.filter((p) => favoriteProductIds.has(p.id));

    // User products total count
    const userProductsCount = (db.get('cbdUserProducts') || []).filter((up) => up.userId === userId).length;

    // Wellness Averages
    let avgSleepQuality: number | null = null;
    let avgEnergy: number | null = null;
    let avgStressLevel: number | null = null;
    let avgMood: number | null = null;
    let avgRelaxation: number | null = null;
    let physicalActivityDays = 0;

    if (wellnessList.length > 0) {
      const validSleep = wellnessList.filter((w) => typeof w.sleepQuality === 'number');
      if (validSleep.length > 0) {
        avgSleepQuality = Number((validSleep.reduce((acc, curr) => acc + (curr.sleepQuality || 0), 0) / validSleep.length).toFixed(1));
      }

      const validEnergy = wellnessList.filter((w) => typeof w.energy === 'number');
      if (validEnergy.length > 0) {
        avgEnergy = Number((validEnergy.reduce((acc, curr) => acc + (curr.energy || 0), 0) / validEnergy.length).toFixed(1));
      }

      const validStress = wellnessList.filter((w) => typeof w.stressLevel === 'number');
      if (validStress.length > 0) {
        avgStressLevel = Number((validStress.reduce((acc, curr) => acc + (curr.stressLevel || 0), 0) / validStress.length).toFixed(1));
      }

      const validMood = wellnessList.filter((w) => typeof w.mood === 'number');
      if (validMood.length > 0) {
        avgMood = Number((validMood.reduce((acc, curr) => acc + (curr.mood || 0), 0) / validMood.length).toFixed(1));
      }

      const validRelax = wellnessList.filter((w) => typeof w.relaxation === 'number');
      if (validRelax.length > 0) {
        avgRelaxation = Number((validRelax.reduce((acc, curr) => acc + (curr.relaxation || 0), 0) / validRelax.length).toFixed(1));
      }

      physicalActivityDays = wellnessList.filter((w) => w.physicalActivity).length;
    }

    return {
      userId,
      hasData: consumptions.length > 0 || wellnessList.length > 0,
      totalConsumptionsCount: consumptions.length,
      consumptionsThisWeek: thisWeekConsumptions.length,
      consumptionsLastWeek: lastWeekConsumptions.length,
      weeklyEvolutionPercentage,
      consumptionsThisMonth: thisMonthConsumptions.length,
      consumptionsLastMonth: lastMonthConsumptions.length,
      monthlyEvolutionPercentage,
      favoriteConsumptionMethod,
      mostUsedProduct,
      categoryBreakdown,
      recentConsumptions: consumptions.slice(0, 5),
      favoriteProducts,
      userProductsCount,
      recentScans,
      wellnessStats: {
        totalObservations: wellnessList.length,
        avgSleepQuality,
        avgEnergy,
        avgStressLevel,
        avgMood,
        avgRelaxation,
        physicalActivityDays,
        lastObservationDate: wellnessList[0]?.date || null,
      },
      activeGoals: goalsList,
      disclaimer:
        'Espace d’observation personnelle du bien-être. Le CBD n’est pas un médicament et ne remplace aucun diagnostic ni traitement médical.',
    };
  }

  /**
   * Detailed stats and correlations for CBD consumption
   */
  public static getConsumptionStats(
    userId: string,
    period: '7days' | '30days' | '90days' | 'year' | 'all' = '30days'
  ): CBDConsumptionStatsResult {
    const allConsumptions = this.getUserConsumptions(userId);
    const wellnessList = this.getUserWellnessObservations(userId);

    const now = new Date();
    let cutoffDate = new Date(0); // all
    if (period === '7days') cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === '30days') cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    else if (period === '90days') cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (period === 'year') cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const filtered = allConsumptions.filter((c) => new Date(c.dateTime) >= cutoffDate);

    // Build day map for time series
    const daysCount = period === '7days' ? 7 : period === '30days' ? 30 : period === '90days' ? 90 : 30;
    const timeSeriesMap: Record<string, { date: string; label: string; count: number; totalQuantity: number; ratings: number[] }> = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      timeSeriesMap[dateStr] = {
        date: dateStr,
        label,
        count: 0,
        totalQuantity: 0,
        ratings: [],
      };
    }

    filtered.forEach((c) => {
      if (timeSeriesMap[c.date]) {
        timeSeriesMap[c.date].count += 1;
        timeSeriesMap[c.date].totalQuantity += c.quantity || 0;
        if (c.wellnessRating) {
          timeSeriesMap[c.date].ratings.push(c.wellnessRating);
        }
      }
    });

    const timeSeries = Object.values(timeSeriesMap).map((item) => ({
      date: item.date,
      label: item.label,
      count: item.count,
      totalQuantity: Number(item.totalQuantity.toFixed(1)),
      avgWellness:
        item.ratings.length > 0
          ? Number((item.ratings.reduce((a, b) => a + b, 0) / item.ratings.length).toFixed(1))
          : null,
    }));

    // Categories
    const categoryLabels: Record<string, string> = {
      oil: 'Huiles & Gouttes',
      flower: 'Fleurs & Infusions',
      resin: 'Résines',
      capsule: 'Gélules & Capsules',
      edible: 'Aliments & Gummies',
      beverage: 'Boissons',
      vape: 'Vaporisation / E-liquide',
      infusion: 'Tisanes & Infusions',
      cosmetic: 'Cosmétiques & Baumes',
      extract: 'Extraits & Cristaux',
      other: 'Autre format',
    };

    const catCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      catCounts[c.productType] = (catCounts[c.productType] || 0) + 1;
    });

    const categoryDistribution = Object.entries(catCounts).map(([cat, count]) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      count,
      percentage: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
    }));

    // Methods
    const methodLabels: Record<string, string> = {
      sublingual: 'Sous la langue (Sublingual)',
      ingestion: 'Ingestion orale',
      infusion: 'Infusion / Tisane chaude',
      vaporisation: 'Vaporisation douce',
      inhalation: 'Inhalation',
      topical: 'Application locale / Cutanée',
      other: 'Autre méthode',
    };

    const methCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      methCounts[c.consumptionMethod] = (methCounts[c.consumptionMethod] || 0) + 1;
    });

    const methodDistribution = Object.entries(methCounts).map(([meth, count]) => ({
      method: meth,
      label: methodLabels[meth] || meth,
      count,
      percentage: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
    }));

    // Contexts
    const contextLabels: Record<string, string> = {
      morning: 'Matin au réveil',
      noon: 'Midi / Pause déjeuner',
      afternoon: 'Après-midi',
      evening: 'Soirée détente',
      before_sleep: 'Avant le coucher / Sommeil',
      after_sport: 'Après le sport / Récupération',
      relaxation: 'Moment de pause / Méditation',
      social: 'Contexte social',
      other: 'Autre moment',
    };

    const ctxCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      const ctx = c.context || 'other';
      ctxCounts[ctx] = (ctxCounts[ctx] || 0) + 1;
    });

    const contextDistribution = Object.entries(ctxCounts).map(([ctx, count]) => ({
      context: ctx,
      label: contextLabels[ctx] || ctx,
      count,
      percentage: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
    }));

    // Subjective Effects
    const effCounts: Record<string, number> = {};
    filtered.forEach((c) => {
      if (Array.isArray(c.subjectiveEffects)) {
        c.subjectiveEffects.forEach((eff) => {
          effCounts[eff] = (effCounts[eff] || 0) + 1;
        });
      }
    });

    const effectsDistribution = Object.entries(effCounts).map(([eff, count]) => ({
      effect: eff,
      label: eff,
      count,
      percentage: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
    }));

    // Non-medical correlations
    const correlations: { type: string; description: string; dataPoints: number }[] = [];

    // Check evening vs sleep
    const eveningEntries = filtered.filter((c) => c.context === 'before_sleep' || c.context === 'evening');
    if (eveningEntries.length >= 3) {
      correlations.push({
        type: 'routine',
        description: `Vous avez enregistré ${eveningEntries.length} prises en soirée ou avant le coucher, principalement avec le mode ${favoriteMethodLabel(eveningEntries)}.`,
        dataPoints: eveningEntries.length,
      });
    }

    if (wellnessList.length >= 3) {
      const activeDays = wellnessList.filter((w) => w.physicalActivity).length;
      if (activeDays > 0) {
        correlations.push({
          type: 'activity',
          description: `Activité physique renseignée sur ${activeDays} jour(s) d’observation. L'activité régulière soutient l’équilibre global.`,
          dataPoints: activeDays,
        });
      }
    }

    return {
      period,
      totalEntries: filtered.length,
      timeSeries,
      categoryDistribution,
      methodDistribution,
      contextDistribution,
      effectsDistribution,
      wellnessCorrelations: correlations,
      disclaimer:
        'Ces observations sont purement descriptives et basées sur vos déclarations personnelles. Elles ne constituent en aucun cas une démonstration d’efficacité clinique.',
    };
  }
}

function favoriteMethodLabel(entries: CBDConsumption[]): string {
  const map: Record<string, number> = {};
  entries.forEach((e) => {
    map[e.consumptionMethod] = (map[e.consumptionMethod] || 0) + 1;
  });
  let max = 0;
  let top = 'adapté';
  Object.entries(map).forEach(([k, v]) => {
    if (v > max) {
      max = v;
      top = k;
    }
  });
  return top;
}
