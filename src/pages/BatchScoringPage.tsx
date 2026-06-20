import { useAuthStore } from '@/stores/authStore';
import React, { useState, useCallback } from 'react';
import { Target, Loader2, AlertTriangle, CheckCircle2, ArrowRight, Zap, BarChart3, Database, FileText, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { useContacts } from '@/hooks/useSupabaseData';
import { MandateSelector } from '@/components/match/MandateSelector';
import { ContactSelector } from '@/components/match/ContactSelector';
import { PipelineSaveModal } from '@/components/match/PipelineSaveModal';
import { toast } from '@/stores/toastStore';
import type { MatchResult } from '@/services/scoringClient';

interface SubScore {
  score: number;
  rationale: string;
}

interface ScoreResult {
  candidate_name: string;
  composite_score: number;
  dimension_scores: Record<string, number>;
  match_reasons: string[];
  risk_factors: string[];
  approach_strategy: string;
  sub_scores: Record<string, SubScore>;
  contact_id?: string;
  verdict?: string;
}

const CRITERIA_META: Record<string, { label: string; shortLabel: string; color: string }> = {
  c1_industry_relevance: { label: 'C1 — Industry Relevance', shortLabel: 'Industry', color: '#D4AF37' },
  c2_functional_expertise: { label: 'C2 — Functional Expertise', shortLabel: 'Functional', color: '#22C55E' },
  c3_leadership_scale: { label: 'C3 — Leadership Scale', shortLabel: 'Leadership', color: '#3B82F6' },
  c4_track_record: { label: 'C4 — Track Record', shortLabel: 'Track Record', color: '#A855F7' },
  c5_strategic_fit: { label: 'C5 — Strategic & Cultural Fit', shortLabel: 'Strategic Fit', color: '#F97316' },
};

function CriterionBar({ criteriaKey, score, rationale }: { criteriaKey: string; score: number; rationale: string }) {
  const meta = CRITERIA_META[criteriaKey];
  if (!meta) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-sm font-medium text-text-primary">{meta.label}</span>
        </div>
        <span className="text-sm font-bold font-mono" style={{ color: meta.color }}>{score}</span>
      </div>
      <div className="h-2.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${score}%`, backgroundColor: meta.color }} />
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">{rationale}</p>
    </div>
  );
}

function ScoreCard({ result, rank, onSave }: { result: ScoreResult; rank: number; onSave?: () => void }) {
  const tier = result.composite_score >= 80 ? 'S' : result.composite_score >= 65 ? 'A' : result.composite_score >= 45 ? 'B' : 'C';
  const tierColors: Record<string, string> = { S: '#D4AF37', A: '#22C55E', B: '#3B82F6', C: '#94A3B8' };

  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: tierColors[tier] }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: `${tierColors[tier]}20`, color: tierColors[tier] }}>
              #{rank}
            </div>
            <div>
              <h3 className="font-medium text-text-primary text-lg">{result.candidate_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge style={{ backgroundColor: `${tierColors[tier]}20`, color: tierColors[tier], borderColor: `${tierColors[tier]}40` } as any}>
                  Tier {tier}
                </Badge>
                <span className="text-2xl font-bold font-mono text-text-primary">{result.composite_score}</span>
                <span className="text-xs text-text-muted">/100</span>
                {result.contact_id && <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">DB</span>}
              </div>
            </div>
          </div>
          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
            >
              <Save className="w-3 h-3" />
              Save to Pipeline
            </button>
          )}
        </div>

        <div className="space-y-4 mb-5">
          {Object.entries(result.sub_scores).map(([key, val]) => (
            <CriterionBar key={key} criteriaKey={key} score={val.score} rationale={val.rationale} />
          ))}
        </div>

        <div className="flex items-end gap-1.5 h-16 mb-5 p-3 bg-bg-tertiary rounded-lg">
          {Object.entries(result.dimension_scores).map(([key, score]) => {
            const meta = CRITERIA_META[key];
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t transition-all duration-500" style={{ height: `${score * 0.56}px`, backgroundColor: meta?.color || '#94A3B8' }} />
                <span className="text-[9px] text-text-muted">{meta?.shortLabel || key}</span>
              </div>
            );
          })}
        </div>

        {result.match_reasons.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" /> Match Reasons
            </h4>
            <ul className="space-y-1">
              {result.match_reasons.map((r, i) => (
                <li key={i} className="text-sm text-text-primary flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.risk_factors.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Risk Factors
            </h4>
            <ul className="space-y-1">
              {result.risk_factors.map((r, i) => (
                <li key={i} className="text-sm text-text-primary flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.approach_strategy && (
          <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
            <h4 className="text-xs font-medium text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> Approach Strategy
            </h4>
            <p className="text-sm text-text-primary leading-relaxed">{result.approach_strategy}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BatchScoringPage() {
  const [jd, setJd] = useState('');
  const [mandateId, setMandateId] = useState<string | null>(null);
  const [mandateTitle, setMandateTitle] = useState('');
  const [jdMode, setJdMode] = useState<'paste' | 'db'>('paste');
  const [showMandateSelector, setShowMandateSelector] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const { profile } = useAuthStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFromDb, setSelectedFromDb] = useState<Map<string, { contact_id: string; name: string; cv: string }>>(new Map());
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveTarget, setSaveTarget] = useState<ScoreResult | null>(null);

  const { data: contacts, loading: contactsLoading } = useContacts({ query: search || undefined, limit: 50 });

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleContactSelect = (contacts: Array<{ contact_id: string; name: string; cv: string }>) => {
    const newMap = new Map(selectedFromDb);
    const newIds = [...selectedIds];
    contacts.forEach(c => {
      newMap.set(c.contact_id, c);
      if (!newIds.includes(c.contact_id)) newIds.push(c.contact_id);
    });
    setSelectedFromDb(newMap);
    setSelectedIds(newIds);
    setShowContactSelector(false);
    toast.success(`Added ${contacts.length} candidate${contacts.length !== 1 ? 's' : ''} from database`);
  };

  const handleMandateSelect = (mandate: { mandate_id: string; title: string; jd: string }) => {
    setMandateId(mandate.mandate_id);
    setMandateTitle(mandate.title);
    setJd(mandate.jd);
    setShowMandateSelector(false);
    toast.success(`Loaded mandate: ${mandate.title}`);
  };

  // Persist scoring run to DB
  const persistScoringRun = useCallback(async (result: ScoreResult) => {
    try {
      await fetch('/api/data/scoring-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_id: mandateId || null,
          contact_id: result.contact_id || null,
          run_type: 'batch_5criteria',
          input_params: JSON.stringify({ jd: jd.substring(0, 500), source: 'batch' }),
          output_scores: JSON.stringify({
            composite_score: result.composite_score,
            sub_scores: result.sub_scores,
            dimension_scores: result.dimension_scores,
          }),
          composite_score: result.composite_score,
          verdict: result.composite_score >= 80 ? 'Strong Fit' : result.composite_score >= 65 ? 'Conditional Fit' : result.composite_score >= 45 ? 'Weak Fit' : 'Reject',
          model: 'deepseek-chat',
        }),
      });
    } catch (e) {
      console.warn('[BatchScoring] Failed to persist scoring run:', e);
    }
  }, [mandateId, jd]);

  const runScoring = useCallback(async () => {
    if (!jd.trim()) { toast.warning('Please enter or select a job description'); return; }
    if (selectedIds.length === 0) { toast.warning('Please select at least one candidate'); return; }

    setLoading(true);
    setResults([]);

    const candidates = selectedIds.map(id => {
      const fromDb = selectedFromDb.get(id);
      const fromSearch = contacts.find(c => c.id === id);
      if (fromDb) {
        return { name: fromDb.name, cv: fromDb.cv };
      }
      if (fromSearch) {
        return {
          name: fromSearch.name || 'Unknown',
          cv: [fromSearch.current_title, fromSearch.headline, fromSearch.summary, ...(fromSearch.skills || [])].filter(Boolean).join('\n'),
        };
      }
      return { name: 'Unknown', cv: '' };
    });

    try {
      const res = await fetch('/api/scoring/5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, candidates }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      const enriched: ScoreResult[] = (data.results || []).map((r: any, i: number) => ({
        ...r,
        contact_id: selectedIds[i] || undefined,
        verdict: r.composite_score >= 80 ? 'Strong Fit' : r.composite_score >= 65 ? 'Conditional Fit' : r.composite_score >= 45 ? 'Weak Fit' : 'Reject',
      }));

      setResults(enriched);
      toast.success(`Scored ${enriched.length} candidate${enriched.length !== 1 ? 's' : ''}`);

      // Persist scoring runs (fire and forget)
      enriched.forEach(r => persistScoringRun(r));
    } catch (e: any) {
      toast.error(e.message || 'Scoring failed');
    } finally {
      setLoading(false);
    }
  }, [jd, selectedIds, selectedFromDb, contacts, persistScoringRun]);

  // Convert ScoreResult to MatchResult for PipelineSaveModal
  const toMatchResult = (r: ScoreResult): MatchResult => ({
    candidate_name: r.candidate_name,
    composite_score: r.composite_score,
    dimension_scores: { experience: r.dimension_scores?.c1_industry_relevance || 0, skills: r.dimension_scores?.c2_functional_expertise || 0, fit: r.dimension_scores?.c5_strategic_fit || 0 },
    match_reasons: r.match_reasons,
    risk_factors: r.risk_factors,
    approach_strategy: r.approach_strategy,
    sub_scores: { C1: r.sub_scores?.c1_industry_relevance?.score || 0, C2: r.sub_scores?.c2_functional_expertise?.score || 0, C3: r.sub_scores?.c3_leadership_scale?.score || 0, C4: r.sub_scores?.c4_track_record?.score || 0, C5: r.sub_scores?.c5_strategic_fit?.score || 0 },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">5-Criteria Match Analysis</h1>
        <p className="text-text-muted">Score candidates against a mandate using the LYC 5-Criteria Framework</p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JD Input */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Target className="w-4 h-4 text-accent" />Mandate / Job Description</CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setJdMode('paste')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${jdMode === 'paste' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'}`}
                >
                  <FileText className="w-3 h-3 inline mr-1" />Paste
                </button>
                <button
                  onClick={() => setJdMode('db')}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${jdMode === 'db' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-primary'}`}
                >
                  <Database className="w-3 h-3 inline mr-1" />From DB
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {jdMode === 'paste' ? (
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the job description or mandate brief here..."
                className="w-full h-48 p-3 bg-bg-tertiary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent"
              />
            ) : (
              <div>
                {mandateId ? (
                  <div className="p-4 bg-bg-tertiary rounded-lg border border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{mandateTitle}</span>
                      <button onClick={() => setShowMandateSelector(true)} className="text-xs text-accent hover:underline">Change</button>
                    </div>
                    <textarea
                      value={jd}
                      onChange={e => setJd(e.target.value)}
                      placeholder="Edit JD text..."
                      className="w-full h-32 p-3 bg-white border border-bg-tertiary rounded-lg text-sm text-text-primary resize-none focus:outline-none focus:border-accent"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowMandateSelector(true)}
                    className="w-full p-6 border-2 border-dashed border-bg-tertiary rounded-lg text-center text-sm text-text-muted hover:border-accent hover:text-accent transition-colors"
                  >
                    <Database className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    Select a mandate from the database
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-accent" />Candidates ({selectedIds.length})</CardTitle>
              <button
                onClick={() => setShowContactSelector(true)}
                className="px-2.5 py-1 text-xs bg-accent/10 text-accent rounded-md hover:bg-accent/20 transition-colors"
              >
                <Database className="w-3 h-3 inline mr-1" />Select from DB
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedFromDb.size > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Array.from(selectedFromDb.values()).map(c => (
                  <span key={c.contact_id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded-full">
                    {c.name}
                    <button onClick={() => {
                      const newMap = new Map(selectedFromDb);
                      newMap.delete(c.contact_id);
                      setSelectedFromDb(newMap);
                      setSelectedIds(prev => prev.filter(x => x !== c.contact_id));
                    }} className="hover:text-accent/70">×</button>
                  </span>
                ))}
              </div>
            )}
            <input
              placeholder="Or search candidates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <div className="h-32 overflow-y-auto space-y-1">
              {contactsLoading ? (
                <div className="text-center py-4"><Loader2 className="w-4 h-4 animate-spin text-text-muted mx-auto" /></div>
              ) : contacts.map(c => (
                <label key={c.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedIds.includes(c.id) ? 'bg-accent/10' : 'hover:bg-bg-tertiary'}`}>
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleCandidate(c.id)} className="accent-accent" />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{c.name}</p>
                    <p className="text-[11px] text-text-muted truncate">{c.current_title} · {c.company?.name || 'No company'}</p>
                  </div>
                  {c.trident_composite != null && (
                    <span className="ml-auto text-xs font-mono text-text-muted">{c.trident_composite}</span>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Run Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={runScoring}
          disabled={loading || !jd.trim() || selectedIds.length === 0}
          className="px-6 py-3 bg-accent text-white rounded-lg font-medium text-sm disabled:opacity-40 hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          {loading ? 'Scoring...' : `Score ${selectedIds.length} Candidate${selectedIds.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text-primary">Results</h2>
            <span className="text-sm text-text-muted">{results.length} candidate{results.length !== 1 ? 's' : ''} scored</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results.sort((a, b) => b.composite_score - a.composite_score).map((r, i) => (
              <ScoreCard
                key={r.candidate_name + (r.contact_id || '')}
                result={r}
                rank={i + 1}
                onSave={() => setSaveTarget(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <MandateSelector
        open={showMandateSelector}
        onClose={() => setShowMandateSelector(false)}
        onSelect={handleMandateSelect}
      />
      <ContactSelector
        open={showContactSelector}
        onClose={() => setShowContactSelector(false)}
        onSelect={handleContactSelect}
        multi={true}
        userId={profile?.id}
      />
      {saveTarget && (
        <PipelineSaveModal
          open={!!saveTarget}
          onClose={() => setSaveTarget(null)}
          result={toMatchResult(saveTarget)}
          contactId={saveTarget.contact_id || null}
          candidateName={saveTarget.candidate_name}
          onSuccess={() => {
            toast.success('Saved to pipeline');
            setSaveTarget(null);
          }}
        />
      )}
    </div>
  );
}
