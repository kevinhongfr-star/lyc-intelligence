-- =====================================================================
-- #100 / #1345 — B2C Assessment AI Triggers: job queue + audit log tables
-- Run AFTER: 20260812_assessment_domain_tables.sql and 20260813_rls_tier_policies.sql
--
-- Consolidated design (Vercel Hobby 12 fn cap):
--   • single edge/worker route (api/workers/[job].ts) polls ai_job_queue
--   • picks up ai-trigger and email-send jobs in the same dequeue loop
--
-- Jobs table — ai_job_queue:
--   kind = 'ai-trigger' | 'email-send' | 'scheduled:weekly-digest'
--              | 'scheduled:monthly-summary' | 'scheduled:3day-checkin'
--   status = queued | claimed | completed | failed | cancelled
--   attempt_count — retry on transient failures
--   available_at — defer execution (schedule support)
--
-- ai_job_audit — per-row immutable append-only history
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_job_queue (
  job_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  kind              TEXT NOT NULL,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,

  status            TEXT NOT NULL DEFAULT 'queued'
                    CONSTRAINT ai_job_queue_status_chk
                    CHECK (status IN ('queued','claimed','completed','failed','cancelled')),

  attempt_count     SMALLINT NOT NULL DEFAULT 0,
  max_attempts      SMALLINT NOT NULL DEFAULT 5,

  priority          SMALLINT NOT NULL DEFAULT 50,

  claimed_by        TEXT NULL,         -- worker instance id
  claimed_at        TIMESTAMPTZ NULL,
  available_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  result            JSONB NULL,        -- structured output (e.g. generation_id, delivery_id)
  last_error        TEXT NULL,

  created_by_user   UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_user_id    UUID NULL,         -- user whose data / email this job concerns

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_job_queue_poll_idx
  ON public.ai_job_queue (status, available_at, priority, kind);
CREATE INDEX IF NOT EXISTS ai_job_queue_tenant_idx
  ON public.ai_job_queue (tenant_user_id, status);
CREATE INDEX IF NOT EXISTS ai_job_queue_kind_status_idx
  ON public.ai_job_queue (kind, status);

/* updated_at touch for ai_job_queue (reuses the existing touch_updated_at
 * trigger function from 20260812_assessment_domain_tables.sql — if missing
 * the trigger creation below wraps in DO block as a best-effort). */
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'touch_updated_at') THEN
    DROP TRIGGER IF EXISTS ai_job_queue_touch_updated_at ON public.ai_job_queue;
    CREATE TRIGGER ai_job_queue_touch_updated_at
      BEFORE UPDATE ON public.ai_job_queue
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END $$;

-- RLS on ai_job_queue — users may only enqueue jobs for themselves.
-- Worker / admin roles bypass via claim_ai_job function below.
ALTER TABLE public.ai_job_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'ai_job_queue_user_self_enqueue') THEN
    CREATE POLICY ai_job_queue_user_self_enqueue
      ON public.ai_job_queue FOR INSERT
      WITH CHECK (created_by_user = auth.uid() OR created_by_user IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'ai_job_queue_user_own_read') THEN
    CREATE POLICY ai_job_queue_user_own_read
      ON public.ai_job_queue FOR SELECT
      USING (tenant_user_id = auth.uid() OR created_by_user = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'ai_job_queue_admin_all') THEN
    CREATE POLICY ai_job_queue_admin_all
      ON public.ai_job_queue FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

/* Claim helper — worker function calls this to atomically dequeue a row. */
CREATE OR REPLACE FUNCTION public.claim_next_ai_job(
  in_kind          TEXT,
  in_worker_id     TEXT,
  in_claim_window  INTERVAL DEFAULT '5 minutes'
) RETURNS public.ai_job_queue AS $$
DECLARE
  job public.ai_job_queue;
BEGIN
  SELECT *
    INTO job
    FROM public.ai_job_queue
   WHERE (kind = in_kind OR in_kind IS NULL)
     AND status = 'queued'
     AND available_at <= NOW()
   ORDER BY priority ASC, created_at ASC
   LIMIT 1
     FOR UPDATE SKIP LOCKED;

  IF job.job_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.ai_job_queue
     SET status        = 'claimed',
         claimed_at    = NOW(),
         claimed_by    = in_worker_id,
         attempt_count = attempt_count + 1,
         available_at  = NOW() + in_claim_window
   WHERE job_id = job.job_id
   RETURNING * INTO job;

  RETURN job;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

/* Resolve helper — marks a job complete/failed; extends retry. */
CREATE OR REPLACE FUNCTION public.resolve_ai_job(
  in_job_id     UUID,
  in_status     TEXT,
  in_result     JSONB DEFAULT NULL,
  in_last_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.ai_job_queue
     SET status     = in_status,
         result     = COALESCE(in_result, result),
         last_error = in_last_error,
         claimed_by = NULL,
         claimed_at = NULL
   WHERE job_id = in_job_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

COMMIT;
