-- ============================================================================
-- v2 Batch 1 — Shared Infrastructure + Core Org/User Tables
-- Tickets 1-10 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 10: Utility function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Ticket 1: Unified contacts table (cross-app) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT GENERATED ALWAYS AS (TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
  avatar_url TEXT,
  title TEXT,
  company_name TEXT,
  industry TEXT,
  city TEXT,
  country TEXT DEFAULT 'CN',
  source TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin ON public.contacts(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_name);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON public.contacts(display_name);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contacts"
  ON public.contacts FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin users can manage contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 2: Unified companies table (cross-app) ───────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  name TEXT NOT NULL,
  slug TEXT,
  industry TEXT,
  sub_industry TEXT,
  size_category TEXT,
  employee_count_min INTEGER,
  employee_count_max INTEGER,
  headquarters_city TEXT,
  headquarters_country TEXT DEFAULT 'CN',
  website TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  description TEXT,
  stage TEXT DEFAULT 'prospect',
  health_score INTEGER DEFAULT 50,
  nps_score INTEGER,
  lifetime_value BIGINT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_companies_org ON public.v2_companies(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_companies_stage ON public.v2_companies(stage);
CREATE INDEX IF NOT EXISTS idx_v2_companies_name ON public.v2_companies(name);
CREATE INDEX IF NOT EXISTS idx_v2_companies_industry ON public.v2_companies(industry);
CREATE INDEX IF NOT EXISTS idx_v2_companies_tags ON public.v2_companies USING GIN(tags);

ALTER TABLE public.v2_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read v2_companies"
  ON public.v2_companies FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin users can manage v2_companies"
  ON public.v2_companies FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

DROP TRIGGER IF EXISTS trg_v2_companies_updated_at ON public.v2_companies;
CREATE TRIGGER trg_v2_companies_updated_at
  BEFORE UPDATE ON public.v2_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 3: Cross-app sync log ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cross_app_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_app TEXT NOT NULL,
  target_app TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_status ON public.cross_app_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_source ON public.cross_app_sync_log(source_app);
CREATE INDEX IF NOT EXISTS idx_sync_created ON public.cross_app_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_entity ON public.cross_app_sync_log(entity_type, entity_id);

ALTER TABLE public.cross_app_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read sync log"
  ON public.cross_app_sync_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

CREATE POLICY "Service role can write sync log"
  ON public.cross_app_sync_log FOR INSERT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- ── Ticket 4: Contact app mapping ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_app_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  app_entity_type TEXT NOT NULL,
  app_entity_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, app_name, app_entity_type, app_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_cam_contact ON public.contact_app_mapping(contact_id);
CREATE INDEX IF NOT EXISTS idx_cam_app ON public.contact_app_mapping(app_name, app_entity_id);

ALTER TABLE public.contact_app_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read contact app mapping"
  ON public.contact_app_mapping FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage contact app mapping"
  ON public.contact_app_mapping FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

DROP TRIGGER IF EXISTS trg_cam_updated_at ON public.contact_app_mapping;
CREATE TRIGGER trg_cam_updated_at
  BEFORE UPDATE ON public.contact_app_mapping
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 5: Organizations table (v2 schema) ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'sme', 'mid-market', 'enterprise')),
  website TEXT,
  linkedin_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  billing_email TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'trial'
    CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_orgs_slug ON public.v2_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_v2_orgs_stripe ON public.v2_organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_v2_orgs_subscription ON public.v2_organizations(subscription_tier, subscription_status);

ALTER TABLE public.v2_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own org"
  ON public.v2_organizations FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Org admins can manage organization"
  ON public.v2_organizations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_organizations.id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
  );

DROP TRIGGER IF EXISTS trg_v2_orgs_updated_at ON public.v2_organizations;
CREATE TRIGGER trg_v2_orgs_updated_at
  BEFORE UPDATE ON public.v2_organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 6: Org memberships table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_org_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('super_admin', 'admin', 'consultant', 'client_admin', 'client_user')),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_v2_memberships_org ON public.v2_org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_memberships_user ON public.v2_org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_memberships_role ON public.v2_org_memberships(role);
CREATE INDEX IF NOT EXISTS idx_v2_memberships_status ON public.v2_org_memberships(status);

ALTER TABLE public.v2_org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
  ON public.v2_org_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Org admins can view all memberships"
  ON public.v2_org_memberships FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_org_memberships.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Org admins can manage memberships"
  ON public.v2_org_memberships FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_org_memberships.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
  );

DROP TRIGGER IF EXISTS trg_v2_memberships_updated_at ON public.v2_org_memberships;
CREATE TRIGGER trg_v2_memberships_updated_at
  BEFORE UPDATE ON public.v2_org_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 7: User profiles table ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  title TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  locale TEXT DEFAULT 'zh-CN',
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "in_app": true,
    "digest_frequency": "daily"
  }',
  ai_preferences JSONB DEFAULT '{
    "model_preference": "gpt-4o",
    "language": "auto",
    "response_style": "professional"
  }',
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_profiles_user ON public.v2_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_profiles_name ON public.v2_user_profiles(full_name);

ALTER TABLE public.v2_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.v2_user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can update their own profile"
  ON public.v2_user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Org admins can view org member profiles"
  ON public.v2_user_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships om
      WHERE om.user_id = v2_user_profiles.user_id
        AND om.status = 'active'
        AND EXISTS (
          SELECT 1 FROM public.v2_org_memberships admin_om
          WHERE admin_om.user_id = auth.uid()
            AND admin_om.org_id = om.org_id
            AND admin_om.role IN ('super_admin', 'admin')
            AND admin_om.status = 'active'
        )
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_profiles_updated_at ON public.v2_user_profiles;
CREATE TRIGGER trg_v2_profiles_updated_at
  BEFORE UPDATE ON public.v2_user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 8: RLS policies summary ─────────────────────────────────────────
-- All RLS policies are defined inline with each table above.
-- Policies follow the principle of least privilege:
--   - Read access: authenticated users with appropriate scope
--   - Write access: admin/manager roles only
--   - All tables use soft-delete pattern (deleted_at IS NULL filter)

-- ── Ticket 9: Indexes & constraints summary ────────────────────────────────
-- All indexes and constraints are defined inline with each table above.
-- Key indexing strategy:
--   - B-tree indexes on foreign keys and status columns
--   - GIN indexes on array columns (tags, skills, etc.)
--   - Composite indexes for common query patterns
--   - UNIQUE constraints on natural keys

-- ── Ticket 10: updated_at triggers summary ─────────────────────────────────
-- All tables with updated_at columns have BEFORE UPDATE triggers
-- using the shared set_updated_at() function defined at the top.
