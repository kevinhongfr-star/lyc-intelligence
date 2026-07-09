/**
 * ClientDocumentsPage — B2B Client Portal documents & billing
 * Renders inside AppShell → Outlet.
 */
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, RefreshCw, Search, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getDocuments, type Document } from '@/services/supabaseApi';

interface ClientDocument {
  id: string;
  title: string;
  type: 'Report' | 'Invoice' | 'Contract' | 'Proposal';
  date: string;
  size: string;
  mandateId?: string;
}

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
  const [error, setError] = useState<string | null>(null);
  const { clientAccount, profile, isLoading: authLoading } = useTenantContext();

  useEffect(() => {
    if (authLoading) {
      setLoading(false);
      return;
    }

    const loadDocs = async () => {
      try {
        const result = await getDocuments();
        const mapped: ClientDocument[] = result.map((d: Document) => {
          let docType: 'Report' | 'Invoice' | 'Contract' | 'Proposal' = 'Report';
          const typeLower = d.type.toLowerCase();
          if (typeLower.includes('invoice')) docType = 'Invoice';
          else if (typeLower.includes('contract') || typeLower.includes('agreement')) docType = 'Contract';
          else if (typeLower.includes('proposal')) docType = 'Proposal';
          else if (typeLower.includes('report')) docType = 'Report';
          return {
            id: d.id,
            title: d.name,
            type: docType,
            date: d.created_at ? new Date(d.created_at).toLocaleDateString() : '',
            size: '—',
            mandateId: d.mandate_id ?? undefined,
          };
        });
        setDocs(mapped);
      } catch (e) {
        console.error('[ClientDocumentsPage] Error:', e);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, [authLoading]);

  const filteredDocs = docs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="font-serif font-bold text-2xl text-text-primary">Documents & Billing</h1>
              <p className="text-text-secondary text-sm mt-1">Reports, invoices, contracts, and proposals.</p>
            </div>
            <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
                <User className="w-4 h-4 text-fuchsia" />
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">{displayName}</div>
                <div className="text-xs text-text-muted">{organization}</div>
              </div>
            </div>
          </div>
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
      ) : error ? (
        <div className="py-12 text-center text-text-muted text-sm">{error}</div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          title="No documents found"
          description="Adjust your search or type filter to see more results."
        />
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
