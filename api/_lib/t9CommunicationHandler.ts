import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Client Communication Profiles ─── */
async function handleClientComms(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const clientId = path[1];

  try {
    if (req.method === 'GET') {
      if (clientId) {
        const profile = await selectOne('client_comm_profiles', { where: [{ column: 'client_org_id', value: clientId }] });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        return res.status(200).json({ success: true, profile });
      }
      const profiles = await selectMany('client_comm_profiles', {}, 50);
      return res.status(200).json({ success: true, profiles });
    }

    if (req.method === 'POST') {
      const profile = await insert('client_comm_profiles', {
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return res.status(201).json({ success: true, profile });
    }

    if (req.method === 'PATCH' && clientId) {
      const existing = await selectOne('client_comm_profiles', { where: [{ column: 'client_org_id', value: clientId }] });
      if (!existing) return res.status(404).json({ error: 'Profile not found' });
      await update('client_comm_profiles', existing.id, { ...req.body, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[ClientComms] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Draft Generation ─── */
async function handleDrafts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'POST' && action === 'generate') {
      const { type, mandate_id, recipient_id, content_type, data_points } = req.body;

      const draft = await insert('communication_records', {
        mandate_id,
        type: type || 'client_email',
        direction: 'outbound',
        channel: 'email',
        subject: generateSubject(content_type, data_points),
        body_text: generateDraftBody(content_type, data_points),
        language: 'en',
        status: 'pending_review',
        actor: 'agent',
        review_status: 'pending',
        created_at: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        draft_id: draft.id,
        subject: draft.subject,
        body: draft.body_text,
        language: draft.language,
        confidence_score: 0.85,
      });
    }

    if (req.method === 'GET' && action) {
      const draft = await selectOne('communication_records', { where: [{ column: 'id', value: action }] });
      if (!draft) return res.status(404).json({ error: 'Draft not found' });
      return res.status(200).json({ success: true, draft });
    }

    if (req.method === 'PATCH' && action) {
      await update('communication_records', action, { ...req.body, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST' && action) {
      const subAction = path[2];
      if (subAction === 'approve') {
        await update('communication_records', action, { status: 'approved', review_status: 'approved_by_kevin' });
        return res.status(200).json({ success: true });
      }
      if (subAction === 'send') {
        await update('communication_records', action, {
          status: 'sent',
          timestamp_sent: new Date().toISOString(),
          actor: 'user',
        });
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Drafts] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateSubject(contentType: string, dataPoints: any): string {
  if (contentType === 'client_update') return `Update: ${dataPoints?.position_title || 'Mandate'}`;
  if (contentType === 'candidate_outreach') return `Opportunity: ${dataPoints?.role_type || 'Role'}`;
  return 'Communication from LYC Partners';
}

function generateDraftBody(contentType: string, dataPoints: any): string {
  if (contentType === 'client_update') {
    return `Dear ${dataPoints?.contact_name || 'Client'},

Please find below the latest update on the ${dataPoints?.position_title || 'search'}.

Candidates in pipeline: ${dataPoints?.pipeline_count || 0}
Interviews scheduled: ${dataPoints?.interview_count || 0}

Best regards,
LYC Partners`;
  }
  return 'Draft communication generated by AI agent.';
}

/* ─── Outreach Sequences ─── */
async function handleOutreach(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'POST' && action === 'sequence' && path[2] === 'create') {
      const { mandate_id, candidate_ids, template_chain } = req.body;
      const sequences = [];
      for (const candidateId of candidate_ids) {
        const seq = await insert('outreach_sequences', {
          mandate_id,
          candidate_id: candidateId,
          template_chain: template_chain || ['connection_request', 'first_message', 'follow_up_1'],
          current_stage: 'connection_request',
          overall_status: 'in_progress',
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        });
        sequences.push(seq);
      }
      return res.status(201).json({ success: true, sequences_created: sequences.length, sequences });
    }

    if (req.method === 'GET' && action === 'sequences') {
      const mandateId = req.query.mandate_id as string;
      const status = req.query.status as string;
      const where: any[] = [];
      if (mandateId) where.push({ column: 'mandate_id', value: mandateId });
      if (status) where.push({ column: 'overall_status', value: status });
      const sequences = await selectMany('outreach_sequences', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, sequences });
    }

    if (req.method === 'GET' && action && path[1] !== 'sequences') {
      const sequence = await selectOne('outreach_sequences', { where: [{ column: 'id', value: action }] });
      if (!sequence) return res.status(404).json({ error: 'Sequence not found' });
      return res.status(200).json({ success: true, sequence });
    }

    if (req.method === 'POST' && action) {
      const subAction = path[2];
      if (subAction === 'pause') {
        await update('outreach_sequences', action, { overall_status: 'paused', last_activity_at: new Date().toISOString() });
        return res.status(200).json({ success: true });
      }
      if (subAction === 'resume') {
        await update('outreach_sequences', action, { overall_status: 'in_progress', last_activity_at: new Date().toISOString() });
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Outreach] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Response Classification ─── */
const RESPONSE_CLASSIFICATIONS: Record<string, { signals: string[]; action: string }> = {
  interested: { signals: ['love to learn more', 'schedule a call', 'open to exploring', 'sounds interesting'], action: 'move_candidate_up_pipeline' },
  asking_questions: { signals: ['what is the comp', 'where is the role', 'can you share'], action: 'draft_response_with_info' },
  not_now: { signals: ['not at the moment', 'keep in touch', 'revisit in'], action: 'schedule_reengagement' },
  declined: { signals: ['not interested', 'happy where i am', 'please remove'], action: 'stop_sequences_blacklist' },
  referral: { signals: ['my colleague might be', 'let me introduce', 'think of'], action: 'capture_referral_add_pipeline' },
  hostile: { signals: ['stop contacting', 'report as spam', 'do not contact'], action: 'immediate_blacklist_all_projects' },
};

async function handleResponses(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'POST' && action === 'classify') {
      const { comm_id, reply_text } = req.body;
      const classification = classifyResponseText(reply_text);

      if (comm_id) {
        await update('communication_records', comm_id, {
          reply_classification: classification.classification,
          reply_text,
          status: 'replied',
          timestamp_replied: new Date().toISOString(),
        });
      }

      return res.status(200).json({ success: true, ...classification });
    }

    if (req.method === 'GET' && action === 'pending') {
      const mandateId = req.query.mandate_id as string;
      const where: any[] = [{ column: 'status', value: 'replied' }, { column: 'reply_classification', value: null, op: 'is' }];
      if (mandateId) where.push({ column: 'mandate_id', value: mandateId });
      const pending = await selectMany('communication_records', { where });
      return res.status(200).json({ success: true, pending });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Responses] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function classifyResponseText(replyText: string): { classification: string; confidence: number; suggested_action: string } {
  const text = (replyText || '').toLowerCase();
  let bestMatch = { classification: 'asking_questions', confidence: 0.3, suggested_action: 'draft_response_with_info' };

  for (const [cls, data] of Object.entries(RESPONSE_CLASSIFICATIONS)) {
    let matchCount = 0;
    for (const signal of data.signals) {
      if (text.includes(signal.toLowerCase())) matchCount++;
    }
    const confidence = Math.min(matchCount / Math.max(data.signals.length * 0.5, 1), 1.0);
    if (confidence > bestMatch.confidence) {
      bestMatch = { classification: cls, confidence: Math.round(confidence * 100) / 100, suggested_action: data.action };
    }
  }

  return bestMatch;
}

/* ─── Communication Analytics ─── */
async function handleCommsAnalytics(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'GET' && action === 'analytics') {
      const mandateId = req.query.mandate_id as string;
      const period = req.query.period as string || '30d';
      const where: any[] = [];
      if (mandateId) where.push({ column: 'mandate_id', value: mandateId });

      const records = await selectMany('communication_records', where.length > 0 ? { where } : {});
      const outreach = records.filter((r: any) => r.type === 'candidate_outreach');
      const client = records.filter((r: any) => r.type === 'client_email');

      return res.status(200).json({
        success: true,
        period,
        outreach: {
          total_sent: outreach.length,
          response_rate: outreach.length > 0 ? Math.round((outreach.filter((r: any) => r.status === 'replied').length / outreach.length) * 1000) / 1000 : 0,
          by_stage: countBy(outreach, 'status'),
          by_channel: countBy(outreach, 'channel'),
        },
        client: {
          total_sent: client.length,
          by_status: countBy(client, 'status'),
        },
      });
    }

    if (req.method === 'GET' && action === 'history') {
      const mandateId = req.query.mandate_id as string;
      const type = req.query.type as string;
      const channel = req.query.channel as string;
      const where: any[] = [];
      if (mandateId) where.push({ column: 'mandate_id', value: mandateId });
      if (type) where.push({ column: 'type', value: type });
      if (channel) where.push({ column: 'channel', value: channel });

      const history = await selectMany('communication_records', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, history });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[CommsAnalytics] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function countBy(arr: any[], key: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of arr) {
    const val = item[key] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'client-comms':
      return handleClientComms(req, res);
    case 'drafts':
      return handleDrafts(req, res);
    case 'outreach':
      return handleOutreach(req, res);
    case 'responses':
      return handleResponses(req, res);
    case 'comms':
      return handleCommsAnalytics(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v9/${resource}` });
  }
}