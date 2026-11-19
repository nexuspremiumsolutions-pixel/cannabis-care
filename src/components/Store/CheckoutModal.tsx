import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getStripePromise, fetchStripeConfig } from '../../lib/stripe';
import {
  X,
  Store,
  Truck,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Package,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { FulfillmentMethod, OrderAddressSnapshot } from '../../types/entities';

interface StripePaymentFormProps {
  grandTotal: number;
  stripeMode: 'live' | 'test';
  billingAddress: OrderAddressSnapshot;
  onBack: () => void;
  onPaymentConfirmed: (paymentIntentId: string) => Promise<void>;
  onError: (message: string) => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  grandTotal,
  stripeMode,
  billingAddress,
  onBack,
  onPaymentConfirmed,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError('Le module de paiement Stripe est en cours de chargement. Veuillez patienter.');
      return;
    }

    setIsConfirming(true);
    onError('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || 'Veuillez vérifier vos informations bancaires.');
        setIsConfirming(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
          payment_method_data: {
            billing_details: {
              name: billingAddress.fullName,
              email: billingAddress.email,
              phone: billingAddress.phone,
              address: {
                line1: billingAddress.address,
                city: billingAddress.city,
                postal_code: billingAddress.postalCode,
                country: 'FR',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Le paiement a été refusé par votre banque.');
        setIsConfirming(false);
        return;
      }

      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        await onPaymentConfirmed(paymentIntent.id);
      } else {
        onError(`Statut de paiement inattendu (${paymentIntent?.status || 'inconnu'}). Veuillez réessayer.`);
      }
    } catch (err: any) {
      onError(err?.message || 'Erreur lors de la validation du paiement Stripe.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <form onSubmit={handleConfirmPayment} className="space-y-5">
      <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-teal-950 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" /> Paiement Sécurisé Stripe • 3D Secure v2
          </span>
          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
              stripeMode === 'live'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            {stripeMode === 'live' ? 'Production Live' : 'Mode Test Stripe'}
          </span>
        </div>
        <p className="text-[11px] text-teal-900 leading-relaxed">
          Vos coordonnées bancaires sont chiffrées de bout en bout par Stripe (PCI-DSS Niveau 1) et ne transitent jamais par nos serveurs.
        </p>
      </div>

      <div className="p-4 rounded-2xl border border-slate-200 bg-white min-h-[180px] relative">
        {!isElementReady && (
          <div className="flex items-center justify-center py-10 text-xs text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
            <span>Chargement du terminal de paiement sécurisé Stripe...</span>
          </div>
        )}
        <PaymentElement
          onReady={() => setIsElementReady(true)}
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isConfirming}
          className="px-4 py-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modifier</span>
        </button>

        <button
          type="submit"
          disabled={!stripe || !elements || !isElementReady || isConfirming}
          className="flex-1 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
        >
          {isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Autorisation bancaire & Dispatch...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Payer {grandTotal.toFixed(2)} €</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const CheckoutModal: React.FC = () => {
  const { cart, isCheckoutModalOpen, closeCheckoutModal, dispatchCheckout, isLoading } = useCart();
  const { profile, user, token } = useAuth();

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [fulfillmentSelections, setFulfillmentSelections] = useState<Record<string, FulfillmentMethod>>({});
  const [customerNotes, setCustomerNotes] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdGlobalOrder, setCreatedGlobalOrder] = useState<any | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  // Stripe PaymentIntent state
  const [isInitializingStripe, setIsInitializingStripe] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeMode, setStripeMode] = useState<'live' | 'test'>('live');

  // Billing Address Form
  const [billingAddress, setBillingAddress] = useState<OrderAddressSnapshot>({
    fullName: profile?.nickname ? `${profile.nickname}` : 'Client Nexus',
    email: user?.email || 'client@nexus-cannabis-care.fr',
    phone: '+33 6 12 34 56 78',
    address: '12 Rue de Rivoli',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  });

  // Shipping Address Form
  const [shippingAddress, setShippingAddress] = useState<OrderAddressSnapshot>({
    fullName: profile?.nickname ? `${profile.nickname}` : 'Client Nexus',
    phone: '+33 6 12 34 56 78',
    address: '12 Rue de Rivoli',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    notes: '',
  });

  // Reset modal transient state whenever opened
  useEffect(() => {
    if (isCheckoutModalOpen) {
      setStep('details');
      setErrorMessage(null);
      setIsSuccess(false);
      setCreatedGlobalOrder(null);
      setClientSecret(null);
      if (user?.email) {
        setBillingAddress((prev) => ({
          ...prev,
          email: user.email || prev.email,
          fullName: profile?.nickname || prev.fullName,
        }));
      }
    }
  }, [isCheckoutModalOpen, user?.email, profile?.nickname]);

  useEffect(() => {
    if (token && isCheckoutModalOpen) {
      fetch('/api/logistics/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
          }
        })
        .catch(() => {});
    }
  }, [token, isCheckoutModalOpen]);

  const handleApplySavedAddress = (addr: any) => {
    const fullName = addr.fullName || `${addr.firstName} ${addr.lastName}`.trim();
    const addressLine = addr.addressLine1 || addr.address;
    const snap: OrderAddressSnapshot = {
      fullName,
      phone: addr.phone || '+33 6 12 34 56 78',
      address: addressLine,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country || 'France',
      notes: addr.instructions,
    };
    setBillingAddress((prev) => ({ ...prev, ...snap }));
    setShippingAddress((prev) => ({ ...prev, ...snap }));
  };

  if (!isCheckoutModalOpen) return null;

  const groups = cart?.groups || [];

  // Calculate dynamic delivery fees based on user selections
  let calculatedDeliveryTotal = 0;
  for (const group of groups) {
    const selectedMethod = fulfillmentSelections[group.shopId] || group.selectedFulfillmentMethod;
    if (selectedMethod === 'DELIVERY') {
      const freeThreshold = group.freeDeliveryThreshold || 50;
      if (group.subtotal < freeThreshold) {
        calculatedDeliveryTotal += group.deliveryFee;
      }
    }
  }

  const subtotal = cart?.subtotal || 0;
  const discountTotal = cart?.discountTotal || 0;
  const grandTotal = Math.max(0, Math.round((subtotal + calculatedDeliveryTotal - discountTotal) * 100) / 100);

  const handleSelectFulfillment = (shopId: string, method: FulfillmentMethod) => {
    setFulfillmentSelections((prev) => ({
      ...prev,
      [shopId]: method,
    }));
  };

  const handleNoteChange = (shopId: string, note: string) => {
    setCustomerNotes((prev) => ({
      ...prev,
      [shopId]: note,
    }));
  };

  const getShopFulfillments = () =>
    groups.map((g) => ({
      shopId: g.shopId,
      fulfillmentMethod: fulfillmentSelections[g.shopId] || g.selectedFulfillmentMethod,
      customerNote: customerNotes[g.shopId],
    }));

  const handleFinalizeDispatch = async (paymentIntentId?: string) => {
    const result = await dispatchCheckout({
      billingAddress,
      shippingAddress: billingAddress,
      shopFulfillments: getShopFulfillments(),
      paymentMethod: paymentIntentId ? 'STRIPE_CARD' : 'PROMO_FULL_COVERAGE',
      paymentIntentId,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Une erreur est survenue lors de la validation.');
    } else {
      setCreatedGlobalOrder(result.globalOrder);
      setIsSuccess(true);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (grandTotal <= 0) {
      await handleFinalizeDispatch();
      return;
    }

    if (!token) {
      setErrorMessage('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    try {
      setIsInitializingStripe(true);
      const res = await fetch('/api/marketplace/checkout/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopFulfillments: getShopFulfillments(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Impossible d’initialiser le paiement Stripe.');
        return;
      }

      if (!data.requiresPayment) {
        await handleFinalizeDispatch();
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
        setErrorMessage('Clé publique Stripe manquante dans la configuration frontend.');
        return;
      }

      setStripeMode(mode);
      setStripePromise(getStripePromise(pubKey));
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de l’initialisation du paiement Stripe.');
    } finally {
      setIsInitializingStripe(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isSuccess
                  ? 'Commande Confirmée avec Succès !'
                  : step === 'payment'
                  ? 'Règlement Sécurisé par Stripe'
                  : 'Livraison & Dispatch Multi-Boutiques'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSuccess
                  ? 'Votre paiement Stripe est validé et vos sous-commandes ont été transmises aux boutiques.'
                  : step === 'payment'
                  ? 'Paiement chiffré SSL • 3D Secure • Aucune donnée bancaire stockée'
                  : 'Étape 1/2 : Mode de retrait & coordonnées • Étape 2/2 : Paiement Stripe'}
              </p>
            </div>
          </div>
          <button
            onClick={closeCheckoutModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess && createdGlobalOrder ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Numéro de Commande Globale
              </span>
              <h4 className="text-2xl font-black text-slate-900">{createdGlobalOrder.orderNumber}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Votre règlement de <strong>{createdGlobalOrder.grandTotal.toFixed(2)} €</strong> a été encaissé via Stripe. Les ordres de préparation ont été immédiatement transmis à chacune des boutiques partenaires agréées.
              </p>
              {createdGlobalOrder.paymentTransactionId && (
                <p className="text-[11px] font-mono text-slate-400">
                  Réf. Stripe : {createdGlobalOrder.paymentTransactionId}
                </p>
              )}
            </div>

            {/* Breakdown of Child Shop Orders */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-left space-y-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Vos {createdGlobalOrder.shopOrdersCount} sous-commandes partenaires :
              </h5>
              <div className="space-y-2">
                {createdGlobalOrder.shopOrdersSummary?.map((so: any) => (
                  <div
                    key={so.shopOrderId}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{so.shopName}</div>
                      <div className="text-[11px] text-slate-500">
                        Réf. {so.orderNumber} • {so.fulfillmentMethod === 'PICKUP' ? 'Retrait en boutique' : 'Livraison à domicile'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-teal-900">{so.total.toFixed(2)} €</div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        En attente de prise en charge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={closeCheckoutModal}
                className="flex-1 py-3 px-4 rounded-xl bg-teal-800 text-white font-bold text-xs hover:bg-teal-900 transition shadow-xs cursor-pointer"
              >
                Fermer et suivre mes commandes
              </button>
            </div>
          </div>
        ) : step === 'payment' && clientSecret && stripePromise ? (
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Compact Order Summary */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex justify-between items-baseline text-xs text-slate-300">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-white">{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-slate-300">
                <span>Frais de livraison cumulés :</span>
                <span className="font-semibold text-white">
                  {calculatedDeliveryTotal === 0 ? 'Gratuit' : `${calculatedDeliveryTotal.toFixed(2)} €`}
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between items-baseline text-xs text-emerald-400 font-bold">
                  <span>
                    Réduction promotionnelle {cart?.appliedCouponCode ? `(${cart.appliedCouponCode})` : ''} :
                  </span>
                  <span>-{discountTotal.toFixed(2)} €</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total à régler :</span>
                <span className="text-xl font-black text-teal-300">{grandTotal.toFixed(2)} €</span>
              </div>
            </div>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                locale: 'fr',
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#0f766e',
                    borderRadius: '12px',
                  },
                },
              }}
            >
              <StripePaymentForm
                grandTotal={grandTotal}
                stripeMode={stripeMode}
                billingAddress={billingAddress}
                onBack={() => {
                  setErrorMessage(null);
                  setStep('details');
                }}
                onPaymentConfirmed={handleFinalizeDispatch}
                onError={(msg) => setErrorMessage(msg || null)}
              />
            </Elements>
          </div>
        ) : (
          <form onSubmit={handleProceedToPayment} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Fulfillment Selection per Shop */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Package className="w-4 h-4 text-teal-700" />
                <span>1. Mode de retrait / expédition par boutique</span>
              </div>

              <div className="space-y-4">
                {groups.map((group) => {
                  const currentMethod = fulfillmentSelections[group.shopId] || group.selectedFulfillmentMethod;

                  return (
                    <div
                      key={group.shopId}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-teal-700" />
                          <span className="text-xs font-bold text-slate-900">{group.shopName}</span>
                          <span className="text-[11px] text-slate-500">({group.shopCity})</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {group.itemsCount} article(s) • {group.subtotal.toFixed(2)} €
                        </span>
                      </div>

                      {/* Options: Delivery vs Pickup */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.deliveryAvailable && (
                          <button
                            type="button"
                            onClick={() => handleSelectFulfillment(group.shopId, 'DELIVERY')}
                            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                              currentMethod === 'DELIVERY'
                                ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <Truck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <div className="font-bold flex items-center justify-between">
                                <span>Colis Suivi</span>
                                <span className="font-extrabold text-teal-900">
                                  {group.freeDeliveryThreshold && group.subtotal >= group.freeDeliveryThreshold
                                    ? 'Gratuit'
                                    : `${group.deliveryFee.toFixed(2)} €`}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {group.estimatedDeliveryDays || '2-4 jours ouvrés'}
                              </div>
                            </div>
                          </button>
                        )}

                        {group.pickupAvailable && (
                          <button
                            type="button"
                            onClick={() => handleSelectFulfillment(group.shopId, 'PICKUP')}
                            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                              currentMethod === 'PICKUP'
                                ? 'bg-teal-50 border-teal-600 text-teal-950 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <MapPin className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <div className="font-bold flex items-center justify-between">
                                <span>Click & Collect</span>
                                <span className="font-extrabold text-emerald-700">0 €</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                                {group.pickupAddress || 'Comptoir boutique'}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Optional note to the merchant */}
                      <div>
                        <input
                          type="text"
                          placeholder={`Instructions ou message pour ${group.shopName} (optionnel)...`}
                          value={customerNotes[group.shopId] || ''}
                          onChange={(e) => handleNoteChange(group.shopId, e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Billing & Shipping Addresses */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>2. Coordonnées & Facturation</span>
                </div>
                {savedAddresses.length > 0 && (
                  <span className="text-[11px] text-teal-700 font-semibold">
                    {savedAddresses.length} adresse(s) enregistrée(s)
                  </span>
                )}
              </div>

              {savedAddresses.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-teal-50/50 rounded-2xl border border-teal-100">
                  <span className="text-[11px] font-bold text-teal-900 self-center pl-1">Remplissage rapide :</span>
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleApplySavedAddress(addr)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 text-xs font-semibold hover:bg-teal-100 transition cursor-pointer shadow-xs"
                    >
                      {addr.label || addr.city} ({addr.postalCode})
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.fullName}
                    onChange={(e) => setBillingAddress({ ...billingAddress, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléphone de contact</label>
                  <input
                    type="tel"
                    required
                    value={billingAddress.phone || ''}
                    onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Adresse postale</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.address}
                    onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.postalCode}
                    onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Summary & Proceed to Stripe Payment */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex justify-between items-baseline text-xs text-slate-300">
                <span>Sous-total articles :</span>
                <span className="font-semibold text-white">{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-baseline text-xs text-slate-300">
                <span>Frais de livraison cumulés :</span>
                <span className="font-semibold text-white">
                  {calculatedDeliveryTotal === 0 ? 'Gratuit' : `${calculatedDeliveryTotal.toFixed(2)} €`}
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between items-baseline text-xs text-emerald-400 font-bold">
                  <span>
                    Réduction promotionnelle {cart?.appliedCouponCode ? `(${cart.appliedCouponCode})` : ''} :
                  </span>
                  <span>-{discountTotal.toFixed(2)} €</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Montant Total :</span>
                <span className="text-xl font-black text-teal-300">{grandTotal.toFixed(2)} €</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || isInitializingStripe}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isLoading || isInitializingStripe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Préparation du paiement sécurisé Stripe...</span>
                  </>
                ) : grandTotal <= 0 ? (
                  <>
                    <span>Confirmer la commande (0.00 €)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Continuer vers le paiement Stripe ({grandTotal.toFixed(2)} €)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
