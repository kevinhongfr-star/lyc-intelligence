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

import { handleDataResidency } from '../../../api/_lib/dataResidencyHandler';

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

describe('handleDataResidency', () => {
  it('returns available regions', async () => {
    const req = createMockReq('GET', undefined, { path: ['regions'] });
    const res = createMockRes();
    await handleDataResidency(req, res);
    expect(res.body.regions.length).toBeGreaterThan(0);
  });

  it('returns data residency config', async () => {
    mockSelectOne.mockResolvedValue(null);
    const req = createMockReq('GET', undefined, { path: ['config'] });
    const res = createMockRes();
    await handleDataResidency(req, res);
    expect(res.body.config.primary_region).toBeDefined();
  });

  it('updates data residency config', async () => {
    mockSelectOne.mockResolvedValue(null);
    mockInsert.mockResolvedValue({ id: 'default' });
    const req = createMockReq('PUT', { primary_region: 'eu-west', gdpr_compliant: true }, { path: ['config'] });
    const res = createMockRes();
    await handleDataResidency(req, res);
    expect(res.body.config.primary_region).toBe('eu-west');
  });

  it('creates a data export request', async () => {
    mockInsert.mockResolvedValue({ id: 'dpa_1', type: 'export', status: 'pending' });
    const req = createMockReq('POST', { data_types: ['all'], format: 'json' }, { path: ['export'] });
    const res = createMockRes();
    await handleDataResidency(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.request.type).toBe('export');
  });

  it('creates a data deletion request', async () => {
    mockInsert.mockResolvedValue({ id: 'dpa_2', type: 'deletion', status: 'pending' });
    const req = createMockReq('POST', { data_types: ['all'] }, { path: ['delete'] });
    const res = createMockRes();
    await handleDataResidency(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.request.type).toBe('deletion');
  });

  it('returns retention policies', async () => {
    mockSelectMany.mockResolvedValue([]);
    const req = createMockReq('GET', undefined, { path: ['retention'] });
    const res = createMockRes();
    await handleDataResidency(req, res);
    expect(res.body.policies).toBeDefined();
  });
});