-- ════════════════════════════════════════════════════════════════════
-- S7-T04 (N4): RAG Content Library Integration
-- Tables: nexus_content_library, nexus_content_chunks
--
-- Stores career guides, industry reports, market intelligence, LYC
-- assessment frameworks, and public market data for RAG retrieval.
--
-- Design notes:
--   - Embeddings are stored as JSONB (array of floats) so this works
--     WITHOUT pgvector. When pgvector is enabled, a companion VECTOR(1536)
--     column can be added and populated from the JSONB values.
--   - Keyword arrays (keywords TEXT[]) enable fast keyword-based retrieval
--     as the primary method. Vector similarity is an enhancement.
--   - RLS: service_role has full access. Admins (super_admin/lyc_admin) can
--     manage via the REST API with service-role auth.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. nexus_content_library — document-level metadata ──
CREATE TABLE IF NOT EXISTS public.nexus_content_library (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  source      TEXT,                          -- URL, filename, or 'LYC Internal'
  category    TEXT NOT NULL CHECK (category IN (
    'career_guide', 'industry_report', 'market_intel',
    'assessment_framework', 'public_data', 'other'
  )),
  description TEXT,                          -- short summary for admin UI
  content     TEXT NOT NULL,                 -- full document text
  chunk_count INTEGER NOT NULL DEFAULT 0,    -- number of chunks generated
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {author, date, tags, ...}
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_content_library_active
  ON public.nexus_content_library (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_nexus_content_library_category
  ON public.nexus_content_library (category);

ALTER TABLE public.nexus_content_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on nexus_content_library"
  ON public.nexus_content_library FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_nexus_content_library_updated_at ON public.nexus_content_library;
CREATE TRIGGER trg_nexus_content_library_updated_at
  BEFORE UPDATE ON public.nexus_content_library FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── 2. nexus_content_chunks — chunked text + embeddings ──
CREATE TABLE IF NOT EXISTS public.nexus_content_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES public.nexus_content_library(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  chunk_text   TEXT NOT NULL,
  -- Embedding stored as JSONB array of floats (works without pgvector).
  -- When pgvector is available, add: ALTER TABLE ... ADD COLUMN embedding_vec VECTOR(1536)
  embedding    JSONB,
  token_count  INTEGER NOT NULL DEFAULT 0,
  keywords     TEXT[] NOT NULL DEFAULT '{}',  -- pre-extracted for keyword retrieval
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_content_chunks_document
  ON public.nexus_content_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_nexus_content_chunks_active_join
  ON public.nexus_content_chunks (document_id) WHERE embedding IS NOT NULL;

ALTER TABLE public.nexus_content_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on nexus_content_chunks"
  ON public.nexus_content_chunks FOR ALL USING (auth.role() = 'service_role');

-- ── 3. nexus_content_citations — track which chunks were cited per response ──
-- (Optional: for analytics on which content is most useful)
CREATE TABLE IF NOT EXISTS public.nexus_content_citations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.nexus_conversations(id) ON DELETE SET NULL,
  chunk_id        UUID NOT NULL REFERENCES public.nexus_content_chunks(id) ON DELETE CASCADE,
  document_id     UUID NOT NULL REFERENCES public.nexus_content_library(id) ON DELETE CASCADE,
  query_text      TEXT,                       -- the user message that triggered retrieval
  retrieval_score NUMERIC(5,4),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexus_content_citations_user
  ON public.nexus_content_citations (user_id);
CREATE INDEX IF NOT EXISTS idx_nexus_content_citations_document
  ON public.nexus_content_citations (document_id);

ALTER TABLE public.nexus_content_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access on nexus_content_citations"
  ON public.nexus_content_citations FOR ALL USING (auth.role() = 'service_role');
