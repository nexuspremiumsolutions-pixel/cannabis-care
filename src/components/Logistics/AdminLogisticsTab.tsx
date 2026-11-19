import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Truck,
  Globe,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  Package,
} from 'lucide-react';
import { Carrier, DeliveryZone, FreeShippingRule, DeliveryIncident } from '../../types/entities';

export const AdminLogisticsTab: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [togglingCarrierId, setTogglingCarrierId] = useState<string | null>(null);

  const fetchAdminOverview = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/logistics/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Impossible de charger la supervision logistique administrateur.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, [token]);

  const handleToggleCarrier = async (carrier: Carrier) => {
    if (!token) return;
    setTogglingCarrierId(carrier.id);
    try {
      const res = await fetch(`/api/logistics/admin/carriers/${carrier.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !carrier.enabled }),
      });
      if (!res.ok) throw new Error('Échec de la modification du transporteur.');
      fetchAdminOverview();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTogglingCarrierId(null);
    }
  };

  const carriers: Carrier[] = data?.carriers || [];
  const zones: DeliveryZone[] = data?.zones || [];
  const freeShippingRules: FreeShippingRule[] = data?.freeShippingRules || [];
  const incidents: DeliveryIncident[] = data?.incidents || [];
  const metrics = data?.metrics || {
    totalShipments: 0,
    openIncidents: 0,
    activeCarriersCount: 0,
    deliveryZonesCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>Supervision Logistique Plateforme • Module 11</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Configuration des Transporteurs & Zones de Livraison</h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Pilotez les intégrations transporteurs (Colissimo, Chronopost, Mondial Relay, Coursiers), les règles de gratuité et les seuils d&apos;acheminement.
          </p>
        </div>

        <button
          onClick={fetchAdminOverview}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Expéditions Réseau</span>
          <p className="text-2xl font-black text-slate-900">{metrics.totalShipments}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-teal-700 uppercase">Transporteurs Actifs</span>
          <p className="text-2xl font-black text-teal-800">{metrics.activeCarriersCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-indigo-700 uppercase">Zones Géographiques</span>
          <p className="text-2xl font-black text-indigo-800">{metrics.deliveryZonesCount}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-rose-700 uppercase">Litiges en Attente</span>
          <p className="text-2xl font-black text-rose-800">{metrics.openIncidents}</p>
        </div>
      </div>

      {/* CARRIER CONNECTORS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-teal-700" />
            <span>Connecteurs Transporteurs Agréés ({carriers.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Activation dynamique des modules d&apos;expédition pour les boutiques partenaires de la marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {carriers.map((carrier) => (
            <div
              key={carrier.id}
              className={`p-5 rounded-2xl border transition ${
                carrier.enabled
                  ? 'border-teal-200 bg-teal-50/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{carrier.name}</h4>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">{carrier.code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCarrier(carrier)}
                  disabled={togglingCarrierId === carrier.id}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                    carrier.enabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {carrier.enabled ? 'Actif' : 'Désactivé'}
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Pays d&apos;origine :</span>
                  <span className="font-bold text-slate-800">{carrier.country}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Mode Suivi :</span>
                  <span className="font-bold text-slate-800">{carrier.trackingSupported ? 'Webhook Auto' : 'Manuel'}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Pays éligibles :</span>
                  <span className="font-bold text-slate-800">{carrier.supportedCountries.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DELIVERY ZONES & FREE SHIPPING MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Zones */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-700" />
            <span>Zones Géographiques & Délais Légaux</span>
          </h3>

          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">{zone.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                    {zone.countries.join(', ')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">Type de zone : {zone.type}</p>
                <div className="text-[10px] text-teal-800 font-bold">
                  Statut zone : {zone.enabled ? 'Active et desservie' : 'Désactivée'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free Shipping Rules */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>Plafonds & Seuils de Livraison Offerte</span>
          </h3>

          <div className="space-y-3">
            {freeShippingRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">Règle #{rule.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    Dès {rule.minimumOrderAmount.toFixed(2)} € d&apos;achat
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Mode : {rule.deliveryMethod} {rule.country ? `• Pays : ${rule.country}` : ''}
                </p>
                <div className="text-[10px] text-slate-400">
                  {rule.enabled ? 'Règle active sur l’ensemble du réseau' : 'Règle désactivée'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
