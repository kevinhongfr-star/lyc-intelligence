# LYC Intelligence — Client Portal Feature Map (500 Features)

> **Version:** 1.0 | **Date:** 2026-07-21
> **Maps to:** FEATURE_MASTER_LIST_500.md
> **Purpose:** Every feature mapped to its Client Portal manifestation

---

## Client Portal Architecture

```
CLIENT PORTAL
├── 1. Dashboard .................. Command center, KPIs, alerts
├── 2. Mandates ................... Active searches, pipeline, progress
│   ├── Mandate Detail
│   ├── Pipeline View
│   └── Milestone Timeline
├── 3. Candidates ................ Shortlists, profiles, comparison
│   ├── Shortlist (Ranked)
│   ├── Long List
│   ├── Candidate Detail (SlideOver)
│   ├── Comparison Matrix
│   └── Feedback & Ratings
├── 4. Assessments ............... LENS/DRIVE/SHIFT reports
│   ├── Assessment Reports
│   ├── Scorecards
│   ├── Comparison View
│   └── Take Assessment (if invited)
├── 5. Talent Intelligence ....... Org charts, market maps
│   ├── Competitor Org Charts
│   ├── Talent Market Heatmaps
│   ├── Compensation Benchmarks
│   └── Market Briefings
├── 6. Documents ................. Deliverables, reports, agreements
│   ├── Report Library
│   ├── Branded PDFs
│   ├── Agreements/NDAs
│   └── Upload/Share
├── 7. Communication ............. Messages, notifications, scheduling
│   ├── Inbox / Threads
│   ├── Notifications
│   ├── Meeting Scheduler
│   └── NexusChat (AI)
├── 8. Analytics ................. Client-specific metrics
│   ├── Pipeline Analytics
│   ├── ROI Dashboard
│   ├── Diversity Report
│   └── QBR Generator
├── 9. Settings .................. Profile, users, preferences
│   ├── Company Profile
│   ├── User Management
│   ├── Notification Preferences
│   └── Billing
└── 10. AI Layer ................. AI everywhere
    ├── AIInsightButton (global)
    ├── SlideOver AI Panel (global)
    ├── NexusChat (context-aware)
    └── AI Generators (reports, summaries)
```

---

## 1. DASHBOARD (Command Center)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-003 | Real-Time Mandate Dashboard | Feature List §3 | Live pipeline status for all active mandates |
| AR-001 | Executive Dashboard | Feature List §6 | Key metrics: open mandates, candidates in pipeline, time-to-fill |
| AR-020 | Client Activity Report | Feature List §6 | Engagement metrics, recent activity |
| CX-014 | Client Notification Center | Feature List §3 | Activity alerts, updates |
| CX-017 | Milestone Timeline | Feature List §3 | Visual project progress across mandates |
| AR-032 | Dashboard Widgets | Feature List §6 | Configurable dashboard — client picks what to see |
| CX-046 | Client ROI Dashboard | Feature List §3 | Placements vs. cost, value delivered |
| CX-041 | Real-Time Collaboration Cursors | Feature List §3 | See who from LYC team is viewing |
| AR-011 | Real-Time Dashboard | Feature List §6 | Live-updating metrics without refresh |
| CX-023 | Custom Client Landing Page | Feature List §3 | Personalized welcome with active mandates |
| CC-003 | Activity Feed | Feature List §5 | Stream of all mandate/candidate activity |
| CX-045 | Embedded Scheduling | Feature List §3 | Book calls with consultant from dashboard |
| AR-045 | Automated Weekly Digest | Feature List §6 | Auto-emailed weekly summary |
| CX-050 | Client Churn Risk Indicator | Feature List §3 | *(Internal — drives proactive outreach)* |
| AI-034 | AI Report Insights | Feature List §1 | Dashboard data → plain language summary |
| AI-001 | AIInsightButton | Feature List §1 | ✨ on every dashboard element → ask AI |
| CX-019 | Embedded AI Insights | Feature List §3 | AI button on every dashboard widget |

**Dashboard Layout (Client View):**
```
┌─────────────────────────────────────────────────────┐
│  [Client Logo]  Welcome, {Company}     🔔 3  👤 KH │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  Active  │ In Review│Interview │ Offered  │ Placed  │
│ Mandates │ Shortlist│  Stage   │  Stage   │ This Q  │
│    8     │    12    │    6     │    2     │   3     │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│                                                     │
│  ┌─ Active Mandates ────────────────────────────┐  │
│  │ VP Sales, Shanghai     ████████░░  75%  ✨  │  │
│  │ CTO, Beijing           ██████░░░░  60%  ✨  │  │
│  │ Head of AI, Singapore  ████░░░░░░  40%  ✨  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Recent Activity ──────── ┌─ Quick Actions ──┐  │
│  │ 📋 New shortlist for VP  │ [+ New Mandate]   │  │
│  │ 💬 Comment on CTO cand.  │ [Schedule Call]   │  │
│  │ 📊 Assessment complete   │ [View Reports]    │  │
│  │ ✅ Interview scheduled   │ [AI Summary] ✨   │  │
│  └──────────────────────────┴───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 2. MANDATES (Active Searches)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-003 | Real-Time Mandate Dashboard | Feature List §3 | Pipeline status per mandate |
| CX-005 | Scheduled Report Delivery | Feature List §3 | Auto-delivered weekly mandate updates |
| PW-005 | Mandate Timeline View | Feature List §2 | Gantt-style milestone progress |
| CX-017 | Milestone Timeline | Feature List §3 | Visual project milestones |
| PW-031 | Candidate Status Badges | Feature List §2 | At-a-glance pipeline position |
| PW-024 | SLA Tracking | Feature List §2 | *(Visible as "On Track" / "At Risk" badges)* |
| PW-053 | Pipeline Health Score | Feature List §2 | Health indicator per mandate |
| PW-027 | Pipeline Velocity Metrics | Feature List §2 | Stage-to-stage conversion rates |
| CX-026 | Interview Schedule View | Feature List §3 | Upcoming interviews for this mandate |
| CX-027 | Offer Tracking | Feature List §3 | Offer status visibility |
| CX-039 | Client-Specific Job Board | Feature List §3 | View all open mandates in one place |
| CX-010 | Client Invitation System | Feature List §3 | Invite team members to view mandate |
| CX-036 | Data Room | Feature List §3 | Secure document sharing per mandate |
| CX-004 | Client Feedback Loop | Feature List §3 | Give feedback on candidates/shortlists |
| CC-001 | Comment Threads | Feature List §5 | Discuss mandate progress with LYC team |
| CC-005 | Internal Notes | Feature List §5 | *(Hidden from client — consultant-only)* |
| CX-015 | Shared Annotations | Feature List §5 | Client ↔ consultant notes on candidates |
| AI-010 | Mandate Status Report Generator | Feature List §1 | Auto-written status reports visible to client |
| AI-030 | AI Market Briefing | Feature List §1 | Weekly talent market updates per mandate |
| AI-024 | AI Talent Map Generator | Feature List §1 | Visual market landscape per mandate |
| AI-060 | AI Executive Briefing Generator | Feature List §1 | Board-ready mandate summaries |
| AI-054 | AI Pipeline Risk Alert | Feature List §1 | *(Internal — triggers proactive client comms)* |
| AU-009 | Scheduled Automation | Feature List §7 | Auto-send milestone updates to client |

**Mandate Detail Page (Client View):**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Mandates                    ✨ Ask AI   ⋯ More   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VP of Sales, Shanghai                    Status: ACTIVE    │
│  Client: TechCorp Inc.                   Health: 🟢 85/100  │
│                                                             │
│  ┌─ Progress ──────────────────────────────────────────┐   │
│  │ Kickoff ████████████░░░░░░░░ Shortlist ██████████░░ │   │
│  │ Interviews ████████░░░░░░░░░░ Offer ░░░░░░░░░░░░░░░ │   │
│  │ Target: Aug 30              On Track ✅              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Overview] [Pipeline] [Shortlist] [Interviews] [Reports]  │
│                                                             │
│  ┌─ Pipeline Kanban (Read-Only for Client) ────────────┐   │
│  │ Sourced (45) → Screened (18) → Shortlisted (8) →   │   │
│  │ Interviewing (3) → Offer (1) → Placed (0)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Latest Shortlist ─────── ✨ AI Summary ────────────┐   │
│  │ #1  Wang Yu — 94% Match    ⭐⭐⭐⭐⭐ View →        │   │
│  │ #2  Li Ming — 91% Match    ⭐⭐⭐⭐☆ View →        │   │
│  │ #3  Chen Xi — 88% Match    ⭐⭐⭐⭐☆ View →        │   │
│  │ [See All 8 Candidates]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Activity & Discussion ─────────────────────────────┐   │
│  │ 💬 LYC Consultant: Updated shortlist with 3 new...  │   │
│  │ 💬 You (Client): Great, I'd like to interview #1..  │   │
│  │ 📋 [Type your message...]                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CANDIDATES (Shortlists, Profiles, Comparison)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-001 | Interactive Client Shortlist | Feature List §3 | Rate/reject/comment on candidates |
| CX-025 | Comparison Tool | Feature List §3 | Compare shortlisted candidates side-by-side |
| CX-013 | Interview Feedback Collection | Feature List §3 | Submit interview feedback |
| CX-015 | Shared Annotations | Feature List §5 | Notes visible to LYC consultant |
| PW-012 | Candidate Self-Service Portal | Feature List §2 | *(Not for client portal — this is candidate-facing)* |
| AI-008 | Candidate Comparison Matrix | Feature List §1 | Side-by-side AI analysis |
| AI-003 | Candidate Match Score | Feature List §1 | See match percentage per candidate |
| AI-009 | AI Summary Card | Feature List §1 | Auto-generated candidate summary |
| AI-025 | Candidate Persona Generator | Feature List §1 | Rich candidate profiles |
| AI-001 | AIInsightButton | Feature List §1 | ✨ on every candidate → interrogate with AI |
| UX-001 | SlideOver Panel | Feature List §10 | Click candidate → right panel slides open |
| AE-018 | Assessment Comparison View | Feature List §4 | Compare assessment scores across candidates |
| AE-013 | Score Normalization | Feature List §4 | Fair cross-candidate comparison |
| CX-030 | Saved Searches | Feature List §3 | Bookmark candidate queries |
| CX-016 | Client Satisfaction Surveys | Feature List §3 | Rate candidate quality |
| PW-026 | Multi-Mandate Candidate View | Feature List §2 | See if candidate appears in other mandates |
| PW-034 | Saved Views & Filters | Feature List §2 | Personalized candidate list views |
| SD-009 | Filter Builder | Feature List §8 | Filter candidates by criteria |
| UX-011 | DataTable | Feature List §10 | Sortable, filterable candidate table |
| UX-014 | DataTable Saved Views | Feature List §10 | Save candidate list configurations |
| UX-015 | DataTable CSV Export | Feature List §10 | Download candidate data (if permitted) |
| CC-006 | Shared Decision Notes | Feature List §5 | Structured pros/cons with LYC team |
| CX-006 | Client Document Library | Feature List §3 | Access candidate-related documents |

**Candidate Interaction Flow (Client View):**
```
┌─────────────────────────────────────────────────────────────┐
│  Shortlist: VP of Sales, Shanghai                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Candidate Table ───────────────────────────────────┐   │
│  │ ☑ │ Name     │ Match │ Exp  │ Location │ Status │ ✨ │   │
│  │ ☐ │ Wang Yu  │ 94%   │ 15yr │ Shanghai │ New    │ ✨ │   │
│  │ ☐ │ Li Ming  │ 91%   │ 12yr │ Beijing  │ New    │ ✨ │   │
│  │ ☐ │ Chen Xi  │ 88%   │ 10yr │ Shenzhen │ Rated  │ ✨ │   │
│  │   │ [Compare Selected] [Export] [Filter]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── Click Wang Yu ──                                        │
│                                                             │
│  ┌────────────────────────────┬────────────────────────┐   │
│  │ CANDIDATE TABLE            │ ✨ SLIDE OVER          │   │
│  │                            │                        │   │
│  │                            │  Wang Yu               │   │
│  │                            │  VP Sales @ Shopee     │   │
│  │                            │  ─────────────────     │   │
│  │                            │  Match: 94% 🏆         │   │
│  │                            │  Experience: 15 years  │   │
│  │                            │  Location: Shanghai    │   │
│  │                            │                        │   │
│  │                            │  ┌─ AI Summary ──┐    │   │
│  │                            │  │ Strong sales    │    │   │
│  │                            │  │ leader with     │    │   │
│  │                            │  │ proven B2B SaaS │    │   │
│  │                            │  │ background...   │    │   │
│  │                            │  └────────────────┘    │   │
│  │                            │                        │   │
│  │                            │  [⭐ Rate] [👍 Approve] │   │
│  │                            │  [👎 Reject] [💬 Note] │   │
│  │                            │  [📊 Assessment]       │   │
│  │                            │  [🤖 Ask AI]          │   │
│  │                            │                        │   │
│  │                            │  ✨ "How does Wang Yu  │   │
│  │                            │     compare to Li Ming │   │
│  │                            │     on leadership?"    │   │
│  └────────────────────────────┴────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. ASSESSMENTS (Reports & Scorecards)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| AE-012 | Assessment Report Generator | Feature List §4 | Branded PDF assessment reports |
| AE-002 | DRIVE Assessment Module | Feature List §4 | 5-dimension motivation scoring report |
| AE-001 | LENS Assessment Engine | Feature List §4 | Adaptive assessment results |
| AE-003 | SHIFT Composite Scoring | Feature List §4 | Unified talent score |
| AE-004 | LEAP Assessment | Feature List §4 | Behavioral profiling results |
| AE-005 | QUEST Assessment | Feature List §4 | Executive evaluation results |
| AE-006 | COACH Assessment | Feature List §4 | Leadership style + 360° report |
| AE-007 | IMPACT Assessment | Feature List §4 | Performance impact report |
| AE-008 | BRIDGE Assessment | Feature List §4 | Team dynamics report |
| AE-009 | SPARK Assessment | Feature List §4 | AI readiness report |
| AE-018 | Assessment Comparison View | Feature List §4 | Compare candidate assessments |
| AE-025 | AI Assessment Interpreter | Feature List §4 | Plain language score explanations |
| AE-036 | Strengths-Based Reporting | Feature List §4 | Positive framing of results |
| AE-037 | Development Recommendations | Feature List §4 | AI-generated growth plans |
| AE-030 | Assessment Report Sharing | Feature List §4 | Shareable report links |
| AE-013 | Score Normalization | Feature List §4 | Comparable scores across instruments |
| AE-017 | Multi-Rater / 360° Feedback | Feature List §4 | *(If client is a rater — submit feedback)* |
| AE-032 | Assessment Bundling | Feature List §4 | Package of assessments per candidate |
| AE-042 | White-Label Assessments | Feature List §4 | Client-branded assessment reports |
| AE-029 | Score Confidence Interval | Feature List §4 | Show measurement precision |
| AE-019 | Role-Specific Benchmarking | Feature List §4 | Compare candidate to role norms |
| AE-048 | Work Sample Evaluation | Feature List §4 | AI-evaluated work sample results |
| AI-001 | AIInsightButton | Feature List §1 | ✨ on every score → "What does this mean?" |
| UX-001 | SlideOver Panel | Feature List §10 | Click score → detail panel slides open |

**Assessment Report View (Client View):**
```
┌─────────────────────────────────────────────────────────────┐
│  Assessment Report: Wang Yu                                 │
│  Mandate: VP of Sales, Shanghai                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ DRIVE Profile ──────────────────────────────────────┐  │
│  │                                                      │  │
│  │  D1 Intrinsic Motivation    ██████████░  85/100  ✨  │  │
│  │  D2 Extrinsic Motivation    ████████░░░  72/100  ✨  │  │
│  │  D3 Values Alignment        █████████░░  80/100  ✨  │  │
│  │  D4 Confidence & Self-Eff.  ███████████  90/100  ✨  │  │
│  │  D5 Growth Orientation      █████████░░  82/100  ✨  │  │
│  │                                                      │  │
│  │  Archetype: "The Driven Builder"                     │  │
│  │                                                      │  │
│  │  ✨ "What does 'Driven Builder' mean for my team?"   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ SHIFT Composite ────────────────────────────────────┐  │
│  │  LEAP:  D/I/S/C Profile + Career Readiness           │  │
│  │  QUEST: Strategic Thinking 88 | Execution 82         │  │
│  │  COACH: Inspiring Leader (primary style)             │  │
│  │  DRIVE: See above                                    │  │
│  │  IMPACT: Results-Driven (85th percentile)            │  │
│  │                                                      │  │
│  │  Overall SHIFT Score: 86/100  ✨ Ask AI              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [📄 Download Full Report PDF]  [📊 Compare with Others]   │
│  [💬 Discuss with Consultant]   [🤖 AI Deep Dive ✨]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. TALENT INTELLIGENCE (Market Maps & Org Charts)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-020 | Market Intelligence Sharing | Feature List §3 | Talent maps and market insights |
| CX-024 | Client-Accessible Org Charts | Feature List §3 | Sanitized competitor org charts |
| AI-013 | Org Chart Intelligence | Feature List §1 | Interactive competitor org visualization |
| AI-024 | AI Talent Map Generator | Feature List §1 | Visual market landscape |
| AI-057 | Talent Supply/Demand Heatmap | Feature List §1 | Geographic/functional heatmaps |
| AI-027 | AI Compensation Benchmarking | Feature List §1 | Market rate benchmarks |
| AI-053 | Automated Competitive Intelligence | Feature List §1 | Competitor hiring signals |
| AI-030 | AI Market Briefing | Feature List §1 | Weekly industry talent report |
| AI-060 | AI Executive Briefing Generator | Feature List §1 | Board-ready market summaries |
| SD-016 | Company Search | Feature List §8 | Search by company (competitor mapping) |
| SD-015 | Location-Based Search | Feature List §8 | Geographic talent discovery |
| AR-044 | Heatmap Visualization | Feature List §6 | Interactive market heatmaps |
| AR-025 | Industry Vertical Analytics | Feature List §6 | Sector-specific insights |
| CX-021 | Compensation Data Sharing | Feature List §3 | Salary benchmark data |
| AI-001 | AIInsightButton | Feature List §1 | ✨ on org chart nodes → "Tell me about this person/team" |
| UX-001 | SlideOver Panel | Feature List §10 | Click org node → detail panel slides open |

---

## 6. DOCUMENTS (Deliverables & Reports)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-006 | Client Document Library | Feature List §3 | Organized deliverable repository |
| CX-009 | Branded PDF Deliverables | Feature List §3 | LYC-branded professional reports |
| CX-011 | NDA/Agreement Management | Feature List §3 | Digital signature on agreements |
| CX-033 | Client File Upload | Feature List §3 | Share documents with LYC team |
| CX-036 | Data Room | Feature List §3 | Secure document sharing per mandate |
| CX-034 | Executive Summary Auto-Gen | Feature List §3 | Board-ready briefs |
| CX-047 | Co-Branded Reports | Feature List §3 | LYC + Client logo on deliverables |
| AE-012 | Assessment Report Generator | Feature List §4 | Branded assessment PDFs |
| AI-010 | Mandate Status Report Generator | Feature List §1 | Auto-written status reports |
| AI-060 | AI Executive Briefing Generator | Feature List §1 | Board-ready summaries |
| AR-010 | Export to PDF/Excel/CSV | Feature List §6 | Multi-format download |
| AR-036 | Report Sharing | Feature List §6 | Share reports with team members |
| AE-030 | Assessment Report Sharing | Feature List §4 | Shareable assessment links |
| UX-023 | Drag-and-Drop File Upload | Feature List §10 | Easy file sharing |
| UX-024 | Image Preview | Feature List §10 | Inline document preview |
| SD-012 | Full-Text Search | Feature List §8 | Search within documents |

---

## 7. COMMUNICATION (Messages & Notifications)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-032 | Client Messaging Thread | Feature List §3 | In-platform communication with LYC |
| CX-014 | Client Notification Center | Feature List §3 | Activity alerts |
| CX-042 | Client-Configurable Notifications | Feature List §3 | Choose what to hear about |
| CX-045 | Embedded Scheduling | Feature List §3 | Book calls with consultant |
| CC-001 | Comment Threads | Feature List §5 | Contextual discussions |
| CC-002 | @Mentions | Feature List §5 | Notify specific LYC team members |
| CC-003 | Activity Feed | Feature List §5 | Platform-wide activity stream |
| CC-004 | Real-Time Notifications | Feature List §5 | Push + email + in-app alerts |
| CC-008 | Rich Text Comments | Feature List §5 | Formatted comments |
| CC-010 | Email Digest | Feature List §5 | Daily/weekly summary email |
| CC-029 | Feishu/Lark Integration | Feature List §5 | Cross-platform notifications |
| CC-032 | Multi-Channel Thread | Feature List §5 | Unified email + platform view |
| CC-033 | Communication Scheduling | Feature List §5 | Schedule messages |
| AI-002 | NexusChat with Context | Feature List §1 | AI chat that understands mandate data |
| AI-015 | AI Email Drafting | Feature List §1 | *(Internal — but improves response speed to client)* |
| CC-045 | Cross-Platform Sync | Feature List §5 | Feishu ↔ portal message sync |

**Communication Hub (Client View):**
```
┌─────────────────────────────────────────────────────────────┐
│  💬 Communications                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Threads ──────────┬─ Thread: VP Sales, Shanghai ────┐ │
│  │ 🔵 VP Sales (3 new)│                                  │ │
│  │ ⚪ CTO Beijing (0) │  LYC: Here's the updated         │ │
│  │ 🔵 Assessments (1) │  shortlist with 3 new candidates. │ │
│  │ ⚪ Documents (0)   │  [View Shortlist →]               │ │
│  │                    │                                   │ │
│  │                    │  You: I'd like to interview       │ │
│  │                    │  Wang Yu and Li Ming next week.   │ │
│  │                    │                                   │ │
│  │                    │  LYC: Great choice. I've sent     │ │
│  │                    │  availability requests. [📅 Book] │ │
│  │                    │                                   │ │
│  │                    │  ┌────────────────────────────┐  │ │
│  │                    │  │ Type your message...    ✨ │  │ │
│  │                    │  └────────────────────────────┘  │ │
│  │                    │                                   │ │
│  └────────────────────┴───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. ANALYTICS (Client Metrics)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-008 | Client-Specific Analytics View | Feature List §3 | Their own metrics |
| CX-046 | Client ROI Dashboard | Feature List §3 | Placements vs. cost |
| AR-003 | Time-to-Fill Reporting | Feature List §6 | Mandate velocity metrics |
| AR-013 | Diversity Analytics | Feature List §6 | DEI representation data |
| AR-014 | Offer Analytics | Feature List §6 | Offer acceptance rates |
| AR-020 | Client Activity Report | Feature List §6 | Engagement metrics |
| AR-029 | SLA Compliance Dashboard | Feature List §6 | SLA adherence |
| CX-029 | Client-Accessible Diversity Report | Feature List §3 | DEI reporting |
| CX-044 | Client QBR Generator | Feature List §3 | Quarterly business review |
| AR-008 | Custom Report Builder | Feature List §6 | Create custom reports |
| AR-009 | Scheduled Reports | Feature List §6 | Auto-delivered reports |
| AR-010 | Export to PDF/Excel/CSV | Feature List §6 | Download data |
| AR-037 | Automated Insight Generation | Feature List §6 | AI explains trends |
| AR-050 | AI-Powered Query Interface | Feature List §6 | Ask questions in plain language |
| AI-034 | AI Report Insights | Feature List §1 | Dashboard data → summary |
| AI-035 | AI Chart Builder | Feature List §1 | Natural language → visualization |

---

## 9. SETTINGS (Configuration)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| CX-007 | Client User Management | Feature List §3 | Add/remove client team members |
| CX-042 | Client-Configurable Notifications | Feature List §3 | Granular notification control |
| CX-018 | Client Onboarding Wizard | Feature List §3 | Guided first-time setup |
| CX-035 | Client Portal SSO | Feature List §3 | Enterprise authentication |
| CX-002 | White-Label Client Portal | Feature List §3 | Client's own branding |
| CX-023 | Custom Client Landing Page | Feature List §3 | Personalized welcome |
| SC-002 | Two-Factor Authentication | Feature List §9 | Account security |
| SC-003 | SSO | Feature List §9 | Enterprise SSO |
| CC-009 | Notification Preferences | Feature List §5 | Control alerts |
| UX-009 | Dark Mode | Feature List §10 | Theme preference |

---

## 10. AI LAYER (Everywhere — Global Components)

| ID | Feature | Source Ref | Client Sees |
|----|---------|-----------|-------------|
| AI-001 | AIInsightButton | Feature List §1 | ✨ on EVERY data element across all pages |
| AI-002 | NexusChat with Context | Feature List §1 | AI chat sidebar with mandate awareness |
| UX-001 | SlideOver Panel | Feature List §10 | Right panel for AI insights, detail views |
| UX-002 | Animated Modal | Feature List §10 | Polished dialog interactions |
| AI-009 | AI Summary Card | Feature List §1 | Auto-generated summaries everywhere |
| AI-008 | Candidate Comparison Matrix | Feature List §1 | AI-powered comparison |
| AI-025 | AI Assessment Interpreter | Feature List §4 | Plain language explanations |
| AI-034 | AI Report Insights | Feature List §1 | Analytics → natural language |
| AI-035 | AI Chart Builder | Feature List §1 | Natural language → charts |
| AI-060 | AI Executive Briefing Generator | Feature List §1 | One-click board-ready summaries |
| AI-052 | AI Confidence Scoring | Feature List §1 | Show AI certainty on recommendations |
| AI-055 | Context-Aware AI Suggestions | Feature List §1 | Recommended next actions |

---

## Feature Count by Portal Section

| Portal Section | Features Visible to Client | Key Differentiators |
|---------------|---------------------------|---------------------|
| 1. Dashboard | 17 | Real-time KPIs, AI summaries, collaboration cursors |
| 2. Mandates | 22 | Pipeline visibility, milestone timeline, AI reports |
| 3. Candidates | 21 | Interactive shortlist, SlideOver detail, AI comparison |
| 4. Assessments | 23 | DRIVE/SHIFT reports, AI interpretation, comparison |
| 5. Talent Intelligence | 15 | Org charts, heatmaps, market briefings |
| 6. Documents | 16 | Branded PDFs, data room, co-branded reports |
| 7. Communication | 16 | Messaging, notifications, scheduling, NexusChat |
| 8. Analytics | 16 | ROI dashboard, AI insights, custom reports |
| 9. Settings | 10 | User management, SSO, notifications, branding |
| 10. AI Layer (Global) | 12 | AIInsightButton everywhere, SlideOver, NexusChat |
| **Total Unique** | **~168** | *(Many features appear in multiple sections)* |

---

## Client Portal Page × AI Feature Matrix

| Portal Page | ✨ AIInsightButton | 📊 AI Summary | 🤖 NexusChat | 📄 AI Reports | 🔍 NL Search |
|-------------|-------------------|---------------|---------------|---------------|--------------|
| Dashboard | ✅ Every widget | ✅ Mandate summary | ✅ Context-aware | ✅ Weekly digest | ✅ |
| Mandates | ✅ Every field | ✅ Mandate overview | ✅ Mandate context | ✅ Status reports | ✅ |
| Candidates | ✅ Every cell | ✅ Candidate card | ✅ "Compare X vs Y" | ✅ Profiles | ✅ "Find VP in Shanghai" |
| Assessments | ✅ Every score | ✅ Score explanation | ✅ "What does 85 mean?" | ✅ Full reports | ✅ |
| Talent Intel | ✅ Every org node | ✅ Market summary | ✅ "Who's at Company X?" | ✅ Market briefings | ✅ |
| Documents | ✅ Metadata | ✅ Document summary | ✅ "Find Q3 report" | — | ✅ Full-text |
| Analytics | ✅ Every chart | ✅ Trend explanation | ✅ "Why did TTF increase?" | ✅ Custom reports | ✅ |
| Settings | — | — | — | — | — |

---

## What Makes the Client Portal "AI-Intelligent"

Every page in the Client Portal follows this pattern:

1. **AIInsightButton (✨)** — On hover of ANY data element (candidate row, score badge, mandate card, org chart node), a Sparkles icon appears. Click → SlideOver opens with contextual AI analysis.

2. **SlideOver Panel** — Notion-style right panel. Springs open with animation. Contains:
   - AI-generated context for the selected entity
   - Ability to ask follow-up questions
   - Related entities and comparisons
   - Action buttons (rate, approve, discuss)

3. **NexusChat** — Persistent AI chat sidebar. Context-aware: knows which mandate, candidate, or page the client is viewing. Can:
   - Summarize pipeline status
   - Compare candidates
   - Explain assessment scores
   - Generate on-demand reports
   - Answer market questions

4. **AI Generators** — One-click buttons to generate:
   - Executive briefing (board-ready summary)
   - Market intelligence report
   - Candidate comparison analysis
   - Assessment interpretation
   - Mandate status update

---

*This document maps the full 500-feature list to Client Portal experience. Every feature from FEATURE_MASTER_LIST_500.md is accounted for — features tagged CON/ADM/SYS that aren't client-facing are marked as internal drivers that produce client-visible outputs.*
