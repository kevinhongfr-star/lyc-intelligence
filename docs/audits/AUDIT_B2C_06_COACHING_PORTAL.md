# B2C Coaching Portal Deep Audit (Pages 6–14)
## LYC Intelligence Platform — Code Audit Series

**Auditor:** NEXUS  
**Date:** 2026-07-20  
**Scope:** `/coaching/*` — 9 pages, 3,117 lines of page code + 5 service files + 2 DB tables  
**Method:** Full source trace — every data flow, every component, every error path, every integration point  
**Overall Score: 2/10**

---

## Executive Summary

The coaching portal is a **UI skin over empty infrastructure**. All 9 pages render polished Tailwind layouts with proper loading states and error handling. However, the data layer behind them is fundamentally broken:

- **Credit balance is always null** — DB columns don't match query
- **Career service status never persists** — target column doesn't exist
- **18 of 25 interactive elements do nothing** — empty onClick handlers
- **Zero AI integration** — "AI recommendations" use keyword matching + Math.random()
- **Market data is fabricated on every render** — Math.random() in production code
- **No booking, no payment, no session management** — all buttons are dead

The coaching portal cannot perform a single real transaction today.

---

## Pages Audited

| # | Route | Component | Lines | Data Queries | Working Interactions |
|---|-------|-----------|-------|--------------|---------------------|
| 6 | `/coaching/coach` | CoachingCoachPage | 319 | 2 | 0 of 3 buttons |
| 7 | `/coaching/credits` | CoachingCreditsPage | 334 | 3 | 0 of 4 buttons |
| 8 | `/coaching/intelligence` | CoachingIntelligencePage | 330 | 2 + 1 service | 1 of 3 (refresh) |
| 9 | `/coaching/career-intel` | CoachingCareerIntelPage | 391 | 2 | 0 of 0 buttons |
| 10 | `/coaching/profile` | CoachingProfileSettingsPage | 361 | 2 | 2 of 8 buttons |
| 11 | `/coaching/chat-features` | CoachingChatFeaturesPage | 427 | 1 | 1 of 2 (chat send) |
| 12 | `/coaching/career-services` | CoachingCareerServicesPage | 235 | 2 | 0 of 5 buttons |
| 13 | `/coaching/engagement` | CoachingEngagementPage | 329 | 3 | 0 of 0 buttons |
| 14 | `/coaching/growth` | CoachingGrowthPage | 391 | 2 | 0 of 1 button |

---

## 🔴 P0 — Critical Bugs (Data Layer Collapsed)

### Bug #1: `user_credits` schema mismatch — credit balance ALWAYS null

**Affected pages:** CoachingCreditsPage, CoachingEngagementPage  
**Root cause:** Column names in query don't exist in table

| Code queries (`supabaseApi.ts:3725`) | Actual column in `user_credits` table |
|--------------------------------------|---------------------------------------|
| `current_credits` | `balance` |
| `used_credits` | `total_spent` |
| `total_purchased` | `total_earned` (different semantics!) |

**Exact code path:**
```
getCoachingCredits(userId)                           // supabaseApi.ts:3723
  → .from('user_credits')
      .select('current_credits, used_credits, total_purchased')
  → Supabase ERROR: column "current_credits" does not exist
  → console.error logged, returns null
```

**User impact:**
- Credits page: ALWAYS shows "No credit data" empty state
- Engagement page: credit metrics ALWAYS empty array → engagement score under-calculated
- No user can ever see their credit balance

**Fix spec:**
```sql
-- Option A: Add the columns the code expects
ALTER TABLE user_credits ADD COLUMN current_credits INTEGER DEFAULT 0;
ALTER TABLE user_credits ADD COLUMN used_credits INTEGER DEFAULT 0;
ALTER TABLE user_credits ADD COLUMN total_purchased INTEGER DEFAULT 0;

-- Option B: Fix the query to use existing columns
-- In supabaseApi.ts:3725, change:
-- .select('current_credits, used_credits, total_purchased')
-- to:
-- .select('balance, total_spent, total_earned')
-- And update CoachingCreditData interface to match
```

---

### Bug #2: `profiles.coaching_services` column doesn't exist — career services never persist

**Affected page:** CoachingCareerServicesPage  
**Root cause:** `careerServicesService.ts` stores status in `profiles.coaching_services` JSON column, which doesn't exist in any migration

**Exact code path:**
```
getUserServiceStatuses(userId)                       // careerServicesService.ts:89
  → .from('profiles').select('coaching_services').eq('id', userId)
  → Returns null (column doesn't exist in SELECT result)
  → Falls back to getDefaultStatuses() → all 'Available'

updateServiceStatus(userId, serviceId, status)       // careerServicesService.ts:112
  → .from('profiles').update({ coaching_services: updated }).eq('id', userId)
  → Supabase ERROR (column doesn't exist)
  → Caught, returns false
  → UI optimistic update shows change, but next page load resets everything
```

**User impact:**
- Clicking "Start" on a service changes UI temporarily
- On page refresh → all services reset to "Available"
- No user progress is ever saved

**Fix spec:**
```sql
-- Add the column
ALTER TABLE profiles ADD COLUMN coaching_services JSONB DEFAULT '{}';

-- Or create a dedicated table (preferred)
CREATE TABLE coaching_service_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  service_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available', 'In Progress', 'Completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, service_id)
);
```

---

### Bug #3: Coaching session INSERT policy missing — users cannot book sessions

**Affected page:** CoachingCoachPage  
**Root cause:** `coaching_sessions` table has SELECT policies but NO INSERT policy

**Policies that exist (migration 20260709):**
- `Coachee can read own sessions` — SELECT ✓
- `Coach can read assigned sessions` — SELECT ✓
- `Admin can read all sessions` — SELECT ✓

**Missing:**
- No INSERT policy for any role
- No UPDATE policy for status changes
- No DELETE policy

**Fix spec:**
```sql
CREATE POLICY "Coachee can create session requests" ON coaching_sessions
  FOR INSERT TO authenticated
  WITH CHECK (coachee_id = auth.uid() AND status = 'scheduled');

CREATE POLICY "Coach can create sessions" ON coaching_sessions
  FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Participants can update session status" ON coaching_sessions
  FOR UPDATE TO authenticated
  USING (coachee_id = auth.uid() OR coach_id = auth.uid());
```

---

### Bug #4: Tier display is wrong on ALL 9 pages

**Affected pages:** All coaching pages  
**Root cause:** Fallback value 'Professional' is not a valid tier

**Code (repeated identically in all 9 files):**
```typescript
const tier = profile?.tier || 'Professional';
// UserProfile.tier type: 'free' | 'pro' | 'council' | 'enterprise'
```

**What actually renders:**
- User with tier='pro' → displays "pro" (lowercase, not human-friendly)
- User with tier='free' → displays "free" (sounds cheap)
- User with no profile → displays "Professional" (not a real tier)

**Fix spec:**
```typescript
const TIER_DISPLAY: Record<string, string> = {
  free: 'Free',
  pro: 'Professional',
  council: 'Council',
  enterprise: 'Enterprise',
};
const tier = TIER_DISPLAY[profile?.tier || 'free'] || 'Free';
```

---

## 🔴 P0 — Fabricated Data in Production

### Issue #5: Market insights use Math.random() — different values every render

**File:** `CoachingCareerIntelPage.tsx:91-96`
```typescript
openings: Math.floor(Math.random() * 500) + 100,        // ← RANDOM
growthRate: `+${Math.floor(Math.random() * 20) + 2}% YoY`, // ← RANDOM
```

**User impact:** "Openings: 347" → refresh → "Openings: 182" — completely unstable

**Fix spec:** Remove Math.random(). Use actual mandate counts or show empty state.

---

### Issue #6: Salary "yourCurrent" is fabricated

**File:** `CoachingCareerIntelPage.tsx:101-108`
```typescript
yourCurrent: Math.round(min * 1.05),  // ← mandate min * 1.05, NOT user's actual salary
```

**Problem:** System has NO user salary data. Takes a random mandate's minimum salary + 5%.

---

### Issue #7: AI Recommendations are keyword matching + random scoring

**File:** `src/services/intelligenceService.ts` (152 lines)
```typescript
const scoreBase = Math.random() * 0.2;  // ← random noise
if (role && role.toLowerCase().includes('engineer')) { ... }  // ← keyword matching
```

**No DeepSeek call, no LLM, no actual AI.**

---

### Issue #8: "You're in the top 15%" claim is fabricated

**File:** `CoachingEngagementPage.tsx:155`  
Hardcoded text — no cohort analysis exists.

---

## ⚠️ P1 — Severe Issues

### Issue #9: Coaching plan tiers don't match ANY existing system (6th incompatible naming)

| CoachingCreditsPage | UserProfile.tier | Master Spec |
|---------------------|------------------|-------------|
| Starter ($49) | free | Free |
| Growth ($129) | pro | Starter |
| Elite ($299) | council | Growth |
| — | enterprise | Elite |
| — | — | Corporate |

### Issue #10: "This Month" stats are hardcoded (Credits page, lines 175-186)
### Issue #11: Weekly Pulse data is 100% static (Intelligence page, lines 169-185)
### Issue #12: Achievement unlock dates use today(), not actual completion dates
### Issue #13: Coach identity is always "Your Coach" / "CO" — never fetches real profile

---

## ⚠️ P1 — Dead Buttons (18 non-functional interactive elements)

| Page | Element | Expected Behavior |
|------|---------|-------------------|
| Coach | "Book Session" (×2) | Open booking flow |
| Coach | "Message Coach" | Open chat |
| Coach | "Join" (session card) | Join video call |
| Credits | "Buy Credits" | Stripe checkout |
| Credits | "View Plans" | Scroll to plans |
| Credits | "Switch Plan" / "Upgrade" | Plan change flow |
| Intelligence | "Quick Wins" (×3) | Execute action |
| Career Services | "Get Started" (×3) | Checkout |
| Career Services | "Start" / "Continue" (×6) | Begin service |
| Growth | "Add Milestone" | Open form |
| Profile | "Change Password" | Password flow |
| Profile | "Two-Factor Auth" | 2FA setup |
| Profile | "Email Preferences" | Email prefs |

Only 5 interactive elements work: notification toggles (2), profile name edit (1), chat send (1), feature filter (1).

---

## Database Schema Issues Summary

| Table/Column | Status | Impact |
|-------------|--------|--------|
| `coaching_sessions` INSERT policy | ❌ MISSING | No one can create sessions |
| `coaching_sessions` UPDATE policy | ❌ MISSING | No one can update status |
| `user_credits.current_credits` | ❌ WRONG COLUMN | Credits always null |
| `user_credits.used_credits` | ❌ WRONG COLUMN | Credits always null |
| `user_credits.total_purchased` | ❌ WRONG COLUMN | Credits always null |
| `profiles.coaching_services` | ❌ COLUMN MISSING | Service status never persists |
| `coaching_plans` table | ❌ NOT CREATED | No subscription tracking |
| `coaching_milestones` table | ❌ NOT CREATED | No user-defined goals |
| `coaching_messages` table | ❌ NOT CREATED | No coach-coachee chat |

---

## Scoring by Page

| Page | Score | Rationale |
|------|-------|-----------|
| Coach | 3/10 | Sessions display works; coach identity fake, booking absent, 3 dead buttons |
| Credits | 1/10 | Core query fails, plans mismatch, 4 dead buttons, hardcoded stats |
| Intelligence | 2/10 | AI is keyword matching, pulse is static, quick wins dead |
| Career Intel | 2/10 | Market data random, salary fabricated |
| Profile | 5/10 | Best page — name + notifications work. 3 dead buttons, minimal fields |
| Chat Features | 3/10 | Chat UI polished but no AI, translation does nothing |
| Career Services | 1/10 | DB column missing, status never persists, all buttons dead |
| Engagement | 2/10 | Credit metrics always empty, "top 15%" fabricated |
| Growth | 3/10 | Milestones from real data, but achievements use today(), add button dead |

**Coaching Portal Overall: 2/10**

---

## B2C Audit Progress

| Page | Area | Score | Audit File |
|------|------|-------|------------|
| 1 | Landing (`/b2c`) | 5/10 | AUDIT_B2C_01_LANDING.md |
| 2 | Assessment (`/assessment`) | 4/10 | AUDIT_B2C_02_ASSESSMENT.md |
| 3 | Nexus (`/nexus`) | 4/10 | AUDIT_B2C_03_NEXUS.md |
| 4 | Pricing & Monetization | 2/10 | AUDIT_B2C_04_PRICING.md |
| 5 | Match (`/match`) | 3/10 | AUDIT_B2C_05_MATCH.md |
| 6-14 | Coaching Portal (9 pages) | 2/10 | AUDIT_B2C_06_COACHING_PORTAL.md |

**Remaining B2C:** `/dex/chat`, `/lms/dashboard`

---

*End of B2C Coaching Portal Deep Audit*
*Next: B2C DEX + LMS pages, then B2C portal summary, then Candidate portal*
