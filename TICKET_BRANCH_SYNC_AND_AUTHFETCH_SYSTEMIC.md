# TICKET: BRANCH SYNC + SYSTEMIC authFetch FIX

**Branch to work on:** `trae/agent-cPdyiC`
**Priority:** 🔴 CRITICAL — auth regressions block production
**Commit audited:** `a7be8e9`
**Estimated time:** 2-3 hours total

---

## WHY THIS TICKET EXISTS

The last audit of commit `a7be8e9` (branch `trae/agent-cPdyiC`) found:

**3 fixes from previous ticket: ✅ ALL CORRECT**
- Fix 1: Routing logic reorder — correct
- Fix 2: authFetch 2 calls (lines 1015, 1123) — correct
- Fix 3: 23 missing tables migration — all created

**But 4 CRITICAL REGRESSIONS from commit `8715448` were lost:**
1. Scoring router auth completely removed (75 lines → 38 lines, `getUserFromRequest` import gone)
2. Rate limiting completely removed from scoring
3. DeepSeek API key re-exposed in browser (`import.meta.env.VITE_DEEPSEEK_API_KEY` in aiService.ts line 71)
4. aiHandler route not registered in `api/x/[[...path]].ts`

**Root cause:** Branch `trae/agent-cPdyiC` diverged BEFORE commit `8715448` (which contained the auth fixes). Your routing fix is good, but it needs the auth layer that was stripped.

**PLUS a new systemic finding:** 85 additional raw `fetch()` calls in supabaseApi.ts + serverApi.ts that send no auth headers.

---

## PART 1: BRANCH SYNC (CRITICAL — 30 minutes)

### Goal
Bring the auth/security fixes from commit `8715448` (branch `trae/solo-agent-IfBgJl`) INTO branch `trae/agent-cPdyiC`, while KEEPING the routing fix and migration from `a7be8e9`.

### What to merge

From commit `8715448`, these files need their fixed versions present in `trae/agent-cPdyiC`:

| File | What the fix contains |
|------|----------------------|
| `api/scoring/[[...path]].ts` | Centralized auth check (getUserFromRequest), rate limiting, proper 75-line structure |
| `src/services/aiService.ts` | Calls backend via authFetch, NO `VITE_DEEPSEEK_API_KEY`, NO direct DeepSeek URL |
| `api/x/aiHandler.ts` | Server-side DeepSeek API calls (NEW file — must exist) |
| `api/x/[[...path]].ts` | `ai` handler registered in the dispatcher map |
| `vercel.json` | CSP headers with `connect-src` restricted (no `api.deepseek.com`) |
| `src/services/scoringComputeHandler.ts` | Individual auth checks on handler functions |

### How to merge (recommended approach: cherry-pick or manual)

**Option A: Cherry-pick (cleanest)**
```bash
git checkout trae/agent-cPdyiC
git cherry-pick 8715448
# Resolve conflicts — for api/scoring/[[...path]].ts, keep BOTH:
#   - Your routing reorder from a7be8e9 (sub-routes before parent)
#   - The auth check + rate limiting from 8715448
# Final file should be ~75 lines WITH correct route order
```

**Option B: Manual file-by-file (if cherry-pick has too many conflicts)**
1. Checkout `trae/solo-agent-IfBgJl` to get commit `8715448` files
2. Copy these files into `trae/agent-cPdyiC`:
   - `src/services/aiService.ts` (the fixed version from 8715448)
   - `api/x/aiHandler.ts` (new file)
3. For `api/scoring/[[...path]].ts`: manually merge — take the AUTH + RATE LIMITING from 8715448, keep the ROUTING ORDER from a7be8e9
4. For `api/x/[[...path]].ts`: add `'ai'` to the handlers map (from 8715448)
5. For `vercel.json`: add CSP headers from 8715448

### After merge: verification checklist

After sync, ALL of these must be true simultaneously:

- [ ] `api/scoring/[[...path]].ts` has `import { getUserFromRequest }` at top
- [ ] `api/scoring/[[...path]].ts` has auth check: `const user = await getUserFromRequest(req)`
- [ ] `api/scoring/[[...path]].ts` has rate limiting
- [ ] `api/scoring/[[...path]].ts` has sub-routes BEFORE parent routes (your fix from a7be8e9)
- [ ] `src/services/aiService.ts` does NOT contain `VITE_DEEPSEEK_API_KEY`
- [ ] `src/services/aiService.ts` does NOT contain `https://api.deepseek.com`
- [ ] `src/services/aiService.ts` calls backend via `authFetch('/api/x/ai/...')`
- [ ] `api/x/aiHandler.ts` exists and makes server-side DeepSeek calls
- [ ] `api/x/[[...path]].ts` has `'ai'` key in handlers map
- [ ] `vercel.json` has CSP `connect-src` restriction (no `api.deepseek.com`)
- [ ] `supabaseApi.ts` lines 1015, 1123 still use `authFetch` (your fix, don't lose it)
- [ ] Migration file `20260625_create_missing_core_tables.sql` exists (your fix, don't lose it)

### Blast Radius: What breaks if merge is skipped

- All scoring routes remain **wide open** — anyone can burn DeepSeek credits without auth
- DeepSeek API key remains **exposed in browser bundle** — extractable from JS, usable by anyone
- aiHandler remains **dead code** — frontend calls backend, but backend has no route registered
- CSP remains **absent** — browser can make requests to any domain
- The routing fix (which is correct) works, but serves unauthenticated responses

---

## PART 2: SYSTEMIC authFetch FIX (HIGH — 1-2 hours)

### What changes

After Part 1 merge is verified, fix ALL remaining raw `fetch()` calls to `/api/*` endpoints in:
- `src/services/supabaseApi.ts` — 82 raw fetch() calls → authFetch()
- `src/services/serverApi.ts` — 2 raw fetch() calls → authFetch() (the other 2 are intentionally public)

**Total: 84 calls to convert.**

### Blast Radius: What couples to it

**supabaseApi.ts — 82 calls across these endpoint categories:**

| Endpoint pattern | Approx count | Components that call them |
|-----------------|-------------|--------------------------|
| `/api/data/mandates/*` | ~12 | MandateDetailPage, MandateList |
| `/api/data/contacts/*` | ~10 | ContactManager, OutreachDashboard |
| `/api/data/companies/*` | ~8 | CompanySearch, CompanyUpload |
| `/api/data/workshops/*` | ~5 | WorkshopPlanner |
| `/api/data/interviews/*` | ~4 | InterviewScheduler |
| `/api/data/offers/*` | ~3 | OfferTracker |
| `/api/data/milestones/*` | ~3 | MilestoneTracker |
| `/api/data/org-charts/*` | ~3 | OrgChartViewer |
| `/api/data/ml-predictions/*` | ~4 | TalentLandscapeClient |
| `/api/data/assessments/*` | ~5 | AssessmentDashboard |
| `/api/data/candidates/*` | ~6 | CandidatePipeline |
| `/api/data/target-companies/*` | ~4 | TalentLandscapeClient, MandateDetailPage |
| `/api/data/outreach/*` | ~5 | OutreachDashboard |
| `/api/data/automation/*` | ~3 | AutomationDashboard |
| `/api/credits/*` | ~4 | CreditBalance, AI features |
| `/api/scoring/*` | ~5 | ScoringDashboard |
| Other `/api/data/*` | ~8 | Various |

**serverApi.ts — 2 calls requiring auth:**
- `fetch('/api/score')` → needs authFetch (currently gets 401)
- `fetch('/api/upload')` → needs authFetch (currently gets 401)

**serverApi.ts — 2 calls that are intentionally public (DO NOT CHANGE):**
- `fetch('/api/email')` — public endpoint, no auth required
- `fetch('/api/health')` — health check, no auth required

### Blast Radius: What breaks if this fix is missing

- Every data endpoint returns **401 Unauthorized** when backend enforces auth
- All dashboards show **empty states silently** (errors caught, data defaults to `[]`)
- Outreach, Talent Landscape, Mandate, Contact, Company, Assessment, Candidate, Workshop, Interview, Offer, Milestone, OrgChart, Automation, ML Predictions — **ALL broken**
- Users see blank screens with no error messages
- Core business functionality is non-functional

### Implementation approach

**Step 1: Bulk find-and-replace pattern**

Every raw `fetch('/api/...')` in supabaseApi.ts should become `authFetch('/api/...')`.

The transformation is mechanical:
```typescript
// BEFORE (broken — no auth header):
const res = await fetch(`/api/data/mandates/${id}`);

// AFTER (fixed — auth header included):
const res = await authFetch(`/api/data/mandates/${id}`);
```

For calls with options (POST/PUT/PATCH/DELETE):
```typescript
// BEFORE:
const res = await fetch(`/api/data/mandates`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// AFTER:
const res = await authFetch(`/api/data/mandates`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Step 2: serverApi.ts — same pattern for the 2 auth-required calls**

```typescript
// /api/score and /api/upload need authFetch
// /api/email and /api/health stay as raw fetch (public)
```

**Step 3: Verify authFetch handles all HTTP methods**

`authFetch` is already imported at line 6 of supabaseApi.ts. It needs to support:
- GET (default)
- POST, PUT, PATCH, DELETE with options
- Custom headers (authFetch should merge auth header with any provided headers)

If `authFetch` currently only supports GET, extend it to pass through options.

### Acceptance criteria

- [ ] Zero raw `fetch()` calls to `/api/*` endpoints in supabaseApi.ts (except intentional public calls)
- [ ] Zero raw `fetch()` calls to `/api/score` and `/api/upload` in serverApi.ts
- [ ] `/api/email` and `/api/health` in serverApi.ts remain as raw `fetch()` (public, no auth)
- [ ] `authFetch` is imported and used consistently
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Manual test: OutreachDashboard loads data (not empty state)
- [ ] Manual test: TalentLandscapeClient loads target companies (not empty)
- [ ] Manual test: MandateDetailPage populates all sections
- [ ] Manual test: Credit balance displays correctly
- [ ] Manual test: Scoring dashboard loads assessments
- [ ] Grep verification: `grep -n "fetch(" src/services/supabaseApi.ts | grep "/api/"` returns 0 results

### Risk mitigation

- This is a **mechanical transformation** — no logic changes, just adding auth headers
- `authFetch` is already proven working (lines 1015, 1123 already use it)
- If any endpoint is intentionally public, add a comment: `// Public endpoint — no auth required`
- Commit in 1-2 logical chunks (supabaseApi.ts first, then serverApi.ts)

---

## EXECUTION ORDER

| Step | What | Time | Risk |
|------|------|------|------|
| 1 | Part 1: Branch sync (merge auth fixes into agent-cPdyiC) | 30 min | Medium (conflict resolution) |
| 2 | Verify Part 1 checklist (all 12 items) | 10 min | Low |
| 3 | Part 2: Bulk replace 84 raw fetch() → authFetch() | 60-90 min | Low (mechanical) |
| 4 | Verify Part 2 checklist (all 11 items) | 10 min | Low |
| 5 | Push commit | 5 min | — |

**Total estimated time: 2-3 hours**

Do Part 1 first — the auth regressions are blocking. Then Part 2 — the systemic fix makes the app actually functional.
