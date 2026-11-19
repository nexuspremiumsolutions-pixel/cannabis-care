import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  SubscriptionAnalytics,
  Subscription,
  Invoice,
  SubscriptionGrant,
} from '../../types/entities';
import { SubscriptionInvoiceModal } from '../Subscription/SubscriptionInvoiceModal';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Gift,
  Building,
  RotateCcw,
  Sparkles,
  Shield,
  FileText,
  Calendar,
  Search,
} from 'lucide-react';

export const AdminSubscriptionTab: React.FC = () => {
  const { token, user } = useAuth();

  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [grants, setGrants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'subscriptions' | 'invoices' | 'grants'>('analytics');

  // Modals / Actions
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [refundModalData, setRefundModalData] = useState<{
    subscriptionId: string;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [refundReason, setRefundReason] = useState('Geste commercial suite à demande support');

  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantDurationDays, setGrantDurationDays] = useState(30);
  const [grantReason, setGrantReason] = useState('Offert - Accompagnement bien-être');

  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [anaRes, subRes, invRes, grtRes, usrRes, plnRes] = await Promise.all([
        fetch('/api/subscriptions/admin/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscriptions/admin/subscriptions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscriptions/admin/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscriptions/admin/grants', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscriptions/plans?target=USER'),
      ]);

      if (anaRes.ok) setAnalytics((await anaRes.json()).analytics);
      if (subRes.ok) setSubscriptions((await subRes.json()).subscriptions || []);
      if (invRes.ok) setInvoices((await invRes.json()).invoices || []);
      if (grtRes.ok) setGrants((await grtRes.json()).grants || []);
      if (usrRes.ok) setAllUsers((await usrRes.json()).users || []);
      if (plnRes.ok) {
        const pList = (await plnRes.json()).plans || [];
        setPlans(pList);
        if (pList.length > 0 && !grantPlanId) {
          const premiumPlan = pList.find((p: any) => p.code === 'PREMIUM') || pList[0];
          setGrantPlanId(premiumPlan.id);
        }
      }
    } catch (err) {
      console.error('Failed to load admin subscription data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  // Handle Refund
  const handleProcessRefund = async () => {
    if (!refundModalData) return;
    try {
      const res = await fetch('/api/subscriptions/admin/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subscriptionId: refundModalData.subscriptionId,
          invoiceId: refundModalData.invoiceId,
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ text: 'Remboursement traité et écrit au grand livre comptable avec succès.', type: 'success' });
      setRefundModalData(null);
      await fetchAdminData();
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  // Handle Manual Grant
  const handleProcessGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId || !grantPlanId) return;

    try {
      const res = await fetch('/api/subscriptions/admin/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: grantUserId,
          planId: grantPlanId,
          durationDays: grantDurationDays,
          reason: grantReason,
          source: 'ADMIN',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ text: 'Accès premium gracieux attribué avec succès et notifié à l’utilisateur.', type: 'success' });
      setIsGrantModalOpen(false);
      await fetchAdminData();
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  // Test renewal
  const handleForceRenew = async (subId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/admin/renew/${subId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback({ text: 'Renouvellement simulé avec succès.', type: 'success' });
      await fetchAdminData();
    } catch (err: any) {
      setFeedback({ text: err.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Module 13 • Monétisation & Gestion des Abonnements</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Revenus Récurrents (MRR/ARR), Fiscalité & Droits Premium
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Supervision en temps réel des flux récurrents, gestion des surclassements, conformité TVA par pays et octroi manuel de privilèges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGrantModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition cursor-pointer shadow-sm"
            >
              <Gift className="w-4 h-4 text-teal-300" />
              <span>Offrir un Accès Premium</span>
            </button>
            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-500/50'
                : 'bg-rose-950/80 text-rose-200 border border-rose-500/50'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="underline text-[10px]">
              Fermer
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">MRR Mensuel</span>
            <p className="text-lg font-black text-slate-900">{analytics.mrr.toFixed(2)} €</p>
            <span className="text-[10px] text-teal-700 font-bold block">Revenu récurrent</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">ARR Estimé</span>
            <p className="text-lg font-black text-slate-900">{analytics.arr.toFixed(2)} €</p>
            <span className="text-[10px] text-slate-500 block">Projection annuelle</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Abonnés Premium</span>
            <p className="text-lg font-black text-teal-800">{analytics.premiumUsersCount}</p>
            <span className="text-[10px] text-slate-500 block">
              sur {analytics.freeUsersCount + analytics.premiumUsersCount} inscrits
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Taux Conversion</span>
            <p className="text-lg font-black text-emerald-800">{analytics.conversionRate}%</p>
            <span className="text-[10px] text-emerald-700 font-bold block">Gratuit vers Payant</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Taux de Churn</span>
            <p className="text-lg font-black text-rose-800">{analytics.churnRate}%</p>
            <span className="text-[10px] text-slate-500 block">{analytics.canceledSubscriptionsCount} résiliations</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Revenus Nets</span>
            <p className="text-lg font-black text-slate-900">{analytics.subscriptionNetRevenue.toFixed(2)} €</p>
            <span className="text-[10px] text-slate-500 block">
              Remboursé : {analytics.totalRefundedAmount.toFixed(2)} €
            </span>
          </div>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl max-w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Métriques & Répartition
        </button>
        <button
          onClick={() => setActiveSubTab('subscriptions')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'subscriptions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Abonnements ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Factures ({invoices.length})
        </button>
        <button
          onClick={() => setActiveSubTab('grants')}
          className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
            activeSubTab === 'grants' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Accès Offerts ({grants.length})
        </button>
      </div>

      {/* TAB 1: METRICS & REVENUE BREAKDOWN */}
      {activeSubTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue by Plan */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              <span>Répartition des Revenus par Formule</span>
            </h3>
            <div className="space-y-3 text-xs">
              {analytics.revenueByPlan.length > 0 ? (
                analytics.revenueByPlan.map((p) => (
                  <div key={p.planCode} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{p.planName}</p>
                      <p className="text-slate-500 text-[11px]">{p.count} facturation(s)</p>
                    </div>
                    <span className="font-extrabold text-teal-800 text-sm">
                      {p.amount.toFixed(2)} €
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">Aucun revenu encaissé pour le moment.</p>
              )}
            </div>
          </div>

          {/* Revenue by Country / Tax */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-700" />
              <span>Distribution Géographique & TVA Collectée</span>
            </h3>
            <div className="space-y-3 text-xs">
              {analytics.revenueByCountry.length > 0 ? (
                analytics.revenueByCountry.map((c) => (
                  <div key={c.country} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Zone : {c.country === 'FR' ? 'France' : c.country === 'CH' ? 'Suisse' : c.country}
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {c.amount.toFixed(2)} {c.currency}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">Données géographiques en attente.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS LIST */}
      {activeSubTab === 'subscriptions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Registre des Abonnements Souscrits
            </h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher utilisateur ou plan..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Utilisateur</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Tarif</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3">Échéance</th>
                  <th className="py-2.5 px-3 text-right">Actions Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions
                  .filter(
                    (s) =>
                      s.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.planName?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">{sub.userEmail}</td>
                      <td className="py-3 px-3 text-slate-700 font-bold">{sub.planName}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {sub.priceAmount} {sub.currency} / {sub.priceInterval === 'YEAR' ? 'an' : 'mois'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'TRIALING'
                              ? 'bg-teal-100 text-teal-800'
                              : sub.status === 'PAUSED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleForceRenew(sub.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px] transition cursor-pointer"
                          title="Simuler un renouvellement automatique avec génération de facture et écriture comptable"
                        >
                          Simuler Renouvellement
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & REFUNDS */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Facturation, Justificatifs & Remboursements
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Numéro</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Montant TTC</th>
                  <th className="py-2.5 px-3">TVA</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(inv.issuedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {inv.totalAmount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {inv.taxAmount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'REFUNDED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-[11px] cursor-pointer"
                      >
                        Consulter
                      </button>
                      {inv.status === 'PAID' && inv.totalAmount > 0 && (
                        <button
                          onClick={() =>
                            setRefundModalData({
                              subscriptionId: inv.subscriptionId,
                              invoiceId: inv.id,
                              invoiceNumber: inv.invoiceNumber,
                              amount: inv.totalAmount,
                              currency: inv.currency,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 font-bold text-[11px] cursor-pointer"
                        >
                          Rembourser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MANUAL GRANTS */}
      {activeSubTab === 'grants' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Historique des Accès Grâcieux & Privilèges Offerts
            </h3>
            <button
              onClick={() => setIsGrantModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 cursor-pointer"
            >
              + Nouvel Octroi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Bénéficiaire</th>
                  <th className="py-2.5 px-3">Plan Offert</th>
                  <th className="py-2.5 px-3">Motif</th>
                  <th className="py-2.5 px-3">Date Expiration</th>
                  <th className="py-2.5 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grants.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{g.userEmail}</td>
                    <td className="py-3 px-3 font-bold text-teal-800">{g.planName}</td>
                    <td className="py-3 px-3 text-slate-600">{g.reason}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(g.endAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                        {g.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal for Admin */}
      {selectedInvoiceForView && (
        <SubscriptionInvoiceModal
          invoice={selectedInvoiceForView}
          onClose={() => setSelectedInvoiceForView(null)}
        />
      )}

      {/* Refund Confirm Modal */}
      {refundModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Confirmer le Remboursement
              </h3>
              <p className="text-slate-500 font-mono text-[11px]">
                Facture {refundModalData.invoiceNumber} • Montant : {refundModalData.amount.toFixed(2)} {refundModalData.currency}
              </p>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Motif du remboursement (Audit comptable) :</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModalData(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleProcessRefund}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer"
              >
                Valider le remboursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center">
                <Gift className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Octroyer un Accès Premium Gracieux
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Geste commercial, protocole d’étude ou partenariat.
                </p>
              </div>
            </div>

            <form onSubmit={handleProcessGrant} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Utilisateur bénéficiaire :</label>
                <select
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">-- Sélectionner un utilisateur --</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Formule à attribuer :</label>
                <select
                  value={grantPlanId}
                  onChange={(e) => setGrantPlanId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Durée (Jours) :</label>
                  <input
                    type="number"
                    min="1"
                    max="730"
                    value={grantDurationDays}
                    onChange={(e) => setGrantDurationDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Date d’expiration :</label>
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-600 font-mono">
                    {new Date(Date.now() + grantDurationDays * 86400000).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Motif de l’octroi :</label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Ex : Geste support, étude clinique..."
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer"
                >
                  Accorder les privilèges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
