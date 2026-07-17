# 09 — SHIFT Composite Data Model Spec

**Version:** 1.0 | **Phase:** 2.5 | **Author:** NEXUS | **Status:** Ready for Implementation

---

## 1. Overview

The SHIFT Composite is LYC's proprietary diagnostic intelligence system. This spec defines the data model for storing, scoring, and aggregating diagnostic assessment data across 5 instruments and APAC Translation scoring.

### SHIFT = 5 Instruments
| Letter | Code | Instrument | Focus |
|--------|------|-----------|-------|
| S | LEAP | Leadership Archetype & Engagement Profile | Leadership identity, engagement drivers |
| H | QUEST | Executive Capability & AI Readiness | Skills assessment, AI adoption readiness |
| I | COACH | Leadership Style & APAC Style IQ | Behavioral style, cross-cultural effectiveness |
| F | DRIVE | Motivation Architecture | Intrinsic/extrinsic drivers, goal orientation |
| T | IMPACT | Board Effectiveness | Team dynamics, governance effectiveness |

### Data Flow
```
Assessment UI → Response Storage → Scoring Engine → Composite Scores
                                                        ↓
                                              APAC Translation Layer
                                                        ↓
                                              Cohort Aggregation
                                                        ↓
                                        Intelligence Reports (Phase 5)
```

---

## 2. Database Schema (11 Tables)

### 2.1 v2_shift_instruments
```sql
CREATE TABLE v2_shift_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,  -- LEAP, QUEST, COACH, DRIVE, IMPACT
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    shift_letter CHAR(1) NOT NULL,
    description TEXT,
    min_score DECIMAL(5,2) DEFAULT 0,
    max_score DECIMAL(5,2) DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 v2_shift_dimensions
Sub-dimensions within each instrument (3-6 per instrument).
```sql
CREATE TABLE v2_shift_dimensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID REFERENCES v2_shift_instruments(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 v2_shift_questions
```sql
CREATE TABLE v2_shift_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instrument_id UUID REFERENCES v2_shift_instruments(id),
    dimension_id UUID REFERENCES v2_shift_dimensions(id),
    question_text TEXT NOT NULL,
    question_text_zh TEXT,
    question_type VARCHAR(20) DEFAULT 'likert_5',
    is_reverse_scored BOOLEAN DEFAULT false,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 v2_shift_assessments
One person taking one or more instruments.
```sql
CREATE TABLE v2_shift_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES v2_user_profiles(id),
    organization_id UUID REFERENCES v2_organizations(id),
    assessment_type VARCHAR(30) NOT NULL,  -- self, manager_360, peer_360, team
    instruments JSONB NOT NULL,  -- ["LEAP","QUEST"]
    status VARCHAR(20) DEFAULT 'draft',  -- draft, in_progress, completed, expired
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    language VARCHAR(10) DEFAULT 'en',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 v2_shift_responses
```sql
CREATE TABLE v2_shift_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES v2_shift_assessments(id),
    question_id UUID REFERENCES v2_shift_questions(id),
    response_value DECIMAL(5,2),
    response_text TEXT,
    time_spent_ms INTEGER,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, question_id)
);
```

### 2.6 v2_shift_scores
Computed per dimension and per instrument.
```sql
CREATE TABLE v2_shift_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES v2_shift_assessments(id),
    instrument_id UUID REFERENCES v2_shift_instruments(id),
    dimension_id UUID REFERENCES v2_shift_dimensions(id),
    raw_score DECIMAL(5,2),
    normalized_score DECIMAL(5,2) NOT NULL,  -- 0-100
    percentile DECIMAL(5,2),
    confidence_interval JSONB,
    score_level VARCHAR(20),  -- instrument | dimension
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, instrument_id, dimension_id)
);
```

### 2.7 v2_shift_composite_scores
Overall SHIFT Composite per assessment.
```sql
CREATE TABLE v2_shift_composite_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES v2_shift_assessments(id) UNIQUE,
    composite_score DECIMAL(5,2) NOT NULL,
    composite_percentile DECIMAL(5,2),
    instrument_scores JSONB NOT NULL,
    engagement_risk VARCHAR(20),  -- low, medium, high, critical
    top_strength VARCHAR(20),
    development_area VARCHAR(20),
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.8 v2_apac_translation_scores
Cross-cultural effectiveness across 5 APAC sub-regions.
```sql
CREATE TABLE v2_apac_translation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES v2_shift_assessments(id),
    sub_region VARCHAR(30) NOT NULL,  -- greater_china, sea, japan_korea, anz, india
    translation_score DECIMAL(5,2) NOT NULL,
    cultural_iq DECIMAL(5,2),
    adaptation_index DECIMAL(5,2),
    communication_effectiveness DECIMAL(5,2),
    context_sensitivity DECIMAL(5,2),
    computed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, sub_region)
);
```

### 2.9 v2_shift_cohorts
```sql
CREATE TABLE v2_shift_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES v2_organizations(id),
    cohort_type VARCHAR(30) NOT NULL,  -- organizational, program, custom
    criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.10 v2_shift_cohort_memberships
```sql
CREATE TABLE v2_shift_cohort_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id UUID REFERENCES v2_shift_cohorts(id),
    assessment_id UUID REFERENCES v2_shift_assessments(id),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cohort_id, assessment_id)
);
```

### 2.11 v2_shift_benchmarks
Population benchmark data for percentile calculations.
```sql
CREATE TABLE v2_shift_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_set VARCHAR(50) NOT NULL,
    instrument_id UUID REFERENCES v2_shift_instruments(id),
    dimension_id UUID REFERENCES v2_shift_dimensions(id),
    mean_score DECIMAL(5,2),
    std_dev DECIMAL(5,2),
    sample_size INTEGER,
    percentile_25 DECIMAL(5,2),
    percentile_50 DECIMAL(5,2),
    percentile_75 DECIMAL(5,2),
    percentile_90 DECIMAL(5,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(benchmark_set, instrument_id, dimension_id)
);
```

---

## 3. Scoring Engine

### 3.1 Composite Calculation
```
dimension_score = Σ(normalized_question_scores × weight) / Σ(weight)
instrument_score = Σ(dimension_scores) / N_dimensions
SHIFT_Composite = Σ(instrument_scores) / N_instruments_completed
normalized = (raw - min_possible) / (max_possible - min_possible) × 100
reverse_scored → normalized = 100 - normalized
```

### 3.2 Engagement Risk
| Composite | Risk |
|-----------|------|
| 80-100 | Low |
| 60-79 | Medium |
| 40-59 | High |
| 0-39 | Critical |

### 3.3 Percentile (vs benchmark)
```
percentile = norm_cdf((score - benchmark.mean) / benchmark.std_dev) × 100
```

---

## 4. RLS Policies

- Reference tables (instruments, dimensions, questions, benchmarks): readable by all authenticated
- Assessment/score data: users see own; org admins/consultants see their org's
- Cohorts: org-scoped; admins and consultants have access
- Write: authenticated users create own assessments and responses

---

## 5. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/shift/instruments | List instruments + dimensions |
| POST | /api/shift/assessments | Start assessment session |
| GET | /api/shift/assessments/:id | Get status + progress |
| POST | /api/shift/assessments/:id/respond | Submit responses (batch) |
| POST | /api/shift/assessments/:id/complete | Finalize + trigger scoring |
| GET | /api/shift/assessments/:id/scores | Computed results |
| GET | /api/shift/cohorts/:id/analytics | Cohort aggregate |

---

## 6. Exit Criteria
- [ ] All 11 tables created with RLS
- [ ] 5 instruments + sample dimensions seeded
- [ ] Assessment CRUD end-to-end
- [ ] Scoring engine computes composite correctly
- [ ] APAC Translation scores stored per sub-region
- [ ] Cohort membership + aggregation functional
