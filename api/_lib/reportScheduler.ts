import {
  type ReportFormat,
  type ReportStatus,
  type ScheduleFrequency,
  type ReportContext,
} from './reportTemplates';
import { ReportGenerator, type GenerateReportResult } from './reportGenerator';
import { createReportExporter, type ExportOptions, type ExportResult } from './reportExporter';

export interface ScheduledReport {
  id: string;
  templateId: string;
  format: ReportFormat;
  frequency: ScheduleFrequency;
  context: ReportContext;
  exportOptions: ExportOptions;
  nextRunAt: string;
  lastRunAt?: string;
  status: ReportStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleOptions {
  templateId: string;
  format: ReportFormat;
  frequency: ScheduleFrequency;
  context: ReportContext;
  exportOptions?: ExportOptions;
  createdBy: string;
}

export interface ScheduleResult {
  success: boolean;
  scheduleId: string;
  nextRunAt: string;
  error?: string;
}

export interface RunResult {
  scheduleId: string;
  generationResult: GenerateReportResult;
  exportResult: ExportResult;
  ranAt: string;
}

const schedules: Map<string, ScheduledReport> = new Map();

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function computeNextRun(frequency: ScheduleFrequency, from: Date = new Date()): string {
  const next = new Date(from);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next.toISOString();
}

export class ReportScheduler {
  private generator: ReportGenerator;

  constructor() {
    this.generator = ReportGenerator.getInstance();
  }

  createSchedule(opts: ScheduleOptions): ScheduleResult {
    const id = uid();
    const now = new Date().toISOString();
    const nextRunAt = computeNextRun(opts.frequency);

    const schedule: ScheduledReport = {
      id,
      templateId: opts.templateId,
      format: opts.format,
      frequency: opts.frequency,
      context: opts.context,
      exportOptions: opts.exportOptions || {},
      nextRunAt,
      status: 'scheduled',
      createdBy: opts.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    schedules.set(id, schedule);

    return {
      success: true,
      scheduleId: id,
      nextRunAt,
    };
  }

  getSchedule(id: string): ScheduledReport | undefined {
    return schedules.get(id);
  }

  listSchedules(createdBy?: string): ScheduledReport[] {
    const all = Array.from(schedules.values());
    if (createdBy) {
      return all.filter((s) => s.createdBy === createdBy);
    }
    return all;
  }

  async runSchedule(id: string): Promise<RunResult | null> {
    const schedule = schedules.get(id);
    if (!schedule) return null;

    schedule.status = 'generating';
    schedule.updatedAt = new Date().toISOString();

    try {
      const genResult = await this.generator.generate({
        templateId: schedule.templateId,
        format: schedule.format,
        context: schedule.context,
      });

      const exporter = createReportExporter();
      const exportResult = await exporter.exportSingle(
        {
          templateId: schedule.templateId,
          format: schedule.format,
          context: schedule.context,
        },
        schedule.exportOptions
      );

      schedule.lastRunAt = new Date().toISOString();
      schedule.nextRunAt = computeNextRun(schedule.frequency);
      schedule.status = genResult.success ? 'scheduled' : 'failed';
      schedule.updatedAt = new Date().toISOString();

      return {
        scheduleId: id,
        generationResult: genResult,
        exportResult,
        ranAt: new Date().toISOString(),
      };
    } catch (err: any) {
      schedule.status = 'failed';
      schedule.updatedAt = new Date().toISOString();

      return {
        scheduleId: id,
        generationResult: {
          success: false,
          format: schedule.format,
          templateId: schedule.templateId,
          filename: '',
          pageCount: 0,
          status: 'failed' as ReportStatus,
          error: err?.message || 'Scheduler error',
        },
        exportResult: {
          success: false,
          downloads: [],
          emailsSent: [],
          shareLinks: [],
          errors: [err?.message || 'Scheduler error'],
        },
        ranAt: new Date().toISOString(),
      };
    }
  }

  async runDueSchedules(): Promise<RunResult[]> {
    const now = new Date();
    const dueSchedules = Array.from(schedules.values()).filter(
      (s) => s.status === 'scheduled' && new Date(s.nextRunAt) <= now
    );

    const results: RunResult[] = [];
    for (const schedule of dueSchedules) {
      const result = await this.runSchedule(schedule.id);
      if (result) results.push(result);
    }

    return results;
  }

  updateSchedule(id: string, updates: Partial<Pick<ScheduledReport, 'frequency' | 'exportOptions' | 'context'>>): ScheduleResult {
    const schedule = schedules.get(id);
    if (!schedule) {
      return {
        success: false,
        scheduleId: id,
        nextRunAt: '',
        error: 'Schedule not found',
      };
    }

    if (updates.frequency) {
      schedule.frequency = updates.frequency;
      schedule.nextRunAt = computeNextRun(updates.frequency);
    }
    if (updates.exportOptions) {
      schedule.exportOptions = updates.exportOptions;
    }
    if (updates.context) {
      schedule.context = updates.context;
    }
    schedule.updatedAt = new Date().toISOString();

    return {
      success: true,
      scheduleId: id,
      nextRunAt: schedule.nextRunAt,
    };
  }

  deleteSchedule(id: string): boolean {
    return schedules.delete(id);
  }

  pauseSchedule(id: string): boolean {
    const schedule = schedules.get(id);
    if (!schedule) return false;
    schedule.status = 'draft';
    schedule.updatedAt = new Date().toISOString();
    return true;
  }

  resumeSchedule(id: string): boolean {
    const schedule = schedules.get(id);
    if (!schedule) return false;
    schedule.status = 'scheduled';
    schedule.nextRunAt = computeNextRun(schedule.frequency);
    schedule.updatedAt = new Date().toISOString();
    return true;
  }
}

export function createReportScheduler(): ReportScheduler {
  return new ReportScheduler();
}

export function scheduleReport(opts: ScheduleOptions): ScheduleResult {
  return createReportScheduler().createSchedule(opts);
}

export function listScheduledReports(createdBy?: string): ScheduledReport[] {
  return createReportScheduler().listSchedules(createdBy);
}

export async function runDueSchedules(): Promise<RunResult[]> {
  return createReportScheduler().runDueSchedules();
}
