import React from 'react';
import { EnrichedUserChallenge } from '../../../backend/services/loyalty/challengeService';
import { Flag, CheckCircle, Clock, Play, Plus, X, Sparkles } from 'lucide-react';

interface ChallengeCardProps {
  challenge: EnrichedUserChallenge;
  onJoin: (challengeId: string) => void;
  onProgress: (challengeId: string) => void;
  onAbandon: (challengeId: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoin,
  onProgress,
  onAbandon,
}) => {
  const isJoined = challenge.isJoined;
  const isCompleted = challenge.isCompleted;

  const currentVal = challenge.currentValue || 0;
  const targetVal = challenge.targetValue || 1;
  const progressPercent = Math.min(100, Math.round((currentVal / targetVal) * 100));

  return (
    <div
      className={`rounded-2xl p-5 border transition flex flex-col justify-between ${
        isCompleted
          ? 'bg-emerald-50/50 border-emerald-200'
          : isJoined
          ? 'bg-white border-teal-200 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="space-y-3">
        
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{challenge.durationDays} jours</span>
          </span>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>+{challenge.pointsReward} pts</span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-teal-700 shrink-0" />
            <h4 className="font-bold text-slate-900 text-sm leading-snug">
              {challenge.title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Progress Bar (if joined) */}
        {isJoined && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-semibold">
              <span className="text-slate-600">Progression :</span>
              <span className="text-teal-800">
                {currentVal} / {targetVal} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-teal-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Action CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-xl">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Défi relevé avec succès !
          </span>
        ) : isJoined ? (
          <div className="flex items-center justify-between w-full gap-2">
            <button
              type="button"
              onClick={() => onProgress(challenge.id)}
              className="py-1.5 px-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Valider une étape (+1)</span>
            </button>

            <button
              type="button"
              onClick={() => onAbandon(challenge.id)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Abandonner sans pénalité"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(challenge.id)}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
            <span>Rejoindre le défi</span>
          </button>
        )}
      </div>

    </div>
  );
};
