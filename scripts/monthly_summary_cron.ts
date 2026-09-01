#!/usr/bin/env node
/**
 * scripts/monthly_summary_cron.ts — LYC Partners Monthly Summary Pipeline
 *
 * Triggered on the 1st of every month at 9am local time.
 *
 * End-to-end pipeline:
 *   1. Load every eligible user (Professional+ tier; Executive Introduction excluded)
 *   2. For each user, build calendar-month window using their stored timezone
 *   3. Aggregate 6 monthly metrics
 *   4. Build a 3-month trended comparison (if data exists across prior 2 months)
 *   5. Enqueue an email:monthly_summary job via ai_job_queue
 *   6. Append an audit row to email_delivery_log
 *   7. Retry transient errors 3x per user; continue past any single-user failure
 *   8. Print final run summary
 *
 * Usage (CLI):
 *   npx tsx scripts/monthly_summary_cron.ts            # run for all users
 *   DATABASE_URL=postgres://... node dist/monthly_summary_cron.js
 *   DRY_RUN=1 npx tsx scripts/monthly_summary_cron.ts  # compute only, no writes
 *   SINGLE_USER_ID=<uuid> npx tsx ...                  # test one user
 *
 * Env vars:
 *   DATABASE_URL            — Postgres connection string (preferred)
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — fallback (pg only uses DATABASE_URL)
 *   APP_URL                 — e.g. https://app.lyc.partners (for account_url in payload)
 *   DRY_RUN                 — if "1", skip all writes
 *   SINGLE_USER_ID          — only process this user_id (UUID)
 *   MAX_USERS               — cap user count (for testing)
 *   RETRY_ATTEMPTS          — per-user retries (default 3)
 *   LOG_LEVEL               — "debug" | "info" | "warn" | "error"
 */

import { Client, Pool } from 'pg';

// ─────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
function log(level: LogLevel, msg: string, extra?: Record<string, any>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[LOG_LEVEL]) return;
  const ts = new Date().toISOString();
  const payload = extra ? ` | ${JSON.stringify(extra)}` : '';
  const line = `[${ts}] [monthly-summary:cron] [${level.toUpperCase()}] ${msg}${payload}`;
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

// ─────────────────────────────────────────────────────────────────────
// Timezone helpers (no external deps — uses Intl API)
// ─────────────────────────────────────────────────────────────────────

/**
 * Convert local wall-clock fields in a given timezone to an absolute Date (UTC instant).
 * Uses iterative correction over Intl.DateTimeFormat (converges in ~2 iterations).
 */
function localToUTC(
  year: number,
  month0: number, // 0-based
  day: number,
  hour: number,
  minute: number,
  second: number,
  tz: string,
): Date {
  // target: the wall-clock fields treated "as if UTC" — a fixed reference value.
  // We iteratively find the UTC instant X such that rendering X in the target
  // timezone produces exactly the requested wall-clock fields.
  const targetMs = Date.UTC(year, month0, day, hour, minute, second);
  let guessMs = targetMs;
  for (let i = 0; i < 6; i++) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = fmt.formatToParts(new Date(guessMs));
    const pick = (t: string) => {
      const p = parts.find((x) => x.type === t);
      return p ? parseInt(p.value, 10) : 0;
    };
    const gotMs = Date.UTC(
      pick('year'),
      pick('month') - 1,
      pick('day'),
      pick('hour'),
      pick('minute'),
      pick('second'),
    );
    const diff = targetMs - gotMs;
    if (diff === 0) break;
    guessMs += diff;
  }
  return new Date(guessMs);
}

/** Return IANA timezone, defaulting to 'UTC'. */
function normalizeTz(raw: string | null | undefined): string {
  if (!raw) return 'UTC';
  try {
    // Validate by attempting to use it
    new Intl.DateTimeFormat('en-US', { timeZone: raw });
    return raw;
  } catch {
    return 'UTC';
  }
}

/**
 * Compute the calendar-month window for the "previous completed month".
 * Returns { window_start, window_end, month_label, local_year, local_month }.
 */
export function buildWindow(
  tzInput: string | null | undefined,
  referenceDate: Date = new Date(),
): {
  window_start: Date;
  window_end: Date;
  month_label: string; // e.g. "February 2026"
  local_year: number;
  local_month: number; // 1-based (the window month)
} {
  const tz = normalizeTz(tzInput);
  const fmtParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(referenceDate);
  const get = (t: string) => parseInt(fmtParts.find((p) => p.type === t)!.value, 10);

  // Local "now"
  let localYear = get('year');
  let localMonth1 = get('month'); // 1-based

  // Step back one month to get the target window (previous completed month)
  localMonth1 -= 1;
  if (localMonth1 <= 0) {
    localMonth1 = 12;
    localYear -= 1;
  }

  const window_start = localToUTC(localYear, localMonth1 - 1, 1, 0, 0, 0, tz);

  // Window end = first day of current month 00:00:00 local
  let nextYear = localYear;
  let nextMonth1 = localMonth1 + 1;
  if (nextMonth1 > 12) {
    nextMonth1 = 1;
    nextYear += 1;
  }
  const window_end = localToUTC(nextYear, nextMonth1 - 1, 1, 0, 0, 0, tz);

  // Month label for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month_label = `${monthNames[localMonth1 - 1]} ${localYear}`;

  return { window_start, window_end, month_label, local_year: localYear, local_month: localMonth1 };
}

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

interface EligibleUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  tier_key: string;
  tier_display_name: string;
  timezone: string | null;
}

interface SummaryCounts {
  assessments_completed: number;
  nexus_sessions: number;
  shares_sent: number;
  insights_generated: number;
}

interface Trend {
  highest_single_score: number | null;
  assessments_per_diagnostic: Record<string, number>;
  three_month_comparison?: Array<{
    month: string; // e.g. "February 2026"
    assessments_completed: number;
    avg_score: number | null;
  }>;
}

interface MonthlyPayload {
  recipient_name: string | null;
  recipient_email: string;
  user_tier: string;
  month_label: string;
  summary_counts: SummaryCounts;
  trend: Trend;
  account_url: string;
}

interface RunStats {
  total_users_processed: number;
  jobs_enqueued: number;
  skipped: number;
  failures: number;
  retries_used: number;
  started_at: Date;
  ended_at?: Date;
  skipped_reasons: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────────────
// DB access
// ─────────────────────────────────────────────────────────────────────

function createPool(): Pool {
  const connString = process.env.DATABASE_URL;
  if (!connString) {
    throw new Error(
      'DATABASE_URL is required. Set it to your Postgres connection string.',
    );
  }
  return new Pool({
    connectionString: connString,
    ssl: connString.includes('localhost') || connString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    max: 8,
  });
}

// Canonical diagnostic slugs per tierConfig.ts
const DIAGNOSTIC_SLUGS = ['prism', 'spark', 'forge', 'bridge', 'mosaic', 'drive'] as const;

/**
 * Eligible users = Professional+ tier (tier_order >= 2), i.e. excluding
 * Executive Introduction. Tier is joined from the tiers lookup table.
 */
async function fetchEligibleUsers(pool: Pool, limit?: number, singleUserId?: string): Promise<EligibleUser[]> {
  const query = `
    SELECT
      u.id          AS user_id,
      u.email       AS email,
      COALESCE(p.full_name, p.name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name') AS full_name,
      COALESCE(p.tier_key, 'executive_introduction') AS tier_key,
      t.display_name AS tier_display_name,
      p.timezone    AS timezone
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN tiers    t ON t.tier_key = COALESCE(p.tier_key, 'executive_introduction')
    WHERE
      u.email IS NOT NULL
      AND (t.tier_order IS NULL OR t.tier_order >= 2)
      AND COALESCE(p.tier_key, 'executive_introduction') <> 'executive_introduction'
      ${singleUserId ? 'AND u.id = $1::uuid' : ''}
    ORDER BY t.tier_order DESC, u.created_at ASC
    ${limit ? `LIMIT ${Number(limit)}` : ''}
  `;
  const params = singleUserId ? [singleUserId] : [];
  const res = await pool.query(query, params);
  return res.rows.map((r) => ({
    user_id: r.user_id,
    email: r.email,
    full_name: r.full_name,
    tier_key: r.tier_key,
    tier_display_name: r.tier_display_name || r.tier_key,
    timezone: r.timezone,
  }));
}

/**
 * Aggregate all six monthly metrics for one user + window.
 * Runs a single SQL block to minimise round-trips.
 */
async function aggregateMonthCounts(
  pool: Pool,
  userId: string,
  window_start: Date,
  window_end: Date,
): Promise<{ counts: SummaryCounts; highest_single_score: number | null; per_diag: Record<string, number> }> {
  const query = `
    WITH
    -- 1. assessments_completed + highest score + per-diagnostic counts
    assessments AS (
      SELECT
        COUNT(*)                               AS assessments_completed,
        MAX(overall_score)                     AS highest_single_score,
        COALESCE(json_object_agg(assessment_id, cnt) FILTER (WHERE assessment_id IS NOT NULL), '{}'::json) AS per_diag
      FROM (
        SELECT
          ar.assessment_id,
          ar.overall_score
        FROM assessment_results ar
        WHERE ar.user_id = $1::uuid
          AND ar.completed_at >= $2::timestamptz
          AND ar.completed_at <  $3::timestamptz
      ) r
      LEFT JOIN (
        SELECT assessment_id, COUNT(*) AS cnt
        FROM assessment_results
        WHERE user_id = $1::uuid
          AND completed_at >= $2::timestamptz
          AND completed_at <  $3::timestamptz
        GROUP BY assessment_id
      ) a USING (assessment_id)
    ),
    -- 2. nexus_sessions (conversations created in window)
    nexus AS (
      SELECT COUNT(*)::int AS nexus_sessions
      FROM nexus_conversations
      WHERE user_id = $1::uuid
        AND deleted_at IS NULL
        AND created_at >= $2::timestamptz
        AND created_at <  $3::timestamptz
    ),
    -- 3. shares_sent
    shares AS (
      SELECT COUNT(*)::int AS shares_sent
      FROM assessment_shares
      WHERE owner_id = $1::uuid
        AND created_at >= $2::timestamptz
        AND created_at <  $3::timestamptz
    ),
    -- 4. insights_generated — ai_job_queue rows where kind LIKE 'ai:%', status = completed
    insights AS (
      SELECT COUNT(*)::int AS insights_generated
      FROM ai_job_queue
      WHERE (tenant_user_id = $1::uuid OR created_by_user = $1::uuid)
        AND kind LIKE 'ai:%'
        AND status = 'completed'
        AND created_at >= $2::timestamptz
        AND created_at <  $3::timestamptz
    )
    SELECT
      (SELECT assessments_completed::int FROM assessments) AS assessments_completed,
      (SELECT highest_single_score::int  FROM assessments) AS highest_single_score,
      (SELECT per_diag::jsonb            FROM assessments) AS per_diag,
      (SELECT nexus_sessions             FROM nexus)       AS nexus_sessions,
      (SELECT shares_sent                FROM shares)      AS shares_sent,
      (SELECT insights_generated         FROM insights)    AS insights_generated
  `;
  const r = await pool.query(query, [userId, window_start, window_end]);
  const row = r.rows[0];
  const rawPerDiag = (row?.per_diag as Record<string, number>) || {};
  // Ensure all 6 canonical slugs are present (0 default)
  const per_diag: Record<string, number> = {};
  for (const slug of DIAGNOSTIC_SLUGS) {
    per_diag[slug] = Number(rawPerDiag[slug] ?? 0) || 0;
  }
  return {
    counts: {
      assessments_completed: Number(row?.assessments_completed ?? 0) || 0,
      nexus_sessions: Number(row?.nexus_sessions ?? 0) || 0,
      shares_sent: Number(row?.shares_sent ?? 0) || 0,
      insights_generated: Number(row?.insights_generated ?? 0) || 0,
    },
    highest_single_score: row?.highest_single_score != null ? Number(row.highest_single_score) : null,
    per_diag,
  };
}

/**
 * Build the trended 3-month comparison data for the prior 3 completed months
 * including the current target month. Returns undefined if there is no data
 * in either of the two preceding months.
 */
async function buildThreeMonthComparison(
  pool: Pool,
  userId: string,
  tzInput: string | null | undefined,
  targetYear: number,
  targetMonth1: number, // 1-based
): Promise<Trend['three_month_comparison'] | undefined> {
  // Build 3 windows: target, target-1, target-2
  const tz = normalizeTz(tzInput);
  const refForMonth = (year: number, month1: number) => {
    // Build reference date in the middle of target month so backing up works reliably
    return localToUTC(year, month1 - 1, 15, 12, 0, 0, tz);
  };

  const entries: Array<{
    year: number;
    month1: number;
    window_start: Date;
    window_end: Date;
  }> = [];

  for (let offset = 0; offset < 3; offset++) {
    let y = targetYear;
    let m = targetMonth1 - offset;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const ref = refForMonth(y, m);
    const win = buildWindow(tz, ref);
    // buildWindow with ref in the middle of month X returns month X-1 window;
    // to get month X itself, we use buildWindow with a ref date in month X+1
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) { nextM = 1; nextY += 1; }
    const nextRef = localToUTC(nextY, nextM - 1, 5, 12, 0, 0, tz);
    const actualWin = buildWindow(tz, nextRef);
    entries.push({ year: actualWin.local_year, month1: actualWin.local_month, window_start: actualWin.window_start, window_end: actualWin.window_end });
  }
  entries.reverse(); // oldest first (month N-2, N-1, N)

  // Query each month. Use a VALUES join for efficiency.
  const query = `
    WITH months(offset_, window_start, window_end) AS (
      VALUES
        (0, $2::timestamptz, $3::timestamptz),
        (1, $4::timestamptz, $5::timestamptz),
        (2, $6::timestamptz, $7::timestamptz)
    )
    SELECT
      m.offset_,
      COUNT(ar.*)::int                              AS assessments_completed,
      ROUND(AVG(ar.overall_score)::numeric, 1)::float AS avg_score
    FROM months m
    LEFT JOIN assessment_results ar
      ON  ar.user_id = $1::uuid
      AND ar.completed_at >= m.window_start
      AND ar.completed_at <  m.window_end
    GROUP BY m.offset_
    ORDER BY m.offset_ ASC
  `;
  const params: any[] = [
    userId,
    entries[0].window_start, entries[0].window_end,
    entries[1].window_start, entries[1].window_end,
    entries[2].window_start, entries[2].window_end,
  ];
  const r = await pool.query(query, params);
  const rowsByOffset: Record<number, { assessments_completed: number; avg_score: number | null }> = {};
  for (const row of r.rows) {
    rowsByOffset[Number(row.offset_)] = {
      assessments_completed: Number(row.assessments_completed ?? 0) || 0,
      avg_score: row.avg_score != null ? Number(row.avg_score) : null,
    };
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const comparison: Trend['three_month_comparison'] = entries.map((e, i) => {
    const data = rowsByOffset[i] || { assessments_completed: 0, avg_score: null };
    return {
      month: `${monthNames[e.month1 - 1]} ${e.year}`,
      assessments_completed: data.assessments_completed,
      avg_score: data.avg_score,
    };
  });

  // Only attach if the user has data across the 2 prior months (not necessarily all 3).
  // "Has data across the prior 2 months" = at least 1 completed assessment in
  // month N-1 OR month N-2 in addition to month N.
  const priorTwoHaveData =
    (comparison[0]?.assessments_completed ?? 0) + (comparison[1]?.assessments_completed ?? 0) > 0;
  if (!priorTwoHaveData) return undefined;

  return comparison;
}

/**
 * Enqueue a single email:monthly_summary row into ai_job_queue.
 * Returns the job_id.
 */
async function enqueueEmailJob(
  client: Client,
  user: EligibleUser,
  payload: MonthlyPayload,
): Promise<string> {
  const res = await client.query(
    `
    INSERT INTO ai_job_queue (
      kind, payload, priority, available_at, tenant_user_id, created_by_user, status, max_attempts
    ) VALUES (
      'email:monthly_summary',
      $1::jsonb,
      100,
      NOW(),
      $2::uuid,
      NULL,
      'queued',
      5
    )
    RETURNING job_id::text AS job_id
    `,
    [JSON.stringify(payload), user.user_id],
  );
  return res.rows[0].job_id;
}

/**
 * Append an audit row to email_delivery_log. Template_code = 'monthly_summary'.
 */
async function appendDeliveryLog(
  client: Client,
  user: EligibleUser,
  payload: MonthlyPayload,
  jobId: string | null,
): Promise<string> {
  const subject = `Your LYC Partners monthly summary for ${payload.month_label}`;
  const res = await client.query(
    `
    INSERT INTO email_delivery_log (
      tenant_user_id,
      template_code,
      from_name,
      reply_to,
      to_addresses,
      subject,
      preheader,
      provider,
      status,
      miles_debited,
      tier_at_send,
      brand_pass,
      scheduled_at,
      created_at
    ) VALUES (
      $1::uuid,
      'monthly_summary',
      'LYC Partners',
      'no-reply@lyc.partners',
      ARRAY[$2::text],
      $3::text,
      $4::text,
      'console',
      'queued',
      0,
      $5::text,
      TRUE,
      NOW(),
      NOW()
    )
    RETURNING delivery_id::text AS delivery_id
    `,
    [
      user.user_id,
      user.email,
      subject,
      'This month\'s assessments, NEXUS conversations, and insights at a glance.',
      user.tier_key,
    ],
  );
  void jobId; // could be written to a notes column if added later
  return res.rows[0].delivery_id;
}

// ─────────────────────────────────────────────────────────────────────
// Retry helper
// ─────────────────────────────────────────────────────────────────────

function isTransientError(e: any): boolean {
  const msg = (e?.message || String(e)).toLowerCase();
  // Network / DB transient patterns
  if (msg.includes('connection') && (msg.includes('reset') || msg.includes('timeout') || msg.includes('refused'))) return true;
  if (msg.includes('timeout') || msg.includes('timed out')) return true;
  if (msg.includes('deadlock') || msg.includes('could not serialize')) return true;
  if (msg.includes('econnreset') || msg.includes('econnrefused') || msg.includes('etimedout')) return true;
  if (msg.includes('pool is draining') || msg.includes('socket')) return true;
  // Postgres SQLSTATE transient class
  if (e?.code && typeof e.code === 'string') {
    const transientCodes = ['40001', '53000', '53100', '53200', '53300', '53400', '55000', '55006', '55P03', '57000', '57014', '57P01', '57P02', '57P03', '58000', '58030', 'XX000'];
    if (transientCodes.includes(e.code)) return true;
  }
  return false;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  userCtx: Record<string, any>,
): Promise<{ result: T; retries: number }> {
  let lastErr: any;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (e) {
      lastErr = e;
      if (!isTransientError(e)) {
        log('warn', 'Non-transient error for user — skipping retries', {
          ...userCtx,
          attempt: attempt + 1,
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
      if (attempt < attempts - 1) {
        const backoffMs = 250 * Math.pow(2, attempt);
        log('warn', `Transient failure (attempt ${attempt + 1}/${attempts}); retrying in ${backoffMs}ms`, {
          ...userCtx,
          error: e instanceof Error ? e.message : String(e),
        });
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────────────────────────────
// Single-user pipeline
// ─────────────────────────────────────────────────────────────────────

async function processOneUser(
  pool: Pool,
  user: EligibleUser,
  stats: RunStats,
  dryRun: boolean,
  retryAttempts: number,
  now: Date,
  appUrl: string,
): Promise<{ enqueued: boolean; skipped: boolean; skippedReason?: string }> {
  const userCtx = { user_id: user.user_id, email: user.email || '<no-email>', tier: user.tier_key };

  if (!user.email) {
    stats.skipped_reasons['no_email'] = (stats.skipped_reasons['no_email'] || 0) + 1;
    return { enqueued: false, skipped: true, skippedReason: 'no_email' };
  }

  try {
    const { retries } = await withRetry(
      async () => {
        // 1. Build calendar window
        const win = buildWindow(user.timezone, now);
        log('debug', 'Window built for user', { ...userCtx, tz: normalizeTz(user.timezone), month_label: win.month_label, start: win.window_start.toISOString(), end: win.window_end.toISOString() });

        // 2. Aggregate monthly counts
        const agg = await aggregateMonthCounts(pool, user.user_id, win.window_start, win.window_end);

        // 3. 3-month trend comparison
        let threeMonthComp: Trend['three_month_comparison'];
        try {
          threeMonthComp = await buildThreeMonthComparison(pool, user.user_id, user.timezone, win.local_year, win.local_month);
        } catch (e) {
          log('warn', '3-month comparison build failed (optional) — continuing without', {
            ...userCtx,
            error: e instanceof Error ? e.message : String(e),
          });
          threeMonthComp = undefined;
        }

        const trend: Trend = {
          highest_single_score: agg.highest_single_score,
          assessments_per_diagnostic: agg.per_diag,
        };
        if (threeMonthComp) trend.three_month_comparison = threeMonthComp;

        // 4. Build payload
        const payload: MonthlyPayload = {
          recipient_name: user.full_name,
          recipient_email: user.email,
          user_tier: user.tier_display_name,
          month_label: win.month_label,
          summary_counts: agg.counts,
          trend,
          account_url: `${appUrl.replace(/\/$/, '')}/settings/account`,
        };

        if (dryRun) {
          log('info', '[DRY-RUN] Would enqueue monthly_summary job', {
            ...userCtx,
            month_label: win.month_label,
            counts: agg.counts,
            has_3m: !!threeMonthComp,
          });
          return true as const;
        }

        // 5 & 6: Enqueue job + write audit inside a DB transaction so the two
        // writes are atomic per user.
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const jobId = await enqueueEmailJob(client, user, payload);
          const deliveryId = await appendDeliveryLog(client, user, payload, jobId);
          await client.query('COMMIT');
          log('debug', 'Enqueued monthly summary', {
            ...userCtx,
            month_label: win.month_label,
            job_id: jobId,
            delivery_id: deliveryId,
            counts: agg.counts,
            has_3m: !!threeMonthComp,
          });
          return true as const;
        } catch (txErr) {
          try { await client.query('ROLLBACK'); } catch { /* noop */ }
          throw txErr;
        } finally {
          client.release();
        }
      },
      retryAttempts,
      userCtx,
    );
    stats.retries_used += retries;
    stats.jobs_enqueued += 1;
    return { enqueued: true, skipped: false };
  } catch (e) {
    stats.failures += 1;
    stats.skipped_reasons['failed_processing'] = (stats.skipped_reasons['failed_processing'] || 0) + 1;
    log('error', 'Failed to process user after retries exhausted', {
      ...userCtx,
      error: e instanceof Error ? e.message : String(e),
    });
    return { enqueued: false, skipped: true, skippedReason: 'failed_processing' };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const now = new Date();
  const DRY_RUN = process.env.DRY_RUN === '1';
  const SINGLE_USER_ID = process.env.SINGLE_USER_ID || undefined;
  const MAX_USERS = process.env.MAX_USERS ? parseInt(process.env.MAX_USERS, 10) : undefined;
  const RETRY_ATTEMPTS = parseInt(process.env.RETRY_ATTEMPTS || '3', 10);
  const APP_URL = process.env.APP_URL || (process.env.VITE_APP_URL as string) || 'https://app.lyc.partners';

  log('info', 'Monthly summary pipeline starting', {
    dry_run: DRY_RUN,
    single_user_id: SINGLE_USER_ID || undefined,
    max_users: MAX_USERS,
    retry_attempts: RETRY_ATTEMPTS,
    app_url: APP_URL,
  });

  const stats: RunStats = {
    total_users_processed: 0,
    jobs_enqueued: 0,
    skipped: 0,
    failures: 0,
    retries_used: 0,
    started_at: now,
    skipped_reasons: {},
  };

  let pool: Pool | null = null;
  try {
    pool = createPool();

    // Load eligible users
    const users = await fetchEligibleUsers(pool, MAX_USERS, SINGLE_USER_ID);
    log('info', `Loaded ${users.length} eligible user(s) (Professional+ tier; Executive Introduction excluded)`);

    if (users.length === 0) {
      log('warn', 'No eligible users — exiting.');
      stats.ended_at = new Date();
      printSummary(stats);
      return 0;
    }

    // Process each user sequentially so we can cleanly isolate failures and retries.
    // We intentionally DO NOT parallelize — Supabase Hobby tier has connection limits.
    for (const user of users) {
      stats.total_users_processed += 1;
      const outcome = await processOneUser(pool, user, stats, DRY_RUN, RETRY_ATTEMPTS, now, APP_URL);
      if (outcome.skipped) stats.skipped += 1;
    }

    stats.ended_at = new Date();
    printSummary(stats);

    if (DRY_RUN) {
      log('info', 'DRY_RUN=1 — no ai_job_queue or email_delivery_log rows were written.');
    }

    return stats.failures === 0 ? 0 : 1;
  } catch (fatal: any) {
    stats.ended_at = new Date();
    log('error', 'Fatal pipeline error', {
      error: fatal instanceof Error ? fatal.message : String(fatal),
      stack: fatal instanceof Error ? fatal.stack : undefined,
    });
    printSummary(stats);
    return 2;
  } finally {
    if (pool) {
      try { await pool.end(); } catch { /* noop */ }
    }
  }
}

function printSummary(stats: RunStats): void {
  const elapsedMs = (stats.ended_at || new Date()).getTime() - stats.started_at.getTime();
  const elapsedSec = (elapsedMs / 1000).toFixed(1);
  const summary = {
    total_users_processed: stats.total_users_processed,
    jobs_enqueued: stats.jobs_enqueued,
    skipped: stats.skipped,
    failures: stats.failures,
    retries_used: stats.retries_used,
    elapsed_seconds: elapsedSec,
    skipped_reasons: stats.skipped_reasons,
    started_at: stats.started_at.toISOString(),
    ended_at: (stats.ended_at || new Date()).toISOString(),
  };
  log('info', '=== END OF RUN: MONTHLY SUMMARY PIPELINE ===', summary);
}

// ─────────────────────────────────────────────────────────────────────
// CLI entry
// ─────────────────────────────────────────────────────────────────────
if (typeof require !== 'undefined' && require.main === module) {
  main().then((code) => process.exit(code)).catch((e) => {
    log('error', 'Unhandled crash', { error: e instanceof Error ? e.message : String(e) });
    process.exit(3);
  });
}

// Also support `node --eval` and ts-node-esm style entry
if ((globalThis as any).__MONTHLY_SUMMARY_DIRECT_RUN__) {
  main().then((c) => process.exit(c)).catch(() => process.exit(3));
}

export {
  aggregateMonthCounts,
  buildThreeMonthComparison,
  processOneUser,
  main,
  normalizeTz,
  localToUTC,
  fetchEligibleUsers,
  enqueueEmailJob,
  appendDeliveryLog,
};
export type { EligibleUser, SummaryCounts, Trend, MonthlyPayload, RunStats };
