-- =====================================================
-- Phase 1: Auth & RBAC Unification
-- JWT Custom Claims + Profile Auto-Creation
-- =====================================================

-- 1. Create enum types for roles and tiers (if not exists)
DO $$
BEGIN
  -- Create user_role enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'super_admin',
      'admin',
      'team_lead',
      'consultant',
      'client_admin',
      'client_user',
      'council_member',
      'candidate',
      'member'
    );
  END IF;
  
  -- Create credit_tier enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_tier') THEN
    CREATE TYPE public.credit_tier AS ENUM (
      'free',
      'member',
      'pro',
      'council',
      'enterprise'
    );
  END IF;
END $$;

-- 2. Create or replace the unified profiles table
CREATE TABLE IF NOT EXISTS public.v2_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role public.user_role NOT NULL DEFAULT 'member',
  tier public.credit_tier NOT NULL DEFAULT 'free',
  organization_id UUID REFERENCES public.v2_organizations(id),
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  locale TEXT DEFAULT 'en',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

-- Enable RLS
ALTER TABLE public.v2_user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for v2_user_profiles
CREATE POLICY "Users can view own profile"
  ON public.v2_user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.v2_user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON public.v2_user_profiles FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can view all profiles"
  ON public.v2_user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships om
      JOIN public.v2_organizations o ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('admin', 'super_admin')
    )
  );

-- 3. Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into v2_user_profiles
  INSERT INTO public.v2_user_profiles (id, email, name, role, tier, metadata)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role)::public.user_role,
      'member'::public.user_role
    ),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'tier)::public.credit_tier,
      'free'::public.credit_tier
    ),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );
  
  -- Also create credits row
  INSERT INTO public.credits (user_id, balance, daily_balance, tier, last_daily_reset)
  VALUES (
    NEW.id,
    2, -- Default 2 credits for free tier
    2,
    'free',
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create new
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Function to update JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  profile RECORD;
  org_role TEXT;
  org_id UUID;
BEGIN
  -- Get user profile
  SELECT role, tier, organization_id, name
  INTO profile
  FROM public.v2_user_profiles
  WHERE id = (event ->> 'user_id')::UUID;
  
  -- If no profile, use defaults
  IF profile IS NULL THEN
    claims := jsonb_build_object(
      'user_role', 'member',
      'user_tier', 'free',
      'org_id', null,
      'org_role', null
    );
  ELSE
    -- Get org role if user belongs to organization
    IF profile.organization_id IS NOT NULL THEN
      SELECT role, organization_id
      INTO org_role, org_id
      FROM public.v2_org_memberships
      WHERE user_id = (event ->> 'user_id')::UUID
        AND organization_id = profile.organization_id;
    END IF;
    
    claims := jsonb_build_object(
      'user_role', profile.role::TEXT,
      'user_tier', profile.tier::TEXT,
      'org_id', profile.organization_id,
      'org_role', COALESCE(org_role, profile.role::TEXT),
      'user_name', profile.name
    );
  END IF;
  
  -- Merge with existing claims
  RETURN event || jsonb_build_object('claims', claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.custom_access_token(JSONB) TO postgres;

-- 5. Register the JWT hook (requires pg_net extension)
-- Note: This requires Supabase dashboard configuration
-- Go to Authentication > URL Configuration > JWT Custom Claims
-- and add: public.custom_access_token

-- 6. Create function to get current user's permissions
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

-- 7. Update trigger for updated_at
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

-- 8. Seed default role permissions
INSERT INTO public.role_permissions (role, resource, action, allowed)
VALUES
  -- Super admin - full access
  ('super_admin', 'admin', 'admin', TRUE),
  ('super_admin', 'team', 'admin', TRUE),
  ('super_admin', 'billing', 'admin', TRUE),
  ('super_admin', 'settings', 'admin', TRUE),
  ('super_admin', 'analytics', 'admin', TRUE),
  
  -- Admin
  ('admin', 'admin', 'view', TRUE),
  ('admin', 'team', 'admin', TRUE),
  ('admin', 'billing', 'view', TRUE),
  ('admin', 'settings', 'edit', TRUE),
  ('admin', 'analytics', 'view', TRUE),
  
  -- Team lead
  ('team_lead', 'pipeline', 'admin', TRUE),
  ('team_lead', 'mandates', 'admin', TRUE),
  ('team_lead', 'candidates', 'admin', TRUE),
  ('team_lead', 'reports', 'export', TRUE),
  
  -- Consultant
  ('consultant', 'pipeline', 'view', TRUE),
  ('consultant', 'mandates', 'edit', TRUE),
  ('consultant', 'candidates', 'edit', TRUE),
  ('consultant', 'companies', 'view', TRUE),
  ('consultant', 'reports', 'view', TRUE),
  ('consultant', 'nexus', 'view', TRUE),
  
  -- Client admin
  ('client_admin', 'dashboard', 'view', TRUE),
  ('client_admin', 'mandates', 'view', TRUE),
  ('client_admin', 'candidates', 'view', TRUE),
  ('client_admin', 'reports', 'view', TRUE),
  ('client_admin', 'settings', 'edit', TRUE),
  
  -- Client user
  ('client_user', 'dashboard', 'view', TRUE),
  ('client_user', 'mandates', 'view', TRUE),
  ('client_user', 'candidates', 'view', TRUE),
  ('client_user', 'reports', 'view', TRUE),
  
  -- Council member
  ('council_member', 'dashboard', 'view', TRUE),
  ('council_member', 'nexus', 'view', TRUE),
  ('council_member', 'settings', 'view', TRUE),
  
  -- Candidate
  ('candidate', 'dashboard', 'view', TRUE),
  ('candidate', 'settings', 'view', TRUE),
  
  -- Member (B2C)
  ('member', 'dashboard', 'view', TRUE),
  ('member', 'nexus', 'view', TRUE),
  ('member', 'settings', 'view', TRUE)
ON CONFLICT (role, resource, action) DO UPDATE SET allowed = EXCLUDED.allowed;

-- 9. Create helper function for RPC
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT ''
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.v2_user_profiles (id, email, name, role, tier)
  VALUES (user_id, user_email, user_name, 'member', 'free')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, v2_user_profiles.name),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.v2_user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT) TO authenticated;