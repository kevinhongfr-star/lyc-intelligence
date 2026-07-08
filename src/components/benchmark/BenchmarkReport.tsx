// Phase 7.5: BENCHMARK Report Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import type { BenchmarkResult, CozeBenchmarkOutput } from '@/lib/benchmark/engine';

interface BenchmarkReportProps {
  benchmarkId: string;
}

const DIMENSION_COLORS: Record<string, string> = {
  strategic_thinking: '#3b82f6',
  execution: '#10b981',
  learning_agility: '#f59e0b',
  leadership_presence: '#8b5cf6',
  change_navigation: '#ef4444',
  analytical_depth: '#06b6d4',
  problem_solving: '#84cc16',
  decision_quality: '#f97316',
  innovation: '#a855f7',
  collaboration: '#14b8a6',
  goal_orientation: '#22c55e',
  resilience: '#eab308',
  time_management: '#6366f1',
  resourcefulness: '#ec4899',
  adaptability: '#0ea5e9',
  empathy: '#f472b6',
  communication: '#4ade80',
  feedback_delivery: '#fb923c',
  development_focus: '#c084fc',
  trust_building: '#2dd4bf',
  influence: '#a3e635',
  negotiation: '#fbbf24',
  stakeholder_management: '#818cf8',
  vision_alignment: '#f87171',
  results_delivery: '#38bdf8',
};

export function BenchmarkReport({ benchmarkId }: BenchmarkReportProps) {
  const [benchmark, setBenchmark] = useState<{
    id: string;
    assessment_type: string;
    benchmark_scope: string;
    peer_sample_size: number;
    results: BenchmarkResult[];
    status: string;
  } | null>(null);
  const [insights, setInsights] = useState<CozeBenchmarkOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  useEffect(() => {
    fetchBenchmark();
  }, [benchmarkId]);

  const fetchBenchmark = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/scoring/compute?action=benchmark&id=${benchmarkId}`);
      const result = await response.json();

      if (result.success) {
        setBenchmark(result.data);
        setInsights(result.insights);
      }
    } catch (err) {
      console.error('Failed to fetch benchmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await fetch(`/api/scoring/compute?action=export-benchmark&id=${benchmarkId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `benchmark-${benchmarkId}.pdf`;
      a.click();
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  const formatDimensionName = (dim: string) => {
    return dim.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-600 bg-green-100';
    if (percentile >= 60) return 'text-blue-600 bg-blue-100';
    if (percentile >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getDifferenceIcon = (teamAvg: number, peerAvg: number) => {
    const diff = teamAvg - peerAvg;
    if (diff >= 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (diff <= -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!benchmark) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="w-12 h-12 text-text-muted mx-auto" />
        <p className="text-text-muted mt-4">Benchmark not found</p>
      </Card>
    );
  }

  const dimensions = Object.keys(benchmark.results[0]?.dimension_scores || {});
  const teamAverage = benchmark.results[0]?.team_average || {};
  const peerAverage = benchmark.results[0]?.peer_average || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-text-primary">BENCHMARK Report</h2>
            <p className="text-sm text-text-muted mt-1">
              {benchmark.assessment_type} • {benchmark.benchmark_scope} scope • {benchmark.peer_sample_size} peer results
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPdf} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Executive Summary */}
      {insights && (
        <Card className="p-6">
          <h3 className="font-semibold text-text-primary mb-4">Executive Summary</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Insights */}
            <div>
              <h4 className="text-sm font-medium text-text-muted mb-3">Key Insights</h4>
              <div className="space-y-2">
                {insights.insights.map((insight, i) => (
                  <div key={i} className="p-3 bg-bg-alt rounded-none text-sm text-text-primary">
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-text-muted mb-3">Recommendations</h4>
              <div className="space-y-2">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-primary/5 rounded-none text-sm text-text-primary">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm font-medium text-text-muted mb-3">Team Strengths</h4>
              <div className="flex flex-wrap gap-2">
                {insights.team_strengths.map((strength, i) => (
                  <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-muted mb-3">Team Gaps</h4>
              <div className="flex flex-wrap gap-2">
                {insights.team_gaps.map((gap, i) => (
                  <span key={i} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Team Overview - Radar Chart Visualization */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-4">Team vs Peer Average</h3>
        
        {/* Simple Bar Chart Representation */}
        <div className="space-y-4">
          {dimensions.map(dim => {
            const teamScore = teamAverage[dim] || 0;
            const peerScore = peerAverage[dim] || 0;
            const diff = teamScore - peerScore;

            return (
              <div key={dim} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {formatDimensionName(dim)}
                  </span>
                  <div className="flex items-center gap-2">
                    {getDifferenceIcon(teamScore, peerScore)}
                    <span className={`text-sm font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {/* Team bar */}
                  <div
                    className="h-6 bg-primary rounded"
                    style={{ width: `${teamScore}%` }}
                    title={`Team: ${teamScore}`}
                  />
                  {/* Peer bar */}
                  <div
                    className="h-6 bg-gray-300 rounded"
                    style={{ width: `${peerScore}%` }}
                    title={`Peer: ${peerScore}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>Team: {teamScore}</span>
                  <span>Peer: {peerScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Individual Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-4">Individual Breakdown</h3>
        
        <div className="space-y-4">
          {benchmark.results.map(result => (
            <div key={result.member_id} className="border border-border rounded-none">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-alt"
                onClick={() => setExpandedMember(expandedMember === result.member_id ? null : result.member_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {result.member_name.charAt(0)}
                  </div>
                  <span className="font-medium text-text-primary">{result.member_name}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${expandedMember === result.member_id ? 'rotate-180' : ''}`} />
              </div>

              {expandedMember === result.member_id && (
                <div className="p-4 bg-bg-alt space-y-3">
                  {dimensions.map(dim => {
                    const percentile = result.percentile_rank[dim] || 50;
                    const score = result.dimension_scores[dim] || 0;

                    return (
                      <div key={dim} className="flex items-center justify-between">
                        <span className="text-sm text-text-primary">{formatDimensionName(dim)}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-text-muted">Score: {score}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPercentileColor(percentile)}`}>
                            {percentile}th percentile
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Dimension Heatmap */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-4">Dimension Heatmap</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm font-medium text-text-muted p-2">Member</th>
                {dimensions.map(dim => (
                  <th key={dim} className="text-center text-xs font-medium text-text-muted p-2">
                    {formatDimensionName(dim).split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benchmark.results.map(result => (
                <tr key={result.member_id}>
                  <td className="text-sm text-text-primary p-2">{result.member_name}</td>
                  {dimensions.map(dim => {
                    const percentile = result.percentile_rank[dim] || 50;
                    const bgColor = percentile >= 80 ? 'bg-green-500' :
                      percentile >= 60 ? 'bg-green-300' :
                      percentile >= 40 ? 'bg-amber-300' :
                      percentile >= 20 ? 'bg-red-300' : 'bg-red-500';

                    return (
                      <td key={dim} className="p-1">
                        <div
                          className={`w-full h-8 rounded ${bgColor} flex items-center justify-center text-xs font-medium ${
                            percentile >= 60 ? 'text-white' : 'text-gray-700'
                          }`}
                          title={`${formatDimensionName(dim)}: ${percentile}th percentile`}
                        >
                          {percentile}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default BenchmarkReport;