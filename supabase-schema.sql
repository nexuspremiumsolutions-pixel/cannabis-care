-- ==============================================================================
-- CANNABIS CARE — SCHEMA POSTGRESQL / SUPABASE INITIAL
-- Nexus Premium Solutions SAS
-- ==============================================================================

-- 1. Table Utilisateurs & Rôles
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'USER',
  is_email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profils Utilisateurs & Onboarding
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  profile_type TEXT DEFAULT 'UNDETERMINED',
  primary_path TEXT DEFAULT 'UNDETERMINED',
  is_onboarded BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  age_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Boutiques Partenaires
CREATE TABLE IF NOT EXISTS public.partner_shops (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'FR',
  phone TEXT,
  email TEXT,
  website_url TEXT,
  opening_hours TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  commission_rate NUMERIC(5,2) DEFAULT 8.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Produits Marketplace & CBD
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id TEXT PRIMARY KEY,
  shop_id TEXT REFERENCES public.partner_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  category TEXT NOT NULL,
  description TEXT,
  strain_type TEXT,
  thc_rate NUMERIC(4,2) DEFAULT 0.20,
  cbd_rate NUMERIC(4,2) DEFAULT 12.00,
  cbg_rate NUMERIC(4,2) DEFAULT 0.50,
  terpenes TEXT[],
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 100,
  is_organic BOOLEAN DEFAULT FALSE,
  lab_tested BOOLEAN DEFAULT TRUE,
  lab_coa_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Commandes Globales & Paiements
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'PENDING',
  currency TEXT DEFAULT 'EUR',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_total NUMERIC(10,2) DEFAULT 0.00,
  commission_total NUMERIC(10,2) DEFAULT 0.00,
  grand_total NUMERIC(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'UNPAID',
  payment_method TEXT,
  payment_transaction_id TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Journal de Consommation & Suivi Bien-être
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  product_type TEXT,
  quantity NUMERIC(6,2),
  thc_estimated_mg NUMERIC(6,2),
  cbd_estimated_mg NUMERIC(6,2),
  craving_level INTEGER,
  mood_rating INTEGER,
  stress_rating INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Activer Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique pour le catalogue
DROP POLICY IF EXISTS "Public read products" ON public.marketplace_products;
CREATE POLICY "Public read products" ON public.marketplace_products FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Public read shops" ON public.partner_shops;
CREATE POLICY "Public read shops" ON public.partner_shops FOR SELECT USING (is_active = TRUE);

-- 8. Table de synchronisation persistante complète (tous modules CANNABIS CARE)
CREATE TABLE IF NOT EXISTS public.app_collections (
  collection_key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_collections ENABLE ROW LEVEL SECURITY;

-- Accès strictement réservé à la clé serveur (service_role / sb_secret_)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.marketplace_products, public.partner_shops TO anon, authenticated;
REVOKE ALL ON public.app_collections FROM anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON public.app_collections TO service_role;

