import React from 'react';
import { Sparkles, Check, ShieldCheck, X, ArrowRight, Lock } from 'lucide-react';

interface PremiumGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscribe: () => void;
  featureTitle?: string;
  featureDescription?: string;
}

export const PremiumGateModal: React.FC<PremiumGateModalProps> = ({
  isOpen,
  onClose,
  onOpenSubscribe,
  featureTitle = 'Fonctionnalité Premium Réservée',
  featureDescription = 'Cette fonctionnalité avancée est disponible dans la formule Nexus Équilibre.',
}) => {
  if (!isOpen) return null;

  const benefits = [
    'Bilans et analyses avancées de consommation (hebdomadaires & mensuels)',
    'Conseiller IA bienveillant & recommandations personnalisées illimitées',
    'Historique de journalisation sans limite temporelle',
    'Export complet de vos données de santé (PDF médical & CSV)',
    'Programmes d’accompagnement bien-être et réduction des risques',
    'Essai gratuit de 14 jours sans aucun engagement',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-teal-900 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nexus Équilibre Premium</span>
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">{featureTitle}</h3>
          <p className="text-xs text-slate-300 mt-1">{featureDescription}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <p className="font-bold text-slate-900">
            Passez au niveau supérieur de votre parcours bien-être :
          </p>

          <div className="space-y-2.5">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="text-[11px] leading-relaxed text-slate-700 font-medium">{b}</span>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Formule Nexus Équilibre</span>
              <span className="text-base font-black text-teal-900">9.99 € / mois</span>
              <span className="text-[10px] text-slate-500 block">ou 99 € / an (2 mois offerts)</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-extrabold text-[10px]">
              14 Jours d’essai gratuit
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSubscribe();
              }}
              className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <span>Découvrir les formules & Essai gratuit</span>
              <ArrowRight className="w-4 h-4 text-teal-300" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-slate-500 hover:text-slate-800 font-semibold transition cursor-pointer text-xs"
            >
              Continuer avec le forfait gratuit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
