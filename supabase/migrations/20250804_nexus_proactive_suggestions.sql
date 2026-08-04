-- S7-T05 (N5): Nexus Proactive Suggestions
-- Stores context-aware suggestions generated from trigger events (stage change,
-- new matching mandate, assessment completion). Each suggestion is surfaced to
-- the user via the notifications system AND persisted here for the Journey
-- Dashboard (S7-T06) to display.

CREATE TABLE IF NOT EXISTS public.nexus_proactive_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What kind of trigger produced this suggestion?
  --   stage_change         — candidate pipeline stage advanced
  --   new_match            — new high-score mandate match surfaced
  --   assessment_complete  — Nexus diagnostic milestone reached
  --   profile_strength     — semantic memory flagged a strength
  --   stale_conversation   — user hasn't returned in N days
  trigger_type    TEXT NOT NULL CHECK (
    trigger_type IN ('stage_change','new_match','assessment_complete','profile_strength','stale_conversation')
  ),

  -- Polymorphic link to the triggering entity (mandate_id, contact_id, conversation_id, memory_id).
  trigger_resource_type TEXT,
  trigger_resource_id   UUID,

  -- Suggestion payload (what the user sees).
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  cta_label       TEXT,           -- e.g. "Prepare for interview"
  cta_link        TEXT,           -- e.g. "/dex/chat?topic=interview_prep"

  -- Lifecycle.
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','dismissed','acted_on','expired')),
  priority        TEXT NOT NULL DEFAULT 'normal'
                  CHECK (priority IN ('low','normal','high','urgent')),
  expires_at      TIMESTAMPTZ,    -- optional: suggestion is no longer relevant after this time

  -- Cross-link to the notification row (RBAC notifications table) so the
  -- notification bell and the suggestions panel stay in sync.
  notification_id UUID,

  -- Analytics.
  delivered_at    TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  acted_on_at     TIMESTAMPTZ,

  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_proactive_suggestions_user
  ON public.nexus_proactive_suggestions (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_proactive_suggestions_trigger
  ON public.nexus_proactive_suggestions (trigger_type, created_at DESC);

-- RLS: users can read + update their own suggestions; service role full access.
ALTER TABLE public.nexus_proactive_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY nexus_proactive_suggestions_owner_read
  ON public.nexus_proactive_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY nexus_proactive_suggestions_owner_update
  ON public.nexus_proactive_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- The notifications table (RBAC schema, 20260629_rbac_notifications.sql) has a
-- CHECK constraint on `type`. We add a `nexus_suggestion` value so proactive
-- suggestions can flow through the standard notification bell. Drop + recreate
-- the constraint to extend the allowed set (idempotent).
DO $$
BEGIN
  -- Only attempt if the constraint exists (RBAC notifications schema deployed).
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
      AND conrelid = 'public.notifications'::regclass
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (
      type IN (
        'pipeline_stage_change','gate_blocked','trident_review_needed',
        'canvas_review_needed','client_feedback_received','client_access_granted',
        'mandate_phase_change','stale_candidate','match_available','import_complete',
        'dedup_needed','permission_changed','assignment_changed','mention',
        'nexus_suggestion'
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'notifications_type_check extension skipped: %', SQLERRM;
END $$;

-- Auto-update updated_at.
CREATE OR REPLACE FUNCTION public.tg_nexus_proactive_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nexus_proactive_suggestions_updated_at
  ON public.nexus_proactive_suggestions;
CREATE TRIGGER trg_nexus_proactive_suggestions_updated_at
  BEFORE UPDATE ON public.nexus_proactive_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.tg_nexus_proactive_suggestions_updated_at();
