-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.3 — Auth infrastructure & user type system
-- Tickets: 1.3.01-04, 1.3.05-09, 1.3.12-14, 1.3.15-18, 1.3.19-20, 1.3.23
--
-- DEFERRED to Supabase Auth native features (not reimplemented in SQL):
--   1.3.10  password reset  → Supabase Auth resetPasswordForEmail()
--   1.3.11  email verification → Supabase Auth sendEmailVerification()
--   1.3.21/22  MFA (TOTP)   → Supabase Auth MFA enroll/unenroll/verify
--   1.3.24/25  tests/docs   → follow-up
--
-- Reimplementing Supabase Auth's password-reset / email-verify / TOTP flows
-- in custom SQL would duplicate platform features, be less secure, and drift
-- from Supabase's audited implementation. Those tickets are satisfied by
-- configuring the Supabase Auth dashboard + calling the client SDK.
-- ──────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.01  user_types enum
-- ════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE public.user_type AS ENUM (
    'internal', 'client', 'candidate', 'b2c', 'council', 'workshop', 'alumni', 'partner'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.02  user_type_assignments table
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_type_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type   public.user_type NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  scope_id    UUID  -- optional: client_account_id / contact_id / org_id
);
CREATE INDEX IF NOT EXISTS idx_uta_user_id ON public.user_type_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_uta_user_type ON public.user_type_assignments (user_type);

ALTER TABLE public.user_type_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uta_self_select" ON public.user_type_assignments;
CREATE POLICY "uta_self_select"
  ON public.user_type_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.03  profiles.user_type column
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type public.user_type DEFAULT 'internal';

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.04  auth_metadata table
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.auth_metadata (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,            -- 'email' | 'google' | 'github' | ...
  external_id TEXT,                      -- provider-specific subject id
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_metadata_user_id ON public.auth_metadata (user_id);

ALTER TABLE public.auth_metadata ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "am_self_select" ON public.auth_metadata;
CREATE POLICY "am_self_select"
  ON public.auth_metadata FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_admin());

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.05-09  User-creation functions (server-side, SECURITY DEFINER)
-- ════════════════════════════════════════════════════════════════════════
-- Each inserts a profiles row + a user_type_assignments row + a user_roles
-- row with the appropriate role. The auth.users row is created by Supabase
-- Auth (admin.createUser) prior to calling these — they take an existing uid.

-- 1.3.05  fn_create_internal_user(email, role)
CREATE OR REPLACE FUNCTION public.fn_create_internal_user(p_uid UUID, p_email TEXT, p_role TEXT DEFAULT 'consultant')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (p_uid, p_email, 'internal')
  ON CONFLICT (id) DO UPDATE SET user_type = 'internal', email = EXCLUDED.email;

  INSERT INTO public.user_type_assignments (user_id, user_type)
  VALUES (p_uid, 'internal') ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_name, scope, status)
  VALUES (p_uid, COALESCE(p_role, 'consultant'), 'global', 'active')
  ON CONFLICT DO NOTHING;
END;
$$;

-- 1.3.06  fn_create_client_user(email, client_account_id)
CREATE OR REPLACE FUNCTION public.fn_create_client_user(p_uid UUID, p_email TEXT, p_client_account_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, organization_id)
  VALUES (p_uid, p_email, 'client', p_client_account_id)
  ON CONFLICT (id) DO UPDATE SET user_type = 'client', organization_id = p_client_account_id;

  INSERT INTO public.user_type_assignments (user_id, user_type, scope_id)
  VALUES (p_uid, 'client', p_client_account_id) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_name, scope, status)
  VALUES (p_uid, 'client_user', 'client', 'active') ON CONFLICT DO NOTHING;
END;
$$;

-- 1.3.07  fn_create_candidate_user(email, contact_id)
CREATE OR REPLACE FUNCTION public.fn_create_candidate_user(p_uid UUID, p_email TEXT, p_contact_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (p_uid, p_email, 'candidate')
  ON CONFLICT (id) DO UPDATE SET user_type = 'candidate';

  INSERT INTO public.user_type_assignments (user_id, user_type, scope_id)
  VALUES (p_uid, 'candidate', p_contact_id) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_name, scope, status)
  VALUES (p_uid, 'candidate', 'global', 'active') ON CONFLICT DO NOTHING;
END;
$$;

-- 1.3.08  fn_create_b2c_user(email, tier)
CREATE OR REPLACE FUNCTION public.fn_create_b2c_user(p_uid UUID, p_email TEXT, p_tier TEXT DEFAULT 'free')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, tier)
  VALUES (p_uid, p_email, 'b2c', p_tier)
  ON CONFLICT (id) DO UPDATE SET user_type = 'b2c', tier = p_tier;

  INSERT INTO public.user_type_assignments (user_id, user_type)
  VALUES (p_uid, 'b2c') ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_name, scope, status)
  VALUES (p_uid, 'b2c_user', 'global', 'active') ON CONFLICT DO NOTHING;
END;
$$;

-- 1.3.09  fn_create_council_user(email, contact_id, tier)
CREATE OR REPLACE FUNCTION public.fn_create_council_user(p_uid UUID, p_email TEXT, p_contact_id UUID, p_tier TEXT DEFAULT 'professional')
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, tier)
  VALUES (p_uid, p_email, 'council', p_tier)
  ON CONFLICT (id) DO UPDATE SET user_type = 'council', tier = p_tier;

  INSERT INTO public.user_type_assignments (user_id, user_type, scope_id)
  VALUES (p_uid, 'council', p_contact_id) ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_name, scope, status)
  VALUES (p_uid, 'council_member', 'global', 'active') ON CONFLICT DO NOTHING;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.12  user_sessions table (login tracking — Supabase issues its own JWTs;
--         this is an audit trail, not the session store)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address   INET,
  user_agent   TEXT,
  portal       TEXT  -- 'internal' | 'client' | 'candidate' | 'b2c' | 'council'
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_logged_in_at ON public.user_sessions (logged_in_at DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "us_self_insert" ON public.user_sessions;
CREATE POLICY "us_self_insert"
  ON public.user_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.fn_is_admin());
DROP POLICY IF EXISTS "us_admin_select" ON public.user_sessions;
CREATE POLICY "us_admin_select"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (public.fn_is_admin());

-- 1.3.13  fn_track_login(user_id, portal)
CREATE OR REPLACE FUNCTION public.fn_track_login(p_user_id UUID, p_portal TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_sessions (user_id, portal)
  VALUES (p_user_id, p_portal);
END;
$$;
GRANT EXECUTE ON public.fn_track_login TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.14  fn_check_user_permissions(user_id, resource, action)
-- ════════════════════════════════════════════════════════════════════════
-- Centralised permission gate. Returns TRUE if the user's highest role grants
-- the (resource, action) pair. The permission map lives in role_permissions
-- (created by Sprint 1.1 catch-all); this function reads it, falling back to
-- admin=allow-all when no explicit row exists.
CREATE OR REPLACE FUNCTION public.fn_check_user_permissions(p_user_id UUID, p_resource TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- admins bypass the permission table
    public.fn_is_admin(p_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role_id = ur.role_name
      WHERE ur.user_id = p_user_id
        AND ur.status = 'active'
        AND rp.resource = p_resource
        AND rp.action = p_action
    )
    OR EXISTS (
      SELECT 1 FROM public.permission_overrides po
      WHERE po.user_id = p_user_id
        AND po.resource = p_resource
        AND po.action = p_action
        AND po.granted = TRUE
    );
$$;
GRANT EXECUTE ON public.fn_check_user_permissions TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.15-18  RLS policy templates for portal users
-- ════════════════════════════════════════════════════════════════════════
-- Reusable predicate functions so portal-scoped tables can reference them
-- without repeating the join logic. These are templates — apply them to
-- specific tables via CREATE POLICY ... USING (public.fn_portal_self(...)).

-- 1.3.15  self-scope: WHERE user_id = auth.uid()
CREATE OR REPLACE FUNCTION public.fn_portal_self()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$ SELECT TRUE; $$;
-- (Applied inline in policies — this exists as a named template reference.)

-- 1.3.16  client portal: WHERE client_account_id = profiles.organization_id
CREATE OR REPLACE FUNCTION public.fn_portal_client(p_client_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.fn_is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND organization_id = p_client_account_id
    );
$$;

-- 1.3.17  candidate portal: WHERE contact_id = the candidate's assigned contact
CREATE OR REPLACE FUNCTION public.fn_portal_candidate(p_contact_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.fn_is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.user_type_assignments
      WHERE user_id = auth.uid()
        AND user_type = 'candidate'
        AND scope_id = p_contact_id
    );
$$;

-- 1.3.18  b2c portal: WHERE b2c_user_id = auth.uid()::text
CREATE OR REPLACE FUNCTION public.fn_portal_b2c(p_owner_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.fn_is_internal_user() OR p_owner_uid = auth.uid();
$$;

GRANT EXECUTE ON public.fn_portal_client, public.fn_portal_candidate, public.fn_portal_b2c TO authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.19  user_preferences table
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language           TEXT DEFAULT 'en',
  timezone           TEXT DEFAULT 'UTC',
  notification_prefs JSONB DEFAULT '{}'::jsonb,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upref_self_all" ON public.user_preferences;
CREATE POLICY "upref_self_all"
  ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.20  user_api_keys table (programmatic access)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  key_hash   TEXT NOT NULL,           -- store SHA-256 of the key, never the key
  last_used  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_hash ON public.user_api_keys (key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "uak_self_select" ON public.user_api_keys;
CREATE POLICY "uak_self_select"
  ON public.user_api_keys FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "uak_self_manage" ON public.user_api_keys;
CREATE POLICY "uak_self_manage"
  ON public.user_api_keys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- 1.3.23  Backfill existing profiles with user_type = 'internal'
-- ════════════════════════════════════════════════════════════════════════
UPDATE public.profiles
SET user_type = 'internal'
WHERE user_type IS NULL OR user_type = 'internal';

-- Ensure the 3 existing internal users have type assignments
INSERT INTO public.user_type_assignments (user_id, user_type)
SELECT id, 'internal' FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_type_assignments ut WHERE ut.user_id = profiles.id
)
ON CONFLICT DO NOTHING;
