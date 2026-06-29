'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  RefreshCw,
  ChevronRight,
  Play,
  Loader2,
  Zap,
  Building2,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { MatchQualityBadge, MatchScoreBar } from './MatchQualityBadge';

interface MatchMandate {
  id: string;
  mandate_id: string;
  mandate: {
    id: string;
    title?: string;
    company_name?: string;
    industry?: string;
    location?: string;
    status?: string;
    phase?: string;
  };
  match_score: number;
  match_grade: string;
  trident_component: number;
  pipeline_component: number;
  heuristic_component: number;
  is_stale: boolean;
}

interface CandidateMatchPanelProps {
  contactId: string;
  candidateName?: string;
  onMandateClick?: (mandateId: string, matchId: string) => void;
}

export function CandidateMatchPanel({ contactId, candidateName, onMandateClick }: CandidateMatchPanelProps) {
  const [matches, setMatches] = useState<MatchMandate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, [contactId]);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matching/candidate/${contactId}/matches`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches || []);
      }
    } catch (e) {
      console.error('Failed to load candidate matches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMatch = async () => {
    setIsRunning(true);
    setRunStatus('Finding matching mandates...');
    try {
      const res = await fetch(`/api/matching/candidate/${contactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_score: 30,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const runId = data.run_id;

        const checkInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/matching/runs/${runId}`);
            const statusData = await statusRes.json();
            if (statusData.success) {
              const run = statusData.run;
              setRunStatus(`Status: ${run.status} — ${run.candidates_evaluated || 0} evaluated`);
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
        }, 30000);
      }
    } catch (e) {
      console.error('Failed to start match:', e);
      setIsRunning(false);
    }
  };

  const sortedMatches = [...matches].sort((a, b) => b.match_score - a.match_score);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-text-primary">Matched Mandates</h3>
              <p className="text-sm text-text-muted">
                {matches.length} mandate{matches.length !== 1 ? 's' : ''} matched
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
              {isRunning ? 'Running...' : 'Find Mandates'}
            </Button>
          </div>
        </div>

        {runStatus && (
          <div className="mt-3 flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
            <Zap className="w-4 h-4 animate-pulse" />
            {runStatus}
          </div>
        )}
      </div>

      {/* Match List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-text-muted">Loading matches...</span>
          </div>
        ) : sortedMatches.length === 0 ? (
          <div className="py-12 text-center">
            <Briefcase className="w-12 h-12 text-text-muted mx-auto" />
            <h4 className="font-medium text-text-primary mt-4">No mandates found</h4>
            <p className="text-sm text-text-muted mt-1">
              Click "Find Mandates" to discover matching opportunities.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedMatches.map((match, index) => {
              const title = match.mandate?.title || 'Untitled Mandate';
              const company = match.mandate?.company_name || '';
              const location = match.mandate?.location || '';
              const phase = match.mandate?.phase || match.mandate?.status || '';

              return (
                <div
                  key={match.id}
                  onClick={() => onMandateClick?.(match.mandate_id, match.id)}
                  className="px-6 py-4 hover:bg-bg-alt/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center font-semibold text-text-muted text-sm">
                      #{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-text-primary truncate">{title}</h4>
                        <MatchQualityBadge score={match.match_score} grade={match.match_grade} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-text-muted">
                        {company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {company}
                          </span>
                        )}
                        {location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {location}
                          </span>
                        )}
                        {phase && (
                          <span className="px-2 py-0.5 text-xs bg-bg-alt rounded-full">
                            {phase}
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <MatchScoreBar score={match.match_score} grade={match.match_grade} showScore={false} height="h-1.5" />
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

export default CandidateMatchPanel;
