# 00 — Master Ticket Registry
## LYC Intelligence Platform v2.0 — Complete Ticket Index

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM)  
**Scope:** All tickets across all specs — single source of truth  
**Note:** WAVE and VISTA are OUT OF SCOPE (separate products)

---

## Summary

| Spec | Name | Tickets |
|------|------|:-------:|
| [01](./01_Internal_Portal_Spec.md) | Internal Portal (Consultants) | ~73 |
| [02](./02_Supabase_Backend_Architecture.md) | Supabase Backend | ~132 |
| [03](./03_UX_Behavioral_Mechanics.md) | UX & Behavioral Mechanics | ~50 |
| [04](./04_Client_Portal_Spec.md) | Client Portal (Companies) | ~67 |
| [05](./05_The_Council_Portal_Spec.md) | Council Portal + DEX AI B2C | ~112 |
| [05b](./05b_The_Council_Portal_Spec_v2_Addendum.md) | Council v2.1 Addendum | ~45 |
| [05c](./05c_The_Council_v2_Backend_Wiring.md) | Council Backend Wiring | ~27 |
| [06](./06_Intelligence_Layer_Spec.md) | Intelligence Layer | ~44 |
| [07](./07_Candidate_Portal_Spec_v2.md) | Candidate Portal v2.1 | ~68 |
| [08](./08_Commerce_Layer_Spec.md) | Commerce Layer v2.0 | ~72 |
| | **TOTAL** | **~690** |

---

## Build Priority

### Phase 1: Foundation (Week 1-2)
- 02: Supabase Backend + master_migration.sql
- 03: UX patterns & design system
- 08: Commerce Layer (pricing, credits, Stripe)

### Phase 2: Core Portals (Week 3-5)
- 05 + 05b + 05c: Council Portal + DEX AI B2C
- 06: Intelligence Layer
- 01: Internal Portal

### Phase 3: Extended (Week 6-7)
- 04: Client Portal
- 07: Candidate Portal

### Phase 4: Polish (Week 8)
- Cross-portal integration testing
- Performance optimization
- Accessibility audit
- i18n completion

---

## Database

**Migration:** `master_migration.sql` (57 tables)  
**Execution:** Supabase SQL Editor  
**RLS:** Enable after migration (separate step)

---

## Quick Reference

| Portal | Route Prefix | Auth |
|--------|-------------|------|
| Internal | `/app/` | Consultant+ |
| Client | `/client/` | Client user+ |
| Council | `/council/` | Member (or public landing) |
| DEX AI | `/dex/` | Auth (any user) |
| Candidate | `/candidates/` | Auth (applicant+) |
| Admin | `/admin/` | Super admin |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13
