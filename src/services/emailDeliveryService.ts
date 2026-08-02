/**
 * T26 / T30 / E1-E3 · Email delivery pipeline service.
 * 
 * T26: Render email HTML via template registry.
 * T30: Schedule or on-demand send.
 * E1: SMTP / SendCloud relay.
 * E2: CRM write-back (event → contacts/mandates/org.
 * E3: Delivery tracking opens/clicks/bounces.
 */

import { authFetch } from '@/utils/authFetch';
import { TEMPLATE_REGISTRY, renderTemplate } from './templateRenderer';

export interface EmailPayload {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  templateCode: keyof typeof TEMPLATE_REGISTRY extends infer K ? K extends string ? K : string : string;
  variables: Record<string, unknown>;
  subject: string;
  brand?: 'LYC' | 'CO_BRANDED' | 'WHITE_LABEL';
  scheduleAt?: string; // ISO date for scheduled; undefined = immediate (T30
  audienceTag?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailSendResult {
  ok: boolean;
  jobId?: string;
  provider?: 'sendcloud' | 'smtp' | 'scheduled';
  scheduledFor?: string;
  warnings?: string[];
  accepted?: number;
  rejected?: string[];
}

const EMAIL_TEMPLATES = new Set(['D46', 'D47', 'D48', 'D49', 'D50', 'G9']);

export function validateEmailPayload(p: EmailPayload): string[] {
  const warnings: string[] = [];
  if (!p.to || (Array.isArray(p.to) && p.to.length === 0)) warnings.push('Missing recipient (to)');
  if (!p.subject) warnings.push('Missing subject');
  if (!EMAIL_TEMPLATES.has(p.templateCode as string)) warnings.push(`Template ${p.templateCode} not in email templates (D46-D50, G9)`);
  return warnings;
}

/**
 * T30: Send or schedule email via E1 provider (SendCloud or SMTP relay)
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const warnings = validateEmailPayload(payload);
  if (warnings.length) return { ok: false, warnings };

  // 1. render T26 render template HTML via registry
  let renderedHtml = '';
  try {
    const r = await renderTemplate({
      templateId: payload.templateCode as string,
      variables: payload.variables,
      brand: payload.brand || 'LYC',
      outputFormat: 'email',
    });
    renderedHtml = r.html;
    warnings.push(...r.meta.warnings.map(w => `[T26 render] ${w}`));
  } catch (e) {
    return { ok: false, warnings: [...warnings, `T26 render failed: ${(e as Error).message}`] };
  }

  const body = {
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    reply_to: payload.replyTo,
    subject: payload.subject,
    html: renderedHtml,
    template_code: payload.templateCode,
    schedule_at: payload.scheduleAt ?? null,
    audience_tag: payload.audienceTag,
    track_opens: payload.trackOpens ?? true,
    track_clicks: payload.trackClicks ?? true,
  };

  // 2. Send via E1 api/_lib/email.ts → /api/emails (edge
  try {
    const res = await authFetch('/api/emails', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Partial<EmailSendResult>;
    return {
      ok: true,
      warnings,
      jobId: data.jobId,
      provider: data.provider ?? 'sendcloud',
      scheduledFor: payload.scheduleAt,
      accepted: data.accepted ?? 1,
      rejected: data.rejected ?? [],
    };
  } catch (e) {
    return { ok: false, warnings: [...warnings, `E1 send failed: ${(e as Error).message}`] };
  }
}

/**
 * E3: delivery events (delivery tracking)
 */
export async function getDeliveryEvents(filters: { since?: string; template?: string } = {}): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (filters.since) params.set('since', filters.since);
    if (filters.template) params.set('template', filters.template);
    const res = await authFetch(`/api/emails/events?${params.toString()}`, { method: 'GET' });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

/**
 * E2: CRM write back email engagement (email opens/clicks) to CRM contacts/orgs)
 */
export async function writeBackCrm(payload: { event: string; email: string; metadata: Record<string, unknown> }): Promise<boolean> {
  try {
    const res = await authFetch('/api/emails/crm-writeback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * T30: scheduled (T30: cancel scheduled job
 */
export async function cancelScheduled(jobId: string): Promise<boolean> {
  try {
    const res = await authFetch(`/api/emails/${encodeURIComponent(jobId)}/cancel`, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

export default {
  sendEmail,
  getDeliveryEvents,
  writeBackCrm,
  cancelScheduled,
  EMAIL_TEMPLATES: Array.from(EMAIL_TEMPLATES),
};
