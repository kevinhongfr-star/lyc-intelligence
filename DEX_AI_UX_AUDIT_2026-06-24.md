# DEX AI / LYC Intelligence — Full Product UX Audit
## Per User Type: Minimalism · Intuitiveness · Business Value · Differentiation

**Date:** 2026-06-24  
**Auditor:** NEXUS (PM)  
**Scope:** Live deployment at lyc-intelligence.app + codebase audit (84,821 lines, 34 pages, 182 components)  
**Mode:** Audit only — no code changes

---

## Executive Summary

The platform has a **massive gap between codebase and user-facing product**. Of 158 feature components built across 43 directories, **~146 (92%) are orphaned** — written but not wired to any page or route. The actual user experience is a thin shell of what exists in the codebase.

**Critical finding:** Client Portal and Candidate Portal — two entire user-type experiences — are **completely unreachable** (built as components, never added to routes).

### Platform Scorecard

| Dimension | Score | Verdict |
|-----------|-------|---------|
| **Code Completeness** | 8% wired | 92% of components are orphaned |
| **User-Type Separation** | Failed | Client/Candidate portals not wired; all users see same sidebar |
| **Minimalism** | Moderate | Sidebar has 12+ items, no role-based filtering |
| **Intuitiveness** | Low-Moderate | Good landing pages, but platform navigation is flat and undifferentiated |
| **Business Process Coverage** | Low (in practice) | Spec covers full lifecycle; live app covers ~20% |
| **Differentiation** | High (on paper) | TRIDENT/GRID/LENS methodology is unique; but invisible in UX |
| **Auth Architecture** | Broken | Dual auth systems (Context + Zustand); inconsistent across pages |

---

## 1. CONSULTANT (lyc_consultant / member)

### What They See Today
- **Sidebar:** 12+ items (Dashboard, Pipeline, Mandates, Candidates, Companies, Match Analysis, Candidate Report, Performance Metrics, Scoring Runs, Nexus, Scheduler, Documents, Alerts, Settings)
- **Landing:** Generic dashboard with assessment summary, credit balance, referral code, recent sessions
- **Core flows:** Match scoring (JD → candidates → scores), Pipeline kanban, Nexus AI chat

### Minimalism Audit ❌

| Issue | Severity |
|-------|----------|
| Sidebar shows ALL items regardless of relevance to consultant workflow | High |
| "Scoring Runs" is a debug/technical page — not useful for daily work | Medium |
| "Candidate Report" link points to `/mandates/lens` — confusing label | Medium |
| No "My Mandates" or "My Pipeline" personalization — everything is global | High |
| Scheduler is a generic calendar with no mandate/interview integration | Medium |

### Intuitiveness Audit ⚠️

| Issue | Severity |
|-------|----------|
| Pipeline page uses old names (SWEEP, CANVA, GRID/LENS, PLACED) — meaningless to new consultants | Critical |
| Dashboard doesn't differentiate between "what I'm working on" vs "platform overview" | High |
| Nexus AI opens with methodology-heavy intro ("500+ executives across 47 markets") — intimidating for new users | Medium |
| No guided onboarding or "start here" flow after signup | High |
| Match page has 3 steps (gate → engine → results) but the gate step is a lead capture form — confusing UX | Medium |

### Business Value Audit ⚠️

| What Works | What's Missing |
|------------|----------------|
| AI match scoring (3 dimensions + verdicts) — strong differentiator | No daily task view ("what should I work on today?") |
| Pipeline kanban with stage movement | No time tracking or activity logging |
| Nexus AI with credit system | No integration between Nexus insights and mandate work |
| LinkedIn import | No bulk operations (move multiple candidates, batch update) |
| LENS export (shortlist PDF) | No email/comms integration for candidate outreach |

### Differentiation Score: 6/10
**Unique:** AI-powered 3-dimension scoring, LYC methodology embedded in scoring logic, Trident framework  
**Lost:** Methodology is invisible in the UI. A consultant using the platform doesn't feel the LYC difference — it looks like a generic ATS with AI scoring.

### Recommended Consultant Experience (Minimal)
```
Sidebar (consultant view):
├── My Dashboard (personalized: my mandates, my pipeline, today's tasks)
├── Mandates (my active mandates)
├── Pipeline (per mandate, new stage names)
├── Candidates (searchable, with scoring)
├── Nexus AI (contextual: related to current mandate)
├── Calendar (integrated: interviews, deadlines, follow-ups)
└── Settings
```

---

## 2. BD MANAGER (currently no dedicated role — uses consultant view)

### What They See Today
- **Exactly the same as a consultant.** No BD-specific navigation, metrics, or workflows.
- BD Pipeline components exist (PipelineKanban, PipelineMetrics, OpportunityDetail, DeferredAlerts) but are **not wired to any page**.

### Minimalism Audit ❌
BD Manager has no dedicated view — they see the full consultant sidebar which includes irrelevant items (Scoring Runs, Batch Scoring).

### Intuitiveness Audit ❌
- No "Business Development" section at all
- No opportunity tracking, lead pipeline, or relationship management
- BD metrics are buried in MetrixPage alongside consultant performance metrics

### Business Value Audit ❌

| What's Built (but orphaned) | What BD Actually Needs |
|------------------------------|----------------------|
| PipelineKanban (4 components) | Opportunity pipeline: prospect → meeting → proposal → mandate won/lost |
| PipelineMetrics | Revenue forecasting, win rate, avg mandate value |
| OpportunityDetail | Client relationship history, past mandates, referral tracking |
| DeferredAlerts | Re-engagement reminders for dormant clients |

### Differentiation Score: 1/10
**No BD-specific value visible.** A BD manager would see a consultant's ATS and have no idea this platform was designed for recruitment business development.

### Recommended BD Experience (Minimal)
```
Sidebar (BD view):
├── BD Dashboard (pipeline value, win rate, activity this week)
├── Opportunities (prospect → meeting → proposal → won/lost)
├── Clients (relationship history, past mandates, contacts)
├── Market Intel (company rankings, talent landscape for pitching)
├── Nexus AI (pitch prep, market briefings)
└── Settings
```

---

## 3. TEAM LEAD / PARTNER (lyc_admin — currently no differentiation)

### What They See Today
- **Same sidebar as consultant.** The only difference is Settings is visible (role-gated).
- No approval workflows visible
- No team oversight, delegation, or SLA monitoring
- SLA, Approval, and Timeline components are all built but **100% orphaned**

### Minimalism Audit ❌
Team Lead sees the same operational view as a junior consultant. No hierarchy, no oversight perspective.

### Intuitiveness Audit ❌
- No "Team Overview" — can't see what consultants are working on
- No approval queue — success profiles, offers, client submissions all go through unmonitored
- No SLA dashboard — mandate deadlines, at-risk mandates invisible

### Business Value Audit ❌

| What's Built (but orphaned) | What Team Lead Actually Needs |
|------------------------------|-------------------------------|
| WorkflowBuilder (approval flows) | One-click mandate health overview |
| ApprovalDetail, PendingApprovalsList | Approval queue (success profiles, offers, fee waivers) |
| DelegationManager | Delegate mandates, reassign candidates |
| PartnerSLADashboard, SLACountdown | SLA compliance across team |
| MandatesAtRisk, TimelineAnalytics | At-risk mandates dashboard |
| AnalyticsDashboard, ConsultantLeaderboard | Team performance rankings |

### Differentiation Score: 2/10
**LYC's partner-led model is a differentiator** — but the platform doesn't reflect it. Partners should see governance, quality control, and team leverage. Currently they see a consultant's workbench.

### Recommended Team Lead Experience (Minimal)
```
Sidebar (team lead view):
├── Partner Dashboard (team health, at-risk mandates, SLA status)
├── Approvals (queue: success profiles, offers, fee waivers)
├── Team (consultant load, performance, leaderboard)
├── All Mandates (portfolio view, not just "my")
├── Clients (strategic relationships, NPS, expansion opportunities)
├── Nexus AI (strategic advisory, market intelligence)
└── Settings + Team Management
```

---

## 4. CLIENT (client_admin / client_viewer)

### What They See Today
**Nothing.** The Client Portal component exists with Dashboard, Mandates, Pipeline, Reports, Team, Settings — but it's **not connected to any route**. A client logging in sees the consultant platform.

### This Is A Critical Failure

| What Should Exist | Current State |
|---|---|
| Client login → Client Portal | Client login → Consultant platform (confusing, wrong data) |
| See own mandates | See ALL mandates (data leak risk) |
| See candidate pipeline for their mandates | See everything |
| Request reports | Limited to what consultant shares |
| Team management (client_admin) | Not accessible |

### Business Value Audit ❌
Clients are the revenue source. They currently have **zero platform value**. They can't:
- Track mandate progress
- View candidate shortlists
- Approve success profiles
- Access reports
- Manage their own team's access

### Differentiation Score: 0/10
**Client portals are standard in executive search tech.** Not having one is a competitive disadvantage, not a differentiator.

### Recommended Client Experience (Minimal)
```
Client Portal:
├── My Mandates (status, progress, key milestones)
├── Active Shortlist (candidate cards, GRID/LENS reports)
├── Interview Schedule (upcoming, feedback requests)
├── Reports (downloadable PDFs, market maps)
├── Team (client_admin only: invite team members)
└── Settings
```

---

## 5. CANDIDATE (candidate role)

### What They See Today
**Almost nothing.** The Candidate Portal exists with Dashboard, Applications, Profile, Assessments, Career Insights, Settings — but it's **not connected to any route**.

The ONLY candidate-facing flow that works:
- B2C Landing → Assessment → Result (archetype + scores + PDF)
- That's it. No portal, no application tracking, no career insights.

### Business Value Audit ⚠️ (Partial)

| What Works | What's Missing |
|---|---|
| Assessment (SHIFT wizard) — strong product | No post-assessment portal |
| Instant archetype result + PDF | No application tracking |
| Clean 3-step flow on B2C landing | No career insights delivery |
| Credit-gated (free tier works) | No notification system for candidates |
| | No profile completion / job preferences |
| | No direct application to mandates |

### Differentiation Score: 4/10
**The assessment itself is differentiated** — leadership archetype, cross-border scoring, downloadable PDF. But it's a one-shot experience. Once the candidate gets their result, there's no reason to come back. The portal that would create stickiness (application tracking, career insights, job alerts) is built but unreachable.

### Recommended Candidate Experience (Minimal)
```
Candidate Portal:
├── My Profile (archetype, scores, preferences)
├── Applications (mandates I've been submitted to, status)
├── Interview Prep (if in pipeline: interview guides, company briefs)
├── Career Insights (market demand for my profile, benchmark)
└── Notification Settings
```

---

## 6. PLATFORM ADMIN (super_admin)

### What They See Today
- Full platform access (same as consultant + Settings)
- Org Intelligence page (admin-only route: CSV upload, talent pool, evaluations, scoring, one-pager)
- No user management
- No credit management
- No system configuration

### Minimalism Audit ⚠️
Admin view is mostly OK — they need everything. But:
- Org Intel is powerful but requires CSV upload workflow — no direct Supabase management
- No quick admin actions (reset user password, grant credits, disable user)
- No system health monitoring

### Business Value Audit ⚠️

| What Exists | What's Missing |
|---|---|
| Org Intelligence (5 tabs) | User management (create, edit, disable) |
| AdminRoute for org-intel | Credit management (grant, adjust, view all) |
| | System configuration (feature flags, tier settings) |
| | Audit log viewer |
| | Data management (migration status, backup) |

### Differentiation Score: N/A
Admin tools are operational necessities, not differentiators. Current state is "functional but basic."

---

## 7. CROSS-CUTTING ISSUES (Affects All User Types)

### 7.1 Architecture Debt

| Issue | Impact |
|-------|--------|
| **Dual auth systems** — `useAuth` (Context, 2 pages) vs `useAuthStore` (Zustand, 26 pages) | Inconsistent user state; Settings/NexusPage may show different user than rest of app |
| **DS object duplicated** across 12 page files | Design changes require editing 12+ files; risk of inconsistency |
| **No centralized error boundary** | One broken component crashes the entire page |
| **146 orphaned components** | 92% of built features are invisible to users |

### 7.2 Information Architecture

| Issue | Impact |
|-------|--------|
| **Flat sidebar** — no sections, no grouping | Users must scan 12+ items to find what they need |
| **No role-based navigation** | Consultant sees irrelevant items; Team Lead misses oversight tools |
| **Two separate nav systems** (NavBar + AppLayout) | Public vs authenticated experience is disconnected |
| **Candidate Report link** points to `/mandates/lens` with suffix hack | Confusing URL and navigation pattern |

### 7.3 Onboarding & First Impression

| User Type | First Experience | Grade |
|-----------|-----------------|-------|
| Consultant | Landing → Signup → Generic dashboard with "Good morning" | C+ (no guided tour) |
| BD Manager | Same as consultant — no BD context | F (wrong experience) |
| Team Lead | Same as consultant — no oversight context | F (wrong experience) |
| Client | Sees consultant platform with data they shouldn't access | F (security risk) |
| Candidate | B2C landing → Assessment → Done (no portal) | B- (good assessment, dead end after) |
| Admin | Sees everything, no admin dashboard | C (functional but basic) |

---

## 8. UNIQUENESS & DIFFFERENTIATION AUDIT

### What Makes LYC/DEX AI Unique (On Paper)

| Differentiator | In Codebase? | In Live UX? |
|----------------|--------------|-------------|
| TRIDENT scoring methodology | ✅ Full engine | ❌ Invisible — just shows "score" |
| GRID longlist deliverable | ✅ Components built | ⚠️ Button exists but no context |
| LENS shortlist deliverable | ✅ Export works | ⚠️ Works but unexplained |
| SHIFT leadership assessment | ✅ Full wizard | ✅ Works (B2C only) |
| Cross-border executive intelligence | ✅ Nexus AI prompts | ⚠️ Mentioned in chat, not in data |
| Talent density / org mapping | ✅ Org Intel module | ✅ Works (admin only) |
| LYC methodology-native data model | ✅ Every entity maps to framework | ❌ Users don't see the connection |

### The Core Problem
**LYC's methodology IS the differentiator. But the platform hides it behind generic SaaS UX.**

A user opening DEX AI sees: Dashboard, Pipeline, Candidates, Companies — same as Bullhorn, JobAdder, or Lever. The LYC magic (TRIDENT, GRID, LENS, SHIFT) is in the code but not in the experience.

### Differentiation Fix (Direction, Not Spec)
The platform should make methodology **visible and visceral**:
1. **Every candidate card** should show TRIDENT dimensions (not just a score)
2. **Every mandate** should show the GRID → LENS progression (not "SWEEP → CANVA")
3. **Nexus AI** should reference the user's actual mandates and candidates (not generic prompts)
4. **Assessment results** should connect to live mandates ("Your profile matches 3 open mandates")
5. **Client-facing outputs** should carry the LYC methodology brand (GRID Report, LENS Shortlist)

---

## 9. PRIORITIZED REMEDIATION

### P0 — Critical (Security / Data Leak)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Client sees consultant platform (data leak) | Wire Client Portal to route; gate by role |
| 2 | No role-based data scoping | Add org_id filtering to all Supabase queries |
| 3 | Dual auth inconsistency | Consolidate to useAuthStore; remove AuthContext |

### P1 — High (User Experience)

| # | Issue | Fix |
|---|-------|-----|
| 4 | Role-based sidebar navigation | Add role conditions to all nav items |
| 5 | Pipeline status names (SWEEP/CANVA) | Execute Phase 0.9 spec |
| 6 | No onboarding flow | Add "First Steps" wizard after signup |
| 7 | Candidate dead-end after assessment | Wire Candidate Portal to route |
| 8 | DS object duplication | Create `src/constants/designSystem.ts` |

### P2 — Medium (Business Value)

| # | Issue | Fix |
|---|-------|-----|
| 9 | Wire BD pipeline components | New BD section in sidebar + page |
| 10 | Wire approval workflow components | Partner approval queue page |
| 11 | Wire SLA/timeline components | Team lead oversight dashboard |
| 12 | Wire interview/offer components | Interview scheduling + offer management pages |
| 13 | Integrate Nexus AI with mandate data | Contextual AI responses based on active mandates |

### P3 — Low (Polish)

| # | Issue | Fix |
|---|-------|-----|
| 14 | Sidebar grouping/sections | Group nav items: "Work", "Intelligence", "Admin" |
| 15 | Scheduler integration | Connect calendar to interview/offer events |
| 16 | PWA bottom navigation | Wire mobile nav for candidate/client portals |
| 17 | Error boundaries | Add per-page error boundaries |

---

## 10. COMPONENT WIRING STATUS (Full Inventory)

| Component Directory | Components | Wired | Orphaned | User Type Served |
|---|---|---|---|---|
| admin | 1 | 1 | 0 | Admin |
| ai | 3 | 0 | **3** | Consultant |
| alumni | 4 | 0 | **4** | Consultant |
| analytics | 5 | 0 | **5** | Team Lead |
| approvals | 5 | 0 | **5** | Team Lead |
| assessment | 9 | 1 | 8 | Candidate |
| automation | 3 | 0 | **3** | Team Lead |
| background-checks | 3 | 0 | **3** | Consultant |
| bd | 4 | 0 | **4** | BD Manager |
| benchmark | 2 | 0 | **2** | Consultant |
| billing | 1 | 0 | **1** | Admin |
| candidate | 8 | 0 | **8** | Candidate |
| client | 5 | 0 | **5** | Client |
| compensation | 3 | 0 | **3** | Consultant |
| credits | 3 | 0 | **3** | All |
| dashboard | 2 | 0 | **2** | All |
| import | 2 | 0 | **2** | Consultant |
| interview | 3 | 0 | **3** | Consultant |
| mandate | 4 | 1 | 3 | Consultant |
| market | 3 | 1 | 2 | BD / Consultant |
| match | 6 | 1 | 5 | Consultant |
| nexus | 10 | 0 | **10** | All |
| notifications | 3 | 0 | **3** | All |
| offer | 4 | 0 | **4** | Consultant |
| org-intel | 6 | 1 | 5 | Admin |
| org | 5 | 0 | **5** | Consultant |
| outreach | 3 | 1 | 2 | Consultant |
| pipeline | 5 | 0 | **5** | Consultant |
| pwa | 4 | 0 | **4** | Candidate/Client |
| questions | 3 | 0 | **3** | All |
| reference | 4 | 0 | **4** | Consultant |
| reports | 2 | 0 | **2** | Team Lead |
| saved-searches | 4 | 0 | **4** | Consultant |
| sla | 4 | 0 | **4** | Team Lead |
| solution | 3 | 0 | **3** | Consultant |
| timeline | 5 | 0 | **5** | Team Lead / Client |
| ui | 8 | 8 | 0 | Shared |
| **TOTAL** | **158** | **~12** | **~146** | — |

---

*Audit conducted 2026-06-24. Based on codebase at commit 3cf4e22 (main). Audit mode — spec writing only.*
