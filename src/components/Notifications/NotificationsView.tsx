import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sliders,
  Users,
  Cpu,
  Mail,
  Smartphone,
  MessageSquare,
  Package,
  CreditCard,
  Gift,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lock,
  Archive,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import {
  Notification,
  NotificationCategory,
  CRMProfile,
  CRMSegment,
  CommunicationWorkflow,
  CommunicationAnalyticsOverview,
  ProviderStatusInfo,
} from '../../types/entities';

export const NotificationsView: React.FC<{
  onNavigateTab?: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<'INBOX' | 'PREFERENCES' | 'CRM' | 'WORKFLOWS'>(
    'INBOX'
  );

  // Inbox state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  // CRM state
  const [crmProfiles, setCrmProfiles] = useState<CRMProfile[]>([]);
  const [crmSegments, setCrmSegments] = useState<CRMSegment[]>([]);
  const [crmSearch, setCrmSearch] = useState<string>('');
  const [loadingCRM, setLoadingCRM] = useState<boolean>(false);

  // Workflows & Providers state
  const [workflows, setWorkflows] = useState<CommunicationWorkflow[]>([]);
  const [providers, setProviders] = useState<ProviderStatusInfo[]>([]);
  const [analytics, setAnalytics] = useState<CommunicationAnalyticsOverview | null>(null);
  const [loadingWorkflows, setLoadingWorkflows] = useState<boolean>(false);

  // 1. Fetch Inbox Notifications
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch('/api/notifications?limit=100');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // 2. Fetch CRM Data
  const loadCRMData = async () => {
    setLoadingCRM(true);
    try {
      const [profilesRes, segmentsRes] = await Promise.all([
        fetch(`/api/communication/crm/profiles${crmSearch ? `?search=${encodeURIComponent(crmSearch)}` : ''}`),
        fetch('/api/communication/crm/segments'),
      ]);
      const profilesData = await profilesRes.json();
      const segmentsData = await segmentsRes.json();
      if (profilesData.success) setCrmProfiles(profilesData.profiles || []);
      if (segmentsData.success) setCrmSegments(segmentsData.segments || []);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    } finally {
      setLoadingCRM(false);
    }
  };

  // 3. Fetch Workflows & Analytics
  const loadWorkflowsAndAnalytics = async () => {
    setLoadingWorkflows(true);
    try {
      const [wfRes, provRes, anaRes] = await Promise.all([
        fetch('/api/communication/workflows'),
        fetch('/api/communication/providers'),
        fetch('/api/communication/analytics'),
      ]);
      const wfData = await wfRes.json();
      const provData = await provRes.json();
      const anaData = await anaRes.json();
      if (wfData.success) setWorkflows(wfData.workflows || []);
      if (provData.success) setProviders(provData.providers || []);
      if (anaData.success) setAnalytics(anaData.analytics || null);
    } catch (err) {
      console.error('Error loading workflow metrics:', err);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'INBOX') loadNotifications();
    if (activeSubTab === 'CRM') loadCRMData();
    if (activeSubTab === 'WORKFLOWS') loadWorkflowsAndAnalytics();
  }, [activeSubTab]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true, status: 'READ' } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, status: 'READ' })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/archive`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
    if (statusFilter === 'UNREAD' && n.isRead) return false;
    if (statusFilter === 'READ' && !n.isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchBody = (n.body || n.message || '').toLowerCase().includes(q);
      if (!matchTitle && !matchBody) return false;
    }
    return true;
  });

  const getCategoryIcon = (category?: NotificationCategory) => {
    switch (category) {
      case 'ORDER':
        return <Package className="w-4 h-4 text-indigo-600" />;
      case 'DELIVERY':
        return <Package className="w-4 h-4 text-teal-600" />;
      case 'PAYMENT':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'LOYALTY':
        return <Gift className="w-4 h-4 text-amber-600" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'SUBSCRIPTION':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-teal-800 text-white shadow-xs">
            <Bell className="w-6 h-6 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Module 16 • Nexus Communications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-extrabold">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Centre de Communications, CRM & Automatisations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Notifications in-app, routage omnicanal, consentement RGPD et marketing automatisé.
            </p>
          </div>
        </div>

        {/* Sub-tabs selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('INBOX')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'INBOX'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-teal-700" />
            <span>Boîte de Réception</span>
          </button>
          <button
            onClick={() => setActiveSubTab('CRM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'CRM'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-700" />
            <span>CRM & Segments</span>
          </button>
          <button
            onClick={() => setActiveSubTab('WORKFLOWS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'WORKFLOWS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-700" />
            <span>Workflows & Délivrabilité</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TAB: INBOX NOTIFICATIONS                                   */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'INBOX' && (
        <div className="space-y-4">
          {/* Controls toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher une alerte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="ALL">Tous les états</option>
                <option value="UNREAD">Non lues uniquement</option>
                <option value="READ">Lues</option>
              </select>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-1">
              {[
                { key: 'ALL', label: 'Toutes' },
                { key: 'ORDER', label: 'Commandes' },
                { key: 'DELIVERY', label: 'Livraison' },
                { key: 'PAYMENT', label: 'Paiements' },
                { key: 'LOYALTY', label: 'Fidélité' },
                { key: 'SUBSCRIPTION', label: 'Abonnements' },
                { key: 'SECURITY', label: 'Sécurité' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategoryFilter(c.key)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] shrink-0 transition cursor-pointer ${
                    categoryFilter === c.key
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-[11px] shrink-0 transition cursor-pointer flex items-center gap-1 border border-teal-200"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tout marquer lu</span>
                </button>
              )}
            </div>
          </div>

          {/* Notifications Card List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {loadingNotifications ? (
              <div className="p-12 text-center text-xs text-slate-400">Chargement de la boîte de réception...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Aucune notification trouvée</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Aucun message ne correspond aux critères de filtre sélectionnés.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <div
                    key={notif.id}
                    className={`p-4 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isUnread ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-bold truncate ${
                              isUnread ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </h3>
                          {isUnread && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[9px] font-extrabold uppercase">
                              Nouveau
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.body || notif.message}
                        </p>
                        {notif.deepLink && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                if (onNavigateTab && notif.deepLink) {
                                  const targetTab = notif.deepLink.replace(/^\//, '').split('/')[0];
                                  onNavigateTab(targetTab);
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
                            >
                              <span>Consulter la page associée</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions on notification */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                        >
                          Marquer lu
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(notif.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Archiver"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(notif.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TAB: CRM & SEGMENTATION                                    */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'CRM' && (
        <div className="space-y-6">
          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-teal-950">
                Segmentation CRM & Données de Santé : Cloisonnement Garanti
              </h4>
              <p className="text-teal-900/80 leading-relaxed">
                Le ciblage marketing s'appuie <strong>exclusivement</strong> sur l'activité commerciale (commandes passées, statuts d'abonnement, points fidélité et consentements explicites). Les données déclaratives de santé, profils THC/CBD et journaux de consommation sont <strong>strictement inaccessibles</strong> à des fins promotionnelles.
              </p>
            </div>
          </div>

          {/* CRM Profiles Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  Profils Clients Unifiés ({crmProfiles.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Vue consolidée des adhérents, dépenses, abonnements et éligibilité aux canaux.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filtrer par email ou nom..."
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Adhérent</th>
                    <th className="py-2.5 px-3">Cycle de Vie</th>
                    <th className="py-2.5 px-3">Commandes</th>
                    <th className="py-2.5 px-3">Total Dépensé</th>
                    <th className="py-2.5 px-3">Fidélité</th>
                    <th className="py-2.5 px-3">Abonnement</th>
                    <th className="py-2.5 px-3">Canaux Autorisés</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingCRM ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Chargement des profils CRM...
                      </td>
                    </tr>
                  ) : crmProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Aucun profil trouvé
                      </td>
                    </tr>
                  ) : (
                    crmProfiles.map((p) => (
                      <tr key={p.userId} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{p.fullName}</p>
                          <p className="text-[11px] text-slate-400">{p.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.lifecycleStage === 'SUBSCRIBER'
                                ? 'bg-purple-100 text-purple-800'
                                : p.lifecycleStage === 'CUSTOMER'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.lifecycleStage === 'PARTNER_STAFF'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.lifecycleStage}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">{p.totalPurchasesCount}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {p.totalSpent.toFixed(2)} €
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-amber-700">{p.loyaltyLevel}</p>
                          <p className="text-[10px] text-slate-400">{p.loyaltyPoints} pts</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[11px] font-semibold ${
                              p.subscriptionStatus === 'ACTIVE'
                                ? 'text-teal-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {p.subscriptionStatus === 'ACTIVE' ? 'Actif' : 'Aucun'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              title="Marketing E-mail"
                              className={`p-1 rounded-md text-[10px] font-bold ${
                                p.communicationEligibility.canReceiveMarketing
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              Email
                            </span>
                            <span
                              title="Notification Push"
                              className={`p-1 rounded-md text-[10px] font-bold ${
                                p.communicationEligibility.canReceivePush
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              Push
                            </span>
                            <span
                              title="SMS"
                              className={`p-1 rounded-md text-[10px] font-bold ${
                                p.communicationEligibility.canReceiveSms
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              SMS
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audience Segments Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-700" />
                  Segments d'Audience Conformes RGPD ({crmSegments.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Audiences dynamiques calculées sans ciblage intrusif.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {crmSegments.map((seg) => (
                <div
                  key={seg.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-teal-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{seg.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                      {seg.memberCount} membres
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{seg.description}</p>
                  <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-400 space-y-0.5">
                    <p className="font-semibold text-slate-600">Règles actives :</p>
                    {seg.rules.map((r, idx) => (
                      <p key={idx} className="font-mono bg-white px-1.5 py-0.5 rounded-sm border border-slate-200">
                        {r.field} {r.operator} {String(r.value)}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. TAB: WORKFLOWS & DELIVERABILITY                             */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'WORKFLOWS' && (
        <div className="space-y-6">
          {/* Analytics Overview Cards */}
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Taux de Délivrabilité</p>
                <p className="text-xl font-black text-slate-900">{analytics.deliveryRate}%</p>
                <p className="text-[10px] text-slate-400">
                  {analytics.totalDelivered} distribués / {analytics.totalDelivered + analytics.totalFailed} total
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Taux d'Ouverture</p>
                <p className="text-xl font-black text-teal-700">{analytics.openRate}%</p>
                <p className="text-[10px] text-slate-400">{analytics.totalOpened} consultations</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Taux de Clic (CTR)</p>
                <p className="text-xl font-black text-indigo-700">{analytics.clickRate}%</p>
                <p className="text-[10px] text-slate-400">{analytics.totalClicked} clics traçés</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Chiffre d'Affaires Attribué</p>
                <p className="text-xl font-black text-emerald-700">
                  {analytics.attributedRevenueAmount.toFixed(2)} €
                </p>
                <p className="text-[10px] text-slate-400">
                  {analytics.attributedConversionsCount} conversions
                </p>
              </div>
            </div>
          )}

          {/* Providers Real Status (Honest declaration, no deceptive mock green) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-700" />
                Statut Réel des Fournisseurs de Communication
              </h3>
              <p className="text-xs text-slate-500">
                Détection transparente de l'infrastructure configurée (aucun faux succès simulé).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {providers.map((p) => {
                const isReady = p.isConfigured;
                return (
                  <div
                    key={p.channel}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2 ${
                      isReady ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{p.channel}</span>
                      {isReady ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-slate-700">{p.providerName}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{p.statusMessage}</p>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase self-start ${
                        isReady
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isReady ? 'Prêt en production' : 'Configuration requise'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automated Workflows List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  Workflows & Automatisations Actives ({workflows.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Scénarios déclenchés par les événements de commandes, livraison, fidélité et abonnements.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {workflows.map((wf) => (
                <div key={wf.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{wf.name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {wf.status}
                      </span>
                      {wf.requiresMarketingConsent && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                          Consentement requis
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{wf.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>Déclencheur : <strong className="text-slate-600">{wf.triggerEvent}</strong></span>
                      <span>Canaux : <strong className="text-slate-600">{wf.channels.join(', ')}</strong></span>
                      <span>Délai : <strong className="text-slate-600">{wf.delayMinutes} min</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">{wf.executionsCount || 0}</p>
                    <p className="text-[10px] text-slate-400">exécutions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
