import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, ChevronRight, Loader2, CheckCircle, PauseCircle, XCircle, Plus, Building2, Download, CheckSquare, Square, Trash2, ArrowUpDown, Filter } from 'lucide-react';
import { useMandates } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui';
import { STAGE_ORDER, STAGE_CONFIG } from '@/types/mandate';
import { updateMandateStatus, getSupabase } from '@/services/supabaseApi';
import Papa from 'papaparse';

const STATUS_OPTIONS = [
  { value: '1_search', label: 'SWEEP', color: '#00897B' },
  { value: '2_call', label: 'CANVA', color: '#F59E0B' },
  { value: '3_deliver', label: 'GRID/LENS', color: '#10B981' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
  { value: 'completed', label: 'Completed', color: '#333333' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: '#EF4444' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'low', label: 'Low', color: '#6B7280' },
];

export function MandatesPage() {
  const navigate = useNavigate();
  const { data: mandates, count, loading, error } = useMandates({ limit: 100 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [sortField, setSortField] = useState<string>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'priority' ? 'asc' : 'desc');
    }
  };

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedFiltered = [...filtered].sort((a: any, b: any) => {
    let av: any = a[sortField] ?? '';
    let bv: any = b[sortField] ?? '';
    if (sortField === 'priority') {
      av = PRIORITY_ORDER[av] ?? 99;
      bv = PRIORITY_ORDER[bv] ?? 99;
      const cmp = av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const filtered = useMemo(() => {
    let result = mandates;
    if (statusFilter) result = result.filter(m => m.status === statusFilter);
    if (priorityFilter) result = result.filter(m => m.priority === priorityFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => m.title?.toLowerCase().includes(q) || m.company?.name?.toLowerCase().includes(q));
    }
    return result;
  }, [mandates, statusFilter, priorityFilter, search]);

  const handleStatusChange = async (mandateId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdating(mandateId);
    await updateMandateStatus(mandateId, newStatus);
    setUpdating(null);
    window.location.reload();
  };

  // ─── Selection ───
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(m => m.id)));
  };

  // ─── CSV Export ───
  const exportCSV = () => {
    const data = (selectedIds.size > 0 ? filtered.filter(m => selectedIds.has(m.id)) : filtered).map(m => ({
      Title: m.title, Status: m.status, Priority: m.priority,
      Candidates: m.total_candidates, Tier1: m.tier1_count, Shortlisted: m.shortlisted_count,
      Interviews: m.interview_count, Placed: m.placed_count,
      PHI_Composite: m.phi_composite, PHI_Urgency: m.phi_urgency, Created: m.created_at,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `mandates_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ─── Bulk Operations ───
  const bulkStatusChange = async (newStatus: string) => {
    if (!confirm(`Update ${selectedIds.size} mandates to "${newStatus}"?`)) return;
    setSaving(true);
    for (const id of Array.from(selectedIds)) {
      await updateMandateStatus(id, newStatus);
    }
    setSelectedIds(new Set());
    setSaving(false);
    window.location.reload();
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} mandates? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      await sb.from('mandates').delete().in('id', Array.from(selectedIds));
      setSelectedIds(new Set());
      window.location.reload();
    } catch (e) { console.error('Bulk delete failed:', e); }
    setSaving(false);
  };

  const getStatusInfo = (status: string) => STATUS_OPTIONS.find(s => s.value === status) || { label: status, color: '#666' };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#171717]">Mandates</h1>
          <p className="text-sm text-[#737373] mt-1">{count ?? mandates.length} active positions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2.5 text-sm font-medium text-[#404040] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />{selectedIds.size > 0 ? `Export ${selectedIds.size}` : 'Export CSV'}
          </button>
          <button onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')} className="px-4 py-2.5 text-sm font-medium text-[#404040] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />{viewMode === 'cards' ? 'Table View' : 'Card View'}
          </button>
          <button onClick={() => navigate('/platform/mandates/new')} className="px-5 py-2.5 bg-[#C108AB] text-white text-sm font-medium hover:bg-[#A50798] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]">
            <Plus className="w-4 h-4" />Create Mandate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input placeholder="Search mandates..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E5E5] text-sm text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#E5E5E5] text-sm text-[#171717] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40 transition-all duration-200">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="bg-white border border-[#E5E5E5] text-sm text-[#171717] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40 transition-all duration-200">
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}
            className={`px-3 py-1.5 text-xs font-medium border transition-all ${statusFilter === s.value ? 'border-[#C108AB]/30 text-[#C108AB] bg-[#C108AB]/5' : 'bg-white border-[#E5E5E5] text-[#737373] hover:border-[#C108AB]/30'}`}>
            {s.label} {mandates.filter(m => m.status === s.value).length > 0 && `(${mandates.filter(m => m.status === s.value).length})`}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#C108AB]/5 border border-[#C108AB]/20">
          <span className="text-sm font-medium text-[#C108AB]">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <select onChange={e => { if (e.target.value) bulkStatusChange(e.target.value); e.target.value = ''; }}
            className="px-3 py-1.5 text-xs border border-[#E5E5E5] bg-white">
            <option value="">Change status to...</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />Export
          </button>
          <button onClick={bulkDelete} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-[#737373] hover:text-[#171717]">Clear</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" /><span className="ml-3 text-sm text-[#737373]">Loading mandates...</span></div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="border border-[#E5E5E5] bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                <th className="w-10 px-3 py-3">
                  <button onClick={toggleSelectAll} className="text-[#A3A3A3] hover:text-[#171717]">
                    {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-text-primary select-none" onClick={() => handleSort('title')}>Title {sortField === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-text-primary select-none" onClick={() => handleSort('status')}>Status {sortField === 'status' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-text-primary select-none" onClick={() => handleSort('priority')}>Priority {sortField === 'priority' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left px-4 py-3 font-medium text-[#737373]">Candidates</th>
                <th className="text-left px-4 py-3 font-medium text-[#737373]">Pipeline</th>
                <th className="text-left px-4 py-3 font-medium text-[#737373]">PHI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const statusInfo = getStatusInfo(m.status);
                return (
                  <tr key={m.id} className={`border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${selectedIds.has(m.id) ? 'bg-[#C108AB]/5' : ''}`}
                    onClick={() => navigate(`/app/mandates/${m.id}`)}>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(m.id)} className="text-[#A3A3A3] hover:text-[#171717]">
                        {selectedIds.has(m.id) ? <CheckSquare className="w-4 h-4 text-[#C108AB]" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#171717]">{m.title || 'Untitled'}</td>
                    <td className="px-4 py-3">
                      <select value={m.status} onClick={e => e.stopPropagation()} onChange={e => handleStatusChange(m.id, e.target.value, e as any)}
                        className="text-xs font-medium px-2 py-1 border-0 bg-transparent cursor-pointer" style={{ color: statusInfo.color }}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {m.priority && <span className="text-xs font-medium px-2 py-0.5" style={{ color: PRIORITY_OPTIONS.find(p => p.value === m.priority)?.color || '#666' }}>{m.priority}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#404040]">{m.total_candidates || 0}</td>
                    <td className="px-4 py-3 text-[#404040]">{m.shortlisted_count || 0} shortlisted</td>
                    <td className="px-4 py-3">{m.phi_composite != null ? <span className="font-medium tabular-nums">{m.phi_composite}</span> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const statusInfo = getStatusInfo(m.status);
            return (
              <div key={m.id} onClick={() => navigate(`/app/mandates/${m.id}`)}
                className="border border-[#E5E5E5] bg-white p-5 hover:shadow-md hover:border-[#C108AB]/20 transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-[#171717] group-hover:text-[#C108AB] transition-colors line-clamp-2">{m.title || 'Untitled Mandate'}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 flex-shrink-0 ml-2" style={{ backgroundColor: `${statusInfo.color}15`, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                {m.company?.name && <div className="flex items-center gap-1.5 text-sm text-[#737373] mb-3"><Building2 className="w-3.5 h-3.5" />{m.company.name}</div>}
                <div className="flex gap-4 text-xs text-[#737373]">
                  <span>{m.total_candidates || 0} candidates</span>
                  <span>{m.shortlisted_count || 0} shortlisted</span>
                  <span>{m.interview_count || 0} interviews</span>
                </div>
                {m.phi_composite != null && (
                  <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
                    <span className="text-xs text-[#737373]">PHI Score</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: m.phi_composite >= 70 ? '#1A7D42' : m.phi_composite >= 50 ? '#C108AB' : '#A3A3A3' }}>{m.phi_composite}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
