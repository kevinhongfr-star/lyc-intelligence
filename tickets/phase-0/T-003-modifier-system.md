# T-003: Modifier System (Per-Instrument)

**Phase:** 0 | **Batch:** 0A | **Effort:** 0.5 day
**CD Source:** CD16 (Assessment Platform)
**Depends On:** T-001, T-002
**Blocks:** T-113 (result page needs modifiers)

---

## What to Build

Modifiers are additional calculated fields that appear on the gated result page. They provide context-specific adjustments to the archetype reading (e.g., "your APAC credibility gap" or "your AI readiness score").

## Modifier Definitions

| Modifier | Instruments | Description |
|---|---|---|
| `ai_readiness` | SPARK, QUEST | How ready the person is for AI transformation |
| `engagement_risk` | DRIVE | Risk of disengagement/burnout |
| `apac_credibility` | BRIDGE, PRISM | How well the person's style translates across APAC cultures |
| `apac_legibility_gap` | BRIDGE, PRISM | Gap between intent and perception in APAC context |
| `three_fires` | BRIDGE | Three Fires (speed, quality, cost) tension readout |
| `team_gap` | QUEST, IMPACT | Gap between individual and team capability |
| `revenue_scale` | FORGE | Revenue scaling readiness indicator |
| `apac_geopolitical` | MOSAIC, BRIDGE | Geopolitical sensitivity awareness score |

## Implementation

Each modifier is a calculated value (0-100 or categorical) derived from the dimension scores. The modifier calculation function takes the full assessment result and returns the applicable modifiers for that instrument.

```typescript
function calculateModifiers(
  instrument_id: string,
  dimension_scores: DimensionScores
): Record<string, number | string> {
  // Return only modifiers applicable to this instrument
}
```

## Acceptance Criteria

- [ ] Each instrument returns only its applicable modifiers
- [ ] Modifier values are deterministic
- [ ] Modifier calculation covered by unit tests
- [ ] Modifiers integrate into the full AssessmentResult response (T-001)

## Technical Notes

- Modifier formulas defined in CD16 — read that document for exact calculation logic
- Some modifiers may require external data (e.g., team composition) — for now, calculate from assessment data only and flag "needs manual input" for missing data
