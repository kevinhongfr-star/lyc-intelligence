import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Calendar, Layout, BarChart3, Loader2, AlertCircle,
  ChevronRight, Clock, CheckCircle2, AlertTriangle, Play,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { ReportList } from '@/components/reports/ReportList';
import { ReportTemplateSelector } from '@/components/reports/ReportTemplateSelector';
import { ExportPanel } from '@/components/reports/ExportPanel';
import { ScheduleReportModal } from '@/components/reports/ScheduleReportModal';
import type { ReportData, ReportTemplateInfo, ScheduleInfo, ReportStatus, ExportOptions } from '@/services/reportService';
import {
  listReportTemplates,
  listReports,
  generateReport,
  listSchedules,
  scheduleReport,
  deleteReport,
  exportReport,
} from '@/services/reportService';

export function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplateInfo[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [schedules, setSchedules] = useState<ScheduleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeView, setActiveView] = useState<'reports' | 'generate' | 'schedules'>('reports');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, r, s] = await Promise.all([
        listReportTemplates(),
        listReports(),
        listSchedules(),
      ]);
      setTemplates(t);
      setReports(r);
      setSchedules(s);
    } catch (err: any) {
      setError(err?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setError('');
    try {
      const result = await generateReport(selectedTemplate, 'PDF', { data: {} });
      if (result.success) {
        await loadData();
        setSelectedTemplate(null);
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async (options: any) => {
    setError('');
    try {
      await scheduleReport(options);
      setShowScheduleModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Schedule failed');
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport(id);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Delete failed');
    }
  };

  const handleExport = async (report: ReportData, format: 'PDF' | 'DOCX' | 'PNG') => {
    try {
      await exportReport(report.id, format);
    } catch (err: any) {
      setError(err?.message || 'Export failed');
    }
  };

  const stats = {
    total: reports.length,
    completed: reports.filter((r) => r.status === 'completed').length,
    failed: reports.filter((r) => r.status === 'failed').length,
    scheduled: schedules.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-text-muted">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#C108AB]" />
            Reports & Documents
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Generate, manage, and schedule professional reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </Button>
          <Button onClick={() => setActiveView('generate')}>
            <Plus className="w-4 h-4 mr-1" />
            New Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Total Reports" value={stats.total} color="#C108AB" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={stats.completed} color="#2D8A4E" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Failed" value={stats.failed} color="#C0392B" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Scheduled" value={stats.scheduled} color="#B8860B" />
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-border">
        {(['reports', 'generate', 'schedules'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === view
                ? 'text-[#C108AB] border-[#C108AB]'
                : 'text-text-muted border-transparent hover:text-text-primary'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {activeView === 'reports' && (
        <ReportList
          reports={reports}
          onView={(r) => { window.location.href = `/reports/${r.id}`; }}
          onEdit={(r) => { window.location.href = `/reports/${r.id}?mode=edit`; }}
          onDelete={handleDeleteReport}
          onExport={handleExport}
        />
      )}

      {activeView === 'generate' && (
        <div className="grid grid-cols-2 gap-6">
          <ReportTemplateSelector
            templates={templates}
            selectedId={selectedTemplate || undefined}
            onSelect={setSelectedTemplate}
          />

          <div className="bg-bg border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-5 h-5 text-[#C108AB]" />
              <h2 className="text-lg font-semibold text-text-primary">Generate Report</h2>
            </div>

            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="p-4 bg-bg-alt border border-border">
                  <p className="text-sm text-text-muted">Selected template:</p>
                  <p className="font-medium text-text-primary mt-1">
                    {templates.find((t) => t.id === selectedTemplate)?.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {templates.find((t) => t.id === selectedTemplate)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Output Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PDF', 'DOCX', 'PNG'] as const).map((fmt) => (
                      <div
                        key={fmt}
                        className="p-3 border border-border text-center bg-bg-alt"
                      >
                        <FileText className="w-5 h-5 mx-auto mb-1 text-[#C108AB]" />
                        <span className="text-sm font-medium text-text-primary">{fmt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleGenerate} disabled={generating} className="w-full">
                  {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center text-text-muted">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Select a template to begin</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'schedules' && (
        <div className="bg-bg border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Scheduled Reports</h2>
            <Button size="sm" onClick={() => setShowScheduleModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Schedule
            </Button>
          </div>
          {schedules.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No scheduled reports</p>
              <p className="text-xs mt-1">Create a schedule to automate report generation</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {schedules.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#C108AB]/10">
                      <Calendar className="w-5 h-5 text-[#C108AB]" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{s.templateName}</div>
                      <div className="text-xs text-text-muted">
                        {s.frequency} • Next: {new Date(s.nextRunAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant={s.status === 'scheduled' ? 'success' : 'default'}>
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showScheduleModal && (
        <ScheduleReportModal
          templates={templates}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleSchedule}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-bg border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="p-2" style={{ color }}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-text-primary">{value}</div>
          <div className="text-xs text-text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
