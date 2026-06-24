-- Phase 0.6: NEXUS ↔ DEX Sync Contract
-- Event outbox, event log, and sync state tables

-- Event outbox for reliable delivery (Transactional Outbox Pattern)
CREATE TABLE IF NOT EXISTS nexus_event_outbox (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

-- Index for retry job
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON nexus_event_outbox(status, created_at)
  WHERE status IN ('pending', 'retrying', 'failed');

CREATE INDEX IF NOT EXISTS idx_outbox_next_retry ON nexus_event_outbox(next_retry_at)
  WHERE status IN ('pending', 'retrying', 'failed') AND next_retry_at IS NOT NULL;

-- RLS: only service role can access
ALTER TABLE nexus_event_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_outbox" ON nexus_event_outbox
  FOR ALL USING (false);

-- Event log (audit trail)
CREATE TABLE IF NOT EXISTS nexus_event_log (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  payload JSONB NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status INTEGER,
  response_body TEXT,
  direction TEXT NOT NULL DEFAULT 'dex_to_nexus'
    CHECK (direction IN ('dex_to_nexus', 'nexus_to_dex'))
);

CREATE INDEX IF NOT EXISTS idx_event_log_org ON nexus_event_log(org_id, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_type ON nexus_event_log(event_type, delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_direction ON nexus_event_log(direction, delivered_at DESC);

ALTER TABLE nexus_event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_events" ON nexus_event_log
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Sync state tracking (last successful sync per entity)
CREATE TABLE IF NOT EXISTS nexus_sync_state (
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_event_id UUID,
  sync_status TEXT NOT NULL DEFAULT 'synced'
    CHECK (sync_status IN ('synced', 'pending', 'failed', 'conflict')),
  PRIMARY KEY (org_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_state_org ON nexus_sync_state(org_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_state_pending ON nexus_sync_state(sync_status)
  WHERE sync_status IN ('pending', 'failed');

ALTER TABLE nexus_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_sync_state" ON nexus_sync_state
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::UUID);

-- Command log (incoming commands from NEXUS)
CREATE TABLE IF NOT EXISTS nexus_command_log (
  id BIGSERIAL PRIMARY KEY,
  command_id UUID NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  command_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processing', 'completed', 'failed')),
  response JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_command_log_org ON nexus_command_log(org_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_log_status ON nexus_command_log(status);
CREATE INDEX IF NOT EXISTS idx_command_log_type ON nexus_command_log(command_type, received_at DESC);

ALTER TABLE nexus_command_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_read_own_commands" ON nexus_command_log
  FOR SELECT USING (org_id = current_setting('app.current_org_id', true)::UUID);
