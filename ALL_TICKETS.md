# LYC Intelligence (DEX AI) — All 38 Build Tickets

> **Total:** 38 issues | 22 spec files | 1 coverage analysis | ~1,450 actionable tickets
> **Specs:** [specs/v2/](https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/specs/v2)
> **Master Build Plan:** [DEX_AI_Master_Build_Plan.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/DEX_AI_Master_Build_Plan.md)
> **Coverage Analysis:** [SPEC_COVERAGE_ANALYSIS.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/SPEC_COVERAGE_ANALYSIS.md)

---

## 🔴 Phase 0 — Design Foundation (P0, Build First)

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [33](https://github.com/kevinhongfr-star/lyc-intelligence/issues/33) | Design System & Component Library | [17](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/17_Design_System_Component_Library_Spec.md) | 17 base components, color palette, typography, spacing, patterns, accessibility |
| [34](https://github.com/kevinhongfr-star/lyc-intelligence/issues/34) | Public Marketing Site | [18](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/18_Public_Site_And_Activation_Flows_Spec.md) | Homepage, Pricing, Features Tour, FAQ, Book Demo flow |
| [35](https://github.com/kevinhongfr-star/lyc-intelligence/issues/35) | User Activation Flows | [18](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/18_Public_Site_And_Activation_Flows_Spec.md) | First-run experience per portal (B2C, Council, Candidate, Client, Student) |

---

## Phase 1 — Foundation (✅ Done — Close Manually)

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [1](https://github.com/kevinhongfr-star/lyc-intelligence/issues/1) | Database Migration & Schema Setup | [02](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | 57 tables, master_migration.sql |
| [2](https://github.com/kevinhongfr-star/lyc-intelligence/issues/2) | Auth & RBAC System | [02](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | Supabase Auth, roles, permissions |
| [3](https://github.com/kevinhongfr-star/lyc-intelligence/issues/3) | RLS Policies — All 57 Tables | [02](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | Row-level security for every table |
| [4](https://github.com/kevinhongfr-star/lyc-intelligence/issues/4) | Edge Functions & AI Routing | [02](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | Serverless functions, DeepSeek API routing |
| [5](https://github.com/kevinhongfr-star/lyc-intelligence/issues/5) | UX Design System *(overlaps #33)* | [17](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/17_Design_System_Component_Library_Spec.md) | Can be closed — #33 is the comprehensive version |
| [6](https://github.com/kevinhongfr-star/lyc-intelligence/issues/6) | Stripe Integration & Checkout | [08](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/08_Commerce_Layer_Spec.md) | Payment processing, subscription management |
| [7](https://github.com/kevinhongfr-star/lyc-intelligence/issues/7) | Credit System & Progressive Gating | [08](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/08_Commerce_Layer_Spec.md) | Credit packs, consumption tracking, gating logic |

---

## Phase 2 — Intelligence + Council + Internal

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [8](https://github.com/kevinhongfr-star/lyc-intelligence/issues/8) | Intelligence Layer Data Pipeline | [06](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/06_Intelligence_Layer_Spec.md) | Data ingestion, signal processing, scoring engine |
| [9](https://github.com/kevinhongfr-star/lyc-intelligence/issues/9) | Council Portal — Public Pages & B2C | [05](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md) | Public profiles, apply page, DEX AI B2C integration |
| [10](https://github.com/kevinhongfr-star/lyc-intelligence/issues/10) | Council Portal — Dashboard & Community | [05](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md) + [05b](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05b_Council_v2_Addendum.md) | Member dashboard, community feed, events |
| [11](https://github.com/kevinhongfr-star/lyc-intelligence/issues/11) | Council Portal — Admin Management | [05c](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05c_Council_v2_Backend_Wiring.md) | Application review, member management, tier management |
| [12](https://github.com/kevinhongfr-star/lyc-intelligence/issues/12) | Internal Portal (Consultant Workspace) | [01](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/01_Internal_Portal_Spec.md) | Consultant dashboard, mandate management, analytics |
| [15](https://github.com/kevinhongfr-star/lyc-intelligence/issues/15) | Notification System (Cross-Portal) | [03](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/03_UX_Behavioral_Mechanics.md) + [19](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md) | In-app + email notifications, event triggers |

---

## Phase 2.5 — Assessment + Analytics

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [18](https://github.com/kevinhongfr-star/lyc-intelligence/issues/18) | SHIFT Composite Data Model | [09](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/09_SHIFT_Composite_Data_Model_Spec.md) | 5 instruments, APAC translation, cohort baseline |
| [20](https://github.com/kevinhongfr-star/lyc-intelligence/issues/20) | Online Diagnostic Assessment Engine | [10](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/10_Assessment_Engine_Spec.md) | Assessment UI, scoring engine, result generation |
| [21](https://github.com/kevinhongfr-star/lyc-intelligence/issues/21) | Cohort Analytics Dashboard | [11](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/11_Cohort_Analytics_Spec.md) | Aggregation engine, benchmarking, trend visualization |

---

## Phase 3 — Client + Candidate + Academy

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [13](https://github.com/kevinhongfr-star/lyc-intelligence/issues/13) | Client Portal (Company-Facing) | [04](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/04_Client_Portal_Spec.md) | Mandate management, candidate shortlists, progress tracking |
| [14](https://github.com/kevinhongfr-star/lyc-intelligence/issues/14) | Candidate Portal v2.1 | [07](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/07_Candidate_Portal_Spec_v2.md) | Profile, job matching, application tracking |
| [17](https://github.com/kevinhongfr-star/lyc-intelligence/issues/17) | Academy Admin — Course CMS | [12](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/12_Academy_LMS_Complete_Spec.md) | Course creation, lesson management, enrollment |

---

## Phase 4 — Polish + Student

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [16](https://github.com/kevinhongfr-star/lyc-intelligence/issues/16) | Performance, Accessibility & Polish | [16](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/16_Portal_Product_Design_Gap_Analysis.md) | WCAG 2.1 AA, load optimization, UX polish |
| [19](https://github.com/kevinhongfr-star/lyc-intelligence/issues/19) | Student Dashboard + Community | [12](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/12_Academy_LMS_Complete_Spec.md) | Student portal, forum, development plans |

---

## Phase 5 — Intelligence Reports

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [22](https://github.com/kevinhongfr-star/lyc-intelligence/issues/22) | Cohort Intelligence Report Auto-Gen | [13](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | Automated cohort performance reports |
| [23](https://github.com/kevinhongfr-star/lyc-intelligence/issues/23) | Signal Council Monthly Briefing | [13](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | Monthly intelligence briefing for Council members |
| [24](https://github.com/kevinhongfr-star/lyc-intelligence/issues/24) | APAC Quarterly Report | [13](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | Quarterly APAC executive intelligence report |

---

## Phase 6 — Technical Debt

| # | Issue | Spec | Description |
|---|-------|------|-------------|
| [25](https://github.com/kevinhongfr-star/lyc-intelligence/issues/25) | Technical Debt Backlog | — | Ongoing cleanup, refactoring, dependency updates |

---

## Go-Live Checklist

| # | Issue | Priority | Spec | Description |
|---|-------|:--------:|------|-------------|
| [26](https://github.com/kevinhongfr-star/lyc-intelligence/issues/26) | CI/CD Pipeline | 🔴 | — | Build check, lint gate, automated tests |
| [28](https://github.com/kevinhongfr-star/lyc-intelligence/issues/28) | Error Monitoring | 🔴 | — | Sentry/LogRocket integration |
| [30](https://github.com/kevinhongfr-star/lyc-intelligence/issues/30) | Legal Pages | 🔴 | [14](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/14_Legal_Pages_Compliance_Spec.md) | Terms of Service, Privacy Policy, GDPR |
| [27](https://github.com/kevinhongfr-star/lyc-intelligence/issues/27) | Custom Domain | 🟡 | — | lyc-intelligence.com domain config |
| [29](https://github.com/kevinhongfr-star/lyc-intelligence/issues/29) | Load Testing | 🟡 | — | Performance validation under load |
| [31](https://github.com/kevinhongfr-star/lyc-intelligence/issues/31) | Database Backup | 🟡 | — | Backup & recovery strategy |
| [32](https://github.com/kevinhongfr-star/lyc-intelligence/issues/32) | User Onboarding | 🟡 | [15](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/15_First_Time_Onboarding_Spec.md) | First-time user onboarding flow |

---

## P1 — Platform Infrastructure (High Priority)

| # | Issue | Priority | Spec | Description |
|---|-------|:--------:|------|-------------|
| [36](https://github.com/kevinhongfr-star/lyc-intelligence/issues/36) | Email Templates | 🟡 | [19](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md) | Transactional, notification, activation, marketing emails |
| [37](https://github.com/kevinhongfr-star/lyc-intelligence/issues/37) | Platform Admin Console | 🟡 | [19](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md) | Kevin's control tower — users, orgs, revenue, system health |
| [38](https://github.com/kevinhongfr-star/lyc-intelligence/issues/38) | Analytics & Event Tracking | 🟡 | [19](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md) | Event tracking, dashboards, success metrics |

---

## Quick Reference

| Item | Link |
|------|------|
| **All Issues** | [github.com/kevinhongfr-star/lyc-intelligence/issues](https://github.com/kevinhongfr-star/lyc-intelligence/issues) |
| **All Specs** | [specs/v2/](https://github.com/kevinhongfr-star/lyc-intelligence/tree/main/specs/v2) |
| **Master Build Plan** | [DEX_AI_Master_Build_Plan.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/DEX_AI_Master_Build_Plan.md) |
| **Coverage Analysis** | [SPEC_COVERAGE_ANALYSIS.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/SPEC_COVERAGE_ANALYSIS.md) |
| **Specs Index** | [specs_index.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/specs_index.md) |
| **SQL Migration** | [master_migration.sql](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/master_migration.sql) |

---

*Generated 2026-07-18 — 38 issues, 22 specs, 1 coverage analysis*
