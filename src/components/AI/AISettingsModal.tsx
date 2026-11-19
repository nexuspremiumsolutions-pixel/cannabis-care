import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Sliders, MessageSquare, Trash2, CheckCircle, Languages, AlertTriangle } from 'lucide-react';
import { AIAssistantSettings } from '../../types/entities';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onSettingsUpdated?: () => void;
  onClearHistory?: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  token,
  onSettingsUpdated,
  onClearHistory,
}) => {
  const [settings, setSettings] = useState<AIAssistantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setIsLoading(true);
      fetch('/api/ai/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            setSettings(data.settings);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settings) return;

    setIsLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveSuccess(true);
        if (onSettingsUpdated) onSettingsUpdated();
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm sm:text-base">Paramètres de l’Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vos préférences pour l’assistant ont été enregistrées.</span>
            </div>
          )}

          {settings ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Personalization Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <strong className="text-slate-900 font-bold block">Personnalisation des réponses</strong>
                    <span className="text-[11px] text-slate-500">
                      Permet à l’assistant d’adapter son soutien à votre profil (THC ou CBD) et vos objectifs.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.personalizationEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, personalizationEnabled: e.target.checked })
                    }
                    className="rounded-sm text-teal-600 accent-teal-600 cursor-pointer h-4 w-4"
                  />
                </div>
              </div>

              {/* Journal Context Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <strong className="text-slate-900 font-bold block">Accès neutre au journal</strong>
                    <span className="text-[11px] text-slate-500">
                      Autorise l’assistant à observer vos dernières entrées sans jugement pour analyser les envies récurrentes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.journalContextAllowed}
                    onChange={(e) =>
                      setSettings({ ...settings, journalContextAllowed: e.target.checked })
                    }
                    className="rounded-sm text-teal-600 accent-teal-600 cursor-pointer h-4 w-4"
                  />
                </div>
              </div>

              {/* Concise Mode */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <strong className="text-slate-900 font-bold block">Mode de réponse synthétique</strong>
                    <span className="text-[11px] text-slate-500">
                      Privilégie des conseils courts et immédiats, idéaux lors d’une envie soudaine.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.conciseResponses}
                    onChange={(e) =>
                      setSettings({ ...settings, conciseResponses: e.target.checked })
                    }
                    className="rounded-sm text-teal-600 accent-teal-600 cursor-pointer h-4 w-4"
                  />
                </div>
              </div>

              {/* Tone Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">Tonalité d’échange</label>
                <select
                  value={settings.tone}
                  onChange={(e) => setSettings({ ...settings, tone: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="supportive">Bienveillant & Chaleureux (Recommandé)</option>
                  <option value="pedagogical">Pédagogique & Scientifique</option>
                  <option value="direct">Direct & Structuré</option>
                </select>
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-teal-600" />
                  <span>Langue de l’assistant</span>
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabe avec affichage RTL)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer text-xs"
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer mes préférences'}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 text-slate-400">Chargement des paramètres...</div>
          )}

          {/* Privacy & Clear history section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Confidentialité & Données</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Vos échanges ne sont jamais transmis à des tiers publicitaires. Conformément au RGPD, vous pouvez purger l’historique de vos conversations à tout moment.
            </p>

            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-semibold text-[11px] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout l’historique des conversations</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-start gap-2 text-rose-800 text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>Êtes-vous sûr(e) de vouloir supprimer toutes vos conversations passées avec l’assistant ?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearHistory) onClearHistory();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition"
                  >
                    Oui, tout effacer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] hover:bg-slate-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
