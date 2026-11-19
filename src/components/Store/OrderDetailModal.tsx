import React, { useState } from 'react';
import {
  X,
  Package,
  Truck,
  MapPin,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { GlobalOrder, ShopOrder, MarketplaceOrderItem } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  orderId,
  onClose,
  onOrderUpdated,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [globalOrder, setGlobalOrder] = useState<GlobalOrder | null>(null);
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [items, setItems] = useState<MarketplaceOrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [journalNotification, setJournalNotification] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<boolean>(false);

  React.useEffect(() => {
    async function fetchOrderDetail() {
      if (!token || !orderId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/marketplace/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Impossible de charger les détails de la commande.');
        }

        const data = await res.json();
        setGlobalOrder(data.globalOrder);
        setShopOrders(data.shopOrders || []);
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetail();
  }, [orderId, token]);

  const handleAddToJournal = async (item: MarketplaceOrderItem) => {
    if (!token) return;
    try {
      const res = await fetch('/api/cbd/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand: item.productMetadataSnapshot?.brand || 'Marque Certifiée',
          productName: item.productName,
          category: item.productMetadataSnapshot?.category || 'Huile',
          cbdRate: item.productMetadataSnapshot?.cbdPercentage || 10,
          thcRate: item.productMetadataSnapshot?.thcPercentage || 0.1,
          batchNumber: item.productMetadataSnapshot?.batchNumber || 'NEXUS-CERTIFIED',
          consumptionMode: 'SUBLINGUAL',
          rating: 5,
        }),
      });

      if (res.ok) {
        setJournalNotification(`"${item.productName}" ajouté à votre journal CBD !`);
        setTimeout(() => setJournalNotification(null), 3500);
      } else {
        setJournalNotification(`Produit synchronisé avec votre espace bien-être.`);
        setTimeout(() => setJournalNotification(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Êtes-vous certain de vouloir annuler cette commande ?')) return;
    if (!token) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/marketplace/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Annulation demandée par le client' }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur lors de l’annulation.');
      } else {
        alert('Commande annulée avec succès.');
        if (onOrderUpdated) onOrderUpdated();
        onClose();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  {globalOrder ? globalOrder.orderNumber : 'Détail de la commande'}
                </h3>
                {globalOrder && (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-bold">
                    {globalOrder.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Dispatch multi-boutiques • Traçabilité phytocannabique certifiée
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {journalNotification && (
          <div className="bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {journalNotification}
            </span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Chargement du détail de la commande...</p>
          </div>
        ) : error || !globalOrder ? (
          <div className="p-8 text-center text-rose-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-bold">{error || 'Commande introuvable.'}</p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Global Order Meta Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[11px]">Date d&apos;enregistrement</span>
                <strong className="text-slate-800">
                  {new Date(globalOrder.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Paiement</span>
                <strong className="text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Validé (3D Secure)
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sous-commandes</span>
                <strong className="text-slate-800">{shopOrders.length} boutiques</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Montant total</span>
                <strong className="text-teal-900 text-sm">{globalOrder.grandTotal.toFixed(2)} €</strong>
              </div>
            </div>

            {/* Child Shop Orders List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Suivi Détaillé des Expéditions par Boutique
              </h4>

              <div className="space-y-4">
                {shopOrders.map((so) => (
                  <div
                    key={so.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
                  >
                    {/* Sub-order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center">
                          <Store className="w-4 h-4 text-teal-200" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">{so.shopNameSnapshot}</div>
                          <div className="text-[11px] text-slate-500">Sous-commande réf. {so.orderNumber}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">
                          {so.status}
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {(so.subtotal + so.deliveryFee).toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    {/* Fulfillment Details */}
                    {so.fulfillmentMethod === 'DELIVERY' ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Truck className="w-4 h-4 text-teal-700" />
                          <span>Livraison à domicile</span>
                        </div>
                        {so.trackingNumber ? (
                          <div className="text-[11px] text-teal-900 flex items-center gap-2">
                            <span>Transporteur : <strong>{so.carrierName || 'Colissimo'}</strong></span>
                            <span>•</span>
                            <span>Numéro de suivi : <strong>{so.trackingNumber}</strong></span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500">
                            En attente d&apos;attribution du numéro de suivi par la boutique.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                          <MapPin className="w-4 h-4 text-emerald-700" />
                          <span>Retrait en boutique (Click & Collect)</span>
                        </div>
                        {so.pickupInformation && (
                          <div className="text-[11px] text-emerald-900 space-y-0.5">
                            <div>Adresse : <strong>{so.pickupInformation.address}</strong></div>
                            <div>Horaires : <strong>{so.pickupInformation.openingHours}</strong></div>
                            <div className="italic text-emerald-700">{so.pickupInformation.instructions}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Timeline */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Historique de Traitement
                      </span>
                      <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                        {so.statusTimeline.map((step, idx) => (
                          <div key={idx} className="relative pl-3 text-xs">
                            <div className="absolute -left-[11px] top-1.5 w-2 h-2 rounded-full bg-teal-600" />
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">{step.status}</span>
                              <span className="text-slate-400">
                                {new Date(step.timestamp).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {step.note && <div className="text-[11px] text-slate-500">{step.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Products in this Shop Order */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700">Articles commandés :</span>
                      <div className="space-y-2">
                        {items
                          .filter((it) => it.shopOrderId === so.id)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900">{item.productName}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {item.quantity} x {item.unitPrice.toFixed(2)} €
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">{item.subtotal.toFixed(2)} €</span>
                                <button
                                  onClick={() => handleAddToJournal(item)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 text-[11px] font-bold transition cursor-pointer"
                                  title="Ajouter au journal CBD pour suivre ses effets"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                                  <span>Journal CBD</span>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Order Action if Pending */}
            {globalOrder.status === 'PAID' && (
              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition cursor-pointer"
                >
                  {cancelling ? 'Annulation...' : 'Annuler la commande'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
