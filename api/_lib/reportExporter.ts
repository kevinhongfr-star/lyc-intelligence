import { ReportGenerator, type GenerateReportOptions, type GenerateReportResult } from './reportGenerator';
import {
  type ReportFormat,
  type ReportStatus,
  type ReportTemplate,
  REPORT_TEMPLATES,
  getTemplateById,
} from './reportTemplates';

export interface ExportOptions {
  toEmail?: string[];
  emailSubject?: string;
  emailBody?: string;
  download?: boolean;
  shareLink?: boolean;
  shareExpiryDays?: number;
}

export interface BatchExportRequest {
  templateIds: string[];
  format: ReportFormat;
  context: Parameters<typeof ReportGenerator.getInstance extends () => infer T ? T['generate'] : never>[0] extends { context: infer C } ? C : never;
  exportOptions: ExportOptions;
}

export interface ExportResult {
  success: boolean;
  downloads: string[];
  emailsSent: string[];
  shareLinks: string[];
  errors: string[];
}

export class ReportExporter {
  private generator: ReportGenerator;

  constructor() {
    this.generator = ReportGenerator.getInstance();
  }

  async exportSingle(
    opts: GenerateReportOptions,
    exportOpts: ExportOptions
  ): Promise<ExportResult> {
    const result = await this.generator.generate(opts);
    const exportResult: ExportResult = {
      success: result.success,
      downloads: [],
      emailsSent: [],
      shareLinks: [],
      errors: [],
    };

    if (!result.success) {
      exportResult.errors.push(result.error || 'Generation failed');
      return exportResult;
    }

    if (exportOpts.download !== false) {
      exportResult.downloads.push(result.filename);
    }

    if (exportOpts.toEmail && exportOpts.toEmail.length > 0) {
      for (const recipient of exportOpts.toEmail) {
        try {
          await this.sendEmail(recipient, result, exportOpts);
          exportResult.emailsSent.push(recipient);
        } catch (err: any) {
          exportResult.errors.push(`Email to ${recipient}: ${err?.message}`);
        }
      }
    }

    if (exportOpts.shareLink) {
      try {
        const link = await this.createShareLink(result, exportOpts.shareExpiryDays || 7);
        exportResult.shareLinks.push(link);
      } catch (err: any) {
        exportResult.errors.push(`Share link: ${err?.message}`);
      }
    }

    return exportResult;
  }

  async exportBatch(
    templateIds: string[],
    format: ReportFormat,
    context: any,
    exportOpts: ExportOptions
  ): Promise<ExportResult> {
    const results: ExportResult = {
      success: true,
      downloads: [],
      emailsSent: [],
      shareLinks: [],
      errors: [],
    };

    const requests: GenerateReportOptions[] = templateIds.map((id) => ({
      templateId: id,
      format,
      context,
    }));

    const generateResults = await this.generator.generateMultiple(requests);

    for (let i = 0; i < generateResults.length; i++) {
      const result = generateResults[i];
      const templateId = templateIds[i];

      if (!result.success) {
        results.errors.push(`${templateId}: ${result.error}`);
        results.success = false;
        continue;
      }

      results.downloads.push(result.filename);

      if (exportOpts.toEmail && exportOpts.toEmail.length > 0) {
        for (const recipient of exportOpts.toEmail) {
          try {
            await this.sendEmail(recipient, result, exportOpts);
            results.emailsSent.push(`${templateId} -> ${recipient}`);
          } catch (err: any) {
            results.errors.push(`${templateId} email: ${err?.message}`);
          }
        }
      }

      if (exportOpts.shareLink) {
        try {
          const link = await this.createShareLink(result, exportOpts.shareExpiryDays || 7);
          results.shareLinks.push(`${templateId}: ${link}`);
        } catch (err: any) {
          results.errors.push(`${templateId} share: ${err?.message}`);
        }
      }
    }

    return results;
  }

  private async sendEmail(
    recipient: string,
    result: GenerateReportResult,
    opts: ExportOptions
  ): Promise<void> {
    console.log(`[ReportExporter] Sending ${result.filename} to ${recipient}`);
    const subject = opts.emailSubject || `LYC Intelligence Report — ${result.templateId}`;
    const body = opts.emailBody || `Please find attached your ${result.templateId} report.`;
    console.log(`[ReportExporter] Email queued: subject="${subject}", body="${body}"`);
  }

  private async createShareLink(
    result: GenerateReportResult,
    expiryDays: number
  ): Promise<string> {
    const token = Math.random().toString(36).slice(2, 15);
    const url = `https://lyc-intelligence.app/reports/share/${token}?expires=${expiryDays}d`;
    console.log(`[ReportExporter] Share link created: ${url}`);
    return url;
  }
}

export function createReportExporter(): ReportExporter {
  return new ReportExporter();
}

export async function exportReport(
  opts: GenerateReportOptions,
  exportOpts: ExportOptions
): Promise<ExportResult> {
  return createReportExporter().exportSingle(opts, exportOpts);
}

export async function batchExportReports(
  templateIds: string[],
  format: ReportFormat,
  context: any,
  exportOpts: ExportOptions
): Promise<ExportResult> {
  return createReportExporter().exportBatch(templateIds, format, context, exportOpts);
}
