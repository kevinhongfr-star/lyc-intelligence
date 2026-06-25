# TICKET: COMPREHENSIVE SECURITY & FUNCTIONALITY FIXES (Exhaustive Audit 2026-06-25)

**Branch**: trae/solo-agent-IfBgJl  
**Priority**: CRITICAL - blocks production readiness  
**Estimated time**: 6-8 hours  
**Audit methodology**: 5-layer exhaustive (backend routes, frontend fetch calls, env vars, DB tables, coupling matrix)

---

## CONTEXT

This ticket addresses 24 issues discovered through exhaustive enumeration of every serverless function route (32 routes), every frontend fetch() call (30 calls), every environment variable reference (48 refs), and every database table name (71 tables). Each fix includes Blast Radius analysis to prevent cascading breakage.

**Current state**: 10 serverless functions deployed, 4 scoring sub-handlers have ZERO auth (credit-burning risk), 14 frontend API calls are broken (401/404), 3 table name mismatches cause all compensation/SLA queries to fail, DeepSeek API key exposed in browser bundle.

---

## FIX GROUP 1: SCORING AUTH (CRITICAL - 10 issues)

### What changes
Add JWT authentication to 10 scoring sub-handler functions that currently have ZERO auth. These are all DeepSeek API endpoints or DB write endpoints accessible at /api/scoring/*.

### Files to modify
- api/_lib/score5Handler.ts - add getUserFromRequest check
- api/_lib/scoringComputeHandler.ts - add auth to 9 exported handlers:
  - handleSHIFTAssessment (line 1085)
  - handleSHIFTReport (line 1200)
  - handleAdvisoryAssessment (line 1428)
  - handleAdvisoryReport (line 1472)
  - handleCandidateAssessmentScoring (line 1601)
  - handleSubmitCandidateAssessment (line 2035)
  - handleGetCandidateAssessment (line 2110)
  - handleGetCandidateResult (line 1976)
  - handleUpdateResultVisibility (line 2256)

### Blast Radius: What couples to it
Frontend callers that must also send auth headers:
- src/services/supabaseApi.ts lines 2195, 2219, 2238, 2261, 2330 - 5 raw fetch() calls to /scoring/candidate/* paths
- src/services/scoringClient.ts line 59 - calls /api/admin/org-intelligence/scoring/compute with {public: true}

### Blast Radius: What breaks if coupled changes are missing
- If backend adds auth but frontend doesnt send JWT -> all scoring calls return 401 -> scoring feature completely broken
- If scoringClient.ts public mode is removed without providing alternative -> legacy candidate matching breaks

### Acceptance criteria
- [ ] All 10 handlers return 401 for unauthenticated requests
- [ ] All 5 frontend scoring calls in supabaseApi.ts use authFetch instead of raw fetch
- [ ] Frontend scoring paths corrected from /scoring/... to /api/scoring/... (see FIX GROUP 2)
- [ ] scoringClient.ts public mode either: (a) kept with rate limiting + credits check, OR (b) migrated to authenticated flow
- [ ] Manual test: unauthenticated POST to /api/scoring/5 returns 401
- [ ] Manual test: authenticated POST to /api/scoring/5 with valid body returns scoring result

### Implementation notes
- Import getUserFromRequest from ./adminAuth.js (already exists)
- Add at start of each handler: const { user, error } = await getUserFromRequest(req); if (error || !user) return res.status(401).json({ success: false, error: "Unauthorized" });
- Add rate limiting (10 req/min/IP) to handleScore5, handleSHIFTAssessment, handleAdvisoryAssessment, handleCandidateAssessmentScoring
- For candidate assessment routes accessible by external candidates, consider token-based auth instead of JWT

---

## FIX GROUP 2: FRONTEND PATH CORRECTIONS (MEDIUM - 9 issues)

### What changes
Fix 9 broken frontend API calls that use incorrect paths or missing auth headers.

### Files to modify
- src/services/serverApi.ts - 4 calls:
  - Line 4: /api/email -> /api/x/email (public, no auth needed)
  - Line 9: /api/score -> /api/scoring (needs auth)
  - Line 17: /api/upload -> exists but needs auth header + must use FormData not JSON
  - Line 23: /api/health -> /api/admin/health (needs admin auth)
- src/services/supabaseApi.ts - 7 calls:
  - Lines 1016, 1124: raw fetch(url) -> authFetch(url) for /api/data/outreach-attempts and /api/data/target-companies
  - Lines 2195, 2219, 2238, 2261, 2330: /scoring/... -> /api/scoring/... (missing prefix) + convert to authFetch

### Blast Radius: What couples to it
- serverApi.ts functions called by: signup flow, matching/scoring, file upload UI, admin dashboard
- supabaseApi.ts functions called by: BD/outreach components, market research, candidate scoring

### Blast Radius: What breaks if coupled changes are missing
- If paths corrected but auth not added -> still 401
- If auth added but paths not corrected -> still 404
- Both must be done together

### Acceptance criteria
- [ ] serverApi.ts: all 4 calls use correct paths and auth where needed
- [ ] supabaseApi.ts: all 7 calls use authFetch and correct /api/ prefix
- [ ] serverApi.ts line 17: uses FormData for multipart upload (not JSON)
- [ ] Manual test: signup email sent, file upload works, admin health dashboard displays

### Implementation notes
- authFetch already exists at src/utils/authFetch.ts
- serverApi.ts line 17 MUST use FormData because backend expects multipart/form-data
- serverApi.ts line 23: only admin users should call health endpoint

---

## FIX GROUP 3: TABLE NAME MISMATCHES (HIGH - 3 issues)

### What changes
Correct 3 table names in backend handlers to match the names in SQL migrations.

### Files to modify
- api/_lib/compensationHandler.ts:
  - Lines 33, 76, 83, 89, 111: compensation_benchmark -> comp_benchmarks
  - Lines 53, 163: compensation_data_points -> comp_data_points
- api/_lib/slaHandler.ts:
  - Lines 30, 53, 60, 62: sla_config -> sla_configurations

### Blast Radius: What couples to it
- compensationHandler called via /api/x/compensation/* -> compensation UI components
- slaHandler called via /api/x/sla/* -> SLA management UI components
- Tables must exist in live DB with correct names

### Blast Radius: What breaks if coupled changes are missing
- If backend names fixed but tables dont exist in DB -> still 404
- If tables exist with old names -> need to rename via SQL

### Acceptance criteria
- [ ] compensationHandler.ts uses comp_benchmarks (5 refs) and comp_data_points (2 refs)
- [ ] slaHandler.ts uses sla_configurations (4 refs)
- [ ] Verify tables exist in Supabase: comp_benchmarks, comp_data_points, sla_configurations
- [ ] Manual test: /api/x/compensation/benchmarks returns data, /api/x/sla/config returns config

### Implementation notes
- Check if old-name tables exist in Supabase first
- If yes: ALTER TABLE old_name RENAME TO new_name
- If no: run migration files from supabase/migrations/

---

## FIX GROUP 4: API KEY EXPOSURE (CRITICAL - 1 issue)

### What changes
Move DeepSeek API call from frontend (aiService.ts) to backend to prevent API key exposure in browser bundle.

### Files to modify
- src/services/ai/aiService.ts - replace direct DeepSeek fetch with authFetch calls to new backend endpoints
- api/_lib/aiHandler.ts - NEW FILE: handles CV analysis, question generation, offer negotiation via DeepSeek
- api/x/[[...path]].ts - add ai to handlers map
- vercel.json - remove https://api.deepseek.com from CSP connect-src

### Blast Radius: What couples to it
- Environment: VITE_DEEPSEEK_API_KEY must be removed from Vercel frontend env
- Components: CVAnalyzer.tsx, InterviewQuestionGenerator.tsx, OfferNegotiationAssistant.tsx
- CSP: vercel.json connect-src must be updated

### Blast Radius: What breaks if coupled changes are missing
- Backend created but frontend not updated -> AI features still expose key
- Frontend updated but backend not created -> AI features broken (404)
- VITE_DEEPSEEK_API_KEY not removed -> key still in bundle

### Acceptance criteria
- [ ] New backend endpoints: /api/x/ai/analyze-cv, /api/x/ai/generate-questions, /api/x/ai/negotiate-offer
- [ ] Each endpoint has auth + rate limiting (5 req/min/user)
- [ ] aiService.ts calls backend via authFetch, same function signatures
- [ ] VITE_DEEPSEEK_API_KEY removed from aiService.ts
- [ ] vercel.json CSP: api.deepseek.com removed from connect-src
- [ ] Components unchanged (aiService.ts maintains same interface)
- [ ] Manual test: all 3 AI components work end-to-end
- [ ] Browser DevTools: no direct calls to api.deepseek.com

---

## FIX GROUP 5: RATE LIMITING (LOW - 1 issue)

### What changes
Add rate limiting to /api/lead-capture public endpoint.

### Files to modify
- api/lead-capture.ts - add IP-based rate limiting (5 req/min/IP)

### Blast Radius: What couples to it
- Lead capture forms on landing pages
- If too aggressive -> legitimate leads blocked

### Blast Radius: What breaks if coupled changes are missing
- No breakage - additive security hardening

### Acceptance criteria
- [ ] /api/lead-capture rate limited to 5 req/min/IP
- [ ] Returns 429 when exceeded

---

## FIX GROUP 6: MINOR FIXES (LOW - 4 issues)

### What changes
- ProposalBuilderPage.tsx line 77: replace direct Supabase REST with backend endpoint call
- dataHandler.ts line 2884: NEXT_PUBLIC_BASE_URL -> VITE_BASE_URL
- Verify 13 tables referenced in backend exist in live Supabase

### Files to modify
- src/pages/ProposalBuilderPage.tsx - use authFetch to /api/data/companies
- api/_lib/dataHandler.ts - fix env var name
- api/_lib/dataHandler.ts or api/data/[[...path]].ts - add /companies endpoint if needed

### Acceptance criteria
- [ ] ProposalBuilderPage company search works via backend
- [ ] dataHandler uses VITE_BASE_URL (not NEXT_PUBLIC_)
- [ ] All referenced tables verified in Supabase

---

## EXECUTION ORDER

1. FIX GROUP 3 (table names) - quick win
2. FIX GROUP 5 (rate limiting) - quick win
3. FIX GROUP 6 (minor fixes) - quick win
4. FIX GROUP 2 (frontend paths) - coordinate with Group 1
5. FIX GROUP 1 (scoring auth) - coordinate with Group 2
6. FIX GROUP 4 (API key exposure) - most complex, new endpoints

Groups 1+2 should be done together since they couple to each other.

---

## NOTES FOR TRAE

- Every fix includes Blast Radius: what changes, what couples to it, what breaks
- All line numbers from commit 74689ea + ticket 5c7c9b0
- Test each fix group independently
- Run full verification checklist after all fixes
- Document any additional couplings discovered in commit message

Ticket created: 2026-06-25 by NEXUS (exhaustive 5-layer audit)
