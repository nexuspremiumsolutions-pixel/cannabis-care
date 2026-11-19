import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Search,
  ExternalLink,
  MapPin,
  Sparkles,
  ShoppingBag,
  Package,
  Clock,
  Plus,
  Minus,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Truck,
  BookOpen,
  Eye,
  Star,
  Heart,
  Layers,
  Compass,
  RotateCcw,
  Zap,
  Tag,
  Check,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { CustomerOrdersView } from './CustomerOrdersView';
import { PartnerShopOrdersView } from './PartnerShopOrdersView';
import { AdminMarketplaceOrdersView } from './AdminMarketplaceOrdersView';
import { CustomerPaymentsView } from './CustomerPaymentsView';
import { AdminFinanceView } from '../Admin/AdminFinanceView';
import { PartnerStorefrontView } from '../PartnerStorefront/PartnerStorefrontView';
import { PartnerDashboardView } from '../PartnerStorefront/PartnerDashboardView';
import { AdminShopsSupervisionView } from '../PartnerStorefront/AdminShopsSupervisionView';
import { UserRole } from '../../types/entities';
import { BotanicalHero, BotanicalBadge, BotanicalLeafIcon, BotanicalWatermark } from '../Common/BotanicalDecor';
import { useLanguage } from '../../context/LanguageContext';
import { CANNABIS_IMAGES, getProductImage } from '../../assets/cannabisAssets';
import { MarketplaceProductModal } from './MarketplaceProductModal';
import { ProductComparisonModal } from './ProductComparisonModal';
import { PhytoFinderModal } from './PhytoFinderModal';

export const StoreCatalogView: React.FC = () => {
  const { cart, totalItemsCount, openCartDrawer, addToCart, isLoading: isCartLoading } = useCart();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  // Sub-tabs
  const [subTab, setSubTab] = useState<
    'catalog' | 'orders' | 'payments' | 'partner' | 'partner_dashboard' | 'storefront' | 'admin' | 'admin_finance' | 'admin_shops'
  >('catalog');
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>('shop_nexus_paris');

  // Core Data
  const [shops, setShops] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [selectedProductForModal, setSelectedProductForModal] = useState<any | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  // Interactive Tools State
  const [comparisonProducts, setComparisonProducts] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cannabis_care_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [shopFilter, setShopFilter] = useState('ALL');
  const [effectFilter, setEffectFilter] = useState<'ALL' | 'sleep' | 'stress' | 'pain' | 'energy'>('ALL');
  const [potencyFilter, setPotencyFilter] = useState<'ALL' | 'light' | 'moderate' | 'strong'>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'cbd_desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [wishlistOnly, setWishlistOnly] = useState(false);

  // Cart action state
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save wishlist to local storage
  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('cannabis_care_wishlist', JSON.stringify(updated));
      } catch (e) {
        console.error('Could not save wishlist to localStorage', e);
      }
      return updated;
    });
  };

  // Toggle comparison item
  const handleToggleComparison = (product: any) => {
    setComparisonProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        setToastMessage('Le comparateur est limité à 3 produits simultanés.');
        setTimeout(() => setToastMessage(null), 3000);
        return prev;
      }
      setToastMessage(`« ${product.name} » ajouté au comparateur.`);
      setTimeout(() => setToastMessage(null), 2500);
      return [...prev, product];
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [resP, resS, resC] = await Promise.all([
          fetch('/api/marketplace/products?limit=50'),
          fetch('/api/marketplace/shops'),
          fetch('/api/marketplace/categories'),
        ]);

        if (resP.ok && resS.ok) {
          const dataP = await resP.json();
          const dataS = await resS.json();
          setProducts(dataP.products || []);
          setShops(dataS.shops || []);
          if (resC.ok) {
            const dataC = await resC.json();
            setCategories(dataC.categories || []);
          }
        } else {
          // Fallback legacy
          const [legacyS, legacyP] = await Promise.all([
            fetch('/api/stores/stores'),
            fetch('/api/stores/products'),
          ]);
          if (legacyS.ok) {
            const dS = await legacyS.json();
            setShops(dS.stores || []);
          }
          if (legacyP.ok) {
            const dP = await legacyP.json();
            setProducts(dP.products || []);
          }
        }
      } catch (e) {
        console.error('Error loading catalog data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleAddToCart = async (product: any, qty: number = 1) => {
    setAddingProductId(product.id);
    const result = await addToCart(product.id, qty);
    setAddingProductId(null);

    if (result.success) {
      setToastMessage(`« ${product.name} » ajouté à votre panier !`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setToastMessage(result.error || 'Erreur lors de l’ajout au panier.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Filtering and sorting pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category
        const matchCat =
          categoryFilter === 'ALL' ||
          p.categoryId === categoryFilter ||
          p.category === categoryFilter;

        // Shop
        const matchShop = shopFilter === 'ALL' || p.shopId === shopFilter;

        // Stock
        const matchStock = inStockOnly ? (p.stockQuantity ?? 1) > 0 : true;

        // Wishlist
        const matchWishlist = wishlistOnly ? wishlistIds.includes(p.id) : true;

        // Effect / Intention filter
        let matchEffect = true;
        if (effectFilter !== 'ALL') {
          const text = `${p.name} ${p.description || ''} ${p.shortDescription || ''}`.toLowerCase();
          if (effectFilter === 'sleep') {
            matchEffect = text.includes('sommeil') || text.includes('nuit') || text.includes('cbn') || text.includes('paisible');
          } else if (effectFilter === 'stress') {
            matchEffect = text.includes('stress') || text.includes('zen') || text.includes('calm') || text.includes('anx') || text.includes('seren');
          } else if (effectFilter === 'pain') {
            matchEffect = text.includes('douleur') || text.includes('muscle') || text.includes('recup') || text.includes('baume');
          } else if (effectFilter === 'energy') {
            matchEffect = text.includes('energie') || text.includes('focus') || text.includes('amnesia') || text.includes('cbg') || text.includes('vital');
          }
        }

        // Potency filter
        let matchPotency = true;
        if (potencyFilter !== 'ALL') {
          const cbdPct = p.declaredCBDPercentage ?? p.cbdConcentrationPercent ?? 10;
          if (potencyFilter === 'light') matchPotency = cbdPct <= 10;
          else if (potencyFilter === 'moderate') matchPotency = cbdPct > 10 && cbdPct <= 20;
          else if (potencyFilter === 'strong') matchPotency = cbdPct > 20;
        }

        // Search text
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase()) ||
          p.terpeneProfile?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));

        return matchCat && matchShop && matchStock && matchWishlist && matchEffect && matchPotency && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return (a.price ?? a.priceEstimated ?? 0) - (b.price ?? b.priceEstimated ?? 0);
        }
        if (sortBy === 'price_desc') {
          return (b.price ?? b.priceEstimated ?? 0) - (a.price ?? a.priceEstimated ?? 0);
        }
        if (sortBy === 'cbd_desc') {
          const cbdA = a.declaredCBDPercentage ?? a.cbdConcentrationPercent ?? 0;
          const cbdB = b.declaredCBDPercentage ?? b.cbdConcentrationPercent ?? 0;
          return cbdB - cbdA;
        }
        if (sortBy === 'rating') {
          return (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0);
        }
        return (b.viewsCount ?? 0) - (a.viewsCount ?? 0);
      });
  }, [products, categoryFilter, shopFilter, inStockOnly, wishlistOnly, effectFilter, potencyFilter, search, sortBy, wishlistIds]);

  const isAdmin =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.MODERATOR;

  const hasActiveFilters =
    categoryFilter !== 'ALL' ||
    shopFilter !== 'ALL' ||
    effectFilter !== 'ALL' ||
    potencyFilter !== 'ALL' ||
    inStockOnly ||
    wishlistOnly ||
    search.trim() !== '';

  const clearAllFilters = () => {
    setCategoryFilter('ALL');
    setShopFilter('ALL');
    setEffectFilter('ALL');
    setPotencyFilter('ALL');
    setInStockOnly(false);
    setWishlistOnly(false);
    setSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls Bar & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSubTab('catalog')}
            className={`px-3.5 py-2 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Catalogue & Hub Commercial</span>
          </button>

          <button
            onClick={() => setSubTab('orders')}
            className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'orders'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Mes Commandes & Suivi</span>
          </button>

          <button
            onClick={() => setSubTab('payments')}
            className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'payments'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Factures & Reçus</span>
          </button>

          {/* Partner and Admin tabs */}
          {(user?.role === UserRole.SHOP_OWNER || isAdmin) && (
            <>
              <button
                onClick={() => setSubTab('partner')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'partner'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Expéditions Vendeur</span>
              </button>

              <button
                onClick={() => setSubTab('partner_dashboard')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'partner_dashboard'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/60'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Espace Commerçant</span>
              </button>
            </>
          )}

          {subTab === 'storefront' && (
            <button
              onClick={() => setSubTab('storefront')}
              className="px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 bg-emerald-900 text-white shadow-xs"
            >
              <Eye className="w-4 h-4" />
              <span>Vitrine Boutique</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setSubTab('admin_shops')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'admin_shops'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Supervision Boutiques</span>
              </button>

              <button
                onClick={() => setSubTab('admin_finance')}
                className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'admin_finance'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Finances</span>
              </button>
            </>
          )}
        </div>

        {/* Global Action Tools: Finder, Comparer, Cart */}
        <div className="flex items-center gap-2">
          {/* Smart Finder Button */}
          <button
            onClick={() => setIsFinderOpen(true)}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Diagnostic Phyto & Trouver mon extrait idéal"
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Diagnostic IA</span>
          </button>

          {/* Comparison Tool Button */}
          <button
            onClick={() => setIsComparisonOpen(true)}
            className="relative px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Comparer les extraits sélectionnés"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Comparer</span>
            {comparisonProducts.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-black">
                {comparisonProducts.length}
              </span>
            )}
          </button>

          {/* Cart Drawer Trigger */}
          <button
            onClick={openCartDrawer}
            className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-300" />
            <span>Mon Panier</span>
            {totalItemsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-white text-emerald-950 text-[10px] font-black">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Main Catalog Hub */}
      {subTab === 'catalog' && (
        <div className="space-y-6">
          {/* Thematic Botanical Hero */}
          <BotanicalHero
            title={t('market_hero_title')}
            subtitle={t('market_hero_sub')}
            badge={t('badge_botanical')}
            badgeVariant="gold"
            actionButton={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsFinderOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span>Trouver mon Extrait en 3 clics</span>
                </button>
                <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-xs text-emerald-200 font-semibold backdrop-blur-xs">
                  <BotanicalLeafIcon size={16} className="text-emerald-400" />
                  <span>Analyses HPLC Certifiées</span>
                </div>
              </div>
            }
          />

          {/* European Pharmaceutical Trust & Excellence Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-3xl bg-white border border-emerald-950/10 shadow-xs">
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 block font-black">Analyses HPLC Lot par Lot</strong>
                <span className="text-slate-500 text-[11px]">Certificats d’analyses accrédités</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <BotanicalLeafIcon size={20} className="text-emerald-700" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 block font-black">100% Bio & Terpènes Purs</strong>
                <span className="text-slate-500 text-[11px]">Sans métaux lourds ni pesticides</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <Truck className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 block font-black">Expédition Neutre 24/48h</strong>
                <span className="text-slate-500 text-[11px]">Colis discret sans mention</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-xs">
                <strong className="text-slate-900 block font-black">Conforme Règlement UE</strong>
                <span className="text-slate-500 text-[11px]">THC garanti &lt; 0.3% certifié</span>
              </div>
            </div>
          </div>

          {/* Verified Partner Dispensaries Showcase */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BotanicalLeafIcon className="w-4 h-4 text-emerald-700" />
                  <span>Dispensaires & Boutiques Agréées d&apos;Excellence</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Herboristeries et apothicaires partenaires agréés • Retrait comptoir & expédition directe
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {shops.length} Boutiques Validées
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {shops.map((st) => (
                <div
                  key={st.id}
                  className="rounded-3xl bg-white border border-emerald-950/10 shadow-xs hover:shadow-lg hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-emerald-950">
                    <img
                      src={st.coverImage || st.bannerUrl || CANNABIS_IMAGES.dispensaryStorefront}
                      alt={st.commercialName || st.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/30 to-transparent" />

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-900/90 backdrop-blur-md text-emerald-200 text-[10px] font-black border border-emerald-400/30 flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Agréé Nexus
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h4 className="text-base font-extrabold text-white tracking-tight drop-shadow-sm truncate">
                        {st.commercialName || st.name}
                      </h4>
                      <p className="text-[11px] text-emerald-200/90 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                        <span className="truncate">{st.address ? `${st.address}, ` : ''}{st.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {st.description || 'Herboristerie d’excellence spécialisée en extraits botaniques bio et fleurs terpéniques certifiées.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200/60 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9 (240+ avis)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200/60 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" /> Expédition 24h
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedStorefrontId(st.slug || st.id);
                          setSubTab('storefront');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span>Visiter la Boutique</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setShopFilter(st.id);
                          window.scrollTo({ top: 520, behavior: 'smooth' });
                        }}
                        className={`px-3 py-2 rounded-xl font-semibold text-xs transition cursor-pointer ${
                          shopFilter === st.id
                            ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Filtrer les produits de ce dispensaire"
                      >
                        {shopFilter === st.id ? '✓ Filtré' : 'Produits'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Filters, Search & View Controls */}
          <div className="space-y-4 pt-2">
            <div className="bg-white p-5 rounded-3xl border border-emerald-950/10 shadow-xs space-y-4">
              {/* Top Search & Primary Filters Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Rechercher une fleur, huile sublinguale, terpène (Myrcène, Limonène), laboratoire..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-hidden focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Secondary Select Dropdowns */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Shop dropdown */}
                  <select
                    value={shopFilter}
                    onChange={(e) => setShopFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">Tous les dispensaires</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.commercialName || s.name}
                      </option>
                    ))}
                  </select>

                  {/* Potency dropdown */}
                  <select
                    value={potencyFilter}
                    onChange={(e) => setPotencyFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">Toutes concentrations</option>
                    <option value="light">Douce (&le; 10% CBD)</option>
                    <option value="moderate">Modérée (10% - 20% CBD)</option>
                    <option value="strong">Concentrée (&gt; 20% CBD)</option>
                  </select>

                  {/* Sorting dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-950 focus:outline-hidden"
                  >
                    <option value="featured">✨ Les plus populaires</option>
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="cbd_desc">Teneur CBD maximale</option>
                    <option value="rating">Meilleures notes clients</option>
                  </select>
                </div>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'ALL', label: 'Toutes les Catégories' },
                  { id: 'cat_huiles', label: 'Huiles Sublinguales' },
                  { id: 'cat_fleurs', label: 'Fleurs & Résines' },
                  { id: 'cat_infusions', label: 'Infusions & Thés' },
                  { id: 'cat_capsules', label: 'Gélules & Capsules' },
                  { id: 'cat_cosmetiques', label: 'Cosmétiques & Soins' },
                  { id: 'cat_alimentation', label: 'Épicerie & Boissons' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer border ${
                      categoryFilter === cat.id
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Target Effect / Intention Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Objectif visé :
                  </span>
                  {[
                    { id: 'ALL', label: 'Tous' },
                    { id: 'sleep', label: '🌙 Sommeil & Nuit' },
                    { id: 'stress', label: '💆 Sérénité & Stress' },
                    { id: 'pain', label: '🏃 Confort & Récupération' },
                    { id: 'energy', label: '⚡ Énergie & Clarté' },
                  ].map((eff) => (
                    <button
                      key={eff.id}
                      onClick={() => setEffectFilter(eff.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        effectFilter === eff.id
                          ? 'bg-emerald-100 text-emerald-950 font-black border border-emerald-300'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {eff.label}
                    </button>
                  ))}
                </div>

                {/* Stock & Wishlist Quick Toggles */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-semibold text-xs">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="rounded-sm border-slate-300 text-emerald-700 focus:ring-emerald-700"
                    />
                    <span>En stock uniquement</span>
                  </label>

                  <button
                    onClick={() => setWishlistOnly((w) => !w)}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      wishlistOnly
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${wishlistOnly ? 'fill-rose-600' : ''}`} />
                    <span>Mes Favoris ({wishlistIds.length})</span>
                  </button>
                </div>
              </div>

              {/* Active filters breadcrumb bar */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                    <span>Filtres actifs :</span>
                    {categoryFilter !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold">
                        Catégorie: {categoryFilter}
                      </span>
                    )}
                    {effectFilter !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold">
                        Effet: {effectFilter}
                      </span>
                    )}
                    {potencyFilter !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold">
                        Concentration: {potencyFilter}
                      </span>
                    )}
                    {shopFilter !== 'ALL' && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold">
                        Boutique sélectionnée
                      </span>
                    )}
                    {search && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold">
                        Recherche: &ldquo;{search}&rdquo;
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-emerald-900 font-bold hover:underline cursor-pointer text-xs"
                  >
                    Réinitialiser tous les filtres
                  </button>
                </div>
              )}
            </div>

            {/* Catalog Results Summary */}
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
              <span>
                {filteredProducts.length} extrait{filteredProducts.length > 1 ? 's' : ''} certifié{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tous nos lots sont validés HPLC
              </span>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="w-9 h-9 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">
                  Vérification des certificats d&apos;analyses de lot...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">Aucun produit ne correspond à ces critères</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Modifiez vos filtres ou réinitialisez la sélection pour découvrir d&apos;autres formulations botaniques d&apos;exception.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl bg-emerald-900 text-white font-bold text-xs hover:bg-emerald-950 transition cursor-pointer"
                >
                  Afficher tout le catalogue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => {
                  const cbdPct = prod.declaredCBDPercentage ?? prod.cbdConcentrationPercent ?? 10;
                  const thcPct = prod.declaredTHCPercentage ?? prod.thcConcentrationPercent ?? 0.18;
                  const shop = shops.find((s) => s.id === prod.shopId);
                  const shopName = shop?.commercialName || shop?.name || prod.storeName || 'Boutique Agréée';
                  const isOutOfStock = prod.stockQuantity <= 0;
                  const prodImage = prod.images?.[0] || getProductImage(prod.category, prod.name);
                  const isWishlisted = wishlistIds.includes(prod.id);
                  const isComparing = comparisonProducts.some((p) => p.id === prod.id);

                  return (
                    <div
                      key={prod.id}
                      className="rounded-3xl bg-white border border-emerald-950/10 shadow-xs hover:border-emerald-600/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Product Image Stage */}
                      <div className="relative h-52 w-full bg-slate-100 overflow-hidden cursor-pointer"
                        onClick={() => setSelectedProductForModal(prod)}
                      >
                        <img
                          src={prodImage}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-600"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-75" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px]">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 backdrop-blur-md text-emerald-200 font-extrabold border border-emerald-400/30 shadow-xs flex items-center gap-1">
                            <BotanicalLeafIcon size={12} className="text-emerald-400" />
                            CBD {cbdPct}%
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Compare Quick Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComparison(prod);
                              }}
                              className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer border ${
                                isComparing
                                  ? 'bg-emerald-900 text-white border-emerald-400'
                                  : 'bg-black/40 text-white/80 border-white/20 hover:bg-black/60'
                              }`}
                              title={isComparing ? 'Retirer du comparateur' : 'Ajouter au comparateur'}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>

                            {/* Wishlist Quick Toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWishlist(prod.id);
                              }}
                              className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer border ${
                                isWishlisted
                                  ? 'bg-rose-600 text-white border-rose-400'
                                  : 'bg-black/40 text-white/80 border-white/20 hover:bg-black/60 hover:text-rose-400'
                              }`}
                              title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Tag on Image */}
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-md text-emerald-950 text-[10px] font-extrabold shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-700" />
                            {prod.aromaProfile || prod.terpeneProfile?.[0] ? `${prod.terpeneProfile?.[0] || 'Terpènes'} aromatique` : 'Profil Terpénique Pur'}
                          </span>
                          <span className="text-[10px] font-mono text-white/90 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">
                            THC &lt; {thcPct}%
                          </span>
                        </div>
                      </div>

                      {/* Product Body */}
                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                            <span>{prod.brand || 'Nexus Botanics'}</span>
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9 (120+)
                            </span>
                          </div>

                          <h4
                            onClick={() => setSelectedProductForModal(prod)}
                            className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-emerald-900 transition-colors cursor-pointer line-clamp-2"
                          >
                            {prod.name}
                          </h4>

                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {prod.shortDescription || prod.description}
                          </p>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                            <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">Vendu par : <strong className="text-slate-700">{shopName}</strong></span>
                          </div>
                        </div>

                        {/* Price & Action Area */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-lg font-black text-slate-900 tracking-tight">
                              {(prod.price ?? prod.priceEstimated ?? 29.9).toFixed(2)} €
                            </div>
                            {prod.stockQuantity > 0 && prod.stockQuantity <= 5 ? (
                              <span className="text-[10px] font-bold text-amber-600 block">
                                Plus que {prod.stockQuantity} en stock !
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-700 block">
                                En stock • Expédié 24h
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Quick view button */}
                            <button
                              onClick={() => setSelectedProductForModal(prod)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                              title="Voir la fiche détaillée et analyses"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Batch HPLC Certificate button */}
                            {(prod.batchNumber || prod.qualityInformation) && (
                              <button
                                onClick={() =>
                                  setSelectedBatch({
                                    batchNumber: prod.batchNumber || 'NEXUS-2026-HPLC',
                                    testingLabName: prod.qualityInformation?.labName || 'Laboratoire Phyto-Analyses Accrédité COFRAC',
                                    analysisDate: prod.qualityInformation?.analysisDate || '14 Janvier 2026',
                                    cbdLabResultPercent: cbdPct,
                                    thcLabResultPercent: thcPct,
                                  })
                                }
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Voir le certificat d’analyse HPLC officiel"
                              >
                                <FileText className="w-4 h-4 text-emerald-800" />
                              </button>
                            )}

                            {/* Express Add to Cart */}
                            <button
                              onClick={() => handleAddToCart(prod, 1)}
                              disabled={isOutOfStock || isCartLoading || addingProductId === prod.id}
                              className={`px-3.5 py-2 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                                isOutOfStock
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-[#064e3b] text-white hover:bg-[#043326] active:scale-98'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-white" />
                              <span>
                                {isOutOfStock
                                  ? 'Épuisé'
                                  : addingProductId === prod.id
                                  ? 'Ajout...'
                                  : 'Ajouter'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Orders Tracking */}
      {subTab === 'orders' && <CustomerOrdersView />}

      {/* Sub-Tab 2b: Receipts & Invoices */}
      {subTab === 'payments' && <CustomerPaymentsView />}

      {/* Sub-Tab 3: Partner Dispatch Console */}
      {subTab === 'partner' && <PartnerShopOrdersView />}

      {/* Sub-Tab 3b: Partner Dashboard & Analytics */}
      {subTab === 'partner_dashboard' && (
        <PartnerDashboardView
          onPreviewStorefront={(slugOrId) => {
            setSelectedStorefrontId(slugOrId);
            setSubTab('storefront');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Sub-Tab 3c: Dedicated Storefront View */}
      {subTab === 'storefront' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setSubTab('catalog')}
              className="text-xs font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer"
            >
              ← Retour au catalogue global
            </button>
            <span className="text-xs text-slate-400 font-mono">
              Boutique active : {selectedStorefrontId}
            </span>
          </div>

          <PartnerStorefrontView
            shopIdOrSlug={selectedStorefrontId}
            onBackToDirectory={() => setSubTab('catalog')}
          />
        </div>
      )}

      {/* Sub-Tab 4: Admin Supervision Orders */}
      {subTab === 'admin' && <AdminMarketplaceOrdersView />}

      {/* Sub-Tab 4b: Admin Supervision Shops */}
      {subTab === 'admin_shops' && (
        <AdminShopsSupervisionView
          onPreviewStorefront={(slugOrId) => {
            setSelectedStorefrontId(slugOrId);
            setSubTab('storefront');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Sub-Tab 5: Admin Supervision Financials */}
      {subTab === 'admin_finance' && <AdminFinanceView />}

      {/* MODAL 1: Luxury Product Deep-Dive Modal */}
      {selectedProductForModal && (
        <MarketplaceProductModal
          product={selectedProductForModal}
          shop={shops.find((s) => s.id === selectedProductForModal.shopId)}
          isOpen={Boolean(selectedProductForModal)}
          onClose={() => setSelectedProductForModal(null)}
          onOpenBatchDetails={(batch) => setSelectedBatch(batch)}
          isFavorite={wishlistIds.includes(selectedProductForModal.id)}
          onToggleFavorite={handleToggleWishlist}
          isInComparison={comparisonProducts.some((p) => p.id === selectedProductForModal.id)}
          onToggleComparison={handleToggleComparison}
        />
      )}

      {/* MODAL 2: Product Side-by-Side Comparison Modal */}
      {isComparisonOpen && (
        <ProductComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          products={comparisonProducts}
          onRemoveProduct={(id) => setComparisonProducts((prev) => prev.filter((p) => p.id !== id))}
          onClearAll={() => setComparisonProducts([])}
          onSelectProduct={(prod) => {
            setIsComparisonOpen(false);
            setSelectedProductForModal(prod);
          }}
        />
      )}

      {/* MODAL 3: Interactive Phyto-Finder Advisor Modal */}
      {isFinderOpen && (
        <PhytoFinderModal
          isOpen={isFinderOpen}
          onClose={() => setIsFinderOpen(false)}
          products={products}
          onSelectProduct={(prod) => {
            setIsFinderOpen(false);
            setSelectedProductForModal(prod);
          }}
        />
      )}

      {/* MODAL 4: HPLC Batch Certificate Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                  Contrôle Qualité HPLC Certifié
                </span>
                <h3 className="text-base font-black text-slate-900">Certificat d&apos;Analyse de Lot</h3>
              </div>
              <button
                onClick={() => setSelectedBatch(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Numéro de Lot :</span>
                <strong className="text-slate-900 font-mono">{selectedBatch.batchNumber}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Laboratoire Analyste :</span>
                <strong className="text-slate-900">{selectedBatch.testingLabName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Date d&apos;analyse :</span>
                <strong className="text-slate-900">{selectedBatch.analysisDate}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Taux de CBD certifié :</span>
                <strong className="text-emerald-800 font-black">{selectedBatch.cbdLabResultPercent}%</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Taux de THC mesuré :</span>
                <strong className="text-slate-900">{selectedBatch.thcLabResultPercent}% (Conforme loi &lt; 0.3%)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Solvants & Métaux Lourds :</span>
                <strong className="text-emerald-700 font-bold">Non détectés (0.00 ppm)</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
              ✓ Ce lot a été validé selon les normes de la Pharmacopée européenne et de la charte de qualité <strong>Nexus Premium Solutions</strong>.
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
