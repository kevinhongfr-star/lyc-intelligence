import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectOne = vi.fn();
const mockSelectMany = vi.fn();
const mockInsert = vi.fn();
const mockRemove = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  remove: (...args: any[]) => mockRemove(...args),
  isSupabaseConfigured: () => true,
  handleError: vi.fn((res: any, _label: string, err: any) => {
    res.status(500).json({ success: false, error: String(err) });
  }),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'user-1' }, error: null })),
}));

import { handleMonitoring } from '../../../api/_lib/monitoringHandler';

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

describe('handleMonitoring', () => {
  it('returns health check', async () => {
    const req = createMockReq('GET', undefined, { path: ['health'] });
    const res = createMockRes();
    await handleMonitoring(req, res);
    expect(res.body.status).toBeDefined();
    expect(res.body.services.length).toBeGreaterThan(0);
  });

  it('returns metrics', async () => {
    const req = createMockReq('GET', undefined, { path: ['metrics'] });
    const res = createMockRes();
    await handleMonitoring(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.requests_total_30d).toBeDefined();
  });

  it('lists services', async () => {
    const req = createMockReq('GET', undefined, { path: ['services'] });
    const res = createMockRes();
    await handleMonitoring(req, res);
    expect(res.body.services).toBeDefined();
  });

  it('lists active alerts', async () => {
    mockSelectMany.mockResolvedValue([]);
    const req = createMockReq('GET', undefined, { path: ['alerts'] });
    const res = createMockRes();
    await handleMonitoring(req, res);
    expect(res.body.alerts).toBeDefined();
  });

  it('creates an alert rule', async () => {
    mockInsert.mockResolvedValue({ id: 'alert_1' });
    const req = createMockReq('POST', { name: 'High Error Rate', condition: 'error_rate > 5%' }, { path: ['alerts'] });
    const res = createMockRes();
    await handleMonitoring(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('deletes an alert rule', async () => {
    mockSelectOne.mockResolvedValue({ id: 'alert_1', user_id: 'user-1' });
    mockRemove.mockResolvedValue({ success: true });
    const req = createMockReq('DELETE', undefined, { path: ['alerts', 'alert_1'] });
    const res = createMockRes();
    await handleMonitoring(req, res);
    expect(res.body.deleted).toBe(true);
  });
});