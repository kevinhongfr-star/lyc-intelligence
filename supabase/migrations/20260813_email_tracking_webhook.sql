-- =====================================================================
-- #116 Delivery tracking: SendCloud webhook + status confirmation columns.
-- Idempotent (DO $$ IF NOT EXISTS) so repeat runs are safe.
--
-- Adds:
--   email_delivery_log.new columns: last_status, delivered_at, opened_at,
--     clicked_at, bounce_reason, status_history JSONB.
--   email_delivery_log.index: (provider_message_id) for webhook lookup.
--   (index was created in 20260813_email_delivery.sql; add a stronger one
--    here IF NOT EXISTS so migrations are cross-safe.)
--
-- SendCloud event types mapped to our last_status:
--   request          → queued / sent
--   delivered        → delivered
--   open             → opened  (increment opens counter too)
--   click            → clicked (increment clicks counter too)
--   soft_bounce      → soft_bounce
--   hard_bounce      → hard_bounce
--   invalid_email    → hard_bounce
--   spam             → complaint
--   unsubscribe      → complaint (future)
-- =====================================================================

BEGIN;

ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS last_status   TEXT NULL;

ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ NULL;

ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS opened_at     TIMESTAMPTZ NULL;

ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS clicked_at    TIMESTAMPTZ NULL;

ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS bounce_reason TEXT NULL;

ALTER TABLE public.email_delivery_log
  ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Delivery message_id index — webhook lookups. (Idempotent.)
CREATE INDEX IF NOT EXISTS email_delivery_log_provider_message_id_uniq_idx
  ON public.email_delivery_log (provider_message_id);

-- Tenant + time for dashboard queries
CREATE INDEX IF NOT EXISTS email_delivery_log_tenant_created_idx
  ON public.email_delivery_log (tenant_user_id, created_at DESC);

-- Status audit column consistency
ALTER TABLE public.email_delivery_log
  DROP CONSTRAINT IF EXISTS email_delivery_status_chk;
ALTER TABLE public.email_delivery_log
  ADD CONSTRAINT email_delivery_status_chk CHECK (
    status IN ('queued','sent','delivered','soft_bounce','hard_bounce','complaint','failed','skipped','opened','clicked')
  );

COMMENT ON COLUMN public.email_delivery_log.last_status     IS 'Most recent SendCloud webhook verb (delivered, opened, clicked, soft_bounce, hard_bounce, spam, request, …).';
COMMENT ON COLUMN public.email_delivery_log.status_history  IS 'Append-only array of {at, verb, data} events from SendCloud.';

COMMIT;
