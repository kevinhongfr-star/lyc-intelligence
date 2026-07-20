# T-002: Deterministic Classification Engine

**Phase:** 0 | **Batch:** 0A | **Effort:** 1 day
**CD Source:** CD16 (Assessment Platform), CD11 (Diagnostic Spec Updates)
**Depends On:** T-001 (needs API structure to plug into)
**Blocks:** T-003, T-113, all Phase 1 diagnostic pages

---

## What to Build

The classification engine takes dimension scores and deterministically maps them to one of 62 named archetypes. Same input scores = same archetype output, always.

## Core Logic

```
Input: { instrument_id, dimension_scores: { dim1: score1, dim2: score2, ... } }
Output: { archetype_name, archetype_category, confidence, is_transitional }
```

### Classification Rules per Instrument

| Instrument | Archetypes | Classification Method |
|---|---|---|
| QUEST | 10 (Architect, Catalyst, Diplomat, Commander, Navigator, Strategist, Engine, Entrepreneur, Specialist, Seedling) | Dimension score pattern matching |
| DRIVE | 10 (Achiever, Craftsman, Champion, Explorer, Stalwart, Restless, Golden Handcuffs, Drifter, Burned-Out, Frozen Asset) | Dimension score pattern matching |
| IMPACT | 8 (Architect, Steward, Networker, Guardian, Visionary, Bridge-Builder, Nominee, Passenger) | Dimension score pattern matching |
| PRISM | 10 (Authority, Signal, Monument, Chameleon, Amplifier, Operator, Ghost, Mask, Static, Blank Page) | Dimension score pattern matching |
| BRIDGE | 6 (Envoy, Navigator, Chameleon, Anchor, Sprinter, Cultural Operator) | Dimension score pattern matching |
| MOSAIC | 4 (Cultural Catalyst, Expert, Leader, Tourist) | Dimension score pattern matching |
| FORGE | 4 × 3 tiers (Rainmaker, System Builder, Revenue Architect, Promoted Seller × Entry/Mid/Senior) | Score + scale tier |
| SPARK | 4 (AI Champion, Skeptical Director, Governance Bureaucrat, Disengaged Director) | Dimension score pattern matching |
| SHIFT | Composite (cross-instrument) | Aggregation from multiple instruments |

### Confidence Scoring

- Confidence = how strongly the scores map to one archetype vs. the nearest alternative
- Confidence ≥ 0.6 → clear archetype assignment
- Confidence < 0.6 → "Transitional" flag (show primary archetype + note about transitional status)
- Formula: `confidence = (primary_score - secondary_score) / primary_score`

## Reference Documents

- **CD16** (`../cd_docs/CD16_Assessment_Platform*`): Full classification algorithm spec
- **CD11** (`../cd_docs/CD11_Diagnostic_Spec_Updates*`): Per-instrument archetype classification rules
- **CD02-CD06** (Question Banks): Define the dimensions per instrument

## Acceptance Criteria

- [ ] Deterministic output for all 62 archetypes (same input → same output, always)
- [ ] Confidence scoring implemented with "Transitional" flag at < 0.6
- [ ] Classification logic covered by unit tests (each archetype reachable)
- [ ] SHIFT composite classification aggregates correctly from sub-instruments
- [ ] FORGE includes 3-tier scale classification (Entry/Mid/Senior)
- [ ] Edge cases handled: all-zeros, all-max, ties

## Technical Notes

- This is a pure function — no database calls, no side effects
- Should be easily testable with fixtures
- Performance: must classify in < 100ms
