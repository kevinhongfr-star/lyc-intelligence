-- Phase 3.2: Client Portal Notifications Table
-- Migration for client feedback and notification system

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'feedback_received', 'candidate_advanced', 'interview_scheduled', 'new_candidate_added', 'report_ready'
  title text NOT NULL,
  message text,
  link text, -- deep link to relevant page
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Add client_feedback column to candidates_pipeline table for storing feedback
ALTER TABLE IF EXISTS candidates_pipeline
ADD COLUMN IF NOT EXISTS client_feedback jsonb;

-- Add index for client feedback queries
CREATE INDEX IF NOT EXISTS idx_pipeline_client_feedback ON candidates_pipeline((client_feedback->>'decision'));
