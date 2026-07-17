# LYC Intelligence (DEX AI) — Master Build Plan

**Version:** 3.1 | **Date:** 2026-07-17 | **Author:** NEXUS | **Status:** Living document

---

## Overview

| Phase | Name | Status | Specs | Issues | Est. Duration |
|-------|------|--------|-------|--------|---------------|
| 1 | Foundation | ✅ DONE | 7 specs | #1–#7 | Completed |
| 2 | Intelligence + Council + Internal | 🔄 IN PROGRESS | 5 specs | #8–#12, #15 | 2–3 weeks |
| 2.5 | Diagnostic Intelligence (SHIFT) | ⚪ READY | 3 specs | #18, #20, #21 | 2–3 weeks |
| 3 | Client & Candidate Experience | ⚪ READY | 2 specs | #13–#14 | 2–3 weeks |
| 4 | Academy / LMS | 🟡 PARTIAL | 1 spec | #17, #19 | 3–4 weeks |
| 5 | Intelligence Reports & Content | ⚪ READY | 1 spec | #22–#24 | 2–3 weeks |
| 6 | Scale, Polish & Tech Debt | ⚪ READY | — | #16, #25 | 2–3 weeks |
| GL | Go-Live Prerequisites | ⚪ READY | 2 specs | #26–#32 | 1–2 weeks |

**Total: 38 issues | 21 spec files | 8 phases (including P0) + go-live checklist**

---

## Complete Issue Registry


### Phase 0: Design System & Public Site 🔴 P0
| # | Title | Spec | Status |
|---|-------|------|--------|
| 33 | Design System & Component Library | 17_Design_System | ⚪ Ready |
| 34 | Public Marketing Site (Homepage, Pricing, Features, FAQ) | 18_Public_Site | ⚪ Ready |
| 35 | User Activation Flows (Onboarding Wizards) | 18_Public_Site | ⚪ Ready |

### Phase 1: Foundation ✅
| # | Title | Spec | Status |
|---|-------|------|--------|
| 1 | Database Migration & Schema Setup | 02_Supabase | ✅ Done |
| 2 | Auth & RBAC System | 02_Supabase | ✅ Done |
| 3 | RLS Policies — All 57 Tables | 02_Supabase | ✅ Done |
| 4 | Edge Functions & AI Routing | 02_Supabase | ✅ Done |
| 5 | UX Design System & Shared Components | 03_UX | ✅ Done |
| 6 | Commerce Layer — Stripe Integration | 08_Commerce | ✅ Done |
| 7 | Commerce Layer — Credit System | 08_Commerce | ✅ Done |

### Phase 2: Intelligence + Council + Internal 🔄
| # | Title | Spec | Status |
|---|-------|------|--------|
| 8 | Intelligence Layer — Data Pipeline & Signals | 06_Intelligence | 🔄 Code pushed |
| 9 | Council Portal — Public Pages | 05_Council | ⚪ Queued |
| 10 | Council Portal — Member Dashboard & Community | 05b_Council_v2 | ⚪ Queued |
| 11 | Council Portal — Admin Management | 05c_Council_Backend | ⚪ Queued |
| 12 | Internal Portal (Consultant Workspace) | 01_Internal | ⚪ Queued |
| 15 | Notification System (Cross-Portal) | Spec needed | ⚪ Queued |

| 36 | Email Templates & Notification System | 19_Email_Admin_Analytics | ⚪ Ready |
| 37 | Platform Admin Console | 19_Email_Admin_Analytics | ⚪ Ready |
| 38 | Analytics & Event Tracking | 19_Email_Admin_Analytics | ⚪ Ready |

### Phase 2.5: Diagnostic Intelligence (SHIFT) ⚪
| # | Title | Spec | Status |
|---|-------|------|--------|
| 18 | SHIFT Composite Data Model (11 tables, 5 instruments, APAC) | 09_SHIFT_Data_Model | ⚪ Ready |
| 20 | Online Diagnostic Assessment Engine (UI + scoring) | 10_Assessment_Engine | ⚪ Ready |
| 21 | Cohort Analytics Dashboard & Aggregation | 11_Cohort_Analytics | ⚪ Ready |

### Phase 3: Client & Candidate Experience ⚪
| # | Title | Spec | Status |
|---|-------|------|--------|
| 13 | Client Portal (Company-Facing) | 04_Client_Portal | ⚪ Ready |
| 14 | Candidate Portal v2.1 | 07_Candidate_Portal_v2 | ⚪ Ready |

### Phase 4: Academy / LMS 🟡
| # | Title | Spec | Status |
|---|-------|------|--------|
| 17 | Academy Admin — Course Content Management | 12_Academy_LMS | 🟡 Partial |
| 19 | Student Dashboard + Community + Development Plans | 12_Academy_LMS | ⚪ Ready |

### Phase 5: Intelligence Reports & Content ⚪
| # | Title | Spec | Status |
|---|-------|------|--------|
| 22 | Cohort Intelligence Report Auto-Generation | 13_Intelligence_Reports | ⚪ Ready |
| 23 | Signal Council Monthly Intelligence Briefing | 13_Intelligence_Reports | ⚪ Ready |
| 24 | APAC Executive Intelligence Report (Quarterly) | 13_Intelligence_Reports | ⚪ Ready |

### Phase 6: Scale, Polish & Tech Debt ⚪
| # | Title | Spec | Status |
|---|-------|------|--------|
| 16 | Performance, Accessibility & Polish | — | ⚪ Queued |
| 25 | Technical Debt Backlog & Infrastructure Cleanup | — | ⚪ Queued |

### Go-Live Prerequisites ⚪
| # | Title | Spec | Priority |
|---|-------|------|----------|
| 26 | CI/CD Pipeline (build + lint + test gate) | — | 🔴 NOW |
| 27 | Custom Domain Configuration | — | 🟡 Before launch |
| 28 | Error Monitoring & Crash Reporting (Sentry) | — | 🔴 NOW |
| 29 | Load Testing & Performance Validation | — | 🟡 Before launch week |
| 30 | Legal Pages — Terms, Privacy, GDPR/PIPL | 14_Legal_Compliance | 🔴 Before any data |
| 31 | Database Backup & Recovery Strategy | — | 🟡 Before real data |
| 32 | First-Time User Onboarding Flow | 15_Onboarding | 🟡 Before launch |

---

## Dependency Map

```
Phase 1 ✅
    │
    ▼
Phase 2 (Intelligence + Council)
    │
    ├──► Phase 2.5 (SHIFT) ─────────► Phase 5 (Reports)
    │         │                             │
    │         └──► Phase 4 (Academy)        │
    │                                      │
    └──► Phase 3 (Client + Candidate) ─► Phase 4
                                              │
    ┌─────────────────────────────────────────┘
    │
    ▼
Phase 6 (Polish + Tech Debt)

    ┌─── Go-Live Prerequisites (parallel track) ───┐
    │  #26 CI/CD ──── 🔴 needed NOW                │
    │  #28 Error Monitoring ── 🔴 needed NOW       │
    │  #30 Legal Pages ────── 🔴 before data       │
    │  #31 Backup ─────────── 🟡 before real data  │
    │  #27 Custom Domain ──── 🟡 before launch     │
    │  #29 Load Testing ───── 🟡 before launch     │
    │  #32 Onboarding ─────── 🟡 before launch     │
    └──────────────────────────────────────────────┘
```

**Critical path:** Phase 2 → Phase 2.5 → Phase 5  
**Parallel path:** Phase 2 → Phase 3 → Phase 4  
**Go-live gate:** All 🔴 items must be done before ANY external user touches the system

---

## Spec File Index (17 specs)

| File | Phase | Content |
|------|-------|---------|
| 01_Internal_Portal_Spec.md | 2 | Consultant workspace |
| 02_Supabase_Backend_Architecture.md | 1 | DB, auth, RLS, edge functions |
| 03_UX_Behavioral_Mechanics.md | 1 | Design system, gamification |
| 04_Client_Portal_Spec.md | 3 | Company-facing portal |
| 05_The_Council_Portal_Spec.md | 2 | Council public pages |
| 05b_The_Council_Portal_Spec_v2_Addendum.md | 2 | Member dashboard + community |
| 05c_The_Council_v2_Backend_Wiring.md | 2 | Council admin backend |
| 06_Intelligence_Layer_Spec.md | 2 | Signal pipeline, Company 360° |
| 07_Candidate_Portal_Spec_v2.md | 3 | Candidate profiles + matching |
| 08_Commerce_Layer_Spec.md | 1 | Stripe, credits, pricing |
| 09_SHIFT_Composite_Data_Model_Spec.md | 2.5 | 11 tables, 5 instruments, APAC |
| 10_Online_Diagnostic_Assessment_Spec.md | 2.5 | Assessment UI + scoring |
| 11_Cohort_Analytics_Spec.md | 2.5 | Aggregation + visualization |
| 12_Academy_LMS_Complete_Spec.md | 4 | Courses, students, community, certs |
| 13_Intelligence_Reports_Spec.md | 5 | 3 report types, AI generation |
| 14_Legal_Pages_Compliance_Spec.md | GL | Terms, privacy, GDPR, PIPL |
| 15_First_Time_Onboarding_Spec.md | GL | B2C, Council, B2B onboarding |
| 16_Portal_Product_Design_Gap_Analysis.md | — | Portal-level UX gap analysis |
| 17_Design_System_Component_Library_Spec.md | 0 | Complete design system (colors, typography, 17 components, patterns) |
| 18_Public_Site_And_Activation_Flows_Spec.md | 0 | Marketing site + onboarding wizards + conversion UX |
| 19_Email_Admin_Analytics_Spec.md | P1 | Email templates, admin console, analytics tracking |

---

## Go-Live Readiness Checklist

### 🔴 Must Complete Before ANY External User
- [ ] #26 CI/CD Pipeline — build check + lint gate
- [ ] #28 Error Monitoring — Sentry or equivalent
- [ ] #30 Legal Pages — Terms, Privacy, cookie consent
- [ ] aiHandler.ts rateLimiter migration
- [ ] DeepSeek API alias migration (Jul 24 deadline)
- [ ] Credit pack pricing resolved (Kevin decision)
- [ ] Phase 1 issues closed (#1-#7)

### 🟡 Must Complete Before Launch
- [ ] #27 Custom domain configured
- [ ] #29 Load testing passed
- [ ] #31 Backup & recovery verified
- [ ] #32 Onboarding flow functional
- [ ] Phase 2: All 6 issues closed
- [ ] Phase 2.5: SHIFT data model + assessment + analytics
- [ ] Phase 5: At least 1 report type generating from real data
- [ ] Vercel production on custom domain

### 🟢 Should Complete for Full Launch
- [ ] Phase 3: Client + Candidate portals
- [ ] Phase 4: Academy functional
- [ ] All 32 issues closed
- [ ] WCAG 2.1 AA compliance
- [ ] Multi-language (EN/ZH)

### 🔵 Post-Launch (Phase 6)
- [ ] Performance optimization (Lighthouse >90)
- [ ] Advanced analytics dashboard
- [ ] API versioning
- [ ] Additional polish items

---

## Current State (2026-07-17)

- **Vercel:** Production READY (commit `4838cacc90`)
- **Supabase:** 477 tables, 36 v2_ tables, all migrations run
- **Trae:** Working on Phase 2 (#8 Intelligence Layer code pushed)
- **Specs:** 21 spec files covering all phases + go-live
- **Issues:** 38 total, all open, with spec coverage
- **Blockers:** None blocking Phase 2 continuation
