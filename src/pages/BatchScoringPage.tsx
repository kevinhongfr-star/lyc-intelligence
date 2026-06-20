import React, { useState, useCallback } from 'react';
import { Target, Loader2, AlertTriangle, CheckCircle2, ArrowRight, Zap, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useContacts } from '@/hooks/useSupabaseData';

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
}

const CRITERIA_META: Record<string, { label: string; shortLabel: string; color: string; description: string }> = {
  c1_industry_relevance: { label: 'C1 — Industry Relevance', shortLabel: 'Industry', color: '#D4AF37', description: 'Direct experience in target industry or adjacent sectors' },
  c2_functional_expertise: { label: 'C2 — Functional Expertise', shortLabel: 'Functional', color: '#22C55E', description: 'Depth in required functional area' },
  c3_leadership_scale: { label: 'C3 — Leadership Scale', shortLabel: 'Leadership', color: '#3B82F6', description: 'Team size, P&L scope, org complexity' },
  c4_track_record: { label: 'C4 — Track Record', shortLabel: 'Track Record', color: '#A855F7', description: 'Achievements, tenure, career progression' },
  c5_strategic_fit: { label: 'C5 — Strategic & Cultural Fit', shortLabel: 'Strategic Fit', color: '#F97316', description: 'Alignment with company stage and culture' },
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
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: meta.color }}
        />
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">{rationale}</p>
    </div>
  );
}

function ScoreCard({ result, rank }: { result: ScoreResult; rank: number }) {
  const tier = result.composite_score >= 80 ? 'S' : result.composite_score >= 65 ? 'A' : result.composite_score >= 45 ? 'B' : 'C';
  const tierColors: Record<string, string> = { S: '#D4AF37', A: '#22C55E', B: '#3B82F6', C: '#94A3B8' };

  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: tierColors[tier] }} />
      <CardContent className="p-5">
        {/* Header */}
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
              </div>
            </div>
          </div>
        </div>

        {/* 5-Criteria Breakdown */}
        <div className="space-y-4 mb-5">
          {Object.entries(result.sub_scores).map(([key, val]) => (
            <CriterionBar key={key} criteriaKey={key} score={val.score} rationale={val.rationale} />
          ))}
        </div>

        {/* Radar-style summary bars */}
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

        {/* Match Reasons */}
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

        {/* Risk Factors */}
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

        {/* Approach Strategy */}
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: contacts, loading: contactsLoading } = useContacts({ query: search || undefined, limit: 50 });

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const runScoring = useCallback(async () => {
    if (!jd.trim() || selectedIds.length === 0) {
      setError('Please enter a job description and select at least one candidate');
      return;
    }
    setLoading(true);
    setError('');
    setResults([]);

    const candidates = selectedIds.map(id => {
      const c = contacts.find(x => x.id === id);
      return {
        name: c?.name || 'Unknown',
        cv: [c?.current_title, c?.headline, c?.summary, ...(c?.skills || [])].filter(Boolean).join('\n'),
      };
    });

    try {
      const res = await fetch('/api/scoring/5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, candidates }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e: any) {
      setError(e.message || 'Scoring failed');
    } finally {
      setLoading(false);
    }
  }, [jd, selectedIds, contacts]);

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
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-4 h-4 text-accent" />Mandate / Job Description</CardTitle></CardHeader>
          <CardContent>
            <textarea
              value={jd}
              onChange={e => setJd(e.target.value)}
              placeholder="Paste the job description or mandate brief here..."
              className="w-full h-48 p-3 bg-bg-tertiary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent"
            />
          </CardContent>
        </Card>

        {/* Candidate Selector */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-accent" />Select Candidates ({selectedIds.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input
              placeholder="Search candidates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
            <div className="h-40 overflow-y-auto space-y-1">
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
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-text-primary">Results</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {results.sort((a, b) => b.composite_score - a.composite_score).map((r, i) => (
              <ScoreCard key={r.candidate_name} result={r} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
