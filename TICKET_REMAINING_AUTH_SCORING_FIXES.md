# TICKET: Remaining authFetch + Scoring Path Fixes

**Priority:** P1  
**Estimated effort:** ~30 minutes  
**Blast radius analysis included**

---

## Context

Commit `74689ea` deployed successfully. The auth headers migration (F1) covered 98% of API calls. 2 calls were missed. Additionally, 5 scoring calls have been using wrong URL paths since the scoring module was created.

---

## Fix 1: Missed authFetch in supabaseApi.ts (2 calls -> 401)

**File:** `src/services/supabaseApi.ts`

### Line ~1016 — `getAllOutreachAttempts()`
```typescript
// BEFORE (broken — returns 401):
const res = await fetch(url);

// AFTER:
const res = await authFetch(url);
```

### Line ~1124 — `getTargetCompanies()`
```typescript
// BEFORE (broken — returns 401):
const res = await fetch(url);

// AFTER:
const res = await authFetch(url);
```

Ensure `authFetch` is imported at the top of the file (it should already be from the previous commit).

### Blast Radius
- `getAllOutreachAttempts()` is called by outreach/tracking components. Without auth, these components show empty data.
- `getTargetCompanies()` is called by market intelligence components. Same — empty data.
- Fix: 2 line changes. No other files affected.

---

## Fix 2: Wrong scoring API paths (5 calls -> 404)

**File:** `src/services/supabaseApi.ts`

These calls use `/scoring/...` instead of `/api/scoring/...`. They have been broken since creation. Also need auth headers.

### Line ~2195 — `getCandidateAssessment()`
```typescript
// BEFORE:
const res = await fetch(`/scoring/candidate/assessment?assessment_id=${assessmentId}&candidate_id=${candidateId}`);

// AFTER:
const res = await authFetch(`/api/scoring/candidate/assessment?assessment_id=${assessmentId}&candidate_id=${candidateId}`);
```

### Line ~2219 — `submitAssessmentResponses()`
```typescript
// BEFORE:
const res = await fetch('/scoring/candidate/submit', {

// AFTER:
const res = await authFetch('/api/scoring/candidate/submit', {
```

### Line ~2238 — `getAssessmentResult()`
```typescript
// BEFORE:
const res = await fetch(`/scoring/candidate/result?assessment_id=${assessmentId}&candidate_id=${candidateId}`);

// AFTER:
const res = await authFetch(`/api/scoring/candidate/result?assessment_id=${assessmentId}&candidate_id=${candidateId}`);
```

### Line ~2261 — `autoSaveAssessment()`
```typescript
// BEFORE:
const res = await fetch('/scoring/candidate', {

// AFTER:
const res = await authFetch('/api/scoring/candidate', {
```

### Line ~2330 — `updateResultVisibility()`
```typescript
// BEFORE:
const res = await fetch('/scoring/candidate/visibility', {

// AFTER:
const res = await authFetch('/api/scoring/candidate/visibility', {
```

### Blast Radius
- These are used by the assessment/scoring flow (SHIFT Assessment Wizard, candidate evaluation pages).
- Currently 404 = assessments completely non-functional.
- Fix: 5 line changes (add `/api/` prefix + swap `fetch` to `authFetch`).
- Downstream: assessment results will start persisting correctly. No architectural changes.

---

## Acceptance Criteria

1. `getAllOutreachAttempts()` uses `authFetch` — outreach data loads without 401
2. `getTargetCompanies()` uses `authFetch` — market data loads without 401
3. All 5 scoring calls use `/api/scoring/...` path + `authFetch`
4. Zero remaining `fetch()` calls to `/api/` or `/scoring/` without `authFetch` in supabaseApi.ts (except the intentional public email call in authStore.ts)
5. Deploy passes (should still be <=12 functions)

---

## Commit Message
```
fix: Add authFetch to missed outreach/market calls + fix scoring API paths
```
