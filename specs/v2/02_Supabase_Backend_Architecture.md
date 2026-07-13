# 02 — Supabase Backend Architecture Spec
## LYC Intelligence Platform v2.0

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Full backend architecture for LYC Intelligence platform  
**Dependencies:** None (foundational spec)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  React SPA (Vite + TypeScript) → Vercel Edge Deployment         │
│  Route-based code splitting, lazy loading, optimistic UI        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                    SUPABASE BACKEND                              │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Auth (JWT)  │  │  PostgreSQL  │  │  Edge Functions (Deno) │ │
│  │  + RLS       │  │  + Row Level │  │  + Cron Triggers       │ │
│  │  + MFA       │  │    Security  │  │  + Webhooks            │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Storage     │  │  Realtime    │  │  AI/ML Edge Functions  │ │
│  │  (Avatars,   │  │  (WebSocket  │  │  (OpenAI, DeepSeek     │ │
│  │   Documents) │  │   channels)  │  │   routing)             │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  Stripe (Payments) │ Resend (Email) │ DeepSeek API │ OpenAI     │
│  Unsplash (Images) │ Upstash (Redis/Rate Limit) │ Crisp (Chat) │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Database Design Principles

1. **Every table has RLS** — zero exceptions, zero public tables
2. **Soft deletes everywhere** — `deleted_at TIMESTAMPTZ DEFAULT NULL`
3. **Audit trail on all mutations** — `created_at`, `updated_at`, `created_by`, `updated_by`
4. **UUID primary keys** — `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
5. **Enum columns use TEXT + CHECK** — not PostgreSQL ENUM types (easier migrations)
6. **JSONB for flexible schemas** — metadata, preferences, dynamic fields
7. **Indexed foreign keys** — every FK column has an index
8. **Composite indexes for common queries** — covering indexes where possible
9. **Timestamps in UTC** — `TIMESTAMPTZ` everywhere, display in user timezone
10. **Multi-tenant via org_id** — all data scoped to organization

---

## 2. Authentication & Authorization

### 2.1 Auth Flow

```
User → /login → Email/Password or OAuth (Google)
  → Supabase Auth issues JWT (access_token + refresh_token)
  → Client stores in httpOnly cookie (not localStorage)
  → Every API call includes JWT in Authorization header
  → RLS policies evaluate JWT claims (auth.uid(), auth.jwt())
```

### 2.2 User Roles (RBAC)

| Role | Scope | Description |
|------|-------|-------------|
| `super_admin` | Global | NEXUS system admin, full access |
| `admin` | Org-level | Organization administrator |
| `consultant` | Org-level | LYC consultant, client-facing |
| `client_admin` | Company-level | Client company admin |
| `client_user` | Company-level | Client company user |
| `council_member` | Personal | Council membership holder |
| `candidate` | Personal | Job seeker / candidate |
| `b2c_user` | Personal | DEX AI consumer (Executive Introduction) |

### 2.3 RLS Policy Pattern

```sql
-- Standard RLS template
CREATE POLICY "Users can view own org data"
ON table_name
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.org_memberships
    WHERE user_id = auth.uid()
    AND status = 'active'
  )
);

-- Role-based policy
CREATE POLICY "Admins can manage all org data"
ON table_name
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.org_memberships
    WHERE user_id = auth.uid()
    AND org_id = table_name.org_id
    AND role IN ('super_admin', 'admin')
    AND status = 'active'
  )
);
```

### 2.4 Custom JWT Claims

```typescript
// After login, enrich JWT with:
{
  "sub": "uuid",           // user id
  "org_id": "uuid",        // primary org
  "role": "consultant",     // primary role
  "roles": ["consultant", "council_member"],  // all active roles
  "council_tier": "professional",  // null if not member
  "candidate_status": "active",     // null if not candidate
  "permissions": ["read:clients", "write:mandates", ...]
}
```

---

## 3. Core Schema — Organizations & Users

### 3.1 organizations

```sql
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'sme', 'mid-market', 'enterprise')),
  website TEXT,
  linkedin_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  billing_email TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_orgs_slug ON organizations(slug);
CREATE INDEX idx_orgs_stripe ON organizations(stripe_customer_id);
```

### 3.2 org_memberships

```sql
CREATE TABLE org_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'consultant', 'client_admin', 'client_user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_memberships_user ON org_memberships(user_id);
```

### 3.3 user_profiles

```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  title TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'Asia/Shanghai',
  locale TEXT DEFAULT 'zh-CN',
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "push": true,
    "in_app": true,
    "digest_frequency": "daily"
  }',
  ai_preferences JSONB DEFAULT '{
    "model_preference": "gpt-4o",
    "language": "auto",
    "response_style": "professional"
  }',
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_profiles_user ON user_profiles(user_id);
```

---

## 4. Client Portal Schema — Companies, Mandates, Candidates

### 4.1 companies

```sql
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  industry TEXT,
  sub_industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'sme', 'mid-market', 'enterprise', 'multinational')),
  employee_count_min INTEGER,
  employee_count_max INTEGER,
  annual_revenue_min BIGINT,
  annual_revenue_max BIGINT,
  headquarters_city TEXT,
  headquarters_country TEXT DEFAULT 'CN',
  website TEXT,
  linkedin_url TEXT,
  logo_url TEXT,
  description TEXT,
  stage TEXT CHECK (stage IN ('prospect', 'qualified', 'active_client', 'churned', 'dormant')),
  health_score INTEGER DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  nps_score INTEGER CHECK (nps_score BETWEEN -100 AND 100),
  lifetime_value BIGINT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_companies_org ON companies(org_id);
CREATE INDEX idx_companies_stage ON companies(stage);
CREATE INDEX idx_companies_health ON companies(health_score);
CREATE INDEX idx_companies_tags ON companies USING GIN(tags);
```

### 4.2 mandates

```sql
CREATE TABLE mandates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  role_type TEXT CHECK (role_type IN ('full_time', 'part_time', 'contract', 'internship', 'board')),
  level TEXT CHECK (level IN ('junior', 'mid', 'senior', 'director', 'vp', 'c_suite', 'board')),
  function TEXT,
  department TEXT,
  city TEXT,
  country TEXT DEFAULT 'CN',
  remote_policy TEXT CHECK (remote_policy IN ('onsite', 'hybrid', 'remote', 'flexible')),
  salary_min BIGINT,
  salary_max BIGINT,
  salary_currency TEXT DEFAULT 'CNY',
  equity_offered BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical', 'executive')),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'active', 'on_hold', 'shortlisting',
    'interviewing', 'offer_pending', 'filled', 'cancelled', 'reopened'
  )),
  opening_count INTEGER DEFAULT 1,
  placed_count INTEGER DEFAULT 0,
  fee_percentage DECIMAL(5,2) DEFAULT 20.00,
  fee_min BIGINT,
  fee_structure TEXT CHECK (fee_structure IN ('percentage', 'flat', 'retainer', 'contingency')),
  start_date DATE,
  target_fill_date DATE,
  deadline_date DATE,
  confidential BOOLEAN DEFAULT FALSE,
  search_type TEXT CHECK (search_type IN ('retained', 'contingent', 'rpo')),
  requirements JSONB DEFAULT '{}',
  ideal_profile JSONB DEFAULT '{}',
  interview_process JSONB DEFAULT '[]',
  stakeholders JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_mandates_org ON mandates(org_id);
CREATE INDEX idx_mandates_company ON mandates(company_id);
CREATE INDEX idx_mandates_status ON mandates(status);
CREATE INDEX idx_mandates_priority ON mandates(priority);
CREATE INDEX idx_mandates_level ON mandates(level);
```

### 4.3 candidates

```sql
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
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
  availability TEXT CHECK (availability IN ('immediate', '1_month', '2_months', '3_months', 'negotiable', 'not_looking')),
  source TEXT CHECK (source IN (
    'referral', 'linkedin', 'job_board', 'direct_application', 'agency',
    'conference', 'database', 'ai_discovery', 'council_member', 'other'
  )),
  stage TEXT DEFAULT 'discovered' CHECK (stage IN (
    'discovered', 'contacted', 'screening', 'qualified', 'submitted',
    'first_interview', 'second_interview', 'final_interview', 'offer',
    'accepted', 'placed', 'rejected', 'withdrawn', 'blacklisted'
  )),
  talent_score INTEGER DEFAULT 0 CHECK (talent_score BETWEEN 0 AND 100),
  ai_assessment JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  resume_url TEXT,
  cover_letter_url TEXT,
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_candidates_org ON candidates(org_id);
CREATE INDEX idx_candidates_stage ON candidates(stage);
CREATE INDEX idx_candidates_source ON candidates(source);
CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_tags ON candidates USING GIN(tags);
CREATE INDEX idx_candidates_score ON candidates(talent_score);
```

### 4.4 mandate_candidates (junction)

```sql
CREATE TABLE mandate_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  status TEXT DEFAULT 'sourced' CHECK (status IN (
    'sourced', 'screening', 'submitted', 'client_review', 'interview',
    'offer', 'placed', 'rejected', 'withdrawn', 'shortlisted'
  )),
  consultant_rating INTEGER CHECK (consultant_rating BETWEEN 1 AND 5),
  client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),
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
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(mandate_id, candidate_id)
);

CREATE INDEX idx_mc_mandate ON mandate_candidates(mandate_id);
CREATE INDEX idx_mc_candidate ON mandate_candidates(candidate_id);
CREATE INDEX idx_mc_status ON mandate_candidates(status);
```

### 4.5 activities

```sql
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'mandate', 'candidate', 'contact', 'task', 'deal')),
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'call', 'email', 'meeting', 'task', 'status_change',
    'comment', 'file_upload', 'ai_analysis', 'pipeline_move',
    'reminder', 'follow_up', 'interview', 'feedback', 'system'
  )),
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_activities_org ON activities(org_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_due ON activities(due_at);
```

---

## 5. Council Portal Schema (v2.0)

### 5.1 council_profiles

```sql
CREATE TABLE council_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
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
  membership_tier TEXT DEFAULT 'individual' CHECK (membership_tier IN (
    'founding', 'individual', 'corporate', 'pe_partner'
  )),
  membership_status TEXT DEFAULT 'active' CHECK (membership_status IN (
    'pending', 'active', 'suspended', 'expired', 'cancelled'
  )),
  membership_started_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,
  founding_member BOOLEAN DEFAULT FALSE,
  council_credits INTEGER DEFAULT 0,
  credits_reset_at TIMESTAMPTZ,
  coaching_hours_used INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
    'unverified', 'pending', 'verified', 'rejected'
  )),
  is_public BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_council_tier ON council_profiles(membership_tier);
CREATE INDEX idx_council_status ON council_profiles(membership_status);
CREATE INDEX idx_council_expertise ON council_profiles USING GIN(expertise);
```

### 5.2 council_coaching_sessions

```sql
CREATE TABLE council_coaching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES council_profiles(id),
  consultant_id UUID NOT NULL REFERENCES auth.users(id),
  session_type TEXT CHECK (session_type IN (
    'career_coaching', 'executive_coaching', 'leadership_coaching',
    'interview_prep', 'salary_negotiation', 'business_strategy',
    'transition_coaching', 'peer_mentoring'
  )),
  status TEXT DEFAULT 'requested' CHECK (status IN (
    'requested', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_notes TEXT,
  credits_consumed INTEGER DEFAULT 1,
  member_rating INTEGER CHECK (member_rating BETWEEN 1 AND 5),
  member_feedback TEXT,
  consultant_notes TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_coaching_member ON council_coaching_sessions(member_id);
CREATE INDEX idx_coaching_consultant ON council_coaching_sessions(consultant_id);
CREATE INDEX idx_coaching_status ON council_coaching_sessions(status);
CREATE INDEX idx_coaching_scheduled ON council_coaching_sessions(scheduled_at);
```

### 5.3 council_events

```sql
CREATE TABLE council_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN (
    'workshop', 'webinar', 'roundtable', 'networking', 'masterclass',
    'firing_line', 'keynote', 'panel', 'social'
  )),
  category TEXT,
  format TEXT CHECK (format IN ('in_person', 'virtual', 'hybrid')),
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
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'registration_open', 'registration_closed',
    'in_progress', 'completed', 'cancelled'
  )),
  recording_url TEXT,
  materials JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_events_status ON council_events(status);
CREATE INDEX idx_events_starts ON council_events(starts_at);
CREATE INDEX idx_events_type ON council_events(event_type);
```

### 5.4 council_event_registrations

```sql
CREATE TABLE council_event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES council_events(id),
  member_id UUID NOT NULL REFERENCES council_profiles(id),
  status TEXT DEFAULT 'registered' CHECK (status IN (
    'registered', 'waitlisted', 'confirmed', 'checked_in', 'attended', 'cancelled', 'no_show'
  )),
  credits_consumed INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
  stripe_payment_id TEXT,
  attended_at TIMESTAMPTZ,
  feedback JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_event_reg_event ON council_event_registrations(event_id);
CREATE INDEX idx_event_reg_member ON council_event_registrations(member_id);
```

---

## 6. DEX AI B2C Schema

### 6.1 dex_user_profiles

```sql
CREATE TABLE dex_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
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
  subscription_tier TEXT CHECK (subscription_tier IN (
    NULL, 'monthly_member', 'monthly_pro'
  )),
  subscription_status TEXT CHECK (subscription_status IN (
    NULL, 'active', 'past_due', 'cancelled'
  )),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  graduation_to_council BOOLEAN DEFAULT FALSE,
  graduation_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_dex_user ON dex_user_profiles(user_id);
CREATE INDEX idx_dex_credits ON dex_user_profiles(dex_credits);
```

### 6.2 dex_chat_sessions

```sql
CREATE TABLE dex_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  topic TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
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

CREATE INDEX idx_dex_sessions_user ON dex_chat_sessions(user_id);
CREATE INDEX idx_dex_sessions_status ON dex_chat_sessions(status);
```

### 6.3 dex_chat_context

```sql
CREATE TABLE dex_chat_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES dex_chat_sessions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  context_type TEXT CHECK (context_type IN ('conversation_summary', 'user_preference', 'topic_memory', 'industry_context')),
  context_key TEXT,
  context_value JSONB NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dex_context_session ON dex_chat_context(session_id);
CREATE INDEX idx_dex_context_user ON dex_chat_context(user_id);
CREATE INDEX idx_dex_context_type ON dex_chat_context(context_type);
```

### 6.4 dex_credit_consumption

```sql
CREATE TABLE dex_credit_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID REFERENCES dex_chat_sessions(id),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('intro_message', 'dex_credit', 'subscription_monthly')),
  amount INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
  description TEXT,
  related_product_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dex_credits_user ON dex_credit_consumption(user_id);
CREATE INDEX idx_dex_credits_type ON dex_credit_consumption(credit_type);
CREATE INDEX idx_dex_credits_created ON dex_credit_consumption(created_at);
```

---

## 7. Commerce Layer Schema

### 7.1 products

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'council_membership', 'council_addon', 'dex_credit_pack',
    'dex_subscription', 'event_ticket', 'coaching_session',
    'assessment', 'report', 'consulting_package'
  )),
  tier TEXT CHECK (tier IN (
    'founding', 'individual', 'corporate', 'pe_partner',
    'starter', 'professional', 'executive',
    'monthly_member', 'monthly_pro'
  )),
  price_cny DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  billing_cycle TEXT CHECK (billing_cycle IN ('one_time', 'monthly', 'quarterly', 'annual')),
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

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_tier ON products(tier);
CREATE INDEX idx_products_code ON products(product_code);
```

### 7.2 orders

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'payment_required', 'paid', 'processing',
    'fulfilled', 'cancelled', 'refunded', 'partially_refunded', 'failed'
  )),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  payment_method TEXT CHECK (payment_method IN ('stripe', 'bank_transfer', 'wechat_pay', 'alipay', 'manual', 'credits')),
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

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);
```

### 7.3 credit_transactions

```sql
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('council_credits', 'dex_credits')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'grant', 'consumption', 'refund', 'expiry', 'adjustment', 'transfer'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id),
  session_id UUID,
  description TEXT,
  product_code TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credits_user ON credit_transactions(user_id);
CREATE INDEX idx_credits_type ON credit_transactions(credit_type);
CREATE INDEX idx_credits_created ON credit_transactions(created_at);
```

### 7.4 discount_codes

```sql
CREATE TABLE discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_trial')),
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
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_discounts_code ON discount_codes(code);
CREATE INDEX idx_discounts_active ON discount_codes(is_active, valid_from, valid_until);
```

---

## 8. Intelligence Layer Schema

### 8.1 intelligence_sources

```sql
CREATE TABLE intelligence_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN (
    'rss', 'api', 'web_scrape', 'manual', 'user_submission',
    'linkedin', 'glassdoor', 'job_board', 'news', 'regulatory'
  )),
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

CREATE INDEX idx_sources_type ON intelligence_sources(source_type);
CREATE INDEX idx_sources_active ON intelligence_sources(is_active);
```

### 8.2 intelligence_signals

```sql
CREATE TABLE intelligence_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES intelligence_sources(id),
  org_id UUID REFERENCES organizations(id),
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'funding', 'hiring', 'departure', 'expansion', 'restructuring',
    'acquisition', 'ipo', 'partnership', 'regulatory', 'market_shift',
    'competitor_move', 'talent_movement', 'compensation_trend',
    'industry_report', 'executive_change', 'office_change'
  )),
  title TEXT NOT NULL,
  summary TEXT,
  raw_content TEXT,
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  relevance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
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

CREATE INDEX idx_signals_type ON intelligence_signals(signal_type);
CREATE INDEX idx_signals_org ON intelligence_signals(org_id);
CREATE INDEX idx_signals_relevance ON intelligence_signals(relevance_score);
CREATE INDEX idx_signals_companies ON intelligence_signals USING GIN(companies_related);
CREATE INDEX idx_signals_industries ON intelligence_signals USING GIN(industries);
CREATE INDEX idx_signals_discovered ON intelligence_signals(discovered_at);
```

### 8.3 company_intelligence

```sql
CREATE TABLE company_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  signal_id UUID REFERENCES intelligence_signals(id),
  data_type TEXT CHECK (data_type IN (
    'headcount_trend', 'hiring_velocity', 'attrition_rate',
    'compensation_benchmark', 'funding_status', 'growth_metrics',
    'org_changes', 'tech_stack', 'culture_signals', 'risk_indicators'
  )),
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

CREATE INDEX idx_company_intel_company ON company_intelligence(company_id);
CREATE INDEX idx_company_intel_type ON company_intelligence(data_type);
CREATE INDEX idx_company_intel_date ON company_intelligence(effective_date);
```

---

## 9. Cross-App Shared Infrastructure

### 9.1 contacts (unified)

```sql
CREATE TABLE contacts (
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

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_linkedin ON contacts(linkedin_url);
```

### 9.2 contact_app_mapping

```sql
CREATE TABLE contact_app_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  app_name TEXT NOT NULL CHECK (app_name IN ('LYC_Intelligence', 'WAVE', 'VISTA')),
  app_entity_type TEXT NOT NULL,
  app_entity_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_id, app_name, app_entity_type, app_entity_id)
);

CREATE INDEX idx_cam_contact ON contact_app_mapping(contact_id);
CREATE INDEX idx_cam_app ON contact_app_mapping(app_name, app_entity_id);
```

### 9.3 cross_app_sync_log

```sql
CREATE TABLE cross_app_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_app TEXT NOT NULL CHECK (source_app IN ('LYC_Intelligence', 'WAVE', 'VISTA')),
  target_app TEXT NOT NULL CHECK (target_app IN ('LYC_Intelligence', 'WAVE', 'VISTA')),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_status ON cross_app_sync_log(status);
CREATE INDEX idx_sync_source ON cross_app_sync_log(source_app);
CREATE INDEX idx_sync_target ON cross_app_sync_log(target_app);
CREATE INDEX idx_sync_created ON cross_app_sync_log(created_at);
```

---

## 10. Edge Functions Architecture

### 10.1 Function Inventory

| Function | Trigger | Purpose |
|----------|---------|---------|
| `ai-chat` | HTTP | DEX AI chat completions (DeepSeek/OpenAI routing) |
| `ai-match` | HTTP | Candidate-mandate AI matching |
| `ai-assess` | HTTP | Candidate assessment generation |
| `ai-enrich` | HTTP | Company/candidate data enrichment |
| `ai-signal` | Cron (15min) | Intelligence signal processing |
| `stripe-webhook` | HTTP | Payment event handling |
| `email-send` | HTTP | Transactional email via Resend |
| `email-digest` | Cron (daily) | Daily digest email compilation |
| `credit-expiry` | Cron (daily) | Credit expiry processing |
| `health-check` | HTTP | System health monitoring |
| `notion-sync` | HTTP | Notion database sync |
| `feishu-sync` | HTTP | Feishu webhook integration |

### 10.2 AI Routing Pattern

```typescript
// Edge Function: ai-chat
// Routes to DeepSeek API (NOT Coze LLM)
async function routeAI(prompt: string, model: string) {
  const router = {
    'flash': { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    'pro': { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-reasoner' },
    'gpt-4o': { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' }
  };
  // ... implementation
}
```

---

## 11. Realtime & Notifications

### 11.1 Realtime Channels

| Channel | Events | Subscribers |
|---------|--------|-------------|
| `mandates:{org_id}` | INSERT, UPDATE | All org consultants |
| `candidates:{org_id}` | INSERT, UPDATE | All org consultants |
| `activities:{entity_type}:{entity_id}` | INSERT | Entity watchers |
| `notifications:{user_id}` | INSERT | Specific user |
| `council_feed` | INSERT, UPDATE | All council members |
| `dex_chat:{session_id}` | INSERT | Chat participants |

### 11.2 Notification System

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN (
    'mention', 'assignment', 'status_change', 'reminder',
    'system', 'billing', 'event', 'coaching', 'intelligence',
    'ai_insight', 'deadline', 'approval'
  )),
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

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

---

## 12. Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Public | User avatar images |
| `resumes` | Private (RLS) | Candidate resume files |
| `documents` | Private (RLS) | General document storage |
| `event-materials` | Public | Event slides, recordings |
| `company-logos` | Public | Company logo images |
| `ai-exports` | Private (RLS) | AI-generated reports/exports |
| `integrations` | Private (RLS) | Third-party integration files |

---

## 13. Database Performance & Maintenance

### 13.1 Indexing Strategy
- All FK columns indexed
- Composite indexes for common WHERE + ORDER BY patterns
- GIN indexes for JSONB and array columns
- Partial indexes for active records: `WHERE deleted_at IS NULL`

### 13.2 Partitioning
- `activities` — partition by `created_at` (monthly)
- `notifications` — partition by `created_at` (monthly)
- `intelligence_signals` — partition by `discovered_at` (monthly)
- `credit_transactions` — partition by `created_at` (quarterly)

### 13.3 Materialized Views
```sql
-- Refreshed hourly via pg_cron
CREATE MATERIALIZED VIEW mv_company_health AS
SELECT
  c.id AS company_id,
  c.org_id,
  c.health_score,
  COUNT(DISTINCT m.id) AS active_mandates,
  COUNT(DISTINCT mc.candidate_id) AS pipeline_candidates,
  AVG(mc.ai_match_score) AS avg_match_score,
  MAX(a.created_at) AS last_activity_at
FROM companies c
LEFT JOIN mandates m ON m.company_id = c.id AND m.status = 'active'
LEFT JOIN mandate_candidates mc ON mc.mandate_id = m.id
LEFT JOIN activities a ON a.entity_type = 'company' AND a.entity_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.org_id, c.health_score;
```

---

## 14. Migration Strategy

### 14.1 Execution Order
1. Run `master_migration.sql` (57 tables) in Supabase SQL Editor
2. Enable RLS on all tables
3. Create RLS policies per spec above
4. Seed products table with pricing catalog
5. Create Edge Functions
6. Set up Storage buckets
7. Configure Realtime channels
8. Set up pg_cron jobs

### 14.2 Rollback Plan
- Each migration wrapped in transaction
- Drop statements in reverse order
- Data backup before each migration step

---

## Ticket Summary

| Category | Tickets | IDs |
|----------|:-------:|-----|
| Database Schema | 57 tables | `DB-001` to `DB-057` |
| RLS Policies | ~45 policies | `RLS-001` to `RLS-045` |
| Edge Functions | 12 functions | `EF-001` to `EF-012` |
| Storage Setup | 7 buckets | `ST-001` to `ST-007` |
| Realtime Config | 6 channels | `RT-001` to `RT-006` |
| Cron Jobs | 5 jobs | `CRON-001` to `CRON-005` |
| **TOTAL** | **~132** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
