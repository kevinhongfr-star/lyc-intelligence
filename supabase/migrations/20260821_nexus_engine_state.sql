-- #1393 corrective batch — NEXUS Engine conversation state
--
-- Adds engine-internal state to nexus_conversations so lane + accumulated
-- lens signals persist across turns within a conversation. These columns are
-- ENGINE-INTERNAL: the UI never surfaces "lane" to the user (per v2.2 prompt
-- § Three Lanes: "Never ask 'which lane are you in?'"). lens_signals is a
-- JSONB map of {LENS_CODE: signal_0_to_10} used by the 7/10 suggestion rule.
--
-- RLS: existing nexus_conversations policies (user owns their rows) apply to
-- these columns automatically — no new policies needed.

ALTER TABLE nexus_conversations
  ADD COLUMN IF NOT EXISTS lane VARCHAR(20) DEFAULT 'universal';

ALTER TABLE nexus_conversations
  ADD COLUMN IF NOT EXISTS lens_signals JSONB DEFAULT '{}'::jsonb;

ALTER TABLE nexus_conversations
  ADD COLUMN IF NOT EXISTS trust_stage VARCHAR(20) DEFAULT 'introductory';

-- lens_signals shape example:
--   {"LEAP": 3, "PRISM": 1, "IMPACT": 7}
-- A lens becomes suggestible at signal >= 7 (v2.2 § LENS SUGGESTION LOGIC).
-- Trust stage is recomputed per turn from the user's total conversation count
-- + lenses taken, then cached here for the next turn's runtime context.
