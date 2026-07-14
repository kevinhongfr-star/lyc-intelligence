-- ============================================================================
-- v2 Batch 9 — Analytics, Search, Audit, API Keys, Webhooks
-- Tickets 81-90 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 81: Saved views table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_saved_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'companies', 'mandates', 'candidates', 'deals', 'tasks',
    'activities', 'contacts', 'intelligence', 'placements', 'dashboard'
  )),
  view_type TEXT DEFAULT 'list'
    CHECK (view_type IN ('list', 'kanban', 'calendar', 'chart', 'table', 'custom')),
  filters JSONB DEFAULT '{}',
  sort_config JSONB DEFAULT '{}',
  column_config JSONB DEFAULT '{}',
  group_by TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_saved_views_org ON public.v2_saved_views(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_saved_views_user ON public.v2_saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_saved_views_entity ON public.v2_saved_views(entity_type);
CREATE INDEX IF NOT EXISTS idx_v2_saved_views_shared ON public.v2_saved_views(org_id, is_shared);

ALTER TABLE public.v2_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved views"
  ON public.v2_saved_views FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_shared = true AND org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    ))
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create saved views"
  ON public.v2_saved_views FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved views"
  ON public.v2_saved_views FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Admins can manage all saved views"
  ON public.v2_saved_views FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_saved_views.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_saved_views_updated_at ON public.v2_saved_views;
CREATE TRIGGER trg_v2_saved_views_updated_at
  BEFORE UPDATE ON public.v2_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 82: Audit logs table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN (
    'create', 'update', 'delete', 'restore', 'export', 'import',
    'login', 'logout', 'share', 'assign', 'status_change', 'permission_change',
    'view', 'download', 'upload', 'archive', 'unarchive'
  )),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  changes JSONB DEFAULT '{}',
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  session_id TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v2_audit_org ON public.v2_audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_audit_user ON public.v2_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_audit_entity ON public.v2_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_v2_audit_action ON public.v2_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_v2_audit_created ON public.v2_audit_logs(created_at DESC);

ALTER TABLE public.v2_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.v2_audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_audit_logs.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON public.v2_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage audit logs"
  ON public.v2_audit_logs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- ── Ticket 83: Search history table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  search_query TEXT NOT NULL,
  search_type TEXT CHECK (search_type IN (
    'companies', 'candidates', 'mandates', 'contacts', 'deals',
    'intelligence', 'global', 'tags', 'activities'
  )),
  filters JSONB DEFAULT '{}',
  result_count INTEGER,
  result_types JSONB DEFAULT '{}',
  is_saved BOOLEAN DEFAULT FALSE,
  saved_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_v2_search_org ON public.v2_search_history(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_search_user ON public.v2_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_search_type ON public.v2_search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_v2_search_created ON public.v2_search_history(created_at DESC);

ALTER TABLE public.v2_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search history"
  ON public.v2_search_history FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create search history"
  ON public.v2_search_history FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own search history"
  ON public.v2_search_history FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all search history"
  ON public.v2_search_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

-- ── Ticket 84: API keys table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] DEFAULT '{}' CHECK (
    -- At least one scope must be provided
    array_length(scopes, 1) > 0
  ),
  permissions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'expired', 'suspended')),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  last_used_user_agent TEXT,
  usage_count INTEGER DEFAULT 0,
  rate_limit_per_minute INTEGER DEFAULT 60,
  ip_whitelist INET[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_api_keys_org ON public.v2_api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_api_keys_hash ON public.v2_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_v2_api_keys_status ON public.v2_api_keys(status);
CREATE INDEX IF NOT EXISTS idx_v2_api_keys_expires ON public.v2_api_keys(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.v2_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view API keys"
  ON public.v2_api_keys FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_api_keys.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Org admins can manage API keys"
  ON public.v2_api_keys FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_api_keys.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_api_keys_updated_at ON public.v2_api_keys;
CREATE TRIGGER trg_v2_api_keys_updated_at
  BEFORE UPDATE ON public.v2_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 85: Webhooks table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  events TEXT[] DEFAULT '{}' CHECK (
    array_length(events, 1) > 0
  ),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'disabled', 'error')),
  secret TEXT,
  headers JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 30,
  last_triggered_at TIMESTAMPTZ,
  last_response_status INTEGER,
  last_response_body TEXT,
  last_error TEXT,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  is_ssl_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_webhooks_org ON public.v2_webhooks(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_webhooks_status ON public.v2_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_v2_webhooks_events ON public.v2_webhooks USING GIN(events);

ALTER TABLE public.v2_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view webhooks"
  ON public.v2_webhooks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_webhooks.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Org admins can manage webhooks"
  ON public.v2_webhooks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_webhooks.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_webhooks_updated_at ON public.v2_webhooks;
CREATE TRIGGER trg_v2_webhooks_updated_at
  BEFORE UPDATE ON public.v2_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 86: Dashboard configs table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.v2_dashboard_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.v2_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  dashboard_type TEXT CHECK (dashboard_type IN (
    'consultant', 'manager', 'admin', 'client', 'council',
    'candidate', 'executive', 'custom'
  )),
  layout JSONB DEFAULT '[]',
  widgets JSONB DEFAULT '[]',
  filters JSONB DEFAULT '{}',
  date_range TEXT DEFAULT '30d'
    CHECK (date_range IN ('today', '7d', '30d', '90d', 'ytd', 'all', 'custom')),
  custom_date_start DATE,
  custom_date_end DATE,
  is_shared BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  refresh_interval_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_v2_dashboards_org ON public.v2_dashboard_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_v2_dashboards_user ON public.v2_dashboard_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_v2_dashboards_type ON public.v2_dashboard_configs(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_v2_dashboards_shared ON public.v2_dashboard_configs(org_id, is_shared);

ALTER TABLE public.v2_dashboard_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dashboards"
  ON public.v2_dashboard_configs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_shared = true AND org_id IN (
      SELECT org_id FROM public.v2_org_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    ))
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create dashboards"
  ON public.v2_dashboard_configs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own dashboards"
  ON public.v2_dashboard_configs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Admins can manage all dashboards"
  ON public.v2_dashboard_configs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.v2_org_memberships
      WHERE user_id = auth.uid()
        AND org_id = v2_dashboard_configs.org_id
        AND role IN ('super_admin', 'admin')
        AND status = 'active'
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_v2_dashboards_updated_at ON public.v2_dashboard_configs;
CREATE TRIGGER trg_v2_dashboards_updated_at
  BEFORE UPDATE ON public.v2_dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 87: RLS policies for saved_views ────────────────────────────────
-- Defined inline with v2_saved_views above.

-- ── Ticket 88: RLS policies for audit_logs ─────────────────────────────────
-- Defined inline with v2_audit_logs above.

-- ── Ticket 89: Indexes & constraints for infrastructure tables ─────────────
-- All indexes and constraints defined inline:
--   v2_saved_views: 4 indexes (org, user, entity, shared)
--   v2_audit_logs: 5 indexes (org, user, entity, action, created DESC)
--   v2_search_history: 4 indexes (org, user, type, created DESC)
--   v2_api_keys: 4 indexes (org, hash, status, expires partial)
--   v2_webhooks: 3 indexes (org, status, events GIN)
--   v2_dashboard_configs: 4 indexes (org, user, type, shared)
--   UNIQUE constraints: v2_api_keys(key_hash)
--   CHECK constraints: api_keys scopes non-empty, webhooks events non-empty

-- ── Ticket 90: Triggers for infrastructure tables ──────────────────────────
-- 4 tables have updated_at triggers (audit_logs & search_history are append-only):
--   trg_v2_saved_views_updated_at, trg_v2_api_keys_updated_at,
--   trg_v2_webhooks_updated_at, trg_v2_dashboards_updated_at
