import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  HeartHandshake,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
} from 'lucide-react';

interface SlipReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecorded: () => void;
  token: string | null;
}

export const SlipReflectionModal: React.FC<SlipReflectionModalProps> = ({
  isOpen,
  onClose,
  onRecorded,
  token,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(new Date().toTimeString().substring(0, 5));
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('joints');
  const [productType, setProductType] = useState<string>('THC_herb');
  const [context, setContext] = useState<string>('Soirée avec des proches');
  const [trigger, setTrigger] = useState<string>('Pression sociale ou convivialité');
  
  // 4-Step Reflection
  const [whatHappened, setWhatHappened] = useState<string>('Une opportunité ou une impulsion spontanée dans un moment de fatigue.');
  const [triggerDescription, setTriggerDescription] = useState<string>('Fin de semaine chargée et baisse de vigilance.');
  const [futureHelpIdea, setFutureHelpIdea] = useState<string>('Prendre 5 minutes de recul avec la respiration guidée avant de décider.');
  const [nextStepChoice, setNextStepChoice] = useState<'continue_plan' | 'adjust_goal' | 'resume_observation' | 'restart_thc_free_period'>('continue_plan');
  
  const [personalNotes, setPersonalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/thc-journey/slips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          time,
          quantity: Number(quantity),
          unit,
          productType,
          context,
          trigger,
          slipReflection: {
            whatHappened,
            triggerDescription,
            futureHelpIdea,
            nextStepChoice,
          },
          personalNotes,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors de l’enregistrement de l’écart.');
      }

      onRecorded();
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
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">
                Espace Résilience & Apprentissage
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Noter un Écart avec Réflexion Bienveillante
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

        {/* Reassuring Philosophy Banner */}
        <div className="p-4 bg-teal-50/80 border-b border-teal-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-teal-950 space-y-0.5">
            <p className="font-bold">
              Un écart fait partie intégrante du processus de changement.
            </p>
            <p className="text-teal-800">
              Votre parcours ne repart pas à zéro. Vos prises de conscience antérieures restent acquises. Utilisez ce moment pour comprendre ce qui s'est joué.
            </p>
          </div>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          
          {/* Section 1: Facts */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              1. Les Faits Observés
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Date :</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Heure :</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Quantité :</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Unité :</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
                >
                  <option value="joints">Joint(s)</option>
                  <option value="g">Gramme(s)</option>
                  <option value="sessions">Session(s)</option>
                  <option value="puffs">Bouffée(s)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contexte :</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex : Soirée entre amis, seul après une contrariété..."
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Déclencheur pressenti :</label>
                <input
                  type="text"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="Ex : Fatigue, tension, automatisme..."
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 4-Step Compassionate Reflection */}
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Mini-Réflexion Constructive (4 Questions Clés)</span>
            </h3>

            {/* Q1 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                A. Que s'est-il passé précisément dans ce moment ?
              </label>
              <textarea
                rows={2}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder="Racontez brièvement la dynamique de l'instant sans vous juger..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 leading-relaxed"
              />
            </div>

            {/* Q2 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                B. Quel était le déclencheur principal (émotionnel, social ou physique) ?
              </label>
              <textarea
                rows={2}
                value={triggerDescription}
                onChange={(e) => setTriggerDescription(e.target.value)}
                placeholder="Ex : Un pic de stress au travail, le besoin de décompresser vite..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 leading-relaxed"
              />
            </div>

            {/* Q3 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                C. Qu'est-ce qui pourrait m'aider si une situation similaire se reproduit ?
              </label>
              <textarea
                rows={2}
                value={futureHelpIdea}
                onChange={(e) => setFutureHelpIdea(e.target.value)}
                placeholder="Ex : Utiliser le minuteur de 10 min, boire un verre d'eau, sortir marcher..."
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 leading-relaxed"
              />
            </div>

            {/* Q4 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                D. Quelle est votre décision pour la suite de votre parcours ?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    id: 'continue_plan',
                    title: 'Poursuivre mon plan actuel',
                    desc: 'Je continue mes objectifs fixés dès demain sans altérer ma confiance.',
                  },
                  {
                    id: 'adjust_goal',
                    title: 'Ajuster mon objectif',
                    desc: 'Adapter légèrement mes paliers pour une progressivité plus douce.',
                  },
                  {
                    id: 'resume_observation',
                    title: 'Repasser en phase d’observation',
                    desc: 'Prendre quelques jours pour noter sans contrainte ni pression.',
                  },
                  {
                    id: 'restart_thc_free_period',
                    title: 'Relancer une période sans THC',
                    desc: 'Poser un nouveau départ déterminé et bienveillant.',
                  },
                ].map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => setNextStepChoice(choice.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      nextStepChoice === choice.id
                        ? 'border-teal-700 bg-teal-50/70 text-teal-950 font-semibold ring-1 ring-teal-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold block mb-0.5">{choice.title}</span>
                    <span className="text-[11px] text-slate-500">{choice.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Free Note */}
          <div>
            <label className="font-semibold text-slate-700 text-xs block mb-1">
              Note libre ou ressenti général :
            </label>
            <input
              type="text"
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Pensée réconfortante ou mot d’encouragement pour vous-même..."
              className="w-full p-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Help contact */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
            <span>Une écoute sans jugement est accessible 7j/7</span>
            <a
              href="tel:0800231313"
              className="font-bold text-rose-800 hover:text-rose-900 flex items-center gap-1 underline"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Drogues Info Service (0 800 23 13 13)</span>
            </a>
          </div>

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
              <RefreshCw className="w-4 h-4 text-teal-300" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Valider et Continuer mon Parcours'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
