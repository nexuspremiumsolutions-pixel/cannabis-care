import React, { useState, useEffect } from 'react';
import { PartnerShop } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Globe,
  MapPin,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';

interface AdminShopsSupervisionViewProps {
  onPreviewStorefront?: (shopIdOrSlug: string) => void;
}

export const AdminShopsSupervisionView: React.FC<AdminShopsSupervisionViewProps> = ({
  onPreviewStorefront,
}) => {
  const { user } = useAuth();
  const [shops, setShops] = useState<PartnerShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal action
  const [selectedShop, setSelectedShop] = useState<PartnerShop | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'ACTIVATE' | 'VERIFY' | 'REJECT' | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDirectory();
  }, [statusFilter, search]);

  async function fetchDirectory() {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/marketplace/admin/shops/directory?status=${statusFilter}&search=${encodeURIComponent(
          search
        )}`,
        {
          headers: user ? { Authorization: `Bearer ${user.id}` } : {},
        }
      );
      const data = await res.json();
      if (data.success) {
        setShops(data.shops || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !actionType || !user) return;
    try {
      setProcessing(true);
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.id}`,
      };

      if (actionType === 'SUSPEND' || actionType === 'ACTIVATE') {
        const newStatus = actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
        const res = await fetch(`/api/marketplace/admin/shops/${selectedShop.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: newStatus, reason }),
        });
        const data = await res.json();
        if (data.success) {
          setShops(shops.map((s) => (s.id === selectedShop.id ? data.shop : s)));
          setToastMessage(`✓ Statut modifié : Boutique passée en ${newStatus}`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      } else if (actionType === 'VERIFY' || actionType === 'REJECT') {
        const verifStatus = actionType === 'VERIFY' ? 'VERIFIED' : 'REJECTED';
        const res = await fetch(`/api/marketplace/admin/shops/${selectedShop.id}/verification`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            verificationStatus: verifStatus,
            legalStatus: verifStatus,
            reason,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShops(shops.map((s) => (s.id === selectedShop.id ? data.shop : s)));
          setToastMessage(`✓ Conformité mise à jour : ${verifStatus}`);
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
      setSelectedShop(null);
      setActionType(null);
      setReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredShops = shops.filter((s) => {
    if (countryFilter !== 'ALL' && s.country.toLowerCase() !== countryFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Supervision Centrale • Module 14</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Annuaire &amp; Modération des Boutiques Partenaires
          </h2>
          <p className="text-xs text-slate-500">
            Validation de la conformité légale (THC &lt; 0.3%, licences UE), gestion des statuts et contrôle de visibilité.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
            {filteredShops.length} boutique(s) répertoriée(s)
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher une boutique (nom, ville, raison sociale)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Boutiques Actives</option>
            <option value="SUSPENDED">Boutiques Suspendues</option>
            <option value="PENDING_VERIFICATION">En attente de vérification</option>
          </select>

          {/* Country filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">Tous les pays européens</option>
            <option value="France">France</option>
            <option value="Suisse">Suisse</option>
            <option value="Belgique">Belgique</option>
            <option value="Luxembourg">Luxembourg</option>
            <option value="Allemagne">Allemagne</option>
            <option value="Espagne">Espagne</option>
            <option value="Italie">Italie</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">Chargement du réseau de boutiques...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucune boutique ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/70">
                  <th className="py-3 px-4">Boutique &amp; Localisation</th>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Conformité Légale</th>
                  <th className="py-3 px-4">Statut Opérationnel</th>
                  <th className="py-3 px-4 text-right">Actions de Supervision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShops.map((shop) => {
                  const isVerified =
                    shop.verificationStatus === 'VERIFIED' || shop.legalStatus === 'VERIFIED';
                  const isActive = (shop.shopStatus || shop.status) === 'ACTIVE';

                  return (
                    <tr key={shop.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 p-1 flex items-center justify-center shrink-0 border border-slate-200">
                            {shop.logoUrl ? (
                              <img
                                src={shop.logoUrl}
                                alt={shop.commercialName}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain rounded-lg"
                              />
                            ) : (
                              <Store className="w-5 h-5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <strong className="text-slate-900 font-bold block text-xs">
                              {shop.publicName || shop.commercialName}
                            </strong>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {shop.city}, {shop.country} • {shop.email || 'Pas d’email'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold uppercase">
                          {shop.storefrontTemplate || 'classic'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                            isVerified
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Vérifié &amp; Conforme
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> En Attente de Revue
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit ${
                            isActive
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isActive ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview button */}
                          <button
                            onClick={() => {
                              if (onPreviewStorefront) {
                                onPreviewStorefront(shop.slug || shop.id);
                              } else {
                                window.location.hash = `storefront=${shop.slug || shop.id}`;
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Ouvrir la vitrine publique"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Verify button */}
                          {!isVerified ? (
                            <button
                              onClick={() => {
                                setSelectedShop(shop);
                                setActionType('VERIFY');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valider</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedShop(shop);
                                setActionType('REJECT');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-[11px] transition cursor-pointer"
                            >
                              Révoquer
                            </button>
                          )}

                          {/* Suspend / Activate button */}
                          {isActive ? (
                            <button
                              onClick={() => {
                                setSelectedShop(shop);
                                setActionType('SUSPEND');
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                              title="Suspendre cette boutique"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedShop(shop);
                                setActionType('ACTIVATE');
                              }}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition cursor-pointer"
                              title="Réactiver la boutique"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {selectedShop && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Modération &amp; Supervision
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {actionType === 'VERIFY'
                    ? 'Valider la conformité légale'
                    : actionType === 'REJECT'
                    ? 'Révoquer la certification'
                    : actionType === 'SUSPEND'
                    ? 'Suspendre la boutique'
                    : 'Réactiver la boutique'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedShop(null);
                  setActionType(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyAction} className="space-y-3 text-xs">
              <p className="text-slate-600">
                Action appliquée à : <strong>{selectedShop.commercialName}</strong> ({selectedShop.city})
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif consigné dans l&apos;audit log :
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex : Certificats d'analyses HPLC vérifiés et conformes aux normes UE..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShop(null);
                    setActionType(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition cursor-pointer ${
                    actionType === 'SUSPEND' || actionType === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-teal-800 hover:bg-teal-900'
                  }`}
                >
                  {processing ? 'Enregistrement...' : 'Confirmer l’action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
