import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockInsert = vi.fn();
const mockRemove = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectMany: (...args: any[]) => mockSelectMany(...args),
  selectOne: vi.fn(),
  insert: (...args: any[]) => mockInsert(...args),
  update: vi.fn(),
  remove: (...args: any[]) => mockRemove(...args),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn((res: any, _: string, err: any) => res.status(500).json({ success: false, error: String(err) })),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'test_user', role: 'admin' }, error: null })),
}));

import { handleWebSearch } from '../../../api/_lib/webSearchHandler';

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

describe('webSearchHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('POST', { query: 'test' }, { path: ['search'] });
    const res = createMockRes();
    await handleWebSearch(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('rejects empty query', async () => {
    const req = createMockReq('POST', { query: '' }, { path: ['search'] });
    const res = createMockRes();
    await handleWebSearch(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects overlong query', async () => {
    const req = createMockReq('POST', { query: 'a'.repeat(501) }, { path: ['search'] });
    const res = createMockRes();
    await handleWebSearch(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns search history', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'h1', query: 'react hooks', results_count: 5, created_at: '2026-01-01' },
    ]);
    const req = createMockReq('GET', undefined, { path: ['history'] });
    const res = createMockRes();
    await handleWebSearch(req, res);
    expect(res.body.history).toHaveLength(1);
  });

  it('deletes history item', async () => {
    mockRemove.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['history', 'h1'] });
    const res = createMockRes();
    await handleWebSearch(req, res);
    expect(res.body.deleted).toBe(true);
  });

  it('returns 404 for unknown route', async () => {
    const req = createMockReq('GET', undefined, { path: ['unknown'] });
    const res = createMockRes();
    await handleWebSearch(req, res);
    expect(res.statusCode).toBe(404);
  });
});