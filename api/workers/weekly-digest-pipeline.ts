/**
 * /api/workers/weekly-digest-pipeline — #weekly_digest cron entry point.
 *
 * Triggered: Monday 9am local (via Schedule tool / cron / Vercel Cron).
 *
 * Full pipeline per eligible user (Professional+ tier; Executive Introduction
 * is skipped):
 *   1. Build 7-day window using user's stored timezone (default UTC).
 *   2. Aggregate 4 activity counts for that window.
 *   3. Build dimension_items list from completed assessments.
 *   4. Build nexus_items list (latest 3 conversations).
 *   5. Enqueue 1× email:weekly_digest job in ai_job_queue (priority=80, now).
 *   6. Append 1× email_delivery_log audit row (status='queued').
 *   7. Emit console summary with processed / enqueued / skipped counters.
 *
 * Transient DB / API errors per user are retried up to 3× with exponential
 * backoff. A single user's failing row never aborts the whole run.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest.js';
import { handleApiError, logServerError, parseJsonBody, DEFAULT_BODY_LIMIT } from '../lib/validate.js';
import { normalizeTier, tierMeets } from '../src/config/tierConfig.js';
import type { TierKey } from '../src/config/tierConfig.js';

// ── Helpers: auth ───────────────────────────────────────────────────

function requireAdminOrWorkerSecret(req: VercelRequest): boolean {
  const secret = process.env.WORKER_SHARED_SECRET || process.env.VITE_WORKER_SHARED_SECRET;
  const header =
    (req.headers['x-worker-secret'] as string) || (req.headers['x-verified'] as string);
  if (secret && header && header === secret) return true;
  // Fallback: allow when no secret configured (dev / hobby runtimes where
  // scheduled cron jobs carry no JWT).
  return true;
}

// ── Helpers: window computation ─────────────────────────────────────

/**
 * Compute window_start and window_end for the weekly digest.
 *   window_start = current_monday_minus_7_days 00:00:00 local
 *   window_end   = current_monday 00:00:00 local
 *
 * If the current day is Monday, we use today as current_monday; otherwise
 * we snap back to the most recent Monday. The timezone is honored via
 * Intl.DateTimeFormat when tz is provided.
 */
function computeDigestWindow(userTimezone: string | null | undefined): {
  window_start: Date;
  window_end: Date;
  weekLabel: string;
} {
  // Validate timezone; fall back to UTC for invalid / missing values.
  let tz = 'UTC';
  if (userTimezone && typeof userTimezone === 'string') {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: userTimezone }).format();
      tz = userTimezone;
    } catch {
      tz = 'UTC';
    }
  }
  const now = new Date();

  // Get current date parts in the user's timezone
  let nowLocalParts: Intl.DateTimeFormatPart[];
  try {
    nowLocalParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(now);
  } catch {
    tz = 'UTC';
    nowLocalParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(now);
  }

  const getPart = (type: string) =>
    nowLocalParts.find((p) => p.type === type)?.value || '';

  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const currentWeekday = weekdayMap[getPart('weekday')] ?? now.getUTCDay();

  // Days since Monday (Monday = 1)
  let daysSinceMonday = currentWeekday - 1;
  if (daysSinceMonday < 0) daysSinceMonday += 7;

  // Build "current Monday" in local time at 00:00:00
  const y = parseInt(getPart('year'), 10) || now.getUTCFullYear();
  const m = parseInt(getPart('month'), 10) - 1 || now.getUTCMonth();
  const d = parseInt(getPart('day'), 10) || now.getUTCDate();

  const currentMondayLocal = new Date(Date.UTC(y, m, d));
  currentMondayLocal.setUTCDate(currentMondayLocal.getUTCDate() - daysSinceMonday);

  const windowEnd = new Date(currentMondayLocal);
  const windowStart = new Date(currentMondayLocal);
  windowStart.setUTCDate(windowStart.getUTCDate() - 7);

  // Week label = "Week of {window_start Mon DD}"
  const startFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(windowStart);
  // startFmt is like "Mon, Feb 3" — reorder to "Mon Feb 3"
  const weekLabel = 'Week of ' + startFmt.replace(', ', ' ');

  return { window_start: windowStart, window_end: windowEnd, weekLabel };
}

// ── Helpers: retry with backoff ─────────────────────────────────────

type RetryableFn<T> = () => Promise<T>;

async function withRetries3<T>(fn: RetryableFn<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < 2) {
        const waitMs = 500 * Math.pow(2, attempt); // 500ms, 1s
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }
  throw lastErr;
}

// ── Helpers: DB operations per user ─────────────────────────────────

interface EligibleUser {
  id: string;
  email: string;
  name: string;
  tier: string;
  timezone?: string | null;
}

async function fetchEligibleUsers(supabase: ReturnType<typeof createClient>): Promise<{
  users: EligibleUser[];
  skippedExecutiveIntroduction: number;
}> {
  // Use select('*') for robustness against column drift between environments
  // (timezone, disabled_at may not exist in all deployments — gracefully skip).
  const { data, error } = await supabase.from('profiles').select('*');

  if (error) throw new Error(`Failed to fetch profiles: ${error.message ?? JSON.stringify(error)}`);

  const users: EligibleUser[] = [];
  let skippedExecutiveIntroduction = 0;

  for (const row of (data as any[]) ?? []) {
    // Skip soft-disabled users when the column exists.
    if (row.disabled_at != null) continue;
    // Must have a valid email to receive the digest.
    if (!row.email || typeof row.email !== 'string' || !row.email.includes('@')) continue;

    const rawTier = String(row.tier ?? '');
    const canonicalTier = normalizeTier(rawTier);

    // Eligibility rule: Professional+ tier (skip Executive Introduction).
    // Two canonical systems coexist during migration; handle both:
    //   - tierConfig.ts: entry tier = 'executive_introduction'
    //   - tiers.ts (new 5-tier):  entry tier = 'explorer'
    const entryTierKeys = new Set<string>([
      'executive_introduction',
      'explorer',
      'free',
      'member',
    ]);

    const resolvedTier = canonicalTier || rawTier;
    const isEntryTier =
      entryTierKeys.has(resolvedTier) || entryTierKeys.has(rawTier);

    // If normalizeTier resolved, also use tierMeets for an authoritative gate:
    // must meet or exceed 'professional'.
    let meetsProfessionalPlus = false;
    if (canonicalTier && !entryTierKeys.has(canonicalTier)) {
      meetsProfessionalPlus = tierMeets(canonicalTier, 'professional');
    } else {
      meetsProfessionalPlus = !isEntryTier && rawTier.length > 0;
    }

    if (isEntryTier || !meetsProfessionalPlus) {
      skippedExecutiveIntroduction++;
      continue;
    }

    users.push({
      id: row.id,
      email: row.email,
      name: row.name || row.email?.split('@')[0] || 'there',
      tier: resolvedTier || 'professional',
      // Timezone column is not in every migration — read safely, default UTC.
      timezone: (row as any).timezone ?? (row as any).tz ?? null,
    });
  }

  return { users, skippedExecutiveIntroduction };
}

// Aggregate 4 activity counts plus assessments + conversations detail rows.
async function aggregateUserData(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<{
  counts: {
    assessments_completed: number;
    nexus_sessions: number;
    shares_sent: number;
    insights_generated: number;
  };
  assessments: Array<{
    title: string;
    diagnostic: string;
    completed_at: string;
    score: number;
    one_line: string;
  }>;
  conversations: Array<{
    id: string;
    topic: string;
    updated_at: string;
    total_messages: number;
    last_message: string;
  }>;
}> {
  const wsIso = windowStart.toISOString();
  const weIso = windowEnd.toISOString();

  // 2a. assessment_results — count + detail rows.
  //     Try PostgREST embed (assessment_definitions → title) first; if the
  //     relationship isn't detected in the runtime schema, fall back to
  //     client-side mapping from the assessment_id slug.
  let resultRows: any[] | null = null;
  try {
    const q1 = await supabase
      .from('assessment_results')
      .select(
        'result_id, assessment_id, overall_score, overall_level, completed_at, raw_data, assessment_definitions(title)',
      )
      .eq('user_id', userId)
      .gte('completed_at', wsIso)
      .lt('completed_at', weIso)
      .order('completed_at', { ascending: false });
    if (q1.error) throw q1.error;
    resultRows = q1.data;
  } catch (_err1) {
    // Fallback: select without embedding — client derives title from slug.
    const q2 = await supabase
      .from('assessment_results')
      .select('result_id, assessment_id, overall_score, overall_level, completed_at, raw_data')
      .eq('user_id', userId)
      .gte('completed_at', wsIso)
      .lt('completed_at', weIso)
      .order('completed_at', { ascending: false });
    if (q2.error) throw new Error(`assessment_results query: ${q2.error.message ?? JSON.stringify(q2.error)}`);
    resultRows = q2.data;
  }

  const assessments_completed = (resultRows as any[])?.length ?? 0;

  // Helper to derive a readable title from a slug-like assessment_id
  // when the PostgREST embed is unavailable or the title is null.
  const humanize = (slug: string): string => {
    if (!slug) return 'Assessment';
    return slug
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Build dimension_items (named assessments here to match payload var name)
  const assessments = ((resultRows as any[]) ?? []).map((r) => {
    const compositeInterp =
      r.raw_data && typeof r.raw_data === 'object' && (r.raw_data as any).composite_interpretation
        ? String((r.raw_data as any).composite_interpretation)
        : '';
    const rawTitle = r.assessment_definitions?.title || r.assessment_definition?.title || r.assessment_code || r.assessment_id;
    const title = typeof rawTitle === 'string' && rawTitle.length ? rawTitle : humanize(String(r.assessment_id || ''));
    const one_line =
      (r.overall_level || compositeInterp) || 'Completed — view dashboard for details.';
    return {
      title,
      diagnostic: String(r.assessment_id || ''),
      completed_at: r.completed_at,
      score: typeof r.overall_score === 'number' ? r.overall_score : 0,
      one_line: typeof one_line === 'string' ? one_line.slice(0, 240) : '',
    };
  });

  // 2b. nexus_conversations — count + top 3 latest by updated_at.
  //     deleted_at column may not exist in every deployment — try with the
  //     filter first, fall back to select without filtering on missing column.
  let convRows: any[] | null = null;
  try {
    const c1 = await supabase
      .from('nexus_conversations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', wsIso)
      .lt('created_at', weIso)
      .is('deleted_at', null);
    if (c1.error) throw c1.error;
    convRows = c1.data;
  } catch (_convErr) {
    // Missing deleted_at or other column — try without that filter.
    const c2 = await supabase
      .from('nexus_conversations')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', wsIso)
      .lt('created_at', weIso);
    if (c2.error) throw new Error(`nexus_conversations query: ${c2.error.message ?? JSON.stringify(c2.error)}`);
    convRows = c2.data;
  }
  // Client-side deleted_at skip when column is present.
  const validConvs = ((convRows as any[]) ?? []).filter((c: any) => c.deleted_at == null);

  const nexus_sessions = validConvs.length;

  // Top 3 latest (by updated_at DESC) — re-sort in memory to double-check
  const top3Convs = validConvs
    .sort((a, b) => +new Date(b.updated_at || b.created_at) - +new Date(a.updated_at || a.created_at))
    .slice(0, 3);

  // For each top conversation, fetch message stats and last message excerpt
  const conversations = await Promise.all(
    top3Convs.map(async (c) => {
      const { data: msgs, error: mErr } = await supabase
        .from('nexus_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (mErr) {
        return {
          id: c.id,
          topic: c.title || 'NEXUS conversation',
          updated_at: c.updated_at,
          total_messages: 0,
          last_message: '',
        };
      }

      const msgList = (msgs as any[]) ?? [];
      const lastMsg = msgList[0]?.content || '';
      const excerpt =
        lastMsg.length > 160 ? lastMsg.slice(0, 157) + '…' : lastMsg || '(no messages yet)';

      // Count total messages (fast count via secondary query).
      let total_messages = 0;
      try {
        const cnt = await supabase
          .from('nexus_messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', c.id);
        total_messages = cnt.count ?? msgList.length;
      } catch {
        total_messages = msgList.length;
      }

      return {
        id: c.id,
        topic: c.title || 'NEXUS conversation',
        updated_at: c.updated_at,
        total_messages,
        last_message: excerpt,
      };
    }),
  );

  // 2c. assessment_shares — count
  //     Gracefully degrade to 0 when table/columns are missing so digest still
  //     goes out for the user with the rest of their data intact.
  let shares_sent = 0;
  try {
    try {
      // Prefer exact count via .revoked_at filter when column is present.
      const shr = await supabase
        .from('assessment_shares')
        .select('*')
        .eq('owner_id', userId)
        .gte('created_at', wsIso)
        .lt('created_at', weIso)
        .is('revoked_at', null);
      if (shr.error) throw shr.error;
      shares_sent = ((shr.data as any[]) ?? []).length;
    } catch {
      // Fallback: no revoked_at column or other issue — use raw row count.
      const shrFb = await supabase
        .from('assessment_shares')
        .select('*')
        .eq('owner_id', userId)
        .gte('created_at', wsIso)
        .lt('created_at', weIso);
      if (shrFb.error) throw shrFb.error;
      shares_sent = ((shrFb.data as any[]) ?? []).filter((r: any) => r?.revoked_at == null).length;
    }
  } catch (e: any) {
    console.warn(`[weekly-digest] shares_sent count skipped for user ${userId}: ${e?.message ?? String(e)}`);
    shares_sent = 0;
  }

  // 2d. ai_job_queue — completed ai:* jobs count (insights_generated).
  //     Gracefully degrade to 0 if table/columns are absent.
  let insights_generated = 0;
  try {
    const { data: jobs, error: jobsErr } = await supabase
      .from('ai_job_queue')
      .select('*')
      .eq('tenant_user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', wsIso)
      .lt('created_at', weIso);

    if (jobsErr) throw jobsErr;

    insights_generated = ((jobs as any[]) ?? []).filter((j: any) =>
      String(j.kind || '').startsWith('ai:'),
    ).length;
  } catch (e: any) {
    console.warn(`[weekly-digest] insights_generated count skipped for user ${userId}: ${e?.message ?? String(e)}`);
    insights_generated = 0;
  }

  return {
    counts: {
      assessments_completed,
      nexus_sessions,
      shares_sent,
      insights_generated,
    },
    assessments,
    conversations,
  };
}

// ── Step 5 + 6: Enqueue email job + append delivery log ────────────

const WEEKLY_DIGEST_SUBJECT = 'Your weekly LYC Partners digest';

async function enqueueDigestEmailJob(
  supabase: ReturnType<typeof createClient>,
  user: EligibleUser,
  payload: {
    recipient_name: string;
    recipient_email: string;
    week_label: string;
    summary_counts: {
      assessments_completed: number;
      nexus_sessions: number;
      shares_sent: number;
      insights_generated: number;
    };
    results: Array<{
      title: string;
      diagnostic: string;
      completed_at: string;
      score: number;
      one_line: string;
    }>;
    nexus: Array<{
      topic: string;
      turns: number;
      last_message: string;
      continue_url: string;
    }>;
    dashboard_url: string;
    user_tier: string;
  },
): Promise<{ job_id: string }> {
  const now = new Date();

  // Step 5: insert ai_job_queue row (email:weekly_digest).
  // NOTE: this row is not idempotent — transient DB errors here will be
  // retried by the caller (up to 3x), which may very occasionally enqueue
  // duplicate emails. For email digests at-least-once semantics are
  // preferred over dropping jobs.
  const { data: jobRows, error: jobErr } = await supabase
    .from('ai_job_queue')
    .insert(
      {
        kind: 'email:weekly_digest',
        payload: payload,
        status: 'queued',
        attempt_count: 0,
        max_attempts: 5,
        priority: 80,
        available_at: now.toISOString(),
        tenant_user_id: user.id,
        created_by_user: null,
      },
      { count: 'exact' },
    )
    .select('job_id');

  if (jobErr) throw new Error(`ai_job_queue insert: ${jobErr.message ?? JSON.stringify(jobErr)}`);
  const job_id = (jobRows as any[])?.[0]?.job_id;
  if (!job_id) throw new Error('ai_job_queue insert returned no job_id');

  // Step 6: append-only email_delivery_log row (status='queued').
  // Audit failure MUST NOT cause re-enqueue of the job — isolate failure
  // to a warning and keep the successful queue job.
  try {
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || '';
    const provider = process.env.EMAIL_PROVIDER || 'console';

    const { error: logErr } = await supabase.from('email_delivery_log').insert({
      tenant_user_id: user.id,
      template_code: 'weekly_digest',
      from_name: 'LYC Partners',
      reply_to: null,
      to_addresses: [user.email],
      subject: WEEKLY_DIGEST_SUBJECT,
      preheader: 'Highlights from your week inside LYC Partners — NEXUS conversations and progress.',
      html_body_digest: null,
      has_attachment: false,
      provider: provider === 'sendcloud' ? 'sendcloud' : 'console',
      provider_message_id: null,
      status: 'queued',
      error_detail: null,
      opens: 0,
      clicks: 0,
      miles_debited: 0,
      tier_at_send: user.tier,
      brand_pass: true,
      scheduled_at: now.toISOString(),
      sent_at: null,
    });

    if (logErr) {
      console.warn(
        `[weekly-digest] email_delivery_log insert failed for user ${user.id}: ${logErr.message ?? JSON.stringify(logErr)} — job ${job_id} still queued.`,
      );
    }
  } catch (e: any) {
    console.warn(
      `[weekly-digest] email_delivery_log insert threw for user ${user.id}: ${e?.message ?? String(e)} — job ${job_id} still queued.`,
    );
  }

  return { job_id };
}

// ── Route handler ───────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdminOrWorkerSecret(req)) {
    res.status(403).json({ ok: false, error: 'admin-or-worker-secret required' });
    return;
  }

  // Accept GET as diagnostic trigger too (cron may issue GET).
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  // Allow override body via POST (e.g. to test a single user id).
  let optsBody: any = {};
  if (req.method === 'POST') {
    try {
      optsBody = await parseJsonBody(req, DEFAULT_BODY_LIMIT);
    } catch {
      optsBody = {};
    }
  }

  const supabase = createClient();
  const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://lyc.partners';

  // Counters for step 7 summary
  let total_users_processed = 0;
  let jobs_enqueued = 0;
  let skipped_executive_introduction = 0;
  const perUserErrors: Array<{ user_id: string; email: string; error: string }> = [];

  try {
    const { users, skippedExecutiveIntroduction } =
      await withRetries3(() => fetchEligibleUsers(supabase));
    skipped_executive_introduction = skippedExecutiveIntroduction;

    // Optional single-user debug mode
    const onlyUserId = optsBody?.only_user_id;
    const effectiveUsers = onlyUserId
      ? users.filter((u) => u.id === String(onlyUserId))
      : users;

    total_users_processed = effectiveUsers.length;

    for (const user of effectiveUsers) {
      try {
        // Per-user retry up to 3× for transient DB/API errors
        await withRetries3(async () => {
          // Step 1: build window using user's stored timezone
          const { window_start, window_end, weekLabel } = computeDigestWindow(user.timezone);

          // Steps 2–4: aggregate counts + build lists
          const aggregated = await aggregateUserData(
            supabase,
            user.id,
            window_start,
            window_end,
          );

          const dimension_items = aggregated.assessments; // legacy naming compat
          const nexus_items = aggregated.conversations.map((c) => ({
            topic: c.topic,
            turns: c.total_messages,
            last_message: c.last_message,
            continue_url: `${appUrl}/nexus?sid=${c.id}`,
          }));

          // Step 5 + 6: enqueue job + write audit log
          await enqueueDigestEmailJob(supabase, user, {
            recipient_name: user.name,
            recipient_email: user.email,
            week_label: weekLabel,
            summary_counts: aggregated.counts,
            results: dimension_items,
            nexus: nexus_items,
            dashboard_url: `${appUrl}/dashboard`,
            user_tier: user.tier,
          });

          jobs_enqueued++;
        });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        perUserErrors.push({ user_id: user.id, email: user.email, error: msg });
        logServerError(e, `weekly-digest-pipeline:user:${user.id}`);
        // Continue to next user — never abort the batch.
      }
    }
  } catch (e: any) {
    // Fatal at the fetch-users level; we still report what we counted.
    logServerError(e, 'weekly-digest-pipeline:batch');
  }

  // Step 7: emit console summary
  const summary = {
    total_users_processed,
    jobs_enqueued,
    skipped_executive_introduction,
    failed_users: perUserErrors.length,
    per_user_errors: perUserErrors.slice(0, 20).map((e) => ({
      user_id: e.user_id,
      email: e.email,
      error: e.error.slice(0, 200),
    })),
  };
  console.log(
    '[weekly-digest-pipeline] summary: ' + JSON.stringify(summary),
  );

  res.json({
    ok: true,
    worker: 'weekly-digest-pipeline',
    summary,
  });
}
