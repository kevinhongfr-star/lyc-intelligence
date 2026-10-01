/**
 * /api/cron/monthly-summary — LYC Partners monthly summary batch pipeline.
 *
 * Trigger: POST with X-Cron-Secret header (or Authorization: Bearer …).
 * Timing: intended for 1st of month 09:00 local per user timezone.
 *
 * End-to-end flow:
 *   1. Query eligible users (Professional+ tier; Executive Introduction excluded).
 *   2. Build timezone-aware calendar-month window per user.
 *   3. Aggregate counts: assessments, nexus sessions, shares, insights,
 *      highest score, assessments per diagnostic.
 *   4. Build optional 3-month trend comparison.
 *   5. Enqueue email:monthly_summary job per user into ai_job_queue.
 *   6. Append email_delivery_log audit row (template_code = monthly_summary).
 *   7. Return summary metrics.
 *
 * Retry: 3x per user on transient errors; continues past individual failures.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../_lib/supabase-rest.js';

const CRON_SECRET = process.env.CRON_SECRET || process.env.WORKER_SHARED_SECRET || '';
const APP_URL = process.env.APP_URL || process.env.VERCEL_URL || '';

export const config = { runtime: 'nodejs' };

const ELIGIBLE_TIERS = [
  'professional',
  'starter',
  'pro',
  'executive',
  'council',
  'enterprise',
];

const DIAGNOSTIC_SLUGS = ['prism', 'spark', 'forge', 'bridge', 'mosaic', 'drive'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ── Timezone helpers ─────────────────────────────────────────────── */

function formatInTz(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function localDateToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date {
  let ts = Date.UTC(year, month - 1, day, hour, minute, second);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  for (let i = 0; i < 6; i++) {
    const p = formatter.formatToParts(new Date(ts));
    const get = (t: string) =>
      parseInt(p.find((x) => x.type === t)?.value ?? '0', 10);
    const fy = get('year');
    const fm = get('month');
    const fd = get('day');
    const fh = get('hour');
    const fmin = get('minute');
    const fs = get('second');

    if (
      fy === year &&
      fm === month &&
      fd === day &&
      fh === hour &&
      fmin === minute &&
      fs === second
    ) {
      return new Date(ts);
    }

    const actual = Date.UTC(fy, fm - 1, fd, fh, fmin, fs);
    const desired = Date.UTC(year, month - 1, day, hour, minute, second);
    ts += desired - actual;
  }

  return new Date(ts);
}

function getPreviousMonthWindow(tz: string) {
  const now = new Date();
  const { year, month } = formatInTz(now, tz);

  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const start = localDateToUtc(prevYear, prevMonth, 1, 0, 0, 0, tz);
  const end = localDateToUtc(year, month, 1, 0, 0, 0, tz);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${MONTH_NAMES[prevMonth - 1]} ${prevYear}`,
    year: prevYear,
    month: prevMonth,
  };
}

function get3MonthTrendWindows(tz: string) {
  const now = new Date();
  const { year, month } = formatInTz(now, tz);

  let m = month - 1;
  let y = year;
  if (m === 0) {
    m = 12;
    y = year - 1;
  }

  const windows: Array<{
    start: string;
    end: string;
    label: string;
    year: number;
    month: number;
  }> = [];

  for (let i = 0; i < 3; i++) {
    const start = localDateToUtc(y, m, 1, 0, 0, 0, tz);
    let endYear = y;
    let endMonth = m + 1;
    if (endMonth === 13) {
      endMonth = 1;
      endYear = y + 1;
    }
    const end = localDateToUtc(endYear, endMonth, 1, 0, 0, 0, tz);

    windows.unshift({
      start: start.toISOString(),
      end: end.toISOString(),
      label: `${MONTH_NAMES[m - 1]} ${y}`,
      year: y,
      month: m,
    });

    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }

  return windows;
}

/* ── Data aggregation ─────────────────────────────────────────────── */

interface UserWindow {
  userId: string;
  email: string;
  name: string;
  tier: string;
  tz: string;
  window: ReturnType<typeof getPreviousMonthWindow>;
  trendWindows: ReturnType<typeof get3MonthTrendWindows>;
}

interface BatchData {
  results: Array<{
    user_id: string | null;
    completed_at: string;
    overall_score: number | null;
    assessment_id: string | null;
  }>;
  conversations: Array<{
    user_id: string;
    created_at: string;
  }>;
  shares: Array<{
    owner_id: string;
    created_at: string;
  }>;
  insights: Array<{
    tenant_user_id: string | null;
    kind: string;
    status: string;
    created_at: string;
  }>;
}

function inWindow(iso: string, start: string, end: string) {
  const t = new Date(iso).getTime();
  return t >= new Date(start).getTime() && t < new Date(end).getTime();
}

async function fetchBatchData(
  supabase: ReturnType<typeof createClient>,
  globalStart: string,
  globalEnd: string,
  userIds: string[],
): Promise<BatchData> {
  const [resultsRes, conversationsRes, sharesRes, insightsRes] =
    await Promise.all([
      supabase
        .from('assessment_results')
        .select('user_id, completed_at, overall_score, assessment_id')
        .in('user_id', userIds)
        .gte('completed_at', globalStart)
        .lt('completed_at', globalEnd),
      supabase
        .from('nexus_conversations')
        .select('user_id, created_at')
        .in('user_id', userIds)
        .gte('created_at', globalStart)
        .lt('created_at', globalEnd),
      supabase
        .from('assessment_shares')
        .select('owner_id, created_at')
        .in('owner_id', userIds)
        .gte('created_at', globalStart)
        .lt('created_at', globalEnd),
      supabase
        .from('ai_job_queue')
        .select('tenant_user_id, kind, status, created_at')
        .in('tenant_user_id', userIds)
        .eq('status', 'completed')
        .gte('created_at', globalStart)
        .lt('created_at', globalEnd),
    ]);

  if (resultsRes.error) throw new Error(`assessment_results fetch failed: ${JSON.stringify(resultsRes.error)}`);
  if (conversationsRes.error) throw new Error(`nexus_conversations fetch failed: ${JSON.stringify(conversationsRes.error)}`);
  if (sharesRes.error) throw new Error(`assessment_shares fetch failed: ${JSON.stringify(sharesRes.error)}`);
  if (insightsRes.error) throw new Error(`ai_job_queue fetch failed: ${JSON.stringify(insightsRes.error)}`);

  return {
    results: (resultsRes.data ?? []).filter((r) => r.user_id != null),
    conversations: conversationsRes.data ?? [],
    shares: sharesRes.data ?? [],
    insights: (insightsRes.data ?? []).filter(
      (r) => r.tenant_user_id != null && String(r.kind ?? '').startsWith('ai:'),
    ),
  };
}

function buildUserSummary(user: UserWindow, batchData: BatchData) {
  const { window, trendWindows } = user;

  const userResults = batchData.results.filter(
    (r) => r.user_id === user.userId && inWindow(r.completed_at, window.start, window.end),
  );

  const userConversations = batchData.conversations.filter(
    (r) => r.user_id === user.userId && inWindow(r.created_at, window.start, window.end),
  );

  const userShares = batchData.shares.filter(
    (r) => r.owner_id === user.userId && inWindow(r.created_at, window.start, window.end),
  );

  const userInsights = batchData.insights.filter(
    (r) =>
      r.tenant_user_id === user.userId &&
      inWindow(r.created_at, window.start, window.end),
  );

  const scores = userResults
    .map((r) => r.overall_score)
    .filter((s): s is number => s != null);

  const highest_single_score = scores.length > 0 ? Math.max(...scores) : null;

  const assessments_per_diagnostic: Record<string, number> = {};
  for (const slug of DIAGNOSTIC_SLUGS) assessments_per_diagnostic[slug] = 0;
  for (const r of userResults) {
    if (r.assessment_id && r.assessment_id in assessments_per_diagnostic) {
      assessments_per_diagnostic[r.assessment_id]++;
    }
  }

  const three_month_comparison = [];
  for (const tw of trendWindows) {
    const monthResults = batchData.results.filter(
      (r) =>
        r.user_id === user.userId &&
        inWindow(r.completed_at, tw.start, tw.end),
    );
    const monthScores = monthResults
      .map((r) => r.overall_score)
      .filter((s): s is number => s != null);
    three_month_comparison.push({
      month: tw.label,
      assessments_completed: monthResults.length,
      avg_score:
        monthScores.length > 0
          ? Math.round(
              monthScores.reduce((a, b) => a + b, 0) / monthScores.length,
            )
          : null,
    });
  }

  const monthsWithData = three_month_comparison.filter(
    (m) => m.assessments_completed > 0,
  );

  const trend = {
    highest_single_score,
    assessments_per_diagnostic,
    ...(monthsWithData.length >= 2
      ? { three_month_comparison }
      : {}),
  };

  return {
    recipient_name: user.name || 'Member',
    recipient_email: user.email,
    user_tier: user.tier,
    month_label: window.label,
    summary_counts: {
      assessments_completed: userResults.length,
      nexus_sessions: userConversations.length,
      shares_sent: userShares.length,
      insights_generated: userInsights.length,
    },
    trend,
    account_url: `${APP_URL}/settings/account`,
  };
}

/* ── Retry helper ─────────────────────────────────────────────────── */

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

/* ── Per-user actions ─────────────────────────────────────────────── */

async function enqueueMonthlySummary(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
  userId: string,
) {
  const { error } = await supabase.from('ai_job_queue').insert({
    kind: 'email:monthly_summary',
    payload,
    priority: 100,
    available_at: new Date().toISOString(),
    tenant_user_id: userId,
    status: 'queued',
  });
  if (error) throw error;
}

async function appendAuditLog(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  tier: string,
  monthLabel: string,
) {
  const { error } = await supabase.from('email_delivery_log').insert({
    tenant_user_id: userId,
    template_code: 'monthly_summary',
    from_name: 'LYC Partners',
    to_addresses: [email],
    subject: `Your monthly LYC Partners summary — ${monthLabel}`,
    provider: 'console',
    status: 'queued',
    has_attachment: false,
    miles_debited: 0,
    tier_at_send: tier,
    scheduled_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/* ── Pipeline entrypoint ──────────────────────────────────────────── */

async function runMonthlySummaryPipeline() {
  const supabase = createClient();

  // 1. Fetch eligible users
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, name, tier, timezone')
    .in('tier', ELIGIBLE_TIERS);

  if (usersError) {
    throw new Error(
      `Failed to fetch eligible users: ${JSON.stringify(usersError)}`,
    );
  }

  if (!users || users.length === 0) {
    return {
      total_users_processed: 0,
      jobs_enqueued: 0,
      skipped: 0,
    };
  }

  // 2. Compute windows per user
  const userWindows: UserWindow[] = users.map((u: any) => {
    const tz = u.timezone || 'UTC';
    return {
      userId: u.id,
      email: u.email,
      name: u.name,
      tier: u.tier,
      tz,
      window: getPreviousMonthWindow(tz),
      trendWindows: get3MonthTrendWindows(tz),
    };
  });

  // 3. Determine global data window
  const allWindowEnds = userWindows.map((u) => u.window.end);
  const allTrendStarts = userWindows.flatMap((u) =>
    u.trendWindows.map((t) => t.start),
  );
  const globalStart = allTrendStarts.sort()[0];
  const globalEnd = allWindowEnds.sort()[allWindowEnds.length - 1];

  // 4. Batch fetch data
  const userIds = userWindows.map((u) => u.userId);
  const batchData = await fetchBatchData(supabase, globalStart, globalEnd, userIds);

  // 5. Process each user
  let jobsEnqueued = 0;
  let skipped = 0;

  for (const user of userWindows) {
    try {
      const payload = buildUserSummary(user, batchData);
      await withRetry(() =>
        enqueueMonthlySummary(supabase, payload, user.userId),
      );
      await withRetry(() =>
        appendAuditLog(
          supabase,
          user.userId,
          user.email,
          user.tier,
          payload.month_label,
        ),
      );
      jobsEnqueued++;
    } catch (e) {
      console.error(
        `[monthly-summary] Failed for user ${user.userId} (${user.email}):`,
        e,
      );
      skipped++;
    }
  }

  return {
    total_users_processed: userWindows.length,
    jobs_enqueued: jobsEnqueued,
    skipped,
  };
}

/* ── HTTP handler ─────────────────────────────────────────────────── */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Auth
  if (CRON_SECRET) {
    const header =
      (req.headers['x-cron-secret'] as string) ||
      (req.headers['authorization'] as string) ||
      '';
    const token = String(header).replace(/^Bearer\s+/i, '');
    if (token !== CRON_SECRET) {
      return res.status(403).json({ ok: false, error: 'cron-secret required' });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      note: 'POST to run monthly-summary pipeline.',
      eligible_tiers: ELIGIBLE_TIERS,
      app_url: APP_URL || null,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  try {
    const result = await runMonthlySummaryPipeline();
    return res.status(200).json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[monthly-summary] Pipeline error:', e);
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Pipeline failed',
    });
  }
}
