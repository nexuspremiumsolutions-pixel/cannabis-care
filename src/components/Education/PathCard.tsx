import React from 'react';
import {
  Compass,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { EducationalPath } from '../../types/entities';

interface PathCardProps {
  path: EducationalPath & {
    steps?: any[];
    totalSteps?: number;
    completedSteps?: number;
    progressPercentage?: number;
    status?: 'not_started' | 'in_progress' | 'completed';
    isFavorite?: boolean;
    badgeReward?: string;
  };
  onSelectPath: (path: EducationalPath) => void;
  lang?: string;
}

const CATEGORY_TAGS: Record<string, { bg: string; text: string; label: string }> = {
  cannabis_thc: { bg: 'bg-emerald-50 text-emerald-950 border-emerald-300/80', text: 'text-emerald-800', label: 'Cannabis & THC' },
  cbd: { bg: 'bg-teal-50 text-teal-950 border-teal-300/80', text: 'text-teal-800', label: 'CBD & Bien-être' },
  reduction_cessation: { bg: 'bg-rose-50 text-rose-950 border-rose-300/80', text: 'text-rose-800', label: 'Modération & Arrêt' },
  wellness: { bg: 'bg-cyan-50 text-cyan-950 border-cyan-300/80', text: 'text-cyan-800', label: 'Sommeil & Sérénité' },
  habits_behavior: { bg: 'bg-amber-50 text-amber-950 border-amber-300/80', text: 'text-amber-800', label: 'Habitudes de Vie' },
};

const PATH_IMAGES: Record<string, string> = {
  path_beginner_cannabis: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=600&q=80',
  path_cbd_discovery: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  path_tolerance_reset: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
  path_sleep_recovery: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=600&q=80',
  path_moderation_control: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80',
  path_cessation_journey: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
  path_harm_reduction_safe: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
};

export const PathCard: React.FC<PathCardProps> = ({
  path,
  onSelectPath,
  lang = 'fr',
}) => {
  const cat = CATEGORY_TAGS[path.category] || {
    bg: 'bg-slate-50 text-slate-800 border-slate-200',
    text: 'text-slate-700',
    label: path.category,
  };

  const progress = path.progressPercentage || 0;
  const isCompleted = progress === 100;
  const totalCount = path.totalSteps || path.contentIds?.length || 5;
  const completedCount = path.completedSteps || 0;

  const pathImage =
    PATH_IMAGES[path.id] ||
    PATH_IMAGES['path_beginner_cannabis'];

  return (
    <div
      id={`path-card-${path.id}`}
      onClick={() => onSelectPath(path)}
      className="rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group relative"
    >
      {/* Visual Thematic Header Image */}
      <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-slate-900">
        <img
          src={pathImage}
          alt={path.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

        {/* Floating Category & Duration */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${cat.bg}`}>
            {cat.label}
          </span>
          <div className="flex items-center gap-1 text-white text-[11px] font-semibold bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
            <Clock className="w-3 h-3 text-emerald-300" />
            <span>~{path.estimatedDurationMinutes} min</span>
          </div>
        </div>

        {/* Level Tag floating on photo */}
        <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-md border border-white/20">
          <Layers className="w-3 h-3 text-emerald-300" />
          <span>Niveau {path.level === 'beginner' ? 'Débutant' : path.level === 'intermediate' ? 'Intermédiaire' : 'Avancé'}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug">
            {path.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {path.description}
          </p>
        </div>

        {/* Target Audience & Steps count */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <strong className="text-slate-900 font-bold">{totalCount}</strong> étapes & exercices
            </span>
            {path.badgeReward && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Badge
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>Progression</span>
              <span className="font-bold text-slate-800">{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
              <div
                className={`h-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Parcours validé
              </span>
            ) : progress > 0 ? (
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 group-hover:translate-x-1 transition">
                Continuer ({completedCount}/{totalCount})
                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 group-hover:translate-x-1 transition">
                Découvrir le parcours
                <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
