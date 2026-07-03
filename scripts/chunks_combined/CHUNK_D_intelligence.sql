
-- >>> 28_20260623_compensation_benchmarking.sql
20260623_compensation_benchmarking.sql


-- >>> 28_20260624_audit_logs_enhanced.sql

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
CREATE POLICY "org_admins_read_own_logs" ON audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update existing admin policy to include organization_id scoping
DROP POLICY IF EXISTS "Admin read audit_logs" ON audit_logs;
CREATE POLICY "Admin read audit_logs" ON audit_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin', 'lyc_admin')
  )
);


-- >>> 29_20260624_nexus_sync_contract.sql

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

CREATE POLICY "org_read_own_commands" ON nexus_command_log
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);


-- >>> 30_20260625_create_missing_core_tables.sql

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
CREATE POLICY "Service role full access on credits"
  ON public.credits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users read own credits"
  ON public.credits FOR SELECT USING (auth.uid() = user_id);
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
CREATE POLICY "Service role full access on credit_transactions"
  ON public.credit_transactions FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on organizations"
  ON public.organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins read organizations"
  ON public.organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );
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
CREATE POLICY "Service role full access on mandates"
  ON public.mandates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins read mandates"
  ON public.mandates FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );
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
CREATE POLICY "Service role full access on companies"
  ON public.companies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins read companies"
  ON public.companies FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin'))
  );
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
CREATE POLICY "Service role full access on contacts"
  ON public.contacts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users read contacts"
  ON public.contacts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin', 'lyc_admin', 'lyc_consultant'))
  );
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
CREATE POLICY "Service role full access on clients"
  ON public.clients FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on mandate_members"
  ON public.mandate_members FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on candidates_pipeline"
  ON public.candidates_pipeline FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users read candidates pipeline"
  ON public.candidates_pipeline FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid())
  );
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
CREATE POLICY "Service role full access on scoring_runs"
  ON public.scoring_runs FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on generated_reports"
  ON public.generated_reports FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on candidate_saved_insights"
  ON public.candidate_saved_insights FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users read own saved insights"
  ON public.candidate_saved_insights FOR SELECT USING (auth.uid() = profile_id);
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
CREATE POLICY "Service role full access on candidate_assessment_results"
  ON public.candidate_assessment_results FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on candidate_assessment_responses"
  ON public.candidate_assessment_responses FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on ai_generations"
  ON public.ai_generations FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on match_history"
  ON public.match_history FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on alumni_placements"
  ON public.alumni_placements FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on automation_executions"
  ON public.automation_executions FOR ALL USING (auth.role() = 'service_role');
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
CREATE POLICY "Service role full access on pipeline_stage_history"
  ON public.pipeline_stage_history FOR ALL USING (auth.role() = 'service_role');
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


-- >>> 31_20260623_notification_foundation.sql
20260623_notification_foundation.sql


-- >>> 31_20260627_candidate_tracking.sql

-- ════════════════════════════════════════════════════════════════════════
-- 20260627_candidate_tracking.sql
-- DEX AI Candidate Tracking - T1 Schema Migration (Technical Blueprint 01)
-- Implements: Spec 01 (DEX-BS-001) + Technical Blueprint 01 (DEX-TB-001)
-- GRID v2.0 Integration: 19-stage pipeline, motivation screening, reachability validation
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CONTACTS TABLE EXTENSIONS ──────────────────────────────────────

-- Pipeline: 19-stage recruitment pipeline (GRID v2.0)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'S1_Sourced'
  CHECK (pipeline_stage IN (
    'S1_Sourced', 'S2_Screened', 'S3_Contacted', 'S4_No_Response',
    'S5_Responded', 'S6_WeChat_Added', 'S7_Interested', 'S8_Not_Interested',
    'S9_Call_Positive', 'S10_Call_Negative', 'S11_Internal_Interview',
    'S12_Presented_to_Client', 'S13_Client_Int_Scheduled', 'S14_Client_Interviewed',
    'S15_Client_2nd_Interview', 'S16_Offer_Extended', 'S17_Offer_Accepted',
    'S18_Offer_Declined', 'S19_Closed'
  ));

-- Legacy compatibility: keep pipeline_status for backward compat, sync via trigger
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'S1_Sourced';

-- Motivation Screening (GRID v2.0 - pre-contact gate)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS motivation_overall TEXT DEFAULT 'UNKNOWN'
  CHECK (motivation_overall IN ('GREEN', 'YELLOW', 'RED', 'UNKNOWN'));

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS motivation_assessment JSONB DEFAULT '{}'::jsonb;

-- Reachability Validation (GRID v2.0 - pre-contact gate)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_unknowns INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS contact_channel TEXT
  CHECK (contact_channel IN ('LINKEDIN', 'EMAIL', 'WECHAT', 'NONE', NULL));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_details JSONB DEFAULT '{}'::jsonb;

-- Decline Tracking (GRID v2.0 - S8 specific)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS decline_reason TEXT
  CHECK (decline_reason IN (
    'COMPENSATION', 'ROLE_TOO_JUNIOR', 'LOCATION', 'TIMING',
    'OTHER_OFFER', 'NOT_INTERESTED', 'OTHER', NULL
  ));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS decline_notes TEXT;

-- Classification (flexible per-project)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('A', 'B', 'C'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS classification TEXT
  CHECK (classification IN (
    'CLIENT_SHORTLIST', 'OPERATOR', 'ANALYST_SENIOR', 'ANALYST_JUNIOR',
    'MOTIVATION_RISK', 'REVIEW', 'ELIMINATE', NULL
  ));

-- Other fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS years_of_experience NUMERIC;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS comp_current TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS comp_expected TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS candidate_notes TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS next_action_due DATE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_contacted TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS data_confidence NUMERIC DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS stage_changed_by UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS stage_change_date DATE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('LinkedIn', 'Referral', 'Cold_Outreach', 'Database', 'Event', 'Other', 'import', 'platform'));

-- Indexes for pipeline and filtering
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON public.contacts(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_motivation ON public.contacts(motivation_overall);
CREATE INDEX IF NOT EXISTS idx_contacts_classification ON public.contacts(classification);
CREATE INDEX IF NOT EXISTS idx_contacts_reachability ON public.contacts(reachability_verified)
  WHERE reachability_verified = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_decline_reason ON public.contacts(decline_reason)
  WHERE decline_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON public.contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_tier ON public.contacts(tier);
CREATE INDEX IF NOT EXISTS idx_contacts_data_confidence ON public.contacts(data_confidence);
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON public.contacts(last_contacted DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_is_archived ON public.contacts(is_archived)
  WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_list_default ON public.contacts(is_archived, pipeline_stage, last_contacted DESC)
  WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_stage_active ON public.contacts(pipeline_stage)
  WHERE is_archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON public.contacts(created_by);

-- ── 2. CANDIDATE OUTREACH LOG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_outreach_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  interaction_type TEXT NOT NULL
                    CHECK (interaction_type IN (
                      'cold_call', 'email', 'wechat', 'linkedin', 'referral',
                      'event', 'interview', 'meeting', 'other'
                    )),
  summary         TEXT NOT NULL,
  outcome         TEXT
                    CHECK (outcome IN (
                      'interested', 'not_interested', 'follow_up', 'no_response',
                      'scheduled', 'completed', 'declined'
                    )),
  next_step       TEXT,
  next_step_date  DATE,
  notes           TEXT,
  signal_id       UUID -- links to signals table (Tech-00)
);

CREATE INDEX IF NOT EXISTS idx_outreach_contact ON public.candidate_outreach_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_outreach_created_at ON public.candidate_outreach_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_created_by ON public.candidate_outreach_log(created_by);

ALTER TABLE public.candidate_outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view outreach logs"
  ON public.candidate_outreach_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create outreach logs"
  ON public.candidate_outreach_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team can update own outreach logs"
  ON public.candidate_outreach_log FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- ── 3. CANDIDATE MANDATE LINKS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_mandate_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id      UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'identified'
                    CHECK (status IN (
                      'identified', 'sourced', 'screened', 'shortlisted', 'presented',
                      'interview', 'offer', 'placed', 'withdrawn', 'rejected'
                    )),
  priority        TEXT CHECK (priority IN ('P1', 'P2', 'P3')),
  notes           TEXT,
  -- GRID positioning
  market_position TEXT,
  sector_benchmark TEXT,
  salary_band     TEXT,
  talent_density  TEXT,
  competitor_presence TEXT,
  UNIQUE(contact_id, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_cmdl_contact ON public.candidate_mandate_links(contact_id);
CREATE INDEX IF NOT EXISTS idx_cmdl_mandate ON public.candidate_mandate_links(mandate_id);
CREATE INDEX IF NOT EXISTS idx_cmdl_status ON public.candidate_mandate_links(status);
CREATE INDEX IF NOT EXISTS idx_cmdl_priority ON public.candidate_mandate_links(priority);

ALTER TABLE public.candidate_mandate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view mandate links"
  ON public.candidate_mandate_links FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create mandate links"
  ON public.candidate_mandate_links FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team can update mandate links"
  ON public.candidate_mandate_links FOR UPDATE TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_cmdl_updated_at ON public.candidate_mandate_links;
CREATE TRIGGER trg_cmdl_updated_at
  BEFORE UPDATE ON public.candidate_mandate_links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. SAVED SEARCHES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT NOT NULL,
  filters     JSONB NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can manage own saved searches"
  ON public.saved_searches FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- ── 5. IMPORT LOGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.import_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_name     TEXT NOT NULL,
  source_format   TEXT NOT NULL
                    CHECK (source_format IN ('csv', 'json', 'api')),
  total_rows      INTEGER NOT NULL,
  imported_count  INTEGER DEFAULT 0,
  skipped_count   INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  error_count     INTEGER DEFAULT 0,
  errors          JSONB NOT NULL DEFAULT '[]'::jsonb,
  status          TEXT NOT NULL DEFAULT 'processing'
                    CHECK (status IN ('processing', 'completed', 'failed', 'partial'))
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view import logs"
  ON public.import_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create import logs"
  ON public.import_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 6. PIPELINE TRANSITIONS (GRID v2.0) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pipeline_transitions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  from_stage          TEXT NOT NULL,
  to_stage            TEXT NOT NULL,
  changed_by          UUID REFERENCES auth.users(id),
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason              TEXT,
  -- Validation snapshot
  motivation_overall  TEXT,
  reachability_verified BOOLEAN,
  reachability_unknowns INTEGER,
  decline_reason      TEXT,
  decline_notes       TEXT,
  -- Metadata
  is_backward         BOOLEAN NOT NULL DEFAULT FALSE,
  notes               TEXT
);

CREATE INDEX IF NOT EXISTS idx_pt_contact ON public.pipeline_transitions(contact_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_stage ON public.pipeline_transitions(to_stage, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_backward ON public.pipeline_transitions(is_backward)
  WHERE is_backward = TRUE;
CREATE INDEX IF NOT EXISTS idx_pt_changed_by ON public.pipeline_transitions(changed_by);

ALTER TABLE public.pipeline_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view pipeline transitions"
  ON public.pipeline_transitions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create pipeline transitions"
  ON public.pipeline_transitions FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 7. S2->S3 GATE VALIDATION FUNCTION (GRID v2.0) ───────────────────────
CREATE OR REPLACE FUNCTION public.fn_validate_s2_to_s3_gate(p_contact_id UUID)
RETURNS TABLE (
  can_proceed BOOLEAN,
  block_reason TEXT,
  motivation_overall TEXT,
  reachability_unknowns INTEGER
) AS $$
DECLARE
  v_motivation TEXT;
  v_reach_unknowns INTEGER;
  v_reach_verified BOOLEAN;
  v_contact_channel TEXT;
BEGIN
  SELECT motivation_overall, reachability_unknowns, reachability_verified, contact_channel
  INTO v_motivation, v_reach_unknowns, v_reach_verified, v_contact_channel
  FROM contacts WHERE id = p_contact_id;

  -- Check motivation: must be GREEN or YELLOW (not RED, not UNKNOWN)
  IF v_motivation = 'RED' THEN
    RETURN QUERY SELECT false, 'Motivation is RED - do not contact', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  IF v_motivation = 'UNKNOWN' THEN
    RETURN QUERY SELECT false, 'Motivation not yet assessed - complete motivation screening first', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  -- Check reachability: max 1 unknown allowed
  IF v_reach_unknowns >= 2 THEN
    RETURN QUERY SELECT false,
      'Reachability: ' || v_reach_unknowns || ' unknowns (max 1 allowed)',
      v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  -- Check contact channel
  IF v_contact_channel = 'NONE' OR v_contact_channel IS NULL THEN
    RETURN QUERY SELECT false, 'No contact channel available', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT true, NULL, v_motivation, v_reach_unknowns;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. PIPELINE STAGE TRANSITION TRIGGER ───────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_log_pipeline_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_is_backward BOOLEAN := FALSE;
  v_stage_order TEXT[] := ARRAY[
    'S1_Sourced', 'S2_Screened', 'S3_Contacted', 'S4_No_Response',
    'S5_Responded', 'S6_WeChat_Added', 'S7_Interested', 'S8_Not_Interested',
    'S9_Call_Positive', 'S10_Call_Negative', 'S11_Internal_Interview',
    'S12_Presented_to_Client', 'S13_Client_Int_Scheduled', 'S14_Client_Interviewed',
    'S15_Client_2nd_Interview', 'S16_Offer_Extended', 'S17_Offer_Accepted',
    'S18_Offer_Declined', 'S19_Closed'
  ];
  v_from_idx INTEGER;
  v_to_idx INTEGER;
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    -- Determine if backward move
    SELECT ARRAY_POSITION(v_stage_order, OLD.pipeline_stage) INTO v_from_idx;
    SELECT ARRAY_POSITION(v_stage_order, NEW.pipeline_stage) INTO v_to_idx;

    IF v_from_idx IS NOT NULL AND v_to_idx IS NOT NULL AND v_to_idx < v_from_idx THEN
      v_is_backward := TRUE;
    END IF;

    -- Insert transition record
    INSERT INTO pipeline_transitions (
      contact_id, from_stage, to_stage, changed_by, reason,
      motivation_overall, reachability_verified, reachability_unknowns,
      decline_reason, decline_notes, is_backward
    ) VALUES (
      NEW.id, OLD.pipeline_stage, NEW.pipeline_stage,
      NEW.stage_changed_by, NEW.candidate_notes,
      NEW.motivation_overall, NEW.reachability_verified, NEW.reachability_unknowns,
      NEW.decline_reason, NEW.decline_notes, v_is_backward
    );

    -- Sync legacy pipeline_status
    NEW.pipeline_status := NEW.pipeline_stage;
    NEW.stage_change_date := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pipeline_transition ON public.contacts;
CREATE TRIGGER trg_pipeline_transition
  BEFORE UPDATE OF pipeline_stage ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.fn_log_pipeline_transition();

-- ── 9. OUTREACH LOG SIGNAL TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_outreach_log_signal()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert signal
  INSERT INTO signals (contact_id, type, source, title, metadata, actor_id)
  VALUES (
    NEW.contact_id,
    'outreach',
    'platform',
    NEW.summary,
    jsonb_build_object(
      'interaction_type', NEW.interaction_type,
      'outcome', NEW.outcome,
      'summary', NEW.summary
    ),
    NEW.created_by
  );

  -- Update contacts timestamps
  UPDATE contacts SET
    signal_count = COALESCE(signal_count, 0) + 1,
    last_signal_at = NOW(),
    last_contacted = NOW()
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_outreach_log_signal ON public.candidate_outreach_log;
CREATE TRIGGER trg_outreach_log_signal
  AFTER INSERT ON public.candidate_outreach_log
  FOR EACH ROW EXECUTE FUNCTION public.fn_outreach_log_signal();

-- ── 10. CMDL STATUS SIGNAL TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_cmdl_status_signal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO signals (contact_id, mandate_id, type, source, title, metadata, actor_id)
    VALUES (
      NEW.contact_id,
      NEW.mandate_id,
      'status_change',
      'system',
      'Candidate status changed: ' || OLD.status || ' -> ' || NEW.status,
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'table', 'candidate_mandate_links'
      ),
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cmdl_status_signal ON public.candidate_mandate_links;
CREATE TRIGGER trg_cmdl_status_signal
  AFTER UPDATE OF status ON public.candidate_mandate_links
  FOR EACH ROW EXECUTE FUNCTION public.fn_cmdl_status_signal();

-- ── 11. DATA CONFIDENCE CALCULATION ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_calculate_data_confidence()
RETURNS TRIGGER AS $$
DECLARE
  v_confidence NUMERIC;
  v_filled INTEGER := 0;
  v_total INTEGER := 10;
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.current_title IS NOT NULL AND NEW.current_title != '' THEN v_filled := v_filled + 1; END IF;
  IF (NEW.city IS NOT NULL AND NEW.city != '') OR (NEW.country IS NOT NULL AND NEW.country != '') THEN v_filled := v_filled + 1; END IF;
  IF NEW.industry IS NOT NULL AND NEW.industry != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.years_of_experience IS NOT NULL THEN v_filled := v_filled + 1; END IF;
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.skills IS NOT NULL AND NEW.skills != '{}'::jsonb AND jsonb_array_length(COALESCE(NEW.skills, '[]'::jsonb)) > 0 THEN v_filled := v_filled + 1; END IF;
  IF NEW.languages IS NOT NULL AND NEW.languages != '{}'::jsonb AND jsonb_array_length(COALESCE(NEW.languages, '[]'::jsonb)) > 0 THEN v_filled := v_filled + 1; END IF;
  IF NEW.comp_current IS NOT NULL AND NEW.comp_current != '' THEN v_filled := v_filled + 1; END IF;
  IF NEW.tier IS NOT NULL THEN v_filled := v_filled + 1; END IF;

  v_confidence := ROUND((v_filled::NUMERIC / v_total) * 100);
  NEW.data_confidence := v_confidence;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_confidence ON public.contacts;
CREATE TRIGGER trg_data_confidence
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.fn_calculate_data_confidence();

-- ── 12. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'candidate_outreach_log', 'candidate_mandate_links',
    'saved_searches', 'import_logs', 'pipeline_transitions'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '[OK] Candidate Tracking migration OK - all tables present';
  ELSE
    RAISE EXCEPTION '[FAIL] Candidate Tracking migration FAILED - missing: %', v_missing;
  END IF;

  -- Verify contacts columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'pipeline_stage'
  ) THEN
    RAISE EXCEPTION 'contacts.pipeline_stage column missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'motivation_overall'
  ) THEN
    RAISE EXCEPTION 'contacts.motivation_overall column missing';
  END IF;

  RAISE NOTICE '[OK] contacts table extensions verified';
END$$;


-- >>> 32_20260627_grid_market_mapping.sql

-- ════════════════════════════════════════════════════════════════════════
-- 20260627_grid_market_mapping.sql
-- DEX AI GRID Market Mapping - T2 Schema Migration (Technical Blueprint 02)
-- Implements: Spec 02 (DEX-BS-002) + Technical Blueprint 02 (DEX-TB-002)
-- GRID v2.0 Integration: 5-section mapping, M1-M7 standards, 16 intelligence data points
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. GRID MAPPINGS (Master record) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grid_mappings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id          UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version             INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'in_progress', 'complete', 'archived')),
  mapping_type        TEXT NOT NULL DEFAULT 'grid'
                       CHECK (mapping_type IN ('sweep', 'grid')),
  config              JSONB NOT NULL DEFAULT '{}'::jsonb,
  standards_summary   JSONB NOT NULL DEFAULT '{}'::jsonb,
  intelligence_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
  intelligence_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  export_pdf_path     TEXT,
  export_csv_path     TEXT,
  last_generated_at   TIMESTAMPTZ,
  last_daily_grid_sent TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_grid_mappings_mandate ON public.grid_mappings(mandate_id);
CREATE INDEX IF NOT EXISTS idx_grid_mappings_status ON public.grid_mappings(status);
CREATE INDEX IF NOT EXISTS idx_grid_mappings_type ON public.grid_mappings(mapping_type);

ALTER TABLE public.grid_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid mappings"
  ON public.grid_mappings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can create grid mappings"
  ON public.grid_mappings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team can update grid mappings"
  ON public.grid_mappings FOR UPDATE TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_grid_mappings_updated_at ON public.grid_mappings;
CREATE TRIGGER trg_grid_mappings_updated_at
  BEFORE UPDATE ON public.grid_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. GRID SECTORS (Section 1: Sector & Segment Definition) ────────────
CREATE TABLE IF NOT EXISTS public.grid_sectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  sector_name     TEXT NOT NULL,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  segments        JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_grid_sectors_mapping ON public.grid_sectors(grid_mapping_id);

ALTER TABLE public.grid_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid sectors"
  ON public.grid_sectors FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid sectors"
  ON public.grid_sectors FOR ALL TO authenticated
  USING (true);

-- ── 3. GRID COMPANIES (Section 2: Target Company List) ─────────────────
CREATE TABLE IF NOT EXISTS public.grid_companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  grid_sector_id  UUID REFERENCES public.grid_sectors(id) ON DELETE SET NULL,
  target_company_id UUID REFERENCES public.target_companies(id) ON DELETE SET NULL,
  company_name    TEXT NOT NULL,
  segment         TEXT,
  est_employees   INTEGER,
  relevance       TEXT NOT NULL DEFAULT 'medium'
                   CHECK (relevance IN ('high', 'medium', 'low')),
  rationale       TEXT NOT NULL,
  target_candidates INTEGER NOT NULL DEFAULT 1 CHECK (target_candidates >= 1),
  actual_candidates INTEGER NOT NULL DEFAULT 0,
  gap             INTEGER NOT NULL DEFAULT 0,
  gap_reason      TEXT
                   CHECK (gap_reason IN ('not_interested', 'not_found', 'not_reachable', 'wrong_seniority', 'wrong_function', NULL)),
  gap_action_plan TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grid_companies_mapping ON public.grid_companies(grid_mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_companies_sector ON public.grid_companies(grid_sector_id);
CREATE INDEX IF NOT EXISTS idx_grid_companies_relevance ON public.grid_companies(relevance);

ALTER TABLE public.grid_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid companies"
  ON public.grid_companies FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid companies"
  ON public.grid_companies FOR ALL TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_grid_companies_updated_at ON public.grid_companies;
CREATE TRIGGER trg_grid_companies_updated_at
  BEFORE UPDATE ON public.grid_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-compute gap
CREATE OR REPLACE FUNCTION public.fn_grid_company_gap()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gap := NEW.target_candidates - NEW.actual_candidates;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grid_company_gap ON public.grid_companies;
CREATE TRIGGER trg_grid_company_gap
  BEFORE INSERT OR UPDATE OF target_candidates, actual_candidates ON public.grid_companies
  FOR EACH ROW EXECUTE FUNCTION public.fn_grid_company_gap();

-- ── 4. GRID FUNCTIONS (Section 3: Business Function Relevance) ──────────
CREATE TABLE IF NOT EXISTS public.grid_functions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  function_name   TEXT NOT NULL,
  relevant_titles JSONB NOT NULL DEFAULT '[]'::jsonb,
  seniority_from  TEXT,
  seniority_to    TEXT,
  relevance       TEXT NOT NULL DEFAULT 'medium'
                   CHECK (relevance IN ('high', 'medium', 'low')),
  notes           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_grid_functions_mapping ON public.grid_functions(grid_mapping_id);

ALTER TABLE public.grid_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid functions"
  ON public.grid_functions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid functions"
  ON public.grid_functions FOR ALL TO authenticated
  USING (true);

-- ── 5. GRID CANDIDATE ENTRIES (Section 4: Candidate Map) ────────────────
CREATE TABLE IF NOT EXISTS public.grid_candidate_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id     UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  grid_company_id     UUID REFERENCES public.grid_companies(id) ON DELETE SET NULL,
  grid_function_id    UUID REFERENCES public.grid_functions(id) ON DELETE SET NULL,
  -- Positioning fields
  market_position     TEXT
                      CHECK (market_position IN ('above_market', 'at_market', 'below_market', 'emerging')),
  sector_benchmark    TEXT
                      CHECK (sector_benchmark IN ('top', 'second', 'third', 'bottom')),
  salary_band         TEXT
                      CHECK (salary_band IN ('executive_premium', 'market_rate', 'below_market', 'unknown')),
  talent_density      TEXT
                      CHECK (talent_density IN ('high', 'medium', 'low', 'scarce')),
  competitor_presence TEXT,
  -- Priority
  priority            TEXT NOT NULL DEFAULT 'P3'
                      CHECK (priority IN ('P1', 'P2', 'P3')),
  priority_override   BOOLEAN NOT NULL DEFAULT FALSE,
  priority_override_reason TEXT,
  -- Status
  status              TEXT NOT NULL DEFAULT 'uncontacted'
                      CHECK (status IN ('uncontacted', 'contacted_interested', 'contacted_not_interested', 'interview', 'offer', 'declined_offer', 'not_viable')),
  notes               TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grid_mapping_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_grid_entries_mapping ON public.grid_candidate_entries(grid_mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_entries_contact ON public.grid_candidate_entries(contact_id);
CREATE INDEX IF NOT EXISTS idx_grid_entries_priority ON public.grid_candidate_entries(priority);
CREATE INDEX IF NOT EXISTS idx_grid_entries_status ON public.grid_candidate_entries(status);

ALTER TABLE public.grid_candidate_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid candidate entries"
  ON public.grid_candidate_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Team can manage grid candidate entries"
  ON public.grid_candidate_entries FOR ALL TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_grid_entries_updated_at ON public.grid_candidate_entries;
CREATE TRIGGER trg_grid_entries_updated_at
  BEFORE UPDATE ON public.grid_candidate_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-assign priority
CREATE OR REPLACE FUNCTION public.fn_grid_auto_priority()
RETURNS TRIGGER AS $$
DECLARE
  v_company_relevance TEXT;
  v_function_relevance TEXT;
BEGIN
  IF NEW.priority_override = TRUE THEN
    RETURN NEW;
  END IF;

  SELECT relevance INTO v_company_relevance
  FROM grid_companies WHERE id = NEW.grid_company_id;

  SELECT relevance INTO v_function_relevance
  FROM grid_functions WHERE id = NEW.grid_function_id;

  IF v_company_relevance = 'high' AND v_function_relevance = 'high' THEN
    NEW.priority := 'P1';
  ELSIF (v_company_relevance = 'high' AND v_function_relevance = 'medium')
      OR (v_company_relevance = 'medium' AND v_function_relevance = 'high') THEN
    NEW.priority := 'P2';
  ELSE
    NEW.priority := 'P3';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grid_auto_priority ON public.grid_candidate_entries;
CREATE TRIGGER trg_grid_auto_priority
  BEFORE INSERT OR UPDATE OF grid_company_id, grid_function_id ON public.grid_candidate_entries
  FOR EACH ROW EXECUTE FUNCTION public.fn_grid_auto_priority();

-- ── 6. GRID MINIMUM STANDARDS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grid_minimum_standards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_mapping_id     UUID NOT NULL REFERENCES public.grid_mappings(id) ON DELETE CASCADE,
  checked_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- M1: Target companies >= 15
  m1_company_count    INTEGER NOT NULL DEFAULT 0,
  m1_status           TEXT NOT NULL DEFAULT 'red',
  -- M2: Sectors >= 3
  m2_sector_count     INTEGER NOT NULL DEFAULT 0,
  m2_status           TEXT NOT NULL DEFAULT 'red',
  -- M3: Candidates >= 30
  m3_candidate_count  INTEGER NOT NULL DEFAULT 0,
  m3_status           TEXT NOT NULL DEFAULT 'red',
  -- M4: Candidates contacted >= 50%
  m4_contacted_pct    NUMERIC NOT NULL DEFAULT 0,
  m4_status           TEXT NOT NULL DEFAULT 'red',
  -- M5: Gap table filled 100%
  m5_gap_filled_pct   NUMERIC NOT NULL DEFAULT 0,
  m5_status           TEXT NOT NULL DEFAULT 'red',
  -- M6: P1 contacted within 1 week = 100%
  m6_p1_contacted_pct NUMERIC NOT NULL DEFAULT 0,
  m6_status           TEXT NOT NULL DEFAULT 'red',
  -- M7: Status updated within 7 days
  m7_last_update      TIMESTAMPTZ,
  m7_status           TEXT NOT NULL DEFAULT 'red',
  -- Overall
  overall_score       INTEGER NOT NULL DEFAULT 0,
  overall_status      TEXT NOT NULL DEFAULT 'red',
  UNIQUE(grid_mapping_id)
);

CREATE INDEX IF NOT EXISTS idx_grid_standards_mapping ON public.grid_minimum_standards(grid_mapping_id);

ALTER TABLE public.grid_minimum_standards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view grid standards"
  ON public.grid_minimum_standards FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can update grid standards"
  ON public.grid_minimum_standards FOR ALL TO authenticated
  USING (true);

-- ── 7. COMPUTE GRID STANDARDS FUNCTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_compute_grid_standards(p_mapping_id UUID)
RETURNS VOID AS $$
DECLARE
  v_company_count INTEGER;
  v_sector_count INTEGER;
  v_candidate_count INTEGER;
  v_contacted_count INTEGER;
  v_contacted_pct NUMERIC;
  v_gap_filled_count INTEGER;
  v_gap_total INTEGER;
  v_gap_filled_pct NUMERIC;
  v_p1_count INTEGER;
  v_p1_contacted INTEGER;
  v_p1_pct NUMERIC;
  v_last_update TIMESTAMPTZ;
  v_overall_score INTEGER;
  v_overall_status TEXT;
BEGIN
  -- M1: Count companies
  SELECT COUNT(*) INTO v_company_count FROM grid_companies WHERE grid_mapping_id = p_mapping_id;

  -- M2: Count sectors
  SELECT COUNT(*) INTO v_sector_count FROM grid_sectors WHERE grid_mapping_id = p_mapping_id;

  -- M3: Count candidates
  SELECT COUNT(*) INTO v_candidate_count FROM grid_candidate_entries WHERE grid_mapping_id = p_mapping_id;

  -- M4: Contacted percentage
  SELECT COUNT(*) INTO v_contacted_count
  FROM grid_candidate_entries
  WHERE grid_mapping_id = p_mapping_id AND status NOT IN ('uncontacted');
  v_contacted_pct := CASE WHEN v_candidate_count > 0 THEN ROUND((v_contacted_count::NUMERIC / v_candidate_count) * 100) ELSE 0 END;

  -- M5: Gap table filled
  SELECT COUNT(*) INTO v_gap_total FROM grid_companies WHERE grid_mapping_id = p_mapping_id;
  SELECT COUNT(*) INTO v_gap_filled_count
  FROM grid_companies WHERE grid_mapping_id = p_mapping_id AND gap_reason IS NOT NULL;
  v_gap_filled_pct := CASE WHEN v_gap_total > 0 THEN ROUND((v_gap_filled_count::NUMERIC / v_gap_total) * 100) ELSE 0 END;

  -- M6: P1 contacted
  SELECT COUNT(*) INTO v_p1_count
  FROM grid_candidate_entries WHERE grid_mapping_id = p_mapping_id AND priority = 'P1';
  SELECT COUNT(*) INTO v_p1_contacted
  FROM grid_candidate_entries
  WHERE grid_mapping_id = p_mapping_id AND priority = 'P1' AND status NOT IN ('uncontacted');
  v_p1_pct := CASE WHEN v_p1_count > 0 THEN ROUND((v_p1_contacted::NUMERIC / v_p1_count) * 100) ELSE 0 END;

  -- M7: Last update
  SELECT MAX(updated_at) INTO v_last_update
  FROM grid_candidate_entries WHERE grid_mapping_id = p_mapping_id;

  -- Calculate overall score (0-7)
  v_overall_score := 0;
  IF v_company_count >= 15 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_sector_count >= 3 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_candidate_count >= 30 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_contacted_pct >= 50 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_gap_filled_pct = 100 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_p1_pct = 100 THEN v_overall_score := v_overall_score + 1; END IF;
  IF v_last_update >= NOW() - INTERVAL '7 days' THEN v_overall_score := v_overall_score + 1; END IF;

  v_overall_status := CASE
    WHEN v_overall_score >= 6 THEN 'green'
    WHEN v_overall_score >= 4 THEN 'yellow'
    ELSE 'red'
  END;

  -- Upsert standards record
  INSERT INTO grid_minimum_standards (
    grid_mapping_id, checked_at,
    m1_company_count, m1_status,
    m2_sector_count, m2_status,
    m3_candidate_count, m3_status,
    m4_contacted_pct, m4_status,
    m5_gap_filled_pct, m5_status,
    m6_p1_contacted_pct, m6_status,
    m7_last_update, m7_status,
    overall_score, overall_status
  ) VALUES (
    p_mapping_id, NOW(),
    v_company_count, CASE WHEN v_company_count >= 15 THEN 'green' WHEN v_company_count >= 10 THEN 'yellow' ELSE 'red' END,
    v_sector_count, CASE WHEN v_sector_count >= 3 THEN 'green' WHEN v_sector_count >= 2 THEN 'yellow' ELSE 'red' END,
    v_candidate_count, CASE WHEN v_candidate_count >= 30 THEN 'green' WHEN v_candidate_count >= 15 THEN 'yellow' ELSE 'red' END,
    v_contacted_pct, CASE WHEN v_contacted_pct >= 50 THEN 'green' WHEN v_contacted_pct >= 25 THEN 'yellow' ELSE 'red' END,
    v_gap_filled_pct, CASE WHEN v_gap_filled_pct = 100 THEN 'green' WHEN v_gap_filled_pct >= 50 THEN 'yellow' ELSE 'red' END,
    v_p1_pct, CASE WHEN v_p1_pct = 100 THEN 'green' WHEN v_p1_pct >= 50 THEN 'yellow' ELSE 'red' END,
    v_last_update, CASE WHEN v_last_update >= NOW() - INTERVAL '7 days' THEN 'green' WHEN v_last_update >= NOW() - INTERVAL '14 days' THEN 'yellow' ELSE 'red' END,
    v_overall_score, v_overall_status
  ) ON CONFLICT (grid_mapping_id) DO UPDATE SET
    checked_at = NOW(),
    m1_company_count = v_company_count,
    m1_status = CASE WHEN v_company_count >= 15 THEN 'green' WHEN v_company_count >= 10 THEN 'yellow' ELSE 'red' END,
    m2_sector_count = v_sector_count,
    m2_status = CASE WHEN v_sector_count >= 3 THEN 'green' WHEN v_sector_count >= 2 THEN 'yellow' ELSE 'red' END,
    m3_candidate_count = v_candidate_count,
    m3_status = CASE WHEN v_candidate_count >= 30 THEN 'green' WHEN v_candidate_count >= 15 THEN 'yellow' ELSE 'red' END,
    m4_contacted_pct = v_contacted_pct,
    m4_status = CASE WHEN v_contacted_pct >= 50 THEN 'green' WHEN v_contacted_pct >= 25 THEN 'yellow' ELSE 'red' END,
    m5_gap_filled_pct = v_gap_filled_pct,
    m5_status = CASE WHEN v_gap_filled_pct = 100 THEN 'green' WHEN v_gap_filled_pct >= 50 THEN 'yellow' ELSE 'red' END,
    m6_p1_contacted_pct = v_p1_pct,
    m6_status = CASE WHEN v_p1_pct = 100 THEN 'green' WHEN v_p1_pct >= 50 THEN 'yellow' ELSE 'red' END,
    m7_last_update = v_last_update,
    m7_status = CASE WHEN v_last_update >= NOW() - INTERVAL '7 days' THEN 'green' WHEN v_last_update >= NOW() - INTERVAL '14 days' THEN 'yellow' ELSE 'red' END,
    overall_score = v_overall_score,
    overall_status = v_overall_status;

  -- Update grid_mappings.standards_summary
  UPDATE grid_mappings SET
    standards_summary = jsonb_build_object(
      'm1_companies', jsonb_build_object('count', v_company_count, 'min', 15, 'status', CASE WHEN v_company_count >= 15 THEN 'green' WHEN v_company_count >= 10 THEN 'yellow' ELSE 'red' END),
      'm2_sectors', jsonb_build_object('count', v_sector_count, 'min', 3, 'status', CASE WHEN v_sector_count >= 3 THEN 'green' WHEN v_sector_count >= 2 THEN 'yellow' ELSE 'red' END),
      'm3_candidates', jsonb_build_object('count', v_candidate_count, 'min', 30, 'status', CASE WHEN v_candidate_count >= 30 THEN 'green' WHEN v_candidate_count >= 15 THEN 'yellow' ELSE 'red' END),
      'm4_contacted', jsonb_build_object('pct', v_contacted_pct, 'target', 50, 'status', CASE WHEN v_contacted_pct >= 50 THEN 'green' WHEN v_contacted_pct >= 25 THEN 'yellow' ELSE 'red' END),
      'm5_gap_filled', jsonb_build_object('pct', v_gap_filled_pct, 'target', 100, 'status', CASE WHEN v_gap_filled_pct = 100 THEN 'green' WHEN v_gap_filled_pct >= 50 THEN 'yellow' ELSE 'red' END),
      'm6_p1_contacted', jsonb_build_object('pct', v_p1_pct, 'target', 100, 'status', CASE WHEN v_p1_pct = 100 THEN 'green' WHEN v_p1_pct >= 50 THEN 'yellow' ELSE 'red' END),
      'm7_last_update', jsonb_build_object('date', v_last_update, 'status', CASE WHEN v_last_update >= NOW() - INTERVAL '7 days' THEN 'green' WHEN v_last_update >= NOW() - INTERVAL '14 days' THEN 'yellow' ELSE 'red' END)
    ),
    updated_at = NOW()
  WHERE id = p_mapping_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 8. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'grid_mappings', 'grid_sectors', 'grid_companies',
    'grid_functions', 'grid_candidate_entries', 'grid_minimum_standards'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '[OK] GRID Market Mapping migration OK - all tables present';
  ELSE
    RAISE EXCEPTION '[FAIL] GRID Market Mapping migration FAILED - missing: %', v_missing;
  END IF;
END$$;

