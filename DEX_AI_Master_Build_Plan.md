# LYC Intelligence (DEX AI) — Master Build Plan

**Version:** 1.1 | **Date:** 2026-07-17 | **Author:** NEXUS | **Status:** Living document

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

**Total: 25 issues | 18 spec files | 7 phases**

---

## Issue Registry (Complete)

### Phase 1: Foundation ✅
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #1 | Database Migration & Schema Setup | 02_Supabase | ✅ Closed |
| #2 | Auth & RBAC System | 02_Supabase | ✅ Closed |
| #3 | RLS Policies — All 57 Tables | 02_Supabase | ✅ Closed |
| #4 | Edge Functions & AI Routing | 02_Supabase | ✅ Closed |
| #5 | UX Design System & Shared Components | 03_UX | ✅ Closed |
| #6 | Commerce Layer — Stripe Integration | 08_Commerce | ✅ Closed |
| #7 | Commerce Layer — Credit System | 08_Commerce | ✅ Closed |

### Phase 2: Intelligence + Council + Internal 🔄
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #8 | Intelligence Layer — Data Pipeline & Signals | 06_Intelligence | 🔄 Code pushed |
| #9 | Council Portal — Public Pages | 05_Council | ⚪ Queued |
| #10 | Council Portal — Member Dashboard & Community | 05b_Council_v2 | ⚪ Queued |
| #11 | Council Portal — Admin Management | 05c_Council_Backend | ⚪ Queued |
| #12 | Internal Portal (Consultant Workspace) | 01_Internal | ⚪ Queued |
| #15 | Notification System (Cross-Portal) | ⚠️ Spec needed | ⚪ Queued |

### Phase 2.5: Diagnostic Intelligence (SHIFT) ⚪
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #18 | SHIFT Composite Data Model (11 tables) | 09_SHIFT_Data_Model | ⚪ Ready |
| #20 | Online Diagnostic Assessment Engine | 10_Assessment_Engine | ⚪ Ready |
| #21 | Cohort Analytics Dashboard | 11_Cohort_Analytics | ⚪ Ready |

### Phase 3: Client & Candidate Experience ⚪
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #13 | Client Portal (Company-Facing) | 04_Client_Portal | ⚪ Ready |
| #14 | Candidate Portal v2.1 | 07_Candidate_Portal_v2 | ⚪ Ready |

### Phase 4: Academy / LMS 🟡
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #17 | Academy Admin — Course Content Management | 12_Academy_LMS | 🟡 Pages partial |
| #19 | Student Dashboard + Community + Development Plans | 12_Academy_LMS | ⚪ Ready |

### Phase 5: Intelligence Reports & Content ⚪
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #22 | Cohort Intelligence Report Auto-Generation | 13_Intelligence_Reports | ⚪ Ready |
| #23 | Signal Council Monthly Intelligence Briefing | 13_Intelligence_Reports | ⚪ Ready |
| #24 | APAC Executive Intelligence Report (Quarterly) | 13_Intelligence_Reports | ⚪ Ready |

### Phase 6: Scale, Polish & Tech Debt ⚪
| Issue | Title | Spec | Status |
|-------|-------|------|--------|
| #16 | Performance, Accessibility & Polish | — | ⚪ Queued |
| #25 | Technical Debt Backlog & Infrastructure | — | ⚪ Queued |

---

## Dependency Map

```
Phase 1 ✅
    │
    ▼
Phase 2 (Intelligence + Council)
    │
    ├──► Phase 2.5 (SHIFT Composite) ──────► Phase 5 (Reports)
    │         │                                    │
    │         └──► Phase 4 (Academy diagnostics)   │
    │                                              │
    └──► Phase 3 (Client & Candidate) ─► Phase 4  │
                                               │   │
                                               ▼   ▼
                                          Phase 6 (Polish)
```

**Critical path:** Phase 2 → Phase 2.5 → Phase 5  
**Parallel path:** Phase 2 → Phase 3 → Phase 4  
**Last:** Phase 6 (after all above)

---

## Spec File Index

All specs in `specs/v2/`:

| File | Phase | Size | Content |
|------|-------|------|---------|
| 01_Internal_Portal_Spec.md | 2 | 10 KB | Consultant workspace |
| 02_Supabase_Backend_Architecture.md | 1 | 42 KB | DB, auth, RLS, edge functions |
| 03_UX_Behavioral_Mechanics.md | 1 | 11 KB | Design system, gamification |
| 04_Client_Portal_Spec.md | 3 | 12 KB | Company-facing portal |
| 05_The_Council_Portal_Spec.md | 2 | 29 KB | Council public pages |
| 05b_The_Council_Portal_Spec_v2_Addendum.md | 2 | 13 KB | Member dashboard + community |
| 05c_The_Council_v2_Backend_Wiring.md | 2 | 10 KB | Council admin backend |
| 06_Intelligence_Layer_Spec.md | 2 | 15 KB | Signal pipeline, Company 360° |
| 07_Candidate_Portal_Spec_v2.md | 3 | 17 KB | Candidate profiles + matching |
| 08_Commerce_Layer_Spec.md | 1 | 21 KB | Stripe, credits, pricing |
| 09_SHIFT_Composite_Data_Model_Spec.md | 2.5 | 12 KB | 11 tables, 5 instruments, APAC |
| 10_Online_Diagnostic_Assessment_Spec.md | 2.5 | 8 KB | Assessment UI + scoring |
| 11_Cohort_Analytics_Spec.md | 2.5 | 6 KB | Aggregation + visualization |
| 12_Academy_LMS_Complete_Spec.md | 4 | 10 KB | Courses, students, community, certs |
| 13_Intelligence_Reports_Spec.md | 5 | 8 KB | 3 report types, AI generation |

**Supporting files:**
- `specs_index.md` — Spec cross-reference index
- `trae_build_tickets.md` — Trae's task queue
- `00_Master_Ticket_Registry.md` — Master ticket registry
- `master_migration.sql` — Full database migration (57 tables)
- `LYC_Intelligence_Complete_Specs_and_Tickets.md` — All specs combined

---

## Go-Live Readiness Checklist

### Must Complete (Critical Path)
- [ ] Phase 2: All 6 issues closed
- [ ] Phase 2.5: SHIFT data model + assessment + analytics
- [ ] Phase 5: At least 1 report type generating from real data
- [ ] aiHandler.ts rateLimiter migration (tech debt)
- [ ] DeepSeek API alias migration (Jul 24 deadline)
- [ ] Credit pack pricing resolved

### Should Complete (Full Launch)
- [ ] Phase 3: Client + Candidate portals
- [ ] Phase 4: Academy functional with courses
- [ ] All 25 issues closed
- [ ] Vercel production deployment stable
- [ ] WCAG 2.1 AA compliance
- [ ] Multi-language (EN/ZH) support

### Nice to Have (Post-Launch)
- [ ] Phase 6 polish items
- [ ] Advanced analytics dashboard
- [ ] API versioning
- [ ] Full cohort comparison features

---

## Current State (2026-07-17)

- **Vercel:** Production deployment READY (commit `4838cacc90`)
- **Supabase:** 477 tables, 36 v2_ tables, all migrations run
- **Trae:** Working on Phase 2 issues
- **Specs:** 15 spec files, 25 issues — complete coverage for all phases
- **Known blockers:** None blocking Phase 2 continuation
