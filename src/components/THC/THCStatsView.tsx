import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Award,
  AlertCircle,
  Clock,
  ShieldCheck,
  Flame,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import {
  TemporalComparison,
  PeriodStats,
  HabitInsight,
} from '../../../backend/services/thcAnalyticsService';
import { Badge, THCTrigger } from '../../types/entities';

interface THCStatsViewProps {
  temporalStats: TemporalComparison | null;
  insights: HabitInsight[];
  triggers: THCTrigger[];
  badges: Badge[];
  budget: {
    setting: { estimatedMonthlySpend?: number; purchaseFrequency?: string };
    estimatedSaved: number;
  };
  totalTHCFreeDays: number;
  onOpenTriggerManager: () => void;
}

export const THCStatsView: React.FC<THCStatsViewProps> = ({
  temporalStats,
  insights,
  triggers,
  badges,
  budget,
  totalTHCFreeDays,
  onOpenTriggerManager,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'thisWeek' | 'thisMonth' | 'last90Days' | 'sinceStart'>('thisWeek');

  const currentStats: PeriodStats | undefined = temporalStats ? temporalStats[selectedPeriod] : undefined;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Statistiques Réelles & Évolution
            </h2>
            <p className="text-xs text-slate-500">
              Calculs rigoureux basés exclusivement sur vos déclarations de journal.
            </p>
          </div>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
          {[
            { id: 'thisWeek', label: '7 derniers jours' },
            { id: 'thisMonth', label: '30 jours' },
            { id: 'last90Days', label: '90 jours' },
            { id: 'sinceStart', label: 'Tout le parcours' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                selectedPeriod === tab.id
                  ? 'bg-white text-teal-900 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics for Selected Period */}
      {currentStats && !currentStats.hasSufficientData ? (
        <div className="p-8 rounded-3xl bg-amber-50/60 border border-amber-200 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-amber-950">Données insuffisantes pour cette période</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            {currentStats.messageIfNotEnough || 'Continuez à enregistrer vos journaux et observations pour générer les comparaisons statistiques fiables.'}
          </p>
        </div>
      ) : currentStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Quantité */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Volume Total Déclaré</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">{currentStats.totalQuantity}</span>
              <span className="text-xs text-slate-500 font-semibold">unités / joints</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Moyenne : <strong className="text-slate-800">{currentStats.avgQuantityPerDay}</strong> / jour sur la période
            </p>
          </div>

          {/* Card 2: Jours sans THC */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Jours Sans Prise</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-900">{currentStats.thcFreeDays}</span>
              <span className="text-xs text-slate-500 font-semibold">jours</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              {currentStats.thcFreeDays > 0 ? 'Journées d’autonomie acquises' : 'Objectifs en cours'}
            </p>
          </div>

          {/* Card 3: Envies gérées */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Envies & Cravings</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">{currentStats.cravingsCount}</span>
              <span className="text-xs text-slate-500 font-semibold">vagues notées</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Intensité moyenne : <strong className="text-slate-800">{currentStats.avgCravingIntensity}/10</strong>
            </p>
          </div>

          {/* Card 4: Économies financières */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Économies Estimées</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-900">{budget.estimatedSaved}</span>
              <span className="text-base font-bold text-emerald-700">€</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Budget de base : {budget.setting.estimatedMonthlySpend || 120} € / mois
            </p>
          </div>

        </div>
      ) : null}

      {/* Insights & Scientific Prudence Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Behavioral Observations */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-teal-800">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Observations Comportementales
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Analyse neutre et sans jugement de vos horaires et contextes déclarés.
          </p>

          <div className="space-y-2.5">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                <div className="space-y-1">
                  <p className="leading-relaxed font-medium">{insight.message}</p>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Confiance : {insight.confidence === 'established' ? 'Confirmée' : 'Préliminaire'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Triggers Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-800">
              <Zap className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Déclencheurs Fréquents
              </h3>
            </div>
            <button
              onClick={onOpenTriggerManager}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
            >
              Gérer ({triggers.length})
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Identifier vos facteurs récurrents permet d'anticiper les moments sensibles.
          </p>

          <div className="space-y-2">
            {triggers.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{t.label}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{t.type}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-teal-900 block">Intensité : {t.intensity}/10</span>
                  <span className="text-[10px] text-slate-500">Noté {t.frequencyCount || 0} fois</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Badges & Milestones Showcase */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-700">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Badges & Réussites Débloqués ({badges.filter((b) => b.unlockedAt || b.earnedAt).length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Valorisation de chaque étape franchie</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((b) => {
            const isUnlocked = Boolean(b.unlockedAt || b.earnedAt);
            return (
              <div
                key={b.id || b.code}
                className={`p-3.5 rounded-2xl border text-center space-y-1.5 transition ${
                  isUnlocked
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center bg-white shadow-2xs">
                  <Award className={`w-5 h-5 ${isUnlocked ? 'text-amber-600' : 'text-slate-400'}`} />
                </div>
                <span className="text-xs font-bold block leading-tight truncate" title={b.title}>
                  {b.title}
                </span>
                <span className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                  {b.description}
                </span>
                {isUnlocked && (
                  <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900">
                    Obtenu ✨
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
