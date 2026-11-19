import React from 'react';
import { THCStatus, CBDStatus } from '../../types/entities';
import { Shield, Sparkles, Check, HelpCircle } from 'lucide-react';

interface StepSituationProps {
  thcStatus: THCStatus;
  setThcStatus: (status: THCStatus) => void;
  cbdStatus: CBDStatus;
  setCbdStatus: (status: CBDStatus) => void;
  nickname: string;
  setNickname: (name: string) => void;
}

export const StepSituation: React.FC<StepSituationProps> = ({
  thcStatus,
  setThcStatus,
  cbdStatus,
  setCbdStatus,
  nickname,
  setNickname,
}) => {
  const thcOptions = [
    {
      id: THCStatus.NEVER_USED,
      label: "Je n'ai jamais consommé de THC",
      description: "Vous souhaitez vous informer, suivre votre bien-être général ou explorer le CBD.",
      badge: 'Prévention & Bien-être',
    },
    {
      id: THCStatus.FORMER_USER,
      label: "J'en ai déjà consommé mais je n'en consomme plus",
      description: "Vous souhaitez consolider vos acquis, suivre votre progression sans THC ou explorer d'autres approches.",
      badge: 'Maintien & Progression',
    },
    {
      id: THCStatus.CURRENT_USER,
      label: "J'en consomme actuellement",
      description: "Vous souhaitez comprendre vos habitudes, réduire progressivement ou vous faire accompagner.",
      badge: 'Réduction & Observation',
    },
    {
      id: THCStatus.DECLINED,
      label: "Je préfère ne pas répondre à cette question",
      description: "Vous accéderez à un parcours neutre axé sur les habitudes de vie saines et l'information.",
      badge: 'Parcours Neutre',
    },
  ];

  const cbdOptions = [
    {
      id: CBDStatus.CURRENT_USER,
      label: 'Oui, je consomme du CBD',
      description: 'Huiles, fleurs, infusions ou gélules dans le cadre de ma routine bien-être.',
    },
    {
      id: CBDStatus.NEVER_USED,
      label: 'Non, je ne consomme pas de CBD',
      description: 'Vous n’avez jamais utilisé de produits CBD ou dérivés de chanvre.',
    },
    {
      id: CBDStatus.FORMER_USER,
      label: 'Occasionnellement ou par le passé',
      description: 'Consommation ponctuelle ou essais antérieurs de produits bien-être.',
    },
    {
      id: CBDStatus.DECLINED,
      label: 'Je préfère ne pas préciser',
      description: 'Optionnel et sans impact sur l’accès aux modules généraux.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Intro header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Étape 1 sur 7 — Définition de votre situation
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Commençons par faire connaissance
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Vos réponses permettent de configurer un tableau de bord sur mesure. Tout reste strictement confidentiel, sans aucun jugement ni diagnostic médical.
        </p>
      </div>

      {/* Nickname field */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Comment souhaitez-vous être appelé(e) ? (Pseudonyme ou prénom)
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Ex : Alex, Sam, Camille..."
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition"
        />
      </div>

      {/* THC Status Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            Quelle est votre situation concernant le THC ?
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {thcOptions.map((opt) => {
            const isSelected = thcStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setThcStatus(opt.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition flex items-start justify-between cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{opt.label}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{opt.description}</p>
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
      </div>

      {/* CBD Status Selection */}
      <div className="space-y-3 pt-2">
        <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Consommez-vous actuellement des produits à base de CBD ?
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cbdOptions.map((opt) => {
            const isSelected = cbdStatus === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCbdStatus(opt.id)}
                className={`text-left p-3.5 rounded-2xl border-2 transition flex items-start justify-between cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-0.5 pr-2">
                  <span className="font-semibold text-slate-900 text-xs block">{opt.label}</span>
                  <span className="text-[11px] text-slate-500 block leading-tight">{opt.description}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
