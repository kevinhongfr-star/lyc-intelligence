# LYC Website — Consolidated Build Plan
## CD Requirements → Website Route Mapping with Dependencies

**Generated:** 2026-07-20 | **Status:** DRAFT — Not deployed, no live changes
**Source:** All 24 CD documents (Phase A: CD01-CD16, Phase B: CD17-CD24)

---

## Design Decisions — RESOLVED (Kevin 2026-07-20)

| # | Decision | Resolution |
|---|---|---|
| 1 | Navbar naming | **Keep "Network"** — no rename |
| 2 | Webinar URL | **`/webinars/[slug]`** |
| 3 | Diagnostic gating | **Gated full report** — free archetype name teaser → email gate → full report with dimensions, modifiers, dev plan |
| 4 | B2C platform | **`lyc-intelligence.app`** — separate subdomain, NOT in website scope |
| 5 | Archetype visuals | **Unique icon per archetype + color per instrument** — design system needed before Phase 1 |
| 6 | Newsletter | **Keep Resend** — add archetype segmentation tags |
| 7 | Roundtable payment | **Separate payment flow** — independent from webinar registration |

---

## Phase Overview (6 Phases, ~76 page-level changes)

| Phase | What | Pages | Est. Effort |
|---|---|---|---|
| **0** | Data Architecture (CD16 API spec) | Spec doc | 2 days |
| **1** | Archetype Foundation (CD10/01/11) — 7 new diagnostic pages + 4 edits | 12 | 5 days |
| **2** | Webinar Engine (CD18/19) — calendar hub + 24 webinar pages | ~26 | 7 days |
| **3** | Content Cascade (CD14/20) — newsletter/podcast/brief hubs | 4 | 3 days |
| **4** | Premium Products (CD22) — Council + Roundtable pages | 3 | 3 days |
| **5** | Programmes/Workshops (CD12/15) | 10 | 5 days |
| **6** | Global Integration (CD23) — soft CTAs on ALL pages | All | 5 days |

**Note:** B2C courses (4 pages) are on `lyc-intelligence.app` — out of scope for this website build.

---

## Phase 0: Data Architecture (CD #16)

**Must complete first — no visual changes yet**

| Component | Spec | CD16 Defines |
|---|---|---|
| Assessment Result Schema | `/api/assessment/` | `instrument_id`, `dimension_scores`, `archetype {name, category, description, core_strength, key_risk, development_priority[], confidence}`, `modifiers {}` |
| Classification Engine | `/api/classify/` | Deterministic (same scores → same archetype). Confidence scoring. "Transitional" flag for boundary cases |
| Modifier System | Backend | Per-instrument: AI Readiness, Engagement Risk, APAC Credibility, APAC Legibility Gap, Three Fires, Team Gap, Revenue Scale, APAC Geopolitical |

---

## Phase 1: Archetype Foundation (CD #10, #11, #01)

### 1.1 Edit Existing Pages (4)

| Route | Changes |
|---|---|
| `/assess/bridge` | Add 6 BRIDGE archetypes + Three Fires overlay + archetype teaser |
| `/assess/spark` | Add 4 SPARK archetypes + APAC AI modifier |
| `/platform` | "9 instruments, 62 named archetypes" + archetype teaser per instrument |
| `/advisory` | Archetype-based service descriptions per Force |

### 1.2 New Diagnostic Pages (7)

| Route | Diagnostic | Archetypes |
|---|---|---|
| `/assess/quest` | QUEST Leadership Capability | 10: Architect, Catalyst, Diplomat, Commander, Navigator, Strategist, Engine, Entrepreneur, Specialist, Seedling |
| `/assess/drive` | DRIVE Motivational Profile | 10: Achiever, Craftsman, Champion, Explorer, Stalwart, Restless, Golden Handcuffs, Drifter, Burned-Out, Frozen Asset |
| `/assess/impact` | IMPACT Board Effectiveness | 8: Architect, Steward, Networker, Guardian, Visionary, Bridge-Builder, Nominee, Passenger |
| `/assess/prism` | PRISM Brand Identity | 10: Authority, Signal, Monument, Chameleon, Amplifier, Operator, Ghost, Mask, Static, Blank Page |
| `/assess/mosaic` | MOSAIC Cultural Intelligence | 4: Catalyst, Expert, Leader, Tourist |
| `/assess/forge` | FORGE Revenue Leadership | 4: Rainmaker, System Builder, Revenue Architect, Promoted Seller × 3 tiers |
| `/assess/shift` | SHIFT Composite | Cross-instrument composite view |

### 1.3 Archetype Result Page (Template)

**Gated model (Kevin's decision):**
- **Free:** Archetype name + 1-paragraph description + instrument color + archetype icon
- **Gated (email required):** Full dimension radar chart, modifier readout, confidence indicator, core strength, key risk, development priorities (3 items), share button

### 1.4 Design System Prerequisite

Before Phase 1 pages are built:
- 9 instrument colors (one per diagnostic)
- 62 archetype icons (one per archetype)
- Archetype card component (name + icon + color + teaser text)
- Radar chart component for gated results

---

## Phase 2: Webinar Engine (CD #18, #19)

### 2.1 `/webinars` — Calendar Hub

- Hero: "Executive Forum — Free Monthly Webinars for APAC Leaders"
- 24-webinar grid (2/month, Aug 2026 – Jul 2027)
- Filter by: diagnostic, theme, date
- Each card: Title | Date | Linked Diagnostic | Speaker | Register CTA
- Upcoming 3 highlighted + past with replay links
- Newsletter signup embedded
- Standing CTA: "Can't find a topic? Try our free diagnostics →"

### 2.2 `/webinars/[slug]` — Individual Pages (24)

Standard template per CD19/FW-2:
1. Hero: Title + Date + Register CTA
2. Speaker: Kevin Hong + Guest
3. What You'll Learn (3-5 bullets)
4. Related LYC Products:
   - Free Diagnostic → `/assess/[diagnostic]`
   - Programme → `/programmes/[slug]`
   - Workshop → `/workshops/[slug]`
5. Soft CTAs (inline):
   - Quick Diagnostic | Nexus Advisory | Exec Search | Council | Roundtable
6. Content Cascade: Newsletter recap | Podcast | Brief | LinkedIn
7. Upcoming Webinars (next 3)

### 2.3 `/webinars/[slug]/register` — Registration Flow

- Form: name, email, title, company
- Auto-confirmation + calendar invite
- Post-webinar sequence: replay → diagnostic CTA → next webinar

### Webinar Calendar (24 entries from CD18):

| Month | Theme | Linked Diagnostic |
|---|---|---|
| Aug 2026 | The Governance Shift | BRIDGE |
| Sep 2026 | Cross-Border Teams | MOSAIC |
| Oct 2026 | AI-Ready Leadership | SPARK |
| Nov 2026 | The Revenue Architect | FORGE |
| Dec 2026 | Board Effectiveness | IMPACT |
| Jan 2027 | Leading the SHIFT | SHIFT Composite |
| Feb 2027 | Executive Presence in AI Age | QUEST |
| Mar 2027 | The Succession Illusion | DRIVE |
| Apr 2027 | Brand Identity Borderless | PRISM |
| May 2027 | The Integrated Leader | SHIFT + LEAP |
| Jun 2027 | Career Resilience | DRIVE + LEAP |
| Jul 2027 | Invitation Council Launch | All 9 |

---

## Phase 3: Content Cascade (CD #14, #20)

| Route | What | CD Source |
|---|---|---|
| `/insights` (edit) | Add standing sections: Webinar Recap, Podcast Corner, Advisory CTA, Upcoming Webinars, Council mention, Archetype Spotlight | CD20 |
| `/insights/newsletter` (new) | Newsletter hub — all issues archived with webinar recap + diagnostic CTA | CD20 |
| `/insights/podcast` (new) | 4 tracks mapped to webinar themes | CD20 |
| `/insights/brief` (new) | Quarterly Executive Brief — aggregates 3 months webinar insights + diagnostic data. Gated download. | CD20 |

---

## Phase 4: Premium Products (CD #22)

| Route | What | CD Source |
|---|---|---|
| `/council` (new) | Invitation Council — charter, speaker pathway (auto-invite), member benefits, apply form | CD22/FW-5 |
| `/roundtable` (new) | Roundtable product — format, pricing ($500 attendees / $800 direct / $300 council / free speakers), calendar (2/month), **separate payment flow** | CD22/FW-5 |
| `/network` (edit) | Reframe as Council + Roundtable hub with "Start with a free webinar" entry | CD22 |

---

## Phase 5: Programmes & Workshops (CD #12, #15)

### 5.1 Programme Pages (5)

| Route | Programme | Linked Diagnostic | Linked Webinar |
|---|---|---|---|
| `/programmes/advisory` | P1.1 Advisory Programme | All | All |
| `/programmes/governance` | P1.2 Governance Dev (Force 1) | BRIDGE | Month 1 |
| `/programmes/cross-border` | P2.1 Cross-Border Dev (Force 2) | MOSAIC + BRIDGE | Month 2 |
| `/programmes/ai-leadership` | P3.1 AI Leadership Dev (Force 3) | SPARK + QUEST | Month 3 |
| `/programmes/coaching` | P3.3 Coaching Programme | All | All |

Each page: "Start Here: Free Webinar" section + Free Diagnostic CTA + Archetype preview + Soft CTA block

### 5.2 Workshop Pages (5)

| Route | Workshop | Linked Webinar |
|---|---|---|
| `/workshops/force-1-discovery` | Force 1 Discovery | Month 1: Governance |
| `/workshops/team-cohesion` | Team Cohesion | Month 2: Cross-Border |
| `/workshops/career-resilience` | Career Resilience | Month 11 |
| `/workshops/revenue-leadership` | Revenue Leadership | Month 4 |
| `/workshops/shift-facilitation` | SHIFT Full-Day | Month 6 |

### B2C Courses — OUT OF SCOPE
`lyc-intelligence.app` handles these. Website links out.

---

## Phase 6: Global Integration (CD #23)

### 6.1 Universal Soft CTA Block (all pages)

```
Explore Before You Commit
🎓 Free Webinar → [Next webinar]
🔍 Free Diagnostic → [9 diagnostics]
💬 Nexus Advisory → [Booking link]
🏛️ Invitation Council → [/council]
```

### 6.2 Footer Update
Add: Webinar calendar link, Newsletter signup, "Take a free diagnostic"

### 6.3 Homepage Enhancement
Add: "What's your leadership archetype?" secondary CTA + webinar calendar widget

### 6.4 Global Newsletter Signup (Resend)
All pages → persistent signup field
Diagnostic results → "Get archetype insights in your inbox"
Webinar pages → "Register + newsletter" combo

---

## Dependency Graph

```
Phase 0: Data Architecture ──→ Phase 1: Archetype Foundation
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
            Phase 2: Webinar    Phase 5: Programmes   Design System
            Engine (26 pages)   & Workshops (10pp)    (icons+colors)
                    │
            ┌───────┼───────┐
            ▼       ▼       ▼
        Phase 3  Phase 4  Phase 6
        Content  Premium  Global
        Cascade  Products Integration
```

---

## CD → Route Quick Reference

| CD# | Primary Website Route(s) |
|---|---|
| 01 | ALL (impact analysis) |
| 02 | `/assess/quest` |
| 03 | `/assess/drive` |
| 04 | `/assess/impact` |
| 05 | `/assess/prism` |
| 06 | `/assess/bridge` |
| 07-09 | `/insights/*` (content format) |
| 10 | ALL diagnostic pages + `/platform` + `/advisory` |
| 11 | Assessment API, result pages |
| 12 | `/programmes/*`, `/workshops/*` |
| 13 | Pricing/service pages (minor) |
| 14 | `/insights/newsletter`, `/insights/podcast` |
| 15 | ~~B2C courses~~ → `lyc-intelligence.app` (out of scope) |
| 16 | API architecture |
| 17 | ALL (flywheel impact) |
| 18 | `/webinars` (24 entries) |
| 19 | `/webinars/[slug]` template |
| 20 | `/insights/newsletter`, `/insights/podcast`, `/insights/brief` |
| 21 | Registration flows |
| 22 | `/council`, `/roundtable` |
| 23 | ALL pages (soft CTAs) |
| 24 | ALL routes (master restructure) |

---

## Summary: What's In Scope vs. Out

| In Scope (Website) | Out of Scope |
|---|---|
| ~66 new pages | ~278 Notion-only content updates |
| ~10 edited pages | B2C platform (`lyc-intelligence.app`) |
| Design system (icons+colors) | Notion database restructuring |
| API spec + data model | Email automation setup (Resend flows) |
| Webinar calendar + pages | Sales deck updates |
| Council + Roundtable pages | Training module scripts |

**Nothing deployed. Nothing on live site. This is a staging document only.**
