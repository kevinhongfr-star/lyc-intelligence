-- ════════════════════════════════════════════════════════════════════════
-- 20260629_wechat_email_integration.sql
-- DEX AI WeChat & Email Integration — T9 Schema Migration
-- Implements: Technical Blueprint 09 (DEX-TB-009)
-- Outlook Graph API email, WeChat structured logging, unified timeline, templates
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. CHANNEL_ACCOUNTS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.channel_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel               TEXT NOT NULL CHECK (channel IN ('outlook', 'wecom', 'wechat_manual')),
  account_email         TEXT,
  account_name          TEXT,
  access_token_enc      TEXT,
  refresh_token_enc     TEXT,
  token_expires_at      TIMESTAMPTZ,
  graph_user_id         TEXT,
  graph_tenant_id       TEXT,
  wecom_corp_id         TEXT,
  wecom_user_id         TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  last_sync_at          TIMESTAMPTZ,
  sync_status           TEXT DEFAULT 'idle'
                        CHECK (sync_status IN ('idle', 'syncing', 'error', 'auth_expired')),
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, channel, account_email)
);

CREATE INDEX IF NOT EXISTS idx_channel_user ON public.channel_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_active ON public.channel_accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_channel_sync ON public.channel_accounts(sync_status)
  WHERE sync_status IN ('error', 'auth_expired');

ALTER TABLE public.channel_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON public.channel_accounts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can manage own accounts" ON public.channel_accounts
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── 2. EMAIL_SYNC_STATE TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_sync_state (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id    UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  last_sync_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_delta_link       TEXT,
  total_synced          INTEGER DEFAULT 0,
  last_error            TEXT,
  last_error_at         TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_account_id)
);

ALTER TABLE public.email_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sync state" ON public.email_sync_state
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view sync state" ON public.email_sync_state
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 3. EMAIL_THREADS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_threads (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                  UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  mandate_id                  UUID REFERENCES public.mandates(id) ON DELETE SET NULL,
  owner_id                    UUID NOT NULL REFERENCES auth.users(id),
  graph_thread_id             TEXT,
  graph_message_id            TEXT,
  subject                     TEXT NOT NULL,
  from_address                TEXT NOT NULL,
  to_addresses                TEXT[] NOT NULL,
  cc_addresses                TEXT[],
  status                      TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN (
                                'draft', 'sent', 'replied', 'closed', 'bounced'
                              )),
  last_message_at             TIMESTAMPTZ,
  message_count               INTEGER DEFAULT 1,
  is_linked_to_candidate      BOOLEAN DEFAULT FALSE,
  linked_at                   TIMESTAMPTZ,
  linked_by                   UUID REFERENCES auth.users(id),
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now(),
  metadata                    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_thread_contact ON public.email_threads(contact_id)
  WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_thread_owner ON public.email_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_email_thread_status ON public.email_threads(status);
CREATE INDEX IF NOT EXISTS idx_email_thread_graph ON public.email_threads(graph_thread_id)
  WHERE graph_thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_thread_last_msg ON public.email_threads(last_message_at DESC);

ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email threads" ON public.email_threads
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
    )
  );

CREATE POLICY "Users can create email threads" ON public.email_threads
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own email threads" ON public.email_threads
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- ── 4. EMAIL_MESSAGES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_messages (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id                   UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  graph_message_id            TEXT UNIQUE,
  from_address                TEXT NOT NULL,
  to_addresses                TEXT[] NOT NULL,
  cc_addresses                TEXT[],
  bcc_addresses               TEXT[],
  subject                     TEXT NOT NULL,
  body_text                   TEXT,
  body_html                   TEXT,
  body_preview                TEXT,
  direction                   TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_reply                    BOOLEAN DEFAULT FALSE,
  sent_at                     TIMESTAMPTZ NOT NULL,
  received_at                 TIMESTAMPTZ,
  is_processed                BOOLEAN DEFAULT FALSE,
  processed_at                TIMESTAMPTZ,
  outreach_log_id             UUID REFERENCES public.candidate_outreach_log(id),
  has_attachments             BOOLEAN DEFAULT FALSE,
  attachment_count            INTEGER DEFAULT 0,
  attachments                 JSONB DEFAULT '[]'::jsonb,
  metadata                    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_msg_thread ON public.email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_msg_graph ON public.email_messages(graph_message_id)
  WHERE graph_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_msg_unprocessed ON public.email_messages(is_processed)
  WHERE is_processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_email_msg_direction ON public.email_messages(direction);
CREATE INDEX IF NOT EXISTS idx_email_msg_sent ON public.email_messages(sent_at DESC);

ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own threads" ON public.email_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.email_threads
      WHERE id = thread_id
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'team_lead')
          )
        )
    )
  );

CREATE POLICY "Users can create messages" ON public.email_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── 5. WECHAT_INTERACTIONS TABLE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wechat_interactions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                  UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  logged_by                   UUID NOT NULL REFERENCES auth.users(id),
  interaction_type            TEXT NOT NULL
                              CHECK (interaction_type IN (
                                'message_sent', 'message_received', 'voice_call', 'video_call',
                                'friend_request_sent', 'friend_request_accepted', 'moment_interaction',
                                'group_mention', 'file_shared', 'wecom_message_sent', 'wecom_message_received'
                              )),
  summary                     TEXT NOT NULL,
  content                     TEXT,
  wechat_id                   TEXT,
  outcome                     TEXT CHECK (outcome IN (
                                'positive', 'neutral', 'negative', 'follow_up_needed', 'scheduled'
                              )),
  triggers_stage_change       BOOLEAN DEFAULT FALSE,
  suggested_stage             TEXT CHECK (suggested_stage IN (
                                'S5_Responded', 'S6_WeChat_Added', 'S7_Interested',
                                'S9_Call_Positive', 'S10_Call_Negative', NULL
                              )),
  occurred_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  outreach_log_id             UUID REFERENCES public.candidate_outreach_log(id),
  signal_id                   UUID REFERENCES public.signals(id),
  has_media                   BOOLEAN DEFAULT FALSE,
  media_type                  TEXT CHECK (media_type IN ('image', 'voice', 'video', 'file', NULL)),
  media_url                   TEXT,
  metadata                    JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_wechat_contact ON public.wechat_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_wechat_logged_by ON public.wechat_interactions(logged_by);
CREATE INDEX IF NOT EXISTS idx_wechat_type ON public.wechat_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_wechat_occurred ON public.wechat_interactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_wechat_unlinked ON public.wechat_interactions(outreach_log_id)
  WHERE outreach_log_id IS NULL;

ALTER TABLE public.wechat_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view WeChat interactions" ON public.wechat_interactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team can create WeChat interactions" ON public.wechat_interactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own WeChat interactions" ON public.wechat_interactions
  FOR UPDATE TO authenticated
  USING (logged_by = auth.uid());

-- ── 6. EMAIL_TEMPLATES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_templates (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by                  UUID NOT NULL REFERENCES auth.users(id),
  name                        TEXT NOT NULL,
  subject_template            TEXT NOT NULL,
  body_template               TEXT NOT NULL,
  variables                   JSONB DEFAULT '[]'::jsonb,
  category                    TEXT DEFAULT 'outreach'
                              CHECK (category IN (
                                'cold_outreach', 'follow_up', 'interview_schedule',
                                'offer', 'rejection', 'thank_you', 'general', 'wechat_follow_up'
                              )),
  is_shared                   BOOLEAN DEFAULT FALSE,
  usage_count                 INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tpl_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_tpl_shared ON public.email_templates(is_shared)
  WHERE is_shared = TRUE;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own + shared templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_shared = TRUE);

CREATE POLICY "Users can manage own templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- ── 7. SEED: Default Email Templates ───────────────────────────────────
INSERT INTO email_templates (created_by, name, subject_template, body_template, variables, category, is_shared)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Cold Outreach — Introduction',
    '{{company_name}} Opportunity — {{candidate_name}}',
    '<p>Hi {{candidate_name}},</p>
<p>I hope this email finds you well. I came across your background at {{current_company}} and was impressed by your experience in {{industry}}.</p>
<p>I wanted to share an exciting opportunity with {{client_company}} for the {{role_title}} position. Given your expertise in {{key_skill}}, I think you would be a strong fit.</p>
<p>Would you be open to a brief call to discuss this further?</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","company_name","current_company","industry","client_company","role_title","key_skill","sender_name"]',
    'cold_outreach',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Follow Up — No Response',
    'Following up: {{role_title}} opportunity at {{client_company}}',
    '<p>Hi {{candidate_name}},</p>
<p>I wanted to follow up on my previous email about the {{role_title}} role at {{client_company}}.</p>
<p>I understand you are busy, but I would love to hear your thoughts. If this is not the right time, please let me know and I will check back later.</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","role_title","client_company","sender_name"]',
    'follow_up',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Interview Schedule',
    'Interview Confirmed — {{role_title}} on {{interview_date}}',
    '<p>Hi {{candidate_name}},</p>
<p>Great news! Your interview for the {{role_title}} position at {{client_company}} has been scheduled.</p>
<p><strong>Details:</strong><br>
Date: {{interview_date}}<br>
Time: {{interview_time}}<br>
Format: {{interview_format}}<br>
Interviewer: {{interviewer_name}}</p>
<p>Let me know if you need anything to prepare.</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","role_title","client_company","interview_date","interview_time","interview_format","interviewer_name","sender_name"]',
    'interview_schedule',
    TRUE
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Thank You — After Interview',
    'Thank you for your time — {{role_title}} discussion',
    '<p>Hi {{candidate_name}},</p>
<p>Thank you for taking the time to speak today about the {{role_title}} role at {{client_company}}.</p>
<p>I really enjoyed our conversation and I believe your experience aligns well with what they are looking for.</p>
<p>I will be in touch with feedback shortly.</p>
<p>Best regards,<br>{{sender_name}}</p>',
    '["candidate_name","role_title","client_company","sender_name"]',
    'thank_you',
    TRUE
  )
ON CONFLICT DO NOTHING;
