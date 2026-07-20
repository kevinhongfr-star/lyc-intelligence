# B2C Page 5 Deep Audit: `/match` — Score Match Engine

**Auditor:** NEXUS  
**Date:** 2026-07-20  
**Score:** 3/10  
**Verdict:** Non-functional for paying users. Credit check is permanently broken.

---

## 1. Overview

**Route:** `/match` → `src/pages/MatchPage.tsx` (585 lines)  
**Purpose:** Public-facing candidate-to-JD matching tool. Users paste a JD, add candidates (manually or from DB), run AI scoring, view results, optionally save to pipeline.  
**Supporting files:**
- `src/components/match/JDInput.tsx` (72 lines)
- `src/components/match/CandidateList.tsx` (120 lines)
- `src/components/match/ResultsTable.tsx` (210 lines)
- `src/components/match/ContactSelector.tsx` (~200 lines)
- `src/components/match/MandateSelector.tsx` (~180 lines)
- `src/components/match/PipelineSaveModal.tsx` (~180 lines)
- `src/services/scoringClient.ts` (130 lines)
- `api/_lib/scoringComputeHandler.ts` (public mode branch)
- `api/_lib/creditsHandler.ts`

---

## 2. 🔴 P0 — Critical Bugs

### 2.1 Credit balance is ALWAYS 0 (BLOCKING)

**File:** `MatchPage.tsx:74-76`
```ts
useEffect(() => {
    if (profile?.credits?.balance !== undefined) {
      setUserCredits(profile.credits.balance);
    }
}, [profile]);
```

**Root cause:** `UserProfile` in `authStore.ts:12-23` has NO `credits` field. The interface is:
```ts
interface UserProfile {
  id, email, name, role, tier, organization_id,
  organization_name?, avatar_url?, timezone?, locale?,
  created_at, updated_at
}
```
`loadProfile()` fetches `profiles` table only — no join to `credits` table.

**Impact:** `userCredits` initializes to `0` and NEVER updates. For any user past their first free batch, `creditCost.credits > userCredits` is always true → "Insufficient Credits" modal always shows → **scoring is permanently blocked after first use**.

**Fix:** Either:
- (a) Add credits fetch in `loadProfile()` via join or separate query, add `credits` field to `UserProfile`
- (b) Fetch credits separately in MatchPage via `/api/credits/org-balance` or a dedicated endpoint
- (c) Use the `CreditContext` (which exists separately) instead of `profile.credits`

### 2.2 Tier mismatch across systems (DATA CORRUPTION RISK)

The matching system uses one tier vocabulary, the credit system uses another:

| System | Tier values |
|--------|------------|
| `authStore.ts` UserProfile | `free \| pro \| council \| enterprise` |
| `creditService.ts` TIER_CREDITS | `free \| basic \| pro \| council` |
| `CreditContext.tsx` | `free \| basic \| pro \| enterprise` |
| `credits` DB CHECK constraint | `free \| member \| council` |
| `stripeHandler.ts` runtime | `member \| basic \| pro \| council-{id}` |
| `UpgradeModal.tsx` | `basic \| pro \| council` |
| `auth.ts` CreditTier (types) | `free \| member \| pro \| council \| enterprise` |

**Impact:** When `authStore.ts:141,156` sets `tier: 'member'` for new signups, this value violates the `credits` table CHECK constraint (`free | member | council` — actually this one passes) but doesn't match `creditService.ts` which expects `free | basic | pro | council`. The `CreditContext` uses yet another set. Credit lookups will fail or return wrong values depending on which code path executes.

### 2.3 Scoring endpoint has no rate limiting or auth for public mode

**File:** `scoringComputeHandler.ts` — public mode branch  
**Route:** `POST /api/admin/org-intelligence/scoring/compute` with `{ public: true }`

The public mode branch has **zero authentication**. Anyone can call this endpoint repeatedly, consuming DeepSeek API credits. The only guard is a max of 20 candidates per request, but there's no per-user/per-IP rate limit.

**Impact:** Cost exposure — each scoring call hits DeepSeek API. An attacker could run hundreds of scoring requests, burning through API credits.

---

## 3. 🟠 P1 — Serious Issues

### 3.1 Credit deduction happens AFTER scoring (no pre-check on server)

**Flow:**
1. Client checks `creditCost.credits > userCredits` (but userCredits is always 0, see 2.1)
2. Client calls scoring endpoint → scoring runs → DeepSeek API consumed
3. Client then calls `/api/credits/spend` to deduct

**Problem:** If the credit spend fails (network error, DB error), the scoring already happened and API costs were incurred but no credits were deducted. There's no transactional guarantee.

Additionally, the `/api/credits/spend` handler itself has a **race condition**: it does `SELECT balance` then `UPDATE balance - amount` — not atomic. Two concurrent requests could both read the same balance and both succeed, resulting in negative balance.

**Note:** `atomicCreditService.ts` has proper `SELECT FOR UPDATE` + RPC — but it's **never called by any frontend code**.

### 3.2 `handleShareCard` fallback creates fake share URLs

**File:** `MatchPage.tsx:~200`
```ts
catch (e) {
  const shareId = Math.random().toString(36).substring(7);
  const shareUrl = `${window.location.origin}/score-card/${shareId}`;
  navigator.clipboard.writeText(shareUrl);
  toast.success('Shareable link copied to clipboard!');
}
```

When the share API fails, it generates a **random non-functional URL** and tells the user it's a shareable link. This URL leads nowhere — there's no `/score-card/:id` route. This is deceptive UX.

### 3.3 PipelineSaveModal score scaling is wrong

**File:** `PipelineSaveModal.tsx:~90`
```ts
trident_d1: result.dimension_scores?.experience ? result.dimension_scores.experience * 100 : null,
trident_d2: result.dimension_scores?.skills ? result.dimension_scores.skills * 100 : null,
trident_d3: result.dimension_scores?.fit ? result.dimension_scores.fit * 100 : null,
```

The scoring engine returns dimension scores as **0-100 values** (from `projectToLegacy` which maps C1-C5 each 0-20 to legacy dimensions). Multiplying by 100 produces values up to **10,000** — way outside any reasonable TRIDENT score range (0-10 or 0-100). This corrupts pipeline data.

### 3.4 ContactSelector passes `userId={profile?.id}` but component doesn't accept it

**File:** `MatchPage.tsx:~420`
```tsx
<ContactSelector open={...} onClose={...} onSelect={...} userId={profile?.id} />
```

But `ContactSelector` interface is:
```ts
interface ContactSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contacts: Array<...>) => void;
  multi?: boolean;
}
```

No `userId` prop. TypeScript would flag this if strict mode is on. The prop is silently ignored.

---

## 4. 🟡 P2 — Design & UX Issues

### 4.1 Inline styles everywhere — design system inconsistency

MatchPage and its components (JDInput, CandidateList, ResultsTable, ContactSelector, MandateSelector, PipelineSaveModal) all use **inline `style={}` objects** with a local `DS` design token object.

Meanwhile, the matching components in `src/components/matching/` (CandidateMatchPanel, MandateMatchPanel, MatchDetailView, MatchQualityBadge) use **Tailwind classes**.

This means:
- Two completely different styling approaches for "matching" features
- Changes to brand colors/typography require updates in 8+ files
- No shared design tokens between the two systems

### 4.2 No loading state for initial page load

The page starts at `step: 'gate'` immediately. There's no check for whether the user is authenticated or whether Supabase is connected. If the user is not logged in, they'll fill out the gate form, proceed to the engine step, and only fail when trying to score.

### 4.3 Progress bar is cosmetic

```ts
const [progress, setProgress] = useState(0);
// ...
setProgress(0); // at start
// ... scoring happens (no progress updates) ...
setProgress(100); // at end
```

The progress bar jumps from 0% to 100%. It never shows intermediate progress. This is misleading — the user sees "Scoring... 0%" then suddenly "Scoring... 100%".

### 4.4 No confirmation before leaving results page

After scoring completes and results display, if the user clicks "Score More" → `setStep('engine'); setResults([])` — **results are permanently lost** with no confirmation. If the user accidentally clicks this, all scoring results (and the credits spent) are gone.

### 4.5 File upload has no validation beyond size

`handleFileUpload` checks file size (10MB max) and accepts `.pdf,.docx,.txt` but:
- No PDF parsing logic visible — relies entirely on `/api/upload` to extract text
- No error handling if the uploaded file is empty or contains garbage
- No feedback during upload processing (no loading indicator on the button)

---

## 5. 🔵 P3 — Minor Issues

### 5.1 `handleGate` silently ignores lead capture failures

```ts
catch (e) { console.warn('Failed to save lead:', e); }
setStep('engine'); // proceeds regardless
```

If lead capture fails, the user proceeds normally. This is probably intentional (don't block UX for analytics), but the failure is only logged to console — no monitoring/alerting.

### 5.2 Duplicate `DS` design token definitions

The same `DS` object is defined identically in 6+ files. Any brand change requires updating all copies.

### 5.3 `validCandidates` filter runs on every render

```ts
const validCandidates = candidates.filter(c => c.name && c.cv);
const creditCost = getCreditCost(validCandidates.length, isFirstBatch);
```

These are computed inline on every render. Minor performance issue, but `useMemo` would be cleaner.

---

## 6. Data Flow Summary

```
User enters JD + candidates
  → handleRunScoring()
    → Client-side credit check (BROKEN: always 0)
    → POST /api/admin/org-intelligence/scoring/compute { public: true, jd, candidates }
      → handlePublicMode() → callLLM() × N candidates → DeepSeek API
      → Returns { results: [{ composite_score, dimension_scores, match_reasons, ... }] }
    → POST /api/data/scoring-run (persist run metadata)
    → POST /api/credits/spend { userId, amount, action } (BROKEN: race condition)
  → Display results in ResultsTable
    → User can: Download PDF (print dialog), Share Card (broken fallback), Save to Pipeline
      → PipelineSaveModal → POST /api/data/contact (if new) → POST /api/data/pipeline
```

---

## 7. What's Actually Good

1. **The scoring compute endpoint** (`scoringComputeHandler.ts` public mode) is well-structured: proper validation, parallel LLM calls, clean error handling, proper 5-criteria framework.
2. **ContactSelector** has debounced search, good UX with multi-select, displays TRIDENT scores inline.
3. **MandateSelector** similarly well-built with search, status badges, JD preview.
4. **PipelineSaveModal** handles the contact-creation-then-pipeline-insert flow correctly in concept.
5. **ResultsTable** has clean expand/collapse, dimension bars, tier summary cards.
6. **File upload** with drag-and-drop-style accept types and size limits.

---

## 8. Go-Live Readiness

| Criterion | Status |
|-----------|--------|
| Core scoring works | ✅ (if DeepSeek API key configured) |
| Credit deduction works | ❌ (client-side check broken, server race condition) |
| Auth required | ⚠️ (scoring endpoint has no auth in public mode) |
| Results persistence | ⚠️ (scoring-run persist is fire-and-forget) |
| Share functionality | ❌ (fallback creates fake URLs) |
| Pipeline save | ⚠️ (score scaling bug corrupts data) |
| Design consistency | ❌ (inline styles vs Tailwind split) |

**Overall: 3/10 — The core AI scoring works, but the surrounding credit/auth/data-integrity systems are broken. Cannot go live without fixing P0s.**

---

## 9. Recommended Fix Priority

1. **Fix credit balance fetch** — Add credits to UserProfile or use CreditContext
2. **Unify tier names** — Pick one enum, update all files + DB constraints
3. **Add auth to public scoring** — At minimum, require a valid session; ideally use atomicCreditService
4. **Fix PipelineSaveModal score scaling** — Remove the `* 100` multiplication
5. **Fix share fallback** — Either make share API reliable or don't show fake URLs
6. **Migrate inline styles to Tailwind** — Or extract shared DS tokens
