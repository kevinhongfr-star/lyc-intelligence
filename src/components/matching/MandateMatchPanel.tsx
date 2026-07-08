'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Users,
  Filter,
  SortAsc,
  ChevronRight,
  Play,
  AlertCircle,
  Clock,
  Loader2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { MatchQualityBadge, MatchScoreBar } from './MatchQualityBadge';

interface MatchCandidate {
  id: string;
  contact_id: string;
  candidate: {
    id: string;
    full_name?: string;
    name?: string;
    current_title?: string;
    company_name?: string;
    pipeline_stage?: string;
    motivation_overall?: string;
  };
  match_score: number;
  match_grade: string;
  trident_component: number;
  pipeline_component: number;
  heuristic_component: number;
  trident_composite?: number;
  trident_verdict?: string;
  ai_analysis?: any;
  is_stale: boolean;
}

interface MandateMatchPanelProps {
  mandateId: string;
  mandateTitle?: string;
  onCandidateClick?: (contactId: string, matchId: string) => void;
}

type SortBy = 'match_score' | 'trident_component' | 'pipeline_component' | 'heuristic_component';
type GradeFilter = 'all' | 'EXCEPTIONAL' | 'STRONG' | 'MODERATE' | 'WEAK' | 'MISMATCH';

export function MandateMatchPanel({ mandateId, mandateTitle, onCandidateClick }: MandateMatchPanelProps) {
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('match_score');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [includeStale, setIncludeStale] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [mandateId]);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matching/mandate/${mandateId}/matches?include_stale=${includeStale}`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
      }
    } catch (e) {
      console.error('Failed to load matches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMatch = async () => {
    setIsRunning(true);
    setRunStatus('Starting match run...');
    try {
      const res = await fetch(`/api/matching/mandate/${mandateId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_score: 30,
          max_results: 50,
          deepseek_analysis: true,
          deepseek_top_n: 20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRunStatus('Running match... evaluating candidates');
        const runId = data.run_id;

        const checkInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/matching/runs/${runId}`);
            const statusData = await statusRes.json();
            if (statusData.success) {
              const run = statusData.run;
              setRunStatus(`Status: ${run.status} — ${run.candidates_evaluated || 0} evaluated, ${run.matches_found || 0} matches`);
              if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
                clearInterval(checkInterval);
                setIsRunning(false);
                setRunStatus(null);
                loadMatches();
              }
            }
          } catch (e) {
            console.error('Status check error:', e);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(checkInterval);
          setIsRunning(false);
          setRunStatus(null);
          loadMatches();
        }, 60000);
      }
    } catch (e) {
      console.error('Failed to start match:', e);
      setIsRunning(false);
    }
  };

  const filteredMatches = matches
    .filter(m => gradeFilter === 'all' || m.match_grade === gradeFilter)
    .filter(m => includeStale || !m.is_stale)
    .sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  const counts = {
    exceptional: matches.filter(m => m.match_grade === 'EXCEPTIONAL').length,
    strong: matches.filter(m => m.match_grade === 'STRONG').length,
    moderate: matches.filter(m => m.match_grade === 'MODERATE').length,
    weak: matches.filter(m => m.match_grade === 'WEAK').length,
  };

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-text-primary">AI Match Results</h3>
              <p className="text-sm text-text-muted">
                {matches.length} candidate{matches.length !== 1 ? 's' : ''} matched for this mandate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadMatches}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleRunMatch}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run Match'}
            </Button>
          </div>
        </div>

        {runStatus && (
          <div className="mt-3 flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-none px-3 py-2">
            <Zap className="w-4 h-4 animate-pulse" />
            {runStatus}
          </div>
        )}
      </div>

      {/* Stats */}
      {matches.length > 0 && (
        <div className="grid grid-cols-4 gap-2 px-6 py-3 bg-bg-alt/50 border-b border-border">
          {[
            { label: 'Exceptional', count: counts.exceptional, color: 'text-emerald-600' },
            { label: 'Strong', count: counts.strong, color: 'text-blue-600' },
            { label: 'Moderate', count: counts.moderate, color: 'text-amber-600' },
            { label: 'Weak/Mismatch', count: counts.weak + (matches.length - Object.values(counts).reduce((a, b) => a + b, 0)), color: 'text-gray-500' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className={`text-xl font-bold ${item.color}`}>{item.count}</div>
              <div className="text-xs text-text-muted">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value as GradeFilter)}
            className="px-2 py-1 text-sm rounded-none bg-bg-base border border-border text-text-primary"
          >
            <option value="all">All Grades</option>
            <option value="EXCEPTIONAL">Exceptional</option>
            <option value="STRONG">Strong</option>
            <option value="MODERATE">Moderate</option>
            <option value="WEAK">Weak</option>
            <option value="MISMATCH">Mismatch</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <SortAsc className="w-4 h-4 text-text-muted" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="px-2 py-1 text-sm rounded-none bg-bg-base border border-border text-text-primary"
          >
            <option value="match_score">Overall Score</option>
            <option value="trident_component">TRIDENT Fit</option>
            <option value="pipeline_component">Pipeline Fit</option>
            <option value="heuristic_component">Heuristic Fit</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary ml-auto">
          <input
            type="checkbox"
            checked={includeStale}
            onChange={e => setIncludeStale(e.target.checked)}
            className="rounded"
          />
          Include stale
        </label>
      </div>

      {/* Match List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-text-muted">Loading matches...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-text-muted mx-auto" />
            <h4 className="font-medium text-text-primary mt-4">No matches found</h4>
            <p className="text-sm text-text-muted mt-1">
              Click "Run Match" to find candidates for this mandate.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredMatches.map(match => {
              const name = match.candidate?.full_name || match.candidate?.name || 'Unknown';
              const title = match.candidate?.current_title || '';
              const company = match.candidate?.company_name || '';

              return (
                <div
                  key={match.id}
                  onClick={() => onCandidateClick?.(match.contact_id, match.id)}
                  className={`px-6 py-4 hover:bg-bg-alt/50 cursor-pointer transition-colors ${
                    match.is_stale ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center font-semibold text-text-muted text-sm">
                      #{filteredMatches.indexOf(match) + 1}
                    </div>

                    {/* Candidate info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary truncate">{name}</h4>
                        <MatchQualityBadge score={match.match_score} grade={match.match_grade} size="sm" />
                        {match.is_stale && (
                          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Stale
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted truncate">
                        {title}{company ? ` at ${company}` : ''}
                      </p>

                      {/* Score bar */}
                      <div className="mt-2">
                        <MatchScoreBar score={match.match_score} grade={match.match_grade} showScore={false} height="h-1.5" />
                      </div>

                      {/* Component breakdown */}
                      <div className="flex gap-4 mt-2 text-xs text-text-muted">
                        <span>TRIDENT: <span className="font-medium text-text-secondary">{match.trident_component?.toFixed(0)}</span></span>
                        <span>Pipeline: <span className="font-medium text-text-secondary">{match.pipeline_component?.toFixed(0)}</span></span>
                        <span>Heuristic: <span className="font-medium text-text-secondary">{match.heuristic_component?.toFixed(0)}</span></span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MandateMatchPanel;
