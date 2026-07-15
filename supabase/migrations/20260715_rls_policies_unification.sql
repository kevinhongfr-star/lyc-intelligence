-- =====================================================
-- Phase 1: RLS Policies Unification
-- Fixes role mismatches and adds comprehensive policies
-- =====================================================

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION auth.user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user's role matches any of the required roles
  RETURN EXISTS (
    SELECT 1 FROM public.v2_user_profiles p
    WHERE p.id = auth.uid()
    AND p.role::TEXT = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function to check org membership
CREATE OR REPLACE FUNCTION auth.user_is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have access to all orgs
  IF auth.user_has_role(ARRAY['super_admin']) THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.v2_org_memberships om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function to check if user is admin for org
CREATE OR REPLACE FUNCTION auth.user_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admins have admin access to all orgs
  IF auth.user_has_role(ARRAY['super_admin']) THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.v2_org_memberships om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = org_id
    AND om.role IN ('admin', 'team_lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- V2_USER_PROFILES POLICIES
-- =====================================================

ALTER TABLE public.v2_user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.v2_user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.v2_user_profiles;

CREATE POLICY "Users can view own profile"
  ON public.v2_user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.v2_user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles in org"
  ON public.v2_user_profiles FOR ALL
  USING (
    auth.user_is_org_admin(organization_id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

-- =====================================================
-- V2_ORGANIZATIONS POLICIES
-- =====================================================

ALTER TABLE public.v2_organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org" ON public.v2_organizations;

CREATE POLICY "Users can view their org"
  ON public.v2_organizations FOR SELECT
  USING (
    auth.user_is_org_member(id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "Admins can update their org"
  ON public.v2_organizations FOR UPDATE
  USING (
    auth.user_is_org_admin(id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

-- =====================================================
-- V2_ORG_MEMBERSHIPS POLICIES
-- =====================================================

ALTER TABLE public.v2_org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memberships in their org"
  ON public.v2_org_memberships FOR SELECT
  USING (
    auth.user_is_org_member(organization_id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "Admins can manage memberships in their org"
  ON public.v2_org_memberships FOR ALL
  USING (
    auth.user_is_org_admin(organization_id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

-- =====================================================
-- MANDATES POLICIES
-- =====================================================

ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view mandates in their org" ON public.mandates;

CREATE POLICY "Consultants can view mandates in their org"
  ON public.mandates FOR SELECT
  USING (
    auth.user_is_org_member(organization_id)
    OR auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

CREATE POLICY "Consultants can create mandates"
  ON public.mandates FOR INSERT
  WITH CHECK (
    auth.user_is_org_member(organization_id)
    AND auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

CREATE POLICY "Consultants can update mandates in their org"
  ON public.mandates FOR UPDATE
  USING (
    auth.user_is_org_member(organization_id)
    AND auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

CREATE POLICY "Admins can delete mandates"
  ON public.mandates FOR DELETE
  USING (
    auth.user_is_org_admin(organization_id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

-- =====================================================
-- CANDIDATES POLICIES
-- =====================================================

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Consultants can view candidates in their org"
  ON public.candidates FOR SELECT
  USING (
    organization_id IS NULL
    OR auth.user_is_org_member(organization_id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "Consultants can create candidates"
  ON public.candidates FOR INSERT
  WITH CHECK (
    auth.user_is_org_member(organization_id)
    OR auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

CREATE POLICY "Consultants can update candidates"
  ON public.candidates FOR UPDATE
  USING (
    auth.user_is_org_member(organization_id)
    AND auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

-- =====================================================
-- V2_COMPANIES POLICIES
-- =====================================================

ALTER TABLE public.v2_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view companies in their org"
  ON public.v2_companies FOR SELECT
  USING (
    auth.user_is_org_member(organization_id)
    OR auth.user_has_role(ARRAY['super_admin'])
  );

CREATE POLICY "Consultants can manage companies"
  ON public.v2_companies FOR ALL
  USING (
    auth.user_is_org_member(organization_id)
    AND auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

-- =====================================================
-- CREDITS POLICIES
-- =====================================================

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits"
  ON public.credits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own credits"
  ON public.credits FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on credits"
  ON public.credits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- V2_CREDIT_TRANSACTIONS POLICIES
-- =====================================================

ALTER TABLE public.v2_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.v2_credit_transactions FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM public.v2_org_memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage transactions"
  ON public.v2_credit_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- ROLE_PERMISSIONS POLICIES
-- =====================================================

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT
  USING (TRUE);

CREATE POLICY "Only super admin can manage role permissions"
  ON public.role_permissions FOR ALL
  USING (auth.user_has_role(ARRAY['super_admin']));

-- =====================================================
-- CLIENT PORTAL POLICIES (for client_admin, client_user)
-- =====================================================

-- These allow clients to view their company's data

CREATE POLICY "Clients can view their mandate candidates"
  ON public.mandate_candidates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mandates m
      JOIN public.v2_companies c ON c.id = m.company_id
      JOIN public.client_accounts ca ON ca.company_id = c.id
      WHERE m.id = mandate_candidates.mandate_id
      AND ca.user_id = auth.uid()
    )
    OR auth.user_has_role(ARRAY['super_admin', 'admin', 'team_lead', 'consultant'])
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- TEST QUERIES (smoke tests)
-- =====================================================

-- Verify all tables have RLS enabled
-- Run this to check: 
-- SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;