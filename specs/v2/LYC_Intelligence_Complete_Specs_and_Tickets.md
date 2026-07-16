# LYC Intelligence (DEX AI) — Complete Specs & Tickets Bundle

> **Generated:** 2026-07-16 11:11 HKT
> **Repository:** [kevinhongfr-star/lyc-intelligence](https://github.com/kevinhongfr-star/lyc-intelligence)
> **Specs:** [specs/v2/](https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/specs/v2)
> **Issues:** https://github.com/kevinhongfr-star/lyc-intelligence/issues

---

---

# 00 — Master Ticket Registry
## LYC Intelligence Platform v2.0 — Complete Ticket Index

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM)  
**Scope:** All tickets across all specs — single source of truth  
**Note:** WAVE and VISTA are OUT OF SCOPE (separate products)

---

## Summary

| Spec | Name | Tickets |
|------|------|:-------:|
| [01](./01_Internal_Portal_Spec.md) | Internal Portal (Consultants) | ~73 |
| [02](./02_Supabase_Backend_Architecture.md) | Supabase Backend | ~132 |
| [03](./03_UX_Behavioral_Mechanics.md) | UX & Behavioral Mechanics | ~50 |
| [04](./04_Client_Portal_Spec.md) | Client Portal (Companies) | ~67 |
| [05](./05_The_Council_Portal_Spec.md) | Council Portal + DEX AI B2C | ~112 |
| [05b](./05b_The_Council_Portal_Spec_v2_Addendum.md) | Council v2.1 Addendum | ~45 |
| [05c](./05c_The_Council_v2_Backend_Wiring.md) | Council Backend Wiring | ~27 |
| [06](./06_Intelligence_Layer_Spec.md) | Intelligence Layer | ~44 |
| [07](./07_Candidate_Portal_Spec_v2.md) | Candidate Portal v2.1 | ~68 |
| [08](./08_Commerce_Layer_Spec.md) | Commerce Layer v2.0 | ~72 |
| | **TOTAL** | **~690** |

---

## Build Priority

### Phase 1: Foundation (Week 1-2)
- 02: Supabase Backend + master_migration.sql
- 03: UX patterns & design system
- 08: Commerce Layer (pricing, credits, Stripe)

### Phase 2: Core Portals (Week 3-5)
- 05 + 05b + 05c: Council Portal + DEX AI B2C
- 06: Intelligence Layer
- 01: Internal Portal

### Phase 3: Extended (Week 6-7)
- 04: Client Portal
- 07: Candidate Portal

### Phase 4: Polish (Week 8)
- Cross-portal integration testing
- Performance optimization
- Accessibility audit
- i18n completion

---

## Database

**Migration:** `master_migration.sql` (57 tables)  
**Execution:** Supabase SQL Editor  
**RLS:** Enable after migration (separate step)

---

## Quick Reference

| Portal | Route Prefix | Auth |
|--------|-------------|------|
| Internal | `/app/` | Consultant+ |
| Client | `/client/` | Client user+ |
| Council | `/council/` | Member (or public landing) |
| DEX AI | `/dex/` | Auth (any user) |
| Candidate | `/candidates/` | Auth (applicant+) |
| Admin | `/admin/` | Super admin |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13

---

# 01 — Internal Portal Spec
## LYC Intelligence Platform — Consultant Experience

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Internal portal for LYC consultants and admin  
**Dependencies:** 02 (Supabase), 04 (Client Portal), 06 (Intelligence Layer)

---

## 1. Portal Overview

### 1.1 Purpose

The Internal Portal is where LYC consultants operate:
- Manage client mandates and candidate pipelines
- Access company intelligence
- Track daily tasks and activities
- View performance metrics
- Administer the platform

### 1.2 User Roles

| Role | Access | Description |
|------|--------|-------------|
| `super_admin` | Full platform | NEXUS system admin |
| `admin` | Org-level admin | Team lead, billing, settings |
| `consultant` | Own mandates/clients | Day-to-day recruitment |
| `researcher` | Read-only + research | Support role |

### 1.3 Page Map

| # | Page | Route | Purpose |
|---|------|-------|---------|
| IN1 | Consultant Dashboard | `/app/dashboard` | Daily overview, tasks, pipeline |
| IN2 | Mandate Management | `/app/mandates` | All mandates (own + team) |
| IN3 | Candidate Management | `/app/candidates` | All candidates |
| IN4 | Company Management | `/app/companies` | Client companies |
| IN5 | Activity & Tasks | `/app/activities` | Task list, activity log |
| IN6 | Reports & Analytics | `/app/reports` | Performance metrics |
| IN7 | Team Management | `/app/team` | Team members, assignments |
| IN8 | Admin Settings | `/admin/settings` | Platform config |

**Total: 8 pages (+ admin)**

---

## 2. Page Specifications

### 2.1 IN1: Consultant Dashboard

**Route:** `/app/dashboard`  
**Access:** Consultants

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Good morning, [Name]                 [Date] [⚙]    │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ My      │ │ Active │ │Due     │ │Placed  │      │
│  │ Tasks   │ │ Mandates│ │Today  │ │This Mo │      │
│  │   12    │ │    8    │ │   5    │ │   2    │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ TODAY'S PRIORITIES                            │  │
│  │ ☐ Review 3 new candidates for VP Eng         │  │
│  │ ☐ Submit shortlist to Tech Corp               │  │
│  │ ● Call with FinanceCo at 14:00                │  │
│  │ ☐ Follow up with candidate Zhang              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ PIPELINE SNAPSHOT   │ │ AI INSIGHTS          │  │
│  │ [Pipeline funnel]   │ │ • 3 new signals for  │  │
│  │                     │ │   Tech Corp           │  │
│  │                     │ │ • Zhang Wei matched  │  │
│  │                     │ │   92% for CTO role    │  │
│  └─────────────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `IN-DASH-001`: Dashboard KPI cards
- `IN-DASH-002`: Today's priorities (task list)
- `IN-DASH-003`: Pipeline snapshot (funnel chart)
- `IN-DASH-004`: AI insights widget
- `IN-DASH-005`: Quick actions (new mandate, new candidate)
- `IN-DASH-006`: Recent activity feed
- `IN-DASH-007`: Upcoming deadlines
- `IN-DASH-008`: Global search (Cmd+K)

---

### 2.2 IN2: Mandate Management

**Route:** `/app/mandates`  
**Access:** Consultants

**Features:**
- All mandates with filters
- Kanban view (by status)
- Table view (sortable columns)
- Create/edit mandate
- Assign consultants
- Bulk operations

**Tickets:**
- `IN-MAN-001`: Mandate table view
- `IN-MAN-002`: Kanban board view (toggle)
- `IN-MAN-003`: Advanced filters
- `IN-MAN-004`: Create mandate wizard
- `IN-MAN-005`: Edit mandate form
- `IN-MAN-006`: Assign/reassign consultant
- `IN-MAN-007`: Bulk operations (close, archive, assign)
- `IN-MAN-008`: Saved views (filter presets)
- `IN-MAN-009`: Mandate detail (inline expand)
- `IN-MAN-010`: CSV export

---

### 2.3 IN3: Candidate Management

**Route:** `/app/candidates`  
**Access:** Consultants

**Features:**
- All candidates database
- Search/filter (skills, experience, location)
- Add new candidate
- Import from CSV/LinkedIn
- AI enrichment trigger
- Bulk operations

**Tickets:**
- `IN-CAND-001`: Candidate table view
- `IN-CAND-002`: Advanced search/filter
- `IN-CAND-003`: Add candidate form
- `IN-CAND-004`: Resume upload + AI parsing
- `IN-CAND-005`: LinkedIn import
- `IN-CAND-006`: AI enrichment trigger
- `IN-CAND-007`: Bulk operations
- `IN-CAND-008`: Candidate detail (inline/side panel)
- `IN-CAND-009`: Merge duplicates
- `IN-CAND-010`: Export candidates

---

### 2.4 IN4: Company Management

**Route:** `/app/companies`  
**Access:** Consultants

**Features:**
- All client companies
- Company 360° intelligence view
- Add/edit company
- Company health tracking
- Linked mandates and candidates

**Tickets:**
- `IN-COMP-001`: Company list view
- `IN-COMP-002`: Company detail page
- `IN-COMP-003`: Company 360° intelligence (delegates to 06)
- `IN-COMP-004`: Add/edit company form
- `IN-COMP-005`: Company health score
- `IN-COMP-006`: Linked mandates panel
- `IN-COMP-007`: Linked candidates panel
- `IN-COMP-008`: Company merge

---

### 2.5 IN5: Activity & Tasks

**Route:** `/app/activities`  
**Access:** Consultants

**Features:**
- Task list (personal + team)
- Activity log (all entities)
- Calendar view
- Reminders and notifications
- Bulk task operations

**Tickets:**
- `IN-ACT-001`: Task list (my tasks)
- `IN-ACT-002`: Team tasks view
- `IN-ACT-003`: Activity log (entity timeline)
- `IN-ACT-004`: Calendar view
- `IN-ACT-005`: Create task form
- `IN-ACT-006`: Task completion toggle
- `IN-ACT-007`: Reminder setup
- `IN-ACT-008`: Activity filtering

---

### 2.6 IN6: Reports & Analytics

**Route:** `/app/reports`  
**Access:** Consultants (own data) + Admin (all data)

**Features:**
- Personal performance metrics
- Team performance
- Placement analytics
- Time-to-fill tracking
- Pipeline conversion rates
- Revenue tracking

**Tickets:**
- `IN-REP-001`: Personal performance dashboard
- `IN-REP-002`: Team performance view (admin)
- `IN-REP-003`: Placement analytics
- `IN-REP-004`: Time-to-fill analysis
- `IN-REP-005`: Pipeline conversion funnel
- `IN-REP-006`: Revenue tracking
- `IN-REP-007`: Report export (PDF/CSV)
- `IN-REP-008`: Custom date range

---

### 2.7 IN7: Team Management

**Route:** `/app/team`  
**Access:** Admin only

**Features:**
- Team member list
- Roles and permissions
- Workload distribution
- Performance overview

**Tickets:**
- `IN-TEAM-001`: Team member list
- `IN-TEAM-002`: Role management
- `IN-TEAM-003`: Workload distribution view
- `IN-TEAM-004`: Team performance overview
- `IN-TEAM-005`: Invite new member

---

### 2.8 IN8: Admin Settings

**Route:** `/admin/settings`  
**Access:** Super admin

**Features:**
- Organization settings
- Integration configuration
- AI model settings
- Notification templates
- System health

**Tickets:**
- `IN-ADM-001`: Organization settings
- `IN-ADM-002`: Integration configuration (Stripe, Resend, etc.)
- `IN-ADM-003`: AI model settings (DeepSeek routing)
- `IN-ADM-004`: Notification template editor
- `IN-ADM-005`: System health dashboard
- `IN-ADM-006`: Audit log viewer

---

## 3. Global Features

### 3.1 Global Search (Cmd+K)

**Shortcut:** Cmd+K (Mac) / Ctrl+K (Windows)

**Searches across:**
- Mandates (by title, company, status)
- Candidates (by name, skills, company)
- Companies (by name, industry)
- Activities (by type, description)
- Settings (quick navigation)

**Tickets:**
- `IN-GLB-001`: Cmd+K search modal
- `IN-GLB-002`: Search across all entities
- `IN-GLB-003`: Keyboard navigation
- `IN-GLB-004`: Recent searches
- `IN-GLB-005`: Search result grouping

### 3.2 Sidebar Navigation

**Style:** Notion/Vercel-style collapsible sidebar

```
┌──────────┐
│ LYC Logo │
│          │
│ 🏠 Home  │
│ 📋 Mandates│
│ 👤 Candidates│
│ 🏢 Companies│
│ ✅ Tasks  │
│ 📊 Reports│
│          │
│ ⚙ Settings│
│ 👤 Profile│
└──────────┘
```

**Tickets:**
- `IN-NAV-001`: Sidebar navigation component
- `IN-NAV-002`: Collapsible/expandable
- `IN-NAV-003`: Active page indicator
- `IN-NAV-004`: Mobile responsive (hamburger)
- `IN-NAV-005`: Badge counts (tasks, notifications)

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| IN-DASH: Dashboard | 8 | `IN-DASH-001` to `IN-DASH-008` |
| IN-MAN: Mandate Mgmt | 10 | `IN-MAN-001` to `IN-MAN-010` |
| IN-CAND: Candidate Mgmt | 10 | `IN-CAND-001` to `IN-CAND-010` |
| IN-COMP: Company Mgmt | 8 | `IN-COMP-001` to `IN-COMP-008` |
| IN-ACT: Activities | 8 | `IN-ACT-001` to `IN-ACT-008` |
| IN-REP: Reports | 8 | `IN-REP-001` to `IN-REP-008` |
| IN-TEAM: Team Mgmt | 5 | `IN-TEAM-001` to `IN-TEAM-005` |
| IN-ADM: Admin Settings | 6 | `IN-ADM-001` to `IN-ADM-006` |
| IN-GLB: Global Search | 5 | `IN-GLB-001` to `IN-GLB-005` |
| IN-NAV: Navigation | 5 | `IN-NAV-001` to `IN-NAV-005` |
| **TOTAL** | **~73** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

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

---

# 03 — UX & Behavioral Mechanics Spec
## LYC Intelligence Platform — Shared UX Patterns

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Cross-portal UX patterns, state machines, notifications, design system  
**Dependencies:** 02 (Supabase)

---

## 1. Design System

### 1.1 Theme

- **Style:** Clean, modern, professional (inspired by Linear, Notion, Vercel)
- **Light theme default** with dark mode toggle
- **Colors:** Blue primary (#2563EB), neutral grays, semantic colors (green=success, yellow=warning, red=error)
- **Typography:** Inter (UI), Noto Sans SC (Chinese), JetBrains Mono (code)
- **Spacing:** 4px base grid
- **Border radius:** 8px (cards), 4px (inputs), 12px (modals)

### 1.2 Component Library

| Component | Library | Notes |
|-----------|---------|-------|
| Buttons | Custom (shadcn/ui base) | Primary, secondary, ghost, danger |
| Inputs | shadcn/ui | Text, select, checkbox, radio, date |
| Tables | TanStack Table | Sortable, filterable, paginated |
| Modals | Radix Dialog | Accessible, animated |
| Toasts | Sonner | Auto-dismiss, stacking |
| Charts | Recharts | Line, bar, pie, funnel |
| Kanban | Custom | Drag-and-drop |
| Calendar | FullCalendar | Month/week/day views |
| Search | Cmdk | Cmd+K palette |
| Forms | React Hook Form + Zod | Validation |

### 1.3 Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| Mobile | < 768px | Phone |
| Tablet | 768px - 1024px | iPad |
| Desktop | > 1024px | Laptop |
| Wide | > 1440px | Large screen |

---

## 2. State Machines

### 2.1 Mandate State Machine

```
[draft] ──→ [pending_approval] ──→ [active] ──→ [on_hold]
   │              │                    │            │
   │              ↓                    ↓            │
   │         [cancelled]        [shortlisting]     │
   │                                   │            │
   │                              [interviewing]    │
   │                                   │            │
   │                              [offer_pending]   │
   │                               │         │      │
   │                          [filled]   [cancelled]│
   │                               │                │
   └─────────────────────────── [reopened] ←────────┘
```

**Valid Transitions:**
| From | To | Trigger | Who |
|------|----|---------|-----|
| draft | pending_approval | Submit for approval | Consultant |
| pending_approval | active | Approve | Admin/Client |
| pending_approval | cancelled | Reject | Admin |
| active | on_hold | Pause mandate | Consultant |
| active | shortlisting | First candidate submitted | System |
| on_hold | active | Resume | Consultant |
| shortlisting | interviewing | Client starts interviews | Client |
| interviewing | offer_pending | Offer extended | Consultant |
| offer_pending | filled | Offer accepted | System |
| offer_pending | cancelled | Offer rejected | System |
| filled | reopened | Re-open position | Consultant |

### 2.2 Candidate State Machine

```
[discovered] → [contacted] → [screening] → [qualified]
                                         → [rejected]
    [qualified] → [submitted] → [client_review] → [interview]
                                                    → [rejected]
        [interview] → [offer] → [accepted] → [placed]
                              → [rejected]
                              → [withdrawn]
```

### 2.3 Council Membership State Machine

```
[unregistered] → [applied] → [pending] → [active] → [expired]
                                          │           │
                                      [suspended]     │
                                          │           │
                                      [cancelled]     │
                                          ↓           │
                                      [reinstated] ←──┘ (renew)
```

### 2.4 Order State Machine

```
[pending] → [payment_required] → [paid] → [processing] → [fulfilled]
                                        → [failed]
                                        → [cancelled]
                                    [fulfilled] → [refunded]
                                                → [partially_refunded]
```

---

## 3. Notification System

### 3.1 Notification Channels

| Channel | When | Latency |
|---------|------|---------|
| In-app | Always | Real-time (WebSocket) |
| Email | Configured | < 1 minute (Resend) |
| Push | Configured | < 1 minute (Web Push) |
| SMS | Critical only | < 5 minutes |

### 3.2 Notification Types & Channels

| Event | In-App | Email | Push | SMS |
|-------|:------:|:-----:|:----:|:---:|
| New candidate submitted | ✓ | ✓ | ✓ | — |
| Interview scheduled | ✓ | ✓ | ✓ | — |
| Offer extended | ✓ | ✓ | ✓ | ✓ |
| Placement confirmed | ✓ | ✓ | ✓ | ✓ |
| Task due today | ✓ | ✓ | — | — |
| Task overdue | ✓ | ✓ | ✓ | — |
| Council event tomorrow | ✓ | ✓ | ✓ | — |
| Coaching session in 1h | ✓ | ✓ | ✓ | — |
| Credit balance low (<2) | ✓ | ✓ | — | — |
| Payment failed | ✓ | ✓ | ✓ | ✓ |
| System announcement | ✓ | ✓ | — | — |

### 3.3 Notification Preferences

Users can configure per-channel:
- Global on/off per channel
- Per-type on/off
- Quiet hours (no notifications 22:00-08:00)
- Digest mode (batch into daily summary)

### 3.4 Tickets

- `UX-NOT-001`: Notification service (backend)
- `UX-NOT-002`: In-app notification bell + dropdown
- `UX-NOT-003`: Email template system (Resend)
- `UX-NOT-004`: Push notification (Web Push API)
- `UX-NOT-005`: Notification preferences page
- `UX-NOT-006`: Quiet hours logic
- `UX-NOT-007`: Digest compilation (daily cron)
- `UX-NOT-008`: Notification read/unread tracking
- `UX-NOT-009`: Realtime delivery (Supabase Realtime)
- `UX-NOT-010`: Notification history page

---

## 4. Shared UX Patterns

### 4.1 Data Tables

All list views use consistent table patterns:
- Sortable columns (click header)
- Column visibility toggle
- Row selection (checkbox)
- Bulk actions toolbar
- Pagination (20/50/100 per page)
- Saved views (localStorage)
- CSV export
- Inline editing (optional)

**Tickets:**
- `UX-TBL-001`: Reusable DataTable component
- `UX-TBL-002`: Sort/filter/pagination
- `UX-TBL-003`: Column visibility
- `UX-TBL-004`: Bulk selection + actions
- `UX-TBL-005`: Saved views
- `UX-TBL-006`: CSV export

### 4.2 Forms

All forms follow consistent patterns:
- React Hook Form + Zod validation
- Inline validation (on blur)
- Error messages below fields
- Required field indicator (*)
- Auto-save for long forms (draft)
- Submit button states (idle/loading/success/error)

**Tickets:**
- `UX-FRM-001`: Reusable FormField component
- `UX-FRM-002`: Validation patterns
- `UX-FRM-003`: Auto-save draft
- `UX-FRM-004`: Submit button states
- `UX-FRM-005`: Form layout (single/multi-column)

### 4.3 File Uploads

- Drag-and-drop zone
- File type validation
- Size limit display
- Upload progress bar
- Preview (images/PDFs)
- Multiple file support

**Tickets:**
- `UX-UPL-001`: Drag-and-drop upload component
- `UX-UPL-002`: File validation
- `UX-UPL-003`: Upload progress
- `UX-UPL-004`: File preview
- `UX-UPL-005`: Supabase Storage integration

### 4.4 Search & Filtering

- Global search (Cmd+K) — see 01 IN-GLB
- Page-level search (within current view)
- Faceted filters (sidebar)
- Date range picker
- Saved filters

**Tickets:**
- `UX-SRCH-001`: Page-level search component
- `UX-SRCH-002`: Faceted filter sidebar
- `UX-SRCH-003`: Date range picker
- `UX-SRCH-004`: Saved filters

### 4.5 Empty States

Every list/table view needs an empty state:
- Friendly message
- Relevant illustration
- Primary CTA (create first item)
- Secondary CTA (import/learn more)

**Tickets:**
- `UX-EMP-001`: Empty state component
- `UX-EMP-002`: Per-page empty state copy

### 4.6 Loading States

- Skeleton screens (not spinners) for data loading
- Optimistic UI for mutations
- Toast for success/error feedback
- Progress bar for long operations

**Tickets:**
- `UX-LOAD-001`: Skeleton screen components
- `UX-LOAD-002`: Optimistic update patterns
- `UX-LOAD-003`: Toast notification system

---

## 5. Accessibility

### 5.1 Standards

- WCAG 2.1 AA compliance
- Keyboard navigation (all interactive elements)
- Screen reader support (ARIA labels)
- Color contrast (4.5:1 minimum)
- Focus indicators (visible)
- Reduced motion support

### 5.2 Tickets

- `UX-A11Y-001`: Keyboard navigation audit
- `UX-A11Y-002`: ARIA label audit
- `UX-A11Y-003`: Color contrast check
- `UX-A11Y-004`: Focus indicator styling
- `UX-A11Y-005`: Reduced motion media query

---

## 6. Internationalization

### 6.1 Language Support

| Language | Code | Priority |
|----------|------|----------|
| Chinese (Simplified) | zh-CN | Primary |
| English | en | Secondary |

### 6.2 Implementation

- `react-i18next` for translations
- All user-facing strings externalized
- Date/time formatting by locale
- Number/currency formatting by locale
- RTL support (future, Arabic)

### 6.3 Tickets

- `UX-I18N-001`: i18n setup (react-i18next)
- `UX-I18N-002`: Language switcher component
- `UX-I18N-003`: zh-CN translation file
- `UX-I18N-004`: en translation file
- `UX-I18N-005`: Date/number formatting

---

## 7. Performance

### 7.1 Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |

### 7.2 Techniques

- Route-based code splitting
- Lazy loading (images, heavy components)
- Virtual scrolling (long lists)
- Image optimization (WebP, srcset)
- API response caching (React Query)
- Debounced search inputs
- Memoized computations

### 7.3 Tickets

- `UX-PERF-001`: Code splitting setup
- `UX-PERF-002`: Image optimization pipeline
- `UX-PERF-003`: Virtual scrolling for large tables
- `UX-PERF-004`: React Query caching config
- `UX-PERF-005`: Lighthouse CI integration

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| UX-NOT: Notifications | 10 | `UX-NOT-001` to `UX-NOT-010` |
| UX-TBL: Data Tables | 6 | `UX-TBL-001` to `UX-TBL-006` |
| UX-FRM: Forms | 5 | `UX-FRM-001` to `UX-FRM-005` |
| UX-UPL: File Uploads | 5 | `UX-UPL-001` to `UX-UPL-005` |
| UX-SRCH: Search & Filter | 4 | `UX-SRCH-001` to `UX-SRCH-004` |
| UX-EMP: Empty States | 2 | `UX-EMP-001` to `UX-EMP-002` |
| UX-LOAD: Loading States | 3 | `UX-LOAD-001` to `UX-LOAD-003` |
| UX-A11Y: Accessibility | 5 | `UX-A11Y-001` to `UX-A11Y-005` |
| UX-I18N: Internationalization | 5 | `UX-I18N-001` to `UX-I18N-005` |
| UX-PERF: Performance | 5 | `UX-PERF-001` to `UX-PERF-005` |
| **TOTAL** | **~50** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 04 — Client Portal Spec
## LYC Intelligence Platform — Company/Client Experience

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Client-facing portal for companies using LYC recruitment services  
**Dependencies:** 02 (Supabase), 06 (Intelligence Layer)

---

## 1. Portal Overview

### 1.1 Purpose

The Client Portal is where companies interact with LYC Intelligence:
- View and manage open mandates
- Review candidate shortlists
- Track recruitment pipeline
- Access company intelligence (360° view)
- Communicate with assigned consultants
- View billing and contracts

### 1.2 User Roles

| Role | Access | Description |
|------|--------|-------------|
| `client_admin` | Full access | Manage company, users, mandates |
| `client_user` | View + limited actions | View mandates, review candidates |
| `client_viewer` | Read-only | View only, no actions |

### 1.3 Page Map

| # | Page | Route | Purpose |
|---|------|-------|---------|
| CL1 | Client Dashboard | `/client/dashboard` | Overview: active mandates, pipeline |
| CL2 | Company Profile | `/client/company` | Company info + 360° intelligence |
| CL3 | Mandate List | `/client/mandates` | All mandates (active/closed) |
| CL4 | Mandate Detail | `/client/mandates/:id` | Single mandate + pipeline |
| CL5 | Candidate Shortlist | `/client/mandates/:id/candidates` | Candidates for mandate |
| CL6 | Candidate Detail | `/client/candidates/:id` | Full candidate profile |
| CL7 | Activity Feed | `/client/activity` | All recent activity |
| CL8 | Billing & Contracts | `/client/billing` | Invoices, contracts, spend |

**Total: 8 pages**

---

## 2. Page Specifications

### 2.1 CL1: Client Dashboard

**Route:** `/client/dashboard`  
**Access:** Client users

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Company] Dashboard                    [Company ▾]  │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Active  │ │In Pipe │ │Interview│ │ Offer  │      │
│  │ Mandates│ │line    │ │ Stage   │ │Pending │      │
│  │    5    │ │   23   │ │    8    │ │    2   │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ACTIVE MANDATES                               │  │
│  │                                               │  │
│  │ VP Engineering    ████████░░  6 submitted     │  │
│  │ Head of Product   ██████░░░░  4 submitted     │  │
│  │ CTO               ████░░░░░░  2 submitted     │  │
│  │ [View All →]                                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ RECENT ACTIVITY     │ │ COMPANY HEALTH       │  │
│  │ • 3 new candidates  │ │ Score: 82/100 ↑     │  │
│  │ • VP Eng interview  │ │ Hiring: +15% QoQ    │  │
│  │ • Offer accepted    │ │ [View Intelligence →]│  │
│  └─────────────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CL-DASH-001`: Dashboard KPI cards (4 metrics)
- `CL-DASH-002`: Active mandates list with progress
- `CL-DASH-003`: Recent activity feed
- `CL-DASH-004`: Company health score widget
- `CL-DASH-005`: Quick actions (new mandate, message consultant)
- `CL-DASH-006`: Multi-company switcher (for agencies)
- `CL-DASH-007`: Onboarding wizard (new clients)
- `CL-DASH-008`: Empty state (no mandates yet)

---

### 2.2 CL2: Company Profile

**Route:** `/client/company`  
**Access:** Client admin

**Features:**
- Edit company information
- View company intelligence (360°)
- Manage client users (invite, remove, roles)
- View company analytics

**Tickets:**
- `CL-COMP-001`: Company profile form
- `CL-COMP-002`: Company intelligence view (delegates to 06)
- `CL-COMP-003`: User management (invite/remove/roles)
- `CL-COMP-004`: Company analytics (mandates filled, avg time)
- `CL-COMP-005`: Contract details display
- `CL-COMP-006`: Logo upload

---

### 2.3 CL3: Mandate List

**Route:** `/client/mandates`  
**Access:** Client users

**Features:**
- All mandates (active, closed, draft)
- Filter by status, priority, level
- Sort by date, candidates, fill rate
- Create new mandate

**Tickets:**
- `CL-MAN-001`: Mandate listing table
- `CL-MAN-002`: Filter panel (status, priority, level)
- `CL-MAN-003`: Sort options
- `CL-MAN-004`: Create new mandate flow
- `CL-MAN-005`: Mandate status badges
- `CL-MAN-006`: Quick stats per mandate
- `CL-MAN-007`: Bulk actions (close, archive)
- `CL-MAN-008`: Mandate search

---

### 2.4 CL4: Mandate Detail

**Route:** `/client/mandates/:id`  
**Access:** Client users

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  VP Engineering — Tech Corp           [Edit] [Close] │
│  Status: Active │ Priority: High │ Opened: Jul 1    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ PIPELINE                                      │  │
│  │                                               │  │
│  │ Sourced   Screening  Submitted  Interview  Offer│
│  │   45        12         6          3         1  │  │
│  │                                               │  │
│  │ [View Full Pipeline →]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────┐ ┌──────────────────────┐ │
│  │ ROLE DETAILS         │ │ TIMELINE             │ │
│  │ Level: VP/Senior     │ │ Target: Sep 30       │ │
│  │ Location: Shanghai   │ │ Days open: 42        │ │
│  │ Salary: ¥80-120万    │ │ Avg to fill: 60d     │ │
│  │ Remote: Hybrid       │ │ On track: ✓          │ │
│  └──────────────────────┘ └──────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ASSIGNED CONSULTANT                           │  │
│  │ Sarah Chen │ Senior Consultant                │  │
│  │ [Message] │ [Schedule Call]                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CL-MD-001`: Mandate detail header (status, priority)
- `CL-MD-002`: Pipeline funnel visualization
- `CL-MD-003`: Role details panel
- `CL-MD-004`: Timeline / progress tracking
- `CL-MD-005`: Assigned consultant card
- `CL-MD-006`: Edit mandate flow
- `CL-MD-007`: Close/reopen mandate
- `CL-MD-008`: Mandate comments/notes
- `CL-MD-009`: Interview scheduling integration
- `CL-MD-010`: Offer tracking

---

### 2.5 CL5: Candidate Shortlist

**Route:** `/client/mandates/:id/candidates`  
**Access:** Client users

**Features:**
- Candidates submitted for this mandate
- AI match scores
- Consultant notes
- Status per candidate (reviewed, interview, offer, etc.)
- Compare candidates side-by-side
- Request more candidates

**Tickets:**
- `CL-CS-001`: Candidate list for mandate
- `CL-CS-002`: AI match score display
- `CL-CS-003`: Consultant notes per candidate
- `CL-CS-004`: Status management (shortlist/reject/interview)
- `CL-CS-005`: Side-by-side comparison
- `CL-CS-006`: "Request more candidates" button
- `CL-CS-007`: Candidate ranking display
- `CL-CS-008`: Export shortlist (PDF/CSV)

---

### 2.6 CL6: Candidate Detail

**Route:** `/client/candidates/:id`  
**Access:** Client users

**Features:**
- Full candidate profile
- Resume viewer
- AI assessment summary
- Interview history for this mandate
- Feedback submission
- Move to next stage

**Tickets:**
- `CL-CD-001`: Candidate profile view
- `CL-CD-002`: Resume viewer (PDF inline)
- `CL-CD-003`: AI assessment summary
- `CL-CD-004`: Interview history
- `CL-CD-005`: Feedback form (per stage)
- `CL-CD-006`: Stage progression buttons
- `CL-CD-007`: Message consultant about candidate
- `CL-CD-008`: Candidate comparison (from shortlist)

---

### 2.7 CL7: Activity Feed

**Route:** `/client/activity`  
**Access:** Client users

**Features:**
- Chronological feed of all activities
- Filter by entity type, date, consultant
- Mark as read
- Link to related entities

**Tickets:**
- `CL-AF-001`: Activity feed (infinite scroll)
- `CL-AF-002`: Activity type filtering
- `CL-AF-003`: Date range filter
- `CL-AF-004`: Mark as read functionality
- `CL-AF-005`: Activity detail expand
- `CL-AF-006`: Link to entity (mandate/candidate)

---

### 2.8 CL8: Billing & Contracts

**Route:** `/client/billing`  
**Access:** Client admin only

**Features:**
- Current contract details
- Invoice history
- Payment status
- Fee structure summary
- Spend analytics

**Tickets:**
- `CL-BIL-001`: Contract overview
- `CL-BIL-002`: Invoice list
- `CL-BIL-003`: Invoice detail/download (PDF)
- `CL-BIL-004`: Payment status
- `CL-BIL-005`: Fee structure summary
- `CL-BIL-006`: Spend analytics (by mandate, period)
- `CL-BIL-007`: Outstanding balance display

---

## 3. Client-Side Features

### 3.1 Multi-Company Support

For agency users or consultants managing multiple companies:
- Company switcher in header
- Cross-company dashboard
- Consolidated reporting

**Tickets:**
- `CL-MC-001`: Company switcher component
- `CL-MC-002`: Cross-company view
- `CL-MC-003`: Consolidated reporting

### 3.2 White-Label Option

Enterprise clients can customize:
- Logo in portal header
- Brand colors
- Custom domain (future)

**Tickets:**
- `CL-WL-001`: White-label configuration
- `CL-WL-002`: Custom logo upload
- `CL-WL-003`: Theme color picker

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| CL-DASH: Dashboard | 8 | `CL-DASH-001` to `CL-DASH-008` |
| CL-COMP: Company Profile | 6 | `CL-COMP-001` to `CL-COMP-006` |
| CL-MAN: Mandate List | 8 | `CL-MAN-001` to `CL-MAN-008` |
| CL-MD: Mandate Detail | 10 | `CL-MD-001` to `CL-MD-010` |
| CL-CS: Candidate Shortlist | 8 | `CL-CS-001` to `CL-CS-008` |
| CL-CD: Candidate Detail | 8 | `CL-CD-001` to `CL-CD-008` |
| CL-AF: Activity Feed | 6 | `CL-AF-001` to `CL-AF-006` |
| CL-BIL: Billing | 7 | `CL-BIL-001` to `CL-BIL-007` |
| CL-MC: Multi-Company | 3 | `CL-MC-001` to `CL-MC-003` |
| CL-WL: White-Label | 3 | `CL-WL-001` to `CL-WL-003` |
| **TOTAL** | **~67** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 05 — The Council Portal Spec v2.0
## LYC Intelligence Platform — Membership Community + DEX AI B2C

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** The Council Portal (membership community layer) + DEX AI B2C integration  
**Dependencies:** 02 (Supabase), 08 (Commerce Layer)  
**Scope Note:** The Council is a community layer across all three pillars (WAVE→DEX AI→VISTA), not a standalone product. DEX AI B2C is integrated here — no separate portal.

---

## 1. Portal Overview

### 1.1 What Is The Council?

The Council is LYC Intelligence's **membership community layer**. It sits across the three-pillar architecture:

```
WAVE (Growth & Presence) → DEX AI (Intelligence) → VISTA (Client Success)
                        ↕              ↕                   ↕
                    ┌─────────────────────────────────────┐
                    │          THE COUNCIL                 │
                    │   (Community & Membership Layer)     │
                    └─────────────────────────────────────┘
```

It is NOT a standalone portal in the same sense as Client or Candidate. It is the **relationship layer** — the "you've been invited to join" experience.

### 1.2 Dual Function

The Council Portal serves two integrated functions:

1. **Council Membership** — Coaching, events, community, network
2. **DEX AI B2C** — AI-powered executive advisory (Executive Introduction funnel)

These share the same portal but have distinct user journeys.

### 1.3 User Types

| User Type | Access | Description |
|-----------|--------|-------------|
| **Visitor** | Landing page only | Not logged in. Sees value proposition |
| **DEX AI User (Intro)** | DEX AI chat only | Used 0-5 Executive Introduction messages |
| **DEX AI Paid** | DEX AI chat + Credit Store | Purchased credits or subscription |
| **Council Applicant** | Application form | Applying for membership |
| **Council Member** | Full Council access | Active paying member |
| **Council Admin** | Full + management | Manages Council operations |

### 1.4 Brand Language Rules (CRITICAL)

| ❌ NEVER | ✅ INSTEAD |
|---------|-----------|
| "Free tier" | "Executive Introduction" |
| "Sign up free" | "Access your Executive Introduction" |
| "Free trial" | "Founding member rate" |
| "Free" (anywhere) | "Complimentary" or "Executive Introduction" |

---

## 2. Page Map

### 2.1 Public Pages (No Auth)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| P1 | Council Landing | `/council` | Value proposition + CTA |
| P2 | Membership Tiers | `/council/membership` | Tier comparison + purchase |
| P3 | Events Calendar | `/council/events` | Upcoming events listing |

### 2.2 DEX AI Pages (Auth Required)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| D1 | DEX AI Chat | `/dex/chat` | AI advisory conversation |
| D2 | Credit Store | `/dex/credits` | Buy credits / subscribe |
| D3 | Chat History | `/dex/history` | Past conversations |
| D4 | Account/Billing | `/dex/account` | Subscription management |

### 2.3 Council Member Pages (Auth + Membership)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| C1 | Member Dashboard | `/council/dashboard` | Overview: credits, events, coaching |
| C2 | My Coaching | `/council/coaching` | Book/manage coaching sessions |
| C3 | Event Detail | `/council/events/:id` | Event page + registration |
| C4 | Community Feed | `/council/community` | Member discussions |
| C5 | Member Directory | `/council/directory` | Browse members (opt-in) |
| C6 | My Profile | `/council/profile` | Edit profile, preferences |
| C7 | Benefits Hub | `/council/benefits` | All membership benefits |

### 2.4 Admin Pages

| # | Page | Route | Purpose |
|---|------|-------|---------|
| A1 | Council Admin | `/admin/council` | Member management |
| A2 | Event Management | `/admin/council/events` | Create/manage events |
| A3 | Coaching Management | `/admin/council/coaching` | Consultant assignment |
| A4 | Applications | `/admin/council/applications` | Review membership apps |

**Total: ~17 pages across 4 sections**

---

## 3. Page Specifications

### 3.1 P1: Council Landing Page

**Route:** `/council`  
**Access:** Public (no auth)

**Purpose:** Convert visitors → DEX AI Executive Introduction or Council membership

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  The Council                                           │  │
│  │  Where senior professionals sharpen their edge.       │  │
│  │                                                        │  │
│  │  Executive coaching. Exclusive events. AI-powered      │  │
│  │  career intelligence. A community of peers who get it. │  │
│  │                                                        │  │
│  │  [Start with DEX AI]     [Explore Membership]         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WHAT YOU GET                                          │  │
│  │                                                        │  │
│  │  🤖 AI Executive Advisory    📅 Exclusive Events       │  │
│  │  DEX AI answers your career   Workshops, roundtables,  │  │
│  │  questions in minutes.        networking dinners.       │  │
│  │                                                        │  │
│  │  👤 1-on-1 Coaching          🌐 Peer Network           │  │
│  │  Senior LYC coaches,          Connect with C-suite     │  │
│  │  on-demand booking.           professionals.            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TESTIMONIALS                                          │  │
│  │  [Member testimonial carousel]                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  READY TO JOIN?                                        │  │
│  │  [Start Executive Introduction]  [View Membership]     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-P1-001`: Hero section with dual CTA
- `TC-P1-002`: Benefits grid (4 cards)
- `TC-P1-003`: Testimonial carousel
- `TC-P1-004`: Social proof counters (members, events, sessions)
- `TC-P1-005`: Bottom CTA section
- `TC-P1-006`: Responsive mobile layout
- `TC-P1-007`: SEO metadata + OG tags
- `TC-P1-008`: Analytics tracking (GA4 events)

---

### 3.2 P2: Membership Tiers Page

**Route:** `/council/membership`  
**Access:** Public (purchase flow requires auth)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Membership Tiers                                            │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Individual │ │Corporate │ │PE Partner│ │ 🔥 Founding   │  │
│  │           │ │          │ │          │ │ (20 spots)    │  │
│  │ ¥3,800/yr│ │¥12,000/yr│ │¥25,000/yr│ │ ¥2,800/yr    │  │
│  │           │ │          │ │          │ │               │  │
│  │ 12 credits│ │48 credits│ │100 cred  │ │ 12 credits   │  │
│  │ 12 sessions│ │48 sessions│ │100 sess │ │ 12 sessions  │  │
│  │ All events│ │All events│ │All events│ │ All events    │  │
│  │ Directory │ │Directory │ │Deal flow │ │ + Legacy badge│  │
│  │           │ │+ Seats: 5│ │+ Priority│ │ + Priority    │  │
│  │           │ │          │ │ coaching │ │               │  │
│  │ [SELECT]  │ │ [SELECT] │ │ [SELECT] │ │ [JOIN NOW]   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                              │
│  All tiers include:                                          │
│  ✓ DEX AI access          ✓ Member directory               │
│  ✓ Community feed          ✓ Event priority booking         │
│  ✓ Monthly newsletter      ✓ Annual review                  │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-P2-001`: Tier comparison table (4 columns)
- `TC-P2-002`: Founding member counter (X/20 remaining)
- `TC-P2-003`: Feature comparison matrix
- `TC-P2-004`: Annual prepay Stripe Checkout integration
- `TC-P2-005`: FAQ section (accordion)
- `TC-P2-006`: Corporate seat configuration
- `TC-P2-007`: "Contact us" for custom enterprise tiers
- `TC-P2-008`: Login/signup prompt before checkout

---

### 3.3 D1: DEX AI Chat Page

**Route:** `/dex/chat`  
**Access:** Authenticated users

**Purpose:** B2C AI advisory — the core product experience

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  DEX AI                              [Credits: 5/5] [⚙]    │
│                                                              │
│  ┌──────────┐                                               │
│  │ Sidebar   │  ┌───────────────────────────────────────┐  │
│  │           │  │                                       │  │
│  │ + New Chat│  │  Welcome to DEX AI                    │  │
│  │           │  │  Your executive advisory assistant.   │  │
│  │ Recent:   │  │                                       │  │
│  │ • Career  │  │  Ask me anything about:               │  │
│  │   move    │  │  • Career strategy & transitions      │  │
│  │ • Salary  │  │  • Compensation benchmarking          │  │
│  │   negot.  │  │  • Leadership development             │  │
│  │ • Market  │  │  • Market intelligence                │  │
│  │   trends  │  │  • Industry analysis                  │  │
│  │           │  │                                       │  │
│  │           │  │  ┌─────────────────────────────────┐  │  │
│  │           │  │  │ Type your question...     [Send]│  │  │
│  │           │  │  └─────────────────────────────────┘  │  │
│  │           │  └───────────────────────────────────────┘  │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

**Progressive Gating Flow:**
```
Messages 1-5: Executive Introduction (complimentary)
  → Full AI capability shown
  → No payment required
  → Builds trust

Message 6: Soft gate
  → "You've explored your Executive Introduction.
     Continue with credits or subscribe."
  → Shows Credit Store link
  → Does NOT block — redirects to purchase

Message 6+ (no credits): Hard gate
  → Must purchase or subscribe
  → Shows balance + purchase options
  → Council member cross-sell
```

**Tickets:**
- `TC-D1-001`: Chat interface (message list + input)
- `TC-D1-002`: Session sidebar (new/recent/history)
- `TC-D1-003`: AI response streaming (SSE)
- `TC-D1-004`: DeepSeek API integration (flash/pro routing)
- `TC-D1-005`: Executive Introduction counter (5 messages)
- `TC-D1-006`: Soft gate UI (message 6 prompt)
- `TC-D1-007`: Hard gate enforcement
- `TC-D1-008`: Credit balance display (real-time)
- `TC-D1-009`: Suggested prompts (contextual)
- `TC-D1-010`: Chat export (PDF/clipboard)
- `TC-D1-011`: Conversation memory/context (dex_chat_context)
- `TC-D1-012`: Council member cross-sell banner
- `TC-D1-013`: Mobile responsive layout

---

### 3.4 D2: Credit Store Page

**Route:** `/dex/credits`  
**Access:** Authenticated DEX AI users  
**Note:** See 08_Commerce_Layer_Spec.md COM-001 for full details

**Tickets:**
- `TC-D2-001`: Credit store page (delegates to Commerce Layer)
- `TC-D2-002`: Balance display + transaction history
- `TC-D2-003`: Subscription management

---

### 3.5 C1: Member Dashboard

**Route:** `/council/dashboard`  
**Access:** Active Council members

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, [Name]                    Council Credits: 10 │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ NEXT COACHING       │ │ UPCOMING EVENTS      │           │
│  │ Jul 18, 14:00       │ │ Jul 20: AI Workshop  │           │
│  │ Coach: Sarah Chen   │ │ Jul 25: Roundtable   │           │
│  │ [Join] [Reschedule] │ │ [Register] [Details] │           │
│  └─────────────────────┘ └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ DEX AI              │ │ COMMUNITY            │           │
│  │ Recent: Career piv. │ │ 3 new discussions    │           │
│  │ [Continue chat]     │ │ [View feed]          │           │
│  └─────────────────────┘ └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MEMBERSHIP STATUS                                    │   │
│  │ Tier: Individual  │  Expires: 2027-07-13            │   │
│  │ Credits: 10/12    │  Sessions: 4/12 used            │   │
│  │ [Upgrade] [Manage]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-C1-001`: Dashboard overview layout
- `TC-C1-002`: Next coaching session widget
- `TC-C1-003`: Upcoming events widget
- `TC-C1-004`: DEX AI quick access widget
- `TC-C1-005`: Community activity widget
- `TC-C1-006`: Membership status bar
- `TC-C1-007`: Credit usage indicator
- `TC-C1-008`: Quick actions (book coaching, register event)

---

### 3.6 C2: My Coaching Page

**Route:** `/council/coaching`  
**Access:** Active Council members

**Features:**
- View available coaches
- Book sessions (uses 1 Council Credit per session)
- Manage upcoming sessions (reschedule/cancel)
- View past sessions + notes
- Rate completed sessions

**Tickets:**
- `TC-C2-001`: Coach directory (available coaches)
- `TC-C2-002`: Session booking flow (calendar picker)
- `TC-C2-003`: Credit deduction on booking
- `TC-C2-004`: Upcoming sessions list
- `TC-C2-005`: Reschedule/cancel flow
- `TC-C2-006`: Past sessions history
- `TC-C2-007`: Session rating + feedback form
- `TC-C2-008`: Video meeting link generation
- `TC-C2-009`: Calendar integration (Google/Apple)
- `TC-C2-010`: Email reminders (48h, 24h, 1h before)

---

### 3.7 C3: Event Detail Page

**Route:** `/council/events/:id`  
**Access:** Public (registration may require membership)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Cover Image]                                               │
│                                                              │
│  AI Strategy Workshop: From Hype to Execution               │
│  Jul 20, 2026 │ 14:00-17:00 │ Virtual + In-person (SH)     │
│                                                              │
│  Speaker: Dr. Wei Zhang, ex-McKinsey Digital Lead           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ About this event                                     │   │
│  │ Deep dive into practical AI strategy for executives  │   │
│  │ - Framework for AI readiness assessment              │   │
│  │ - Case studies from Chinese enterprises              │   │
│  │ - Interactive Q&A                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Register — Free for Members]  [Register — ¥299]           │
│  42/60 spots filled                                         │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-C3-001`: Event detail page layout
- `TC-C3-002`: Registration flow (member vs non-member pricing)
- `TC-C3-003`: Capacity counter
- `TC-C3-004`: Calendar add (ICS download)
- `TC-C3-005`: Event materials download (post-event)
- `TC-C3-006`: Recording access (post-event, members only)
- `TC-C3-007`: Feedback form (post-event)
- `TC-C3-008`: Waitlist management (when full)

---

### 3.8 C4: Community Feed

**Route:** `/council/community`  
**Access:** Active Council members

**Features:**
- Discussion threads (topics, questions, announcements)
- Like/reply interactions
- Category filtering
- Member mentions (@name)
- Pinned posts from admins

**Tickets:**
- `TC-C4-001`: Feed layout (infinite scroll)
- `TC-C4-002`: Create post/discussion
- `TC-C4-003`: Reply/thread system
- `TC-C4-004`: Like/bookmark functionality
- `TC-C4-005`: Category filtering
- `TC-C4-006`: Member mention (@name)
- `TC-C4-007`: Pinned/announcement posts
- `TC-C4-008`: Report inappropriate content

---

### 3.9 C5: Member Directory

**Route:** `/council/directory`  
**Access:** Active Council members (opt-in visibility)

**Features:**
- Browse members by industry, expertise, location
- Search by name, company, title
- View member profiles (public info only)
- Connection request / message

**Tickets:**
- `TC-C5-001`: Directory grid/list view
- `TC-C5-002`: Filter by industry/expertise/location
- `TC-C5-003`: Search functionality
- `TC-C5-004`: Member profile card
- `TC-C5-005`: Connection request flow
- `TC-C5-006`: Direct message (optional)
- `TC-C5-007`: Privacy controls (opt-in/out of directory)

---

### 3.10 C6: My Profile

**Route:** `/council/profile`  
**Access:** Active Council members

**Tickets:**
- `TC-C6-001`: Profile edit form
- `TC-C6-002`: Avatar upload
- `TC-C6-003`: Expertise/interests tags
- `TC-C6-004`: Privacy settings
- `TC-C6-005`: Notification preferences
- `TC-C6-006`: Linked accounts (LinkedIn integration)

---

### 3.11 C7: Benefits Hub

**Route:** `/council/benefits`  
**Access:** Active Council members

**Purpose:** Show all membership benefits, drive engagement

**Tickets:**
- `TC-C7-001`: Benefits overview page
- `TC-C7-002`: Benefit utilization tracker
- `TC-C7-003`: "How to use your credits" guide
- `TC-C7-004`: Upgrade prompt (if underutilizing)

---

## 4. B2C User Journey (DEX AI → Council)

### 4.1 Journey Flow

```
                    ┌──────────┐
                    │ DISCOVER │ (WAVE content, referral, search)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ INTRODUCE│ (5 Executive Introduction messages)
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │      ENGAGE?         │
              │  (After 5 messages)  │
              └──┬──────────────┬───┘
                 │              │
          ┌──────▼─────┐  ┌───▼────────┐
          │ PURCHASE   │  │  LEAVE     │
          │ Credits    │  │  (nurture  │
          │ or Subscribe│  │   via email│
          └──────┬─────┘  └────────────┘
                 │
          ┌──────▼─────┐
          │  GRADUATE   │ → Council Membership invitation
          │  to Council │   "You've proven the value.
          └──────┬─────┘    Join The Council."
                 │
          ┌──────▼─────┐
          │  COUNCIL    │ → Full membership experience
          │  MEMBER     │   Coaching, events, community
          └────────────┘
```

### 4.2 Graduation Gift

When a DEX AI user converts to Council membership:
- **Welcome bonus:** 2 extra Council Credits
- **Personalized onboarding:** Based on their DEX AI conversation history
- **Priority event access:** First pick at upcoming events
- **Legacy badge:** "Early adopter" if within first 100 converts

**Tickets:**
- `TC-BJ-001`: Executive Introduction completion tracking
- `TC-BJ-002`: Graduation trigger logic
- `TC-BJ-003`: Council invitation email/flow
- `TC-BJ-004`: Graduation gift credit delivery
- `TC-BJ-005`: Personalized onboarding (context from DEX AI)
- `TC-BJ-006`: Nurture email sequence (for non-converters)
- `TC-BJ-007`: Cross-sell banner (in DEX AI chat)

---

## 5. Council Admin Pages

### 5.1 A1: Council Admin Dashboard

**Route:** `/admin/council`  
**Access:** Council Admin role

**Features:**
- Member overview (total, active, expiring, churned)
- Revenue metrics (MRR, LTV, churn)
- Application review queue
- Member search & detail

**Tickets:**
- `TC-A1-001`: Admin dashboard layout
- `TC-A1-002`: Member list with filters
- `TC-A1-003`: Member detail view
- `TC-A1-004`: Member status management (activate/suspend/cancel)
- `TC-A1-005`: Application review & approval
- `TC-A1-006`: Revenue metrics display
- `TC-A1-007`: Bulk operations (export, notify)

### 5.2 A2: Event Management

**Route:** `/admin/council/events`

**Tickets:**
- `TC-A2-001`: Event creation form
- `TC-A2-002`: Event edit/delete
- `TC-A2-003`: Registration management
- `TC-A2-004`: Attendance tracking
- `TC-A2-005`: Post-event feedback review
- `TC-A2-006`: Event template creation

### 5.3 A3: Coaching Management

**Route:** `/admin/council/coaching`

**Tickets:**
- `TC-A3-001`: Coach assignment
- `TC-A3-002`: Session scheduling
- `TC-A3-003`: Session completion tracking
- `TC-A3-004`: Coach availability management
- `TC-A3-005`: Coaching quality metrics

### 5.4 A4: Applications

**Route:** `/admin/council/applications`

**Tickets:**
- `TC-A4-001`: Application list
- `TC-A4-002`: Application review workflow
- `TC-A4-003`: Approval/rejection with reason
- `TC-A4-004`: Waitlist management

---

## 6. Realtime & Notifications

### 6.1 Realtime Events

| Event | Channel | Subscribers |
|-------|---------|-------------|
| New coaching session request | `coaching:requests` | Available coaches |
| Coaching session reminder | `notifications:{user_id}` | Specific user |
| New community post | `council:community` | All members |
| Event registration | `events:{event_id}` | Event organizer |
| Credit balance change | `credits:{user_id}` | Specific user |
| Application status change | `notifications:{user_id}` | Specific user |

### 6.2 Notification Types

| Notification | Trigger | Channel |
|-------------|---------|---------|
| Coaching reminder | 24h before session | Email + Push + In-app |
| Event reminder | 24h + 1h before | Email + Push + In-app |
| Credit low | Balance < 2 | In-app |
| New community reply | Reply to user's post | Push + In-app |
| Application approved | Admin action | Email + In-app |
| Membership expiring | 60/30/7 days before | Email |
| DEX AI graduation gift | Convert to Council | Email + In-app |

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| TC-P1: Council Landing | 8 | `TC-P1-001` to `TC-P1-008` |
| TC-P2: Membership Tiers | 8 | `TC-P2-001` to `TC-P2-008` |
| TC-D1: DEX AI Chat | 13 | `TC-D1-001` to `TC-D1-013` |
| TC-D2: Credit Store | 3 | `TC-D2-001` to `TC-D2-003` |
| TC-C1: Member Dashboard | 8 | `TC-C1-001` to `TC-C1-008` |
| TC-C2: My Coaching | 10 | `TC-C2-001` to `TC-C2-010` |
| TC-C3: Event Detail | 8 | `TC-C3-001` to `TC-C3-008` |
| TC-C4: Community Feed | 8 | `TC-C4-001` to `TC-C4-008` |
| TC-C5: Member Directory | 7 | `TC-C5-001` to `TC-C5-007` |
| TC-C6: My Profile | 6 | `TC-C6-001` to `TC-C6-006` |
| TC-C7: Benefits Hub | 4 | `TC-C7-001` to `TC-C7-004` |
| TC-BJ: B2C User Journey | 7 | `TC-BJ-001` to `TC-BJ-007` |
| TC-A1: Council Admin | 7 | `TC-A1-001` to `TC-A1-007` |
| TC-A2: Event Management | 6 | `TC-A2-001` to `TC-A2-006` |
| TC-A3: Coaching Mgmt | 5 | `TC-A3-001` to `TC-A3-005` |
| TC-A4: Applications | 4 | `TC-A4-001` to `TC-A4-004` |
| **TOTAL** | **~112** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 05b — The Council Portal v2.1 Addendum
## LYC Intelligence Platform — B2C Integration + Pricing v2

**Version:** 2.1  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Additions/changes to 05_Council_Portal_Spec for v2 architecture  
**Dependencies:** 05 (Council Portal), 08 (Commerce Layer)

---

## 1. What Changed in v2.1

### 1.1 Changelog Summary

| Change | Impact | Section |
|--------|--------|---------|
| DEX AI B2C integrated into Council Portal | Major — new user journey | §2 |
| "Free" → "Executive Introduction" rebrand | All UI copy | §3 |
| Dual credit model (DEX Credits vs Council Credits) | Major — separate ledgers | §4 |
| Council pricing reduced (3,800/12,000/25,000) | Commerce Layer | §5 |
| Progressive gating (5 intro → soft → hard) | UX flow | §6 |
| Graduation gift (DEX → Council) | Retention mechanic | §7 |
| Annual prepay for Council | Billing change | §8 |

---

## 2. B2C User Journey (New)

### 2.1 Entry Points

| Entry | Source | Landing Page |
|-------|--------|-------------|
| WAVE content | Blog, social, email | `/council` → DEX AI |
| Direct search | Google/Baidu | `/dex/chat` |
| Referral | Council member | `/dex/chat?ref={member_id}` |
| Conference | QR code / event | `/dex/chat?src=event` |

### 2.2 Journey States

```
ANONYMOUS → INTRO_USER → PAID_DEX_USER → COUNCIL_MEMBER
              (0-5 msgs)   (credits/sub)    (annual)
```

### 2.3 State Transitions

| From | To | Trigger |
|------|----|---------|
| ANONYMOUS | INTRO_USER | Sign up (email/Google) |
| INTRO_USER | PAID_DEX_USER | Purchase credit pack or subscription |
| INTRO_USER | COUNCIL_MEMBER | Direct Council purchase (skip DEX) |
| PAID_DEX_USER | COUNCIL_MEMBER | Council membership purchase (graduation) |

### 2.4 Tickets

- `TC2-BJ-001`: Anonymous → Intro transition (signup flow)
- `TC2-BJ-002`: Intro → Paid transition (purchase prompt at msg 6)
- `TC2-BJ-003`: Paid → Council transition (graduation invitation)
- `TC2-BJ-004`: Direct Council signup (skip DEX path)
- `TC2-BJ-005`: Referral tracking (ref parameter)
- `TC2-BJ-006`: Source attribution (src parameter)

---

## 3. Brand Language Migration

### 3.1 Find & Replace Rules

**Everywhere in the codebase:**

| Old Text | New Text | Context |
|----------|----------|---------|
| `"Free"` | `"Executive Introduction"` | DEX AI landing/description |
| `"free tier"` | `"Executive Introduction"` | Any tier reference |
| `"sign up free"` | `"Access your Executive Introduction"` | CTA buttons |
| `"Free assessment"` | `"Complimentary assessment"` | Candidate Portal |
| `"Free trial"` | `"Founding member rate"` | Council context |
| `"free_message"` | `"intro_message"` | Code identifiers |
| `"freeMessages"` | `"introMessages"` | Variable names |
| `"FREE_TIER"` | `"EXECUTIVE_INTRO"` | Enum constants |

### 3.2 Affected Components

- `05_Council_Portal_Spec.md` — Landing page copy, CTA labels
- `07_Candidate_Portal_Spec.md` — Assessment descriptions
- `08_Commerce_Layer_Spec.md` — Product codes, pricing table
- All email templates mentioning "free"
- All push notification copy

### 3.3 Tickets

- `TC2-BL-001`: Update all UI copy for "free" → "Executive Introduction"
- `TC2-BL-002`: Update all database seed data
- `TC2-BL-003`: Update all email templates
- `TC2-BL-004`: Update all notification copy
- `TC2-BL-005`: Update all variable/enum names in code
- `TC2-BL-006`: QA pass — search entire codebase for remaining "free"

---

## 4. Dual Credit Model (New)

### 4.1 Architecture

```
┌────────────────────────────┐  ┌────────────────────────────┐
│     DEX CREDITS            │  │    COUNCIL CREDITS          │
│                            │  │                             │
│  Balance: dex_user_profiles│  │  Balance: council_profiles  │
│  Ledger: dex_credit_       │  │  Ledger: credit_transactions│
│          consumption       │  │           (credit_type =    │
│                            │  │            'council_credits')│
│  Consumed by:              │  │  Consumed by:               │
│  - DEX AI chat messages    │  │  - Coaching sessions        │
│  - Advanced AI features    │  │  - Event registrations      │
│                            │  │  - Premium content          │
│  Purchased via:            │  │  Included with:             │
│  - Credit packs (99/399/799│  │  - Council membership       │
│  - Monthly subscriptions   │  │    (annual prepay)          │
│    (99/299 CNY)            │  │                             │
│                            │  │  Reset: Annually with       │
│  Expiry: 12 months         │  │  membership renewal         │
│  Transferable: NO          │  │  Transferable: NO           │
│  Cross-use: NO             │  │  Cross-use: NO              │
└────────────────────────────┘  └────────────────────────────┘
```

### 4.2 Key Rule

**DEX Credits and Council Credits are completely separate.** No conversion, no transfer, no mixing. Each has its own balance, ledger, and consumption rules.

### 4.3 Database Impact

| Table | Credit Type | Notes |
|-------|-------------|-------|
| `dex_user_profiles.dex_credits` | DEX Credits | Balance for B2C users |
| `dex_credit_consumption` | DEX Credits | Transaction log |
| `council_profiles.council_credits` | Council Credits | Balance for members |
| `credit_transactions` | Both | Unified ledger (filtered by `credit_type`) |

### 4.4 Tickets

- `TC2-DC-001`: Separate credit balance queries (DEX vs Council)
- `TC2-DC-002`: DEX credit consumption on AI message
- `TC2-DC-003`: Council credit consumption on coaching booking
- `TC2-DC-004`: Council credit consumption on event registration
- `TC2-DC-005`: Credit expiry job (DEX: 12 months; Council: annual reset)
- `TC2-DC-006`: Low credit notifications (separate for each type)
- `TC2-DC-007`: Credit balance display in correct portal
- `TC2-DC-008`: Prevent cross-credit operations

---

## 5. Council Pricing v2

### 5.1 Updated Pricing Table

| Tier | Annual Price (CNY) | Council Credits/yr | Notes |
|------|-------------------|-------------------|-------|
| **Founding** | ¥2,800 | 12 | First 20 members only |
| **Individual** | ¥3,800 | 12 | Standard tier |
| **Corporate** | ¥12,000 | 48 | Up to 5 seats |
| **PE Partner** | ¥25,000 | 100 | Deal flow access + priority coaching |

### 5.2 Pricing Change Impact

| Old Price | New Price | Change |
|-----------|-----------|--------|
| Individual ¥5,000 | ¥3,800 | -24% |
| Corporate ¥18,000 | ¥12,000 | -33% |
| PE Partner ¥38,000 | ¥25,000 | -34% |
| Founding (new) | ¥2,800 | New tier |

**Rationale:** Lower prices to drive adoption. Founding tier creates urgency.

### 5.3 Tickets

- `TC2-PR-001`: Update product catalog with new prices
- `TC2-PR-002`: Update Stripe products/prices
- `TC2-PR-003`: Update pricing display on all pages
- `TC2-PR-004`: Founding member counter logic (20 max)
- `TC2-PR-005`: Legacy pricing support (grandfather existing members)
- `TC2-PR-006`: Proration for mid-cycle upgrades

---

## 6. Progressive Gating (New)

### 6.1 Gate States

| State | Messages Used | Gate Level | User Sees |
|-------|:------------:|-----------|-----------|
| Executive Introduction | 0-5 | None | Full AI, no payment prompt |
| Soft Gate | 6 | Soft | "Continue with credits?" banner |
| Hard Gate | 6+ (no credits) | Hard | Must purchase/subscribe |
| Active Paid | Any | None | Full access with credit deduction |

### 6.2 Soft Gate UX

After message 5, at the top of the chat:
```
┌─────────────────────────────────────────────────┐
│ ✨ You've completed your Executive Introduction! │
│                                                  │
│  To continue this conversation and unlock full   │
│  DEX AI capabilities:                            │
│                                                  │
│  [Get Credits — from ¥99]  [Subscribe — ¥99/mo] │
│                                                  │
│  Or explore Council membership for coaching,     │
│  events, and community. [Learn More →]           │
└─────────────────────────────────────────────────┘
```

### 6.3 Hard Gate UX

When trying to send message 6 without credits:
```
┌─────────────────────────────────────────────────┐
│ 🔒 Credits Required                              │
│                                                  │
│  Your Executive Introduction is complete.        │
│  Purchase credits or subscribe to continue.      │
│                                                  │
│  Current Balance: 0 DEX Credits                 │
│                                                  │
│  [Credit Pack — ¥99]  [Monthly — ¥99/mo]       │
│                                                  │
│  Already a Council member? [Use Council Credits] │
└─────────────────────────────────────────────────┘
```

### 6.4 Tickets

- `TC2-GT-001`: Intro message counter (tracks 0-5)
- `TC2-GT-002`: Soft gate UI component
- `TC2-GT-003`: Hard gate UI component
- `TC2-GT-004`: Gate state management (context)
- `TC2-GT-005`: Credit balance check before each message
- `TC2-GT-006`: Post-purchase gate removal (instant)
- `TC2-GT-007`: Council member alternative path

---

## 7. Graduation Gift (New)

### 7.1 Trigger

A DEX AI user purchases Council membership → "graduation" event fires.

### 7.2 Gift Contents

| Gift | Value | Delivery |
|------|-------|----------|
| 2 bonus Council Credits | ¥633 | Immediate |
| Personalized welcome message | — | Based on DEX AI chat history |
| Priority event registration | — | First pick at next 3 events |
| "Early Adopter" badge | — | Permanent on profile |

### 7.3 Implementation

```typescript
async function handleGraduation(userId: string, councilTier: string) {
  // 1. Activate Council membership
  await activateCouncilMembership(userId, councilTier);

  // 2. Deliver graduation bonus credits
  await deliverCredits(userId, 'council_credits', 2, 'graduation_bonus');

  // 3. Generate personalized welcome (using DEX AI chat context)
  const context = await getDexChatContext(userId);
  const welcome = await generateWelcomeMessage(context);

  // 4. Grant priority event access
  await grantPriorityAccess(userId, eventCount: 3);

  // 5. Award badge
  await awardBadge(userId, 'early_adopter');

  // 6. Send welcome email
  await sendGraduationEmail(userId, welcome);
}
```

### 7.4 Tickets

- `TC2-GG-001`: Graduation event detection
- `TC2-GG-002`: Bonus credit delivery
- `TC2-GG-003`: Personalized welcome generation (DeepSeek)
- `TC2-GG-004`: Priority event access flag
- `TC2-GG-005`: Badge award system
- `TC2-GG-006`: Graduation email template

---

## 8. Annual Prepay Billing

### 8.1 Model

Council memberships are **annual prepay only** (no monthly option).

| Tier | Annual (CNY) | Monthly Equivalent |
|------|-------------|-------------------|
| Founding | ¥2,800 | ¥233/mo |
| Individual | ¥3,800 | ¥317/mo |
| Corporate | ¥12,000 | ¥1,000/mo |
| PE Partner | ¥25,000 | ¥2,083/mo |

### 8.2 Stripe Configuration

- Mode: `subscription` with `interval: year`
- Proration: Enabled for mid-cycle upgrades
- Renewal: Auto-renew with 60/30/7 day reminders
- Cancellation: Pro-rated refund within first 30 days only

### 8.3 Tickets

- `TC2-AP-001`: Annual Stripe subscription setup
- `TC2-AP-002`: Auto-renewal handling
- `TC2-AP-003`: Renewal reminder emails (60/30/7 days)
- `TC2-AP-004`: Cancellation + partial refund logic
- `TC2-AP-005`: Upgrade proration calculation
- `TC2-AP-006`: Annual credit reset on renewal

---

## Ticket Summary (Addendum)

| Module | Tickets | IDs |
|--------|:-------:|-----|
| TC2-BJ: B2C User Journey | 6 | `TC2-BJ-001` to `TC2-BJ-006` |
| TC2-BL: Brand Language | 6 | `TC2-BL-001` to `TC2-BL-006` |
| TC2-DC: Dual Credits | 8 | `TC2-DC-001` to `TC2-DC-008` |
| TC2-PR: Pricing v2 | 6 | `TC2-PR-001` to `TC2-PR-006` |
| TC2-GT: Progressive Gating | 7 | `TC2-GT-001` to `TC2-GT-007` |
| TC2-GG: Graduation Gift | 6 | `TC2-GG-001` to `TC2-GG-006` |
| TC2-AP: Annual Prepay | 6 | `TC2-AP-001` to `TC2-AP-006` |
| **TOTAL** | **~45** | |

---

**Document Version:** 2.1  
**Created:** 2026-07-12  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 05c — The Council v2 Backend Wiring
## LYC Intelligence Platform — Database & API Connections

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Backend wiring for Council Portal v2 + DEX AI B2C  
**Dependencies:** 02 (Supabase), 05 (Council), 05b (v2.1 Addendum), 08 (Commerce)

---

## 1. Database Tables Used

### 1.1 Council Tables

| Table | Spec | Purpose |
|-------|------|---------|
| `council_profiles` | 02 §5.1 | Member profiles, tier, credits, status |
| `council_coaching_sessions` | 02 §5.2 | Coaching bookings, status, ratings |
| `council_events` | 02 §5.3 | Event definitions, capacity, pricing |
| `council_event_registrations` | 02 §5.4 | Event signups, attendance, payment |

### 1.2 DEX AI Tables

| Table | Spec | Purpose |
|-------|------|---------|
| `dex_user_profiles` | 02 §6.1 | B2C user profiles, intro status, credits |
| `dex_chat_sessions` | 02 §6.2 | AI conversation records |
| `dex_chat_context` | 02 §6.3 | Conversation memory/context |
| `dex_credit_consumption` | 02 §6.4 | B2C credit transaction log |

### 1.3 Commerce Tables

| Table | Spec | Purpose |
|-------|------|---------|
| `products` | 02 §7.1 | Product catalog |
| `orders` | 02 §7.2 | Order records |
| `credit_transactions` | 02 §7.3 | Unified credit ledger |
| `discount_codes` | 02 §7.4 | Promo codes |

---

## 2. API Endpoints

### 2.1 Council API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/council/profile` | GET | Get member profile | Council member |
| `/api/council/profile` | PATCH | Update profile | Council member |
| `/api/council/members` | GET | List members (directory) | Council member |
| `/api/council/members/:id` | GET | Member detail | Council member |
| `/api/council/community` | GET | Community feed | Council member |
| `/api/council/community` | POST | Create post | Council member |
| `/api/council/community/:id/like` | POST | Like post | Council member |
| `/api/council/community/:id/reply` | POST | Reply to post | Council member |

### 2.2 Coaching API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/council/coaches` | GET | List available coaches | Council member |
| `/api/council/coaching/book` | POST | Book session | Council member |
| `/api/council/coaching/upcoming` | GET | Upcoming sessions | Council member |
| `/api/council/coaching/past` | GET | Past sessions | Council member |
| `/api/council/coaching/:id/reschedule` | PATCH | Reschedule | Council member |
| `/api/council/coaching/:id/cancel` | POST | Cancel session | Council member |
| `/api/council/coaching/:id/rate` | POST | Rate session | Council member |

### 2.3 Events API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/council/events` | GET | List events | Auth (public for landing) |
| `/api/council/events/:id` | GET | Event detail | Auth |
| `/api/council/events/:id/register` | POST | Register for event | Council member |
| `/api/council/events/:id/cancel` | POST | Cancel registration | Council member |

### 2.4 DEX AI API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/dex/chat` | POST | Send message, get response | DEX AI user |
| `/api/dex/sessions` | GET | List chat sessions | DEX AI user |
| `/api/dex/sessions/:id` | GET | Get session detail | DEX AI user |
| `/api/dex/sessions/:id` | DELETE | Delete session | DEX AI user |
| `/api/dex/credits` | GET | Get credit balance | DEX AI user |
| `/api/dex/intro-status` | GET | Get intro message count | DEX AI user |

---

## 3. Edge Functions

### 3.1 AI Chat Function

**Function:** `ai-chat`  
**Trigger:** HTTP POST  
**Purpose:** Process DEX AI chat message

**Flow:**
```
1. Receive message + session_id
2. Check intro status (if messages_used < 5, allow free)
3. If paid: check DEX credit balance
4. If no credits: return gate error
5. Build context (from dex_chat_context)
6. Call DeepSeek API (route to flash/pro based on complexity)
7. Save response to dex_chat_sessions
8. Deduct credit (if applicable)
9. Update context (dex_chat_context)
10. Return response (streaming SSE)
```

**Tickets:**
- `TCW-EF-001`: ai-chat edge function
- `TCW-EF-002`: DeepSeek API integration
- `TCW-EF-003`: Context assembly from dex_chat_context
- `TCW-EF-004`: Credit deduction logic
- `TCW-EF-005`: Streaming response (SSE)
- `TCW-EF-006`: Intro message counting
- `TCW-EF-007`: Gate enforcement

### 3.2 Coaching Reminder Function

**Function:** `coaching-reminder`  
**Trigger:** Cron (hourly)  
**Purpose:** Send coaching session reminders

**Flow:**
```
1. Find sessions scheduled in next 24h with status='scheduled'
2. For each session:
   a. Check if 24h reminder already sent
   b. If not, send email + push notification
   c. Log notification
3. Find sessions scheduled in next 1h
4. Send urgent reminder
```

**Tickets:**
- `TCW-EF-008`: coaching-reminder cron function
- `TCW-EF-009`: Email notification dispatch
- `TCW-EF-010`: Push notification dispatch

### 3.3 Credit Expiry Function

**Function:** `credit-expiry`  
**Trigger:** Cron (daily)  
**Purpose:** Handle credit expiry

**Flow:**
```
1. DEX Credits: expire after 12 months from purchase
   - Find credits older than 12 months
   - Deduct expired amount
   - Create credit_transactions entry
   - Notify users

2. Council Credits: reset annually on membership renewal
   - On membership renewal, reset council_credits to tier allocation
   - Log reset in credit_transactions
```

**Tickets:**
- `TCW-EF-011`: credit-expiry cron function
- `TCW-EF-012`: DEX credit expiry processing
- `TCW-EF-013`: Council credit reset processing
- `TCW-EF-014`: Expiry notification emails

---

## 4. RLS Policies

### 4.1 Council RLS

```sql
-- Council profiles: members see own + public profiles
CREATE POLICY "Members see own profile"
ON council_profiles FOR SELECT
USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Members update own profile"
ON council_profiles FOR UPDATE
USING (user_id = auth.uid());

-- Coaching: members see own sessions
CREATE POLICY "Members see own coaching"
ON council_coaching_sessions FOR SELECT
USING (member_id IN (
  SELECT id FROM council_profiles WHERE user_id = auth.uid()
));

-- Events: public read, member register
CREATE POLICY "Anyone sees events"
ON council_events FOR SELECT
USING (status IN ('published', 'registration_open'));

CREATE POLICY "Members register for events"
ON council_event_registrations FOR INSERT
WITH CHECK (member_id IN (
  SELECT id FROM council_profiles WHERE user_id = auth.uid()
  AND membership_status = 'active'
));

-- Community: members only
CREATE POLICY "Members see community"
ON council_community_posts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM council_profiles WHERE user_id = auth.uid()
  AND membership_status = 'active'
));
```

### 4.2 DEX AI RLS

```sql
-- DEX profiles: user sees own
CREATE POLICY "User sees own DEX profile"
ON dex_user_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "User updates own DEX profile"
ON dex_user_profiles FOR UPDATE
USING (user_id = auth.uid());

-- Chat sessions: user sees own
CREATE POLICY "User sees own sessions"
ON dex_chat_sessions FOR SELECT
USING (user_id = auth.uid());

-- Chat context: user sees own
CREATE POLICY "User sees own context"
ON dex_chat_context FOR SELECT
USING (user_id = auth.uid());

-- Credit consumption: user sees own
CREATE POLICY "User sees own DEX credits"
ON dex_credit_consumption FOR SELECT
USING (user_id = auth.uid());
```

**Tickets:**
- `TCW-RLS-001`: Council profiles RLS
- `TCW-RLS-002`: Coaching sessions RLS
- `TCW-RLS-003`: Events RLS
- `TCW-RLS-004`: Event registrations RLS
- `TCW-RLS-005`: Community posts RLS
- `TCW-RLS-006`: DEX profiles RLS
- `TCW-RLS-007`: DEX sessions RLS
- `TCW-RLS-008`: DEX context RLS
- `TCW-RLS-009`: DEX credit consumption RLS

---

## 5. Realtime Subscriptions

```typescript
// Council realtime channels
const councilChannels = {
  community: supabase.channel('council:community')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'council_community_posts' }, handleNewPost)
    .subscribe(),

  coaching: supabase.channel(`coaching:${userId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'council_coaching_sessions', filter: `member_id=eq.${memberId}` }, handleCoachingUpdate)
    .subscribe(),

  credits: supabase.channel(`credits:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credit_transactions', filter: `user_id=eq.${userId}` }, handleCreditChange)
    .subscribe(),
};

// DEX AI realtime
const dexChannels = {
  chat: supabase.channel(`dex:chat:${sessionId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dex_chat_messages', filter: `session_id=eq.${sessionId}` }, handleNewMessage)
    .subscribe(),
};
```

**Tickets:**
- `TCW-RT-001`: Community feed realtime subscription
- `TCW-RT-002`: Coaching status realtime
- `TCW-RT-003`: Credit balance realtime
- `TCW-RT-004`: DEX chat realtime

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| TCW-EF: Edge Functions | 14 | `TCW-EF-001` to `TCW-EF-014` |
| TCW-RLS: RLS Policies | 9 | `TCW-RLS-001` to `TCW-RLS-009` |
| TCW-RT: Realtime | 4 | `TCW-RT-001` to `TCW-RT-004` |
| **TOTAL** | **~27** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 06 — Intelligence Layer Spec
## LYC Intelligence Platform — Data Backbone

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Intelligence signals, AI enrichment, market data, company insights  
**Dependencies:** 02 (Supabase), 04 (Client Portal)

---

## 1. Intelligence Layer Overview

### 1.1 Purpose

The Intelligence Layer is the data backbone of LYC Intelligence. It:
- Ingests market signals from multiple sources (RSS, APIs, web scraping, manual)
- Enriches company and candidate profiles with AI
- Generates actionable insights for consultants and clients
- Feeds the candidate-job matching engine
- Powers the Company 360° View

### 1.2 Architecture

```
┌─────────────────────────────────────────────────┐
│              INTELLIGENCE LAYER                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Sources   │  │ Signals  │  │ Enrichment   │ │
│  │ (Ingest)  │→ │ (Process)│→ │ (AI/ML)      │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
│       │              │                │          │
│       ▼              ▼                ▼          │
│  ┌──────────────────────────────────────────┐   │
│  │         Company Intelligence View        │   │
│  │  (360° company profile with live data)   │   │
│  └──────────────────────────────────────────┘   │
│       │                                          │
│       ▼                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Mandate  │  │Candidate │  │ Notifications│ │
│  │ Matching │  │Scoring   │  │ & Alerts     │ │
│  └──────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────┘
```

### 1.3 Signal Types

| Signal | Source | Frequency | Impact |
|--------|--------|-----------|--------|
| Funding rounds | Crunchbase, PitchBook API | Daily | High |
| Hiring velocity | LinkedIn, job boards | Hourly | Medium |
| Executive departures | News RSS, LinkedIn | Daily | High |
| Office openings/closures | News, company blogs | Weekly | Medium |
| M&A activity | News, regulatory filings | Daily | Critical |
| Compensation trends | Glassdoor, Levels.fyi | Weekly | Medium |
| Industry reports | Research feeds | Monthly | Low |
| Regulatory changes | Government feeds | Daily | High |
| Talent movement | LinkedIn, referrals | Real-time | Medium |
| Market shifts | Macro data feeds | Weekly | Medium |

---

## 2. Source Management (Admin)

### 2.1 Page: Intelligence Sources

**Route:** `/admin/intelligence/sources`  
**Access:** Super admin only

**Features:**
- List all configured intelligence sources
- Add/edit/delete sources
- Configure refresh intervals
- Monitor source health (last fetch, error rate)
- Test source connectivity

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Intelligence Sources                            │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Source           │ Type   │ Status │ Last  │  │
│  │──────────────────┼────────┼────────┼───────│  │
│  │ Crunchbase API   │ API    │ 🟢 OK  │ 2h ago│  │
│  │ LinkedIn Jobs    │ Scrape │ 🟡 Slow│ 1h ago│  │
│  │ TechCrunch RSS   │ RSS    │ 🟢 OK  │ 15m   │  │
│  │ Glassdoor        │ Scrape │ 🔴 Err │ 6h ago│  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [+ Add Source]  [Test All]  [Refresh All]      │
└─────────────────────────────────────────────────┘
```

**Tickets:**
- `INT-SRC-001`: Source list page with status indicators
- `INT-SRC-002`: Add source form (type, URL, interval, auth)
- `INT-SRC-003`: Edit source configuration
- `INT-SRC-004`: Delete source (soft delete)
- `INT-SRC-005`: Test source connectivity
- `INT-SRC-006`: Source health monitoring dashboard
- `INT-SRC-007`: Manual refresh trigger

---

## 3. Signal Processing

### 3.1 Page: Intelligence Dashboard

**Route:** `/intelligence`  
**Access:** All authenticated users (filtered by org)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Intelligence Dashboard              [Filters ▾] │
│                                                  │
│  🔥 Top Signals (Last 7 Days)                   │
│  ┌───────────────────────────────────────────┐  │
│  │ 🔴 Series D: ByteDance ($2B)    2h ago   │  │
│  │ 🟡 CTO departure: Alibaba Cloud 5h ago   │  │
│  │ 🟢 Expansion: Tesla Shanghai #2   8h ago │  │
│  │ 🔴 Acquisition: Pinduoduo/TEMU   12h ago │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  📊 By Type        📊 By Industry    📊 By Geo  │
│  ┌────────┐       ┌────────┐       ┌────────┐ │
│  │Funding 12│      │Tech   24│      │SH    18│ │
│  │Hiring  34│      │Finance 8│      │BJ    12│ │
│  │M&A      5│      │Health  6│      │SZ     8│ │
│  └────────┘       └────────┘       └────────┘ │
│                                                  │
│  📋 All Signals (paginated)                     │
│  ┌───────────────────────────────────────────┐  │
│  │ Type     │ Company   │ Detail    │ Score  │  │
│  │ Funding  │ ByteDance │ Series D  │ 0.95   │  │
│  │ Hiring   │ Tencent   │ +200 eng  │ 0.72   │  │
│  │ ...                                         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Tickets:**
- `INT-DASH-001`: Intelligence dashboard layout
- `INT-DASH-002`: Signal feed with infinite scroll
- `INT-DASH-003`: Signal filtering (type, industry, geography, date)
- `INT-DASH-004`: Signal detail view (expandable)
- `INT-DASH-005`: Signal relevance scoring display
- `INT-DASH-006`: Related companies/mandates linking
- `INT-DASH-007`: Signal bookmarking/saving
- `INT-DASH-008`: Real-time signal notifications

---

## 4. Company Intelligence (360° View)

### 4.1 Page: Company Intelligence Panel

**Route:** `/companies/{id}/intelligence`  
**Access:** Consultants + client users

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Company 360° — Acme Corp                        │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ HEALTH SCORE: 78/100 ████████░░            │  │
│  │ Trend: ↑ +5 (last 30 days)                │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  📊 Headcount Trend     💰 Funding Status       │
│  ┌────────────┐        ┌────────────────┐      │
│  │ [Chart]    │        │ Series B (2024)│      │
│  │ 250→320    │        │ $50M raised    │      │
│  │ +28% YoY   │        │ Next: est. Q3  │      │
│  └────────────┘        └────────────────┘      │
│                                                  │
│  🏢 Hiring Velocity     📰 Recent Signals       │
│  ┌────────────┐        ┌────────────────┐      │
│  │ 45 open    │        │ 3 signals (7d) │      │
│  │ 12 urgent  │        │ → View all     │      │
│  └────────────┘        └────────────────┘      │
│                                                  │
│  💼 Active Mandates     🧑 Talent Pipeline      │
│  ┌────────────┐        ┌────────────────┐      │
│  │ 3 mandates │        │ 12 candidates  │      │
│  │ 2 urgent   │        │ 4 submitted    │      │
│  └────────────┘        └────────────────┘      │
└─────────────────────────────────────────────────┘
```

**Tickets:**
- `INT-COMP-001`: Company 360° dashboard
- `INT-COMP-002`: Health score calculation & display
- `INT-COMP-003`: Headcount trend chart (sparkline)
- `INT-COMP-004`: Funding status panel
- `INT-COMP-005`: Hiring velocity widget
- `INT-COMP-006`: Recent signals list (company-specific)
- `INT-COMP-007`: Active mandates summary
- `INT-COMP-008`: Talent pipeline summary
- `INT-COMP-009`: AI-generated company brief
- `INT-COMP-010`: Export company intelligence report (PDF)

---

## 5. AI Enrichment Engine

### 5.1 Edge Function: ai-enrich

**Purpose:** Enrich company/candidate data using AI

**Trigger:** Manual (button click) or automatic (new record creation)

**Enrichment Types:**

| Target | Enrichment | Model | Cost |
|--------|-----------|-------|------|
| Company | Industry classification | DeepSeek flash | ~¥0.02 |
| Company | Size estimation | DeepSeek flash | ~¥0.02 |
| Company | Tech stack inference | DeepSeek pro | ~¥0.10 |
| Company | Competitive landscape | DeepSeek pro | ~¥0.10 |
| Company | Hiring needs prediction | DeepSeek pro | ~¥0.10 |
| Candidate | Skills extraction from CV | DeepSeek flash | ~¥0.02 |
| Candidate | Career trajectory analysis | DeepSeek pro | ~¥0.10 |
| Candidate | Role fit scoring | DeepSeek pro | ~¥0.10 |

**Tickets:**
- `INT-AI-001`: AI enrichment edge function setup
- `INT-AI-002`: Company enrichment pipeline
- `INT-AI-003`: Candidate enrichment pipeline
- `INT-AI-004`: Enrichment queue management
- `INT-AI-005`: Enrichment results storage
- `INT-AI-006`: Manual enrichment trigger (UI button)
- `INT-AI-007`: Auto-enrich on record creation
- `INT-AI-008`: Enrichment history & audit trail
- `INT-AI-009`: Enrichment cost tracking

---

## 6. Signal-to-Mandate Matching

### 6.1 Purpose

When an intelligence signal indicates a company is hiring (funding, expansion, departure), the system should:
1. Identify related active mandates
2. Suggest the signal to mandate consultants
3. Auto-generate outreach suggestions

### 6.2 Matching Logic

```typescript
// Pseudo-code for signal-to-mandate matching
async function matchSignalToMandates(signal: IntelligenceSignal) {
  // 1. Find mandates at related companies
  const mandates = await db.from('mandates')
    .select()
    .in('company_id', signal.companies_related)
    .eq('status', 'active');

  // 2. Score relevance
  for (const mandate of mandates) {
    const score = calculateRelevance(signal, mandate);
    if (score > 0.7) {
      await createSuggestion(signal, mandate, score);
    }
  }

  // 3. Notify consultants
  await notifyConsultants(mandates, signal);
}
```

**Tickets:**
- `INT-MATCH-001`: Signal-to-mandate matching algorithm
- `INT-MATCH-002`: Suggestion creation & storage
- `INT-MATCH-003`: Consultant notification on match
- `INT-MATCH-004`: Match confidence display
- `INT-MATCH-005`: Outreach template generation

---

## 7. Intelligence API

### 7.1 Internal API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/intelligence/signals` | GET | List signals (paginated) |
| `/api/intelligence/signals/:id` | GET | Signal detail |
| `/api/intelligence/signals` | POST | Create signal (admin) |
| `/api/intelligence/sources` | GET | List sources |
| `/api/intelligence/sources` | POST | Create source |
| `/api/intelligence/company/:id` | GET | Company intelligence view |
| `/api/intelligence/enrich` | POST | Trigger enrichment |
| `/api/intelligence/match` | POST | Signal-to-mandate match |
| `/api/intelligence/export` | GET | Export signals (CSV/PDF) |

**Tickets:**
- `INT-API-001`: Signals CRUD API
- `INT-API-002`: Sources CRUD API
- `INT-API-003`: Company intelligence aggregation API
- `INT-API-004`: Enrichment trigger API
- `INT-API-005`: Export API

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| INT-SRC: Source Management | 7 | `INT-SRC-001` to `INT-SRC-007` |
| INT-DASH: Intelligence Dashboard | 8 | `INT-DASH-001` to `INT-DASH-008` |
| INT-COMP: Company Intelligence | 10 | `INT-COMP-001` to `INT-COMP-010` |
| INT-AI: AI Enrichment | 9 | `INT-AI-001` to `INT-AI-009` |
| INT-MATCH: Signal Matching | 5 | `INT-MATCH-001` to `INT-MATCH-005` |
| INT-API: API Endpoints | 5 | `INT-API-001` to `INT-API-005` |
| **TOTAL** | **~44** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 07 — Candidate Portal Spec v2.1
## LYC Intelligence Platform — Job Seeker Experience

**Version:** 2.1  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Candidate portal for mandate applicants + job seekers  
**Dependencies:** 02 (Supabase), 04 (Client Portal), 05 (Council)  
**Scope Note:** Candidate Portal serves mandate applicants. DEX AI referral is a post-graduation CTA only — not a primary feature.

---

## 1. Portal Overview

### 1.1 Purpose

The Candidate Portal is where job seekers interact with LYC Intelligence:
- Apply to mandates (open positions)
- Track application status
- Complete assessments (complimentary)
- Receive AI-powered career insights
- Get matched to relevant positions
- Graduate to The Council (post-placement)

### 1.2 User Types

| User Type | Access | Description |
|-----------|--------|-------------|
| **Visitor** | Public pages | Browse mandates, see value prop |
| **Applicant** | Application + tracking | Applied to a mandate |
| **Active Candidate** | Full portal | In pipeline (screening → placed) |
| **Alumni** | Limited + CTA | Placed/rejected, Council invitation |

### 1.3 Brand Language

| ❌ NEVER | ✅ INSTEAD |
|---------|-----------|
| "Free assessment" | "Complimentary assessment" |
| "Free profile review" | "Complimentary profile review" |
| "Sign up free" | "Create your candidate profile" |

---

## 2. Page Map

| # | Page | Route | Access |
|---|------|-------|--------|
| CP1 | Candidate Landing | `/candidates` | Public |
| CP2 | Browse Mandates | `/candidates/mandates` | Public |
| CP3 | Mandate Detail | `/candidates/mandates/:id` | Public |
| CP4 | Application Form | `/candidates/apply/:id` | Auth |
| CP5 | Candidate Dashboard | `/candidates/dashboard` | Auth (applicant) |
| CP6 | Application Tracker | `/candidates/applications` | Auth |
| CP7 | ASSESS (Complimentary) | `/candidates/assess` | Auth |
| CP8 | AI Career Insights | `/candidates/insights` | Auth |
| CP9 | Profile & Resume | `/candidates/profile` | Auth |

**Total: 9 pages**

---

## 3. Page Specifications

### 3.1 CP1: Candidate Landing

**Route:** `/candidates`  
**Access:** Public

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Land your next role with LYC Intelligence           │
│                                                      │
│  AI-powered matching. Senior consultant advocacy.    │
│  Transparent process. No black holes.                │
│                                                      │
│  [Browse Positions]  [Upload Resume]                 │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  HOW IT WORKS                                │   │
│  │                                              │   │
│  │  1. Apply → 2. AI Assessment → 3. Match     │   │
│  │  4. Consultant Review → 5. Client Intro      │   │
│  │  6. Interview → 7. Offer → 8. Placement     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  FEATURED POSITIONS                          │   │
│  │  [Mandate cards with quick apply]            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P1-001`: Hero section with dual CTA
- `CPT-P1-002`: "How it works" process steps
- `CPT-P1-003`: Featured positions carousel
- `CPT-P1-004`: Search/filter bar
- `CPT-P1-005`: Testimonials from placed candidates
- `CPT-P1-006`: Stats (positions filled, avg time-to-offer)

---

### 3.2 CP2: Browse Mandates

**Route:** `/candidates/mandates`  
**Access:** Public

**Features:**
- Search by keyword, location, level, function
- Filter by industry, salary range, remote policy
- Sort by date, salary, priority
- Quick apply button on each card

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Open Positions                          [Filters ▾] │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔍 Search...   [Location ▾] [Level ▾] [→]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ VP Engineering  │ │ Head of Product │           │
│  │ Tech Corp       │ │ FinanceCo       │           │
│  │ Shanghai │ ¥80-120万│ │ Beijing │ ¥60-90万  │           │
│  │ [Quick Apply]   │ │ [Quick Apply]   │           │
│  └─────────────────┘ └─────────────────┘           │
│                                                      │
│  [Load more...]                                      │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P2-001`: Mandate listing grid
- `CPT-P2-002`: Search bar (keyword, location)
- `CPT-P2-003`: Filter panel (level, industry, salary, remote)
- `CPT-P2-004`: Sort options
- `CPT-P2-005`: Mandate card component
- `CPT-P2-006`: Quick apply button
- `CPT-P2-007`: Infinite scroll / pagination
- `CPT-P2-008`: "No results" state

---

### 3.3 CP3: Mandate Detail

**Route:** `/candidates/mandates/:id`  
**Access:** Public (apply requires auth)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  VP Engineering — Tech Corp                          │
│  Shanghai │ Full-time │ Senior │ ¥80-120万            │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ About the Role                               │   │
│  │ Lead engineering team of 50+...             │   │
│  │                                              │   │
│  │ Requirements                                 │   │
│  │ - 10+ years experience                       │   │
│  │ - Distributed systems expertise              │   │
│  │ - Team leadership track record               │   │
│  │                                              │   │
│  │ What We Offer                                │   │
│  │ - Competitive comp + equity                  │   │
│  │ - Flexible work arrangement                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  [Apply Now]  [Save for Later]  [Share]             │
│                                                      │
│  🤖 AI Match Score: [Not calculated until apply]    │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P3-001`: Mandate detail page layout
- `CPT-P3-002`: Apply button (auth check)
- `CPT-P3-003`: Save/bookmark functionality
- `CPT-P3-004`: Share button (copy link)
- `CPT-P3-005`: Similar positions sidebar
- `CPT-P3-006`: Company mini-profile
- `CPT-P3-007`: Salary visualization

---

### 3.4 CP4: Application Form

**Route:** `/candidates/apply/:mandate_id`  
**Access:** Auth required

**Flow:**
```
1. Login/Signup (if not authenticated)
2. Profile check (complete profile first if needed)
3. Resume upload (PDF/DOCX)
4. Cover letter (optional)
5. Screening questions (mandate-specific)
6. Submit → triggers AI match scoring
```

**Tickets:**
- `CPT-P4-001`: Application form (multi-step)
- `CPT-P4-002`: Resume upload + parsing
- `CPT-P4-003`: Cover letter field
- `CPT-P4-004`: Screening questions (dynamic per mandate)
- `CPT-P4-005`: Profile completion check
- `CPT-P4-006`: Submit → create mandate_candidate record
- `CPT-P4-007`: AI match score calculation trigger
- `CPT-P4-008`: Application confirmation page

---

### 3.5 CP5: Candidate Dashboard

**Route:** `/candidates/dashboard`  
**Access:** Auth (active candidates)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Welcome, [Name]                                     │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ Active Apps: 3  │ │ Next Step:      │           │
│  │ Interview: 1    │ │ Tech Corp phone │           │
│  │                 │ │ Jul 18, 14:00   │           │
│  └─────────────────┘ └─────────────────┘           │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ APPLICATION PIPELINE                         │   │
│  │                                              │   │
│  │ Applied    Screening   Interview   Offer     │   │
│  │ ──────●──────●──────────●──────────○         │   │
│  │                                              │   │
│  │ Tech Corp     ████████░░  Interview Stage    │   │
│  │ FinanceCo     ██████░░░░  Screening          │   │
│  │ StartupX      ████░░░░░░  Applied            │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ 🤖 AI Insights  │ │ 📋 Assess       │           │
│  │ 2 new matches   │ │ Complete your   │           │
│  │ [View]          │ │ complimentary   │           │
│  │                 │ │ assessment      │           │
│  └─────────────────┘ └─────────────────┘           │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P5-001`: Dashboard overview
- `CPT-P5-002`: Application pipeline visualization
- `CPT-P5-003`: Next step widget (upcoming interviews)
- `CPT-P5-004`: AI insights notification
- `CPT-P5-005`: Complimentary assessment prompt
- `CPT-P5-006`: Activity feed (status changes)
- `CPT-P5-007`: Quick links (edit profile, view mandates)

---

### 3.6 CP6: Application Tracker

**Route:** `/candidates/applications`  
**Access:** Auth

**Features:**
- Full list of all applications with status
- Status timeline (applied → screening → interview → offer → placed)
- Consultant notes (shared with candidate)
- Interview preparation resources
- Withdraw application option

**Tickets:**
- `CPT-P6-001`: Application list (table view)
- `CPT-P6-002`: Status timeline component
- `CPT-P6-003`: Application detail expand
- `CPT-P6-004`: Consultant notes display
- `CPT-P6-005`: Interview prep resources
- `CPT-P6-006`: Withdraw application
- `CPT-P6-007`: Status change notifications

---

### 3.7 CP7: ASSESS — Complimentary Assessment

**Route:** `/candidates/assess`  
**Access:** Auth

**Purpose:** Complimentary career assessment — helps consultants understand the candidate better

**Features:**
- Skills self-assessment questionnaire
- Work style preferences
- Career goals and expectations
- AI-generated career brief
- Results shared with matching consultants

**Tickets:**
- `CPT-P7-001`: Assessment flow (multi-step form)
- `CPT-P7-002`: Skills self-assessment
- `CPT-P7-003`: Work style preferences
- `CPT-P7-004`: Career goals section
- `CPT-P7-005`: AI career brief generation (DeepSeek)
- `CPT-P7-006`: Results display
- `CPT-P7-007`: Save to profile
- `CPT-P7-008`: Share with consultants toggle

---

### 3.8 CP8: AI Career Insights

**Route:** `/candidates/insights`  
**Access:** Auth

**Features:**
- AI-matched positions (based on profile)
- Market intelligence for candidate's field
- Salary benchmarks
- Skill gap analysis
- Recommended learning resources

**Tickets:**
- `CPT-P8-001`: AI-matched positions feed
- `CPT-P8-002`: Market intelligence panel
- `CPT-P8-003`: Salary benchmark display
- `CPT-P8-004`: Skill gap analysis
- `CPT-P8-005`: Learning resource recommendations
- `CPT-P8-006`: "You might also like" positions

---

### 3.9 CP9: Profile & Resume

**Route:** `/candidates/profile`  
**Access:** Auth

**Features:**
- Edit candidate profile
- Upload/update resume
- Manage preferences (job alerts, privacy)
- View AI match history

**Tickets:**
- `CPT-P9-001`: Profile edit form
- `CPT-P9-002`: Resume upload (version history)
- `CPT-P9-003`: Job alert preferences
- `CPT-P9-004`: Privacy settings
- `CPT-P9-005`: LinkedIn import
- `CPT-P9-006`: Profile completeness indicator

---

## 4. Post-Placement: Alumni → Council

### 4.1 Graduation Flow

When a candidate is placed (successfully filled a mandate):

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ PLACED   │ ──→ │ CELEBRATE│ ──→ │ INVITE   │
│ (status) │     │ (congrats│     │ to The   │
│          │     │  + next  │     │ Council   │
│          │     │  steps)  │     │          │
└──────────┘     └──────────┘     └──────────┘
```

### 4.2 Graduation Gift

- **Complimentary career check-in** (6 months post-placement)
- **The Council invitation** with "Alumni" fast-track
- **DEX AI Executive Introduction** (if not already used)

### 4.3 Tickets

- `CPT-AL-001`: Post-placement celebration email
- `CPT-AL-002`: Council invitation flow (alumni fast-track)
- `CPT-AL-003`: 6-month check-in reminder
- `CPT-AL-004`: DEX AI cross-sell (as post-graduation CTA)
- `CPT-AL-005`: Alumni status tracking

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| CPT-P1: Landing | 6 | `CPT-P1-001` to `CPT-P1-006` |
| CPT-P2: Browse Mandates | 8 | `CPT-P2-001` to `CPT-P2-008` |
| CPT-P3: Mandate Detail | 7 | `CPT-P3-001` to `CPT-P3-007` |
| CPT-P4: Application Form | 8 | `CPT-P4-001` to `CPT-P4-008` |
| CPT-P5: Dashboard | 7 | `CPT-P5-001` to `CPT-P5-007` |
| CPT-P6: Application Tracker | 7 | `CPT-P6-001` to `CPT-P6-007` |
| CPT-P7: ASSESS | 8 | `CPT-P7-001` to `CPT-P7-008` |
| CPT-P8: AI Insights | 6 | `CPT-P8-001` to `CPT-P8-006` |
| CPT-P9: Profile | 6 | `CPT-P9-001` to `CPT-P9-006` |
| CPT-AL: Alumni/Council | 5 | `CPT-AL-001` to `CPT-AL-005` |
| **TOTAL** | **~68** | |

---

**Document Version:** 2.1  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# 08 — Commerce Layer Spec v2.0
## LYC Intelligence Platform — Revenue Engine

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** All monetization — credits, subscriptions, orders, Stripe, pricing  
**Dependencies:** 02 (Supabase), 05 (Council), DEX AI B2C  
**Scope Note:** LYC Intelligence only. WAVE and VISTA are out of scope.

---

## 1. Commerce Layer Overview

### 1.1 Purpose

The Commerce Layer is the revenue engine of LYC Intelligence. It handles:
- **Credit systems** (dual model: DEX AI Credits + Council Credits)
- **Subscription management** (Council membership tiers)
- **One-time purchases** (credit packs, event tickets, assessments)
- **Payment processing** (Stripe integration)
- **Revenue tracking** (orders, transactions, analytics)

### 1.2 Revenue Streams

| Stream | Type | Price (CNY) | Credit Model |
|--------|------|-------------|-------------|
| **DEX AI Executive Introduction** | Complimentary | Free (5 messages) | No credits — gated funnel |
| **DEX AI Credit Pack Starter** | One-time | ¥99 (10 credits) | DEX Credits |
| **DEX AI Credit Pack Professional** | One-time | ¥399 (50 credits) | DEX Credits |
| **DEX AI Credit Pack Executive** | One-time | ¥799 (150 credits) | DEX Credits |
| **DEX AI Monthly Member** | Subscription | ¥99/mo (30 credits/mo) | DEX Credits |
| **DEX AI Monthly Pro** | Subscription | ¥299/mo (100 credits/mo) | DEX Credits |
| **Council Founding** | Annual | ¥2,800/yr (first 20) | Council Credits |
| **Council Individual** | Annual | ¥3,800/yr | Council Credits |
| **Council Corporate** | Annual | ¥12,000/yr | Council Credits |
| **Council PE Partner** | Annual | ¥25,000/yr | Council Credits |
| **Workshop Tickets** | One-time | ¥0–500/event | Council Credits or cash |
| **Coaching Sessions** | Per-session | Credits only | Council Credits |

### 1.3 Dual Credit Model

```
┌─────────────────────────────────────────────┐
│              DEX AI CREDITS                  │
│  Purpose: B2C AI advisory consultations      │
│  Currency: DEX Credits                       │
│  Purchase: Credit packs (99/399/799 CNY)     │
│  Subscription: Monthly (99/299 CNY)          │
│  Consumption: 1 credit per AI message        │
│  Scope: DEX AI chat only                     │
│  Expiry: Credits expire after 12 months      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│             COUNCIL CREDITS                  │
│  Purpose: Membership coaching & events       │
│  Currency: Council Credits                   │
│  Included: With annual membership            │
│  Consumption: 1 credit per coaching session  │
│  Scope: Council Portal only                  │
│  Expiry: Reset annually with membership      │
└─────────────────────────────────────────────┘

Key Rule: Credits are NON-TRANSFERABLE between systems.
DEX Credits ≠ Council Credits. Separate ledgers, separate consumption.
```

### 1.4 Brand Language Rules (CRITICAL)

| Context | ❌ NEVER SAY | ✅ SAY INSTEAD |
|---------|-------------|---------------|
| DEX AI first touch | "Free tier" | "Executive Introduction" |
| DEX AI sign-up | "Sign up free" | "Access your Executive Introduction" |
| Candidate assessments | "Free assessment" | "Complimentary assessment" |
| Any zero-cost feature | "Free" | "Complimentary" or "Executive Introduction" |
| Council trial | "Free trial" | "Founding member rate" |

**The word "free" is permanently banned from all LYC Intelligence UI copy.**

---

## 2. Product Catalog

### 2.1 Product Codes

| Product Code | Name | Price (CNY) | Category | Credits |
|-------------|------|-------------|----------|---------|
| `B2C-DEX-INTRO` | DEX AI Executive Introduction | 0 | dex_credit_pack | 5 (intro messages) |
| `B2C-DEX-STARTER` | Credit Pack Starter | 99 | dex_credit_pack | 10 DEX Credits |
| `B2C-DEX-PRO` | Credit Pack Professional | 399 | dex_credit_pack | 50 DEX Credits |
| `B2C-DEX-EXEC` | Credit Pack Executive | 799 | dex_credit_pack | 150 DEX Credits |
| `B2C-DEX-MONTHLY` | Monthly Member | 99/mo | dex_subscription | 30 DEX Credits/mo |
| `B2C-DEX-MONTHLY-PRO` | Monthly Pro | 299/mo | dex_subscription | 100 DEX Credits/mo |
| `CNC-FOUNDING` | Council Founding | 2,800/yr | council_membership | 12 Council Credits/yr |
| `CNC-INDIVIDUAL` | Council Individual | 3,800/yr | council_membership | 12 Council Credits/yr |
| `CNC-CORPORATE` | Council Corporate | 12,000/yr | council_membership | 48 Council Credits/yr |
| `CNC-PE-PARTNER` | Council PE Partner | 25,000/yr | council_membership | 100 Council Credits/yr |
| `EVT-WORKSHOP` | Workshop Ticket | 0–500 | event_ticket | Varies |
| `COA-SESSION` | Coaching Session | 1 credit | coaching_session | 1 Council Credit |

### 2.2 Product Detail Pages

#### COM-001: Credit Store Page (DEX AI)

**Route:** `/dex/credits`  
**Access:** Any authenticated DEX AI user

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  DEX AI Credit Store                                │
│                                                     │
│  Your balance: [XX] DEX Credits                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ONE-TIME CREDIT PACKS                      │   │
│  │                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Starter   │ │Professional│ │Executive │   │   │
│  │  │ ¥99       │ │ ¥399       │ │ ¥799     │   │   │
│  │  │ 10 credits│ │ 50 credits │ │ 150 credits│  │   │
│  │  │           │ │ Save 20%   │ │ Save 33%  │   │   │
│  │  │ [BUY]     │ │ [BUY]      │ │ [BUY]     │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  SUBSCRIBE & SAVE                            │   │
│  │                                              │   │
│  │  Monthly Member        Monthly Pro           │   │
│  │  ¥99/month             ¥299/month            │   │
│  │  30 credits/month      100 credits/month     │   │
│  │  [SUBSCRIBE]           [SUBSCRIBE]           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Transaction history ↓                              │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `COM-DEX-001`: Credit store page layout & rendering
- `COM-DEX-002`: Stripe Checkout integration for credit packs
- `COM-DEX-003`: Subscription management (create/upgrade/cancel)
- `COM-DEX-004`: Balance display & real-time update
- `COM-DEX-005`: Transaction history with filters
- `COM-DEX-006`: Credit expiry warnings (30/7/1 day)
- `COM-DEX-007`: Upgrade prompt when credits run low

#### COM-002: Council Membership Page

**Route:** `/council/membership`  
**Access:** Any authenticated user (upgrade flow)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  The Council — Membership                            │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Individual │ │Corporate │ │PE Partner│ │Founding││
│  │ ¥3,800/yr│ │¥12,000/yr│ │¥25,000/yr│ │¥2,800  ││
│  │          │ │          │ │          │ │/yr     ││
│  │ 12 credits│ │ 48 credits│ │100 credits│ │12 cred ││
│  │ [SELECT] │ │ [SELECT] │ │ [SELECT] │ │(20 left)││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│  What's included:                                   │
│  ✓ 1-on-1 coaching sessions                        │
│  ✓ Exclusive workshops & events                     │
│  ✓ Private community access                         │
│  ✓ AI-powered career intelligence                   │
│  ✓ Priority candidate referrals                     │
│  ✓ Executive network access                         │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `COM-CNC-001`: Membership tier comparison page
- `COM-CNC-002`: Annual prepay Stripe Checkout
- `COM-CNC-003`: Founding member counter (20 max)
- `COM-CNC-004`: Membership activation workflow
- `COM-CNC-005`: Renewal reminders (60/30/7 days)
- `COM-CNC-006`: Corporate seat management
- `COM-CNC-007`: PE Partner deal flow access

#### COM-003: Checkout Flow

**Route:** `/checkout/{product_code}`

**Flow:**
```
Product Selection → Cart Review → Payment (Stripe) → Confirmation → Fulfillment
```

**Tickets:**
- `COM-CHK-001`: Cart/checkout page
- `COM-CHK-002`: Stripe Checkout Session creation
- `COM-CHK-003`: Payment confirmation webhook handler
- `COM-CHK-004`: Order creation & status tracking
- `COM-CHK-005`: Credit delivery (immediate for packs, monthly for subs)
- `COM-CHK-006`: Invoice/receipt generation
- `COM-CHK-007`: Failed payment retry logic
- `COM-CHK-008`: Refund workflow (admin)
- `COM-CHK-009`: Discount code application
- `COM-CHK-010`: Tax calculation (CNY invoices)

#### COM-004: Billing & Subscription Management

**Route:** `/account/billing`

**Tickets:**
- `COM-BIL-001`: Current plan display
- `COM-BIL-002`: Upgrade/downgrade flow
- `COM-BIL-003`: Cancel subscription flow
- `COM-BIL-004`: Payment method management
- `COM-BIL-005`: Invoice history
- `COM-BIL-006`: Next billing date display
- `COM-BIL-007`: Proration calculation

#### COM-005: Revenue Analytics (Admin)

**Route:** `/admin/revenue`

**Tickets:**
- `COM-REV-001`: Revenue dashboard (MRR, ARR, LTV)
- `COM-REV-002`: Product-level revenue breakdown
- `COM-REV-003`: Credit consumption analytics
- `COM-REV-004`: Conversion funnel (intro → paid)
- `COM-REV-005`: Churn rate tracking
- `COM-REV-006`: Revenue forecasting
- `COM-REV-007`: Cohort analysis
- `COM-REV-008`: Export to CSV/PDF

#### COM-006: Stripe Webhook Handler

**Edge Function:** `stripe-webhook`

**Events to handle:**
- `checkout.session.completed` → Activate credits/membership
- `customer.subscription.updated` → Update subscription status
- `customer.subscription.deleted` → Handle cancellation
- `invoice.paid` → Confirm payment
- `invoice.payment_failed` → Trigger retry + notification
- `charge.refunded` → Process refund

**Tickets:**
- `COM-SW-001`: Webhook endpoint setup
- `COM-SW-002`: checkout.session.completed handler
- `COM-SW-003`: subscription.updated handler
- `COM-SW-004`: subscription.deleted handler
- `COM-SW-005`: invoice.payment_failed handler
- `COM-SW-006`: charge.refunded handler
- `COM-SW-007`: Webhook signature verification
- `COM-SW-008`: Idempotency handling
- `COM-SW-009`: Error logging & retry

#### COM-007: Credit Ledger System

**Tickets:**
- `COM-CL-001`: Credit balance calculation (DEX)
- `COM-CL-002`: Credit balance calculation (Council)
- `COM-CL-003`: Credit consumption on AI message
- `COM-CL-004`: Credit consumption on coaching booking
- `COM-CL-005`: Credit consumption on event registration
- `COM-CL-006`: Credit top-up flow
- `COM-CL-007`: Credit expiry job (daily cron)
- `COM-CL-008`: Low credit notifications
- `COM-CL-009`: Credit audit trail
- `COM-CL-010`: Balance reconciliation check

#### COM-008: Progressive Gating (DEX AI)

**UX Pattern:** Show value before asking for payment

```
Message 1-5: Executive Introduction (complimentary, no payment)
  → Shows full AI capability
  → Builds trust and dependency
Message 6: Soft gate
  → "You've used your 5 Executive Introduction messages.
     Continue your conversation with a Credit Pack."
  → Shows credit pack options
  → Does NOT block — just prompts
Message 6+: Hard gate (unless subscribed)
  → Must purchase credits or subscribe to continue
  → Shows current balance + purchase options
```

**Tickets:**
- `COM-PG-001`: Intro message counter (5 message limit)
- `COM-PG-002`: Soft gate UI (message 6 prompt)
- `COM-PG-003`: Hard gate enforcement
- `COM-PG-004`: Credit balance check before each message
- `COM-PG-005`: "Upgrade to subscription" prompt
- `COM-PG-006`: Council member cross-sell prompt
- `COM-PG-007`: Graduation gift flow (DEX → Council)

#### COM-009: Cross-Sell Engine

**Tickets:**
- `COM-XS-001`: DEX AI → Council membership prompt
- `COM-XS-002`: Council → DEX AI prompt (for AI features)
- `COM-XS-003`: Event → Membership upsell
- `COM-XS-004`: Coaching → Credit pack upsell
- `COM-XS-005`: Candidate graduation → Council invitation
- `COM-XS-006`: Time-based cross-sell triggers
- `COM-XS-007`: Cross-sell A/B testing framework

---

## 3. Stripe Integration

### 3.1 Stripe Products Setup

```
Stripe Products:
├── DEX AI Credit Packs
│   ├── Starter (¥99) → price_xxx
│   ├── Professional (¥399) → price_xxx
│   └── Executive (¥799) → price_xxx
├── DEX AI Subscriptions
│   ├── Monthly Member (¥99/mo) → price_xxx
│   └── Monthly Pro (¥299/mo) → price_xxx
├── Council Memberships
│   ├── Founding (¥2,800/yr) → price_xxx
│   ├── Individual (¥3,800/yr) → price_xxx
│   ├── Corporate (¥12,000/yr) → price_xxx
│   └── PE Partner (¥25,000/yr) → price_xxx
└── Events
    └── Workshop Tickets (varies) → price_xxx
```

### 3.2 Checkout Session Flow

```typescript
// 1. Client: Create Checkout Session
POST /api/create-checkout-session
{
  product_code: 'B2C-DEX-PRO',
  quantity: 1,
  success_url: '/dex/credits?success=true',
  cancel_url: '/dex/credits?cancelled=true'
}

// 2. Server: Create Stripe Checkout
const session = await stripe.checkout.sessions.create({
  mode: product.billing_cycle === 'one_time' ? 'payment' : 'subscription',
  line_items: [{ price: product.stripe_price_id, quantity: 1 }],
  success_url, cancel_url,
  metadata: { product_code, user_id }
});

// 3. Stripe: Redirect user to checkout
// 4. Stripe: Redirect back to success_url
// 5. Stripe: Send webhook (checkout.session.completed)
// 6. Server: Fulfill order (deliver credits/activate membership)
```

### 3.3 Webhook Security

```typescript
// Verify Stripe signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body, sig, webhookSecret
);

// Idempotency: check if already processed
const existing = await db.from('orders')
  .select()
  .eq('stripe_checkout_session_id', event.data.object.id)
  .single();

if (existing) return { status: 'already_processed' };
```

---

## 4. Pricing Table (Complete Reference)

### 4.1 DEX AI Products

| Product | Price | Billing | Credits | Stripe Mode |
|---------|-------|---------|---------|-------------|
| Executive Introduction | ¥0 | One-time | 5 messages | N/A (no Stripe) |
| Credit Pack Starter | ¥99 | One-time | 10 DEX Credits | `payment` |
| Credit Pack Professional | ¥399 | One-time | 50 DEX Credits | `payment` |
| Credit Pack Executive | ¥799 | One-time | 150 DEX Credits | `payment` |
| Monthly Member | ¥99/mo | Monthly | 30 DEX Credits/mo | `subscription` |
| Monthly Pro | ¥299/mo | Monthly | 100 DEX Credits/mo | `subscription` |

### 4.2 Council Products

| Product | Price | Billing | Credits | Stripe Mode |
|---------|-------|---------|---------|-------------|
| Founding | ¥2,800 | Annual | 12 Council Credits/yr | `subscription` |
| Individual | ¥3,800 | Annual | 12 Council Credits/yr | `subscription` |
| Corporate | ¥12,000 | Annual | 48 Council Credits/yr | `subscription` |
| PE Partner | ¥25,000 | Annual | 100 Council Credits/yr | `subscription` |

### 4.3 Per-Unit Economics

| Item | Cost per Unit |
|------|-------------|
| 1 DEX AI message (DeepSeek flash) | ~¥0.02 |
| 1 DEX AI message (DeepSeek pro) | ~¥0.10 |
| 1 DEX Credit (selling price) | ¥9.90 (Starter), ¥7.98 (Pro), ¥5.33 (Exec) |
| 1 Council coaching session | 1 Council Credit |
| 1 Council Credit (Individual) | ¥316.67 (¥3,800/12) |
| 1 Council Credit (Corporate) | ¥250.00 (¥12,000/48) |

---

## 5. Order Management

### 5.1 Order States

```
[pending] → [payment_required] → [paid] → [processing] → [fulfilled]
                                                         ↓
                                          [cancelled] ← [failed]
                                                         ↓
                                                 [refunded] / [partially_refunded]
```

### 5.2 Order Fulfillment Rules

| Product Category | Fulfillment | Trigger |
|-----------------|-------------|---------|
| Credit Pack | Immediate credit delivery | `checkout.session.completed` |
| Subscription | Activate sub + deliver monthly credits | `checkout.session.completed` |
| Council Membership | Activate profile + deliver annual credits | `checkout.session.completed` |
| Event Ticket | Register for event | `checkout.session.completed` |
| Coaching Session | Deduct credit + create booking | In-app (no Stripe) |

---

## 6. Invoice & Receipt

### 6.1 Invoice Requirements (China)

- Company name: 灵YC（上海）管理咨询有限公司
- Tax ID (税号): Required for B2B invoices
- Invoice type: 增值税普通发票 (standard) or 增值税专用发票 (VAT special)
- Currency: CNY only
- Language: Chinese (Simplified)

### 6.2 Invoice Template

```
发票号码: INV-2026-XXXXX
开票日期: 2026-07-13
购买方: [Company Name]
纳税人识别号: [Tax ID]

商品/服务          数量    单价      金额
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEX AI 智能咨询信用包   1    ¥399.00   ¥399.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
合计:                              ¥399.00
```

---

## 7. Financial Reporting

### 7.1 Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| MRR | Sum of monthly subscription revenue | ¥50,000 by Month 6 |
| ARR | MRR × 12 | ¥600,000 by Month 6 |
| ARPU | Total revenue / paying users | ¥300/mo |
| LTV | ARPU × avg lifetime months | ¥3,600 |
| CAC | Marketing spend / new customers | < ¥500 |
| LTV:CAC ratio | LTV / CAC | > 3:1 |
| Churn rate | Cancelled subs / total subs | < 5%/mo |
| NRR | (Starting MRR + expansion - contraction - churn) / Starting MRR | > 110% |

### 7.2 Revenue Recognition

- Credit packs: Recognized at point of sale
- Subscriptions: Recognized monthly (pro-rated)
- Event tickets: Recognized at event completion
- Coaching: Recognized at session completion

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| COM-DEX: DEX AI Credit Store | 7 | `COM-DEX-001` to `COM-DEX-007` |
| COM-CNC: Council Membership | 7 | `COM-CNC-001` to `COM-CNC-007` |
| COM-CHK: Checkout Flow | 10 | `COM-CHK-001` to `COM-CHK-010` |
| COM-BIL: Billing Management | 7 | `COM-BIL-001` to `COM-BIL-007` |
| COM-REV: Revenue Analytics | 8 | `COM-REV-001` to `COM-REV-008` |
| COM-SW: Stripe Webhooks | 9 | `COM-SW-001` to `COM-SW-009` |
| COM-CL: Credit Ledger | 10 | `COM-CL-001` to `COM-CL-010` |
| COM-PG: Progressive Gating | 7 | `COM-PG-001` to `COM-PG-007` |
| COM-XS: Cross-Sell Engine | 7 | `COM-XS-001` to `COM-XS-007` |
| **TOTAL** | **~72** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start

---

# LYC Intelligence — Trae Build Tickets

**Repository:** [kevinhongfr-star/lyc-intelligence](https://github.com/kevinhongfr-star/lyc-intelligence)

**Spec Bundle:** [specs/v2/](https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/specs/v2)

---

## Phase 1 — Foundation (P0)

🔲 **#1** [Phase 1: Database Migration & Schema Setup](https://github.com/kevinhongfr-star/lyc-intelligence/issues/1)
🔲 **#2** [Phase 1: Auth & RBAC System](https://github.com/kevinhongfr-star/lyc-intelligence/issues/2)
🔲 **#3** [Phase 1: RLS Policies — All 57 Tables](https://github.com/kevinhongfr-star/lyc-intelligence/issues/3)
🔲 **#4** [Phase 1: Edge Functions & AI Routing](https://github.com/kevinhongfr-star/lyc-intelligence/issues/4)
✅ **#5** [Phase 1: UX Design System & Shared Components](https://github.com/kevinhongfr-star/lyc-intelligence/issues/5)
🔲 **#6** [Phase 1: Commerce Layer — Stripe Integration & Checkout](https://github.com/kevinhongfr-star/lyc-intelligence/issues/6)
🔲 **#7** [Phase 1: Commerce Layer — Credit System & Progressive Gating](https://github.com/kevinhongfr-star/lyc-intelligence/issues/7)

---

## Phase 2 — Core Portals (P1)

🔲 **#8** [Phase 2: Intelligence Layer — Data Pipeline & Signals](https://github.com/kevinhongfr-star/lyc-intelligence/issues/8)
🔲 **#9** [Phase 2: Council Portal — Public Pages & DEX AI B2C](https://github.com/kevinhongfr-star/lyc-intelligence/issues/9)
🔲 **#10** [Phase 2: Council Portal — Member Dashboard & Community](https://github.com/kevinhongfr-star/lyc-intelligence/issues/10)
🔲 **#11** [Phase 2: Council Portal — Admin Management](https://github.com/kevinhongfr-star/lyc-intelligence/issues/11)
🔲 **#12** [Phase 2: Internal Portal (Consultant Workspace)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/12)
🔲 **#15** [Phase 2: Notification System (Cross-Portal)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/15)

---

## Phase 3 — Extended (P2)

🔲 **#13** [Phase 3: Client Portal (Company-Facing)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/13)
🔲 **#14** [Phase 3: Candidate Portal v2.1](https://github.com/kevinhongfr-star/lyc-intelligence/issues/14)

---

## Phase 4 — Polish

🔲 **#16** [Phase 4: Performance, Accessibility & Polish](https://github.com/kevinhongfr-star/lyc-intelligence/issues/16)

---

## Summary

**Total Issues:** 16
- Phase 1 (Foundation): 7 issues
- Phase 2 (Core Portals): 6 issues
- Phase 3 (Extended): 2 issues
- Phase 4 (Polish): 1 issue

**Status:** 1 complete (UX Design System), 15 remaining

---

## Build Order for Trae

### Phase 1 (P0 — Foundation)
1. Database Migration → 2. Auth & RBAC → 3. RLS Policies → 4. Edge Functions → 5. UX System ✅ → 6. Stripe → 7. Credits

### Phase 2 (P1 — Core Portals)
8. Intelligence Layer → 9. Council Public + DEX AI → 10. Council Member Dashboard → 11. Council Admin → 12. Internal Portal → 15. Notifications

### Phase 3 (P2 — Extended)
13. Client Portal → 14. Candidate Portal

### Phase 4 (Polish)
16. Performance, Accessibility & Polish

---

## Quick Links

- **All Issues:** https://github.com/kevinhongfr-star/lyc-intelligence/issues
- **Specs:** https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/specs/v2
- **Spec Index:** https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/specs_index.md

---

*Generated: 2026-07-16 11:00*

