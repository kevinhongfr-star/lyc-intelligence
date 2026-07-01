/**
 * Email & WeChat Integration Handler — DEX AI Technical Blueprint 09
 *
 * Email endpoints:
 *   POST /api/email/send                    — Send email (E-3)
 *   GET  /api/email/threads                 — List threads (E-4)
 *   GET  /api/email/threads/:id             — Thread detail (E-5)
 *
 * WeChat endpoints:
 *   POST /api/wechat/log                    — Log interaction (E-7)
 *   GET  /api/wechat/interactions           — List interactions (E-8)
 *
 * Channel endpoints:
 *   GET  /api/channels/status               — Connected accounts (E-14)
 *   POST /api/channels/disconnect           — Disconnect account (E-13)
 *
 * Template endpoints:
 *   GET  /api/email/templates               — List templates (E-11)
 *   POST /api/email/templates               — Create template (E-10)
 *   POST /api/email/templates/:id/render    — Render template (E-12)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 30;

// ── Template Rendering ─────────────────────────────────────────────────
function renderTemplate(
  template: { subject_template: string; body_template: string },
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject_template;
  let body = template.body_template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    subject = subject.replace(placeholder, value);
    body = body.replace(placeholder, value);
  }

  return { subject, body };
}

// ── WeChat Outcome Mapper ─────────────────────────────────────────────
function mapWechatOutcome(outcome: string): string {
  switch (outcome) {
    case 'positive': return 'positive_response';
    case 'negative': return 'no_response';
    case 'follow_up_needed': return 'follow_up';
    case 'scheduled': return 'meeting_scheduled';
    default: return 'follow_up';
  }
}

// ── Email Handler ──────────────────────────────────────────────────────
export async function handleEmail(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // send | threads | templates
    const id = pathArr[1];
    const subResource = pathArr[2];

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    // E-3: POST /api/email/send
    if (resource === 'send' && req.method === 'POST') {
      return handleSendEmail(req, res, user.id);
    }

    // E-4: GET /api/email/threads
    if (resource === 'threads' && req.method === 'GET' && !id) {
      return handleListThreads(req, res, user.id);
    }

    // E-5: GET /api/email/threads/:id
    if (resource === 'threads' && id && req.method === 'GET') {
      return handleGetThread(req, res, id, user.id);
    }

    // E-11: GET /api/email/templates
    if (resource === 'templates' && req.method === 'GET' && !id) {
      return handleListTemplates(req, res, user.id);
    }

    // E-10: POST /api/email/templates
    if (resource === 'templates' && req.method === 'POST' && !id) {
      return handleCreateTemplate(req, res, user.id);
    }

    // E-12: POST /api/email/templates/:id/render
    if (resource === 'templates' && id && subResource === 'render' && req.method === 'POST') {
      return handleRenderTemplate(req, res, id);
    }

    return res.status(404).json({ success: false, error: 'Email route not found' });
  } catch (err) {
    return handleError(res, 'email', err);
  }
}

async function handleSendEmail(req: VercelRequest, res: VercelResponse, userId: string) {
  const { contact_id, to, subject, body_html, cc, attachments } = req.body || {};

  if (!to || !subject || !body_html) {
    return res.status(400).json({ success: false, error: 'to, subject, body_html are required' });
  }

  // Get user's Outlook account
  const accounts = await selectMany('channel_accounts', {
    user_id: userId,
    channel: 'outlook',
    is_active: true,
  }, [], 1, 0, '*');

  const account = accounts[0];

  if (account && account.access_token_enc) {
    try {
      // Attempt to send via Graph API
      const accessToken = account.access_token_enc;
      const message: any = {
        subject,
        body: { contentType: 'HTML', content: body_html },
        toRecipients: [{ emailAddress: { address: to } }],
      };

      if (cc?.length) {
        message.ccRecipients = cc.map((c: string) => ({ emailAddress: { address: c } }));
      }

      if (attachments?.length) {
        message.attachments = attachments.map((a: any) => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: a.name,
          contentBytes: a.content_base64,
        }));
      }

      const graphRes = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, saveToSentItems: true }),
      });

      if (!graphRes.ok && graphRes.status !== 401) {
        const errText = await graphRes.text();
        console.error('Graph API send error:', graphRes.status, errText);
      }
    } catch (e) {
      console.error('Graph API send failed:', e);
    }
  }

  // Always create local thread + message records
  const contact = contact_id
    ? await selectOne('contacts', { column: 'id', value: contact_id, select: '*' }, 5000)
    : null;

  const thread = await insert('email_threads', {
    contact_id: contact_id || null,
    owner_id: userId,
    subject,
    from_address: account?.account_email || 'kevin.hong@lyc-partners.ai',
    to_addresses: JSON.stringify([to]),
    cc_addresses: cc ? JSON.stringify(cc) : null,
    status: 'sent',
    is_linked_to_candidate: !!contact_id,
    linked_at: contact_id ? new Date().toISOString() : null,
    linked_by: contact_id ? userId : null,
    last_message_at: new Date().toISOString(),
    message_count: 1,
  });

  const preview = body_html.substring(0, 255).replace(/<[^>]*>/g, '');

  const msg = await insert('email_messages', {
    thread_id: thread.id,
    from_address: account?.account_email || 'kevin.hong@lyc-partners.ai',
    to_addresses: JSON.stringify([to]),
    cc_addresses: cc ? JSON.stringify(cc) : null,
    subject,
    body_html,
    body_preview: preview,
    direction: 'outbound',
    sent_at: new Date().toISOString(),
    has_attachments: !!attachments?.length,
    attachment_count: attachments?.length || 0,
    is_processed: true,
    processed_at: new Date().toISOString(),
  });

  // Create outreach log if contact
  let outreachLog = null;
  if (contact_id) {
    outreachLog = await insert('candidate_outreach_log', {
      contact_id,
      created_by: userId,
      interaction_type: 'email',
      summary: `Email sent to ${to}: ${subject}`,
      outcome: 'follow_up',
    });

    await update('email_messages', msg.id, { outreach_log_id: outreachLog.id });

    // Create signal
    try {
      await insert('signals', {
        contact_id,
        type: 'outreach',
        source: 'outlook',
        payload: JSON.stringify({ channel: 'email', direction: 'outbound', subject }),
        created_by: userId,
      });
    } catch (e) {
      console.error('Signal creation failed:', e);
    }

    // Advance pipeline S2→S3 if first outreach
    if (contact && contact.pipeline_stage === 'S2_Screened') {
      await update('contacts', contact_id, {
        pipeline_stage: 'S3_Contacted',
        last_contacted: new Date().toISOString(),
        stage_changed_by: userId,
      });
    }
  }

  return res.json({
    success: true,
    thread_id: thread.id,
    message_id: msg.id,
    status: 'sent',
    outreach_log_id: outreachLog?.id,
  });
}

async function handleListThreads(req: VercelRequest, res: VercelResponse, userId: string) {
  const { contact_id, page = '1', limit = '20' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters: Record<string, any> = { owner_id: userId };
  if (contact_id) filters.contact_id = contact_id;

  const threads = await selectMany(
    'email_threads',
    filters,
    ['last_message_at DESC'],
    limitNum,
    offset,
    '*'
  );

  return res.json({ success: true, threads });
}

async function handleGetThread(req: VercelRequest, res: VercelResponse, threadId: string, userId: string) {
  const thread = await selectOne('email_threads', { column: 'id', value: threadId, select: '*' }, 5000);
  if (!thread) return res.status(404).json({ success: false, error: 'Thread not found' });

  if (thread.owner_id !== userId) {
    const role = await getUserRole(userId);
    if (role !== 'admin' && role !== 'team_lead') {
      return res.status(403).json({ success: false, error: 'Not your thread' });
    }
  }

  const messages = await selectMany('email_messages', { thread_id: threadId }, ['sent_at ASC'], 50, 0, '*');

  return res.json({ success: true, thread, messages });
}

async function handleListTemplates(req: VercelRequest, res: VercelResponse, userId: string) {
  const { category } = req.query as Record<string, string>;

  const filters: Record<string, any> = {};
  if (category) filters.category = category;

  const templates = await selectMany('email_templates', filters, ['created_at DESC'], 100, 0, '*');

  // Filter by RLS: own + shared
  const filtered = templates.filter((t: any) =>
    t.created_by === userId || t.is_shared
  );

  return res.json({ success: true, templates: filtered });
}

async function handleCreateTemplate(req: VercelRequest, res: VercelResponse, userId: string) {
  const { name, subject_template, body_template, variables, category, is_shared } = req.body || {};

  if (!name || !subject_template || !body_template) {
    return res.status(400).json({ success: false, error: 'name, subject_template, body_template are required' });
  }

  const template = await insert('email_templates', {
    created_by: userId,
    name,
    subject_template,
    body_template,
    variables: variables ? JSON.stringify(variables) : JSON.stringify([]),
    category: category || 'general',
    is_shared: is_shared || false,
  });

  return res.json({ success: true, template });
}

async function handleRenderTemplate(req: VercelRequest, res: VercelResponse, templateId: string) {
  const template = await selectOne('email_templates', { column: 'id', value: templateId, select: '*' }, 5000);
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

  const { variables = {} } = req.body || {};

  const rendered = renderTemplate(template, variables);

  return res.json({ success: true, rendered });
}

// ── WeChat Handler ─────────────────────────────────────────────────────
export async function handleWechat(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // log | interactions

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    // E-7: POST /api/wechat/log
    if (resource === 'log' && req.method === 'POST') {
      return handleLogWechatInteraction(req, res, user.id);
    }

    // E-8: GET /api/wechat/interactions
    if (resource === 'interactions' && req.method === 'GET') {
      return handleListWechatInteractions(req, res);
    }

    return res.status(404).json({ success: false, error: 'WeChat route not found' });
  } catch (err) {
    return handleError(res, 'wechat', err);
  }
}

async function handleLogWechatInteraction(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    contact_id,
    interaction_type,
    summary,
    content,
    wechat_id,
    outcome,
    occurred_at,
    triggers_stage_change,
    suggested_stage,
    media_url,
  } = req.body || {};

  if (!contact_id || !interaction_type || !summary) {
    return res.status(400).json({ success: false, error: 'contact_id, interaction_type, summary are required' });
  }

  const contact = await selectOne('contacts', { column: 'id', value: contact_id, select: '*' }, 5000);
  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });

  // Create WeChat interaction
  const interaction = await insert('wechat_interactions', {
    contact_id,
    logged_by: userId,
    interaction_type,
    summary,
    content,
    wechat_id,
    outcome,
    occurred_at: occurred_at || new Date().toISOString(),
    triggers_stage_change: triggers_stage_change || false,
    suggested_stage,
    media_url,
    has_media: !!media_url,
  });

  // Create outreach log
  const outreach = await insert('candidate_outreach_log', {
    contact_id,
    created_by: userId,
    interaction_type: 'wechat',
    summary,
    outcome: mapWechatOutcome(outcome || 'neutral'),
  });

  await update('wechat_interactions', interaction.id, { outreach_log_id: outreach.id });

  // Create signal
  let signalId: string | undefined;
  try {
    const signal = await insert('signals', {
      contact_id,
      type: 'outreach',
      source: 'wechat',
      payload: JSON.stringify({ interaction_type, outcome, summary }),
      created_by: userId,
    });
    signalId = signal.id;
    await update('wechat_interactions', interaction.id, { signal_id: signal.id });
  } catch (e) {
    console.error('Signal creation failed:', e);
  }

  // Pipeline stage change if requested
  let pipelineChanged = false;
  let newStage: string | undefined;
  if (triggers_stage_change && suggested_stage) {
    await update('contacts', contact_id, {
      pipeline_stage: suggested_stage,
      stage_changed_by: userId,
      last_contacted: new Date().toISOString(),
    });
    pipelineChanged = true;
    newStage = suggested_stage;
  }

  // Update contact_channel if WeChat confirmed
  if (['message_sent', 'message_received', 'friend_request_accepted'].includes(interaction_type)) {
    try {
      await update('contacts', contact_id, { contact_channel: 'WECHAT' });
    } catch (e) { /* column may not exist yet */ }
  }

  return res.json({
    success: true,
    id: interaction.id,
    outreach_log_id: outreach.id,
    signal_id: signalId,
    pipeline_changed: pipelineChanged,
    new_stage: newStage,
  });
}

async function handleListWechatInteractions(req: VercelRequest, res: VercelResponse) {
  const { contact_id, page = '1', limit = '20' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters: Record<string, any> = {};
  if (contact_id) filters.contact_id = contact_id;

  const interactions = await selectMany(
    'wechat_interactions',
    filters,
    ['occurred_at DESC'],
    limitNum,
    offset,
    '*'
  );

  return res.json({ success: true, interactions });
}

// ── Channel Handler ────────────────────────────────────────────────────
export async function handleChannels(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // status | disconnect

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    // E-14: GET /api/channels/status
    if (resource === 'status' && req.method === 'GET') {
      return handleChannelStatus(req, res, user.id);
    }

    // E-13: POST /api/channels/disconnect
    if (resource === 'disconnect' && req.method === 'POST') {
      return handleDisconnectChannel(req, res, user.id);
    }

    return res.status(404).json({ success: false, error: 'Channel route not found' });
  } catch (err) {
    return handleError(res, 'channels', err);
  }
}

async function handleChannelStatus(req: VercelRequest, res: VercelResponse, userId: string) {
  const accounts = await selectMany('channel_accounts', { user_id: userId }, [], 10, 0, '*');

  // Strip token data from response
  const safeAccounts = accounts.map((a: any) => ({
    id: a.id,
    channel: a.channel,
    account_email: a.account_email,
    account_name: a.account_name,
    is_active: a.is_active,
    sync_status: a.sync_status,
    last_sync_at: a.last_sync_at,
    error_message: a.error_message,
    created_at: a.created_at,
  }));

  return res.json({ success: true, accounts: safeAccounts });
}

async function handleDisconnectChannel(req: VercelRequest, res: VercelResponse, userId: string) {
  const { account_id } = req.body || {};

  if (!account_id) {
    return res.status(400).json({ success: false, error: 'account_id is required' });
  }

  const account = await selectOne('channel_accounts', { column: 'id', value: account_id, select: '*' }, 5000);
  if (!account) return res.status(404).json({ success: false, error: 'Account not found' });
  if (account.user_id !== userId) return res.status(403).json({ success: false, error: 'Not your account' });

  await remove('channel_accounts', account_id);

  return res.json({ success: true });
}

// ── Communications Timeline Handler ────────────────────────────────────
export async function handleCommunications(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const { id } = req.query as Record<string, string>;
    if (!id) return res.status(400).json({ success: false, error: 'contact id required' });

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    // Parallel fetch from all channels
    const [outreach, threads, wechat] = await Promise.all([
      selectMany('candidate_outreach_log', { contact_id: id }, ['created_at DESC'], 100, 0, '*'),
      selectMany('email_threads', { contact_id: id }, ['last_message_at DESC'], 50, 0, '*'),
      selectMany('wechat_interactions', { contact_id: id }, ['occurred_at DESC'], 100, 0, '*'),
    ]);

    // Get email messages for threads
    const emailMessages: any[] = [];
    for (const thread of threads) {
      const msgs = await selectMany('email_messages', { thread_id: thread.id }, ['sent_at DESC'], 10, 0, '*');
      emailMessages.push(...msgs);
    }

    // Merge into unified timeline
    const timeline: any[] = [];

    for (const o of outreach) {
      if (o.interaction_type === 'email' || o.interaction_type === 'wechat') continue;
      timeline.push({
        type: 'outreach',
        channel: o.interaction_type,
        timestamp: o.created_at,
        summary: o.summary,
        outcome: o.outcome,
        id: o.id,
      });
    }

    for (const msg of emailMessages) {
      const thread = threads.find((t: any) => t.id === msg.thread_id);
      timeline.push({
        type: 'email',
        channel: 'email',
        timestamp: msg.sent_at,
        direction: msg.direction,
        subject: msg.subject,
        preview: msg.body_preview,
        has_attachments: msg.has_attachments,
        thread_id: msg.thread_id,
        thread_subject: thread?.subject,
        id: msg.id,
      });
    }

    for (const w of wechat) {
      timeline.push({
        type: 'wechat',
        channel: 'wechat',
        timestamp: w.occurred_at,
        interaction_type: w.interaction_type,
        summary: w.summary,
        outcome: w.outcome,
        has_media: w.has_media,
        id: w.id,
      });
    }

    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const emailCount = emailMessages.length;
    const wechatCount = wechat.length;
    const otherCount = timeline.filter(t => t.type === 'outreach').length;

    return res.json({
      success: true,
      contact_id: id,
      total_interactions: timeline.length,
      channels: {
        email: emailCount,
        wechat: wechatCount,
        other: otherCount,
      },
      timeline,
    });
  } catch (err) {
    return handleError(res, 'communications', err);
  }
}
