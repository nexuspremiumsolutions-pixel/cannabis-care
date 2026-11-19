import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MarketingCampaign,
  MarketingCoupon,
  MerchandisingPlacement,
} from '../../types/entities';
import {
  Megaphone,
  Tag,
  ShieldCheck,
  QrCode,
  TrendingUp,
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Percent,
  Copy,
  ExternalLink,
  Download,
  Search,
  Filter,
  Eye,
  MousePointerClick,
  ShoppingBag,
  Coins,
} from 'lucide-react';

interface ComplianceResult {
  isCompliant: boolean;
  score: number;
  detectedViolations: string[];
  suggestions: string[];
  applicableFramework: string;
}

export const MarketingView: React.FC = () => {
  const { user, token } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'coupons' | 'compliance' | 'qr' | 'analytics'>('campaigns');

  // Campaigns state
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [coupons, setCoupons] = useState<MarketingCoupon[]>([]);
  const [placements, setPlacements] = useState<MerchandisingPlacement[]>([]);
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Compliance Scanner state
  const [complianceText, setComplianceText] = useState<string>(
    'Notre extrait premium de chanvre biologique favorise la sérénité et le sommeil réparateur grâce à sa pureté certifiée en laboratoire.'
  );
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [isScanningCompliance, setIsScanningCompliance] = useState<boolean>(false);

  // QR Generator state
  const [qrCampaignSlug, setQrCampaignSlug] = useState<string>('printemps-naturel');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrTrackedUrl, setQrTrackedUrl] = useState<string>('');

  // New Campaign Form Modal
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    type: 'SEASONAL',
    budget: 1500,
    startAt: new Date().toISOString().split('T')[0],
    endAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    accentColor: '#059669',
    badgeText: 'Offre Limitée',
    heroBannerUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=80',
  });

  // New Coupon Form Modal
  const [isNewCouponOpen, setIsNewCouponOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    value: 15,
    promotionType: 'PERCENTAGE',
    minimumOrderAmount: 40,
    fundingSource: 'SHARED',
    partnerFundingRatio: 50,
    usageLimit: 200,
  });

  // Load initial marketing data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [campRes, coupRes, merchRes, anaRes] = await Promise.all([
        fetch('/api/marketing/campaigns'),
        fetch('/api/marketing/coupons'),
        fetch('/api/marketing/merchandising'),
        fetch('/api/marketing/analytics/overview'),
      ]);

      if (campRes.ok) {
        const d = await campRes.json();
        setCampaigns(d.campaigns || []);
      }
      if (coupRes.ok) {
        const d = await coupRes.json();
        setCoupons(d.coupons || []);
      }
      if (merchRes.ok) {
        const d = await merchRes.json();
        setPlacements(d.placements || []);
      }
      if (anaRes.ok) {
        const d = await anaRes.json();
        setAnalyticsOverview(d.overview || null);
      }
    } catch (err) {
      console.error('Error loading marketing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run compliance check
  const handleCheckCompliance = async () => {
    if (!complianceText.trim()) return;
    setIsScanningCompliance(true);
    try {
      const res = await fetch('/api/marketing/compliance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: complianceText, countryCode: 'FR' }),
      });
      const data = await res.json();
      if (res.ok) {
        setComplianceResult(data);
      }
    } catch (err) {
      console.error('Compliance check failed:', err);
    } finally {
      setIsScanningCompliance(false);
    }
  };

  // Generate QR code
  const handleGenerateQr = async () => {
    try {
      const res = await fetch(`/api/marketing/qr?campaignSlug=${qrCampaignSlug}`);
      if (res.ok) {
        const data = await res.json();
        setQrSvg(data.qr?.qrSvg || '');
        setQrTrackedUrl(data.qr?.trackedUrl || '');
      }
    } catch (err) {
      console.error('QR code generation failed:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'qr') {
      handleGenerateQr();
    }
    if (activeSubTab === 'compliance' && !complianceResult) {
      handleCheckCompliance();
    }
  }, [activeSubTab]);

  // Create Campaign submit
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsNewCampaignOpen(false);
        fetchData();
      } else {
        alert(data.error || 'Erreur lors de la création de la campagne.');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur réseau.');
    }
  };

  // Create Coupon submit
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const camp = campaigns[0];
      if (!camp) {
        alert('Créez d’abord une campagne marketing.');
        return;
      }

      // 1. Create Promotion
      const promoRes = await fetch('/api/marketing/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: camp.id,
          name: `Remise ${couponForm.code}`,
          promotionType: couponForm.promotionType,
          value: couponForm.value,
          minimumOrderAmount: couponForm.minimumOrderAmount,
          fundingSource: couponForm.fundingSource,
          partnerFundingRatio: couponForm.partnerFundingRatio,
        }),
      });
      const promoData = await promoRes.json();
      if (!promoRes.ok || !promoData.promotion) {
        alert(promoData.error || 'Erreur lors de la création de la promotion.');
        return;
      }

      // 2. Create Coupon
      const coupRes = await fetch('/api/marketing/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponForm.code,
          campaignId: camp.id,
          promotionId: promoData.promotion.id,
          description: couponForm.description,
          usageLimit: couponForm.usageLimit,
        }),
      });
      const coupData = await coupRes.json();
      if (coupRes.ok && coupData.success) {
        setIsNewCouponOpen(false);
        fetchData();
      } else {
        alert(coupData.error || 'Erreur lors de la création du code promo.');
      }
    } catch (err: any) {
      alert(err.message || 'Erreur réseau.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 text-white relative overflow-hidden shadow-xl border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Module 15 • Marketing, Promotions & Acquisition
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Moteur Promotionnel, Conformité & Attribution Multi-Boutiques
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Gérez vos campagnes nationales et locales, répartissez le cofinancement des remises (Plateforme & Partenaires), vérifiez la conformité réglementaire de vos allégations botaniques et mesurez le ROI en temps réel.
          </p>
        </div>

        {/* Top Quick Stats Pill */}
        {analyticsOverview && (
          <div className="mt-6 pt-6 border-t border-emerald-800/50 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/30">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Chiffre d'Affaires Stimulé</span>
              <span className="text-lg font-black text-white">{analyticsOverview.totalRevenueInfluenced?.toFixed(2)} €</span>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/30">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Remises Distribuées</span>
              <span className="text-lg font-black text-emerald-300">-{analyticsOverview.totalDiscountsGiven?.toFixed(2)} €</span>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/30">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Commandes Converties</span>
              <span className="text-lg font-black text-white">{analyticsOverview.totalOrders}</span>
            </div>
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-700/30">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Taux de Conversion</span>
              <span className="text-lg font-black text-teal-300">{analyticsOverview.conversionRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'campaigns'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Campagnes & Bannières ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('coupons')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'coupons'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Codes Promo & Subventions ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('compliance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'compliance'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Scanner de Conformité Botanique</span>
        </button>

        <button
          onClick={() => setActiveSubTab('qr')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'qr'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>QR Codes & PLV Boutiques</span>
        </button>

        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Attribution & ROI Partenaires</span>
        </button>
      </div>

      {/* SubTab 1: Campagnes & Merchandising */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Campagnes Marketing Actives</h3>
              <p className="text-xs text-slate-500">Planification des opérations commerciales, bannières et budgets alloués.</p>
            </div>
            <button
              onClick={() => setIsNewCampaignOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une Campagne</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {campaigns.map((camp) => {
              const pctSpent = Math.min(100, Math.round((camp.budgetSpent / (camp.budget || 1)) * 100));
              return (
                <div
                  key={camp.id}
                  className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <img
                      src={camp.heroBannerUrl}
                      alt={camp.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs"
                          style={{ backgroundColor: camp.accentColor || '#059669' }}
                        >
                          {camp.badgeText || camp.type}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            camp.status === 'ACTIVE'
                              ? 'bg-emerald-500 text-white'
                              : camp.status === 'SCHEDULED'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-500 text-white'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white">{camp.name}</h4>
                        <p className="text-xs text-slate-200 line-clamp-1">{camp.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Période de validité :
                        </span>
                        <span className="font-semibold text-slate-800">
                          {new Date(camp.startAt).toLocaleDateString('fr-FR')} au {new Date(camp.endAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Pays ciblés :</span>
                        <div className="flex gap-1">
                          {camp.countryCodes.map((cc) => (
                            <span key={cc} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                              {cc}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Budget engagé :</span>
                          <span className="font-bold text-slate-800">
                            {camp.budgetSpent} € / {camp.budget} € ({pctSpent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pctSpent}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Conforme DDPP & EFSA
                      </span>
                      <button
                        onClick={() => {
                          setQrCampaignSlug(camp.slug);
                          setActiveSubTab('qr');
                        }}
                        className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Générer QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 2: Codes Promo & Subventions */}
      {activeSubTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Codes Promotionnels & Répartition Financière</h3>
              <p className="text-xs text-slate-500">
                Chaque bon de réduction applique automatiquement le split de subvention entre la Plateforme Nexus et la Boutique Partenaire.
              </p>
            </div>
            <button
              onClick={() => setIsNewCouponOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Créer un Code Promo</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Code Promo</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Utilisations</th>
                  <th className="p-4">Prise en Charge (Split)</th>
                  <th className="p-4">Validité</th>
                  <th className="p-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono font-black text-emerald-800 text-sm tracking-wider">
                      {c.code}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs">{c.description}</td>
                    <td className="p-4 font-bold text-slate-800">
                      {c.usageCount} / {c.usageLimit || '∞'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        Plateforme 50% • Artisan 50%
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      Jusqu'au {new Date(c.validUntil).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Scanner de Conformité Réglementaire */}
      {activeSubTab === 'compliance' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Vérificateur Réglementaire d'Allégations Botaniques</h3>
            <p className="text-xs text-slate-500">
              Analyse sémantique stricte des textes promotionnels et bannières selon les décrets européens (EFSA, CE n°1924/2006) et français (DDPP, ANSM).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Box */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <label className="block text-xs font-extrabold text-slate-800">Texte de l'annonce ou de la bannière :</label>
              <textarea
                rows={5}
                value={complianceText}
                onChange={(e) => setComplianceText(e.target.value)}
                placeholder="Saisissez ici le texte promotionnel pour vérifier son éligibilité légale..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-600 font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Réglementation active : France (DDPP) & UE</span>
                <button
                  onClick={handleCheckCompliance}
                  disabled={isScanningCompliance || !complianceText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isScanningCompliance ? 'Analyse en cours...' : 'Vérifier la Conformité'}</span>
                </button>
              </div>
            </div>

            {/* Result Box */}
            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Résultat du Contrôle Légal</h4>

              {complianceResult ? (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-2xl border flex items-center gap-3 ${
                      complianceResult.isCompliant
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {complianceResult.isCompliant ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-black">
                        {complianceResult.isCompliant
                          ? 'Texte Conforme (Allégations Légitimes de Bien-être)'
                          : 'Infraction Détectée : Allégations Médicales Interdites'}
                      </div>
                      <div className="text-[11px] opacity-80">
                        Score de conformité : {complianceResult.score}/100 • {complianceResult.applicableFramework}
                      </div>
                    </div>
                  </div>

                  {complianceResult.detectedViolations.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-1">
                      <span className="font-bold text-rose-800">Termes illégaux relevés :</span>
                      <ul className="list-disc pl-4 text-[11px] text-rose-700 space-y-0.5">
                        {complianceResult.detectedViolations.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {complianceResult.suggestions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs space-y-1">
                      <span className="font-bold text-emerald-800">Recommandations de reformulation légale :</span>
                      <ul className="list-disc pl-4 text-[11px] text-emerald-700 space-y-0.5">
                        {complianceResult.suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Cliquez sur « Vérifier la Conformité » pour analyser le texte.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: QR Codes & PLV Magasin */}
      {activeSubTab === 'qr' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Générateur de QR Codes & PLV Vitrine</h3>
            <p className="text-xs text-slate-500">
              Générez des QR codes vectoriels pour les comptoirs et vitrines des boutiques physiques avec marquage UTM automatique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
              <label className="block text-xs font-bold text-slate-700">Sélectionner la campagne ciblée :</label>
              <select
                value={qrCampaignSlug}
                onChange={(e) => setQrCampaignSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateQr}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Régénérer le QR Code Vectoriel</span>
              </button>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-slate-600 text-[10px] uppercase tracking-wider block">URL Trackée Directe :</span>
                <span className="font-mono text-[11px] text-teal-900 break-all select-all block">
                  {qrTrackedUrl || 'Chargement...'}
                </span>
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-white flex flex-col items-center justify-center space-y-4 text-center shadow-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-md">
                {qrSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                    Chargement QR...
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                Scannez avec un smartphone pour tester le parcours d'acquisition fluide.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 5: Analytics & Attribution */}
      {activeSubTab === 'analytics' && analyticsOverview && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Entonnoir d'Attribution & Retour sur Investissement</h3>
            <p className="text-xs text-slate-500">
              Mesure de l'efficacité publicitaire et répartition des coûts d'acquisition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <Eye className="w-4 h-4 text-teal-600" /> Impressions Campagnes
              </div>
              <div className="text-2xl font-black text-slate-900">{analyticsOverview.totalImpressions}</div>
              <span className="text-[11px] text-slate-400">Vues sur bannières et fiches</span>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <MousePointerClick className="w-4 h-4 text-teal-600" /> Clics Enregistrés
              </div>
              <div className="text-2xl font-black text-slate-900">{analyticsOverview.totalClicks}</div>
              <span className="text-[11px] text-slate-400">CTR moyen : 3.8%</span>
            </div>

            <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <Coins className="w-4 h-4 text-emerald-600" /> Multiplicateur ROI
              </div>
              <div className="text-2xl font-black text-emerald-800">{analyticsOverview.roiMultiplier}x</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Chaque euro investi génère {analyticsOverview.roiMultiplier} €</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Campaign */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Nouvelle Campagne Marketing</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom de la Campagne</label>
                <input
                  type="text"
                  required
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Ex: Équilibre & Sérénité d'Automne"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Ex: -15% sur tous les extraits floraux certifiés"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date de Début</label>
                  <input
                    type="date"
                    required
                    value={campaignForm.startAt}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startAt: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date de Fin</label>
                  <input
                    type="date"
                    required
                    value={campaignForm.endAt}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endAt: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Budget Alloué (€)</label>
                <input
                  type="number"
                  min={100}
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, budget: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800"
                >
                  Valider et Publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Coupon */}
      {isNewCouponOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Nouveau Code Promo & Split Subvention</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Code Promo (en majuscules)</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: AUTUMN15, FLOWER20"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  placeholder="Ex: 15% de remise sur le panier dès 40€"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pourcentage de Remise (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Panier Minimum (€)</label>
                  <input
                    type="number"
                    min={0}
                    value={couponForm.minimumOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minimumOrderAmount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1">
                <span className="font-bold block">Prise en charge du cofinancement :</span>
                <span className="text-[11px] block">
                  50% absorbé par la Plateforme Nexus (subvention) • 50% absorbé par la boutique partenaire.
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCouponOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800"
                >
                  Créer le Code Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
