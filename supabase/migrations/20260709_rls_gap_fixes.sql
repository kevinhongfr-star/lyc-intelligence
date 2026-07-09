-- ════════════════════════════════════════════════════════════════════════
-- 20260709_rls_gap_fixes.sql
-- T7: RLS Gap Fixes — Documents, Credits, Sessions Scoping
-- Fixes 3 security gaps identified in T1 audit
-- ════════════════════════════════════════════════════════════════════════

-- ── FIX 1: documents table RLS ─────────────────────────────────────────
-- The documents table is referenced by documentService.ts (getUserDocuments)
-- and supabaseApi.ts (getDocuments). It has user_id column.
-- TODO: The documents table CREATE TABLE was not found in migration files.
-- It may have been created by Supabase dashboard, a script, or the
-- MASTER_MIGRATION. If it doesn't exist yet, this migration will fail
-- gracefully due to IF EXISTS checks.

DO $$
BEGIN
  -- Enable RLS only if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

    -- Client users can read documents for mandates they have access to
    CREATE POLICY "Client users can read own mandate documents" ON public.documents
      FOR SELECT TO authenticated
      USING (
        -- Document is linked to a mandate the client has access to
        (mandate_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.client_mandate_access cma
          JOIN public.client_accounts ca ON ca.id = cma.client_account_id
          WHERE ca.auth_user_id = auth.uid()
            AND cma.mandate_id = documents.mandate_id
        ))
        -- Or document belongs to the user directly
        OR (user_id = auth.uid())
        -- Or user is LYC staff
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );

    -- LYC staff can insert/update documents
    CREATE POLICY "Staff can manage documents" ON public.documents
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant')
        )
      );

    RAISE NOTICE 'RLS policies created for documents table';
  ELSE
    RAISE NOTICE 'documents table does not exist yet — skipping RLS policies. Create the table first, then re-run this migration or add policies manually.';
  END IF;
END
$$;

-- ── FIX 2: coaching_sessions table + scoped query ──────────────────────
-- The coaching portal fetches upcoming sessions. We need a coaching_sessions
-- table with proper RLS so users only see their own sessions.
-- If the table doesn't exist, we create it. If it does, we add RLS.

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coachee_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id        UUID REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 60,
  format          TEXT NOT NULL DEFAULT 'video' CHECK (format IN ('video', 'in_person', 'phone')),
  status          TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes           TEXT,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  outcome         TEXT CHECK (outcome IN ('completed', 'cancelled', 'no_show')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coachee ON public.coaching_sessions (coachee_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON public.coaching_sessions (coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled ON public.coaching_sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status ON public.coaching_sessions (status);

ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Coachee can see their own sessions
CREATE POLICY "Coachee can read own sessions" ON public.coaching_sessions
  FOR SELECT TO authenticated
  USING (coachee_id = auth.uid());

-- Coach can see sessions assigned to them
CREATE POLICY "Coach can read assigned sessions" ON public.coaching_sessions
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

-- Admin can see all sessions
CREATE POLICY "Admin can read all sessions" ON public.coaching_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'super_admin', 'lyc_admin')
    )
  );

-- Coachee can insert sessions (booking)
CREATE POLICY "Coachee can book sessions" ON public.coaching_sessions
  FOR INSERT TO authenticated
  WITH CHECK (coachee_id = auth.uid());

-- Coach and admin can update sessions
CREATE POLICY "Coach and admin can update sessions" ON public.coaching_sessions
  FOR UPDATE TO authenticated
  USING (
    coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'super_admin', 'lyc_admin')
    )
  );

-- ── FIX 3: credits table — add admin access policy ────────────────────
-- The credits table already has RLS (20260625_create_missing_core_tables.sql)
-- with "Users read own credits" and "Users update own credits" policies.
-- However, it's missing a policy for admin/staff access.
-- The user_credits table (20250707_nexus_chat_tables.sql) also has RLS
-- but is missing admin access.

-- Add admin access to credits table (if policy doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'credits' AND policyname = 'Admin can read all credits'
  ) THEN
    CREATE POLICY "Admin can read all credits" ON public.credits
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin')
        )
      );
    RAISE NOTICE 'Admin read policy added to credits table';
  END IF;
END
$$;

-- Add admin access to user_credits table (if policy doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_credits' AND policyname = 'Admin can read all user_credits'
  ) THEN
    CREATE POLICY "Admin can read all user_credits" ON public.user_credits
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'lyc_admin')
        )
      );
    RAISE NOTICE 'Admin read policy added to user_credits table';
  END IF;
END
$$;

-- ── SMOKE TEST: Verify policies exist ──────────────────────────────────
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Check coaching_sessions policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'coaching_sessions';
  IF policy_count < 3 THEN
    RAISE WARNING 'coaching_sessions has fewer than 3 RLS policies (found %)', policy_count;
  ELSE
    RAISE NOTICE 'coaching_sessions RLS policies OK (% found)', policy_count;
  END IF;

  -- Check credits policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'credits';
  IF policy_count < 3 THEN
    RAISE WARNING 'credits has fewer than 3 RLS policies (found %)', policy_count;
  ELSE
    RAISE NOTICE 'credits RLS policies OK (% found)', policy_count;
  END IF;

  -- Check user_credits policies
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'user_credits';
  IF policy_count < 3 THEN
    RAISE WARNING 'user_credits has fewer than 3 RLS policies (found %)', policy_count;
  ELSE
    RAISE NOTICE 'user_credits RLS policies OK (% found)', policy_count;
  END IF;

  -- Check documents policies (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'documents';
    IF policy_count < 1 THEN
      RAISE WARNING 'documents table exists but has NO RLS policies!';
    ELSE
      RAISE NOTICE 'documents RLS policies OK (% found)', policy_count;
    END IF;
  ELSE
    RAISE NOTICE 'documents table does not exist — RLS not applicable yet';
  END IF;
END
$$;
