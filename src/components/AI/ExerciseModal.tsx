import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Heart, Clock, CheckCircle2, Wind, Droplets } from 'lucide-react';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseType: 'cardiac_coherence' | 'delay_10_min' | 'breathing_4_7_8';
  onCompleted?: (reflectionText?: string) => void;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  exerciseType,
  onCompleted,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    exerciseType === 'delay_10_min' ? 600 : exerciseType === 'breathing_4_7_8' ? 180 : 300
  );
  const [breathPhase, setBreathPhase] = useState<'inspire' | 'expire' | 'pause'>('inspire');
  const [breathSeconds, setBreathSeconds] = useState(5);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize seconds depending on exerciseType
  useEffect(() => {
    if (isOpen) {
      setIsActive(false);
      setIsFinished(false);
      setCyclesCompleted(0);
      setBreathPhase('inspire');
      setBreathSeconds(exerciseType === 'breathing_4_7_8' ? 4 : 5);
      setSecondsRemaining(
        exerciseType === 'delay_10_min' ? 600 : exerciseType === 'breathing_4_7_8' ? 180 : 300
      );
    }
  }, [isOpen, exerciseType]);

  // Main countdown timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  // Breathing pacer cycle
  useEffect(() => {
    let breathTimer: any = null;
    if (isActive && !isFinished && exerciseType !== 'delay_10_min') {
      breathTimer = setInterval(() => {
        setBreathSeconds((prev) => {
          if (prev <= 1) {
            // Switch phase
            if (exerciseType === 'cardiac_coherence') {
              setBreathPhase((current) => {
                if (current === 'inspire') {
                  return 'expire';
                } else {
                  setCyclesCompleted((c) => c + 1);
                  return 'inspire';
                }
              });
              return 5;
            } else if (exerciseType === 'breathing_4_7_8') {
              setBreathPhase((current) => {
                if (current === 'inspire') {
                  return 'pause';
                } else if (current === 'pause') {
                  return 'expire';
                } else {
                  setCyclesCompleted((c) => c + 1);
                  return 'inspire';
                }
              });
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breathTimer);
  }, [isActive, isFinished, exerciseType, breathPhase]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent =
    exerciseType === 'delay_10_min'
      ? Math.round(((600 - secondsRemaining) / 600) * 100)
      : Math.round(((300 - secondsRemaining) / 300) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              {exerciseType === 'delay_10_min' ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Wind className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {exerciseType === 'delay_10_min'
                  ? 'Temporisation : Règle des 10 minutes'
                  : exerciseType === 'cardiac_coherence'
                  ? 'Cohérence Cardiaque 5-5'
                  : 'Respiration Apaisante 4-7-8'}
              </h3>
              <p className="text-xs text-teal-200/80">
                {exerciseType === 'delay_10_min'
                  ? 'Laissez la vague d’envie culminer et redescendre'
                  : 'Régulation neurovégétative & abaissement du cortisol'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-6">
          {exerciseType !== 'delay_10_min' ? (
            /* Breathing Circle */
            <div className="relative flex flex-col items-center justify-center my-2">
              <div
                className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center transition-all duration-1000 ease-in-out border-4 ${
                  breathPhase === 'inspire'
                    ? 'scale-110 bg-teal-50 border-teal-500 shadow-xl shadow-teal-500/20'
                    : breathPhase === 'expire'
                    ? 'scale-90 bg-emerald-50 border-emerald-400 shadow-sm'
                    : 'scale-105 bg-amber-50 border-amber-400'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {breathPhase === 'inspire'
                    ? 'Inspirez par le nez'
                    : breathPhase === 'expire'
                    ? 'Expirez lentement'
                    : 'Retenez votre souffle'}
                </span>
                <span className="text-4xl sm:text-5xl font-black text-slate-900 my-1">
                  {breathSeconds}s
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  {cyclesCompleted} cycle(s) validé(s)
                </span>
              </div>
            </div>
          ) : (
            /* 10-Min Urge Delay Display */
            <div className="w-full space-y-4 text-center">
              <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                  Temps restant avant toute décision
                </span>
                <div className="text-5xl font-black text-teal-950 font-mono">
                  {formatTime(secondsRemaining)}
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-teal-600 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Dynamic supportive advice during countdown */}
              <div className="text-xs text-slate-600 space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Droplets className="w-4 h-4 text-teal-600" />
                  <span>Conseils pour accompagner ces 10 minutes :</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li>Buvez un grand verre d’eau fraîche à petites gorgées.</li>
                  <li>Levez-vous et changez de pièce ou passez-vous de l’eau sur les avant-bras.</li>
                  <li>Rappelez-vous : une envie est une vague biologique temporaire.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            {!isFinished ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 rounded-2xl transition shadow-xs cursor-pointer"
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{secondsRemaining === (exerciseType === 'delay_10_min' ? 600 : 300) ? 'Démarrer' : 'Reprendre'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsActive(false);
                    setSecondsRemaining(exerciseType === 'delay_10_min' ? 600 : 300);
                    setCyclesCompleted(0);
                    setIsFinished(false);
                  }}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition cursor-pointer"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full text-center space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Session terminée avec succès ! Félicitations pour ce moment d’ancrage.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onCompleted) {
                      onCompleted(
                        exerciseType === 'delay_10_min'
                          ? 'Envie temporisée avec succès pendant 10 minutes.'
                          : 'Séance de cohérence cardiaque 5-5 effectuée.'
                      );
                    }
                    onClose();
                  }}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-2xl transition cursor-pointer"
                >
                  Enregistrer et fermer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
