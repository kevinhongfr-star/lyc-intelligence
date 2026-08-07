import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectMany: (...args: any[]) => mockSelectMany(...args),
  selectOne: (...args: any[]) => mockSelectOne(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: vi.fn(),
  remove: vi.fn(),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn((res: any, _: string, err: any) => res.status(500).json({ success: false, error: String(err) })),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'test_user', role: 'admin' }, error: null })),
}));

import { handleOutreach } from '../../../api/_lib/outreachEngine';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}
function createMockRes() {
  const res: any = { statusCode: 200, headers: {}, status: vi.fn().mockImplementation(function(c: number) { this.statusCode = c; return this; }), json: vi.fn().mockImplementation(function(d: any) { this.body = d; return this; }), setHeader: vi.fn() };
  return res;
}

describe('outreachEngine', () => {
  beforeEach(() => { vi.clearAllMocks(); mockIsConfigured.mockReturnValue(true); });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('sends outreach attempt', async () => {
    mockInsert.mockResolvedValueOnce({ id: 'oa_1' }).mockResolvedValueOnce({ id: 'oa_1' });
    mockSelectOne.mockResolvedValue({ id: 'oa_1', status: 'sent' });
    const req = createMockReq('POST', { channel: 'email', candidate_id: 'c1', subject: 'Test' }, { path: ['send'] });
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const req = createMockReq('POST', { channel: 'email' }, { path: ['send'] });
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('bulk sends to multiple candidates', async () => {
    mockInsert.mockResolvedValue({});
    const req = createMockReq('POST', { channel: 'email', candidate_ids: ['c1', 'c2', 'c3'], subject: 'Bulk Test' }, { path: ['bulk'] });
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.body.sent).toBe(3);
  });

  it('limits bulk to 50 recipients', async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `c${i}`);
    const req = createMockReq('POST', { channel: 'email', candidate_ids: ids, subject: 'Too Many' }, { path: ['bulk'] });
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('lists outreach attempts', async () => {
    mockSelectMany.mockResolvedValue([{ id: 'oa_1', channel: 'email', status: 'sent' }]);
    const req = createMockReq('GET', undefined, { path: ['attempts'] });
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.body.attempts).toHaveLength(1);
  });

  it('returns 404 for unknown route', async () => {
    const req = createMockReq('GET', undefined, { path: ['unknown'] });
    const res = createMockRes();
    await handleOutreach(req, res);
    expect(res.statusCode).toBe(404);
  });
});