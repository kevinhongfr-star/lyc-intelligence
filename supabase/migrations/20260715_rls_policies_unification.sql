-- =====================================================
-- FIXED Migration #3: RLS Policies Unification
-- Adapted to match ACTUAL schema (2026-07-16)
-- Functions in PUBLIC schema (not auth)
-- Column refs: org_id (not organization_id) on v2_org_memberships
-- =====================================================

-- 1. Helper functions in PUBLIC schema (not auth)
CREATE OR REPLACE FUNCTION public.user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.v2_user_profiles p
    WHERE p.id = auth.uid()
    AND p.role::TEXT = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.user_has_role(ARRAY['super_admin']) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.v2_org_memberships om
    WHERE om.user_id = auth.uid()
    AND om.org_id = p_org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.user_has_role(ARRAY['super_admin']) THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.v2_org_memberships om
    WHERE om.user_id = auth.uid()
    AND om.org_id = p_org_id
    AND om.role IN ('admin', 'super_admin', 'team_lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.user_has_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_org_admin(UUID) TO authenticated;

-- 2. V2_USER_PROFILES policies (already has some, drop and recreate)
ALTER TABLE public.v2_user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.v2_user_profiles;

CREATE POLICY "v2_profiles_self_select"
  ON public.v2_user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "v2_profiles_self_update"
  ON public.v2_user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "v2_profiles_admin_all"
  ON public.v2_user_profiles FOR ALL
  TO authenticated
  USING (
    public.user_has_role(ARRAY['super_admin', 'admin'])
  );

-- 3. V2_ORGANIZATIONS policies
ALTER TABLE public.v2_organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their org" ON public.v2_organizations;

CREATE POLICY "v2_orgs_member_select"
  ON public.v2_organizations FOR SELECT
  TO authenticated
  USING (
    public.user_is_org_member(id)
    OR public.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "v2_orgs_admin_update"
  ON public.v2_organizations FOR UPDATE
  TO authenticated
  USING (
    public.user_is_org_admin(id)
    OR public.user_has_role(ARRAY['super_admin'])
  );

-- 4. V2_ORG_MEMBERSHIPS policies
ALTER TABLE public.v2_org_memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view memberships in their org" ON public.v2_org_memberships;
DROP POLICY IF EXISTS "Admins can manage memberships in their org" ON public.v2_org_memberships;

CREATE POLICY "v2_memberships_member_select"
  ON public.v2_org_memberships FOR SELECT
  TO authenticated
  USING (
    public.user_is_org_member(org_id)
    OR public.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "v2_memberships_admin_all"
  ON public.v2_org_memberships FOR ALL
  TO authenticated
  USING (
    public.user_is_org_admin(org_id)
    OR public.user_has_role(ARRAY['super_admin'])
  );

-- 5. MANDATES policies (organization_id column exists)
ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consultants can view mandates in their org" ON public.mandates;
DROP POLICY IF EXISTS "Consultants can create mandates" ON public.mandates;

CREATE POLICY "mandates_org_select"
  ON public.mandates FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    OR public.user_is_org_member(organization_id)
    OR public.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

CREATE POLICY "mandates_consultant_insert"
  ON public.mandates FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

CREATE POLICY "mandates_org_update"
  ON public.mandates FOR UPDATE
  TO authenticated
  USING (
    public.user_is_org_member(organization_id)
    AND public.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

-- 6. CANDIDATES policies (uses org_id)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consultants can view candidates in their org" ON public.candidates;

CREATE POLICY "candidates_org_select"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL
    OR public.user_is_org_member(org_id)
    OR public.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "candidates_consultant_insert"
  ON public.candidates FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

-- 7. V2_COMPANIES policies (uses org_id)
ALTER TABLE public.v2_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view companies in their org" ON public.v2_companies;

CREATE POLICY "v2_companies_org_select"
  ON public.v2_companies FOR SELECT
  TO authenticated
  USING (
    public.user_is_org_member(org_id)
    OR public.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "v2_companies_consultant_all"
  ON public.v2_companies FOR ALL
  TO authenticated
  USING (
    public.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

-- 8. CREDITS policies
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own credits" ON public.credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.credits;

CREATE POLICY "credits_self_select"
  ON public.credits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "credits_self_update"
  ON public.credits FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "credits_service_all"
  ON public.credits FOR ALL
  TO service_role
  USING (true);

-- 9. V2_CREDIT_TRANSACTIONS policies
CREATE POLICY "v2_credits_self_select"
  ON public.v2_credit_transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT org_id FROM public.v2_org_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "v2_credits_service_all"
  ON public.v2_credit_transactions FOR ALL
  TO service_role
  USING (true);

-- 10. NOTIFICATIONS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

CREATE POLICY "notifications_self_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_self_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_self_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 11. ROLE_PERMISSIONS policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Only super admin can manage role permissions" ON public.role_permissions;

CREATE POLICY "role_perms_public_read"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "role_perms_admin_manage"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.user_has_role(ARRAY['super_admin']));

-- 12. Global grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
