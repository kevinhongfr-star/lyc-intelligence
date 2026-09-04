-- P3-1 — Milestone validation engine (milestones table + RPC + profile_settings guard)
-- Also: P2-2-5 enable_nexus_memory column (idempotent ADD IF NOT EXISTS), plus
-- the semantic-memory GIN index required by NFR-3 (P2-2-3 retrieval).
--
-- All statements are idempotent so re-running this migration against any
-- existing branch state is a no-op for objects that already exist.

-- ════════════════════════════════════════════════════════════════════
--  1. Status enum
-- ════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'milestone_status'
  ) THEN
    CREATE TYPE milestone_status AS ENUM ('queued', 'active', 'completed');
  END IF;
END$$;

-- ════════════════════════════════════════════════════════════════════
--  2. milestones table
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS milestones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  tags                  TEXT[] DEFAULT '{}',
  progress              INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status                milestone_status NOT NULL DEFAULT 'queued',
  source_assessment_code TEXT,
  dependency_ids        UUID[] DEFAULT '{}',
  required_lens_score   JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user_id
  ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status_progress
  ON milestones(status, progress);
CREATE INDEX IF NOT EXISTS idx_milestones_tags_gin
  ON milestones USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_milestones_dependencies_gin
  ON milestones USING GIN (dependency_ids);
CREATE INDEX IF NOT EXISTS idx_milestones_required_lens_score_gin
  ON milestones USING GIN (required_lens_score);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS milestones_owner_select ON milestones;
CREATE POLICY milestones_owner_select ON milestones
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS milestones_owner_insert ON milestones;
CREATE POLICY milestones_owner_insert ON milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS milestones_owner_update ON milestones;
CREATE POLICY milestones_owner_update ON milestones
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS milestones_owner_delete ON milestones;
CREATE POLICY milestones_owner_delete ON milestones
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at auto-bump trigger for milestones
CREATE OR REPLACE FUNCTION milestones_bump_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_milestones_updated_at ON milestones;
CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION milestones_bump_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  3. validate_and_set_milestone_progress RPC
--
--  Rules:
--   1. OWNER_MISMATCH   → milestones.user_id <> p_user_id AND non-admin
--   2. PROGRESS_RANGE   → p_new_progress ∉ [0, 100]
--   3. PROGRESS_REGRESS → p_new_progress < current.progress - 5 (5% tolerance)
--   4. FINALIZATION_EVIDENCE → cross 80→100 threshold, evidence flags empty
--   5. DEPENDENCY_UNMET → any dependency_id row has progress<80 AND status<>'completed'
--   6. ALREADY_COMPLETED → row is completed AND p_new_progress < 100
--   7. Status auto-flip (inside successful path):
--        progress>=100? status→completed, completed_at set
--        progress>=80?  status→completed, completed_at set
--        progress<10  AND status='queued'→'active'
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION validate_and_set_milestone_progress(
  p_milestone_id   UUID,
  p_new_progress   INTEGER,
  p_user_id        UUID,
  p_evidence       JSONB DEFAULT NULL
)
RETURNS TABLE(
  ok               BOOLEAN,
  code             TEXT,
  message          TEXT,
  previous_progress INTEGER,
  new_progress     INTEGER
) AS $$
DECLARE
  m                 milestones%ROWTYPE;
  is_admin          BOOLEAN;
  _prev_progress    INTEGER;
  dep_id            UUID;
  dep_row           RECORD;
  failing_deps      UUID[] := '{}';
  _evidence_count   INTEGER := 0;
  _actual_new       INTEGER;
  _new_status       milestone_status;
BEGIN
  ok := false;
  previous_progress := NULL;
  new_progress := p_new_progress;
  code := NULL;
  message := NULL;

  -- Load target milestone row (shared lock — SELECT FOR UPDATE could be used
  -- but since updates are per-user single-owner, contention is near-zero).
  SELECT * INTO m FROM milestones WHERE id = p_milestone_id LIMIT 1;
  IF m.id IS NULL THEN
    code := 'MILESTONE_NOT_FOUND';
    message := 'Milestone id ' || p_milestone_id::text || ' does not exist.';
    RETURN NEXT;
    RETURN;
  END IF;
  _prev_progress := m.progress;
  previous_progress := _prev_progress;

  -- Admin check: raw_app_meta_data.role IN ('admin','super_admin')
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = p_user_id
      AND (auth.users.raw_app_meta_data->>'role')::TEXT
          IN ('admin', 'super_admin')
  ) INTO is_admin;

  -- Rule 1 — ownership
  IF m.user_id <> p_user_id AND NOT is_admin THEN
    code := 'OWNER_MISMATCH';
    message := 'Only the milestone owner or an admin can edit progress.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Rule 2 — range
  IF p_new_progress < 0 OR p_new_progress > 100 THEN
    code := 'PROGRESS_RANGE';
    message := 'Progress must be between 0 and 100 inclusive.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Rule 3 — regress (5% tolerance)
  IF p_new_progress < (_prev_progress - 5) THEN
    code := 'PROGRESS_REGRESS';
    message := 'Progress would regress by more than 5%. Make smaller edits or confirm with a consultant.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Rule 6 — ALREADY_COMPLETED before cross-threshold checks
  IF m.status = 'completed' AND p_new_progress < 100 THEN
    code := 'ALREADY_COMPLETED';
    message := 'This milestone is already completed. A completed milestone cannot re-open below 100%.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Rule 4 — FINALIZATION_EVIDENCE (cross 80→100 jump requires evidence flags)
  -- Trigger on ANY crossing into 80..100 from below 80; also on 100 attempts.
  IF (_prev_progress < 80 AND p_new_progress >= 80) OR p_new_progress = 100 THEN
    -- Count set-to-true keys in evidence
    IF p_evidence IS NOT NULL AND jsonb_typeof(p_evidence) = 'object' THEN
      SELECT COUNT(*) INTO _evidence_count
      FROM jsonb_each_text(p_evidence)
      WHERE key IN ('links_used', 'lens_readout_referenced', 'consultant_approved')
        AND value::BOOLEAN = true;
    END IF;
    IF _evidence_count = 0 THEN
      code := 'FINALIZATION_EVIDENCE';
      message := 'Advancing past 80% requires at least one finalization source: links_used, lens_readout_referenced, or consultant_approved.';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  -- Rule 5 — DEPENDENCY_UNMET (only checked when setting >= 30% so queued
  -- milestones can nudge to 10% activate without dependency work already)
  IF p_new_progress >= 30 AND array_length(m.dependency_ids, 1) > 0 THEN
    FOREACH dep_id IN ARRAY m.dependency_ids LOOP
      SELECT progress, status INTO dep_row FROM milestones WHERE id = dep_id;
      IF dep_row.progress IS NULL THEN
        failing_deps := array_append(failing_deps, dep_id);
      ELSIF dep_row.progress < 80 AND dep_row.status <> 'completed' THEN
        failing_deps := array_append(failing_deps, dep_id);
      END IF;
    END LOOP;
    IF array_length(failing_deps, 1) > 0 THEN
      code := 'DEPENDENCY_UNMET';
      message := 'Prerequisite milestones need 80%+ progress first: ' || array_to_string(failing_deps, ', ');
      -- append context via message; caller can post-parse failing_deps from message if needed
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;

  -- All rules passed → apply the update + Rule 7 status transitions
  _actual_new := p_new_progress;
  _new_status := m.status;

  IF _actual_new >= 80 AND _new_status <> 'completed' THEN
    _new_status := 'completed';
  ELSIF _actual_new < 10 AND _new_status = 'queued' THEN
    _new_status := 'active';
  ELSIF _actual_new >= 10 AND _actual_new < 80 AND _new_status = 'queued' THEN
    _new_status := 'active';
  END IF;
  -- Already-completed status -> stays completed regardless of value in [80,100]

  UPDATE milestones
  SET
    progress     = _actual_new,
    status       = _new_status,
    completed_at = CASE WHEN _new_status = 'completed' AND completed_at IS NULL
                        THEN now()
                        ELSE completed_at END
  WHERE id = p_milestone_id;

  ok := true;
  code := 'OK';
  message := 'Progress updated.';
  previous_progress := _prev_progress;
  new_progress := _actual_new;
  RETURN NEXT;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER best-practice: search_path pinned to public only
ALTER FUNCTION validate_and_set_milestone_progress SET search_path = public;

-- ════════════════════════════════════════════════════════════════════
--  4. P2-2 pre-req: profile_settings.enable_nexus_memory (idempotent)
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS profile_settings
  ADD COLUMN IF NOT EXISTS enable_nexus_memory BOOLEAN DEFAULT true;

-- ════════════════════════════════════════════════════════════════════
--  5. P2-2 NFR-3: semantic memory JSONB GIN index (fast focus-area lookup)
-- ════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_semantic_memory_user_model_gin
  ON nexus_semantic_memory USING GIN (user_model);

-- ════════════════════════════════════════════════════════════════════
--  6. P2-2 semantic patch upsert RPC
--     Implements the clean JSONB merge used by the worker's
--     updateSemanticMemoryIfDue(). Merges patch into user_model:
--       • patch.goals          → append to user_model.goals (dedup by content)
--       • patch.preferences.focus_areas → append + dedup
--       • patch.career_context → overwrite only non-empty keys individually
--       • update_count += 1, last_updated = now()
--     Falls back to a full-row INSERT on CONFLICT (user_id) DO UPDATE
--     so it works regardless of whether the row already exists.
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION upsert_nexus_semantic_memory_patch(
  p_user_id UUID,
  p_patch   JSONB
)
RETURNS void AS $$
DECLARE
  existing JSONB := NULL;
  merged   JSONB;
BEGIN
  SELECT user_model INTO existing
    FROM nexus_semantic_memory
    WHERE user_id = p_user_id
    LIMIT 1;

  IF existing IS NULL THEN
    -- Fresh row — use the existing migration default shape and overlay patch.
    existing := jsonb_build_object(
      'goals', '[]'::jsonb,
      'preferences', jsonb_build_object(
        'communication_style', NULL,
        'focus_areas', '[]'::jsonb,
        'tone_preference', NULL
      ),
      'patterns', jsonb_build_object(
        'typical_topics', '[]'::jsonb,
        'engagement_patterns', NULL,
        'common_questions', '[]'::jsonb
      ),
      'career_context', jsonb_build_object(
        'role', NULL, 'industry', NULL, 'level', NULL, 'company_size', NULL
      )
    );
  END IF;

  -- Merge goals (append + dedup). Keep order.
  DECLARE
    patch_goals JSONB := COALESCE(p_patch->'goals', '[]'::jsonb);
    existing_goals JSONB := COALESCE(existing->'goals', '[]'::jsonb);
    new_goals JSONB := '[]'::jsonb;
    g TEXT;
    seen TEXT[] := '{}';
  BEGIN
    FOR g IN SELECT jsonb_array_elements_text(existing_goals) LOOP
      IF g IS NOT NULL AND g <> '' AND NOT (seen @> ARRAY[g]) THEN
        new_goals := new_goals || to_jsonb(g);
        seen := seen || g;
      END IF;
    END LOOP;
    FOR g IN SELECT jsonb_array_elements_text(patch_goals) LOOP
      IF g IS NOT NULL AND g <> '' AND NOT (seen @> ARRAY[g]) THEN
        new_goals := new_goals || to_jsonb(g);
        seen := seen || g;
      END IF;
    END LOOP;
    -- Cap goals length to last 30 entries so document doesn't grow unbounded.
    IF jsonb_array_length(new_goals) > 30 THEN
      new_goals := (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(new_goals) WITH ORDINALITY AS t(elem, n)
          ORDER BY n DESC
          LIMIT 30
        ) s
      );
    END IF;
    existing := jsonb_set(existing, '{goals}', new_goals);
  END;

  -- Merge preferences.focus_areas (append + dedup, same pattern as goals)
  DECLARE
    patch_focus JSONB := COALESCE(p_patch#>'{preferences,focus_areas}', '[]'::jsonb);
    existing_focus JSONB := COALESCE(existing#>'{preferences,focus_areas}', '[]'::jsonb);
    new_focus JSONB := '[]'::jsonb;
    f TEXT;
    seenf TEXT[] := '{}';
  BEGIN
    FOR f IN SELECT jsonb_array_elements_text(existing_focus) LOOP
      IF f IS NOT NULL AND f <> '' AND NOT (seenf @> ARRAY[f]) THEN
        new_focus := new_focus || to_jsonb(f);
        seenf := seenf || f;
      END IF;
    END LOOP;
    FOR f IN SELECT jsonb_array_elements_text(patch_focus) LOOP
      IF f IS NOT NULL AND f <> '' AND NOT (seenf @> ARRAY[f]) THEN
        new_focus := new_focus || to_jsonb(f);
        seenf := seenf || f;
      END IF;
    END LOOP;
    IF jsonb_array_length(new_focus) > 30 THEN
      new_focus := (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(new_focus) WITH ORDINALITY AS t(elem, n)
          ORDER BY n DESC
          LIMIT 30
        ) s
      );
    END IF;
    existing := jsonb_set(existing, '{preferences,focus_areas}', new_focus);
  END;

  -- Merge career_context: overwrite only non-empty values from patch.
  DECLARE
    patch_cc JSONB := COALESCE(p_patch->'career_context', '{}'::jsonb);
    k TEXT;
    v TEXT;
  BEGIN
    FOR k, v IN SELECT key, value FROM jsonb_each_text(patch_cc) LOOP
      IF v IS NOT NULL AND trim(v) <> '' THEN
        existing := jsonb_set(existing, ARRAY['career_context', k], to_jsonb(v));
      END IF;
    END LOOP;
  END;

  merged := existing;

  INSERT INTO nexus_semantic_memory (user_id, user_model, last_updated, update_count)
  VALUES (
    p_user_id,
    merged,
    now(),
    1
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    user_model    = EXCLUDED.user_model,
    last_updated  = now(),
    update_count  = nexus_semantic_memory.update_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ════════════════════════════════════════════════════════════════════
--  7. P2-1 Storage RLS extension: reports/ folder within chat-uploads
--     The existing chat-uploads owner-only RLS uses (storage.foldername(name))[1]
--     = auth.uid(), so any path of the form `reports/{user_id}/...` is
--     ALREADY owner-scoped because foldername()[1] = 'reports' and NOT
--     auth.uid(). We fix this with a second set of policies that ALSO
--     allows the `reports/{uid}/...` pattern: a path like
--     reports/{uid}/{document}.pdf matches when foldername(name)[2] = uid.
--     Using OR in a single policy is cleaner; we drop existing + recreate.
-- ════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS chat_uploads_owner_select ON storage.objects;
CREATE POLICY chat_uploads_owner_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'chat-uploads'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR
      (
        (storage.foldername(name))[1] = 'reports'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
    )
  );

DROP POLICY IF EXISTS chat_uploads_owner_insert ON storage.objects;
CREATE POLICY chat_uploads_owner_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-uploads'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR
      (
        (storage.foldername(name))[1] = 'reports'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
    )
  );

DROP POLICY IF EXISTS chat_uploads_owner_update ON storage.objects;
CREATE POLICY chat_uploads_owner_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'chat-uploads'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR
      (
        (storage.foldername(name))[1] = 'reports'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
    )
  );

DROP POLICY IF EXISTS chat_uploads_owner_delete ON storage.objects;
CREATE POLICY chat_uploads_owner_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'chat-uploads'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR
      (
        (storage.foldername(name))[1] = 'reports'
        AND array_length(storage.foldername(name), 1) >= 2
        AND (storage.foldername(name))[2] = (auth.uid())::text
      )
    )
  );
