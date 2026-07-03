-- ============================================================
-- DEX AI / LYC Intelligence — Master Migration Script V4
-- Generated: 2026-07-03
-- Fixes: JSONB index, CREATE POLICY syntax, generated column
--
-- INSTRUCTIONS: Copy entire file → Supabase SQL Editor → Run
-- ============================================================

BEGIN;

-- ============================================================
-- PART 0: PROFILES TABLE + AUTO-CONFIRM FIX
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    avatar_url TEXT,
    phone TEXT,
    department TEXT,
    client_organization TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_organization TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lyc_admin'))
    );

CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'lyc_admin'))
    );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-confirm existing user (confirmed_at is generated, only set email_confirmed_at)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'kevin@lyc-partners.ai'
  AND email_confirmed_at IS NULL;

-- Create super_admin profile for Kevin
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
    'f6feeaac-4be1-4f13-a11f-ddd8f4e3735f',
    'kevin@lyc-partners.ai',
    'Kevin Hong',
    'super_admin'
)
ON CONFLICT (id) DO UPDATE
SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;


-- ============================================================
-- MIGRATION: 20260608_create_memories_and_share_cards_tables.sql
-- ============================================================
-- ── Memories Table ─────────────────────────────────────────────────
-- Stores user-extracted career intelligence (goals, pain points, strengths,
-- experiences, preferences, insights) from chat conversations or explicit
-- user input. Consumed by:
--   • api/memory.ts (POST → extract via DeepSeek + insert)
--   • Frontend memoryStore.loadMemories (future: GET route)
--
-- Schema mirrors what api/memory.ts inserts.

CREATE TABLE IF NOT EXISTS public.memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type   TEXT NOT NULL
                  CHECK (memory_type IN ('goal','pain_point','strength','experience','preference','insight')),
  content       TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'conversation_extraction'
                  CHECK (source IN ('conversation_extraction','explicit_user_input','system')),
  session_id    UUID,                          -- chat session reference (nullable)
  confidence    NUMERIC(3,2) NOT NULL DEFAULT 0.6
                  CHECK (confidence >= 0 AND confidence <= 1),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memories_user_id_active
  ON public.memories (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_memories_session_id
  ON public.memories (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_memory_type
  ON public.memories (memory_type);

CREATE INDEX IF NOT EXISTS idx_memories_created_at
  ON public.memories (created_at DESC);

-- ── RLS Policies ──────────────────────────────────────────────────
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Service role has full access (backend operations, cross-user admin tasks)
CREATE POLICY "Service role full access on memories"
  ON public.memories FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own memories
CREATE POLICY "Users read own memories"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert memories for themselves (frontend optimistic + offline)
CREATE POLICY "Users insert own memories"
  ON public.memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (e.g., deactivate) their own memories
CREATE POLICY "Users update own memories"
  ON public.memories FOR UPDATE
  USING (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memories_updated_at ON public.memories;
CREATE TRIGGER trg_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Share Cards Table ─────────────────────────────────────────────
-- Stores public share-card metadata for assessment/share results.
-- Consumed by:
--   • api/share.ts (POST → insert after public_uuid generation)
--   • Public share pages (future: GET by public_uuid)
--
-- Schema mirrors what api/share.ts inserts.

CREATE TABLE IF NOT EXISTS public.share_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_uuid   UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL
                  CHECK (type IN ('assessment','branding','prism','trident','cv','other')),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url     TEXT,
  view_count    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,                   -- optional TTL (nullable)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────
-- public_uuid is the lookup key for public share pages
CREATE INDEX IF NOT EXISTS idx_share_cards_public_uuid
  ON public.share_cards (public_uuid)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_share_cards_user_id
  ON public.share_cards (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_cards_type
  ON public.share_cards (type);

-- ── RLS Policies ──────────────────────────────────────────────────
ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on share_cards"
  ON public.share_cards FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own share cards
CREATE POLICY "Users read own share_cards"
  ON public.share_cards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own share cards
CREATE POLICY "Users insert own share_cards"
  ON public.share_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access for active, non-expired cards by public_uuid
-- (Needed for share preview pages accessed by anonymous users)
CREATE POLICY "Public read active share cards by uuid"
  ON public.share_cards FOR SELECT
  USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ── updated_at trigger ────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_share_cards_updated_at ON public.share_cards;
CREATE TRIGGER trg_share_cards_updated_at
  BEFORE UPDATE ON public.share_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- MIGRATION: 20260611_create_org_intelligence_tables.sql
-- ============================================================
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


-- ============================================================
-- MIGRATION: 20260615_create_audit_logs.sql
-- ============================================================
-- Audit logs table for tracking platform activity
-- Created: 2026-06-15

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- e.g. 'score_created', 'contact_updated', 'company_created', 'mandate_status_change'
  entity_type TEXT NOT NULL,     -- e.g. 'contact', 'company', 'mandate', 'candidate_pipeline'
  entity_id UUID,
  details JSONB DEFAULT '{}',   -- Flexible payload for what changed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Auto-trigger: log contact updates
CREATE OR REPLACE FUNCTION fn_audit_contacts() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, details)
  VALUES (
    CASE WHEN TG_OP = 'INSERT' THEN 'contact_created' ELSE 'contact_updated' END,
    'contact',
    NEW.id,
    jsonb_build_object('name', NEW.name, 'title', NEW.current_title, 'source', NEW.source)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_contacts ON contacts;
CREATE TRIGGER trg_audit_contacts
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_audit_contacts();

-- Auto-trigger: log scoring runs
CREATE OR REPLACE FUNCTION fn_audit_scoring() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, details)
  VALUES (
    'score_created',
    'scoring_run',
    NEW.id,
    jsonb_build_object('run_type', NEW.run_type, 'composite', NEW.composite_score, 'verdict', NEW.verdict)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_scoring ON scoring_runs;
CREATE TRIGGER trg_audit_scoring
  AFTER INSERT ON scoring_runs
  FOR EACH ROW EXECUTE FUNCTION fn_audit_scoring();

-- Auto-trigger: log mandate status changes
CREATE OR REPLACE FUNCTION fn_audit_mandates() RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS NULL OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (action, entity_type, entity_id, details)
    VALUES (
      CASE WHEN TG_OP = 'INSERT' THEN 'mandate_created' ELSE 'mandate_status_change' END,
      'mandate',
      NEW.id,
      jsonb_build_object('title', NEW.title, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_mandates ON mandates;
CREATE TRIGGER trg_audit_mandates
  AFTER INSERT OR UPDATE ON mandates
  FOR EACH ROW EXECUTE FUNCTION fn_audit_mandates();

-- RLS: admin-only read
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read audit_logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);


-- ============================================================
-- MIGRATION: 20260622_advisory_workshops.sql
-- ============================================================
-- Phase 3.4: Advisory Assessment Engine
-- Workshop and participant management tables

CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('PRISM', 'FORGE', 'SPARK', 'BRIDGE', 'MOSAIC')),
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  scheduled_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  max_participants integer DEFAULT 15,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'launched', 'completed', 'cancelled')),
  allow_report_download boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'completed')),
  responses jsonb,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES workshop_participants(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  dimension_scores jsonb,
  archetype text,
  style text,
  strengths text[],
  development_areas text[],
  recommendations text[],
  raw_analysis text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workshops_org ON workshops(organization_id);
CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop ON workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_token ON workshop_participants(token);
CREATE INDEX IF NOT EXISTS idx_workshop_scores_workshop ON workshop_scores(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_scores_participant ON workshop_scores(participant_id);

-- ============================================================
-- MIGRATION: 20260622_client_notifications.sql
-- ============================================================
-- Phase 3.2: Client Portal Notifications Table
-- Migration for client feedback and notification system

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'feedback_received', 'candidate_advanced', 'interview_scheduled', 'new_candidate_added', 'report_ready'
  title text NOT NULL,
  message text,
  link text, -- deep link to relevant page
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add client_feedback column to candidates_pipeline table for storing feedback
ALTER TABLE IF EXISTS candidates_pipeline
ADD COLUMN IF NOT EXISTS client_feedback jsonb;

-- Add index for client feedback queries
CREATE INDEX IF NOT EXISTS idx_pipeline_client_feedback ON candidates_pipeline((client_feedback->>'decision'));


-- ============================================================
-- MIGRATION: 20260622_create_outreach_attempts.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS outreach_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (
    channel IN (
      'cold_call',
      'wechat_add',
      'email',
      'linkedin_message',
      'phone_call',
      'in_person'
    )
  ),
  attempt_number int NOT NULL DEFAULT 1,
  attempt_date date NOT NULL DEFAULT CURRENT_DATE,
  outcome text CHECK (
    outcome IN (
      'no_response',
      'positive',
      'negative',
      'interested',
      'not_interested',
      'scheduled_interview',
      'referred_other',
      'invalid_contact'
    )
  ),
  response_text text,
  notes text,
  next_action text,
  next_action_date date,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_candidate ON outreach_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_outreach_mandate ON outreach_attempts(mandate_id);
CREATE INDEX IF NOT EXISTS idx_outreach_channel ON outreach_attempts(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_outcome ON outreach_attempts(outcome);
CREATE INDEX IF NOT EXISTS idx_outreach_next_action ON outreach_attempts(next_action_date)
  WHERE next_action_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_created_by ON outreach_attempts(created_by);
CREATE INDEX IF NOT EXISTS idx_outreach_date ON outreach_attempts(attempt_date);


-- ============================================================
-- MIGRATION: 20260622_create_success_profiles.sql
-- ============================================================
-- Phase 1.2: Success Profile Builder
-- Creates success_profiles table for defining candidate evaluation criteria

CREATE TABLE IF NOT EXISTS success_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  
  -- Experience requirements
  required_experience_years int,
  required_industries text[],
  required_geographies text[],
  required_companies text[],
  deal_size_range text,
  team_size_managed int,
  
  -- Personality / character (DISC-aligned)
  target_disc_profile text,
  personality_indicators jsonb,
  character_requirements jsonb,
  
  -- Background requirements
  education_requirements jsonb,
  certifications text[],
  language_requirements jsonb,
  
  -- Metadata
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  defined_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approval_notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_success_profiles_mandate ON success_profiles(mandate_id);
CREATE INDEX IF NOT EXISTS idx_success_profiles_status ON success_profiles(status);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS success_profiles_updated_at ON success_profiles;
CREATE TRIGGER success_profiles_updated_at
BEFORE UPDATE ON success_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- MIGRATION: 20260622_extend_target_companies_market_definition.sql
-- ============================================================
-- Phase 1.5: Market Definition Enhancement
-- Extend target_companies with mandate linkage, AI overviews, fit scores

-- Add mandate_id to link target companies to specific mandates
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL;

-- Add AI-generated company overview (JSONB)
-- Structure:
-- {
--   "description": "string",
--   "revenue": "string (e.g., '$1B-$5B')",
--   "employee_count": "string (e.g., '5,000-10,000')",
--   "founded": number,
--   "headquarters": "string",
--   "key_products": ["string"],
--   "recent_news": "string (summary)",
--   "generated_at": "timestamp"
-- }
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS company_overview jsonb;

-- Add fit score based on success profile (0-100)
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS fit_score numeric;

-- Add ranking notes for manual adjustments
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS ranking_notes text;

-- Add sector classification for market map grouping
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS sector text;

-- Add region classification for market map grouping
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS region text;

-- Add primary contact at company
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_name text;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_title text;
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS primary_contact_linkedin text;

-- Add generation status for tracking AI overview generation
ALTER TABLE target_companies ADD COLUMN IF NOT EXISTS overview_status text DEFAULT 'pending'
  CHECK (overview_status IN ('pending', 'generating', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_target_companies_mandate ON target_companies(mandate_id);
CREATE INDEX IF NOT EXISTS idx_target_companies_fit_score ON target_companies(fit_score) WHERE fit_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_sector ON target_companies(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_region ON target_companies(region) WHERE region IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_target_companies_industry ON target_companies(industry) WHERE industry IS NOT NULL;


-- ============================================================
-- MIGRATION: 20260622_interviews.sql
-- ============================================================
-- Phase 4.3: Interview Management Tables
-- Created: 2026-06-22

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id),
  mandate_id uuid REFERENCES mandates(id),
  
  -- Interview details
  round int NOT NULL CHECK (round BETWEEN 1 AND 5),
  interview_date timestamptz NOT NULL,
  duration_minutes int DEFAULT 60,
  location text, -- physical address or virtual link
  meeting_link text, -- Zoom/Teams/Meet URL
  
  -- Panel
  panel_members uuid[] REFERENCES profiles(id),
  
  -- Status
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  
  -- Feedback
  scorecards jsonb, -- [{panelist_id, competency_scores, overall_score, strengths, concerns, recommendation}]
  aggregate_feedback jsonb,
  notes text,
  
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_mandate ON interviews(mandate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Create interview_invitations table for tracking invites
CREATE TABLE IF NOT EXISTS interview_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES contacts(id),
  sent_at timestamptz,
  opened_at timestamptz,
  confirmed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'confirmed', 'declined')),
  email_subject text,
  email_body text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for interview invitations
CREATE INDEX IF NOT EXISTS idx_invitation_interview ON interview_invitations(interview_id);
CREATE INDEX IF NOT EXISTS idx_invitation_candidate ON interview_invitations(candidate_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to interviews table
DROP TRIGGER IF EXISTS interviews_updated_at ON interviews;
CREATE TRIGGER interviews_updated_at
BEFORE UPDATE ON interviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply trigger to interview_invitations table
DROP TRIGGER IF EXISTS invitations_updated_at ON interview_invitations;
CREATE TRIGGER invitations_updated_at
BEFORE UPDATE ON interview_invitations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Round to stage mapping view
CREATE OR REPLACE VIEW interview_stage_mapping AS
SELECT
  id,
  round,
  CASE
    WHEN round = 1 THEN 'interview_1'
    WHEN round = 2 THEN 'interview_2'
    WHEN round = 3 THEN 'interview_3'
    WHEN round >= 4 THEN 'final_interview'
  END AS next_stage,
  CASE
    WHEN round = 1 THEN 'Interview 1'
    WHEN round = 2 THEN 'Interview 2'
    WHEN round = 3 THEN 'Interview 3'
    WHEN round >= 4 THEN 'Final Interview'
  END AS round_label
FROM interviews;


-- ============================================================
-- MIGRATION: 20260622_mandate_solutions.sql
-- ============================================================
-- Phase 3.3: Solution Definition Module
-- Creates mandate_solutions table for HR business solutions

CREATE TABLE IF NOT EXISTS mandate_solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  solution_type text NOT NULL CHECK (solution_type IN (
    'succession', 'assessment', 'diagnostics', 'density', 'org_design', 'role_definition'
  )),
  solution_detail jsonb,
  linked_assessment_type text CHECK (linked_assessment_type IN (
    'prism', 'forge', 'spark', 'bridge', 'mosaic', 
    'shift_leap', 'shift_quest', 'shift_drive', 'shift_coach', 'shift_impact'
  )),
  linked_assessment_id uuid,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  defined_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approval_notes text,
  rejection_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandate_solutions_mandate ON mandate_solutions(mandate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_solutions_status ON mandate_solutions(status);
CREATE INDEX IF NOT EXISTS idx_mandate_solutions_type ON mandate_solutions(solution_type);


-- ============================================================
-- MIGRATION: 20260622_milestones.sql
-- ============================================================
-- Phase 4.4: Engagement Timeline Tracker (Methodology Step 8)
-- Add milestones JSONB column to mandates table

ALTER TABLE mandates ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN mandates.milestones IS 'JSONB object containing milestone definitions with target dates, actual dates, and status';

-- Create index for querying mandates with at-risk or overdue milestones
CREATE INDEX IF NOT EXISTS idx_mandates_has_milestones ON mandates ((milestones IS NOT NULL AND milestones != '{}'::jsonb));

-- milestones structure example:
-- {
--   "intake_complete": { "target_date": "2026-07-01", "actual_date": "2026-07-02", "status": "completed" },
--   "solution_defined": { "target_date": "2026-07-08", "actual_date": null, "status": "on_track" },
--   "jd_approved": { "target_date": "2026-07-15", "actual_date": null, "status": "pending" },
--   "market_defined": { "target_date": "2026-07-22", "actual_date": null, "status": "pending" },
--   "longlist_ready": { "target_date": "2026-08-05", "actual_date": null, "status": "pending" },
--   "shortlist_ready": { "target_date": "2026-08-19", "actual_date": null, "status": "pending" },
--   "client_presentation": { "target_date": "2026-08-26", "actual_date": null, "status": "pending" },
--   "first_interview": { "target_date": "2026-09-09", "actual_date": null, "status": "pending" },
--   "offer_extended": { "target_date": "2026-09-30", "actual_date": null, "status": "pending" },
--   "placement": { "target_date": "2026-10-14", "actual_date": null, "status": "pending" }
-- }

-- Milestone statuses:
-- pending, on_track, at_risk, overdue, completed, completed_late

-- Helper function to get milestone status
CREATE OR REPLACE FUNCTION get_milestone_status(
  target_date timestamptz,
  actual_date timestamptz,
  check_date timestamptz DEFAULT now()
) RETURNS text AS $$
DECLARE
  days_until_due integer;
BEGIN
  -- If completed, check if on time or late
  IF actual_date IS NOT NULL THEN
    IF actual_date <= target_date THEN
      RETURN 'completed';
    ELSE
      RETURN 'completed_late';
    END IF;
  END IF;

  -- Calculate days until due
  days_until_due := (target_date::date - check_date::date);

  IF days_until_due < 0 THEN
    RETURN 'overdue';
  ELSIF days_until_due <= 7 THEN
    RETURN 'at_risk';
  ELSE
    RETURN 'on_track';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to initialize milestones with default SLA targets
CREATE OR REPLACE FUNCTION initialize_milestones(mandate_created_at timestamptz) RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}'::jsonb;
BEGIN
  result := jsonb_build_object(
    'intake_complete', jsonb_build_object(
      'target_date', (mandate_created_at + interval '7 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'solution_defined', jsonb_build_object(
      'target_date', (mandate_created_at + interval '14 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'jd_approved', jsonb_build_object(
      'target_date', (mandate_created_at + interval '21 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'market_defined', jsonb_build_object(
      'target_date', (mandate_created_at + interval '28 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'longlist_ready', jsonb_build_object(
      'target_date', (mandate_created_at + interval '42 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'shortlist_ready', jsonb_build_object(
      'target_date', (mandate_created_at + interval '56 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'client_presentation', jsonb_build_object(
      'target_date', (mandate_created_at + interval '63 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'first_interview', jsonb_build_object(
      'target_date', (mandate_created_at + interval '77 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'offer_extended', jsonb_build_object(
      'target_date', (mandate_created_at + interval '98 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'placement', jsonb_build_object(
      'target_date', (mandate_created_at + interval '112 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for mandates with computed milestone statuses
CREATE OR REPLACE VIEW mandate_milestone_status AS
SELECT
  m.id,
  m.title,
  m.status as mandate_status,
  m.created_at,
  m.milestones,
  -- Count of milestones by status
  (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each_text(
      COALESCE(m.milestones, '{}'::jsonb)::jsonb
    )
    WHERE key = 'status'
  ) as milestone_statuses,
  -- Check if any milestone is at_risk or overdue
  (
    SELECT bool_or(
      CASE
        WHEN (value->>'status') IN ('at_risk', 'overdue') THEN true
        ELSE false
      END
    )
    FROM jsonb_each_text(COALESCE(m.milestones, '{}'::jsonb))
  ) as has_at_risk_milestones
FROM mandates m;

-- Trigger to auto-initialize milestones on mandate creation
CREATE OR REPLACE FUNCTION set_default_milestones()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.milestones IS NULL OR NEW.milestones = '{}'::jsonb THEN
    NEW.milestones := initialize_milestones(NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment the following line to enable auto-initialization on mandate creation
-- CREATE TRIGGER tr_mandates_set_default_milestones
--   BEFORE INSERT OR UPDATE ON mandates
--   FOR EACH ROW
--   EXECUTE FUNCTION set_default_milestones();


-- ============================================================
-- MIGRATION: 20260622_ml_models.sql
-- ============================================================


-- ============================================================
-- MIGRATION: 20260622_offers.sql
-- ============================================================
-- Phase 4.5: Offer + Onboarding + Post-Placement
-- Create offers table for managing employment offers

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  
  -- Position details
  position_title text NOT NULL,
  start_date date NOT NULL,
  compensation jsonb, -- {base_salary, bonus, equity, benefits}
  conditions text, -- background check, references, etc.
  expiration_date date,
  
  -- Approval workflow
  status text DEFAULT 'draft' CHECK (status IN (
    'draft', 
    'pending_partner_approval', 
    'pending_client_approval', 
    'sent', 
    'accepted', 
    'rejected', 
    'withdrawn',
    'onboarding',
    'active',
    'probation',
    'completed'
  )),
  
  -- Approvals
  created_by uuid REFERENCES profiles(id),
  partner_approved_by uuid REFERENCES profiles(id),
  partner_approval_notes text,
  client_approved_by uuid, -- client user ID from client_users table
  client_approval_notes text,
  client_rejection_reason text,
  partner_rejection_reason text,
  
  -- Timing
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES profiles(id),
  
  -- Onboarding
  onboarding_checklist jsonb DEFAULT '[]'::jsonb, -- [{task, completed, completed_at, completed_by, notes}]
  onboarding_completed_at timestamptz,
  
  -- Post-placement follow-up
  follow_up_1m_sent boolean DEFAULT false,
  follow_up_1m_at timestamptz,
  follow_up_3m_sent boolean DEFAULT false,
  follow_up_3m_at timestamptz,
  follow_up_6m_sent boolean DEFAULT false,
  follow_up_6m_at timestamptz,
  follow_up_1m_response text,
  follow_up_3m_response text,
  follow_up_6m_response text,
  
  -- Probation
  probation_end_date date,
  probation_status text DEFAULT 'pending' CHECK (probation_status IN ('pending', 'passed', 'extended', 'failed')),
  probation_notes text,
  probation_extended_to date,
  
  -- Additional fields
  cover_letter text,
  additional_notes text,
  offer_letter_url text, -- URL to generated PDF offer letter
  
  -- Metadata
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_candidate ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_mandate ON offers(mandate_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_start_date ON offers(start_date);
CREATE INDEX IF NOT EXISTS idx_offers_probation_end ON offers(probation_end_date);
CREATE INDEX IF NOT EXISTS idx_offers_followup_1m ON offers(follow_up_1m_sent) WHERE follow_up_1m_sent = false;
CREATE INDEX IF NOT EXISTS idx_offers_followup_3m ON offers(follow_up_3m_sent) WHERE follow_up_3m_sent = false;
CREATE INDEX IF NOT EXISTS idx_offers_followup_6m ON offers(follow_up_6m_sent) WHERE follow_up_6m_sent = false;

-- Comments
COMMENT ON TABLE offers IS 'Employment offers with approval workflow, onboarding, and post-placement follow-up';
COMMENT ON COLUMN offers.compensation IS 'JSON: {base_salary, bonus, bonus_percentage, equity, benefits, total_compensation}';
COMMENT ON COLUMN offers.onboarding_checklist IS 'JSON array: [{task, category, completed, completed_at, completed_by, notes}]';
COMMENT ON COLUMN offers.status IS 'draft -> pending_partner_approval -> pending_client_approval -> sent -> accepted/rejected -> onboarding -> active -> probation -> completed';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to generate default onboarding checklist
CREATE OR REPLACE FUNCTION generate_onboarding_checklist()
RETURNS jsonb AS $$
BEGIN
  RETURN '[
    {
      "task": "Signed offer letter received",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    },
    {
      "task": "Background check initiated",
      "category": "verification",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 5
    },
    {
      "task": "References verified",
      "category": "verification",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "Employment contract signed",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "NDA signed",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "IT accounts created",
      "category": "setup",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Equipment delivered/setup",
      "category": "setup",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Welcome email sent",
      "category": "communication",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "First day agenda prepared",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Team introduction scheduled",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    },
    {
      "task": "Buddy/mentor assigned",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 5
    },
    {
      "task": "Orientation schedule confirmed",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    }
  ]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- View for offers with candidate and mandate info
CREATE OR REPLACE VIEW offers_with_details AS
SELECT 
  o.*,
  c.first_name as candidate_first_name,
  c.last_name as candidate_last_name,
  c.email as candidate_email,
  c.phone as candidate_phone,
  c.current_title as candidate_title,
  c.current_company as candidate_company,
  m.title as mandate_title,
  m.client_id,
  cl.company_name as client_name,
  cl.first_name as client_first_name,
  cl.last_name as client_last_name,
  p.name as created_by_name,
  p.email as created_by_email,
  pp.name as partner_approved_by_name,
  org.name as organization_name
FROM offers o
LEFT JOIN contacts c ON o.candidate_id = c.id
LEFT JOIN mandates m ON o.mandate_id = m.id
LEFT JOIN clients cl ON m.client_id = cl.id
LEFT JOIN profiles p ON o.created_by = p.id
LEFT JOIN profiles pp ON o.partner_approved_by = pp.id
LEFT JOIN organizations org ON o.organization_id = org.id;

-- View for onboarding task progress
CREATE OR REPLACE VIEW onboarding_progress AS
SELECT 
  o.id as offer_id,
  o.position_title,
  c.first_name || ' ' || c.last_name as candidate_name,
  o.start_date,
  o.onboarding_checklist,
  jsonb_array_length(o.onboarding_checklist) as total_tasks,
  jsonb_array_length(o.onboarding_checklist) - 
    jsonb_array_length(o.onboarding_checklist) as completed_tasks,
  ROUND(
    (jsonb_array_length(o.onboarding_checklist) - 
      jsonb_array_length(o.onboarding_checklist))::numeric / 
    NULLIF(jsonb_array_length(o.onboarding_checklist), 0) * 100
  , 0) as completion_percentage
FROM offers o
LEFT JOIN contacts c ON o.candidate_id = c.id;


-- ============================================================
-- MIGRATION: 20260623_alumni_tracking.sql
-- ============================================================
-- Phase 4.6: Post-Placement & Alumni Tracking
-- Alumni lifecycle management system

-- Alumni records (placed candidates)
CREATE TABLE IF NOT EXISTS alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES contacts(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  placement_mandate_id UUID NOT NULL REFERENCES mandates(id),
  placement_date DATE NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  guarantee_end_date DATE NOT NULL,
  guarantee_status TEXT DEFAULT 'active',
  alumni_status TEXT DEFAULT 'active',
  last_engagement_date DATE,
  engagement_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni engagement log
CREATE TABLE IF NOT EXISTS alumni_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  engagement_type TEXT NOT NULL,
  engagement_date TIMESTAMPTZ NOT NULL,
  initiated_by UUID REFERENCES profiles(id),
  summary TEXT,
  outcome TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarantee period tracking
CREATE TABLE IF NOT EXISTS guarantee_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  check_in_dates DATE[] NOT NULL,
  check_ins_completed JSONB DEFAULT '[]',
  fee_refund_pct NUMERIC(5,2),
  dispute_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni referrals
CREATE TABLE IF NOT EXISTS alumni_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES alumni(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  referred_candidate_id UUID REFERENCES contacts(id),
  referred_name TEXT NOT NULL,
  referred_email TEXT,
  referred_phone TEXT,
  mandate_id UUID REFERENCES mandates(id),
  referral_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'received',
  referral_source TEXT DEFAULT 'alumni',
  referral_fee_owed BOOLEAN DEFAULT false,
  referral_fee_amount NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-engagement campaigns
CREATE TABLE IF NOT EXISTS alumni_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  target_tags TEXT[] DEFAULT '{}',
  target_companies TEXT[] DEFAULT '{}',
  message_template TEXT NOT NULL,
  send_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alumni_org ON alumni(org_id);
CREATE INDEX IF NOT EXISTS idx_alumni_status ON alumni(alumni_status);
CREATE INDEX IF NOT EXISTS idx_alumni_guarantee ON alumni(guarantee_status) WHERE guarantee_status = 'active';
CREATE INDEX IF NOT EXISTS idx_alumni_engagements ON alumni_engagements(alumni_id, engagement_date DESC);
CREATE INDEX IF NOT EXISTS idx_guarantee_periods_active ON guarantee_periods(org_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_alumni_referrals ON alumni_referrals(alumni_id, referral_date DESC);

-- RLS policies
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_campaigns ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view org alumni" ON alumni
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create org alumni" ON alumni
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org alumni" ON alumni
  FOR UPDATE USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni engagements" ON alumni_engagements
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org guarantee periods" ON guarantee_periods
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni referrals" ON alumni_referrals
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org alumni campaigns" ON alumni_campaigns
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- MIGRATION: 20260623_approval_workflows.sql
-- ============================================================
-- Phase 3.11: Approval Workflows
-- 012_approval_workflows.sql

-- Approval workflow definitions
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  approval_type TEXT NOT NULL CHECK (approval_type IN (
    'candidate_submission',
    'fee_change',
    'offer_approval',
    'mandate_creation',
    'budget_exception',
    'data_export',
    'custom'
  )),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  steps JSONB NOT NULL,
  conditions JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON approval_workflows(org_id, approval_type);

-- Approval requests (instances)
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  approval_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  request_data JSONB NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'cancelled',
    'escalated'
  )),
  final_decision TEXT CHECK (final_decision IN ('approved', 'rejected')),
  final_comment TEXT,
  decided_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON approval_requests(org_id, status, current_step);
CREATE INDEX IF NOT EXISTS idx_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_requests_approver ON approval_requests(org_id, status) WHERE status IN ('pending', 'in_review');

-- Individual step approvals
CREATE TABLE IF NOT EXISTS approval_step_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  approver_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'delegated',
    'escalated'
  )),
  decision TEXT CHECK (decision IN ('approved', 'rejected')),
  comment TEXT,
  decided_at TIMESTAMPTZ,
  delegated_from UUID,
  delegated_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_steps_request ON approval_step_records(request_id, step_order);
CREATE INDEX IF NOT EXISTS idx_steps_pending ON approval_step_records(approver_id, status) WHERE status = 'pending';

-- Approval delegation rules
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  delegator_id UUID NOT NULL,
  delegate_id UUID NOT NULL,
  approval_type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_delegations_active ON approval_delegations(org_id, delegator_id, approval_type) WHERE is_active = true;

-- Approval audit log
CREATE TABLE IF NOT EXISTS approval_audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL,
  request_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_request ON approval_audit_log(request_id, created_at);

-- RLS
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_step_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_workflows" ON approval_workflows
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_requests" ON approval_requests
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_steps" ON approval_step_records
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_delegations" ON approval_delegations
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_audit" ON approval_audit_log
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Default approval workflows
INSERT INTO approval_workflows (org_id, name, approval_type, description, is_active, steps, conditions, created_by)
SELECT 
  o.id,
  'Candidate Submission Approval',
  'candidate_submission',
  'Default candidate submission approval workflow',
  true,
  '[{"step_order": 1, "approver_role": "partner", "approver_id": null, "escalation_hours": 24, "escalation_approver_role": "managing_partner", "is_parallel": false}]',
  '{}',
  o.owner_id
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO approval_workflows (org_id, name, approval_type, description, is_active, steps, conditions, created_by)
SELECT 
  o.id,
  'Offer Approval',
  'offer_approval',
  'Default offer letter approval workflow',
  true,
  '[{"step_order": 1, "approver_role": "partner", "approver_id": null, "escalation_hours": 24, "escalation_approver_role": "managing_partner", "is_parallel": false}]',
  '{}',
  o.owner_id
FROM organizations o
ON CONFLICT DO NOTHING;


-- ============================================================
-- MIGRATION: 20260623_background_checks.sql
-- ============================================================
-- Phase 7.4: Background Checks

CREATE TABLE IF NOT EXISTS background_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id),
  check_type text NOT NULL CHECK (check_type IN ('criminal', 'employment', 'education', 'credit', 'drug_screening', 'comprehensive')),
  provider text,
  order_date date,
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  result text CHECK (result IN ('clear', 'discrepancy', 'unresolved')),
  result_summary text,
  report_url text,
  ordered_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_background_checks_candidate ON background_checks(candidate_id);
CREATE INDEX IF NOT EXISTS idx_background_checks_status ON background_checks(status);

ALTER TABLE background_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org background checks" ON background_checks
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create background checks" ON background_checks
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update background checks" ON background_checks
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- MIGRATION: 20260623_bd_pipeline.sql
-- ============================================================
-- Phase 2.8: BD Pipeline (Business Development)
-- Opportunities, activities, proposals, and metrics tables

-- BD opportunities (potential mandates)
CREATE TABLE IF NOT EXISTS bd_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Company info
  company_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'mid_market', 'enterprise', 'mnc')),
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,
  website TEXT,

  -- Contact
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  primary_contact_title TEXT,
  linkedin_url TEXT,

  -- Opportunity
  stage TEXT NOT NULL DEFAULT 'prospect'
    CHECK (stage IN ('prospect', 'qualified', 'proposal_sent', 'pitch_delivered', 'negotiate', 'signed', 'lost', 'deferred')),
  opportunity_type TEXT CHECK (opportunity_type IN ('retained', 'contingent', 'exclusive', 'non_exclusive')),
  estimated_roles INTEGER DEFAULT 1,
  estimated_fee_total NUMERIC,
  estimated_fee_currency TEXT NOT NULL DEFAULT 'CNY',
  fee_structure TEXT CHECK (fee_structure IN ('percentage', 'fixed', 'retainer_plus_success')),

  -- Ownership
  owner_id UUID NOT NULL,
  team_members UUID[] DEFAULT '{}',

  -- Source
  source TEXT CHECK (source IN ('referral', 'networking', 'inbound', 'cold_outreach', 'repeat_client')),
  source_detail TEXT,

  -- Timeline
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  proposal_sent_at TIMESTAMPTZ,
  pitch_delivered_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  deferred_until DATE,

  -- Outcome
  lost_reason TEXT CHECK (lost_reason IN ('budget', 'timing', 'competitor', 'internal', 'no_response')),
  competitor_firm TEXT,
  notes TEXT,

  -- Link to mandate (when signed)
  mandate_id UUID
);

CREATE INDEX IF NOT EXISTS idx_bd_org_stage ON bd_opportunities(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_bd_owner ON bd_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_bd_company ON bd_opportunities(company_name);
CREATE INDEX IF NOT EXISTS idx_bd_deferred ON bd_opportunities(deferred_until)
  WHERE stage = 'deferred';

-- BD activities (interactions with prospects)
CREATE TABLE IF NOT EXISTS bd_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'lunch', 'networking_event',
    'proposal_sent', 'follow_up', 'note', 'stage_change'
  )),
  description TEXT NOT NULL,
  outcome TEXT,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Linked entities
  contact_id UUID,
  related_document_id UUID
);

CREATE INDEX IF NOT EXISTS idx_bd_activities_opp ON bd_activities(opportunity_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bd_activities_owner ON bd_activities(performed_by, performed_at DESC);

-- BD proposals (documents sent to prospects)
CREATE TABLE IF NOT EXISTS bd_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  opportunity_id UUID NOT NULL REFERENCES bd_opportunities(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'superseded')),

  -- Fee details
  fee_structure TEXT,
  fee_amount NUMERIC,
  fee_currency TEXT NOT NULL DEFAULT 'CNY',
  payment_terms TEXT,
  guarantee_period_months INTEGER DEFAULT 3,

  -- Scope
  role_count INTEGER DEFAULT 1,
  scope_description TEXT,
  timeline_weeks INTEGER,

  -- Document
  document_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_opp ON bd_proposals(opportunity_id, version DESC);

-- BD pipeline metrics (computed weekly)
CREATE TABLE IF NOT EXISTS bd_pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Funnel counts
  new_prospects INTEGER NOT NULL DEFAULT 0,
  new_qualified INTEGER NOT NULL DEFAULT 0,
  proposals_sent INTEGER NOT NULL DEFAULT 0,
  pitches_delivered INTEGER NOT NULL DEFAULT 0,
  signed INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,

  -- Conversion rates
  prospect_to_qualified_pct NUMERIC,
  qualified_to_signed_pct NUMERIC,
  overall_win_rate_pct NUMERIC,

  -- Value
  total_pipeline_value NUMERIC,
  signed_value NUMERIC,
  avg_deal_size NUMERIC,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, period_start)
);

-- RLS
ALTER TABLE bd_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bd_pipeline_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_bd_opps" ON bd_opportunities
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_activities" ON bd_activities
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_proposals" ON bd_proposals
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_bd_metrics" ON bd_pipeline_metrics
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);


-- ============================================================
-- MIGRATION: 20260623_benchmark_assessment.sql
-- ============================================================
-- Phase 7.5: BENCHMARK Assessment

CREATE TABLE IF NOT EXISTS benchmark_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_type text NOT NULL CHECK (assessment_type IN ('SHIFT_LEAP', 'SHIFT_QUEST', 'SHIFT_DRIVE', 'SHIFT_COACH', 'SHIFT_IMPACT')),
  benchmark_scope text NOT NULL CHECK (benchmark_scope IN ('industry', 'function', 'seniority', 'custom')),
  industry_filter text[],
  function_filter text[],
  seniority_filter text[],
  team_member_ids uuid[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  results jsonb,
  peer_sample_size int,
  credits_charged int DEFAULT 15,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_benchmark_runs_org ON benchmark_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_status ON benchmark_runs(status);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_type ON benchmark_runs(assessment_type);

ALTER TABLE benchmark_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org benchmark runs" ON benchmark_runs
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create benchmark runs" ON benchmark_runs
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org benchmark runs" ON benchmark_runs
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================================
-- MIGRATION: 20260623_compensation_benchmarking.sql
-- ============================================================
-- Phase 3.8: Compensation Benchmarking Module
-- Benchmarks, data points, and survey imports tables

-- Compensation benchmarks (aggregated market data)
CREATE TABLE IF NOT EXISTS comp_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_title_pattern TEXT NOT NULL,
  industry TEXT,
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,
  level TEXT CHECK (level IN ('junior', 'mid', 'senior', 'executive')),
  currency TEXT NOT NULL DEFAULT 'CNY',

  -- Percentiles (annual total cash compensation)
  p10 NUMERIC,
  p25 NUMERIC,
  p50 NUMERIC,
  p75 NUMERIC,
  p90 NUMERIC,
  mean NUMERIC,

  -- Metadata
  sample_size INTEGER NOT NULL DEFAULT 0,
  data_sources TEXT[] NOT NULL DEFAULT '{}',
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON comp_benchmarks(
  job_title_pattern, industry, country, city
);
CREATE INDEX IF NOT EXISTS idx_benchmarks_org ON comp_benchmarks(org_id);

-- Raw compensation data points (from placements)
CREATE TABLE IF NOT EXISTS comp_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('placement', 'candidate_expectation', 'imported', 'survey')),
  source_id UUID,

  -- Role info
  job_title TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('startup', 'mid_market', 'enterprise', 'mnc')),
  country TEXT NOT NULL DEFAULT 'CN',
  city TEXT,

  -- Compensation
  currency TEXT NOT NULL DEFAULT 'CNY',
  base_salary_annual NUMERIC,
  bonus_target_pct NUMERIC,
  equity_value_annual NUMERIC,
  total_cash_annual NUMERIC,

  -- Candidate info (anonymized for privacy)
  experience_years INTEGER,
  education_level TEXT CHECK (education_level IN ('bachelor', 'master', 'phd', 'mba')),

  -- Timestamps
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_points_title ON comp_data_points(job_title, industry, country);
CREATE INDEX IF NOT EXISTS idx_data_points_org ON comp_data_points(org_id);
CREATE INDEX IF NOT EXISTS idx_data_points_date ON comp_data_points(data_date);

-- External survey imports
CREATE TABLE IF NOT EXISTS comp_survey_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  survey_name TEXT NOT NULL,
  survey_year INTEGER NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID,
  row_count INTEGER NOT NULL DEFAULT 0,
  file_path TEXT
);

-- RLS
ALTER TABLE comp_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_survey_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_benchmarks" ON comp_benchmarks
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_data_points" ON comp_data_points
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_surveys" ON comp_survey_imports
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);


-- ============================================================
-- MIGRATION: 20260623_kpi_metrics.sql
-- ============================================================
-- Phase 0.7: KPI Definitions & Success Metrics
-- kpi_values + kpi_alerts tables

-- KPI values store (computed metrics)
CREATE TABLE IF NOT EXISTS kpi_values (
  id BIGSERIAL PRIMARY KEY,
  kpi_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  value NUMERIC NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sample_size INTEGER NOT NULL DEFAULT 0,
  UNIQUE(kpi_id, org_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_kpi_values_org ON kpi_values(org_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi ON kpi_values(kpi_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_org_kpi ON kpi_values(org_id, kpi_id, period_start DESC);

ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_kpis" ON kpi_values
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- KPI alerts (threshold breaches)
CREATE TABLE IF NOT EXISTS kpi_alerts (
  id BIGSERIAL PRIMARY KEY,
  kpi_id TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  current_value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID
);

CREATE INDEX IF NOT EXISTS idx_kpi_alerts_active ON kpi_alerts(org_id, created_at DESC)
  WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kpi_alerts_org ON kpi_alerts(org_id, created_at DESC);

ALTER TABLE kpi_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_alerts" ON kpi_alerts
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_manage_alerts" ON kpi_alerts
  FOR UPDATE USING (org_id = current_setting('app.current_org_id', true)::UUID);


-- ============================================================
-- MIGRATION: 20260623_notification_foundation.sql
-- ============================================================
-- Phase 7.3: Notification Foundation Migration
-- Centralized notification system with preferences

-- Notifications table (create if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) UNIQUE,
  -- Per notification type preferences: 'email', 'in_app', 'both', 'none'
  feedback_received text DEFAULT 'both',
  candidate_advanced text DEFAULT 'in_app',
  interview_scheduled text DEFAULT 'both',
  new_candidate_added text DEFAULT 'in_app',
  report_ready text DEFAULT 'both',
  reference_submitted text DEFAULT 'both',
  offer_status_changed text DEFAULT 'both',
  milestone_at_risk text DEFAULT 'both',
  message_received text DEFAULT 'both',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Users can view their own preferences
CREATE POLICY "Users can view their preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- MIGRATION: 20260623_pipl_compliance.sql
-- ============================================================
-- Phase 5.7: PIPL Compliance (China Data Privacy)
-- Consent, residency, cross-border transfers, and data subject rights

-- Consent records (PIPL Articles 14-17)
CREATE TABLE IF NOT EXISTS data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  data_subject_type TEXT NOT NULL CHECK (data_subject_type IN ('candidate', 'client_contact', 'user')),
  data_subject_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN (
    'consent',
    'contract_performance',
    'legal_obligation',
    'public_interest',
    'legitimate_interest'
  )),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT NOT NULL,
  consent_version INTEGER NOT NULL DEFAULT 1,
  granted_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, data_subject_type, data_subject_id, purpose)
);

CREATE INDEX IF NOT EXISTS idx_consents_subject ON data_consents(data_subject_type, data_subject_id);
CREATE INDEX IF NOT EXISTS idx_consents_org ON data_consents(org_id);
CREATE INDEX IF NOT EXISTS idx_consents_expiring ON data_consents(expires_at)
  WHERE expires_at IS NOT NULL AND withdrawn_at IS NULL AND consent_given = true;

-- Data residency tags
CREATE TABLE IF NOT EXISTS data_residency_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'CN',
  is_china_resident BOOLEAN NOT NULL DEFAULT false,
  data_category TEXT NOT NULL DEFAULT 'standard'
    CHECK (data_category IN ('standard', 'sensitive', 'biometric', 'financial', 'minor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_residency_china ON data_residency_tags(is_china_resident)
  WHERE is_china_resident = true;
CREATE INDEX IF NOT EXISTS idx_residency_org ON data_residency_tags(org_id);

-- Cross-border transfer log
CREATE TABLE IF NOT EXISTS cross_border_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  transfer_type TEXT NOT NULL CHECK (transfer_type IN (
    'api_response',
    'backup_replication',
    'analytics_export',
    'manual_export'
  )),
  data_subject_count INTEGER NOT NULL,
  destination_country TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_org ON cross_border_transfers(org_id, created_at DESC);

-- Data subject rights requests (PIPL Chapter IV)
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',
    'correction',
    'deletion',
    'portability',
    'withdraw_consent'
  )),
  data_subject_type TEXT NOT NULL,
  data_subject_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  request_details JSONB,
  response_details JSONB,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_requests_pending ON data_subject_requests(org_id, status, due_at)
  WHERE status IN ('pending', 'in_progress');

-- RLS
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_residency_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_border_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_consents" ON data_consents
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "org_residency" ON data_residency_tags
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

CREATE POLICY "service_role_transfers" ON cross_border_transfers
  FOR ALL USING (false);

CREATE POLICY "org_requests" ON data_subject_requests
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);


-- ============================================================
-- MIGRATION: 20260623_question_library.sql
-- ============================================================
-- Phase 7.2: Question Library Migration
-- Pre-built question bank organized by competency and difficulty

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Question content
  question_text text NOT NULL,
  competency text NOT NULL CHECK (competency IN (
    'technical', 'leadership', 'communication', 'problem_solving',
    'teamwork', 'cultural_fit', 'strategic_thinking', 'adaptability',
    'decision_making', 'customer_focus', 'innovation', 'execution'
  )),
  difficulty int CHECK (difficulty BETWEEN 1 AND 3),
  expected_answer text,
  follow_up_question text,
  -- Metadata
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  starred_by uuid[] DEFAULT '{}',
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Question sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_competency ON questions(competency);
CREATE INDEX IF NOT EXISTS idx_questions_org ON questions(organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_system ON questions(is_system);
CREATE INDEX IF NOT EXISTS idx_questions_starred ON questions(starred_by);
CREATE INDEX IF NOT EXISTS idx_question_sets_org ON question_sets(organization_id);

-- RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

-- Users can view system questions and their org's questions
CREATE POLICY "Users can view accessible questions" ON questions
  FOR SELECT USING (
    is_system = true
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Users can create questions for their org
CREATE POLICY "Users can create questions" ON questions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own questions
CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Users can delete their own questions
CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Question sets policies
CREATE POLICY "Users can view accessible sets" ON question_sets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create sets" ON question_sets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sets" ON question_sets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own sets" ON question_sets
  FOR DELETE USING (created_by = auth.uid());

-- ============================================================
-- MIGRATION: 20260623_referee_system.sql
-- ============================================================
-- Phase 7.1: Referee System Migration
-- Reference checks without friction

-- Reference requests table
CREATE TABLE IF NOT EXISTS reference_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id),
  -- Referee details
  referee_name text NOT NULL,
  referee_email text NOT NULL,
  referee_title text,
  referee_company text,
  referee_relationship text,
  -- Access
  invite_token text UNIQUE NOT NULL,
  invite_url text,
  -- Status
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'reminded', 'submitted', 'expired', 'declined')),
  invited_at timestamptz DEFAULT now(),
  reminded_at timestamptz,
  submitted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Reference responses table
CREATE TABLE IF NOT EXISTS reference_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_request_id uuid REFERENCES reference_requests(id) ON DELETE CASCADE,
  -- Question + answer
  question_number int NOT NULL,
  question_text text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  response_text text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reference_requests_candidate ON reference_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_status ON reference_requests(status);
CREATE INDEX IF NOT EXISTS idx_reference_requests_token ON reference_requests(invite_token);
CREATE INDEX IF NOT EXISTS idx_reference_responses_request ON reference_responses(reference_request_id);

-- RLS policies
ALTER TABLE reference_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_responses ENABLE ROW LEVEL SECURITY;

-- Consultant/org can view all references for their candidates
CREATE POLICY "Consultants can view reference requests" ON reference_requests
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Referees can view/update their own request (via token)
CREATE POLICY "Referee can view own request" ON reference_requests
  FOR SELECT USING (true);

CREATE POLICY "Referee can update own request" ON reference_requests
  FOR UPDATE USING (true);

-- Responses follow request permissions
CREATE POLICY "Responses follow request access" ON reference_responses
  FOR ALL USING (
    reference_request_id IN (
      SELECT id FROM reference_requests
    )
  );


-- ============================================================
-- MIGRATION: 20260623_saved_searches.sql
-- ============================================================
-- Phase 2.7: Saved Searches & Talent Alerts

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  search_name TEXT NOT NULL,
  search_description TEXT,
  search_filters JSONB NOT NULL,
  alert_frequency TEXT DEFAULT 'daily',
  alert_threshold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  shared_with_team TEXT,
  last_executed_at TIMESTAMPTZ,
  last_match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Talent alert log
CREATE TABLE IF NOT EXISTS talent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  candidate_id UUID NOT NULL REFERENCES contacts(id),
  alert_type TEXT NOT NULL,
  match_score NUMERIC(5,2),
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared search subscriptions
CREATE TABLE IF NOT EXISTS saved_search_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  notification_preference TEXT DEFAULT 'inherit',
  UNIQUE(saved_search_id, user_id)
);

-- Search execution log
CREATE TABLE IF NOT EXISTS search_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  saved_search_id UUID REFERENCES saved_searches(id),
  search_filters JSONB NOT NULL,
  result_count INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_org ON saved_searches(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_talent_alerts_user ON talent_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_alerts_unviewed ON talent_alerts(user_id) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_search_executions_org ON search_executions(org_id, created_at DESC);

-- RLS policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_executions ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view their saved searches" ON saved_searches
  FOR SELECT USING (
    user_id = auth.uid() OR
    (is_shared = true AND org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create saved searches" ON saved_searches
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their saved searches" ON saved_searches
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can view their talent alerts" ON talent_alerts
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can view their subscriptions" ON saved_search_subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- ============================================================
-- MIGRATION: 20260623_sla_tracking.sql
-- ============================================================
-- Phase 3.12: Client SLA & Mandate Timeline Tracking
-- SLA monitoring system for mandate timelines

-- SLA configurations per organization
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_type TEXT NOT NULL,
  milestones JSONB NOT NULL,
  escalation_rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, mandate_type)
);

-- Per-mandate timeline instances
CREATE TABLE IF NOT EXISTS mandate_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  sla_config_id UUID NOT NULL REFERENCES sla_configurations(id),
  start_date TIMESTAMPTZ NOT NULL,
  current_stage TEXT NOT NULL,
  milestones JSONB NOT NULL,
  overall_progress_pct INTEGER DEFAULT 0,
  days_remaining INTEGER,
  health_status TEXT DEFAULT 'on_track',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA escalations
CREATE TABLE IF NOT EXISTS sla_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  timeline_id UUID NOT NULL REFERENCES mandate_timelines(id),
  escalation_type TEXT NOT NULL,
  milestone_stage TEXT NOT NULL,
  message TEXT NOT NULL,
  notified_roles TEXT[] NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical SLA performance
CREATE TABLE IF NOT EXISTS sla_performance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  mandate_id UUID REFERENCES mandates(id),
  mandate_type TEXT NOT NULL,
  total_duration_days INTEGER,
  stages_completed JSONB,
  sla_met BOOLEAN,
  breached_milestones TEXT[],
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mandate_timelines_org ON mandate_timelines(org_id);
CREATE INDEX IF NOT EXISTS idx_mandate_timelines_health ON mandate_timelines(health_status);
CREATE INDEX IF NOT EXISTS idx_sla_escalations_active ON sla_escalations(org_id) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sla_perf_org ON sla_performance_history(org_id, completed_at DESC);

-- RLS policies
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_performance_history ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view org SLA configs" ON sla_configurations
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create org SLA configs" ON sla_configurations
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update org SLA configs" ON sla_configurations
  FOR UPDATE USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org mandate timelines" ON mandate_timelines
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org escalations" ON sla_escalations
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view org SLA performance" ON sla_performance_history
  FOR SELECT USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Default SLA configurations
INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'executive_search',
  '[
    {"stage": "discovery", "target_days": 5, "warning_days": 2},
    {"stage": "shortlist", "target_days": 10, "warning_days": 3},
    {"stage": "interviews", "target_days": 14, "warning_days": 3},
    {"stage": "offer", "target_days": 7, "warning_days": 2},
    {"stage": "onboarding", "target_days": 14, "warning_days": 3}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant", "manager"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager", "director"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director", "partner"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'executive_search');

INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'retained',
  '[
    {"stage": "discovery", "target_days": 3, "warning_days": 1},
    {"stage": "shortlist", "target_days": 7, "warning_days": 2},
    {"stage": "interviews", "target_days": 10, "warning_days": 2},
    {"stage": "offer", "target_days": 5, "warning_days": 1},
    {"stage": "onboarding", "target_days": 10, "warning_days": 2}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant", "manager"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager", "director"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director", "partner"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'retained');

INSERT INTO sla_configurations (org_id, mandate_type, milestones, escalation_rules)
SELECT id, 'contingency',
  '[
    {"stage": "discovery", "target_days": 7, "warning_days": 3},
    {"stage": "shortlist", "target_days": 14, "warning_days": 4},
    {"stage": "interviews", "target_days": 21, "warning_days": 5},
    {"stage": "offer", "target_days": 10, "warning_days": 3},
    {"stage": "onboarding", "target_days": 14, "warning_days": 4}
  ]'::JSONB,
  '[
    {"threshold_pct": 80, "notify_roles": ["consultant"], "action": "warning"},
    {"threshold_pct": 95, "notify_roles": ["consultant", "manager"], "action": "critical"},
    {"threshold_pct": 100, "notify_roles": ["consultant", "manager", "director"], "action": "breach"}
  ]'::JSONB
FROM organizations WHERE NOT EXISTS (SELECT 1 FROM sla_configurations WHERE mandate_type = 'contingency');

-- ============================================================
-- MIGRATION: 20260623_workflow_automation.sql
-- ============================================================
-- Phase 3.10: Workflow Automation Rules Engine
-- 011_workflow_automation.sql

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'stage_change',
    'score_threshold',
    'time_elapsed',
    'status_change',
    'manual',
    'candidate_created',
    'mandate_created'
  )),
  trigger_config JSONB NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  condition_logic TEXT NOT NULL DEFAULT 'AND' CHECK (condition_logic IN ('AND', 'OR')),
  actions JSONB NOT NULL DEFAULT '[]',
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_org_active ON automation_rules(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rules_trigger ON automation_rules(trigger_type);

-- Rule execution log
CREATE TABLE IF NOT EXISTS rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  trigger_data JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  actions_executed JSONB,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_rule ON rule_executions(rule_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_entity ON rule_executions(entity_type, entity_id, executed_at DESC);

-- Scheduled rule checks (for time-based triggers)
CREATE TABLE IF NOT EXISTS rule_scheduled_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  check_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON rule_scheduled_checks(status, check_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_rule ON rule_scheduled_checks(rule_id, check_at DESC);

-- RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_scheduled_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_rules" ON automation_rules
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_executions" ON rule_executions
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_scheduled" ON rule_scheduled_checks
  FOR ALL USING (org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));


-- ============================================================
-- MIGRATION: 20260624_audit_logs_enhanced.sql
-- ============================================================
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
DROP POLICY IF EXISTS "org_admins_read_own_logs" ON audit_logs;
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


-- ============================================================
-- MIGRATION: 20260624_nexus_sync_contract.sql
-- ============================================================
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


-- ============================================================
-- MIGRATION: 20260625_create_missing_core_tables.sql
-- ============================================================
-- ── 20260625_create_missing_core_tables.sql ──────────────────────────────
-- Post-audit migration: 23 tables referenced in 787 backend handler locations
-- but never created in any prior migration.
--
-- Priority tiers based on reference count (high → low):
--   Tier 1 — Critical:   credits, mandates, companies, contacts, credit_transactions, organizations
--   Tier 2 — Core:       mandate_members, candidates_pipeline, scoring_runs, memories*, generated_reports,
--                         candidate_saved_insights, clients
--   Tier 3 — Scoring/AI: candidate_assessment_results, candidate_assessment_responses,
--                         assessment_configs, mandate_success_profiles, ai_generations, match_history
--   Tier 4 — Low usage:  alumni_placements, automation_executions, pipeline_stage_history
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

-- Tier 1 — Critical Tables
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
-- Tier 2 — Core Feature Tables
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
-- Tier 3 — Scoring / AI Tables
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

CREATE INDEX IF NOT EXISTS idx_car响_candidate_id    ON public.candidate_assessment_responses (candidate_id);
CREATE INDEX IF NOT EXISTS idx_car响_assessment_id   ON public.candidate_assessment_responses (assessment_id);

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
-- Tier 4 — Low Usage Tables
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
    RAISE NOTICE '✅ All 22 core tables created successfully';
  ELSE
    RAISE EXCEPTION '❌ Missing tables: %', v_missing;
  END IF;
END$$;



-- ============================================================
-- MIGRATION: 20260627_candidate_tracking.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260627_candidate_tracking.sql
-- DEX AI Candidate Tracking — T1 Schema Migration (Technical Blueprint 01)
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

-- Motivation Screening (GRID v2.0 — pre-contact gate)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS motivation_overall TEXT DEFAULT 'UNKNOWN'
  CHECK (motivation_overall IN ('GREEN', 'YELLOW', 'RED', 'UNKNOWN'));

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS motivation_assessment JSONB DEFAULT '{}'::jsonb;

-- Reachability Validation (GRID v2.0 — pre-contact gate)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_unknowns INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS contact_channel TEXT
  CHECK (contact_channel IN ('LINKEDIN', 'EMAIL', 'WECHAT', 'NONE', NULL));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reachability_details JSONB DEFAULT '{}'::jsonb;

-- Decline Tracking (GRID v2.0 — S8 specific)
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

-- ── 7. S2→S3 GATE VALIDATION FUNCTION (GRID v2.0) ───────────────────────
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
    RETURN QUERY SELECT false, 'Motivation is RED — do not contact', v_motivation, v_reach_unknowns;
    RETURN;
  END IF;

  IF v_motivation = 'UNKNOWN' THEN
    RETURN QUERY SELECT false, 'Motivation not yet assessed — complete motivation screening first', v_motivation, v_reach_unknowns;
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
      'Candidate status changed: ' || OLD.status || ' → ' || NEW.status,
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
    RAISE NOTICE '✅ Candidate Tracking migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ Candidate Tracking migration FAILED — missing: %', v_missing;
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

  RAISE NOTICE '✅ contacts table extensions verified';
END$$;

-- ============================================================
-- MIGRATION: 20260627_grid_market_mapping.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260627_grid_market_mapping.sql
-- DEX AI GRID Market Mapping — T2 Schema Migration (Technical Blueprint 02)
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
    RAISE NOTICE '✅ GRID Market Mapping migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ GRID Market Mapping migration FAILED — missing: %', v_missing;
  END IF;
END$$;

-- ============================================================
-- MIGRATION: 20260627_mandate_management.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260627_mandate_management.sql
-- DEX AI Mandate Management — T6 Schema Migration (Technical Blueprint 06)
-- Implements: Spec 06 (DEX-BS-006) + Technical Blueprint 06 (DEX-TB-006)
-- Phase lifecycle, payment milestones, analytics snapshots, handoff
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. MANDATES TABLE EXTENSIONS ───────────────────────────────────────
DO $$
BEGIN
  -- Phase lifecycle tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'phase') THEN
    ALTER TABLE public.mandates ADD COLUMN phase TEXT DEFAULT 'kickoff'
      CHECK (phase IN ('kickoff', 'sourcing', 'shortlisting', 'interview', 'offer', 'close', 'on_hold', 'cancelled', 'completed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'phase_entered_at') THEN
    ALTER TABLE public.mandates ADD COLUMN phase_entered_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'phase_history') THEN
    ALTER TABLE public.mandates ADD COLUMN phase_history JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Payment tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'fee_structure') THEN
    ALTER TABLE public.mandates ADD COLUMN fee_structure TEXT DEFAULT 'retainer_30_40_30';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'fee_amount') THEN
    ALTER TABLE public.mandates ADD COLUMN fee_amount NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'fee_currency') THEN
    ALTER TABLE public.mandates ADD COLUMN fee_currency TEXT DEFAULT 'CNY';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'payment_milestones') THEN
    ALTER TABLE public.mandates ADD COLUMN payment_milestones JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Consultant assignment
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'lead_consultant_id') THEN
    ALTER TABLE public.mandates ADD COLUMN lead_consultant_id UUID REFERENCES public.auth_users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'executive_sponsor_id') THEN
    ALTER TABLE public.mandates ADD COLUMN executive_sponsor_id UUID REFERENCES public.auth_users(id);
  END IF;

  -- Handoff
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'handoff_notes') THEN
    ALTER TABLE public.mandates ADD COLUMN handoff_notes JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'previous_consultant_id') THEN
    ALTER TABLE public.mandates ADD COLUMN previous_consultant_id UUID REFERENCES public.auth_users(id);
  END IF;

  -- GRID reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'current_grid_mapping_id') THEN
    ALTER TABLE public.mandates ADD COLUMN current_grid_mapping_id UUID REFERENCES public.grid_mappings(id);
  END IF;

  -- Actual close date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'actual_close_date') THEN
    ALTER TABLE public.mandates ADD COLUMN actual_close_date TIMESTAMPTZ;
  END IF;

  -- Target close date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mandates' AND column_name = 'target_close_date') THEN
    ALTER TABLE public.mandates ADD COLUMN target_close_date DATE;
  END IF;

  RAISE NOTICE '✅ Mandate extensions applied';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Mandate extension error (may be already applied): %', SQLERRM;
END$$;

-- ── 2. ADD INDEXES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mandates_phase ON public.mandates(phase);
CREATE INDEX IF NOT EXISTS idx_mandates_consultant ON public.mandates(lead_consultant_id);
CREATE INDEX IF NOT EXISTS idx_mandates_status_phase ON public.mandates(status, phase);

-- ── 3. MANDATE PAYMENT MILESTONES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mandate_payment_milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id          UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  milestone_number    INTEGER NOT NULL CHECK (milestone_number IN (1, 2, 3)),
  percentage          NUMERIC NOT NULL,
  amount              NUMERIC NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'CNY',
  trigger_event       TEXT NOT NULL,
  trigger_description TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'due', 'invoiced', 'paid', 'overdue', 'waived')),
  due_date            DATE,
  expected_date       DATE,
  invoice_date        DATE,
  paid_date           DATE,
  paid_amount         NUMERIC,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mandate_id, milestone_number)
);

CREATE INDEX IF NOT EXISTS idx_payment_mandate ON public.mandate_payment_milestones(mandate_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON public.mandate_payment_milestones(status);
CREATE INDEX IF NOT EXISTS idx_payment_due_date ON public.mandate_payment_milestones(due_date);

ALTER TABLE public.mandate_payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view payment milestones"
  ON public.mandate_payment_milestones FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage payment milestones"
  ON public.mandate_payment_milestones FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

DROP TRIGGER IF EXISTS trg_payment_updated_at ON public.mandate_payment_milestones;
CREATE TRIGGER trg_payment_updated_at
  BEFORE UPDATE ON public.mandate_payment_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-set status to 'due' when trigger event occurs
CREATE OR REPLACE FUNCTION public.fn_payment_milestone_due()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    IF NEW.trigger_event = 'engagement_signed'
       AND EXISTS (SELECT 1 FROM mandates WHERE id = NEW.mandate_id AND phase != 'kickoff') THEN
      NEW.status := 'due';
      NEW.due_date := CURRENT_DATE + INTERVAL '7 days';
    ELSIF NEW.trigger_event = 'shortlist_presented'
       AND EXISTS (SELECT 1 FROM candidate_mandate_links WHERE mandate_id = NEW.mandate_id AND status IN ('shortlisted', 'presented')) THEN
      NEW.status := 'due';
      NEW.due_date := CURRENT_DATE + INTERVAL '14 days';
    ELSIF NEW.trigger_event = 'candidate_started'
       AND EXISTS (SELECT 1 FROM candidate_mandate_links WHERE mandate_id = NEW.mandate_id AND status = 'placed') THEN
      NEW.status := 'due';
      NEW.due_date := CURRENT_DATE + INTERVAL '30 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_payment_milestone_due ON public.mandate_payment_milestones;
CREATE TRIGGER trg_payment_milestone_due
  BEFORE INSERT OR UPDATE ON public.mandate_payment_milestones
  FOR EACH ROW EXECUTE FUNCTION public.fn_payment_milestone_due();

-- ── 4. MANDATE ANALYTICS SNAPSHOTS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mandate_analytics_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  total_active_mandates     INTEGER,
  total_completed_mandates  INTEGER,
  total_cancelled_mandates  INTEGER,
  avg_time_to_fill          INTEGER,
  placement_rate            NUMERIC,
  avg_candidates_per_mandate NUMERIC,
  avg_pipeline_velocity     NUMERIC,
  avg_client_feedback_time  NUMERIC,
  total_fee_pipeline        NUMERIC,
  total_fee_collected       NUMERIC,
  phase_distribution        JSONB,
  consultant_workload       JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(snapshot_date)
);

ALTER TABLE public.mandate_analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view analytics"
  ON public.mandate_analytics_snapshots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create snapshots"
  ON public.mandate_analytics_snapshots FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 5. COMPUTE MANDATE ANALYTICS ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_compute_mandate_analytics()
RETURNS VOID AS $$
DECLARE
  v_active INTEGER;
  v_completed INTEGER;
  v_cancelled INTEGER;
  v_placement_rate NUMERIC;
  v_avg_time NUMERIC;
  v_avg_candidates NUMERIC;
  v_avg_velocity NUMERIC;
  v_avg_feedback NUMERIC;
  v_total_pipeline NUMERIC;
  v_total_collected NUMERIC;
  v_phase_dist JSONB;
BEGIN
  SELECT COUNT(*) INTO v_active FROM mandates WHERE status = 'active';
  SELECT COUNT(*) INTO v_completed FROM mandates WHERE status = 'completed';
  SELECT COUNT(*) INTO v_cancelled FROM mandates WHERE status = 'cancelled';

  v_placement_rate := CASE
    WHEN (v_completed + v_cancelled) > 0
    THEN ROUND(v_completed::NUMERIC / (v_completed + v_cancelled) * 100, 1)
    ELSE 0
  END;

  -- Average time to fill
  SELECT AVG(EXTRACT(DAY FROM actual_close_date - created_at))::INTEGER INTO v_avg_time
  FROM mandates
  WHERE status = 'completed' AND actual_close_date IS NOT NULL;

  -- Average candidates per mandate
  SELECT COALESCE(AVG(candidate_count)::NUMERIC, 0) INTO v_avg_candidates
  FROM (
    SELECT mandate_id, COUNT(*) as candidate_count
    FROM candidate_mandate_links
    GROUP BY mandate_id
  ) sub;

  -- Pipeline velocity
  SELECT COALESCE(AVG(daily_rate)::NUMERIC, 0) INTO v_avg_velocity
  FROM (
    SELECT m.id, COUNT(cml.id)::NUMERIC / NULLIF(EXTRACT(DAY FROM MAX(cml.created_at) - MIN(cml.created_at)), 0) as daily_rate
    FROM mandates m
    JOIN candidate_mandate_links cml ON cml.mandate_id = m.id
    WHERE m.status IN ('active', 'completed')
    GROUP BY m.id
    HAVING EXTRACT(DAY FROM MAX(cml.created_at) - MIN(cml.created_at)) > 0
  ) sub;

  -- Revenue
  SELECT COALESCE(SUM(amount), 0) INTO v_total_pipeline
  FROM mandate_payment_milestones
  WHERE status IN ('pending', 'due', 'invoiced');

  SELECT COALESCE(SUM(paid_amount), 0) INTO v_total_collected
  FROM mandate_payment_milestones
  WHERE status = 'paid';

  -- Phase distribution
  SELECT jsonb_object_agg(phase, cnt)
  INTO v_phase_dist
  FROM (
    SELECT phase, COUNT(*) as cnt
    FROM mandates
    WHERE status = 'active'
    GROUP BY phase
  ) sub;

  INSERT INTO mandate_analytics_snapshots (
    snapshot_date,
    total_active_mandates,
    total_completed_mandates,
    total_cancelled_mandates,
    avg_time_to_fill,
    placement_rate,
    avg_candidates_per_mandate,
    avg_pipeline_velocity,
    avg_client_feedback_time,
    total_fee_pipeline,
    total_fee_collected,
    phase_distribution
  ) VALUES (
    CURRENT_DATE,
    v_active,
    v_completed,
    v_cancelled,
    v_avg_time,
    v_placement_rate,
    v_avg_candidates,
    v_avg_velocity,
    v_avg_feedback,
    v_total_pipeline,
    v_total_collected,
    v_phase_dist
  ) ON CONFLICT (snapshot_date) DO UPDATE SET
    total_active_mandates = v_active,
    total_completed_mandates = v_completed,
    total_cancelled_mandates = v_cancelled,
    avg_time_to_fill = v_avg_time,
    placement_rate = v_placement_rate,
    avg_candidates_per_mandate = v_avg_candidates,
    avg_pipeline_velocity = v_avg_velocity,
    avg_client_feedback_time = v_avg_feedback,
    total_fee_pipeline = v_total_pipeline,
    total_fee_collected = v_total_collected,
    phase_distribution = v_phase_dist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. PHASE AUTO-ADVANCE ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_check_phase_advance(p_mandate_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_current_phase TEXT;
  v_candidate_count INTEGER;
  v_screened_count INTEGER;
  v_shortlisted_count INTEGER;
  v_presented_count INTEGER;
  v_interview_count INTEGER;
  v_offer_count INTEGER;
  v_placed_count INTEGER;
  v_grid_exists BOOLEAN;
  v_canvas_count INTEGER;
BEGIN
  SELECT phase INTO v_current_phase FROM mandates WHERE id = p_mandate_id;

  SELECT COUNT(*) INTO v_candidate_count
  FROM candidate_mandate_links WHERE mandate_id = p_mandate_id;

  SELECT COUNT(*) INTO v_screened_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('screened', 'shortlisted', 'presented', 'interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_shortlisted_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('shortlisted', 'presented', 'interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_presented_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('presented', 'interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_interview_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('interview', 'offer', 'placed');

  SELECT COUNT(*) INTO v_offer_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status IN ('offer', 'placed');

  SELECT COUNT(*) INTO v_placed_count
  FROM candidate_mandate_links
  WHERE mandate_id = p_mandate_id
  AND status = 'placed';

  SELECT EXISTS(SELECT 1 FROM grid_mappings WHERE mandate_id = p_mandate_id) INTO v_grid_exists;

  SELECT COUNT(*) INTO v_canvas_count
  FROM canvas_profiles cp
  JOIN candidate_mandate_links cml ON cml.contact_id = cp.contact_id
  WHERE cml.mandate_id = p_mandate_id;

  IF v_current_phase = 'kickoff' AND v_grid_exists AND v_candidate_count >= 5 THEN
    RETURN 'sourcing';
  ELSIF v_current_phase = 'sourcing' AND v_shortlisted_count >= 3 AND v_canvas_count >= 1 THEN
    RETURN 'shortlisting';
  ELSIF v_current_phase = 'shortlisting' AND v_presented_count >= 1 THEN
    RETURN 'interview';
  ELSIF v_current_phase = 'interview' AND v_offer_count >= 1 THEN
    RETURN 'offer';
  ELSIF v_current_phase = 'offer' AND v_placed_count >= 1 THEN
    RETURN 'close';
  END IF;

  RETURN v_current_phase;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY[
    'mandate_payment_milestones',
    'mandate_analytics_snapshots'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ Mandate Management migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ Mandate Management migration FAILED — missing: %', v_missing;
  END IF;
END$$;

-- ============================================================
-- MIGRATION: 20260627_platform_foundation.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260627_platform_foundation.sql
-- DEX AI Platform Foundation — T1 Schema Migration
-- Implements: Spec 00 (DEX-BS-000) + Technical Blueprint 00 (DEX-TB-000)
-- Decisions: D-1 (orchestration IN MVP), D-2 (restricted RLS),
--            D-3 (all L2), D-5 (fully auto enrichment)
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. SIGNALS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL
                    CHECK (type IN (
                      'email','meeting','comment','assessment','status_change',
                      'feedback','upload','linkedin','outreach','grid_report',
                      'mandate_phase','enrichment_advance')),
  source          TEXT NOT NULL
                    CHECK (source IN (
                      'platform','linkedin','email','feishu','notion','agent','import')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id        UUID REFERENCES auth.users(id),
  agent_id        TEXT,  -- 'trident','canvas','grid','sweep','alessio'
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title           TEXT,
  content         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  insights        JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  action_status   TEXT NOT NULL DEFAULT 'none'
                    CHECK (action_status IN ('none','pending','acknowledged','resolved')),
  processed_by    TEXT,
  processed_at    TIMESTAMPTZ,
  raw_data        JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_signals_type ON public.signals (type);
CREATE INDEX IF NOT EXISTS idx_signals_contact ON public.signals (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_mandate ON public.signals (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_company ON public.signals (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_actor ON public.signals (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created ON public.signals (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_action ON public.signals (action_required, action_status)
  WHERE action_required = TRUE;

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- D-2: Restricted RLS
-- All authenticated users can write (INSERT)
CREATE POLICY "Authenticated users can create signals"
  ON public.signals FOR INSERT TO authenticated
  WITH CHECK (true);

-- Read: owner + team lead + Kevin (admin)
CREATE POLICY "Signal read — owner, team lead, or admin"
  ON public.signals FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'team_lead')
  );

-- Update/DELETE: service role only (system-managed)
CREATE POLICY "Service role full access on signals"
  ON public.signals FOR ALL
  USING (auth.role() = 'service_role');

-- ── 2. AGENT ACTIONS TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT NOT NULL,  -- 'trident','canvas','grid','sweep','alessio'
  action_type     TEXT NOT NULL
                    CHECK (action_type IN (
                      'score','narrate','map','research','notify','draft','enrich','parse')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  triggered_by    UUID REFERENCES auth.users(id),
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  mandate_id      UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  input_data      JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence      NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  -- D-3: all L2 — draft & queue
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','executed','rejected','failed')),
  reviewed_by     UUID REFERENCES auth.users(id),
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  executed_at     TIMESTAMPTZ,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_agent ON public.agent_actions (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON public.agent_actions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_contact ON public.agent_actions (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_actions_reviewer ON public.agent_actions (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

-- RLS: same as signals (restricted)
CREATE POLICY "Authenticated users can create agent actions"
  ON public.agent_actions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agent action read — actor, team lead, or admin"
  ON public.agent_actions FOR SELECT TO authenticated
  USING (
    triggered_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'team_lead')
  );

CREATE POLICY "Authenticated users can review agent actions"
  ON public.agent_actions FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','team_lead'))
  );

CREATE POLICY "Service role full access on agent_actions"
  ON public.agent_actions FOR ALL
  USING (auth.role() = 'service_role');

-- ── 3. CONTACTS TABLE EXTENSIONS ─────────────────────────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS trident_scores JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS canvas_profile JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS grid_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'raw'
  CHECK (enrichment_status IN ('raw','linkedin_parsed','scored','narrated','complete'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS signal_count INTEGER DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_signal_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contacts_enrichment ON public.contacts (enrichment_status);
CREATE INDEX IF NOT EXISTS idx_contacts_signal_count ON public.contacts (signal_count DESC);

-- ── 4. TRIGGER FUNCTIONS ─────────────────────────────────────────────

-- Auto-increment signal_count on contacts when signal is created
CREATE OR REPLACE FUNCTION public.fn_signal_after_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET signal_count = COALESCE(signal_count, 0) + 1,
        last_signal_at = NEW.created_at
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_signal_after_insert ON public.signals;
CREATE TRIGGER trg_signal_after_insert
  AFTER INSERT ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.fn_signal_after_insert();

-- Auto-advance enrichment status
CREATE OR REPLACE FUNCTION public.fn_auto_advance_enrichment(p_contact_id UUID)
RETURNS VOID AS $$
DECLARE
  v_current TEXT;
  v_has_linkedin BOOLEAN;
  v_has_trident BOOLEAN;
  v_has_canvas BOOLEAN;
BEGIN
  SELECT enrichment_status INTO v_current FROM contacts WHERE id = p_contact_id;
  IF v_current IS NULL THEN v_current := 'raw'; END IF;

  SELECT (linkedin_url IS NOT NULL OR EXISTS (
    SELECT 1 FROM signals WHERE contact_id = p_contact_id AND type = 'linkedin'
  )) INTO v_has_linkedin;

  SELECT (
    trident_composite IS NOT NULL
    OR (trident_scores IS NOT NULL AND trident_scores != '{}'::jsonb)
  ) INTO v_has_trident FROM contacts WHERE id = p_contact_id;

  SELECT (canvas_profile IS NOT NULL AND canvas_profile != '{}'::jsonb)
  INTO v_has_canvas FROM contacts WHERE id = p_contact_id;

  -- Advance: raw → linkedin_parsed
  IF v_current = 'raw' AND v_has_linkedin THEN
    UPDATE contacts SET enrichment_status = 'linkedin_parsed' WHERE id = p_contact_id;
    INSERT INTO signals (type, source, contact_id, title, metadata)
    VALUES (
      'enrichment_advance', 'platform', p_contact_id,
      'Enrichment: raw → linkedin_parsed',
      '{"from":"raw","to":"linkedin_parsed"}'::jsonb
    );
    v_current := 'linkedin_parsed';
  END IF;

  -- Advance: linkedin_parsed → scored
  IF v_current = 'linkedin_parsed' AND v_has_trident THEN
    UPDATE contacts SET enrichment_status = 'scored' WHERE id = p_contact_id;
    INSERT INTO signals (type, source, contact_id, title, metadata)
    VALUES (
      'enrichment_advance', 'platform', p_contact_id,
      'Enrichment: linkedin_parsed → scored',
      '{"from":"linkedin_parsed","to":"scored"}'::jsonb
    );
    v_current := 'scored';
  END IF;

  -- Advance: scored → narrated
  IF v_current = 'scored' AND v_has_canvas THEN
    UPDATE contacts SET enrichment_status = 'narrated' WHERE id = p_contact_id;
    INSERT INTO signals (type, source, contact_id, title, metadata)
    VALUES (
      'enrichment_advance', 'platform', p_contact_id,
      'Enrichment: scored → narrated',
      '{"from":"scored","to":"narrated"}'::jsonb
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY['signals', 'agent_actions']) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE 'Platform Foundation migration OK — signals + agent_actions present';
  ELSE
    RAISE EXCEPTION 'Platform Foundation migration FAILED — missing: %', v_missing;
  END IF;

  -- Verify contacts columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'enrichment_status'
  ) THEN
    RAISE EXCEPTION 'contacts.enrichment_status column missing';
  END IF;

  RAISE NOTICE 'contacts table extensions verified';
END$$;


-- ============================================================
-- MIGRATION: 20260629_ai_matching_engine.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260629_ai_matching_engine.sql
-- DEX AI Matching Engine — T8 Schema Migration
-- Implements: Technical Blueprint 08 (DEX-TB-008)
-- Candidate-mandate matching with TRIDENT, pipeline, and heuristic scoring
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CANDIDATE_MANDATE_MATCHES TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidate_mandate_matches (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                  UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id                  UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  match_score                 NUMERIC(5,2) NOT NULL DEFAULT 0
                              CHECK (match_score >= 0 AND match_score <= 100),
  match_grade                 TEXT NOT NULL DEFAULT 'MISMATCH'
                              CHECK (match_grade IN (
                                'EXCEPTIONAL', 'STRONG', 'MODERATE', 'WEAK', 'MISMATCH'
                              )),
  -- Component scores
  trident_component           NUMERIC(5,2) DEFAULT 0,
  pipeline_component          NUMERIC(5,2) DEFAULT 0,
  heuristic_component         NUMERIC(5,2) DEFAULT 0,
  -- TRIDENT data (cached at match time)
  trident_composite           NUMERIC(3,1),
  trident_verdict             TEXT,
  dimension_scores            JSONB DEFAULT '{}'::jsonb,
  -- Pipeline compatibility
  pipeline_compatibility      JSONB DEFAULT '{}'::jsonb,
  -- AI analysis (from DeepSeek)
  ai_analysis                 JSONB DEFAULT '{}'::jsonb,
  -- Metadata
  match_source                TEXT NOT NULL DEFAULT 'manual'
                              CHECK (match_source IN (
                                'manual', 'ai_sweep', 'ai_suggest', 'auto_refresh'
                              )),
  generated_at                TIMESTAMPTZ DEFAULT now(),
  generated_by                UUID REFERENCES auth.users(id),
  reviewed_by                 UUID REFERENCES auth.users(id),
  reviewed_at                 TIMESTAMPTZ,
  -- Staleness
  is_stale                    BOOLEAN DEFAULT FALSE,
  stale_reason                TEXT,
  -- Manual override
  override_score              NUMERIC(5,2),
  override_grade              TEXT CHECK (override_grade IN (
                                'EXCEPTIONAL', 'STRONG', 'MODERATE', 'WEAK', 'MISMATCH'
                              )),
  override_reason             TEXT,
  override_by                 UUID REFERENCES auth.users(id),
  UNIQUE(contact_id, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_cmm_mandate ON public.candidate_mandate_matches(mandate_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_cmm_contact ON public.candidate_mandate_matches(contact_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_cmm_grade ON public.candidate_mandate_matches(match_grade);
CREATE INDEX IF NOT EXISTS idx_cmm_stale ON public.candidate_mandate_matches(is_stale) WHERE is_stale = TRUE;
CREATE INDEX IF NOT EXISTS idx_cmm_mandate_grade ON public.candidate_mandate_matches(mandate_id, match_grade)
  WHERE match_grade IN ('EXCEPTIONAL', 'STRONG');

ALTER TABLE public.candidate_mandate_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view matches" ON public.candidate_mandate_matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can create matches" ON public.candidate_mandate_matches
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team can update matches" ON public.candidate_mandate_matches
  FOR UPDATE TO authenticated USING (true);

-- ── 2. MATCH_RUNS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_runs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id                  UUID REFERENCES public.mandates(id) ON DELETE CASCADE,
  contact_id                  UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  run_type                    TEXT NOT NULL
                              CHECK (run_type IN (
                                'mandate_match', 'candidate_match', 'sweep', 'auto_refresh'
                              )),
  triggered_by                UUID REFERENCES auth.users(id),
  started_at                  TIMESTAMPTZ DEFAULT now(),
  completed_at                TIMESTAMPTZ,
  candidates_evaluated        INTEGER DEFAULT 0,
  matches_found               INTEGER DEFAULT 0,
  exceptional_count           INTEGER DEFAULT 0,
  strong_count                INTEGER DEFAULT 0,
  status                      TEXT NOT NULL DEFAULT 'running'
                              CHECK (status IN (
                                'running', 'completed', 'failed', 'partial', 'cancelled'
                              )),
  error_message               TEXT,
  parameters                  JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mr_mandate ON public.match_runs(mandate_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_contact ON public.match_runs(contact_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_status ON public.match_runs(status);

ALTER TABLE public.match_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view match runs" ON public.match_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can create match runs" ON public.match_runs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team can update match runs" ON public.match_runs
  FOR UPDATE TO authenticated USING (true);

-- ── 3. COMPUTE_MATCH_SCORE() FUNCTION ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_match_score(
  p_contact_id UUID,
  p_mandate_id UUID
) RETURNS TABLE (
  match_score NUMERIC,
  match_grade TEXT,
  trident_component NUMERIC,
  pipeline_component NUMERIC,
  heuristic_component NUMERIC,
  dimension_scores JSONB,
  pipeline_compatibility JSONB
) AS $$
DECLARE
  v_trident_composite   NUMERIC;
  v_trident_verdict     TEXT;
  v_d1                  NUMERIC;
  v_d2                  NUMERIC;
  v_d3                  NUMERIC;
  v_pipeline_stage      TEXT;
  v_motivation          TEXT;
  v_reach_verified      BOOLEAN;
  v_reach_unknowns      INTEGER;
  v_industry            TEXT;
  v_location            TEXT;
  v_title               TEXT;
  v_years               NUMERIC;
  v_tier                TEXT;
  v_data_confidence     NUMERIC;
  v_mandate_industry    TEXT;
  v_mandate_location    TEXT;
  v_mandate_title       TEXT;
  -- Component scores
  v_trident_score       NUMERIC := 0;
  v_pipeline_score      NUMERIC := 50;
  v_heuristic_score     NUMERIC := 50;
  v_final_score         NUMERIC;
  v_grade               TEXT;
  v_dim_scores          JSONB := '{}'::jsonb;
  v_pipeline_compat     JSONB := '{}'::jsonb;
BEGIN
  -- Get TRIDENT data (most recent scorecard for this contact+mandate)
  SELECT tc.composite_score, tc.verdict, tc.d1_score, tc.d2_score, tc.d3_score
  INTO v_trident_composite, v_trident_verdict, v_d1, v_d2, v_d3
  FROM public.trident_scorecards tc
  WHERE tc.contact_id = p_contact_id
    AND tc.mandate_id = p_mandate_id
  ORDER BY tc.created_at DESC
  LIMIT 1;

  -- Get contact data
  SELECT pipeline_stage, motivation_overall, reachability_verified,
         reachability_unknowns, industry, city, current_title,
         years_of_experience, tier, data_confidence
  INTO v_pipeline_stage, v_motivation, v_reach_verified,
       v_reach_unknowns, v_industry, v_location, v_title,
       v_years, v_tier, v_data_confidence
  FROM public.contacts
  WHERE id = p_contact_id;

  -- Get mandate data
  SELECT industry, location, title
  INTO v_mandate_industry, v_mandate_location, v_mandate_title
  FROM public.mandates
  WHERE id = p_mandate_id;

  -- ═══════════════════════════════════════════════════
  -- COMPONENT 1: TRIDENT (60% weight)
  -- ═══════════════════════════════════════════════════
  IF v_trident_composite IS NOT NULL THEN
    v_trident_score := v_trident_composite * 10;
    v_dim_scores := jsonb_build_object(
      'd1', jsonb_build_object(
        'score', v_d1,
        'fit_notes', CASE
          WHEN v_d1 >= 7 THEN 'Strong capability fit'
          WHEN v_d1 >= 5 THEN 'Moderate capability fit'
          ELSE 'Weak capability fit'
        END
      ),
      'd2', jsonb_build_object(
        'score', v_d2,
        'fit_notes', CASE
          WHEN v_d2 >= 7 THEN 'Strong behavioral fit'
          WHEN v_d2 >= 5 THEN 'Moderate behavioral fit'
          ELSE 'Weak behavioral fit'
        END
      ),
      'd3', jsonb_build_object(
        'score', v_d3,
        'fit_notes', CASE
          WHEN v_d3 >= 7 THEN 'Strong cultural fit'
          WHEN v_d3 >= 5 THEN 'Moderate cultural fit'
          ELSE 'Weak cultural fit'
        END
      )
    );
  ELSE
    -- No TRIDENT score — use heuristic proxy
    v_trident_score := COALESCE(v_data_confidence, 0) * 0.5
      + CASE v_tier
          WHEN 'A' THEN 30
          WHEN 'B' THEN 20
          WHEN 'C' THEN 10
          ELSE 0
        END;
    v_trident_score := LEAST(v_trident_score, 70);
    v_dim_scores := jsonb_build_object(
      'd1', jsonb_build_object('score', null, 'fit_notes', 'No TRIDENT score — heuristic proxy used'),
      'd2', jsonb_build_object('score', null, 'fit_notes', 'No TRIDENT score — heuristic proxy used'),
      'd3', jsonb_build_object('score', null, 'fit_notes', 'No TRIDENT score — heuristic proxy used')
    );
  END IF;

  -- ═══════════════════════════════════════════════════
  -- COMPONENT 2: PIPELINE COMPATIBILITY (20% weight)
  -- ═══════════════════════════════════════════════════
  -- Stage compatibility
  IF v_pipeline_stage IN (
    'S2_Screened', 'S5_Responded', 'S6_WeChat_Added',
    'S7_Interested', 'S9_Call_Positive', 'S11_Internal_Interview'
  ) THEN
    v_pipeline_score := v_pipeline_score + 30;
  ELSIF v_pipeline_stage = 'S1_Sourced' THEN
    v_pipeline_score := v_pipeline_score + 10;
  ELSIF v_pipeline_stage IN (
    'S4_No_Response', 'S8_Not_Interested', 'S10_Call_Negative'
  ) THEN
    v_pipeline_score := v_pipeline_score - 30;
  ELSIF v_pipeline_stage IN (
    'S12_Presented_to_Client', 'S13_Client_Int_Scheduled',
    'S14_Client_Interviewed', 'S15_Client_2nd_Interview',
    'S16_Offer_Extended', 'S17_Offer_Accepted'
  ) THEN
    v_pipeline_score := v_pipeline_score + 20;
  END IF;

  -- Motivation
  IF v_motivation = 'GREEN' THEN
    v_pipeline_score := v_pipeline_score + 15;
  ELSIF v_motivation = 'YELLOW' THEN
    v_pipeline_score := v_pipeline_score + 5;
  ELSIF v_motivation = 'RED' THEN
    v_pipeline_score := v_pipeline_score - 20;
  END IF;

  -- Reachability
  IF v_reach_verified THEN
    v_pipeline_score := v_pipeline_score + 5;
  ELSIF COALESCE(v_reach_unknowns, 5) >= 2 THEN
    v_pipeline_score := v_pipeline_score - 10;
  END IF;

  v_pipeline_score := GREATEST(0, LEAST(100, v_pipeline_score));

  v_pipeline_compat := jsonb_build_object(
    'stage_compatible', v_pipeline_stage NOT IN (
      'S4_No_Response', 'S8_Not_Interested', 'S10_Call_Negative'
    ),
    'stage', v_pipeline_stage,
    'motivation_fit', v_motivation,
    'reachability_ok', v_reach_verified OR COALESCE(v_reach_unknowns, 5) <= 1,
    'available', v_pipeline_stage NOT IN (
      'S16_Offer_Extended', 'S17_Offer_Accepted', 'S19_Closed'
    ),
    'notes', CASE
      WHEN v_pipeline_stage IN ('S7_Interested', 'S9_Call_Positive')
        THEN 'Candidate is engaged and responsive'
      WHEN v_pipeline_stage = 'S1_Sourced'
        THEN 'Not yet contacted — needs initial screening'
      WHEN v_motivation = 'RED'
        THEN 'Motivation concern — DO NOT CONTACT'
      ELSE 'Standard availability'
    END
  );

  -- ═══════════════════════════════════════════════════
  -- COMPONENT 3: HEURISTIC FIT (20% weight)
  -- ═══════════════════════════════════════════════════
  -- Industry match
  IF v_industry IS NOT NULL AND v_mandate_industry IS NOT NULL
     AND LOWER(v_industry) = LOWER(v_mandate_industry) THEN
    v_heuristic_score := v_heuristic_score + 25;
  END IF;

  -- Location match
  IF v_location IS NOT NULL AND v_mandate_location IS NOT NULL THEN
    IF LOWER(v_location) = LOWER(v_mandate_location) THEN
      v_heuristic_score := v_heuristic_score + 20;
    ELSIF LOWER(v_location) LIKE '%' || LOWER(SPLIT_PART(v_mandate_location, ' ', 1)) || '%' THEN
      v_heuristic_score := v_heuristic_score + 10;
    END IF;
  END IF;

  -- Title/seniority match (simple keyword overlap)
  IF v_title IS NOT NULL AND v_mandate_title IS NOT NULL THEN
    IF LOWER(v_title) ILIKE '%' || LOWER(SPLIT_PART(v_mandate_title, ' ', 1)) || '%' THEN
      v_heuristic_score := v_heuristic_score + 15;
    END IF;
  END IF;

  -- Experience level
  IF v_years IS NOT NULL AND v_years >= 10 THEN
    v_heuristic_score := v_heuristic_score + 10;
  ELSIF v_years IS NOT NULL AND v_years < 5 THEN
    v_heuristic_score := v_heuristic_score - 10;
  END IF;

  v_heuristic_score := GREATEST(0, LEAST(100, v_heuristic_score));

  -- ═══════════════════════════════════════════════════
  -- FINAL WEIGHTED SCORE
  -- ═══════════════════════════════════════════════════
  v_final_score := ROUND(
    v_trident_score * 0.60
    + v_pipeline_score * 0.20
    + v_heuristic_score * 0.20,
    2
  );

  -- Determine grade
  v_grade := CASE
    WHEN v_final_score >= 85 THEN 'EXCEPTIONAL'
    WHEN v_final_score >= 70 THEN 'STRONG'
    WHEN v_final_score >= 50 THEN 'MODERATE'
    WHEN v_final_score >= 30 THEN 'WEAK'
    ELSE 'MISMATCH'
  END;

  RETURN QUERY SELECT
    v_final_score,
    v_grade,
    v_trident_score,
    v_pipeline_score,
    v_heuristic_score,
    v_dim_scores,
    v_pipeline_compat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. STALENESS TRIGGERS ──────────────────────────────────────────────

-- Contact update trigger
CREATE OR REPLACE FUNCTION public.fn_mark_matches_stale_on_contact_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage
     OR OLD.motivation_overall IS DISTINCT FROM NEW.motivation_overall
     OR OLD.reachability_verified IS DISTINCT FROM NEW.reachability_verified
     OR OLD.classification IS DISTINCT FROM NEW.classification THEN
    UPDATE public.candidate_mandate_matches
    SET is_stale = TRUE,
        stale_reason = 'Contact data changed: ' || CASE
          WHEN OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage
            THEN 'stage ' || OLD.pipeline_stage || '→' || NEW.pipeline_stage
          WHEN OLD.motivation_overall IS DISTINCT FROM NEW.motivation_overall
            THEN 'motivation ' || OLD.motivation_overall || '→' || NEW.motivation_overall
          ELSE 'profile updated'
        END
    WHERE contact_id = NEW.id
      AND is_stale = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_mark_matches_stale_contact ON public.contacts;
CREATE TRIGGER trg_mark_matches_stale_contact
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_mark_matches_stale_on_contact_update();

-- Scorecard update trigger
CREATE OR REPLACE FUNCTION public.fn_mark_matches_stale_on_scorecard()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.candidate_mandate_matches
  SET is_stale = TRUE,
      stale_reason = 'TRIDENT scorecard updated'
  WHERE contact_id = NEW.contact_id
    AND mandate_id = NEW.mandate_id
    AND is_stale = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_mark_matches_stale_scorecard ON public.trident_scorecards;
CREATE TRIGGER trg_mark_matches_stale_scorecard
  AFTER INSERT OR UPDATE ON public.trident_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_mark_matches_stale_on_scorecard();


-- ============================================================
-- MIGRATION: 20260629_canvas_profiles.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260629_canvas_profiles.sql
-- DEX AI CANVAS Executive Narrative Engine — T4 Schema Migration
-- Implements: Spec 04 (DEX-BS-004) + Technical Blueprint 04 (DEX-TB-004)
-- 6-dimensional behavioral scoring, AI-generated narratives, PDF export
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CANVAS PROFILES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.canvas_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id              UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id              UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  scorecard_id            UUID REFERENCES public.trident_scorecards(id) ON DELETE SET NULL,
  generated_by            UUID NOT NULL REFERENCES auth.users(id),
  trident_d1              NUMERIC(3,1),
  trident_d2              NUMERIC(3,1),
  trident_d3              NUMERIC(3,1),
  trident_composite       NUMERIC(3,1),
  trident_verdict         TEXT,
  c_strategic_thinking    NUMERIC(3,1) CHECK (c_strategic_thinking >= 1.0 AND c_strategic_thinking <= 10.0),
  c_communication         NUMERIC(3,1) CHECK (c_communication >= 1.0 AND c_communication <= 10.0),
  c_adaptability          NUMERIC(3,1) CHECK (c_adaptability >= 1.0 AND c_adaptability <= 10.0),
  c_team_leadership       NUMERIC(3,1) CHECK (c_team_leadership >= 1.0 AND c_team_leadership <= 10.0),
  c_decision_making       NUMERIC(3,1) CHECK (c_decision_making >= 1.0 AND c_decision_making <= 10.0),
  c_emotional_intelligence NUMERIC(3,1) CHECK (c_emotional_intelligence >= 1.0 AND c_emotional_intelligence <= 10.0),
  canvas_notes            JSONB NOT NULL DEFAULT '{}'::jsonb,
  canvas_composite        NUMERIC(3,1),
  canvas_grade            TEXT CHECK (canvas_grade IN ('A+', 'A', 'B', 'C', 'F')),
  leadership_style        TEXT,
  key_strengths           JSONB,
  blind_spots             JSONB,
  derailment_risks        JSONB,
  impact_potential        TEXT,
  stakeholder_style       TEXT,
  development_journey     TEXT,
  priority_focus_areas    JSONB,
  executive_summary       TEXT,
  pdf_url                 TEXT,
  pdf_generated_at        TIMESTAMPTZ,
  pdf_version             INTEGER DEFAULT 1,
  review_status           TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'edits_requested', 'edited')),
  reviewed_by             UUID REFERENCES auth.users(id),
  reviewed_at             TIMESTAMPTZ,
  review_notes            TEXT,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  credits_consumed        INTEGER NOT NULL DEFAULT 15
);

-- ── 2. INDEXES ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_canvas_contact ON public.canvas_profiles (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_mandate ON public.canvas_profiles (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_grade ON public.canvas_profiles (canvas_grade);
CREATE INDEX IF NOT EXISTS idx_canvas_review ON public.canvas_profiles (review_status) WHERE review_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_canvas_generated ON public.canvas_profiles (generated_by);
CREATE INDEX IF NOT EXISTS idx_canvas_scorecard ON public.canvas_profiles (scorecard_id);

-- ── 3. RLS POLICIES ────────────────────────────────────────────────────
ALTER TABLE public.canvas_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Canvas profile read — generator, mandate lead, or admin" ON public.canvas_profiles
  FOR SELECT TO authenticated
  USING (
    generated_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR mandate_id IN (SELECT id FROM public.mandates WHERE lead_consultant_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create canvas profiles" ON public.canvas_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "Canvas profile update — generator or admin" ON public.canvas_profiles
  FOR UPDATE TO authenticated
  USING (
    generated_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. CONTACTS TABLE EXTENSION ────────────────────────────────────────
ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS canvas_grade TEXT CHECK (canvas_grade IN ('A+', 'A', 'B', 'C', 'F', NULL));

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS canvas_generated_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS canvas_pdf_url TEXT;

-- ── 5. HELPER FUNCTION: COMPUTE CANVAS COMPOSITE ───────────────────────
CREATE OR REPLACE FUNCTION compute_canvas_composite(
  p_strategic NUMERIC,
  p_communication NUMERIC,
  p_adaptability NUMERIC,
  p_leadership NUMERIC,
  p_decision NUMERIC,
  p_eq NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_composite NUMERIC(3,1);
  v_grade TEXT;
BEGIN
  v_composite := ROUND(((p_strategic + p_communication + p_adaptability + p_leadership + p_decision + p_eq) / 6.0)::numeric, 1);
  
  v_grade := CASE
    WHEN v_composite >= 9.0 THEN 'A+'
    WHEN v_composite >= 8.0 THEN 'A'
    WHEN v_composite >= 7.0 THEN 'B'
    WHEN v_composite >= 6.0 THEN 'C'
    ELSE 'F'
  END;
  
  RETURN jsonb_build_object(
    'canvas_composite', v_composite,
    'canvas_grade', v_grade
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 6. HELPER FUNCTION: TRIDENT → CANVAS MAPPING ───────────────────────
CREATE OR REPLACE FUNCTION trident_to_canvas_suggest(p_scorecard_id UUID) RETURNS JSONB AS $$
DECLARE
  v_scorecard RECORD;
BEGIN
  SELECT * INTO v_scorecard FROM trident_scorecards WHERE id = p_scorecard_id;
  
  IF v_scorecard IS NULL THEN
    RETURN jsonb_build_object('error', 'Scorecard not found');
  END IF;
  
  RETURN jsonb_build_object(
    'strategic_thinking', v_scorecard.d1_score,
    'communication', v_scorecard.d2_score,
    'adaptability', v_scorecard.d3_score,
    'team_leadership', v_scorecard.d2_score,
    'decision_making', ROUND(((v_scorecard.d1_score + v_scorecard.d3_score) / 2.0)::numeric, 1),
    'emotional_intelligence', v_scorecard.d3_score,
    'mapping_notes', 'Pre-populated from TRIDENT. Consultant should adjust based on behavioral observations.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. TRIGGER FUNCTION: UPDATE CONTACTS QUICK REFERENCE ───────────────
CREATE OR REPLACE FUNCTION fn_update_contact_canvas() RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts
  SET canvas_grade = NEW.canvas_grade,
      canvas_generated_at = NEW.created_at,
      canvas_pdf_url = NEW.pdf_url
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_contact_canvas
AFTER INSERT OR UPDATE ON public.canvas_profiles
FOR EACH ROW EXECUTE FUNCTION fn_update_contact_canvas();


-- ============================================================
-- MIGRATION: 20260629_career_intelligence.sql
-- ============================================================
-- Technical Blueprint 12: Career Intelligence Agent
-- DEX-TB-012

-- ============================================
-- 2.1 Schema Extensions to contacts Table
-- ============================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS career_tier TEXT DEFAULT 'DORMANT' CHECK (career_tier IN ('ALPHA', 'BETA', 'GAMMA', 'DORMANT'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_engaged_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preference_model JSONB DEFAULT '{}'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_enrolled BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_stage TEXT DEFAULT NULL CHECK (nurture_stage IN ('WAITING', 'ENGAGED', 'RESPONDED', 'DECLINED_NURTURE', 'CONVERTED'));
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS nurture_next_touch TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS intelligence_subscriptions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS movement_signals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS career_benchmark JSONB DEFAULT '{}'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS agent_conversation_log JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_contacts_career_tier ON contacts(career_tier) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_contacts_nurture ON contacts(nurture_enrolled, nurture_next_touch) WHERE nurture_enrolled = true;
CREATE INDEX IF NOT EXISTS idx_contacts_engagement ON contacts(engagement_score DESC) WHERE is_archived = false;

-- ============================================
-- 2.2 Table: career_intelligence_log
-- ============================================

CREATE TABLE IF NOT EXISTS career_intelligence_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  intelligence_type TEXT NOT NULL CHECK (intelligence_type IN (
    'comp_benchmark',
    'career_trajectory',
    'skill_demand',
    'movement_intel',
    'company_signal',
    'market_timing',
    'nurture_touch',
    'check_in',
    'benchmark_offer',
    'general'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('wechat', 'wecom', 'feishu', 'email', 'platform')),
  content_summary TEXT,
  full_content JSONB,
  signals_captured JSONB DEFAULT '{}'::jsonb,
  engagement_impact TEXT CHECK (engagement_impact IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_RESPONSE')),
  consultant_id UUID REFERENCES auth.users(id),
  agent_model TEXT DEFAULT 'deepseek-chat',
  agent_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_log_contact ON career_intelligence_log(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_career_log_type ON career_intelligence_log(intelligence_type);
CREATE INDEX IF NOT EXISTS idx_career_log_direction ON career_intelligence_log(direction);
CREATE INDEX IF NOT EXISTS idx_career_log_consultant ON career_intelligence_log(consultant_id);
CREATE INDEX IF NOT EXISTS idx_career_log_date ON career_intelligence_log(created_at DESC);

ALTER TABLE career_intelligence_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view intelligence log" ON career_intelligence_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert intelligence log" ON career_intelligence_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "No updates to intelligence log" ON career_intelligence_log
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No deletes from intelligence log" ON career_intelligence_log
  FOR DELETE TO authenticated USING (false);

-- ============================================
-- 2.3 Table: nurture_sequences
-- ============================================

CREATE TABLE IF NOT EXISTS nurture_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN (
    'ALPHA_CAREER',
    'BETA_QUARTERLY',
    'GAMMA_SEMI_ANNUAL',
    'SIGNAL_REACTIVATION',
    'S8_NOT_INTERESTED',
    'S4_NO_RESPONSE'
  )),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  cadence_days INTEGER NOT NULL,
  next_touch_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CONVERTED', 'DECLINED')),
  intelligence_types JSONB DEFAULT '["comp_benchmark", "skill_demand"]'::jsonb,
  pause_reason TEXT,
  touch_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  last_touch_at TIMESTAMPTZ,
  last_response_at TIMESTAMPTZ,
  consultant_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_nurture_contact ON nurture_sequences(contact_id);
CREATE INDEX IF NOT EXISTS idx_nurture_next_touch ON nurture_sequences(next_touch_at) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_nurture_status ON nurture_sequences(status);
CREATE INDEX IF NOT EXISTS idx_nurture_type ON nurture_sequences(sequence_type);

ALTER TABLE nurture_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view nurture sequences" ON nurture_sequences
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage nurture sequences" ON nurture_sequences
  FOR ALL TO authenticated USING (true);

-- ============================================
-- 2.4 Table: career_benchmarks
-- ============================================

CREATE TABLE IF NOT EXISTS career_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  data_confidence NUMERIC CHECK (data_confidence >= 0 AND data_confidence <= 1),
  data_sources_used JSONB DEFAULT '[]'::jsonb,
  comp_percentile NUMERIC,
  comp_range_low NUMERIC,
  comp_range_high NUMERIC,
  comp_currency TEXT DEFAULT 'USD',
  comp_data_points INTEGER DEFAULT 0,
  trajectory_paths JSONB DEFAULT '[]'::jsonb,
  current_skills JSONB DEFAULT '[]'::jsonb,
  required_skills JSONB DEFAULT '[]'::jsonb,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  market_demand_score NUMERIC CHECK (market_demand_score >= 0 AND market_demand_score <= 100),
  active_mandates_matching INTEGER DEFAULT 0,
  demand_trend TEXT CHECK (demand_trend IN ('increasing', 'stable', 'decreasing')),
  narrative_summary TEXT,
  full_report JSONB,
  generated_by TEXT DEFAULT 'deepseek-chat',
  tokens_used INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES career_benchmarks(id)
);

CREATE INDEX IF NOT EXISTS idx_benchmark_contact ON career_benchmarks(contact_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmark_current ON career_benchmarks(contact_id) WHERE is_current = TRUE;

ALTER TABLE career_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view benchmarks" ON career_benchmarks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage benchmarks" ON career_benchmarks
  FOR ALL TO authenticated USING (true);

-- ============================================
-- 2.5 Table: movement_signal_definitions
-- ============================================

CREATE TABLE IF NOT EXISTS movement_signal_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'company_restructuring',
    'company_layoff',
    'company_merger',
    'company_expansion',
    'leadership_change',
    'competitor_hiring',
    'tenure_threshold',
    'contract_ending',
    'peer_movement',
    'linkedin_activity',
    'promotion_passed_over',
    'project_completion'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  detection_method TEXT NOT NULL CHECK (detection_method IN ('manual', 'automated', 'hybrid')),
  detection_rules JSONB DEFAULT '{}'::jsonb,
  auto_alert_consultant BOOLEAN DEFAULT FALSE,
  alert_threshold INTEGER DEFAULT 2,
  alert_window_days INTEGER DEFAULT 30,
  can_auto_enroll BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movement_signal_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages signal definitions" ON movement_signal_definitions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
  );
CREATE POLICY "Team can view signal definitions" ON movement_signal_definitions
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- Seed default signal definitions
INSERT INTO movement_signal_definitions (signal_type, severity, detection_method, auto_alert_consultant, alert_threshold, can_auto_enroll)
VALUES
  ('company_restructuring', 'high', 'hybrid', true, 1, true),
  ('company_layoff', 'critical', 'hybrid', true, 1, true),
  ('company_merger', 'high', 'hybrid', true, 1, false),
  ('company_expansion', 'medium', 'manual', false, 1, false),
  ('leadership_change', 'medium', 'manual', false, 1, false),
  ('competitor_hiring', 'low', 'manual', false, 2, false),
  ('tenure_threshold', 'low', 'automated', false, 1, true),
  ('contract_ending', 'medium', 'manual', true, 1, true),
  ('peer_movement', 'medium', 'automated', true, 2, true),
  ('linkedin_activity', 'low', 'manual', false, 1, false),
  ('promotion_passed_over', 'high', 'manual', true, 1, true),
  ('project_completion', 'low', 'manual', false, 1, false)
ON CONFLICT DO NOTHING;


-- ============================================================
-- MIGRATION: 20260629_client_intelligence.sql
-- ============================================================
-- Technical Blueprint 13: Client Intelligence Reports
-- DEX-TB-013

-- ============================================
-- 2.1 Table: client_intelligence_reports
-- ============================================

CREATE TABLE IF NOT EXISTS client_intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mandate_id UUID REFERENCES mandates(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'quarterly_landscape',
    'comp_snapshot',
    'talent_radar',
    'market_alert',
    'pre_mandate_assessment'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  executive_summary TEXT,
  overall_confidence TEXT CHECK (overall_confidence IN ('high', 'medium', 'low')),
  data_sources JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'generating',
    'under_review',
    'approved',
    'delivered',
    'archived'
  )),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  review_changes_made BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  delivery_channel TEXT CHECK (delivery_channel IN ('email', 'agent_message', 'portal', 'pdf')),
  opened_at TIMESTAMPTZ,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  period_start DATE,
  period_end DATE,
  generated_by TEXT DEFAULT 'deepseek-chat',
  tokens_used INTEGER DEFAULT 0,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_client ON client_intelligence_reports(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_type ON client_intelligence_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_status ON client_intelligence_reports(status);
CREATE INDEX IF NOT EXISTS idx_report_period ON client_intelligence_reports(period_start, period_end);

ALTER TABLE client_intelligence_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view all reports" ON client_intelligence_reports
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "Consultants manage assigned client reports" ON client_intelligence_reports
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR EXISTS (
      SELECT 1 FROM mandates
      WHERE lead_consultant_id = auth.uid()
      AND client_id = client_intelligence_reports.client_id
    )
  );

-- ============================================
-- 2.2 Table: client_market_subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS client_market_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN (
    'quarterly_landscape',
    'comp_monitor',
    'talent_radar',
    'market_alerts'
  )),
  industry_sectors JSONB DEFAULT '[]'::jsonb,
  job_functions JSONB DEFAULT '[]'::jsonb,
  geographies JSONB DEFAULT '[]'::jsonb,
  key_companies JSONB DEFAULT '[]'::jsonb,
  alert_thresholds JSONB DEFAULT '{}'::jsonb,
  delivery_preferences JSONB DEFAULT '{}'::jsonb,
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('premium', 'standard', 'basic')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, subscription_type)
);

CREATE INDEX IF NOT EXISTS idx_subscription_client ON client_market_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_active ON client_market_subscriptions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_subscription_type ON client_market_subscriptions(subscription_type);

ALTER TABLE client_market_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view subscriptions" ON client_market_subscriptions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "Admin/Consultant manages subscriptions" ON client_market_subscriptions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );

-- ============================================
-- 2.3 Table: market_signals
-- ============================================

CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'layoff',
    'restructuring',
    'merger',
    'comp_shift',
    'talent_movement',
    'regulation_change',
    'market_expansion',
    'market_contraction',
    'leadership_change',
    'company_expansion'
  )),
  source TEXT NOT NULL CHECK (source IN (
    'internal',
    'external_news',
    'candidate_conversation',
    'grid_update',
    'client_feedback',
    'manual'
  )),
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  affected_industries JSONB DEFAULT '[]'::jsonb,
  affected_geographies JSONB DEFAULT '[]'::jsonb,
  affected_companies JSONB DEFAULT '[]'::jsonb,
  affected_job_functions JSONB DEFAULT '[]'::jsonb,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence NUMERIC DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  client_relevance JSONB DEFAULT '{}'::jsonb,
  alerts_generated JSONB DEFAULT '[]'::jsonb,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_type ON market_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signal_severity ON market_signals(severity);
CREATE INDEX IF NOT EXISTS idx_signal_detected ON market_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_source ON market_signals(source);

ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view signals" ON market_signals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/Consultant creates signals" ON market_signals
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );

-- ============================================
-- 2.4 Table: anonymized_talent_profiles
-- ============================================

CREATE TABLE IF NOT EXISTS anonymized_talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  anonymized_label TEXT NOT NULL UNIQUE,
  industry TEXT,
  function_field TEXT,
  seniority_level TEXT CHECK (seniority_level IN (
    'director',
    'vp',
    'svp',
    'c_suite',
    'head_of',
    'manager',
    'individual_contributor'
  )),
  geography TEXT,
  years_experience INTEGER,
  key_skills JSONB DEFAULT '[]'::jsonb,
  trident_capability NUMERIC,
  trident_overall NUMERIC,
  career_tier TEXT,
  engagement_score INTEGER,
  movement_signal_count INTEGER DEFAULT 0,
  availability_assessment TEXT,
  first_anonymized_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  shown_to_clients JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_anon_label ON anonymized_talent_profiles(anonymized_label);
CREATE INDEX IF NOT EXISTS idx_anon_real_contact ON anonymized_talent_profiles(real_contact_id);
CREATE INDEX IF NOT EXISTS idx_anon_active ON anonymized_talent_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_anon_trident ON anonymized_talent_profiles(trident_overall DESC);

ALTER TABLE anonymized_talent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/Consultant can view anonymized profiles" ON anonymized_talent_profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "System manages anonymized profiles" ON anonymized_talent_profiles
  FOR ALL TO authenticated USING (true);

-- ============================================
-- 2.5 Table: intelligence_queries
-- ============================================

CREATE TABLE IF NOT EXISTS intelligence_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL CHECK (channel IN ('feishu', 'wechat', 'platform', 'email')),
  query_text TEXT NOT NULL,
  response_summary TEXT,
  response_full JSONB,
  report_generated UUID REFERENCES client_intelligence_reports(id),
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_client ON intelligence_queries(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_channel ON intelligence_queries(channel);

ALTER TABLE intelligence_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view queries" ON intelligence_queries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead', 'consultant'))
  );
CREATE POLICY "System inserts queries" ON intelligence_queries
  FOR INSERT TO authenticated WITH CHECK (true);


-- ============================================================
-- MIGRATION: 20260629_client_portal.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260629_client_portal.sql
-- DEX AI Client Visibility Portal — T5 Schema Migration
-- Implements: Spec 05 (DEX-BS-005) + Technical Blueprint 05 (DEX-TB-005)
-- Client accounts, mandate access, structured feedback, Kevin oversight
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CLIENT ACCOUNTS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  email                 TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  organization          TEXT NOT NULL,
  title                 TEXT,
  auth_user_id          UUID REFERENCES auth.users(id),
  role                  TEXT NOT NULL DEFAULT 'client_user' CHECK (role IN ('client_user', 'client_admin')),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  access_expires        TIMESTAMPTZ,
  last_login_at         TIMESTAMPTZ,
  notify_email          BOOLEAN NOT NULL DEFAULT TRUE,
  notify_in_app         BOOLEAN NOT NULL DEFAULT TRUE,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_client_accounts_email ON public.client_accounts (email);
CREATE INDEX IF NOT EXISTS idx_client_accounts_org ON public.client_accounts (organization);
CREATE INDEX IF NOT EXISTS idx_client_accounts_auth ON public.client_accounts (auth_user_id);

ALTER TABLE public.client_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client account read — self only" ON public.client_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin full access on client accounts" ON public.client_accounts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 2. CLIENT MANDATE ACCESS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_mandate_access (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id     UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id            UUID NOT NULL REFERENCES public.mandates(id) ON DELETE CASCADE,
  access_level          TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'feedback')),
  archive_until         TIMESTAMPTZ,
  UNIQUE(client_account_id, mandate_id)
);

CREATE INDEX IF NOT EXISTS idx_cma_client ON public.client_mandate_access (client_account_id);
CREATE INDEX IF NOT EXISTS idx_cma_mandate ON public.client_mandate_access (mandate_id);

ALTER TABLE public.client_mandate_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client mandate access — self or admin" ON public.client_mandate_access
  FOR SELECT TO authenticated
  USING (
    client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. CLIENT FEEDBACK TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id     UUID NOT NULL REFERENCES public.client_accounts(id),
  mandate_id            UUID NOT NULL REFERENCES public.mandates(id),
  contact_id            UUID NOT NULL REFERENCES public.contacts(id),
  feedback_type         TEXT NOT NULL CHECK (feedback_type IN ('interested', 'not_interested', 'need_more_info', 'hold')),
  reason                TEXT,
  additional_info       TEXT,
  status                TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'actioned', 'closed')),
  processed_by          UUID REFERENCES auth.users(id),
  processed_at          TIMESTAMPTZ,
  consultant_note       TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cf_mandate ON public.client_feedback (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cf_contact ON public.client_feedback (contact_id);
CREATE INDEX IF NOT EXISTS idx_cf_status ON public.client_feedback (status) WHERE status = 'new';
CREATE INDEX IF NOT EXISTS idx_cf_client ON public.client_feedback (client_account_id, created_at DESC);

ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client feedback read — self or admin or consultant" ON public.client_feedback
  FOR SELECT TO authenticated
  USING (
    client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR EXISTS (SELECT 1 FROM public.mandates WHERE id = mandate_id AND lead_consultant_id = auth.uid())
  );

CREATE POLICY "Client can create feedback" ON public.client_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    AND mandate_id IN (
      SELECT mandate_id FROM public.client_mandate_access
      WHERE client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Staff can update feedback" ON public.client_feedback
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR EXISTS (SELECT 1 FROM public.mandates WHERE id = mandate_id AND lead_consultant_id = auth.uid())
  );

-- ── 4. MANDATES TABLE EXTENSIONS ───────────────────────────────────────
ALTER TABLE IF EXISTS public.mandates
  ADD COLUMN IF NOT EXISTS client_visible BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.mandates
  ADD COLUMN IF NOT EXISTS client_summary TEXT;

ALTER TABLE IF EXISTS public.mandates
  ADD COLUMN IF NOT EXISTS target_close_date DATE;

-- ── 5. CONTACTS TABLE EXTENSIONS ───────────────────────────────────────
ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS client_presented BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS client_presented_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.contacts
  ADD COLUMN IF NOT EXISTS client_presented_by UUID REFERENCES auth.users(id);

-- ── 6. NOTIFICATIONS TABLE (client-facing) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_account_id     UUID NOT NULL REFERENCES public.client_accounts(id) ON DELETE CASCADE,
  mandate_id            UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  contact_id            UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type                  TEXT NOT NULL CHECK (type IN ('new_candidate', 'interview_scheduled', 'grid_report', 'status_change')),
  title                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  read                  BOOLEAN NOT NULL DEFAULT FALSE,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_cn_client ON public.client_notifications (client_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cn_unread ON public.client_notifications (client_account_id) WHERE read = FALSE;

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client notifications read — self only" ON public.client_notifications
  FOR SELECT TO authenticated
  USING (client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()));

CREATE POLICY "Client can mark notification as read" ON public.client_notifications
  FOR UPDATE TO authenticated
  USING (client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()))
  WITH CHECK (client_account_id IN (SELECT id FROM public.client_accounts WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin can create client notifications" ON public.client_notifications
  FOR INSERT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- ============================================================
-- MIGRATION: 20260629_dashboard_analytics.sql
-- ============================================================
-- =====================================================================
-- Technical Blueprint 11: Dashboard & Analytics (DEX-TB-011)
-- Database Migration
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 2.1 Table: analytics_snapshots
-- Pre-computed metrics stored as point-in-time snapshots
-- =====================================================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    snapshot_hour INTEGER,

    -- Scope
    scope_type TEXT NOT NULL CHECK (scope_type IN (
        'platform',
        'team',
        'individual',
        'mandate'
    )),
    scope_id UUID,

    -- Pipeline metrics
    pipeline_total INTEGER,
    pipeline_by_stage JSONB,
    new_candidates INTEGER,
    stage_advances INTEGER,
    stage_regressions INTEGER,

    -- Conversion metrics
    conversion_rates JSONB,

    -- Velocity metrics
    avg_days_per_stage JSONB,
    avg_pipeline_days NUMERIC,

    -- Activity metrics
    outreach_count INTEGER,
    emails_sent INTEGER,
    emails_received INTEGER,
    wechat_interactions INTEGER,
    calls_count INTEGER,

    -- Quality metrics
    avg_trident_score NUMERIC,
    trident_distribution JSONB,

    -- Mandate metrics (for mandate scope)
    mandate_candidates INTEGER,
    mandate_presented INTEGER,
    mandate_interviews INTEGER,
    mandate_offers INTEGER,
    mandate_days_in_phase INTEGER,

    -- Metadata
    computed_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(snapshot_date, snapshot_hour, scope_type, scope_id)
);

-- Indexes for analytics_snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_scope ON analytics_snapshots(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics_snapshots(snapshot_date DESC)
    WHERE scope_type = 'platform';

-- RLS for analytics_snapshots
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sees all snapshots" ON analytics_snapshots
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
        )
        OR scope_id = auth.uid()
    );

-- =====================================================================
-- 2.2 Table: dashboard_widgets_config
-- User-specific dashboard layout preferences
-- =====================================================================
CREATE TABLE IF NOT EXISTS dashboard_widgets_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dashboard_type TEXT NOT NULL CHECK (dashboard_type IN (
        'executive',
        'team_lead',
        'consultant'
    )),
    widget_key TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, widget_key)
);

-- Indexes for dashboard_widgets_config
CREATE INDEX IF NOT EXISTS idx_dash_user ON dashboard_widgets_config(user_id);

-- RLS for dashboard_widgets_config
ALTER TABLE dashboard_widgets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own widgets" ON dashboard_widgets_config
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- =====================================================================
-- 2.3 Table: kpis
-- Target/goal tracking for the team
-- =====================================================================
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'pipeline',
        'conversion',
        'velocity',
        'activity',
        'revenue',
        'quality'
    )),

    -- Target
    target_value NUMERIC NOT NULL,
    target_period TEXT DEFAULT 'monthly' CHECK (target_period IN (
        'daily',
        'weekly',
        'monthly',
        'quarterly'
    )),

    -- Scope
    applies_to TEXT DEFAULT 'platform' CHECK (applies_to IN (
        'platform',
        'team',
        'individual'
    )),
    scope_id UUID,

    -- Current tracking
    current_value NUMERIC DEFAULT 0,
    last_computed_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for kpis
CREATE INDEX IF NOT EXISTS idx_kpi_category ON kpis(category);
CREATE INDEX IF NOT EXISTS idx_kpi_active ON kpis(is_active) WHERE is_active = TRUE;

-- RLS for kpis
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manages KPIs" ON kpis
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Team can view KPIs" ON kpis
    FOR SELECT TO authenticated
    USING (is_active = TRUE);

-- =====================================================================
-- Seed: Default KPIs
-- =====================================================================
INSERT INTO kpis (name, description, category, target_value, target_period, applies_to, is_active)
VALUES
    ('Engagement Rate', 'Percentage of candidates that are actively engaged (S5+)', 'pipeline', 40, 'monthly', 'platform', TRUE),
    ('Advancement Rate', 'Percentage of candidates that reach interview stage (S11+)', 'conversion', 20, 'monthly', 'platform', TRUE),
    ('Placement Rate', 'Percentage of candidates that get placed (S19)', 'conversion', 5, 'quarterly', 'platform', TRUE),
    ('Daily Outreach', 'Average outreach actions per consultant per day', 'activity', 10, 'daily', 'individual', TRUE),
    ('Response Rate', 'Percentage of contacted candidates that respond (S5/S3)', 'conversion', 30, 'monthly', 'platform', TRUE),
    ('Source to Contact', 'Average days from S1 to S3', 'velocity', 3, 'monthly', 'platform', TRUE),
    ('Contact to Engaged', 'Average days from S3 to S7', 'velocity', 7, 'monthly', 'platform', TRUE),
    ('Offer to Close', 'Average days from S16 to S19', 'velocity', 14, 'quarterly', 'platform', TRUE),
    ('Revenue per Consultant', 'Average placement revenue per consultant', 'revenue', 100000, 'quarterly', 'individual', TRUE),
    ('Overdue Payment Rate', 'Percentage of payments that are overdue', 'revenue', 10, 'monthly', 'platform', TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================
-- MIGRATION: 20260629_linkedin_import_enrichment.sql
-- ============================================================
-- =====================================================================
-- Technical Blueprint 10: LinkedIn Auto-Import & Enrichment (DEX-TB-010)
-- Database Migration
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- 2.1 Table: linkedin_imports
-- Tracks each LinkedIn import session (single URL or batch)
-- =====================================================================
CREATE TABLE IF NOT EXISTS linkedin_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Import type
    import_type TEXT NOT NULL CHECK (import_type IN (
        'single_url',
        'batch_urls',
        'csv_file',
        'linkedin_recruiter_export',
        'sales_navigator_export',
        'copy_paste'
    )),

    -- Input
    input_urls TEXT[],
    input_file_url TEXT,
    input_raw_text TEXT,

    -- Processing state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'parsing',
        'deduplicating',
        'importing',
        'completed',
        'failed',
        'partial'
    )),

    -- Results
    total_input INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_duplicate_count INTEGER DEFAULT 0,
    skipped_error_count INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- DeepSeek usage
    deepseek_calls INTEGER DEFAULT 0,
    deepseek_tokens_used INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for linkedin_imports
CREATE INDEX IF NOT EXISTS idx_li_import_user ON linkedin_imports(created_by);
CREATE INDEX IF NOT EXISTS idx_li_import_status ON linkedin_imports(status);
CREATE INDEX IF NOT EXISTS idx_li_import_created ON linkedin_imports(created_at DESC);

-- RLS for linkedin_imports
ALTER TABLE linkedin_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports" ON linkedin_imports
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
        )
    );

CREATE POLICY "Users can create imports" ON linkedin_imports
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "System can update imports" ON linkedin_imports
    FOR UPDATE TO authenticated
    USING (true);

-- =====================================================================
-- 2.2 Table: linkedin_import_items
-- Per-profile import results
-- =====================================================================
CREATE TABLE IF NOT EXISTS linkedin_import_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID NOT NULL REFERENCES linkedin_imports(id) ON DELETE CASCADE,

    -- Input
    source_url TEXT,
    source_index INTEGER,
    raw_profile_data TEXT,

    -- Parsed output (DeepSeek)
    parsed_data JSONB DEFAULT '{}'::jsonb,

    -- Matching results
    matched_contact_id UUID REFERENCES contacts(id),
    match_type TEXT CHECK (match_type IN (
        'new',
        'exact_linkedin',
        'exact_email',
        'exact_phone',
        'fuzzy_name_company',
        'no_match'
    )),
    match_confidence NUMERIC,

    -- Import result
    action_taken TEXT CHECK (action_taken IN (
        'created',
        'updated',
        'skipped_duplicate',
        'skipped_error',
        'pending_review'
    )),
    created_contact_id UUID REFERENCES contacts(id),

    -- DeepSeek processing
    deepseek_processed BOOLEAN DEFAULT FALSE,
    deepseek_error TEXT,

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Indexes for linkedin_import_items
CREATE INDEX IF NOT EXISTS idx_li_item_import ON linkedin_import_items(import_id);
CREATE INDEX IF NOT EXISTS idx_li_item_contact ON linkedin_import_items(matched_contact_id)
    WHERE matched_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_li_item_action ON linkedin_import_items(action_taken);
CREATE INDEX IF NOT EXISTS idx_li_item_pending ON linkedin_import_items(deepseek_processed)
    WHERE deepseek_processed = FALSE;

-- RLS for linkedin_import_items
ALTER TABLE linkedin_import_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import items" ON linkedin_import_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM linkedin_imports
            WHERE id = import_id AND (
                created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
                )
            )
        )
    );

CREATE POLICY "System can manage import items" ON linkedin_import_items
    FOR ALL TO authenticated
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM linkedin_imports
            WHERE id = import_id AND created_by = auth.uid()
        )
    );

-- =====================================================================
-- 2.3 Table: linkedin_data_cache
-- Caches raw LinkedIn profile data to avoid re-fetching
-- =====================================================================
CREATE TABLE IF NOT EXISTS linkedin_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linkedin_url TEXT NOT NULL UNIQUE,
    raw_html TEXT,
    raw_text TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    fetched_by UUID REFERENCES auth.users(id),
    parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN (
        'pending',
        'parsing',
        'parsed',
        'error'
    )),
    parsed_data JSONB,
    parsed_at TIMESTAMPTZ,
    etag TEXT,
    fetch_count INTEGER DEFAULT 1,
    last_fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for linkedin_data_cache
CREATE INDEX IF NOT EXISTS idx_li_cache_url ON linkedin_data_cache(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_li_cache_parse ON linkedin_data_cache(parse_status)
    WHERE parse_status = 'pending';

-- RLS for linkedin_data_cache
ALTER TABLE linkedin_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages cache" ON linkedin_data_cache
    FOR ALL TO authenticated
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================================
-- 2.4 contacts Table — LinkedIn Extensions
-- =====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_url') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_url TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_headline') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_headline TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_company') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_company TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_industry') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_industry TEXT;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_skills') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_skills JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_education') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_education JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_experience') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_experience JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_languages') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_languages JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_certifications') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_certifications JSONB DEFAULT '[]'::jsonb;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'linkedin_raw_import_id') THEN
        ALTER TABLE contacts ADD COLUMN linkedin_raw_import_id UUID REFERENCES linkedin_import_items(id);
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'import_source') THEN
        ALTER TABLE contacts ADD COLUMN import_source TEXT DEFAULT 'manual' CHECK (import_source IN (
            'manual',
            'linkedin_url',
            'linkedin_csv',
            'linkedin_recruiter',
            'sales_navigator',
            'notion',
            'excel',
            'api'
        ));
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Indexes for LinkedIn fields on contacts
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_url ON contacts(linkedin_url)
    WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_import_source ON contacts(import_source);


-- ============================================================
-- MIGRATION: 20260629_rbac_notifications.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260629_rbac_notifications.sql
-- DEX AI RBAC & Notification System — T7 Schema Migration
-- Implements: Technical Blueprint 07 (DEX-TB-007)
-- Role-based access control, permission overrides, audit log,
-- notifications, notification preferences, email queue
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. ROLE PERMISSIONS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            TEXT NOT NULL CHECK (role IN ('admin', 'team_lead', 'consultant', 'client')),
  resource        TEXT NOT NULL CHECK (resource IN (
                    'contacts', 'mandates', 'signals', 'agent_actions',
                    'pipeline_transitions', 'client_accounts', 'client_feedback',
                    'import', 'saved_searches', 'grid_reports', 'trident_scorecards',
                    'canvas_profiles', 'match_results', 'notifications', 'rbac_settings'
                  )),
  action          TEXT NOT NULL CHECK (action IN (
                    'create', 'read_own', 'read_all', 'update_own', 'update_any',
                    'delete', 'export', 'review', 'approve', 'administer'
                  )),
  allowed         BOOLEAN NOT NULL DEFAULT FALSE,
  conditions      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON public.role_permissions(resource);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- ── 2. PERMISSION OVERRIDES TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permission_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource        TEXT NOT NULL,
  action          TEXT NOT NULL,
  allowed         BOOLEAN NOT NULL,
  reason          TEXT,
  granted_by      UUID NOT NULL REFERENCES auth.users(id),
  granted_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_perm_overrides_user ON public.permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_perm_overrides_active ON public.permission_overrides(is_active)
  WHERE is_active = TRUE;

ALTER TABLE public.permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage overrides" ON public.permission_overrides
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can read own overrides" ON public.permission_overrides
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. PERMISSION AUDIT LOG TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by      UUID NOT NULL REFERENCES auth.users(id),
  changed_at      TIMESTAMPTZ DEFAULT now(),
  change_type     TEXT NOT NULL CHECK (change_type IN (
                    'role_permission_update', 'override_create', 'override_update',
                    'override_delete', 'role_change'
                  )),
  target_role     TEXT,
  target_user_id  UUID REFERENCES auth.users(id),
  resource        TEXT,
  action          TEXT,
  previous_value  JSONB,
  new_value       JSONB,
  reason          TEXT
);

CREATE INDEX IF NOT EXISTS idx_perm_audit_by ON public.permission_audit_log(changed_by, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_perm_audit_target_user ON public.permission_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_perm_audit_change_type ON public.permission_audit_log(change_type);

ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON public.permission_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 4. NOTIFICATIONS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN (
                        'pipeline_stage_change', 'gate_blocked', 'trident_review_needed',
                        'canvas_review_needed', 'client_feedback_received', 'client_access_granted',
                        'mandate_phase_change', 'stale_candidate', 'match_available',
                        'import_complete', 'dedup_needed', 'permission_changed',
                        'assignment_changed', 'mention'
                      )),
  priority            TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title               TEXT NOT NULL,
  content             TEXT,
  resource_type       TEXT,
  resource_id         UUID,
  actor_id            UUID REFERENCES auth.users(id),
  read                BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  delivery_channels   JSONB NOT NULL DEFAULT '{"in_app": true, "email": false}'::jsonb,
  email_sent          BOOLEAN DEFAULT FALSE,
  email_sent_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  expires_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON public.notifications(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.notifications(recipient_id, created_at DESC)
  WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_type ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- ── 5. NOTIFICATION PREFERENCES TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type   TEXT NOT NULL,
  in_app_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── 6. EMAIL NOTIFICATION QUEUE TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_notification_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  to_address          TEXT NOT NULL,
  to_name             TEXT,
  subject             TEXT NOT NULL,
  html_body           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts            INTEGER DEFAULT 0,
  max_attempts        INTEGER DEFAULT 3,
  last_attempt_at     TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  sent_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_notification_queue(status, created_at);

ALTER TABLE public.email_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email queue" ON public.email_notification_queue
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 7. SEED DATA: DEFAULT PERMISSION MATRIX ────────────────────────────

-- ADMIN: full access to everything
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('admin', 'contacts', 'create', TRUE),
  ('admin', 'contacts', 'read_all', TRUE),
  ('admin', 'contacts', 'update_any', TRUE),
  ('admin', 'contacts', 'delete', TRUE),
  ('admin', 'contacts', 'export', TRUE),
  ('admin', 'mandates', 'create', TRUE),
  ('admin', 'mandates', 'read_all', TRUE),
  ('admin', 'mandates', 'update_any', TRUE),
  ('admin', 'mandates', 'delete', TRUE),
  ('admin', 'signals', 'create', TRUE),
  ('admin', 'signals', 'read_all', TRUE),
  ('admin', 'agent_actions', 'create', TRUE),
  ('admin', 'agent_actions', 'read_all', TRUE),
  ('admin', 'agent_actions', 'review', TRUE),
  ('admin', 'trident_scorecards', 'create', TRUE),
  ('admin', 'trident_scorecards', 'read_all', TRUE),
  ('admin', 'trident_scorecards', 'review', TRUE),
  ('admin', 'trident_scorecards', 'approve', TRUE),
  ('admin', 'canvas_profiles', 'create', TRUE),
  ('admin', 'canvas_profiles', 'read_all', TRUE),
  ('admin', 'canvas_profiles', 'update_any', TRUE),
  ('admin', 'canvas_profiles', 'export', TRUE),
  ('admin', 'canvas_profiles', 'review', TRUE),
  ('admin', 'client_accounts', 'create', TRUE),
  ('admin', 'client_accounts', 'read_all', TRUE),
  ('admin', 'client_accounts', 'update_any', TRUE),
  ('admin', 'client_accounts', 'delete', TRUE),
  ('admin', 'client_feedback', 'read_all', TRUE),
  ('admin', 'import', 'create', TRUE),
  ('admin', 'import', 'approve', TRUE),
  ('admin', 'grid_reports', 'create', TRUE),
  ('admin', 'grid_reports', 'read_all', TRUE),
  ('admin', 'grid_reports', 'export', TRUE),
  ('admin', 'match_results', 'read_all', TRUE),
  ('admin', 'match_results', 'create', TRUE),
  ('admin', 'rbac_settings', 'administer', TRUE),
  ('admin', 'notifications', 'read_all', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- TEAM_LEAD: read all, review agent actions, limited admin
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('team_lead', 'contacts', 'create', TRUE),
  ('team_lead', 'contacts', 'read_all', TRUE),
  ('team_lead', 'contacts', 'update_any', TRUE),
  ('team_lead', 'contacts', 'export', TRUE),
  ('team_lead', 'mandates', 'create', TRUE),
  ('team_lead', 'mandates', 'read_all', TRUE),
  ('team_lead', 'mandates', 'update_any', TRUE),
  ('team_lead', 'signals', 'create', TRUE),
  ('team_lead', 'signals', 'read_all', TRUE),
  ('team_lead', 'agent_actions', 'create', TRUE),
  ('team_lead', 'agent_actions', 'read_all', TRUE),
  ('team_lead', 'agent_actions', 'review', TRUE),
  ('team_lead', 'trident_scorecards', 'create', TRUE),
  ('team_lead', 'trident_scorecards', 'read_all', TRUE),
  ('team_lead', 'trident_scorecards', 'review', TRUE),
  ('team_lead', 'canvas_profiles', 'create', TRUE),
  ('team_lead', 'canvas_profiles', 'read_all', TRUE),
  ('team_lead', 'canvas_profiles', 'export', TRUE),
  ('team_lead', 'canvas_profiles', 'review', TRUE),
  ('team_lead', 'client_accounts', 'read_all', TRUE),
  ('team_lead', 'client_feedback', 'read_all', TRUE),
  ('team_lead', 'import', 'create', TRUE),
  ('team_lead', 'import', 'approve', TRUE),
  ('team_lead', 'grid_reports', 'create', TRUE),
  ('team_lead', 'grid_reports', 'read_all', TRUE),
  ('team_lead', 'grid_reports', 'export', TRUE),
  ('team_lead', 'match_results', 'read_all', TRUE),
  ('team_lead', 'match_results', 'create', TRUE),
  ('team_lead', 'notifications', 'read_all', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- CONSULTANT: own records + team read
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('consultant', 'contacts', 'create', TRUE),
  ('consultant', 'contacts', 'read_all', TRUE),
  ('consultant', 'contacts', 'update_own', TRUE),
  ('consultant', 'mandates', 'read_all', TRUE),
  ('consultant', 'signals', 'create', TRUE),
  ('consultant', 'signals', 'read_own', TRUE),
  ('consultant', 'agent_actions', 'create', TRUE),
  ('consultant', 'agent_actions', 'read_own', TRUE),
  ('consultant', 'trident_scorecards', 'create', TRUE),
  ('consultant', 'trident_scorecards', 'read_all', TRUE),
  ('consultant', 'canvas_profiles', 'create', TRUE),
  ('consultant', 'canvas_profiles', 'read_own', TRUE),
  ('consultant', 'canvas_profiles', 'export', TRUE),
  ('consultant', 'client_feedback', 'read_own', TRUE),
  ('consultant', 'import', 'create', TRUE),
  ('consultant', 'saved_searches', 'create', TRUE),
  ('consultant', 'saved_searches', 'read_own', TRUE),
  ('consultant', 'grid_reports', 'read_all', TRUE),
  ('consultant', 'match_results', 'read_own', TRUE),
  ('consultant', 'notifications', 'read_own', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- CLIENT: very restricted, only see assigned mandates and feedback
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('client', 'contacts', 'read_own', TRUE),
  ('client', 'mandates', 'read_own', TRUE),
  ('client', 'client_feedback', 'create', TRUE),
  ('client', 'client_feedback', 'read_own', TRUE),
  ('client', 'canvas_profiles', 'read_own', TRUE),
  ('client', 'notifications', 'read_own', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- ── 8. DEFAULT NOTIFICATION PREFERENCES (seed via function on user creation) ──
CREATE OR REPLACE FUNCTION seed_default_notification_prefs() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, notification_type, in_app_enabled, email_enabled)
  VALUES
    (NEW.id, 'pipeline_stage_change', TRUE, FALSE),
    (NEW.id, 'gate_blocked', TRUE, TRUE),
    (NEW.id, 'trident_review_needed', TRUE, TRUE),
    (NEW.id, 'canvas_review_needed', TRUE, FALSE),
    (NEW.id, 'client_feedback_received', TRUE, TRUE),
    (NEW.id, 'client_access_granted', TRUE, TRUE),
    (NEW.id, 'mandate_phase_change', TRUE, FALSE),
    (NEW.id, 'stale_candidate', TRUE, FALSE),
    (NEW.id, 'match_available', TRUE, FALSE),
    (NEW.id, 'import_complete', TRUE, FALSE),
    (NEW.id, 'dedup_needed', TRUE, FALSE),
    (NEW.id, 'permission_changed', TRUE, TRUE),
    (NEW.id, 'assignment_changed', TRUE, FALSE),
    (NEW.id, 'mention', TRUE, TRUE)
  ON CONFLICT (user_id, notification_type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (If profiles table exists, trigger would be added here)


-- ============================================================
-- MIGRATION: 20260629_trident_3d_scoring.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260629_trident_3d_scoring.sql
-- DEX AI TRIDENT 3D Scoring Engine — T3 Schema Migration (Technical Blueprint 03)
-- Implements: Spec 03 (DEX-BS-003) + Technical Blueprint 03 (DEX-TB-003)
-- 3D scoring (D1/D2/D3), pre-flight checks, SWEEP mode, Kevin review gate
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. TRIDENT SCORECARDS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trident_scorecards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_id          UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id          UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  scored_by           UUID NOT NULL REFERENCES auth.users(id),
  d1_score            NUMERIC(3,1) NOT NULL CHECK (d1_score >= 1.0 AND d1_score <= 10.0),
  d2_score            NUMERIC(3,1) NOT NULL CHECK (d2_score >= 1.0 AND d2_score <= 10.0),
  d3_score            NUMERIC(3,1) NOT NULL CHECK (d3_score >= 1.0 AND d3_score <= 10.0),
  d1_sub              JSONB NOT NULL DEFAULT '{}'::jsonb,
  d2_sub              JSONB NOT NULL DEFAULT '{}'::jsonb,
  d3_sub              JSONB NOT NULL DEFAULT '{}'::jsonb,
  d1_evidence         TEXT NOT NULL,
  d2_evidence         TEXT NOT NULL,
  d3_evidence         TEXT NOT NULL,
  d1_confidence       TEXT NOT NULL DEFAULT 'Medium' CHECK (d1_confidence IN ('High', 'Medium', 'Low')),
  d2_confidence       TEXT NOT NULL DEFAULT 'Medium' CHECK (d2_confidence IN ('High', 'Medium', 'Low')),
  d3_confidence       TEXT NOT NULL DEFAULT 'Medium' CHECK (d3_confidence IN ('High', 'Medium', 'Low')),
  composite_score     NUMERIC(3,1) NOT NULL,
  verdict             TEXT NOT NULL CHECK (verdict IN ('Exceptional Primary', 'Strong', 'Solid', 'Conditional', 'Not Recommended')),
  segment             TEXT NOT NULL CHECK (segment IN ('A', 'B', 'C')),
  recommendation      TEXT,
  preflight           JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_status       TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'adjusted', 'info_requested')),
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  review_notes        TEXT,
  original_d1         NUMERIC(3,1),
  original_d2         NUMERIC(3,1),
  original_d3         NUMERIC(3,1),
  original_composite  NUMERIC(3,1),
  credits_consumed    INTEGER NOT NULL DEFAULT 10,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  stale_flag          BOOLEAN NOT NULL DEFAULT FALSE,
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trident_contact ON public.trident_scorecards (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trident_mandate ON public.trident_scorecards (mandate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trident_verdict ON public.trident_scorecards (verdict);
CREATE INDEX IF NOT EXISTS idx_trident_segment ON public.trident_scorecards (segment);
CREATE INDEX IF NOT EXISTS idx_trident_review ON public.trident_scorecards (review_status) WHERE review_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_trident_composite ON public.trident_scorecards (composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_trident_scored_by ON public.trident_scorecards (scored_by);
CREATE INDEX IF NOT EXISTS idx_trident_stale ON public.trident_scorecards (stale_flag) WHERE stale_flag = TRUE;

ALTER TABLE public.trident_scorecards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trident scorecard read — scorer, mandate owner, or admin"
  ON public.trident_scorecards FOR SELECT TO authenticated
  USING (
    scored_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_lead'))
    OR mandate_id IN (SELECT id FROM mandates WHERE lead_consultant_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create scorecards"
  ON public.trident_scorecards FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = scored_by);

CREATE POLICY "Trident scorecard update — scorer or admin"
  ON public.trident_scorecards FOR UPDATE TO authenticated
  USING (
    scored_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS trg_trident_updated_at ON public.trident_scorecards;
CREATE TRIGGER trg_trident_updated_at
  BEFORE UPDATE ON public.trident_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. CONTACTS TABLE EXTENSION (quick reference) ─────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_composite') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_composite NUMERIC(3,1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_verdict') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_verdict TEXT CHECK (trident_verdict IN ('Exceptional Primary', 'Strong', 'Solid', 'Conditional', 'Not Recommended', NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_segment') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_segment TEXT CHECK (trident_segment IN ('A', 'B', 'C', NULL));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'trident_scored_at') THEN
    ALTER TABLE public.contacts ADD COLUMN trident_scored_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'data_confidence') THEN
    ALTER TABLE public.contacts ADD COLUMN data_confidence NUMERIC(3,2) DEFAULT 0.5;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Contact extension error: %', SQLERRM;
END$$;

-- ── 3. HELPER FUNCTION: COMPOSITE & VERDICT ──────────────────────────
CREATE OR REPLACE FUNCTION public.compute_trident_composite(
  p_d1 NUMERIC,
  p_d2 NUMERIC,
  p_d3 NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_composite NUMERIC(3,1);
  v_verdict TEXT;
  v_segment TEXT;
BEGIN
  v_composite := ROUND((p_d1 * 0.30 + p_d2 * 0.40 + p_d3 * 0.30)::numeric, 1);

  v_verdict := CASE
    WHEN v_composite >= 9.0 THEN 'Exceptional Primary'
    WHEN v_composite >= 8.0 THEN 'Strong'
    WHEN v_composite >= 7.0 THEN 'Solid'
    WHEN v_composite >= 6.0 THEN 'Conditional'
    ELSE 'Not Recommended'
  END;

  v_segment := CASE
    WHEN v_composite >= 8.0 THEN 'A'
    WHEN v_composite >= 6.5 THEN 'B'
    ELSE 'C'
  END;

  RETURN jsonb_build_object(
    'composite_score', v_composite,
    'verdict', v_verdict,
    'segment', v_segment
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── 4. HELPER FUNCTION: PRE-FLIGHT CHECKS ─────────────────────────────
CREATE OR REPLACE FUNCTION public.trident_preflight(
  p_contact_id UUID,
  p_mandate_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_contact RECORD;
  v_check_identity TEXT := 'PASS';
  v_check_jd TEXT := 'PASS';
  v_check_signal TEXT := 'PASS';
  v_check_readiness TEXT := 'PASS';
  v_check_compliance TEXT := 'PASS';
  v_data_confidence NUMERIC;
  v_flags TEXT[] := '{}';
  v_overall TEXT;
BEGIN
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;

  IF v_contact IS NULL THEN
    RETURN jsonb_build_object('overall', 'HALT', 'reason', 'Contact not found');
  END IF;

  -- Check 1: Identity Verification
  IF v_contact.full_name IS NULL OR v_contact.company_name IS NULL THEN
    v_check_identity := 'HALT';
    v_flags := v_flags || 'Missing name or company';
  ELSIF v_contact.linkedin_url IS NULL THEN
    v_check_identity := 'WARN';
    v_flags := v_flags || 'No LinkedIn URL for verification';
  END IF;

  -- Check 2: JD Alignment
  IF p_mandate_id IS NOT NULL THEN
    DECLARE v_mandate RECORD;
    BEGIN
      SELECT * INTO v_mandate FROM mandates WHERE id = p_mandate_id;
      IF v_mandate IS NULL THEN
        v_check_jd := 'HALT';
        v_flags := v_flags || 'Mandate not found';
      ELSIF v_mandate.job_description IS NULL OR v_mandate.job_description = '' THEN
        v_check_jd := 'HALT';
        v_flags := v_flags || 'No job description defined for mandate';
      ELSIF v_mandate.role_title IS NULL THEN
        v_check_jd := 'WARN';
        v_flags := v_flags || 'JD missing role title / seniority level';
      END IF;
    END;
  ELSE
    v_check_jd := 'WARN';
    v_flags := v_flags || 'No mandate linked — JD alignment not checked';
  END IF;

  -- Check 3: Signal Integrity (data confidence)
  v_data_confidence := COALESCE(v_contact.data_confidence, 0.5);
  IF v_data_confidence < 0.3 THEN
    v_check_signal := 'HALT';
    v_flags := v_flags || 'Data confidence < 30% — too little data to score';
  ELSIF v_data_confidence < 0.6 THEN
    v_check_signal := 'WARN';
    v_flags := v_flags || 'Data confidence 30-59% — scoring may be unreliable';
  END IF;

  -- Check 4: TRIDENT Readiness (pipeline stage)
  IF v_contact.pipeline_stage IN ('S1_Sourced') THEN
    v_check_readiness := 'HALT';
    v_flags := v_flags || 'Candidate not yet screened — must be S2 or later';
  ELSIF v_contact.pipeline_stage IN ('S2_Screened') THEN
    v_check_readiness := 'WARN';
    v_flags := v_flags || 'Preliminary scoring only — candidate still at screening stage';
  END IF;

  -- Check 5: Compliance / Conflict
  IF v_contact.metadata IS NOT NULL AND v_contact.metadata ? 'conflict_flag' THEN
    IF (v_contact.metadata->>'conflict_flag')::boolean = TRUE THEN
      v_check_compliance := 'HALT';
      v_flags := v_flags || 'Active conflict of interest detected';
    END IF;
  END IF;

  -- Overall
  IF v_check_identity = 'HALT' OR v_check_jd = 'HALT' OR v_check_signal = 'HALT'
     OR v_check_readiness = 'HALT' OR v_check_compliance = 'HALT' THEN
    v_overall := 'HALT';
  ELSIF v_check_identity = 'WARN' OR v_check_jd = 'WARN' OR v_check_signal = 'WARN'
        OR v_check_readiness = 'WARN' OR v_check_compliance = 'WARN' THEN
    v_overall := 'PROCEED_WITH_FLAGS';
  ELSE
    v_overall := 'PROCEED';
  END IF;

  RETURN jsonb_build_object(
    'identity_verification', v_check_identity,
    'jd_alignment', v_check_jd,
    'signal_integrity', v_check_signal,
    'trident_readiness', v_check_readiness,
    'compliance_conflict', v_check_compliance,
    'overall', v_overall,
    'flags', v_flags
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. AUTO-UPDATE CONTACTS ON SCORECARD SAVE ──────────────────────────
CREATE OR REPLACE FUNCTION public.fn_update_contact_trident()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contacts
  SET
    trident_composite = NEW.composite_score,
    trident_verdict = NEW.verdict,
    trident_segment = NEW.segment,
    trident_scored_at = NEW.scored_at
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trident_contact_sync ON public.trident_scorecards;
CREATE TRIGGER trg_trident_contact_sync
  AFTER INSERT OR UPDATE OF composite_score, verdict, segment ON public.trident_scorecards
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_contact_trident();

-- ── 6. STALENESS FLAG (called by cron) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_flag_stale_trident()
RETURNS INTEGER AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.trident_scorecards
  SET stale_flag = TRUE
  WHERE stale_flag = FALSE AND scored_at < NOW() - INTERVAL '6 months';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ── 7. SMOKE TEST ─────────────────────────────────────────────────────
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(t, ', ' ORDER BY t) INTO v_missing
  FROM unnest(ARRAY['trident_scorecards']) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );

  IF v_missing IS NULL THEN
    RAISE NOTICE '✅ TRIDENT 3D scoring migration OK — all tables present';
  ELSE
    RAISE EXCEPTION '❌ TRIDENT migration FAILED — missing: %', v_missing;
  END IF;
END$$;

-- ============================================================
-- MIGRATION: 20260629_wechat_email_integration.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260629_wechat_email_integration.sql
-- DEX AI WeChat & Email Integration — T9 Schema Migration
-- Implements: Technical Blueprint 09 (DEX-TB-009)
-- Outlook Graph API email, WeChat structured logging, unified timeline, templates
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CHANNEL_ACCOUNTS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel               TEXT NOT NULL CHECK (channel IN ('outlook', 'wecom', 'wechat_manual')),
  account_email         TEXT,
  account_name          TEXT,
  access_token_enc      TEXT,
  refresh_token_enc     TEXT,
  token_expires_at      TIMESTAMPTZ,
  graph_user_id         TEXT,
  graph_tenant_id       TEXT,
  wecom_corp_id         TEXT,
  wecom_user_id         TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  last_sync_at          TIMESTAMPTZ,
  sync_status           TEXT DEFAULT 'idle'
                        CHECK (sync_status IN ('idle', 'syncing', 'error', 'auth_expired')),
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel, account_email)
);

CREATE INDEX IF NOT EXISTS idx_channel_user ON public.channel_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_active ON public.channel_accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_channel_sync ON public.channel_accounts(sync_status)
  WHERE sync_status IN ('error', 'auth_expired');

ALTER TABLE public.channel_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON public.channel_accounts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage own accounts" ON public.channel_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── 2. EMAIL_SYNC_STATE TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_sync_state (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id    UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  last_sync_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_delta_link       TEXT,
  total_synced          INTEGER DEFAULT 0,
  last_error            TEXT,
  last_error_at         TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_account_id)
);

ALTER TABLE public.email_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sync state" ON public.email_sync_state
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view sync state" ON public.email_sync_state
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 3. EMAIL_THREADS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_threads (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                  UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  mandate_id                  UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  owner_id                    UUID NOT NULL REFERENCES auth.users(id),
  graph_thread_id             TEXT,
  graph_message_id            TEXT,
  subject                     TEXT NOT NULL,
  from_address                TEXT NOT NULL,
  to_addresses                TEXT[] NOT NULL,
  cc_addresses                TEXT[],
  status                      TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN (
                                'draft', 'sent', 'replied', 'closed', 'bounced'
                              )),
  last_message_at             TIMESTAMPTZ,
  message_count               INTEGER DEFAULT 1,
  is_linked_to_candidate      BOOLEAN DEFAULT FALSE,
  linked_at                   TIMESTAMPTZ,
  linked_by                   UUID REFERENCES auth.users(id),
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  metadata                    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_thread_contact ON public.email_threads(contact_id)
  WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_thread_owner ON public.email_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_email_thread_status ON public.email_threads(status);
CREATE INDEX IF NOT EXISTS idx_email_thread_graph ON public.email_threads(graph_thread_id)
  WHERE graph_thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_thread_last_msg ON public.email_threads(last_message_at DESC);

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email threads" ON public.email_threads
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
    )
  );

CREATE POLICY "Users can create email threads" ON public.email_threads
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own email threads" ON public.email_threads
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- ── 4. EMAIL_MESSAGES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_messages (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id                   UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  graph_message_id            TEXT UNIQUE,
  from_address                TEXT NOT NULL,
  to_addresses                TEXT[] NOT NULL,
  cc_addresses                TEXT[],
  bcc_addresses               TEXT[],
  subject                     TEXT NOT NULL,
  body_text                   TEXT,
  body_html                   TEXT,
  body_preview                TEXT,
  direction                   TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_reply                    BOOLEAN DEFAULT FALSE,
  sent_at                     TIMESTAMPTZ NOT NULL,
  received_at                 TIMESTAMPTZ,
  is_processed                BOOLEAN DEFAULT FALSE,
  processed_at                TIMESTAMPTZ,
  outreach_log_id             UUID REFERENCES public.candidate_outreach_log(id),
  has_attachments             BOOLEAN DEFAULT FALSE,
  attachment_count            INTEGER DEFAULT 0,
  attachments                 JSONB DEFAULT '[]'::jsonb,
  metadata                    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_msg_thread ON public.email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_msg_graph ON public.email_messages(graph_message_id)
  WHERE graph_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_msg_unprocessed ON public.email_messages(is_processed)
  WHERE is_processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_email_msg_direction ON public.email_messages(direction);
CREATE INDEX IF NOT EXISTS idx_email_msg_sent ON public.email_messages(sent_at DESC);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own threads" ON public.email_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.email_threads
      WHERE id = thread_id
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
          )
        )
    )
  );

CREATE POLICY "Users can create messages" ON public.email_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 5. WECHAT_INTERACTIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wechat_interactions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                  UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  logged_by                   UUID NOT NULL REFERENCES auth.users(id),
  interaction_type            TEXT NOT NULL
                              CHECK (interaction_type IN (
                                'message_sent', 'message_received', 'voice_call', 'video_call',
                                'friend_request_sent', 'friend_request_accepted', 'moment_interaction',
                                'group_mention', 'file_shared', 'wecom_message_sent', 'wecom_message_received'
                              )),
  summary                     TEXT NOT NULL,
  content                     TEXT,
  wechat_id                   TEXT,
  outcome                     TEXT CHECK (outcome IN (
                                'positive', 'neutral', 'negative', 'follow_up_needed', 'scheduled'
                              )),
  triggers_stage_change       BOOLEAN DEFAULT FALSE,
  suggested_stage             TEXT CHECK (suggested_stage IN (
                                'S5_Responded', 'S6_WeChat_Added', 'S7_Interested',
                                'S9_Call_Positive', 'S10_Call_Negative', NULL
                              )),
  occurred_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  outreach_log_id             UUID REFERENCES public.candidate_outreach_log(id),
  signal_id                   UUID REFERENCES public.signals(id),
  has_media                   BOOLEAN DEFAULT FALSE,
  media_type                  TEXT CHECK (media_type IN ('image', 'voice', 'video', 'file', NULL)),
  media_url                   TEXT,
  metadata                    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_wechat_contact ON public.wechat_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_wechat_logged_by ON public.wechat_interactions(logged_by);
CREATE INDEX IF NOT EXISTS idx_wechat_type ON public.wechat_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_wechat_occurred ON public.wechat_interactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_wechat_unlinked ON public.wechat_interactions(outreach_log_id)
  WHERE outreach_log_id IS NULL;

ALTER TABLE public.wechat_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view WeChat interactions" ON public.wechat_interactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can create WeChat interactions" ON public.wechat_interactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own WeChat interactions" ON public.wechat_interactions
  FOR UPDATE TO authenticated
  USING (logged_by = auth.uid());

-- ── 6. EMAIL_TEMPLATES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by                  UUID NOT NULL REFERENCES auth.users(id),
  name                        TEXT NOT NULL,
  subject_template            TEXT NOT NULL,
  body_template               TEXT NOT NULL,
  variables                   JSONB DEFAULT '[]'::jsonb,
  category                    TEXT DEFAULT 'outreach'
                              CHECK (category IN (
                                'cold_outreach', 'follow_up', 'interview_schedule',
                                'offer', 'rejection', 'thank_you', 'general', 'wechat_follow_up'
                              )),
  is_shared                   BOOLEAN DEFAULT FALSE,
  usage_count                 INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tpl_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_tpl_shared ON public.email_templates(is_shared)
  WHERE is_shared = TRUE;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own + shared templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_shared = TRUE);

CREATE POLICY "Users can manage own templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- ── 7. SEED: Default Email Templates ───────────────────────────────────
INSERT INTO email_templates (created_by, name, subject_template, body_template, variables, category, is_shared)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Cold Outreach — Introduction',
    '{{company_name}} Opportunity — {{candidate_name}}',
    '<p>Hi {{candidate_name}},</p>
<p>I hope this email finds you well. I came across your background at {{current_company}} and was impressed by your experience in {{industry}}.</p>
<p>I wanted to share an exciting opportunity with {{client_company}} for the {{role_title}} position. Given your expertise in {{key_skill}}, I think you would be a strong fit.</p>
<p>Would you be open to a brief call to discuss this further?</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","company_name","current_company","industry","client_company","role_title","key_skill","sender_name"]',
    'cold_outreach',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Follow Up — No Response',
    'Following up: {{role_title}} opportunity at {{client_company}}',
    '<p>Hi {{candidate_name}},</p>
<p>I wanted to follow up on my previous email about the {{role_title}} role at {{client_company}}.</p>
<p>I understand you are busy, but I would love to hear your thoughts. If this is not the right time, please let me know and I will check back later.</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","role_title","client_company","sender_name"]',
    'follow_up',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Interview Schedule',
    'Interview Confirmed — {{role_title}} on {{interview_date}}',
    '<p>Hi {{candidate_name}},</p>
<p>Great news! Your interview for the {{role_title}} position at {{client_company}} has been scheduled.</p>
<p><strong>Details:</strong><br>
Date: {{interview_date}}<br>
Time: {{interview_time}}<br>
Format: {{interview_format}}<br>
Interviewer: {{interviewer_name}}</p>
<p>Let me know if you need anything to prepare.</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","role_title","client_company","interview_date","interview_time","interview_format","interviewer_name","sender_name"]',
    'interview_schedule',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Thank You — After Interview',
    'Thank you for your time — {{role_title}} discussion',
    '<p>Hi {{candidate_name}},</p>
<p>Thank you for taking the time to speak today about the {{role_title}} role at {{client_company}}.</p>
<p>I really enjoyed our conversation and I believe your experience aligns well with what they are looking for.</p>
<p>I will be in touch with feedback shortly.</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","role_title","client_company","sender_name"]',
    'thank_you',
    TRUE
  )
ON CONFLICT DO NOTHING;


-- ============================================================
-- MIGRATION: 20260630_create_grid_mapping.sql
-- ============================================================
-- ════════════════════════════════════════════════════════════════════════
-- 20260630_create_grid_mapping.sql
-- TICKET T-2b: GRID Market Mapping (TECH-02)
-- 6 new tables for GRID market mapping with RLS enabled
-- ADDITIVE only — uses IF NOT EXISTS to preserve existing tables
-- ════════════════════════════════════════════════════════════════════════

--- grid_mappings TABLE ---
CREATE TABLE IF NOT EXISTS grid_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_grid_mandate ON grid_mappings(mandate_id);

ALTER TABLE grid_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view GRID mappings" ON grid_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can create GRID mappings" ON grid_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update GRID mappings" ON grid_mappings FOR UPDATE TO authenticated USING (true);

--- grid_sectors TABLE ---
CREATE TABLE IF NOT EXISTS grid_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  sector_name TEXT NOT NULL,
  sector_description TEXT,
  priority TEXT CHECK (priority IN ('primary', 'secondary', 'tertiary')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_sectors_mapping ON grid_sectors(mapping_id);
ALTER TABLE grid_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view sectors" ON grid_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can manage sectors" ON grid_sectors FOR ALL TO authenticated USING (true);

--- grid_companies TABLE ---
CREATE TABLE IF NOT EXISTS grid_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  sector_id UUID REFERENCES grid_sectors(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  company_size TEXT,
  headquarters TEXT,
  relevance_score NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_companies_mapping ON grid_companies(mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_companies_sector ON grid_companies(sector_id);
ALTER TABLE grid_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view companies" ON grid_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can manage companies" ON grid_companies FOR ALL TO authenticated USING (true);

--- grid_functions TABLE ---
CREATE TABLE IF NOT EXISTS grid_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  function_description TEXT,
  importance TEXT CHECK (importance IN ('critical', 'important', 'nice_to_have')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_functions_mapping ON grid_functions(mapping_id);
ALTER TABLE grid_functions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view functions" ON grid_functions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can manage functions" ON grid_functions FOR ALL TO authenticated USING (true);

--- grid_candidate_entries TABLE ---
CREATE TABLE IF NOT EXISTS grid_candidate_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('sector', 'company', 'function')),
  section_item_id UUID,
  notes TEXT,
  ranking INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_entries_mapping ON grid_candidate_entries(mapping_id);
CREATE INDEX IF NOT EXISTS idx_grid_entries_contact ON grid_candidate_entries(contact_id);
ALTER TABLE grid_candidate_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view entries" ON grid_candidate_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can manage entries" ON grid_candidate_entries FOR ALL TO authenticated USING (true);

--- grid_minimum_standards TABLE ---
CREATE TABLE IF NOT EXISTS grid_minimum_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL REFERENCES grid_mappings(id) ON DELETE CASCADE,
  standard_type TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grid_standards_mapping ON grid_minimum_standards(mapping_id);
ALTER TABLE grid_minimum_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view standards" ON grid_minimum_standards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can manage standards" ON grid_minimum_standards FOR ALL TO authenticated USING (true);

-- ════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════════════════
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
    RAISE NOTICE '✅ GRID Market Mapping migration OK — all 6 tables present';
  ELSE
    RAISE EXCEPTION '❌ GRID Market Mapping migration FAILED — missing: %', v_missing;
  END IF;
END$$;


-- ============================================================
-- END OF MIGRATIONS
COMMIT;
