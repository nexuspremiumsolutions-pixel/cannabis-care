import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Users, Activity, Store, Database, Lock, Eye, AlertCircle, Truck, DollarSign, Package, BarChart3 } from 'lucide-react';
import { PartnerLogisticsTab } from '../Logistics/PartnerLogisticsTab';
import { AdminLogisticsTab } from '../Logistics/AdminLogisticsTab';
import { AdminFinanceView } from './AdminFinanceView';
import { AdminLoyaltyView } from './AdminLoyaltyView';
import { AdminSubscriptionTab } from './AdminSubscriptionTab';
import { AdminCentralAnalyticsView } from './AdminCentralAnalyticsView';
import { AdminSecurityComplianceView } from './AdminSecurityComplianceView';
import { AdminShopsSupervisionView } from '../PartnerStorefront/AdminShopsSupervisionView';
import { PartnerDashboardView } from '../PartnerStorefront/PartnerDashboardView';
import { Gift, Sparkles, ShieldCheck } from 'lucide-react';

export const AdminView: React.FC = () => {
  const { token, user } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'analytics_central'
    | 'security_compliance'
    | 'overview'
    | 'shops_supervision'
    | 'partner_storefront'
    | 'partner_logistics'
    | 'admin_logistics'
    | 'finance'
    | 'loyalty'
    | 'subscriptions'
  >('analytics_central');
  const [metrics, setMetrics] = useState<any | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [resM, resU] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resM.ok) {
        const data = await resM.json();
        setMetrics(data.metrics);
        setRecentLogs(data.recentLogs || []);
      }
      if (resU.ok) {
        const data = await resU.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-fit">
        <button
          type="button"
          onClick={() => setActiveAdminTab('analytics_central')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'analytics_central'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
          <span>Pilotage & Analytics Globaux (M17)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('security_compliance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'security_compliance'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>Sécurité, RGPD & Readiness (M18)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-teal-700" />
          <span>Supervision & Audits</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('shops_supervision')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'shops_supervision'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-emerald-700" />
          <span>Supervision Boutiques Partenaires (M9)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('partner_storefront')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'partner_storefront'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-teal-700" />
          <span>Gestion Boutique & Catalogue (M9)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('partner_logistics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'partner_logistics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-emerald-700" />
          <span>Console Logistique Partenaire (M11)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('admin_logistics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'admin_logistics'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-teal-700" />
          <span>Transporteurs & Zones (M11)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('finance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'finance'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-indigo-700" />
          <span>Finances & Payouts (M10)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('loyalty')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'loyalty'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-600" />
          <span>Fidélité & Récompenses (M12)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('subscriptions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeAdminTab === 'subscriptions'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Abonnements & MRR (M13)</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeAdminTab === 'analytics_central' && <AdminCentralAnalyticsView />}
      {activeAdminTab === 'security_compliance' && <AdminSecurityComplianceView />}
      {activeAdminTab === 'shops_supervision' && <AdminShopsSupervisionView />}
      {activeAdminTab === 'partner_storefront' && <PartnerDashboardView />}
      {activeAdminTab === 'partner_logistics' && <PartnerLogisticsTab />}
      {activeAdminTab === 'admin_logistics' && <AdminLogisticsTab />}
      {activeAdminTab === 'finance' && <AdminFinanceView />}
      {activeAdminTab === 'loyalty' && <AdminLoyaltyView />}
      {activeAdminTab === 'subscriptions' && <AdminSubscriptionTab />}

      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Console d&apos;Administration Sécurisée — Nexus Premium Solutions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Supervision Globale & Traçabilité</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Supervision de l&apos;activité, conformité RGPD, gestion des rôles et consultation du registre des audits système.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Utilisateurs</span>
              <p className="text-2xl font-black text-slate-900">{metrics?.totalUsers || 0}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-teal-700 uppercase">Parcours THC</span>
              <p className="text-2xl font-black text-teal-800">{metrics?.thcCount || 0}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Parcours CBD</span>
              <p className="text-2xl font-black text-emerald-800">{metrics?.cbdCount || 0}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 uppercase">Entrées Journal</span>
              <p className="text-2xl font-black text-indigo-800">{metrics?.totalJournalEntries || 0}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Boutiques</span>
              <p className="text-2xl font-black text-amber-800">{metrics?.totalStores || 0}</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Logs Audit</span>
              <p className="text-2xl font-black text-slate-900">{metrics?.totalAuditLogs || 0}</p>
            </div>
          </div>

          {/* Users Directory */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>Répertoire des Utilisateurs Enregistrés ({usersList.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Utilisateur</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Parcours</th>
                    <th className="pb-3">Rôle</th>
                    <th className="pb-3">Créé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">{u.nickname}</td>
                      <td className="py-3 text-slate-500">{u.email}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.profileType === 'THC'
                              ? 'bg-teal-100 text-teal-900'
                              : u.profileType === 'CBD'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.profileType}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-800 text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-Time Audit Logs */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Registre d&apos;Audit Sécurité & RGPD (Dernières Actions)</span>
            </h3>

            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 font-mono font-bold text-[10px] text-slate-800">
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-medium">Table : {log.resource}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
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
