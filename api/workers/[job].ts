import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * /api/workers/[job] — Consolidated serverless function #11.
 *
 * Self-contained — no imports from src/ to avoid Vercel bundler path issues.
 * All Supabase operations use the shared REST client at ../../lib/supabase-rest.js.
 *
 * URL param values:
 *   ai-trigger       → claim ai:* + scheduled:* from ai_job_queue, execute handlers
 *   email-send       → claim email:* from ai_job_queue, render + send
 *   email-webhook    → SendCloud status event ingress
 *   template-render  → Render email templates (simple, no React SSR)
 *
 * POST ai-trigger | email-send: worker loop
 * POST email-webhook: { events: […] } → update email_delivery_log
 * POST template-render: { template_kind, variables, options } → { html, subject, preheader }
 *
 * GET any: diagnostic counters for ai-trigger/email-send
 */

// ── Imports (only from /api/lib and /api/_lib, NEVER from src/) ─────
// Note: Using dynamic import for Supabase REST client to avoid bundler issues
// with relative paths across the api/src boundary.
// All imports stay within /api/ directory tree.

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  '';
const WORKER_SHARED_SECRET =
  process.env.WORKER_SHARED_SECRET ||
  process.env.VITE_WORKER_SHARED_SECRET ||
  '';
const SENDCLOUD_WEBHOOK_SECRET =
  process.env.SENDCLOUD_WEBHOOK_SECRET ||
  process.env.VITE_SENDCLOUD_WEBHOOK_SECRET ||
  '';

// ── Simple Supabase REST client (inline, no imports) ───────────────
function supabaseFetch(
  path: string,
  options: RequestInit = {},
): Promise<{ data: any; error: any }> {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1${path}`;
  return fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      return { data: null, error: data || { message: `HTTP ${res.status}` } };
    }
    return { data, error: null };
  });
}

function supabaseRpc(
  fn: string,
  params: Record<string, any> = {},
): Promise<{ data: any; error: any }> {
  return supabaseFetch(`/rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── CORS ────────────────────────────────────────────────────────────
function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Worker-Secret, X-Signature',
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  return req.method === 'OPTIONS';
}

// ── Auth ────────────────────────────────────────────────────────────
function requireWorkerSecret(req: VercelRequest): boolean {
  // No secret configured → allow (dev / hobby default)
  if (!WORKER_SHARED_SECRET) return true;
  const header =
    (req.headers['x-worker-secret'] as string) ||
    (req.headers['x-verified'] as string);
  return !!(header && header === WORKER_SHARED_SECRET);
}

function normalizeJobParam(j: unknown): string | null {
  const valid = ['ai-trigger', 'email-send', 'email-webhook', 'template-render', 'chat', 'monthly-summary'];
  if (typeof j === 'string' && valid.includes(j)) return j;
  return null;
}

// ── Handler ─────────────────────────────────────────────────────────
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (applyCors(req, res)) {
    return res.status(204).end();
  }

  const jobKind = normalizeJobParam(req.query.job);
  if (!jobKind) {
    return res.status(400).json({
      ok: false,
      error:
        'job param must be one of: ai-trigger, email-send, email-webhook, template-render, chat, monthly-summary',
    });
  }

  // ── GET (diagnostic / ping) ─────────────────────────────────────
  if (req.method === 'GET') {
    return handleGet(req, res, jobKind);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  // ── Branch by job ───────────────────────────────────────────────
  if (jobKind === 'email-webhook') {
    return handleEmailWebhook(req, res);
  }

  if (jobKind === 'template-render') {
    if (!requireWorkerSecret(req)) {
      return res
        .status(403)
        .json({ ok: false, error: 'worker-secret required' });
    }
    return handleTemplateRender(req, res);
  }

  if (jobKind === 'chat') {
    return handleChat(req, res);
  }

  // All remaining job kinds need worker secret
  if (!requireWorkerSecret(req)) {
    return res
      .status(403)
      .json({ ok: false, error: 'worker-secret required' });
  }

  if (jobKind === 'monthly-summary') {
    return handleMonthlySummary(req, res);
  }

  if (jobKind === 'ai-trigger') {
    return handleAiTrigger(req, res);
  }

  // email-send
  return handleEmailSend(req, res);
}

// ── GET handlers ───────────────────────────────────────────────────
async function handleGet(
  req: VercelRequest,
  res: VercelResponse,
  jobKind: string,
) {
  if (jobKind === 'email-webhook') {
    return res.json({
      ok: true,
      worker: 'email-webhook',
      note: 'POST SendCloud events here.',
    });
  }

  if (jobKind === 'template-render') {
    return res.json({
      ok: true,
      worker: 'template-render',
      templates: Object.keys(TEMPLATE_REGISTRY),
    });
  }

  if (jobKind === 'chat') {
    return res.json({
      ok: true,
      worker: 'chat',
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
      auth_required: true,
    });
  }

  if (jobKind === 'monthly-summary') {
    // Pipeline status counters: recent email:monthly_summary jobs + delivery log counts
    try {
      const [jobsRes, logRes, templatesRes] = await Promise.all([
        supabaseFetch('/ai_job_queue?select=status,kind&kind=like.email%3Amonthly_summary&limit=1000'),
        supabaseFetch('/email_delivery_log?select=status,created_at&template_code=eq.monthly_summary&order=created_at.desc&limit=500'),
        supabaseFetch('/email_template_registry?select=template_code,active,subject_default&template_code=eq.monthly_summary'),
      ]);
      const jobCounters: Record<string, number> = {};
      for (const row of jobsRes.data || []) {
        const s = String(row.status);
        jobCounters[s] = (jobCounters[s] || 0) + 1;
      }
      const logCounters: Record<string, number> = {};
      for (const row of logRes.data || []) {
        const s = String(row.status);
        logCounters[s] = (logCounters[s] || 0) + 1;
      }
      return res.json({
        ok: true,
        worker: 'monthly-summary',
        pipeline: 'cron-first-of-month-9am-local',
        ai_job_queue_counters: jobCounters,
        email_delivery_log_counters_last500: logCounters,
        template: Array.isArray(templatesRes.data) ? templatesRes.data[0] : null,
      });
    } catch (e: any) {
      return res.status(500).json({
        ok: false,
        error: e?.message || 'failed to fetch monthly summary status',
      });
    }
  }

  // ai-trigger or email-send — show queue counters
  const prefixMap: Record<string, string[]> = {
    'ai-trigger': ['ai:', 'scheduled:'],
    'email-send': ['email:'],
  };
  const prefixes = prefixMap[jobKind] || [];

  try {
    const { data, error } = await supabaseFetch(
      '/ai_job_queue?select=status,kind',
    );
    if (error) throw error;

    const counters: Record<string, Record<string, number>> = {};
    for (const row of data || []) {
      const kind = String(row.kind || '');
      if (!prefixes.some((p) => kind.startsWith(p))) continue;
      if (!counters[kind]) counters[kind] = {};
      counters[kind][row.status] = (counters[kind][row.status] || 0) + 1;
    }
    return res.json({ ok: true, worker: jobKind, counters });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'failed to fetch counters',
    });
  }
}

// ── Email Webhook ───────────────────────────────────────────────────
async function handleEmailWebhook(req: VercelRequest, res: VercelResponse) {
  // Signature validation (if secret configured)
  if (SENDCLOUD_WEBHOOK_SECRET) {
    const sig = (req.headers['x-signature'] as string) ?? '';
    if (!sig || sig.length < 8) {
      return res.status(401).json({ ok: false, error: 'missing signature' });
    }
    // NOTE: Full HMAC verification requires raw body. Simple check for now.
  }

  let body: any = {};
  try {
    body = await parseJsonBody(req, 1024 * 1024);
  } catch {
    body = {};
  }

  const events: Array<{
    id?: string;
    message_id?: string;
    event?: string;
    recipient?: string;
    reason?: string;
    timestamp?: string | number;
  }> = Array.isArray(body?.events)
    ? body.events
    : Array.isArray(body)
      ? body
      : [body ?? {}];

  let applied = 0;
  let skipped = 0;

  for (const ev of events) {
    const messageId = ev.message_id ?? ev.id;
    if (!messageId) {
      skipped++;
      continue;
    }
    const ts = ev.timestamp
      ? new Date(
          typeof ev.timestamp === 'number' ? ev.timestamp * 1000 : ev.timestamp,
        ).toISOString()
      : new Date().toISOString();

    const verb = normalizeSendCloudVerb(String(ev.event ?? ''));
    const patch: Record<string, any> = {
      last_status: verb.verb,
      status: verb.status,
    };
    if (verb.status === 'delivered') patch.delivered_at = ts;
    if (verb.status === 'opened') patch.opened_at = ts;
    if (verb.status === 'clicked') patch.clicked_at = ts;
    if (
      verb.status === 'soft_bounce' ||
      verb.status === 'hard_bounce'
    ) {
      patch.bounce_reason = ev.reason ?? null;
    }

    const { error } = await supabaseFetch(
      `/email_delivery_log?provider_message_id=eq.${encodeURIComponent(String(messageId))}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      },
    );
    if (!error) applied++;
  }

  return res.json({
    ok: true,
    applied,
    skipped_no_message_id: skipped,
    received: events.length,
  });
}

function normalizeSendCloudVerb(
  raw: string,
): { verb: string; status: string } {
  const r = raw.toLowerCase();
  if (r === 'delivered') return { verb: 'delivered', status: 'delivered' };
  if (r === 'open' || r === 'opened')
    return { verb: 'opened', status: 'opened' };
  if (r === 'click' || r === 'clicked')
    return { verb: 'clicked', status: 'clicked' };
  if (r === 'soft_bounce')
    return { verb: 'soft_bounce', status: 'soft_bounce' };
  if (r === 'hard_bounce' || r === 'invalid_email')
    return { verb: 'hard_bounce', status: 'hard_bounce' };
  if (r === 'spam' || r === 'complaint')
    return { verb: 'complaint', status: 'complaint' };
  if (r === 'request' || r === 'queued' || r === 'sent')
    return { verb: r, status: 'sent' };
  if (r === 'failed' || r === 'reject')
    return { verb: r, status: 'failed' };
  return { verb: r || 'unknown', status: 'sent' };
}

// ── Template Render ─────────────────────────────────────────────────
const TEMPLATE_REGISTRY: Record<string, { defaultSubject: string; defaultPreheader: string }> = {
  welcome: {
    defaultSubject: 'Welcome to NEXUS',
    defaultPreheader: 'Your Executive Intelligence layer is ready.',
  },
  assessment_complete: {
    defaultSubject: 'Your assessment is ready',
    defaultPreheader: 'View your results and insights.',
  },
  password_reset: {
    defaultSubject: 'Reset your password',
    defaultPreheader: 'Click to set a new password.',
  },
  email_verification: {
    defaultSubject: 'Verify your email',
    defaultPreheader: 'Confirm your email address.',
  },
  share_result: {
    defaultSubject: 'Someone shared their assessment with you',
    defaultPreheader: 'View the shared results.',
  },
  weekly_digest: {
    defaultSubject: 'Your NEXUS weekly digest',
    defaultPreheader: 'This week\'s insights and activity.',
  },
  upgrade_confirmation: {
    defaultSubject: 'Welcome to your new tier',
    defaultPreheader: 'Your upgrade is confirmed.',
  },
  nexus_conversation_summary: {
    defaultSubject: 'Your NEXUS conversation summary',
    defaultPreheader: 'Here\'s what we covered.',
  },
  monthly_summary: {
    defaultSubject: 'Your LYC Partners monthly summary for {month_label}',
    defaultPreheader: 'This month\'s assessments, NEXUS conversations, and insights at a glance.',
  },
};

async function handleTemplateRender(
  req: VercelRequest,
  res: VercelResponse,
) {
  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch {
    body = {};
  }

  const kind = body.template_kind || body.templateId;
  if (!kind || !TEMPLATE_REGISTRY[kind]) {
    return res.status(400).json({
      ok: false,
      error: `template_kind missing or unknown. Valid: ${Object.keys(TEMPLATE_REGISTRY).join(', ')}`,
    });
  }

  const variables = body.variables || {};
  const template = TEMPLATE_REGISTRY[kind];
  const subject = substitute(body.options?.subject || template.defaultSubject, variables);
  const preheader = substitute(body.options?.preheader || template.defaultPreheader, variables);

  // Minimal HTML template — full design will be added when emailEngine is ported
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;background:#f8f9fa;color:#1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr><td style="padding:32px 24px;">
      <div style="font-size:20px;font-weight:600;color:#00897B;margin-bottom:8px;">NEXUS</div>
      <h1 style="font-size:24px;font-weight:600;margin:0 0 16px 0;color:#1a1a2e;">${escapeHtml(subject)}</h1>
      <p style="font-size:16px;line-height:1.6;color:#4a4a6a;margin:0 0 24px 0;">${escapeHtml(preheader)}</p>
      <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0;color:#333;font-size:15px;line-height:1.6;">
          ${body.content || escapeHtml(`This is the ${kind} email template. Content will be populated when the full email engine is available.`)}
        </p>
      </div>
      <p style="font-size:12px;color:#999;text-align:center;">NEXUS · Executive Intelligence</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${subject}\n\n${preheader}\n\n${body.content || `This is the ${kind} email template.`}`;

  return res.json({
    ok: true,
    template_kind: kind,
    subject,
    preheader,
    html,
    text,
    rendered_at: new Date().toISOString(),
  });
}

// ── AI Trigger Worker ───────────────────────────────────────────────
async function handleAiTrigger(
  req: VercelRequest,
  res: VercelResponse,
) {
  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch {
    body = {};
  }

  const workerId = String(body.worker_id || `vercel-${Date.now().toString(36)}`);
  const maxJobs = Math.min(Number(body.max_jobs_per_run || 1), 5);

  const results: Array<{
    job_id: string;
    kind: string;
    status: 'completed' | 'failed';
    error?: string;
  }> = [];

  for (let i = 0; i < maxJobs; i++) {
    const claimed = await supabaseRpc('claim_next_ai_job', {
      in_kind: null,
      in_worker_id: workerId,
      in_claim_window: '5 minutes',
    });

    if (claimed.error || !claimed.data) break;
    const row = claimed.data;
    if (!row || !row.job_id) break;

    const kind = String(row.kind || '');
    if (!kind.startsWith('ai:') && !kind.startsWith('scheduled:')) {
      await supabaseRpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'queued',
        in_last_error: null,
      });
      break;
    }

    try {
      const handlerResult = await runAiJob(row);
      await supabaseRpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'completed',
        in_result: handlerResult ?? null,
        in_last_error: null,
      });
      results.push({ job_id: row.job_id, kind, status: 'completed' });
    } catch (e: any) {
      await supabaseRpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'failed',
        in_result: null,
        in_last_error: e?.message || String(e),
      });
      results.push({
        job_id: row.job_id,
        kind,
        status: 'failed',
        error: e?.message || String(e),
      });
    }
  }

  return res.json({
    ok: true,
    worker: 'ai-trigger',
    worker_id: workerId,
    processed: results.length,
    jobs: results,
  });
}

async function runAiJob(row: any): Promise<any> {
  const kind: string = row.kind ?? '';
  const payload = row.payload ?? {};

  // Scheduled jobs
  if (kind.startsWith('scheduled:')) {
    if (kind === 'scheduled:weekly-digest' || kind === 'scheduled:monthly-summary') {
      return {
        note: 'digest enqueues downstream email job',
        enqueue_email_kind:
          kind === 'scheduled:weekly-digest'
            ? 'email:weekly_digest'
            : 'email:monthly_summary',
        payload,
      };
    }
    if (kind === 'scheduled:3day-checkin') {
      return { note: '3day-checkin', payload };
    }
  }

  // AI content generation jobs
  if (
    kind === 'ai:summary_and_highlights' ||
    kind === 'ai:generate_insight'
  ) {
    return {
      note: 'AI content generation — requires full aiContentEngine service',
      status: 'deferred',
      payload,
    };
  }

  return { note: `no-op handler for ${kind}`, payload };
}

// ── Email Send Worker ───────────────────────────────────────────────
async function handleEmailSend(
  req: VercelRequest,
  res: VercelResponse,
) {
  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch {
    body = {};
  }

  const workerId = String(body.worker_id || `vercel-${Date.now().toString(36)}`);
  const maxJobs = Math.min(Number(body.max_jobs_per_run || 1), 5);

  const results: Array<{
    job_id: string;
    kind: string;
    status: 'completed' | 'failed';
    error?: string;
  }> = [];

  for (let i = 0; i < maxJobs; i++) {
    const claimed = await supabaseRpc('claim_next_ai_job', {
      in_kind: null,
      in_worker_id: workerId,
      in_claim_window: '5 minutes',
    });

    if (claimed.error || !claimed.data) break;
    const row = claimed.data;
    if (!row || !row.job_id) break;

    const kind = String(row.kind || '');
    if (!kind.startsWith('email:')) {
      await supabaseRpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'queued',
        in_last_error: null,
      });
      break;
    }

    try {
      const templateKind = emailKindFromJob(kind);
      if (!templateKind) {
        throw new Error(`unmapped job kind ${kind}`);
      }
      await sendEmailFromJob(row, templateKind);
      await supabaseRpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'completed',
        in_result: { template: templateKind },
        in_last_error: null,
      });
      results.push({ job_id: row.job_id, kind, status: 'completed' });
    } catch (e: any) {
      await supabaseRpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'failed',
        in_result: null,
        in_last_error: e?.message || String(e),
      });
      results.push({
        job_id: row.job_id,
        kind,
        status: 'failed',
        error: e?.message || String(e),
      });
    }
  }

  return res.json({
    ok: true,
    worker: 'email-send',
    worker_id: workerId,
    processed: results.length,
    jobs: results,
  });
}

function emailKindFromJob(kind: string): string | null {
  if (kind === 'email:share_result') return 'share_result';
  if (kind === 'email:assessment_complete') return 'assessment_complete';
  if (kind === 'email:weekly_digest') return 'weekly_digest';
  if (kind === 'email:password_reset') return 'password_reset';
  if (kind === 'email:email_verification') return 'email_verification';
  if (kind === 'email:welcome') return 'welcome';
  if (kind === 'email:upgrade_confirmation') return 'upgrade_confirmation';
  if (kind === 'email:nexus_conversation_summary')
    return 'nexus_conversation_summary';
  if (kind === 'email:monthly_summary') return 'monthly_summary';
  return null;
}

async function sendEmailFromJob(row: any, templateKind: string): Promise<void> {
  const payload = row.payload ?? {};
  const recipient =
    payload.recipient_email ||
    (Array.isArray(payload.to) ? payload.to[0] : payload.to);

  if (!recipient) {
    throw new Error('no recipient email in payload');
  }

  // For now, just log the delivery. Real SendCloud integration
  // will be wired when the full emailDelivery service is ported.
  console.log(
    `[worker:email-send] Would send ${templateKind} to ${recipient}`,
  );

  // Log to delivery table
  try {
    await supabaseFetch('/email_delivery_log', {
      method: 'POST',
      body: JSON.stringify({
        template_code: templateKind,
        recipient_email: recipient,
        tenant_user_id: payload.user_id || null,
        status: 'queued',
        last_status: 'queued',
        provider: 'console',
        subject: TEMPLATE_REGISTRY[templateKind]?.defaultSubject || templateKind,
      }),
    });
  } catch {
    // ignore logging failures
  }
}


// ── Chat Handler (DeepSeek proxy) ──────────────────────────────────
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY ||
  process.env.VITE_DEEPSEEK_API_KEY ||
  '';
const DEEPSEEK_PROXY_KEY =
  process.env.DEEPSEEK_PROXY_KEY ||
  process.env.VITE_DEEPSEEK_PROXY_KEY ||
  '';
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ||
  process.env.VITE_DEEPSEEK_BASE_URL ||
  'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const CHAT_SYSTEM_PROMPT = `You are NEXUS, an Executive Intelligence layer for leaders.

Your purpose: help executives understand themselves, their leadership, and their career trajectory with precision and insight.

How to behave:
- Be incisive, data-informed, and direct. No fluff. No generic advice.
- Frame insights around the user's specific context. Ask clarifying questions when needed.
- Always refer to yourself as NEXUS — never "the AI," "the coach," or "I'm an AI."
- Keep responses focused: 3-5 paragraphs max. Use concrete examples.
- You are not a therapist, lawyer, or financial advisor. Stay in the leadership intelligence lane.
- When uncertain, say so and ask better questions rather than making things up.

Tone: thoughtful, precise, senior. A peer who has read deeply on leadership and organizational behavior.`;

/**
 * Verify a Supabase JWT by calling Supabase auth's /user endpoint.
 * Returns the user object (id, email) if valid, null otherwise.
 * This is the canonical server-side check — not a local decode, so
 * revoked / expired tokens are correctly rejected.
 */
async function verifySupabaseToken(token: string): Promise<{ id: string; email: string | null } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Require confirmed email — Kevin's rule: only registered email users
    if (!data.email_confirmed_at && !(data as any).confirmed_at) return null;
    return { id: data.id, email: data.email ?? null };
  } catch {
    return null;
  }
}

function extractBearerToken(req: VercelRequest): string | null {
  const h = (req.headers.authorization || req.headers.Authorization) as string | undefined;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : null;
}

// ── Service-role Supabase REST (bypasses RLS for credit operations) ──
// The anon key used by supabaseFetch is subject to RLS and cannot reliably
// read/write a user's credits row from a serverless function. handleChat
// uses this for server-side credit enforcement (P0-1).
function supabaseServiceFetch(
  path: string,
  options: RequestInit = {},
): Promise<{ data: any; error: any }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return Promise.resolve({
      data: null,
      error: { message: 'Supabase service role not configured' },
    });
  }
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1${path}`;
  return fetch(url, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (!res.ok) {
      return { data: null, error: data || { message: `HTTP ${res.status}` } };
    }
    return { data, error: null };
  });
}

// Best-effort credit refund (P0-1): increment the user's balance after a
// failed DeepSeek call so they are never charged for a failed response.
async function refundCredit(userId: string, amount: number): Promise<void> {
  try {
    const balRes = await supabaseServiceFetch(
      `/credits?select=balance&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    );
    const balRow = Array.isArray(balRes.data) ? balRes.data[0] : null;
    const currentBalance = Number(balRow?.balance ?? 0);
    await supabaseServiceFetch(
      `/credits?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          balance: currentBalance + amount,
          updated_at: new Date().toISOString(),
        }),
      },
    );
  } catch (e: any) {
    console.error('[chat] refundCredit failed:', e?.message || e);
  }
}

async function handleChat(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      auth_required: true,
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!DEEPSEEK_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: 'Chat service not configured' });
  }

  // ── Auth: require valid Supabase JWT with confirmed email ────────
  const token = extractBearerToken(req);
  if (!token) {
    return res
      .status(401)
      .json({ ok: false, error: 'Authentication required. Sign in to use NEXUS chat.' });
  }

  const authUser = await verifySupabaseToken(token);
  if (!authUser) {
    return res
      .status(401)
      .json({ ok: false, error: 'Invalid or expired session. Please sign in again.' });
  }

  // P0-1: track whether a credit was deducted so we can refund on any
  // failure path (DeepSeek error or unhandled throw).
  let creditDeducted = false;
  let creditBalance: number | undefined;

  try {
    const body = await parseJsonBody(req);
    const message: string = body.message || '';
    const history: Array<{ role: string; content: string }> = Array.isArray(
      body.history,
    )
      ? body.history
      : [];
    const tier: string = body.tier || 'explorer';
    const systemPrompt: string | undefined = body.systemPrompt;

    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ ok: false, error: 'Message is required' });
    }

    // ── Basic input limits ───────────────────────────────────────────
    if (message.length > 4000) {
      return res.status(400).json({
        ok: false,
        error: 'Message too long (max 4000 characters).',
      });
    }
    if (history.length > 20) {
      return res.status(400).json({
        ok: false,
        error: 'History too large (max 20 messages).',
      });
    }

    // ── P0-1: Server-side credit enforcement ──────────────────────────
    // The user must have ≥1 mile in the `credits` table. We deduct 1
    // atomically (conditional update on the balance we read) BEFORE calling
    // DeepSeek, and refund it if the DeepSeek call fails so users are never
    // charged for a failed response. Uses the service role key to bypass RLS
    // (the serverless function cannot rely on the caller's JWT for writes).
    {
      const uid = encodeURIComponent(authUser.id);
      const balRes = await supabaseServiceFetch(
        `/credits?select=balance&user_id=eq.${uid}&limit=1`,
      );
      const balRow = Array.isArray(balRes.data) ? balRes.data[0] : null;
      const currentBalance = Number(balRow?.balance ?? 0);
      if (balRes.error || !balRow || currentBalance < 1) {
        return res.status(402).json({
          ok: false,
          error: 'Insufficient credits. Upgrade or wait for daily reset.',
          code: 'INSUFFICIENT_CREDITS',
        });
      }

      // Atomic deduction: only updates if balance still equals the value
      // we read, preventing race conditions / double-spend across
      // concurrent requests.
      const deductRes = await supabaseServiceFetch(
        `/credits?user_id=eq.${uid}&balance=eq.${currentBalance}&select=balance`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            balance: currentBalance - 1,
            updated_at: new Date().toISOString(),
          }),
        },
      );
      const deductRow = Array.isArray(deductRes.data)
        ? deductRes.data[0]
        : null;
      if (deductRes.error || !deductRow) {
        return res.status(402).json({
          ok: false,
          error: 'Failed to deduct credit. Please retry.',
          code: 'CREDIT_DEDUCTION_FAILED',
        });
      }
      creditBalance = Number(deductRow.balance);
      creditDeducted = true;
    }

    // ── P0-2: Session ownership validation ───────────────────────────
    // The client sends a session_id; we must verify it belongs to the
    // authenticated user before proceeding. If the session doesn't exist,
    // create it server-side as a safety net (mirrors the frontend's
    // createChatSession insert shape) so subsequent messages persist
    // against a row the user actually owns. This does NOT move session
    // CRUD server-side — the frontend still creates sessions via
    // createChatSession(); this only guards against cross-user session_id
    // spoofing and preserves the localStorage fallback.
    const sessionId: string | null =
      typeof body.session_id === 'string' && body.session_id.trim()
        ? body.session_id.trim()
        : null;

    if (sessionId) {
      const sidEnc = encodeURIComponent(sessionId);
      const ownRes = await supabaseServiceFetch(
        `/chat_sessions?select=user_id&id=eq.${sidEnc}&limit=1`,
      );
      const ownRow = Array.isArray(ownRes.data) ? ownRes.data[0] : null;

      if (ownRes.error) {
        // Transient Supabase error — fail safe: refund + 500.
        if (creditDeducted) {
          await refundCredit(authUser.id, 1);
          creditDeducted = false;
        }
        return res.status(500).json({
          ok: false,
          error: 'Session validation unavailable. Please retry.',
          code: 'SESSION_LOOKUP_FAILED',
        });
      }

      if (ownRow) {
        // Session exists — enforce ownership.
        if (String(ownRow.user_id) !== String(authUser.id)) {
          if (creditDeducted) {
            await refundCredit(authUser.id, 1);
            creditDeducted = false;
          }
          return res.status(403).json({
            ok: false,
            error: 'Session does not belong to authenticated user.',
            code: 'SESSION_FORBIDDEN',
          });
        }
        // Owned by this user — proceed.
      } else {
        // Session not found — create it server-side. Use the first 50
        // chars of the message as the title (matches frontend convention).
        const newTitle =
          message.length > 50 ? message.substring(0, 50) : message;
        const insRes = await supabaseServiceFetch(`/chat_sessions`, {
          method: 'POST',
          body: JSON.stringify({
            id: sessionId,
            user_id: authUser.id,
            title: newTitle,
            use_case: null,
            diagnostic_progress: 0,
            diagnostic_dimensions: [],
            milestone_status: {},
          }),
        });
        // If creation fails (e.g. UUID-typed id rejecting a localStorage
        // fallback id like "session_123…", or a concurrent-insert PK
        // collision), do NOT fail the request — there is no ownership to
        // violate on a non-existent session, and the localStorage fallback
        // must keep working.
        if (insRes.error) {
          console.warn(
            `[chat] Could not create session ${sessionId} server-side ` +
              `(user=${authUser.id}); proceeding without it:`,
            insRes.error?.message || insRes.error,
          );
        }
      }
    }

    // Build system prompt
    const sysPrompt =
      systemPrompt && systemPrompt.trim().length > 20
        ? systemPrompt.trim()
        : CHAT_SYSTEM_PROMPT +
          (tier
            ? `\n\nUser tier: ${tier}. Adjust depth and breadth accordingly — higher tiers get more sophisticated frameworks and deeper analysis.`
            : '');

    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: sysPrompt },
    ];

    // Add recent history (last 10 turns)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg && msg.role && msg.content) {
        messages.push({ role: msg.role, content: String(msg.content) });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call DeepSeek API
    const useProxy =
      process.env.CHAT_USE_PROXY === '1' ||
      process.env.CHAT_USE_PROXY === 'true' ||
      (!!DEEPSEEK_PROXY_KEY && DEEPSEEK_BASE_URL.includes('proxy'));

    const PROXY_URL = 'https://deepseek-v4-proxy.vercel.app/api/deepseek/chat/completions';

    let endpoint: string;
    if (useProxy && DEEPSEEK_PROXY_KEY) {
      endpoint = PROXY_URL;
    } else {
      const base = DEEPSEEK_BASE_URL.replace(/\/+$/, '');
      if (base.endsWith('/chat/completions')) {
        endpoint = base;
      } else if (base.endsWith('/v1') || base.endsWith('/v1/')) {
        endpoint = `${base}/chat/completions`;
      } else if (base.includes('/deepseek')) {
        endpoint = `${base}/chat/completions`;
      } else {
        endpoint = `${base}/v1/chat/completions`;
      }
    }

    const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          ...(DEEPSEEK_PROXY_KEY ? { 'X-Proxy-Key': DEEPSEEK_PROXY_KEY } : {}),
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: false,
        }),
      },
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        `[chat] DeepSeek API error (user=${authUser.id}):`,
        apiResponse.status,
        endpoint,
        errorText.slice(0, 500),
      );
      // P0-1: refund the deducted credit — the call failed, so the user
      // must not be charged for it.
      if (creditDeducted) {
        await refundCredit(authUser.id, 1);
        creditDeducted = false;
      }
      return res
        .status(502)
        .json({
          ok: false,
          error: 'Chat service unavailable',
          upstream_status: apiResponse.status,
          upstream_error: errorText.slice(0, 200),
        });
    }

    const data = await apiResponse.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      ok: true,
      response: responseText,
      model: data.model || DEEPSEEK_MODEL,
      usage: data.usage || null,
      user_id: authUser.id,
      credit_balance: creditBalance,
    });
  } catch (error: any) {
    // P0-1: safety net — if anything threw after a successful deduction
    // (e.g. JSON parse failure), refund the credit before erroring out.
    if (creditDeducted) {
      try {
        await refundCredit(authUser.id, 1);
      } catch {
        /* best-effort refund — already logged inside refundCredit */
      }
    }
    console.error('[chat] Unhandled error:', error?.message || error);
    return res
      .status(500)
      .json({ ok: false, error: 'Internal server error' });
  }
}


function chatGetClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return 'unknown';
}

// ── Utilities ───────────────────────────────────────────────────────
async function parseJsonBody(
  req: VercelRequest,
  limit: number = 100 * 1024,
): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > limit) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function substitute(template: string, vars: Record<string, any>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : `{${key}}`;
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Monthly Summary Cron Handler (HTTP trigger) ─────────────────────
// Serverless-friendly bounded batch runner. For full-pipeline runs use
// the standalone CLI: scripts/monthly_summary_cron.ts with DATABASE_URL.
//
// POST body options:
//   single_user_id?: uuid — process only this user (for testing)
//   max_users?:     number — cap to N users (default 20)
//   dry_run?:       0|1 — compute only, skip writes (default 0)
//
// This handler uses the service-role Supabase client to bypass RLS.
// Complex aggregations are issued as direct RPC-style calls via
// supabaseServiceFetch with SQL rendered through query-string filters.
// For production full runs, prefer the pg-based CLI script.
async function handleMonthlySummary(
  req: VercelRequest,
  res: VercelResponse,
) {
  let body: any = {};
  try {
    body = await parseJsonBody(req);
  } catch {
    body = {};
  }
  const singleUserId = body?.single_user_id || null;
  const maxUsers = Math.min(Number(body?.max_users || 20), 200);
  const dryRun = body?.dry_run === 1 || body?.dry_run === '1' || body?.dry_run === true;
  const APP_URL =
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    (process.env.VITE_SUPABASE_URL ? new URL(process.env.VITE_SUPABASE_URL).origin.replace('.supabase.co', '.lyc.partners') : '') ||
    'https://app.lyc.partners';

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      ok: false,
      error:
        'SUPABASE_SERVICE_ROLE_KEY not configured. Use scripts/monthly_summary_cron.ts CLI with DATABASE_URL for full runs.',
    });
  }

  // Step 1: load eligible users. We ask for tier via profiles + tiers.
  // Since the Supabase REST client can't join arbitrary tables easily,
  // we query tiers first to get eligible tier_keys, then filter profiles.
  const tierRes = await supabaseServiceFetch(
    '/tiers?select=tier_key,display_name,tier_order&tier_order=gte.2&order=tier_order.asc',
  );
  if (tierRes.error) {
    return res.status(502).json({ ok: false, error: `failed to load tiers: ${JSON.stringify(tierRes.error)}` });
  }
  const eligibleTierKeys: string[] = (tierRes.data || [])
    .filter((t: any) => String(t.tier_key) !== 'executive_introduction')
    .map((t: any) => String(t.tier_key));
  if (eligibleTierKeys.length === 0) {
    return res.status(500).json({ ok: false, error: 'no eligible tier_keys found' });
  }

  // Build filter: tier_key IN (...eligible)
  const tierIn = eligibleTierKeys.map((k) => `(${k})`).join(',');
  let profilesQuery = `/profiles?select=id,full_name,email,timezone,tier_key&tier_key=in.(${eligibleTierKeys.join(',')})&order=created_at.asc&limit=${maxUsers}`;
  if (singleUserId) {
    profilesQuery = `/profiles?select=id,full_name,email,timezone,tier_key&id=eq.${encodeURIComponent(singleUserId)}&limit=1`;
  }
  const profRes = await supabaseServiceFetch(profilesQuery);
  if (profRes.error) {
    return res.status(502).json({ ok: false, error: `failed to load profiles: ${JSON.stringify(profRes.error)}` });
  }

  type UserRow = { id: string; full_name: string | null; email: string | null; timezone: string | null; tier_key: string };
  const users: UserRow[] = (profRes.data || []).filter((u: UserRow) => !!u.email);
  const tierDisplayMap: Record<string, string> = {};
  for (const t of tierRes.data || []) tierDisplayMap[String(t.tier_key)] = String(t.display_name);

  // Shared helpers: windowing + tz (same logic as CLI)
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DIAGNOSTIC_SLUGS = ['prism','spark','forge','bridge','mosaic','drive'];

  function normalizeTz(raw: any): string {
    if (!raw) return 'UTC';
    try { new Intl.DateTimeFormat('en-US', { timeZone: String(raw) }); return String(raw); }
    catch { return 'UTC'; }
  }
  function localToUTC(y: number, m0: number, d: number, h: number, mi: number, s: number, tz: string): Date {
    const target = Date.UTC(y, m0, d, h, mi, s);
    let guess = target;
    for (let i = 0; i < 6; i++) {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).formatToParts(new Date(guess));
      const p = (t: string) => parseInt(parts.find((x: any) => x.type === t)!.value, 10);
      const got = Date.UTC(p('year'), p('month') - 1, p('day'), p('hour'), p('minute'), p('second'));
      const diff = target - got;
      if (diff === 0) break;
      guess += diff;
    }
    return new Date(guess);
  }
  function buildWindow(tzInput: any, ref: Date = new Date()) {
    const tz = normalizeTz(tzInput);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(ref);
    const p = (t: string) => parseInt(parts.find((x: any) => x.type === t)!.value, 10);
    let ly = p('year'); let lm = p('month') - 1; // 0-based prev-month target
    if (lm <= 0) { lm = 11; ly -= 1; }
    const ws = localToUTC(ly, lm, 1, 0, 0, 0, tz);
    let ny = ly; let nm = lm + 1;
    if (nm > 11) { nm = 0; ny += 1; }
    const we = localToUTC(ny, nm, 1, 0, 0, 0, tz);
    return {
      window_start: ws, window_end: we,
      month_label: `${MONTH_NAMES[lm]} ${ly}`,
      local_year: ly, local_month: lm + 1,
    };
  }

  const results: any[] = [];
  let jobs_enqueued = 0;
  let skipped = 0;
  const skippedReasons: Record<string, number> = {};
  let failures = 0;

  for (const u of users) {
    const ctx = { user_id: u.id, email: u.email, tier: u.tier_key };
    if (!u.email) { skipped++; skippedReasons['no_email'] = (skippedReasons['no_email'] || 0) + 1; continue; }
    try {
      const win = buildWindow(u.timezone);
      const uidEnc = encodeURIComponent(u.id);
      const wsEnc = win.window_start.toISOString();
      const weEnc = win.window_end.toISOString();

      // Parallel fetch per metric
      const [
        arRes, ncRes, shRes, aiRes,
      ] = await Promise.all([
        supabaseServiceFetch(
          `/assessment_results?select=overall_score,assessment_id,completed_at&user_id=eq.${uidEnc}&completed_at=gte.${encodeURIComponent(wsEnc)}&completed_at=lt.${encodeURIComponent(weEnc)}&limit=1000`,
        ),
        supabaseServiceFetch(
          `/nexus_conversations?select=id&user_id=eq.${uidEnc}&created_at=gte.${encodeURIComponent(wsEnc)}&created_at=lt.${encodeURIComponent(weEnc)}&deleted_at=is.null&limit=1000`,
        ),
        supabaseServiceFetch(
          `/assessment_shares?select=id&owner_id=eq.${uidEnc}&created_at=gte.${encodeURIComponent(wsEnc)}&created_at=lt.${encodeURIComponent(weEnc)}&limit=1000`,
        ),
        supabaseServiceFetch(
          `/ai_job_queue?select=job_id&or=(tenant_user_id.eq.${uidEnc},created_by_user.eq.${uidEnc})&status=eq.completed&created_at=gte.${encodeURIComponent(wsEnc)}&created_at=lt.${encodeURIComponent(weEnc)}&limit=1000`,
        ).then(async (r) => {
          // ai_job_queue REST API has no LIKE filter for kind=ai:* via the basic querystring
          // pattern easily. Post-filter locally is fine given the small batch.
          return r;
        }),
      ]);

      const assessments = Array.isArray(arRes.data) ? arRes.data : [];
      const assessments_completed = assessments.length;
      const scores = assessments
        .map((x: any) => Number(x.overall_score))
        .filter((n: number) => Number.isFinite(n));
      const highest_single_score = scores.length ? Math.max(...scores) : null;
      const per_diag: Record<string, number> = {};
      for (const s of DIAGNOSTIC_SLUGS) per_diag[s] = 0;
      for (const a of assessments) {
        const id = String(a.assessment_id || '').toLowerCase();
        if (per_diag.hasOwnProperty(id)) per_diag[id] += 1;
      }

      const nexus_sessions = Array.isArray(ncRes.data) ? ncRes.data.length : 0;
      const shares_sent = Array.isArray(shRes.data) ? shRes.data.length : 0;
      const allAiJobs = Array.isArray(aiRes.data) ? aiRes.data : [];
      // Need kind info too — re-query with select=kind. This is why the CLI
      // is preferred; but we keep HTTP handler simple and small-batch only.
      const insights_generated_res = await supabaseServiceFetch(
        `/ai_job_queue?select=job_id,kind&or=(tenant_user_id.eq.${uidEnc},created_by_user.eq.${uidEnc})&status=eq.completed&created_at=gte.${encodeURIComponent(wsEnc)}&created_at=lt.${encodeURIComponent(weEnc)}&limit=1000`,
      );
      const aiRows = Array.isArray(insights_generated_res.data) ? insights_generated_res.data : [];
      const insights_generated = aiRows.filter((r: any) => String(r.kind || '').startsWith('ai:')).length;

      // 3-month comparison (best-effort via single aggregated query by date ranges)
      let three_month_comparison: any = undefined;
      try {
        const entries: any[] = [];
        for (let off = 2; off >= 0; off--) {
          let y = win.local_year; let m = win.local_month - off;
          while (m <= 0) { m += 12; y -= 1; }
          const nextRef = (() => {
            let ny = y; let nm = m + 1;
            if (nm > 12) { nm = 1; ny += 1; }
            return localToUTC(ny, nm - 1, 5, 12, 0, 0, normalizeTz(u.timezone));
          })();
          const w = buildWindow(u.timezone, nextRef);
          entries.push({ offset: 2 - off, year: w.local_year, month: w.local_month, ws: w.window_start, we: w.window_end });
        }
        const perMonthPromises = entries.map(async (e) => {
          const res = await supabaseServiceFetch(
            `/assessment_results?select=overall_score&user_id=eq.${uidEnc}&completed_at=gte.${encodeURIComponent(e.ws.toISOString())}&completed_at=lt.${encodeURIComponent(e.we.toISOString())}&limit=500`,
          );
          const rows = Array.isArray(res.data) ? res.data : [];
          const scores = rows.map((x: any) => Number(x.overall_score)).filter((n: number) => Number.isFinite(n));
          return {
            month: `${MONTH_NAMES[e.month - 1]} ${e.year}`,
            assessments_completed: rows.length,
            avg_score: scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null,
          };
        });
        const comp = await Promise.all(perMonthPromises);
        if (comp[0].assessments_completed + comp[1].assessments_completed > 0) {
          three_month_comparison = comp;
        }
      } catch {
        three_month_comparison = undefined;
      }

      const trend: any = { highest_single_score, assessments_per_diagnostic: per_diag };
      if (three_month_comparison) trend.three_month_comparison = three_month_comparison;

      const payload = {
        recipient_name: u.full_name,
        recipient_email: u.email,
        user_tier: tierDisplayMap[u.tier_key] || u.tier_key,
        month_label: win.month_label,
        summary_counts: { assessments_completed, nexus_sessions, shares_sent, insights_generated },
        trend,
        account_url: `${APP_URL.replace(/\/$/, '')}/settings/account`,
      };

      let job_id: string | null = null;
      let delivery_id: string | null = null;
      if (!dryRun) {
        // Enqueue job
        const jobRes = await supabaseServiceFetch('/ai_job_queue', {
          method: 'POST',
          body: JSON.stringify({
            kind: 'email:monthly_summary',
            payload,
            priority: 100,
            available_at: new Date().toISOString(),
            tenant_user_id: u.id,
            created_by_user: null,
            status: 'queued',
            max_attempts: 5,
          }),
        });
        if (jobRes.error) throw new Error(`enqueue job failed: ${JSON.stringify(jobRes.error)}`);
        job_id = Array.isArray(jobRes.data) ? jobRes.data[0]?.job_id : null;

        // Delivery log
        const dlRes = await supabaseServiceFetch('/email_delivery_log', {
          method: 'POST',
          body: JSON.stringify({
            tenant_user_id: u.id,
            template_code: 'monthly_summary',
            from_name: 'LYC Partners',
            reply_to: 'no-reply@lyc.partners',
            to_addresses: [u.email],
            subject: `Your LYC Partners monthly summary for ${win.month_label}`,
            preheader: 'This month\'s assessments, NEXUS conversations, and insights at a glance.',
            provider: 'console',
            status: 'queued',
            miles_debited: 0,
            tier_at_send: u.tier_key,
            brand_pass: true,
            scheduled_at: new Date().toISOString(),
          }),
        });
        if (dlRes.error) throw new Error(`delivery log failed: ${JSON.stringify(dlRes.error)}`);
        delivery_id = Array.isArray(dlRes.data) ? dlRes.data[0]?.delivery_id : null;
        jobs_enqueued += 1;
      }

      results.push({
        user_id: u.id,
        email: u.email,
        month_label: win.month_label,
        counts: payload.summary_counts,
        highest_single_score,
        assessments_per_diagnostic: per_diag,
        has_3m: !!three_month_comparison,
        job_id,
        delivery_id,
      });
    } catch (e: any) {
      failures += 1;
      skipped += 1;
      skippedReasons['error'] = (skippedReasons['error'] || 0) + 1;
      results.push({
        user_id: u.id,
        email: u.email,
        error: e?.message || String(e),
      });
    }
  }

  return res.json({
    ok: true,
    worker: 'monthly-summary',
    note: dryRun ? 'DRY RUN — no rows written' : 'writes applied',
    eligible_tier_keys: eligibleTierKeys,
    total_users_processed: users.length,
    jobs_enqueued,
    skipped,
    failures,
    skipped_reasons: skippedReasons,
    results,
    serverless_batch_limit_note:
      'For full pipeline runs (all users, 3-month trend for real), use CLI: DATABASE_URL=... npx tsx scripts/monthly_summary_cron.ts',
  });
}


