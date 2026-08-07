import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectMany: (...args: any[]) => mockSelectMany(...args),
  selectOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn((res: any, _: string, err: any) => res.status(500).json({ success: false, error: String(err) })),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'test_user', role: 'admin' }, error: null })),
}));

import { handleAnalyticsTracking } from '../../../api/_lib/analyticsTracking';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}
function createMockRes() {
  const res: any = { statusCode: 200, headers: {}, status: vi.fn().mockImplementation(function(c: number) { this.statusCode = c; return this; }), json: vi.fn().mockImplementation(function(d: any) { this.body = d; return this; }), setHeader: vi.fn() };
  return res;
}

describe('analyticsTracking', () => {
  beforeEach(() => { vi.clearAllMocks(); mockIsConfigured.mockReturnValue(true); });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleAnalyticsTracking(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('returns overview with computed metrics', async () => {
    mockSelectMany.mockResolvedValue([
      { status: 'sent', outcome: 'sent' },
      { status: 'sent', outcome: 'delivered' },
      { status: 'failed', outcome: 'failed' },
    ]);
    const req = createMockReq('GET', undefined, { path: ['overview'] });
    const res = createMockRes();
    await handleAnalyticsTracking(req, res);
    expect(res.body.summary.total_attempts_30d).toBe(3);
  });

  it('returns funnel data with steps', async () => {
    mockSelectMany.mockResolvedValue([
      { status: 'sent', outcome: 'sent' },
      { status: 'sent', outcome: 'sent' },
      { status: 'sent', outcome: 'delivered' },
    ]);
    const req = createMockReq('GET', undefined, { path: ['funnel'] });
    const res = createMockRes();
    await handleAnalyticsTracking(req, res);
    expect(res.body.funnel.length).toBe(7);
    expect(res.body.funnel[0].step).toBe('Attempts Sent');
  });

  it('returns channel performance', async () => {
    const req = createMockReq('GET', undefined, { path: ['channels'] });
    const res = createMockRes();
    await handleAnalyticsTracking(req, res);
    expect(res.body.channels.length).toBe(3);
    expect(res.body.channels[0].channel).toBeDefined();
  });

  it('returns trend data', async () => {
    const req = createMockReq('GET', undefined, { path: ['trends'] });
    const res = createMockRes();
    await handleAnalyticsTracking(req, res);
    expect(res.body.trends.length).toBe(14);
  });

  it('returns campaign analytics', async () => {
    mockSelectMany.mockResolvedValue([{ status: 'sent' }, { status: 'sent' }]);
    const req = createMockReq('GET', undefined, { path: ['campaigns', 'c1'] });
    const res = createMockRes();
    await handleAnalyticsTracking(req, res);
    expect(res.body.campaign_id).toBe('c1');
  });
});