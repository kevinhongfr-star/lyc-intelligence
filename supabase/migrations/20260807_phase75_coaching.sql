-- Phase 7.5 — Coaching Excellence
-- Primary coach route (/coaching/coach) persistence layer
-- 3 tables: coaching_sessions, coaching_messages, coach_agents
-- Uses existing career_intelligence tables (references only — no duplicates)

create extension if not exists "pgcrypto";

-- ── coach_agents ──────────────────────────────────────────────────
create table if not exists public.coach_agents (
  id                      text primary key,
  role                    text not null,
  name                    text not null,
  expertise               text[] not null default '{}',
  style                   text not null,
  personality             jsonb not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists coach_agents_role_idx on public.coach_agents(role);
create index if not exists coach_agents_expertise_gin_idx on public.coach_agents using gin (expertise);

alter table public.coach_agents enable row level security;

create policy "Coach agents are readable by all authenticated users"
  on public.coach_agents for select
  using (auth.role() = 'authenticated');

create policy "No direct writes to coach_agents"
  on public.coach_agents for all
  using (false) with check (false);

-- Seed the 6 coach agents defined in coachingSessionEngine.ts (COACH_AGENTS)
insert into public.coach_agents (id, role, name, expertise, style, personality) values
  ('agent-lead',       'lead-coach',                 'Alex Chen',            array['leadership','career-transition','performance'], 'facilitative',
   '{"openness":0.9,"conscientiousness":0.85,"empathy":0.92,"assertiveness":0.7}'::jsonb),
  ('agent-leadership', 'leadership-expert',          'Dr. Sarah Mitchell',   array['leadership','strategic-thinking'],             'challenge',
   '{"openness":0.8,"conscientiousness":0.95,"empathy":0.75,"assertiveness":0.9}'::jsonb),
  ('agent-career',     'career-transition-specialist','James Okonkwo',       array['career-transition','communication'],            'non-directive',
   '{"openness":0.95,"conscientiousness":0.8,"empathy":0.88,"assertiveness":0.6}'::jsonb),
  ('agent-performance','performance-strategist',     'Maria Gonzalez',       array['performance','emotional-intelligence'],         'directive',
   '{"openness":0.75,"conscientiousness":0.92,"empathy":0.82,"assertiveness":0.85}'::jsonb),
  ('agent-communication','communication-coach',      'Thomas Weber',         array['communication','emotional-intelligence'],       'facilitative',
   '{"openness":0.85,"conscientiousness":0.78,"empathy":0.9,"assertiveness":0.65}'::jsonb),
  ('agent-peer',       'peer-coach',                 'Jordan Lee',           array['leadership','career-transition'],               'non-directive',
   '{"openness":0.9,"conscientiousness":0.7,"empathy":0.85,"assertiveness":0.55}'::jsonb)
on conflict (id) do nothing;

-- ── coaching_sessions ─────────────────────────────────────────────
create table if not exists public.coaching_sessions (
  id                      text primary key default gen_random_uuid()::text,
  title                   text not null,
  focus                   text not null,
  status                  text not null default 'scheduled',
  methodology             text not null default 'GROW',
  coachee_id              text not null,                   -- supabase auth uid OR internal user id
  coach_agent_ids         text[] not null default '{}',    -- foreign refs into coach_agents(id)
  actions                 jsonb not null default '[]',
  notes                   text[] not null default '{}',
  started_at              bigint,
  ended_at                bigint,
  duration_sec            integer not null default 3600,
  progress                integer not null default 0,
  metadata                jsonb not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists coaching_sessions_coachee_idx on public.coaching_sessions(coachee_id);
create index if not exists coaching_sessions_status_idx on public.coaching_sessions(status);
create index if not exists coaching_sessions_focus_idx on public.coaching_sessions(focus);
create index if not exists coaching_sessions_created_at_idx on public.coaching_sessions(created_at desc);

alter table public.coaching_sessions enable row level security;

create policy "Coachees can read their own sessions"
  on public.coaching_sessions for select
  using (coachee_id = (select id from auth.users where auth.uid() = id limit 1));

create policy "Coachees can insert their own sessions"
  on public.coaching_sessions for insert
  with check (coachee_id = (select id from auth.users where auth.uid() = id limit 1));

create policy "Coachees can update their own sessions (status, messages, actions)"
  on public.coaching_sessions for update
  using (coachee_id = (select id from auth.users where auth.uid() = id limit 1))
  with check (coachee_id = (select id from auth.users where auth.uid() = id limit 1));

create policy "Coachees can delete their own sessions"
  on public.coaching_sessions for delete
  using (coachee_id = (select id from auth.users where auth.uid() = id limit 1));

-- ── coaching_messages ─────────────────────────────────────────────
create table if not exists public.coaching_messages (
  id                      text primary key default gen_random_uuid()::text,
  session_id              text not null references public.coaching_sessions(id) on delete cascade,
  role                    text not null,                  -- coach | coachee | observer | system
  agent_id                text not null,                  -- coachee_id OR coach_agent.id OR 'system'
  content                 text not null,
  methodology             text,
  timestamp_ms            bigint not null,
  metadata                jsonb not null default '{}',
  created_at              timestamptz not null default now()
);

create index if not exists coaching_messages_session_idx on public.coaching_messages(session_id);
create index if not exists coaching_messages_timestamp_idx on public.coaching_messages(timestamp_ms desc);
create index if not exists coaching_messages_role_idx on public.coaching_messages(role);

alter table public.coaching_messages enable row level security;

create policy "Messages are readable by the session coachee only"
  on public.coaching_messages for select
  using (exists (
    select 1 from public.coaching_sessions s
    where s.id = session_id
      and s.coachee_id = (select id from auth.users where auth.uid() = id limit 1)
  ));

create policy "Messages are insertable by the session coachee only (coachee role)"
  on public.coaching_messages for insert
  with check (role = 'coachee' and exists (
    select 1 from public.coaching_sessions s
    where s.id = session_id
      and s.coachee_id = (select id from auth.users where auth.uid() = id limit 1)
  ));

-- System-coach messages bypass RLS (written via service key in handler);
-- for direct-client inserts we allow coachee role only above.
