import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
  Sparkles,
  HelpCircle,
  Activity,
  Award,
} from 'lucide-react';
import { EducationalPath, EducationalContent } from '../../types/entities';

interface PathDetailViewProps {
  path: any;
  onBack: () => void;
  onOpenStep: (stepId: string) => void;
  lang?: string;
}

export const PathDetailView: React.FC<PathDetailViewProps> = ({
  path,
  onBack,
  onOpenStep,
  lang = 'fr',
}) => {
  const steps = path.steps || [];
  const completedCount = steps.filter((s: any) => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = progressPercent === 100;

  return (
    <div id={`path-detail-${path.id}`} className="space-y-6 max-w-4xl mx-auto">
      {/* Top Bar */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux parcours pédagogiques</span>
      </button>

      {/* Path Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-md bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200">
            {path.category}
          </span>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Durée totale estimée : ~{path.estimatedDurationMinutes} minutes</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {path.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
            {path.description}
          </p>
        </div>

        {/* Progress Bar & Badges */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Progression du parcours</span>
            <span>
              {completedCount} / {totalCount} étapes validées ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isAllCompleted ? 'bg-emerald-500' : 'bg-teal-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isAllCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs font-medium">
            <Award className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Félicitations ! Vous avez complété ce parcours.</span>
              <p className="text-emerald-800">
                Vous avez acquis les compétences et réflexes clés. Vos acquis sont conservés dans votre progression.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Programme des étapes ({totalCount})
        </h3>

        <div className="space-y-3">
          {steps.map((step: any, idx: number) => {
            const isCompleted = step.completed;
            const isNext = !isCompleted && (idx === 0 || steps[idx - 1]?.completed);

            return (
              <div
                key={step.id || idx}
                onClick={() => onOpenStep(step.id)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 group ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50'
                    : isNext
                    ? 'bg-white border-teal-400 shadow-xs ring-2 ring-teal-100'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Number or Check */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isNext
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Étape {idx + 1}
                      </span>
                      {step.contentType === 'quiz' && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          Quiz
                        </span>
                      )}
                      {step.contentType === 'exercise' && (
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold">
                          Exercice
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-800 transition">
                      {step.title}
                    </h4>
                    {step.summary && (
                      <p className="text-xs text-slate-500 line-clamp-1">{step.summary}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1 hidden sm:flex">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{step.estimatedMinutes} min</span>
                  </span>

                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
                      Revoir
                    </span>
                  ) : isNext ? (
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition shadow-xs">
                      <Play className="w-3 h-3 fill-white" />
                      <span>Commencer</span>
                    </button>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
