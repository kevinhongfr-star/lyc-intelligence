# Phase 4 — Internal Admin Portal

**Status:** Draft v1.0
**Owner:** Trae (full-stack)
**Priority:** P0 — team daily driver; replaces Feishu sheets and v1 internal dashboard
**Estimated effort:** 4–5 weeks (~300–366h, 51 tickets)
**Predecessor:** Phase 3 (v1 API framework + candidate portal router + migrations + tests). Portal shell, design system, and core data model already exist.
**Success metric:** Consultants and recruiters log in daily; ≥80% of mandate-pipeline-candidate actions happen in-portal (vs. Feishu sheets); weekly "where's X candidate?" Slack queries drop by ≥70%.

---

## Why This Phase Exists

Phase 3 delivered the v1 API framework, data model, and candidate portal router — the plumbing. Phase 6 is building the B2C candidate experience — the outward face. But the internal team still lives in Feishu sheets, manual emails, and a half-built v1 dashboard that never reached executive density.

That creates four compounding problems:

1. **Fragmented workflow.** Consultants juggle Feishu sheets for pipeline tracking, separate docs for candidate profiles, email for outreach, and calendar for interviews. Context-switching eats 2–3 hours per day per consultant.
2. **No single source of truth.** Candidate data lives in multiple sheets with inconsistent naming, stage labels, and ownership. A candidate can be "shortlisted" in one sheet and "sourced" in another.
3. **Zero visibility into team capacity.** No one knows who's working on what, which mandates are stuck, or where pipeline bottlenecks are — until it's too late and a search slips schedule.
4. **Manual reporting.** Every Friday, consultants spend 2–3 hours compiling status updates for the team sync. That's 10–15% of billable time spent on status reporting instead of sourcing.

The Internal Admin Portal is the team's daily driver. It's where consultants, recruiters, and partners manage mandates, browse candidates, run pipelines, launch outreach campaigns, and get analytics. It replaces Feishu sheets with a real product — and it's the foundation that Phase 8 (Client Portal) and Phase 9 (Candidate Outreach) build on top of.

### Value & Impact Metrics

| # | Metric | Current State | Target State | Impact |
|---|--------|--------------|--------------|--------|
| V1 | Consultant context-switches / day | 15–20 (sheets, email, calendar, docs) | 3–5 (all in portal) | High — directly recovers 2–3h/day per consultant |
| V2 | Pipeline data consistency across tools | ~60% (manual sync across sheets) | 100% (single source of truth) | High — eliminates candidate-stage confusion |
| V3 | Weekly status report prep time | 2–3h / consultant / week | ≤20 min (auto-generated) | High — recovers billable capacity |
| V4 | "Where's candidate X?" Slack queries | 5–10 / day across team | 0–2 / day | High — reduces interruptions |
| V5 | Team capacity visibility | None (manual guesswork) | Real-time dashboard (mandates × assignees × stages) | Medium — better resource allocation |
| V6 | Candidate search / lookup speed | 2–5 min (find the right sheet, search, verify) | ≤10 sec (global search) | Medium — daily quality-of-life multiplier |

**Launch requirement:** All 6 milestones complete; end-to-end RBAC tested; Feishu sheet data fully migrated; 2-week team beta with zero critical bugs.
**Hard gates (cannot launch without):** M1 (mandate hub — the entry point), M2 (candidate database — the core entity), M3 (pipeline board — where work happens).

---

## What's Already Built (Legacy / Partial)

| Module | Location | State |
|--------|----------|-------|
| Internal dashboard shell | v1 API + `src/pages/internal/` | Skeleton — basic layout + stub pages |
| Candidate data model | Supabase migrations + v1 API | Core schema exists (`candidates`, `mandates`, `candidate_mandate_stages`, etc.) |
| PipelineBoard component | `src/components/pipeline/` | Exists — needs polish + production data wiring |
| v1 internal API endpoints | `v1/internal/*` | Stubbed — needs implementation + RBAC |
| User auth + roles | Supabase Auth + `user_roles` table | Schema exists — needs internal role definitions |
| MARIA outreach system | Phase 9 integration point | Separate system — needs API integration layer |
| KPI / metrics tables | Supabase analytics schema | Partial — needs audit + expansion |
| Internal dashboard visual upgrade tickets | `internal-dashboard-visual-upgrade-tickets.md` | Spec'd — included as M5 sub-tickets |

---

## Milestones

### M1 — Mandate Hub
**Effort:** 56–64h | **Priority:** P0 (hard gate — entry point for all work)

Everything needed to browse, create, and manage mandates. This is the landing page for internal users — their home base, the thing they check first thing in the morning.

#### Tickets

**T-M1: Mandate List View**
- Grid/list toggle for all active mandates
- Each mandate card: title, client, status, stage progress (mini funnel), assignee, health indicator, last updated
- Filters: status (active/paused/closed/won), client, assignee, practice area, priority
- Search by mandate title, client name, or mandate ID
- Sort by last updated, created date, assignee, health
- P0, 6–8h

**T-M2: Mandate Detail — Overview Tab**
- Mandate header: title, client, practice area, priority, status, start date, target close date
- Key metrics widget: total candidates in pipeline, interviews this month, time-to-shortlist, time-to-fill projection
- Assignees section: lead consultant, recruiter(s), partner
- Description / mandate brief (rich text)
- Client contact list (linked to client profile)
- P0, 8–10h

**T-M3: Mandate Detail — Pipeline Tab**
- Kanban board view of candidates across mandate stages
- Candidate cards: name, photo/initials, current stage, days in stage, match score (TRIDENT) badge, last activity
- Drag-and-drop between stages (with confirmation + stage-change reason prompt)
- Stage counts + velocity indicators
- Click candidate card → opens candidate drawer (from M2)
- P0, 8–10h

**T-M4: Mandate Detail — Candidates Tab (Table View)**
- Table view alternative to board: sortable, filterable candidate list
- Columns: name, current stage, days in stage, match score, source, last contacted, next action, assignee
- Bulk actions: assign, change stage, add tag, export
- Row click → opens candidate drawer
- P0, 5–7h

**T-M5: Mandate Detail — Interviews & Activity Tab**
- Upcoming interviews list: candidate, date/time, interviewer, type (phone/video/in-person), location/link
- Past interviews: list with feedback summary snippets
- Activity feed: stage changes, notes added, documents uploaded, outreach sent, interviews scheduled
- Filter activity by type, user, date range
- P0, 6–8h

**T-M6: Mandate Create / Edit Flow**
- Multi-step form: basic info → client selection → team assignment → brief / description → stage configuration
- Client lookup (search existing clients or quick-create stub)
- Mandate template selection (default stage pipeline per practice area)
- Auto-generated mandate ID + URL slug
- P0, 7–9h

**T-M7: Mandate Settings & Admin**
- Mandate status management (active → paused → closed → won)
- Stage pipeline customization (add/remove/reorder stages, rename, set SLA per stage)
- Team member assignment + role (lead / support / observer)
- Client contact management
- Delete / archive (with confirmation + impact warning)
- P0, 6–8h

**T-M8: Mandate Search & Quick Actions Bar**
- Global mandate search bar (accessible from anywhere via Cmd+K)
- Quick-create mandate button
- Recent / starred mandates quick access
- "My mandates" sidebar widget (for consultants — shows their active mandates with health dots)
- P0, 4–6h

---

### M2 — Candidate Database
**Effort:** 64–72h | **Priority:** P0 (hard gate — core entity of the whole system)

The candidate database is the heart of the internal portal. Every consultant lives here — searching, reviewing, and managing candidate profiles. This milestone delivers search, profile view, and candidate management.

#### Tickets

**T-C1: Candidate Search & Filtering**
- Full-text search across name, title, company, skills, education, notes
- Advanced filters: practice area, seniority level, location, status, source, tags, languages, salary range
- Saved search views (bookmark a filter set)
- Search results: list view with candidate cards (photo, name, title, company, location, key skills tags, match score for mandate-context searches)
- Sort by relevance, last updated, name, seniority
- P0, 8–10h

**T-C2: Candidate Profile — Header & Core Info**
- Profile header: name, photo, headline/title, current company, location, contact info (email, phone, LinkedIn)
- Key stats: total mandates active in, total interviews, last contact date, source
- Quick action buttons: add to mandate, send message, schedule interview, add note
- Status badge (active / passive / placed / do-not-contact / archived)
- P0, 6–8h

**T-C3: Candidate Profile — Experience & Education**
- Work experience timeline: company, title, dates, description, achievements (parsed from resume + editable)
- Education history: school, degree, field, graduation year
- Skills / expertise tags (editable, with autocomplete from skill library)
- Languages spoken (with proficiency level)
- P0, 7–9h

**T-C4: Candidate Profile — Mandates & Pipeline History**
- List of all mandates the candidate is/was in, with stage history
- Per-mandate: current stage, days in each stage, outcome (active / shortlisted / interviewed / offered / placed / withdrawn / rejected)
- Stage change timeline with timestamps + who moved them
- Click mandate → jumps to that mandate's pipeline with candidate highlighted
- P0, 7–9h

**T-C5: Candidate Profile — Notes & Activity Feed**
- Notes section: consultant notes, meeting summaries, feedback (sorted by date)
- Note author, timestamp, and whether the note is private (only visible to author) or shared (visible to all internal team on the mandate)
- Activity feed: stage changes, documents uploaded, messages sent, interviews scheduled, notes added
- Filter activity by type, user, date range
- P0, 7–9h

**T-C6: Candidate Profile — Documents & Assessments**
- Document library: resume (CV), cover letter, assessments, work samples, references
- Upload / replace / delete documents
- Document viewer (inline preview — PDF, DOCX)
- Version history for resume / key documents
- Assessment results display (framework scores, personality, cognitive — integration with Phase 5)
- P0, 8–10h

**T-C7: Candidate Add / Import**
- Quick-add candidate form (name, email, company, title — minimal fields)
- Bulk import via CSV / spreadsheet upload (with column mapping)
- LinkedIn profile import (paste LinkedIn URL → parse basic info — one-click add, requires validation)
- Deduplication check on email / LinkedIn URL before creating
- P0, 8–10h

**T-C8: Candidate Tags, Lists & Segmentation**
- Tag system: custom tags per candidate (e.g., "high-potential", "CFO-ready", "Shanghai-based")
- Candidate lists / folders: static lists (manually curated) and dynamic lists (saved searches)
- Bulk tag add/remove
- Tag management (rename, merge, delete)
- P1, 5–7h

**T-C9: Candidate Merge & Deduplication**
- Deduplication suggestions (based on email, LinkedIn, name + company similarity)
- Merge tool: pick primary record, selectively merge fields from duplicates
- Merge history + undo capability
- P1, 4–6h

---

### M3 — Pipeline Board
**Effort:** 48–56h | **Priority:** P1 (builds on existing PipelineBoard component from v1)

The pipeline board is where the actual work of recruiting happens — moving candidates through stages, tracking velocity, and managing bottlenecks. This milestone takes the existing PipelineBoard component and hardens it for production use.

#### Tickets

**T-P1: Pipeline Board — Production Hardening**
- Take existing PipelineBoard component, audit, fix bugs, and productionize
- Real data wiring (replace mock data with v1 API calls)
- Proper error handling, loading states, empty states
- Keyboard shortcuts for power users (arrow keys, space to open, number keys to jump to stage)
- P0, 7–9h

**T-P2: Stage Transitions & Audit Trail**
- Drag-and-drop between stages with smooth animation
- Stage-change confirmation dialog: reason for move, optional note, notify assignee toggle
- Automatic stage-entry timestamp + SLA timer start
- Full audit trail of every stage change (who, when, from → to, reason)
- Bulk stage changes (select multiple candidates, move all to new stage)
- P0, 6–8h

**T-P3: Pipeline Velocity & SLA Tracking**
- Days-in-stage counter on each candidate card (color-coded: green = on track, amber = approaching SLA, red = over SLA)
- Stage SLA configuration per mandate (default per practice area template)
- SLA breach alerts (notification in feed + badge on mandate)
- Stage throughput metric (candidates moved through this stage / week)
- P1, 6–8h

**T-P4: Candidate Card Expand / Quick Actions**
- Hover / click to expand candidate card with quick info snippet
- Quick actions on card: add note, send message, schedule interview, view full profile
- Match score badge (TRIDENT) with tooltip breakdown
- Stage-entry date + days-in-stage
- Assignee avatar / initials
- P1, 5–7h

**T-P5: Pipeline Board — Filtering & Views**
- Filter candidates on board by assignee, source, match score range, tags, days-in-stage range
- "My candidates" view (only show candidates assigned to current user)
- "Stuck candidates" view (SLA breached or approaching)
- Saved views (remember filter + sort configuration)
- P1, 6–8h

**T-P6: Funnel Metrics & Conversion Rates**
- Funnel visualization at top of pipeline: count per stage + conversion % between stages
- Conversion rate benchmarks (industry / company average)
- Drop-off analysis: which stage loses the most candidates, and why (from stage-change reasons)
- Time-in-stage averages per stage
- P1, 5–7h

**T-P7: Pipeline Board — Interview Integration**
- Candidates with upcoming interviews show interview badge + date on card
- Interview feedback score visible on card (if available)
- Quick-schedule interview action from card
- Interview stage auto-advancement (when feedback is submitted and marked "move forward")
- P1, 5–7h

---

### M4 — Campaigns Console
**Effort:** 48–56h | **Priority:** P1 (MARIA outreach automation — integration point)

The campaigns console is the outbound engine. It's where recruiters build candidate lists, write outreach sequences, and launch MARIA-powered email campaigns. This milestone integrates the existing MARIA system into the internal portal.

#### Tickets

**T-CP1: Campaigns List & Dashboard**
- Campaigns list view: name, associated mandate, status (draft / running / paused / completed), total recipients, sent, replies, positive reply rate
- Key metrics: reply rate, positive reply rate, opt-out rate, bounce rate
- Filters: by mandate, by status, by owner, by date range
- "New campaign" CTA prominently placed
- P1, 5–7h

**T-CP2: Campaign Builder — Audience Selection**
- Step 1: Choose target mandate (or no mandate = general outreach)
- Step 2: Select candidate list / saved search / manual selection
- Audience preview: count, breakdown by seniority / company / location
- Deduplication: check against past campaign recipients (exclude if contacted in last X days)
- P1, 7–9h

**T-CP3: Campaign Builder — Email Sequence Editor**
- Multi-step email sequence builder (1st email, follow-up 1, follow-up 2, etc.)
- Template library: outreach templates per practice area + per role type
- Personalization variables: {{first_name}}, {{company}}, {{title}}, etc.
- Template preview (desktop + mobile)
- Schedule: send time, days between follow-ups, timezone handling
- P1, 8–10h

**T-CP4: Campaign Launch & Scheduling**
- Final review before launch: audience count, email previews, schedule timeline
- Test send to self before launching
- Launch confirmation with warning (can't be undone — you can pause but recipients who already got emails can't un-receive)
- Pause / resume campaign
- Cancel / end campaign (closes it, no more sends)
- P1, 5–7h

**T-CP5: Campaign Analytics & Performance**
- Per-campaign performance dashboard
- Metrics: open rate, click rate, reply rate, positive reply rate, bounce rate, opt-out rate
- Per-step performance (which email in the sequence gets the most replies)
- Reply classification: positive / neutral / negative / out-of-office
- A/B test results display (if campaign had variants)
- P1, 6–8h

**T-CP6: Reply Inbox & Handling**
- Unified inbox for all campaign replies
- Reply threading + context (which campaign, which step, full history)
- Quick actions: mark as positive / neutral / negative, move candidate to mandate stage, add note, schedule follow-up
- Out-of-office auto-detection + auto-reschedule reply
- Integration with consultant's own email (replies go to both portal inbox and consultant's email)
- P1, 7–9h

**T-CP7: MARIA Integration Layer**
- API integration with MARIA system (the existing outreach automation)
- Sync campaign status, delivery events, replies back from MARIA to portal
- Sync candidate lists from portal to MARIA
- Error handling + retry for failed syncs
- Webhook endpoints for MARIA → portal real-time updates
- P1, 10–12h

---

### M5 — Analytics & Reporting
**Effort:** 70–78h | **Priority:** P1 (includes 10 visual upgrade tickets from internal-dashboard-visual-upgrade-tickets.md)

Turn raw data into actionable insight for the team. This covers KPI dashboards, mandate health scoring, executive reporting, and the full visual density upgrade.

#### Tickets

**T-A1: Executive Dashboard — KPI Overview**
- Top-level KPIs: active mandates, total candidates in pipeline, interviews this week, placements this month, time-to-fill average, time-to-shortlist average
- Period comparison: vs. last week / last month / same period last quarter
- KPI cards with delta indicators (up/down, percentage)
- Filter by date range, practice area, partner
- P0, 5–7h

**T-A2: Mandate Health Scoring**
- Health algorithm: combines pipeline velocity, stage balance, interview frequency, days since last activity, candidate quality (match score distribution)
- Health indicator (green / amber / red) on mandate cards + detail page
- Health trend over time (sparkline)
- Health breakdown: "why is this mandate amber?" (e.g., "no interviews in 14 days", "candidate quality in stage 2 is low")
- P1, 7–9h

**T-A3: Pipeline Analytics**
- Pipeline funnel across all mandates (or filtered set)
- Stage-by-stage conversion rates
- Time-in-stage benchmarks vs. actual
- Bottleneck analysis: which stages are slow, which are leaky
- Source effectiveness: which candidate sources produce the most placements / highest quality
- P1, 6–8h

**T-A4: Team Performance Dashboard**
- Per-consultant metrics: active mandates, candidates sourced, interviews conducted, placements made, time-to-shortlist average
- Per-recruiter metrics: candidates sourced, response rate, interviews arranged
- Team capacity view: who's overloaded, who has bandwidth
- Leaderboards (optional — configurable by admin)
- P1, 6–8h

**T-A5: Reporting — Mandate Status Report Generator**
- Auto-generated mandate status report (one-pager format, matching v15 HTML pipeline quality)
- Export to PDF / HTML / print
- Sections: mandate overview, pipeline funnel, candidate highlights, key risks, next steps
- Customizable: choose which sections to include, date range
- One-click share to client (integration with Phase 8 — client portal document share)
- P1, 6–8h

**T-A6: Weekly Team Report Auto-Generation**
- Auto-generated weekly team report: all mandate statuses, key metrics, wins, risks, next week's priorities
- Sends every Friday at EOD
- Editable before sending (consultants can add narrative context)
- Export / share options
- P1, 4–6h

**Visual Upgrade Tickets (D-1 through D-10)**
- D-1: Executive Density Design Token Override — tighter spacing, denser typography, sharper borders for dashboard views (4–6h, P0)
- D-2: KPI Stat Card Redesign — compact layout, delta inline, tabular figures, 4 variants (3–4h, P0)
- D-3: Funnel Visualization Overhaul — tighter funnel, stage labels inside bars, conversion % inline (3–4h, P0)
- D-4: Pipeline Board Visual Polish — thinner cards, denser stage columns, stage headers with counts (4–6h, P1)
- D-5: Candidate Table Density Upgrade — tighter rows, smaller font, more columns visible (3–4h, P1)
- D-6: Activity Feed Timeline Refresh — compact timeline, better iconography, density toggle (3–4h, P1)
- D-7: Mandate Health Visual System — health dots, trend sparklines, breakdown tooltips (4–5h, P1)
- D-8: Chart & Graph Styling Pass — consistent chart styling across all analytics views (4–6h, P1)
- D-9: Print / PDF Export Quality — print stylesheet, page breaks, export to PDF matching v15 quality (5–7h, P1)
- D-10: Dashboard Layout Grid System — responsive dashboard grid, widget resizing, save layout (5–7h, P1)

---

### M6 — Team & Settings
**Effort:** 48–52h | **Priority:** P1 (RBAC, billing, audit log, general admin)

The administrative backbone of the portal: user management, roles and permissions, billing, audit logs, and system settings.

#### Tickets

**T-S1: User Management**
- User list: name, email, role, status (active / invited / disabled), last login, mandates count
- Invite new user flow: email, role, assign to practice area(s)
- User profile: edit name, title, avatar, contact info, timezone
- Disable / re-enable user
- Password reset (admin-initiated)
- P0, 6–8h

**T-S2: Role-Based Access Control (RBAC)**
- Role definitions:
  - `admin` — full access to everything, including user management + billing + settings
  - `partner` — full access to all mandates + candidates + analytics; can manage users but not billing
  - `consultant` — access to their own mandates + shared candidates; can create mandates
  - `recruiter` — access to assigned mandates + candidate database; sourcing focus
  - `analyst` — read-only access to dashboards + reports; no candidate editing
- Permission matrix page (admin view) showing which roles can do what
- Per-mandate role overrides (e.g., a recruiter can be "lead" on a specific mandate with elevated permissions)
- P0, 8–10h

**T-S3: Audit Log**
- Comprehensive audit log of all significant actions: logins, mandate changes, stage changes, user management, permission changes, data exports
- Filters: by user, by action type, by date range, by entity (mandate, candidate, user)
- Searchable + exportable (CSV)
- Data retention: 2 years default, configurable
- P0, 6–8h

**T-S4: Billing & Subscription**
- Subscription plan overview (current plan, seats, billing cycle, next billing date)
- Usage metrics: active users, candidates, mandates, storage used
- Invoices list + PDF download
- Payment method management
- Plan upgrade / downgrade flow (admin-only)
- P1, 6–8h

**T-S5: Notification Preferences**
- Global notification settings: email, in-app, digest frequency
- Per-type preferences: stage changes, mentions, new candidates added, interview scheduled, SLA breaches, campaign replies
- Digest options: real-time, daily digest, weekly digest
- Do-not-disturb hours
- P1, 5–7h

**T-S6: Integrations & API Keys**
- Integration status page: MARIA, Supabase, email service, calendar sync
- API key management: create, revoke, set permissions, see last used
- Webhook configuration (for outbound integrations)
- Integration setup guides
- P1, 5–7h

---

## Ticket Summary

| Milestone | Tickets | Effort | Priority |
|-----------|---------|--------|----------|
| M1 — Mandate Hub | 8 | 56–64h | P0 |
| M2 — Candidate Database | 9 | 64–72h | P0 |
| M3 — Pipeline Board | 7 | 48–56h | P1 |
| M4 — Campaigns Console | 7 | 48–56h | P1 |
| M5 — Analytics & Reporting | 14 (6 analytics + 10 visual) | 70–78h | P1 |
| M6 — Team & Settings | 6 | 48–52h | P1 |
| **Total** | **51** | **334–380h** | — |

---

## Launch Criteria

1. **M1–M3 Complete:** Mandate hub, candidate database, and pipeline board are all production-ready — the team's core workflow is fully in-portal
2. **Data Migration:** Feishu sheet data (candidates, mandates, pipeline stages) fully migrated with 100% row-level audit
3. **RBAC Verified:** All 5 roles pass full authorization test suite covering all modules
4. **Search Quality:** Candidate search returns relevant results in ≤500ms; top-3 precision ≥90% on common search queries
5. **Board Performance:** Pipeline board loads in ≤1.5s for a mandate with 100+ candidates
6. **Audit Log Coverage:** All significant user actions logged and searchable
7. **Mobile Responsive:** Works on laptop + tablet (mobile is nice-to-have, not required for launch)
8. **2-Week Beta:** Internal team beta with zero P0/P1 bugs remaining; P2 bugs < 10
9. **Adoption Signal:** ≥70% of team daily activities (candidate lookups, stage changes, note adds) happening in portal by end of beta

---

## Dependencies

| Dependency | Phase / Source | What We Need | Timing |
|-----------|---------------|-------------|--------|
| Portal shell + design system | Phase 3 | Internal portal shell, layout, base components | Already exists; needs rewire + density upgrade |
| v1 API framework | Phase 3 | v1/internal endpoints, data model, migrations | Already stubbed; needs full implementation |
| Candidate data model | Phase 3 | `candidates`, `mandates`, `candidate_mandate_stages`, etc. | Schema exists — verify + extend as needed |
| User auth + roles | Phase 3 / Supabase Auth | Auth system, user roles table | Schema exists — needs internal role definitions |
| PipelineBoard component | v1 / existing | Base pipeline board component | Exists — needs hardening + visual polish |
| MARIA outreach system | Phase 9 | Outreach automation API | Integration needed for M4; can launch without M4 first |
| Document system | Phase 7 | Document upload, storage, viewer | Needed for M2 candidate documents; Phase 7 runs in parallel |
| Email service | Platform | Transactional emails, notifications | Already exists |
| Calendar / interview scheduling | Phase 4 M3 or Phase 10 | Interview scheduling model | Basic version in M3; full calendar integration deferred to Phase 10 |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data migration from Feishu sheets is messy / lossy | High | High — team can't trust the system | Thorough migration audit; run in dual-write mode for 2 weeks; rollback plan |
| Consultants resist adopting new tool and fall back to sheets | Medium | High — wasted build effort | Make portal strictly better (faster search, better pipeline view, auto-reports); phase out sheet access gradually; designate power users / champions |
| Search quality is poor → users don't trust it | Medium | High — fundamental workflow failure | Invest in proper search infrastructure (Postgres full-text + ranking); iterative tuning with real user queries; measure top-N precision |
| Pipeline board is slow with large datasets | Medium | Medium — daily frustration | Virtualize long lists, paginate API calls, optimize queries; load-test with 500+ candidate mandates |
| RBAC misconfiguration — users see data they shouldn't | Low | Critical — trust + legal | Comprehensive RBAC test suite covering all 5 roles × all modules; security review before launch |
| MARIA integration is harder than expected | Medium | Medium — M4 delayed | Decouple M4 from M1–M3 launch; ship core portal first, add campaigns console as Phase 4.5 if needed |
| Customization requests explode during beta | High | Medium — scope creep | Clear non-goals list; gather feedback but batch into post-launch v2; strict change control during beta |

---

## Success Metrics

### Adoption
- 100% of internal team members have portal accounts within 1 week of launch
- ≥80% of team members log in daily by end of month 1
- ≥80% of pipeline stage changes happen in-portal (vs. sheets) by end of month 2

### Efficiency
- Consultant time spent on status updates: reduced from 2–3h/week to ≤20 min/week
- Candidate lookup time: reduced from 2–5 min to ≤10 sec
- Weekly report generation: reduced from 2–3h to ≤15 min (auto-generated)
- "Where's X candidate?" Slack queries: reduced by ≥70%

### Quality
- Data consistency: 100% single source of truth (no duplicate candidate records with conflicting stages)
- Search top-3 precision ≥90%
- Team NPS for portal experience ≥50
- Zero data security incidents (RBAC verified by audit)

### Business Impact
- Time-to-shortlist: 10–15% reduction (faster pipeline movement, better visibility)
- Consultant capacity: 2–3h/day recovered per consultant → ~10–15% more sourcing capacity
- Placement rate improvement: measurable uplift within 2 quarters (from better pipeline management + faster movement)

---

## Non-Goals

- ❌ Client-facing features (that's Phase 8)
- ❌ Candidate-facing portal features (that's Phase 6 + Phase 9)
- ❌ AI / automated candidate matching (that's Phase 5 — TRIDENT integration)
- ❌ Full calendar / meeting scheduling integration (deferred to Phase 10)
- ❌ Video interview platform integration
- ❌ Full invoicing / payment processing (read-only billing view only for now)
- ❌ Multi-language / i18n (English only for launch)
- ❌ Mobile-first design (desktop + tablet only for launch)
- ❌ Native mobile apps
- ❌ Referral program or candidate self-sourcing features
- ❌ Real-time chat / messaging between team members (Slack integration later)

---

## Technical Constraints

- All data through v1 API (`v1/internal/*` endpoints), scoped by RBAC
- Reuse portal shell from Phase 3 (rewire, don't rebuild)
- Reuse PipelineBoard component from v1 (harden, don't rewrite)
- Supabase Postgres as primary database
- TypeScript strict — zero TS errors
- Tests for all v1/internal endpoints + RBAC policy tests for all internal tables/views
- Visual density upgrade follows `internal-dashboard-visual-upgrade-tickets.md` spec
- Branch: `feature/eo4-candidate-portal-v2` (this branch)
- Deploy to staging after each milestone; production deploy only after full beta
