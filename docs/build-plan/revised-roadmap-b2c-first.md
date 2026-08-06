# LYC Intelligence — Revised Roadmap (B2C-First)

| Field | Value |
|---|---|
| **Version** | v2.1 (Phase 10 expanded) |
| **Status** | Draft |
| **Total Phases** | 13 |
| **Strategy** | B2C-first — launch NEXUS assessment product to individual professionals, then expand to B2B client portal |
| **Full Go-Live Gate** | After Phase 10 (Hardening & Go-Live) |
| **Owner** | Product / Engineering Lead |
| **Last Updated** | 2026-08-06 |

---

## Roadmap Overview

This roadmap defines 13 phases from zero to production-ready platform. Phase 10 is the **Full Go-Live Gate** — before this gate, the product is in development/staging; after it, we are live to real users with a paid offering. Phases 11–13 are post-launch expansion phases.

The B2C-first strategy means we validate the core product (NEXUS assessments, candidate profiles, career intelligence) with individual paying users before investing heavily in enterprise client infrastructure. The client portal (Phase 8) and recruiter automation (Phase 9) are built in parallel but gated behind the same production go-live.

---

## Phase Summary Table

| # | Phase Name | Duration | Est. Tickets | Est. Effort | Priority | Status | Go-Live Gate? |
|---|---|---|---|---|---|---|---|
| Phase 1 | Foundation & Core Architecture | 3–4 weeks | ~20 | ~120h | P0 | Done | — |
| Phase 2 | NEXUS Assessment Engine | 4–5 weeks | ~25 | ~180h | P0 | Done | — |
| Phase 3 | Portal Shells & Design System | 3–4 weeks | ~18 | ~130h | P0 | Done | — |
| Phase 4 | Internal Admin Portal | 4–5 weeks | ~22 | ~160h | P0 | Done | — |
| Phase 5 | NLP / CV Parsing & Matching | 4–6 weeks | ~24 | ~180h | P1 | In progress | — |
| Phase 6 | B2C Candidate Portal (v1) | 4–5 weeks | ~20 | ~150h | P0 | Planned | — |
| Phase 7 | Document Sharing & Deliverables | 3–4 weeks | ~16 | ~120h | P1 | Planned | — |
| Phase 7.5 | Coaching Excellence Module | 2–3 weeks | ~12 | ~80h | P2 | Planned | — |
| Phase 8 | Client Portal | 3–4 weeks | ~17 | ~95h | P1 | Drafted | — |
| Phase 8.5 | Platform Capabilities | 2–3 weeks | ~14 | ~100h | P1 | Planned | — |
| Phase 9 | Candidate Portal & MARIA Outreach | 4–5 weeks | ~20 | ~180h | P1 | Drafted | — |
| **Phase 10** | **Hardening & Go-Live** | **4–5 weeks** | **42** | **~322h** | **P0** | **Drafted** | **🔴 Full Go-Live Gate** |
| Phase 11 | Post-Launch Growth & Iteration | 4–6 weeks | ~25 | ~180h | P1 | — | — |
| Phase 12 | Enterprise & Team Features | 4–6 weeks | ~28 | ~200h | P2 | — | — |
| Phase 13 | Marketplace & Referral Engine | 4–6 weeks | ~24 | ~180h | P2 | — | — |

> **Note:** Phase 10 was revised upward from 32 tickets / 3–4 weeks to 42 tickets / 4–5 weeks to reflect expanded scope: production infrastructure deepening (M7), multi-payment support, and full legal/compliance coverage (M8). The original 6 milestones and 32 tickets remain intact; 2 new milestones and 10 additional tickets were added.

---

## Phase Detail (Key Milestones)

### Phases 1–9 — Build (Pre-Launch)

These phases build the core product. Detailed specs exist for each phase in the `docs/build-plan/` directory.

| Phase | Key Deliverables |
|---|---|
| Phase 1 | Project scaffolding, Supabase setup, auth, design system foundation |
| Phase 2 | SHIFT / TRIDENT / TIDAL assessment engines, scoring algorithm, result reports |
| Phase 3 | Portal architecture, shared components, routing, state management |
| Phase 4 | Internal admin: candidate management, mandate tracking, pipeline dashboard |
| Phase 5 | CV parsing, AI matching, candidate-mandate scoring, NLP pipeline |
| Phase 6 | B2C portal: signup, profile, assessments, payment (Stripe v1), results sharing |
| Phase 7 | Document generation, PDF export, shareable links, deliverable templates |
| Phase 7.5 | Interview prep, career coaching modules, offer negotiation tools |
| Phase 8 | Client-facing portal: mandate tracking, candidate review, feedback, messaging |
| Phase 8.5 | Platform features: document upload, web research, notifications, billing v2 |
| Phase 9 | Candidate portal (expanded), MARIA outreach automation, multi-touch sequences |

### Phase 10 — Hardening & Go-Live (Full Go-Live Gate)

This is the most critical phase: we transition from development to production. **Nothing ships to real paying users before Phase 10 is complete.**

**8 milestones, 42 tickets, ~322 hours, 4–5 weeks**

| Milestone | Name | Tickets | Effort | Priority |
|---|---|---|---|---|
| M1 | Security Audit & Hardening | 6 | 62h | P0 |
| M2 | Performance Optimization | 6 | 54h | P1 |
| M3 | Monitoring & Observability | 5 | 28h | P1/P2 |
| M4 | Data Migration & Cutover | 4 | 28h | P0 |
| M5 | Production Infrastructure | 6 | 37h | P0/P1 |
| M6 | Go-Live Readiness & Launch | 5 | 19h | P0/P1 |
| M7 | Production Infrastructure & Domain | 5 | 40h | P0 |
| M8 | Payment Expansion & Legal Compliance | 5 | 54h | P0/P1 |

**Phase 10 Go-Live Gate criteria (all must pass):**
- 🔴 100% RLS coverage with test suite
- 🔴 0 Critical / 0 High pentest findings
- 🔴 Data migration validated (100% row count match)
- 🔴 Backup & restore verified
- 🔴 Stripe production account verified and live
- 🔴 Production domain verified (lyc-intelligence.app)
- 🔴 All legal/compliance docs live (Terms, Privacy, Refund, Cookie)
- 🔴 Go/no-go meeting sign-off from gatekeeper

### Phases 11–13 — Growth (Post-Launch)

These phases extend the product after go-live, based on real user data and feedback.

| Phase | Focus | Key Initiatives |
|---|---|---|
| Phase 11 | Post-Launch Growth & Iteration | Onboarding optimization, conversion funnel improvements, referral program v1, analytics dashboard, A/B testing framework, mobile responsiveness polish |
| Phase 12 | Enterprise & Team Features | Team seats & role-based access, SSO, custom branding for enterprise clients, advanced reporting, API access, SOC2 preparation |
| Phase 13 | Marketplace & Referral Engine | Candidate-to-role marketplace, recruiter marketplace, referral program v2 (commission-based), partner integrations (HRIS, ATS) |

---

## Timeline View (High-Level)

```
Month 1-2    Phase 1-2   Foundation + Assessment Engine
Month 3      Phase 3-4   Portal Shells + Admin Portal
Month 4-5    Phase 5-6   NLP/Matching + B2C Portal
Month 6      Phase 7-7.5 Documents + Coaching
Month 7      Phase 8-8.5 Client Portal + Platform Capabilities
Month 8      Phase 9     Candidate Portal + MARIA
Month 9-10   Phase 10    HARDENING & GO-LIVE (4-5 weeks) ← FULL GO-LIVE GATE
Month 11-12  Phase 11    Post-Launch Growth
Month 13-14  Phase 12    Enterprise Features
Month 15-16  Phase 13    Marketplace
```

---

## What Changed in v2.1 (Phase 10 Expansion)

**From v2.0 → v2.1:**

| Metric | v2.0 | v2.1 | Change |
|---|---|---|---|
| Phase 10 ticket count | 32 | 42 | +10 tickets |
| Phase 10 duration | 3–4 weeks | 4–5 weeks | +1 week |
| Phase 10 effort | 228h | 322h | +94h |
| Phase 10 milestones | 6 (M1–M6) | 8 (M1–M8) | +2 milestones |
| Total phases | 13 | 13 | No change |
| Go-Live Gate position | After Phase 10 | After Phase 10 | No change |
| Total estimated duration | ~9 months | ~9.5 months | +~2 weeks |

**New milestones added to Phase 10:**

- **M7 — Production Infrastructure & Domain** (5 tickets, P0): Production domain setup (lyc-intelligence.app subpath), Supabase production tier upgrade, transactional email infrastructure (Resend + SPF/DKIM/DMARC), production deployment pipeline (preview deploys, rollback), CDN & edge optimization.
- **M8 — Payment Expansion & Legal Compliance** (5 tickets, P0/P1): Multi-payment methods (Alipay, WeChat Pay via Stripe + PayPal), Stripe production go-live (verification, live mode testing), legal pages infrastructure (Terms, Privacy, Refund, Cookie — markdown-driven), compliance & consent system (GDPR + PIPL cookie consent, data subject requests), China-specific compliance (ICP placeholder, content review, payment regulatory notes).

**Why this expansion was needed:**
- Initial Phase 10 scoped infrastructure at a baseline level (domain + SSL + backups). A real paid product needs production-tier database, proper email deliverability, multiple payment methods, and full legal/compliance coverage.
- We cannot launch a paid product with only Stripe cards and a single privacy policy page. Multi-payment, full legal docs, and compliance infrastructure are all prerequisites for real revenue.
- Adding these to Phase 10 (rather than pushing to Phase 11) keeps the Full Go-Live Gate meaningful — after Phase 10, the product is *actually* production-ready for paid users in multiple markets.

---

## Risk & Mitigation Summary

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Phase 10 expansion delays launch by 1–2 weeks | High — pushes revenue date | M7 and M8 work can partially overlap with M5/M6; Stripe verification and email domain setup start early |
| R2 | Stripe production verification takes longer than expected | High — blocks paid launch | Start verification in first week of Phase 10; have all business docs ready |
| R3 | Alipay/WeChat Pay cross-border approval delayed | Medium — limits payment options | Launch with cards + PayPal; add Alipay/WeChat post-launch as Phase 11 item |
| R4 | Legal page final copy delayed by content team | Medium — could block go-live | Use approved placeholder copy at launch; content team can update via markdown without engineering |
| R5 | ICP filing not ready for China launch | Low — global site still works | Build placeholder structure; China optimization is Phase 11+ scope |

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-06 | Expand Phase 10 from 32→42 tickets (add M7 + M8) | Production payment, email, legal/compliance are go-live prerequisites, not post-launch nice-to-haves |
| 2026-08-06 | Keep total phases at 13 | The Go-Live Gate stays at Phase 10; no need to renumber post-launch phases |
| 2026-08-06 | Use Resend for transactional email | Strong deliverability, good developer experience, competitive pricing |
| 2026-08-06 | Production domain at lyc-intelligence.app (subpath, not subdomain) | Brand alignment; simpler DNS; Vercel supports path-based routing |

---

*End of Revised Roadmap (B2C-First) — v2.1*
