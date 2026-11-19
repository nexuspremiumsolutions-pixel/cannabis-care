import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Activity,
  Bookmark,
  Clock,
  Award,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Brain,
  Scale,
  HeartPulse,
  Flame,
} from 'lucide-react';
import { EducationalContent } from '../../types/entities';
import { BotanicalLeafIcon } from '../Common/BotanicalDecor';

interface ContentCardProps {
  content: EducationalContent & {
    isFavorite?: boolean;
    userStatus?: 'not_started' | 'started' | 'in_progress' | 'completed';
    progressPercentage?: number;
    quizScore?: number | null;
  };
  onSelect: (content: EducationalContent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  lang?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  cannabis_thc: { bg: 'bg-emerald-50 text-emerald-950 border-emerald-300/80', text: 'text-emerald-800', label: 'Cannabis & THC' },
  cbd: { bg: 'bg-teal-50 text-teal-950 border-teal-300/80', text: 'text-teal-800', label: 'CBD & Bien-être' },
  body_brain: { bg: 'bg-indigo-50 text-indigo-950 border-indigo-300/80', text: 'text-indigo-800', label: 'Corps & Cerveau' },
  habits_behavior: { bg: 'bg-amber-50 text-amber-950 border-amber-300/80', text: 'text-amber-800', label: 'Habitudes & Mental' },
  reduction_cessation: { bg: 'bg-rose-50 text-rose-950 border-rose-300/80', text: 'text-rose-800', label: 'Modération & Arrêt' },
  wellness: { bg: 'bg-cyan-50 text-cyan-950 border-cyan-300/80', text: 'text-cyan-800', label: 'Sommeil & Sérénité' },
  harm_reduction: { bg: 'bg-teal-50 text-teal-950 border-teal-300/80', text: 'text-teal-800', label: 'Réduction des Risques' },
};

const CATEGORY_IMAGES: Record<string, string> = {
  cannabis_thc: 'https://images.unsplash.com/photo-1536939459926-301728717817?auto=format&fit=crop&w=600&q=80',
  cbd: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  body_brain: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
  habits_behavior: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80',
  reduction_cessation: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80',
  wellness: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=600&q=80',
  harm_reduction: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
};

const TYPE_ICONS: Record<string, { icon: React.FC<{ className?: string }>; label: string }> = {
  article: { icon: BookOpen, label: 'Article' },
  micro_lesson: { icon: Clock, label: 'Micro-leçon' },
  exercise: { icon: Activity, label: 'Exercice' },
  quiz: { icon: HelpCircle, label: 'Quiz' },
  guide: { icon: BookOpen, label: 'Guide Fondamental' },
  fiche: { icon: BookOpen, label: 'Fiche Synthèse' },
};

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onSelect,
  onToggleFavorite,
  lang = 'fr',
}) => {
  const catStyle = CATEGORY_COLORS[content.category] || {
    bg: 'bg-slate-50 text-slate-800 border-slate-200',
    text: 'text-slate-700',
    label: content.category,
  };

  const TypeInfo = TYPE_ICONS[content.contentType || 'article'] || { icon: BookOpen, label: 'Article' };
  const TypeIcon = TypeInfo.icon;
  const isCompleted = content.userStatus === 'completed';

  const durationMinutes = content.estimatedMinutes || content.readTimeMinutes || 4;
  const cardImage = content.coverImage || CATEGORY_IMAGES[content.category] || CATEGORY_IMAGES['cannabis_thc'];

  // Check if content has hybrid pedagogy
  const isHybridPedagogy =
    content.category === 'body_brain' ||
    content.category === 'harm_reduction' ||
    content.id?.includes('endocannabinoid') ||
    content.id?.includes('pharmacokinetics') ||
    content.id?.includes('thc_brain') ||
    content.id?.includes('terpene') ||
    content.id?.includes('driving');

  return (
    <div
      id={`content-card-${content.id}`}
      onClick={() => onSelect(content)}
      className="rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group relative"
    >
      {/* 1. Curated Visual Header with High-Resolution Photography */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-100">
        <img
          src={cardImage}
          alt={content.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Floating Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${catStyle.bg}`}>
              {catStyle.label}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-semibold backdrop-blur-md border border-white/20">
              <TypeIcon className="w-2.5 h-2.5 text-emerald-300" />
              <span>{TypeInfo.label}</span>
            </span>
          </div>

          <button
            id={`fav-btn-${content.id}`}
            onClick={(e) => onToggleFavorite(content.id, e)}
            className={`p-1.5 rounded-xl transition cursor-pointer backdrop-blur-md border ${
              content.isFavorite
                ? 'text-amber-400 bg-black/60 border-amber-400/50 shadow-xs'
                : 'text-white/80 bg-black/40 hover:bg-black/70 border-white/20'
            }`}
            title={content.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${content.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Bottom image overlay: Hybrid Pedagogy tag */}
        {isHybridPedagogy && (
          <div className="absolute bottom-2.5 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 text-[10px] font-black border border-emerald-400/30 backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Pédagogie Hybride (En Clair & Expert)</span>
          </div>
        )}
      </div>

      {/* 2. Card Content Body */}
      <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-1.5">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug">
            {content.title}
          </h4>
          {content.subtitle && (
            <p className="text-xs text-emerald-800 font-medium line-clamp-1">{content.subtitle}</p>
          )}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{content.summary}</p>
        </div>

        {/* 3. Footer Meta & Status */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Clock className="w-3 h-3 text-emerald-700" />
              <span>{durationMinutes} min</span>
            </span>
            {content.level && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] capitalize">
                {content.level === 'beginner' ? 'Débutant' : content.level === 'intermediate' ? 'Intermédiaire' : 'Expert'}
              </span>
            )}
          </div>

          {isCompleted ? (
            <div className="flex items-center gap-1 text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Validé</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-800 font-bold group-hover:translate-x-0.5 transition">
              <span>{lang === 'ar' ? 'ابدأ' : lang === 'en' ? 'Study' : 'Explorer'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
