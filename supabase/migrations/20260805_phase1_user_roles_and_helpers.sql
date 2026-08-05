-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.1 — Role hierarchy & RLS helper functions
-- Tickets: 1.1.12, 1.1.13, 1.1.14, 1.1.15, 1.1.16, 1.1.17
-- Issue: #3 (P0 security blocker)
--
-- Establishes the role infrastructure the rest of the RLS lockdown depends on:
--   1. user_roles table mapping users → roles with optional org scope
--   2. Role hierarchy: super_admin > admin > consultant > viewer
--      (plus portal roles: client_admin, client_user, council_member,
--       candidate, b2c_user — these are orthogonal, not in the hierarchy)
--   3. STABLE SQL helper functions for use inside RLS USING clauses:
--        fn_is_admin(uid)           — super_admin or admin
--        fn_is_consultant(uid)      — super_admin, admin, or consultant
--        fn_is_internal_user(uid)   — any internal role (above + viewer)
--   4. Backfill: every existing profile gets the 'admin' role so the current
--      3 internal users keep access. Revoke individually before go-live.
--
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS,
-- CREATE OR REPLACE FUNCTION, INSERT ... ON CONFLICT).
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1.1.12 user_roles table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  role_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name   TEXT NOT NULL,
  org_id      UUID,  -- optional scope; NULL = global / personal role
  scope       TEXT,  -- 'global' | 'org' | 'client' | 'mandate'
  status      TEXT NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  CONSTRAINT user_roles_role_name_check CHECK (
    role_name IN (
      'super_admin', 'admin', 'consultant', 'viewer',
      'client_admin', 'client_user',
      'council_member', 'candidate', 'b2c_user'
    )
  ),
  CONSTRAINT user_roles_scope_check CHECK (
    scope IN ('global', 'org', 'client', 'mandate')
  )
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name
  ON public.user_roles (role_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_user_role_org
  ON public.user_roles (user_id, role_name, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'));

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- During bootstrap, authenticated users can read their own roles; admins read
-- all. Writes go through the service role (server-side handlers).
DROP POLICY IF EXISTS "user_roles_self_select" ON public.user_roles;
CREATE POLICY "user_roles_self_select"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── 1.1.13 Role hierarchy ───────────────────────────────────────────────
-- Captured as a lookup function so policy checks stay consistent. Hierarchy:
--   super_admin > admin > consultant > viewer
-- Portal roles (client_admin, client_user, council_member, candidate,
-- b2c_user) are NOT in the internal hierarchy — they grant portal-specific
-- access only.

CREATE OR REPLACE FUNCTION public.fn_role_rank(role_name TEXT)
RETURNS INT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN role_name = 'super_admin' THEN 100
    WHEN role_name = 'admin'       THEN 80
    WHEN role_name = 'consultant'  THEN 60
    WHEN role_name = 'viewer'      THEN 40
    ELSE 0  -- portal roles have no internal rank
  END;
$$;

-- ── 1.1.14 / 1.1.15 / 1.1.16 RLS helper functions ───────────────────────
-- All STABLE + SECURITY DEFINER so they can be referenced inside RLS USING
-- clauses without the caller needing direct SELECT on user_roles.

-- fn_is_admin(uid): true if user holds super_admin or admin (any scope).
CREATE OR REPLACE FUNCTION public.fn_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND status = 'active'
      AND role_name IN ('super_admin', 'admin')
  );
$$;

-- fn_is_consultant(uid): true for super_admin, admin, or consultant.
CREATE OR REPLACE FUNCTION public.fn_is_consultant(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND status = 'active'
      AND role_name IN ('super_admin', 'admin', 'consultant')
  );
$$;

-- fn_is_internal_user(uid): true for any internal role
-- (super_admin, admin, consultant, viewer).
CREATE OR REPLACE FUNCTION public.fn_is_internal_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND status = 'active'
      AND role_name IN ('super_admin', 'admin', 'consultant', 'viewer')
  );
$$;

-- Convenience overloads taking no argument (use auth.uid() at call site).
CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.fn_is_admin(auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.fn_is_consultant()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.fn_is_consultant(auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.fn_is_internal_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.fn_is_internal_user(auth.uid()); $$;

-- ── 1.1.17 Backfill existing profiles as admins ─────────────────────────
-- Every profile that exists at migration time gets the 'admin' role so the
-- current internal team keeps full access. Before go-live, audit and demote
-- non-admin users to their correct portal role.
INSERT INTO public.user_roles (user_id, role_name, scope, status, assigned_at)
SELECT id, 'admin', 'global', 'active', now()
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = profiles.id
    AND ur.role_name = 'admin'
)
ON CONFLICT DO NOTHING;

GRANT SELECT ON public.user_roles TO authenticated, anon;
GRANT SELECT ON public.fn_role_rank TO PUBLIC;
