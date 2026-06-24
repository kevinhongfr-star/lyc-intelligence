# Phase 1.6 — Team Lead / Partner Experience (Build)

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P1 (governance — partners need oversight, not operational view)  
**Estimated effort:** 4–5 days  
**Dependency:** Phase 1.0 (auth), Phase 1.3 (role navigation), Phase 1.4 (activity logging)

---

## 1. Problem Statement

Team Leads / Partners (`icp = 'leader'`) see the **same operational dashboard as junior consultants**. They have:

- No team visibility (can't see what consultants are working on)
- No approval workflows (success profiles, offers, fee waivers go unmonitored)
- No SLA tracking (mandate deadlines invisible)
- No delegation capability
- No quality control tools
- No strategic client overview

LYC's partner-led model is a **key differentiator** — but the platform doesn't reflect it.

---

## 2. Target State

A Team Lead logs in and sees:

```
Partner Dashboard
├── Team Health (active mandates, at-risk, SLA status)
├── Approval Queue (pending items requiring partner sign-off)
├── Consultant Load (who has capacity, who's overloaded)
├── Revenue Dashboard (fees in pipeline, collected, forecast)
└── Client NPS (satisfaction scores, expansion opportunities)

Approvals
├── Success Profiles (pending review before client submission)
├── Offers (fee negotiations, special terms)
└── SLA Waivers (deadline extensions)

Team
├── Consultant Leaderboard (placements, revenue, activity)
├── Mandate Portfolio (all active mandates across team)
└── Capacity Planning (who can take new mandates)
```

---

## 3. Role Model

Team Leads use `icp = 'leader'`. The `subtype` field can further distinguish:
- `subtype = 'partner'` — full P&L responsibility
- `subtype = 'team_lead'` — manages consultants but not P&L
- `subtype = 'director'` — senior consultant with some oversight

For this phase, we treat all `icp = 'leader'` users the same.

---

## 4. Database Schema

```sql
-- Approval requests
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL,
  -- 'success_profile' | 'offer_terms' | 'sla_waiver' | 'fee_adjustment'
  
  mandate_id UUID REFERENCES mandates(id),
  candidate_id TEXT,  -- references candidates_pipeline or external
  
  requester_id UUID REFERENCES profiles(id),
  approver_id UUID REFERENCES profiles(id),
  
  status TEXT DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'withdrawn'
  
  request_data JSONB,  -- Flexible: success profile content, offer terms, etc.
  reviewer_notes TEXT,
  
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,  -- SLA for approval
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SLA tracking
CREATE TABLE mandate_slas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id) UNIQUE,
  
  -- Key milestones and their deadlines
  shortlist_due_at TIMESTAMPTZ,    -- First shortlist delivery
  interview_due_at TIMESTAMPTZ,    -- First interview scheduled
  offer_due_at TIMESTAMPTZ,        -- Expected offer
  fill_due_at TIMESTAMPTZ,         -- Mandate deadline
  
  -- Status
  sla_status TEXT DEFAULT 'on_track',  -- 'on_track' | 'at_risk' | 'breached' | 'waived'
  days_to_next_milestone INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team assignments (which consultant reports to which team lead)
CREATE TABLE team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID REFERENCES profiles(id),
  team_lead_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(consultant_id, is_active)
);

-- Indexes
CREATE INDEX idx_approvals_status ON approval_requests(status);
CREATE INDEX idx_approvals_approver ON approval_requests(approver_id);
CREATE INDEX idx_sla_status ON mandate_slas(sla_status);
CREATE INDEX idx_team_lead ON team_assignments(team_lead_id);

-- RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_slas ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
```

---

## 5. New Components

```
src/components/team-lead/
├── TeamLeadPortal.tsx          # Layout: TL sidebar + Outlet
├── TL_Dashboard.tsx            # Partner dashboard
├── TL_Approvals.tsx            # Approval queue
├── TL_ApprovalDetail.tsx       # Single approval review
├── TL_TeamOverview.tsx         # Consultant load & performance
├── TL_MandatePortfolio.tsx     # All mandates across team
├── TL_SLADashboard.tsx         # SLA compliance view
├── TL_RevenueDashboard.tsx     # Revenue: pipeline, collected, forecast
├── TL_ClientOverview.tsx       # Strategic client relationships
└── TL_ConsultantLeaderboard.tsx # Performance rankings
```

---

## 6. Component Specifications

### 6.1. TL_Dashboard (Partner Dashboard)

```
┌─────────────────────────────────────────────────────────┐
│ Partner Dashboard                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Active   │ │ At Risk  │ │ Approval │ │ Revenue  │   │
│ │ Mandates │ │ (SLA)    │ │ Pending  │ │ This Q   │   │
│ │    14    │ │     3    │ │     5    │ │  $420K   │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ ⚠️ Attention Required                                   │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 🔴 VP Eng, TechCorp — SLA breached (5 days late)  │  │
│ │ 🟡 CFO, StartupX — Offer pending your approval    │  │
│ │ 🟡 Success Profile, MD FinanceCo — awaiting review│  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ 👥 Team Load                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Alessio  ████████░░ 4 mandates (high)             │  │
│ │ James    █████░░░░░ 2 mandates (normal)           │  │
│ │ Wei      ███░░░░░░░ 1 mandate (available)         │  │
│ │ Maria    ██████████ 5 mandates (overloaded)        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ 📊 This Month                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Candidates Scored: 87  Interviews Scheduled: 12   │  │
│ │ Offers Extended: 3     Placements: 1              │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 6.2. TL_Approvals (Approval Queue)

**List view:**

| Type | Mandate | Candidate | Requester | Submitted | Due | Status |
|------|---------|-----------|-----------|-----------|-----|--------|
| Success Profile | VP Eng, TechCorp | — | Alessio | 2h ago | 24h | ⏳ Pending |
| Offer Terms | CFO, StartupX | — | James | Today | 48h | ⏳ Pending |
| SLA Waiver | MD, FinanceCo | — | Alessio | Yesterday | Overdue | 🔴 Overdue |

**Actions:** Approve / Reject / Request Changes (with notes)

### 6.3. TL_ApprovalDetail

**For Success Profile approval:**
```
┌─────────────────────────────────────────────────┐
│ Success Profile Review                          │
│                                                 │
│ Mandate: VP Engineering, TechCorp, Shanghai     │
│ Requested by: Alessio                           │
│ Submitted: 2 hours ago                          │
│                                                 │
│ ── Success Profile ──                           │
│ [Rendered success profile content]              │
│                                                 │
│ ── Actions ──                                   │
│ [✅ Approve]  [❌ Reject]  [💬 Request Changes] │
│ Notes: [___________________________]            │
└─────────────────────────────────────────────────┘
```

### 6.4. TL_TeamOverview (Consultant Load)

| Consultant | Active Mandates | Pipeline Size | This Month Scored | This Month Interviews | Status |
|-----------|----------------|---------------|-------------------|----------------------|--------|
| Alessio | 4 | 18 | 24 | 5 | 🔴 High |
| James | 2 | 8 | 12 | 3 | 🟢 Normal |
| Wei | 1 | 4 | 6 | 1 | 🟡 Available |
| Maria | 5 | 22 | 31 | 4 | 🔴 Overloaded |

**Capacity indicator:**
- 🟢 Available: < 2 mandates, pipeline < 10
- 🟡 Normal: 2-3 mandates
- 🔴 High: 4+ mandates or pipeline > 20
- ⚫ Overloaded: 5+ mandates — flag for team lead intervention

### 6.5. TL_MandatePortfolio

**All mandates across the team:**

| Mandate | Company | Consultant | Stage | Candidates | Days Open | SLA | Revenue |
|---------|---------|-----------|-------|-----------|-----------|-----|---------|
| VP Eng | TechCorp | Alessio | Interview | 5 | 34 | 🟢 | $90K |
| CFO | StartupX | James | Offer | 2 | 21 | 🟡 | $75K |
| MD | FinanceCo | Alessio | Shortlist | 8 | 14 | 🔴 | $120K |

**Filters:** Consultant, Stage, SLA Status, Industry

### 6.6. TL_SLADashboard

```
SLA Overview
├── On Track: 8 mandates
├── At Risk: 3 mandates (< 3 days to milestone)
└── Breached: 1 mandate (past deadline)

Breached / At Risk:
┌─────────────────────────────────────────────────┐
│ 🔴 MD, FinanceCo — Shortlist was due 2 days ago │
│    Consultant: Alessio                          │
│    [View Mandate] [Grant Waiver] [Escalate]     │
│                                                 │
│ 🟡 CFO, StartupX — Offer due in 2 days         │
│    Consultant: James                            │
│    [View Mandate] [Send Reminder]               │
└─────────────────────────────────────────────────┘
```

### 6.7. TL_RevenueDashboard

```
Revenue Summary
┌─────────────────────────────────────────────────┐
│ This Quarter                                    │
│                                                 │
│ Pipeline:     $1.2M (12 mandates × avg fee)    │
│ Weighted:     $480K (probability-adjusted)      │
│ Collected:    $180K (2 placements completed)    │
│ Forecast:     $600K (end of quarter projection) │
│                                                 │
│ By Consultant:                                  │
│ Alessio: $450K pipeline  | $90K collected      │
│ James:   $300K pipeline  | $60K collected       │
│ Wei:     $150K pipeline  | $30K collected       │
│ Maria:   $300K pipeline  | $0K collected        │
└─────────────────────────────────────────────────┘
```

### 6.8. TL Sidebar

```typescript
const TL_NAV = [
  { path: '/team', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/team/approvals', icon: CheckCircle, label: 'Approvals' },
  { path: '/team/mandates', icon: Briefcase, label: 'All Mandates' },
  { path: '/team/sla', icon: Clock, label: 'SLA Monitor' },
  { type: 'divider', label: 'Insights' },
  { path: '/team/revenue', icon: DollarSign, label: 'Revenue' },
  { path: '/team/consultants', icon: Users, label: 'Team' },
  { path: '/team/clients', icon: Building2, label: 'Clients' },
  { type: 'divider', label: 'Tools' },
  { path: '/team/chat', icon: MessageSquare, label: 'Nexus' },
  { path: '/team/settings', icon: Settings, label: 'Settings' },
];
```

---

## 7. Route Integration

```typescript
// App.tsx
<Route path="/team" element={
  <ProtectedRoute>
    <RoleRoute allowedICP={['leader']}>
      <TeamLeadPortal />
    </RoleRoute>
  </ProtectedRoute>
}>
  <Route index element={<TL_Dashboard />} />
  <Route path="approvals" element={<TL_Approvals />} />
  <Route path="approvals/:id" element={<TL_ApprovalDetail />} />
  <Route path="mandates" element={<TL_MandatePortfolio />} />
  <Route path="mandates/:id" element={<MandateDetailPage />} /> {/* Reuse existing */}
  <Route path="sla" element={<TL_SLADashboard />} />
  <Route path="revenue" element={<TL_RevenueDashboard />} />
  <Route path="consultants" element={<TL_TeamOverview />} />
  <Route path="clients" element={<TL_ClientOverview />} />
  <Route path="chat" element={<NexusPage />} /> {/* Reuse existing */}
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

---

## 8. Acceptance Criteria

- [ ] Team Lead (`icp = 'leader'`) sees team-specific sidebar
- [ ] Dashboard shows team health: active mandates, at-risk, approvals pending
- [ ] Approval queue shows pending items with approve/reject/notes
- [ ] Team overview shows consultant load and capacity
- [ ] Mandate portfolio shows all team mandates with SLA status
- [ ] SLA dashboard highlights breached and at-risk mandates
- [ ] Revenue dashboard shows pipeline, weighted forecast, collected
- [ ] Team lead can view individual mandate details (reuse existing page)
- [ ] Team lead can access Nexus AI from their portal
- [ ] Team lead cannot access consultant-only operational pages (Batch Scoring, Scoring Runs)
- [ ] `npm run build` succeeds

---

## 9. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/components/team-lead/TeamLeadPortal.tsx` | Layout + sidebar |
| `src/components/team-lead/TL_Dashboard.tsx` | Partner dashboard |
| `src/components/team-lead/TL_Approvals.tsx` | Approval queue |
| `src/components/team-lead/TL_ApprovalDetail.tsx` | Approval review |
| `src/components/team-lead/TL_TeamOverview.tsx` | Consultant load |
| `src/components/team-lead/TL_MandatePortfolio.tsx` | All mandates |
| `src/components/team-lead/TL_SLADashboard.tsx` | SLA monitoring |
| `src/components/team-lead/TL_RevenueDashboard.tsx` | Revenue view |
| `src/components/team-lead/TL_ClientOverview.tsx` | Client relationships |
| `supabase/migrations/create_team_lead_tables.sql` | Approvals, SLAs, team assignments |

### Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/team` routes |
| `src/components/layout/AppLayout.tsx` | Add team lead sidebar variant |
| `src/pages/MandatesPage.tsx` | Show all mandates for team leads |
| `src/pages/DashboardPage.tsx` | Route to team lead dashboard for leaders |

---

## 10. Design Notes

- Team lead view is **strategic**, not operational — they see aggregates, not details
- Approval workflows should have SLA timers (auto-escalate if not reviewed in 24h)
- Revenue data is sensitive — only visible to partners and admins
- Team lead should be able to **reassign mandates** between consultants (future enhancement)
- The leaderboard should motivate, not create competition — consider anonymized rankings

