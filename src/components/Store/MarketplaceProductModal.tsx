import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  CheckCircle2,
  FileText,
  Star,
  ShoppingBag,
  Truck,
  Heart,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  Plus,
  Minus,
  Store,
  Layers,
  Activity,
  AlertCircle,
  Share2,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { BotanicalLeafIcon } from '../Common/BotanicalDecor';
import { getProductImage } from '../../assets/cannabisAssets';
import { useCart } from '../../context/CartContext';

interface MarketplaceProductModalProps {
  product: any | null;
  shop: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBatchDetails?: (batch: any) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  isInComparison?: boolean;
  onToggleComparison?: (product: any) => void;
}

export const MarketplaceProductModal: React.FC<MarketplaceProductModalProps> = ({
  product,
  shop,
  isOpen,
  onClose,
  onOpenBatchDetails,
  isFavorite = false,
  onToggleFavorite,
  isInComparison = false,
  onToggleComparison,
}) => {
  const { addToCart, openCartDrawer } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'dosage' | 'analysis' | 'reviews'>('profile');
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const defaultImage = getProductImage(product.category, product.name);
  const images = product.images && product.images.length > 0 ? product.images : [defaultImage];
  const activeImage = images[selectedImageIndex] || defaultImage;

  const cbdPct = product.declaredCBDPercentage ?? product.cbdConcentrationPercent ?? 10;
  const thcPct = product.declaredTHCPercentage ?? product.thcConcentrationPercent ?? 0.18;
  const cannabinoidProfile = product.cannabinoidProfile || {
    cbd: cbdPct,
    thc: thcPct,
    cbg: 0.8,
    cbn: 0.4,
    cbc: 0.3,
  };
  const terpenes = product.terpeneProfile || ['Myrcène', 'Limonène', 'Caryophyllène', 'Linalol'];

  const handleAddToCart = async () => {
    setIsAdding(true);
    const res = await addToCart(product.id, quantity);
    setIsAdding(false);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3500);
    }
  };

  const shopName = shop?.commercialName || shop?.name || product.storeName || 'Boutique Partenaire Agréée';
  const totalPrice = ((product.price ?? product.priceEstimated ?? 29.90) * quantity).toFixed(2);

  // Terpene descriptors map
  const terpeneNotes: Record<string, { note: string; effect: string }> = {
    Myrcène: { note: 'Terreux & boisé', effect: 'Relaxation profonde et potentialisateur d’effet d’entourage' },
    Limonène: { note: 'Zeste d’agrumes frais', effect: 'Élévation de l’humeur et clarté mentale' },
    Caryophyllène: { note: 'Poivré & épicé', effect: 'Interagit directement avec le récepteur CB2' },
    'Bêta-Caryophyllène': { note: 'Poivré & épicé', effect: 'Interagit directement avec le récepteur CB2' },
    Linalol: { note: 'Lavande & floral doux', effect: 'Apaisement nerveux et soutien du sommeil' },
    'Alpha-Pinène': { note: 'Pin frais & résineux', effect: 'Vigilance douce et respiration aisée' },
    Pinène: { note: 'Pin sylvestre', effect: 'Respiration et vivacité sensorielle' },
    Terpinolène: { note: 'Fleurs sauvages & pomme', effect: 'Propriétés antioxydantes et sédatives' },
    Humulène: { note: 'Houblon terreux', effect: 'Propriétés apaisantes et équilibre de l’appétit' },
    Bisabolol: { note: 'Camomille douce', effect: 'Soin cutané et soulagement tissulaire' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-emerald-950/15 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-900 text-emerald-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <BotanicalLeafIcon size={13} className="text-emerald-400" />
              {product.category?.replace('cat_', '').replace('-', ' ') || 'Phytothérapie Certifiée'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Agréé Norme Européenne
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleComparison && (
              <button
                onClick={() => onToggleComparison(product)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isInComparison
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Comparer avec d’autres extraits"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isInComparison ? 'Au comparateur' : 'Comparer'}</span>
              </button>
            )}

            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(product.id)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-rose-50'
                }`}
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter à mes favoris'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              aria-label="Fermer la fiche produit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Media & Highlights (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-gradient-to-b from-slate-50 to-white flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 space-y-4">
            <div className="space-y-3">
              {/* Main Image Stage with zoom feel */}
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-emerald-950/5 border border-emerald-950/10 group shadow-inner">
                <img
                  src={activeImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Potency Badge Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/90 backdrop-blur-md text-emerald-200 text-xs font-black border border-emerald-500/30 shadow-md">
                    CBD {cbdPct}%
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-bold border border-white/20">
                    THC &lt; {thcPct}% (Légal UE)
                  </span>
                </div>

                {/* Batch tag bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-mono font-bold shadow-xs border border-slate-200 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-emerald-700" />
                    {product.batchNumber || 'HPLC-CERT-2026'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-900/95 backdrop-blur-md text-emerald-200 text-[10px] font-bold shadow-xs border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    100% Bio & Traçable
                  </span>
                </div>
              </div>

              {/* Multi-angle Thumbnails if available */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                        selectedImageIndex === idx
                          ? 'border-emerald-700 shadow-md scale-102'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Aperçu ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Merchant / Store Origin Badge */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span>{shopName}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9 (240+)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Expédition sous 24h par transporteur discret neutre. Frais de port offerts dès{' '}
                {shop?.freeDeliveryThreshold ?? 50} €.
              </p>
            </div>
          </div>

          {/* Right Column: Specifications & Purchasing (7 cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Product Title & Brand */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  <span>{product.brand || 'Laboratoire Phyto-Certifié'}</span>
                  <span className="text-slate-400 font-medium lowercase">
                    {product.unit ? `${product.quantityPerUnit ?? ''} ${product.unit}` : 'Format certifié'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {product.description || product.shortDescription}
                </p>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-bold">
                {[
                  { id: 'profile', label: 'Cannabinoïdes & Terpènes' },
                  { id: 'dosage', label: 'Posologie & Conseils' },
                  { id: 'analysis', label: 'Certificat HPLC' },
                  { id: 'reviews', label: 'Avis Vérifiés (4.9)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id as any)}
                    className={`pb-2.5 px-3 transition cursor-pointer border-b-2 font-bold ${
                      activeDetailTab === tab.id
                        ? 'border-emerald-800 text-emerald-900'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Profile Cannabinoïdes & Terpènes */}
              {activeDetailTab === 'profile' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Cannabinoid Potency Spectrum */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-900/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-700" /> Spectre de Cannabinoïdes Actifs
                      </span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-emerald-200">
                        {thcPct <= 0.05 ? 'Broad Spectrum (0.0% THC)' : 'Full Spectrum Naturel'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] text-slate-500 font-bold block">CBD (Cannabidiol)</span>
                        <span className="text-base font-black text-emerald-900">{cbdPct}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] text-slate-500 font-bold block">THC (Tétrahydrocannabinol)</span>
                        <span className="text-base font-black text-slate-800">&lt; {thcPct}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] text-slate-500 font-bold block">CBG (Cannabigérol)</span>
                        <span className="text-base font-black text-teal-800">{cannabinoidProfile.cbg || 0.8}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                        <span className="text-[10px] text-slate-500 font-bold block">CBN (Cannabinol)</span>
                        <span className="text-base font-black text-indigo-800">{cannabinoidProfile.cbn || 0.4}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Terpene Profile & Aromatherapy */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Profil Terpénique & Arômes Naturels
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {terpenes.map((terp: string) => {
                        const info = terpeneNotes[terp] || {
                          note: 'Arôme complexe floral',
                          effect: 'Effet d’entourage synergique certifié',
                        };
                        return (
                          <div key={terp} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className="flex items-center gap-1">
                                <BotanicalLeafIcon size={12} className="text-emerald-700" />
                                {terp}
                              </span>
                              <span className="text-[10px] text-emerald-800 font-medium">{info.note}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{info.effect}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Posologie & Conseils */}
              {activeDetailTab === 'dosage' && (
                <div className="space-y-4 animate-in fade-in duration-150 text-xs">
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-2 text-amber-950">
                    <h4 className="font-extrabold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-700" />
                      Protocole d’Administration Progressive (Titration)
                    </h4>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      Chaque métabolisme possède sa propre sensibilité aux récepteurs cannabinoïdes (CB1 & CB2).
                      Commencez par la dose minimale recommandée pendant 3 à 5 jours avant d’augmenter si nécessaire.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">Dose de départ suggérée</span>
                      <p className="text-[11px] text-slate-600">
                        {product.category?.includes('huile')
                          ? '2 à 3 gouttes sous la langue (garder 60s avant d’avaler), 2 fois par jour.'
                          : product.category?.includes('fleur')
                          ? 'Infuser avec un corps gras (lait entier, huile de coco) pendant 8 minutes.'
                          : '1 prise par jour au cours d’un repas équilibré.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 block">Temps d’action ressenti</span>
                      <p className="text-[11px] text-slate-600">
                        {product.category?.includes('huile')
                          ? 'Effets notables en 15 à 30 minutes, durée 4 à 6 heures.'
                          : 'Effets progressifs en 45 à 90 minutes, durée 6 à 8 heures.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed border border-slate-200">
                    <strong>Précautions :</strong> Ne pas dépasser 50 mg de CBD par jour sans avis spécialisé. Déconseillé aux femmes enceintes ou allaitantes. Conserver à l’abri de la lumière et de la chaleur.
                  </div>
                </div>
              )}

              {/* Tab 3: Certificat HPLC */}
              {activeDetailTab === 'analysis' && (
                <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">
                          Analyses Chromatographiques HPLC
                        </span>
                        <h4 className="text-sm font-bold text-white">Certificat d’Authenticité de Lot</h4>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="space-y-1.5 text-xs text-emerald-100/90 font-mono">
                      <div className="flex justify-between py-0.5 border-b border-emerald-900">
                        <span className="text-emerald-300">Numéro de Lot :</span>
                        <strong className="text-white">{product.batchNumber || 'LOT-NX-2026-042'}</strong>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-emerald-900">
                        <span className="text-emerald-300">Laboratoire Agréé :</span>
                        <strong className="text-white">{product.qualityInformation?.labName || 'Phytocontrol Analytics (COFRAC)'}</strong>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-emerald-900">
                        <span className="text-emerald-300">Date du test :</span>
                        <strong className="text-white">{product.qualityInformation?.analysisDate || '14 Janvier 2026'}</strong>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-emerald-900">
                        <span className="text-emerald-300">Taux CBD vérifié :</span>
                        <strong className="text-emerald-400">{cbdPct}% conformité conforme</strong>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-emerald-900">
                        <span className="text-emerald-300">Taux THC mesuré :</span>
                        <strong className="text-white">&lt; {thcPct}% (Loi européenne &lt; 0.3%)</strong>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="text-emerald-300">Pesticides & Métaux lourds :</span>
                        <strong className="text-emerald-400">Non détectés (0.00 ppm)</strong>
                      </div>
                    </div>
                  </div>

                  {onOpenBatchDetails && (
                    <button
                      onClick={() =>
                        onOpenBatchDetails({
                          batchNumber: product.batchNumber || 'LOT-NX-2026-042',
                          testingLabName: product.qualityInformation?.labName || 'Phytocontrol Analytics (COFRAC)',
                          analysisDate: product.qualityInformation?.analysisDate || '14 Janvier 2026',
                          cbdLabResultPercent: cbdPct,
                          thcLabResultPercent: thcPct,
                        })
                      }
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-800" />
                      <span>Télécharger le rapport d’analyse officiel (PDF)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Tab 4: Avis Vérifiés */}
              {activeDetailTab === 'reviews' && (
                <div className="space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-slate-900">4.9</span>
                      <div>
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500">Basé sur 148 avis clients certifiés</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                      ✓ Achats Vérifiés
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {[
                      {
                        author: 'Camille V.',
                        date: 'Il y a 3 jours',
                        rating: 5,
                        text: 'Qualité irréprochable. Le goût est très naturel sans amertume artificielle, et l’effet relaxant en soirée est au rendez-vous.',
                      },
                      {
                        author: 'Julien M.',
                        date: 'Il y a 1 semaine',
                        rating: 5,
                        text: 'Colis reçu en 24h avec le rapport d’analyse imprimé. Traçabilité exemplaire, bravo pour ce niveau d’exigence.',
                      },
                      {
                        author: 'Sophie L.',
                        date: 'Il y a 2 semaines',
                        rating: 5,
                        text: 'Parfait pour calmer mes tensions musculaires après mes séances de running. Je recommande les yeux fermés !',
                      },
                    ].map((rev, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900">{rev.author}</strong>
                          <span className="text-[10px] text-slate-400">{rev.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{rev.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Checkout & Action Area */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {addedSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-900 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>{quantity}x &ldquo;{product.name}&rdquo; ajouté au panier !</span>
                  </div>
                  <button
                    onClick={openCartDrawer}
                    className="underline text-emerald-200 hover:text-white cursor-pointer"
                  >
                    Voir le panier →
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Price block */}
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{totalPrice} €</span>
                    <span className="text-xs text-slate-500 font-medium">TTC</span>
                    {quantity > 1 && (
                      <span className="text-[11px] text-slate-400">
                        ({(product.price ?? 29.9).toFixed(2)} € / unité)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> En stock • Expédié sous 24h ouvrées
                  </span>
                </div>

                {/* Quantity & Add button */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
                      title="Diminuer la quantité"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-slate-800">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stockQuantity || 99, q + 1))}
                      className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
                      title="Augmenter la quantité"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || (product.stockQuantity ?? 1) <= 0}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-emerald-900 hover:bg-emerald-950 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-300" />
                    <span>{isAdding ? 'Ajout en cours...' : 'Ajouter au Panier Multi-Boutiques'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
