/**
 * adminBilling.ts — Invoicing, payment records, tax.
 *
 * Manages billing operations: invoices, payment records, tax rates,
 * subscription cycles, and billing history for organizations.
 */

import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
} from './supabaseRest.js';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'card' | 'bank_transfer' | 'invoice' | 'subscription';
export type BillingCycle = 'monthly' | 'annual';

export interface InvoiceRecord {
  id: string;
  org_id: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  due_date: string;
  paid_date: string | null;
  description: string | null;
  line_items: Array<{ description: string; amount: number; quantity: number }> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  org_id: string;
  invoice_id: string | null;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  transaction_ref: string | null;
  notes: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface TaxRateRecord {
  id: string;
  region: string;
  rate: number;
  is_default: boolean;
  effective_from: string | null;
  effective_to: string | null;
}

export interface CreateInvoiceInput {
  org_id: string;
  amount: number;
  tax_amount?: number;
  currency?: string;
  due_date: string;
  description?: string;
  line_items?: Array<{ description: string; amount: number; quantity: number }>;
}

export interface CreatePaymentInput {
  org_id: string;
  invoice_id?: string;
  method: PaymentMethod;
  amount: number;
  currency?: string;
  notes?: string;
}

const DEFAULT_TAX_RATE = 0.0;
const DEFAULT_CURRENCY = 'USD';

export async function listInvoices(
  filters: {
    org_id?: string;
    status?: InvoiceStatus;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ invoices: InvoiceRecord[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { invoices: [], total: 0 };
  }

  const where: { column: string; value: any; op?: string }[] = [];
  if (filters.org_id) where.push({ column: 'org_id', value: filters.org_id, op: 'eq' });
  if (filters.status) where.push({ column: 'status', value: filters.status, op: 'eq' });
  if (filters.date_from) where.push({ column: 'created_at', value: filters.date_from, op: 'gte' });
  if (filters.date_to) where.push({ column: 'created_at', value: filters.date_to, op: 'lte' });

  const invoices = await selectMany('invoices', {
    select: 'id,org_id,number,status,amount,tax_amount,total_amount,currency,due_date,paid_date,description,line_items,created_at,updated_at',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  return { invoices: invoices as InvoiceRecord[], total: invoices.length };
}

export async function getInvoice(id: string): Promise<InvoiceRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const invoice = await selectOne('invoices', {
    column: 'id',
    value: id,
    select: 'id,org_id,number,status,amount,tax_amount,total_amount,currency,due_date,paid_date,description,line_items,created_at,updated_at',
  });
  return invoice as InvoiceRecord | null;
}

export async function createInvoice(
  input: CreateInvoiceInput,
  adminId: string
): Promise<InvoiceRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  if (!input.org_id) throw new Error('Organization ID is required');
  if (input.amount < 0) throw new Error('Amount cannot be negative');

  const taxAmount = input.tax_amount ?? Math.round(input.amount * DEFAULT_TAX_RATE * 100) / 100;
  const total = input.amount + taxAmount;

  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const invoice = await insert('invoices', {
    org_id: input.org_id,
    number: invoiceNumber,
    status: 'draft',
    amount: input.amount,
    tax_amount: taxAmount,
    total_amount: total,
    currency: input.currency || DEFAULT_CURRENCY,
    due_date: input.due_date,
    description: input.description || null,
    line_items: input.line_items || null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });

  return invoice as InvoiceRecord;
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  adminId: string
): Promise<InvoiceRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'paid') {
    updates.paid_date = new Date().toISOString();
  }

  const result = await update('invoices', { column: 'id', value: id }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Invoice not found');

  return updated as InvoiceRecord;
}

export async function listPayments(
  filters: {
    org_id?: string;
    invoice_id?: string;
    status?: 'succeeded' | 'pending' | 'failed' | 'refunded';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ payments: PaymentRecord[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { payments: [], total: 0 };
  }

  const where: { column: string; value: any; op?: string }[] = [];
  if (filters.org_id) where.push({ column: 'org_id', value: filters.org_id, op: 'eq' });
  if (filters.invoice_id) where.push({ column: 'invoice_id', value: filters.invoice_id, op: 'eq' });
  if (filters.status) where.push({ column: 'status', value: filters.status, op: 'eq' });

  const payments = await selectMany('payments', {
    select: 'id,org_id,invoice_id,method,amount,currency,status,transaction_ref,notes,processed_at,created_at',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  return { payments: payments as PaymentRecord[], total: payments.length };
}

export async function recordPayment(
  input: CreatePaymentInput,
  adminId: string
): Promise<PaymentRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  if (!input.org_id) throw new Error('Organization ID is required');

  const payment = await insert('payments', {
    org_id: input.org_id,
    invoice_id: input.invoice_id || null,
    method: input.method,
    amount: input.amount,
    currency: input.currency || DEFAULT_CURRENCY,
    status: 'succeeded',
    transaction_ref: `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    notes: input.notes || null,
    processed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  if (input.invoice_id) {
    await updateInvoiceStatus(input.invoice_id, 'paid', adminId);
  }

  return payment as PaymentRecord;
}

export async function listTaxRates(): Promise<TaxRateRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const rates = await selectMany('tax_rates', {
    select: 'id,region,rate,is_default,effective_from,effective_to',
    orderBy: { column: 'region', ascending: true },
  });
  return rates as TaxRateRecord[];
}

export async function calculateTax(
  amount: number,
  region?: string
): Promise<{ tax: number; rate: number; total: number }> {
  if (!isSupabaseConfigured()) {
    return { tax: 0, rate: DEFAULT_TAX_RATE, total: amount };
  }

  let rate = DEFAULT_TAX_RATE;

  if (region) {
    const rates = await listTaxRates();
    const matched = rates.find(r => r.region === region);
    if (matched) rate = matched.rate;
  } else {
    const rates = await listTaxRates();
    const def = rates.find(r => r.is_default);
    if (def) rate = def.rate;
  }

  const tax = Math.round(amount * rate * 100) / 100;
  return { tax, rate, total: amount + tax };
}

export async function getBillingSummary(orgId: string): Promise<{
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  invoice_count: number;
  payment_count: number;
  upcoming_invoices: InvoiceRecord[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      total_invoiced: 0,
      total_paid: 0,
      total_outstanding: 0,
      invoice_count: 0,
      payment_count: 0,
      upcoming_invoices: [],
    };
  }

  const { invoices } = await listInvoices({ org_id: orgId, limit: 500 });
  const { payments } = await listPayments({ org_id: orgId, limit: 500 });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const upcoming = invoices.filter(
    inv => inv.status === 'pending' || inv.status === 'overdue'
  );

  return {
    total_invoiced: totalInvoiced,
    total_paid: totalPaid,
    total_outstanding: Math.max(0, totalInvoiced - totalPaid),
    invoice_count: invoices.length,
    payment_count: payments.length,
    upcoming_invoices: upcoming,
  };
}
