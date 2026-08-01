# LYC Intelligence — Trae Master Build Instructions

**Repository:** [kevinhongfr-star/lyc-intelligence](https://github.com/kevinhongfr-star/lyc-intelligence)  
**Live:** [www.lyc-intelligence.app](https://www.lyc-intelligence.app)  
**Total Open Tickets:** 120 | **Spec Documents:** 22+ files  
**Supabase:** `rnnlteyqmtxkzllbohuu.supabase.co` | **Vercel:** auto-deploy from `main`

---

## ⚡ Quick Start for Trae

1. **Clone:** `git clone https://github.com/kevinhongfr-star/lyc-intelligence.git`
2. **Install:** `npm install`
3. **Env:** Copy `.env.example` → `.env`, configure Supabase + Vercel keys
4. **Specs:** All development specs are in [`specs/v2/`](https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/specs/v2/) and [`docs/`](https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/docs/)
5. **Database:** Run [`specs/v2/master_migration.sql`](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/master_migration.sql) on Supabase SQL Editor first
6. **Build order:** Follow the phase priority below. Each portal section links to its spec + tickets.

---

## 🏗️ Build Priority Order

| Priority | What | Spec | First Ticket |
|:--------:|------|------|:------------:|
| **P0** | Remediation: Auth Unification | [REM_01](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_01_AUTH_UNIFICATION.md) | — |
| **P0** | Design System Foundation | [17](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/17_Design_System_Component_Library_Spec.md) | [#33](https://github.com/kevinhongfr-star/lyc-intelligence/issues/33) |
| **P0** | Public Marketing Site + Activation | [18](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/18_Public_Site_And_Activation_Flows_Spec.md) | [#34](https://github.com/kevinhongfr-star/lyc-intelligence/issues/34) |
| **P0** | Database Migration + Auth + RLS | [02](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | [#1](https://github.com/kevinhongfr-star/lyc-intelligence/issues/1) |
| **P1** | Remediation: Client + Candidate + Role Nav | [REM_02](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_02_CLIENT_PORTAL.md) / [REM_03](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_03_CANDIDATE_PORTAL.md) / [REM_04](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_04_ROLE_NAVIGATION.md) | — |
| **P1** | Council Portal + DEX AI B2C | [05](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md) | [#9](https://github.com/kevinhongfr-star/lyc-intelligence/issues/9) |
| **P1** | Commerce Layer (Stripe + Credits) | [08](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/08_Commerce_Layer_Spec.md) | [#6](https://github.com/kevinhongfr-star/lyc-intelligence/issues/6) |
| **P2** | Internal Portal (Consultant) | [01](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/01_Internal_Portal_Spec.md) | [#12](https://github.com/kevinhongfr-star/lyc-intelligence/issues/12) |
| **P2** | Client Portal | [04](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/04_Client_Portal_Spec.md) | [#13](https://github.com/kevinhongfr-star/lyc-intelligence/issues/13) |
| **P2** | Intelligence Layer | [06](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/06_Intelligence_Layer_Spec.md) | [#8](https://github.com/kevinhongfr-star/lyc-intelligence/issues/8) |
| **P2** | SHIFT Assessment System | [09](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/09_SHIFT_Composite_Data_Model_Spec.md) | [#18](https://github.com/kevinhongfr-star/lyc-intelligence/issues/18) |
| **P2** | Nexus Companion (AI Chat) | [Nexus Tickets](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/DEX_AI_NEXUS_PHASE1_TICKETS.md) | [#46](https://github.com/kevinhongfr-star/lyc-intelligence/issues/46) |
| **P3** | Candidate Portal | [07](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/07_Candidate_Portal_Spec_v2.md) | [#14](https://github.com/kevinhongfr-star/lyc-intelligence/issues/14) |
| **P3** | Email Admin Engine | [Email Spec](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/EMAIL_GENERATOR_SPEC.md) | [#101](https://github.com/kevinhongfr-star/lyc-intelligence/issues/101) |
| **P3** | Report Engine (Epic #60) | [Report Spec](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/REPORT_DESIGN_SPECIFICATION.md) | [#60](https://github.com/kevinhongfr-star/lyc-intelligence/issues/60) |
| **P3** | Academy LMS | [12](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/12_Academy_LMS_Complete_Spec.md) | [#17](https://github.com/kevinhongfr-star/lyc-intelligence/issues/17) |
| **P4** | Intelligence Reports (Auto-Gen) | [13](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | [#22](https://github.com/kevinhongfr-star/lyc-intelligence/issues/22) |
| **P4** | Go-Live (CI/CD, Legal, Perf) | [14](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/14_Legal_Pages_Compliance_Spec.md) | [#26](https://github.com/kevinhongfr-star/lyc-intelligence/issues/26) |

---

## 📋 Portal Route Map

| Portal | Route Prefix | Auth Requirement |
|--------|-------------|-----------------|
| Public Marketing | `/` | None (public) |
| DEX AI B2C | `/dex/` | Any authenticated user |
| Internal (Consultant) | `/app/` | Consultant+ role |
| Client | `/client/` | Client user+ role |
| Council | `/council/` | Council member (or public landing) |
| Candidate | `/candidates/` | Applicant+ role |
| Admin | `/admin/` | Super admin |

---

## 🌐 Portal 1: Public Marketing Site
**Route prefix:** `/`  
**Spec:** [18_Public_Site_And_Activation_Flows_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/18_Public_Site_And_Activation_Flows_Spec.md)

### Tickets
- [ ] **#34** [🔴 Public Marketing Site (Homepage, Pricing, Features, FAQ, Book Demo)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/34)
- [ ] **#35** [🔴 User Activation Flows (Onboarding Wizards Per Portal)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/35)

---

## 🏢 Portal 2: Internal Portal (Consultant Workspace)
**Route prefix:** `/app/`  
**Spec:** [01_Internal_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/01_Internal_Portal_Spec.md)  
**Remediation:** [REM_05_CONSULTANT_EXPERIENCE.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_05_CONSULTANT_EXPERIENCE.md)

### Tickets
- [ ] **#12** [Phase 2: Internal Portal (Consultant Workspace)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/12)

---

## 🏭 Portal 3: Client Portal (Company-Facing)
**Route prefix:** `/client/`  
**Spec:** [04_Client_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/04_Client_Portal_Spec.md)  
**Remediation:** [REM_02_CLIENT_PORTAL.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_02_CLIENT_PORTAL.md)

### Tickets
- [ ] **#13** [Phase 3: Client Portal (Company-Facing)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/13)

---

## 🎓 Portal 4: Council Portal + DEX AI B2C
**Route prefix:** `/council/` (Council) and `/dex/` (DEX AI B2C)  
**Specs:**
- [05_The_Council_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md)
- [05b_Council_v2_Addendum.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05b_The_Council_Portal_Spec_v2_Addendum.md)
- [05c_Council_v2_Backend_Wiring.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05c_The_Council_v2_Backend_Wiring.md)

### Tickets
- [ ] **#9** [Phase 2: Council Portal — Public Pages & DEX AI B2C](https://github.com/kevinhongfr-star/lyc-intelligence/issues/9)
- [ ] **#10** [Phase 2: Council Portal — Member Dashboard & Community](https://github.com/kevinhongfr-star/lyc-intelligence/issues/10)
- [ ] **#11** [Phase 2: Council Portal — Admin Management](https://github.com/kevinhongfr-star/lyc-intelligence/issues/11)

---

## 👤 Portal 5: Candidate Portal
**Route prefix:** `/candidates/`  
**Spec:** [07_Candidate_Portal_Spec_v2.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/07_Candidate_Portal_Spec_v2.md)  
**Remediation:** [REM_03_CANDIDATE_PORTAL.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_03_CANDIDATE_PORTAL.md)

### Tickets
- [ ] **#14** [Phase 3: Candidate Portal v2.1](https://github.com/kevinhongfr-star/lyc-intelligence/issues/14)

---

## ⚙️ Portal 6: Admin Portal
**Route prefix:** `/admin/`  
**Spec:** [19_Email_Admin_Analytics_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md)  
**Remediation:** [REM_09_ADMIN_COMPLETION.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_09_ADMIN_COMPLETION.md)

### Tickets
- [ ] **#37** [🟡 Platform Admin Console](https://github.com/kevinhongfr-star/lyc-intelligence/issues/37)
- [ ] **#38** [🟡 Analytics & Event Tracking](https://github.com/kevinhongfr-star/lyc-intelligence/issues/38)

---

## 🔧 Foundation & Backend Infrastructure
**Spec:** [02_Supabase_Backend_Architecture.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md)  
**SQL Migration:** [master_migration.sql](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/master_migration.sql) (57 tables)

### Tickets
- [ ] **#1** [Phase 1: Database Migration & Schema Setup](https://github.com/kevinhongfr-star/lyc-intelligence/issues/1)
- [ ] **#2** [Phase 1: Auth & RBAC System](https://github.com/kevinhongfr-star/lyc-intelligence/issues/2)
- [ ] **#3** [Phase 1: RLS Policies — All 57 Tables](https://github.com/kevinhongfr-star/lyc-intelligence/issues/3)
- [ ] **#4** [Phase 1: Edge Functions & AI Routing](https://github.com/kevinhongfr-star/lyc-intelligence/issues/4)
- [x] **#5** [Phase 1: UX Design System & Shared Components](https://github.com/kevinhongfr-star/lyc-intelligence/issues/5) ✅ *Already complete*
- [ ] **#6** [Phase 1: Commerce Layer — Stripe Integration & Checkout](https://github.com/kevinhongfr-star/lyc-intelligence/issues/6)
- [ ] **#7** [Phase 1: Commerce Layer — Credit System & Progressive Gating](https://github.com/kevinhongfr-star/lyc-intelligence/issues/7)
- [ ] **#15** [Phase 2: Notification System (Cross-Portal)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/15)
- [ ] **#16** [Phase 4: Performance, Accessibility & Polish](https://github.com/kevinhongfr-star/lyc-intelligence/issues/16)
- [ ] **#25** [Phase 6: Technical Debt Backlog & Infrastructure Cleanup](https://github.com/kevinhongfr-star/lyc-intelligence/issues/25)

---

## 🎨 Design System & UX
**Specs:**
- [03_UX_Behavioral_Mechanics.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/03_UX_Behavioral_Mechanics.md)
- [17_Design_System_Component_Library_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/17_Design_System_Component_Library_Spec.md)
**Remediation:** [REM_08_DESIGN_SYSTEM_DEDUP.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_08_DESIGN_SYSTEM_DEDUP.md) | [REM_04_ROLE_NAVIGATION.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_04_ROLE_NAVIGATION.md)

### Tickets
- [ ] **#33** [🔴 Design System & Component Library (P0 — Foundation)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/33)

---

## 📡 Intelligence Layer
**Spec:** [06_Intelligence_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/06_Intelligence_Layer_Spec.md)

### Tickets
- [ ] **#8** [Phase 2: Intelligence Layer — Data Pipeline & Signals](https://github.com/kevinhongfr-star/lyc-intelligence/issues/8)

---

## 📊 SHIFT Assessment System
**Specs:**
- [09_SHIFT_Composite_Data_Model_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/09_SHIFT_Composite_Data_Model_Spec.md)
- [10_Online_Diagnostic_Assessment_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/10_Online_Diagnostic_Assessment_Spec.md)
- [11_Cohort_Analytics_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/11_Cohort_Analytics_Spec.md)

### Tickets
- [ ] **#18** [Phase 2.5: SHIFT Composite Data Model (5 instruments + APAC Translation + Cohort)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/18)
- [ ] **#20** [Phase 2.5: Online Diagnostic Assessment Engine (UI + scoring)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/20)
- [ ] **#21** [Phase 2.5: Cohort Analytics Dashboard & Aggregation Engine](https://github.com/kevinhongfr-star/lyc-intelligence/issues/21)

---

## 📚 Academy (LMS)
**Spec:** [12_Academy_LMS_Complete_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/12_Academy_LMS_Complete_Spec.md)

### Tickets
- [ ] **#17** [Phase 4: Academy Admin — Course Content Management System](https://github.com/kevinhongfr-star/lyc-intelligence/issues/17)
- [ ] **#19** [Phase 4: Student Dashboard + Community Forum + Development Plans](https://github.com/kevinhongfr-star/lyc-intelligence/issues/19)

---

## 🤖 Nexus Companion (AI Chat Engine)
**Spec:** [DEX_AI_NEXUS_PHASE1_TICKETS.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/DEX_AI_NEXUS_PHASE1_TICKETS.md)

### Tickets
- [ ] **#39** [🔴 N1: Nexus Conversation Engine + Intent Router](https://github.com/kevinhongfr-star/lyc-intelligence/issues/39)
- [ ] **#40** [🔴 N2: Nexus Memory System (Working + Episodic + Semantic)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/40)
- [ ] **#41** [🔴 N3: User Context Assembly + Tier Gating](https://github.com/kevinhongfr-star/lyc-intelligence/issues/41)
- [ ] **#42** [🟡 N4: RAG Content Library Integration](https://github.com/kevinhongfr-star/lyc-intelligence/issues/42)
- [ ] **#43** [🔴 N5: Proactive Suggestion + Recommendation Engine](https://github.com/kevinhongfr-star/lyc-intelligence/issues/43)
- [ ] **#44** [🟡 N6: Journey Intelligence Dashboard](https://github.com/kevinhongfr-star/lyc-intelligence/issues/44)
- [ ] **#45** [🟡 N7: Stripe Subscription & Billing Integration](https://github.com/kevinhongfr-star/lyc-intelligence/issues/45)
- [ ] **#46** [🎯 Nexus Companion — Phase 1 Foundation (Weeks 1-6) [MASTER]](https://github.com/kevinhongfr-star/lyc-intelligence/issues/46)

---

## 📧 Email Admin Engine
**Spec:** [EMAIL_GENERATOR_SPEC.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/EMAIL_GENERATOR_SPEC.md) | [EMAIL_GENERATOR_TICKETS_INDEX.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/EMAIL_GENERATOR_TICKETS_INDEX.md)

### Tickets
- [ ] **#36** [🔴 Email Templates & Notification System](https://github.com/kevinhongfr-star/lyc-intelligence/issues/36)
- [ ] **#101** [[A1] Email Request Schema Validator](https://github.com/kevinhongfr-star/lyc-intelligence/issues/101)
- [ ] **#102** [[A2] Brand Lens Selector](https://github.com/kevinhongfr-star/lyc-intelligence/issues/102)
- [ ] **#103** [[A3] LLM Voice Engine](https://github.com/kevinhongfr-star/lyc-intelligence/issues/103)
- [ ] **#104** [[A4] Content Generator](https://github.com/kevinhongfr-star/lyc-intelligence/issues/104)
- [ ] **#105** [[A5] Template Variable System](https://github.com/kevinhongfr-star/lyc-intelligence/issues/105)
- [ ] **#106** [[B1] Banned Word Scanner](https://github.com/kevinhongfr-star/lyc-intelligence/issues/106)
- [ ] **#107** [[B2] Structure Validator](https://github.com/kevinhongfr-star/lyc-intelligence/issues/107)
- [ ] **#108** [[B3] Signature Block Enforcer](https://github.com/kevinhongfr-star/lyc-intelligence/issues/108)
- [ ] **#109** [[C1] Machine-Readable Template Library](https://github.com/kevinhongfr-star/lyc-intelligence/issues/109)
- [ ] **#110** [[C2] Template Selection Logic](https://github.com/kevinhongfr-star/lyc-intelligence/issues/110)
- [ ] **#111** [[C3] Lens-Specific CTA Library](https://github.com/kevinhongfr-star/lyc-intelligence/issues/111)
- [ ] **#112** [[D1] Pre-Send Quality Gate](https://github.com/kevinhongfr-star/lyc-intelligence/issues/112)
- [ ] **#113** [[D2] Kevin Approval Workflow](https://github.com/kevinhongfr-star/lyc-intelligence/issues/113)
- [ ] **#114** [[E1] SMTP / SendCloud Integration](https://github.com/kevinhongfr-star/lyc-intelligence/issues/114)
- [ ] **#115** [[E2] CRM Write-Back](https://github.com/kevinhongfr-star/lyc-intelligence/issues/115)
- [ ] **#116** [[E3] Delivery Tracking](https://github.com/kevinhongfr-star/lyc-intelligence/issues/116)
- [ ] **#117** [[F1] Nexus ↔ Search Ops Pipeline](https://github.com/kevinhongfr-star/lyc-intelligence/issues/117)
- [ ] **#118** [[F2] Nexus ↔ Delivery Ops Pipeline](https://github.com/kevinhongfr-star/lyc-intelligence/issues/118)
- [ ] **#119** [[G1] Patch ECHO Guidelines Gaps](https://github.com/kevinhongfr-star/lyc-intelligence/issues/119)
- [ ] **#120** [[G2] Cross-Agent Audit](https://github.com/kevinhongfr-star/lyc-intelligence/issues/120)

---

## 📑 Report Engine (Epic #60 — v6)
**Spec:** [13_Intelligence_Reports_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | [REPORT_DESIGN_SPECIFICATION.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/REPORT_DESIGN_SPECIFICATION.md) | [COMPLETE_REPORT_INVENTORY.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/COMPLETE_REPORT_INVENTORY.md)

### Tickets
- [ ] **#60** [[EPIC] v6 Report Engine Integration](https://github.com/kevinhongfr-star/lyc-intelligence/issues/60)
- [ ] **#61** [[EPIC #60] T01: Design System Foundation — Report Tokens & Shared Components (15 components)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/61)
- [ ] **#62** [[EPIC #60] T02: G1 — Assessment Report Templates (1 base + 4 variants, 9 instruments)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/62)
- [ ] **#63** [[EPIC #60] T03: G9 — Email Report Templates (3 templates: Digest, Alert, Briefing)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/63)
- [ ] **#64** [[EPIC #60] T04: G2 — Executive Briefing & Presentation Templates (slide deck + board-ready)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/64)
- [ ] **#65** [[EPIC #60] T05: G7 — Shortlist & Candidate Profile Templates (list + profile card)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/65)
- [ ] **#66** [[EPIC #60] T06: G3 — Scorecard & Comparison View Templates (single + comparison)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/66)
- [ ] **#67** [[EPIC #60] T07: G6 — Pipeline & Status Report Templates (dashboard + status cards)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/67)
- [ ] **#68** [[EPIC #60] T08: G4 — Diagnostic Report Templates (team + individual diagnostics)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/68)
- [ ] **#69** [[EPIC #60] T09: G5 — Talent Map & Market Visualization Templates (bubble + heatmap + org chart)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/69)
- [ ] **#70** [[EPIC #60] T10: G8 — Consultation Guide Templates (interview prep, debrief, frameworks)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/70)
- [ ] **#71** [[EPIC #60] T11: G10 — Branded PDF Export System (LYC-only + co-branded variants)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/71)
- [ ] **#72** [[EPIC #60] T12: Business Docs L1–L3 — BD, Initiation & Candidate Presentation (D01–D14)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/72)
- [ ] **#73** [[EPIC #60] T13: Business Docs L4–L5 — Interview Process & Decision/Offer (D15–D25)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/73)
- [ ] **#74** [[EPIC #60] T14: Business Docs L6–L7 — Mandate Management & Post-Placement (D26–D35)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/74)
- [ ] **#75** [[EPIC #60] T15: Business Docs L8–L10 — Assessment, Internal Ops & Comms (D36–D50)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/75)
- [ ] **#76** [[EPIC #60] T16: Template Registry & Rendering Pipeline (JSON registry + iframe/Puppeteer/email)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/76)
- [ ] **#77** [[EPIC #60] T17: Python Generator Integration — Wire biz_L*.py to Template Variables](https://github.com/kevinhongfr-star/lyc-intelligence/issues/77)
- [ ] **#78** [[EPIC #60] T18: Cross-Portal Integration Testing — All templates × All portals](https://github.com/kevinhongfr-star/lyc-intelligence/issues/78)
- [ ] **#79** [[EPIC #60] T19: Design Review & QA — Brand Compliance + Visual Regression Suite](https://github.com/kevinhongfr-star/lyc-intelligence/issues/79)
- [ ] **#80** [[EPIC #60] T20: Download HTML Templates from Feishu Drive → GitHub templates/ directory](https://github.com/kevinhongfr-star/lyc-intelligence/issues/80)
- [ ] **#81** [[T21] Candidate Portal UI Shell & Document Views](https://github.com/kevinhongfr-star/lyc-intelligence/issues/81)
- [ ] **#82** [[T22] Consultant Portal UI Shell & Document Views](https://github.com/kevinhongfr-star/lyc-intelligence/issues/82)
- [ ] **#83** [[T23] Client Portal UI Shell & Document Views](https://github.com/kevinhongfr-star/lyc-intelligence/issues/83)
- [ ] **#84** [[T24] Admin Portal UI Shell & Document Views](https://github.com/kevinhongfr-star/lyc-intelligence/issues/84)
- [ ] **#85** [[T25] Assessment Portal UI Shell & Document Views](https://github.com/kevinhongfr-star/lyc-intelligence/issues/85)
- [ ] **#86** [[T26] Comms Portal — Email Template Rendering & Delivery Pipeline](https://github.com/kevinhongfr-star/lyc-intelligence/issues/86)
- [ ] **#87** [[T27] Template Rendering API — Server-Side HTML → Dynamic Content](https://github.com/kevinhongfr-star/lyc-intelligence/issues/87)
- [ ] **#88** [[T28] Document Storage & Versioning Service](https://github.com/kevinhongfr-star/lyc-intelligence/issues/88)
- [ ] **#89** [[T29] PDF Export Service — Server-Side HTML → PDF Generation](https://github.com/kevinhongfr-star/lyc-intelligence/issues/89)
- [ ] **#90** [[T30] Email Delivery Pipeline — D46-D50 Scheduled & On-Demand](https://github.com/kevinhongfr-star/lyc-intelligence/issues/90)
- [ ] **#91** [[T31] Interactive Template React Conversion — Interview & Scheduling (L4)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/91)
- [ ] **#92** [[T32] Interactive Template React Conversion — Feedback & Forms (L5-L6)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/92)
- [ ] **#93** [[T33] Interactive Template React Conversion — Assessment & Onboarding (L8)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/93)
- [ ] **#94** [[T34] Template Permission & Access Control Matrix](https://github.com/kevinhongfr-star/lyc-intelligence/issues/94)
- [ ] **#95** [[T35] End-to-End User Acceptance Testing — All Portals](https://github.com/kevinhongfr-star/lyc-intelligence/issues/95)
- [ ] **#96** [[T36] AI Content Generation Engine — DeepSeek-Powered Document Drafting](https://github.com/kevinhongfr-star/lyc-intelligence/issues/96)
- [ ] **#97** [[T37] Template Data Contracts — Input Schema Per Template](https://github.com/kevinhongfr-star/lyc-intelligence/issues/97)
- [ ] **#98** [[T38] Supabase Data Model & Engagement Schema Design](https://github.com/kevinhongfr-star/lyc-intelligence/issues/98)
- [ ] **#99** [[T39] Dynamic Visual Components Library — Supabase-Connected, Auto-Updating Charts](https://github.com/kevinhongfr-star/lyc-intelligence/issues/99)
- [ ] **#100** [[T40] AI Trigger & Orchestration Layer — Manual, Auto, and Scheduled AI Generation](https://github.com/kevinhongfr-star/lyc-intelligence/issues/100)

---

## 📈 Intelligence Reports (Phase 5 — Auto-Generation)
**Spec:** [13_Intelligence_Reports_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md)

### Tickets
- [ ] **#22** [Phase 5: Cohort Intelligence Report Auto-Generation](https://github.com/kevinhongfr-star/lyc-intelligence/issues/22)
- [ ] **#23** [Phase 5: Signal Council Monthly Intelligence Briefing](https://github.com/kevinhongfr-star/lyc-intelligence/issues/23)
- [ ] **#24** [Phase 5: APAC Executive Intelligence Report (Quarterly)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/24)

---

## 🚀 Go-Live Checklist
**Specs:**
- [14_Legal_Pages_Compliance_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/14_Legal_Pages_Compliance_Spec.md)
- [15_First_Time_Onboarding_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/15_First_Time_Onboarding_Spec.md)

### Tickets
- [ ] **#26** [Go-Live: CI/CD Pipeline (build check + lint gate + automated tests)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/26)
- [ ] **#27** [Go-Live: Custom Domain Configuration](https://github.com/kevinhongfr-star/lyc-intelligence/issues/27)
- [ ] **#28** [Go-Live: Error Monitoring & Crash Reporting (Sentry/LogRocket)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/28)
- [ ] **#29** [Go-Live: Load Testing & Performance Validation](https://github.com/kevinhongfr-star/lyc-intelligence/issues/29)
- [ ] **#30** [Go-Live: Legal Pages — Terms of Service, Privacy Policy, GDPR Compliance](https://github.com/kevinhongfr-star/lyc-intelligence/issues/30)
- [ ] **#31** [Go-Live: Database Backup & Recovery Strategy](https://github.com/kevinhongfr-star/lyc-intelligence/issues/31)
- [ ] **#32** [Go-Live: First-Time User Onboarding Flow](https://github.com/kevinhongfr-star/lyc-intelligence/issues/32)

---

## 📅 Sprint Plan (S0–S12)
**Reference:** [IMPLEMENTATION_ROADMAP.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/roadmap/IMPLEMENTATION_ROADMAP.md)

### Sprint Tickets
- [ ] **#47** [S0: UI Foundation + Security Core (Week 1-2)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/47)
- [ ] **#48** [S1: Search & Discovery + P0 Assessments (Week 2-3)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/48)
- [ ] **#49** [S2: Pipeline Workflow + Client Portal Core (Week 3-4)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/49)
- [ ] **#50** [S3: Integration Core + Security Layer (Week 5-6)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/50)
- [ ] **#51** [S4: Analytics + AI Intelligence + Collaboration (Week 7-8)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/51)
- [ ] **#52** [S5: Dashboard DnD + Dark Mode + P1 Complete (Week 9-10)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/52)
- [ ] **#53** [S6: AI Intelligence Layer (Week 11-12)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/53)
- [ ] **#54** [S7: Advanced Assessment + Client Intelligence (Week 13-14)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/54)
- [ ] **#55** [S8: P2 Polish + Compliance + PWA (Week 15-16)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/55)
- [ ] **#56** [S9: Premium Client Features — Boardroom Ready (Week 17-18)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/56)
- [ ] **#57** [S10: Intelligence Completes + Full Stack (Week 19-20)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/57)
- [ ] **#58** [S11: P3 Polish + Accessibility (Week 21-22)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/58)
- [ ] **#59** [S12: Final Polish + Launch Readiness (Week 23-24)](https://github.com/kevinhongfr-star/lyc-intelligence/issues/59)

---

## 🔨 Remediation Specs (Post UX Audit)
**Index:** [specs/remediation/INDEX.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/INDEX.md)

| # | Spec | Priority | Effort | Key Issue |
|---|------|----------|--------|-----------|
| 01 | [Auth Unification](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_01_AUTH_UNIFICATION.md) | P0 | 1-2 days | Dual auth systems (useAuth vs useAuthStore) |
| 02 | [Client Portal Fix](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_02_CLIENT_PORTAL.md) | P0 | 3-5 days | Clients see consultant platform (data leak) |
| 03 | [Candidate Portal Fix](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_03_CANDIDATE_PORTAL.md) | P0 | 3-4 days | Dead-end after assessment, no tracking |
| 04 | [Role Navigation](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_04_ROLE_NAVIGATION.md) | P0 | 1-2 days | All users see same sidebar, no filtering |
| 05 | [Consultant Experience](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_05_CONSULTANT_EXPERIENCE.md) | P1 | 4-6 days | No onboarding, no daily tasks, disconnected Nexus |
| 06 | [BD Manager Experience](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_06_BD_MANAGER_EXPERIENCE.md) | P1 | 4-5 days | No BD experience at all |
| 07 | [Team Lead Experience](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_07_TEAM_LEAD_EXPERIENCE.md) | P1 | 4-5 days | No oversight, no approvals, no SLA |
| 08 | [Design System Dedup](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_08_DESIGN_SYSTEM_DEDUP.md) | P2 | 1-2 days | DS duplicated in 12 files, TODOs |
| 09 | [Admin Completion](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/remediation/REM_09_ADMIN_COMPLETION.md) | P2 | 3-4 days | No user/credit management |

**Execution order:** REM_01 → REM_02+03+04 (parallel) → REM_05+06+07 (parallel) → REM_08+09

---

## 📂 Full Spec Document Index

### Registry & Planning
| File | Description |
|------|-------------|
| [00_Master_Ticket_Registry.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/00_Master_Ticket_Registry.md) | Master ticket index (~690 tickets) |
| [specs_index.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/specs_index.md) | Spec bundle index |
| [SPEC_COVERAGE_ANALYSIS.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/SPEC_COVERAGE_ANALYSIS.md) | Detailed coverage analysis |
| [DEX_AI_Master_Build_Plan.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/DEX_AI_Master_Build_Plan.md) | Master build plan v3.1 |
| [PRODUCT_SPEC.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/PRODUCT_SPEC.md) | Product specification |
| [PRD_PHASE1.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/PRD_PHASE1.md) | Phase 1 PRD |

### Portal Specs
| File | Portal |
|------|--------|
| [01_Internal_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/01_Internal_Portal_Spec.md) | Internal/Consultant Portal |
| [04_Client_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/04_Client_Portal_Spec.md) | Client/Company Portal |
| [05_The_Council_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md) | Council Portal + DEX AI |
| [05b_Council_v2_Addendum.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05b_The_Council_Portal_Spec_v2_Addendum.md) | Council v2.1 Addendum |
| [05c_Council_v2_Backend_Wiring.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05c_The_Council_v2_Backend_Wiring.md) | Council v2 Backend |
| [07_Candidate_Portal_Spec_v2.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/07_Candidate_Portal_Spec_v2.md) | Candidate Portal v2.1 |

### Cross-Cutting Specs
| File | Area |
|------|------|
| [02_Supabase_Backend_Architecture.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | Backend, Auth, RLS, Schema (57 tables) |
| [03_UX_Behavioral_Mechanics.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/03_UX_Behavioral_Mechanics.md) | UX patterns, state machines |
| [06_Intelligence_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/06_Intelligence_Layer_Spec.md) | Data pipeline & signals |
| [08_Commerce_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/08_Commerce_Layer_Spec.md) | Stripe, credits, pricing |
| [09_SHIFT_Composite_Data_Model_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/09_SHIFT_Composite_Data_Model_Spec.md) | SHIFT assessment model |
| [10_Online_Diagnostic_Assessment_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/10_Online_Diagnostic_Assessment_Spec.md) | Assessment engine |
| [11_Cohort_Analytics_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/11_Cohort_Analytics_Spec.md) | Cohort analytics |
| [12_Academy_LMS_Complete_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/12_Academy_LMS_Complete_Spec.md) | Academy LMS |
| [13_Intelligence_Reports_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | Auto-generated reports |

### UX & Design
| File | Area |
|------|------|
| [17_Design_System_Component_Library_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/17_Design_System_Component_Library_Spec.md) | 17 base components |
| [18_Public_Site_And_Activation_Flows_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/18_Public_Site_And_Activation_Flows_Spec.md) | Public site + activation |
| [19_Email_Admin_Analytics_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md) | Email admin + analytics |
| [16_Portal_Product_Design_Gap_Analysis.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/16_Portal_Product_Design_Gap_Analysis.md) | 50+ design gaps |

### Go-Live & Legal
| File | Area |
|------|------|
| [14_Legal_Pages_Compliance_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/14_Legal_Pages_Compliance_Spec.md) | Terms, Privacy, GDPR |
| [15_First_Time_Onboarding_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/15_First_Time_Onboarding_Spec.md) | User onboarding flows |

### Additional Docs
| File | Area |
|------|------|
| [BUSINESS_DOCUMENTS_SPECIFICATION.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/BUSINESS_DOCUMENTS_SPECIFICATION.md) | Business docs (86KB) |
| [DEX_AI_MASTER_SPEC.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/DEX_AI_MASTER_SPEC.md) | DEX AI master spec |
| [EMAIL_GENERATOR_SPEC.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/EMAIL_GENERATOR_SPEC.md) | Email generator engine |
| [REPORT_DESIGN_SPECIFICATION.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/REPORT_DESIGN_SPECIFICATION.md) | Report design (69KB) |
| [FEATURE_MASTER_LIST_500.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/FEATURE_MASTER_LIST_500.md) | 500+ feature list (60KB) |
| [CLIENT_PORTAL_FEATURE_MAP.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/CLIENT_PORTAL_FEATURE_MAP.md) | Client portal features (37KB) |
| [TEMPLATE_PORTAL_INTEGRATION_MAP.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/TEMPLATE_PORTAL_INTEGRATION_MAP.md) | Template-portal mapping |
| [IMPLEMENTATION_ROADMAP.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/docs/roadmap/IMPLEMENTATION_ROADMAP.md) | 24-week roadmap |
| [TRAE_FIX_SPEC.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/TRAE_FIX_SPEC.md) | Trae fix specification |
| [master_migration.sql](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/master_migration.sql) | Database migration (57 tables) |

---

## 🔑 Key Technical Context

- **Stack:** Next.js + TypeScript + Tailwind CSS + Supabase (Auth + DB + Edge Functions)
- **Auth:** Supabase GoTrue with RBAC (custom JWT claims)
- **Database:** 57 tables, all RLS-protected, zero public tables
- **AI:** DeepSeek API (deepseek-chat, deepseek-reasoner)
- **Payments:** Stripe integration
- **Deployment:** Vercel (auto-deploy from `main` branch)
- **Supabase URL:** `rnnlteyqmtxkzllbohuu.supabase.co`
- **Live:** `www.lyc-intelligence.app`

---

*Generated 2026-08-02 — 120 open tickets, 22+ spec files, 9 remediation specs*