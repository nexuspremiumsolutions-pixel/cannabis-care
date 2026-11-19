import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Check, Heart, Moon, Zap, Smile, Activity, Info, Calendar } from 'lucide-react';

interface CBDWellnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CBDWellnessModal: React.FC<CBDWellnessModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { token } = useAuth();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [mood, setMood] = useState<number>(4);
  const [relaxation, setRelaxation] = useState<number>(4);
  const [physicalActivity, setPhysicalActivity] = useState<boolean>(true);
  const [activityDuration, setActivityDuration] = useState<string>('30');
  const [activityType, setActivityType] = useState<string>('Marche / Yoga');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        date,
        sleepQuality,
        energy,
        stressLevel,
        mood,
        relaxation,
        physicalActivity,
        activityDurationMinutes: physicalActivity && activityDuration ? parseInt(activityDuration, 10) : undefined,
        activityType: physicalActivity && activityType ? activityType.trim() : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await fetch('/api/cbd/wellness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l’enregistrement de l’observation.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’enregistrer le bilan bien-être.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bilan Bien-Être & Habitudes</h3>
              <p className="text-xs text-slate-500">Auto-observation quotidienne de votre confort global</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Date du bilan</span>
            </label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Sliders / Ratings */}
          <div className="space-y-4 pt-1">
            
            {/* Sleep */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Qualité du sommeil</span>
                </span>
                <span className="font-bold text-indigo-700">{sleepQuality} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={sleepQuality}
                onChange={(e) => setSleepQuality(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Agité / Insuffisant</span>
                <span>Profond & Réparateur</span>
              </div>
            </div>

            {/* Stress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-600" />
                  <span>Niveau de stress perçu</span>
                </span>
                <span className="font-bold text-rose-700">{stressLevel} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={stressLevel}
                onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Très calme / Zen</span>
                <span>Forte tension</span>
              </div>
            </div>

            {/* Relaxation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sensation de relaxation corporelle</span>
                </span>
                <span className="font-bold text-emerald-700">{relaxation} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={relaxation}
                onChange={(e) => setRelaxation(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Energy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Vitalité & Énergie</span>
                </span>
                <span className="font-bold text-amber-700">{energy} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

          </div>

          {/* Physical Activity */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={physicalActivity}
                  onChange={(e) => setPhysicalActivity(e.target.checked)}
                  className="rounded-md text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>Activité physique / Mouvement aujourd’hui</span>
              </label>
              <Activity className="w-4 h-4 text-teal-600" />
            </div>

            {physicalActivity && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Type d'activité</label>
                  <input
                    type="text"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    placeholder="Marche, Yoga, Natation, Vélo..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Durée (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarques ou observations libres</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Soirée très calme après la tisane et la séance d'étirements..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer l’observation'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
