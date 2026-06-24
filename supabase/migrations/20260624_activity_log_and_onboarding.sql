-- Activity Log Table
-- Tracks consultant activity for dashboard, performance review, and analytics

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_log_read ON activity_log
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY activity_log_insert ON activity_log
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_mandate_id ON activity_log(mandate_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON activity_log(action_type);

-- Onboarding completed column for profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

COMMENT ON TABLE activity_log IS 'Audit log of consultant actions: scoring, pipeline updates, Nexus chats, document uploads';
COMMENT ON COLUMN activity_log.action_type IS 'Type of action: scoring_session, nexus_chat, pipeline_update, document_upload, mandate_create, interview_schedule';
