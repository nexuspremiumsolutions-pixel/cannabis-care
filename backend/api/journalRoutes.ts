import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../auth/auth';
import {
  ConsumptionEntry,
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
  UnifiedJournalEntry,
} from '../../src/types/entities';

const router = Router();

// Helper: Calculate duration between two HH:mm strings (handles overnight)
function calculateSleepDurationMinutes(bedTime: string, wakeTime: string): number {
  if (!bedTime || !wakeTime) return 0;
  const [bH, bM] = bedTime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) return 0;

  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;

  if (wakeMinutes < bedMinutes) {
    wakeMinutes += 24 * 60; // Next day
  }
  return wakeMinutes - bedMinutes;
}

// Helper: Format minutes into "X h YY"
export function formatMinutesHuman(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, '0')}`;
}

// -------------------------------------------------------------
// 1. UNIFIED JOURNAL FEED & TIMELINE (Aggregating all modules)
// -------------------------------------------------------------
const getTimelineHandler = (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, type, period, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(String(limit), 10) || 50));

    // Determine date filter boundaries
    let effectiveStartDate = startDate ? String(startDate) : '';
    let effectiveEndDate = endDate ? String(endDate) : '';

    const todayStr = new Date().toISOString().split('T')[0];

    if (period === 'today') {
      effectiveStartDate = todayStr;
      effectiveEndDate = todayStr;
    } else if (period === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      effectiveStartDate = yStr;
      effectiveEndDate = yStr;
    } else if (period === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      effectiveStartDate = d.toISOString().split('T')[0];
      effectiveEndDate = todayStr;
    } else if (period === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      effectiveStartDate = d.toISOString().split('T')[0];
      effectiveEndDate = todayStr;
    }

    const unifiedEntries: UnifiedJournalEntry[] = [];

    // 1. THC Consumptions
    const thcEntries = db.get('consumptionEntries').filter((e) => e.userId === userId);
    thcEntries.forEach((e) => {
      unifiedEntries.push({
        id: `feed_thc_${e.id}`,
        userId,
        entryType: 'THC_CONSUMPTION',
        sourceType: 'consumptionEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '12:00'}:00.000Z`,
        date: e.date,
        time: e.time || '12:00',
        title: `Consommation THC • ${e.productName || 'Fleur/Résine'}`,
        summary: `${e.quantity} ${e.unit} • ${e.consumptionMode || 'Inhalation'} • Contexte: ${e.context || 'Non spécifié'}`,
        tags: [e.productType, e.consumptionMode, ...(e.trigger ? [e.trigger] : [])],
        metadata: {
          quantity: e.quantity,
          unit: e.unit,
          productType: e.productType,
          productName: e.productName,
          moodBefore: e.moodBefore,
          moodAfter: e.moodAfter,
          isSlip: e.isSlip,
          costEstimated: e.costEstimated,
          notes: e.personalNotes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 2. CBD Consumptions
    const cbdEntries = db.get('cbdConsumptions').filter((e) => e.userId === userId);
    cbdEntries.forEach((e) => {
      unifiedEntries.push({
        id: `feed_cbd_${e.id}`,
        userId,
        entryType: 'CBD_CONSUMPTION',
        sourceType: 'cbdConsumptions',
        sourceId: e.id,
        dateTime: e.dateTime || `${e.date}T${e.time || '12:00'}:00.000Z`,
        date: e.date,
        time: e.time || '12:00',
        title: `Prise CBD • ${e.productName || 'Produit CBD'}`,
        summary: `${e.quantity} ${e.quantityUnit} • Voie: ${e.consumptionMethod} • Effets: ${(e.subjectiveEffects || []).join(', ') || 'Détente observée'}`,
        tags: ['CBD', e.productType, e.consumptionMethod, ...(e.subjectiveEffects || [])],
        metadata: {
          productName: e.productName,
          brand: e.brand,
          productType: e.productType,
          quantity: e.quantity,
          quantityUnit: e.quantityUnit,
          consumptionMethod: e.consumptionMethod,
          subjectiveEffects: e.subjectiveEffects,
          wellnessRating: e.wellnessRating,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 3. Sleep Entries
    const sleepList = db.get('sleepEntries').filter((e) => e.userId === userId);
    sleepList.forEach((e) => {
      const durationH = formatMinutesHuman(e.durationMinutes);
      unifiedEntries.push({
        id: `feed_sleep_${e.id}`,
        userId,
        entryType: 'SLEEP',
        sourceType: 'sleepEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.wakeTime || '08:00'}:00.000Z`,
        date: e.date,
        time: e.wakeTime || '08:00',
        title: `Sommeil • ${durationH} de repos`,
        summary: `Coucher: ${e.bedTime} → Réveil: ${e.wakeTime} • Qualité: ${e.sleepQuality}/5 • Réveils nocturnes: ${e.nightAwakenings}`,
        tags: ['sommeil', `qualite_${e.sleepQuality}`],
        metadata: {
          bedTime: e.bedTime,
          wakeTime: e.wakeTime,
          durationMinutes: e.durationMinutes,
          sleepQuality: e.sleepQuality,
          nightAwakenings: e.nightAwakenings,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 4. Mood Entries
    const moodList = db.get('moodEntries').filter((e) => e.userId === userId);
    moodList.forEach((e) => {
      const moodEmojis = ['', '😞 Difficile', '🙁 Mitigé', '😐 Neutre', '🙂 Agréable', '😄 Excellent'];
      unifiedEntries.push({
        id: `feed_mood_${e.id}`,
        userId,
        entryType: 'MOOD',
        sourceType: 'moodEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '12:00'}:00.000Z`,
        date: e.date,
        time: e.time || '12:00',
        title: `Humeur • ${e.primaryMood || moodEmojis[e.rating] || `${e.rating}/5`}`,
        summary: `Ressenti noté ${e.rating}/5${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['humeur', e.primaryMood || `niveau_${e.rating}`],
        metadata: {
          rating: e.rating,
          primaryMood: e.primaryMood,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 5. Stress Entries
    const stressList = db.get('stressEntries').filter((e) => e.userId === userId);
    stressList.forEach((e) => {
      unifiedEntries.push({
        id: `feed_stress_${e.id}`,
        userId,
        entryType: 'STRESS',
        sourceType: 'stressEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '14:00'}:00.000Z`,
        date: e.date,
        time: e.time || '14:00',
        title: `Niveau de Stress • ${e.rating}/5`,
        summary: `Facteurs identifiés: ${(e.influencingFactors || []).join(', ') || 'Aucun facteur majeur'}${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['stress', ...(e.influencingFactors || [])],
        metadata: {
          rating: e.rating,
          influencingFactors: e.influencingFactors,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 6. Energy Entries
    const energyList = db.get('energyEntries').filter((e) => e.userId === userId);
    energyList.forEach((e) => {
      const slotLabels = { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir' };
      unifiedEntries.push({
        id: `feed_energy_${e.id}`,
        userId,
        entryType: 'ENERGY',
        sourceType: 'energyEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '10:00'}:00.000Z`,
        date: e.date,
        time: e.time || '10:00',
        title: `Niveau d'Énergie • ${e.rating}/5 (${slotLabels[e.timeOfDay] || 'Journée'})`,
        summary: `Vitalité perçue: ${e.rating}/5${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['energie', e.timeOfDay],
        metadata: {
          rating: e.rating,
          timeOfDay: e.timeOfDay,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 7. Activity Entries
    const activityList = db.get('activityEntries').filter((e) => e.userId === userId);
    activityList.forEach((e) => {
      const activityLabels: Record<string, string> = {
        marche: 'Marche',
        course: 'Course à pied',
        musculation: 'Musculation / Renforcement',
        velo: 'Cyclisme / Vélo',
        sport_collectif: 'Sport collectif',
        natation: 'Natation',
        mobilite: 'Étirements & Mobilité',
        yoga: 'Yoga / Pilates',
        autre: 'Activité physique',
      };
      const actName = e.customActivityName || activityLabels[e.activityType] || 'Activité physique';
      unifiedEntries.push({
        id: `feed_act_${e.id}`,
        userId,
        entryType: 'ACTIVITY',
        sourceType: 'activityEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '17:00'}:00.000Z`,
        date: e.date,
        time: e.time || '17:00',
        title: `Activité Physique • ${actName}`,
        summary: `Durée: ${e.durationMinutes} min • Intensité: ${e.intensity}${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['activite', e.activityType, e.intensity],
        metadata: {
          activityType: e.activityType,
          customActivityName: e.customActivityName,
          durationMinutes: e.durationMinutes,
          intensity: e.intensity,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 8. Nutrition Entries
    const nutritionList = db.get('nutritionEntries').filter((e) => e.userId === userId);
    nutritionList.forEach((e) => {
      const mealLabels: Record<string, string> = {
        breakfast: 'Petit-déjeuner',
        lunch: 'Déjeuner',
        dinner: 'Dîner',
        snack: 'Collation',
        other: 'Repas',
      };
      unifiedEntries.push({
        id: `feed_nut_${e.id}`,
        userId,
        entryType: 'NUTRITION',
        sourceType: 'nutritionEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '13:00'}:00.000Z`,
        date: e.date,
        time: e.time || '13:00',
        title: `Alimentation • ${mealLabels[e.mealType] || 'Repas'}`,
        summary: `Qualité perçue: ${e.perceivedQuality}/5 • Appétit: ${e.appetite}${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['alimentation', e.mealType, e.appetite],
        metadata: {
          mealType: e.mealType,
          perceivedQuality: e.perceivedQuality,
          appetite: e.appetite,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 9. Hydration Entries
    const hydrationList = db.get('hydrationEntries').filter((e) => e.userId === userId);
    hydrationList.forEach((e) => {
      unifiedEntries.push({
        id: `feed_hyd_${e.id}`,
        userId,
        entryType: 'HYDRATION',
        sourceType: 'hydrationEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '15:00'}:00.000Z`,
        date: e.date,
        time: e.time || '15:00',
        title: `Hydratation • ${e.amountMl} ml d'eau`,
        summary: `${e.glassCount ? `${e.glassCount} verres (~${e.amountMl} ml)` : `${e.amountMl} ml`}${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['hydratation', `${e.amountMl}ml`],
        metadata: {
          amountMl: e.amountMl,
          glassCount: e.glassCount,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 10. Relaxation Entries
    const relaxationList = db.get('relaxationEntries').filter((e) => e.userId === userId);
    relaxationList.forEach((e) => {
      const relaxLabels: Record<string, string> = {
        meditation: 'Méditation guidée / pleine conscience',
        respiration: 'Exercice respiratoire / Cohérence cardiaque',
        promenade: 'Promenade au grand air',
        musique: 'Écoute musicale relaxante',
        lecture: 'Lecture & Pause calme',
        relaxation_musculaire: 'Relaxation musculaire progressive',
        activite_sociale: 'Moment d’échange & Partage',
        autre: 'Pause bien-être',
      };
      const relaxName = e.customActivityName || relaxLabels[e.activityType] || 'Moment de détente';
      unifiedEntries.push({
        id: `feed_rel_${e.id}`,
        userId,
        entryType: 'RELAXATION',
        sourceType: 'relaxationEntries',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '20:00'}:00.000Z`,
        date: e.date,
        time: e.time || '20:00',
        title: `Relaxation • ${relaxName}`,
        summary: `Durée: ${e.durationMinutes} min • Bénéfice ressenti: ${e.perceivedBenefit}/5${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['relaxation', e.activityType],
        metadata: {
          activityType: e.activityType,
          customActivityName: e.customActivityName,
          durationMinutes: e.durationMinutes,
          perceivedBenefit: e.perceivedBenefit,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 11. THC Cravings
    const cravingList = db.get('thcCravings').filter((e) => e.userId === userId);
    cravingList.forEach((e) => {
      const outcomeLabels: Record<string, string> = {
        craving_passed: 'Envie dissipée',
        reduced: 'Intensité diminuée',
        consumed: 'Consommation après délai',
        postponed: 'Reporté à plus tard',
      };
      unifiedEntries.push({
        id: `feed_crav_${e.id}`,
        userId,
        entryType: 'CRAVING',
        sourceType: 'thcCravings',
        sourceId: e.id,
        dateTime: e.occurredAt || `${e.date}T${e.time || '18:00'}:00.000Z`,
        date: e.date,
        time: e.time || '18:00',
        title: `Envie / Craving • Intensité ${e.intensity}/10`,
        summary: `Déclencheur: ${e.trigger || 'Non précisé'} • Stratégie: ${e.copingMethod} • Issue: ${outcomeLabels[e.outcome] || e.outcome}`,
        tags: ['craving', e.trigger, e.copingMethod, e.outcome],
        metadata: {
          intensity: e.intensity,
          trigger: e.trigger,
          context: e.context,
          durationMinutes: e.durationMinutes,
          copingMethod: e.copingMethod,
          outcome: e.outcome,
          consumedAfter: e.consumedAfter,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt || e.createdAt,
      });
    });

    // 12. Personal Notes
    const noteList = db.get('personalNotes').filter((e) => e.userId === userId);
    noteList.forEach((e) => {
      unifiedEntries.push({
        id: `feed_note_${e.id}`,
        userId,
        entryType: 'NOTE',
        sourceType: 'personalNotes',
        sourceId: e.id,
        dateTime: e.dateTime || `${e.date}T${e.time || '12:00'}:00.000Z`,
        date: e.date,
        time: e.time || '12:00',
        title: e.title || 'Note personnelle',
        summary: e.content.length > 120 ? e.content.substring(0, 120) + '...' : e.content,
        tags: ['note', ...(e.tags || [])],
        metadata: {
          title: e.title,
          content: e.content,
          tags: e.tags,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 13. Life Events
    const eventList = db.get('lifeEvents').filter((e) => e.userId === userId);
    eventList.forEach((e) => {
      const catLabels: Record<string, string> = {
        vacances: 'Vacances / Congés',
        travail: 'Événement Pro / Travail',
        examen: 'Examen / Échéance',
        competition: 'Compétition / Défi',
        famille: 'Famille / Fête',
        social: 'Sortie sociale',
        habitudes: 'Changement d’habitude',
        objectif: 'Objectif atteint',
        autre: 'Événement marquant',
      };
      unifiedEntries.push({
        id: `feed_evt_${e.id}`,
        userId,
        entryType: 'EVENT',
        sourceType: 'lifeEvents',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '09:00'}:00.000Z`,
        date: e.date,
        time: e.time || '09:00',
        title: `Événement • ${e.title}`,
        summary: `${catLabels[e.category] || e.category}${e.description ? ` • ${e.description}` : ''}`,
        tags: ['evenement', e.category, ...(e.tags || [])],
        metadata: {
          title: e.title,
          category: e.category,
          impact: e.impact,
          description: e.description,
          tags: e.tags,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // 14. Wellness Observations (from CBD / Wellness)
    const cbdWellnessList = db.get('cbdWellnessObservations').filter((e) => e.userId === userId);
    cbdWellnessList.forEach((e) => {
      unifiedEntries.push({
        id: `feed_well_${e.id}`,
        userId,
        entryType: 'WELLNESS_OBSERVATION',
        sourceType: 'cbdWellnessObservations',
        sourceId: e.id,
        dateTime: `${e.date}T${e.time || '19:00'}:00.000Z`,
        date: e.date,
        time: e.time || '19:00',
        title: `Bilan Bien-Être Quotidien`,
        summary: `Sommeil: ${e.sleepQuality || '-'}/5 • Énergie: ${e.energy || '-'}/5 • Sérénité: ${e.relaxation || '-'}/5${e.notes ? ` • "${e.notes}"` : ''}`,
        tags: ['bien_etre'],
        metadata: {
          sleepQuality: e.sleepQuality,
          energy: e.energy,
          stressLevel: e.stressLevel,
          mood: e.mood,
          relaxation: e.relaxation,
          notes: e.notes,
        },
        rawItem: e,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      });
    });

    // Apply Filters
    let filtered = unifiedEntries;

    if (effectiveStartDate) {
      filtered = filtered.filter((e) => e.date >= effectiveStartDate);
    }
    if (effectiveEndDate) {
      filtered = filtered.filter((e) => e.date <= effectiveEndDate);
    }

    if (type && type !== 'ALL') {
      const typeStr = String(type).toUpperCase();
      if (typeStr === 'THC') {
        filtered = filtered.filter((e) => e.entryType === 'THC_CONSUMPTION');
      } else if (typeStr === 'CBD') {
        filtered = filtered.filter((e) => e.entryType === 'CBD_CONSUMPTION');
      } else if (typeStr === 'WELLNESS') {
        filtered = filtered.filter((e) => ['MOOD', 'STRESS', 'ENERGY', 'SLEEP', 'RELAXATION', 'WELLNESS_OBSERVATION'].includes(e.entryType));
      } else {
        filtered = filtered.filter((e) => e.entryType === typeStr || e.entryType.startsWith(typeStr));
      }
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((e) => {
        const titleMatch = e.title.toLowerCase().includes(q);
        const summaryMatch = e.summary.toLowerCase().includes(q);
        const tagMatch = (e.tags || []).some((t) => t.toLowerCase().includes(q));
        const notesMatch = e.metadata?.notes && String(e.metadata.notes).toLowerCase().includes(q);
        const prodMatch = e.metadata?.productName && String(e.metadata.productName).toLowerCase().includes(q);
        return titleMatch || summaryMatch || tagMatch || notesMatch || prodMatch;
      });
    }

    // Sort Chronologically (DESC: newest first)
    filtered.sort((a, b) => {
      const timeA = new Date(a.dateTime).getTime();
      const timeB = new Date(b.dateTime).getTime();
      return timeB - timeA;
    });

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedEntries = filtered.slice(startIndex, startIndex + limitNum);

    return res.json({
      entries: paginatedEntries,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('Timeline fetch error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du journal.' });
  }
};

router.get('/timeline', requireAuth, getTimelineHandler);
router.get('/feed', requireAuth, getTimelineHandler);

// -------------------------------------------------------------
// 2. DAY BREAKDOWN ("Ma journée" / Today Summary)
// -------------------------------------------------------------
const getDayBreakdownHandler = (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user!.id;
    const targetDate = req.params.date || (req.query.date as string) || new Date().toISOString().split('T')[0];

    // Validate format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return res.status(400).json({ error: 'Format de date invalide (YYYY-MM-DD).' });
    }

    // Gather all entities for this specific day
    const sleep = db.get('sleepEntries').find((e) => e.userId === userId && e.date === targetDate) || null;
    const moods = db.get('moodEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const stresses = db.get('stressEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const energies = db.get('energyEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const activities = db.get('activityEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const nutritions = db.get('nutritionEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const hydrations = db.get('hydrationEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const relaxations = db.get('relaxationEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const thcConsumptions = db.get('consumptionEntries').filter((e) => e.userId === userId && e.date === targetDate);
    const cbdConsumptions = db.get('cbdConsumptions').filter((e) => e.userId === userId && e.date === targetDate);
    const cravings = db.get('thcCravings').filter((e) => e.userId === userId && e.date === targetDate);
    const triggers = db.get('thcTriggers').filter((e) => e.userId === userId && e.active);
    const notes = db.get('personalNotes').filter((e) => e.userId === userId && e.date === targetDate);
    const events = db.get('lifeEvents').filter((e) => e.userId === userId && e.date === targetDate);

    // Totals calculations
    const totalHydrationMl = hydrations.reduce((acc, h) => acc + (h.amountMl || 0), 0);
    const totalActivityMinutes = activities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
    const totalRelaxationMinutes = relaxations.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

    const latestMood = moods.length > 0 ? moods[moods.length - 1] : null;
    const latestStress = stresses.length > 0 ? stresses[stresses.length - 1] : null;
    const latestEnergy = energies.length > 0 ? energies[energies.length - 1] : null;

    const totalEntriesCount =
      (sleep ? 1 : 0) +
      moods.length +
      stresses.length +
      energies.length +
      activities.length +
      nutritions.length +
      hydrations.length +
      relaxations.length +
      thcConsumptions.length +
      cbdConsumptions.length +
      cravings.length +
      notes.length +
      events.length;

    return res.json({
      date: targetDate,
      state: {
        sleep,
        moods,
        stresses,
        energies,
        latestMoodRating: latestMood ? latestMood.rating : null,
        latestStressRating: latestStress ? latestStress.rating : null,
        latestEnergyRating: latestEnergy ? latestEnergy.rating : null,
      },
      habits: {
        activities,
        totalActivityMinutes,
        nutritions,
        hydrations,
        totalHydrationMl,
        relaxations,
        totalRelaxationMinutes,
      },
      consumptions: {
        thc: thcConsumptions,
        cbd: cbdConsumptions,
        totalThcCount: thcConsumptions.length,
        totalCbdCount: cbdConsumptions.length,
      },
      cravings: {
        cravings,
        triggers,
        totalCravingsCount: cravings.length,
      },
      notesAndEvents: {
        notes,
        events,
      },
      summary: {
        totalEntries: totalEntriesCount,
        hasActivity: activities.length > 0,
        hasSleep: !!sleep,
        hasConsumption: thcConsumptions.length > 0 || cbdConsumptions.length > 0,
        hasNote: notes.length > 0,
        hasCraving: cravings.length > 0,
      },
    });
  } catch (err) {
    console.error('Day breakdown error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du résumé de la journée.' });
  }
};

router.get('/day/:date', requireAuth, getDayBreakdownHandler);
router.get('/today', requireAuth, getDayBreakdownHandler);

// -------------------------------------------------------------
// 3. CALENDAR OVERVIEW (Indicators per day)
// -------------------------------------------------------------
router.get('/calendar', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query; // optional filtering by year & month (1-12)

    const now = new Date();
    const currentYear = year ? parseInt(String(year), 10) : now.getFullYear();
    const currentMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;

    // Date prefix e.g. "2026-03"
    const monthPrefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

    // Map of date -> indicators
    const daysMap: Record<
      string,
      {
        date: string;
        thcCount: number;
        cbdCount: number;
        sleepLogged: boolean;
        moodCount: number;
        activityCount: number;
        cravingCount: number;
        relaxationCount: number;
        noteCount: number;
        eventCount: number;
        hydrationCount: number;
        totalItems: number;
        types: string[];
      }
    > = {};

    const registerDay = (dateStr: string, typeKey: string) => {
      if (!dateStr || !dateStr.startsWith(monthPrefix)) return;
      if (!daysMap[dateStr]) {
        daysMap[dateStr] = {
          date: dateStr,
          thcCount: 0,
          cbdCount: 0,
          sleepLogged: false,
          moodCount: 0,
          activityCount: 0,
          cravingCount: 0,
          relaxationCount: 0,
          noteCount: 0,
          eventCount: 0,
          hydrationCount: 0,
          totalItems: 0,
          types: [],
        };
      }
      daysMap[dateStr].totalItems += 1;
      if (!daysMap[dateStr].types.includes(typeKey)) {
        daysMap[dateStr].types.push(typeKey);
      }
    };

    db.get('consumptionEntries')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'thc');
        if (daysMap[e.date]) daysMap[e.date].thcCount += 1;
      });

    db.get('cbdConsumptions')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'cbd');
        if (daysMap[e.date]) daysMap[e.date].cbdCount += 1;
      });

    db.get('sleepEntries')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'sleep');
        if (daysMap[e.date]) daysMap[e.date].sleepLogged = true;
      });

    db.get('moodEntries')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'mood');
        if (daysMap[e.date]) daysMap[e.date].moodCount += 1;
      });

    db.get('activityEntries')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'activity');
        if (daysMap[e.date]) daysMap[e.date].activityCount += 1;
      });

    db.get('thcCravings')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'craving');
        if (daysMap[e.date]) daysMap[e.date].cravingCount += 1;
      });

    db.get('relaxationEntries')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'relaxation');
        if (daysMap[e.date]) daysMap[e.date].relaxationCount += 1;
      });

    db.get('personalNotes')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'note');
        if (daysMap[e.date]) daysMap[e.date].noteCount += 1;
      });

    db.get('lifeEvents')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'event');
        if (daysMap[e.date]) daysMap[e.date].eventCount += 1;
      });

    db.get('hydrationEntries')
      .filter((e) => e.userId === userId)
      .forEach((e) => {
        registerDay(e.date, 'hydration');
        if (daysMap[e.date]) daysMap[e.date].hydrationCount += 1;
      });

    return res.json({
      year: currentYear,
      month: currentMonth,
      monthPrefix,
      days: Object.values(daysMap),
    });
  } catch (err) {
    console.error('Calendar indicators error:', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du calendrier.' });
  }
});

// -------------------------------------------------------------
// 4. CRUD FOR PERSONAL NOTES
// -------------------------------------------------------------
router.get('/notes', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { search, tag } = req.query;
    let notes = db.get('personalNotes').filter((n) => n.userId === userId);

    if (search) {
      const q = String(search).toLowerCase();
      notes = notes.filter(
        (n) => (n.title && n.title.toLowerCase().includes(q)) || n.content.toLowerCase().includes(q)
      );
    }
    if (tag) {
      const t = String(tag).toLowerCase();
      notes = notes.filter((n) => (n.tags || []).some((item) => item.toLowerCase() === t));
    }

    notes.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    return res.json({ notes });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération des notes.' });
  }
});

router.post('/notes', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, content, tags, date, time } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu de la note est requis.' });
    }

    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const timeStr = time || now.toTimeString().substring(0, 5);
    const isoDateTime = `${dateStr}T${timeStr}:00.000Z`;

    const newNote: PersonalNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      dateTime: isoDateTime,
      date: dateStr,
      time: timeStr,
      title: title?.trim() || null,
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean) : [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const notes = db.get('personalNotes');
    notes.push(newNote);
    db.save();
    db.logAudit('PERSONAL_NOTE_CREATED', 'personalNotes', userId, { noteId: newNote.id });

    return res.status(201).json({ note: newNote });
  } catch (err) {
    console.error('Create note error:', err);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement de la note." });
  }
});

router.put('/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const notes = db.get('personalNotes');
    const index = notes.findIndex((n) => n.id === req.params.id && n.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Note introuvable ou accès non autorisé.' });
    }

    const current = notes[index];
    const { title, content, tags, date, time } = req.body;

    const dateStr = date !== undefined ? date : current.date;
    const timeStr = time !== undefined ? time : current.time;

    const updatedNote: PersonalNote = {
      ...current,
      title: title !== undefined ? (title ? title.trim() : null) : current.title,
      content: content !== undefined ? content.trim() : current.content,
      tags: Array.isArray(tags) ? tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean) : current.tags,
      date: dateStr,
      time: timeStr,
      dateTime: `${dateStr}T${timeStr}:00.000Z`,
      updatedAt: new Date().toISOString(),
    };

    notes[index] = updatedNote;
    db.save();
    db.logAudit('PERSONAL_NOTE_UPDATED', 'personalNotes', userId, { noteId: current.id });

    return res.json({ note: updatedNote });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour note.' });
  }
});

router.delete('/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const notes = db.get('personalNotes');
    const exists = notes.some((n) => n.id === req.params.id && n.userId === userId);

    if (!exists) {
      return res.status(404).json({ error: 'Note introuvable.' });
    }

    const filtered = notes.filter((n) => !(n.id === req.params.id && n.userId === userId));
    db.set('personalNotes', filtered);
    db.logAudit('PERSONAL_NOTE_DELETED', 'personalNotes', userId, { noteId: req.params.id });

    return res.json({ success: true, message: 'Note supprimée.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur suppression note.' });
  }
});

// -------------------------------------------------------------
// 5. CRUD FOR SLEEP ENTRIES
// -------------------------------------------------------------
router.get('/sleep', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entries = db.get('sleepEntries').filter((e) => e.userId === userId);
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return res.json({ sleepEntries: entries });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération sommeil.' });
  }
});

router.post('/sleep', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, bedTime, wakeTime, sleepQuality, nightAwakenings, notes, durationMinutes } = req.body;

    const dateStr = date || new Date().toISOString().split('T')[0];
    const bTime = bedTime || '23:30';
    const wTime = wakeTime || '07:30';

    let calcDuration = durationMinutes;
    if (calcDuration === undefined || calcDuration === null) {
      calcDuration = calculateSleepDurationMinutes(bTime, wTime);
    }

    const newSleep: SleepEntry = {
      id: 'sleep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: dateStr,
      bedTime: bTime,
      wakeTime: wTime,
      durationMinutes: Number(calcDuration) || 480,
      sleepQuality: Math.max(1, Math.min(5, Number(sleepQuality) || 3)),
      nightAwakenings: Math.max(0, Number(nightAwakenings) || 0),
      notes: notes?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sleepList = db.get('sleepEntries');
    // Replace if exists for same day or append
    const existingIndex = sleepList.findIndex((s) => s.userId === userId && s.date === dateStr);
    if (existingIndex !== -1) {
      sleepList[existingIndex] = { ...newSleep, id: sleepList[existingIndex].id };
    } else {
      sleepList.push(newSleep);
    }

    db.save();
    db.logAudit('SLEEP_ENTRY_SAVED', 'sleepEntries', userId, { date: dateStr, duration: newSleep.durationMinutes });

    return res.status(201).json({ sleep: newSleep });
  } catch (err) {
    console.error('Sleep entry error:', err);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du sommeil." });
  }
});

router.delete('/sleep/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entries = db.get('sleepEntries');
    const filtered = entries.filter((e) => !(e.id === req.params.id && e.userId === userId));
    db.set('sleepEntries', filtered);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur suppression sommeil.' });
  }
});

// -------------------------------------------------------------
// 6. CRUD FOR MOOD, STRESS, ENERGY ENTRIES
// -------------------------------------------------------------
router.get('/mood', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const list = db.get('moodEntries').filter((m) => m.userId === userId);
  list.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  return res.json({ moods: list });
});

router.post('/mood', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, rating, primaryMood, notes } = req.body;

    const now = new Date();
    const newMood: MoodEntry = {
      id: 'mood_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      rating: Math.max(1, Math.min(5, Number(rating) || 3)),
      primaryMood: primaryMood?.trim() || undefined,
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('moodEntries');
    list.push(newMood);
    db.save();
    return res.status(201).json({ mood: newMood });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement de l'humeur." });
  }
});

router.get('/stress', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const list = db.get('stressEntries').filter((s) => s.userId === userId);
  list.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  return res.json({ stresses: list });
});

router.post('/stress', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, rating, influencingFactors, notes } = req.body;

    const now = new Date();
    const newStress: StressEntry = {
      id: 'stress_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      rating: Math.max(1, Math.min(5, Number(rating) || 3)),
      influencingFactors: Array.isArray(influencingFactors) ? influencingFactors : [],
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('stressEntries');
    list.push(newStress);
    db.save();
    return res.status(201).json({ stress: newStress });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur enregistrement du stress.' });
  }
});

router.get('/energy', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const list = db.get('energyEntries').filter((e) => e.userId === userId);
  list.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  return res.json({ energies: list });
});

router.post('/energy', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, rating, timeOfDay, notes } = req.body;

    const now = new Date();
    const newEnergy: EnergyEntry = {
      id: 'energy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      timeOfDay: timeOfDay || 'morning',
      rating: Math.max(1, Math.min(5, Number(rating) || 3)),
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('energyEntries');
    list.push(newEnergy);
    db.save();
    return res.status(201).json({ energy: newEnergy });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement de l'énergie." });
  }
});

// -------------------------------------------------------------
// 7. CRUD FOR ACTIVITY, NUTRITION, HYDRATION, RELAXATION
// -------------------------------------------------------------
router.post('/activity', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, activityType, customActivityName, durationMinutes, intensity, notes } = req.body;

    if (!durationMinutes || Number(durationMinutes) <= 0) {
      return res.status(400).json({ error: 'Durée requise.' });
    }

    const now = new Date();
    const newActivity: ActivityEntry = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      activityType: activityType || 'marche',
      customActivityName: customActivityName?.trim() || undefined,
      durationMinutes: Number(durationMinutes) || 30,
      intensity: intensity || 'moderee',
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('activityEntries');
    list.push(newActivity);
    db.save();
    return res.status(201).json({ activity: newActivity });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement de l'activité." });
  }
});

router.post('/nutrition', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, mealType, perceivedQuality, appetite, notes } = req.body;

    const now = new Date();
    const newNut: NutritionEntry = {
      id: 'nut_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      mealType: mealType || 'lunch',
      perceivedQuality: Math.max(1, Math.min(5, Number(perceivedQuality) || 3)),
      appetite: appetite || 'normal',
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('nutritionEntries');
    list.push(newNut);
    db.save();
    return res.status(201).json({ nutrition: newNut });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement de l'alimentation." });
  }
});

router.post('/hydration', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, amountMl, glassCount, notes } = req.body;

    const now = new Date();
    const qty = Number(amountMl) || (Number(glassCount) ? Number(glassCount) * 200 : 250);

    const newHyd: HydrationEntry = {
      id: 'hyd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      amountMl: qty,
      glassCount: glassCount !== undefined ? Number(glassCount) : Math.round(qty / 200),
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('hydrationEntries');
    list.push(newHyd);
    db.save();
    return res.status(201).json({ hydration: newHyd });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement de l'hydratation." });
  }
});

router.post('/relaxation', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, time, activityType, customActivityName, durationMinutes, perceivedBenefit, notes } = req.body;

    const now = new Date();
    const newRel: RelaxationEntry = {
      id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || now.toTimeString().substring(0, 5),
      activityType: activityType || 'respiration',
      customActivityName: customActivityName?.trim() || undefined,
      durationMinutes: Number(durationMinutes) || 15,
      perceivedBenefit: Math.max(1, Math.min(5, Number(perceivedBenefit) || 4)),
      notes: notes?.trim() || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('relaxationEntries');
    list.push(newRel);
    db.save();
    return res.status(201).json({ relaxation: newRel });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur enregistrement de la relaxation.' });
  }
});

router.post('/events', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, date, time, category, impact, description, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Titre de l'événement requis." });
    }

    const now = new Date();
    const newEvt: LifeEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.toISOString().split('T')[0],
      time: time || undefined,
      title: title.trim(),
      category: category || 'autre',
      impact: impact || 'positive',
      description: description?.trim() || '',
      tags: Array.isArray(tags) ? tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean) : [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const list = db.get('lifeEvents');
    list.push(newEvt);
    db.save();
    return res.status(201).json({ event: newEvt });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement de l'événement." });
  }
});

// -------------------------------------------------------------
// 8. GLOBAL SEARCH ACROSS ALL USER OBSERVATIONS
// -------------------------------------------------------------
router.get('/search', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { q } = req.query;

    if (!q || !String(q).trim()) {
      return res.json({ results: [] });
    }

    const queryStr = String(q).toLowerCase();

    // Query in notes
    const matchedNotes = db
      .get('personalNotes')
      .filter((n) => n.userId === userId && ((n.title && n.title.toLowerCase().includes(queryStr)) || n.content.toLowerCase().includes(queryStr)));

    // Query in events
    const matchedEvents = db
      .get('lifeEvents')
      .filter((e) => e.userId === userId && (e.title.toLowerCase().includes(queryStr) || (e.description && e.description.toLowerCase().includes(queryStr))));

    // Query in THC consumptions
    const matchedThc = db
      .get('consumptionEntries')
      .filter(
        (c) =>
          c.userId === userId &&
          (c.productName.toLowerCase().includes(queryStr) ||
            c.context.toLowerCase().includes(queryStr) ||
            (c.personalNotes && c.personalNotes.toLowerCase().includes(queryStr)))
      );

    // Query in CBD consumptions
    const matchedCbd = db
      .get('cbdConsumptions')
      .filter(
        (c) =>
          c.userId === userId &&
          (c.productName.toLowerCase().includes(queryStr) ||
            (c.context && c.context.toLowerCase().includes(queryStr)) ||
            (c.notes && c.notes.toLowerCase().includes(queryStr)))
      );

    return res.json({
      query: queryStr,
      results: {
        notes: matchedNotes,
        events: matchedEvents,
        thcConsumptions: matchedThc,
        cbdConsumptions: matchedCbd,
        totalMatches: matchedNotes.length + matchedEvents.length + matchedThc.length + matchedCbd.length,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors de la recherche.' });
  }
});

// -------------------------------------------------------------
// 9. TAGS LIST
// -------------------------------------------------------------
router.get('/tags', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const tagSet = new Set<string>();

    db.get('personalNotes')
      .filter((n) => n.userId === userId)
      .forEach((n) => (n.tags || []).forEach((t) => tagSet.add(t)));

    db.get('lifeEvents')
      .filter((e) => e.userId === userId)
      .forEach((e) => (e.tags || []).forEach((t) => tagSet.add(t)));

    return res.json({ tags: Array.from(tagSet).sort() });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération des tags.' });
  }
});

// -------------------------------------------------------------
// 10. WEEKLY PREPARATION / SUMMARY PREP
// -------------------------------------------------------------
router.get('/weekly-prep', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const sleepDays = db.get('sleepEntries').filter((s) => s.userId === userId && days.includes(s.date));
    const activityDays = db.get('activityEntries').filter((a) => a.userId === userId && days.includes(a.date));
    const thcDays = db.get('consumptionEntries').filter((c) => c.userId === userId && days.includes(c.date));
    const cbdDays = db.get('cbdConsumptions').filter((c) => c.userId === userId && days.includes(c.date));
    const cravingDays = db.get('thcCravings').filter((c) => c.userId === userId && days.includes(c.date));
    const moodDays = db.get('moodEntries').filter((m) => m.userId === userId && days.includes(m.date));

    const totalSleepMinutes = sleepDays.reduce((acc, s) => acc + s.durationMinutes, 0);
    const avgSleepMinutes = sleepDays.length > 0 ? Math.round(totalSleepMinutes / sleepDays.length) : 0;

    const totalActivityMinutes = activityDays.reduce((acc, a) => acc + a.durationMinutes, 0);

    const avgMood =
      moodDays.length > 0 ? Number((moodDays.reduce((acc, m) => acc + m.rating, 0) / moodDays.length).toFixed(1)) : null;

    return res.json({
      weekDays: days,
      metrics: {
        activeTrackingDays: new Set([
          ...sleepDays.map((s) => s.date),
          ...activityDays.map((a) => a.date),
          ...thcDays.map((t) => t.date),
          ...cbdDays.map((c) => c.date),
          ...moodDays.map((m) => m.date),
        ]).size,
        avgSleepMinutes,
        avgSleepFormatted: formatMinutesHuman(avgSleepMinutes),
        totalActivityMinutes,
        totalActivityFormatted: formatMinutesHuman(totalActivityMinutes),
        totalThcLogs: thcDays.length,
        totalCbdLogs: cbdDays.length,
        totalCravingsHandled: cravingDays.length,
        avgMood,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur calcul synthèse hebdomadaire.' });
  }
});

// -------------------------------------------------------------
// 11. EXPORT FULL JOURNAL (CSV & JSON)
// -------------------------------------------------------------
router.get('/export/json', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      user: { id: userId, email: req.user!.email },
      thcConsumptions: db.get('consumptionEntries').filter((e) => e.userId === userId),
      cbdConsumptions: db.get('cbdConsumptions').filter((e) => e.userId === userId),
      sleepEntries: db.get('sleepEntries').filter((e) => e.userId === userId),
      moodEntries: db.get('moodEntries').filter((e) => e.userId === userId),
      stressEntries: db.get('stressEntries').filter((e) => e.userId === userId),
      energyEntries: db.get('energyEntries').filter((e) => e.userId === userId),
      activityEntries: db.get('activityEntries').filter((e) => e.userId === userId),
      hydrationEntries: db.get('hydrationEntries').filter((e) => e.userId === userId),
      relaxationEntries: db.get('relaxationEntries').filter((e) => e.userId === userId),
      personalNotes: db.get('personalNotes').filter((e) => e.userId === userId),
      lifeEvents: db.get('lifeEvents').filter((e) => e.userId === userId),
      cravings: db.get('thcCravings').filter((e) => e.userId === userId),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=journal_complet_cannabis_care_${userId}.json`);
    return res.json(exportPayload);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur export JSON.' });
  }
});

router.get('/export/csv', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entries = db.get('consumptionEntries').filter((e) => e.userId === userId);

    const headers = ['Date', 'Heure', 'Produit', 'Type', 'Quantite', 'Unite', 'Mode', 'Contexte', 'HumeurAvant', 'HumeurApres', 'Notes'];
    const rows = entries.map((e) => [
      e.date,
      e.time,
      `"${(e.productName || '').replace(/"/g, '""')}"`,
      e.productType,
      e.quantity,
      e.unit,
      e.consumptionMode,
      `"${(e.context || '').replace(/"/g, '""')}"`,
      e.moodBefore,
      e.moodAfter,
      `"${(e.personalNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=journal_cannabis_care_${userId}.csv`);
    return res.send('\uFEFF' + csvContent);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur export CSV.' });
  }
});

// -------------------------------------------------------------
// 12. BACKWARD COMPATIBLE CONSUMPTION CRUD
// -------------------------------------------------------------
router.get('/', requireAuth, getTimelineHandler);

router.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      date,
      time,
      productType,
      productName,
      quantity,
      unit,
      consumptionMode,
      context,
      moodBefore,
      moodAfter,
      associatedGoalId,
      costEstimated,
      personalNotes,
    } = req.body;

    if (!date || !productType || quantity === undefined) {
      return res.status(400).json({ error: 'Date, type de produit et quantité requis.' });
    }

    const now = new Date().toISOString();
    const entryId = 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const newEntry: ConsumptionEntry = {
      id: entryId,
      userId,
      date: date || now.split('T')[0],
      time: time || '20:00',
      productType: productType || 'THC_herb',
      productName: productName?.trim() || (productType.startsWith('THC') ? 'Cannabis THC' : 'Huile CBD'),
      quantity: Number(quantity) || 0,
      unit: unit || 'joints',
      consumptionMode: consumptionMode || 'combustion',
      context: context?.trim() || 'Soirée à la maison',
      moodBefore: Number(moodBefore) || 3,
      moodAfter: Number(moodAfter) || 3,
      associatedGoalId: associatedGoalId || undefined,
      costEstimated: costEstimated !== undefined ? Number(costEstimated) : undefined,
      personalNotes: personalNotes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    const entries = db.get('consumptionEntries');
    entries.push(newEntry);
    db.save();
    db.logAudit('CONSUMPTION_ENTRY_CREATED', 'consumptionEntries', userId, { entryId, productType, quantity });

    return res.status(201).json({ entry: newEntry });
  } catch (err) {
    console.error('Create entry error:', err);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement." });
  }
});

router.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entry = db.get('consumptionEntries').find((e) => e.id === req.params.id && e.userId === userId);
    if (!entry) {
      return res.status(404).json({ error: 'Entrée introuvable.' });
    }
    return res.json({ entry });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération entrée.' });
  }
});

router.put('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entries = db.get('consumptionEntries');
    const index = entries.findIndex((e) => e.id === req.params.id && e.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Entrée introuvable.' });
    }

    const current = entries[index];
    const {
      date,
      time,
      productType,
      productName,
      quantity,
      unit,
      consumptionMode,
      context,
      moodBefore,
      moodAfter,
      associatedGoalId,
      costEstimated,
      personalNotes,
    } = req.body;

    const updatedEntry: ConsumptionEntry = {
      ...current,
      date: date !== undefined ? date : current.date,
      time: time !== undefined ? time : current.time,
      productType: productType !== undefined ? productType : current.productType,
      productName: productName !== undefined ? productName.trim() : current.productName,
      quantity: quantity !== undefined ? Number(quantity) : current.quantity,
      unit: unit !== undefined ? unit : current.unit,
      consumptionMode: consumptionMode !== undefined ? consumptionMode : current.consumptionMode,
      context: context !== undefined ? context.trim() : current.context,
      moodBefore: moodBefore !== undefined ? Number(moodBefore) : current.moodBefore,
      moodAfter: moodAfter !== undefined ? Number(moodAfter) : current.moodAfter,
      associatedGoalId: associatedGoalId !== undefined ? associatedGoalId : current.associatedGoalId,
      costEstimated: costEstimated !== undefined ? Number(costEstimated) : current.costEstimated,
      personalNotes: personalNotes !== undefined ? personalNotes.trim() : current.personalNotes,
      updatedAt: new Date().toISOString(),
    };

    entries[index] = updatedEntry;
    db.save();
    db.logAudit('CONSUMPTION_ENTRY_UPDATED', 'consumptionEntries', userId, { entryId: current.id });

    return res.json({ entry: updatedEntry });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour entrée.' });
  }
});

router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entries = db.get('consumptionEntries');
    const exists = entries.some((e) => e.id === req.params.id && e.userId === userId);

    if (!exists) {
      return res.status(404).json({ error: 'Entrée introuvable.' });
    }

    const filtered = entries.filter((e) => !(e.id === req.params.id && e.userId === userId));
    db.set('consumptionEntries', filtered);
    db.logAudit('CONSUMPTION_ENTRY_DELETED', 'consumptionEntries', userId, { entryId: req.params.id });

    return res.json({ success: true, message: 'Entrée supprimée avec succès.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur suppression entrée.' });
  }
});

export default router;
