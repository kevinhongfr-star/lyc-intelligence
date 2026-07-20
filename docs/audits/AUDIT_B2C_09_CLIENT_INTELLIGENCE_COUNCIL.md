# B2C Audit #9: Client Portal + Intelligence + Council Pages

**Date:** 2026-07-21  
**Auditor:** NEXUS  
**Pages audited:** 29 pages across 3 portal areas  
- Client Portal: 11 pages (2,860 lines)
- Intelligence: 6 pages (2,054 lines)
- Council: 12 pages (4,806 lines, minus DexChatPage already in Audit #7)

**Backend files reviewed:**
- `api/_lib/creditsHandler.ts` (551 lines)
- `api/_lib/stripeHandler.ts` (1,028 lines)
- `api/_lib/clientPortalV2Handler.ts` (929 lines)
- `api/_lib/intelligenceHandler.ts` (1,399 lines)
- `src/services/creditService.ts` (196 lines)
- `src/services/atomicCreditService.ts` (296 lines)

**Overall Score: 2.5/10**

---

## Executive Summary

Three distinct portal areas with different levels of brokenness:

- **Client Portal (3/10):** Best of the three. Most pages use real Supabase queries and have functional data flows. ClientNexusAssistantPage correctly uses the NexusChat component. Main issues: hardcoded security settings, no credit integration, and ClientAdminPage has non-functional toggles.

- **Intelligence Pages (2/10):** Half-static, half-functional. CompanyIntelligencePage and IntelligenceDashboardPage are wired to real APIs. ApacQuarterlyReportPage, CohortReportPage, and MonthlyBriefingPage are entirely hardcoded static content. AIInsightsPage uses a fake ML service.

- **Council Pages (2/10):** Most critically broken area. Pricing is completely misaligned with spec v2.0. CouncilTiersPage uses CNY annual pricing (¥2,800-25,000/yr) vs spec v2.0's EUR monthly (€5-100/mo). CreditStorePage sells "DEX AI credits" in USD. UpgradeModal has a third pricing system. CouncilCredits are separate from DEX AI credits — dual credit system contradicts spec v2.0's unified credit pool.

---

## Part 1: Client Portal (Score: 3/10)

### Pages Audited

| # | Page | Lines | Score | Data Source |
|---|------|-------|-------|-------------|
| 1 | ClientOverviewPage | 236 | 4/10 | Real Supabase (getMandates, fetchClientActivity) |
| 2 | ClientMandatesPage | 194 | 4/10 | Real Supabase (getMandates) |
| 3 | ClientMandateDetailPage | 728 | 5/10 | Real API (clientPortalV2Handler) |
| 4 | ClientCandidatesPage | 199 | 4/10 | Real Supabase (searchContacts) |
| 5 | ClientDocumentsPage | 174 | 3/10 | Real Supabase (getDocuments) but limited |
| 6 | ClientCollaborationPage | 252 | 4/10 | Real collaborationService |
| 7 | ClientOnboardingPage | 277 | 3/10 | Real API (getClientOnboardingStatus) |
| 8 | ClientTalentIntelPage | 239 | 3/10 | Real API but limited |
| 9 | ClientPipelineAnalyticsPage | 159 | 2/10 | Hardcoded analytics data |
| 10 | ClientAdminPage | 378 | 2/10 | Hardcoded security settings |
| 11 | ClientNexusAssistantPage | 24 | 5/10 | Real NexusChat component ✅ |

### Client Portal Issues

**P1:**
1. **ClientAdminPage security settings are fake** — All toggles are local state only. `DEFAULT_SETTINGS` is hardcoded, no backend persistence. Toggling "Two-Factor Authentication" does nothing.
2. **ClientPipelineAnalyticsPage uses hardcoded data** — No real analytics queries. Charts render fake numbers.
3. **No credit integration** — None of the client pages check or display credit balance.

**P2:**
1. **ClientDocumentsPage shows "Invoice" and "Contract" types** — These document types don't exist in the spec v2.0 (which focuses on assessment reports, not billing).
2. **ClientCollaborationPage** — Uses `collaborationService` which may not have a proper backend.
3. **ClientNexusAssistantPage** — Only 24 lines. Minimal wrapper. Good integration but no credit gating.

**What's good:**
- ClientMandateDetailPage (728 lines) is the most polished page in the entire portal. Real API integration, proper loading states, 4-tab layout, interview scheduling, collaboration.
- ClientNexusAssistantPage correctly uses the NexusChat component — the ONLY NEXUS integration that works across all portals.

---

## Part 2: Intelligence Pages (Score: 2/10)

### Pages Audited

| # | Page | Lines | Score | Data Source |
|---|------|-------|-------|-------------|
| 1 | CompanyIntelligencePage | 430 | 4/10 | Real API (/api/intelligence/company/:id) |
| 2 | IntelligenceDashboardPage | 380 | 4/10 | Real API (/api/intelligence/signals) |
| 3 | AIInsightsPage | 360 | 1/10 | Fake ML service (Math.random) |
| 4 | ApacQuarterlyReportPage | 320 | 2/10 | Hardcoded static content |
| 5 | CohortReportPage | 280 | 2/10 | Hardcoded cohort data |
| 6 | MonthlyBriefingPage | 284 | 2/10 | Hardcoded briefing data |

### Intelligence Issues

**P0:**
1. **AIInsightsPage uses Math.random() for ML predictions** — "Confidence" scores are fabricated. Anomaly detection is random. This is dangerous if users act on fake ML insights.

**P1:**
1. **Three pages are entirely static** — ApacQuarterlyReportPage, CohortReportPage, MonthlyBriefingPage have hardcoded data arrays. No CMS, no Notion sync, no dynamic content.
2. **Intelligence pages don't map to spec v2.0** — Spec defines "Content Library" and "Peer Benchmarking" as credit-gated features. Intelligence pages have no credit integration.

**P2:**
1. **CompanyIntelligencePage** is the most functional — real API calls, proper data display with signals, leadership, financials, news.
2. **IntelligenceDashboardPage** — Real signal dashboard with filtering, triage actions. Good design.

---

## Part 3: Council Pages (Score: 2/10)

### Pages Audited

| # | Page | Lines | Score | Data Source |
|---|------|-------|-------|-------------|
| 1 | CouncilLandingPage | 500+ | 3/10 | Static marketing + hardcoded FAQ |
| 2 | CouncilTiersPage | 596 | 1/10 | WRONG PRICING — CNY annual vs spec EUR monthly |
| 3 | CreditStorePage | 596 | 1/10 | WRONG PRICING — USD DEX AI credits, 12-month expiry |
| 4 | CouncilDashboardPage | 400+ | 3/10 | Partial real data |
| 5 | CouncilCoachingPage | 350+ | 2/10 | Hardcoded coaching options |
| 6 | CouncilCommunityPage | 300+ | 3/10 | Forum integration |
| 7 | CouncilBenefitsPage | 250+ | 3/10 | Static benefit descriptions |
| 8 | CouncilDirectoryPage | 300+ | 2/10 | Hardcoded member directory |
| 9 | CouncilEventDetailPage | 200+ | 3/10 | Real event data |
| 10 | CouncilProfilePage | 350+ | 3/10 | Partial real data |
| 11 | SignalCouncilBriefingPage | 200+ | 2/10 | Static content |
| 12 | DexChatPage | 492 | 3/10 | Mock AI (already in Audit #7) |

### 🔴 CRITICAL: Five Different Pricing Systems

The council/pricing area has **FIVE completely incompatible pricing systems**:

| System | File | Tiers | Currency | Billing |
|--------|------|-------|----------|---------|
| **CouncilTiersPage** | council/CouncilTiersPage.tsx | Founding ¥2,800 / Individual ¥3,800 / Corporate ¥12,000 / PE ¥25,000 | CNY | Annual |
| **CreditStorePage** | council/CreditStorePage.tsx | Starter $9.99 / Professional $39.99 (DEX AI credits) | USD | One-time |
| **PublicPricingPage** | public/PublicPricingPage.tsx | Individual $199 / Council Member $499 / Council Fellow $999 | USD | Monthly |
| **UpgradeModal** | credits/UpgradeModal.tsx | Basic $19 / Pro $49 / Council $199 (999999 credits) | USD | Monthly |
| **Spec v2.0 (APPROVED)** | docs/specs/..._v2.md | Free €0 / Explorer €5 / Developer €50 / Executive €100 | EUR | Monthly |

**Plus a dual credit system:**
- "DEX AI credits" (CreditStorePage) — separate from "Council Credits"
- `atomicCreditService.ts` tracks `dex_credits` and `council_credits` separately
- Spec v2.0 requires a **single unified credit pool**

**This is the most critical issue in the entire codebase. Zero revenue can flow correctly because no two systems agree on what anything costs.**

### Council Issues

**P0:**
1. **All pricing is wrong** — Five incompatible systems. Must be unified to spec v2.0.
2. **Dual credit system** — "DEX AI credits" separate from "Council Credits" contradicts spec v2.0 unified pool.
3. **CreditStorePage says credits expire after 12 months** — Spec v2.0 explicitly says "Credits NEVER expire."
4. **CouncilTiersPage says "Executive Introduction"** (first 5 DEX AI messages free) — Spec v2.0 says free tier gets static pages only; €5/mo Explorer gets NEXUS conversations.

**P1:**
1. **CouncilDirectoryPage uses hardcoded member data** — No real Supabase queries.
2. **CouncilCoachingPage shows wrong coaching model** — Spec v2.0 prices coaching by coachee seniority (Foundation/Professional/Executive) with Bronze/Silver/Gold packages. CouncilCoachingPage likely has a different model.
3. **No credit earning system** — Spec v2.0 defines credit earning actions. Not implemented anywhere.

**What's good:**
- CouncilTiersPage (596 lines) — excellent design, proper comparison table structure, correct brand colors. The UX pattern is great; the data is just wrong.
- CreditStorePage — clean UI, proper transaction history display, Stripe integration attempt.
- CouncilEventDetailPage — real event data integration.

---

## Part 4: Backend Services

### creditService.ts (196 lines) — Score: 2/10
- Uses wrong tier names: `free | basic | pro | council` (spec: `free | explorer | developer | executive`)
- Credit amounts wrong: basic=50, pro=200, council=999999 (spec: explorer=0, developer=500, executive=1000)
- Credit earning actions wrong: email_verification=5, streak_7_days=15, etc. (spec: framework_exploration=5, content_engagement=2, reflection_prompt=3, referral=25, assessment_completion=10)
- `spendCredits()` calls `/api/credits/spend` — race condition (SELECT then UPDATE, not atomic)

### atomicCreditService.ts (296 lines) — Score: 4/10
- Better designed — uses `SELECT FOR UPDATE` for atomic operations
- But tracks TWO credit types: `dex_credits` and `council_credits` (spec: unified pool)
- Uses `CreditTier` from auth types which uses wrong tier names
- Zero frontend consumers — nothing actually calls this service

### creditsHandler.ts (551 lines) — Score: 3/10
- Handles `/api/credits/spend`, `/api/credits/balance`, `/api/credits/org-balance`
- Race condition in spend endpoint (not using atomicCreditService)
- Tier mapping doesn't match spec v2.0

### stripeHandler.ts (1,028 lines) — Score: 3/10
- Comprehensive: checkout, webhooks, subscriptions, dual currency
- But pricing data hardcoded — doesn't match spec v2.0 tiers
- Handles both USD and CNY — spec v2.0 uses EUR only

---

## Spec v2.0 vs Code — Pricing Gap Matrix

| Spec v2.0 | Code Equivalent | Status |
|-----------|----------------|--------|
| Free (€0, static pages) | CouncilTiersPage "Executive Introduction" (5 free DEX AI messages) | ❌ Wrong model |
| Explorer (€5/mo, NEXUS conversations) | No equivalent | ❌ Missing |
| Developer (€50/mo = 500 credits) | UpgradeModal "Basic" ($19/mo = 50 credits) | ❌ Wrong price, wrong credits |
| Executive (€100/mo = 1000 credits) | UpgradeModal "Pro" ($49/mo = 200 credits) | ❌ Wrong price, wrong credits |
| Top-up credits (€25-180) | CreditStorePage ($9.99-39.99 DEX AI credits) | ❌ Wrong currency, wrong amounts, wrong expiry |
| Coaching (€1,250-9,000) | No equivalent | ❌ Missing |
| Credits never expire | CreditStorePage says "12 months" | ❌ Contradicted |
| Unified credit pool | Dual credit system (DEX + Council) | ❌ Contradicted |
| EUR pricing | USD + CNY | ❌ Wrong currency |

---

## Go-Live Readiness

| Criterion | Status |
|-----------|--------|
| Client portal functional | ⚠️ (real data, but no credits) |
| Intelligence pages functional | ⚠️ (half real, half static) |
| Council/pricing functional | ❌ (5 incompatible systems) |
| Credit system functional | ❌ (wrong tiers, race conditions) |
| Stripe integration | ⚠️ (works but wrong pricing) |
| Spec v2.0 compliance | ❌ (near-zero alignment) |

**Overall: 2.5/10 — The pricing/credit architecture is the single biggest blocker to go-live. Five systems disagree on what anything costs. Zero revenue can flow correctly.**

---

## Recommended Fix Priority

1. **UNIFY PRICING** — Delete all 5 pricing systems, rebuild from spec v2.0 single source of truth
2. **Unify credit system** — Single pool, not dual (DEX + Council). Use atomicCreditService as base.
3. **Fix credit tiers** — `free | explorer | developer | executive` with correct credit amounts
4. **Remove credit expiration** — Credits NEVER expire per spec
5. **Switch to EUR** — Spec v2.0 uses EUR; current code uses USD/CNY
6. **Rebuild pricing pages** — Single pricing component sourced from spec v2.0
7. **Fix creditService.ts** — Align with spec v2.0 earning actions and tier names
8. **Integrate credits into client portal** — Add credit display to all client pages
9. **Fix intelligence static pages** — Sync from Notion Deliverables DB
10. **Remove AIInsightsPage fake ML** — Either wire to real service or remove
