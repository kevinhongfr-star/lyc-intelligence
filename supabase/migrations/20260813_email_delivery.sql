-- =====================================================================
-- #116 Email delivery tracking
-- 8 B2C email templates + send logs per attempt.
--
-- email_template_registry: 8 rows exactly matching B2C_EMAIL_KINDS
-- email_delivery_log:      1 row per send attempt (append-only writes, no updates)
-- email_bounces:           async webhook rows (SendCloud X-SMTPAPI callback)
--
-- RLS: users see their own logs; admins see all; anonymous nothing.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_template_registry (
  template_code     TEXT PRIMARY KEY,      -- welcome, assessment_complete, etc.
  display_name      TEXT NOT NULL,
  description       TEXT NULL,
  tier_required     TEXT NULL,
  subject_default   TEXT NOT NULL,
  preheader_default TEXT NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed 8 rows (upsert-safe)
INSERT INTO public.email_template_registry (template_code, display_name, description, tier_required, subject_default, preheader_default)
VALUES
  ('welcome',                      'Welcome',                        'Welcome + onboarding orientation for new accounts.', 'executive_introduction',
    'Welcome to LYC Partners — next steps with NEXUS',                                     'Your Executive Introduction assessment is complimentary and ready to start.'),
  ('assessment_complete',          'Assessment complete',          'Result-ready notification with open-in-browser CTA.', 'executive_introduction',
    'Your {assessment_title} assessment result is ready',                                        'See your score, dimension breakdown, and NEXUS insights inside.'),
  ('email_verification',           'Email verification',          'Click-this-link magic link sent during signup or change-email.', 'executive_introduction',
    'Verify your email to continue',                                                       'Verify your LYC Partners email address by clicking the link below.'),
  ('password_reset',               'Password reset',             'Expiring password reset link (30 min window).', 'executive_introduction',
    'Reset your LYC Partners password',                                                     'Click the link below to set a new password. This link expires in 30 minutes.'),
  ('upgrade_confirmation',         'Upgrade confirmation',       'Receipt-style copy summarising tier change + new benefits.', 'professional',
    'Upgrade confirmed — welcome to {tier_display_name}',                                        'Your new benefits are now active. Here is what changed and what to explore first.'),
  ('weekly_digest',                'Weekly digest',              'Roll-up of NEXUS conversations + assessment activity.', 'professional',
    'Your weekly LYC Partners digest',                                                        'Highlights from your week inside LYC Partners — NEXUS conversations and progress.'),
  ('nexus_conversation_summary',   'NEXUS conversation summary', 'Email follow-up when a long-running NEXUS session wraps.', 'professional',
    'Your NEXUS conversation summary',                                                        'A written record of your recent NEXUS session — key takeaways and suggested follow-ups.'),
  ('share_result',                 'Share result',               'Recipient receives score mini, 3 strengths, open link.', 'professional',
    '{sender_name} shared {assessment_title} with you',                                             'Open the full report in your browser — the sender included a personalised note.')
ON CONFLICT (template_code) DO NOTHING;

/* ───────────── email_delivery_log (append-only writes) ───────────── */
CREATE TABLE IF NOT EXISTS public.email_delivery_log (
  delivery_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id    UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  template_code     TEXT NOT NULL REFERENCES public.email_template_registry(template_code),

  from_name         TEXT NOT NULL,
  reply_to          TEXT NULL,
  to_addresses      TEXT[] NOT NULL,

  subject           TEXT NOT NULL,
  preheader         TEXT NULL,
  html_body_digest  TEXT NULL,   -- sha256 of the rendered HTML (dedupe/audit)
  has_attachment    BOOLEAN NOT NULL DEFAULT FALSE,

  provider          TEXT NOT NULL,        -- 'sendcloud' | 'console' | 'smtp_fallback'
  provider_message_id TEXT NULL,         -- provider's own id for webhook correlation
  status            TEXT NOT NULL DEFAULT 'queued'
                    CONSTRAINT email_delivery_status_chk
                    CHECK (status IN ('queued','sent','delivered','soft_bounce','hard_bounce','complaint','failed','skipped')),

  error_detail      TEXT NULL,
  opens             INT NOT NULL DEFAULT 0,
  clicks            INT NOT NULL DEFAULT 0,

  miles_debited     SMALLINT NOT NULL DEFAULT 0,
  tier_at_send      TEXT NULL,
  brand_pass        BOOLEAN NULL,

  scheduled_at      TIMESTAMPTZ NULL,
  sent_at           TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_delivery_log_tenant_idx
  ON public.email_delivery_log (tenant_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS email_delivery_log_template_idx
  ON public.email_delivery_log (template_code, created_at DESC);
CREATE INDEX IF NOT EXISTS email_delivery_log_provider_msg_idx
  ON public.email_delivery_log (provider_message_id);

ALTER TABLE public.email_delivery_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'email_delivery_user_see_own') THEN
    CREATE POLICY email_delivery_user_see_own
      ON public.email_delivery_log FOR SELECT
      USING (tenant_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'email_delivery_admin_all') THEN
    CREATE POLICY email_delivery_admin_all
      ON public.email_delivery_log FOR ALL
      USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;

/* ───────────── email_bounces (SendCloud webhook sink) ───────────── */
CREATE TABLE IF NOT EXISTS public.email_bounces (
  event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          TEXT NOT NULL,
  event_type        TEXT NOT NULL,      -- soft_bounce / hard_bounce / complaint / unsubscribe / delivered / open / click
  provider_message_id TEXT NULL,
  to_address        TEXT NULL,
  raw_payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_bounces_msg_idx ON public.email_bounces (provider_message_id, created_at DESC);

COMMIT;
