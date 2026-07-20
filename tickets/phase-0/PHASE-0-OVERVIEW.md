# Phase 0: Data Architecture

**CD Source:** CD16 (Assessment Platform)
**Est. Effort:** 2 days
**Depends On:** Nothing — this is the foundation
**Blocks:** All subsequent phases

---

## What This Phase Does

Builds the backend API layer that every diagnostic page, archetype result, and content feature depends on. No visual/website changes in this phase — it's pure backend + data model.

## Batches

| Batch | Tickets | Description |
|---|---|---|
| 0A | T-001, T-002, T-003 | Core API schema, classification engine, modifier system |

## Key Technical Decisions (from CD16)

- Deterministic classification: same scores → same archetype (always)
- Confidence scoring with "Transitional" flag for boundary cases
- Modifier system per instrument (AI Readiness, Engagement Risk, APAC Credibility, etc.)
- API returns structured JSON — frontend consumes for display

## Data Model (from CD16)

```typescript
interface AssessmentResult {
  instrument_id: string;
  dimension_scores: {
    [dimension_name: string]: {
      score: number;
      max: number;
      percentile: number;
    };
  };
  archetype: {
    name: string;
    category: string;
    description: string;
    core_strength: string;
    key_risk: string;
    development_priority: string[];
    confidence: number; // 0-1, <0.6 = "Transitional"
  };
  modifiers: {
    ai_readiness?: number;
    engagement_risk?: number;
    apac_credibility?: number;
    apac_legibility_gap?: number;
    three_fires?: number;
    team_gap?: number;
    revenue_scale?: number;
    apac_geopolitical?: number;
  };
}
```

## Acceptance Criteria for Phase 0

- [ ] All API endpoints documented and returning correct responses
- [ ] Classification engine produces deterministic results for all 62 archetypes
- [ ] Confidence scoring works with "Transitional" flag
- [ ] Modifier system returns correct modifiers per instrument
- [ ] Unit tests for classification logic (≥80% coverage)
- [ ] No frontend changes in this phase
