-- ============================================================================
-- v2 Batch 4 — DEX AI B2C Schema
-- Tickets 31-40 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 31: DEX user profiles table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dex_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  title TEXT,
  company TEXT,
  industry TEXT,
  executive_intro_used BOOLEAN DEFAULT FALSE,
  executive_intro_at TIMESTAMPTZ,
  intro_messages_used INTEGER DEFAULT 0,
  intro_messages_limit INTEGER DEFAULT 5,
  dex_credits INTEGER DEFAULT 0,
  credits_purchased_at TIMESTAMPTZ,
  subscription_tier TEXT CHECK (subscription_tier IN (
    NULL, 'monthly_member', 'monthly_pro'
  )),
  subscription_status TEXT CHECK (subscription_status IN (
    NULL, 'active', 'past_due', 'cancelled'
  )),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  graduation_to_council BOOLEAN DEFAULT FALSE,
  graduation_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_dex_user ON public.dex_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_credits ON public.dex_user_profiles(dex_credits);
CREATE INDEX IF NOT EXISTS idx_dex_subscription ON public.dex_user_profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_dex_stripe_customer ON public.dex_user_profiles(stripe_customer_id);

ALTER TABLE public.dex_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own DEX profile"
  ON public.dex_user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can update their own DEX profile"
  ON public.dex_user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Admin can manage DEX profiles"
  ON public.dex_user_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_dex_user_profiles_updated_at ON public.dex_user_profiles;
CREATE TRIGGER trg_dex_user_profiles_updated_at
  BEFORE UPDATE ON public.dex_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 32: DEX chat sessions table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dex_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  topic TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'deleted')),
  message_count INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  is_intro_session BOOLEAN DEFAULT FALSE,
  model_used TEXT DEFAULT 'gpt-4o',
  metadata JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_dex_sessions_user ON public.dex_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_sessions_status ON public.dex_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_dex_sessions_last_msg ON public.dex_chat_sessions(last_message_at);
CREATE INDEX IF NOT EXISTS idx_dex_sessions_intro ON public.dex_chat_sessions(is_intro_session) WHERE is_intro_session = true;

ALTER TABLE public.dex_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions"
  ON public.dex_chat_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can create their own chat sessions"
  ON public.dex_chat_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions"
  ON public.dex_chat_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Admin can manage all chat sessions"
  ON public.dex_chat_sessions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_dex_chat_sessions_updated_at ON public.dex_chat_sessions;
CREATE TRIGGER trg_dex_chat_sessions_updated_at
  BEFORE UPDATE ON public.dex_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 33: DEX chat context table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dex_chat_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.dex_chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  context_type TEXT CHECK (context_type IN (
    'conversation_summary', 'user_preference', 'topic_memory', 'industry_context'
  )),
  context_key TEXT,
  context_value JSONB NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dex_context_session ON public.dex_chat_context(session_id);
CREATE INDEX IF NOT EXISTS idx_dex_context_user ON public.dex_chat_context(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_context_type ON public.dex_chat_context(context_type);
CREATE INDEX IF NOT EXISTS idx_dex_context_expires ON public.dex_chat_context(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.dex_chat_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat context"
  ON public.dex_chat_context FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chat context"
  ON public.dex_chat_context FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat context"
  ON public.dex_chat_context FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all chat context"
  ON public.dex_chat_context FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

DROP TRIGGER IF EXISTS trg_dex_chat_context_updated_at ON public.dex_chat_context;
CREATE TRIGGER trg_dex_chat_context_updated_at
  BEFORE UPDATE ON public.dex_chat_context
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 34: DEX credit consumption table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.dex_credit_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.dex_chat_sessions(id) ON DELETE SET NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN (
    'intro_message', 'dex_credit', 'subscription_monthly'
  )),
  amount INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  description TEXT,
  related_product_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dex_credit_user ON public.dex_credit_consumption(user_id);
CREATE INDEX IF NOT EXISTS idx_dex_credit_type ON public.dex_credit_consumption(credit_type);
CREATE INDEX IF NOT EXISTS idx_dex_credit_created ON public.dex_credit_consumption(created_at);
CREATE INDEX IF NOT EXISTS idx_dex_credit_session ON public.dex_credit_consumption(session_id);

ALTER TABLE public.dex_credit_consumption ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit consumption"
  ON public.dex_credit_consumption FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can record their own credit consumption"
  ON public.dex_credit_consumption FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all credit consumption"
  ON public.dex_credit_consumption FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

CREATE POLICY "Admin can manage all credit consumption"
  ON public.dex_credit_consumption FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- ── Ticket 35: RLS policies for dex_user_profiles ──────────────────────────
-- Defined inline with dex_user_profiles above.
-- Key policies: owner full access, admin management.

-- ── Ticket 36: RLS policies for dex_chat_sessions ──────────────────────────
-- Defined inline with dex_chat_sessions above.
-- Key policies: owner CRUD, admin full access.

-- ── Ticket 37: RLS policies for dex_chat_context ───────────────────────────
-- Defined inline with dex_chat_context above.
-- Key policies: owner CRUD, admin full access.

-- ── Ticket 38: RLS policies for dex_credit_consumption ─────────────────────
-- Defined inline with dex_credit_consumption above.
-- Key policies: owner view/insert, admin full access.

-- ── Ticket 39: Indexes & constraints for DEX B2C schema ────────────────────
-- All indexes and constraints defined inline:
--   dex_user_profiles: 4 indexes (user_id, credits, subscription, stripe_customer)
--   dex_chat_sessions: 4 indexes (user_id, status, last_message_at, intro partial)
--   dex_chat_context: 4 indexes (session_id, user_id, type, expires_at partial)
--   dex_credit_consumption: 4 indexes (user_id, type, created_at, session_id)
--   UNIQUE constraints: dex_user_profiles(user_id)
--   CHECK constraints: all enum-style columns + direction

-- ── Ticket 40: updated_at triggers for DEX B2C schema ──────────────────────
-- 3 of 4 tables have updated_at triggers (dex_credit_consumption is append-only):
--   trg_dex_user_profiles_updated_at, trg_dex_chat_sessions_updated_at,
--   trg_dex_chat_context_updated_at
