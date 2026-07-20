# B2C Portal — Comprehensive Gap Analysis

**Audit Date:** 2026-07-20  
**Auditor:** NEXUS  
**Scope:** B2C Portal — Page 1 (Landing `/b2c`) + Page 2 (Assessment `/assessment`)  
**Reference Specs:** Content Integration Spec (`CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md`), Master Spec v3.1 (`DEX_AI_MASTER_SPEC.md`), Notion FEA Spec (C1.22), Notion Assessment Platform Tech Spec (C3.1)

---

## Executive Summary

The B2C portal has **two fundamental problems**:

1. **The landing page sells a free assessment but never explains the product.** No pricing, no product preview, no social proof, no conversion funnel beyond the assessment.
2. **The assessment does not match any specification.** The code implements a "Career Positioning Diagnostic" (CPD) with 25 questions, 5 leadership dimensions, and 6 archetypes. This contradicts both the Notion Force Exposure Assessment spec (36 questions, 3 forces, exposure mapping) and the Content Integration spec (60-second conversational quiz where users never see framework names).

**Go-live verdict: NOT READY.** Both pages need significant rework before any external user sees them.

---

## PAGE 1: Landing (`/b2c` — B2CLanding.tsx, 193 lines)

### Spec vs Code Gaps

| # | Spec Requirement | Code Implementation | Gap Severity |
|---|---|---|---|
| 1 | "Free archetype quiz (60 seconds)" (Content Integration §L1) | Assessment is a 15-20 minute multi-step wizard with 25 questions | 🔴 CRITICAL — 15x longer than specified |
| 2 | Assessment is one entry point → feeds Nexus intelligence (Content Integration §L1) | Assessment is a dead-end: results page has no "Continue with Nexus" CTA that leads to product | 🔴 CRITICAL — broken funnel |
| 3 | "Assessment is NOT the product" (Content Integration §L1) | Landing page has no product description — only sells the assessment | 🔴 CRITICAL — user can't learn what they're signing up for |
| 4 | Nexus is the product; assessments feed into it (Master Spec §1.7) | Landing page links to `/nexus` (NexusPage) but doesn't explain what Nexus does or why you'd use it | 🔴 CRITICAL — value proposition invisible |
| 5 | 5 subscription tiers exist (Free → ¥4,999/mo Corporate per Master Spec §2.5) | Zero pricing visibility. Not even "Plans start at ¥199/mo" | 🟡 HIGH — executives filter by price |
| 6 | Named diagnostic products are "invisible to users" (Content Integration §L1) | Landing page references "Leadership Archetype" and "Market Benchmark" — generic terms OK, but don't match FEA spec output format | 🟡 MEDIUM — terminology mismatch |
| 7 | Every interaction should end with "Talk to Nexus" CTA (Content Integration §Forum) | Final CTA is a lead capture form — no Nexus mention in the closing section | 🟡 HIGH — missed conversion to core product |
| 8 | Progression: Assessment → Report → Newsletter → Webinar → Roundtable (Master Spec §2.2 Door 3) | No progression path shown. No newsletter, no webinar, no roundtable mentions | 🟡 HIGH — user sees single-step journey |

### Functional Gaps

| # | Issue | Detail |
|---|---|---|
| F1 | **No product preview** | Zero screenshots of Nexus interface, no assessment result preview, no dashboard mockup. Executives won't buy what they can't see. |
| F2 | **No social proof** | No testimonials, user counts, press logos, or case studies. Page feels sterile and untrusted. |
| F3 | **Lead capture is a black hole** | Form POSTs to API but doesn't trigger welcome email, redirect to signup, or create account. Data goes nowhere visible. |
| F4 | **Footer "Contact" links to `/pricing`** | Wrong destination. Should link to a contact form or email. |
| F5 | **No SEO** | No `<title>` tag, no meta description, no OG tags. Page is invisible to search engines. |
| F6 | **Assessment result is a dead-end** | User completes assessment → gets archetype → nothing happens. No "Sign up to continue with Nexus." No account creation prompt. Conversion funnel stops. |
| F7 | **No mobile-specific CTA optimization** | Mobile nav works but the hero CTA row doesn't stack vertically on small screens. |

### Animation / UX Gaps

| # | Issue | Detail |
|---|---|---|
| A1 | **Staggered reveal not applied** | `.reveal-delay-1/2/3` CSS classes exist but aren't applied to the 3 feature cards. They all appear simultaneously. |
| A2 | **No scroll-triggered section transitions** | Only `.reveal` class used on sections — simple fade-in. No progressive disclosure or storytelling flow. |
| A3 | **CTA glow animation is subtle** | `@keyframes cta-glow` exists but is barely noticeable on the fuchsia buttons. |

### What Works

- ✅ Brand design consistent (Libre Baskerville, DM Sans, fuchsia #C108AB, zero border-radius)
- ✅ All buttons/CTAs are clickable and wired to real routes
- ✅ Scroll-reveal animations functional (IntersectionObserver-based)
- ✅ Mobile nav slide-in overlay works
- ✅ Responsive grid layout
- ✅ Footer has proper links to platform pages

---

## PAGE 2: Assessment (`/assessment` — AssessmentWizard.tsx + 4 files, 1,533 lines)

### 🔴 FUNDAMENTAL SPEC MISMATCH

The assessment system in the code does **not match any specification on Notion.** It is a third, undocumented instrument.

#### Spec Comparison Matrix

| Dimension | Notion FEA Spec (C1.22) | Content Integration Spec | Code Implementation (CPD) |
|---|---|---|---|
| **Name** | Force Exposure Assessment (FEA) | "Free archetype quiz" | Career Positioning Diagnostic (CPD) |
| **Questions** | 36 (12 per force × 3 forces) | 3-5 micro / up to 40 standard | 25 (20 scenario + 5 cross-border) |
| **Scale** | 5-point frequency/proximity | N/A (conversational) | 2-5 point scenario scoring |
| **Measures** | **Exposure** to Three Forces | Leadership style via conversation | **Capability** across 5 dimensions |
| **Dimensions** | Three Forces: (1) China going global, (2) AI dissolving capabilities, (3) Org tempo vs market tempo | Invisible to user | Strategic Orientation, Cross-Border Adaptability, Stakeholder Influence, Execution Discipline, Leadership Presence |
| **Output** | Force exposure map + diagnostic pathway recommendation (SHIFT/MOSAIC/BRIDGE) | Archetype in natural language, user never sees framework names | Archetype name + composite score + dimension bar chart |
| **Format** | Formal assessment, 20 min | "Conversation, not a test" — Nexus weaves questions into dialogue | 7-step formal wizard with progress bar, step labels, scoring |
| **Framework visibility** | FEA is a named product for B2B pipeline | Frameworks INVISIBLE — "user never sees framework names" | Dimensions named explicitly ("Strategic Orientation", etc.), archetype names shown directly |
| **Session management** | Server-side save, 60-min timeout, concurrent blocking | N/A | localStorage only, no persistence, no timeout |
| **Benchmarking** | Cohort median, percentile ranking (per Tech Spec C3.1) | N/A | None |
| **Diagnostic routing** | Recommends SHIFT, MOSAIC, or BRIDGE based on force profile | Nexus recommends services conversationally | None — no routing to any diagnostic product |
| **Conversion** | Entry diagnostic for B2B pipeline | Every interaction ends with "Talk to Nexus" | Dead-end — results page has CTA but no account creation, no Nexus handoff |

#### The Three-Way Contradiction

1. **FEA Spec says:** Measure exposure to macro forces → recommend diagnostic pathway (SHIFT/MOSAIC/BRIDGE)
2. **Content Integration says:** Assessment is conversational, frameworks invisible, 60 seconds, feeds Nexus
3. **Code does:** Measures leadership capability across 5 dimensions → assigns archetype + score → dead end

The code satisfies none of these. It's not the FEA (wrong questions, wrong dimensions, wrong output). It's not the conversational quiz (it's a formal wizard, shows framework names). It's an undocumented third instrument.

### Technical Bugs

| # | Bug | File | Detail |
|---|---|---|---|
| B1 | **`DS.error`, `DS.success`, `DS.warning` undefined** | AssessmentWizard.tsx, ResultsPanel.tsx | Design system object has no `error`/`success`/`warning` properties. Error messages are invisible, score colors don't render, section headings disappear. |
| B2 | **ResultsPanel JSX structurally broken** | ResultsPanel.tsx | The Nexus CTA card `<div>` is nested **inside** the Download PDF `<button>` element. Invalid HTML. The entire insight bridge renders inside a button. |
| B3 | **PDF download is completely fake** | ResultsPanel.tsx | Uses `setTimeout` + `alert('PDF downloaded!')`. No jsPDF, no actual file generation. Users get an alert box and nothing else. |
| B4 | **Back button imported but never rendered** | AssessmentWizard.tsx | `ChevronLeft` imported from lucide-react but the back navigation UI is never rendered. Misclick = stuck with that answer. |
| B5 | **Career Goals limit not enforced** | AssessmentWizard.tsx | Says "select up to two" but code doesn't enforce the 2-choice limit. Users can select all 8. |

### UX / Functional Gaps

| # | Gap | Spec Reference | Detail |
|---|---|---|---|
| G1 | **No back navigation** | Tech Spec C3.1 says "No back navigation" (code matches but user can't correct mistakes) | Spec says no back nav, but there's no confirmation step either. One click = final answer. |
| G2 | **No header/logo/navigation** | Content Integration: user should always be able to "Talk to Nexus" | Users trapped in white page with no way back to any other page. |
| G3 | **No exit or "save & continue later"** | Tech Spec C3.1: session management with auto-save | If user closes browser, all progress lost. localStorage exists but no "resume" UI. |
| G4 | **Gate data goes nowhere** | — | Name + email captured in Step 1, stored in localStorage only. No API call, no account creation, no welcome email. |
| G5 | **No step transitions/animation** | Content Integration §Gamification: "Score reveal — gauge fills with animation" | Everything is instant state swap. Zero animation between questions. Only score bars have `transition`. |
| G6 | **Auto-advance on click** | — | One tap on any answer = immediately next question. No confirmation, no review. |
| G7 | **No authentication required** | — | Fully anonymous. Results die with browser cache. No account, no persistence. |
| G8 | **No sign-up prompt at results** | Content Integration: conversion moment = "Talk to Nexus" | The most valuable moment (user just learned about themselves) has zero conversion mechanism. |
| G9 | **Writing style has no visible impact** | — | User selects analytical/visionary/pragmatic/empathetic style. It's stored but never used anywhere in output. |
| G10 | **Cross-border step quality cliff** | — | Steps 1-5 use rich scenario-based questions. Step 6 drops to simple 1-5 self-rating. Jarring quality difference. |
| G11 | **Insight bridge text is placeholder** | — | Says "This is shown in your dimension scores" — doesn't name the actual weakest area or provide actionable insight. |
| G12 | **Archetype routing has fallback bias** | — | `getArchetype()` defaults to `'Precision Operator'` if no conditions match. This means users with evenly distributed scores always get the same archetype. |
| G13 | **No benchmarking** | Tech Spec C3.1 §5: "Benchmark only if cohort ≥ 20" | No benchmark data at all. Users can't compare themselves to peers. |
| G14 | **No diagnostic product routing** | Master Spec §2.2 Door 3: Assessment → Report → Webinar → Roundtable | After assessment, no recommendation of SHIFT, MOSAIC, BRIDGE, or any paid diagnostic. |
| G15 | **Dimension names visible to user** | Content Integration: "Users NEVER see framework names" | All 5 dimension names displayed explicitly. Contradicts the spec. |

### Animation Assessment

| Element | Expected (per Content Integration §Gamification) | Actual |
|---|---|---|
| Score reveal | "Gauge fills with animation, 800ms delay between reveals" | Score bars have `transition: width 0.8s` — only animated element on entire page |
| Archetype reveal | "Full-screen takeover with archetype name, visual treatment changes, shareable card auto-generated" | Plain text card appears instantly. No takeover, no visual change, no shareable card |
| Question transitions | Smooth slide/fade between questions | Instant state swap. No transition. |
| Option selection | Visual feedback on tap/click | Background color changes instantly. No scale, no ripple, no haptic feel. |
| Progress bar | Animated progress indication | Has `transition: width 0.3s` — works but minimal |
| Card hover | Elevation/shadow change | No hover effects on question cards |

**Animation verdict:** Near-zero. For a product targeting executives who'll pay ¥4,999/mo, this feels like an internal prototype.

### What Works

- ✅ Question bank is real (20 scenario questions, well-written executive scenarios)
- ✅ Scoring engine is functional (weighted dimensions, archetype logic)
- ✅ Cross-border readiness assessment exists (5 self-rating questions)
- ✅ Progress bar works correctly
- ✅ localStorage persistence works (survives page refresh)
- ✅ Brand design is consistent with landing page
- ✅ Nexus bridge CTA exists in ResultsPanel (though structurally broken — see B2)
- ✅ 6 archetypes defined with descriptions, strengths, development areas

---

## PLATFORM-LEVEL GAPS (Cross-Page)

| # | Gap | Spec Reference | Impact |
|---|---|---|---|
| P1 | **No account system for B2C** | Content Integration: users should have persistent profiles | Assessment data is anonymous and ephemeral. No way to build a user relationship. |
| P2 | **No Nexus handoff from assessment** | Master Spec §1.7: Nexus is the product | Assessment results don't feed into Nexus. Two disconnected experiences. |
| P3 | **No CRM/email integration** | Content Integration: lead capture should trigger nurture sequence | Lead form on landing page captures data but sends nothing to email/CRM. |
| P4 | **No Stripe/payment integration on B2C** | Master Spec §2.5: 5 subscription tiers | Zero payment infrastructure. No pricing page wired to Stripe. No checkout flow. |
| P5 | **No analytics/tracking** | — | No event tracking, no conversion funnel measurement, no A/B test capability. |
| P6 | **Assessment instrument is wrong** | Notion FEA Spec (C1.22) vs Content Integration Spec | The core data collection instrument measures the wrong construct. All downstream intelligence (Nexus recommendations, benchmarking, diagnostic routing) is built on wrong foundations. |
| P7 | **No content layer** | Content Integration: Forum, Webinar, Newsletter, Events | B2C portal has zero content. No articles, no forum, no events, no newsletter signup. |

---

## Priority Matrix

### Must-Fix Before Go-Live (Blocks Revenue)

1. **P6 — Assessment/spec alignment:** Decide which spec to follow. Rewrite assessment engine or update specs. This is the #1 blocker.
2. **F6 + G8 — Assessment conversion funnel:** Assessment results must lead to account creation + Nexus engagement. Currently a dead-end.
3. **F1 — Product preview:** Show what Nexus looks like. Executives need to see the product before committing.
4. **P1 — B2C account system:** Without accounts, there's no persistence, no relationship, no subscription.
5. **B1-B3 — Critical bugs:** Undefined design system tokens, broken JSX structure, fake PDF download.

### Should-Fix (Impacts Quality Perception)

6. **P5 — Analytics/tracking:** Can't optimize what you can't measure.
7. **G5 — Step transitions:** Add question-to-question animations.
8. **F2 — Social proof:** Add testimonials or case studies.
9. **A1 — Staggered reveal animations:** Apply existing CSS classes to feature cards.
10. **G11 — Placeholder text:** Replace generic insight bridge with dynamic content based on actual scores.

### Can-Defer (Post-MVP)

11. **P4 — Stripe integration:** Can launch with free tier first.
12. **P7 — Content layer:** Forum, webinars, newsletter can come after assessment + Nexus are working.
13. **F5 — SEO:** Important but not blocking initial launch to targeted audience.

---

## Decision Required from Kevin

The fundamental question is: **Which assessment spec do we follow?**

- **Option A:** Rewrite code to match Notion FEA spec (36 questions, 3 forces, exposure mapping, diagnostic routing to SHIFT/MOSAIC/BRIDGE)
- **Option B:** Rewrite code to match Content Integration spec (60-second conversational quiz via Nexus, frameworks invisible, archetype output in natural language)
- **Option C:** Keep the CPD code as-is, update Notion specs to match, and build the conversion funnel around it
- **Option D:** Create a new unified spec that combines elements from all three

This decision blocks all further assessment-related development and affects the Nexus data pipeline architecture.

---

## Files Audited

| File | Lines | Status |
|---|---|---|
| `src/pages/B2CLanding.tsx` | 193 | ✅ Audited |
| `src/pages/AssessmentPage.tsx` | 21 | ✅ Audited |
| `src/components/assessment/AssessmentWizard.tsx` | 615 | ✅ Audited |
| `src/components/assessment/ScenarioQuestion.tsx` | 91 | ✅ Audited |
| `src/components/assessment/StyleSelector.tsx` | 98 | ✅ Audited |
| `src/components/assessment/ResultsPanel.tsx` | 313 | ✅ Audited |
| `src/services/assessmentEngine.ts` | 416 | ✅ Audited |
| **Total** | **1,747** | |

## Reference Specifications

| Spec | Location | Key Sections |
|---|---|---|
| Content Integration & AI Layer Spec | `docs/CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md` | §L1 (Assessment philosophy), §Gamification, §B2C entry |
| DEX AI Master Spec v3.1 | `docs/DEX_AI_MASTER_SPEC.md` | §1.7 (Nexus scope boundary), §2.2 (Doors), §2.5 (Tiers) |
| Force Exposure Assessment — Specification | Notion C1.22 (`39bfafae-51be-81cb-99ee-f0a96b884d93`) | Question structure, scoring, output format |
| Assessment Platform Technical Specification | Notion C3.1 (`39bfafae-51be-81fd-b916-f437cee05924`) | Session management, benchmarking, architecture |

---

*Next: Continue audit to Page 3 (`/nexus` — NexusPage) after Kevin's direction on assessment spec alignment.*
