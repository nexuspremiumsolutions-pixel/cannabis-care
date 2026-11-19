import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseUrl(): string {
  return (process.env.SUPABASE_URL || 'https://ayofibhdngslcfzynwvc.supabase.co').trim();
}

export function getSupabaseServerKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
}

export function isServerSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();
  return Boolean(url && url.startsWith('https://') && key && !key.includes('your_'));
}

let serverClient: SupabaseClient | null = null;
let cachedKey = '';
let cachedUrl = '';

export function getServerSupabase(): SupabaseClient | null {
  if (!isServerSupabaseConfigured()) {
    return null;
  }
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();
  if (!serverClient || cachedKey !== key || cachedUrl !== url) {
    serverClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    cachedKey = key;
    cachedUrl = url;
  }
  return serverClient;
}
