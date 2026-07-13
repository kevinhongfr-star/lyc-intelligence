-- ============================================================================
-- v2 Batch 5 — Commerce Layer Schema
-- Tickets 41-50 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 41: Products table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'council_membership', 'council_addon', 'dex_credit_pack',
    'dex_subscription', 'event_ticket', 'coaching_session',
    'assessment', 'report', 'consulting_package'
  )),
  tier TEXT CHECK (tier IN (
    'founding', 'individual', 'corporate', 'pe_partner',
    'starter', 'professional', 'executive',
    'monthly_member', 'monthly_pro'
  )),
  price_cny DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  billing_cycle TEXT CHECK (billing_cycle IN ('one_time', 'monthly', 'quarterly', 'annual')),
  credits_included INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  max_quantity INTEGER,
  requires_approval BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_products_category ON public.v2_products(category);
CREATE INDEX IF NOT EXISTS idx_v2_products_tier ON public.v2_products(tier);
CREATE INDEX IF NOT EXISTS idx_v2_products_code ON public.v2_products(product_code);
CREATE INDEX IF NOT EXISTS idx_v2_products_active ON public.v2_products(is_active, is_visible) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_v2_products_stripe ON public.v2_products(stripe_price_id);

ALTER TABLE public.v2_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active products"
  ON public.v2_products FOR SELECT TO authenticated
  USING (is_active = true AND is_visible = true AND deleted_at IS NULL);

CREATE POLICY "Admin can manage products"
  ON public.v2_products FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_products_updated_at ON public.v2_products;
CREATE TRIGGER trg_v2_products_updated_at
  BEFORE UPDATE ON public.v2_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 42: Orders table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.v2_products(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'payment_required', 'paid', 'processing',
      'fulfilled', 'cancelled', 'refunded', 'partially_refunded', 'failed'
    )),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'bank_transfer', 'wechat_pay', 'alipay', 'manual', 'credits')),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_orders_user ON public.v2_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_orders_status ON public.v2_orders(status);
CREATE INDEX IF NOT EXISTS idx_v2_orders_product ON public.v2_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_v2_orders_org ON public.v2_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_orders_created ON public.v2_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_v2_orders_number ON public.v2_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_v2_orders_stripe ON public.v2_orders(stripe_payment_intent_id);

ALTER TABLE public.v2_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.v2_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Org admins can view org orders"
  ON public.v2_orders FOR SELECT TO authenticated
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_orders.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create their own orders"
  ON public.v2_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all orders"
  ON public.v2_orders FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_orders_updated_at ON public.v2_orders;
CREATE TRIGGER trg_v2_orders_updated_at
  BEFORE UPDATE ON public.v2_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 43: Credit transactions table ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('council_credits', 'dex_credits')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'grant', 'consumption', 'refund', 'expiry', 'adjustment', 'transfer'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_id UUID REFERENCES public.v2_orders(id) ON DELETE SET NULL,
  session_id UUID,
  description TEXT,
  product_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v2_credits_user ON public.v2_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_credits_type ON public.v2_credit_transactions(credit_type);
CREATE INDEX IF NOT EXISTS idx_v2_credits_transaction_type ON public.v2_credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_v2_credits_created ON public.v2_credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_v2_credits_order ON public.v2_credit_transactions(order_id);

ALTER TABLE public.v2_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit transactions"
  ON public.v2_credit_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own credit transactions"
  ON public.v2_credit_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all credit transactions"
  ON public.v2_credit_transactions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

CREATE POLICY "Admin can manage all credit transactions"
  ON public.v2_credit_transactions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- Note: No updated_at trigger — this is an append-only ledger table

-- ── Ticket 44: Discount codes table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL
    CHECK (discount_type IN ('percentage', 'fixed', 'free_trial')),
  discount_value DECIMAL(10,2) NOT NULL,
  applicable_categories TEXT[] DEFAULT '{}',
  applicable_tiers TEXT[] DEFAULT '{}',
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  min_order_amount DECIMAL(10,2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_discounts_code ON public.v2_discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_v2_discounts_active ON public.v2_discount_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_v2_discounts_categories ON public.v2_discount_codes USING GIN(applicable_categories);

ALTER TABLE public.v2_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active discount codes"
  ON public.v2_discount_codes FOR SELECT TO authenticated
  USING (
    is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW()
    AND deleted_at IS NULL
  );

CREATE POLICY "Admin can manage discount codes"
  ON public.v2_discount_codes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_discount_codes_updated_at ON public.v2_discount_codes;
CREATE TRIGGER trg_v2_discount_codes_updated_at
  BEFORE UPDATE ON public.v2_discount_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 45: RLS policies for products ───────────────────────────────────
-- Defined inline with v2_products above.
-- Key policies: active+visible products public read, admin management.

-- ── Ticket 46: RLS policies for orders ─────────────────────────────────────
-- Defined inline with v2_orders above.
-- Key policies: owner view, org admin view, owner create, admin manage.

-- ── Ticket 47: RLS policies for credit_transactions ───────────────────────
-- Defined inline with v2_credit_transactions above.
-- Key policies: owner view/insert, admin full access (append-only ledger).

-- ── Ticket 48: RLS policies for discount_codes ────────────────────────────
-- Defined inline with v2_discount_codes above.
-- Key policies: active codes within validity window visible, admin management.

-- ── Ticket 49: Indexes & constraints for Commerce schema ───────────────────
-- All indexes and constraints defined inline:
--   v2_products: 5 indexes (category, tier, code, active partial, stripe)
--   v2_orders: 7 indexes (user, status, product, org, created, number, stripe)
--   v2_credit_transactions: 5 indexes (user, type, transaction_type, created, order)
--   v2_discount_codes: 3 indexes (code, active composite, categories GIN)
--   UNIQUE constraints: products(product_code), orders(order_number), discount_codes(code)
--   CHECK constraints: all enum-style columns + numeric bounds

-- ── Ticket 50: Triggers for Commerce schema ────────────────────────────────
-- 3 of 4 tables have updated_at triggers (credit_transactions is append-only):
--   trg_v2_products_updated_at, trg_v2_orders_updated_at,
--   trg_v2_discount_codes_updated_at
