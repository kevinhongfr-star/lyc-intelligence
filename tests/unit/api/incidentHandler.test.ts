import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectOne = vi.fn();
const mockSelectMany = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

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

import { handleIncident } from '../../../api/_lib/incidentHandler';

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

describe('handleIncident', () => {
  it('returns public status page', async () => {
    mockSelectMany.mockResolvedValue([]);
    const req = createMockReq('GET', undefined, { path: ['status'] });
    const res = createMockRes();
    await handleIncident(req, res);
    expect(res.body.status.overall).toBeDefined();
  });

  it('lists incidents', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'inc_1', title: 'Test', status: 'investigating', severity: 'high' },
    ]);
    const req = createMockReq('GET', undefined, { path: ['incidents'] });
    const res = createMockRes();
    await handleIncident(req, res);
    expect(res.body.incidents.length).toBeGreaterThan(0);
  });

  it('creates an incident', async () => {
    mockInsert.mockResolvedValue({ id: 'inc_1' });
    const req = createMockReq('POST', { title: 'API Down', severity: 'critical' }, { path: ['incidents'] });
    const res = createMockRes();
    await handleIncident(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('returns 400 for missing fields', async () => {
    const req = createMockReq('POST', { title: 'No severity' }, { path: ['incidents'] });
    const res = createMockRes();
    await handleIncident(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('updates an incident status', async () => {
    mockSelectOne.mockResolvedValue({ id: 'inc_1', user_id: 'user-1' });
    mockUpdate.mockResolvedValue({ id: 'inc_1', status: 'resolved' });
    const req = createMockReq('PUT', { status: 'resolved' }, { path: ['incidents', 'inc_1'] });
    const res = createMockRes();
    await handleIncident(req, res);
    expect(res.body.incident.status).toBe('resolved');
  });

  it('returns incident updates', async () => {
    mockSelectMany.mockResolvedValue([]);
    const req = createMockReq('GET', undefined, { path: ['incidents', 'inc_1', 'updates'] });
    const res = createMockRes();
    await handleIncident(req, res);
    expect(res.body.updates).toBeDefined();
  });
});