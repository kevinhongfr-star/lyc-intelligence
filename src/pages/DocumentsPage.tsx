import React, { useState, useMemo } from 'react';
import {
  Upload, FileText, File, Eye, EyeOff, Search, Filter,
  Plus, X, Loader2, Trash2, ExternalLink, Calendar, User, Tag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useDocuments } from '@/hooks/useSupabaseData';
import { getSupabase } from '@/services/supabaseApi';
import type { Document } from '@/services/supabaseApi';

const DOC_TYPES = [
  { value: 'cv', label: 'CV / Resume', icon: FileText, color: '#3B82F6' },
  { value: 'jd', label: 'Job Description', icon: FileText, color: '#10B981' },
  { value: 'proposal', label: 'Proposal', icon: FileText, color: '#C108AB' },
  { value: 'report', label: 'Report', icon: FileText, color: '#6366F1' },
  { value: 'contract', label: 'Contract', icon: FileText, color: '#F59E0B' },
  { value: 'other', label: 'Other', icon: File, color: '#94A3B8' },
];

const VISIBILITY_OPTIONS = [
  { value: 'recruiter-only', label: 'Recruiter Only', icon: EyeOff },
  { value: 'internal', label: 'Internal', icon: Eye },
  { value: 'client', label: 'Client Visible', icon: Eye },
];

function getTypeConfig(type: string) {
  return DOC_TYPES.find(t => t.value === type) || DOC_TYPES[DOC_TYPES.length - 1];
}

export function DocumentsPage() {
  const { data: documents, loading, setData: setDocuments } = useDocuments();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', type: 'cv', visibility: 'recruiter-only', notes: '' });

  const filtered = useMemo(() => {
    let result = documents;
    if (typeFilter !== 'all') result = result.filter(d => d.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name?.toLowerCase().includes(q) ||
        d.type?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [documents, typeFilter, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Document[]> = {};
    for (const doc of filtered) {
      const key = doc.type || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  }, [filtered]);

  const handleUpload = async () => {
    if (!newDoc.name.trim()) return;
    setUploading(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('documents')
        .insert({
          name: newDoc.name.trim(),
          type: newDoc.type,
          visibility: newDoc.visibility,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (data && setDocuments) {
        setDocuments((prev: Document[]) => [data as Document, ...prev]);
      }
      setNewDoc({ name: '', type: 'cv', visibility: 'recruiter-only', notes: '' });
      setShowUpload(false);
    } catch (e: any) {
      console.error('[Documents] Upload failed:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const sb = getSupabase();
      const { error } = await sb.from('documents').delete().eq('id', id);
      if (!error && setDocuments) {
        setDocuments((prev: Document[]) => prev.filter((d: Document) => d.id !== id));
      }
    } catch (e) {
      console.error('[Documents] Delete failed:', e);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-bg-secondary rounded-xl border border-bg-tertiary w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-text-primary">Register Document</h3>
              <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-bg-tertiary rounded-lg"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <input
              value={newDoc.name}
              onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))}
              placeholder="Document name"
              className="w-full px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newDoc.type}
                onChange={e => setNewDoc(p => ({ ...p, type: e.target.value }))}
                className="px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select
                value={newDoc.visibility}
                onChange={e => setNewDoc(p => ({ ...p, visibility: e.target.value }))}
                className="px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {VISIBILITY_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <textarea
              value={newDoc.notes}
              onChange={e => setNewDoc(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full px-4 py-3 bg-bg-primary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
            />
            <Button onClick={handleUpload} disabled={uploading || !newDoc.name.trim()} className="w-full">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="ml-2">{uploading ? 'Saving...' : 'Register Document'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Documents</h1>
          <p className="text-text-secondary">CVs, proposals, reports, and client materials</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Register Document
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent min-h-[44px]"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap min-h-[36px] transition-colors ${
              typeFilter === 'all' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
            }`}
          >
            All ({documents.length})
          </button>
          {DOC_TYPES.map(t => {
            const count = documents.filter(d => d.type === t.value).length;
            if (count === 0) return null;
            return (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap min-h-[36px] transition-colors ${
                  typeFilter === t.value ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
            <p className="text-text-muted text-sm mb-3">
              {documents.length === 0 ? 'No documents registered yet.' : 'No documents match your filters.'}
            </p>
            {documents.length === 0 && (
              <button onClick={() => setShowUpload(true)} className="text-accent text-sm hover:underline">
                + Register your first document
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, docs]) => {
            const typeConfig = getTypeConfig(type);
            const TypeIcon = typeConfig.icon;
            return (
              <Card key={type}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <TypeIcon size={14} style={{ color: typeConfig.color }} />
                    <CardTitle className="text-sm">{typeConfig.label}</CardTitle>
                    <Badge>{docs.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-bg-tertiary/50 rounded-lg hover:bg-bg-tertiary transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${typeConfig.color}15` }}>
                        <FileText size={14} style={{ color: typeConfig.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <Calendar size={9} />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          {doc.visibility && (
                            <span className="text-[10px] text-text-muted flex items-center gap-1">
                              {doc.visibility === 'client' ? <Eye size={9} /> : <EyeOff size={9} />}
                              {doc.visibility}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.visibility === 'client' && (
                          <Badge variant="success">Client</Badge>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;
