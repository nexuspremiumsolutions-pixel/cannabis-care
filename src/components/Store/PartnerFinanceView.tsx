import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  RefreshCw,
  FileText,
  Lock,
  Layers,
  HelpCircle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  PartnerBalance,
  PartnerFinancialAccount,
  FinancialLedgerEntry,
  PayoutRecord,
  TransferRecord,
} from '../../types/entities';

export const PartnerFinanceView: React.FC = () => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'payouts' | 'refunds' | 'disputes'>('overview');
  const [balanceData, setBalanceData] = useState<{
    balance: PartnerBalance;
    account: PartnerFinancialAccount;
    kpis: any;
  } | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<FinancialLedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [isRequestingPayout, setIsRequestingPayout] = useState<boolean>(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [isGeneratingOnboarding, setIsGeneratingOnboarding] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Refund Form State
  const [refundOrderId, setRefundOrderId] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Retour produit conforme');
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);

  const fetchFinancialData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [resB, resT] = await Promise.all([
        fetch('/api/finance/partner/balance', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/finance/partner/transactions', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resB.ok) {
        const dataB = await resB.json();
        setBalanceData(dataB);
      }
      if (resT.ok) {
        const dataT = await resT.json();
        setLedgerEntries(dataT.ledger || []);
        setPayouts(dataT.payouts || []);
        setTransfers(dataT.transfers || []);
      }
    } catch (e) {
      console.error('Error fetching partner finance:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [token]);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsRequestingPayout(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/finance/partner/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: payoutAmount ? Number(payoutAmount) : undefined }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setPayoutAmount('');
        fetchFinancialData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Erreur lors de la demande de reversement' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsProcessingRefund(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/finance/partner/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          globalOrderId: refundOrderId,
          amount: refundAmount ? Number(refundAmount) : undefined,
          reason: refundReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setRefundOrderId('');
        setRefundAmount('');
        fetchFinancialData();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Erreur lors du remboursement' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleStartOnboarding = async () => {
    if (!token) return;
    setIsGeneratingOnboarding(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/finance/partner/onboarding-link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setOnboardingUrl(data.url);
        setActionMessage({
          type: 'success',
          text: 'Lien sécurisé Stripe Connect généré. Cliquez sur « Ouvrir le portail Stripe KYC » ci-dessous pour finaliser la vérification.',
        });
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Impossible de générer le lien de vérification' });
      }
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e.message });
    } finally {
      setIsGeneratingOnboarding(false);
    }
  };

  const kpis = balanceData?.kpis;
  const account = balanceData?.account;
  const balance = balanceData?.balance;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-teal-400" />
              <span>Espace Financier Vendeur & Reversements • Module 10</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Gestion Financière, Rapprochements & Virements
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Consultez vos ventes nettes, vos allocations automatiques certifiées, demandez vos reversements par virement SEPA et pilotez vos flux en toute transparence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/finance/partner/export"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Relevé CSV</span>
            </a>
            <button
              onClick={fetchFinancialData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Account Verification & KYC Status Card */}
      {account && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Compte Bancaire Partenaire & Connect</h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    account.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : account.status === 'ONBOARDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {account.status === 'ACTIVE' ? 'Certifié & Actif' : account.status === 'ONBOARDING' ? 'Vérification en cours' : account.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fournisseur : <span className="font-semibold text-slate-700">{account.provider}</span> • Réf compte : <span className="font-mono text-slate-600">{account.providerAccountId}</span>
              </p>
              {account.requirementsStatus?.currentlyDue && account.requirementsStatus.currentlyDue.length > 0 && (
                <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Pièces requises pour débloquer les virements : {account.requirementsStatus.currentlyDue.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartOnboarding}
              disabled={isGeneratingOnboarding}
              className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingOnboarding ? 'animate-spin' : ''}`} />
              <span>{isGeneratingOnboarding ? 'Génération...' : 'Vérifier mon identité (KYC/KYB)'}</span>
            </button>
            {onboardingUrl && (
              <a
                href={onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Ouvrir le portail Stripe KYC</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CA Brut Encaissé</span>
          <p className="text-2xl font-black text-slate-900">
            {kpis?.totalGrossRevenue ? kpis.totalGrossRevenue.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-slate-500 block">Total articles + livraison</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Commission Nexus (6%)</span>
          <p className="text-2xl font-black text-teal-800">
            {kpis?.totalCommissionNexus ? kpis.totalCommissionNexus.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-teal-600 block">Frais de service plateforme</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">CA Net Vendeur</span>
          <p className="text-2xl font-black text-emerald-700">
            {kpis?.totalNetRevenue ? kpis.totalNetRevenue.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-emerald-600 block">Après déduction commission</span>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">Disponible Virement</span>
          <p className="text-2xl font-black text-teal-950">
            {balance?.availableAmount !== undefined ? balance.availableAmount.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-teal-800 font-bold block">Prêt pour versement</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Déjà Reversé (Payouts)</span>
          <p className="text-2xl font-black text-indigo-800">
            {balance?.paidAmount !== undefined ? balance.paidAmount.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-indigo-600 block">Versé sur votre IBAN</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Remboursements</span>
          <p className="text-2xl font-black text-amber-800">
            {balance?.refundedAmount !== undefined ? balance.refundedAmount.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-amber-600 block">{kpis?.completedOrdersCount || 0} commandes livrées</span>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-bold text-slate-500 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Vue d&apos;ensemble & Payout Express</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grand Livre Comptable ({ledgerEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'payouts'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Historique des Virements ({payouts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'refunds'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>Émettre un Remboursement</span>
        </button>
      </div>

      {/* Sub-Tab 1: Overview & Payout Express */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Payout Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-teal-700" />
              <span>Demander un Reversement (Payout)</span>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2">
              <span className="text-[11px] font-bold uppercase text-teal-800">Solde Immédiatement Disponible</span>
              <p className="text-3xl font-black text-teal-950">
                {balance?.availableAmount !== undefined ? balance.availableAmount.toFixed(2) : '0.00'} €
              </p>
              <p className="text-[11px] text-teal-900 leading-relaxed">
                Virement direct ordonné via SEPA instantané vers votre compte bancaire professionnel.
              </p>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Montant à virer (€) — Laisser vide pour la totalité
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`Max : ${balance?.availableAmount?.toFixed(2) || '0.00'} €`}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isRequestingPayout || !balance || balance.availableAmount <= 0}
                className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRequestingPayout ? (
                  <span>Ordre de virement en cours...</span>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Virer vers mon IBAN</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Transfers & Allocations */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span>Dernières Allocations de Vente (Sous-Commandes)</span>
            </h3>

            {ledgerEntries.filter((l) => l.type === 'SHOP_ALLOCATION').length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucune vente encore enregistrée sur ce compte boutique.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Commande</th>
                      <th className="pb-2.5">Type</th>
                      <th className="pb-2.5 text-right">Montant Net</th>
                      <th className="pb-2.5 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerEntries
                      .filter((l) => l.type === 'SHOP_ALLOCATION')
                      .slice(0, 6)
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 text-slate-500 font-mono text-[11px]">
                            {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 font-bold text-slate-800">
                            {entry.orderId}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                              Vente Validée
                            </span>
                          </td>
                          <td className="py-3 text-right font-black text-emerald-700">
                            +{entry.amount.toFixed(2)} {entry.currency}
                          </td>
                          <td className="py-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sub-Tab 2: Grand Livre Comptable */}
      {activeTab === 'ledger' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grand Livre Financier Décentralisé</h3>
              <p className="text-xs text-slate-500">
                Registre immuable traçant chaque crédit (vente) et débit (remboursement, virement).
              </p>
            </div>
            <a
              href="/api/finance/partner/export"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger l&apos;intégralité (CSV)</span>
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Horodatage</th>
                  <th className="pb-3">Type d&apos;Écriture</th>
                  <th className="pb-3">Sens</th>
                  <th className="pb-3">Description & Détails</th>
                  <th className="pb-3 text-right">Montant</th>
                  <th className="pb-3 text-right">Réf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {ledgerEntries.map((e) => {
                  const isCredit = e.direction === 'CREDIT';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3 text-slate-500">
                        {new Date(e.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            e.type === 'SHOP_ALLOCATION'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : e.type === 'REFUND'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {e.type}
                        </span>
                      </td>
                      <td className="py-3 font-bold">
                        <span className={isCredit ? 'text-emerald-700' : 'text-rose-700'}>
                          {e.direction}
                        </span>
                      </td>
                      <td className="py-3 font-sans text-slate-700 max-w-xs truncate">
                        {e.description}
                      </td>
                      <td className={`py-3 text-right font-black ${isCredit ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {isCredit ? '+' : '-'}{e.amount.toFixed(2)} {e.currency}
                      </td>
                      <td className="py-3 text-right text-slate-400 truncate max-w-[100px]">
                        {e.orderId}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Historique Payouts */}
      {activeTab === 'payouts' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Historique des Virements Émis vers votre Banque</h3>

          {payouts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucun virement sortant ordonné pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Date d&apos;Ordre</th>
                    <th className="pb-3">Réf. Virement</th>
                    <th className="pb-3">Fournisseur</th>
                    <th className="pb-3">Date d&apos;Arrivée Estimée</th>
                    <th className="pb-3 text-right">Montant Viré</th>
                    <th className="pb-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-800">{p.id}</td>
                      <td className="py-3 text-slate-600">{p.provider}</td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {p.arrivalDate ? new Date(p.arrivalDate).toLocaleDateString('fr-FR') : 'J+1 ouvré'}
                      </td>
                      <td className="py-3 text-right font-black text-slate-900">
                        {p.amount.toFixed(2)} {p.currency}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Émettre un Remboursement */}
      {activeTab === 'refunds' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-rose-700" />
              <span>Émettre un Remboursement Partiel ou Total</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Le remboursement est strictement circonscrit à votre boutique. La commission de 6% est automatiquement recalculée et réajustée dans votre grand livre.
            </p>
          </div>

          <form onSubmit={handleProcessRefund} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Identifiant de Commande Globale (ex: gord_...)
              </label>
              <input
                type="text"
                required
                placeholder="gord_sample_demo_101"
                value={refundOrderId}
                onChange={(e) => setRefundOrderId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Montant à rembourser (€) — Laisser vide pour rembourser toute votre sous-commande
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Montant spécifique ou total"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif du Remboursement</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500"
              >
                <option value="Retour produit conforme">Retour produit conforme dans délai rétractation</option>
                <option value="Rupture de stock imprévue">Rupture de stock imprévue</option>
                <option value="Produit endommagé pendant transport">Produit endommagé pendant transport</option>
                <option value="Accord commercial boutique">Accord commercial boutique</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isProcessingRefund || !refundOrderId}
              className="w-full py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isProcessingRefund ? (
                <span>Validation du remboursement...</span>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Confirmer le Remboursement Immédiat</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
