/**
 * Phase 7.5 — Coaching Excellence handler (primary /coaching/coach route)
 *
 * Routes (via dispatch.ts → req.query.path segments):
 *   GET    /api/coaching/sessions                 — List user's coaching sessions
 *   POST   /api/coaching/sessions                 — Create new session (focus, coach role, title?)
 *   GET    /api/coaching/sessions/:id             — Get single session
 *   POST   /api/coaching/sessions/:id/messages    — Add message to session (coachee input)
 *   POST   /api/coaching/sessions/:id/start       — Start session (→ in-progress, welcome msg
 *   POST   /api/coaching/sessions/:id/complete    — Complete session (→ completed, summary/closing)
 *   GET    /api/coaching/coaches?focus=:focus      — List coaches for a focus area
 *
 * Business logic: coachingSessionEngine.ts (createSession, startSession, coacheeRespond,
 *   addMessage, endSession, getAgentsForFocus)
 * Methodologies:   coachingMethodologies.ts (getMethodologyForFocus)
 * Tables:          coaching_sessions, coaching_messages, coach_agents
 * Migration:     supabase/migrations/20260807_phase75_coaching.sql
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
import {
  createSession as engineCreateSession,
  startSession as engineStartSession,
  coacheeRespond as engineCoacheeRespond,
  addMessage as engineAddMessage,
  endSession as engineEndSession,
  getSessionSummary as engineGetSessionSummary,
  getAgentsForFocus,
  type CoachingSession,
  type SessionMessage,
  type CoachingFocus,
} from './coachingSessionEngine.js';
import {
  getMethodologyForFocus,
} from './coachingMethodologies.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

type Patch = Record<string, any>;

function ok(res: VercelResponse, data: any) {
  return res.status(200).json({ success: true, ...data });
}

function bad(res: VercelResponse, code: number, msg: string) {
  return res.status(code).json({ success: false, error: msg });
}

async function getCoacheeId(req: VercelRequest): Promise<string> {
  const { user } = await getUserFromRequest(req);
  if (user?.id) return user.id;
  // service-return (req.headers['x-test-user-id'] as string) || 'anonymous';
}

function patchFromEngineSession(engine: CoachingSession, coacheeId: string): Patch {
  return {
    id: engine.id,
    title: engine.title,
    focus: engine.focus,
    status: engine.status,
    methodology: engine.methodology,
    coachee_id: coacheeId,
    coach_agent_ids: engine.agents.map(a => a.id),
    actions: engine.actions,
    notes: engine.notes,
    started_at: engine.startedAt,
    ended_at: engine.endedAt,
    duration_sec: engine.duration,
    progress: engine.progress,
  };
}

function enrichWithMessages(
  sessionRow: any, messages: any[]): any {
  return {
    id: sessionRow.id,
    title: sessionRow.title,
    focus: sessionRow.focus,
    status: sessionRow.status,
    methodology: sessionRow.methodology,
    coacheeId: sessionRow.coachee_id,
    coachAgentIds: sessionRow.coach_agent_ids ?? [],
    actions: sessionRow.actions ?? [],
    notes: sessionRow.notes ?? [],
    startedAt: sessionRow.started_at,
    endedAt: sessionRow.ended_at,
    duration: sessionRow.duration_sec,
    progress: sessionRow.progress ?? 0,
    createdAt: sessionRow.created_at ? new Date(sessionRow.created_at).getTime() : Date.now(),
    updatedAt: sessionRow.updated_at ? new Date(sessionRow.updated_at).getTime() : Date.now(),
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      agentId: m.agent_id,
      content: m.content,
      methodology: m.methodology,
      timestamp: m.timestamp_ms,
      metadata: m.metadata ?? {},
    })),
  };
}

export async function handleCoaching(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const coacheeId = await getCoacheeId(req);
    if (!coacheeId || coacheeId === 'anonymous') {
      return bad(res, 401, 'Unauthorized');
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0] || '';
    const id = pathArr[1];
    const subResource = pathArr[2];

    // ── GET /sessions ───────────────────────────────────────────────
    if (resource === 'sessions' && !id && req.method === 'GET') {
      const { status, focus } = req.query as Record<string, string | undefined>;
      const where: Record<string, any> = { coachee_id: coacheeId };
      if (status) where.status = status;
      if (focus) where.focus = focus;
      const rows = await selectMany('coaching_sessions', {
        where,
        orderBy: { column: 'created_at', direction: 'desc' },
      });
      return ok(res, { sessions: rows ?? [] });
    }

    // ── POST /sessions ──────────────────────────────────────────────
    if (resource === 'sessions' && !id && req.method === 'POST') {
      const body = (req.body ?? {}) as Record<string, any>;
      const focus = body.focus as CoachingFocus;
      if (!focus) return bad(res, 400, 'focus is required');
      const validFocuses: CoachingFocus[] = [
        'leadership', 'career-transition', 'performance',
        'communication', 'strategic-thinking', 'emotional-intelligence'
      ];
      if (!validFocuses.includes(focus)) return bad(res, 400, `Invalid focus: ${focus}`);

      const methodology = (body.methodology as string) ?? getMethodologyForFocus(focus);
      const title = body.title as string | undefined;
      const engine = engineCreateSession(coacheeId, focus, methodology, title);
      const patch = patchFromEngineSession(engine, coacheeId);
      const created = await insert('coaching_sessions', patch);
      return ok(res, { session: created });
    }

    // ── Sub-resources need :id ────────────────────────────────────────────
    if (resource === 'sessions' && id) {
      const existing = await selectOne('coaching_sessions', { where: { id } });
      if (!existing) return bad(res, 404, 'Session not found');
      if (existing.coachee_id !== coacheeId) return bad(res, 403, 'Forbidden');

      // ── GET /sessions/:id ───────────────────────────────────────
      if (!subResource && req.method === 'GET') {
        const messages = await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        });
        return ok(res, { session: enrichWithMessages(existing, messages ?? []) });
      }

      // ── POST /sessions/:id/start ─────────────────────────────────
      if (subResource === 'start' && req.method === 'POST') {
        if (existing.status !== 'scheduled') return bad(res, 400, `Session already ${existing.status}`);
        // Rebuild engine representation for startSession
        const messages = (await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        })) ?? [];
        const agentsForStart: CoachingSession = {
          id: existing.id,
          title: existing.title,
          focus: existing.focus as CoachingFocus,
          status: existing.status,
          methodology: existing.methodology,
          coacheeId: existing.coachee_id,
          agents: [],
          messages: messages.map(m => ({
            id: m.id, role: m.role, agentId: m.agent_id, content: m.content,
            methodology: m.methodology, timestamp: m.timestamp_ms, metadata: m.metadata ?? {},
          })),
          actions: existing.actions ?? [],
          notes: existing.notes ?? [],
          startedAt: existing.started_at ?? null,
          endedAt: existing.ended_at ?? null,
          duration: existing.duration_sec,
          progress: existing.progress ?? 0,
        };
        // inject agents from coach_agent_ids
        const agentIds = existing.coach_agent_ids ?? [];
        if (agentIds.length) {
          const coaches = await selectMany('coach_agents', { whereIn: { column: 'id', values: agentIds } });
          agentsForStart.agents = (coaches ?? []).map(c => ({
            id: c.id, role: c.role, name: c.name, expertise: c.expertise ?? [],
            style: c.style, personality: c.personality ?? {},
          }));
        }
        const started = engineStartSession(agentsForStart);
        // Patch session row
        await update('coaching_sessions', { column: 'id', value: id }, {
          status: started.status,
          started_at: started.startedAt,
          progress: started.progress,
          updated_at: new Date().toISOString(),
        });
        // Insert the 2 new messages (welcome + coach opening)
        const msgsToInsert = started.messages.slice(-2);
        for (const m of msgsToInsert) {
          await insert('coaching_messages', {
            session_id: id,
            role: m.role,
            agent_id: m.agentId,
            content: m.content,
            methodology: m.methodology ?? null,
            timestamp_ms: m.timestamp,
            metadata: m.metadata ?? {},
          });
        }
        const finalMsgs = (await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        })) ?? [];
        const row = await selectOne('coaching_sessions', { where: { id } });
        return ok(res, { session: enrichWithMessages(row!, finalMsgs) });
      }

      // ── POST /sessions/:id/complete ──────────────────────────
      if (subResource === 'complete' && req.method === 'POST') {
        if (existing.status !== 'in-progress') {
          return bad(res, 400, `Cannot complete session with status ${existing.status}`);
        }
        const messages = (await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        })) ?? [];
        const agents = existing.coach_agent_ids ?? [];
        const coaches = agents.length
          ? (await selectMany('coach_agents', { whereIn: { column: 'id', values: agents } })) ?? []
          : [];
        const engineSession: CoachingSession = {
          id: existing.id,
          title: existing.title,
          focus: existing.focus as CoachingFocus,
          status: existing.status,
          methodology: existing.methodology,
          coacheeId: existing.coachee_id,
          agents: coaches.map(c => ({
            id: c.id, role: c.role, name: c.name, expertise: c.expertise ?? [],
            style: c.style, personality: c.personality ?? {},
          })),
          messages: messages.map(m => ({
            id: m.id, role: m.role, agentId: m.agent_id, content: m.content,
            methodology: m.methodology, timestamp: m.timestamp_ms, metadata: m.metadata ?? {},
          })),
          actions: existing.actions ?? [],
          notes: existing.notes ?? [],
          startedAt: existing.started_at ?? null,
          endedAt: existing.ended_at ?? null,
          duration: existing.duration_sec,
          progress: existing.progress ?? 0,
        };
        const ended = engineEndSession(engineSession);
        await update('coaching_sessions', { column: 'id', value: id }, {
          status: ended.status,
          ended_at: ended.endedAt,
          updated_at: new Date().toISOString(),
          actions: ended.actions,
          notes: ended.notes,
          progress: ended.progress,
        });
        const endMsgs = ended.messages.slice(-2);
        for (const m of endMsgs) {
          await insert('coaching_messages', {
            session_id: id, role: m.role, agent_id: m.agentId,
            content: m.content, methodology: m.methodology ?? null,
            timestamp_ms: m.timestamp, metadata: m.metadata ?? {},
          });
        }
        const row = await selectOne('coaching_sessions', { where: { id } });
        const finalMsgs = (await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        })) ?? [];
        const summary = engineGetSessionSummary(ended);
        return ok(res, { session: enrichWithMessages(row!, finalMsgs), summary });
      }

      // ── POST /sessions/:id/messages ─────────────────────────
      if (subResource === 'messages' && req.method === 'POST') {
        const body = (req.body ?? {}) as Record<string, any>;
        const content = body.content as string;
        if (!content || typeof content !== 'string') return bad(res, 400, 'content is required');
        if (existing.status === 'scheduled') return bad(res, 400, 'Start the session first');
        if (existing.status !== 'in-progress') return bad(res, 400, `Session is ${existing.status}`);

        const messages = (await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        })) ?? [];
        const agents = existing.coach_agent_ids ?? [];
        const coaches = agents.length
          ? (await selectMany('coach_agents', { whereIn: { column: 'id', values: agents } })) ?? []
          : [];
        const engineSession: CoachingSession = {
          id: existing.id,
          title: existing.title,
          focus: existing.focus as CoachingFocus,
          status: existing.status,
          methodology: existing.methodology,
          coacheeId: existing.coachee_id,
          agents: coaches.map(c => ({
            id: c.id, role: c.role, name: c.name, expertise: c.expertise ?? [],
            style: c.style, personality: c.personality ?? {},
          })),
          messages: messages.map(m => ({
            id: m.id, role: m.role, agentId: m.agent_id, content: m.content,
            methodology: m.methodology, timestamp: m.timestamp_ms, metadata: m.metadata ?? {},
          })),
          actions: existing.actions ?? [],
          notes: existing.notes ?? [],
          startedAt: existing.started_at ?? null,
          endedAt: existing.ended_at ?? null,
          duration: existing.duration_sec,
          progress: existing.progress ?? 0,
        };
        const after = engineCoacheeRespond(engineSession, content);
        await update('coaching_sessions', { column: 'id', value: id }, {
          progress: after.progress,
          actions: after.actions,
          updated_at: new Date().toISOString(),
        });
        const newMsgs = after.messages.slice(-2);
        for (const m of newMsgs) {
          await insert('coaching_messages', {
            session_id: id, role: m.role, agent_id: m.agentId,
            content: m.content, methodology: m.methodology ?? null,
            timestamp_ms: m.timestamp, metadata: m.metadata ?? {},
          });
        }
        const row = await selectOne('coaching_sessions', { where: { id } });
        const finalMsgs = (await selectMany('coaching_messages', {
          where: { session_id: id },
          orderBy: { column: 'timestamp_ms', direction: 'asc' },
        })) ?? [];
        return ok(res, { session: enrichWithMessages(row!, finalMsgs) });
      }

      return bad(res, 404, `Unknown sub: ${subResource || '(none)'}`);
    }

    // ── GET /coaches?focus= ───────────────────────────────────────────
    if (resource === 'coaches' && req.method === 'GET') {
      const focus = (req.query as any).focus as string | undefined;
      if (!focus) {
        const all = await selectMany('coach_agents', { orderBy: { column: 'name', direction: 'asc' } });
        return ok(res, { coaches: all ?? [] });
      }
      const validFocuses: CoachingFocus[] = [
        'leadership', 'career-transition', 'performance',
        'communication', 'strategic-thinking', 'emotional-intelligence',
      ];
      if (!validFocuses.includes(focus as CoachingFocus)) {
        return bad(res, 400, `Invalid focus: ${focus}`);
      }
      // Use the engine's focus→agent map, then load rows by id
      const mapped = getAgentsForFocus(focus as CoachingFocus);
      const ids = mapped.map(a => a.id);
      const rows = ids.length
        ? (await selectMany('coach_agents', { whereIn: { column: 'id', values: ids } })) ?? []
        : [];
      // Preserve engine ordering (mapped order, not DB order)
      const ordered = ids.map(id => rows.find(r => r.id === id)).filter(Boolean);
      return ok(res, { coaches: ordered });
    }

    return bad(res, 404, `Not found: ${req.method} /coaching/${resource}`);
  } catch (err: any) {
    return handleError(res, err, 'coaching');
  }
}
