import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CBDWellnessGoal } from '../../types/entities';
import { X, Check, Target, Trophy, Sparkles, Moon, Heart, Activity } from 'lucide-react';

interface CBDGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingGoal?: CBDWellnessGoal | null;
}

const GOAL_CATEGORIES = [
  { value: 'sleep', label: 'Rituel Sommeil & Endormissement' },
  { value: 'relaxation', label: 'Gestion du Stress & Pauses Calmes' },
  { value: 'activity', label: 'Activité Physique & Récupération' },
  { value: 'routine', label: 'Régularité des Prises & Dosage Conscient' },
  { value: 'mindfulness', label: 'Observation & Bien-Être Global' },
];

export const CBDGoalModal: React.FC<CBDGoalModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingGoal,
}) => {
  const { token } = useAuth();

  const [category, setCategory] = useState('sleep');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number>(5);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingGoal) {
      setCategory(editingGoal.category || 'sleep');
      setTitle(editingGoal.title);
      setDescription(editingGoal.description || '');
      setTargetDaysPerWeek(editingGoal.targetDaysPerWeek || 5);
      setNotes(editingGoal.notes || '');
    } else {
      setCategory('sleep');
      setTitle('Prendre 3 gouttes d’huile 30 min avant le coucher');
      setDescription('Rituel calme pour favoriser l’apaisement sans écran');
      setTargetDaysPerWeek(5);
      setNotes('');
    }
  }, [editingGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Veuillez indiquer un titre d’objectif.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        targetDaysPerWeek: Number(targetDaysPerWeek),
        notes: notes.trim() || undefined,
      };

      const url = editingGoal ? `/api/cbd/goals/${editingGoal.id}` : '/api/cbd/goals';
      const method = editingGoal ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l’enregistrement de l’objectif.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’enregistrer cet objectif.');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingGoal ? 'Modifier l’objectif' : 'Définir un Nouvel Objectif Bien-Être'}
              </h3>
              <p className="text-xs text-slate-500">Rituels réguliers et bonnes pratiques d’hygiène de vie</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            >
              {GOAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l’objectif *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tisane relaxante et lecture sans écran..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Précisions</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 5 soirs par semaine à partir de 22h..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Fréquence cible :
              </label>
              <span className="text-xs font-bold text-amber-800">{targetDaysPerWeek} jours / semaine</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={targetDaysPerWeek}
              onChange={(e) => setTargetDaysPerWeek(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
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
              className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : editingGoal ? 'Mettre à jour' : 'Créer l’objectif'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
