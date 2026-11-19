import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bot,
  Send,
  Sparkles,
  Shield,
  AlertCircle,
  RefreshCw,
  User,
  Plus,
  Trash2,
  Archive,
  PhoneCall,
  ExternalLink,
  BookOpen,
  Wind,
  CheckCircle2,
  Sliders,
  Languages,
  Info,
  Clock,
  Menu,
  X,
  Compass,
  ArrowRight,
} from 'lucide-react';
import {
  AIConversation,
  AIMessage,
  AIMessageSource,
  AIRecommendation,
  EducationalContent,
} from '../../types/entities';
import { ExerciseModal } from './ExerciseModal';
import { AISettingsModal } from './AISettingsModal';
import { AIRecommendationsWidget } from './AIRecommendationsWidget';
import { HybridCareExplorer } from './HybridCareExplorer';
import { BotanicalHero, BotanicalBadge, BotanicalLeafIcon, BotanicalFlowerIcon } from '../Common/BotanicalDecor';

export const AICoachView: React.FC = () => {
  const { token, profile } = useAuth();

  // State: Tab within Coach (Hybrid Science vs Chat vs Recommendations)
  const [activeSubTab, setActiveSubTab] = useState<'hybrid' | 'chat' | 'recommendations'>('hybrid');

  // State: Conversations
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State: Messaging
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'fr' | 'en' | 'ar'>('fr');

  // State: Action confirmation feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // State: Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [exerciseModalState, setExerciseModalState] = useState<{
    isOpen: boolean;
    exerciseType: 'cardiac_coherence' | 'delay_10_min' | 'breathing_4_7_8';
  }>({
    isOpen: false,
    exerciseType: 'cardiac_coherence',
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isRTL = currentLanguage === 'ar';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load conversations list on mount
  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  // When active conversation changes, load its messages
  useEffect(() => {
    if (token && activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [token, activeConversationId]);

  const loadConversations = async () => {
    if (!token) return;
    setIsConversationsLoading(true);
    try {
      const res = await fetch('/api/ai/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const convList: AIConversation[] = data.conversations || [];
        setConversations(convList);
        if (convList.length > 0 && !activeConversationId) {
          setActiveConversationId(convList[0].id);
          setCurrentLanguage(convList[0].language || 'fr');
        } else if (convList.length === 0) {
          handleCreateConversation();
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.conversation?.language) {
          setCurrentLanguage(data.conversation.language);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleCreateConversation = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/ai/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: currentLanguage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
        setMessages([]);
        setIsSidebarOpen(false);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !window.confirm('Supprimer définitivement cette conversation ?')) return;

    try {
      const res = await fetch(`/api/ai/conversations/${convId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setConversations(remaining);
        if (activeConversationId === convId) {
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
          } else {
            handleCreateConversation();
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleArchiveConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    try {
      const res = await fetch(`/api/ai/conversations/${convId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, archivedAt: new Date().toISOString() } : c))
        );
      }
    } catch (err) {
      console.error('Failed to archive conversation:', err);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input;
    if (!text.trim() || !token || isLoading) return;

    // If no active conversation, create one first
    let convId = activeConversationId;
    if (!convId) {
      try {
        const cRes = await fetch('/api/ai/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language: currentLanguage }),
        });
        const cData = await cRes.json();
        convId = cData.conversation.id;
        setActiveConversationId(convId);
        setConversations((prev) => [cData.conversation, ...prev]);
      } catch {
        return;
      }
    }

    const optimisticUserMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      conversationId: convId!,
      sender: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/ai/conversations/${convId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: text.trim(),
          language: currentLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        // Update conversation title if changed
        if (data.conversation) {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? data.conversation : c))
          );
        }
      } else {
        const errData = await res.json();
        const fallbackMsg: AIMessage = {
          id: `bot_err_${Date.now()}`,
          conversationId: convId!,
          sender: 'assistant',
          content:
            errData.error ||
            "Une difficulté temporaire est survenue. Si vous ressentez une urgence ou un besoin d'écoute immédiat, Drogues Info Service est joignable au 0 800 23 13 13.",
          disclaimer: 'Accompagnement autonome non médical.',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const networkErrMsg: AIMessage = {
        id: `bot_err_${Date.now()}`,
        conversationId: convId!,
        sender: 'assistant',
        content:
          "Erreur de communication avec le serveur. Veuillez vérifier votre connexion. Drogues Info Service (0 800 23 13 13) reste accessible gratuitement.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, networkErrMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async (action: { type: string; payload: any }) => {
    if (!token || isConfirmingAction) return;
    setIsConfirmingAction(true);
    setActionSuccessMsg(null);

    try {
      const res = await fetch('/api/ai/confirm-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actionType: action.type,
          payload: action.payload,
        }),
      });

      if (res.ok) {
        setActionSuccessMsg(
          currentLanguage === 'en'
            ? 'Observation successfully recorded in your journal!'
            : currentLanguage === 'ar'
            ? 'تم حفظ الملاحظة بنجاح في دفتر يومياتك!'
            : 'Observation enregistrée avec succès dans votre journal de bord !'
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to confirm action:', err);
    } finally {
      setIsConfirmingAction(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`space-y-6 ${isRTL ? 'font-sans text-right' : ''}`}
    >
      {/* Thematic Botanical Hero Banner */}
      <BotanicalHero
        title={
          currentLanguage === 'en'
            ? 'Mindful AI Companion & Well-being'
            : currentLanguage === 'ar'
            ? 'المساعد الذكي الشخصي والحد من المخاطر'
            : 'Assistant IA Bien-être & Écoute Active'
        }
        subtitle={
          currentLanguage === 'en'
            ? 'Personalized, confidential guidance to understand your habits and progress at your own pace.'
            : currentLanguage === 'ar'
            ? 'مرافقة شخصية وسرية لفهم عاداتك والتقدم بالوتيرة التي تناسبك.'
            : 'Accompagnement personnalisé et strictement confidentiel pour comprendre vos habitudes, apaiser vos envies et progresser à votre propre rythme.'
        }
        badge={
          currentLanguage === 'en'
            ? 'Hybrid Presentation • Empathetic AI'
            : currentLanguage === 'ar'
            ? 'عرض هجين وذكاء اصطناعي تعاطفي'
            : 'Présentation Hybride • Écoute & Expertise'
        }
        badgeVariant="emerald"
        actionButton={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sub-tab switcher */}
            <div className="bg-emerald-950/70 border border-emerald-500/20 p-1 rounded-2xl flex items-center gap-1 text-xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('hybrid')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'hybrid'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {currentLanguage === 'en'
                    ? 'Infographics & Science'
                    : currentLanguage === 'ar'
                    ? 'إنفوجرافيك والعلوم'
                    : 'Infographies & Expertise'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('chat')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'chat'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentLanguage === 'en'
                    ? 'AI Dialogue'
                    : currentLanguage === 'ar'
                    ? 'حوار ذكي'
                    : 'Dialogue & Écoute'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('recommendations')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'recommendations'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {currentLanguage === 'en'
                    ? 'Somatic Tools'
                    : currentLanguage === 'ar'
                    ? 'أدوات جسدية'
                    : 'Exercices & Outils'}
                </span>
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={currentLanguage}
              onChange={(e) => {
                const newLang = e.target.value as 'fr' | 'en' | 'ar' | 'lu' | 'de' | 'es';
                setCurrentLanguage(newLang);
              }}
              className="bg-emerald-950/70 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-emerald-200 font-semibold focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
              title="Changer de langue"
            >
              <option value="fr" className="bg-slate-900 text-white">🇫🇷 FR</option>
              <option value="en" className="bg-slate-900 text-white">🇬🇧 EN</option>
              <option value="lu" className="bg-slate-900 text-white">🇱🇺 LU</option>
              <option value="de" className="bg-slate-900 text-white">🇩🇪 DE</option>
              <option value="es" className="bg-slate-900 text-white">🇪🇸 ES</option>
              <option value="ar" className="bg-slate-900 text-white">🇸🇦 AR</option>
            </select>

            {/* Settings button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-200 rounded-xl transition cursor-pointer"
              title="Paramètres de l'assistant"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        }
      />

        {/* Global Non-Medical Disclaimer */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              {currentLanguage === 'en'
                ? 'Autonomous behavioral support without medical diagnosis or prescription. In emergency, call 112.'
                : currentLanguage === 'ar'
                ? 'دعم سلوكي مستقل دون تشخيص طبي أو وصفة طبية. في حالات الطوارئ، اتصل بالرقم 112.'
                : 'Accompagnement autonome non médical. Sans diagnostic ni prescription. En cas de détresse psychologique, contactez Drogues Info Service (0 800 23 13 13) ou le 15 / 112.'}
            </span>
          </div>
          <a
            href="tel:0800231313"
            className="hidden sm:inline-flex items-center gap-1 font-bold text-amber-950 underline shrink-0 hover:text-amber-800"
          >
            <PhoneCall className="w-3 h-3" />
            <span>0 800 23 13 13</span>
          </a>
        </div>

      {/* ACTION CONFIRMATION NOTIFICATION */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* MAIN VIEW: HYBRID PRESENTATION, RECOMMENDATIONS OR CHAT */}
      {activeSubTab === 'hybrid' ? (
        <HybridCareExplorer
          onAskCoach={(prompt) => {
            setActiveSubTab('chat');
            handleSend(prompt);
          }}
          onLaunchExercise={(type) => {
            setExerciseModalState({ isOpen: true, exerciseType: type });
          }}
        />
      ) : activeSubTab === 'recommendations' ? (
        <AIRecommendationsWidget
          token={token}
          onLaunchExercise={(type) => {
            setExerciseModalState({ isOpen: true, exerciseType: type });
          }}
          onAskAssistant={(prompt) => {
            setActiveSubTab('chat');
            handleSend(prompt);
          }}
        />
      ) : (
        /* CHAT INTERFACE WITH MULTI-CONVERSATION SIDEBAR */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversation list (Mobile collapsible / Desktop column) */}
          <div
            className={`lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-4 ${
              isSidebarOpen ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {currentLanguage === 'en'
                    ? 'Conversations'
                    : currentLanguage === 'ar'
                    ? 'المحادثات'
                    : 'Conversations'}
                </span>
                <button
                  type="button"
                  onClick={handleCreateConversation}
                  className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  title="Nouvelle conversation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'ar' ? 'جديدة' : 'Nouvelle'}</span>
                </button>
              </div>

              {isConversationsLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">Aucune conversation</div>
              ) : (
                <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`group p-3 rounded-2xl text-xs transition cursor-pointer flex items-center justify-between gap-2 border ${
                          isActive
                            ? 'bg-teal-50/80 border-teal-200 text-teal-950 font-bold'
                            : 'bg-slate-50/50 hover:bg-slate-100 border-transparent text-slate-700'
                        }`}
                      >
                        <div className="truncate flex-1 space-y-0.5">
                          <p className="truncate text-xs">{conv.title}</p>
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile close sidebar button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden w-full py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
            >
              Fermer la liste
            </button>
          </div>

          {/* Chat Container */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[600px]">
            {/* Chat Header Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    {activeConv?.title || 'Nouvelle conversation'}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {currentLanguage === 'en'
                      ? 'Secure & private conversation'
                      : currentLanguage === 'ar'
                      ? 'محادثة آمنة وخاصة'
                      : 'Échange confidentiel & sécurisé'}
                  </span>
                </div>
              </div>

              {/* Interactive Exercise Quick Launchers */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setExerciseModalState({
                      isOpen: true,
                      exerciseType: 'cardiac_coherence',
                    })
                  }
                  className="px-2.5 py-1 rounded-xl bg-teal-100/80 hover:bg-teal-200 text-teal-900 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Lancer la cohérence cardiaque 5-5"
                >
                  <Wind className="w-3 h-3 text-teal-700" />
                  <span className="hidden sm:inline">Cohérence 5-5</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExerciseModalState({
                      isOpen: true,
                      exerciseType: 'delay_10_min',
                    })
                  }
                  className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Différer de 10 minutes"
                >
                  <Clock className="w-3 h-3 text-slate-700" />
                  <span className="hidden sm:inline">Différer 10m</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
                    <Bot className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {currentLanguage === 'en'
                      ? 'Welcome to your supportive space'
                      : currentLanguage === 'ar'
                      ? 'مرحباً بك في مساحتك الداعمة'
                      : 'Bienvenue dans votre espace d’écoute'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {currentLanguage === 'en'
                      ? 'Ask a question, share a moment of urge, or practice a breathing exercise. Everything is autonomous and non-judgmental.'
                      : currentLanguage === 'ar'
                      ? 'اطرح سؤالاً، أو شارك لحظة رغبة ملحة، أو مارس تمرين تنفس. كل شيء يتم باستقلالية ودون أي حكم.'
                      : 'Posez une question, partagez une envie passagère ou explorez des techniques d’apaisement. L’échange reste bienveillant et confidentiel.'}
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isCrisis =
                  msg.metadata?.crisisClassification === 'EMERGENCY' ||
                  msg.metadata?.crisisClassification === 'HUMAN_SUPPORT';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isUser
                        ? isRTL
                          ? 'flex-row'
                          : 'flex-row-reverse'
                        : isRTL
                        ? 'flex-row-reverse'
                        : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser ? 'bg-teal-700 text-white' : 'bg-slate-900 text-teal-300'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className="space-y-2 max-w-[88%] sm:max-w-lg">
                      {/* Message Bubble */}
                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                          isUser
                            ? 'bg-teal-700 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.content}

                        {/* Timestamp */}
                        <span
                          className={`block text-[10px] mt-2 font-medium ${
                            isUser ? 'text-teal-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* CRISIS / HELPLINE BANNER IF TRIGGERED */}
                      {isCrisis && (
                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2 shadow-xs">
                          <div className="flex items-center gap-2 font-bold">
                            <PhoneCall className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Lignes d’assistance immédiates, gratuites & anonymes :</span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] text-rose-800">
                            <li>
                              📞 <strong>Drogues Info Service</strong> :{' '}
                              <a href="tel:0800231313" className="underline font-bold">
                                0 800 23 13 13
                              </a>{' '}
                              (7j/7, de 8h à 2h)
                            </li>
                            <li>
                              📞 <strong>Numéro National de Prévention du Suicide</strong> :{' '}
                              <a href="tel:3114" className="underline font-bold">
                                3114
                              </a>{' '}
                              (24h/24, 7j/7)
                            </li>
                            <li>
                              🚑 <strong>Urgences Médicales</strong> :{' '}
                              <a href="tel:15" className="underline font-bold">
                                15
                              </a>{' '}
                              ou{' '}
                              <a href="tel:112" className="underline font-bold">
                                112
                              </a>
                            </li>
                          </ul>
                        </div>
                      )}

                      {/* PROPOSED SENSITIVE ACTION CARD (Explicit User Confirmation) */}
                      {msg.metadata?.proposedAction && (
                        <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-950 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>Action proposée par l’assistant :</span>
                          </div>
                          <p className="text-[11px] text-slate-700">
                            {msg.metadata.proposedAction.title ||
                              'Consigner cette observation dans mon journal de bord.'}
                          </p>
                          <button
                            type="button"
                            disabled={isConfirmingAction}
                            onClick={() =>
                              handleConfirmAction(msg.metadata!.proposedAction!)
                            }
                            className="w-full py-2 bg-[#064e3b] hover:bg-[#043326] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isConfirmingAction
                                ? 'Enregistrement...'
                                : 'Confirmer et enregistrer dans mon journal'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* SUGGESTED EXERCISE CHIP */}
                      {msg.metadata?.suggestedExercise && (
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-teal-600 shrink-0" />
                            <span className="font-semibold text-slate-800">
                              Exercice recommandé :{' '}
                              {msg.metadata.suggestedExercise === 'cardiac_coherence'
                                ? 'Cohérence Cardiaque 5-5'
                                : 'Temporisation 10 minutes'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setExerciseModalState({
                                isOpen: true,
                                exerciseType: msg.metadata!.suggestedExercise!,
                              })
                            }
                            className="px-2.5 py-1 bg-[#064e3b] hover:bg-[#043326] text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Démarrer
                          </button>
                        </div>
                      )}

                      {/* RECOMMENDED EDUCATIONAL CONTENTS */}
                      {msg.metadata?.recommendedContents &&
                        msg.metadata.recommendedContents.length > 0 && (
                          <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200 text-xs space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-sky-700" />
                              <span>Fiche éducative vérifiée</span>
                            </span>
                            {msg.metadata.recommendedContents.map((rec) => (
                              <div
                                key={rec.id}
                                className="flex items-center justify-between text-xs text-sky-950 font-medium"
                              >
                                <span className="truncate pr-2">{rec.title}</span>
                                <span className="text-[10px] text-sky-700 shrink-0">
                                  {rec.readingTimeMinutes || 3} min
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* SCIENTIFIC SOURCES REFERENCES */}
                      {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-100/70 border border-slate-200 text-[11px] space-y-1 text-slate-600">
                          <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 block">
                            Sources scientifiques & institutionnelles :
                          </span>
                          {msg.metadata.sources.map((src, i) => (
                            <div key={i} className="flex items-baseline gap-1.5">
                              <span className="text-teal-700 font-bold">•</span>
                              <span>
                                {src.organization || src.authors ? `${src.organization || src.authors} : ` : ''}
                                <strong>{src.title}</strong>
                                {src.year ? ` (${src.year})` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center text-xs shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 rounded-tl-xs flex items-center gap-2 shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                    <span>L’assistant formule une réponse attentive et vérifiée...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Prompts */}
            <div className="p-2.5 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 text-xs overflow-x-auto">
              {[
                currentLanguage === 'en'
                  ? 'I have a strong craving right now, help me'
                  : currentLanguage === 'ar'
                  ? 'أشعر برغبة ملحة حالياً، ساعدني'
                  : 'J’ai une forte envie (craving) en ce moment, aide-moi',
                currentLanguage === 'en'
                  ? 'Guide me through a 5-minute breathing exercise'
                  : currentLanguage === 'ar'
                  ? 'أرشدني خلال تمرين تنفس لمدة 5 دقائق'
                  : 'Guide-moi pour un exercice de respiration',
                currentLanguage === 'en'
                  ? 'How does CBD differ from THC?'
                  : currentLanguage === 'ar'
                  ? 'ما هو الفرق بين CBD و THC؟'
                  : 'Quelle est la différence entre CBD et THC ?',
                currentLanguage === 'en'
                  ? 'Help me improve my sleep routine'
                  : currentLanguage === 'ar'
                  ? 'ساعدني في تحسين روتين نومي'
                  : 'Conseils pour retrouver un sommeil réparateur',
              ].map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-600 text-[11px] font-medium transition cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  currentLanguage === 'en'
                    ? 'Ask a question or share how you feel...'
                    : currentLanguage === 'ar'
                    ? 'اطرح سؤالك أو شارك ما تشعر به...'
                    : 'Posez une question ou partagez votre ressenti...'
                }
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-[#064e3b] hover:bg-[#043326] text-white rounded-2xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                title="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ExerciseModal
        isOpen={exerciseModalState.isOpen}
        exerciseType={exerciseModalState.exerciseType}
        onClose={() =>
          setExerciseModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onCompleted={(reflectionText) => {
          if (reflectionText) {
            handleConfirmAction({
              type: 'JOURNAL_ENTRY',
              payload: {
                category: 'exercice',
                context: reflectionText,
                personalNote: reflectionText,
              },
            });
          }
        }}
      />

      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        token={token}
        onClearHistory={() => {
          setConversations([]);
          setMessages([]);
          handleCreateConversation();
        }}
      />
    </div>
  );
};
