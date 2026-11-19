import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  Award,
  Moon,
  Footprints,
  Heart,
  Users,
  Utensils,
  Wind,
  ArrowRight,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { WellnessChallenge } from '../../types/entities';

interface HabitsRediscoveryViewProps {
  challenges: WellnessChallenge[];
  onCompleteChallenge: (challengeId: string) => Promise<void>;
  onRefreshChallenges: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export const HabitsRediscoveryView: React.FC<HabitsRediscoveryViewProps> = ({
  challenges,
  onCompleteChallenge,
  onRefreshChallenges,
  onNavigateTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const categories = [
    { id: 'all', label: 'Tous les défis', icon: Sparkles },
    { id: 'sleep', label: 'Sommeil & Nuit', icon: Moon },
    { id: 'activity', label: 'Mouvement & Corps', icon: Footprints },
    { id: 'relaxation', label: 'Relaxation & Souffle', icon: Wind },
    { id: 'pleasure', label: 'Plaisir & Loisir', icon: Heart },
    { id: 'social', label: 'Lien Social', icon: Users },
    { id: 'nutrition', label: 'Nutrition & Goût', icon: Utensils },
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'sleep':
        return <Moon className="w-4 h-4 text-indigo-600" />;
      case 'activity':
        return <Footprints className="w-4 h-4 text-emerald-600" />;
      case 'relaxation':
        return <Wind className="w-4 h-4 text-teal-600" />;
      case 'pleasure':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'social':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'nutrition':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-teal-600" />;
    }
  };

  const filteredChallenges =
    activeCategory === 'all'
      ? challenges
      : challenges.filter((c) => c.category === activeCategory);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshChallenges();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Programme de Reconstruction des Habitudes</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Redécouvrir mon Quotidien
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            La réduction ou l'arrêt du THC crée un espace de temps et d'énergie. Remplissez ce vide par des micro-expériences positives pour ancrer durablement de nouveaux réflexes.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Générer 3 Nouveaux Défis</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Daily Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChallenges.map((c) => {
          const isDone = c.status === 'completed';
          return (
            <div
              key={c.id}
              className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 ${
                isDone
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-white border-slate-200 hover:border-teal-300 shadow-xs'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold capitalize">
                    {getCategoryIcon(c.category)}
                    <span>{c.category}</span>
                  </div>
                  {c.durationMinutes && (
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{c.durationMinutes} min</span>
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {c.title}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {isDone ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Défi relevé avec succès ✨</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onCompleteChallenge(c.id)}
                    className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-300" />
                    <span>Valider ce micro-défi</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informative Transition Card (THC -> CBD / Remplacement neutre) */}
      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900">
              Information Neutre : La transition ou le relais vers le CBD
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Certaines personnes en démarche de réduction du THC utilisent des extraits de chanvre légal (CBD) ou des rituels sans psychotrope (infusions, vaporisation de plantes douces) pour conserver le geste sans les effets du THC.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">
            Envie d'explorer notre guide informatif et comparatif des cannabinoïdes ?
          </span>
          <button
            onClick={() => onNavigateTab('education')}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Consulter le Guide Éducatif</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-700" />
          </button>
        </div>
      </div>

    </div>
  );
};
