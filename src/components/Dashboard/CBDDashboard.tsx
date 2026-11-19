import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CBDConsumption,
  CBDProduct,
  CBDWellnessObservation,
  CBDWellnessGoal,
} from '../../types/entities';
import { BotanicalWatermark, BotanicalBadge, BotanicalLeafIcon } from '../Common/BotanicalDecor';
import { CANNABIS_IMAGES, getProductImage } from '../../assets/cannabisAssets';
import { CBDConsumptionModal } from '../CBD/CBDConsumptionModal';
import { CBDProductDetailModal } from '../CBD/CBDProductDetailModal';
import { CBDPersonalProductModal } from '../CBD/CBDPersonalProductModal';
import { CBDWellnessModal } from '../CBD/CBDWellnessModal';
import { CBDScanModal } from '../CBD/CBDScanModal';
import { CBDGoalModal } from '../CBD/CBDGoalModal';
import {
  Sparkles,
  Droplet,
  Moon,
  Heart,
  Smile,
  Zap,
  Plus,
  QrCode,
  Store,
  ShieldCheck,
  Award,
  Search,
  Filter,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  TrendingUp,
  Activity,
  Trophy,
  Package,
  BookOpen,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface CBDDashboardProps {
  onOpenNewEntry: () => void;
  onNavigateTab: (tab: string) => void;
}

type CBDSubTab = 'overview' | 'journal' | 'cabinet' | 'stats' | 'wellness';

export const CBDDashboard: React.FC<CBDDashboardProps> = ({ onOpenNewEntry, onNavigateTab }) => {
  const { token, profile, cbdProfile } = useAuth();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<CBDSubTab>('overview');

  // Backend Data States
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [consumptions, setConsumptions] = useState<CBDConsumption[]>([]);
  const [products, setProducts] = useState<CBDProduct[]>([]);
  const [wellnessObs, setWellnessObs] = useState<CBDWellnessObservation[]>([]);
  const [goals, setGoals] = useState<CBDWellnessGoal[]>([]);
  const [statsData, setStatsData] = useState<any | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [journalCategoryFilter, setJournalCategoryFilter] = useState<string>('ALL');
  const [journalSearchQuery, setJournalSearchQuery] = useState<string>('');
  const [cabinetCategoryFilter, setCabinetCategoryFilter] = useState<string>('ALL');
  const [cabinetFavoritesOnly, setCabinetFavoritesOnly] = useState<boolean>(false);
  const [cabinetSearchQuery, setCabinetSearchQuery] = useState<string>('');

  // Modals
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState<CBDConsumption | null>(null);
  const [prefilledProductId, setPrefilledProductId] = useState<string | null>(null);

  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [selectedProductDetailId, setSelectedProductDetailId] = useState<string | null>(null);

  const [isPersonalProductModalOpen, setIsPersonalProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CBDProduct | null>(null);

  const [isWellnessModalOpen, setIsWellnessModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CBDWellnessGoal | null>(null);

  // Fetch all CBD data
  const fetchAllData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Dashboard summary
      const [dashRes, consRes, prodRes, wellRes, goalsRes, statsRes] = await Promise.all([
        fetch('/api/cbd/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/cbd/consumptions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/cbd/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/cbd/wellness', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/cbd/goals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/cbd/stats?period=${statsPeriod}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (consRes.ok) {
        const data = await consRes.json();
        setConsumptions(data.consumptions || []);
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
      }
      if (wellRes.ok) {
        const data = await wellRes.json();
        setWellnessObs(data.observations || []);
      }
      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(data.goals || []);
      }
      if (statsRes.ok) setStatsData(await statsRes.json());
    } catch (err) {
      console.error('Error fetching CBD data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, statsPeriod]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Delete Consumption
  const handleDeleteConsumption = async (id: string) => {
    if (!confirm('Confirmez-vous la suppression de cette prise ?')) return;
    try {
      const res = await fetch(`/api/cbd/consumptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error('Error deleting consumption:', err);
    }
  };

  // Handle Goal Toggle Progress
  const handleToggleGoalStreak = async (goal: CBDWellnessGoal) => {
    try {
      const nextStreak = (goal.currentStreakDays || 0) + 1;
      const nextProgress = Math.min(100, Math.round((nextStreak / goal.targetDaysPerWeek) * 100));
      await fetch(`/api/cbd/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentStreakDays: nextStreak,
          progressPercent: nextProgress,
        }),
      });
      fetchAllData();
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  // Filtered Consumptions
  const filteredConsumptions = consumptions.filter((item) => {
    const matchesCat = journalCategoryFilter === 'ALL' || item.productType === journalCategoryFilter;
    const matchesSearch =
      !journalSearchQuery ||
      item.productName.toLowerCase().includes(journalSearchQuery.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(journalSearchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(journalSearchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCat = cabinetCategoryFilter === 'ALL' || prod.category === cabinetCategoryFilter;
    const matchesFav = !cabinetFavoritesOnly || prod.isFavorite;
    const matchesSearch =
      !cabinetSearchQuery ||
      prod.name.toLowerCase().includes(cabinetSearchQuery.toLowerCase()) ||
      prod.brand.toLowerCase().includes(cabinetSearchQuery.toLowerCase());
    return matchesCat && matchesFav && matchesSearch;
  });

  const COLORS = ['#059669', '#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HERO BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white shadow-xl relative overflow-hidden border border-emerald-800/20">
        <BotanicalWatermark position="top-right" size={260} className="text-emerald-400/5 pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
            <BotanicalLeafIcon size={14} className="text-emerald-400" variant="minimal" />
            <span>Sanctuaire Sérénité & Phytocannabinoïdes Certifiés (&le; 0.3% THC)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Bonjour {profile?.nickname || 'Claire'}, votre espace phytothérapie & bien-être
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Consignez vos rituels naturels (sommeil, relaxation, récupération musculaire) en toute transparence avec des extraits de chanvre certifiés par laboratoires accrédités ISO/CEI.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setEditingConsumption(null);
                setPrefilledProductId(null);
                setIsConsumptionModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Noter une prise CBD</span>
            </button>

            <button
              onClick={() => setIsWellnessModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition cursor-pointer backdrop-blur-xs"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Bilan du jour</span>
            </button>

            <button
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition cursor-pointer backdrop-blur-xs"
            >
              <QrCode className="w-4 h-4 text-teal-300" />
              <span>Scanner un produit</span>
            </button>

            <button
              onClick={() => onNavigateTab('stores')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Store className="w-4 h-4 text-slate-300" />
              <span>Boutiques Agréées</span>
            </button>
          </div>
        </div>

        {/* Atmospheric botanical glows */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeSubTab === 'overview' ? 'text-white' : 'text-slate-500'}`} />
          <span>Vue d'ensemble</span>
        </button>

        <button
          onClick={() => setActiveSubTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'journal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${activeSubTab === 'journal' ? 'text-white' : 'text-slate-500'}`} />
          <span>Journal & Prises</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeSubTab === 'journal' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {consumptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('cabinet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'cabinet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Package className={`w-3.5 h-3.5 ${activeSubTab === 'cabinet' ? 'text-white' : 'text-slate-500'}`} />
          <span>Mon Armoire & Produits</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeSubTab === 'cabinet' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'stats'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${activeSubTab === 'stats' ? 'text-white' : 'text-slate-500'}`} />
          <span>Statistiques & Habitudes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wellness')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'wellness'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${activeSubTab === 'wellness' ? 'text-white' : 'text-rose-500'}`} />
          <span>Suivi Bien-Être & Objectifs</span>
          {goals.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeSubTab === 'wellness' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {goals.length} obj.
            </span>
          )}
        </button>
      </div>

      {/* 3. SUB-TAB CONTENT ROUTING */}

      {/* ==================================================== */}
      {/* SUB-TAB 1: OVERVIEW */}
      {/* ==================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Prises 7j */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Prises 7 derniers jours</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Droplet className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  {dashboardData?.summary?.consumptions7d || 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">prises notées</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                Moyenne : {dashboardData?.summary?.avgDaily7d || 0} / jour
              </p>
            </div>

            {/* Score Sommeil */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Score Sommeil Moyen</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Moon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  {dashboardData?.wellness?.avgSleepScore || cbdProfile?.sleepQualityRating || 4}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 5</span>
              </div>
              <p className="text-[11px] text-indigo-700 font-medium">Auto-évaluation sur 30 jours</p>
            </div>

            {/* Indice Relaxation */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Indice Relaxation</span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Smile className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  {dashboardData?.wellness?.avgRelaxation || cbdProfile?.relaxationRating || 4}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 5</span>
              </div>
              <p className="text-[11px] text-teal-700 font-medium">Ressenti de détente musculaire</p>
            </div>

            {/* Traçabilité & Qualité */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Conformité Produits</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-emerald-800">100% Conforme</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">THC &le; 0.3% & Analyses HPLC</p>
            </div>

          </div>

          {/* Quick Action & Today's Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Recent Activity Feed */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dernières Prises Consignées</h3>
                  <p className="text-xs text-slate-500">Historique récent de vos prises de CBD</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('journal')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Voir tout le journal</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {consumptions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-3">
                  <Droplet className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Aucune prise consignée pour le moment.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Notez votre première utilisation pour observer vos ressentis au fil des semaines.
                  </p>
                  <button
                    onClick={() => {
                      setEditingConsumption(null);
                      setPrefilledProductId(null);
                      setIsConsumptionModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-600 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enregistrer une première prise</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {consumptions.slice(0, 4).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                          <Droplet className="w-4 h-4 text-emerald-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{entry.productName}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                              {entry.quantity} {entry.quantityUnit}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {entry.date} à {entry.time} • {entry.consumptionMethod} • {entry.context}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.wellnessRating && (
                          <span className="text-xs font-bold text-emerald-700 px-2 py-1 bg-emerald-50 rounded-lg">
                            ★ {entry.wellnessRating}/5
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingConsumption(entry);
                            setIsConsumptionModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Active Routine & Goals Snapshot */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Rituels & Objectifs</h3>
                  <p className="text-xs text-slate-500">Régularité et hygiène de vie</p>
                </div>
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="p-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                  title="Ajouter un rituel"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="p-5 text-center rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2 text-xs">
                  <Trophy className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="font-bold text-amber-900">Aucun rituel défini</p>
                  <p className="text-slate-600 text-[11px]">
                    Fixez-vous un rythme (sommeil, détente, pauses) pour mesurer l&apos;évolution de votre confort.
                  </p>
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-600 transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Créer un rituel</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{g.title}</h4>
                          <p className="text-[11px] text-slate-500">
                            Cible : {g.targetDaysPerWeek} j/semaine
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleGoalStreak(g)}
                          title="Valider pour aujourd'hui"
                          className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Fait</span>
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Progression</span>
                          <span>{g.progressPercent || 0}% ({g.currentStreakDays || 0} j)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, g.progressPercent || 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Phytocannabinoid Guide & Safety */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cadre Réglementaire & Sécurité</span>
                </div>
                <h3 className="text-base font-bold">Rappel de Sécurité & Clarté Médicale</h3>
              </div>
              <button
                onClick={() => onNavigateTab('education')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Guide complet des cannabinoïdes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Conformité Légale</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  En France et dans l'Union Européenne, les produits à base de chanvre sont légaux si leur teneur en THC ne dépasse pas 0.3%.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Prudence Routière</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Les tests salivaires policiers détectent la présence de molécules de THC avec un seuil de détection très bas. Prudence en cas de conduite.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-800 space-y-1.5">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>Interactions Médicamenteuses</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Le CBD est métabolisé par les enzymes CYP450 du foie. Consultez impérativement un professionnel de santé en cas de traitement médical.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 2: JOURNAL & PRISES */}
      {/* ==================================================== */}
      {activeSubTab === 'journal' && (
        <div className="space-y-6">
          
          {/* Header & Controls */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Journal des Prises CBD</h3>
                <p className="text-xs text-slate-500">
                  Consignez vos prises, quantités, méthodes et observez la régularité de vos ressentis
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingConsumption(null);
                  setPrefilledProductId(null);
                  setIsConsumptionModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle prise</span>
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={journalSearchQuery}
                  onChange={(e) => setJournalSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit, marque..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <select
                  value={journalCategoryFilter}
                  onChange={(e) => setJournalCategoryFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="ALL">Toutes les catégories</option>
                  <option value="oil">Huiles & Gouttes</option>
                  <option value="infusion">Infusions / Tisanes</option>
                  <option value="flower">Fleurs</option>
                  <option value="capsule">Gélules</option>
                  <option value="cosmetic">Cosmétiques & Baumes</option>
                  <option value="vape">Vaporisation</option>
                  <option value="other">Autres</option>
                </select>
              </div>

              <div className="flex items-center justify-end text-xs font-semibold text-slate-500">
                <span>{filteredConsumptions.length} entrée(s) trouvée(s)</span>
              </div>
            </div>
          </div>

          {/* Consumptions List */}
          {filteredConsumptions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
              <Droplet className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Aucune prise ne correspond aux critères</h4>
              <p className="text-xs text-slate-500">
                Modifiez vos filtres ou enregistrez une nouvelle prise.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConsumptions.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-emerald-200 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                        <Droplet className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{item.productName}</h4>
                          {item.brand && (
                            <span className="text-xs text-slate-500 font-semibold">• {item.brand}</span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold">
                            {item.quantity} {item.quantityUnit}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.date}</span>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.time}</span>
                          </span>
                          <span>•</span>
                          <span className="capitalize">{item.consumptionMethod}</span>
                          <span>•</span>
                          <span>Contexte : {item.context}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {item.wellnessRating && (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                          ★ {item.wellnessRating} / 5
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingConsumption(item);
                          setIsConsumptionModalOpen(true);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConsumption(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subjective effects chips */}
                  {item.subjectiveEffects && item.subjectiveEffects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.subjectiveEffects.map((eff, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {eff}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
                      « {item.notes} »
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 3: MON ARMOIRE & PRODUITS */}
      {/* ==================================================== */}
      {activeSubTab === 'cabinet' && (
        <div className="space-y-6">
          
          {/* Header & Actions */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Armoire & Produits CBD</h3>
                <p className="text-xs text-slate-500">
                  Consultez les analyses de laboratoire, certifiés &le; 0.3% THC et gérez vos références favorites
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsScanModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-slate-600" />
                  <span>Scanner un code</span>
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsPersonalProductModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un produit</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cabinetSearchQuery}
                  onChange={(e) => setCabinetSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, marque..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              <div>
                <select
                  value={cabinetCategoryFilter}
                  onChange={(e) => setCabinetCategoryFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-hidden cursor-pointer"
                >
                  <option value="ALL">Tous les formats</option>
                  <option value="oil">Huiles & Gouttes</option>
                  <option value="infusion">Infusions / Tisanes</option>
                  <option value="flower">Fleurs</option>
                  <option value="capsule">Gélules</option>
                  <option value="cosmetic">Cosmétiques & Baumes</option>
                  <option value="vape">Vape / E-liquide</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCabinetFavoritesOnly(!cabinetFavoritesOnly)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    cabinetFavoritesOnly
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${cabinetFavoritesOnly ? 'fill-rose-600' : ''}`} />
                  <span>Favoris uniquement</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => {
              const productImg = getProductImage(prod.category, prod.name);
              return (
                <div
                  key={prod.id}
                  className="rounded-3xl bg-white border border-emerald-950/8 shadow-[0_4px_20px_-4px_rgba(6,78,59,0.06)] hover:border-emerald-700/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Product Image Header with botanical watermark & tags */}
                  <div className="relative h-44 w-full bg-linear-to-b from-stone-100 to-emerald-50/40 overflow-hidden">
                    <img
                      src={productImg}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none" />

                    {/* Top tags */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-200 backdrop-blur-xs border border-emerald-700/40 shadow-xs">
                        <BotanicalLeafIcon size={10} className="text-emerald-400" variant="minimal" />
                        <span>{prod.category}</span>
                      </span>
                      {prod.isFavorite && (
                        <div className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        </div>
                      )}
                    </div>

                    {/* Bottom brand tag on image */}
                    <div className="absolute bottom-2.5 left-3">
                      <span className="text-[11px] font-bold text-white/90 drop-shadow-sm">
                        {prod.brand || 'Nexus Botanical'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-emerald-900 transition">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {prod.description || 'Extrait végétal conforme aux normes de traçabilité et de sécurité sanitaire.'}
                      </p>

                      <div className="pt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                        {prod.cbdPercentage && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-[11px]">
                            {prod.cbdPercentage}% CBD
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px]">
                          THC &le; {prod.thcPercentage || 0.0}%
                        </span>
                        {prod.volumeOrWeight && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-600 text-[11px]">
                            {prod.volumeOrWeight}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between border-t border-emerald-950/5 mt-2">
                      <button
                        onClick={() => {
                          setSelectedProductDetailId(prod.id);
                          setIsProductDetailOpen(true);
                        }}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Fiche & CoA Lab</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setPrefilledProductId(prod.id);
                          setEditingConsumption(null);
                          setIsConsumptionModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3 text-emerald-300" />
                        <span>Prise</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 4: STATISTIQUES & HABITUDES */}
      {/* ==================================================== */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          
          {/* Controls */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Analyse Statistique & Tendances</h3>
              <p className="text-xs text-slate-500">
                Visualisez la distribution de vos utilisations et la régularité de vos bilans de confort
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(['7days', '30days', '90days'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setStatsPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    statsPeriod === p ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p === '7days' && '7 jours'}
                  {p === '30days' && '30 jours'}
                  {p === '90days' && '90 jours'}
                </button>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Timeline Consumption Chart */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Évolution Quotidienne des Prises</h4>
              <div className="h-64 w-full">
                {statsData?.timeline && statsData.timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statsData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cbdGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Prises"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fill="url(#cbdGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Données insuffisantes sur cette période
                  </div>
                )}
              </div>
            </div>

            {/* Distribution by Category */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Formats Préférés & Répartition</h4>
              <div className="h-64 w-full">
                {statsData?.byCategory && statsData.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsData.byCategory}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`
                        }
                      >
                        {statsData.byCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Pas encore de répartition disponible
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Context & Effects Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Contexts */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Moments & Contextes d’Usage</h4>
              <div className="space-y-2">
                {statsData?.byContext && statsData.byContext.length > 0 ? (
                  statsData.byContext.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                      <span className="font-semibold text-slate-700 capitalize">{item.context}</span>
                      <span className="font-bold text-emerald-800">{item.count} fois</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucun contexte renseigné.</p>
                )}
              </div>
            </div>

            {/* Reported Effects */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Ressentis les plus fréquents</h4>
              <div className="space-y-2">
                {statsData?.byEffect && statsData.byEffect.length > 0 ? (
                  statsData.byEffect.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                      <span className="font-semibold text-slate-700">{item.effect}</span>
                      <span className="font-bold text-indigo-800">{item.count} mentions</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucun effet consigné.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* SUB-TAB 5: SUIVI BIEN-ÊTRE & OBJECTIFS */}
      {/* ==================================================== */}
      {activeSubTab === 'wellness' && (
        <div className="space-y-6">
          
          {/* Header */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Suivi du Bien-Être & Objectifs Personnels</h3>
              <p className="text-xs text-slate-500">
                Évaluez l&apos;impact de vos routines sur votre sommeil, votre niveau de stress et votre énergie
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsWellnessModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Heart className="w-4 h-4" />
                <span>Nouveau bilan</span>
              </button>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trophy className="w-4 h-4" />
                <span>Nouvel objectif</span>
              </button>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Mes Objectifs & Rituels Réguliers</h4>
            {goals.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 space-y-2">
                <Trophy className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Aucun objectif défini</p>
                <p className="text-xs text-slate-400">
                  Définissez un rituel pour vous aider à instaurer une hygiène de vie stable.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {g.category}
                        </span>
                        <button
                          onClick={() => handleToggleGoalStreak(g)}
                          className="px-3 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Valider aujourd&apos;hui</span>
                        </button>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{g.title}</h5>
                      {g.description && <p className="text-xs text-slate-500">{g.description}</p>}
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Fréquence cible : {g.targetDaysPerWeek} j/semaine</span>
                        <span>Série : {g.currentStreakDays || 0} jour(s)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, g.progressPercent || 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wellness Observations History */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Historique des Bilans Quotidiens</h4>
            {wellnessObs.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white border border-slate-200 space-y-2">
                <Heart className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Aucun bilan enregistré</p>
                <p className="text-xs text-slate-400">
                  Prenez 30 secondes pour noter votre sommeil et votre niveau de stress.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wellnessObs.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900">{w.date}</span>
                        {w.time && <span className="text-xs text-slate-400 font-semibold">• {w.time}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold pt-1">
                        {w.sleepQuality !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800">
                            Sommeil : {w.sleepQuality}/5
                          </span>
                        )}
                        {w.stressLevel !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800">
                            Stress : {w.stressLevel}/5
                          </span>
                        )}
                        {w.relaxation !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800">
                            Relaxation : {w.relaxation}/5
                          </span>
                        )}
                        {w.energy !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800">
                            Énergie : {w.energy}/5
                          </span>
                        )}
                        {w.physicalActivity && (
                          <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800">
                            Activité : {w.activityDurationMinutes || 30} min ({w.activityType || 'Sport'})
                          </span>
                        )}
                      </div>
                    </div>

                    {w.notes && (
                      <p className="text-xs text-slate-500 italic sm:max-w-xs truncate">
                        « {w.notes} »
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* MODALS */}
      {/* ========================================== */}
      
      {/* Consumption Modal */}
      <CBDConsumptionModal
        isOpen={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        onSaved={fetchAllData}
        initialProductId={prefilledProductId}
        editingConsumption={editingConsumption}
      />

      {/* Product Detail Modal */}
      <CBDProductDetailModal
        isOpen={isProductDetailOpen}
        productId={selectedProductDetailId}
        onClose={() => setIsProductDetailOpen(false)}
        onLogConsumption={(prodId) => {
          setIsProductDetailOpen(false);
          setPrefilledProductId(prodId);
          setEditingConsumption(null);
          setIsConsumptionModalOpen(true);
        }}
        onEditProduct={(prod) => {
          setIsProductDetailOpen(false);
          setEditingProduct(prod);
          setIsPersonalProductModalOpen(true);
        }}
        onProductUpdated={fetchAllData}
      />

      {/* Personal Product Create/Edit Modal */}
      <CBDPersonalProductModal
        isOpen={isPersonalProductModalOpen}
        onClose={() => setIsPersonalProductModalOpen(false)}
        onSaved={fetchAllData}
        editingProduct={editingProduct}
      />

      {/* Wellness Observation Modal */}
      <CBDWellnessModal
        isOpen={isWellnessModalOpen}
        onClose={() => setIsWellnessModalOpen(false)}
        onSaved={fetchAllData}
      />

      {/* Scan Modal */}
      <CBDScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onProductFound={(prod) => {
          setSelectedProductDetailId(prod.id);
          setIsProductDetailOpen(true);
        }}
        onCreateProductFromCode={(code) => {
          setEditingProduct(null);
          setIsPersonalProductModalOpen(true);
        }}
      />

      {/* Goal Modal */}
      <CBDGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSaved={fetchAllData}
        editingGoal={editingGoal}
      />

    </div>
  );
};
