import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  SubscriptionPlan,
  SubscriptionPrice,
  Subscription,
  Invoice,
  SubscriptionEvent,
  FeatureEntitlement,
} from '../../types/entities';
import { BotanicalWatermark, BotanicalBadge, BotanicalLeafIcon } from '../Common/BotanicalDecor';
import { SubscribeCheckoutModal } from './SubscribeCheckoutModal';
import { SubscriptionInvoiceModal } from './SubscriptionInvoiceModal';
import {
  Sparkles,
  Check,
  ShieldCheck,
  CreditCard,
  Calendar,
  AlertCircle,
  HelpCircle,
  FileText,
  Clock,
  Pause,
  Play,
  XCircle,
  TrendingUp,
  RefreshCw,
  Gift,
  Building,
  User,
  ArrowRight,
  ChevronRight,
  Info,
} from 'lucide-react';

export const SubscriptionView: React.FC = () => {
  const { token, user, refreshMe } = useAuth();

  const [targetAudience, setTargetAudience] = useState<'USER' | 'PARTNER'>('USER');
  const [billingInterval, setBillingInterval] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [currency, setCurrency] = useState<'EUR' | 'CHF'>('EUR');

  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubData, setCurrentSubData] = useState<{
    plan?: SubscriptionPlan;
    subscription?: Subscription | null;
    grant?: any | null;
    isActivePremium?: boolean;
    entitlements?: Record<string, FeatureEntitlement>;
    invoices?: Invoice[];
    events?: SubscriptionEvent[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<{
    plan: SubscriptionPlan;
    price: SubscriptionPrice;
  } | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [plansRes, meRes] = await Promise.all([
        fetch(`/api/subscriptions/plans?target=${targetAudience}&currency=${currency}`),
        fetch('/api/subscriptions/me', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }

      if (meRes.ok) {
        const mData = await meRes.json();
        setCurrentSubData(mData);
      }
    } catch (err) {
      console.error('Failed to load subscription data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, targetAudience, currency]);

  // Subscription Lifecycle Handlers
  const handlePause = async () => {
    if (!currentSubData?.subscription?.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/subscriptions/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscriptionId: currentSubData.subscription.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ text: 'Abonnement mis en pause avec succès.', type: 'success' });
      await fetchData();
      await refreshMe();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!currentSubData?.subscription?.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/subscriptions/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscriptionId: currentSubData.subscription.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ text: 'Abonnement réactivé avec succès.', type: 'success' });
      await fetchData();
      await refreshMe();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!currentSubData?.subscription?.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      // Find free price id
      const freePlan = plans.find((p) => p.code === 'FREE' || p.code === 'PARTNER_FREE');
      const freePriceId = freePlan?.prices?.[0]?.id || 'price_free';

      const res = await fetch('/api/subscriptions/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subscriptionId: currentSubData.subscription.id,
          newPriceId: freePriceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ text: data.message, type: 'success' });
      setShowDowngradeConfirm(false);
      await fetchData();
      await refreshMe();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (immediate: boolean = false) => {
    if (!currentSubData?.subscription?.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subscriptionId: currentSubData.subscription.id,
          immediate,
          reason: 'Demande utilisateur depuis l’interface',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionMessage({ text: data.message, type: 'success' });
      setShowCancelConfirm(false);
      await fetchData();
      await refreshMe();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const currentSub = currentSubData?.subscription;
  const isPremiumActive = currentSubData?.isActivePremium;
  const activePlanCode = currentSubData?.plan?.code || 'FREE';

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white p-6 sm:p-10 rounded-3xl border border-emerald-800/20 shadow-xl space-y-4 relative overflow-hidden">
        <BotanicalWatermark position="top-right" size={260} className="text-emerald-400/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-xs">
              <BotanicalLeafIcon size={14} className="text-emerald-400" variant="minimal" />
              <span>NEXUS CARE • ADHÉSION & FORMULES BOTANIQUES</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
              Investissez dans votre Bien-Être en toute Clarté
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Une tarification transparente, sans engagement, conçue pour accompagner votre équilibre et vos rituels naturels.
              Vos données historiques et bilans personnels restent intégralement préservés, même en cas d’arrêt ou de pause.
            </p>
          </div>

          {/* Quick status pill */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">
              Statut Actuel
            </span>
            <span className="text-lg font-black text-white flex items-center justify-end gap-1.5">
              {isPremiumActive ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{currentSubData?.plan?.name || 'Nexus Équilibre'}</span>
                </>
              ) : (
                <span>Formule Découverte (Gratuit)</span>
              )}
            </span>
            <span className="text-[11px] text-slate-300 block">
              {currentSub?.status === 'TRIALING'
                ? `Essai en cours jusqu’au ${new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                : currentSub?.status === 'ACTIVE'
                ? `Prochain renouvellement le ${new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                : 'Accès standard sans frais'}
            </span>
          </div>
        </div>

        {/* Global Action Message */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-white/60 hover:text-white text-[11px] underline"
            >
              Fermer
            </button>
          </div>
        )}
      </div>

      {/* 2. Active Subscription Management Panel (If subscribed or trialing or paused) */}
      {currentSub && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Gestion de votre Abonnement Actuel
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      currentSub.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentSub.status === 'TRIALING'
                        ? 'bg-teal-100 text-teal-800'
                        : currentSub.status === 'PAUSED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {currentSub.status === 'TRIALING'
                      ? 'Période d’essai'
                      : currentSub.status === 'ACTIVE'
                      ? 'Actif'
                      : currentSub.status === 'PAUSED'
                      ? 'En pause'
                      : currentSub.status}
                  </span>
                  {currentSub.cancelAtPeriodEnd && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Résiliation programmée
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Formule {currentSubData?.plan?.name} • ID : <span className="font-mono">{currentSub.id}</span>
                </p>
              </div>
            </div>

            {/* Lifecycle Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {currentSub.status === 'ACTIVE' && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Suspendre temporairement l’abonnement sans perdre vos données"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mettre en pause</span>
                </button>
              )}

              {currentSub.status === 'PAUSED' && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 text-teal-300" />
                  <span>Reprendre l’abonnement</span>
                </button>
              )}

              {!currentSub.cancelAtPeriodEnd && currentSub.status !== 'CANCELED' && (
                <>
                  <button
                    onClick={() => setShowDowngradeConfirm(true)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Rétrograder vers Découverte</span>
                  </button>

                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={actionLoading}
                    className="px-3.5 py-2 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Résilier</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Période en cours</span>
              <p className="font-extrabold text-slate-900 text-sm">
                Du {new Date(currentSub.currentPeriodStart).toLocaleDateString('fr-FR')} au{' '}
                {new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-[11px] text-slate-500">
                {currentSub.cancelAtPeriodEnd
                  ? 'Prendra fin automatiquement à cette date.'
                  : 'Renouvellement automatique tacite.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Moyen de paiement</span>
              <p className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <span>Carte bancaire simulée (•••• 4242)</span>
              </p>
              <p className="text-[11px] text-slate-500">Sécurisé via passerelle intégrée</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sauvegarde des Données</span>
              <p className="font-extrabold text-teal-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Garantie Intégrité RGPD</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Toutes vos saisies de journal et bilans restent conservés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Controls Bar: Target toggle + Billing Interval toggle + Currency toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Audience Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setTargetAudience('USER')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              targetAudience === 'USER'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Particuliers (Santé & Équilibre)</span>
          </button>
          <button
            onClick={() => setTargetAudience('PARTNER')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              targetAudience === 'PARTNER'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Boutiques & Professionnels (Pro)</span>
          </button>
        </div>

        {/* Billing cycle & Currency */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Monthly / Yearly Switch */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setBillingInterval('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                billingInterval === 'MONTH'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('YEAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                billingInterval === 'YEAR'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annuel</span>
              <span className="px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black">
                -17% (2 mois offerts)
              </span>
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setCurrency('EUR')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                currency === 'EUR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              EUR €
            </button>
            <button
              onClick={() => setCurrency('CHF')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                currency === 'CHF' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              CHF
            </button>
          </div>
        </div>
      </div>

      {/* 4. Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const matchingPrice =
            plan.prices.find((p: SubscriptionPrice) => p.interval === billingInterval) ||
            plan.prices[0] || {
              id: 'free',
              amount: 0,
              currency,
              interval: billingInterval,
              trialDays: 0,
            };

          const isCurrent =
            (currentSub && currentSub.planId === plan.id) || (!currentSub && plan.code === 'FREE');

          const isPopular = plan.isPopular || plan.code === 'PREMIUM' || plan.code === 'PARTNER_PRO';

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                isPopular
                  ? 'bg-white border-2 border-teal-700 shadow-xl ring-4 ring-teal-700/10'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-teal-800 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-teal-300" />
                  <span>Formule Recommandée</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Title & Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                        Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {matchingPrice.amount === 0 ? 'Gratuit' : `${matchingPrice.amount.toFixed(2)} ${matchingPrice.currency}`}
                    </span>
                    {matchingPrice.amount > 0 && (
                      <span className="text-xs text-slate-500 font-semibold">
                        / {matchingPrice.interval === 'YEAR' ? 'an' : 'mois'}
                      </span>
                    )}
                  </div>
                  {matchingPrice.interval === 'YEAR' && matchingPrice.amount > 0 && (
                    <p className="text-[11px] text-teal-700 font-bold mt-1">
                      Soit environ {(matchingPrice.amount / 12).toFixed(2)} {matchingPrice.currency} / mois TTC
                    </p>
                  )}
                  {matchingPrice.trialDays > 0 && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>{matchingPrice.trialDays} jours d’essai gratuit sans frais</span>
                    </p>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Inclus dans cette formule :
                  </span>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    {plan.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isPopular ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="text-[11px] font-medium leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Action Button */}
              <div className="pt-8">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs cursor-default"
                  >
                    Votre formule actuelle
                  </button>
                ) : matchingPrice.amount === 0 ? (
                  <button
                    onClick={handleDowngrade}
                    className="w-full py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-xs transition cursor-pointer"
                  >
                    Revenir à la formule gratuite
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setSelectedPlanForCheckout({
                        plan,
                        price: matchingPrice,
                      })
                    }
                    className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                      isPopular
                        ? 'bg-teal-800 hover:bg-teal-900 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>
                      {matchingPrice.trialDays > 0 ? 'Démarrer l’Essai Gratuit' : 'Passer à cette formule'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-teal-300" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Invoices & Billing History */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Historique des Factures</h3>
              <p className="text-xs text-slate-500">
                Consultez, téléchargez et imprimez vos justificatifs fiscaux conformes.
              </p>
            </div>
          </div>
        </div>

        {currentSubData?.invoices && currentSubData.invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-3">Numéro</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Montant TTC</th>
                  <th className="py-3 px-3">TVA</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSubData.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(inv.issuedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-3 font-extrabold text-slate-900">
                      {inv.totalAmount.toFixed(2)} {inv.currency}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {inv.taxAmount.toFixed(2)} {inv.currency} ({inv.metadata?.country || 'FR'})
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
                        {inv.status === 'PAID' ? 'Payée' : inv.status === 'REFUNDED' ? 'Remboursée' : inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                      >
                        Consulter / Imprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Info className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-700 text-xs">Aucune facture enregistrée pour le moment</p>
            <p className="text-[11px] text-slate-500">
              Vos factures apparaîtront ici lors de vos renouvellements ou souscriptions payantes.
            </p>
          </div>
        )}
      </div>

      {/* 6. FAQ & Ethical Guarantees */}
      <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-4 text-xs text-slate-700">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-teal-700" />
          <span>Foire Aux Questions & Engagements Nexus Care</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1.5">
            <h4 className="font-extrabold text-slate-900 text-xs">
              Puis-je résilier ou suspendre à tout moment ?
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Absolument. Aucun contrat ni engagement de durée. Vous pouvez mettre en pause ou annuler en un clic depuis cette interface. Vous conservez vos droits jusqu’au terme de la période déjà réglée.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-extrabold text-slate-900 text-xs">
              Que deviennent mes bilans et mon historique ?
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Vos données restent 100% conservées. Si vous revenez au forfait gratuit, vos saisies passées ne sont jamais effacées. Notre modèle respecte votre santé et la stricte confidentialité médicale RGPD.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-extrabold text-slate-900 text-xs">
              Comment fonctionne l’essai gratuit de 14 jours ?
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              L’essai vous donne un accès intégral à Nexus Équilibre. Aucun prélèvement n’a lieu durant les 14 jours. Vous recevrez une alerte avant la fin de l’essai pour décider de poursuivre ou d’arrêter.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Subscribe Modal */}
      {selectedPlanForCheckout && (
        <SubscribeCheckoutModal
          plan={selectedPlanForCheckout.plan}
          price={selectedPlanForCheckout.price}
          isOpen={!!selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          onSuccess={() => {
            fetchData();
            refreshMe();
          }}
        />
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <SubscriptionInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Downgrade Reassurance Confirmation Modal */}
      {showDowngradeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Rétrograder vers la formule Découverte ?
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Votre formule restera active jusqu’à la fin de la période en cours ({new Date(currentSub?.currentPeriodEnd || '').toLocaleDateString('fr-FR')}).
              <strong className="text-slate-900 block mt-1">
                Garantie Nexus Care : Aucune de vos entrées de journal ni de vos bilans de santé ne sera supprimée.
              </strong>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDowngradeConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDowngrade}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold cursor-pointer"
              >
                Confirmer la rétrogradation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-rose-700" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Résilier votre abonnement ?
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Votre résiliation prendra effet à la fin de votre cycle de facturation actuel ({new Date(currentSub?.currentPeriodEnd || '').toLocaleDateString('fr-FR')}).
              Vous pouvez également demander une résiliation immédiate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => handleCancel(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold cursor-pointer"
              >
                Résilier à échéance
              </button>
              <button
                onClick={() => handleCancel(true)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-3 py-2 text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
              >
                Résilier immédiatement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
