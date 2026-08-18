-- #42 — RAG Content Library schema
--
-- Three tables:
--   nexus_content_library  — published content sources (articles, guides, whitepapers, …)
--   nexus_content_chunks   — vector-embedded chunks per source (pgvector ivfflat cosine)
--   nexus_content_access_log — per-user access log (search/manual/recommendation attribution)
--
-- RLS:
--   nexus_content_library + nexus_content_chunks:
--     • SELECT = public (published library, audience_tier filtered app-level)
--     • INSERT/UPDATE/DELETE = ADMIN ONLY
--   nexus_content_access_log:
--     • SELECT = user sees own rows only

CREATE EXTENSION IF NOT EXISTS vector;

-- ── Enum: nexus_content_source_type ────────────────────────────────

DO $$ BEGIN
  CREATE TYPE nexus_content_source_type AS ENUM (
    'article',
    'guide',
    'whitepaper',
    'playbook',
    'template',
    'faq',
    'case_study',
    'curated'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Enum: nexus_content_access_via ─────────────────────────────────

DO $$ BEGIN
  CREATE TYPE nexus_content_access_via AS ENUM (
    'nexus_search',
    'manual_link',
    'recommendation'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════
--  1. nexus_content_library
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nexus_content_library (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_title   TEXT NOT NULL,
  source_url     TEXT,
  source_type    nexus_content_source_type NOT NULL,
  publish_date   DATE,
  audience_tier  TEXT REFERENCES tiers(tier_key) ON DELETE SET NULL,
  summary        TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_content_library_active
  ON nexus_content_library(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_nexus_content_library_type
  ON nexus_content_library(source_type);
CREATE INDEX IF NOT EXISTS idx_nexus_content_library_tier
  ON nexus_content_library(audience_tier);
CREATE INDEX IF NOT EXISTS idx_nexus_content_library_publish_date
  ON nexus_content_library(publish_date DESC);

-- ════════════════════════════════════════════════════════════════════
--  2. nexus_content_chunks
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nexus_content_chunks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id         UUID NOT NULL REFERENCES nexus_content_library(id) ON DELETE CASCADE,
  chunk_index        INTEGER NOT NULL,
  content            TEXT NOT NULL,
  embedding          vector(1536),
  chunk_token_count  INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_nexus_content_chunks_content_id
  ON nexus_content_chunks(content_id);
CREATE INDEX IF NOT EXISTS idx_nexus_content_chunks_embedding
  ON nexus_content_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ════════════════════════════════════════════════════════════════════
--  3. nexus_content_access_log
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nexus_content_access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id      UUID REFERENCES nexus_content_library(id) ON DELETE SET NULL,
  chunk_id        UUID REFERENCES nexus_content_chunks(id) ON DELETE SET NULL,
  accessed_via    nexus_content_access_via NOT NULL,
  search_query    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_content_access_log_user
  ON nexus_content_access_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_content_access_log_content
  ON nexus_content_access_log(content_id);
CREATE INDEX IF NOT EXISTS idx_nexus_content_access_log_via
  ON nexus_content_access_log(accessed_via);

-- ════════════════════════════════════════════════════════════════════
--  updated_at trigger
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION nexus_content_library_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_nexus_content_library_updated ON nexus_content_library;
CREATE TRIGGER touch_nexus_content_library_updated BEFORE UPDATE ON nexus_content_library
  FOR EACH ROW EXECUTE FUNCTION nexus_content_library_touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE nexus_content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_content_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_content_access_log ENABLE ROW LEVEL SECURITY;

-- ── nexus_content_library: public SELECT (active only), admin write ─

DROP POLICY IF EXISTS nexus_content_library_select ON nexus_content_library;
CREATE POLICY nexus_content_library_select ON nexus_content_library
  FOR SELECT USING (
    is_active = true
    OR is_admin_role(current_user_role())
  );

DROP POLICY IF EXISTS nexus_content_library_admin_all ON nexus_content_library;
CREATE POLICY nexus_content_library_admin_all ON nexus_content_library
  FOR ALL USING (is_admin_role(current_user_role()));

-- ── nexus_content_chunks: public SELECT, admin write ────────────────

DROP POLICY IF EXISTS nexus_content_chunks_select ON nexus_content_chunks;
CREATE POLICY nexus_content_chunks_select ON nexus_content_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nexus_content_library l
      WHERE l.id = nexus_content_chunks.content_id
        AND (l.is_active = true OR is_admin_role(current_user_role()))
    )
  );

DROP POLICY IF EXISTS nexus_content_chunks_admin_all ON nexus_content_chunks;
CREATE POLICY nexus_content_chunks_admin_all ON nexus_content_chunks
  FOR ALL USING (is_admin_role(current_user_role()));

-- ── nexus_content_access_log: user sees own only (plus admin) ───────

DROP POLICY IF EXISTS nexus_content_access_log_own_select ON nexus_content_access_log;
CREATE POLICY nexus_content_access_log_own_select ON nexus_content_access_log
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_admin_role(current_user_role())
  );

DROP POLICY IF EXISTS nexus_content_access_log_own_insert ON nexus_content_access_log;
CREATE POLICY nexus_content_access_log_own_insert ON nexus_content_access_log
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR is_admin_role(current_user_role())
  );
