import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectOne = vi.fn();
const mockSelectMany = vi.fn();
const mockInsert = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  isSupabaseConfigured: () => true,
  handleError: vi.fn((res: any, _label: string, err: any) => {
    res.status(500).json({ success: false, error: String(err) });
  }),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'user-1' }, error: null })),
}));

import { handleLegal } from '../../../api/_lib/legalPagesHandler';

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

describe('handleLegal', () => {
  it('returns terms document', async () => {
    const req = createMockReq('GET', undefined, { path: ['terms'] });
    const res = createMockRes();
    await handleLegal(req, res);
    expect(res.body.document.type).toBe('terms');
    expect(res.body.document.title).toBeDefined();
    expect(res.body.document.version).toBeDefined();
  });

  it('returns privacy document', async () => {
    const req = createMockReq('GET', undefined, { path: ['privacy'] });
    const res = createMockRes();
    await handleLegal(req, res);
    expect(res.body.document.type).toBe('privacy');
  });

  it('returns DPA document', async () => {
    const req = createMockReq('GET', undefined, { path: ['dpa'] });
    const res = createMockRes();
    await handleLegal(req, res);
    expect(res.body.document.type).toBe('dpa');
  });

  it('returns compliance status', async () => {
    const req = createMockReq('GET', undefined, { path: ['compliance'] });
    const res = createMockRes();
    await handleLegal(req, res);
    expect(res.body.compliance.gdpr).toBeDefined();
  });

  it('accepts a legal document', async () => {
    mockInsert.mockResolvedValueOnce({ id: 'acc_1' });
    const req = createMockReq('POST', { document_type: 'terms', version: '2.3' }, { path: ['accept'] });
    const res = createMockRes();
    await handleLegal(req, res);
    expect(res.statusCode).toBe(201);
  });

  it('returns accepted documents', async () => {
    mockSelectMany.mockResolvedValueOnce([]);
    const req = createMockReq('GET', undefined, { path: ['accepted'] });
    const res = createMockRes();
    await handleLegal(req, res);
    expect(res.body.acceptances).toBeDefined();
  });
});