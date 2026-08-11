-- ============================================================
--  ECHO AUDIT — TEST ACCOUNTS SEED (5 portal personas)
--
--  Run this in Supabase SQL Editor while signed in as a project owner.
--  It creates 5 test users via auth.users (sign-in below) AND the
--  matching `profiles` rows, org row for the client test account,
--  and `credits` opening balances so each persona has miles to play.
--
--  ⚠️  BEFORE YOU RUN THIS:
--   1. Replace SUPABASE_PROJECT_REF below with the 12-char project ref
--      (the subdomain before `supabase.co` in your URL) if you want
--      the `magiclink_login_urls` to be clickable — otherwise log
--      in with the email + password pair listed.
--   2. All passwords are ONE-TIME only for the audit. Rotate or disable
--      these accounts when the audit is complete (see end of file).
--
--  Credentials:
--    Leader (member tier)    — leader.echo@lyc-intelligence.app  / LeaderEcho!2026
--    Consultant              — consultant.echo@lyc-intelligence.app / ConsultantEcho!2026
--    Candidate               — candidate.echo@lyc-intelligence.app / CandidateEcho!2026
--    Client Admin            — clientadmin.echo@lyc-intelligence.app / ClientAdminEcho!2026
--    Admin                   — admin.echo@lyc-intelligence.app    / AdminEcho!2026
-- ============================================================

-- ════════════════════════════════════════════════════════════════
-- 1. CREATE 5 AUTH.USERS + sign-in emails (passwords for HTTP login)
--    Note: in Supabase cloud you can use the Auth dashboard to sign
--    up users via email+password directly, which guarantees hash
--    compatibility with crypt/bcrypt. This SQL *seeds* users where
--    the project has `auth.users` writable. If not, create them in
--    the dashboard using the emails/passwords above, then run the
--    sections below (2..4) which only touch `profiles`, `credits`,
--    and `organizations`.
-- ════════════════════════════════════════════════════════════════

-- Because auth.sign_up SQL wrappers differ by Supabase version, the
-- canonical path is: create users via dashboard, obtain their UUIDs,
-- then paste them here. We'll reference each by a deterministic UUID
-- (v5, namespace DNS 'lyc-intelligence.app') so you can match.
-- If you create via dashboard, overwrite these UUIDs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public._echo_uuid(email text) RETURNS uuid AS $$
BEGIN
  RETURN uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, email);
EXCEPTION WHEN OTHERS THEN
  -- Fallback: use md5-based UUID if uuid-ossp not installed.
  RETURN (
    '00000000-0000-0000-0000-' ||
    lpad(to_hex(abs(hashtext(email)) % 1000000000000::bigint), 12, '0')
  )::uuid;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Uncomment and adapt ONLY if you have direct auth.users insert privilege
-- (Supabase self-hosted / project with auth schema access):
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data) VALUES
--   (public._echo_uuid('leader.echo@lyc-intelligence.app'),     'leader.echo@lyc-intelligence.app',     crypt('LeaderEcho!2026',     gen_salt('bf')), now(), now(), now(), '{"role":"member","tier":"executive"}'::jsonb),
--   (public._echo_uuid('consultant.echo@lyc-intelligence.app'), 'consultant.echo@lyc-intelligence.app', crypt('ConsultantEcho!2026', gen_salt('bf')), now(), now(), now(), '{"role":"lyc_consultant"}'::jsonb),
--   (public._echo_uuid('candidate.echo@lyc-intelligence.app'),  'candidate.echo@lyc-intelligence.app',  crypt('CandidateEcho!2026',  gen_salt('bf')), now(), now(), now(), '{"role":"candidate"}'::jsonb),
--   (public._echo_uuid('clientadmin.echo@lyc-intelligence.app'),'clientadmin.echo@lyc-intelligence.app',crypt('ClientAdminEcho!2026', gen_salt('bf')), now(), now(), now(), '{"role":"client_admin"}'::jsonb),
--   (public._echo_uuid('admin.echo@lyc-intelligence.app'),       'admin.echo@lyc-intelligence.app',       crypt('AdminEcho!2026',       gen_salt('bf')), now(), now(), now(), '{"role":"admin"}'::jsonb)
-- ON CONFLICT (id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 2. ORGANIZATION for Client Admin
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.organizations (id, name, created_at, updated_at)
VALUES (
  public._echo_uuid('echo-client-co.com'),
  'Echo Client Co. (Audit Fixture)',
  now(), now()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ════════════════════════════════════════════════════════════════
-- 3. PROFILES ROWS (role + organization_id + tier — source of truth)
--    These get matched to auth.users via id = user UUID. If you
--    created users via the dashboard, REPLACE the UUIDs below with
--    the ones shown in Auth → Users table.
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.profiles
  (id, email, name, role,          tier,        organization_id,                                          icp,              subtype, active_surface, created_at, updated_at)
VALUES
  (public._echo_uuid('leader.echo@lyc-intelligence.app'),       'leader.echo@lyc-intelligence.app',       'Echo — Leader Member',    'member',        'pro',       NULL,                                                      'leader',         'echo_audit', 'b2c_leader_portal', now(), now()),
  (public._echo_uuid('consultant.echo@lyc-intelligence.app'),   'consultant.echo@lyc-intelligence.app',   'Echo — Consultant',       'lyc_consultant', NULL,      NULL,                                                      'consultant',     'echo_audit', 'consultant_portal', now(), now()),
  (public._echo_uuid('candidate.echo@lyc-intelligence.app'),    'candidate.echo@lyc-intelligence.app',    'Echo — Candidate',        'candidate',     NULL,       NULL,                                                      'candidate',      'echo_audit', 'candidate_portal', now(), now()),
  (public._echo_uuid('clientadmin.echo@lyc-intelligence.app'),  'clientadmin.echo@lyc-intelligence.app',  'Echo — Client Admin',     'client_admin',  NULL,       public._echo_uuid('echo-client-co.com'),                        'client',         'echo_audit', 'client_portal',   now(), now()),
  (public._echo_uuid('admin.echo@lyc-intelligence.app'),        'admin.echo@lyc-intelligence.app',        'Echo — Platform Admin',   'admin',         NULL,       NULL,                                                      'admin',          'echo_audit', 'admin_portal',    now(), now())
ON CONFLICT (id) DO UPDATE
SET
  email      = EXCLUDED.email,
  name       = EXCLUDED.name,
  role       = EXCLUDED.role,
  tier       = COALESCE(EXCLUDED.tier, profiles.tier),
  organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id),
  icp        = EXCLUDED.icp,
  subtype    = EXCLUDED.subtype,
  active_surface = EXCLUDED.active_surface,
  updated_at = now();

-- ════════════════════════════════════════════════════════════════
-- 4. CREDITS opening balances so each persona can take assessments
-- ════════════════════════════════════════════════════════════════
INSERT INTO public.credits (id, user_id, balance, updated_at)
SELECT
  gen_random_uuid(),
  public._echo_uuid(e),
  bal,
  now()
FROM (VALUES
  ('leader.echo@lyc-intelligence.app',     500),
  ('consultant.echo@lyc-intelligence.app', 2500),
  ('candidate.echo@lyc-intelligence.app',  200),
  ('clientadmin.echo@lyc-intelligence.app',1000),
  ('admin.echo@lyc-intelligence.app',      9999)
) AS t(email, e, bal)
WHERE NOT EXISTS (
  SELECT 1 FROM public.credits c WHERE c.user_id = public._echo_uuid(t.email)
);

-- ════════════════════════════════════════════════════════════════
-- 5. POST-AUDIT TEARDOWN (when you're ready to delete fixtures)
--    Uncomment the 4 statements below and re-run the file.
-- ════════════════════════════════════════════════════════════════
-- DELETE FROM public.credit_transactions WHERE user_id IN (
--   public._echo_uuid('leader.echo@lyc-intelligence.app'),
--   public._echo_uuid('consultant.echo@lyc-intelligence.app'),
--   public._echo_uuid('candidate.echo@lyc-intelligence.app'),
--   public._echo_uuid('clientadmin.echo@lyc-intelligence.app'),
--   public._echo_uuid('admin.echo@lyc-intelligence.app')
-- );
-- DELETE FROM public.credits    WHERE user_id IN (SELECT public._echo_uuid(a) FROM (VALUES('leader.echo@lyc-intelligence.app'),('consultant.echo@lyc-intelligence.app'),('candidate.echo@lyc-intelligence.app'),('clientadmin.echo@lyc-intelligence.app'),('admin.echo@lyc-intelligence.app')) u(a));
-- DELETE FROM public.profiles   WHERE id     IN (SELECT public._echo_uuid(a) FROM (VALUES('leader.echo@lyc-intelligence.app'),('consultant.echo@lyc-intelligence.app'),('candidate.echo@lyc-intelligence.app'),('clientadmin.echo@lyc-intelligence.app'),('admin.echo@lyc-intelligence.app')) u(a));
-- DELETE FROM public.organizations WHERE id = public._echo_uuid('echo-client-co.com');
-- -- Then in Auth → Users, delete the 5 echo@ accounts by email.
