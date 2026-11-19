import React, { useState, useEffect } from 'react';
import {
  PartnerShop,
  StorefrontAnalytics,
  CBDMarketplaceProduct,
  ShopCustomCategory,
  ShopTeamMember,
  StockAdjustmentRecord,
} from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Settings,
  Palette,
  Tag,
  Package,
  Shield,
  QrCode,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

interface PartnerDashboardViewProps {
  onPreviewStorefront?: (shopIdOrSlug: string) => void;
}

export const PartnerDashboardView: React.FC<PartnerDashboardViewProps> = ({
  onPreviewStorefront,
}) => {
  const { user } = useAuth();

  // Shops managed
  const [allShops, setAllShops] = useState<PartnerShop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [currentShop, setCurrentShop] = useState<PartnerShop | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'profile' | 'appearance' | 'categories' | 'inventory' | 'team' | 'qr'
  >('analytics');

  // Analytics data
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | '7d' | '30d' | '3m' | '12m' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<StorefrontAnalytics | null>(null);

  // Inventory data
  const [inventoryProducts, setInventoryProducts] = useState<CBDMarketplaceProduct[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentRecord[]>([]);
  const [adjustModalProduct, setAdjustModalProduct] = useState<CBDMarketplaceProduct | null>(null);
  const [adjustNewQuantity, setAdjustNewQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('RESTOCK');
  const [adjustComment, setAdjustComment] = useState<string>('');

  // Custom categories
  const [customCategories, setCustomCategories] = useState<ShopCustomCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Team
  const [teamMembers, setTeamMembers] = useState<ShopTeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'SHOP_MANAGER' | 'SHOP_STAFF'>('SHOP_STAFF');

  // Editable Profile Form State
  const [profileForm, setProfileForm] = useState<any>({});
  const [appearanceForm, setAppearanceForm] = useState<any>({});

  // Loading & Toast
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load user's shops
  useEffect(() => {
    async function fetchShops() {
      try {
        setLoading(true);
        const res = await fetch('/api/marketplace/shops');
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setAllShops(data.shops);
          const initial = data.shops[0];
          setSelectedShopId(initial.id);
          setCurrentShop(initial);
          setProfileForm(initial);
          setAppearanceForm(initial);
        }
      } catch (err) {
        console.error('Failed to load partner shops:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  // When selectedShopId changes, fetch shop-specific data
  useEffect(() => {
    if (!selectedShopId) return;

    const matched = allShops.find((s) => s.id === selectedShopId);
    if (matched) {
      setCurrentShop(matched);
      setProfileForm(matched);
      setAppearanceForm(matched);
    }

    loadShopData(selectedShopId, analyticsPeriod);
  }, [selectedShopId, analyticsPeriod]);

  async function loadShopData(shopId: string, period: string) {
    try {
      const headers = user ? { Authorization: `Bearer ${user.id}` } : {};

      const [resAnalytics, resInv, resCats, resTeam] = await Promise.all([
        fetch(`/api/marketplace/partner/store/analytics?shopId=${shopId}&period=${period}`, { headers }),
        fetch(`/api/marketplace/partner/store/inventory?shopId=${shopId}`, { headers }),
        fetch(`/api/marketplace/partner/store/categories?shopId=${shopId}`, { headers }),
        fetch(`/api/marketplace/partner/store/team?shopId=${shopId}`, { headers }),
      ]);

      const dataAnalytics = await resAnalytics.json();
      const dataInv = await resInv.json();
      const dataCats = await resCats.json();
      const dataTeam = await resTeam.json();

      if (dataAnalytics.success) setAnalytics(dataAnalytics.analytics);
      if (dataInv.success) {
        setInventoryProducts(dataInv.products || []);
        setStockAdjustments(dataInv.recentAdjustments || []);
      }
      if (dataCats.success) setCustomCategories(dataCats.categories || []);
      if (dataTeam.success) setTeamMembers(dataTeam.members || []);
    } catch (err) {
      console.error('Failed to load shop details:', err);
    }
  }

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentShop) return;
    try {
      setSaving(true);
      const res = await fetch('/api/marketplace/partner/store/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          shopId: currentShop.id,
          ...profileForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShop(data.shop);
        setToastMessage('✓ Profil de la boutique enregistré avec succès.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(`Erreur: ${data.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      setToastMessage('Échec de l’enregistrement du profil.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Save appearance changes
  const handleSaveAppearance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentShop) return;
    try {
      setSaving(true);
      const res = await fetch('/api/marketplace/partner/store/appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          shopId: currentShop.id,
          ...appearanceForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentShop(data.shop);
        setToastMessage('✓ Thème & couleurs mis à jour.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(`Erreur: ${data.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      setToastMessage('Échec de la mise à jour de l’apparence.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Add custom category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentShop || !newCatName.trim()) return;
    try {
      const res = await fetch('/api/marketplace/partner/store/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          shopId: currentShop.id,
          name: newCatName.trim(),
          description: newCatDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomCategories([...customCategories, data.category]);
        setNewCatName('');
        setNewCatDesc('');
        setToastMessage('✓ Nouveau rayon créé avec succès.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete custom category
  const handleDeleteCategory = async (id: string) => {
    if (!user || !confirm('Confirmer la suppression de cette catégorie personnalisée ?')) return;
    try {
      const res = await fetch(`/api/marketplace/partner/store/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomCategories(customCategories.filter((c) => c.id !== id));
        setToastMessage('Catégorie supprimée.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stock adjustment submission
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentShop || !adjustModalProduct) return;
    try {
      const res = await fetch('/api/marketplace/partner/store/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          shopId: currentShop.id,
          productId: adjustModalProduct.id,
          newQuantity: adjustNewQuantity,
          reason: adjustReason,
          comment: adjustComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // update in list
        setInventoryProducts(
          inventoryProducts.map((p) => (p.id === data.product.id ? data.product : p))
        );
        setStockAdjustments([data.record, ...stockAdjustments]);
        setAdjustModalProduct(null);
        setToastMessage(`✓ Stock ajusté à ${adjustNewQuantity} unités pour "${data.product.name}".`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(`Erreur: ${data.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invite team member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentShop || !newMemberEmail.trim()) return;
    try {
      const res = await fetch('/api/marketplace/partner/store/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          shopId: currentShop.id,
          email: newMemberEmail.trim(),
          displayName: newMemberName.trim() || newMemberEmail.split('@')[0],
          role: newMemberRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTeamMembers([...teamMembers, data.member]);
        setNewMemberEmail('');
        setNewMemberName('');
        setToastMessage('✓ Collaborateur invité avec succès.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setToastMessage(`Erreur: ${data.error}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove team member
  const handleRemoveMember = async (memberId: string) => {
    if (!user || !confirm('Retirer ce collaborateur de la boutique ?')) return;
    try {
      const res = await fetch(`/api/marketplace/partner/store/team/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (data.success) {
        setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
        setToastMessage('Collaborateur retiré.');
        setTimeout(() => setToastMessage(null), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Chargement de votre console commerçant...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Shop Selector and Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold">
            <Store className="w-3.5 h-3.5" />
            <span>Module 14 • Espace Mini-Shop &amp; Storefront</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Console de Pilotage Partenaire
          </h2>
          <p className="text-xs text-slate-500">
            Gérez votre vitrine publique, vos stocks traçables, vos rayons personnalisés et analysez vos ventes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Shop Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
            <Store className="w-4 h-4 text-teal-700" />
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              {allShops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.commercialName} ({s.city}, {s.country})
                </option>
              ))}
            </select>
          </div>

          {/* Preview Public Storefront Button */}
          {currentShop && (
            <button
              onClick={() => {
                if (onPreviewStorefront) {
                  onPreviewStorefront(currentShop.slug || currentShop.id);
                } else {
                  window.location.hash = `storefront=${currentShop.slug || currentShop.id}`;
                }
              }}
              className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Voir ma vitrine en direct</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex gap-1 overflow-x-auto text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Tableau de Bord &amp; KPIs</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Profil &amp; Horaires</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Thème &amp; Identité Visuelle</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Rayons Personnalisés ({customCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Gestion des Stocks ({inventoryProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'team'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Équipe &amp; Droits ({teamMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Outils Marketing &amp; QR</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ANALYTICS & KPIS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          
          {/* Period Selector */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700">Période d&apos;analyse :</span>
            <div className="flex gap-1 text-xs font-bold">
              {(['today', '7d', '30d', '3m', '12m', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setAnalyticsPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    analyticsPeriod === p
                      ? 'bg-teal-800 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p === 'today'
                    ? "Aujourd'hui"
                    : p === '7d'
                    ? '7 jours'
                    : p === '30d'
                    ? '30 jours'
                    : p === '3m'
                    ? '3 mois'
                    : p === '12m'
                    ? '12 mois'
                    : 'Tout'}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chiffre d'Affaires Brut */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Ventes Brutes</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analytics.grossRevenue.toFixed(2)} €
              </div>
              <p className="text-[11px] text-slate-400">
                Net commerçant : <strong>{analytics.netPayout.toFixed(2)} €</strong>
              </p>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Commandes</span>
                <ShoppingBag className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{analytics.ordersCount}</div>
              <p className="text-[11px] text-slate-400">
                Panier moyen : <strong>{analytics.averageOrderValue.toFixed(2)} €</strong>
              </p>
            </div>

            {/* Visitors & Views */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Visiteurs Uniques</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{analytics.uniqueVisitors}</div>
              <p className="text-[11px] text-slate-400">
                Taux de conversion : <strong>{analytics.conversionRate}%</strong>
              </p>
            </div>

            {/* Stock Alerts */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Alertes Stock</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {analytics.lowStockAlertsCount + analytics.outOfStockCount}
              </div>
              <p className="text-[11px] text-amber-700 font-medium">
                {analytics.lowStockAlertsCount} stock faible • {analytics.outOfStockCount} rupture
              </p>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Produits les plus vendus de la boutique</span>
            </h3>

            {analytics.topSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400">Aucune vente enregistrée sur cette période.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {analytics.topSellingProducts.map((p, idx) => (
                  <div key={p.productId} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="text-slate-900 font-bold block">{p.name}</strong>
                        <span className="text-[11px] text-slate-500">{p.unitsSold} unités vendues</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900 font-black">{p.revenue.toFixed(2)} €</strong>
                      <div className="text-[10px] text-slate-400">CA généré</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PROFILE & HORAIRES */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && currentShop && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Coordonnées Légales &amp; Commerciales</h3>
            <p className="text-xs text-slate-500">Ces informations figurent sur votre vitrine et vos factures.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom Commercial :</label>
              <input
                type="text"
                value={profileForm.commercialName || ''}
                onChange={(e) => setProfileForm({ ...profileForm, commercialName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nom Public Affiché :</label>
              <input
                type="text"
                value={profileForm.publicName || ''}
                onChange={(e) => setProfileForm({ ...profileForm, publicName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Raison Sociale / Entité Juridique :</label>
              <input
                type="text"
                value={profileForm.legalName || ''}
                onChange={(e) => setProfileForm({ ...profileForm, legalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Téléphone de Contact :</label>
              <input
                type="text"
                value={profileForm.phone || ''}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Description Courte (Slogan / Meta) :</label>
              <input
                type="text"
                value={profileForm.shortDescription || ''}
                onChange={(e) => setProfileForm({ ...profileForm, shortDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Description Détaillée :</label>
              <textarea
                rows={4}
                value={profileForm.description || ''}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adresse :</label>
              <input
                type="text"
                value={profileForm.address || ''}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code Postal :</label>
                <input
                  type="text"
                  value={profileForm.postalCode || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville :</label>
                <input
                  type="text"
                  value={profileForm.city || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Fulfillment Settings */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Modalités de Livraison &amp; Retrait</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={profileForm.pickupAvailable ?? true}
                    onChange={(e) => setProfileForm({ ...profileForm, pickupAvailable: e.target.checked })}
                  />
                  <span>Activer le Click &amp; Collect</span>
                </label>
                <div>
                  <label className="block text-slate-600 mb-1">Délai estimé de préparation :</label>
                  <input
                    type="text"
                    value={profileForm.estimatedPickupTime || 'Prêt sous 2h'}
                    onChange={(e) => setProfileForm({ ...profileForm, estimatedPickupTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-2 font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={profileForm.deliveryAvailable ?? true}
                    onChange={(e) => setProfileForm({ ...profileForm, deliveryAvailable: e.target.checked })}
                  />
                  <span>Activer la Livraison Domicile</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 mb-1">Frais standard (€) :</label>
                    <input
                      type="number"
                      step="0.1"
                      value={profileForm.deliveryFee ?? 4.90}
                      onChange={(e) => setProfileForm({ ...profileForm, deliveryFee: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Offert dès (€) :</label>
                    <input
                      type="number"
                      value={profileForm.freeDeliveryThreshold ?? 50}
                      onChange={(e) => setProfileForm({ ...profileForm, freeDeliveryThreshold: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 3. APPEARANCE & THEME STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && currentShop && (
        <form onSubmit={handleSaveAppearance} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Studio d&apos;Identité Visuelle</h3>
            <p className="text-xs text-slate-500">
              Personnalisez le template de votre boutique, vos couleurs de marque et vos visuels.
            </p>
          </div>

          {/* Template Choices */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">Choisir le Template :</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: 'classic',
                  name: 'Classic Harmony',
                  desc: 'Équilibré, vert sauge, badges rassurants, hero chaleureux.',
                  color: '#0f766e',
                },
                {
                  id: 'premium',
                  name: 'Premium Dark Luxury',
                  desc: 'Noir profond, émeraude & or, mise en valeur des certificats HPLC.',
                  color: '#042f2e',
                },
                {
                  id: 'minimal',
                  name: 'Minimal Studio',
                  desc: 'Épuré, tons neutres et typographie contemporaine.',
                  color: '#334155',
                },
                {
                  id: 'wellness',
                  name: 'Botanical Wellness',
                  desc: 'Terre cuite, vert herboristerie, esprit pharmacopée douce.',
                  color: '#065f46',
                },
              ].map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setAppearanceForm({ ...appearanceForm, storefrontTemplate: tpl.id })}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                    appearanceForm.storefrontTemplate === tpl.id
                      ? 'border-teal-700 bg-teal-50/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="w-full h-12 rounded-xl mb-2 flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: tpl.color }}>
                      {tpl.name}
                    </div>
                    <strong className="text-xs text-slate-900 block">{tpl.name}</strong>
                    <p className="text-[11px] text-slate-500 leading-tight mt-1">{tpl.desc}</p>
                  </div>
                  {appearanceForm.storefrontTemplate === tpl.id && (
                    <span className="text-[10px] font-black text-teal-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sélectionné
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Palette de Couleurs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Couleur Primaire :</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceForm.primaryColor || '#0f766e'}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={appearanceForm.primaryColor || '#0f766e'}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Couleur Secondaire :</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceForm.secondaryColor || '#042f2e'}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={appearanceForm.secondaryColor || '#042f2e'}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Couleur d&apos;Accent :</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearanceForm.accentColor || '#f59e0b'}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                  />
                  <input
                    type="text"
                    value={appearanceForm.accentColor || '#f59e0b'}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, accentColor: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image URLs */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Logos &amp; Bannières</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL du Logo :</label>
                <input
                  type="url"
                  value={appearanceForm.logoUrl || ''}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL de la Bannière Hero :</label>
                <input
                  type="url"
                  value={appearanceForm.bannerUrl || ''}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, bannerUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les choix graphiques'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 4. CUSTOM CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form */}
          <form onSubmit={handleAddCategory} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Nouveau Rayon Spécifique</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Rayon :</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex : Soins Sommeil Profond"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description :</label>
                <textarea
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Description du rayon pour les clients..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Créer ce rayon
              </button>
            </div>
          </form>

          {/* List of categories */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Rayons Actifs de votre boutique</h3>
            {customCategories.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs text-xs text-slate-400">
                Aucun rayon personnalisé pour l&apos;instant. Créez-en un pour organiser votre vitrine !
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customCategories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">{c.name}</strong>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{c.description || 'Rayon actif'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Supprimer ce rayon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. INVENTORY & ADJUSTMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Inventaire &amp; Gestion des Niveaux de Stock
                </h3>
                <p className="text-xs text-slate-500">
                  Chaque ajustement manuel fait l&apos;objet d&apos;un audit log horodaté et traçable.
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Produit</th>
                    <th className="py-2.5 px-3">Prix (€)</th>
                    <th className="py-2.5 px-3">Stock Actuel</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryProducts.map((p) => {
                    const isLow = p.stockQuantity <= 5 && p.stockQuantity > 0;
                    const isOut = p.stockQuantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 font-bold block">{p.name}</strong>
                          <span className="text-[10px] font-mono text-slate-400">{p.sku || p.id}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{p.price.toFixed(2)} €</td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-black text-xs ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                            }`}
                          >
                            {p.stockQuantity} unités
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isOut ? 'Rupture' : isLow ? 'Stock Faible' : 'Disponible'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setAdjustModalProduct(p);
                              setAdjustNewQuantity(p.stockQuantity);
                              setAdjustReason('RESTOCK');
                              setAdjustComment('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                          >
                            Ajuster Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs of Adjustments */}
          {stockAdjustments.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Historique des Derniers Ajustements Traçables
              </h4>
              <div className="divide-y divide-slate-100 text-xs">
                {stockAdjustments.slice(0, 10).map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-[11px]">
                    <div>
                      <strong className="text-slate-800 font-semibold">{rec.authorEmail}</strong>
                      <span className="text-slate-500"> : motif {rec.reason}</span>
                      {rec.comment && <p className="text-slate-400 italic mt-0.5">&quot;{rec.comment}&quot;</p>}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900">
                        {rec.previousQuantity} → {rec.newQuantity} ({rec.delta >= 0 ? `+${rec.delta}` : rec.delta})
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {new Date(rec.createdAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TEAM & PERMISSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invite form */}
          <form onSubmit={handleInviteMember} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Inviter un Collaborateur</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email :</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="collaborateur@boutique.fr"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom / Prénom :</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Claire Vendeuse"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rôle :</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="SHOP_MANAGER">Manager de Boutique (Gestion complète)</option>
                  <option value="SHOP_STAFF">Personnel de Vente (Commandes &amp; Retraits)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Envoyer l&apos;invitation
              </button>
            </div>
          </form>

          {/* Members list */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Membres de l&apos;Équipe ({teamMembers.length})</h3>
            <div className="space-y-2">
              {teamMembers.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-slate-900">{m.displayName}</strong>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.role === 'SHOP_OWNER'
                            ? 'bg-amber-100 text-amber-900'
                            : m.role === 'SHOP_MANAGER'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{m.email}</p>
                  </div>

                  {m.role !== 'SHOP_OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Révoquer l'accès"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. QR CODE & PROMOTION */}
      {/* ========================================================================= */}
      {activeTab === 'qr' && currentShop && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xs text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900">
              Kit de Signalétique &amp; QR Code
            </h3>
            <p className="text-xs text-slate-500">
              Imprimez ce QR Code pour vos flyers, votre comptoir ou votre vitrine de magasin.
            </p>
          </div>

          <div className="w-56 h-56 mx-auto p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full" shapeRendering="crispEdges">
              <rect x="10" y="10" width="25" height="25" fill="#0f766e" rx="4" />
              <rect x="15" y="15" width="15" height="15" fill="#ffffff" rx="2" />
              <rect x="18" y="18" width="9" height="9" fill="#0f766e" rx="1" />
              <rect x="65" y="10" width="25" height="25" fill="#0f766e" rx="4" />
              <rect x="70" y="15" width="15" height="15" fill="#ffffff" rx="2" />
              <rect x="73" y="18" width="9" height="9" fill="#0f766e" rx="1" />
              <rect x="10" y="65" width="25" height="25" fill="#0f766e" rx="4" />
              <rect x="15" y="70" width="15" height="15" fill="#ffffff" rx="2" />
              <rect x="18" y="73" width="9" height="9" fill="#0f766e" rx="1" />
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

          <div className="space-y-3">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/#storefront=${currentShop.slug || currentShop.id}`}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center text-slate-700"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/#storefront=${currentShop.slug || currentShop.id}`
                );
                setToastMessage('Lien de votre vitrine copié !');
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Copier l&apos;URL Canonique
            </button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Audit Stock Traçable
                </span>
                <h3 className="text-base font-black text-slate-900">{adjustModalProduct.name}</h3>
              </div>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                <span>Stock enregistré actuellement :</span>
                <strong className="font-bold text-slate-900">{adjustModalProduct.stockQuantity} unités</strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nouvelle Quantité :</label>
                <input
                  type="number"
                  min="0"
                  value={adjustNewQuantity}
                  onChange={(e) => setAdjustNewQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif de l&apos;ajustement :</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="RESTOCK">Réassort / Livraison fournisseur</option>
                  <option value="INVENTORY_COUNT">Inventaire physique périodique</option>
                  <option value="DAMAGED_EXPIRED">Produit endommagé ou DLUO dépassée</option>
                  <option value="THEFT_LOSS">Perte ou écart comptable</option>
                  <option value="CUSTOMER_RETURN">Retour client conforme</option>
                  <option value="OTHER">Autre ajustement manuel</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commentaire explicatif :</label>
                <textarea
                  rows={2}
                  value={adjustComment}
                  onChange={(e) => setAdjustComment(e.target.value)}
                  placeholder="Ex : Bon de livraison #BL-2026-89 reçu ce matin..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition cursor-pointer"
                >
                  Valider l&apos;ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
