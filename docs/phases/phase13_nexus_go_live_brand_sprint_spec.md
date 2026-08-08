# Phase 13 — NEXUS Go-Live Brand Sprint

**Phase:** 13
**Priority:** CRITICAL — Go-Live Blocker
**Branch:** feature/eo4-b2c-portal-phase6
**Predecessor:** Phase 12 (CPI v2.0) — PASS at commit 8d485ea

---

## Overview

NEXUS is the product. Everything else (assessments, match analysis, market intelligence) lives inside it or is surfaced through it. Phase 13 rebuilds the public-facing surface to tell that story — clearly, consistently, and on-brand.

**The current problem:**
- 8 landing pages with inconsistent messaging, no clear hero product
- DEX AI uses a completely different (unapproved) dark navy design system
- `/nexus` is just a chat component, not a product page
- Product hierarchy is confusing (NEXUS? DEX AI? SHIFT? CPI? TRIDENT?)
- "Free" language violates brand rules
- Internal codenames leak into user-facing UI

**Phase 13 deliverables:**
1. NEXUS hero marketing page at `/nexus`
2. Main landing (`/`) rebuilt NEXUS-centric
3. DEX AI credibility page at `/dex-ai` (LYC design system + teal accent)
4. Kill deprecated routes (old `/dex` dark navy page, `/b2c` duplicate)
5. Pricing page NEXUS-standardized (3 tiers)
6. All "free" language → brand-compliant terminology
7. Internal terminology leak scan + fix
8. Nav naming cleanup (remove codenames)
9. URL naming cleanup (CPI → public name)
10. Full regression — Phase 7-12 all still work

---

## Architecture Decision — NEXUS-Centric Information Architecture

### Canonical Product Hierarchy
```
LYC Intelligence (brand)
└── NEXUS (the product — AI advisor)
    ├── Chat (primary interface)
    ├── Match Analysis (capability surfaced by NEXUS)
    ├── China Leadership Pipeline Diagnostic (assessment)
    ├── SHIFT Suite assessments (LEAP/QUEST/DRIVE/COACH/IMPACT)
    ├── Market Intelligence (GRID-based capability)
    └── Scorecard Builder (CANVAS-based capability)
Powered by DEX AI (engine layer — attribution only)
```

### Public URL Map After Phase 13

| URL | Page | Purpose | Status |
|-----|------|---------|--------|
| `/` | MainLanding | NEXUS-focused hero landing | Rebuild |
| `/nexus` | NexusLanding | NEXUS product page (deep marketing) | New |
| `/nexus/chat` | NexusPage (chat) | NEXUS chat interface | Move (was `/nexus`) |
| `/b2b` | B2BLanding | Enterprise / B2B solutions | Keep (minor updates) |
| `/pricing` | PricingPage | NEXUS tier pricing | Update |
| `/dex-ai` | DexAiPage | DEX AI tech credibility page | New (replaces old `/dex`) |
| `/match` | MatchPage | Match Analysis tool entry | Keep (de-marketize) |
| `/china-leadership-pipeline` | CPI assessment landing | Assessment tool entry | New (replaces `/assessment`) |

### Deprecated Routes (301 Redirects)
| Old URL | New URL | Reason |
|---------|---------|--------|
| `/dex` | `/dex-ai` | DEX AI is engine credibility, not product page |
| `/b2c` | `/nexus` | B2C marketing folds into NEXUS product page |
| `/assessment` | `/china-leadership-pipeline` | Brand-compliant URL, no internal shorthand |
| `/cpi` | `/china-leadership-pipeline` | CPI = internal name only |

### Authenticated Routes (Unchanged URL, updated labels)
- `/coaching` → stays as B2C coaching portal (NEXUS dashboard)
- `/app/*` → internal ops portal (nav labels updated, URLs unchanged)
- `/b2b/*` → B2B client portal (unchanged)

---

## Deliverable 1 — NEXUS Hero Marketing Page (`/nexus`)

**File:** `src/pages/NexusLanding.tsx`
**Route:** `/nexus`
**Design system:** Full LYC Intelligence (Libre Baskerville headings, DM Sans body, #C108AB accent, 0px radius, 900px max-width container)

### Page Structure (top → bottom)

1. **Header** — same as main landing (LYC Intelligence logo + nav)
   - Nav items: NEXUS, For Business, Pricing
   - CTA: "Start Free" → "Start — Executive Introduction"

2. **Hero Section**
   - Headline: Position NEXUS as the AI leadership advisor
   - Subhead: What it does in one sentence
   - Primary CTA: "Start — Executive Introduction" (leads to signup / chat)
   - Secondary: "See how it works" (anchor to below)
   - "Powered by DEX AI" small attribution badge

3. **What Is NEXUS** (3-4 bullets / features)
   - AI advisory chat
   - Leadership assessments (featured: China Leadership Pipeline Diagnostic)
   - Candidate match analysis
   - Market intelligence

4. **How It Works** (3-step flow)
   - Start a conversation
   - Get personalized insights & assessments
   - Take action with recommendations

5. **Featured Capability — China Leadership Pipeline Diagnostic**
   - Highlights the flagship assessment
   - CTA: "Take Complimentary Assessment"

6. **For Business** (teaser + link to /b2b)
   - Enterprise use cases
   - "Talk to sales" CTA

7. **Pricing Teaser**
   - 3 tiers: Executive Introduction / Executive Access / Enterprise
   - Link to `/pricing`

8. **Final CTA**
   - Big "Start — Executive Introduction" CTA

9. **Footer** — same as main landing

### Requirements
- Fully responsive
- Uses the same design tokens as Landing.tsx and B2BLanding.tsx
- "Powered by DEX AI" appears in small print / badge form only — never as a hero element
- No dark navy, no separate color system
- All copy uses NEXUS = the product framing

---

## Deliverable 2 — Main Landing Rebuild (`/`)

**File:** `src/pages/Landing.tsx`
**Route:** `/`

### Changes from Current Version
- **Hero:** Focus on NEXUS as the core product (not a grid of multiple products)
- **Product grid:** Replace the 3-product grid with NEXUS as hero + key capabilities as sub-items
- **Structure:**
  1. Header (unchanged component, updated nav labels)
  2. Hero — NEXUS headline + CTA
  3. "What NEXUS Does" — 4 capabilities (chat, assessments, match, market intel)
  4. Social proof / trust section
  5. CTA section
  6. Footer (updated links)

---

## Deliverable 3 — DEX AI Credibility Page (`/dex-ai`)

**File:** `src/pages/DexAiPage.tsx`
**Route:** `/dex-ai`
**Replaces:** Old `/dex` route (DexLandingPage.tsx and all `/dex/*` dark navy pages)

### Purpose
DEX AI is the engine, not a product. This page exists for credibility/trust — people who want to understand the technology behind NEXUS. It's lightweight, technical, and framed as "what powers NEXUS."

### Design System
- Base: Full LYC Intelligence design system (light, Libre Baskerville + DM Sans)
- Accent: DEX AI teal/cyan accent color (use a reasonable teal like #0D9488 or #06B6D4 pending final brand spec — pick one that looks good and we can adjust later)
- NO dark navy variant
- "Powered by DEX AI" badge format

### Page Structure
1. Header — same as other landing pages
2. Hero — "Powered by DEX AI" positioning, not a product sell
3. Architecture overview — how DEX AI powers NEXUS capabilities
4. Trust & security signals
5. Back to NEXUS CTA
6. Footer

---

## Deliverable 4 — Deprecated Routes & Redirects

Implement 301 redirects for:
- `/dex` → `/dex-ai`
- `/b2c` → `/nexus`
- `/assessment` → `/china-leadership-pipeline`
- `/cpi` → `/china-leadership-pipeline`

Also clean up:
- Remove old dark navy DexLandingPage.tsx and related `/dex/*` pages from public routing
- Keep DexJourneyPage, DexPlanPage, DexBookPage, DexAssessPage, DexChatPage components but mark as deprecated (we may repurpose some as NEXUS feature pages later)
- Update all internal links across the codebase to point to new URLs

---

## Deliverable 5 — Pricing Page Standardization

**File:** `src/pages/PricingPage.tsx`
**Route:** `/pricing`

### Required Changes
- Standardize around NEXUS as the product
- 3 tiers: **Executive Introduction** (free tier name), **Executive Access**, **Enterprise**
- Remove any "free" / "Free" / "FREE" language — use tier names
- Update feature lists to match NEXUS capabilities
- Ensure all CTAs use brand-compliant language

---

## Deliverable 6 — "Free" Language Removal (Brand Compliance)

**Scope:** All public-facing pages, components, and UI copy

### Rules (from brand team)
- "Free Assessment" → "Complimentary Assessment"
- "Try Free" → "Start — Executive Introduction"
- "Free tier" → "Executive Introduction" (use the tier name)
- Use tier name, never "free tier" framing

### Action
- Search entire `src/` directory for: free, Free, FREE
- Replace each instance with brand-compliant terminology
- Exclude code comments and variable names (only user-facing copy)
- After completion, verify with case-insensitive grep on user-facing strings

---

## Deliverable 7 — Internal Terminology Leak Scan (TICKET-15, P0)

**Scope:** All public-facing + portal UI

### Terms to scan for and remove from user-facing surfaces:
| Internal Term | User-Facing Replacement |
|---------------|------------------------|
| CPI (as product name) | China Leadership Pipeline Diagnostic |
| TRIDENT | Match Analysis |
| GRID | Market Intelligence |
| CANVAS | Scorecard Builder |
| SHIFT (as framework name) | SHIFT Suite (product name, OK to use) |
| flywheel | (remove — internal architecture term) |
| Layer 1 / Layer 2 / Layer 3 | (remove — internal architecture terms) |
| archetype (in user context) | leadership profile / leadership type |
| funnel (in product context) | pathway / journey / progression |
| ECHO (as a brand reference) | LYC Intelligence / design system |

### Action
- Full codebase scan for these terms in user-facing copy
- Replace each with user-facing equivalent
- Nav labels, buttons, page titles, meta descriptions, body copy — all of it
- Note: Terms in variable names, code comments, API paths, and internal-only surfaces are OK

---

## Deliverable 8 — Navigation Naming Cleanup

### Public Header Nav
- Current: inconsistent mix of product names
- Update to: NEXUS, For Business, Pricing
- Logo links to `/`

### B2C Coaching Portal Sidebar (`/coaching`)
Current labels → New labels:
| Current | New |
|---------|-----|
| Coach | NEXUS Chat |
| CPI Assessment | Pipeline Diagnostic |
| Credits | Credits (OK, not a codename) |
| Intelligence | (keep or re-label) |
| Career Intel | (keep or re-label) |
| Profile | Profile (OK) |

### Internal Ops Nav (`/app/*`)
Current labels → New labels:
| Current | New |
|---------|-----|
| TRIDENT | Match Analysis |
| CANVAS | Scorecard Builder |
| GRID | Market Intelligence |
| SHIFT | SHIFT Suite |

Note: Internal ops URLs (`/app/trident`, `/app/canvas`, etc.) can stay as-is for now — only the display labels change.

---

## Deliverable 9 — CPI URL Branding (TICKET-09)

- Create `/china-leadership-pipeline` route for the assessment entry point
- `/assessment` → 301 to `/china-leadership-pipeline`
- `/cpi` → 301 to `/china-leadership-pipeline`
- All references to "CPI" in user-facing copy → "China Leadership Pipeline Diagnostic"
- The B2C coaching portal route `/coaching/cpi` can stay internally but nav label changes (see Deliverable 8)

---

## Deliverable 10 — No Regressions

Verify all existing functionality still works:
- Phase 7 (Reports) — all report types
- Phase 7.5 (Coaching) — coaching handler + chat
- Phase 8 (Client Portal) — all 9 pages
- Phase 9 (GRID) — handler + page
- Phase 10 (TRIDENT/CANVAS/Candidates) — all handlers + pages
- Phase 11 (SHIFT Suite) — all 5 diagnostics
- Phase 12 (CPI v2.0) — handler + page + report
- All dispatch registrations intact
- All existing tests pass

---

## Acceptance Criteria

1. `/nexus` renders a proper NEXUS marketing page (not chat)
2. `/nexus/chat` renders the chat interface
3. `/dex-ai` renders DEX AI credibility page in LYC design system (no dark navy)
4. Main landing `/` is NEXUS-centric
5. All "free" language removed from user-facing copy
6. All internal codenames removed from user-facing UI labels
7. "CPI" does not appear in any user-facing copy or URL
8. All deprecated routes return 301 to correct new URLs
9. Pricing page shows 3 NEXUS tiers with correct names
10. Phase 7-12 all functional — zero regressions
11. Design system consistent across all public pages (LYC = light, Libre Baskerville + DM Sans, #C108AB accent, 0px radius)
12. "Powered by DEX AI" attribution present, subtle, never hero-level

---

## Out of Scope

- New backend functionality (all frontend / brand / IA changes)
- New assessment types
- New portal features
- Backend API changes (unless needed for routing redirects)
- DEX AI visual identity final spec (pending brand team — use reasonable teal placeholder)
