# AKIRA — Supabase Backend Impact Brief

**Agent:** AKIRA  
**Role:** Technical Training & Workshop Delivery  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

Akira delivers workshops, training programs, and coaching engagements. The v2 backend adds structured workshop and assessment data tables. **Key changes:**
- Workshop infrastructure exists: `workshops`, `workshop_participants`, `workshop_scores` (all currently empty — greenfield)
- Assessment frameworks: `benchmark_assessment`, `member_frameworks` + the full SHIFT/PRISM/MOSAIC assessment suite
- Candidate prep: `candidate_prep_progress` for interview prep tracking
- Coaching: `council_coaching_sessions` (council portal) + workshop coaching models
- All workshop tables currently have 0 rows and likely need RLS policies before use

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `workshops` | Read/Write (workshop defs) | 0 rows; greenfield | High — core product |
| `workshop_participants` | Read/Write (participants) | 0 rows; enrollment | High — core product |
| `workshop_scores` | Read/Write (scoring) | 0 rows; results | High — core output |
| `vista_workshops` | Read (Vista workshop defs) | ~0 rows; Vista-side | Medium |
| `vista_workshop_attendees` | Read/Write (attendance) | 0 rows; BD workshops | Medium |
| `benchmark_assessment` | Read (benchmark data) | — ; assessment reference | Medium |
| `member_frameworks` | Read (framework defs) | ~0 records; council frameworks | Low |
| `candidate_prep_progress` | Read/Write (prep tracking) | ~10 records; interview prep | Medium |
| `council_coaching_sessions` | Read/Write (coaching) | 0 rows; council coaching | Medium — new segment |
| `council_profiles` | Read (council members) | 0 rows; council data | Low |
| `council_events` | Read (events) | ~0 records | Low |
| `council_event_registrations` | Read/Write (registrations) | 0 rows | Low |
| `contacts` | Read (participant data) | 68K records; participant lookup | Low |
| `events` | Read (events calendar) | ~50 events | Low |
| `event_registrations` | Read/Write (registrations) | 0 rows | Low |
| `event_feedback` | Read (post-event feedback) | ~10 records | Low |
| `scoring_config` | Read (scoring weights) | 9 records; scoring reference | Medium |

---

## 3. Workflow Changes Required

### 3.1 Workshop delivery

| Before | After | Action Required |
|--------|-------|-----------------|
| Workshop delivery (manual / slides / ad-hoc) | Structured: `workshops` -> `workshop_participants` -> `workshop_scores` | Migrate workshop definitions to Supabase; track participants and scores |

### 3.2 Participant registration

| Before | After | Action Required |
|--------|-------|-----------------|
| Participant registration (forms/email) | Token-based access via `workshop_participants.token` | Implement registration flow that creates workshop_participants with unique access tokens |

### 3.3 Assessment delivery

| Before | After | Action Required |
|--------|-------|-----------------|
| Assessment delivery (Typeform / manual) | Structured assessment data in `workshop_scores` + `benchmark_assessment` | Migrate assessment results from form tools to structured Supabase tables |

### 3.4 Coaching session tracking

| Before | After | Action Required |
|--------|-------|-----------------|
| Coaching session tracking | `council_coaching_sessions` + candidate prep progress | Centralize coaching session records for continuity |

### 3.5 Workshop materials delivery

| Before | After | Action Required |
|--------|-------|-----------------|
| Workshop materials delivery (email/Drive) | Supabase Storage + workshop portal | Host materials in Supabase Storage; gated by workshop participation RLS |

### 3.6 Post-workshop follow-up

| Before | After | Action Required |
|--------|-------|-----------------|
| Post-workshop follow-up | `event_feedback` + automated sequence triggers | Collect feedback in Supabase; trigger follow-up sequences |

---

## 4. Phase Dependencies

| Build Phase | What It Means for AKIRA | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS policies, workshop tables set up | 🔴 **High** |
| **Phase 03: Design System & Frontend** | Workshop UI components, form system | 🟡 **Medium** |
| **Phase 05: Client & Consultant Portals** | Client workshop access, consultant delivery tools | 🟡 **Medium** |
| **Phase 06: B2C Portal & Commerce** | B2C workshop signup, payment, access | 🟡 **Medium** |
| **Phase 08: NEXUS AI** | AI workshop facilitation, personalized coaching | 🟡 **Medium** |
| **Phase 09: Advanced Features** | Workshop automation, personalized learning paths | 🟡 **Medium** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Workshop tables empty + likely no RLS policies -> cannot launch | 🔴 High | Prioritize RLS policies for `workshops`, `workshop_participants`, `workshop_scores` in Phase 01 |
| Participant data isolation: must not see other participants | 🔴 Critical | RLS on workshop_scores: participants only see own scores; token-based access |
| Assessment data quality across different workshop types | 🟡 Medium | Standardize scoring schema; use `scoring_config` for consistent weights |
| Token-based workshop access security | 🟡 Medium | Use single-use or time-limited tokens; invalidate after workshop completion |

---

## 6. Action Items (AKIRA Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Request RLS policies for workshop tables (Phase 01 priority) | P0 | Phase 01 |
| 2 | Define workshop schema: `workshops`, `workshop_participants`, `workshop_scores` | P0 | Phase 01 |
| 3 | Set up token-based participant access system | P1 | Phase 03 |
| 4 | Migrate active workshops into Supabase `workshops` table | P1 | Phase 04 |
| 5 | Build workshop participant portal (Phase 05/06) | P2 | Phase 05/06 |
| 6 | Integrate assessment results with Report Engine (Phase 07) | P2 | Phase 07 |
| 7 | Set up council coaching session tracking | P3 | Phase 05 |

---

## 7. Key Tables to Monitor

- `workshops`
- `workshop_participants`
- `workshop_scores`
- `candidate_prep_progress`
- `council_coaching_sessions`
- `benchmark_assessment`
- `event_feedback`
- `scoring_config`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
