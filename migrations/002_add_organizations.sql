-- migrations/002_add_organizations.sql
-- Phase 0.2: Multi-Tenant Organization Support
-- Adds organization-scoped access with role-based permissions

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE,
  stripe_customer_id text,
  credit_balance integer DEFAULT 0,
  plan text DEFAULT 'member' CHECK (plan IN ('member', 'council', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create default organization for existing users
INSERT INTO organizations (name, domain, plan)
SELECT 'Default Organization', NULL, 'member'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Default Organization');

-- Add organization_id to existing tables
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE candidates_pipeline ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mandates_org ON mandates(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_org ON candidates_pipeline(organization_id);

-- Update existing profiles with default organization
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after backfill
ALTER TABLE profiles ALTER COLUMN organization_id SET NOT NULL;

-- Role migration: Update legacy roles to new role system
UPDATE profiles SET role = 'member' WHERE role = 'user';
UPDATE profiles SET role = 'super_admin' WHERE role = 'admin';

-- Add role validation constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (
  role IN (
    'candidate',      -- Self only - Candidate Portal
    'member',         -- Self only - B2C Chat
    'council',        -- Self only - paid, 5 credits/day
    'client_admin',   -- Org-scoped - B2B Dashboard
    'client_viewer',  -- Org-scoped - read-only
    'lyc_consultant', -- Cross-org - assigned mandates only
    'lyc_admin',      -- Cross-org - all mandates
    'super_admin'     -- Global - all surfaces
  )
);

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT organization_id INTO org_id
  FROM profiles
  WHERE id = user_id;
  
  RETURN org_id;
END;
$$;

-- Create function to check if user has org-scoped access
CREATE OR REPLACE FUNCTION check_org_access(
  user_id uuid,
  target_organization_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  user_org_id uuid;
BEGIN
  SELECT role, organization_id INTO user_role, user_org_id
  FROM profiles
  WHERE id = user_id;
  
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  IF user_role = 'lyc_admin' THEN
    RETURN true;
  END IF;
  
  IF user_role = 'lyc_consultant' THEN
    RETURN EXISTS (
      SELECT 1 FROM mandates
      WHERE organization_id = target_organization_id
      AND consultant_id = user_id
    );
  END IF;
  
  IF user_role IN ('client_admin', 'client_viewer') THEN
    RETURN user_org_id = target_organization_id;
  END IF;
  
  RETURN false;
END;
$$;

-- Create RLS policies for organizations table
CREATE POLICY "Users can view their own organization"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'lyc_admin')
    )
  );

-- Create RLS policies for mandates table
CREATE POLICY "Users can view mandates in their organization"
  ON mandates
  FOR SELECT
  USING (
    check_org_access(auth.uid(), organization_id)
  );

CREATE POLICY "Client admins can manage mandates in their organization"
  ON mandates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'client_admin'
      AND organization_id = mandates.organization_id
    )
  );

-- Create RLS policies for candidates_pipeline table
CREATE POLICY "Users can view candidates in their organization"
  ON candidates_pipeline
  FOR SELECT
  USING (
    check_org_access(auth.uid(), organization_id)
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
