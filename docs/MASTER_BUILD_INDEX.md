# LYC Intelligence — Master Build Index

> **Version:** 1.0 | **Date:** 2026-07-21 | **Author:** NEXUS
> **Source:** All specs, roadmap, GitHub issues, remediation specs, DEX AI Nexus tickets
> **Purpose:** Single reference for every phase, sprint, and ticket across the entire build

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Phases | 5 |
| Sprints | 13 (S0–S12) |
| Duration | 24 weeks |
| Unique Feature IDs (roadmap) | 494 |
| v2 Spec Formal Tickets | 509 |
| v2 Spec Documents | 20 |
| Remediation Specs | 9 |
| DEX AI Nexus Tickets | 7 |
| GitHub Epic Issues | 14 (#47–#59, #121) |
| GitHub Build Issues | 66 (#1–#46, #101–#120) |
| Total GitHub Issues | 79 |
| Audit Reports | 14 |

---

## 1. Phase & Sprint Overview

| Phase | Focus | Weeks | Sprints | Features |
|-------|-------|-------|---------|----------|
| Phase 0 | Infrastructure & UX Primitives | 1–3 | Sprint 0–Sprint 1 | 101 |
| Phase 1 | Core Pipeline & Assessment | 3–10 | Sprint 2–Sprint 5 | 216 |
| Phase 2 | Intelligence & Automation | 11–16 | Sprint 6–Sprint 8 | 162 |
| Phase 3 | Client Differentiation | 17–20 | Sprint 9–Sprint 10 | 106 |
| Phase 4 | Polish & Scale | 21–24 | Sprint 11–Sprint 12 | 34 |
| | **Total** | **1–24** | **S0–S12** | **494** |

---

## 2. Sprint Detail — Feature-by-Feature

### Sprint 0 — UI Foundation + Security Core
**Phase 0** | Week 1–2 | GitHub: [#47](https://github.com/kevinhongfr-star/lyc-intelligence/issues/47) | Features: 48

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `UX-001` | SlideOver Panel — Notion-style right panel | CON/CLI | — |
| 2 | `UX-002` | Animated Modal — spring entrance, keyboard trap | CON | — |
| 3 | `UX-004` | Page Transitions — wire AnimatePresence into router | CON | — |
| 4 | `UX-006` | Micro-Interactions — button press, hover, tab slide | CON | — |
| 5 | `UX-010` | Responsive Design — mobile, tablet, desktop | ALL | — |
| 6 | `UX-020` | Sidebar Navigation — collapsible side menu | CON | — |
| 7 | `UX-021` | Tab Navigation — in-page tab switching | CON | — |
| 8 | `UX-025` | Toast Notifications — non-intrusive alerts | CON | — |
| 9 | `UX-026` | Loading States — skeleton screens, spinners | CON | — |
| 10 | `UX-027` | Error Boundaries — graceful error handling | CON | — |
| 11 | `UX-029` | Confirmation Dialogs — prevent accidental actions | CON | — |
| 12 | `UX-031` | Pagination — page-based navigation | CON | — |
| 13 | `UX-042` | Design Token System — enforce centralized tokens | SYS | — |
| 14 | `UX-043` | Component Library — reusable UI components | SYS | — |
| 15 | `UX-045` | Accessibility (a11y) — screen reader, keyboard, contrast | ALL | — |
| 16 | `UX-050` | Reduced Motion — respect motion preferences | CON | — |
| 17 | `SC-001` | Role-Based Access Control (RBAC) | ADM | — |
| 18 | `SC-002` | Two-Factor Authentication (2FA) | ADM | — |
| 19 | `SC-004` | Audit Log — comprehensive action logging | ADM | — |
| 20 | `SC-005` | Data Encryption at Rest — AES-256 | SYS | — |
| 21 | `SC-006` | Data Encryption in Transit — TLS 1.3 | SYS | — |
| 22 | `SC-012` | Password Policy — complexity, rotation | ADM | — |
| 23 | `SC-024` | Multi-Tenant Isolation — strict data separation | SYS | — |
| 24 | `SC-025` | Admin Dashboard — user/system management | ADM | — |
| 25 | `SC-026` | User Provisioning — create/deactivate users | ADM | — |
| 26 | `SC-031` | Data Backup & Recovery — automated backups | SYS | — |
| 27 | `SC-042` | Timezone Management — per-user timezone | SYS | — |
| 28 | `AU-006` | API Integration Framework — REST/GraphQL | SYS | — |
| 29 | `AU-046` | SSO Integration — SAML/OIDC | ADM/SYS | — |
| 30 | `AI-031` | Entity-Level AI Context Layer — every page feeds NexusChat | SYS | — |
| 31 | `AI-001` | AIInsightButton — universal Sparkles button | CON/CLI | — |
| 32 | `AI-002` | NexusChat with page-level context awareness | CON/CLI | — |
| 33 | `UX-003` | AIInsightButton visual spec (Sparkles on hover) | CON/CLI | — |
| 34 | `SD-001` | Global Search — search across all entities | CON | — |
| 35 | `SD-002` | Fuzzy Search — tolerate typos | CON | — |
| 36 | `SD-014` | Skill-Based Search — find candidates by skills | CON | — |
| 37 | `SD-038` | Search Permissions — respect data access | SYS | — |
| 38 | `PW-033` | Batch Import/Export — CSV/Excel bulk ops | CON | — |
| 39 | `UX-011` | DataTable — sortable, filterable, exportable | CON | — |
| 40 | `UX-015` | DataTable CSV Export | CON | — |
| 41 | `UX-019` | Breadcrumb Navigation | CON | — |
| 42 | `UX-023` | Drag-and-Drop File Upload | CON/CAN | — |
| 43 | `UX-024` | Image Preview — inline viewing | CON | — |
| 44 | `UX-028` | Empty States — helpful empty page designs | CON | — |
| 45 | `PW-037` | Undo/Redo — recover from accidental actions | CON | — |
| 46 | `SC-007` | GDPR Compliance — data subject rights | ADM/SYS | — |
| 47 | `SC-003` | SSO (Single Sign-On) — SAML/OIDC | ADM | — |
| 48 | `AU-021` | Stripe Payment Integration — credit purchase | SYS | — |

**Exit Criteria:**
- [ ] SlideOver + AnimatedModal + Page Transitions working
- [ ] AIInsightButton renders on every data element (placeholder handler)
- [ ] NexusChat receives page context
- [ ] RBAC enforced on all routes
- [ ] All client pages have working onClick handlers
- [ ] Skeleton loading states on all pages
- [ ] Search returns results across entities

---

### Sprint 1 — Search & Discovery Foundation + Remaining P0
**Phase 0** | Week 2–3 | GitHub: [#48](https://github.com/kevinhongfr-star/lyc-intelligence/issues/48) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `SD-003` | Faceted Search — filter by attributes | CON | — |
| 2 | `SD-007` | Recent Searches — quick access | CON | — |
| 3 | `SD-008` | Search Suggestions — auto-complete | CON | — |
| 4 | `SD-009` | Filter Builder — advanced filters | CON | — |
| 5 | `SD-010` | Search Within Results — progressive narrowing | CON | — |
| 6 | `SD-011` | Tag-Based Search | CON | — |
| 7 | `SD-012` | Full-Text Search — within documents/notes | CON | — |
| 8 | `SD-013` | People Search — find team members | CON | — |
| 9 | `SD-015` | Location-Based Search | CON | — |
| 10 | `SD-017` | Experience Range Search | CON | — |
| 11 | `SD-020` | Availability Search | CON | — |
| 12 | `SD-024` | Quick Filters — one-click common filters | CON | — |
| 13 | `SD-029` | Cross-Entity Search — unified results | CON | — |
| 14 | `SD-030` | Search Result Highlighting | CON | — |
| 15 | `SD-037` | Advanced Sort Options | CON | — |
| 16 | `AE-001` | LENS Assessment Engine — adaptive delivery | CAN/SYS | — |
| 17 | `AE-002` | DRIVE Assessment Module — 5-dimension scoring | CAN/SYS | — |
| 18 | `AE-003` | SHIFT Composite Scoring — weighted multi-instrument | SYS | — |
| 19 | `AE-004` | LEAP Assessment — DISC + Career Readiness | CAN/SYS | — |
| 20 | `AE-005` | QUEST Assessment — strategic evaluation | CAN/SYS | — |
| 21 | `AE-006` | COACH Assessment — leadership style + 360° | CAN/SYS | — |
| 22 | `AE-007` | IMPACT Assessment — performance impact | CAN/SYS | — |
| 23 | `AE-010` | Credit-Based Assessment Pricing | SYS/ADM | — |
| 24 | `AE-011` | Dual Credit System — assessment + placement credits | SYS/ADM | — |
| 25 | `AE-012` | Assessment Report Generator — branded PDF | SYS | — |
| 26 | `AE-013` | Score Normalization Engine | SYS | — |
| 27 | `AE-026` | Candidate Assessment Portal — take online | CAN | — |
| 28 | `CX-001` | Interactive Client Shortlist — rate/reject/comment | CLI | — |
| 29 | `CX-003` | Real-Time Mandate Dashboard | CLI | — |
| 30 | `CX-009` | Branded PDF Deliverables — LYC-branded reports | CLI | — |
| 31 | `PW-001` | Pipeline Kanban Board — drag-and-drop stages | CON | — |
| 32 | `PW-004` | Bulk Candidate Actions — mass move/score/tag | CON | — |
| 33 | `PW-006` | Automated Acknowledgment Emails — candidate confirm | SYS | — |
| 34 | `PW-010` | Interview Scheduling — calendar sync + self-scheduling | CON/CAN | — |
| 35 | `PW-012` | Candidate Self-Service Portal | CAN | — |
| 36 | `AI-003` | Candidate Match Score Engine (TRIDENT) | CON | — |
| 37 | `AI-004` | Shortlist Generator — auto-rank per mandate | CON | — |
| 38 | `AI-005` | CV Auto-Parser — structured data from resumes | CON/SYS | — |
| 39 | `AI-008` | Candidate Comparison Matrix — side-by-side AI | CON/CLI | — |
| 40 | `AI-016` | Resume-to-JD Matching Score — semantic alignment | CON | — |
| 41 | `CC-001` | Comment Threads — contextual discussions | CON/CLI | — |
| 42 | `CC-004` | Real-Time Notifications — push + email + in-app | ALL | — |
| 43 | `CC-007` | Threaded Replies — nested conversations | CON/CLI | — |
| 44 | `AU-007` | Google Calendar Sync — bi-directional | CON | — |
| 45 | `AU-008` | Outlook Calendar Sync — bi-directional | CON | — |
| 46 | `AU-022` | Supabase Edge Functions — serverless compute | SYS | — |
| 47 | `SC-008` | Data Retention Policies — auto-delete | ADM/SYS | — |
| 48 | `SC-009` | Consent Management — track user consent | SYS | — |
| 49 | `UX-032` | Auto-Save — persist changes automatically | CON | — |
| 50 | `UX-035` | Onboarding Tour — guided first-time experience | ALL | — |
| 51 | `CX-003` | Client Dashboard — live pipeline status (wire to Portal) | CLI | — |
| 52 | `AR-001` | Executive Dashboard — key metrics | ADM/CLI | — |
| 53 | `AR-011` | Real-Time Dashboard — live-updating metrics | ADM/CLI | — |
| 54 | `AU-041` | Event Bus — publish/subscribe system | SYS | — |

**Exit Criteria:**
- [ ] All P0 assessment engines functional (LENS, DRIVE, SHIFT, LEAP, QUEST, COACH, IMPACT)
- [ ] Pipeline Kanban with drag-and-drop working
- [ ] Client can view interactive shortlist and rate/reject
- [ ] Global search returns cross-entity results
- [ ] Credit system operational (Stripe → credits → assessments)
- [ ] Candidate self-service portal accepts assessment submissions

---

### Sprint 2 — Pipeline Workflow + Client Portal Core
**Phase 1** | Week 3–4 | GitHub: [#49](https://github.com/kevinhongfr-star/lyc-intelligence/issues/49) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `PW-002` | Custom Pipeline Stages — configurable per mandate type | CON/ADM | — |
| 2 | `PW-003` | Stage Transition Automation — auto-move on criteria | SYS/CON | — |
| 3 | `PW-005` | Mandate Timeline View — Gantt-style progress | CON/CLI | — |
| 4 | `PW-007` | Interview Kit Builder — structured prep per role | CON | — |
| 5 | `PW-008` | Scorecard Templates — customizable per role/level | CON | — |
| 6 | `PW-009` | Mandatory Scorecard Completion before stage advance | CON | — |
| 7 | `PW-011` | Multi-Interviewer Coordination — panel scheduling | CON | — |
| 8 | `PW-013` | Offer Management — generate, track, negotiate | CON | — |
| 9 | `PW-014` | Offer Approval Workflow — multi-step sign-off | CON/ADM | — |
| 10 | `PW-015` | Rejection Reason Tracking — structured feedback | CON | — |
| 11 | `PW-016` | Talent Pool / Pipeline Creation — reusable lists | CON | — |
| 12 | `PW-017` | Candidate Tagging System — flexible labels | CON | — |
| 13 | `PW-018` | Custom Fields — user-defined data fields | CON/ADM | — |
| 14 | `PW-019` | Duplicate Detection — auto-merge candidates | SYS | — |
| 15 | `PW-024` | SLA Tracking — time-in-stage alerts | CON/ADM | — |
| 16 | `PW-026` | Multi-Mandate Candidate View | CON | — |
| 17 | `PW-031` | Candidate Status Badges — visual pipeline position | CON/CLI | — |
| 18 | `PW-032` | Deadline & Expiry Tracking | CON | — |
| 19 | `PW-034` | Saved Views & Filters — personalized list views | CON | — |
| 20 | `PW-042` | Calendar Integration — bi-directional sync | CON | — |
| 21 | `PW-047` | Priority Flagging — urgent mandates/candidates | CON | — |
| 22 | `PW-049` | Candidate Availability Calendar | CON | — |
| 23 | `PW-053` | Pipeline Health Score — health indicator | CON/ADM | — |
| 24 | `PW-055` | Cross-Portal Pipeline Sync — consultant ↔ client | CON/CLI | — |
| 25 | `CX-004` | Client Feedback Loop — structured feedback | CLI/CON | — |
| 26 | `CX-005` | Scheduled Report Delivery — auto-send weekly | CLI/SYS | — |
| 27 | `CX-006` | Client Document Library — organized deliverables | CLI | — |
| 28 | `CX-007` | Client User Management — add/remove users | CLI/ADM | — |
| 29 | `CX-010` | Client Invitation System — email invites | CLI/ADM | — |
| 30 | `CX-013` | Interview Feedback Collection — client interviewer input | CLI | — |
| 31 | `CX-014` | Client Notification Center — activity alerts | CLI | — |
| 32 | `CX-015` | Shared Candidate Annotations — client ↔ consultant | CLI/CON | — |
| 33 | `CX-017` | Milestone Timeline — visual project progress | CLI | — |
| 34 | `CX-018` | Client Onboarding Wizard — guided setup | CLI | — |
| 35 | `CX-032` | Client Messaging Thread — in-platform comms | CLI/CON | — |
| 36 | `CX-033` | Client File Upload — share docs with consultant | CLI | — |
| 37 | `CX-045` | Embedded Scheduling in Client Portal — book calls | CLI | — |
| 38 | `CC-002` | @Mentions — notify specific team members | CON/CLI | — |
| 39 | `CC-003` | Activity Feed — platform-wide activity stream | ALL | — |
| 40 | `CC-008` | Rich Text Comments | CON/CLI | — |
| 41 | `AI-010` | Mandate Status Report Generator — auto-written | CON/SYS | — |
| 42 | `AI-014` | Natural Language Search — semantic queries | CON | — |
| 43 | `AI-015` | AI Email Drafting — personalized emails | CON | — |
| 44 | `AI-029` | AI Job Description Writer — generate JDs | CON | — |
| 45 | `AI-044` | AI Meeting Scheduler — auto-find optimal times | CON/CAN | — |
| 46 | `AI-052` | AI Confidence Scoring — show certainty level | CON/CLI | — |
| 47 | `AI-055` | Context-Aware AI Suggestions — recommend next actions | CON | — |
| 48 | `AE-008` | BRIDGE Assessment — team dynamics fit | CAN/SYS | — |
| 49 | `AE-014` | Question Bank Management — add/edit questions | ADM | — |
| 50 | `AE-016` | Anti-Cheat Measures — consistency checks | CAN/SYS | — |
| 51 | `AE-017` | Multi-Rater / 360° Feedback Collection | CAN/CON | — |
| 52 | `AE-018` | Assessment Comparison View — side-by-side | CON/CLI | — |
| 53 | `AE-020` | Assessment Progress Tracker — completion status | CON/CAN | — |
| 54 | `AE-027` | Mobile-Optimized Assessment — responsive | CAN | — |

**Exit Criteria:**
- [ ] Full pipeline with custom stages, scorecards, SLA tracking
- [ ] Client portal has messaging, feedback, document library, scheduling
- [ ] AI email drafting + JD writer functional
- [ ] BRIDGE assessment operational
- [ ] 360° feedback collection working
- [ ] Pipeline syncs between consultant and client views

---

### Sprint 3 — Remaining P1 + Integration Core
**Phase 1** | Week 5–6 | GitHub: [#50](https://github.com/kevinhongfr-star/lyc-intelligence/issues/50) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `PW-022` | Workflow Automation Builder — visual designer | CON/ADM | — |
| 2 | `PW-023` | Trigger-Based Actions — event → auto-action | SYS | — |
| 3 | `PW-035` | Quick Switcher — Cmd+K command palette | CON | — |
| 4 | `PW-039` | Bulk Email/SMS — mass outreach | CON | — |
| 5 | `PW-040` | Email Templates Library — reusable templates | CON | — |
| 6 | `AU-001` | Visual Workflow Builder — drag-and-drop | ADM/CON | — |
| 7 | `AU-002` | Trigger Library — event-based catalog | SYS | — |
| 8 | `AU-003` | Action Library — pre-built action catalog | SYS | — |
| 9 | `AU-004` | Conditional Logic — if/then/else | SYS | — |
| 10 | `AU-005` | Webhook Support — external triggers | SYS | — |
| 11 | `AU-009` | Gmail Integration — email tracking + logging | CON | — |
| 12 | `AU-010` | Outlook Email Integration — sync + tracking | CON | — |
| 13 | `AU-011` | LinkedIn Integration — profile import | CON | — |
| 14 | `AU-013` | Feishu/Lark Integration — notifications + actions | CON | — |
| 15 | `AU-014` | Zoom/Teams Integration — video interview | CON/CAN | — |
| 16 | `AU-018` | Job Board Publishing — post to multiple boards | CON | — |
| 17 | `AU-019` | Indeed/LinkedIn Job Posting — sponsored | CON | — |
| 18 | `AU-026` | Scheduled Automation — time-based triggers | SYS | — |
| 19 | `AU-027` | Approval Chains — multi-step workflows | ADM | — |
| 20 | `AU-029` | Error Handling & Retry — resilient execution | SYS | — |
| 21 | `AU-030` | Automation Logging — audit trail | ADM | — |
| 22 | `AU-033` | Integration Health Monitor — connection status | ADM | — |
| 23 | `AU-034` | Rate Limit Management — API throttling | SYS | — |
| 24 | `AU-038` | Webhook Management UI | ADM | — |
| 25 | `AU-039` | OAuth Management — third-party auth | SYS | — |
| 26 | `AU-042` | Cron/Scheduled Jobs — recurring tasks | SYS | — |
| 27 | `AU-044` | SMS Gateway Integration — send SMS | SYS | — |
| 28 | `AE-009` | SPARK Assessment — AI readiness | CAN/SYS | — |
| 29 | `AE-022` | Assessment Analytics — completion rates | ADM | — |
| 30 | `AE-025` | AI Assessment Interpreter — explain scores | CON/CLI | — |
| 31 | `AE-028` | Assessment Reminder Automation — nudge | CAN/SYS | — |
| 32 | `AE-030` | Assessment Report Sharing — shareable links | CON/CLI | — |
| 33 | `AE-032` | Assessment Bundling — package instruments | ADM/CLI | — |
| 34 | `AE-036` | Strengths-Based Reporting — positive framing | CON/CLI/CAN | — |
| 35 | `SD-004` | Natural Language Search — semantic | CON | — |
| 36 | `SD-005` | Saved Searches — bookmark queries | CON | — |
| 37 | `SD-006` | Search Alerts — notify on matches | CON | — |
| 38 | `SD-016` | Company Search — by employers | CON | — |
| 39 | `SD-018` | Education Search — school/degree | CON | — |
| 40 | `SD-021` | Boolean Search — AND/OR/NOT | CON | — |
| 41 | `SC-010` | IP Allowlisting — restrict by IP | ADM | — |
| 42 | `SC-011` | Session Management — timeout, limits | ADM | — |
| 43 | `SC-013` | Data Export Controls — restrict downloads | ADM | — |
| 44 | `SC-014` | Field-Level Security — hide sensitive fields | ADM | — |
| 45 | `SC-015` | Record-Level Security — restrict records | ADM | — |
| 46 | `SC-016` | API Key Management — create/revoke | ADM | — |
| 47 | `SC-017` | Rate Limiting — API throttling | SYS | — |
| 48 | `SC-019` | Breach Notification — automated response | SYS | — |
| 49 | `SC-020` | Vulnerability Scanning — automated scans | SYS | — |
| 50 | `SC-027` | Team/Group Management — organize users | ADM | — |
| 51 | `SC-028` | Permission Templates — pre-defined sets | ADM | — |
| 52 | `SC-029` | Login History — track attempts | ADM | — |
| 53 | `SC-032` | Disaster Recovery — DR plan | ADM/SYS | — |
| 54 | `SC-033` | Change Management — track config changes | ADM | — |

**Exit Criteria:**
- [ ] Visual workflow builder operational (Zapier-like)
- [ ] All major integrations connected (Gmail, Outlook, LinkedIn, Zoom, Job Boards, Feishu, SMS)
- [ ] SPARK assessment operational
- [ ] Full security layer: field-level, record-level, API keys, rate limiting
- [ ] Boolean + NL search operational
- [ ] Assessment bundling and sharing working

---

### Sprint 4 — Remaining P1 + Collaboration + Analytics Foundation
**Phase 1** | Week 7–8 | GitHub: [#51](https://github.com/kevinhongfr-star/lyc-intelligence/issues/51) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `PW-020` | Mandate Templates — reusable configs | CON | — |
| 2 | `PW-021` | Stage-Gate Checkpoints — required actions | CON/ADM | — |
| 3 | `CX-019` | Embedded AI Insights for Clients — AI button in portal | CLI | — |
| 4 | `CX-025` | Comparison Tool for Clients — compare candidates | CLI | — |
| 5 | `CX-026` | Interview Schedule View — client sees interviews | CLI | — |
| 6 | `CX-027` | Offer Tracking for Clients — offer status | CLI | — |
| 7 | `CC-010` | Email Digest — daily/weekly summary | ALL | — |
| 8 | `CC-011` | Notification Preferences — granular control | ALL | — |
| 9 | `CC-012` | Unread Indicators — badge counts | CON/CLI | — |
| 10 | `CC-013` | Message Search — find past messages | CON/CLI | — |
| 11 | `CC-014` | File Sharing in Messages — attach files | CON/CLI | — |
| 12 | `CC-015` | Emoji Reactions — quick feedback | CON/CLI | — |
| 13 | `CC-016` | Pin Messages — important messages | CON/CLI | — |
| 14 | `CC-017` | Message Formatting — bold, italic, lists | CON/CLI | — |
| 15 | `CC-018` | Link Preview — embedded previews | CON/CLI | — |
| 16 | `CC-019` | Code Snippets — formatted code blocks | CON | — |
| 17 | `CC-020` | Message Reactions Analytics | ADM | — |
| 18 | `AR-002` | Pipeline Analytics — stage conversion | ADM/CON | — |
| 19 | `AR-003` | Time-to-Fill Reporting | ADM/CON | — |
| 20 | `AR-004` | Source Effectiveness — which channels work | ADM/CON | — |
| 21 | `AR-005` | Consultant Performance — placement rates | ADM | — |
| 22 | `AR-006` | Client Revenue Reporting | ADM | — |
| 23 | `AR-007` | Candidate Quality Metrics | ADM/CON | — |
| 24 | `AR-008` | Custom Report Builder | ADM/CON | — |
| 25 | `AR-009` | Scheduled Reports — auto-deliver | ADM | — |
| 26 | `AR-010` | Export to PDF/Excel/CSV | ADM/CON | — |
| 27 | `AR-012` | Pipeline Velocity Report | ADM | — |
| 28 | `AR-015` | Candidate Experience Metrics | ADM | — |
| 29 | `AR-016` | Hiring Manager Satisfaction | ADM | — |
| 30 | `AR-017` | Offer Acceptance Rate Tracking | ADM/CON | — |
| 31 | `AR-018` | Revenue Per Consultant | ADM | — |
| 32 | `AR-019` | Cost Per Hire Analysis | ADM/CLI | — |
| 33 | `AR-021` | Mandate Age Report — stale searches | ADM/CON | — |
| 34 | `AR-022` | Consultant Activity Report | ADM | — |
| 35 | `AR-023` | Placement Forecast | ADM | — |
| 36 | `AR-024` | Client Satisfaction Report | ADM/CLI | — |
| 37 | `AR-026` | Compensation Analysis Report | ADM/CON | — |
| 38 | `AR-027` | Geographic Distribution Report | ADM/CON | — |
| 39 | `AR-028` | Skills Demand Report | ADM/CON | — |
| 40 | `AR-030` | Board Report Generator | ADM/CLI | — |
| 41 | `AR-031` | Custom Calculated Fields | ADM | — |
| 42 | `AR-032` | Dashboard Widgets — configurable | ADM/CON | — |
| 43 | `AR-033` | Drill-Down Reports | ADM/CON | — |
| 44 | `AR-035` | Report Templates — pre-built | ADM/CON | — |
| 45 | `AR-036` | Report Sharing — share with users | ADM/CON | — |
| 46 | `AR-040` | Goal Tracking — set and monitor KPIs | ADM | — |
| 47 | `AR-045` | Automated Weekly Digest | ADM | — |
| 48 | `AI-006` | AI Interview Question Generator | CON | — |
| 49 | `AI-007` | Offer Negotiation Assistant | CON | — |
| 50 | `AI-009` | AI Summary Card — executive summaries | CON/CLI | — |
| 51 | `AI-012` | AI Candidate Sourcing Agent (SWEEP UI) | AGT/CON | — |
| 52 | `AI-013` | Org Chart Intelligence — competitor viz | CON/CLI | — |
| 53 | `AI-021` | Multi-Language Translation — CV auto-translate | CON/CAN | — |
| 54 | `AI-023` | Interview Transcription + Auto-Scoring | CON | — |

**Exit Criteria:**
- [ ] Full analytics suite: 20+ report types, custom builder, scheduled delivery
- [ ] Client portal has comparison tool, interview schedule, offer tracking
- [ ] AI interview questions, offer negotiation, summary cards working
- [ ] SWEEP agent UI operational
- [ ] Org chart intelligence rendering
- [ ] Multi-language translation functional

---

### Sprint 5 — Advanced Pipeline + Client Portal P1 Complete
**Phase 1** | Week 9–10 | GitHub: [#52](https://github.com/kevinhongfr-star/lyc-intelligence/issues/52) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `PW-025` | Candidate Journey Mapping — visualize experience | CON/CLI | — |
| 2 | `PW-027` | Pipeline Velocity Metrics — stage conversion | ADM | — |
| 3 | `PW-028` | Bottleneck Detection — auto-identify slow stages | ADM | — |
| 4 | `PW-029` | Automated Nurturing — scheduled touchpoints | CON/SYS | — |
| 5 | `PW-030` | Referral Tracking — source and reward | CON | — |
| 6 | `PW-036` | Keyboard Shortcuts — full keyboard nav | CON | — |
| 7 | `PW-038` | Version History — track changes | CON/ADM | — |
| 8 | `PW-041` | Sequence Builder — multi-step outreach | CON | — |
| 9 | `PW-043` | Video Interview Integration — embedded calls | CON/CAN | — |
| 10 | `PW-044` | Background Check Integration | CON | — |
| 11 | `PW-045` | Onboarding Trigger — start when offer accepted | SYS | — |
| 12 | `PW-046` | Workflows per Client — client-specific rules | CON/ADM | — |
| 13 | `PW-048` | Pipeline Forecasting — projected fills | CON/ADM | — |
| 14 | `PW-050` | Mandate Handoff Workflow — smooth transitions | CON/ADM | — |
| 15 | `PW-051` | Conflict Detection — scheduling conflicts | CON | — |
| 16 | `PW-052` | Smart Assignment — auto-assign candidates | CON | — |
| 17 | `CX-035` | Client Portal SSO — enterprise SSO | CLI/ADM | — |
| 18 | `CC-021` | Thread Organization — group by topic | CON/CLI | — |
| 19 | `CC-022` | Smart Notifications — ML-based priority | ALL | — |
| 20 | `CC-023` | Cross-Reference Messages — link related msgs | CON/CLI | — |
| 21 | `CC-024` | Message Templates — reusable responses | CON | — |
| 22 | `CC-025` | Auto-Translate Messages — real-time translation | CON/CLI | — |
| 23 | `CC-026` | Read Receipts — message delivery confirmation | CON/CLI | — |
| 24 | `CC-027` | Scheduled Messages — send later | CON | — |
| 25 | `CC-028` | Slack Integration — cross-platform | CON | — |
| 26 | `CC-030` | SMS Channel — text messaging | CON/CLI/CAN | — |
| 27 | `CC-031` | Communication Analytics — response times | ADM | — |
| 28 | `CC-034` | Status Updates — manual status setting | CON | — |
| 29 | `CC-035` | Quick Replies — canned responses | CON | — |
| 30 | `CC-036` | Conversation Labels — categorize threads | CON | — |
| 31 | `CC-037` | Priority Inbox — important first | CON | — |
| 32 | `CC-038` | Snooze Conversations — revisit later | CON | — |
| 33 | `CC-039` | Bulk Messaging — mass send | CON | — |
| 34 | `CC-040` | Automated Follow-Ups — scheduled nudges | CON/SYS | — |
| 35 | `CC-041` | Communication Rules — auto-route messages | SYS | — |
| 36 | `CC-042` | Escalation Workflows — urgent routing | SYS | — |
| 37 | `CC-043` | External Participant Invites — guest access | CON/CLI | — |
| 38 | `CC-044` | Compliance Archiving — retain all comms | ADM/SYS | — |
| 39 | `AI-036` | Agent Activity Dashboard — AI workforce visibility | ADM/CON | — |
| 40 | `AI-038` | Intelligent Deduplication — merge duplicates | SYS | — |
| 41 | `AI-041` | Batch AI Processing — score 100+ at once | CON | — |
| 42 | `AI-054` | AI Pipeline Risk Alert — flag stalling | CON/ADM | — |
| 43 | `UX-007` | Dashboard DnD — drag-to-reorder widgets | CON/ADM | — |
| 44 | `UX-008` | Dashboard Widget Library — pre-built catalog | CON | — |
| 45 | `UX-009` | Dark Mode — full dark theme | CON/CLI | — |
| 46 | `UX-014` | DataTable Saved Views — persist configs | CON | — |
| 47 | `UX-016` | DataTable Bulk Actions — select and act | CON | — |
| 48 | `UX-017` | Command Palette (Cmd+K) — quick nav | CON | — |
| 49 | `UX-030` | Infinite Scroll — load more on scroll | CON | — |
| 50 | `UX-036` | Tooltips — contextual help on hover | CON | — |
| 51 | `UX-037` | Help Center — in-app documentation | ALL | — |
| 52 | `UX-044` | Brand Asset Management — logos, colors, fonts | ADM | — |
| 53 | `UX-051` | Contextual Actions — show relevant actions | CON | — |
| 54 | `UX-052` | Split View — side-by-side comparison | CON | — |

**Exit Criteria:**
- [ ] Dashboard DnD with real drag-and-drop
- [ ] Dark mode fully functional
- [ ] Command palette (Cmd+K) working
- [ ] Agent activity dashboard showing AI workforce
- [ ] Full communication suite: SMS, auto-translate, escalation
- [ ] Pipeline forecasting and bottleneck detection
- [ ] All P1 features complete ✓

---

### Sprint 6 — AI Intelligence Layer
**Phase 2** | Week 11–12 | GitHub: [#53](https://github.com/kevinhongfr-star/lyc-intelligence/issues/53) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `AI-011` | Talent Signal Feed — real-time market alerts | CON | — |
| 2 | `AI-017` | AI Meeting Summarizer — transcript → actions | CON | — |
| 3 | `AI-018` | Predictive Time-to-Fill — ML estimates | CON/CLI | — |
| 4 | `AI-019` | Offer Acceptance Probability — ML prediction | CON | — |
| 5 | `AI-020` | AI Bias Detector — flag biased language | CON/SYS | — |
| 6 | `AI-022` | AI Skill Gap Analyzer — missing competencies | CON | — |
| 7 | `AI-024` | AI Talent Map Generator — visual market | CON/CLI | — |
| 8 | `AI-025` | Candidate Persona Generator — rich profiles | CON | — |
| 9 | `AI-026` | Sentiment Analysis on Interview Notes | CON | — |
| 10 | `AI-027` | AI Compensation Benchmarking | CON/CLI | — |
| 11 | `AI-030` | AI Market Briefing — weekly industry report | CON/CLI | — |
| 12 | `AI-032` | AI Data Enrichment — auto-fill missing info | SYS/CON | — |
| 13 | `AI-033` | Conversational Candidate Screening Chatbot | CAN/SYS | — |
| 14 | `AI-034` | AI Report Insights — dashboard → plain language | CON/CLI | — |
| 15 | `AI-035` | AI Chart Builder — NL → visualization | CON/CLI | — |
| 16 | `AI-037` | AI Document Classifier — auto-categorize | SYS | — |
| 17 | `AI-040` | AI Culture Fit Analysis — values alignment | CON | — |
| 18 | `AI-042` | AI Candidate Re-Engagement — dormant outreach | CON/SYS | — |
| 19 | `AI-046` | AI Compliance Checker — flag GDPR issues | ADM/SYS | — |
| 20 | `AI-047` | Voice-to-Notes — dictation for mobile | CON | — |
| 21 | `AI-048` | AI Follow-Up Reminder — contextual nudge | CON | — |
| 22 | `AI-049` | Cross-Mandate Learning — learn from placements | SYS | — |
| 23 | `AI-051` | Multi-Modal AI Input — images, voice, video | CON/CLI | — |
| 24 | `AI-053` | Automated Competitive Intelligence | CON/CLI | — |
| 25 | `AI-056` | AI Diversity Analytics — representation | ADM/CON | — |
| 26 | `AI-057` | Talent Supply/Demand Heatmap | CON/CLI | — |
| 27 | `AI-060` | AI Executive Briefing Generator | CON | — |
| 28 | `SD-022` | Similar Candidate Search — find like X | CON | — |
| 29 | `SD-025` | Search Result Preview — inline preview | CON | — |
| 30 | `SD-027` | AI-Powered Search Ranking | SYS | — |
| 31 | `SD-033` | Multilingual Search | CON | — |
| 32 | `SD-035` | Search Results Sharing | CON | — |
| 33 | `SD-039` | Search API — programmatic access | SYS | — |
| 34 | `SD-040` | Zero-State Optimization — helpful suggestions | CON | — |
| 35 | `AU-012` | Slack Integration — notifications + actions | CON | — |
| 36 | `AU-015` | DocuSign Integration — digital signatures | CON/CLI | — |
| 37 | `AU-016` | Background Check Integration — Checkr | CON | — |
| 38 | `AU-017` | HRIS Integration — Workday, BambooHR | SYS | — |
| 39 | `AU-020` | Assessment Platform Integration — SHL, Hogan | SYS | — |
| 40 | `AU-023` | Zapier Integration — 5000+ apps | SYS | — |
| 41 | `AU-025` | Two-Way Data Sync — bidirectional | SYS | — |
| 42 | `AU-028` | Data Transformation — field mapping | SYS | — |
| 43 | `AU-031` | Template Marketplace — pre-built automations | CON/ADM | — |
| 44 | `AU-032` | Custom Actions — developer-extensible | SYS | — |
| 45 | `AU-035` | Data Sync Conflict Resolution | SYS | — |
| 46 | `AU-036` | Bulk API Operations — batch processing | SYS | — |
| 47 | `AU-037` | Integration Sandbox — test safely | ADM | — |
| 48 | `AU-040` | Data Pipeline Builder — ETL flows | SYS | — |
| 49 | `AU-043` | File Sync — cloud storage sync | SYS | — |
| 50 | `AU-045` | Chat Widget Integration — embed on sites | SYS | — |
| 51 | `AU-048` | Data Warehouse Sync — BigQuery/Snowflake | SYS | — |
| 52 | `AU-049` | MCP (Model Context Protocol) — AI tools | SYS | — |
| 53 | `AU-050` | Integration Marketplace — browse/install | ADM | — |
| 54 | `SC-034` | Compliance Reporting — generate reports | ADM | — |

**Exit Criteria:**
- [ ] AI compensation benchmarking, talent maps, market briefings all functional
- [ ] Predictive models live: time-to-fill, offer acceptance
- [ ] Zapier + HRIS + DocuSign integrations connected
- [ ] AI chart builder (NL → visualization) working
- [ ] Search API available for programmatic access

---

### Sprint 7 — Advanced Assessment + Client Intelligence
**Phase 2** | Week 13–14 | GitHub: [#54](https://github.com/kevinhongfr-star/lyc-intelligence/issues/54) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `AE-015` | Adaptive Difficulty — questions adjust | CAN/SYS | — |
| 2 | `AE-019` | Role-Specific Benchmarking — compare to norms | CON/CLI | — |
| 3 | `AE-021` | Custom Assessment Builder — create bespoke | ADM/CON | — |
| 4 | `AE-023` | Normative Data Library — industry benchmarks | SYS | — |
| 5 | `AE-024` | Assessment Versioning — track question changes | ADM | — |
| 6 | `AE-029` | Score Confidence Interval — show precision | CON/CLI | — |
| 7 | `AE-031` | Historical Assessment Tracking — over time | CON | — |
| 8 | `AE-034` | Assessment Localization — multi-language | CAN/SYS | — |
| 9 | `AE-037` | Development Recommendations — AI growth plans | CAN/CON | — |
| 10 | `AE-038` | Team Composition Analyzer — optimize teams | CON/CLI | — |
| 11 | `AE-039` | Assessment Integration with Pipeline | CON/SYS | — |
| 12 | `AE-040` | Peer Comparison Engine — relative standing | CON/CLI | — |
| 13 | `AE-041` | Predictive Performance Scoring | CON/CLI | — |
| 14 | `AE-043` | AI Question Generator — auto-create items | ADM | — |
| 15 | `AE-044` | Gamified Assessment Elements | CAN | — |
| 16 | `AE-045` | Situational Judgment Tests | CAN/SYS | — |
| 17 | `AE-046` | Cognitive Ability Module | CAN/SYS | — |
| 18 | `AE-047` | Emotional Intelligence Assessment | CAN/SYS | — |
| 19 | `AE-049` | Assessment Badge System — skill verification | CAN | — |
| 20 | `AE-050` | Candidate Self-Development Portal | CAN | — |
| 21 | `CX-002` | White-Label Client Portal — client branding | CLI/ADM | — |
| 22 | `CX-008` | Client-Specific Analytics View | CLI | — |
| 23 | `CX-011` | NDA/Agreement Management — digital signatures | CLI | — |
| 24 | `CX-012` | Client Billing Dashboard — invoice view | CLI/ADM | — |
| 25 | `CX-016` | Client Satisfaction Surveys — NPS/CSAT | CLI/SYS | — |
| 26 | `CX-020` | Market Intelligence Sharing — share talent maps | CLI/CON | — |
| 27 | `CX-021` | Compensation Data Sharing — benchmarks | CLI | — |
| 28 | `CX-022` | Client Mobile App — responsive portal | CLI | — |
| 29 | `CX-023` | Custom Client Landing Page — per-client | CLI | — |
| 30 | `CX-024` | Client-Accessible Org Charts — sanitized | CLI | — |
| 31 | `CX-028` | Client Referral Submission | CLI | — |
| 32 | `CX-029` | Client-Accessible Diversity Report | CLI | — |
| 33 | `CX-030` | Saved Searches for Clients | CLI | — |
| 34 | `CX-031` | Client Task Assignment — assign actions | CLI | — |
| 35 | `CX-034` | Executive Summary Auto-Gen — board-ready | CLI | — |
| 36 | `CX-036` | Data Room — secure document sharing | CLI/CON | — |
| 37 | `CX-039` | Client-Specific Job Board | CLI | — |
| 38 | `CX-041` | Real-Time Collaboration Cursors | CLI/CON | — |
| 39 | `CX-042` | Client-Configurable Notifications | CLI | — |
| 40 | `CX-044` | Client Quarterly Business Review Generator | CON/CLI | — |
| 41 | `CX-046` | Client ROI Dashboard — placements vs cost | CLI | — |
| 42 | `CX-047` | Co-Branded Reports — LYC + Client logo | CLI | — |
| 43 | `CX-048` | Client Knowledge Base — FAQ, guides | CLI | — |
| 44 | `CX-049` | Multi-Entity Client View — parent/subsidiaries | CLI/ADM | — |
| 45 | `AR-034` | Cross-Tab Reports — multi-dimensional | ADM | — |
| 46 | `AR-037` | Automated Insight Generation — AI explains | ADM | — |
| 47 | `AR-038` | Anomaly Detection — flag unusual patterns | ADM | — |
| 48 | `AR-039` | Period Comparison — compare across time | ADM | — |
| 49 | `AR-041` | Leaderboard — top performers | ADM | — |
| 50 | `AR-044` | Heatmap Visualization — geographic/functional | ADM/CON | — |
| 51 | `AR-046` | API Reporting — programmatic access | SYS | — |
| 52 | `AR-048` | Embedded Charts — charts in other pages | ADM/CON | — |
| 53 | `AR-050` | AI-Powered Query Interface — NL questions | ADM/CON | — |
| 54 | `SC-039` | Cookie Consent Management | SYS | — |

**Exit Criteria:**
- [ ] White-label client portal with custom branding
- [ ] Client ROI dashboard and QBR generator working
- [ ] Adaptive assessments with difficulty adjustment
- [ ] Team composition analyzer operational
- [ ] Co-branded reports (LYC + Client logo) generating
- [ ] Client knowledge base and data room live

---

### Sprint 8 — Advanced AI + P2 Polish
**Phase 2** | Week 15–16 | GitHub: [#55](https://github.com/kevinhongfr-star/lyc-intelligence/issues/55) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `AI-028` | Automated Reference Check Questions | CON | — |
| 2 | `AI-039` | AI Career Path Predictor — trajectory | CON/CLI | — |
| 3 | `AI-043` | Real-Time AI Fact Check — verify claims | CON | — |
| 4 | `AI-045` | Smart Template Selector — AI picks template | CON | — |
| 5 | `AI-050` | AI Persona Matching — consultant to client | ADM | — |
| 6 | `AI-058` | AI Contract/Agreement Summarizer | CON | — |
| 7 | `AI-059` | Predictive Attrition Model — flight risk | CON/CLI | — |
| 8 | `SD-019` | Salary Range Search | CON | — |
| 9 | `SD-023` | Search History — browse past | CON | — |
| 10 | `SD-026` | Search Keyboard Navigation | CON | — |
| 11 | `SD-032` | Search Shortcuts — predefined patterns | CON | — |
| 12 | `UX-005` | List Stagger Animations — cascading rows | CON | — |
| 13 | `UX-012` | DataTable Column Drag — reorder | CON | — |
| 14 | `UX-013` | DataTable Column Resize — adjust widths | CON | — |
| 15 | `UX-018` | Keyboard Shortcuts — comprehensive nav | CON | — |
| 16 | `UX-022` | Context Menus — right-click actions | CON | — |
| 17 | `UX-034` | Progressive Web App (PWA) — installable | ALL | — |
| 18 | `UX-038` | Feedback Widget — in-app submission | ALL | — |
| 19 | `UX-039` | Changelog — what's new notification | CON/CLI | — |
| 20 | `UX-040` | Feature Flags — gradual rollout | ADM/SYS | — |
| 21 | `UX-046` | Print Stylesheet — optimized print | CON/CLI | — |
| 22 | `UX-048` | Font Size Adjustment — user-controlled | CON/CLI | — |
| 23 | `UX-053` | Full-Screen Mode — distraction-free | CON | — |
| 24 | `UX-055` | Quick Create — fast entity creation | CON | — |
| 25 | `PW-054` | Automation Rule Testing — sandbox | ADM | — |
| 26 | `AE-033` | Criterion Validation Report — predictive validity | ADM | — |
| 27 | `AE-035` | Proctoring Mode — timed, supervised | CAN/SYS | — |
| 28 | `AE-042` | White-Label Assessments — client-branded | CLI | — |
| 29 | `AE-048` | Work Sample Evaluation — AI-evaluated | CON/CLI | — |
| 30 | `CC-045` | Cross-Platform Sync — Feishu ↔ portal | ALL | — |
| 31 | `AR-042` | Attribution Modeling — multi-touch | ADM | — |
| 32 | `AR-043` | Cohort Retention Curves — placement durability | ADM | — |
| 33 | `AR-047` | Report Versioning — track changes | ADM | — |
| 34 | `AR-049` | Data Refresh Scheduling | ADM | — |
| 35 | `SC-018` | Data Anonymization — anonymize PII | ADM | — |
| 36 | `SC-021` | Penetration Testing — regular testing | ADM | — |
| 37 | `SC-023` | Data Residency — choose storage region | ADM | — |
| 38 | `SC-030` | Suspicious Activity Detection | ADM | — |
| 39 | `SC-035` | Privacy Policy Management | ADM | — |
| 40 | `SC-036` | Data Processing Agreements | ADM | — |
| 41 | `SC-037` | Right to Deletion — automated | ADM/SYS | — |
| 42 | `SC-038` | Right to Access — data subject requests | ADM/SYS | — |
| 43 | `SC-040` | Accessibility Compliance — WCAG 2.1 AA | SYS | — |
| 44 | `SC-041` | Localization/i18n — multi-language | SYS | — |
| 45 | `SC-043` | Data Classification — sensitivity labels | ADM | — |
| 46 | `SC-044` | Automated Compliance Monitoring | SYS | — |
| 47 | `SC-045` | Security Incident Response Playbook | ADM | — |
| 48 | `AU-024` | Make.com Integration | SYS | — |
| 49 | `AU-047` | SCIM Provisioning — automated user provisioning | ADM/SYS | — |
| 50 | `CX-037` | Client Usage Analytics — track engagement | ADM | — |
| 51 | `CX-038` | Embedded Video in Portal — welcome messages | CLI | — |
| 52 | `CX-040` | Client Portal Dark Mode | CLI | — |
| 53 | `CX-043` | Placement Celebration — milestone acknowledgment | CLI/CON | — |
| 54 | `CX-050` | Client Churn Risk Indicator | ADM | — |

**Exit Criteria:**
- [ ] PWA installable
- [ ] Feature flags operational for gradual rollouts
- [ ] All GDPR compliance features live (right to deletion, access, DPA)
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] i18n framework in place
- [ ] DataTable column drag/resize working

---

### Sprint 9 — Premium Client Features
**Phase 3** | Week 17–18 | GitHub: [#56](https://github.com/kevinhongfr-star/lyc-intelligence/issues/56) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `AE-038` | Team Composition Analyzer (client-facing) | CON/CLI | — |
| 2 | `AI-024` | AI Talent Map Generator (client portal) | CON/CLI | — |
| 3 | `AI-030` | AI Market Briefing (client deliverable) | CON/CLI | — |
| 4 | `AI-057` | Talent Supply/Demand Heatmap (client view) | CON/CLI | — |
| 5 | `AI-060` | AI Executive Briefing Generator (board-ready) | CON | — |
| 6 | `AR-008` | Custom Report Builder (client-accessible) | ADM/CON | — |
| 7 | `AR-030` | Board Report Generator | ADM/CLI | — |
| 8 | `AR-037` | Automated Insight Generation (client) | ADM | — |
| 9 | `AR-050` | AI-Powered Query Interface (client) | ADM/CON | — |
| 10 | `CC-005` | Internal Notes — consultant-only (hidden from client) | CON | — |
| 11 | `CC-006` | Shared Decision Notes — structured pros/cons | CON/CLI | — |
| 12 | `CC-009` | Notification Preferences (per-user) | ALL | — |
| 13 | `CC-029` | Feishu/Lark Integration (full) | CON | — |
| 14 | `CC-032` | Multi-Channel Thread — unified email + platform | ALL | — |
| 15 | `CC-033` | Communication Scheduling | CON | — |
| 16 | `CX-002` | White-Label Portal — full customization | CLI/ADM | — |
| 17 | `CX-011` | NDA Management — digital signatures | CLI | — |
| 18 | `CX-012` | Billing Dashboard — invoice view & history | CLI/ADM | — |
| 19 | `CX-016` | Satisfaction Surveys — automated NPS | CLI/SYS | — |
| 20 | `CX-020` | Market Intelligence Sharing | CLI/CON | — |
| 21 | `CX-034` | Executive Summary Auto-Gen | CLI | — |
| 22 | `CX-036` | Data Room — secure document sharing | CLI/CON | — |
| 23 | `CX-044` | QBR Generator — quarterly review | CON/CLI | — |
| 24 | `CX-046` | ROI Dashboard | CLI | — |
| 25 | `CX-047` | Co-Branded Reports | CLI | — |
| 26 | `PW-020` | Mandate Templates (reusable) | CON | — |
| 27 | `PW-025` | Candidate Journey Mapping | CON/CLI | — |
| 28 | `PW-029` | Automated Nurturing — scheduled touchpoints | CON/SYS | — |
| 29 | `PW-041` | Sequence Builder — multi-step outreach | CON | — |
| 30 | `PW-046` | Workflows per Client — specific rules | CON/ADM | — |
| 31 | `SD-022` | Similar Candidate Search | CON | — |
| 32 | `SD-025` | Search Result Preview | CON | — |
| 33 | `SD-033` | Multilingual Search | CON | — |
| 34 | `SD-035` | Search Results Sharing | CON | — |
| 35 | `SD-039` | Search API | SYS | — |
| 36 | `SD-040` | Zero-State Optimization | CON | — |
| 37 | `AE-021` | Custom Assessment Builder | ADM/CON | — |
| 38 | `AE-023` | Normative Data Library | SYS | — |
| 39 | `AE-037` | Development Recommendations | CAN/CON | — |
| 40 | `AE-040` | Peer Comparison Engine | CON/CLI | — |
| 41 | `AE-041` | Predictive Performance Scoring | CON/CLI | — |
| 42 | `AE-043` | AI Question Generator | ADM | — |
| 43 | `AE-044` | Gamified Assessment Elements | CAN | — |
| 44 | `AE-045` | Situational Judgment Tests | CAN/SYS | — |
| 45 | `AE-046` | Cognitive Ability Module | CAN/SYS | — |
| 46 | `AE-047` | Emotional Intelligence Assessment | CAN/SYS | — |
| 47 | `AE-049` | Assessment Badge System | CAN | — |
| 48 | `AE-050` | Candidate Self-Development Portal | CAN | — |
| 49 | `AI-017` | AI Meeting Summarizer | CON | — |
| 50 | `AI-018` | Predictive Time-to-Fill | CON/CLI | — |
| 51 | `AI-019` | Offer Acceptance Probability | CON | — |
| 52 | `AI-020` | AI Bias Detector | CON/SYS | — |
| 53 | `AI-022` | AI Skill Gap Analyzer | CON | — |
| 54 | `AI-026` | Sentiment Analysis on Interview Notes | CON | — |

**Exit Criteria:**
- [ ] White-label portal fully branded per client
- [ ] Board-ready executive briefings auto-generated
- [ ] QBR generator producing quarterly reviews
- [ ] Data room with secure document sharing
- [ ] Co-branded reports (LYC + Client) generating
- [ ] Client ROI dashboard showing placement value

---

### Sprint 10 — Intelligence Completes
**Phase 3** | Week 19–20 | GitHub: [#57](https://github.com/kevinhongfr-star/lyc-intelligence/issues/57) | Features: 54

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `AI-011` | Talent Signal Feed | CON | — |
| 2 | `AI-024` | AI Talent Map Generator (full) | CON/CLI | — |
| 3 | `AI-025` | Candidate Persona Generator | CON | — |
| 4 | `AI-027` | AI Compensation Benchmarking (full) | CON/CLI | — |
| 5 | `AI-032` | AI Data Enrichment | SYS/CON | — |
| 6 | `AI-033` | Conversational Screening Chatbot | CAN/SYS | — |
| 7 | `AI-034` | AI Report Insights | CON/CLI | — |
| 8 | `AI-035` | AI Chart Builder | CON/CLI | — |
| 9 | `AI-037` | AI Document Classifier | SYS | — |
| 10 | `AI-040` | AI Culture Fit Analysis | CON | — |
| 11 | `AI-042` | AI Candidate Re-Engagement | CON/SYS | — |
| 12 | `AI-046` | AI Compliance Checker | ADM/SYS | — |
| 13 | `AI-047` | Voice-to-Notes | CON | — |
| 14 | `AI-048` | AI Follow-Up Reminder | CON | — |
| 15 | `AI-049` | Cross-Mandate Learning | SYS | — |
| 16 | `AI-051` | Multi-Modal AI Input | CON/CLI | — |
| 17 | `AI-053` | Automated Competitive Intelligence | CON/CLI | — |
| 18 | `AI-056` | AI Diversity Analytics | ADM/CON | — |
| 19 | `AI-059` | Predictive Attrition Model | CON/CLI | — |
| 20 | `AE-015` | Adaptive Difficulty (full) | CAN/SYS | — |
| 21 | `AE-019` | Role-Specific Benchmarking | CON/CLI | — |
| 22 | `AE-029` | Score Confidence Interval | CON/CLI | — |
| 23 | `AE-031` | Historical Assessment Tracking | CON | — |
| 24 | `AE-034` | Assessment Localization | CAN/SYS | — |
| 25 | `AE-038` | Team Composition Analyzer | CON/CLI | — |
| 26 | `AE-039` | Assessment Integration with Pipeline | CON/SYS | — |
| 27 | `AE-042` | White-Label Assessments | CLI | — |
| 28 | `AE-048` | Work Sample Evaluation | CON/CLI | — |
| 29 | `AR-034` | Cross-Tab Reports | ADM | — |
| 30 | `AR-038` | Anomaly Detection | ADM | — |
| 31 | `AR-039` | Period Comparison | ADM | — |
| 32 | `AR-041` | Leaderboard | ADM | — |
| 33 | `AR-044` | Heatmap Visualization | ADM/CON | — |
| 34 | `AR-046` | API Reporting | SYS | — |
| 35 | `AR-048` | Embedded Charts | ADM/CON | — |
| 36 | `AU-024` | Make.com Integration | SYS | — |
| 37 | `AU-047` | SCIM Provisioning | ADM/SYS | — |
| 38 | `CC-045` | Cross-Platform Sync | ALL | — |
| 39 | `CX-037` | Client Usage Analytics | ADM | — |
| 40 | `CX-038` | Embedded Video in Portal | CLI | — |
| 41 | `CX-040` | Client Portal Dark Mode | CLI | — |
| 42 | `CX-043` | Placement Celebration | CLI/CON | — |
| 43 | `CX-050` | Client Churn Risk Indicator | ADM | — |
| 44 | `PW-054` | Automation Rule Testing | ADM | — |
| 45 | `SC-018` | Data Anonymization | ADM | — |
| 46 | `SC-021` | Penetration Testing | ADM | — |
| 47 | `SC-023` | Data Residency | ADM | — |
| 48 | `SC-030` | Suspicious Activity Detection | ADM | — |
| 49 | `SC-035` | Privacy Policy Management | ADM | — |
| 50 | `SC-036` | Data Processing Agreements | ADM | — |
| 51 | `SC-043` | Data Classification | ADM | — |
| 52 | `SC-044` | Automated Compliance Monitoring | SYS | — |
| 53 | `SC-045` | Security Incident Response Playbook | ADM | — |
| 54 | `SD-019` | Salary Range Search | CON | — |

**Exit Criteria:**
- [ ] All AI intelligence features operational
- [ ] Full assessment suite with adaptive, gamified, work sample
- [ ] Complete analytics: heatmaps, anomaly detection, leaderboards
- [ ] All integrations: Make.com, SCIM, cross-platform sync
- [ ] Compliance: data residency, anonymization, incident response
- [ ] Client churn risk indicator functional

---

### Sprint 11 — P3 Polish + Accessibility
**Phase 4** | Week 21–22 | GitHub: [#58](https://github.com/kevinhongfr-star/lyc-intelligence/issues/58) | Features: 40

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|
| 1 | `AI-028` | Automated Reference Check Questions | CON | — |
| 2 | `AI-039` | AI Career Path Predictor | CON/CLI | — |
| 3 | `AI-043` | Real-Time AI Fact Check | CON | — |
| 4 | `AI-045` | Smart Template Selector | CON | — |
| 5 | `AI-050` | AI Persona Matching | ADM | — |
| 6 | `AI-058` | AI Contract/Agreement Summarizer | CON | — |
| 7 | `SD-023` | Search History | CON | — |
| 8 | `SD-026` | Search Keyboard Navigation | CON | — |
| 9 | `SD-028` | Search Analytics | ADM | — |
| 10 | `SD-031` | Pinned/Featured Results | ADM | — |
| 11 | `SD-034` | Voice Search | CON | — |
| 12 | `SD-036` | Index Status Dashboard | ADM | — |
| 13 | `UX-033` | Offline Mode — work without connectivity | CON | — |
| 14 | `UX-041` | A/B Testing Framework | ADM | — |
| 15 | `UX-047` | RTL Support — right-to-left | SYS | — |
| 16 | `UX-049` | High Contrast Mode | CON/CLI | — |
| 17 | `UX-054` | Mini Map — overview navigation | CON | — |
| 18 | `AE-033` | Criterion Validation Report | ADM | — |
| 19 | `AE-035` | Proctoring Mode | CAN/SYS | — |
| 20 | `AR-042` | Attribution Modeling | ADM | — |
| 21 | `AR-043` | Cohort Retention Curves | ADM | — |
| 22 | `AR-047` | Report Versioning | ADM | — |
| 23 | `AR-049` | Data Refresh Scheduling | ADM | — |
| 24 | `PW-054` | Automation Rule Testing | ADM | — |
| 25 | `SC-045` | Security Incident Response Playbook | ADM | — |
| 26 | `CC-045` | Cross-Platform Sync (polish) | ALL | — |
| 27 | `CX-050` | Client Churn Risk (polish) | ADM | — |
| 28 | `AI-059` | Predictive Attrition (polish) | CON/CLI | — |
| 29 | `AU-024` | Make.com Integration (polish) | SYS | — |
| 30 | `SC-018` | Data Anonymization (polish) | ADM | — |
| 31 | `SC-035` | Privacy Policy Management (polish) | ADM | — |
| 32 | `SC-036` | Data Processing Agreements (polish) | ADM | — |
| 33 | `SC-043` | Data Classification (polish) | ADM | — |
| 34 | `SC-044` | Automated Compliance Monitoring (polish) | SYS | — |
| 35 | `AE-033` | Criterion Validation (polish) | ADM | — |
| 36 | `AE-035` | Proctoring Mode (polish) | CAN/SYS | — |
| 37 | `AR-042` | Attribution Modeling (polish) | ADM | — |
| 38 | `AR-043` | Cohort Retention (polish) | ADM | — |
| 39 | `AR-047` | Report Versioning (polish) | ADM | — |
| 40 | `AR-049` | Data Refresh (polish) | ADM | — |

---

### Sprint 12 — Final Polish + Experimental
**Phase 4** | Week 23–24 | GitHub: [#59](https://github.com/kevinhongfr-star/lyc-intelligence/issues/59) | Features: 0

| # | ID | Feature | Segment | Spec |
|---|-----|---------|---------|------|

---

## 3. v2 Spec ↔ Ticket Cross-Reference

### `00_Master_Ticket_Registry.md` — prose spec (no formal ticket IDs)

### `01_Internal_Portal_Spec.md` — 73 tickets

- **IN-ACT** (8): `IN-ACT-001, IN-ACT-002, IN-ACT-003, IN-ACT-004, IN-ACT-005, IN-ACT-006, IN-ACT-007, IN-ACT-008`
  - *Not in roadmap sprints: IN-ACT-001, IN-ACT-002, IN-ACT-003, IN-ACT-004, IN-ACT-005, IN-ACT-006, IN-ACT-007, IN-ACT-008*
- **IN-ADM** (6): `IN-ADM-001, IN-ADM-002, IN-ADM-003, IN-ADM-004, IN-ADM-005, IN-ADM-006`
  - *Not in roadmap sprints: IN-ADM-001, IN-ADM-002, IN-ADM-003, IN-ADM-004, IN-ADM-005, IN-ADM-006*
- **IN-CAND** (10): `IN-CAND-001, IN-CAND-002, IN-CAND-003, IN-CAND-004, IN-CAND-005, IN-CAND-006, IN-CAND-007, IN-CAND-008, IN-CAND-009, IN-CAND-010`
  - *Not in roadmap sprints: IN-CAND-001, IN-CAND-002, IN-CAND-003, IN-CAND-004, IN-CAND-005, IN-CAND-006, IN-CAND-007, IN-CAND-008, IN-CAND-009, IN-CAND-010*
- **IN-COMP** (8): `IN-COMP-001, IN-COMP-002, IN-COMP-003, IN-COMP-004, IN-COMP-005, IN-COMP-006, IN-COMP-007, IN-COMP-008`
  - *Not in roadmap sprints: IN-COMP-001, IN-COMP-002, IN-COMP-003, IN-COMP-004, IN-COMP-005, IN-COMP-006, IN-COMP-007, IN-COMP-008*
- **IN-DASH** (8): `IN-DASH-001, IN-DASH-002, IN-DASH-003, IN-DASH-004, IN-DASH-005, IN-DASH-006, IN-DASH-007, IN-DASH-008`
  - *Not in roadmap sprints: IN-DASH-001, IN-DASH-002, IN-DASH-003, IN-DASH-004, IN-DASH-005, IN-DASH-006, IN-DASH-007, IN-DASH-008*
- **IN-GLB** (5): `IN-GLB-001, IN-GLB-002, IN-GLB-003, IN-GLB-004, IN-GLB-005`
  - *Not in roadmap sprints: IN-GLB-001, IN-GLB-002, IN-GLB-003, IN-GLB-004, IN-GLB-005*
- **IN-MAN** (10): `IN-MAN-001, IN-MAN-002, IN-MAN-003, IN-MAN-004, IN-MAN-005, IN-MAN-006, IN-MAN-007, IN-MAN-008, IN-MAN-009, IN-MAN-010`
  - *Not in roadmap sprints: IN-MAN-001, IN-MAN-002, IN-MAN-003, IN-MAN-004, IN-MAN-005, IN-MAN-006, IN-MAN-007, IN-MAN-008, IN-MAN-009, IN-MAN-010*
- **IN-NAV** (5): `IN-NAV-001, IN-NAV-002, IN-NAV-003, IN-NAV-004, IN-NAV-005`
  - *Not in roadmap sprints: IN-NAV-001, IN-NAV-002, IN-NAV-003, IN-NAV-004, IN-NAV-005*
- **IN-REP** (8): `IN-REP-001, IN-REP-002, IN-REP-003, IN-REP-004, IN-REP-005, IN-REP-006, IN-REP-007, IN-REP-008`
  - *Not in roadmap sprints: IN-REP-001, IN-REP-002, IN-REP-003, IN-REP-004, IN-REP-005, IN-REP-006, IN-REP-007, IN-REP-008*
- **IN-TEAM** (5): `IN-TEAM-001, IN-TEAM-002, IN-TEAM-003, IN-TEAM-004, IN-TEAM-005`
  - *Not in roadmap sprints: IN-TEAM-001, IN-TEAM-002, IN-TEAM-003, IN-TEAM-004, IN-TEAM-005*

### `02_Supabase_Backend_Architecture.md` — 12 tickets

- **CRON** (2): `CRON-001, CRON-005`
  - *Not in roadmap sprints: CRON-001, CRON-005*
- **DB** (2): `DB-001, DB-057`
  - *Not in roadmap sprints: DB-001, DB-057*
- **EF** (2): `EF-001, EF-012`
  - *Not in roadmap sprints: EF-001, EF-012*
- **RLS** (2): `RLS-001, RLS-045`
  - *Not in roadmap sprints: RLS-001, RLS-045*
- **RT** (2): `RT-001, RT-006`
  - *Not in roadmap sprints: RT-001, RT-006*
- **ST** (2): `ST-001, ST-007`
  - *Not in roadmap sprints: ST-001, ST-007*

### `03_UX_Behavioral_Mechanics.md` — 50 tickets

- **UX-A11Y** (5): `UX-A11Y-001, UX-A11Y-002, UX-A11Y-003, UX-A11Y-004, UX-A11Y-005`
  - *Not in roadmap sprints: UX-A11Y-001, UX-A11Y-002, UX-A11Y-003, UX-A11Y-004, UX-A11Y-005*
- **UX-EMP** (2): `UX-EMP-001, UX-EMP-002`
  - *Not in roadmap sprints: UX-EMP-001, UX-EMP-002*
- **UX-FRM** (5): `UX-FRM-001, UX-FRM-002, UX-FRM-003, UX-FRM-004, UX-FRM-005`
  - *Not in roadmap sprints: UX-FRM-001, UX-FRM-002, UX-FRM-003, UX-FRM-004, UX-FRM-005*
- **UX-I18N** (5): `UX-I18N-001, UX-I18N-002, UX-I18N-003, UX-I18N-004, UX-I18N-005`
  - *Not in roadmap sprints: UX-I18N-001, UX-I18N-002, UX-I18N-003, UX-I18N-004, UX-I18N-005*
- **UX-LOAD** (3): `UX-LOAD-001, UX-LOAD-002, UX-LOAD-003`
  - *Not in roadmap sprints: UX-LOAD-001, UX-LOAD-002, UX-LOAD-003*
- **UX-NOT** (10): `UX-NOT-001, UX-NOT-002, UX-NOT-003, UX-NOT-004, UX-NOT-005, UX-NOT-006, UX-NOT-007, UX-NOT-008, UX-NOT-009, UX-NOT-010`
  - *Not in roadmap sprints: UX-NOT-001, UX-NOT-002, UX-NOT-003, UX-NOT-004, UX-NOT-005, UX-NOT-006, UX-NOT-007, UX-NOT-008, UX-NOT-009, UX-NOT-010*
- **UX-PERF** (5): `UX-PERF-001, UX-PERF-002, UX-PERF-003, UX-PERF-004, UX-PERF-005`
  - *Not in roadmap sprints: UX-PERF-001, UX-PERF-002, UX-PERF-003, UX-PERF-004, UX-PERF-005*
- **UX-SRCH** (4): `UX-SRCH-001, UX-SRCH-002, UX-SRCH-003, UX-SRCH-004`
  - *Not in roadmap sprints: UX-SRCH-001, UX-SRCH-002, UX-SRCH-003, UX-SRCH-004*
- **UX-TBL** (6): `UX-TBL-001, UX-TBL-002, UX-TBL-003, UX-TBL-004, UX-TBL-005, UX-TBL-006`
  - *Not in roadmap sprints: UX-TBL-001, UX-TBL-002, UX-TBL-003, UX-TBL-004, UX-TBL-005, UX-TBL-006*
- **UX-UPL** (5): `UX-UPL-001, UX-UPL-002, UX-UPL-003, UX-UPL-004, UX-UPL-005`
  - *Not in roadmap sprints: UX-UPL-001, UX-UPL-002, UX-UPL-003, UX-UPL-004, UX-UPL-005*

### `04_Client_Portal_Spec.md` — 67 tickets

- **CL-AF** (6): `CL-AF-001, CL-AF-002, CL-AF-003, CL-AF-004, CL-AF-005, CL-AF-006`
  - *Not in roadmap sprints: CL-AF-001, CL-AF-002, CL-AF-003, CL-AF-004, CL-AF-005, CL-AF-006*
- **CL-BIL** (7): `CL-BIL-001, CL-BIL-002, CL-BIL-003, CL-BIL-004, CL-BIL-005, CL-BIL-006, CL-BIL-007`
  - *Not in roadmap sprints: CL-BIL-001, CL-BIL-002, CL-BIL-003, CL-BIL-004, CL-BIL-005, CL-BIL-006, CL-BIL-007*
- **CL-CD** (8): `CL-CD-001, CL-CD-002, CL-CD-003, CL-CD-004, CL-CD-005, CL-CD-006, CL-CD-007, CL-CD-008`
  - *Not in roadmap sprints: CL-CD-001, CL-CD-002, CL-CD-003, CL-CD-004, CL-CD-005, CL-CD-006, CL-CD-007, CL-CD-008*
- **CL-COMP** (6): `CL-COMP-001, CL-COMP-002, CL-COMP-003, CL-COMP-004, CL-COMP-005, CL-COMP-006`
  - *Not in roadmap sprints: CL-COMP-001, CL-COMP-002, CL-COMP-003, CL-COMP-004, CL-COMP-005, CL-COMP-006*
- **CL-CS** (8): `CL-CS-001, CL-CS-002, CL-CS-003, CL-CS-004, CL-CS-005, CL-CS-006, CL-CS-007, CL-CS-008`
  - *Not in roadmap sprints: CL-CS-001, CL-CS-002, CL-CS-003, CL-CS-004, CL-CS-005, CL-CS-006, CL-CS-007, CL-CS-008*
- **CL-DASH** (8): `CL-DASH-001, CL-DASH-002, CL-DASH-003, CL-DASH-004, CL-DASH-005, CL-DASH-006, CL-DASH-007, CL-DASH-008`
  - *Not in roadmap sprints: CL-DASH-001, CL-DASH-002, CL-DASH-003, CL-DASH-004, CL-DASH-005, CL-DASH-006, CL-DASH-007, CL-DASH-008*
- **CL-MAN** (8): `CL-MAN-001, CL-MAN-002, CL-MAN-003, CL-MAN-004, CL-MAN-005, CL-MAN-006, CL-MAN-007, CL-MAN-008`
  - *Not in roadmap sprints: CL-MAN-001, CL-MAN-002, CL-MAN-003, CL-MAN-004, CL-MAN-005, CL-MAN-006, CL-MAN-007, CL-MAN-008*
- **CL-MC** (3): `CL-MC-001, CL-MC-002, CL-MC-003`
  - *Not in roadmap sprints: CL-MC-001, CL-MC-002, CL-MC-003*
- **CL-MD** (10): `CL-MD-001, CL-MD-002, CL-MD-003, CL-MD-004, CL-MD-005, CL-MD-006, CL-MD-007, CL-MD-008, CL-MD-009, CL-MD-010`
  - *Not in roadmap sprints: CL-MD-001, CL-MD-002, CL-MD-003, CL-MD-004, CL-MD-005, CL-MD-006, CL-MD-007, CL-MD-008, CL-MD-009, CL-MD-010*
- **CL-WL** (3): `CL-WL-001, CL-WL-002, CL-WL-003`
  - *Not in roadmap sprints: CL-WL-001, CL-WL-002, CL-WL-003*

### `05_The_Council_Portal_Spec.md` — 113 tickets

- **COM** (1): `COM-001`
  - *Not in roadmap sprints: COM-001*
- **TC-A1** (7): `TC-A1-001, TC-A1-002, TC-A1-003, TC-A1-004, TC-A1-005, TC-A1-006, TC-A1-007`
  - *Not in roadmap sprints: TC-A1-001, TC-A1-002, TC-A1-003, TC-A1-004, TC-A1-005, TC-A1-006, TC-A1-007*
- **TC-A2** (6): `TC-A2-001, TC-A2-002, TC-A2-003, TC-A2-004, TC-A2-005, TC-A2-006`
  - *Not in roadmap sprints: TC-A2-001, TC-A2-002, TC-A2-003, TC-A2-004, TC-A2-005, TC-A2-006*
- **TC-A3** (5): `TC-A3-001, TC-A3-002, TC-A3-003, TC-A3-004, TC-A3-005`
  - *Not in roadmap sprints: TC-A3-001, TC-A3-002, TC-A3-003, TC-A3-004, TC-A3-005*
- **TC-A4** (4): `TC-A4-001, TC-A4-002, TC-A4-003, TC-A4-004`
  - *Not in roadmap sprints: TC-A4-001, TC-A4-002, TC-A4-003, TC-A4-004*
- **TC-BJ** (7): `TC-BJ-001, TC-BJ-002, TC-BJ-003, TC-BJ-004, TC-BJ-005, TC-BJ-006, TC-BJ-007`
  - *Not in roadmap sprints: TC-BJ-001, TC-BJ-002, TC-BJ-003, TC-BJ-004, TC-BJ-005, TC-BJ-006, TC-BJ-007*
- **TC-C1** (8): `TC-C1-001, TC-C1-002, TC-C1-003, TC-C1-004, TC-C1-005, TC-C1-006, TC-C1-007, TC-C1-008`
  - *Not in roadmap sprints: TC-C1-001, TC-C1-002, TC-C1-003, TC-C1-004, TC-C1-005, TC-C1-006, TC-C1-007, TC-C1-008*
- **TC-C2** (10): `TC-C2-001, TC-C2-002, TC-C2-003, TC-C2-004, TC-C2-005, TC-C2-006, TC-C2-007, TC-C2-008, TC-C2-009, TC-C2-010`
  - *Not in roadmap sprints: TC-C2-001, TC-C2-002, TC-C2-003, TC-C2-004, TC-C2-005, TC-C2-006, TC-C2-007, TC-C2-008, TC-C2-009, TC-C2-010*
- **TC-C3** (8): `TC-C3-001, TC-C3-002, TC-C3-003, TC-C3-004, TC-C3-005, TC-C3-006, TC-C3-007, TC-C3-008`
  - *Not in roadmap sprints: TC-C3-001, TC-C3-002, TC-C3-003, TC-C3-004, TC-C3-005, TC-C3-006, TC-C3-007, TC-C3-008*
- **TC-C4** (8): `TC-C4-001, TC-C4-002, TC-C4-003, TC-C4-004, TC-C4-005, TC-C4-006, TC-C4-007, TC-C4-008`
  - *Not in roadmap sprints: TC-C4-001, TC-C4-002, TC-C4-003, TC-C4-004, TC-C4-005, TC-C4-006, TC-C4-007, TC-C4-008*
- **TC-C5** (7): `TC-C5-001, TC-C5-002, TC-C5-003, TC-C5-004, TC-C5-005, TC-C5-006, TC-C5-007`
  - *Not in roadmap sprints: TC-C5-001, TC-C5-002, TC-C5-003, TC-C5-004, TC-C5-005, TC-C5-006, TC-C5-007*
- **TC-C6** (6): `TC-C6-001, TC-C6-002, TC-C6-003, TC-C6-004, TC-C6-005, TC-C6-006`
  - *Not in roadmap sprints: TC-C6-001, TC-C6-002, TC-C6-003, TC-C6-004, TC-C6-005, TC-C6-006*
- **TC-C7** (4): `TC-C7-001, TC-C7-002, TC-C7-003, TC-C7-004`
  - *Not in roadmap sprints: TC-C7-001, TC-C7-002, TC-C7-003, TC-C7-004*
- **TC-D1** (13): `TC-D1-001, TC-D1-002, TC-D1-003, TC-D1-004, TC-D1-005, TC-D1-006, TC-D1-007, TC-D1-008, TC-D1-009, TC-D1-010, TC-D1-011, TC-D1-012, TC-D1-013`
  - *Not in roadmap sprints: TC-D1-001, TC-D1-002, TC-D1-003, TC-D1-004, TC-D1-005, TC-D1-006, TC-D1-007, TC-D1-008, TC-D1-009, TC-D1-010, TC-D1-011, TC-D1-012, TC-D1-013*
- **TC-D2** (3): `TC-D2-001, TC-D2-002, TC-D2-003`
  - *Not in roadmap sprints: TC-D2-001, TC-D2-002, TC-D2-003*
- **TC-P1** (8): `TC-P1-001, TC-P1-002, TC-P1-003, TC-P1-004, TC-P1-005, TC-P1-006, TC-P1-007, TC-P1-008`
  - *Not in roadmap sprints: TC-P1-001, TC-P1-002, TC-P1-003, TC-P1-004, TC-P1-005, TC-P1-006, TC-P1-007, TC-P1-008*
- **TC-P2** (8): `TC-P2-001, TC-P2-002, TC-P2-003, TC-P2-004, TC-P2-005, TC-P2-006, TC-P2-007, TC-P2-008`
  - *Not in roadmap sprints: TC-P2-001, TC-P2-002, TC-P2-003, TC-P2-004, TC-P2-005, TC-P2-006, TC-P2-007, TC-P2-008*

### `06_Intelligence_Layer_Spec.md` — 44 tickets

- **INT-AI** (9): `INT-AI-001, INT-AI-002, INT-AI-003, INT-AI-004, INT-AI-005, INT-AI-006, INT-AI-007, INT-AI-008, INT-AI-009`
  - *Not in roadmap sprints: INT-AI-001, INT-AI-002, INT-AI-003, INT-AI-004, INT-AI-005, INT-AI-006, INT-AI-007, INT-AI-008, INT-AI-009*
- **INT-API** (5): `INT-API-001, INT-API-002, INT-API-003, INT-API-004, INT-API-005`
  - *Not in roadmap sprints: INT-API-001, INT-API-002, INT-API-003, INT-API-004, INT-API-005*
- **INT-COMP** (10): `INT-COMP-001, INT-COMP-002, INT-COMP-003, INT-COMP-004, INT-COMP-005, INT-COMP-006, INT-COMP-007, INT-COMP-008, INT-COMP-009, INT-COMP-010`
  - *Not in roadmap sprints: INT-COMP-001, INT-COMP-002, INT-COMP-003, INT-COMP-004, INT-COMP-005, INT-COMP-006, INT-COMP-007, INT-COMP-008, INT-COMP-009, INT-COMP-010*
- **INT-DASH** (8): `INT-DASH-001, INT-DASH-002, INT-DASH-003, INT-DASH-004, INT-DASH-005, INT-DASH-006, INT-DASH-007, INT-DASH-008`
  - *Not in roadmap sprints: INT-DASH-001, INT-DASH-002, INT-DASH-003, INT-DASH-004, INT-DASH-005, INT-DASH-006, INT-DASH-007, INT-DASH-008*
- **INT-MATCH** (5): `INT-MATCH-001, INT-MATCH-002, INT-MATCH-003, INT-MATCH-004, INT-MATCH-005`
  - *Not in roadmap sprints: INT-MATCH-001, INT-MATCH-002, INT-MATCH-003, INT-MATCH-004, INT-MATCH-005*
- **INT-SRC** (7): `INT-SRC-001, INT-SRC-002, INT-SRC-003, INT-SRC-004, INT-SRC-005, INT-SRC-006, INT-SRC-007`
  - *Not in roadmap sprints: INT-SRC-001, INT-SRC-002, INT-SRC-003, INT-SRC-004, INT-SRC-005, INT-SRC-006, INT-SRC-007*

### `07_Candidate_Portal_Spec_v2.md` — 68 tickets

- **CPT-AL** (5): `CPT-AL-001, CPT-AL-002, CPT-AL-003, CPT-AL-004, CPT-AL-005`
  - *Not in roadmap sprints: CPT-AL-001, CPT-AL-002, CPT-AL-003, CPT-AL-004, CPT-AL-005*
- **CPT-P1** (6): `CPT-P1-001, CPT-P1-002, CPT-P1-003, CPT-P1-004, CPT-P1-005, CPT-P1-006`
  - *Not in roadmap sprints: CPT-P1-001, CPT-P1-002, CPT-P1-003, CPT-P1-004, CPT-P1-005, CPT-P1-006*
- **CPT-P2** (8): `CPT-P2-001, CPT-P2-002, CPT-P2-003, CPT-P2-004, CPT-P2-005, CPT-P2-006, CPT-P2-007, CPT-P2-008`
  - *Not in roadmap sprints: CPT-P2-001, CPT-P2-002, CPT-P2-003, CPT-P2-004, CPT-P2-005, CPT-P2-006, CPT-P2-007, CPT-P2-008*
- **CPT-P3** (7): `CPT-P3-001, CPT-P3-002, CPT-P3-003, CPT-P3-004, CPT-P3-005, CPT-P3-006, CPT-P3-007`
  - *Not in roadmap sprints: CPT-P3-001, CPT-P3-002, CPT-P3-003, CPT-P3-004, CPT-P3-005, CPT-P3-006, CPT-P3-007*
- **CPT-P4** (8): `CPT-P4-001, CPT-P4-002, CPT-P4-003, CPT-P4-004, CPT-P4-005, CPT-P4-006, CPT-P4-007, CPT-P4-008`
  - *Not in roadmap sprints: CPT-P4-001, CPT-P4-002, CPT-P4-003, CPT-P4-004, CPT-P4-005, CPT-P4-006, CPT-P4-007, CPT-P4-008*
- **CPT-P5** (7): `CPT-P5-001, CPT-P5-002, CPT-P5-003, CPT-P5-004, CPT-P5-005, CPT-P5-006, CPT-P5-007`
  - *Not in roadmap sprints: CPT-P5-001, CPT-P5-002, CPT-P5-003, CPT-P5-004, CPT-P5-005, CPT-P5-006, CPT-P5-007*
- **CPT-P6** (7): `CPT-P6-001, CPT-P6-002, CPT-P6-003, CPT-P6-004, CPT-P6-005, CPT-P6-006, CPT-P6-007`
  - *Not in roadmap sprints: CPT-P6-001, CPT-P6-002, CPT-P6-003, CPT-P6-004, CPT-P6-005, CPT-P6-006, CPT-P6-007*
- **CPT-P7** (8): `CPT-P7-001, CPT-P7-002, CPT-P7-003, CPT-P7-004, CPT-P7-005, CPT-P7-006, CPT-P7-007, CPT-P7-008`
  - *Not in roadmap sprints: CPT-P7-001, CPT-P7-002, CPT-P7-003, CPT-P7-004, CPT-P7-005, CPT-P7-006, CPT-P7-007, CPT-P7-008*
- **CPT-P8** (6): `CPT-P8-001, CPT-P8-002, CPT-P8-003, CPT-P8-004, CPT-P8-005, CPT-P8-006`
  - *Not in roadmap sprints: CPT-P8-001, CPT-P8-002, CPT-P8-003, CPT-P8-004, CPT-P8-005, CPT-P8-006*
- **CPT-P9** (6): `CPT-P9-001, CPT-P9-002, CPT-P9-003, CPT-P9-004, CPT-P9-005, CPT-P9-006`
  - *Not in roadmap sprints: CPT-P9-001, CPT-P9-002, CPT-P9-003, CPT-P9-004, CPT-P9-005, CPT-P9-006*

### `08_Commerce_Layer_Spec.md` — 82 tickets

- **COM** (9): `COM-001, COM-002, COM-003, COM-004, COM-005, COM-006, COM-007, COM-008, COM-009`
  - *Not in roadmap sprints: COM-001, COM-002, COM-003, COM-004, COM-005, COM-006, COM-007, COM-008, COM-009*
- **COM-BIL** (7): `COM-BIL-001, COM-BIL-002, COM-BIL-003, COM-BIL-004, COM-BIL-005, COM-BIL-006, COM-BIL-007`
  - *Not in roadmap sprints: COM-BIL-001, COM-BIL-002, COM-BIL-003, COM-BIL-004, COM-BIL-005, COM-BIL-006, COM-BIL-007*
- **COM-CHK** (10): `COM-CHK-001, COM-CHK-002, COM-CHK-003, COM-CHK-004, COM-CHK-005, COM-CHK-006, COM-CHK-007, COM-CHK-008, COM-CHK-009, COM-CHK-010`
  - *Not in roadmap sprints: COM-CHK-001, COM-CHK-002, COM-CHK-003, COM-CHK-004, COM-CHK-005, COM-CHK-006, COM-CHK-007, COM-CHK-008, COM-CHK-009, COM-CHK-010*
- **COM-CL** (10): `COM-CL-001, COM-CL-002, COM-CL-003, COM-CL-004, COM-CL-005, COM-CL-006, COM-CL-007, COM-CL-008, COM-CL-009, COM-CL-010`
  - *Not in roadmap sprints: COM-CL-001, COM-CL-002, COM-CL-003, COM-CL-004, COM-CL-005, COM-CL-006, COM-CL-007, COM-CL-008, COM-CL-009, COM-CL-010*
- **COM-CNC** (7): `COM-CNC-001, COM-CNC-002, COM-CNC-003, COM-CNC-004, COM-CNC-005, COM-CNC-006, COM-CNC-007`
  - *Not in roadmap sprints: COM-CNC-001, COM-CNC-002, COM-CNC-003, COM-CNC-004, COM-CNC-005, COM-CNC-006, COM-CNC-007*
- **COM-DEX** (7): `COM-DEX-001, COM-DEX-002, COM-DEX-003, COM-DEX-004, COM-DEX-005, COM-DEX-006, COM-DEX-007`
  - *Not in roadmap sprints: COM-DEX-001, COM-DEX-002, COM-DEX-003, COM-DEX-004, COM-DEX-005, COM-DEX-006, COM-DEX-007*
- **COM-PG** (7): `COM-PG-001, COM-PG-002, COM-PG-003, COM-PG-004, COM-PG-005, COM-PG-006, COM-PG-007`
  - *Not in roadmap sprints: COM-PG-001, COM-PG-002, COM-PG-003, COM-PG-004, COM-PG-005, COM-PG-006, COM-PG-007*
- **COM-REV** (8): `COM-REV-001, COM-REV-002, COM-REV-003, COM-REV-004, COM-REV-005, COM-REV-006, COM-REV-007, COM-REV-008`
  - *Not in roadmap sprints: COM-REV-001, COM-REV-002, COM-REV-003, COM-REV-004, COM-REV-005, COM-REV-006, COM-REV-007, COM-REV-008*
- **COM-SW** (9): `COM-SW-001, COM-SW-002, COM-SW-003, COM-SW-004, COM-SW-005, COM-SW-006, COM-SW-007, COM-SW-008, COM-SW-009`
  - *Not in roadmap sprints: COM-SW-001, COM-SW-002, COM-SW-003, COM-SW-004, COM-SW-005, COM-SW-006, COM-SW-007, COM-SW-008, COM-SW-009*
- **COM-XS** (7): `COM-XS-001, COM-XS-002, COM-XS-003, COM-XS-004, COM-XS-005, COM-XS-006, COM-XS-007`
  - *Not in roadmap sprints: COM-XS-001, COM-XS-002, COM-XS-003, COM-XS-004, COM-XS-005, COM-XS-006, COM-XS-007*
- **INV** (1): `INV-2026`
  - *Not in roadmap sprints: INV-2026*

### `09_SHIFT_Composite_Data_Model_Spec.md` — prose spec (no formal ticket IDs)

### `10_Online_Diagnostic_Assessment_Spec.md` — prose spec (no formal ticket IDs)

### `11_Cohort_Analytics_Spec.md` — prose spec (no formal ticket IDs)

### `12_Academy_LMS_Complete_Spec.md` — prose spec (no formal ticket IDs)

### `13_Intelligence_Reports_Spec.md` — prose spec (no formal ticket IDs)

### `14_Legal_Pages_Compliance_Spec.md` — prose spec (no formal ticket IDs)

### `15_First_Time_Onboarding_Spec.md` — prose spec (no formal ticket IDs)

### `16_Portal_Product_Design_Gap_Analysis.md` — prose spec (no formal ticket IDs)

### `17_Design_System_Component_Library_Spec.md` — prose spec (no formal ticket IDs)

### `18_Public_Site_And_Activation_Flows_Spec.md` — prose spec (no formal ticket IDs)

### `19_Email_Admin_Analytics_Spec.md` — prose spec (no formal ticket IDs)

---

## 4. GitHub Issue Map

### Epic Issues (Sprint-level)

| Issue | Sprint | Title | Labels |
|-------|--------|-------|--------|
| [#47](https://github.com/kevinhongfr-star/lyc-intelligence/issues/47) | Sprint 0 | UI Foundation + Security Core | `phase:0, sprint:0, P0` |
| [#48](https://github.com/kevinhongfr-star/lyc-intelligence/issues/48) | Sprint 1 | Search & P0 Assessments | `phase:0, sprint:1, P0` |
| [#49](https://github.com/kevinhongfr-star/lyc-intelligence/issues/49) | Sprint 2 | Pipeline + Client Portal Core | `phase:1, sprint:2, P1` |
| [#50](https://github.com/kevinhongfr-star/lyc-intelligence/issues/50) | Sprint 3 | Integration + Security Layer | `phase:1, sprint:3, P1` |
| [#51](https://github.com/kevinhongfr-star/lyc-intelligence/issues/51) | Sprint 4 | Analytics + AI + Collaboration | `phase:1, sprint:4, P1` |
| [#52](https://github.com/kevinhongfr-star/lyc-intelligence/issues/52) | Sprint 5 | DnD + Dark Mode + P1 Complete | `phase:1, sprint:5, P1` |
| [#53](https://github.com/kevinhongfr-star/lyc-intelligence/issues/53) | Sprint 6 | AI Intelligence Layer | `phase:2, sprint:6, P2` |
| [#54](https://github.com/kevinhongfr-star/lyc-intelligence/issues/54) | Sprint 7 | Advanced Assessment + Client Intel | `phase:2, sprint:7, P2` |
| [#55](https://github.com/kevinhongfr-star/lyc-intelligence/issues/55) | Sprint 8 | P2 Polish + Compliance | `phase:2, sprint:8, P2` |
| [#56](https://github.com/kevinhongfr-star/lyc-intelligence/issues/56) | Sprint 9 | Premium Client Features | `phase:3, sprint:9, P2` |
| [#57](https://github.com/kevinhongfr-star/lyc-intelligence/issues/57) | Sprint 10 | Intelligence Completes | `phase:3, sprint:10, P2` |
| [#58](https://github.com/kevinhongfr-star/lyc-intelligence/issues/58) | Sprint 11 | P3 Polish + A11y | `phase:4, sprint:11, P3` |
| [#59](https://github.com/kevinhongfr-star/lyc-intelligence/issues/59) | Sprint 12 | Launch Readiness | `phase:4, sprint:12, P3` |
| [#121](https://github.com/kevinhongfr-star/lyc-intelligence/issues/121) | Email Engine | Nexus Email Generator Engine | `phase:2, P0` |

### Build Issues (Component-level)

| Issue Range | Source | Description |
|-------------|--------|-------------|
| #1–#7 | DEX AI Nexus Phase 1 | N1-N7 companion tickets |
| #13–#32 | Phase 2 — Growth Layer | Core platform build |
| #33–#46 | Phase 2 — Growth Layer | Extended build tickets |
| #101–#120 | Email Generator Engine (EPIC #121) | Nexus Email Generator: 20 tickets across 7 modules (Core, Brand Gov, Templates, Quality Gate, Delivery, Integration, Consistency) |

---

## 5. Remediation Specs

Post-audit fix specs. Execution: 01 → 02+03+04 (parallel) → 05+06+07 (parallel) → 08+09

| # | Spec | Priority | Effort | Key Issue |
|---|------|----------|--------|-----------|
| REM_01 | Auth Unification | P0 | 1-2 days | Dual auth systems |
| REM_02 | Client Portal Fix | P0 | 3-5 days | Client data leak |
| REM_03 | Candidate Portal Fix | P0 | 3-4 days | Dead-end after assessment |
| REM_04 | Role Navigation | P0 | 1-2 days | No role-based sidebar |
| REM_05 | Consultant Experience | P1 | 4-6 days | No onboarding/tasks |
| REM_06 | BD Manager | P1 | 4-5 days | No BD experience |
| REM_07 | Team Lead | P1 | 4-5 days | No oversight/approvals |
| REM_08 | Design System | P2 | 1-2 days | DS duplication |
| REM_09 | Admin Completion | P2 | 3-4 days | No user/credit mgmt |

**Total:** 24-35 days

---

## 6. DEX AI Nexus Phase 1 Tickets

Companion AI system — separate from platform sprints. ~160-200h, Weeks 1-6.

| Ticket | Scope | Hours | Dependencies |
|--------|-------|-------|-------------|
| N1 | Conversation Engine + Intent Router | 28-35h | None (start here) |
| N2 | Memory System | 24-30h | N1 |
| N3 | Context Assembly + Tier Gating | 16-20h | N1, N2 |
| N4 | RAG Content Library | 20-28h | N1, N2 |
| N5 | Proactive + Recommendation Engine | 24-30h | N1–N4 |
| N6 | Journey Intelligence Dashboard | 20-25h | N1, N2, N3 |
| N7 | Stripe Billing | 20-28h | None (parallel) |

**Chain:** N1 → N2 → N3 → N4 → N5 → N6 | N7 parallel

---

## 7. Council Pricing Coverage

| Element | Coverage | Specs | Notes |
|---------|----------|-------|-------|
| Membership Tiers | ✅ | 05, 05b, 08 | CNC-FOUNDING/INDIVIDUAL/CORPORATE/PE-PARTNER |
| DEX AI Credit Packs | ✅ | 08 | B2C-DEX-STARTER/PRO/EXEC |
| DEX AI Subscriptions | ✅ | 08 | B2C-DEX-MONTHLY, MONTHLY-PRO |
| Dual Credit Model | ✅ | 05b | DEX Credits ≠ Council Credits |
| B2C→Council Journey | ✅ | 05b | ANONYMOUS→INTRO→PAID_DEX→COUNCIL |
| Landing/Application Page | ⚠️ | 05, 05b | Application exists; public pricing page needed |
| Coaching Booking | ❌ | 05c (code only) | COA-SESSION exists; no booking UX |
| Workshop/Event Mgmt | ❌ | 05c (code only) | EVT-WORKSHOP exists; no event system |
| Loyalty/Rewards Engine | ❌ | — | No points/referrals/loyalty in any spec |
| Tier-Specific Welcome | ⚠️ | 15 | Generic onboarding; not tier-aware |
| Digital Badges | ⚠️ | 05b | DC-001–006 exist; limited scope |
| Membership Lifecycle | ❌ | — | No renewal/downgrade/failure handling |
| Revenue Forecasting | ❌ | — | No membership revenue forecasting |
| Public Pricing Page | ❌ | — | No external pricing comparison page |

### Council Gap — Additional Effort

| Priority | Gap | Days |
|----------|-----|------|
| P0 | Public Pricing Page | 2-3 |
| P1 | Coaching Booking System | 5-7 |
| P1 | Tier-Specific Welcome Flows | 2-3 |
| P1 | Membership Lifecycle Mgmt | 3-4 |
| P1 | Per-Diagnostic Pricing Table | 1 |
| P2 | Loyalty/Rewards Engine | 3-5 |
| P2 | Workshop/Event Management | 4-6 |
| P2 | Revenue Forecasting Model | 2-3 |
| P3 | Digital Badge Enhancement | 2-3 |
| | **Total** | **24-37** |

---

## 8. Dependency Graph

```
Phase 0 (Weeks 1-2)
├── S0: UI Foundation + Security Core (48 features)
└── S1: Search + P0 Assessments (54 features)
     │
Phase 1 (Weeks 3-10)
├── S2: Pipeline + Client Portal (54)
├── S3: Integration + Security (54)
├── S4: Analytics + AI + Collab (54)
└── S5: DnD + Dark Mode + P1 ✅ (54)
     │
Phase 2 (Weeks 11-16)
├── S6: AI Intelligence Layer (54)
├── S7: Advanced Assessment + Client Intel (54)
└── S8: P2 Polish + Compliance (54)
     │
Phase 3 (Weeks 17-20)
├── S9: Premium Client Features (54)
└── S10: Intelligence Completes (54)
     │
Phase 4 (Weeks 21-24)
├── S11: P3 Polish + A11y (40)
└── S12: Launch Readiness (8)

Parallel: DEX AI Nexus (N1-N7)
  N7 (Stripe) ─── parallel from Week 1
  N1 → N2 → N3 → N4 → N5 → N6 (sequential)

Parallel: Remediation (REM_01-09)
  P0: Week 1-2 | P1: Week 3-5 | P2: Week 5-6
```

---

## 9. Status Dashboard

### By Phase

| Phase | Status | Unique Features | GitHub Epics |
|-------|--------|----------------|--------------|
| Phase 0 | 🔴 Not started | 101 | #47, #48 |
| Phase 1 | 🔴 Not started | 216 | #49, #50, #51, #52 |
| Phase 2 | 🔴 Not started | 162 | #53, #54, #55 |
| Phase 3 | 🔴 Not started | 106 | #56, #57 |
| Phase 4 | 🔴 Not started | 34 | #58, #59 |

### By Spec Category

| Category | Spec | Tickets | Status |
|----------|------|---------|--------|
| Internal Portal | 01 | 73 | 🔴 |
| Supabase Backend | 02 | 12 | 🔴 |
| UX & Behavioral | 03 | 50 | 🔴 |
| Client Portal | 04 | 67 | 🔴 |
| Council Portal | 05+05b+05c | 113 | 🔴 |
| Intelligence Layer | 06 | 44 | 🔴 |
| Candidate Portal | 07 | 68 | 🔴 |
| Commerce Layer | 08 | 82 | 🔴 |
| SHIFT Model | 09 | prose | 🔴 |
| Online Diagnostic | 10 | prose | 🔴 |
| Cohort Analytics | 11 | prose | 🔴 |
| Academy LMS | 12 | prose | 🔴 |
| Intelligence Reports | 13 | prose | 🔴 |
| Legal/Compliance | 14 | prose | 🔴 |
| First-Time Onboarding | 15 | prose | 🔴 |
| Design System | 17 | prose | 🔴 |
| Public Site | 18 | prose | 🔴 |
| Email/Admin/Analytics | 19 | prose | 🔴 |

### Open Blockers

| Blocker | Impact | Owner |
|---------|--------|-------|
| DRIVE dimension conflict | Assessment scoring ambiguous | Kevin |
| Stripe env vars | Commerce layer blocked | Kevin |
| RESEND_API_KEY | Email notifications blocked | Kevin |
| Notion Task Tracker 404 | Write-back blocked | Notion API |
| DeepSeek alias deprecation | ~Jul 24 — code update needed | Engineering |

### File Location Map

| Document | Path |
|----------|------|
| **Master Build Index (this)** | `docs/MASTER_BUILD_INDEX.md` |
| Spec Central Index | `docs/SPEC_CENTRAL_INDEX.md` |
| 500 Feature Master List | `docs/FEATURE_MASTER_LIST_500.md` |
| Client Portal Feature Map | `docs/CLIENT_PORTAL_FEATURE_MAP.md` |
| Implementation Roadmap | `docs/roadmap/IMPLEMENTATION_ROADMAP.md` |
| Master Audit Summary | `docs/audits/MASTER_AUDIT_SUMMARY.md` |
| v2 Specs (01–08) | `specs/v2/` |
| v2 Specs (09–19) | `specs/v2/` |
| Remediation (01–09) | `specs/remediation/` |
| DEX AI Master Spec | `docs/DEX_AI_MASTER_SPEC.md` |
| Nexus Phase 1 Tickets | `docs/DEX_AI_NEXUS_PHASE1_TICKETS.md` |
| Email Generator Spec v2.1 | `docs/EMAIL_GENERATOR_SPEC.md` |
| Email Generator Tickets Index | `docs/EMAIL_GENERATOR_TICKETS_INDEX.md` |

---

*Living document. Update as sprints complete, specs change, or priorities shift.*