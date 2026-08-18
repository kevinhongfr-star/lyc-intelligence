-- #39 — NEXUS Conversation Engine storage schema
--
-- Two core tables:
--   nexus_conversations — one per chat thread (user-owned)
--   nexus_messages      — individual turns within a conversation (role enum, token counts, model)
--
-- Design principles:
--   - RLS-first: user sees ONLY their own conversations + messages
--   - No JSONB for core data (content is TEXT, tokens are INTEGER, model is VARCHAR)
--   - Soft-delete friendly (deleted_at nullable on conversations)
--   - Standard columns: id, created_at, updated_at
--   - Indexes on (user_id, created_at) for list queries, (conversation_id) for message fetch

-- ── 1. nexus_conversations ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nexus_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL DEFAULT 'New conversation',
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_conversations_user_created
  ON nexus_conversations(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_nexus_conversations_user_updated
  ON nexus_conversations(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- ── 2. nexus_messages ───────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE nexus_message_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS nexus_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES nexus_conversations(id) ON DELETE CASCADE,
  role             nexus_message_role NOT NULL,
  content          TEXT NOT NULL,
  tokens_used      INTEGER NOT NULL DEFAULT 0,
  model_used       VARCHAR(50),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_messages_conversation
  ON nexus_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_nexus_messages_conversation_role
  ON nexus_messages(conversation_id, role)
  WHERE role IN ('user', 'assistant');

-- Denormalized user_id on messages for efficient RLS + message listing.
ALTER TABLE nexus_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nexus_messages_user
  ON nexus_messages(user_id, created_at DESC);

-- Trigger: populate user_id from parent conversation on INSERT.
CREATE OR REPLACE FUNCTION nexus_messages_denormalize_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT c.user_id INTO NEW.user_id
      FROM nexus_conversations c
     WHERE c.id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS denorm_user_id_on_nexus_message ON nexus_messages;
CREATE TRIGGER denorm_user_id_on_nexus_message BEFORE INSERT ON nexus_messages
  FOR EACH ROW EXECUTE FUNCTION nexus_messages_denormalize_user_id();

-- Trigger: touch conversation updated_at when a message is added/updated/deleted.
CREATE OR REPLACE FUNCTION nexus_messages_touch_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE nexus_conversations SET updated_at = now() WHERE id = OLD.conversation_id;
  ELSE
    UPDATE nexus_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_conversation_on_message_insert ON nexus_messages;
CREATE TRIGGER touch_conversation_on_message_insert AFTER INSERT OR UPDATE OR DELETE ON nexus_messages
  FOR EACH ROW EXECUTE FUNCTION nexus_messages_touch_conversation();

-- ── RLS Policies — user only sees own ──────────────────────────────

-- nexus_conversations: user owns their threads; soft-deleted rows are excluded from SELECT.
ALTER TABLE nexus_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY nexus_conversations_select ON nexus_conversations FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY nexus_conversations_insert ON nexus_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY nexus_conversations_update ON nexus_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY nexus_conversations_soft_delete ON nexus_conversations FOR DELETE
  USING (user_id = auth.uid());

-- nexus_messages: user sees only messages belonging to their own conversations
-- (double-guard: both denormalized user_id and join back to conversation ownership).
ALTER TABLE nexus_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY nexus_messages_select ON nexus_messages FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM nexus_conversations c
      WHERE c.id = nexus_messages.conversation_id
        AND c.user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY nexus_messages_insert ON nexus_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM nexus_conversations c
      WHERE c.id = nexus_messages.conversation_id
        AND c.user_id = auth.uid()
        AND c.deleted_at IS NULL
    )
  );

CREATE POLICY nexus_messages_update ON nexus_messages FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM nexus_conversations c
      WHERE c.id = nexus_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY nexus_messages_delete ON nexus_messages FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM nexus_conversations c
      WHERE c.id = nexus_messages.conversation_id
        AND c.user_id = auth.uid()
    )
  );

-- ── updated_at triggers ────────────────────────────────────────────

-- Reuse touch_updated_at() if already present (from assessment-domain migrations),
-- otherwise create it idempotently.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS touch_nexus_conversations ON nexus_conversations;
CREATE TRIGGER touch_nexus_conversations BEFORE UPDATE ON nexus_conversations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS touch_nexus_messages ON nexus_messages;
CREATE TRIGGER touch_nexus_messages BEFORE UPDATE ON nexus_messages
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
