-- #43 — Proactive Suggestion Engine schema
--
-- Two tables:
--   nexus_recommendations            — per-user proactive suggestions w/ state machine
--   nexus_recommendation_cooldowns   — (user_id, trigger_type) composite PK cooldown gate
--
-- RLS:
--   nexus_recommendations:
--     • SELECT = user sees OWN rows only (+ admin)
--     • INSERT/UPDATE/DELETE = procedures write (direct writes disallowed)
--   nexus_recommendation_cooldowns:
--     • SELECT = user sees OWN rows only (+ admin)
--     • INSERT/UPDATE = procedure-only (direct writes disallowed)

-- ── Enum: nexus_recommendation_trigger_type ─────────────────────────

DO $$ BEGIN
  CREATE TYPE nexus_recommendation_trigger_type AS ENUM (
    'post_assessment',
    'inactivity_streak',
    'new_content_available',
    'new_capability',
    'goal_progress_milestone',
    'miles_low',
    'repeat_question'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Enum: nexus_recommendation_status ───────────────────────────────

DO $$ BEGIN
  CREATE TYPE nexus_recommendation_status AS ENUM (
    'pending',
    'delivered',
    'dismissed',
    'actioned'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════
--  1. nexus_recommendations
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nexus_recommendations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type              nexus_recommendation_trigger_type NOT NULL,
  headline                  TEXT NOT NULL,
  recommendation            TEXT NOT NULL,
  context_payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  related_content_id        UUID REFERENCES nexus_content_library(id) ON DELETE SET NULL,
  related_diagnostic_slug   TEXT,
  status                    nexus_recommendation_status NOT NULL DEFAULT 'pending',
  delivered_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_recommendations_user_status
  ON nexus_recommendations(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_recommendations_trigger
  ON nexus_recommendations(user_id, trigger_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_recommendations_content
  ON nexus_recommendations(related_content_id);
CREATE INDEX IF NOT EXISTS idx_nexus_recommendations_created
  ON nexus_recommendations(created_at DESC);

-- ════════════════════════════════════════════════════════════════════
--  2. nexus_recommendation_cooldowns
--  Composite PK (user_id, trigger_type) — one row per trigger per user.
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nexus_recommendation_cooldowns (
  id                 UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type       VARCHAR(50) NOT NULL,
  last_fired_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  cooldown_hours     INTEGER NOT NULL DEFAULT 24,
  next_allowed_at    TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, trigger_type)
);

CREATE INDEX IF NOT EXISTS idx_nexus_recommendation_cooldowns_user
  ON nexus_recommendation_cooldowns(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_recommendation_cooldowns_next
  ON nexus_recommendation_cooldowns(next_allowed_at);

-- ════════════════════════════════════════════════════════════════════
--  updated_at triggers
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION nexus_recommendations_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_nexus_recommendations_updated ON nexus_recommendations;
CREATE TRIGGER touch_nexus_recommendations_updated BEFORE UPDATE ON nexus_recommendations
  FOR EACH ROW EXECUTE FUNCTION nexus_recommendations_touch_updated_at();

CREATE OR REPLACE FUNCTION nexus_cooldowns_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_nexus_cooldowns_updated ON nexus_recommendation_cooldowns;
CREATE TRIGGER touch_nexus_cooldowns_updated BEFORE UPDATE ON nexus_recommendation_cooldowns
  FOR EACH ROW EXECUTE FUNCTION nexus_cooldowns_touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  RLS Policies
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE nexus_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_recommendation_cooldowns ENABLE ROW LEVEL SECURITY;

-- ── nexus_recommendations: user read-only (own rows) ────────────────
--    Procedural writes (from engine.ts via RPC) bypass RLS with
--    SECURITY DEFINER. Direct client-side writes are disallowed.

DROP POLICY IF EXISTS nexus_recommendations_own_select ON nexus_recommendations;
CREATE POLICY nexus_recommendations_own_select ON nexus_recommendations
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_admin_role(current_user_role())
  );

-- ── nexus_recommendation_cooldowns: user read-only (own rows) ──────

DROP POLICY IF EXISTS nexus_cooldowns_own_select ON nexus_recommendation_cooldowns;
CREATE POLICY nexus_cooldowns_own_select ON nexus_recommendation_cooldowns
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_admin_role(current_user_role())
  );

-- ════════════════════════════════════════════════════════════════════
--  SECURITY DEFINER RPC: Record a recommendation delivery + cooldown.
--  Called by the engine (engine.ts → deliver()) after evaluating
--  triggers and passing the cooldown gate.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION nexus_record_recommendation_delivery(
  p_user_id                 UUID,
  p_trigger_type            TEXT,
  p_headline                TEXT,
  p_recommendation          TEXT,
  p_context_payload         JSONB DEFAULT '{}'::jsonb,
  p_related_content_id      UUID DEFAULT NULL,
  p_related_diagnostic_slug TEXT DEFAULT NULL,
  p_cooldown_hours          INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec_id UUID;
  v_next   TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id cannot be null' USING ERRCODE = '22004';
  END IF;

  -- 1. Insert recommendation row (status = delivered)
  INSERT INTO nexus_recommendations (
    user_id, trigger_type, headline, recommendation,
    context_payload, related_content_id, related_diagnostic_slug,
    status, delivered_at
  ) VALUES (
    p_user_id, p_trigger_type::nexus_recommendation_trigger_type,
    p_headline, p_recommendation, p_context_payload,
    p_related_content_id, p_related_diagnostic_slug,
    'delivered', now()
  ) RETURNING id INTO v_rec_id;

  -- 2. Upsert cooldown row
  v_next := now() + (p_cooldown_hours || ' hours')::INTERVAL;
  INSERT INTO nexus_recommendation_cooldowns
    (user_id, trigger_type, last_fired_at, cooldown_hours, next_allowed_at)
  VALUES (p_user_id, p_trigger_type, now(), p_cooldown_hours, v_next)
  ON CONFLICT (user_id, trigger_type) DO UPDATE
    SET last_fired_at   = now(),
        cooldown_hours  = EXCLUDED.cooldown_hours,
        next_allowed_at = EXCLUDED.next_allowed_at;

  RETURN v_rec_id;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
--  SECURITY DEFINER RPC: Dismiss / action a recommendation.
-- ════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION nexus_update_recommendation_status(
  p_rec_id   UUID,
  p_status   TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM nexus_recommendations WHERE id = p_rec_id;
  IF v_owner IS NULL THEN
    RETURN FALSE;
  END IF;
  IF v_owner <> auth.uid() AND NOT is_admin_role(current_user_role()) THEN
    RAISE EXCEPTION 'Not authorized to modify this recommendation' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('pending', 'delivered', 'dismissed', 'actioned') THEN
    RAISE EXCEPTION 'Invalid status' USING ERRCODE = '22023';
  END IF;
  UPDATE nexus_recommendations
    SET status = p_status::nexus_recommendation_status
  WHERE id = p_rec_id;
  RETURN TRUE;
END;
$$;
