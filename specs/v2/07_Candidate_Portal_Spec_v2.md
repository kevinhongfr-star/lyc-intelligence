# 07 — Candidate Portal Spec v2.1
## LYC Intelligence Platform — Job Seeker Experience

**Version:** 2.1  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Candidate portal for mandate applicants + job seekers  
**Dependencies:** 02 (Supabase), 04 (Client Portal), 05 (Council)  
**Scope Note:** Candidate Portal serves mandate applicants. DEX AI referral is a post-graduation CTA only — not a primary feature.

---

## 1. Portal Overview

### 1.1 Purpose

The Candidate Portal is where job seekers interact with LYC Intelligence:
- Apply to mandates (open positions)
- Track application status
- Complete assessments (complimentary)
- Receive AI-powered career insights
- Get matched to relevant positions
- Graduate to The Council (post-placement)

### 1.2 User Types

| User Type | Access | Description |
|-----------|--------|-------------|
| **Visitor** | Public pages | Browse mandates, see value prop |
| **Applicant** | Application + tracking | Applied to a mandate |
| **Active Candidate** | Full portal | In pipeline (screening → placed) |
| **Alumni** | Limited + CTA | Placed/rejected, Council invitation |

### 1.3 Brand Language

| ❌ NEVER | ✅ INSTEAD |
|---------|-----------|
| "Free assessment" | "Complimentary assessment" |
| "Free profile review" | "Complimentary profile review" |
| "Sign up free" | "Create your candidate profile" |

---

## 2. Page Map

| # | Page | Route | Access |
|---|------|-------|--------|
| CP1 | Candidate Landing | `/candidates` | Public |
| CP2 | Browse Mandates | `/candidates/mandates` | Public |
| CP3 | Mandate Detail | `/candidates/mandates/:id` | Public |
| CP4 | Application Form | `/candidates/apply/:id` | Auth |
| CP5 | Candidate Dashboard | `/candidates/dashboard` | Auth (applicant) |
| CP6 | Application Tracker | `/candidates/applications` | Auth |
| CP7 | ASSESS (Complimentary) | `/candidates/assess` | Auth |
| CP8 | AI Career Insights | `/candidates/insights` | Auth |
| CP9 | Profile & Resume | `/candidates/profile` | Auth |

**Total: 9 pages**

---

## 3. Page Specifications

### 3.1 CP1: Candidate Landing

**Route:** `/candidates`  
**Access:** Public

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Land your next role with LYC Intelligence           │
│                                                      │
│  AI-powered matching. Senior consultant advocacy.    │
│  Transparent process. No black holes.                │
│                                                      │
│  [Browse Positions]  [Upload Resume]                 │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  HOW IT WORKS                                │   │
│  │                                              │   │
│  │  1. Apply → 2. AI Assessment → 3. Match     │   │
│  │  4. Consultant Review → 5. Client Intro      │   │
│  │  6. Interview → 7. Offer → 8. Placement     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  FEATURED POSITIONS                          │   │
│  │  [Mandate cards with quick apply]            │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P1-001`: Hero section with dual CTA
- `CPT-P1-002`: "How it works" process steps
- `CPT-P1-003`: Featured positions carousel
- `CPT-P1-004`: Search/filter bar
- `CPT-P1-005`: Testimonials from placed candidates
- `CPT-P1-006`: Stats (positions filled, avg time-to-offer)

---

### 3.2 CP2: Browse Mandates

**Route:** `/candidates/mandates`  
**Access:** Public

**Features:**
- Search by keyword, location, level, function
- Filter by industry, salary range, remote policy
- Sort by date, salary, priority
- Quick apply button on each card

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Open Positions                          [Filters ▾] │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │ 🔍 Search...   [Location ▾] [Level ▾] [→]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ VP Engineering  │ │ Head of Product │           │
│  │ Tech Corp       │ │ FinanceCo       │           │
│  │ Shanghai │ ¥80-120万│ │ Beijing │ ¥60-90万  │           │
│  │ [Quick Apply]   │ │ [Quick Apply]   │           │
│  └─────────────────┘ └─────────────────┘           │
│                                                      │
│  [Load more...]                                      │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P2-001`: Mandate listing grid
- `CPT-P2-002`: Search bar (keyword, location)
- `CPT-P2-003`: Filter panel (level, industry, salary, remote)
- `CPT-P2-004`: Sort options
- `CPT-P2-005`: Mandate card component
- `CPT-P2-006`: Quick apply button
- `CPT-P2-007`: Infinite scroll / pagination
- `CPT-P2-008`: "No results" state

---

### 3.3 CP3: Mandate Detail

**Route:** `/candidates/mandates/:id`  
**Access:** Public (apply requires auth)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  VP Engineering — Tech Corp                          │
│  Shanghai │ Full-time │ Senior │ ¥80-120万            │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ About the Role                               │   │
│  │ Lead engineering team of 50+...             │   │
│  │                                              │   │
│  │ Requirements                                 │   │
│  │ - 10+ years experience                       │   │
│  │ - Distributed systems expertise              │   │
│  │ - Team leadership track record               │   │
│  │                                              │   │
│  │ What We Offer                                │   │
│  │ - Competitive comp + equity                  │   │
│  │ - Flexible work arrangement                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  [Apply Now]  [Save for Later]  [Share]             │
│                                                      │
│  🤖 AI Match Score: [Not calculated until apply]    │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P3-001`: Mandate detail page layout
- `CPT-P3-002`: Apply button (auth check)
- `CPT-P3-003`: Save/bookmark functionality
- `CPT-P3-004`: Share button (copy link)
- `CPT-P3-005`: Similar positions sidebar
- `CPT-P3-006`: Company mini-profile
- `CPT-P3-007`: Salary visualization

---

### 3.4 CP4: Application Form

**Route:** `/candidates/apply/:mandate_id`  
**Access:** Auth required

**Flow:**
```
1. Login/Signup (if not authenticated)
2. Profile check (complete profile first if needed)
3. Resume upload (PDF/DOCX)
4. Cover letter (optional)
5. Screening questions (mandate-specific)
6. Submit → triggers AI match scoring
```

**Tickets:**
- `CPT-P4-001`: Application form (multi-step)
- `CPT-P4-002`: Resume upload + parsing
- `CPT-P4-003`: Cover letter field
- `CPT-P4-004`: Screening questions (dynamic per mandate)
- `CPT-P4-005`: Profile completion check
- `CPT-P4-006`: Submit → create mandate_candidate record
- `CPT-P4-007`: AI match score calculation trigger
- `CPT-P4-008`: Application confirmation page

---

### 3.5 CP5: Candidate Dashboard

**Route:** `/candidates/dashboard`  
**Access:** Auth (active candidates)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Welcome, [Name]                                     │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ Active Apps: 3  │ │ Next Step:      │           │
│  │ Interview: 1    │ │ Tech Corp phone │           │
│  │                 │ │ Jul 18, 14:00   │           │
│  └─────────────────┘ └─────────────────┘           │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ APPLICATION PIPELINE                         │   │
│  │                                              │   │
│  │ Applied    Screening   Interview   Offer     │   │
│  │ ──────●──────●──────────●──────────○         │   │
│  │                                              │   │
│  │ Tech Corp     ████████░░  Interview Stage    │   │
│  │ FinanceCo     ██████░░░░  Screening          │   │
│  │ StartupX      ████░░░░░░  Applied            │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ 🤖 AI Insights  │ │ 📋 Assess       │           │
│  │ 2 new matches   │ │ Complete your   │           │
│  │ [View]          │ │ complimentary   │           │
│  │                 │ │ assessment      │           │
│  └─────────────────┘ └─────────────────┘           │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CPT-P5-001`: Dashboard overview
- `CPT-P5-002`: Application pipeline visualization
- `CPT-P5-003`: Next step widget (upcoming interviews)
- `CPT-P5-004`: AI insights notification
- `CPT-P5-005`: Complimentary assessment prompt
- `CPT-P5-006`: Activity feed (status changes)
- `CPT-P5-007`: Quick links (edit profile, view mandates)

---

### 3.6 CP6: Application Tracker

**Route:** `/candidates/applications`  
**Access:** Auth

**Features:**
- Full list of all applications with status
- Status timeline (applied → screening → interview → offer → placed)
- Consultant notes (shared with candidate)
- Interview preparation resources
- Withdraw application option

**Tickets:**
- `CPT-P6-001`: Application list (table view)
- `CPT-P6-002`: Status timeline component
- `CPT-P6-003`: Application detail expand
- `CPT-P6-004`: Consultant notes display
- `CPT-P6-005`: Interview prep resources
- `CPT-P6-006`: Withdraw application
- `CPT-P6-007`: Status change notifications

---

### 3.7 CP7: ASSESS — Complimentary Assessment

**Route:** `/candidates/assess`  
**Access:** Auth

**Purpose:** Complimentary career assessment — helps consultants understand the candidate better

**Features:**
- Skills self-assessment questionnaire
- Work style preferences
- Career goals and expectations
- AI-generated career brief
- Results shared with matching consultants

**Tickets:**
- `CPT-P7-001`: Assessment flow (multi-step form)
- `CPT-P7-002`: Skills self-assessment
- `CPT-P7-003`: Work style preferences
- `CPT-P7-004`: Career goals section
- `CPT-P7-005`: AI career brief generation (DeepSeek)
- `CPT-P7-006`: Results display
- `CPT-P7-007`: Save to profile
- `CPT-P7-008`: Share with consultants toggle

---

### 3.8 CP8: AI Career Insights

**Route:** `/candidates/insights`  
**Access:** Auth

**Features:**
- AI-matched positions (based on profile)
- Market intelligence for candidate's field
- Salary benchmarks
- Skill gap analysis
- Recommended learning resources

**Tickets:**
- `CPT-P8-001`: AI-matched positions feed
- `CPT-P8-002`: Market intelligence panel
- `CPT-P8-003`: Salary benchmark display
- `CPT-P8-004`: Skill gap analysis
- `CPT-P8-005`: Learning resource recommendations
- `CPT-P8-006`: "You might also like" positions

---

### 3.9 CP9: Profile & Resume

**Route:** `/candidates/profile`  
**Access:** Auth

**Features:**
- Edit candidate profile
- Upload/update resume
- Manage preferences (job alerts, privacy)
- View AI match history

**Tickets:**
- `CPT-P9-001`: Profile edit form
- `CPT-P9-002`: Resume upload (version history)
- `CPT-P9-003`: Job alert preferences
- `CPT-P9-004`: Privacy settings
- `CPT-P9-005`: LinkedIn import
- `CPT-P9-006`: Profile completeness indicator

---

## 4. Post-Placement: Alumni → Council

### 4.1 Graduation Flow

When a candidate is placed (successfully filled a mandate):

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ PLACED   │ ──→ │ CELEBRATE│ ──→ │ INVITE   │
│ (status) │     │ (congrats│     │ to The   │
│          │     │  + next  │     │ Council   │
│          │     │  steps)  │     │          │
└──────────┘     └──────────┘     └──────────┘
```

### 4.2 Graduation Gift

- **Complimentary career check-in** (6 months post-placement)
- **The Council invitation** with "Alumni" fast-track
- **DEX AI Executive Introduction** (if not already used)

### 4.3 Tickets

- `CPT-AL-001`: Post-placement celebration email
- `CPT-AL-002`: Council invitation flow (alumni fast-track)
- `CPT-AL-003`: 6-month check-in reminder
- `CPT-AL-004`: DEX AI cross-sell (as post-graduation CTA)
- `CPT-AL-005`: Alumni status tracking

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| CPT-P1: Landing | 6 | `CPT-P1-001` to `CPT-P1-006` |
| CPT-P2: Browse Mandates | 8 | `CPT-P2-001` to `CPT-P2-008` |
| CPT-P3: Mandate Detail | 7 | `CPT-P3-001` to `CPT-P3-007` |
| CPT-P4: Application Form | 8 | `CPT-P4-001` to `CPT-P4-008` |
| CPT-P5: Dashboard | 7 | `CPT-P5-001` to `CPT-P5-007` |
| CPT-P6: Application Tracker | 7 | `CPT-P6-001` to `CPT-P6-007` |
| CPT-P7: ASSESS | 8 | `CPT-P7-001` to `CPT-P7-008` |
| CPT-P8: AI Insights | 6 | `CPT-P8-001` to `CPT-P8-006` |
| CPT-P9: Profile | 6 | `CPT-P9-001` to `CPT-P9-006` |
| CPT-AL: Alumni/Council | 5 | `CPT-AL-001` to `CPT-AL-005` |
| **TOTAL** | **~68** | |

---

**Document Version:** 2.1  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
