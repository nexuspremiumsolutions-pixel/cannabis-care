import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  Package,
  Clock,
  CheckCircle2,
  ChevronRight,
  Store,
  Truck,
  MapPin,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { GlobalOrder } from '../../types/entities';
import { OrderDetailModal } from './OrderDetailModal';

export const CustomerOrdersView: React.FC = () => {
  const { token } = useAuth();
  const { openCartDrawer } = useCart();
  const [orders, setOrders] = useState<GlobalOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/marketplace/orders/my-orders', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching customer orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return { label: 'En attente de prise en charge', color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'PROCESSING':
        return { label: 'En cours de préparation', color: 'bg-blue-50 text-blue-900 border-blue-200' };
      case 'PARTIALLY_READY':
        return { label: 'Partiellement expédié / prêt', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
      case 'READY':
        return { label: 'Prêt pour retrait / En cours d’acheminement', color: 'bg-teal-50 text-teal-900 border-teal-200' };
      case 'COMPLETED':
        return { label: 'Livrée & Clôturée', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Annulée', color: 'bg-rose-50 text-rose-900 border-rose-200' };
      default:
        return { label: status, color: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5 text-teal-700" />
            <span>Suivi Multi-Boutiques Décentralisé</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Mes Commandes & Expéditions</h2>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            Suivi temps réel de chaque sous-commande confiée aux boutiques et laboratoires phytocannabiques certifiés du réseau Nexus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Rafraîchir les statuts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Chargement de vos commandes...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Aucune commande enregistrée</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Commandez directement auprès de nos boutiques certifiées pour retrouver ici l&apos;état d&apos;avancement et vos numéros de suivi.
            </p>
          </div>
          <button
            onClick={openCartDrawer}
            className="px-5 py-2.5 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition shadow-xs cursor-pointer"
          >
            Consulter mon panier
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition cursor-pointer space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-xs">
                      CC
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{order.orderNumber}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-teal-900">{order.grandTotal.toFixed(2)} €</div>
                    <div className="text-[11px] text-slate-400">
                      {order.shopOrdersCount} sous-commande(s) boutique
                    </div>
                  </div>
                </div>

                {/* Sub-orders Summary Chips */}
                <div className="flex flex-wrap items-center gap-2">
                  {order.shopOrdersSummary?.map((so) => (
                    <div
                      key={so.shopOrderId}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2"
                    >
                      <Store className="w-3.5 h-3.5 text-teal-700" />
                      <span className="font-bold text-slate-800">{so.shopName}</span>
                      <span className="text-slate-400 text-[11px]">({so.fulfillmentMethod === 'PICKUP' ? 'Retrait' : 'Colis'})</span>
                      <span className="font-semibold text-teal-900">{so.status}</span>
                    </div>
                  ))}
                </div>

                {/* Card Action Link */}
                <div className="flex items-center justify-between text-xs text-teal-800 font-bold pt-1">
                  <span>Voir le détail & les numéros de suivi</span>
                  <ChevronRight className="w-4 h-4 text-teal-700" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={fetchOrders}
        />
      )}
    </div>
  );
};
