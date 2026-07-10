import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Globe, Loader2, Users, ExternalLink, Download, CheckSquare, Square, Edit3, X, Check, Trash2, ArrowUpDown, Columns3 } from 'lucide-react';
import { useCompanies } from '@/hooks/useSupabaseData';
import { getSupabase } from '@/services/supabaseApi';
import Papa from 'papaparse';
import { Card, CardContent, Badge } from '@/components/ui';
import { ColumnVisibility, useColumnVisibility, type ColumnDef } from '@/components/table/ColumnVisibility';

const INDUSTRY_OPTIONS = [
  'Mining & Metals', 'Energy', 'Technology', 'Financial Services',
  'Healthcare', 'Consumer Goods', 'Industrial', 'Real Estate',
  'Telecommunications', 'Transportation', 'Media', 'Agriculture'
];

const STAIN_COLORS: Record<string, string> = {
  'A': 'text-green-500 bg-green-500/10',
  'B': 'text-blue-500 bg-blue-500/10',
  'C': 'text-yellow-500 bg-yellow-500/10',
  'D': 'text-red-500 bg-red-500/10',
};

type SortField = 'name' | 'industry' | 'country' | 'total_contacts' | 'active_mandates' | 'engagement_score';
type EditField = 'industry' | 'country' | 'headcount_range';

export function CompaniesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: EditField } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 30;

  const { data: companies, count, loading } = useCompanies({
    query: search || undefined,
    industry: industry || undefined,
    country: country || undefined,
    limit: 200,
  });

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) if (c.country) set.add(c.country);
    return Array.from(set).sort();
  }, [companies]);

  // Sort
  const sorted = useMemo(() => {
    return [...companies].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortField === 'industry') cmp = (a.industry || '').localeCompare(b.industry || '');
      else if (sortField === 'country') cmp = (a.country || '').localeCompare(b.country || '');
      else if (sortField === 'total_contacts') cmp = (a.total_contacts || 0) - (b.total_contacts || 0);
      else if (sortField === 'active_mandates') cmp = (a.active_mandates || 0) - (b.active_mandates || 0);
      else if (sortField === 'engagement_score') cmp = (a.engagement_score || 0) - (b.engagement_score || 0);
      return sortAsc ? cmp : -cmp;
    });
  }, [companies, sortField, sortAsc]);

  const paged = sorted.slice(page * limit, (page + 1) * limit);
  const totalPages = Math.ceil(sorted.length / limit);

  // Column visibility
  const COMPANY_COLUMNS: ColumnDef[] = [
    { key: 'checkbox', label: 'Select', defaultVisible: true },
    { key: 'name', label: 'Company', defaultVisible: true },
    { key: 'industry', label: 'Industry', defaultVisible: true },
    { key: 'country', label: 'Country', defaultVisible: true },
    { key: 'contacts', label: 'Contacts', defaultVisible: true },
    { key: 'mandates', label: 'Mandates', defaultVisible: true },
    { key: 'engagement', label: 'Engagement', defaultVisible: true },
    { key: 'stain', label: 'Stain Tier', defaultVisible: true },
    { key: 'headcount', label: 'Headcount', defaultVisible: false },
    { key: 'website', label: 'Website', defaultVisible: false },
    { key: 'linkedin', label: 'LinkedIn', defaultVisible: false },
  ];
  const { visibleColumns: visCols, toggleColumn: toggleCol } = useColumnVisibility('lyc_companies_columns', COMPANY_COLUMNS);

  // Selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map(c => c.id)));
  };

  // Inline editing
  const startEdit = (id: string, field: EditField, value: string | null) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };
  const cancelEdit = () => { setEditingCell(null); setEditValue(''); };
  const saveEdit = async () => {
    if (!editingCell) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      await sb.from('companies').update({ [editingCell.field]: editValue || null }).eq('id', editingCell.id);
      const idx = companies.findIndex(c => c.id === editingCell.id);
      if (idx >= 0) (companies as any)[idx] = { ...companies[idx], [editingCell.field]: editValue || null };
    } catch (e) { console.error('Inline edit failed:', e); }
    setSaving(false);
    setEditingCell(null);
  };

  // Bulk operations
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} companies? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const sb = getSupabase();
      await sb.from('companies').delete().in('id', Array.from(selectedIds));
      setSelectedIds(new Set());
      window.location.reload();
    } catch (e) { console.error('Bulk delete failed:', e); }
    setSaving(false);
  };

  // CSV export
  const exportCSV = () => {
    const data = (selectedIds.size > 0 ? sorted.filter(c => selectedIds.has(c.id)) : sorted).map(c => ({
      Name: c.name, Industry: c.industry, Country: c.country,
      Headcount: c.headcount_range, Contacts: c.total_contacts,
      Mandates: c.active_mandates, Engagement: c.engagement_score,
      Stain: c.stain_tier, Website: c.website, LinkedIn: c.linkedin_url,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `companies_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#171717]">Target Companies</h1>
          <p className="text-sm text-[#737373] mt-1">{count.toLocaleString()} companies in database</p>
        </div>
        <div className="flex gap-2">
          <ColumnVisibility columns={COMPANY_COLUMNS} visibleColumns={visCols} onToggle={toggleCol} storageKey="lyc_companies_columns" />
          <button onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')} className="px-4 py-2.5 text-sm font-medium text-[#404040] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all flex items-center gap-2">
            {viewMode === 'table' ? 'Card View' : 'Table View'}
          </button>
          <button onClick={exportCSV} className="px-4 py-2.5 text-sm font-medium text-[#404040] bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />{selectedIds.size > 0 ? `Export ${selectedIds.size}` : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input placeholder="Search companies..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] text-sm text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB]/40 transition-all" />
        </div>
        <select value={industry} onChange={e => { setIndustry(e.target.value); setPage(0); }}
          className="bg-white border border-[#E5E5E5] text-sm text-[#171717] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40">
          <option value="">All Industries</option>
          {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={country} onChange={e => { setCountry(e.target.value); setPage(0); }}
          className="bg-white border border-[#E5E5E5] text-sm text-[#171717] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40">
          <option value="">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#C108AB]/5 border border-[#C108AB]/20">
          <span className="text-sm font-medium text-[#C108AB]">{selectedIds.size} selected</span>
          <div className="flex-1" />
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
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" /><span className="ml-3 text-sm text-[#737373]">Loading companies...</span></div>
      ) : viewMode === 'table' ? (
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
                  <span className="flex items-center gap-1">Company <ArrowUpDown className="w-3 h-3" /></span>
                </th>}
                {visCols.has('industry') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('industry')}>
                  <span className="flex items-center gap-1">Industry <ArrowUpDown className="w-3 h-3" /></span>
                </th>}
                {visCols.has('country') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('country')}>
                  <span className="flex items-center gap-1">Country <ArrowUpDown className="w-3 h-3" /></span>
                </th>}
                {visCols.has('contacts') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('total_contacts')}>
                  <span className="flex items-center gap-1">Contacts <ArrowUpDown className="w-3 h-3" /></span>
                </th>}
                {visCols.has('mandates') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('active_mandates')}>
                  <span className="flex items-center gap-1">Mandates <ArrowUpDown className="w-3 h-3" /></span>
                </th>}
                {visCols.has('engagement') && <th className="text-left px-4 py-3 font-medium text-[#737373] cursor-pointer hover:text-[#171717]" onClick={() => handleSort('engagement_score')}>
                  <span className="flex items-center gap-1">Engagement <ArrowUpDown className="w-3 h-3" /></span>
                </th>}
                {visCols.has('stain') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Stain</th>}
                {visCols.has('headcount') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Headcount</th>}
                {visCols.has('website') && <th className="text-left px-4 py-3 font-medium text-[#737373]">Website</th>}
                {visCols.has('linkedin') && <th className="text-left px-4 py-3 font-medium text-[#737373]">LinkedIn</th>}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={visCols.size} className="px-4 py-16 text-center text-sm text-[#737373]">No companies match your filters</td></tr>
              ) : paged.map(c => (
                <tr key={c.id} className={`border-b border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors cursor-pointer ${selectedIds.has(c.id) ? 'bg-[#C108AB]/5' : ''}`}>
                  {visCols.has('checkbox') && <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(c.id)} className="text-[#A3A3A3] hover:text-[#171717]">
                      {selectedIds.has(c.id) ? <CheckSquare className="w-4 h-4 text-[#C108AB]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>}
                  {visCols.has('name') && <td className="px-4 py-3 font-medium text-[#171717]">{c.name || '—'}</td>}
                  {visCols.has('industry') && <td className="px-4 py-3">
                    {editingCell?.id === c.id && editingCell.field === 'industry' ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <select value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="px-2 py-1 text-sm border border-[#C108AB] focus:outline-none">
                          <option value="">—</option>
                          {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <button onClick={saveEdit} className="text-green-600"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="text-[#A3A3A3]"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-[#404040] cursor-text" onDoubleClick={e => { e.stopPropagation(); startEdit(c.id, 'industry', c.industry); }}>
                        {c.industry || <span className="text-[#A3A3A3]">—</span>}
                      </span>
                    )}
                  </td>}
                  {visCols.has('country') && <td className="px-4 py-3">
                    {editingCell?.id === c.id && editingCell.field === 'country' ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus className="px-2 py-1 text-sm border border-[#C108AB] focus:outline-none"
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }} />
                        <button onClick={saveEdit} className="text-green-600"><Check className="w-4 h-4" /></button>
                        <button onClick={cancelEdit} className="text-[#A3A3A3]"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-[#404040] cursor-text flex items-center gap-1" onDoubleClick={e => { e.stopPropagation(); startEdit(c.id, 'country', c.country); }}>
                        <Globe className="w-3 h-3 text-[#A3A3A3]" />{c.country || <span className="text-[#A3A3A3]">—</span>}
                      </span>
                    )}
                  </td>}
                  {visCols.has('contacts') && <td className="px-4 py-3 text-[#404040]">{c.total_contacts || 0}</td>}
                  {visCols.has('mandates') && <td className="px-4 py-3 text-[#404040]">{c.active_mandates || 0}</td>}
                  {visCols.has('engagement') && <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#E5E5E5] overflow-hidden">
                        <div className="h-full" style={{ width: `${Math.min(c.engagement_score || 0, 100)}%`, backgroundColor: (c.engagement_score || 0) >= 70 ? '#1A7D42' : (c.engagement_score || 0) >= 40 ? '#C108AB' : '#A3A3A3' }} />
                      </div>
                      <span className="text-[#404040] tabular-nums">{c.engagement_score || 0}</span>
                    </div>
                  </td>}
                  {visCols.has('stain') && <td className="px-4 py-3">
                    {c.stain_tier && <span className={`text-xs font-bold px-1.5 py-0.5 ${STAIN_COLORS[c.stain_tier] || 'text-[#A3A3A3]'}`}>{c.stain_tier}</span>}
                  </td>}
                  {visCols.has('headcount') && <td className="px-4 py-3 text-[#404040]">{c.headcount_range || '—'}</td>}
                  {visCols.has('website') && <td className="px-4 py-3 text-xs">{c.website ? <a href={c.website} target="_blank" className="text-[#0A66C2] hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}><ExternalLink className="w-3 h-3" />Link</a> : '—'}</td>}
                  {visCols.has('linkedin') && <td className="px-4 py-3 text-xs">{c.linkedin_url ? <a href={c.linkedin_url} target="_blank" className="text-[#0A66C2] hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}><ExternalLink className="w-3 h-3" />Link</a> : '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map(c => (
            <div key={c.id} className="border border-[#E5E5E5] bg-white p-5 hover:shadow-md hover:border-[#C108AB]/20 transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C108AB]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#C108AB]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#171717]">{c.name}</h3>
                    <p className="text-xs text-[#737373] mt-0.5">{c.industry || 'Unknown industry'}</p>
                  </div>
                </div>
                {c.stain_tier && <span className={`text-[10px] font-bold px-1.5 py-0.5 ${STAIN_COLORS[c.stain_tier] || ''}`}>{c.stain_tier}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-[#FAFAFA]">
                  <p className="text-lg font-bold text-[#171717]">{c.total_contacts || 0}</p>
                  <p className="text-[10px] text-[#737373]">Contacts</p>
                </div>
                <div className="text-center p-2 bg-[#FAFAFA]">
                  <p className="text-lg font-bold text-[#171717]">{c.active_mandates || 0}</p>
                  <p className="text-[10px] text-[#737373]">Mandates</p>
                </div>
                <div className="text-center p-2 bg-[#FAFAFA]">
                  <p className="text-lg font-bold text-[#171717]">{c.engagement_score || 0}</p>
                  <p className="text-[10px] text-[#737373]">Engagement</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] text-[#737373]">
                {c.country && <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#FAFAFA]"><Globe className="w-3 h-3" />{c.country}</span>}
                {c.headcount_range && <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#FAFAFA]"><Users className="w-3 h-3" />{c.headcount_range}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#737373]">Page {page + 1} of {totalPages} ({sorted.length} results)</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm border border-[#E5E5E5] disabled:opacity-40 hover:bg-[#F5F5F5]">Previous</button>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm border border-[#E5E5E5] disabled:opacity-40 hover:bg-[#F5F5F5]">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
