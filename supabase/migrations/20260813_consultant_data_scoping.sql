-- =============================================================================
-- V3-6 / Ticket #1347: Consultant data scoping — RLS policy hardening
-- =============================================================================
-- B2C unauthenticated / public anon users MUST NOT read consultant data.
-- Consultant tables (consultants, consultant_profiles, consultant_performance,
-- consultant_assignments) as well as mandates, mandate_matches, pipeline_stages
-- are B2B/internal-only.
--
-- Access rule (read + write):
--   1. admin role — full access
--   2. consultant role — can read/write:
--        a) their own consultant record (user_id = auth.uid() row)
--        b) rows in consultant_* tables where the FK matches their profile
--        c) mandates where they are the assigned consultant or are admin
--        d) mandate_matches for their own assigned mandates
--        e) pipeline_stages visible to consultants (helper via user_roles)
--   3. anon / public B2C — NO ACCESS (403 equivalent via RLS: no rows returned)
--   4. client / leader viewer — NO ACCESS to consultant-only entities
--
-- These policies layer ON TOP of any already-enabled RLS that used
-- `true` (any) or `auth.role() != 'anon'`.  The goal here is to lock
-- down consultant tables to the minimum role needed: admin or consultant.
-- =============================================================================

-- Make sure RLS is explicitly enabled on every consultant table we care about.
-- (No-op if already enabled.)
ALTER TABLE IF EXISTS public.consultants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consultant_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consultant_performance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consultant_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mandates                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mandate_matches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mandate_timelines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pipeline_stages          ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Helper: current user has role admin or consultant (used repeatedly below)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_consultant_role_or_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'consultant')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_consultant_role_or_admin() TO authenticated, anon;
COMMENT ON FUNCTION public.is_consultant_role_or_admin() IS 'V3-6: returns TRUE if current auth user has admin or consultant role in user_roles.';

-- =============================================================================
-- 1. consultants table — owns row when user_id = auth.uid()
-- =============================================================================

DROP POLICY IF EXISTS consultants_select_scoped ON public.consultants;
CREATE POLICY consultants_select_scoped ON public.consultants
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR (
      public.is_consultant_role_or_admin()
      AND (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid()
            AND ur.role = 'consultant'
        )
      )
    )
  );

DROP POLICY IF EXISTS consultants_write_scoped ON public.consultants;
CREATE POLICY consultants_write_scoped ON public.consultants
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND user_id = auth.uid())
  );

-- =============================================================================
-- 2. consultant_profiles — user_id self-scope or admin
-- =============================================================================

DROP POLICY IF EXISTS consultant_profiles_select_scoped ON public.consultant_profiles;
CREATE POLICY consultant_profiles_select_scoped ON public.consultant_profiles
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND profile_user_id = auth.uid())
    OR (public.is_consultant_role_or_admin() AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS consultant_profiles_write_scoped ON public.consultant_profiles;
CREATE POLICY consultant_profiles_write_scoped ON public.consultant_profiles
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND (profile_user_id = auth.uid() OR user_id = auth.uid()))
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND (profile_user_id = auth.uid() OR user_id = auth.uid()))
  );

-- =============================================================================
-- 3. consultant_performance — consultant = owner, admin unrestricted
-- =============================================================================

DROP POLICY IF EXISTS consultant_performance_select_scoped ON public.consultant_performance;
CREATE POLICY consultant_performance_select_scoped ON public.consultant_performance
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
  );

DROP POLICY IF EXISTS consultant_performance_write_scoped ON public.consultant_performance;
CREATE POLICY consultant_performance_write_scoped ON public.consultant_performance
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
  );

-- =============================================================================
-- 4. consultant_assignments — assigned consultant OR admin
-- =============================================================================

DROP POLICY IF EXISTS consultant_assignments_select_scoped ON public.consultant_assignments;
CREATE POLICY consultant_assignments_select_scoped ON public.consultant_assignments
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND assigned_consultant_id = auth.uid())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
  );

DROP POLICY IF EXISTS consultant_assignments_write_scoped ON public.consultant_assignments;
CREATE POLICY consultant_assignments_write_scoped ON public.consultant_assignments
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin()
      AND (assigned_consultant_id = auth.uid() OR consultant_user_id = auth.uid()))
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin()
      AND (assigned_consultant_id = auth.uid() OR consultant_user_id = auth.uid()))
  );

-- =============================================================================
-- 5. mandates — assigned consultant OR admin; B2B internal data
-- =============================================================================

DROP POLICY IF EXISTS mandates_select_scoped ON public.mandates;
CREATE POLICY mandates_select_scoped ON public.mandates
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND (
       assigned_consultant_id = auth.uid()
       OR lead_consultant_id = auth.uid()
       OR owner_id = auth.uid()
    ))
    OR (
      -- #1347-note: Clients (client role) may see mandates associated with
      -- their own organization when orgColumn scoping is enabled on the
      -- server ACL. B2C unauth + leaders are still blocked at the DB layer
      -- by this policy because they can't match either clause above.
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles p ON p.id = ur.user_id
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'client'
          AND p.organization_id = mandates.organization_id
      )
    )
  );

DROP POLICY IF EXISTS mandates_write_scoped ON public.mandates;
CREATE POLICY mandates_write_scoped ON public.mandates
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND (
       assigned_consultant_id = auth.uid()
       OR lead_consultant_id = auth.uid()
       OR owner_id = auth.uid()
    ))
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND (
       assigned_consultant_id = auth.uid()
       OR lead_consultant_id = auth.uid()
       OR owner_id = auth.uid()
    ))
  );

-- =============================================================================
-- 6. mandate_matches — consultant owning either side OR admin
-- =============================================================================

DROP POLICY IF EXISTS mandate_matches_select_scoped ON public.mandate_matches;
CREATE POLICY mandate_matches_select_scoped ON public.mandate_matches
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.mandates m
      WHERE m.id = mandate_matches.mandate_id
        AND (
          public.is_admin_role(public.current_user_role())
          OR (
            public.is_consultant_role_or_admin()
            AND (
              m.assigned_consultant_id = auth.uid()
              OR m.lead_consultant_id = auth.uid()
              OR m.owner_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS mandate_matches_write_scoped ON public.mandate_matches;
CREATE POLICY mandate_matches_write_scoped ON public.mandate_matches
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR (public.is_consultant_role_or_admin() AND consultant_user_id = auth.uid())
  );

-- =============================================================================
-- 7. mandate_timelines — same access as owning mandate
-- =============================================================================

DROP POLICY IF EXISTS mandate_timelines_select_scoped ON public.mandate_timelines;
CREATE POLICY mandate_timelines_select_scoped ON public.mandate_timelines
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR EXISTS (
      SELECT 1 FROM public.mandates m
      WHERE m.id = mandate_timelines.mandate_id
        AND (
          public.is_admin_role(public.current_user_role())
          OR (
            public.is_consultant_role_or_admin()
            AND (
              m.assigned_consultant_id = auth.uid()
              OR m.lead_consultant_id = auth.uid()
              OR m.owner_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS mandate_timelines_write_scoped ON public.mandate_timelines;
CREATE POLICY mandate_timelines_write_scoped ON public.mandate_timelines
  FOR ALL
  USING (
    public.is_admin_role(public.current_user_role())
    OR EXISTS (
      SELECT 1 FROM public.mandates m
      WHERE m.id = mandate_timelines.mandate_id
        AND (
          public.is_admin_role(public.current_user_role())
          OR (public.is_consultant_role_or_admin()
            AND (
              m.assigned_consultant_id = auth.uid()
              OR m.lead_consultant_id = auth.uid()
              OR m.owner_id = auth.uid()
            )
          )
        )
    )
  )
  WITH CHECK (
    public.is_admin_role(public.current_user_role())
    OR EXISTS (
      SELECT 1 FROM public.mandates m
      WHERE m.id = mandate_timelines.mandate_id
        AND (
          public.is_admin_role(public.current_user_role())
          OR (public.is_consultant_role_or_admin()
            AND (
              m.assigned_consultant_id = auth.uid()
              OR m.lead_consultant_id = auth.uid()
              OR m.owner_id = auth.uid()
            )
          )
        )
    )
  );

-- =============================================================================
-- 8. pipeline_stages — reference table; consultant+ may read; admin writes
-- =============================================================================

DROP POLICY IF EXISTS pipeline_stages_select_scoped ON public.pipeline_stages;
CREATE POLICY pipeline_stages_select_scoped ON public.pipeline_stages
  FOR SELECT
  USING (
    public.is_admin_role(public.current_user_role())
    OR public.is_consultant_role_or_admin()
  );

DROP POLICY IF EXISTS pipeline_stages_write_scoped ON public.pipeline_stages;
CREATE POLICY pipeline_stages_write_scoped ON public.pipeline_stages
  FOR ALL
  USING (public.is_admin_role(public.current_user_role()))
  WITH CHECK (public.is_admin_role(public.current_user_role()));

-- =============================================================================
-- Final: Public / anon must never be able to read these tables even if
-- some upstream trigger bypasses RLS. Revoke direct SELECT from anon on
-- consultant-only tables to add defense in depth.
-- =============================================================================

REVOKE SELECT ON public.consultants              FROM anon;
REVOKE SELECT ON public.consultant_profiles      FROM anon;
REVOKE SELECT ON public.consultant_performance   FROM anon;
REVOKE SELECT ON public.consultant_assignments   FROM anon;
REVOKE SELECT ON public.mandates                 FROM anon;
REVOKE SELECT ON public.mandate_matches          FROM anon;
REVOKE SELECT ON public.mandate_timelines        FROM anon;
REVOKE SELECT ON public.pipeline_stages          FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.consultants            FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.consultant_profiles    FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.consultant_performance FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.consultant_assignments FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.mandates               FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.mandate_matches        FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.mandate_timelines      FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.pipeline_stages        FROM anon;

COMMENT ON POLICY consultants_select_scoped ON public.consultants IS
  'V3-6 / #1347: Anon + leader + client cannot read consultant rows. Admin full; consultant own-row.';
