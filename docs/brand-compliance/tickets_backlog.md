# Brand & Landing Page Compliance — Ticket Backlog

**Source Audit:** brand_compliance_landing_page_audit.md
**Branch:** feature/eo4-b2c-portal-phase6
**Created:** 2026-08-08
**Total Tickets:** 15 (5 P0 + 6 P1 + 4 P2)
**Design Team Review:** 2026-08-08 — All 5 blocking decisions resolved + TICKET-15 added (P0)

---

## P0 — Critical (fix before go-live)

### TICKET-01: DEX AI Landing Page — Align Design System with LYC Intelligence Brand

**Priority:** P0
**Surface:** `/dex` (DexLandingPage.tsx)
**Type:** Design / Brand Compliance
**Effort:** L (design + implementation)

**Problem:**
The DEX AI landing page uses a completely different visual system from the rest of lyc-intelligence.app:
- Colors: dark navy (#1A1A2E) vs. white/light with LYC magenta (#C108AB)
- Typography: Tailwind default vs. Libre Baskerville headings + DM Sans body
- Border radius: rounded vs. LYC brand zero-radius
- Styling: Tailwind utility classes vs. inline style objects + CSS classes
- Layout: 6xl/4xl wide vs. 900px max

The page feels like a different product from a different company.

**Scope:**
- [ ] Audit all visual elements on DexLandingPage.tsx
- [ ] Align heading/body typography with main landing DS (Libre Baskerville + DM Sans)
- [ ] Replace dark navy background with LYC brand light system (or determine sub-brand treatment with design team)
- [ ] Standardize border radius (0px per LYC brand)
- [ ] Standardize button styles, card styles, spacing tokens
- [ ] Ensure logo + header + footer match main landing treatment
- [ ] Verify mobile responsiveness matches main landing behavior

**Acceptance Criteria:**
- DEX AI landing page uses the same design tokens (colors, typography, spacing, radius) as Landing.tsx/B2CLanding.tsx/B2BLanding.tsx
- Header and footer are identical to main landing pages
- Visual consistency score: no obvious "different product" feeling when navigating from `/` → `/dex`

**Design Team Decision (2026-08-08): RESOLVED**
- Model: **Endorsed sub-brand** — base on full LYC Intelligence design system (typography, spacing, layout, components)
- Single differentiator: DEX AI accent color (teal/cyan family) + "Powered by DEX AI" mark
- **NOT** the current dark-navy standalone system — reads as separate company product
- Dark navy variant: **Not approved**
- DEX AI visual identity assets being finalized by brand design — spec coming within 24h
- DEX AI appears as "Powered by DEX AI" attribution, not as a hero-level brand

---

### TICKET-02: NEXUS — Create Marketing Landing Page (separate from chat interface)

**Priority:** P0
**Surface:** `/nexus`
**Type:** New Page / Brand Compliance
**Effort:** M-L

**Problem:**
`/nexus` currently renders NexusPage.tsx which is a chat interface — NOT a marketing landing page. Users landing on `/nexus` get thrown directly into a chat with zero context, no value proposition, no pricing, no signup flow. Same component is used for both public `/nexus` route and in-app `/app/chat`.

**Scope:**
- [ ] Create new NexusLanding.tsx marketing page
- [ ] Hero section with NEXUS positioning headline + subhead + primary CTA
- [ ] "What is NEXUS" section — explain the product, use cases, value props
- [ ] Feature grid / capabilities section
- [ ] Pricing section (at minimum Executive Introduction tier)
- [ ] CTA section → signup / start chat
- [ ] Standard LYC header + footer (same as other landing pages)
- [ ] Move chat interface to a separate route (e.g., `/nexus/chat`) for users who want to jump in directly
- [ ] Update all links pointing to `/nexus` to land on the marketing page
- [ ] Update App.tsx routing: `/nexus` → NexusLanding, `/nexus/chat` → NexusPage (chat UI)
- [ ] Verify in-app `/app/chat` still works with NexusPage component

**Acceptance Criteria:**
- `/nexus` shows a proper marketing landing page (not chat)
- Chat is accessible at a clear sub-route (e.g., `/nexus/chat`)
- In-app chat at `/app/chat` continues to work
- NEXUS landing page matches LYC design system

**Design Team Decision (2026-08-08): RESOLVED**
- NEXUS = the product (AI advisor / chat interface) — user-facing product name
- DEX AI = the endorsed sub-brand (underlying intelligence engine) — trust/credibility layer
- URL structure:
  - `/nexus` → NEXUS marketing page (hero → what it does → how it works → CTA)
  - `/nexus/chat` → the actual chat interface
  - `/dex-ai` → DEX AI technology/credibility page (architecture, trust signals)
- NEXUS marketing page carries "Powered by DEX AI" badge — not framed as two separate products
- DEX AI must never read as "another product to purchase" — it's the engine, not the product

---

### TICKET-03: Remove All "Free" Language — ECHO v6 Compliance

**Priority:** P0
**Surface:** All public pages (main landing, B2C, B2B, match, assessment)
**Type:** Copy / Brand Compliance
**Effort:** S

**Problem:**
Multiple CTAs and copy use the word "free", which is explicitly forbidden by ECHO v6 brand guidelines. Correct terminology:
- For assessments: "complimentary assessment"
- For tier names: "Executive Introduction" (the free tier name)

**Instances found:**
| Page | Location | Current Text | Replacement |
|------|----------|-------------|-------------|
| Main Landing (`/`) | Product card 1 CTA | "Try Free" | "Start — Executive Introduction" or "Try Complimentary" |
| B2C Landing (`/b2c`) | Hero primary CTA | "Take Free Assessment" | "Take Complimentary Assessment" |
| B2C Landing (`/b2c`) | Lead capture form | "Get your free leadership profile" | "Get your complimentary leadership profile" |
| [Audit other pages] | — | — | — |

**Status:** NOT BLOCKED — can start immediately

**Design Team Confirmation (2026-08-08):**
- Agreed P0, easiest fix — no decision dependency
- All "Free Assessment" → "Complimentary Assessment"
- "Try Free" → "Start — Executive Introduction"
- Use tier name (Executive Introduction), never "free tier" framing

**Scope:**
- [ ] Main Landing.tsx — fix "Try Free" CTA on Match Analysis card → "Start — Executive Introduction"
- [ ] B2CLanding.tsx — fix "Take Free Assessment" hero CTA
- [ ] B2CLanding.tsx — fix "Get your free leadership profile" lead capture
- [ ] Audit ALL other public pages (B2B, match, pricing, assessment) for "free" / "Free" / "FREE"
- [ ] Replace with ECHO v6 compliant terminology
- [ ] Verify no "free" variants remain (case-insensitive grep)

**Acceptance Criteria:**
- `grep -ri "free" src/pages/` returns zero matches in user-facing copy (code comments and variable names OK)
- All CTAs use "complimentary" or tier names (Executive Introduction) per ECHO v6

---

### TICKET-04: Define and Implement Unified Product Hierarchy Across All Landing Pages

**Priority:** P0
**Surface:** All landing pages + portal navigation
**Type:** Strategy + Implementation
**Effort:** L (requires brand/design decisions first)

**Problem:**
There is no clear product taxonomy. Users encounter: LYC Intelligence, DEX AI, NEXUS, SHIFT, TRIDENT, Match Analysis, Leadership Assessment, individual diagnostics — with no clear understanding of what's a brand, what's a platform, what's a product, what's a feature.

Per Akira's naming framework, there should be a 3-level system:
- Level 1: User-facing product names
- Level 2: "Powered by X" attribution
- Level 3: Internal framework code names

**Scope (pending brand decisions):**
- [ ] Document the canonical product hierarchy (brand → platform → product → feature)
- [ ] Map every current page/feature to its correct level and name
- [ ] Update hero headlines on all landing pages to reflect correct positioning
- [ ] Update navigation labels (both public header and in-app)
- [ ] Update product card copy on main landing
- [ ] Update footer site map
- [ ] Add cross-linking between related product pages

**Acceptance Criteria:**
- Every landing page clearly states what product it represents and where it sits in the portfolio
- Navigation labels use Level 1 user-facing names (no Level 3 code names in user-facing UI)
- "Powered by" attribution used where appropriate for Level 2

**Design Team Decision (2026-08-08): RESOLVED**

Official user-facing hierarchy:
- **Level 1 — Brand:** LYC Intelligence
- **Level 2 — Products:** NEXUS | SHIFT Suite | China Leadership Pipeline Diagnostic | Market Intelligence | Match Analysis
- **Level 3 — Engine:** DEX AI = the intelligence layer behind all products (not a separate product to buy)
- Tier names: Executive Introduction / Executive Access / Enterprise
- Critical rule: DEX AI must never read as "another product to purchase" — it's the engine, not the product

---

## P1 — Important (should fix pre-launch or very early post-launch)

### TICKET-05: Replace Internal Framework Names in User-Facing Navigation

**Priority:** P1
**Surface:** AppShell navigation, SurfaceTabs, portal pages
**Type:** Naming / Brand Compliance
**Effort:** M

**Problem:**
Internal code names (TRIDENT, CANVAS, GRID) are used as navigation labels in authenticated portal surfaces. Per the 3-level naming system, user-facing UI should use Level 1 names, not Level 3 framework code names.

**Current internal nav labels (Phase 10+):**
- Dashboard → Pipeline → Mandates → Candidates → **TRIDENT** → **CANVAS** → Companies → Batch Scoring → Metrix → Scoring Runs → Chat → Scheduler → Org Intel → Notifications → Settings → Advanced Ops → Scheduling+ → Intelligence+
- SurfaceTabs: Internal Ops / B2B Client / B2C Coaching / Candidate / **GRID**

**Scope:**
- [ ] Map each internal code name to its Level 1 user-facing name (needs brand team input)
- [ ] TRIDENT → ? (e.g., "Candidate Scoring" / "Match Analysis")
- [ ] CANVAS → ? (e.g., "Scorecards" / "Evaluation Profiles")
- [ ] GRID → ? (e.g., "Market Intelligence" / "Market Mapping")
- [ ] Update all navigation labels in AppShell sidebar
- [ ] Update SurfaceTabs (remove "GRID" as a user-type surface — reposition as product within surfaces)
- [ ] Update page titles/headers
- [ ] Update route names if needed (or keep internal routes, just change display labels)
- [ ] Ensure breadcrumbs and page headers use user-facing names

**Acceptance Criteria:**
- No Level 3 framework code names visible in user-facing navigation or page titles
- All labels use approved Level 1 product names
- Routes can keep internal names (SEO doesn't matter for authenticated routes)

**Design Team Decision (2026-08-08): RESOLVED**

Full nav mapping:
- TRIDENT → Match Analysis (confirmed — already the product name)
- GRID → Market Intelligence
- CANVAS → Scorecard Builder
- SHIFT → SHIFT Suite (keeps the product name, no codename issue)
- Rule: all Level 3 framework codenames are banned from user-facing UI entirely

---

### TICKET-06: B2C Landing Page — Update Content to Reflect Full Product Breadth (Post-Phase 11)

**Priority:** P1
**Surface:** `/b2c` (B2CLanding.tsx)
**Type:** Content Update
**Effort:** M

**Problem:**
B2C landing page only shows 3 assessment features (Leadership Archetype, Market Benchmark, Career Benchmark) and references CPI-style content. Once Phase 11 ships, there are 5 SHIFT diagnostics (LEAP, QUEST, DRIVE, COACH, IMPACT) plus CPI — but the B2C landing page doesn't reflect this product breadth.

**Scope:**
- [ ] Update "Your Assessment Includes" section to showcase the full SHIFT Suite (5 diagnostics)
- [ ] Add section for CPI (China Leadership Pipeline Diagnostic) if it's a separate product
- [ ] Update hero messaging to reflect the expanded assessment offering
- [ ] Update pricing / tier section if applicable
- [ ] Ensure all SHIFT diagnostic names use Level 1 user-facing names (not internal LEAP/QUEST codes)
- [ ] Add proper CTA flow (which assessment to start with? All 5? Sequenced?)

**Acceptance Criteria:**
- B2C landing page accurately represents all assessment products available at launch
- Product names match approved Level 1 naming
- Clear user journey from landing → assessment selection → results

---

### TICKET-07: Main Landing Page — Update Product Cards for Current Portfolio

**Priority:** P1
**Surface:** `/` (Landing.tsx)
**Type:** Content Update
**Effort:** M

**Problem:**
Main landing shows 3 product cards (Match Analysis, Leadership Assessment, Nexus) which reflects an old product lineup. The actual platform has expanded significantly (GRID, SHIFT Suite, DEX AI, full portal, coaching).

**Scope:**
- [ ] Redesign product showcase section to reflect current product portfolio
- [ ] Decide which products get highlighted on the main landing (3-5 key products)
- [ ] Update product descriptions and CTAs
- [ ] Ensure all product names are Level 1 compliant
- [ ] Update stat counter values if they're outdated
- [ ] Review dark CTA section copy

**Acceptance Criteria:**
- Main landing page product section accurately represents the current go-live product set
- All copy is ECHO v6 compliant (no "free")
- CTAs route to correct landing pages

---

### TICKET-08: GRID SurfaceTab — Reposition GRID as Product, Not User-Type Surface

**Priority:** P1
**Surface:** AppShell SurfaceTabs
**Type:** IA / Navigation
**Effort:** M

**Problem:**
SurfaceTabs has 5 tabs: Internal Ops → B2B Client → B2C Coaching → Candidate → GRID. The first 4 are user-type / role-based surfaces, but GRID is a product. This is information architecture inconsistency — users expect GRID to be available within their role surface, not as a peer of roles.

**Scope:**
- [ ] Remove GRID from SurfaceTabs (top-level user-type switcher)
- [ ] Add GRID / Market Intelligence as a navigation item within Internal Ops surface
- [ ] Add GRID / Market Intelligence as a navigation item within B2B Client surface (if applicable)
- [ ] Ensure GRID page is accessible from appropriate surfaces
- [ ] Update any hard-coded references to GRID as a surface type

**Acceptance Criteria:**
- GRID is a product/feature within role-based surfaces, not a peer surface
- SurfaceTabs only contains user-type surfaces (Internal Ops, B2B Client, B2C Coaching, Candidate)
- GRID functionality remains accessible to all authorized users

---

### TICKET-09: CPI Assessment — Brand Route and Page Title

**Priority:** P1
**Surface:** `/assessment` (AssessmentPage.tsx)
**Type:** Naming / Routes
**Effort:** S

**Problem:**
The CPI (China Leadership Pipeline Diagnostic) assessment lives at the generic route `/assessment` with the generic title "Leadership Assessment". It's not product-branded. Users don't know what assessment they're taking.

**Scope:**
- [ ] Decide canonical route: `/cpi` or `/china-leadership-pipeline` or `/leadership-assessment`
- [ ] Add 301 redirect from `/assessment` to the new route (or keep both)
- [ ] Update page title and meta tags with proper product name
- [ ] Update all links pointing to `/assessment`
- [ ] Ensure the assessment content matches CPI v2.0 methodology (archetypes, dimensions, scoring)

**Acceptance Criteria:**
- CPI assessment has a product-branded URL and page title
- Meta tags (title, description) reflect CPI product name
- Existing `/assessment` links either redirect or are updated

**Design Team Decision (2026-08-08): RESOLVED**

- Public name: **China Leadership Pipeline Diagnostic**
- URL: `/china-leadership-pipeline` (primary, recommended)
- Alternative: `/pipeline-assessment` if primary is too long for routing preferences
- Rule: "CPI" three letters **never** appear anywhere user-facing (URL, page title, body copy, buttons, email subjects) — purely internal shorthand
- Current `/cpi` and `/assessment` paths should 301 redirect to the public URL

---

### TICKET-10: Standardize CTA Language Across All Landing Pages

**Priority:** P1
**Surface:** All landing pages
**Type:** Copy / Consistency
**Effort:** S

**Problem:**
CTA button text is inconsistent across pages:
- "Try Free" (main landing)
- "Take Assessment" (main landing)
- "Consult" (main landing)
- "Take Free Assessment" (B2C)
- "Start Now" (DEX AI)
- "Start matching today" (B2B section header)

**Scope:**
- [ ] Define CTA naming standards per product type
- [ ] Assessment products: consistent CTA (e.g., "Start Assessment" or "Take Complimentary Assessment")
- [ ] Chat/advisory products: consistent CTA (e.g., "Start Chat" or "Try Now")
- [ ] Match/scoring products: consistent CTA
- [ ] Apply standard CTA language across all landing pages
- [ ] Ensure ECHO v6 compliance (no "free")

**Acceptance Criteria:**
- Same type of product uses the same CTA language across all pages
- All CTAs are ECHO v6 compliant
- CTA hierarchy (primary vs. secondary) is consistent

---

## P2 — Minor (polish, can be post-launch)

### TICKET-11: Nexus / NEXUS Capitalization Consistency

**Priority:** P2
**Surface:** All pages, codebase
**Type:** Copy / Consistency
**Effort:** XS

**Problem:**
"Nexus" vs. "NEXUS" capitalization is inconsistent across the codebase and UI. Akira's architecture doc uses "NEXUS" as the product name.

**Scope:**
- [ ] Grep entire codebase for "Nexus" / "NEXUS" / "nexus" in user-facing strings
- [ ] Standardize on approved capitalization
- [ ] Update page titles, navigation labels, body copy, CTAs

**Acceptance Criteria:**
- All user-facing references use consistent capitalization
- Code variable names can stay as-is (camelCase, etc.)

---

### TICKET-12: Footer Navigation Consistency Across All Landing Pages

**Priority:** P2
**Surface:** All landing pages
**Type:** UI / Consistency
**Effort:** S

**Problem:**
Footer links vary across landing pages. B2C shows: Assessment, Coaching, Intelligence, Pricing, Terms, Privacy, Cookies. Other pages may have different sets.

**Scope:**
- [ ] Audit footer content on each landing page (main, B2C, B2B, DEX, NEXUS)
- [ ] Define canonical footer navigation (products, company, legal sections)
- [ ] Standardize footer component across all landing pages
- [ ] Ensure all product pages are linked in footer

**Acceptance Criteria:**
- All public landing pages have the same footer navigation
- Footer is a single shared component (no duplicated footer code per page)

---

### TICKET-13: DEX AI Landing — Add Full Product Portfolio + Paid Tier

**Priority:** P2
**Surface:** `/dex` (DexLandingPage.tsx)
**Type:** Content Update
**Effort:** M

**Problem:**
DEX AI landing page only shows 4 features (Career Strategy, Compensation Benchmarking, Cross-Border Transitions, Confidential Advisory) and 1 pricing tier (Executive Introduction). It doesn't mention assessments, SHIFT Suite, CPI, or any paid tier.

**Scope:**
- [ ] Add section(s) for assessment products (SHIFT Suite, CPI)
- [ ] Add paid tier(s) to pricing section
- [ ] Expand feature list to match actual product capabilities
- [ ] Update hero copy to reflect full platform offering

**Acceptance Criteria:**
- DEX AI landing accurately represents the full product offering
- Pricing section shows all available tiers
- Assessment products are prominently featured

---

### TICKET-14: Match Analysis Page — Brand Compliance Review

**Priority:** P2
**Surface:** `/match` (MatchPage.tsx)
**Type:** Audit + Fix
**Effort:** S

**Problem:**
Audit noted that MatchPage uses internal framework icon code names (Prism, Bridge, Trident) and references "3 dimensions" (TRIDENT internal model). User-facing language should use Level 1 names.

**Scope:**
- [ ] Full audit of MatchPage.tsx content for naming compliance
- [ ] Replace internal framework references with user-facing names
- [ ] Verify CTA language is ECHO v6 compliant
- [ ] Verify design system matches main landing

**Acceptance Criteria:**
- No Level 3 framework code names visible on /match page
- All copy is ECHO v6 compliant
- Design matches main landing system

---

---

### TICKET-15: Internal Terminology Leak Scan — All Surfaces

**Priority:** P0
**Surface:** All 14 surfaces (public + portal)
**Type:** Copy / Brand Compliance
**Effort:** M

**Problem:**
Internal planning terminology is leaking into customer-facing surfaces. Words like "flywheel," "Layer 1/2/3," "archetype" codenames, "CPI" abbreviation, "funnel architecture" — these are internal planning terms that must never appear on customer-facing surfaces. Added as P0 by design team review.

**Terms to scan for:**
- "flywheel" (any context)
- "Layer 1" / "Layer 2" / "Layer 3" (architecture references)
- "CPI" (three-letter abbreviation — should use "China Leadership Pipeline Diagnostic" instead)
- Internal archetype codenames (Strategic Architect, Cross-Border Catalyst, etc. — verify if these are user-facing or internal)
- "funnel" / "maturity stack" in customer context
- Any other internal framework jargon

**Scope:**
- [ ] Full scan of all 8 public landing pages for internal terminology
- [ ] Full scan of all 6 portal surfaces for user-facing internal terminology
- [ ] Scan meta tags, page titles, alt text, email templates
- [ ] Replace each instance with user-facing equivalent
- [ ] Document all replacements found (for audit trail)

**Acceptance Criteria:**
- Zero internal planning/architecture terminology visible to end users
- All user-facing copy uses Level 1 product names and plain language
- "CPI" does not appear in any user-facing URL, page, or copy

---
## Summary

| Priority | Count | Tickets |
|----------|-------|---------|
| P0 (Critical) | 5 | TICKET-01, TICKET-02, TICKET-03, TICKET-04, TICKET-15 |
| P1 (Important) | 6 | TICKET-05, TICKET-06, TICKET-07, TICKET-08, TICKET-09, TICKET-10 |
| P2 (Minor) | 4 | TICKET-11, TICKET-12, TICKET-13, TICKET-14 |
| **Total** | **15** | |

## Dependencies & Blockers

**Status (2026-08-08): All 5 blocking design decisions RESOLVED by brand team review.**

All P0 tickets are now actionable. Remaining dependencies:

- **TICKET-01 (DEX AI design system):** Waiting on final DEX AI visual spec from brand design (target: within 24h). Base system alignment can start immediately — teal/cyan accent and "Powered by DEX AI" mark to be added when spec arrives.
- **TICKET-15 (Internal terminology scan):** Full scan needed — no external dependencies, can start immediately.
- **TICKET-03 (Remove "free"):** No dependencies — can start immediately.

**Ready for implementation:**
- P0: TICKET-01 (base DS), TICKET-02, TICKET-03, TICKET-04, TICKET-15
- P1: TICKET-05, TICKET-06, TICKET-07, TICKET-08, TICKET-09, TICKET-10
- P2: TICKET-11, TICKET-12, TICKET-13, TICKET-14

**Reference:** Full design team response — Feishu doc: https://l5f5m43wr.feishu.cn/docx/LmQxd3mVjowqS2xS934cL4iEnQh
