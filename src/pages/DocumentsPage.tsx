import React, { useState, useMemo } from 'react';
import { FileText, Download, Search, Filter, Loader2, File, FileCheck, FilePlus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useDocuments } from '@/hooks/useSupabaseData';
import type { Document } from '@/services/supabaseApi';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  cv: <File className="w-4 h-4" />,
  report: <FileCheck className="w-4 h-4" />,
  contract: <FileText className="w-4 h-4" />,
  other: <File className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  cv: '#6366F1',
  report: '#10B981',
  contract: '#F59E0B',
  other: '#9CA3AF',
};

const VISIBILITY_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  internal: { label: 'Internal', variant: 'default' },
  client: { label: 'Client', variant: 'success' },
  confidential: { label: 'Confidential', variant: 'danger' },
};

export function DocumentsPage() {
  const { data: documents, loading } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');

  const docTypes = useMemo(() => {
    const types = new Set(documents.map(d => d.type).filter(Boolean));
    return ['all', ...Array.from(types)];
  }, [documents]);

  const filtered = useMemo(() => {
    let result = documents;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.name?.toLowerCase().includes(q) || d.type?.toLowerCase().includes(q));
    }
    if (filterType !== 'all') result = result.filter(d => d.type === filterType);
    if (filterVisibility !== 'all') result = result.filter(d => d.visibility === filterVisibility);
    result.sort((a, b) => {
      if (sortBy === 'name') return (a.name ?? '').localeCompare(b.name ?? '');
      if (sortBy === 'type') return (a.type ?? '').localeCompare(b.type ?? '');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [documents, searchQuery, filterType, filterVisibility, sortBy]);

  const stats = useMemo(() => ({
    total: documents.length,
    byType: documents.reduce((acc, d) => { acc[d.type ?? 'other'] = (acc[d.type ?? 'other'] || 0) + 1; return acc; }, {} as Record<string, number>),
    clientVisible: documents.filter(d => d.visibility === 'client').length,
    confidential: documents.filter(d => d.visibility === 'confidential').length,
  }), [documents]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Documents</h1>
          <p className="text-text-secondary">CVs, reports, and deliverables</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Total Documents</p>
          <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">CVs</p>
          <p className="text-2xl font-bold text-indigo-400">{stats.byType['cv'] ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Client-Visible</p>
          <p className="text-2xl font-bold text-green-400">{stats.clientVisible}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-text-muted mb-1">Confidential</p>
          <p className="text-2xl font-bold text-red-400">{stats.confidential}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Search documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {docTypes.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${filterType === t ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <select value={filterVisibility} onChange={e => setFilterVisibility(e.target.value)} className="px-3 py-2 text-sm rounded-lg bg-bg-tertiary text-text-primary border-none min-h-[44px]">
          <option value="all">All Visibility</option>
          <option value="internal">Internal</option>
          <option value="client">Client</option>
          <option value="confidential">Confidential</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 text-sm rounded-lg bg-bg-tertiary text-text-primary border-none min-h-[44px]">
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-text-muted">
          {documents.length === 0 ? 'No documents yet. Upload CVs and generate reports from the pipeline.' : 'No documents match your filters.'}
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const vis = VISIBILITY_LABELS[doc.visibility] ?? { label: doc.visibility, variant: 'default' as const };
            return (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${TYPE_COLORS[doc.type] ?? '#9CA3AF'}20` }}>
                      <span style={{ color: TYPE_COLORS[doc.type] ?? '#9CA3AF' }}>{TYPE_ICONS[doc.type] ?? <File className="w-4 h-4" />}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{doc.name || 'Untitled'}</p>
                      <p className="text-xs text-text-muted">{doc.type?.toUpperCase() ?? 'UNKNOWN'} · {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={vis.variant}>{vis.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
