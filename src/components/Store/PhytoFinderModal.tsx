import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Compass,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ShoppingBag,
  Star,
  ShieldCheck,
  Activity,
  Heart,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import { BotanicalLeafIcon } from '../Common/BotanicalDecor';
import { getProductImage } from '../../assets/cannabisAssets';
import { useCart } from '../../context/CartContext';

interface PhytoFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onSelectProduct: (product: any) => void;
}

export const PhytoFinderModal: React.FC<PhytoFinderModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const { addToCart, openCartDrawer } = useCart();
  const [step, setStep] = useState<1 | 2 | 3 | 'results'>(1);
  const [goal, setGoal] = useState<string>('sleep');
  const [format, setFormat] = useState<string>('oil');
  const [intensity, setIntensity] = useState<string>('moderate');
  const [addingId, setAddingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setGoal('sleep');
    setFormat('oil');
    setIntensity('moderate');
  };

  // Filter & score products
  const matchedProducts = products
    .map((p) => {
      let score = 70;
      const cat = (p.category || p.categoryId || '').toLowerCase();
      const nameDesc = `${p.name} ${p.description || ''}`.toLowerCase();

      // Format match
      if (format === 'oil' && (cat.includes('huile') || nameDesc.includes('huile'))) score += 20;
      if (format === 'flower' && (cat.includes('fleur') || cat.includes('resine') || nameDesc.includes('fleur'))) score += 20;
      if (format === 'tea' && (cat.includes('infusion') || nameDesc.includes('infusion') || nameDesc.includes('tisane'))) score += 20;
      if (format === 'capsule' && (cat.includes('capsule') || cat.includes('gelule') || nameDesc.includes('gélule'))) score += 20;
      if (format === 'topical' && (cat.includes('cosmetique') || nameDesc.includes('baume') || nameDesc.includes('crème'))) score += 20;

      // Goal match
      if (goal === 'sleep' && (nameDesc.includes('sommeil') || nameDesc.includes('nuit') || nameDesc.includes('cbn') || nameDesc.includes('paisible'))) score += 15;
      if (goal === 'stress' && (nameDesc.includes('stress') || nameDesc.includes('zen') || nameDesc.includes('anx') || nameDesc.includes('apais'))) score += 15;
      if (goal === 'recovery' && (nameDesc.includes('recup') || nameDesc.includes('muscle') || nameDesc.includes('douleur') || nameDesc.includes('baume'))) score += 15;
      if (goal === 'focus' && (nameDesc.includes('amnesia') || nameDesc.includes('energie') || nameDesc.includes('limonene') || nameDesc.includes('cbg'))) score += 15;

      // Intensity match
      const cbdPct = p.declaredCBDPercentage ?? p.cbdConcentrationPercent ?? 10;
      if (intensity === 'light' && cbdPct <= 10) score += 10;
      if (intensity === 'moderate' && cbdPct > 10 && cbdPct <= 20) score += 10;
      if (intensity === 'strong' && cbdPct > 20) score += 10;

      return { product: p, score: Math.min(99, score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const handleAddToCart = async (product: any) => {
    setAddingId(product.id);
    await addToCart(product.id, 1);
    setAddingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-950/15 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-400/30 flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Diagnostic Phyto & Recommandations
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  IA Botanique
                </span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Trouvez l’extrait parfaitement adapté à votre système endocannabinoïde
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold">
          <span className="text-slate-500">
            {step === 'results' ? 'Recommandations Personnalisées' : `Étape ${step} sur 3`}
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === 'results' || (typeof step === 'number' && step >= s)
                    ? 'w-8 bg-emerald-800'
                    : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body Steps */}
        <div className="p-6">
          {/* STEP 1: GOAL */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  1. Quel est votre objectif prioritaire de bien-être ?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Les cannabinoïdes ciblent des récepteurs différents selon votre intention d’usage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: 'sleep',
                    title: 'Sommeil & Nuit Profonde',
                    desc: 'Endormissement plus rapide, réduction des réveils nocturnes (CBD + CBN).',
                    icon: Moon,
                    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                  },
                  {
                    id: 'stress',
                    title: 'Sérénité & Anti-Stress',
                    desc: 'Apaisement de la charge mentale et tensions du quotidien sans somnolence.',
                    icon: Heart,
                    color: 'text-rose-600 bg-rose-50 border-rose-200',
                  },
                  {
                    id: 'recovery',
                    title: 'Récupération & Confort Physique',
                    desc: 'Soulagement des courbatures, articulations sensibles et fatigue musculaire.',
                    icon: Activity,
                    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                  },
                  {
                    id: 'focus',
                    title: 'Énergie & Clarté Mentale',
                    desc: 'Vitalité douce, concentration et vivacité sans nervosité (CBD + CBG + Limonène).',
                    icon: Sun,
                    color: 'text-amber-600 bg-amber-50 border-amber-200',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGoal(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      goal === item.id
                        ? 'border-emerald-700 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-xl ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {goal === item.id && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900">{item.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FORMAT */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  2. Quel mode d’administration correspond le mieux à votre routine ?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Chaque format offre une biodisponibilité et une vitesse d’action spécifiques.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  {
                    id: 'oil',
                    title: 'Huile Sublinguale',
                    desc: 'Action rapide (15-30 min), dosage précis au compte-gouttes, biodisponibilité maximale.',
                  },
                  {
                    id: 'flower',
                    title: 'Fleurs & Résines Affinées',
                    desc: 'Pour infusion avec matière grasse ou vaporisation douce. Expérience aromatique terpénique intense.',
                  },
                  {
                    id: 'tea',
                    title: 'Infusions & Tisanes',
                    desc: 'Rituel chaud relaxant, diffusion douce et progressive idéale en soirée.',
                  },
                  {
                    id: 'topical',
                    title: 'Baumes & Cosmétiques',
                    desc: 'Application ciblée sur les zones musculaires et articulaires ou soin dermatologique apaisant.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFormat(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      format === item.id
                        ? 'border-emerald-700 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{item.title}</span>
                      {format === item.id && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Étape précédente
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: INTENSITY */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">
                  3. Quelle intensité de cannabinoïdes préférez-vous ?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Permet d’ajuster le dosage selon votre expérience passée avec le chanvre.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    id: 'light',
                    title: 'Découverte Douce (5% - 10%)',
                    desc: 'Idéal pour débuter en douceur et évaluer la réceptivité de votre organisme.',
                  },
                  {
                    id: 'moderate',
                    title: 'Équilibré & Polyvalent (10% - 20%)',
                    desc: 'Le standard optimal pour une action efficace au quotidien sur le stress et la détente.',
                  },
                  {
                    id: 'strong',
                    title: 'Concentré & Intense (> 20%)',
                    desc: 'Pour les besoins prononcés, tensions sévères ou utilisateurs réguliers expérimentés.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setIntensity(item.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      intensity === item.id
                        ? 'border-emerald-700 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900">{item.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {intensity === item.id && <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Étape précédente
                </button>
                <button
                  onClick={() => setStep('results')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Calculer mes Recommandations</span>
                </button>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {step === 'results' && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest block font-bold">
                    Recommandations Certifiées
                  </span>
                  <h4 className="text-sm sm:text-base font-black">
                    Voici les {matchedProducts.length} extraits les plus adaptés à votre profil
                  </h4>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer text-emerald-200 hover:text-white"
                  title="Recommencer le diagnostic"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refaire</span>
                </button>
              </div>

              <div className="space-y-3">
                {matchedProducts.map(({ product: prod, score }) => {
                  const img = prod.images?.[0] || getProductImage(prod.category, prod.name);
                  const cbdPct = prod.declaredCBDPercentage ?? prod.cbdConcentrationPercent ?? 10;
                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-white border border-emerald-950/10 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={img}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black">
                              {score}% Affinité
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              CBD {cbdPct}% • {prod.brand || 'Nexus Botanics'}
                            </span>
                          </div>

                          <h5
                            onClick={() => {
                              onSelectProduct(prod);
                              onClose();
                            }}
                            className="text-xs sm:text-sm font-black text-slate-900 hover:text-emerald-900 cursor-pointer line-clamp-1"
                          >
                            {prod.name}
                          </h5>

                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {prod.shortDescription || prod.description}
                          </p>

                          <div className="text-xs font-black text-slate-900 pt-0.5">
                            {(prod.price ?? 29.9).toFixed(2)} €
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            onSelectProduct(prod);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={addingId === prod.id}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{addingId === prod.id ? 'Ajout...' : 'Ajouter'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-emerald-900 hover:underline cursor-pointer"
                >
                  Continuer vers le catalogue complet →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
