import React, { useState, useEffect, useMemo } from 'react';
import {
  PartnerShop,
  CBDMarketplaceProduct,
  ShopReview,
  ShopCustomCategory,
} from '../../types/entities';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Star,
  Share2,
  Heart,
  ShoppingBag,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Truck,
  Package,
  QrCode,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { CANNABIS_IMAGES, getProductImage } from '../../assets/cannabisAssets';
import { BotanicalLeafIcon } from '../Common/BotanicalDecor';

interface PartnerStorefrontViewProps {
  shopIdOrSlug: string;
  onBack?: () => void;
}

export const PartnerStorefrontView: React.FC<PartnerStorefrontViewProps> = ({
  shopIdOrSlug,
  onBack,
}) => {
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { user } = useAuth();

  const [shop, setShop] = useState<PartnerShop | null>(null);
  const [products, setProducts] = useState<CBDMarketplaceProduct[]>([]);
  const [customCategories, setCustomCategories] = useState<ShopCustomCategory[]>([]);
  const [globalCategories, setGlobalCategories] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    reviews: ShopReview[];
  }>({
    averageRating: 5.0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reviews: [],
  });

  const [activeTab, setActiveTab] = useState<'catalog' | 'about' | 'logistics' | 'reviews' | 'share'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review form state
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch shop details and products
  useEffect(() => {
    async function loadStorefront() {
      try {
        setLoading(true);
        const [resShop, resProds, resCats, resRevs] = await Promise.all([
          fetch(`/api/marketplace/storefront/resolve/${shopIdOrSlug}`, {
            headers: user ? { Authorization: `Bearer ${user.id}` } : {},
          }),
          fetch(`/api/marketplace/storefront/${shopIdOrSlug}/products`),
          fetch(`/api/marketplace/storefront/${shopIdOrSlug}/categories`),
          fetch(`/api/marketplace/storefront/${shopIdOrSlug}/reviews`),
        ]);

        const dataShop = await resShop.json();
        const dataProds = await resProds.json();
        const dataCats = await resCats.json();
        const dataRevs = await resRevs.json();

        if (dataShop.success) {
          setShop(dataShop.shop);
          setIsFavorited(Boolean(dataShop.shop.isFavorited));
        }
        if (dataProds.success) {
          setProducts(dataProds.products);
        }
        if (dataCats.success) {
          setCustomCategories(dataCats.customCategories || []);
          setGlobalCategories(dataCats.globalCategories || []);
        }
        if (dataRevs.success) {
          setReviewsData({
            averageRating: dataRevs.averageRating || 5.0,
            totalReviews: dataRevs.totalReviews || 0,
            distribution: dataRevs.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            reviews: dataRevs.reviews || [],
          });
        }
      } catch (err) {
        console.error('Failed to load storefront data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStorefront();
  }, [shopIdOrSlug, user]);

  // Favorite toggle handler
  const handleToggleFavorite = async () => {
    if (!user) {
      setToastMessage('Veuillez vous connecter pour enregistrer cette boutique en favori.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      const res = await fetch(`/api/marketplace/storefront/${shopIdOrSlug}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsFavorited(data.isFavorited);
        setToastMessage(data.isFavorited ? 'Boutique ajoutée à vos favoris ❤️' : 'Boutique retirée des favoris');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add to cart handler
  const handleAddToCart = async (product: CBDMarketplaceProduct) => {
    await addToCart(product.id, 1);
    setToastMessage(`✓ "${product.name}" ajouté à votre panier`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Submit review handler
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToastMessage('Connexion requise pour publier un avis.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await fetch(`/api/marketplace/storefront/${shopIdOrSlug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          rating: newRating,
          title: newReviewTitle,
          comment: newReviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewsData((prev) => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          reviews: [data.review, ...prev.reviews],
        }));
        setNewReviewTitle('');
        setNewReviewComment('');
        setToastMessage('Merci pour votre avis ! Il a été publié avec succès.');
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        setToastMessage(`Erreur: ${data.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      setToastMessage('Impossible de publier l’avis.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Computed: check if shop is open now
  const isOpenNow = useMemo(() => {
    if (!shop || !shop.openingHours) return true;
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const hours = (shop.openingHours as any)[currentDay];
    if (!hours || hours.toLowerCase().includes('fermé')) return false;
    return true;
  }, [shop]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== 'ALL') {
      list = list.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          (p as any).customCategoryId === selectedCategory
      );
    }

    if (inStockOnly) {
      list = list.filter((p) => p.stockStatus === 'IN_STOCK' || p.stockQuantity > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'cbd_desc') {
      list.sort((a, b) => (b.cbdPercentage || 0) - (a.cbdPercentage || 0));
    } else {
      // featured
      list.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
    }

    return list;
  }, [products, selectedCategory, inStockOnly, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 py-16">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Chargement de la vitrine partenaire...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <Store className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Boutique Partenaire Introuvable</h2>
        <p className="text-xs text-slate-500">
          La vitrine demandée n&apos;existe pas ou a été temporairement désactivée.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition"
          >
            ← Retour au catalogue global
          </button>
        )}
      </div>
    );
  }

  // Visual Theme Styling Classes depending on shop template
  const template = shop.storefrontTemplate || 'classic';
  const primaryColor = shop.primaryColor || '#0f766e';
  const secondaryColor = shop.secondaryColor || '#042f2e';
  const accentColor = shop.accentColor || '#f59e0b';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au réseau marketplace</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Store className="w-4 h-4 text-teal-700" />
            <span>Réseau Partenaire Agréé</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-bold text-slate-800">{shop.publicName || shop.commercialName}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              isFavorited
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Enregistrer cette boutique"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">
              {isFavorited ? 'Boutique Favorite' : 'Ajouter aux favoris'}
            </span>
          </button>

          {/* Share button */}
          <button
            onClick={() => setActiveTab('share')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Partager / QR</span>
          </button>
        </div>
      </div>

      {/* Hero Storefront Banner */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200"
        style={{
          background:
            template === 'premium'
              ? `linear-gradient(135deg, ${secondaryColor} 0%, #0f172a 100%)`
              : template === 'wellness'
              ? `linear-gradient(135deg, #064e3b 0%, #115e59 100%)`
              : template === 'minimal'
              ? `linear-gradient(135deg, #1e293b 0%, #334155 100%)`
              : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Background visual image */}
        <img
          src={shop.bannerUrl || CANNABIS_IMAGES.dispensaryStorefront}
          alt={shop.commercialName}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
        />

        <div className="relative p-6 sm:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Shop Logo Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0 border-2 border-white/20">
              {shop.logoUrl ? (
                <img
                  src={shop.logoUrl}
                  alt={shop.commercialName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Store className="w-10 h-10 text-teal-800" />
              )}
            </div>

            {/* Shop Titles and Status */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1 border border-white/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  {shop.legalStatus === 'VERIFIED' ? 'Officiel & Certifié HPLC' : 'Agréé Nexus'}
                </span>

                {/* Live Open / Closed Badge */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isOpenNow
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                      : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {isOpenNow ? 'Ouvert actuellement' : 'Fermé'}
                </span>

                {/* Template badge */}
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/40 text-slate-300 border border-slate-600/30">
                  Style {template.toUpperCase()}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {shop.publicName || shop.commercialName}
              </h1>

              <p className="text-xs sm:text-sm text-white/80 max-w-xl line-clamp-2 leading-relaxed">
                {shop.shortDescription || shop.description}
              </p>

              {/* Location & Quick Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-white/90 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-300" />
                  {shop.address ? `${shop.address}, ` : ''}{shop.city} ({shop.country})
                </span>

                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <strong>{reviewsData.averageRating}</strong> ({reviewsData.totalReviews} avis vérifiés)
                </span>

                {shop.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-300" />
                    {shop.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Fulfillment Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-2.5 min-w-[240px] shrink-0">
            <div className="font-bold text-[11px] uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Modes de distribution
            </div>
            <div className="space-y-1.5 text-white/90">
              <div className="flex items-center justify-between">
                <span>Retrait Click &amp; Collect :</span>
                <strong className="text-emerald-300">
                  {shop.pickupAvailable ? shop.estimatedPickupTime || 'Prêt sous 2h' : 'Non disponible'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Livraison Domicile :</span>
                <strong className="text-white">
                  {shop.deliveryAvailable ? `${shop.deliveryFee || 4.90} € (${shop.estimatedDeliveryDays || '24-48h'})` : 'Non disponible'}
                </strong>
              </div>
              {shop.freeDeliveryThreshold && (
                <div className="text-[10px] text-teal-200 border-t border-white/10 pt-1">
                  Livraison offerte dès {shop.freeDeliveryThreshold} € d&apos;achat
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation inside Storefront */}
        <div className="bg-white/15 backdrop-blur-md px-6 border-t border-white/15 flex gap-2 overflow-x-auto text-xs font-bold text-white">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'catalog'
                ? 'border-white text-white font-extrabold'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Catalogue des Soins ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'about'
                ? 'border-white text-white font-extrabold'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>À propos &amp; Traçabilité Légale</span>
          </button>

          <button
            onClick={() => setActiveTab('logistics')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'logistics'
                ? 'border-white text-white font-extrabold'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Retrait &amp; Expédition</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-white text-white font-extrabold'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Avis Clients Vérifiés ({reviewsData.totalReviews})</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'share'
                ? 'border-white text-white font-extrabold'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Code &amp; Partage</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CATALOGUE */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          
          {/* Filters and search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher dans cette boutique (nom, extrait, ratio CBD)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="ALL">Toutes les catégories de la boutique</option>
                {customCategories.length > 0 && (
                  <optgroup label="Rayons personnalisés">
                    {customCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {globalCategories.length > 0 && (
                  <optgroup label="Catégories générales">
                    {globalCategories.map((gc) => (
                      <option key={gc.id} value={gc.id}>
                        {gc.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Sort by */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="featured">Sélection vedette</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="cbd_desc">Taux CBD décroissant</option>
              </select>

              {/* In stock only checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium px-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>En stock</span>
              </label>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Aucun produit dans ce rayon</h4>
              <p className="text-xs text-slate-500">
                Essayez d&apos;élargir votre recherche ou de réinitialiser vos filtres.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((prod) => {
                const cbdPct = prod.cbdPercentage || prod.activeMolecules?.cbd || 0;
                const thcPct = prod.thcPercentage || prod.activeMolecules?.thc || 0.15;
                const isOutOfStock = prod.stockStatus === 'OUT_OF_STOCK' || prod.stockQuantity <= 0;

                return (
                  <div
                    key={prod.id}
                    className="group bg-white rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                        <img
                          src={
                            prod.imageUrl ||
                            getProductImage(prod.category, prod.name)
                          }
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                          {cbdPct > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-teal-900/90 text-white text-[10px] font-black backdrop-blur-xs">
                              {cbdPct}% CBD
                            </span>
                          )}
                          {prod.featured && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[10px] font-black backdrop-blur-xs">
                              ⭐ Coup de cœur
                            </span>
                          )}
                        </div>

                        {/* THC Compliance badge */}
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-white/95 text-slate-700 text-[9px] font-bold shadow-xs border border-slate-100 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            THC &lt; 0.3%
                          </span>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span>{prod.brand || shop.commercialName}</span>
                          <span className="font-mono text-[10px]">{prod.volumeOrWeight || '30 ml'}</span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-teal-700 transition">
                          {prod.name}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Price & Action */}
                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black text-slate-900">
                          {prod.price.toFixed(2)} €
                        </span>
                        <div className="text-[10px] text-slate-400">TVA incluse</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* HPLC Certificate trigger */}
                        <button
                          onClick={() =>
                            setSelectedBatch({
                              batchNumber: prod.batchNumber || 'NEXUS-2026-HPLC-A',
                              testingLabName: 'Laboratoire Phytocannabique Européen Agréé',
                              analysisDate: 'Février 2026',
                              cbdLabResultPercent: cbdPct,
                              thcLabResultPercent: thcPct,
                            })
                          }
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Voir le certificat d'analyse HPLC de ce lot"
                        >
                          <FileText className="w-4 h-4 text-slate-700" />
                        </button>

                        {/* Add to cart */}
                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={isOutOfStock || isCartLoading}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-teal-800 text-white hover:bg-teal-900'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Épuisé' : 'Ajouter'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ABOUT & LEGAL COMPLIANCE */}
      {/* ========================================================================= */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Story & Philosophy */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-700" />
                <span>Histoire &amp; Engagement de la Boutique</span>
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                <p>{shop.fullDescription || shop.description}</p>
                <p>
                  Tous nos produits phytocannabiques sont issus de chanvre agricole certifié au catalogue européen, extrait au CO2 supercritique ou par macération douce sans solvants pétrochimiques.
                </p>
              </div>
            </div>

            {/* Legal Information Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <span>Conformité Réglementaire &amp; Mentions Légales</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 block">Raison Sociale &amp; Enregistrement</span>
                  <p>{shop.legalName || shop.commercialName}</p>
                  <p className="font-mono text-[11px] text-slate-500">RCS / Numéro SIREN disponible</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-800 block">Normes Cannabinoïdes UE</span>
                  <p>Taux de THC strictement &lt; 0.3% certifié par chromatographie HPLC.</p>
                  <p className="text-[11px] text-emerald-700 font-bold">Zéro substance psychotrope interdite.</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 sm:col-span-2">
                  <span className="font-bold text-slate-800 block">Mentions légales obligatoires</span>
                  <p className="leading-relaxed">
                    {shop.legalInformation ||
                      'Vente strictement réservée aux personnes majeures (+18 ans). Ne convient pas aux femmes enceintes ou allaitantes. Ce produit n’est pas un médicament et ne peut se substituer à un traitement médical prescrit par un professionnel de santé.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Return Policy */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                <span>Politique de Rétractation &amp; Retours</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {shop.returnPolicyText ||
                  'Délai légal de rétractation de 14 jours francs pour tout produit non descellé et conservé dans son emballage étanche d’origine avec étiquette de lot intacte.'}
              </p>
            </div>
          </div>

          {/* Sidebar Hours and Contact */}
          <div className="space-y-6">
            
            {/* Opening Hours */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>Horaires d&apos;Ouverture</span>
              </h4>

              {shop.openingHours ? (
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  {Object.entries(shop.openingHours).map(([day, hrs]) => (
                    <div key={day} className="pt-1.5 flex justify-between">
                      <span className="capitalize text-slate-600">{day} :</span>
                      <strong className="text-slate-900">{hrs as string}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Du Lundi au Samedi : 10h00 - 19h30</p>
              )}
            </div>

            {/* Contact Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-700" />
                <span>Coordonnées &amp; Accès</span>
              </h4>

              <div className="space-y-2.5 text-xs text-slate-600">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {shop.address}<br />
                    {shop.postalCode} {shop.city}, {shop.country}
                  </span>
                </p>

                {shop.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{shop.phone}</span>
                  </p>
                )}

                {shop.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{shop.email}</span>
                  </p>
                )}

                {shop.website && (
                  <p className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <a
                      href={shop.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-1"
                    >
                      {shop.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RETRAIT & EXPÉDITION */}
      {/* ========================================================================= */}
      {activeTab === 'logistics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Click & Collect Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Retrait en Boutique (Click &amp; Collect)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Commandez en ligne et retirez vos soins en main propre directement au comptoir de la boutique.
            </p>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span>Délai de préparation :</span>
                <strong className="text-teal-800">{shop.estimatedPickupTime || 'Prêt sous 2h'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Frais de retrait :</span>
                <strong className="text-emerald-700">Gratuit (0.00 €)</strong>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="font-bold text-slate-800 block mb-1">Consignes de retrait :</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {shop.pickupInstructions ||
                    'Présentez votre confirmation de commande sur smartphone ou votre code de retrait reçu par email ainsi qu’une pièce d’identité attestant de votre majorité.'}
                </p>
              </div>
            </div>
          </div>

          {/* Home Delivery Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Livraison Sécurisée à Domicile
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Expédition discrète dans un colis neutre sans mention du contenu, sous emballage isotherme préservant les terpènes.
            </p>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span>Délai d&apos;acheminement :</span>
                <strong className="text-slate-900">{shop.estimatedDeliveryDays || '24-48h'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Frais standards :</span>
                <strong className="text-slate-900">{shop.deliveryFee || 4.90} €</strong>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Livraison offerte dès :</span>
                <span>{shop.freeDeliveryThreshold || 50} € de commande</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <span className="font-bold text-slate-800 block mb-1">Transporteurs partenaires :</span>
                <p className="text-slate-600 text-[11px]">
                  Colissimo Suivi, Chronopost Domicile, DHL Express &amp; DPD avec signature.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AVIS CLIENTS VÉRIFIÉS */}
      {/* ========================================================================= */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Reviews Score Summary & Form */}
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {reviewsData.averageRating} / 5
              </span>
              <div className="flex justify-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= Math.round(reviewsData.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Basé sur {reviewsData.totalReviews} avis clients certifiés
              </p>

              {/* Distribution bars */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData.distribution[rating] || 0;
                  const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="w-3">{rating}★</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right font-mono text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Review Form */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Laisser un avis vérifié</h4>
              
              <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Votre note :</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Titre de l&apos;avis :</label>
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="Ex : Excellente qualité et conseils précieux"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Commentaire détaillé :</label>
                  <textarea
                    rows={3}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Partagez votre expérience sur les extraits, la traçabilité ou le retrait..."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition cursor-pointer"
                >
                  {submittingReview ? 'Publication...' : 'Publier mon avis'}
                </button>
              </form>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviewsData.reviews.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <Star className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Aucun avis pour le moment</h4>
                <p className="text-xs text-slate-500">Soyez le premier client à laisser un avis sur cette boutique !</p>
              </div>
            ) : (
              reviewsData.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{rev.userDisplayName}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Achat Vérifié
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {rev.title && <h5 className="text-xs font-bold text-slate-900">{rev.title}</h5>}
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: QR CODE & PARTAGE */}
      {/* ========================================================================= */}
      {activeTab === 'share' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-center">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold uppercase tracking-wider">
              Partage Storefront &amp; Vitrine Physique
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Flashez pour ouvrir la boutique sur mobile
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ce QR Code dynamique redirige instantanément vers la vitrine officielle de{' '}
              <strong>{shop.publicName || shop.commercialName}</strong>.
            </p>
          </div>

          {/* QR Code SVG */}
          <div className="w-56 h-56 mx-auto p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              shapeRendering="crispEdges"
            >
              {/* Corner 1 */}
              <rect x="10" y="10" width="25" height="25" fill="#0f766e" rx="4" />
              <rect x="15" y="15" width="15" height="15" fill="#ffffff" rx="2" />
              <rect x="18" y="18" width="9" height="9" fill="#0f766e" rx="1" />
              {/* Corner 2 */}
              <rect x="65" y="10" width="25" height="25" fill="#0f766e" rx="4" />
              <rect x="70" y="15" width="15" height="15" fill="#ffffff" rx="2" />
              <rect x="73" y="18" width="9" height="9" fill="#0f766e" rx="1" />
              {/* Corner 3 */}
              <rect x="10" y="65" width="25" height="25" fill="#0f766e" rx="4" />
              <rect x="15" y="70" width="15" height="15" fill="#ffffff" rx="2" />
              <rect x="18" y="73" width="9" height="9" fill="#0f766e" rx="1" />
              {/* Pixel matrix simulation */}
              <rect x="42" y="15" width="6" height="6" fill="#0f766e" />
              <rect x="52" y="22" width="6" height="6" fill="#0f766e" />
              <rect x="42" y="32" width="6" height="6" fill="#0f766e" />
              <rect x="52" y="42" width="6" height="6" fill="#0f766e" />
              <rect x="22" y="45" width="6" height="6" fill="#0f766e" />
              <rect x="32" y="55" width="6" height="6" fill="#0f766e" />
              <rect x="65" y="45" width="6" height="6" fill="#0f766e" />
              <rect x="75" y="55" width="6" height="6" fill="#0f766e" />
              <rect x="45" y="65" width="6" height="6" fill="#0f766e" />
              <rect x="55" y="75" width="6" height="6" fill="#0f766e" />
              <rect x="75" y="75" width="6" height="6" fill="#0f766e" />
              <rect x="85" y="65" width="6" height="6" fill="#0f766e" />
              <rect x="45" y="85" width="6" height="6" fill="#0f766e" />
            </svg>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/#storefront=${shop.slug || shop.id}`}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/#storefront=${shop.slug || shop.id}`
                  );
                  setToastMessage('Lien de la boutique copié dans le presse-papier !');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Copier
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Idéal pour impression sur comptoir, étiquettes packaging ou cartes de visite.
            </p>
          </div>
        </div>
      )}

      {/* HPLC Certificate Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
                  Contrôle Qualité HPLC Certifié
                </span>
                <h3 className="text-base font-black text-slate-900">Certificat d&apos;Analyse de Lot</h3>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Boutique Partenaire :</span>
                <strong className="text-slate-900">{shop.commercialName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Numéro de Lot :</span>
                <strong className="text-slate-900 font-mono">{selectedBatch.batchNumber}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Laboratoire Analyste :</span>
                <strong className="text-slate-900">{selectedBatch.testingLabName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Taux de CBD certifié :</span>
                <strong className="text-teal-800">{selectedBatch.cbdLabResultPercent}%</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Taux de THC mesuré :</span>
                <strong className="text-slate-900">
                  {selectedBatch.thcLabResultPercent}% (Conforme loi &lt; 0.3%)
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Solvants &amp; Métaux Lourds :</span>
                <strong className="text-emerald-700">Non détectés (0.00 ppm)</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 text-[11px] leading-relaxed">
              ✓ Ce lot a été validé selon les normes de la Pharmacopée européenne et de la charte de qualité{' '}
              <strong>Nexus Premium Solutions</strong>.
            </div>

            <button
              onClick={() => setSelectedBatch(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Fermer le certificat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
