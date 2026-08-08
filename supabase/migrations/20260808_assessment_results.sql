-- Phase 11 — SHIFT Suite: assessment_results table
-- Persists per-user SHIFT diagnostic results (LEAP/QUEST/DRIVE/COACH/IMPACT)
-- RLS enabled: users view/create own results; portal admins view their portal's results.

create extension if not exists "pgcrypto";

-- ── assessment_results ──────────────────────────────────────────────
create table if not exists public.assessment_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  assessment_type   text not null,                -- e.g. 'SHIFT_LEAP'
  assessment_name   text not null,                -- e.g. 'Learning & Execution Potential'
  portal_id         uuid,                         -- nullable; links to client portal if applicable
  dimensions        jsonb not null default '{}'::jsonb,   -- { dim_id: score_0_100 }
  composite_score   numeric not null default 0,    -- 0-100
  tier_label        text not null default 'Emerging',
  narrative         text,                          -- LLM narrative JSON (nullable for score-only)
  raw_responses     jsonb,                         -- full intake payload (nullable)
  metadata          jsonb not null default '{}'::jsonb,  -- archetype, strengths, recommendations, tokens, etc.
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  completed_at      timestamptz                     -- set when assessment is finalized
);

-- ── Indexes ─────────────────────────────────────────────────────────
create index if not exists idx_assessment_results_user_id on public.assessment_results(user_id);
create index if not exists idx_assessment_results_type on public.assessment_results(assessment_type);
create index if not exists idx_assessment_results_portal_id on public.assessment_results(portal_id);
create index if not exists idx_assessment_results_created_at on public.assessment_results(created_at desc);
create index if not exists idx_assessment_results_user_type on public.assessment_results(user_id, assessment_type);

-- ── Row Level Security ──────────────────────────────────────────────
alter table public.assessment_results enable row level security;

-- Users can view their own results
drop policy if exists "assessment_results_owner_select" on public.assessment_results;
create policy "assessment_results_owner_select"
  on public.assessment_results for select
  to authenticated
  using (user_id = auth.uid());

-- Users can create their own results
drop policy if exists "assessment_results_owner_insert" on public.assessment_results;
create policy "assessment_results_owner_insert"
  on public.assessment_results for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own results
drop policy if exists "assessment_results_owner_update" on public.assessment_results;
create policy "assessment_results_owner_update"
  on public.assessment_results for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Portal admins can view results for their portal
drop policy if exists "assessment_results_portal_admin_select" on public.assessment_results;
create policy "assessment_results_portal_admin_select"
  on public.assessment_results for select
  to authenticated
  using (
    portal_id is not null
    and exists (
      select 1 from public.client_portal_members cpm
      where cpm.portal_id = assessment_results.portal_id
        and cpm.user_id = auth.uid()
        and cpm.role in ('admin', 'owner')
    )
  );

-- ── updated_at trigger ──────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assessment_results_touch on public.assessment_results;
create trigger trg_assessment_results_touch
  before update on public.assessment_results
  for each row execute function public.touch_updated_at();

-- ── Verification ────────────────────────────────────────────────────
do $$
begin
  raise notice '✅ assessment_results table created with RLS + indexes';
end $$;
