/**
 * Tests for the v1/b2c endpoint router + middleware stack.
 *
 * Node environment (@vitest-environment node) because these are server-side
 * tests — they exercise the dispatch + rate-limit + auth-gate + audit layers
 * WITHOUT calling any real Supabase / LLM / Stripe APIs.
 *
 * Mock strategy:
 *   - Every legacy handler (nexusHandler, shiftHandler, etc.) is replaced with
 *     a spy that records the req.method + req.query.path and returns 200.
 *     This lets us assert that the router dispatches to the right handler with
 *     the right legacy query-path shape, independent of business logic.
 *   - supabaseRest.selectOne / insert / update → mocked returns.
 *   - auth.resolveUser → mocked (returns a b2c user by default; override per-test).
 *   - audit.logAuditEvent → silent no-op mock (spy on it to confirm audit fires).
 */
// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Hoisted mocks ────────────────────────────────────────────────

// Legacy handler imports — the routes module statically imports them, so we
// must mock BEFORE the module is loaded.
vi.mock('../../../api/_lib/nexusHandler.js', () => ({ handler: vi.fn() }));
vi.mock('../../../api/_lib/nexusChatHandler.js', () => ({ handleNexusChat: vi.fn() }));
vi.mock('../../../api/_lib/nexusMemoryHandler.js', () => ({ handleNexusMemory: vi.fn() }));
vi.mock('../../../api/_lib/nexusProactiveHandler.js', () => ({
  handleNexusSuggestions: vi.fn(),
}));
vi.mock('../../../api/_lib/nexusJourneyHandler.js', () => ({ handleNexusJourney: vi.fn() }));
vi.mock('../../../api/_lib/shiftHandler.js', () => ({ handler: vi.fn() }));
vi.mock('../../../api/_lib/tridentHandler.js', () => ({ handleTrident: vi.fn() }));
vi.mock('../../../api/_lib/canvasHandler.js', () => ({ handleCanvas: vi.fn() }));
vi.mock('../../../api/_lib/creditsHandler.js', () => ({ handleCredits: vi.fn() }));
vi.mock('../../../api/_lib/stripeHandler.js', () => ({ handleStripe: vi.fn() }));
vi.mock('../../../api/_lib/cvParseHandler.js', () => ({ handler: vi.fn() }));

// auth.resolveUser — default to a happy b2c user, override in test blocks.
vi.mock('../../../api/_lib/v1/auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/_lib/v1/auth.js')>();
  return {
    ...actual,
    resolveUser: vi.fn().mockResolvedValue({
      user: {
        id: 'usr-b2c-1',
        email: 'b2c@example.com',
        role: 'member',
        user_type: 'b2c',
      },
      error: null,
      status: 200,
    }),
  };
});

// supabaseRest — mock out the handful of select/insert/update calls made by the
// direct routes (profile, assessments list/get, booking).
vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

// audit — no-op but we spy via the module default import to assert it was called.
vi.mock('../../../api/_lib/v1/audit.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/_lib/v1/audit.js')>();
  return {
    ...actual,
    logAuditEvent: vi.fn().mockResolvedValue(true),
    getClientIp: () => '1.2.3.4',
    getUserAgent: () => 'vitest',
  };
});

// logging — silence.
vi.mock('../../../api/_lib/v1/logging.js', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

import { resolveUser } from '../../../api/_lib/v1/auth.js';
import { selectOne, insert, update as updateRow } from '../../../api/_lib/supabaseRest.js';
import { logAuditEvent } from '../../../api/_lib/v1/audit.js';
import { handler as nexusHandler } from '../../../api/_lib/nexusHandler.js';
import { handleNexusChat } from '../../../api/_lib/nexusChatHandler.js';
import { handleNexusMemory } from '../../../api/_lib/nexusMemoryHandler.js';
import { handleNexusSuggestions } from '../../../api/_lib/nexusProactiveHandler.js';
import { handleNexusJourney } from '../../../api/_lib/nexusJourneyHandler.js';
import { handler as shiftHandler } from '../../../api/_lib/shiftHandler.js';
import { handleTrident } from '../../../api/_lib/tridentHandler.js';
import { handleCanvas } from '../../../api/_lib/canvasHandler.js';
import { handleCredits } from '../../../api/_lib/creditsHandler.js';
import { handleStripe } from '../../../api/_lib/stripeHandler.js';
import { handler as cvParseHandler } from '../../../api/_lib/cvParseHandler.js';
import { handleB2c } from '../../../api/_lib/v1/b2c/routes.js';
import { _resetRateLimitStore } from '../../../api/_lib/v1/rateLimit.js';

// ─── Test helpers ─────────────────────────────────────────────────

interface MockRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string | string[]>;
  status(c: number): MockRes;
  json(data: unknown): MockRes;
  end(): void;
  setHeader(name: string, value: string | string[]): void;
}

function res(): MockRes {
  const r: MockRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  return r;
}

function req(opts: {
  method?: string;
  path: string[];
  body?: unknown;
  authorization?: string;
  cookie?: string;
}): unknown {
  const headers: Record<string, string> = {};
  if (opts.authorization) headers.authorization = opts.authorization;
  if (opts.cookie) headers.cookie = opts.cookie;
  return {
    method: opts.method ?? 'GET',
    body: opts.body ?? {},
    query: { path: opts.path },
    headers,
  };
}

const ALL_LEGACY_HANDLERS: Array<(...args: never[]) => unknown> = [
  nexusHandler as unknown as never,
  handleNexusChat as unknown as never,
  handleNexusMemory as unknown as never,
  handleNexusSuggestions as unknown as never,
  handleNexusJourney as unknown as never,
  shiftHandler as unknown as never,
  handleTrident as unknown as never,
  handleCanvas as unknown as never,
  handleCredits as unknown as never,
  handleStripe as unknown as never,
  cvParseHandler as unknown as never,
];

beforeEach(() => {
  _resetRateLimitStore();
  vi.clearAllMocks();

  // Restore the default resolveUser return value (vi.clearAllMocks wipes the
  // mockImplementation set at mock creation, so we re-apply it per test).
  vi.mocked(resolveUser).mockResolvedValue({
    user: {
      id: 'usr-b2c-1',
      email: 'b2c@example.com',
      role: 'member',
      user_type: 'b2c',
    },
    error: null,
    status: 200,
  });

  // Every legacy handler just writes 200 JSON so the b2c wrapper's promise resolves.
  for (const h of ALL_LEGACY_HANDLERS) {
    h.mockImplementation((_r: unknown, response: { status: (n: number) => { json: (d: unknown) => void } }) => {
      response.status(200).json({ ok: true, from: h.name });
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Routing ──────────────────────────────────────────────────────

describe('b2c router — public endpoints', () => {
  it('GET /b2c/health returns ok: true (no auth needed)', async () => {
    vi.mocked(resolveUser).mockResolvedValueOnce({ user: null, error: 'Unauthorized', status: 401 });

    const r = res();
    await handleB2c(req({ path: ['b2c', 'health'] }) as never, r as never);

    expect(r.statusCode).toBe(200);
    const body = r.body as { success: boolean; data: { ok: boolean; service: string } };
    expect(body.success).toBe(true);
    expect(body.data.service).toBe('b2c');
    expect(body.data.ok).toBe(true);
  });

  it('returns 404 for an unknown b2c sub-resource', async () => {
    const r = res();
    await handleB2c(req({ path: ['b2c', 'nope', 'nothing'] }) as never, r as never);
    expect(r.statusCode).toBe(404);
    const body = r.body as { error: string };
    expect(body.error).toMatch(/b2c/i);
  });
});

describe('b2c router — auth gates', () => {
  it('returns 401 when resolveUser returns no user', async () => {
    vi.mocked(resolveUser).mockResolvedValueOnce({ user: null, error: 'Unauthorized', status: 401 });

    const r = res();
    await handleB2c(req({ method: 'POST', path: ['b2c', 'chat'] }) as never, r as never);
    expect(r.statusCode).toBe(401);
  });

  it('returns 403 when the caller is user_type internal (not b2c)', async () => {
    vi.mocked(resolveUser).mockResolvedValueOnce({
      user: { id: 'usr-int-1', email: 'int@lyc.ai', role: 'team_lead', user_type: 'internal' },
      error: null,
      status: 200,
    });

    const r = res();
    await handleB2c(req({ method: 'GET', path: ['b2c', 'credits', 'balance'] }) as never, r as never);
    expect(r.statusCode).toBe(403);
    expect((r.body as { error: string }).error).toMatch(/B2C/i);
  });

  it('allows b2c user_type through (200 via legacy handler)', async () => {
    const r = res();
    await handleB2c(req({ method: 'POST', path: ['b2c', 'chat'] }) as never, r as never);
    expect(r.statusCode).toBe(200);
    expect(handleNexusChat).toHaveBeenCalledTimes(1);
  });
});

describe('b2c router — chat routing', () => {
  it('POST /b2c/chat → handleNexusChat with req.query.path=["chat"]', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'chat'] }) as { query: { path: unknown[] } };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(r.statusCode).toBe(200);
    expect(handleNexusChat).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['chat']);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'b2c.chat.message' }),
    );
  });

  it('GET /b2c/chat/conversations → handleNexusMemory with req.query.path=["memory"]', async () => {
    const rr = req({ path: ['b2c', 'chat', 'conversations'] }) as { query: { path: unknown[] } };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleNexusMemory).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['memory']);
  });

  it('GET /b2c/chat/conversations/:id → handleNexusMemory', async () => {
    const rr = req({ path: ['b2c', 'chat', 'conversations', 'conv-1'] }) as never;
    const r = res();
    await handleB2c(rr, r as never);
    expect(handleNexusMemory).toHaveBeenCalledTimes(1);
  });

  it('DELETE /b2c/chat/conversations/:id → handleNexusMemory', async () => {
    const rr = req({ method: 'DELETE', path: ['b2c', 'chat', 'conversations', 'conv-1'] }) as never;
    const r = res();
    await handleB2c(rr, r as never);
    expect(handleNexusMemory).toHaveBeenCalledTimes(1);
  });

  it('GET /b2c/chat/suggestions → handleNexusSuggestions', async () => {
    const rr = req({ path: ['b2c', 'chat', 'suggestions'] }) as never;
    const r = res();
    await handleB2c(rr, r as never);
    expect(handleNexusSuggestions).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'b2c.chat.suggestions.get' }),
    );
  });

  it('rate-limits chat POST at 20 msg / min per user', async () => {
    for (let i = 0; i < 20; i++) {
      const r = res();
      await handleB2c(req({ method: 'POST', path: ['b2c', 'chat'] }) as never, r as never);
      expect(r.statusCode).toBe(200);
    }
    // 21st request → 429
    const r = res();
    await handleB2c(req({ method: 'POST', path: ['b2c', 'chat'] }) as never, r as never);
    expect(r.statusCode).toBe(429);
  });
});

describe('b2c router — assessment routing', () => {
  it('POST /b2c/assessments/shift_leap → shiftHandler with req.query.path=["analyze"]', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'assessments', 'shift_leap'] }) as {
      query: { path: unknown[] };
    };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(shiftHandler).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['analyze']);
  });

  it('POST /b2c/assessments/:id/share → shiftHandler (submit path)', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'assessments', 'a-1', 'share'] }) as never;
    const r = res();
    await handleB2c(rr, r as never);
    expect(shiftHandler).toHaveBeenCalledTimes(1);
  });

  it('POST /b2c/assessments/:id → submit handler', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'assessments', 'a-1'] }) as never;
    const r = res();
    await handleB2c(rr, r as never);
    expect(shiftHandler).toHaveBeenCalledTimes(1);
  });

  it('GET /b2c/assessments → direct assessments list response', async () => {
    const r = res();
    await handleB2c(req({ path: ['b2c', 'assessments'] }) as never, r as never);
    expect(r.statusCode).toBe(200);
    const body = r.body as { data: { type: string } };
    expect(body.data.type).toBe('assessment_list');
  });

  it('GET /b2c/assessments/:id → selectOne from assessments table', async () => {
    vi.mocked(selectOne).mockResolvedValueOnce({
      id: 'a-1',
      assessment_type: 'shift_leap',
      user_id: 'usr-b2c-1',
    });

    const r = res();
    await handleB2c(req({ path: ['b2c', 'assessments', 'a-1'] }) as never, r as never);

    expect(selectOne).toHaveBeenCalledWith(
      'assessments',
      expect.objectContaining({ column: 'id', value: 'a-1' }),
    );
    expect(r.statusCode).toBe(200);
  });

  it('GET /b2c/assessments/:id → 404 when row not found', async () => {
    vi.mocked(selectOne).mockResolvedValueOnce(null);
    const r = res();
    await handleB2c(req({ path: ['b2c', 'assessments', 'a-missing'] }) as never, r as never);
    expect(r.statusCode).toBe(404);
  });
});

describe('b2c router — scores routing', () => {
  it('POST /b2c/scores/trident → handleTrident with req.query.path=["score"]', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'scores', 'trident'] }) as {
      query: { path: unknown[] };
    };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleTrident).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['score']);
  });

  it('GET /b2c/scores/trident/:id → handleTrident with scorecard/:id', async () => {
    const rr = req({ path: ['b2c', 'scores', 'trident', 'sc-1'] }) as {
      query: { path: unknown[] };
    };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleTrident).toHaveBeenCalledTimes(1);
    const p = (rr as unknown as { query: { path: string[] } }).query.path;
    expect(p[0]).toBe('scorecard');
    expect(p[1]).toBe('sc-1');
  });

  it('POST /b2c/scores/canvas → handleCanvas with path ["generate"]', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'scores', 'canvas'] }) as {
      query: { path: unknown[] };
    };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleCanvas).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['generate']);
  });
});

describe('b2c router — credits routing', () => {
  it('GET /b2c/credits/balance → handleCredits with ["balance"]', async () => {
    const rr = req({ path: ['b2c', 'credits', 'balance'] }) as { query: { path: unknown[] } };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleCredits).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['balance']);
  });

  it('GET /b2c/credits/history → handleCredits with ["history"]', async () => {
    const rr = req({ path: ['b2c', 'credits', 'history'] }) as { query: { path: unknown[] } };
    const r = res();
    await handleB2c(rr as never, r as never);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['history']);
  });

  it('POST /b2c/credits/checkout → handleStripe with ["checkout"]', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'credits', 'checkout'] }) as {
      query: { path: unknown[] };
    };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleStripe).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['checkout']);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'b2c.credits.checkout.create' }),
    );
  });

  it('POST /b2c/credits/portal → handleStripe with ["portal"]', async () => {
    const rr = req({ method: 'POST', path: ['b2c', 'credits', 'portal'] }) as {
      query: { path: unknown[] };
    };
    const r = res();
    await handleB2c(rr as never, r as never);
    expect(handleStripe).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['portal']);
  });
});

describe('b2c router — journey routing', () => {
  it('GET /b2c/journey → handleNexusJourney with ["journey"]', async () => {
    const rr = req({ path: ['b2c', 'journey'] }) as { query: { path: unknown[] } };
    const r = res();
    await handleB2c(rr as never, r as never);

    expect(handleNexusJourney).toHaveBeenCalledTimes(1);
    expect((rr as unknown as { query: { path: string[] } }).query.path).toEqual(['journey']);
  });

  it('GET /b2c/journey/milestones → handleNexusJourney with ["journey","summary"]', async () => {
    const rr = req({ path: ['b2c', 'journey', 'milestones'] }) as { query: { path: unknown[] } };
    const r = res();
    await handleB2c(rr as never, r as never);
    const p = (rr as unknown as { query: { path: string[] } }).query.path;
    expect(p).toEqual(['journey', 'summary']);
  });
});

describe('b2c router — profile (direct table-backed)', () => {
  it('GET /b2c/profile → selectOne from profiles id=uid', async () => {
    vi.mocked(selectOne).mockResolvedValueOnce({
      id: 'usr-b2c-1',
      name: 'Ada Lovelace',
      email: 'b2c@example.com',
      role: 'member',
      user_type: 'b2c',
      created_at: '2026-01-01',
    });

    const r = res();
    await handleB2c(req({ path: ['b2c', 'profile'] }) as never, r as never);
    expect(selectOne).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({ column: 'id', value: 'usr-b2c-1' }),
    );
    expect(r.statusCode).toBe(200);
    const data = (r.body as { data: { profile: { name: string } } }).data;
    expect(data.profile.name).toBe('Ada Lovelace');
  });

  it('PATCH /b2c/profile {name} → update profiles.id=usr-b2c-1 name', async () => {
    vi.mocked(updateRow).mockResolvedValueOnce({
      id: 'usr-b2c-1',
      name: 'Grace Hopper',
    });

    const r = res();
    await handleB2c(
      req({
        method: 'PATCH',
        path: ['b2c', 'profile'],
        body: { name: 'Grace Hopper' },
      }) as never,
      r as never,
    );

    expect(updateRow).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({ name: 'Grace Hopper' }),
      'usr-b2c-1',
      'id',
    );
    expect(r.statusCode).toBe(200);
  });

  it('PATCH /b2c/profile {} (no valid fields) → 400', async () => {
    const r = res();
    await handleB2c(req({ method: 'PATCH', path: ['b2c', 'profile'], body: {} }) as never, r as never);
    expect(r.statusCode).toBe(400);
  });

  it('PATCH /b2c/profile {bad name:""} → 400 (name min length 1)', async () => {
    const r = res();
    await handleB2c(
      req({ method: 'PATCH', path: ['b2c', 'profile'], body: { name: '' } }) as never,
      r as never,
    );
    expect(r.statusCode).toBe(400);
  });
});

describe('b2c router — cv upload', () => {
  it('POST /b2c/cv/upload → cvParseHandler', async () => {
    const r = res();
    await handleB2c(req({ method: 'POST', path: ['b2c', 'cv', 'upload'] }) as never, r as never);
    expect(cvParseHandler).toHaveBeenCalledTimes(1);
  });
});

describe('b2c router — booking (direct insert)', () => {
  it('POST /b2c/booking {name,email} → insert b2c_bookings row', async () => {
    vi.mocked(insert).mockResolvedValueOnce({ id: 'bk-1' });
    const r = res();
    await handleB2c(
      req({
        method: 'POST',
        path: ['b2c', 'booking'],
        body: { name: 'Test', email: 't@example.com', call_type: 'intro' },
      }) as never,
      r as never,
    );

    expect(insert).toHaveBeenCalledWith(
      'b2c_bookings',
      expect.objectContaining({ user_id: 'usr-b2c-1', name: 'Test', call_type: 'intro' }),
    );
    expect(r.statusCode).toBe(200);
  });

  it('POST /b2c/booking {missing email} → 400', async () => {
    const r = res();
    await handleB2c(
      req({ method: 'POST', path: ['b2c', 'booking'], body: { name: 'X' } }) as never,
      r as never,
    );
    expect(r.statusCode).toBe(400);
  });
});

describe('b2c router — rate limit class separation', () => {
  it('chat read uses a separate (higher) limit than chat write', async () => {
    // Consume the chat write (POST) quota: 20 POSTs.
    for (let i = 0; i < 20; i++) {
      await handleB2c(
        req({ method: 'POST', path: ['b2c', 'chat'] }) as never,
        res(),
      );
    }
    // POST 21 → 429
    const rw = res();
    await handleB2c(req({ method: 'POST', path: ['b2c', 'chat'] }) as never, rw as never);
    expect(rw.statusCode).toBe(429);

    // But chat read GET still succeeds (separate bucket).
    const rr = res();
    await handleB2c(req({ path: ['b2c', 'chat', 'conversations'] }) as never, rr as never);
    expect(rr.statusCode).toBe(200);
  });
});
