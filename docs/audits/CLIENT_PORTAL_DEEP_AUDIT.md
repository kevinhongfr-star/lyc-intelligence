# Client Portal Deep Audit — All Pages

**Scope:** 12 pages/routes in the B2B Client Portal (`/client/*` + `/b2b`)
**Source:** `src/pages/client/*.tsx`, `src/pages/B2BLanding.tsx`, `src/services/collaborationService.ts`, `src/api/handlers/clientPortalV2Handler.ts`
**Date:** 2026-07-21
**Auditor:** NEXUS
**Cross-reference:** Spec v2.0 (`docs/specs/ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v2.md`), Notion Master Product Reference

---

## Page Index

| # | Page | Route | Lines | Data Source | Score |
|---|------|-------|-------|-------------|-------|
| 1 | B2B Landing | `/b2b` | 208 | Static | 4/10 |
| 2 | Overview | `/client/overview` | 236 | Real Supabase | 6/10 |
| 3 | Mandates | `/client/mandates` | 194 | Real Supabase | 5/10 |
| 4 | Mandate Detail | `/client/mandates/:id` | 728 | Real API | 7/10 |
| 5 | Candidates | `/client/candidates` | 199 | Real Supabase | 4/10 |
| 6 | Documents | `/client/documents` | 174 | Real Supabase | 4/10 |
| 7 | Collaboration | `/client/collaboration` | 252 | Partial (seed fallback) | 5/10 |
| 8 | Onboarding | `/client/onboarding` | 277 | Partial static | 3/10 |
| 9 | Talent Intel | `/client/talent-intel` | 239 | Real API | 6/10 |
| 10 | Pipeline Analytics | `/client/pipeline-analytics` | 159 | **100% hardcoded** | 2/10 |
| 11 | Admin | `/client/admin` | 378 | Partial real | 5/10 |
| 12 | Nexus Assistant | `/client/nexus-assistant` | 24 | Real (NexusChat) | 7/10 |

**Portal Average: 4.8/10**

---

# AUDIT #10: B2B Landing Page (`/b2b`)

**File:** `src/pages/B2BLanding.tsx` (208 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Nav bar | ✅ Functional | Links to /match, /b2c, /nexus, /login — all wired |
| Mobile menu | ✅ Functional | Hamburger → slide-in overlay |
| "Try Match Analysis Free" CTA | ✅ Wired | Links to `/match` |
| "Leadership Assessment" CTA | ✅ Wired | Links to `/assessment` |
| Lead Capture Form | ❌ Missing | Not present on B2B landing (exists on B2C) |
| Scroll reveal | ✅ Working | `initScrollReveal()` IntersectionObserver |

### What's missing or broken:
- ❌ **No lead capture form** — B2C has one, B2B doesn't. For an enterprise product this is a critical conversion gap
- ❌ **No pricing or subscription info** — Enterprise buyers need to see tier structure
- ❌ **No social proof** — No logos, testimonials, case studies, or client count
- ❌ **No product screenshots** — No dashboard preview, no report preview, no candidate scoring preview
- ❌ **"Scoring Dimensions" section uses generic names** — "Experience & Achievements", "Skills & Expertise", "Organizational Fit" — these are the old TRIDENT names. Spec v2.0 requires "Score Match" branding with no internal framework references
- ❌ **No compliance/security section** — Enterprise clients need to see SOC2, GDPR, data handling info

### Go-live readiness: 3/10
It's a thin brochure. Missing the lead capture form that B2C has. No enterprise-specific content.

---

## 2. DESIGN

### What works:
- ✅ Brand-consistent: Libre Baskerville + DM Sans, fuchsia #C108AB, zero border-radius
- ✅ Clean hero with fuchsia radial glow
- ✅ Responsive grid layout
- ✅ Card hover effects (`card-hover` class)

### Design issues:
- ⚠️ **No product imagery at all** — Purely typographic. Enterprise buyers expect to see the product
- ⚠️ **Icon system is minimal** — Only uses IconTrident, IconForge, IconPrism, IconBridge, IconImpact, IconSpark. No variety
- ⚠️ **Section labels at 9px** — Nearly unreadable on mobile
- ⚠️ **No dark section contrast** — B2C landing has a dark CTA section; B2B is all white/grey

### Go-live readiness: 4/10

---

## 3. USER EXPERIENCE & ONBOARDING

### User journey:
```
User lands on /b2b
  → Sees hero: "Find Your Next C-Suite Leader in Hours, Not Months"
  → Two CTAs: "Try Match Analysis Free" | "Leadership Assessment"
  → Scrolls: How It Works (3 steps)
  → Scoring Dimensions section
  → "Why Match Analysis" section
  → Footer
```

### UX issues:
- ❌ **No clear CTA hierarchy** — Both CTAs are visually similar. Primary should be "Schedule Demo" or "Contact Sales" for B2B
- ❌ **No demo/trial flow** — Enterprise buyers want a guided demo, not a self-serve assessment
- ❌ **No login prominence** — Existing client users have no obvious way to access the portal
- ❌ **No multi-stakeholder flow** — B2B purchases involve multiple decision-makers; no "Share with your team" option

### Go-live readiness: 3/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Destination |
|---------|-----------|-------------|
| "Try Match Analysis Free" | ✅ | `/match` |
| "Leadership Assessment" | ✅ | `/assessment` |
| Nav links | ✅ | Correct pages |
| Footer links | ✅ | Correct pages |
| Card hover | ✅ Visual only | No click action on feature cards |

### Go-live readiness: 6/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ `initScrollReveal()` for fade-in-up on scroll
- ✅ Card hover lift effects
- ✅ CTA glow transition
- ⚠️ **No staggered reveal** — All cards appear simultaneously
- ⚠️ **No micro-interactions** on card hover beyond shadow change

### Go-live readiness: 5/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Status |
|---------|--------|
| All content | **100% Static** |
| No dynamic data, no API calls, no user-specific content | Confirmed |

### Go-live readiness: 5/10 (content is real, but no dynamic data)

---

## 7. OVERALL: 4/10

---

# AUDIT #11: Client Overview (`/client/overview`)

**File:** `src/pages/client/ClientOverviewPage.tsx` (236 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Active Mandates count | ✅ Real | `getMandates()` → counts active |
| Total Candidates | ✅ Real | Sum of `total_candidates` from mandates |
| Avg Progress | ✅ Real | Calculated from mandate progress values |
| **Placed This Quarter** | ❌ **HARDCODED** | Always shows `2` — no query, no calculation |
| Active Mandates list | ✅ Real | Shows mandate title, status badge, candidate count, progress bar |
| Recent Activity feed | ✅ Real | `fetchClientActivity(clientAccount.id)` |
| "View all" button | ❌ **DEAD** | No `onClick`, no `href`, no navigation |
| User badge | ✅ Real | Shows `displayName` + `organization` from tenant context |

### What's missing or broken:
- ❌ **"Placed This Quarter" = hardcoded `2`** — Should query placements or at minimum show `—`
- ❌ **"View all" button is decorative** — No link to `/client/mandates`
- ❌ **No mandate click-through** — Mandate list items aren't clickable (no `Link` to `/client/mandates/:id`)
- ❌ **No quick actions** — No "New Mandate", "Upload Document", "Message Consultant" shortcuts
- ❌ **No notification indicator** — No unread messages, no pending approvals
- ❌ **No credit balance display** — Spec v2.0 mandates credit visibility for subscribed clients

### Go-live readiness: 5/10
Core data is real. But dead buttons and hardcoded values undermine trust.

---

## 2. DESIGN

### What works:
- ✅ Clean 4-metric card grid with fuchsia icon backgrounds
- ✅ Progress bars on mandate list items
- ✅ Activity feed with timestamp and icon
- ✅ Consistent use of design system tokens (text-primary, text-muted, bg-warm)
- ✅ Responsive: 1-col → 2-col → 4-col grid

### Design issues:
- ⚠️ **Activity feed is text-only** — No visual differentiation between event types (new candidate, interview scheduled, feedback received)
- ⚠️ **No empty state illustration** — Just text "No active mandates"
- ⚠️ **User badge is top-right** — Could be more prominent as a persistent header element

### Go-live readiness: 6/10

---

## 3. USER EXPERIENCE

### User journey:
```
Client logs in → /client/overview (default route)
  → Sees 4 metric cards (mandates, candidates, progress, placements)
  → Sees active mandates list with progress bars
  → Sees recent activity feed
```

### UX issues:
- ❌ **No onboarding prompt** — New clients see empty states with no guidance
- ❌ **"View all" button creates false expectation** — Users click it expecting navigation
- ❌ **Mandate items look clickable (cursor-pointer on card hover in MandatesPage) but Overview list items have no hover state or link** — Inconsistent affordance
- ⚠️ **No date range selector** — "This Quarter" is hardcoded, no way to change period

### Go-live readiness: 4/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| "View all" | ❌ No handler | Dead button |
| Mandate list items | ❌ No link | Should link to `/client/mandates/:id` |
| Activity items | ❌ No link | Should deep-link to relevant mandate/event |
| User badge | ❌ Static | No link to profile/admin |

### Go-live readiness: 3/10 — Too many dead interactive elements

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Progress bar `transition-all` on width change
- ✅ Loading state shows "Loading mandates..." text
- ⚠️ **No skeleton loading** — Just text, unlike other pages that use `animate-pulse`
- ⚠️ **No staggered card entrance** — All 4 metric cards appear simultaneously

### Go-live readiness: 4/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Active Mandates count | `getMandates()` | ✅ Real |
| Total Candidates | Sum from mandates | ✅ Real |
| Avg Progress | Calculated | ✅ Real |
| **Placed This Quarter** | Hardcoded `2` | ❌ **FAKE** |
| Mandate list | `getMandates()` | ✅ Real |
| Activity feed | `fetchClientActivity()` | ✅ Real |

### Go-live readiness: 5/10 — One of four key metrics is fabricated

---

## 7. OVERALL: 5/10

---

# AUDIT #12: Client Mandates (`/client/mandates`)

**File:** `src/pages/client/ClientMandatesPage.tsx` (194 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Mandate list | ✅ Real | `getMandates({ userId })` |
| Search filter | ✅ Working | Client-side text filter on title/company |
| Status dropdown | ✅ Working | Filters by Active/On Hold/Closed |
| Mandate cards | ✅ Real | Shows title, company, location, seniority, candidates/shortlisted/interviewed counts, progress bar |
| Card click | ❌ **DEAD** | Has `cursor-pointer` class but no `onClick` or `Link` |
| User badge | ✅ Real | Tenant context |

### What's missing or broken:
- ❌ **Cards are visually clickable but not wired** — `cursor-pointer` + `hover:shadow-card-hover` suggests navigation but nothing happens on click
- ❌ **No "Create Mandate" button** — Clients can't initiate new mandates from this page
- ❌ **No pagination** — Loads all mandates at once with `limit` from API
- ❌ **No sort options** — Can't sort by date, progress, candidate count
- ❌ **`seniority` field uses `client_first_name`** — This is a data mapping bug. `m.client_first_name` is not a seniority level, it's a person's name
- ⚠️ **Status filter uses display strings** — 'Active', 'On Hold', 'Closed' are client-side labels; filter works on mapped values, not DB values

### Go-live readiness: 4/10

---

## 2. DESIGN

### What works:
- ✅ 2-column responsive grid (`lg:grid-cols-2`)
- ✅ Good information density per card (6 data points + progress bar)
- ✅ Status badges with color coding (green/amber/grey)
- ✅ Progress bars with fuchsia fill
- ✅ Date range display (Started/Updated)

### Design issues:
- ⚠️ **Cards are text-heavy** — Could use visual hierarchy improvements (larger title, smaller metadata)
- ⚠️ **No visual distinction for mandate type/role** — All cards look the same regardless of seniority or industry

### Go-live readiness: 6/10

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Dead card clicks frustrate users** — The hover effect promises navigation that doesn't exist
- ❌ **No deep-link to mandate detail** — Users must manually navigate to `/client/mandates/:id`
- ❌ **Search is client-side only** — For large datasets this won't scale
- ⚠️ **No empty state for "no mandates"** — Actually has `EmptyState` component ✅

### Go-live readiness: 4/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| Mandate cards | ❌ Visual only | `cursor-pointer` + hover shadow but no action |
| Search input | ✅ | Filters list |
| Status dropdown | ✅ | Filters by status |

### Go-live readiness: 4/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Card hover shadow transition
- ✅ Progress bar transition
- ⚠️ **No skeleton loading** — Text "Loading mandates..." only
- ⚠️ **No staggered card entrance**

### Go-live readiness: 4/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Mandate list | `getMandates()` | ✅ Real |
| Candidate counts | `total_candidates`, `shortlisted_count`, `interview_count` | ✅ Real |
| Progress | `parseInt(m.progress)` | ✅ Real |
| **Seniority** | `m.client_first_name` | ❌ **WRONG FIELD** |
| Company/location | `m.company?.name`, `m.company?.city/country` | ✅ Real (if joined) |

### Go-live readiness: 5/10 — Data mapping bug on seniority field

---

## 7. OVERALL: 5/10

---

# AUDIT #13: Mandate Detail (`/client/mandates/:id`)

**File:** `src/pages/client/ClientMandateDetailPage.tsx` (728 lines)
**This is the most complete and functional page in the entire portal.**

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| 4-tab layout | ✅ | Overview / Shortlist / Interviews / Collaboration |
| Mandate overview | ✅ Real | Fetches from `/api/client-portal/mandates/:id` |
| Timeline events | ✅ Real | Vertical timeline with type/title/description/actor |
| Stage distribution | ✅ Real | `stage_distribution` from API |
| Shortlist with feedback | ✅ Real | Candidates with Interested/Not Interested/Need More Info/Hold |
| Feedback submission | ✅ Real | POST to `/api/client-portal/mandates/:id/feedback` |
| Interview scheduling | ✅ Real | Interview list from API |
| Collaboration/messaging | ✅ Real | Message thread with send capability |
| Message send | ✅ Real | POST to `/api/client-portal/collaboration/:id` |
| Back navigation | ✅ | `navigate(-1)` |
| Loading state | ✅ | Spinner + "Loading..." |
| Error state | ✅ | Error message with back button |

### What's missing or broken:
- ⚠️ **Progress calculation is naive** — `Math.min(100, Math.round((candidate_count / 10) * 100))` — assumes 10 candidates = 100% progress. This is arbitrary and doesn't reflect actual mandate progress
- ⚠️ **No "Request Interview" button** — Interview tab is read-only
- ⚠️ **No file attachment in messages** — Text-only messaging
- ⚠️ **No mandate status change** — Client can't update mandate status (Active → On Hold → Closed)
- ⚠️ **No export/download** — Can't export shortlist or timeline as PDF/CSV
- ❌ **No candidate profile link** — Can't click through to see full candidate details

### Go-live readiness: 7/10 — Most functional page, but missing some expected features

---

## 2. DESIGN

### What works:
- ✅ Clean 4-tab layout with proper active states
- ✅ StatMini components for key metrics (candidates, shortlisted, interviewed, placed)
- ✅ Timeline with vertical line + dot indicators
- ✅ ShortlistCard with expandable feedback UI
- ✅ InterviewCard with date/time/location
- ✅ MessageBubble with directional styling (client vs consultant)
- ✅ Proper use of Badge variants (success/danger/warning/default)
- ✅ Consistent spacing and typography

### Design issues:
- ⚠️ **Hardcoded hex colors** — Uses `#1A1A1A`, `#6B6B6B`, `#9B9B9B`, `#E5E5E5`, `#F0F0F0` instead of design tokens (`text-primary`, `text-muted`, etc.). This is inconsistent with other pages
- ⚠️ **Feedback buttons are cramped** — 4 buttons in a row on mobile will wrap awkwardly
- ⚠️ **Message textarea is small** — Only 2 rows, no expand option

### Go-live readiness: 7/10

---

## 3. USER EXPERIENCE

### User journey:
```
Client clicks mandate → /client/mandates/:id
  → Sees Overview tab: mandate details, stage distribution, timeline
  → Switches to Shortlist: sees candidates with feedback options
  → Gives feedback: clicks "Give Feedback" → selects type → optional reason → Submit
  → Switches to Interviews: sees scheduled interviews
  → Switches to Collaboration: messages consultant
```

### UX strengths:
- ✅ **Feedback flow is intuitive** — Expand inline, select type, add reason, submit
- ✅ **Tab organization is logical** — Overview → Shortlist → Interviews → Collaboration maps to real workflow
- ✅ **Empty states are informative** — Each tab has a clear "nothing here yet" message
- ✅ **Keyboard support** — Enter to send message (Shift+Enter for newline)

### UX issues:
- ❌ **No confirmation dialog for feedback** — Submitting "Not Interested" is immediate with no undo
- ❌ **No feedback history** — Can't see previous feedback given to same candidate
- ⚠️ **No notification when consultant replies** — No real-time or push notification
- ⚠️ **Message thread has max-height with scroll** — But no "scroll to bottom" or "new message" indicator

### Go-live readiness: 7/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Status |
|---------|-----------|--------|
| Tab switches | ✅ | Functional |
| "Give Feedback" | ✅ | Expands inline form |
| Feedback type buttons | ✅ | Toggle selection |
| Submit feedback | ✅ | POST to API |
| Send message | ✅ | POST to API |
| Back button | ✅ | `navigate(-1)` |
| Candidate LinkedIn | ❌ | No link to LinkedIn URL (data exists but not wired) |

### Go-live readiness: 7/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Tab content transitions
- ✅ Spinner on loading
- ✅ Feedback form expand/collapse (conditional render)
- ⚠️ **No animation on tab switch** — Abrupt content change
- ⚠️ **No transition on feedback type selection** — Just background color change

### Go-live readiness: 5/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Mandate details | `/api/client-portal/mandates/:id` | ✅ Real API |
| Shortlist | `/api/client-portal/mandates/:id/shortlist` | ✅ Real API |
| Interviews | `/api/client-portal/mandates/:id/interviews` | ✅ Real API |
| Messages | `/api/client-portal/collaboration/:id` | ✅ Real API |
| **Progress %** | `candidate_count / 10 * 100` | ⚠️ **ARBITRARY FORMULA** |
| Stage distribution | API `stage_distribution` | ✅ Real |

### Go-live readiness: 8/10 — Nearly all real data

---

## 7. OVERALL: 7/10 — Best page in the portal

---

# AUDIT #14: Client Candidates (`/client/candidates`)

**File:** `src/pages/client/ClientCandidatesPage.tsx` (199 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Candidate list | ✅ Real | `searchContacts()` from Supabase |
| Search filter | ✅ Working | Client-side text filter |
| Tier filter | ✅ Working | S/A/B/C dropdown |
| Tier badges | ✅ Computed | Based on `trident_composite` or `match_score_best` |
| Score display | ✅ Real | Shows computed score |
| Candidate info | ✅ Real | Name, title, company, location |

### What's missing or broken:
- ❌ **Status is always 'New'** — `status: 'New' as const` — every candidate shows "New" regardless of actual pipeline stage
- ❌ **Tier classification is hardcoded logic** — S: score≥85 or cxo_stamp, A: ≥65, B: ≥45, C: <45. This doesn't match any spec definition
- ❌ **No mandate association** — `mandateId: ''` and `mandateTitle: ''` are always empty
- ❌ **Cards look clickable but aren't** — `cursor-pointer` + `hover:shadow-card-hover` but no onClick
- ❌ **No candidate detail view** — No way to see full profile, assessment results, or match analysis
- ❌ **No bulk actions** — Can't select multiple candidates for comparison or shortlisting
- ❌ **No sort options** — Can't sort by score, name, date
- ❌ **`searchContacts` takes `query` but search is also client-side filtered** — Double-filtering is confusing and inefficient

### Go-live readiness: 3/10

---

## 2. DESIGN

### What works:
- ✅ Tier badge colors (S=fuchsia, A=blue, B=amber, C=grey)
- ✅ Star icon + score display
- ✅ Clean list layout with good information density
- ✅ Status badge color coding

### Design issues:
- ⚠️ **No candidate photos/avatars** — Just initials or icons
- ⚠️ **Mandate title area is always empty** — Shows empty fuchsia text below each candidate
- ⚠️ **Score has no context** — What does 72 mean? No benchmark or range explanation

### Go-live readiness: 5/10

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Dead card clicks** — Promise of detail view that doesn't exist
- ❌ **Empty mandate title** — Confusing empty space below each candidate
- ❌ **All statuses are "New"** — Useless status column
- ❌ **No filtering by mandate** — Can't see candidates for a specific search
- ⚠️ **Search triggers API call AND client-side filter** — Debouncing may not be sufficient

### Go-live readiness: 3/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| Candidate cards | ❌ Visual only | cursor-pointer but no action |
| Search input | ✅ | Filters + triggers API |
| Tier dropdown | ✅ | Filters list |

### Go-live readiness: 3/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Card hover shadow transition
- ⚠️ **No skeleton loading** — Text "Loading candidates..." only
- ⚠️ **No staggered list entrance**

### Go-live readiness: 3/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Candidate list | `searchContacts()` | ✅ Real |
| Score | `trident_composite` / `match_score_best` | ✅ Real |
| Tier | Computed from score | ⚠️ **ARBITRARY THRESHOLDS** |
| **Status** | Hardcoded `'New'` | ❌ **FAKE** |
| **Mandate association** | Empty strings | ❌ **MISSING** |

### Go-live readiness: 3/10

---

## 7. OVERALL: 4/10

---

# AUDIT #15: Client Documents (`/client/documents`)

**File:** `src/pages/client/ClientDocumentsPage.tsx` (174 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Document list | ✅ Real | `getDocuments()` from Supabase |
| Search filter | ✅ Working | Client-side text filter |
| Type filter | ✅ Working | Report/Invoice/Contract/Proposal |
| Document cards | ✅ Real | Title, type badge, date |
| Download button | ❌ **DEAD** | `<button>` with Download icon but no onClick |
| Refresh button | ❌ **DEAD** | No onClick handler |
| File size | ❌ **Always '—'** | Hardcoded dash, not reading `file_size_bytes` |

### What's missing or broken:
- ❌ **Download button does nothing** — No file download functionality
- ❌ **Refresh button does nothing** — No data reload on click
- ❌ **File size always shows '—'** — Not mapped from API response
- ❌ **Document types don't match spec** — Spec v2.0 defines assessment reports, not Invoice/Contract/Proposal
- ❌ **No document preview** — Can't view documents inline
- ❌ **No upload functionality** — Clients can't upload documents
- ❌ **No document versioning** — No way to see document history
- ⚠️ **`getDocuments()` takes no parameters** — Doesn't filter by client org, may return all documents

### Go-live readiness: 3/10

---

## 2. DESIGN

### What works:
- ✅ 2-column grid layout
- ✅ Type badge color coding
- ✅ Clean card design with icon
- ✅ Responsive

### Design issues:
- ⚠️ **Download icon without function is misleading**
- ⚠️ **No file type icons** — All documents show same FileText icon regardless of type (PDF, DOCX, XLSX)
- ⚠️ **No file size creates uncertainty** — Users don't know if they're downloading a 100KB or 100MB file

### Go-live readiness: 4/10

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Download button creates false expectation** — Users click expecting download
- ❌ **Refresh button creates false expectation** — Users click expecting data refresh
- ❌ **No document categorization** — All documents mixed together
- ⚠️ **No sort by date/name/type** — Only search + type filter

### Go-live readiness: 3/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| Download button | ❌ No handler | Dead |
| Refresh button | ❌ No handler | Dead |
| Search input | ✅ | Filters list |
| Type dropdown | ✅ | Filters by type |

### Go-live readiness: 3/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Card hover shadow transition
- ⚠️ **No skeleton loading** — Text "Loading documents..." only

### Go-live readiness: 3/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Document list | `getDocuments()` | ✅ Real (but unfiltered) |
| Document type | Mapped from DB type field | ✅ Real |
| **File size** | Hardcoded `'—'` | ❌ **MISSING** |
| Date | `created_at` | ✅ Real |

### Go-live readiness: 4/10

---

## 7. OVERALL: 4/10

---

# AUDIT #16: Client Collaboration (`/client/collaboration`)

**File:** `src/pages/client/ClientCollaborationPage.tsx` (252 lines)
**Service:** `src/services/collaborationService.ts` (221 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Active Projects | ⚠️ Partial | `collaborationService.getProjects()` — tries `mandates` table, falls back to SEED data |
| Discussion Threads | ⚠️ Partial | `collaborationService.getThreads()` — tries `mandate_comments`, falls back to SEED |
| Shared Documents | ⚠️ Partial | `collaborationService.getDocuments()` — tries `documents` table, falls back to SEED |
| Summary metrics | ✅ Computed | Project count, unread count, document count |
| Project progress bars | ✅ Visual | Shows progress percentage |

### What's missing or broken:
- ❌ **Seed data is the reality** — The `collaborationService` has extensive fallback to hardcoded seed data. In production with no matching DB tables, users will see fake projects, fake discussions, fake documents
- ❌ **Seed data references "DEX AI"** — `SEED_DOCUMENTS` has author `'DEX AI'` — deprecated brand name
- ❌ **No project detail view** — Can't click into a project to see details
- ❌ **No thread detail view** — Can't read or reply to discussions
- ❌ **No document download** — Documents show but can't be opened
- ❌ **No create/add functionality** — Can't create new projects, start discussions, or upload documents
- ⚠️ **Thread-to-mandate link is loose** — `mandateId` field exists but no navigation to mandate

### Go-live readiness: 4/10

---

## 2. DESIGN

### What works:
- ✅ 3-column summary metrics
- ✅ Project cards with progress bars and member counts
- ✅ Discussion thread list with unread badges
- ✅ Document list with type icons
- ✅ Loading skeleton (animate-pulse) — one of few pages with proper skeleton loading
- ✅ Clean card-based layout

### Design issues:
- ⚠️ **Project cards aren't clickable** — Look like they should navigate to detail view
- ⚠️ **Thread list is limited to 4 items** — `threads.slice(0, 4)` with no "view all"
- ⚠️ **Document list is limited to 4 items** — Same issue

### Go-live readiness: 6/10

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Everything is read-only** — Can't interact with any of the three sections
- ❌ **Seed data creates confusion** — Users see fake projects and think they're real
- ❌ **"DEX AI" in seed documents** — Brand violation
- ⚠️ **No way to navigate from collaboration to mandate** — Disconnect between pages

### Go-live readiness: 3/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| Project items | ❌ No link | Arrow icon suggests navigation but no action |
| Thread items | ❌ No link | Can't open thread |
| Document items | ❌ No link | Can't download/open |
| ArrowRight on projects | ❌ Decorative | Misleading |

### Go-live readiness: 2/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Skeleton loading on initial load
- ✅ Progress bar transitions
- ⚠️ **No entrance animations**

### Go-live readiness: 5/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Projects | `mandates` table → SEED fallback | ⚠️ **LIKELY SEED** |
| Threads | `mandate_comments` → SEED fallback | ⚠️ **LIKELY SEED** |
| Documents | `documents` table → SEED fallback | ⚠️ **LIKELY SEED** |
| Seed data quality | Hardcoded in service | ❌ **"DEX AI" brand violation** |

### Go-live readiness: 3/10 — Most users will see seed data

---

## 7. OVERALL: 5/10

---

# AUDIT #17: Client Onboarding (`/client/onboarding`)

**File:** `src/pages/client/ClientOnboardingPage.tsx` (277 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Onboarding checklist | ⚠️ Mostly static | 5 hardcoded steps; only step s3 is dynamic (checks mandate access) |
| Progress bar | ⚠️ Mostly static | Based on hardcoded completed flags |
| Quick Start items | ❌ **100% static** | 3 items with buttons that do nothing |
| Resources | ❌ **100% static** | 4 items (Guide/Video/FAQ) that are just `<button>` elements with no action |
| Help section | ❌ **100% static** | Live Chat / Account Manager / Knowledge Base — all decorative |
| Welcome banner | ❌ **"DEX AI" brand** | `Welcome to DEX AI` — deprecated brand name |
| Onboarding status API | ✅ Real | `getClientOnboardingStatus()` updates step s3 |

### What's missing or broken:
- ❌ **"Welcome to DEX AI"** — Must be changed to "LYC Intelligence" or "Client Portal"
- ❌ **Quick Start buttons do nothing** — "Get Started", "Browse Candidates", "Schedule Now" have no onClick
- ❌ **Resource links do nothing** — All 4 resources are `<button>` elements with no navigation
- ❌ **Help section is decorative** — Live Chat, Account Manager, Knowledge Base have no links or actions
- ❌ **Steps s1, s2, s4, s5 are hardcoded** — Profile Setup and Team Invitation are always "completed"; Document Upload and Integration Setup are always "incomplete"
- ❌ **"Start" buttons on incomplete steps do nothing** — No onClick handlers
- ❌ **No actual onboarding flow** — Steps don't lead to any setup wizard or form

### Go-live readiness: 2/10

---

## 2. DESIGN

### What works:
- ✅ Clean checklist design with numbered steps
- ✅ Progress bar with percentage
- ✅ Category badges on resources (Guide/Video/FAQ)
- ✅ Help section with 3-column icon layout
- ✅ Responsive layout

### Design issues:
- ⚠️ **Completed steps show green check but incomplete steps show numbers** — Visual inconsistency
- ⚠️ **Welcome banner uses Sparkles icon** — Feels generic, not premium

### Go-live readiness: 5/10

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Every button is dead** — Quick Start, Resources, Help, Start buttons — all non-functional
- ❌ **"DEX AI" brand destroys credibility** — Enterprise clients see wrong company name
- ❌ **No actual onboarding value** — The page describes what users should do but provides no tools to do it
- ❌ **Steps can't be completed through the UI** — Even if a user wants to complete "Document Upload", there's no upload interface

### Go-live readiness: 2/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| "Start" buttons (steps) | ❌ No handler | Dead |
| Quick Start actions | ❌ No handler | Dead |
| Resource items | ❌ No handler | Dead `<button>` elements |
| Help section items | ❌ Decorative | No links, no chat widget |

### Go-live readiness: 1/10 — Almost nothing works

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Progress bar transition
- ⚠️ **No skeleton loading**
- ⚠️ **No step completion animation**

### Go-live readiness: 3/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Steps s1, s2 | Hardcoded `completed: true` | ❌ **FAKE** |
| Steps s3 | API check (mandate access) | ✅ Real |
| Steps s4, s5 | Hardcoded `completed: false` | ❌ **FAKE** |
| Quick Start | `STATIC_QUICKSTART` | ❌ **100% STATIC** |
| Resources | `STATIC_RESOURCES` | ❌ **100% STATIC** |
| Help section | Static HTML | ❌ **100% STATIC** |
| "DEX AI" brand | Hardcoded string | ❌ **WRONG BRAND** |

### Go-live readiness: 2/10

---

## 7. OVERALL: 3/10 — Brand violation + all buttons dead

---

# AUDIT #18: Talent Intelligence (`/client/talent-intel`)

**File:** `src/pages/client/ClientTalentIntelPage.tsx` (239 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Market Trends | ✅ Real | `getTalentIntel(clientAccount.id)` → `trends[]` |
| Skill Demand Trends | ✅ Real | `data.skills[]` with demand % and trend direction |
| Target Talent Pools | ✅ Real | `data.pools[]` with title, location, count |
| Intelligence Summary | ✅ Real | Composed from trends/skills/pools data |
| Sync timestamp | ✅ Real | `data.syncedAt` displayed |
| Loading skeleton | ✅ | 4-card pulse animation |
| Empty state | ✅ | Clear message when no data |

### What's missing or broken:
- ⚠️ **No refresh button** — Can't manually trigger data refresh
- ⚠️ **No date range selector** — Trends are whatever the backend computes
- ⚠️ **No export** — Can't download intelligence report
- ⚠️ **No drill-down** — Can't click on a skill trend to see details
- ⚠️ **Market trends use hardcoded IDs** — `data.trends.find(t => t.id === 't1')` assumes specific IDs exist
- ❌ **No configurable sectors/regions** — Intelligence isn't tailored to client's industry

### Go-live readiness: 6/10 — Good page, limited by backend data

---

## 2. DESIGN

### What works:
- ✅ 4-column trend cards with direction indicators (up/down arrows)
- ✅ Skill demand with progress bars
- ✅ Talent pool cards with globe icon + location
- ✅ Intelligence Summary with 3-column layout (Market/Skills/Competitive)
- ✅ Sync timestamp at bottom
- ✅ Loading skeleton is well-implemented
- ✅ Proper use of design tokens

### Design issues:
- ⚠️ **Trend cards show only 2 states** — Up or down arrow, no "stable" or "neutral" state
- ⚠️ **Intelligence Summary duplicates data** — Same numbers shown in trend cards and summary section

### Go-live readiness: 7/10

---

## 3. USER EXPERIENCE

### UX strengths:
- ✅ **Clear data hierarchy** — Trends → Skills → Pools → Summary
- ✅ **Empty state explains why** — "Once your database has contacts, mandates, and pipeline data"
- ✅ **Sync timestamp builds trust** — Users know when data was last updated

### UX issues:
- ⚠️ **No context for numbers** — What does "4.2%" change mean? Is it good or bad?
- ⚠️ **No comparison period** — Can't compare this month vs last month
- ⚠️ **No industry filter** — All clients see same market trends

### Go-live readiness: 6/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Status |
|---------|-----------|--------|
| Trend cards | ❌ No interaction | Display only |
| Skill items | ❌ No drill-down | Display only |
| Pool items | ❌ No link | Display only |

### Go-live readiness: 4/10 — All display, no interaction

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Skeleton loading (animate-pulse)
- ✅ Progress bar transitions
- ⚠️ **No entrance animations**

### Go-live readiness: 5/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Market trends | `getTalentIntel()` | ✅ Real (depends on backend aggregate) |
| Skill demand | `getTalentIntel()` | ✅ Real |
| Talent pools | `getTalentIntel()` | ✅ Real |
| Sync time | `data.syncedAt` | ✅ Real |

### Go-live readiness: 7/10 — All real data

---

## 7. OVERALL: 6/10 — Solid page, limited interaction

---

# AUDIT #19: Pipeline Analytics (`/client/pipeline-analytics`)

**File:** `src/pages/client/ClientPipelineAnalyticsPage.tsx` (159 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Pipeline Funnel | ❌ **100% HARDCODED** | `STAGES` constant: 6 stages with fake counts |
| Monthly Trends | ❌ **100% HARDCODED** | `TRENDS` constant: 5 months of fake data |
| Key metrics (4 cards) | ❌ **100% HARDCODED** | "48" candidates, "4.2%" placement rate, "68d" time-to-place, "+25%" MoM growth |
| Bar chart | ❌ **100% HARDCODED** | CSS-only bars from TRENDS constant |
| Conversion rate | ❌ **HARDCODED** | `(2 / 48) * 100` = 4.2% |

### What's missing or broken:
- ❌ **ZERO API calls** — This page makes no network requests whatsoever
- ❌ **All numbers are fabricated** — Every metric on the page is a hardcoded constant
- ❌ **No data freshness indicator** — No way to know when data was "updated"
- ❌ **No interactivity** — Can't filter by date range, mandate, or stage
- ❌ **No export** — Can't download analytics
- ❌ **No drill-down** — Can't click on a funnel stage to see candidates
- ❌ **"+25% MoM Growth" is meaningless** — Based on fake data

### Go-live readiness: 1/10 — This page is a complete fabrication

---

## 2. DESIGN

### What works:
- ✅ Funnel visualization with decreasing bars
- ✅ Bar chart with hover tooltips (CSS group/opacity trick)
- ✅ 4-metric card grid
- ✅ Proper use of color coding per stage

### Design issues:
- ⚠️ **Bar chart is CSS-only** — No proper charting library. Bars are `div` heights calculated from max value
- ⚠️ **No axis labels on bar chart** — Y-axis has no scale
- ⚠️ **Tooltip shows only candidate count** — No mandate count in tooltip

### Go-live readiness: 5/10 — Design is fine, data is fake

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Page claims "Real-time funnel metrics"** — subtitle says "Real-time" but nothing is real-time
- ❌ **No empty state** — Since data is hardcoded, there's no empty state for new clients
- ❌ **No onboarding for analytics** — No explanation of what the metrics mean
- ⚠️ **No date range selector** — Fixed 5-month window

### Go-live readiness: 1/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Status |
|---------|-----------|--------|
| Funnel stages | ❌ No interaction | Display only |
| Bar chart bars | ⚠️ Hover tooltip only | Shows count on hover |
| Filter/sort | ❌ None exist | No controls |

### Go-live readiness: 2/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Bar hover effect (opacity change)
- ✅ Tooltip opacity transition
- ⚠️ **No entrance animations**
- ⚠️ **No loading state** — Data is instant (hardcoded)

### Go-live readiness: 3/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| STAGES constant | Hardcoded in file | ❌ **100% FAKE** |
| TRENDS constant | Hardcoded in file | ❌ **100% FAKE** |
| Total Candidates "48" | Hardcoded | ❌ **FAKE** |
| Placement Rate "4.2%" | `2/48*100` | ❌ **FAKE** |
| Avg Time "68d" | Hardcoded | ❌ **FAKE** |
| MoM Growth "+25%" | Hardcoded | ❌ **FAKE** |

### Go-live readiness: 1/10 — Every number is fabricated

---

## 7. OVERALL: 2/10 — Worst page in the portal. Must be rebuilt with real API.

---

# AUDIT #20: Admin & Security (`/client/admin`)

**File:** `src/pages/client/ClientAdminPage.tsx` (378 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| Team Members list | ✅ Real | `getClientTeamMembers(organization)` |
| Team member search | ✅ Working | Client-side text filter |
| Security Settings toggles | ⚠️ Partial | Reads from `org_settings` table, falls back to defaults |
| Toggle persistence | ✅ Real | `upsert` to `org_settings` table |
| Invite Member button | ❌ **DEAD** | No onClick handler |
| Edit member | ⚠️ **UI only** | Toggles edit mode (Check/X icons) but doesn't actually save changes |
| Delete member | ❌ **DEAD** | Trash icon button with no onClick |
| Active Sessions | ❌ **HARDCODED** | Always shows "24" |
| Access Management | ❌ **100% DEAD** | API Keys / Audit Logs / System Preferences — all buttons have no handlers |

### What's missing or broken:
- ❌ **"Invite Member" does nothing** — Critical admin function is non-functional
- ❌ **"Delete member" does nothing** — Trash button has no onClick
- ❌ **"Edit member" is cosmetic** — Switches to check/X icons but no actual edit form or API call
- ❌ **Active Sessions = 24 always** — Hardcoded number
- ❌ **API Keys "View Keys" — dead** — No navigation or modal
- ❌ **Audit Logs "View Logs" — dead** — No navigation or viewer
- ❌ **System Preferences "Configure" — dead** — No navigation or form
- ⚠️ **`lastLogin` is always '—'** — Not fetched from any API
- ⚠️ **No role change functionality** — Can see roles but can't change them
- ⚠️ **Security settings use JSON column** — `security_settings` stored as JSON in Supabase, not normalized

### Go-live readiness: 4/10

---

## 2. DESIGN

### What works:
- ✅ 3-column summary metrics
- ✅ Team member list with avatar placeholders, role badges, status colors
- ✅ Security settings with toggle switches (proper aria-pressed)
- ✅ Access Management with 3-column card layout
- ✅ Loading skeleton for security settings
- ✅ Saving indicator (Loader2 spinner on toggle)

### Design issues:
- ⚠️ **Edit mode is confusing** — Check/X icons appear but no editable fields are shown
- ⚠️ **No confirmation dialog for delete** — Even though delete doesn't work, the button is there waiting to cause problems

### Go-live readiness: 6/10

---

## 3. USER EXPERIENCE

### UX issues:
- ❌ **Multiple dead buttons create distrust** — Invite, Delete, API Keys, Audit Logs, System Preferences — all non-functional
- ❌ **Edit mode is misleading** — Users think they can edit but they can't
- ❌ **Hardcoded "24 Active Sessions"** — If no one is logged in, showing 24 is misleading
- ⚠️ **No invite flow** — Even a simple email input + send would be better than nothing

### Go-live readiness: 3/10

---

## 4. BUTTONS & CLICKABILITY

| Element | Clickable? | Issue |
|---------|-----------|-------|
| "Invite Member" | ❌ No handler | Dead |
| Edit icon | ⚠️ Toggles UI only | No actual edit |
| Delete icon | ❌ No handler | Dead |
| Check/X (edit mode) | ⚠️ Only X works (cancels edit mode) | Check does nothing |
| Security toggles | ✅ | Saves to org_settings |
| "View Keys" | ❌ No handler | Dead |
| "View Logs" | ❌ No handler | Dead |
| "Configure" | ❌ No handler | Dead |
| Search input | ✅ | Filters team members |

### Go-live readiness: 3/10

---

## 5. ANIMATIONS & TRANSITIONS

- ✅ Toggle switch transition (left/right)
- ✅ Loading spinner on save
- ✅ Skeleton loading for settings
- ⚠️ **No entrance animations**

### Go-live readiness: 5/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Team members | `getClientTeamMembers()` | ✅ Real |
| Security settings | `org_settings` table → defaults | ⚠️ **Mostly defaults** |
| **Active Sessions** | Hardcoded `24` | ❌ **FAKE** |
| **lastLogin** | Hardcoded `'—'` | ❌ **MISSING** |
| Role labels | Mapped from DB role | ✅ Real |

### Go-live readiness: 4/10

---

## 7. OVERALL: 5/10

---

# AUDIT #21: Nexus Assistant (`/client/nexus-assistant`)

**File:** `src/pages/client/ClientNexusAssistantPage.tsx` (24 lines)
**Component:** `src/components/nexus/NexusChat.tsx` (810 lines)

## 1. FUNCTIONALITY

### What exists:
| Element | Status | Notes |
|---------|--------|-------|
| NexusChat component | ✅ Real | Full chat interface with DeepSeek API |
| Initial prompts | ✅ Customized | 4 B2B-specific prompts (mandates, shortlist, benchmarks, pipeline) |
| Credit system | ✅ Real | `getCreditBalance`, `checkAndGrantDailyCredits` |
| CreditGate | ✅ Real | Gates usage behind subscription |
| Session management | ✅ Real | Multiple chat sessions with sidebar |
| CareerInsight | ✅ Real | Insight cards from conversation |
| CouncilUpsell | ✅ Real | Upsell to coaching |
| Diagnostic progress | ✅ Real | Progress bar for assessments |
| Milestone banner | ✅ Real | Achievement milestones |

### What's missing or broken:
- ⚠️ **Thin wrapper** — Only 24 lines, just passes `initialPrompts` to NexusChat
- ⚠️ **No B2B-specific context** — NexusChat doesn't know which mandates the client has, can't reference specific candidates
- ⚠️ **No mandate-aware suggestions** — Initial prompts are generic B2B queries
- ❌ **No conversation history persistence** — Chat sessions are in-memory only (lost on refresh)

### Go-live readiness: 7/10 — NexusChat itself is solid, wrapper is minimal

---

## 2. DESIGN

### What works:
- ✅ Full NexusChat design (see B2C Nexus audit for details)
- ✅ B2B-specific initial prompts contextualize the experience
- ✅ Consistent with overall portal design

### Design issues:
- ⚠️ **No client-specific branding** — Could show client org name/logo in header
- ⚠️ **No B2B-specific UI elements** — Same chat interface as B2C

### Go-live readiness: 7/10

---

## 3. USER EXPERIENCE

### UX strengths:
- ✅ **B2B prompts are relevant** — "Show me active mandates", "Generate shortlist", "salary benchmark", "pipeline conversion"
- ✅ **Full chat functionality** — Message history, session management, credit system
- ✅ **Proactive questioning** — Nexus asks follow-up questions

### UX issues:
- ⚠️ **No context about client's data** — Nexus doesn't know what mandates exist
- ⚠️ **No deep links from chat to pages** — Can't click a mandate name in chat to go to mandate detail

### Go-live readiness: 7/10

---

## 4. BUTTONS & CLICKABILITY

All inherited from NexusChat component — fully functional (see B2C Nexus audit).

### Go-live readiness: 8/10

---

## 5. ANIMATIONS & TRANSITIONS

Inherited from NexusChat — typing indicator, message fade-in, etc.

### Go-live readiness: 7/10

---

## 6. STATIC VS MOCK VS REAL DATA

| Element | Source | Verdict |
|---------|--------|---------|
| Chat AI | DeepSeek API | ✅ Real |
| Credits | `creditService` | ✅ Real |
| Sessions | In-memory state | ⚠️ **NOT PERSISTED** |
| Initial prompts | Hardcoded | ⚠️ Static but appropriate |

### Go-live readiness: 6/10 — Sessions not persisted

---

## 7. OVERALL: 7/10 — Best page in portal, limited by thin wrapper

---

## CLIENT PORTAL MASTER SUMMARY

### Overall Score by Page

| # | Page | Score | Data Reality | Key Blocker |
|---|------|-------|-------------|-------------|
| 10 | B2B Landing | 4/10 | Static | No lead form, no product preview |
| 11 | Overview | 5/10 | Mostly real | "Placed" hardcoded, "View all" dead |
| 12 | Mandates | 5/10 | Real + 1 bug | Cards not clickable, wrong seniority field |
| 13 | Mandate Detail | **7/10** | Real API | Best page, minor gaps |
| 14 | Candidates | 4/10 | Real + fake | Status always "New", tiers arbitrary |
| 15 | Documents | 4/10 | Real | Download/refresh dead, size missing |
| 16 | Collaboration | 5/10 | Seed fallback | Read-only, "DEX AI" in seed data |
| 17 | Onboarding | 3/10 | Mostly static | "DEX AI" brand, ALL buttons dead |
| 18 | Talent Intel | 6/10 | Real | No interactivity, no drill-down |
| 19 | Pipeline Analytics | **2/10** | **100% fake** | Every number hardcoded |
| 20 | Admin | 5/10 | Partial real | Invite/delete/edit dead, sessions fake |
| 21 | Nexus Assistant | **7/10** | Real | Thin wrapper, sessions not persisted |

### Portal-wide Issues

#### 🔴 Critical (Must fix before go-live)

1. **"DEX AI" brand references** — Found in OnboardingPage ("Welcome to DEX AI") and collaborationService seed data (author "DEX AI"). Must be replaced with "LYC Intelligence"
2. **Pipeline Analytics is 100% fabricated** — Every number is a hardcoded constant. Must be rebuilt with real API calls
3. **Dead buttons across portal** — "View all", "Download", "Refresh", "Invite Member", "Delete", "API Keys", "Audit Logs", "Configure" — at least 12 non-functional buttons
4. **Mandate cards not clickable** — Both Overview and Mandates pages show mandate lists that can't be clicked to navigate to detail

#### 🟡 High Priority

5. **Candidates page status always "New"** — `status: 'New' as const` makes the status column useless
6. **Mandates page seniority field bug** — `m.client_first_name` mapped to `seniority` — wrong data field
7. **No credit balance display** — Spec v2.0 requires credit visibility; no page shows it
8. **Onboarding page is non-functional** — All Quick Start, Resources, and Help buttons are dead
9. **No document download** — Documents page shows files but can't download them
10. **Collaboration page shows seed data** — Most users will see fake projects/discussions/documents

#### 🟢 Medium Priority

11. **Hardcoded colors in MandateDetail** — Uses hex values instead of design tokens
12. **No skeleton loading on most pages** — Only Collaboration and TalentIntel have proper skeleton loading
13. **Progress calculation is arbitrary** — `candidate_count / 10 * 100` doesn't reflect real progress
14. **Candidate tier thresholds are arbitrary** — S/A/B/C boundaries not tied to spec
15. **Chat sessions not persisted** — Lost on page refresh

### Spec v2.0 vs Code: Gap Summary

| Spec Requirement | Code Status | Gap |
|-----------------|-------------|-----|
| Credit balance display | ❌ Not shown anywhere | MISSING |
| Subscription tier visibility | ❌ Not shown | MISSING |
| Score Match branding (no TRIDENT) | ⚠️ Partial | `trident_composite` still referenced in code |
| Client-specific talent intel | ⚠️ Partial | API accepts org ID but no sector filter |
| Assessment reports in Documents | ❌ Not implemented | Only shows Invoice/Contract/Proposal types |
| NEXUS chat context-aware | ❌ Not implemented | Chat has no client data context |
| Multi-user collaboration | ⚠️ Partial | Team members listed but no real-time collaboration |
| Mandate workflow stages | ⚠️ Partial | Stages exist but no client-initiated transitions |
| Candidate feedback loop | ✅ Implemented | Only working end-to-end flow |
| Interview scheduling | ⚠️ Partial | View only, no scheduling capability |

### Priority Fix Order

1. **Replace all "DEX AI" references** — 30 min fix, brand-critical
2. **Wire mandate card clicks to detail page** — 1 hour, fixes major UX gap
3. **Remove/rebuild Pipeline Analytics** — 4-8 hours, needs real API
4. **Fix dead buttons** (View all, Download, Refresh, Invite) — 2-4 hours
5. **Fix Candidates status + seniority field bug** — 1 hour
6. **Add credit balance display to AppShell** — 2 hours
7. **Rebuild Onboarding with real flow** — 4-8 hours
8. **Implement document download** — 2-4 hours

---

*Audit completed 2026-07-21. Source: GitHub `kevinhongfr-star/lyc-intelligence` main branch.*
