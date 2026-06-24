# Phase 1.5 — BD Manager Experience (Build)

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P1 (revenue generation — BD is how LYC wins new mandates)  
**Estimated effort:** 4–5 days  
**Dependency:** Phase 1.0 (auth), Phase 1.3 (role navigation)

---

## 1. Problem Statement

BD Managers currently have **zero platform experience**. They log in and see the consultant platform, which is irrelevant to their work. Business development in executive search involves:

- Sourcing new mandates (hunting)
- Managing client relationships (farming)
- Tracking opportunities from lead → meeting → proposal → mandate won/lost
- Revenue forecasting
- Market intelligence for pitch preparation

**No BD components exist in the codebase.** This spec covers building the BD experience from scratch.

---

## 2. Target State

A BD Manager (`icp = 'consultant'` with a BD role designation, or a new ICP type `bd_manager`) logs in and sees:

```
BD Dashboard
├── Pipeline Value (total opportunity value, weighted)
├── This Week's Activity (meetings, proposals sent, follow-ups)
├── Hot Opportunities (closest to closing)
└── Win Rate (last 90 days)

Opportunities
├── All opportunities (pipeline view)
├── Stages: Prospect → Meeting → Proposal → Negotiation → Won/Lost
└── Each opportunity: client, role, value, probability, days in stage

Clients
├── Relationship history (past mandates, meetings, NPS)
├── Contact directory
└── Expansion opportunities (cross-sell signals)

Market Intel
├── Industry trends for pitching
├── Company rankings in target sectors
└── Talent landscape data
```

---

## 3. Role Model

### Option A: Extend Existing ICP (Recommended)

Add a `bd_manager` subtype without changing the ICP type:

```typescript
// profiles table
// icp = 'consultant' (same as regular consultant)
// subtype = 'bd_manager' | 'consultant' | 'team_lead' (new field)
```

The `subtype` field already exists on `UserProfile` in authStore! It's just not used yet.

### Option B: New Sidebar for BD

BD managers who have `subtype = 'bd_manager'` see a BD-specific sidebar instead of the consultant sidebar.

---

## 4. Detailed Specification

### 4.1. Database Schema

```sql
-- Opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,              -- "VP Engineering, TechCorp"
  company_name TEXT,
  company_id UUID REFERENCES companies(id),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Pipeline
  stage TEXT NOT NULL DEFAULT 'prospect',
  -- 'prospect' | 'meeting_booked' | 'meeting_done' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
  
  -- Financials
  estimated_fee_usd INTEGER,
  probability INTEGER DEFAULT 10,   -- 10-100, for weighted forecast
  fee_type TEXT DEFAULT 'contingency',  -- 'contingency' | 'retained' | 'exclusive'
  
  -- Tracking
  bd_owner_id UUID REFERENCES profiles(id),
  source TEXT,                       -- 'referral' | 'outreach' | 'inbound' | 'event' | 'linkedin'
  source_detail TEXT,
  
  -- Timeline
  first_contact_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  next_action TEXT,
  closed_at TIMESTAMPTZ,
  closed_reason TEXT,
  
  -- Conversion
  converted_to_mandate_id UUID REFERENCES mandates(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Opportunity activities (meeting notes, calls, emails)
CREATE TABLE opportunity_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id),
  activity_type TEXT NOT NULL,  -- 'call' | 'meeting' | 'email' | 'note' | 'proposal'
  summary TEXT,
  details TEXT,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_opportunities_owner ON opportunities(bd_owner_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunity_activities_opp ON opportunity_activities(opportunity_id);

-- RLS
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_activities ENABLE ROW LEVEL SECURITY;

-- BD managers can CRUD their own opportunities + read team opportunities
CREATE POLICY opp_read ON opportunities FOR SELECT USING (
  bd_owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY opp_insert ON opportunities FOR INSERT WITH CHECK (bd_owner_id = auth.uid());
CREATE POLICY opp_update ON opportunities FOR UPDATE USING (bd_owner_id = auth.uid());
```

### 4.2. New Components

```
src/components/bd/
├── BDDashboard.tsx          # Pipeline value, activity, hot opportunities
├── BDPortal.tsx             # Layout: BD sidebar + Outlet
├── OpportunityList.tsx      # Pipeline kanban or list view
├── OpportunityDetail.tsx    # Single opportunity: details, activities, timeline
├── OpportunityForm.tsx      # Create/edit opportunity
├── ClientRelationships.tsx  # Client directory with history
├── ClientDetail.tsx         # Single client: past mandates, meetings, NPS
├── BDMarketIntel.tsx        # Market data for pitch prep
└── BDForecast.tsx           # Revenue forecast (weighted pipeline)
```

### 4.3. BDDashboard

```
┌─────────────────────────────────────────────────────────┐
│ BD Dashboard                              [New Opportunity] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Pipeline │ │ Weighted │ │ Won      │ │ Win Rate │   │
│ │ $2.4M    │ │ $840K    │ │ $180K    │ │ 32%      │   │
│ │ 12 opps  │ │ forecast │ │ this Q   │ │ last 90d │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ 🔥 Hot Opportunities (nearest to close)                 │
│ ┌────────────────────────────────────────────────────┐  │
│ │ CFO, StartupX — Negotiation — $120K — 70% — 12d  │  │
│ │ VP Sales, TechCo — Proposal Sent — $95K — 40%     │  │
│ │ MD, FinanceCo — Meeting Done — $150K — 25%        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ 📋 This Week                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Mon: Follow up with CEO, GrowthCo (proposal)       │  │
│ │ Tue: Intro meeting — CHRO, RetailAPAC              │  │
│ │ Wed: Proposal due — VP Eng, InnovateTech          │  │
│ │ Thu: Check in with referral source — John @ Acme  │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.4. OpportunityList (Pipeline View)

**Kanban columns:**
```
Prospect │ Meeting │ Proposal │ Negotiation │ Won │ Lost
Booked    Done     Sent
```

Each card shows:
- Opportunity title
- Company name
- Estimated fee
- Probability %
- Days in current stage
- BD owner avatar

**List view alternative:**

| Opportunity | Company | Stage | Fee | Prob. | Weighted | Owner | Days | Next Action |
|------------|---------|-------|-----|-------|----------|-------|------|-------------|

### 4.5. OpportunityDetail

**Sections:**
- **Overview** — title, company, contact, fee, probability, stage
- **Timeline** — visual progress through stages
- **Activities** — chronological log of calls, meetings, emails, notes
- **Next Action** — what's the next step and when
- **Conversion** — if won: link to created mandate
- **Files** — proposals, NDAs, pitch decks

### 4.6. ClientRelationships

**Purpose:** Track client history for farming and cross-sell.

**Data:** Pull from:
- `opportunities` (past won/lost deals)
- `mandates` (past completed mandates with this client)
- `companies` (company data)
- `opportunity_activities` (meeting history)

**View:**
| Client | Industry | Total Mandates | Total Revenue | Last Activity | NPS | Open Opps |
|--------|----------|---------------|---------------|---------------|-----|-----------|

### 4.7. BD Sidebar

```typescript
const BD_NAV = [
  { path: '/bd', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/bd/opportunities', icon: TrendingUp, label: 'Opportunities' },
  { path: '/bd/clients', icon: Building2, label: 'Clients' },
  { path: '/bd/forecast', icon: BarChart3, label: 'Forecast' },
  { path: '/bd/market-intel', icon: Globe, label: 'Market Intel' },
  { type: 'divider', label: 'Tools' },
  { path: '/bd/chat', icon: MessageSquare, label: 'Nexus' },
  { path: '/bd/settings', icon: Settings, label: 'Settings' },
];
```

### 4.8. Route Integration

```typescript
// App.tsx
<Route path="/bd" element={
  <ProtectedRoute>
    <RoleRoute allowedSubtypes={['bd_manager']}>
      <BDPortal />
    </RoleRoute>
  </ProtectedRoute>
}>
  <Route index element={<BDDashboard />} />
  <Route path="opportunities" element={<OpportunityList />} />
  <Route path="opportunities/:id" element={<OpportunityDetail />} />
  <Route path="opportunities/new" element={<OpportunityForm />} />
  <Route path="clients" element={<ClientRelationships />} />
  <Route path="clients/:id" element={<ClientDetail />} />
  <Route path="forecast" element={<BDForecast />} />
  <Route path="market-intel" element={<BDMarketIntel />} />
</Route>
```

### 4.9. Nexus AI for BD

BD-specific Nexus prompts:
- "Prepare a pitch brief for [Company] in [Industry]"
- "What's the talent market like for [Function] in [Geography]?"
- "Draft a proposal outline for [Opportunity]"
- "Comparable searches we've done for [Industry] clients"

---

## 5. Acceptance Criteria

- [ ] BD Manager (`subtype = 'bd_manager'`) sees BD sidebar, not consultant sidebar
- [ ] BD Dashboard shows pipeline value, weighted forecast, win rate
- [ ] Can create, edit, and advance opportunities through pipeline stages
- [ ] Opportunity kanban view works with drag-and-drop
- [ ] Activity logging works (add call/meeting/email/note to opportunity)
- [ ] Client relationships page shows history from mandates + opportunities
- [ ] Forecast page shows weighted pipeline by month
- [ ] Nexus AI accessible from BD portal with BD-specific prompts
- [ ] BD Manager cannot see consultant-specific pages (Pipeline, Batch Scoring)
- [ ] `npm run build` succeeds

---

## 6. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/components/bd/BDPortal.tsx` | Layout + sidebar |
| `src/components/bd/BDDashboard.tsx` | Dashboard |
| `src/components/bd/OpportunityList.tsx` | Pipeline kanban/list |
| `src/components/bd/OpportunityDetail.tsx` | Single opportunity |
| `src/components/bd/OpportunityForm.tsx` | Create/edit form |
| `src/components/bd/ClientRelationships.tsx` | Client directory |
| `src/components/bd/ClientDetail.tsx` | Client history |
| `src/components/bd/BDForecast.tsx` | Revenue forecast |
| `src/components/bd/BDMarketIntel.tsx` | Market intel for pitches |
| `supabase/migrations/create_opportunities.sql` | New tables + RLS |

### Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/bd` routes |
| `src/components/layout/AppLayout.tsx` | Add BD sidebar variant |
| `src/types/index.ts` | Add `BD_SUBTYPES` constant |

---

## 7. Future Enhancements (Not in This Phase)

- Email integration (send/receive from platform)
- LinkedIn Sales Navigator integration
- Automated proposal generation
- Client NPS surveys
- Referral tracking and reward system

