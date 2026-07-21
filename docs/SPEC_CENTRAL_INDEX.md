# LYC Intelligence — Spec Central Index
## Master Inventory of All Specs, Tickets, Features & Audit Findings

**Generated:** 2026-07-21 | **Author:** NEXUS
**Purpose:** Single source of truth for ALL specs, tickets, features, and gaps across the platform

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Spec Documents** | 62 files |
| **Total GitHub Issues** | 59 (#1–#59) |
| **500 Feature Master List** | 500 features (10 categories) |
| **v2 Spec Tickets (formal IDs)** | ~392 tickets |
| **Phase Tickets (docs/)** | ~111 features across 5 phases |
| **Remediation Specs** | 9 specs (post-audit fixes) |
| **Audit Reports** | 12 reports |
| **Total Estimated Features (deduplicated)** | ~650–700 unique features |
| **Total Spec Volume** | 1.84 MB |

---

## 1. Spec Inventory — Complete List

### 1.1 Core Platform Specs (specs/v2/)

| # | File | Title | Status | Tickets | Size |
|---|------|-------|--------|:-------:|------|
| 00 | `00_Master_Ticket_Registry.md` | Master Ticket Registry | ✅ Index | — | 3KB |
| 01 | `01_Internal_Portal_Spec.md` | Internal Portal (Consultants) | ⚪ Ready | 73 | 10KB |
| 02 | `02_Supabase_Backend_Architecture.md` | Supabase Backend | ✅ Done | 12 | 42KB |
| 03 | `03_UX_Behavioral_Mechanics.md` | UX & Behavioral Mechanics | ⚠️ Superseded by 17 | 40 | 11KB |
| 04 | `04_Client_Portal_Spec.md` | Client Portal (Companies) | ⚪ Ready | 67 | 12KB |
| 05 | `05_The_Council_Portal_Spec.md` | Council Portal v2.0 | ⚪ Ready | ~7 | 29KB |
| 05b | `05b_The_Council_Portal_Spec_v2_Addendum.md` | Council v2.1 Addendum | ⚪ Ready | 45 | 13KB |
| 05c | `05c_The_Council_v2_Backend_Wiring.md` | Council v2 Backend | ⚪ Ready | 27 | 10KB |
| 06 | `06_Intelligence_Layer_Spec.md` | Intelligence Layer | 🔄 In Progress | 44 | 15KB |
| 07 | `07_Candidate_Portal_Spec_v2.md` | Candidate Portal v2.1 | ⚪ Ready | 5 | 17KB |
| 08 | `08_Commerce_Layer_Spec.md` | Commerce Layer v2.0 | ⚪ Ready | 72 | 17KB |
| 09 | `09_SHIFT_Composite_Data_Model_Spec.md` | SHIFT Data Model | ⚪ Ready | — | 8KB |
| 10 | `10_Online_Diagnostic_Assessment_Spec.md` | Online Diagnostic Assessment | ⚪ Ready | — | 10KB |
| 11 | `11_Cohort_Analytics_Spec.md` | Cohort Analytics | ⚪ Ready | — | 7KB |
| 12 | `12_Academy_LMS_Complete_Spec.md` | Academy / LMS | ⚪ Ready | — | 15KB |
| 13 | `13_Intelligence_Reports_Spec.md` | Intelligence Reports | ⚪ Ready | — | 8KB |
| 14 | `14_Legal_Pages_Compliance_Spec.md` | Legal Pages & Compliance | ⚪ Ready | — | 5KB |
| 15 | `15_First_Time_Onboarding_Spec.md` | First-Time Onboarding | ⚪ Ready | — | 8KB |
| 16 | `16_Portal_Product_Design_Gap_Analysis.md` | Portal/Product Gap Analysis | ✅ Complete | — | 14KB |
| 17 | `17_Design_System_Component_Library_Spec.md` | Design System & Components | ⚪ Ready | — | 41KB |
| 18 | `18_Public_Site_And_Activation_Flows_Spec.md` | Public Site & Activation | ⚪ Ready | — | 23KB |
| 19 | `19_Email_Admin_Analytics_Spec.md` | Email, Admin & Analytics | ⚪ Ready | — | 33KB |

**Subtotal: 22 files | ~392 formal tickets | ~330KB**

### 1.2 Remediation Specs (specs/remediation/)

| # | File | Title | Priority | Effort |
|---|------|-------|----------|--------|
| 01 | `REM_01_AUTH_UNIFICATION.md` | Auth System Unification | 🔴 P0 | 1-2 days |
| 02 | `REM_02_CLIENT_PORTAL.md` | Client Portal Build | 🔴 P0 | 3-5 days |
| 03 | `REM_03_CANDIDATE_PORTAL.md` | Candidate Portal Build | 🔴 P0 | 3-4 days |
| 04 | `REM_04_ROLE_NAVIGATION.md` | Role-Based Navigation | 🔴 P0 | 1-2 days |
| 05 | `REM_05_CONSULTANT_EXPERIENCE.md` | Consultant Experience | 🟡 P1 | 4-6 days |
| 06 | `REM_06_BD_MANAGER_EXPERIENCE.md` | BD Manager Experience | 🟡 P1 | 4-5 days |
| 07 | `REM_07_TEAM_LEAD_EXPERIENCE.md` | Team Lead / Partner | 🟡 P1 | 4-5 days |
| 08 | `REM_08_DESIGN_SYSTEM_DEDUP.md` | Design System Dedup | 🔵 P2 | 1-2 days |
| 09 | `REM_09_ADMIN_COMPLETION.md` | Admin Platform Completion | 🔵 P2 | 3-4 days |

**Subtotal: 9 files | ~27-33 days total effort | ~75KB**

### 1.3 Assessment & Product Specs (docs/specs/)

| File | Title | Status | Lines |
|------|-------|--------|-------|
| `ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v2.md` | **Product Spec v2.0 (APPROVED)** | ✅ Kevin Approved | 741 |
| `ASSESSMENT_UNIFIED_SPEC_v1.md` | Unified Assessment Spec | ✅ Decisions Locked | 218 |
| `ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v1.md` | Assessment Spec v1.0 | ⚠️ DEPRECATED | 528 |

**Subtotal: 3 files | Master spec is v2.0**

### 1.4 Audit Reports (docs/audits/)

| File | Title | Key Finding |
|------|-------|-------------|
| `MASTER_AUDIT_SUMMARY.md` | Master Audit Summary | All audits consolidated |
| `AUDIT_B2C_03_NEXUS.md` | B2C: Nexus Chat | AI conversation UX |
| `AUDIT_B2C_04_PRICING.md` | B2C: Pricing & Credits | Credit system gaps |
| `AUDIT_B2C_05_MATCH.md` | B2C: Matching | Candidate-org matching |
| `AUDIT_B2C_06_COACHING_PORTAL.md` | B2C: Coaching Portal | Coaching UX gaps |
| `AUDIT_B2C_07_DEX_LMS.md` | B2C: DEX/LMS | Learning management |
| `AUDIT_B2C_08_CANDIDATE_PORTAL.md` | B2C: Candidate Portal | Dead-end after assessment |
| `AUDIT_B2C_09_CLIENT_INTELLIGENCE_COUNCIL.md` | B2C: Client Intel / Council | Council integration |
| `AUDIT_B2C_DIAGNOSTICS.md` | B2C: Diagnostics | Assessment framework |
| `B2C_PORTAL_GAP_ANALYSIS.md` | B2C Portal Gap Analysis | 50+ gaps identified |
| `CLIENT_PORTAL_DEEP_AUDIT.md` | Client Portal Deep Audit | 12-page full audit |
| `AI_LAYER_ANALYSIS.md` | AI Layer Analysis | 43 orphaned components |
| `UI_UX_DEEP_AUDIT_AND_SPEC.md` | UI/UX Deep Audit + Spec | 8 new components needed |
| `NOTION_VS_CODE_CONSISTENCY_AUDIT.md` | Notion vs Code Audit | Consistency gaps |

**Subtotal: 14 files**

### 1.5 Planning & Roadmap Documents

| File | Title | Content |
|------|-------|---------|
| `docs/FEATURE_MASTER_LIST_500.md` | 500 Feature Master List | 500 features, 10 categories, 4-dim tagging |
| `docs/CLIENT_PORTAL_FEATURE_MAP.md` | Client Portal Feature Map | 500 features → 10 portal areas |
| `docs/roadmap/IMPLEMENTATION_ROADMAP.md` | Implementation Roadmap | 5 phases, 13 sprints, 24 weeks |
| `ALL_TICKETS.md` | All 38 Build Tickets | GitHub #1–#38 index |
| `ENGINEERING_TICKETS.md` | Engineering Fix Tickets | Priority fixes for Trae |
| `PRD_PHASE1.md` | Phase 1 PRD | Fix + Core Launch PRD |
| `PRODUCT_SPEC.md` | Product Spec v1.0 | Original platform spec |
| `DEX_AI_Master_Build_Plan.md` | Master Build Plan | 38 issues, 8 phases |
| `PRIORITY_DIRECTIVE.md` | Priority Directive | Trae build queue priorities |
| `TRAE_FIX_SPEC.md` | Trae Fix Spec | Specific fix instructions |
| `DEX_AI_UX_AUDIT_2026-06-24.md` | DEX AI UX Audit | UX audit from June |

### 1.6 Detailed Specs & Phase Tickets (docs/)

| File | Title | Scope |
|------|-------|-------|
| `docs/DEX_AI_MASTER_SPEC.md` | DEX AI Master Spec v3.1 | B2C + B2B flywheel unification |
| `docs/DEX_AI_NEXUS_PHASE1_TICKETS.md` | Nexus Phase 1 Tickets | 7 tickets, 160-200h |
| `docs/CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md` | Content & AI Layer Spec v2.1 | Nexus-first AI design |
| `docs/SPEC_V2.1_DEEP_DIVE.md` | Spec v2.1 Deep Dive | Council experience + AI architecture |
| `docs/LYC_Intelligence_Phase1_Tickets.md` | Phase 1 Tickets (P0) | 26 features, 170-210h |
| `docs/LYC_Intelligence_Phase2_Tickets.md` | Phase 2 Tickets (P1) | 45 features, 220-280h |
| `docs/LYC_Intelligence_Phase3_Tickets.md` | Phase 3 Tickets (P2) | 28 features, 110-150h |
| `docs/LYC_Intelligence_Phase4_Tickets.md` | Phase 4 Tickets (GRID) | 6 modules, 114-156h |
| `docs/LYC_Intelligence_Phase5_Quality_Specs.md` | Phase 5 Quality Specs | 6 quality tickets |
| `docs/org_intelligence_full_spec_v2.0.md` | Org Intelligence Spec v2.0 | ✅ Deployed |
| `docs/org_intelligence_scoring_spec_v1.2.md` | Org Intel Scoring Spec v1.2 | Scoring framework |
| `docs/org_intelligence_scoring_guide_admin.md` | Org Intel Admin Guide | Admin scoring guide |
| `docs/AKIRA_NEXUS_ASSESSMENT_BRIEF.md` | Akira Assessment Brief | Technical brief for Akira |

---

## 2. GitHub Issue Cross-Reference

### Phase 0 — Design Foundation (Issues #33-#35)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #33 | Design System & Component Library | spec 17 | ⚪ Ready |
| #34 | Public Marketing Site | spec 18 | ⚪ Ready |
| #35 | User Activation Flows | spec 18 | ⚪ Ready |

### Phase 1 — Foundation (Issues #1-#7, ✅ Done)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #1 | Supabase Schema + Auth | spec 02 | ✅ Done |
| #2 | Internal Portal Foundation | spec 01 | ✅ Done |
| #3 | RLS Policies | spec 02 | 🔴 Blocker (close blocked by PAT perms) |
| #4 | Assessment Engine Core | spec v2.0 | ✅ Done |
| #5 | Nexus Chat Interface | DEX_AI_MASTER_SPEC | ✅ Done |
| #6 | Client Portal Basic | spec 04 | ✅ Done |
| #7 | Commerce Layer Foundation | spec 08 | ✅ Done |

### Phase 2 — Intelligence + Council + Internal (Issues #8-#12, #15)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #8 | Intelligence Layer | spec 06 | 🔄 In Progress |
| #9 | Council Portal Frontend | spec 05+05b | ⚪ Ready |
| #10 | Council Membership System | spec 05+08 | ⚪ Ready |
| #11 | Council Backend | spec 05c | ⚪ Ready |
| #12 | Internal Portal Completion | spec 01+REM_05-07 | ⚪ Ready |
| #15 | Notification System | specs 03+19 | ⚪ Ready |

### Phase 2.5 — Diagnostic Intelligence (Issues #18, #20, #21)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #18 | SHIFT Composite Engine | spec 09 | ⚪ Ready |
| #20 | Online Diagnostic UX | spec 10 | ⚪ Ready |
| #21 | Cohort Analytics | spec 11 | ⚪ Ready |

### Phase 3 — Client & Candidate Experience (Issues #13-#14)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #13 | Client Portal Enhancement | spec 04 | ⚪ Ready |
| #14 | Candidate Portal v2 | spec 07 | ⚪ Ready |

### Phase 4 — Academy / LMS (Issues #17, #19)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #17 | Academy LMS | spec 12 | ⚪ Ready |
| #19 | Academy Content | spec 12 | ⚪ Ready |

### Phase 5 — Intelligence Reports (Issues #22-#24)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #22 | Intelligence Reports | spec 13 | ⚪ Ready |
| #23 | Report Templates | spec 13 | ⚪ Ready |
| #24 | Report Distribution | spec 13 | ⚪ Ready |

### Phase 6 — Scale & Polish (Issues #16, #25)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #16 | Performance & Caching | — | ⚪ Ready |
| #25 | Tech Debt | REM_08 + misc | 🔄 Partial (td1-td10 done) |

### Go-Live (Issues #26-#32)

| Issue | Title | Parent Spec | Status |
|-------|-------|-------------|--------|
| #26 | CI/CD Pipeline | spec 14 | 🔴 Not started |
| #27 | Error Monitoring | — | 🟡 Not started |
| #28 | Legal Pages | spec 14 | 🔴 Not started |
| #29 | Email System | spec 19 | ⚪ Ready |
| #30 | Admin Console | spec 19 + REM_09 | ⚪ Ready |
| #31 | Analytics Setup | spec 19 | ⚪ Ready |
| #32 | Launch Checklist | — | ⚪ Ready |

### Sprint Epics from Implementation Roadmap (Issues #47-#59)

| Issue | Sprint | Weeks | Key Features |
|-------|--------|-------|-------------|
| #47 | S0: UI Foundation | 1-2 | UI primitives, security core, AI layer |
| #48 | S1: Search + P0 Assessments | 2-3 | Search/discovery, all P0 assessments |
| #49 | S2: Pipeline + Client Portal | 3-4 | Pipeline workflow, client portal core |
| #50 | S3: Integrations + Security | 5-6 | Third-party integrations, security layer |
| #51 | S4: Analytics + AI Intelligence | 7-8 | Analytics dashboards, AI features |
| #52 | S5: Dashboard + Dark Mode + P1 | 9-10 | DnD dashboards, dark mode, P1 features |
| #53 | S6: AI Intelligence Layer | 11-12 | Predictive AI, market intelligence |
| #54 | S7: Advanced Assessment | 13-14 | Advanced assessments, client intelligence |
| #55 | S8: P2 Polish + Compliance | 15-16 | P2 features, compliance, PWA |
| #56 | S9: Premium Client Features | 17-18 | White-label, board deliverables |
| #57 | S10: Intelligence Completes | 19-20 | Intelligence layer completion |
| #58 | S11: P3 Polish + Accessibility | 21-22 | P3 features, accessibility |
| #59 | S12: Final Polish + Launch | 23-24 | Launch readiness, final polish |

---

## 3. Feature Inventory by Category

### 3.1 From 500 Feature Master List

| Category | Count | P0 | P1 | P2 | P3 |
|----------|:-----:|:--:|:--:|:--:|:--:|
| 1. AI & Intelligence Engine | 60 | — | — | — | — |
| 2. Pipeline & Workflow | 55 | — | — | — | — |
| 3. Client Experience & Portal | 50 | — | — | — | — |
| 4. Assessment & Evaluation | 50 | — | — | — | — |
| 5. Collaboration & Communication | 45 | — | — | — | — |
| 6. Analytics & Reporting | 50 | — | — | — | — |
| 7. Automation & Integration | 50 | — | — | — | — |
| 8. Search & Discovery | 40 | — | — | — | — |
| 9. Security, Compliance & Admin | 45 | — | — | — | — |
| 10. Platform, UX & Design System | 55 | — | — | — | — |
| **TOTAL** | **500** | | | | |

### 3.2 From v2 Spec Tickets (Formal IDs)

| Spec | Ticket Count | Category |
|------|:-----------:|----------|
| 01 Internal Portal | 73 | Consultant workflow |
| 02 Supabase Backend | 12 | Database/infra |
| 03 UX Mechanics | 40 | UX patterns |
| 04 Client Portal | 67 | Client experience |
| 05 Council Portal | ~7 | Council frontend |
| 05b Council Addendum | 45 | Council B2C integration |
| 05c Council Backend | 27 | Council backend |
| 06 Intelligence Layer | 44 | Data intelligence |
| 07 Candidate Portal | 5 | Candidate experience |
| 08 Commerce Layer | 72 | Revenue/pricing |
| **TOTAL** | **~392** | |

### 3.3 From Phase Tickets (docs/)

| Phase | Features | Hours | Weeks |
|-------|:--------:|:-----:|:-----:|
| Phase 1 (P0) | 26 | 170-210 | 1-5 |
| Phase 2 (P1) | 45 | 220-280 | 6-10 |
| Phase 3 (P2) | 28 | 110-150 | 11-15 |
| Phase 4 (GRID) | 6 modules | 114-156 | 16-22 |
| Phase 5 (Quality) | 6 | — | Cross-cutting |
| DEX AI Nexus P1 | 7 | 160-200 | 1-6 |
| **TOTAL** | **~118** | **774-996** | |

### 3.4 From Remediation Specs

| Spec | Category | Priority | Estimated Effort |
|------|----------|----------|-----------------|
| REM_01 Auth Unification | Security/Foundational | P0 | 1-2 days |
| REM_02 Client Portal Build | Portal/Security | P0 | 3-5 days |
| REM_03 Candidate Portal Build | Portal/UX | P0 | 3-4 days |
| REM_04 Role Navigation | Security/UX | P0 | 1-2 days |
| REM_05 Consultant Experience | Portal/UX | P1 | 4-6 days |
| REM_06 BD Manager Experience | Portal/Revenue | P1 | 4-5 days |
| REM_07 Team Lead Experience | Portal/Governance | P1 | 4-5 days |
| REM_08 Design System Dedup | Code Quality | P2 | 1-2 days |
| REM_09 Admin Completion | Portal/Ops | P2 | 3-4 days |
| **TOTAL** | | | **24-35 days** |

### 3.5 From Audit Findings (New Features Identified)

| Audit | New Features/Components | Key Items |
|-------|:----------------------:|-----------|
| UI/UX Deep Audit | 8 | SlideOver, AnimatedModal, AIInsightButton, etc. |
| AI Layer Analysis | 43 | Orphaned AI components needing integration |
| Client Portal Deep Audit | ~30 | Missing client-facing features |
| B2C Gap Analysis | 50+ | Cross-portal gaps |
| Notion vs Code Audit | ~20 | Consistency fixes |

---

## 4. Implementation Status Dashboard

### ✅ DONE (Shipped / Deployed)
- Supabase Backend Architecture (spec 02, 57 tables)
- Org Intelligence Module v2.0 (deployed)
- Assessment Engine Core (Issue #4)
- Nexus Chat Interface (Issue #5)
- Tech Debt td1-td10 (Issue #25 partial)

### 🔄 IN PROGRESS
- Intelligence Layer (spec 06, Issue #8)
- Sprint 0 (Issue #47) — if started

### ⚪ READY (Spec'd, Waiting for Build)
- All Council Portal work (05, 05b, 05c)
- Client Portal Enhancement (04, #13)
- Candidate Portal v2 (07, #14)
- Commerce Layer (08)
- All Phase 2.5 diagnostic work (#18, #20, #21)
- Academy/LMS (#17, #19)
- Intelligence Reports (#22-#24)
- Design System (#33)
- Public Site (#34, #35)

### 🔴 BLOCKED / CRITICAL
- RLS Policies (Issue #3) — PAT permissions can't close
- Auth Unification (REM_01) — blocks all portal work
- Client Portal Data Leak (REM_02) — security risk
- Go-Live prerequisites (#26-#32) — not started

### ⚠️ DEPRECATED / SUPERSEDED
- spec 03 (UX Mechanics) → superseded by spec 17 (Design System)
- Assessment Credit Experience v1 → replaced by v2.0
- PRODUCT_SPEC.md v1.0 → replaced by DEX_AI_MASTER_SPEC v3.1

---

## 5. Gap Analysis — What's Missing Across All Specs

### 🔴 Critical Gaps (Block Launch)

1. **Global Search Architecture** — mentioned everywhere, no dedicated spec
2. **Cross-Portal Navigation** — no unified nav between portals
3. **Permission Matrix Across Portals** — multi-role users undefined
4. **Mobile Strategy** — responsive yes, but no PWA/native decision
5. **API Documentation** — endpoints mentioned, no comprehensive API spec

### 🟡 Medium Gaps (Post-Launch)

6. **Internationalization Framework** — multi-currency exists, no i18n
7. **Third-Party Integration Specs** — Stripe yes, but no calendar/LinkedIn/Zoom
8. **Performance Spec** — no caching strategy, CDN, lazy loading spec
9. **Disaster Recovery Plan** — backup mentioned, no DR plan
10. **Content Moderation System** — mentioned in Council, no detailed spec

### 🔵 Nice-to-Have

11. **A/B Testing Framework**
12. **Customer Data Platform (CDP) Integration**
13. **Advanced Analytics (cohort, funnel)**
14. **Real-time Collaboration (WebSocket)**

---

## 6. Council Pricing & Commerce Coverage Analysis

### 6.1 Council Pricing — What's Already Specced

The Council pricing architecture is covered across **4 specs**:

| Spec | Coverage |
|------|----------|
| `05_The_Council_Portal_Spec.md` | Portal UX, membership tiers, landing pages, application flow |
| `05b_Council_v2_Addendum.md` | Dual credit model, B2C→Council journey, graduation gift |
| `05c_Council_v2_Backend_Wiring.md` | Membership management, payment processing, admin tools |
| `08_Commerce_Layer_Spec.md` | Full product catalog, pricing, Stripe integration, revenue streams |

### 6.2 Council Pricing — Current Spec Coverage

| Element | Covered? | Spec Location | Detail Level |
|---------|:--------:|---------------|-------------|
| **Membership Tiers** (Founding/Individual/Corporate/PE) | ✅ | 05 §3, 08 §2 | Detailed — pricing, credits, benefits |
| **Registration/Annual Fees** | ✅ | 08 §2.1 | Product codes with CNY pricing |
| **Dual Credit System** (DEX + Council) | ✅ | 05b §4, 08 §1.3 | Separate ledgers, non-transferable |
| **DEX AI Credit Packs** (99/399/799) | ✅ | 08 §2.1 | 3 tiers + 2 subscriptions |
| **DEX AI Subscriptions** (99/299/mo) | ✅ | 08 §2.1 | Monthly with credit allocation |
| **Diagnostic/Interpretation Rates** | ⚠️ | 08 §2.1 | Credits defined, per-diagnostic pricing not explicit |
| **Coaching Sessions** | ⚠️ | 05b §5, 08 §2.1 | "1 credit = 1 session" but no booking flow detail |
| **Workshop Tickets** | ⚠️ | 08 §2.1 | Product code exists, no event management spec |
| **Welcome Collection** | ⚠️ | 15 (Onboarding) | Generic onboarding, not tier-specific welcome |
| **Loyalty Program** | ❌ | — | Not in any spec |
| **Digital Badges** (membership/achievement) | ⚠️ | 03 (UX, superseded) | Gamification mentioned, not membership badges |
| **Revenue Forecast ($122.5K)** | ❌ | — | No financial modeling in specs |
| **Public Pricing Page** | ⚠️ | 18 (Public Site) | Structure defined, Council pricing layout missing |
| **Coaching Booking Flow** | ❌ | 05b (partial) | Mentioned but no detailed UX spec |
| **Event/Workshop Management** | ❌ | — | No event scheduling/registration spec |
| **Membership Lifecycle** (renewal, downgrade, failure) | ❌ | 05 (partial) | Not detailed |
| **Member Directory + Privacy** | ❌ | 05b (partial) | Basic structure, privacy controls undefined |

### 6.3 What Needs To Be Added for Council Pricing

| New Feature Needed | Priority | Estimated Effort | Recommended Placement |
|--------------------|----------|-----------------|----------------------|
| **Loyalty/Rewards Engine** — points accrual, referral bonuses, milestone rewards | P2 | 3-5 days | New spec or extend 08 |
| **Coaching Booking System** — session scheduling, coach matching, cancellation policy | P1 | 5-7 days | Extend 05b |
| **Workshop/Event Management** — event creation, registration, capacity, waitlists | P2 | 4-6 days | New spec or extend 05 |
| **Tier-Specific Welcome Flows** — onboarding branches by membership tier | P1 | 2-3 days | Extend 15 |
| **Membership Lifecycle Management** — renewal, downgrade, payment failure, grace period | P1 | 3-4 days | Extend 05c |
| **Digital Badge System** — membership badges, achievement badges, shareable credentials | P3 | 2-3 days | Extend 03/17 |
| **Public Pricing Page** — Council tier comparison, signup flow | P0 | 2-3 days | Extend 18 |
| **Revenue Forecasting Model** — MRR/ARR projections, churn modeling | P2 | 2-3 days | Extend 19 |
| **Per-Diagnostic Pricing Table** — explicit pricing for each diagnostic product | P1 | 1 day | Extend 08 |

**Total new Council-related effort: ~24-37 days**

---

## 7. Overlap & Deduplication Notes

### Known Overlaps

1. **spec 03 (UX Mechanics) ↔ spec 17 (Design System)** — spec 03 is superseded, should be deprecated
2. **PRODUCT_SPEC.md (v1.0) ↔ DEX_AI_MASTER_SPEC.md (v3.1)** — v1.0 is outdated, v3.1 is current
3. **CONTENT_INTEGRATION spec ↔ DEX_AI_MASTER_SPEC** — both cover Nexus AI; master spec is authoritative
4. **SPEC_V2.1_DEEP_DIVE ↔ DEX_AI_MASTER_SPEC** — deep dive is companion, master spec supersedes
5. **Phase tickets (docs/) ↔ Sprint epics (roadmap/)** — two parallel tracking systems for same work
6. **500 Feature List ↔ v2 spec tickets** — partial overlap; 500-list is feature-level, v2 tickets are implementation-level
7. **ALL_TICKETS.md ↔ GitHub Issues #47-#59** — ALL_TICKETS covers #1-#38, roadmap added #47-#59

### Recommended Consolidation

- Deprecate `PRODUCT_SPEC.md` → use `DEX_AI_MASTER_SPEC.md`
- Deprecate `spec 03` → use `spec 17`
- Deprecate `docs/specs/ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v1.md` → use v2
- Merge `CONTENT_INTEGRATION` + `SPEC_V2.1_DEEP_DIVE` into `DEX_AI_MASTER_SPEC`
- Reconcile Phase tickets (docs/) with Sprint epics (roadmap) — pick one system

---

## 8. File Location Map

```
lyc-intelligence/
├── specs/v2/                          ← Core platform specs (22 files)
│   ├── 00_Master_Ticket_Registry.md
│   ├── 01–19 (portal & system specs)
│   ├── 05b, 05c (Council addendums)
│   ├── SPEC_COVERAGE_ANALYSIS.md
│   ├── master_migration.sql
│   └── trae_build_tickets.md
├── specs/remediation/                 ← Post-audit fix specs (9 files)
│   ├── INDEX.md
│   └── REM_01 through REM_09
├── docs/
│   ├── specs/                         ← Assessment specs (3 files)
│   │   ├── ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v2.md ← APPROVED
│   │   ├── ASSESSMENT_UNIFIED_SPEC_v1.md
│   │   └── ASSESSMENT_CREDIT_EXPERIENCE_SPEC_v1.md ← DEPRECATED
│   ├── audits/                        ← Audit reports (14 files)
│   ├── roadmap/
│   │   └── IMPLEMENTATION_ROADMAP.md  ← 13 sprints, 24 weeks
│   ├── FEATURE_MASTER_LIST_500.md     ← 500 features
│   ├── CLIENT_PORTAL_FEATURE_MAP.md   ← Portal mapping
│   ├── DEX_AI_MASTER_SPEC.md          ← Master product spec v3.1
│   ├── DEX_AI_NEXUS_PHASE1_TICKETS.md ← 7 Nexus tickets
│   ├── CONTENT_INTEGRATION_AND_AI_LAYER_SPEC.md
│   ├── SPEC_V2.1_DEEP_DIVE.md
│   ├── LYC_Intelligence_Phase[1-5]_Tickets.md
│   ├── org_intelligence_*.md          ← 3 Org Intel files
│   └── AKIRA_NEXUS_ASSESSMENT_BRIEF.md
├── ALL_TICKETS.md                     ← GitHub #1-#38 index
├── ENGINEERING_TICKETS.md             ← Priority fixes
├── PRD_PHASE1.md                      ← Phase 1 PRD
├── PRODUCT_SPEC.md                    ← v1.0 (outdated)
├── DEX_AI_Master_Build_Plan.md        ← Master build plan
├── PRIORITY_DIRECTIVE.md              ← Trae queue
└── TRAE_FIX_SPEC.md                   ← Fix instructions
```

---

## Summary Statistics

| Dimension | Count |
|-----------|:-----:|
| Total spec documents | 62 |
| Total GitHub issues | 59 |
| Features in master list | 500 |
| Formal tickets in v2 specs | ~392 |
| Phase ticket features | ~118 |
| Remediation specs | 9 |
| Audit reports | 14 |
| Estimated unique features (deduplicated) | ~650-700 |
| Spec coverage of Council Pricing | ~60% (gaps in loyalty, coaching booking, events) |
| Total spec volume | 1.84 MB |
| Deprecated/superseded files | 4 |

---

*Generated 2026-07-21 by NEXUS. This document should be updated whenever new specs are added or features are re-prioritized.*
