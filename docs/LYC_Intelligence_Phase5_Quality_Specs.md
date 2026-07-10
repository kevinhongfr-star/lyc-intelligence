# LYC Intelligence — Phase 5 Specs (UX Quality & Platform Standards)

**Version:** 1.0
**Date:** 2026-07-10
**Scope:** 6 quality tickets | Cross-cutting platform standards
**Dependencies:** Phase 1-4 must be deployed
**Purpose:** Define the quality bar that Phase 1-4 specs did not cover. Every issue discovered during QA should have been caught by these specs. Going forward, NO feature ships without meeting Phase 5 standards.

---

## Phase 5 Overview

Phase 1-4 defined WHAT the platform does. Phase 5 defines HOW WELL it must do it.

**Root cause of recurring issues:** We specced features but not experience. A page can "exist" (Phase 1-4 ✓) while being completely non-interactive, too slow to use, visually dated, or returning the same canned response regardless of input. Phase 5 closes this gap.

**Six quality tickets:**

| Ticket | Scope | Hours | Priority |
|--------|-------|-------|----------|
| T29 | NEXUS Chatbot Behavioral Spec | 8-12h | 🔴 P0 |
| T30 | Page Interactivity Standard | 16-24h | 🔴 P0 |
| T31 | Design & Visual Quality Spec | 20-30h | 🟡 P1 |
| T32 | Performance Standards | 12-18h | 🔴 P0 |
| T33 | Layout & Information Architecture | 10-14h | 🟡 P1 |
| T34 | Cross-Portal Consistency Audit | 8-12h | 🟡 P1 |

---

## T29 — NEXUS Chatbot Behavioral Spec

**Estimate:** 8-12h (audit + fix existing pages)
**Priority:** 🔴 P0
**Status:** PARTIALLY FIXED (nexusChatHandler.ts role-based access). Remaining: audit all portal Nexus pages, verify response quality, test data injection.

### 29.1 Role-Based Access Matrix

| User Role | Can Discuss | Cannot Access | System Prompt Behavior |
|-----------|-------------|---------------|----------------------|
| **admin** | Everything: client names, mandates, candidates, pipeline, revenue, scoring, proprietary data | Nothing — full access | Direct, data-rich, no confidentiality blocks |
| **consultant** | Assigned mandates, candidate pipelines, market data for their deals | Other consultants' deals, admin settings | Full data for own mandates, professional tone |
| **client (B2B)** | Their own mandates, candidates presented to them, market benchmarks | Other clients, internal methodology details, scoring algorithms | Helpful, professional, light confidentiality on competitive intel |
| **candidate (B2C)** | Career advice, market positioning, interview prep, general LYC methodology | Client names, mandate details, other candidates, scoring | Coaching-first, encouraging, no proprietary data |

**Acceptance Criteria:**
- [ ] Admin asking "show me active mandates" gets actual mandate data (names, status, pipeline)
- [ ] Admin asking about a specific client gets detailed intelligence, not "I cannot disclose"
- [ ] Client asking about their mandate gets their data only
- [ ] Candidate asking about market salary gets general benchmarks, not LYC proprietary data
- [ ] No role sees NQ-03 confidentiality tags in responses
- [ ] Responses are role-appropriate in tone (admin = direct data, candidate = coaching)

### 29.2 Response Quality Standards

| Metric | Standard | Anti-Pattern |
|--------|----------|-------------|
| **Uniqueness** | Every response must be specific to the user's input | Same canned response for different inputs |
| **Data grounding** | Reference actual data when available | "I found 12 candidates" without querying |
| **Actionability** | End with concrete next step | End with "Would you like me to..." loops |
| **Directness** | Answer the question asked | "I need to clarify... What are you looking for: 1, 2, or 3?" |
| **No template tags** | Never show [DIAGNOSTIC:...] or [MILESTONE:...] to users | Internal tracking tags visible in chat |
| **Language** | Match user's language (EN→EN, ZH→ZH) | Always respond in English regardless of input |

**Acceptance Criteria:**
- [ ] 10 different user inputs produce 10 different responses
- [ ] No response contains internal tracking tags ([DIAGNOSTIC], [MILESTONE], [CONFIDENTIALITY])
- [ ] Responses reference actual platform data when the user asks about mandates/candidates/pipeline
- [ ] Every response ends with a recommendation, not a question about what the user wants

### 29.3 All Nexus Pages Must Use Real API

**Audit required:** Every page that renders a chat interface must call the real DeepSeek API. No page may have:
- Hardcoded responses (setTimeout + static string)
- Mock data that doesn't reflect real state
- Dead input fields that don't send messages

| Page | Route | Current Status | Required Action |
|------|-------|---------------|-----------------|
| ClientNexusAssistantPage | /client/nexus-assistant | ✅ FIXED (uses NexusChat) | Verify in production |
| NexusLanding | /nexus | Uses NexusChat | Verify DeepSeek key configured |
| NexusPage | /nexus (standalone) | Uses sendChatMessage (coze) | Audit — may use wrong API |
| CandidateNexusCoachPage | /candidate/nexus-coach | Uses sendChatMessage (coze) | Audit — may use wrong API |
| NexusEnginePage | /internal/nexus-engine | No chat interface | N/A |

### 29.4 NEXUS Context Awareness

When a user opens NEXUS from a specific page/context, the chatbot must know:
- Which page they came from
- What data is currently visible on that page
- What entity (mandate, candidate, company) they were looking at

**Acceptance Criteria:**
- [ ] Opening NEXUS from a mandate page injects mandate context (name, status, pipeline count)
- [ ] Opening NEXUS from a candidate profile injects candidate context (name, seniority, current company)
- [ ] Opening NEXUS from dashboard injects current metrics (pipeline value, active mandates count)
- [ ] User doesn't need to re-explain context the platform already has

---

## T30 — Page Interactivity Standard

**Estimate:** 16-24h
**Priority:** 🔴 P0
**Status:** NOT STARTED. 25+ pages identified as "dead" (zero onClick/navigate handlers).

### 30.1 Definition of "Interactive"

A page is interactive if EVERY visible data element supports at least one action:

| Element Type | Required Interaction | Example |
|-------------|---------------------|---------|
| **Data card** | Click → navigate to detail page | Click mandate card → /mandates/:id |
| **Stat number** | Click → drill-down or filter | Click "80 pipeline" → filtered pipeline view |
| **Table row** | Click → navigate to entity detail | Click candidate row → /candidates/:id |
| **Action button** | Click → execute action | Click "Complete" → mark item done |
| **Filter/tab** | Click → filter data | Click "High Priority" → filtered list |
| **List item** | Click → navigate or expand | Click notification → relevant entity page |
| **Chart segment** | Click/hover → tooltip + drill-down | Click funnel segment → candidates in that stage |

### 30.2 Dead Page Audit

A page is "dead" if it has:
- Zero onClick handlers
- Zero navigate() calls
- No navigation to other pages
- No action buttons that execute
- Static data display with no interactivity

**Known dead pages (from audit):**

**Client Portal (8 pages):**
- ClientDashboardPage — stats not clickable
- ClientMandatesPage — mandate cards not clickable
- ClientCandidatesPage — candidate list not clickable
- ClientAnalyticsPage — charts not drillable
- ClientDocumentsPage — documents not downloadable
- ClientBillingPage — invoices not viewable
- ClientSettingsPage — settings not editable
- ClientOnboardingPage — steps not completable

**Candidate Portal (5 pages):**
- CandidateDashboardPage — stats not clickable
- CandidateProfilePage — sections not editable
- CandidateAssessmentsPage — assessments not startable
- CandidateCoachingPage — sessions not bookable
- CandidateOpportunitiesPage — opportunities not applicable

**Coaching Portal (7 pages):**
- CoachingDashboardPage — stats not clickable
- CoachingSessionsPage — sessions not schedulable
- CoachingResourcesPage — resources not downloadable
- CoachingProgressPage — progress not drillable
- CoachingNotesPage — notes not editable
- CoachingGoalsPage — goals not updatable
- CoachingFeedbackPage — feedback not submittable

**Admin/Internal (5+ pages):**
- ConsultantDashboardPage — stats not clickable
- AnalyticsPage — charts not drillable
- ReportCenterPage — reports not downloadable
- SettingsPage — settings not editable
- AdminSecurityPage — actions not executable

**Acceptance Criteria:**
- [ ] Every data card navigates to its entity detail page on click
- [ ] Every stat number drills down to its source data on click
- [ ] Every table row navigates to the entity it represents
- [ ] Every filter/tab actually filters data
- [ ] Every action button executes its action (mark complete, download, navigate)
- [ ] Every list item is clickable
- [ ] Zero pages have only static display with no interaction

### 30.3 Click Feedback

Every clickable element must provide visual feedback:
- Hover state: background color change, cursor pointer, subtle shadow
- Active state: slight scale or color shift
- Loading state: spinner or skeleton when action is in progress
- Success state: toast notification or inline confirmation
- Error state: error message with retry option

### 30.4 Navigation Consistency

| Context | Expected Behavior |
|---------|------------------|
| Click entity name | Navigate to entity detail page |
| Click status badge | Navigate to filtered view of that status |
| Click metric number | Navigate to drill-down page with source data |
| Click "View All" | Navigate to full list view |
| Click notification | Navigate to the entity the notification is about |
| Click date | Navigate to calendar/timeline view |

---

## T31 — Design & Visual Quality Spec

**Estimate:** 20-30h
**Priority:** 🟡 P1
**Status:** NOT STARTED. Current design described as "Windows 98/Facebook 2005" — visually dated.

### 31.1 Visual Hierarchy Standards

Every page must have clear visual hierarchy:
1. **Primary element** — The most important information gets the most visual weight (largest, boldest, highest contrast)
2. **Secondary elements** — Supporting data gets moderate weight
3. **Tertiary elements** — Metadata, timestamps, labels get minimal weight (small, muted)

**Information priority rule for LYC Intelligence:**
1. Client/Company name (always first, always visible)
2. Mandate/Role title
3. Status/Progress indicator
4. Key metrics (pipeline count, days active, value)
5. Metadata (created date, last updated, assigned consultant)

### 31.2 Spacing & Layout

| Element | Standard | Anti-Pattern |
|---------|----------|-------------|
| **Page padding** | 24-32px on desktop, 16px on mobile | 8px or 0px (cramped) |
| **Card padding** | 20-24px internal | 8-12px (crammed content) |
| **Card gap** | 16-20px between cards | 4-8px (no breathing room) |
| **Section gap** | 32-48px between sections | 8-16px (everything mushed) |
| **Text line height** | 1.5-1.6 for body text | 1.0-1.2 (hard to read) |
| **Max content width** | 1200px (don't stretch full screen) | 100% width (text spans 1920px) |

### 31.3 Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Page title | Libre Baskerville | 28-32px | 700 | #000 (light) / #FFF (dark) |
| Section title | Libre Baskerville | 20-24px | 700 | #000 / #FFF |
| Card title | DM Sans | 16-18px | 600 | #1A1A1A / #F0F0F0 |
| Body text | DM Sans | 14-15px | 400 | #333 / #CCC |
| Muted/metadata | DM Sans | 12-13px | 400 | #666 / #999 |
| Labels | DM Sans | 11-12px | 600 | #666 / #999, uppercase |

### 31.4 Depth & Elevation

The current design is flat. Add subtle depth:
- **Cards:** box-shadow: 0 1px 3px rgba(0,0,0,0.08), border: 1px solid #E5E5E5
- **Cards hover:** box-shadow: 0 4px 12px rgba(0,0,0,0.12), transform: translateY(-1px)
- **Inputs:** border: 1px solid #E5E5E5, focus: border-color: #C108AB, box-shadow: 0 0 0 3px rgba(193,8,171,0.1)
- **Buttons primary:** background: #C108AB, shadow: 0 2px 4px rgba(193,8,171,0.3)
- **Buttons hover:** background: #A00790, shadow: 0 4px 8px rgba(193,8,171,0.4)
- **Dark mode cards:** background: #1A1225, border: 1px solid #2A1A35, shadow: 0 2px 8px rgba(0,0,0,0.3)

### 31.5 Color System

| Usage | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Background | #FFFFFF | #0D0A14 (warm purple-black, NOT cold gray) |
| Card surface | #FFFFFF | #1A1225 |
| Alternate surface | #F8F8F8 | #15101D |
| Primary accent | #C108AB (fuchsia) | #C108AB |
| Success | #10B981 | #10B981 |
| Warning | #F59E0B | #F59E0B |
| Error | #EF4444 | #EF4444 |
| Text primary | #000000 | #FFFFFF |
| Text secondary | #333333 | #E0E0E0 |
| Text muted | #666666 | #9CA3AF |
| Border | #E5E5E5 | #2A1A35 |

### 31.6 Component Design Standards

**Buttons:**
- Min height: 44px (touch target)
- Padding: 12px 20px
- Font: DM Sans, 14px, 600
- Border-radius: 0px (LYC brand = zero radius)
- Hover: background darkens 10%, subtle lift shadow

**Cards:**
- Padding: 20-24px
- Border: 1px solid border color
- Border-radius: 0px
- Shadow: subtle (see 31.4)
- Hover: lift -1px, shadow increases

**Inputs:**
- Height: 44-48px
- Padding: 12px 16px
- Border: 1px solid border color
- Border-radius: 0px
- Focus: accent border + subtle glow
- Placeholder: muted color, 14px

**Tables:**
- Row height: min 48px
- Cell padding: 12px 16px
- Header: bold, muted background, sticky on scroll
- Hover row: subtle background change
- Border: between rows only (not full grid)

### 31.7 Animation & Transitions

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Page transition | 200-300ms | ease-out |
| Card hover | 150ms | ease |
| Button hover | 100ms | ease |
| Modal open | 200ms | ease-out |
| Modal close | 150ms | ease-in |
| Tab switch | 150ms | ease |
| Toast appear | 200ms | ease-out |
| Skeleton pulse | 1.5s | ease-in-out infinite |

### 31.8 Mobile Responsive

| Breakpoint | Behavior |
|-----------|----------|
| < 640px (mobile) | Single column, stacked cards, hamburger nav |
| 640-1024px (tablet) | 2-column grid, collapsible sidebar |
| > 1024px (desktop) | Full layout, sidebar visible |

**Mobile requirements:**
- All navigation accessible (hamburger menu or bottom nav)
- Cards stack vertically (no horizontal scroll)
- Touch targets min 44x44px
- Font sizes don't go below 13px
- Tables become card lists or horizontal scroll with indicator

---

## T32 — Performance Standards

**Estimate:** 12-18h
**Priority:** 🔴 P0
**Status:** NOT STARTED. Kevin reports "WAY too slow to load, most of the times just not loading."

### 32.1 Load Time Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Page navigation | < 500ms | Perceived (skeleton → data) |
| Data fetch | < 1s for list, < 2s for detail | Network tab |
| Chat response (NEXUS) | < 3s first token (DeepSeek) | User-perceived |

### 32.2 Data Fetching Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Sequential queries (wait for A, then B, then C) | Parallel with Promise.all() |
| Fetch on every render | Memoize with useMemo/useCallback, fetch in useEffect with deps |
| No loading state | Skeleton or spinner for every async operation |
| No error state | Error boundary + retry button |
| Fetch same data multiple times | Cache in state/context, don't re-fetch on remount |
| N+1 queries (loop fetch) | Batch into single query with WHERE IN |
| No pagination | Paginate lists > 50 items (20 per page) |
| Fetch on mount for data already in URL params | Use route params directly, don't re-fetch |

### 32.3 Skeleton Loading

Every page must show a skeleton while data loads:
- Match the layout of the final content
- Use subtle pulse animation (opacity 0.5 → 0.8, 1.5s cycle)
- Never show a blank white page during loading
- Never show "Loading..." text without a skeleton

### 32.4 Caching Strategy

| Data Type | Cache Duration | Invalidation |
|-----------|---------------|-------------|
| User profile | Session | On profile update |
| Mandate list | 5 min | On mandate CRUD |
| Candidate list | 5 min | On candidate CRUD |
| Pipeline metrics | 2 min | On pipeline update |
| Static config | 1 hour | On deploy |
| NEXUS chat history | Session | On session clear |

### 32.5 Bundle Size

| Metric | Target |
|--------|--------|
| Initial JS bundle | < 250KB gzipped |
| Total page weight | < 1MB |
| Font files | < 100KB total |
| Image assets | Lazy load, WebP format |

### 32.6 Supabase Query Standards

- Use `.select()` with specific columns, not `*`
- Add `.limit()` to all list queries (default 50, max 200)
- Use `.order()` for deterministic results
- Add indexes for frequently filtered columns
- Use Realtime subscriptions only for data that changes during user session (chat messages, notifications)

---

## T33 — Layout & Information Architecture

**Estimate:** 10-14h
**Priority:** 🟡 P1
**Status:** NOT STARTED. Kevin: "company and client name should come before the type of insight."

### 33.1 Information Priority Rules

For ALL list views, cards, and notifications, the visual order must be:

1. **Entity identifier** — Client name, company name, or candidate name (largest, boldest, first)
2. **Context** — Mandate title, role, or relationship
3. **Status** — Current state (active, pending, completed) with color indicator
4. **Key metric** — Most important number (pipeline value, match score, days remaining)
5. **Supporting data** — Secondary metrics, dates, tags
6. **Actions** — Buttons for what you can do with this item

**Anti-pattern (currently in production):**
```
[Priority Score: 80]
[Type: pipeline_priority]
[Due: May 23]
[Action description]
[Metadata: "Generated from Q2 Pipeline Report"]
```

**Required pattern:**
```
[Yuantong Feng AR]          ← Client/company name FIRST
[Q2 Pipeline - Commercial Rationale]  ← Context
[● Active] [Due: May 23]    ← Status + deadline
[Priority: 80] [Value: ¥30.5K]  ← Key metrics
[Confirm payment →]         ← Action button
```

### 33.2 Page Layout Template

Every app page (inside AppShell) follows this structure:

```
┌─────────────────────────────────────────────────────┐
│ Page Header                                          │
│ [Page Title]                    [Primary Action Btn] │
│ [Breadcrumb or subtitle]                             │
├─────────────────────────────────────────────────────┤
│ Filter/Tab Bar                                       │
│ [All (20)] [Pending (20)] [High Priority (8)]        │
├─────────────────────────────────────────────────────┤
│ Content Area                                         │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ Card 1       │ │ Card 2       │ │ Card 3       │    │
│ │ [Name]       │ │ [Name]       │ │ [Name]       │    │
│ │ [Context]    │ │ [Context]    │ │ [Context]    │    │
│ │ [Metrics]    │ │ [Metrics]    │ │ [Metrics]    │    │
│ │ [Actions]    │ │ [Actions]    │ │ [Actions]    │    │
│ └─────────────┘ └─────────────┘ └─────────────┘    │
├─────────────────────────────────────────────────────┤
│ Pagination (if > 20 items)                           │
└─────────────────────────────────────────────────────┘
```

### 33.3 Dashboard Layout

| Section | Position | Content |
|---------|----------|---------|
| Welcome/header | Top | User name, role, date |
| Key metrics | Below header | 3-4 stat cards (clickable → drill-down) |
| Active mandates | Main content left | List of active mandates with pipeline status |
| Priority actions | Main content right | Top 5 action items sorted by priority |
| Recent activity | Below | Timeline of recent changes |
| NEXUS suggestions | Bottom | AI-suggested next actions based on current state |

### 33.4 Notification Card Template

Every notification must follow this structure:
```
┌───────────────────────────────────────────┐
│ [Client/Company Name]          [Priority] │  ← Name FIRST
│ [What happened / Action needed]           │  ← Clear action
│ [Source: Mandate/Candidate/Pipeline]      │  ← Context
│ [Due: Date]                    [Action →] │  ← Deadline + button
└───────────────────────────────────────────┘
```

---

## T34 — Cross-Portal Consistency Audit

**Estimate:** 8-12h
**Priority:** 🟡 P1
**Status:** NOT STARTED.

### 34.1 Portal List

| Portal | Route Prefix | User Type | Key Pages |
|--------|-------------|-----------|-----------|
| Admin/Internal | /admin, /internal | LYC team | Dashboard, Mandates, Candidates, Analytics, Settings |
| B2B Client | /client | Corporate clients | Dashboard, Mandates, Candidates, Documents, Billing |
| B2C Candidate | /candidate | Job seekers | Dashboard, Profile, Assessments, Coaching |
| Coaching | /coaching | Coaches/mentors | Dashboard, Sessions, Resources, Progress |
| Public | / (root) | Everyone | Landing, Pricing, Login, Register |

### 34.2 Consistency Checklist

Every portal must meet ALL of these:

- [ ] **Same design system** — Colors, fonts, spacing, shadows identical across portals
- [ ] **Same component library** — Using shared UI components (Card, Button, Input, Badge)
- [ ] **Same navigation pattern** — Sidebar on desktop, hamburger on mobile
- [ ] **Same loading states** — Skeleton loading everywhere, not blank pages
- [ ] **Same error handling** — Error boundaries, retry buttons, toast notifications
- [ ] **Same interactivity bar** — Every data element clickable (T30)
- [ ] **Same performance bar** — Load time targets met (T32)
- [ ] **Same responsive behavior** — Mobile layout works on all portals
- [ ] **Same NEXUS quality** — Chatbot works with real API, role-aware (T29)
- [ ] **Same information priority** — Entity name first, always (T33)

### 34.3 Portal-Specific Requirements

**Admin/Internal:**
- Full data access, all metrics visible
- Quick actions for mandate management
- GRID intelligence features accessible
- Export/PDF generation available

**B2B Client:**
- See only their own mandates and candidates
- Cannot see internal scoring or methodology
- Can download reports and documents
- Can message their consultant through the platform

**B2C Candidate:**
- Cannot see client names or mandate details
- Career coaching and assessment focused
- Can upload CV, track applications
- NEXUS provides career advice only

**Coaching:**
- Session management and scheduling
- Resource library access
- Progress tracking for coachees
- Notes and goal setting

---

## Testing & Acceptance

### Global Acceptance Gate

Before ANY page or feature is considered "done," it must pass:

1. **Interactivity test** — Can I click on every visible data element? (T30)
2. **Response test** — Does NEXUS give a unique, relevant response to 10 different inputs? (T29)
3. **Speed test** — Does the page load in < 3s on a 4G connection? (T32)
4. **Design test** — Does it look like a premium enterprise product, not a CRUD template? (T31)
5. **Priority test** — Is the most important information (client name) the first thing I see? (T33)
6. **Portal test** — Does it work identically well across all 4 portals? (T34)
7. **Mobile test** — Can I use every feature on my phone? (T31.8)

### Regression Testing

After Phase 5 implementation:
- [ ] All 80 pages pass interactivity audit (zero dead pages)
- [ ] NEXUS responds correctly for all 4 role types
- [ ] No page takes > 3s to load (Lighthouse verified)
- [ ] Design matches the spec (spot-check 10 random pages)
- [ ] Information priority correct on all list views
- [ ] Mobile responsive on all portals (test at 375px, 768px, 1440px)

---

## Summary

Phase 5 is not about new features. It's about making Phase 1-4 features actually usable.

Every issue Kevin has flagged — fake NEXUS responses, dead pages, slow loading, dated design, information buried — would have been caught if Phase 5 specs existed before implementation.

**Going forward:** No feature ships until it passes the Phase 5 acceptance gate.
