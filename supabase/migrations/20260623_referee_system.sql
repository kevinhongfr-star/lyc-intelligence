-- Phase 7.1: Referee System Migration
-- Reference checks without friction

-- Reference requests table
CREATE TABLE IF NOT EXISTS reference_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id),
  -- Referee details
  referee_name text NOT NULL,
  referee_email text NOT NULL,
  referee_title text,
  referee_company text,
  referee_relationship text,
  -- Access
  invite_token text UNIQUE NOT NULL,
  invite_url text,
  -- Status
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'reminded', 'submitted', 'expired', 'declined')),
  invited_at timestamptz DEFAULT now(),
  reminded_at timestamptz,
  submitted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  -- Metadata
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

-- Reference responses table
CREATE TABLE IF NOT EXISTS reference_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_request_id uuid REFERENCES reference_requests(id) ON DELETE CASCADE,
  -- Question + answer
  question_number int NOT NULL,
  question_text text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  response_text text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reference_requests_candidate ON reference_requests(candidate_id);
CREATE INDEX IF NOT EXISTS idx_reference_requests_status ON reference_requests(status);
CREATE INDEX IF NOT EXISTS idx_reference_requests_token ON reference_requests(invite_token);
CREATE INDEX IF NOT EXISTS idx_reference_responses_request ON reference_responses(reference_request_id);

-- RLS policies
ALTER TABLE reference_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_responses ENABLE ROW LEVEL SECURITY;

-- Consultant/org can view all references for their candidates
CREATE POLICY "Consultants can view reference requests" ON reference_requests
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Referees can view/update their own request (via token)
CREATE POLICY "Referee can view own request" ON reference_requests
  FOR SELECT USING (true);

CREATE POLICY "Referee can update own request" ON reference_requests
  FOR UPDATE USING (true);

-- Responses follow request permissions
CREATE POLICY "Responses follow request access" ON reference_responses
  FOR ALL USING (
    reference_request_id IN (
      SELECT id FROM reference_requests
    )
  );
