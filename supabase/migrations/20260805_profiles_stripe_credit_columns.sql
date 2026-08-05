-- ──────────────────────────────────────────────────────────────────────────
-- S6-T01 / S6-T02 / S6-T03 — Stripe & credit ledger columns on profiles
-- ──────────────────────────────────────────────────────────────────────────
-- The Stripe checkout, webhook, and credit handlers (api/_lib/stripeHandler.ts,
-- api/_lib/creditsHandler.ts) reference these columns on public.profiles, but
-- no prior migration declared them. This adds them idempotently so the
-- commerce flows work against the live database.
--
-- Idempotent: uses ADD COLUMN IF NOT EXISTS, safe to re-run.
-- ──────────────────────────────────────────────────────────────────────────

-- Stripe customer linkage (created on first checkout, reused thereafter).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Stripe subscription lifecycle (updated by webhook events).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

-- Membership tier driven by subscription status. Mirrors the tier values used
-- by credits.tier plus the extended set the Stripe handler accepts
-- (member | basic | pro | council | enterprise | free). Plain TEXT (no CHECK)
-- so the application layer remains the source of truth for allowed values.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';

-- Organization linkage used by the credit ledger to prefer org-level balance
-- before falling back to the user's personal credits.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Onboarding completion timestamp (S4-T07 OnboardingWizard writes this).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

-- Index the Stripe customer id — webhooks look up profiles by this column on
-- every subscription / invoice event.
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id
  ON public.profiles (organization_id);

-- ── RLS ──
-- profiles already has RLS (Supabase Auth manages it). Ensure the
-- authenticated user can read their own row; service role bypasses RLS and is
-- used by the server-side handlers for cross-user writes.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
