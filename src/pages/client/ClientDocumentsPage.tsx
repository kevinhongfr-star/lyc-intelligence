/**
 * ClientDocumentsPage — B2B Client Portal documents & billing
 * Renders inside AppShell → Outlet.
 */
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, RefreshCw, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';

interface ClientDocument {
  id: string;
  title: string;
  type: 'Report' | 'Invoice' | 'Contract' | 'Proposal';
  date: string;
  size: string;
  mandateId?: string;
}

const MOCK_DOCS: ClientDocument[] = [
  { id: 'd1', title: 'Talent Deep-Dive — VP Engineering Pipeline', type: 'Report', date: '2025-01-15', size: '2.4 MB', mandateId: 'm1' },
  { id: 'd2', title: 'Q4 2024 Invoice — TechCorp', type: 'Invoice', date: '2025-01-05', size: '180 KB' },
  { id: 'd3', title: 'Executive Search Agreement — FinScale', type: 'Contract', date: '2024-12-01', size: '450 KB', mandateId: 'm2' },
  { id: 'd4', title: 'GRID Report — CTO CloudPeak', type: 'Report', date: '2025-01-12', size: '1.8 MB', mandateId: 'm4' },
  { id: 'd5', title: 'Proposal — Head of Product DataMesh', type: 'Proposal', date: '2024-12-15', size: '620 KB', mandateId: 'm3' },
];

const typeColors: Record<string, string> = {
  'Report': 'bg-fuchsia/10 text-fuchsia',
  'Invoice': 'bg-amber/10 text-amber',
  'Contract': 'bg-blue/10 text-blue',
  'Proposal': 'bg-green/10 text-green',
};

export function ClientDocumentsPage() {
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDocs(MOCK_DOCS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredDocs = docs.filter(d => {
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
                      <span className={`px-2 py-0.5 rounded ${typeColors[doc.type]}`}>{doc.type}</span>
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
