import React from 'react';
import { RewardRedemption } from '../../types/entities';
import { X, CheckCircle, Clock, Store, AlertTriangle, QrCode } from 'lucide-react';

interface VoucherModalProps {
  redemption: RewardRedemption | null;
  rewardTitle?: string;
  onClose: () => void;
  onCancel?: (redemptionId: string) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  redemption,
  rewardTitle,
  onClose,
  onCancel,
}) => {
  if (!redemption) return null;

  const isUsed = redemption.status === 'USED';
  const isCancelled = redemption.status === 'CANCELLED' || redemption.status === 'EXPIRED';
  const isAvailable = redemption.status === 'ISSUED' || redemption.status === 'RESERVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-linear-to-br from-teal-800 to-emerald-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[10px] uppercase font-black tracking-widest text-teal-300">
            Bon d'Achat Partenaire • Nexus Loyalty
          </span>
          <h3 className="text-xl font-bold mt-1 text-white">
            {rewardTitle || 'Récompense Nexus Care'}
          </h3>
          <p className="text-xs text-teal-100/80 mt-1">
            Présentez ce bon en boutique ou appliquez-le lors de votre commande.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Statut du bon :</span>
            {isAvailable && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle className="w-3.5 h-3.5" /> Prêt à être utilisé
              </span>
            )}
            {isUsed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                <Clock className="w-3.5 h-3.5" /> Utilisé le {new Date(redemption.usedAt!).toLocaleDateString('fr-FR')}
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertTriangle className="w-3.5 h-3.5" /> Annulé / Expiré
              </span>
            )}
          </div>

          {/* Big Voucher Code Display */}
          <div className="bg-slate-50 border-2 border-dashed border-teal-300 rounded-2xl p-5 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Code Unique de Validation
              </span>
              <span className="text-2xl font-mono font-black text-slate-900 tracking-wider select-all">
                {redemption.redemptionCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Émis le {new Date(redemption.createdAt).toLocaleDateString('fr-FR')}
              {redemption.expiresAt && ` • Valable jusqu'au ${new Date(redemption.expiresAt).toLocaleDateString('fr-FR')}`}
            </p>
          </div>

          {/* Value / discount details */}
          {redemption.discountAmount && (
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-600">Valeur de remise :</span>
              <span className="font-bold text-slate-900">{redemption.discountAmount} €</span>
            </div>
          )}

          {redemption.partnerShopId && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 p-3 rounded-xl">
              <Store className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Valable chez les commerçants partenaires participants.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-sm font-bold transition cursor-pointer"
            >
              Fermer
            </button>
            {isAvailable && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(redemption.id)}
                className="py-3 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
              >
                Annuler et rembourser
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
