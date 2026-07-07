-- ═══════════════════════════════════════════════════════════════════
-- 20260701_supabase_backend_architecture_schema.sql
-- LYC Intelligence — Full Backend Architecture Migration
-- Implements: Multi-portal auth model, signals, agent_actions,
--   org intel, chat, reports, credits, RLS policies
-- ═══════════════════════════════════════════════════════════════════

-- ── 0. Prerequisite helper ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES TABLE — Multi-portal auth model
-- ════════════════════════════════════════════════════════════════
-- Ensure profiles table exists with all required columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  full_name           TEXT DEFAULT '',
  name                TEXT DEFAULT '',
  role                TEXT NOT NULL DEFAULT 'candidate'
                      CHECK (role IN (
                        'admin', 'super_admin', 'lyc_admin', 'lyc_consultant',
                        'team_lead', 'consultant',
                        'b2b_client', 'client', 'client_admin', 'client_user',
                        'b2c_leader', 'leader', 'candidate', 'member'
                      )),
  portal_role         TEXT NOT NULL DEFAULT 'candidate'
                      CHECK (portal_role IN (
                        'admin', 'b2b_client', 'b2c_leader', 'candidate'
                      )),
  icp                 TEXT,
  tier                TEXT DEFAULT 'free'
                      CHECK (tier IN ('free', 'member', 'pro', 'council', 'enterprise')),
  company_id          UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  organization_id     UUID,
  avatar_url          TEXT,
  phone               TEXT,
  headline            TEXT,
  onboarded_at        TIMESTAMPTZ,
  active_surface      TEXT,
  notion_profile_id   TEXT,
  subtype             TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns if table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portal_role TEXT NOT NULL DEFAULT 'candidate'
  CHECK (portal_role IN ('admin', 'b2b_client', 'b2c_leader', 'candidate'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'candidate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS icp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_surface TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notion_profile_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subtype TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_portal_role ON public.profiles(portal_role);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id)
  WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id)
  WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Backfill portal_role from existing role column
UPDATE public.profiles
SET portal_role = CASE
  WHEN role IN ('admin', 'super_admin', 'lyc_admin') THEN 'admin'
  WHEN role IN ('b2b_client', 'client', 'client_admin', 'client_user') THEN 'b2b_client'
  WHEN role IN ('b2c_leader', 'leader') THEN 'b2c_leader'
  WHEN role IN ('candidate', 'member') THEN 'candidate'
  ELSE 'candidate'
END
WHERE portal_role = 'candidate' AND role != 'candidate';

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 2. SIGNALS TABLE — Unified event stream
-- ════════════════════════════════════════════════════════════════
-- Ensure signals table has the unified target_entity pattern
-- (Preserve existing columns, add new ones for spec要求的字段
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS target_entity_type TEXT;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS target_entity_id UUID;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS actors JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;

-- Ensure type check includes all spec values
DO $$
BEGIN
  ALTER TABLE public.signals DROP CONSTRAINT IF EXISTS signals_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

ALTER TABLE public.signals
  ADD CONSTRAINT signals_type_check
  CHECK (type IN (
    'email', 'meeting', 'comment', 'assessment', 'status_change',
    'feedback', 'upload', 'linkedin', 'outreach', 'score_change',
    'interview', 'offer', 'pipeline_move', 'note', 'system',
    'grid_report', 'mandate_phase', 'enrichment_advance'
  ));

CREATE INDEX IF NOT EXISTS idx_signals_target
  ON public.signals(target_entity_type, target_entity_id)
  WHERE target_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON public.signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_type ON public.signals(type);

-- ════════════════════════════════════════════════════════════════
-- 3. AGENT_ACTIONS TABLE — AI agent execution tracking
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS target_entity_type TEXT;
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS target_entity_id UUID;
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS input JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS output JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.agent_actions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Ensure status check includes all spec values
DO $$
BEGIN
  ALTER TABLE public.agent_actions DROP CONSTRAINT IF EXISTS agent_actions_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

ALTER TABLE public.agent_actions
  ADD CONSTRAINT agent_actions_status_check
  CHECK (status IN (
    'pending', 'running', 'completed', 'failed',
    'approved', 'rejected', 'executed'
  ));

CREATE INDEX IF NOT EXISTS idx_agent_actions_target
  ON public.agent_actions(target_entity_type, target_entity_id)
  WHERE target_entity_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════
-- 4. CONTACTS — Extend with methodology-native fields
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_scores JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS canvas_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS prism_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS wave_outreach_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS portal_role TEXT DEFAULT 'candidate'
  CHECK (portal_role IN ('admin', 'b2b_client', 'b2c_leader', 'candidate'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_engagement_date TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS decay_flag BOOLEAN DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_expat BOOLEAN DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS cxo_stamp TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS council_tier TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS advisory_lane TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS advisory_tier TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS market_side TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS bd_priority TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS commercial_readiness TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS activity_status TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS match_score_best NUMERIC(5,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_composite NUMERIC(5,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_d1 NUMERIC(5,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_d2 NUMERIC(5,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_d3 NUMERIC(5,2);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'platform';

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON public.contacts(engagement_score DESC);

-- ════════════════════════════════════════════════════════════════
-- 5. MANDATES — Extend with portal fields
-- ════════════════════════════════════════════════════════════════
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS success_profile_id UUID REFERENCES public.success_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'intake'
  CHECK (pipeline_stage IN (
    'intake', 'research', 'longlist', 'shortlist',
    'interview', 'offer', 'closed', 'on_hold'
  ));
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
  CHECK (priority IN ('urgent', 'high', 'normal', 'low'));
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS confidential BOOLEAN DEFAULT false;
ALTER TABLE public.mandates ADD COLUMN IF NOT EXISTS mandate_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_mandates_company ON public.mandates(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mandates_client ON public.mandates(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mandates_pipeline_stage ON public.mandates(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_mandates_priority ON public.mandates(priority);

-- ════════════════════════════════════════════════════════════════
-- 6. ORG INTEL TABLES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  domain              TEXT,
  industry            TEXT,
  sub_industry        TEXT,
  hq_location         TEXT,
  employee_count      INTEGER,
  revenue_usd         BIGINT,
  funding_stage       TEXT,
  linkedin_id         TEXT,
  crunchbase_id       TEXT,
  overview            TEXT,
  org_chart           JSONB DEFAULT '{}'::jsonb,
  key_people          JSONB DEFAULT '[]'::jsonb,
  talent_density      NUMERIC(5,2) DEFAULT 0,
  risk_score          NUMERIC(5,2) DEFAULT 0,
  opportunity_score   NUMERIC(5,2) DEFAULT 0,
  metadata            JSONB DEFAULT '{}'::jsonb,
  last_analyzed_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_companies_name ON public.org_companies(name);
CREATE INDEX IF NOT EXISTS idx_org_companies_industry ON public.org_companies(industry);

DROP TRIGGER IF EXISTS trg_org_companies_updated_at ON public.org_companies;
CREATE TRIGGER trg_org_companies_updated_at
  BEFORE UPDATE ON public.org_companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.org_scoring (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.org_companies(id) ON DELETE CASCADE,
  run_id              TEXT NOT NULL,
  dimension           TEXT NOT NULL,
  score               NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence          NUMERIC(3,2) DEFAULT 0.5,
  evidence            JSONB DEFAULT '[]'::jsonb,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_scoring_company ON public.org_scoring(company_id);
CREATE INDEX IF NOT EXISTS idx_org_scoring_run ON public.org_scoring(run_id);
CREATE INDEX IF NOT EXISTS idx_org_scoring_dimension ON public.org_scoring(dimension);

CREATE TABLE IF NOT EXISTS public.org_key_people (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES public.org_companies(id) ON DELETE CASCADE,
  contact_id          UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  title               TEXT,
  department          TEXT,
  reports_to          TEXT,
  tenure_years        NUMERIC(4,1),
  influence_score     NUMERIC(5,2) DEFAULT 0,
  flight_risk         TEXT CHECK (flight_risk IN ('low', 'medium', 'high', 'critical')),
  succession_ready    TEXT,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_key_people_company ON public.org_key_people(company_id);
CREATE INDEX IF NOT EXISTS idx_org_key_people_contact ON public.org_key_people(contact_id) WHERE contact_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════
-- 7. CHAT CONVERSATIONS & MESSAGES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT DEFAULT 'New Conversation',
  portal_context      TEXT NOT NULL DEFAULT 'general'
                      CHECK (portal_context IN (
                        'admin', 'b2b_client', 'b2c_leader', 'candidate', 'general'
                      )),
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_convos_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_convos_context ON public.chat_conversations(portal_context);

DROP TRIGGER IF EXISTS trg_chat_conversations_updated_at ON public.chat_conversations;
CREATE TRIGGER trg_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content             TEXT NOT NULL,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_convo ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at);

-- ════════════════════════════════════════════════════════════════
-- 8. REPORTS & REPORT TEMPLATES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type         TEXT NOT NULL CHECK (report_type IN (
                        'competitive_intel', 'org_health',
                        'talent_deep_dive', 'custom'
                      )),
  title               TEXT NOT NULL,
  company_id          UUID REFERENCES public.org_companies(id) ON DELETE SET NULL,
  mandate_id          UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  generated_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status              TEXT DEFAULT 'draft'
                      CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  content             JSONB DEFAULT '{}'::jsonb,
  summary             TEXT,
  pdf_url             TEXT,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_company ON public.reports(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_mandate ON public.reports(mandate_id) WHERE mandate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.report_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type       TEXT NOT NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  sections            JSONB NOT NULL DEFAULT '[]'::jsonb,
  prompt_template     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- 9. CREDIT TRANSACTIONS — extend with portal model
-- ════════════════════════════════════════════════════════════════
DO $$
BEGIN
  ALTER TABLE public.credit_transactions
    ADD COLUMN IF NOT EXISTS reference_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END$$;

DO $$
BEGIN
  ALTER TABLE public.credit_transactions
    ADD COLUMN IF NOT EXISTS reference_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END$$;

-- Ensure transaction_type check includes all spec values
DO $$
BEGIN
  ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'purchase', 'ai_usage', 'assessment', 'report',
    'bonus', 'refund',
    'spend_credit', 'earn_credit', 'daily_reset'
  ));

CREATE INDEX IF NOT EXISTS idx_credits_ref ON public.credit_transactions(reference_id) WHERE reference_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════
-- 10. STORAGE BUCKETS setup (run in Supabase SQL Editor)
-- ════════════════════════════════════════════════════════════════
-- Buckets must be created via Supabase dashboard or INSERT into storage.buckets
-- This is a reference — uncomment when running directly:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
--   ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false)
--   ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
--   ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assessment-files', 'assessment-files', false)
--   ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'profiles', 'signals', 'agent_actions', 'contacts', 'mandates',
    'org_companies', 'org_scoring', 'org_key_people',
    'chat_conversations', 'chat_messages', 'reports', 'report_templates',
    'credit_transactions', 'credits', 'companies'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ All core tables verified';
  ELSE
    RAISE EXCEPTION '❌ Missing tables: %', v_missing;
  END IF;
END$$;
