import React from 'react';
import { Moon, Activity, Sun, Heart, Sparkles, Check, Coffee, Smile, Compass } from 'lucide-react';

interface StepWellnessProps {
  trackedCategories: string[];
  setTrackedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  sleepDetails: {
    averageDurationHours?: number;
    declaredQualityRating?: number;
    sleepOnsetDifficulty?: string;
    nightAwakenings?: string;
    generalSatisfaction?: string;
  };
  setSleepDetails: React.Dispatch<React.SetStateAction<{
    averageDurationHours?: number;
    declaredQualityRating?: number;
    sleepOnsetDifficulty?: string;
    nightAwakenings?: string;
    generalSatisfaction?: string;
  }>>;
  physicalActivityDetails: {
    frequency?: string;
    activityTypes?: string[];
  };
  setPhysicalActivityDetails: React.Dispatch<React.SetStateAction<{
    frequency?: string;
    activityTypes?: string[];
  }>>;
}

export const StepWellness: React.FC<StepWellnessProps> = ({
  trackedCategories,
  setTrackedCategories,
  sleepDetails,
  setSleepDetails,
  physicalActivityDetails,
  setPhysicalActivityDetails,
}) => {
  const categories = [
    { id: 'sleep', label: 'Sommeil & Récupération', icon: Moon, desc: 'Durée, cycles et qualité perçue' },
    { id: 'physical_activity', label: 'Activité physique & Sport', icon: Activity, desc: 'Marche, cardio, musculation et énergie' },
    { id: 'relaxation', label: 'Détente & Gestion du stress', icon: Heart, desc: 'Exercices respiratoires et temps calme' },
    { id: 'hydration', label: 'Hydratation & Vitalité', icon: Sun, desc: 'Suivi de l’eau et boissons bien-être' },
    { id: 'nutrition', label: 'Alimentation & Équilibre', icon: Coffee, desc: 'Régularité des repas et apports' },
    { id: 'social', label: 'Vie sociale & Loisirs', icon: Smile, desc: 'Moments partagés et activités stimulantes' },
    { id: 'outdoor_time', label: 'Temps au grand air & Nature', icon: Compass, desc: 'Sorties et exposition à la lumière du jour' },
  ];

  const toggleCategory = (catId: string) => {
    if (trackedCategories.includes(catId)) {
      setTrackedCategories(trackedCategories.filter((c) => c !== catId));
    } else {
      setTrackedCategories([...trackedCategories, catId]);
    }
  };

  const toggleActivityType = (type: string) => {
    const list = physicalActivityDetails.activityTypes || [];
    if (list.includes(type)) {
      setPhysicalActivityDetails((prev) => ({
        ...prev,
        activityTypes: list.filter((t) => t !== type),
      }));
    } else {
      setPhysicalActivityDetails((prev) => ({
        ...prev,
        activityTypes: [...list, type],
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Étape 4 sur 7 — Votre bien-être & Hygiène de vie
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Quelles dimensions de votre quotidien souhaitez-vous observer ?
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Le bien-être global influe directement sur les envies, le stress et les habitudes. Activez les volets pertinents.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const isSelected = trackedCategories.includes(cat.id);
          const IconComponent = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`p-4 rounded-2xl border-2 transition text-left flex items-start justify-between cursor-pointer ${
                isSelected
                  ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <IconComponent className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">{cat.label}</span>
                  <span className="text-[11px] text-slate-500 block leading-tight">{cat.desc}</span>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                  isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sleep Section Details if Selected */}
      {trackedCategories.includes('sleep') && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Moon className="w-4 h-4 text-teal-700" />
            Précisions sur votre sommeil déclaré
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Durée moyenne (heures)</label>
              <select
                value={sleepDetails.averageDurationHours ?? 7}
                onChange={(e) =>
                  setSleepDetails((prev) => ({ ...prev, averageDurationHours: parseInt(e.target.value) || 7 }))
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
              >
                <option value={5}>Moins de 6 heures</option>
                <option value={6}>6 heures</option>
                <option value={7}>7 heures</option>
                <option value={8}>8 heures</option>
                <option value={9}>9 heures ou plus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualité perçue (1 à 5)</label>
              <select
                value={sleepDetails.declaredQualityRating ?? 3}
                onChange={(e) =>
                  setSleepDetails((prev) => ({ ...prev, declaredQualityRating: parseInt(e.target.value) || 3 }))
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
              >
                <option value={1}>1 - Très perturbé</option>
                <option value={2}>2 - Insatisfaisant</option>
                <option value={3}>3 - Moyen</option>
                <option value={4}>4 - Bon / Réparateur</option>
                <option value={5}>5 - Excellent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulté d’endormissement</label>
              <select
                value={sleepDetails.sleepOnsetDifficulty || 'sometimes'}
                onChange={(e) =>
                  setSleepDetails((prev) => ({ ...prev, sleepOnsetDifficulty: e.target.value }))
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
              >
                <option value="never">Rarement / Jamais</option>
                <option value="sometimes">Parfois (1-2x/semaine)</option>
                <option value="often">Souvent (3-4x/semaine)</option>
                <option value="always">Très fréquent / Quotidien</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Physical Activity Details if Selected */}
      {trackedCategories.includes('physical_activity') && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-700" />
            Votre niveau d’activité physique
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fréquence hebdomadaire</label>
            <select
              value={physicalActivityDetails.frequency || '1_2_per_week'}
              onChange={(e) =>
                setPhysicalActivityDetails((prev) => ({ ...prev, frequency: e.target.value }))
              }
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900"
            >
              <option value="none">Peu ou pas d’activité physique</option>
              <option value="occasional">Occasionnelle (promenades, trajets)</option>
              <option value="1_2_per_week">1 à 2 fois par semaine</option>
              <option value="3_4_per_week">3 à 4 fois par semaine</option>
              <option value="5_plus_per_week">5 fois ou plus par semaine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Activités préférées</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'walking', label: 'Marche active' },
                { id: 'running', label: 'Course à pied' },
                { id: 'weightlifting', label: 'Musculation / Fitness' },
                { id: 'cycling', label: 'Vélo / Cyclisme' },
                { id: 'swimming', label: 'Natation' },
                { id: 'yoga_mobility', label: 'Yoga / Étirements' },
                { id: 'team_sports', label: 'Sports collectifs' },
              ].map((act) => {
                const isChecked = (physicalActivityDetails.activityTypes || []).includes(act.id);
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => toggleActivityType(act.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      isChecked
                        ? 'bg-teal-800 text-white border-teal-800'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
