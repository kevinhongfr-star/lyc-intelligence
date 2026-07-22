# LYC Intelligence — Centralized Spec & Ticket Master Index

**Last Updated:** 2026-07-22
**Branch:** `build/cd-consolidated`
**Total Phases:** 9 + Go-Live | **Total Tickets:** ~110+ | **Est. Total Effort:** ~1,250h+

---

## Phase Map Overview

| Phase | Name | Status | Tickets | Est. Hours | Doc |
|-------|------|--------|---------|------------|-----|
| 0 | Design Foundation | ✅ DONE | 3 | — | [ALL_TICKETS.md](../../ALL_TICKETS.md) §Phase 0 |
| 1 | Foundation (P0) | ✅ DONE | 6 (T1–T6) | 170–210h | [Phase 1](../LYC_Intelligence_Phase1_Tickets.md) |
| 2 | Intelligence + Council + Internal (P1) | 🔄 IN PROGRESS | 10 (T7–T16) | 220–280h | [Phase 2](../LYC_Intelligence_Phase2_Tickets.md) |
| 3 | Client & Candidate Experience (P2) | ⚪ READY | 6 (T17–T22) | 110–150h | [Phase 3](../LYC_Intelligence_Phase3_Tickets.md) |
| 4 | GRID Integration | ⚪ READY | 6 (T23–T28) | 114–156h | [Phase 4](../LYC_Intelligence_Phase4_Tickets.md) |
| 5 | UX Quality & Platform Standards | ⚪ READY | 6 (T29–T34) | 74–120h | [Phase 5](../LYC_Intelligence_Phase5_Quality_Specs.md) |
| 6 | Scale, Polish & Tech Debt | ⚪ READY | ~2–3 | TBD | [Master Build Plan](../../DEX_AI_Master_Build_Plan.md) |
| 7 | Go-Live Readiness (Diagnostics) | ⚪ READY | 14 (T-701–T-714) | ~91h | [Phase 7](../LYC_Intelligence_Phase7_GoLive_Tickets.md) |
| 8 | Pricing Architecture Alignment (CD-11) | ⚪ READY | 11 (T-801–T-811) | ~45h | [Phase 8](../LYC_Phase8_Pricing_Alignment_Tickets.md) |

---

## Phase 0 — Design Foundation ✅

| # | Ticket | Spec Ref | Description |
|---|--------|----------|-------------|
| — | Design System & Component Library | [spec 17](../v2/17_Design_System_Component_Library_Spec.md) | 17 base components, color palette, typography, spacing, accessibility |
| — | Public Marketing Site | [spec 18](../v2/18_Public_Site_And_Activation_Flows_Spec.md) | Homepage, Pricing, Features Tour, FAQ, Book Demo flow |
| — | User Activation Flows | [spec 18](../v2/18_Public_Site_And_Activation_Flows_Spec.md) | First-run experience per portal (B2C, Council, Candidate, Client, Student) |

---

## Phase 1 — Foundation (P0) ✅ DONE

**Scope:** 26 features | 170–210h | Weeks 1–5
**Dependencies:** T1 → T2/T3/T6 → T4 → T5

| Ticket | Title | Est. |
|--------|-------|------|
| T1 | Schema & Data Layer (8 Supabase tables, 30+ APIs) | 40–50h |
| T2 | Authentication & Authorization (multi-portal RBAC) | 20–26h |
| T3 | B2C Chat Portal (NEXUS conversational UI) | 30–40h |
| T4 | Council Portal (membership tiers, diagnostics) | 24–30h |
| T5 | Client/B2B Portal (mandates, pipeline, reports) | 26–34h |
| T6 | DEX AI Core Engine (scoring, classification, archetype) | 30–40h |

**Full spec:** [Phase 1 Tickets](../LYC_Intelligence_Phase1_Tickets.md)

---

## Phase 2 — Intelligence + Council + Internal (P1)

**Scope:** 45 features | 220–280h | Weeks 6–10
**Dependencies:** Phase 1 complete

| Ticket | Title | Est. | Key Dependencies |
|--------|-------|------|-----------------|
| T7 | Revenue Forecast & Change Detection Engine | 24–30h | T1, T2 |
| T8 | Team Capacity & Load Balancer | 16–22h | T1, T2 |
| T9 | Communication Engine | 30–38h | T1, T3 |
| T10 | Report Templates & Distribution | 20–26h | T5 |
| T11 | Agent Orchestration | 22–28h | T1 |
| T12 | Scoring Calibration & Intelligence | 16–22h | T1, T3 |
| T13 | DEX AI Advanced Infrastructure | 18–24h | T6 |
| T14 | Coaching Portal (5 P1 features) | 16–20h | T1, T6 |
| T15 | Candidate Portal (5 P1 features) | 14–18h | T1, T6 |
| T16 | Leader Portal (4 P1 features) | 12–16h | T1, T6, T7 |

**Full spec:** [Phase 2 Tickets](../LYC_Intelligence_Phase2_Tickets.md)

---

## Phase 3 — Client & Candidate Experience (P2)

**Scope:** 28 features | 110–150h | Weeks 11–15
**Dependencies:** Phase 1 + 2 complete

| Ticket | Title | Est. |
|--------|-------|------|
| T17 | Meeting Intelligence & Automation Tools | 18–22h |
| T18 | Advanced Search, Dedup & Governance | 17–24h |
| T19 | Advanced Client Deliverables | 26–36h |
| T20 | Strategic Intelligence Suite | 34–44h |
| T21 | Coaching Portal Completion (5 P2 features) | 13–18h |
| T22 | Candidate Portal Completion (6 P2 features) | 16–23h |

**Full spec:** [Phase 3 Tickets](../LYC_Intelligence_Phase3_Tickets.md)

---

## Phase 4 — GRID Integration

**Scope:** 6 modules | 114–156h | Weeks 16–22
**Dependencies:** Phase 1–3 complete

| Ticket | Title | Est. |
|--------|-------|------|
| T23 | GRID Data Foundation & Schema (Module 1) | 18–24h |
| T24 | Market Map Generator (Module 2) | 20–28h |
| T25 | Target Company Builder (Module 3) | 16–22h |
| T26 | Candidate Analytics Engine (Module 4) | 24–32h |
| T27 | Compensation Intelligence (Module 5) | 16–22h |
| T28 | Deliverable Generator & Report Engine (Module 6) | 20–28h |

**Full spec:** [Phase 4 Tickets](../LYC_Intelligence_Phase4_Tickets.md)

---

## Phase 5 — UX Quality & Platform Standards

**Scope:** 6 quality tickets | 74–120h | Cross-cutting
**Dependencies:** Phase 1–4 deployed

| Ticket | Title | Priority | Est. |
|--------|-------|----------|------|
| T29 | NEXUS Chatbot Behavioral Spec | 🔴 P0 | 8–12h |
| T30 | Page Interactivity Standard | 🔴 P0 | 16–24h |
| T31 | Design & Visual Quality Spec | 🟡 P1 | 20–30h |
| T32 | Performance Standards | 🔴 P0 | 12–18h |
| T33 | Layout & Information Architecture | 🟡 P1 | 10–14h |
| T34 | Cross-Portal Consistency Audit | 🟡 P1 | 8–12h |

**Full spec:** [Phase 5 Quality Specs](../LYC_Intelligence_Phase5_Quality_Specs.md)

---

## Phase 6 — Scale, Polish & Tech Debt

**Scope:** TBD | Referenced in Master Build Plan
**Details:** [DEX_AI_Master_Build_Plan.md](../../DEX_AI_Master_Build_Plan.md)

---

## Phase 7 — Go-Live Readiness (Diagnostics)

**Scope:** 14 tickets | ~91h | Diagnostic platform production readiness
**Trigger:** DRIVE Report Web HTML design audit revealed ~30% design drift

| Ticket | Title | Est. |
|--------|-------|------|
| T-701 | Design System Tokens: Shared Report Theme | — |
| T-702 | Assessment Engine Integration: Real Questions & Scoring | — |
| T-703 | DRIVE Report Renderer (Web + PDF) | — |
| T-704 | SHIFT Report Renderer — Redesign to Design System | — |
| T-705 | QUEST Report Renderer (Web + PDF) | — |
| T-706 | IMPACT Report Renderer (Web + PDF) | — |
| T-707 | PRISM Report Renderer (Web + PDF) | — |
| T-708 | BRIDGE Report Renderer (Web + PDF) | — |
| T-709 | MOSAIC Report Renderer (Web + PDF) | — |
| T-710 | FORGE Report Renderer (Web + PDF) | — |
| T-711 | SPARK Report Renderer (Web + PDF) | — |
| T-712 | Report Persistence: Supabase Integration | — |
| T-713 | Email Delivery Pipeline: PDF Attachments | — |
| T-714 | End-to-End Integration Testing | — |

**Full spec:** [Phase 7 Tickets](../LYC_Intelligence_Phase7_GoLive_Tickets.md)

---

## Phase 8 — Pricing Architecture Alignment (CD-11)

**Scope:** 11 tickets | ~45h | 3 sprints
**Principle:** Pricing is not published publicly; public site simplified, member portal gated.

### Sprint 1 — Public Cleanup (10h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-801 | Rewrite Council Landing → prestige page, no pricing | 4h |
| T-802 | Convert PublicPricingPage → "How We Work" journey | 3h |
| T-803 | Gate Council Tiers behind login | 2h |
| T-804 | Clean up FAQ (remove pricing refs) | 1h |

### Sprint 2 — Infrastructure (13h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-811 | Supabase schema (council_tier, catalyst_points, onboarding_steps) | 5h |
| T-810 | MemberRoute auth gating for council/* routes | 4h |
| T-805 | Council Benefits Dashboard | 4h |

### Sprint 3 — Member Features (22h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-806 | Catalyst Points tracker | 6h |
| T-807 | Gated member pricing/proposals view | 5h |
| T-808 | Onboarding checklist (Day 0→30) | 6h |
| T-809 | Digital badge & membership card | 5h |

**Full spec:** [Phase 8 Tickets](../LYC_Phase8_Pricing_Alignment_Tickets.md)

---

## Spec Library (specs/v2/)

| # | Spec File | Covers |
|---|-----------|--------|
| 00 | [Master Ticket Registry](../v2/00_Master_Ticket_Registry.md) | All tickets master list |
| 01 | [Internal Portal](../v2/01_Internal_Portal_Spec.md) | Internal admin portal |
| 02 | [Supabase Backend](../v2/02_Supabase_Backend_Architecture.md) | Database architecture |
| 03 | [UX Behavioral Mechanics](../v2/03_UX_Behavioral_Mechanics.md) | UX patterns & behavior |
| 04 | [Client Portal](../v2/04_Client_Portal_Spec.md) | B2B client dashboard |
| 05 | [Council Portal](../v2/05_The_Council_Portal_Spec.md) | Council membership portal |
| 05b | [Council v2 Addendum](../v2/05b_The_Council_Portal_Spec_v2_Addendum.md) | Council spec updates |
| 05c | [Council v2 Backend Wiring](../v2/05c_The_Council_v2_Backend_Wiring.md) | Council backend integration |
| 06 | [Intelligence Layer](../v2/06_Intelligence_Layer_Spec.md) | AI/intelligence engine |
| 07 | [Candidate Portal v2](../v2/07_Candidate_Portal_Spec_v2.md) | Candidate experience |
| 08 | [Commerce Layer](../v2/08_Commerce_Layer_Spec.md) | Payments & subscriptions |
| 09 | [SHIFT Composite Data Model](../v2/09_SHIFT_Composite_Data_Model_Spec.md) | SHIFT assessment model |
| 10 | [Online Diagnostic Assessment](../v2/10_Online_Diagnostic_Assessment_Spec.md) | Diagnostic instruments |
| 11 | [Cohort Analytics](../v2/11_Cohort_Analytics_Spec.md) | Analytics engine |
| 12 | [Academy LMS](../v2/12_Academy_LMS_Complete_Spec.md) | Learning management system |
| 13 | [Intelligence Reports](../v2/13_Intelligence_Reports_Spec.md) | Report generation |
| 14 | [Legal Pages & Compliance](../v2/14_Legal_Pages_Compliance_Spec.md) | Legal/compliance pages |
| 15 | [First-Time Onboarding](../v2/15_First_Time_Onboarding_Spec.md) | User onboarding flows |
| 16 | [Portal Product Design Gap Analysis](../v2/16_Portal_Product_Design_Gap_Analysis.md) | Design gap analysis |
| 17 | [Design System & Component Library](../v2/17_Design_System_Component_Library_Spec.md) | Design tokens & components |
| 18 | [Public Site & Activation Flows](../v2/18_Public_Site_And_Activation_Flows_Spec.md) | Marketing site specs |
| 19 | [Email, Admin & Analytics](../v2/19_Email_Admin_Analytics_Spec.md) | Email & admin tooling |

---

## Supporting Documents

| Document | Path | Purpose |
|----------|------|---------|
| Product Specification | [PRODUCT_SPEC.md](../../PRODUCT_SPEC.md) | Platform product vision & architecture |
| Phase 1 PRD | [PRD_PHASE1.md](../../PRD_PHASE1.md) | Phase 1 product requirements |
| Master Build Plan | [DEX_AI_Master_Build_Plan.md](../../DEX_AI_Master_Build_Plan.md) | Build roadmap & phase tracking |
| All Tickets (GitHub Issues) | [ALL_TICKETS.md](../../ALL_TICKETS.md) | 38 GitHub issues cross-reference |
| Engineering Tickets | [ENGINEERING_TICKETS.md](../../ENGINEERING_TICKETS.md) | Priority fix tickets |
| Spec v2.1 Deep Dive | [SPEC_V2.1_DEEP_DIVE.md](../SPEC_V2.1_DEEP_DIVE.md) | Detailed spec walkthrough |
| Content & AI Layer | [CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md](../CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md) | Content strategy + AI |
| DEX AI Master Spec | [DEX_AI_MASTER_SPEC.md](../DEX_AI_MASTER_SPEC.md) | DEX AI engine spec |
| Org Intelligence Spec | [org_intelligence_full_spec_v2.0.md](../org_intelligence_full_spec_v2.0.md) | Organizational scoring |
| Scoring Guide (Admin) | [org_intelligence_scoring_guide_admin.md](../org_intelligence_scoring_guide_admin.md) | Scoring methodology |
| Assessment Unified Spec | [specs/ASSESSMENT_UNIFIED_SPEC_v1.md](../specs/ASSESSMENT_UNIFIED_SPEC_v1.md) | All 9 diagnostic instruments |
| B2C Portal Gap Analysis | [audits/B2C_PORTAL_GAP_ANALYSIS.md](../audits/B2C_PORTAL_GAP_ANALYSIS.md) | B2C audit results |
| Backup Strategy | [BACKUP_STRATEGY.md](../BACKUP_STRATEGY.md) | Data backup procedures |
| Domain Setup Guide | [DOMAIN_SETUP_GUIDE.md](../DOMAIN_SETUP_GUIDE.md) | DNS/domain configuration |

---

## Execution Order (Sequential Dependency Chain)

```
Phase 0 (Design)
    ↓
Phase 1 (Foundation) → T1 → T2/T3/T6 → T4 → T5
    ↓
Phase 2 (Intelligence) → T7/T8/T11/T12 → T9/T10 → T13 → T14/T15/T16
    ↓
Phase 3 (Client/Candidate) → T17/T18 → T19 → T20 → T21/T22
    ↓
Phase 4 (GRID) → T23 → T24 → T25 → T26/T27 → T28
    ↓
Phase 5 (Quality) → T29/T30/T32 (P0) → T31/T33/T34 (P1)
    ↓
Phase 7 (Go-Live) → T-701 → T-702 → T-703..T-711 → T-712 → T-713 → T-714
    ↓
Phase 8 (Pricing) → Sprint 1 (T-801..804) → Sprint 2 (T-811→T-810→T-805) → Sprint 3 (T-806..809)
    ↓
Phase 9 (Pipeline) → Sprint 1 (T-901→T-905 + T-917) → Sprint 2 (T-906→T-909 + T-914 + T-918) → Sprint 3 (T-910→T-913 + T-919→T-920) → Sprint 4 (T-921→T-925) → Sprint 5 (T-926→T-928 + T-915→T-916)
```

---

## Quick Stats

- **Total Phases:** 9 + Go-Live checklist
- **Total Tickets:** ~138+ (T1–T34 + T-701–T-714 + T-801–T-811 + T-901–T-928 + Phase 0/6)
- **Total Spec Files:** 20 (specs/v2/) + 13 supporting docs
- **Estimated Total Effort:** ~1,500–1,900h
- **Current Status:** Phase 1 done, Phase 2 in progress, Phases 3–9 ready

---

## Phase 9 — Diagnostic Pipeline Completion (Full Stack)

**Scope:** 28 tickets | ~208h | 5 sprints
**Source:** Diagnostic system audit — full pipeline from storage to admin analytics
**Parts:** A: Data & API | B: Question Sets | C: Results Experience | D: Email | E: Sharing & Certificates | F: Credits & Admin

### Part A — Data & API Infrastructure (15h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-901 | Assessment Response Storage Schema (Supabase tables + RLS) | 5h |
| T-902 | Assessment API Endpoints (start/progress/complete/history) | 6h |
| T-903 | Save & Resume (progress persistence + auto-save) | 4h |

### Part B — Question Sets Per-Instrument (98h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-904 | QUEST question set (20 scenario questions + scoring) | 6h |
| T-905 | DRIVE question set (20 scenario questions + scoring) | 6h |
| T-906 | SHIFT question set (20 scenario questions + scoring) | 6h |
| T-907 | IMPACT question set (20 scenario questions + scoring) | 6h |
| T-908 | PRISM question set (20 scenario questions + scoring) | 6h |
| T-909 | MOSAIC question set (20 scenario questions + scoring) | 6h |
| T-910 | FORGE question set (20 scenario questions + scoring) | 6h |
| T-911 | LEAP page + question set (20 questions + archetypes from scratch) | 8h |
| T-912 | BRIDGE page + question set (20 questions + archetypes from scratch) | 8h |
| T-913 | SPARK page + question set (20 questions + archetypes from scratch) | 8h |

### Part C — Results Experience (22h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-914 | Results Dashboard Component (radar chart + dimension breakdown) | 8h |
| T-915 | PDF Report Generation (branded downloadable PDF) | 8h |
| T-916 | Retest & Progress Tracking (before/after comparison) | 6h |

### Part D — Email Infrastructure (24h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-917 | Email Sending Infrastructure (Resend API + email_log) | 6h |
| T-918 | Assessment Completion Email (auto-triggered on submit) | 5h |
| T-919 | "Next Steps" Email Sequence (3-email drip: Day 0/3/7) | 8h |
| T-920 | Debrief Booking Flow (Calendly integration + confirmation) | 5h |

### Part E — Social Sharing & Certificates (16h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-921 | Social Share with Real Assessment Results (shareable links) | 6h |
| T-922 | Shareable Badge Image (1200×630 PNG for LinkedIn) | 5h |
| T-923 | Completion Certificates (branded PDF + verification page) | 5h |

### Part F — Credits, Admin & Polish (33h)
| Ticket | Title | Est. |
|--------|-------|------|
| T-924 | Credit-Gated Assessment Access (free teaser → paid full report) | 8h |
| T-925 | Workshop/Webinar → Credit Integration | 6h |
| T-926 | Admin Dashboard — Submissions & Analytics | 8h |
| T-927 | In-App Notification Center | 5h |
| T-928 | Mobile Assessment Optimization | 6h |

**Full spec:** [Phase 9 Tickets](../LYC_Phase9_Diagnostic_Pipeline_Completion_Tickets.md)
