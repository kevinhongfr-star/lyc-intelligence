import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, ChevronRight, Loader2, CheckCircle, PauseCircle, XCircle, Plus, Building2 } from 'lucide-react';
import { useMandates } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui';
import { STAGE_ORDER, STAGE_CONFIG } from '@/types/mandate';
import { updateMandateStatus } from '@/services/supabaseApi';

const STATUS_OPTIONS = [
  { value: '1_search', label: 'SWEEP', color: '#00897B' },
  { value: '2_call', label: 'CANVA', color: '#F59E0B' },
  { value: '3_deliver', label: 'GRID/LENS', color: '#10B981' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
  { value: 'completed', label: 'Completed', color: '#333333' },
];

export function MandatesPage() {
  const navigate = useNavigate();
  const { data: mandates, count, loading, error } = useMandates({ limit: 100 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = mandates
    .filter(m => !statusFilter || m.status === statusFilter)
    .filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.company?.name?.toLowerCase().includes(search.toLowerCase()));

  const handleStatusChange = async (mandateId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdating(mandateId);
    await updateMandateStatus(mandateId, newStatus);
    setUpdating(null);
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1714] tracking-tight">Mandates</h1>
          <p className="text-sm text-[#8C857D] mt-1">{count ?? mandates.length} active positions</p>
        </div>
        <button
          onClick={() => navigate('/platform/mandates/new')}
          className="px-5 py-2.5 bg-[#C108AB] text-white text-sm font-medium hover:bg-[#A50798] transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create Mandate
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8B0A6]" />
          <input
            placeholder="Search mandates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E8E5E0] text-sm text-[#1A1714] placeholder:text-[#B8B0A6] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-[#E8E5E0] text-sm text-[#1A1714] px-4 py-2.5 min-h-[44px] focus:outline-none focus:border-[#C108AB]/40 transition-all duration-200"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Mandate Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" />
          <span className="ml-3 text-sm text-[#8C857D]">Loading mandates...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(m => (
            <div
              key={m.id}
              onClick={() => navigate(`/platform/mandates/${m.id}`)}
              className="bg-white p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
              style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(26,23,20,0.08), 0 4px 8px rgba(26,23,20,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)'; }}
            >
              {/* Top row: Title + Company + Status */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif font-bold text-base text-[#1A1714]">{m.title}</h3>
                    <ChevronRight className="w-4 h-4 text-[#B8B0A6] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8C857D]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{m.company?.name ?? 'No client'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <select
                    value={m.status}
                    onChange={async e => { setUpdating(m.id); await updateMandateStatus(m.id, e.target.value); setUpdating(null); window.location.reload(); }}
                    className="text-xs bg-[#F5F3F0] text-[#1A1714] px-3 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/20 min-h-[32px]"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {updating === m.id && <Loader2 className="w-3 h-3 animate-spin text-[#C108AB]" />}
                </div>
              </div>

              {/* Pipeline stage bars */}
              <div className="flex gap-1 mb-4">
                {STAGE_ORDER.map(s => {
                  const c = s === 'SWEEP' ? m.tier1_count : s === 'CANVA' ? m.tier2_count : s === 'GRID' ? m.shortlisted_count : s === 'LENS' ? m.interview_count : m.placed_count;
                  return (
                    <div
                      key={s}
                      className="flex-1 h-8 flex items-center justify-center text-[10px] font-bold transition-all duration-200"
                      style={{
                        backgroundColor: `${STAGE_CONFIG[s].color}15`,
                        color: STAGE_CONFIG[s].color,
                      }}
                    >
                      {c}
                    </div>
                  );
                })}
              </div>

              {/* Stage legend */}
              <div className="flex gap-4 text-[10px] text-[#8C857D] mb-4">
                {STAGE_ORDER.map(s => (
                  <span key={s} className="flex items-center gap-1">
                    <span className="w-2 h-2" style={{ background: STAGE_CONFIG[s].color }} />
                    {s}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => handleStatusChange(m.id, 'won', e)}
                  className="text-xs px-3 py-1.5 font-medium flex items-center gap-1.5 transition-colors duration-150"
                  style={{ background: 'rgba(26,125,66,0.08)', color: '#1A7D42' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,125,66,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,125,66,0.08)'; }}
                >
                  <CheckCircle className="w-3 h-3" />Won
                </button>
                <button
                  onClick={(e) => handleStatusChange(m.id, 'on_hold', e)}
                  className="text-xs px-3 py-1.5 font-medium flex items-center gap-1.5 transition-colors duration-150"
                  style={{ background: 'rgba(184,134,11,0.08)', color: '#B8860B' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(184,134,11,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(184,134,11,0.08)'; }}
                >
                  <PauseCircle className="w-3 h-3" />Hold
                </button>
                <button
                  onClick={(e) => handleStatusChange(m.id, 'lost', e)}
                  className="text-xs px-3 py-1.5 font-medium flex items-center gap-1.5 transition-colors duration-150"
                  style={{ background: 'rgba(192,57,43,0.08)', color: '#C0392B' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.08)'; }}
                >
                  <XCircle className="w-3 h-3" />Lost
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
