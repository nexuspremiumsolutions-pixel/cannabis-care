import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Package,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Store,
  MapPin,
  Clock,
} from 'lucide-react';
import { Shipment, ShipmentStatus, DeliveryIncident, ReturnRequest } from '../../types/entities';

export const PartnerLogisticsTab: React.FC = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pickup terminal state
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [pickupVerifying, setPickupVerifying] = useState(false);
  const [pickupResult, setPickupResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  // Status update modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>('SHIPPED');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('Colissimo');
  const [updateNoteInput, setUpdateNoteInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Incident resolution
  const [selectedIncident, setSelectedIncident] = useState<DeliveryIncident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Printable label preview
  const [labelShipment, setLabelShipment] = useState<Shipment | null>(null);

  const fetchPartnerOverview = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/logistics/partner/overview?shopId=shop_nexus_paris', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Impossible de charger les données logistiques partenaire.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerOverview();
  }, [token]);

  const handleVerifyPickupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCodeInput.trim() || !token) return;
    setPickupVerifying(true);
    setPickupResult(null);
    try {
      const res = await fetch('/api/logistics/partner/pickup/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId: 'shop_nexus_paris',
          pickupCode: pickupCodeInput.trim(),
        }),
      });
      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        setPickupResult({ success: false, error: resJson.error || 'Code invalide ou expiré.' });
      } else {
        setPickupResult({
          success: true,
          message: `Succès ! Le retrait pour la commande ${resJson.shopOrder?.orderNumber} a été validé. La commande est clôturée.`,
        });
        setPickupCodeInput('');
        fetchPartnerOverview();
      }
    } catch (err: any) {
      setPickupResult({ success: false, error: err.message });
    } finally {
      setPickupVerifying(false);
    }
  };

  const handleUpdateShipmentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !token) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/logistics/partner/shipments/${selectedShipment.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumberInput || undefined,
          carrierName: carrierInput || undefined,
          note: updateNoteInput || `Mise à jour statut: ${newStatus}`,
          location: 'Boutique Nexus Paris Marais',
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Erreur lors de la mise à jour.');
      }
      setSelectedShipment(null);
      setTrackingNumberInput('');
      setUpdateNoteInput('');
      fetchPartnerOverview();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !token) return;
    setIsResolving(true);
    try {
      const res = await fetch(`/api/logistics/incidents/${selectedIncident.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resolutionNotes }),
      });
      if (!res.ok) throw new Error('Erreur lors de la clôture de l’incident');
      setSelectedIncident(null);
      setResolutionNotes('');
      fetchPartnerOverview();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsResolving(false);
    }
  };

  const shipments: Shipment[] = data?.shipments || [];
  const incidents: DeliveryIncident[] = data?.incidents || [];
  const returnRequests: ReturnRequest[] = data?.returnRequests || [];
  const metrics = data?.metrics || {
    totalShipments: 0,
    readyToShip: 0,
    inTransit: 0,
    delivered: 0,
    pendingPickup: 0,
    openIncidents: 0,
  };

  const filteredShipments = shipments.filter((s) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PICKUP') return s.deliveryMethod === 'PICKUP_IN_STORE' || s.deliveryMethod === 'CLICK_AND_COLLECT';
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Store className="w-3.5 h-3.5 text-teal-400" />
            <span>Console Partenaire Vendeur • Module 11</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Gestion des Expéditions & Retraits en Boutique</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Préparez vos colis, imprimez vos bordereaux de transport, validez les retraits Click & Collect au comptoir et gérez les litiges clients.
          </p>
        </div>

        <button
          onClick={fetchPartnerOverview}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Expéditions</span>
          <p className="text-2xl font-black text-slate-900">{metrics.totalShipments}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-700 uppercase">À Préparer</span>
          <p className="text-2xl font-black text-amber-800">{metrics.readyToShip}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-teal-700 uppercase">En Transit</span>
          <p className="text-2xl font-black text-teal-800">{metrics.inTransit}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Livrés / Remis</span>
          <p className="text-2xl font-black text-emerald-800">{metrics.delivered}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-indigo-700 uppercase">Retraits Comptoir</span>
          <p className="text-2xl font-black text-indigo-800">{metrics.pendingPickup}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase">Litiges Ouverts</span>
          <p className="text-2xl font-black text-rose-800">{metrics.openIncidents}</p>
        </div>
      </div>

      {/* CLICK & COLLECT COUNTER SCAN TERMINAL */}
      <div className="bg-linear-to-r from-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black">Comptoir Express : Validation de Retrait Client (Click & Collect)</h3>
            <p className="text-xs text-slate-300">
              Saisissez le code PIN à 6 chiffres présenté par le client pour authentifier la remise en main propre.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyPickupCode} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            value={pickupCodeInput}
            onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
            placeholder="Code PIN Client (ex: NX-4821 ou NX-7842)"
            className="flex-1 px-4 py-3 rounded-2xl bg-white text-slate-900 font-mono font-bold text-base uppercase focus:outline-hidden focus:ring-2 focus:ring-teal-400 placeholder:text-slate-400 placeholder:font-normal"
          />
          <button
            type="submit"
            disabled={pickupVerifying || !pickupCodeInput.trim()}
            className="px-6 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {pickupVerifying ? 'Vérification...' : 'Valider la Remise'}
          </button>
        </form>

        {pickupResult && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              pickupResult.success ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
            }`}
          >
            {pickupResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{pickupResult.message || pickupResult.error}</span>
          </div>
        )}
      </div>

      {/* SHIPMENTS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-700" />
              <span>Bordereau des Expéditions ({filteredShipments.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Mettez à jour le statut des colis et téléchargez les étiquettes de transport.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'ALL', label: 'Tous' },
              { key: 'PENDING', label: 'En attente' },
              { key: 'PROCESSING', label: 'En prépa' },
              { key: 'READY_TO_SHIP', label: 'Prêt' },
              { key: 'SHIPPED', label: 'Expédié' },
              { key: 'DELIVERED', label: 'Livré' },
              { key: 'PICKUP', label: 'Click & Collect' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Expédition & Commande</th>
                <th className="pb-3">Destinataire</th>
                <th className="pb-3">Mode & Transporteur</th>
                <th className="pb-3">N° de Suivi</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.map((shp) => (
                <tr key={shp.id} className="hover:bg-slate-50">
                  <td className="py-3 font-mono">
                    <div className="font-bold text-slate-900">{shp.id}</div>
                    <div className="text-[10px] text-slate-400">Réf: {shp.shopOrderId}</div>
                  </td>
                  <td className="py-3">
                    <div className="font-bold text-slate-900">
                      {(shp as any).shippingAddress?.fullName || (shp as any).shippingAddress?.address || (shp.deliveryMethod === 'PICKUP_IN_STORE' ? 'Retrait Client' : 'Colis Postal')}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      {(shp as any).shippingAddress?.city ? `${(shp as any).shippingAddress.city}, ${(shp as any).shippingAddress.postalCode}` : (shp.deliveryMethod === 'PICKUP_IN_STORE' ? 'Comptoir boutique' : 'Acheminement France')}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-800 text-[10px]">
                      {shp.deliveryMethod === 'PICKUP_IN_STORE' ? 'Retrait Boutique' : (shp.carrierName || 'Colissimo')}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-800">
                    {shp.trackingNumber ? (
                      <span className="text-teal-800">{shp.trackingNumber}</span>
                    ) : (
                      <span className="text-slate-400 italic">Non assigné</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        shp.status === 'DELIVERED' || shp.status === 'PICKED_UP'
                          ? 'bg-emerald-100 text-emerald-900'
                          : shp.status === 'SHIPPED' || shp.status === 'IN_TRANSIT'
                          ? 'bg-teal-100 text-teal-900'
                          : shp.status === 'READY_TO_SHIP' || shp.status === 'READY_FOR_PICKUP'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {shp.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLabelShipment(shp)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                        title="Imprimer bordereau"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShipment(shp);
                          setNewStatus(shp.status === 'CREATED' ? 'PROCESSING' : shp.status === 'PROCESSING' ? 'READY_TO_SHIP' : 'SHIPPED');
                          setTrackingNumberInput(shp.trackingNumber || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-[11px] transition cursor-pointer"
                      >
                        Gérer statut
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INCIDENTS & RETURNS RESOLUTION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Litiges & Anomalies Logistiques ({incidents.length})</span>
          </h3>

          <div className="space-y-3">
            {incidents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun litige ouvert actuellement.</p>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                      {inc.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-slate-700">{inc.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <span>Client: {inc.customerEmail}</span>
                    {inc.status !== 'RESOLVED' && (
                      <button
                        onClick={() => setSelectedIncident(inc)}
                        className="text-teal-800 font-bold hover:underline cursor-pointer"
                      >
                        Résoudre & Clôturer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Returns Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <span>Demandes de Retours Produits ({returnRequests.length})</span>
          </h3>

          <div className="space-y-3">
            {returnRequests.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune demande de retour enregistrée.</p>
            ) : (
              returnRequests.map((ret) => (
                <div key={ret.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{ret.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ret.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ret.status === 'APPROVED'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ret.status}
                    </span>
                  </div>
                  <p className="text-slate-700">Motif : {ret.reason}</p>
                  <div className="text-[11px] text-slate-500">
                    {ret.items.length} article(s) à retourner
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Mise à jour statut — {selectedShipment.id}
            </h3>

            <form onSubmit={handleUpdateShipmentStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau statut</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="PROCESSING">En Préparation (PROCESSING)</option>
                  <option value="READY_TO_SHIP">Prêt à expédier (READY_TO_SHIP)</option>
                  <option value="SHIPPED">Expédié / Confié au transporteur (SHIPPED)</option>
                  <option value="IN_TRANSIT">En Transit (IN_TRANSIT)</option>
                  <option value="DELIVERED">Livré au destinataire (DELIVERED)</option>
                  <option value="PICKED_UP">Remis au client en boutique (PICKED_UP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">N° de Suivi Transporteur</label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="Ex: 6A123456789FR"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transporteur</label>
                <input
                  type="text"
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  placeholder="Colissimo / Chronopost / Coursier"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note interne ou d&apos;étape</label>
                <input
                  type="text"
                  value={updateNoteInput}
                  onChange={(e) => setUpdateNoteInput(e.target.value)}
                  placeholder="Ex: Colis déposé au bureau de poste"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer"
                >
                  {isUpdating ? 'Sauvegarde...' : 'Appliquer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE INCIDENT MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Résolution du Litige — {selectedIncident.id}
            </h3>

            <form onSubmit={handleResolveIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Actions & Notes de résolution</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ex: Colis renvoyé sans frais avec nouveau numéro de suivi ou contact transporteur établi."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                >
                  {isResolving ? 'Clôture...' : 'Clôturer le litige'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE BORDEREAU / TRANSPORT LABEL MODAL */}
      {labelShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-800" />
                <h3 className="text-base font-bold text-slate-900">Bordereau de Transport / Étiquette Colis</h3>
              </div>
              <button
                onClick={() => setLabelShipment(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Simulated Logistics Label */}
            <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-white font-mono text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                <div>
                  <h4 className="text-lg font-black text-slate-900">{labelShipment.carrierName || 'COLISSIMO PRIVILÈGE'}</h4>
                  <p className="text-[10px] text-slate-500">Service Express 48H • Suivi Électronique</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">FR-75</div>
                  <p className="text-[10px] text-slate-500">Poids : {labelShipment.weightKg || 0.45} kg</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">EXPÉDITEUR</span>
                  <p className="font-bold text-slate-800">Nexus Botanics Lab</p>
                  <p className="text-[10px] text-slate-600">14 Rue de Bretagne</p>
                  <p className="text-[10px] text-slate-600">75003 Paris, France</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">DESTINATAIRE</span>
                  <p className="font-bold text-slate-900">
                    {labelShipment.shippingAddress.fullName || `${labelShipment.shippingAddress.firstName || ''} ${labelShipment.shippingAddress.lastName || ''}`}
                  </p>
                  <p className="text-[10px] text-slate-800">{labelShipment.shippingAddress.addressLine1 || labelShipment.shippingAddress.address}</p>
                  <p className="text-[10px] text-slate-800">{labelShipment.shippingAddress.postalCode} {labelShipment.shippingAddress.city}</p>
                  <p className="text-[10px] text-slate-800">{labelShipment.shippingAddress.country}</p>
                </div>
              </div>

              {/* Barcode visual simulation */}
              <div className="text-center py-2 space-y-1">
                <div className="h-10 bg-slate-900 mx-auto w-4/5 rounded-xs flex items-center justify-around px-2 text-white text-[8px] tracking-[0.2em]">
                  |||||| |||| |||||||| ||| |||||| ||||||| |||| |||||||||||
                </div>
                <div className="text-xs font-black tracking-widest text-slate-900">
                  {labelShipment.trackingNumber || '6A9876543210FR'}
                </div>
              </div>

              <div className="text-[9px] text-slate-400 text-center">
                Bordereau officiel généré par Nexus Marketplace Logistics Platform.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l&apos;étiquette</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
