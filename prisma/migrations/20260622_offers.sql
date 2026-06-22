-- Phase 4.5: Offer + Onboarding + Post-Placement
-- Create offers table for managing employment offers

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  
  -- Position details
  position_title text NOT NULL,
  start_date date NOT NULL,
  compensation jsonb, -- {base_salary, bonus, equity, benefits}
  conditions text, -- background check, references, etc.
  expiration_date date,
  
  -- Approval workflow
  status text DEFAULT 'draft' CHECK (status IN (
    'draft', 
    'pending_partner_approval', 
    'pending_client_approval', 
    'sent', 
    'accepted', 
    'rejected', 
    'withdrawn',
    'onboarding',
    'active',
    'probation',
    'completed'
  )),
  
  -- Approvals
  created_by uuid REFERENCES profiles(id),
  partner_approved_by uuid REFERENCES profiles(id),
  partner_approval_notes text,
  client_approved_by uuid, -- client user ID from client_users table
  client_approval_notes text,
  client_rejection_reason text,
  partner_rejection_reason text,
  
  -- Timing
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejected_by uuid REFERENCES profiles(id),
  
  -- Onboarding
  onboarding_checklist jsonb DEFAULT '[]'::jsonb, -- [{task, completed, completed_at, completed_by, notes}]
  onboarding_completed_at timestamptz,
  
  -- Post-placement follow-up
  follow_up_1m_sent boolean DEFAULT false,
  follow_up_1m_at timestamptz,
  follow_up_3m_sent boolean DEFAULT false,
  follow_up_3m_at timestamptz,
  follow_up_6m_sent boolean DEFAULT false,
  follow_up_6m_at timestamptz,
  follow_up_1m_response text,
  follow_up_3m_response text,
  follow_up_6m_response text,
  
  -- Probation
  probation_end_date date,
  probation_status text DEFAULT 'pending' CHECK (probation_status IN ('pending', 'passed', 'extended', 'failed')),
  probation_notes text,
  probation_extended_to date,
  
  -- Additional fields
  cover_letter text,
  additional_notes text,
  offer_letter_url text, -- URL to generated PDF offer letter
  
  -- Metadata
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_candidate ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_mandate ON offers(mandate_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_start_date ON offers(start_date);
CREATE INDEX IF NOT EXISTS idx_offers_probation_end ON offers(probation_end_date);
CREATE INDEX IF NOT EXISTS idx_offers_followup_1m ON offers(follow_up_1m_sent) WHERE follow_up_1m_sent = false;
CREATE INDEX IF NOT EXISTS idx_offers_followup_3m ON offers(follow_up_3m_sent) WHERE follow_up_3m_sent = false;
CREATE INDEX IF NOT EXISTS idx_offers_followup_6m ON offers(follow_up_6m_sent) WHERE follow_up_6m_sent = false;

-- Comments
COMMENT ON TABLE offers IS 'Employment offers with approval workflow, onboarding, and post-placement follow-up';
COMMENT ON COLUMN offers.compensation IS 'JSON: {base_salary, bonus, bonus_percentage, equity, benefits, total_compensation}';
COMMENT ON COLUMN offers.onboarding_checklist IS 'JSON array: [{task, category, completed, completed_at, completed_by, notes}]';
COMMENT ON COLUMN offers.status IS 'draft -> pending_partner_approval -> pending_client_approval -> sent -> accepted/rejected -> onboarding -> active -> probation -> completed';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to generate default onboarding checklist
CREATE OR REPLACE FUNCTION generate_onboarding_checklist()
RETURNS jsonb AS $$
BEGIN
  RETURN '[
    {
      "task": "Signed offer letter received",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    },
    {
      "task": "Background check initiated",
      "category": "verification",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 5
    },
    {
      "task": "References verified",
      "category": "verification",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "Employment contract signed",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "NDA signed",
      "category": "documentation",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 7
    },
    {
      "task": "IT accounts created",
      "category": "setup",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Equipment delivered/setup",
      "category": "setup",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Welcome email sent",
      "category": "communication",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "First day agenda prepared",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 1
    },
    {
      "task": "Team introduction scheduled",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    },
    {
      "task": "Buddy/mentor assigned",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 5
    },
    {
      "task": "Orientation schedule confirmed",
      "category": "planning",
      "completed": false,
      "completed_at": null,
      "completed_by": null,
      "notes": null,
      "due_days": 3
    }
  ]'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- View for offers with candidate and mandate info
CREATE OR REPLACE VIEW offers_with_details AS
SELECT 
  o.*,
  c.first_name as candidate_first_name,
  c.last_name as candidate_last_name,
  c.email as candidate_email,
  c.phone as candidate_phone,
  c.current_title as candidate_title,
  c.current_company as candidate_company,
  m.title as mandate_title,
  m.client_id,
  cl.company_name as client_name,
  cl.first_name as client_first_name,
  cl.last_name as client_last_name,
  p.name as created_by_name,
  p.email as created_by_email,
  pp.name as partner_approved_by_name,
  org.name as organization_name
FROM offers o
LEFT JOIN contacts c ON o.candidate_id = c.id
LEFT JOIN mandates m ON o.mandate_id = m.id
LEFT JOIN clients cl ON m.client_id = cl.id
LEFT JOIN profiles p ON o.created_by = p.id
LEFT JOIN profiles pp ON o.partner_approved_by = pp.id
LEFT JOIN organizations org ON o.organization_id = org.id;

-- View for onboarding task progress
CREATE OR REPLACE VIEW onboarding_progress AS
SELECT 
  o.id as offer_id,
  o.position_title,
  c.first_name || ' ' || c.last_name as candidate_name,
  o.start_date,
  o.onboarding_checklist,
  jsonb_array_length(o.onboarding_checklist) as total_tasks,
  jsonb_array_length(o.onboarding_checklist) - 
    jsonb_array_length(o.onboarding_checklist) as completed_tasks,
  ROUND(
    (jsonb_array_length(o.onboarding_checklist) - 
      jsonb_array_length(o.onboarding_checklist))::numeric / 
    NULLIF(jsonb_array_length(o.onboarding_checklist), 0) * 100
  , 0) as completion_percentage
FROM offers o
LEFT JOIN contacts c ON o.candidate_id = c.id;
