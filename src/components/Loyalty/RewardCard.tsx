import React from 'react';
import { Reward } from '../../types/entities';
import { Gift, Lock, Check, Sparkles, Tag, HeartHandshake, Compass } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  userLevelOrder: number;
  onRedeem: (rewardId: string) => void;
  isRedeeming?: boolean;
}

export const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  userPoints,
  userLevelOrder,
  onRedeem,
  isRedeeming = false,
}) => {
  const hasEnoughPoints = userPoints >= reward.pointsCost;
  const meetsLevelRequirement = (reward.minLevelOrder || 1) <= userLevelOrder;
  const isOutOfStock = reward.stock === 0;
  const canRedeem = hasEnoughPoints && meetsLevelRequirement && !isOutOfStock && !isRedeeming;

  const getTypeIcon = () => {
    switch (reward.type) {
      case 'COUPON':
        return <Tag className="w-4 h-4 text-emerald-600" />;
      case 'DONATION':
        return <HeartHandshake className="w-4 h-4 text-rose-600" />;
      case 'EXPERIENCE':
        return <Compass className="w-4 h-4 text-amber-600" />;
      default:
        return <Gift className="w-4 h-4 text-teal-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (reward.type) {
      case 'COUPON':
        return 'Bon de réduction';
      case 'DONATION':
        return 'Éco-don solidaire';
      case 'EXPERIENCE':
        return 'Atelier bien-être';
      default:
        return 'Produit exclusif';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden">
      
      {/* Top Banner / Image */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </span>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{reward.pointsCost} pts</span>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 text-base leading-snug">
            {reward.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            {reward.description}
          </p>
        </div>

        {/* Requirements & Stock */}
        <div className="space-y-1 pt-1 text-[11px]">
          {reward.minLevelOrder && reward.minLevelOrder > 1 && (
            <div className={`flex items-center gap-1.5 ${meetsLevelRequirement ? 'text-emerald-700' : 'text-slate-500'}`}>
              {meetsLevelRequirement ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Niveau {reward.minLevelOrder} minimum requis</span>
            </div>
          )}

          {typeof reward.stock === 'number' && reward.stock >= 0 && (
            <div className="text-slate-500">
              {reward.stock === 0 ? (
                <span className="text-rose-600 font-semibold">Rupture de stock</span>
              ) : (
                <span>Stock restant : {reward.stock} disponibles</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[11px]">
          {!hasEnoughPoints ? (
            <span className="text-rose-600 font-semibold">
              Manque {reward.pointsCost - userPoints} pts
            </span>
          ) : !meetsLevelRequirement ? (
            <span className="text-slate-500 font-semibold">Niveau insuffisant</span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Éligible
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!canRedeem}
          onClick={() => onRedeem(reward.id)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            canRedeem
              ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-xs'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isRedeeming ? (
            <span>Traitement...</span>
          ) : (
            <>
              <Gift className="w-3.5 h-3.5" />
              <span>Obtenir</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
