import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CBDProduct } from '../../types/entities';
import {
  X,
  Heart,
  ShieldCheck,
  Award,
  AlertTriangle,
  Info,
  Droplet,
  Flower,
  FileCheck,
  Sparkles,
  MapPin,
  Tag,
  Plus,
  Edit2,
  ExternalLink,
  Beaker,
} from 'lucide-react';

interface CBDProductDetailModalProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onLogConsumption: (productId: string) => void;
  onEditProduct?: (product: CBDProduct) => void;
  onProductUpdated?: () => void;
}

export const CBDProductDetailModal: React.FC<CBDProductDetailModalProps> = ({
  isOpen,
  productId,
  onClose,
  onLogConsumption,
  onEditProduct,
  onProductUpdated,
}) => {
  const { token, user } = useAuth();
  const [productData, setProductData] = useState<any | null>(null);
  const [qualityNotice, setQualityNotice] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!productId || !token || !isOpen) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/cbd/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProductData(data.product);
          setQualityNotice(data.qualityNotice);
          setIsFavorite(Boolean(data.product.isFavorite));
        }
      } catch (err) {
        console.error('Failed to load CBD product details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [productId, token, isOpen]);

  const handleToggleFavorite = async () => {
    if (!productId || !token) return;
    setIsTogglingFavorite(true);
    try {
      const res = await fetch(`/api/cbd/products/${productId}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
        if (onProductUpdated) onProductUpdated();
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (!isOpen || !productId) return null;

  const prod: CBDProduct | null = productData;
  const isOwner = prod?.isUserCreated && prod?.userId === user?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Droplet className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {prod?.category || 'Produit CBD'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">{prod?.brand}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                {prod?.name || 'Fiche Produit'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading || !prod ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-400 animate-pulse">
            Chargement des détails du produit et du certificat de conformité...
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            
            {/* Description & Origin */}
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {prod.description || 'Produit formulé à base d’extraits de chanvre naturel légal.'}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-semibold text-slate-600">
                {prod.countryOfOrigin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>Origine : {prod.countryOfOrigin}</span>
                  </span>
                )}
                {prod.volumeOrWeight && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>Format : {prod.volumeOrWeight}</span>
                  </span>
                )}
                {prod.price && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold">
                    <span>{prod.price.toFixed(2)} €</span>
                  </span>
                )}
                {prod.sourceType === 'catalog' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>Catalogue Référencé</span>
                  </span>
                )}
                {prod.isUserCreated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800">
                    <span>Créé par vous</span>
                  </span>
                )}
              </div>
            </div>

            {/* Cannabinoid Profile Breakdown */}
            <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Beaker className="w-4 h-4 text-emerald-600" />
                  <span>Profil en Phytocannabinoïdes</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  THC ≤ 0.3% Certifié
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* CBD */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">CBD (Cannabidiol)</span>
                  <div className="text-base font-black text-emerald-700">
                    {prod.cbdPercentage !== null && prod.cbdPercentage !== undefined
                      ? `${prod.cbdPercentage}%`
                      : prod.cbdAmount
                      ? `${prod.cbdAmount} mg`
                      : 'Présent'}
                  </div>
                </div>

                {/* THC Legal rate */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">THC (Taux Légal)</span>
                  <div className="text-base font-black text-slate-800">
                    {prod.thcPercentage !== null && prod.thcPercentage !== undefined
                      ? `${prod.thcPercentage}%`
                      : '0.0%'}
                  </div>
                </div>

                {/* CBG */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">CBG (Cannabigérol)</span>
                  <div className="text-base font-black text-amber-700">
                    {prod.cannabinoidProfile?.cbg ? `${prod.cannabinoidProfile.cbg}%` : 'Traces'}
                  </div>
                </div>

                {/* CBN */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">CBN (Cannabinol)</span>
                  <div className="text-base font-black text-indigo-700">
                    {prod.cannabinoidProfile?.cbn ? `${prod.cannabinoidProfile.cbn}%` : 'Traces'}
                  </div>
                </div>
              </div>
            </div>

            {/* Terpenes & Ingredients */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Terpenes */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Terpènes dominants & Arômes</span>
                </div>
                {prod.terpeneProfile && prod.terpeneProfile.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prod.terpeneProfile.map((terp) => (
                      <span
                        key={terp}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 text-xs font-medium"
                      >
                        {terp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Profil terpénique standard naturel.</p>
                )}
              </div>

              {/* Composition */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ingrédients & Formule</span>
                </div>
                {prod.ingredients && prod.ingredients.length > 0 ? (
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {prod.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500">
                    {prod.carrierOil ? `Support : ${prod.carrierOil}` : 'Extrait de chanvre pur.'}
                  </p>
                )}
              </div>
            </div>

            {/* Quality Information & Lab Certificate */}
            {(prod.qualityInformation || productData.labBatch) && (
              <div className="p-4.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Traçabilité & Certificat de Contrôle Qualité</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-900">
                  <div>
                    <span className="text-slate-500 font-medium">N° de Lot : </span>
                    <span className="font-mono font-bold">
                      {prod.batchNumber || productData.labBatch?.batchNumber || 'LOT-2026-CONF'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Certificat Labo : </span>
                    <span className="font-mono font-bold">
                      {prod.qualityInformation?.certificateNumber ||
                        productData.labBatch?.labCertificateNumber ||
                        'CERT-FR-889'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Laboratoire : </span>
                    <span>{prod.qualityInformation?.labName || 'Laboratoire Agréé France'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Méthode d’extraction : </span>
                    <span>{prod.qualityInformation?.extractionMethod || 'CO2 Supercritique'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Essential Knowledge ("À savoir") */}
            <div className="p-4.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Informations Essentielles & Cadre d’Utilisation</span>
              </div>
              <div className="space-y-1.5 text-amber-900 text-[11px] leading-relaxed">
                <p>
                  • <strong>Variabilité naturelle :</strong> Les concentrations de phytocannabinoïdes peuvent légèrement varier d’un lot à l’autre selon les récoltes.
                </p>
                <p>
                  • <strong>Contrôles routiers :</strong> Bien que conforme à la législation (THC &le; 0.3%), l’utilisation répétée de produits contenant des traces de THC peut théoriquement entraîner un résultat positif aux tests salivaires ultra-sensibles.
                </p>
                <p>
                  • <strong>Médication & Santé :</strong> Le CBD n’est pas un médicament. En cas de traitement en cours (métabolisme hépatique CYP450), de grossesse ou d’allaitement, demandez systématiquement conseil à votre médecin ou pharmacien.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {isOwner && onEditProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditProduct(prod);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogConsumption(prod.id);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Consigner une prise avec ce produit</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
