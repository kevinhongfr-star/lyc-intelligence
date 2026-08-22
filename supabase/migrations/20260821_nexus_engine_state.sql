-- #1393 — NEXUS Engine conversation state (lane + lens signals + trust stage).
-- Engine-internal only. UI must NOT render `lane` to the user (v2.4 § Three Lanes).

ALTER TABLE nexus_conversations
  ADD COLUMN IF NOT EXISTS lane VARCHAR(20) DEFAULT 'universal';

ALTER TABLE nexus_conversations
  ADD COLUMN IF NOT EXISTS lens_signals JSONB DEFAULT '{}'::jsonb;

ALTER TABLE nexus_conversations
  ADD COLUMN IF NOT EXISTS trust_stage VARCHAR(20) DEFAULT 'introductory';
