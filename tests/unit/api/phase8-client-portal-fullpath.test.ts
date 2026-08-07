/**
 * Phase 8 — B2B Client Portal Backend Integration FULL-REQUEST-PATH tests.
 *
 * Exercises the REAL routing chain:
 *   (req, res) → dispatch() in dispatch.ts → dynamic import() of
 *   clientPortalHandler / clientWorkflowEngine / clientEngagementHandler
 *   → real handler logic with in-memory supabaseRest mock.
 *
 * 28 tests total across 3 modules + auth:
 *   Suite 1 — Auth & dispatch resolution (5)
 *   Suite 2 — Client Portal: mandates, pipeline, candidate, feedback (8)
 *   Suite 3 — Client Workflow: CRUD, activate, execute, approvals (8)
 *   Suite 4 — Client Engagement: NPS, surveys, feedback, metrics (5)
 *   Suite 5 — Cross-module & data integrity (2)
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

// ── In-memory Supabase REST mock ───────────────────────────────────────
// Supports BOTH calling conventions used by the 3 handlers:
//   Legacy positional: selectMany(table, filters, orderBy, limit, offset, select)
//   Legacy filter obj: selectOne(table, { column, value, select })
//   Legacy update:     update(table, idString, patchObject)
//   New-style options: selectMany(table, { where, orderBy, ... })

const sharedState: {
  store: Map<string, any[]>;
  updateCalls: { table: string; filter: any; patch: any }[];
  insertCalls: { table: string; row: any }[];
} = {
  store: new Map(),
  updateCalls: [],
  insertCalls: [],
};

function resetStore() {
  sharedState.store.clear();
  sharedState.updateCalls.length = 0;
  sharedState.insertCalls.length = 0;
  // Seed client_accounts with a test client
  const CLIENT_ACCOUNT = {
    id: 'acct-001',
    auth_user_id: 'user-001',
    email: 'client@test.com',
    name: 'Test Client',
    organization: 'Test Org',
    company_name: 'Test Org',
    is_active: true,
    access_expires: null,
    role: 'client_user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  sharedState.store.set('client_accounts', [CLIENT_ACCOUNT]);

  // Seed a mandate + mandate_access
  const MANDATE = {
    id: 'mand-001',
    title: 'VP Engineering',
    role_title: 'VP Engineering',
    phase: 'active',
    client_visible: true,
    lead_consultant_id: 'consul-001',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  sharedState.store.set('mandates', [MANDATE]);

  const ACCESS = {
    id: 'access-001',
    client_account_id: 'acct-001',
    mandate_id: 'mand-001',
    role: 'client_owner',
    created_at: new Date().toISOString(),
  };
  sharedState.store.set('client_mandate_access', [ACCESS]);

  // Seed a consultant profile
  sharedState.store.set('profiles', [
    { id: 'consul-001', full_name: 'Jane Consultant' },
  ]);

  // Seed some contacts (candidates in pipeline)
  sharedState.store.set('contacts', [
    { id: 'cand-001', mandate_id: 'mand-001', pipeline_stage: 'S1_Sourced', full_name: 'Alice Wong', title: 'Senior Engineer', company_name: 'TechCorp', client_presented: true },
    { id: 'cand-002', mandate_id: 'mand-001', pipeline_stage: 'S12_Presented_to_Client', full_name: 'Bob Zhang', title: 'Staff Engineer', company_name: 'DataInc', client_presented: true },
  ]);

  // Seed a survey
  sharedState.store.set('surveys', [
    { id: 'surv-001', title: 'Client Satisfaction', description: 'How are we doing?', questions: [], status: 'active', created_at: new Date().toISOString() },
  ]);
}

// Helper: apply filter object (supports both {column,value} and plain key→value objects)
function applyFilter(rows: any[], filter: any): any[] {
  if (!filter) return rows;
  // { column, value } style
  if (filter.column && filter.value !== undefined) {
    return rows.filter(r => r[filter.column] === filter.value);
  }
  // Plain key→value object
  return rows.filter(r =>
    Object.entries(filter).every(([k, v]) => r[k] === v)
  );
}

vi.mock('../../../api/_lib/supabaseRest', () => ({
  isSupabaseConfigured: () => true,
  handleError: (res: any, _prefix: string, err: any) => {
    return res.status(500).json({ success: false, error: err?.message || 'Internal error' });
  },
  __shared: sharedState,
  selectOne: async (table: string, filter: any, _timeout?: number) => {
    const list = (sharedState.store.get(table) || []).slice();
    return applyFilter(list, filter)[0] || null;
  },
  selectMany: async (table: string, optionsOrFilters?: any, orderByOrLimit?: any, limitOrOffset?: any, offsetOrSelect?: any, selectOrTimeout?: any) => {
    let rows = (sharedState.store.get(table) || []).slice();
    // Detect calling convention
    const isNewStyle = optionsOrFilters && typeof optionsOrFilters === 'object'
      && !Array.isArray(optionsOrFilters)
      && ('select' in optionsOrFilters || 'where' in optionsOrFilters || 'orderBy' in optionsOrFilters);
    if (isNewStyle) {
      if (optionsOrFilters.where) {
        const w = optionsOrFilters.where;
        if (Array.isArray(w)) {
          for (const clause of w) {
            const col = clause.column ?? clause.col;
            const val = clause.value ?? clause.val;
            rows = rows.filter(r => r[col] === val);
          }
        }
      } else {
        // Plain object filters
        const { select: _s, orderBy: _o, limit: _l, offset: _off, ...filters } = optionsOrFilters;
        rows = applyFilter(rows, filters);
      }
      if (optionsOrFilters.orderBy) {
        const ob = optionsOrFilters.orderBy;
        const col = ob.column;
        const asc = ob.ascending !== false;
        rows.sort((a, b) => (a[col] < b[col] ? (asc ? -1 : 1) : a[col] > b[col] ? (asc ? 1 : -1) : 0));
      }
    } else {
      // Legacy positional: table, filters, orderBy, limit, offset, select
      const filters = optionsOrFilters || {};
      rows = applyFilter(rows, filters);
      if (Array.isArray(orderByOrLimit) && orderByOrLimit.length > 0) {
        const obStr = orderByOrLimit[0] as string;
        const [col, dir] = obStr.split(' ');
        const asc = dir !== 'DESC';
        rows.sort((a, b) => (a[col] < b[col] ? (asc ? -1 : 1) : a[col] > b[col] ? (asc ? 1 : -1) : 0));
      }
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
  update: async (table: string, filterOrData: any, dataOrValue?: any) => {
    sharedState.updateCalls.push({ table, filter: filterOrData, patch: dataOrValue });
    // Legacy: update(table, idString, patch)
    if (typeof filterOrData === 'string') {
      const rows = sharedState.store.get(table) || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === filterOrData) {
          rows[i] = { ...rows[i], ...dataOrValue, updated_at: new Date().toISOString() };
        }
      }
      sharedState.store.set(table, rows);
      return rows.filter(r => r.id === filterOrData);
    }
    // New-style: update(table, { column, value, ...patch })
    if (filterOrData && typeof filterOrData === 'object' && 'column' in filterOrData && 'value' in filterOrData) {
      const { column, value, ...patch } = filterOrData;
      const rows = sharedState.store.get(table) || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][column] === value) {
          rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
        }
      }
      sharedState.store.set(table, rows);
      return rows.filter(r => r[column] === filterOrData.value);
    }
    return [];
  },
  remove: async () => true,
}));

import dispatchHandler from '../../../api/dispatch';

// ── Request / Response helpers ─────────────────────────────────────────

function makeReq(mod: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', sub: string, body?: any) {
  const [pathOnly, qs] = sub.split('?');
  const query: Record<string, any> = { __mod: mod, __sub: pathOnly };
  if (qs) {
    for (const part of qs.split('&')) {
      const [k, v = ''] = part.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }
  return {
    method,
    url: `http://localhost/api/${mod}/${sub}`,
    query,
    body,
    headers: { authorization: 'Bearer test-jwt' },
  } as any;
}

function makeRes() {
  const res: any = {
    _c: 0,
    _d: undefined,
    _statusCalled: false,
    status: vi.fn((c: number) => { res._c = c; res._statusCalled = true; return res; }),
    json: vi.fn((d: any) => {
      // Express/Vercel defaults to 200 when res.json() is called without res.status()
      if (!res._statusCalled) res._c = 200;
      res._d = d;
      return res;
    }),
  };
  return res;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('Phase 8 Client Portal (full-path through dispatch)', () => {
  beforeEach(() => {
    resetStore();
    authState.user = { id: 'user-001', email: 'client@test.com', role: 'member' };
    authState.error = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Suite 1: Auth & dispatch resolution ─────────────────────────────
  describe('Suite 1 — Auth & dispatch resolution', () => {
    it('S1-T1 returns 401 when no authenticated user', async () => {
      authState.user = null;
      authState.error = 'no-token';
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'mandates'), res);
      expect(res._c).toBe(401);
    });

    it('S1-T2 rejects unknown module → 404 from dispatch', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('definitely-not-real', 'GET', 'foo'), res);
      expect(res._c).toBe(404);
      expect(res._d?.error).toMatch(/Unknown module/);
    });

    it('S1-T3 client-portal module dispatches and returns 200 for profile', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'profile'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
    });

    it('S1-T4 client-workflow module dispatches and returns 200 for workflows list', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'GET', 'workflows'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
    });

    it('S1-T5 client-engagement module dispatches and returns 200 for engagement metrics', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-engagement', 'GET', 'engagement'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
    });
  });

  // ── Suite 2: Client Portal — mandates, pipeline, candidate, feedback ─
  describe('Suite 2 — Client Portal: mandates, pipeline, candidate, feedback', () => {
    it('S2-T1 GET /mandates returns client mandates with pipeline summary', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'mandates'), res);
      expect(res._c).toBe(200);
      expect(Array.isArray(res._d?.mandates)).toBe(true);
      expect(res._d.mandates.length).toBe(1);
      expect(res._d.mandates[0].title).toBe('VP Engineering');
      expect(res._d.mandates[0].pipeline_summary).toBeDefined();
    });

    it('S2-T2 GET /mandates/:id returns mandate detail', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'mandates/mand-001'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.mandate?.id).toBe('mand-001');
    });

    it('S2-T3 GET /mandates/:id/pipeline returns stage breakdown', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'mandates/mand-001/pipeline'), res);
      expect(res._c).toBe(200);
      expect(Array.isArray(res._d?.stages)).toBe(true);
      expect(res._d.stages.length).toBeGreaterThan(0);
    });

    it('S2-T4 GET /candidates/:id returns candidate detail', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'candidates/cand-001'), res);
      expect(res._c).toBe(200);
      expect(res._d?.candidate).toBeDefined();
    });

    it('S2-T5 POST /candidates/:id/feedback submits feedback and inserts row', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'POST', 'candidates/cand-002/feedback', {
        mandate_id: 'mand-001',
        decision: 'interested',
        comments: 'Great candidate',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.feedback).toBeDefined();
      expect(sharedState.store.get('client_shortlist_feedback')?.length).toBe(1);
    });

    it('S2-T6 POST /candidates/:id/feedback rejects invalid decision → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'POST', 'candidates/cand-002/feedback', {
        mandate_id: 'mand-001',
        decision: 'maybe',
      }), res);
      expect(res._c).toBe(400);
      expect(res._d?.error).toMatch(/Invalid decision/);
    });

    it('S2-T7 GET /notifications returns notifications array', async () => {
      sharedState.store.set('client_notifications', [
        { id: 'n1', client_account_id: 'acct-001', type: 'new_candidate', title: 'New candidate', message: 'Added', read_at: null, created_at: new Date().toISOString() },
        { id: 'n2', client_account_id: 'acct-001', type: 'interview_scheduled', title: 'Interview', message: 'Scheduled', read_at: new Date().toISOString(), created_at: new Date().toISOString() },
      ]);
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'notifications'), res);
      expect(res._c).toBe(200);
      expect(res._d?.notifications.length).toBe(2);
      expect(res._d?.unread_count).toBe(1);
    });

    it('S2-T8 GET /mandates/:id/shortlist returns shortlisted candidates', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'mandates/mand-001/shortlist'), res);
      expect(res._c).toBe(200);
      expect(Array.isArray(res._d?.shortlist)).toBe(true);
    });
  });

  // ── Suite 3: Client Workflow — CRUD, activate, execute, approvals ────
  describe('Suite 3 — Client Workflow: CRUD, activate, execute, approvals', () => {
    it('S3-T1 GET /workflows returns empty array initially', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'GET', 'workflows'), res);
      expect(res._c).toBe(200);
      expect(Array.isArray(res._d?.workflows)).toBe(true);
      expect(res._d.workflows.length).toBe(0);
    });

    it('S3-T2 POST /workflows creates a new workflow', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'workflows', {
        name: 'Onboarding Flow',
        description: 'New hire onboarding',
        trigger_type: 'manual',
        nodes: [{ id: 'n1', type: 'trigger', title: 'Start', order: 0, status: 'pending', config: {}, assignees: [], due_at: null, completed_at: null, outputs: {} }],
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.workflow).toBeDefined();
      expect(res._d.workflow.name).toBe('Onboarding Flow');
      expect(res._d.workflow.status).toBe('draft');
      expect(sharedState.store.get('client_workflows')?.length).toBe(1);
    });

    it('S3-T3 GET /workflows/:id returns workflow detail', async () => {
      // Create first
      const createRes = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'workflows', {
        name: 'Approval Chain',
        trigger_type: 'manual',
        nodes: [],
      }), createRes);
      const wfId = createRes._d.workflow.id;

      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'GET', `workflows/${wfId}`), res);
      expect(res._c).toBe(200);
      expect(res._d?.workflow?.id).toBe(wfId);
    });

    it('S3-T4 GET /workflows/:id returns 404 for nonexistent workflow', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'GET', 'workflows/nonexistent-id'), res);
      expect(res._c).toBe(404);
    });

    it('S3-T5 POST /workflows/:id/activate flips status to active', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'workflows', {
        name: 'To Activate',
        trigger_type: 'manual',
        nodes: [],
      }), createRes);
      const wfId = createRes._d.workflow.id;

      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', `workflows/${wfId}/activate`), res);
      expect(res._c).toBe(200);
      // update() returns array — verify via store
      const wfs = sharedState.store.get('client_workflows') || [];
      expect(wfs.find((w: any) => w.id === wfId)?.status).toBe('active');
    });

    it('S3-T6 POST /workflows/:id/deactivate flips status to paused', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'workflows', {
        name: 'To Pause',
        trigger_type: 'manual',
        nodes: [],
      }), createRes);
      const wfId = createRes._d.workflow.id;
      // Activate first
      await dispatchHandler(makeReq('client-workflow', 'POST', `workflows/${wfId}/activate`), makeRes());

      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', `workflows/${wfId}/deactivate`), res);
      expect(res._c).toBe(200);
      const wfs = sharedState.store.get('client_workflows') || [];
      expect(wfs.find((w: any) => w.id === wfId)?.status).toBe('paused');
    });

    it('S3-T7 POST /workflows/:id/execute runs the workflow engine', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'workflows', {
        name: 'Executable',
        trigger_type: 'manual',
        nodes: [
          { id: 'n1', type: 'trigger', title: 'Start', order: 0, status: 'pending', config: {}, assignees: [], due_at: null, completed_at: null, outputs: {} },
          { id: 'n2', type: 'notify', title: 'Notify', order: 1, status: 'pending', config: { message: 'Done' }, assignees: [], due_at: null, completed_at: null, outputs: {} },
        ],
      }), createRes);
      const wfId = createRes._d.workflow.id;
      // Must activate before executing
      await dispatchHandler(makeReq('client-workflow', 'POST', `workflows/${wfId}/activate`), makeRes());

      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', `workflows/${wfId}/execute`), res);
      expect(res._c).toBe(200);
      expect(res._d?.execution).toBeDefined();
    });

    it('S3-T8 POST /approvals/:id/approve updates approval status', async () => {
      // Seed an approval
      sharedState.store.set('client_approvals', [
        { id: 'appr-001', workflow_id: 'wf-001', node_id: 'n1', approver_id: 'acct-001', status: 'pending', decision: null, comments: null, created_at: new Date().toISOString(), decided_at: null },
      ]);
      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'approvals/appr-001/approve', {
        comments: 'Looks good',
      }), res);
      expect(res._c).toBe(200);
      // update() returns array — verify via store
      const appr = (sharedState.store.get('client_approvals') || []).find((a: any) => a.id === 'appr-001');
      expect(appr?.status).toBe('approved');
    });
  });

  // ── Suite 4: Client Engagement — NPS, surveys, feedback, metrics ─────
  describe('Suite 4 — Client Engagement: NPS, surveys, feedback, metrics', () => {
    it('S4-T1 POST /nps submits an NPS score and inserts row', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-engagement', 'POST', 'nps', {
        score: 9,
        mandate_id: 'mand-001',
        comment: 'Great service',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.nps_record).toBeDefined();
      expect(res._d.nps_record.score).toBe(9);
      expect(res._d.nps_record.category).toBe('promoter');
      expect(sharedState.store.get('client_nps')?.length).toBe(1);
    });

    it('S4-T2 GET /nps returns NPS history and calculated score', async () => {
      // Seed some NPS records
      sharedState.store.set('client_nps', [
        { id: 'n1', client_account_id: 'acct-001', score: 9, category: 'promoter', comment: null, created_at: new Date().toISOString() },
        { id: 'n2', client_account_id: 'acct-001', score: 6, category: 'detractor', comment: null, created_at: new Date().toISOString() },
        { id: 'n3', client_account_id: 'acct-001', score: 10, category: 'promoter', comment: null, created_at: new Date().toISOString() },
      ]);
      const res = makeRes();
      await dispatchHandler(makeReq('client-engagement', 'GET', 'nps'), res);
      expect(res._c).toBe(200);
      expect(res._d?.records).toBeDefined();
      expect(res._d.records.length).toBe(3);
      expect(typeof res._d.nps).toBe('number');
    });

    it('S4-T3 GET /engagement returns engagement metrics object', async () => {
      // Seed some engagement data
      sharedState.store.set('login_events', [
        { id: 'le1', user_id: 'acct-001', created_at: new Date().toISOString() },
      ]);
      sharedState.store.set('document_views', [
        { id: 'dv1', client_account_id: 'acct-001', document_id: 'doc-1', viewed_at: new Date().toISOString() },
      ]);
      const res = makeRes();
      await dispatchHandler(makeReq('client-engagement', 'GET', 'engagement'), res);
      expect(res._c).toBe(200);
      expect(res._d?.metrics).toBeDefined();
      expect(typeof res._d.metrics.total_logins).toBe('number');
      expect(typeof res._d.metrics.login_streak_days).toBe('number');
      expect(res._d.metrics.engagement_level).toBeDefined();
    });

    it('S4-T4 POST /feedback submits general feedback', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-engagement', 'POST', 'feedback', {
        category: 'general',
        subject: 'Question',
        message: 'How do I add a new user?',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.feedback).toBeDefined();
      expect(sharedState.store.get('client_feedback_submissions')?.length).toBe(1);
    });

    it('S4-T5 POST /feedback rejects missing message → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-engagement', 'POST', 'feedback', {
        subject: 'No message',
      }), res);
      expect(res._c).toBe(400);
      expect(res._d?.error).toMatch(/message is required/);
    });
  });

  // ── Suite 5: Cross-module & data integrity ──────────────────────────
  describe('Suite 5 — Cross-module & data integrity', () => {
    it('S5-T1 client-portal 404 for unknown route', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('client-portal', 'GET', 'this-route-does-not-exist'), res);
      expect(res._c).toBe(404);
      expect(res._d?.error).toMatch(/not found/i);
    });

    it('S5-T2 workflow approval reject updates status to rejected', async () => {
      sharedState.store.set('client_approvals', [
        { id: 'appr-002', workflow_id: 'wf-001', node_id: 'n1', approver_id: 'acct-001', status: 'pending', decision: null, comments: null, created_at: new Date().toISOString(), decided_at: null },
      ]);
      const res = makeRes();
      await dispatchHandler(makeReq('client-workflow', 'POST', 'approvals/appr-002/reject', {
        comments: 'Not suitable',
      }), res);
      expect(res._c).toBe(200);
      // update() returns array — verify via store
      const appr = (sharedState.store.get('client_approvals') || []).find((a: any) => a.id === 'appr-002');
      expect(appr?.status).toBe('rejected');
      // Verify the update was recorded
      const apprUpdates = sharedState.updateCalls.filter(u => u.table === 'client_approvals');
      expect(apprUpdates.length).toBeGreaterThanOrEqual(1);
    });
  });
});
