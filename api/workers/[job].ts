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
  const valid = ['ai-trigger', 'email-send', 'email-webhook', 'template-render', 'chat'];
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
        'job param must be one of: ai-trigger, email-send, email-webhook, template-render, chat',
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

  // ai-trigger or email-send — both need worker secret
  if (!requireWorkerSecret(req)) {
    return res
      .status(403)
      .json({ ok: false, error: 'worker-secret required' });
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

// ── P1-2: Document upload + RAG context injection ───────────────────
// The frontend uploads a file to the `chat-uploads` Storage bucket at
// `{user_id}/{session_id}/{filename}`, then POSTs here with
// { action: 'process_doc', storage_path, filename, content_type, session_id }.
// The worker downloads the bytes with the service role (bypasses RLS),
// extracts text (pdf-parse / mammoth / raw), chunks it (~500 chars w/
// 100-char overlap), and inserts rows into chat_document_chunks under the
// caller's user_id. Returns { document_id, chunk_count, char_count } so the
// client can send document_ids back on subsequent chat messages for context
// injection (handled below in the normal chat flow).

function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 100,
): string[] {
  const chunks: string[] = [];
  if (!text || !text.trim()) return chunks;
  const step = Math.max(1, chunkSize - overlap);
  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(i + chunkSize, text.length);
    const slice = text.slice(i, end);
    if (slice.trim().length > 0) chunks.push(slice);
    if (end >= text.length) break;
  }
  return chunks;
}

async function extractTextFromBuffer(
  buf: Buffer,
  contentType: string,
  filename: string,
): Promise<string> {
  const lower = filename.toLowerCase();
  const ct = (contentType || '').toLowerCase();

  // PDF → pdf-parse (lazy import so chat cold-starts don't pay the cost)
  if (lower.endsWith('.pdf') || ct === 'application/pdf') {
    const mod: any = await import('pdf-parse');
    const pdfParse = mod.default || mod;
    const result = await pdfParse(buf);
    return String(result?.text ?? '');
  }

  // DOCX → mammoth (lazy import)
  if (
    lower.endsWith('.docx') ||
    ct ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth: any = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return String(result?.value ?? '');
  }

  // .txt / fallback — return raw decoded text
  return buf.toString('utf8');
}

// Download an object from the chat-uploads bucket using the service role.
async function downloadChatUpload(
  storagePath: string,
): Promise<{ buffer: Buffer; contentType: string } | { error: string }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Supabase service role not configured' };
  }
  // storagePath = "{user_id}/{session_id}/{filename}" (no bucket prefix).
  // Storage object API: GET /storage/v1/object/{bucket}/{path}
  const encoded = encodeURIComponent(storagePath);
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/chat-uploads/${encoded}`;
  try {
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!r.ok) {
      return { error: `storage fetch failed: HTTP ${r.status}` };
    }
    const ab = await r.arrayBuffer();
    return {
      buffer: Buffer.from(ab),
      contentType: r.headers.get('content-type') || 'application/octet-stream',
    };
  } catch (e: any) {
    return { error: e?.message || 'storage fetch error' };
  }
}

// P1-2: process_doc action — extract text, chunk, store under caller's id.
async function handleProcessDoc(
  req: VercelRequest,
  res: VercelResponse,
  authUser: { id: string; email: string | null },
  body: any,
) {
  const storagePath: string = String(body.storage_path || '').trim();
  const filename: string = String(body.filename || '').trim();
  const contentType: string = String(body.content_type || '').trim();
  const sessionId: string | null =
    typeof body.session_id === 'string' && body.session_id.trim()
      ? body.session_id.trim()
      : null;

  if (!storagePath || !filename) {
    return res
      .status(400)
      .json({ ok: false, error: 'storage_path and filename are required' });
  }

  // Security: the storage path MUST start with the caller's user_id so a
  // user can't process another user's uploads.
  if (!storagePath.startsWith(`${authUser.id}/`)) {
    return res.status(403).json({
      ok: false,
      error: 'storage_path must be rooted at the authenticated user.',
      code: 'STORAGE_PATH_FORBIDDEN',
    });
  }

  // Download bytes via service role (bypasses RLS — server-side only).
  const dl = await downloadChatUpload(storagePath);
  if ('error' in dl) {
    return res.status(502).json({ ok: false, error: dl.error });
  }

  let text: string;
  try {
    text = await extractTextFromBuffer(dl.buffer, dl.contentType, filename);
  } catch (e: any) {
    return res.status(422).json({
      ok: false,
      error: 'Text extraction failed for this file.',
      detail: e?.message || String(e),
    });
  }

  // Cap total chars to keep prompt size bounded (≈ 50k chars ≈ 12k tokens).
  const MAX_TOTAL_CHARS = 50_000;
  if (text.length > MAX_TOTAL_CHARS) text = text.slice(0, MAX_TOTAL_CHARS);

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return res.status(422).json({
      ok: false,
      error: 'No extractable text found in document.',
    });
  }

  // Generate a single document_id for all chunks of this upload.
  const documentId =
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Bulk-insert via PostgREST (service role bypasses RLS).
  // PostgREST accepts an array body for multi-row insert.
  const rows = chunks.map((content, i) => ({
    user_id: authUser.id,
    session_id: sessionId,
    document_id: documentId,
    filename,
    content_type: contentType || dl.contentType,
    chunk_index: i,
    content,
    char_count: content.length,
    storage_path: storagePath,
  }));

  const insRes = await supabaseServiceFetch('/chat_document_chunks', {
    method: 'POST',
    headers: {
      Prefer: 'return=representation',
    },
    body: JSON.stringify(rows),
  });

  if (insRes.error || !Array.isArray(insRes.data)) {
    console.error(
      `[chat] process_doc insert failed (user=${authUser.id}):`,
      insRes.error?.message || insRes.error,
    );
    return res.status(500).json({
      ok: false,
      error: 'Failed to store document chunks.',
      detail: insRes.error?.message || 'insert failed',
    });
  }

  return res.status(200).json({
    ok: true,
    document_id: documentId,
    chunk_count: insRes.data.length,
    char_count: text.length,
    filename,
  });
}

// ── P3-1: Milestone actions ────────────────────────────────────────
// All reads + writes filter by authUser.id even when using the service
// role (service bypasses RLS, so we MUST scope WHEREs server-side).
// Returns mirror the existing run.ts convention of machine-readable
// `code` fields — OWNER_MISMATCH / FINALIZATION_EVIDENCE / etc.

function isValidUUID(s: unknown): boolean {
  return (
    typeof s === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
  );
}

async function handleListMilestones(
  _req: VercelRequest,
  res: VercelResponse,
  authUser: { id: string },
  _body: any,
) {
  // status enum order: completed < active < queued isn't meaningful — use
  // a CASE ordering so "active" ranks first, then queued, then completed.
  const qs =
    `/milestones?select=id,name,description,tags,progress,status,` +
    `source_assessment_code,dependency_ids,required_lens_score,created_at,` +
    `completed_at,updated_at` +
    `&user_id=eq.${encodeURIComponent(authUser.id)}` +
    `&order=(status.eq.active).desc,` +
    `(status.eq.queued).desc,` +
    `(status.eq.completed).desc,` +
    `updated_at.desc`;

  const r = await supabaseServiceFetch(qs);
  if (r.error) {
    return res
      .status(500)
      .json({ ok: false, error: r.error.message || 'Failed to fetch milestones' });
  }
  return res.status(200).json({ ok: true, data: Array.isArray(r.data) ? r.data : [] });
}

async function handleValidateMilestone(
  _req: VercelRequest,
  res: VercelResponse,
  authUser: { id: string },
  body: any,
) {
  const milestoneId = body?.milestone_id;
  const newProgress = Number(body?.new_progress);
  const evidence: unknown = body?.evidence ?? null;

  if (!isValidUUID(milestoneId)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_MILESTONE_ID',
      error: 'milestone_id must be a valid UUID.',
    });
  }
  if (!Number.isFinite(newProgress)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_PROGRESS',
      error: 'new_progress must be an integer 0–100.',
    });
  }
  const clampedProgress = Math.max(0, Math.min(100, Math.round(newProgress)));
  if (evidence !== null && evidence !== undefined && typeof evidence !== 'object') {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_EVIDENCE',
      error: 'evidence must be a JSON object or null.',
    });
  }

  // Call the database RPC via PostgREST. /rpc/validate_and_set_milestone_progress
  // accepts positional params through request body JSON.
  const rpcRes = await supabaseServiceFetch('/rpc/validate_and_set_milestone_progress', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      p_milestone_id: milestoneId,
      p_new_progress: clampedProgress,
      p_user_id: authUser.id,
      p_evidence: evidence,
    }),
  });

  if (rpcRes.error) {
    return res.status(500).json({
      ok: false,
      code: 'RPC_ERROR',
      error: rpcRes.error.message || 'Milestone RPC failed.',
    });
  }

  // RPC returns TABLE(ok, code, message, previous_progress, new_progress)
  // → PostgREST returns an array of one row.
  const row =
    Array.isArray(rpcRes.data) && rpcRes.data.length > 0 ? rpcRes.data[0] : null;
  if (!row) {
    return res.status(500).json({
      ok: false,
      code: 'RPC_NO_ROW',
      error: 'Milestone validation RPC returned no rows.',
    });
  }

  const code: string = String(row.code || '');
  const ok: boolean = Boolean(row.ok);
  const status = !ok
    ? code === 'OWNER_MISMATCH'
      ? 403
      : code === 'MILESTONE_NOT_FOUND'
      ? 404
      : 422
    : 200;

  return res.status(status).json({
    ok,
    code,
    message: row.message || '',
    previous_progress:
      typeof row.previous_progress === 'number' ? row.previous_progress : null,
    new_progress: typeof row.new_progress === 'number' ? row.new_progress : null,
  });
}

// ── P2-2: Cross-session memory (extraction, storage, injection) ────
//
// Design notes:
//  • All reads + writes filter by user_id explicitly even though the service
//    role bypasses RLS — no cross-user data leakage possible.
//  • extraction uses keyword heuristics (no extra LLM call → ~$0 + ~0ms).
//    Precision beats recall: false negatives are fine (just don't remember
//    that specific item), false positives are very unlikely with the tight
//    trigger regex list.
//  • Memory feature has a master kill-switch: profile_settings.enable_nexus_memory
//    = false skips reads AND writes entirely. Default true (opt-out).
//  • Writes fail open — if any memory INSERT fails, chat response is still
//    200 — memory is a best-effort enrichment, never block the turn.

type NexusMemoryType =
  | 'decision'
  | 'action_item'
  | 'emotion'
  | 'fact'
  | 'preference'
  | 'summary';

interface MemoryCandidate {
  content: string;
  memory_type: NexusMemoryType;
  importance_score?: number;
}

// Map each memory type to a list of case-insensitive trigger regexes.
// Capture the whole sentence (split on .!? followed by space) so a single
// message can produce multiple items per class if it has multiple sentences
// matching any trigger.
const MEMORY_PATTERNS: Record<NexusMemoryType, RegExp[]> = {
  decision: [
    /\b(I decided|we chose|my final decision|decision was|agree to|agreed to|settle on|settled on|made up my mind)\b/i,
  ],
  action_item: [
    /\b(I will|I'll|we will|we'll|next step|need to|plan to|going to|must|should|have to) .{10,300}/i,
    /\b(by (Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday|week|end of week|month|quarter|end of|tomorrow|tonight))\b/i,
  ],
  preference: [
    /\b(I prefer|I like|I (really )?love|I don'?t like|I hate|I dislike|works best when|better when|best when|ideally|I would rather|please don'?t|I want you to (use|apply|format|write))\b/i,
  ],
  emotion: [
    /\b(I feel|I'?m feeling|I am feeling|excited|frustrated|worried|stressed|happy|anxious|grateful|surprised|nervous|proud|disappointed|hopeful|overwhelmed)\b/i,
  ],
  fact: [
    /\b(I work at|my role is|I'?m the|I manage|my team (has|is) |I report to|I'?m based in|I live in|company size|industry is|we are |my organization|I'?m in charge of|I lead|I oversee)\b/i,
  ],
  summary: [/\b\/summary\b/],
};

function splitSentences(text: string): string[] {
  if (!text) return [];
  // Split on sentence terminators + newline, drop empties, trim.
  return text
    .split(/(?<=[.!?])\s+|\n+|(?<=。)\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 10);
}

function extractMemories(
  userMessage: string,
  assistantReply: string,
): MemoryCandidate[] {
  const combined = `${userMessage}\n${assistantReply}`;
  const sentences = splitSentences(combined);
  const seenHashes = new Set<string>();
  const out: MemoryCandidate[] = [];

  for (const sent of sentences) {
    for (const [rawType, patterns] of Object.entries(MEMORY_PATTERNS) as Array<
      [NexusMemoryType, RegExp[]]
    >) {
      if (patterns.some((re) => re.test(sent))) {
        // Deduplicate: sha1-ish 40-char fingerprint is overkill; short hash
        // of first 80 chars is enough because memory writes within 5 minutes
        // with the same content prefix are dropped anyway.
        const key = rawType + ':' + sent.slice(0, 80).toLowerCase();
        if (seenHashes.has(key)) continue;
        seenHashes.add(key);
        // Length-cap stored content to keep text fields bounded
        const content = sent.length > 480 ? sent.slice(0, 477) + '…' : sent;
        // Default importance: higher for preferences + decisions (core to
        // long-term persona), lower for emotions (transient). Facts are
        // medium. Summary row gets max.
        let score = 0.5;
        if (rawType === 'preference' || rawType === 'decision') score = 0.85;
        else if (rawType === 'summary') score = 0.95;
        else if (rawType === 'fact') score = 0.7;
        else if (rawType === 'action_item') score = 0.7;
        else if (rawType === 'emotion') score = 0.4;
        out.push({ content, memory_type: rawType, importance_score: score });
      }
      if (out.length >= 5) break;
    }
    if (out.length >= 5) break;
  }
  return out;
}

// Returns null when memory is disabled; otherwise the trimmed boolean flag.
async function isMemoryEnabled(userId: string): Promise<boolean> {
  try {
    const r = await supabaseServiceFetch(
      `/profile_settings?select=enable_nexus_memory&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    );
    if (r.error || !Array.isArray(r.data) || r.data.length === 0) return true; // default opt-in if row absent
    const val = r.data[0]?.enable_nexus_memory;
    if (val === false || val === 'false') return false;
    return true;
  } catch {
    return true; // fail open
  }
}

// Count user's chat_sessions rows with user_id = userId — used to trigger
// semantic upsert on every 5th session boundary.
async function estimateSessionCount(userId: string): Promise<number> {
  try {
    const r = await supabaseServiceFetch(
      `/chat_sessions?user_id=eq.${encodeURIComponent(userId)}&select=id`,
    );
    if (r.error || !Array.isArray(r.data)) return 0;
    return r.data.length;
  } catch {
    return 0;
  }
}

async function insertEpisodicMemories(
  userId: string,
  sessionId: string | null,
  candidates: MemoryCandidate[],
): Promise<void> {
  if (candidates.length === 0) return;
  const rows: unknown[] = candidates.map((c) => ({
    user_id: userId,
    source_conversation_id: sessionId,
    content: c.content,
    memory_type: c.memory_type,
    importance_score: c.importance_score ?? 0.5,
    ts: new Date().toISOString(),
  }));

  try {
    // BULK INSERT /nexus_episodic_memory via PostgREST service-role.
    await supabaseServiceFetch('/nexus_episodic_memory', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
    // Audit entries — one per inserted row. We don't hold memory_ids back
    // since the audit trail doesn't need them (source='auto_extraction' and
    // ts/user_id correlation is sufficient for admin review). Content
    // snapshot in `new_value` gives admins a readable diff if needed.
    const audits = candidates.map((c) => ({
      user_id: userId,
      change_type: 'created',
      new_value: `${c.memory_type}: ${c.content.slice(0, 500)}`,
      source: 'auto_extraction',
      ts: new Date().toISOString(),
    }));
    await supabaseServiceFetch('/nexus_memory_audit', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(audits),
    });
  } catch (e: any) {
    console.warn(
      `[chat-memory] episodic insert failed (user=${userId}):`,
      e?.message || e,
    );
  }
}

// Called on session-boundary (≥5 sessions) or explicit /summary. Aggregates
// 10 latest fact/decision/action_item memories into the user_model JSONB
// document in nexus_semantic_memory.
async function updateSemanticMemoryIfDue(
  userId: string,
  userMessage: string,
  sessionId: string | null,
  force: boolean = false,
): Promise<void> {
  const summaryTriggered = force || /(^|\s)\/summary(\s|$)/.test(userMessage);
  if (!summaryTriggered) {
    const n = await estimateSessionCount(userId);
    if (n < 5 || n % 5 !== 0) return; // only every 5th session boundary
  }

  // Pull 10 latest decision/fact/action_item from episodic.
  let memories: any[] = [];
  try {
    const r = await supabaseServiceFetch(
      `/nexus_episodic_memory?select=content,memory_type` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        `&memory_type=in.(decision,fact,action_item)` +
        `&order=ts.desc&limit=10`,
    );
    memories = Array.isArray(r.data) ? r.data : [];
  } catch (e) {
    console.warn(`[chat-memory] episodic fetch for semantic:`, e);
    return;
  }

  const goals: string[] = [];
  const focusAreas: string[] = [];
  const careerCtx: Record<string, string> = {};

  for (const m of memories) {
    const txt: string = String(m.content || '');
    const t: string = String(m.memory_type || 'fact');
    if (t === 'decision' && txt.length > 15) goals.push(txt);
    if (t === 'action_item' && txt.length > 15) focusAreas.push(txt);
    if (t === 'fact') {
      const mRole = txt.match(/my role is ([\w\s,]{2,60})/i);
      if (mRole) careerCtx.role = mRole[1].trim();
      const mInd = txt.match(/industry is ([\w\s,]{2,60})/i);
      if (mInd) careerCtx.industry = mInd[1].trim();
      const mLoc = txt.match(/I'?m based in ([\w\s,]{2,60})/i);
      if (mLoc) careerCtx.location = mLoc[1].trim();
      const mWork = txt.match(/I work at ([\w\s,]{2,60})/i);
      if (mWork) careerCtx.company = mWork[1].trim();
    }
  }

  // Build an incremental patch JSONB.
  const patch = JSON.stringify({
    goals: goals.slice(0, 10),
    preferences: { focus_areas: focusAreas.slice(0, 10) },
    career_context: careerCtx,
  });

  try {
    // UPSERT into nexus_semantic_memory using the service role.
    // If row exists → JSONB_SET merge goals/preferences.focus_areas/career_context
    // with jsonb_concat-style (keep old keys, overwrite arrays). We don't do
    // field-level merge today — just replace the 3 fields atomically.
    await supabaseServiceFetch(
      `/rpc/upsert_nexus_semantic_memory_patch`,
      {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ p_user_id: userId, p_patch: patch }),
      },
    ).then((r) => {
      // If the RPC doesn't exist (pre-apply of its SQL companion in the
      // migration), fall back to a plain upsert of the full document shape.
      if (r.error && /function.*upsert_nexus_semantic_memory_patch/.test(r.error?.message || '')) {
        const fallbackDoc = {
          user_id: userId,
          user_model: JSON.parse(patch),
          update_count: 1,
          last_updated: new Date().toISOString(),
        };
        return supabaseServiceFetch('/nexus_semantic_memory', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(fallbackDoc),
        });
      }
      return r;
    });

    // Audit row for the semantic update.
    await supabaseServiceFetch('/nexus_memory_audit', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        change_type: 'updated',
        new_value: `semantic upsert; goals=${goals.length} focus=${focusAreas.length}`,
        source: 'auto_extraction',
        ts: new Date().toISOString(),
      }),
    });
  } catch (e: any) {
    console.warn(
      `[chat-memory] semantic upsert failed (user=${userId}):`,
      e?.message || e,
    );
  }
}

// Builds the "Recall (from prior sessions):" markdown preamble block.
//
// 1. Get semantic summary if any → rendered as top-level bullet about
//    goals/preferences/career-context.
// 2. Get 6 most relevant episodic memories (importance ≥0.75 OR ILIKE of
//    2+ tokens from currentMessage), last 90 days.
//
// Returns '' if memory disabled or nothing relevant found.
async function fetchContextMemories(
  userId: string,
  currentMessage: string,
  enabled: boolean,
): Promise<string> {
  if (!enabled) return '';

  let semanticRow: any = null;
  let episodicRows: any[] = [];
  try {
    const semRes = await supabaseServiceFetch(
      `/nexus_semantic_memory?select=user_model&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    );
    semanticRow = Array.isArray(semRes.data) && semRes.data.length > 0 ? semRes.data[0] : null;

    // Build ILIKE OR tokens from currentMessage.
    const tokens = String(currentMessage || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 5 && t.length <= 16)
      .slice(0, 10);
    // Use importance>=0.75 as the primary signal, OR fall back to any
    // memory younger than 2 weeks if nothing matches strongly.
    // (ILIKE is handled in-code to avoid tricky URL-encode of % chars — we
    //  pull all rows with ts >= 90d ago, importance >= 0.5, then filter.)
    const cutoff = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const epRes = await supabaseServiceFetch(
      `/nexus_episodic_memory?select=content,memory_type,importance_score,ts` +
        `&user_id=eq.${encodeURIComponent(userId)}` +
        `&ts=gte.${encodeURIComponent(cutoff)}` +
        `&order=importance_score.desc,ts.desc&limit=12`,
    );
    episodicRows = Array.isArray(epRes.data) ? epRes.data : [];
  } catch (e) {
    console.warn(`[chat-memory] fetch context failed (user=${userId}):`, e);
    return '';
  }

  const sections: string[] = [];

  // Semantic summary first (it's structured).
  if (semanticRow?.user_model) {
    const model = semanticRow.user_model as Record<string, any>;
    const goals: string[] = Array.isArray(model.goals) ? model.goals : [];
    const focus: string[] =
      Array.isArray(model.preferences?.focus_areas)
        ? model.preferences.focus_areas
        : [];
    const career: Record<string, string> | null =
      model.career_context && typeof model.career_context === 'object'
        ? model.career_context
        : null;
    const lines: string[] = [];
    if (goals.length) lines.push(`- Goals: ${goals.slice(0, 4).join('; ')}`);
    if (focus.length) lines.push(`- Focus areas: ${focus.slice(0, 4).join('; ')}`);
    if (career) {
      const cc = Object.entries(career)
        .filter(([_, v]) => v && String(v).trim())
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      if (cc) lines.push(`- Career context: ${cc}`);
    }
    if (lines.length) sections.push('**You know about them (aggregate):**\n' + lines.join('\n'));
  }

  // Filter episodic — importance>=0.75 OR content ILIKEs any of tokens
  let pickedRows = episodicRows.filter(
    (r) => Number(r.importance_score) >= 0.75,
  );
  if (pickedRows.length < 3 && tokens.length >= 2) {
    const extras = episodicRows.filter(
      (r) =>
        Number(r.importance_score) < 0.75 &&
        tokens.some((tok) =>
          String(r.content || '')
            .toLowerCase()
            .includes(tok),
        ),
    );
    pickedRows = pickedRows.concat(extras);
  }
  if (pickedRows.length === 0 && episodicRows.length <= 6) pickedRows = episodicRows;

  pickedRows = pickedRows.slice(0, 6);
  if (pickedRows.length) {
    const bullets = pickedRows.map(
      (r) =>
        `- [${String(r.memory_type).slice(0, 4)}] ${String(r.content).slice(0, 200)}`,
    );
    sections.push(
      '**Snippets from prior conversations (verify before relying):**\n' +
        bullets.join('\n'),
    );
  }

  if (sections.length === 0) return '';

  const MAX_MEMORY_CONTEXT_CHARS = 2000; // ~500 tokens, keeps context bounded
  const fullContext =
    `\n\n--- Recall (from prior sessions; label-based — not guaranteed accurate) ---\n` + +
    sections.join('\n\n')
  if (fullContext.length <= MAX_MEMORY_CONTEXT_CHARS) return fullContext;
  return fullContext.slice(0, MAX_MEMORY_CONTEXT_CHARS) + '\n… (truncated)';
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

  // ── Look up user's real tier from profiles (server-side SSOT) ──────
  // The client sends a `tier` field for convenience, but we never trust it
  // for depth gating — always read from the database. This prevents a
  // client from spoofing a higher tier to get deeper analysis.
  let userTier: string = 'explorer';
  {
    const uid = encodeURIComponent(authUser.id);
    const tierRes = await supabaseFetch(
      `/profiles?select=tier&id=eq.${uid}&limit=1`,
    );
    const tierRow = Array.isArray(tierRes.data) ? tierRes.data[0] : null;
    if (!tierRes.error && tierRow?.tier) {
      userTier = String(tierRow.tier);
    }
  }

  // P0-1: track whether a credit was deducted so we can refund on any
  // failure path (DeepSeek error or unhandled throw).
  let creditDeducted = false;
  let creditBalance: number | undefined;

  try {
    const body = await parseJsonBody(req);

    // P1-2: route document-processing requests to the dedicated handler
    // BEFORE any credit deduction. Document upload/indexing is free —
    // users are only charged when they send a chat message that consumes
    // the document context (the normal flow below).
    if (body.action === 'process_doc') {
      return handleProcessDoc(req, res, authUser, body);
    }

    // P3-1: Milestone list / validate actions (reuse [job].ts dispatch — no
    // new serverless function file, stays within the 12-function Hobby cap).
    // Milestone reads + writes are free; the 1-credit charge only applies
    // to real chat turns further below.
    if (body.action === 'list_milestones') {
      return handleListMilestones(req, res, authUser, body);
    }
    if (body.action === 'validate_milestone') {
      return handleValidateMilestone(req, res, authUser, body);
    }

    const message: string = body.message || '';
    const history: Array<{ role: string; content: string }> = Array.isArray(
      body.history,
    )
      ? body.history
      : [];
    // NOTE: body.tier is NOT used for tier gating. userTier (fetched
    // server-side from profiles above) is the canonical source.
    // body.tier is silently ignored — kept only for backward compat with
    // older clients that still send it.
    const tier = userTier;
    const systemPrompt: string | undefined = body.systemPrompt;

    // P1-2: optional list of document_ids the client attached to this
    // message. We fetch their chunks (owned by authUser) from
    // chat_document_chunks and inject a "Document context:" preamble into
    // the system prompt. Filtering happens server-side by user_id so a
    // caller cannot read another user's documents.
    const documentIds: string[] = Array.isArray(body.document_ids)
      ? body.document_ids.filter(
          (d: any) => typeof d === 'string' && d.trim().length > 0,
        )
      : [];

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
          error: 'Insufficient miles. Upgrade or wait for daily reset.',
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
          error: 'Failed to deduct mile. Please retry.',
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

    // P1-2: fetch + inject RAG document context when document_ids are
    // attached. We use the service role (bypasses RLS) but filter by
    // authUser.id so a caller can never pull another user's chunks. Cap at
    // 40 chunks to keep the prompt bounded (~20k chars ≈ 5k tokens).
    let docContextBlock = '';
    if (documentIds.length > 0) {
      const inList = documentIds.join(',');
      const dcRes = await supabaseServiceFetch(
        `/chat_document_chunks?select=filename,chunk_index,content` +
          `&user_id=eq.${encodeURIComponent(authUser.id)}` +
          `&document_id=in.(${inList})` +
          `&order=chunk_index.asc&limit=40`,
      );
      if (Array.isArray(dcRes.data) && dcRes.data.length > 0) {
        const byDoc = new Map<string, string[]>();
        for (const row of dcRes.data) {
          const key = String(row.filename || 'Document');
          if (!byDoc.has(key)) byDoc.set(key, []);
          byDoc.get(key)!.push(String(row.content));
        }
        const blocks: string[] = [];
        for (const [filename, chunks] of byDoc) {
          blocks.push(
            `### ${filename}\n` +
              chunks.map((c) => c.trim()).join('\n\n'),
          );
        }
        docContextBlock =
          `\n\n--- Attached document context (user-supplied; verify before relying on specifics) ---\n` +
          blocks.join('\n\n');
      }
    }

    // P2-2: memory reads (best-effort, fail-open to empty string).
    const memoryEnabled = await isMemoryEnabled(authUser.id);
    const memoryContextBlock = memoryEnabled
      ? await fetchContextMemories(authUser.id, message, true)
      : '';

    // Build messages
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: sysPrompt + docContextBlock + memoryContextBlock },
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

    // P2-2: Memory writebacks (all fail-open, never block response). We guard
    // EVERYTHING with a single try/catch so an unexpected error in the
    // extraction path can never swallow a valid user chat response.
    try {
      if (memoryEnabled) {
        const candidates = extractMemories(message, responseText);
        if (candidates.length > 0) {
          await insertEpisodicMemories(authUser.id, sessionId, candidates);
        }
        // Semantic upsert fires on /summary, 5-session boundary, OR on any
        // turn where we just wrote a decision/preference (high-signal writes).
        const highSignal = candidates.some(
          (c) => c.memory_type === 'decision' || c.memory_type === 'preference',
        );
        if (
          candidates.length > 0 &&
          (/(^|\s)\/summary(\s|$)/.test(message) || highSignal)
        ) {
          void updateSemanticMemoryIfDue(authUser.id, message, sessionId, true);
        } else {
          void updateSemanticMemoryIfDue(authUser.id, message, sessionId, false);
        }
      }
    } catch (memErr: any) {
      console.warn(
        `[chat-memory] post-turn extraction skipped (user=${authUser.id}):`,
        memErr?.message || memErr,
      );
    }

    return res.status(200).json({
      ok: true,
      response: responseText,
      model: data.model || DEEPSEEK_MODEL,
      usage: data.usage || null,
      user_id: authUser.id,
      mile_balance: creditBalance,
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


