
-- --- 20260624_audit_logs_enhanced.sql ---

-- Phase 0.5: Cross-Cutting Quality Standards
-- Enhanced audit logs with org-scoping, change tracking, and request metadata

-- Add organization_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- Add resource_type (alias for entity_type, standard naming)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_type TEXT GENERATED ALWAYS AS (entity_type) STORED;
  END IF;
END $$;

-- Add resource_id (alias for entity_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN resource_id UUID GENERATED ALWAYS AS (entity_id) STORED;
  END IF;
END $$;

-- Add changes column (before/after diff)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'changes'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN changes JSONB;
  END IF;
END $$;

-- Add ip_address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
  END IF;
END $$;

-- Add user_agent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;
END $$;

-- Add org index
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);

-- Update RLS: add org-scoped read for org admins
DROP POLICY IF EXISTS "org_admins_read_own_logs";
DROP POLICY IF EXISTS "org_admins_read_own_logs" ON audit_logs;
CREATE POLICY "org_admins_read_own_logs" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update existing admin policy to include organization_id scoping
DROP POLICY IF EXISTS "Admin read audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin read audit_logs" ON audit_logs;
CREATE POLICY "Admin read audit_logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'lyc_admin')
  )
);

-- --- 20260624_nexus_sync_contract.sql ---

-- Phase 0.6: NEXUS ↔ DEX Sync Contract
-- Event outbox, event log, and sync state tables

-- Event outbox for reliable delivery (Transactional Outbox Pattern)
CREATE TABLE IF NOT EXISTS nexus_event_outbox (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

-- Index for retry job
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON nexus_event_outbox(status, created_at)
  WHERE status IN ('pending', 'retrying', 'failed');

CREATE INDEX IF NOT EXISTS idx_outbox_next_retry ON nexus_event_outbox(next_retry_at)
  WHERE status IN ('pending', 'retrying', 'failed') AND next_retry_at IS NOT NULL;

-- RLS: only service role can access
ALTER TABLE nexus_event_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only_outbox" ON nexus_event_outbox;
DROP POLICY IF EXISTS "service_role_only_outbox" ON nexus_event_outbox;
CREATE POLICY "service_role_only_outbox" ON nexus_event_outbox
  FOR ALL USING (false);

-- Event log (audit trail)
CREATE TABLE IF NOT EXISTS nexus_event_log (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  payload JSONB NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status INTEGER,
  response_body TEXT,
  direction TEXT NOT NULL DEFAULT 'dex_to_nexus'
    CHECK (direction IN ('dex_to_nexus', 'nexus_to_dex'))
);

CREATE INDEX IF NOT EXISTS idx_event_log_org ON nexus_event_log(org_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_type ON nexus_event_log(event_type, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_direction ON nexus_event_log(direction, delivered_at DESC);

ALTER TABLE nexus_event_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_read_own_events" ON nexus_event_log;
DROP POLICY IF EXISTS "org_read_own_events" ON nexus_event_log;
CREATE POLICY "org_read_own_events" ON nexus_event_log
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Sync state tracking (last successful sync per entity)
CREATE TABLE IF NOT EXISTS nexus_sync_state (
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_id UUID,
  sync_status TEXT NOT NULL DEFAULT 'synced'
    CHECK (sync_status IN ('synced', 'pending', 'failed', 'conflict')),
  PRIMARY KEY (org_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_org ON nexus_sync_state(org_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_state_pending ON nexus_sync_state(sync_status)
  WHERE sync_status IN ('pending', 'failed');

ALTER TABLE nexus_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_sync_state" ON nexus_sync_state;
DROP POLICY IF EXISTS "org_sync_state" ON nexus_sync_state;
CREATE POLICY "org_sync_state" ON nexus_sync_state
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Command log (incoming commands from NEXUS)
CREATE TABLE IF NOT EXISTS nexus_command_log (
  id BIGSERIAL PRIMARY KEY,
  command_id UUID NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  command_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'completed', 'failed')),
  response JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_command_log_org ON nexus_command_log(org_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_log_status ON nexus_command_log(status);
CREATE INDEX IF NOT EXISTS idx_command_log_type ON nexus_command_log(command_type, received_at DESC);

ALTER TABLE nexus_command_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_read_own_commands" ON nexus_command_log;
DROP POLICY IF EXISTS "org_read_own_commands" ON nexus_command_log;
CREATE POLICY "org_read_own_commands" ON nexus_command_log
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- --- 20260625_create_missing_core_tables.sql ---

-- ── 20260625_create_missing_core_tables.sql ──────────────────────────────
-- Post-audit migration: 23 tables referenced in 787 backend handler locations
-- but never created in any prior migration.
--
-- Priority tiers based on reference count (high -> low):
--   Tier 1 - Critical:   credits, mandates, companies, contacts, credit_transactions, organizations
--   Tier 2 - Core:       mandate_members, candidates_pipeline, scoring_runs, memories*, generated_reports,
--                         candidate_saved_insights, clients
--   Tier 3 - Scoring/AI: candidate_assessment_results, candidate_assessment_responses,
--                         assessment_configs, mandate_success_profiles, ai_generations, match_history
--   Tier 4 - Low usage:  alumni_placements, automation_executions, pipeline_stage_history
--
-- * memories already exists (20260608) but is listed here for completeness;
--   the CREATE TABLE IF NOT EXISTS pattern is safe to re-run.
--
-- NOTE: After running this migration, Kevin must apply it in Supabase Dashboard.
-- ─────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════
-- ── Prerequisite: trigger function ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tier 1 - Critical Tables
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. credits ──────────────────────────────────────────────────────────
-- 113 refs: creditsHandler, stripeHandler, scoringComputeHandler, email, admin, credits/mandates
CREATE TABLE IF NOT EXISTS public.credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,                                    -- nullable: personal credits fallback
  balance         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  daily_balance   INTEGER NOT NULL DEFAULT 0,
  total_earned    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_spent     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tier            TEXT NOT NULL DEFAULT 'free'
                  CHECK (tier IN ('free', 'member', 'council')),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure organization_id exists (may be missing if table was created by earlier migration)
ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_credits_user_id       ON public.credits (user_id);
CREATE INDEX IF NOT EXISTS idx_credits_org_id        ON public.credits (organization_id)
  WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credits_tier           ON public.credits (tier);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on credits" ON ON public.credits;
CREATE POLICY "Service role full access on credits"
  ON public.credits FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own credits" ON ON public.credits;
CREATE POLICY "Users read own credits"
  ON public.credits FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own credits" ON ON public.credits;
CREATE POLICY "Users update own credits"
  ON public.credits FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_credits_updated_at ON public.credits;
CREATE TRIGGER trg_credits_updated_at
  BEFORE UPDATE ON public.credits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. credit_transactions ─────────────────────────────────────────────
-- 11 refs: creditsHandler, stripeHandler, admin
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   UUID,                                    -- nullable
  amount            NUMERIC(12, 2) NOT NULL,                  -- positive = earn, negative = spend
  transaction_type   TEXT NOT NULL
                      CHECK (transaction_type IN ('spend_credit', 'earn_credit', 'daily_reset')),
  description       TEXT,
  reference_id      UUID,                                     -- nullable: links to scoring_run, mandate, etc.
  stripe_session_id TEXT,                                     -- nullable: links to Stripe checkout
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_trans_user_id   ON public.credit_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_trans_org_id    ON public.credit_transactions (organization_id)
  WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_trans_type      ON public.credit_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_trans_created   ON public.credit_transactions (created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on credit_transactions" ON ON public.credit_transactions;
CREATE POLICY "Service role full access on credit_transactions"
  ON public.credit_transactions FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own credit transactions" ON ON public.credit_transactions;
CREATE POLICY "Users read own credit transactions"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- ── 3. organizations ───────────────────────────────────────────────────
-- 7 refs: creditsHandler, dataHandler
CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'member', 'council')),
  credit_balance  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_plan    ON public.organizations (plan);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on organizations" ON ON public.organizations;
CREATE POLICY "Service role full access on organizations"
  ON public.organizations FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Admins read organizations" ON ON public.organizations;
CREATE POLICY "Admins read organizations"
  ON public.organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );
DROP POLICY IF EXISTS "Admins write organizations" ON ON public.organizations;
CREATE POLICY "Admins write organizations"
  ON public.organizations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. mandates ────────────────────────────────────────────────────────
-- 124 refs: dataHandler, companiesUploadHandler, cronHandler, orgScopedQueries,
--          scoringComputeHandler, slaHandler, admin
CREATE TABLE IF NOT EXISTS public.mandates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  client_id            UUID,                                    -- FK to companies (or clients)
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT '1_search'
                         CHECK (status IN ('1_search','2_sourcing','3_screen','4_interview','5_offer','6_closed','on_hold')),
  priority             TEXT,
  description          TEXT,
  jd_description       TEXT,
  search_definition     JSONB,
  skills_requirements  TEXT,
  keywords             TEXT,
  location             TEXT,
  compensation_range   TEXT,
  timeline             TEXT,
  team_size            TEXT,
  source               TEXT NOT NULL DEFAULT 'platform'
                         CHECK (source IN ('platform','csv_upload','imported')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandates_org_id      ON public.mandates (organization_id);
CREATE INDEX IF NOT EXISTS idx_mandates_client_id   ON public.mandates (client_id)
  WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mandates_status       ON public.mandates (status);
CREATE INDEX IF NOT EXISTS idx_mandates_updated     ON public.mandates (updated_at DESC);

ALTER TABLE public.mandates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on mandates" ON ON public.mandates;
CREATE POLICY "Service role full access on mandates"
  ON public.mandates FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Admins read mandates" ON ON public.mandates;
CREATE POLICY "Admins read mandates"
  ON public.mandates FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );
DROP POLICY IF EXISTS "Admins write mandates" ON ON public.mandates;
CREATE POLICY "Admins write mandates"
  ON public.mandates FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );

DROP TRIGGER IF EXISTS trg_mandates_updated_at ON public.mandates;
CREATE TRIGGER trg_mandates_updated_at
  BEFORE UPDATE ON public.mandates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 5. companies ───────────────────────────────────────────────────────
-- 86 refs: companiesUploadHandler, dataHandler, gridReportsGenerateHandler,
--          orgScopedQueries, scoringComputeHandler, admin
CREATE TABLE IF NOT EXISTS public.companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  industry         TEXT,
  stain_group      TEXT,
  stain_tier       TEXT,
  proximity        TEXT,
  country          TEXT,
  city             TEXT,
  region           TEXT,
  headcount_range  TEXT,
  website          TEXT,
  linkedin_url     TEXT,
  description      TEXT,
  engagement_score NUMERIC(5, 2) DEFAULT 50,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_name       ON public.companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_industry   ON public.companies (industry);
CREATE INDEX IF NOT EXISTS idx_companies_country    ON public.companies (country);
CREATE INDEX IF NOT EXISTS idx_companies_engagement ON public.companies (engagement_score DESC);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on companies" ON ON public.companies;
CREATE POLICY "Service role full access on companies"
  ON public.companies FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Admins read companies" ON ON public.companies;
CREATE POLICY "Admins read companies"
  ON public.companies FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );
DROP POLICY IF EXISTS "Admins write companies" ON ON public.companies;
CREATE POLICY "Admins write companies"
  ON public.companies FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 6. contacts ───────────────────────────────────────────────────────
-- 57 refs: dataHandler, dsrHandler, orgScopedQueries
CREATE TABLE IF NOT EXISTS public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  current_title    TEXT,
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  location        TEXT,
  country         TEXT,
  city            TEXT,
  seniority       TEXT,
  skills          TEXT,
  languages       TEXT,
  linkedin_url    TEXT,
  headline        TEXT,
  summary         TEXT,
  career_history  JSONB,
  education       JSONB,
  source          TEXT NOT NULL DEFAULT 'platform'
                    CHECK (source IN ('platform','csv_upload','linkedin_import','manual')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_name       ON public.contacts (name);
CREATE INDEX IF NOT EXISTS idx_contacts_email      ON public.contacts (email)
  WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts (company_id)
  WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_country    ON public.contacts (country);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on contacts" ON ON public.contacts;
CREATE POLICY "Service role full access on contacts"
  ON public.contacts FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read contacts" ON ON public.contacts;
CREATE POLICY "Users read contacts"
  ON public.contacts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant'))
  );
DROP POLICY IF EXISTS "Users write contacts" ON ON public.contacts;
CREATE POLICY "Users write contacts"
  ON public.contacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
-- Tier 2 - Core Feature Tables
-- ═══════════════════════════════════════════════════════════════════════

-- ── 7. clients ─────────────────────────────────────────────────────────
-- 5 refs: dataHandler
CREATE TABLE IF NOT EXISTS public.clients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name   TEXT,
  last_name    TEXT,
  company_name TEXT,
  email        TEXT,
  phone        TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_company_name ON public.clients (company_name);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on clients" ON ON public.clients;
CREATE POLICY "Service role full access on clients"
  ON public.clients FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read clients" ON ON public.clients;
CREATE POLICY "Users read clients"
  ON public.clients FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 8. mandate_members ─────────────────────────────────────────────────
-- 10 refs: dataHandler, orgScopedQueries
CREATE TABLE IF NOT EXISTS public.mandate_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id  UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner','admin','member','viewer')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mandate_members_unique
  ON public.mandate_members (mandate_id, user_id);
CREATE INDEX IF NOT EXISTS idx_mandate_members_user_id ON public.mandate_members (user_id);

ALTER TABLE public.mandate_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on mandate_members" ON ON public.mandate_members;
CREATE POLICY "Service role full access on mandate_members"
  ON public.mandate_members FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read mandate members" ON ON public.mandate_members;
CREATE POLICY "Users read mandate members"
  ON public.mandate_members FOR SELECT USING (auth.uid() = user_id);

-- ── 9. candidates_pipeline ─────────────────────────────────────────────
-- 15 refs: dataHandler, orgScopedQueries
CREATE TABLE IF NOT EXISTS public.candidates_pipeline (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id         UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id         UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  stage              TEXT NOT NULL DEFAULT 'SWEEP'
                      CHECK (stage IN ('SWEEP','QUALIFY','ASSESS','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN')),
  sweep_tier         TEXT,
  match_score        NUMERIC(5, 2),
  match_reasons      JSONB,
  key_match_reasons   TEXT,
  estimated_comp      TEXT,
  availability        TEXT,
  notes               TEXT,
  trident_composite   NUMERIC(5, 2),
  trident_d1          NUMERIC(5, 2),
  trident_d2          NUMERIC(5, 2),
  trident_d3          NUMERIC(5, 2),
  fit_analysis        JSONB,
  risk_factors         JSONB,
  approach_strategy    TEXT,
  verdict              TEXT,
  list_status          TEXT DEFAULT 'active'
                      CHECK (list_status IN ('active','paused','archived')),
  next_steps           TEXT,
  client_feedback      TEXT,
  source               TEXT NOT NULL DEFAULT 'platform'
                      CHECK (source IN ('platform','csv_upload','imported')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_mandate_id ON public.candidates_pipeline (mandate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_contact_id ON public.candidates_pipeline (contact_id);
CREATE INDEX IF NOT EXISTS idx_candidates_pipeline_stage      ON public.candidates_pipeline (stage);

ALTER TABLE public.candidates_pipeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on candidates_pipeline" ON ON public.candidates_pipeline;
CREATE POLICY "Service role full access on candidates_pipeline"
  ON public.candidates_pipeline FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read candidates pipeline" ON ON public.candidates_pipeline;
CREATE POLICY "Users read candidates pipeline"
  ON public.candidates_pipeline FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );
DROP POLICY IF EXISTS "Users write candidates pipeline" ON ON public.candidates_pipeline;
CREATE POLICY "Users write candidates pipeline"
  ON public.candidates_pipeline FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trg_candidates_pipeline_updated_at ON public.candidates_pipeline;
CREATE TRIGGER trg_candidates_pipeline_updated_at
  BEFORE UPDATE ON public.candidates_pipeline FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 10. scoring_runs ───────────────────────────────────────────────────
-- 16 refs: dataHandler, score5Handler, scoringComputeHandler
CREATE TABLE IF NOT EXISTS public.scoring_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id     UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  contact_id     UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  run_type       TEXT NOT NULL DEFAULT 'trident'
                  CHECK (run_type IN ('trident','shift','advisory','candidate','benchmark','lens')),
  assessment_type TEXT,
  input_params   JSONB,
  output_scores  JSONB,
  composite_score NUMERIC(5, 2),
  analysis       JSONB,
  verdict        TEXT,
  model          TEXT,
  tokens_used    INTEGER,
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scoring_runs_mandate_id  ON public.scoring_runs (mandate_id)
  WHERE mandate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scoring_runs_contact_id  ON public.scoring_runs (contact_id)
  WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scoring_runs_user_id     ON public.scoring_runs (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scoring_runs_run_type    ON public.scoring_runs (run_type);
CREATE INDEX IF NOT EXISTS idx_scoring_runs_created     ON public.scoring_runs (created_at DESC);

ALTER TABLE public.scoring_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on scoring_runs" ON ON public.scoring_runs;
CREATE POLICY "Service role full access on scoring_runs"
  ON public.scoring_runs FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own scoring runs" ON ON public.scoring_runs;
CREATE POLICY "Users read own scoring runs"
  ON public.scoring_runs FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ── 11. generated_reports ─────────────────────────────────────────────
-- 7 refs: dataHandler
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id      UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  report_type     TEXT NOT NULL,
  candidate_ids   JSONB,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'generating'
                  CHECK (status IN ('generating','ready','failed','archived')),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_mandate_id ON public.generated_reports (mandate_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_org_id     ON public.generated_reports (organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status     ON public.generated_reports (status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created   ON public.generated_reports (created_at DESC);

ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on generated_reports" ON ON public.generated_reports;
CREATE POLICY "Service role full access on generated_reports"
  ON public.generated_reports FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read generated reports" ON ON public.generated_reports;
CREATE POLICY "Users read generated reports"
  ON public.generated_reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_generated_reports_updated_at ON public.generated_reports;
CREATE TRIGGER trg_generated_reports_updated_at
  BEFORE UPDATE ON public.generated_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 12. candidate_saved_insights ────────────────────────────────────────
-- 4 refs: dataHandler
CREATE TABLE IF NOT EXISTS public.candidate_saved_insights (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_saved_insights_unique
  ON public.candidate_saved_insights (profile_id, insight_id);
CREATE INDEX IF NOT EXISTS idx_candidate_saved_insights_profile_id
  ON public.candidate_saved_insights (profile_id);

ALTER TABLE public.candidate_saved_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on candidate_saved_insights" ON ON public.candidate_saved_insights;
CREATE POLICY "Service role full access on candidate_saved_insights"
  ON public.candidate_saved_insights FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own saved insights" ON ON public.candidate_saved_insights;
CREATE POLICY "Users read own saved insights"
  ON public.candidate_saved_insights FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Users write own saved insights" ON ON public.candidate_saved_insights;
CREATE POLICY "Users write own saved insights"
  ON public.candidate_saved_insights FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Tier 3 - Scoring / AI Tables
-- ═══════════════════════════════════════════════════════════════════════

-- ── 13. candidate_assessment_results ───────────────────────────────────
-- 3 refs: scoringComputeHandler
CREATE TABLE IF NOT EXISTS public.candidate_assessment_results (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id       UUID NOT NULL,                              -- contact_id or user_id
  assessment_id       UUID NOT NULL,
  mandate_id         UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  overall_score      NUMERIC(5, 2),
  recommendation     TEXT,
  dimension_scores   JSONB,
  strengths          TEXT,
  development_areas  TEXT,
  visibility         TEXT DEFAULT 'private'
                      CHECK (visibility IN ('private','team','public')),
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_candidate_id    ON public.candidate_assessment_results (candidate_id);
CREATE INDEX IF NOT EXISTS idx_car_assessment_id   ON public.candidate_assessment_results (assessment_id);
CREATE INDEX IF NOT EXISTS idx_car_mandate_id      ON public.candidate_assessment_results (mandate_id)
  WHERE mandate_id IS NOT NULL;

ALTER TABLE public.candidate_assessment_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on candidate_assessment_results" ON ON public.candidate_assessment_results;
CREATE POLICY "Service role full access on candidate_assessment_results"
  ON public.candidate_assessment_results FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own assessment results" ON ON public.candidate_assessment_results;
CREATE POLICY "Users read own assessment results"
  ON public.candidate_assessment_results FOR SELECT USING (auth.uid() IS NOT NULL);

DROP TRIGGER IF EXISTS trg_car_updated_at ON public.candidate_assessment_results;
CREATE TRIGGER trg_car_updated_at
  BEFORE UPDATE ON public.candidate_assessment_results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 14. candidate_assessment_responses ──────────────────────────────────
-- 2 refs: scoringComputeHandler
CREATE TABLE IF NOT EXISTS public.candidate_assessment_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  mandate_id   UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  responses    JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_car_resp_candidate_id    ON public.candidate_assessment_responses (candidate_id);
CREATE INDEX IF NOT EXISTS idx_car_resp_assessment_id   ON public.candidate_assessment_responses (assessment_id);

ALTER TABLE public.candidate_assessment_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on candidate_assessment_responses" ON ON public.candidate_assessment_responses;
CREATE POLICY "Service role full access on candidate_assessment_responses"
  ON public.candidate_assessment_responses FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users write own assessment responses" ON ON public.candidate_assessment_responses;
CREATE POLICY "Users write own assessment responses"
  ON public.candidate_assessment_responses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── 15. assessment_configs ─────────────────────────────────────────────
-- 2 refs: scoringComputeHandler
CREATE TABLE IF NOT EXISTS public.assessment_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  version     INTEGER NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_configs_active ON public.assessment_configs (is_active)
  WHERE is_active = TRUE;

ALTER TABLE public.assessment_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on assessment_configs" ON ON public.assessment_configs;
CREATE POLICY "Service role full access on assessment_configs"
  ON public.assessment_configs FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_assessment_configs_updated_at ON public.assessment_configs;
CREATE TRIGGER trg_assessment_configs_updated_at
  BEFORE UPDATE ON public.assessment_configs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 16. mandate_success_profiles ───────────────────────────────────────
-- 1 ref: scoringComputeHandler
CREATE TABLE IF NOT EXISTS public.mandate_success_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id  UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  profile     JSONB NOT NULL DEFAULT '{}'::jsonb,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_msp_mandate_version
  ON public.mandate_success_profiles (mandate_id, version);

ALTER TABLE public.mandate_success_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on mandate_success_profiles" ON ON public.mandate_success_profiles;
CREATE POLICY "Service role full access on mandate_success_profiles"
  ON public.mandate_success_profiles FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_msp_updated_at ON public.mandate_success_profiles;
CREATE TRIGGER trg_msp_updated_at
  BEFORE UPDATE ON public.mandate_success_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 17. ai_generations ────────────────────────────────────────────────
-- 2 refs: dataHandler
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL,
  input_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source      TEXT NOT NULL DEFAULT 'platform'
                CHECK (source IN ('platform','api','imported')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id  ON public.ai_generations (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_generations_type     ON public.ai_generations (type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created  ON public.ai_generations (created_at DESC);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on ai_generations" ON ON public.ai_generations;
CREATE POLICY "Service role full access on ai_generations"
  ON public.ai_generations FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own ai generations" ON ON public.ai_generations;
CREATE POLICY "Users read own ai generations"
  ON public.ai_generations FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ── 18. match_history ──────────────────────────────────────────────────
-- 1 ref: scoreHandler
CREATE TABLE IF NOT EXISTS public.match_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jd_text         TEXT,
  results         JSONB NOT NULL DEFAULT '[]'::jsonb,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  average_score   NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_history_user_id  ON public.match_history (user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_created ON public.match_history (created_at DESC);

ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on match_history" ON ON public.match_history;
CREATE POLICY "Service role full access on match_history"
  ON public.match_history FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read own match history" ON ON public.match_history;
CREATE POLICY "Users read own match history"
  ON public.match_history FOR SELECT USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- Tier 4 - Low Usage Tables
-- ═══════════════════════════════════════════════════════════════════════

-- ── 19. alumni_placements ─────────────────────────────────────────────
-- 2 refs: alumniHandler
CREATE TABLE IF NOT EXISTS public.alumni_placements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  placement_date  DATE NOT NULL,
  end_date        DATE,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','completed')),
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alumni_placements_org_id    ON public.alumni_placements (org_id);
CREATE INDEX IF NOT EXISTS idx_alumni_placements_mandate_id ON public.alumni_placements (mandate_id)
  WHERE mandate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_alumni_placements_status   ON public.alumni_placements (status);

ALTER TABLE public.alumni_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on alumni_placements" ON ON public.alumni_placements;
CREATE POLICY "Service role full access on alumni_placements"
  ON public.alumni_placements FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read alumni placements" ON ON public.alumni_placements;
CREATE POLICY "Users read alumni placements"
  ON public.alumni_placements FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );

DROP TRIGGER IF EXISTS trg_alumni_placements_updated_at ON public.alumni_placements;
CREATE TRIGGER trg_alumni_placements_updated_at
  BEFORE UPDATE ON public.alumni_placements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 20. automation_executions ──────────────────────────────────────────
-- 2 refs: automationHandler
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_id     UUID,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','completed','failed','cancelled')),
  error       TEXT,
  executed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_org_id  ON public.automation_executions (org_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON public.automation_executions (rule_id)
  WHERE rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_automation_executions_status  ON public.automation_executions (status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_executed ON public.automation_executions (executed_at DESC);

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on automation_executions" ON ON public.automation_executions;
CREATE POLICY "Service role full access on automation_executions"
  ON public.automation_executions FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read automation executions" ON ON public.automation_executions;
CREATE POLICY "Users read automation executions"
  ON public.automation_executions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );

-- ── 21. pipeline_stage_history ────────────────────────────────────────
-- 1 ref: dataHandler
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL,                                   -- candidates_pipeline.id
  from_stage  TEXT,
  to_stage    TEXT NOT NULL,
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_pipeline_id
  ON public.pipeline_stage_history (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_created
  ON public.pipeline_stage_history (created_at DESC);

ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on pipeline_stage_history" ON ON public.pipeline_stage_history;
CREATE POLICY "Service role full access on pipeline_stage_history"
  ON public.pipeline_stage_history FOR ALL USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Users read pipeline stage history" ON ON public.pipeline_stage_history;
CREATE POLICY "Users read pipeline stage history"
  ON public.pipeline_stage_history FOR SELECT USING (auth.uid() IS NOT NULL);

-- ── 22. candidate_pipeline ─────────────────────────────────────────────
-- 1 ref: dataHandler (distinct from candidates_pipeline)
-- Mirrors candidates_pipeline but used in separate pipeline view contexts
CREATE TABLE IF NOT EXISTS public.candidate_pipeline (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id         UUID NOT NULL,
  mandate_id         UUID NOT NULL,
  stage              TEXT NOT NULL DEFAULT 'SWEEP',
  match_score        NUMERIC(5, 2),
  list_status        TEXT DEFAULT 'active',
  client_feedback    TEXT,
  source             TEXT DEFAULT 'platform',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_mandate_id ON public.candidate_pipeline (mandate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_pipeline_contact_id ON public.candidate_pipeline (contact_id);

ALTER TABLE public.candidate_pipeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on candidate_pipeline" ON ON public.candidate_pipeline;
CREATE POLICY "Service role full access on candidate_pipeline"
  ON public.candidate_pipeline FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_candidate_pipeline_updated_at ON public.candidate_pipeline;
CREATE TRIGGER trg_candidate_pipeline_updated_at
  BEFORE UPDATE ON public.candidate_pipeline FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
-- Verification smoke test
-- ═══════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count INTEGER;
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'credits','credit_transactions','organizations','mandates','companies','contacts',
    'clients','mandate_members','candidates_pipeline','scoring_runs','generated_reports',
    'candidate_saved_insights','candidate_assessment_results','candidate_assessment_responses',
    'assessment_configs','mandate_success_profiles','ai_generations','match_history',
    'alumni_placements','automation_executions','pipeline_stage_history','candidate_pipeline'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '[OK] All 22 core tables created successfully';
  ELSE
    RAISE EXCEPTION '[FAIL] Missing tables: %', v_missing;
  END IF;
END$$;

COMMIT;
