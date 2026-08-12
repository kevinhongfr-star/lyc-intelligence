/**
 * services/emailDelivery.ts — #114 SendCloud adapter + #116 delivery log.
 *
 * #114 requirements (provider-abstracted interface):
 *   • EMAIL_PROVIDER env var = 'sendcloud' | 'console' (default)
 *   • SendCloud auth env vars: SENDCLOUD_API_USER, SENDCLOUD_API_KEY
 *   • If SendCloud is not configured → console fallback (log everything to
 *     stdout). No provider config must never block the pipeline.
 *   • #116 delivery tracking: every send attempt writes one row to
 *     email_delivery_log (append-only) via a Supabase row writer.
 *
 * SendCloud API we use (simplest):
 *   POST https://api.sendcloud.net/apiv2/mail/send
 *   form-encoded body with:
 *     apiUser, apiKey, from, fromName, to, subject, html, replyTo, labelId
 *   Returns { statusCode: 200, result: { id: "<message_id>" }, ... }
 *   See https://www.sendcloud.com/dev-center/mail-api-v2/
 *
 * Consumers first run runEmailPipeline(emailEngine.ts) to get a validated
 * email body, then pass it through sendEmail().
 */

import { createHash } from 'crypto';
import type { ValidatedEmail, EmailKind, RunPipelineResult } from './emailEngine';

export type EmailProvider = 'sendcloud' | 'console';

export interface EmailSendRequest {
  pipeline: RunPipelineResult;
  validated: ValidatedEmail;
  template_code: EmailKind;
  tenant_user_id?: string;
  /** Miles debited (0 for console). */
  miles_debited?: 0 | 1;
  tier_at_send?: string;
  /** Attachments: filename + content bytes (or b64). */
  attachments?: Array<{ filename: string; content: Buffer | string; content_type?: string }>;
  /** Delivery log writer (Supabase insert or in-memory test adapter). */
  deliveryLogWriter: {
    append: (row: DeliveryLogRow) => Promise<{ delivery_id: string }>;
  };
  /** Override env-driven provider selection. */
  providerOverride?: EmailProvider;
  /** Date provider — defaults to new Date() */
  now?: () => Date;
}

export interface DeliveryLogRow {
  tenant_user_id?: string;
  template_code: EmailKind;
  from_name: string;
  reply_to?: string;
  to_addresses: string[];
  subject: string;
  preheader?: string;
  html_body_digest?: string;
  has_attachment: boolean;
  provider: EmailProvider;
  provider_message_id?: string;
  status: 'queued' | 'sent' | 'delivered' | 'soft_bounce' | 'hard_bounce' | 'complaint' | 'failed' | 'skipped';
  error_detail?: string;
  miles_debited: number;
  tier_at_send?: string;
  brand_pass: boolean;
  scheduled_at?: Date;
  sent_at?: Date;
}

export interface SendEmailResult {
  delivery_id: string;
  provider: EmailProvider;
  status: DeliveryLogRow['status'];
  provider_message_id?: string;
  error_detail?: string;
  console_preview_url_console_only?: string;
}

/* ── Config helpers ──────────────────────────────────────────────── */

function readEnv<T extends string = string>(k: string, fallback?: T): T | undefined {
  // Access both node process.env and Vite's import.meta.env.
  const nodeEnv = (globalThis as any).process?.env?.[k];
  const viteEnv = (globalThis as any).import_meta_env?.[k] ?? (globalThis as any).__env__?.[k];
  const v = nodeEnv ?? viteEnv;
  if (v === undefined || v === null || v === '') return fallback;
  return v as T;
}

export function resolveEmailProvider(override?: EmailProvider): EmailProvider {
  if (override) return override;
  const p = readEnv('EMAIL_PROVIDER', 'console');
  return p === 'sendcloud' ? 'sendcloud' : 'console';
}

export interface SendCloudCredentials {
  apiUser: string;
  apiKey: string;
}
export function getSendCloudCredentialsOrNull(): SendCloudCredentials | null {
  const apiUser = readEnv('SENDCLOUD_API_USER');
  const apiKey  = readEnv('SENDCLOUD_API_KEY');
  if (!apiUser || !apiKey) return null;
  return { apiUser, apiKey };
}

/* ── Digest (for audit dedupe) ───────────────────────────────────── */

export function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/* ── SendCloud HTTP call ─────────────────────────────────────────── */

const SENDCLOUD_ENDPOINT = 'https://api.sendcloud.net/apiv2/mail/send';

async function sendViaSendCloud(
  credentials: SendCloudCredentials,
  email: ValidatedEmail,
  attachments: EmailSendRequest['attachments'],
): Promise<{ ok: true; message_id: string } | { ok: false; error: string }> {
  const fd = new FormData();
  fd.append('apiUser', credentials.apiUser);
  fd.append('apiKey', credentials.apiKey);
  fd.append('from', 'no-reply@lyc.partners');
  fd.append('fromName', email.from_name);
  fd.append('to', email.to.join(';'));
  fd.append('subject', email.subject);
  fd.append('html', email.html_body);
  if (email.reply_to) fd.append('replyTo', email.reply_to);
  if (email.plain_body) fd.append('plain', email.plain_body);
  if (attachments) {
    for (const a of attachments) {
      const blob = typeof a.content === 'string'
        ? Buffer.from(a.content, 'base64')
        : a.content;
      fd.append(
        'attachments',
        new Blob([blob], { type: a.content_type ?? 'application/octet-stream' }),
        a.filename,
      );
    }
  }

  let raw: Response;
  try {
    raw = await fetch(SENDCLOUD_ENDPOINT, { method: 'POST', body: fd });
  } catch (e) {
    return { ok: false, error: `fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  let json: any = null;
  try { json = await raw.json(); } catch { /* ignore */ }
  if (raw.status !== 200 || json?.statusCode !== 200) {
    return {
      ok: false,
      error: `SendCloud HTTP ${raw.status}: ${JSON.stringify(json ?? raw.statusText).slice(0, 200)}`,
    };
  }
  const message_id: string = String(json?.result?.id ?? `sc-${Date.now()}`);
  return { ok: true, message_id };
}

/* ── Entry point ─────────────────────────────────────────────────── */

export async function sendEmail(req: EmailSendRequest): Promise<SendEmailResult> {
  const now = req.now ?? (() => new Date());
  const provider = resolveEmailProvider(req.providerOverride);
  const validated = req.validated;

  // Pipeline-OK check — structural hard failures → SKIP
  if (!validated.ok) {
    const row: DeliveryLogRow = {
      tenant_user_id: req.tenant_user_id,
      template_code: req.template_code,
      from_name: validated.from_name,
      reply_to: validated.reply_to,
      to_addresses: validated.to,
      subject: validated.subject,
      html_body_digest: validated.html_body ? sha256Hex(validated.html_body) : undefined,
      has_attachment: Array.isArray(req.attachments) && req.attachments.length > 0,
      provider,
      status: 'skipped',
      error_detail: validated.issues.find((i) => i.severity === 'error')?.message,
      miles_debited: 0,
      tier_at_send: req.tier_at_send,
      brand_pass: req.pipeline.validated.issues.every((i) => i.code !== 'BRAND_BANNED_WORD'),
      scheduled_at: now(),
    };
    const { delivery_id } = await req.deliveryLogWriter.append(row);
    return { delivery_id, provider, status: 'skipped', error_detail: row.error_detail };
  }

  // #116: pre-send queued row (so that async failures are still tracked)
  const queued = await req.deliveryLogWriter.append({
    tenant_user_id: req.tenant_user_id,
    template_code: req.template_code,
    from_name: validated.from_name,
    reply_to: validated.reply_to,
    to_addresses: validated.to,
    subject: validated.subject,
    preheader: req.pipeline.validated.subject ? undefined : undefined,
    html_body_digest: validated.html_body ? sha256Hex(validated.html_body) : undefined,
    has_attachment: Array.isArray(req.attachments) && req.attachments.length > 0,
    provider,
    status: 'queued',
    miles_debited: req.miles_debited ?? (provider === 'console' ? 0 : 1),
    tier_at_send: req.tier_at_send,
    brand_pass: !req.pipeline.brand_issues.some((i) => i.severity === 'error'),
    scheduled_at: now(),
  });

  // Dispatch
  let status: DeliveryLogRow['status'] = 'queued';
  let provider_message_id: string | undefined;
  let error_detail: string | undefined;
  let console_href: string | undefined;

  if (provider === 'sendcloud') {
    const creds = getSendCloudCredentialsOrNull();
    if (!creds) {
      status = 'failed';
      error_detail = 'EMAIL_PROVIDER=sendcloud but SENDCLOUD_API_USER/SENDCLOUD_API_KEY not set.';
    } else {
      const r = await sendViaSendCloud(creds, validated, req.attachments);
      if (r.ok) {
        status = 'sent';
        provider_message_id = r.message_id;
      } else {
        status = 'failed';
        error_detail = r.error;
      }
    }
  } else {
    // Console fallback: print to stdout. Not spam — only one line per send.
    const preview = `[email-console-fallback] ${req.template_code} → ${validated.to.join(',')}  subject="${validated.subject.slice(0, 80)}"`;
    console.log(preview);
    status = 'sent';
    provider_message_id = `console-${Date.now().toString(36)}`;
    console_href = preview;
  }

  // #116: finalize log row
  await req.deliveryLogWriter.append({
    tenant_user_id: req.tenant_user_id,
    template_code: req.template_code,
    from_name: validated.from_name,
    reply_to: validated.reply_to,
    to_addresses: validated.to,
    subject: validated.subject,
    html_body_digest: validated.html_body ? sha256Hex(validated.html_body) : undefined,
    has_attachment: Array.isArray(req.attachments) && req.attachments.length > 0,
    provider,
    provider_message_id,
    status,
    error_detail,
    miles_debited: req.miles_debited ?? (provider === 'console' ? 0 : 1),
    tier_at_send: req.tier_at_send,
    brand_pass: !req.pipeline.brand_issues.some((i) => i.severity === 'error'),
    sent_at: status === 'sent' ? now() : undefined,
  });

  return {
    delivery_id: queued.delivery_id,
    provider,
    status,
    provider_message_id,
    error_detail,
    console_preview_url_console_only: console_href,
  };
}

export default sendEmail;
