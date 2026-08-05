-- ──────────────────────────────────────────────────────────────────────────
-- Phase 1 / Sprint 1.1 — Revoke public privileges (P0 security lockdown)
-- Tickets: 1.1.01 – 1.1.11
-- Issue: #3 (P0 security blocker)
--
-- The Supabase audit found 6 P0 issues: dangerous public (anon) privileges on
-- 10 tables exposing 85K+ records to unauthenticated callers, plus ~345
-- policies using `qual='true'` (i.e. USING ('t') — grants access to everyone).
--
-- This migration:
--   1.1.01–1.1.10  REVOKE all DML from PUBLIC on the 10 named tables/views.
--   1.1.11         Programmatically drop every policy whose qualifier is the
--                  literal TRUE (sweep across all tables in public schema).
--
-- Safe to re-run: REVOKE is idempotent; the policy sweep guards each DROP.
--
-- NOTE: RLS policies themselves are added in the next migration
-- (20260805_phase1_rls_policies.sql). After this revokes run, anon loses all
-- access; authenticated retains only what the new policies grant.
-- ──────────────────────────────────────────────────────────────────────────

-- ── 1.1.01 contacts ─────────────────────────────────────────────────────
REVOKE ALL ON public.contacts FROM anon, PUBLIC;
-- ── 1.1.02 vista_contacts ───────────────────────────────────────────────
REVOKE ALL ON public.vista_contacts FROM anon, PUBLIC;
-- ── 1.1.03 mandates ─────────────────────────────────────────────────────
REVOKE ALL ON public.mandates FROM anon, PUBLIC;
-- ── 1.1.04 candidates_pipeline ──────────────────────────────────────────
REVOKE ALL ON public.candidates_pipeline FROM anon, PUBLIC;
-- ── 1.1.05 vista_messages ───────────────────────────────────────────────
REVOKE ALL ON public.vista_messages FROM anon, PUBLIC;
-- ── 1.1.06 vista_signals ────────────────────────────────────────────────
REVOKE ALL ON public.vista_signals FROM anon, PUBLIC;
-- ── 1.1.07 vista_stains ─────────────────────────────────────────────────
REVOKE ALL ON public.vista_stains FROM anon, PUBLIC;
-- ── 1.1.08 vista_sync_log ───────────────────────────────────────────────
REVOKE ALL ON public.vista_sync_log FROM anon, PUBLIC;
-- ── 1.1.09 vista_proposals ──────────────────────────────────────────────
REVOKE ALL ON public.vista_proposals FROM anon, PUBLIC;
-- ── 1.1.10 ai_generations ───────────────────────────────────────────────
REVOKE ALL ON public.ai_generations FROM anon, PUBLIC;

-- Re-grant the minimum anon actually needs: nothing on these tables. If a
-- public read path is later required for a specific view, add an explicit
-- GRANT SELECT on that view only, with a narrowly-scoped policy.

-- ── 1.1.11 Sweep all `qual='true'` policies across the public schema ────
-- pg_policies.qual is the policy's USING expression as text. A policy defined
-- with `USING ('t')` or `USING (true)` shows up as `true` here. These are
-- "allow everyone" policies and are a security hole. Drop them programmatically
-- so the new role-based policies (next migration) are the only ones in force.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND COALESCE(qual, '') IN ('true', 't', "'t'", '1', "'1'")
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;

-- ── Belt-and-suspenders: ensure RLS is ENABLED on every public table ────
-- A table with policies but RLS disabled still allows full access. Enable RLS
-- on every table in public that doesn't already have it.
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
