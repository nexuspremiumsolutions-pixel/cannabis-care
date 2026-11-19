import React from 'react';
import { EnrichedUserAchievement } from '../../../backend/services/loyalty/achievementService';
import { Trophy, Lock, CheckCircle2, Sparkles, Award } from 'lucide-react';

interface BadgeCardProps {
  badge: EnrichedUserAchievement;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  const isUnlocked = badge.isUnlocked;

  const getRarityStyle = () => {
    switch (badge.rarity) {
      case 'LEGENDARY':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          ring: 'border-amber-400 bg-amber-50',
          label: 'Légendaire',
        };
      case 'EPIC':
        return {
          badge: 'bg-purple-100 text-purple-900 border-purple-300',
          ring: 'border-purple-400 bg-purple-50',
          label: 'Épique',
        };
      case 'RARE':
        return {
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          ring: 'border-sky-400 bg-sky-50',
          label: 'Rare',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          ring: 'border-slate-300 bg-slate-50',
          label: 'Commun',
        };
    }
  };

  const rarity = getRarityStyle();

  return (
    <div
      className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
        isUnlocked
          ? 'bg-white border-slate-200 shadow-xs hover:shadow-md'
          : 'bg-slate-50/70 border-dashed border-slate-300 opacity-75'
      }`}
    >
      <div className="space-y-3">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${rarity.badge}`}
          >
            {rarity.label}
          </span>

          <div className="flex items-center gap-1 text-xs font-bold text-amber-700">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>+{badge.pointsReward} pts</span>
          </div>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isUnlocked ? rarity.ring : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            {isUnlocked ? (
              <Trophy className="w-6 h-6 text-teal-700" />
            ) : (
              <Lock className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div>
            <h5
              className={`font-bold text-sm leading-tight ${
                isUnlocked ? 'text-slate-900' : 'text-slate-600'
              }`}
            >
              {badge.title}
            </h5>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal line-clamp-2">
              {badge.description}
            </p>
          </div>
        </div>

      </div>

      {/* Footer / Status */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {isUnlocked ? (
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Débloqué le {new Date(badge.unlockedAt!).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="text-slate-400 italic flex items-center gap-1">
            <Award className="w-3 h-3" />
            En cours d'obtention
          </span>
        )}
      </div>

    </div>
  );
};
