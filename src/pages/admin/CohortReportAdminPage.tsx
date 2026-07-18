/**
 * CohortReportAdminPage — Cohort Intelligence Report admin UI
 * Issue #22: Cohort Intelligence Report Auto-Gen
 *
 * Admin page for generating, viewing, and managing
 * automated cohort performance reports.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Download,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Sparkles,
  BarChart3,
  Target,
  Award,
  MessageSquare,
  BookOpen,
  Calendar as CalendarIcon,
  Star,
  Building2,
  Zap,
  RefreshCw,
  Loader2,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface CohortReport {
  id: string;
  cohort_id: string;
  cohort_name: string;
  period: string;
  report_type: string;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  summary_metrics?: {
    members: number;
    active: number;
    engagement_score: number;
    placements: number;
    satisfaction: number;
  };
}

interface ReportDetail {
  id: string;
  cohort_id: string;
  cohort_name: string;
  period: string;
  sections: Record<string, any>;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function CohortReportAdminPage() {
  const [reports, setReports] = useState<CohortReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cohortFilter, setCohortFilter] = useState('all');

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/cohort-reports', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReports(data.data || []);
      } else {
        throw new Error('Failed');
      }
    } catch {
      setReports(MOCK_REPORTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/cohort-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cohort_id: 'coh_q2_2026',
          period: 'monthly',
        }),
      });
      if (res.ok) {
        loadReports();
      }
    } catch {
      // Mock delay
      await new Promise((r) => setTimeout(r, 1500));
      loadReports();
    } finally {
      setGenerating(false);
    }
  };

  const viewReport = (id: string) => {
    const report = MOCK_REPORTS.find((r) => r.id === id);
    if (report) {
      setSelectedReport({
        id: report.id,
        cohort_id: report.cohort_id,
        cohort_name: report.cohort_name,
        period: report.period,
        created_at: report.created_at,
        sections: generateMockSections(),
      });
    }
  };

  if (selectedReport) {
    return (
      <ReportDetailView
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-1">
                <FileText className="h-4 w-4" />
                Cohort Intelligence
              </div>
              <h1 className="text-[24px] font-serif text-[#1A1A1A]">Cohort Reports</h1>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Users className="h-4 w-4" />} label="Active Cohorts" value="3" trend="+1" />
          <StatCard icon={<FileText className="h-4 w-4" />} label="Reports Generated" value="12" trend="+3" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Avg Engagement" value="72%" trend="+5%" />
          <StatCard icon={<Award className="h-4 w-4" />} label="Total Placements" value="18" trend="+4" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Input
              placeholder="Search reports..."
              value={cohortFilter}
              onChange={(e: any) => setCohortFilter(e.target.value)}
              startIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" onClick={loadReports}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-[#9B9B9B]" />
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} onView={() => viewReport(report.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report Detail View                                                  */
/* ------------------------------------------------------------------ */

function ReportDetailView({
  report,
  onBack,
}: {
  report: ReportDetail;
  onBack: () => void;
}) {
  const sections = Object.entries(report.sections);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <button
            onClick={onBack}
            className="text-[13px] text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1 mb-3"
          >
            ← Back to reports
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-serif text-[#1A1A1A]">
                {report.cohort_name}
              </h1>
              <p className="text-[13px] text-[#6B6B6B] mt-1">
                {report.period.charAt(0).toUpperCase() + report.period.slice(1)} Report ·{' '}
                {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export PDF
              </Button>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-1.5" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <MetricTile label="Total Members" value="42" icon={<Users className="h-4 w-4" />} />
          <MetricTile label="Active" value="38" icon={<Zap className="h-4 w-4" />} />
          <MetricTile label="Engagement" value="72%" icon={<TrendingUp className="h-4 w-4" />} />
          <MetricTile label="Satisfaction" value="4.3/5" icon={<Star className="h-4 w-4" />} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {sections.map(([key, data]) => (
            <ReportSection key={key} sectionKey={key} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string; trend: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#9B9B9B] mb-1">
          {icon}
          {label}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-serif text-[#1A1A1A]">{value}</span>
          <span className="text-[12px] text-emerald-600">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportCard({ report, onView }: { report: CohortReport; onView: () => void }) {
  const statusConfig = {
    completed: { icon: <CheckCircle2 className="h-4 w-4" />, variant: 'success' as const, label: 'Completed' },
    generating: { icon: <Loader2 className="h-4 w-4 animate-spin" />, variant: 'warning' as const, label: 'Generating' },
    failed: { icon: <AlertCircle className="h-4 w-4" />, variant: 'danger' as const, label: 'Failed' },
  }[report.status];

  return (
    <Card className="hover:border-[#C0C0C0] transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#F0F0F0] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-[#6B6B6B]" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#1A1A1A]">{report.cohort_name}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[#9B9B9B]">
                <span>{report.period}</span>
                <span>·</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {report.summary_metrics && (
              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[14px] font-medium text-[#1A1A1A]">{report.summary_metrics.members}</div>
                  <div className="text-[10px] text-[#9B9B9B] uppercase">Members</div>
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#1A1A1A]">{report.summary_metrics.engagement_score}%</div>
                  <div className="text-[10px] text-[#9B9B9B] uppercase">Engagement</div>
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#1A1A1A]">{report.summary_metrics.placements}</div>
                  <div className="text-[10px] text-[#9B9B9B] uppercase">Placements</div>
                </div>
              </div>
            )}
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <ChevronRight className="h-4 w-4 text-[#9B9B9B]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#9B9B9B] mb-1">
          {icon}
          <span className="text-[11px] uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-[24px] font-serif text-[#1A1A1A]">{value}</div>
      </CardContent>
    </Card>
  );
}

function ReportSection({ sectionKey, data }: { sectionKey: string; data: any }) {
  const sectionMeta: Record<string, { title: string; icon: React.ReactNode }> = {
    executive_summary: { title: 'Executive Summary', icon: <Sparkles className="h-4 w-4" /> },
    member_activity: { title: 'Member Activity', icon: <Users className="h-4 w-4" /> },
    engagement_metrics: { title: 'Engagement Metrics', icon: <Zap className="h-4 w-4" /> },
    placement_outcomes: { title: 'Placement Outcomes', icon: <Target className="h-4 w-4" /> },
    coaching_metrics: { title: 'Coaching Metrics', icon: <MessageSquare className="h-4 w-4" /> },
    learning_progress: { title: 'Learning Progress', icon: <BookOpen className="h-4 w-4" /> },
    event_attendance: { title: 'Event Attendance', icon: <CalendarIcon className="h-4 w-4" /> },
    satisfaction_scores: { title: 'Satisfaction Scores', icon: <Star className="h-4 w-4" /> },
    demographics: { title: 'Demographics', icon: <Building2 className="h-4 w-4" /> },
    recommendations: { title: 'Recommendations', icon: <TrendingUp className="h-4 w-4" /> },
  };

  const meta = sectionMeta[sectionKey] || { title: sectionKey, icon: <FileText className="h-4 w-4" /> };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="text-[#6B6B6B]">{meta.icon}</div>
          <CardTitle>{meta.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {Array.isArray(data) ? (
          <ul className="space-y-2">
            {data.map((item: any, i: number) => (
              <li key={i} className="text-[13px] text-[#4A4A4A] flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {typeof item === 'string' ? item : item.title || JSON.stringify(item)}
              </li>
            ))}
          </ul>
        ) : typeof data === 'object' && data !== null ? (
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between text-[13px]">
                <span className="text-[#6B6B6B] capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-medium text-[#1A1A1A]">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#6B6B6B]">{String(data)}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_REPORTS: CohortReport[] = [
  {
    id: 'rep_001',
    cohort_id: 'coh_q2_2026',
    cohort_name: 'Q2 2026 Executive Cohort',
    period: 'monthly',
    report_type: 'intelligence',
    status: 'completed',
    created_at: '2026-07-01T10:00:00Z',
    summary_metrics: {
      members: 42,
      active: 38,
      engagement_score: 72,
      placements: 5,
      satisfaction: 4.3,
    },
  },
  {
    id: 'rep_002',
    cohort_id: 'coh_q2_2026',
    cohort_name: 'Q2 2026 Executive Cohort',
    period: 'monthly',
    report_type: 'intelligence',
    status: 'completed',
    created_at: '2026-06-01T10:00:00Z',
    summary_metrics: {
      members: 40,
      active: 35,
      engagement_score: 68,
      placements: 3,
      satisfaction: 4.1,
    },
  },
  {
    id: 'rep_003',
    cohort_id: 'coh_q1_2026',
    cohort_name: 'Q1 2026 Emerging Leaders',
    period: 'quarterly',
    report_type: 'intelligence',
    status: 'completed',
    created_at: '2026-04-01T10:00:00Z',
    summary_metrics: {
      members: 35,
      active: 32,
      engagement_score: 75,
      placements: 4,
      satisfaction: 4.2,
    },
  },
];

function generateMockSections(): Record<string, any> {
  return {
    executive_summary: [
      'Strong engagement in executive coaching program',
      '3 promotions within the cohort this period',
      '92% retention rate — above target',
    ],
    member_activity: {
      active_members: 38,
      inactive_members: 4,
      new_members: 3,
      retention_rate: '92%',
    },
    engagement_metrics: {
      avg_session_minutes: 45,
      messages_per_member: 12.5,
      nps_score: 72,
    },
    placement_outcomes: {
      total_placements: 5,
      avg_salary_increase: '18%',
      promotions: 3,
      time_to_placement: '47 days',
    },
    coaching_metrics: {
      sessions_conducted: 24,
      avg_rating: '4.5/5',
      completion_rate: '88%',
    },
    learning_progress: {
      courses_enrolled: 56,
      lessons_completed: 412,
      certificates_earned: 8,
    },
    satisfaction_scores: {
      overall: '4.3/5',
      coaching: '4.5/5',
      community: '4.1/5',
      content: '4.4/5',
    },
    recommendations: [
      'Re-engage 2 inactive members with personalized outreach',
      'Add more industry-specific content to learning tracks',
      'Launch peer mentorship program pilot',
    ],
  };
}
