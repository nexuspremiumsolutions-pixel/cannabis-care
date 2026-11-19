import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { useAuth } from '../../context/AuthContext';
import { getStripePromise, fetchStripeConfig } from '../../lib/stripe';
import { SubscriptionPlan, SubscriptionPrice, TrialEligibility } from '../../types/entities';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  RefreshCw,
  Clock,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface SubscribeCheckoutModalProps {
  plan: SubscriptionPlan;
  price: SubscriptionPrice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRIES = [
  { code: 'FR', name: 'France (TVA 20%)', rate: 0.2 },
  { code: 'CH', name: 'Suisse (TVA 8.1%)', rate: 0.081 },
  { code: 'BE', name: 'Belgique (TVA 21%)', rate: 0.21 },
  { code: 'LU', name: 'Luxembourg (TVA 17%)', rate: 0.17 },
  { code: 'DE', name: 'Allemagne (TVA 19%)', rate: 0.19 },
  { code: 'ES', name: 'Espagne (TVA 21%)', rate: 0.21 },
  { code: 'IT', name: 'Italie (TVA 22%)', rate: 0.22 },
];

interface StripeSubPaymentFormProps {
  amount: number;
  currency: string;
  stripeMode: 'live' | 'test';
  onBack: () => void;
  onPaymentConfirmed: (paymentIntentId: string) => Promise<void>;
  onError: (msg: string) => void;
}

const StripeSubPaymentForm: React.FC<StripeSubPaymentFormProps> = ({
  amount,
  currency,
  stripeMode,
  onBack,
  onPaymentConfirmed,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsConfirming(true);
    onError('');

    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        onError(submitErr.message || 'Veuillez vérifier vos informations de carte.');
        setIsConfirming(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Paiement refusé.');
        setIsConfirming(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        await onPaymentConfirmed(paymentIntent.id);
      } else {
        onError(`Statut de paiement inattendu : ${paymentIntent?.status || 'inconnu'}`);
      }
    } catch (err: any) {
      onError(err?.message || 'Erreur lors du paiement Stripe.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <form onSubmit={handleConfirm} className="space-y-4">
      <div className="p-3.5 rounded-2xl border border-teal-200 bg-teal-50/40 flex items-center justify-between text-xs">
        <span className="font-bold text-teal-950 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-700" /> Stripe Checkout Sécurisé
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
            stripeMode === 'live'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          {stripeMode === 'live' ? 'Production Live' : 'Mode Test Stripe'}
        </span>
      </div>

      <div className="p-4 rounded-2xl border border-slate-200 bg-white min-h-[160px]">
        {!isReady && (
          <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-700" />
            <span>Chargement du module Stripe...</span>
          </div>
        )}
        <PaymentElement onReady={() => setIsReady(true)} options={{ layout: 'tabs' }} />
      </div>

      <div className="pt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isConfirming}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || !isReady || isConfirming}
          className="flex-1 py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
        >
          {isConfirming ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validation bancaire...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                Payer {amount.toFixed(2)} {currency}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const SubscribeCheckoutModal: React.FC<SubscribeCheckoutModalProps> = ({
  plan,
  price,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { token, refreshMe } = useAuth();

  const [country, setCountry] = useState('FR');
  const [eligibility, setEligibility] = useState<TrialEligibility | null>(null);
  const [isTrialMode, setIsTrialMode] = useState(price.trialDays > 0);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [step, setStep] = useState<'summary' | 'payment'>('summary');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeMode, setStripeMode] = useState<'live' | 'test'>('live');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check trial eligibility when opened
  useEffect(() => {
    if (!isOpen || !token) return;
    setStep('summary');
    setError(null);
    setSuccessMessage(null);
    setClientSecret(null);

    const checkEligibility = async () => {
      try {
        const res = await fetch('/api/subscriptions/trial-eligibility', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEligibility(data.eligibility);
          if (price.trialDays > 0 && data.eligibility.isEligible) {
            setIsTrialMode(true);
          } else {
            setIsTrialMode(false);
          }
        }
      } catch (err) {
        console.error('Failed to check trial eligibility', err);
      }
    };

    checkEligibility();
  }, [isOpen, token, price.trialDays]);

  if (!isOpen) return null;

  // Live tax computation
  const selectedCountry = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  const totalAmount = isTrialMode ? 0 : price.amount;
  const taxRate = selectedCountry.rate;
  const subtotal = Math.round((totalAmount / (1 + taxRate)) * 100) / 100;
  const taxAmount = Math.round((totalAmount - subtotal) * 100) / 100;

  const finalizeSubscription = async (paymentIntentId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const idempotencyKey = `sub_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const res = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: price.id,
          country,
          isTrial: isTrialMode,
          paymentMethod: paymentIntentId ? 'STRIPE_CARD' : 'FREE_TRIAL',
          paymentIntentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de la souscription.');
      }

      setSuccessMessage(data.message || 'Souscription validée avec succès !');
      await refreshMe();

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Impossible de finaliser l’abonnement.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('Veuillez accepter les conditions générales de vente et d’abonnement.');
      return;
    }

    if (isTrialMode || price.amount <= 0) {
      await finalizeSubscription();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/subscriptions/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: price.id,
          country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossible d’initialiser le paiement Stripe.');
      }

      if (!data.requiresPayment) {
        await finalizeSubscription();
        return;
      }

      let pubKey = data.publishableKey;
      let mode: 'live' | 'test' = data.mode === 'live' ? 'live' : 'test';
      if (!pubKey) {
        const cfg = await fetchStripeConfig();
        pubKey = cfg.publishableKey;
        mode = cfg.mode;
      }

      if (!pubKey) {
        throw new Error('Clé publique Stripe non configurée.');
      }

      setStripeMode(mode);
      setStripePromise(getStripePromise(pubKey));
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Impossible d’initialiser le paiement.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Souscrire à {plan.name}
              </h3>
              <p className="text-xs text-slate-500">
                {price.interval === 'YEAR' ? 'Facturation annuelle' : 'Facturation mensuelle'} • Résiliable à tout moment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 'payment' && clientSecret && stripePromise ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{plan.name}</span>
                  <span className="text-[11px] text-slate-500">
                    TVA incluse ({selectedCountry.code} {(taxRate * 100).toFixed(1)}%)
                  </span>
                </div>
                <span className="text-base font-black text-teal-800">
                  {price.amount.toFixed(2)} {price.currency}
                </span>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  locale: 'fr',
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#115e59',
                      borderRadius: '12px',
                    },
                  },
                }}
              >
                <StripeSubPaymentForm
                  amount={price.amount}
                  currency={price.currency}
                  stripeMode={stripeMode}
                  onBack={() => {
                    setError(null);
                    setStep('summary');
                  }}
                  onPaymentConfirmed={finalizeSubscription}
                  onError={(msg) => setError(msg || null)}
                />
              </Elements>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Trial banner if applicable */}
              {price.trialDays > 0 && eligibility?.isEligible && (
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-teal-900 font-black text-xs">
                      <Clock className="w-4 h-4 text-teal-700" />
                      <span>Essai Gratuit de {price.trialDays} Jours Détecté</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-200 text-teal-900">
                      OFFERT
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    Vous n’avez encore jamais activé d’essai gratuit. Profitez de 14 jours d’accès complet sans aucun débit aujourd’hui (0.00 {price.currency}).
                  </p>
                  <label className="flex items-center gap-2 mt-2 pt-2 border-t border-teal-200/60 cursor-pointer font-bold text-teal-900">
                    <input
                      type="checkbox"
                      checked={isTrialMode}
                      onChange={(e) => setIsTrialMode(e.target.checked)}
                      className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>Activer la période d’essai sans prélèvement immédiat</span>
                  </label>
                </div>
              )}

              {/* Country Selection for Tax */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 text-xs">
                  Pays de résidence fiscale (TVA applicable) :
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-teal-700"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Recap */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Formule choisie :</span>
                  <span className="font-bold text-slate-900">
                    {plan.name} ({price.interval === 'YEAR' ? '12 mois' : '1 mois'})
                  </span>
                </div>

                {isTrialMode ? (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between text-teal-800 font-bold">
                      <span>Prélèvement aujourd’hui :</span>
                      <span>0.00 {price.currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Puis après 14 jours :</span>
                      <span>
                        {price.amount.toFixed(2)} {price.currency} / {price.interval === 'YEAR' ? 'an' : 'mois'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between text-slate-500">
                      <span>Sous-total HT :</span>
                      <span>{subtotal.toFixed(2)} {price.currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>TVA incluse ({selectedCountry.code} {(taxRate * 100).toFixed(1)}%) :</span>
                      <span>{taxAmount.toFixed(2)} {price.currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                      <span>Total à régler TTC :</span>
                      <span className="text-teal-800">
                        {totalAmount.toFixed(2)} {price.currency}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <label className="flex items-start gap-2 cursor-pointer text-slate-600 text-[11px] leading-relaxed">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 mt-0.5 w-4 h-4"
                />
                <span>
                  J’accepte les Conditions Générales de Vente et d’Abonnement. Je reconnais que l’abonnement est sans engagement et peut être résilié ou rétrogradé à tout moment depuis mon espace sans perte de mes données médicales.
                </span>
              </label>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !acceptTerms}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Initialisation Stripe...</span>
                    </>
                  ) : isTrialMode ? (
                    <>
                      <Sparkles className="w-4 h-4 text-teal-300" />
                      <span>Démarrer l’Essai Gratuit de 14 Jours</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Continuer vers le paiement ({price.amount.toFixed(2)} {price.currency})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
