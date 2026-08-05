-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.4 — Portal data wiring (linking tables + seeding)
-- Tickets: 1.4.01-25
--
-- Existing (from prior migrations): client_mandate_access, candidate_mandate_links
-- This migration extends them + creates the missing portal-seeding tables +
-- the link/unlink functions + portal-access logging + readiness validator.
--
-- Defensive: vista_* / dex_user_profiles / council_profiles may exist in the
-- live DB already. All CREATE TABLE uses IF NOT EXISTS; column adds use
-- ADD COLUMN IF NOT EXISTS.
-- ──────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.01  Extend client_mandate_access — add notes, granted_at, granted_by
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE public.client_mandate_access
  ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.client_mandate_access
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.client_mandate_access
  ADD COLUMN IF NOT EXISTS granted_by UUID;
-- Backfill granted_at from created_at for pre-existing rows
UPDATE public.client_mandate_access
SET granted_at = created_at
WHERE granted_at IS NULL OR granted_at = now();

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.03  Extend candidate_mandate_links — add linked_at, linked_by aliases
-- ════════════════════════════════════════════════════════════════════════
-- created_by ≈ linked_by, created_at ≈ linked_at. Add the spec-named columns
-- as views over the existing ones to avoid schema duplication.
ALTER TABLE public.candidate_mandate_links
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.candidate_mandate_links
  ADD COLUMN IF NOT EXISTS linked_by UUID;
-- Sync linked_by/linked_at from created_by/created_at where the new cols are default
UPDATE public.candidate_mandate_links
SET linked_by = created_by, linked_at = created_at
WHERE linked_by IS NULL;

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.05-08  Link/unlink functions (SECURITY DEFINER, admin-gated)
-- ════════════════════════════════════════════════════════════════════════
-- 1.4.05  fn_link_candidate_to_mandate(contact_id, mandate_id, priority)
CREATE OR REPLACE FUNCTION public.fn_link_candidate_to_mandate(
  p_contact_id UUID, p_mandate_id UUID, p_priority TEXT DEFAULT 'P2'
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_consultant() THEN
    RAISE EXCEPTION 'Permission denied: fn_link_candidate_to_mandate requires consultant role';
  END IF;
  INSERT INTO public.candidate_mandate_links (contact_id, mandate_id, priority, linked_by, status)
  VALUES (p_contact_id, p_mandate_id, p_priority, auth.uid(), 'identified')
  ON CONFLICT (contact_id, mandate_id) DO UPDATE
    SET priority = EXCLUDED.priority, linked_by = EXCLUDED.linked_by, updated_at = now();
END;
$$;

-- 1.4.06  fn_unlink_candidate_from_mandate(contact_id, mandate_id)
CREATE OR REPLACE FUNCTION public.fn_unlink_candidate_from_mandate(
  p_contact_id UUID, p_mandate_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Permission denied: fn_unlink_candidate_from_mandate requires admin role';
  END IF;
  DELETE FROM public.candidate_mandate_links
  WHERE contact_id = p_contact_id AND mandate_id = p_mandate_id;
END;
$$;

-- 1.4.07  fn_link_client_to_mandate(client_account_id, mandate_id)
CREATE OR REPLACE FUNCTION public.fn_link_client_to_mandate(
  p_client_account_id UUID, p_mandate_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Permission denied: fn_link_client_to_mandate requires admin role';
  END IF;
  INSERT INTO public.client_mandate_access (client_account_id, mandate_id, granted_by)
  VALUES (p_client_account_id, p_mandate_id, auth.uid())
  ON CONFLICT (client_account_id, mandate_id) DO NOTHING;
END;
$$;

-- 1.4.08  fn_revoke_client_mandate_access(client_account_id, mandate_id)
CREATE OR REPLACE FUNCTION public.fn_revoke_client_mandate_access(
  p_client_account_id UUID, p_mandate_id UUID
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_admin() THEN
    RAISE EXCEPTION 'Permission denied: fn_revoke_client_mandate_access requires admin role';
  END IF;
  DELETE FROM public.client_mandate_access
  WHERE client_account_id = p_client_account_id AND mandate_id = p_mandate_id;
END;
$$;

GRANT EXECUTE ON
  public.fn_link_candidate_to_mandate,
  public.fn_unlink_candidate_from_mandate,
  public.fn_link_client_to_mandate,
  public.fn_revoke_client_mandate_access
TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.10  dex_user_profiles (B2C portal profiles for auth users)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.dex_user_profiles (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   TEXT,
  headline       TEXT,
  tier           TEXT DEFAULT 'free',
  credits_balance INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dex_user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dup_self_all" ON public.dex_user_profiles;
CREATE POLICY "dup_self_all"
  ON public.dex_user_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.11  council_profiles
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.council_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id     UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier           TEXT NOT NULL DEFAULT 'professional',
  bio            TEXT,
  expertise      TEXT[],
  visibility     TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('public','members','private')),
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_council_profiles_user_id ON public.council_profiles (user_id);
ALTER TABLE public.council_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_self_select" ON public.council_profiles;
CREATE POLICY "cp_self_select"
  ON public.council_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_internal_user() OR visibility = 'members');
DROP POLICY IF EXISTS "cp_self_update" ON public.council_profiles;
CREATE POLICY "cp_self_update"
  ON public.council_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.13-14  mailing_lists + mailing_list_contacts
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mailing_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mailing_list_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailing_list_id UUID NOT NULL REFERENCES public.mailing_lists(id) ON DELETE CASCADE,
  contact_id     UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  email          TEXT,
  subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  UNIQUE(mailing_list_id, COALESCE(contact_id, '00000000-0000-0000-0000-000000000000'), COALESCE(email, ''))
);
CREATE INDEX IF NOT EXISTS idx_mlc_list ON public.mailing_list_contacts (mailing_list_id);

-- Seed the 4 spec lists (1.4.13)
INSERT INTO public.mailing_lists (name, description) VALUES
  ('Newsletter', 'Monthly LYC Intelligence newsletter'),
  ('Updates', 'Product and platform updates'),
  ('Events', 'Council and executive events'),
  ('Council', 'Council member communications')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.mailing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mailing_list_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ml_admin_all" ON public.mailing_lists;
CREATE POLICY "ml_admin_all" ON public.mailing_lists FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());
DROP POLICY IF EXISTS "mlc_admin_all" ON public.mailing_list_contacts;
CREATE POLICY "mlc_admin_all" ON public.mailing_list_contacts FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.15  credit_packages (seeding — values mirror Stripe handler env vars)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,         -- 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'COUNCIL'
  name          TEXT NOT NULL,
  credits       INT NOT NULL,
  price_cents   INT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'usd',
  stripe_price_id TEXT,                        -- linked Stripe Price
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.credit_packages (code, name, credits, price_cents, stripe_price_id) VALUES
  ('STARTER',       'Starter Pack',        100,  4900,  NULL),
  ('PROFESSIONAL',  'Professional Pack',   500, 19900,  NULL),
  ('ENTERPRISE',    'Enterprise Pack',    2000, 59900,  NULL),
  ('COUNCIL',       'Council Membership', 1000, 29900,  NULL)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cpk_select_all" ON public.credit_packages;
CREATE POLICY "cpk_select_all"
  ON public.credit_packages FOR SELECT TO authenticated
  USING (is_active = TRUE OR public.fn_is_admin());
DROP POLICY IF EXISTS "cpk_admin_write" ON public.credit_packages;
CREATE POLICY "cpk_admin_write"
  ON public.credit_packages FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.16-17  portal_access_log + fn_log_portal_access
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.portal_access_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal      TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address  INET,
  action      TEXT
);
CREATE INDEX IF NOT EXISTS idx_pal_user_id ON public.portal_access_log (user_id);
CREATE INDEX IF NOT EXISTS idx_pal_accessed_at ON public.portal_access_log (accessed_at DESC);
ALTER TABLE public.portal_access_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pal_self_insert" ON public.portal_access_log;
CREATE POLICY "pal_self_insert"
  ON public.portal_access_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "pal_admin_select" ON public.portal_access_log;
CREATE POLICY "pal_admin_select"
  ON public.portal_access_log FOR SELECT TO authenticated
  USING (public.fn_is_admin());

CREATE OR REPLACE FUNCTION public.fn_log_portal_access(p_portal TEXT, p_action TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.portal_access_log (user_id, portal, action)
  VALUES (auth.uid(), p_portal, p_action);
END;
$$;
GRANT EXECUTE ON public.fn_log_portal_access TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.18  data_seeding_log
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.data_seeding_log (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name  TEXT NOT NULL,
  rows_seeded INT NOT NULL,
  seeded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT
);
ALTER TABLE public.data_seeding_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dsl_admin_all" ON public.data_seeding_log;
CREATE POLICY "dsl_admin_all"
  ON public.data_seeding_log FOR ALL TO authenticated
  USING (public.fn_is_admin()) WITH CHECK (public.fn_is_admin());

-- Record this migration's seeding
INSERT INTO public.data_seeding_log (table_name, rows_seeded, notes)
SELECT 'mailing_lists', COUNT(*)::INT, 'Phase 1.4 seed: 4 lists' FROM public.mailing_lists
UNION ALL SELECT 'credit_packages', COUNT(*)::INT, 'Phase 1.4 seed: 4 packages' FROM public.credit_packages;

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.19  fn_validate_portal_data_readiness(portal_name)
-- ════════════════════════════════════════════════════════════════════════
-- Returns (check_name, ready BOOLEAN, detail TEXT) for the requested portal.
CREATE OR REPLACE FUNCTION public.fn_validate_portal_data_readiness(p_portal TEXT)
RETURNS TABLE(check_name TEXT, ready BOOLEAN, detail TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_portal = 'client' THEN
    RETURN QUERY SELECT 'client_mandate_access_rows', COUNT(*) > 0,
      format('%s access mappings', COUNT(*))
      FROM public.client_mandate_access;
    RETURN QUERY SELECT 'client_accounts_exist', COUNT(*) > 0,
      format('%s client accounts', COUNT(*))
      FROM public.client_accounts;
  ELSIF p_portal = 'candidate' THEN
    RETURN QUERY SELECT 'candidate_mandate_links_rows', COUNT(*) > 0,
      format('%s candidate-mandate links', COUNT(*))
      FROM public.candidate_mandate_links;
    RETURN QUERY SELECT 'candidates_pipeline_rows', COUNT(*) > 0,
      format('%s pipeline rows', COUNT(*))
      FROM public.candidates_pipeline;
  ELSIF p_portal = 'b2c' THEN
    RETURN QUERY SELECT 'credit_packages_defined', COUNT(*) >= 4,
      format('%s credit packages', COUNT(*))
      FROM public.credit_packages WHERE is_active;
    RETURN QUERY SELECT 'dex_user_profiles_seeded', COUNT(*) > 0,
      format('%s dex profiles', COUNT(*))
      FROM public.dex_user_profiles;
  ELSIF p_portal = 'council' THEN
    RETURN QUERY SELECT 'council_profiles_seeded', COUNT(*) > 0,
      format('%s council profiles', COUNT(*))
      FROM public.council_profiles;
  ELSE
    RETURN QUERY SELECT 'unknown_portal', FALSE, format('portal %s not recognised', p_portal);
  END IF;
END;
$$;
GRANT EXECUTE ON public.fn_validate_portal_data_readiness TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.4.02 / 1.4.04  Populate linking tables from existing data
-- ════════════════════════════════════════════════════════════════════════
-- 1.4.02: map client_accounts → their mandates (via mandates.client_id join
-- client_accounts.company_id if present, else skip). Only inserts missing rows.
INSERT INTO public.client_mandate_access (client_account_id, mandate_id, granted_by)
SELECT DISTINCT ca.id, m.id, NULL
FROM public.client_accounts ca
JOIN public.mandates m ON m.client_id = ca.company_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_mandate_access cma
  WHERE cma.client_account_id = ca.id AND cma.mandate_id = m.id
)
ON CONFLICT DO NOTHING;

-- 1.4.04: candidate_mandate_links from candidates_pipeline
INSERT INTO public.candidate_mandate_links (contact_id, mandate_id, priority, linked_by, status)
SELECT DISTINCT cp.contact_id, cp.mandate_id, 'P2', NULL,
  CASE cp.stage
    WHEN 'HIRED' THEN 'placed'
    WHEN 'OFFER' THEN 'offer'
    WHEN 'INTERVIEW' THEN 'interview'
    WHEN 'QUALIFY' THEN 'screened'
    ELSE 'sourced'
  END
FROM public.candidates_pipeline cp
WHERE NOT EXISTS (
  SELECT 1 FROM public.candidate_mandate_links cml
  WHERE cml.contact_id = cp.contact_id AND cml.mandate_id = cp.mandate_id
)
ON CONFLICT DO NOTHING;
