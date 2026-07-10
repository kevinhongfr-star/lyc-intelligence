import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isSupabaseConfigured, insert, update, selectOne, selectMany } from './supabaseRest.js';

function verifyFeishuSignature(req: VercelRequest): boolean {
  const signature = req.headers['x-tt-signature'] as string;
  const timestamp = req.headers['x-tt-timestamp'] as string;
  const appSecret = process.env.FEISHU_APP_SECRET || '';

  if (!signature || !timestamp || !appSecret) {
    return false;
  }

  try {
    const crypto = require('crypto');
    const stringToSign = `${timestamp}\n${JSON.stringify(req.body)}`;
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(stringToSign)
      .digest('base64');
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

async function handleFeishuTracker(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const event = req.body?.event || {};
    const spreadsheetToken = event.spreadsheet_token;
    const changes = event.changes || [];

    for (const change of changes) {
      const { row, column, value, prev_value } = change;

      if (column === 'A' && value) {
        const mandate = await selectOne('mandates', { position_title: value });
        if (mandate) {
          await update('mandates', mandate.id, { updated_at: new Date().toISOString() });
        }
      }

      if (column === 'B' && value) {
        const org = await selectOne('organizations', { name: value });
        if (!org) {
          await insert('organizations', { name: value, status: 'prospect' });
        }
      }

      if (column === 'C' && value) {
        const candidate = await selectOne('candidates', { email: value });
        if (!candidate) {
          await insert('candidates', { first_name: value.split(' ')[0], last_name: value.split(' ')[1] || '', email: value });
        }
      }
    }

    return res.status(200).json({ success: true, processed: changes.length });
  } catch (err: any) {
    console.error('[Feishu Tracker] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleFeishuChat(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const event = req.body?.event || {};
    const message = event.message || {};
    const content = JSON.parse(message.content || '{}');
    const text = content.text || '';
    const senderId = event.sender?.sender_id?.user_id;

    const mentions: { id: string; key: string }[] = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({ id: match[1], key: match[0] });
    }

    const entityType = text.includes('[mandate]') ? 'mandate' : 
                       text.includes('[candidate]') ? 'candidate' :
                       text.includes('[organization]') ? 'organization' : 'system';

    let entityId: string | null = null;
    const idMatch = text.match(/\[id:(\w+-\w+-\w+-\w+-\w+)\]/);
    if (idMatch) {
      entityId = idMatch[1];
    }

    let action = 'note_added';
    if (text.includes('interview')) action = 'interview_scheduled';
    else if (text.includes('offer')) action = 'offer_extended';
    else if (text.includes('feedback')) action = 'feedback_received';
    else if (text.includes('call')) action = 'call_logged';
    else if (text.includes('meeting')) action = 'meeting_held';

    await insert('activity_logs', {
      entity_type: entityType,
      entity_id: entityId || 'unknown',
      action,
      actor_id: senderId,
      metadata: {
        message: text,
        mentions,
        chat_id: event.chat?.chat_id,
        message_id: message.message_id,
      },
    });

    return res.status(200).json({ success: true, action, entityType, entityId });
  } catch (err: any) {
    console.error('[Feishu Chat] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleFeishuCalendar(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const event = req.body?.event || {};
    const calendarEvent = event.calendar || {};
    const title = calendarEvent.summary || '';
    const startTime = calendarEvent.start?.date_time;
    const endTime = calendarEvent.end?.date_time;
    const attendees = calendarEvent.attendees || [];
    const description = calendarEvent.description || '';

    if (title.toLowerCase().includes('interview')) {
      const mandateMatch = description.match(/\[mandate:(\w+-\w+-\w+-\w+-\w+)\]/);
      const candidateMatch = description.match(/\[candidate:(\w+-\w+-\w+-\w+-\w+)\]/);

      if (mandateMatch && candidateMatch) {
        const mandateId = mandateMatch[1];
        const candidateId = candidateMatch[1];

        const mandateCandidate = await selectOne('mandate_candidates', {
          mandate_id: mandateId,
          candidate_id: candidateId,
        });

        if (mandateCandidate) {
          await update('mandate_candidates', mandateCandidate.id, {
            stage: 'first_interview',
            interview_date: startTime,
            last_activity_date: new Date().toISOString().split('T')[0],
          });
        }

        await insert('activity_logs', {
          entity_type: 'mandate_candidate',
          entity_id: mandateCandidate?.id || 'unknown',
          action: 'interview_scheduled',
          metadata: {
            title,
            startTime,
            endTime,
            attendees: attendees.map((a: any) => a.email),
            description,
          },
        });
      }
    }

    return res.status(200).json({ success: true, event: title });
  } catch (err: any) {
    console.error('[Feishu Calendar] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyFeishuSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const path = (req.query as any).path || [];
  const syncType = path[0];

  switch (syncType) {
    case 'tracker':
      return handleFeishuTracker(req, res);
    case 'chat':
      return handleFeishuChat(req, res);
    case 'calendar':
      return handleFeishuCalendar(req, res);
    default:
      return res.status(404).json({ error: `Unknown sync type: ${syncType}` });
  }
}