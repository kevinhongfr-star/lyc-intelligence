-- =====================================================
-- FIXED Migration #1: Auth & RBAC Unification
-- Adapted to match ACTUAL schema (2026-07-16)
-- =====================================================

-- 1. Create enum types for roles and tiers (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'super_admin', 'admin', 'team_lead', 'consultant',
      'client_admin', 'client_user', 'council_member', 'candidate', 'member'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_tier') THEN
    CREATE TYPE public.credit_tier AS ENUM (
      'free', 'member', 'pro', 'council', 'enterprise'
    );
  END IF;
END $$;

-- 2. Add missing columns to v2_user_profiles (table already exists)
ALTER TABLE public.v2_user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS tier public.credit_tier DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add FK to v2_organizations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'v2_user_profiles_org_fk'
  ) THEN
    ALTER TABLE public.v2_user_profiles
      ADD CONSTRAINT v2_user_profiles_org_fk
      FOREIGN KEY (organization_id) REFERENCES public.v2_organizations(id);
  END IF;
END $$;

-- 3. Add missing columns to v2_organizations (table already exists)
ALTER TABLE public.v2_organizations
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- 4. Expand role_permissions CHECK constraints to support new roles
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_check;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_check
  CHECK (role IN (
    'super_admin', 'admin', 'team_lead', 'consultant',
    'client_admin', 'client_user', 'council_member', 'candidate', 'member',
    'client'  -- keep legacy value
  ));

-- Expand action CHECK to include new action types
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_action_check;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_action_check
  CHECK (action IN (
    'create', 'read_own', 'read_all', 'update_own', 'update_any',
    'delete', 'export', 'review', 'approve', 'administer',
    'view', 'edit', 'admin'  -- add simpler action types used by DEX AI
  ));

-- Expand resource CHECK to include DEX AI resources
ALTER TABLE public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_resource_check;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_resource_check
  CHECK (resource IN (
    'contacts', 'mandates', 'signals', 'agent_actions', 'pipeline_transitions',
    'client_accounts', 'client_feedback', 'import', 'saved_searches',
    'grid_reports', 'trident_scorecards', 'canvas_profiles', 'match_results',
    'notifications', 'rbac_settings',
    'admin', 'team', 'billing', 'settings', 'analytics',
    'pipeline', 'candidates', 'companies', 'reports', 'nexus', 'dashboard'
  ));

-- 5. Update handle_new_user to also populate v2_user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into legacy profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into v2_user_profiles
  INSERT INTO public.v2_user_profiles (id, user_id, full_name, email, name, role, tier)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'member'),
    COALESCE((NEW.raw_user_meta_data->>'tier')::public.credit_tier, 'free')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create credits row
  INSERT INTO public.credits (user_id, balance, daily_balance, tier)
  VALUES (NEW.id, 2, 2, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  -- Create user_credits row
  INSERT INTO public.user_credits (user_id, balance, tier, daily_grant)
  VALUES (NEW.id, 5, 'free', 5)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Function to update JWT claims (using correct column references)
CREATE OR REPLACE FUNCTION public.custom_access_token(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  v_role TEXT;
  v_tier TEXT;
  v_org_id UUID;
  v_name TEXT;
  v_org_role TEXT;
BEGIN
  SELECT role::TEXT, tier::TEXT, organization_id, name
  INTO v_role, v_tier, v_org_id, v_name
  FROM public.v2_user_profiles
  WHERE id = (event->>'user_id')::UUID;

  IF v_role IS NULL THEN
    claims := jsonb_build_object(
      'user_role', 'member',
      'user_tier', 'free',
      'org_id', null,
      'org_role', null
    );
  ELSE
    IF v_org_id IS NOT NULL THEN
      SELECT role INTO v_org_role
      FROM public.v2_org_memberships
      WHERE user_id = (event->>'user_id')::UUID
        AND org_id = v_org_id;
    END IF;

    claims := jsonb_build_object(
      'user_role', v_role,
      'user_tier', v_tier,
      'org_id', v_org_id,
      'org_role', COALESCE(v_org_role, v_role),
      'user_name', v_name
    );
  END IF;

  RETURN event || jsonb_build_object('claims', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.custom_access_token(JSONB) TO postgres, authenticated;

-- 7. Helper: get current user's permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions()
RETURNS TABLE (resource TEXT, action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT rp.resource, rp.action
  FROM public.role_permissions rp
  WHERE rp.role = (
    SELECT role::TEXT FROM public.v2_user_profiles WHERE id = auth.uid()
  )
  AND rp.allowed = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_permissions() TO authenticated;

-- 8. Helper: create user profile (RPC)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT ''
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.v2_user_profiles (id, user_id, email, name, full_name, role, tier)
  VALUES (p_user_id, p_user_id, p_email, p_name, p_name, 'member', 'free')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, v2_user_profiles.name),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- 9. updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_v2_user_profiles_updated_at ON public.v2_user_profiles;
CREATE TRIGGER update_v2_user_profiles_updated_at
  BEFORE UPDATE ON public.v2_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Seed default role permissions (using valid enum values)
INSERT INTO public.role_permissions (role, resource, action, allowed)
VALUES
  ('super_admin', 'admin', 'admin', TRUE),
  ('super_admin', 'team', 'admin', TRUE),
  ('super_admin', 'billing', 'admin', TRUE),
  ('super_admin', 'settings', 'admin', TRUE),
  ('super_admin', 'analytics', 'admin', TRUE),
  ('admin', 'admin', 'view', TRUE),
  ('admin', 'team', 'admin', TRUE),
  ('admin', 'billing', 'view', TRUE),
  ('admin', 'settings', 'edit', TRUE),
  ('admin', 'analytics', 'view', TRUE),
  ('team_lead', 'pipeline', 'admin', TRUE),
  ('team_lead', 'mandates', 'admin', TRUE),
  ('team_lead', 'candidates', 'admin', TRUE),
  ('team_lead', 'reports', 'export', TRUE),
  ('consultant', 'pipeline', 'view', TRUE),
  ('consultant', 'mandates', 'edit', TRUE),
  ('consultant', 'candidates', 'edit', TRUE),
  ('consultant', 'companies', 'view', TRUE),
  ('consultant', 'reports', 'view', TRUE),
  ('consultant', 'nexus', 'view', TRUE),
  ('client_admin', 'dashboard', 'view', TRUE),
  ('client_admin', 'mandates', 'view', TRUE),
  ('client_admin', 'candidates', 'view', TRUE),
  ('client_admin', 'reports', 'view', TRUE),
  ('client_admin', 'settings', 'edit', TRUE),
  ('client_user', 'dashboard', 'view', TRUE),
  ('client_user', 'mandates', 'view', TRUE),
  ('client_user', 'candidates', 'view', TRUE),
  ('client_user', 'reports', 'view', TRUE),
  ('council_member', 'dashboard', 'view', TRUE),
  ('council_member', 'nexus', 'view', TRUE),
  ('council_member', 'settings', 'view', TRUE),
  ('candidate', 'dashboard', 'view', TRUE),
  ('candidate', 'settings', 'view', TRUE),
  ('member', 'dashboard', 'view', TRUE),
  ('member', 'nexus', 'view', TRUE),
  ('member', 'settings', 'view', TRUE)
ON CONFLICT (role, resource, action) DO UPDATE SET allowed = EXCLUDED.allowed;

-- 11. Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.v2_user_profiles TO authenticated;
