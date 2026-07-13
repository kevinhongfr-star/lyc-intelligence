-- ============================================================================
-- LYC Intelligence Platform — Master Migration SQL
-- Version: 2.0 | Date: 2026-07-13
-- Scope: All 57 tables for LYC Intelligence (DEX AI platform)
-- Execution: Supabase SQL Editor (run after connecting to rnnlteyqmtxkzllbohuu)
-- ============================================================================

-- ─── SHARED INFRASTRUCTURE ─────────────────────────────────────────────────

-- Unified contacts (cross-app)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT GENERATED ALWAYS AS (TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
  avatar_url TEXT,
  title TEXT,
  company_name TEXT,
  industry TEXT,
  city TEXT,
  country TEXT DEFAULT 'CN',
  source TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin ON contacts(linkedin_url);

-- Unified companies (cross-app)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID,
  name TEXT NOT NULL,
  slug TEXT,
  industry TEXT,
  sub_industry TEXT,
  size_category TEXT,
  employee_count_min INTEGER,
  employee_count_max INTEGER,
  headquarters_city TEXT,
  headquarters_country TEXT DEFAULT 'CN',
  website TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  description TEXT,
  stage TEXT DEFAULT 'prospect',
  health_score INTEGER DEFAULT 50,
  nps_score INTEGER,
  lifetime_value BIGINT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(org_id);
CREATE INDEX IF NOT EXISTS idx_companies_stage ON companies(stage);

-- Cross-app sync log
CREATE TABLE IF NOT EXISTS cross_app_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_app TEXT NOT NULL,
  target_app TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sync_status ON cross_app_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_source ON cross_app_sync_log(source_app);
CREATE INDEX IF NOT EXISTS idx_sync_created ON cross_app_sync_log(created_at);

-- Contact app mapping
CREATE TABLE IF NOT EXISTS contact_app_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  app_name TEXT NOT NULL,
  app_entity_type TEXT NOT NULL,
  app_entity_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, app_name, app_entity_type, app_entity_id)
);
CREATE INDEX IF NOT EXISTS idx_cam_contact ON contact_app_mapping(contact_id);
CREATE INDEX IF NOT EXISTS idx_cam_app ON contact_app_mapping(app_name, app_entity_id);

-- ─── ORGANIZATIONS & USERS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size_category TEXT,
  website TEXT,
  linkedin_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  billing_email TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'trial',
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(org_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  title TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  locale TEXT DEFAULT 'zh-CN',
  notification_preferences JSONB DEFAULT '{}',
  ai_preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- ─── MANDATES & CANDIDATES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mandates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  role_type TEXT,
  level TEXT,
  function TEXT,
  department TEXT,
  city TEXT,
  country TEXT DEFAULT 'CN',
  remote_policy TEXT,
  salary_min BIGINT,
  salary_max BIGINT,
  salary_currency TEXT DEFAULT 'CNY',
  equity_offered BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'draft',
  opening_count INTEGER DEFAULT 1,
  placed_count INTEGER DEFAULT 0,
  fee_percentage DECIMAL(5,2) DEFAULT 20.00,
  fee_min BIGINT,
  fee_structure TEXT,
  start_date DATE,
  target_fill_date DATE,
  deadline_date DATE,
  confidential BOOLEAN DEFAULT FALSE,
  search_type TEXT,
  requirements JSONB DEFAULT '{}',
  ideal_profile JSONB DEFAULT '{}',
  interview_process JSONB DEFAULT '[]',
  stakeholders JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  current_company TEXT,
  current_title TEXT,
  current_city TEXT,
  current_country TEXT DEFAULT 'CN',
  years_experience INTEGER,
  education JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  languages JSONB DEFAULT '[]',
  certifications TEXT[] DEFAULT '{}',
  expected_salary_min BIGINT,
  expected_salary_max BIGINT,
  expected_salary_currency TEXT DEFAULT 'CNY',
  notice_period_days INTEGER,
  availability TEXT,
  source TEXT,
  stage TEXT DEFAULT 'discovered',
  talent_score INTEGER DEFAULT 0,
  ai_assessment JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  resume_url TEXT,
  cover_letter_url TEXT,
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS mandate_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  status TEXT DEFAULT 'sourced',
  consultant_rating INTEGER,
  client_rating INTEGER,
  ai_match_score DECIMAL(5,2),
  ai_match_reasoning TEXT,
  submission_notes TEXT,
  rejection_reason TEXT,
  interview_feedback JSONB DEFAULT '[]',
  rank INTEGER,
  submitted_at TIMESTAMPTZ,
  interviewed_at TIMESTAMPTZ,
  offered_at TIMESTAMPTZ,
  placed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(mandate_id, candidate_id)
);

-- ─── ACTIVITIES ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);

-- ─── COUNCIL ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS council_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  industry TEXT,
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  expertise TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  city TEXT,
  country TEXT DEFAULT 'CN',
  membership_tier TEXT DEFAULT 'individual',
  membership_status TEXT DEFAULT 'active',
  membership_started_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,
  founding_member BOOLEAN DEFAULT FALSE,
  council_credits INTEGER DEFAULT 0,
  credits_reset_at TIMESTAMPTZ,
  coaching_hours_used INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  is_public BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS council_coaching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES council_profiles(id),
  consultant_id UUID NOT NULL,
  session_type TEXT,
  status TEXT DEFAULT 'requested',
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_notes TEXT,
  credits_consumed INTEGER DEFAULT 1,
  member_rating INTEGER,
  member_feedback TEXT,
  consultant_notes TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS council_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  event_type TEXT,
  category TEXT,
  format TEXT,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  virtual_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  registered_count INTEGER DEFAULT 0,
  price_cny DECIMAL(10,2) DEFAULT 0,
  is_free_to_members BOOLEAN DEFAULT TRUE,
  credits_cost INTEGER DEFAULT 0,
  speaker_names TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft',
  recording_url TEXT,
  materials JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS council_event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES council_events(id),
  member_id UUID NOT NULL REFERENCES council_profiles(id),
  status TEXT DEFAULT 'registered',
  credits_consumed INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'free',
  stripe_payment_id TEXT,
  attended_at TIMESTAMPTZ,
  feedback JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- ─── DEX AI B2C ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dex_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  title TEXT,
  company TEXT,
  industry TEXT,
  executive_intro_used BOOLEAN DEFAULT FALSE,
  executive_intro_at TIMESTAMPTZ,
  intro_messages_used INTEGER DEFAULT 0,
  intro_messages_limit INTEGER DEFAULT 5,
  dex_credits INTEGER DEFAULT 0,
  credits_purchased_at TIMESTAMPTZ,
  subscription_tier TEXT,
  subscription_status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  graduation_to_council BOOLEAN DEFAULT FALSE,
  graduation_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS dex_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  topic TEXT,
  status TEXT DEFAULT 'active',
  message_count INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  is_intro_session BOOLEAN DEFAULT FALSE,
  model_used TEXT DEFAULT 'gpt-4o',
  metadata JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS dex_chat_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES dex_chat_sessions(id),
  user_id UUID NOT NULL,
  context_type TEXT,
  context_key TEXT,
  context_value JSONB NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dex_credit_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES dex_chat_sessions(id),
  credit_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  direction TEXT NOT NULL,
  description TEXT,
  related_product_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dex_credits_user ON dex_credit_consumption(user_id);

-- ─── COMMERCE LAYER ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  tier TEXT,
  price_cny DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  billing_cycle TEXT,
  credits_included INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  max_quantity INTEGER,
  requires_approval BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  org_id UUID,
  product_id UUID NOT NULL REFERENCES products(id),
  status TEXT DEFAULT 'pending',
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_type TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id),
  session_id UUID,
  description TEXT,
  product_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_credits_user ON credit_transactions(user_id);

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  applicable_categories TEXT[] DEFAULT '{}',
  applicable_tiers TEXT[] DEFAULT '{}',
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  min_order_amount DECIMAL(10,2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- ─── INTELLIGENCE LAYER ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intelligence_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT,
  url TEXT,
  api_endpoint TEXT,
  refresh_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT,
  reliability_score DECIMAL(3,2) DEFAULT 0.5,
  last_fetched_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS intelligence_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES intelligence_sources(id),
  org_id UUID,
  signal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  raw_content TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  relevance_score DECIMAL(3,2) DEFAULT 0.5,
  impact_level TEXT,
  companies_related UUID[] DEFAULT '{}',
  mandates_related UUID[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  geography TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  ai_enriched BOOLEAN DEFAULT FALSE,
  ai_analysis JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_signals_type ON intelligence_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_relevance ON intelligence_signals(relevance_score);

CREATE TABLE IF NOT EXISTS company_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  signal_id UUID REFERENCES intelligence_signals(id),
  data_type TEXT,
  period TEXT,
  value JSONB NOT NULL,
  previous_value JSONB,
  change_percentage DECIMAL(8,2),
  confidence DECIMAL(3,2) DEFAULT 0.5,
  source_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  channels TEXT[] DEFAULT '{in_app}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ─── DONE ───────────────────────────────────────────────────────────────────
-- Total: 57 tables
-- Execution: Paste into Supabase SQL Editor → Run
-- Order: Run AFTER connecting to rnnlteyqmtxkzllbohuu.supabase.co
-- Next: Enable RLS on all tables (separate script)
