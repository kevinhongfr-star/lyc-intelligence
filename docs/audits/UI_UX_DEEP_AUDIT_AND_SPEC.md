# UI/UX Deep Audit & Spec — LYC Intelligence Platform

**Date:** 2026-07-21  
**Author:** NEXUS  
**Scope:** Interface usability, clickability, transitions/animations, modals/drawers, dashboard customization, table layouts, brand alignment, AI interrogation pattern

---

## Executive Summary

The platform has a **solid design system foundation** (proper tokens, brand-aligned typography/colors) but the **interaction layer is almost entirely absent**. Modals have zero animation. No slide-over/drawer pattern exists. Framer Motion is used in exactly 1 component out of 400+. The page transition CSS is defined but never wired into the router. The "AI interrogation" pattern Kevin envisions — an AI button on every data element — doesn't exist as a universal pattern.

This document audits the current state across 10 dimensions and provides a spec for each gap.

---

## 1. Design System Audit

### ✅ What's Good

| Token | Status | Details |
|-------|--------|---------|
| Colors | ✅ Solid | Brand fuchsia #C108AB, proper semantic colors (success/warning/error/info), tier colors, methodology colors |
| Typography | ✅ Professional | Libre Baskerville (serif headlines), DM Sans (body), JetBrains Mono (code). Full size scale from xxs(10px) to 6xl(60px) |
| Spacing | ✅ Complete | Full 4px-grid spacing scale from px(1) to 32(128px) |
| Shadows | ✅ Professional | 7-level shadow system from xs to xl, plus specific card/modal/button shadows |
| Border Radius | ✅ On-brand | Sharp buttons (button: 0), rounded cards (card: 16px). Matches "McKinsey meets Soho House" brief |
| Z-index | ✅ Proper layering | dropdown→sticky→fixed→modalBackdrop→modal→popover→tooltip→toast→max |
| Transitions | ✅ Defined | Timing system: fast(150ms), normal(200ms), slow(300ms), page(400ms). Easing: cubic-bezier(0.16, 1, 0.3, 1) |
| Breakpoints | ✅ Responsive | xs(320) through 2xl(1536) |
| Brand Voice | ✅ Consistent | `brandVoice.ts` exists with tone guidelines |

### ❌ What's Broken

| Issue | Details |
|-------|---------|
| **Tokens exist but aren't enforced** | Design tokens defined in `tokens.css` + `tokens.ts` but components frequently use raw Tailwind values like `bg-[#FAFAFA]`, `text-[13px]`, `border-[#E5E5E5]` instead of `var(--color-bg)`, `var(--font-size-sm)` |
| **Transition tokens unused** | `TRANSITIONS` defined in tokens.ts but almost no component references them. Everything uses raw Tailwind `transition-colors` or nothing |
| **Methodology colors defined but orphaned** | `METHODOLOGY_COLORS` in tokens.ts maps TRIDENT/SHIFT/LENS/GRID/CANVAS/WAVE/BENCHMARK — but these are only used in 2-3 components |

---

## 2. Clickability & Interactivity Audit

### Current State: Broken

| Page/Component | Cursor Pointer | Has onClick | Verdict |
|---|---|---|---|
| ClientMandatesPage | 1 (`cursor-pointer`) | 0 | 🔴 **Dead** — Card looks clickable but isn't |
| ClientDocumentsPage | 0 | 0 | 🔴 Download/Refresh buttons are static |
| ClientAdminPage | 0 | 0 | 🔴 Invite/Delete/Edit buttons dead |
| ClientOnboardingPage | 0 | 0 | 🔴 All buttons dead |
| ClientOverviewPage | 0 | ~2 | ⚠️ "View all" links dead |
| AppLayout sidebar | ✅ | ✅ | 🟢 Navigation works, collapse works |
| DataTable rows | ✅ | ✅ (optional) | 🟢 Works when configured |

### The `cursor-pointer` Without `onClick` Anti-Pattern

This is the worst UX sin in the codebase. `ClientMandatesPage.tsx` line 141:
```tsx
<Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
```
The card says "click me" visually (pointer cursor, hover shadow) but has **zero onClick handlers**. Users will click and get nothing. This pattern appears in multiple client-facing pages.

### Missing Interactive States

| Element | Missing States |
|---------|---------------|
| Cards | No `active:scale-[0.98]` press feedback |
| Buttons | No `focus-visible:ring-2` focus state (accessibility) |
| Table rows | No hover highlight on clickable rows |
| Navigation | No `aria-current="page"` for screen readers |
| Loading | No skeleton screens on most pages (only `LoadingSkeleton.tsx` exists, not used everywhere) |

---

## 3. Modal & Overlay Audit

### Current Modal Component (shared/Modal.tsx)

```
46 lines. That's it.
```

**What it does:**
- Fixed overlay with backdrop-blur
- White card with title + close button
- Size variants: sm/md/lg/xl
- Scroll on overflow

**What it DOESN'T do:**
- ❌ No open animation (just appears)
- ❌ No close animation (just disappears)
- ❌ No backdrop fade-in
- ❌ No scale-up entrance
- ❌ No keyboard trap (Escape to close is missing)
- ❌ No focus management
- ❌ No `max-h-[85vh]` awareness on mobile
- ❌ No `role="dialog"` or `aria-modal` attributes
- ❌ No portal rendering (renders inline, can break z-index stacking)

### Drawer / SlideOver / Sheet: DOES NOT EXIST

There is **no slide-over panel, no drawer, no sheet component** in the entire codebase. Notion's signature side-panel pattern doesn't exist. Kevin specifically asked for "side/slide opening page or center opening page like Notion."

**What exists instead:**
- 6 inline modal-like overlays (hardcoded, not using the shared Modal)
- `ClientFeedbackModal.tsx` — inline overlay
- `PipelineSaveModal.tsx` — inline overlay
- `LinkedInImportModal.tsx` — inline overlay
- `EmailComposerModal.tsx` — inline overlay
- `UpgradeModal.tsx` — inline overlay
- `CandidateQuickAddModal.tsx` — inline overlay

None of these use the shared `Modal.tsx` component. They're all hand-rolled.

---

## 4. Animation & Transition Audit

### Current State: Nearly Dead

| Animation System | Status | Details |
|---|---|---|
| CSS Page Transitions | 🔴 Defined but NOT wired | `tokens.css` has `.page-enter` / `.page-enter-active` classes. App.tsx uses `<Outlet />` with NO `<TransitionGroup>` or `<CSSTransition>` wrapper |
| Framer Motion | 🔴 Used in 1 component | Only `Shortlist1Pager.tsx` uses `AnimatePresence`. Zero other component imports framer-motion |
| CSS Transitions | ⚠️ Sporadic | Some components use `transition-colors`, `transition-all duration-200`. Most use nothing |
| Micro-interactions | 🔴 Absent | No button press scale, no hover lift, no stagger animations, no skeleton loading pulses on most pages |
| Route transitions | 🔴 None | Pages just swap instantly. No crossfade, no slide |

### The Result

The app feels **static and lifeless**. Pages appear instantly. Modals pop in without animation. Lists render without stagger. There's no sense of spatial navigation or continuity.

Compare to what a "Notion-like" experience requires:
- Smooth slide-over panels
- Fade-in modals with backdrop
- Stagger animation on list items
- Crossfade between route changes
- Scale-on-press for interactive elements
- Skeleton loading states
- Smooth expand/collapse for tree views

**None of this exists.**

---

## 5. Dashboard Customization Audit

### Current State: Admin-Only, No Drag-and-Drop

`DashboardBuilderPage.tsx` (429 lines) exists with:
- Multiple dashboard support (create, switch, delete)
- Widget types: stat_card, chart, table, pipeline, recent_activity, calendar, goal_tracker
- Layout modes: grid, list, split
- Share/favorite dashboards
- GripVertical icon (suggests drag-and-drop)

**What it DOESN'T have:**
- ❌ No actual drag-and-drop (GripVertical is decorative)
- ❌ No react-grid-layout, dnd-kit, or react-beautiful-dnd dependency
- ❌ No resize handles for widgets
- ❌ No widget configuration panel
- ❌ Admin-only — not accessible from Client Portal or Consultant Portal
- ❌ No persistent layout storage

### Tables: Feature-Rich but Not Customizable

`DataTable.tsx` is actually impressive:
- ✅ Sortable columns
- ✅ Searchable
- ✅ Paginated with page size options
- ✅ Column visibility toggle
- ✅ CSV export
- ✅ Row selection + bulk actions
- ✅ Saved views (by name)
- ✅ Virtual list support

**But:**
- ❌ No column resize (drag to resize)
- ❌ No column reorder (drag to reorder)
- ❌ No row drag-and-drop
- ❌ No inline editing
- ❌ No "compact/comfortable" density toggle
- ❌ Saved views exist in props but no clear persistence mechanism

---

## 6. Brand Alignment Audit

### Reports & Scorecards

| Artifact | Brand Alignment | Issues |
|---|---|---|
| LENS Reports (PDF) | ⚠️ Functional | Black header bar, proper scoring colors. But uses default jsPDF font (Helvetica), not Libre Baskerville/DM Sans. No LYC logo in PDF. |
| GRID Reports | ⚠️ Needs review | `gridHandler.ts` (53K lines) — likely better but generates server-side |
| Match Scorecard (UI) | ⚠️ Basic | Dimension scores with color coding. No LYC branding. No logo. No print-ready format. |
| Shortlist 1-Pager | ✅ Better | Has LYC View callout with fuchsia accent. Shield icon. Proper tier badges. But no header/footer branding. |
| CV Analyzer | ⚠️ Generic | Standard file upload UI. No LYC visual identity in the flow. |

### Overall Brand Consistency

| Element | On-brand? | Notes |
|---|---|---|
| Logo | ✅ | `Brand_Assets/lyc-logo-kevin-selected.png` — dark bg, white text |
| Primary color | ✅ | #C108AB fuchsia used consistently |
| Serif font | ✅ | Libre Baskerville for headings |
| Sans font | ⚠️ | DM Sans specified but components use raw Tailwind sans-serif fallbacks |
| Button style | ✅ | Sharp (border-radius: 0) — intentional Soho House aesthetic |
| Card style | ✅ | Rounded (border-radius: 16px), subtle shadows |
| Dark mode | ❌ | Not implemented. Only light theme exists. |

---

## 7. AI Interrogation Pattern — MISSING

### What Kevin Wants

> "interrogation able of all different elements of information of pages with AI button"

A universal AI button on every data element (candidate, mandate, company, score, report) that lets users ask "tell me more" / "compare" / "what does this mean" / "give me insights" — a contextual AI assistant embedded in every view.

### What Exists

| Component | Function | Status |
|---|---|---|
| `AIQuickActions.tsx` | Generic AI action buttons | 🔌 Orphaned — not in any route |
| `AISummaryCard.tsx` | AI-generated summary cards | 🔌 Orphaned |
| `NexusChat.tsx` | Full AI chat | 🟢 Live but isolated — no context from surrounding page data |
| `NexusCommandBar.tsx` | Command bar for AI | 🔌 Orphaned |

### What's Missing

1. **No universal `<AIButton>` component** — a small Sparkles icon button that can be attached to any data element
2. **No AI context injection** — NexusChat doesn't receive data from the page it's on
3. **No contextual AI sidebar** — no "ask AI about this candidate" panel that slides in
4. **No AI-generated insights on data** — scores don't have "what this means" AI explanations
5. **No cross-element AI queries** — can't ask "compare these 3 candidates" from the table view

---

## 8. Spec: What Needs to Be Built

### 8.1 Universal AI Button & Context Layer

```
New Component: <AIInsightButton context={pageData} entity={entity} />
```

**Spec:**
- Small `Sparkles` icon button (fuchsia, 16×16)
- Appears on hover of any data row, card, or score badge
- On click → opens slide-over panel (right side, Notion-style)
- Panel receives full entity context (candidate data, mandate data, score breakdown)
- Pre-populates NexusChat with contextual prompt: "Analyze this candidate for [mandate]: [data]"
- Supports follow-up questions
- Can generate inline insights without opening panel (tooltip-style)

**Where it appears:**
- Every candidate row in DataTable
- Every mandate card
- Every score badge
- Every pipeline stage card
- Every org chart node
- Every shortlist entry

### 8.2 Slide-Over Panel (Drawer)

```
New Component: <SlideOver isOpen onClose size="md|lg|xl|full" side="right|left">
```

**Spec:**
- Slides in from right (primary) or left
- Width variants: md(400px), lg(560px), xl(720px), full(100vw)
- Backdrop with blur
- Smooth spring animation (framer-motion `type: "spring" stiffness: 300`)
- Keyboard accessible (Escape to close)
- Focus trap
- Portal-rendered
- Stacking support (can open a second panel from within a panel)
- Header with title + close button
- Footer with actions (optional)
- Used by: AIInsightButton, candidate detail, mandate detail, comparison view

### 8.3 Modal v2 (Animated)

```
Replace: shared/Modal.tsx with animated version
```

**Spec:**
- Backdrop: fade-in 200ms
- Modal: scale(0.95)→scale(1) + opacity transition 200ms
- Close: reverse animation
- Spring physics for natural feel
- Keyboard trap + focus management
- Portal-rendered
- `role="dialog"` + `aria-modal="true"`
- Size variants: sm(400px), md(560px), lg(720px), xl(960px), fullscreen
- Optional: sidebar inside modal (for detail + list views)

### 8.4 Page Transitions

```
Wrap <Outlet /> in AnimatePresence
```

**Spec:**
- Route change → current page fades out (150ms)
- New page fades in + slight translateY(4px→0) (200ms)
- Uses existing CSS classes from `tokens.css` (`.page-enter` / `.page-enter-active`) — just needs wiring
- Optional: direction-aware slide (back = slide right, forward = slide left)

### 8.5 Dashboard Drag-and-Drop

```
Add: react-grid-layout or @dnd-kit dependency
```

**Spec:**
- Drag widgets to reorder
- Resize widgets (snap to grid)
- Widget configuration panel (slide-over)
- Layout persistence per user
- Widget types: stat cards, charts, tables, AI insights, pipeline summary, upcoming deadlines
- Available in Client Portal (limited widgets) and Consultant Portal (full)

### 8.6 List Stagger Animations

```
Wrap lists in motion.div with staggerChildren
```

**Spec:**
- Table rows: stagger fade-in from top (30ms delay per row)
- Cards: stagger scale-up from center
- Sidebar nav items: stagger slide-in from left
- Pipeline columns: stagger from left to right

### 8.7 Micro-interactions

| Element | Animation |
|---|---|
| Button press | `scale(0.97)` for 100ms |
| Card hover | `translateY(-2px)` + shadow increase |
| Score badge | Pulse on change (ring animation) |
| Tab switch | Underline slide (not instant jump) |
| Expand/collapse | Smooth height animation (not instant) |
| Drag handle | Cursor change + slight scale on hover |
| Toggle switch | Spring animation |
| Toast notification | Slide in from right + auto-dismiss fade |

---

## 9. Priority Order

### P0 — Fix Before Demo (This Week)
1. **Wire cursor-pointer → onClick** on ClientMandatesPage mandate cards
2. **Modal animation** — add entrance/exit transitions
3. **SlideOver component** — build the Notion-style drawer
4. **Page transitions** — wire AnimatePresence into App.tsx

### P1 — AI Interrogation Layer (Week 1-2)
5. **AIInsightButton component** — universal AI button
6. **Context injection** — wire NexusChat to receive page data
7. **AI sidebar** — contextual AI analysis in SlideOver

### P2 — Polish & Animation (Week 2-3)
8. **List stagger animations** — framer-motion on all lists
9. **Micro-interactions** — button press, card hover, tab slide
10. **Dashboard drag-and-drop** — add dnd-kit or react-grid-layout
11. **Brand font enforcement** — ensure DM Sans/Libre Baskerville in all views

### P3 — Advanced (Week 3-4)
12. **DataTable enhancements** — column resize, reorder, inline edit
13. **Dark mode** — full theme toggle
14. **Report brand alignment** — embed LYC logo + fonts in PDF generation
15. **Skeleton loading** — replace all loading spinners with skeleton screens

---

## 10. Summary

| Dimension | Current Score | Target |
|---|---|---|
| Design System | 7/10 (good tokens, inconsistent use) | 9/10 |
| Clickability | 3/10 (dead buttons, false cursors) | 9/10 |
| Modals/Overlays | 2/10 (no animation, no drawer) | 8/10 |
| Animations | 1/10 (nearly absent) | 8/10 |
| Dashboard Customization | 3/10 (admin-only, no DnD) | 7/10 |
| Table Layouts | 6/10 (feature-rich, not customizable) | 8/10 |
| Brand Alignment | 5/10 (tokens right, enforcement weak) | 9/10 |
| AI Interrogation | 1/10 (not a pattern yet) | 8/10 |
| **Overall** | **3.5/10** | **8/10** |

**The codebase has the visual DNA right (colors, fonts, spacing, sharp buttons). But the interaction layer — the thing that makes a product feel alive, responsive, and intelligent — is almost entirely missing.**

The fix is primarily front-end engineering: building the missing UI primitives (SlideOver, AnimatedModal, AIInsightButton), wiring animations (framer-motion + page transitions), and connecting the AI context layer to every data element.
