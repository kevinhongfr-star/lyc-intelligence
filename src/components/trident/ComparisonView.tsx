import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Filter, Download, Eye, Users, Award, BarChart3
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

interface ComparisonViewProps {
  mandateId: string;
  onCandidateClick?: (contactId: string) => void;
}

interface CompareCandidate {
  contact_id: string;
  full_name: string;
  company_name: string;
  title: string;
  d1_score: number;
  d2_score: number;
  d3_score: number;
  composite_score: number;
  verdict: string;
  segment: string;
  pipeline_stage: string;
  review_status: string;
  stale_flag: boolean;
  scored_at: string;
}

export function ComparisonView({ mandateId, onCandidateClick }: ComparisonViewProps) {
  const [candidates, setCandidates] = useState<CompareCandidate[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [verdictFilter, setVerdictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'composite' | 'name' | 'recent'>('composite');

  useEffect(() => {
    loadComparison();
  }, [mandateId]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trident/compare?mandate_id=${mandateId}`);
      const data = await response.json();
      if (data.success) {
        setCandidates(data.candidates);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Load comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Exceptional Primary': return 'bg-purple-500';
      case 'Strong': return 'bg-green-500';
      case 'Solid': return 'bg-blue-500';
      case 'Conditional': return 'bg-yellow-500';
      case 'Not Recommended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSegmentColor = (seg: string) => {
    switch (seg) {
      case 'A': return 'text-green-600 bg-green-50';
      case 'B': return 'text-yellow-600 bg-yellow-50';
      case 'C': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600';
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'adjusted': return 'warning';
      case 'info_requested': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const filteredCandidates = candidates
    .filter(c => filter === 'all' || c.segment === filter)
    .filter(c => verdictFilter === 'all' || c.verdict === verdictFilter)
    .filter(c => statusFilter === 'all' || c.review_status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'composite') return b.composite_score - a.composite_score;
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      if (sortBy === 'recent') return new Date(b.scored_at).getTime() - new Date(a.scored_at).getTime();
      return 0;
    });

  const uniqueVerdicts = [...new Set(candidates.map(c => c.verdict))];
  const uniqueStatuses = [...new Set(candidates.map(c => c.review_status))];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <BarChart3 className="w-8 h-8 mx-auto animate-pulse mx-auto mb-3 text-accent" />
        <p className="text-text-muted">Loading comparison...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Candidate Comparison</h2>
          {summary && (
            <p className="text-sm text-text-muted">
              Scored: {summary.total_scored} | Avg Composite: {summary.avg_composite} | Recommended: {summary.recommended_count}
            </p>
          )}
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-1" /> Export
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-text-primary">{summary.total_scored}</div>
            <div className="text-xs text-text-muted">Total Scored</div>
          </Card>
          <Card className="p-3 text-center bg-green-50">
            <div className="text-2xl font-bold text-green-600">{summary.segment_a}</div>
            <div className="text-xs text-green-700">Segment A</div>
          </Card>
          <Card className="p-3 text-center bg-yellow-50">
            <div className="text-2xl font-bold text-yellow-600">{summary.segment_b}</div>
            <div className="text-xs text-yellow-700">Segment B</div>
          </Card>
          <Card className="p-3 text-center bg-red-50">
            <div className="text-2xl font-bold text-red-600">{summary.segment_c}</div>
            <div className="text-xs text-red-700">Segment C</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-text-primary">{summary.recommended_count}</div>
            <div className="text-xs text-text-muted">Recommended</div>
          </Card>
        </div>
      )}

      <Card className="p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Filter:</span>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-2 py-1 bg-bg border border-border rounded text-sm"
          >
            <option value="all">All Segments</option>
            <option value="A">Segment A</option>
            <option value="B">Segment B</option>
            <option value="C">Segment C</option>
          </select>

          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-2 py-1 bg-bg border border-border rounded text-sm"
          >
            <option value="all">All Verdicts</option>
            {uniqueVerdicts.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-bg border border-border rounded text-sm"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-text-muted">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2 py-1 bg-bg border border-border rounded text-sm"
            >
              <option value="composite">Composite</option>
              <option value="name">Name</option>
              <option value="recent">Recent</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-alt text-sm text-text-muted border-b">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Company</th>
                <th className="text-center p-3">D1</th>
                <th className="text-center p-3">D2</th>
                <th className="text-center p-3">D3</th>
                <th className="text-center p-3">Comp</th>
                <th className="text-left p-3">Verdict</th>
                <th className="text-center p-3">Seg</th>
                <th className="text-left p-3">Pipeline</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate, i) => (
                <tr
                  key={candidate.contact_id}
                  className="border-b hover:bg-bg-alt cursor-pointer"
                  onClick={() => onCandidateClick?.(candidate.contact_id)}
                >
                  <td className="p-3 text-text-muted">{i + 1}</td>
                  <td className="p-3">
                    <div className="font-medium text-text-primary flex items-center gap-2">
                      {candidate.full_name}
                      {candidate.stale_flag && <Badge variant="warning" className="text-xs">Stale</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-sm text-text-muted">{candidate.company_name || '-'}</td>
                  <td className="p-3 text-center font-medium">{candidate.d1_score?.toFixed(1) || '-'}</td>
                  <td className="p-3 text-center font-medium">{candidate.d2_score?.toFixed(1) || '-'}</td>
                  <td className="p-3 text-center font-medium">{candidate.d3_score?.toFixed(1) || '-'}</td>
                  <td className="p-3 text-center">
                    <span className="text-lg font-bold text-text-primary">
                      {candidate.composite_score?.toFixed(1) || '-'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge className={`text-white ${getVerdictColor(candidate.verdict)}`}>
                      {candidate.verdict}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${getSegmentColor(candidate.segment)}`}>
                      {candidate.segment}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-text-muted">
                    {candidate.pipeline_stage || '-'}
                  </td>
                  <td className="p-3">
                    <Badge variant={getReviewStatusColor(candidate.review_status) as any}>
                      {candidate.review_status}
                    </Badge>
                  </td>
                </tr>
              ))}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-text-muted">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No candidates match the filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}