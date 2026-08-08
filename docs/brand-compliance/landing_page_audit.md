# LYC Intelligence — Public Surfaces Brand Compliance Audit

**Domain:** lyc-intelligence.app
**Branch:** feature/eo4-b2c-portal-phase6 (HEAD: 8f9d77b)
**Date:** 2026-08-08
**Status:** For design & brand team review

---

## Executive Summary

There are **7 public-facing landing/marketing pages** on lyc-intelligence.app, plus **6 authenticated portal surfaces**. The design system is partially consistent but there are material issues:

1. **Two competing design systems** — most landing pages use Libre Baskerville + DM Sans with LYC magenta accent (#C108AB), but DEX AI landing uses a completely different look (dark navy #1A1A2E, Tailwind classes, different typography)
2. **Same component used for marketing AND in-app** — NexusPage serves as both the /nexus marketing landing AND the in-app chat interface
3. **Product naming may not align with ECHO v6** — internal framework code names (TRIDENT, CANVAS, GRID) are exposed in user-facing UI
4. **Inconsistent CTA language** — "Try Free" vs. "Take Assessment" vs. "Start Now" — brand constitution likely has rules about tier naming
5. **No unified product taxonomy across landing pages** — each page describes products differently

---

## Page Inventory (Public / Unauthenticated)

### 1. Main Landing — `/` (Landing.tsx, 282 lines)

**Hero:**
- Video background (hero-bg.mp4) with poster fallback
- Headline: "Intelligence Platform for Executive Decisions" (approximate — see code L149-151)
- Two CTAs: "I'm a leader" → /b2c, "I'm hiring" → /b2b
- Stat counter section (values count up)

**Product Cards (3 cards):**
| Card Title | Icon | Description | CTA | Link |
|---|---|---|---|---|
| Match Analysis | Trident icon | "AI-powered JD-CV matching engine. Score candidates instantly against role requirements." | Try Free | /match |
| Leadership Assessment | Impact icon | "Discover your archetype. Benchmark against global executives across 47 markets." | Take Assessment | /assessment |
| Nexus | Compass icon | "Executive advisory on career positioning, talent scoring, and leadership alignment." | Consult | /nexus |

**Dark CTA section:**
- Headline: "Leadership isn't a title — it's a trajectory."
- [Need to verify CTA button text]

**Brand compliance flags:**
- ⚠️ Uses internal framework icon names (Trident, Impact) in code — but user-facing titles are OK ("Match Analysis", "Leadership Assessment")
- ⚠️ "Try Free" — ECHO v6 rule says NO "free" — should be "Complimentary" or "Executive Introduction"
- ✅ Logo: "LYC Intelligence" in header and footer
- ✅ Typography: Libre Baskerville (headings) + DM Sans (body) — consistent
- ✅ Accent color: #C108AB (LYC magenta)

---

### 2. B2C Landing — `/b2c` (B2CLanding.tsx, 192 lines)

**Hero:**
- Label: "Executive Assessment"
- Headline: "Understand Your Leadership Profile" (approximate — see code L76-78)
- Primary CTA: "Take Free Assessment" → /assessment
- Secondary text below CTA

**"Your Assessment Includes" section (3 features):**
| Feature | Icon | Description |
|---|---|---|
| Leadership Archetype | Impact icon | "Discover whether you're a Strategist, Operator, Catalyst, or Builder — with personalized insights for your career trajectory." |
| Market Benchmark | Leap icon | "See how you compare across executive markets. Understand your positioning and unlock opportunities that match your trajectory." |
| Career Benchmark | Trident icon | "Get benchmarked across Experience, Skills, and Organizational Fit — see exactly how you compare to what top firms look for in C-suite candidates." |

**"3 Steps to Your Results" section:**
1. Enter your details
2. Rate yourself (10 questions, under 10 minutes)
3. Get your results (instant archetype + scores + downloadable PDF)

**Lead capture CTA section:**
- Headline: "Ready to find out?"
- Subhead: "Leadership isn't a title — it's a trajectory. See it, shape it, accelerate it."
- LeadCaptureForm — "Get your free leadership profile" / "8 minutes. Archetype, benchmarks, and your 90-day priorities."

**Footer links:** Assessment, Coaching, Intelligence, Pricing, Terms, Privacy, Cookies

**Brand compliance flags:**
- ⚠️ "Take Free Assessment" — "free" forbidden per ECHO v6 → should be "Complimentary Assessment"
- ⚠️ "Get your free leadership profile" — same issue
- ⚠️ References "Strategist, Operator, Catalyst, Builder" archetypes — verify these align with CPI v2.0 methodology spec (4 archetypes confirmed by Akira)
- ⚠️ Only shows 3 assessment features — doesn't mention full SHIFT Suite (5 diagnostics) — because Phase 11 isn't built yet
- ✅ Design consistent with main landing (same DS object, same fonts, same accent)

---

### 3. B2B Landing — `/b2b` (B2BLanding.tsx, 207 lines)

**Hero:**
- Label: "For Hiring Teams & Search Firms"
- Headline: [need to verify — see code L77-79]
- Primary CTA: [need to verify]

**"How Match Analysis Works" section (3 steps):**
1. Paste Your JD (Prism icon)
2. Add Candidates (Bridge icon)
3. Get Match Scores (Trident icon) — "AI scores each candidate on 3 dimensions with verdicts, match reasons, risks, and approach strategy."

**"How Scoring Works" section**
- Details on 3-dimension scoring methodology

**Features section (3 features):**
| Feature | Icon | Description |
|---|---|---|
| Instant Scoring | Spark icon | "Each candidate scored in seconds. No waiting for analyst reports." |
| Confidential | Impact icon | "Your JDs and candidate data stay private. Never shared with third parties." |
| Batch Processing | Bridge icon | "Score multiple candidates against the same JD in one sweep." |

**Dark CTA section:**
- Headline: "Start matching today"
- Tagline: "Leadership isn't a title — it's a trajectory. Find the right one."

**Brand compliance flags:**
- ⚠️ "3 dimensions" — this references TRIDENT internal model. Is this the right user-facing language?
- ⚠️ Uses framework code name icons (Prism, Bridge, Trident, Spark) — check if these are allowed in B2B context
- ✅ Design system consistent with main + B2C landing

---

### 4. NEXUS Landing — `/nexus` (NexusPage.tsx)

**CRITICAL: This is NOT a landing page.** It's a chat interface component.
- Same component is used for both `/nexus` (public route) AND `/app/chat` (in-app)
- Has chat input, message history, clear button
- Title: "Nexus"
- Placeholder: "Ask Nexus about career positioning, cross-border leadership..."

**Brand compliance flags:**
- 🔴 CRITICAL: `/nexus` should be a marketing landing page, not the chat interface itself. Users who land on `/nexus` get thrown directly into a chat with no context, no value proposition, no pricing, no signup flow
- ⚠️ "Nexus" capitalization inconsistent — sometimes "Nexus", sometimes "NEXUS" — Akira's doc says "NEXUS" as product name
- ⚠️ No clear product positioning — what IS Nexus vs. DEX AI vs. LYC Intelligence?

---

### 5. DEX AI Landing — `/dex` (DexLandingPage.tsx)

**Completely different design system** — dark navy theme (#1A1A2E), Tailwind utility classes, different typography approach.

**Hero (dark navy):**
- Headline: [large — see code L22-27]
- Subhead: "DEX AI is your always-on advisor for career strategy, compensation benchmarking, and..." [truncated]

**"What DEX AI can do for you" section (4 features):**
| Feature | Icon | Description |
|---|---|---|
| Career Strategy | Brain icon | "Map your next move with placement data from 7,400+ mandates." |
| Compensation Benchmarking | LineChart icon | "Know your market worth across China and APAC roles." |
| Cross-Border Transitions | Compass icon | "Navigate moves between Shanghai, Singapore, and Hong Kong." |
| Confidential Advisory | Shield icon | "Private, judgment-free guidance from a trusted partner." |

**Pricing section (1 tier shown):**
| Tier | Price | Detail | CTA | Link |
|---|---|---|---|---|
| Executive Introduction | Complimentary | "5 messages to experience DEX AI" | Start Now | /dex/chat |

**Final CTA section:**
- Headline + subhead

**Brand compliance flags:**
- 🔴 CRITICAL: Entirely different visual system from main LYC landing. Different colors (navy vs white), different typography implementation, different component styling. Feels like a different product from a different company.
- ✅ "Executive Introduction" + "Complimentary" — correct ECHO v6 tier naming
- ⚠️ "DEX AI" naming — verify this is the Level 1 user-facing name (Akira's architecture map says "DEX AI" is the platform name)
- ⚠️ Only shows 4 features — doesn't mention assessments, SHIFT, CPI, etc.
- ⚠️ Only 1 pricing tier shown — where's the paid tier?

---

### 6. CPI Assessment — `/assessment` (AssessmentPage.tsx)

**Standalone public assessment page** — renders AssessmentWizard.
- Not a landing page — it's the actual assessment tool
- Prefills email/name from URL params or auth profile
- Links to: /assessment route (self-referential)

**Brand compliance flags:**
- ⚠️ This is CPI (China Leadership Pipeline Diagnostic) but the route is just `/assessment` — not product-branded
- ⚠️ User sees "Leadership Assessment" not "China Leadership Pipeline Diagnostic" or "CPI"
- Check if assessment copy aligns with CPI v2.0 methodology spec

---

### 7. Match Analysis — `/match` (MatchPage.tsx)

Public Match Analysis tool page — TRIDENT-based candidate scoring.

**Brand compliance flags:**
- ⚠️ "Match Analysis" is the user-facing name, but does this map to a specific product in Akira's lineup? (TRIDENT is internal code name)
- Need to review actual page content for naming compliance

---

### 8. Pricing — `/pricing` (PricingPage.tsx)

**Brand compliance flags:**
- Need to verify tier naming follows ECHO v6 rules (no "free", use "Executive Introduction")
- Need to verify which products are listed for pricing

---

## Authenticated Portal Surfaces (for reference)

These are NOT public landing pages but affect brand perception post-login:

| Surface | Route | AppShell Tab | Status |
|---------|-------|--------------|--------|
| Internal Ops | `/app/dashboard` | Internal Ops | ✅ Full — dashboard, pipeline, mandates, candidates, TRIDENT, CANVAS, companies, batch-scoring, metrix, scoring-runs, chat, scheduler, notifications, settings, advanced-ops, scheduling-plus, intelligence-plus |
| B2B Client Portal | `/client/dashboard` | B2B Client | ⚠️ Partial — dashboard, shortlist, documents, candidates (placeholder), nexus-assistant (placeholder) |
| B2C Coaching | `/coaching/coach` | B2C Coaching | ⚠️ Coach page built (Phase 7.5), 8 of 9 sub-routes are placeholders |
| Candidate Portal | `/candidate/dashboard` | Candidate | ⚠️ 12 sub-routes, mostly scaffolding/placeholders |
| GRID | `/grid` | GRID | ✅ Phase 9 — Market Mapping + Review Dashboard |
| DEX AI (standalone) | `/dex/chat`, `/dex/assess`, etc. | N/A (separate nav) | ✅ 6 routes: chat, assess, plan, book, journey, credits |

**Internal surface nav items (Phase 10 state):**
Dashboard → Pipeline → Mandates → Candidates → TRIDENT → CANVAS → Companies → Batch Scoring → Metrix → Scoring Runs → Chat → Scheduler → Org Intel → Notifications → Settings → Advanced Ops → Scheduling+ → Intelligence+

**Brand compliance flags:**
- ⚠️ Internal framework names (TRIDENT, CANVAS, GRID) used as navigation labels — are these supposed to be user-facing or internal-only?
- ⚠️ 5-tab SurfaceTabs navigation: Internal Ops / B2B Client / B2C Coaching / Candidate / GRID. "GRID" as a top-level tab alongside "surfaces" is inconsistent — GRID is a product, not a user type
- ⚠️ Phase 11 will add SHIFT Suite to internal nav — where does it go?

---

## Design System Inconsistency Summary

| Element | Main Landing (+B2C + B2B) | DEX AI Landing | Nexus |
|---------|---------------------------|----------------|-------|
| Primary color | #C108AB (magenta) | #1A1A2E (navy) + fuchsia accent | Text-primary default |
| Heading font | Libre Baskerville | Tailwind font-semibold (system?) | font-serif |
| Body font | DM Sans | Tailwind default | system default |
| Border radius | 0px (LYC brand: zero radius) | Tailwind default (rounded) | default |
| Styling approach | Inline style objects + CSS classes | Tailwind utility classes | Tailwind + inline |
| Layout width | 900px max | 6xl / 4xl (wider) | default |

---

## Critical Issues (P0)

1. **DEX AI landing page has entirely separate design system** — doesn't look like the same brand as the rest of lyc-intelligence.app
2. **`/nexus` is a chat interface, not a landing page** — users hit a wall of "Nexus is ready" with zero context or value prop
3. **"Free" language on main + B2C landing** — ECHO v6 forbids "free"; use "complimentary" or tier names
4. **No clear product hierarchy** — LYC Intelligence → DEX AI → NEXUS → SHIFT → individual assessments. Current landing pages don't communicate this. User doesn't know what product they're looking at or how things relate.

## Important Issues (P1)

5. **Product naming in nav/internals** — TRIDENT, CANVAS, GRID as user-facing labels vs. internal code names
6. **B2C landing only shows 3 features** — doesn't reflect actual product breadth (especially after Phase 11 ships 5 SHIFT diagnostics)
7. **GRID as a SurfaceTab** — product mixed with user-type surfaces
8. **Inconsistent tier naming across CTAs**

## Minor Issues (P2)

9. **Nexus/NEXUS capitalization inconsistency**
10. **Footer nav incomplete across pages**
11. **CPI assessment route is generic `/assessment` not product-branded**

---

## Questions for Brand/Design Team

1. **Should DEX AI landing use the same design system as the main LYC Intelligence landing, or is the dark navy look intentional for DEX AI as a sub-brand?**
2. **What is the correct product hierarchy and how should it be communicated across landing pages?** (LYC Intelligence = brand, DEX AI = platform, NEXUS = chat advisor, SHIFT Suite = assessments, etc.)
3. **Are TRIDENT / CANVAS / GRID acceptable as user-facing product names, or should they be rebranded to user-facing names per the 3-level naming system?**
4. **What's the right landing page structure for `/nexus`?** Should it be a marketing page that links to the chat, or is chat-first intentional?
5. **Should the GRID tab in AppShell be repositioned?** It's currently a peer of user-type surfaces (Internal/B2B/B2C/Candidate) but GRID is a product, not a user type.
6. **What's the canonical CPI assessment route naming?** `/assessment` vs. `/cpi` vs. `/china-leadership-pipeline`
