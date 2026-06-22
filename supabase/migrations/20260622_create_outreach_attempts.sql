CREATE TABLE IF NOT EXISTS outreach_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (
    channel IN (
      'cold_call',
      'wechat_add',
      'email',
      'linkedin_message',
      'phone_call',
      'in_person'
    )
  ),
  attempt_number int NOT NULL DEFAULT 1,
  attempt_date date NOT NULL DEFAULT CURRENT_DATE,
  outcome text CHECK (
    outcome IN (
      'no_response',
      'positive',
      'negative',
      'interested',
      'not_interested',
      'scheduled_interview',
      'referred_other',
      'invalid_contact'
    )
  ),
  response_text text,
  notes text,
  next_action text,
  next_action_date date,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_candidate ON outreach_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_outreach_mandate ON outreach_attempts(mandate_id);
CREATE INDEX IF NOT EXISTS idx_outreach_channel ON outreach_attempts(channel);
CREATE INDEX IF NOT EXISTS idx_outreach_outcome ON outreach_attempts(outcome);
CREATE INDEX IF NOT EXISTS idx_outreach_next_action ON outreach_attempts(next_action_date)
  WHERE next_action_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_outreach_created_by ON outreach_attempts(created_by);
CREATE INDEX IF NOT EXISTS idx_outreach_date ON outreach_attempts(attempt_date);
