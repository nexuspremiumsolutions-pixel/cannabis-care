import React from 'react';
import { THCStatus, CBDStatus, PrimaryPath } from '../../types/entities';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  Calendar,
  Heart,
  TrendingDown,
  ShieldCheck,
  Moon,
  MessageSquare,
  Award,
} from 'lucide-react';

interface StepSummaryProps {
  thcStatus: THCStatus;
  cbdStatus: CBDStatus;
  thcGoal: string;
  nickname: string;
  trackedCategories: string[];
  isSubmitting: boolean;
  onConfirm: () => void;
}

export const StepSummary: React.FC<StepSummaryProps> = ({
  thcStatus,
  cbdStatus,
  thcGoal,
  nickname,
  trackedCategories,
  isSubmitting,
  onConfirm,
}) => {
  // Determine Primary Path
  let pathTitle = 'Bien-être Général & Prévention';
  let pathDesc = 'Parcours orienté hygiène de vie, sommeil et repères éducatifs fiables.';
  let pathBadge = 'Bien-être';

  if (thcStatus === THCStatus.CURRENT_USER) {
    if (thcGoal === 'quit_complete') {
      pathTitle = 'Accompagnement vers l’Arrêt Complet';
      pathDesc = 'Plan d’action structuré, suivi des déclencheurs et valorisation continue de chaque jour d’abstinence.';
      pathBadge = 'Arrêt THC';
    } else if (thcGoal === 'reduce') {
      pathTitle = 'Réduction Progressive & Maîtrise';
      pathDesc = 'Objectifs graduels, espacement des prises et suivi transparent des économies réalisées.';
      pathBadge = 'Réduction THC';
    } else {
      pathTitle = 'Observation & Compréhension';
      pathDesc = 'Identification des contextes de consommation et analyse neutre de vos habitudes.';
      pathBadge = 'Observation';
    }
  } else if (thcStatus === THCStatus.FORMER_USER) {
    pathTitle = 'Consolidation & Maintien des Acquis';
    pathDesc = 'Célébration des jours sans consommation, gestion du stress et prévention des rechutes.';
    pathBadge = 'Maintien';
  } else if (cbdStatus === CBDStatus.CURRENT_USER) {
    pathTitle = 'Routine Bien-être & Espace CBD';
    pathDesc = 'Suivi des produits, évaluation des ressentis (sommeil, détente) et repères de traçabilité.';
    pathBadge = 'CBD & Relaxation';
  }

  // Active Recommended Modules
  const modules = [
    {
      title: 'Journal de bord personnalisé',
      desc: 'Saisie quotidienne simplifiée de vos ressentis, envies et consommations éventuelles.',
      icon: Calendar,
      active: true,
    },
    {
      title: 'Objectifs & Jalons comportementaux',
      desc: 'Visualisation de votre trajectoire personnalisée avec badges de progression.',
      icon: Award,
      active: true,
    },
    {
      title: 'Réduction des risques & Guide sanitaire',
      desc: 'Informations vérifiées, alternatives douces et numéros d’écoute gratuits.',
      icon: ShieldCheck,
      active: true,
    },
    {
      title: 'Suivi du sommeil & hygiène de vie',
      desc: 'Graphiques de récupération, régularité et impact sur votre vitalité quotidienne.',
      icon: Moon,
      active: trackedCategories.includes('sleep') || true,
    },
    {
      title: 'Assistant IA d’accompagnement Nexus',
      desc: 'Réponses bienveillantes, techniques de respiration et stratégies face aux envies.',
      icon: MessageSquare,
      active: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Étape 7 sur 7 — Synthèse de votre profil personnalisé
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Votre espace CANNABIS CARE est prêt, {nickname || 'Bienvenue'} !
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Voici le récapitulatif de votre profil d’accompagnement et des modules spécialement configurés pour vous.
        </p>
      </div>

      {/* Path highlight card */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-400">
              Profil d’accompagnement activé
            </span>
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
              {pathBadge}
            </span>
          </div>
          <h4 className="text-xl font-extrabold text-white tracking-tight">{pathTitle}</h4>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{pathDesc}</p>
        </div>
      </div>

      {/* Recommended modules grid */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Modules et fonctionnalités recommandés pour vous
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modules.map((m, idx) => {
            const IconComp = m.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                  <IconComp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal mt-0.5">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action button */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Finalisation de votre profil...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Accéder à mon espace personnalisé</span>
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
