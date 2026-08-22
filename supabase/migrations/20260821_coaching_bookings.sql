-- #1393 corrective batch — Coaching bookings (real availability + records)
--
-- Replaces the hardcoded AVAILABILITY_SLOTS / PAST_SESSIONS mocks in
-- CoachingPageV3. Two tables:
--   coaching_availability — consultant open slots (seeded)
--   coaching_bookings     — confirmed bookings (created on confirm)
--
-- RLS: user owns their bookings (SELECT/INSERT their own). Availability is
-- readable by all authed users (so they can pick slots); writes are
-- server/consultant-managed (no client INSERT/UPDATE on availability).

-- ── 1. coaching_availability ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  slot_date    DATE NOT NULL,
  slot_time    TIME NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 60,
  package      VARCHAR(20) DEFAULT 'Bronze',  -- Bronze | Silver | Gold
  is_booked    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_availability_open
  ON coaching_availability(slot_date, slot_time)
  WHERE is_booked = false;

ALTER TABLE coaching_availability ENABLE ROW LEVEL SECURITY;
-- Any authed user can read open slots.
CREATE POLICY coaching_availability_select ON coaching_availability FOR SELECT
  USING (true);
-- No client INSERT/UPDATE/DELETE on availability (server-managed).

-- ── 2. coaching_bookings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  availability_id UUID REFERENCES coaching_availability(id) ON DELETE SET NULL,
  package         VARCHAR(20) NOT NULL,         -- Bronze | Silver | Gold
  slot_day        VARCHAR(40) NOT NULL,         -- display label e.g. "Monday, Aug 26"
  slot_time       VARCHAR(20) NOT NULL,         -- display label e.g. "2:00 PM"
  duration_min    INTEGER NOT NULL DEFAULT 60,
  status          VARCHAR(20) NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled | completed
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_bookings_user
  ON coaching_bookings(user_id, created_at DESC);

ALTER TABLE coaching_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY coaching_bookings_select ON coaching_bookings FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY coaching_bookings_insert ON coaching_bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY coaching_bookings_update ON coaching_bookings FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY coaching_bookings_delete ON coaching_bookings FOR DELETE
  USING (user_id = auth.uid());

-- touch updated_at
CREATE OR REPLACE FUNCTION touch_coaching_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS touch_coaching_bookings ON coaching_bookings;
CREATE TRIGGER touch_coaching_bookings BEFORE UPDATE ON coaching_bookings
  FOR EACH ROW EXECUTE FUNCTION touch_coaching_bookings_updated_at();

-- ── 3. Seed availability (next 2 weeks) ──────────────────────────────
-- Replace the hardcoded mock slots in CoachingPageV3 with real rows.
INSERT INTO coaching_availability (slot_date, slot_time, duration_min, package, is_booked)
VALUES
  ('2026-08-24', '14:00', 90, 'Bronze', false),
  ('2026-08-25', '10:30', 60, 'Silver', false),
  ('2026-08-26', '15:00', 90, 'Bronze', false),
  ('2026-08-27', '11:00', 60, 'Silver', false),
  ('2026-08-31', '16:00', 90, 'Gold',   false),
  ('2026-09-01', '09:30', 60, 'Bronze', false)
ON CONFLICT DO NOTHING;
