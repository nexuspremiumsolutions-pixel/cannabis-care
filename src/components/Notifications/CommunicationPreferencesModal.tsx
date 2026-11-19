import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Lock,
  Moon,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserCommunicationPreference, MarketingConsentRecord } from '../../types/entities';

interface CommunicationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunicationPreferencesModal: React.FC<CommunicationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [preferences, setPreferences] = useState<UserCommunicationPreference | null>(null);
  const [consents, setConsents] = useState<MarketingConsentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/communication/preferences');
      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences);
        setConsents(data.consents || []);
      }
    } catch (err) {
      console.error('Failed to load communication preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const handleToggle = (key: keyof UserCommunicationPreference) => {
    if (!preferences) return;
    // Don't allow disabling mandatory transactional emails
    if (key === 'transactionalEmail' || key === 'securityEmail') {
      return;
    }
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/communication/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (data.success) {
        setPreferences(data.preferences);
        setSuccessMessage('Vos préférences ont été enregistrées avec succès.');
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-800 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Préférences de Communication & RGPD
              </h2>
              <p className="text-xs text-slate-500">
                Gérez vos canaux, autorisations et moments de silence en toute transparence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Chargement de vos consentements...</div>
          ) : preferences ? (
            <>
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* 1. Mandatory Transactional Communications */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Communications Obligatoires (Non désactivables)
                  </h3>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">Confirmations de commande & reçus de paiement</p>
                      <p className="text-[11px] text-slate-500">Obligation contractuelle et facturation légale</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      Toujours actif
                    </span>
                  </div>
                  <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">Alertes de sécurité du compte & authentification</p>
                      <p className="text-[11px] text-slate-500">Protection contre les connexions suspectes</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      Toujours actif
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Suivi de Livraison & Retrait Boutique */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Suivi de Livraison & Retraits (Optionnel)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleToggle('orderUpdatesPush')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      preferences.orderUpdatesPush
                        ? 'bg-teal-50/60 border-teal-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-teal-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Suivi Commandes Push</p>
                        <p className="text-[10px] text-slate-500">Statuts de validation & préparation</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.orderUpdatesPush}
                      readOnly
                      className="accent-teal-700 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div
                    onClick={() => handleToggle('deliveryUpdatesPush')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      preferences.deliveryUpdatesPush
                        ? 'bg-teal-50/60 border-teal-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-teal-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Suivi par Notification Push</p>
                        <p className="text-[10px] text-slate-500">Alertes temps réel sur l'appareil</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.deliveryUpdatesPush}
                      readOnly
                      className="accent-teal-700 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Marketing, Offres & Nouveautés Partenaires */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Offres, Nouveautés & Promos Partenaires (Consentement libre)
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleToggle('marketingEmail')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      preferences.marketingEmail
                        ? 'bg-teal-50/60 border-teal-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-slate-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">E-mails Promos & News</p>
                        <p className="text-[10px] text-slate-500">Offres et nouveaux arrivages</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketingEmail}
                      readOnly
                      className="accent-teal-700 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div
                    onClick={() => handleToggle('marketingPush')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      preferences.marketingPush
                        ? 'bg-teal-50/60 border-teal-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-slate-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Push Promotions</p>
                        <p className="text-[10px] text-slate-500">Bons plans des boutiques</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketingPush}
                      readOnly
                      className="accent-teal-700 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div
                    onClick={() => handleToggle('marketingSms')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      preferences.marketingSms
                        ? 'bg-teal-50/60 border-teal-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-slate-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">SMS Prioritaires</p>
                        <p className="text-[10px] text-slate-500">Codes de réduction exclusifs</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketingSms}
                      readOnly
                      className="accent-teal-700 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div
                    onClick={() => handleToggle('marketingWhatsapp')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      preferences.marketingWhatsapp
                        ? 'bg-teal-50/60 border-teal-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Canal WhatsApp</p>
                        <p className="text-[10px] text-slate-500">Service client & offres</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketingWhatsapp}
                      readOnly
                      className="accent-teal-700 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Plage de Silence (Quiet Hours) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Mode Silence & Repos (Pas de notifications non urgentes)
                  </h3>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Créneau de repos respecté
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Les communications non urgentes seront mises en attente durant ces heures.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={preferences.quietHoursStart || '22:00'}
                      onChange={(e) =>
                        setPreferences({ ...preferences, quietHoursStart: e.target.value })
                      }
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    />
                    <span className="text-xs text-slate-400 font-bold">à</span>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd || '08:00'}
                      onChange={(e) =>
                        setPreferences({ ...preferences, quietHoursEnd: e.target.value })
                      }
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Historique & Preuve RGPD */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-teal-950">Garantie de non-utilisation des données de santé</p>
                    <p className="text-[11px] text-teal-900/80 leading-relaxed">
                      Conformément à la réglementation RGPD et à notre charte éthique, les données médicales, déclarations de consommation THC/CBD et journaux de bord ne sont <strong>jamais exploitées</strong> pour du ciblage marketing ou de la prospection commerciale.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer mes préférences'}
          </button>
        </div>
      </div>
    </div>
  );
};
