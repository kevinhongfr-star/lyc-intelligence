# LYC Intelligence — Phase 1 Tickets (P0)

**Version:** 1.0
**Date:** 2026-07-10
**Scope:** 26 features | 170-210h | Weeks 1-5
**Dependencies:** T1 → T2/T3/T6 → T4 → T5

---

## T1 — Schema & Data Layer

**Estimate:** 40-50h
**Dependencies:** None (start here)
**Blocks:** T2, T3, T4, T5, T6

### Scope

8 core Supabase tables, 30+ REST API endpoints, Feishu sync, data normalization, validation rules, filter engine, activity log.

### 1.1 Supabase Schema (8 Tables)

#### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  headquarters TEXT,
  employee_count_range TEXT,
  revenue_range TEXT,
  client_since DATE,
  account_manager_id UUID REFERENCES consultants(id),
  fee_config_id UUID REFERENCES fee_configs(id),
  payment_terms TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('active','paused','prospect','churned')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### mandates
```sql
CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  position_title TEXT NOT NULL CHECK (char_length(position_title) BETWEEN 3 AND 200),
  location TEXT,
  reports_to TEXT,
  salary_range_min NUMERIC CHECK (salary_range_min > 0),
  salary_range_max NUMERIC CHECK (salary_range_max > 0),
  salary_currency TEXT DEFAULT 'RMB' CHECK (salary_currency IN ('RMB','USD','HKD','EUR','MYR','SGD')),
  fee_percentage NUMERIC CHECK (fee_percentage BETWEEN 0 AND 50),
  fee_fixed_amount NUMERIC,
  fee_config TEXT,
  payment_terms_override TEXT,
  consultant_id UUID REFERENCES consultants(id),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started','kick_off','sourcing','screening','shortlist',
    'interview','offer','onboarded','closed_won','closed_lost','on_hold'
  )),
  priority_tier TEXT DEFAULT 'pending' CHECK (priority_tier IN ('tier1_closing','tier2_active','tier3_hold','pending')),
  jd_text TEXT,
  target_companies TEXT[],
  target_start_date DATE,
  deadline DATE,
  difficulty_score SMALLINT CHECK (difficulty_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT salary_range CHECK (salary_range_min IS NULL OR salary_range_max IS NULL OR salary_range_min < salary_range_max)
);
```

#### candidates
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 2 AND 100),
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  wechat TEXT,
  linkedin_url TEXT,
  current_company TEXT,
  current_title TEXT,
  years_experience NUMERIC,
  education JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  salary_current NUMERIC,
  salary_expected NUMERIC,
  location_preference TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new','contacted','screening','interview_prep','interviewing',
    'offered','accepted','rejected','withdrawn','ghosted'
  )),
  source TEXT CHECK (source IN ('hunt','referral','platform','inbound','network')),
  cv_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_email UNIQUE (email)
);
```

#### mandate_candidates (junction / pipeline)
```sql
CREATE TABLE mandate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'submitted' CHECK (stage IN (
    'submitted','screening','first_interview','second_interview',
    'final_interview','offer_pending','offer_accepted','rejected','withdrawn'
  )),
  match_score NUMERIC CHECK (match_score BETWEEN 0 AND 100),
  submitted_date DATE DEFAULT CURRENT_DATE,
  last_activity_date DATE,
  days_in_stage INTEGER DEFAULT 0,
  consultant_notes TEXT,
  client_feedback TEXT,
  interview_date TIMESTAMPTZ,
  offer_amount NUMERIC,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_mandate_candidate UNIQUE (mandate_id, candidate_id)
);
```

#### consultants
```sql
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('consultant','senior_consultant','manager','director')),
  email TEXT NOT NULL UNIQUE,
  feishu_id TEXT,
  max_capacity NUMERIC NOT NULL DEFAULT 8,
  current_load NUMERIC DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  active_mandate_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','overloaded','on_leave','inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### five_metrics (weekly KPI snapshot)
```sql
CREATE TABLE five_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  new_candidates_added INTEGER DEFAULT 0,
  cv_submitted INTEGER DEFAULT 0,
  interviews_scheduled INTEGER DEFAULT 0,
  offers_extended INTEGER DEFAULT 0,
  placements INTEGER DEFAULT 0,
  revenue_recognized NUMERIC DEFAULT 0,
  active_mandates INTEGER DEFAULT 0,
  pipeline_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_week_consultant UNIQUE (week_start_date, consultant_id)
);
```

#### activity_logs
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mandate','candidate','mandate_candidate','organization','consultant')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created','updated','status_change','note_added','interview_scheduled',
    'offer_extended','feedback_received','file_uploaded','email_sent',
    'call_logged','meeting_held','tier_changed','fee_updated'
  )),
  actor_id UUID REFERENCES consultants(id),
  from_value TEXT,
  to_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
```

#### dashboard_snapshots
```sql
CREATE TABLE dashboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual','scheduled','trigger')),
  total_mandates INTEGER DEFAULT 0,
  by_tier JSONB DEFAULT '{}',
  by_status JSONB DEFAULT '{}',
  by_consultant JSONB DEFAULT '{}',
  revenue_pipeline JSONB DEFAULT '{}',
  auto_flags JSONB DEFAULT '[]',
  health_score NUMERIC,
  changes_from_previous JSONB DEFAULT '{}',
  raw_data_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### fee_configs
```sql
CREATE TABLE fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage','fixed','percentage_with_minimum')),
  percentage NUMERIC CHECK (percentage BETWEEN 0 AND 50),
  fixed_amount NUMERIC,
  minimum_amount NUMERIC,
  split_enabled BOOLEAN DEFAULT false,
  lyc_share NUMERIC,
  partner_share NUMERIC,
  payment_terms TEXT,
  payment_schedule JSONB,
  fee_currency TEXT DEFAULT 'RMB',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### auto_flags
```sql
CREATE TABLE auto_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'GHOST','ZOMBIE','AT_RISK','DEADLINE_OVERDUE','STALE_PIPELINE',
    'ZERO_PIPELINE','CAPACITY_OVERFLOW','PRIORITY_DRIFT',
    'CLIENT_GHOST','DUPLICATE_EFFORT','NEW_ACTIVITY','APPROACHING_TARGET'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mandate','candidate','consultant','system')),
  entity_id UUID NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected','notified','acknowledged','resolved','escalated')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES consultants(id),
  resolved_by UUID REFERENCES consultants(id)
);
CREATE INDEX idx_flags_active ON auto_flags(status) WHERE status NOT IN ('resolved');
```

### 1.2 API Endpoints

All endpoints under `/api/v1/`. Auth via Supabase JWT.

| Method | Path | Purpose |
|--------|------|---------|
| **Organizations** |||
| POST | /organizations | Create |
| GET | /organizations | List (paginated, filterable) |
| GET | /organizations/:id | Detail + mandates |
| PUT | /organizations/:id | Update |
| DELETE | /organizations/:id | Soft delete |
| **Mandates** |||
| POST | /mandates | Create (triggers priority_tier auto-assign) |
| GET | /mandates | List (filterable, paginated) |
| GET | /mandates/:id | Detail + full pipeline |
| PUT | /mandates/:id | Update |
| DELETE | /mandates/:id | Soft delete |
| POST | /mandates/:id/status | Status transition (validated against matrix) |
| GET | /mandates/:id/candidates | Pipeline view |
| POST | /mandates/:id/assign | Assign/reassign consultant |
| GET | /mandates/:id/fee-calculation | Fee breakdown |
| **Candidates** |||
| POST | /candidates | Create (dedup check) |
| GET | /candidates | List (filterable) |
| GET | /candidates/:id | Detail |
| PUT | /candidates/:id | Update |
| POST | /candidates/:id/cv | Upload CV |
| POST | /candidates/dedup-check | Check duplicates |
| **MandateCandidates** |||
| POST | /mandates/:mid/candidates/:cid | Add to pipeline |
| PUT | /mandates/:mid/candidates/:cid | Update stage |
| DELETE | /mandates/:mid/candidates/:cid | Remove |
| POST | /mandates/:mid/candidates/:cid/feedback | Log feedback |
| POST | /mandates/:mid/candidates/:cid/interview | Schedule |
| **Consultants** |||
| GET | /consultants | List |
| GET | /consultants/:id | Detail + load metrics |
| GET | /consultants/:id/capacity | Load vs max |
| GET | /consultants/:id/five-metrics | KPI history |
| **Five Metrics** |||
| POST | /five-metrics | Record weekly |
| GET | /five-metrics | Query by consultant/date |
| **Dashboard** |||
| POST | /dashboard/snapshot | Generate |
| GET | /dashboard/snapshot/:date | Get snapshot |
| GET | /dashboard/live | Live data |
| **Activities** |||
| GET | /activities | Query (entity/action filters) |
| POST | /activities | Log |
| **Flags** |||
| GET | /flags | Active flags |
| POST | /flags/:id/acknowledge | Acknowledge |
| POST | /flags/:id/resolve | Resolve |

### 1.3 Filter Engine

Support operators: `eq`, `neq`, `in`, `not_in`, `gt`, `gte`, `lt`, `lte`, `between`, `contains`, `starts_with`, `is_null`, `is_not_null`, `and`, `or`, `not`.

Query params pattern: `?filter[field][op]=value&sort=field:asc&page=1&page_size=50`

### 1.4 Feishu Sync (Phase 1 scope)

- **Feishu Tracker (Spreadsheet):** Webhook on cell change → upsert to mandates/candidates
- **Feishu Group Chats:** Stream events → parse activity mentions → activity_logs
- **Feishu Calendar:** Event webhook → interview_scheduled entries
- Sync orchestrator: Event bus → Validator → Dedup → Write → Activity Log → Cache invalidate

### 1.5 Acceptance Criteria

- [ ] All 10 tables created in Supabase with constraints
- [ ] All 30+ API endpoints returning correct responses
- [ ] Filter engine supports all operators
- [ ] Feishu sync working for Tracker + Chat + Calendar
- [ ] Activity log auto-created on every mutation
- [ ] Dedup check working (email + phone + name composite)
- [ ] Soft delete on organizations/mandates (never hard delete)
- [ ] All API responses paginated (default 50, max 200)
- [ ] RLS policies for role-based access (consultant/senior/manager/director)

### 1.6 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Create mandate without consultant | No consultant_id | 400 error (rule M-01) |
| Salary min > max | min=1M, max=500K | 400 error (constraint) |
| Duplicate candidate email | Same email twice | 409 conflict |
| Status transition skip | sourcing → offer | 400 error (invalid transition) |
| Filter: status=sourcing | 10 mandates, 3 sourcing | Returns 3 |
| Feishu tracker update | Cell change in tracker | Mandate updated within 5s |

---

## T2 — Business Rules Engine

**Estimate:** 32-40h
**Dependencies:** T1
**Blocks:** T4, T5

### Scope

Fee calculation engine (6 configs), 42+ business rules, status transition matrix, priority tier auto-classification, team capacity model, assignment recommendation, revenue recognition.

### 2.1 Fee Engine

#### 2.1.1 Config Seeder
```sql
INSERT INTO fee_configs (name, client_name, fee_type, percentage, minimum_amount, split_enabled, lyc_share, partner_share, payment_terms, payment_schedule) VALUES
('Standard LYC', 'Default', 'percentage', 20, NULL, false, 1.0, 0, 'net_30', '[{"amount_pct":1.0,"offset_days":30}]'),
('EAS Asia', 'EAS Asia', 'percentage', 22, NULL, false, 1.0, 0, '70_30_eas', '[{"amount_pct":0.7,"offset_days":0},{"amount_pct":0.3,"offset_days":90}]'),
('Hartalega', 'Hartalega', 'percentage_with_minimum', 20, 10000, false, 1.0, 0, 'net_30', '[{"amount_pct":1.0,"offset_days":30}]'),
('CTC', 'CTC', 'fixed', NULL, 70000, false, 1.0, 0, 'net_30', '[{"amount_pct":1.0,"offset_days":30}]'),
('CP Axtra', 'CP Axtra', 'percentage', 20, NULL, false, 1.0, 0, 'cp_axtra_delayed', '[{"amount_pct":1.0,"offset_days":105}]'),
('French Home', 'French Home', 'percentage', 20, NULL, true, 0.5, 0.5, '50_50_split', '[{"amount_pct":0.5,"offset_days":30}]');
```

#### 2.1.2 Fee Calculation Endpoint
`GET /mandates/:id/fee-calculation?candidate_id=xxx`

Returns:
```json
{
  "gross_fee": 200000,
  "lyc_net": 200000,
  "partner_share": 0,
  "payment_schedule": [
    {"amount": 200000, "trigger": "candidate_start_date", "due_offset_days": 30, "due_date": "2026-09-15"}
  ],
  "breakdown": {
    "annual_salary": 1000000,
    "fee_percentage": 20,
    "minimum_applied": false,
    "split_applied": false
  }
}
```

### 2.2 Business Rules Engine

Rules implemented as middleware on API endpoints. Each rule has:
- `id` (e.g., M-01, C-01, P-01, CON-01)
- `trigger` (create, update, status_change, daily_check)
- `action` (block, warn, auto-assign, auto-flag)
- `override_role` (minimum role needed to bypass)

#### Implementation Pattern
```typescript
interface BusinessRule {
  id: string;
  name: string;
  category: 'mandate' | 'candidate' | 'pipeline' | 'consultant';
  trigger: string[];
  evaluate(context: RuleContext): RuleResult;
}

interface RuleResult {
  passed: boolean;
  action: 'pass' | 'block' | 'warn';
  message?: string;
  override_role?: string;
}
```

#### Rule Categories (42 total)
- **A: Mandate Rules (15):** M-01 through M-15
- **B: Candidate Rules (12):** C-01 through C-12
- **C: Pipeline Rules (8):** P-01 through P-08
- **D: Consultant Rules (7):** CON-01 through CON-07

Full rule definitions in Alessio M2 spec.

### 2.3 Status Transition Matrix

Implemented as a lookup table:
```typescript
const VALID_TRANSITIONS: Record<string, {to: string, conditions?: string[]}[]> = {
  'not_started': [{to: 'kick_off', conditions: ['consultant_assigned']}],
  'kick_off': [{to: 'sourcing', conditions: ['jd_provided']}, {to: 'on_hold', conditions: ['reason_provided']}],
  'sourcing': [{to: 'screening', conditions: ['min_1_candidate_submitted']}, {to: 'on_hold'}],
  'screening': [{to: 'shortlist', conditions: ['feedback_received', 'min_1_shortlisted']}, {to: 'on_hold'}],
  'shortlist': [{to: 'interview', conditions: ['min_1_interview_scheduled']}, {to: 'on_hold'}],
  'interview': [{to: 'offer', conditions: ['offer_extended']}, {to: 'on_hold'}],
  'offer': [{to: 'onboarded', conditions: ['candidate_accepted']}, {to: 'closed_lost'}],
  'onboarded': [{to: 'closed_won', conditions: ['probation_passed']}],
  'on_hold': [{to: 'kick_off'}, {to: 'sourcing'}, {to: 'closed_lost'}],
};
```

### 2.4 Priority Tier Auto-Classifier

Called on mandate create and status change:
- Stage score: offer=100, interview=70, shortlist=50, screening=30, sourcing=15, kickoff=10
- Revenue: ≥200K=+30, ≥100K=+20, ≥50K=+10
- Deadline urgency: ≤7d=+25, ≤14d=+15, ≤30d=+5
- Client importance: strategic=+15, key=+10
- Score ≥70 → tier1_closing, ≥30 → tier2_active, else tier3_hold

### 2.5 Team Capacity Model

Weighted load = Σ(stage_weight × difficulty_weight) per mandate.
- Stage weights: offer=2.0, interview=1.8, shortlist=1.5, screening=1.3, sourcing=1.0, kickoff=0.5
- Difficulty weight = difficulty_score / 3.0
- Status: overloaded (≥100%), at_capacity (≥90%), active (<90%)

Default max capacity by role: Consultant=8/12w, Senior=10/15w, Manager=6/10w, Director=4/8w.

### 2.6 Revenue Recognition

| Event | Recognizable % |
|-------|---------------|
| Offer accepted | 0% |
| Candidate starts | 70% |
| Probation passed | 100% |
| Invoice sent | 100% |
| Payment received | 100% |

### 2.7 Acceptance Criteria

- [ ] Fee engine calculates correctly for all 6 configs
- [ ] Multi-currency conversion (RMB/USD/HKD/EUR/MYR/SGD)
- [ ] All 42 rules evaluate correctly (block vs warn behavior)
- [ ] Status transitions blocked when invalid
- [ ] Priority tier auto-assigned on create/status change
- [ ] Team capacity calculated correctly (weighted)
- [ ] Assignment recommendation returns top 3 candidates
- [ ] Revenue recognition follows stage-based probability
- [ ] Rule violations logged even when overridden

### 2.8 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Fee: Hartalega, 400K salary | 20% w/ min 10K USD | 71,500 RMB minimum applied |
| Fee: French Home, 1M salary | 20% w/ 50/50 split | LYC net = 100K |
| Rule M-05 | 3 mandates at same org | Block, require approval |
| Rule C-03 | Re-add rejected candidate <90d | Block (cooldown) |
| Rule P-02 | 6 candidates in first_interview | Warn |
| Priority tier | offer stage, 250K fee, 5d deadline | tier1_closing (score 160) |
| Capacity | Director with 5 mandates at 2.0 weight | Overloaded |

---

## T3 — Sourcing Engine

**Estimate:** 32-40h
**Dependencies:** T1
**Blocks:** T5

### Scope

CSV upload + format auto-detection, data normalization, 4-dimension scoring engine, auto-tiering (T1/T2/T3/Excluded), manual override UI, outreach detection, cross-project dedup.

### 3.1 CSV Ingestion Pipeline

#### 3.1.1 Format Fingerprints

| Source | Distinctive Columns | Column Count | Encoding |
|--------|-------------------|-------------|----------|
| Lightyear | full_name, headline, third_party_email_1, connected_at | 180-200 | latin-1 or UTF-8 |
| Sales Navigator | First Name, Last Name, Linkedin Profile URL | 25-40 | UTF-8 |
| LinkedIn Recruiter | First Name, Title, Connected On | 40-60 | UTF-8 BOM |
| Manual/Custom | User-mapped | any | any |

Auto-detect: match count / fingerprint size. >80% = auto-accept. 50-80% = suggest. <50% = manual mapping.

#### 3.1.2 Normalized Schema

All ingested profiles map to:
- profile_id (UUID), project_id (FK), first_name, last_name, headline, current_company, current_title
- location_city, location_country, linkedin_url
- email_primary, email_secondary, email_tertiary
- connected_at, outreach_status (Connected/Replied/Interested/No Response)
- raw_data (JSON), source_format, ingested_at

#### 3.1.3 Ingestion Flow
```
Upload → Auto-detect format → Detect encoding → Parse (error-tolerant)
→ Dedup (email + LinkedIn URL + name+company) → Normalize (locations, companies)
→ Validate (name + ≥1 of: company/title/location) → Report summary
```

### 3.2 Scoring Engine (4 Dimensions)

#### 3.2.1 Model Structure
```json
{
  "model_id": "uuid",
  "name": "GM Retail Luxury APAC",
  "dimensions": [
    {
      "name": "Location",
      "weight": 0.20,
      "max_score": 10,
      "config": { "tier_mapping": { "tier_1": ["HK", "SG"], "tier_2": ["Shanghai", "Tokyo"] } }
    },
    {
      "name": "Company",
      "weight": 0.25,
      "max_score": 10,
      "config": { "tier_mapping": { "tier_1": ["LVMH", "Chanel"], "tier_2": ["PVH", "Prada"] } }
    },
    {
      "name": "Title",
      "weight": 0.30,
      "max_score": 10,
      "config": { "seniority_mapping": { "C-suite": 10, "VP/SVP": 9, "Director": 7, "Sr Manager": 5, "Manager": 3 } }
    },
    {
      "name": "Keywords",
      "weight": 0.25,
      "max_score": 12,
      "config": { "keyword_banks": [{"name":"Core","keywords":["luxury","retail"],"max_points":4}] }
    }
  ]
}
```

#### 3.2.2 Scoring Output
Each profile gets:
- Per-dimension score (0 to max_score)
- Weighted score per dimension (score × weight)
- Total score (sum of weighted scores)
- Normalized score (0-100)
- Tier: T1 (top 20%), T2 (20-50%), T3 (50-80%), Excluded (bottom 20% or hard filters)
- Breakdown showing exactly why each score was given

### 3.3 Auto-Tiering
- **T1 (Target):** Top 20% by total score
- **T2 (Potential):** 20-50%
- **T3 (Possible):** 50-80%
- **Excluded:** Bottom 20% or fails hard filters

### 3.4 Manual Override
Per-profile UI: accept / reject / reclassify (move to different tier). All overrides logged.

### 3.5 Outreach Detection
Parse LinkedIn message exports:
- Match by name/email/linkedin_url
- Extract: Connected, Replied, Interested, No Response
- Update outreach_status on profiles

### 3.6 Cross-Project Dedup
When a new CSV is ingested, check each profile against all previous projects:
- Match on: email (exact), LinkedIn URL (normalized), name+company composite
- Flag duplicates with: source project, date ingested, current status

### 3.7 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /sweep/upload | Upload CSV for a mandate |
| GET | /sweep/:mandate_id/profiles | List ingested profiles |
| POST | /sweep/:mandate_id/score | Run scoring with model |
| GET | /sweep/:mandate_id/results | Scored results with tiers |
| PUT | /sweep/:mandate_id/profiles/:id/override | Manual override |
| GET | /sweep/:mandate_id/dedup | Cross-project dedup report |
| POST | /sweep/models | Create scoring model |
| GET | /sweep/models | List models |
| PUT | /sweep/models/:id | Update model |
| POST | /sweep/:mandate_id/outreach | Parse outreach data |

### 3.8 Acceptance Criteria

- [ ] CSV upload auto-detects format (Lightyear/SalesNav/Recruiter)
- [ ] Encoding detection (latin-1, UTF-8, BOM)
- [ ] Dedup removes duplicates on ingest
- [ ] Scoring produces transparent breakdown per profile
- [ ] Auto-tiering splits T1/T2/T3/Excluded correctly
- [ ] Manual override logs actor + reason
- [ ] Cross-project dedup finds matches across mandates
- [ ] Outreach status parsed from LinkedIn message exports
- [ ] Scoring models saved and reusable

### 3.9 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Upload Lightyear CSV (191 cols) | 1,825 rows | Auto-detect Lightyear, parse all |
| Upload with latin-1 encoding | Special chars | No data loss |
| Duplicate emails | 10 dupes | Removed, report shows "10 duplicates removed" |
| Score 500 profiles | GM Luxury model | T1=~100, T2=~150, T3=~150, Excl=~100 |
| Cross-project dedup | Same candidate in 2 projects | Flagged with source project |
| Outreach parse | LinkedIn msg export | Connected/Replied/Interested matched |

---

## T4 — Intelligence Engine

**Estimate:** 26-34h
**Dependencies:** T1, T2
**Blocks:** T5

### Scope

12 auto-flags, priority stack enforcement, pipeline velocity/health score, team load balancer, revenue forecast (3 scenarios), change detection, 5-metric aggregator.

### 4.1 Auto-Flag System

12 flag types running daily at 08:00 HKT + on data change:

| Flag | Trigger | Severity | Auto-Action |
|------|---------|----------|-------------|
| GHOST | Candidate no activity >14d | Medium | Remind consultant |
| ZOMBIE | Mandate no activity >21d | High | Escalate to manager |
| AT_RISK | Health score <40 | High | Daily attention list |
| DEADLINE_OVERDUE | deadline < today | Critical | Immediate escalation |
| STALE_PIPELINE | No new candidates >14d | Medium | Suggest sourcing boost |
| ZERO_PIPELINE | 0 candidates after 14d from kick_off | High | Reassignment review |
| CAPACITY_OVERFLOW | Consultant load >100% | High | Trigger rebalancing |
| PRIORITY_DRIFT | Tier changed unexpectedly | Medium | Notify Kevin |
| CLIENT_GHOST | No feedback >10d after submission | Medium | Draft follow-up |
| DUPLICATE_EFFORT | Same candidate, similar roles, different consultants | Low | Consolidation suggestion |
| NEW_ACTIVITY | ≥3 activities in 24h | Info | Log for velocity |
| APPROACHING_TARGET | Revenue ≥90% of monthly target | Info | Celebrate/push |

Flag lifecycle: DETECTED → NOTIFIED → ACKNOWLEDGED → RESOLVED (or ESCALATED after 7d no action).

### 4.2 Pipeline Health Score

Formula: 100 - activity_penalty(0-25) - direction_penalty(0-20) - speed_penalty(0-20) + pipeline_bonus(0-15) - time_penalty(0-20)

| Range | Label | Color |
|-------|-------|-------|
| 80-100 | Excellent | Green |
| 60-79 | Good | Yellow |
| 40-59 | At Risk | Orange |
| 0-39 | Critical | Red |

### 4.3 Revenue Forecast

Three scenarios per mandate:
- Conservative: stage_probability × fee × 0.6
- Expected: stage_probability × fee × 1.0
- Optimistic: stage_probability × fee × 1.3

Stage probabilities: offer=85%, interview=45%, shortlist=25%, screening=12%, sourcing=5%, kick_off=2%

Monthly rollup with confidence level.

### 4.4 Change Detection

Compare dashboard snapshots (day-over-day or week-over-week):
- Mandate additions/removals/status changes/tier changes
- Revenue delta
- New flags
- Generate human-readable narrative

### 4.5 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /flags/active | All active flags |
| POST | /flags/evaluate | Trigger evaluation |
| POST | /flags/:id/acknowledge | Acknowledge |
| POST | /flags/:id/resolve | Resolve |
| GET | /mandates/:id/health | Health score |
| GET | /mandates/:id/velocity | Stage conversion rates |
| GET | /revenue/forecast | 3-scenario forecast |
| GET | /dashboard/changes | Change narrative |
| GET | /team/load-balance | Rebalancing recommendations |
| GET | /consultants/:id/five-metrics | Weekly KPIs |

### 4.6 Acceptance Criteria

- [ ] All 12 flags evaluate correctly
- [ ] Flag lifecycle transitions work (acknowledge, escalate, resolve)
- [ ] Health score formula produces correct 0-100 range
- [ ] Revenue forecast generates 3 scenarios with monthly rollup
- [ ] Change detection narrative is human-readable
- [ ] Load balancer identifies imbalances and suggests moves
- [ ] 5-metric aggregator auto-calculates weekly

### 4.7 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Zombie flag | Mandate, last activity 25 days ago | ZOMBIE flag created, severity=high |
| Health: excellent | 3 candidates, active 2d ago, 60d to deadline | Score 85+ |
| Health: critical | 0 candidates, 40d no activity, overdue deadline | Score <40 |
| Revenue: offer stage | 1M salary, 20% fee, offer stage | Expected: 170K (85% × 200K) |
| Load balance | 1 overloaded, 1 underloaded consultant | Recommendation generated |

---

## T5 — Output & Deliverables

**Estimate:** 28-36h
**Dependencies:** T2, T3, T4
**Blocks:** None (terminal ticket)

### Scope

Excel deliverable generation (template engine, filter engine, statistics), dashboard generator (daily auto), report templates, scheduling engine, snapshot engine, distribution router.

### 5.1 Excel Deliverable Engine

#### 5.1.1 Template Registry
Templates define: sheets, columns, styling, branding, language, sort order.
System templates: Standard English, French Format, Speaker Shortlist, Internal Scoring.

#### 5.1.2 Filter Engine
Pre-set filters: T1 only, T1+T2, exclude rejected, custom conditions.
Applied before rendering to select which profiles appear.

#### 5.1.3 Statistics Sheet
Auto-generated: total profiles, active rate, sector breakdown, seniority breakdown, geography breakdown — with counts and percentages.

#### 5.1.4 Render Output
- Excel (.xlsx): multi-sheet (Cover + Statistics + Data), branded headers, frozen rows, alternating colors
- PDF (P1): branded report with charts

### 5.2 Dashboard Generator

Daily auto-generated dashboard following the current NEXUS production format:
- Won & Closing section
- Active Pipeline (Tier 2)
- On Hold / Pending (Tier 3)
- Team Load table
- Auto-Flags section
- Revenue Forecast (3 scenarios)
- Week-over-Week Changes (narrative)
- Priority Stack (Kevin's directive)

Output formats: Markdown (Feishu card), PDF, HTML.

### 5.3 Scheduling & Distribution

- Daily dashboard: auto-generate at 08:00 HKT
- Weekly revenue forecast: Monday 09:00 HKT
- Weekly 5-metrics: Friday EOD
- Distribution router: Feishu group (by portal), email (to Kevin)
- Snapshot engine: daily capture with retention policy (90 days)

### 5.4 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /deliverables/generate | Generate Excel/PDF |
| GET | /deliverables/:id/download | Download file |
| GET | /templates | List templates |
| POST | /templates | Create template |
| PUT | /templates/:id | Update template |
| GET | /dashboard/today | Today's dashboard |
| POST | /dashboard/generate | Force generate |
| GET | /reports | List reports |
| POST | /reports/schedule | Schedule report |

### 5.5 Acceptance Criteria

- [ ] Excel generation from scored profiles in <15 seconds
- [ ] All 4 system templates render correctly
- [ ] Statistics sheet auto-computed
- [ ] Filter engine controls which profiles appear
- [ ] Dashboard auto-generates daily at 08:00 HKT
- [ ] Dashboard follows exact production format
- [ ] Distribution to Feishu groups works
- [ ] Snapshot captures and retains 90 days
- [ ] PDF deliverable (basic, charts P2)

### 5.6 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Generate Excel (500 profiles, Standard template) | T1+T2 filter | ~350 rows, 3 sheets, <15s |
| Statistics sheet | 500 profiles, 5 sectors | Correct counts + percentages |
| Daily dashboard | 20 active mandates | All sections populated |
| Distribution | Dashboard → Feishu group | Message received in group |

---

## T6 — DEX AI Core (AI Infrastructure)

**Estimate:** 16-22h
**Dependencies:** T1
**Blocks:** T5 (AI-powered features)

### Scope

LLM router (Flash/Pro), prompt registry (versioned), QA pipeline (output validation), cost management (budget enforcement), JD Generator, Shortlist Generator.

### 6.1 LLM Router

```typescript
interface LLMRouter {
  route(task: AITask): LLMProvider;
}

type LLMProvider = 
  | 'deepseek_flash'   // fast, cheap — classification, extraction, simple generation
  | 'deepseek_pro';    // slow, expensive — complex reasoning, long generation, analysis

const TASK_ROUTING: Record<AITaskType, LLMProvider> = {
  'jd_generation': 'deepseek_pro',
  'shortlist_generation': 'deepseek_pro',
  'status_classification': 'deepseek_flash',
  'entity_extraction': 'deepseek_flash',
  'narrative_generation': 'deepseek_pro',
  'scoring_suggestion': 'deepseek_pro',
  'flag_description': 'deepseek_flash',
  'meeting_parsing': 'deepseek_pro',
  'data_normalization': 'deepseek_flash',
};
```

Configuration:
- DeepSeek API endpoint: `https://api.deepseek.com/v1/chat/completions`
- API key stored in Supabase vault
- Fallback: if Pro fails → retry Flash with simpler prompt
- Timeout: Flash 10s, Pro 30s

### 6.2 Prompt Registry

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  task_type TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  model_preference TEXT DEFAULT 'deepseek_pro',
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, version)
);
```

Features:
- Version control on prompts (never overwrite, always increment)
- Variables injected at runtime ({{mandate_title}}, {{org_name}}, etc.)
- Active/inactive toggle
- Audit log of prompt changes

### 6.3 QA Pipeline

Post-LLM output validation:
1. **Format check:** Is output valid JSON/Markdown/text as expected?
2. **Completeness:** Are all required sections present?
3. **Hallucination guard:** Do entities mentioned exist in our data?
4. **Length check:** Is output within expected bounds?
5. **Toxicity/safety:** Basic content filter

Failed QA → retry with adjusted prompt (max 2 retries) → fallback to template-based output.

### 6.4 Cost Management

- Daily budget cap (configurable, default ¥50/day)
- Per-request cost tracking (token count × price)
- Alert at 80% of daily budget
- Hard stop at 100%
- Weekly/monthly cost reports

### 6.5 JD Generator

**P0 Feature.** Input: mandate details + org context + market benchmarks.
Output: Formatted JD in Markdown + Word/PDF.
Template options: Corporate, Startup, Executive Search.
Quality gate: Consultant reviews before sending to client.

### 6.6 Shortlist Generator

**P0 Feature.** Input: mandate requirements + scored candidate pool.
Output: Ranked shortlist (top 5-10) with match scores and per-candidate rationale.
Features: Auto-filter by hard requirements, rank by soft fit.

### 6.7 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /ai/generate/jd | Generate JD |
| POST | /ai/generate/shortlist | Generate shortlist |
| GET | /prompts | List prompt templates |
| POST | /prompts | Create template |
| PUT | /prompts/:id | Update (creates new version) |
| GET | /ai/costs | Cost summary |
| GET | /ai/costs/daily | Daily breakdown |

### 6.8 Acceptance Criteria

- [ ] LLM router selects correct model per task type
- [ ] Prompt registry stores versions, injects variables
- [ ] QA pipeline catches format errors and retries
- [ ] Cost tracking per request, daily cap enforced
- [ ] JD Generator produces professional output (3 templates)
- [ ] Shortlist Generator produces ranked list with rationale
- [ ] All AI calls logged (prompt, response, tokens, cost, latency)

### 6.9 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| JD Gen | Mandate: VP Sales, Shanghai, 1.5M | JD with correct title, location, level |
| Shortlist Gen | 50 scored candidates, mandate requirements | Top 5-10 with scores + rationale |
| QA fail | LLM returns invalid JSON | Retry, then fallback |
| Cost cap | Daily budget ¥50, spent ¥45 | Alert at ¥40, stop at ¥50 |
| Prompt version | Edit prompt | New version created, old preserved |

---

## Dependency Graph

```
T1 (Schema & Data)
 ├── T2 (Business Rules) ──┐
 ├── T3 (Sourcing Engine) ─┤
 │                         ├── T4 (Intelligence) ── T5 (Output & Deliverables)
 └── T6 (DEX AI Core) ────┘
```

### Parallel Execution
- **Week 1:** T1 starts. T6 can start LLM router/prompt registry in parallel (only needs T1 for DB tables).
- **Week 2:** T1 completes. T2, T3, T6 start in parallel.
- **Week 3:** T2, T3 complete. T4 starts (needs T1+T2).
- **Week 4:** T4 completes. T5 starts (needs T2+T3+T4).
- **Week 5:** T5 completes. Phase 1 done.

---

## Summary

| Ticket | Scope | Hours | Key Deliverables |
|--------|-------|-------|-----------------|
| T1 | Schema & Data Layer | 40-50h | 10 tables, 30+ APIs, Feishu sync, filter engine |
| T2 | Business Rules Engine | 32-40h | Fee engine (6 configs), 42 rules, status matrix, capacity model |
| T3 | Sourcing Engine | 32-40h | CSV ingestion, scoring (4-dim), auto-tier, dedup, outreach |
| T4 | Intelligence Engine | 26-34h | 12 flags, health score, revenue forecast, change detection |
| T5 | Output & Deliverables | 28-36h | Excel/PDF gen, dashboard, reports, scheduling, distribution |
| T6 | DEX AI Core | 16-22h | LLM router, prompt registry, QA pipeline, JD/Shortlist gen |
| **Total** | **Phase 1** | **174-222h** | **26 features, 10 tables, 50+ APIs, 5 weeks** |
