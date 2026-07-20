# T-111: New `/assess/forge` — FORGE Revenue Leadership Diagnostic

**Phase:** 1 | **Batch:** 1C | **Effort:** 0.5 day
**CD Source:** CD10, CD01
**Depends On:** T-101, T-001
**Blocks:** None

---

## What to Build

New page at `/assess/forge` — the FORGE Revenue Leadership diagnostic.

## 4 FORGE Archetypes × 3 Scale Tiers

- **Rainmaker** (Entry / Mid / Senior)
- **System Builder** (Entry / Mid / Senior)
- **Revenue Architect** (Entry / Mid / Senior)
- **Promoted Seller** (Entry / Mid / Senior)

Total: 12 possible results (4 archetypes × 3 tiers)

## Page Structure

Same base template as T-106 (QUEST). Key differences:
- FORGE has a **3-tier scale** (Entry/Mid/Senior) — the result shows BOTH archetype AND tier
- Result display: "You are a [Mid-Level] Revenue Architect"
- FORGE modifiers: `revenue_scale` is primary
- Archetype grid shows 4 cards, each with tier indicator

## Special Notes

- The tier system is unique to FORGE — no other instrument has it
- Make sure the result page clearly distinguishes archetype from tier
- Revenue-focused copy throughout

## Acceptance Criteria

- [ ] Same as T-106 template, adapted for FORGE
- [ ] 4 archetype cards with tier indicators
- [ ] Result shows both archetype name AND tier level
- [ ] Revenue scale modifier visible in gated report
- [ ] Mobile responsive
