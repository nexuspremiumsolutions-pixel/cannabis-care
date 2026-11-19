import React from 'react';
import { THCStatus, CBDStatus } from '../../types/entities';
import { Clock, Layers, Sparkles, Plus, Trash2, HelpCircle } from 'lucide-react';

interface StepHabitsProps {
  thcStatus: THCStatus;
  formerUsageDetails: {
    stoppedDuration?: string;
    formerFrequency?: string;
    wantsToUnderstandPast?: boolean;
    wantsToTrackProgression?: boolean;
  };
  setFormerUsageDetails: React.Dispatch<React.SetStateAction<{
    stoppedDuration?: string;
    formerFrequency?: string;
    wantsToUnderstandPast?: boolean;
    wantsToTrackProgression?: boolean;
  }>>;
  thcUsage: {
    frequency?: string;
    quantity?: string;
    quantityUnit?: string;
    duration?: string;
    contexts?: string[];
    motivations?: string[];
    estimatedMonthlyBudget?: number;
  };
  setThcUsage: React.Dispatch<React.SetStateAction<{
    frequency?: string;
    quantity?: string;
    quantityUnit?: string;
    duration?: string;
    contexts?: string[];
    motivations?: string[];
    estimatedMonthlyBudget?: number;
  }>>;
  cbdStatus: CBDStatus;
  cbdUsage: {
    currentUse?: string;
    consumptionMethods?: string[];
    preferredProductTypes?: string[];
    products?: any[];
  };
  setCbdUsage: React.Dispatch<React.SetStateAction<{
    currentUse?: string;
    consumptionMethods?: string[];
    preferredProductTypes?: string[];
    products?: any[];
  }>>;
}

export const StepHabits: React.FC<StepHabitsProps> = ({
  thcStatus,
  formerUsageDetails,
  setFormerUsageDetails,
  thcUsage,
  setThcUsage,
  cbdStatus,
  cbdUsage,
  setCbdUsage,
}) => {
  const toggleContext = (ctx: string) => {
    const list = thcUsage.contexts || [];
    if (list.includes(ctx)) {
      setThcUsage((prev) => ({ ...prev, contexts: list.filter((c) => c !== ctx) }));
    } else {
      setThcUsage((prev) => ({ ...prev, contexts: [...list, ctx] }));
    }
  };

  const toggleMotivation = (mot: string) => {
    const list = thcUsage.motivations || [];
    if (list.includes(mot)) {
      setThcUsage((prev) => ({ ...prev, motivations: list.filter((m) => m !== mot) }));
    } else {
      setThcUsage((prev) => ({ ...prev, motivations: [...list, mot] }));
    }
  };

  const toggleCbdMethod = (method: string) => {
    const list = cbdUsage.consumptionMethods || [];
    if (list.includes(method)) {
      setCbdUsage((prev) => ({ ...prev, consumptionMethods: list.filter((m) => m !== method) }));
    } else {
      setCbdUsage((prev) => ({ ...prev, consumptionMethods: [...list, method] }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Étape 2 sur 7 — Vos habitudes et modes de consommation
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Précisons vos habitudes pour mieux vous accompagner
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Ces éléments permettent d’ajuster les indicateurs de suivi, le journal et les repères comportementaux.
        </p>
      </div>

      {/* CASE A: FORMER THC USER */}
      {thcStatus === THCStatus.FORMER_USER && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-5">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            Votre parcours d’ancien consommateur de THC
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Depuis combien de temps avez-vous arrêté ?
              </label>
              <select
                value={formerUsageDetails.stoppedDuration || '1_to_6_months'}
                onChange={(e) =>
                  setFormerUsageDetails((prev) => ({ ...prev, stoppedDuration: e.target.value }))
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              >
                <option value="less_than_month">Moins d’un mois</option>
                <option value="1_to_6_months">1 à 6 mois</option>
                <option value="6_months_to_1_year">6 mois à 1 an</option>
                <option value="1_to_3_years">1 à 3 ans</option>
                <option value="more_than_3_years">Plus de 3 ans</option>
                <option value="variable">Variable / Déclaratif</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fréquence approximative passée
              </label>
              <select
                value={formerUsageDetails.formerFrequency || 'daily_once'}
                onChange={(e) =>
                  setFormerUsageDetails((prev) => ({ ...prev, formerFrequency: e.target.value }))
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
              >
                <option value="daily_multiple">Plusieurs fois par jour</option>
                <option value="daily_once">Une fois par jour</option>
                <option value="several_per_week">Plusieurs fois par semaine</option>
                <option value="weekly">Environ une fois par semaine</option>
                <option value="occasional">Occasionnelle</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formerUsageDetails.wantsToTrackProgression ?? true}
                onChange={(e) =>
                  setFormerUsageDetails((prev) => ({
                    ...prev,
                    wantsToTrackProgression: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">
                  Activer le compteur de jours sans consommation & les économies estimées
                </span>
                <span className="text-slate-500">Valorisez chaque jour gagné et vos bénéfices bien-être.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={formerUsageDetails.wantsToUnderstandPast ?? true}
                onChange={(e) =>
                  setFormerUsageDetails((prev) => ({
                    ...prev,
                    wantsToUnderstandPast: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded-sm text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">
                  Accéder aux modules de prévention des rechutes et consolidation
                </span>
                <span className="text-slate-500">Ressources comportementales et gestion des moments de stress.</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* CASE B: CURRENT THC USER */}
      {thcStatus === THCStatus.CURRENT_USER && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              Fréquence et volume de consommation de THC
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fréquence actuelle</label>
                <select
                  value={thcUsage.frequency || 'daily_once'}
                  onChange={(e) => setThcUsage((prev) => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="daily_multiple">Plusieurs fois par jour</option>
                  <option value="daily_once">Une fois par jour</option>
                  <option value="several_per_week">Plusieurs fois par semaine</option>
                  <option value="weekly">Environ 1 fois par semaine</option>
                  <option value="monthly">Moins d’une fois par semaine</option>
                  <option value="variable">Variable / Difficile à estimer</option>
                  <option value="declined">Je préfère ne pas préciser</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité estimée</label>
                <input
                  type="text"
                  value={thcUsage.quantity || '1 à 2'}
                  onChange={(e) => setThcUsage((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Ex : 1 à 2, 0.5..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unité habituelle</label>
                <select
                  value={thcUsage.quantityUnit || 'joints'}
                  onChange={(e) => setThcUsage((prev) => ({ ...prev, quantityUnit: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="joints">Joints / Cigarettes</option>
                  <option value="grams">Grammes (g)</option>
                  <option value="sessions">Sessions de vaporisation</option>
                  <option value="other">Autre / Non spécifié</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ancienneté de la pratique</label>
                <select
                  value={thcUsage.duration || '1_to_3_years'}
                  onChange={(e) => setThcUsage((prev) => ({ ...prev, duration: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="less_than_month">Moins d’un mois</option>
                  <option value="1_to_6_months">1 à 6 mois</option>
                  <option value="6_months_to_1_year">6 mois à 1 an</option>
                  <option value="1_to_3_years">1 à 3 ans</option>
                  <option value="3_to_5_years">3 à 5 ans</option>
                  <option value="more_than_5_years">Plus de 5 ans</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Budget mensuel estimé (€)</label>
                <input
                  type="number"
                  min="0"
                  value={thcUsage.estimatedMonthlyBudget ?? 60}
                  onChange={(e) =>
                    setThcUsage((prev) => ({
                      ...prev,
                      estimatedMonthlyBudget: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Contexts and Motivations */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Contextes réguliers de consommation (Sélection multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'alone_evening', label: 'Seul en soirée' },
                  { id: 'with_friends', label: 'Entre amis / social' },
                  { id: 'before_sleep', label: 'Avant de dormir' },
                  { id: 'stress_relief', label: 'En période de stress' },
                  { id: 'relaxation_time', label: 'Moments de repos / détente' },
                  { id: 'by_habit', label: 'Par habitude / automatisme' },
                  { id: 'boredom', label: 'Par ennui / temps libre' },
                  { id: 'parties_weekends', label: 'En soirée / week-end' },
                  { id: 'creative_activities', label: 'Pendant des activités créatives' },
                ].map((item) => {
                  const isChecked = (thcUsage.contexts || []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleContext(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        isChecked
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-900 mb-2">
                Motivations déclarées (Pourquoi consommez-vous ?)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'relaxation', label: 'Détente et apaisement' },
                  { id: 'sleep_aid', label: 'Faciliter l’endormissement' },
                  { id: 'stress_management', label: 'Gérer la pression / anxiété' },
                  { id: 'pleasure_taste', label: 'Recherche de plaisir / goût' },
                  { id: 'habit_routine', label: 'Habitude ancrée' },
                  { id: 'social_connection', label: 'Contexte festif / social' },
                  { id: 'urge_craving', label: 'Envie forte / Craving' },
                  { id: 'mind_escape', label: 'Évasion mentale' },
                ].map((item) => {
                  const isChecked = (thcUsage.motivations || []).includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleMotivation(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE C: CBD USER */}
      {(cbdStatus === CBDStatus.CURRENT_USER || cbdStatus === CBDStatus.FORMER_USER) && (
        <div className="bg-slate-50 border border-emerald-200/90 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            Vos habitudes concernant les produits CBD
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Modes d’utilisation des produits CBD (Sélectionnez ceux qui vous concernent)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'oil_drops', label: 'Huile / Gouttes' },
                { id: 'flowers', label: 'Fleurs séchées' },
                { id: 'resins', label: 'Résines / Extraits' },
                { id: 'capsules', label: 'Gélules / Capsules' },
                { id: 'edibles_beverages', label: 'Infusions / Boissons' },
                { id: 'vape', label: 'Vaporisation / E-liquide' },
                { id: 'topical', label: 'Cosmétiques / Baumes' },
                { id: 'other', label: 'Autres formes' },
              ].map((m) => {
                const isChecked = (cbdUsage.consumptionMethods || []).includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleCbdMethod(m.id)}
                    className={`p-2.5 rounded-xl text-xs text-center border font-medium transition cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-700 text-white border-emerald-700 font-semibold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CASE D: NEVER USED THC & NOT CBD USER */}
      {thcStatus === THCStatus.NEVER_USED && cbdStatus !== CBDStatus.CURRENT_USER && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Parcours axé sur la santé & la prévention</h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            Puisque vous ne consommez pas de THC ni de CBD, l’application mettra en valeur les indicateurs d’hygiène de vie, la qualité de votre sommeil et des ressources éducatives vérifiées.
          </p>
        </div>
      )}
    </div>
  );
};
