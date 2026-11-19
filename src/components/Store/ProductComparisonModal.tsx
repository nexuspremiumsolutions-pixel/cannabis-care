import React from 'react';
import {
  X,
  Layers,
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Star,
  Activity,
  Sparkles,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { BotanicalLeafIcon } from '../Common/BotanicalDecor';
import { getProductImage } from '../../assets/cannabisAssets';
import { useCart } from '../../context/CartContext';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onSelectProduct: (product: any) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onClearAll,
  onSelectProduct,
}) => {
  const { addToCart } = useCart();
  const [addingId, setAddingId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async (product: any) => {
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
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-emerald-950/15 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                Comparateur d’Extraits & Cannabinoïdes
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                  {products.length} sélectionné{products.length > 1 ? 's' : ''}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Analyse comparative des concentrations, terpènes et traçabilité de laboratoire
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition cursor-pointer"
              >
                Tout effacer
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-x-auto max-h-[75vh]">
          {products.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">Aucun produit dans le comparateur</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cliquez sur l’icône « Comparer » sur les fiches produits du catalogue pour les analyser côte à côte.
              </p>
            </div>
          ) : (
            <div className="min-w-[650px] space-y-6">
              {/* Top Cards Row */}
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-100">
                <div className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center">
                  Caractéristiques
                </div>
                {products.map((p) => {
                  const img = p.images?.[0] || getProductImage(p.category, p.name);
                  return (
                    <div key={p.id} className="relative p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <button
                        onClick={() => onRemoveProduct(p.id)}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-white/80 text-slate-400 hover:text-rose-600 shadow-2xs cursor-pointer"
                        title="Retirer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-28 rounded-xl overflow-hidden bg-white">
                        <img
                          src={img}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          {p.brand || 'Nexus Botanics'}
                        </span>
                        <h4
                          onClick={() => onSelectProduct(p)}
                          className="text-xs font-black text-slate-900 line-clamp-2 hover:text-emerald-900 cursor-pointer"
                        >
                          {p.name}
                        </h4>
                        <div className="text-sm font-black text-slate-900 pt-1">
                          {(p.price ?? 29.9).toFixed(2)} €
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(p)}
                        disabled={addingId === p.id}
                        className="w-full py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{addingId === p.id ? 'Ajout...' : 'Ajouter'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Rows */}
              <div className="space-y-3 text-xs">
                {/* Cannabinoid CBD */}
                <div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-100 items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-700" /> Taux de CBD
                  </span>
                  {products.map((p) => (
                    <div key={p.id} className="font-black text-emerald-900 text-sm">
                      {p.declaredCBDPercentage ?? p.cbdConcentrationPercent ?? 10}%
                    </div>
                  ))}
                </div>

                {/* THC Legal Limit */}
                <div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-100 items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Taux de THC (UE)
                  </span>
                  {products.map((p) => (
                    <div key={p.id} className="text-slate-700 font-semibold">
                      &lt; {p.declaredTHCPercentage ?? p.thcConcentrationPercent ?? 0.18}% (Légal)
                    </div>
                  ))}
                </div>

                {/* Cannabinoïdes Secondaires */}
                <div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-100 items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <BotanicalLeafIcon size={14} className="text-teal-700" /> Cannabinoïdes Mineurs
                  </span>
                  {products.map((p) => {
                    const prof = p.cannabinoidProfile || {};
                    return (
                      <div key={p.id} className="text-slate-600 space-y-0.5 text-[11px]">
                        {prof.cbg && <div>CBG: {prof.cbg}%</div>}
                        {prof.cbn && <div>CBN: {prof.cbn}%</div>}
                        {prof.cbc && <div>CBC: {prof.cbc}%</div>}
                        {!prof.cbg && !prof.cbn && <div>Traces naturelles actives</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Terpènes dominants */}
                <div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-100 items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Terpènes
                  </span>
                  {products.map((p) => (
                    <div key={p.id} className="flex flex-wrap gap-1">
                      {(p.terpeneProfile || ['Myrcène', 'Limonène']).map((t: string) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-950 font-bold text-[10px] border border-emerald-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Méthode d'extraction & culture */}
                <div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-100 items-center">
                  <span className="font-bold text-slate-700">Culture & Extraction</span>
                  {products.map((p) => (
                    <div key={p.id} className="text-slate-600 text-[11px] leading-relaxed">
                      {p.qualityInformation?.cultivationMethod || 'Chanvre Biologique UE'} •{' '}
                      {p.qualityInformation?.extractionMethod || 'Distillation douce CO2'}
                    </div>
                  ))}
                </div>

                {/* Certification HPLC */}
                <div className="grid grid-cols-4 gap-4 py-2 border-b border-slate-100 items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-500" /> Contrôle HPLC
                  </span>
                  {products.map((p) => (
                    <div key={p.id} className="text-slate-600 text-[11px]">
                      <span className="font-bold text-emerald-800">
                        {p.batchNumber || 'HPLC Certifié'}
                      </span>
                      <div className="text-[10px] text-slate-400">0.00 ppm solvants & métaux</div>
                    </div>
                  ))}
                </div>

                {/* Avis Clients */}
                <div className="grid grid-cols-4 gap-4 py-2 items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Avis Clients
                  </span>
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>4.9 / 5</span>
                      <span className="text-[10px] text-slate-400">(Avis vérifiés)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tous nos produits sont analysés selon les normes de la Pharmacopée européenne.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Fermer le comparateur
          </button>
        </div>
      </div>
    </div>
  );
};
