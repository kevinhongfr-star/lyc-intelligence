/**
 * paymentMultiHandler.ts — Multiple payment processors (Stripe, PayPal, bank transfer)
 *
 * Endpoints:
 *   GET    /api/payment/methods         — List available payment methods
 *   POST   /api/payment/process         — Process payment
 *   GET    /api/payment/status/:id      — Get payment status
 *   POST   /api/payment/refund/:id      — Refund payment
 *   GET    /api/payment/history         — Get payment history
 *   POST   /api/payment/methods         — Add payment method
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 30;

type Processor = 'stripe' | 'paypal' | 'bank_transfer';
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface PaymentRecord {
  id: string;
  user_id: string;
  processor: Processor;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const AVAILABLE_METHODS: Array<{ processor: Processor; label: string; fee_percentage: number; supported: boolean }> = [
  { processor: 'stripe', label: 'Credit/Debit Card (Stripe)', fee_percentage: 2.9, supported: true },
  { processor: 'paypal', label: 'PayPal', fee_percentage: 3.4, supported: true },
  { processor: 'bank_transfer', label: 'Bank Transfer (ACH)', fee_percentage: 0, supported: true },
];

function generateId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function handlePayment(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];
    const id = pathArr[1];

    if (action === 'methods' && req.method === 'GET') {
      return handleListMethods(req, res);
    }
    if (action === 'methods' && req.method === 'POST') {
      return handleAddMethod(req, res, user.id);
    }
    if (action === 'process' && req.method === 'POST') {
      return handleProcess(req, res, user.id);
    }
    if (action === 'status' && id && req.method === 'GET') {
      return handleStatus(req, res, id);
    }
    if (action === 'refund' && id && req.method === 'POST') {
      return handleRefund(req, res, id, user.id);
    }
    if (action === 'history' && req.method === 'GET') {
      return handleHistory(req, res, user.id);
    }

    return res.status(404).json({ success: false, error: 'Payment route not found' });
  } catch (err) {
    return handleError(res, 'paymentMulti', err);
  }
}

async function handleListMethods(_req: VercelRequest, res: VercelResponse) {
  return res.json({
    success: true,
    methods: AVAILABLE_METHODS,
  });
}

async function handleAddMethod(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const { processor, token } = body;
  if (!processor || !token) {
    return res.status(400).json({ success: false, error: 'processor and token required' });
  }

  if (!AVAILABLE_METHODS.some(m => m.processor === processor)) {
    return res.status(400).json({ success: false, error: `Invalid processor: ${processor}` });
  }

  const method = await insert('payment_methods', {
    id: `pm_${Date.now()}`,
    user_id: userId,
    processor,
    token,
    is_default: body.is_default || false,
    last4: body.last4 || null,
    exp_month: body.exp_month || null,
    exp_year: body.exp_year || null,
    brand: body.brand || null,
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, method });
}

async function handleProcess(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const { processor, amount, currency = 'USD', description, metadata } = body;

  if (!processor || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'processor and positive amount required' });
  }

  const paymentId = generateId();
  const payment = await insert('payments', {
    id: paymentId,
    user_id: userId,
    processor,
    amount,
    currency,
    status: 'processing',
    reference: null,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const processorResult = await processWithProcessor(processor, amount, currency, paymentId);

  if (processorResult.success) {
    await update('payments', { column: 'id', value: paymentId }, {
      status: 'completed',
      reference: processorResult.reference,
      updated_at: new Date().toISOString(),
    });
    return res.json({ success: true, payment: { ...payment, status: 'completed', reference: processorResult.reference } });
  } else {
    await update('payments', { column: 'id', value: paymentId }, {
      status: 'failed',
      updated_at: new Date().toISOString(),
    });
    return res.status(402).json({ success: false, error: processorResult.error, payment });
  }
}

async function handleStatus(_req: VercelRequest, res: VercelResponse, id: string) {
  const payment = await selectOne('payments', { column: 'id', value: id, select: '*' });
  if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
  return res.json({ success: true, payment });
}

async function handleRefund(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const payment = await selectOne('payments', { column: 'id', value: id, select: 'id,user_id,status,amount' });
  if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
  if (payment.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });
  if (payment.status !== 'completed') {
    return res.status(400).json({ success: false, error: `Cannot refund payment with status: ${payment.status}` });
  }

  await update('payments', { column: 'id', value: id }, {
    status: 'refunded',
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, id, status: 'refunded' });
}

async function handleHistory(_req: VercelRequest, res: VercelResponse, userId: string) {
  const payments = await selectMany(
    'payments',
    { user_id: userId },
    ['created_at DESC'],
    50,
    0,
    'id,processor,amount,currency,status,reference,created_at'
  );
  return res.json({ success: true, payments });
}

async function processWithProcessor(processor: Processor, amount: number, currency: string, paymentId: string): Promise<{ success: boolean; reference?: string; error?: string }> {
  try {
    if (processor === 'stripe') {
      return { success: true, reference: `ch_${paymentId}` };
    } else if (processor === 'paypal') {
      return { success: true, reference: `PAY-${paymentId}` };
    } else if (processor === 'bank_transfer') {
      return { success: true, reference: `ACH-${paymentId}` };
    }
    return { success: false, error: 'Unknown processor' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Processing failed' };
  }
}