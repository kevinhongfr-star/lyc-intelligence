-- Phase 2.7: Saved Searches & Talent Alerts

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  search_name TEXT NOT NULL,
  search_description TEXT,
  search_filters JSONB NOT NULL,
  alert_frequency TEXT DEFAULT 'daily',
  alert_threshold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  shared_with_team TEXT,
  last_executed_at TIMESTAMPTZ,
  last_match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Talent alert log
CREATE TABLE IF NOT EXISTS talent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  candidate_id UUID NOT NULL REFERENCES contacts(id),
  alert_type TEXT NOT NULL,
  match_score NUMERIC(5,2),
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared search subscriptions
CREATE TABLE IF NOT EXISTS saved_search_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  notification_preference TEXT DEFAULT 'inherit',
  UNIQUE(saved_search_id, user_id)
);

-- Search execution log
CREATE TABLE IF NOT EXISTS search_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  saved_search_id UUID REFERENCES saved_searches(id),
  search_filters JSONB NOT NULL,
  result_count INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_searches_org ON saved_searches(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(org_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_talent_alerts_user ON talent_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_talent_alerts_unviewed ON talent_alerts(user_id) WHERE viewed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_search_executions_org ON search_executions(org_id, created_at DESC);

-- RLS policies
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_executions ENABLE ROW LEVEL SECURITY;

-- Organization-based access policies
CREATE POLICY "Users can view their saved searches" ON saved_searches
  FOR SELECT USING (
    user_id = auth.uid() OR
    (is_shared = true AND org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can create saved searches" ON saved_searches
  FOR INSERT WITH CHECK (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their saved searches" ON saved_searches
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can view their talent alerts" ON talent_alerts
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can view their subscriptions" ON saved_search_subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
  );