import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelectMany = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  isSupabaseConfigured: () => true,
  handleError: vi.fn((res: any, _label: string, err: any) => {
    res.status(500).json({ success: false, error: String(err) });
  }),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'user-1' }, error: null })),
}));

import { handleSecurity } from '../../../api/_lib/securityHardening';

function createMockReq(method: string, body?: unknown, query?: Record<string, unknown>) {
  return {
    method,
    query: query || { path: [] },
    body,
    headers: { authorization: 'Bearer test-token' },
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleSecurity', () => {
  it('returns security headers on GET /security/headers', async () => {
    const req = createMockReq('GET', undefined, { path: ['headers'] });
    const res = createMockRes();
    await handleSecurity(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('returns CSP on GET /security/csp', async () => {
    mockSelectOne.mockResolvedValue(null);
    const req = createMockReq('GET', undefined, { path: ['csp'] });
    const res = createMockRes();
    await handleSecurity(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.directives).toBeDefined();
  });

  it('updates CSP on POST /security/csp', async () => {
    mockSelectOne.mockResolvedValue({ id: '1', value: "default-src 'self'" });
    mockUpdate.mockResolvedValue({ id: '1' });
    const req = createMockReq('POST', { csp: "default-src 'self'; script-src 'self'" }, { path: ['csp'] });
    const res = createMockRes();
    await handleSecurity(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns rate limits on GET /security/rate-limits', async () => {
    const req = createMockReq('GET', undefined, { path: ['rate-limits'] });
    const res = createMockRes();
    await handleSecurity(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.rate_limits.public).toBeDefined();
  });

  it('runs security audit on GET /security/audit', async () => {
    const req = createMockReq('GET', undefined, { path: ['audit'] });
    const res = createMockRes();
    await handleSecurity(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.audit.score).toBeDefined();
  });

  it('returns 404 for unknown route', async () => {
    const req = createMockReq('GET', undefined, { path: ['unknown'] });
    const res = createMockRes();
    await handleSecurity(req, res);
    expect(res.statusCode).toBe(404);
  });
});