import React from 'react';
import { ShieldCheck, AlertCircle, Lock, Sparkles, Check, Download, Trash2 } from 'lucide-react';

interface StepPrivacyConsentProps {
  consents: {
    experiencePersonalization?: boolean;
    healthDisclaimer?: boolean;
    remindersNotifications?: boolean;
    anonymizedResearchTelemetry?: boolean;
  };
  setConsents: React.Dispatch<React.SetStateAction<{
    experiencePersonalization?: boolean;
    healthDisclaimer?: boolean;
    remindersNotifications?: boolean;
    anonymizedResearchTelemetry?: boolean;
  }>>;
}

export const StepPrivacyConsent: React.FC<StepPrivacyConsentProps> = ({
  consents,
  setConsents,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Étape 6 sur 7 — Confidentialité, Déontologie & Consentements
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Votre vie privée et notre cadre déontologique
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Chez <strong>Nexus Premium Solutions</strong>, nous appliquons les standards de protection des données les plus stricts. Vos consentements sont granulaires et révocables à tout instant.
        </p>
      </div>

      {/* Non-medical banner */}
      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4.5 flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <strong className="font-bold block text-sm text-amber-950">
            Avis Déontologique et Sanitaire Majeur
          </strong>
          <p className="leading-relaxed">
            CANNABIS CARE est une plateforme éducative, comportementale et de réduction des risques. Elle ne constitue en aucun cas un dispositif médical, un acte de télémédecine, ni un substitut à une consultation médicale ou addictologique. En cas de situation critique, le service national Drogues Info Service est joignable gratuitement au <strong>0 800 23 13 13</strong>.
          </p>
        </div>
      </div>

      {/* RGPD Guarantee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">Chiffrement & Sécurité</span>
            <span className="text-slate-500 leading-tight block">Vos données sont stockées de façon sécurisée et ne sont jamais revendues.</span>
          </div>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
          <Trash2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">Droit à l’effacement & Export</span>
            <span className="text-slate-500 leading-tight block">Exportez ou supprimez l’intégralité de vos données en 1 clic dans les paramètres.</span>
          </div>
        </div>
      </div>

      {/* Granular Consent Checkboxes */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Consentements distincts (Veuillez valider chaque point)
        </label>

        <label className="flex items-start gap-3 p-4 bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl cursor-pointer transition">
          <input
            type="checkbox"
            checked={consents.experiencePersonalization ?? true}
            onChange={(e) =>
              setConsents((prev) => ({
                ...prev,
                experiencePersonalization: e.target.checked,
              }))
            }
            className="w-5 h-5 rounded-md text-teal-600 focus:ring-teal-500 shrink-0 mt-0.5"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 block">
              1. Personnalisation de l’expérience et du profil comportemental <span className="text-teal-700">(Requis pour le service)</span>
            </span>
            <p className="text-slate-600 leading-relaxed">
              J’accepte que mes déclarations d’habitudes et d’objectifs soient utilisées pour configurer mon tableau de bord et personnaliser mes indicateurs.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl cursor-pointer transition">
          <input
            type="checkbox"
            checked={consents.healthDisclaimer ?? true}
            onChange={(e) =>
              setConsents((prev) => ({
                ...prev,
                healthDisclaimer: e.target.checked,
              }))
            }
            className="w-5 h-5 rounded-md text-teal-600 focus:ring-teal-500 shrink-0 mt-0.5"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 block">
              2. Charte déontologique et non-médicale <span className="text-teal-700">(Requis)</span>
            </span>
            <p className="text-slate-600 leading-relaxed">
              Je reconnais avoir pris connaissance du caractère non médical de CANNABIS CARE et du fait qu’aucun diagnostic n’est posé.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl cursor-pointer transition">
          <input
            type="checkbox"
            checked={consents.remindersNotifications ?? true}
            onChange={(e) =>
              setConsents((prev) => ({
                ...prev,
                remindersNotifications: e.target.checked,
              }))
            }
            className="w-5 h-5 rounded-md text-teal-600 focus:ring-teal-500 shrink-0 mt-0.5"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 block">
              3. Notifications et rappels de suivi
            </span>
            <p className="text-slate-600 leading-relaxed">
              J’autorise l’application à m’envoyer des rappels de saisie et synthèses d’objectifs conformément à mes choix d’horaires.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl cursor-pointer transition">
          <input
            type="checkbox"
            checked={consents.anonymizedResearchTelemetry ?? false}
            onChange={(e) =>
              setConsents((prev) => ({
                ...prev,
                anonymizedResearchTelemetry: e.target.checked,
              }))
            }
            className="w-5 h-5 rounded-md text-teal-600 focus:ring-teal-500 shrink-0 mt-0.5"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-slate-900 block">
              4. Données anonymisées pour l’amélioration continue de la prévention <span className="text-slate-500 font-normal">(Facultatif)</span>
            </span>
            <p className="text-slate-600 leading-relaxed">
              J’accepte que des statistiques totalement agrégées et anonymisées contribuent aux études de réduction des risques.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
