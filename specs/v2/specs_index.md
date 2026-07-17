# LYC Intelligence (DEX AI) — Spec Bundle Index

> **Scope:** LYC Intelligence platform only. WAVE and VISTA are separate products.
> **Total:** 22 spec files + 1 coverage analysis + SQL migration
> **GitHub Issues:** 38 tracked at [github.com/kevinhongfr-star/lyc-intelligence/issues](https://github.com/kevinhongfr-star/lyc-intelligence/issues)
> **Master Build Plan:** [DEX_AI_Master_Build_Plan.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/DEX_AI_Master_Build_Plan.md)
> **Repo:** `kevinhongfr-star/lyc-intelligence` / `main`

---

## Build Order for Trae

| Priority | Phase | Files | What |
|:--------:|:-----:|-------|------|
| 0 | **P0** | `17` | **Design System & Component Library** — build 17 base components first |
| 0 | **P0** | `18` | **Public Marketing Site** — homepage, pricing, features, FAQ, book demo |
| 0 | **P0** | `18` | **User Activation Flows** — first-run experience per portal |
| 1 | **P1** | `02` | Backend architecture — **run migration first** (57 tables) |
| 2 | **P1** | `14` | Legal pages (Terms, Privacy, Cookie Policy) |
| 3 | **P1** | `15` | First-time user onboarding flows |
| 4 | **P1** | `19` | Email templates + Admin console + Analytics |
| 5 | **P2** | `03` | UX/behavioral patterns (shared across all portals) |
| 6 | **P2** | `08` | Commerce layer (pricing, credits, Stripe) |
| 7 | **P2** | `06` | Intelligence layer (data backbone) |
| 8 | **P2** | `05` + `05b` + `05c` | Council Portal + DEX AI B2C integration |
| 9 | **P2** | `09` | SHIFT Composite Data Model |
| 10 | **P2.5** | `10` | Online Diagnostic Assessment Engine |
| 11 | **P2.5** | `11` | Cohort Analytics Dashboard |
| 12 | **P2.5** | `18` | Conversion UX + Data Export |
| 13 | **P3** | `07` | Candidate Portal v2.1 |
| 14 | **P3** | `04` | Client Portal |
| 15 | **P3** | `12` | Academy LMS (complete) |
| 16 | **P4** | `01` | Internal/Consultant Portal |
| 17 | **P4** | `16` | Performance, Accessibility & Polish |
| 18 | **P5** | `13` | Intelligence Reports (auto-generation) |
| 19 | **P5** | Council Monthly Briefing + APAC Quarterly Report | Signal Council + APAC reports |
| 20 | **P6** | Technical Debt Backlog | Ongoing |
| GL | — | CI/CD, Custom Domain, Error Monitoring, Load Testing, Backup | Go-live checklist |

---

## All Files — GitHub Links

### Registry & Planning
| File | Description |
|------|-------------|
| [00_Master_Ticket_Registry.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/00_Master_Ticket_Registry.md) | Master ticket index (~690 tickets) |
| [specs_index.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/specs_index.md) | This file — spec bundle index |
| [SPEC_COVERAGE_ANALYSIS.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/SPEC_COVERAGE_ANALYSIS.md) | Detailed coverage analysis of all 21 specs |

### Portal Specs
| File | Description | Size |
|------|-------------|------|
| [01_Internal_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/01_Internal_Portal_Spec.md) | Internal/Consultant Portal | ~10K |
| [04_Client_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/04_Client_Portal_Spec.md) | Client/Company Portal | ~12K |
| [05_The_Council_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md) | Council Portal + DEX AI B2C | ~25K |
| [05b_Council_v2_Addendum.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05b_Council_v2_Addendum.md) | Council v2.1 Addendum | ~15K |
| [05c_Council_v2_Backend_Wiring.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05c_Council_v2_Backend_Wiring.md) | Council v2 Backend Wiring | ~12K |
| [07_Candidate_Portal_Spec_v2.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/07_Candidate_Portal_Spec_v2.md) | Candidate Portal v2.1 | ~17K |

### Cross-Cutting Specs
| File | Description | Size |
|------|-------------|------|
| [02_Supabase_Backend_Architecture.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) | Backend architecture, auth, RLS, schema | ~30K |
| [03_UX_Behavioral_Mechanics.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/03_UX_Behavioral_Mechanics.md) | UX patterns, state machines, notification logic | ~20K |
| [06_Intelligence_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/06_Intelligence_Layer_Spec.md) | Intelligence layer (data backbone) | ~15K |
| [08_Commerce_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/08_Commerce_Layer_Spec.md) | Commerce layer, pricing, credits, Stripe | ~20K |
| [09_SHIFT_Composite_Data_Model_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/09_SHIFT_Composite_Data_Model_Spec.md) | SHIFT composite assessment data model | ~15K |
| [10_Assessment_Engine_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/10_Assessment_Engine_Spec.md) | Online Diagnostic Assessment Engine | ~20K |
| [11_Cohort_Analytics_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/11_Cohort_Analytics_Spec.md) | Cohort Analytics Dashboard | ~15K |
| [12_Academy_LMS_Complete_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/12_Academy_LMS_Complete_Spec.md) | Academy LMS (complete) | ~8K |
| [13_Intelligence_Reports_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/13_Intelligence_Reports_Spec.md) | Intelligence Reports (auto-generation) | ~12K |

### UX & Design
| File | Description | Size |
|------|-------------|------|
| [14_Legal_Pages_Compliance_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/14_Legal_Pages_Compliance_Spec.md) | Legal pages (Terms, Privacy, Cookie Policy) | ~8K |
| [15_First_Time_Onboarding_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/15_First_Time_Onboarding_Spec.md) | First-time user onboarding flows | ~10K |
| [16_Portal_Product_Design_Gap_Analysis.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/16_Portal_Product_Design_Gap_Analysis.md) | Portal product design gap analysis (50+ gaps) | ~15K |
| [17_Design_System_Component_Library_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/17_Design_System_Component_Library_Spec.md) | **P0** — Design system (17 components, patterns, accessibility) | ~13K |
| [18_Public_Site_And_Activation_Flows_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/18_Public_Site_And_Activation_Flows_Spec.md) | **P0** — Public marketing site + activation flows + conversion UX + data export | ~40K |
| [19_Email_Admin_Analytics_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/19_Email_Admin_Analytics_Spec.md) | Email templates + Admin console + Analytics & event tracking | ~45K |

### Database Migration
| File | Description |
|------|-------------|
| [master_migration.sql](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/master_migration.sql) | 57 tables (DEX AI + Commerce + shared infra) — **run first** |

---

## Key References

| Item | Detail |
|------|--------|
| Supabase URL | `https://rnnlteyqmtxkzllbohuu.supabase.co` |
| GitHub Repo | `https://github.com/kevinhongfr-star/lyc-intelligence` |
| GitHub Issues | [38 open issues](https://github.com/kevinhongfr-star/lyc-intelligence/issues) |
| Master Build Plan | [v3.1](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/DEX_AI_Master_Build_Plan.md) |
| Vercel Deploy | `lyc-intelligence-jrzvferaj-kevinhongfr-stars-projects.vercel.app` |
| Scope | LYC Intelligence (DEX AI) only |
| Excluded | WAVE (marketing/content), VISTA (customer success) |

---

*Updated 2026-07-18 — 22 spec files + 1 coverage analysis + SQL migration*
