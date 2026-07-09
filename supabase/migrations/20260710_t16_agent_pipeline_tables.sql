-- T16: Create tables for Feishu agent data pipeline
-- Created: 2026-07-10
-- Tables: contracts, invoices, payments, engagements, interviews, client_meetings,
--         feedback_records, sourcing_activities, market_maps, market_research,
--         compensation_data, talent_landscape_reports

-- ============================================================
-- Samuel/AI: Business Operations
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id uuid REFERENCES client_accounts(id) ON DELETE SET NULL,
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  contract_number text UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','active','completed','terminated')),
  value numeric,
  currency text DEFAULT 'USD',
  start_date date,
  end_date date,
  signed_at timestamptz,
  signed_by text,
  file_url text,
  terms_summary text,
  created_by text DEFAULT 'samuel',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  client_account_id uuid REFERENCES client_accounts(id) ON DELETE SET NULL,
  invoice_number text UNIQUE,
  type text NOT NULL DEFAULT 'milestone' CHECK (type IN ('advance','milestone','final','credit')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  due_date date,
  paid_at timestamptz,
  payment_ref text,
  line_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by text DEFAULT 'samuel',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  payment_date date,
  method text CHECK (method IN ('wire','stripe','check','other')),
  reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','failed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id uuid REFERENCES client_accounts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('retainer','search-project','advisory','coaching')),
  status text NOT NULL DEFAULT 'prospecting' CHECK (status IN ('prospecting','negotiated','active','completed')),
  start_date date,
  expected_end_date date,
  actual_end_date date,
  value numeric,
  credits_allocated integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- Maria/AI: Client Relations
-- ============================================================

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  client_account_id uuid REFERENCES client_accounts(id) ON DELETE SET NULL,
  interview_date timestamptz NOT NULL,
  round text CHECK (round IN ('1','2','3','final','panel')),
  format text DEFAULT 'video' CHECK (format IN ('in-person','video','phone')),
  interviewers jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','rescheduled')),
  feedback_summary text,
  candidate_rating integer CHECK (candidate_rating >= 1 AND candidate_rating <= 5),
  strengths text,
  weaknesses text,
  recommendation text CHECK (recommendation IN ('proceed','hold','reject')),
  notes text,
  scheduled_by text DEFAULT 'maria',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_account_id uuid REFERENCES client_accounts(id) ON DELETE SET NULL,
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  meeting_date timestamptz NOT NULL,
  type text NOT NULL CHECK (type IN ('kickoff','alignment','briefing','debrief','qbr','other')),
  attendees jsonb DEFAULT '[]'::jsonb,
  agenda text,
  minutes text,
  action_items jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  organized_by text DEFAULT 'maria',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('client','candidate','interviewer')),
  source_id uuid,
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  interview_id uuid REFERENCES interviews(id) ON DELETE SET NULL,
  feedback_type text CHECK (feedback_type IN ('post-interview','post-meeting','general')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  summary text,
  detailed_feedback text,
  received_at timestamptz DEFAULT now(),
  recorded_by text DEFAULT 'maria',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Alessio/AI: Talent Sourcing & Pipeline
-- ============================================================

CREATE TABLE IF NOT EXISTS sourcing_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  agent_id text NOT NULL DEFAULT 'alessio',
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('search','screen','contacted','scheduled','rejected','shortlisted','presented')),
  contacts_count integer DEFAULT 0,
  notes text,
  outcome text,
  duration_min integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES mandates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  sector text,
  geography text,
  total_contacts_identified integer DEFAULT 0,
  total_contacts_reached integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','delivered')),
  delivered_at timestamptz,
  file_url text,
  created_by text DEFAULT 'alessio',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- Sweep: Research & Market Intelligence
-- ============================================================

CREATE TABLE IF NOT EXISTS market_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('compensation-benchmark','industry-analysis','talent-landscape','org-mapping')),
  sector text,
  geography text,
  status text NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress','review','delivered')),
  findings_summary text,
  data_points jsonb DEFAULT '[]'::jsonb,
  delivered_at timestamptz,
  researcher text DEFAULT 'sweep',
  source_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compensation_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title text NOT NULL,
  function text,
  level text,
  industry text,
  company_size text,
  geography text,
  min_comp numeric,
  mid_comp numeric,
  max_comp numeric,
  currency text DEFAULT 'USD',
  data_year integer DEFAULT (EXTRACT(YEAR FROM CURRENT_DATE))::integer,
  source text DEFAULT 'sweep',
  sample_size integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS talent_landscape_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector text,
  geography text,
  report_title text NOT NULL,
  summary text,
  key_findings jsonb DEFAULT '[]'::jsonb,
  talent_pool_size integer,
  supply_demand_ratio numeric,
  key_companies jsonb DEFAULT '[]'::jsonb,
  trends jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now(),
  researcher text DEFAULT 'sweep',
  file_url text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_account_id);
CREATE INDEX IF NOT EXISTS idx_contracts_mandate ON contracts(mandate_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contract ON invoices(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client ON engagements(client_account_id);
CREATE INDEX IF NOT EXISTS idx_interviews_mandate ON interviews(mandate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_contact ON interviews(contact_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_client_meetings_client ON client_meetings(client_account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_mandate ON feedback_records(mandate_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interview ON feedback_records(interview_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_mandate ON sourcing_activities(mandate_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_date ON sourcing_activities(date);
CREATE INDEX IF NOT EXISTS idx_market_maps_mandate ON market_maps(mandate_id);
CREATE INDEX IF NOT EXISTS idx_compensation_role ON compensation_data(role_title);
CREATE INDEX IF NOT EXISTS idx_compensation_geo ON compensation_data(geography);
CREATE INDEX IF NOT EXISTS idx_talent_landscape_sector ON talent_landscape_reports(sector);

-- ============================================================
-- RLS Policies (service role can do everything, agents write through service role)
-- ============================================================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourcing_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE compensation_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_landscape_reports ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by agent endpoints)
-- For authenticated users: read-only access to their own data
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['contracts','invoices','payments','engagements','interviews','client_meetings','feedback_records','sourcing_activities','market_maps','market_research','compensation_data','talent_landscape_reports'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Service role full access" ON %I USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
