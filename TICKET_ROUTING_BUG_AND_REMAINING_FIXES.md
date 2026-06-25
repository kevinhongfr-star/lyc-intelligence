# TICKET: SCORING ROUTING BUG + REMAINING FIXES (Post-Audit 2026-06-25)

**Branch:** `trae/solo-agent-IfBgJl`
**Priority:** CRITICAL — routing bug blocks all scoring sub-features
**Commit audited:** `8715448d66206e1156924cfc034f19c6d35b15bd`
**Estimated time:** 45-90 minutes (depending on Fix 3 strategy)
**Audit methodology:** 5-layer exhaustive enumeration

---

## CONTEXT

Post-audit of commit `8715448` found:
- **1 CRITICAL routing bug introduced** by the auth fix (7 sub-routes unreachable)
- **2 HIGH authFetch calls** still using raw `fetch()` (will 401)
- **23 MEDIUM missing tables** referenced in 787 backend locations but never created in migrations

19 of 24 original issues are fixed. This ticket covers the remaining 3 categories.

---

## FIX 1: SCORING ROUTING LOGIC BUG (CRITICAL)

### What changes

Reorder the if-statement cascade in `api/scoring/[[...path]].ts` lines 56-73 so that **sub-routes are checked BEFORE parent routes**.

**Current broken code (lines 56-73):**
```typescript
// SHIFT Assessment routes (Phase 2.2)
if (sub === 'shift') return handleSHIFTAssessment(req, res);           // ← catches ALL /shift/* requests
if (sub === 'shift' && pathArr[1] === 'report') return handleSHIFTReport(req, res);  // ← UNREACHABLE

// Advisory Assessment routes (Phase 3.4)
if (sub === 'advisory') return handleAdvisoryAssessment(req, res);      // ← catches ALL /advisory/* requests
if (sub === 'advisory' && pathArr[1] === 'report') return handleAdvisoryReport(req, res);       // ← UNREACHABLE
if (sub === 'advisory' && pathArr[1] === 'participant') return handleParticipantAssessment(req, res); // ← UNREACHABLE

// Candidate Assessment routes (Phase 4.2)
if (sub === 'candidate') return handleCandidateAssessmentScoring(req, res);  // ← catches ALL /candidate/* requests
if (sub === 'candidate' && pathArr[1] === 'submit') return handleSubmitCandidateAssessment(req, res);    // ← UNREACHABLE
if (sub === 'candidate' && pathArr[1] === 'assessment') return handleGetCandidateAssessment(req, res);   // ← UNREACHABLE
if (sub === 'candidate' && pathArr[1] === 'result') return handleGetCandidateResult(req, res);           // ← UNREACHABLE
if (sub === 'candidate' && pathArr[1] === 'visibility') return handleUpdateResultVisibility(req, res);   // ← UNREACHABLE
```

**Correct code:**
```typescript
// SHIFT Assessment routes — sub-routes FIRST
if (sub === 'shift' && pathArr[1] === 'report') return handleSHIFTReport(req, res);
if (sub === 'shift') return handleSHIFTAssessment(req, res);

// Advisory Assessment routes — sub-routes FIRST
if (sub === 'advisory' && pathArr[1] === 'report') return handleAdvisoryReport(req, res);
if (sub === 'advisory' && pathArr[1] === 'participant') return handleParticipantAssessment(req, res);
if (sub === 'advisory') return handleAdvisoryAssessment(req, res);

// Candidate Assessment routes — sub-routes FIRST
if (sub === 'candidate' && pathArr[1] === 'submit') return handleSubmitCandidateAssessment(req, res);
if (sub === 'candidate' && pathArr[1] === 'assessment') return handleGetCandidateAssessment(req, res);
if (sub === 'candidate' && pathArr[1] === 'result') return handleGetCandidateResult(req, res);
if (sub === 'candidate' && pathArr[1] === 'visibility') return handleUpdateResultVisibility(req, res);
if (sub === 'candidate') return handleCandidateAssessmentScoring(req, res);
```

### Blast Radius: What couples to it

**All 7 handler functions are imported from `_lib/scoringComputeHandler.js`:**
- `handleSHIFTReport` — used by SHIFT report generation UI
- `handleAdvisoryReport` — used by advisory report generation UI
- `handleParticipantAssessment` — used by participant assessment UI
- `handleSubmitCandidateAssessment` — used by candidate submission flow
- `handleGetCandidateAssessment` — used by candidate assessment retrieval
- `handleGetCandidateResult` — used by candidate result display
- `handleUpdateResultVisibility` — used by result visibility toggle

**Frontend routes that call these endpoints (all currently broken):**
- `POST /api/scoring/shift/report` → report generation
- `POST /api/scoring/advisory/report` → advisory report
- `POST /api/scoring/advisory/participant` → participant assessment
- `POST /api/scoring/candidate/submit` → candidate submission
- `GET /api/scoring/candidate/assessment` → candidate assessment data
- `GET /api/scoring/candidate/result` → candidate results
- `PUT /api/scoring/candidate/visibility` → visibility toggle

### Blast Radius: What breaks if this fix is missing

- **ALL 7 sub-routes remain permanently unreachable** — every request to `/api/scoring/shift/report`, `/api/scoring/candidate/submit`, etc. hits the parent handler instead
- `handleSHIFTAssessment` receives requests meant for `handleSHIFTReport` → wrong response format → frontend crashes
- `handleCandidateAssessmentScoring` receives POST meant for `handleSubmitCandidateAssessment` → candidate submissions silently fail
- The auth fix (which works correctly) is rendered useless for these routes because requests never reach the intended handlers

### Acceptance criteria

- [ ] Sub-route if-checks appear BEFORE their parent route in the cascade
- [ ] `GET /api/scoring/shift/report` calls `handleSHIFTReport`, not `handleSHIFTAssessment`
- [ ] `GET /api/scoring/advisory/report` calls `handleAdvisoryReport`, not `handleAdvisoryAssessment`
- [ ] `GET /api/scoring/advisory/participant` calls `handleParticipantAssessment`, not `handleAdvisoryAssessment`
- [ ] `POST /api/scoring/candidate/submit` calls `handleSubmitCandidateAssessment`, not `handleCandidateAssessmentScoring`
- [ ] `GET /api/scoring/candidate/assessment` calls `handleGetCandidateAssessment`, not `handleCandidateAssessmentScoring`
- [ ] `GET /api/scoring/candidate/result` calls `handleGetCandidateResult`, not `handleCandidateAssessmentScoring`
- [ ] `PUT /api/scoring/candidate/visibility` calls `handleUpdateResultVisibility`, not `handleCandidateAssessmentScoring`
- [ ] Parent routes still work: `GET /api/scoring/shift` → `handleSHIFTAssessment`, `GET /api/scoring/advisory` → `handleAdvisoryAssessment`, `GET /api/scoring/candidate` → `handleCandidateAssessmentScoring`
- [ ] Auth check (lines 38-46) and rate limiting (lines 48-55) remain unchanged

### Implementation notes

- This is a **pure reorder** — no new code, no imports, no logic changes
- Keep the auth check (lines 38-46) and rate limiting (lines 48-55) exactly as they are
- Only lines 56-73 need reordering
- Pattern: for each route group (shift, advisory, candidate), check `pathArr[1]` conditions first, then fall through to the parent handler

---

## FIX 2: RAW fetch() → authFetch() IN supabaseApi.ts (HIGH)

### What changes

Replace raw `fetch(url)` with `authFetch(url)` in 2 functions in `src/services/supabaseApi.ts`.

**Line 1016** — `getAllOutreachAttempts()`:
```typescript
// BROKEN:
const res = await fetch(url);
// FIX:
const res = await authFetch(url);
```

**Line 1124** — `getTargetCompanies()`:
```typescript
// BROKEN:
const res = await fetch(url);
// FIX:
const res = await authFetch(url);
```

`authFetch` is already imported at line 6: `import { authFetch } from '@/utils/authFetch';`

### Blast Radius: What couples to it

**Functions affected:**
1. `getAllOutreachAttempts(mandateId?)` → calls `GET /api/data/outreach-attempts`
2. `getTargetCompanies(mandateId?)` → calls `GET /api/data/target-companies`

**Components that call these functions:**
| Component | Function Called | File |
|-----------|----------------|------|
| `OutreachDashboard.tsx` (line 5, 238) | `getAllOutreachAttempts(mandateId)` | `src/components/outreach/` |
| `TalentLandscapeClient.tsx` (line 11, 47) | `getTargetCompanies(mandateId)` | `src/components/org/` |
| `MandateDetailPage.tsx` (line 20, 128) | `getTargetCompanies(mandate.id)` | `src/pages/` |

**Backend routes these hit:**
- `GET /api/data/outreach-attempts` → routed through `api/data/[[...path]].ts` → requires auth (JWT)
- `GET /api/data/target-companies` → routed through `api/data/[[...path]].ts` → requires auth (JWT)

### Blast Radius: What breaks if this fix is missing

- Both backend routes require JWT authentication (enforced by centralized auth in `api/data/[[...path]].ts`)
- Raw `fetch()` sends no Authorization header → backend returns **401 Unauthorized**
- `getAllOutreachAttempts` catches the error and returns `[]` — OutreachDashboard shows empty state (silent failure, no error visible to user)
- `getTargetCompanies` catches the error and returns `[]` — TalentLandscapeClient and MandateDetailPage show no target companies (silent failure)
- Users see blank dashboards with no indication of what went wrong

### Acceptance criteria

- [ ] `supabaseApi.ts` line 1016: `fetch(url)` → `authFetch(url)` in `getAllOutreachAttempts()`
- [ ] `supabaseApi.ts` line 1124: `fetch(url)` → `authFetch(url)` in `getTargetCompanies()`
- [ ] No other raw `fetch()` calls to `/api/*` endpoints exist in `supabaseApi.ts`
- [ ] Manual test: logged-in user opens OutreachDashboard → outreach attempts data loads (not empty)
- [ ] Manual test: logged-in user opens TalentLandscapeClient → target companies data loads (not empty)
- [ ] Manual test: logged-in user opens MandateDetailPage → target companies section populates

### Implementation notes

- `authFetch` is already imported at line 6 — no new imports needed
- `authFetch` automatically attaches JWT from Supabase session (see `src/utils/authFetch.ts`)
- The fix is a 2-line change: replace `fetch` with `authFetch` at exactly lines 1016 and 1124
- Note: `deleteOutreachAttempt()` at line 1028 already uses `authFetch` correctly — only the GET calls are broken
- Other functions in supabaseApi.ts (lines 137, 187, 873, 983, 1001, 1039, 1101, 1136) already use `authFetch` correctly

---

## FIX 3: 23 MISSING DATABASE TABLES (MEDIUM)

### What changes

23 tables are referenced in backend handlers but **never created in any migration file**. These tables need to either be created or the backend references need to be removed.

**Decision required:** Create the tables (recommended) OR remove dead code references.

### Tables with reference counts (backend handlers):

| Table | Refs | Primary Handler(s) |
|-------|------|-------------------|
| `credits` | 113 | creditsHandler.ts, stripeHandler.ts, scoringComputeHandler.ts, email.ts, admin, credits/ |
| `mandates` | 124 | dataHandler.ts, companiesUploadHandler.ts, cronHandler.ts, orgScopedQueries.ts, scoringComputeHandler.ts, slaHandler.ts, admin |
| `companies` | 86 | companiesUploadHandler.ts, dataHandler.ts, gridReportsGenerateHandler.ts, orgScopedQueries.ts, scoringComputeHandler.ts, admin |
| `contacts` | 57 | dataHandler.ts, dsrHandler.ts, orgScopedQueries.ts |
| `candidates_pipeline` | 15 | dataHandler.ts, orgScopedQueries.ts |
| `scoring_runs` | 16 | dataHandler.ts, score5Handler.ts, scoringComputeHandler.ts |
| `credit_transactions` | 11 | creditsHandler.ts, stripeHandler.ts, admin |
| `memories` | 11 | chatHandler.ts |
| `mandate_members` | 10 | dataHandler.ts, orgScopedQueries.ts |
| `generated_reports` | 7 | dataHandler.ts |
| `organizations` | 7 | creditsHandler.ts, dataHandler.ts |
| `candidate_saved_insights` | 4 | dataHandler.ts |
| `clients` | 5 | dataHandler.ts |
| `candidate_assessment_results` | 3 | scoringComputeHandler.ts |
| `ai_generations` | 2 | dataHandler.ts |
| `alumni_placements` | 2 | alumniHandler.ts |
| `assessment_configs` | 2 | scoringComputeHandler.ts |
| `automation_executions` | 2 | automationHandler.ts |
| `candidate_assessment_responses` | 2 | scoringComputeHandler.ts |
| `candidate_pipeline` | 1 | dataHandler.ts |
| `mandate_success_profiles` | 1 | scoringComputeHandler.ts |
| `match_history` | 1 | scoreHandler.ts |
| `pipeline_stage_history` | 1 | dataHandler.ts |

**Total: 787 references across all handlers.**

### Blast Radius: What couples to it

**The 10 serverless functions that query these tables:**
1. `api/admin/[[...path]].ts` → credits, credit_transactions, mandates
2. `api/chat/[[...path]].ts` → memories
3. `api/credits/[[...path]].ts` → credits, credit_transactions, organizations
4. `api/data/[[...path]].ts` → mandates, companies, contacts, clients, mandate_members, candidates_pipeline, candidate_pipeline, candidate_saved_insights, generated_reports, pipeline_stage_history, scoring_runs, ai_generations
5. `api/lead-capture.ts` → (no missing table deps)
6. `api/scoring/[[...path]].ts` → scoring_runs, candidate_assessment_results, candidate_assessment_responses, assessment_configs, mandate_success_profiles, credits
7. `api/share.ts` → (no missing table deps)
8. `api/stripe/[[...path]].ts` → credits, credit_transactions
9. `api/upload.ts` → (no missing table deps)
10. `api/x/[[...path]].ts` → ai_generations

**Also affected:**
- `_lib/dataHandler.ts` — the most impacted file (references 12 missing tables)
- `_lib/orgScopedQueries.ts` — references 5 missing tables
- `_lib/scoringComputeHandler.ts` — references 5 missing tables
- `_lib/creditsHandler.ts` — references 3 missing tables

### Blast Radius: What breaks if this fix is missing

- Every backend query to these 23 tables returns **404 from Supabase** (table does not exist)
- **High-impact failures** (frequently accessed features):
  - Credits system completely broken (113 refs) → users can't check balance, can't be debited for AI calls
  - Mandate CRUD broken (124 refs) → core business object unusable
  - Company lookup broken (86 refs) → company search, upload, matching all fail
  - Contact management broken (57 refs) → all contact queries fail
- **Medium-impact failures:**
  - Scoring runs can't be saved/retrieved
  - Candidate pipeline views show empty
  - Chat memories can't be persisted
  - Report generation fails
- **Silent failures:** Most handlers catch errors and return `[]` or `{}`, so users see empty states with no error message

### Recommended strategy: Create tables

**Option A (Recommended): Create all 23 tables via a single consolidated migration file**

Create `supabase/migrations/20260625_create_missing_core_tables.sql` with CREATE TABLE statements for all 23 tables. Base column definitions on how each handler queries the table (check `SELECT`, `INSERT`, `UPDATE` column references in the handler code).

Priority tiers (create high-impact tables first if splitting into multiple migrations):
1. **Tier 1 — Critical** (system broken without them): `credits`, `mandates`, `companies`, `contacts`, `credit_transactions`, `organizations`
2. **Tier 2 — Core features**: `mandate_members`, `candidates_pipeline`, `scoring_runs`, `memories`, `candidate_saved_insights`, `generated_reports`, `clients`
3. **Tier 3 — Scoring/AI**: `candidate_assessment_results`, `candidate_assessment_responses`, `assessment_configs`, `mandate_success_profiles`, `ai_generations`, `match_history`
4. **Tier 4 — Low usage**: `candidate_pipeline`, `alumni_placements`, `automation_executions`, `pipeline_stage_history`

**Option B: Remove dead code references**

If any of these 23 tables are for features that won't ship in v1, remove the backend handler code that references them. This is riskier (might remove needed code) but avoids creating tables for unused features.

### Acceptance criteria

- [ ] Decision made: Option A (create tables) or Option B (remove references)
- [ ] If Option A: migration file(s) created for all 23 tables with correct column definitions matching handler queries
- [ ] If Option B: dead code removed and handlers updated to not reference missing tables
- [ ] Verify: `SELECT` queries in handlers match the columns defined in migration CREATE TABLE statements
- [ ] Manual test: after running migrations in Supabase, call `/api/data/mandate` → returns data (not 404)
- [ ] Manual test: call `/api/data/company-overview` → returns data (not 404)
- [ ] Manual test: call `/api/credits/balance` → returns credit info (not 404)

### Implementation notes

- Check handler code to determine column names: each `SELECT col1, col2` and `INSERT INTO table (col1, col2)` tells you what columns the table needs
- Existing migrations are in `supabase/migrations/` — use same naming convention (`YYYYMMDD_description.sql`)
- Tables with `*_id` foreign keys should reference existing tables (check migration files for table definitions)
- The `credits` table is the most complex (113 refs across 6 handlers) — start there
- After creating migrations, Kevin needs to run them in Supabase Dashboard (you don't have direct DB access)

---

## VERIFICATION CHECKLIST (post-fix)

### Fix 1 — Routing
- [ ] `GET /api/scoring/shift/report` → 200 (not caught by `handleSHIFTAssessment`)
- [ ] `GET /api/scoring/advisory/report` → 200 (not caught by `handleAdvisoryAssessment`)
- [ ] `GET /api/scoring/advisory/participant` → 200 (not caught by `handleAdvisoryAssessment`)
- [ ] `POST /api/scoring/candidate/submit` → 200 (not caught by `handleCandidateAssessmentScoring`)
- [ ] `GET /api/scoring/candidate/assessment` → 200
- [ ] `GET /api/scoring/candidate/result` → 200
- [ ] `PUT /api/scoring/candidate/visibility` → 200
- [ ] Parent routes still work: `/api/scoring/shift`, `/api/scoring/advisory`, `/api/scoring/candidate`

### Fix 2 — authFetch
- [ ] `grep -n "await fetch(" src/services/supabaseApi.ts` → 0 results to `/api/*` endpoints
- [ ] OutreachDashboard loads data (not empty)
- [ ] TalentLandscapeClient loads target companies (not empty)
- [ ] MandateDetailPage loads target companies section

### Fix 3 — Tables
- [ ] All 23 tables exist in Supabase after migration
- [ ] Backend queries to these tables return data (not 404)

---

## EXECUTION ORDER

1. **Fix 1** (CRITICAL, 5 min) — pure reorder, zero risk, immediate impact
2. **Fix 2** (HIGH, 2 min) — 2-line change, already imported, zero risk
3. **Fix 3** (MEDIUM, 30-60 min) — requires design decisions on table schemas

**Recommended: Do Fix 1 + Fix 2 in one commit (trivial), then Fix 3 separately (needs migration design).**

---

## NOTES FOR TRAE

- This ticket follows the **Blast Radius** methodology: every fix includes what changes, what couples to it, what breaks if coupled changes are missing
- Fix 1 is a **pure reorder** — don't change any handler logic, just the if-statement order
- Fix 2 is a **2-line change** — `fetch` → `authFetch` at exactly 2 locations
- Fix 3 needs a **design decision** from Kevin on Option A vs Option B before proceeding
- Test each fix independently before committing
- All file paths and line numbers are from commit `8715448`

---

*Ticket created: 2026-06-25 by NEXUS (post-audit exhaustive verification)*
