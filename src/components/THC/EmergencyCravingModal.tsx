import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Clock,
  Wind,
  Droplets,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Heart,
  PhoneCall,
  Save,
  AlertTriangle,
} from 'lucide-react';

interface EmergencyCravingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecorded: () => void;
  token: string | null;
}

export const EmergencyCravingModal: React.FC<EmergencyCravingModalProps> = ({
  isOpen,
  onClose,
  onRecorded,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<'breathe' | 'delay' | 'water' | 'distract'>('delay');
  const [intensity, setIntensity] = useState<number>(7);
  const [context, setContext] = useState<string>('Moment de fin de journée seul');
  const [trigger, setTrigger] = useState<string>('Stress ou surcharge mentale');
  const [copingMethod, setCopingMethod] = useState<string>('breathing_4d');
  const [outcome, setOutcome] = useState<'craving_passed' | 'reduced' | 'consumed' | 'postponed'>('craving_passed');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Delay Timer State
  const [delayMinutes, setDelayMinutes] = useState<number>(10);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // 2. Breathing Exercise State (4s inhale - 4s hold - 6s exhale)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathTimer, setBreathTimer] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathCycles, setBreathCycles] = useState<number>(0);

  // 3. Water checklist
  const [drankWater, setDrankWater] = useState<boolean>(false);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeftSeconds]);

  // Breathing Loop Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'inhale') {
              setBreathPhase('hold');
              return 4;
            } else if (breathPhase === 'hold') {
              setBreathPhase('exhale');
              return 6;
            } else {
              setBreathPhase('inhale');
              setBreathCycles((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathingActive, breathPhase]);

  const handleStartTimer = (mins: number) => {
    setDelayMinutes(mins);
    setTimeLeftSeconds(mins * 60);
    setIsTimerRunning(true);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSaveCravingLog = async (selectedOutcome: 'craving_passed' | 'reduced' | 'consumed' | 'postponed') => {
    if (!token) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/thc-journey/cravings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intensity,
          context,
          trigger,
          durationMinutes: Math.max(1, Math.round((delayMinutes * 60 - timeLeftSeconds) / 60) || 10),
          consumedAfter: selectedOutcome === 'consumed',
          copingMethod: activeTab === 'breathe' ? 'breathing_4d' : activeTab === 'water' ? 'drink_water' : 'timer_delay',
          outcome: selectedOutcome,
          notes,
          occurredAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors de l’enregistrement de l’envie.');
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
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">
                Technique d'Urgence des 4D
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Gérer une Envie Intense (Craving)
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

        {/* 4D Tabs Navigation */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => { setActiveTab('delay'); setCopingMethod('timer_delay'); }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'delay'
                ? 'border-teal-700 text-teal-900 bg-white shadow-xs'
                : 'border-transparent hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>1. Différer (10 min)</span>
          </button>

          <button
            onClick={() => { setActiveTab('breathe'); setCopingMethod('breathing_4d'); }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'breathe'
                ? 'border-teal-700 text-teal-900 bg-white shadow-xs'
                : 'border-transparent hover:bg-slate-100'
            }`}
          >
            <Wind className="w-4 h-4 text-teal-600" />
            <span>2. Respirer (4-4-6)</span>
          </button>

          <button
            onClick={() => { setActiveTab('water'); setCopingMethod('drink_water'); }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'water'
                ? 'border-teal-700 text-teal-900 bg-white shadow-xs'
                : 'border-transparent hover:bg-slate-100'
            }`}
          >
            <Droplets className="w-4 h-4 text-teal-600" />
            <span>3. Boire de l'eau</span>
          </button>

          <button
            onClick={() => { setActiveTab('distract'); setCopingMethod('occupy_activity'); }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer border-b-2 ${
              activeTab === 'distract'
                ? 'border-teal-700 text-teal-900 bg-white shadow-xs'
                : 'border-transparent hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>4. Dévier l'esprit</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">

          {/* TAB 1: DELAY TIMER */}
          {activeTab === 'delay' && (
            <div className="text-center space-y-5">
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  La vague d'une envie dure généralement 10 à 15 minutes
                </h3>
                <p className="text-xs text-slate-500">
                  Accordez-vous un court délai sans lutter. Observez la sensation sans céder immédiatement.
                </p>
              </div>

              {/* Big Timer Display */}
              <div className="p-6 rounded-3xl bg-teal-50/70 border border-teal-200 inline-block w-full max-w-sm mx-auto shadow-inner">
                <div className="text-5xl font-black text-teal-950 font-mono tracking-wider">
                  {formatTimer(timeLeftSeconds)}
                </div>
                <p className="text-xs text-teal-700 font-semibold mt-1">
                  {isTimerRunning ? 'Chronomètre actif : respirez calmement' : 'Choisissez une durée de temporisation'}
                </p>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isTimerRunning ? 'Pause' : 'Démarrer'}</span>
                  </button>
                  <button
                    onClick={() => { setIsTimerRunning(false); setTimeLeftSeconds(delayMinutes * 60); }}
                    className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
                    title="Réinitialiser"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-teal-100 text-xs">
                  <span className="text-slate-500 font-medium">Préréglages :</span>
                  {[5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleStartTimer(mins)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        delayMinutes === mins
                          ? 'bg-teal-800 text-white'
                          : 'bg-white text-teal-800 border border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEEP BREATHING 4-4-6 */}
          {activeTab === 'breathe' && (
            <div className="text-center space-y-5">
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Respiration Rythmée (Inspirer 4s - Retenir 4s - Expirer 6s)
                </h3>
                <p className="text-xs text-slate-500">
                  Cette cadence apaise le système nerveux parasympathique et réduit le pic de tension corporelle.
                </p>
              </div>

              {/* Breathing Circle Visualizer */}
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 border border-slate-200">
                <div
                  className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-lg ${
                    breathPhase === 'inhale'
                      ? 'scale-110 bg-teal-100 border-4 border-teal-500 text-teal-900'
                      : breathPhase === 'hold'
                      ? 'scale-110 bg-indigo-100 border-4 border-indigo-500 text-indigo-900'
                      : 'scale-90 bg-emerald-100 border-4 border-emerald-500 text-emerald-900'
                  }`}
                >
                  <span className="text-xs uppercase font-extrabold tracking-widest block">
                    {breathPhase === 'inhale' ? 'Inspirez' : breathPhase === 'hold' ? 'Bloquez' : 'Expirez'}
                  </span>
                  <span className="text-4xl font-black font-mono mt-1">{breathTimer}</span>
                  <span className="text-[10px] opacity-70">secondes</span>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => setIsBreathingActive(!isBreathingActive)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isBreathingActive ? 'Suspendre' : 'Lancer le cycle'}</span>
                  </button>
                  <span className="text-xs font-semibold text-slate-500">
                    Cycles complétés : <strong className="text-teal-900">{breathCycles}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRINK WATER */}
          {activeTab === 'water' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <Droplets className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-950">Boire un grand verre d'eau fraîche</h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    L’envie de fumer ou d’ingérer du THC s'accompagne fréquemment d'une sensation de bouche sèche ou de besoin d'ancrage oromoteur. Boire lentement réactive la déglutition et brise le réflexe automatique.
                  </p>
                </div>
              </div>

              <label className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-3 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={drankWater}
                  onChange={(e) => setDrankWater(e.target.checked)}
                  className="w-5 h-5 rounded-md text-teal-700 focus:ring-teal-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">J'ai bu un verre d'eau ou une tisane chaude</span>
                  <span className="text-slate-500">Observation de la sensation de fraîcheur dans le corps</span>
                </div>
              </label>
            </div>
          )}

          {/* TAB 4: DISTRACT */}
          {activeTab === 'distract' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Idées d'actions pour changer de contexte (5 à 15 min) :
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { title: 'Changer de pièce immédiatement', desc: 'Rompre le stimulus environnemental direct.' },
                  { title: 'Sortir marcher 10 minutes', desc: 'Changer d’air et activer le corps.' },
                  { title: 'Écouter 2 morceaux de musique apaisants', desc: 'Dévier l’attention sensorielle.' },
                  { title: 'Prendre une douche chaude ou tiède', desc: 'Détente musculaire immédiate.' },
                  { title: 'Appeler un ami ou un proche', desc: 'Discuter d’autre chose pendant 5 minutes.' },
                  { title: 'Ranger ou nettoyer une petite zone', desc: 'Occuper ses mains avec un résultat visible.' },
                ].map((act, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition">
                    <span className="text-xs font-bold text-slate-900 block">{act.title}</span>
                    <span className="text-[11px] text-slate-500">{act.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Craving Intensity & Context Logging Form */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 pt-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Détails de l'Envie (pour vos statistiques d'apprentissage)</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Intensité ressentie au départ :</span>
                <span className="font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-900">
                  {intensity} / 10 ({intensity >= 8 ? 'Très forte' : intensity >= 5 ? 'Moyenne' : 'Légère'})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Déclencheur identifié :</label>
                <select
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-800"
                >
                  <option value="Habitude de fin de journée">Habitude de fin de journée</option>
                  <option value="Stress ou surcharge mentale">Stress ou surcharge mentale</option>
                  <option value="Ennui / Temps inoccupé">Ennui / Temps inoccupé</option>
                  <option value="Contexte social / Amis">Contexte social / Amis</option>
                  <option value="Difficulté d'endormissement">Difficulté d'endormissement</option>
                  <option value="Émotion vive ou contrariété">Émotion vive ou contrariété</option>
                  <option value="Autre déclencheur">Autre déclencheur</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contexte présent :</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex : Devant la télévision, après le travail..."
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 text-xs block mb-1">Note personnelle (optionnel) :</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ressenti, pensée traversée..."
                className="w-full p-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Helpline banner */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
            <span>Besoin d'un échange humain immédiat ?</span>
            <a
              href="tel:0800231313"
              className="font-bold text-rose-800 hover:text-rose-900 flex items-center gap-1 underline"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Drogues Info Service (0 800 23 13 13)</span>
            </a>
          </div>
        </div>

        {/* Modal Footer with 3 Resolution Choices */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Fermer sans enregistrer
          </button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveCravingLog('consumed')}
              className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              J'ai tout de même consommé
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveCravingLog('reduced')}
              className="flex-1 sm:flex-initial px-3 py-2.5 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-900 border border-teal-300 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              Intensité réduite
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveCravingLog('craving_passed')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-300" />
              <span>L'envie est passée ✨</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
