import { useAuthStore } from '@/stores/authStore';
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Loader2, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Linkedin, Globe, Briefcase, Award, Target, Upload, MapPin, Download, CheckSquare, Square, Edit3, X, Check, Trash2, MoreHorizontal } from 'lucide-react';
import { useContacts } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui';
import type { Contact } from '@/services/supabaseApi';
import { getSupabase } from '@/services/supabaseApi';
import { LinkedInImportModal } from '@/components/import/LinkedInImportModal';
import { SavedViewsManager } from '@/components/search/SavedViewsManager';
import { ColumnVisibility, useColumnVisibility, type ColumnDef } from '@/components/table/ColumnVisibility';
import Papa from 'papaparse';

const SENIORITY_OPTIONS = [
  { value: 'c_suite', label: 'C-Suite' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'senior_manager', label: 'Senior Manager' },
  { value: 'manager', label: 'Manager' },
];

const TIER_THRESHOLDS = { S: 85, A: 65, B: 45 };

function getTier(score: number | null, cxo: boolean | null): string {
  if (cxo || (score ?? 0) >= 85) return 'S';
  if ((score ?? 0) >= 65) return 'A';
  if ((score ?? 0) >= 45) return 'B';
  return 'C';
}

const TIER_STYLES: Record<string, { bg: string; text: string }> = {
  S: { bg: 'rgba(184,134,11,0.08)', text: '#B8860B' },
  A: { bg: 'rgba(26,125,66,0.08)', text: '#1A7D42' },
  B: { bg: 'rgba(44,82,130,0.08)', text: '#2C5282' },
  C: { bg: 'rgba(140,133,125,0.08)', text: '#A3A3A3' },
};

const TIER_BADGES: Record<string, string> = { S: 'Elite', A: 'Senior', B: 'Mid-Level', C: 'Emerging' };

type SortField = 'name' | 'score' | 'seniority' | 'country';
type EditableField = 'current_title' | 'location' | 'country' | 'seniority';

export function CandidatesPage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [seniorityFilter, setSeniorityFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showBulkBar, setShowBulkBar] = useState(false);

  const CANDIDATE_COLUMNS: ColumnDef[] = [
    { key: 'checkbox', label: 'Select', defaultVisible: true },
    { key: 'name', label: 'Name', defaultVisible: true },
    { key: 'title', label: 'Title', defaultVisible: true },
    { key: 'location', label: 'Location', defaultVisible: true },
    { key: 'score', label: 'Score', defaultVisible: true },
    { key: 'tier', label: 'Tier', defaultVisible: true },
    { key: 'seniority', label: 'Seniority', defaultVisible: true },
    { key: 'source', label: 'Source', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: false },
    { key: 'linkedin', label: 'LinkedIn', defaultVisible: false },
  ];
  const { visibleColumns: visCols, toggleColumn: toggleCol } = useColumnVisibility('lyc_candidates_columns', CANDIDATE_COLUMNS);
  const limit = 30;

  const { data: contacts, count, loading } = useContacts({
    userId: profile?.id || undefined,
    query: search || undefined,
    seniority: seniorityFilter.length ? seniorityFilter : undefined,
    country: countryFilter || undefined,
    limit: 200,
  });

  const filtered = useMemo(() => {
    let result = contacts;
    if (tierFilter) result = result.filter(c => getTier(c.trident_composite, !!c.cxo_stamp) === tierFilter);
    if (countryFilter) result = result.filter(c => c.country === countryFilter);
    result = result.filter(c => {
      const score = c.trident_composite ?? 0;
      return score >= scoreRange[0] && score <= scoreRange[1];
    });
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortField === 'score') cmp = (a.trident_composite ?? 0) - (b.trident_composite ?? 0);
      else if (sortField === 'seniority') {
        const order = ['c_suite', 'leadership', 'vp', 'director', 'senior_manager', 'manager'];
        cmp = order.indexOf(a.seniority || '') - order.indexOf(b.seniority || '');
      } else if (sortField === 'country') cmp = (a.country || '').localeCompare(b.country || '');
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [contacts, tierFilter, countryFilter, scoreRange, sortField, sortAsc]);

  const paged = filtered.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(filtered.length / limit);

  // Countries for filter
  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const c of contacts) if (c.country) set.add(c.country);
    return Array.from(set).sort();
  }, [contacts]);

  // ─── Selection ───
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map(c => c.id)));
  };

  // ─── Inline Editing ───
  const startEdit = (id: string, field: EditableField, currentValue: string | null) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
  };
  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };
  const saveEdit = async () => {
    if (!editingCell) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      await sb.from('contacts').update({ [editingCell.field]: editValue || null }).eq('id', editingCell.id);
      // Update local state
      const idx = contacts.findIndex(c => c.id === editingCell.id);
      if (idx >= 0) contacts[idx] = { ...contacts[idx], [editingCell.field]: editValue || null } as Contact;
    } catch (e) { console.error('Inline edit failed:', e); }
    setSaving(false);
    setEditingCell(null);
  };

  // ─── Bulk Operations ───
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} contacts? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      await sb.from('contacts').delete().in('id', Array.from(selectedIds));
      setSelectedIds(new Set());
      window.location.reload();
    } catch (e) { console.error('Bulk delete failed:', e); }
    setSaving(false);
  };

  // ─── CSV Export ───
  const exportCSV = () => {
    const data = (selectedIds.size > 0 ? filtered.filter(c => selectedIds.has(c.id)) : filtered).map(c => ({
      Name: c.name, Title: c.current_title, Company: c.company?.name || '', Location: c.location,
      Country: c.country, Seniority: c.seniority, Score: c.trident_composite, Tier: getTier(c.trident_composite, !!c.cxo_stamp),
      Email: c.email, LinkedIn: c.linkedin_url, Source: c.source,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `candidates_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#171717]">Candidates</h1>
          <p className="text-sm text-[#737373] mt-1">{count.toLocaleString()} contacts in database</p>
        </div>
        <div className="flex gap-2">
          <ColumnVisibility columns={CANDIDATE_COLUMNS} visibleColumns={visCols} onToggle={toggleCol} storageKey="lyc_candidates_columns" />
          <button onClick={exportCSV} className="px-4 py-2.5 text-sm font-medium text-[#404040] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />{selectedIds.size > 0 ? `Export ${selectedIds.size}` : 'Export CSV'}
          </button>
          <button onClick={() => setShowImportModal(true)} className="px-4 py-2.5 text-sm font-medium text-[#404040] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" />Import
          </button>
          <button onClick={() => navigate('/app/candidates/new')} className="px-5 py-2.5 bg-[#C108AB] text-white text-sm font-medium hover:bg-[#A50798] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]">
            <Users className="w-4 h-4" />Add Candidate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input placeholder="Search name, title, company, skills..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E5E5E5] text-sm text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200" />
        </div>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
          className="bg-white border border-[#E5E5E5] text-sm text-[#171717] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40 transition-all">
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
          className="bg-white border border-[#E5E5E5] text-sm text-[#171717] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40 transition-all">
          <option value="">All Tiers</option>
          <option value="S">S — Elite</option>
          <option value="A">A — Senior</option>
          <option value="B">B — Mid-Level</option>
          <option value="C">C — Emerging</option>
        </select>
        <div className="flex items-center gap-2 text-xs text-[#737373]">
          <span>Score:</span>
          <input type="number" min={0} max={100} value={scoreRange[0]} onChange={e => setScoreRange([+e.target.value, scoreRange[1]])}
            className="w-14 px-2 py-1.5 border border-[#E5E5E5] text-sm text-center" />
          <span>—</span>
          <input type="number" min={0} max={100} value={scoreRange[1]} onChange={e => setScoreRange([scoreRange[0], +e.target.value])}
            className="w-14 px-2 py-1.5 border border-[#E5E5E5] text-sm text-center" />
        </div>
      </div>

      {/* Saved Views */}
      <div className="flex items-center gap-2">
        <SavedViewsManager
          currentFilters={{ search, seniority: seniorityFilter, country: countryFilter, tier: tierFilter, scoreRange }}
          currentSort={{ field: sortField, direction: sortAsc ? 'asc' : 'desc' }}
          onLoadView={(filters, sort) => {
            if (filters.search !== undefined) setSearch(filters.search);
            if (filters.seniority) setSeniorityFilter(filters.seniority);
            if (filters.country !== undefined) setCountryFilter(filters.country);
            if (filters.tier !== undefined) setTierFilter(filters.tier);
            if (filters.scoreRange) setScoreRange(filters.scoreRange);
          }}
          storageKey="lyc_candidates_views"
        />
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'C-Suite Only', action: () => setSeniorityFilter(['c_suite', 'leadership']), active: seniorityFilter.includes('c_suite') },
          { label: 'VP+', action: () => setSeniorityFilter(['vp']), active: seniorityFilter.includes('vp') },
          { label: 'Score 80+', action: () => setScoreRange([80, 100]), active: scoreRange[0] === 80 },
          { label: 'APAC', action: () => { setCountryFilter('China'); }, active: countryFilter === 'China' },
          { label: 'Clear Filters', action: () => { setSearch(''); setSeniorityFilter([]); setCountryFilter(''); setTierFilter(''); setScoreRange([0,100]); }, active: false },
        ].map(chip => (
          <button key={chip.label} onClick={chip.action}
            className={`px-3 py-1.5 text-xs font-medium border transition-all ${chip.active ? 'bg-[#C108AB]/10 border-[#C108AB]/30 text-[#C108AB]' : 'bg-white border-[#E5E5E5] text-[#737373] hover:border-[#C108AB]/30 hover:text-[#C108AB]'}`}>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#C108AB]/5 border border-[#C108AB]/20">
          <span className="text-sm font-medium text-[#C108AB]">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />Export Selected
          </button>
          <button onClick={bulkDelete} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-xs font-medium text-[#737373] hover:text-[#171717]">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-[#E5E5E5] bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
              {visCols.has('checkbox') && <th className="w-10 px-3 py-3">
                <button onClick={toggleSelectAll} className="text-[#A3A3A3] hover:text-[#171717]">
                  {selectedIds.size === paged.length && paged.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>}
              {visCols.has('name') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('name')}>
                <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
              </th>}
              {visCols.has('title') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Title</th>}
              {visCols.has('location') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('country')}>
                <span className="flex items-center gap-1">Location <ArrowUpDown className="w-3 h-3" /></span>
              </th>}
              {visCols.has('score') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('score')}>
                <span className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></span>
              </th>}
              {visCols.has('tier') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Tier</th>}
              {visCols.has('seniority') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Seniority</th>}
              {visCols.has('source') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Source</th>}
              {visCols.has('email') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Email</th>}
              {visCols.has('linkedin') && <th className="text-left px-4 py-3 font-medium text-[#737373]">LinkedIn</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visCols.size} className="px-4 py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#C108AB] mx-auto mb-3" /><span className="text-sm text-[#737373]">Loading candidates...</span></td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={visCols.size} className="px-4 py-16 text-center text-sm text-[#737373]">No candidates match your filters</td></tr>
            ) : paged.map((c) => {
              const tier = getTier(c.trident_composite, !!c.cxo_stamp);
              const tierStyle = TIER_STYLES[tier];
              return (
                <tr key={c.id} className={`border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${selectedIds.has(c.id) ? 'bg-[#C108AB]/5' : ''}`}
                  onClick={() => navigate(`/app/candidates/${c.id}`)}>
                  {visCols.has('checkbox') && <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(c.id)} className="text-[#A3A3A3] hover:text-[#171717]">
                      {selectedIds.has(c.id) ? <CheckSquare className="w-4 h-4 text-[#C108AB]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>}
                  {visCols.has('name') && <td className="px-4 py-3">
                    <div className="font-medium text-[#171717]">{c.name || '—'}</div>
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" className="text-[#0A66C2] hover:underline" onClick={e => e.stopPropagation()}><Linkedin className="w-3 h-3 inline" /></a>}
                  </td>}
                  {visCols.has('title') && <td className="px-4 py-3">
                    {editingCell?.id === c.id && editingCell.field === 'current_title' ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="px-2 py-1 text-sm border border-[#C108AB] focus:outline-none w-full" onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                        <button onClick={saveEdit} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="text-[#A3A3A3] hover:text-[#171717]"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-[#404040] cursor-text" onDoubleClick={e => { e.stopPropagation(); startEdit(c.id, 'current_title', c.current_title); }}>
                        {c.current_title || <span className="text-[#A3A3A3]">—</span>}
                        <Edit3 className="w-3 h-3 inline ml-1 text-[#D4D4D4] opacity-0 group-hover:opacity-100" />
                      </span>
                    )}
                  </td>}
                  {visCols.has('location') && <td className="px-4 py-3">
                    {editingCell?.id === c.id && editingCell.field === 'location' ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="px-2 py-1 text-sm border border-[#C108AB] focus:outline-none w-full" onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                        <button onClick={saveEdit} className="text-green-600"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="text-[#A3A3A3]"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-[#404040] cursor-text flex items-center gap-1" onDoubleClick={e => { e.stopPropagation(); startEdit(c.id, 'location', c.location); }}>
                        <MapPin className="w-3 h-3 text-[#A3A3A3]" />{c.location || <span className="text-[#A3A3A3]">—</span>}
                      </span>
                    )}
                  </td>}
                  {visCols.has('score') && <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#E5E5E5] overflow-hidden">
                        <div className="h-full" style={{ width: `${c.trident_composite ?? 0}%`, backgroundColor: (c.trident_composite ?? 0) >= 80 ? '#1A7D42' : (c.trident_composite ?? 0) >= 60 ? '#C108AB' : '#A3A3A3' }} />
                      </div>
                      <span className="text-[#404040] font-medium tabular-nums">{c.trident_composite ?? '—'}</span>
                    </div>
                  </td>}
                  {visCols.has('tier') && <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: tierStyle.bg, color: tierStyle.text }}>
                      {tier} · {TIER_BADGES[tier]}
                    </span>
                  </td>}
                  {visCols.has('seniority') && <td className="px-4 py-3 text-[#404040]">{c.seniority?.replace('_', ' ') || '—'}</td>}
                  {visCols.has('source') && <td className="px-4 py-3 text-[#737373] text-xs">{c.source || '—'}</td>}
                  {visCols.has('email') && <td className="px-4 py-3 text-[#737373] text-xs">{c.email || '—'}</td>}
                  {visCols.has('linkedin') && <td className="px-4 py-3 text-[#737373] text-xs">{c.linkedin_url ? <a href={c.linkedin_url} target="_blank" className="text-[#0A66C2] hover:underline" onClick={e => e.stopPropagation()}>View</a> : '—'}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#737373]">Page {page + 1} of {totalPages} ({filtered.length} results)</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-2 border border-[#E5E5E5] disabled:opacity-30 hover:bg-[#F5F5F5]"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-2 border border-[#E5E5E5] disabled:opacity-30 hover:bg-[#F5F5F5]"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {showImportModal && <LinkedInImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
}
