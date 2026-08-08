/**
 * Phase 11 — SHIFT Suite FULL-REQUEST-PATH tests.
 *
 * Exercises the REAL routing chain through dispatch.ts → dynamic import() →
 * shiftHandler.handleShift with an in-memory supabaseRest mock.
 *
 * 7 suites, 28 tests:
 *   Suite 1 — Dispatch registration & shiftHandler resolution (4)
 *   Suite 2 — All 5 SHIFT diagnostic configs validation (5)
 *   Suite 3 — Scoring logic: dimension, composite, tier (5)
 *   Suite 4 — Result persistence (analyze + score create rows) (4)
 *   Suite 5 — Results listing & get-by-id (3)
 *   Suite 6 — Cross-diagnostic flow (multiple SHIFT assessments, verify history) (4)
 *   Suite 7 — Error handling: invalid type, missing data, auth, ownership (3)
 *
 * ALL tests go through dispatch.ts — no direct shiftHandler imports.
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

// ── In-memory Supabase REST mock ──────────────────────────────────────
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

// ── Suppress DEEPSEEK_API_KEY so analyze falls back to deterministic path ─
// (callDeepSeek throws → handler continues with deterministic narrative)
const _origDeepseek = process.env.DEEPSEEK_API_KEY;
beforeEach(() => {
  delete process.env.DEEPSEEK_API_KEY;
});
afterEach(() => {
  if (_origDeepseek) process.env.DEEPSEEK_API_KEY = _origDeepseek;
});

// ── Test helpers ──────────────────────────────────────────────────────
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dispatchHandler from '../../../api/dispatch';

// shiftHandler uses an in-memory per-IP rate limiter (10 req/min).
// Tests run in milliseconds, so a static IP would trip the limiter after
// 10 calls. Rotate a unique IP per request to avoid false 429s.
let _ipCounter = 0;
function nextIp(): string {
  _ipCounter = (_ipCounter + 1) % 100000;
  return `10.0.${Math.floor(_ipCounter / 256)}.${_ipCounter % 256}`;
}

function makeReq(mod: string, method: string, subPath: string, body?: any, query?: any): VercelRequest {
  const req = {
    method,
    query: {
      __mod: mod,
      __sub: subPath,
      ...(query || {}),
    } as any,
    body: body ?? {},
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': nextIp(),
    },
  } as unknown as VercelRequest;
  return req;
}

function makeRes(): VercelResponse & { _c: number; _d: any } {
  const res: any = {
    _c: 0,
    _d: undefined,
  };
  res.status = (code: number) => {
    res._c = code;
    return res;
  };
  res.json = (data: any) => {
    res._d = data;
    if (res._c === 0) res._c = 200;
    return res;
  };
  res.setHeader = () => res;
  res.end = () => {
    if (res._c === 0) res._c = 200;
    return res;
  };
  return res;
}

// ── Build a minimal valid SHIFT intake payload ────────────────────────
function buildIntake(dimensions: Record<string, number>): any {
  return {
    gate: { name: 'Test User', email: 'leader@test.com' },
    context: {
      role: 'Senior Director',
      industry: 'Technology',
      years_experience: 12,
      challenges: 'Scaling org through hypergrowth',
      improvement_goals: 'Build strategic clarity across team',
    },
    dimensions,
    evidence: Object.fromEntries(
      Object.keys(dimensions).map((k) => [k, 'Evidence text for ' + k])
    ),
    crossBorder: { cultural_experience: true, international_teams: 3, global_projects: 'EMEA expansion' },
    style: { disc_profile: 'D', work_style: 'Hands-on' },
    goals: { short_term: 'Lead bigger team', long_term: 'Become VP', success_definition: 'Org-wide impact' },
  };
}

// ── Test Suites ───────────────────────────────────────────────────────
describe('Phase 11 SHIFT Suite (full-path through dispatch)', () => {
  beforeEach(() => {
    authState.user = { id: 'user-001', email: 'leader@test.com', role: 'member' };
    authState.error = null;
    resetStore();
  });

  afterEach(() => {
    authState.user = null;
    authState.error = null;
  });

  // ── Suite 1: Dispatch registration & shiftHandler resolution ───────
  describe('Suite 1 — Dispatch registration & shiftHandler resolution', () => {
    it('S1-T1 Unauthenticated → 401 blocked at dispatch (shift/configs)', async () => {
      authState.user = null;
      authState.error = 'Unauthorized';
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      expect(res._c).toBe(401);
      expect(res._d?.success).toBe(false);
    });

    it('S1-T2 Unknown module → 404 at dispatch', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('phase11-future', 'GET', 'anything'), res);
      expect(res._c).toBe(404);
    });

    it('S1-T3 shift module resolves to handleShift (GET /configs → 200)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(Array.isArray(res._d?.configs)).toBe(true);
    });

    it('S1-T4 Unknown SHIFT sub-route → 404 (handler-level)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'unknown-route-xyz'), res);
      expect(res._c).toBe(404);
      expect(res._d?.success).toBe(false);
    });
  });

  // ── Suite 2: All 5 SHIFT diagnostic configs validation ─────────────
  describe('Suite 2 — All 5 SHIFT diagnostic configs validation', () => {
    it('S2-T1 GET /configs returns exactly 5 diagnostics', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      expect(res._c).toBe(200);
      const configs = res._d?.configs;
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBe(5);
    });

    it('S2-T2 Configs include LEAP, QUEST, DRIVE, COACH, IMPACT keys', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      const keys = res._d?.configs.map((c: any) => c.key);
      expect(keys).toEqual(expect.arrayContaining(['LEAP', 'QUEST', 'DRIVE', 'COACH', 'IMPACT']));
      expect(keys.length).toBe(5);
    });

    it('S2-T3 Every diagnostic has 5 dimensions with id/name/question', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      for (const cfg of res._d?.configs) {
        expect(cfg.dimensions.length).toBe(5);
        for (const dim of cfg.dimensions) {
          expect(typeof dim.id).toBe('string');
          expect(dim.id.length).toBeGreaterThan(0);
          expect(typeof dim.name).toBe('string');
          expect(typeof dim.question).toBe('string');
        }
      }
    });

    it('S2-T4 DRIVE dimensions match spec (results_orientation, operational_discipline, resource_management, stakeholder_alignment, continuous_improvement)', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      const drive = res._d?.configs.find((c: any) => c.key === 'DRIVE');
      expect(drive).toBeTruthy();
      const ids = drive.dimensions.map((d: any) => d.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          'results_orientation',
          'operational_discipline',
          'resource_management',
          'stakeholder_alignment',
          'continuous_improvement',
        ])
      );
    });

    it('S2-T5 COACH and IMPACT have correct dimension sets', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'configs'), res);
      const coach = res._d?.configs.find((c: any) => c.key === 'COACH');
      const impact = res._d?.configs.find((c: any) => c.key === 'IMPACT');
      expect(coach.dimensions.map((d: any) => d.id)).toEqual(
        expect.arrayContaining(['developing_others', 'feedback_orientation', 'emotional_intelligence', 'talent_identification', 'team_building'])
      );
      expect(impact.dimensions.map((d: any) => d.id)).toEqual(
        expect.arrayContaining(['communication_impact', 'executive_presence', 'negotiation', 'conflict_resolution', 'personal_brand'])
      );
    });
  });

  // ── Suite 3: Scoring logic — dimension, composite, tier ────────────
  describe('Suite 3 — Scoring logic: dimension conversion, composite, tier', () => {
    it('S3-T1 POST /score LEAP → 200 with dimension_scores (0-100) for all 5 dims', async () => {
      const res = makeRes();
      const intake = buildIntake({
        strategic_thinking: 8,
        execution_speed: 7,
        learning_agility: 9,
        leadership_presence: 6,
        change_navigation: 8,
      });
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake,
        assessmentType: 'LEAP',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      const r = res._d?.result;
      expect(r).toBeTruthy();
      expect(Object.keys(r.dimension_scores).length).toBe(5);
      for (const v of Object.values(r.dimension_scores)) {
        expect(typeof v).toBe('number');
        expect(v as number).toBeGreaterThanOrEqual(0);
        expect(v as number).toBeLessThanOrEqual(100);
      }
    });

    it('S3-T2 Score 10/10 maps to 100; score 1/10 maps to 0', async () => {
      const res = makeRes();
      const intake = buildIntake({
        strategic_thinking: 10,
        execution_speed: 10,
        learning_agility: 10,
        leadership_presence: 10,
        change_navigation: 10,
      });
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake,
        assessmentType: 'LEAP',
      }), res);
      const r = res._d?.result;
      for (const v of Object.values(r.dimension_scores)) {
        expect(v).toBe(100);
      }
      expect(r.composite_score).toBe(100);
      expect(r.tier_label).toBe('Exceptional');
    });

    it('S3-T3 Composite is the mean of dimension scores (rounded)', async () => {
      const res = makeRes();
      // 8/10 → 78; 7/10 → 67; mean of 5 8s and 5 7s → all same
      const intake = buildIntake({
        strategic_thinking: 7,
        execution_speed: 7,
        learning_agility: 7,
        leadership_presence: 7,
        change_navigation: 7,
      });
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake,
        assessmentType: 'LEAP',
      }), res);
      const r = res._d?.result;
      // 7/10 → (7-1)/9 * 100 = 66.67 → 67
      const expected = Math.round(((7 - 1) / 9) * 100);
      for (const v of Object.values(r.dimension_scores)) {
        expect(v).toBe(expected);
      }
      expect(r.composite_score).toBe(expected);
    });

    it('S3-T4 Tier labels: 85+ Exceptional, 70+ Advanced, 55+ Proficient, 40+ Developing, else Emerging', async () => {
      // Tier = Exceptional (10/10 → 100)
      const res1 = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 10, execution_speed: 10, learning_agility: 10, leadership_presence: 10, change_navigation: 10 }),
        assessmentType: 'LEAP',
      }), res1);
      expect(res1._d?.result.tier_label).toBe('Exceptional');

      // Tier = Emerging (1/10 → 0)
      const res2 = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 1, execution_speed: 1, learning_agility: 1, leadership_presence: 1, change_navigation: 1 }),
        assessmentType: 'LEAP',
      }), res2);
      expect(res2._d?.result.tier_label).toBe('Emerging');

      // Tier = Proficient (5/10 → 44 → Developing? Let's verify: (5-1)/9*100 = 44.44 → 44 → Developing)
      const res3 = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 6, execution_speed: 6, learning_agility: 6, leadership_presence: 6, change_navigation: 6 }),
        assessmentType: 'LEAP',
      }), res3);
      // 6/10 → (6-1)/9*100 = 55.55 → 56 → Proficient
      expect(res3._d?.result.tier_label).toBe('Proficient');
    });

    it('S3-T5 Archetype resolves based on top-2 dimensions (Strategic Catalyst for LEAP high strategic_thinking)', async () => {
      const res = makeRes();
      const intake = buildIntake({
        strategic_thinking: 10,
        execution_speed: 9,
        learning_agility: 3,
        leadership_presence: 3,
        change_navigation: 3,
      });
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake,
        assessmentType: 'LEAP',
      }), res);
      const r = res._d?.result;
      expect(r.archetype).toBe('Strategic Catalyst');
    });
  });

  // ── Suite 4: Result persistence ────────────────────────────────────
  describe('Suite 4 — Result persistence (analyze + score create rows)', () => {
    it('S4-T1 POST /score → persists row in assessment_results with correct shape', async () => {
      const before = (sharedState.store.get('assessment_results') || []).length;
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 8, execution_speed: 8, learning_agility: 8, leadership_presence: 8, change_navigation: 8 }),
        assessmentType: 'LEAP',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.result_id).toBeTruthy();

      const after = (sharedState.store.get('assessment_results') || []).length;
      expect(after).toBe(before + 1);

      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results');
      expect(inserted).toBeTruthy();
      const row = inserted!.row;
      expect(row.user_id).toBe('user-001');
      expect(row.assessment_type).toBe('SHIFT_LEAP');
      expect(row.assessment_name).toBe('Learning & Execution Potential');
      expect(row.composite_score).toBeGreaterThanOrEqual(0);
      expect(row.composite_score).toBeLessThanOrEqual(100);
      expect(typeof row.tier_label).toBe('string');
      expect(row.dimensions).toBeTruthy();
      expect(row.narrative).toBeNull(); // score-only has no narrative
      expect(row.metadata?.llm_used).toBe(false);
      expect(row.completed_at).toBeTruthy();
    });

    it('S4-T2 POST /analyze without DEEPSEEK_API_KEY → falls back to deterministic + persists row', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'analyze', {
        intake: buildIntake({ strategic_thinking: 9, execution_speed: 9, learning_agility: 8, leadership_presence: 7, change_navigation: 8 }),
        assessmentType: 'DRIVE',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.result_id).toBeTruthy();
      // Deterministic path: llm_used = false in metadata, narrative null
      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results' && c.row.assessment_type === 'SHIFT_DRIVE');
      expect(inserted).toBeTruthy();
      expect(inserted!.row.metadata?.llm_used).toBe(false);
      expect(inserted!.row.narrative).toBeNull();
    });

    it('S4-T3 assessment_type stored as SHIFT_<KEY> (e.g. SHIFT_COACH, SHIFT_IMPACT)', async () => {
      const res1 = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ developing_others: 7, feedback_orientation: 7, emotional_intelligence: 7, talent_identification: 7, team_building: 7 }),
        assessmentType: 'COACH',
      }), res1);
      expect(res1._c).toBe(200);

      const res2 = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ communication_impact: 7, executive_presence: 7, negotiation: 7, conflict_resolution: 7, personal_brand: 7 }),
        assessmentType: 'IMPACT',
      }), res2);
      expect(res2._c).toBe(200);

      const types = sharedState.insertCalls
        .filter((c) => c.table === 'assessment_results')
        .map((c) => c.row.assessment_type);
      expect(types).toEqual(expect.arrayContaining(['SHIFT_COACH', 'SHIFT_IMPACT']));
    });

    it('S4-T4 Portal_id is persisted when provided in request body', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ results_orientation: 8, operational_discipline: 8, resource_management: 8, stakeholder_alignment: 8, continuous_improvement: 8 }),
        assessmentType: 'DRIVE',
        portal_id: 'portal-abc-123',
      }), res);
      expect(res._c).toBe(200);
      const inserted = sharedState.insertCalls.find((c) => c.table === 'assessment_results');
      expect(inserted!.row.portal_id).toBe('portal-abc-123');
    });
  });

  // ── Suite 5: Results listing & get-by-id ───────────────────────────
  describe('Suite 5 — Results listing & get-by-id', () => {
    it('S5-T1 GET /results → 200 with array of user results', async () => {
      // Seed one prior result
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 8, execution_speed: 8, learning_agility: 8, leadership_presence: 8, change_navigation: 8 }),
        assessmentType: 'LEAP',
      }), makeRes());

      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'results'), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(Array.isArray(res._d?.results)).toBe(true);
      expect(res._d?.results.length).toBeGreaterThanOrEqual(1);
    });

    it('S5-T2 GET /results/:id → 200 with single result', async () => {
      const createRes = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 8, execution_speed: 8, learning_agility: 8, leadership_presence: 8, change_navigation: 8 }),
        assessmentType: 'LEAP',
      }), createRes);
      const id = createRes._d?.result_id;
      expect(id).toBeTruthy();

      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', `results/${id}`), res);
      expect(res._c).toBe(200);
      expect(res._d?.success).toBe(true);
      expect(res._d?.result?.id).toBe(id);
      expect(res._d?.result?.user_id).toBe('user-001');
    });

    it('S5-T3 GET /results/:id for non-existent id → 404', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'results/non-existent-uuid'), res);
      expect(res._c).toBe(404);
      expect(res._d?.success).toBe(false);
    });
  });

  // ── Suite 6: Cross-diagnostic flow ─────────────────────────────────
  describe('Suite 6 — Cross-diagnostic flow (multiple SHIFT assessments, verify history)', () => {
    it('S6-T1 Run LEAP, QUEST, DRIVE in sequence — all persist', async () => {
      for (const [type, dims] of [
        ['LEAP', { strategic_thinking: 8, execution_speed: 8, learning_agility: 8, leadership_presence: 8, change_navigation: 8 }],
        ['QUEST', { analytical_depth: 7, problem_solving: 7, decision_quality: 7, innovation: 7, collaboration: 7 }],
        ['DRIVE', { results_orientation: 9, operational_discipline: 9, resource_management: 9, stakeholder_alignment: 9, continuous_improvement: 9 }],
      ] as const) {
        const res = makeRes();
        await dispatchHandler(makeReq('shift', 'POST', 'score', {
          intake: buildIntake(dims),
          assessmentType: type,
        }), res);
        expect(res._c).toBe(200);
        expect(res._d?.result_id).toBeTruthy();
      }

      const persistedTypes = sharedState.insertCalls
        .filter((c) => c.table === 'assessment_results')
        .map((c) => c.row.assessment_type);
      expect(persistedTypes).toEqual(expect.arrayContaining(['SHIFT_LEAP', 'SHIFT_QUEST', 'SHIFT_DRIVE']));
    });

    it('S6-T2 History listing returns all 3 cross-diagnostic results', async () => {
      for (const [type, dims] of [
        ['LEAP', { strategic_thinking: 6, execution_speed: 6, learning_agility: 6, leadership_presence: 6, change_navigation: 6 }],
        ['COACH', { developing_others: 7, feedback_orientation: 7, emotional_intelligence: 7, talent_identification: 7, team_building: 7 }],
        ['IMPACT', { communication_impact: 9, executive_presence: 9, negotiation: 9, conflict_resolution: 9, personal_brand: 9 }],
      ] as const) {
        await dispatchHandler(makeReq('shift', 'POST', 'score', {
          intake: buildIntake(dims),
          assessmentType: type,
        }), makeRes());
      }

      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', 'results'), res);
      expect(res._c).toBe(200);
      expect(res._d?.results.length).toBeGreaterThanOrEqual(3);
      const types = res._d?.results.map((r: any) => r.assessment_type);
      expect(types).toEqual(expect.arrayContaining(['SHIFT_LEAP', 'SHIFT_COACH', 'SHIFT_IMPACT']));
    });

    it('S6-T3 Each diagnostic produces a distinct result_id retrievable via GET /results/:id', async () => {
      const ids: string[] = [];
      for (const [type, dims] of [
        ['LEAP', { strategic_thinking: 8, execution_speed: 8, learning_agility: 8, leadership_presence: 8, change_navigation: 8 }],
        ['QUEST', { analytical_depth: 7, problem_solving: 7, decision_quality: 7, innovation: 7, collaboration: 7 }],
        ['COACH', { developing_others: 8, feedback_orientation: 8, emotional_intelligence: 8, talent_identification: 8, team_building: 8 }],
        ['DRIVE', { results_orientation: 8, operational_discipline: 8, resource_management: 8, stakeholder_alignment: 8, continuous_improvement: 8 }],
        ['IMPACT', { communication_impact: 8, executive_presence: 8, negotiation: 8, conflict_resolution: 8, personal_brand: 8 }],
      ] as const) {
        const r = makeRes();
        await dispatchHandler(makeReq('shift', 'POST', 'score', {
          intake: buildIntake(dims),
          assessmentType: type,
        }), r);
        ids.push(r._d?.result_id);
      }
      // 5 distinct ids
      expect(new Set(ids).size).toBe(5);

      // Each one retrievable
      for (const id of ids) {
        const res = makeRes();
        await dispatchHandler(makeReq('shift', 'GET', `results/${id}`), res);
        expect(res._c).toBe(200);
        expect(res._d?.result?.id).toBe(id);
      }
    });

    it('S6-T4 IMPACT assessment (5 credits, 5 dims) scores and persists correctly', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ communication_impact: 10, executive_presence: 10, negotiation: 10, conflict_resolution: 10, personal_brand: 10 }),
        assessmentType: 'IMPACT',
      }), res);
      expect(res._c).toBe(200);
      expect(res._d?.result.composite_score).toBe(100);
      expect(res._d?.result.tier_label).toBe('Exceptional');
      expect(res._d?.result.archetype).toBe('Impact Architect');
    });
  });

  // ── Suite 7: Error handling ────────────────────────────────────────
  describe('Suite 7 — Error handling: invalid type, missing data, auth, ownership', () => {
    it('S7-T1 POST /score with invalid assessmentType → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 8 }),
        assessmentType: 'BOGUS_TYPE',
      }), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
      // Error message lists valid keys
      expect(res._d?.error).toContain('LEAP');
      expect(res._d?.error).toContain('IMPACT');
    });

    it('S7-T2 POST /score missing intake → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        assessmentType: 'LEAP',
      }), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
    });

    it('S7-T3 POST /analyze missing assessmentType → 400', async () => {
      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'analyze', {
        intake: buildIntake({ strategic_thinking: 8 }),
      }), res);
      expect(res._c).toBe(400);
      expect(res._d?.success).toBe(false);
    });

    it('S7-T4 GET /results/:id owned by another user → 403 access denied', async () => {
      // Seed a result owned by user-001
      const createRes = makeRes();
      await dispatchHandler(makeReq('shift', 'POST', 'score', {
        intake: buildIntake({ strategic_thinking: 8, execution_speed: 8, learning_agility: 8, leadership_presence: 8, change_navigation: 8 }),
        assessmentType: 'LEAP',
      }), createRes);
      const id = createRes._d?.result_id;

      // Switch to a different user
      authState.user = { id: 'user-002', email: 'intruder@test.com', role: 'member' };

      const res = makeRes();
      await dispatchHandler(makeReq('shift', 'GET', `results/${id}`), res);
      expect(res._c).toBe(403);
      expect(res._d?.success).toBe(false);
    });
  });
});
