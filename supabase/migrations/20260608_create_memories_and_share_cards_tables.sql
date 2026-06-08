-- ── Memories Table ─────────────────────────────────────────────────
-- Stores user-extracted career intelligence (goals, pain points, strengths,
-- experiences, preferences, insights) from chat conversations or explicit
-- user input. Consumed by:
--   • api/memory.ts (POST → extract via DeepSeek + insert)
--   • Frontend memoryStore.loadMemories (future: GET route)
--
-- Schema mirrors what api/memory.ts inserts.

CREATE TABLE IF NOT EXISTS public.memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type   TEXT NOT NULL
                  CHECK (memory_type IN ('goal','pain_point','strength','experience','preference','insight')),
  content       TEXT NOT NULL,
  source        TEXT NOT NULL DEFAULT 'conversation_extraction'
                  CHECK (source IN ('conversation_extraction','explicit_user_input','system')),
  session_id    UUID,                          -- chat session reference (nullable)
  confidence    NUMERIC(3,2) NOT NULL DEFAULT 0.6
                  CHECK (confidence >= 0 AND confidence <= 1),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memories_user_id_active
  ON public.memories (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_memories_session_id
  ON public.memories (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memories_memory_type
  ON public.memories (memory_type);

CREATE INDEX IF NOT EXISTS idx_memories_created_at
  ON public.memories (created_at DESC);

-- ── RLS Policies ──────────────────────────────────────────────────
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Service role has full access (backend operations, cross-user admin tasks)
CREATE POLICY "Service role full access on memories"
  ON public.memories FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own memories
CREATE POLICY "Users read own memories"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert memories for themselves (frontend optimistic + offline)
CREATE POLICY "Users insert own memories"
  ON public.memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (e.g., deactivate) their own memories
CREATE POLICY "Users update own memories"
  ON public.memories FOR UPDATE
  USING (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memories_updated_at ON public.memories;
CREATE TRIGGER trg_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Share Cards Table ─────────────────────────────────────────────
-- Stores public share-card metadata for assessment/share results.
-- Consumed by:
--   • api/share.ts (POST → insert after public_uuid generation)
--   • Public share pages (future: GET by public_uuid)
--
-- Schema mirrors what api/share.ts inserts.

CREATE TABLE IF NOT EXISTS public.share_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_uuid   UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  type          TEXT NOT NULL
                  CHECK (type IN ('assessment','branding','prism','trident','cv','other')),
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_url     TEXT,
  view_count    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,                   -- optional TTL (nullable)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────
-- public_uuid is the lookup key for public share pages
CREATE INDEX IF NOT EXISTS idx_share_cards_public_uuid
  ON public.share_cards (public_uuid)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_share_cards_user_id
  ON public.share_cards (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_share_cards_type
  ON public.share_cards (type);

-- ── RLS Policies ──────────────────────────────────────────────────
ALTER TABLE public.share_cards ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on share_cards"
  ON public.share_cards FOR ALL
  USING (auth.role() = 'service_role');

-- Users can read their own share cards
CREATE POLICY "Users read own share_cards"
  ON public.share_cards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own share cards
CREATE POLICY "Users insert own share_cards"
  ON public.share_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access for active, non-expired cards by public_uuid
-- (Needed for share preview pages accessed by anonymous users)
CREATE POLICY "Public read active share cards by uuid"
  ON public.share_cards FOR SELECT
  USING (
    is_active = TRUE
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ── updated_at trigger ────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_share_cards_updated_at ON public.share_cards;
CREATE TRIGGER trg_share_cards_updated_at
  BEFORE UPDATE ON public.share_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
