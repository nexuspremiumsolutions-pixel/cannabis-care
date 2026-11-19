import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  TrendingUp,
  CreditCard,
  DollarSign,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Layers,
  Search,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Scale,
} from 'lucide-react';
import {
  FinancialLedgerEntry,
  PartnerBalance,
  SupportedCountryConfig,
  FinancialReconciliationIssue,
} from '../../types/entities';

export const AdminFinanceView: React.FC = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'partners' | 'reconciliation' | 'providers' | 'adjustment'>('overview');
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<FinancialLedgerEntry[]>([]);
  const [countries, setCountries] = useState<SupportedCountryConfig[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [reconciliationReport, setReconciliationReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter for ledger
  const [ledgerFilterType, setLedgerFilterType] = useState<string>('');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  // Manual Adjustment Form
  const [adjShopId, setAdjShopId] = useState<string>('shop_botanique_marais');
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjDirection, setAdjDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjJustification, setAdjJustification] = useState<string>('');
  const [isSubmittingAdj, setIsSubmittingAdj] = useState<boolean>(false);

  const fetchOverview = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [resO, resL, resC, resP, resR] = await Promise.all([
        fetch('/api/finance/admin/overview', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/finance/admin/ledger?limit=150', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/finance/countries', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/finance/providers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/finance/admin/reconciliation', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resO.ok) setOverviewData(await resO.json());
      if (resL.ok) {
        const lData = await resL.json();
        setLedgerEntries(lData.entries || []);
      }
      if (resC.ok) {
        const cData = await resC.json();
        setCountries(cData.countries || []);
      }
      if (resP.ok) {
        const pData = await resP.json();
        setProviders(pData.providers || []);
      }
      if (resR.ok) {
        const rData = await resR.json();
        setReconciliationReport(rData.report);
      }
    } catch (e) {
      console.error('Error fetching admin finance:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  const handleRunReconciliation = async () => {
    if (!token) return;
    setIsAuditing(true);
    try {
      const res = await fetch('/api/finance/admin/reconciliation/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReconciliationReport(data.report);
        setActionNotice({ type: 'success', message: 'Audit de rapprochement financier exécuté avec succès.' });
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmittingAdj(true);
    setActionNotice(null);

    try {
      const res = await fetch('/api/finance/admin/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId: adjShopId,
          amount: Number(adjAmount),
          direction: adjDirection,
          justification: adjJustification,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionNotice({ type: 'success', message: `Ajustement de ${adjAmount} € enregistré dans le grand livre.` });
        setAdjAmount('');
        setAdjJustification('');
        fetchOverview();
      } else {
        setActionNotice({ type: 'error', message: data.error || 'Erreur lors de l’ajustement' });
      }
    } catch (e: any) {
      setActionNotice({ type: 'error', message: e.message });
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  const kpis = overviewData?.kpis;
  const partnerBalances: PartnerBalance[] = overviewData?.partnersBalances || [];

  const filteredLedger = ledgerEntries.filter((e) => {
    const matchType = ledgerFilterType ? e.type === ledgerFilterType : true;
    const matchSearch = ledgerSearch
      ? e.orderId.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
        (e.shopId && e.shopId.toLowerCase().includes(ledgerSearch.toLowerCase()))
      : true;
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Supervision Financière Globale • Module 10</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Grand Livre, Commissions & Rapprochement Multi-Boutiques
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Surveillance en temps réel des flux marketplace, intégrité des commissions Nexus (6%), séquestre des fonds et certification comptable immuable.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/finance/admin/export"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Export Grand Livre CSV</span>
            </a>
            <button
              onClick={fetchOverview}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <span>{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-700">×</button>
        </div>
      )}

      {/* Global Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Volume GMV Traité</span>
          <p className="text-2xl font-black text-slate-900">
            {kpis?.totalGMV ? kpis.totalGMV.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-slate-500 block">{kpis?.totalPaidOrdersCount || 0} commandes payées</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Commissions Nexus (6%)</span>
          <p className="text-2xl font-black text-teal-800">
            {kpis?.totalPlatformCommissions ? kpis.totalPlatformCommissions.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-teal-600 block">Revenus nets plateforme</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Total Reversé aux Shops</span>
          <p className="text-2xl font-black text-indigo-800">
            {kpis?.totalPaidOutToPartners ? kpis.totalPaidOutToPartners.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-indigo-600 block">Virements bancaires exécutés</span>
        </div>

        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">Solde Disponible Partenaires</span>
          <p className="text-2xl font-black text-teal-950">
            {kpis?.totalAvailableToPartners ? kpis.totalAvailableToPartners.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-teal-800 font-bold block">En attente de reversement</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Remboursements Émis</span>
          <p className="text-2xl font-black text-rose-800">
            {kpis?.totalRefundsIssued ? kpis.totalRefundsIssued.toFixed(2) : '0.00'} €
          </p>
          <span className="text-[11px] text-rose-600 block">Total remboursé aux clients</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Litiges Ouverts</span>
          <p className="text-2xl font-black text-amber-800">
            {kpis?.openDisputesCount || 0}
          </p>
          <span className="text-[11px] text-amber-600 block">Fonds sous séquestre</span>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-bold text-slate-500 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Vue d&apos;ensemble & Soldes Partenaires</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grand Livre Comptable Global ({ledgerEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reconciliation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Rapprochement & Audit Automatique</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'providers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Prestataires & Pays Autorisés</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustment')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'adjustment'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Ajustement Administratif Manuel</span>
        </button>
      </div>

      {/* Tab 1: Overview & Partner Balances */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-700" />
              <span>Soldes & Comptes Séquestres des Boutiques Partenaires</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Règle de virement SEPA : validation à J+1</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Identifiant Boutique</th>
                  <th className="pb-3 text-right">Solde Disponible</th>
                  <th className="pb-3 text-right">Déjà Reversé (Payouts)</th>
                  <th className="pb-3 text-right">Remboursements</th>
                  <th className="pb-3 text-right">Sous Séquestre (Litiges)</th>
                  <th className="pb-3 text-right">Dernière Mise à Jour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {partnerBalances.map((b) => (
                  <tr key={b.shopId} className="hover:bg-slate-50">
                    <td className="py-3 font-bold font-sans text-slate-900">
                      {b.shopId}
                    </td>
                    <td className="py-3 text-right font-black text-emerald-700">
                      {b.availableAmount.toFixed(2)} {b.currency}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-700">
                      {b.paidAmount.toFixed(2)} {b.currency}
                    </td>
                    <td className="py-3 text-right text-rose-700">
                      {b.refundedAmount.toFixed(2)} {b.currency}
                    </td>
                    <td className="py-3 text-right text-amber-700">
                      {b.disputedAmount.toFixed(2)} {b.currency}
                    </td>
                    <td className="py-3 text-right text-slate-400 font-sans text-[10px]">
                      {new Date(b.updatedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Grand Livre Global */}
      {activeTab === 'ledger' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grand Livre Financier Centralisé</h3>
              <p className="text-xs text-slate-500">Registre immuable conforme pour audits légaux et fiscaux.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ledgerFilterType}
                onChange={(e) => setLedgerFilterType(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden"
              >
                <option value="">Tous les types d&apos;écriture</option>
                <option value="CUSTOMER_CHARGE">Charges Clients</option>
                <option value="PLATFORM_FEE">Commissions Plateforme</option>
                <option value="SHOP_ALLOCATION">Allocations Vendeurs</option>
                <option value="PAYMENT_PROCESSING_FEE">Frais Traitement PSP</option>
                <option value="REFUND">Remboursements</option>
                <option value="PAYOUT">Virements Sortants (Payouts)</option>
                <option value="TRANSFER">Transferts Connect</option>
                <option value="ADJUSTMENT">Ajustements Manuels</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Recherche commande ou boutique..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Horodatage</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Sens</th>
                  <th className="pb-3">Réf. Commande</th>
                  <th className="pb-3">Boutique</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLedger.map((e) => {
                  const isCredit = e.direction === 'CREDIT';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2.5 text-slate-500">
                        {new Date(e.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            e.type === 'CUSTOMER_CHARGE'
                              ? 'bg-blue-50 text-blue-800'
                              : e.type === 'PLATFORM_FEE'
                              ? 'bg-teal-50 text-teal-800'
                              : e.type === 'SHOP_ALLOCATION'
                              ? 'bg-emerald-50 text-emerald-800'
                              : e.type === 'REFUND'
                              ? 'bg-rose-50 text-rose-800'
                              : 'bg-indigo-50 text-indigo-800'
                          }`}
                        >
                          {e.type}
                        </span>
                      </td>
                      <td className={`py-2.5 font-bold ${isCredit ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {e.direction}
                      </td>
                      <td className="py-2.5 font-bold text-slate-800 truncate max-w-[120px]">
                        {e.orderId}
                      </td>
                      <td className="py-2.5 text-slate-600 font-sans truncate max-w-[120px]">
                        {e.shopId || '—'}
                      </td>
                      <td className="py-2.5 text-slate-700 font-sans truncate max-w-xs">
                        {e.description}
                      </td>
                      <td className={`py-2.5 text-right font-black ${isCredit ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {isCredit ? '+' : '-'}{e.amount.toFixed(2)} {e.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reconciliation & Audit */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>Moteur de Rapprochement Comptable Automatique</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Vérifie l&apos;équilibre mathématique strict : Débit Client = Allocations Vendeurs + Commissions Plateforme.
              </p>
            </div>

            <button
              onClick={handleRunReconciliation}
              disabled={isAuditing}
              className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>Lancer l&apos;audit instantané</span>
            </button>
          </div>

          {reconciliationReport && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Commandes Auditées</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{reconciliationReport.totalOrdersAudited}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Rapprochements Conformes</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{reconciliationReport.matchedCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Anomalies Détectées</span>
                <p className="text-2xl font-black text-amber-800 mt-1">{reconciliationReport.issuesCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-indigo-700 uppercase">Volume Global Vérifié</span>
                <p className="text-2xl font-black text-indigo-800 mt-1">{reconciliationReport.totalVolumeCharged.toFixed(2)} €</p>
              </div>
            </div>
          )}

          {reconciliationReport?.issues && reconciliationReport.issues.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Registre des Alertes & Écarts Rapprochés
              </h4>
              <div className="space-y-2">
                {reconciliationReport.issues.map((issue: FinancialReconciliationIssue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-2xl border text-xs flex items-start gap-3 ${
                      issue.severity === 'MATCHED'
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : issue.severity === 'WARNING'
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-2">
                        <span>{issue.type}</span>
                        <span className="text-[10px] font-mono opacity-75">({issue.referenceId})</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{issue.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Providers & Countries */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-700" />
              <span>Passerelles de Paiement Marketplace</span>
            </h3>
            <div className="space-y-3">
              {providers.map((p) => (
                <div key={p.name} className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      Actif
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mode Connect : Charges & Transferts Séparés • Split automatique vers les sous-comptes vendeurs.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(p.capabilities || {}).map(([cap, val]) => (
                      <span
                        key={cap}
                        className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                          val ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {cap}: {val ? 'Oui' : 'Non'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>Pays & Devises Autorisés (Conformité Phytocannabinoïdes)</span>
            </h3>
            <div className="space-y-2">
              {countries.map((c) => (
                <div key={c.countryCode} className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{c.countryName} ({c.countryCode})</span>
                    <p className="text-[11px] text-slate-400">Devise : {c.currency} • Vente directe autorisée</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                    Actif
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 5: Ajustement Administratif Manuel */}
      {activeTab === 'adjustment' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs max-w-xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-700" />
              <span>Ajustement Financier d&apos;Équilibre (Compensatoire)</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pour des raisons d&apos;audit strict, toute modification manuelle d&apos;un solde vendeur génère une écriture immuable horodatée dans le grand livre avec justification obligatoire.
            </p>
          </div>

          <form onSubmit={handleCreateAdjustment} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Boutique Bénéficiaire / Débitée</label>
              <select
                value={adjShopId}
                onChange={(e) => setAdjShopId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden"
              >
                {partnerBalances.map((b) => (
                  <option key={b.shopId} value={b.shopId}>{b.shopId}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="ex: 25.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Sens de l&apos;écriture</label>
                <select
                  value={adjDirection}
                  onChange={(e) => setAdjDirection(e.target.value as any)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden"
                >
                  <option value="CREDIT">Crédit (+ pour le vendeur)</option>
                  <option value="DEBIT">Débit (- pour le vendeur)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Justification Obligatoire de Conformité</label>
              <textarea
                required
                rows={3}
                placeholder="Exemple : Régularisation d'avoir suite à réclamation transporteur #FR-901..."
                value={adjJustification}
                onChange={(e) => setAdjJustification(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAdj || !adjAmount || !adjJustification}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingAdj ? (
                <span>Enregistrement au grand livre...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span>Enregistrer l&apos;ajustement immuable</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
