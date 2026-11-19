import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../auth/auth';
import { WellnessEntry } from '../../src/types/entities';

const router = Router();

// GET WELLNESS ENTRIES
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const entries = db.get('wellnessEntries').filter((w) => w.userId === userId);
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return res.json({ entries });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération bien-être.' });
  }
});

// ADD WELLNESS ENTRY
router.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { date, sleepHours, sleepQuality, stressLevel, cravingLevel, energyLevel, notes } = req.body;

    const now = new Date().toISOString();
    const entry: WellnessEntry = {
      id: 'well_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      date: date || now.split('T')[0],
      sleepHours: sleepHours !== undefined ? Number(sleepHours) : undefined,
      sleepQuality: Number(sleepQuality) || 3,
      stressLevel: Number(stressLevel) || 3,
      cravingLevel: Number(cravingLevel) || 1,
      energyLevel: Number(energyLevel) || 3,
      notes: notes?.trim() || '',
      createdAt: now,
    };

    const list = db.get('wellnessEntries');
    list.push(entry);
    db.save();

    return res.status(201).json({ entry });
  } catch (err) {
    return res.status(500).json({ error: "Erreur enregistrement indicateur bien-être." });
  }
});

export default router;
