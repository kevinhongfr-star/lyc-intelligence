# MARIA — Supabase Backend Impact Brief

**Agent:** MARIA  
**Role:** Outreach & Candidate Engagement  
**Version:** 1.0 | **Date:** 2026-08-05  
**Backend Instance:** `rnnlteyqmtxkzllbohuu.supabase.co`  

---

## 1. Executive Summary

MARIA manages candidate outreach, email sequences, and engagement tracking. The v2 backend formalizes outreach data that currently lives in Notion and email tools. **Key changes:**
- Outreach infrastructure exists: `outreach_attempts`, `outreach_sequences`, `outreach_assignments`, `campaigns`, `campaign_contacts`
- Email infrastructure: `email_sequences`, `sequence_emails`, `sequence_enrollments`
- `vista_contacts` public access removed — outreach target pool (17,777 contacts) moves behind auth
- Suppression list centralized: `suppression_list` table for do-not-contact
- Cross-mandate data leakage risk: outreach must never share candidate data across mandates

---

## 2. Tables You Use — Current vs. New Architecture

| Table | Current Usage | New Architecture | Impact |
|-------|--------------|-----------------|--------|
| `contacts` | Read (candidate contact info) | 68K master records; RLS tightened | Low |
| `vista_contacts` | Read (BD outreach targets) | 17,777 records; public -> authenticated | Medium — update auth |
| `candidates_pipeline` | Read (pipeline context) | 385 records; outreach stage tracking | Low |
| `outreach_attempts` | Read/Write (attempt log) | ~50 rows; primary output table | Low |
| `outreach_sequences` | Read/Write (sequence defs) | ~20 sequences; sequence management | Low |
| `outreach_assignments` | Read (assigned templates) | ~20 assignments | Low |
| `campaigns` | Read (campaign context) | 14 campaigns; RLS org-scoped | Low |
| `campaign_contacts` | Read/Write (enrollment) | 4,454 contacts; campaign enrollment | Medium — large dataset |
| `email_sequences` | Read (email sequence defs) | ~10 sequences | Low |
| `sequence_emails` | Read (individual emails) | ~50 emails | Low |
| `sequence_enrollments` | Read/Write (enrollments) | ~20 enrollments | Low |
| `suppression_list` | Read (do-not-contact) | ~50 entries; compliance critical | High — must check before every send |
| `candidate_outreach_log` | Write (candidate-specific log) | ~50 rows; per-candidate tracking | Low |
| `vista_touch_log` | Write (BD touch points) | ~300 rows; BD activity tracking | Low |

---

## 3. Workflow Changes Required

### 3.1 Outreach to candidates from Notion lists

| Before | After | Action Required |
|--------|-------|-----------------|
| Outreach to candidates from Notion lists | Use `candidates_pipeline` + `contacts` as data source | Migrate target list sourcing to Supabase queries |

### 3.2 Email sequence management

| Before | After | Action Required |
|--------|-------|-----------------|
| Email sequence management (manual) | Use `email_sequences` + `sequence_emails` tables | Define sequences in Supabase; MARIA reads from there |

### 3.3 Suppression check

| Before | After | Action Required |
|--------|-------|-----------------|
| Suppression check (manual / memory) | Query `suppression_list` before every outreach | Add mandatory suppression check to all outreach workflows |

### 3.4 Outreach logging

| Before | After | Action Required |
|--------|-------|-----------------|
| Outreach logging (Notion / spreadsheets) | Write to `outreach_attempts` + `candidate_outreach_log` | Centralize all outreach activity logging |

### 3.5 BD outreach from Vista contacts

| Before | After | Action Required |
|--------|-------|-----------------|
| BD outreach from Vista contacts | Use `vista_contacts` + `vista_touch_log` | Migrate BD outreach to Vista tables with proper auth |

---

## 4. Phase Dependencies

| Build Phase | What It Means for MARIA | Go-Live Impact |
|-------------|----------------------------------|----------------|
| **Phase 01: Database Foundation & Security** | RLS tightened, public access removed, suppression list centralized | 🔴 **High** |
| **Phase 02: API Layer & Real-Time Data** | Outreach APIs, webhook endpoints | 🟡 **Medium** |
| **Phase 05: Client & Consultant Portals** | Client communication portal features | 🟡 **Medium** |
| **Phase 06: B2C Portal & Commerce** | Nurture sequences, B2C engagement | 🟡 **Medium** |
| **Phase 09: Advanced Features** | Outreach automation, AI personalization | 🔴 **High** |

---

## 5. Critical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cross-mandate candidate data leakage via outreach | 🔴 Critical | Never share mandate-specific context with candidates from other mandates; strict RLS enforcement |
| Suppression list bypass -> compliance violation | 🔴 Critical | Mandatory `suppression_list` check before every send; log all checks |
| Vista contacts public access revoked -> BD outreach breaks | 🔴 High | Switch to authenticated access immediately |
| Outreach automation (Phase 09) replaces manual outreach | 🟡 Medium | MARIA shifts from drafting to reviewing/approving AI-generated outreach |

---

## 6. Action Items (MARIA Team)

| # | Action | Priority | Depends On |
|---|--------|----------|------------|
| 1 | Switch from anon to authenticated Supabase access | P0 | Phase 01 |
| 2 | Add mandatory `suppression_list` check to all outreach workflows | P0 | Phase 01 |
| 3 | Migrate outreach logging to `outreach_attempts` + `candidate_outreach_log` | P1 | Phase 01 complete |
| 4 | Migrate target sourcing from Notion to `contacts` + `candidates_pipeline` | P1 | Phase 02 |
| 5 | Define all active email sequences in `email_sequences` + `sequence_emails` | P1 | Phase 02 |
| 6 | Set up BD outreach tracking via `vista_touch_log` | P2 | Phase 06 |
| 7 | Prepare for AI-assisted outreach (Phase 09) | P3 | Phase 09 |

---

## 7. Key Tables to Monitor

- `contacts`
- `vista_contacts`
- `candidates_pipeline`
- `outreach_attempts`
- `suppression_list`
- `email_sequences`
- `campaign_contacts`
- `candidate_outreach_log`

---

*Part of the 10-agent Supabase impact brief series. Source: Supabase Data Architecture & Impact Map v1.0 (2026-08-05)*
