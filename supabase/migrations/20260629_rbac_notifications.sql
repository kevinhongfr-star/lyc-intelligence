-- ════════════════════════════════════════════════════════════════════════
-- 20260629_rbac_notifications.sql
-- DEX AI RBAC & Notification System — T7 Schema Migration
-- Implements: Technical Blueprint 07 (DEX-TB-007)
-- Role-based access control, permission overrides, audit log,
-- notifications, notification preferences, email queue
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. ROLE PERMISSIONS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            TEXT NOT NULL CHECK (role IN ('admin', 'team_lead', 'consultant', 'client')),
  resource        TEXT NOT NULL CHECK (resource IN (
                    'contacts', 'mandates', 'signals', 'agent_actions',
                    'pipeline_transitions', 'client_accounts', 'client_feedback',
                    'import', 'saved_searches', 'grid_reports', 'trident_scorecards',
                    'canvas_profiles', 'match_results', 'notifications', 'rbac_settings'
                  )),
  action          TEXT NOT NULL CHECK (action IN (
                    'create', 'read_own', 'read_all', 'update_own', 'update_any',
                    'delete', 'export', 'review', 'approve', 'administer'
                  )),
  allowed         BOOLEAN NOT NULL DEFAULT FALSE,
  conditions      JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON public.role_permissions(resource);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can read role permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

-- ── 2. PERMISSION OVERRIDES TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permission_overrides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource        TEXT NOT NULL,
  action          TEXT NOT NULL,
  allowed         BOOLEAN NOT NULL,
  reason          TEXT,
  granted_by      UUID NOT NULL REFERENCES auth.users(id),
  granted_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, resource, action)
);

CREATE INDEX IF NOT EXISTS idx_perm_overrides_user ON public.permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_perm_overrides_active ON public.permission_overrides(is_active)
  WHERE is_active = TRUE;

ALTER TABLE public.permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage overrides" ON public.permission_overrides
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can read own overrides" ON public.permission_overrides
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. PERMISSION AUDIT LOG TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permission_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by      UUID NOT NULL REFERENCES auth.users(id),
  changed_at      TIMESTAMPTZ DEFAULT now(),
  change_type     TEXT NOT NULL CHECK (change_type IN (
                    'role_permission_update', 'override_create', 'override_update',
                    'override_delete', 'role_change'
                  )),
  target_role     TEXT,
  target_user_id  UUID REFERENCES auth.users(id),
  resource        TEXT,
  action          TEXT,
  previous_value  JSONB,
  new_value       JSONB,
  reason          TEXT
);

CREATE INDEX IF NOT EXISTS idx_perm_audit_by ON public.permission_audit_log(changed_by, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_perm_audit_target_user ON public.permission_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_perm_audit_change_type ON public.permission_audit_log(change_type);

ALTER TABLE public.permission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log" ON public.permission_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 4. NOTIFICATIONS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN (
                        'pipeline_stage_change', 'gate_blocked', 'trident_review_needed',
                        'canvas_review_needed', 'client_feedback_received', 'client_access_granted',
                        'mandate_phase_change', 'stale_candidate', 'match_available',
                        'import_complete', 'dedup_needed', 'permission_changed',
                        'assignment_changed', 'mention'
                      )),
  priority            TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title               TEXT NOT NULL,
  content             TEXT,
  resource_type       TEXT,
  resource_id         UUID,
  actor_id            UUID REFERENCES auth.users(id),
  read                BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMPTZ,
  delivery_channels   JSONB NOT NULL DEFAULT '{"in_app": true, "email": false}'::jsonb,
  email_sent          BOOLEAN DEFAULT FALSE,
  email_sent_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  expires_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON public.notifications(recipient_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.notifications(recipient_id, created_at DESC)
  WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notif_type ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- ── 5. NOTIFICATION PREFERENCES TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type   TEXT NOT NULL,
  in_app_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- ── 6. EMAIL NOTIFICATION QUEUE TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_notification_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
  to_address          TEXT NOT NULL,
  to_name             TEXT,
  subject             TEXT NOT NULL,
  html_body           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts            INTEGER DEFAULT 0,
  max_attempts        INTEGER DEFAULT 3,
  last_attempt_at     TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  sent_at             TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_notification_queue(status, created_at);

ALTER TABLE public.email_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email queue" ON public.email_notification_queue
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 7. SEED DATA: DEFAULT PERMISSION MATRIX ────────────────────────────

-- ADMIN: full access to everything
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('admin', 'contacts', 'create', TRUE),
  ('admin', 'contacts', 'read_all', TRUE),
  ('admin', 'contacts', 'update_any', TRUE),
  ('admin', 'contacts', 'delete', TRUE),
  ('admin', 'contacts', 'export', TRUE),
  ('admin', 'mandates', 'create', TRUE),
  ('admin', 'mandates', 'read_all', TRUE),
  ('admin', 'mandates', 'update_any', TRUE),
  ('admin', 'mandates', 'delete', TRUE),
  ('admin', 'signals', 'create', TRUE),
  ('admin', 'signals', 'read_all', TRUE),
  ('admin', 'agent_actions', 'create', TRUE),
  ('admin', 'agent_actions', 'read_all', TRUE),
  ('admin', 'agent_actions', 'review', TRUE),
  ('admin', 'trident_scorecards', 'create', TRUE),
  ('admin', 'trident_scorecards', 'read_all', TRUE),
  ('admin', 'trident_scorecards', 'review', TRUE),
  ('admin', 'trident_scorecards', 'approve', TRUE),
  ('admin', 'canvas_profiles', 'create', TRUE),
  ('admin', 'canvas_profiles', 'read_all', TRUE),
  ('admin', 'canvas_profiles', 'update_any', TRUE),
  ('admin', 'canvas_profiles', 'export', TRUE),
  ('admin', 'canvas_profiles', 'review', TRUE),
  ('admin', 'client_accounts', 'create', TRUE),
  ('admin', 'client_accounts', 'read_all', TRUE),
  ('admin', 'client_accounts', 'update_any', TRUE),
  ('admin', 'client_accounts', 'delete', TRUE),
  ('admin', 'client_feedback', 'read_all', TRUE),
  ('admin', 'import', 'create', TRUE),
  ('admin', 'import', 'approve', TRUE),
  ('admin', 'grid_reports', 'create', TRUE),
  ('admin', 'grid_reports', 'read_all', TRUE),
  ('admin', 'grid_reports', 'export', TRUE),
  ('admin', 'match_results', 'read_all', TRUE),
  ('admin', 'match_results', 'create', TRUE),
  ('admin', 'rbac_settings', 'administer', TRUE),
  ('admin', 'notifications', 'read_all', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- TEAM_LEAD: read all, review agent actions, limited admin
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('team_lead', 'contacts', 'create', TRUE),
  ('team_lead', 'contacts', 'read_all', TRUE),
  ('team_lead', 'contacts', 'update_any', TRUE),
  ('team_lead', 'contacts', 'export', TRUE),
  ('team_lead', 'mandates', 'create', TRUE),
  ('team_lead', 'mandates', 'read_all', TRUE),
  ('team_lead', 'mandates', 'update_any', TRUE),
  ('team_lead', 'signals', 'create', TRUE),
  ('team_lead', 'signals', 'read_all', TRUE),
  ('team_lead', 'agent_actions', 'create', TRUE),
  ('team_lead', 'agent_actions', 'read_all', TRUE),
  ('team_lead', 'agent_actions', 'review', TRUE),
  ('team_lead', 'trident_scorecards', 'create', TRUE),
  ('team_lead', 'trident_scorecards', 'read_all', TRUE),
  ('team_lead', 'trident_scorecards', 'review', TRUE),
  ('team_lead', 'canvas_profiles', 'create', TRUE),
  ('team_lead', 'canvas_profiles', 'read_all', TRUE),
  ('team_lead', 'canvas_profiles', 'export', TRUE),
  ('team_lead', 'canvas_profiles', 'review', TRUE),
  ('team_lead', 'client_accounts', 'read_all', TRUE),
  ('team_lead', 'client_feedback', 'read_all', TRUE),
  ('team_lead', 'import', 'create', TRUE),
  ('team_lead', 'import', 'approve', TRUE),
  ('team_lead', 'grid_reports', 'create', TRUE),
  ('team_lead', 'grid_reports', 'read_all', TRUE),
  ('team_lead', 'grid_reports', 'export', TRUE),
  ('team_lead', 'match_results', 'read_all', TRUE),
  ('team_lead', 'match_results', 'create', TRUE),
  ('team_lead', 'notifications', 'read_all', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- CONSULTANT: own records + team read
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('consultant', 'contacts', 'create', TRUE),
  ('consultant', 'contacts', 'read_all', TRUE),
  ('consultant', 'contacts', 'update_own', TRUE),
  ('consultant', 'mandates', 'read_all', TRUE),
  ('consultant', 'signals', 'create', TRUE),
  ('consultant', 'signals', 'read_own', TRUE),
  ('consultant', 'agent_actions', 'create', TRUE),
  ('consultant', 'agent_actions', 'read_own', TRUE),
  ('consultant', 'trident_scorecards', 'create', TRUE),
  ('consultant', 'trident_scorecards', 'read_all', TRUE),
  ('consultant', 'canvas_profiles', 'create', TRUE),
  ('consultant', 'canvas_profiles', 'read_own', TRUE),
  ('consultant', 'canvas_profiles', 'export', TRUE),
  ('consultant', 'client_feedback', 'read_own', TRUE),
  ('consultant', 'import', 'create', TRUE),
  ('consultant', 'saved_searches', 'create', TRUE),
  ('consultant', 'saved_searches', 'read_own', TRUE),
  ('consultant', 'grid_reports', 'read_all', TRUE),
  ('consultant', 'match_results', 'read_own', TRUE),
  ('consultant', 'notifications', 'read_own', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- CLIENT: very restricted, only see assigned mandates and feedback
INSERT INTO role_permissions (role, resource, action, allowed) VALUES
  ('client', 'contacts', 'read_own', TRUE),
  ('client', 'mandates', 'read_own', TRUE),
  ('client', 'client_feedback', 'create', TRUE),
  ('client', 'client_feedback', 'read_own', TRUE),
  ('client', 'canvas_profiles', 'read_own', TRUE),
  ('client', 'notifications', 'read_own', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;

-- ── 8. DEFAULT NOTIFICATION PREFERENCES (seed via function on user creation) ──
CREATE OR REPLACE FUNCTION seed_default_notification_prefs() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, notification_type, in_app_enabled, email_enabled)
  VALUES
    (NEW.id, 'pipeline_stage_change', TRUE, FALSE),
    (NEW.id, 'gate_blocked', TRUE, TRUE),
    (NEW.id, 'trident_review_needed', TRUE, TRUE),
    (NEW.id, 'canvas_review_needed', TRUE, FALSE),
    (NEW.id, 'client_feedback_received', TRUE, TRUE),
    (NEW.id, 'client_access_granted', TRUE, TRUE),
    (NEW.id, 'mandate_phase_change', TRUE, FALSE),
    (NEW.id, 'stale_candidate', TRUE, FALSE),
    (NEW.id, 'match_available', TRUE, FALSE),
    (NEW.id, 'import_complete', TRUE, FALSE),
    (NEW.id, 'dedup_needed', TRUE, FALSE),
    (NEW.id, 'permission_changed', TRUE, TRUE),
    (NEW.id, 'assignment_changed', TRUE, FALSE),
    (NEW.id, 'mention', TRUE, TRUE)
  ON CONFLICT (user_id, notification_type) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (If profiles table exists, trigger would be added here)
