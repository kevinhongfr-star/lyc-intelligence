import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, FileText, ClipboardList, Eye, MessageSquare, FileDown, BarChart3, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { useMandateDetail } from '@/hooks/useSupabaseData';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { STAGE_ORDER, STAGE_CONFIG } from '@/types/mandate';
import { executeAIAction, type AIAction } from '@/services/aiQuickActions';
import { updateMandateStatus, updatePipelineStage, updatePipelineVerdict } from '@/services/supabaseApi';

const STATUS_OPTIONS = [
  { value: '1_search', label: 'SWEEP', color: '#6366F1' },
  { value: '2_call', label: 'CANVA', color: '#F59E0B' },
  { value: '3_deliver', label: 'GRID/LENS', color: '#10B981' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
  { value: 'completed', label: 'Completed', color: '#8B5CF6' },
];

const NEXT_STAGE: Record<string, string> = { SWEEP: 'CANVA', CANVA: 'GRID', GRID: 'LENS', LENS: 'PLACED' };
const VERDICT_OPTIONS = ['Strong Fit', 'Conditional Fit', 'Weak Fit', 'Hold', 'Reject'];

const AI_ACTIONS: { key: AIAction; icon: any; label: string }[] = [
  { key: 'email', icon: Mail, label: 'Email' }, { key: 'cv', icon: FileText, label: 'CV' },
  { key: 'shortlist', icon: ClipboardList, label: 'Shortlist' }, { key: 'overview', icon: Eye, label: 'Overview' },
  { key: 'feedback', icon: MessageSquare, label: 'Feedback' },
];

export function MandateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { mandate, pipeline, loading, refresh } = useMandateDetail(id || '');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    await updateMandateStatus(id!, newStatus);
    await refresh();
    setStatusUpdating(false);
  };

  const handleStageChange = async (pipelineId: string, newStage: string) => {
    await updatePipelineStage(pipelineId, newStage);
    await refresh();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!mandate) return <div className="text-text-muted text-center py-20">Mandate not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/platform/mandates" className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Mandates
        </Link>
        <div className="flex gap-2">
          <Link to={`/platform/mandates/${id}/lens`}>
            <Button variant="outline" size="sm"><FileDown className="w-4 h-4" />LENS Report</Button>
          </Link>
          <Link to="/platform/batch-scoring">
            <Button variant="outline" size="sm"><BarChart3 className="w-4 h-4" />TRIDENT Score</Button>
          </Link>
          <Link to="/platform/pipeline">
            <Button variant="outline" size="sm"><Eye className="w-4 h-4" />GRID View</Button>
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">{mandate.title}</h1>
        <p className="text-text-muted">{mandate.company?.name ?? 'No client'}</p>
      </div>

      {/* Status bar with action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-text-muted">Status:</span>
        <select
          value={mandate.status}
          onChange={e => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="text-sm bg-bg-tertiary text-text-primary rounded-lg px-3 py-2 border-0 min-h-[44px]"
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => handleStatusChange('won')} className="flex items-center gap-1 px-3 py-2 bg-tier-1/20 text-tier-1 rounded-lg text-sm hover:bg-tier-1/30 min-h-[44px]">
          <CheckCircle className="w-3.5 h-3.5" />Won
        </button>
        <button onClick={() => handleStatusChange('on_hold')} className="flex items-center gap-1 px-3 py-2 bg-tier-2/20 text-tier-2 rounded-lg text-sm hover:bg-tier-2/30 min-h-[44px]">
          <PauseCircle className="w-3.5 h-3.5" />Hold
        </button>
        <button onClick={() => handleStatusChange('lost')} className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 min-h-[44px]">
          <XCircle className="w-3.5 h-3.5" />Lost
        </button>
      </div>

      {/* Stage pipeline bar */}
      <div className="flex gap-1">
        {STAGE_ORDER.map(s => {
          const c = s === 'SWEEP' ? mandate.tier1_count : s === 'CANVA' ? mandate.tier2_count : s === 'GRID' ? mandate.shortlisted_count : s === 'LENS' ? mandate.interview_count : mandate.placed_count;
          return <div key={s} className="flex-1 h-10 rounded flex items-center justify-center text-sm font-medium" style={{ backgroundColor: `${STAGE_CONFIG[s].color}20`, color: STAGE_CONFIG[s].color }}>{s}: {c}</div>;
        })}
      </div>

      {/* PHI info if available */}
      {mandate.phi_composite != null && (
        <Card>
          <CardHeader className="py-2"><CardTitle className="text-sm">PHI Health</CardTitle></CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { label: 'Urgency', val: mandate.phi_urgency },
                { label: 'Strategic', val: mandate.phi_strategic },
                { label: 'Value', val: mandate.phi_value },
                { label: 'Retainer', val: mandate.phi_retainer },
                { label: 'Decision', val: mandate.phi_decision },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-xs text-text-muted">{m.label}</p>
                  <p className={`text-lg font-bold ${m.val != null ? (m.val >= 7 ? 'text-red-400' : m.val >= 4 ? 'text-tier-2' : 'text-tier-1') : 'text-text-muted'}`}>{m.val ?? '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-text-primary">Pipeline ({pipeline.length} candidates)</h2>
          {pipeline.map(p => (
            <div key={p.id} onClick={() => setSelectedCandidate(p.contact_id)} className={`bg-bg-secondary border rounded-lg p-4 cursor-pointer transition-colors ${selectedCandidate === p.contact_id ? 'border-accent' : 'border-bg-tertiary hover:border-accent/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{p.contact?.name?.[0] ?? '?'}</div>
                  <div>
                    <h3 className="font-medium text-text-primary">{p.contact?.name ?? 'Unknown'}</h3>
                    <p className="text-xs text-text-muted">{p.contact?.current_title ?? ''} · {p.contact?.company?.name ?? ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.trident_composite != null && <Badge variant={p.trident_composite >= 75 ? 'success' : p.trident_composite >= 50 ? 'warning' : 'default'}>{p.trident_composite}</Badge>}
                  <Badge>{p.stage}</Badge>
                </div>
              </div>
              {p.verdict && <p className="text-xs text-text-muted mt-1">Verdict: {p.verdict}</p>}
              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                {NEXT_STAGE[p.stage] && (
                  <button onClick={e => { e.stopPropagation(); handleStageChange(p.id, NEXT_STAGE[p.stage]); }}
                    className="text-xs px-2 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors">
                    → {STAGE_CONFIG[NEXT_STAGE[p.stage] as keyof typeof STAGE_CONFIG]?.label}
                  </button>
                )}
                <select
                  value={p.verdict || ''}
                  onClick={e => e.stopPropagation()}
                  onChange={async e => { await updatePipelineVerdict(p.id, e.target.value); await refresh(); }}
                  className="text-xs bg-bg-tertiary text-text-muted rounded px-1 py-0.5 border-0"
                >
                  <option value="">Verdict</option>
                  {VERDICT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {selectedCandidate && (
            <Card>
              <CardHeader><CardTitle>AI Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {AI_ACTIONS.map(a => (
                    <Button key={a.key} variant="outline" size="sm" onClick={() => {
                      const candidate = pipeline.find(p => p.contact_id === selectedCandidate)?.contact;
                      if (!candidate) return;
                      setAiLoading(a.key);
                      executeAIAction(a.key, { name: candidate.name, title: candidate.current_title || undefined, company: candidate.company?.name || undefined, mandate: mandate.title, viewMode: 'internal' }).then(out => { setAiOutput(out); setAiLoading(null); });
                    }} disabled={aiLoading !== null}>
                      {aiLoading === a.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <a.icon className="w-3 h-3" />}{a.label}
                    </Button>
                  ))}
                </div>
                {aiOutput && <div className="bg-bg-tertiary rounded-lg p-3 text-sm text-text-secondary whitespace-pre-wrap max-h-64 overflow-auto">{aiOutput}</div>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
