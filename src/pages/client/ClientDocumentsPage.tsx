/**
 * ClientDocumentsPage — B2B Client Portal documents & billing
 * Renders inside AppShell → Outlet. Data sourced from Supabase via useClientDocuments (RLS-scoped).
 */
import React, { useState } from 'react';
import { FileText, Download, Calendar, RefreshCw, Search } from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useClientDocuments } from '@/hooks/usePortalData';

interface ClientDocument {
  id: string;
  title: string;
  type: string;
  date: string;
  size: string;
  mandateId?: string | null;
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const typeColors: Record<string, string> = {
  'Report': 'bg-fuchsia/10 text-fuchsia',
  'REPORT': 'bg-fuchsia/10 text-fuchsia',
  'Invoice': 'bg-amber/10 text-amber',
  'INVOICE': 'bg-amber/10 text-amber',
  'Contract': 'bg-blue/10 text-blue',
  'CONTRACT': 'bg-blue/10 text-blue',
  'Proposal': 'bg-green/10 text-green',
  'PROPOSAL': 'bg-green/10 text-green',
  'Document': 'bg-fuchsia-light text-fuchsia',
  'DOCUMENT': 'bg-fuchsia-light text-fuchsia',
  'PDF': 'bg-fuchsia-light text-fuchsia',
};

export function ClientDocumentsPage() {
  const { data: raw, loading } = useClientDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const docs: ClientDocument[] = (raw ?? []).map((d) => ({
    id: d.id,
    title: d.name,
    type: d.type,
    date: formatDateShort(d.created_at),
    size: '—', // documents table does not track size in current schema
    mandateId: d.mandate_id,
  }));

  const filteredDocs = docs.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Documents & Billing</h1>
          <p className="text-text-secondary text-sm mt-1">Reports, invoices, contracts, and proposals.</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia"
        >
          <option value="all">All Types</option>
          <option value="Report">Reports</option>
          <option value="Invoice">Invoices</option>
          <option value="Contract">Contracts</option>
          <option value="Proposal">Proposals</option>
        </select>
      </div>

      {/* Documents list */}
      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm">Loading documents...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">No documents found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="p-4 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-fuchsia" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-text-primary">{doc.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span className={`px-2 py-0.5 rounded ${typeColors[doc.type] || 'bg-fuchsia-light text-fuchsia'}`}>{doc.type}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {doc.date}
                      </span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-bg-warm rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientDocumentsPage;
