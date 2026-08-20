# V6.0 — Landing Page v3.5 Full Redesign (Production)

**Source mockup:** `design_mockups/NEXUS_Landing_v3.5.html` — open in browser, this is ground truth
**Build target:** Trae — full rewrite of `src/pages/Landing.tsx` (Next.js pages router)
**Replaces:** Current V5.3 landing page entirely
**Status:** Ready to build — highest priority
**Production URL:** https://www.lyc-intelligence.app
**Related issue:** #1391

---

## 0. Design System Canon (v3.5)

This replaces the previous token system for the marketing surface. Apply all of these.

### 0.1 Palette — 3 accent families

**Ocean (primary accent — authoritative blue):**
- 800 `#0F2C4A` | 700 `#183F5E` | 600 `#1E537A` | 500 `#2A6A95` | 400 `#3E86B5`
- 300 `#6BA8CD` | 200 `#9CC6DF` | 100 `#CFE1EE` | 50 `#EAF2F8`

**Teal (secondary accent — cyan-leaning, NOT green-leaning):**
Do NOT drift toward Cathay/Korn Ferry green. This is a cool cyan-teal.
- 700 `#0B5D6B` | 600 `#0E7B8A` | 500 `#1293A6` | 400 `#2DB0C2`
- 300 `#5AC6D5` | 200 `#8EDBE5` | 100 `#BFE9F0` | 50 `#E1F5F8`

**Fuchsia (punctuation / focal dots only — minimal):**
- 600 `#C108AB`

**Neutrals:**
- Cream `#FAFAFA` | ink-900 `#0A0A0A` | ink-700 `#333` | ink-500 `#666`
- ink-400 `#999` | ink-200 `#e0e0e0`

### 0.2 Typography

- **Display:** Crimson Pro — 300 weight for hero, 400 for section titles. Light weight, never bold for headlines.
- **Body:** Inter
- **Meta / labels / eyebrows:** IBM Plex Mono, `0.68rem`, `letter-spacing: 0.2em`, uppercase
- **Hero title:** `clamp(2.2rem, 5vw, 3.8rem)`, line-height 1.2
- **Section title:** `clamp(1.8rem, 4vw, 2.6rem)`, line-height 1.25
- **Body serif:** `1.25rem`, line-height 1.55

### 0.3 Wordmark

- "NEXUS." — **no space before the dot**
- Dot is fuchsia (`#C108AB`)
- Crimson Pro, 700 weight

### 0.4 Visual Language

- Editorial minimalism — rule lines, not cards
- Zero `border-radius` everywhere
- No box shadows
- No gradients (except hero video overlay — see §2.2)
- SVG line icons: `stroke-width: 1.2`, no fill, ocean-500 color

---

## 1. Page Structure (8 sections, top to bottom)

1. Fixed Nav — translucent dark + backdrop blur
2. Hero — full viewport, video bg, 60% black overlay
3. What It Is — cream bg, 4 numbered items
4. Capabilities — cream bg, 11 lenses compact row
5. Membership — white bg, 5-column tier grid
6. Testimonial — cream bg, centered quote
7. Final CTA — full dark section
8. Footer — dark bg, 3-column links

---

## 2. Section-by-Section Build Spec

### 2.1 Fixed Nav

- **Background:** `rgba(10, 10, 10, 0.5)` + `backdrop-filter: blur(12px)`
- **Left:** NEXUS. wordmark (cream)
- **Center links:** What it is / Capabilities / Membership (anchor links to their sections)
- **Right CTA button:** "Experience NEXUS" — 1px border, cream text, hover inverts (cream bg, ink-900 text)
- Fixed position, full width

### 2.2 Hero

**Full viewport height (100vh). Dark background.**

- **Video background:** `/hero-bg.mp4` — `autoplay muted loop playsinline`
- **Overlay:** Solid black at 60% opacity — `rgba(10, 10, 10, 0.6)`. NOT a gradient. Solid 60% black transparency.
- **Eyebrow:** "Executive Intelligence" — teal-400, mono
- **Headline (2 lines):**
  - Line 1: "Know where you stand."
  - Line 2: "Know where to go." — italic, teal-300
- **Primary CTA:** "Experience NEXUS" — solid cream button
- **Secondary CTA:** "What it is" — text link with bottom border
- **Fuchsia focal dot:** 4px circle at right edge (visual punctuation)
- Content is vertically centered, left-aligned within the container

### 2.3 What It Is

**Cream background.**

- **Eyebrow:** "What it is" — ocean-600, mono
- **Section title (2 lines):**
  - "A place for the thinking"
  - "you can't take anywhere else."
- **Subhead:** "NEXUS holds the full picture of where you are and where you're heading. Always on. Fully discreet. Gets sharper the more you talk."

**4 numbered items with rule lines between:**

01 — "Talk through what's on your mind. NEXUS listens, remembers everything, and asks the questions you haven't thought to ask yourself yet."

02 — "Your thinking builds over time. You can see the shape of your progression across four pillars — positioning, leadership, operating, narrative — not just a list of tasks."

03 — "When you want structure, use a lens. Eleven different ways of looking at the same situation, each built around how senior leaders actually think."

04 — "Sometimes you need a human in the room. Book a debrief with an LYC advisor who already knows your context. No intake forms, no catching up."

- Number format: `01`, `02`, etc. — mono, ocean-600
- Rule lines (1px solid) between each item, ink-200
- Left-aligned stacked vertical layout

### 2.4 Capabilities

**Cream background.**

- **Eyebrow:** "Capabilities" — ocean-600, mono
- **Section title (2 lines):**
  - "Eleven ways to look deeper."
  - "One place that holds them all."
- **Sub:** "Use them one at a time. Or let NEXUS suggest what you're not seeing in a conversation."

**Single row of 11 lens cells — compact, equal width, vertical rule lines between cells:**

Each cell: small line icon (24×24) + lens name below.

**Lenses in order (left to right):**
PRISM → LEAP → MOSAIC → BRIDGE → COACH → IMPACT → DRIVE → QUEST → SPARK → FORGE → CPI

- Vertical rule lines (1px, ink-200) between each cell
- All 11 fit in one horizontal row (compact, not a grid)

**Footer row below the lenses row:**
- Left: "CPI is the flagship — a private day with your advisor, by introduction only."
- Right: "Explore all lenses →" link

### 2.5 Membership

**White background.**

- **Eyebrow:** "Membership" — ocean-600, mono
- **Section title (2 lines):**
  - "Five levels."
  - "One standard of discretion."
- **Sub:** "Start wherever it makes sense. Move up when the work calls for it. Every tier gets the same measured, competent attention."

**5-column grid with rule lines (not cards):**

| Column | Tier label | Name | Price | Included |
|--------|-----------|------|-------|----------|
| 1 | Entry | Explorer | To begin | Conversation access · PRISM and LEAP lenses · Starter credits to begin |
| 2 | Foundational | Starter | $29 / month | Everything in Explorer · Two structured sessions per month · Milestone tracking · Human debriefs — on request |
| 3 | **Recommended** | **Pro** | **$79 / month** | **All eleven lenses · Open conversation access · Milestone tracking · Document library — 50MB · Human debriefs — on request** |
| 4 | Senior | Executive | $199 / month | Everything in Pro · Percentile baselines · 360° feedback integration · Two included human debriefs per month · Document library — 250MB |
| 5 | Private | Council | By introduction | CPI flagship assessment · DEX integration · Dedicated LYC advisor · Document library — 1GB · Invitation-only |

**Pro column = featured / highlighted:**
- Dark background (`#0A0A0A`)
- Teal top border accent (4px solid teal-500)
- Cream text
- "Recommended" eyebrow in teal-400 mono

**Each column structure (top to bottom):**
1. Tier level label — mono, ocean-600 / teal-400 (for featured)
2. Tier name — serif display
3. Price — serif italic
4. "Included" mono label
5. Feature list — em dash bullets (— feature)
6. CTA link at bottom

**Vertical rule lines** between columns, not card borders. No box shadows. No border-radius.

### 2.6 Testimonial

**Cream background, centered layout.**

- Large quote mark — ocean-200, huge serif display size
- **Quote:** "I've had three coaches over the last ten years. None of them remembered the things I said three sessions ago. NEXUS does."
- **Attribution:** Willy Te / VP Operations · Fortune 500
- Narrow max-width (~640px), centered

### 2.7 Final CTA

**Full dark section (ink-900 background).**

- Subtle radial gradient glow — ocean-600 at 15% opacity, centered behind text (only for depth, not for color accent)
- **Eyebrow:** "Begin" — teal-400, mono
- **Title (2 lines):**
  - "First session."
  - "Complimentary."
- **Body:** "A conversation about what's on your mind, and whether this is the right fit. You'll know quickly."
- **CTA button:** "Experience NEXUS" — solid cream
- Content is centered

### 2.8 Footer

**Dark background (ink-900).**

**Top area:**
- **Left:** NEXUS. wordmark + tagline "Executive intelligence. Always on." below it
- **3 columns of links:**
  - **Product:** Capabilities, Membership, For teams
  - **Company:** About, LYC Partners, Press
  - **Legal:** Privacy, Terms, Security

**Bottom bar:**
- Left: © 2026 NEXUS .
- Right: Shanghai · Singapore · Paris

---

## 3. Content Rules (Non-Negotiable)

### 3.1 Banned Words — Do NOT Let Any Through

**Hard banned:**
architecture / architect, framework, platform, navigate / navigation, fire / burn / ignite / flame, leverage, landscape, disrupt / disruption, calibrated / calibration, flywheel, layer / Layer, maturity stack, stages, signals, entry point, funnel, endorsed brand, taxonomy rule, anti-positioning, quiet, war / force, hunt / hunting, free

**Banned phrases:**
"here's the trap / trick / secret", "in today's world", "thought leader / thought leadership", "game-changer", "synergy", "touch base", "deep dive", "unpack", "navigate", "at the end of the day", "that being said", "it's important to note that", "What do you think?", "Let me know your thoughts", "I'd love to hear your perspective"

**Banned structures:**
- "Not X, but Y" structure
- "The problem is X. The solution is Y." structure
- Bullet point overload (we use rule lines, not bullet lists — except tier feature lists)

### 3.2 Tier 2 Identity Bans

- "dashboard" → "milestones" or "tracking"
- "assessment" → "lens" (EXCEPTION: CPI = "flagship assessment")
- "tool" → "intelligence"
- "app" → never mention, it's NEXUS
- "SaaS" → never
- "AI-powered" → omit entirely
- "unlimited" → "open" or "open access"
- "chatbot / bot" → "coach" or "intelligence"

### 3.3 Tone Rules

- No hedging
- No advice-giving stance
- No guru positioning
- No motivational fluff
- No corporate consultant speak
- No content bro tone
- **No defensive sales language** — don't say "no pitch", "no follow-up call", "no credit card". Ritz doesn't say "no hidden fees" — they just don't have them.

### 3.4 White Space / Iceberg Principle

Show, don't tell. Trust the reader to fill the gap. 1/8 presented, 7/8 reader completes the meaning. No thesis statements — put precise observations and let the reader draw conclusions.

---

## 4. Technical Notes

### 4.1 File to Replace

- `src/pages/Landing.tsx` — full rewrite
- `src/components/marketing/MarketingLayout.tsx` — update if needed for new footer
- `src/components/marketing/MarketingNav.tsx` — update to v3.5 nav style
- The existing `UnifiedFooter` is app-style. This landing needs its own marketing footer. Wrap or replace.

### 4.2 Hero Video

- File: `/hero-bg.mp4` — already exists in `public/` (verified on production)
- `autoplay muted loop playsinline`
- 60% black overlay — solid, not gradient
- Fallback: dark background (`#0A0A0A`) if video fails to load

### 4.3 Preserve Existing Integrations

- Keep existing imports for SEO / metadata
- Keep analytics tracking — wire up `trackCTA` on all CTA buttons
- "Experience NEXUS" primary CTAs → route to `/auth/signup` or existing entry flow (match current behavior)

### 4.4 Responsive

- Collapse grids to 1-2 columns on mobile
- Capabilities row → horizontal scroll or stacked on mobile
- Membership 5-column → stacked vertically on mobile
- Hero headline scales with `clamp()` — already responsive

### 4.5 Motion

- Preserve existing scroll reveal if it fits the design
- Otherwise use simple fade-in on section entry
- No excessive animation — understated, editorial

---

## 5. Deployment Checklist

- [ ] Build locally — verify no TypeScript / build errors
- [ ] Visual check against mockup (`NEXUS_Landing_v3.5.html`) — section by section
- [ ] Hero video plays correctly, 60% black overlay applied (solid, not gradient)
- [ ] All 5 membership tiers render correctly, Pro column is dark featured
- [ ] 11 lenses in capabilities row — correct order, compact, rule lines between
- [ ] Wordmark is "NEXUS." — no space before dot, fuchsia dot
- [ ] Footer tagline: "Executive intelligence. Always on."
- [ ] Banned words audit — grep for all terms in §3.1 and §3.2
- [ ] Lighthouse visual pass
- [ ] All CTAs route correctly
- [ ] Responsive mobile check
- [ ] Commit with message: `V6.0: Landing page v3.5 full redesign`
- [ ] Push to main → Vercel auto-deploys
- [ ] Verify production: https://www.lyc-intelligence.app
- [ ] Close issue #1391

---

## 6. Reference Files

- Mockup: `design_mockups/NEXUS_Landing_v3.5.html`
- Brand positioning: NEXUS v2.2 (discreet executive intelligence for senior leaders)
- Diagnostic canon: 11 lenses, 4-Pillar structure
- Previous landing: `src/pages/Landing.tsx` (V5.3 — to be replaced)
