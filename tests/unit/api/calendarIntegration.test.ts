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

import { handleCalendar } from '../../../api/_lib/calendarIntegration';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}
function createMockRes() {
  const res: any = { statusCode: 200, headers: {}, status: vi.fn().mockImplementation(function(c: number) { this.statusCode = c; return this; }), json: vi.fn().mockImplementation(function(d: any) { this.body = d; return this; }), setHeader: vi.fn() };
  return res;
}

describe('calendarIntegration', () => {
  beforeEach(() => { vi.clearAllMocks(); mockIsConfigured.mockReturnValue(true); });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists calendar events', async () => {
    mockSelectMany.mockResolvedValue([{ id: 'e1', title: 'Interview', type: 'interview' }]);
    const req = createMockReq('GET', undefined, { path: ['events'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.body.events).toHaveLength(1);
  });

  it('creates a calendar event', async () => {
    mockInsert.mockResolvedValue({ id: 'evt_1', title: 'New Event' });
    const req = createMockReq('POST', { title: 'New Event', start_time: '2026-08-10T10:00:00Z', end_time: '2026-08-10T11:00:00Z' }, { path: ['events'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('rejects event without required fields', async () => {
    const req = createMockReq('POST', { title: 'Bad' }, { path: ['events'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('deletes a calendar event', async () => {
    mockSelectOne.mockResolvedValue({ id: 'e1', user_id: 'test_user' });
    mockRemove.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['events', 'e1'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.body.deleted).toBe(true);
  });

  it('gets availability slots', async () => {
    mockSelectMany.mockResolvedValue([]);
    const req = createMockReq('GET', undefined, { path: ['availability'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.body.slots).toBeDefined();
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('lists calendar providers', async () => {
    mockSelectMany.mockResolvedValue([{ id: 'p1', provider: 'google', connected: true }]);
    const req = createMockReq('GET', undefined, { path: ['providers'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.body.providers).toHaveLength(1);
  });

  it('prevents deleting other users events', async () => {
    mockSelectOne.mockResolvedValue({ id: 'e1', user_id: 'other_user' });
    const req = createMockReq('DELETE', undefined, { path: ['events', 'e1'] });
    const res = createMockRes();
    await handleCalendar(req, res);
    expect(res.statusCode).toBe(403);
  });
});