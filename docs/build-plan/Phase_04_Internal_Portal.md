# Phase 4: Internal Portal (Consultant & Admin Dashboard)

**Goal:** Build the fully functional Internal Portal for consultants and admins — mandate management, pipeline visualization, consultant KPIs, scoring dashboards, and administrative tools.

**Pre-requisites:** Phase 1-3 complete (DB secure, API ready, components available).

**Gap Context:** Trae's S1-T11 (Client Portal Pipeline Dashboard) and S1-T13 (Consultant KPI Dashboard) exist as issues but have no implementation. All scoring views, pipeline dashboards, and admin tools are unimplemented.

---

## Sprint 4.1 — Internal Dashboard & Mandate Management

| # | Ticket |
|---|--------|
| 4.1.01 | Build Internal dashboard page — overview widgets, quick stats, recent activity |
| 4.1.02 | Build Mandate list page — DataTable with search, filter by status/priority/client/consultant |
| 4.1.03 | Build Mandate detail page — header with status badge, tabs for candidates/files/notes/timeline |
| 4.1.04 | Build Mandate creation form — client selector, position details, requirements, priority |
| 4.1.05 | Build Mandate edit form — inline editing for key fields, change audit trail |
| 4.1.06 | Build Mandate status workflow — draft → active → on-hold → closed with validation rules |
| 4.1.07 | Build Mandate milestone tracker — visual timeline with editable milestones |
| 4.1.08 | Build Mandate team assignment — assign/remove consultants, set lead consultant |
| 4.1.09 | Build Mandate documents tab — upload/view proposals, contracts, client briefs |
| 4.1.10 | Build Mandate notes/activity log — chronological feed of all actions on mandate |
| 4.1.11 | Build Mandate bulk actions — bulk status change, bulk assign, bulk export |
| 4.1.12 | Build Mandate export — PDF/Excel export of mandate details and pipeline |
| 4.1.13 | Build Mandate KPI widgets — time to fill, candidates presented, interview rate, placement rate |
| 4.1.14 | Build Mandate search with full-text — search across title, company, description, skills |
| 4.1.15 | Build Mandate filter presets — save/load custom filter combinations |
| 4.1.16 | Build Mandate real-time updates — live status changes via Supabase Realtime |
| 4.1.17 | Build Mandate conflict resolution — handle concurrent edits with last-write-wins |
| 4.1.18 | Build Mandate permission check — only assigned consultants + admins can edit |
| 4.1.19 | Build Mandate SLA indicator — visual warning when approaching deadline |
| 4.1.20 | Build Mandate archive — archive completed mandates, restore capability |
| 4.1.21 | Build Mandate duplicate — clone mandate with new client/title |
| 4.1.22 | Build Mandate template — save common mandate setups as reusable templates |
| 4.1.23 | Build Mandate notification triggers — alert on status change, new candidate, approaching SLA |
| 4.1.24 | Build Mandate integration test — full CRUD + workflow + permissions + real-time |
| 4.1.25 | Sprint 4.1 review — demo mandate management to stakeholders |

## Sprint 4.2 — Pipeline & Candidate Management (Internal View)

| # | Ticket |
|---|--------|
| 4.2.01 | Build Pipeline Kanban board — columns for each stage, drag-and-drop cards |
| 4.2.02 | Build Pipeline funnel chart — visual candidate count per stage with conversion rates |
| 4.2.03 | Build Pipeline filter by mandate — view all candidates for a specific mandate |
| 4.2.04 | Build Pipeline filter by consultant — view all candidates handled by consultant |
| 4.2.05 | Build Pipeline stage advancement — move candidate to next stage with confirmation |
| 4.2.06 | Build Pipeline stage rejection — move candidate back or to rejected with reason |
| 4.2.07 | Build Candidate card component — photo, name, score badge, current stage, mandate |
| 4.2.08 | Build Candidate quick view — slide-out drawer with key details without leaving pipeline |
| 4.2.09 | Build Candidate comparison — side-by-side comparison of 2-4 candidates for same mandate |
| 4.2.10 | Build Candidate scoring display — radar chart showing 5-criteria breakdown |
| 4.2.11 | Build Candidate tier badge — Gold/Silver/Bronze/Unranked with color coding |
| 4.2.12 | Build Candidate timeline — visual history of all interactions and stage changes |
| 4.2.13 | Build Candidate notes — internal notes visible only to team |
| 4.2.14 | Build Candidate bulk operations — bulk advance stage, bulk reject, bulk export |
| 4.2.15 | Build Pipeline statistics panel — total candidates, avg. score, stage distribution, velocity |
| 4.2.16 | Build Pipeline export — Excel/PDF export of pipeline state for client reporting |
| 4.2.17 | Build Pipeline alerts — stale candidates (no movement in X days), overqualified/underqualified |
| 4.2.18 | Build Pipeline real-time updates — live card movement when stage changes |
| 4.2.19 | Build Candidate contact info panel — email, phone, LinkedIn (click to compose) |
| 4.2.20 | Build Candidate document viewer — CV preview, assessment results, prep progress |
| 4.2.21 | Build Candidate search — full-text search across all candidate attributes |
| 4.2.22 | Build Pipeline view toggle — Kanban / Table / Card grid views |
| 4.2.23 | Build Pipeline saved views — persist filter/sort/view preferences per user |
| 4.2.24 | Build Pipeline integration test — drag-and-drop, scoring, comparison, export all working |
| 4.2.25 | Sprint 4.2 review — demo pipeline management to consultants |

## Sprint 4.3 — Scoring & Analytics Dashboard

| # | Ticket |
|---|--------|
| 4.3.01 | Build Scoring dashboard — overview of all scored candidates with ranking |
| 4.3.02 | Build Score breakdown modal — detailed view of each scoring criteria contribution |
| 4.3.03 | Build Score distribution chart — histogram showing score spread across all candidates |
| 4.3.04 | Build Score trend chart — how candidate scores change over time |
| 4.3.05 | Build Mandate-candidate match matrix — heatmap of all candidate-mandate score combinations |
| 4.3.06 | Build Scoring config UI — adjust weights per pipeline stage (admin only) |
| 4.3.07 | Build Score calibration tool — compare scores across consultants for consistency |
| 4.3.08 | Build Consultant performance KPI dashboard — charts for placements, fill rate, time to fill |
| 4.3.09 | Build Consultant workload view — current mandates, candidates per consultant, capacity |
| 4.3.10 | Build Consultant leaderboard — ranking by placements, candidate satisfaction, speed |
| 4.3.11 | Build Revenue analytics dashboard — revenue by mandate, by consultant, by quarter |
| 4.3.12 | Build Pipeline velocity chart — average days per stage, identify bottlenecks |
| 4.3.13 | Build Client satisfaction metrics — feedback scores, NPS, response time |
| 4.3.14 | Build Placement success rate dashboard — by industry, by level, by consultant |
| 4.3.15 | Build Activity heatmap — calendar view showing daily activity intensity |
| 4.3.16 | Build Custom report builder — drag metrics and dimensions to create custom views |
| 4.3.17 | Build Report scheduling — automated weekly/monthly report generation and email |
| 4.3.18 | Build Dashboard widget configuration — users customize their dashboard layout |
| 4.3.19 | Build Dashboard data refresh — manual refresh button + auto-refresh interval |
| 4.3.20 | Build Analytics drill-down — click chart element to see underlying data |
| 4.3.21 | Build Analytics export — export any chart/report as PNG, PDF, or Excel |
| 4.3.22 | Build Analytics comparison — compare periods (this month vs last month) |
| 4.3.23 | Build Analytics alerts — threshold-based alerts (e.g., fill rate drops below 50%) |
| 4.3.24 | Build Analytics integration test — all charts rendering correctly with live data |
| 4.3.25 | Sprint 4.3 review — demo analytics dashboard to management |

## Sprint 4.4 — Internal Communication & Task Management

| # | Ticket |
|---|--------|
| 4.4.01 | Build Internal notification system — bell icon with dropdown, read/unread, mark all read |
| 4.4.02 | Build Notification preferences — choose which events trigger notifications |
| 4.4.03 | Build Task management page — list of tasks assigned to me, by me, and team tasks |
| 4.4.04 | Build Task creation — assign task to team member with due date, priority, description |
| 4.4.05 | Build Task Kanban — to-do, in progress, review, done columns |
| 4.4.06 | Build Task calendar view — tasks on calendar by due date |
| 4.4.07 | Build Task reminders — notification before due date |
| 4.4.08 | Build Task comments — threaded discussion on each task |
| 4.4.09 | Build Task file attachments — attach files to tasks |
| 4.4.10 | Build Task integration with mandates — tasks auto-created from mandate events |
| 4.4.11 | Build Team activity feed — chronological feed of team-wide activities |
| 4.4.12 | Build @mention system — mention team members in notes/comments/tasks |
| 4.4.13 | Build Internal messaging — direct messages between team members |
| 4.4.14 | Build Daily briefing widget — today's tasks, upcoming deadlines, new candidates |
| 4.4.15 | Build Weekly summary report — auto-generated summary of team activities |
| 4.4.16 | Build Meeting scheduler — find available slots, send calendar invites |
| 4.4.17 | Build Meeting notes — attach notes to meetings with action items |
| 4.4.18 | Build Document library — shared documents organized by mandate/client |
| 4.4.19 | Build Document version history — track changes to shared documents |
| 4.4.20 | Build Approval workflow — submit for approval, approve/reject with comments |
| 4.4.21 | Build Audit trail viewer — view all changes to any entity with who/when/what |
| 4.4.22 | Build Quick actions panel — common actions accessible from anywhere (Cmd+K) |
| 4.4.23 | Build Keyboard shortcuts — navigation shortcuts across all internal pages |
| 4.4.24 | Build Communication integration test — notifications, tasks, messages all working |
| 4.4.25 | Sprint 4.4 review — demo communication tools to team |

## Sprint 4.5 — Admin Tools & System Management

| # | Ticket |
|---|--------|
| 4.5.01 | Build User management page — list all users, filter by role/user type |
| 4.5.02 | Build User invitation flow — invite by email with role assignment |
| 4.5.03 | Build User role management — change roles, permissions per portal |
| 4.5.04 | Build User deactivation — disable user access without deleting data |
| 4.5.05 | Build Client account management — create/edit client accounts |
| 4.5.06 | Build Client mandate access management — grant/revoke mandate access per client |
| 4.5.07 | Build Campaign management — create/edit/activate/deactivate campaigns |
| 4.5.08 | Build Campaign enrollment management — bulk add/remove contacts |
| 4.5.09 | Build Scoring configuration — manage scoring weights per stage |
| 4.5.10 | Build Pipeline stage configuration — add/edit/reorder pipeline stages |
| 4.5.11 | Build Notification template management — email/in-app notification templates |
| 4.5.12 | Build Email template editor — rich text editor with variable insertion |
| 4.5.13 | Build Report template management — manage report templates and generation rules |
| 4.5.14 | Build Data import tool — CSV/Excel import for contacts, mandates, candidates |
| 4.5.15 | Build Data export tool — selective data export with format options |
| 4.5.16 | Build System health dashboard — API health, DB connections, error rates |
| 4.5.17 | Build API usage dashboard — request counts, latency percentiles, error rates |
| 4.5.18 | Build Audit log viewer — searchable log of all system actions |
| 4.5.19 | Build Feature flags management — toggle features on/off per environment |
| 4.5.20 | Build Database maintenance tools — vacuum, reindex, analyze |
| 4.5.21 | Build Backup management — view backup history, trigger manual backup, restore |
| 4.5.22 | Build Integration management — configure third-party integrations (Stripe, email, etc.) |
| 4.5.23 | Build Environment configuration — manage environment variables per environment |
| 4.5.24 | Build Admin integration test — all admin functions working with proper permission checks |
| 4.5.25 | Phase 4 completion review — full Internal Portal demo, all features verified |
