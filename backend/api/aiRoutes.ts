/**
 * Module 7 — AI Assistant & Recommendation API Routes
 * 
 * Secure REST endpoints providing:
 * - Conversational assistant with dynamic context minimization
 * - Multi-conversation management (IDOR protected)
 * - Confirmation-based sensitive actions (e.g. journal writing)
 * - Prioritized multi-dimensional recommendations
 * - User AI settings & GDPR-compliant privacy controls
 */
import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/auth';
import { AIAssistantService } from '../services/aiAssistantService';
import { AIRecommendationService } from '../services/aiRecommendationService';

const router = Router();

// ========================================================
// 1. CONVERSATIONS MANAGEMENT (IDOR PROTECTED)
// ========================================================

// List active conversations for authenticated user
router.get('/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversations = AIAssistantService.getUserConversations(userId);
    return res.json({ conversations });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des conversations.' });
  }
});

// Create a new conversation
router.post('/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, language } = req.body;
    const conversation = AIAssistantService.createConversation(userId, title, language);
    return res.status(201).json({ conversation });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de la conversation.' });
  }
});

// Get a specific conversation and its messages
router.get('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    const conversation = AIAssistantService.getConversation(userId, conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée ou accès non autorisé.' });
    }

    const messages = AIAssistantService.getConversationMessages(userId, conversationId);
    return res.json({ conversation, messages });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement de la conversation.' });
  }
});

// Delete a conversation and its messages (IDOR checked)
router.delete('/conversations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    const success = AIAssistantService.deleteConversation(userId, conversationId);
    if (!success) {
      return res.status(404).json({ error: 'Conversation non trouvée ou accès non autorisé.' });
    }

    return res.json({ success: true, message: 'Conversation supprimée avec succès.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de la conversation.' });
  }
});

// Archive a conversation
router.post('/conversations/:id/archive', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;

    const success = AIAssistantService.archiveConversation(userId, conversationId);
    if (!success) {
      return res.status(404).json({ error: 'Conversation non trouvée ou accès non autorisé.' });
    }

    return res.json({ success: true, message: 'Conversation archivée avec succès.' });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur lors de l'archivage de la conversation." });
  }
});

// Send a message within a conversation
router.post('/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;
    const { content, language } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le contenu du message est requis.' });
    }

    const result = await AIAssistantService.sendMessage(userId, conversationId, content, language);
    return res.json({
      message: result.message,
      conversation: result.conversation,
    });
  } catch (err: any) {
    console.error('Send message error:', err);
    return res.status(err.message?.includes('Limite') ? 429 : 500).json({
      error: err.message || "Erreur lors de l'envoi du message.",
    });
  }
});

// ========================================================
// 2. CONFIRMATION-BASED SENSITIVE ACTIONS (JOURNAL WRITING)
// ========================================================

// Explicit user confirmation to create a journal entry from assistant proposal
router.post('/confirm-action', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { actionType, payload } = req.body;

    if (actionType === 'JOURNAL_ENTRY') {
      const result = AIAssistantService.createJournalEntryFromAssistant(userId, payload || {});
      return res.json(result);
    }

    return res.status(400).json({ error: 'Type d’action non reconnu.' });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur lors de l'exécution de l'action." });
  }
});

// ========================================================
// 3. RECOMMENDATIONS & OBSERVATIONS (MODULES 1-6 INTEGRATION)
// ========================================================

// Get prioritized AI recommendations for user
router.get('/recommendations', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const lang = (req.query.lang as 'fr' | 'en' | 'ar') || 'fr';
    const recommendations = AIRecommendationService.getRecommendationsForUser(userId, lang);
    return res.json({ recommendations });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la génération des recommandations.' });
  }
});

// Get descriptive objective observation from journal data
router.get('/descriptive-observation', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const observation = AIRecommendationService.getDescriptiveObservation(userId);
    return res.json({ observation });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur lors du calcul de l'observation descriptive." });
  }
});

// ========================================================
// 4. USER AI ASSISTANT SETTINGS & PRIVACY CONTROLS
// ========================================================

router.get('/settings', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const settings = AIAssistantService.getOrCreateSettings(userId);
    return res.json({ settings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des paramètres IA.' });
  }
});

router.put('/settings', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const updated = AIAssistantService.updateSettings(userId, req.body || {});
    return res.json({ settings: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres IA.' });
  }
});

// ========================================================
// 5. LEGACY BACKWARD-COMPATIBLE ENDPOINTS (/coach, /analyze-journal)
// ========================================================

router.post('/coach', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { message, language } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message requis.' });
    }

    // Auto-create or get user's primary conversation
    let conversations = AIAssistantService.getUserConversations(userId);
    let conv = conversations[0];
    if (!conv) {
      conv = AIAssistantService.createConversation(userId, undefined, language || 'fr');
    }

    const result = await AIAssistantService.sendMessage(userId, conv.id, message, language);
    return res.json({
      reply: result.message.content,
      disclaimer: result.message.disclaimer,
      metadata: result.message.metadata,
      conversationId: conv.id,
      timestamp: result.message.createdAt,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erreur lors de la communication avec le coach.' });
  }
});

router.post('/analyze-journal', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const obs = AIRecommendationService.getDescriptiveObservation(userId);
    return res.json({
      analysis: `${obs.observationSummary} ${obs.invitationToReflect}`,
      observation: obs,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Erreur d'analyse du journal." });
  }
});

export default router;
