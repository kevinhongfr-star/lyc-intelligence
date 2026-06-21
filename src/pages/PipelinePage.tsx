import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ChevronRight, Eye, FileDown, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useMandates } from '@/hooks/useSupabaseData';
import { getPipelineByMandate, updatePipelineStage } from '@/services/supabaseApi';
import { 
  STAGE_PHASES, 
  PIPELINE_STAGES, 
  STAGE_BY_VALUE, 
  STAGE_LABEL, 
  STAGE_COLOR,
  getNextStage,
  getStagesByPhase,
  type StagePhaseValue 
} from '@/constants/pipelineStages';
import type { CandidatePipeline, Mandate } from '@/services/supabaseApi';

const VERDICT_OPTIONS = ['Strong Fit', 'Conditional Fit', 'Weak Fit', 'Hold', 'Reject'];

export function PipelinePage() {
  const { data: mandates, loading } = useMandates({ limit: 50 });
  const [selectedMandate, setSelectedMandate] = useState<Mandate | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, CandidatePipeline[]>>({});
  const [loadingPipeline, setLoadingPipeline] = useState(false);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    if (mandates.length > 0 && !selectedMandate) {
      setSelectedMandate(mandates[0]);
    }
  }, [mandates]);

  useEffect(() => {
    if (!selectedMandate) return;
    setLoadingPipeline(true);
    getPipelineByMandate(selectedMandate.id).then(data => {
      setPipeline(data);
      setLoadingPipeline(false);
    });
  }, [selectedMandate?.id]);

  const handleStageChange = async (pipelineId: string, newStage: string) => {
    const ok = await updatePipelineStage(pipelineId, newStage);
    if (ok && selectedMandate) {
      const data = await getPipelineByMandate(selectedMandate.id);
      setPipeline(data);
    }
  };

  const totalCandidates = Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Pipeline</h1>
          <p className="text-text-muted">Drag candidates through the search stages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('kanban')} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${view === 'kanban' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Kanban</button>
          <button onClick={() => setView('list')} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${view === 'list' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>List</button>
        </div>
      </div>

      {/* Mandate selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {mandates.filter(m => ['1_search', '2_call', '3_deliver'].includes(m.status)).slice(0, 15).map(m => (
          <button key={m.id} onClick={() => setSelectedMandate(m)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm border transition-colors min-h-[44px] ${selectedMandate?.id === m.id ? 'border-accent bg-accent/10 text-accent' : 'border-bg-tertiary bg-bg-secondary text-text-secondary hover:border-accent/30'}`}>
            {m.title?.substring(0, 30)}{m.title?.length > 30 ? '...' : ''}
          </button>
        ))}
      </div>

      {selectedMandate && (
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-serif text-lg font-semibold text-text-primary">{selectedMandate.title}</h2>
          <Link to={`/platform/mandates/${selectedMandate.id}`}>
            <button className="flex items-center gap-1 text-sm text-accent hover:underline"><Eye className="w-3.5 h-3.5" />Detail</button>
          </Link>
          <Link to={`/platform/mandates/${selectedMandate.id}/lens`}>
            <button className="flex items-center gap-1 text-sm text-accent hover:underline"><FileDown className="w-3.5 h-3.5" />Candidate Report</button>
          </Link>
          <Link to="/platform/batch-scoring">
            <button className="flex items-center gap-1 text-sm text-accent hover:underline"><BarChart3 className="w-3.5 h-3.5" />Match Analysis</button>
          </Link>
          <span className="text-sm text-text-muted">{totalCandidates} candidates</span>
        </div>
      )}

      {loadingPipeline ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
      ) : view === 'kanban' ? (
        /* KANBAN VIEW — grouped by phase */
        <div className="space-y-6">
          {STAGE_PHASES.map(phase => {
            const phaseStages = getStagesByPhase(phase.value as StagePhaseValue);
            if (phaseStages.length === 0) return null;
            return (
              <div key={phase.value}>
                <h3 className="text-sm font-semibold mb-2 px-2" style={{ color: phase.color }}>{phase.label}</h3>
                <div className="grid gap-3 min-h-[300px]" style={{ gridTemplateColumns: `repeat(${phaseStages.length}, minmax(0, 1fr))` }}>
                  {phaseStages.map(stage => {
                    const candidates = pipeline[stage.value] || [];
                    const nextStage = getNextStage(stage.value);
                    return (
                      <div key={stage.value} className="rounded-lg border border-bg-tertiary flex flex-col" style={{ borderTopColor: stage.color, borderTopWidth: 3 }}>
                        <div className="px-3 py-2 border-b border-bg-tertiary flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                            <span className="text-sm font-medium text-text-primary">{stage.label}</span>
                          </div>
                          <Badge variant="default">{candidates.length}</Badge>
                        </div>
                        <div className="flex-1 p-2 space-y-2 overflow-auto">
                          {candidates.map(cp => (
                            <div key={cp.id} className="bg-bg-primary border border-bg-tertiary rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold flex-shrink-0">
                                  {cp.contact?.name?.[0] ?? '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-text-primary truncate">{cp.contact?.name ?? 'Unknown'}</p>
                                  <p className="text-[10px] text-text-muted truncate">{cp.contact?.current_title ?? ''}</p>
                                </div>
                              </div>
                              {cp.trident_composite != null && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-[10px] text-text-muted">Match:</span>
                                  <span className="text-[10px] font-bold" style={{ color: cp.trident_composite >= 75 ? '#10B981' : cp.trident_composite >= 50 ? '#F59E0B' : '#6B7280' }}>
                                    {cp.trident_composite}
                                  </span>
                                </div>
                              )}
                              {cp.verdict && <p className="text-[10px] text-text-muted mt-0.5 truncate">{cp.verdict}</p>}
                              <div className="flex gap-1 mt-2">
                                {nextStage && (
                                  <button onClick={() => handleStageChange(cp.id, nextStage)}
                                    className="text-[10px] px-2 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors flex items-center gap-0.5">
                                    → {STAGE_LABEL[nextStage]}
                                  </button>
                                )}
                                <select
                                  value={cp.verdict || ''}
                                  onChange={async (e) => {
                                    const v = e.target.value;
                                    const { updatePipelineVerdict } = await import('@/services/supabaseApi');
                                    await updatePipelineVerdict(cp.id, v);
                                    if (selectedMandate) {
                                      const data = await getPipelineByMandate(selectedMandate.id);
                                      setPipeline(data);
                                    }
                                  }}
                                  className="text-[10px] bg-bg-tertiary text-text-muted rounded px-1 py-0.5 border-0"
                                >
                                  <option value="">Verdict</option>
                                  {VERDICT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                            </div>
                          ))}
                          {candidates.length === 0 && (
                            <p className="text-xs text-text-muted text-center py-6">No candidates</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-2">
          {PIPELINE_STAGES.map(stage => {
            const candidates = pipeline[stage.value] || [];
            if (candidates.length === 0) return null;
            const nextStage = getNextStage(stage.value);
            return (
              <Card key={stage.value}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <CardTitle className="text-base">{stage.label}</CardTitle>
                    <Badge>{candidates.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidates.map(cp => (
                    <div key={cp.id} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{cp.contact?.name?.[0] ?? '?'}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{cp.contact?.name}</p>
                        <p className="text-xs text-text-muted">{cp.contact?.current_title} · {cp.contact?.company?.name}</p>
                      </div>
                      {cp.trident_composite != null && <Badge variant={cp.trident_composite >= 75 ? 'success' : cp.trident_composite >= 50 ? 'warning' : 'default'}>{cp.trident_composite}</Badge>}
                      {cp.verdict && <Badge>{cp.verdict}</Badge>}
                      {nextStage && (
                        <button onClick={() => handleStageChange(cp.id, nextStage)} className="text-xs px-3 py-1.5 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors">
                          → {STAGE_LABEL[nextStage]}
                        </button>
                      )}
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
