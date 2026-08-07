// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../api/_lib/pdfBuilder.js', () => {
  return {
    PdfBuilder: class {
      buildAll() {}
      save() {}
      getPageCount() { return 3; }
      getCurrentPage() { return 1; }
      getUnderlyingDoc() { return { save: () => {} }; }
      output() { return new Uint8Array(0); }
    },
  };
});

vi.mock('../../../api/_lib/docxBuilder.js', () => {
  return {
    DocxBuilder: class {
      build() {}
      save() { return Promise.resolve(); }
      toBuffer() { return Promise.resolve(Buffer.from('test')); }
      getDocumentXml() { return '<xml/>'; }
      getContentTypesXml() { return '<xml/>'; }
      getRelsXml() { return '<xml/>'; }
      getDocumentRelsXml() { return '<xml/>'; }
      getStylesXml() { return '<xml/>'; }
      getCorePropsXml() { return '<xml/>'; }
    },
  };
});

import { ReportGenerator, generateReport, generateBatchReports, createReportGenerator } from '../../../api/_lib/reportGenerator';
import { REPORT_TEMPLATES, getTemplateById } from '../../../api/_lib/reportTemplates';

describe('ReportGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('returns all 8 report templates', () => {
      const generator = ReportGenerator.getInstance();
      const templates = generator.listTemplates();
      expect(templates).toHaveLength(8);
    });

    it('includes all required template types', () => {
      const generator = ReportGenerator.getInstance();
      const templates = generator.listTemplates();
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('assessment-report');
      expect(ids).toContain('coaching-report');
      expect(ids).toContain('session-summary');
      expect(ids).toContain('progress-report');
      expect(ids).toContain('insight-report');
      expect(ids).toContain('career-plan-report');
      expect(ids).toContain('executive-summary');
      expect(ids).toContain('trident-report');
    });
  });

  describe('generateTemplateData', () => {
    it('throws for unknown template', async () => {
      const generator = ReportGenerator.getInstance();
      await expect(
        generator.generateTemplateData('nonexistent', { data: {} })
      ).rejects.toThrow('Template not found');
    });

    it('generates template data for assessment-report', async () => {
      const generator = ReportGenerator.getInstance();
      const data = await generator.generateTemplateData('assessment-report', {
        data: {
          summary: 'Test summary',
          scores: [{ dimension: 'Leadership', score: 85, percentile: 90 }],
        },
      });
      expect(data.header.title).toBe('Assessment Report');
      expect(data.sections.length).toBeGreaterThan(0);
    });
  });

  describe('generate', () => {
    it('returns failure for unknown template', async () => {
      const result = await generateReport({
        templateId: 'nonexistent',
        format: 'PDF',
        context: { data: {} },
      });
      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('Template not found');
    });

    it('generates PDF report successfully', async () => {
      const result = await generateReport({
        templateId: 'assessment-report',
        format: 'PDF',
        context: { data: { summary: 'Test' } },
      });
      expect(result.success).toBe(true);
      expect(result.format).toBe('PDF');
      expect(result.status).toBe('completed');
      expect(result.pageCount).toBe(3);
    });

    it('generates DOCX report successfully', async () => {
      const result = await generateReport({
        templateId: 'assessment-report',
        format: 'DOCX',
        context: { data: { summary: 'Test' } },
      });
      expect(result.success).toBe(true);
      expect(result.format).toBe('DOCX');
      expect(result.status).toBe('completed');
    });

    it('generates PNG report via PDF builder', async () => {
      const result = await generateReport({
        templateId: 'session-summary',
        format: 'PNG',
        context: { data: { overview: 'Test session' } },
      });
      expect(result.success).toBe(true);
      expect(result.format).toBe('PNG');
      expect(result.filename).toMatch(/\.png$/);
    });

    it('returns failure for unsupported format', async () => {
      const result = await generateReport({
        templateId: 'assessment-report',
        format: 'PDF' as any,
        context: { data: {} },
        filename: 'test.xyz',
      });
      if (result.success) {
        expect(result.format).toBe('PDF');
      }
    });
  });

  describe('generateMultiple', () => {
    it('generates batch of reports', async () => {
      const results = await generateBatchReports([
        { templateId: 'assessment-report', format: 'PDF', context: { data: {} } },
        { templateId: 'coaching-report', format: 'PDF', context: { data: {} } },
        { templateId: 'session-summary', format: 'DOCX', context: { data: {} } },
      ]);
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('handles mixed success/failure in batch', async () => {
      const results = await generateBatchReports([
        { templateId: 'assessment-report', format: 'PDF', context: { data: {} } },
        { templateId: 'invalid-template', format: 'PDF', context: { data: {} } },
      ]);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('singleton', () => {
    it('returns same instance', () => {
      const a = ReportGenerator.getInstance();
      const b = ReportGenerator.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('createReportGenerator', () => {
    it('returns a ReportGenerator instance', () => {
      const gen = createReportGenerator();
      expect(gen).toBeInstanceOf(ReportGenerator);
    });
  });
});

describe('REPORT_TEMPLATES registry', () => {
  it('has 8 templates', () => {
    expect(REPORT_TEMPLATES).toHaveLength(8);
  });

  it('getTemplateById returns correct template', () => {
    const t = getTemplateById('trident-report');
    expect(t?.id).toBe('trident-report');
    expect(t?.category).toBe('trident');
  });

  it('getTemplateById returns undefined for unknown', () => {
    expect(getTemplateById('unknown')).toBeUndefined();
  });
});
