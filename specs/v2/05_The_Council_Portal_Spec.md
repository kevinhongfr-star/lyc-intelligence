# 05 — The Council Portal Spec v2.0
## LYC Intelligence Platform — Membership Community + DEX AI B2C

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** The Council Portal (membership community layer) + DEX AI B2C integration  
**Dependencies:** 02 (Supabase), 08 (Commerce Layer)  
**Scope Note:** The Council is a community layer across all three pillars (WAVE→DEX AI→VISTA), not a standalone product. DEX AI B2C is integrated here — no separate portal.

---

## 1. Portal Overview

### 1.1 What Is The Council?

The Council is LYC Intelligence's **membership community layer**. It sits across the three-pillar architecture:

```
WAVE (Growth & Presence) → DEX AI (Intelligence) → VISTA (Client Success)
                        ↕              ↕                   ↕
                    ┌─────────────────────────────────────┐
                    │          THE COUNCIL                 │
                    │   (Community & Membership Layer)     │
                    └─────────────────────────────────────┘
```

It is NOT a standalone portal in the same sense as Client or Candidate. It is the **relationship layer** — the "you've been invited to join" experience.

### 1.2 Dual Function

The Council Portal serves two integrated functions:

1. **Council Membership** — Coaching, events, community, network
2. **DEX AI B2C** — AI-powered executive advisory (Executive Introduction funnel)

These share the same portal but have distinct user journeys.

### 1.3 User Types

| User Type | Access | Description |
|-----------|--------|-------------|
| **Visitor** | Landing page only | Not logged in. Sees value proposition |
| **DEX AI User (Intro)** | DEX AI chat only | Used 0-5 Executive Introduction messages |
| **DEX AI Paid** | DEX AI chat + Credit Store | Purchased credits or subscription |
| **Council Applicant** | Application form | Applying for membership |
| **Council Member** | Full Council access | Active paying member |
| **Council Admin** | Full + management | Manages Council operations |

### 1.4 Brand Language Rules (CRITICAL)

| ❌ NEVER | ✅ INSTEAD |
|---------|-----------|
| "Free tier" | "Executive Introduction" |
| "Sign up free" | "Access your Executive Introduction" |
| "Free trial" | "Founding member rate" |
| "Free" (anywhere) | "Complimentary" or "Executive Introduction" |

---

## 2. Page Map

### 2.1 Public Pages (No Auth)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| P1 | Council Landing | `/council` | Value proposition + CTA |
| P2 | Membership Tiers | `/council/membership` | Tier comparison + purchase |
| P3 | Events Calendar | `/council/events` | Upcoming events listing |

### 2.2 DEX AI Pages (Auth Required)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| D1 | DEX AI Chat | `/dex/chat` | AI advisory conversation |
| D2 | Credit Store | `/dex/credits` | Buy credits / subscribe |
| D3 | Chat History | `/dex/history` | Past conversations |
| D4 | Account/Billing | `/dex/account` | Subscription management |

### 2.3 Council Member Pages (Auth + Membership)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| C1 | Member Dashboard | `/council/dashboard` | Overview: credits, events, coaching |
| C2 | My Coaching | `/council/coaching` | Book/manage coaching sessions |
| C3 | Event Detail | `/council/events/:id` | Event page + registration |
| C4 | Community Feed | `/council/community` | Member discussions |
| C5 | Member Directory | `/council/directory` | Browse members (opt-in) |
| C6 | My Profile | `/council/profile` | Edit profile, preferences |
| C7 | Benefits Hub | `/council/benefits` | All membership benefits |

### 2.4 Admin Pages

| # | Page | Route | Purpose |
|---|------|-------|---------|
| A1 | Council Admin | `/admin/council` | Member management |
| A2 | Event Management | `/admin/council/events` | Create/manage events |
| A3 | Coaching Management | `/admin/council/coaching` | Consultant assignment |
| A4 | Applications | `/admin/council/applications` | Review membership apps |

**Total: ~17 pages across 4 sections**

---

## 3. Page Specifications

### 3.1 P1: Council Landing Page

**Route:** `/council`  
**Access:** Public (no auth)

**Purpose:** Convert visitors → DEX AI Executive Introduction or Council membership

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO SECTION                                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  The Council                                           │  │
│  │  Where senior professionals sharpen their edge.       │  │
│  │                                                        │  │
│  │  Executive coaching. Exclusive events. AI-powered      │  │
│  │  career intelligence. A community of peers who get it. │  │
│  │                                                        │  │
│  │  [Start with DEX AI]     [Explore Membership]         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WHAT YOU GET                                          │  │
│  │                                                        │  │
│  │  🤖 AI Executive Advisory    📅 Exclusive Events       │  │
│  │  DEX AI answers your career   Workshops, roundtables,  │  │
│  │  questions in minutes.        networking dinners.       │  │
│  │                                                        │  │
│  │  👤 1-on-1 Coaching          🌐 Peer Network           │  │
│  │  Senior LYC coaches,          Connect with C-suite     │  │
│  │  on-demand booking.           professionals.            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TESTIMONIALS                                          │  │
│  │  [Member testimonial carousel]                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  READY TO JOIN?                                        │  │
│  │  [Start Executive Introduction]  [View Membership]     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-P1-001`: Hero section with dual CTA
- `TC-P1-002`: Benefits grid (4 cards)
- `TC-P1-003`: Testimonial carousel
- `TC-P1-004`: Social proof counters (members, events, sessions)
- `TC-P1-005`: Bottom CTA section
- `TC-P1-006`: Responsive mobile layout
- `TC-P1-007`: SEO metadata + OG tags
- `TC-P1-008`: Analytics tracking (GA4 events)

---

### 3.2 P2: Membership Tiers Page

**Route:** `/council/membership`  
**Access:** Public (purchase flow requires auth)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Membership Tiers                                            │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Individual │ │Corporate │ │PE Partner│ │ 🔥 Founding   │  │
│  │           │ │          │ │          │ │ (20 spots)    │  │
│  │ ¥3,800/yr│ │¥12,000/yr│ │¥25,000/yr│ │ ¥2,800/yr    │  │
│  │           │ │          │ │          │ │               │  │
│  │ 12 credits│ │48 credits│ │100 cred  │ │ 12 credits   │  │
│  │ 12 sessions│ │48 sessions│ │100 sess │ │ 12 sessions  │  │
│  │ All events│ │All events│ │All events│ │ All events    │  │
│  │ Directory │ │Directory │ │Deal flow │ │ + Legacy badge│  │
│  │           │ │+ Seats: 5│ │+ Priority│ │ + Priority    │  │
│  │           │ │          │ │ coaching │ │               │  │
│  │ [SELECT]  │ │ [SELECT] │ │ [SELECT] │ │ [JOIN NOW]   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                              │
│  All tiers include:                                          │
│  ✓ DEX AI access          ✓ Member directory               │
│  ✓ Community feed          ✓ Event priority booking         │
│  ✓ Monthly newsletter      ✓ Annual review                  │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-P2-001`: Tier comparison table (4 columns)
- `TC-P2-002`: Founding member counter (X/20 remaining)
- `TC-P2-003`: Feature comparison matrix
- `TC-P2-004`: Annual prepay Stripe Checkout integration
- `TC-P2-005`: FAQ section (accordion)
- `TC-P2-006`: Corporate seat configuration
- `TC-P2-007`: "Contact us" for custom enterprise tiers
- `TC-P2-008`: Login/signup prompt before checkout

---

### 3.3 D1: DEX AI Chat Page

**Route:** `/dex/chat`  
**Access:** Authenticated users

**Purpose:** B2C AI advisory — the core product experience

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  DEX AI                              [Credits: 5/5] [⚙]    │
│                                                              │
│  ┌──────────┐                                               │
│  │ Sidebar   │  ┌───────────────────────────────────────┐  │
│  │           │  │                                       │  │
│  │ + New Chat│  │  Welcome to DEX AI                    │  │
│  │           │  │  Your executive advisory assistant.   │  │
│  │ Recent:   │  │                                       │  │
│  │ • Career  │  │  Ask me anything about:               │  │
│  │   move    │  │  • Career strategy & transitions      │  │
│  │ • Salary  │  │  • Compensation benchmarking          │  │
│  │   negot.  │  │  • Leadership development             │  │
│  │ • Market  │  │  • Market intelligence                │  │
│  │   trends  │  │  • Industry analysis                  │  │
│  │           │  │                                       │  │
│  │           │  │  ┌─────────────────────────────────┐  │  │
│  │           │  │  │ Type your question...     [Send]│  │  │
│  │           │  │  └─────────────────────────────────┘  │  │
│  │           │  └───────────────────────────────────────┘  │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

**Progressive Gating Flow:**
```
Messages 1-5: Executive Introduction (complimentary)
  → Full AI capability shown
  → No payment required
  → Builds trust

Message 6: Soft gate
  → "You've explored your Executive Introduction.
     Continue with credits or subscribe."
  → Shows Credit Store link
  → Does NOT block — redirects to purchase

Message 6+ (no credits): Hard gate
  → Must purchase or subscribe
  → Shows balance + purchase options
  → Council member cross-sell
```

**Tickets:**
- `TC-D1-001`: Chat interface (message list + input)
- `TC-D1-002`: Session sidebar (new/recent/history)
- `TC-D1-003`: AI response streaming (SSE)
- `TC-D1-004`: DeepSeek API integration (flash/pro routing)
- `TC-D1-005`: Executive Introduction counter (5 messages)
- `TC-D1-006`: Soft gate UI (message 6 prompt)
- `TC-D1-007`: Hard gate enforcement
- `TC-D1-008`: Credit balance display (real-time)
- `TC-D1-009`: Suggested prompts (contextual)
- `TC-D1-010`: Chat export (PDF/clipboard)
- `TC-D1-011`: Conversation memory/context (dex_chat_context)
- `TC-D1-012`: Council member cross-sell banner
- `TC-D1-013`: Mobile responsive layout

---

### 3.4 D2: Credit Store Page

**Route:** `/dex/credits`  
**Access:** Authenticated DEX AI users  
**Note:** See 08_Commerce_Layer_Spec.md COM-001 for full details

**Tickets:**
- `TC-D2-001`: Credit store page (delegates to Commerce Layer)
- `TC-D2-002`: Balance display + transaction history
- `TC-D2-003`: Subscription management

---

### 3.5 C1: Member Dashboard

**Route:** `/council/dashboard`  
**Access:** Active Council members

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, [Name]                    Council Credits: 10 │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ NEXT COACHING       │ │ UPCOMING EVENTS      │           │
│  │ Jul 18, 14:00       │ │ Jul 20: AI Workshop  │           │
│  │ Coach: Sarah Chen   │ │ Jul 25: Roundtable   │           │
│  │ [Join] [Reschedule] │ │ [Register] [Details] │           │
│  └─────────────────────┘ └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │ DEX AI              │ │ COMMUNITY            │           │
│  │ Recent: Career piv. │ │ 3 new discussions    │           │
│  │ [Continue chat]     │ │ [View feed]          │           │
│  └─────────────────────┘ └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MEMBERSHIP STATUS                                    │   │
│  │ Tier: Individual  │  Expires: 2027-07-13            │   │
│  │ Credits: 10/12    │  Sessions: 4/12 used            │   │
│  │ [Upgrade] [Manage]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-C1-001`: Dashboard overview layout
- `TC-C1-002`: Next coaching session widget
- `TC-C1-003`: Upcoming events widget
- `TC-C1-004`: DEX AI quick access widget
- `TC-C1-005`: Community activity widget
- `TC-C1-006`: Membership status bar
- `TC-C1-007`: Credit usage indicator
- `TC-C1-008`: Quick actions (book coaching, register event)

---

### 3.6 C2: My Coaching Page

**Route:** `/council/coaching`  
**Access:** Active Council members

**Features:**
- View available coaches
- Book sessions (uses 1 Council Credit per session)
- Manage upcoming sessions (reschedule/cancel)
- View past sessions + notes
- Rate completed sessions

**Tickets:**
- `TC-C2-001`: Coach directory (available coaches)
- `TC-C2-002`: Session booking flow (calendar picker)
- `TC-C2-003`: Credit deduction on booking
- `TC-C2-004`: Upcoming sessions list
- `TC-C2-005`: Reschedule/cancel flow
- `TC-C2-006`: Past sessions history
- `TC-C2-007`: Session rating + feedback form
- `TC-C2-008`: Video meeting link generation
- `TC-C2-009`: Calendar integration (Google/Apple)
- `TC-C2-010`: Email reminders (48h, 24h, 1h before)

---

### 3.7 C3: Event Detail Page

**Route:** `/council/events/:id`  
**Access:** Public (registration may require membership)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Cover Image]                                               │
│                                                              │
│  AI Strategy Workshop: From Hype to Execution               │
│  Jul 20, 2026 │ 14:00-17:00 │ Virtual + In-person (SH)     │
│                                                              │
│  Speaker: Dr. Wei Zhang, ex-McKinsey Digital Lead           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ About this event                                     │   │
│  │ Deep dive into practical AI strategy for executives  │   │
│  │ - Framework for AI readiness assessment              │   │
│  │ - Case studies from Chinese enterprises              │   │
│  │ - Interactive Q&A                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Register — Free for Members]  [Register — ¥299]           │
│  42/60 spots filled                                         │
└─────────────────────────────────────────────────────────────┘
```

**Tickets:**
- `TC-C3-001`: Event detail page layout
- `TC-C3-002`: Registration flow (member vs non-member pricing)
- `TC-C3-003`: Capacity counter
- `TC-C3-004`: Calendar add (ICS download)
- `TC-C3-005`: Event materials download (post-event)
- `TC-C3-006`: Recording access (post-event, members only)
- `TC-C3-007`: Feedback form (post-event)
- `TC-C3-008`: Waitlist management (when full)

---

### 3.8 C4: Community Feed

**Route:** `/council/community`  
**Access:** Active Council members

**Features:**
- Discussion threads (topics, questions, announcements)
- Like/reply interactions
- Category filtering
- Member mentions (@name)
- Pinned posts from admins

**Tickets:**
- `TC-C4-001`: Feed layout (infinite scroll)
- `TC-C4-002`: Create post/discussion
- `TC-C4-003`: Reply/thread system
- `TC-C4-004`: Like/bookmark functionality
- `TC-C4-005`: Category filtering
- `TC-C4-006`: Member mention (@name)
- `TC-C4-007`: Pinned/announcement posts
- `TC-C4-008`: Report inappropriate content

---

### 3.9 C5: Member Directory

**Route:** `/council/directory`  
**Access:** Active Council members (opt-in visibility)

**Features:**
- Browse members by industry, expertise, location
- Search by name, company, title
- View member profiles (public info only)
- Connection request / message

**Tickets:**
- `TC-C5-001`: Directory grid/list view
- `TC-C5-002`: Filter by industry/expertise/location
- `TC-C5-003`: Search functionality
- `TC-C5-004`: Member profile card
- `TC-C5-005`: Connection request flow
- `TC-C5-006`: Direct message (optional)
- `TC-C5-007`: Privacy controls (opt-in/out of directory)

---

### 3.10 C6: My Profile

**Route:** `/council/profile`  
**Access:** Active Council members

**Tickets:**
- `TC-C6-001`: Profile edit form
- `TC-C6-002`: Avatar upload
- `TC-C6-003`: Expertise/interests tags
- `TC-C6-004`: Privacy settings
- `TC-C6-005`: Notification preferences
- `TC-C6-006`: Linked accounts (LinkedIn integration)

---

### 3.11 C7: Benefits Hub

**Route:** `/council/benefits`  
**Access:** Active Council members

**Purpose:** Show all membership benefits, drive engagement

**Tickets:**
- `TC-C7-001`: Benefits overview page
- `TC-C7-002`: Benefit utilization tracker
- `TC-C7-003`: "How to use your credits" guide
- `TC-C7-004`: Upgrade prompt (if underutilizing)

---

## 4. B2C User Journey (DEX AI → Council)

### 4.1 Journey Flow

```
                    ┌──────────┐
                    │ DISCOVER │ (WAVE content, referral, search)
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ INTRODUCE│ (5 Executive Introduction messages)
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │      ENGAGE?         │
              │  (After 5 messages)  │
              └──┬──────────────┬───┘
                 │              │
          ┌──────▼─────┐  ┌───▼────────┐
          │ PURCHASE   │  │  LEAVE     │
          │ Credits    │  │  (nurture  │
          │ or Subscribe│  │   via email│
          └──────┬─────┘  └────────────┘
                 │
          ┌──────▼─────┐
          │  GRADUATE   │ → Council Membership invitation
          │  to Council │   "You've proven the value.
          └──────┬─────┘    Join The Council."
                 │
          ┌──────▼─────┐
          │  COUNCIL    │ → Full membership experience
          │  MEMBER     │   Coaching, events, community
          └────────────┘
```

### 4.2 Graduation Gift

When a DEX AI user converts to Council membership:
- **Welcome bonus:** 2 extra Council Credits
- **Personalized onboarding:** Based on their DEX AI conversation history
- **Priority event access:** First pick at upcoming events
- **Legacy badge:** "Early adopter" if within first 100 converts

**Tickets:**
- `TC-BJ-001`: Executive Introduction completion tracking
- `TC-BJ-002`: Graduation trigger logic
- `TC-BJ-003`: Council invitation email/flow
- `TC-BJ-004`: Graduation gift credit delivery
- `TC-BJ-005`: Personalized onboarding (context from DEX AI)
- `TC-BJ-006`: Nurture email sequence (for non-converters)
- `TC-BJ-007`: Cross-sell banner (in DEX AI chat)

---

## 5. Council Admin Pages

### 5.1 A1: Council Admin Dashboard

**Route:** `/admin/council`  
**Access:** Council Admin role

**Features:**
- Member overview (total, active, expiring, churned)
- Revenue metrics (MRR, LTV, churn)
- Application review queue
- Member search & detail

**Tickets:**
- `TC-A1-001`: Admin dashboard layout
- `TC-A1-002`: Member list with filters
- `TC-A1-003`: Member detail view
- `TC-A1-004`: Member status management (activate/suspend/cancel)
- `TC-A1-005`: Application review & approval
- `TC-A1-006`: Revenue metrics display
- `TC-A1-007`: Bulk operations (export, notify)

### 5.2 A2: Event Management

**Route:** `/admin/council/events`

**Tickets:**
- `TC-A2-001`: Event creation form
- `TC-A2-002`: Event edit/delete
- `TC-A2-003`: Registration management
- `TC-A2-004`: Attendance tracking
- `TC-A2-005`: Post-event feedback review
- `TC-A2-006`: Event template creation

### 5.3 A3: Coaching Management

**Route:** `/admin/council/coaching`

**Tickets:**
- `TC-A3-001`: Coach assignment
- `TC-A3-002`: Session scheduling
- `TC-A3-003`: Session completion tracking
- `TC-A3-004`: Coach availability management
- `TC-A3-005`: Coaching quality metrics

### 5.4 A4: Applications

**Route:** `/admin/council/applications`

**Tickets:**
- `TC-A4-001`: Application list
- `TC-A4-002`: Application review workflow
- `TC-A4-003`: Approval/rejection with reason
- `TC-A4-004`: Waitlist management

---

## 6. Realtime & Notifications

### 6.1 Realtime Events

| Event | Channel | Subscribers |
|-------|---------|-------------|
| New coaching session request | `coaching:requests` | Available coaches |
| Coaching session reminder | `notifications:{user_id}` | Specific user |
| New community post | `council:community` | All members |
| Event registration | `events:{event_id}` | Event organizer |
| Credit balance change | `credits:{user_id}` | Specific user |
| Application status change | `notifications:{user_id}` | Specific user |

### 6.2 Notification Types

| Notification | Trigger | Channel |
|-------------|---------|---------|
| Coaching reminder | 24h before session | Email + Push + In-app |
| Event reminder | 24h + 1h before | Email + Push + In-app |
| Credit low | Balance < 2 | In-app |
| New community reply | Reply to user's post | Push + In-app |
| Application approved | Admin action | Email + In-app |
| Membership expiring | 60/30/7 days before | Email |
| DEX AI graduation gift | Convert to Council | Email + In-app |

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| TC-P1: Council Landing | 8 | `TC-P1-001` to `TC-P1-008` |
| TC-P2: Membership Tiers | 8 | `TC-P2-001` to `TC-P2-008` |
| TC-D1: DEX AI Chat | 13 | `TC-D1-001` to `TC-D1-013` |
| TC-D2: Credit Store | 3 | `TC-D2-001` to `TC-D2-003` |
| TC-C1: Member Dashboard | 8 | `TC-C1-001` to `TC-C1-008` |
| TC-C2: My Coaching | 10 | `TC-C2-001` to `TC-C2-010` |
| TC-C3: Event Detail | 8 | `TC-C3-001` to `TC-C3-008` |
| TC-C4: Community Feed | 8 | `TC-C4-001` to `TC-C4-008` |
| TC-C5: Member Directory | 7 | `TC-C5-001` to `TC-C5-007` |
| TC-C6: My Profile | 6 | `TC-C6-001` to `TC-C6-006` |
| TC-C7: Benefits Hub | 4 | `TC-C7-001` to `TC-C7-004` |
| TC-BJ: B2C User Journey | 7 | `TC-BJ-001` to `TC-BJ-007` |
| TC-A1: Council Admin | 7 | `TC-A1-001` to `TC-A1-007` |
| TC-A2: Event Management | 6 | `TC-A2-001` to `TC-A2-006` |
| TC-A3: Coaching Mgmt | 5 | `TC-A3-001` to `TC-A3-005` |
| TC-A4: Applications | 4 | `TC-A4-001` to `TC-A4-004` |
| **TOTAL** | **~112** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
