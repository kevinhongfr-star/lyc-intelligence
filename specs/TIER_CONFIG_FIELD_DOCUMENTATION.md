# Tier Config Field Documentation — Batch 1.5 Handoff

**Status:** Reference (not spec). The Tier Feature Matrix v4.1 remains the source of truth.
**Purpose:** Documents what is actually implemented in the Batch 1.5 tier config today, so
downstream batches (2A, 2B, 3, 5) know what fields exist, which have real values, which are
placeholders, and which batch will modify or extend each field.

**Primary config files:**
- `src/config/tiers.ts` — canonical 5-tier system (explorer/starter/professional/executive/council)
- `src/config/tierConfig.ts` — legacy tier config (executive_introduction/professional/executive/council/enterprise)
- `src/services/monetizationService.ts` — pricing surface source of truth (`CANONICAL_TIER_PRICING`)
- `src/config/miles.ts` — mile economy constants (allocation, rollover, costs)

---

## Field-by-field inventory

Legend:
- **Real** = has production-grade values, safe to rely on
- **Placeholder** = field exists but value is stub/template, needs real data before launch
- **Missing** = field does not exist yet, downstream batch adds it

### Identity & ordering

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `tier_key` | `tiers.ts` `TIER_KEYS` | Real | Canonical IDs: explorer/starter/professional/executive/council. Never user-facing. |
| `display_name` | `tiers.ts` `TierMeta.displayName` | Real | Auto-capitalized from key. Override-able per Emily. |
| `order` | `tiers.ts` `TierMeta.order` | Real | 1–5, lowest → highest. Drives inheritance + hierarchy. |
| `isEntryTier` | `tiers.ts` `TierMeta.isEntryTier` | Real | true only for explorer. |
| `isB2B` | `tiers.ts` `TierMeta.isB2B` | Real | false for all 5 (legacy `tierConfig.ts` marks enterprise = true). |
| `isInviteOnly` | `tiers.ts` `TierMeta.isInviteOnly` | Real (Batch 1.5 Corrective) | Council = true, all others = false. Drives pricing card badge + checkout gate. |

### Pricing

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `monthly_price` (USD) | `tiers.ts` `TIER_PRICING.usdMonthly` / `monetizationService.ts` `CANONICAL_TIER_PRICING.usdMonthly` | Real | Explorer=0, Starter=25, Pro=99, Executive=199, Council=499. |
| `monthly_price` (CNY) | `tiers.ts` `TIER_PRICING.cnyMonthly` / `monetizationService.ts` `cnyMonthly` | Real | ~1/3 of USD, rounded. Explorer=0. |
| `annual_price` | `tiers.ts` `computeTierPrice()` (computed) | Real | Computed: monthly × 12 × (1 − annual_discount_pct). Not stored as a constant. |
| `annual_discount_pct` | `tiers.ts` `ANNUAL_DISCOUNT_PERCENT` | Real | 15%. Batch 3 may revise. |

### NEXUS chat limits

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `messages_per_day` | `tiers.ts` `TierFeatures.nexusDailyMessages` | Real | Explorer=20, Starter=50, Pro+=null (unlimited). null = unlimited. |
| `nexus_nudge_at` | `tiers.ts` `TierFeatures.nexusNudgeAt` | Real | Explorer=15, Starter=null (no nudge). Soft nudge before cap. |
| `nexus_priority` | `tiers.ts` `TierFeatures.nexusPriority` | Real | Executive+ = true. |
| `memory_days` | — | **Missing** | Not yet in config. Batch 2A (memory system) adds per-tier memory retention window. |

### Persona & document access

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `persona_access` | `src/config/nexusPersonas.ts` `Persona.minTier` | Real (Batch 2B) | Per-persona minTier field gates which personas each tier unlocks. Guide=explorer, Analyst=starter, Architect=professional, Steward=executive, Custom=council. |
| `doc_upload_limit_mb` | — | **Missing** | Not yet in config. Batch 2B/5 adds per-tier document upload limit. Spec: Explorer=0, higher tiers get rolling 30-day window. |

### Mile economy

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `mile_allocation` | `tiers.ts` `TierFeatures.monthlyMiles` + `miles.ts` `MONTHLY_ALLOCATION` | Real | Explorer=0, Starter=2, Pro=5, Executive=10, Council=20. **Note:** `monetizationService.ts` has different values (50/150/300/600) — that file is the marketing-surface source and is being reconciled in Batch 3. `tiers.ts` + `miles.ts` are the canonical engine values. |
| `rollover_rate` | `miles.ts` `ROLLOVER_PERCENT` | Real | 50% of unused monthly miles roll over. Flat across tiers. |
| `rollover_max_months` | `miles.ts` `ROLLOVER_MAX_MONTHS` | Real | 3 months max accumulation. Flat across tiers. |
| `earns_miles` | `tiers.ts` `TierFeatures.earnsMiles` | Real | Explorer=false, Starter+=true. |

### Sessions & discounts

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `session_discount_pct` | — | **Missing** | Not yet in config. Batch 3 adds per-tier discount on paid sessions/consultations. |
| `free_sessions_per_month` | — | **Missing** | Not yet in config. Batch 3/5 adds per-tier complimentary session allowance. |

### Assessment access

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `assessment_baselines` | `tiers.ts` `TierFeatures.assessmentBaselines` | Real | Explorer=1, Starter=3, Pro=11 (full catalog). |
| `assessment_unlimited_retakes` | `tiers.ts` `TierFeatures.assessmentUnlimitedRetakes` | Real | Pro+ = true. |
| `branded_pdf_reports` | `tiers.ts` `TierFeatures.brandedPdfReports` | Real | Pro+ = true. |
| `advanced_insights` | `tiers.ts` `TierFeatures.advancedInsights` | Real | Pro+ = true. |
| `peer_benchmarking` | `tiers.ts` `TierFeatures.peerBenchmarking` | Real | Pro+ = true. |

### Community & support

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `council_community` | `tiers.ts` `TierFeatures.councilCommunity` | Real | Council = true. |
| `executive_workshops` | `tiers.ts` `TierFeatures.executiveWorkshops` | Real | Executive+ = true. |
| `priority_support` | `tiers.ts` `TierFeatures.prioritySupport` | Real | Pro+ = true. |
| `dedicated_contact` | `tiers.ts` `TierFeatures.dedicatedContact` | Real | Council = true. |

### Marketing surface (legacy `tierConfig.ts` + `monetizationService.ts`)

| Field | Location | Status | Notes |
|-------|----------|--------|-------|
| `tagline` | `tiers.ts` `TierMeta.tagline` | **Placeholder** | `[${key} tier tagline — placeholder]`. Batch 3 fills real copy. |
| `benefits` (marketing) | `monetizationService.ts` `CanonicalTierPricing.benefits` | Real | Headline benefit copy per tier. |
| `HIDDEN_TIERS` | `tierConfig.ts` | Real | council + enterprise hidden from self-serve marketing. |
| `MARKETING_TIERS` | `tierConfig.ts` | Real | 3 tiers shown on marketing grid. |
| `RECOMMENDED_TIER` | `tiers.ts` + `monetizationService.ts` | Real | professional / pro. |

---

## Downstream batch impact map

| Batch | What it touches |
|-------|-----------------|
| **2A** (Memory & Context) | Adds `memory_days` field. Per-tier retention window for NEXUS conversation memory. |
| **2B** (Chat Quality) | Adds `persona_access` enforcement (already stubbed via `Persona.minTier`). Adds `doc_upload_limit_mb`. Voice/quality constants live in `voiceStandard.ts`, not tier config. |
| **3** (Pricing Structure) | Reconciles `tiers.ts` monthlyMiles vs `monetizationService.ts` monthlyMiles (currently divergent). Fills `tagline` placeholders. Adds `session_discount_pct` + `free_sessions_per_month`. May revise `annual_discount_pct`. |
| **5** (Council/Enterprise) | Extends Council-specific features. May add `is_invite_only` flow details (invite token redemption, sales handoff). Enterprise/B2B seat-based config. |

---

## Handoff notes

### What's solid (safe to build on)
- 5 canonical tier keys + hierarchy + inheritance (`resolveTierFeatures`) — stable.
- `isInviteOnly` field + `isSelfServeUpgradeAllowed()` gate — Batch 1.5 Corrective, ready.
- Pricing constants in `tiers.ts` (USD/CNY monthly + annual computation) — real values.
- Mile allocation in `miles.ts` (`MONTHLY_ALLOCATION`) — canonical engine values.
- All boolean feature flags in `TierFeatures` — real, with inheritance applied.

### What's still placeholder
- `TierMeta.tagline` — `[${key} tier tagline — placeholder]`, Batch 3 fills.
- `monetizationService.ts` mile values (50/150/300/600) diverge from `tiers.ts`/`miles.ts` (2/5/10/20). Batch 3 reconciles. Until then, engine code reads `miles.ts`; marketing reads `monetizationService.ts`.

### What's missing (downstream adds)
- `memory_days` — Batch 2A.
- `doc_upload_limit_mb` — Batch 2B.
- `session_discount_pct`, `free_sessions_per_month` — Batch 3.

### Known divergence to reconcile in Batch 3
`monetizationService.ts` is a parallel pricing source with different mile numbers and tier key mapping (executive key → Council display, council key → Enterprise). `tiers.ts` is the canonical engine. Batch 3 should consolidate to a single source. Until then:
- **Engine/gating code:** import from `tiers.ts` + `miles.ts`.
- **Marketing/pricing UI:** import from `monetizationService.ts`.

---

*Source of truth: Tier Feature Matrix v4.1. This document reflects what is built, not what is specified.*
