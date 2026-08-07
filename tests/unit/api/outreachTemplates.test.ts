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

import { handleOutreachTemplates } from '../../../api/_lib/outreachTemplates';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}
function createMockRes() {
  const res: any = { statusCode: 200, headers: {}, status: vi.fn().mockImplementation(function(c: number) { this.statusCode = c; return this; }), json: vi.fn().mockImplementation(function(d: any) { this.body = d; return this; }), setHeader: vi.fn() };
  return res;
}

describe('outreachTemplates', () => {
  beforeEach(() => { vi.clearAllMocks(); mockIsConfigured.mockReturnValue(true); });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists templates', async () => {
    mockSelectMany.mockResolvedValue([{ id: 't1', name: 'Test', channel: 'email', variables: ['name'] }]);
    const req = createMockReq('GET', undefined, { path: [] });
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.body.templates).toHaveLength(1);
  });

  it('creates template with variable extraction', async () => {
    mockInsert.mockResolvedValue({ id: 'tpl_1', name: 'Welcome', variables: ['name', 'company'] });
    const req = createMockReq('POST', { name: 'Welcome', channel: 'email', body: 'Hi {name}, welcome to {company}' }, { path: [] });
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.statusCode).toBe(201);
    const callArgs = mockInsert.mock.calls[0];
    expect(callArgs[1].variables).toEqual(['name', 'company']);
  });

  it('rejects template without required fields', async () => {
    const req = createMockReq('POST', { name: 'Missing' }, { path: [] });
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('personalizes template in preview', async () => {
    mockSelectOne.mockResolvedValue({ id: 't1', subject: 'Hello {name}', body: 'Your score is {score}' });
    const req = createMockReq('POST', { variables: { name: 'John', score: '95' } }, { path: ['t1', 'preview'] });
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.body.preview.subject).toBe('Hello John');
    expect(res.body.preview.body).toBe('Your score is 95');
  });

  it('handles unresolved variables in preview', async () => {
    mockSelectOne.mockResolvedValue({ id: 't1', subject: 'Hello {name}', body: 'Here is {unknown_var}' });
    const req = createMockReq('POST', { variables: { name: 'John' } }, { path: ['t1', 'preview'] });
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.body.preview.unresolved).toBe(1);
  });

  it('deletes a template', async () => {
    mockSelectOne.mockResolvedValue({ id: 't1', user_id: 'test_user' });
    mockRemove.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['t1'] });
    const res = createMockRes();
    await handleOutreachTemplates(req, res);
    expect(res.body.deleted).toBe(true);
  });
});