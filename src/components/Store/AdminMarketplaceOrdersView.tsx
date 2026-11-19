import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Store,
  Truck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { GlobalOrder } from '../../types/entities';
import { OrderDetailModal } from './OrderDetailModal';

export const AdminMarketplaceOrdersView: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<GlobalOrder[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [multiShopOnly, setMultiShopOnly] = useState<boolean>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [resOrders, resMetrics] = await Promise.all([
        fetch(
          `/api/marketplace/admin/orders?status=${statusFilter}&search=${encodeURIComponent(
            search
          )}&multiShopOnly=${multiShopOnly}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch('/api/marketplace/admin/orders/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resOrders.ok) {
        const d = await resOrders.json();
        setOrders(d.orders || []);
      }
      if (resMetrics.ok) {
        const m = await resMetrics.json();
        setMetrics(m.metrics || null);
      }
    } catch (e) {
      console.error('Error loading admin orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter, multiShopOnly, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Supervision Centrale Nexus Marketplace</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Supervision Commandes & Commissions Décentralisées
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            Audit en temps réel des transactions globales, dispatch des sous-commandes partenaires et redistribution des commissions plateforme (6%).
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
        </button>
      </div>

      {/* KPI Metrics Dashboard */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 font-bold block">Volume d&apos;Affaires (GMV)</span>
            <div className="text-2xl font-black text-slate-900">{metrics.gmvTotal.toFixed(2)} €</div>
            <div className="text-[11px] text-teal-800 font-medium">Panier moyen : {metrics.averageBasket.toFixed(2)} €</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 font-bold block">Commissions Nexus Encaissées</span>
            <div className="text-2xl font-black text-teal-800">{metrics.commissionTotal.toFixed(2)} €</div>
            <div className="text-[11px] text-emerald-700 font-semibold">Taux plateforme 6% actif</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 font-bold block">Reversements Boutiques Nets</span>
            <div className="text-2xl font-black text-slate-800">{metrics.shopNetTotal.toFixed(2)} €</div>
            <div className="text-[11px] text-slate-400">Total reversé aux partenaires</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 font-bold block">Commandes & Dispatch</span>
            <div className="text-2xl font-black text-slate-900">{metrics.totalGlobalOrders}</div>
            <div className="text-[11px] text-indigo-700 font-medium">
              {metrics.multiShopOrdersCount} commandes multi-boutiques
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par numéro (#NEXUS-...), client ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Filtrer
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
            <input
              type="checkbox"
              checked={multiShopOnly}
              onChange={(e) => setMultiShopOnly(e.target.checked)}
              className="rounded-sm border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Multi-boutiques uniquement</span>
          </label>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PAID">Payée (Attente)</option>
            <option value="PROCESSING">En préparation</option>
            <option value="PARTIALLY_READY">Partiellement prête</option>
            <option value="READY">Prête / En livraison</option>
            <option value="COMPLETED">Terminée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-4">Réf. Commande</th>
                <th className="p-4">Client</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Boutiques</th>
                <th className="p-4">Total Client</th>
                <th className="p-4">Com. Nexus (6%)</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Aucune commande ne correspond aux critères.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-black text-slate-900">{o.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{o.customerName}</div>
                      <div className="text-[11px] text-slate-400">{o.customerEmail}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-900 font-bold border border-teal-200 text-[10px]">
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-semibold">{o.shopOrdersCount} boutique(s)</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {o.shopOrdersSummary?.map((s) => s.shopName).join(', ')}
                      </div>
                    </td>
                    <td className="p-4 font-black text-slate-900">{o.grandTotal.toFixed(2)} €</td>
                    <td className="p-4 font-bold text-teal-800">+{o.commissionTotal.toFixed(2)} €</td>
                    <td className="p-4 text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrderId(o.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                      >
                        Inspecter
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={fetchAdminData}
        />
      )}
    </div>
  );
};
