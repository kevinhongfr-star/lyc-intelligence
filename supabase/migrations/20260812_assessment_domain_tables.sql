-- #1341 — Assessment domain tables (8 tables matching #98 expanded schema)
--
-- These tables are the runtime source of truth for all assessment data.
-- JSON files in src/data/diagnostics/*.json are SEED data that populates
-- these tables at deploy time via the seed script.
--
-- Architecture:
--   - No JSONB for core data (only for flexible metadata: options, skip_logic, insights)
--   - Canonical tier_key pattern (never display names as identifiers)
--   - RLS-first design
--   - Soft deletes via deleted_at on user-facing tables
--   - Standard columns: id, created_at, updated_at

-- ── 1. assessment_definitions (catalog of all assessments) ─────────

CREATE TABLE IF NOT EXISTS assessment_definitions (
  assessment_id    VARCHAR(50) PRIMARY KEY,    -- canonical slug: 'prism', 'spark', etc.
  title            VARCHAR(200) NOT NULL,
  subtitle         TEXT,
  accent_color     VARCHAR(20),
  tier_key         VARCHAR(50) NOT NULL REFERENCES tiers(tier_key),
  total_questions  INTEGER NOT NULL DEFAULT 0,
  total_dimensions INTEGER NOT NULL DEFAULT 0,
  status           VARCHAR(20) NOT NULL DEFAULT 'placeholder', -- placeholder | active
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. assessment_dimensions ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessment_dimensions (
  dimension_id    SERIAL PRIMARY KEY,
  assessment_id   VARCHAR(50) NOT NULL REFERENCES assessment_definitions(assessment_id) ON DELETE CASCADE,
  dimension_key   VARCHAR(50) NOT NULL,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  low_label       VARCHAR(100),
  high_label      VARCHAR(100),
  weight          NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, dimension_key)
);

-- ── 3. assessment_questions (question bank) ───────────────────────

CREATE TABLE IF NOT EXISTS assessment_questions (
  question_id     SERIAL PRIMARY KEY,
  assessment_id   VARCHAR(50) NOT NULL REFERENCES assessment_definitions(assessment_id) ON DELETE CASCADE,
  question_key    VARCHAR(100) NOT NULL,
  question_type   VARCHAR(20) NOT NULL,         -- single_select, multi_select, scale, text, scenario
  prompt          TEXT NOT NULL,
  options         JSONB,                         -- array of {value, label, score?}
  scale_min       INTEGER,
  scale_max       INTEGER,
  scale_labels    JSONB,                         -- { "1": "Strongly disagree", ... }
  max_selections  INTEGER,
  scenario        TEXT,
  required        BOOLEAN NOT NULL DEFAULT true,
  dimension_key   VARCHAR(50) NOT NULL,
  weight          NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  skip_logic      JSONB,                         -- array of skip rules
  dependency      JSONB,                         -- { question_id, operator, value }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_lookup
  ON assessment_questions(assessment_id, sort_order);

-- ── 4. assessment_attempts (a user's attempt at an assessment) ────

CREATE TABLE IF NOT EXISTS assessment_attempts (
  attempt_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = anonymous
  assessment_id        VARCHAR(50) NOT NULL REFERENCES assessment_definitions(assessment_id),
  status               VARCHAR(20) NOT NULL DEFAULT 'in_progress',  -- in_progress, completed, abandoned
  started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ,
  current_question_key VARCHAR(100),
  is_anonymous         BOOLEAN NOT NULL DEFAULT false,
  expires_at           TIMESTAMPTZ,              -- for anonymous attempts (7 days)
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user
  ON assessment_attempts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_anon
  ON assessment_attempts(assessment_id) WHERE is_anonymous = true;

-- ── 5. assessment_responses (individual answers within an attempt) ─

CREATE TABLE IF NOT EXISTS assessment_responses (
  response_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id    UUID NOT NULL REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE,
  question_key  VARCHAR(100) NOT NULL,
  answer        JSONB NOT NULL,                  -- structured answer value(s)
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_attempt
  ON assessment_responses(attempt_id);

-- ── 6. assessment_results (scored results for a completed attempt) ─

CREATE TABLE IF NOT EXISTS assessment_results (
  result_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id    UUID NOT NULL REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE,
  assessment_id VARCHAR(50) NOT NULL REFERENCES assessment_definitions(assessment_id),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- denormalized for RLS
  overall_score INTEGER,                         -- 0-100
  overall_level VARCHAR(50),                     -- Developing, Proficient, Advanced, Mastery
  style_key     VARCHAR(50),
  archetype_key VARCHAR(50),
  insights      JSONB,                           -- array of insight strings
  raw_data      JSONB,                           -- full intermediate scoring data
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user
  ON assessment_results(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment
  ON assessment_results(assessment_id);

-- ── 7. assessment_result_dimensions (per-dimension scores) ────────

CREATE TABLE IF NOT EXISTS assessment_result_dimensions (
  result_dimension_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id            UUID NOT NULL REFERENCES assessment_results(result_id) ON DELETE CASCADE,
  dimension_key        VARCHAR(50) NOT NULL,
  score                INTEGER NOT NULL,         -- 0-100
  level                VARCHAR(50),              -- Developing, Proficient, Advanced, Mastery
  dimension_name       VARCHAR(100),             -- denormalized for display
  description          TEXT,                     -- per-dimension insight text
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_result_dimensions_result
  ON assessment_result_dimensions(result_id);

-- ── 8. assessment_archetypes (archetype catalog per assessment) ───

CREATE TABLE IF NOT EXISTS assessment_archetypes (
  archetype_id  SERIAL PRIMARY KEY,
  assessment_id VARCHAR(50) NOT NULL REFERENCES assessment_definitions(assessment_id) ON DELETE CASCADE,
  archetype_key VARCHAR(50) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  key_traits    JSONB,                           -- array of trait strings
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, archetype_key)
);

-- ── RLS Policies ──────────────────────────────────────────────────

-- assessment_definitions: public read (anon + authed)
ALTER TABLE assessment_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_definitions_read ON assessment_definitions FOR SELECT USING (true);

-- assessment_dimensions: public read
ALTER TABLE assessment_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_dimensions_read ON assessment_dimensions FOR SELECT USING (true);

-- assessment_questions: public read
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_questions_read ON assessment_questions FOR SELECT USING (true);

-- assessment_archetypes: public read
ALTER TABLE assessment_archetypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_archetypes_read ON assessment_archetypes FOR SELECT USING (true);

-- assessment_attempts: user owns their attempts
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_attempts_select ON assessment_attempts FOR SELECT
  USING (user_id = auth.uid() OR (is_anonymous = true AND user_id IS NULL));
CREATE POLICY assessment_attempts_insert ON assessment_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY assessment_attempts_update ON assessment_attempts FOR UPDATE
  USING (user_id = auth.uid());

-- assessment_responses: user owns their responses (via attempt ownership)
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_responses_select ON assessment_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessment_attempts a
    WHERE a.attempt_id = assessment_responses.attempt_id
    AND (a.user_id = auth.uid() OR a.is_anonymous = true)
  ));
CREATE POLICY assessment_responses_insert ON assessment_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM assessment_attempts a
    WHERE a.attempt_id = assessment_responses.attempt_id
    AND (a.user_id = auth.uid() OR a.is_anonymous = true)
  ));
CREATE POLICY assessment_responses_update ON assessment_responses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM assessment_attempts a
    WHERE a.attempt_id = assessment_responses.attempt_id
    AND a.user_id = auth.uid()
  ));

-- assessment_results: user owns their results only
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_results_select ON assessment_results FOR SELECT
  USING (user_id = auth.uid());

-- assessment_result_dimensions: user owns their result dimensions
ALTER TABLE assessment_result_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY assessment_result_dimensions_select ON assessment_result_dimensions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessment_results r
    WHERE r.result_id = assessment_result_dimensions.result_id
    AND r.user_id = auth.uid()
  ));

-- ── updated_at triggers ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch_assessment_definitions BEFORE UPDATE ON assessment_definitions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_assessment_dimensions BEFORE UPDATE ON assessment_dimensions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_assessment_questions BEFORE UPDATE ON assessment_questions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_assessment_attempts BEFORE UPDATE ON assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_assessment_responses BEFORE UPDATE ON assessment_responses
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_assessment_archetypes BEFORE UPDATE ON assessment_archetypes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
