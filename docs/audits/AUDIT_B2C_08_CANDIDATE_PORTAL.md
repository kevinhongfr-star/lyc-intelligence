# B2C Audit #8: Candidate Portal (19 Pages)

**Date:** 2026-07-21  
**Auditor:** NEXUS  
**Pages audited:** All 19 candidate portal pages (6,440 lines total)  
**Overall Score: 2.5/10**

---

## Executive Summary

The Candidate Portal is a sprawling 19-page application that attempts to be everything: job board, assessment center, career coach, community forum, document manager, and offer negotiation tool. The result is a fragmented experience where most features are UI shells with minimal backend integration. The portal uses hardcoded mock data extensively, lacks credit system integration, and references the wrong assessment framework (not SHIFT).

**Critical issues:**
- **No credit system integration** — assessments, content, and features don't check or deduct credits
- **Wrong assessment framework** — uses "TRIDENT" and custom dimensions, not SHIFT (LEAP/QUEST/COACH/DRIVE/IMPACT)
- **Extensive hardcoded mock data** — most pages render static content instead of real data
- **Duplicate portal implementations** — CandidatePortalV2Page vs. other candidate pages (unclear which is canonical)
- **No NEXUS AI integration** — CandidateNexusCoachPage uses client-side mock AI, not the real DeepSeek pipeline
- **Privacy/confidentiality gaps** — no indication of data encryption or access controls

---

## Pages Audited

| # | Page | Lines | Score | Status |
|---|------|-------|-------|--------|
| 1 | CandidateLandingPage | 333 | 5/10 | Static marketing page, decent |
| 2 | CandidateDashboardPage | 356 | 3/10 | Hardcoded mock data |
| 3 | CandidateProfilePage | 421 | 2/10 | Form exists but validation incomplete |
| 4 | CandidateAssessmentsPage | 267 | 2/10 | Wrong framework, no credit check |
| 5 | CandidateAdvancedAssessmentsPage | 285 | 2/10 | Wrong framework, no credit check |
| 6 | CandidateApplicationsPage | 265 | 4/10 | Real data but limited features |
| 7 | CandidateOpportunitiesPage | 265 | 4/10 | Real data but limited features |
| 8 | BrowseMandatesPage | 454 | 4/10 | Real data but limited features |
| 9 | MandateDetailPublicPage | 409 | 5/10 | Public mandate view, decent |
| 10 | CandidateDocumentsPage | 345 | 3/10 | Upload exists but validation weak |
| 11 | CandidateMessagesPage | 311 | 3/10 | Basic messaging, no encryption mention |
| 12 | CandidateNexusCoachPage | 339 | 1/10 | Mock AI, no real integration |
| 13 | CandidateCareerDevPage | 295 | 2/10 | Hardcoded goals/milestones |
| 14 | CandidateCommunityPage | 562 | 4/10 | Real forum data via forumService |
| 15 | CandidateInterviewPrepPage | 315 | 5/10 | Static educational content, decent |
| 16 | CandidateOffersPage | 290 | 3/10 | Real data but no negotiation tools |
| 17 | CandidateLifecyclePage | 300 | 2/10 | Admin-only page in candidate portal? |
| 18 | CandidateSettingsPlusPage | 384 | 3/10 | Basic settings, no privacy controls |
| 19 | CandidatePortalV2Page | 244 | 2/10 | Duplicate dashboard with hardcoded data |

---

## 🔴 P0 — Critical Bugs

### 1. No credit system integration anywhere
**Files affected:** All assessment pages, content pages, NEXUS coach  
**Problem:** None of the candidate portal pages check credit balance or deduct credits for paid features. The spec v2.0 requires credits for assessments (30 credits each), reports (15 credits), content (5-10 credits), and benchmarking (25 credits/month).  
**Impact:** Zero revenue collection. All features are effectively free.  
**Fix:** Integrate CreditContext or creditService into all paid-feature pages. Add credit gates before assessment start, report generation, content access.

### 2. Wrong assessment framework (not SHIFT)
**Files:** CandidateAssessmentsPage, CandidateAdvancedAssessmentsPage  
**Problem:** Uses "Leadership", "Cognitive", "Career", "Soft Skills" categories. Spec requires SHIFT stack (LEAP, QUEST, COACH, DRIVE, IMPACT) + BRIDGE + SPARK.  
**Impact:** Assessment results are meaningless. Cannot integrate with Notion-defined scoring algorithms.  
**Fix:** Replace with SHIFT assessment components. Import questions from Notion Question Bank DB.

### 3. CandidateNexusCoachPage uses mock AI
**File:** `src/pages/candidate/CandidateNexusCoachPage.tsx`  
**Problem:** Uses hardcoded responses and client-side logic. Does NOT call the real NEXUS API or DeepSeek.  
**Code:**
```tsx
const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'assistant', content: 'Hi! I\'m NEXUS Coach, your personal AI career advisor...' }
];
// ... no API calls, just static responses
```
**Impact:** Completely non-functional. Users expect AI coaching but get canned responses.  
**Fix:** Replace with NexusChat component (used in ClientNexusAssistantPage). Wire to DeepSeek API via nexusChatHandler.

### 4. CandidatePortalV2Page is a duplicate dashboard
**File:** `src/pages/candidate/CandidatePortalV2Page.tsx` (244 lines)  
**Problem:** Hardcoded opportunities, notifications, and user data ("Welcome back, Sarah"). No real data integration. Unclear why this exists alongside CandidateDashboardPage.  
**Impact:** Confusing UX. Two dashboards with different data sources.  
**Fix:** Delete CandidatePortalV2Page. Consolidate into CandidateDashboardPage.

### 5. CandidateLifecyclePage is admin-only but in candidate portal
**File:** `src/pages/candidate/CandidateLifecyclePage.tsx`  
**Problem:** This page manages auto-stage transitions and lifecycle rules — clearly an admin/consultant tool, not a candidate feature. It queries `useAuthStore` and manages candidate stages.  
**Impact:** Candidates shouldn't see internal workflow automation. Security/privacy risk.  
**Fix:** Move to `/internal/` or `/admin/` directory. Restrict access via RBAC.

---

## 🟠 P1 — Serious Issues

### 1. Hardcoded mock data throughout
**Pages affected:** CandidateDashboardPage, CandidateCareerDevPage, CandidatePortalV2Page  
**Problem:** These pages use hardcoded arrays instead of fetching real data from Supabase. Example:
```tsx
// CandidatePortalV2Page.tsx
const OPPORTUNITIES: Opportunity[] = [
  { id: 'opp-1', title: 'VP Engineering', company: 'Apex Digital', ... }
];
```
**Impact:** Users see fake data. No real functionality.  
**Fix:** Replace with real Supabase queries. Use existing `getOpenMandates()`, `getOffers()`, etc.

### 2. No confidentiality/privacy controls
**Pages affected:** CandidateProfilePage, CandidateSettingsPlusPage  
**Problem:** No UI for controlling who can see the candidate's profile, assessments, or activity. No indication of data encryption. The spec emphasizes confidentiality as a key differentiator.  
**Impact:** Candidates won't trust the platform with sensitive career data.  
**Fix:** Add privacy settings (profile visibility, assessment sharing, data export/deletion). Display "Confidentiality Promise" in onboarding.

### 3. CandidateAssessmentsPage shows wrong assessment types
**File:** `src/pages/candidate/CandidateAssessmentsPage.tsx`  
**Problem:** Shows "Leadership", "Cognitive", "Career", "Soft Skills" categories. Spec requires SHIFT stack (LEAP, QUEST, COACH, DRIVE, IMPACT).  
**Code:**
```tsx
const CATEGORY_OPTIONS = ['All Categories', 'Leadership', 'Cognitive', 'Career', 'Soft Skills'];
```
**Impact:** Users see assessments that don't match the spec. Results are meaningless.  
**Fix:** Replace with SHIFT assessment catalog. Use Notion-defined frameworks.

### 4. No credit earning/reward system
**Pages affected:** All candidate pages  
**Problem:** The spec defines credit earning actions (framework exploration: 5 credits, content engagement: 2 credits, reflection prompts: 3 credits, referrals: 25 credits, assessment completion: 10 credits refund). None of these are implemented.  
**Impact:** Users cannot earn credits. The "earned middle layer" doesn't exist.  
**Fix:** Implement engagement event tracking. Award credits for completed actions.

### 5. No Engagement Cycles (gamification)
**Pages affected:** All candidate pages  
**Problem:** The spec defines Engagement Cycles (Curious → Developing → Established → Authority) based on quarterly arcs. No candidate page shows maturity stage or progression.  
**Impact:** No gamification. Users don't see progress or unlocks.  
**Fix:** Add maturity indicator to dashboard. Show current stage, criteria, and unlocks.

---

## 🟡 P2 — Design & UX Issues

### 1. Inconsistent design patterns
**Problem:** Some pages use `@/components/ui` (Card, Button, Badge), others use `@/components/design-system` (Heading, Paragraph, Container). Inline styles mixed with Tailwind.  
**Impact:** Visual inconsistency. Hard to maintain.  
**Fix:** Standardize on `@/components/ui` + Tailwind. Remove `@/components/design-system` usage.

### 2. Missing loading states
**Pages affected:** CandidateDashboardPage, CandidateProfilePage  
**Problem:** Some pages show empty states during data fetch instead of loading skeletons.  
**Impact:** Poor UX. Users think the page is broken.  
**Fix:** Add loading skeletons or spinners during data fetch.

### 3. No error handling for failed API calls
**Pages affected:** Multiple pages  
**Problem:** Most pages have `try/catch` but only log to console. No user-facing error messages.  
**Impact:** Users don't know why data isn't loading.  
**Fix:** Show error toasts or inline error messages.

### 4. CandidateCommunityPage is surprisingly functional
**File:** `src/pages/candidate/CandidateCommunityPage.tsx` (562 lines)  
**Positive:** Uses real `forumService` for categories, threads, posts. Has thread creation, reply, upvote, view tracking.  
**Note:** This is one of the few candidate pages with real backend integration.

---

## 🔵 P3 — Minor Issues

### 1. CandidateInterviewPrepPage uses emoji icons
**File:** `src/pages/candidate/CandidateInterviewPrepPage.tsx`  
**Problem:** Uses emoji for category icons (💬, 🧭, 🧩, ⚙️). Brand rules say "no emoji".  
**Fix:** Replace with Lucide icons.

### 2. CandidateOffersPage has static negotiation tips
**File:** `src/pages/candidate/CandidateOffersPage.tsx`  
**Problem:** `STATIC_TIPS` array is hardcoded. Should be fetched from Notion Deliverables DB or content library.  
**Fix:** Integrate with content library. Allow credit-gated access to premium tips.

### 3. Duplicate import patterns
**Problem:** Some pages import from `@/services/supabaseApi`, others from `@/lib/supabase`. Inconsistent.  
**Fix:** Standardize on `@/services/supabaseApi`.

---

## Data Flow Analysis

### Current Flow (Broken)
```
CandidateLandingPage (static marketing)
  → User signs up → CandidateDashboardPage (hardcoded data)
  → CandidateAssessmentsPage (wrong framework, no credit check)
  → CandidateNexusCoachPage (mock AI, no real integration)
  → CandidateCommunityPage (real forum data ✅)
  → CandidateProfilePage (form exists, validation incomplete)
```

### Expected Flow (per spec v2.0)
```
CandidateLandingPage (static marketing)
  → User signs up → Free tier (sample insights, benchmark teasers, 5-question Taste)
  → Upgrade to Explorer (€5/mo) → Unlimited NEXUS conversations (real DeepSeek API)
  → Upgrade to Developer (€50/mo = 500 credits) → Full SHIFT assessments, reports, content
  → Earn credits through engagement (framework exploration, content, referrals)
  → Track Engagement Cycles (Curious → Developing → Established → Authority)
  → Optional: Human coaching packages (€1,250-9,000)
```

---

## What's Actually Good

1. **CandidateCommunityPage** — Real forum integration via `forumService`. Functional thread creation, replies, upvotes.
2. **CandidateApplicationsPage** — Real data from `getCandidateApplications()`. Proper status mapping.
3. **CandidateOpportunitiesPage** — Real mandate data from `getOpenMandates()`. Good compensation parsing.
4. **CandidateInterviewPrepPage** — Well-structured educational content. Good UX with difficulty labels.
5. **MandateDetailPublicPage** — Clean public mandate view. No auth required. Good for SEO.

---

## Go-Live Readiness

| Criterion | Status |
|-----------|--------|
| Core assessment flow | ❌ (wrong framework, no credits) |
| NEXUS AI integration | ❌ (mock AI) |
| Credit system | ❌ (not integrated) |
| Privacy/confidentiality | ❌ (no controls) |
| Real data integration | ⚠️ (some pages, not all) |
| Engagement tracking | ❌ (not implemented) |
| Design consistency | ⚠️ (mixed patterns) |

**Overall: 2.5/10 — The candidate portal is a collection of UI shells with minimal real functionality. Requires complete rewrite of assessment flow, NEXUS integration, credit system, and privacy controls.**

---

## Recommended Fix Priority

1. **Replace CandidateNexusCoachPage with NexusChat component** (critical — non-functional AI)
2. **Integrate credit system into all assessment/content pages** (critical — zero revenue)
3. **Replace assessment framework with SHIFT stack** (critical — wrong assessments)
4. **Delete CandidatePortalV2Page** (duplicate, hardcoded data)
5. **Move CandidateLifecyclePage to admin area** (wrong audience)
6. **Add privacy/confidentiality controls** (key differentiator per Willy Te)
7. **Implement Engagement Cycles gamification** (per spec)
8. **Replace hardcoded mock data with real Supabase queries** (all dashboard pages)
9. **Standardize design patterns** (remove design-system, use ui + Tailwind)
10. **Implement credit earning system** (per spec)
