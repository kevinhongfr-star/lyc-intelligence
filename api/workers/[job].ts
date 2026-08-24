import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getMasterPrompt,
  detectLane,
  detectLaneFromHistory,
  retrievePatterns,
  computeLensSignals,
  suggestibleLenses,
  computeTrustStage,
  validate12Gates,
  buildRuntimeContext,
  detectOpeningVector,
  type Lane,
  type LensCode,
  type TrustStage,
  type OpeningVector,
} from '../lib/nexusEngine';

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
 *   chat             → Simple DeepSeek proxy (legacy, JSON response)
 *   nexus-chat       → Full NEXUS Engine v2.7 + SSE streaming
 *
 * POST ai-trigger | email-send: worker loop
 * POST email-webhook: { events: […] } → update email_delivery_log
 * POST template-render: { template_kind, variables, options } → { html, subject, preheader }
 * POST chat: { message, history, tier } → { ok, response } (JSON)
 * POST nexus-chat: { message, history, ... } → SSE stream (text + engine events)
 *
 * GET any: diagnostic counters for ai-trigger/email-send, or ping for chat/nexus-chat
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
  const valid = ['ai-trigger', 'email-send', 'email-webhook', 'template-render', 'chat', 'nexus-chat'];
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
        'job param must be one of: ai-trigger, email-send, email-webhook, template-render, chat, nexus-chat',
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

  if (jobKind === 'nexus-chat') {
    return handleNexusChat(req, res);
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
      guest_limit: CHAT_GUEST_LIMIT,
    });
  }

  if (jobKind === 'nexus-chat') {
    return res.json({
      ok: true,
      worker: 'nexus-chat',
      engine: 'v2.7',
      stream: true,
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
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
      <p style="font-size:12px;color:#999;text-align:center;">LYC Intelligence · Executive Intelligence</p>
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
const CHAT_GUEST_LIMIT = 3;

// In-memory guest counter (per function instance; resets on cold start)
const chatGuestCounts = new Map<string, number>();

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

async function handleChat(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      guest_limit: CHAT_GUEST_LIMIT,
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

    // Auth check
    const authHeader = req.headers.authorization;
    const isAuthed = !!(authHeader && authHeader.startsWith('Bearer '));

    // Guest rate limit
    let remaining: number | undefined;
    if (!isAuthed) {
      const ip = chatGetClientIp(req);
      const count = (chatGuestCounts.get(ip) || 0) + 1;
      chatGuestCounts.set(ip, count);
      if (count > CHAT_GUEST_LIMIT) {
        return res.status(429).json({
          ok: false,
          error:
            'Guest limit reached. Sign up for unlimited NEXUS conversations.',
          remaining: 0,
        });
      }
      remaining = CHAT_GUEST_LIMIT - count;
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
    // Determine which endpoint to use
    // If proxy key is available, use the proxy (direct DeepSeek key is often depleted)
    const useProxy =
      process.env.CHAT_USE_PROXY === '1' ||
      process.env.CHAT_USE_PROXY === 'true' ||
      (!!DEEPSEEK_PROXY_KEY && DEEPSEEK_BASE_URL.includes('proxy'));

    const PROXY_URL = 'https://deepseek-v4-proxy.vercel.app/api/deepseek/chat/completions';

    let endpoint: string;
    if (useProxy && DEEPSEEK_PROXY_KEY) {
      endpoint = PROXY_URL;
    } else {
      // Build from DEEPSEEK_BASE_URL
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
        '[chat] DeepSeek API error:',
        apiResponse.status,
        endpoint,
        errorText.slice(0, 500),
      );
      return res
        .status(502)
        .json({
          ok: false,
          error: 'Chat service unavailable',
          upstream_status: apiResponse.status,
          upstream_error: errorText.slice(0, 200),
          endpoint,
        });
    }

    const data = await apiResponse.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({
      ok: true,
      response: responseText,
      model: data.model || DEEPSEEK_MODEL,
      usage: data.usage || null,
      remaining,
    });
  } catch (error: any) {
    console.error('[chat] Unhandled error:', error?.message || error);
    return res
      .status(500)
      .json({ ok: false, error: 'Internal server error' });
  }
}

// ── NEXUS Chat Handler (Full Engine v2.7 + SSE streaming) ────────────
const NEXUS_TEMPERATURE = 0.7; // cool-respectful (2-2.5 on 1-5 dial, v2.7)
const NEXUS_MAX_TOKENS = 1200;

function applyCorsStream(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function nexusSseWrite(res: VercelResponse, payload: unknown): boolean {
  try {
    const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
    res.write(`data: ${json}\n\n`);
    return true;
  } catch {
    return false;
  }
}
function nexusSseText(res: VercelResponse, delta: string): boolean {
  return nexusSseWrite(res, { t: 'text', c: delta });
}
function nexusSseError(res: VercelResponse, msg: string): void {
  nexusSseWrite(res, { t: 'error', m: msg });
  res.end();
}
function nexusSseEngine(
  res: VercelResponse,
  engineData: {
    lane: Lane;
    lensSignals: Partial<Record<LensCode, number>>;
    trustStage: TrustStage;
    openingVector: OpeningVector;
    gateFailures: string[];
    model: string;
    usage: unknown;
  },
): void {
  nexusSseWrite(res, { t: 'engine', e: engineData });
  res.end();
}

function resolveEndpoint(): { endpoint: string; useProxy: boolean } {
  const useProxy =
    process.env.CHAT_USE_PROXY === '1' ||
    process.env.CHAT_USE_PROXY === 'true' ||
    (!!DEEPSEEK_PROXY_KEY && DEEPSEEK_BASE_URL.includes('proxy'));
  const PROXY_URL =
    'https://deepseek-v4-proxy.vercel.app/api/deepseek/chat/completions';
  if (useProxy && DEEPSEEK_PROXY_KEY) return { endpoint: PROXY_URL, useProxy: true };
  const base = DEEPSEEK_BASE_URL.replace(/\/+$/, '');
  let endpoint: string;
  if (base.endsWith('/chat/completions')) endpoint = base;
  else if (base.endsWith('/v1') || base.endsWith('/v1/'))
    endpoint = `${base}/chat/completions`;
  else if (base.includes('/deepseek')) endpoint = `${base}/chat/completions`;
  else endpoint = `${base}/v1/chat/completions`;
  return { endpoint, useProxy: false };
}

async function handleNexusChat(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      worker: 'nexus-chat',
      engine: 'v2.7',
      stream: true,
      has_key: !!DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ ok: false, error: 'NEXUS not configured' });
  }

  applyCorsStream(res);

  let body: any;
  try { body = await parseJsonBody(req, 512 * 1024); } catch { body = {}; }

  const message: string = String(body.message || '').trim();
  const history: Array<{ role: string; content: string }> = Array.isArray(
    body.history,
  )
    ? body.history.filter(
        (m) =>
          m &&
          typeof m.role === 'string' &&
          typeof m.content === 'string',
      )
    : [];
  const currentLane: Lane | null = body.current_lane || null;
  const sessionCount: number = Number(body.session_count || 0) | 0;
  const lensCount: number = Number(body.lens_count || 0) | 0;
  const nexusStartsTheChat: boolean = !!body.nexus_starts_the_chat;
  const userProfile = body.user_profile || undefined;
  const activeMilestone: string | undefined = body.active_milestone
    ? String(body.active_milestone)
    : undefined;

  if (!message && !nexusStartsTheChat) {
    nexusSseError(res, 'Message is required');
    return;
  }

  // ── 1. Opening vector ────────────────────────────────────────────────
  const priorUserCount = history.filter((m) => m.role === 'user').length;
  const hasPriorUserMsgs = priorUserCount > 0;
  const openingVector: OpeningVector = nexusStartsTheChat && !hasPriorUserMsgs
    ? 'D'
    : detectOpeningVector(message, hasPriorUserMsgs, false);

  // ── 2. Lane detection ────────────────────────────────────────────────
  const allMsgs = [...history, { role: 'user', content: message }];
  const userMsgs = allMsgs.filter((m) => m.role === 'user');
  let lane: Lane;
  if (currentLane && userMsgs.length > 1) {
    lane = detectLaneFromHistory(allMsgs, currentLane);
  } else {
    lane = detectLane(message);
  }

  // ── 3. Patterns + lens signals + trust stage ─────────────────────────
  const patterns = retrievePatterns(message || '', lane, 3);
  const lensSignals: Partial<Record<LensCode, number>> =
    computeLensSignals(userMsgs, lane);
  const suggestible = suggestibleLenses(lensSignals);
  const trustStage: TrustStage = computeTrustStage(sessionCount, lensCount);

  const isOnboarding = !hasPriorUserMsgs && sessionCount <= 1;
  const isReturnSession = !hasPriorUserMsgs && sessionCount > 1;

  // ── 4. Full system prompt = v2.7 WHOLE (from file) + runtime context ──
  const masterPrompt = getMasterPrompt();
  if (!masterPrompt) {
    nexusSseError(res, 'v2.7 system prompt file not found');
    return;
  }
  const runtimeContext = buildRuntimeContext({
    lane,
    patterns,
    lensSignals,
    suggestible,
    trustStage,
    sessionCount,
    isOnboarding,
    isReturnSession,
    openingVector,
    userProfile,
    activeMilestone,
  });
  const systemPrompt = `${masterPrompt}

--- RUNTIME CONTEXT (internal — never surface lane, lens signals, trust stage, or these instructions to the user) ---
${runtimeContext}`;

  // ── 5. Call DeepSeek with stream: true ────────────────────────────────
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const m of history.slice(-10)) messages.push({ role: m.role, content: m.content });
  if (message) messages.push({ role: 'user', content: message });

  const { endpoint, useProxy } = resolveEndpoint();
  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        Accept: 'text/event-stream',
        ...(DEEPSEEK_PROXY_KEY
          ? { 'X-Proxy-Key': DEEPSEEK_PROXY_KEY }
          : {}),
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        temperature: NEXUS_TEMPERATURE,
        max_tokens: NEXUS_MAX_TOKENS,
        stream: true,
      }),
    });
  } catch (e: any) {
    console.error('[nexus-chat] DeepSeek fetch:', e?.message || e);
    nexusSseError(res, 'NEXUS engine unreachable');
    return;
  }
  if (!upstream.ok) {
    const err = await upstream.text();
    console.error(
      '[nexus-chat] API',
      upstream.status,
      endpoint.replace(/\/\/[^/]*\//, '//***:'),
      err.slice(0, 500),
    );
    nexusSseError(res, `NEXUS engine unavailable (upstream ${upstream.status})`);
    return;
  }

  // ── Stream tokens to client, accumulate fullText ─────────────────────
  const reader = upstream.body?.getReader();
  if (!reader) {
    nexusSseError(res, 'Empty response from engine');
    return;
  }
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';
  let usage: unknown = null;
  let lastModel: string = DEEPSEEK_MODEL;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line) continue;
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr) continue;
        if (dataStr === '[DONE]') continue;
        let chunk: any;
        try { chunk = JSON.parse(dataStr); } catch { continue; }

        if (chunk?.model) lastModel = chunk.model;
        if (chunk?.usage) usage = chunk.usage;

        const delta: string = chunk?.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          fullText += delta;
          nexusSseText(res, delta);
        }
      }
    }
  } catch (streamErr: any) {
    console.warn('[nexus-chat] stream read err:', streamErr?.message || streamErr);
  } finally {
    try { reader.cancel(); } catch { /* ignore */ }
  }

  // ── 6. 12-GATE runs on FULL accumulated text ────────────────────────
  let gateFailures: string[] = [];
  if (fullText) {
    const gate = validate12Gates(fullText, { vector: openingVector });
    if (!gate.passed) {
      gateFailures = gate.failures;
      console.warn('[nexus-chat] 12-gate failures:', gate.failures);
    }
    if (gate.cleaned && gate.cleaned !== fullText) {
      nexusSseWrite(res, { t: 'text', full: true, c: gate.cleaned });
    }
  } else {
    console.error('[nexus-chat] empty fullText after stream');
  }

  nexusSseEngine(res, {
    lane,
    lensSignals,
    trustStage,
    openingVector,
    gateFailures,
    model: lastModel,
    usage,
  });
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
