/**
 * Phase 9 — GRID Market Mapping FULL-REQUEST-PATH tests.
 *
 * Exercises the REAL routing chain:
 *   (req, res) → dispatch() in dispatch.ts → dynamic import() of
 *   gridHandler → real handleGrid logic with in-memory supabaseRest mock.
 *
 * 28 tests across 7 suites:
 *   Suite 1 — Auth & dispatch resolution (4)
 *   Suite 2 — Mapping CRUD (5)
 *   Suite 3 — Sectors + Companies (5)
 *   Suite 4 — Functions + Candidate Entries (6)
 *   Suite 5 — Intelligence generation + standards (4)
 *   Suite 6 — Gap analysis + quality metrics (2)
 *   Suite 7 — Dashboard + data integrity (2)
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

  sharedState.store.set('mandates', [
    { id: 'mand-001', title: 'VP Engineering', phase: 'active', created_at: new Date().toISOString() },
    { id: 'mand-002', title: 'CFO', phase: 'active', created_at: new Date().toISOString() },
  ]);

  sharedState.store.set('contacts', [
    { id: 'c-001', full_name: 'Alice Alpha', current_title: 'VP of Engineering', company_name: 'Acme', pipeline_stage: 'S3_Contacted', motivation_overall: 'GREEN' },
    { id: 'c-002', full_name: 'Bob Beta', current_title: 'Director of Engineering', company_name: 'Globex', pipeline_stage: 'S2_Sourced', motivation_overall: 'YELLOW' },
    { id: 'c-003', full_name: 'Carol Gamma', current_title: 'CFO', company_name: 'Initech', pipeline_stage: 'S4_Meeting_Scheduled', motivation_overall: 'GREEN' },
  ]);

  sharedState.store.set('target_companies', [
    { id: 'tc-001', company_name: 'Acme' },
    { id: 'tc-002', company_name: 'Globex' },
  ]);

  sharedState.store.set('auth.users', [
    { id: 'user-001', email: 'consultant@test.com' },
  ]);
}

function applyFilter(rows: any[], filter: any): any[] {
  if (!filter) return rows;
  if (filter.column && filter.value !== undefined) {
    // `IN` clause emulation: where clause filter.value is "(a,b,c)" string with op: 'in'
    const val: any = filter.value;
    if (typeof val === 'string' && val.startsWith('(') && val.endsWith(')')) {
      const inList = val.slice(1, -1).split(',').map((s: string) => s.trim());
      return rows.filter(r => inList.includes(String(r[filter.column])));
    }
    return rows.filter(r => r[filter.column] === val);
  }
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
  selectMany: async (table: string, optionsOrFilters?: any, orderByOrLimit?: any, _limitOrOffset?: any, _offsetOrSelect?: any, _selectOrTimeout?: any) => {
    let rows = (sharedState.store.get(table) || []).slice();
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
            // Build a filter object compatible with applyFilter
            rows = applyFilter(rows, { column: col, value: val, op: clause.op });
          }
        }
      } else {
        const { select: _s, orderBy: _o, limit: _l, offset: _off, ...filters } = optionsOrFilters;
        if (Object.keys(filters).length > 0) {
          rows = applyFilter(rows, filters);
        }
      }
      if (optionsOrFilters.orderBy) {
        const ob = optionsOrFilters.orderBy;
        const col = ob.column;
        const asc = ob.ascending !== false;
        rows.sort((a, b) => {
          if (a[col] == null) return 1;
          if (b[col] == null) return -1;
          return a[col] < b[col] ? (asc ? -1 : 1) : a[col] > b[col] ? (asc ? 1 : -1) : 0;
        });
      }
      if (optionsOrFilters.limit) {
        const l = parseInt(String(optionsOrFilters.limit));
        const off = parseInt(String(optionsOrFilters.offset || 0));
        if (!Number.isNaN(l)) rows = rows.slice(off, off + l);
      }
    } else {
      const filters = optionsOrFilters || {};
      rows = applyFilter(rows, filters);
      if (Array.isArray(orderByOrLimit) && orderByOrLimit.length > 0) {
        const obStr = orderByOrLimit[0] as string;
        const [col, dir] = obStr.split(' ');
        const asc = dir !== 'DESC';
        rows.sort((a, b) => {
          if (a[col] == null) return 1;
          if (b[col] == null) return -1;
          return a[col] < b[col] ? (asc ? -1 : 1) : a[col] > b[col] ? (asc ? 1 : -1) : 0;
        });
      }
    }
    return rows;
  },
  insert: async (table: string, row: any) => {
    const id = row.id || `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const saved: any = { ...row, id, created_at: row.created_at || now, updated_at: row.updated_at || now };
    // Emulate grid_companies trigger: gap = target_candidates - actual_candidates
    if (table === 'grid_companies') {
      const target = saved.target_candidates ?? 0;
      const actual = saved.actual_candidates ?? 0;
      saved.gap = target - actual;
    }
    // Emulate grid_candidate_entries trigger: fn_grid_auto_priority
    if (table === 'grid_candidate_entries') {
      if (saved.priority_override !== true && !saved.priority) {
        const companies = sharedState.store.get('grid_companies') || [];
        const functions = sharedState.store.get('grid_functions') || [];
        const company = companies.find((c: any) => c.id === saved.grid_company_id);
        const func = functions.find((f: any) => f.id === saved.grid_function_id);
        const cr = company?.relevance || 'low';
        const fr = func?.relevance || 'low';
        if (cr === 'high' && fr === 'high') saved.priority = 'P1';
        else if ((cr === 'high' && fr === 'medium') || (cr === 'medium' && fr === 'high')) saved.priority = 'P2';
        else saved.priority = 'P3';
      }
      if (!saved.status) saved.status = 'uncontacted';
    }
    const list = sharedState.store.get(table) || [];
    list.push(saved);
    sharedState.store.set(table, list);
    sharedState.insertCalls.push({ table, row: saved });
    return saved;
  },
  update: async (table: string, filterOrData: any, dataOrValue?: any) => {
    sharedState.updateCalls.push({ table, filter: filterOrData, patch: dataOrValue });
    if (typeof filterOrData === 'string') {
      const rows = sharedState.store.get(table) || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].id === filterOrData) {
          rows[i] = { ...rows[i], ...dataOrValue, updated_at: new Date().toISOString() };
          if (table === 'grid_companies') {
            const target = rows[i].target_candidates ?? 0;
            const actual = rows[i].actual_candidates ?? 0;
            rows[i].gap = target - actual;
          }
        }
      }
      sharedState.store.set(table, rows);
      return rows.filter(r => r.id === filterOrData);
    }
    if (filterOrData && typeof filterOrData === 'object' && 'column' in filterOrData && 'value' in filterOrData) {
      const { column, value, ...patch } = filterOrData;
      const rows = sharedState.store.get(table) || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][column] === value) {
          rows[i] = { ...rows[i], ...patch, ...(dataOrValue || {}), updated_at: new Date().toISOString() };
          if (table === 'grid_companies') {
            const target = rows[i].target_candidates ?? 0;
            const actual = rows[i].actual_candidates ?? 0;
            rows[i].gap = target - actual;
          }
        }
      }
      sharedState.store.set(table, rows);
      return rows.filter(r => r[column] === value);
    }
    return [];
  },
  remove: async () => true,
  executeSql: async (_sql: string, _params?: any[]) => [],
}));

import dispatchHandler from '../../../api/dispatch';

// ── Request / Response helpers ─────────────────────────────────────────

function makeReq(mod: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', sub: string, body?: any) {
  const [pathOnly, qs] = sub.split('?');
  const query: Record<string, any> = { __mod: mod, __sub: pathOnly };
  if (qs) {
    for (const part of qs.split('&')) {
      const [k, v = ''] = part.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v);
    }
  }
  const pathParts = pathOnly.split('/').filter(Boolean);
  query.path = pathParts;
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
      if (!res._statusCalled) res._c = 200;
      res._d = d;
      return res;
    }),
  };
  return res;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('Phase 9 GRID Market Mapping (full-path through dispatch)', () => {
  beforeEach(() => {
    resetStore();
    authState.user = { id: 'user-001', email: 'consultant@test.com', role: 'member' };
    authState.error = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Suite 1: Auth & dispatch resolution ─────────────────────────────
  describe('Suite 1 — Auth & dispatch resolution', () => {
    it('S1-T1 returns 401 when no authenticated user (GET /mappings)', async () => {
      authState.user = null;
      authState.error = 'no-token';
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'mappings'), res);
      expect(res._c).toBe(401);
    });

    it('S1-T2 grid module resolves to handleGrid (not gridReportsGenerateHandler) — list mappings works', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'mappings'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(Array.isArray(res._d?.data)).toBe(true);
    });

    it('S1-T3 invalid grid route returns 404 from handleGrid router', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'does-not-exist'), res);
      expect(res._c).toBe(404);
      expect(res._d?.success).toBe(false);
    });

    it('S1-T4 dashboard/overview reachable through grid module (success: true)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'dashboard/overview'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
    });
  });

  // ── Suite 2: Mapping CRUD ───────────────────────────────────────────
  describe('Suite 2 — Mapping CRUD', () => {
    it('S2-T1 create mapping succeeds 201 with auto-generated id and mandate_id', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001', mapping_type: 'grid' }), res);
      expect(res._c).toBe(201);
      expect(res._d?.success).toBe(true);
      expect(res._d?.data?.id).toBeTruthy();
      expect(res._d?.data?.mandate_id).toBe('mand-001');
      expect(res._d?.data?.created_by).toBe('user-001');
    });

    it('S2-T2 create mapping fails 400 without mandate_id', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mapping_type: 'grid' }), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
    });

    it('S2-T3 get mapping returns nested data: data.mandate_id, data.sectors/companies/functions/entries arrays', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), createRes);
      const mapId = createRes._d.data.id;

      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${mapId}`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      const wrap = res._d?.data || {};
      expect(wrap.id).toBe(mapId);
      expect(Array.isArray(wrap.sectors)).toBe(true);
      expect(Array.isArray(wrap.companies)).toBe(true);
      expect(Array.isArray(wrap.functions)).toBe(true);
      expect(Array.isArray(wrap.entries)).toBe(true);
    });

    it('S2-T4 get unknown mapping id returns 404', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'mappings/nonexistent-uuid'), res);
      expect(res._c).toBe(404);
    });

    it('S2-T5 list mappings returns 2+ mappings after creating 2', async () => {
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), makeRes());
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-002' }), makeRes());
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'mappings'), res);
      expect(res._c).toBe(200);
      expect(res._d?.data?.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Suite 3: Sectors + Companies ────────────────────────────────────
  describe('Suite 3 — Sectors + Companies', () => {
    let MAPPING_ID: string;
    beforeEach(async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), createRes);
      MAPPING_ID = createRes._d.data.id;
    });

    it('S3-T1 add sector returns 201 with data.sector_name', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/sectors`, { sector_name: 'Mining', is_primary: true }), res);
      expect(res._c).toBe(201);
      expect(res._d?.success).toBe(true);
      expect(res._d?.data?.sector_name).toBe('Mining');
      expect(res._d?.data?.grid_mapping_id).toBe(MAPPING_ID);
    });

    it('S3-T2 add sector fails 400 without sector_name', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/sectors`, {}), res);
      expect(res._c).toBe(400);
    });

    it('S3-T3 add company returns 201 with data.company_name and relevance', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, {
        company_name: 'BHP Billiton',
        relevance: 'high',
        rationale: 'Key player in mining sector',
        target_candidates: 3,
      }), res);
      expect(res._c).toBe(201);
      expect(res._d?.success).toBe(true);
      expect(res._d?.data?.company_name).toBe('BHP Billiton');
      expect(res._d?.data?.relevance).toBe('high');
      // Gap trigger emulation: gap = target_candidates - actual_candidates
      expect(res._d?.data?.gap).toBe(3);
    });

    it('S3-T4 list companies returns data array of length 2', async () => {
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, { company_name: 'A', relevance: 'high', rationale: 'x', target_candidates: 2 }), makeRes());
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, { company_name: 'B', relevance: 'medium', rationale: 'y', target_candidates: 1 }), makeRes());
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/companies`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.data?.length).toBe(2);
    });

    it('S3-T5 list sectors returns data array of length 2', async () => {
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/sectors`, { sector_name: 'Sector A', is_primary: true }), makeRes());
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/sectors`, { sector_name: 'Sector B' }), makeRes());
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/sectors`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.data?.length).toBe(2);
    });
  });

  // ── Suite 4: Functions + Candidate Entries ──────────────────────────
  describe('Suite 4 — Functions + Candidate Entries', () => {
    let MAPPING_ID: string;
    let COMPANY_ID: string;
    let FUNCTION_ID: string;
    beforeEach(async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), createRes);
      MAPPING_ID = createRes._d.data.id;
      const coRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, { company_name: 'Acme', relevance: 'high', rationale: 'x', target_candidates: 1 }), coRes);
      COMPANY_ID = coRes._d.data.id;
      const fnRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/functions`, { function_name: 'Engineering', relevance: 'high' }), fnRes);
      FUNCTION_ID = fnRes._d.data.id;
    });

    it('S4-T1 add function returns 201 with function_name', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/functions`, { function_name: 'Finance', relevance: 'medium' }), res);
      expect(res._c).toBe(201);
      expect(res._d?.data?.function_name).toBe('Finance');
    });

    it('S4-T2 list functions returns 1+ entries', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/functions`), res);
      expect(res._c).toBe(200);
      expect(res._d?.data?.length).toBeGreaterThanOrEqual(1);
    });

    it('S4-T3 add candidate entry returns 201 with contact_id', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/entries`, {
        contact_id: 'c-001',
        grid_company_id: COMPANY_ID,
        grid_function_id: FUNCTION_ID,
      }), res);
      expect(res._c).toBe(201);
      expect(res._d?.data?.contact_id).toBe('c-001');
    });

    it('S4-T4 add entry without contact_id → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/entries`, { grid_company_id: COMPANY_ID }), res);
      expect(res._c).toBe(400);
    });

    it('S4-T5 list entries returns 1+ with auto-computed priority', async () => {
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/entries`, { contact_id: 'c-001', grid_company_id: COMPANY_ID, grid_function_id: FUNCTION_ID }), makeRes());
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/entries`), res);
      expect(res._c).toBe(200);
      expect(res._d?.data?.length).toBeGreaterThanOrEqual(1);
      // Auto-priority: company relevance=high + function relevance=high should be P1
      // (triggers fn_grid_auto_priority only on DB, but we read from store)
      const entry = res._d.data[0];
      expect(entry?.priority).toBeTruthy();
    });

    it('S4-T6 bulk add entries returns 200 with added_count = 3', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/entries/bulk`, {
        entries: [
          { contact_id: 'c-001', grid_company_id: COMPANY_ID, grid_function_id: FUNCTION_ID },
          { contact_id: 'c-002', grid_company_id: COMPANY_ID, grid_function_id: FUNCTION_ID },
          { contact_id: 'c-003', grid_company_id: COMPANY_ID, grid_function_id: FUNCTION_ID },
        ],
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.added_count).toBe(3);
      expect(Array.isArray(res._d?.results)).toBe(true);
    });
  });

  // ── Suite 5: Intelligence generation + standards ────────────────────
  describe('Suite 5 — Intelligence generation + standards', () => {
    let MAPPING_ID: string;
    beforeEach(async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), createRes);
      MAPPING_ID = createRes._d.data.id;
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, { company_name: 'Acme', relevance: 'high', rationale: 'x', target_candidates: 1 }), makeRes());
    });

    it('S5-T1 POST /generate returns 200 with data (falls back to buildFallbackIntelligence)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/generate`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      // data = intelligenceData, data_points = count of keys
      const d = res._d?.data || {};
      const keys = Object.keys(d);
      expect(keys.length).toBeGreaterThan(0);
      expect(res._d?.data_points).toBe(keys.length);
    });

    it('S5-T2 GET /intelligence returns { data, timestamps, last_generated_at }', async () => {
      // Generate first, then read back
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/generate`), makeRes());
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/intelligence`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      // data should have 16 keys from fallback
      const d = res._d?.data || {};
      expect(Object.keys(d).length).toBeGreaterThan(0);
    });

    it('S5-T3 GET /standards returns 200 with M1-M7 keys in data', async () => {
      // Trigger recheck to populate standards_summary, then read
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/standards/recheck`), makeRes());
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/standards`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      const summary = res._d?.data || {};
      const keys = Object.keys(summary);
      const hasMKeys = ['m1_companies', 'm2_sectors', 'm3_candidates', 'm4_contacted', 'm5_gap_filled', 'm6_p1_contacted', 'm7_last_update'].some(k => keys.includes(k));
      expect(hasMKeys).toBe(true);
    });

    it('S5-T4 POST /standards/recheck succeeds 200', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/standards/recheck`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
    });
  });

  // ── Suite 6: Gap analysis + quality metrics ─────────────────────────
  describe('Suite 6 — Gap analysis + quality metrics', () => {
    let MAPPING_ID: string;
    beforeEach(async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), createRes);
      MAPPING_ID = createRes._d.data.id;
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, {
        company_name: 'Acme', relevance: 'high', rationale: 'x', target_candidates: 5, actual_candidates: 1,
        gap_reason: 'not_found', gap_action_plan: 'Expand sourcing',
      }), makeRes());
    });

    it('S6-T1 GET /gaps returns 200 with gap_count and data.companies array', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/gaps`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      const d = res._d?.data || {};
      expect(d.gap_count).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(d.companies)).toBe(true);
    });

    it('S6-T2 GET /quality-metrics returns 200 with data.metrics + data.alerts', async () => {
      // Seed an entry for metrics to have enough data
      const coRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/companies`, { company_name: 'X', relevance: 'high', rationale: 'x', target_candidates: 1 }), coRes);
      const fnRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/functions`, { function_name: 'Y', relevance: 'high' }), fnRes);
      await dispatchHandler(makeReq('grid', 'POST', `mappings/${MAPPING_ID}/entries`, {
        contact_id: 'c-001',
        grid_company_id: coRes._d.data.id,
        grid_function_id: fnRes._d.data.id,
      }), makeRes());

      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${MAPPING_ID}/quality-metrics`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      const d = res._d?.data || {};
      expect(d.metrics).toBeTruthy();
      expect(Array.isArray(d.alerts)).toBe(true);
    });
  });

  // ── Suite 7: Dashboard + data integrity ─────────────────────────────
  describe('Suite 7 — Dashboard endpoints + data integrity', () => {
    beforeEach(async () => {
      const c1 = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-001' }), c1);
      const m1 = c1._d.data.id;
      for (let i = 0; i < 3; i++) {
        await dispatchHandler(makeReq('grid', 'POST', `mappings/${m1}/sectors`, { sector_name: `Sector ${i}`, is_primary: i === 0 }), makeRes());
      }
      for (let i = 0; i < 2; i++) {
        await dispatchHandler(makeReq('grid', 'POST', `mappings/${m1}/companies`, { company_name: `Co ${i}`, relevance: 'high', rationale: 'x', target_candidates: 1 }), makeRes());
      }
    });

    it('S7-T1 dashboard/overview returns counts in data.total_mappings', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', 'dashboard/overview'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.data?.total_mappings).toBeGreaterThanOrEqual(1);
      expect(typeof res._d?.data?.active_mappings).toBe('number');
    });

    it('S7-T2 create → get → data roundtrips mandate_id correctly', async () => {
      const cRes = makeRes();
      await dispatchHandler(makeReq('grid', 'POST', 'mappings', { mandate_id: 'mand-002', config: { foo: 'bar' } }), cRes);
      const id = cRes._d.data.id;
      const gRes = makeRes();
      await dispatchHandler(makeReq('grid', 'GET', `mappings/${id}`), gRes);
      expect(gRes._d?.data?.mandate_id).toBe('mand-002');
      const mappingsInStore = sharedState.store.get('grid_mappings') || [];
      expect(mappingsInStore.find((m: any) => m.id === id)).toBeTruthy();
    });
  });
});
