import React from 'react';

interface Invoice {
  id: string;
  desc: string;
  amount: string;
  status: string;
}

interface InvoiceBillingProps {
  invoices: Invoice[];
}

const STATUS_COLORS: Record<string, string> = {
  DUE: 'bg-error/10 text-error',
  PAID: 'bg-teal/10 text-teal',
  PENDING: 'bg-warning/10 text-warning',
};

export function InvoiceBilling({ invoices }: InvoiceBillingProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Invoice & Billing</h2>
      
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center justify-between p-4 bg-bg-primary border border-bg-tertiary"
          >
            <div>
              <p className="font-medium text-text-primary">{invoice.id}</p>
              <p className="text-sm text-text-muted">{invoice.desc}</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-text-primary">{invoice.amount}</span>
              <span className={`px-3 py-1 text-xs font-medium ${STATUS_COLORS[invoice.status] || 'bg-bg-tertiary text-text-muted'}`}>
                {invoice.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}