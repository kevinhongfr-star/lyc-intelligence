# 01 — Internal Portal Spec
## LYC Intelligence Platform — Consultant Experience

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Internal portal for LYC consultants and admin  
**Dependencies:** 02 (Supabase), 04 (Client Portal), 06 (Intelligence Layer)

---

## 1. Portal Overview

### 1.1 Purpose

The Internal Portal is where LYC consultants operate:
- Manage client mandates and candidate pipelines
- Access company intelligence
- Track daily tasks and activities
- View performance metrics
- Administer the platform

### 1.2 User Roles

| Role | Access | Description |
|------|--------|-------------|
| `super_admin` | Full platform | NEXUS system admin |
| `admin` | Org-level admin | Team lead, billing, settings |
| `consultant` | Own mandates/clients | Day-to-day recruitment |
| `researcher` | Read-only + research | Support role |

### 1.3 Page Map

| # | Page | Route | Purpose |
|---|------|-------|---------|
| IN1 | Consultant Dashboard | `/app/dashboard` | Daily overview, tasks, pipeline |
| IN2 | Mandate Management | `/app/mandates` | All mandates (own + team) |
| IN3 | Candidate Management | `/app/candidates` | All candidates |
| IN4 | Company Management | `/app/companies` | Client companies |
| IN5 | Activity & Tasks | `/app/activities` | Task list, activity log |
| IN6 | Reports & Analytics | `/app/reports` | Performance metrics |
| IN7 | Team Management | `/app/team` | Team members, assignments |
| IN8 | Admin Settings | `/admin/settings` | Platform config |

**Total: 8 pages (+ admin)**

---

## 2. Page Specifications

### 2.1 IN1: Consultant Dashboard

**Route:** `/app/dashboard`  
**Access:** Consultants

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Good morning, [Name]                 [Date] [⚙]    │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ My      │ │ Active │ │Due     │ │Placed  │      │
│  │ Tasks   │ │ Mandates│ │Today  │ │This Mo │      │
│  │   12    │ │    8    │ │   5    │ │   2    │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ TODAY'S PRIORITIES                            │  │
│  │ ☐ Review 3 new candidates for VP Eng         │  │
│  │ ☐ Submit shortlist to Tech Corp               │  │
│  │ ● Call with FinanceCo at 14:00                │  │
│  │ ☐ Follow up with candidate Zhang              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ PIPELINE SNAPSHOT   │ │ AI INSIGHTS          │  │
│  │ [Pipeline funnel]   │ │ • 3 new signals for  │  │
│  │                     │ │   Tech Corp           │  │
│  │                     │ │ • Zhang Wei matched  │  │
│  │                     │ │   92% for CTO role    │  │
│  └─────────────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `IN-DASH-001`: Dashboard KPI cards
- `IN-DASH-002`: Today's priorities (task list)
- `IN-DASH-003`: Pipeline snapshot (funnel chart)
- `IN-DASH-004`: AI insights widget
- `IN-DASH-005`: Quick actions (new mandate, new candidate)
- `IN-DASH-006`: Recent activity feed
- `IN-DASH-007`: Upcoming deadlines
- `IN-DASH-008`: Global search (Cmd+K)

---

### 2.2 IN2: Mandate Management

**Route:** `/app/mandates`  
**Access:** Consultants

**Features:**
- All mandates with filters
- Kanban view (by status)
- Table view (sortable columns)
- Create/edit mandate
- Assign consultants
- Bulk operations

**Tickets:**
- `IN-MAN-001`: Mandate table view
- `IN-MAN-002`: Kanban board view (toggle)
- `IN-MAN-003`: Advanced filters
- `IN-MAN-004`: Create mandate wizard
- `IN-MAN-005`: Edit mandate form
- `IN-MAN-006`: Assign/reassign consultant
- `IN-MAN-007`: Bulk operations (close, archive, assign)
- `IN-MAN-008`: Saved views (filter presets)
- `IN-MAN-009`: Mandate detail (inline expand)
- `IN-MAN-010`: CSV export

---

### 2.3 IN3: Candidate Management

**Route:** `/app/candidates`  
**Access:** Consultants

**Features:**
- All candidates database
- Search/filter (skills, experience, location)
- Add new candidate
- Import from CSV/LinkedIn
- AI enrichment trigger
- Bulk operations

**Tickets:**
- `IN-CAND-001`: Candidate table view
- `IN-CAND-002`: Advanced search/filter
- `IN-CAND-003`: Add candidate form
- `IN-CAND-004`: Resume upload + AI parsing
- `IN-CAND-005`: LinkedIn import
- `IN-CAND-006`: AI enrichment trigger
- `IN-CAND-007`: Bulk operations
- `IN-CAND-008`: Candidate detail (inline/side panel)
- `IN-CAND-009`: Merge duplicates
- `IN-CAND-010`: Export candidates

---

### 2.4 IN4: Company Management

**Route:** `/app/companies`  
**Access:** Consultants

**Features:**
- All client companies
- Company 360° intelligence view
- Add/edit company
- Company health tracking
- Linked mandates and candidates

**Tickets:**
- `IN-COMP-001`: Company list view
- `IN-COMP-002`: Company detail page
- `IN-COMP-003`: Company 360° intelligence (delegates to 06)
- `IN-COMP-004`: Add/edit company form
- `IN-COMP-005`: Company health score
- `IN-COMP-006`: Linked mandates panel
- `IN-COMP-007`: Linked candidates panel
- `IN-COMP-008`: Company merge

---

### 2.5 IN5: Activity & Tasks

**Route:** `/app/activities`  
**Access:** Consultants

**Features:**
- Task list (personal + team)
- Activity log (all entities)
- Calendar view
- Reminders and notifications
- Bulk task operations

**Tickets:**
- `IN-ACT-001`: Task list (my tasks)
- `IN-ACT-002`: Team tasks view
- `IN-ACT-003`: Activity log (entity timeline)
- `IN-ACT-004`: Calendar view
- `IN-ACT-005`: Create task form
- `IN-ACT-006`: Task completion toggle
- `IN-ACT-007`: Reminder setup
- `IN-ACT-008`: Activity filtering

---

### 2.6 IN6: Reports & Analytics

**Route:** `/app/reports`  
**Access:** Consultants (own data) + Admin (all data)

**Features:**
- Personal performance metrics
- Team performance
- Placement analytics
- Time-to-fill tracking
- Pipeline conversion rates
- Revenue tracking

**Tickets:**
- `IN-REP-001`: Personal performance dashboard
- `IN-REP-002`: Team performance view (admin)
- `IN-REP-003`: Placement analytics
- `IN-REP-004`: Time-to-fill analysis
- `IN-REP-005`: Pipeline conversion funnel
- `IN-REP-006`: Revenue tracking
- `IN-REP-007`: Report export (PDF/CSV)
- `IN-REP-008`: Custom date range

---

### 2.7 IN7: Team Management

**Route:** `/app/team`  
**Access:** Admin only

**Features:**
- Team member list
- Roles and permissions
- Workload distribution
- Performance overview

**Tickets:**
- `IN-TEAM-001`: Team member list
- `IN-TEAM-002`: Role management
- `IN-TEAM-003`: Workload distribution view
- `IN-TEAM-004`: Team performance overview
- `IN-TEAM-005`: Invite new member

---

### 2.8 IN8: Admin Settings

**Route:** `/admin/settings`  
**Access:** Super admin

**Features:**
- Organization settings
- Integration configuration
- AI model settings
- Notification templates
- System health

**Tickets:**
- `IN-ADM-001`: Organization settings
- `IN-ADM-002`: Integration configuration (Stripe, Resend, etc.)
- `IN-ADM-003`: AI model settings (DeepSeek routing)
- `IN-ADM-004`: Notification template editor
- `IN-ADM-005`: System health dashboard
- `IN-ADM-006`: Audit log viewer

---

## 3. Global Features

### 3.1 Global Search (Cmd+K)

**Shortcut:** Cmd+K (Mac) / Ctrl+K (Windows)

**Searches across:**
- Mandates (by title, company, status)
- Candidates (by name, skills, company)
- Companies (by name, industry)
- Activities (by type, description)
- Settings (quick navigation)

**Tickets:**
- `IN-GLB-001`: Cmd+K search modal
- `IN-GLB-002`: Search across all entities
- `IN-GLB-003`: Keyboard navigation
- `IN-GLB-004`: Recent searches
- `IN-GLB-005`: Search result grouping

### 3.2 Sidebar Navigation

**Style:** Notion/Vercel-style collapsible sidebar

```
┌──────────┐
│ LYC Logo │
│          │
│ 🏠 Home  │
│ 📋 Mandates│
│ 👤 Candidates│
│ 🏢 Companies│
│ ✅ Tasks  │
│ 📊 Reports│
│          │
│ ⚙ Settings│
│ 👤 Profile│
└──────────┘
```

**Tickets:**
- `IN-NAV-001`: Sidebar navigation component
- `IN-NAV-002`: Collapsible/expandable
- `IN-NAV-003`: Active page indicator
- `IN-NAV-004`: Mobile responsive (hamburger)
- `IN-NAV-005`: Badge counts (tasks, notifications)

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| IN-DASH: Dashboard | 8 | `IN-DASH-001` to `IN-DASH-008` |
| IN-MAN: Mandate Mgmt | 10 | `IN-MAN-001` to `IN-MAN-010` |
| IN-CAND: Candidate Mgmt | 10 | `IN-CAND-001` to `IN-CAND-010` |
| IN-COMP: Company Mgmt | 8 | `IN-COMP-001` to `IN-COMP-008` |
| IN-ACT: Activities | 8 | `IN-ACT-001` to `IN-ACT-008` |
| IN-REP: Reports | 8 | `IN-REP-001` to `IN-REP-008` |
| IN-TEAM: Team Mgmt | 5 | `IN-TEAM-001` to `IN-TEAM-005` |
| IN-ADM: Admin Settings | 6 | `IN-ADM-001` to `IN-ADM-006` |
| IN-GLB: Global Search | 5 | `IN-GLB-001` to `IN-GLB-005` |
| IN-NAV: Navigation | 5 | `IN-NAV-001` to `IN-NAV-005` |
| **TOTAL** | **~73** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
