import React, { useState } from 'react';
import {
  X,
  Compass,
  Target,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { THCReductionPlan, ReductionPlanStep } from '../../types/entities';

interface ReductionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  token: string | null;
  currentPlan?: THCReductionPlan | null;
}

export const ReductionPlanModal: React.FC<ReductionPlanModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  token,
  currentPlan,
}) => {
  const [startDate, setStartDate] = useState<string>(
    currentPlan?.startDate || new Date().toISOString().split('T')[0]
  );
  const [targetDate, setTargetDate] = useState<string>(
    currentPlan?.targetDate ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [baselineFrequency, setBaselineFrequency] = useState<string>(
    currentPlan?.baselineFrequency || 'quotidienne'
  );
  const [baselineQuantity, setBaselineQuantity] = useState<number>(
    currentPlan?.baselineQuantity ?? 3
  );
  const [quantityUnit, setQuantityUnit] = useState<'joints' | 'g' | 'sessions' | 'puffs' | 'other'>(
    currentPlan?.quantityUnit || 'joints'
  );
  const [targetFrequency, setTargetFrequency] = useState<string>(
    currentPlan?.targetFrequency || 'occasionnelle'
  );
  const [targetQuantity, setTargetQuantity] = useState<number>(
    currentPlan?.targetQuantity ?? 0
  );
  const [strategy, setStrategy] = useState<'progressive' | 'flexible' | 'observation-first' | 'custom'>(
    currentPlan?.strategy || 'progressive'
  );

  const [steps, setSteps] = useState<ReductionPlanStep[]>(
    currentPlan?.intermediateSteps || [
      {
        stepNumber: 1,
        label: 'Palier 1 : Observation & Diminution de 30%',
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        targetQuantity: 2,
        isAchieved: false,
      },
      {
        stepNumber: 2,
        label: 'Palier 2 : Soirées sélectionnées (week-end uniquement ou 1/2)',
        targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        targetQuantity: 1,
        isAchieved: false,
      },
      {
        stepNumber: 3,
        label: 'Palier 3 : Autonomie complète / Cible finale',
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        targetQuantity: 0,
        isAchieved: false,
      },
    ]
  );

  const [notes, setNotes] = useState<string>(currentPlan?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddStep = () => {
    const nextNum = steps.length + 1;
    const newStep: ReductionPlanStep = {
      stepNumber: nextNum,
      label: `Palier ${nextNum} personnalisé`,
      targetDate: new Date(Date.now() + nextNum * 7 * 86400000).toISOString().split('T')[0],
      targetQuantity: Math.max(0, targetQuantity),
      isAchieved: false,
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated.map((s, idx) => ({ ...s, stepNumber: idx + 1 })));
  };

  const handleStepChange = (index: number, field: keyof ReductionPlanStep, val: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: val };
    setSteps(updated);
  };

  const handleAutoGenerateSteps = () => {
    const base = Number(baselineQuantity) || 3;
    const target = Number(targetQuantity) || 0;
    const diff = base - target;

    const step1Qty = Math.max(target, Math.round(base - diff * 0.35));
    const step2Qty = Math.max(target, Math.round(base - diff * 0.7));

    const s1Date = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const s2Date = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const s3Date = targetDate;

    setSteps([
      {
        stepNumber: 1,
        label: `Palier 1 : Réduction initiale à max ${step1Qty} ${quantityUnit}/jour`,
        targetDate: s1Date,
        targetQuantity: step1Qty,
        isAchieved: false,
      },
      {
        stepNumber: 2,
        label: `Palier 2 : Consolidation à max ${step2Qty} ${quantityUnit}/jour`,
        targetDate: s2Date,
        targetQuantity: step2Qty,
        isAchieved: false,
      },
      {
        stepNumber: 3,
        label: `Palier 3 : Cible finale (${target} ${quantityUnit}/jour)`,
        targetDate: s3Date,
        targetQuantity: target,
        isAchieved: false,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/thc-journey/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          targetDate,
          baselineFrequency,
          baselineQuantity: Number(baselineQuantity),
          quantityUnit,
          targetFrequency,
          targetQuantity: Number(targetQuantity),
          strategy,
          intermediateSteps: steps,
          notes,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors de l’enregistrement du plan.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">
                Programme Personnalisé
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {currentPlan ? 'Ajuster mon Plan de Réduction' : 'Construire mon Plan de Réduction THC'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Strategy Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Stratégie globale choisie :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'progressive', title: 'Progressive', desc: 'Paliers hebdomadaires réguliers' },
                { id: 'flexible', title: 'Flexible', desc: 'Gestion par budget / quotas' },
                { id: 'observation-first', title: 'Observation', desc: 'Noter 7j avant de réduire' },
                { id: 'custom', title: 'Sur Mesure', desc: 'Dates et étapes manuelles' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategy(s.id as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    strategy === s.id
                      ? 'border-teal-700 bg-teal-50/80 text-teal-950 font-semibold ring-1 ring-teal-700'
                      : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                  }`}
                >
                  <span className="font-bold block mb-0.5">{s.title}</span>
                  <span className="text-[10px] text-slate-500">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Baseline vs Target Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Baseline */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                1. Point de départ (Baseline)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Volume habituel :</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={baselineQuantity}
                    onChange={(e) => setBaselineQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Unité :</label>
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold"
                  >
                    <option value="joints">Joints / jour</option>
                    <option value="g">Grammes / jour</option>
                    <option value="sessions">Sessions / jour</option>
                    <option value="puffs">Bouffées / jour</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 text-xs block mb-1">Fréquence initiale :</label>
                <input
                  type="text"
                  value={baselineFrequency}
                  onChange={(e) => setBaselineFrequency(e.target.value)}
                  placeholder="Ex : Quotidienne (soir)"
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Target */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 block">
                2. Objectif Cible
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-semibold text-teal-900 block mb-1">Cible visée :</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-white border border-teal-300 text-teal-950 font-black"
                  />
                </div>
                <div>
                  <label className="font-semibold text-teal-900 block mb-1">Unité :</label>
                  <input
                    type="text"
                    disabled
                    value={`${quantityUnit} / jour`}
                    className="w-full p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-teal-900 text-xs block mb-1">Fréquence cible :</label>
                <input
                  type="text"
                  value={targetFrequency}
                  onChange={(e) => setTargetFrequency(e.target.value)}
                  placeholder="Ex : 0 (arrêt complet) ou 1x/semaine"
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Dates & Auto-steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Date de démarrage du plan :</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Date cible estimée :</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
              />
            </div>
          </div>

          {/* Intermediate Steps Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Étapes et Paliers Intermédiaires
                </h4>
                <p className="text-[11px] text-slate-500">
                  Découpez votre transition en étapes réalistes pour consolider chaque victoire.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerateSteps}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Calculer les paliers</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Ajouter un palier"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-900 font-black flex items-center justify-center text-xs shrink-0">
                      {step.stepNumber}
                    </span>
                    <input
                      type="text"
                      value={step.label}
                      onChange={(e) => handleStepChange(idx, 'label', e.target.value)}
                      className="flex-1 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[11px]">Max :</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={step.targetQuantity}
                        onChange={(e) => handleStepChange(idx, 'targetQuantity', parseFloat(e.target.value) || 0)}
                        className="w-16 p-1 rounded-lg bg-slate-50 border border-slate-200 text-center font-bold"
                      />
                      <span className="text-slate-500 text-[11px]">{quantityUnit}</span>
                    </div>

                    <input
                      type="date"
                      value={step.targetDate}
                      onChange={(e) => handleStepChange(idx, 'targetDate', e.target.value)}
                      className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    />

                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Supprimer ce palier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold text-slate-700 text-xs block mb-1">
              Engagements ou motivations personnelles pour ce plan :
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex : Pour retrouver un sommeil plus récupérateur et économiser pour mes projets..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-teal-300" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer mon Plan'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
