import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import {
  EducationalContent,
  EducationalProgress,
  EducationalFavorite,
  EducationalHistoryItem,
  PersonalNote,
} from '../../src/types/entities';
import { EducationRecommendationService } from '../services/educationRecommendationService';
import { seedEducationalTranslations } from '../db/educationSeeds';

const router = Router();

// Helper to extract authenticated userId
function getUserId(req: Request): string {
  const headerUser = req.headers['x-user-id'] as string;
  if (headerUser && typeof headerUser === 'string' && headerUser.trim() !== '') {
    return headerUser.trim();
  }
  // Default to first user if exists, or demo_user
  const users = db.get('users');
  return users[0]?.id || 'usr_demo_user';
}

// Helper to apply translation dynamically
function applyContentTranslation(content: EducationalContent, lang?: string): EducationalContent {
  if (!lang || lang === 'fr') return content;

  const translationEntry = seedEducationalTranslations[content.id]?.[lang as 'en' | 'ar'];
  if (translationEntry) {
    return {
      ...content,
      title: translationEntry.title || content.title,
      subtitle: translationEntry.subtitle || content.subtitle,
      summary: translationEntry.summary || content.summary,
      medicalReviewDisclaimer: translationEntry.medicalReviewDisclaimer || content.medicalReviewDisclaimer,
      language: lang as 'en' | 'ar',
    };
  }

  // Check inline content translations if present
  if (content.translations?.[lang]) {
    const inline = content.translations[lang];
    return {
      ...content,
      title: inline.title || content.title,
      subtitle: inline.subtitle || content.subtitle,
      summary: inline.summary || content.summary,
      medicalReviewDisclaimer: inline.medicalReviewDisclaimer || content.medicalReviewDisclaimer,
      language: lang as 'en' | 'ar',
    };
  }

  return content;
}

// -------------------------------------------------------------
// 1. GET ALL CONTENTS (Search, Filter, Language, Recommendations)
// -------------------------------------------------------------
router.get('/contents', (req: Request, res: Response) => {
  try {
    const {
      category,
      level,
      contentType,
      search,
      duration,
      language = 'fr',
      targetAudience,
      recommendedForMe,
    } = req.query;

    const userId = getUserId(req);
    let contents = db.get('educationalContents');

    // Filter by category
    if (category && category !== 'all') {
      contents = contents.filter((c) => c.category === category);
    }

    // Filter by level
    if (level && level !== 'all') {
      contents = contents.filter((c) => c.level === level);
    }

    // Filter by content type
    if (contentType && contentType !== 'all') {
      contents = contents.filter((c) => c.contentType === contentType);
    }

    // Filter by duration
    if (duration) {
      if (duration === 'short') {
        contents = contents.filter((c) => (c.estimatedMinutes || c.readTimeMinutes || 3) < 5);
      } else if (duration === 'medium') {
        contents = contents.filter((c) => {
          const m = c.estimatedMinutes || c.readTimeMinutes || 5;
          return m >= 5 && m <= 10;
        });
      } else if (duration === 'long') {
        contents = contents.filter((c) => (c.estimatedMinutes || c.readTimeMinutes || 10) > 10);
      }
    }

    // Filter by target audience
    if (targetAudience && targetAudience !== 'ALL') {
      contents = contents.filter(
        (c) => c.targetAudience === 'ALL' || c.targetAudience === targetAudience
      );
    }

    // Search query
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      contents = contents.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
          (c.content && c.content.toLowerCase().includes(q)) ||
          (c.keyTakeaways && c.keyTakeaways.some((k) => k.toLowerCase().includes(q)))
      );
    }

    // Apply translations
    const translatedContents = contents.map((c) => applyContentTranslation(c, language as string));

    // Get user progress & favorites map
    const userProgress = db.get('educationalProgress').filter((p) => p.userId === userId);
    const userFavorites = new Set(
      db
        .get('educationalFavorites')
        .filter((f) => f.userId === userId && f.targetType === 'content')
        .map((f) => f.targetId)
    );

    const progressMap = new Map<string, EducationalProgress>();
    for (const p of userProgress) {
      if (p.targetType === 'content') {
        progressMap.set(p.targetId, p);
      }
    }

    // Attach user status
    let enriched = translatedContents.map((item) => {
      const p = progressMap.get(item.id);
      return {
        ...item,
        isFavorite: userFavorites.has(item.id),
        userStatus: p ? p.status : 'not_started',
        progressPercentage: p ? p.progressPercentage : 0,
        quizScore: p?.quizScore ?? null,
      };
    });

    // If recommendedForMe is set, filter or sort by relevance
    if (recommendedForMe === 'true') {
      const recs = EducationRecommendationService.getRecommendationsForUser(userId);
      const recIds = new Set(recs.map((r) => r.targetId));
      enriched = enriched.filter((c) => recIds.has(c.id));
    }

    return res.json({
      contents: enriched,
      total: enriched.length,
      language,
    });
  } catch (err) {
    console.error('Error fetching educational contents:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des contenus éducatifs.' });
  }
});

// -------------------------------------------------------------
// 2. GET SINGLE CONTENT BY ID OR SLUG
// -------------------------------------------------------------
router.get('/contents/:idOrSlug', (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const { language = 'fr' } = req.query;
    const userId = getUserId(req);

    const contents = db.get('educationalContents');
    const rawContent = contents.find((c) => c.slug === idOrSlug || c.id === idOrSlug);

    if (!rawContent) {
      return res.status(404).json({ error: 'Contenu éducatif introuvable.' });
    }

    const content = applyContentTranslation(rawContent, language as string);

    // Get user progress & favorite
    const p = db
      .get('educationalProgress')
      .find((item) => item.userId === userId && item.targetId === rawContent.id && item.targetType === 'content');

    const isFavorite = db
      .get('educationalFavorites')
      .some((f) => f.userId === userId && f.targetId === rawContent.id && f.targetType === 'content');

    // Auto-record history view
    const historyList = db.get('educationalHistory');
    historyList.unshift({
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      contentId: rawContent.id,
      viewedAt: new Date().toISOString(),
    });
    // Keep last 100 history items
    if (historyList.length > 200) {
      historyList.pop();
    }
    db.save();

    return res.json({
      content: {
        ...content,
        isFavorite,
        userStatus: p ? p.status : 'not_started',
        progressPercentage: p ? p.progressPercentage : 0,
        quizScore: p?.quizScore ?? null,
        exerciseResponses: p?.exerciseResponses ?? null,
      },
    });
  } catch (err) {
    console.error('Error fetching single content:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement du contenu.' });
  }
});

// -------------------------------------------------------------
// 3. GET ALL 10 EDUCATIONAL PATHS
// -------------------------------------------------------------
router.get('/paths', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const paths = db.get('educationalPaths');
    const allContents = db.get('educationalContents');
    const contentMap = new Map(allContents.map((c) => [c.id, c]));

    const userProgress = db.get('educationalProgress').filter((p) => p.userId === userId);
    const pathProgressMap = new Map(
      userProgress.filter((p) => p.targetType === 'path').map((p) => [p.targetId, p])
    );
    const contentProgressMap = new Map(
      userProgress.filter((p) => p.targetType === 'content').map((p) => [p.targetId, p])
    );

    const userFavorites = new Set(
      db
        .get('educationalFavorites')
        .filter((f) => f.userId === userId && f.targetType === 'path')
        .map((f) => f.targetId)
    );

    const enrichedPaths = paths.map((path) => {
      const p = pathProgressMap.get(path.id);
      const isFav = userFavorites.has(path.id);

      // Compute step-by-step completion
      const steps = path.contentIds.map((cid) => {
        const item = contentMap.get(cid);
        const itemProg = contentProgressMap.get(cid);
        return {
          id: cid,
          title: item?.title || cid,
          contentType: item?.contentType || 'article',
          estimatedMinutes: item?.estimatedMinutes || item?.readTimeMinutes || 5,
          completed: itemProg?.status === 'completed',
        };
      });

      const completedCount = steps.filter((s) => s.completed).length;
      const totalSteps = steps.length;
      const calculatedPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

      return {
        ...path,
        steps,
        totalSteps,
        completedSteps: completedCount,
        progressPercentage: calculatedPercentage,
        status: calculatedPercentage === 100 ? 'completed' : calculatedPercentage > 0 ? 'in_progress' : 'not_started',
        isFavorite: isFav,
      };
    });

    return res.json({ paths: enrichedPaths.sort((a, b) => a.order - b.order) });
  } catch (err) {
    console.error('Error loading educational paths:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des parcours.' });
  }
});

// -------------------------------------------------------------
// 4. GET SINGLE PATH BY ID OR SLUG
// -------------------------------------------------------------
router.get('/paths/:idOrSlug', (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const userId = getUserId(req);

    const paths = db.get('educationalPaths');
    const path = paths.find((p) => p.id === idOrSlug || p.slug === idOrSlug);

    if (!path) {
      return res.status(404).json({ error: 'Parcours introuvable.' });
    }

    const allContents = db.get('educationalContents');
    const contentMap = new Map(allContents.map((c) => [c.id, c]));

    const userProgress = db.get('educationalProgress').filter((p) => p.userId === userId);
    const contentProgressMap = new Map(
      userProgress.filter((p) => p.targetType === 'content').map((p) => [p.targetId, p])
    );

    const steps = path.contentIds.map((cid, index) => {
      const item = contentMap.get(cid);
      const itemProg = contentProgressMap.get(cid);
      return {
        stepNumber: index + 1,
        id: cid,
        slug: item?.slug || cid,
        title: item?.title || cid,
        subtitle: item?.subtitle || '',
        summary: item?.summary || '',
        category: item?.category || path.category,
        contentType: item?.contentType || 'article',
        estimatedMinutes: item?.estimatedMinutes || item?.readTimeMinutes || 5,
        completed: itemProg?.status === 'completed',
        progressPercentage: itemProg?.progressPercentage || 0,
      };
    });

    const completedSteps = steps.filter((s) => s.completed).length;
    const progressPercentage = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
    const nextStep = steps.find((s) => !s.completed) || steps[0];

    return res.json({
      path: {
        ...path,
        steps,
        totalSteps: steps.length,
        completedSteps,
        progressPercentage,
        nextStep,
      },
    });
  } catch (err) {
    console.error('Error fetching single path:', err);
    return res.status(500).json({ error: 'Erreur lors du chargement du parcours.' });
  }
});

// -------------------------------------------------------------
// 5. GET RECOMMENDATIONS (Tailored to Profile & Goals)
// -------------------------------------------------------------
router.get('/recommendations', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const recommendations = EducationRecommendationService.getRecommendationsForUser(userId);
    return res.json({ recommendations });
  } catch (err) {
    console.error('Error getting recommendations:', err);
    return res.status(500).json({ error: 'Erreur recommandations éducatives.' });
  }
});

// -------------------------------------------------------------
// 6. GET USER OVERALL EDUCATION PROGRESS
// -------------------------------------------------------------
router.get('/user-progress', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const progress = db.get('educationalProgress').filter((p) => p.userId === userId);
    const allContents = db.get('educationalContents');
    const allPaths = db.get('educationalPaths');

    const completedContents = progress.filter(
      (p) => p.targetType === 'content' && p.status === 'completed'
    );
    const completedQuizzes = progress.filter(
      (p) => p.targetType === 'content' && p.quizScore !== null && p.quizScore !== undefined
    );
    const completedExercises = progress.filter(
      (p) => p.targetType === 'content' && p.exerciseResponses !== null && p.exerciseResponses !== undefined
    );

    const completedPathIds = new Set(
      progress.filter((p) => p.targetType === 'path' && p.status === 'completed').map((p) => p.targetId)
    );

    const stats = {
      totalContentsCompleted: completedContents.length,
      totalContentsAvailable: allContents.length,
      pathsCompleted: completedPathIds.size,
      totalPathsAvailable: allPaths.length,
      quizzesTaken: completedQuizzes.length,
      exercisesCompleted: completedExercises.length,
      completionRate: Math.round((completedContents.length / Math.max(allContents.length, 1)) * 100),
    };

    return res.json({ progress, stats });
  } catch (err) {
    console.error('Error getting user progress:', err);
    return res.status(500).json({ error: 'Erreur progression utilisateur.' });
  }
});

// -------------------------------------------------------------
// 7. SAVE / UPDATE USER PROGRESS (Content or Path)
// -------------------------------------------------------------
router.post('/user-progress', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const {
      targetType = 'content',
      targetId,
      status = 'completed',
      progressPercentage = 100,
      quizScore,
      quizTotal,
      exerciseResponses,
    } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: 'targetId est obligatoire.' });
    }

    const progressList = db.get('educationalProgress');
    let entry = progressList.find(
      (p) => p.userId === userId && p.targetId === targetId && p.targetType === targetType
    );

    const now = new Date().toISOString();

    if (!entry) {
      entry = {
        id: `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        targetType,
        targetId,
        status,
        progressPercentage: Number(progressPercentage),
        lastReadAt: now,
        startedAt: now,
        completedAt: status === 'completed' ? now : null,
        quizScore: quizScore !== undefined ? Number(quizScore) : null,
        quizTotal: quizTotal !== undefined ? Number(quizTotal) : null,
        exerciseResponses: exerciseResponses || null,
      };
      progressList.push(entry);
    } else {
      entry.status = status;
      entry.progressPercentage = Number(progressPercentage);
      entry.lastReadAt = now;
      if (status === 'completed' && !entry.completedAt) {
        entry.completedAt = now;
      }
      if (quizScore !== undefined) {
        entry.quizScore = Number(quizScore);
      }
      if (quizTotal !== undefined) {
        entry.quizTotal = Number(quizTotal);
      }
      if (exerciseResponses) {
        entry.exerciseResponses = exerciseResponses;
      }
    }

    // Also update backward-compatible userEducationProgress
    const legacyList = db.get('userEducationProgress');
    let legacy = legacyList.find((p) => p.userId === userId && p.contentId === targetId);
    if (!legacy) {
      legacy = {
        id: `leg_${Date.now()}`,
        userId,
        contentId: targetId,
        status: status === 'completed' ? 'completed' : 'started',
        isFavorite: false,
        progressPercent: Number(progressPercentage),
        completedAt: status === 'completed' ? now : undefined,
        updatedAt: now,
      };
      legacyList.push(legacy);
    } else {
      legacy.status = status === 'completed' ? 'completed' : 'started';
      legacy.progressPercent = Number(progressPercentage);
      if (status === 'completed') legacy.completedAt = now;
      legacy.updatedAt = now;
    }

    // Check if completing this content completed any paths!
    const paths = db.get('educationalPaths');
    const pathsContainingContent = paths.filter((p) => p.contentIds.includes(targetId));

    for (const path of pathsContainingContent) {
      const allCompleted = path.contentIds.every((cid) => {
        if (cid === targetId && status === 'completed') return true;
        const pItem = progressList.find(
          (p) => p.userId === userId && p.targetId === cid && p.targetType === 'content'
        );
        return pItem?.status === 'completed';
      });

      if (allCompleted) {
        let pathProg = progressList.find(
          (p) => p.userId === userId && p.targetId === path.id && p.targetType === 'path'
        );
        if (!pathProg) {
          progressList.push({
            id: `prog_path_${Date.now()}`,
            userId,
            targetType: 'path',
            targetId: path.id,
            status: 'completed',
            progressPercentage: 100,
            startedAt: now,
            completedAt: now,
            lastReadAt: now,
          });
        } else {
          pathProg.status = 'completed';
          pathProg.progressPercentage = 100;
          pathProg.completedAt = now;
          pathProg.lastReadAt = now;
        }
      }
    }

    db.save();

    return res.json({ success: true, progress: entry });
  } catch (err) {
    console.error('Error updating progress:', err);
    return res.status(500).json({ error: 'Erreur enregistrement de la progression.' });
  }
});

// -------------------------------------------------------------
// 8. FAVORITES (GET & TOGGLE)
// -------------------------------------------------------------
router.get('/favorites', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const favorites = db.get('educationalFavorites').filter((f) => f.userId === userId);
    return res.json({ favorites });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement favoris.' });
  }
});

router.post('/favorites/toggle', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { targetId, targetType = 'content' } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: 'targetId requis.' });
    }

    const favorites = db.get('educationalFavorites');
    const existingIndex = favorites.findIndex(
      (f) => f.userId === userId && f.targetId === targetId && f.targetType === targetType
    );

    let isFavorite = false;
    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
      isFavorite = false;
    } else {
      favorites.push({
        id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        targetType,
        targetId,
        createdAt: new Date().toISOString(),
      });
      isFavorite = true;
    }

    // Sync legacy userEducationProgress
    const legacy = db
      .get('userEducationProgress')
      .find((p) => p.userId === userId && p.contentId === targetId);
    if (legacy) {
      legacy.isFavorite = isFavorite;
    }

    db.save();
    return res.json({ success: true, isFavorite });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur modification favori.' });
  }
});

// -------------------------------------------------------------
// 9. READING HISTORY
// -------------------------------------------------------------
router.get('/history', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const history = db
      .get('educationalHistory')
      .filter((h) => h.userId === userId)
      .slice(0, 50);

    const contents = db.get('educationalContents');
    const contentMap = new Map(contents.map((c) => [c.id, c]));

    const enrichedHistory = history.map((h) => {
      const c = contentMap.get(h.contentId);
      return {
        ...h,
        title: c?.title || 'Contenu éducatif',
        category: c?.category,
        estimatedMinutes: c?.estimatedMinutes || c?.readTimeMinutes || 3,
        coverIcon: c?.coverIcon,
      };
    });

    return res.json({ history: enrichedHistory });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur historique de lecture.' });
  }
});

// -------------------------------------------------------------
// 10. EXERCISE JOURNAL SYNC (Link Module 6 Exercise to Module 4 Journal!)
// -------------------------------------------------------------
router.post('/exercise/journal-sync', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { exerciseId, exerciseTitle, summaryNote, responses } = req.body;

    if (!exerciseId || !summaryNote) {
      return res.status(400).json({ error: 'exerciseId et summaryNote sont requis.' });
    }

    const now = new Date().toISOString();
    const dateStr = now.split('T')[0];

    // Format the note text with responses if available
    let formattedText = `📘 **Exercice Pratique : ${exerciseTitle || 'Éducation'}**\n\n${summaryNote}\n`;

    if (responses && typeof responses === 'object') {
      formattedText += `\n*Détails enregistrés :*\n`;
      for (const [key, val] of Object.entries(responses)) {
        if (val) {
          formattedText += `- **${key}** : ${val}\n`;
        }
      }
    }

    // Save directly to Module 4 personalNotes!
    const personalNotes = db.get('personalNotes');
    const newNote: PersonalNote = {
      id: `pnote_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      dateTime: now,
      date: dateStr,
      time: now.split('T')[1].substring(0, 5),
      title: `Exercice : ${exerciseTitle || 'Pratique'}`,
      content: formattedText,
      tags: ['exercice_pratique', 'education', 'module_6'],
      createdAt: now,
      updatedAt: now,
    };

    personalNotes.unshift(newNote);

    // Also mark the exercise as completed in user progress
    const progressList = db.get('educationalProgress');
    let p = progressList.find(
      (item) => item.userId === userId && item.targetId === exerciseId && item.targetType === 'content'
    );
    if (!p) {
      progressList.push({
        id: `prog_ex_${Date.now()}`,
        userId,
        targetType: 'content',
        targetId: exerciseId,
        status: 'completed',
        progressPercentage: 100,
        lastReadAt: now,
        startedAt: now,
        completedAt: now,
        exerciseResponses: responses || null,
      });
    } else {
      p.status = 'completed';
      p.progressPercentage = 100;
      p.completedAt = now;
      p.exerciseResponses = responses || null;
    }

    db.save();

    return res.json({
      success: true,
      message: 'Exercice enregistré avec succès dans votre Journal de bord (Module 4) !',
      noteId: newNote.id,
    });
  } catch (err) {
    console.error('Error syncing exercise to journal:', err);
    return res.status(500).json({ error: 'Erreur synchronisation avec le journal.' });
  }
});

// -------------------------------------------------------------
// 11. ENCYCLOPEDIA (CANNABINOIDS & TERPENES)
// -------------------------------------------------------------
router.get('/cannabinoids', (_req: Request, res: Response) => {
  try {
    const cannabinoids = db.get('cannabinoids');
    return res.json({ cannabinoids });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement cannabinoïdes.' });
  }
});

router.get('/terpenes', (_req: Request, res: Response) => {
  try {
    const terpenes = db.get('terpenes');
    return res.json({ terpenes });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur chargement terpènes.' });
  }
});

export default router;
