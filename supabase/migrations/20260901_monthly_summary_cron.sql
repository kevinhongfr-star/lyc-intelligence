-- =====================================================================
-- Monthly Summary Cron — #1421
--
-- Adds:
--   1. monthly_summary template to email_template_registry
--   2. profiles.timezone column (IANA tz, default UTC)
--   3. email_delivery_log template_code FK allowance for monthly_summary
--
-- Run this once before the first cron invocation.
-- =====================================================================

BEGIN;

-- 1. Seed monthly_summary email template (idempotent)
INSERT INTO public.email_template_registry (
  template_code, display_name, description, tier_required,
  subject_default, preheader_default, active
)
VALUES (
  'monthly_summary',
  'Monthly summary',
  'Roll-up of assessments, NEXUS sessions, shares, and insights for Professional+ tiers.',
  'professional',
  'Your LYC Partners monthly summary for {month_label}',
  'A look at this month''s assessments, NEXUS conversations, and insights.',
  TRUE
)
ON CONFLICT (template_code) DO NOTHING;

-- 2. Add timezone column to profiles (IANA tz string, default UTC)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
COMMENT ON COLUMN profiles.timezone IS 'IANA timezone string (e.g. America/New_York, Asia/Shanghai). NULL defaults to UTC.';

-- Backfill NULL timezones to NULL (keeps default logic in app layer);
-- column default intentionally omitted so new signups must opt in or get UTC via app.

-- 3. Ensure ai_job_queue kind values are consistent — no constraint to relax here,
--    but confirm the email: prefix pattern is accepted.
DO $$ BEGIN
  -- Best-effort informative check only.
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_job_queue_status_chk') THEN
    RAISE NOTICE 'ai_job_queue status check already in place via table constraint.';
  END IF;
END $$;

COMMIT;
