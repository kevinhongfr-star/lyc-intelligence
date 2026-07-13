# 04 — Client Portal Spec
## LYC Intelligence Platform — Company/Client Experience

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Client-facing portal for companies using LYC recruitment services  
**Dependencies:** 02 (Supabase), 06 (Intelligence Layer)

---

## 1. Portal Overview

### 1.1 Purpose

The Client Portal is where companies interact with LYC Intelligence:
- View and manage open mandates
- Review candidate shortlists
- Track recruitment pipeline
- Access company intelligence (360° view)
- Communicate with assigned consultants
- View billing and contracts

### 1.2 User Roles

| Role | Access | Description |
|------|--------|-------------|
| `client_admin` | Full access | Manage company, users, mandates |
| `client_user` | View + limited actions | View mandates, review candidates |
| `client_viewer` | Read-only | View only, no actions |

### 1.3 Page Map

| # | Page | Route | Purpose |
|---|------|-------|---------|
| CL1 | Client Dashboard | `/client/dashboard` | Overview: active mandates, pipeline |
| CL2 | Company Profile | `/client/company` | Company info + 360° intelligence |
| CL3 | Mandate List | `/client/mandates` | All mandates (active/closed) |
| CL4 | Mandate Detail | `/client/mandates/:id` | Single mandate + pipeline |
| CL5 | Candidate Shortlist | `/client/mandates/:id/candidates` | Candidates for mandate |
| CL6 | Candidate Detail | `/client/candidates/:id` | Full candidate profile |
| CL7 | Activity Feed | `/client/activity` | All recent activity |
| CL8 | Billing & Contracts | `/client/billing` | Invoices, contracts, spend |

**Total: 8 pages**

---

## 2. Page Specifications

### 2.1 CL1: Client Dashboard

**Route:** `/client/dashboard`  
**Access:** Client users

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Company] Dashboard                    [Company ▾]  │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ Active  │ │In Pipe │ │Interview│ │ Offer  │      │
│  │ Mandates│ │line    │ │ Stage   │ │Pending │      │
│  │    5    │ │   23   │ │    8    │ │    2   │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ACTIVE MANDATES                               │  │
│  │                                               │  │
│  │ VP Engineering    ████████░░  6 submitted     │  │
│  │ Head of Product   ██████░░░░  4 submitted     │  │
│  │ CTO               ████░░░░░░  2 submitted     │  │
│  │ [View All →]                                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ RECENT ACTIVITY     │ │ COMPANY HEALTH       │  │
│  │ • 3 new candidates  │ │ Score: 82/100 ↑     │  │
│  │ • VP Eng interview  │ │ Hiring: +15% QoQ    │  │
│  │ • Offer accepted    │ │ [View Intelligence →]│  │
│  └─────────────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CL-DASH-001`: Dashboard KPI cards (4 metrics)
- `CL-DASH-002`: Active mandates list with progress
- `CL-DASH-003`: Recent activity feed
- `CL-DASH-004`: Company health score widget
- `CL-DASH-005`: Quick actions (new mandate, message consultant)
- `CL-DASH-006`: Multi-company switcher (for agencies)
- `CL-DASH-007`: Onboarding wizard (new clients)
- `CL-DASH-008`: Empty state (no mandates yet)

---

### 2.2 CL2: Company Profile

**Route:** `/client/company`  
**Access:** Client admin

**Features:**
- Edit company information
- View company intelligence (360°)
- Manage client users (invite, remove, roles)
- View company analytics

**Tickets:**
- `CL-COMP-001`: Company profile form
- `CL-COMP-002`: Company intelligence view (delegates to 06)
- `CL-COMP-003`: User management (invite/remove/roles)
- `CL-COMP-004`: Company analytics (mandates filled, avg time)
- `CL-COMP-005`: Contract details display
- `CL-COMP-006`: Logo upload

---

### 2.3 CL3: Mandate List

**Route:** `/client/mandates`  
**Access:** Client users

**Features:**
- All mandates (active, closed, draft)
- Filter by status, priority, level
- Sort by date, candidates, fill rate
- Create new mandate

**Tickets:**
- `CL-MAN-001`: Mandate listing table
- `CL-MAN-002`: Filter panel (status, priority, level)
- `CL-MAN-003`: Sort options
- `CL-MAN-004`: Create new mandate flow
- `CL-MAN-005`: Mandate status badges
- `CL-MAN-006`: Quick stats per mandate
- `CL-MAN-007`: Bulk actions (close, archive)
- `CL-MAN-008`: Mandate search

---

### 2.4 CL4: Mandate Detail

**Route:** `/client/mandates/:id`  
**Access:** Client users

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  VP Engineering — Tech Corp           [Edit] [Close] │
│  Status: Active │ Priority: High │ Opened: Jul 1    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ PIPELINE                                      │  │
│  │                                               │  │
│  │ Sourced   Screening  Submitted  Interview  Offer│
│  │   45        12         6          3         1  │  │
│  │                                               │  │
│  │ [View Full Pipeline →]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────┐ ┌──────────────────────┐ │
│  │ ROLE DETAILS         │ │ TIMELINE             │ │
│  │ Level: VP/Senior     │ │ Target: Sep 30       │ │
│  │ Location: Shanghai   │ │ Days open: 42        │ │
│  │ Salary: ¥80-120万    │ │ Avg to fill: 60d     │ │
│  │ Remote: Hybrid       │ │ On track: ✓          │ │
│  └──────────────────────┘ └──────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ ASSIGNED CONSULTANT                           │  │
│  │ Sarah Chen │ Senior Consultant                │  │
│  │ [Message] │ [Schedule Call]                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `CL-MD-001`: Mandate detail header (status, priority)
- `CL-MD-002`: Pipeline funnel visualization
- `CL-MD-003`: Role details panel
- `CL-MD-004`: Timeline / progress tracking
- `CL-MD-005`: Assigned consultant card
- `CL-MD-006`: Edit mandate flow
- `CL-MD-007`: Close/reopen mandate
- `CL-MD-008`: Mandate comments/notes
- `CL-MD-009`: Interview scheduling integration
- `CL-MD-010`: Offer tracking

---

### 2.5 CL5: Candidate Shortlist

**Route:** `/client/mandates/:id/candidates`  
**Access:** Client users

**Features:**
- Candidates submitted for this mandate
- AI match scores
- Consultant notes
- Status per candidate (reviewed, interview, offer, etc.)
- Compare candidates side-by-side
- Request more candidates

**Tickets:**
- `CL-CS-001`: Candidate list for mandate
- `CL-CS-002`: AI match score display
- `CL-CS-003`: Consultant notes per candidate
- `CL-CS-004`: Status management (shortlist/reject/interview)
- `CL-CS-005`: Side-by-side comparison
- `CL-CS-006`: "Request more candidates" button
- `CL-CS-007`: Candidate ranking display
- `CL-CS-008`: Export shortlist (PDF/CSV)

---

### 2.6 CL6: Candidate Detail

**Route:** `/client/candidates/:id`  
**Access:** Client users

**Features:**
- Full candidate profile
- Resume viewer
- AI assessment summary
- Interview history for this mandate
- Feedback submission
- Move to next stage

**Tickets:**
- `CL-CD-001`: Candidate profile view
- `CL-CD-002`: Resume viewer (PDF inline)
- `CL-CD-003`: AI assessment summary
- `CL-CD-004`: Interview history
- `CL-CD-005`: Feedback form (per stage)
- `CL-CD-006`: Stage progression buttons
- `CL-CD-007`: Message consultant about candidate
- `CL-CD-008`: Candidate comparison (from shortlist)

---

### 2.7 CL7: Activity Feed

**Route:** `/client/activity`  
**Access:** Client users

**Features:**
- Chronological feed of all activities
- Filter by entity type, date, consultant
- Mark as read
- Link to related entities

**Tickets:**
- `CL-AF-001`: Activity feed (infinite scroll)
- `CL-AF-002`: Activity type filtering
- `CL-AF-003`: Date range filter
- `CL-AF-004`: Mark as read functionality
- `CL-AF-005`: Activity detail expand
- `CL-AF-006`: Link to entity (mandate/candidate)

---

### 2.8 CL8: Billing & Contracts

**Route:** `/client/billing`  
**Access:** Client admin only

**Features:**
- Current contract details
- Invoice history
- Payment status
- Fee structure summary
- Spend analytics

**Tickets:**
- `CL-BIL-001`: Contract overview
- `CL-BIL-002`: Invoice list
- `CL-BIL-003`: Invoice detail/download (PDF)
- `CL-BIL-004`: Payment status
- `CL-BIL-005`: Fee structure summary
- `CL-BIL-006`: Spend analytics (by mandate, period)
- `CL-BIL-007`: Outstanding balance display

---

## 3. Client-Side Features

### 3.1 Multi-Company Support

For agency users or consultants managing multiple companies:
- Company switcher in header
- Cross-company dashboard
- Consolidated reporting

**Tickets:**
- `CL-MC-001`: Company switcher component
- `CL-MC-002`: Cross-company view
- `CL-MC-003`: Consolidated reporting

### 3.2 White-Label Option

Enterprise clients can customize:
- Logo in portal header
- Brand colors
- Custom domain (future)

**Tickets:**
- `CL-WL-001`: White-label configuration
- `CL-WL-002`: Custom logo upload
- `CL-WL-003`: Theme color picker

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| CL-DASH: Dashboard | 8 | `CL-DASH-001` to `CL-DASH-008` |
| CL-COMP: Company Profile | 6 | `CL-COMP-001` to `CL-COMP-006` |
| CL-MAN: Mandate List | 8 | `CL-MAN-001` to `CL-MAN-008` |
| CL-MD: Mandate Detail | 10 | `CL-MD-001` to `CL-MD-010` |
| CL-CS: Candidate Shortlist | 8 | `CL-CS-001` to `CL-CS-008` |
| CL-CD: Candidate Detail | 8 | `CL-CD-001` to `CL-CD-008` |
| CL-AF: Activity Feed | 6 | `CL-AF-001` to `CL-AF-006` |
| CL-BIL: Billing | 7 | `CL-BIL-001` to `CL-BIL-007` |
| CL-MC: Multi-Company | 3 | `CL-MC-001` to `CL-MC-003` |
| CL-WL: White-Label | 3 | `CL-WL-001` to `CL-WL-003` |
| **TOTAL** | **~67** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
