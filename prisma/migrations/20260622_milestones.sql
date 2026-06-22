-- Phase 4.4: Engagement Timeline Tracker (Methodology Step 8)
-- Add milestones JSONB column to mandates table

ALTER TABLE mandates ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN mandates.milestones IS 'JSONB object containing milestone definitions with target dates, actual dates, and status';

-- Create index for querying mandates with at-risk or overdue milestones
CREATE INDEX IF NOT EXISTS idx_mandates_has_milestones ON mandates ((milestones IS NOT NULL AND milestones != ''{}''::jsonb));

-- milestones structure example:
-- {
--   "intake_complete": { "target_date": "2026-07-01", "actual_date": "2026-07-02", "status": "completed" },
--   "solution_defined": { "target_date": "2026-07-08", "actual_date": null, "status": "on_track" },
--   "jd_approved": { "target_date": "2026-07-15", "actual_date": null, "status": "pending" },
--   "market_defined": { "target_date": "2026-07-22", "actual_date": null, "status": "pending" },
--   "longlist_ready": { "target_date": "2026-08-05", "actual_date": null, "status": "pending" },
--   "shortlist_ready": { "target_date": "2026-08-19", "actual_date": null, "status": "pending" },
--   "client_presentation": { "target_date": "2026-08-26", "actual_date": null, "status": "pending" },
--   "first_interview": { "target_date": "2026-09-09", "actual_date": null, "status": "pending" },
--   "offer_extended": { "target_date": "2026-09-30", "actual_date": null, "status": "pending" },
--   "placement": { "target_date": "2026-10-14", "actual_date": null, "status": "pending" }
-- }

-- Milestone statuses:
-- pending, on_track, at_risk, overdue, completed, completed_late

-- Helper function to get milestone status
CREATE OR REPLACE FUNCTION get_milestone_status(
  target_date timestamptz,
  actual_date timestamptz,
  check_date timestamptz DEFAULT now()
) RETURNS text AS $$
DECLARE
  days_until_due integer;
BEGIN
  -- If completed, check if on time or late
  IF actual_date IS NOT NULL THEN
    IF actual_date <= target_date THEN
      RETURN 'completed';
    ELSE
      RETURN 'completed_late';
    END IF;
  END IF;

  -- Calculate days until due
  days_until_due := (target_date::date - check_date::date);

  IF days_until_due < 0 THEN
    RETURN 'overdue';
  ELSIF days_until_due <= 7 THEN
    RETURN 'at_risk';
  ELSE
    RETURN 'on_track';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to initialize milestones with default SLA targets
CREATE OR REPLACE FUNCTION initialize_milestones(mandate_created_at timestamptz) RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}'::jsonb;
BEGIN
  result := jsonb_build_object(
    'intake_complete', jsonb_build_object(
      'target_date', (mandate_created_at + interval '7 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'solution_defined', jsonb_build_object(
      'target_date', (mandate_created_at + interval '14 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'jd_approved', jsonb_build_object(
      'target_date', (mandate_created_at + interval '21 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'market_defined', jsonb_build_object(
      'target_date', (mandate_created_at + interval '28 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'longlist_ready', jsonb_build_object(
      'target_date', (mandate_created_at + interval '42 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'shortlist_ready', jsonb_build_object(
      'target_date', (mandate_created_at + interval '56 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'client_presentation', jsonb_build_object(
      'target_date', (mandate_created_at + interval '63 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'first_interview', jsonb_build_object(
      'target_date', (mandate_created_at + interval '77 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'offer_extended', jsonb_build_object(
      'target_date', (mandate_created_at + interval '98 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    ),
    'placement', jsonb_build_object(
      'target_date', (mandate_created_at + interval '112 days')::date,
      'actual_date', null,
      'status', 'pending',
      'notes', ''
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View for mandates with computed milestone statuses
CREATE OR REPLACE VIEW mandate_milestone_status AS
SELECT
  m.id,
  m.title,
  m.status as mandate_status,
  m.created_at,
  m.milestones,
  -- Count of milestones by status
  (
    SELECT jsonb_object_agg(key, value)
    FROM jsonb_each_text(
      COALESCE(m.milestones, '{}'::jsonb)::jsonb
    )
    WHERE key = 'status'
  ) as milestone_statuses,
  -- Check if any milestone is at_risk or overdue
  (
    SELECT bool_or(
      CASE
        WHEN (value->>'status') IN ('at_risk', 'overdue') THEN true
        ELSE false
      END
    )
    FROM jsonb_each_text(COALESCE(m.milestones, '{}'::jsonb))
  ) as has_at_risk_milestones
FROM mandates m;

-- Trigger to auto-initialize milestones on mandate creation
CREATE OR REPLACE FUNCTION set_default_milestones()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.milestones IS NULL OR NEW.milestones = '{}'::jsonb THEN
    NEW.milestones := initialize_milestones(NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment the following line to enable auto-initialization on mandate creation
-- CREATE TRIGGER tr_mandates_set_default_milestones
--   BEFORE INSERT OR UPDATE ON mandates
--   FOR EACH ROW
--   EXECUTE FUNCTION set_default_milestones();
