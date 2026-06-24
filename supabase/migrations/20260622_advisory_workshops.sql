-- Phase 3.4: Advisory Assessment Engine
-- Workshop and participant management tables

CREATE TABLE IF NOT EXISTS workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('PRISM', 'FORGE', 'SPARK', 'BRIDGE', 'MOSAIC')),
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  scheduled_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  location text,
  max_participants integer DEFAULT 15,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'launched', 'completed', 'cancelled')),
  allow_report_download boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  token text NOT NULL UNIQUE,
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'completed')),
  responses jsonb,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workshop_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES workshops(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES workshop_participants(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  dimension_scores jsonb,
  archetype text,
  style text,
  strengths text[],
  development_areas text[],
  recommendations text[],
  raw_analysis text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workshops_org ON workshops(organization_id);
CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop ON workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_token ON workshop_participants(token);
CREATE INDEX IF NOT EXISTS idx_workshop_scores_workshop ON workshop_scores(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_scores_participant ON workshop_scores(participant_id);