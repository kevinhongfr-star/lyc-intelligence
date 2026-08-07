import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectMany: (...args: any[]) => mockSelectMany(...args),
  selectOne: (...args: any[]) => mockSelectOne(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: (...args: any[]) => mockRemove(...args),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn((res: any, _: string, err: any) => res.status(500).json({ success: false, error: String(err) })),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'test_user', role: 'admin' }, error: null })),
}));

import { handleApiKey } from '../../../api/_lib/apiKeyHandler';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    status: vi.fn().mockImplementation(function(code: number) { this.statusCode = code; return this; }),
    json: vi.fn().mockImplementation(function(data: any) { this.body = data; return this; }),
    setHeader: vi.fn(),
  };
  return res;
}

describe('apiKeyHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists api keys for user', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'k1', name: 'Test Key', is_active: true },
    ]);
    const req = createMockReq('GET', undefined, { path: [] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.body.keys).toHaveLength(1);
  });

  it('creates a new api key with raw key visible once', async () => {
    mockSelectMany.mockResolvedValue([]);
    mockInsert.mockResolvedValue({ id: 'key_1', name: 'Production', key_prefix: 'sk_abc****wxyz' });
    const req = createMockReq('POST', {
      name: 'Production',
      scopes: ['read', 'write'],
    }, { path: [] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.key.raw_key).toBeDefined();
    expect(typeof res.body.key.raw_key).toBe('string');
    expect(res.body.key.raw_key.length).toBeGreaterThan(20);
  });

  it('rejects key name that is too short', async () => {
    const req = createMockReq('POST', { name: 'ab' }, { path: [] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects when max keys reached', async () => {
    const keys = Array.from({ length: 20 }, (_, i) => ({ id: `k${i}` }));
    mockSelectMany.mockResolvedValue(keys);
    const req = createMockReq('POST', { name: 'New Key' }, { path: [] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('revokes an api key', async () => {
    mockSelectOne.mockResolvedValue({ id: 'k1', user_id: 'test_user' });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['k1'] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.body.revoked).toBe(true);
  });

  it('prevents revoking another users key', async () => {
    mockSelectOne.mockResolvedValue({ id: 'k1', user_id: 'other_user' });
    const req = createMockReq('DELETE', undefined, { path: ['k1'] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('returns usage stats for a key', async () => {
    mockSelectOne.mockResolvedValue({ id: 'k1', user_id: 'test_user' });
    mockSelectMany.mockResolvedValue([
      { endpoint: '/api/v1/test', method: 'GET', status: 200, created_at: '2026-01-01' },
    ]);
    const req = createMockReq('GET', undefined, { path: ['k1', 'usage'] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.body.usage).toHaveLength(1);
  });

  it('rotates an api key', async () => {
    mockSelectOne.mockResolvedValue({ id: 'k1', user_id: 'test_user', name: 'Prod', scopes: ['read'] });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', undefined, { path: ['k1', 'rotate'] });
    const res = createMockRes();
    await handleApiKey(req, res);
    expect(res.body.raw_key).toBeDefined();
  });
});