import { loadStripe, Stripe } from '@stripe/stripe-js';

let cachedPromise: Promise<Stripe | null> | null = null;
let cachedKey: string | null = null;

export interface StripePublicConfig {
  configured: boolean;
  publishableKey: string;
  mode: 'live' | 'test';
}

export async function fetchStripeConfig(): Promise<StripePublicConfig> {
  const envKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
  try {
    const res = await fetch('/api/finance/stripe-config');
    if (res.ok) {
      const data = await res.json();
      const key = data.publishableKey || envKey;
      return {
        configured: Boolean(data.configured && key),
        publishableKey: key,
        mode: data.mode === 'live' || key.startsWith('pk_live_') ? 'live' : 'test',
      };
    }
  } catch (err) {
    console.warn('Failed to fetch /api/finance/stripe-config, falling back to Vite env:', err);
  }

  return {
    configured: Boolean(envKey),
    publishableKey: envKey,
    mode: envKey.startsWith('pk_live_') ? 'live' : 'test',
  };
}

export function getStripePromise(publishableKey?: string): Promise<Stripe | null> {
  const key = publishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
  if (!key) {
    return Promise.resolve(null);
  }
  if (!cachedPromise || cachedKey !== key) {
    cachedKey = key;
    cachedPromise = loadStripe(key, { locale: 'fr' });
  }
  return cachedPromise;
}
