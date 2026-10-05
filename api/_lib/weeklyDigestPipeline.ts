/**
 * /api/_lib/weeklyDigestPipeline.ts — LYC Partners weekly digest cron pipeline.
 *
 * Shared by:
 *   - /api/cron/weekly-digest.ts  (Vercel cron endpoint)
 *   - /scripts/weekly-digest.ts   (CLI runner)
 *
 * End-to-end flow per eligible user (Professional+ tier, not Executive Introduction):
 *   1. Build 7-day window anchored to Monday 00:00 in the user's timezone.
 *   2. Aggregate activity counts from assessment_results, nexus_conversations,
 *      assessment_shares, and ai_job_queue.
 *   3. Build dimension_items from completed assessments and nexus_items from
 *      the latest 3 conversations.
 *   4. Enqueue one email:weekly_digest job in ai_job_queue.
 *   5. Write an append-only email_delivery_log row.
 *   6. Emit summary metrics.
 *
 * No imports from src/ — this module stays inside /api/_lib so the Vercel
 * bundler can resolve it without path-alias magic.
 */

import { createClient } from './supabase-rest.js';

export interface WeeklyDigestOptions {
  /** Reference time for the run. Defaults to now. */
  now?: Date;
  /** Public application URL used for dashboard_url / continue_url. */
  appUrl?: string;
  /** Number of users to process in one DB batch. */
  batchSize?: number;
  /**
   * If set, only process users whose local time currently falls inside this
   * delivery window. Use this when the cron runs hourly and should target
   * each timezone at its own Monday 9am.
   */
  deliveryWindow?: DeliveryWindow;
  /** Optional logger override. */
  log?: (message: string) => void;
}

export interface WeeklyDigestSummary {
  total_users_processed: number;
  jobs_enqueued: number;
  skipped_executive_introduction: number;
  errors: number;
  started_at: string;
  finished_at: string;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  tier: string | null;
  timezone: string | null;
}

interface UserWindow {
  user: UserRow;
  timezone: string;
  windowStart: Date;
  windowEnd: Date;
  weekLabel: string;
}

interface DigestPayload {
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
}

const TIER_ORDER: Record<string, number> = {
  executive_introduction: 1,
  professional: 2,
  executive: 3,
  council: 4,
  enterprise: 5,
  // legacy / drift shields
  free: 1,
  member: 1,
  explorer: 1,
  starter: 2,
  pro: 3,
};

const DEFAULT_APP_URL = 'https://lyc-intelligence.app';

function normalizeTier(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const canonical = TIER_ORDER[raw.toLowerCase()] ? raw.toLowerCase() : null;
  return canonical;
}

function isEligibleTier(tier: string | null | undefined): boolean {
  const canonical = normalizeTier(tier);
  if (!canonical) return false;
  return (TIER_ORDER[canonical] ?? 0) >= 2;
}

function appUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.VERCEL_URL ||
    process.env.VITE_APP_URL ||
    DEFAULT_APP_URL;
  if (!raw) return DEFAULT_APP_URL;
  const url = raw.startsWith('http') ? raw : `https://${raw}`;
  return url.replace(/\/$/, '');
}

function formatWeekLabel(dateInTz: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `Week of ${fmt.format(dateInTz)}`;
}

function isInDeliveryWindow(
  now: Date,
  timezone: string,
  window: DeliveryWindow,
): boolean {
  const tz = timezone && timezone.trim() ? timezone.trim() : 'UTC';
  const parts = getDatePartsInTz(now, tz);
  return parts.weekday === window.weekday && parts.hour === window.hour;
}

export interface DeliveryWindow {
  /** 0 = Sunday, 1 = Monday, ... */
  weekday: number;
  /** 0-23 local hour at which the digest should be delivered. */
  hour: number;
}

function getDatePartsInTz(date: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayName = parts.find((p) => p.type === 'weekday')?.value || 'Sunday';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: dayNames.indexOf(weekdayName),
  };
}

function getOffsetMinutes(date: Date, tz: string): number {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };
  const utcFmt = new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' });
  const tzFmt = new Intl.DateTimeFormat('en-US', opts);
  const parse = (fmt: Intl.DateTimeFormat) => {
    const parts = fmt.formatToParts(date);
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
    return Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
  };
  return Math.round((parse(tzFmt) - parse(utcFmt)) / (60 * 1000));
}

function localMidnightToUtc(
  year: number,
  month: number,
  day: number,
  tz: string,
): Date {
  let utcCandidate = Date.UTC(year, month - 1, day, 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    const offset = getOffsetMinutes(new Date(utcCandidate), tz);
    const adjusted = utcCandidate - offset * 60 * 1000;
    if (Math.abs(adjusted - utcCandidate) < 1000) break;
    utcCandidate = adjusted;
  }
  return new Date(utcCandidate);
}

function getUserWeeklyWindow(
  now: Date,
  timezone: string,
): { start: Date; end: Date; label: string } {
  const tz = timezone && timezone.trim() ? timezone.trim() : 'UTC';
  const parts = getDatePartsInTz(now, tz);
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentWeekday = dayNames.indexOf(parts.weekday);
  const daysSinceMonday = (currentWeekday + 6) % 7; // Monday = 0

  const mondayYear = parts.year;
  const mondayMonth = parts.month;
  const mondayDay = parts.day - daysSinceMonday;

  const currentMonday = localMidnightToUtc(
    mondayYear,
    mondayMonth,
    mondayDay,
    tz,
  );
  const previousMonday = new Date(
    currentMonday.getTime() - 7 * 24 * 60 * 60 * 1000,
  );

  return {
    start: previousMonday,
    end: currentMonday,
    label: formatWeekLabel(currentMonday, tz),
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  log: (message: string) => void,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      const message = e?.message || e?.error?.message || String(e);
      log(`[retry ${label}] attempt ${attempt} failed: ${message}`);
      if (attempt < 3) {
        await sleep(attempt * 500);
      }
    }
  }
  throw lastError;
}

function safeIso(d: unknown): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (d instanceof Date) return d.toISOString();
  return null;
}

function firstName(name: string | null | undefined): string {
  if (!name) return 'there';
  return name.split(/\s+/)[0] || 'there';
}

function oneLineFromResult(result: any): string {
  if (!result) return '';
  if (result.overall_level) return result.overall_level;
  const raw = result.raw_data;
  if (raw && typeof raw === 'object') {
    if (raw.composite_interpretation) return String(raw.composite_interpretation);
    if (raw.overall_tier) return String(raw.overall_tier);
    if (raw.summary?.headline) return String(raw.summary.headline);
  }
  const score = result.overall_score ?? result.score_summary?.overall_score;
  if (typeof score === 'number') return `Score: ${score}`;
  return 'Completed';
}

export async function runWeeklyDigest(
  opts: WeeklyDigestOptions = {},
): Promise<WeeklyDigestSummary> {
  const startedAt = new Date();
  const log = opts.log ?? console.log;
  const baseUrl = (opts.appUrl ?? appUrl()).replace(/\/$/, '');
  const batchSize = opts.batchSize ?? 100;
  const now = opts.now ?? new Date();

  const supabase = createClient();

  let totalUsersProcessed = 0;
  let jobsEnqueued = 0;
  let skippedExecutiveIntroduction = 0;
  let errors = 0;

  // Cache assessment definitions for titles.
  const definitions = await withRetry('assessment_definitions', async () => {
    const { data, error } = await supabase
      .from('assessment_definitions')
      .select('assessment_id,title')
      .eq('is_active', true);
    if (error) throw error;
    const map = new Map<string, string>();
    for (const row of data || []) {
      map.set(String(row.assessment_id), String(row.title || row.assessment_id));
    }
    return map;
  }, log);

  // Fetch eligible users in batches.
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: users, error: usersError } = await withRetry(
      `profiles_batch_${offset}`,
      async () => {
        return supabase
          .from('profiles')
          .select('id,email,name,tier,timezone')
          .order('id', { ascending: true })
          .range(offset, offset + batchSize - 1);
      },
      log,
    );

    if (usersError) {
      log(`[fatal] failed to fetch profiles batch: ${usersError.message || JSON.stringify(usersError)}`);
      errors++;
      break;
    }

    const batch: UserRow[] = (users || []).map((u: any) => ({
      id: String(u.id),
      email: u.email ? String(u.email) : null,
      name: u.name ? String(u.name) : null,
      tier: u.tier ? String(u.tier) : null,
      timezone: u.timezone ? String(u.timezone) : null,
    }));

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    for (const user of batch) {
      totalUsersProcessed++;

      if (!isEligibleTier(user.tier)) {
        skippedExecutiveIntroduction++;
        continue;
      }

      if (
        opts.deliveryWindow &&
        !isInDeliveryWindow(now, user.timezone || 'UTC', opts.deliveryWindow)
      ) {
        continue;
      }

      try {
        const { window, payload, auditSubject } = await buildUserDigest(
          supabase,
          user,
          now,
          baseUrl,
          definitions,
          log,
        );

        await withRetry(
          `enqueue_${user.id}`,
          () =>
            supabase.from('ai_job_queue').insert({
              kind: 'email:weekly_digest',
              payload,
              status: 'queued',
              priority: 80,
              available_at: new Date().toISOString(),
              tenant_user_id: user.id,
              created_by_user: null,
            }),
          log,
        );

        await withRetry(
          `audit_${user.id}`,
          () =>
            supabase.from('email_delivery_log').insert({
              tenant_user_id: user.id,
              template_code: 'weekly_digest',
              from_name: 'LYC Partners',
              to_addresses: [payload.recipient_email],
              subject: auditSubject,
              provider: 'TBD',
              status: 'queued',
              brand_pass: true,
              scheduled_at: new Date().toISOString(),
              tier_at_send: payload.user_tier,
              has_attachment: false,
              miles_debited: 0,
            }),
          log,
        );

        jobsEnqueued++;
      } catch (e: any) {
        errors++;
        const message = e?.message || e?.error?.message || String(e);
        log(`[user ${user.id}] skipped after retries: ${message}`);
      }
    }

    offset += batch.length;
    if (batch.length < batchSize) {
      hasMore = false;
    }
  }

  const finishedAt = new Date();
  const summary: WeeklyDigestSummary = {
    total_users_processed: totalUsersProcessed,
    jobs_enqueued: jobsEnqueued,
    skipped_executive_introduction: skippedExecutiveIntroduction,
    errors,
    started_at: startedAt.toISOString(),
    finished_at: finishedAt.toISOString(),
  };

  log(
    `[weekly-digest] total_users_processed=${summary.total_users_processed} jobs_enqueued=${summary.jobs_enqueued} skipped_executive_introduction=${summary.skipped_executive_introduction} errors=${summary.errors}`,
  );

  return summary;
}

async function buildUserDigest(
  supabase: ReturnType<typeof createClient>,
  user: UserRow,
  now: Date,
  baseUrl: string,
  definitions: Map<string, string>,
  log: (message: string) => void,
): Promise<{ window: UserWindow; payload: DigestPayload; auditSubject: string }> {
  const window = getUserWeeklyWindow(now, user.timezone || 'UTC');
  const startIso = window.start.toISOString();
  const endIso = window.end.toISOString();

  const [assessments, conversations, shares, aiJobs] = await Promise.all([
    fetchCompletedAssessments(supabase, user.id, startIso, endIso, definitions, log),
    fetchNexusConversations(supabase, user.id, startIso, endIso, baseUrl, log),
    fetchShareCount(supabase, user.id, startIso, endIso, log),
    fetchAiInsightCount(supabase, user.id, startIso, endIso, log),
  ]);

  const recipientName = firstName(user.name);
  const recipientEmail = user.email;
  if (!recipientEmail) {
    throw new Error('user has no email address');
  }

  const dashboardUrl = `${baseUrl}/dashboard`;
  const auditSubject = 'Your weekly LYC Partners digest';

  const payload: DigestPayload = {
    recipient_name: recipientName,
    recipient_email: recipientEmail,
    week_label: window.label,
    summary_counts: {
      assessments_completed: assessments.count,
      nexus_sessions: conversations.count,
      shares_sent: shares,
      insights_generated: aiJobs,
    },
    results: assessments.items,
    nexus: conversations.items,
    dashboard_url: dashboardUrl,
    user_tier: normalizeTier(user.tier) || user.tier || 'professional',
  };

  return { window: { ...window, user }, payload, auditSubject };
}

async function fetchCompletedAssessments(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  startIso: string,
  endIso: string,
  definitions: Map<string, string>,
  log: (message: string) => void,
): Promise<{ count: number; items: DigestPayload['results'] }> {
  const rows = await withRetry(
    `assessment_results_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('assessment_results')
        .select(
          'result_id,assessment_id,overall_score,overall_level,raw_data,completed_at',
        )
        .eq('user_id', userId)
        .gte('completed_at', startIso)
        .lt('completed_at', endIso)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    log,
  );

  const items = rows.map((r: any) => ({
    title: definitions.get(String(r.assessment_id)) || String(r.assessment_id),
    diagnostic: String(r.assessment_id),
    completed_at: safeIso(r.completed_at) || new Date().toISOString(),
    score: typeof r.overall_score === 'number' ? r.overall_score : 0,
    one_line: oneLineFromResult(r),
  }));

  return { count: items.length, items };
}

async function fetchNexusConversations(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  startIso: string,
  endIso: string,
  baseUrl: string,
  log: (message: string) => void,
): Promise<{ count: number; items: DigestPayload['nexus'] }> {
  const conversations = await withRetry(
    `nexus_conversations_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('nexus_conversations')
        .select('id,title,updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .gte('created_at', startIso)
        .lt('created_at', endIso)
        .order('updated_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
    log,
  );

  if (conversations.length === 0) {
    return { count: 0, items: [] };
  }

  const conversationIds = conversations.map((c: any) => String(c.id));
  const messages = await withRetry(
    `nexus_messages_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('nexus_messages')
        .select('conversation_id,role,content,created_at')
        .eq('user_id', userId)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    log,
  );

  const messagesByConversation = new Map<string, any[]>();
  for (const m of messages) {
    const cid = String(m.conversation_id);
    if (!messagesByConversation.has(cid)) messagesByConversation.set(cid, []);
    messagesByConversation.get(cid)!.push(m);
  }

  const items = conversations.map((c: any) => {
    const cid = String(c.id);
    const msgs = messagesByConversation.get(cid) || [];
    const lastAssistant = [...msgs]
      .reverse()
      .find((m) => m.role === 'assistant');
    const lastExcerpt = lastAssistant
      ? String(lastAssistant.content).slice(0, 140)
      : msgs.length > 0
        ? String(msgs[msgs.length - 1].content).slice(0, 140)
        : '';
    return {
      topic: String(c.title || 'New conversation'),
      turns: msgs.length,
      last_message: lastExcerpt,
      continue_url: `${baseUrl}/nexus?sid=${cid}`,
    };
  });

  return { count: items.length, items };
}


async function fetchShareCount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  startIso: string,
  endIso: string,
  log: (message: string) => void,
): Promise<number> {
  const rows = await withRetry(
    `assessment_shares_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('assessment_shares')
        .select('id')
        .eq('owner_id', userId)
        .gte('created_at', startIso)
        .lt('created_at', endIso);
      if (error) throw error;
      return data || [];
    },
    log,
  );
  return rows.length;
}

async function fetchAiInsightCount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  startIso: string,
  endIso: string,
  log: (message: string) => void,
): Promise<number> {
  const rows = await withRetry(
    `ai_job_queue_${userId}`,
    async () => {
      const { data, error } = await supabase
        .from('ai_job_queue')
        .select('kind,status')
        .eq('tenant_user_id', userId)
        .gte('created_at', startIso)
        .lt('created_at', endIso);
      if (error) throw error;
      return data || [];
    },
    log,
  );
  return rows.filter(
    (r: any) =>
      typeof r.kind === 'string' &&
      r.kind.startsWith('ai:') &&
      r.status === 'completed',
  ).length;
}
