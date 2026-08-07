/**
 * Phase 7 — Reports & Documents FULL-REQUEST-PATH integration tests.
 *
 * Exercises the REAL routing chain:
 *   Vercel-style (req, res) → dispatch() in dispatch.ts → dynamic
 *   import() of reportsHandler (handleReports) → real handler logic
 *   with in-memory supabaseRest mock.
 *
 * Handler routes (via dispatch.ts → req.query.path segments):
 *   GET    /api/reports/templates          — List templates
 *   GET    /api/reports                     — List reports (?status=&templateId=)
 *   POST   /api/reports/generate            — Generate report
 *   GET    /api/reports/:id                 — Get single report
 *   PATCH  /api/reports/:id                 — Update report
 *   DELETE /api/reports/:id                 — Delete report
 *   POST   /api/reports/:id/export          — Export report
 *   POST   /api/reports/schedule            — Schedule recurring report
 *   GET    /api/reports/schedules           — List schedules
 *   DELETE /api/reports/schedules/:id       — Delete schedule
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

// Mock the report generator library (avoids PDF/DOCX file system writes in tests)
vi.mock('../../../api/_lib/reportGenerator', () => ({
  generateReport: vi.fn(async (opts: any) => {
    const template = opts.templateId;
    return {
      success: true,
      format: opts.format || 'PDF',
      templateId: template,
      filename: `LYC_${template}_${Date.now()}.pdf`,
      pageCount: 3,
      status: 'completed',
      data: {
        header: { title: `Test Report: ${template}` },
        sections: [{ id: 's1', title: 'Summary', content: 'Test content', order: 0 }],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      },
    };
  }),
}));

vi.mock('../../../api/_lib/supabaseRest', async () => {
  const local: { store: Map<string, any[]> } = { store: new Map() };
  const updateCalls: { table: string; filter: any; patch: any }[] = [];

  const matchWhere = (rows: any[], where: any[]) => {
    let out = rows;
    for (const w of where) {
      const col = w.column ?? w.col;
      const val = w.value ?? w.val;
      out = out.filter((r: any) => r[col] === val);
    }
    return out;
  };

  const pick = (table: string, opts: any) => {
    let rows = (local.store.get(table) || []).slice();
    if (opts?.where && Array.isArray(opts.where)) {
      rows = matchWhere(rows, opts.where);
    }
    if (opts?.orderBy) {
      const ob = Array.isArray(opts.orderBy) ? opts.orderBy[0] : opts.orderBy;
      const col = ob.column ?? ob.col;
      const asc = ob.ascending ?? (ob.order !== 'desc');
      rows.sort((a: any, b: any) => {
        if (a[col] < b[col]) return asc ? -1 : 1;
        if (a[col] > b[col]) return asc ? 1 : -1;
        return 0;
      });
    }
    return rows;
  };

  return {
    isSupabaseConfigured: () => true,
    __shared: local,
    __updateCalls: updateCalls,
    selectOne: async (table: string, opts: any) => {
      const rows = pick(table, opts);
      return rows[0] || null;
    },
    selectMany: async (table: string, opts: any) => pick(table, opts),
    insert: async (table: string, row: any) => {
      const withId = row.id ? row : { ...row, id: crypto.randomUUID() };
      const list = local.store.get(table) || [];
      list.push({ ...withId, created_at: withId.created_at || new Date().toISOString(), updated_at: new Date().toISOString() });
      local.store.set(table, list);
      return withId;
    },
    update: async (table: string, filter: any, patch: any) => {
      updateCalls.push({ table, filter, patch });
      const rows = local.store.get(table) || [];
      const col = filter.column;
      const val = filter.value;
      const updated: any[] = [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][col] === val) {
          rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
          updated.push(rows[i]);
        }
      }
      local.store.set(table, rows);
      return updated;
    },
    remove: async (table: string, filter: any) => {
      const rows = local.store.get(table) || [];
      const col = filter.column;
      const val = filter.value;
      const before = rows.length;
      const filtered = rows.filter((r: any) => r[col] !== val);
      local.store.set(table, filtered);
      return before - filtered.length;
    },
    handleError: (res: any, _ctx: string, err: any) => {
      res.status(500).json({ success: false, error: err?.message || 'error' });
    },
  };
});

import dispatch from '../../../api/dispatch';
import * as supabaseRestMock from '../../../api/_lib/supabaseRest';

const store = (): Map<string, any[]> => (supabaseRestMock as any).__shared.store;
const getUpdateCalls = (): any[] => (supabaseRestMock as any).__updateCalls;

const TEST_USER = {
  id: 'test-user-0000-0000-0000-000000000001',
  email: 'test@example.com',
  role: 'consultant',
};

function makeReq(method: string, sub: string, body?: any, query?: Record<string, string>) {
  const req: any = {
    method,
    url: `http://localhost/api/reports/${sub}`,
    query: { __mod: 'reports', __sub: sub, ...(query || {}) },
    body,
    headers: { authorization: 'Bearer test-jwt' },
  };
  return req;
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(c: number) { this.statusCode = c; return this; },
    json(d: any) { this.body = d; return this; },
    setHeader() {},
  };
  return res;
}

function seedReport(overrides: Partial<any> = {}) {
  const id = overrides.id || crypto.randomUUID();
  const row = {
    id,
    template_id: 'assessment-report',
    template_name: 'Assessment Report',
    format: 'PDF',
    status: 'completed',
    title: 'Test Report',
    sections: [{ id: 's1', title: 'Summary', content: 'Content', order: 0 }],
    tables: [],
    charts: [],
    header: { title: 'Test Report' },
    footer: {},
    download_url: 'test.pdf',
    created_by: TEST_USER.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  const list = store().get('reports') || [];
  list.push(row);
  store().set('reports', list);
  return row;
}

function seedSchedule(overrides: Partial<any> = {}) {
  const id = overrides.id || crypto.randomUUID();
  const row = {
    id,
    template_id: 'assessment-report',
    template_name: 'Assessment Report',
    format: 'PDF',
    frequency: 'weekly',
    next_run_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    last_run_at: null,
    status: 'scheduled',
    context: {},
    export_options: {},
    created_by: TEST_USER.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  const list = store().get('report_schedules') || [];
  list.push(row);
  store().set('report_schedules', list);
  return row;
}

beforeEach(() => {
  store().clear();
  getUpdateCalls().length = 0;
  authState.user = TEST_USER;
  authState.error = null;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────
// FP-P7-01..06: Dispatch routing + auth
// ────────────────────────────────────────────────────────────────────────
describe('Phase 7 Full-Path — dispatch & auth', () => {
  it('FP-P7-01: dispatch resolves reports module (NOT 404 — proves .then() adapter works)', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', ''), r);
    expect(r.statusCode).not.toBe(404);
    expect(r.statusCode).not.toBe(500);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('FP-P7-02: unauthenticated user → 401 at dispatch auth layer', async () => {
    authState.user = null;
    authState.error = 'No token';
    const r = makeRes();
    await dispatch(makeReq('GET', ''), r);
    expect(r.statusCode).toBe(401);
  });

  it('FP-P7-03: authenticated user → 200 on GET /reports', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', ''), r);
    expect(r.statusCode).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('FP-P7-04: GET /reports/templates returns 8 templates (from REPORT_TEMPLATES)', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', 'templates'), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toHaveLength(8);
    expect(r.body[0]).toHaveProperty('id');
    expect(r.body[0]).toHaveProperty('name');
    expect(r.body[0]).toHaveProperty('category');
  });

  it('FP-P7-05: unknown sub-route → 404', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', 'unknown-sub-resource'), r);
    expect(r.statusCode).toBe(404);
  });

  it('FP-P7-06: wrong method on known route → 404', async () => {
    const r = makeRes();
    await dispatch(makeReq('PUT', 'templates'), r);
    expect(r.statusCode).toBe(404);
  });
});

// ────────────────────────────────────────────────────────────────────────
// FP-P7-10..19: Reports CRUD
// ────────────────────────────────────────────────────────────────────────
describe('Phase 7 Full-Path — reports CRUD', () => {
  it('FP-P7-10: GET /reports returns empty list when none exist', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', ''), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toEqual([]);
  });

  it('FP-P7-11: GET /reports returns seeded reports', async () => {
    seedReport({ title: 'Report A' });
    seedReport({ title: 'Report B' });
    const r = makeRes();
    await dispatch(makeReq('GET', ''), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toHaveLength(2);
    // Verify response uses camelCase (mapped from DB snake_case)
    expect(r.body[0]).toHaveProperty('templateId');
    expect(r.body[0]).toHaveProperty('templateName');
    expect(r.body[0]).toHaveProperty('downloadUrl');
    expect(r.body[0]).not.toHaveProperty('template_id');
  });

  it('FP-P7-12: GET /reports?status=completed filters correctly', async () => {
    seedReport({ status: 'completed', title: 'Done' });
    seedReport({ status: 'failed', title: 'Failed' });
    const r = makeRes();
    await dispatch(makeReq('GET', '', undefined, { status: 'completed' }), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].status).toBe('completed');
  });

  it('FP-P7-13: GET /reports?templateId=coaching-report filters correctly', async () => {
    seedReport({ template_id: 'coaching-report', title: 'Coaching' });
    seedReport({ template_id: 'assessment-report', title: 'Assessment' });
    const r = makeRes();
    await dispatch(makeReq('GET', '', undefined, { templateId: 'coaching-report' }), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].templateId).toBe('coaching-report');
  });

  it('FP-P7-14: POST /generate creates report in DB and returns reportId', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'generate', {
      templateId: 'assessment-report',
      format: 'PDF',
      context: { data: { summary: 'Test summary' } },
    }), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.reportId).toBeDefined();
    expect(r.body.downloadUrl).toBeDefined();
    // Verify it was persisted to DB
    const reports = store().get('reports') || [];
    expect(reports).toHaveLength(1);
    expect(reports[0].template_id).toBe('assessment-report');
    expect(reports[0].status).toBe('completed');
  });

  it('FP-P7-15: POST /generate without templateId → 400', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'generate', { format: 'PDF' }), r);
    expect(r.statusCode).toBe(400);
    expect(r.body.error).toMatch(/templateId/);
  });

  it('FP-P7-16: POST /generate with invalid templateId → 404', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'generate', { templateId: 'nonexistent' }), r);
    expect(r.statusCode).toBe(404);
    expect(r.body.error).toMatch(/Template not found/);
  });

  it('FP-P7-17: GET /reports/:id returns single report', async () => {
    const report = seedReport({ title: 'Single Report' });
    const r = makeRes();
    await dispatch(makeReq('GET', report.id), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.title).toBe('Single Report');
    expect(r.body.id).toBe(report.id);
  });

  it('FP-P7-18: GET /reports/:id → 404 for nonexistent id', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', 'nonexistent-id'), r);
    expect(r.statusCode).toBe(404);
  });

  it('FP-P7-19: PATCH /reports/:id updates title and sections', async () => {
    const report = seedReport({ title: 'Original' });
    const r = makeRes();
    await dispatch(makeReq('PATCH', report.id, {
      title: 'Updated Title',
      sections: [{ id: 's2', title: 'New Section', content: 'New', order: 0 }],
    }), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.title).toBe('Updated Title');
    expect(r.body.sections).toHaveLength(1);
    expect(r.body.sections[0].title).toBe('New Section');
  });

  it('FP-P7-20: PATCH /reports/:id → 404 for nonexistent id', async () => {
    const r = makeRes();
    await dispatch(makeReq('PATCH', 'nonexistent-id', { title: 'X' }), r);
    expect(r.statusCode).toBe(404);
  });

  it('FP-P7-21: DELETE /reports/:id removes report', async () => {
    const report = seedReport();
    const r = makeRes();
    await dispatch(makeReq('DELETE', report.id), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.success).toBe(true);
    const reports = store().get('reports') || [];
    expect(reports).toHaveLength(0);
  });

  it('FP-P7-22: DELETE /reports/:id → 404 for nonexistent id', async () => {
    const r = makeRes();
    await dispatch(makeReq('DELETE', 'nonexistent-id'), r);
    expect(r.statusCode).toBe(404);
  });
});

// ────────────────────────────────────────────────────────────────────────
// FP-P7-30..37: Export endpoint
// ────────────────────────────────────────────────────────────────────────
describe('Phase 7 Full-Path — export', () => {
  it('FP-P7-30: POST /reports/:id/export returns download URL', async () => {
    const report = seedReport();
    const r = makeRes();
    await dispatch(makeReq('POST', `${report.id}/export`, { format: 'PDF' }), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.downloadUrl).toBeDefined();
  });

  it('FP-P7-31: POST /reports/:id/export → 404 for nonexistent id', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'nonexistent-id/export', { format: 'PDF' }), r);
    expect(r.statusCode).toBe(404);
  });

  it('FP-P7-32: POST /reports/:id/export updates download_url in DB', async () => {
    const report = seedReport({ download_url: null });
    getUpdateCalls().length = 0;
    const r = makeRes();
    await dispatch(makeReq('POST', `${report.id}/export`, { format: 'PDF' }), r);
    expect(r.statusCode).toBe(200);
    const calls = getUpdateCalls().filter(c => c.table === 'reports');
    expect(calls.length).toBe(1);
    expect(calls[0].patch).toHaveProperty('download_url');
  });
});

// ────────────────────────────────────────────────────────────────────────
// FP-P7-40..47: Schedules
// ────────────────────────────────────────────────────────────────────────
describe('Phase 7 Full-Path — schedules', () => {
  it('FP-P7-40: GET /reports/schedules returns empty list', async () => {
    const r = makeRes();
    await dispatch(makeReq('GET', 'schedules'), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toEqual([]);
  });

  it('FP-P7-41: GET /reports/schedules returns seeded schedules', async () => {
    seedSchedule({ template_name: 'Weekly Assessment' });
    const r = makeRes();
    await dispatch(makeReq('GET', 'schedules'), r);
    expect(r.statusCode).toBe(200);
    expect(r.body).toHaveLength(1);
    expect(r.body[0].templateName).toBe('Weekly Assessment');
    expect(r.body[0]).toHaveProperty('nextRunAt');
    expect(r.body[0]).toHaveProperty('frequency');
  });

  it('FP-P7-42: POST /reports/schedule creates schedule in DB', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'schedule', {
      templateId: 'assessment-report',
      format: 'PDF',
      frequency: 'daily',
      context: { data: {} },
    }), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.scheduleId).toBeDefined();
    // Verify persisted
    const schedules = store().get('report_schedules') || [];
    expect(schedules).toHaveLength(1);
    expect(schedules[0].frequency).toBe('daily');
  });

  it('FP-P7-43: POST /reports/schedule without templateId → 400', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'schedule', { frequency: 'daily' }), r);
    expect(r.statusCode).toBe(400);
  });

  it('FP-P7-44: POST /reports/schedule with invalid templateId → 404', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'schedule', { templateId: 'nonexistent' }), r);
    expect(r.statusCode).toBe(404);
  });

  it('FP-P7-45: POST /reports/schedule computes next_run_at based on frequency', async () => {
    const r = makeRes();
    await dispatch(makeReq('POST', 'schedule', {
      templateId: 'coaching-report',
      frequency: 'monthly',
    }), r);
    expect(r.statusCode).toBe(200);
    const schedules = store().get('report_schedules') || [];
    expect(schedules).toHaveLength(1);
    const nextRun = new Date(schedules[0].next_run_at);
    const now = new Date();
    const diffDays = (nextRun.getTime() - now.getTime()) / 86400000;
    expect(diffDays).toBeGreaterThan(27); // monthly ≈ 30 days
  });

  it('FP-P7-46: DELETE /reports/schedules/:id removes schedule', async () => {
    const schedule = seedSchedule();
    const r = makeRes();
    await dispatch(makeReq('DELETE', `schedules/${schedule.id}`), r);
    expect(r.statusCode).toBe(200);
    expect(r.body.success).toBe(true);
    const schedules = store().get('report_schedules') || [];
    expect(schedules).toHaveLength(0);
  });

  it('FP-P7-47: DELETE /reports/schedules/:id → 404 for nonexistent', async () => {
    const r = makeRes();
    await dispatch(makeReq('DELETE', 'schedules/nonexistent-id'), r);
    expect(r.statusCode).toBe(404);
  });
});

// ────────────────────────────────────────────────────────────────────────
// FP-P7-50..52: Data integrity — verify update calls use {column, value} filters
// ────────────────────────────────────────────────────────────────────────
describe('Phase 7 Full-Path — data integrity (update filter safety)', () => {
  it('FP-P7-50: PATCH /reports/:id uses {column: "id", value: reportId} filter', async () => {
    const report = seedReport();
    getUpdateCalls().length = 0;
    const r = makeRes();
    await dispatch(makeReq('PATCH', report.id, { title: 'Safe Update' }), r);
    expect(r.statusCode).toBe(200);
    const calls = getUpdateCalls().filter(c => c.table === 'reports');
    expect(calls.length).toBe(1);
    expect(calls[0].filter).toEqual({ column: 'id', value: report.id });
  });

  it('FP-P7-51: POST /reports/:id/export uses {column: "id", value: reportId} filter', async () => {
    const report = seedReport();
    getUpdateCalls().length = 0;
    const r = makeRes();
    await dispatch(makeReq('POST', `${report.id}/export`, { format: 'PDF' }), r);
    expect(r.statusCode).toBe(200);
    const calls = getUpdateCalls().filter(c => c.table === 'reports');
    expect(calls.length).toBe(1);
    expect(calls[0].filter).toEqual({ column: 'id', value: report.id });
  });

  it('FP-P7-52: All update calls across full workflow use safe {column, value} filters', async () => {
    // Generate a report
    const r1 = makeRes();
    await dispatch(makeReq('POST', 'generate', {
      templateId: 'assessment-report',
      format: 'PDF',
      context: { data: {} },
    }), r1);
    expect(r1.statusCode).toBe(200);
    const reportId = r1.body.reportId;

    getUpdateCalls().length = 0;

    // PATCH it
    const r2 = makeRes();
    await dispatch(makeReq('PATCH', reportId, { title: 'Updated' }), r2);
    expect(r2.statusCode).toBe(200);

    // Export it
    const r3 = makeRes();
    await dispatch(makeReq('POST', `${reportId}/export`, { format: 'PDF' }), r3);
    expect(r3.statusCode).toBe(200);

    // Every single update call must use {column, value}
    const allCalls = getUpdateCalls();
    expect(allCalls.length).toBeGreaterThanOrEqual(2);
    for (const call of allCalls) {
      expect(call.filter).toBeDefined();
      expect(typeof call.filter).toBe('object');
      expect(call.filter.column).toBe('id');
      expect(call.filter.value).toBeDefined();
    }
  });
});
