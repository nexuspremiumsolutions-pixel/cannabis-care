import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Gift,
  Trophy,
  Users,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Shield,
  PlusCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { LoyaltyMetrics } from '../../../backend/services/loyalty/loyaltyAnalyticsService';
import { LoyaltyAdminAuditLog } from '../../types/entities';

export const AdminLoyaltyView: React.FC = () => {
  const { token, user } = useAuth();
  const [metrics, setMetrics] = useState<LoyaltyMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<LoyaltyAdminAuditLog[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Adjustment Form State
  const [targetUserId, setTargetUserId] = useState('');
  const [adjustmentPoints, setAdjustmentPoints] = useState<number>(50);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Cashier / Voucher Validator Simulator State
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminLoyaltyData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [resM, resL, resU] = await Promise.all([
        fetch('/api/loyalty/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/loyalty/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resM.ok) {
        const d = await resM.json();
        setMetrics(d.metrics);
      }
      if (resL.ok) {
        const d = await resL.json();
        setAuditLogs(d.logs || []);
      }
      if (resU.ok) {
        const d = await resU.json();
        setUsersList(d.users || []);
        if (d.users && d.users.length > 0 && !targetUserId) {
          setTargetUserId(d.users[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminLoyaltyData();
  }, [token]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Submit Manual Points Adjustment
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !adjustmentReason.trim()) {
      showFeedback('error', 'Veuillez renseigner un utilisateur cible et un motif obligatoire.');
      return;
    }

    setIsAdjusting(true);
    try {
      const res = await fetch('/api/loyalty/admin/adjust-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-id': user?.id || 'admin_console',
          'x-admin-email': user?.email || 'admin@nexuscare.local',
        },
        body: JSON.stringify({
          targetUserId,
          points: adjustmentPoints,
          reason: adjustmentReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback(
          'success',
          `Ajustement réussi ! Nouveau solde du membre : ${data.account.pointsBalance} pts.`
        );
        setAdjustmentReason('');
        fetchAdminLoyaltyData();
      } else {
        showFeedback('error', data.error || "Échec de l'ajustement.");
      }
    } catch (err: any) {
      showFeedback('error', err.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  // Cashier / In-Store Voucher Validation
  const handleValidateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCodeInput.trim()) return;

    setIsValidatingVoucher(true);
    setValidationResult(null);
    try {
      const res = await fetch('/api/loyalty/redemptions/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          redemptionCode: voucherCodeInput.trim().toUpperCase(),
          shopId: 'shop_nexus_cbd_01',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setValidationResult({ success: true, redemption: data.redemption });
        showFeedback('success', 'Bon d\'achat validé et consommé avec succès !');
        setVoucherCodeInput('');
        fetchAdminLoyaltyData();
      } else {
        setValidationResult({ success: false, error: data.error || 'Code invalide ou déjà utilisé' });
        showFeedback('error', data.error || 'Code invalide ou déjà utilisé.');
      }
    } catch (err: any) {
      setValidationResult({ success: false, error: err.message });
      showFeedback('error', err.message);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="py-16 text-center text-slate-500 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700 mb-2" />
        Chargement de la supervision fidélité...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 border shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Overview Metrics Cards */}
      {metrics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              Indicateurs Globaux du Programme Fidélité (Module 12)
            </h3>
            <button
              type="button"
              onClick={fetchAdminLoyaltyData}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Points Émis
              </span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {metrics.totalPointsIssued.toLocaleString()}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Points Échangés
              </span>
              <span className="text-xl font-black text-amber-600 font-mono">
                {metrics.totalPointsRedeemed.toLocaleString()}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Comptes Actifs
              </span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {metrics.activeAccountsCount}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Badges Débloqués
              </span>
              <span className="text-xl font-black text-teal-800 font-mono">
                {metrics.totalBadgesUnlocked}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Défis Complétés
              </span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                {metrics.totalChallengesCompleted}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Bons Consommés
              </span>
              <span className="text-xl font-black text-purple-700 font-mono">
                {metrics.totalRedemptionsUsed} / {metrics.totalRedemptionsIssued}
              </span>
            </div>
          </div>

          {/* Level Distribution Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-700">
              Répartition des Membres par Palier de Fidélité
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {metrics.levelDistribution.map((lvl) => (
                <div key={lvl.levelId} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 block truncate">
                    {lvl.levelName}
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {lvl.count} <span className="text-[10px] font-normal text-slate-400">membres</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Tooling: Points Adjustment & Cashier Validator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manual Points Adjustment Tool */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Ajustement Manuel de Points (Gouvernance & Audit)
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Créditez ou débitez des points avec obligation légale de traçabilité et motif audité.
          </p>

          <form onSubmit={handleAdjustPoints} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Membre Cible :
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-teal-700"
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} ({u.role}) — ID: {u.id.substring(0, 8)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Montant en Points :
                </label>
                <input
                  type="number"
                  step="10"
                  value={adjustmentPoints}
                  onChange={(e) => setAdjustmentPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Type d'opération :
                </label>
                <div className="py-2 text-xs font-bold">
                  {adjustmentPoints >= 0 ? (
                    <span className="text-emerald-700">Crédit (+{adjustmentPoints} pts)</span>
                  ) : (
                    <span className="text-rose-700">Débit ({adjustmentPoints} pts)</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Motif justifié (Obligatoire pour audit) :
              </label>
              <input
                type="text"
                placeholder="Ex: Dédommagement retard livraison #NEXUS-014"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-700"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isAdjusting || !adjustmentReason.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isAdjusting ? 'Enregistrement sécurisé...' : 'Appliquer l\'ajustement & Auditer'}
            </button>
          </form>
        </div>

        {/* Cashier / In-Store Voucher Validation Simulator */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Caisse & Validation de Bon Partenaire (POS Simulator)
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Saisissez ou scannez un code coupon présenté par un client pour vérifier sa validité et le marquer consommé.
          </p>

          <form onSubmit={handleValidateVoucher} className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Code Unique du Bon (NEXUS-XXXX-XXXX) :
              </label>
              <input
                type="text"
                placeholder="Ex: NEXUS-7A2B-9C1D"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm tracking-wider uppercase focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <button
              type="submit"
              disabled={isValidatingVoucher || !voucherCodeInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{isValidatingVoucher ? 'Vérification...' : 'Valider & Consommer en Caisse'}</span>
            </button>
          </form>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1 ${
                validationResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {validationResult.success ? (
                <>
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Bon valide et validé avec succès !
                  </div>
                  <p className="text-[11px]">
                    Remise appliquée : {validationResult.redemption.discountAmount || 0} €
                  </p>
                </>
              ) : (
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {validationResult.error}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-700" />
              Registre d'Audit Administratif des Points & Récompenses
            </h4>
            <p className="text-xs text-slate-500">
              Journal immuable de chaque intervention et ajustement d'équipe.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 pl-6">Date & Heure</th>
                <th className="p-3">Administrateur</th>
                <th className="p-3">Action</th>
                <th className="p-3">Membre Cible</th>
                <th className="p-3">Avant / Après</th>
                <th className="p-3 pr-6">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                    Aucun ajustement manuel enregistré.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {log.adminEmail || log.adminUserId}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {log.entityId.substring(0, 10)}...
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {log.before?.pointsBalance ?? '-'} pts ➔ {log.after?.pointsBalance ?? '-'} pts
                    </td>
                    <td className="p-3 pr-6 text-slate-600 italic max-w-xs truncate">
                      {log.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
