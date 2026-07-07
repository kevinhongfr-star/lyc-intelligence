import React from 'react';
import { Download, FileText, CreditCard } from 'lucide-react';

const MOCK_CONTRACTS = [
  { name: 'Master Services Agreement', status: 'Active', date: 'Jan 2026' },
  { name: 'CTO Search Addendum', status: 'Active', date: 'May 2026' },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-031', desc: 'M-031 CTO Retainer', amount: '$15,000', status: 'DUE' },
  { id: 'INV-2026-028', desc: 'M-028 Retainer', amount: '$12,000', status: 'PAID' },
  { id: 'INV-2026-025', desc: 'M-025 Success Fee', amount: '$72,000', status: 'PENDING' },
];

const MOCK_REPORTS = [
  { name: 'Candidate Comparison M-028', type: 'PDF' },
  { name: 'Market Mapping Summary', type: 'PDF' },
];

export function ClientPortalDocuments() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Documents & Billing</h1>
        <p className="text-text-muted mt-1">Access contracts, invoices, and reports</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-bg-secondary border border-bg-tertiary p-6">
          <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Contracts
          </h2>
          <div className="space-y-2">
            {MOCK_CONTRACTS.map((contract) => (
              <div key={contract.name} className="bg-bg-primary border border-bg-tertiary p-4">
                <p className="font-medium text-text-primary">{contract.name}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-text-muted">{contract.date}</span>
                  <span className={`text-xs font-medium ${contract.status === 'Active' ? 'bg-teal/10 text-teal' : 'bg-bg-tertiary text-text-muted'}`}>
                    {contract.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary border border-bg-tertiary p-6">
          <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Invoices
          </h2>
          <div className="space-y-2">
            {MOCK_INVOICES.map((invoice) => (
              <div key={invoice.id} className="bg-bg-primary border border-bg-tertiary p-4">
                <p className="font-medium text-text-primary">{invoice.id}</p>
                <p className="text-sm text-text-muted">{invoice.desc}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-bold text-text-primary">{invoice.amount}</span>
                  <span className={`text-xs font-medium ${invoice.status === 'PAID' ? 'bg-teal/10 text-teal' : invoice.status === 'DUE' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary border border-bg-tertiary p-6">
          <h2 className="font-serif text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Reports
          </h2>
          <div className="space-y-2">
            {MOCK_REPORTS.map((report) => (
              <button
                key={report.name}
                className="w-full bg-bg-primary border border-bg-tertiary p-4 hover:border-accent/50 transition-colors text-left"
              >
                <p className="font-medium text-text-primary">{report.name}</p>
                <p className="text-sm text-text-muted">{report.type}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}