import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Lock,
  Download,
  Trash2,
  ShieldCheck,
  User,
  Bell,
  Save,
  AlertTriangle,
  FileJson,
  RotateCcw,
  Sparkles,
  Compass,
} from 'lucide-react';
import { UserRole } from '../../types/entities';

export const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onRestartOnboarding?: () => void;
  onOpenCommPreferences?: () => void;
}> = ({ isOpen, onClose, onRestartOnboarding, onOpenCommPreferences }) => {
  const {
    user,
    profile,
    consent,
    preferences,
    primaryPath,
    recommendedModules,
    token,
    updateProfile,
    updateConsent,
    updatePreferences,
    resetOnboarding,
    deleteAccount,
  } = useAuth();

  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [ageCategory, setAgeCategory] = useState(profile?.ageCategory || '26-35');
  const [analyticsConsent, setAnalyticsConsent] = useState(consent?.analyticsConsent || false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    preferences?.notificationsEnabled ?? true
  );
  const [dailyReminderTime, setDailyReminderTime] = useState(
    preferences?.dailyReminderTime || '20:30'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await Promise.all([
      updateProfile({ nickname, ageCategory: ageCategory as any }),
      updateConsent({ analyticsConsent }),
      updatePreferences({ notificationsEnabled, dailyReminderTime }),
    ]);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadGDPR = () => {
    if (!token) return;
    window.location.href = '/api/auth/export-data';
  };

  const handleDeleteAccountConfirm = async () => {
    await deleteAccount();
    onClose();
  };

  const handleResetFlow = async () => {
    await resetOnboarding();
    onClose();
    if (onRestartOnboarding) {
      onRestartOnboarding();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-white">Paramètres & Profil d’accompagnement</h3>
              <p className="text-[11px] text-slate-400">
                Nexus Premium Solutions • Contrôle strict de votre vie privée
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vos modifications ont été enregistrées avec succès.</span>
            </div>
          )}

          {/* Current Path & Onboarding Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-700" />
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Profil d’accompagnement actif
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-bold text-[11px]">
                {primaryPath || 'Actif'}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Vos modules recommandés sont calculés en fonction de vos déclarations. Vous pouvez réajuster votre parcours à tout instant.
            </p>
            <button
              type="button"
              onClick={handleResetFlow}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-teal-600 text-teal-800 hover:bg-teal-50 rounded-xl font-bold transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reconfigurer le questionnaire de profil (7 étapes)</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Informations Générales</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Pseudonyme</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tranche d’âge</label>
                <select
                  value={ageCategory}
                  onChange={(e) => setAgeCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="18-25">18 - 25 ans</option>
                  <option value="26-35">26 - 35 ans</option>
                  <option value="36-50">36 - 50 ans</option>
                  <option value="51+">51 ans et plus</option>
                </select>
              </div>
            </div>

            {/* Notifications & Reminders */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-teal-700" />
                <span>Rappels Quotidiens</span>
              </h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span>Activer le rappel quotidien de bilan</span>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="rounded-sm text-teal-600 accent-teal-600 cursor-pointer"
                />
              </div>

              {notificationsEnabled && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span>Heure du bilan en soirée</span>
                  <input
                    type="time"
                    value={dailyReminderTime}
                    onChange={(e) => setDailyReminderTime(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1"
                  />
                </div>
              )}

              {onOpenCommPreferences && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCommPreferences();
                  }}
                  className="w-full mt-2 p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-800 text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-teal-700" />
                    <span>Canaux (Email, Push, SMS, WhatsApp) & Plages de repos</span>
                  </span>
                  <span className="font-bold text-[11px]">Gérer →</span>
                </button>
              )}
            </div>

            {/* Consents RGPD */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Consentements & Télémétrie</span>
              </h4>

              <label className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  onChange={(e) => setAnalyticsConsent(e.target.checked)}
                  className="mt-0.5 rounded-sm text-teal-600 accent-teal-600"
                />
                <span>
                  Partager des statistiques d’usage totalement anonymisées pour aider la recherche en réduction des risques de Nexus Premium Solutions.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer mes préférences'}</span>
            </button>
          </form>

          {/* Section 2: RGPD Data Export & Account Deletion */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Vos Droits RGPD (Portabilité & Oubli)
            </h4>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <strong className="font-bold text-teal-950">Télécharger mon archive complète (JSON)</strong>
                <p className="text-[11px] text-teal-800">
                  Exportez l’intégralité de vos profils, journaux, objectifs et journaux d’audit.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadGDPR}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold transition shrink-0 cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Exporter</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-rose-950">Supprimer définitivement mon compte</strong>
                  <p className="text-[11px] text-rose-800">
                    Cette action supprime instantanément toutes vos données de la base de données.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Supprimer mon compte et mes données
                </button>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2">
                  <p className="text-[11px] text-rose-900 font-semibold">
                    Êtes-vous certain ? Cette opération est irréversible.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteAccountConfirm}
                      className="px-3 py-1 bg-rose-700 text-white rounded-lg font-bold hover:bg-rose-800 transition"
                    >
                      Oui, tout supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
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
    </div>
  );
};
