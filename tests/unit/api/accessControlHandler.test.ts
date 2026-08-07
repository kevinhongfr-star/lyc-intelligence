import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectOne = vi.fn();
const mockSelectMany = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: (...args: any[]) => mockRemove(...args),
  isSupabaseConfigured: () => true,
  handleError: vi.fn((res: any, _label: string, err: any) => {
    res.status(500).json({ success: false, error: String(err) });
  }),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'user-1' }, error: null })),
}));

import { handleAccessControl } from '../../../api/_lib/accessControlHandler';

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

describe('handleAccessControl', () => {
  it('lists roles', async () => {
    mockSelectMany.mockResolvedValue([]);
    const req = createMockReq('GET', undefined, { path: ['roles'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.roles).toBeDefined();
  });

  it('creates a role', async () => {
    mockInsert.mockResolvedValue({ id: 'role_1', name: 'Custom Role' });
    const req = createMockReq('POST', { name: 'Custom Role', permissions: ['read'] }, { path: ['roles'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 for missing role name', async () => {
    const req = createMockReq('POST', { permissions: ['read'] }, { path: ['roles'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('prevents updating system roles', async () => {
    mockSelectOne.mockResolvedValue({ id: 'role_admin', is_system: true });
    const req = createMockReq('PUT', { name: 'Modified' }, { path: ['roles', 'role_admin'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('lists permissions', async () => {
    const req = createMockReq('GET', undefined, { path: ['permissions'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.body.permissions.length).toBeGreaterThan(0);
  });

  it('assigns a role to a user', async () => {
    mockInsert.mockResolvedValue({ id: 'assign_1' });
    const req = createMockReq('POST', { user_id: 'user-2', role_id: 'role_consultant' }, { path: ['assignments'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('checks a permission', async () => {
    mockSelectMany.mockResolvedValue([{ role_id: 'role_admin' }]);
    const req = createMockReq('POST', { permission: 'read' }, { path: ['check'] });
    const res = createMockRes();
    await handleAccessControl(req, res);
    expect(res.body.has_permission).toBeDefined();
  });
});