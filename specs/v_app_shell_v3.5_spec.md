# V-App — App Shell v3.5 Full Rebuild

**Source mockups (ground truth):** All 5 approved v3.5 mockups in `design_mockups/`.
**Build target:** Trae — Next.js App Router, full app shell redesign across 5 view groups
**Replaces:** Current v3.0 app shell (chat, lenses, milestones, documents, settings)
**Design system:** v3.5 — ocean/teal/fuchsia, Crimson Pro display / Inter body / IBM Plex Mono meta, editorial minimalism, zero radius, rule lines not cards
**App content column:** `max-width: 960px`, centered (narrower than marketing's 1160px)
**Build type:** FUNCTIONAL REBUILD — wire to real backend. Mock data only as temporary fallback during development; must be removed before PR.

---

## 0. Design System Canon (v3.5 — App Variant)

Carried forward from marketing v3.5 with app-specific adjustments. All app pages must use this system exclusively.

### 0.1 Palette

**Ocean (primary accent — authoritative blue):**
- 800 `#0F2C4A` | 700 `#183F5E` | 600 `#1E537A` | 500 `#2A6A95` | 400 `#3E86B5`
- 300 `#6BA8CD` | 200 `#9CC6DF` | 100 `#CFE1EE` | 50 `#EAF2F8`

**Teal (secondary accent — cyan-leaning, NOT green-leaning):**
- 700 `#0B5D6B` | 600 `#0E7B8A` | 500 `#1293A6` | 400 `#2DB0C2`
- 300 `#5AC6D5` | 200 `#8EDBE5` | 100 `#BFE9F0` | 50 `#E1F5F8`

**Fuchsia (punctuation / focal dots only — minimal):**
- 600 `#C108AB`

**Neutrals:**
- Cream `#FAFAFA` | ink-900 `#0A0A0A` | ink-800 `#1a1a1a` | ink-700 `#333333`
- ink-500 `#666666` | ink-400 `#999999` | ink-200 `#e0e0e0` | ink-100 `#f0f0f0` | ink-50 `#fafafa`
- White `#ffffff`

**Score bar colors:**
- OK (≥70): teal-500
- Warning (45-69): ocean-400
- Critical (<45): fuchsia-600
- Locked: ink-100

### 0.2 Typography

- **Display/serif:** Crimson Pro — 300 for page titles, 400 for section titles, 600 for wordmark, 500/600 for lens names and key labels
- **Body:** Inter (300-600 weights)
- **Meta / eyebrows / labels:** IBM Plex Mono, `0.68rem` (11px), `letter-spacing: 0.12em`, uppercase, 500 weight
- **Page title:** `clamp(1.8rem, 3.5vw, 2.6rem)`, Crimson Pro 300, line-height 1.2
- **Section title:** `clamp(1.3rem, 2.5vw, 1.7rem)`, Crimson Pro 400, line-height 1.25
- **Body:** 14-15px, line-height 1.6

### 0.3 Wordmark

- "NEXUS." — no space before the dot
- Dot is fuchsia (`#C108AB`)
- Crimson Pro, 600-700 weight

### 0.4 Visual Language (App Variant)

- Editorial minimalism — rule lines, not cards
- Zero `border-radius` everywhere
- No box shadows
- No gradients
- SVG line icons: `stroke-width: 1.2`, no fill, ocean-500 / ink-400 color
- App content max-width: **960px**, centered
- Sidebar: 272px fixed width, dark (ink-900)
- Topbar: 64px fixed height, white, bottom border 1px ink-100
- White space / iceberg principle — generous padding, restraint in density

### 0.5 Voice Rules

- Second-person address ("you") — never first-person "I/me/my" from NEXUS
- No "the product", "the platform", "the tool"
- Concierge tone: quiet, precise, discreet, confident
- White space / iceberg principle — show 1/8, let reader complete 7/8

---

## 1. App Shell Architecture

### 1.1 Layout Structure

```
┌─────────────────────────────────────────────┐
│ Sidebar (272px, dark)    │ Topbar (64px)    │
│                           ├──────────────────┤
│                           │ Main content     │
│  • NEXUS wordmark         │  (960px centered)│
│  • Nav sections           │                  │
│  • Footer (user + plan)   │                  │
└───────────────────────────┴──────────────────┘
```

### 1.2 Routes & Views

| Route / View | Group | Description |
|---|---|---|
| `/nexus/chat` | V2 — Chat | Conversation list + message thread + composer |
| `/nexus/lenses` | V3 — Lenses | 11 lenses across 2 suites, 3-col grid, tier gating |
| `/nexus/milestones` | V4 — Milestones | Vertical timeline, secondary nav |
| `/nexus/profile` | V4 — Profile | Avatar card + detail rows |
| `/nexus/settings` | V4 — Settings | Grouped form with toggles + selects |
| `/nexus/documents` | V5 — Documents | Filter + search + list rows |
| `/nexus/booking` | V5 — Booking | Session types + calendar + time slots + confirm |
| `/nexus/billing` | (future) | Billing + subscription management |

### 1.3 Shared Components

- SidebarNav (dark, fixed)
- Topbar (breadcrumbs + actions)
- PageHeader (kicker + title + description)
- Button (primary / secondary / ghost / danger)
- Badge (status / tier / count)
- Tabs (filter tabs, secondary nav)
- FormRow (label + control + helper text)
- ToggleSwitch
- Select
- Input + Textarea
- ScoreBar
- ListRow
- Modal
- EmptyState
- LoadingSkeleton

---

## 2. V1 — App Shell (Sidebar + Topbar + Layout)

### 2.1 Sidebar

**Container:**
- 272px width, full viewport height, fixed position, left: 0, top: 0
- Background: ink-900
- Border right: 1px solid rgba(255,255,255,0.06)
- Scrollable if content overflows

**Brand section:**
- Padding: 28px 24px 22px
- Border bottom: 1px solid rgba(255,255,255,0.06)
- Wordmark: "NEXUS." in Crimson Pro 22px / 600, cream color, dot = fuchsia-600
- Tagline below: mono 10px, ink-500, letter-spacing 0.12em uppercase

**Navigation:**
- Section labels: mono 10px, ink-500, padding 20px 24px 8px
- Nav items:
  - Height: ~38px (9px vertical padding + 24px horizontal)
  - Gap between icon and label: 12px
  - Icon: 16px x 16px, stroke, opacity 0.7
  - Label: 13.5px, 400 weight, ink-500
  - Badge (right-aligned): mono 10px / 500, ink-100 bg / ink-500 text
  - Border left: 2px solid transparent
  - Hover: ink-50 bg, ink-800 text
  - Active:
    - Background: ocean-50
    - Text: ocean-700, 500 weight
    - Left border: ocean-600
    - Badge: ocean-100 bg / ocean-700 text
    - Icon: opacity 1

- Nav sections:
  1. **Workspace** — Chat, Lenses, Milestones
  2. **Resources** — Documents, Bookings (or "Sessions")
  3. **Account** — Profile, Settings, Billing

**Divider:** 1px solid ink-100, margin 8px 24px

**Footer (user section):**
- Margin-top: auto (pushes to bottom)
- Padding: 16px 24px
- Border top: 1px solid ink-100
- Avatar: 32x32, ocean-700 bg, white text, 12px / 600
- Name: 13px / 500, ink-800
- Plan: mono 11px, ink-400 (e.g., "PROFESSIONAL")

### 2.2 Topbar

- Height: 64px, fixed, full width minus sidebar
- Background: white
- Border bottom: 1px solid ink-100
- Padding: 0 32px
- Z-index: 90

**Breadcrumbs (left):**
- Display: flex, gap 8px, align center
- Font size: 13px
- Crumb (inactive): ink-400
- Crumb (current): ink-800, 500 weight
- Separator: ink-200

**Actions (right):**
- Margin-left: auto
- Display: flex, gap 16px
- Icon buttons: 36x36, ink-400 → ink-700 on hover, ink-50 bg on hover

### 2.3 Main Content Area

- Margin-left: 272px (sidebar width)
- Margin-top: 64px (topbar height)
- Min-height: calc(100vh - 64px)
- Background: cream

**Page header:**
- Padding: 48px 32px 32px
- Max-width: 960px (centered within main area)
- Kicker: mono 11px / 500, teal-600, letter-spacing 0.1em, uppercase, margin-bottom 12px
- Title: Crimson Pro, clamp(1.8rem, 3.5vw, 2.6rem), 300 weight, ink-900
- Description: 15px, ink-500, margin-top 12px, max-width ~640px

**Content body:**
- Padding: 0 32px 80px
- Max-width: 960px, centered

---

## 3. V2 — Chat Interface

### 3.1 Layout

Three-panel layout inside the main area:
- Left: conversation list (fixed width ~280px, white bg, right border 1px ink-100)
- Center: message thread (flex-1, cream bg)
- Right: info panel (collapsible, 320px, white bg, left border)

### 3.2 Conversation List (Left Panel)

- Background: white
- Right border: 1px solid ink-100

**Search input:**
- Padding: 16px 20px
- Border bottom: 1px solid ink-100
- Input: 13px, placeholder ink-400
- Search icon (16px, ink-400) + input, no border

**New chat button:**
- Primary variant (ocean-600 bg, white text)
- Full width of panel minus padding
- Height: 36px
- Margin: 12px 20px
- Text: "New conversation" or "+ New chat"

**Conversation items:**
- Padding: 12px 20px
- Border bottom: 1px solid ink-50
- Cursor: pointer
- Active state: ocean-50 bg, left border 2px ocean-600

**Each item:**
- Title row: 13px / 500, ink-800, truncate
- Preview row: 12px, ink-400, truncate, margin-top 3px
- Date: mono 10px, ink-300, top-right aligned
- Active: ocean-700 text for title, ocean-600 left bar

### 3.3 Message Thread (Center)

**Header:**
- Height: 56px
- Border bottom: 1px solid ink-100
- Padding: 0 32px
- Display: flex, align center, justify between
- Left: conversation title (Crimson Pro 16px / 500, ink-900) + context badge (mono 10px, teal-600 bg / teal-50 text)
- Right: action icons (share, info panel toggle)

**Messages area:**
- Padding: 32px
- Flex-direction: column, gap 24px
- Max-width: 720px, centered within thread area

**User message:**
- Align: right
- Max-width: 75%
- Background: ocean-600
- Color: white
- Padding: 14px 18px
- Border-radius: 0 (zero radius rule)
- Font: 14.5px, line-height 1.6

**NEXUS message:**
- Align: left
- Max-width: 80%
- Display: flex, gap 14px
- Avatar: 28x28, ocean-700 bg, white initials, "N"
- Content bubble:
  - Background: white
  - Border: 1px solid ink-100
  - Padding: 16px 20px
  - Color: ink-800
  - Font: 14.5px, line-height 1.7
  - Prose styling (paragraphs, bold, lists, code blocks)

**Streaming state:**
- NEXUS avatar with pulsing dot (fuchsia-600)
- Typing indicator: 3 dots, ocean-200 → ocean-500, staggered animation

### 3.4 Composer (Bottom)

- Sticky to bottom of thread panel
- Background: white
- Border top: 1px solid ink-100
- Padding: 16px 32px

**Composer input area:**
- Border: 1px solid ink-200
- Focus border: ocean-400
- Min-height: 48px, max-height 160px
- Padding: 12px 16px
- Font: 14.5px

**Toolbar (below or above input):**
- Left side: attachment icon, lens selector, file upload
- Right side: send button (circular, ocean-600 bg, white arrow icon)

**Send button:**
- 36x36
- Ocean-600 background
- White paper plane icon
- Disabled state: ink-200 bg, ink-400 icon

---

## 4. V3 — Lenses Library

### 4.1 Layout

- Page header with kicker, title, description
- Two suite sections stacked vertically
- Each section: suite header + 3-column grid of lens cards

### 4.2 Suite Header

- Display: flex, align baseline, justify between
- Border bottom: 1px solid ink-200
- Padding-bottom: 12px
- Margin: 32px 0 24px
- Suite name: mono 11px / 500, ink-700, letter-spacing 0.12em, uppercase
- Suite count: mono 10.5px, ink-400
  - SHIFT: "5 of 5 unlocked"
  - Advisory: "3 of 6 unlocked · upgrade for full access" (teal-600 for upgrade link)

### 4.3 Lens Grid

- Display: grid, `grid-template-columns: repeat(3, 1fr)`
- Gap: 16px
- Margin-bottom: 24px

**Note:** SHIFT Suite has 5 lenses + 1 empty placeholder cell (total 6 = 2 rows × 3 cols). Advisory Suite has 6 lenses (2 rows × 3 cols), first 3 unlocked, last 3 locked.

### 4.4 Lens Card (Unlocked)

**Structure (top to bottom):**
1. Top row: lens code (left) + score (right)
2. Lens name (full width)
3. Score bar (full width)
4. Insight text (full width, 1 line)

**Card body:**
- Background: white
- Border: 1px solid ink-100
- Padding: 20px
- Cursor: pointer
- Transition: all 0.15s
- Hover: border-color ocean-200, transform translateY(-1px)

**Top row:**
- Display: flex, justify between, align baseline
- Lens code: mono 10.5px / 500, ocean-600, letter-spacing 0.1em, uppercase
- Score: Crimson Pro 26px / 300, ink-900 (big number, no suffix)

**Lens name:**
- Crimson Pro 16px / 600, ink-900
- Margin-top: 8px

**Score bar:**
- Height: 2px
- Background: ink-100
- Margin: 12px 0 10px
- Fill: height 2px, transitions width 0.3s
  - ≥70 → teal-500
  - 45-69 → ocean-400
  - <45 → fuchsia-600

**Insight:**
- Font size: 12.5px
- Color: ink-500
- Line-height: 1.5
- Truncate: 1 line (ellipsis)

### 4.5 Active Lens State

When a lens is the current/active diagnostic view:
- Background: ocean-50
- Border: 2px solid transparent on all sides + 2px solid fuchsia-600 on top
  - Implementation: use `border-top: 2px solid var(--fuchsia-600)` + other borders 1px ocean-100, or inset box-shadow
- Lens code: ocean-700
- Score: ink-900

### 4.6 Locked Lens State

- Opacity: 0.45
- Background: white
- Border: 1px dashed ink-200
- Cursor: default (not pointer)
- Hover: no change (no lift, no border change)
- Lens code: ink-400, with lock icon (12px) before it
- Score: hidden (empty space, same height)
- Score bar fill: 0%, ink-100 background
- Lens name: ink-600
- Insight: italic, ink-400, "Upgrade to Executive to unlock."

### 4.7 Full Lens Roster

**SHIFT Suite (5 lenses — all unlocked on Professional+):**
| Code | Name | Category |
|---|---|---|
| LEAP | Competitive Positioning | Strategic |
| QUEST | Strategic Readiness | Strategic |
| DRIVE | Execution Capability | Operational |
| COACH | Leadership Coaching | Leadership |
| IMPACT | Organizational Impact | Composite |

**Advisory Suite (6 lenses — first 3 on Professional, full on Executive+):**
| Code | Name | Tier Access |
|---|---|---|
| PRISM | Career & Brand | Professional+ |
| BRIDGE | Cross-Cultural | Professional+ |
| FORGE | Sales Excellence | Professional+ |
| MOSAIC | CQ Development | Executive+ (locked on Pro) |
| SPARK | AI Readiness | Executive+ (locked on Pro) |
| IMPACT | Stakeholder Influence | Executive+ (locked on Pro) |

### 4.8 Tier Gating Logic

| Tier | SHIFT Suite | Advisory Suite |
|---|---|---|
| Explorer | 1 lens (trial) | 0 |
| Starter | 3 lenses | 0 |
| Professional | All 5 | PRISM, BRIDGE, FORGE (3 of 6) |
| Executive | All 5 | All 6 |
| Council | All 5 | All 6 + priority |

---

## 5. V4 — Milestones / Profile / Settings

All three views share the same secondary nav pattern under the topbar.

### 5.1 Secondary Nav (Shared)

- Location: directly below topbar, inside main content area
- Background: white
- Border bottom: 1px solid ink-100
- Padding: 0 32px

**Nav items:**
- Display: inline-flex, gap 0
- Each tab:
  - Padding: 16px 0
  - Margin-right: 32px
  - Font: 14px, 400 weight, ink-500
  - Border bottom: 2px solid transparent
  - Cursor: pointer
- Active tab:
  - Color: ink-900, 500 weight
  - Border bottom: 2px solid ocean-600
- Hover: color ink-700

**Tabs:** Milestones · Profile · Settings · Billing

### 5.2 Milestones View

**Page header:** kicker + title + description + progress summary (top right)

**Overall progress bar (below header):**
- Full-width bar, background ink-100, height 4px
- Fill: ocean-500
- Percentage label: mono 11px, ink-500, right-aligned above bar

**Timeline pattern:**

Vertical line with milestone nodes. Two-column layout inside each milestone card:
- Left column (narrow, ~140px): meta labels (horizon + impact)
- Right column (wide): headline + description + status + progress bar

**Milestone card structure:**
- Display: grid, `grid-template-columns: 140px 1fr`
- Padding: 24px 0
- Border bottom: 1px solid ink-100
- Position relative (for timeline line)

**Timeline line:**
- Vertical line, 1px, ink-200
- Position: absolute, left: 70px (centered in meta column or offset)
- Top: 0, bottom: 0

**Milestone dot:**
- 10px diameter
- Border: 2px solid white
- Position on the timeline line
- Colors:
  - Completed: teal-500 solid
  - In Progress: ocean-500 solid
  - At Risk: fuchsia-600 solid
  - Not Started: ink-200 (outline only)

**Left column (meta):**
- Horizon label: mono 10.5px, ink-400, uppercase, letter-spacing 0.1em
- Impact badge:
  - Background: ocean-50
  - Text: ocean-700, mono 10px, 500, uppercase, letter-spacing 0.1em
  - Padding: 3px 8px
  - Display: inline-block, margin-top 6px
  - Critical impact: fuchsia-50 bg / fuchsia-700 text

**Right column (content):**
- Headline: Crimson Pro 17px / 600, ink-900
- Description: 13.5px, ink-500, margin-top 6px, line-height 1.6
- Status row (below description):
  - Status badge: mono 10px, 500, uppercase, padding 3px 10px
    - In Progress: ocean-50 bg / ocean-700 text
    - Completed: teal-50 bg / teal-700 text
    - Not Started: ink-100 bg / ink-500 text
    - At Risk: fuchsia-50 bg / fuchsia-700 text
  - Progress bar (if In Progress): height 2px, ink-100 bg, ocean-500 fill, width by %
  - Target date: mono 10.5px, ink-400, right-aligned

**Milestone count:** 5 milestones (Phase 1 through Phase 5, or named milestones)

### 5.3 Profile View

**Layout:** two-column grid
- Left column (narrow ~280px): avatar card
- Right column (wide ~620px): profile detail rows

**Avatar card (left):**
- Background: white
- Border: 1px solid ink-100
- Padding: 32px
- Text-align: center
- Avatar: 80x80, ocean-700 bg, white initials, 28px / 600 Crimson Pro
- Name: Crimson Pro 22px / 500, ink-900, margin-top 16px
- Plan badge: mono 10.5px / 500, teal-50 bg / teal-700 text, padding 4px 10px, uppercase, letter-spacing 0.1em, margin-top 8px
- Mini stats (below, 3 columns):
  - Stat number: Crimson Pro 20px / 400, ink-900
  - Stat label: mono 9.5px, ink-400, uppercase, letter-spacing 0.1em
  - e.g., Miles used · Lenses active · Sessions booked

**Detail rows (right):**

7 detail rows, each with label + value + edit action:
- Full name
- Email
- Company
- Role / Title
- Tier / Plan
- Member since
- Referral source

**Row pattern:**
- Display: flex, align center, justify between
- Padding: 16px 0
- Border bottom: 1px solid ink-100
- Label: mono 11px / 500, ink-400, uppercase, letter-spacing 0.1em, width ~160px
- Value: 14.5px, ink-800, flex: 1
- Edit: 12.5px, ocean-600, cursor pointer, mono or regular

### 5.4 Settings View

**Two groups with section headers:**

**Group 1 — Notifications**
- Section header: Crimson Pro 18px / 500, ink-900, margin-bottom 4px
- Section description: 13px, ink-500, margin-bottom 20px

**Setting rows (toggle type):**
- Display: flex, justify between, align center
- Padding: 16px 0
- Border bottom: 1px solid ink-100
- Left side:
  - Label: 14px / 500, ink-800
  - Helper text: 12.5px, ink-400, margin-top 2px
- Right side: toggle switch

**Setting rows (select type):**
- Same left side (label + helper)
- Right side: select dropdown
  - Height: 36px
  - Border: 1px solid ink-200
  - Padding: 0 12px
  - Font: 13.5px, ink-700
  - Background: white
  - Chevron icon (14px, ink-400)

**Toggle switch:**
- Width: 36px, height: 20px
- Background: ink-200 (off) → ocean-500 (on)
- Thumb: 16px diameter, white
- Transition: background 0.2s

**Group 2 — Privacy & Data**
Same pattern as Notifications with different fields.

**Fields (total ~6):**
1. Email notifications — toggle
2. Weekly digest — toggle
3. Product updates — toggle
4. Email frequency — select (Real-time / Daily digest / Weekly)
5. Share anonymous usage data — toggle
6. Data retention — select (6 months / 1 year / 2 years / Indefinite)

---

## 6. V5 — Documents + Booking

### 6.1 Documents View

**Layout:**
- Filter + search row (top)
- Document list (below)

**Filter + search row:**
- Display: flex, align center, justify between
- Margin-bottom: 24px
- Left: filter tabs
- Right: search input

**Filter tabs (left-aligned):**
- Display: flex, gap 0
- Tab:
  - Padding: 8px 16px
  - Font: 13px, ink-500
  - Border bottom: 1px solid transparent
  - Cursor: pointer
- Active tab:
  - Color: ink-900, 500 weight
  - Border bottom: 2px solid ocean-600
- Tab options: All · Reports · Briefs · Session Notes

**Search input (right-aligned):**
- Width: 240px
- Height: 36px
- Border: 1px solid ink-200
- Focus: border ocean-400
- Padding: 0 12px 0 36px (with search icon)
- Font: 13px
- Search icon: 14px, ink-400, position absolute left 12px

**Document list:**
- Background: white
- Border: 1px solid ink-100

**List row (each document):**
- Display: flex, align center, justify between
- Padding: 16px 20px
- Border bottom: 1px solid ink-100
- Last row: no bottom border
- Cursor: pointer
- Hover: background ink-50

**Left side (content):**
- Display: flex, align flex-start, gap 14px
- Icon: 20px, ocean-500 stroke, no fill (document icon variant)
- Text block:
  - Title: 14px / 500, ink-800
  - Subtitle: 12.5px, ink-400, margin-top 3px
    - e.g., "Generated Aug 15 · 8 min read"

**Right side (meta + action):**
- Display: flex, align center, gap 16px
- Status badge:
  - mono 10px / 500, uppercase, letter-spacing 0.1em
  - padding: 3px 8px
  - Variants:
    - Ready: teal-50 bg / teal-700 text
    - Draft: ink-100 bg / ink-500 text
    - Processing: ocean-50 bg / ocean-700 text
- Date: mono 11px, ink-400
- Chevron: 14px, ink-300

**Sample documents (6 total):**
1. Leadership Drift Readout — Ready — Aug 18
2. Q2 Executive Brief — Ready — Aug 12
3. Competitive Positioning — Ready — Aug 8
4. Coaching Session #3 — Processing — Aug 5
5. Career Narrative — Draft — Jul 28
6. Onboarding Summary — Ready — Jul 15

### 6.2 Booking View

**Three sections stacked:**
1. Session type selector (top)
2. Calendar + time slots (middle, two-panel)
3. Confirmation bar (bottom, full-width)

**Session type selector:**
- Display: grid, `grid-template-columns: repeat(3, 1fr)`
- Gap: 1px (achieved with 1px gap + ink-200 bg, each card has white bg)
- Margin-bottom: 24px

**Session type card:**
- Background: white
- Border: 1px solid ink-200 (or use gap trick)
- Padding: 20px
- Cursor: pointer
- Transition: all 0.15s

**Selected state:**
- Border: 2px solid ocean-500
- Background: ocean-50 (subtle)
- Padding adjusts by 1px to account for thicker border

**Card content:**
- Duration label: mono 10.5px / 500, ocean-600, uppercase, letter-spacing 0.1em, margin-bottom 8px
- Name: Crimson Pro 17px / 600, ink-900
- Description: 12.5px, ink-500, margin-top 6px, line-height 1.5

**Three session types:**
1. **Executive Coaching** — 60 min — Deep-dive session on a priority milestone or lens
2. **Diagnostic Review** — 45 min — Walk through your full diagnostic readout
3. **Quick Check-in** — 20 min — Tactical questions, quick decisions, progress sync

**Two-panel section (calendar + time slots):**
- Display: grid, `grid-template-columns: 1fr 1fr`
- Background: ink-200 (gap color)
- Border: 1px solid ink-200
- Gap: 1px
- Margin-bottom: 24px

**Left panel — Calendar:**
- Background: white
- Padding: 24px
- Month header:
  - Display: flex, justify between, align center
  - Month name: Crimson Pro 16px / 500, ink-900
  - Nav arrows: 16px icons, ink-400, cursor pointer
- Weekday row:
  - 7 columns
  - mono 10px / 500, ink-400, uppercase, letter-spacing 0.1em
  - Text-align center, padding-bottom 12px
- Days grid:
  - 7 columns, 5-6 rows
  - Gap: 2px
- Day cell:
  - Aspect-ratio ~1/1 or fixed height 40px
  - Display: flex, align center, justify center
  - Font: 13px, ink-700
  - Cursor: pointer
  - Hover: background ink-50
- Selected day:
  - Background: ocean-600
  - Color: white
  - Font-weight: 500
- Today:
  - Border: 1px solid ocean-300
  - Color: ocean-700
- Other month: ink-300
- Unavailable: ink-200 text, not clickable

**Right panel — Time slots:**
- Background: white
- Padding: 24px
- Date heading:
  - Crimson Pro 20px / 500, ink-900
  - e.g., "Tuesday, August 27"
- Subtitle:
  - 13px, ink-500, margin-top 4px
  - "Available times · Eastern Time"
- Time slots grid (below):
  - Margin-top: 20px
  - Display: grid, `grid-template-columns: 1fr 1fr`
  - Gap: 8px
- Time slot button:
  - Height: 42px
  - Border: 1px solid ink-200
  - Background: white
  - Font: 13.5px, 500, ink-700
  - Cursor: pointer
  - Text-align center
  - Hover: border ocean-300, background ocean-50
- Selected time slot:
  - Border: 1px solid ocean-500
  - Background: ocean-50
  - Color: ocean-700
- Unavailable slot:
  - Background: ink-50
  - Color: ink-300
  - Text-decoration: line-through (or not shown)
  - Cursor: not-allowed

**Sample time slots (8-10 available per day):**
- 9:00 AM
- 10:00 AM
- 11:00 AM
- 1:00 PM
- 2:00 PM
- 3:00 PM
- 4:00 PM

**Confirmation bar (full width, bottom):**
- Background: ink-900
- Color: cream
- Padding: 20px 32px
- Display: flex, align center, justify between

**Left side (summary):**
- Label: mono 10.5px / 500, ink-400, uppercase, letter-spacing 0.1em
  - "Selected session"
- Summary: Crimson Pro 17px / 500, cream
  - "Executive Coaching · 60 min · Tue, Aug 27 · 10:00 AM"

**Right side (CTA):**
- Primary button:
  - Background: fuchsia-600
  - Color: white
  - Padding: 12px 28px
  - Font: 14px / 500
  - Border: none
  - Cursor: pointer
  - Text: "Confirm booking"
- Disabled state: background ink-700, color ink-500, cursor not-allowed

---

## 7. Shared Component Library

### 7.1 Buttons

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | ocean-600 | white | none | Main CTA |
| Secondary | white | ocean-700 | 1px ocean-200 | Secondary actions |
| Ghost | transparent | ink-700 | none | Text actions |
| Dark (confirm bar) | fuchsia-600 | white | none | Dark bar CTA |
| Danger | white | fuchsia-700 | 1px fuchsia-200 | Destructive |

- Height: 36px (default), 42px (large), 30px (small)
- Padding: 0 16px (default), 0 24px (large)
- Font: 13.5px, 500 weight
- Zero border-radius
- Hover: slight darken for primary, ocean-50 bg for secondary

### 7.2 Badges

| Type | Background | Text | Use |
|---|---|---|---|
| Status — Ready | teal-50 | teal-700 | Completed items |
| Status — In Progress | ocean-50 | ocean-700 | Active items |
| Status — At Risk | fuchsia-50 | fuchsia-700 | Risk items |
| Status — Draft | ink-100 | ink-500 | Draft items |
| Tier — Pro | ocean-50 | ocean-700 | Pro tier |
| Tier — Executive | teal-50 | teal-700 | Executive tier |
| Count | ink-100 / ocean-100 (active) | ink-500 / ocean-700 | Nav badges |

- All: mono font, 10px, 500 weight, uppercase, letter-spacing 0.1em
- Padding: 3px 8px (small) or 4px 10px (regular)
- Zero border-radius

### 7.3 Form Elements

**Input / Textarea:**
- Height: 36px (input), auto (textarea)
- Border: 1px solid ink-200
- Focus: border ocean-400, outline none
- Padding: 0 12px (input), 10px 12px (textarea)
- Font: 13.5px, ink-700
- Placeholder: ink-400
- Zero border-radius

**Select:**
- Same sizing as input
- Chevron icon (14px) on right
- Custom appearance (remove native arrow)

**Toggle Switch:**
- 36px × 20px track
- 16px diameter thumb
- Off: ink-200 track / white thumb
- On: ocean-500 track / white thumb
- Transition: background 0.2s ease

**Form row pattern:**
- Label: 14px / 500, ink-800
- Helper text: 12.5px, ink-400, margin-top 3px
- Control (right-aligned or below)

### 7.4 Score Bar

- Height: 2px
- Background track: ink-100
- Fill: variable color based on score
- No border-radius
- Width transitions: 0.3s ease

### 7.5 Empty State

- Centered layout
- Icon: 40px, ink-200 stroke
- Title: Crimson Pro 18px / 500, ink-700, margin-top 16px
- Description: 13.5px, ink-400, margin-top 8px, max-width 360px
- CTA button: primary or secondary, margin-top 20px

### 7.6 Modal

- Backdrop: rgba(10,10,10,0.5)
- Panel: white, 1px border ink-200, max-width 480px
- Padding: 32px
- Zero border-radius
- Header: Crimson Pro 19px / 600, ink-900
- Body: 14px, ink-600, margin-top 12px
- Footer: right-aligned buttons, margin-top 24px, gap 12px

---

## 8. Implementation Notes

### 8.1 Stack & Structure

- Next.js App Router
- TypeScript
- Tailwind CSS (with custom tokens matching v3.5 palette)
- Component library in `src/components/app/`
- App pages in `src/app/nexus/`

### 8.2 File Organization

```
src/
├── app/nexus/
│   ├── layout.tsx          (app shell: sidebar + topbar)
│   ├── chat/page.tsx
│   ├── lenses/page.tsx
│   ├── milestones/page.tsx
│   ├── profile/page.tsx
│   ├── settings/page.tsx
│   ├── documents/page.tsx
│   └── booking/page.tsx
├── components/app/
│   ├── shell/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── PageHeader.tsx
│   ├── chat/
│   │   ├── ConversationList.tsx
│   │   ├── MessageThread.tsx
│   │   ├── MessageBubble.tsx
│   │   └── Composer.tsx
│   ├── lenses/
│   │   ├── LensGrid.tsx
│   │   └── LensCard.tsx
│   ├── milestones/
│   │   ├── MilestoneTimeline.tsx
│   │   ├── SecondaryNav.tsx
│   │   └── ProfileCard.tsx
│   ├── settings/
│   │   ├── SettingsGroup.tsx
│   │   ├── ToggleRow.tsx
│   │   └── SelectRow.tsx
│   ├── documents/
│   │   ├── DocumentList.tsx
│   │   ├── DocumentRow.tsx
│   │   └── FilterBar.tsx
│   ├── booking/
│   │   ├── SessionTypeSelector.tsx
│   │   ├── BookingCalendar.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   └── ConfirmBar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── ScoreBar.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Toggle.tsx
│       ├── Modal.tsx
│       └── EmptyState.tsx
├── styles/
│   └── tokens.css          (CSS custom properties for v3.5)
└── config/
    └── lenses.ts           (11 lens definitions, tier gating)
```

### 8.3 CSS Tokens

All v3.5 design tokens must be available as CSS custom properties and as Tailwind config extensions. The token set must match the marketing site's v3.5 tokens for consistency, with app-specific additions (sidebar width, topbar height, app content max-width).

### 8.4 Responsive Behavior

- Desktop (≥1280px): full sidebar + content layout as designed
- Tablet (768-1279px): sidebar collapsible to icon-only, content adapts
- Mobile (<768px): sidebar as slide-out drawer, topbar with menu toggle

**Note:** Mobile is phase 2. First build targets desktop-first at 1280px+.

### 8.5 Accessibility

- Semantic HTML (`nav`, `main`, `section`, `button`, etc.)
- Keyboard navigation (tab order, focus states)
- ARIA labels for icon-only buttons
- Color contrast: WCAG AA minimum for all text
- Focus indicators: 2px ocean-400 outline

### 8.6 Motion

- Subtle transitions only (0.15s-0.25s)
- Hover states: background color + border color changes
- No large animations or page transitions
- Score bars animate width on load (0.3s ease)
- Respect `prefers-reduced-motion`

---

## 9. Backend Integration

Every view must pull real data from the existing backend. Mock data is allowed only as a temporary development scaffold and must be removed before PR.

### 9.1 Backend Integration — Per View

**Chat:**
- Wire to existing Supabase/Postgres conversations and messages tables
- Streaming via existing chat API route (look at current chat implementation)
- Conversation list pulls from `conversations` table, filtered by authenticated user
- Message thread pulls from `messages` table for active conversation
- Composer sends to existing streaming endpoint
- Preserve all existing chat logic, streaming, and agent orchestration — only rebuild the UI

**Lenses:**
- Use existing assessments/diagnostics system
- Lens scores come from real diagnostic results per user
- Tier gating reads from user's actual subscription tier
- Unlocked/locked state computed from lens tier requirements + user's real tier
- Insight text comes from real lens readout generation, not hardcoded
- 11 lens roster (code, name, suite, description) is config data — can live in `src/config/lenses.ts` but scores/state must be real

**Milestones:**
- Use existing milestones/goals system
- Status, progress, target dates from real data
- Impact level and horizon are real fields
- Click through to existing milestone detail pages if they exist

**Profile & Settings:**
- Profile data reads from `users` table (name, email, company, role, etc.)
- Settings write to user preferences table (find existing schema)
- Toggle and select values must persist on change
- Tier/plan info from subscription table

**Documents:**
- Document list pulls from real documents/generated_reports table
- Status field (ready/draft/processing) reflects real generation state
- Categories map to real document types
- Clicking navigates to real document readout

**Booking:**
- Session types mapped to real session products
- Calendar availability pulls from real scheduling backend
- Time slots = real available slots, not hardcoded
- Confirm bar calls real booking creation endpoint

### 9.2 Data Loading Patterns

- Server Components for initial data fetch (App Router pattern)
- Client components for interactive state (filters, toggles, selections)
- Loading skeletons during data fetch (matching component shape)
- Error states with retry for failed fetches
- Empty states when no data exists (first-time user)

### 9.3 Migration from Existing Code

This is NOT a greenfield build. The app already works with real data.

- Rebuild the UI in place, reusing ALL backend logic, API routes, data fetching, and business logic
- Replace old UI components with new v3.5 components
- Keep data layer, auth, middleware, and all server code intact
- If old components use different patterns (Pages Router), migrate to App Router but preserve data logic
- Explore the codebase first. Understand what exists before changing anything.

---

## 10. Data Models (Reference — NOT Mock Data)

These types describe the shape of real data from the backend. They are NOT data to hardcode.

### 10.1 Core Types

```typescript
interface Lens {
  code: string;           // "LEAP", "PRISM", etc.
  name: string;           // "Competitive Positioning"
  suite: 'shift' | 'advisory';
  description: string;    // 1-line insight
  score?: number;         // 0-100, undefined if locked
  unlocked: boolean;
  tierRequired: 'starter' | 'professional' | 'executive';
}
```

**Milestones array:**
```typescript
interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started' | 'at-risk';
  horizon: string;        // "Phase 1" or "Q3 2026"
  impact: 'critical' | 'high' | 'medium' | 'low';
  progress: number;       // 0-100
  targetDate: string;
}
```

**Documents array:**
```typescript
interface Document {
  id: string;
  title: string;
  subtitle: string;
  category: 'report' | 'brief' | 'session-note';
  status: 'ready' | 'draft' | 'processing';
  date: string;
}
```

**Booking state:**
```typescript
interface BookingState {
  selectedType: 'coaching' | 'diagnostic' | 'checkin' | null;
  selectedDate: string | null;
  selectedTime: string | null;
  availableSlots: string[];
}
```

### 10.2 State Management

- URL state for active tab / view (deep linkable)
- Local component state for UI interactions
- Server data via fetch/API routes (documents, milestones, booking availability)
- No global state library needed at this stage

---

## 11. Acceptance Criteria

1. All 5 view groups render pixel-close to the approved v3.5 mockups
2. v3.5 design system tokens applied consistently across all app views
3. Sidebar + topbar layout is sticky and works across all routes
4. 11 lenses render correctly with proper tier gating (3 unlocked Advisory on Professional)
5. Lens cards match approved pattern: code+score top row, name, score bar, insight
6. Milestones timeline with vertical line, dots, meta column, status badges
7. Settings form with toggle + select rows, grouped by section
8. Documents list with filter tabs, search, and list-row pattern
9. Booking flow: session types → calendar + time slots → confirm bar
10. Zero border-radius, no shadows, rule-lines-not-cards throughout
11. Responsive at desktop (1280px+) widths
12. TypeScript types clean, no `any`
13. Components are reusable and properly typed
14. **REAL BACKEND DATA — no hardcoded mock data in any view at PR time**
15. Chat streams real messages through existing API endpoint
16. Lenses pull real scores from diagnostic results, tier gating from subscription
17. Milestones, profile, settings all read/write real Supabase data
18. Documents list from real documents table, click opens real readout
19. Booking uses real availability and creates real booking records
20. Loading, error, and empty states work with real async data
