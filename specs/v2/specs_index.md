# LYC Intelligence (DEX AI) — Spec Bundle Index

> **Scope:** LYC Intelligence platform only. WAVE and VISTA are separate products.
> **Total:** ~690 tickets | ~5,500 lines | 12 files
> **Repo:** `kevinhongfr-star/lyc-intelligence` / `main`

---

## Build Order for Trae

| Priority | File | What |
|:--------:|------|------|
| 1 | `02` | Backend architecture — **run migration first** |
| 2 | `03` | UX/behavioral patterns (shared across all portals) |
| 3 | `08` | Commerce layer (pricing, credits, Stripe) |
| 4 | `06` | Intelligence layer (data backbone) |
| 5 | `05` + `05b` + `05c` | Council Portal + DEX AI B2C integration |
| 6 | `07` | Candidate Portal |
| 7 | `04` | Client Portal |
| 8 | `01` | Internal Portal |

---

## All Files — GitHub Links

### Registry
- [00_Master_Ticket_Registry.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/00_Master_Ticket_Registry.md) — Master ticket index (~690 tickets)

### Portal Specs
- [01_Internal_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/01_Internal_Portal_Spec.md) — Internal/Consultant Portal (~73 tickets)
- [04_Client_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/04_Client_Portal_Spec.md) — Client/Company Portal (~67 tickets)
- [05_The_Council_Portal_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05_The_Council_Portal_Spec.md) — Council Portal + DEX AI B2C (~112 tickets)
- [05b_Council_v2_Addendum.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05b_Council_v2_Addendum.md) — Council v2.1 Addendum (~45 tickets)
- [05c_Backend_Wiring.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/05c_Backend_Wiring.md) — Council v2 Backend Wiring (~27 tickets)
- [07_Candidate_Portal_Spec_v2.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/07_Candidate_Portal_Spec_v2.md) — Candidate Portal v2.1 (~68 tickets)

### Cross-Cutting Specs
- [02_Supabase_Backend_Architecture.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/02_Supabase_Backend_Architecture.md) — Backend architecture, auth, RLS, schema (~132 tickets)
- [03_UX_Behavioral_Mechanics.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/03_UX_Behavioral_Mechanics.md) — UX patterns, state machines, notification logic (~50 tickets)
- [06_Intelligence_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/06_Intelligence_Layer_Spec.md) — Intelligence layer (data backbone) (~44 tickets)
- [08_Commerce_Layer_Spec.md](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/08_Commerce_Layer_Spec.md) — Commerce layer, pricing, credits, Stripe (~72 tickets)

### Database Migration
- [master_migration.sql](https://github.com/kevinhongfr-star/lyc-intelligence/blob/main/specs/v2/master_migration.sql) — 57 tables (DEX AI + Commerce + shared infra)

---

## Key References

| Item | Detail |
|------|--------|
| Supabase URL | `https://rnnlteyqmtxkzllbohuu.supabase.co` |
| GitHub Repo | `https://github.com/kevinhongfr-star/lyc-intelligence` |
| Scope | LYC Intelligence (DEX AI) only |
| Excluded | WAVE (marketing/content), VISTA (customer success) |

---

*Generated 2026-07-13*
