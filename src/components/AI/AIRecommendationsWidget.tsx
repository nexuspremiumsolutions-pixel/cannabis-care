import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Wind,
  Layers,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Compass,
  Info,
  Calendar,
} from 'lucide-react';
import { AIRecommendation } from '../../types/entities';

interface DescriptiveObservation {
  periodDays: number;
  totalLogs: number;
  activeDaysCount: number;
  dominantContext?: string;
  averageMoodBefore?: number;
  averageMoodAfter?: number;
  observationSummary: string;
  invitationToReflect: string;
}

interface AIRecommendationsWidgetProps {
  token: string | null;
  onLaunchExercise?: (exerciseType: 'cardiac_coherence' | 'delay_10_min' | 'breathing_4_7_8') => void;
  onOpenEducation?: (slug?: string) => void;
  onOpenJournal?: () => void;
  onAskAssistant?: (prompt: string) => void;
}

export const AIRecommendationsWidget: React.FC<AIRecommendationsWidgetProps> = ({
  token,
  onLaunchExercise,
  onOpenEducation,
  onOpenJournal,
  onAskAssistant,
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [observation, setObservation] = useState<DescriptiveObservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      Promise.all([
        fetch('/api/ai/recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
        fetch('/api/ai/descriptive-observation', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
      ])
        .then(([recsData, obsData]) => {
          if (recsData.recommendations) {
            setRecommendations(recsData.recommendations);
          }
          if (obsData.observation) {
            setObservation(obsData.observation);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const handleActionClick = (rec: AIRecommendation) => {
    if (rec.type === 'EXERCISE' && rec.actionPayload?.exerciseType) {
      if (onLaunchExercise) onLaunchExercise(rec.actionPayload.exerciseType);
    } else if (rec.type === 'EDUCATIONAL_CONTENT' && rec.actionPayload?.slug) {
      if (onOpenEducation) onOpenEducation(rec.actionPayload.slug);
    } else if (rec.type === 'JOURNAL_ACTION') {
      if (onOpenJournal) onOpenJournal();
    } else if (onAskAssistant) {
      onAskAssistant(`Comment puis-je mettre en pratique : « ${rec.title} » ?`);
    }
  };

  const getRecIcon = (type?: string) => {
    switch (type) {
      case 'EXERCISE':
        return <Wind className="w-4 h-4 text-teal-600" />;
      case 'EDUCATIONAL_CONTENT':
        return <BookOpen className="w-4 h-4 text-sky-600" />;
      case 'JOURNAL_ACTION':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      default:
        return <Compass className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Descriptive Observation Callout */}
      {observation && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-teal-900">
              Observation de vos habitudes ({observation.periodDays} derniers jours)
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {observation.observationSummary}
          </p>

          <div className="pt-2 border-t border-teal-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] text-teal-900 font-medium italic">
              {observation.invitationToReflect}
            </span>
            {onAskAssistant && (
              <button
                type="button"
                onClick={() =>
                  onAskAssistant(
                    `Aide-moi à comprendre mes tendances récentes du journal : ${observation.observationSummary}`
                  )
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:text-teal-950 underline shrink-0 cursor-pointer"
              >
                <span>Analyser avec l’assistant</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prioritized Recommendations Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Recommandations Personnalisées du Jour
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Priorisées & sans surcharge</span>
        </div>

        {isLoading ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
            Calcul des pistes adaptées à votre parcours...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            Aucune recommandation active pour le moment. Enregistrez vos premières observations pour obtenir des repères sur-mesure.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map((rec, index) => (
              <div
                key={rec.id}
                className={`p-4.5 rounded-2xl bg-white border transition shadow-xs hover:shadow-md flex flex-col justify-between space-y-3 ${
                  index === 0
                    ? 'border-teal-300 ring-1 ring-teal-200'
                    : 'border-slate-200 hover:border-teal-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center">
                        {getRecIcon(rec.type)}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {rec.type === 'EXERCISE'
                          ? 'Exercice pratique'
                          : rec.type === 'EDUCATIONAL_CONTENT'
                          ? 'Guide éducatif'
                          : rec.type === 'JOURNAL_ACTION'
                          ? 'Journal de bord'
                          : 'Piste bien-être'}
                      </span>
                    </div>
                    {index === 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                        Priorité 1
                      </span>
                    )}
                  </div>

                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {rec.title}
                  </h5>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {rec.suggestion}
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{rec.rationalNonMedical}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleActionClick(rec)}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                    index === 0
                      ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700'
                  }`}
                >
                  <span>{rec.actionLabel || 'Consulter'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
