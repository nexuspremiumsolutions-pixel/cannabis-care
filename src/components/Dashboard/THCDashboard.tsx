import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Flame,
  Plus,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Calendar,
  PiggyBank,
  HeartHandshake,
  Compass,
  Layers,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Info,
  PhoneCall,
  Activity,
  ChevronRight,
} from 'lucide-react';
import {
  THCReductionPlan,
  WellnessChallenge,
  THCTrigger,
  Badge,
} from '../../types/entities';
import {
  StreaksResult,
  TemporalComparison,
  HabitInsight,
  PrudenceAlert,
} from '../../../backend/services/thcAnalyticsService';
import { BotanicalWatermark, BotanicalBadge, BotanicalLeafIcon } from '../Common/BotanicalDecor';

import { EmergencyCravingModal } from '../THC/EmergencyCravingModal';
import { SlipReflectionModal } from '../THC/SlipReflectionModal';
import { ReductionPlanModal } from '../THC/ReductionPlanModal';
import { THCConsumptionModal } from '../THC/THCConsumptionModal';
import { THCTriggersManagerModal } from '../THC/THCTriggersManagerModal';
import { THCCalendarView } from '../THC/THCCalendarView';
import { THCStatsView } from '../THC/THCStatsView';
import { HabitsRediscoveryView } from '../THC/HabitsRediscoveryView';
import { useLanguage } from '../../context/LanguageContext';

export const THCDashboard: React.FC<{
  onOpenNewEntry: () => void;
  onNavigateTab: (tab: string) => void;
}> = ({ onOpenNewEntry, onNavigateTab }) => {
  const { token, profile, thcProfile } = useAuth();
  const { t } = useLanguage();

  // Active Sub-view inside THC Hub
  const [subView, setSubView] = useState<'today' | 'stats' | 'calendar' | 'plan' | 'habits'>('today');

  // Backend state
  const [dashboardData, setDashboardData] = useState<{
    streaks: StreaksResult;
    activePlan: THCReductionPlan | null;
    dailyChallenges: WellnessChallenge[];
    userTriggers: THCTrigger[];
    temporalStats: TemporalComparison;
    insights: HabitInsight[];
    prudenceAlerts: PrudenceAlert[];
    userBadges: Badge[];
    budget: {
      setting: { estimatedMonthlySpend?: number; purchaseFrequency?: string };
      estimatedSaved: number;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCravingModalOpen, setIsCravingModalOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
  const [eduRecommendations, setEduRecommendations] = useState<any[]>([]);

  // Fetch complete journey dashboard data
  const fetchDashboard = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/thc-journey/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (e) {
      console.error('Error fetching THC journey dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    async function loadEduRecs() {
      try {
        const res = await fetch('/api/education/recommendations', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setEduRecommendations(data.recommendations || []);
        }
      } catch (e) {
        // silent
      }
    }
    loadEduRecs();
  }, [token]);

  const handleCompleteChallenge = async (challengeId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/thc-journey/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Error completing challenge:', err);
    }
  };

  const handleRefreshChallenges = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/thc-journey/challenges/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Error refreshing challenges:', err);
    }
  };

  const currentPlan = dashboardData?.activePlan;
  const streak = dashboardData?.streaks.currentStreak ?? 0;
  const bestStreak = dashboardData?.streaks.bestStreak ?? 0;
  const totalFreeDays = dashboardData?.streaks.totalTHCFreeDays ?? 0;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner with Quick Actions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 text-white shadow-xl relative overflow-hidden border border-emerald-800/20">
        <BotanicalWatermark position="top-right" size={260} className="text-emerald-400/5 pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
            <BotanicalLeafIcon size={14} className="text-emerald-400" variant="minimal" />
            <span>Parcours de Maîtrise & Réduction THC Bienveillante</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
            Bonjour {profile?.nickname || 'Julien'}, votre espace de liberté & maîtrise
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Approche scientifique non culpabilisante. Objectif : <strong className="text-emerald-300 capitalize">{thcProfile?.primaryGoal === 'reduce' ? 'Réduction progressive' : thcProfile?.primaryGoal === 'stop' ? 'Arrêt durable' : 'Compréhension de mes habitudes'}</strong>. Chaque prise de recul construit une nouvelle autonomie.
          </p>

          {/* Core Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{t('dash_log_consumption', 'Noter une consommation')}</span>
            </button>

            <button
              onClick={() => setIsCravingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md shadow-rose-950/20 cursor-pointer animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t('dash_sos_craving', 'Craving SOS (Anti-Pulsion)')}</span>
            </button>

            <button
              onClick={() => setIsSlipModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition cursor-pointer backdrop-blur-xs"
            >
              <HeartHandshake className="w-4 h-4 text-teal-300" />
              <span>{t('dash_slip', 'Déclarer un écart (sans jugement)')}</span>
            </button>

            <button
              onClick={() => onNavigateTab('coach')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t('nav_care', 'Coach IA Phyto')}</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Prudence Alerts Bar (Scientific & Ethical) */}
      {dashboardData?.prudenceAlerts && dashboardData.prudenceAlerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.prudenceAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                alert.severity === 'high'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === 'high' ? 'text-rose-600' : 'text-amber-600'}`} />
                <div className="space-y-0.5">
                  <span className="font-extrabold uppercase tracking-wider block text-[10px]">
                    {t('Information de Prévention & Prudence')}
                  </span>
                  <p className="font-medium leading-relaxed">{alert.message}</p>
                  {alert.actionRecommendation && (
                    <p className="text-[11px] opacity-80 pt-0.5">
                      Conseil : {alert.actionRecommendation}
                    </p>
                  )}
                </div>
              </div>

              <a
                href="tel:0800231313"
                className="shrink-0 font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-[11px] flex items-center gap-1.5 shadow-2xs"
              >
                <PhoneCall className="w-3 h-3 text-rose-600" />
                <span>0 800 23 13 13</span>
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Sub-Views Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        {[
          { id: 'today', labelKey: 'sub_overview', defaultLabel: 'Vue Rapide & Aujourd’hui', icon: Activity },
          { id: 'stats', labelKey: 'stats_title', defaultLabel: 'Statistiques Réelles', icon: Layers },
          { id: 'calendar', labelKey: 'sub_journal', defaultLabel: 'Calendrier Mensuel', icon: Calendar },
          { id: 'plan', labelKey: 'dash_plan', defaultLabel: 'Plan de Réduction', icon: Compass },
          { id: 'habits', labelKey: 'sub_goals', defaultLabel: 'Redécouvrir mon Quotidien', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{t(tab.labelKey, tab.defaultLabel)}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: TODAY & QUICK OVERVIEW */}
      {subView === 'today' && (
        <div className="space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Current Streak */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>{t('dash_streak', 'Série en Cours')}</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{streak}</span>
                <span className="text-xs text-slate-400 font-medium">{t('jour(s) d\'affilée')}</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                {t('Meilleure série :')} <strong className="text-slate-800">{bestStreak} {t('jour(s)')}</strong>
              </p>
            </div>

            {/* Metric 2: Total THC-Free Days */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>{t('dash_free_days', 'Total Jours Sans THC')}</span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-teal-900">{totalFreeDays}</span>
                <span className="text-xs text-slate-400 font-medium">{t('jours acquis')}</span>
              </div>
              <p className="text-[11px] text-teal-800 font-medium">
                {t('Sur l\'ensemble de votre suivi')}
              </p>
            </div>

            {/* Metric 3: Économies financières */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>{t('dash_savings', 'Économies Estimées')}</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">{dashboardData?.budget.estimatedSaved || 0}</span>
                <span className="text-base font-bold text-slate-700">€</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                {t('Budget préservé')}
              </p>
            </div>

            {/* Metric 4: Envies surmontées */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>{t('Envies Gérées (4D)')}</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">
                  {dashboardData?.temporalStats?.thisMonth?.cravingsCount || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">{t('vagues franchies')}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {t('Chaque envie passe en 10-15 min')}
              </p>
            </div>

          </div>

          {/* Active Plan Progress Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {t('dash_plan', 'Progression du Plan de Réduction')}
                </h3>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
              >
                {currentPlan ? 'Modifier le plan' : 'Créer un plan'}
              </button>
            </div>

            {currentPlan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-semibold block">Point de départ :</span>
                    <span className="text-sm font-black text-slate-900">
                      {currentPlan.baselineQuantity} {currentPlan.quantityUnit}/jour ({currentPlan.baselineFrequency})
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <span className="text-teal-700 font-semibold block">Cible visée :</span>
                    <span className="text-sm font-black text-teal-950">
                      {currentPlan.targetQuantity} {currentPlan.quantityUnit}/jour ({currentPlan.targetFrequency})
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-semibold block">Échéance cible :</span>
                    <span className="text-sm font-black text-slate-900">
                      {currentPlan.targetDate}
                    </span>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                    Paliers Intermédiaires
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {currentPlan.intermediateSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className={`p-3 rounded-2xl border transition ${
                          step.isAchieved
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold">Palier {step.stepNumber}</span>
                          {step.isAchieved && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                              Atteint ✨
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 mb-1">{step.label}</p>
                        <span className="text-[10px] text-slate-400 block">Date cible : {step.targetDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-200 text-center space-y-3">
                <Compass className="w-8 h-8 text-teal-700 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-teal-950">Aucun plan de réduction actif</h4>
                  <p className="text-xs text-teal-800 max-w-md mx-auto">
                    Définissez vos propres étapes, votre volume de départ et votre objectif à votre propre rythme.
                  </p>
                </div>
                <button
                  onClick={() => setIsPlanModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043326] text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Construire mon plan personnalisé</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Micro-Challenge of the day */}
          {dashboardData?.dailyChallenges && dashboardData.dailyChallenges.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Défi Bien-Être du Jour
                  </h3>
                </div>
                <button
                  onClick={() => setSubView('habits')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                >
                  Voir tous les défis
                </button>
              </div>

              {dashboardData.dailyChallenges.slice(0, 1).map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-extrabold text-teal-950 text-sm block">{c.title}</span>
                    <p className="text-teal-900 text-xs leading-relaxed">{c.description}</p>
                  </div>
                  {c.status === 'completed' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Complété</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteChallenge(c.id)}
                      className="px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043326] text-white font-bold transition shadow-2xs cursor-pointer shrink-0"
                    >
                      Valider ce défi
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Module 6: Educational Recommendations Integration */}
          {eduRecommendations.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Parcours & Lectures Recommandés pour vous
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sélectionnés selon vos objectifs et vos besoins actuels.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('education')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Bibliothèque complète</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eduRecommendations.slice(0, 2).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onNavigateTab('education')}
                    className="p-4 rounded-2xl bg-teal-50/40 border border-teal-200/80 hover:bg-teal-50 hover:border-teal-400 transition cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded">
                        {rec.type === 'path' ? 'Parcours Guidé' : 'Article / Guide'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-teal-700">
                      <span>Découvrir</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB-VIEW 2: REAL STATS & ANALYTICS */}
      {subView === 'stats' && (
        <THCStatsView
          temporalStats={dashboardData?.temporalStats || null}
          insights={dashboardData?.insights || []}
          triggers={dashboardData?.userTriggers || []}
          badges={dashboardData?.userBadges || []}
          budget={dashboardData?.budget || { setting: {}, estimatedSaved: 0 }}
          totalTHCFreeDays={totalFreeDays}
          onOpenTriggerManager={() => setIsTriggerModalOpen(true)}
        />
      )}

      {/* SUB-VIEW 3: MONTHLY CALENDAR */}
      {subView === 'calendar' && (
        <THCCalendarView
          token={token}
          onOpenNewEntry={() => setIsLogModalOpen(true)}
          onOpenCravingModal={() => setIsCravingModalOpen(true)}
        />
      )}

      {/* SUB-VIEW 4: REDUCTION PLAN */}
      {subView === 'plan' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Mon Plan de Réduction Personnalisé
              </h3>
              <p className="text-xs text-slate-500">
                Ajustez vos paliers d'évolution et vos cibles en toute autonomie.
              </p>
            </div>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>{currentPlan ? 'Modifier le Plan' : 'Créer un Plan'}</span>
            </button>
          </div>

          {currentPlan ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Stratégie :</span>
                  <span className="text-sm font-extrabold text-slate-900 capitalize">
                    {currentPlan.strategy}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Départ :</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {currentPlan.baselineQuantity} {currentPlan.quantityUnit} / jour
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                  <span className="text-teal-700 font-semibold block">Objectif Final :</span>
                  <span className="text-sm font-extrabold text-teal-950">
                    {currentPlan.targetQuantity} {currentPlan.quantityUnit} / jour
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-semibold block">Date cible :</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {currentPlan.targetDate}
                  </span>
                </div>
              </div>

              {/* Steps Detailed View */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Étapes Intermédiaires Définies ({currentPlan.intermediateSteps.length})
                </h4>
                <div className="space-y-2">
                  {currentPlan.intermediateSteps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-teal-700 text-white font-black flex items-center justify-center text-xs shrink-0">
                          {step.stepNumber}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{step.label}</span>
                          <span className="text-[11px] text-slate-500">Date limite visée : {step.targetDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-teal-900 px-2.5 py-1 rounded-lg bg-teal-100">
                          Max {step.targetQuantity} {currentPlan.quantityUnit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentPlan.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 block">Notes personnelles & engagements :</span>
                  <p className="italic">{currentPlan.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Aucun plan défini pour le moment.</p>
          )}
        </div>
      )}

      {/* SUB-VIEW 5: HABITS REDISCOVERY */}
      {subView === 'habits' && (
        <HabitsRediscoveryView
          challenges={dashboardData?.dailyChallenges || []}
          onCompleteChallenge={handleCompleteChallenge}
          onRefreshChallenges={handleRefreshChallenges}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* MODALS */}
      <EmergencyCravingModal
        isOpen={isCravingModalOpen}
        onClose={() => setIsCravingModalOpen(false)}
        onRecorded={fetchDashboard}
        token={token}
      />

      <SlipReflectionModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        onRecorded={fetchDashboard}
        token={token}
      />

      <ReductionPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSaved={fetchDashboard}
        token={token}
        currentPlan={currentPlan}
      />

      <THCConsumptionModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSaved={fetchDashboard}
        token={token}
      />

      <THCTriggersManagerModal
        isOpen={isTriggerModalOpen}
        onClose={() => setIsTriggerModalOpen(false)}
        onUpdated={fetchDashboard}
        token={token}
        triggers={dashboardData?.userTriggers || []}
      />

    </div>
  );
};
