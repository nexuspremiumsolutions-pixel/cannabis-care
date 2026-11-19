import { Router } from 'express';
import { db } from '../db/database';
import { requireAuth, AuthenticatedRequest } from '../auth/auth';
import { UserGoal } from '../../src/types/entities';

const router = Router();

// GET GOAL CATALOG & MY GOALS
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const catalog = db.get('goals');
    const myGoals = db.get('userGoals').filter((g) => g.userId === userId);
    const badges = db.get('badges');

    return res.json({ catalog, myGoals, badges });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur récupération objectifs.' });
  }
});

// ACTIVATE / SELECT GOAL
router.post('/select', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { goalId, customTargetDays } = req.body;

    const catalogGoal = db.get('goals').find((g) => g.id === goalId);
    if (!catalogGoal) {
      return res.status(404).json({ error: 'Objectif catalogue introuvable.' });
    }

    const userGoals = db.get('userGoals');
    const existing = userGoals.find((g) => g.userId === userId && g.goalId === goalId && g.status === 'active');
    if (existing) {
      return res.status(400).json({ error: 'Cet objectif est déjà actif.' });
    }

    const now = new Date().toISOString();
    const newUserGoal: UserGoal = {
      id: 'ug_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      goalId: catalogGoal.id,
      title: catalogGoal.title,
      customTargetDays: Number(customTargetDays) || catalogGoal.defaultTargetDays,
      startDate: now.split('T')[0],
      currentStreakDays: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    userGoals.push(newUserGoal);
    db.save();
    db.logAudit('GOAL_ACTIVATED', 'userGoals', userId, { goalId, title: catalogGoal.title });

    return res.status(201).json({ goal: newUserGoal });
  } catch (err) {
    return res.status(500).json({ error: "Erreur activation d'objectif." });
  }
});

// UPDATE USER GOAL STATUS / PROGRESS
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const userGoals = db.get('userGoals');
    const index = userGoals.findIndex((g) => g.id === req.params.id && g.userId === userId);

    if (index === -1) {
      return res.status(404).json({ error: 'Objectif utilisateur introuvable.' });
    }

    const { status, currentStreakDays } = req.body;
    if (status) userGoals[index].status = status;
    if (currentStreakDays !== undefined) userGoals[index].currentStreakDays = Number(currentStreakDays);
    userGoals[index].updatedAt = new Date().toISOString();

    db.save();
    return res.json({ goal: userGoals[index] });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur mise à jour objectif.' });
  }
});

export default router;
