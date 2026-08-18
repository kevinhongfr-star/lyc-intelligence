-- ============================================================
--  Phase 2 Amendments / Ticket #1334 + #1337
--
--  #1334: Assessment metadata data model + RLS + progress tracking
--    - assessments catalog table (public read on published)
--    - user_assessment_progress table (user-scoped)
--    - RLS policies
--
--  #1337: Assessment result page data contract + share/export spec
--    - assessment_shares table (7-day expiry, revocable, no PII)
--
--  Run via: Supabase SQL Editor OR psql $DATABASE_URL < this file
--  Then redeploy RLS: POST /api/setup/apply-rls (with CRON_SECRET)
-- ============================================================

-- ════════════════════════════════════════════════════════════
--  #1334: assessments catalog table
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.assessments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,           -- e.g. 'CPI', 'SHIFT-EXEC', 'TRIDENT'
  name            text NOT NULL,                   -- full instrument name
  b2c_name        text,                            -- consumer-facing name
  tagline         text,
  tier_group      text NOT NULL DEFAULT 'standard', -- flagship | shift | advisory | standard
  tier_label      text,
  price_miles     integer NOT NULL DEFAULT 0,
  pricing         jsonb NOT NULL DEFAULT '[]',     -- AssessmentPricing[]
  duration_minutes integer NOT NULL DEFAULT 15,
  total_questions integer NOT NULL DEFAULT 0,
  scale           text,
  version         text NOT NULL DEFAULT '1.0',
  dimensions      jsonb NOT NULL DEFAULT '[]',     -- AssessmentDimension[]
  archetypes      jsonb NOT NULL DEFAULT '[]',     -- AssessmentArchetype[]
  composite_bands jsonb NOT NULL DEFAULT '[]',     -- { band, interpretation }[]
  style_count     integer NOT NULL DEFAULT 1,
  archetype_count integer NOT NULL DEFAULT 0,
  is_cpi          boolean NOT NULL DEFAULT false,
  is_shift        boolean NOT NULL DEFAULT false,
  is_advisory     boolean NOT NULL DEFAULT false,
  is_published    boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 100,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_published
  ON public.assessments(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_assessments_code
  ON public.assessments(code) WHERE is_published = true;

-- ════════════════════════════════════════════════════════════
--  #1334: user_assessment_progress table
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_assessment_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_code text NOT NULL,                    -- references assessments.code (denormalized for speed)
  assessment_id   uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'not_started',
    -- not_started | in_progress | completed | abandoned
  current_question integer NOT NULL DEFAULT 0,
  total_questions  integer NOT NULL DEFAULT 0,
  answers         jsonb NOT NULL DEFAULT '{}',     -- { questionId: answerValue }
  started_at      timestamptz,
  completed_at    timestamptz,
  expires_at      timestamptz,                     -- for time-limited assessments
  miles_spent     integer NOT NULL DEFAULT 0,
  result_id       uuid,                            -- FK to assessment_results if completed
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, assessment_code)
);

CREATE INDEX IF NOT EXISTS idx_uap_user
  ON public.user_assessment_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_uap_status
  ON public.user_assessment_progress(user_id, status);

-- ════════════════════════════════════════════════════════════
--  #1337: assessment_shares table
--  Share links: 7-day expiry, revocable, no PII on shared page
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.assessment_shares (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token     text NOT NULL UNIQUE,            -- opaque token for /share/:token URL
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result_id       uuid NOT NULL,                   -- FK to assessment_results
  assessment_code text NOT NULL,
  -- Sanitized result data (NO PII: no name, email, or identifying info)
  -- Contains: overall_score, dimensions, archetype, benchmark, recommendations
  shared_payload  jsonb NOT NULL,
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  revoked_at      timestamptz,                     -- NULL = active, non-NULL = revoked
  view_count      integer NOT NULL DEFAULT 0,
  max_views       integer,                         -- NULL = unlimited
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shares_token
  ON public.assessment_shares(share_token) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shares_owner
  ON public.assessment_shares(owner_id);

-- ════════════════════════════════════════════════════════════
--  RLS Policies
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assessment_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_shares ENABLE ROW LEVEL SECURITY;

-- assessments: public read on published, admin-only write
DROP POLICY IF EXISTS assessments_read ON public.assessments;
CREATE POLICY assessments_read ON public.assessments FOR SELECT USING (
  is_published = true
  OR is_admin_role(current_user_role())
);

DROP POLICY IF EXISTS assessments_write ON public.assessments;
CREATE POLICY assessments_write ON public.assessments FOR ALL USING (
  is_admin_role(current_user_role())
);

-- user_assessment_progress: user sees only their own rows
DROP POLICY IF EXISTS uap_read ON public.user_assessment_progress;
CREATE POLICY uap_read ON public.user_assessment_progress FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin_role(current_user_role())
);

DROP POLICY IF EXISTS uap_insert ON public.user_assessment_progress;
CREATE POLICY uap_insert ON public.user_assessment_progress FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS uap_update ON public.user_assessment_progress;
CREATE POLICY uap_update ON public.user_assessment_progress FOR UPDATE USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS uap_delete ON public.user_assessment_progress;
CREATE POLICY uap_delete ON public.user_assessment_progress FOR DELETE USING (
  user_id = auth.uid()
  OR is_admin_role(current_user_role())
);

-- assessment_shares: owner can CRUD their shares, anyone with token can read (if not expired/revoked)
DROP POLICY IF EXISTS shares_owner_all ON public.assessment_shares;
CREATE POLICY shares_owner_all ON public.assessment_shares FOR ALL USING (
  owner_id = auth.uid()
  OR is_admin_role(current_user_role())
);

-- Public read by token: the share_token acts as a capability URL.
-- We can't check the token in RLS (it's not in the WHERE clause),
-- so the API layer enforces token validation. RLS just allows public SELECT.
DROP POLICY IF EXISTS shares_public_read ON public.assessment_shares;
CREATE POLICY shares_public_read ON public.assessment_shares FOR SELECT USING (
  revoked_at IS NULL
  AND expires_at > now()
  AND (max_views IS NULL OR view_count < max_views)
);

-- ════════════════════════════════════════════════════════════
--  Updated trigger for updated_at columns
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assessments_updated ON public.assessments;
CREATE TRIGGER trg_assessments_updated BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_uap_updated ON public.user_assessment_progress;
CREATE TRIGGER trg_uap_updated BEFORE UPDATE ON public.user_assessment_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
