# LYC Intelligence — Phase 3 Tickets (P2)

**Version:** 1.0
**Date:** 2026-07-10
**Scope:** 28 features | 110-150h | Weeks 11-15
**Dependencies:** Phase 1 (T1-T6) + Phase 2 (T7-T16) must be complete
**Prerequisite:** All P0 and P1 features operational

---

## Phase 3 Overview

| Ticket | Scope | Hours | Dependencies |
|--------|-------|-------|-------------|
| T17 | Meeting Intelligence & Automation Tools | 18-22h | T1, T6 |
| T18 | Advanced Search, Dedup & Governance | 17-24h | T1, T3, T11 |
| T19 | Advanced Client Deliverables | 26-36h | T3, T5, T9 |
| T20 | Strategic Intelligence Suite | 34-44h | T7, T12, T16 |
| T21 | Coaching Portal Completion (5 P2 features) | 13-18h | T6, T14 |
| T22 | Candidate Portal Completion (6 P2 features) | 16-23h | T6, T15 |

**Parallel execution window:** T17/T18 can start Week 11. T19 starts Week 11-12. T20 starts Week 12. T21/T22 start Week 13.

---

## T17 — Meeting Intelligence & Automation Tools

**Estimate:** 18-22h
**Dependencies:** T1 (Schema), T6 (DEX AI Core)
**Blocks:** None (terminal features)

### Scope

Meeting Intelligence Parser (transcript → structured actions/insights), Meeting Notes → Actions (auto-create tasks from notes), Activity Timeline Generator (visual audit trail of mandate activity).

### 17.1 Meeting Intelligence Parser

#### 17.1.1 New Table: `meeting_intelligence`
```sql
CREATE TABLE meeting_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES mandates(id),
  meeting_date TIMESTAMPTZ NOT NULL,
  meeting_type TEXT CHECK (meeting_type IN ('client_call','internal_sync','interview_debrief','kick_off','check_in','other')),
  raw_transcript TEXT,
  summary TEXT,
  key_decisions JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  risk_mentions JSONB DEFAULT '[]',
  sentiment_score NUMERIC CHECK (sentiment_score BETWEEN -1 AND 1),
  participants TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  source TEXT CHECK (source IN ('feishu_miaoji','manual_upload','auto_transcription')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_mi_mandate ON meeting_intelligence(mandate_id);
CREATE INDEX idx_mi_date ON meeting_intelligence(meeting_date);
```

#### 17.1.2 Parser Algorithm
```python
def parse_meeting(transcript, mandate_id=None):
    # Step 1: LLM processes raw transcript
    prompt = f"""
    Analyze this meeting transcript and extract:
    1. Summary (2-3 sentences)
    2. Key decisions made (array of {{decision, made_by, context}})
    3. Action items (array of {{action, owner, deadline, priority}})
    4. Risk mentions (array of {{risk, severity, context}})
    5. Overall sentiment (-1 to 1)
    
    Transcript:
    {transcript}
    """
    
    result = call_deepseek_pro(prompt)  # Use pro model for complex analysis
    
    # Step 2: If mandate_id provided, cross-reference with mandate context
    if mandate_id:
        mandate = get_mandate(mandate_id)
        result['mandate_context'] = {
            'stage': mandate.status,
            'relevant_flags': get_active_flags(mandate_id),
            'pipeline_impact': assess_pipeline_impact(result['action_items'], mandate)
        }
    
    # Step 3: Auto-create tasks from action items
    for action in result['action_items']:
        if action.get('owner'):
            create_task(
                mandate_id=mandate_id,
                title=action['action'],
                assigned_to=resolve_user(action['owner']),
                due_date=parse_deadline(action.get('deadline')),
                priority=action.get('priority', 'medium'),
                source='meeting_intelligence'
            )
    
    # Step 4: If risk mentions found, check against auto-flag system
    for risk in result['risk_mentions']:
        if risk['severity'] in ('high', 'critical'):
            trigger_auto_flag(
                mandate_id=mandate_id,
                flag_type='meeting_risk',
                detail=risk['risk'],
                source='meeting_intelligence'
            )
    
    # Step 5: Store
    meeting = insert_meeting_intelligence(
        mandate_id=mandate_id,
        transcript=transcript,
        parsed=result
    )
    
    return meeting

# Feishu Miaoji (妙记) integration
def ingest_from_feishu_miaoji(meeting_id):
    """Pull transcript from Feishu meeting recording via lark-cli"""
    transcript = lark_cli_get_meeting_transcript(meeting_id)
    return parse_meeting(transcript['content'], mandate_id=transcript.get('mandate_id'))
```

#### 17.1.3 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/meetings/parse` | POST | Parse raw transcript → structured intelligence |
| `/api/v1/meetings/{id}` | GET | Retrieve meeting intelligence |
| `/api/v1/meetings/mandate/{mandate_id}` | GET | All meetings for a mandate |
| `/api/v1/meetings/ingest-feishu` | POST | Pull from Feishu Miaoji |
| `/api/v1/meetings/{id}/actions` | GET | Extract action items only |

### 17.2 Meeting Notes → Actions

#### 17.2.1 Logic
```python
def notes_to_actions(notes_text, mandate_id=None):
    """Convert free-form meeting notes into structured action items"""
    prompt = f"""
    Extract all action items from these meeting notes.
    For each, identify: action description, responsible person, deadline, priority.
    If no explicit deadline, suggest one based on urgency.
    If no explicit owner, suggest based on role context.
    
    Notes:
    {notes_text}
    """
    
    actions = call_deepseek_pro(prompt)
    
    # Create tasks in task management system
    created_tasks = []
    for action in actions['items']:
        task = create_task(
            title=action['action'],
            assigned_to=action.get('owner'),
            due_date=action.get('deadline'),
            priority=action.get('priority', 'medium'),
            mandate_id=mandate_id,
            source='meeting_notes'
        )
        created_tasks.append(task)
    
    return {
        'actions_created': len(created_tasks),
        'tasks': created_tasks,
        'unassigned': [a for a in actions['items'] if not a.get('owner')]
    }
```

#### 17.2.2 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/notes/parse-actions` | POST | Extract actions from free-form notes |
| `/api/v1/notes/{id}/actions` | GET | Previously extracted actions |

### 17.3 Activity Timeline Generator

#### 17.3.1 New Table: `timeline_events`
```sql
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'status_change','stage_advance','candidate_added','candidate_removed',
    'meeting_held','note_added','email_sent','flag_triggered','flag_resolved',
    'fee_updated','consultant_changed','client_feedback','interview_scheduled',
    'offer_extended','deliverable_generated','search_performed','score_updated'
  )),
  event_data JSONB NOT NULL,
  actor TEXT,  -- who performed the action
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tl_mandate ON timeline_events(mandate_id);
CREATE INDEX idx_tl_type ON timeline_events(event_type);
CREATE INDEX idx_tl_created ON timeline_events(created_at DESC);
```

#### 17.3.2 Timeline Generation Logic
```python
def generate_timeline(mandate_id, filters=None, limit=100):
    """Build chronological activity timeline for a mandate"""
    query = """
    SELECT * FROM timeline_events 
    WHERE mandate_id = %s
    """
    params = [mandate_id]
    
    if filters:
        if filters.get('event_types'):
            query += " AND event_type = ANY(%s)"
            params.append(filters['event_types'])
        if filters.get('date_from'):
            query += " AND created_at >= %s"
            params.append(filters['date_from'])
        if filters.get('date_to'):
            query += " AND created_at <= %s"
            params.append(filters['date_to'])
    
    query += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)
    
    events = db.execute(query, params)
    
    # Group by date for display
    grouped = {}
    for event in events:
        date_key = event['created_at'].strftime('%Y-%m-%d')
        if date_key not in grouped:
            grouped[date_key] = []
        grouped[date_key].append({
            'id': event['id'],
            'type': event['event_type'],
            'data': event['event_data'],
            'actor': event['actor'],
            'time': event['created_at'].strftime('%H:%M'),
            'display': format_event_display(event)
        })
    
    return {
        'mandate_id': mandate_id,
        'total_events': len(events),
        'timeline': grouped,
        'summary': {
            'days_active': len(grouped),
            'most_active_day': max(grouped, key=lambda k: len(grouped[k])),
            'event_type_counts': count_by_type(events)
        }
    }

def format_event_display(event):
    """Human-readable event description"""
    templates = {
        'status_change': "Status changed from {old} to {new}",
        'stage_advance': "Advanced to {stage} stage",
        'candidate_added': "{candidate_name} added to pool (Grade {grade})",
        'candidate_removed': "{candidate_name} removed ({reason})",
        'meeting_held': "{meeting_type} meeting held ({duration}min)",
        'email_sent': "{email_type} email sent to {recipient}",
        'flag_triggered': "⚠️ {flag_type}: {detail}",
        'flag_resolved': "✅ {flag_type} resolved",
        'interview_scheduled': "Interview scheduled: {candidate} × {interviewer}",
        'offer_extended': "Offer extended to {candidate} ({amount})",
        'deliverable_generated': "{deliverable_type} generated"
    }
    template = templates.get(event['event_type'], "Activity: {summary}")
    return template.format(**event['event_data'])
```

#### 17.3.3 Auto-Capture Hook
```python
# This hooks into existing operations to auto-capture timeline events
def capture_timeline_event(mandate_id, event_type, event_data, actor=None):
    """Called by other modules to auto-log activity"""
    insert_timeline_event(
        mandate_id=mandate_id,
        event_type=event_type,
        event_data=event_data,
        actor=actor or get_current_user()
    )
```

#### 17.3.4 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/timeline/{mandate_id}` | GET | Full timeline with optional filters |
| `/api/v1/timeline/{mandate_id}/summary` | GET | Activity summary stats |
| `/api/v1/timeline/{mandate_id}/export` | GET | Export as CSV/PDF |

### 17.4 Acceptance Criteria

- [ ] Meeting parser extracts decisions, actions, risks from raw transcript with >85% accuracy
- [ ] Action items auto-create tasks with correct owner and deadline
- [ ] Feishu Miaoji integration pulls transcripts without manual copy-paste
- [ ] Risk mentions trigger auto-flags in existing flag system (T4)
- [ ] Meeting notes → actions works with free-form unstructured text
- [ ] Timeline auto-captures events from all Phase 1/2 operations
- [ ] Timeline supports filtering by event type, date range, actor
- [ ] Timeline export works as CSV and PDF
- [ ] All LLM calls routed through DeepSeek API (pro model for complex parsing)

### 17.5 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Parse transcript | 30-min client call transcript | Summary + 3-5 actions + sentiment |
| No mandate context | Generic meeting notes | Actions created, no mandate linking |
| High risk mention | "Client threatening to cancel" | Auto-flag triggered, severity=critical |
| Timeline generation | Mandate with 50+ events | Grouped by date, filtered, <200ms response |
| Feishu ingest | Valid meeting ID | Transcript pulled, parsed, stored |

---

## T18 — Advanced Search, Dedup & Governance

**Estimate:** 17-24h
**Dependencies:** T1 (Schema), T3 (Sourcing Engine), T11 (Agent Orchestration)
**Blocks:** None (terminal features)

### Scope

Auto-Report Builder (natural language → SQL query), Duplicate Detection UI (visual diff + merge), Cost Tracking (LLM cost dashboard + budget enforcement), Quality Gates (automated output validation).

### 18.1 Auto-Report Builder (NL → Query)

#### 18.1.1 Logic
```python
def nl_to_query(natural_language_query, user_role):
    """Convert natural language to structured database query"""
    
    # Step 1: Understand intent
    prompt = f"""
    Convert this natural language question into a SQL query.
    
    Available tables: organizations, mandates, candidates, mandate_candidates, 
    consultants, five_metrics, activity_logs, revenue_forecasts, 
    communication_records, agent_registry, tasks
    
    Table schemas are available in the system documentation.
    
    User role: {user_role}  -- determines RLS scope
    Question: {natural_language_query}
    
    Return: {{
        "sql": "...",
        "explanation": "What this query does",
        "tables_used": [...],
        "estimated_rows": "approximate",
        "warnings": ["any concerns about query performance or scope"]
    }}
    """
    
    result = call_deepseek_pro(prompt)
    
    # Step 2: Safety validation
    sql = result['sql']
    
    # Block dangerous operations
    blocked_keywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'INSERT', 'UPDATE', 'GRANT']
    for keyword in blocked_keywords:
        if keyword in sql.upper():
            return {'error': f'Query contains blocked operation: {keyword}', 'safe': False}
    
    # Enforce RLS — user can only query their scope
    sql = apply_rls_filter(sql, user_role)
    
    # Add LIMIT if not present
    if 'LIMIT' not in sql.upper():
        sql += ' LIMIT 100'
    
    # Step 3: Execute
    try:
        rows = db.execute(sql)
        return {
            'safe': True,
            'sql': sql,
            'explanation': result['explanation'],
            'data': rows,
            'row_count': len(rows),
            'format_suggestion': suggest_visualization(rows, natural_language_query)
        }
    except Exception as e:
        return {'error': str(e), 'safe': True, 'sql': sql}

def suggest_visualization(rows, query):
    """Suggest best way to display the results"""
    if len(rows) <= 5:
        return 'table'
    elif any(k in query.lower() for k in ['trend', 'over time', 'monthly', 'weekly']):
        return 'line_chart'
    elif any(k in query.lower() for k in ['compare', 'vs', 'versus', 'by']):
        return 'bar_chart'
    elif any(k in query.lower() for k in ['distribution', 'breakdown', 'share']):
        return 'pie_chart'
    else:
        return 'table'
```

#### 18.1.2 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/query/natural-language` | POST | NL → SQL → results |
| `/api/v1/query/history` | GET | User's recent queries |
| `/api/v1/query/save` | POST | Save query for reuse |
| `/api/v1/query/{id}/rerun` | POST | Re-execute saved query |

### 18.2 Duplicate Detection UI

#### 18.2.1 New Table: `duplicate_candidates`
```sql
CREATE TABLE duplicate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('candidate','organization','mandate')),
  entity_a_id UUID NOT NULL,
  entity_b_id UUID NOT NULL,
  similarity_score NUMERIC NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  match_fields JSONB NOT NULL,  -- which fields matched and how
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','merged','dismissed','false_positive')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_dup_entity ON duplicate_candidates(entity_type, entity_a_id);
CREATE INDEX idx_dup_status ON duplicate_candidates(status);
```

#### 18.2.2 Detection Algorithm
```python
def detect_duplicates(entity_type='candidate', threshold=0.75):
    """Scan for potential duplicates using fuzzy matching"""
    
    if entity_type == 'candidate':
        return detect_candidate_duplicates(threshold)
    elif entity_type == 'organization':
        return detect_org_duplicates(threshold)
    
def detect_candidate_duplicates(threshold=0.75):
    """Find duplicate candidates across projects"""
    candidates = db.execute("""
        SELECT c.id, c.full_name, c.email, c.phone, c.linkedin_url,
               c.current_company_name, mc.mandate_id
        FROM candidates c
        LEFT JOIN mandate_candidates mc ON mc.candidate_id = c.id
    """)
    
    duplicates = []
    
    # Build index for efficient comparison
    name_index = {}
    email_index = {}
    
    for c in candidates:
        # Email exact match (strongest signal)
        if c['email']:
            normalized_email = c['email'].lower().strip()
            if normalized_email in email_index:
                duplicates.append({
                    'entity_type': 'candidate',
                    'entity_a': email_index[normalized_email]['id'],
                    'entity_b': c['id'],
                    'similarity': 0.95,
                    'match_fields': {'email': 'exact_match'},
                    'details': {
                        'name_a': email_index[normalized_email]['full_name'],
                        'name_b': c['full_name'],
                        'email': normalized_email
                    }
                })
            else:
                email_index[normalized_email] = c
        
        # Name fuzzy match
        normalized_name = normalize_name(c['full_name'])
        if normalized_name in name_index:
            other = name_index[normalized_name]
            # Check if different person (different company + no shared contact)
            sim = calculate_name_similarity(c['full_name'], other['full_name'])
            if sim >= threshold and c['id'] != other['id']:
                duplicates.append({
                    'entity_type': 'candidate',
                    'entity_a': other['id'],
                    'entity_b': c['id'],
                    'similarity': sim,
                    'match_fields': {'name': 'fuzzy_match', 'score': sim},
                    'details': {
                        'name_a': other['full_name'],
                        'name_b': c['full_name'],
                        'company_a': other['current_company_name'],
                        'company_b': c['current_company_name']
                    }
                })
        name_index[normalized_name] = c
    
    # De-duplicate results (same pair only once)
    seen = set()
    unique_duplicates = []
    for d in duplicates:
        pair = tuple(sorted([d['entity_a'], d['entity_b']]))
        if pair not in seen:
            seen.add(pair)
            unique_duplicates.append(d)
    
    return unique_duplicates

def merge_duplicates(duplicate_id, keep_entity='a'):
    """Merge two duplicate entities, preserving the richer record"""
    dup = get_duplicate(duplicate_id)
    
    if dup['entity_type'] == 'candidate':
        primary = get_candidate(dup['entity_a_id'] if keep_entity == 'a' else dup['entity_b_id'])
        secondary = get_candidate(dup['entity_b_id'] if keep_entity == 'a' else dup['entity_a_id'])
        
        # Merge mandate_candidates links
        for mc in get_mandate_candidates(secondary['id']):
            if not mandate_candidate_exists(primary['id'], mc['mandate_id']):
                update_mandate_candidate(mc['id'], candidate_id=primary['id'])
        
        # Merge profile data (keep non-null, richer values)
        merged = merge_profiles(primary, secondary)
        update_candidate(primary['id'], merged)
        
        # Mark secondary as merged
        update_candidate(secondary['id'], status='merged_into', merged_into_id=primary['id'])
        
        # Log
        log_activity('duplicate_merged', {
            'primary': primary['id'],
            'secondary': secondary['id'],
            'duplicate_id': duplicate_id
        })
    
    update_duplicate_status(duplicate_id, 'merged')
    return primary
```

#### 18.2.3 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/duplicates/scan` | POST | Run duplicate detection |
| `/api/v1/duplicates` | GET | List pending duplicates with filters |
| `/api/v1/duplicates/{id}` | GET | Detail of one duplicate pair |
| `/api/v1/duplicates/{id}/merge` | POST | Merge (keep A or B) |
| `/api/v1/duplicates/{id}/dismiss` | POST | Mark as false positive |
| `/api/v1/duplicates/stats` | GET | Counts by type and status |

### 18.3 Cost Tracking

#### 18.3.1 New Table: `llm_cost_tracking`
```sql
CREATE TABLE llm_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  agent_name TEXT,
  feature TEXT,  -- which feature consumed the LLM call
  model TEXT NOT NULL,  -- flash / pro
  call_count INTEGER DEFAULT 0,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd NUMERIC DEFAULT 0,
  avg_latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, agent_name, feature, model)
);
CREATE INDEX idx_cost_date ON llm_cost_tracking(date);
CREATE INDEX idx_cost_agent ON llm_cost_tracking(agent_name);
```

#### 18.3.2 Cost Tracking Logic
```python
def track_llm_call(agent_name, feature, model, input_tokens, output_tokens, latency_ms):
    """Called after every DeepSeek API call to log cost"""
    
    # DeepSeek pricing (as of 2026-07)
    PRICING = {
        'flash': {'input': 0.00000014, 'output': 0.00000028},  # $/token
        'pro': {'input': 0.00000055, 'output': 0.00000110}
    }
    
    cost = (input_tokens * PRICING[model]['input']) + (output_tokens * PRICING[model]['output'])
    
    today = date.today()
    
    # Upsert daily aggregate
    existing = db.execute("""
        SELECT id FROM llm_cost_tracking 
        WHERE date = %s AND agent_name = %s AND feature = %s AND model = %s
    """, [today, agent_name, feature, model])
    
    if existing:
        db.execute("""
            UPDATE llm_cost_tracking SET 
                call_count = call_count + 1,
                total_input_tokens = total_input_tokens + %s,
                total_output_tokens = total_output_tokens + %s,
                total_cost_usd = total_cost_usd + %s,
                avg_latency_ms = (avg_latency_ms * call_count + %s) / (call_count + 1)
            WHERE id = %s
        """, [input_tokens, output_tokens, cost, latency_ms, existing['id']])
    else:
        db.execute("""
            INSERT INTO llm_cost_tracking 
            (date, agent_name, feature, model, call_count, total_input_tokens, 
             total_output_tokens, total_cost_usd, avg_latency_ms)
            VALUES (%s, %s, %s, %s, 1, %s, %s, %s, %s)
        """, [today, agent_name, feature, model, input_tokens, output_tokens, cost, latency_ms])
    
    # Check budget threshold
    daily_total = get_daily_cost_total(today)
    budget_limit = get_budget_limit()
    
    if daily_total >= budget_limit * 0.9:
        send_alert('cost_warning', f'Daily LLM spend at 90% of budget: ${daily_total:.2f}/${budget_limit:.2f}')
    
    if daily_total >= budget_limit:
        enforce_budget_cap(agent_name)  # Block non-critical LLM calls
    
    return cost

def get_cost_dashboard(period='week'):
    """Cost overview for dashboard"""
    if period == 'week':
        date_from = date.today() - timedelta(days=7)
    elif period == 'month':
        date_from = date.today() - timedelta(days=30)
    
    breakdown = db.execute("""
        SELECT model, SUM(call_count) as calls, SUM(total_cost_usd) as cost,
               SUM(total_input_tokens + total_output_tokens) as tokens
        FROM llm_cost_tracking
        WHERE date >= %s
        GROUP BY model
    """, [date_from])
    
    by_feature = db.execute("""
        SELECT feature, model, SUM(call_count) as calls, SUM(total_cost_usd) as cost
        FROM llm_cost_tracking
        WHERE date >= %s
        GROUP BY feature, model
        ORDER BY cost DESC
    """, [date_from])
    
    daily_trend = db.execute("""
        SELECT date, SUM(total_cost_usd) as daily_cost, SUM(call_count) as daily_calls
        FROM llm_cost_tracking
        WHERE date >= %s
        GROUP BY date
        ORDER BY date
    """, [date_from])
    
    return {
        'period': period,
        'total_cost': sum(r['cost'] for r in breakdown),
        'total_calls': sum(r['calls'] for r in breakdown),
        'total_tokens': sum(r['tokens'] for r in breakdown),
        'by_model': breakdown,
        'by_feature': by_feature,
        'daily_trend': daily_trend,
        'budget_remaining': get_budget_limit() - sum(r['cost'] for r in daily_trend if r['date'] == date.today())
    }
```

#### 18.3.3 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/costs/dashboard` | GET | Cost overview (week/month) |
| `/api/v1/costs/by-feature` | GET | Breakdown by feature |
| `/api/v1/costs/budget` | GET/PUT | Budget limit config |
| `/api/v1/costs/alerts` | GET | Budget alert history |

### 18.4 Quality Gates

#### 18.4.1 Logic
```python
QUALITY_GATES = {
    'deliverable_generation': {
        'checks': [
            {'name': 'data_completeness', 'rule': 'all_required_modules_have_data'},
            {'name': 'no_empty_sections', 'rule': 'every_section_has_content'},
            {'name': 'score_range_valid', 'rule': 'all_scores_0_to_100'},
            {'name': 'no_null_names', 'rule': 'all_candidates_have_names'}
        ]
    },
    'candidate_ingestion': {
        'checks': [
            {'name': 'valid_email_format', 'rule': 'email_matches_regex'},
            {'name': 'name_not_empty', 'rule': 'full_name_length_gte_2'},
            {'name': 'company_not_unknown', 'rule': 'company_name_not_empty_or_unknown'},
            {'name': 'no_exact_duplicates', 'rule': 'not_in_duplicate_candidates'}
        ]
    },
    'market_map_generation': {
        'checks': [
            {'name': 'min_companies', 'rule': 'company_count_gte_5'},
            {'name': 'salary_data_present', 'rule': 'has_benchmark_data'},
            {'name': 'data_freshness', 'rule': 'most_recent_data_within_12_months'},
            {'name': 'region_coverage', 'rule': 'all_target_countries_have_data'}
        ]
    },
    'scoring': {
        'checks': [
            {'name': 'weights_sum_to_1', 'rule': 'abs(sum(weights) - 1.0) < 0.01'},
            {'name': 'no_negative_scores', 'rule': 'all_scores_gte_0'},
            {'name': 'tier_boundaries_valid', 'rule': 'primary_gte_75_secondary_gte_50'},
            {'name': 'grade_distribution_reasonable', 'rule': 'a_grade_pct_lte_20'}
        ]
    }
}

def run_quality_gate(gate_name, context):
    """Run all quality checks for a specific gate"""
    gate = QUALITY_GATES.get(gate_name)
    if not gate:
        return {'error': f'Unknown gate: {gate_name}'}
    
    results = []
    all_passed = True
    
    for check in gate['checks']:
        passed = evaluate_rule(check['rule'], context)
        results.append({
            'check': check['name'],
            'passed': passed,
            'rule': check['rule']
        })
        if not passed:
            all_passed = False
    
    return {
        'gate': gate_name,
        'all_passed': all_passed,
        'checks': results,
        'passed_count': sum(1 for r in results if r['passed']),
        'total_checks': len(results),
        'action': 'proceed' if all_passed else 'review_required'
    }

def evaluate_rule(rule, context):
    """Evaluate a single quality rule against context data"""
    # Implementation of each rule evaluator
    if rule == 'all_scores_0_to_100':
        scores = context.get('scores', [])
        return all(0 <= s <= 100 for s in scores)
    elif rule == 'company_count_gte_5':
        return len(context.get('companies', [])) >= 5
    elif rule == 'email_matches_regex':
        import re
        email = context.get('email', '')
        return bool(re.match(r'^[^@]+@[^@]+\.[^@]+$', email))
    # ... etc
```

#### 18.4.2 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/quality/run` | POST | Run quality gate for specific operation |
| `/api/v1/quality/results` | GET | Recent quality gate results |
| `/api/v1/quality/config` | GET/PUT | Configure gate rules |

### 18.5 Acceptance Criteria

- [ ] NL → SQL handles common queries (mandate list, candidate search, revenue, pipeline stats)
- [ ] NL → SQL blocks all write operations (DROP, DELETE, INSERT, UPDATE)
- [ ] NL → SQL applies RLS — users only see their scope
- [ ] Duplicate detection finds email-exact and name-fuzzy matches across projects
- [ ] Duplicate merge preserves all mandate links and richer profile data
- [ ] Cost tracking captures every DeepSeek API call with <100ms overhead
- [ ] Cost dashboard shows daily/weekly/monthly spend by model and feature
- [ ] Budget enforcement blocks non-critical LLM calls when limit reached
- [ ] Quality gates run before deliverable generation, candidate ingestion, scoring
- [ ] Failed quality checks block operation and log for review

### 18.6 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| NL query | "Show me all VP mandates in Europe" | Valid SELECT with WHERE clause |
| NL query (malicious) | "Drop all tables" | Blocked, error returned |
| Duplicate scan | 500 candidates, 10 known dupes | Finds all 10, similarity scores correct |
| Merge duplicates | Two candidates across 3 mandates | Primary gets all links, secondary marked merged |
| Cost tracking | 100 LLM calls in one day | Dashboard shows correct totals |
| Budget cap | Daily spend hits limit | Non-critical calls blocked, alert sent |
| Quality gate (pass) | Complete deliverable data | All checks pass, proceed |
| Quality gate (fail) | Missing salary data | Flagged, review_required returned |

---

## T19 — Advanced Client Deliverables

**Estimate:** 26-36h
**Dependencies:** T3 (Sourcing Engine), T5 (Output & Deliverables), T9 (Communication Engine)
**Blocks:** None (terminal features)

### Scope

Cover Letter Generator (mandate-specific), Template Editor UI (CRUD for deliverable templates), PDF Deliverable (advanced rendering with charts), Follow-up Sequence Automation (time-based email sequences), Market Intelligence / Salary Bench view (client-facing compensation page).

### 19.1 Cover Letter Generator

#### 19.1.1 Logic
```python
def generate_cover_letter(candidate_id, mandate_id, template_id=None):
    """Generate tailored cover letter for a candidate applying to a specific mandate"""
    
    candidate = get_candidate_detail(candidate_id)
    mandate = get_mandate_detail(mandate_id)
    template = get_template(template_id or 'cover_letter_standard')
    
    prompt = f"""
    Generate a professional cover letter for the following placement:
    
    CANDIDATE:
    - Name: {candidate['full_name']}
    - Current role: {candidate['current_title']} at {candidate['current_company_name']}
    - Key strengths: {candidate['profile_summary']}
    - Years experience: {candidate.get('industry_experience_years', 'N/A')}
    
    POSITION:
    - Title: {mandate['position_title']}
    - Company: {mandate['client_name']}
    - Location: {mandate['location']}
    - Reports to: {mandate.get('reports_to', 'N/A')}
    - Key requirements: {mandate.get('requirements', 'standard executive profile')}
    
    RULES:
    - Professional, confident tone (not arrogant)
    - 3-4 paragraphs, max 350 words
    - Reference specific achievements from candidate's profile
    - Connect candidate's experience to position requirements
    - No salary mention
    - No internal jargon or platform references
    - Sign with candidate's name
    """
    
    letter = call_deepseek_pro(prompt)
    
    # Store
    cover_letter = {
        'id': generate_id(),
        'candidate_id': candidate_id,
        'mandate_id': mandate_id,
        'content': letter,
        'word_count': len(letter.split()),
        'generated_at': now(),
        'template_id': template_id or 'cover_letter_standard'
    }
    
    return cover_letter
```

#### 19.1.2 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cover-letter/generate` | POST | Generate for candidate + mandate |
| `/api/v1/cover-letter/{id}` | GET | Retrieve generated letter |
| `/api/v1/cover-letter/{id}/regenerate` | POST | Re-generate with different tone/angle |

### 19.2 Template Editor UI

#### 19.2.1 Schema Enhancement
```sql
-- Extend existing report_templates table
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS template_content JSONB DEFAULT '{}';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS editable BOOLEAN DEFAULT true;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';
-- Variables define what dynamic content can be injected: {{mandate_title}}, {{candidate_name}}, etc.
```

#### 19.2.2 Template CRUD Logic
```python
def create_template(name, template_type, content, variables, created_by):
    """Create a new deliverable template"""
    
    # Validate variables are properly referenced
    used_vars = extract_template_variables(content)
    valid_vars = get_available_variables(template_type)
    
    invalid_vars = set(used_vars) - set(valid_vars.keys())
    if invalid_vars:
        return {'error': f'Unknown variables: {invalid_vars}. Available: {list(valid_vars.keys())}'}
    
    template = insert_template(
        name=name,
        template_type=template_type,
        template_content=content,
        variables={v: valid_vars[v] for v in used_vars},
        version=1,
        created_by=created_by,
        editable=True
    )
    
    return template

def update_template(template_id, new_content, updated_by):
    """Update template — creates new version, preserves old"""
    old = get_template(template_id)
    
    new_version = insert_template(
        name=old['name'],
        template_type=old['template_type'],
        template_content=new_content,
        variables=extract_and_validate_variables(new_content),
        version=old['version'] + 1,
        created_by=updated_by,
        editable=True,
        supersedes_id=template_id
    )
    
    # Mark old as superseded
    update_template(template_id, status='superseded', superseded_by=new_version['id'])
    
    return new_version

def render_template(template_id, context):
    """Fill template variables with actual data"""
    template = get_template(template_id)
    content = template['template_content']
    
    for var_name, var_source in template['variables'].items():
        value = resolve_variable(var_source, context)
        content = content.replace(f'{{{{{var_name}}}}}', str(value))
    
    return content

AVAILABLE_VARIABLES = {
    'mandate_title': {'source': 'mandate.position_title', 'type': 'text'},
    'client_name': {'source': 'mandate.client_name', 'type': 'text'},
    'candidate_name': {'source': 'candidate.full_name', 'type': 'text'},
    'candidate_current_role': {'source': 'candidate.current_title', 'type': 'text'},
    'date': {'source': 'system.current_date', 'type': 'date'},
    'consultant_name': {'source': 'mandate.consultant.name', 'type': 'text'},
    'pipeline_status': {'source': 'mandate.pipeline_summary', 'type': 'table'},
    'go_no_go_score': {'source': 'mandate.go_no_go.go_score', 'type': 'number'},
    'connection_rate': {'source': 'mandate.pool.connection_rate_t1_pct', 'type': 'number'},
    'total_candidates': {'source': 'mandate.pool.total_candidates', 'type': 'number'},
    'revenue_forecast': {'source': 'mandate.revenue_forecast.expected', 'type': 'currency'},
}
```

#### 19.2.3 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/templates` | GET | List all templates |
| `/api/v1/templates` | POST | Create new template |
| `/api/v1/templates/{id}` | GET | Get template detail |
| `/api/v1/templates/{id}` | PUT | Update (creates new version) |
| `/api/v1/templates/{id}/render` | POST | Render with context data |
| `/api/v1/templates/{id}/versions` | GET | Version history |
| `/api/v1/templates/variables` | GET | Available variables by type |

### 19.3 PDF Deliverable (Advanced)

#### 19.3.1 Enhanced Rendering Pipeline
```python
def generate_advanced_pdf(mandate_id, sections, template_id='grid_standard'):
    """Generate branded PDF with charts, tables, and color coding"""
    
    # Step 1: Assemble data from all relevant modules
    data = assemble_deliverable_data(mandate_id, sections)
    
    # Step 2: Generate chart images
    charts = {}
    if 'pipeline_chart' in sections:
        charts['pipeline_funnel'] = generate_funnel_chart(data['pipeline'])
    if 'comp_chart' in sections:
        charts['comp_comparison'] = generate_bar_chart(data['compensation']['country_benchmarks'])
    if 'tier_pie' in sections:
        charts['tier_distribution'] = generate_pie_chart(data['target_list']['tier_summary'])
    if 'grade_distribution' in sections:
        charts['grades'] = generate_stacked_bar_chart(data['grade_distribution'])
    
    # Step 3: Render HTML with charts embedded
    html = render_template(template_id, {**data, 'charts': charts})
    
    # Step 4: HTML → PDF via headless browser
    pdf_bytes = html_to_pdf(html, {
        'format': 'A4',
        'margins': {'top': '20mm', 'right': '20mm', 'bottom': '20mm', 'left': '20mm'},
        'header': {'html': '<div class="header">GRID Intelligence Report | ' + data['mandate_title'] + '</div>'},
        'footer': {'html': '<div class="footer">LYC Partners | Confidential | Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'},
        'print_background': True
    })
    
    # Step 5: Validate
    page_count = count_pdf_pages(pdf_bytes)
    file_size = len(pdf_bytes)
    
    if page_count < 3:
        log_warning(f'PDF only {page_count} pages — may be incomplete')
    
    # Step 6: Store
    pdf_path = f'/grid_reports/{sanitize(data["mandate_title"])}_GRID_{date.today().strftime("%Y%m%d")}.pdf'
    save_file(pdf_path, pdf_bytes)
    
    return {
        'file_path': pdf_path,
        'page_count': page_count,
        'file_size_bytes': file_size,
        'sections_included': sections,
        'charts_generated': list(charts.keys())
    }

# Chart generation helpers
def generate_funnel_chart(pipeline_data):
    """Pipeline stage funnel visualization"""
    stages = ['Sourced', 'Contacted', 'Screened', 'Interested', 'Interview', 'Offer', 'Delivered']
    values = [pipeline_data.get(s.lower(), 0) for s in stages]
    
    chart = {
        'type': 'funnel',
        'data': [{'stage': s, 'count': v} for s, v in zip(stages, values)],
        'colors': ['#2196F3', '#1976D2', '#1565C0', '#0D47A1', '#01579B', '#004D40', '#1B5E20']
    }
    return render_chart_image(chart)

def generate_bar_chart(country_benchmarks):
    """Compensation comparison bar chart"""
    chart = {
        'type': 'grouped_bar',
        'data': [
            {'country': b['country'], 'P25': b['total_comp_p25'], 'Median': b['total_comp_median'], 'P75': b['total_comp_p75']}
            for b in country_benchmarks
        ],
        'y_axis_label': 'Total Compensation (USD)',
        'colors': {'P25': '#90CAF9', 'Median': '#1976D2', 'P75': '#0D47A1'}
    }
    return render_chart_image(chart)

def generate_pie_chart(tier_summary):
    """Tier distribution pie chart"""
    chart = {
        'type': 'pie',
        'data': [
            {'label': 'Primary', 'value': tier_summary['Primary']['count']},
            {'label': 'Secondary', 'value': tier_summary['Secondary']['count']},
            {'label': 'Stretch', 'value': tier_summary['Stretch']['count']}
        ],
        'colors': {'Primary': '#2E7D32', 'Secondary': '#F9A825', 'Stretch': '#E65100'}
    }
    return render_chart_image(chart)
```

#### 19.3.2 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/pdf/generate` | POST | Generate advanced PDF |
| `/api/v1/pdf/{id}/download` | GET | Download generated PDF |
| `/api/v1/pdf/preview` | POST | Generate preview (first 2 pages) |

### 19.4 Follow-up Sequence Automation

#### 19.4.1 New Table: `follow_up_sequences`
```sql
CREATE TABLE follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id),
  candidate_id UUID REFERENCES candidates(id),
  sequence_name TEXT NOT NULL,
  sequence_type TEXT CHECK (sequence_type IN ('post_interview','post_screening','post_silence','re_engagement','offer_followup')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  steps JSONB NOT NULL,
  current_step INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE follow_up_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL,  -- days after previous step (or start)
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email','feishu','task','notification')),
  template_id TEXT,
  content TEXT,  -- if no template, raw content
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','skipped','failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_fus_mandate ON follow_up_sequences(mandate_id);
CREATE INDEX idx_fustep_sequence ON follow_up_steps(sequence_id, step_number);
```

#### 19.4.2 Sequence Logic
```python
SEQUENCE_PRESETS = {
    'post_interview': {
        'name': 'Post-Interview Follow-up',
        'steps': [
            {'delay_days': 0, 'channel': 'task', 'content': 'Debrief interview with client'},
            {'delay_days': 1, 'channel': 'email', 'template_id': 'thank_you_post_interview', 'content': 'Send thank-you to candidate'},
            {'delay_days': 3, 'channel': 'task', 'content': 'Check if client feedback received'},
            {'delay_days': 7, 'channel': 'email', 'template_id': 'feedback_request_client', 'content': 'Request feedback from client if not received'},
        ]
    },
    'post_silence': {
        'name': 'Re-engage Silent Candidate',
        'steps': [
            {'delay_days': 14, 'channel': 'email', 'template_id': 'check_in_silent', 'content': 'First check-in'},
            {'delay_days': 28, 'channel': 'email', 'template_id': 'opportunity_update', 'content': 'Share new opportunity'},
            {'delay_days': 56, 'channel': 'notification', 'content': 'Flag for manual review — still no response'},
        ]
    },
    'post_screening': {
        'name': 'Post-Screening Pipeline',
        'steps': [
            {'delay_days': 1, 'channel': 'email', 'template_id': 'screening_passed', 'content': 'Confirm next steps with candidate'},
            {'delay_days': 3, 'channel': 'task', 'content': 'Prepare candidate brief for client'},
            {'delay_days': 5, 'channel': 'email', 'template_id': 'client_submission', 'content': 'Submit candidate to client'},
        ]
    }
}

def start_follow_up_sequence(mandate_id, sequence_type, candidate_id=None):
    """Initialize a follow-up sequence"""
    preset = SEQUENCE_PRESETS.get(sequence_type)
    if not preset:
        return {'error': f'Unknown sequence type: {sequence_type}'}
    
    sequence = insert_sequence(
        mandate_id=mandate_id,
        candidate_id=candidate_id,
        sequence_name=preset['name'],
        sequence_type=sequence_type,
        steps=preset['steps']
    )
    
    # Create step records with calculated dates
    for i, step in enumerate(preset['steps']):
        insert_step(
            sequence_id=sequence['id'],
            step_number=i + 1,
            delay_days=step['delay_days'],
            channel=step['channel'],
            template_id=step.get('template_id'),
            content=step.get('content')
        )
    
    # Schedule first step if delay_days = 0
    if preset['steps'][0]['delay_days'] == 0:
        execute_step(sequence['id'], 1)
    
    return sequence

def execute_follow_up_steps():
    """Cron job — runs daily, executes due steps"""
    due_steps = db.execute("""
        SELECT fs.*, fseq.mandate_id, fseq.candidate_id
        FROM follow_up_steps fs
        JOIN follow_up_sequences fseq ON fseq.id = fs.sequence_id
        WHERE fs.status = 'pending'
        AND fseq.status = 'active'
        AND (fseq.started_at + INTERVAL '%s days' * fs.delay_days) <= NOW()
        ORDER BY fseq.id, fs.step_number
    """)
    
    for step in due_steps:
        try:
            if step['channel'] == 'email':
                content = render_template(step['template_id'], get_context(step)) if step['template_id'] else step['content']
                send_email(
                    to=get_recipient(step),
                    subject=get_subject(step),
                    body=content
                )
            elif step['channel'] == 'task':
                create_task(
                    mandate_id=step['mandate_id'],
                    title=step['content'],
                    source='follow_up_sequence'
                )
            elif step['channel'] == 'notification':
                send_notification(
                    mandate_id=step['mandate_id'],
                    message=step['content']
                )
            
            update_step_status(step['id'], 'sent')
            
            # Check if sequence is complete
            remaining = count_pending_steps(step['sequence_id'])
            if remaining == 0:
                update_sequence_status(step['sequence_id'], 'completed')
                
        except Exception as e:
            update_step_status(step['id'], 'failed', error=str(e))
```

#### 19.4.3 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/follow-up/start` | POST | Start a sequence |
| `/api/v1/follow-up/{id}` | GET | Sequence status + steps |
| `/api/v1/follow-up/{id}/pause` | POST | Pause sequence |
| `/api/v1/follow-up/{id}/cancel` | POST | Cancel sequence |
| `/api/v1/follow-up/mandate/{mandate_id}` | GET | All sequences for mandate |
| `/api/v1/follow-up/templates` | GET | Available presets |

### 19.5 Market Intelligence / Salary Bench View

#### 19.5.1 Logic
```python
def get_client_salary_view(mandate_id):
    """Client-facing compensation intelligence (no internal data exposed)"""
    mandate = get_mandate(mandate_id)
    
    # Query salary benchmarks (public data only)
    benchmarks = db.execute("""
        SELECT country, 
               MIN(total_comp_min_usd) as min_comp,
               PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY (total_comp_min_usd + total_comp_max_usd) / 2) as p25,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (total_comp_min_usd + total_comp_max_usd) / 2) as median,
               PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (total_comp_min_usd + total_comp_max_usd) / 2) as p75,
               MAX(total_comp_max_usd) as max_comp,
               COUNT(*) as data_points
        FROM salary_benchmarks
        WHERE role_title ILIKE %s
        AND seniority = %s
        AND region = %s
        GROUP BY country
        ORDER BY median DESC
    """, [f'%{mandate["role_title"]}%', mandate['seniority'], mandate['region']])
    
    # Client budget positioning
    budget_positioning = None
    if mandate.get('salary_range_min') and mandate.get('salary_range_max'):
        budget_min = mandate['salary_range_min']
        budget_max = mandate['salary_range_max']
        
        for b in benchmarks:
            if budget_min <= b['median'] <= budget_max:
                b['budget_fit'] = 'competitive'
            elif budget_max < b['p25']:
                b['budget_fit'] = 'below_market'
            elif budget_min > b['p75']:
                b['budget_fit'] = 'above_market'
            else:
                b['budget_fit'] = 'partial_fit'
    
    return {
        'role': mandate['role_title'],
        'seniority': mandate['seniority'],
        'region': mandate['region'],
        'benchmarks': benchmarks,
        'client_budget': {
            'min': mandate.get('salary_range_min'),
            'max': mandate.get('salary_range_max'),
            'positioning': budget_positioning
        },
        'insights': generate_comp_insights(benchmarks, mandate)
    }

def generate_comp_insights(benchmarks, mandate):
    """Generate human-readable compensation insights"""
    if not benchmarks:
        return ['Insufficient salary data for this role and region.']
    
    insights = []
    cheapest = min(benchmarks, key=lambda b: b['median'])
    most_expensive = max(benchmarks, key=lambda b: b['median'])
    
    insights.append(f"Most cost-effective market: {cheapest['country']} (median: ${cheapest['median']:,.0f})")
    insights.append(f"Most expensive market: {most_expensive['country']} (median: ${most_expensive['median']:,.0f})")
    
    spread = most_expensive['median'] - cheapest['median']
    insights.append(f"Geographic spread: ${spread:,.0f} difference between cheapest and most expensive markets")
    
    if mandate.get('salary_range_max'):
        affordable_count = sum(1 for b in benchmarks if b['median'] <= mandate['salary_range_max'])
        insights.append(f"Budget covers median comp in {affordable_count}/{len(benchmarks)} markets")
    
    return insights
```

#### 19.5.2 API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/market-intelligence/{mandate_id}` | GET | Client-safe compensation view |
| `/api/v1/market-intelligence/{mandate_id}/export` | GET | Export as PDF/CSV |

### 19.6 Acceptance Criteria

- [ ] Cover letter generates 300-350 word professional letter in <10s
- [ ] Template editor supports create, edit, version, and render
- [ ] PDF includes charts (funnel, bar, pie) embedded correctly
- [ ] PDF follows LYC branding (logo, fonts, footer, page numbers)
- [ ] Follow-up sequences execute on schedule (daily cron)
- [ ] Follow-up emails use branded templates
- [ ] Sequence pause/cancel works without losing step history
- [ ] Salary bench view shows no internal data (candidates, pipeline, fees)
- [ ] Salary insights auto-generate for any mandate with benchmark data

### 19.7 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Cover letter | VP candidate, chemicals mandate | 300+ words, references industry experience |
| Template edit | Modify cover letter template | New version created, old preserved |
| PDF with charts | Full GRID report | 12-16 pages, all charts render, <2s generation |
| Follow-up (day 0) | Start post-interview sequence | Task created immediately, email scheduled day 1 |
| Follow-up (cron) | 3 sequences, 7 due steps | All 7 execute, statuses update |
| Salary view | Mandate with €180K-€260K budget | Benchmarks + positioning + insights |

---

## T20 — Strategic Intelligence Suite

**Estimate:** 34-44h
**Dependencies:** T7 (Revenue Forecast), T12 (Scoring Calibration), T16 (Leader Portal P1)
**Blocks:** None (terminal features — heaviest ticket in Phase 3)

### Scope

Strategic Opportunity Scanner, Client Relationship Advisor, Market Entry Advisor, Cross-Project Pattern Recognition, Success Portrait Generator, Strategic Recommendations Engine.

### 20.1 New Tables

```sql
CREATE TABLE strategic_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_type TEXT CHECK (opportunity_type IN ('upsell','cross_sell','market_expansion','talent_pool','competitor_weakness','industry_trend')),
  title TEXT NOT NULL,
  description TEXT,
  related_org_id UUID REFERENCES organizations(id),
  related_mandate_id UUID REFERENCES mandates(id),
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1),
  potential_revenue_usd NUMERIC,
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified','evaluating','pursuing','dismissed','converted')),
  evidence JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE success_portraits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES industries(id),
  seniority TEXT,
  region TEXT,
  portrait_data JSONB NOT NULL,
  sample_size INTEGER NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE strategic_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT CHECK (recommendation_type IN ('pricing','resource_allocation','market_focus','process_improvement','hiring','client_retention')),
  title TEXT NOT NULL,
  rationale TEXT,
  evidence JSONB DEFAULT '[]',
  priority TEXT CHECK (priority IN ('critical','high','medium','low')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 20.2 Strategic Opportunity Scanner

```python
def scan_opportunities():
    """Analyze current portfolio to identify strategic opportunities"""
    opportunities = []
    
    # 1. Upsell opportunities — clients with only 1 mandate, could expand
    single_mandate_clients = db.execute("""
        SELECT o.id, o.name, COUNT(m.id) as mandate_count, o.industry
        FROM organizations o
        JOIN mandates m ON m.org_id = o.id
        WHERE o.status = 'active'
        GROUP BY o.id
        HAVING COUNT(m.id) = 1
    """)
    for client in single_mandate_clients:
        opportunities.append({
            'type': 'upsell',
            'title': f"Expand {client['name']} engagement",
            'org_id': client['id'],
            'confidence': 0.4,
            'evidence': [f"Only {client['mandate_count']} active mandate. Industry: {client['industry']}"],
            'suggested_action': 'Review org structure for additional search needs'
        })
    
    # 2. Cross-sell — mandates in similar industries that could benefit from shared candidates
    industry_pairs = find_candidate_overlap_opportunities()
    for pair in industry_pairs:
        opportunities.append({
            'type': 'cross_sell',
            'title': f"Shared talent pool: {pair['industry_a']} ↔ {pair['industry_b']}",
            'confidence': pair['overlap_score'],
            'evidence': [f"{pair['shared_candidates']} candidates viable in both industries"]
        })
    
    # 3. Market expansion — industries with high growth + thin talent = premium pricing
    high_growth_thin = db.execute("""
        SELECT i.id, i.name, i.growth_rate, COUNT(DISTINCT m.id) as mandate_count
        FROM industries i
        LEFT JOIN mandates m ON m.industry_id = i.id
        WHERE i.growth_rate > 8
        GROUP BY i.id
        HAVING COUNT(DISTINCT m.id) < 3
    """)
    for ind in high_growth_thin:
        opportunities.append({
            'type': 'market_expansion',
            'title': f"Premium positioning: {ind['name']}",
            'confidence': 0.6,
            'evidence': [
                f"Growth rate: {ind['growth_rate']}% CAGR",
                f"Only {ind['mandate_count']} mandates — underserved market"
            ],
            'potential_revenue': ind['growth_rate'] * 5000  # rough estimate
        })
    
    # 4. Competitor weakness — companies with recent layoffs or restructuring
    # (data from company intelligence feeds)
    
    return {
        'total_opportunities': len(opportunities),
        'by_type': count_by_type(opportunities),
        'top_5': sorted(opportunities, key=lambda o: o['confidence'], reverse=True)[:5],
        'all': opportunities
    }
```

### 20.3 Client Relationship Advisor

```python
def client_relationship_advisor(org_id):
    """Provide strategic advice for a specific client relationship"""
    org = get_organization(org_id)
    mandates = get_mandates_for_org(org_id)
    history = get_interaction_history(org_id, months=12)
    
    # Analyze relationship health
    health_indicators = {
        'mandate_volume': len(mandates),
        'mandate_trend': calculate_mandate_trend(mandates),  # increasing/stable/declining
        'avg_fill_time': avg_fill_time(mandates),
        'repeat_rate': len([m for m in mandates if m.get('repeat_business')]) / max(len(mandates), 1),
        'fee_realization': calculate_fee_realization(mandates),  # actual fee / proposed fee
        'response_time': avg_response_time(history),
        'satisfaction_signals': extract_satisfaction_signals(history)
    }
    
    # Generate advice
    advice = []
    
    if health_indicators['mandate_trend'] == 'declining':
        advice.append({
            'priority': 'high',
            'type': 'retention_risk',
            'message': 'Mandate volume declining over past 6 months. Schedule executive check-in.',
            'action': 'Book relationship review meeting within 2 weeks'
        })
    
    if health_indicators['fee_realization'] < 0.85:
        advice.append({
            'priority': 'medium',
            'type': 'pricing_pressure',
            'message': f"Fee realization at {health_indicators['fee_realization']:.0%}. Client may be pushing on pricing.",
            'action': 'Review fee structure and value proposition before next mandate'
        })
    
    if health_indicators['repeat_rate'] < 0.3 and len(mandates) >= 3:
        advice.append({
            'priority': 'medium',
            'type': 'relationship_depth',
            'message': 'Low repeat rate suggests transactional relationship. Deepen engagement.',
            'action': 'Propose retained engagement or talent mapping project'
        })
    
    # Upsell opportunity
    if health_indicators['mandate_volume'] >= 2 and org.get('industry'):
        adjacent_roles = find_adjacent_search_needs(org['industry'])
        if adjacent_roles:
            advice.append({
                'priority': 'low',
                'type': 'growth',
                'message': f"Client may benefit from {adjacent_roles[0]} search based on industry patterns.",
                'action': f'Prepare market intelligence brief on {adjacent_roles[0]} talent landscape'
            })
    
    return {
        'org_id': org_id,
        'org_name': org['name'],
        'health_indicators': health_indicators,
        'overall_health': score_relationship_health(health_indicators),
        'advice': advice,
        'next_actions': [a['action'] for a in advice if a['priority'] in ('high', 'medium')]
    }
```

### 20.4 Market Entry Advisor

```python
def market_entry_advisor(industry_id, region):
    """Advise on entering a new market (industry × region)"""
    
    industry = get_industry(industry_id)
    
    # Gather market intelligence
    market_data = {
        'market_size': industry.get('market_size_usd'),
        'growth_rate': industry.get('growth_rate'),
        'existing_mandates': count_mandates_in_market(industry_id, region),
        'existing_clients': count_clients_in_market(industry_id, region),
        'competitor_presence': estimate_competitor_presence(industry_id, region),
        'talent_availability': get_talent_availability(industry_id, region),
        'comp_benchmarks': get_comp_benchmarks(industry_id, region)
    }
    
    # Scoring
    market_attractiveness = 0
    market_attractiveness += min(market_data['market_size'] / 1e9, 25)  # up to 25 pts
    market_attractiveness += min(market_data['growth_rate'] * 2.5, 25)  # up to 25 pts
    market_attractiveness += (30 - market_data['competitor_presence'] * 5)  # less competition = more pts
    market_attractiveness += market_data['talent_availability'] * 25  # up to 25 pts
    
    # Entry recommendation
    if market_attractiveness >= 70:
        recommendation = 'STRONG_ENTRY'
        rationale = 'Market is large, growing, with available talent and limited competition.'
    elif market_attractiveness >= 50:
        recommendation = 'CONDITIONAL_ENTRY'
        rationale = 'Market shows promise but requires specific positioning or partnerships.'
    elif market_attractiveness >= 30:
        recommendation = 'WATCH_AND_WAIT'
        rationale = 'Market is developing. Monitor for 6-12 months before committing resources.'
    else:
        recommendation = 'SKIP'
        rationale = 'Market does not justify investment at this time.'
    
    return {
        'industry': industry['name'],
        'region': region,
        'market_data': market_data,
        'attractiveness_score': round(market_attractiveness),
        'recommendation': recommendation,
        'rationale': rationale,
        'estimated_investment': estimate_entry_cost(market_data),
        'estimated_revenue_potential': estimate_revenue_potential(market_data),
        'risk_factors': identify_risk_factors(market_data),
        'suggested_approach': suggest_entry_strategy(market_data, recommendation)
    }
```

### 20.5 Cross-Project Pattern Recognition

```python
def recognize_patterns():
    """Identify recurring patterns across all mandates and projects"""
    
    patterns = []
    
    # Pattern 1: Role fill-time patterns
    role_fill_times = db.execute("""
        SELECT role_title, seniority, region,
               AVG(EXTRACT(DAY FROM delivered_at - go_signal_date)) as avg_fill_days,
               COUNT(*) as sample_size,
               STDDEV(EXTRACT(DAY FROM delivered_at - go_signal_date)) as std_dev
        FROM mandates
        WHERE status = 'closed' AND delivered_at IS NOT NULL
        GROUP BY role_title, seniority, region
        HAVING COUNT(*) >= 3
    """)
    for r in role_fill_times:
        if r['std_dev'] < r['avg_fill_days'] * 0.3:  # low variance = predictable
            patterns.append({
                'type': 'fill_time_pattern',
                'pattern': f"{r['seniority']} {r['role_title']} in {r['region']}: avg {r['avg_fill_days']:.0f} days",
                'confidence': min(r['sample_size'] / 10, 1.0),
                'sample_size': r['sample_size'],
                'actionable': True,
                'recommendation': f"Set client expectation: {r['avg_fill_days']:.0f} days typical fill time"
            })
    
    # Pattern 2: Source effectiveness — which sourcing channels produce best candidates
    source_effectiveness = db.execute("""
        SELECT mc.source, mc.grade, COUNT(*) as count,
               AVG(mc.fit_score) as avg_fit
        FROM mandate_candidates mc
        WHERE mc.grade IN ('A', 'B')
        GROUP BY mc.source, mc.grade
        ORDER BY avg_fit DESC
    """)
    if source_effectiveness:
        best_source = source_effectiveness[0]
        patterns.append({
            'type': 'source_effectiveness',
            'pattern': f"Best A/B candidates come from {best_source['source']} (avg fit: {best_source['avg_fit']:.0f})",
            'confidence': 0.7,
            'actionable': True,
            'recommendation': f"Allocate more resources to {best_source['source']} sourcing"
        })
    
    # Pattern 3: Industry-consultant fit — which consultants perform best in which industries
    consultant_industry = db.execute("""
        SELECT m.assigned_consultants, i.name as industry,
               COUNT(*) as mandates,
               AVG(EXTRACT(DAY FROM m.delivered_at - m.go_signal_date)) as avg_fill,
               SUM(CASE WHEN m.status = 'closed' THEN 1 ELSE 0 END)::float / COUNT(*) as close_rate
        FROM mandates m
        JOIN organizations o ON o.id = m.org_id
        JOIN industries i ON i.id = o.industry_id
        WHERE m.assigned_consultants IS NOT NULL
        GROUP BY m.assigned_consultants, i.name
        HAVING COUNT(*) >= 2
    """)
    for ci in consultant_industry:
        if ci['close_rate'] > 0.7:
            patterns.append({
                'type': 'consultant_industry_fit',
                'pattern': f"{ci['assigned_consultants']} excels in {ci['industry']} ({ci['close_rate']:.0%} close rate)",
                'confidence': min(ci['mandates'] / 5, 1.0),
                'actionable': True,
                'recommendation': f"Prioritize {ci['assigned_consultants']} for {ci['industry']} mandates"
            })
    
    return {
        'total_patterns': len(patterns),
        'actionable_patterns': [p for p in patterns if p['actionable']],
        'patterns': patterns,
        'by_type': count_by_type(patterns)
    }
```

### 20.6 Success Portrait Generator

```python
def generate_success_portrait(industry_id, seniority, region):
    """What does a successful placement look like in this market?"""
    
    # Find all successful placements (closed mandates) matching criteria
    successes = db.execute("""
        SELECT m.*, mc.candidate_id, mc.grade, mc.fit_score, mc.source,
               c.current_title, c.current_company_name, c.current_country,
               EXTRACT(DAY FROM m.delivered_at - m.go_signal_date) as fill_days,
               m.fee_amount as actual_fee
        FROM mandates m
        JOIN organizations o ON o.id = m.org_id
        JOIN mandate_candidates mc ON mc.mandate_id = m.id AND mc.pipeline_stage = 'delivered'
        JOIN candidates c ON c.id = mc.candidate_id
        WHERE o.industry_id = %s
        AND m.seniority = %s
        AND m.region = %s
        AND m.status = 'closed'
    """, [industry_id, seniority, region])
    
    if len(successes) < 3:
        return {
            'error': 'Insufficient successful placements for this market segment',
            'sample_size': len(successes),
            'minimum_required': 3
        }
    
    # Build portrait
    portrait = {
        'industry': get_industry(industry_id)['name'],
        'seniority': seniority,
        'region': region,
        'sample_size': len(successes),
        'typical_candidate': {
            'avg_fit_score': avg(s['fit_score'] for s in successes),
            'grade_distribution': grade_distribution(successes),
            'most_common_source': mode(s['source'] for s in successes),
            'typical_background': common_title_patterns(successes),
            'typical_company_type': common_company_types(successes)
        },
        'typical_process': {
            'avg_fill_days': avg(s['fill_days'] for s in successes),
            'median_fill_days': median(s['fill_days'] for s in successes),
            'typical_pipeline': {
                'avg_candidates_sourced': 80,  # from historical data
                'avg_screened': 30,
                'avg_interviewed': 8,
                'avg_offered': 2
            }
        },
        'typical_commercials': {
            'avg_fee': avg(s['actual_fee'] for s in successes),
            'fee_range': [min(s['actual_fee'] for s in successes), max(s['actual_fee'] for s in successes)],
            'avg_candidate_comp': estimate_avg_candidate_comp(successes)
        },
        'success_factors': rank_success_factors(successes),
        'confidence': min(len(successes) / 10, 1.0)
    }
    
    # Store for reuse
    insert_success_portrait(industry_id, seniority, region, portrait, len(successes))
    
    return portrait

def rank_success_factors(successes):
    """What factors correlate with faster/better placements?"""
    factors = []
    
    # Connection rate impact
    connected = [s for s in successes if s.get('is_connected')]
    not_connected = [s for s in successes if not s.get('is_connected')]
    if connected and not_connected:
        connected_fill = avg(s['fill_days'] for s in connected)
        not_connected_fill = avg(s['fill_days'] for s in not_connected)
        factors.append({
            'factor': 'Warm connections',
            'impact': f"Connected candidates fill {connected_fill:.0f} vs {not_connected_fill:.0f} days ({((not_connected_fill/connected_fill)-1)*100:.0f}% faster)",
            'strength': abs(connected_fill - not_connected_fill) / not_connected_fill
        })
    
    # Source impact
    # Grade impact
    # ... etc
    
    return sorted(factors, key=lambda f: f['strength'], reverse=True)
```

### 20.7 Strategic Recommendations Engine

```python
def generate_strategic_recommendations():
    """Platform-wide strategic recommendations based on all available data"""
    recommendations = []
    
    # 1. Pricing recommendations
    fee_analysis = analyze_fee_realization()
    if fee_analysis['avg_realization'] < 0.85:
        recommendations.append({
            'type': 'pricing',
            'priority': 'high',
            'title': 'Fee realization below target',
            'rationale': f"Average fee realization at {fee_analysis['avg_realization']:.0%} (target: 90%+). Clients consistently negotiate down.",
            'evidence': fee_analysis['details'],
            'action': 'Review fee proposal templates. Add value articulation section. Consider tiered pricing.'
        })
    
    # 2. Resource allocation
    workload = analyze_consultant_workload()
    if workload['imbalance_score'] > 0.4:
        recommendations.append({
            'type': 'resource_allocation',
            'priority': 'high',
            'title': 'Workload imbalance detected',
            'rationale': f"Top consultant handling {workload['max_load']:.0f}% more mandates than bottom consultant.",
            'evidence': workload['by_consultant'],
            'action': 'Rebalance mandate assignments. Consider hiring or redistributing pipeline.'
        })
    
    # 3. Market focus
    market_performance = analyze_market_performance()
    best_markets = market_performance['top_3']
    worst_markets = market_performance['bottom_3']
    
    recommendations.append({
        'type': 'market_focus',
        'priority': 'medium',
        'title': 'Double down on strongest markets',
        'rationale': f"{best_markets[0]['industry']} × {best_markets[0]['region']} has highest fill rate and fee realization.",
        'evidence': market_performance['details'],
        'action': f"Increase BD efforts in {best_markets[0]['industry']}. Reduce investment in {worst_markets[0]['industry']}."
    })
    
    # 4. Process improvement
    bottleneck = identify_pipeline_bottleneck()
    if bottleneck:
        recommendations.append({
            'type': 'process_improvement',
            'priority': bottleneck['severity'],
            'title': f"Pipeline bottleneck: {bottleneck['stage']}",
            'rationale': bottleneck['rationale'],
            'evidence': bottleneck['data'],
            'action': bottleneck['recommendation']
        })
    
    # 5. Client retention
    at_risk_clients = identify_at_risk_clients()
    if at_risk_clients:
        recommendations.append({
            'type': 'client_retention',
            'priority': 'high',
            'title': f"{len(at_risk_clients)} at-risk clients identified",
            'rationale': 'Clients showing declining engagement patterns.',
            'evidence': [{'client': c['name'], 'signal': c['signal']} for c in at_risk_clients],
            'action': 'Schedule executive reviews with top 3 at-risk clients within 2 weeks.'
        })
    
    return {
        'total': len(recommendations),
        'by_priority': count_by_priority(recommendations),
        'recommendations': sorted(recommendations, key=lambda r: {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}[r['priority']]),
        'generated_at': now()
    }
```

### 20.8 API Endpoints (All T20 Features)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/strategic/opportunities` | GET | Scan for opportunities |
| `/api/v1/strategic/opportunities/{id}` | PUT | Update status |
| `/api/v1/strategic/client/{org_id}/advisor` | GET | Client relationship advice |
| `/api/v1/strategic/market-entry` | POST | Market entry analysis |
| `/api/v1/strategic/patterns` | GET | Cross-project patterns |
| `/api/v1/strategic/portrait` | POST | Success portrait |
| `/api/v1/strategic/recommendations` | GET | Strategic recommendations |
| `/api/v1/strategic/recommendations/{id}` | PUT | Update status |

### 20.9 Acceptance Criteria

- [ ] Opportunity scanner identifies ≥3 opportunity types from current data
- [ ] Client advisor provides actionable advice (not just data)
- [ ] Market entry advisor produces clear GO/CONDITIONAL/WAIT/SKIP recommendation
- [ ] Pattern recognition requires ≥3 data points per pattern for statistical validity
- [ ] Success portrait requires ≥3 closed mandates; flags insufficient data otherwise
- [ ] Strategic recommendations pull from real data, not static rules
- [ ] All recommendations have clear "action" field — no vague advice
- [ ] Patterns update automatically as new mandates close (weekly refresh)

### 20.10 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Opportunity scan | Portfolio with 5 single-mandate clients | ≥3 upsell opportunities identified |
| Client advisor | Client with declining mandate volume | "Retention risk" advice, priority=high |
| Market entry | High-growth industry, low competition | STRONG_ENTRY or CONDITIONAL_ENTRY |
| Pattern recognition | 20 closed mandates | ≥2 actionable patterns |
| Success portrait | Industry with 8 closed placements | Full portrait with confidence ≥0.8 |
| Recommendations | Imbalanced workload | Resource allocation recommendation |

---

## T21 — Coaching Portal Completion (5 P2 Features)

**Estimate:** 13-18h
**Dependencies:** T6 (DEX AI Core), T14 (Coaching Portal P1)
**Blocks:** None (terminal features)

### Scope

Career Positioning, Learning Recommender, Reflection Prompts, Mock Interview Coach, Confidence Tracker.

### 21.1 Career Positioning

```python
def career_positioning(coachee_id):
    """Analyze where a coachee stands in their career trajectory"""
    coachee = get_coachee(coachee_id)
    assessments = get_assessments(coachee_id)
    sessions = get_coaching_sessions(coachee_id)
    
    prompt = f"""
    Based on the following coaching data, provide a career positioning analysis:
    
    COACHEE: {coachee['name']}, current role: {coachee['current_role']}, 
    years experience: {coachee.get('years_experience')}, industry: {coachee.get('industry')}
    
    ASSESSMENT RESULTS: {json.dumps(assessments)}
    COACHING SESSIONS COMPLETED: {len(sessions)}
    KEY THEMES FROM SESSIONS: {extract_themes(sessions)}
    
    Provide:
    1. Current positioning (where they are now)
    2. Potential trajectories (3 realistic next moves)
    3. Gaps to address for each trajectory
    4. Recommended timeline for next career move
    5. Market readiness score (0-100)
    """
    
    return call_deepseek_pro(prompt)
```

### 21.2 Learning Recommender

```python
def recommend_learning(coachee_id):
    """Recommend specific learning resources based on skill gaps and goals"""
    skill_gaps = get_skill_gap_analysis(coachee_id)
    goals = get_coaching_goals(coachee_id)
    learning_history = get_completed_learning(coachee_id)
    
    # Map skill gaps to learning categories
    LEARNING_MAP = {
        'leadership': ['executive coaching', 'leadership program', 'management training'],
        'strategic_thinking': ['strategy workshops', 'business school modules', 'case study programs'],
        'digital_fluency': ['digital transformation courses', 'tech leadership programs'],
        'communication': ['executive presence coaching', 'presentation skills', 'storytelling workshops'],
        'industry_knowledge': ['industry certifications', 'conference participation', 'peer networks'],
        'financial_acumen': ['finance for executives', 'P&L management', 'investor relations']
    }
    
    recommendations = []
    for gap in skill_gaps['top_gaps']:
        category = gap['skill_area']
        resources = LEARNING_MAP.get(category, ['general executive development'])
        
        for resource in resources[:2]:  # Top 2 per gap
            recommendations.append({
                'skill_gap': gap['skill_area'],
                'gap_severity': gap['severity'],
                'recommendation': resource,
                'rationale': f"Addresses {gap['skill_area']} gap identified in assessment",
                'priority': gap['priority'],
                'estimated_timeframe': estimate_timeframe(resource),
                'completed': any(resource in h.get('type', '') for h in learning_history)
            })
    
    # Remove already completed
    recommendations = [r for r in recommendations if not r['completed']]
    
    return {
        'coachee_id': coachee_id,
        'total_recommendations': len(recommendations),
        'recommendations': sorted(recommendations, key=lambda r: r['priority']),
        'skill_gaps_addressed': len(set(r['skill_gap'] for r in recommendations))
    }
```

### 21.3 Reflection Prompts

```python
def generate_reflection_prompts(coachee_id, session_context=None):
    """Generate personalized reflection prompts between coaching sessions"""
    coachee = get_coachee(coachee_id)
    last_session = get_last_session(coachee_id)
    goals = get_coaching_goals(coachee_id)
    
    prompt = f"""
    Generate 3 personalized reflection prompts for this coachee:
    
    Coachee: {coachee['name']}
    Current goals: {json.dumps([g['description'] for g in goals])}
    Last session focus: {last_session.get('topics_discussed', 'N/A') if last_session else 'First session'}
    Last session homework: {last_session.get('homework', 'N/A') if last_session else 'N/A'}
    
    Each prompt should:
    1. Connect to their active coaching goals
    2. Reference their last session where relevant
    3. Be thought-provoking but not overwhelming
    4. Be answerable in 5-10 minutes of journaling
    5. Build self-awareness progressively
    """
    
    prompts = call_deepseek_pro(prompt)
    
    # Store for tracking
    for p in prompts:
        insert_reflection_prompt(coachee_id, p, next_session_date(coachee_id))
    
    return prompts
```

### 21.4 Mock Interview Coach

```python
def mock_interview_coach(coachee_id, target_role=None):
    """Conduct a mock interview simulation with AI"""
    coachee = get_coachee(coachee_id)
    
    if target_role:
        context = f"Role: {target_role['title']} at {target_role.get('company', 'a leading company')}"
    else:
        context = f"Generic {coachee.get('target_level', 'executive')} role in {coachee.get('industry', 'their industry')}"
    
    prompt = f"""
    You are conducting a mock executive interview. 
    
    CANDIDATE: {coachee['name']}, current role: {coachee.get('current_role')}
    TARGET: {context}
    
    Generate 5 interview questions that:
    1. Progress from introductory to challenging
    2. Include at least 1 behavioral question (STAR format)
    3. Include at least 1 strategic/situational question
    4. Include at least 1 question that tests their known weakness area
    5. Are realistic for executive-level interviews
    
    For each question, also provide:
    - What the interviewer is really looking for
    - Common weak answers to avoid
    - Tips for a strong response
    """
    
    interview = call_deepseek_pro(prompt)
    
    # Store mock interview session
    session = insert_mock_interview(coachee_id, interview, target_role)
    
    return {
        'session_id': session['id'],
        'questions': interview['questions'],
        'tips': interview.get('general_tips', []),
        'encouragement': f"Take your time with each question. Remember to use specific examples from your experience."
    }
```

### 21.5 Confidence Tracker

```python
def update_confidence_tracker(coachee_id, session_data):
    """Track confidence levels across coaching sessions"""
    
    # Extract confidence signals from session
    confidence_scores = {}
    
    # Self-reported (from session notes)
    if session_data.get('self_assessment'):
        confidence_scores['self_reported'] = session_data['self_assessment'].get('confidence_level')
    
    # Behavioral indicators (from coach notes)
    if session_data.get('coach_observations'):
        indicators = {
            'body_language': session_data['coach_observations'].get('confidence_signals', {}).get('body_language'),
            'voice': session_data['coach_observations'].get('confidence_signals', {}).get('voice_quality'),
            'specificity': session_data['coach_observations'].get('confidence_signals', {}).get('answer_specificity'),
        }
        confidence_scores['behavioral'] = {k: v for k, v in indicators.items() if v is not None}
    
    # Goal achievement momentum
    recent_goals = get_completed_goals(coachee_id, last_n=5)
    completion_rate = len([g for g in recent_goals if g['status'] == 'completed']) / max(len(recent_goals), 1)
    confidence_scores['momentum'] = completion_rate * 100
    
    # Compute composite
    composite = compute_confidence_composite(confidence_scores)
    
    # Store
    insert_confidence_entry(
        coachee_id=coachee_id,
        session_id=session_data.get('session_id'),
        scores=confidence_scores,
        composite=composite,
        date=date.today()
    )
    
    # Trend
    history = get_confidence_history(coachee_id)
    trend = calculate_confidence_trend(history)
    
    return {
        'current_composite': composite,
        'trend': trend,  # 'rising', 'stable', 'declining'
        'breakdown': confidence_scores,
        'history_points': len(history),
        'insight': generate_confidence_insight(composite, trend, history)
    }
```

### 21.6 API Endpoints (All T21)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/coaching/{coachee_id}/positioning` | GET | Career positioning analysis |
| `/api/v1/coaching/{coachee_id}/learning` | GET | Learning recommendations |
| `/api/v1/coaching/{coachee_id}/reflection` | GET/POST | Reflection prompts |
| `/api/v1/coaching/{coachee_id}/mock-interview` | POST | Start mock interview |
| `/api/v1/coaching/{coachee_id}/mock-interview/{id}/answer` | POST | Submit answer for feedback |
| `/api/v1/coaching/{coachee_id}/confidence` | GET | Confidence tracker |
| `/api/v1/coaching/{coachee_id}/confidence/trend` | GET | Confidence trend over time |

### 21.7 Acceptance Criteria

- [ ] Career positioning generates 3 realistic trajectories with gap analysis
- [ ] Learning recommender maps skill gaps to specific resources
- [ ] Reflection prompts are personalized to last session + active goals
- [ ] Mock interview generates 5 progressive questions with tips
- [ ] Confidence tracker maintains historical trend across sessions
- [ ] All features use DeepSeek API (pro model for interview simulation, flash for others)

### 21.8 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Career positioning | Coachee with 5 sessions, 3 assessments | 3 trajectories, market readiness score |
| Learning recommender | 3 skill gaps identified | ≥4 learning recommendations |
| Reflection prompts | After session about leadership challenge | 3 prompts referencing the challenge |
| Mock interview | VP Sales target | 5 questions, 1 behavioral, 1 strategic |
| Confidence tracker | 4 sessions of data | Trend direction, composite score |

---

## T22 — Candidate Portal Completion (6 P2 Features)

**Estimate:** 16-23h
**Dependencies:** T6 (DEX AI Core), T15 (Candidate Portal P1)
**Blocks:** None (terminal features)

### Scope

Cover Letter Generator (candidate-side), Career Path Advisor, Salary Benchmark View, Opportunity Matcher, Rejection Resilience Coach, Networking Suggestions.

### 22.1 Cover Letter Generator (Candidate Side)

```python
def candidate_cover_letter(candidate_id, job_id=None):
    """Generate cover letter from the candidate's perspective"""
    candidate = get_candidate_profile(candidate_id)
    
    if job_id:
        job = get_opportunity(job_id)
        target = f"{job['title']} at {job['company_name']}"
        job_context = f"Position requirements: {job.get('requirements', 'N/A')}"
    else:
        target = "a general executive application"
        job_context = ""
    
    prompt = f"""
    Generate a professional cover letter:
    
    CANDIDATE: {candidate['full_name']}
    Current role: {candidate.get('current_title', 'N/A')}
    Key experience: {candidate.get('experience_summary', 'N/A')}
    Strengths: {candidate.get('top_strengths', [])}
    
    TARGET: {target}
    {job_context}
    
    RULES:
    - 250-300 words, 3 paragraphs
    - Professional but authentic tone
    - Highlight 2-3 specific achievements
    - Connect experience to target requirements
    - No salary discussion
    - No generic platitudes
    """
    
    return call_deepseek_pro(prompt)
```

### 22.2 Career Path Advisor

```python
def career_path_advisor(candidate_id):
    """Suggest career paths based on candidate's profile"""
    candidate = get_candidate_profile(candidate_id)
    
    prompt = f"""
    Based on this professional's profile, suggest 3-5 realistic career paths:
    
    NAME: {candidate['full_name']}
    CURRENT: {candidate.get('current_title')} at {candidate.get('current_company_name')}
    INDUSTRY: {candidate.get('industry')}
    EXPERIENCE: {candidate.get('years_experience')} years
    KEY SKILLS: {candidate.get('skills', [])}
    LOCATION: {candidate.get('location')}
    
    For each career path:
    1. Path name (e.g., "Move to GM/MD role", "Industry pivot to tech", "Geographic expansion to APAC")
    2. Readiness score (0-100)
    3. What they need to strengthen
    4. Typical timeline
    5. Example companies/roles to target
    """
    
    return call_deepseek_pro(prompt)
```

### 22.3 Salary Benchmark View (Candidate Side)

```python
def candidate_salary_view(candidate_id):
    """Show candidate their market value — anonymized, no internal data"""
    candidate = get_candidate_profile(candidate_id)
    
    benchmarks = db.execute("""
        SELECT country,
               PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY (base_min_usd + base_max_usd) / 2) as p25,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (base_min_usd + base_max_usd) / 2) as median,
               PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (base_min_usd + base_max_usd) / 2) as p75,
               COUNT(*) as data_points
        FROM salary_benchmarks
        WHERE seniority = %s
        AND (role_title ILIKE %s OR seniority = %s)
        GROUP BY country
        ORDER BY median DESC
    """, [candidate.get('seniority'), f"%{candidate.get('current_title', '')}%", candidate.get('seniority')])
    
    return {
        'your_profile': {
            'seniority': candidate.get('seniority'),
            'current_role': candidate.get('current_title'),
            'location': candidate.get('location')
        },
        'market_benchmarks': benchmarks,
        'your_position': estimate_candidate_position(candidate, benchmarks),
        'insights': [
            f"Market median for your level: ${median(b['median'] for b in benchmarks):,.0f}",
            f"Highest-paying market: {max(benchmarks, key=lambda b: b['median'])['country']}",
            f"Based on {sum(b['data_points'] for b in benchmarks)} data points"
        ]
    }
```

### 22.4 Opportunity Matcher

```python
def match_opportunities(candidate_id):
    """Match candidate to open mandates they might be a fit for"""
    candidate = get_candidate_profile(candidate_id)
    
    # Score against all open mandates
    open_mandates = db.execute("""
        SELECT m.*, o.name as client_name, o.industry
        FROM mandates m
        JOIN organizations o ON o.id = m.org_id
        WHERE m.status IN ('active', 'sourcing', 'screening')
    """)
    
    matches = []
    for mandate in open_mandates:
        score = score_candidate_mandate_fit(candidate, mandate)
        if score['overall'] >= 50:  # Minimum threshold
            matches.append({
                'mandate_id': mandate['id'],
                'position': mandate['position_title'],
                'company': mandate['client_name'],
                'location': mandate['location'],
                'fit_score': score['overall'],
                'fit_breakdown': score['breakdown'],
                'match_reason': generate_match_reason(candidate, mandate, score)
            })
    
    matches.sort(key=lambda m: m['fit_score'], reverse=True)
    
    return {
        'candidate_id': candidate_id,
        'total_matches': len(matches),
        'top_matches': matches[:5],
        'all_matches': matches
    }
```

### 22.5 Rejection Resilience Coach

```python
def rejection_coaching(candidate_id, rejection_context=None):
    """Help candidate process and learn from rejection"""
    candidate = get_candidate_profile(candidate_id)
    history = get_application_history(candidate_id)
    
    prompt = f"""
    Provide constructive, empathetic coaching after a rejection:
    
    CANDIDATE: {candidate['full_name']}
    CURRENT SITUATION: {rejection_context or 'Recently rejected from an interview process'}
    
    APPLICATION HISTORY: {len(history)} applications, {len([h for h in history if h['status'] == 'rejected'])} rejections
    
    Provide:
    1. Acknowledgment (brief, not patronizing)
    2. Perspective reframe — what rejection typically means at executive level
    3. Actionable analysis — what they can control
    4. Motivation — specific encouragement based on their profile strengths
    5. Next steps — concrete actions for the next 48 hours
    
    Tone: Direct, respectful, empowering. Not "everything happens for a reason."
    """
    
    return call_deepseek_pro(prompt)
```

### 22.6 Networking Suggestions

```python
def suggest_networking(candidate_id):
    """Suggest networking strategies and targets"""
    candidate = get_candidate_profile(candidate_id)
    
    # Find people in similar roles who could be valuable connections
    potential_connections = db.execute("""
        SELECT c.full_name, c.current_title, c.current_company_name, c.current_country,
               co.name as company_name, co.industry
        FROM candidates c
        LEFT JOIN companies co ON co.id = c.current_company_id
        WHERE c.seniority = %s
        AND c.industry_experience_years >= %s
        AND c.current_country = %s
        AND c.id != %s
        ORDER BY RANDOM()
        LIMIT 10
    """, [candidate.get('seniority'), max(candidate.get('years_experience', 0) - 3, 0),
          candidate.get('location'), candidate_id])
    
    return {
        'candidate_id': candidate_id,
        'potential_connections': [
            {
                'name': p['full_name'],
                'role': p['current_title'],
                'company': p['current_company_name'],
                'location': p['current_country'],
                'why_connect': f"Fellow {candidate.get('seniority', 'executive')} in {p.get('industry', 'your field')} — potential peer or referral source"
            }
            for p in potential_connections
        ],
        'strategies': [
            'Attend industry events in your target geography',
            'Engage with target company content on LinkedIn',
            'Request introductions through mutual connections',
            'Join executive peer groups in your industry',
            'Consider advisory board positions for visibility'
        ],
        'events': suggest_relevant_events(candidate)
    }
```

### 22.7 API Endpoints (All T22)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/candidate/{id}/cover-letter` | POST | Generate cover letter |
| `/api/v1/candidate/{id}/career-path` | GET | Career path suggestions |
| `/api/v1/candidate/{id}/salary-view` | GET | Salary benchmarks |
| `/api/v1/candidate/{id}/opportunities` | GET | Matched opportunities |
| `/api/v1/candidate/{id}/rejection-coach` | POST | Rejection coaching |
| `/api/v1/candidate/{id}/networking` | GET | Networking suggestions |

### 22.8 Acceptance Criteria

- [ ] Cover letter generates 250-300 words in <10s
- [ ] Career path suggests 3-5 realistic paths with readiness scores
- [ ] Salary view shows benchmarks without exposing internal data (no candidate names, mandate details)
- [ ] Opportunity matcher scores against all open mandates in <2s
- [ ] Rejection coaching is empathetic but not patronizing
- [ ] Networking suggestions include real people from the database
- [ ] All LLM calls via DeepSeek API

### 22.9 Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Cover letter | VP candidate, specific job | 250-300 words, references job requirements |
| Career path | 10-year industry professional | 3-5 paths with readiness scores |
| Salary view | Director level, Europe | Benchmarks by country, market position |
| Opportunity match | Candidate with 3 mandates scoring >50 | Top 5 matches with fit scores |
| Rejection coach | Candidate with 3 prior rejections | Empathetic + actionable, not generic |

---

## Dependency Graph

```
Phase 1 (T1-T6) ─────────────────────────────────────────────────────┐
Phase 2 (T7-T16) ───────────────────────────────────────────────────┐ │
                                                                     │ │
Phase 3:                                                             │ │
  T17 (Meeting Intelligence) ← T1, T6                                │ │
  T18 (Search, Dedup, Gov) ← T1, T3, T11                            │ │
  T19 (Client Deliverables) ← T3, T5, T9                            │ │
  T20 (Strategic Intel) ← T7, T12, T16                              │ │
  T21 (Coaching Complete) ← T6, T14                                 │ │
  T22 (Candidate Complete) ← T6, T15                                │ │
                                                                     │ │
  Phase 4 (GRID) ← T1-T6 + Phase 3 schema extensions ─────────────┘ │
  └──────────────────────────────────────────────────────────────────┘
```

### Parallel Execution
- **Week 11:** T17 starts (only needs T1+T6). T18 starts (needs T1+T3+T11). T19 starts (needs T3+T5+T9).
- **Week 12:** T17/T18 complete. T19 continues. T20 starts (needs T7+T12+T16 — all from Phase 2).
- **Week 13:** T20 continues (heaviest ticket). T21/T22 start (need T6+T14/T15 from Phase 2).
- **Week 14:** T20/T21/T22 complete. Phase 3 done.
- **Week 14-15:** Buffer / Phase 4 (GRID) begins.

---

## Summary

| Ticket | Scope | Hours | Key Deliverables |
|--------|-------|-------|-----------------|
| T17 | Meeting Intelligence & Automation | 18-22h | Meeting parser, notes→actions, timeline |
| T18 | Search, Dedup & Governance | 17-24h | NL→SQL query, duplicate detection, cost tracking, quality gates |
| T19 | Advanced Client Deliverables | 26-36h | Cover letters, template editor, PDF charts, follow-up sequences, salary view |
| T20 | Strategic Intelligence Suite | 34-44h | Opportunity scanner, client advisor, market entry, patterns, portraits, recommendations |
| T21 | Coaching Portal Completion | 13-18h | Career positioning, learning, reflections, mock interview, confidence |
| T22 | Candidate Portal Completion | 16-23h | Cover letters, career paths, salary, opportunities, resilience, networking |
| **Total** | **Phase 3** | **124-167h** | **28 features, 4 new tables, 40+ APIs, 4 weeks** |

---

*Phase 3 ready for Trae execution. Phase 4 (GRID Intelligence Integration) to follow.*
