import React, { useState, useMemo } from 'react';
import { AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { useMandates } from '@/hooks/useSupabaseData';
import { autoComputePHI, computePHI } from '@/services/phiScoring';
import type { PHIResult } from '@/services/phiScoring';
import type { Mandate } from '@/services/supabaseApi';
import { STAGE_LABEL, STAGE_COLOR, STAGE_BY_VALUE, PIPELINE_STAGES, ALL_STAGES, getNextStage } from '@/constants/pipelineStages';

const STATUS_LABELS: Record<string, string> = { '1_search': 'Screened', '2_call': 'Client Submitted', '3_deliver': 'Interview', 'won': 'Won', 'on_hold': 'On Hold', 'lost': 'Lost', 'completed': 'Completed' };
const FILTER_OPTIONS = [
  { key: 'all' as const, label: 'All' },
  { key: 'RED' as const, label: 'Red' },
  { key: 'AMBER' as const, label: 'Amber' },
  { key: 'GREEN' as const, label: 'Green' },
];

interface MandatePHI extends Mandate { phi: PHIResult; ageDays: number; }

function phiFromDB(m: Mandate): PHIResult {
  return computePHI({ urgency: m.phi_urgency ?? 1, strategic: m.phi_strategic ?? 1, value: m.phi_value ?? 1, retainer: m.phi_retainer ?? 1, decision: m.phi_decision ?? 1 });
}

export function CommandCenter() {
  const { data: mandates, loading } = useMandates({ limit: 200 });
  const [statusFilter, setStatusFilter] = useState<'all' | 'RED' | 'AMBER' | 'GREEN'>('all');
  const [sortBy, setSortBy] = useState<'phi' | 'age'>('phi');

  const enriched = useMemo(() => {
    return mandates.map(m => {
      const phi = m.phi_composite != null ? phiFromDB(m) : autoComputePHI(m);
      const ageDays = Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86400000);
      return { ...m, phi, ageDays } as MandatePHI;
    }).sort((a, b) => sortBy === 'phi' ? b.phi.composite - a.phi.composite : b.ageDays - a.ageDays);
  }, [mandates, sortBy]);

  const filtered = statusFilter === 'all' ? enriched : enriched.filter(m => m.phi.status === statusFilter);
  const redCount = enriched.filter(m => m.phi.status === 'RED').length;
  const amberCount = enriched.filter(m => m.phi.status === 'AMBER').length;
  const greenCount = enriched.filter(m => m.phi.status === 'GREEN').length;
  const counts: Record<string, number> = { RED: redCount, AMBER: amberCount, GREEN: greenCount };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {FILTER_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setStatusFilter(opt.key)} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${statusFilter === opt.key ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>
              {opt.label} {opt.key !== 'all' ? (counts[opt.key] ?? 0) : enriched.length}
            </button>
          ))}
        </div>
        <button onClick={() => setSortBy(sortBy === 'phi' ? 'age' : 'phi')} className="flex items-center gap-1 px-3 py-2 text-sm text-text-muted hover:text-text-primary bg-bg-tertiary rounded-lg min-h-[44px]"><ArrowUpDown className="w-3 h-3" />Sort: {sortBy === 'phi' ? 'PHI Score' : 'Age'}</button>
      </div>

      {loading ? <div className="text-text-muted text-center py-12">Loading mandates...</div> : filtered.length === 0 ? <div className="text-text-muted text-center py-12">No mandates found</div> : (
        <div className="space-y-2">
          {filtered.map(m => (
            <div key={m.id} className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text-primary truncate">{m.title}</h3>
                  <p className="text-xs text-text-muted">{m.company?.name ?? 'No client'} · {STATUS_LABELS[m.status] ?? m.status} · {m.ageDays}d old</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`text-lg font-bold ${m.phi.status === 'RED' ? 'text-red-400' : m.phi.status === 'AMBER' ? 'text-amber-400' : 'text-green-400'}`}>{m.phi.composite.toFixed(2)}</span>
                  <Badge variant={m.phi.status === 'RED' ? 'danger' : m.phi.status === 'AMBER' ? 'warning' : 'success'}>{m.phi.status}</Badge>
                  {m.phi.slaBehind && <AlertTriangle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              <div className="flex gap-4 text-xs text-text-muted">
                {Object.entries(m.phi.dimensions).map(([k, v]) => (
                  <span key={k} className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${v === 3 ? 'bg-red-400' : v === 2 ? 'bg-amber-400' : 'bg-green-400'}`} />
                    {k.slice(0, 3).toUpperCase()}: {v}
                  </span>
                ))}
                <span>Priority: {m.phi.actionPriority}</span>
              </div>
              <div className="flex gap-1 mt-2">
                {PIPELINE_STAGES.map(s => { const c = s === 'screened' ? m.tier1_count : s === 'client_submitted' ? m.tier2_count : s === 'client_approved' ? m.shortlisted_count : s === 'interview_1' ? m.interview_count : m.placed_count; return <div key={s} className="flex-1 h-6 rounded flex items-center justify-center text-[10px] font-medium" style={{ backgroundColor: `${STAGE_COLOR[s].color}20`, color: STAGE_CONFIG[s] }}>{c}</div>; })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
