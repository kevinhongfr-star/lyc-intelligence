import { authFetch } from '@/utils/authFetch';

const API_BASE = '/api';

export type ReportFormat = 'PDF' | 'DOCX' | 'PNG';
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'failed' | 'scheduled';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ReportTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ReportChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'radar' | 'gauge';
  title: string;
  data: Record<string, unknown>;
}

export interface ReportData {
  id: string;
  templateId: string;
  templateName: string;
  format: ReportFormat;
  status: ReportStatus;
  title: string;
  sections: ReportSection[];
  tables: ReportTable[];
  charts: ReportChart[];
  header: {
    title: string;
    subtitle?: string;
    reportDate?: string;
    classification?: string;
  };
  footer: {
    text?: string;
    pageNumbers?: boolean;
    companyName?: string;
  };
  downloadUrl?: string;
  shareUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ScheduleInfo {
  id: string;
  templateId: string;
  templateName: string;
  format: ReportFormat;
  frequency: ScheduleFrequency;
  nextRunAt: string;
  lastRunAt?: string;
  status: ReportStatus;
  createdBy: string;
  createdAt: string;
}

export interface ReportGenerationResult {
  success: boolean;
  reportId?: string;
  downloadUrl?: string;
  error?: string;
}

export interface ExportOptions {
  toEmail?: string[];
  emailSubject?: string;
  emailBody?: string;
  shareLink?: boolean;
  shareExpiryDays?: number;
}

export interface ScheduleOptions {
  templateId: string;
  format: ReportFormat;
  frequency: ScheduleFrequency;
  context: Record<string, unknown>;
  exportOptions?: ExportOptions;
}

export async function listReportTemplates(): Promise<ReportTemplateInfo[]> {
  try {
    const res = await authFetch(`${API_BASE}/reports/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return await res.json();
  } catch {
    return getMockTemplates();
  }
}

export async function generateReport(
  templateId: string,
  format: ReportFormat,
  context: Record<string, unknown>
): Promise<ReportGenerationResult> {
  try {
    const res = await authFetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, format, context }),
    });
    if (!res.ok) throw new Error('Failed to generate report');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getReport(reportId: string): Promise<ReportData | null> {
  try {
    const res = await authFetch(`${API_BASE}/reports/${reportId}`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return await res.json();
  } catch {
    return getMockReport(reportId);
  }
}

export async function listReports(filters?: {
  status?: ReportStatus;
  templateId?: string;
}): Promise<ReportData[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.templateId) params.set('templateId', filters.templateId);
    const res = await authFetch(`${API_BASE}/reports?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return await res.json();
  } catch {
    return getMockReports();
  }
}

export async function updateReport(
  reportId: string,
  updates: Partial<Pick<ReportData, 'sections' | 'title' | 'tables' | 'charts'>>
): Promise<ReportData | null> {
  try {
    const res = await authFetch(`${API_BASE}/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update report');
    return await res.json();
  } catch (err: any) {
    return null;
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/reports/${reportId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete report');
    return true;
  } catch {
    return false;
  }
}

export async function exportReport(
  reportId: string,
  format: ReportFormat,
  options?: ExportOptions
): Promise<{ success: boolean; downloadUrl?: string; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/reports/${reportId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format, ...options }),
    });
    if (!res.ok) throw new Error('Failed to export report');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function scheduleReport(options: ScheduleOptions): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  try {
    const res = await authFetch(`${API_BASE}/reports/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Failed to schedule report');
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function listSchedules(): Promise<ScheduleInfo[]> {
  try {
    const res = await authFetch(`${API_BASE}/reports/schedules`);
    if (!res.ok) throw new Error('Failed to fetch schedules');
    return await res.json();
  } catch {
    return [];
  }
}

export async function deleteSchedule(scheduleId: string): Promise<boolean> {
  try {
    const res = await authFetch(`${API_BASE}/reports/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete schedule');
    return true;
  } catch {
    return false;
  }
}

function getMockTemplates(): ReportTemplateInfo[] {
  return [
    { id: 'assessment-report', name: 'Assessment Report', description: 'Comprehensive assessment results', category: 'Assessment & Evaluation' },
    { id: 'coaching-report', name: 'Coaching Report', description: 'Coaching engagement summary', category: 'Coaching & Development' },
    { id: 'session-summary', name: 'Session Summary', description: 'Session highlights and action items', category: 'Session & Meeting' },
    { id: 'progress-report', name: 'Progress Report', description: 'Periodic progress tracking', category: 'Progress & Tracking' },
    { id: 'insight-report', name: 'Insight Report', description: 'Data-driven intelligence insights', category: 'Intelligence & Insights' },
    { id: 'career-plan-report', name: 'Career Plan Report', description: 'Individualized career development plan', category: 'Career Planning' },
    { id: 'executive-summary', name: 'Executive Summary', description: 'Concise executive brief', category: 'Executive Briefing' },
    { id: 'trident-report', name: 'Match Analysis Report', description: 'Three-dimensional scoring analysis', category: 'Match Analysis' },
  ];
}

function getMockReport(id: string): ReportData {
  return {
    id,
    templateId: 'assessment-report',
    templateName: 'Assessment Report',
    format: 'PDF',
    status: 'completed',
    title: 'Assessment Report',
    sections: [
      { id: 's1', title: 'Executive Summary', content: 'This is a mock assessment report with comprehensive evaluation results.', order: 0 },
      { id: 's2', title: 'Dimension Analysis', content: 'Analysis across leadership, capability, and cultural dimensions.', order: 1 },
      { id: 's3', title: 'Development Recommendations', content: 'Targeted recommendations for growth and development.', order: 2 },
    ],
    tables: [
      { id: 't1', title: 'Dimension Scores', headers: ['Dimension', 'Score', 'Percentile'], rows: [['Leadership', '85', '90'], ['Capability', '92', '95'], ['Culture', '78', '85']] },
    ],
    charts: [
      { id: 'c1', type: 'radar', title: 'Score Profile', data: { scores: [85, 92, 78] } },
    ],
    header: { title: 'Assessment Report', subtitle: 'Candidate Evaluation', reportDate: new Date().toISOString().split('T')[0], classification: 'confidential' },
    footer: { text: 'LYC Intelligence — Confidential', pageNumbers: true, companyName: 'LYC Partners' },
    downloadUrl: '#',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getMockReports(): ReportData[] {
  return [
    getMockReport('r1'),
    { ...getMockReport('r2'), templateId: 'trident-report', templateName: 'Match Analysis Report', title: 'Match Analysis Score Report' },
    { ...getMockReport('r3'), templateId: 'executive-summary', templateName: 'Executive Summary', title: 'Executive Briefing' },
  ];
}
