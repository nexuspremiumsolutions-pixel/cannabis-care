import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Copy,
  ChevronRight,
  Info,
  Calendar,
  X,
  Send,
} from 'lucide-react';
import {
  Shipment,
  TrackingEvent,
  PickupConfirmation,
  DeliveryIncident,
  ReturnRequest,
  DeliveryIncidentType,
} from '../../types/entities';

interface CustomerTrackingViewProps {
  onClose?: () => void;
  initialOrderNumber?: string;
}

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({
  onClose,
  initialOrderNumber,
}) => {
  const { token, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(initialOrderNumber || '#NEXUS-2026-000145');
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Incident Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<DeliveryIncidentType>('DELAY');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentSuccessMsg, setIncidentSuccessMsg] = useState<string | null>(null);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('DEFECTIVE');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  const fetchTracking = async (term: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Allow searching by order number or shipment ID or tracking number
      const clean = encodeURIComponent(term.trim());
      const res = await fetch(`/api/logistics/tracking/${clean}`);
      if (!res.ok) {
        // If not found directly, fetch demo order or search orders
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Numéro de suivi ou commande introuvable.');
      }
      const data = await res.json();
      setTrackingData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de récupérer les informations de suivi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      fetchTracking(searchTerm);
    }
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData?.shipment || !token) return;
    setIncidentSubmitting(true);
    try {
      const res = await fetch('/api/logistics/customer/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          globalOrderId: trackingData.order?.id || trackingData.shipment.orderId,
          shopOrderId: trackingData.shipment.shopOrderId,
          shipmentId: trackingData.shipment.id,
          shopId: trackingData.shipment.shopId,
          type: incidentType,
          description: incidentDescription,
          customerNote: 'Signalé depuis le portail de suivi client Nexus.',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors du signalement');
      }

      setIncidentSuccessMsg('Votre réclamation a été transmise à notre service logistique.');
      setTimeout(() => {
        setIsIncidentModalOpen(false);
        setIncidentSuccessMsg(null);
        setIncidentDescription('');
        fetchTracking(searchTerm);
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIncidentSubmitting(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingData?.shipment || !token) return;
    setReturnSubmitting(true);
    try {
      const res = await fetch('/api/logistics/customer/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: trackingData.order?.id || trackingData.shipment.orderId,
          shopOrderId: trackingData.shipment.shopOrderId,
          shopId: trackingData.shipment.shopId,
          reason: returnReason,
          items: [
            {
              orderItemId: 'item_ret_01',
              productId: 'prod_balm_muscle',
              productName: 'Produit de la commande',
              quantity: 1,
              reasonDetail: returnReason,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de la demande de retour');
      }

      setReturnSuccessMsg('Votre demande de retour a été enregistrée. L’étiquette retour vous sera fournie.');
      setTimeout(() => {
        setIsReturnModalOpen(false);
        setReturnSuccessMsg(null);
        fetchTracking(searchTerm);
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  const shipment: Shipment | undefined = trackingData?.shipment;
  const events: TrackingEvent[] = trackingData?.events || [];
  const pickupConfirmation: PickupConfirmation | undefined = trackingData?.pickupConfirmation;
  const isPickup = shipment?.deliveryMethod === 'PICKUP_IN_STORE' || shipment?.deliveryMethod === 'CLICK_AND_COLLECT';

  // Status mapping
  const statusSteps = isPickup
    ? [
        { key: 'PENDING', label: 'Commande Reçue', desc: 'Prise en compte par la boutique' },
        { key: 'PROCESSING', label: 'En Préparation', desc: 'Articles réservés & emballés' },
        { key: 'READY_FOR_PICKUP', label: 'Prêt en Boutique', desc: 'Code de retrait disponible' },
        { key: 'PICKED_UP', label: 'Remis au Client', desc: 'Code validé au comptoir' },
      ]
    : [
        { key: 'PENDING', label: 'Commande Reçue', desc: 'Prise en compte logistique' },
        { key: 'PROCESSING', label: 'Préparation Colis', desc: 'Mise en carton & pesée' },
        { key: 'SHIPPED', label: 'Pris en charge', desc: 'Colis confié au transporteur' },
        { key: 'IN_TRANSIT', label: 'En Acheminement', desc: 'En transit vers le centre local' },
        { key: 'DELIVERED', label: 'Livré', desc: 'Déposé à l’adresse indiquée' },
      ];

  const getStepIndex = (currentStatus?: string) => {
    if (!currentStatus) return 0;
    if (currentStatus === 'DELIVERED' || currentStatus === 'PICKED_UP') return 4;
    if (currentStatus === 'OUT_FOR_DELIVERY') return 3;
    if (currentStatus === 'IN_TRANSIT') return 3;
    if (currentStatus === 'SHIPPED') return 2;
    if (currentStatus === 'READY_TO_SHIP' || currentStatus === 'READY_FOR_PICKUP') return 2;
    if (currentStatus === 'PROCESSING') return 1;
    return 0;
  };

  const currentStepIdx = getStepIndex(shipment?.status);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Package className="w-3.5 h-3.5 text-teal-400" />
            <span>Suivi Logistique & Expéditions Multi-Boutiques</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Suivi en Temps Réel de vos Commandes</h2>
          <p className="text-xs text-slate-400">
            Traçabilité certifiée pour vos livraisons discrètes à domicile et vos retraits Click & Collect.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTracking(searchTerm);
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: #NEXUS-2026-000145 ou shp_colissimo_01"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>

        {/* Preset quick links for demo */}
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <span className="font-semibold">Exemples :</span>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('shp_colissimo_01');
              fetchTracking('shp_colissimo_01');
            }}
            className="underline hover:text-teal-700 font-mono cursor-pointer"
          >
            shp_colissimo_01 (Colissimo)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('shp_pickup_02');
              fetchTracking('shp_pickup_02');
            }}
            className="underline hover:text-teal-700 font-mono cursor-pointer"
          >
            shp_pickup_02 (Retrait Boutique)
          </button>
        </div>
      </div>

      {/* Error View */}
      {errorMessage && (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">{errorMessage}</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vérifiez la référence de commande ou l&apos;identifiant de colis. Les commandes créées lors du paiement sont automatiquement synchronisées.
          </p>
        </div>
      )}

      {/* Tracking Content */}
      {trackingData && shipment && (
        <div className="p-6 sm:p-8 space-y-8">
          {/* Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Delivery Mode Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mode d&apos;Acheminement</span>
                {isPickup ? (
                  <MapPin className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Truck className="w-4 h-4 text-teal-700" />
                )}
              </div>
              <p className="text-base font-black text-slate-900">
                {isPickup ? 'Retrait Express en Boutique' : `Livraison à Domicile • ${shipment.carrierName || 'Colissimo'}`}
              </p>
              <div className="text-xs text-slate-500">
                {isPickup ? (
                  <p>Disponible immédiatement après confirmation de préparation.</p>
                ) : (
                  <p>N° de Suivi : <span className="font-mono font-bold text-slate-800">{shipment.trackingNumber || 'En cours de génération'}</span></p>
                )}
              </div>
            </div>

            {/* Estimated Date Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Délai Estimé</span>
                <Calendar className="w-4 h-4 text-indigo-700" />
              </div>
              <p className="text-base font-black text-slate-900">
                {shipment.estimatedDeliveryDate
                  ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })
                  : 'Sous 24h à 48h ouvrées'}
              </p>
              <p className="text-xs text-slate-500">
                {shipment.deliveredAt ? (
                  <span className="text-emerald-800 font-bold">Livré le {new Date(shipment.deliveredAt).toLocaleDateString('fr-FR')}</span>
                ) : (
                  <span>Acheminement prioritaire en cours</span>
                )}
              </p>
            </div>

            {/* Security & Confidentiality */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Garantie Nexus</span>
                <ShieldCheck className="w-4 h-4 text-teal-700" />
              </div>
              <p className="text-base font-black text-slate-900">Emballage Neutre & Scellé</p>
              <p className="text-xs text-slate-500">
                Aucune mention du produit ni de la nature botanique sur le colis extérieur.
              </p>
            </div>
          </div>

          {/* CLICK & COLLECT SECRET PIN CARD (If Pickup) */}
          {isPickup && (
            <div className="p-6 rounded-3xl bg-linear-to-r from-teal-900 to-slate-900 text-white shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>Pass de Retrait Express au Comptoir</span>
                  </div>
                  <h3 className="text-xl font-black">Code Secret de Retrait Sécurisé</h3>
                  <p className="text-xs text-slate-300 max-w-md">
                    Présentez ce code unique au responsable de boutique pour retirer votre commande scellée.
                  </p>
                </div>

                {/* Secret Code Display */}
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-300 tracking-widest">
                    Code de Validation
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-black tracking-widest font-mono text-white">
                      {pickupConfirmation?.pickupCode || 'NX-7842'}
                    </span>
                    <button
                      onClick={() => handleCopyCode(pickupConfirmation?.pickupCode || 'NX-7842')}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                      title="Copier le code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedCode && <span className="text-[10px] text-teal-300 font-bold">Code copié !</span>}
                </div>
              </div>

              {/* Instructions */}
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>
                    Adresse du point de vente : <strong>14 Rue de Bretagne, 75003 Paris</strong> (Horaires : 10h - 19h30)
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Statut retrait :{' '}
                  <strong className="text-teal-300">
                    {pickupConfirmation?.pickedUpAt ? 'Validé & Retiré' : 'En attente de retrait'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Progress Bar */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Progression de l&apos;acheminement
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statusSteps.map((step, idx) => {
                const isDone = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isDone
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-200 text-slate-500'
                        } ${isCurrent ? 'ring-4 ring-teal-200 shadow-md' : ''}`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isDone ? 'bg-teal-700' : 'bg-transparent'}`}
                          style={{ width: isDone ? '100%' : '0%' }}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isCurrent ? 'text-teal-900' : 'text-slate-800'}`}>
                        {step.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-tight">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline of Tracking Events */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Historique des Événements ({events.length})</span>
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {events.map((evt) => (
                <div key={evt.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {evt.status}
                      </span>
                      {evt.location && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {evt.location}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-800">{evt.description}</p>
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(evt.eventDate).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Action Buttons: Incident & Return */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Signaler un problème de livraison</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReturnModalOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Demander un retour d&apos;article</span>
              </button>
            </div>

            {shipment.trackingUrl && (
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5"
              >
                <span>Accéder au site officiel du transporteur</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* INCIDENT REPORT MODAL */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Signaler une Anomalie Logistique</span>
              </h3>
              <button onClick={() => setIsIncidentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {incidentSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                {incidentSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitIncident} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type de réclamation</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as DeliveryIncidentType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="DELAY">Retard anormal d&apos;acheminement</option>
                    <option value="DAMAGED_PARCEL">Colis ou produit endommagé</option>
                    <option value="WRONG_ADDRESS">Erreur d&apos;adresse de livraison</option>
                    <option value="MISSING_ITEM">Article manquant à l&apos;ouverture</option>
                    <option value="LOST">Colis présumé perdu par le transporteur</option>
                    <option value="OTHER">Autre motif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Précisions & Constat</label>
                  <textarea
                    rows={3}
                    required
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Décrivez précisément la situation..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsIncidentModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={incidentSubmitting}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    {incidentSubmitting ? 'Envoi...' : 'Transmettre au support'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RETURN REQUEST MODAL */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                <span>Demande de Retour d&apos;Article</span>
              </h3>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {returnSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                {returnSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  Conformément à la législation, les produits scellés peuvent être retournés sous 14 jours s&apos;ils n&apos;ont pas été descellés.
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motif de retour</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="DEFECTIVE">Article défectueux ou flacon altéré</option>
                    <option value="WRONG_ITEM">Article reçu non conforme à la commande</option>
                    <option value="NOT_AS_DESCRIBED">Description produit discordante</option>
                    <option value="CHANGED_MIND">Délai de rétractation (produit scellé)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={returnSubmitting}
                    className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold"
                  >
                    {returnSubmitting ? 'Envoi...' : 'Valider la demande'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
