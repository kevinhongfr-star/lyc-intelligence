/**
 * CoachingCareerIntelPage — B2C Coaching Portal career intelligence
 * Renders inside AppShell → Outlet. Shows skill assessments, market
 * insights, and salary benchmarks.
 *
 * Data sources:
 *   - Skill assessments: derived from Supabase assessments table via useCandidateCareerIntel (RLS)
 *   - Market insights / salary benchmarks: static (no market_data table in current schema — future ticket)
 */
import React, { useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  DollarSign,
  Briefcase,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '@/components/ui';
import { useCandidateCareerIntel } from '@/hooks/usePortalData';

interface SkillAssessment {
  id: string;
  skill: string;
  score: number; // 0-100
  benchmark: number; // peer average 0-100
  trend: 'up' | 'down' | 'flat';
  category: string;
}

interface MarketInsight {
  id: string;
  role: string;
  demandLevel: 'High' | 'Moderate' | 'Low';
  openings: number;
  growthRate: string;
  topLocations: string[];
}

interface SalaryBenchmark {
  id: string;
  role: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  yourCurrent: number;
}

const STATIC_INSIGHTS: MarketInsight[] = [
  { id: 'm1', role: 'VP Engineering', demandLevel: 'High', openings: 1240, growthRate: '+18% YoY', topLocations: ['San Francisco', 'New York', 'Remote'] },
  { id: 'm2', role: 'CFO', demandLevel: 'Moderate', openings: 480, growthRate: '+6% YoY', topLocations: ['New York', 'Chicago', 'Boston'] },
  { id: 'm3', role: 'Head of Product', demandLevel: 'High', openings: 890, growthRate: '+22% YoY', topLocations: ['San Francisco', 'Seattle', 'Remote'] },
  { id: 'm4', role: 'COO', demandLevel: 'Low', openings: 210, growthRate: '+2% YoY', topLocations: ['New York', 'London', 'Singapore'] },
];

const STATIC_SALARIES: SalaryBenchmark[] = [
  { id: 'sal1', role: 'VP Engineering', percentile25: 280000, percentile50: 340000, percentile75: 410000, yourCurrent: 315000 },
  { id: 'sal2', role: 'CFO', percentile25: 320000, percentile50: 390000, percentile75: 475000, yourCurrent: 360000 },
  { id: 'sal3', role: 'Head of Product', percentile25: 250000, percentile50: 305000, percentile75: 370000, yourCurrent: 298000 },
];

const DEMAND_STYLES: Record<MarketInsight['demandLevel'], string> = {
  'High': 'bg-green/10 text-green',
  'Moderate': 'bg-amber/10 text-amber',
  'Low': 'bg-text-muted/10 text-text-muted',
};

function formatCurrency(value: number): string {
  return `$${(value / 1000).toFixed(0)}K`;
}

export function CoachingCareerIntelPage() {
  const { data: intelData, loading: intelLoading } = useCandidateCareerIntel();
  const insights = STATIC_INSIGHTS;
  const salaries = STATIC_SALARIES;
  const loading = intelLoading;

  // Derive skill rows from the latest benchmark / log entries
  const skills: SkillAssessment[] = useMemo(() => {
    const benchmark = intelData?.benchmarks?.[0] as any;
    if (!benchmark) return [];
    const entries: SkillAssessment[] = [];
    const scores = (benchmark.dimension_scores || benchmark.scores || {}) as Record<string, number>;
    const peerBench = (benchmark.peer_benchmarks || {}) as Record<string, number>;
    for (const [skill, score] of Object.entries(scores)) {
      const numeric = typeof score === 'number' ? score : 0;
      const peer = peerBench[skill] ?? 70; // default peer baseline
      entries.push({
        id: `b-${skill}`,
        skill: skill.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        score: numeric,
        benchmark: peer,
        trend: numeric > peer ? 'up' : numeric < peer ? 'down' : 'flat',
        category: benchmark.category || 'General',
      });
    }
    return entries;
  }, [intelData]);

  const avgScore =
    skills.length > 0
      ? Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length)
      : 0;
  const aboveBenchmark = skills.filter((s) => s.score >= s.benchmark).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Career Intelligence</h1>
        <p className="text-text-secondary text-sm mt-1">
          Data-driven insights into your skills, the market, and compensation benchmarks.
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Brain className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : avgScore}</div>
              <div className="text-xs text-text-muted">Avg. Skill Score</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Target className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : `${aboveBenchmark}/${skills.length}`}</div>
              <div className="text-xs text-text-muted">Above Peer Benchmark</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">High</div>
              <div className="text-xs text-text-muted">Target Role Demand</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Skill assessments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-fuchsia" />
            <CardTitle>Skill Assessments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading assessments...</div>
          ) : skills.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No skill assessments yet.</div>
          ) : (
            <div className="space-y-5">
              {skills.map((skill) => {
                const above = skill.score >= skill.benchmark;
                return (
                  <div key={skill.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{skill.skill}</span>
                        <Badge variant="default">{skill.category}</Badge>
                        {skill.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-green" />}
                        {skill.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red" />}
                      </div>
                      <span className={`text-xs font-semibold ${above ? 'text-green' : 'text-amber'}`}>
                        {skill.score} {above ? '(above benchmark)' : '(below benchmark)'}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={skill.score} />
                      <div
                        className="absolute top-0 h-2 w-px bg-text-secondary"
                        style={{ left: `${skill.benchmark}%` }}
                        title={`Peer benchmark: ${skill.benchmark}`}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-text-muted">
                      <span>Your score</span>
                      <span>Peer benchmark: {skill.benchmark}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market insights + Salary benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-fuchsia" />
              <CardTitle>Market Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading insights...</div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{insight.role}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${DEMAND_STYLES[insight.demandLevel]}`}>
                        {insight.demandLevel} Demand
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-text-muted">Openings: </span>
                        <span className="font-medium text-text-primary">{insight.openings.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Growth: </span>
                        <span className="font-medium text-fuchsia">{insight.growthRate}</span>
                      </div>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Hot in: {insight.topLocations.join(' · ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary benchmarks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-fuchsia" />
              <CardTitle>Salary Benchmarks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading benchmarks...</div>
            ) : (
              <div className="space-y-5">
                {salaries.map((sal) => {
                  const position =
                    sal.yourCurrent <= sal.percentile25
                      ? '25th percentile'
                      : sal.yourCurrent <= sal.percentile50
                        ? '50th percentile'
                        : sal.yourCurrent <= sal.percentile75
                          ? '75th percentile'
                          : 'Above 75th';
                  return (
                    <div key={sal.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">{sal.role}</span>
                        <Badge variant="success">
                          <Award className="w-3 h-3 mr-1" /> {position}
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between gap-2 mb-2">
                        <div className="text-center">
                          <div className="text-xs text-text-muted">P25</div>
                          <div className="text-sm font-semibold text-text-secondary">{formatCurrency(sal.percentile25)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-text-muted">P50</div>
                          <div className="text-sm font-semibold text-text-secondary">{formatCurrency(sal.percentile50)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-text-muted">P75</div>
                          <div className="text-sm font-semibold text-text-secondary">{formatCurrency(sal.percentile75)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-fuchsia">You</div>
                          <div className="text-sm font-bold text-fuchsia">{formatCurrency(sal.yourCurrent)}</div>
                        </div>
                      </div>
                      <div className="relative h-2 bg-bg-warm rounded-full overflow-hidden">
                        <div
                          className="absolute h-2 bg-fuchsia/30 rounded-full"
                          style={{ left: '0%', width: '100%' }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-fuchsia"
                          style={{
                            left: `${Math.min(100, ((sal.yourCurrent - sal.percentile25) / (sal.percentile75 - sal.percentile25)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CoachingCareerIntelPage;
