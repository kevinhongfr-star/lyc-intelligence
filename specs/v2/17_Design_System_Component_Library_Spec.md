# 17 — Design System & Component Library Spec

**Version:** 1.0  
**Date:** 2026-07-17  
**Author:** NEXUS  
**Phase:** P0 — Must be complete before any portal implementation  
**Scope:** Shared design tokens, components, patterns, and guidelines across all 5 portals  
**Dependencies:** None (this IS the foundation)

---

## 1. Design Principles

### 1.1 Core Principles

| Principle | Meaning |
|-----------|---------|
| **Professional Density** | Information-rich but not cluttered. Respect the user's time. |
| **Calm Authority** | Confident, understated design. No flashy gradients or playful animations. This is executive-grade software. |
| **Progressive Disclosure** | Show what's needed now. Hide complexity until asked. |
| **Consistent Rhythm** | Same spacing, same patterns, same behavior across all portals. |
| **Accessible by Default** | WCAG 2.1 AA minimum. Every component. No exceptions. |

### 1.2 Tone of Voice per Portal

| Portal | Tone | Example |
|--------|------|---------|
| Council | Exclusive, warm, peer-to-peer | "Welcome back. Your next coaching session is Thursday." |
| Client | Professional, efficient, data-driven | "3 new candidates match your VP Engineering mandate." |
| Candidate | Supportive, encouraging, transparent | "Your application is moving forward. Here's what's next." |
| Internal | Direct, operational, no-nonsense | "5 tasks due today. 2 mandates need attention." |
| Academy | Motivating, structured, clear | "You're 60% through. 3 lessons to go." |

### 1.3 Dark Mode Decision

**Deferred to post-launch.** Design system will use CSS custom properties (tokens) so dark mode can be added without rewriting components. No dark mode variants in v1.

---

## 2. Design Tokens

### 2.1 Color Palette

#### Primary Colors
```
--color-primary-50:   #EEF2FF    ( backgrounds, subtle highlights )
--color-primary-100:  #D9E3FF
--color-primary-200:  #B3C7FF
--color-primary-300:  #8DAAFF
--color-primary-400:  #6690FF
--color-primary-500:  #4070FF    ( primary buttons, links, active states )
--color-primary-600:  #3358CC
--color-primary-700:  #264099
--color-primary-800:  #1A2966
--color-primary-900:  #0D1433
```

#### Neutral Colors
```
--color-neutral-0:    #FFFFFF    ( white )
--color-neutral-50:   #F8FAFC    ( page backgrounds )
--color-neutral-100:  #F1F5F9    ( card backgrounds, subtle borders )
--color-neutral-200:  #E2E8F0    ( borders, dividers )
--color-neutral-300:  #CBD5E1    ( disabled text, placeholder )
--color-neutral-400:  #94A3B8    ( secondary text )
--color-neutral-500:  #64748B    ( body text )
--color-neutral-600:  #475569    ( emphasis text )
--color-neutral-700:  #334155    ( headings )
--color-neutral-800:  #1E293B    ( strong emphasis )
--color-neutral-900:  #0F172A    ( primary text )
```

#### Semantic Colors
```
--color-success:      #10B981    ( completed, approved, active )
--color-success-light: #D1FAE5
--color-warning:      #F59E0B    ( caution, pending, expiring )
--color-warning-light: #FEF3C7
--color-error:        #EF4444    ( failed, rejected, critical )
--color-error-light:  #FEE2E2
--color-info:         #3B82F6    ( informational, tips )
--color-info-light:   #DBEAFE
```

#### Portal Accent Colors (used sparingly — badges, tags, portal indicators)
```
--accent-council:     #7C3AED    ( purple — exclusive, premium )
--accent-client:      #0891B2    ( teal — professional, data )
--accent-candidate:   #059669    ( green — growth, progress )
--accent-internal:    #DC2626    ( red — urgency, action )
--accent-academy:     #D97706    ( amber — learning, warmth )
```

### 2.2 Typography

#### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

#### Type Scale
```
--text-xs:    0.75rem   ( 12px ) — captions, badges, timestamps
--text-sm:    0.875rem  ( 14px ) — secondary text, table cells, form labels
--text-base:  1rem      ( 16px ) — body text, default
--text-lg:    1.125rem  ( 18px ) — section headings, emphasis
--text-xl:    1.25rem   ( 20px ) — page headings
--text-2xl:   1.5rem    ( 24px ) — dashboard titles
--text-3xl:   1.875rem  ( 30px ) — hero headings
--text-4xl:   2.25rem   ( 36px ) — landing page headlines
```

#### Font Weights
```
--font-regular:   400    — body text
--font-medium:    500    — emphasis, labels, navigation
--font-semibold:  600    — headings, buttons
--font-bold:      700    — hero text, key metrics
```

#### Line Heights
```
--leading-tight:   1.25   — headings
--leading-normal:  1.5    — body text
--leading-relaxed: 1.75   — long-form content (articles, community posts)
```

### 2.3 Spacing System

Base unit: **4px**. All spacing is multiples of 4.

```
--space-0:   0
--space-1:   0.25rem   (  4px ) — tight gaps (icon to text)
--space-2:   0.5rem    (  8px ) — small gaps (form field to helper text)
--space-3:   0.75rem   ( 12px ) — compact padding (table cells)
--space-4:   1rem      ( 16px ) — standard padding (cards, buttons)
--space-5:   1.25rem   ( 20px ) — comfortable padding
--space-6:   1.5rem    ( 24px ) — section padding
--space-8:   2rem      ( 32px ) — page margins, large sections
--space-10:  2.5rem    ( 40px ) — page header spacing
--space-12:  3rem      ( 48px ) — between major sections
--space-16:  4rem      ( 64px ) — page top/bottom padding
```

### 2.4 Border Radius

```
--radius-sm:   4px    — small elements (badges, tags, inputs)
--radius-md:   8px    — cards, modals, buttons
--radius-lg:   12px   — large cards, panels
--radius-xl:   16px   — hero sections, feature cards
--radius-full: 9999px — avatars, pills, circular buttons
```

### 2.5 Shadows

```
--shadow-xs:   0 1px 2px rgba(0,0,0,0.05)                              — subtle lift (cards)
--shadow-sm:   0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)  — default (cards hover)
--shadow-md:   0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)  — dropdowns, popovers
--shadow-lg:   0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) — modals, dialogs
--shadow-xl:   0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) — full-screen overlays
```

### 2.6 Responsive Breakpoints

```
--bp-sm:   640px     — mobile landscape
--bp-md:   768px     — tablet portrait
--bp-lg:   1024px    — tablet landscape / small laptop
--bp-xl:   1280px    — desktop
--bp-2xl:  1536px    — large desktop
```

#### Layout Rules
| Breakpoint | Grid | Sidebar | Navigation |
|------------|------|---------|------------|
| < 640px | 1 column, 16px gutters | Hidden (hamburger) | Bottom tab bar or hamburger |
| 640–768px | 1–2 columns, 16px gutters | Hidden | Top bar |
| 768–1024px | 2 columns, 24px gutters | Collapsed (icons only) | Top bar |
| 1024–1280px | 2–3 columns, 24px gutters | Expanded | Top bar |
| > 1280px | 3–4 columns, 32px gutters, max-width 1440px | Expanded | Top bar |

### 2.7 Z-Index Scale

```
--z-base:      0      — default content
--z-dropdown:  100    — dropdown menus
--z-sticky:    200    — sticky headers, table headers
--z-overlay:   300    — dark overlays
--z-modal:     400    — modals, dialogs
--z-popover:   500    — tooltips, popovers
--z-toast:     600    — toast notifications
--z-command:   700    — Cmd+K command palette
```

---

## 3. Components

### 3.1 Buttons

#### Variants
```
Primary:    bg-primary-500, text-white, hover:bg-primary-600
Secondary:  bg-transparent, border-primary-500, text-primary-500, hover:bg-primary-50
Ghost:      bg-transparent, text-neutral-600, hover:bg-neutral-100
Danger:     bg-error, text-white, hover:bg-red-600
Link:       bg-transparent, text-primary-500, underline on hover, no border
```

#### Sizes
```
sm:   px-3 py-1.5, text-sm,   radius-sm   — inline actions, table rows
md:   px-4 py-2,   text-base, radius-md   — default (forms, cards)
lg:   px-6 py-3,   text-lg,   radius-md   — hero CTAs, landing pages
```

#### States
```
Default → Hover (subtle bg change) → Active (darker) → Focus (ring-2 ring-primary-300) → Disabled (opacity-50, cursor-not-allowed) → Loading (spinner replaces text, same size)
```

#### Rules
- One primary button per view. All others secondary/ghost.
- Destructive actions always use Danger variant.
- Loading state: button keeps its size, text replaced by spinner + "Loading..."
- Icon buttons: same height as text buttons, square aspect ratio.
- Min touch target: 44×44px on mobile.

### 3.2 Form Elements

#### Text Input
```
Height:        40px (md), 36px (sm), 48px (lg)
Border:        1px solid neutral-200
Border-radius: radius-md
Padding:       12px 16px
Focus:         border-primary-500, ring-2 ring-primary-100
Error:         border-error, ring-2 ring-error-light
Disabled:      bg-neutral-50, cursor-not-allowed
Placeholder:   text-neutral-300
```

#### Textarea
```
Min-height:    100px
Resize:        vertical only
Same border/focus/error states as text input
```

#### Select / Dropdown
```
Same height and border as text input
Chevron icon on right (neutral-400)
Options: min-height 36px, hover:bg-neutral-50
Searchable for 10+ options
Multi-select: checkboxes in dropdown, selected shown as tags below input
```

#### Checkbox & Radio
```
Size:          20×20px
Border:        2px solid neutral-300
Checked:       bg-primary-500, white checkmark/icon
Focus:         ring-2 ring-primary-100
Label:         text-sm, neutral-700, left of control
Spacing:       space-2 between control and label, space-3 between options
```

#### Toggle (Switch)
```
Width:         44px
Height:        24px
Off:           bg-neutral-200, knob left
On:            bg-primary-500, knob right
Knob:          20px white circle, shadow-sm
Transition:    150ms ease
```

#### Form Layout Rules
- Labels always above input (not beside).
- Required fields: asterisk (*) after label, color-error.
- Helper text: text-xs, neutral-400, below input.
- Error message: text-xs, color-error, below input (replaces helper text).
- Validation: on blur for individual fields, on submit for full form.
- Multi-step forms:
  - Progress indicator at top (step X of Y + progress bar).
  - "Back" button on every step.
  - Can revisit completed steps.
  - Auto-save draft on every step change.
  - "Save & Continue Later" option on every step.

#### Auto-Save Behavior
| Context | Trigger | Feedback |
|---------|---------|----------|
| Long forms (mandate creation, application) | Every 30 seconds + on field blur | Subtle "Saved" indicator top-right, fades after 3s |
| Profile edits | On field blur | Same |
| Community posts / long text | Every 30 seconds | "Draft saved" link to resume |
| Assessment questions | On answer select | Auto-advance to next question |

### 3.3 Cards

#### Base Card
```
Background:    white
Border:        1px solid neutral-100
Border-radius: radius-lg
Padding:       space-6
Shadow:        shadow-xs
Hover:         shadow-sm, translateY(-1px), transition 150ms
```

#### Card Variants
```
Default:       As above
Interactive:   cursor-pointer, hover effect above
Highlighted:   border-left-4 border-primary-500 (for featured items)
Compact:       padding-4, used in lists/grids
Flat:          No shadow, no border, bg-neutral-50 (for nested cards)
```

#### Card Content Structure
```
┌─────────────────────────────────┐
│ [Optional: Image/Thumbnail]     │
├─────────────────────────────────┤
│ Header: Title + optional badge  │
│ Subtitle/metadata (text-sm)     │
├─────────────────────────────────┤
│ Body: Description/content       │
├─────────────────────────────────┤
│ Footer: Actions / metadata      │
└─────────────────────────────────┘
```

### 3.4 Tables

#### Default Table
```
Header:        bg-neutral-50, text-sm, font-medium, text-neutral-600
Row:           border-b neutral-100, hover:bg-neutral-50
Cell:          px-4 py-3, text-sm
Selected row:  bg-primary-50
Striped:       optional, even rows bg-neutral-50/50
```

#### Table Features
- **Sortable columns**: Click header → ascending → descending → none. Sort indicator icon.
- **Row selection**: Checkbox column on left. "Select all" in header.
- **Sticky header**: Header stays visible on scroll.
- **Responsive**: On mobile, cards view (each row becomes a card). Never horizontal scroll.
- **Empty state**: "No [items] yet" with CTA.
- **Loading state**: Skeleton rows (3-5 rows with animated pulse).
- **Pagination**: Bottom-right. "Showing X–Y of Z". Page size selector (10/25/50/100).

### 3.5 Modals & Dialogs

#### Standard Modal
```
Width:         sm: 400px, md: 560px, lg: 720px, xl: 960px, full: 90vw
Max-height:    85vh
Border-radius: radius-xl
Shadow:        shadow-xl
Overlay:       bg-black/50, backdrop-blur-sm
Animation:     fade-in overlay (150ms), slide-up modal (200ms)
```

#### Modal Structure
```
┌─────────────────────────────────┐
│ Title                    [X]    │  ← Header: fixed, border-b
├─────────────────────────────────┤
│                                 │
│ Scrollable content area         │  ← Body: overflow-y-auto
│                                 │
├─────────────────────────────────┤
│ [Cancel]          [Primary]     │  ← Footer: fixed, border-t
└─────────────────────────────────┘
```

#### Confirmation Dialogs
| Action Type | Dialog Style | Button Text |
|-------------|-------------|-------------|
| Simple (close tab, cancel form) | None — just do it | — |
| Moderate (reject candidate, archive item) | Standard modal, neutral tone | "Cancel" / "Confirm" |
| Destructive (delete, remove user, cancel subscription) | Standard modal, danger styling | "Cancel" / "Delete" (danger button) |
| Irreversible (delete account, permanently remove data) | Type-to-confirm: user types the item name | "Cancel" / "Type to confirm" disabled until match |

#### Rules
- Escape key closes modal.
- Click outside modal closes it (unless destructive/important).
- Focus trapped inside modal.
- Scroll locked on body when modal is open.
- Max one modal at a time. No stacked modals.

### 3.6 Toast Notifications

```
Position:      Top-right, stacked vertically, max 3 visible
Width:         360px
Duration:      5 seconds (auto-dismiss), click to dismiss immediately
Animation:     Slide in from right (200ms), fade out (150ms)
```

#### Toast Types
```
Success:  ✅ icon, success-light bg, success border-left
Error:    ❌ icon, error-light bg, error border-left  
Warning:  ⚠️ icon, warning-light bg, warning border-left
Info:     ℹ️ icon, info-light bg, info border-left
```

#### Toast Content
```
┌──────────────────────────────────────┐
│ ✅  Candidate shortlisted            │
│     VP Engineering — Tech Corp       │  ← Optional description
│                              [Undo]  │  ← Optional action (5s window)
└──────────────────────────────────────┘
```

### 3.7 Badges & Tags

#### Status Badges
```
Size:        px-2 py-0.5, text-xs, font-medium, radius-sm
Success:     bg-success-light, text-green-800    → "Active", "Completed", "Approved"
Warning:     bg-warning-light, text-amber-800    → "Pending", "Expiring", "Review"
Error:       bg-error-light, text-red-800        → "Rejected", "Failed", "Overdue"
Info:        bg-info-light, text-blue-800        → "New", "Updated", "Draft"
Neutral:     bg-neutral-100, text-neutral-600    → "Archived", "Closed", "Inactive"
```

#### Portal Badges
```
Council:     bg-purple-50, text-purple-700, "Council"
Client:      bg-cyan-50, text-cyan-700, "Client"
Candidate:   bg-green-50, text-green-700, "Candidate"
Internal:    bg-red-50, text-red-700, "Internal"
Academy:     bg-amber-50, text-amber-700, "Academy"
```

#### Special Badges
```
Founding Member:  bg-purple-100, text-purple-800, ✨ icon, "Founding"
Founding (alt):   Gradient border, subtle glow effect (premium feel)
Admin:            bg-neutral-800, text-white, "Admin"
New:              bg-primary-500, text-white, "New" (with pulse animation, 3s)
```

#### Tags (filtering, categories)
```
Size:        px-2.5 py-1, text-sm, radius-full
Default:     bg-neutral-100, text-neutral-600, hover:bg-neutral-200
Selected:    bg-primary-500, text-white
Removable:   × icon on right, click to remove
```

### 3.8 Avatars

#### Sizes
```
xs:   24px    — inline with text (mentions, comments)
sm:   32px    — table rows, list items
md:   40px    — navigation, cards
lg:   56px    — profile header
xl:   80px    — profile page, settings
2xl:  120px   — hero/profile hero
```

#### Shapes
- Circle for people (candidates, consultants, members).
- Rounded-square (radius-md) for companies/organizations.

#### Fallback
- No photo: Generate initials on colored background.
- Color derived from name hash (consistent per person).
- Font: font-semibold, white text.
- Example: "Kevin Hong" → "KH" on bg-primary-500.

#### Status Indicator
- Online: green dot, bottom-right.
- Away: yellow dot.
- Offline: no dot.
- Size: 25% of avatar size.

### 3.9 Tooltips

```
Delay:         300ms hover before showing
Animation:     fade-in (100ms)
Background:    neutral-800, text-white
Padding:       space-2 space-3
Radius:        radius-sm
Max-width:     240px
Arrow:         6px triangle pointing to target
Position:      Auto (top/bottom/left/right based on viewport)
```

#### Rules
- Never put essential information in tooltips only.
- Tooltips disappear on mouse leave or Escape.
- No tooltips on mobile (use long-press or inline help instead).

---

## 4. Layout Patterns

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR (56px height, white, border-b, shadow-xs)          │
│  [Logo] [Portal Nav] ............ [Search] [🔔] [Avatar ▾]  │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │  MAIN CONTENT                                  │
│ (240px)  │                                                  │
│          │  ┌──────────────────────────────────────────┐   │
│ Nav      │  │ Page Header                              │   │
│ items    │  │ Title + Breadcrumb + Actions             │   │
│          │  ├──────────────────────────────────────────┤   │
│          │  │                                          │   │
│          │  │ Content Area                             │   │
│          │  │                                          │   │
│          │  │                                          │   │
│          │  └──────────────────────────────────────────┘   │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│  (No footer in app — landing pages only)                    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Top Bar (Global)

```
Height:        56px
Background:    white
Border:        bottom 1px neutral-200
Shadow:        shadow-xs
Position:      fixed top, full width, z-sticky

Left:          Logo (32×32) + Portal name
Center:        Portal navigation links (if applicable)
Right:         Global search (Cmd+K trigger) | Notification bell (with count badge) | User avatar + dropdown
```

#### User Avatar Dropdown
```
┌──────────────────────┐
│ [Avatar] Kevin Hong  │
│ kevin@lyc-partners.. │
├──────────────────────┤
│ 👤 My Profile        │
│ ⚙️ Settings          │
│ ───────────────────  │
│ 🏢 Council Portal    │  ← Cross-portal links (if user has access)
│ 📋 Client Portal     │
│ 🎓 Academy           │
│ ───────────────────  │
│ 🌙 Dark mode (soon)  │  ← Disabled in v1
│ 🚪 Sign out          │
└──────────────────────┘
```

### 4.3 Sidebar Navigation

```
Width:         240px expanded, 64px collapsed
Background:    white
Border:        right 1px neutral-200
Position:      fixed left, below top bar, full height

Expanded:      Icon + label for each item
Collapsed:     Icon only, tooltip on hover shows label

Active item:   bg-primary-50, text-primary-600, left-3px border-primary-500
Hover:         bg-neutral-50
Badge:         Count badge right-aligned (e.g., tasks: 5)
```

#### Sidebar Structure per Portal
```
INTERNAL:                  CLIENT:                    CANDIDATE:
─────────────              ──────────                 ──────────
🏠 Dashboard               🏠 Dashboard               🏠 Dashboard
📋 Mandates                📋 My Mandates             💼 Browse Positions
👤 Candidates              👥 Candidates              📝 My Applications
🏢 Companies               📊 Reports                 🧠 ASSESS
✅ Tasks                   💰 Billing                 🤖 AI Insights
📊 Reports                                          👤 My Profile
───                         ───                       ───
⚙️ Settings               ⚙️ Settings               
👤 Profile                👤 Profile                  

COUNCIL:                   ACADEMY:
─────────────              ──────────
🏠 Dashboard               🏠 Dashboard
💬 Community               📚 My Courses
📅 Events                  🏆 Courses Catalog
🎯 Coaching                📋 Development Plan
👥 Directory               💬 Community
🎁 Benefits                🏅 Certificates
───                         ───
⚙️ Settings               ⚙️ Settings
```

### 4.4 Dashboard Layout

#### KPI Cards Row
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Metric   │ │ Metric   │ │ Metric   │ │ Metric   │
│ Value    │ │ Value    │ │ Value    │ │ Value    │
│ Trend ↑↓ │ │ Trend ↑↓ │ │ Trend ↑↓ │ │ Trend ↑↓ │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

Card: bg-white, border neutral-100, radius-lg, p-4
Value: text-2xl font-bold
Label: text-sm text-neutral-500
Trend: text-xs, green/red with arrow icon
Grid: 4 columns desktop, 2 columns tablet, 1 column mobile
```

#### Content Grid
```
Desktop:     2-column (main 2/3 + sidebar 1/3) or 3-column equal
Tablet:      1-column stacked
Mobile:      1-column stacked, full width
```

---

## 5. State Patterns

### 5.1 Empty States

Every list, table, feed, and dashboard MUST have a designed empty state.

#### Structure
```
┌─────────────────────────────────────┐
│                                     │
│         [Illustration/Icon]         │  ← Neutral-300 color, 64×64
│                                     │
│      Descriptive heading            │  ← text-lg, neutral-600
│                                     │
│   Helpful explanation (1-2 lines)   │  ← text-sm, neutral-400
│                                     │
│        [Primary CTA button]         │  ← Action to create first item
│                                     │
│   Or [secondary action link]        │  ← Alternative action
│                                     │
└─────────────────────────────────────┘
```

#### Empty State Copy per Portal
| Context | Heading | CTA |
|---------|---------|-----|
| Client: 0 mandates | "Create your first mandate" | "We'll match you with top candidates." | [Create Mandate] |
| Client: 0 candidates in mandate | "No candidates yet" | "We're sourcing. You'll see matches here soon." | — (passive) |
| Candidate: 0 applications | "Start your journey" | "Browse open positions and apply in minutes." | [Browse Positions] |
| Candidate: 0 matches | "Complete your profile" | "The more we know, the better we match." | [Complete Profile] |
| Council: 0 community posts | "Be the first to start a discussion" | "Share a question, insight, or resource." | [New Post] |
| Academy: 0 enrollments | "Start learning" | "Explore courses and begin your development." | [Browse Courses] |
| Internal: 0 tasks | "All clear" | "No tasks pending. Nice work." | — (passive) |

### 5.2 Loading States

| Context | Pattern | Detail |
|---------|---------|--------|
| Page load | Skeleton screen | Match the layout of the content that will appear |
| Table data | Skeleton rows (5 rows) | Animated pulse, neutral-100/neutral-200 alternating |
| Card grid | Skeleton cards | Card shapes with pulse animation |
| Single value (metric) | Skeleton text | Short pulse bar |
| Button action | Inline spinner | Replace button text with spinner, keep same size |
| Infinite scroll | Spinner at bottom | Small centered spinner, "Loading more..." text |
| Video content | Thumbnail + play button | Blur hash or thumbnail, loading overlay |
| Search results | Skeleton list | While searching, show skeleton results |

#### Skeleton Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
animation: pulse 1.5s ease-in-out infinite;
```

### 5.3 Error States

#### Inline Error (form field)
```
Input border → red
Below input: ❌ Error message in text-xs, color-error
Other fields: not affected
```

#### Page-Level Error
```
┌─────────────────────────────────────┐
│                                     │
│            ⚠️ Icon                  │
│                                     │
│     Something went wrong            │
│                                     │
│  [Specific error message if known]  │
│                                     │
│   [Try Again]    [Contact Support]  │
│                                     │
└─────────────────────────────────────┘
```

#### Network Error
```
┌─────────────────────────────────────┐
│  📡 Connection lost                 │
│  Check your internet and try again. │
│  [Retry]                            │
└─────────────────────────────────────┘
Auto-retry: every 5 seconds with exponential backoff (max 30s).
Show "Reconnected" toast when connection restored.
```

#### 404 / Not Found
```
┌─────────────────────────────────────┐
│                                     │
│           404                       │
│                                     │
│    This page doesn't exist.         │
│                                     │
│    [Go to Dashboard]                │
│                                     │
└─────────────────────────────────────┘
```

### 5.4 Undo Pattern

| Action | Undo Window | Toast Message |
|--------|-------------|---------------|
| Archive/delete item | 5 seconds | "Item archived. [Undo]" |
| Remove team member | 5 seconds | "Member removed. [Undo]" |
| Close mandate | 5 seconds | "Mandate closed. [Undo]" |
| Mark lesson complete | 5 seconds | "Lesson marked complete. [Undo]" |
| Reject candidate | 10 seconds (longer — high impact) | "Candidate rejected. [Undo]" |
| Cancel subscription | No undo (goes through confirmation dialog) | — |
| Delete account | No undo (type-to-confirm required) | — |

---

## 6. Notification Center (In-App)

### 6.1 Bell Icon
```
Position:    Top bar, right side, left of avatar
Badge:       Red circle with count (max "99+")
No badge:    Neutral-400 icon
Has unread:  Neutral-900 icon
```

### 6.2 Dropdown Panel
```
Width:       400px
Max-height:  500px, overflow-y-auto
Position:    Below bell icon, right-aligned

┌──────────────────────────────────────┐
│ Notifications          [Mark all ✓]  │
├──────────────────────────────────────┤
│ ● New candidate match                │  ← Unread: blue dot, bg-neutral-50
│   VP Engineering — 92% match         │
│   2 min ago                          │
├──────────────────────────────────────┤
│ ● Interview scheduled                │
│   Tech Corp, Jul 20, 14:00           │
│   1 hour ago                         │
├──────────────────────────────────────┤
│ ○ Report available                   │  ← Read: no dot, white bg
│   Monthly Briefing — July 2026       │
│   Yesterday                          │
├──────────────────────────────────────┤
│ [View all notifications →]           │
└──────────────────────────────────────┘
```

### 6.3 Notification Grouping
- Same type within 5 minutes → grouped: "3 new candidate matches for VP Engineering"
- Different types → separate notifications
- Max 20 in dropdown, "View all" links to full notifications page

### 6.4 Notification Types per Portal
| Portal | Notifications |
|--------|---------------|
| Council | Coaching reminders, event reminders, new community replies, credit low, membership expiring |
| Client | New candidates, interview updates, mandate status changes, billing alerts |
| Candidate | Application status changes, new job matches, interview invites, assessment results |
| Internal | Task due, candidate updates, mandate changes, team mentions |
| Academy | Course reminders, new community replies, certificate issued, streak milestone |

---

## 7. Keyboard Shortcuts

### 7.1 Global Shortcuts
```
Cmd+K / Ctrl+K     → Open command palette
?                  → Show keyboard shortcut cheatsheet
Escape             → Close modal / dropdown / command palette
```

### 7.2 Navigation (Internal Portal)
```
g → d              → Go to Dashboard
g → m              → Go to Mandates
g → c              → Go to Candidates
g → o              → Go to Companies
g → t              → Go to Tasks
g → r              → Go to Reports
```

### 7.3 Action Shortcuts
```
n                  → New (mandate / candidate / post — context-dependent)
e                  → Edit selected item
/                  → Focus search
j / k              → Navigate down / up in lists
Enter              → Open selected item
x                  → Select/deselect row (in tables)
```

### 7.4 Shortcut Cheatsheet
```
Press ? to open:
┌──────────────────────────────────────┐
│ Keyboard Shortcuts              [×]  │
├──────────────────────────────────────┤
│ NAVIGATION                           │
│ g → d        Dashboard               │
│ g → m        Mandates                │
│ g → c        Candidates              │
│ ...                                  │
├──────────────────────────────────────┤
│ ACTIONS                              │
│ n            New                     │
│ e            Edit                    │
│ /            Search                  │
│ ...                                  │
└──────────────────────────────────────┘
```

---

## 8. Responsive Patterns

### 8.1 Navigation by Device
| Device | Pattern |
|--------|---------|
| Mobile (<640px) | Hamburger menu → full-screen overlay with nav items. Bottom tab bar for top 4-5 destinations. |
| Tablet (640-1024px) | Collapsed sidebar (icons only, 64px). Expand on hover or click. |
| Desktop (>1024px) | Full sidebar (240px) with icons + labels. |

### 8.2 Table → Card Transformation
On mobile, tables convert to stacked cards:
```
DESKTOP (table):
┌──────┬──────────┬──────────┬──────────┬────────┐
│ Name │ Company  │ Status   │ Score    │ Action │
├──────┼──────────┼──────────┼──────────┼────────┤
│ Jane │ TechCo   │ Active   │ 92%      │ [View] │
└──────┴──────────┴──────────┴──────────┴────────┘

MOBILE (cards):
┌──────────────────────────┐
│ Jane                     │
│ TechCo                   │
│ ● Active    Score: 92%   │
│ [View]                   │
└──────────────────────────┘
```

### 8.3 Touch Targets
- All interactive elements: minimum 44×44px.
- Buttons: minimum 44px height.
- List items with tap action: minimum 48px height.
- Spacing between tappable elements: minimum 8px.

### 8.4 Mobile-Specific Patterns
- Swipe actions on list items (left: delete/archive, right: quick action).
- Pull-to-refresh on feeds and lists.
- Bottom sheets for secondary actions (instead of modals).
- FAB (Floating Action Button) for primary action on mobile? No — use bottom tab bar + contextual button.

---

## 9. Iconography

### 9.1 Icon Set
Use **Lucide Icons** (open-source, consistent style, tree-shakeable).
- Style: outline, 1.5px stroke, rounded caps.
- Size: 16px (inline), 20px (default), 24px (standalone), 32px (hero).
- Color: inherits text color by default.

### 9.2 Key Icons (consistent meaning)
```
🏠 Home           📋 List/mandate     👤 User/person
👥 Team/group     🏢 Company          💰 Billing/payment
📊 Reports        ✅ Tasks/complete    📅 Calendar/event
🔔 Notification   🔍 Search           ⚙️ Settings
✏️ Edit           🗑️ Delete           📎 Attachment
📤 Export/Share   📥 Import/Download  🔗 Link
➕ Create/Add     ✕ Close/Cancel      ← → Navigate
↑ ↓ Sort          ⭐ Featured         🏷️ Tag/label
```

---

## 10. Print Styles

### 10.1 Print Rules
```css
@media print {
  - sidebar, top-bar, footer, navigation: display-none
  - width: 100%, no max-width
  - color: black on white
  - links: show URL in parentheses
  - page-break: before each major section
  - font-size: 12pt minimum
}
```

### 10.2 Printable Views
| Context | Print Button | Content |
|---------|-------------|---------|
| Candidate shortlist | "Print Shortlist" | Candidates table with scores, notes, status |
| Mandate detail | "Print Summary" | Role details, pipeline, timeline |
| Course certificate | Auto-PDF | Formal certificate design |
| Invoice | "Download PDF" | Formatted invoice with LYC branding |

---

## 11. Session Management UX

### 11.1 Auto-Logout
```
Timeout:       24 hours of inactivity (no mouse/keyboard)
Warning:       At 23 hours: toast notification "Session expires in 1 hour. [Stay logged in]"
On logout:     Redirect to login page, preserve intended URL, redirect back after login
```

### 11.2 Unsaved Changes
- If user navigates away with unsaved form changes → browser native "Leave site?" dialog.
- Auto-save indicator shows "All changes saved" or "Unsaved changes" in form header.

### 11.3 Multiple Tabs
- Same session across tabs (shared via localStorage/session).
- No conflict resolution needed (same user, same data).
- Actions in one tab reflected in others via Supabase realtime (if open).

---

## 12. Accessibility Requirements (WCAG 2.1 AA)

### 12.1 Mandatory for Every Component
- [ ] Color contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (large text, UI elements)
- [ ] All interactive elements keyboard-accessible
- [ ] Focus indicator visible (ring-2 ring-primary-300)
- [ ] All images have alt text (or alt="" for decorative)
- [ ] Form inputs have associated labels
- [ ] Error messages associated with inputs (aria-describedby)
- [ ] ARIA landmarks for page regions (nav, main, aside, footer)
- [ ] Skip navigation link as first focusable element
- [ ] Dynamic content updates announced (aria-live="polite")

### 12.2 Testing
- Automated: axe-core in CI pipeline (every PR).
- Manual: Keyboard-only navigation test before each release.
- Screen reader: VoiceOver (Mac) + NVDA (Windows) quarterly audit.

---

## 13. Implementation Notes for Trae

### 13.1 Tech Stack
- **CSS Framework:** Tailwind CSS (already in project).
- **Component Library:** Build custom components using these tokens. No external UI library (shadcn/ui is acceptable if it matches these specs).
- **CSS Variables:** All tokens as CSS custom properties in `globals.css`.
- **Icon Package:** `lucide-react`.

### 13.2 File Structure
```
src/
├── components/
│   ├── ui/              ← Base components (Button, Input, Card, Modal, etc.)
│   ├── layout/          ← Layout components (TopBar, Sidebar, PageLayout)
│   ├── patterns/        ← Composite patterns (EmptyState, LoadingState, ErrorState)
│   └── portal/          ← Portal-specific components
├── tokens/
│   └── design-tokens.ts ← All design tokens as TypeScript constants
├── styles/
│   └── globals.css      ← CSS custom properties from tokens
└── hooks/
    ├── useToast.ts      ← Toast notification hook
    ├── useModal.ts      ← Modal management hook
    └── useNotification.ts ← Notification center hook
```

### 13.3 Component Checklist
Before building any portal page, these base components must exist:
- [ ] Button (all variants, sizes, states)
- [ ] Text Input, Textarea, Select, Checkbox, Radio, Toggle
- [ ] Card (all variants)
- [ ] Table (sortable, selectable, responsive)
- [ ] Modal / Dialog / Confirmation Dialog
- [ ] Toast notification system
- [ ] Badge / Tag
- [ ] Avatar (all sizes, fallback)
- [ ] Tooltip
- [ ] Empty State
- [ ] Loading / Skeleton
- [ ] Error State
- [ ] Top Bar
- [ ] Sidebar Navigation
- [ ] Notification Center (bell + dropdown)
- [ ] Command Palette (Cmd+K)
- [ ] Breadcrumbs

---

**Document Version:** 1.0  
**Status:** Ready for Trae implementation  
**Priority:** P0 — This must be built BEFORE any portal pages.
