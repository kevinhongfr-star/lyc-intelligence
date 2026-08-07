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

import { handlePlugin } from '../../../api/_lib/pluginHandler';

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

describe('pluginHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists plugins for user', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'pl1', name: 'Test Plugin', status: 'active' },
    ]);
    const req = createMockReq('GET', undefined, { path: [] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.body.plugins).toHaveLength(1);
  });

  it('gets public catalog', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'pl1', name: 'Official Plugin', source: 'official' },
    ]);
    const req = createMockReq('GET', undefined, { path: ['catalog'] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.body.catalog).toHaveLength(1);
  });

  it('creates a plugin with valid source', async () => {
    mockInsert.mockResolvedValue({ id: 'plug_1', name: 'New Plugin', source: 'custom' });
    const req = createMockReq('POST', {
      name: 'New Plugin',
      description: 'A test plugin',
      version: '1.0.0',
      source: 'custom',
    }, { path: [] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('rejects invalid plugin source', async () => {
    const req = createMockReq('POST', {
      name: 'Bad Plugin',
      description: 'Test',
      version: '1.0.0',
      source: 'malicious',
    }, { path: [] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('enables a plugin', async () => {
    mockSelectOne.mockResolvedValue({ id: 'pl1', user_id: 'test_user' });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', undefined, { path: ['pl1', 'enable'] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.body.status).toBe('active');
  });

  it('disables a plugin', async () => {
    mockSelectOne.mockResolvedValue({ id: 'pl1', user_id: 'test_user' });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', undefined, { path: ['pl1', 'disable'] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.body.status).toBe('inactive');
  });

  it('prevents managing other users plugins', async () => {
    mockSelectOne.mockResolvedValue({ id: 'pl1', user_id: 'other_user' });
    const req = createMockReq('POST', undefined, { path: ['pl1', 'enable'] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('deletes a plugin', async () => {
    mockSelectOne.mockResolvedValue({ id: 'pl1', user_id: 'test_user' });
    mockRemove.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['pl1'] });
    const res = createMockRes();
    await handlePlugin(req, res);
    expect(res.body.deleted).toBe(true);
  });
});