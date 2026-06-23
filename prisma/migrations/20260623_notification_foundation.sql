-- Phase 7.3: Notification Foundation Migration
-- Centralized notification system with preferences

-- Notifications table (create if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) UNIQUE,
  -- Per notification type preferences: 'email', 'in_app', 'both', 'none'
  feedback_received text DEFAULT 'both',
  candidate_advanced text DEFAULT 'in_app',
  interview_scheduled text DEFAULT 'both',
  new_candidate_added text DEFAULT 'in_app',
  report_ready text DEFAULT 'both',
  reference_submitted text DEFAULT 'both',
  offer_status_changed text DEFAULT 'both',
  milestone_at_risk text DEFAULT 'both',
  message_received text DEFAULT 'both',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Users can view their own preferences
CREATE POLICY "Users can view their preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update their preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert their preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());