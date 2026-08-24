/**
 * api/lib/weeklyDigest.ts — Weekly Digest Pipeline
 *
 * Runs every Monday 9am local. Discovers all eligible users (Professional+ tier,
 * excluding Executive Introduction), builds a 7-day activity window per user,
 * aggregates activity counts from assessment_results, nexus_conversations,
 * assessment_shares, and ai_job_queue, then enqueues one email:weekly_digest
 * job per user into the ai_job_queue and writes an audit row to email_delivery_log.
 *
 * Self-contained — no imports from src/. Uses the shared REST client from
 * supabase-rest.js (which uses service-role credentials for cross-table queries).
 */

import { createClient } from './supabase-rest.js';

// ── Constants ───────────────────────────────────────────────────────

const ELIGIBLE_TIERS = ['professional', 'executive', 'council', 'enterprise'];
const WEEKLY_DIGEST_DEFAULT_SUBJECT = 'Your weekly LYC Partners digest';
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || 'https://lyc-partners.ai';
const FROM_NAME = 'LYC Partners';
const PRIORITY = 80;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

// ── Types ───────────────────────────────────────────────────────────

interface Profile {
  id: string;
  email: string;
  tier: string | null;
}

interface DigestActivity {
  assessments_completed: number;
  nexus_sessions: number;
  shares_sent: number;
  insights_generated: number;
}

interface DimensionItem {
  title: string;
  diagnostic: string;
  completed_at: string;
  score: number;
  one_line: string;
}

interface NexusItem {
  topic: string;
  turns: number;
  last_message: string;
  continue_url: string;
}

interface DigestPayload {
  recipient_name: string;
  recipient_email: string;
  week_label: string;
  summary_counts: DigestActivity;
  results: DimensionItem[];
  nexus: NexusItem[];
  dashboard_url: string;
  user_tier: string;
}

interface ProcessingResult {
  user_id: string;
  email: string;
  tier: string;
  success: boolean;
  job_id: string | null;
  error: string | null;
}

interface PipelineSummary {
  total_users_processed: number;
  jobs_enqueued: number;
  skipped_executive_introduction: number;
  failed: number;
  duration_ms: number;
  results: ProcessingResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────

function getMondayWindow(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);

  return { start: lastMonday, end: thisMonday };
}

function formatWeekLabel(start: Date, _end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `Week of Mon ${start.getDate()} ${months[start.getMonth()]}`;
}

function getRecipientName(profile: Profile): string {
  if (profile.email) {
    const localPart = profile.email.split('@')[0];
    if (localPart) {
      return localPart.charAt(0).toUpperCase() + localPart.slice(1);
    }
  }
  return 'there';
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(res, ms));
}

// ── Data aggregation ────────────────────────────────────────────────

async function fetchEligibleProfiles(): Promise<Profile[]> {
  const client = createClient();
  const { data, error } = await client
    .from('profiles')
    .select('id, email, tier')
    .in('tier', ELIGIBLE_TIERS)
    .execute();

  if (error) {
    throw new Error(`Failed to fetch profiles: ${JSON.stringify(error)}`);
  }

  return (data || []).filter((p: Profile) => p.email && p.tier);
}

async function fetchActivity(
  client: ReturnType<typeof createClient>,
  userId: string,
  startISO: string,
  endISO: string,
): Promise<DigestActivity> {
  const [assessmentsCount, nexusCount, sharesCount, insightsCount] = await Promise.all([
    client
      .from('assessment_results')
      .select('result_id')
      .eq('user_id', userId)
      .gte('completed_at', startISO)
      .lt('completed_at', endISO)
      .execute(),

    client
      .from('nexus_conversations')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startISO)
      .lt('created_at', endISO)
      .execute(),

    client
      .from('assessment_shares')
      .select('id')
      .eq('owner_id', userId)
      .gte('created_at', startISO)
      .lt('created_at', endISO)
      .execute(),

    client
      .from('ai_job_queue')
      .select('kind')
      .eq('tenant_user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startISO)
      .lt('created_at', endISO)
      .execute(),
  ]);

  let insights_generated = 0;
  if (insightsCount.data) {
    insights_generated = (insightsCount.data as Array<{ kind: string }>).filter(
      (j) => j.kind.startsWith('ai:'),
    ).length;
  }

  return {
    assessments_completed: (assessmentsCount.data || []).length,
    nexus_sessions: (nexusCount.data || []).length,
    shares_sent: (sharesCount.data || []).length,
    insights_generated,
  };
}

async function fetchDimensionItems(
  client: ReturnType<typeof createClient>,
  userId: string,
  startISO: string,
  endISO: string,
): Promise<DimensionItem[]> {
  // Fetch completed assessments in the window with their results.
  // Support both column naming conventions (assessment_id / assessment_code).
  const { data: results, error } = await client
    .from('assessment_results')
    .select('result_id, id, assessment_id, assessment_code, user_id, overall_score, overall_level, completed_at, raw_data, insights')
    .eq('user_id', userId)
    .gte('completed_at', startISO)
    .lt('completed_at', endISO)
    .order('completed_at', { ascending: false })
    .execute();

  if (error || !results?.length) return [];

  // Normalize: some rows have assessment_id, others assessment_code
  const normalized = (results as any[]).map((r) => ({
    ...r,
    _assessment_key: r.assessment_id || r.assessment_code || r.id,
  }));

  const assessmentIds = [...new Set(normalized.map((r) => r._assessment_key))];

  let titleMap: Record<string, { title: string; code: string }> = {};
  if (assessmentIds.length > 0) {
    // Try assessments table (newer) — match by id or code
    const { data: assessments, error: aeError } = await client
      .from('assessments')
      .select('id, name, code, composite_bands')
      .execute();

    if (!aeError && assessments) {
      for (const a of assessments as Array<{ id: string; name: string; code: string; composite_bands?: any }>) {
        titleMap[a.id] = { title: a.name, code: a.code };
        if (a.code) titleMap[a.code] = { title: a.name, code: a.code };
        // Store composite_bands lookup for fallback
        if (a.composite_bands && typeof a.composite_bands === 'object') {
          const bands = Array.isArray(a.composite_bands) ? a.composite_bands : [];
          if (bands.length > 0) {
            const lastBand = bands[bands.length - 1] as { interpretation?: string };
            if (lastBand?.interpretation) {
              titleMap[a.id + '_interp'] = lastBand.interpretation;
              if (a.code) titleMap[a.code + '_interp'] = lastBand.interpretation;
            }
          }
        }
      }
    }

    // Fallback: assessment_definitions table
    const missingIds = assessmentIds.filter((id) => !titleMap[id]);
    if (missingIds.length > 0) {
      const { data: defs, error: defError } = await client
        .from('assessment_definitions')
        .select('assessment_id, title')
        .in('assessment_id', missingIds)
        .execute();

      if (!defError && defs) {
        for (const d of defs as Array<{ assessment_id: string; title: string }>) {
          titleMap[d.assessment_id] = {
            title: d.title,
            code: d.assessment_id,
          };
        }
      }
    }
  }

  const items: DimensionItem[] = normalized.map((r) => {
    const key = r._assessment_key;
    const meta = titleMap[key] || { title: key, code: key };
    const score = typeof r.overall_score === 'number' ? r.overall_score : 0;
    const level = r.overall_level || '';

    let compositeInterp = '';
    if (r.raw_data && typeof r.raw_data === 'object') {
      compositeInterp = r.raw_data.composite_interpretation || '';
    }
    if (!compositeInterp && r.insights && typeof r.insights === 'object') {
      compositeInterp = r.insights.composite_interpretation || '';
    }
    if (!compositeInterp) {
      compositeInterp = titleMap[key + '_interp'] || '';
    }

    const oneLine = [level, compositeInterp].filter(Boolean).join(' — ');

    return {
      title: meta.title,
      diagnostic: meta.code,
      completed_at: r.completed_at,
      score,
      one_line: oneLine || `${score}% — ${level || 'N/A'}`,
    };
  });

  return items;
}

async function fetchNexusItems(
  client: ReturnType<typeof createClient>,
  userId: string,
  startISO: string,
  endISO: string,
): Promise<NexusItem[]> {
  const { data: conversations, error } = await client
    .from('nexus_conversations')
    .select('id, title, updated_at, created_at')
    .eq('user_id', userId)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('updated_at', { ascending: false })
    .limit(3)
    .execute();

  if (error || !conversations?.length) return [];

  const items: NexusItem[] = [];

  for (const conv of conversations as Array<{ id: string; title: string }>) {
    const { data: messages, error: msgError } = await client
      .from('nexus_messages')
      .select('role, content')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .execute();

    if (msgError) continue;

    const totalMessages = messages?.length || 0;
    const turns = totalMessages > 0 ? Math.max(1, Math.ceil(totalMessages / 2)) : 0;
    const lastMessage = messages?.[0]?.content || '';
    const excerpt = lastMessage.length > 120
      ? lastMessage.slice(0, 117) + '…'
      : lastMessage;

    items.push({
      topic: conv.title || 'Conversation',
      turns,
      last_message: excerpt,
      continue_url: `${APP_URL}/nexus?sid=${conv.id}`,
    });
  }

  return items;
}

// ── Job enqueueing ──────────────────────────────────────────────────

async function enqueueEmailJob(
  client: ReturnType<typeof createClient>,
  payload: DigestPayload,
  userId: string,
  availableAt: Date,
): Promise<string> {
  const { data, error } = await client.from('ai_job_queue').insert({
    kind: 'email:weekly_digest',
    payload: payload as any,
    status: 'queued',
    priority: PRIORITY,
    tenant_user_id: userId,
    available_at: availableAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to enqueue job: ${JSON.stringify(error)}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row?.job_id || '';
}

async function writeAuditLog(
  client: ReturnType<typeof createClient>,
  profile: Profile,
  tier: string,
  availableAt: Date,
): Promise<void> {
  const { error } = await client.from('email_delivery_log').insert({
    tenant_user_id: profile.id,
    template_code: 'weekly_digest',
    from_name: FROM_NAME,
    reply_to: 'no-reply@lyc.partners',
    to_addresses: [profile.email],
    subject: WEEKLY_DIGEST_DEFAULT_SUBJECT,
    provider: 'console',
    status: 'queued',
    tier_at_send: tier,
    brand_pass: true,
    scheduled_at: availableAt.toISOString(),
  });

  if (error) {
    console.warn(`[weekly-digest] Audit log write failed for ${profile.email}:`, error);
  }
}

// ── Core pipeline ───────────────────────────────────────────────────

async function processUser(
  profile: Profile,
  startISO: string,
  endISO: string,
  weekLabel: string,
  dashboardUrl: string,
): Promise<ProcessingResult> {
  const client = createClient();
  const availableAt = new Date();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const activity = await fetchActivity(client, profile.id, startISO, endISO);
      const dimensionItems = await fetchDimensionItems(client, profile.id, startISO, endISO);
      const nexusItems = await fetchNexusItems(client, profile.id, startISO, endISO);

      const recipientName = getRecipientName(profile);
      const tier = profile.tier || 'professional';

      const payload: DigestPayload = {
        recipient_name: recipientName,
        recipient_email: profile.email,
        week_label: weekLabel,
        summary_counts: activity,
        results: dimensionItems,
        nexus: nexusItems,
        dashboard_url: dashboardUrl,
        user_tier: tier,
      };

      const jobId = await enqueueEmailJob(client, payload, profile.id, availableAt);
      await writeAuditLog(client, profile, tier, availableAt);

      console.log(
        `[weekly-digest] Enqueued job ${jobId} for ${profile.email} (${tier}) — ` +
        `${activity.assessments_completed} assessments, ` +
        `${activity.nexus_sessions} nexus, ` +
        `${activity.shares_sent} shares, ` +
        `${activity.insights_generated} insights`,
      );

      return {
        user_id: profile.id,
        email: profile.email,
        tier,
        success: true,
        job_id: jobId,
        error: null,
      };
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.warn(
          `[weekly-digest] Attempt ${attempt} failed for ${profile.email}: ${err.message}. Retrying in ${backoff}ms…`,
        );
        await sleep(backoff);
      } else {
        console.error(
          `[weekly-digest] All ${MAX_RETRIES} attempts failed for ${profile.email}:`,
          err.message,
        );
        return {
          user_id: profile.id,
          email: profile.email,
          tier: profile.tier || 'unknown',
          success: false,
          job_id: null,
          error: err.message || String(err),
        };
      }
    }
  }

  return {
    user_id: profile.id,
    email: profile.email,
    tier: profile.tier || 'unknown',
    success: false,
    job_id: null,
    error: 'Max retries exceeded',
  };
}

// ── Main entry point ────────────────────────────────────────────────

export async function runWeeklyDigestPipeline(): Promise<PipelineSummary> {
  const startTime = Date.now();

  console.log('[weekly-digest] Pipeline starting…');

  const { start, end } = getMondayWindow();
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const weekLabel = formatWeekLabel(start, end);
  const dashboardUrl = `${APP_URL}/dashboard`;

  console.log(`[weekly-digest] Window: ${startISO} → ${endISO}`);
  console.log(`[weekly-digest] Week label: ${weekLabel}`);

  const profiles = await fetchEligibleProfiles();
  console.log(`[weekly-digest] Found ${profiles.length} eligible profiles`);

  const skipped = profiles.filter(
    (p) => !ELIGIBLE_TIERS.includes(p.tier || ''),
  ).length;

  const results: ProcessingResult[] = [];

  for (const profile of profiles) {
    const result = await processUser(
      profile,
      startISO,
      endISO,
      weekLabel,
      dashboardUrl,
    );
    results.push(result);
  }

  const jobsEnqueued = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  const summary: PipelineSummary = {
    total_users_processed: profiles.length,
    jobs_enqueued: jobsEnqueued,
    skipped_executive_introduction: skipped,
    failed,
    duration_ms: Date.now() - startTime,
    results,
  };

  console.log(
    `[weekly-digest] Pipeline complete: ` +
    `total_users_processed=${summary.total_users_processed}, ` +
    `jobs_enqueued=${summary.jobs_enqueued}, ` +
    `skipped_executive_introduction=${summary.skipped_executive_introduction}, ` +
    `failed=${summary.failed}, ` +
    `duration_ms=${summary.duration_ms}`,
  );

  return summary;
}

export default runWeeklyDigestPipeline;