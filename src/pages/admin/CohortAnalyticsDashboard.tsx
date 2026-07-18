/**
 * CohortAnalyticsDashboard — Admin SHIFT assessment analytics
 * Issue #21: Cohort Analytics Dashboard
 *
 * Shows aggregate benchmark reporting with:
 * - Overview stats (total assessments, completion rate, avg score)
 * - Dimension breakdown with averages and distributions
 * - Score histogram and stanine distribution
 * - Monthly trends
 * - Top performers leaderboard
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  Award,
  BarChart3,
  Download,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress, Select, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

interface OverviewData {
  total_assessments: number;
  unique_users: number;
  avg_composite_score: string;
  max_score: string;
  min_score: string;
  completion_rate: string;
  period: string;
}

interface DimensionData {
  dimension: string;
  avg_score: string;
  min_score: string;
  max_score: string;
  std_dev: string;
  avg_percentile: string;
  sample_size: number;
}

interface DistributionData {
  score_histogram: { range: string; count: number; label: string }[];
  stanine_distribution: { stanine: number; count: number }[];
  total_samples: number;
}

interface TrendData {
  month: string;
  avg_score: number;
  count: number;
}

interface LeaderboardEntry {
  user_id: string;
  composite_score: number;
  leadership_style: string | null;
  strengths: string[];
  benchmark_percentile: number | null;
  created_at: string;
}

const DIMENSION_COLORS: Record<string, string> = {
  'Strategic Thinking': 'bg-blue-500',
  'Operational Excellence': 'bg-green-500',
  'People Leadership': 'bg-purple-500',
  'Innovation': 'bg-amber-500',
  'Emotional Intelligence': 'bg-pink-500',
  'Drive': 'bg-red-500',
};

function getColorForDimension(dim: string): string {
  return DIMENSION_COLORS[dim] || 'bg-[#C108AB]';
}

export function CohortAnalyticsDashboard() {
  const { session } = useAuthStore();
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [dimensions, setDimensions] = useState<DimensionData[]>([]);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const [ovRes, dimRes, distRes, trendRes, lbRes] = await Promise.all([
        fetch(`/api/cohort/overview?period=${period}`, { headers }),
        fetch('/api/cohort/dimensions', { headers }),
        fetch('/api/cohort/distribution', { headers }),
        fetch('/api/cohort/trends?months=6', { headers }),
        fetch('/api/cohort/leaderboard?limit=10', { headers }),
      ]);

      const [ov, dim, dist, trend, lb] = await Promise.all([
        ovRes.json(),
        dimRes.json(),
        distRes.json(),
        trendRes.json(),
        lbRes.json(),
      ]);

      if (ov.success) setOverview(ov.overview);
      if (dim.success) setDimensions(dim.dimensions);
      if (dist.success) setDistribution(dist.distribution);
      if (trend.success) setTrends(trend.trends);
      if (lb.success) setLeaderboard(lb.leaderboard);
    } catch (err) {
      console.error('Failed to fetch cohort analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [period, session]);

  const maxHistogramCount = distribution
    ? Math.max(...distribution.score_histogram.map(h => h.count), 1)
    : 1;

  const maxTrendScore = trends.length > 0 ? Math.max(...trends.map(t => t.avg_score), 100) : 100;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-56 bg-[#F5F5F5] rounded mb-2" />
          <div className="h-4 w-72 bg-[#F5F5F5] rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-10 w-10 bg-[#F5F5F5] rounded mb-3" />
              <div className="h-6 w-16 bg-[#F5F5F5] rounded mb-1" />
              <div className="h-3 w-24 bg-[#F5F5F5] rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#171717]">Cohort Analytics</h1>
          <p className="text-sm text-[#737373] mt-1">
            Aggregate SHIFT assessment benchmarks and reporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
              { value: '365d', label: 'Last year' },
            ]}
            className="w-40"
          />
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C108AB]/10 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <Users className="w-5 h-5 text-[#C108AB]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#171717]">{overview?.total_assessments ?? 0}</div>
              <div className="text-xs text-[#737373]">Total Assessments</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#171717]">{overview?.unique_users ?? 0}</div>
              <div className="text-xs text-[#737373]">Unique Users</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#171717]">{overview?.avg_composite_score ?? '0.0'}</div>
              <div className="text-xs text-[#737373]">Avg Composite Score</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 flex items-center justify-center" style={{ borderRadius: 0 }}>
              <Award className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#171717]">{overview?.completion_rate ?? '0.0'}%</div>
              <div className="text-xs text-[#737373]">Completion Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dimensions">
        <TabsList>
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Dimensions tab */}
        <TabsContent value="dimensions">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#C108AB]" />
                <CardTitle>Dimension Averages</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {dimensions.length === 0 ? (
                <div className="text-center py-8 text-[#737373]">
                  No dimension data available yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {dimensions.map((dim) => (
                    <div key={dim.dimension}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-medium text-[#171717]">{dim.dimension}</span>
                          <span className="text-xs text-[#A3A3A3] ml-2">(n={dim.sample_size})</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-[#737373]">
                            Avg: <span className="font-medium text-[#171717]">{dim.avg_score}</span>
                          </span>
                          <span className="text-[#737373]">
                            Range: <span className="font-medium text-[#171717]">{dim.min_score}-{dim.max_score}</span>
                          </span>
                          <span className="text-[#737373]">
                            σ: <span className="font-medium text-[#171717]">{dim.std_dev}</span>
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {dim.avg_percentile}th %ile
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-[#F5F5F5] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getColorForDimension(dim.dimension)} rounded-full transition-all`}
                          style={{ width: `${parseFloat(dim.avg_score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution tab */}
        <TabsContent value="distribution">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {distribution && distribution.total_samples > 0 ? (
                  <div className="flex items-end justify-between gap-2 h-48">
                    {distribution.score_histogram.map((bucket, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center h-32">
                          <div
                            className="w-full bg-[#C108AB] rounded-t transition-all hover:bg-[#A50798] relative group"
                            style={{
                              height: `${(bucket.count / maxHistogramCount) * 100}%`,
                              minHeight: bucket.count > 0 ? '4px' : '0',
                            }}
                          >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-[#737373] opacity-0 group-hover:opacity-100 transition-opacity">
                              {bucket.count}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-[#737373]">{bucket.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#737373]">No distribution data available.</div>
                )}
                <p className="text-xs text-[#A3A3A3] mt-3 text-center">
                  Total samples: {distribution?.total_samples ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stanine Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {distribution && distribution.stanine_distribution.some(s => s.count > 0) ? (
                  <div className="flex items-end justify-between gap-2 h-48">
                    {distribution.stanine_distribution.map((stanine, i) => {
                      const maxStanine = Math.max(...distribution.stanine_distribution.map(s => s.count), 1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center h-32">
                            <div
                              className={`w-full rounded-t transition-all ${
                                stanine.stanine <= 3 ? 'bg-red-400' :
                                stanine.stanine <= 6 ? 'bg-amber-400' :
                                'bg-green-500'
                              }`}
                              style={{
                                height: `${(stanine.count / maxStanine) * 100}%`,
                                minHeight: stanine.count > 0 ? '4px' : '0',
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#737373]">{stanine.stanine}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#737373]">No stanine data available.</div>
                )}
                <div className="flex justify-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-400" style={{ borderRadius: 0 }} /> Low (1-3)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-400" style={{ borderRadius: 0 }} /> Average (4-6)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500" style={{ borderRadius: 0 }} /> High (7-9)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#C108AB]" />
                <CardTitle>Monthly Score Trends</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {trends.length === 0 || trends.every(t => t.count === 0) ? (
                <div className="text-center py-8 text-[#737373]">No trend data available.</div>
              ) : (
                <div className="flex items-end justify-between gap-4 h-56">
                  {trends.map((trend, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-40">
                        <div
                          className="w-10 bg-[#C108AB] rounded-t transition-all hover:bg-[#A50798] relative group"
                          style={{
                            height: `${(trend.avg_score / maxTrendScore) * 100}%`,
                            minHeight: trend.avg_score > 0 ? '4px' : '0',
                          }}
                        >
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-[#171717] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            {trend.avg_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-[#737373]">{trend.month}</div>
                        <div className="text-xs text-[#A3A3A3]">{trend.count} assessments</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C108AB]" />
                <CardTitle>Top Performers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-[#737373]">No leaderboard data available.</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between p-3 bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                          i === 0 ? 'bg-amber-100 text-amber-700' :
                          i === 1 ? 'bg-gray-200 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-[#F5F5F5] text-[#737373]'
                        }`} style={{ borderRadius: 0 }}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#171717]">
                            User {entry.user_id.slice(0, 8)}...
                          </div>
                          {entry.leadership_style && (
                            <div className="text-xs text-[#737373]">{entry.leadership_style}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {entry.strengths && entry.strengths.length > 0 && (
                          <div className="hidden md:flex gap-1">
                            {entry.strengths.slice(0, 2).map((s, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}
                        {entry.benchmark_percentile && (
                          <Badge className="text-xs bg-[#C108AB]/10 text-[#C108AB]">
                            {entry.benchmark_percentile.toFixed(0)}th %ile
                          </Badge>
                        )}
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#171717]">
                            {entry.composite_score.toFixed(1)}
                          </div>
                          <div className="text-xs text-[#A3A3A3]">score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CohortAnalyticsDashboard;