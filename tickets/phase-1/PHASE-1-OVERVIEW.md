# Phase 1: Archetype Foundation

**CD Sources:** CD10 (Product/Brochure/Website), CD11 (Diagnostic Spec), CD01 (Blast Radius)
**Est. Effort:** 5 days
**Depends On:** Phase 0 (API + classification engine must be ready)
**Blocks:** Phase 2, Phase 3, Phase 5

---

## What This Phase Does

Establishes the archetype visual system and builds/updates all 9 diagnostic pages. This is the product repositioning — from "you get a score" to "you get a named archetype."

## Batches

| Batch | Tickets | Description | Must Complete Before |
|---|---|---|---|
| 1A | T-101 | Design system: 9 colors + 62 icons + 2 components | All other Phase 1 batches |
| 1B | T-102 to T-105 | Edit 4 existing pages with archetype content | Can run in parallel |
| 1C | T-106 to T-112 | Build 7 new diagnostic pages | Can run in parallel |
| 1D | T-113 | Gated result page template | After 1A (needs components) |

## Build Order

1. **First:** T-101 (design system) — everything else needs the colors and icons
2. **Then:** T-102 to T-112 (page builds) — can be parallelized
3. **Finally:** T-113 (result template) — needs design system components

## Key Context

- Each diagnostic instrument has both a **diagnostic version** (the assessment) AND an **archetype-enhanced version** (the result display). This is intentional — "dual identity" is by design.
- The free tier shows: archetype name + 1-paragraph description + instrument color + archetype icon
- The gated tier (email required) shows: full dimension radar chart, modifier readout, confidence indicator, core strength, key risk, development priorities (3 items), share button
- B2C courses are OUT OF SCOPE — handled on `lyc-intelligence.app`
