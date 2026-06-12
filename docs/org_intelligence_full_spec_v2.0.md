# LYC Intelligence — Organizational Intelligence Module
## Full Engineering Specification v2.0

**Status:** Production (deployed 2026-06-12)
**Author:** NEXUS (direct build, Kevin override 2026-06-11)
**Deploy:** Vercel `dpl_BYZ3JUfRMdNmqZqYGC4nRCyzc19A` (commit `c2440b2a`)

---

## 1. Overview

The Organizational Intelligence module enables LYC Partners to map, evaluate, and report on executive talent pools across target companies for active mandates. It provides:

- **Talent Pool Management** — Import and manage individuals at target companies (CSV upload + manual entry)
- **5-Criteria Scoring** — Automated LLM-based evaluation against a fixed rubric framework
- **Evaluation Tracking** — View, review, and override scoring outcomes
- **GRID PDF Reports** — Generate client-ready talent map reports

**Access:** Admin-only (profiles.role === 'admin')
**Launch Mandate:** Codelco China (Copper & Mining, state-owned, China market entry)

---

## 2. Database Schema (Supabase)

**Migration:** `supabase/migrations/20260611_create_org_intelligence_tables.sql`
**Tables:** 10 total (9 module tables + 1 audit log)
**Execution:** Run via Supabase Dashboard → SQL Editor (Kevin's task, service role key cannot run DDL)

### 2.1 Core Tables

#### `target_companies` — Target companies for a mandate
```sql
id UUID PK, mandate_id UUID FK, name TEXT NOT NULL, sector TEXT, country TEXT,
hq_city TEXT, status TEXT ('active'|'archived'|'rejected'), is_comparator BOOLEAN,
source TEXT ('csv_upload'|'manual'|'auto_pulled'), metadata JSONB, created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ, archived_at TIMESTAMPTZ
UNIQUE(mandate_id, name)
```

#### `org_snapshots` — Org tree JSON per company
```sql
id UUID PK, target_company_id UUID FK, snapshot_date DATE, structure_json JSONB,
headcount_total INTEGER, source TEXT ('manual'|'auto_pulled'|'csv_upload'),
created_by UUID FK, created_at TIMESTAMPTZ
```

#### `org_talent_pools` — Individuals at each company
```sql
id UUID PK, target_company_id UUID FK, name TEXT NOT NULL, title TEXT, bu TEXT,
level INTEGER (1-10), manager_id UUID FK (self-ref), location TEXT, linkedin_url TEXT,
email TEXT, tenure_years NUMERIC(4,1), attributes JSONB, status TEXT ('active'|'archived'|'placed'|'declined'),
is_leadership BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, archived_at TIMESTAMPTZ
```

#### `org_evaluations` — CV/interview eval records
```sql
id UUID PK, talent_id UUID FK, eval_type TEXT ('cv'|'interview'|'reference'|'work_sample'),
eval_date DATE, evaluator_id UUID FK, overall_score NUMERIC(5,2) (0-100), scorecard JSONB,
notes TEXT, is_final BOOLEAN, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
```

#### `org_evaluation_scores` — 5-criteria granular scores (supports override trail)
```sql
id UUID PK, evaluation_id UUID FK, criterion_key TEXT NOT NULL, criterion_label TEXT NOT NULL,
score NUMERIC(5,2) (0-100), source TEXT ('auto_pulled'|'lyc_override'|'consensus'),
rationale TEXT, confidence NUMERIC(3,2) (0-1), overridden_by UUID FK, overridden_at TIMESTAMPTZ,
created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
UNIQUE(evaluation_id, criterion_key)
```

#### `sourcing_channels` — LinkedIn/Liepin/Zhilian/Zhipin metadata (Phase 2)
```sql
id UUID PK, talent_id UUID FK, channel TEXT NOT NULL, external_id TEXT, profile_url TEXT,
last_pulled TIMESTAMPTZ, data_json JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
UNIQUE(talent_id, channel)
```

#### `org_talent_attachments` — CV file metadata
```sql
id UUID PK, talent_id UUID FK, file_name TEXT NOT NULL, file_url TEXT NOT NULL,
file_size INTEGER, mime_type TEXT, uploaded_by UUID FK, created_at TIMESTAMPTZ
```

#### `one_pagers` — Per-company content (12-slide GRID source)
```sql
id UUID PK, target_company_id UUID FK, content_json JSONB, generated_by UUID FK,
generated_at TIMESTAMPTZ, version INTEGER DEFAULT 1
```

#### `grid_reports` — Generated GRID PDF records
```sql
id UUID PK, target_company_id UUID FK, pdf_url TEXT NOT NULL, slide_count INTEGER,
generated_by UUID FK, generated_at TIMESTAMPTZ
```

#### `org_audit_log` — Append-only audit trail
```sql
id UUID PK, event_type TEXT NOT NULL, actor_id UUID NOT NULL, target_individual_id UUID,
criterion TEXT, llm_score NUMERIC, admin_score NUMERIC, reason TEXT, metadata JSONB,
created_at TIMESTAMPTZ
```

### 2.2 Indexes & RLS

All tables have:
- Row Level Security (RLS) enabled
- Service role full access policy (for API endpoints)
- Admin read/write policies (for frontend queries)
- Triggers on `updated_at` (via `public.set_updated_at()`)

Key indexes:
- `org_talent_pools(target_company_id, status)` — talent list queries
- `org_talent_pools(target_company_id, is_leadership)` — leadership filter
- `org_evaluations(talent_id, is_final)` — finalized evals
- `org_evaluation_scores(evaluation_id)` — scores per eval

---

## 3. API Endpoints

### 3.1 T3 — CSV Upload
**Endpoint:** `POST /api/admin/org-intelligence/companies/upload`
**Auth:** verifyAdmin (JWT + profiles.role === 'admin')
**Max Duration:** 60s

**Request:**
```json
{
  "mandate_id": "uuid",
  "csv_text": "string (CSV content)",
  "dry_run": false
}
```

**CSV Schema:**
```
name,sector,country,hq_city,website,brief_description,is_comparator
Codelco China,Copper & Mining,China,Shanghai,,State-owned mining company,false
BHP Group,Mining,Australia,Melbourne,,Global resources company,true
```

**Response (200):**
```json
{
  "success": true,
  "inserted": 5,
  "skipped": 0,
  "companies": [
    {"id": "uuid", "name": "Codelco China", "status": "inserted"},
    ...
  ],
  "executed_by": "kevin.hong@lyc-partners.ai",
  "executed_at": "2026-06-11T16:00:00Z"
}
```

**Logic:**
1. Parse CSV text into rows
2. For each row: INSERT INTO target_companies ... ON CONFLICT (mandate_id, name) DO NOTHING
3. Return inserted/skipped counts

---

### 3.2 T4 — 5-Criteria Scoring
**Endpoint:** `POST /api/admin/org-intelligence/scoring/compute`
**Auth:** verifyAdmin (admin mode) OR no auth (public mode with `public: true`)
**Max Duration:** 60s

**Admin Mode Request:**
```json
{
  "talent_id": "uuid",
  "mandate_id": "uuid",
  "force": false,
  "override_summary": "optional string"
}
```

**Admin Mode Response:**
```json
{
  "success": true,
  "evaluation_id": "uuid",
  "talent_id": "uuid",
  "mandate_id": "uuid",
  "sub_scores": {
    "C1": 18, "C2": 17, "C3": 19, "C4": 15, "C5": 18
  },
  "composite": 87,
  "tier": "T1_STRONG",
  "tier_label": "Strong Fit",
  "rationale": {
    "C1": "16 years progressive sales leadership...",
    "C2": "Recognized authority at mining conferences...",
    "C3": "Led APAC expansion to $40M ARR...",
    "C4": "Single-track in mining sector...",
    "C5": "Strong fit: state-owned to state-owned..."
  },
  "source_count": 3,
  "sources_truncated": false,
  "total_tokens": 12450,
  "executed_by": "kevin.hong@lyc-partners.ai",
  "executed_at": "2026-06-11T16:30:00Z"
}
```

**Public Mode Request (legacy candidate matching):**
```json
{
  "public": true,
  "jd": "string (job description)",
  "candidates": [
    {"name": "Sarah Chen", "cv": "string (CV text)"},
    {"name": "Alex Tan", "cv": "string"}
  ]
}
```

**Public Mode Response:**
```json
{
  "success": true,
  "results": [
    {
      "candidate_name": "Sarah Chen",
      "composite_score": 87,
      "dimension_scores": {"experience": 88, "skills": 88, "fit": 85},
      "match_reasons": [
        "12 years scaling ops at 3 Series B-C startups...",
        "VP Ops at Stripe APAC...",
        "Strong P&L ownership...",
        "Recognized industry voice...",
        "Stanford MBA and APAC-focused career..."
      ],
      "risk_factors": [
        "No explicit CTO/COO title...",
        "Recent role at Stripe (2018-2023) may have been more mature...",
        "Potential overqualification..."
      ],
      "approach_strategy": "Lead with the opportunity to own full P&L...",
      "sub_scores": {"C1": 18, "C2": 19, "C3": 17, "C4": 15, "C5": 16}
    }
  ],
  "total_tokens": 889,
  "duration_ms": 3538,
  "model": "deepseek-chat"
}
```

**Logic (Admin Mode):**
1. Verify admin auth
2. Fetch talent + mandate from Supabase
3. Build corpus: CV text + LinkedIn URL + recent news (if available)
4. For each criterion (C1-C5):
   - Build prompt with rubric + mandate context + corpus
   - Call DeepSeek API (`deepseek-chat`, temperature 0.1, maxTokens 200)
   - Parse response: extract score (0-20) + rationale
5. Compute composite: `(C1*0.25 + C2*0.20 + C3*0.25 + C4*0.15 + C5*0.15) * 5`
6. Determine tier: 80+ = T1_STRONG, 60-79 = T2_GOOD, 40-59 = T3_POTENTIAL, <40 = T4_NOT_YET
7. INSERT INTO org_evaluations + org_evaluation_scores + org_audit_log
8. Return composite + sub-scores + rationale

**Logic (Public Mode):**
1. Skip auth (public endpoint)
2. For each candidate:
   - Build prompt with JD + CV + 5-criteria rubric
   - Call DeepSeek API (temperature 0.1, maxTokens 600)
   - Parse response: extract 5 sub-scores + composite + match_reasons + risk_factors + approach_strategy
   - Project 5-dim → 3-dim (experience/skills/fit) for legacy UI
3. Return results array

**LLM Call Details:**
- Model: `deepseek-chat` (DeepSeek-V3)
- API: `https://api.deepseek.com/v1/chat/completions`
- Auth: `DEEPSEEK_API_KEY` env var (Kevin must add to Vercel)
- Timeout: 7s per call (AbortController)
- Total: 5 parallel calls (admin) or 1 call per candidate (public)

---

### 3.3 T6 — GRID PDF Generation
**Endpoint:** `POST /api/admin/org-intelligence/grid-reports/generate`
**Auth:** verifyAdmin
**Max Duration:** 60s

**Request:**
```json
{
  "target_company_id": "uuid",
  "title": "optional string"
}
```

**Response:** Binary PDF (Content-Type: application/pdf)

**PDF Structure (5 slides):**
- Slide 1: Company overview (name, sector, country, headcount, status)
- Slide 2: Org structure (BUs, top leadership, key facts)
- Slide 3: Talent pool stats (count by BU, by level, leadership ratio)
- Slide 4: Evaluation outcomes (tier distribution, recent composites)
- Slide 5: Source quality (count of sources, types breakdown, audit summary)

**PDF Specs:**
- Format: A4 (595.28 × 841.89 pt)
- Library: jsPDF (named import: `import { jsPDF } from 'jspdf'`)
- Colors:
  - INK: `#1a1a1a` (body text)
  - MUTED: `#6b6b6b` (labels, footnotes)
  - ACCENT: `#8a6f3a` (section headers)
  - RULE: `#d4d4d4` (dividers)
- Fonts: Helvetica (default, no custom fonts embedded)
- Margins: 48pt all sides
- Footer: `LYC Intelligence · Org Intelligence · {title}` + page X / Y

**Logic:**
1. Verify admin auth
2. Fetch target_company + org_snapshots + org_talent_pools + org_evaluations
3. Build PDF with jsPDF:
   - Draw header (company name + "LYC INTELLIGENCE — ORG INTELLIGENCE")
   - Draw 5 slides (company overview, org structure, talent stats, eval outcomes, source quality)
   - Draw footer (page X / Y)
4. INSERT INTO grid_reports + org_audit_log
5. Return PDF as binary response

---

## 4. Frontend Components (T5)

**Page:** `src/pages/OrgIntelligencePage.tsx` (121 lines)
**Route:** `/platform/org-intel` (admin-only, ProtectedRoute + AdminRoute)

**Components:**
- `CompanySelect.tsx` (97 lines) — Dropdown to select target company
- `TalentPoolTab.tsx` (342 lines) — List + filters + manual entry form
- `EvaluationsTab.tsx` (462 lines) — Score bars + tier badges + eval status
- `ScoringTab.tsx` (280 lines) — Tier distribution + criteria chart + top candidate detail
- `OnePagerTab.tsx` (287 lines) — PDF preview + generate button
- `CSVUploader.tsx` (318 lines) — File upload + parse + preview + submit

### 4.1 Tab Structure

**Tab 1: Talent Pool**
- Company selector (top)
- Filters: BU, level, leadership only
- Table: name, title, BU, level, location, tenure, leadership badge
- Manual entry form (inline expand)
- CSV upload button

**Tab 2: Evaluations**
- Company selector (top)
- Stats row: total evals, avg score, top performer, pending review
- Table: individual, title, overall score (bar + number), tier badge, evaluated date, status
- Click row → expand detail (sub-scores, rationale, override history)

**Tab 3: Scoring Overview**
- Tier distribution cards (4 cards: T1/T2/T3/T4 counts)
- Criteria chart (5 bars, one per criterion, 0-20 scale)
- Top candidate detail card (sub-scores + rationale excerpt)

**Tab 4: One-Pager Report**
- PDF preview (iframe or embed)
- Generate button (calls T6 endpoint)
- Stats: report pages, format, last generated

---

## 5. Brand Requirements

### 5.1 HARD RULE: No Internal Framework References

**Lock:** 2026-06-11 19:13 (Kevin directive)
**Scope:** All client-visible output (UI, PDFs, emails, reports)

**Forbidden terms:**
- TRIDENT (legacy 3D scoring framework)
- LENS (legacy export framework)
- GRID (internal PDF tier name)
- Any reference to internal methodology names

**Replacement strategy:**
- TRIDENT → "5-criteria executive assessment" or "scoring"
- LENS → "report" or "export"
- GRID → "talent map report" or "PDF report"

**Implementation:**
- Frontend: All user-visible strings, tooltips, column headers, badges
- Backend: PDF headers, footers, report titles
- Audit: `grep -r "TRIDENT\|LENS\|GRID" src/ api/` before every deploy

**Status:** Partial fix applied (5 caller files cleaned, 10 pre-existing files with ~20 refs pending Kevin decision)

### 5.2 Design System

**Fonts:**
- Headings: Libre Baskerville (serif)
- Body: DM Sans (sans-serif)
- Fallback: Georgia / system-ui

**Colors:**
- Accent: `#C108AB` (magenta)
- Accent Hover: `#A00790`
- Accent Light: `rgba(193,8,171,0.08)`
- Background: `#FFFFFF` (primary), `#F8F8FA` (secondary)
- Text: `#1A1A1A` (primary), `#4A4A4A` (secondary), `#888888` (muted)
- Border: `#E8E8EC`
- Tier Colors:
  - T1 Strong: `#059669` (green)
  - T2 Good: `#2563EB` (blue)
  - T3 Potential: `#D97706` (amber)
  - T4 Not Yet: `#6B7280` (gray)

**Components:**
- Cards: `border-radius: 10px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`
- Buttons: Primary (accent bg), Outline (border + accent on hover)
- Badges: `border-radius: 4px`, `font-size: 11px`, `font-weight: 600`
- Tables: `font-size: 13px`, `border-bottom: 1px solid var(--border)`
- Score bars: `height: 6px`, `border-radius: 3px`, color by tier

---

## 6. 5-Criteria Scoring Framework

### 6.1 Criteria Definition

| # | Criterion | Definition | 0-20 Rubric Anchors | Weight |
|---|-----------|-----------|---------------------|--------|
| C1 | **Tenure & Track Record** | Years in current/most recent role, progression velocity, employer quality | 0-5 (early), 6-10 (mid), 11-15 (senior IC), 16-20 (P&L/V-suite) | 0.25 |
| C2 | **Network & Influence** | Org span, internal/external reach, P&L scope, decision authority | 0-5 (IC), 6-10 (team lead), 11-15 (dept head), 16-20 (C-suite/board) | 0.20 |
| C3 | **Performance & Impact** | Verifiable business outcomes (revenue, market share, KPIs, awards, public recognition) | 0-5 (limited), 6-10 (anecdotal), 11-15 (1-2 quant wins), 16-20 (sustained + quant + public) | 0.25 |
| C4 | **Mobility & Adaptability** | Cross-functional, cross-geo, role shifts, learning velocity, industry pivots | 0-5 (single track), 6-10 (one pivot), 11-15 (multi-track), 16-20 (multi-geo + multi-industry) | 0.15 |
| C5 | **Cultural & Mandate Fit** | Mission alignment, value fit, mandate-specific red/green flags | 0-5 (clear misfit), 6-10 (neutral), 11-15 (positive signals), 16-20 (strong fit + examples) | 0.15 |

**Weights sum to 1.00.** Hard-coded in `api/_lib/scoringCriteria.ts`.

### 6.2 Composite Formula

```
composite = (C1*0.25 + C2*0.20 + C3*0.25 + C4*0.15 + C5*0.15) * 5
```

**Range:** 0-100

**Tier Mapping:**
| Composite | Tier | Label | Action |
|-----------|------|-------|--------|
| 80-100 | T1_STRONG | Strong Fit | Top of shortlist |
| 60-79 | T2_GOOD | Good Fit | Active pipeline |
| 40-59 | T3_POTENTIAL | Potential Fit | Development track |
| 0-39 | T4_NOT_YET | Not Yet Fit | Explicit dealbreaker |

### 6.3 LLM Prompt Architecture

**Per individual (Admin Mode):** 5 parallel LLM calls (1 per criterion)
**Per candidate (Public Mode):** 1 LLM call (all 5 criteria + composite + narrative in single response)

**Prompt Template (Admin Mode, per criterion):**
```
You are an executive talent assessor evaluating a candidate for a {mandate_sector} mandate in {mandate_country}.

Candidate: {name}, {title} at {company} ({tenure_years} years)
CV: {cv_text}

Criterion: {criterion_name}
Definition: {criterion_definition}

Score this criterion on a 0-20 scale using these anchors:
- 0-5: {low_anchor}
- 6-10: {mid_anchor}
- 11-15: {high_anchor}
- 16-20: {top_anchor}

Respond with JSON:
{
  "score": <0-20>,
  "rationale": "<1-2 sentences explaining the score>",
  "evidence": ["<bullet point 1>", "<bullet point 2>"]
}
```

**Prompt Template (Public Mode, single call):**
```
You are an executive talent assessor evaluating candidates against a job description.

Job Description: {jd}

Candidate: {name}
CV: {cv}

Evaluate this candidate on 5 criteria (0-20 each):
1. Tenure & Track Record: {C1_definition}
2. Network & Influence: {C2_definition}
3. Performance & Impact: {C3_definition}
4. Mobility & Adaptability: {C4_definition}
5. Cultural & Mandate Fit: {C5_definition}

Respond with JSON:
{
  "C1": <0-20>, "C2": <0-20>, "C3": <0-20>, "C4": <0-20>, "C5": <0-20>,
  "composite": <0-100>,
  "match_reasons": ["<reason 1>", "<reason 2>", "<reason 3>", "<reason 4>", "<reason 5>"],
  "risk_factors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "approach_strategy": "<1-2 sentences>"
}
```

**Model:** DeepSeek-V3 (`deepseek-chat`)
**Temperature:** 0.1 (low variance for consistent rubric application)
**Max Tokens:** 200 (admin mode), 600 (public mode)
**Timeout:** 7s per call (AbortController)

---

## 7. Mockup Data (Codelco China)

**Mandate:** Codelco China Sourcing (UUID: `1f3a57d9-e3fe-4e96-b761-e769d94f26ae`)
**Target Company:** Codelco China (Copper & Mining, state-owned, China market entry)

### 7.1 Sample Individuals (10 from TalentPoolTab)

| Name | Title | BU | Level | Location | Tenure | Leadership |
|------|-------|----|----|----------|--------|------------|
| Wei Zhang | SVP, Operations | Operations | 8 | Shanghai | 6.5 years | Yes |
| Li Chen | VP, Commercial Strategy | Commercial | 7 | Beijing | 4.2 years | Yes |
| Mei Wang | Director, Technology | Technology | 6 | Shenzhen | 3.8 years | Yes |
| Jun Liu | VP, Finance & Planning | Finance | 7 | Shanghai | 5.1 years | Yes |
| Xiaoming Zhao | GM, Western Region | Operations | 6 | Chengdu | 7.2 years | Yes |
| Ying Sun | Senior Manager, HR | Human Resources | 5 | Shanghai | 3.5 years | No |
| Hao Wu | Director, Supply Chain | Operations | 5 | Tianjin | 4.0 years | No |
| Lin Xu | Head of APAC Sales | Commercial | 6 | Singapore | 2.8 years | Yes |
| Qian Li | Manager, Data Analytics | Technology | 4 | Shanghai | 2.1 years | No |
| Tao Huang | Controller, APAC | Finance | 5 | Hong Kong | 3.3 years | No |

### 7.2 Sample Evaluations (7 from EvaluationsTab)

| Individual | Overall Score | Tier | Evaluated | Status |
|------------|---------------|------|-----------|--------|
| Wei Zhang | 87 | T1 Strong Fit | 2026-06-11 | Finalized |
| Li Chen | 74 | T2 Good Fit | 2026-06-11 | Finalized |
| Jun Liu | 71 | T2 Good Fit | 2026-06-10 | Finalized |
| Mei Wang | 66 | T2 Good Fit | 2026-06-10 | Pending |
| Lin Xu | 63 | T2 Good Fit | 2026-06-09 | Finalized |
| Xiaoming Zhao | 58 | T3 Potential | 2026-06-09 | Finalized |
| Hao Wu | 52 | T3 Potential | 2026-06-08 | Pending |

### 7.3 Sample Sub-Scores (Wei Zhang, T1 Strong Fit, Score 87)

| Criterion | Score (0-20) | Rationale |
|-----------|--------------|-----------|
| C1 Tenure | 18 | 6.5 years at Codelco, progressive from GM to SVP. Prior 8 years at BHP. Stable, senior trajectory. |
| C2 Network | 17 | Recognized voice at China Mining Conference 2024. Board member, Shanxi Coal Association. |
| C3 Performance | 19 | Led APAC expansion to $2.1B revenue segment. 40% YoY growth 2023-2025. |
| C4 Mobility | 15 | Single-track in mining sector, but cross-functional (ops + commercial). |
| C5 Cultural Fit | 18 | Strong fit: state-owned to state-owned, China market expertise, Mandarin native. |

**Composite:** `(18*0.25 + 17*0.20 + 19*0.25 + 15*0.15 + 18*0.15) * 5 = 87`

---

## 8. Deployment & Infrastructure

**Platform:** Vercel (Hobby plan)
**Functions:** 12 total (hard limit)
- 9 legacy: chat, credits, email, health, lead-capture, memory, share, stripe, upload
- 3 org-intel: T3 upload, T4 scoring, T6 GRID PDF

**Database:** Supabase (PostgreSQL)
- REST API only (service role key)
- No DDL via service role (Kevin runs SQL migration manually)

**LLM:** DeepSeek API (V3)
- Endpoint: `https://api.deepseek.com/v1/chat/completions`
- Auth: `DEEPSEEK_API_KEY` env var (Kevin must add to Vercel)
- Cost: ~$0.0073 per individual (5 criteria * 10K input tokens)

**Auth:** Supabase Auth
- JWT-based
- Admin check: `profiles.role === 'admin'`
- Admin emails: `kevin.hong@lyc-partners.ai`, `alessio@lyc-partners.ai`

**Repo:** `https://github.com/kevinhongfr-star/lyc-intelligence`
**Domain:** `https://www.lyc-intelligence.app`
**Mockup:** `https://www.lyc-intelligence.app/org-intel-mockup.html` (public, no auth)

---

## 9. Open Questions (Kevin to Confirm)

1. **Are the 5 criteria the right 5?** (Tenure / Network / Performance / Mobility / Cultural Fit)
2. **Are the default weights right?** (0.25 / 0.20 / 0.25 / 0.15 / 0.15)
3. **Tier boundaries?** (80/60/40 thresholds)
4. **Override reason min length?** (30 chars proposed)
5. **Per-call temperature?** (0.1 proposed)
6. **Should we clean the 10 pre-existing files with ~20 TRIDENT references?** (pending decision)

---

## 10. Next Steps

**Kevin's Tasks:**
1. Run SQL migration: `supabase/migrations/20260611_create_org_intelligence_tables.sql`
2. Add `DEEPSEEK_API_KEY` to Vercel env vars
3. Answer 5 open questions above
4. Decide on TRIDENT cleanup

**NEXUS Tasks:**
1. Monitor daily Notion→Supabase sync (schedule: 06:15 HKT)
2. Build slide deck from Kevin's screenshots (when ready)
3. Implement mandate-specific weight overrides (Phase 2, pending Kevin's go)

---

**Document Version:** 2.0 (2026-06-12)
**Last Updated:** 2026-06-12 20:30 HKT
**Author:** NEXUS
