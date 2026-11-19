import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  Search,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ShopOrder, ShopOrderStatus } from '../../types/entities';
import { PartnerFinanceView } from './PartnerFinanceView';

export const PartnerShopOrdersView: React.FC = () => {
  const { token, user } = useAuth();
  const [partnerSubTab, setPartnerSubTab] = useState<'orders' | 'finance'>('orders');

  // Selected shop for simulation / management
  const [selectedShopId, setSelectedShopId] = useState<string>('shop_nexus_paris');
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeModalOrder, setActiveModalOrder] = useState<ShopOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [carrierName, setCarrierName] = useState<string>('Colissimo');
  const [actionNote, setActionNote] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const demoShops = [
    { id: 'shop_nexus_paris', name: 'Nexus Botanics Lab Paris' },
    { id: 'shop_alpes_annecy', name: 'Herboristerie des Alpes' },
    { id: 'shop_mediterranee_marseille', name: 'Phytothérapie Méditerranéenne' },
  ];

  const fetchShopOrders = async () => {
    if (!token || !selectedShopId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/marketplace/partner/shops/${selectedShopId}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error loading shop orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrders();
  }, [selectedShopId, token]);

  const handleUpdateStatus = async (orderId: string, newStatus: ShopOrderStatus, extra?: any) => {
    if (!token) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/marketplace/partner/shops/${selectedShopId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: extra?.trackingNumber,
          carrierName: extra?.carrierName,
          note: extra?.note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de la mise à jour.');
      } else {
        setNotification(`Statut de la commande mis à jour : ${newStatus}`);
        setTimeout(() => setNotification(null), 3000);
        setActiveModalOrder(null);
        fetchShopOrders();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  // KPIs for this shop
  const totalSubtotal = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalNet = orders.reduce((sum, o) => sum + o.shopNetAmount, 0);
  const totalCommission = orders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'ACCEPTED').length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Shop Selector */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 text-xs font-semibold mb-2">
            <Store className="w-3.5 h-3.5 text-teal-700" />
            <span>Console Partenaire Vendeur</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Espace Expédition & Préparation Boutique</h2>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            Gestion unifiée des commandes attribuées à votre boutique, transmission de tracking et validation des retraits.
          </p>
        </div>

        {/* Shop Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-teal-500"
          >
            {demoShops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchShopOrders}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Navigation: Orders vs Finance */}
      <div className="flex border-b border-slate-200 gap-2 text-xs font-bold text-slate-500 pb-1">
        <button
          onClick={() => setPartnerSubTab('orders')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            partnerSubTab === 'orders'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Commandes & Expéditions ({orders.length})</span>
        </button>

        <button
          onClick={() => setPartnerSubTab('finance')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            partnerSubTab === 'finance'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Finances, Grand Livre & Reversements (Module 10)</span>
        </button>
      </div>

      {partnerSubTab === 'finance' ? (
        <PartnerFinanceView />
      ) : (
        <>
          {notification && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
          )}

      {/* KPI Cards for Selected Shop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold block">Sous-commandes</span>
          <div className="text-2xl font-black text-slate-900">{orders.length}</div>
          <div className="text-[11px] text-amber-700 font-semibold">{pendingCount} en attente de traitement</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold block">Chiffre d&apos;Affaires Brut</span>
          <div className="text-2xl font-black text-slate-900">{totalSubtotal.toFixed(2)} €</div>
          <div className="text-[11px] text-slate-400">Total hors frais plateforme</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold block">Reversé Net Boutique</span>
          <div className="text-2xl font-black text-emerald-800">{totalNet.toFixed(2)} €</div>
          <div className="text-[11px] text-emerald-600 font-medium">Reversé directement</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-bold block">Commission Nexus (6%)</span>
          <div className="text-2xl font-black text-slate-700">{totalCommission.toFixed(2)} €</div>
          <div className="text-[11px] text-slate-400">Frais d&apos;infrastructure & tiers payeur</div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {['ALL', 'PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'SHIPPED', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === st
                ? 'bg-teal-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {st === 'ALL' ? 'Toutes' : st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Chargement des commandes de la boutique...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <Package className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Aucune commande trouvée</h3>
          <p className="text-xs text-slate-500">Les nouvelles commandes apparaîtront ici dès que les clients passent commande.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                    #
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{order.orderNumber}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 text-[11px] font-bold border border-teal-200">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Rattachée à {order.globalOrderNumber} • {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">
                    Net boutique : {order.shopNetAmount.toFixed(2)} €
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Brut : {(order.subtotal + order.deliveryFee).toFixed(2)} € (Com. {order.commissionAmount.toFixed(2)} €)
                  </div>
                </div>
              </div>

              {/* Fulfillment & Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mode de mise à disposition</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    {order.fulfillmentMethod === 'PICKUP' ? (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Retrait Express au comptoir
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-teal-600" /> Expédition Colis à domicile
                      </>
                    )}
                  </div>
                  {order.trackingNumber && (
                    <div className="text-[11px] text-teal-900 mt-1">
                      Suivi : <strong>{order.trackingNumber}</strong> ({order.carrierName || 'Transporteur'})
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Instructions client</span>
                  <div className="text-slate-700 italic mt-0.5">
                    {order.customerNote || 'Aucune consigne particulière.'}
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600">Articles à préparer :</span>
                  <div className="space-y-1">
                    {order.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex justify-between text-xs p-2 rounded-lg bg-slate-50/50 border border-slate-100"
                      >
                        <span className="font-medium text-slate-800">
                          <strong>{it.quantity}x</strong> {it.productName}
                        </span>
                        <span className="font-semibold text-slate-700">{it.subtotal.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons for Dispatch Progression */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                    disabled={processing}
                    className="px-3 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition cursor-pointer"
                  >
                    Accepter la commande
                  </button>
                )}

                {order.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                    disabled={processing}
                    className="px-3 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
                  >
                    Marquer en préparation
                  </button>
                )}

                {order.status === 'PROCESSING' && order.fulfillmentMethod === 'PICKUP' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'READY')}
                    disabled={processing}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
                  >
                    Prêt pour retrait au comptoir
                  </button>
                )}

                {order.status === 'PROCESSING' && order.fulfillmentMethod === 'DELIVERY' && (
                  <button
                    onClick={() => {
                      setActiveModalOrder(order);
                      setTrackingNumber(order.trackingNumber || '');
                    }}
                    disabled={processing}
                    className="px-3 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Expédier avec numéro de suivi</span>
                  </button>
                )}

                {(order.status === 'READY' || order.status === 'SHIPPED') && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                    disabled={processing}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    Marquer livrée / Clôturer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to input tracking information */}
      {activeModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Expédition Commande {activeModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Renseignez les détails d&apos;acheminement. Le client recevra immédiatement son numéro de suivi.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transporteur</label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800"
                >
                  <option value="Colissimo">La Poste - Colissimo Suivi</option>
                  <option value="Chronopost">Chronopost Express 24h</option>
                  <option value="Mondial Relay">Mondial Relay Point Retrait</option>
                  <option value="Coursier Express">Coursier Vélo Urbain</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Numéro de suivi colis</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : 8R987654321FR"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note pour le client (optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex : Colis remis au transporteur à 14h30."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!trackingNumber.trim()) {
                    alert('Veuillez renseigner le numéro de suivi.');
                    return;
                  }
                  handleUpdateStatus(activeModalOrder.id, 'SHIPPED', {
                    trackingNumber,
                    carrierName,
                    note: actionNote || `Expédié via ${carrierName} (Suivi: ${trackingNumber})`,
                  });
                }}
                disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition"
              >
                Confirmer l&apos;expédition
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
