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

import { handlePayment } from '../../../api/_lib/paymentMultiHandler';

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

describe('handlePayment', () => {
  it('lists available methods on GET /payment/methods', async () => {
    const req = createMockReq('GET', undefined, { path: ['methods'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.methods.length).toBeGreaterThanOrEqual(3);
  });

  it('processes a payment with Stripe', async () => {
    mockInsert.mockResolvedValueOnce({ id: 'pay_1', status: 'processing' });
    mockUpdate.mockResolvedValueOnce({ id: 'pay_1', status: 'completed' });
    const req = createMockReq('POST', { processor: 'stripe', amount: 99.99, currency: 'USD' }, { path: ['process'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.payment.status).toBe('completed');
  });

  it('returns 400 for invalid payment amount', async () => {
    const req = createMockReq('POST', { processor: 'stripe', amount: 0, currency: 'USD' }, { path: ['process'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns payment status', async () => {
    mockSelectOne.mockResolvedValueOnce({ id: 'pay_1', status: 'completed' });
    const req = createMockReq('GET', undefined, { path: ['status', 'pay_1'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.body.payment.id).toBe('pay_1');
  });

  it('refunds a completed payment', async () => {
    mockSelectOne.mockResolvedValueOnce({ id: 'pay_1', user_id: 'user-1', status: 'completed', amount: 99.99 });
    mockUpdate.mockResolvedValueOnce({ id: 'pay_1', status: 'refunded' });
    const req = createMockReq('POST', undefined, { path: ['refund', 'pay_1'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.body.status).toBe('refunded');
  });

  it('prevents refunding non-completed payment', async () => {
    mockSelectOne.mockResolvedValueOnce({ id: 'pay_1', user_id: 'user-1', status: 'pending', amount: 99.99 });
    const req = createMockReq('POST', undefined, { path: ['refund', 'pay_1'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('returns payment history', async () => {
    mockSelectMany.mockResolvedValueOnce([]);
    const req = createMockReq('GET', undefined, { path: ['history'] });
    const res = createMockRes();
    await handlePayment(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.payments).toBeDefined();
  });
});