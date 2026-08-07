/**
 * Tests for adminBilling.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: vi.fn(),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn(),
}));

import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoiceStatus,
  listPayments,
  recordPayment,
  listTaxRates,
  calculateTax,
  getBillingSummary,
} from '../../../api/_lib/adminBilling';

describe('adminBilling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('listInvoices', () => {
    it('returns invoices', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', number: 'INV-001', status: 'pending', amount: 100 },
      ]);
      const result = await listInvoices();
      expect(result.invoices).toHaveLength(1);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listInvoices();
      expect(result.invoices).toHaveLength(0);
    });
  });

  describe('getInvoice', () => {
    it('returns invoice by id', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', number: 'INV-001' });
      const result = await getInvoice('1');
      expect(result?.number).toBe('INV-001');
    });

    it('returns null for missing invoice', async () => {
      mockSelectOne.mockResolvedValue(null);
      const result = await getInvoice('999');
      expect(result).toBeNull();
    });
  });

  describe('createInvoice', () => {
    it('creates invoice with line items', async () => {
      mockInsert.mockResolvedValue({
        id: '1',
        number: 'INV-202601-1234',
        status: 'draft',
        amount: 1000,
        tax_amount: 0,
        total_amount: 1000,
      });

      const result = await createInvoice({
        org_id: 'org-1',
        amount: 1000,
        due_date: '2026-12-31',
        line_items: [{ description: 'Service', amount: 1000, quantity: 1 }],
      }, 'admin-1');

      expect(result.number).toMatch(/^INV-/);
      expect(result.status).toBe('draft');
      expect(result.total_amount).toBe(1000);
    });

    it('throws on negative amount', async () => {
      await expect(createInvoice({
        org_id: 'org-1',
        amount: -100,
        due_date: '2026-12-31',
      }, 'admin-1')).rejects.toThrow('Amount cannot be negative');
    });
  });

  describe('updateInvoiceStatus', () => {
    it('marks invoice as paid', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'paid', paid_date: new Date().toISOString() }]);
      const result = await updateInvoiceStatus('1', 'paid', 'admin-1');
      expect(result.status).toBe('paid');
      expect(result.paid_date).toBeTruthy();
    });

    it('throws when not found', async () => {
      mockUpdate.mockResolvedValue([]);
      await expect(updateInvoiceStatus('999', 'paid', 'admin-1'))
        .rejects.toThrow('Invoice not found');
    });
  });

  describe('listPayments', () => {
    it('returns payments filtered by org', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', org_id: 'org-1', amount: 500, status: 'succeeded' },
      ]);
      const result = await listPayments({ org_id: 'org-1' });
      expect(result.payments).toHaveLength(1);
    });
  });

  describe('recordPayment', () => {
    it('records payment and marks invoice paid', async () => {
      mockInsert.mockResolvedValue({
        id: '1',
        org_id: 'org-1',
        method: 'card',
        amount: 500,
        status: 'succeeded',
      });
      mockUpdate.mockResolvedValue([{ id: 'inv-1', status: 'paid' }]);

      const result = await recordPayment({
        org_id: 'org-1',
        invoice_id: 'inv-1',
        method: 'card',
        amount: 500,
      }, 'admin-1');

      expect(result.status).toBe('succeeded');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('listTaxRates', () => {
    it('returns tax rates', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', region: 'US', rate: 0.0875, is_default: true },
        { id: '2', region: 'EU', rate: 0.20, is_default: false },
      ]);
      const rates = await listTaxRates();
      expect(rates).toHaveLength(2);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const rates = await listTaxRates();
      expect(rates).toHaveLength(0);
    });
  });

  describe('calculateTax', () => {
    it('applies default tax rate', async () => {
      mockSelectMany.mockResolvedValue([]);
      const result = await calculateTax(1000);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(1000);
    });

    it('applies regional tax rate', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', region: 'EU', rate: 0.20, is_default: false },
      ]);
      const result = await calculateTax(1000, 'EU');
      expect(result.tax).toBe(200);
      expect(result.total).toBe(1200);
    });
  });

  describe('getBillingSummary', () => {
    it('aggregates invoiced and paid amounts', async () => {
      mockSelectMany
        .mockResolvedValueOnce([
          { id: 'inv-1', total_amount: 1000, status: 'paid' },
          { id: 'inv-2', total_amount: 500, status: 'pending' },
        ])
        .mockResolvedValueOnce([
          { id: 'pay-1', amount: 1000, status: 'succeeded' },
        ]);

      const summary = await getBillingSummary('org-1');
      expect(summary.total_invoiced).toBe(1500);
      expect(summary.total_paid).toBe(1000);
      expect(summary.total_outstanding).toBe(500);
      expect(summary.invoice_count).toBe(2);
    });
  });
});
