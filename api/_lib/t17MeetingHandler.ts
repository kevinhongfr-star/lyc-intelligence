import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Meeting Intelligence Parser ─── */
function parseMeetingTranscript(transcript: string, meetingType: string) {
  const text = transcript || '';

  // Extract action items (lines with action verbs)
  const actionItems: any[] = [];
  const actionPatterns = [
    /(?:action|todo|task|next step|follow.up|will|need to|should|must):?\s*(.+)/gi,
    /(\w+)\s+will\s+(.+)/gi,
    /let'?s\s+(.+)/gi,
  ];

  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const item = match[1] || match[0];
      if (item && item.length > 5 && item.length < 200) {
        actionItems.push({
          item: item.trim(),
          owner: extractOwner(item),
          due_date: estimateDueDate(item),
          priority: assessPriority(item),
          status: 'pending',
        });
      }
    }
  }

  // Extract key decisions
  const decisions: string[] = [];
  const decisionPatterns = [
    /(?:decided|agreed|confirmed|finalized):?\s*(.+)/gi,
    /we\s+(?:will|are going to)\s+(.+)/gi,
  ];
  for (const pattern of decisionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 5) {
        decisions.push(match[1].trim());
      }
    }
  }

  // Extract risk mentions
  const risks: any[] = [];
  const riskKeywords = ['risk', 'concern', 'issue', 'problem', 'challenge', 'blocker', 'delay', 'budget', 'timeline'];
  const sentences = text.split(/[.!?]+/);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    for (const kw of riskKeywords) {
      if (lower.includes(kw)) {
        risks.push({
          keyword: kw,
          context: sentence.trim().slice(0, 200),
          severity: kw === 'blocker' || kw === 'risk' ? 'high' : 'medium',
        });
        break;
      }
    }
  }

  // Sentiment analysis (simple keyword-based)
  const positiveWords = ['great', 'excellent', 'progress', 'success', 'happy', 'excited', 'achieved'];
  const negativeWords = ['concern', 'issue', 'problem', 'delay', 'risk', 'difficult', 'struggle'];
  let sentimentScore = 0;
  for (const w of positiveWords) if (text.toLowerCase().includes(w)) sentimentScore += 0.1;
  for (const w of negativeWords) if (text.toLowerCase().includes(w)) sentimentScore -= 0.1;
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

  // Generate summary
  const summary = generateMeetingSummary(text, meetingType, actionItems, decisions);

  return {
    summary,
    key_decisions: decisions.slice(0, 5),
    action_items: actionItems.slice(0, 10),
    risk_mentions: risks.slice(0, 5),
    sentiment_score: Math.round(sentimentScore * 100) / 100,
    participants: extractParticipants(text),
    duration_minutes: estimateDuration(text),
  };
}

function extractOwner(text: string): string {
  const ownerMatch = text.match(/(?:assigned to|owner|by)\s+(\w+)/i);
  return ownerMatch ? ownerMatch[1] : 'unassigned';
}

function estimateDueDate(text: string): string {
  const dateMatch = text.match(/(?:by|before|due)\s+(\d{1,2}[\/-]\d{1,2}|next\s+\w+|end\s+of\s+\w+)/i);
  return dateMatch ? dateMatch[1] : 'unspecified';
}

function assessPriority(text: string): string {
  const highPriority = ['urgent', 'critical', 'asap', 'immediately', 'blocker'];
  const lower = text.toLowerCase();
  for (const kw of highPriority) {
    if (lower.includes(kw)) return 'critical';
  }
  if (lower.includes('important') || lower.includes('priority')) return 'high';
  return 'normal';
}

function extractParticipants(text: string): string[] {
  const participants: string[] = [];
  const namePattern = /(?:^|\s)([A-Z][a-z]+)\s+(?:said|mentioned|asked|agreed|noted)/gm;
  let match;
  while ((match = namePattern.exec(text)) !== null) {
    if (!participants.includes(match[1])) participants.push(match[1]);
  }
  return participants.slice(0, 10);
}

function estimateDuration(text: string): number {
  // Rough estimate: ~150 words per minute in conversation
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 150);
}

function generateMeetingSummary(text: string, meetingType: string, actions: any[], decisions: string[]): string {
  const typeLabels: Record<string, string> = {
    client_call: 'Client Call',
    internal_sync: 'Internal Sync',
    interview_debrief: 'Interview Debrief',
    kick_off: 'Kick-off',
    check_in: 'Check-in',
    other: 'Meeting',
  };

  const lines: string[] = [];
  lines.push(`**${typeLabels[meetingType] || 'Meeting'} Summary**`);
  lines.push('');
  lines.push(`Total action items identified: ${actions.length}`);
  lines.push(`Key decisions made: ${decisions.length}`);
  lines.push('');
  if (decisions.length > 0) {
    lines.push('**Decisions:**');
    decisions.slice(0, 3).forEach(d => lines.push(`- ${d}`));
  }
  if (actions.length > 0) {
    lines.push('');
    lines.push('**Top Action Items:**');
    actions.slice(0, 3).forEach(a => lines.push(`- ${a.item}`));
  }

  return lines.join('\n');
}

/* ─── Meeting Notes → Actions ─── */
async function createTasksFromNotes(mandateId: string, notes: string, meetingType: string) {
  const parsed = parseMeetingTranscript(notes, meetingType);
  const tasks: any[] = [];

  for (const action of parsed.action_items) {
    const task = await insert('tasks', {
      mandate_id: mandateId,
      title: action.item.slice(0, 100),
      description: action.item,
      type: 'coordination',
      priority: action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : 'normal',
      status: 'pending',
      deadline: action.due_date !== 'unspecified' ? parseDueDate(action.due_date) : null,
      created_at: new Date().toISOString(),
    });
    tasks.push(task);
  }

  return {
    tasks_created: tasks.length,
    tasks,
    summary: parsed.summary,
  };
}

function parseDueDate(dueStr: string): string | null {
  try {
    if (dueStr.includes('next')) {
      const days = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };
      for (const [day, offset] of Object.entries(days)) {
        if (dueStr.toLowerCase().includes(day)) {
          const date = new Date();
          date.setDate(date.getDate() + ((7 - date.getDay() + offset) % 7 || 7));
          return date.toISOString();
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ─── Activity Timeline Generator ─── */
async function generateActivityTimeline(mandateId: string) {
  const [logs, tasks, communications, meetings] = await Promise.all([
    selectMany('activity_logs', { where: [{ column: 'mandate_id', value: mandateId }] }),
    selectMany('tasks', { where: [{ column: 'mandate_id', value: mandateId }] }),
    selectMany('communication_records', { where: [{ column: 'mandate_id', value: mandateId }] }),
    selectMany('meeting_intelligence', { where: [{ column: 'mandate_id', value: mandateId }] }),
  ]);

  const timeline: any[] = [];

  // Add activity logs
  for (const log of logs) {
    timeline.push({
      timestamp: log.created_at,
      type: 'activity',
      action: log.action,
      actor: log.actor_name || 'system',
      details: log.metadata || {},
    });
  }

  // Add tasks
  for (const task of tasks) {
    timeline.push({
      timestamp: task.created_at,
      type: 'task_created',
      action: `Task created: ${task.title}`,
      actor: task.created_by || 'system',
      details: { task_id: task.id, status: task.status },
    });
    if (task.completed_at) {
      timeline.push({
        timestamp: task.completed_at,
        type: 'task_completed',
        action: `Task completed: ${task.title}`,
        actor: task.assigned_agent || 'agent',
        details: { task_id: task.id },
      });
    }
  }

  // Add communications
  for (const comm of communications) {
    timeline.push({
      timestamp: comm.created_at,
      type: 'communication',
      action: `${comm.type}: ${comm.subject || 'No subject'}`,
      actor: comm.sender_address || 'unknown',
      details: { channel: comm.channel, status: comm.status },
    });
  }

  // Add meetings
  for (const meeting of meetings) {
    timeline.push({
      timestamp: meeting.meeting_date,
      type: 'meeting',
      action: `${meeting.meeting_type}: ${meeting.summary?.slice(0, 50) || 'Meeting'}`,
      actor: (meeting.participants || []).join(', ') || 'participants',
      details: { duration_minutes: meeting.duration_minutes, decisions: meeting.key_decisions },
    });
  }

  // Sort by timestamp descending
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    mandate_id: mandateId,
    total_events: timeline.length,
    timeline: timeline.slice(0, 50),
    summary: {
      activities: logs.length,
      tasks: tasks.length,
      communications: communications.length,
      meetings: meetings.length,
    },
  };
}

/* ─── API Handlers ─── */
async function handleMeetings(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const meetingId = path[1];

  try {
    if (req.method === 'POST' && !meetingId) {
      const { mandate_id, meeting_date, meeting_type, raw_transcript, source } = req.body;
      const parsed = parseMeetingTranscript(raw_transcript, meeting_type);

      const meeting = await insert('meeting_intelligence', {
        mandate_id,
        meeting_date: meeting_date || new Date().toISOString(),
        meeting_type: meeting_type || 'other',
        raw_transcript,
        summary: parsed.summary,
        key_decisions: parsed.key_decisions,
        action_items: parsed.action_items,
        risk_mentions: parsed.risk_mentions,
        sentiment_score: parsed.sentiment_score,
        participants: parsed.participants,
        duration_minutes: parsed.duration_minutes,
        source: source || 'manual_upload',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      return res.status(201).json({ success: true, meeting_id: meeting.id, ...parsed });
    }

    if (req.method === 'GET' && meetingId) {
      const meeting = await selectOne('meeting_intelligence', { where: [{ column: 'id', value: meetingId }] });
      if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
      return res.status(200).json({ success: true, meeting });
    }

    if (req.method === 'GET') {
      const mandateId = req.query.mandate_id as string;
      const where: any[] = [];
      if (mandateId) where.push({ column: 'mandate_id', value: mandateId });
      const meetings = await selectMany('meeting_intelligence', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, meetings });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Meetings] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleActions(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { mandate_id, notes, meeting_type } = req.body;
      const result = await createTasksFromNotes(mandate_id, notes, meeting_type);
      return res.status(201).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Actions] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTimeline(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const mandateId = path[1];

  try {
    if (req.method === 'GET' && mandateId) {
      const timeline = await generateActivityTimeline(mandateId);
      return res.status(200).json({ success: true, ...timeline });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Timeline] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'meetings':
      return handleMeetings(req, res);
    case 'actions':
      return handleActions(req, res);
    case 'timeline':
      return handleTimeline(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v17/${resource}` });
  }
}