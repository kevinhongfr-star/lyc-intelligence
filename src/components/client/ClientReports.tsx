import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Clock, Users, FileText, Download, 
  ArrowRight, Calendar, Award, Target, CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getMandatesWithStats, getPipelineStats } from '@/services/supabaseApi';
import type { Mandate } from '@/services/supabaseApi';

interface PipelineStats {
  total_candidates: number;
  by_stage: Record<string, number>;
  conversion_rates: { stage: string; rate: number }[];
  avg_time_per_stage: { stage: string; days: number }[];
}

export function ClientReports() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'time' | 'quality'>('pipeline');
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const orgId = profile?.organization_id;
    
    if (orgId) {
      const data = await getMandatesWithStats(orgId);
      setMandates(data);
      
      const stats = await getPipelineStats(orgId);
      setPipelineStats(stats);
    }
    
    setLoading(false);
  };

  // Calculate time-to-shortlist metrics
  const calculateTimeMetrics = () => {
    const times: number[] = [];
    const shortlistTimes: number[] = [];
    
    mandates.forEach(mandate => {
      if (mandate.created_at) {
        const created = new Date(mandate.created_at);
        const now = new Date();
        const days = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        times.push(days);
        
        // Check if any candidate reached shortlist stage
        if (mandate.shortlisted_count && mandate.shortlisted_count > 0) {
          shortlistTimes.push(days);
        }
      }
    });
    
    return {
      avgTimeToShortlist: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      targetTimeToShortlist: 14, // 2 weeks target
      avgTimeToPresentation: shortlistTimes.length > 0 ? Math.round(shortlistTimes.reduce((a, b) => a + b, 0) / shortlistTimes.length) : 0,
      targetTimeToPresentation: 7, // 1 week target
    };
  };

  const timeMetrics = calculateTimeMetrics();

  // Calculate quality metrics
  const calculateQualityMetrics = () => {
    let totalApproved = 0;
    let totalReviewed = 0;
    const scoreDistribution = { strong: 0, moderate: 0, weak: 0 };
    
    mandates.forEach(mandate => {
      // Approximate approval rate from mandate stats
      totalApproved += mandate.placed_count || 0;
      totalReviewed += mandate.shortlisted_count || 0;
      
      const avgScore = mandate.intake_data?.match_score_avg || 0;
      if (avgScore >= 75) scoreDistribution.strong++;
      else if (avgScore >= 50) scoreDistribution.moderate++;
      else scoreDistribution.weak++;
    });
    
    return {
      approvalRate: totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : 0,
      scoreDistribution,
      totalCandidates: mandates.reduce((sum, m) => sum + (m.total_candidates || 0), 0),
    };
  };

  const qualityMetrics = calculateQualityMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Client Reports</h1>
          <p className="text-text-muted">Track your mandate progress and candidate quality</p>
        </div>
        <button className="px-4 py-2 bg-accent text-white rounded-none text-sm font-medium hover:bg-accent/90 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-bg-secondary p-1 rounded-none">
        {[
          { id: 'pipeline' as const, label: 'Pipeline Summary', icon: BarChart3 },
          { id: 'time' as const, label: 'Time-to-Shortlist', icon: Clock },
          { id: 'quality' as const, label: 'Candidate Quality', icon: Award },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Content */}
      <div className="bg-bg-secondary rounded-none p-6">
        {/* Pipeline Summary */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-none p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Total Candidates</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {pipelineStats?.total_candidates || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </div>
              
              <div className="bg-white rounded-none p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Active Mandates</p>
                    <p className="text-2xl font-bold text-text-primary">{mandates.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-none p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Shortlisted</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {mandates.reduce((sum, m) => sum + (m.shortlisted_count || 0), 0)}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-none p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Placed</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {mandates.reduce((sum, m) => sum + (m.placed_count || 0), 0)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-none p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Conversion Funnel</h3>
              <div className="space-y-4">
                {[
                  { stage: 'Approach', count: 100, color: '#3B82F6' },
                  { stage: 'Screened', count: 75, color: '#6366F1' },
                  { stage: 'Client Submitted', count: 50, color: '#EC4899' },
                  { stage: 'Client Approved', count: 35, color: '#F59E0B' },
                  { stage: 'Interview', count: 25, color: '#10B981' },
                  { stage: 'Offer Sent', count: 15, color: '#14B8A6' },
                  { stage: 'Offer Accepted', count: 10, color: '#22C55E' },
                ].map((item, index) => (
                  <div key={item.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{item.stage}</span>
                      <span className="text-sm text-text-muted">{item.count}%</span>
                    </div>
                    <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.count}%`,
                          backgroundColor: item.color,
                          transitionDelay: `${index * 100}ms`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage Distribution */}
            <div className="bg-white rounded-none p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Candidates by Stage</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(pipelineStats?.by_stage || {}).map(([stage, count]) => (
                  <div 
                    key={stage}
                    className="text-center p-4 bg-bg-secondary rounded-none"
                  >
                    <p className="text-2xl font-bold text-text-primary">{count}</p>
                    <p className="text-xs text-text-muted capitalize">{stage.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Time-to-Shortlist */}
        {activeTab === 'time' && (
          <div className="space-y-6">
            {/* Time Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-none p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-accent" />
                  <h3 className="text-lg font-semibold text-text-primary">Time to Shortlist</h3>
                </div>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold text-text-primary">
                    {timeMetrics.avgTimeToShortlist}
                    <span className="text-xl font-normal text-text-muted"> days</span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Target className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted">Target: {timeMetrics.targetTimeToShortlist} days</span>
                  </div>
                  <div className="mt-4 w-full">
                    <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          timeMetrics.avgTimeToShortlist <= timeMetrics.targetTimeToShortlist 
                            ? 'bg-green-500' 
                            : 'bg-amber-500'
                        }`}
                        style={{ 
                          width: `${Math.min((timeMetrics.avgTimeToShortlist / timeMetrics.targetTimeToShortlist) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-none p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                  <h3 className="text-lg font-semibold text-text-primary">Time to Presentation</h3>
                </div>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold text-text-primary">
                    {timeMetrics.avgTimeToPresentation}
                    <span className="text-xl font-normal text-text-muted"> days</span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Target className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-muted">Target: {timeMetrics.targetTimeToPresentation} days</span>
                  </div>
                  <div className="mt-4 w-full">
                    <div className="w-full h-4 bg-bg-tertiary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          timeMetrics.avgTimeToPresentation <= timeMetrics.targetTimeToPresentation 
                            ? 'bg-green-500' 
                            : 'bg-amber-500'
                        }`}
                        style={{ 
                          width: `${Math.min((timeMetrics.avgTimeToPresentation / timeMetrics.targetTimeToPresentation) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benchmark Comparison */}
            <div className="bg-white rounded-none p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Benchmark Comparison</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Time to Shortlist</p>
                      <p className="text-sm text-text-muted">vs industry benchmark</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${timeMetrics.avgTimeToShortlist <= 14 ? 'text-green-600' : 'text-amber-600'}`}>
                      {timeMetrics.avgTimeToShortlist} days
                    </p>
                    <p className="text-sm text-text-muted">Target: 14 days</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Shortlist to Presentation</p>
                      <p className="text-sm text-text-muted">Time from shortlist to client review</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${timeMetrics.avgTimeToPresentation <= 7 ? 'text-green-600' : 'text-amber-600'}`}>
                      {timeMetrics.avgTimeToPresentation} days
                    </p>
                    <p className="text-sm text-text-muted">Target: 7 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Candidate Quality */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            {/* Quality Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-none p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-4xl font-bold text-text-primary mb-2">
                    {qualityMetrics.approvalRate}%
                  </div>
                  <p className="text-sm text-text-muted">Client Approval Rate</p>
                </div>
              </div>
              
              <div className="bg-white rounded-none p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-4xl font-bold text-text-primary mb-2">
                    {qualityMetrics.totalCandidates}
                  </div>
                  <p className="text-sm text-text-muted">Total Candidates Reviewed</p>
                </div>
              </div>
              
              <div className="bg-white rounded-none p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-4xl font-bold text-text-primary mb-2">
                    {mandates.reduce((sum, m) => sum + (m.placed_count || 0), 0)}
                  </div>
                  <p className="text-sm text-text-muted">Successfully Placed</p>
                </div>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-none p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Match Score Distribution</h3>
              <div className="flex items-center justify-around py-8">
                {[
                  { label: 'Strong Fit', count: qualityMetrics.scoreDistribution.strong, color: '#22C55E' },
                  { label: 'Moderate Fit', count: qualityMetrics.scoreDistribution.moderate, color: '#EAB308' },
                  { label: 'Weak Fit', count: qualityMetrics.scoreDistribution.weak, color: '#EF4444' },
                ].map((item) => {
                  const total = qualityMetrics.scoreDistribution.strong + qualityMetrics.scoreDistribution.moderate + qualityMetrics.scoreDistribution.weak;
                  const percentage = total > 0 ? (item.count / total) * 100 : 0;
                  
                  return (
                    <div key={item.label} className="text-center">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.count}
                      </div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mandate Performance */}
            <div className="bg-white rounded-none p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Mandate Performance</h3>
              <div className="space-y-3">
                {mandates.slice(0, 5).map((mandate) => (
                  <div key={mandate.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-none">
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{mandate.title}</p>
                      <p className="text-xs text-text-muted">{mandate.total_candidates} candidates</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">
                        {mandate.intake_data?.match_score_avg || '-'}%
                      </p>
                      <p className="text-xs text-text-muted">Avg Match</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientReports;
