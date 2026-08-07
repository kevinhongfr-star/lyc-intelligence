/**
 * Phase 7.5 — Coaching Excellence FULL-REQUEST-PATH integration tests.
 *
 * Exercises the REAL routing chain:
 *   (req, res) → dispatch() in dispatch.ts → dynamic import() of
 *   coachingHandler → handleCoaching → engineCreateSession / startSession /
 *   coacheeRespond / endSession logic → in-memory supabaseRest mock.
 *
 * Endpoints under test:
 *   GET    /api/coaching/sessions            (list user's sessions)
 *   POST   /api/coaching/sessions            (create new)
 *   GET    /api/coaching/sessions/:id         (get one with messages)
 *   POST   /api/coaching/sessions/:id/start   (start → in-progress + welcome msgs)
 *   POST   /api/coaching/sessions/:id/messages (add coachee message + coach reply)
 *   POST   /api/coaching/sessions/:id/complete (complete + summary)
 *   GET    /api/coaching/coaches?focus=X     (list coaches for a focus)
 *
 * 22 tests total:
 *   Suite 1 — Auth & dispatch resolution (5)
 *   Suite 2 — Session list & CRUD (6)
 *   Suite 3 — Message flow (start → respond → complete lifecycle) (5)
 *   Suite 4 — Coach listing / focus-filtering (3)
 *   Suite 5 — Data integrity (all update calls use {column, value} filter) (3)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const { authState } = vi.hoisted(() => ({
  authState: {
    user: null as null | { id: string; email: string; role: string },
    error: null as null | string,
  },
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(async () => ({ user: authState.user, error: authState.error })),
  getUserRole: vi.fn(async () => authState.user?.role || 'member'),
}));

// In-memory Supabase REST mock, matching the pattern used in reports tests.
// All coaching DAL calls (coaching_sessions, coaching_messages, coach_agents)
// route through this store; tests exercise via dispatch → handler path only.
const sharedState: {
  store: Map<string, any[]>;
  updateCalls: { table: string; filter: any; patch: any }[];
  insertCalls: { table: string; row: any }[];
  removeCalls: { table: string; filter: any }[];
} = {
  store: new Map(),
  updateCalls: [],
  insertCalls: [],
  removeCalls: [],
};

function resetStore() {
  sharedState.store.clear();
  sharedState.updateCalls.length = 0;
  sharedState.insertCalls.length = 0;
  sharedState.removeCalls.length = 0;
  // Seed 6 coach agents to match migration 20260807_phase75_coaching.sql seed rows
  const COACH_SEED: any[] = [
    { id: 'agent-lead',           role: 'lead-coach',                  name: 'Alex Chen',           expertise: ['leadership','career-transition','performance'], style: 'facilitative',   personality: {openness:0.9,conscientiousness:0.85,empathy:0.92,assertiveness:0.7} },
    { id: 'agent-leadership',     role: 'leadership-expert',           name: 'Dr. Sarah Mitchell',  expertise: ['leadership','strategic-thinking'],             style: 'challenge',      personality: {openness:0.8,conscientiousness:0.95,empathy:0.75,assertiveness:0.9} },
    { id: 'agent-career',         role: 'career-transition-specialist',name: 'James Okonkwo',       expertise: ['career-transition','communication'],            style: 'non-directive',  personality: {openness:0.95,conscientiousness:0.8,empathy:0.88,assertiveness:0.6} },
    { id: 'agent-performance',    role: 'performance-strategist',      name: 'Maria Gonzalez',      expertise: ['performance','emotional-intelligence'],         style: 'directive',      personality: {openness:0.75,conscientiousness:0.92,empathy:0.82,assertiveness:0.85} },
    { id: 'agent-communication',  role: 'communication-coach',         name: 'Thomas Weber',        expertise: ['communication','emotional-intelligence'],       style: 'facilitative',   personality: {openness:0.85,conscientiousness:0.78,empathy:0.9,assertiveness:0.65} },
    { id: 'agent-peer',          role: 'peer-coach',                   name: 'Jordan Lee',          expertise: ['leadership','career-transition'],               style: 'non-directive',  personality: {openness:0.9,conscientiousness:0.7,empathy:0.85,assertiveness:0.55} },
  ];
  COACH_SEED.forEach(r => {
    const list = sharedState.store.get('coach_agents') || [];
    list.push({ ...r, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    sharedState.store.set('coach_agents', list);
  });
}

function applyWhere(rows: any[], w: any[] | Record<string, any> | undefined) {
  if (!w) return rows;
  const clauses = Array.isArray(w) ? w : Object.entries(w).map(([col, value]) => ({ column: col, value }));
  let out = rows;
  for (const c of clauses) {
    const col = c.column ?? c.col;
    const val = c.value ?? c.val;
    out = out.filter((r: any) => r[col] === val);
  }
  return out;
}

vi.mock('../../../api/_lib/supabaseRest', () => ({
  isSupabaseConfigured: () => true,
  handleError: (res: any, err: any, _prefix: string) => {
    return res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  },
  __shared: sharedState,
  getUpdateCalls: () => sharedState.updateCalls,
  getInsertCalls: () => sharedState.insertCalls,
  getRemoveCalls: () => sharedState.removeCalls,
  selectOne: async (table: string, opts: any) => {
    const list = (sharedState.store.get(table) || []).slice();
    return applyWhere(list, opts?.where)[0] || null;
  },
  selectMany: async (table: string, opts: any) => {
    let rows = (sharedState.store.get(table) || []).slice();
    rows = applyWhere(rows, opts?.where);
    if (opts?.whereIn) {
      const { column, values } = opts.whereIn;
      rows = rows.filter((r: any) => (values as any[]).includes(r[column]));
    }
    if (opts?.orderBy) {
      const ob = Array.isArray(opts.orderBy) ? opts.orderBy[0] : opts.orderBy;
      const col = ob.column ?? ob.col;
      const asc = (ob.ascending ?? (ob.direction !== 'desc')) !== false ? true : false;
      rows.sort((a: any, b: any) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }
    return rows;
  },
  insert: async (table: string, row: any) => {
    const id = row.id || `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const saved = { ...row, id, created_at: row.created_at || new Date().toISOString(), updated_at: row.updated_at || new Date().toISOString() };
    const list = sharedState.store.get(table) || [];
    list.push(saved);
    sharedState.store.set(table, list);
    sharedState.insertCalls.push({ table, row: saved });
    return saved;
  },
  update: async (table: string, filter: any, patch: any) => {
    sharedState.updateCalls.push({ table, filter, patch });
    const col = filter?.column;
    const val = filter?.value;
    const rows = sharedState.store.get(table) || [];
    const updated: any[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][col] === val) {
        rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
        updated.push(rows[i]);
      }
    }
    sharedState.store.set(table, rows);
    return updated;
  },
  remove: async (table: string, filter: any) => {
    sharedState.removeCalls.push({ table, filter });
    const col = filter?.column;
    const val = filter?.value;
    const rows = (sharedState.store.get(table) || []).filter(r => r[col] !== val);
    sharedState.store.set(table, rows);
    return true;
  },
}));

import dispatchHandler from '../../../api/dispatch';

function makeReq(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', sub: string, body?: any) {
  // Split sub-path from any query-string so query params are exposed to handler via req.query.foo
  const [pathOnly, qs] = sub.split('?');
  const query: Record<string, any> = { __mod: 'coaching', __sub: pathOnly };
  if (qs) {
    for (const part of qs.split('&')) {
      const [k, v = ''] = part.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }
  return {
    method,
    url: `http://localhost/api/coaching/${sub}`,
    query,
    body,
    headers: { authorization: 'Bearer test-jwt' },
  } as any;
}

function collectJson(): [any[], Promise<any> | undefined] {
  let resolve: any = undefined;
  const out: any[] = [];
  let promise: Promise<any> | undefined = new Promise<void>((res) => { resolve = res; });
  const res: any = {
    status: vi.fn((code: number) => { res._code = code; return res; }),
    json: vi.fn((data: any) => { out.push(data); resolve?.(); return res; }),
  };
  return [out, promise];
}

describe('Phase 7.5 Coaching Excellence (full-path through dispatch)', () => {
  beforeEach(() => {
    resetStore();
    authState.user = { id: 'user-001', email: 'u@test.com', role: 'member' };
    authState.error = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Suite 1: Auth & dispatch resolution ────────────────────────
  describe('Suite 1 — Auth & dispatch resolution', () => {
    it('S1-T1 returns 401 when auth header has no resolved user', async () => {
      authState.user = null;
      authState.error = 'unverified';
      const req = makeReq('GET', 'sessions');
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(req, res);
      expect(res._c).toBe(401);
      expect(res._d?.success).toBe(false);
    });

    it('S1-T2 rejects unknown module → 404 from dispatch', async () => {
      const req = makeReq('GET', 'sessions');
      req.query.__mod = 'definitely-not-coaching';
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(req, res);
      expect(res._c).toBe(404);
      expect(res._d?.error).toMatch(/Unknown module/);
    });

    it('S1-T3 accepts the "coaching" module in dispatch (200 for valid endpoint hit)', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'coaches'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
    });

    it('S1-T4 unknown sub-path returns 404 from handler', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'this-path-does-not-exist'), res);
      expect(res._c).toBe(404);
      expect(res._d?.error).toMatch(/Not found/);
    });

    it('S1-T5 rejects missing auth header (401 via getUserFromRequest error)', async () => {
      authState.user = null;
      authState.error = 'no-header';
      const req = makeReq('GET', 'coaches');
      delete req.headers.authorization;
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(req, res);
      expect(res._c).toBe(401);
    });
  });

  // ── Suite 2: Session CRUD & listing ────────────────────────────
  describe('Suite 2 — Session list & CRUD', () => {
    it('S2-T1 creating a session inserts row into coaching_sessions', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', 'sessions', { focus: 'leadership' }), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.session?.focus).toBe('leadership');
      expect(res._d?.session?.status).toBe('scheduled');
      expect(res._d?.session?.coachee_id).toBe('user-001');
      expect(sharedState.store.get('coaching_sessions')?.length).toBe(1);
    });

    it('S2-T2 create rejects invalid focus → 400', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', 'sessions', { focus: 'underwater-basket-weaving' }), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
      expect(res._d?.error).toMatch(/Invalid focus/);
    });

    it('S2-T3 create requires focus (not optional)', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', 'sessions', { methodology: 'GROW' }), res);
      expect(res._c).toBe(400);
      expect(res._d?.error).toMatch(/focus is required/);
    });

    it('S2-T4 list returns empty array when no sessions exist for user', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'sessions'), res);
      expect(res._c).toBe(200);
      expect(Array.isArray(res._d?.sessions)).toBe(true);
      expect(res._d?.sessions).toHaveLength(0);
    });

    it('S2-T5 list only returns sessions for the authenticated coachee (multi-user isolation)', async () => {
      // Create one session for current user, one for a different user directly in store
      sharedState.store.set('coaching_sessions', [
        { id: 's1', focus: 'leadership', status: 'scheduled', coachee_id: 'user-001', methodology: 'GROW', actions: [], notes: [], coach_agent_ids: [], duration_sec: 3600, progress: 0, created_at: new Date(Date.now()-2000).toISOString() },
        { id: 's2', focus: 'communication', status: 'scheduled', coachee_id: 'user-999', methodology: 'FRAME', actions: [], notes: [], coach_agent_ids: [], duration_sec: 3600, progress: 0, created_at: new Date(Date.now()-1000).toISOString() },
      ]);
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'sessions'), res);
      expect(res._d?.sessions).toHaveLength(1);
      expect(res._d?.sessions[0].id).toBe('s1');
    });

    it('S2-T6 GET /sessions/:id returns 404 for bogus id, 200 with messages array', async () => {
      const res404: any = { status: vi.fn((c: number) => (res404._c = c, res404)), json: vi.fn((d: any) => (res404._d = d, res404)) };
      await dispatchHandler(makeReq('GET', 'sessions/session-does-not-exist-1234'), res404);
      expect(res404._c).toBe(404);

      // Now create real session and retrieve it
      await dispatchHandler(
        makeReq('POST', 'sessions', { focus: 'communication' }),
        { status: () => ({ json: () => ({}) }) } as any,
      );
      const id = sharedState.store.get('coaching_sessions')![0].id;
      const resOk: any = { status: vi.fn((c: number) => (resOk._c = c, resOk)), json: vi.fn((d: any) => (resOk._d = d, resOk)) };
      await dispatchHandler(makeReq('GET', `sessions/${id}`), resOk);
      expect(resOk._c).toBe(200);
      expect(resOk._d?.success).toBe(true);
      expect(Array.isArray(resOk._d?.session?.messages)).toBe(true);
    });
  });

  // ── Suite 3: Message flow (start → respond → complete) ─────────
  describe('Suite 3 — Session lifecycle (start → message → complete)', () => {
    async function createSession(focus = 'leadership'): Promise<string> {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', 'sessions', { focus }), res);
      return res._d.session.id;
    }

    it('S3-T1 start on scheduled session flips status to in-progress, inserts welcome + coach msgs', async () => {
      const id = await createSession('leadership');
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', `sessions/${id}/start`), res);
      expect(res._c).toBe(200);
      expect(res._d?.session?.status).toBe('in-progress');
      expect(res._d?.session?.messages.length).toBeGreaterThanOrEqual(2);
      const roles = res._d.session.messages.map((m: any) => m.role);
      expect(roles).toContain('system');
      expect(roles).toContain('coach');
      expect(sharedState.store.get('coaching_messages')!.length).toBe(2);
    });

    it('S3-T2 start rejects when session is not scheduled', async () => {
      const id = await createSession('performance');
      // Update status to completed directly in store
      const rows = sharedState.store.get('coaching_sessions')!;
      rows[0].status = 'completed';
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', `sessions/${id}/start`), res);
      expect(res._c).toBe(400);
      expect(res._d?.error).toMatch(/already completed/);
    });

    it('S3-T3 /messages adds coachee input AND coach replies (engine GROW/CLEAR response)', async () => {
      const id = await createSession('performance');
      // Start first
      await dispatchHandler(
        makeReq('POST', `sessions/${id}/start`),
        { status: () => ({ json: () => ({}) }) } as any,
      );
      const beforeMsgs = sharedState.store.get('coaching_messages')!.length;

      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', `sessions/${id}/messages`, { content: 'I want to improve my team communication.' }), res);
      expect(res._c).toBe(200);
      const afterMsgs = sharedState.store.get('coaching_messages')!.length;
      // coachee msg + 1 coach reply = +2
      expect(afterMsgs - beforeMsgs).toBe(2);
      const justAdded = sharedState.store.get('coaching_messages')!.slice(-2);
      expect(justAdded[0].role).toBe('coachee');
      expect(justAdded[1].role).toBe('coach');
      expect(res._d?.session?.progress).toBeGreaterThan(0);
    });

    it('S3-T4 /messages rejects when session is still scheduled', async () => {
      const id = await createSession('leadership');
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', `sessions/${id}/messages`, { content: 'hello' }), res);
      expect(res._c).toBe(400);
      expect(res._d?.error).toMatch(/Start the session first/);
    });

    it('S3-T5 complete changes status → completed, returns session + summary object', async () => {
      const id = await createSession('career-transition');
      await dispatchHandler(makeReq('POST', `sessions/${id}/start`), { status: () => ({ json: () => ({}) }) } as any);
      await dispatchHandler(makeReq('POST', `sessions/${id}/messages`, { content: 'Help me think about promotion.' }), { status: () => ({ json: () => ({}) }) } as any);
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('POST', `sessions/${id}/complete`), res);
      expect(res._c).toBe(200);
      expect(res._d?.session?.status).toBe('completed');
      expect(res._d?.summary).toBeDefined();
      expect(typeof res._d?.summary.messageCount).toBe('number');
      expect(typeof res._d?.summary.actionCount).toBe('number');
    });
  });

  // ── Suite 4: Coach listing & focus filtering ───────────────────
  describe('Suite 4 — Coach listing', () => {
    it('S4-T1 /coaches (no focus) returns all 6 seed agents sorted', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'coaches'), res);
      expect(res._c).toBe(200);
      expect(res._d?.coaches?.length).toBe(6);
      // Sorted alphabetically (Alex Chen comes first alphabetically)
      expect(res._d.coaches[0].name).toBe('Alex Chen');
    });

    it('S4-T2 /coaches?focus=leadership returns FOCUS_AGENT_MAP order (lead-coach, leadership-expert, communication-coach)', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'coaches?focus=leadership'), res);
      expect(res._c).toBe(200);
      expect(res._d?.coaches?.length).toBe(3);
      expect(res._d.coaches.map((c: any) => c.role)).toEqual([
        'lead-coach',
        'leadership-expert',
        'communication-coach',
      ]);
    });

    it('S4-T3 invalid focus → 400', async () => {
      const res: any = { status: vi.fn((c: number) => (res._c = c, res)), json: vi.fn((d: any) => (res._d = d, res)) };
      await dispatchHandler(makeReq('GET', 'coaches?focus=underwater'), res);
      expect(res._c).toBe(400);
      expect(res._d?.error).toMatch(/Invalid focus/);
    });
  });

  // ── Suite 5: Data integrity (update{column,value} safe filters) ─
  describe('Suite 5 — Data integrity — update/insert patterns', () => {
    beforeEach(() => sharedState.updateCalls.length = 0);

    it('S5-T1 start() uses update with {column:id}', async () => {
      // Create session
      const res1: any = { status: vi.fn((c: number) => (res1._c = c, res1)), json: vi.fn((d: any) => (res1._d = d, res1)) };
      await dispatchHandler(makeReq('POST', 'sessions', { focus: 'leadership' }), res1);
      const id = res1._d.session.id;
      sharedState.updateCalls.length = 0;
      await dispatchHandler(makeReq('POST', `sessions/${id}/start`), { status: () => ({ json: () => ({}) }) } as any);
      expect(sharedState.updateCalls.length).toBeGreaterThanOrEqual(1);
      for (const u of sharedState.updateCalls) {
        expect(u.filter).toHaveProperty('column', 'id');
        expect(u.filter).toHaveProperty('value', id);
      }
    });

    it('S5-T2 message respond updates coaching_sessions with {column:id}', async () => {
      const res1: any = { status: vi.fn((c: number) => (res1._c = c, res1)), json: vi.fn((d: any) => (res1._d = d, res1)) };
      await dispatchHandler(makeReq('POST', 'sessions', { focus: 'strategic-thinking' }), res1);
      const id = res1._d.session.id;
      await dispatchHandler(makeReq('POST', `sessions/${id}/start`), { status: () => ({ json: () => ({}) }) } as any);
      sharedState.updateCalls.length = 0;
      await dispatchHandler(makeReq('POST', `sessions/${id}/messages`, { content: 'How do I plan this quarter?' }), { status: () => ({ json: () => ({}) }) } as any);
      const sessionUpdates = sharedState.updateCalls.filter(u => u.table === 'coaching_sessions');
      expect(sessionUpdates.length).toBeGreaterThanOrEqual(1);
      for (const u of sessionUpdates) {
        expect(u.filter).toHaveProperty('column', 'id');
        expect(u.filter).toHaveProperty('value', id);
      }
    });

    it('S5-T3 complete() updates with {column:id}', async () => {
      const res1: any = { status: vi.fn((c: number) => (res1._c = c, res1)), json: vi.fn((d: any) => (res1._d = d, res1)) };
      await dispatchHandler(makeReq('POST', 'sessions', { focus: 'emotional-intelligence' }), res1);
      const id = res1._d.session.id;
      await dispatchHandler(makeReq('POST', `sessions/${id}/start`), { status: () => ({ json: () => ({}) }) } as any);
      await dispatchHandler(makeReq('POST', `sessions/${id}/messages`, { content: 'Feeling overwhelmed.' }), { status: () => ({ json: () => ({}) }) } as any);
      sharedState.updateCalls.length = 0;
      await dispatchHandler(makeReq('POST', `sessions/${id}/complete`), { status: () => ({ json: () => ({}) }) } as any);
      const lastSessionUpdate = sharedState.updateCalls.filter(u => u.table === 'coaching_sessions').slice(-1)[0];
      expect(lastSessionUpdate).toBeDefined();
      expect(lastSessionUpdate.filter).toHaveProperty('column', 'id');
      expect(lastSessionUpdate.filter).toHaveProperty('value', id);
    });
  });
});
