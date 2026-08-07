import { PdfBuilder } from './pdfBuilder';
import { DocxBuilder } from './docxBuilder';
import {
  REPORT_TEMPLATES,
  getTemplateById,
  type ReportFormat,
  type ReportStatus,
  type ReportTemplate,
  type ReportTemplateData,
  type ReportContext,
} from './reportTemplates';

export interface GenerateReportOptions {
  templateId: string;
  format: ReportFormat;
  context: ReportContext;
  filename?: string;
  pdfOptions?: {
    orientation?: 'portrait' | 'landscape';
    darkMode?: boolean;
  };
}

export interface GenerateReportResult {
  success: boolean;
  format: ReportFormat;
  templateId: string;
  filename: string;
  pageCount: number;
  status: ReportStatus;
  error?: string;
  data?: ReportTemplateData;
}

export class ReportGenerator {
  private static instance: ReportGenerator | null = null;

  static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator();
    }
    return ReportGenerator.instance;
  }

  listTemplates(): ReportTemplate[] {
    return REPORT_TEMPLATES;
  }

  async generateTemplateData(
    templateId: string,
    context: ReportContext
  ): Promise<ReportTemplateData> {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template.generate(context);
  }

  async generate(opts: GenerateReportOptions): Promise<GenerateReportResult> {
    const { templateId, format, context, pdfOptions } = opts;

    try {
      const template = getTemplateById(templateId);
      if (!template) {
        return {
          success: false,
          format,
          templateId,
          filename: '',
          pageCount: 0,
          status: 'failed',
          error: `Template not found: ${templateId}`,
        };
      }

      const data = await template.generate(context);
      const baseName = opts.filename || this.buildFilename(template, context);

      if (format === 'PDF') {
        const builder = new PdfBuilder({
          orientation: pdfOptions?.orientation || 'portrait',
          darkMode: pdfOptions?.darkMode ?? true,
        });
        builder.buildAll(data);
        builder.save(baseName);
        return {
          success: true,
          format,
          templateId,
          filename: baseName,
          pageCount: builder.getPageCount(),
          status: 'completed',
          data,
        };
      }

      if (format === 'DOCX') {
        const builder = new DocxBuilder();
        builder.build(data);
        await builder.save(baseName);
        return {
          success: true,
          format,
          templateId,
          filename: baseName,
          pageCount: 1,
          status: 'completed',
          data,
        };
      }

      if (format === 'PNG') {
        const builder = new PdfBuilder({
          orientation: pdfOptions?.orientation || 'portrait',
          darkMode: pdfOptions?.darkMode ?? true,
        });
        builder.buildAll(data);
        const pngName = baseName.replace(/\.(pdf|docx)$/i, '.png');
        const doc = builder.getUnderlyingDoc();
        doc.save(pngName);
        return {
          success: true,
          format,
          templateId,
          filename: pngName,
          pageCount: builder.getPageCount(),
          status: 'completed',
          data,
        };
      }

      return {
        success: false,
        format,
        templateId,
        filename: '',
        pageCount: 0,
        status: 'failed',
        error: `Unsupported format: ${format}`,
      };
    } catch (err: any) {
      return {
        success: false,
        format,
        templateId,
        filename: '',
        pageCount: 0,
        status: 'failed',
        error: err?.message || 'Unknown error',
      };
    }
  }

  async generateMultiple(
    requests: GenerateReportOptions[]
  ): Promise<GenerateReportResult[]> {
    return Promise.all(requests.map((r) => this.generate(r)));
  }

  private buildFilename(template: ReportTemplate, context: ReportContext): string {
    const parts = ['LYC', template.name.replace(/\s+/g, '_')];
    if (context.mandateId) parts.push(context.mandateId.slice(0, 8));
    if (context.candidateId) parts.push(context.candidateId.slice(0, 8));
    parts.push(new Date().toISOString().split('T')[0]);
    return `${parts.join('_')}.pdf`;
  }
}

export function createReportGenerator(): ReportGenerator {
  return ReportGenerator.getInstance();
}

export async function generateReport(
  opts: GenerateReportOptions
): Promise<GenerateReportResult> {
  return ReportGenerator.getInstance().generate(opts);
}

export async function generateBatchReports(
  requests: GenerateReportOptions[]
): Promise<GenerateReportResult[]> {
  return ReportGenerator.getInstance().generateMultiple(requests);
}
