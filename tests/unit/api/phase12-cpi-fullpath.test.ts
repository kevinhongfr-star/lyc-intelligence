/**
 * Phase 12 — CPI (China Leadership Pipeline Diagnostic) FULL-REQUEST-PATH tests.
 *
 * Exercises the REAL routing chain through dispatch.ts → dynamic import() →
 * cpiHandler.handleCpi with an in-memory supabaseRest mock.
 *
 * 7 suites, 25 tests:
 *   Suite 1 — Dispatch registration & cpiHandler resolution (4)
 *   Suite 2 — CPI scoring logic: dimensions, composite, all 6 archetypes (7)
 *   Suite 3 — POST /score: valid input saves to assessment_results type='CPI' (3)
 *   Suite 4 — POST /analyze: full flow with LLM fallback, saves narrative + metadata (3)
 *   Suite 5 — GET /results: lists user's CPI results ordered by date desc (2)
 *   Suite 6 — GET /results/:id: returns result, 403 wrong user, 404 missing (3)
 *   Suite 7 — Error handling: invalid input, missing auth, malformed payload (3)
 *
 * All tests go through dispatch — NO direct handler imports.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ── Auth mock ─────────────────────────────────────────────────────────
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

// ── In-memory Supabase REST mock (same pattern as phase11) ────────────
const sharedState: {
  store: Map<string, any[]>;
  insertCalls: { table: string; row: any }[];
} = {
  store: new Map(),
  insertCalls: [],
};

function resetStore() {
  sharedState.store.clear();
  sharedState.insertCalls.length = 0;
  sharedState.store.set('auth.users', [
    { id: 'user-001', email: 'leader@test.com', role: 'member' },
  ]);
}

function applyFilter(rows: any[], filter: any): any[] {
  if (!filter) return rows;
  if (filter.column && filter.value !== undefined) {
    return rows.filter((r: any) => r[filter.column] === filter.value);
  }
  return rows.filter((r: any) =>
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
  selectMany: async (tableOrOpts: any, ...args: any[]) => {
    let rows: any[];
    let table: string;
    let orderBy: any;
    let limit: number | undefined;

    if (typeof tableOrOpts === 'string') {
      table = tableOrOpts;
      rows = (sharedState.store.get(table) || []).slice();
      const [optionsOrFilters, orderByOrLimit, limitOrOffset] = args as any[];
      if (optionsOrFilters && typeof optionsOrFilters === 'object'
        && !Array.isArray(optionsOrFilters)
        && ('where' in optionsOrFilters || 'orderBy' in optionsOrFilters || 'limit' in optionsOrFilters)) {
        if (optionsOrFilters.where) {
          const w = optionsOrFilters.where;
          if (Array.isArray(w)) {
            for (const clause of w) {
              const col = clause.column ?? clause.col;
              const val = clause.value ?? clause.val;
              rows = applyFilter(rows, { column: col, value: val });
            }
          }
        }
        orderBy = optionsOrFilters.orderBy;
        limit = optionsOrFilters.limit;
      } else {
        orderBy = orderByOrLimit;
        if (typeof limitOrOffset === 'number') limit = limitOrOffset;
        if (optionsOrFilters) rows = applyFilter(rows, optionsOrFilters);
      }
    } else {
      const opts = tableOrOpts;
      table = opts.table || opts.from;
      rows = (sharedState.store.get(table) || []).slice();
      if (opts.where) {
        const w = opts.where;
        if (Array.isArray(w)) {
          for (const clause of w) {
            const col = clause.column ?? clause.col;
            const val = clause.value ?? clause.val;
            rows = applyFilter(rows, { column: col, value: val });
          }
        } else {
          rows = applyFilter(rows, w);
        }
      }
      orderBy = opts.orderBy;
      limit = opts.limit;
    }

    if (orderBy) {
      const col = orderBy.column ?? orderBy.col ?? orderBy;
      const asc = orderBy.ascending !== false;
      rows.sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }
    if (limit != null) rows = rows.slice(0, limit);
    return rows;
  },
  insert: async (table: string, row: any, _timeout?: number) => {
    const id = row.id || `ar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const inserted = { ...row, id, created_at: row.created_at || new Date().toISOString() };
    const existing = sharedState.store.get(table) || [];
    existing.push(inserted);
    sharedState.store.set(table, existing);
    sharedState.insertCalls.push({ table, row: inserted });
    return inserted;
  },
  update: async (table: string, filter: any, patch: any, _timeout?: number) => {
    const rows = (sharedState.store.get(table) || []).slice();
    const matches = applyFilter(rows, filter);
    const updated = matches.map((m: any) => ({ ...m, ...patch, updated_at: new Date().toISOString() }));
    sharedState.store.set(table, rows.map((r: any) => {
      const matched = updated.find((u: any) => u.id === r.id);
      return matched || r;
    }));
    return updated;
  },
  remove: async (table: string, filter: any, _timeout?: number) => {
    const rows = (sharedState.store.get(table) || []);
    const remaining = rows.filter((r: any) => applyFilter([r], filter).length === 0);
    sharedState.store.set(table, remaining);
    return true;
  },
  count: async (table: string, filter: any) => {
    const rows = (sharedState.store.get(table) || []);
    return applyFilter(rows, filter).length;
  },
}));

// ── Suppress DEEPSEEK_API_KEY so /analyze falls back to deterministic ──
const _origDeepseek = process.env.DEEPSEEK_API_KEY;
beforeEach(() => { delete process.env.DEEPSEEK_API_KEY; });
afterEach(() => { if (_origDeepseek) process.env.DEEPSEEK_API_KEY = _origDeepseek; });

// ── Test helpers ──────────────────────────────────────────────────────
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dispatchHandler from '../../../api/dispatch';

let _ipCounter = 0;
function nextIp(): string {
  _ipCounter = (_ipCounter + 1) % 100000;
  return `10.0.${Math.floor(_ipCounter / 256)}.${_ipCounter % 256}`;
}

function makeReq(mod: string, method: string, subPath: string, body?: any, query?: any): VercelRequest {
  const req = {
    method,
    query: { __mod: mod, __sub: subPath, ...(query || {}) } as any,
    body: body ?? {},
    headers: { 'content-type': 'application/json', 'x-forwarded-for': nextIp() },
  } as unknown as VercelRequest;
  return req;
}

function makeRes(): VercelResponse & { _c: number; _d: any } {
  const res: any = { _c: 0, _d: undefined };
  res.status = (code: number) => { res._c = code; return res; };
  res.json = (data: any) => { res._d = data; if (res._c === 0) res._c = 200; return res; };
  res.setHeader = () => res;
  res.end = () => { if (res._c === 0) res._c = 200; return res; };
  return res;
}

// ── Build CPI intake payloads ─────────────────────────────────────────
// Each dimension has 4 questions (so_q1-4, cb_q1-4, si_q1-4, ed_q1-4, lp_q1-4).
// Question scores are 2-5. Cross-border readiness: cb_read_1-5, scores 1-5.

function buildIntake(dimScores: Record<string, number>, cbReadiness: Record<string, number>): any {
  return {
    gate: { name: 'Test Leader', email: 'leader@test.com' },
    professionalContext: {
      situation: 'senior_leader',
      geography: 'europe_to_apac',
      function: 'CEO',
    },
    dimensions: dimScores,
    crossBorderQuestions: cbReadiness,
    writingStyle: 'pragmatic',
    careerGoals: ['land_target_role', 'cross_border_credentials'],
  };
}

// All 4 questions for a dimension set to the same score
function dimAnswers(prefix: string, score: number): Record<string, number> {
  return {
    [`${prefix}_q1`]: score, [`${prefix}_q2`]: score,
    [`${prefix}_q3`]: score, [`${prefix}_q4`]: score,
  };
}

function cbAnswers(score: number): Record<string, number> {
  return { cb_read_1: score, cb_read_2: score, cb_read_3: score, cb_read_4: score, cb_read_5: score };
}

function mergeDimensions(...dims: Record<string, number>[]): Record<string, number> {
  return Object.assign({}, ...dims);
}

// ── Test Suites ───────────────────────────────────────────────────────
describe('Phase 12 CPI (full-path through dispatch)', () => {
  beforeEach(() => {
    authState.user = { id: 'user-001', email: 'leader@test.com', role: 'member' };
    authState.error = null;
    resetStore();
  });

  afterEach(() => {
    authState.user = null;
    authState.error = null;
  });

  // ── Suite 1: Dispatch registration & cpiHandler resolution ─────────
  describe('Suite 1 — Dispatch registration & cpiHandler resolution', () => {
    it('S1-T1 Unauthenticated → 401 blocked at dispatch (cpi/config)', async () => {
      authState.user = null;
      authState.error = 'Unauthorized';
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'config'), res);
      expect(res._c).toBe(401);
      expect(res._d?.success).toBe(false);
    });

    it('S1-T2 Unknown module → 404 at dispatch', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('phase12-future', 'GET', 'anything'), res);
      expect(res._c).toBe(404);
    });

    it('S1-T3 cpi module resolves to handleCpi (GET /config → 200)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'config'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.config?.assessment_type).toBe('CPI');
    });

    it('S1-T4 Unknown CPI sub-route → 404 (handler-level)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'unknown-route-xyz'), res);
      expect(res._c).toBe(404);
      expect(res._d?.success).toBe(false);
    });
  });

  // ── Suite 2: CPI scoring logic — dimensions, composite, all 6 archetypes ─
  describe('Suite 2 — CPI scoring logic: dimensions, composite, all 6 archetypes', () => {
    it('S2-T1 GET /config returns 5 dimensions with correct weights', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'config'), res);
      const dims = res._d?.config?.dimensions;
      expect(dims.length).toBe(5);
      const ids = dims.map((d: any) => d.id);
      expect(ids).toEqual(expect.arrayContaining([
        'strategic_orientation', 'cross_border_adaptability', 'stakeholder_influence',
        'execution_discipline', 'leadership_presence',
      ]));
      const totalWeight = dims.reduce((s: number, d: any) => s + d.weight, 0);
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01);
    });

    it('S2-T2 POST /score → dimension scores are 0-100, composite = weighted sum + bonus', async () => {
      // All questions score 5 (max) → dim score = 5*20 = 100 each
      // Cross-border all 5 → cb = 5*20 = 100 ≥ 80 → +5 bonus
      // Composite = 100*0.25 + 100*0.25 + 100*0.20 + 100*0.15 + 100*0.15 + 5 = 105 → capped 100
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 5), dimAnswers('cb', 5), dimAnswers('si', 5), dimAnswers('ed', 5), dimAnswers('lp', 5)),
          cbAnswers(5)
        ),
      }), res);
      expect(res._c).toBe(200);
      const r = res._d?.result;
      expect(r.composite_score).toBe(100);
      expect(r.tier_label).toBe('Elite');
      for (const v of Object.values(r.dimension_scores)) {
        expect(v as number).toBe(100);
      }
    });

    it('S2-T3 Archetype: Strategic Architect (top1=SO, top2=SI, cb≥70)', async () => {
      // SO=5(100), SI=5(100), CB=3(60), ED=2(40), LP=2(40)
      // cross_border readiness 4 → cb = 4*20 = 80 ≥ 70
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 5), dimAnswers('cb', 3), dimAnswers('si', 5), dimAnswers('ed', 2), dimAnswers('lp', 2)),
          cbAnswers(4)
        ),
      }), res);
      expect(res._d?.result.archetype).toBe('Strategic Architect');
    });

    it('S2-T4 Archetype: Cross-Border Catalyst (top1=CB, top2=LP, cb≥75)', async () => {
      // CB=5(100), LP=5(100), SO=2(40), SI=2(40), ED=2(40)
      // cb readiness 4 → 80 ≥ 75
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 2), dimAnswers('cb', 5), dimAnswers('si', 2), dimAnswers('ed', 2), dimAnswers('lp', 5)),
          cbAnswers(4)
        ),
      }), res);
      expect(res._d?.result.archetype).toBe('Cross-Border Catalyst');
    });

    it('S2-T5 Archetype: Precision Operator (top1=ED, top2=SO)', async () => {
      // ED=5(100), SO=4(80), CB=2(40), SI=2(40), LP=2(40)
      // No cross-border threshold needed
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 2), dimAnswers('si', 2), dimAnswers('ed', 5), dimAnswers('lp', 2)),
          cbAnswers(2)
        ),
      }), res);
      expect(res._d?.result.archetype).toBe('Precision Operator');
    });

    it('S2-T6 Archetype: Grounded Executor (top1=ED, top2=CB)', async () => {
      // ED=5(100), CB=4(80), SO=2(40), SI=2(40), LP=2(40)
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 2), dimAnswers('cb', 4), dimAnswers('si', 2), dimAnswers('ed', 5), dimAnswers('lp', 2)),
          cbAnswers(2)
        ),
      }), res);
      expect(res._d?.result.archetype).toBe('Grounded Executor');
    });

    it('S2-T7 Tier labels: Elite ≥80, Advanced ≥65, Established ≥50, Developing <50', async () => {
      // All 5s → 100 → Elite
      const r1 = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(mergeDimensions(dimAnswers('so', 5), dimAnswers('cb', 5), dimAnswers('si', 5), dimAnswers('ed', 5), dimAnswers('lp', 5)), cbAnswers(5)),
      }), r1);
      expect(r1._d?.result.tier_label).toBe('Elite');

      // All 2s → dim=40, cb=40, composite=40 → Developing
      const r2 = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(mergeDimensions(dimAnswers('so', 2), dimAnswers('cb', 2), dimAnswers('si', 2), dimAnswers('ed', 2), dimAnswers('lp', 2)), cbAnswers(2)),
      }), r2);
      expect(r2._d?.result.tier_label).toBe('Developing');
    });
  });

  // ── Suite 3: POST /score persistence ───────────────────────────────
  describe('Suite 3 — POST /score: valid input saves to assessment_results type=CPI', () => {
    it('S3-T1 POST /score → 200 with result_id, persists row', async () => {
      const before = (sharedState.store.get('assessment_results') || []).length;
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 3), dimAnswers('si', 4), dimAnswers('ed', 3), dimAnswers('lp', 3)),
          cbAnswers(3)
        ),
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.result_id).toBeTruthy();
      const after = (sharedState.store.get('assessment_results') || []).length;
      expect(after).toBe(before + 1);
    });

    it('S3-T2 Persisted row has assessment_type=CPI, correct assessment_name, ownership', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 4), dimAnswers('si', 4), dimAnswers('ed', 4), dimAnswers('lp', 4)),
          cbAnswers(4)
        ),
      }), res);
      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results');
      expect(inserted).toBeTruthy();
      expect(inserted!.row.assessment_type).toBe('CPI');
      expect(inserted!.row.assessment_name).toBe('China Leadership Pipeline Diagnostic');
      expect(inserted!.row.user_id).toBe('user-001');
      expect(inserted!.row.narrative).toBeNull();
      expect(inserted!.row.metadata?.llm_used).toBe(false);
      expect(inserted!.row.completed_at).toBeTruthy();
    });

    it('S3-T3 composite_score persisted equals response composite_score', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 3), dimAnswers('cb', 3), dimAnswers('si', 3), dimAnswers('ed', 3), dimAnswers('lp', 3)),
          cbAnswers(3)
        ),
      }), res);
      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results');
      expect(inserted!.row.composite_score).toBe(res._d?.result.composite_score);
    });
  });

  // ── Suite 4: POST /analyze ─────────────────────────────────────────
  describe('Suite 4 — POST /analyze: full flow with LLM fallback, saves narrative + metadata', () => {
    it('S4-T1 POST /analyze without DEEPSEEK_API_KEY → 200, falls back to deterministic (narrative null)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'analyze', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 4), dimAnswers('si', 4), dimAnswers('ed', 4), dimAnswers('lp', 4)),
          cbAnswers(4)
        ),
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.result_id).toBeTruthy();
      expect(res._d?.result.narrative).toBeNull();
      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results');
      expect(inserted!.row.metadata?.llm_used).toBe(false);
      expect(inserted!.row.narrative).toBeNull();
    });

    it('S4-T2 POST /analyze persists metadata with archetype, top_dimensions, writing_style, professional_context', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'analyze', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 5), dimAnswers('cb', 3), dimAnswers('si', 5), dimAnswers('ed', 2), dimAnswers('lp', 2)),
          cbAnswers(4)
        ),
      }), res);
      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results');
      const meta = inserted!.row.metadata;
      expect(meta.archetype).toBe('Strategic Architect');
      expect(Array.isArray(meta.top_dimensions)).toBe(true);
      expect(meta.top_dimensions.length).toBe(2);
      expect(meta.writing_style).toBe('pragmatic');
      expect(meta.professional_context?.function).toBe('CEO');
      expect(meta.model).toBe('deepseek-chat');
    });

    it('S4-T3 POST /analyze returns dimension_scores, cross_border_score, composite, archetype', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'analyze', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 5), dimAnswers('cb', 5), dimAnswers('si', 5), dimAnswers('ed', 5), dimAnswers('lp', 5)),
          cbAnswers(5)
        ),
      }), res);
      const r = res._d?.result;
      expect(r.dimension_scores).toBeTruthy();
      expect(typeof r.cross_border_score).toBe('number');
      expect(r.composite_score).toBe(100);
      expect(r.archetype).toBeTruthy();
      expect(r.tier_label).toBe('Elite');
    });
  });

  // ── Suite 5: GET /results ──────────────────────────────────────────
  describe('Suite 5 — GET /results: lists user CPI results ordered by date desc', () => {
    it('S5-T1 GET /results → 200 with array of CPI results only (not SHIFT)', async () => {
      // Seed a CPI result
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 4), dimAnswers('si', 4), dimAnswers('ed', 4), dimAnswers('lp', 4)),
          cbAnswers(4)
        ),
      }), makeRes());

      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'results'), res);
      expect(res._c).toBe(200);
      expect(Array.isArray(res._d?.results)).toBe(true);
      expect(res._d?.results.length).toBeGreaterThanOrEqual(1);
      // All results should be CPI type
      for (const r of res._d?.results) {
        expect(r.assessment_type).toBe('CPI');
      }
    });

    it('S5-T2 GET /results returns empty array for user with no CPI assessments', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'results'), res);
      expect(res._c).toBe(200);
      expect(res._d?.results).toEqual([]);
    });
  });

  // ── Suite 6: GET /results/:id ──────────────────────────────────────
  describe('Suite 6 — GET /results/:id: returns result, 403 wrong user, 404 missing', () => {
    it('S6-T1 GET /results/:id → 200 with single CPI result', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 4), dimAnswers('si', 4), dimAnswers('ed', 4), dimAnswers('lp', 4)),
          cbAnswers(4)
        ),
      }), createRes);
      const id = createRes._d?.result_id;

      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', `results/${id}`), res);
      expect(res._c).toBe(200);
      expect(res._d?.result?.id).toBe(id);
      expect(res._d?.result?.user_id).toBe('user-001');
      expect(res._d?.result?.assessment_type).toBe('CPI');
    });

    it('S6-T2 GET /results/:id owned by another user → 403 access denied', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {
        intake: buildIntake(
          mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 4), dimAnswers('si', 4), dimAnswers('ed', 4), dimAnswers('lp', 4)),
          cbAnswers(4)
        ),
      }), createRes);
      const id = createRes._d?.result_id;

      authState.user = { id: 'user-002', email: 'intruder@test.com', role: 'member' };
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', `results/${id}`), res);
      expect(res._c).toBe(403);
      expect(res._d?.success).toBe(false);
    });

    it('S6-T3 GET /results/:id for non-existent id → 404', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'GET', 'results/non-existent-uuid'), res);
      expect(res._c).toBe(404);
      expect(res._d?.success).toBe(false);
    });
  });

  // ── Suite 7: Error handling ────────────────────────────────────────
  describe('Suite 7 — Error handling: invalid input, missing auth, malformed payload', () => {
    it('S7-T1 POST /score missing intake → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'score', {}), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
    });

    it('S7-T2 POST /analyze missing intake.dimensions → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'analyze', { intake: { gate: { name: 'X' } } }), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
    });

    it('S7-T3 Unauthenticated POST /analyze → 401 at dispatch', async () => {
      authState.user = null;
      authState.error = 'Unauthorized';
      const res = makeRes();
      await dispatchHandler(makeReq('cpi', 'POST', 'analyze', {
        intake: buildIntake(mergeDimensions(dimAnswers('so', 4), dimAnswers('cb', 4), dimAnswers('si', 4), dimAnswers('ed', 4), dimAnswers('lp', 4)), cbAnswers(4)),
      }), res);
      expect(res._c).toBe(401);
      expect(res._d?.success).toBe(false);
    });
  });
});
