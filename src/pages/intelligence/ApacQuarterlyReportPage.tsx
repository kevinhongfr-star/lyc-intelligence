/**
 * ApacQuarterlyReportPage.tsx — Issue #24
 * APAC Quarterly Intelligence Report viewer and generator
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  FileText,
  ChevronRight,
  BarChart3,
  MapPin,
  Briefcase,
  Loader2,
} from 'lucide-react';

interface QuarterlyReport {
  id: string;
  quarter: string;
  year: number;
  region: string;
  status: 'draft' | 'generated' | 'under_review' | 'delivered';
  generatedAt?: string;
  sections: ReportSection[];
  overallConfidence: string;
}

interface ReportSection {
  title: string;
  type: 'summary' | 'chart' | 'table' | 'narrative';
  content: string;
  metrics?: Record<string, string | number>;
}

const MOCK_REPORT: QuarterlyReport = {
  id: 'rep-apac-q3-2026',
  quarter: 'Q3',
  year: 2026,
  region: 'APAC',
  status: 'generated',
  generatedAt: '2026-07-15T10:00:00Z',
  overallConfidence: 'high',
  sections: [
    {
      title: 'Executive Summary',
      type: 'summary',
      content: 'The APAC executive talent market shows continued resilience with strong demand in Technology, Fintech, and Healthcare sectors. Singapore and Hong Kong remain the primary hubs, while Tokyo and Sydney are gaining traction for regional leadership roles.',
      metrics: { active_mandates: 142, new_entrants: 2840, avg_time_to_fill: '68 days' },
    },
    {
      title: 'Supply & Demand',
      type: 'chart',
      content: 'Technology sector leads with 34% of active mandates, followed by Finance (28%) and Healthcare (15%). Supply of C-level candidates remains constrained with a 1.4:1 demand-to-supply ratio.',
      metrics: { tech_mandates: 48, finance_mandates: 40, healthcare_mandates: 21 },
    },
    {
      title: 'Compensation Trends',
      type: 'table',
      content: 'Median total compensation for C-level roles increased 8.5% YoY in Singapore and 6.2% in Hong Kong. CTO roles in Fintech saw the highest growth at 14%.',
      metrics: { singapore_growth: '8.5%', hong_kong_growth: '6.2%', tokyo_growth: '4.8%' },
    },
    {
      title: 'Talent Radar Highlights',
      type: 'narrative',
      content: 'Our AI-powered Talent Radar identified 47 high-potential passive candidates across APAC. 62% have movement signals indicating openness to new opportunities within 6 months.',
      metrics: { radar_profiles: 47, movement_signals: 62 },
    },
  ],
};

const REGION_STATS = [
  { city: 'Singapore', mandates: 58, candidates: 5200, growth: '+12%', color: 'bg-blue-500' },
  { city: 'Hong Kong', mandates: 42, candidates: 3800, growth: '+8%', color: 'bg-purple-500' },
  { city: 'Tokyo', mandates: 24, candidates: 2100, growth: '+15%', color: 'bg-emerald-500' },
  { city: 'Sydney', mandates: 18, candidates: 1600, growth: '+10%', color: 'bg-amber-500' },
];

export function ApacQuarterlyReportPage() {
  const [report, setReport] = useState<QuarterlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    fetchReport();
  }, []);

  async function fetchReport() {
    setLoading(true);
    try {
      const res = await fetch('/api/v10/reports');
      const data = await res.json();
      setReport(data.reports?.[0] || MOCK_REPORT);
    } catch (e) {
      setReport(MOCK_REPORT);
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch('/api/v10/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'apac-quarterly',
          override_params: { region: 'APAC', quarter: 'Q3', year: 2026 },
        }),
      });
      if (res.ok) fetchReport();
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            APAC Quarterly Report
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {report?.quarter} {report?.year} · Generated {report?.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={generateReport} disabled={generating} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Regenerate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Briefcase className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">142</div>
            <div className="text-xs text-gray-500">Active Mandates</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">12.7k</div>
            <div className="text-xs text-gray-500">Tracked Candidates</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">8.5%</div>
            <div className="text-xs text-gray-500">YoY Comp Growth</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">68</div>
            <div className="text-xs text-gray-500">Avg Days to Fill</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 overflow-auto pb-2">
            {report?.sections.map((section, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === i
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          <Card className="p-6">
            {report && (
              <div>
                <h3 className="text-lg font-medium mb-3">{report.sections[activeSection].title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{report.sections[activeSection].content}</p>
                {report.sections[activeSection].metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {Object.entries(report.sections[activeSection].metrics!).map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-semibold">{v}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{k.replace(/_/g, ' ')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Regional Breakdown
            </h3>
            <div className="space-y-3">
              {REGION_STATS.map(r => (
                <div key={r.city}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{r.city}</span>
                    <span className="text-gray-500">{r.mandates} mandates · {r.growth}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full`} style={{ width: `${(r.mandates / 58) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Report History</h3>
            <div className="space-y-2">
              {['Q2 2026', 'Q1 2026', 'Q4 2025'].map((q, i) => (
                <div key={q} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{q} APAC Report</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
