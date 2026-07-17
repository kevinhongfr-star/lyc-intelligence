# 11 — Cohort Analytics & Aggregation Spec

**Version:** 1.0 | **Phase:** 2.5 | **Author:** NEXUS | **Status:** Ready for Implementation  
**Depends on:** 09_SHIFT_Composite_Data_Model_Spec

---

## 1. Overview

Cohort Analytics aggregates individual SHIFT Composite assessments into organization-level and program-level intelligence. Bridge between individual diagnostic data and intelligence reporting (Phase 5).

---

## 2. Analytics Dimensions

### 2.1 Cohort-Level Metrics
| Metric | Formula |
|--------|---------|
| Mean Composite | Σ(composite) / N |
| Score Distribution | Binned (0-20, 20-40, 40-60, 60-80, 80-100) |
| Std Deviation | σ(composite) |
| Instrument Radar | Mean per instrument |
| Engagement Risk % | Count per level / N × 100 |
| APAC Heatmap | Mean Translation per sub-region |
| Top Strength | MODE(top_strength) |
| Development Area | MODE(development_area) |
| Trend | Δ(composite) / Δ(time) |

### 2.2 Drill-Down
- By instrument, by dimension, by sub-region
- By time period (quarter-over-quarter)
- By role/level (C-suite, VP, Director)
- Side-by-side cohort comparison

---

## 3. Dashboard Layout

```
┌──────────────────────────────────────────────────┐
│  COHORT: Q3 2026 Executive Program (N=24)       │
│  Mean: 74.2 | Range: 52-91 | σ: 11.3           │
├─────────────────────┬────────────────────────────┤
│  DISTRIBUTION       │  INSTRUMENT RADAR          │
│  ▓▓                 │  LEAP: 76                  │
│  ▓▓▓▓  ▓▓           │  QUEST: 82  COACH: 71     │
│  ▓▓▓▓▓▓▓▓  ▓▓▓▓    │  DRIVE: 85  IMPACT: 74    │
│  0-20 ... 80-100    │                            │
├─────────────────────┴────────────────────────────┤
│  ENGAGEMENT RISK                                 │
│  🟢 Low 58% | 🟡 Med 29% | 🟠 High 8% | 🔴 4% │
├──────────────────────────────────────────────────┤
│  APAC TRANSLATION HEATMAP                        │
│  Greater China ████████ 78 | SEA ███████░ 72    │
│  Japan/Korea ██████░░ 65 | ANZ ███████░ 71      │
│  India ██████░░ 63                               │
├──────────────────────────────────────────────────┤
│  [Export PDF] [Export CSV] [Compare Cohorts]     │
└──────────────────────────────────────────────────┘
```

---

## 4. Aggregation Queries

```sql
-- Cohort composite aggregate
SELECT AVG(sc.composite_score) as mean,
       STDDEV(sc.composite_score) as std_dev,
       MIN(sc.composite_score) as min, MAX(sc.composite_score) as max
FROM v2_shift_cohort_memberships cm
JOIN v2_shift_composite_scores sc ON sc.assessment_id = cm.assessment_id
WHERE cm.cohort_id = $1;

-- Instrument-level
SELECT si.code, AVG(s.normalized_score) as mean, STDDEV(s.normalized_score)
FROM v2_shift_cohort_memberships cm
JOIN v2_shift_scores s ON s.assessment_id = cm.assessment_id
JOIN v2_shift_instruments si ON si.id = s.instrument_id
WHERE cm.cohort_id = $1 AND s.score_level = 'instrument'
GROUP BY si.code ORDER BY si.display_order;

-- APAC Translation
SELECT sub_region, AVG(translation_score), AVG(cultural_iq)
FROM v2_shift_cohort_memberships cm
JOIN v2_apac_translation_scores ats ON ats.assessment_id = cm.assessment_id
WHERE cm.cohort_id = $1
GROUP BY sub_region ORDER BY AVG DESC;
```

### Performance Targets
- Cohort aggregate (N=100): < 500ms
- Full dashboard: < 2s
- PDF export: < 5s

---

## 5. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/shift/cohorts/:id/analytics | Full payload |
| GET | /api/shift/cohorts/:id/analytics/instrument/:code | Drill-down |
| GET | /api/shift/cohorts/compare?ids=a,b,c | Side-by-side |
| GET | /api/shift/cohorts/:id/export?format=pdf\|csv | Export |

### Response Shape
```json
{
  "cohort": {"id": "...", "name": "Q3 2026", "size": 24},
  "composite": {"mean": 74.2, "std_dev": 11.3, "min": 52, "max": 91, "distribution": {...}},
  "instruments": [{"code": "LEAP", "mean": 76, "std_dev": 9.2}, ...],
  "engagement_risk": {"low": 58, "medium": 29, "high": 8, "critical": 4},
  "apac_translation": [{"sub_region": "greater_china", "mean": 78}, ...]
}
```

---

## 6. Export Formats

### PDF: Executive Summary + Distribution Chart + Radar + Heatmap + Risk + Recommendations
### CSV: One row per assessment + summary statistics row

---

## 7. Exit Criteria
- [ ] Dashboard renders all chart types
- [ ] Performance < 2s for N=100
- [ ] PDF + CSV export functional
- [ ] Comparison view (2-3 cohorts)
- [ ] APAC heatmap accurate
