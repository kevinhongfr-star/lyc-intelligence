-- ── 20260611_create_org_intelligence_tables.sql ─────────────────────────
-- Organizational Intelligence module — T1 schema migration.
-- NEXUS direct build (Kevin override 2026-06-11 15:12 — PM/Trae LOCK lifted).
-- 9 module tables + 1 audit log. Admin-only access. Codelco China = launch mandate.
--
-- Reuses:
--   • public.set_updated_at() — created in 20260608_create_memories_and_share_cards_tables.sql
--   • public.profiles (with role column) — pre-existing
--
-- Consumer tables (all under public schema):
--   1. target_companies         — 50 target companies from CSV upload
--   2. org_snapshots            — org tree JSON per company
--   3. org_talent_pools         — individuals at each company
--   4. org_evaluations          — CV + interview eval records
--   5. org_evaluation_scores    — 5-criteria granular scores
--   6. sourcing_channels        — LinkedIn/Liepin/Zhilian/Zhipin metadata (Phase 2)
--   7. org_talent_attachments   — CV file metadata
--   8. one_pagers               — per-company content (12-slide GRID source)
--   9. grid_reports             — generated GRID PDF records
--  10. org_audit_log            — append-only audit trail

-- ════════════════════════════════════════════════════════════════════════
-- 1. target_companies
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.target_companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id    UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sector        TEXT,
  country       TEXT,
  hq_city       TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','archived','rejected')),
  is_comparator BOOLEAN NOT NULL DEFAULT FALSE,
  source        TEXT NOT NULL DEFAULT 'csv_upload'
                  CHECK (source IN ('csv_upload','manual','auto_pulled')),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at   TIMESTAMPTZ,
  UNIQUE(mandate_id, name)
);

CREATE INDEX IF NOT EXISTS idx_target_companies_mandate_status
  ON public.target_companies (mandate_id, status);
CREATE INDEX IF NOT EXISTS idx_target_companies_name
  ON public.target_companies (name);
CREATE INDEX IF NOT EXISTS idx_target_companies_comparator
  ON public.target_companies (mandate_id, is_comparator)
  WHERE is_comparator = TRUE;

ALTER TABLE public.target_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on target_companies"
  ON public.target_companies FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read target_companies"
  ON public.target_companies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write target_companies"
  ON public.target_companies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_target_companies_updated_at ON public.target_companies;
CREATE TRIGGER trg_target_companies_updated_at
  BEFORE UPDATE ON public.target_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 2. org_snapshots
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_company_id UUID NOT NULL REFERENCES public.target_companies(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  structure_json  JSONB NOT NULL,
  headcount_total INTEGER,
  source          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual','auto_pulled','csv_upload')),
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_snapshots_company_date
  ON public.org_snapshots (target_company_id, snapshot_date DESC);

ALTER TABLE public.org_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on org_snapshots"
  ON public.org_snapshots FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read org_snapshots"
  ON public.org_snapshots FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write org_snapshots"
  ON public.org_snapshots FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════
-- 3. org_talent_pools
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_talent_pools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_company_id UUID NOT NULL REFERENCES public.target_companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  title           TEXT,
  bu              TEXT,
  level           INTEGER CHECK (level >= 1 AND level <= 10),
  manager_id      UUID REFERENCES public.org_talent_pools(id) ON DELETE SET NULL,
  location        TEXT,
  linkedin_url    TEXT,
  email           TEXT,
  tenure_years    NUMERIC(4,1),
  attributes      JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived','placed','declined')),
  is_leadership   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_org_talent_pools_company
  ON public.org_talent_pools (target_company_id, status);
CREATE INDEX IF NOT EXISTS idx_org_talent_pools_bu
  ON public.org_talent_pools (target_company_id, bu);
CREATE INDEX IF NOT EXISTS idx_org_talent_pools_level
  ON public.org_talent_pools (target_company_id, level);
CREATE INDEX IF NOT EXISTS idx_org_talent_pools_leadership
  ON public.org_talent_pools (target_company_id, is_leadership)
  WHERE is_leadership = TRUE;
CREATE INDEX IF NOT EXISTS idx_org_talent_pools_manager
  ON public.org_talent_pools (manager_id)
  WHERE manager_id IS NOT NULL;

ALTER TABLE public.org_talent_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on org_talent_pools"
  ON public.org_talent_pools FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read org_talent_pools"
  ON public.org_talent_pools FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write org_talent_pools"
  ON public.org_talent_pools FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_org_talent_pools_updated_at ON public.org_talent_pools;
CREATE TRIGGER trg_org_talent_pools_updated_at
  BEFORE UPDATE ON public.org_talent_pools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 4. org_evaluations
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_evaluations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id     UUID NOT NULL REFERENCES public.org_talent_pools(id) ON DELETE CASCADE,
  eval_type     TEXT NOT NULL
                  CHECK (eval_type IN ('cv','interview','reference','work_sample')),
  eval_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluator_id  UUID NOT NULL REFERENCES auth.users(id),
  overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  scorecard     JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes         TEXT,
  is_final      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_evaluations_talent
  ON public.org_evaluations (talent_id, eval_type, eval_date DESC);
CREATE INDEX IF NOT EXISTS idx_org_evaluations_evaluator
  ON public.org_evaluations (evaluator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_evaluations_final
  ON public.org_evaluations (talent_id)
  WHERE is_final = TRUE;

ALTER TABLE public.org_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on org_evaluations"
  ON public.org_evaluations FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read org_evaluations"
  ON public.org_evaluations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write org_evaluations"
  ON public.org_evaluations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_org_evaluations_updated_at ON public.org_evaluations;
CREATE TRIGGER trg_org_evaluations_updated_at
  BEFORE UPDATE ON public.org_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 5. org_evaluation_scores (5-criteria granular, supports override trail)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_evaluation_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.org_evaluations(id) ON DELETE CASCADE,
  criterion_key TEXT NOT NULL,
  criterion_label TEXT NOT NULL,
  score         NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  source        TEXT NOT NULL
                  CHECK (source IN ('auto_pulled','lyc_override','consensus')),
  rationale     TEXT,
  confidence    NUMERIC(3,2) DEFAULT 0.8
                  CHECK (confidence >= 0 AND confidence <= 1),
  overridden_by UUID REFERENCES auth.users(id),
  overridden_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluation_id, criterion_key)
);

CREATE INDEX IF NOT EXISTS idx_org_evaluation_scores_eval
  ON public.org_evaluation_scores (evaluation_id);
CREATE INDEX IF NOT EXISTS idx_org_evaluation_scores_criterion
  ON public.org_evaluation_scores (criterion_key, score DESC);

ALTER TABLE public.org_evaluation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on org_evaluation_scores"
  ON public.org_evaluation_scores FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read org_evaluation_scores"
  ON public.org_evaluation_scores FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write org_evaluation_scores"
  ON public.org_evaluation_scores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_org_evaluation_scores_updated_at ON public.org_evaluation_scores;
CREATE TRIGGER trg_org_evaluation_scores_updated_at
  BEFORE UPDATE ON public.org_evaluation_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 6. sourcing_channels (Phase 2: LinkedIn/Liepin/Zhilian/Zhipin metadata)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sourcing_channels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_key   TEXT NOT NULL UNIQUE,
  channel_label TEXT NOT NULL,
  api_endpoint  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sourcing_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on sourcing_channels"
  ON public.sourcing_channels FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read sourcing_channels"
  ON public.sourcing_channels FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write sourcing_channels"
  ON public.sourcing_channels FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

INSERT INTO public.sourcing_channels (channel_key, channel_label, is_active) VALUES
  ('linkedin', 'LinkedIn', FALSE),
  ('liepin',   'Liepin (猎聘)', FALSE),
  ('zhilian',  'Zhilian (智联)', FALSE),
  ('zhipin',   'Zhipin (BOSS 直聘)', FALSE)
ON CONFLICT (channel_key) DO NOTHING;

DROP TRIGGER IF EXISTS trg_sourcing_channels_updated_at ON public.sourcing_channels;
CREATE TRIGGER trg_sourcing_channels_updated_at
  BEFORE UPDATE ON public.sourcing_channels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 7. org_talent_attachments (CV file metadata; files in Supabase storage)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_talent_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id     UUID NOT NULL REFERENCES public.org_talent_pools(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  file_size     INTEGER,
  mime_type     TEXT,
  uploaded_by   UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_talent_attachments_talent
  ON public.org_talent_attachments (talent_id, created_at DESC);

ALTER TABLE public.org_talent_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on org_talent_attachments"
  ON public.org_talent_attachments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read org_talent_attachments"
  ON public.org_talent_attachments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write org_talent_attachments"
  ON public.org_talent_attachments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════
-- 8. one_pagers
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.one_pagers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_company_id UUID NOT NULL REFERENCES public.target_companies(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL DEFAULT 1,
  content_html    TEXT,
  content_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_one_pagers_company
  ON public.one_pagers (target_company_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_one_pagers_published
  ON public.one_pagers (target_company_id)
  WHERE is_published = TRUE;

ALTER TABLE public.one_pagers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on one_pagers"
  ON public.one_pagers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read one_pagers"
  ON public.one_pagers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write one_pagers"
  ON public.one_pagers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_one_pagers_updated_at ON public.one_pagers;
CREATE TRIGGER trg_one_pagers_updated_at
  BEFORE UPDATE ON public.one_pagers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════
-- 9. grid_reports (GRID PDF output records)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.grid_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id    UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  pdf_path      TEXT NOT NULL,
  slide_count   INTEGER NOT NULL DEFAULT 12,
  slide_config  JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'generating'
                  CHECK (status IN ('generating','ready','failed','archived')),
  generated_by  UUID NOT NULL REFERENCES auth.users(id),
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  error_message TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grid_reports_mandate
  ON public.grid_reports (mandate_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_grid_reports_status
  ON public.grid_reports (status, generated_at DESC);

ALTER TABLE public.grid_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on grid_reports"
  ON public.grid_reports FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read grid_reports"
  ON public.grid_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins write grid_reports"
  ON public.grid_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════
-- 10. org_audit_log (append-only audit trail)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.org_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES auth.users(id),
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   UUID,
  before_state  JSONB,
  after_state   JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_audit_log_actor
  ON public.org_audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_audit_log_resource
  ON public.org_audit_log (resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_audit_log_action
  ON public.org_audit_log (action, created_at DESC);

ALTER TABLE public.org_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on org_audit_log"
  ON public.org_audit_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Admins read org_audit_log"
  ON public.org_audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- No admin write policy — append-only via service role.

-- ════════════════════════════════════════════════════════════════════════
-- Smoke test (run after migration to verify all tables present)
-- ════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count INTEGER;
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'target_companies','org_snapshots','org_talent_pools',
    'org_evaluations','org_evaluation_scores','sourcing_channels',
    'org_talent_attachments','one_pagers','grid_reports','org_audit_log'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE 'Org Intelligence migration OK — all 10 tables present ✅';
  ELSE
    RAISE EXCEPTION 'Org Intelligence migration FAILED — missing: %', v_missing;
  END IF;
END$$;
