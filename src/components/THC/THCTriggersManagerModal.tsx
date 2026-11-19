import React, { useState } from 'react';
import {
  X,
  Plus,
  Zap,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Tag,
} from 'lucide-react';
import { THCTrigger } from '../../types/entities';

interface THCTriggersManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  token: string | null;
  triggers: THCTrigger[];
}

export const THCTriggersManagerModal: React.FC<THCTriggersManagerModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  token,
  triggers,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<THCTrigger['type']>('emotion');
  const [newIntensity, setNewIntensity] = useState(6);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newLabel.trim()) return;
    setIsAdding(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/thc-journey/triggers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newLabel.trim(),
          type: newType,
          intensity: newIntensity,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Erreur lors de l’ajout du déclencheur.');
      }

      setNewLabel('');
      onUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/thc-journey/triggers/${triggerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated();
    } catch (err) {
      console.error('Error deleting trigger:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-300 block">
                Compréhension & Prévention
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Mes Déclencheurs Identifiés
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

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Add New Trigger Form */}
          <form onSubmit={handleAddTrigger} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              + Ajouter un déclencheur personnel
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Libellé :</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex : Soirée télé seul, stress pro..."
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Catégorie :</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-300 text-slate-800"
                >
                  <option value="emotion">Émotionnelle (stress, tristesse)</option>
                  <option value="habit">Habitude / Automatisme</option>
                  <option value="social">Sociale / Convivialité</option>
                  <option value="location">Lieu ou moment de la journée</option>
                  <option value="other">Autre situation</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs flex-1">
                <span className="text-slate-600 font-semibold">Intensité habituelle :</span>
                <span className="font-bold text-teal-800">{newIntensity}/10</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newIntensity}
                  onChange={(e) => setNewIntensity(parseInt(e.target.value, 10))}
                  className="w-28 accent-teal-700"
                />
              </div>

              <button
                type="submit"
                disabled={isAdding || !newLabel.trim()}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* List of Triggers */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Déclencheurs actifs ({triggers.length})
            </span>

            {triggers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">
                Aucun déclencheur spécifique renseigné pour l'instant.
              </p>
            ) : (
              <div className="space-y-2">
                {triggers.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs hover:border-teal-300 transition"
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{t.label}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                          {t.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Intensité : <strong>{t.intensity}/10</strong></span>
                        <span>Associé {t.frequencyCount || 0} fois dans vos journaux</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTrigger(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Supprimer ce déclencheur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
