# CARL — Supabase Backend Impact Brief

**Agent:** CARL  
**Role:** BD & Marketing Operations  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

Carl manages BD pipeline, campaign operations, and marketing analytics. The v2 backend consolidates Vista BD data (17,777 contacts) with the core CRM (68K contacts). **Key changes:**
- Vista ecosystem (24+ tables) is the BD data layer — fully in Supabase
- Campaigns: 14 active campaigns, 4,454 campaign contacts already in DB
- Public access on Vista tables being revoked — Carl's BD operations move behind auth
- Vista scoring system (engagement_score, priority_score, stain_score, vista_composite etc.) becomes the BD qualification engine
- `vista_action_queue` + `vista_opportunities` = BD task management

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `vista_contacts` | Read/Write (BD contact pool) | 17,777 records; public -> auth | High — core data |
| `vista_signals` | Read (signal data) | ~500 signals; intel for outreach | Medium |
| `vista_stains` | Read (stain analysis) | ~300 records; stain scoring | Medium |
| `vista_proposals` | Read/Write (proposals) | ~50+ records; BD proposals | Medium |
| `vista_opportunities` | Read/Write (opportunities) | ~100 records; pipeline | High |
| `vista_opportunity_contacts` | Read/Write (opp contacts) | ~100 records | Medium |
| `vista_action_queue` | Read/Write (task queue) | ~50 records; daily tasks | High |
| `vista_messages` | Read/Write (messages) | ~200 records | Medium |
| `vista_contact_briefs` | Read/Write (briefs) | ~500 records; per-contact intel | Medium |
| `vista_contact_services` | Read/Write (services) | ~50 records | Low |
| `vista_service_catalog` | Read (service defs) | ~20 services | Low |
| `vista_funnel_journey` | Read/Write (funnel stages) | ~50 records; journey tracking | Medium |
| `vista_nurture_routes` | Read/Write (nurture routing) | ~50 records; routing logic | Medium |
| `vista_touch_log` | Write (touch points) | ~300 records; activity log | Medium |
| `vista_tier_progressions` | Read/Write (tier changes) | ~50 records | Low |
| `vista_outreach_sequences` | Read (sequence defs) | ~20 sequences | Medium |
| `vista_alerts` | Read (triggered alerts) | ~20 records | Medium |
| `vista_alert_rules` | Read/Write (alert defs) | ~10 rules | Medium |
| `vista_daily_log` | Read/Write (daily activity) | ~100 records | Low |
| `vista_signal_intelligence` | Read (signal intel) | ~50 records | Medium |
| `campaigns` | Read/Write (campaigns) | 14 campaigns | High |
| `campaign_contacts` | Read/Write (enrollments) | 4,454 contacts | High — large dataset |
| `campaign_activities` | Read/Write (activity log) | ~500 records | Medium |
| `contacts` | Read (core contact data) | 68K master records; enrichment source | Medium |
| `companies` | Read (company data) | ~500 records; account info | Low |
| `proposals` | Read (formal proposals) | 197 records; B2B proposals | Medium |
| `v_encirclement` | Read (encirclement view) | Vista view; BD targeting | Medium |
| `v_pipeline_summary` | Read (pipeline view) | Vista pipeline dashboard | High |

---

## 3. Workflow Changes Required

### 3.1 BD contact list building

| Before | After | Action Required |
|--------|-------|-----------------|
| BD contact list building (Notion/sheets) | Query `vista_contacts` with scoring filters | Migrate list building to Supabase queries using vista_composite, engagement_score, bd_bucket |

### 3.2 Campaign management

| Before | After | Action Required |
|--------|-------|-----------------|
| Campaign management (scattered tools) | `campaigns` + `campaign_contacts` + `campaign_activities` | Centralize all campaign operations in Supabase |

### 3.3 Outreach sequencing

| Before | After | Action Required |
|--------|-------|-----------------|
| Outreach sequencing | `vista_outreach_sequences` + `email_sequences` + `sequence_enrollments` | Manage sequences in Supabase; trigger via Edge Functions |

### 3.4 Opportunity tracking

| Before | After | Action Required |
|--------|-------|-----------------|
| Opportunity tracking (sheets/CRM) | `vista_opportunities` + `vista_opportunity_contacts` | Migrate pipeline tracking to Vista opportunity tables |

### 3.5 Task management

| Before | After | Action Required |
|--------|-------|-----------------|
| Task management (Feishu/Notion) | `vista_action_queue` as single task queue | All BD tasks flow through action queue; MARIA picks from there |

### 3.6 BD performance reporting

| Before | After | Action Required |
|--------|-------|-----------------|
| BD performance reporting | `v_pipeline_summary` + `vista_daily_log` + `campaign_activities` | Generate BD reports from structured views |

### 3.7 Signal-driven outreach

| Before | After | Action Required |
|--------|-------|-----------------|
| Signal-driven outreach (manual) | `vista_signals` + `vista_alerts` + `vista_alert_rules` | Automate signal-to-outreach flow via alert rules |

---

## 4. Phase Dependencies

| Build Phase | What It Means for CARL | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS tightened, Vista tables public access revoked | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | Campaign APIs, Vista BD APIs | 🟡 **Medium** |
| **Phase 04: Internal Portal** | BD dashboard, campaign management UI | 🟡 **Medium** |
| **Phase 06: B2C Portal & Commerce** | B2C -> B2B conversion tracking | 🟡 **Medium** |
| **Phase 09: Advanced Features** | AI-driven BD scoring, automated outreach triggers | 🔴 **High** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Vista tables public access revoked -> BD tools break | 🔴 High | Switch all Carl's BD workflows to authenticated Supabase access immediately |
| vista_contacts mixing BD targets with candidates/clients | 🟡 Medium | Use `bd_bucket` and `engagement_tier` fields to segment; never cross streams |
| Campaign contacts (4,454) may duplicate with core contacts (68K) | 🟡 Medium | Build dedup between `campaign_contacts` + `contacts`; use canonical contact ID |
| BD scoring changes affect downstream outreach prioritization | 🟡 Medium | Version Vista scoring logic; test score changes on subset before full rollout |

---

## 6. Action Items (CARL Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Switch all BD Supabase access from anon to authenticated | P0 | Phase 01 |
| 2 | Audit all Vista tables used by Carl; ensure RLS policies exist | P0 | Phase 01 |
| 3 | Centralize campaign management in `campaigns` + `campaign_contacts` | P1 | Phase 02 |
| 4 | Migrate opportunity tracking to `vista_opportunities` | P1 | Phase 02 |
| 5 | Set up `vista_action_queue` as primary task queue for BD team | P1 | Phase 04 |
| 6 | Configure `vista_alert_rules` for signal-driven outreach triggers | P2 | Phase 09 |
| 7 | Build dedup between Vista contacts and core contacts | P2 | Phase 01 |

---

## 7. Key Tables to Monitor

- `vista_contacts`
- `campaigns`
- `campaign_contacts`
- `vista_opportunities`
- `vista_action_queue`
- `vista_signals`
- `vista_outreach_sequences`
- `v_pipeline_summary`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
