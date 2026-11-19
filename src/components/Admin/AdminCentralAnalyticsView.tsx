import React, { useState, useEffect, useId } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Shield,
  Activity,
  Users,
  DollarSign,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LifeBuoy,
  Download,
  RefreshCw,
  FileText,
  Search,
  Eye,
  Send,
  Calendar,
  Globe,
  Lock,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Layers,
  ChevronRight,
  Check,
  AlertCircle,
  Play
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import {
  GlobalKPISummary,
  ConversionFunnelStep,
  TrendTimeSeriesPoint,
  AdminAlert,
  BackgroundJob,
  SupportCase,
  MetricDefinition,
  AuditLog
} from '../../types/entities';

export const AdminCentralAnalyticsView: React.FC = () => {
  const { token, user } = useAuth();
  const searchInputId = useId();

  // Internal Sub-navigation
  const [subTab, setSubTab] = useState<'kpi_overview' | 'funnel' | 'monitoring' | 'support' | 'exports_bi' | 'audit_trail'>('kpi_overview');

  // Filters
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | '12m'>('30d');
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // Data states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kpis, setKpis] = useState<GlobalKPISummary | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnelStep[]>([]);
  const [timeSeries, setTimeSeries] = useState<TrendTimeSeriesPoint[]>([]);
  const [executive, setExecutive] = useState<any | null>(null);

  // Monitoring
  const [systemHealth, setSystemHealth] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);

  // Support
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedUser360, setSelectedUser360] = useState<any | null>(null);

  // BI Metrics & Audit
  const [metricDefs, setMetricDefs] = useState<MetricDefinition[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilterAction, setAuditFilterAction] = useState<string>('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  // Status message
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Fetch Dashboard KPIs
  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const query = new URLSearchParams();
      query.set('period', period);
      if (selectedCountry) query.set('country', selectedCountry);

      const res = await fetch(`/api/admin/dashboard?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
        setFunnel(data.funnel || []);
        setTimeSeries(data.timeSeries || []);
        setExecutive(data.executive || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  // Fetch Monitoring
  const fetchMonitoringData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/monitoring', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data.health);
        setAlerts(data.alerts || []);
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load monitoring:', err);
    }
  };

  // Fetch Support
  const fetchSupportData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/support/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSupportCases(data.cases || []);
        if (selectedCase) {
          const fresh = data.cases.find((c: SupportCase) => c.id === selectedCase.id);
          if (fresh) setSelectedCase(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to load support cases:', err);
    }
  };

  // Fetch Audit & BI Defs
  const fetchAuditAndDefs = async () => {
    if (!token) return;
    try {
      const [resAudit, resDefs] = await Promise.all([
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/metrics-definitions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resAudit.ok) {
        const data = await resAudit.json();
        setAuditLogs(data.logs || []);
      }
      if (resDefs.ok) {
        const data = await resDefs.json();
        setMetricDefs(data.metricDefinitions || []);
      }
    } catch (err) {
      console.error('Failed to load audit or metric defs:', err);
    }
  };

  // Initial and reactive load
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchMonitoringData(),
        fetchSupportData(),
        fetchAuditAndDefs()
      ]);
      setIsLoading(false);
    };
    loadAll();
  }, [token, period, selectedCountry]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchMonitoringData(),
      fetchSupportData(),
      fetchAuditAndDefs()
    ]);
    setIsRefreshing(false);
    showNotice('Données de supervision et métriques actualisées avec succès.');
  };

  // Alert Actions
  const handleAlertAction = async (alertId: string, action: 'ACKNOWLEDGE' | 'RESOLVE') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        await fetchMonitoringData();
        showNotice(`Alerte ${action === 'RESOLVE' ? 'résolue' : 'acquittée'} avec succès.`);
      }
    } catch (err) {
      showNotice('Erreur lors de la mise à jour de l’alerte.', 'error');
    }
  };

  // Job Trigger
  const handleTriggerJob = async (type: string) => {
    if (!token) return;
    setTriggeringJob(type);
    try {
      const res = await fetch('/api/admin/jobs/trigger', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        await fetchMonitoringData();
        showNotice(`Tâche d’arrière-plan « ${type} » déclenchée avec succès.`);
      }
    } catch (err) {
      showNotice('Erreur lors du déclenchement du job.', 'error');
    } finally {
      setTriggeringJob(null);
    }
  };

  // Send Support Reply
  const handleSendReply = async () => {
    if (!token || !selectedCase || !replyText.trim()) return;
    try {
      const res = await fetch(`/api/admin/support/cases/${selectedCase.id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: replyText.trim(), sender: 'SUPPORT' })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.supportCase);
        setReplyText('');
        await fetchSupportData();
        showNotice('Réponse d’assistance transmise avec succès au client.');
      }
    } catch (err) {
      showNotice('Erreur lors de l’envoi de la réponse.', 'error');
    }
  };

  // Change Support Case Status
  const handleUpdateCaseStatus = async (caseId: string, status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'RESOLVED') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/support/cases/${caseId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data.supportCase);
        await fetchSupportData();
        showNotice(`Statut du ticket mis à jour : ${status}.`);
      }
    } catch (err) {
      showNotice('Erreur mise à jour statut ticket.', 'error');
    }
  };

  // Search User for Support 360
  const handleSearchUser = async () => {
    if (!token || !userSearchQuery.trim()) return;
    try {
      const res = await fetch(`/api/admin/support/search-user?q=${encodeURIComponent(userSearchQuery.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserSearchResults(data.results || []);
        if (data.results.length === 1) {
          setSelectedUser360(data.results[0]);
        }
      }
    } catch (err) {
      showNotice('Erreur lors de la recherche du profil.', 'error');
    }
  };

  // Export Data Handler
  const handleExport = async (type: string, format: 'csv' | 'json') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/export/${type}?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        showNotice(`Erreur lors de l'exportation de ${type}.`, 'error');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_${type}_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotice(`Export ${type.toUpperCase()} (${format.toUpperCase()}) téléchargé.`);
    } catch (err) {
      showNotice('Échec du téléchargement du fichier.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={`p-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{actionNotice.message}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Module 17 — Administration Centrale, Analytics Globaux, BI & Support</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Pilotage Stratégique & Supervision Système</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Consolidation financière du Grand Livre, entonnoir de conversion en 7 étapes, surveillance active de l&apos;infrastructure et support client avec Sanctuaire de Santé garanti.
            </p>
          </div>

          {/* Quick Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
              {(['today', '7d', '30d', '90d', '12m'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    period === p ? 'bg-teal-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7j' : p === '30d' ? '30j' : p === '90d' ? '90j' : '12 mois'}
                </button>
              ))}
            </div>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="">Tous pays</option>
              <option value="FR">France (FR)</option>
              <option value="BE">Belgique (BE)</option>
              <option value="LU">Luxembourg (LU)</option>
              <option value="CH">Suisse (CH)</option>
              <option value="DE">Allemagne (DE)</option>
              <option value="ES">Espagne (ES)</option>
              <option value="IT">Italie (IT)</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>
        </div>

        {/* Global Health Indicator Bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Santé Système :</span>
            <span className="text-emerald-400 font-bold">
              {systemHealth?.overallHealth || 'OPTIMAL'} (Score {systemHealth?.uptimeScore ?? 99.9}%)
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Alertes actives : <strong className="text-amber-400">{alerts.filter(a => a.status === 'ACTIVE').length}</strong></span>
            <span>Tâches de fond : <strong className="text-slate-200">{jobs.length}</strong></span>
            <span>Tickets support ouverts : <strong className="text-teal-300">{supportCases.filter(c => c.status !== 'RESOLVED').length}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-fit">
        <button
          type="button"
          onClick={() => setSubTab('kpi_overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'kpi_overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
          <span>Tableau Exécutif & Ventes</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('funnel')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'funnel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-700" />
          <span>Entonnoir de Conversion (7 Étapes)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('monitoring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'monitoring' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-emerald-700" />
          <span>Supervision & Jobs Système</span>
          {alerts.filter(a => a.status === 'ACTIVE').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {alerts.filter(a => a.status === 'ACTIVE').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('support')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'support' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-3.5 h-3.5 text-amber-700" />
          <span>Support Client & Sanctuaire</span>
          {supportCases.filter(c => c.status === 'OPEN').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {supportCases.filter(c => c.status === 'OPEN').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('exports_bi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'exports_bi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-teal-700" />
          <span>Centre d&apos;Exports & Métriques BI</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('audit_trail')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'audit_trail' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-slate-700" />
          <span>Registre d&apos;Audit & Sécurité</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-TAB: EXECUTIVE & SALES KPIS */}
      {/* ========================================================================= */}
      {subTab === 'kpi_overview' && (
        <div className="space-y-6">
          {/* Executive Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Gross GMV */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Volume d&apos;Affaires Brut (GMV)</span>
                <DollarSign className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{kpis?.marketplace.grossGMV.toFixed(2) || '0.00'} €</span>
                {kpis?.marketplace.trendVsPreviousPeriod !== undefined && (
                  <span className={`text-xs font-bold flex items-center ${kpis.marketplace.trendVsPreviousPeriod >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {kpis.marketplace.trendVsPreviousPeriod >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpis.marketplace.trendVsPreviousPeriod}%
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-2">
                <span>Commissions Nexus : <strong className="text-slate-900">{kpis?.finance.nexusCommissionsTotal.toFixed(2) || '0.00'} €</strong></span>
                <span>Panier moy : <strong className="text-slate-900">{kpis?.marketplace.averageOrderValue.toFixed(2) || '0.00'} €</strong></span>
              </div>
            </div>

            {/* Card 2: Subscriptions MRR */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Revenus Récurrents (MRR)</span>
                <CreditCard className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{kpis?.subscriptions.mrr.toFixed(2) || '0.00'} €</span>
                <span className="text-xs font-bold text-slate-500">/ mois</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-2">
                <span>ARR projeté : <strong className="text-slate-900">{kpis?.subscriptions.arr.toFixed(2) || '0.00'} €</strong></span>
                <span>Abonnés : <strong className="text-indigo-700">{kpis?.subscriptions.activeCount || 0}</strong></span>
              </div>
            </div>

            {/* Card 3: Users DAU/MAU */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Ratio Engagement (DAU / MAU)</span>
                <Users className="w-4 h-4 text-teal-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{kpis?.users.dauMauRatio || 0} %</span>
                <span className="text-xs font-bold text-emerald-700">Optimal</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-2">
                <span>MAU : <strong className="text-slate-900">{kpis?.users.mau || 0}</strong></span>
                <span>Nouveaux : <strong className="text-slate-900">{kpis?.users.newInPeriod || 0}</strong></span>
              </div>
            </div>

            {/* Card 4: Orders & Marketplace */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Commandes & Marketplace</span>
                <ShoppingBag className="w-4 h-4 text-amber-700" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{kpis?.marketplace.ordersCount || 0}</span>
                <span className="text-xs font-bold text-slate-500">payées</span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-2">
                <span>Boutiques actives : <strong className="text-slate-900">{kpis?.marketplace.activeShopsCount || 0}</strong></span>
                <span>Articles vendus : <strong className="text-slate-900">{kpis?.marketplace.productsSoldCount || 0}</strong></span>
              </div>
            </div>
          </div>

          {/* Time Series Charts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-700" />
                  <span>Évolution Temporelle du Volume d&apos;Affaires & Fréquentation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visualisation continue des revenus bruts (€) et du volume de transactions sur la période sélectionnée.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'gmv' ? `${Number(value).toFixed(2)} €` : value,
                      name === 'gmv' ? "Volume d'affaires" : name === 'orders' ? 'Commandes' : 'Utilisateurs'
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gmv"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGmv)"
                    name="gmv"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Financial & Marketplace Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Grand Livre & Finance Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Flux Financiers Plateforme</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Paiements validés</span>
                  <span className="font-bold text-slate-900">{kpis?.finance.successfulPaymentsCount || 0}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Paiements échoués</span>
                  <span className="font-bold text-rose-700">{kpis?.finance.failedPaymentsCount || 0}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Remboursements totaux</span>
                  <span className="font-bold text-slate-900">{kpis?.finance.refundsTotalAmount.toFixed(2) || '0.00'} €</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Commissions Nexus prélevées</span>
                  <span className="font-bold text-teal-800">{kpis?.finance.nexusCommissionsTotal.toFixed(2) || '0.00'} €</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Frais d&apos;interchange & PSP estimés (Stripe)</span>
                  <span className="font-bold text-slate-900">{kpis?.finance.pspEstimatedFeesTotal.toFixed(2) || '0.00'} €</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Soldes partenaires en attente</span>
                  <span className="font-bold text-indigo-700">{kpis?.finance.partnerPendingBalancesTotal.toFixed(2) || '0.00'} €</span>
                </div>
              </div>
            </div>

            {/* Engagement & Sanctuary Guarantees */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>Indicateurs d&apos;Usage & Sanctuaire Santé</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Sessions enregistrées</span>
                  <span className="font-bold text-slate-900">{kpis?.engagement.activeSessionsCount || 0}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Actions bien-être & suivi (anonymisées)</span>
                  <span className="font-bold text-emerald-800">{kpis?.engagement.wellnessActionsLogged || 0}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Parcours éducatifs certifiés</span>
                  <span className="font-bold text-slate-900">{kpis?.engagement.educationPathwaysCompleted || 0}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Points de fidélité accordés</span>
                  <span className="font-bold text-amber-800">{kpis?.engagement.loyaltyPointsIssued || 0} pts</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Notifications délivrées</span>
                  <span className="font-bold text-slate-900">{kpis?.engagement.notificationsDelivered || 0}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Interactions Coach IA (Cloisonnées)</span>
                  <span className="font-bold text-indigo-800">{kpis?.engagement.aiAssistantInteractionsCount || 0}</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-[11px] text-teal-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Protection RGPD :</strong> Les données médicales, dosages THC et notes de journal intime demeurent chiffrées et isolées dans le Sanctuaire de Santé. Aucun administrateur ne peut consulter les historiques individuels.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-TAB: 7-STEP CONVERSION FUNNEL */}
      {/* ========================================================================= */}
      {subTab === 'funnel' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-700" />
              <span>Entonnoir de Conversion Mesurable en 7 Étapes</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              De la première visite PWA jusqu&apos;à l&apos;abonnement récurrent : détection des goulots d&apos;étranglement et calcul exact des taux de passage et d&apos;abandon.
            </p>
          </div>

          <div className="space-y-3">
            {funnel.map((step) => {
              const widthPct = Math.max(step.conversionRateFromTop, 6);
              return (
                <div
                  key={step.key}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-teal-300 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-[11px]">
                        {step.stepIndex}
                      </span>
                      <strong className="text-slate-900 text-sm">{step.name}</strong>
                      <span className="text-slate-400 hidden sm:inline">— {step.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900 text-sm">{step.count} usagers</span>
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold text-[11px]">
                        {step.conversionRateFromTop}% du sommet
                      </span>
                      {step.stepIndex > 1 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium text-[11px]">
                          Passage : {step.stepConversionRate}% (Drop: {step.dropoffRate}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Taux Activation (Inscrits → Actifs)</span>
              <p className="text-xl font-bold text-slate-900">
                {funnel[1]?.count > 0 ? ((funnel[3]?.count / funnel[1]?.count) * 100).toFixed(1) : 0} %
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Transformation E-Commerce</span>
              <p className="text-xl font-bold text-emerald-800">
                {funnel[0]?.count > 0 ? ((funnel[5]?.count / funnel[0]?.count) * 100).toFixed(1) : 0} %
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Conversion Premium Récurrente</span>
              <p className="text-xl font-bold text-indigo-800">
                {funnel[5]?.count > 0 ? ((funnel[6]?.count / funnel[5]?.count) * 100).toFixed(1) : 0} %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB: SYSTEM HEALTH & BACKGROUND JOBS */}
      {/* ========================================================================= */}
      {subTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Subsystems Health Grid */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-700" />
              <span>État des 7 Sous-Systèmes d&apos;Infrastructure</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {systemHealth?.subsystems ? (
                Object.entries(systemHealth.subsystems).map(([key, sub]: [string, any]) => (
                  <div key={key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{sub.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'HEALTHY'
                            ? 'bg-emerald-100 text-emerald-900'
                            : sub.status === 'DEGRADED'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Latence : {sub.latencyMs}ms</span>
                      <span>Dispo : {sub.uptime}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Chargement de la télémétrie système...</p>
              )}
            </div>
          </div>

          {/* Active Administrative Alerts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Alertes Administratives & Incidents Détectés ({alerts.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                  <span>Aucune alerte active. Tous les paramètres opérationnels sont nominaux.</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      alert.status === 'RESOLVED'
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : alert.severity === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            alert.severity === 'CRITICAL' ? 'bg-rose-200 text-rose-950' : 'bg-amber-200 text-amber-950'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{alert.title}</span>
                        <span className="text-[11px] text-slate-500">[{alert.source}]</span>
                      </div>
                      <p className="text-slate-700">{alert.message}</p>
                      <span className="text-[10px] text-slate-400">
                        Déclenchée le {new Date(alert.createdAt).toLocaleString('fr-FR')} • Statut : {alert.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {alert.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleAlertAction(alert.id, 'ACKNOWLEDGE')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition cursor-pointer"
                        >
                          Acquitter
                        </button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleAlertAction(alert.id, 'RESOLVE')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Résoudre
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Background Jobs Control */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-700" />
              <span>Ordonnanceur de Tâches de Fond (Cron & Maintenance)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { type: 'METRICS_REFRESH', label: 'Recalcul des Métriques', desc: 'Régénération des agrégats BI et DAU/MAU' },
                { type: 'STOCK_SYNC', label: 'Synchronisation des Stocks', desc: 'Ajustement des inventaires partenaires' },
                { type: 'SESSION_PURGE', label: 'Purge des Sessions Expirées', desc: 'Nettoyage conforme RGPD des jetons' },
                { type: 'ABANDONED_CART_SYNC', label: 'Relance Paniers Abandonnés', desc: 'Détection des paniers inactifs > 24h' }
              ].map((jobDef) => (
                <div key={jobDef.type} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{jobDef.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{jobDef.desc}</p>
                  </div>
                  <button
                    type="button"
                    disabled={triggeringJob === jobDef.type}
                    onClick={() => handleTriggerJob(jobDef.type)}
                    className="w-full mt-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 text-teal-400" />
                    <span>{triggeringJob === jobDef.type ? 'Exécution...' : 'Déclencher'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Recent Executed Jobs List */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Historique d&apos;exécution des tâches :</h4>
              <div className="space-y-1.5">
                {jobs.slice(0, 5).map((j) => (
                  <div key={j.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                      <strong className="text-slate-900">{j.type}</strong>
                      <span className="text-slate-400">• Durée : {j.durationMs}ms</span>
                    </div>
                    <span className="text-slate-500">{new Date(j.completedAt || j.startedAt).toLocaleTimeString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB: CUSTOMER SUPPORT & USER 360 (SANCTUARY ENFORCED) */}
      {/* ========================================================================= */}
      {subTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Cases List */}
          <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-700" />
                <span>Tickets ({supportCases.length})</span>
              </h3>
            </div>

            {/* Quick User Lookup */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label htmlFor={searchInputId} className="text-[11px] font-bold text-slate-500 uppercase">Recherche Compte Client</label>
              <div className="flex gap-2">
                <input
                  id={searchInputId}
                  type="text"
                  placeholder="Email, pseudo ou ID..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleSearchUser}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* User 360 Sanitized Modal / Drawer Indicator */}
            {selectedUser360 && (
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-teal-950 font-bold">{selectedUser360.nickname}</strong>
                  <button type="button" onClick={() => setSelectedUser360(null)} className="text-teal-700">✕</button>
                </div>
                <p className="text-[11px] text-teal-800">{selectedUser360.email} • Rôle : {selectedUser360.role}</p>
                <div className="text-[10px] text-teal-900 border-t border-teal-200/60 pt-1 space-y-0.5">
                  <div>Commandes : {selectedUser360.ordersCount}</div>
                  <div>Inscrit le : {new Date(selectedUser360.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-teal-100/70 text-[10px] text-teal-900 font-medium">
                  🔒 Sanctuaire de Santé actif : Notes de journal et dosages THC strictement inaccessibles.
                </div>
              </div>
            )}

            {/* Cases items */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {supportCases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCase(c)}
                  className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                    selectedCase?.id === c.id
                      ? 'bg-teal-50 border-teal-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        c.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-900'
                          : c.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.priority}
                    </span>
                    <span className="text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{c.subject}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{c.clientName || c.clientEmail}</span>
                    <span className="font-semibold text-teal-800">{c.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Case Discussion & Resolution */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            {selectedCase ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Ticket #{selectedCase.id}</span>
                    <h3 className="text-lg font-black text-slate-900">{selectedCase.subject}</h3>
                    <p className="text-xs text-slate-500">Client : {selectedCase.clientName} ({selectedCase.clientEmail})</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCase.status}
                      onChange={(e) => handleUpdateCaseStatus(selectedCase.id, e.target.value as any)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                    >
                      <option value="OPEN">OUVERT</option>
                      <option value="IN_PROGRESS">EN COURS</option>
                      <option value="WAITING_CLIENT">ATTENTE CLIENT</option>
                      <option value="RESOLVED">RÉSOLU</option>
                    </select>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {selectedCase.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                        m.sender === 'SUPPORT'
                          ? 'ml-auto bg-teal-600 text-white rounded-br-none'
                          : 'mr-auto bg-slate-100 text-slate-900 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                        <span className="font-bold">{m.authorName || m.sender}</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Box */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Saisissez la réponse du service client Nexus..."
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-teal-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Envoyer la Réponse</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-xs text-slate-400 space-y-2">
                <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto" />
                <p>Sélectionnez un ticket dans la liste de gauche pour consulter l&apos;échange et apporter une réponse.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB: EXPORT CENTER & BI DICTIONARY */}
      {/* ========================================================================= */}
      {subTab === 'exports_bi' && (
        <div className="space-y-6">
          {/* Export Downloads Center */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-700" />
              <span>Centre d&apos;Exportation des Données (CSV avec BOM UTF-8 & JSON)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Génération de rapports complets conformes aux normes comptables et d&apos;audit financier.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[
                { type: 'orders', name: 'Commandes Globales', desc: 'Détail des transactions, acheteurs et expéditions' },
                { type: 'shops', name: 'Boutiques Partenaires', desc: 'Performances, commissions et coordonnées légales' },
                { type: 'ledger', name: 'Grand Livre Comptable', desc: 'Écritures débit/crédit et paiements prestataires' },
                { type: 'subscriptions', name: 'Abonnements & MRR', desc: 'Statuts, prix, récurrences et désabonnements' }
              ].map((exp) => (
                <div key={exp.type} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{exp.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{exp.desc}</p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => handleExport(exp.type, 'csv')}
                      className="flex-1 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExport(exp.type, 'json')}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Standardized BI Metric Definitions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>Dictionnaire des Définitions de Métriques BI</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Métrique</th>
                    <th className="pb-3">Formule Mathématique</th>
                    <th className="pb-3">Unité</th>
                    <th className="pb-3">Source de Données</th>
                    <th className="pb-3">Garantie & Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metricDefs.map((def) => (
                    <tr key={def.code} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">
                        <div>{def.name}</div>
                        <span className="font-mono text-[10px] text-slate-400">{def.code}</span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-teal-800">{def.formula}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {def.unit}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[10px]">{def.source}</td>
                      <td className="py-3 text-slate-600 max-w-xs">{def.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUB-TAB: SECURITY AUDIT TRAIL */}
      {/* ========================================================================= */}
      {subTab === 'audit_trail' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700" />
                <span>Journal d&apos;Audit Sécurité & Traçabilité des Actions Administratives</span>
              </h3>
              <p className="text-xs text-slate-500">
                Immuabilité des modifications, détection d&apos;adresses IP et inspection du diff d&apos;état (avant / après).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filtrer action..."
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entité Ciblée</th>
                  <th className="pb-3">Administrateur</th>
                  <th className="pb-3">Adresse IP</th>
                  <th className="pb-3">Date & Heure</th>
                  <th className="pb-3 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs
                  .filter((log) => !auditFilterAction || log.action.toLowerCase().includes(auditFilterAction.toLowerCase()))
                  .slice(0, 30)
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">
                        {log.entityType} <span className="text-slate-400 text-[10px]">({log.entityId})</span>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">{log.adminEmail}</td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{log.ip || '127.0.0.1'}</td>
                      <td className="py-3 text-slate-500">{new Date(log.createdAt || log.timestamp).toLocaleString('fr-FR')}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedAuditLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                        >
                          Diff
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Modal Diff Inspector */}
          {selectedAuditLog && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">ID : {selectedAuditLog.id}</span>
                    <h4 className="text-sm font-bold text-slate-900">Inspection Diff : {selectedAuditLog.action}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAuditLog(null)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">État Avant :</span>
                    <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[10px] overflow-x-auto max-h-48 text-slate-700">
                      {JSON.stringify(selectedAuditLog.before || { status: 'INITIAL' }, null, 2)}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-teal-700 uppercase text-[10px]">État Après :</span>
                    <pre className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 font-mono text-[10px] overflow-x-auto max-h-48 text-teal-900">
                      {JSON.stringify(selectedAuditLog.after || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAuditLog(null)}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
