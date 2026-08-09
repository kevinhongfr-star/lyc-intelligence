/**
 * BillingPage — Invoicing, payment records, tax management.
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  CreditCard,
  Receipt,
  Plus,
  Download,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  due_date: string;
  org_id: string;
}

interface Payment {
  id: string;
  method: string;
  amount: number;
  status: string;
  transaction_ref: string | null;
  created_at: string;
}

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-gray-100 text-gray-500',
};

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'tax'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    org_id: '',
    amount: '',
    due_date: '',
    description: '',
  });
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const { invoices } = await adminService.billing.invoices();
        setInvoices(invoices);
      } else if (activeTab === 'payments') {
        const { payments } = await adminService.billing.payments();
        setPayments(payments);
      }
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInvoice() {
    if (!newInvoice.org_id || !newInvoice.amount) return;
    try {
      await adminService.billing.createInvoice({
        org_id: newInvoice.org_id,
        amount: parseFloat(newInvoice.amount),
        due_date: newInvoice.due_date,
        description: newInvoice.description || undefined,
      });
      setShowCreateInvoice(false);
      setNewInvoice({ org_id: '', amount: '', due_date: '', description: '' });
      loadData();
    } catch (err) {
      alert('Failed to create invoice:' + (err as Error).message);
    }
  }

  async function handleMarkPaid(id: string) {
    setMarkingPaid(id);
    try {
      await adminService.billing.updateInvoiceStatus(id, 'paid');
      loadData();
    } catch (err) {
      alert('Failed to mark as paid:' + (err as Error).message);
    } finally {
      setMarkingPaid(null);
    }
  }

  const totalOutstanding = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total_amount, 0);

  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total_amount, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Billing & Invoicing</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage invoices, payment records, and tax configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Outstanding"
          value={`$${totalOutstanding.toLocaleString()}`}
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-600"
        />
        <SummaryCard
          label="Total Paid"
          value={`$${totalPaid.toLocaleString()}`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="text-green-600"
        />
        <SummaryCard
          label="Total Invoiced"
          value={`$${(totalOutstanding + totalPaid).toLocaleString()}`}
          icon={<Receipt className="w-5 h-5" />}
          color="text-fuchsia"
        />
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <FileText className="w-4 h-4" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payments
        </button>
        <button
          onClick={() => setActiveTab('tax')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tax'
              ? 'border-fuchsia text-fuchsia'
              : 'border-transparent text-text-muted hover:text-text-secondary'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Tax Rates
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateInvoice(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading invoices...
            </div>
          ) : (
            <div className="bg-white border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">Invoice #</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Organization</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Due Date</th>
                    <th className="px-4 py-3 font-medium text-text-secondary"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="border-t border-border hover:bg-bg-warm">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{inv.number}</td>
                        <td className="px-4 py-3 text-sm">{inv.org_id}</td>
                        <td className="px-4 py-3 font-medium">${inv.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_STYLES[inv.status] || 'bg-gray-100'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {(inv.status === 'pending' || inv.status === 'overdue') && (
                            <button
                              onClick={() => handleMarkPaid(inv.id)}
                              disabled={markingPaid === inv.id}
                              className="text-xs text-fuchsia hover:underline disabled:opacity-50"
                            >
                              {markingPaid === inv.id ? 'Processing...' : 'Mark as Paid'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading payments...
            </div>
          ) : (
            <div className="bg-white border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-bg text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-text-secondary">Transaction</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Method</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="border-t border-border hover:bg-bg-warm">
                        <td className="px-4 py-3 font-mono text-xs">{p.transaction_ref || p.id}</td>
                        <td className="px-4 py-3 capitalize text-sm">{p.method}</td>
                        <td className="px-4 py-3 font-medium">${p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium ${
                            p.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                            p.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="bg-white border border-border p-6 text-center text-text-muted">
          <Receipt className="w-10 h-10 mx-auto mb-3" />
          <p className="text-sm">Tax rate management is available in the API.</p>
          <p className="text-xs mt-1">Configure default tax rates and regional overrides.</p>
        </div>
      )}

      {showCreateInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-border p-6 w-full max-w-md">
            <h3 className="text-lg font-serif font-semibold mb-4">Create Invoice</h3>
            <div className="space-y-3">
              <input
                value={newInvoice.org_id}
                onChange={e => setNewInvoice({ ...newInvoice, org_id: e.target.value })}
                placeholder="Organization ID"
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <input
                type="number"
                value={newInvoice.amount}
                onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                placeholder="Amount"
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <input
                type="date"
                value={newInvoice.due_date}
                onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
              <textarea
                value={newInvoice.description}
                onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="Description (optional)"
                rows={3}
                className="w-full px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreateInvoice(false)} className="px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm">Cancel</button>
              <button onClick={handleCreateInvoice} disabled={!newInvoice.org_id || !newInvoice.amount} className="px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90 disabled:opacity-50">Create Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({
  label, value, icon, color,
}) => (
  <div className="bg-white border border-border p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <span className={color}>{icon}</span>
    </div>
    <p className="text-2xl font-serif font-semibold">{value}</p>
  </div>
);

export default BillingPage;
