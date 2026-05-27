import React, { useState, useEffect } from 'react';
import { Clock, Filter, Loader2, FileText, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { getSupabase } from '@/services/supabaseApi';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ScoringRun {
  id: string;
  user_id: string;
  mandate_id: string | null;
  contact_id: string | null;
  run_type: string;
  input_params: any;
  output_scores: any;
  composite_score: number | null;
  verdict: string | null;
  model: string | null;
  created_at: string;
}

const RUN_TYPE_COLORS: Record<string, string> = {
  trident: '#6366F1',
  phi: '#EC4899',
  batch: '#F59E0B',
  assessment: '#10B981',
};

export function ScoringRunsPage() {
  const [runs, setRuns] = useState<ScoringRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const sb = getSupabase();
      let q = sb.from('scoring_runs').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      if (filterType !== 'all') q = q.eq('run_type', filterType);
      q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, error } = await q;
      if (!error && data) setRuns(data as ScoringRun[]);
      setLoading(false);
    }
    load();
  }, [filterType, page]);

  const runTypes = ['all', 'trident', 'phi', 'batch', 'assessment'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Scoring Runs</h1>
          <p className="text-text-secondary">Audit trail of every match analysis and priority score evaluation</p>
        </div>
        <div className="flex gap-2">
          {runTypes.map(t => (
            <button key={t} onClick={() => { setFilterType(t); setPage(0); }} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${filterType === t ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : runs.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-text-muted">No scoring runs recorded yet. Run a TRIDENT or PHI evaluation to see audit entries here.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {runs.map(run => (
            <Card key={run.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RUN_TYPE_COLORS[run.run_type] ?? '#9CA3AF' }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{run.run_type?.toUpperCase() ?? 'UNKNOWN'}</span>
                        {run.verdict && <Badge variant={run.verdict.includes('Strong') ? 'success' : run.verdict.includes('Conditional') ? 'warning' : 'danger'}>{run.verdict}</Badge>}
                        {run.composite_score != null && <span className="text-xs text-text-muted">{run.composite_score.toFixed(2)}</span>}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(run.created_at).toLocaleString()} · {run.model ?? 'N/A'} · {run.mandate_id ? `Mandate: ${run.mandate_id.slice(0, 8)}…` : ''} {run.contact_id ? `Contact: ${run.contact_id.slice(0, 8)}…` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === run.id ? null : run.id)} className="p-2 hover:bg-bg-tertiary rounded-lg text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === run.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {expandedId === run.id && (
                  <div className="mt-3 pt-3 border-t border-bg-tertiary space-y-2">
                    {run.input_params && (
                      <div>
                        <p className="text-xs text-text-muted mb-1">Input</p>
                        <pre className="text-xs text-text-secondary bg-bg-tertiary p-3 rounded-lg overflow-x-auto">{typeof run.input_params === 'string' ? run.input_params : JSON.stringify(run.input_params, null, 2)}</pre>
                      </div>
                    )}
                    {run.output_scores && (
                      <div>
                        <p className="text-xs text-text-muted mb-1">Output</p>
                        <pre className="text-xs text-text-secondary bg-bg-tertiary p-3 rounded-lg overflow-x-auto">{typeof run.output_scores === 'string' ? run.output_scores : JSON.stringify(run.output_scores, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Previous</Button>
        <span className="text-sm text-text-muted">Page {page + 1}</span>
        <Button variant="outline" onClick={() => setPage(page + 1)} disabled={runs.length < PAGE_SIZE}>Next</Button>
      </div>
    </div>
  );
}
