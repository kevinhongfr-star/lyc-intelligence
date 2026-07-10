# LYC Intelligence — Phase 2 Tickets (P1)

**Version:** 1.0
**Date:** 2026-07-10
**Scope:** 45 features | 220-280h | Weeks 6-10
**Dependencies:** Phase 1 (T1-T6) must be complete
**Prerequisite:** All P0 core engine features operational

---

## Phase 2 Overview

| Ticket | Scope | Hours | Dependencies |
|--------|-------|-------|-------------|
| T7 | Revenue Forecast & Change Detection | 24-30h | T1, T2 |
| T8 | Team Capacity & Load Balancer | 16-22h | T1, T2 |
| T9 | Communication Engine | 30-38h | T1, T3 |
| T10 | Report Templates & Distribution | 20-26h | T5 |
| T11 | Agent Orchestration | 22-28h | T1 |
| T12 | Scoring Calibration & Intelligence | 16-22h | T1, T3 |
| T13 | DEX AI Advanced Infrastructure | 18-24h | T6 |
| T14 | Coaching Portal (5 P1 features) | 16-20h | T1, T6 |
| T15 | Candidate Portal (5 P1 features) | 14-18h | T1, T6 |
| T16 | Leader Portal (4 P1 features) | 12-16h | T1, T6, T7 |

**Parallel execution window:** T7/T8/T11/T12 can start Week 6. T9/T10 can start Week 6-7. T13 starts Week 7. T14/T15/T16 start Week 8.

---

## T7 — Revenue Forecast & Change Detection Engine

**Estimate:** 24-30h
**Dependencies:** T1 (Schema), T2 (Business Rules)
**Blocks:** T16 (Leader Portal)

### Scope

Revenue forecast engine (3 scenarios), change detection engine with narrative generation, 5-metric weekly aggregator, stage conversion rate calculator, cross-mandate benchmarks.

### 7.1 Revenue Forecast Engine

#### 7.1.1 New Table: `revenue_forecasts`
```sql
CREATE TABLE revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('month','quarter','year')),
  generated_at TIMESTAMPTZ DEFAULT now(),
  conservative_total NUMERIC DEFAULT 0,
  expected_total NUMERIC DEFAULT 0,
  optimistic_total NUMERIC DEFAULT 0,
  monthly_rollup JSONB DEFAULT '{}',
  confidence_level NUMERIC CHECK (confidence_level BETWEEN 0 AND 1),
  mandate_count INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(forecast_date, period)
);

CREATE TABLE revenue_forecast_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID NOT NULL REFERENCES revenue_forecasts(id) ON DELETE CASCADE,
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  scenario TEXT NOT NULL CHECK (scenario IN ('conservative','expected','optimistic')),
  fee_amount NUMERIC NOT NULL,
  probability NUMERIC NOT NULL CHECK (probability BETWEEN 0 AND 1),
  expected_month DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_rfd_forecast ON revenue_forecast_details(forecast_id);
```

#### 7.1.2 Forecast Algorithm
```python
STAGE_PROBABILITY = {
    'offer': 0.85,
    'interview': 0.45,
    'shortlist': 0.25,
    'screening': 0.12,
    'sourcing': 0.05,
    'kick_off': 0.02,
    'not_started': 0.01
}

SCENARIO_WEIGHTS = {
    'conservative': 0.6,
    'expected': 1.0,
    'optimistic': 1.3
}

def generate_revenue_forecast(period='quarter'):
    mandates = get_active_mandates_in_pipeline()
    forecast = {'scenarios': {'conservative': [], 'expected': [], 'optimistic': []}}
    
    for mandate in mandates:
        fee = calculate_expected_fee(mandate)
        stage_prob = STAGE_PROBABILITY.get(mandate.status, 0.01)
        adjusted_probability = stage_prob  # Can be enhanced with historical data
        
        for scenario, weight in SCENARIO_WEIGHTS.items():
            amount = round(fee * adjusted_probability * weight)
            forecast['scenarios'][scenario].append({
                'mandate_id': mandate.id,
                'position_title': mandate.position_title,
                'org_name': mandate.org.name,
                'consultant_name': mandate.consultant.name,
                'amount': amount,
                'probability': round(adjusted_probability * weight, 3),
                'expected_month': estimate_close_month(mandate, scenario)
            })
    
    # Aggregate totals and monthly rollup
    for scenario in SCENARIO_WEIGHTS:
        forecast['scenarios'][scenario]['total'] = sum(
            item['amount'] for item in forecast['scenarios'][scenario]
        )
    
    forecast['monthly_rollup'] = build_monthly_rollup(forecast, period)
    forecast['confidence_level'] = calculate_confidence(mandates)
    
    return forecast
```

#### 7.1.3 API Endpoints
```
GET  /api/v1/forecast?period=quarter|month|year
     → { forecast_date, scenarios: { conservative, expected, optimistic }, monthly_rollup, confidence_level }

GET  /api/v1/forecast/:id
     → { full forecast with mandate-level breakdown }

POST /api/v1/forecast/generate
     body: { period: "quarter", as_of_date: "2026-07-10" }
     → { forecast_id, totals, mandate_count }

GET  /api/v1/forecast/history?period=quarter&limit=12
     → [ { forecast_date, conservative_total, expected_total, optimistic_total } ]

GET  /api/v1/forecast/accuracy
     → { historical_accuracy: { mape: 0.12, n_samples: 8 }, by_stage: {...} }
```

### 7.2 Change Detection Engine

#### 7.2.1 New Table: `change_snapshots`
```sql
CREATE TABLE change_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  snapshot_type TEXT DEFAULT 'daily' CHECK (snapshot_type IN ('daily','weekly','manual','trigger')),
  total_mandates INTEGER,
  total_candidates INTEGER,
  pipeline_value NUMERIC,
  mandate_summary JSONB DEFAULT '{}',
  consultant_summary JSONB DEFAULT '{}',
  flag_summary JSONB DEFAULT '{}',
  data_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(snapshot_date, snapshot_type)
);

CREATE TABLE change_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_snapshot_id UUID REFERENCES change_snapshots(id),
  to_snapshot_id UUID REFERENCES change_snapshots(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('mandate','candidate','consultant','revenue')),
  entity_id UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN (
    'added','removed','status_changed','tier_changed','stage_changed',
    'fee_changed','deadline_changed','consultant_changed'
  )),
  from_value TEXT,
  to_value TEXT,
  narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cr_snapshots ON change_records(from_snapshot_id, to_snapshot_id);
```

#### 7.2.2 Change Detection Algorithm
```python
def detect_changes(from_date, to_date=None):
    to_date = to_date or today()
    snapshot_from = get_snapshot(from_date)
    snapshot_to = get_snapshot(to_date)
    
    changes = {
        'mandates': {'added': [], 'removed': [], 'status_changed': [], 'tier_changed': []},
        'candidates': {'added': [], 'stage_changed': []},
        'revenue': {'delta': 0, 'by_mandate': []},
        'narrative': ''
    }
    
    # Mandate diff
    old_ids = set(m.id for m in snapshot_from.mandates)
    new_ids = set(m.id for m in snapshot_to.mandates)
    
    changes['mandates']['added'] = [get_summary(id) for id in (new_ids - old_ids)]
    changes['mandates']['removed'] = [get_summary(id) for id in (old_ids - new_ids)]
    
    for mid in (old_ids & new_ids):
        old = get_mandate_snapshot(snapshot_from, mid)
        new = get_mandate_snapshot(snapshot_to, mid)
        if old.status != new.status:
            changes['mandates']['status_changed'].append({
                'mandate_id': mid, 'from': old.status, 'to': new.status
            })
        if old.priority_tier != new.priority_tier:
            changes['mandates']['tier_changed'].append({
                'mandate_id': mid, 'from': old.priority_tier, 'to': new.priority_tier
            })
    
    # Revenue delta
    changes['revenue']['delta'] = snapshot_to.pipeline_value - snapshot_from.pipeline_value
    
    # Narrative
    changes['narrative'] = generate_change_narrative(changes)
    return changes

def generate_change_narrative(changes):
    lines = []
    net = len(changes['mandates']['added']) - len(changes['mandates']['removed'])
    if net > 0:
        lines.append(f"Pipeline grew by {net} mandate(s) since last snapshot.")
    elif net < 0:
        lines.append(f"Pipeline shrank by {abs(net)} mandate(s) since last snapshot.")
    
    status_changes = changes['mandates']['status_changed']
    advanced = [c for c in status_changes if is_forward(c['from'], c['to'])]
    regressed = [c for c in status_changes if not is_forward(c['from'], c['to'])]
    if advanced:
        lines.append(f"{len(advanced)} mandate(s) advanced: {', '.join(c['mandate_id'] for c in advanced[:3])}")
    if regressed:
        lines.append(f"{len(regressed)} mandate(s) regressed")
    
    rev_delta = changes['revenue']['delta']
    if abs(rev_delta) > 10000:
        direction = "increased" if rev_delta > 0 else "decreased"
        lines.append(f"Pipeline value {direction} by {format_currency(abs(rev_delta))}.")
    
    return "\n".join(lines)
```

#### 7.2.3 API Endpoints
```
POST /api/v1/snapshots/capture
     → { snapshot_id, snapshot_date }

GET  /api/v1/snapshots/:date
     → { full snapshot data }

GET  /api/v1/changes?from=2026-07-01&to=2026-07-10
     → { mandates, candidates, revenue, narrative }

GET  /api/v1/changes/summary?period=7d|30d
     → { net_changes, revenue_delta, key_movements, narrative }
```

### 7.3 Five-Metric Aggregator
```python
def aggregate_five_metrics(consultant_id, week_start):
    activities = get_activities(consultant_id, week_start, week_start + 7 days)
    metrics = {
        'new_candidates_added': count(activities, action='candidate_added'),
        'cv_submitted': count(activities, action='cv_submitted'),
        'interviews_scheduled': count(activities, action='interview_scheduled'),
        'offers_extended': count(activities, action='offer_extended'),
        'placements': count(activities, action='placement_confirmed'),
        'conversion_rates': {
            'cv_to_interview': iv / max(cv, 1),
            'interview_to_offer': of / max(iv, 1),
            'offer_to_placement': pl / max(of, 1)
        },
        'vs_benchmark': compare_to_firm_benchmarks(metrics)
    }
    return metrics
```

```
GET  /api/v1/metrics/five?consultant_id=uuid&week_start=2026-07-07
     → { new_candidates, cv_submitted, interviews, offers, placements, conversion_rates, vs_benchmark }

GET  /api/v1/metrics/benchmarks?period=quarter
     → { avg per metric, p25, p50, p75, firm_wide }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Forecast generates 3 scenarios with stage-based probability | 10 mandates → verify totals match manual calc |
| 2 | Monthly rollup correctly distributes by expected close month | Check each scenario sums to total |
| 3 | Change detection identifies all mandate status changes between snapshots | Create 2 snapshots with known changes → verify all captured |
| 4 | Narrative includes status, revenue delta, and key movements | Verify narrative mentions all significant changes |
| 5 | 5-metric aggregation matches underlying activity log counts | Cross-check with raw activity_logs table |
| 6 | Forecast history allows period-over-period comparison | Generate 3 forecasts → verify history query returns all |

---

## T8 — Team Capacity & Load Balancer

**Estimate:** 16-22h
**Dependencies:** T1 (Schema), T2 (Business Rules)
**Blocks:** None

### Scope

Team capacity model with weighted load calculation, load balancer with rebalancing recommendations, simulation API, assignment recommendation engine.

### 8.1 Enhanced Capacity Model

#### 8.1.1 New Table: `capacity_records`
```sql
CREATE TABLE capacity_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id UUID NOT NULL REFERENCES consultants(id),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mandate_count INTEGER DEFAULT 0,
  weighted_load NUMERIC DEFAULT 0,
  max_capacity NUMERIC DEFAULT 8,
  capacity_ratio NUMERIC CHECK (capacity_ratio >= 0),
  status TEXT CHECK (status IN ('underloaded','balanced','at_capacity','overloaded')),
  active_mandate_ids UUID[] DEFAULT '{}',
  difficulty_weighted_sum NUMERIC DEFAULT 0,
  stage_weighted_sum NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consultant_id, snapshot_date)
);
```

#### 8.1.2 Load Calculation Algorithm
```python
STAGE_WEIGHT = {
    'kick_off': 0.5, 'sourcing': 0.8, 'screening': 1.0, 'shortlist': 1.2,
    'interview': 1.5, 'offer': 1.8, 'onboarded': 1.0,
    'closed_won': 0.0, 'closed_lost': 0.0, 'on_hold': 0.3
}

DIFFICULTY_MULTIPLIER = {1: 0.7, 2: 0.85, 3: 1.0, 4: 1.2, 5: 1.5}

def calculate_consultant_capacity(consultant):
    mandates = get_active_mandates(consultant.id)
    weighted_load = 0
    
    for m in mandates:
        stage_w = STAGE_WEIGHT.get(m.status, 0.5)
        diff_w = DIFFICULTY_MULTIPLIER.get(m.difficulty_score, 1.0)
        mandate_weight = stage_w * diff_w
        weighted_load += mandate_weight
    
    capacity_ratio = weighted_load / consultant.max_capacity
    
    if capacity_ratio > 1.0:
        status = 'overloaded'
    elif capacity_ratio > 0.85:
        status = 'at_capacity'
    elif capacity_ratio < 0.4:
        status = 'underloaded'
    else:
        status = 'balanced'
    
    return {
        'consultant_id': consultant.id,
        'mandate_count': len(mandates),
        'weighted_load': round(weighted_load, 2),
        'max_capacity': consultant.max_capacity,
        'capacity_ratio': round(capacity_ratio, 3),
        'status': status,
        'active_mandates': [m.id for m in mandates]
    }
```

### 8.2 Load Balancer

```python
def rebalance_team_load():
    consultants = get_all_active_consultants()
    loads = {c.id: calculate_consultant_capacity(c) for c in consultants}
    
    overloaded = [c for c in consultants if loads[c.id]['status'] == 'overloaded']
    underloaded = [c for c in consultants if loads[c.id]['capacity_ratio'] < 0.4]
    
    if not overloaded or not underloaded:
        return {'status': 'balanced', 'recommendations': []}
    
    recommendations = []
    for over_c in overloaded:
        for mandate in get_mandates(over_c.id):
            for under_c in underloaded:
                compatibility = calculate_assignment_compatibility(mandate, under_c)
                if compatibility['score'] > 0.6 and loads[under_c.id]['capacity_ratio'] < 0.8:
                    recommendations.append({
                        'mandate_id': mandate.id,
                        'from_consultant': over_c.name,
                        'to_consultant': under_c.name,
                        'compatibility_score': compatibility['score'],
                        'reasons': compatibility['reasons'],
                        'impact': {
                            'from_load_after': loads[over_c.id]['capacity_ratio'] - mandate.weight / over_c.max_capacity,
                            'to_load_after': loads[under_c.id]['capacity_ratio'] + mandate.weight / under_c.max_capacity
                        }
                    })
    
    return sorted(recommendations, key=lambda x: x['compatibility_score'], reverse=True)

def simulate_rebalance(moves):
    current_state = capture_current_state()
    for move in moves:
        current_state.apply_move(move)
    
    return {
        'projected_loads': {c.id: calculate_load(c, current_state) for c in current_state.consultants},
        'gini_coefficient': calculate_gini(current_state),
        'total_utilization': calculate_utilization(current_state),
        'risk_assessment': assess_risk(moves),
        'timeline_impact': estimate_timeline_changes(current_state)
    }
```

### 8.3 Assignment Recommendation Engine
```python
def recommend_assignment(mandate):
    consultants = get_available_consultants()
    scores = []
    
    for c in consultants:
        score = 0
        reasons = []
        
        # Specialization match
        if mandate.industry in c.specializations:
            score += 0.3
            reasons.append(f"Industry match: {mandate.industry}")
        
        # Current load (prefer moderate load)
        capacity = calculate_consultant_capacity(c)
        if 0.4 <= capacity['capacity_ratio'] <= 0.85:
            score += 0.25
            reasons.append("Available capacity")
        
        # Track record with similar mandates
        similar_past = count_similar_mandates(c.id, mandate.position_title, mandate.industry)
        if similar_past >= 3:
            score += 0.25
            reasons.append(f"{similar_past} similar mandates completed")
        
        # Language/location fit
        if mandate.location and consultant_location_match(c, mandate.location):
            score += 0.2
            reasons.append("Location/language alignment")
        
        scores.append({'consultant_id': c.id, 'name': c.name, 'score': round(score, 2), 'reasons': reasons})
    
    return sorted(scores, key=lambda x: x['score'], reverse=True)
```

### API Endpoints
```
GET  /api/v1/capacity/overview
     → { consultants: [{ id, name, mandate_count, weighted_load, capacity_ratio, status }] }

GET  /api/v1/capacity/:consultant_id
     → { full capacity breakdown with mandate details }

POST /api/v1/capacity/rebalance
     → { recommendations: [{ mandate_id, from, to, score, reasons, impact }] }

POST /api/v1/capacity/simulate
     body: { moves: [{ mandate_id, from_consultant, to_consultant }] }
     → { projected_loads, gini_coefficient, risk_assessment, timeline_impact }

POST /api/v1/assignments/recommend
     body: { mandate_id }
     → { recommended_consultants: [{ consultant_id, name, score, reasons }] }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Weighted load correctly applies stage and difficulty multipliers | Manual calc vs system for 5 consultants |
| 2 | Rebalancer identifies all overloaded/underloaded consultants | Create known imbalance → verify detection |
| 3 | Simulation accurately projects post-move loads | Apply moves → verify projections within 5% |
| 4 | Assignment recommendation ranks by compatibility score | 3 consultants → verify ranking reflects criteria |
| 5 | Gini coefficient calculated correctly for load distribution | Known distribution → verify coefficient |
| 6 | Capacity status thresholds enforced (underloaded < 0.4, at_capacity > 0.85, overloaded > 1.0) | Edge cases at boundaries |

---

## T9 — Communication Engine

**Estimate:** 30-38h
**Dependencies:** T1 (Schema), T3 (Sourcing Engine)
**Blocks:** None

### Scope

Client email drafting with multi-language/tone support, candidate outreach sequences, follow-up automation, response classification, communication analytics.

### 9.1 New Tables

#### client_comm_profiles
```sql
CREATE TABLE client_comm_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_org_id UUID NOT NULL REFERENCES organizations(id),
  contact_name TEXT NOT NULL,
  email_addresses TEXT[] DEFAULT '{}',
  language_primary TEXT DEFAULT 'en' CHECK (language_primary IN ('en','fr','zh','th','my','other')),
  language_secondary TEXT,
  tone TEXT DEFAULT 'semi-formal' CHECK (tone IN ('formal','semi-formal','informal','casual')),
  greeting TEXT DEFAULT 'Dear',
  closing TEXT DEFAULT 'Best regards',
  cultural_notes TEXT,
  preferred_send_window JSONB DEFAULT '{"timezone":"HKT","hours":"09:00-11:00","days":["Mon","Tue","Wed","Thu","Fri"]}',
  communication_preferences JSONB DEFAULT '{"update_frequency":"per_deliverable","detail_level":"summary","attachment_format":"xlsx"}',
  learned_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### communication_records
```sql
CREATE TABLE communication_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id),
  type TEXT NOT NULL CHECK (type IN ('client_email','candidate_outreach','internal_update','auto_followup')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email','linkedin','feishu','internal')),
  timestamp_sent TIMESTAMPTZ,
  timestamp_delivered TIMESTAMPTZ,
  timestamp_read TIMESTAMPTZ,
  timestamp_replied TIMESTAMPTZ,
  sender_address TEXT,
  recipients JSONB DEFAULT '[]',
  subject TEXT,
  body_text TEXT,
  language TEXT DEFAULT 'en',
  attachments JSONB DEFAULT '[]',
  related_candidate_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','pending_review','approved','sent','delivered','read','replied','bounced','failed'
  )),
  reply_classification TEXT CHECK (reply_classification IN (
    'interested','asking_questions','not_now','declined','referral','hostile'
  )),
  reply_text TEXT,
  actor TEXT DEFAULT 'user' CHECK (actor IN ('agent','user','automated')),
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved_by_kevin','auto_approved')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_comm_mandate ON communication_records(mandate_id);
CREATE INDEX idx_comm_status ON communication_records(status);
CREATE INDEX idx_comm_type ON communication_records(type);
```

#### outreach_sequences
```sql
CREATE TABLE outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  template_chain JSONB NOT NULL DEFAULT '[]',
  current_stage TEXT DEFAULT 'connection_request',
  overall_status TEXT DEFAULT 'in_progress' CHECK (overall_status IN (
    'in_progress','completed','paused','candidate_responded','exhausted','blacklisted'
  )),
  response_received BOOLEAN DEFAULT false,
  response_classification TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mandate_id, candidate_id)
);
CREATE INDEX idx_outreach_status ON outreach_sequences(overall_status);
```

#### communication_templates
```sql
CREATE TABLE communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'outreach_connection','outreach_first_message','follow_up_1','follow_up_2',
    'break_up','client_update','client_deliverable','internal_update'
  )),
  language TEXT DEFAULT 'en',
  tone TEXT DEFAULT 'semi-formal',
  channel TEXT DEFAULT 'email' CHECK (channel IN ('linkedin','email','both')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  personalization_rules JSONB DEFAULT '{}',
  max_length_chars INTEGER DEFAULT 500,
  usage_count INTEGER DEFAULT 0,
  response_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 9.2 Core Algorithms

#### 9.2.1 Client Email Generation
```python
def generate_client_email(client_profile, content_type, data_points, attachments=None):
    mandate = data_points.get('mandate')
    
    # Build prompt with language/tone context
    prompt = f"""Draft a {content_type} email for:
    Recipient: {client_profile.contact_name}
    Language: {client_profile.language_primary}
    Tone: {client_profile.tone}
    Greeting: {client_profile.greeting}
    Closing: {client_profile.closing}
    Cultural notes: {client_profile.cultural_notes}
    
    Data points to include naturally: {data_points}
    
    Rules:
    - Match the client's preferred language and register
    - Keep concise (client prefers {client_profile.learned_patterns.get('email_length', 'medium')})
    - Include relevant metrics/data naturally
    - {client_profile.greeting} opening, {client_profile.closing} closing"""
    
    draft = call_llm(prompt, model='deepseek_pro')
    
    return {
        'subject': generate_subject(client_profile, content_type, mandate),
        'body': draft,
        'language': client_profile.language_primary,
        'confidence_score': calculate_confidence(draft, client_profile),
        'attachments': attachments or []
    }
```

#### 9.2.2 Candidate Outreach Personalization
```python
def generate_outreach_message(candidate, mandate, stage, channel='linkedin'):
    personalization = {
        'first_name': candidate.first_name,
        'current_title': candidate.current_title,
        'current_company': candidate.current_company,
        'industry': mandate.industry,
        'role_type': mandate.position_title,
        'location': mandate.location,
        'value_prop': generate_value_prop(candidate, mandate)
    }
    
    # Seniority-based length adjustment
    if candidate.years_experience and candidate.years_experience > 15:
        max_words = 80  # VP+ — short, respectful of time
    elif candidate.years_experience and candidate.years_experience > 8:
        max_words = 120  # Director/Mid
    else:
        max_words = 150  # Junior — more detail about opportunity
    
    # Confidentiality: never mention client name in first outreach
    rules = ["NEVER mention client by name in first outreach"]
    if stage != 'connection_request':
        rules.append("Reference their specific background")
    
    prompt = build_outreach_prompt(personalization, stage, channel, max_words, rules)
    return call_llm(prompt, model='deepseek_flash')
```

#### 9.2.3 Response Classification
```python
RESPONSE_CLASSIFICATIONS = {
    'interested': {
        'signals': ['love to learn more', 'schedule a call', 'open to exploring', 'sounds interesting'],
        'action': 'move_candidate_up_pipeline'
    },
    'asking_questions': {
        'signals': ['what is the comp', 'where is the role', 'can you share'],
        'action': 'draft_response_with_info'
    },
    'not_now': {
        'signals': ['not at the moment', 'keep in touch', 'revisit in'],
        'action': 'schedule_reengagement'
    },
    'declined': {
        'signals': ['not interested', 'happy where i am', 'please remove'],
        'action': 'stop_sequences_blacklist'
    },
    'referral': {
        'signals': ['my colleague might be', 'let me introduce', 'think of'],
        'action': 'capture_referral_add_pipeline'
    },
    'hostile': {
        'signals': ['stop contacting', 'report as spam', 'do not contact'],
        'action': 'immediate_blacklist_all_projects'
    }
}

def classify_response(reply_text, context=None):
    prompt = f"""Classify this candidate response:
    Reply: "{reply_text}"
    Context: {context}
    
    Categories: interested, asking_questions, not_now, declined, referral, hostile
    Return: {{ classification, confidence, suggested_action }}"""
    
    result = call_llm(prompt, model='deepseek_flash')
    return result
```

### 9.3 API Endpoints
```
# Client Communication Profiles
GET    /api/v1/client-comms
GET    /api/v1/client-comms/:client_id
POST   /api/v1/client-comms
PATCH  /api/v1/client-comms/:client_id

# Email Drafting
POST   /api/v1/drafts/generate
       body: { type, mandate_id, recipient_id, content_type, data_points, attachments }
       → { draft_id, subject, body, language, confidence_score }
GET    /api/v1/drafts/:draft_id
PATCH  /api/v1/drafts/:draft_id
POST   /api/v1/drafts/:draft_id/approve
POST   /api/v1/drafts/:draft_id/send

# Outreach Management
POST   /api/v1/outreach/sequence/create
       body: { mandate_id, candidate_ids, template_chain, start_delay_days }
GET    /api/v1/outreach/sequences?mandate_id=uuid&status=in_progress
GET    /api/v1/outreach/sequences/:id
POST   /api/v1/outreach/sequences/:id/pause
POST   /api/v1/outreach/sequences/:id/resume

# Response Management
POST   /api/v1/responses/classify
       body: { comm_id, reply_text }
       → { classification, confidence, suggested_action }
GET    /api/v1/responses/pending?mandate_id=uuid

# Communication Analytics
GET    /api/v1/comms/analytics?mandate_id=uuid&period=30d
       → { outreach: { total_sent, response_rate, by_stage, by_channel }, client: {...} }
GET    /api/v1/comms/history?mandate_id=uuid&type=outbound&channel=email
```

### 9.4 Key Business Rules
- ALL drafts require review before sending (no auto-send without approval)
- Outreach sequences auto-pause when candidate replies
- Cross-project outreach lock: same candidate in 2 projects → stagger 48h minimum
- Email body mentioning "attached" → verify attachment present before send
- Multi-language quality: EN=Native, FR/ZH/TH=Professional+review note
- Senior candidates (VP+): shorter messages, focus on strategic fit
- Speaker invitations: emphasize expertise/audience, not "opportunity"

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Client email generated in correct language and tone | French client → verify French grammar, informal register |
| 2 | Outreach message includes ≥ 3 personalization variables correctly | Verify name, company, background from profile |
| 3 | Follow-up sequences execute on schedule with correct stage progression | Create sequence → verify each stage fires at correct interval |
| 4 | All drafts require review before sending | Verify draft stays in "pending_review" until approved |
| 5 | Response classification ≥ 85% accuracy | Test with 50 labeled replies |
| 6 | Cross-project outreach lock prevents double-contact | Same candidate, 2 projects → verify 48h stagger |
| 7 | Communication history records full metadata | End-to-end: send → log → retrieve |

---

## T10 — Report Templates & Distribution

**Estimate:** 20-26h
**Dependencies:** T5 (Phase 1 — Output & Deliverables)
**Blocks:** None

### Scope

10 report templates, scheduling engine (cron + trigger-based), distribution router with content filtering, snapshot engine with retention policy.

### 10.1 New Table: `report_templates`
```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  sections JSONB NOT NULL DEFAULT '[]',
  output_format TEXT DEFAULT 'markdown' CHECK (output_format IN ('markdown','pdf','html','feishu_card')),
  routing JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE report_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES report_templates(id),
  generated_at TIMESTAMPTZ DEFAULT now(),
  content TEXT,
  format TEXT,
  delivery_status JSONB DEFAULT '{}',
  triggered_by TEXT DEFAULT 'scheduled' CHECK (triggered_by IN ('scheduled','trigger','manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE distribution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES report_instances(id),
  target_type TEXT CHECK (target_type IN ('feishu_group','feishu_dm','email')),
  target_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed','retrying')),
  message_id TEXT,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.2 Pre-Defined Templates

| Template ID | Name | Schedule | Route To |
|-------------|------|----------|----------|
| `daily_dashboard_v2` | Daily Pipeline Dashboard | Daily 18:30 HKT | Alessio/AI + LYC Partners |
| `weekly_recap` | Weekly Pipeline Recap | Weekly Fri 18:00 | Alessio/AI + LYC Partners |
| `executive_summary` | Executive Summary for Kevin | Weekly Mon 09:00 | Kevin DM |
| `consultant_brief` | Consultant Daily Brief | Daily 08:30 | Each consultant DM |
| `client_update` | Client Pipeline Update | On demand | Client DM |
| `revenue_forecast` | Revenue Forecast Report | Monthly 1st | Kevin DM + LYC Partners |
| `interview_prep` | Interview Preparation Brief | On interview trigger | Consultant DM |
| `closing_checklist` | Closing Stage Checklist | Daily for Tier 1 | Kevin DM |
| `risk_report` | Risk & Blocker Report | Daily 09:00 | Kevin DM |
| `monthly_performance` | Monthly Team Performance | Monthly 1st | LYC Partners |

### 10.3 Scheduling Engine
```python
SCHEDULE_CONFIGS = {
    'daily_dashboard': {
        'cron': '30 10 * * 1-5',  # 18:30 HKT = 10:30 UTC, Mon-Fri
        'timezone': 'Asia/Hong_Kong',
        'template': 'daily_dashboard_v2',
        'retry_on_failure': True,
        'max_retries': 2
    },
    'weekly_recap': {
        'cron': '0 10 * * 5',  # 18:00 HKT Friday
        'template': 'weekly_recap'
    },
    'executive_summary': {
        'cron': '0 1 * * 1',  # 09:00 HKT Monday
        'template': 'executive_summary'
    },
    'consultant_brief': {
        'cron': '30 0 * * 1-5',  # 08:30 HKT Mon-Fri
        'template': 'consultant_brief',
        'per_consultant': True
    },
    'revenue_forecast': {
        'cron': '0 1 1 * *',  # 09:00 HKT 1st of month
        'template': 'revenue_forecast'
    }
}

TRIGGER_RULES = [
    {
        'trigger': 'status_change',
        'condition': 'mandate.status == "offer"',
        'action': 'generate_report',
        'template': 'closing_checklist',
        'route_to': 'kevin_dm'
    },
    {
        'trigger': 'flag_created',
        'condition': 'flag.severity in ["critical", "high"]',
        'action': 'send_notification',
        'template': 'risk_alert',
        'route_to': 'kevin_dm'
    },
    {
        'trigger': 'interview_scheduled',
        'condition': 'always',
        'action': 'generate_report',
        'template': 'interview_prep',
        'route_to': 'consultant_dm',
        'timing': '24h_before_interview'
    }
]
```

### 10.4 Distribution Router
```python
ROUTING_TABLE = {
    'alessio_ai_group': {
        'type': 'feishu_group',
        'chat_id': 'oc_3b7bff4eecafdfae4cfbfc13ea0bd18e',
        'allowed_templates': ['daily_dashboard_v2', 'weekly_recap', 'risk_report'],
        'format': 'markdown'
    },
    'kevin_dm': {
        'type': 'feishu_dm',
        'user_id': 'ou_54a7162558b62acf61e441fd74a3a0f3',
        'allowed_templates': ['*'],
        'format': 'markdown',
        'priority_delivery': True
    },
    'consultant_dm': {
        'type': 'feishu_dm',
        'user_id': 'dynamic:consultant.feishu_id',
        'allowed_templates': ['consultant_brief', 'interview_prep', 'deadline_alert'],
        'format': 'markdown',
        'content_filter': 'consultant_only'
    }
}

def filter_content_for_recipient(report, recipient):
    if recipient.role == 'director':
        return report  # Kevin sees everything
    elif recipient.role == 'consultant':
        filtered = report.copy()
        filtered.sections = [s.filter(consultant_id=recipient.id) for s in report.sections]
        filtered.remove_sections(['revenue_forecast', 'team_load', 'priority_stack'])
        return filtered
    return report
```

### API Endpoints
```
POST /api/v1/reports/generate
     body: { template_id, override_params: {} }
     → { report_id, content, format }
GET  /api/v1/reports/:id
GET  /api/v1/reports?template_id=uuid&date_from=&date_to=
GET  /api/v1/reports/templates
GET  /api/v1/reports/templates/:id

GET  /api/v1/schedules
POST /api/v1/schedules
PUT  /api/v1/schedules/:id
DELETE /api/v1/schedules/:id
POST /api/v1/schedules/:id/trigger

POST /api/v1/distribution/send
     body: { report_id, targets: [{ type, id }] }
     → { delivery_ids, status }
GET  /api/v1/distribution/history?report_id=uuid
GET  /api/v1/distribution/:id/status
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | 10 report templates render correctly from live data | Generate each template → verify all sections populated |
| 2 | Scheduled reports fire at correct time (±5 min) | Set daily 18:30 → verify delivery at 18:30 ± 5 min |
| 3 | Content filtering removes sensitive sections for consultants | Consultant brief → verify no revenue/team_load sections |
| 4 | Distribution router delivers to correct Feishu targets | Route to Kevin DM → verify received in correct chat |
| 5 | Trigger-based reports fire on condition match | Status → "offer" → verify closing_checklist generated |
| 6 | Failed delivery retries up to max_retries with correct delay | Force delivery failure → verify 2 retries at 60s intervals |

---

## T11 — Agent Orchestration

**Estimate:** 22-28h
**Dependencies:** T1 (Schema)
**Blocks:** None

### Scope

Agent registry, task dispatch with context packages, work logging, EOD summary generator, cost tracking & budget control, escalation rules.

### 11.1 New Tables

#### agent_registry
```sql
CREATE TABLE agent_registry (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  role TEXT,
  type TEXT DEFAULT 'executor' CHECK (type IN ('orchestrator','executor','specialist')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','dormant','inactive_hold','decommissioned')),
  capabilities TEXT[] DEFAULT '{}',
  limitations TEXT[] DEFAULT '{}',
  models_available TEXT[] DEFAULT '{deepseek-flash,deepseek-pro}',
  daily_budget_cny NUMERIC DEFAULT 80,
  monthly_budget_cny NUMERIC DEFAULT 1800,
  avg_cost_per_task NUMERIC DEFAULT 3.50,
  max_concurrent_tasks INTEGER DEFAULT 3,
  working_hours JSONB DEFAULT '{"timezone":"Asia/Shanghai","start":"08:00","end":"22:00","days":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}',
  reporting_to TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id),
  parent_task_id UUID REFERENCES tasks(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('sweep','analysis','outreach','deliverable','research','communication','coordination','custom')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical','high','normal','low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','dispatched','in_progress','review','completed','failed','cancelled','paused')),
  assigned_agent TEXT REFERENCES agent_registry(id),
  dispatched_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  context_package JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '[]',
  cost JSONB DEFAULT '{"tokens_input":0,"tokens_output":0,"api_calls":0,"total_cny":0}',
  quality_score NUMERIC CHECK (quality_score BETWEEN 0 AND 100),
  escalation_count INTEGER DEFAULT 0,
  clarification_requests INTEGER DEFAULT 0,
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tasks_agent ON tasks(assigned_agent);
CREATE INDEX idx_tasks_status ON tasks(status);
```

#### work_logs
```sql
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  agent_id TEXT NOT NULL REFERENCES agent_registry(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'task_started','task_completed','task_failed','handoff_sent','handoff_received',
    'clarification_requested','escalation_triggered','quality_check_passed',
    'quality_check_failed','budget_alert','cost_update'
  )),
  timestamp TIMESTAMPTZ DEFAULT now(),
  details JSONB DEFAULT '{}',
  cost_snapshot JSONB DEFAULT '{}',
  output_refs TEXT[] DEFAULT '{}',
  notes TEXT
);
CREATE INDEX idx_worklogs_task ON work_logs(task_id);
CREATE INDEX idx_worklogs_agent ON work_logs(agent_id);
```

### 11.2 Core Algorithms

#### 11.2.1 Auto-Assignment
```python
def auto_assign_task(task):
    agents = get_agents_by_status('active')
    candidates = []
    
    for agent in agents:
        # Filter: capability match
        if task.type not in agent.capabilities:
            continue
        
        # Filter: limitations
        if any(limitation in task.requirements for limitation in agent.limitations):
            continue
        
        # Filter: availability
        if agent.active_tasks >= agent.max_concurrent_tasks:
            continue
        
        # Score
        score = 0
        # Current load (prefer less loaded)
        score += (1 - agent.active_tasks / agent.max_concurrent_tasks) * 0.3
        # Cost efficiency (prefer cheaper for simple tasks)
        if task.type in ['research', 'data_entry']:
            score += (1 - agent.avg_cost_per_task / 10) * 0.2
        # Historical quality for this task type
        score += get_agent_quality_for_type(agent.id, task.type) * 0.3
        # Speed
        score += get_agent_speed_score(agent.id, task.type) * 0.2
        
        candidates.append({'agent_id': agent.id, 'score': round(score, 2)})
    
    if not candidates:
        return {'status': 'queued', 'reason': 'no_available_agent'}
    
    return sorted(candidates, key=lambda x: x['score'], reverse=True)[0]
```

#### 11.2.2 EOD Summary Generator
```python
def generate_eod_summary(date=None):
    date = date or today()
    agents = get_all_active_agents()
    tasks_today = get_tasks_completed_on(date)
    
    report = f"═══ EOD REPORT — {date} ═══\n\n"
    report += f"AGENTS ACTIVE: {len(agents)}\n"
    report += f"TOTAL TASKS: {len(tasks_today)} completed\n"
    report += f"TOTAL COST: ¥{sum(t.cost['total_cny'] for t in tasks_today):.2f}\n\n"
    
    for agent in agents:
        agent_tasks = [t for t in tasks_today if t.assigned_agent == agent.id]
        report += f"─── {agent.display_name.upper()} ───\n"
        report += f"Tasks: {len(agent_tasks)} completed\n"
        for t in agent_tasks:
            duration = (t.completed_at - t.started_at).seconds // 60
            report += f"{t.title} ({duration} min, ¥{t.cost['total_cny']:.2f})\n"
            if t.outputs:
                report += f"  → {t.outputs[0].get('summary', 'Output generated')}\n"
        report += "\n"
    
    # Blocked items
    blocked = get_blocked_items(date)
    if blocked:
        report += "─── BLOCKED / NEEDS ATTENTION ───\n"
        for b in blocked:
            report += f"• {b.description}\n"
    
    return report
```

### 11.3 API Endpoints
```
# Agent Management
GET    /api/v1/agents?status=active
GET    /api/v1/agents/:id
PATCH  /api/v1/agents/:id
GET    /api/v1/agents/:id/performance?period=30d

# Task Management
POST   /api/v1/tasks
GET    /api/v1/tasks?status=in_progress&agent_id=uuid
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
POST   /api/v1/tasks/:id/dispatch
POST   /api/v1/tasks/:id/complete
       body: { outputs, cost, quality_score, notes }
POST   /api/v1/tasks/:id/fail
POST   /api/v1/tasks/:id/escalate

# Work Logging
POST   /api/v1/work-logs
GET    /api/v1/work-logs?agent_id=string&date_from=ISO8601
GET    /api/v1/work-logs/eod-summary?date=YYYY-MM-DD

# Cost Tracking
GET    /api/v1/costs/overview?period=today|7d|30d
       → { total_cny, budget_total, budget_used_pct, by_agent, by_mandate, by_model }
GET    /api/v1/costs/agent/:agent_id?period=7d
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Task dispatches with complete context package | Agent receives all required info without asking for more |
| 2 | Agent dashboard shows real-time status | Updates within 5s of status change |
| 3 | Work log captures every task completion with cost | End-to-end: dispatch → execute → complete → log |
| 4 | EOD summary auto-generated with accurate data | Known day → verify all tasks/costs listed |
| 5 | Budget cap enforcement stops tasks when limit reached | Set ¥10 cap → verify stop at limit |
| 6 | Auto-assignment routes to best-fit agent | Submit task → verify assigned by capability + load |
| 7 | Escalation triggers fire when conditions met | Simulate stuck task → verify alert within 30 min |

---

## T12 — Scoring Calibration & Intelligence Layer

**Estimate:** 16-22h
**Dependencies:** T1 (Schema), T3 (Sourcing Engine)
**Blocks:** None

### Scope

Scoring calibration engine that learns from past sweeps, cross-project pattern recognition, market universe validation, keyword bank intelligence.

### 12.1 New Tables

#### sweep_outcomes
```sql
CREATE TABLE sweep_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  mandate_type TEXT CHECK (mandate_type IN ('mapping','sweep','speaker_search','assessment')),
  scoring_model JSONB NOT NULL,
  input_metrics JSONB DEFAULT '{}',
  output_metrics JSONB DEFAULT '{}',
  outcome_data JSONB DEFAULT '{}',
  outreach_metrics JSONB DEFAULT '{}',
  cost_metrics JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT now()
);
```

#### patterns
```sql
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN (
    'geographic','company','seniority','template','seasonal','pipeline','client','scoring'
  )),
  title TEXT NOT NULL,
  description TEXT,
  supporting_data JSONB DEFAULT '{}',
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','superseded','invalidated')),
  superseded_by UUID REFERENCES patterns(id),
  action_taken TEXT,
  action_effectiveness TEXT CHECK (action_effectiveness IN ('improved','no_change','worsened')),
  first_observed TIMESTAMPTZ,
  last_observed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 12.2 Scoring Calibration Algorithm
```python
def suggest_scoring_model(mandate_type, industry, geography, seniority):
    similar_sweeps = get_sweep_outcomes(
        mandate_type=mandate_type, industry=industry, geography=geography
    )
    
    if len(similar_sweeps) < 3:
        return {'confidence': 0.4, 'suggestion': 'INSUFFICIENT_DATA', 'note': 'Need 3+ similar sweeps'}
    
    # Analyze which weights correlated with accepted candidates
    weight_patterns = analyze_weight_outcome_correlation(similar_sweeps)
    
    # Generate suggestion
    suggestion = {
        'weights': weight_patterns['optimal_weights'],
        'rationale': weight_patterns['rationale'],
        'confidence': weight_patterns['confidence'],
        'supporting_sweeps': len(similar_sweeps),
        'keyword_suggestions': suggest_keywords(similar_sweeps, industry)
    }
    
    return suggestion

def analyze_weight_outcome_correlation(sweeps):
    """Find which scoring weights best predicted accepted candidates"""
    accepted_weights = []
    rejected_weights = []
    
    for sweep in sweeps:
        accepted = sweep.outcome_data.get('kevin_promotions', [])
        rejected = sweep.outcome_data.get('kevin_demotions', [])
        
        if accepted:
            accepted_weights.append(sweep.scoring_model['weights'])
        if rejected:
            rejected_weights.append(sweep.scoring_model['weights'])
    
    # Average accepted weights
    optimal = average_weights(accepted_weights) if accepted_weights else DEFAULT_WEIGHTS
    
    return {
        'optimal_weights': optimal,
        'rationale': generate_rationale(optimal, sweeps),
        'confidence': min(len(sweeps) / 10, 0.95)
    }
```

### 12.3 Pattern Detection
```python
def detect_patterns():
    sweeps = get_all_completed_sweeps()
    patterns = []
    
    # Geographic patterns
    geo_response = analyze_by_geography(sweeps, 'outreach_response_rate')
    for geo, rate in geo_response.items():
        if rate < 0.10 and len(geo_response[geo]['samples']) >= 5:
            patterns.append(create_pattern('geographic', f'{geo} outreach below 10%', ...))
    
    # Template patterns
    template_performance = analyze_by_template(sweeps)
    for tmpl, rate in template_performance.items():
        if rate > 0.35:
            patterns.append(create_pattern('template', f'{tmpl} outperforms at {rate:.0%}', ...))
    
    # Seasonal patterns
    seasonal = analyze_by_month(sweeps, 'response_rate')
    # ... detect months with consistently lower/higher rates
    
    # Company patterns
    company_insights = analyze_by_company(sweeps, 't1_rate')
    # ... detect which companies produce T1 candidates
    
    return patterns
```

### API Endpoints
```
POST /api/v1/intelligence/calibrate-scoring
     body: { mandate_type, industry, geography, seniority }
     → { suggested_weights, rationale, confidence, keyword_suggestions }

GET  /api/v1/intelligence/patterns?category=geographic&status=active
     → { patterns: [{ title, description, confidence, supporting_data }] }

POST /api/v1/intelligence/validate-universe
     body: { mandate_id, companies: ["company1", "company2", ...] }
     → { issues: [{ company, issue_type, suggestion }], expansion_suggestions: [...] }

GET  /api/v1/intelligence/insights?status=new&limit=10
     → { insights: [{ type, title, description, confidence, suggested_action }] }

POST /api/v1/intelligence/insights/:id/resolve
     body: { resolution: "accepted" | "rejected" }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Scoring suggestion generated from ≥ 3 historical sweeps | Create new sweep → verify suggestion with rationale |
| 2 | Patterns detected when ≥ 5 supporting data points exist | Run 5 similar sweeps → verify pattern surfaced |
| 3 | Universe validation flags missing/questionable companies | Submit universe → verify issues detected vs history |
| 4 | Calibration learns from accepted/rejected suggestions | Accept → confidence increases; reject → adjusts |
| 5 | Pattern confidence decays when not reinforced | Old pattern not reinforced 90 days → confidence drops |
| 6 | Every insight has actionable recommendation | Verify all insights have suggested_action |

---

## T13 — DEX AI Advanced Infrastructure

**Estimate:** 18-24h
**Dependencies:** T6 (Phase 1 — DEX AI Core)
**Blocks:** T14, T15, T16

### Scope

Prompt registry with versioning, QA pipeline for LLM output validation, smart search (NLP query parsing), cost management with budget enforcement.

### 13.1 Prompt Registry

#### New Table: `prompt_registry`
```sql
CREATE TABLE prompt_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  template_path TEXT,
  template_content TEXT,
  variables TEXT[] DEFAULT '{}',
  model TEXT DEFAULT 'deepseek_flash' CHECK (model IN ('deepseek_flash','deepseek_pro')),
  max_tokens INTEGER DEFAULT 2000,
  temperature NUMERIC DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 2),
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Pre-Registered Prompts
| Feature Key | Model | Max Tokens | Temp |
|-------------|-------|-----------|------|
| jd_generator | deepseek_pro | 4000 | 0.7 |
| cv_optimizer | deepseek_pro | 4000 | 0.5 |
| executive_summary | deepseek_pro | 3000 | 0.3 |
| meeting_parser | deepseek_pro | 4000 | 0.2 |
| shortlist_rationale | deepseek_flash | 2000 | 0.5 |
| follow_up_draft | deepseek_flash | 1500 | 0.6 |
| data_query | deepseek_flash | 1000 | 0.2 |
| flag_description | deepseek_flash | 500 | 0.4 |
| notification | deepseek_flash | 300 | 0.3 |
| search_query | deepseek_flash | 500 | 0.2 |
| outreach_message | deepseek_flash | 800 | 0.6 |
| response_classifier | deepseek_flash | 500 | 0.1 |
| growth_plan | deepseek_pro | 3000 | 0.5 |
| candidate_comparison | deepseek_pro | 2500 | 0.4 |
| interview_prep | deepseek_pro | 2500 | 0.5 |

### 13.2 QA Pipeline
```python
QA_CHECKS = {
    'jd_generator': [
        verify_no_hallucinated_requirements,
        verify_salary_ranges_match_market,
        verify_output_format,
        verify_no_sensitive_data_leak,
        verify_all_required_sections_present,
        verify_length_within_bounds
    ],
    'cv_optimizer': [
        verify_no_hallucinated_experience,
        verify_keywords_present,
        verify_format_compliance,
        verify_no_sensitive_data_leak,
        verify_length_within_bounds
    ],
    'executive_summary': [
        verify_data_accuracy,
        verify_no_bias_indicators,
        verify_all_sections_present,
        verify_length_within_bounds,
        verify_board_level_tone
    ],
    'default': [
        verify_output_format,
        verify_no_sensitive_data_leak,
        verify_length_within_bounds
    ]
}

def qa_check(output, feature_type):
    checks = QA_CHECKS.get(feature_type, QA_CHECKS['default'])
    results = [check(output) for check in checks]
    passed = all(r.passed for r in results)
    
    if not passed:
        failed = [r for r in results if not r.passed]
        return {'passed': False, 'failures': failed, 'action': 'retry_with_adjusted_prompt'}
    
    return {'passed': True}
```

### 13.3 Smart Search (NLP)
```python
def smart_search(query):
    """Natural language → structured query"""
    parsed = parse_nlp_query(query)
    # Example: "Show me all candidates interviewing for manufacturing roles in Shanghai"
    # → { entity: 'candidates', status: 'interviewing', industry: 'manufacturing', location: 'Shanghai' }
    
    sql = build_query_from_parsed(parsed)
    results = execute_query(sql)
    
    return {
        'parsed_intent': parsed,
        'results': results,
        'total_count': len(results),
        'suggestions': generate_refinement_suggestions(parsed, results)
    }

def parse_nlp_query(query):
    prompt = f"""Parse this natural language query into structured filters:
    Query: "{query}"
    
    Return JSON: {{
        "entity": "mandate|candidate|organization|consultant",
        "filters": {{ "field": "value" }},
        "sort": {{ "field": "direction" }},
        "limit": N
    }}"""
    
    return call_llm(prompt, model='deepseek_flash')
```

### 13.4 Cost Management
```python
COST_LIMITS = {
    'daily_budget_rmb': 50,
    'per_task_max_rmb': 5,
    'monthly_budget_rmb': 1500,
    'alert_threshold': 0.8,
    'cost_per_1k_tokens': {
        'deepseek_flash': 0.001,
        'deepseek_pro': 0.002
    }
}

def track_and_enforce_budget(feature_key, tokens_used):
    daily_cost = get_daily_llm_cost()
    monthly_cost = get_monthly_llm_cost()
    task_cost = calculate_cost(feature_key, tokens_used)
    
    if daily_cost + task_cost > COST_LIMITS['daily_budget_rmb']:
        return 'queue_for_next_day'
    
    if monthly_cost + task_cost > COST_LIMITS['monthly_budget_rmb']:
        return 'reject_monthly_exceeded'
    
    if (monthly_cost + task_cost) > COST_LIMITS['monthly_budget_rmb'] * COST_LIMITS['alert_threshold']:
        send_alert('LLM budget approaching monthly limit')
    
    return 'allow'
```

### API Endpoints
```
GET  /api/v1/prompts?feature_key=jd_generator
GET  /api/v1/prompts/:id
PUT  /api/v1/prompts/:id
     body: { template_content, version, model, max_tokens, temperature }
POST /api/v1/prompts/:id/test
     body: { variables: { position_title: "...", ... } }
     → { output, tokens_used, cost, qa_passed }

POST /api/v1/search/smart
     body: { query: "all candidates interviewing for manufacturing in Shanghai" }
     → { parsed_intent, results, total_count, suggestions }

GET  /api/v1/costs/llm/overview?period=today|7d|30d
     → { daily_cost, monthly_cost, by_model, by_feature, budget_remaining }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Prompt registry stores all 15+ prompt configurations | Verify all feature_keys accessible |
| 2 | QA pipeline blocks output that fails checks | Inject hallucinated data → verify blocked |
| 3 | Smart search correctly parses NL to structured query | 10 test queries → ≥ 8 correctly parsed |
| 4 | Cost tracking accurate within ¥0.01 per task | Compare logged cost vs actual token usage |
| 5 | Budget enforcement blocks when daily limit reached | Hit ¥50 limit → verify queuing |
| 6 | Prompt versioning preserves history | Update prompt → verify old version still accessible |

---

## T14 — Coaching Portal (5 P1 Features)

**Estimate:** 16-20h
**Dependencies:** T1 (Schema), T6 (DEX AI Core)
**Blocks:** None

### Scope

Growth Plan Generator, Session Summarizer, Assessment Interpreter, Skill Gap Analyzer, Progress Tracker.

### 14.1 Feature Specifications

#### Growth Plan Generator
```python
def generate_growth_plan(consultant_id):
    metrics = get_five_metrics_history(consultant_id, weeks=12)
    performance = calculate_performance_score(consultant_id)
    strengths, gaps = identify_strengths_and_gaps(metrics, performance)
    
    prompt = f"""Generate a 90-day growth plan for this consultant:
    Strengths: {strengths}
    Gaps: {gaps}
    12-week trend: {metrics}
    Current load: {calculate_consultant_capacity(consultant_id)}
    
    Produce:
    1. 3 specific, measurable goals
    2. Weekly milestones for each goal
    3. Learning resources for each gap
    4. Success criteria (how to measure progress)"""
    
    return call_llm(prompt, model='deepseek_pro')
```

#### Session Summarizer
- Input: Session notes or transcript (text)
- Output: Key takeaways, action items with owners, follow-up dates, sentiment summary
- Uses DeepSeek Pro for complex extraction

#### Assessment Interpreter
- Input: Assessment scores (DISC, StrengthsFinder, custom assessments)
- Output: Strengths analysis, communication preferences, team fit suggestions, development areas
- Format: Structured JSON + narrative summary

#### Skill Gap Analyzer
- Input: Current performance metrics vs target benchmarks
- Output: Prioritized skill gap list with learning paths, estimated time to close each gap
- Cross-references with firm benchmarks from five_metrics

#### Progress Tracker
- Input: Growth plan + activity data + five_metrics history
- Output: Progress percentage per goal, on-track/at-risk indicators, celebration points
- Auto-updates weekly based on new metric data

### API Endpoints
```
POST /api/v1/coaching/growth-plan
     body: { consultant_id }
     → { plan_id, goals, milestones, resources, success_criteria }

POST /api/v1/coaching/session-summary
     body: { session_notes: "text", session_type: "coaching|mentoring|feedback" }
     → { takeaways, action_items, follow_up_dates, sentiment }

POST /api/v1/coaching/assessment-interpret
     body: { consultant_id, assessment_type, scores: {} }
     → { strengths, communication_prefs, team_fit, development_areas }

GET  /api/v1/coaching/skill-gaps/:consultant_id
     → { gaps: [{ skill, current_level, target_level, priority, learning_path, estimated_weeks }] }

GET  /api/v1/coaching/progress/:consultant_id?plan_id=uuid
     → { goals: [{ goal, progress_pct, status, next_milestone, celebration_points }] }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Growth plan includes 3 measurable goals with weekly milestones | Verify all fields populated |
| 2 | Session summary extracts action items with owners | Known notes → verify correct extraction |
| 3 | Assessment interpretation matches assessment framework | DISC scores → verify correct style descriptions |
| 4 | Skill gaps correctly identified from metrics comparison | Known gap → verify detected and prioritized |
| 5 | Progress tracker accurately reflects metric changes | Update metrics → verify progress % recalculated |

---

## T15 — Candidate Portal (5 P1 Features)

**Estimate:** 14-18h
**Dependencies:** T1 (Schema), T6 (DEX AI Core)
**Blocks:** None

### Scope

CV Optimizer (for specific mandate), Interview Prep (Candidate Side), Application Status Tracker, Profile Completeness Checker, Opportunity Matcher.

### 15.1 Feature Specifications

#### CV Optimizer
```python
def optimize_cv(candidate_id, mandate_id):
    candidate = get_candidate(candidate_id)
    mandate = get_mandate(mandate_id)
    
    current_cv = parse_cv(candidate.cv_file_url)
    requirements = extract_requirements(mandate)
    keywords = extract_keywords(mandate.jd_text)
    
    prompt = f"""Optimize this CV for:
    Position: {mandate.position_title}
    Key Requirements: {requirements}
    Keywords: {keywords}
    
    Current CV: {current_cv}
    
    Provide:
    1. Optimized CV with better keyword alignment
    2. Summary section rewritten for this role
    3. Skills section reordered by relevance
    4. Achievement bullets quantified where possible
    5. Suggestions for gaps to address"""
    
    optimized = call_llm(prompt, model='deepseek_pro')
    qa_result = qa_check(optimized, 'cv_optimizer')
    
    return {
        'optimized_cv': optimized,
        'match_score_before': calculate_cv_match(current_cv, requirements),
        'match_score_after': calculate_cv_match(optimized, requirements),
        'changes_made': diff(current_cv, optimized),
        'qa_passed': qa_result['passed']
    }
```

#### Interview Prep (Candidate Side)
- Input: Position details + company info + interview stage
- Output: Likely questions, suggested answers, company research brief, tips for stage
- Uses DeepSeek Pro for quality

#### Application Status Tracker
- Input: Candidate ID
- Output: All mandates candidate is in, with current stage, next steps, timeline
- Read-only, candidate-scoped view

#### Profile Completeness Checker
- Input: Candidate profile data
- Output: Completeness score (0-100), missing fields ranked by importance, suggestions
- Threshold: < 60% = "Needs work", 60-80% = "Good", > 80% = "Complete"

#### Opportunity Matcher
- Input: Candidate skills, preferences, experience
- Output: Ranked list of matching open mandates with match scores and rationale
- Filters: status=open, matches location preference, experience level fits

### API Endpoints
```
POST /api/v1/candidate/cv-optimize
     body: { candidate_id, mandate_id }
     → { optimized_cv, match_score_before, match_score_after, changes_made }

POST /api/v1/candidate/interview-prep
     body: { candidate_id, mandate_id, interview_stage }
     → { likely_questions, suggested_answers, company_research, stage_tips }

GET  /api/v1/candidate/:id/applications
     → { applications: [{ mandate_id, position_title, org, stage, next_steps, timeline }] }

GET  /api/v1/candidate/:id/profile-completeness
     → { score, missing_fields, suggestions, threshold_label }

GET  /api/v1/candidate/:id/opportunities
     → { matching_mandates: [{ mandate_id, position_title, match_score, rationale }] }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | CV optimization improves match score by ≥ 10% | Before vs after → verify improvement |
| 2 | Interview prep generates relevant questions for specific role | Known role → verify questions match requirements |
| 3 | Application status shows all mandates with correct stage | Cross-check with mandate_candidates table |
| 4 | Profile completeness correctly identifies missing fields | Known incomplete profile → verify detection |
| 5 | Opportunity matcher returns relevant mandates ranked by fit | Known candidate → verify top matches are reasonable |

---

## T16 — Leader Portal (4 P1 Features)

**Estimate:** 12-16h
**Dependencies:** T1 (Schema), T6 (DEX AI Core), T7 (Revenue Forecast)
**Blocks:** None

### Scope

Executive Summary Generator, Portfolio Health Overview, Revenue Forecast Dashboard, Team Performance Rankings.

### 16.1 Feature Specifications

#### Executive Summary Generator
```python
def generate_executive_summary():
    pipeline_data = get_full_pipeline_data()
    financial_data = get_financial_data()
    team_data = get_team_performance_data()
    flags = get_active_flags()
    changes = detect_changes(from_date=today() - 7 days)
    
    prompt = f"""Generate a board-level executive summary:
    Pipeline: {pipeline_data.summary}
    Revenue: {financial_data.this_month} actual, {financial_data.forecast} forecast
    Team: {team_data.summary}
    Critical Issues: {flags.critical}
    Week Changes: {changes.narrative}
    
    Format: 1-page brief with:
    1. Headline metric (3 numbers that matter most)
    2. Key wins this week
    3. Critical risks requiring attention
    4. Recommended actions (max 3)
    5. Forward look (next 30 days)
    
    Tone: Direct, data-driven, no fluff."""
    
    return call_llm(prompt, model='deepseek_pro')
```

#### Portfolio Health Overview
- Input: All mandates + team data
- Output: Portfolio health score (0-100), distribution by tier, trend arrows, risk aggregation
- AI enhancement: Anomaly detection, trend identification

#### Revenue Forecast Dashboard
- Input: Revenue forecast data (from T7)
- Output: 3-scenario visualization, monthly rollup chart, probability indicators, contributor breakdown
- Display: Markdown table + optional chart generation

#### Team Performance Rankings
- Input: Five-metrics data, task completion, quality scores
- Output: Ranked leaderboard with metrics, trend indicators, peer comparison
- Dimensions: Candidates added, CVs submitted, interviews scheduled, offers extended, placements

### API Endpoints
```
POST /api/v1/leader/executive-summary
     → { summary_text, headline_metrics, key_wins, risks, actions, forward_look }

GET  /api/v1/leader/portfolio-health
     → { health_score, by_tier, trends, risk_summary, anomalies }

GET  /api/v1/leader/revenue-dashboard?period=quarter
     → { forecast_3_scenarios, monthly_rollup, top_contributors, confidence }

GET  /api/v1/leader/team-rankings?period=30d
     → { rankings: [{ consultant, metrics, composite_score, trend }] }
```

### Acceptance Criteria
| # | Criterion | Test |
|---|-----------|------|
| 1 | Executive summary includes all 5 required sections | Verify headline, wins, risks, actions, forward look present |
| 2 | Portfolio health score reflects actual mandate health distribution | Cross-check with mandate health scores |
| 3 | Revenue forecast dashboard matches T7 forecast data | Verify numbers match |
| 4 | Team rankings correctly aggregate five_metrics data | Cross-check with raw metric records |
| 5 | Executive summary tone is board-level (no jargon, data-driven) | Human review of 3 generated summaries |

---

## Phase 2 Summary

| Ticket | Features | Hours | Key Deliverables |
|--------|----------|-------|-----------------|
| T7 | Revenue Forecast + Change Detection + 5-Metric | 24-30h | 3-scenario forecast, change narratives, benchmarks |
| T8 | Team Capacity + Load Balancer | 16-22h | Weighted capacity model, rebalancing simulation |
| T9 | Communication Engine | 30-38h | Multi-lang emails, outreach sequences, response classification |
| T10 | Report Templates & Distribution | 20-26h | 10 templates, cron scheduling, content filtering |
| T11 | Agent Orchestration | 22-28h | Task dispatch, work logs, EOD, cost tracking |
| T12 | Scoring Calibration & Intelligence | 16-22h | Learning calibration, pattern detection, universe validation |
| T13 | DEX AI Advanced Infrastructure | 18-24h | Prompt registry, QA pipeline, smart search, budget enforcement |
| T14 | Coaching Portal (5 features) | 16-20h | Growth plans, session summaries, skill gaps, progress tracking |
| T15 | Candidate Portal (5 features) | 14-18h | CV optimizer, interview prep, opportunity matcher |
| T16 | Leader Portal (4 features) | 12-16h | Executive summary, portfolio health, revenue dashboard, rankings |
| **Total** | **45 features** | **188-244h** | **5 weeks, all P1 operational** |

---

*Phase 2 tickets ready for Trae execution. Dependency chain: T7/T8/T11/T12 (Week 6) → T9/T10/T13 (Week 7) → T14/T15/T16 (Week 8-9) → Integration testing (Week 10)*
