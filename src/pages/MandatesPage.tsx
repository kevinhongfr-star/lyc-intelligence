import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, CheckCircle, PauseCircle, XCircle, Plus } from 'lucide-react';
import { useMandates } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/ui';
import { PIPELINE_STAGE_ORDER, STAGE_CONFIG, PIPELINE_PHASES, getStagesByPhase } from '@/types/pipelineStages';
import { updateMandateStatus } from '@/services/supabaseApi';

// Map old stage values to new 19-stage pipeline
const OLD_TO_NEW_STAGE: Record<string, string> = {
  'SWEEP': 'approach',
  'CANVA': 'screened',
  'GRID': 'client_submitted',
  'LENS': 'interview_1',
  'PLACED': 'offer_accepted',
  'Candidate Report': 'assessment',
};

const STATUS_OPTIONS = [
  { value: '1_search', label: 'SWEEP', color: '#00897B' },
  { value: '2_call', label: 'CANVA', color: '#F59E0B' },
  { value: '3_deliver', label: 'GRID/LENS', color: '#10B981' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { value: 'lost', label: 'Lost', color: '#EF4848' },
  { value: 'completed', label: 'Completed', color: '#333333' },
];

// Phase colors for the summary bar
const PHASE_COLORS: Record<string, string> = {
  'Sourcing': '#6366F1',
  'Client': '#EC4899',
  'Interview': '#F59E0B',
  'Evaluation': '#10B981',
  'Offer': '#14B8A6',
  'Post-Placement': '#06B6D4',
  'Terminal': '#6B7280',
};

export function MandatesPage() {
  const navigate = useNavigate();
  const { data: mandates, count, loading } = useMandates({ limit: 100 });
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

  const totalPipeline = (m: any) =>
    (m.tier1_count || 0) + (m.tier2_count || 0) + (m.shortlisted_count || 0) + (m.interview_count || 0) + (m.placed_count || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Mandates</h1>
          <p className="text-text-muted">{count ?? mandates.length} mandates</p>
        </div>
        <button
          onClick={() => navigate('/platform/mandates/new')}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Mandate
        </button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input placeholder="Search mandates..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary px-3 py-2 min-h-[44px]">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {loading ? <div className="text-text-muted text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} onClick={() => navigate(`/platform/mandates/${m.id}`)}
              className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4 cursor-pointer hover:border-accent/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-text-primary">{m.title}</h3>
                  <p className="text-sm text-text-muted">{m.company?.name ?? 'No client'}</p>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <select value={m.status} onChange={async e => { setUpdating(m.id); await updateMandateStatus(m.id, e.target.value); setUpdating(null); window.location.reload(); }}
                    className="text-xs bg-bg-tertiary text-text-primary rounded px-2 py-1 border-0 min-h-[32px]">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {updating === m.id && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
                </div>
              </div>
              {/* Phase summary bar */}
              <div className="flex gap-1">
                {Object.entries(PHASE_COLORS).map(([phase, color]) => {
                  const stagesInPhase = getStagesByPhase(phase as any).map(s => s.id);
                  // Map old mandate counts to phases
                  let phaseCount = 0;
                  if (phase === 'Sourcing') phaseCount = m.tier1_count || 0;
                  else if (phase === 'Client') phaseCount = m.tier2_count || 0;
                  else if (phase === 'Interview') phaseCount = (m.shortlisted_count || 0) + (m.interview_count || 0);
                  else if (phase === 'Post-Placement') phaseCount = m.placed_count || 0;
                  return (
                    <div key={phase} className="flex-1 h-7 rounded flex items-center justify-center text-[10px] font-medium"
                      style={{ backgroundColor: `${color}15`, color }}>
                      {phase}: {phaseCount}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-text-muted">{totalPipeline(m)} candidates in pipeline</span>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={e => handleStatusChange(m.id, 'won', e)} className="text-xs px-2 py-1 bg-tier-1/20 text-tier-1 rounded hover:bg-tier-1/30 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Won</button>
                  <button onClick={e => handleStatusChange(m.id, 'on_hold', e)} className="text-xs px-2 py-1 bg-tier-2/20 text-tier-2 rounded hover:bg-tier-2/30 flex items-center gap-1"><PauseCircle className="w-3 h-3" />Hold</button>
                  <button onClick={e => handleStatusChange(m.id, 'lost', e)} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center gap-1"><XCircle className="w-3 h-3" />Lost</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
