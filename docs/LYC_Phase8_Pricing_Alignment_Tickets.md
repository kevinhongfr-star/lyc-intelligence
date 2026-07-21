# Phase 8: Pricing Architecture Alignment (CD-11)

**Date:** 2026-07-21
**Source:** CD-11 Council Pricing & Membership Architecture + Pricing Architecture Document
**Scope:** Public website simplification + Gated member portal
**Principle:** "Pricing is not published publicly. It is shared in proposals and direct conversations."

---

## Part A: Public Website Changes (Simplify)

### T-801: Rewrite Council Landing Page
**Priority:** P0 | **Est:** 4h | **File:** `src/pages/council/CouncilLandingPage.tsx`

**Current state:** 4-tier CNY pricing grid (Founding/Individual/Corporate/PE Partner)
**Target:** Prestige-focused, invitation-only positioning. No prices.

**Changes:**
- Remove entire `TIERS` array and pricing grid component
- Replace with aspirational copy: what Council means, who it's for
- Key sections: Vision → Experience → Membership Journey → "Request Invitation" CTA
- Keep high-level benefits (content & events, coaching, peer groups) as non-priced value props
- Lead capture form for "Request Invitation" → Supabase `contact_requests` table
- Brand: ink wash aesthetic, serif headings, no transactional language

---

### T-802: Convert Public Pricing Page to "How We Work"
**Priority:** P0 | **Est:** 3h | **File:** `src/pages/public/PublicPricingPage.tsx`

**Current state:** 3 consumer tiers ($199/$499/$999) with free trial, cancel anytime
**Target:** "How We Work" page — diagnostic→assessment→advisory journey, no prices

**Changes:**
- Rename page component to `HowWeWorkPage` or `ProcessPage`
- Remove all pricing cards, billing toggle, FAQ about pricing
- New content flow:
  1. **Discover** — Free tier / lead-gen (assessment teaser, newsletter)
  2. **Diagnose** — 9 instruments overview (what they measure, sample report preview)
  3. **Develop** — Advisory retainer, coaching, workshops (concept only)
  4. **Belong** — Council membership (invitation, community)
- CTAs: "Start Assessment" / "Request Consultation" / "Apply for Council"
- Update route in `App.tsx`: `/pricing` → redirect to `/how-we-work` or remove

---

### T-803: Gate Council Tiers Page
**Priority:** P1 | **Est:** 1h | **File:** `src/pages/council/CouncilTiersPage.tsx`

**Current state:** Public 4-tier CNY comparison table
**Target:** Gated behind authentication, accessible only to logged-in members

**Changes:**
- Add auth check: redirect to `/login` if not authenticated
- Keep component as-is for now (internal member portal will redesign it later)
- Update `App.tsx` route: wrap in `ProtectedRoute` or `MemberRoute`
- Add nav guard: remove `/council/tiers` from any public-facing navigation

---

### T-804: Update Public FAQ Page
**Priority:** P1 | **Est:** 2h | **File:** `src/pages/public/PublicFaqPage.tsx`

**Current state:** FAQ includes pricing questions ("Is there a refund policy?", tier switching)
**Target:** Remove all pricing-related Q&As. Keep process/verification/confidentiality.

**Changes:**
- Remove FAQ items about: pricing, refund policy, tier switching, free trial
- Add/keep FAQ items about:
  - "How are executives verified?"
  - "How is my data handled?"
  - "What happens after I complete an assessment?"
  - "How do I get invited to the Council?"
  - "What's included in a diagnostic report?"
- Update tone: authoritative, not transactional

---

## Part B: Gated Member Portal (Build)

### T-805: Council Benefits Dashboard
**Priority:** P0 | **Est:** 8h | **New file:** `src/pages/council/CouncilDashboardPage.tsx`

**Purpose:** Logged-in members see their personalized benefits, tier status, and available features.

**Data model (Supabase):**
```sql
ALTER TABLE profiles ADD COLUMN council_tier TEXT CHECK (council_tier IN ('next_gen', 'core', 'insider'));
ALTER TABLE profiles ADD COLUMN council_join_date DATE;
ALTER TABLE profiles ADD COLUMN council_status TEXT DEFAULT 'active'; -- active, grace_period, cancelled, renewed
```

**UI sections:**
- Welcome header (tier badge, join date, days active)
- Benefits checklist (tier-gated: what's unlocked, what's locked)
- Upcoming events (workshops, roundtables, webinars)
- Quick actions: Book diagnostic, Schedule coaching, View reports
- Tier upgrade CTA (if applicable)

---

### T-806: Catalyst Points Tracker
**Priority:** P1 | **Est:** 6h | **New file:** `src/components/council/CatalystPoints.tsx`

**Purpose:** Gamified engagement currency. Members earn points, unlock status levels.

**Data model:**
```sql
CREATE TABLE catalyst_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  points_earned INT NOT NULL,
  points_source TEXT NOT NULL, -- 'assessment_complete', 'event_attend', 'workshop_host', 'referral', 'coaching_session'
  earned_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN catalyst_total INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN catalyst_status TEXT DEFAULT 'seedling'; -- seedling, grower, builder, leader, master
```

**UI:**
- Points balance (total earned, status level)
- Progress bar to next status level
- Earning history (recent activity)
- "How to earn more" section (tier-appropriate)
- Status badge display

**Status thresholds (from CD-11):**
- Seedling: 0-99 pts
- Grower: 100-299 pts
- Builder: 300-599 pts
- Leader: 600-999 pts
- Master: 1000+ pts

---

### T-807: Member Pricing & Proposals View
**Priority:** P1 | **Est:** 6h | **New file:** `src/pages/council/CouncilPricingPage.tsx`

**Purpose:** Gated page showing diagnostic pricing, interpretation rates, bundles, workshop pricing — only visible to authenticated members.

**Sections (from CD-12 + CD-13 + Pricing Architecture):**
- Individual diagnostic pricing (9 instruments)
- Professional interpretation rates (tiered by instrument)
- Council member discounts (stacked by tier)
- Diagnostic + interpretation bundles
- Workshop pricing (half-day rates)
- Advisory retainer packages

**Note:** This replaces the public `PublicPricingPage.tsx` for members. Internal pricing from the Pricing Architecture Document goes here.

---

### T-808: Onboarding Checklist
**Priority:** P2 | **Est:** 5h | **New file:** `src/components/council/OnboardingChecklist.tsx`

**Purpose:** Structured Day 0→7→14→30 onboarding flow for new Council members.

**Data model:**
```sql
CREATE TABLE onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  step_name TEXT NOT NULL,
  step_day INT NOT NULL, -- 0, 7, 14, 30
  completed_at TIMESTAMPTZ,
  notes TEXT
);
```

**Steps (from CD-11):**
- Day 0: Welcome email sent ✅, Digital card issued ✅, Portal credentials ✅
- Day 0-7: Welcome Collection status (shipped/delivered)
- Day 7: Onboarding call scheduled/completed
- Day 14: First webinar invitation sent
- Day 30: First check-in completed, First diagnostic recommended

**UI:** Checklist with progress, timestamps, action buttons for pending items

---

### T-809: Digital Badge & Membership Card
**Priority:** P2 | **Est:** 5h | **New file:** `src/components/council/MembershipCard.tsx`

**Purpose:** Visual membership credential members can display/share.

**Features:**
- Card design: tier color/badge, member name, join date, status level
- Downloadable image (PNG/SVG) for social media
- Share link for LinkedIn profile integration
- QR code linking to member profile (if public-facing)
- Tier-specific styling (Next Gen, Core, Insider visual differentiation)

---

## Part C: Infrastructure

### T-810: Auth Gating for Council Routes
**Priority:** P0 | **Est:** 2h | **File:** `src/App.tsx` + new `src/components/auth/MemberRoute.tsx`

**Changes:**
- Create `MemberRoute` wrapper: checks auth + council tier
- Apply to: `/council/tiers`, `/council/dashboard`, `/council/pricing`, `/council/onboarding`
- Redirect to `/login` if unauthenticated
- Redirect to `/council/apply` if authenticated but no tier

---

### T-811: Supabase Schema for Council Membership
**Priority:** P0 | **Est:** 3h

**Tables/alterations:**
```sql
-- Profile extensions
ALTER TABLE profiles ADD COLUMN council_tier TEXT;
ALTER TABLE profiles ADD COLUMN council_status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN council_join_date DATE;
ALTER TABLE profiles ADD COLUMN catalyst_total INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN catalyst_status TEXT DEFAULT 'seedling';

-- Catalyst points ledger
CREATE TABLE catalyst_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  points_earned INT NOT NULL,
  points_source TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Onboarding tracking
CREATE TABLE onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  step_name TEXT NOT NULL,
  step_day INT NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT
);
```

---

## Sprint Plan

### Sprint 1 (Week 1): Public Cleanup
- T-801: Council Landing rewrite (4h)
- T-802: How We Work page (3h)
- T-804: FAQ cleanup (2h)
- T-803: Gate Council Tiers (1h)
- **Total: ~10h**

### Sprint 2 (Week 2): Infrastructure + Dashboard
- T-811: Supabase schema (3h)
- T-810: Auth gating (2h)
- T-805: Council Dashboard (8h)
- **Total: ~13h**

### Sprint 3 (Week 3): Member Features
- T-806: Catalyst Points (6h)
- T-807: Member Pricing (6h)
- T-808: Onboarding Checklist (5h)
- T-809: Digital Badge (5h)
- **Total: ~22h**

---

## Grand Total: ~45h (11 tickets)

## Dependencies
- T-801/802/803/804 can run in parallel
- T-805/806/807/808/809 depend on T-811 (schema) and T-810 (auth gating)
- T-807 (Member Pricing) needs CD-12 finalized
- T-809 (Badge) needs design mockup approval
