# LYC Intelligence — Master Audit Summary

**Date:** 2026-07-21  
**Auditor:** NEXUS  
**Scope:** Full codebase audit (all B2C pages, B2B portals, backend services)

---

## Overall Codebase Score: 2.5/10

| Audit | Area | Pages | Lines | Score |
|-------|------|-------|-------|-------|
| #1 | B2C Landing | 1 | ~400 | 5/10 |
| #2 | B2C Assessment | 1 | ~500 | 4/10 |
| #3 | B2C NEXUS | 2 | ~1,200 | 4/10 |
| #4 | B2C Pricing & Monetization | 4 | ~1,800 | 2/10 |
| #5 | B2C Score Match Engine | 8 | ~2,000 | 3/10 |
| #6 | B2C Coaching Portal | 9 | ~3,117 | 2/10 |
| #7 | B2C DEX Chat + LMS | 2 | ~1,100 | 2/10 |
| #8 | Candidate Portal | 19 | 6,440 | 2.5/10 |
| #9 | Client + Intelligence + Council | 29 | 9,720 | 2.5/10 |
| — | Notion vs Code Consistency | — | — | 1/10 |
| **TOTAL** | | **~75** | **~27,000** | **2.5/10** |

---

## Top 10 Critical Issues (Block Go-Live)

| # | Issue | Severity | Affects |
|---|-------|----------|---------|
| 1 | **FIVE incompatible pricing systems** | BLOCKER | Revenue |
| 2 | **Dual credit system (DEX + Council)** — spec requires unified pool | BLOCKER | Revenue |
| 3 | **Credit balance always 0** — UserProfile has no credits field | BLOCKER | All features |
| 4 | **All SHIFT assessments wrong** — wrong dimensions, wrong weights, wrong questions | BLOCKER | Core product |
| 5 | **NEXUS AI uses mock responses** in Candidate portal | CRITICAL | UX |
| 6 | **Credit race condition** — SELECT then UPDATE not atomic | CRITICAL | Revenue |
| 7 | **Credit expiration contradiction** — code says 12 months, spec says never | CRITICAL | Trust |
| 8 | **Wrong tier names** across 7+ files (5 different vocabularies) | CRITICAL | All features |
| 9 | **No credit integration** in any candidate/client page | CRITICAL | Revenue |
| 10 | **Hardcoded mock data** in 15+ pages | HIGH | UX |

---

## Spec v2.0 Compliance: Near-Zero

The approved spec v2.0 (2026-07-21) defines:
- 4 subscription tiers (Free/Explorer €5/Developer €50/Executive €100)
- Top-up credits (€25-180, one-time)
- Coaching packages (€1,250-9,000 by coachee seniority)
- Unified credit pool (credits never expire)
- SHIFT assessment stack (LEAP/QUEST/COACH/DRIVE/IMPACT + BRIDGE + SPARK)
- Engagement Cycles gamification
- EUR pricing

**Current code compliance with above: 0%.** Every pricing number, every tier name, every assessment framework, every currency, and every credit rule in the code contradicts the approved spec.

---

## What Needs to Be Deleted

| File/Component | Reason |
|----------------|--------|
| `src/services/shiftAssessmentTypes.ts` | Wrong SHIFT dimensions |
| `src/assessments/catalog.ts` | Wrong assessment catalog |
| `src/services/shiftAnalysis.ts` | Wrong scoring algorithms |
| `src/services/shiftService.ts` | Wrong service logic |
| `src/pages/AssessmentPage.tsx` | Wrong UI |
| `src/lib/benchmark/engine.ts` | Wrong benchmarking |
| `src/pages/candidate/CandidatePortalV2Page.tsx` | Duplicate dashboard |
| `src/pages/candidate/CandidateLifecyclePage.tsx` | Admin page in candidate portal |
| All pricing components | 5 systems, all wrong |
| Dual credit logic in atomicCreditService | Must be unified to single pool |

## What Needs to Be Built From Scratch

| Component | Spec Reference |
|-----------|---------------|
| Unified credit transaction system | Spec §4 |
| SHIFT assessment engine (from Notion) | Spec §6 |
| NEXUS AI conversation layer (DeepSeek) | Spec §5 |
| Engagement Cycles tracking | Spec §8 |
| Credit earning system | Spec §4.2 |
| Coaching package purchase flow | Spec §3.3 |
| Top-up credit purchase flow | Spec §3.2 |
| Privacy/confidentiality controls | Spec §9 |
| Tier enforcement middleware | Spec §3.1 |
| Unified pricing component | Spec §3 |

---

## What's Worth Keeping

| Component | Quality | Notes |
|-----------|---------|-------|
| `NexusChat.tsx` (component) | Good | Used by ClientNexusAssistantPage. Real API integration. |
| `ClientMandateDetailPage.tsx` | Good | 728 lines, real data, polished UX |
| `atomicCreditService.ts` | Good base | Atomic operations, SELECT FOR UPDATE. Needs tier/credit-model fix. |
| `stripeHandler.ts` | Good base | 1,028 lines, comprehensive Stripe integration. Needs pricing fix. |
| `CandidateCommunityPage.tsx` | Good | Real forum integration |
| `CompanyIntelligencePage.tsx` | Good | Real API integration |
| `IntelligenceDashboardPage.tsx` | Good | Real signal dashboard |
| `CouncilTiersPage.tsx` (design only) | Good UX | Wrong data, but excellent comparison table pattern |
| `CreditStorePage.tsx` (design only) | Good UX | Wrong data, but clean purchase flow |
| Design system tokens | Good | Brand colors, fonts, spacing are correct |

---

## Estimated Rewrite Scope

| Phase | Work | Effort |
|-------|------|--------|
| Phase 1: Delete + Credit system | Remove wrong code, build unified credits | 2-3 weeks |
| Phase 2: NEXUS AI | Wire DeepSeek, framework knowledge, proactive questioning | 2-3 weeks |
| Phase 3: Assessments | Rebuild from Notion, scoring engine, reports | 3-4 weeks |
| Phase 4: Gamification | Engagement Cycles, credit earning, maturity tracking | 2-3 weeks |
| Phase 5: Pricing + Coaching | Unified pricing page, top-up, coaching packages | 2-3 weeks |
| Phase 6: Polish | Privacy controls, benchmark, content library | 2-3 weeks |
| **TOTAL** | | **13-19 weeks** |

---

## Next Actions

1. ✅ Spec v2.0 committed and approved
2. ✅ Audits #1-#9 complete
3. 🔲 Phase 1: Begin credit system rebuild + delete wrong code
4. 🔲 Configure Stripe environment variables
5. 🔲 Fix DeepSeek API alias (before July 24)
6. 🔲 Rebuild NEXUS AI with real DeepSeek integration
