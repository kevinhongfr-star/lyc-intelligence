# v6 Report Engine — 500-Feature Impact Analysis & Complete Report Inventory

> **Version:** 1.0 | **Date:** 2026-07-22
> **Author:** NEXUS
> **Context:** v6 report engine deployed (47 files: 5 Python generators + 2 docs + 30 reports + 10 Consultation Guides)

---

## Part 1: v6 Change Summary

| Change | Affected Charts/Elements |
|--------|------------------------|
| Chart: Staircase | Consultant Debrief, LEAP CR sections |
| Chart: Gauge Row (semicircle) | LEAP Executive Summary |
| Chart: Deviation from Mean | LEAP Structural Analysis |
| Chart: Dot Plot + Score Cards | Email Reports |
| Callout style | Top rule + fuchsia dot (replaces left-border rectangles) |
| Brand palette | `#0F1115` dark + `#C108AB` fuchsia |
| Shared rendering | Chart library update propagates to ALL portals |

---

## Part 2: 500-Feature Impact Classification

### Category Definitions

| Category | Criteria | Count |
|----------|----------|-------|
| **1. Direct Visual Impact** | Feature renders charts, gauges, or visualizations directly changed by v6 (staircase, gauge row, deviation, dot plot, callouts, palette) | 4 |
| **2. Report Generation** | Feature generates report content, documents, PDFs, decks, or emails using v6 templates | 26 |
| **3. Data & Scoring** | Feature produces scores, metrics, or analytics data that feeds INTO v6 reports | 27 |
| **4. Portal Display** | Feature displays or delivers v6 reports/charts to end users in portals | 18 |
| **5. No Direct Impact** | Backend infrastructure, pure workflow, configuration, or UX not related to reports/visuals | 425 |
| | **TOTAL** | **500** |

---

### 2.1 Category 1 — Direct Visual Impact (4 features)

Features whose chart/visualization rendering is directly altered by v6 chart changes.

| ID | Feature | Chart Change |
|----|---------|-------------|
| AI-035 | AI Chart Builder — natural language → visualization | All chart types use v6 rendering engine |
| AR-044 | Heatmap Visualization — geographic/functional heatmaps | Updated color palette (#0F1115 + fuchsia) |
| AR-048 | Embedded Charts — charts in other pages/emails | Chart components from shared v6 library |
| UX-042 | Design Token System — centralized design values | v6 palette tokens must be updated (#0F1115, #C108AB) |

---

### 2.2 Category 2 — Report Generation (26 features)

Features that generate report documents, PDFs, decks, emails, or structured content using v6 templates.

| ID | Feature | Report Type | v6 Generator |
|----|---------|-------------|-------------|
| AI-004 | Shortlist Generator | Ranked candidate shortlist | shift_report_v2 |
| AI-009 | AI Summary Card | Executive summary snippets | All generators |
| AI-010 | Mandate Status Report Generator | Mandate status reports | consultant_report_v2 |
| AI-024 | AI Talent Map Generator | Visual market landscape | — |
| AI-030 | AI Market Briefing | Weekly talent market report | — |
| AI-060 | AI Executive Briefing Generator | Board-ready summaries | leap2_report |
| AE-012 | Assessment Report Generator | Branded PDF assessment reports | All generators |
| AE-036 | Strengths-Based Reporting | Positive-framed results report | All generators |
| AE-037 | Development Recommendations | AI-generated growth plans | generate_consultation_guides |
| CX-005 | Scheduled Report Delivery | Auto weekly update emails | generate_email_reports |
| CX-009 | Branded PDF Deliverables | LYC-branded report PDFs | All generators |
| CX-034 | Executive Summary Auto-Gen | Board-ready client briefs | leap2_report |
| CX-044 | Client QBR Generator | Quarterly business review | — |
| CX-047 | Co-Branded Reports | LYC + Client logo deliverables | All generators |
| AR-008 | Custom Report Builder | User-defined reports | — |
| AR-009 | Scheduled Reports | Auto-generate + email on schedule | generate_email_reports |
| AR-010 | Export to PDF/Excel/CSV | Multi-format report export | All generators |
| AR-027 | Board Report Generator | Executive-ready presentations | leap2_report |
| AR-035 | Report Templates | Pre-built report templates | All generators |
| AR-045 | Automated Weekly Digest | Key metrics summary email | generate_email_reports |
| AU-009 | Scheduled Automation | Auto-send milestone updates | generate_email_reports |
| CC-010 | Email Digest | Daily/weekly activity summary | generate_email_reports |
| CC-020 | External Email Bridge | Email → platform comments | generate_email_reports |
| CC-043 | Automated Status Updates | Push pipeline changes to stakeholders | generate_email_reports |
| PW-007 | Interview Kit Builder | Structured interview prep docs | — |
| AI-045 | Smart Template Selector | Picks right template for context | Template selection logic |

---

### 2.3 Category 3 — Data & Scoring (27 features)

Features that produce scores, metrics, or data consumed by v6 report templates.

| ID | Feature | Data Feeds Into |
|----|---------|----------------|
| AI-003 | Candidate Match Score Engine | Scorecards, shortlists |
| AI-016 | Resume-to-JD Matching Score | Scorecards, comparison matrices |
| AI-023 | Interview Transcription + Auto-Scoring | Consultant debrief reports |
| AI-027 | AI Compensation Benchmarking | Market briefings, salary sections |
| AI-040 | AI Culture Fit Analysis | Assessment reports |
| AI-052 | AI Confidence Scoring | All reports (certainty indicators) |
| AI-053 | Automated Competitive Intelligence | Market briefings |
| AI-057 | Talent Supply/Demand Heatmap | Talent maps, market briefings |
| AI-059 | Predictive Attrition Model | Assessment reports |
| AE-001 | LENS Assessment Engine | LENS assessment reports |
| AE-002 | DRIVE Assessment Module | DRIVE profile (5-dimension scoring) |
| AE-003 | SHIFT Composite Scoring | SHIFT composite score in all reports |
| AE-004 | LEAP Assessment | LEAP exec summary + structural analysis |
| AE-005 | QUEST Assessment | QUEST evaluation reports |
| AE-006 | COACH Assessment | COACH 360° leadership reports |
| AE-007 | IMPACT Assessment | IMPACT performance reports |
| AE-008 | BRIDGE Assessment | BRIDGE team dynamics reports |
| AE-009 | SPARK Assessment | SPARK AI readiness reports |
| AE-013 | Score Normalization Engine | Cross-instrument comparable scores |
| PW-008 | Scorecard Templates | Candidate scorecards |
| PW-027 | Pipeline Velocity Metrics | Pipeline analytics reports |
| PW-048 | Pipeline Forecasting | Forecast sections of reports |
| PW-053 | Pipeline Health Score | Mandate health indicators |
| AR-001 | Executive Dashboard | Dashboard KPI summaries |
| AR-002 | Pipeline Analytics | Funnel charts in reports |
| AR-005 | Revenue Analytics | Revenue charts in reports |
| AR-037 | Automated Insight Generation | AI text explanations in reports |

---

### 2.4 Category 4 — Portal Display (18 features)

Features that display or deliver v6-formatted reports/charts to end users.

| ID | Feature | Portal | Display Context |
|----|---------|--------|----------------|
| AI-034 | AI Report Insights | All portals | Dashboard data → plain language summary |
| AE-018 | Assessment Comparison View | Client, Consultant | Side-by-side assessment charts |
| AE-025 | AI Assessment Interpreter | Client, Candidate | Plain language score display |
| AE-030 | Assessment Report Sharing | Client, Consultant | Shareable v6-formatted report links |
| CX-006 | Client Document Library | Client | Browse/download v6 report PDFs |
| CX-008 | Client-Specific Analytics View | Client | Analytics charts with v6 styling |
| CX-020 | Market Intelligence Sharing | Client | Talent maps with v6 charts |
| CX-024 | Client-Accessible Org Charts | Client | Org chart visualization |
| CX-029 | Client-Accessible Diversity Report | Client | Diversity charts |
| CX-036 | Data Room | Client | Secure report document sharing |
| CX-046 | Client ROI Dashboard | Client | ROI charts with v6 styling |
| AR-011 | Real-Time Dashboard | Consultant, Admin | Live charts with v6 rendering |
| AR-032 | Dashboard Widgets | All portals | Configurable chart widgets |
| AR-033 | Drill-Down Reports | Consultant, Admin | Detailed report views |
| AR-036 | Report Sharing | All portals | Share reports with users |
| AR-041 | Leaderboard | Admin | Top performer visualization |
| AR-050 | AI-Powered Query Interface | All portals | Natural language → chart display |
| AE-039 | Assessment Integration with Pipeline | Consultant | Scores in candidate pipeline view |

---

### 2.5 Category 5 — No Direct Impact (425 features)

Features with no direct dependency on v6 report engine changes. Includes all pipeline workflow mechanics, security/compliance, search infrastructure, backend integrations, collaboration tools, and UX framework components.

| Category | Feature ID Range | Count |
|----------|-----------------|-------|
| AI & Intelligence Engine | AI-001, 002, 005–008, 011–015, 017–022, 025, 026, 028, 029, 031–033, 036–039, 041–044, 046–051, 054–056, 058 | 37 |
| Pipeline & Workflow | PW-001–006, 009–047, 049–052, 054, 055 | 51 |
| Client Experience | CX-001–004, 007, 010–019, 021–023, 025–028, 030–033, 035, 037–043, 045, 048–050 | 36 |
| Assessment & Evaluation | AE-010, 011, 014–017, 019–024, 026–029, 031–035, 038, 040–050 | 34 |
| Collaboration & Communication | CC-001–009, 011–045 | 44 |
| Analytics & Reporting | AR-003, 004, 006, 007, 012–026, 028–031, 034, 038–040, 042, 043, 046, 047, 049 | 30 |
| Automation & Integration | AU-001–050 (minus AU-009) | 49 |
| Search & Discovery | SD-001–040 | 40 |
| Security, Compliance & Admin | SC-001–045 | 45 |
| Platform, UX & Design System | UX-001–041, 043–055 (minus UX-042) | 59 |
| **Total** | | **425** |

---

## Part 3: Complete Report Inventory

### 3.1 Report Types Summary

| Report Type | Count | Primary Format | v6 Generator |
|-------------|-------|---------------|-------------|
| **Assessment Reports** (DRIVE, SHIFT, LEAP, QUEST, COACH, IMPACT, BRIDGE, SPARK, LENS) | 9 | Branded PDF | All 5 generators |
| **Consultation Guides** | 10 | Branded PDF | generate_consultation_guides |
| **Consultant Debrief Reports** | 10 | Branded PDF | consultant_report_v2 |
| **Email Reports** (weekly digest, status updates, digests) | 10 | HTML email | generate_email_reports |
| **Executive Briefings / Summaries** | 3 | PDF/Presentation | leap2_report |
| **Shift Reports** (mandate-specific) | 5 | Branded PDF | shift_report_v2 |
| **Talent Maps** | 3 | Visual/PDF | — |
| **Market Briefings** | 2 | PDF/Email | — |
| **QBR (Quarterly Business Reviews)** | 1 | Presentation | — |
| **Pipeline Analytics Reports** | 4 | Dashboard/PDF | — |
| **Financial Reports** (revenue, profitability) | 3 | Dashboard/PDF | — |
| **Diversity Reports** | 2 | PDF/Dashboard | — |
| **Compliance/SLA Reports** | 2 | PDF/Dashboard | — |
| **Org Charts** | 2 | Interactive/PDF | — |
| **Board Reports** | 1 | Presentation | leap2_report |
| **Client Activity Reports** | 1 | Dashboard | — |
| **Candidate Shortlists** | 1 | PDF/Dashboard | shift_report_v2 |
| **Comparison Matrices** | 1 | Dashboard/PDF | — |
| **ROI Reports** | 1 | Dashboard | — |
| **TOTAL** | **~71 distinct report instances** | | |

> **Note:** The 71 instances map to approximately **21 unique report type families**. Many are per-mandate or per-client instantiations.

---

### 3.2 Reports by Portal

#### CLIENT PORTAL (11 pages, ~35 distinct report types)

| Page | Report Type | ID | Usage | Format |
|------|------------|-----|-------|--------|
| **Dashboard** | Executive Summary | CX-034, AI-060 | Board-ready brief | PDF |
| | Weekly Digest | AR-045, CC-010 | Auto-emailed metrics summary | Email |
| | Client Activity Report | AR-020 | Engagement metrics | Dashboard |
| | ROI Dashboard | CX-046 | Placements vs. cost | Dashboard |
| | AI Report Insights | AI-034 | Dashboard data → text | Inline |
| **Mandates** | Mandate Status Report | AI-010 | Auto-written updates | PDF |
| | Pipeline Analytics | AR-002 | Funnel conversion | Dashboard |
| | Pipeline Health Score | PW-053 | Mandate health | Badge |
| | SLA Compliance | AR-029 | On-track/at-risk | Dashboard |
| **Candidates** | Candidate Match Score | AI-003 | Ranked match % | Scorecard |
| | Comparison Matrix | AI-008 | Side-by-side AI analysis | Dashboard |
| | AI Summary Card | AI-009 | One-click candidate summary | Inline |
| | Candidate Persona | AI-025 | Rich candidate profile | PDF/SlideOver |
| | Shortlist (Ranked) | AI-004 | Auto-ranked candidates | PDF/Dashboard |
| **Assessments** | DRIVE Profile | AE-002 | 5-dimension motivation | PDF |
| | SHIFT Composite | AE-003 | Unified talent score | PDF |
| | LEAP Profile | AE-004 | DISC + Career Readiness | PDF |
| | QUEST Evaluation | AE-005 | Strategic/exec score | PDF |
| | COACH 360° Report | AE-006 | Leadership style + 360° | PDF |
| | IMPACT Report | AE-007 | Performance impact | PDF |
| | BRIDGE Report | AE-008 | Team dynamics fit | PDF |
| | SPARK Report | AE-009 | AI readiness | PDF |
| | Assessment Comparison | AE-018 | Multi-candidate scores | Dashboard |
| | Strengths-Based Report | AE-036 | Positive-framed results | PDF |
| **Talent Intelligence** | Competitor Org Charts | AI-013, CX-024 | Sanitized competitor views | Interactive/PDF |
| | Talent Map | AI-024 | Visual market landscape | Interactive/PDF |
| | Supply/Demand Heatmap | AI-057 | Geographic/functional | Dashboard |
| | Compensation Benchmark | AI-027 | Market rate data | Dashboard |
| | Market Briefing | AI-030 | Weekly talent report | PDF/Email |
| **Documents** | Branded PDF Deliverables | CX-009 | All LYC-branded reports | PDF |
| | Co-Branded Reports | CX-047 | LYC + Client logo | PDF |
| | Data Room Reports | CX-036 | Secure document sharing | PDF |
| **Analytics** | Custom Reports | AR-008 | User-defined | Dashboard/PDF |
| | Diversity Report | CX-029, AR-013 | DEI representation | PDF/Dashboard |
| | Offer Analytics | AR-014 | Acceptance rates | Dashboard |
| | Time-to-Fill Report | AR-003 | Mandate velocity | Dashboard |
| **Communication** | Email Digest | CC-010 | Daily/weekly summary | Email |
| | Status Updates | CC-043 | Pipeline change alerts | Email/In-app |

---

#### CANDIDATE PORTAL (17 pages, ~5 report types)

| Page | Report Type | ID | Usage | Format |
|------|------------|-----|-------|--------|
| **Assessments** | Assessment Results (LENS) | AE-001 | Adaptive assessment results | Dashboard |
| | Assessment Results (DRIVE) | AE-002 | Motivation profile | Dashboard/PDF |
| | Assessment Results (SHIFT) | AE-003 | Composite score | Dashboard/PDF |
| | Assessment Results (LEAP) | AE-004 | Behavioral profile | Dashboard/PDF |
| **Profile** | Development Recommendations | AE-037 | AI-generated growth plan | PDF |
| | Assessment Report Download | AE-030 | Shareable report link | PDF |

---

#### COUNCIL PORTAL (8 pages, ~6 report types)

| Page | Report Type | ID | Usage | Format |
|------|------------|-----|-------|--------|
| **Dashboard** | Member Diagnostics | AE-039 | Assessment-linked insights | Dashboard |
| **Coaching** | LEAP Exec Summary (Gauge Row) | AE-004 | v6 gauge row chart | PDF |
| | LEAP Structural (Deviation) | AE-004 | v6 deviation chart | PDF |
| **Benefits** | Consultant Debrief Report | consultant_report_v2 | Mandate debrief | PDF |
| **Community** | Talent Map | AI-024 | Market landscape | Interactive |
| **DexChat** | Market Briefing | AI-030 | Industry talent report | PDF |

---

#### COACHING PORTAL (8 pages, ~8 report types)

| Page | Report Type | ID | Usage | Format |
|------|------------|-----|-------|--------|
| **Engagement** | COACH 360° Report | AE-006 | Leadership style + feedback | PDF |
| | IMPACT Report | AE-007 | Performance impact | PDF |
| **Growth** | Development Recommendations | AE-037 | AI growth plan | PDF |
| | Progress Tracking Charts | — | Progress visualization | Dashboard |
| **Intelligence** | Talent Map | AI-024 | Market landscape | Interactive |
| | Market Briefing | AI-030 | Industry report | PDF |
| **CareerIntel** | LEAP Assessment | AE-004 | Behavioral profile | PDF |
| | Shift Report | shift_report_v2 | Mandate diagnostic | PDF |

---

#### LEADER PORTAL (3 pages, ~4 report types)

| Page | Report Type | ID | Usage | Format |
|------|------------|-----|-------|--------|
| **Community** | Team Composition Report | AE-038 | Team dynamics | Dashboard |
| **Growth** | Executive Briefing | AI-060 | Board-ready summary | PDF |
| | Leadership Assessment | AE-006 | COACH report | PDF |
| **Services** | Team-Level Aggregate Report | — | Aggregate team metrics | Dashboard |

---

#### INTERNAL / ADMIN (10 pages, ~15 report types)

| Page | Report Type | ID | Usage | Format |
|------|------------|-----|-------|--------|
| **Analytics** | Executive Dashboard | AR-001 | Key metrics overview | Dashboard |
| | Pipeline Analytics | AR-002 | Funnel conversion | Dashboard |
| | Revenue Analytics | AR-005 | Placement revenue | Dashboard |
| | Consultant Performance | AR-006 | Individual metrics | Dashboard |
| | Client Revenue Dashboard | AR-007 | Per-client financials | Dashboard |
| | Diversity Analytics | AR-013 | Representation by stage | Dashboard |
| | Forecasting Models | AR-016 | Revenue/fill projections | Dashboard |
| | Benchmark Reports | AR-017 | Industry comparison | PDF |
| | Competitor Analysis | AR-026 | Lost deals analysis | PDF |
| | Mandate Profitability | AR-019 | Cost vs revenue | Dashboard |
| | Geographic Analytics | AR-024 | Placement by region | Dashboard |
| | Industry Vertical Analytics | AR-025 | Sector performance | Dashboard |
| | Leaderboard | AR-041 | Top performers | Dashboard |
| | Board Report | AR-027 | Executive presentation | Presentation |
| **Compliance** | Compliance Reports | AR-028 | Regulatory reports | PDF |
| | SLA Compliance | AR-029 | SLA adherence | Dashboard |
| **NexusEngine** | Agent Activity Report | AI-036 | AI workforce visibility | Dashboard |

---

#### EMAIL REPORTS (External, triggered from portal actions)

| Report Type | ID | Usage | Format | v6 Chart |
|-------------|-----|-------|--------|----------|
| Weekly Mandate Digest | CX-005, AR-045 | Auto weekly summary | HTML email | Dot Plot + Score Cards |
| Pipeline Status Update | CC-043, AU-009 | Milestone updates | HTML email | Dot Plot + Score Cards |
| Assessment Completion Alert | AE-028 | Nudge incomplete | HTML email | Score Cards |
| Candidate Shortlist Notification | AI-004 | New shortlist alert | HTML email | Dot Plot |
| Interview Feedback Summary | PW-007 | Interview results | HTML email | Score Cards |
| Market Briefing Email | AI-030 | Weekly talent report | HTML email | Dot Plot |
| Consultant Performance Digest | AR-006 | Team metrics | HTML email | Score Cards |
| Client Activity Digest | AR-020 | Engagement metrics | HTML email | Dot Plot |
| SLA Alert Report | AR-029 | Time-in-stage alerts | HTML email | Score Cards |
| QBR Summary Email | CX-044 | Quarterly preview | HTML email | Dot Plot + Score Cards |

---

### 3.3 Report Type Counts (Final Tally)

| Report Type | Instances | Portals Served |
|-------------|-----------|---------------|
| **Assessment Reports** (9 instruments) | 9 | Client, Candidate, Council, Coaching |
| **Consultation Guides** | 10 | Client, Coaching |
| **Consultant Debrief Reports** | 10 | Council, Client |
| **Email Reports** (automated) | 10 | Email (external) |
| **Executive Briefings / Summaries** | 3 | Client, Leader, Internal |
| **Shift Reports** (mandate-specific) | 5 | Client, Coaching |
| **Talent Maps** | 3 | Client, Council, Coaching |
| **Market Briefings** | 2 | Client, Coaching |
| **Pipeline Analytics Reports** | 4 | Client, Internal |
| **Financial Reports** | 3 | Internal |
| **Diversity Reports** | 2 | Client, Internal |
| **Compliance/SLA Reports** | 2 | Internal |
| **Org Charts** | 2 | Client, Internal |
| **Board Reports** | 1 | Internal |
| **QBR Reports** | 1 | Client |
| **ROI Reports** | 1 | Client |
| **Shortlists** | 1 | Client |
| **Comparison Matrices** | 1 | Client |
| **Agent Activity Reports** | 1 | Internal |
| **Leaderboards** | 1 | Internal |
| **GRAND TOTAL** | **~71** | |

---

### 3.4 v6 Generator → Report Mapping

| v6 Python Generator | Reports Generated | Chart Types Used |
|---------------------|-------------------|-----------------|
| `shift_report_v2` | Shift Reports (5), Shortlists (1) | Staircase, Ring Reversed, Gauge Row |
| `consultant_report_v2` | Consultant Debrief Reports (10) | Staircase, Gauge Row |
| `generate_email_reports` | Email Reports (10) | Dot Plot, Score Cards |
| `leap2_report` | LEAP Assessments, Executive Briefings (3), Board Reports (1) | Gauge Row, Deviation from Mean |
| `generate_consultation_guides` | Consultation Guides (10) | All v6 chart types |

---

## Part 4: Implementation Priority

### Immediate (v6 visual changes)
1. Update Design Token System (UX-042) with `#0F1115` + `#C108AB` palette
2. Update shared chart rendering library (affects AI-035, AR-044, AR-048)
3. Replace all callout components: left-border rectangles → top rule + fuchsia dot

### High Priority (Report generators)
4. Update 5 Python generators with v6 chart templates
5. Update AE-012 Assessment Report Generator to use v6 styling
6. Update email report templates (Dot Plot + Score Cards)

### Medium Priority (Data pipeline)
7. Verify scoring data flows correctly into v6 report templates (27 Cat 3 features)
8. Update portal display components for v6 charts (18 Cat 4 features)

### Low Priority (No action needed)
9. 425 Cat 5 features require no v6-related changes

---

## Part 5: Cross-Reference Matrix

### v6 Chart Type → Feature Impact

| v6 Chart | Direct Visual (Cat 1) | Report Gen (Cat 2) | Data Source (Cat 3) | Portal Display (Cat 4) |
|----------|----------------------|--------------------|--------------------|----------------------|
| Staircase | AI-035 | AI-004, AI-010, AE-012 | AE-003 | AE-018 |
| Gauge Row | AI-035, UX-042 | AI-060, AE-012 | AE-004 | AR-032 |
| Deviation from Mean | — | AE-012 | AE-004 | AE-018 |
| Dot Plot | AR-048 | CX-005, AR-009, AR-045 | AR-002 | AR-050 |
| Score Cards | — | CC-010, AR-045 | PW-008 | AE-039 |
| Callout style | UX-042 | All generators | — | All portal pages |
| Brand palette | UX-042, AR-044 | All generators | — | All portal pages |

---

*Document generated from FEATURE_MASTER_LIST_500.md, CLIENT_PORTAL_FEATURE_MAP.md, v6 Report Engine specs, and app page structure analysis.*
