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

import { handleOutreachCampaigns } from '../../../api/_lib/outreachCampaignEngine';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}
function createMockRes() {
  const res: any = { statusCode: 200, headers: {}, status: vi.fn().mockImplementation(function(c: number) { this.statusCode = c; return this; }), json: vi.fn().mockImplementation(function(d: any) { this.body = d; return this; }), setHeader: vi.fn() };
  return res;
}

describe('outreachCampaignEngine', () => {
  beforeEach(() => { vi.clearAllMocks(); mockIsConfigured.mockReturnValue(true); });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists campaigns', async () => {
    mockSelectMany.mockResolvedValue([{ id: 'c1', name: 'Test Campaign', status: 'draft' }]);
    const req = createMockReq('GET', undefined, { path: [] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.body.campaigns).toHaveLength(1);
  });

  it('creates a campaign', async () => {
    mockInsert.mockResolvedValue({ id: 'camp_1', name: 'New', status: 'draft' });
    const req = createMockReq('POST', { name: 'New', channel: 'email' }, { path: [] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('rejects campaign without name/channel', async () => {
    const req = createMockReq('POST', {}, { path: [] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('starts a campaign', async () => {
    mockSelectOne.mockResolvedValue({ id: 'c1', user_id: 'test_user', status: 'draft' });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', undefined, { path: ['c1', 'start'] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.body.status).toBe('running');
  });

  it('pauses a campaign', async () => {
    mockSelectOne.mockResolvedValue({ id: 'c1', user_id: 'test_user', status: 'running' });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', undefined, { path: ['c1', 'pause'] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.body.status).toBe('paused');
  });

  it('creates an A/B test', async () => {
    mockSelectOne.mockResolvedValue({ id: 'c1', user_id: 'test_user', template_ids: [] });
    mockInsert.mockResolvedValue({ id: 'ab_1' });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', { variant_a: 't1', variant_b: 't2' }, { path: ['c1', 'ab-test'] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('prevents managing other users campaigns', async () => {
    mockSelectOne.mockResolvedValue({ id: 'c1', user_id: 'other_user' });
    const req = createMockReq('POST', undefined, { path: ['c1', 'start'] });
    const res = createMockRes();
    await handleOutreachCampaigns(req, res);
    expect(res.statusCode).toBe(403);
  });
});