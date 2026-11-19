import React from 'react';
import { THCStatus, CBDStatus } from '../../types/entities';
import { Target, Sparkles, Check, Heart, Shield } from 'lucide-react';

interface StepGoalsProps {
  thcStatus: THCStatus;
  thcGoal: string;
  setThcGoal: (goal: string) => void;
  reductionMotivations: string[];
  setReductionMotivations: React.Dispatch<React.SetStateAction<string[]>>;
  cbdStatus: CBDStatus;
}

export const StepGoals: React.FC<StepGoalsProps> = ({
  thcStatus,
  thcGoal,
  setThcGoal,
  reductionMotivations,
  setReductionMotivations,
  cbdStatus,
}) => {
  const goalOptions = [
    {
      id: 'understand',
      label: 'Mieux comprendre mes habitudes et déclencheurs',
      desc: 'Identifier les contextes, moments de stress et émotions associés à la consommation.',
    },
    {
      id: 'reduce',
      label: 'Réduire progressivement ma consommation de THC',
      desc: 'Diminuer la fréquence, les quantités ou espacer les prises à mon propre rythme.',
    },
    {
      id: 'quit_complete',
      label: 'Arrêter complètement le THC',
      desc: 'Mettre en place un plan d’arrêt clair avec suivi des jours sans consommation et conseils ciblés.',
    },
    {
      id: 'prevent_relapse',
      label: 'Consolider mon sevrage & prévenir les rechutes',
      desc: 'Préserver mon équilibre, gérer les envies passagères et maintenir mes progrès.',
    },
    {
      id: 'observe',
      label: 'Observer mes habitudes sans engagement immédiat',
      desc: 'Tenir un journal neutre et suivre mon budget sans pression de changement.',
    },
    {
      id: 'lifestyle',
      label: 'Optimiser mon sommeil et mon hygiène de vie',
      desc: 'Mettre l’accent sur la vitalité, l’activité physique et le bien-être au quotidien.',
    },
  ];

  const motivationList = [
    { id: 'general_health', label: 'Santé respiratoire & générale' },
    { id: 'mental_clarity', label: 'Clarté d’esprit & concentration' },
    { id: 'better_sleep', label: 'Retrouver un sommeil naturel réparateur' },
    { id: 'save_money', label: 'Économies financières / Budget' },
    { id: 'motivation_vitality', label: 'Énergie & dynamisme au réveil' },
    { id: 'work_studies', label: 'Performances professionnelles / études' },
    { id: 'personal_control', label: 'Reprendre le contrôle de mes décisions' },
    { id: 'relationships', label: 'Vie de famille & relations sociales' },
    { id: 'sports_fitness', label: 'Pratique sportive & endurance' },
  ];

  const toggleMotivation = (item: string) => {
    if (reductionMotivations.includes(item)) {
      setReductionMotivations(reductionMotivations.filter((m) => m !== item));
    } else {
      setReductionMotivations([...reductionMotivations, item]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Étape 3 sur 7 — Vos objectifs d’accompagnement
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Quel est votre objectif principal ?
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Votre démarche est personnelle et évolutive. Vous pourrez modifier vos objectifs à tout moment dans votre espace.
        </p>
      </div>

      {/* Main Goal Selection */}
      <div className="space-y-3">
        {goalOptions.map((opt) => {
          const isSelected = thcGoal === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setThcGoal(opt.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-start justify-between cursor-pointer ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="space-y-1 pr-3">
                <span className="font-bold text-slate-900 text-sm block">{opt.label}</span>
                <p className="text-xs text-slate-500 leading-relaxed">{opt.desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                  isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Motivations for Reduction / Quitting */}
      {(thcGoal === 'reduce' || thcGoal === 'quit_complete' || thcGoal === 'prevent_relapse') && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-3">
          <label className="block text-xs font-bold text-slate-900">
            Quelles sont vos motivations principales ? (Sélectionnez tout ce qui résonne pour vous)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {motivationList.map((m) => {
              const isChecked = reductionMotivations.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMotivation(m.id)}
                  className={`p-3 rounded-xl border text-xs text-left font-medium transition flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span>{m.label}</span>
                  {isChecked && <Check className="w-4 h-4 text-teal-300 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
