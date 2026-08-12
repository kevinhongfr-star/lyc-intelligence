CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE nexus_memory_type AS ENUM (
  'decision',
  'action_item',
  'emotion',
  'fact',
  'preference',
  'summary'
);

CREATE TYPE nexus_memory_change_type AS ENUM (
  'created',
  'updated',
  'deleted'
);

CREATE TYPE nexus_memory_source AS ENUM (
  'auto_extraction',
  'user_edit',
  'system_maintenance'
);

CREATE TABLE IF NOT EXISTS nexus_episodic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  memory_type nexus_memory_type NOT NULL,
  source_conversation_id UUID,
  importance_score NUMERIC(3,2) DEFAULT 0.50 CHECK (importance_score >= 0 AND importance_score <= 1),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nexus_episodic_memory_user_id ON nexus_episodic_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_episodic_memory_memory_type ON nexus_episodic_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_nexus_episodic_memory_ts ON nexus_episodic_memory(ts);
CREATE INDEX IF NOT EXISTS idx_nexus_episodic_memory_embedding ON nexus_episodic_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE nexus_episodic_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nexus_episodic_memory_select_policy ON nexus_episodic_memory;
CREATE POLICY nexus_episodic_memory_select_policy ON nexus_episodic_memory
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS nexus_episodic_memory_insert_policy ON nexus_episodic_memory;
CREATE POLICY nexus_episodic_memory_insert_policy ON nexus_episodic_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS nexus_episodic_memory_update_policy ON nexus_episodic_memory;
CREATE POLICY nexus_episodic_memory_update_policy ON nexus_episodic_memory
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS nexus_episodic_memory_delete_policy ON nexus_episodic_memory;
CREATE POLICY nexus_episodic_memory_delete_policy ON nexus_episodic_memory
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS nexus_semantic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  user_model JSONB NOT NULL DEFAULT jsonb_build_object(
    'goals', '[]'::jsonb,
    'preferences', jsonb_build_object(
      'communication_style', NULL,
      'focus_areas', '[]'::jsonb,
      'tone_preference', NULL
    ),
    'patterns', jsonb_build_object(
      'typical_topics', '[]'::jsonb,
      'engagement_patterns', NULL,
      'common_questions', '[]'::jsonb
    ),
    'career_context', jsonb_build_object(
      'role', NULL,
      'industry', NULL,
      'level', NULL,
      'company_size', NULL
    )
  ),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_count INT NOT NULL DEFAULT 0
);

ALTER TABLE nexus_semantic_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nexus_semantic_memory_select_policy ON nexus_semantic_memory;
CREATE POLICY nexus_semantic_memory_select_policy ON nexus_semantic_memory
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS nexus_semantic_memory_insert_policy ON nexus_semantic_memory;
CREATE POLICY nexus_semantic_memory_insert_policy ON nexus_semantic_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS nexus_semantic_memory_update_policy ON nexus_semantic_memory;
CREATE POLICY nexus_semantic_memory_update_policy ON nexus_semantic_memory
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS nexus_semantic_memory_delete_policy ON nexus_semantic_memory;
CREATE POLICY nexus_semantic_memory_delete_policy ON nexus_semantic_memory
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS nexus_memory_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id UUID,
  change_type nexus_memory_change_type NOT NULL,
  old_value TEXT,
  new_value TEXT,
  source nexus_memory_source NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nexus_memory_audit_user_id ON nexus_memory_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_memory_audit_memory_id ON nexus_memory_audit(memory_id);
CREATE INDEX IF NOT EXISTS idx_nexus_memory_audit_ts ON nexus_memory_audit(ts);
CREATE INDEX IF NOT EXISTS idx_nexus_memory_audit_change_type ON nexus_memory_audit(change_type);

ALTER TABLE nexus_memory_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nexus_memory_audit_admin_select_policy ON nexus_memory_audit;
CREATE POLICY nexus_memory_audit_admin_select_policy ON nexus_memory_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS nexus_memory_audit_admin_insert_policy ON nexus_memory_audit;
CREATE POLICY nexus_memory_audit_admin_insert_policy ON nexus_memory_audit
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );
