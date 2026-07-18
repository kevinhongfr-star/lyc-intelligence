-- ────────────────────────────────────────────────────────────────────────────
-- Candidate Portal v2.1 — Messaging & Documents
-- Issue #14: Candidate Portal v2.1
-- ────────────────────────────────────────────────────────────────────────────

-- Candidate Messages (threaded conversations between candidate and consultant)
CREATE TABLE IF NOT EXISTS candidate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('candidate', 'consultant', 'system')),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  message_type TEXT DEFAULT 'general', -- general, interview_update, offer_update, document_request
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Candidate Documents (uploaded files, CVs, certificates, etc.)
CREATE TABLE IF NOT EXISTS candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'other', -- cv, cover_letter, certificate, portfolio, reference, other
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  expiry_date DATE,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'private', -- private, consultant_visible, client_visible
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_messages_thread ON candidate_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_candidate_messages_candidate ON candidate_messages(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_messages_unread ON candidate_messages(candidate_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_type ON candidate_documents(candidate_id, document_type);

-- RLS
ALTER TABLE candidate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_messages_own ON candidate_messages
  FOR ALL USING (
    candidate_id = auth.uid() OR
    consultant_id = auth.uid() OR
    sender_id = auth.uid()
  );

CREATE POLICY candidate_documents_own ON candidate_documents
  FOR ALL USING (candidate_id = auth.uid());

-- Triggers
CREATE TRIGGER candidate_messages_updated
  BEFORE UPDATE ON candidate_messages
  FOR EACH ROW EXECUTE FUNCTION update_shift_timestamp();

CREATE TRIGGER candidate_documents_updated
  BEFORE UPDATE ON candidate_documents
  FOR EACH ROW EXECUTE FUNCTION update_shift_timestamp();

-- Grant
GRANT SELECT, INSERT, UPDATE ON candidate_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_documents TO authenticated;