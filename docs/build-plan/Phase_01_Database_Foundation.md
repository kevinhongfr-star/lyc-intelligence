# Phase 1: Database Foundation & Security Hardening

**Goal:** Fix all critical database issues, secure RLS policies, repair broken views, populate empty linking tables, and establish a clean data foundation for all portals.

**Pre-requisites:** None — this is the foundation layer.

**Gap Context:** Supabase audit found 6 P0 security issues (public RLS exposing 85K+ records), 5 P1 data wiring issues (broken views, empty tables), and 20+ tables with RLS enabled but zero policies.

---

## Sprint 1.1 — Security Audit & RLS Lockdown

| # | Ticket |
|---|--------|
| 1.1.01 | Revoke public SELECT/INSERT/UPDATE on `contacts` table |
| 1.1.02 | Revoke public SELECT/INSERT/UPDATE on `vista_contacts` table |
| 1.1.03 | Revoke public SELECT on `mandates` table |
| 1.1.04 | Revoke public SELECT/UPDATE on `candidates_pipeline` table |
| 1.1.05 | Revoke public SELECT on `vista_messages` table |
| 1.1.06 | Revoke public SELECT on `vista_signals` table |
| 1.1.07 | Revoke public SELECT on `vista_stains` table |
| 1.1.08 | Revoke public SELECT on `vista_sync_log` table |
| 1.1.09 | Revoke public SELECT on `vista_proposals` table |
| 1.1.10 | Revoke public SELECT on `ai_generations` table |
| 1.1.11 | Audit and revoke all remaining `qual='true'` policies across 345 tables |
| 1.1.12 | Create `user_roles` table (role_id, user_id, role_name, scope) |
| 1.1.13 | Define role hierarchy: super_admin > admin > consultant > viewer |
| 1.1.14 | Create `fn_is_admin()` helper function for RLS policy checks |
| 1.1.15 | Create `fn_is_consultant()` helper function for RLS policy checks |
| 1.1.16 | Create `fn_is_internal_user()` helper function for RLS policy checks |
| 1.1.17 | Backfill 3 existing profiles into `user_roles` with admin role |
| 1.1.18 | Add RLS policy: `profiles` — authenticated users can read own profile |
| 1.1.19 | Add RLS policy: `profiles` — admins can read/update all profiles |
| 1.1.20 | Add RLS policy: `contacts` — internal users get full SELECT |
| 1.1.21 | Add RLS policy: `contacts` — authenticated users can INSERT |
| 1.1.22 | Add RLS policy: `contacts` — only admins can DELETE |
| 1.1.23 | Add RLS policy: `mandates` — internal users get full SELECT |
| 1.1.24 | Add RLS policy: `mandates` — admins can INSERT/UPDATE |
| 1.1.25 | Security regression test suite — verify no public access remains |

## Sprint 1.2 — View Repairs & Data Integrity

| # | Ticket |
|---|--------|
| 1.2.01 | Fix `v_mandate_scores` JOIN — COALESCE(m.client_id, m.company_id) = ca.id |
| 1.2.02 | Fix `v_mandate_scores` consultant JOIN — COALESCE(m.lead_consultant_id, m.consultant_id) |
| 1.2.03 | Fix `v_mandate_pipeline` JOIN — same COALESCE fix |
| 1.2.04 | Verify `v_pipeline_rankings` inherits fix from v_mandate_scores |
| 1.2.05 | Add client_name, consultant_code, consultant_email to v_mandate_scores output |
| 1.2.06 | Create `fn_reconcile_data_integrity()` — cross-table consistency checker |
| 1.2.07 | Create `v_data_health` view — row counts, orphan refs, NULL rates |
| 1.2.08 | Backfill `mandates.company_id` → migrate stale values to `mandates.client_id` |
| 1.2.09 | Backfill `consultants.name` from first_name + last_name |
| 1.2.10 | Fix `candidates_pipeline` enrichment NULLs — wire scoring pipeline output |
| 1.2.11 | Create `fn_validate_fk_integrity()` — detect orphaned FK references |
| 1.2.12 | Add missing FK constraint: candidates_pipeline.mandate_id → mandates.id |
| 1.2.13 | Add missing FK constraint: candidates_pipeline.contact_id → contacts.id |
| 1.2.14 | Add index on contacts.email for lookup performance |
| 1.2.15 | Add index on mandates.status for filtered queries |
| 1.2.16 | Add index on candidates_pipeline.mandate_id for JOIN performance |
| 1.2.17 | Add composite index on vista_contacts(engagement_score, priority_score) |
| 1.2.18 | Create `v_unified_contacts` — UNION contacts + vista_contacts (dedup by email) |
| 1.2.19 | Create `v_active_mandates` — mandates WHERE status NOT IN ('closed','cancelled') |
| 1.2.20 | Create `v_consultant_workload` — mandates grouped by consultant |
| 1.2.21 | Validate all 21 views return correct data after fixes |
| 1.2.22 | Document view dependency graph |
| 1.2.23 | Create `fn_refresh_data_health_snapshot()` — scheduled quality check |
| 1.2.24 | Data quality baseline report — snapshot post-fix |
| 1.2.25 | Integration test: dashboards display correct client/consultant names |

## Sprint 1.3 — Auth Infrastructure & User Type System

| # | Ticket |
|---|--------|
| 1.3.01 | Create `user_types` enum: internal, client, candidate, b2c, council, workshop, alumni, partner |
| 1.3.02 | Create `user_type_assignments` table (user_id, user_type, assigned_at, assigned_by) |
| 1.3.03 | Add `user_type` column to `profiles` with FK to user_types |
| 1.3.04 | Create `auth_metadata` table (user_id, provider, external_id, verified_at) |
| 1.3.05 | Build `fn_create_internal_user(email, role)` |
| 1.3.06 | Build `fn_create_client_user(email, client_account_id)` |
| 1.3.07 | Build `fn_create_candidate_user(email, contact_id)` |
| 1.3.08 | Build `fn_create_b2c_user(email, tier)` |
| 1.3.09 | Build `fn_create_council_user(email, contact_id, tier)` |
| 1.3.10 | Create password reset flow — fn_request_password_reset + fn_reset_password |
| 1.3.11 | Create email verification flow — fn_send_verification_email |
| 1.3.12 | Create `user_sessions` table for session tracking |
| 1.3.13 | Create `fn_track_login(user_id)` |
| 1.3.14 | Create `fn_check_user_permissions(user_id, resource, action)` |
| 1.3.15 | RLS policy template for portal users: WHERE user_id = auth.uid() |
| 1.3.16 | RLS policy template for client portal: WHERE client_account_id = auth.client_id() |
| 1.3.17 | RLS policy template for candidate portal: WHERE contact_id = auth.contact_id() |
| 1.3.18 | RLS policy template for B2C portal: WHERE b2c_user_id = auth.uid()::text |
| 1.3.19 | Create `user_preferences` table (language, timezone, notification_prefs JSONB) |
| 1.3.20 | Create `user_api_keys` table for programmatic access |
| 1.3.21 | Create MFA setup — fn_enable_mfa with TOTP |
| 1.3.22 | Create fn_validate_mfa for TOTP verification |
| 1.3.23 | Backfill existing 3 profiles with user_type = 'internal' |
| 1.3.24 | Auth integration test — register/login/reset for each user type |
| 1.3.25 | Document auth flow for each portal (sequence diagram) |

## Sprint 1.4 — Portal Data Wiring (Linking Tables)

| # | Ticket |
|---|--------|
| 1.4.01 | Design `client_mandate_access` schema — add notes, granted_at, granted_by |
| 1.4.02 | Populate `client_mandate_access` — map 8 client accounts to active mandates |
| 1.4.03 | Design `candidate_mandate_links` schema — add priority, linked_at, linked_by |
| 1.4.04 | Populate `candidate_mandate_links` from candidates_pipeline |
| 1.4.05 | Build `fn_link_candidate_to_mandate(contact_id, mandate_id, priority)` |
| 1.4.06 | Build `fn_unlink_candidate_from_mandate(contact_id, mandate_id)` |
| 1.4.07 | Build `fn_link_client_to_mandate(client_account_id, mandate_id)` |
| 1.4.08 | Build `fn_revoke_client_mandate_access(client_account_id, mandate_id)` |
| 1.4.09 | Populate `vista_b2c_leads` — seed from vista_contacts with B2C potential |
| 1.4.10 | Populate `dex_user_profiles` — placeholder profiles for existing auth users |
| 1.4.11 | Create `council_profiles` records for known council members |
| 1.4.12 | Populate `vista_council_members` — map contacts to tiers |
| 1.4.13 | Create `mailing_lists` — Newsletter, Updates, Events, Council lists |
| 1.4.14 | Create `mailing_list_contacts` — seed from vista_contacts by engagement tier |
| 1.4.15 | Populate `credit_packages` — Executive, Council, Premium packages |
| 1.4.16 | Create `portal_access_log` table (user_id, portal, accessed_at, ip, action) |
| 1.4.17 | Create `fn_log_portal_access(user_id, portal, action)` |
| 1.4.18 | Create `data_seeding_log` table — track which tables seeded and when |
| 1.4.19 | Create `fn_validate_portal_data_readiness(portal_name)` |
| 1.4.20 | Validate client portal data — each client has ≥1 mandate access mapping |
| 1.4.21 | Validate candidate portal data — top candidates have mandate links |
| 1.4.22 | Validate B2C portal data — credit packages defined, leads seeded |
| 1.4.23 | Validate council portal data — members mapped with tiers |
| 1.4.24 | Create data wiring dashboard — live view of linking table row counts |
| 1.4.25 | End-to-end data wiring verification — all portals can resolve data |

## Sprint 1.5 — Database Migration Framework & Monitoring

| # | Ticket |
|---|--------|
| 1.5.01 | Create migration framework — versioned SQL files in migrations/ |
| 1.5.02 | Create `schema_migrations` table — track applied migrations |
| 1.5.03 | Create `fn_apply_migration(version, sql)` — atomic migration execution |
| 1.5.04 | Create `fn_rollback_migration(version)` — reverse migration |
| 1.5.05 | Package all Phase 1 changes as migration v1.0.0 |
| 1.5.06 | Create `v_schema_documentation` view — auto-generated table/column docs |
| 1.5.07 | Create `v_rls_policy_summary` view — policies per table with coverage |
| 1.5.08 | Create `v_fk_dependency_graph` view — all FK relationships |
| 1.5.09 | Create `v_table_health_dashboard` — row counts, freshness, quality |
| 1.5.10 | Set up Supabase Realtime publication — add key tables to realtime channel |
| 1.5.11 | Create `fn_notify_on_schema_change()` — DDL change alert trigger |
| 1.5.12 | Create `schema_change_log` table — automated DDL audit trail |
| 1.5.13 | Create `data_quality_alerts` table (table_name, issue_type, severity, detected_at) |
| 1.5.14 | Create `fn_check_data_quality()` — automated quality checker |
| 1.5.15 | Create `fn_generate_weekly_db_report()` — summary of changes/health |
| 1.5.16 | Set up database backup schedule — daily automated backups |
| 1.5.17 | Create `fn_test_backup_restore()` — verify backup integrity |
| 1.5.18 | Create query performance baseline — document slow queries |
| 1.5.19 | Add EXPLAIN ANALYZE tests for critical queries |
| 1.5.20 | Create `slow_query_log` table — capture queries > 1s |
| 1.5.21 | Optimize top 10 slowest queries from baseline |
| 1.5.22 | Create connection pooling configuration |
| 1.5.23 | Create database operations runbook |
| 1.5.24 | Phase 1 completion verification — all P0/P1 resolved |
| 1.5.25 | Phase 1 sign-off document — summary, test results, go/no-go |
