-- Migration: Nexus Conversations + Memory (S7-T01 / S7-T02)
-- Date: 2026-08-04
-- Purpose: Persist Nexus conversations and long-term memory per spec DEX_AI_NEXUS_PHASE1_TICKETS.md.
--          Coexists with existing chat_sessions/chat_messages tables; this is the canonical
--          Nexus persistence layer (used by GDPR export in userHandler.ts).

-- ── nexus_conversations ──
-- Single-row-per-session persistence. Messages stored as JSONB to keep the schema
-- aligned with the spec ("Conversation persistence in nexus_conversations table").
CREATE TABLE IF NOT EXISTS nexus_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,           -- [{role, content, ts, intent?, tokens?, cost?}]
  intent_distribution JSONB DEFAULT '{}'::jsonb,          -- {career_advisory: 3, compensation: 1, ...}
  session_summary TEXT,                                   -- episodic memory summary (S7-T02)
  diagnostic_progress INTEGER DEFAULT 0,
  milestone_status JSONB DEFAULT '{}'::jsonb,
  total_tokens INTEGER DEFAULT 0,                         -- cost tracking (S7-T01 budget cap)
  total_cost_cny NUMERIC(10,4) DEFAULT 0,                 -- running cost in CNY
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_conversations_user_id ON nexus_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_conversations_updated_at ON nexus_conversations(updated_at DESC);

ALTER TABLE nexus_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nexus conversations"
  ON nexus_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nexus conversations"
  ON nexus_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nexus conversations"
  ON nexus_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nexus conversations"
  ON nexus_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ── nexus_memory ──
-- Long-term memory: episodic (conversation summaries) + semantic (user insights).
-- `importance` (0..1) drives decay weighting (older memories decay over time).
-- `last_accessed_at` lets retrieval refresh recently-used memories.
CREATE TABLE IF NOT EXISTS nexus_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES nexus_conversations(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'goal', 'pain_point', 'strength', 'experience', 'preference', 'insight',
    'episodic_summary', 'semantic_profile', 'milestone'
  )),
  content TEXT NOT NULL,
  source TEXT DEFAULT 'conversation_extraction',
  importance NUMERIC(3,2) DEFAULT 0.50,                   -- 0.00..1.00 decay weight
  confidence NUMERIC(3,2) DEFAULT 0.70,
  is_active BOOLEAN DEFAULT true,
  -- S7-T04 (RAG) will add an `embedding` VECTOR(1536) column once pgvector is enabled.
  -- For now we store retrieved chunks by reference id only.
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_memory_user_id ON nexus_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_memory_type ON nexus_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_nexus_memory_importance ON nexus_memory(importance DESC);
CREATE INDEX IF NOT EXISTS idx_nexus_memory_last_accessed ON nexus_memory(last_accessed_at DESC);

ALTER TABLE nexus_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nexus memories"
  ON nexus_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nexus memories"
  ON nexus_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nexus memories"
  ON nexus_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nexus memories"
  ON nexus_memory FOR DELETE
  USING (auth.uid() = user_id);

-- ── nexus_usage_log ──
-- Daily token/cost tracking for S7-T01 daily budget cap (¥50/day per user).
CREATE TABLE IF NOT EXISTS nexus_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  intent TEXT,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_cny NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_usage_log_user_date ON nexus_usage_log(user_id, usage_date);

ALTER TABLE nexus_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nexus usage"
  ON nexus_usage_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nexus usage"
  ON nexus_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role (server-only) bypasses RLS for budget enforcement inserts.

-- ── Triggers ──
DROP TRIGGER IF EXISTS update_nexus_conversations_updated_at ON nexus_conversations;
CREATE TRIGGER update_nexus_conversations_updated_at
  BEFORE UPDATE ON nexus_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Update GDPR export views to also expose nexus_conversations/nexus_memory ──
-- (userHandler.ts already references these; this migration makes them exist.)
