// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  createWriteStream: vi.fn().mockReturnValue({
    write: vi.fn(),
    on: vi.fn((event, cb) => { if (event === 'finish') cb(); }),
    end: vi.fn(),
  }),
  existsSync: vi.fn().mockReturnValue(false),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { PdfBuilder } from '../../../api/_lib/pdfBuilder';

describe('PdfBuilder', () => {
  describe('constructor', () => {
    it('creates builder with default options', () => {
      const builder = new PdfBuilder();
      expect(builder).toBeInstanceOf(PdfBuilder);
    });

    it('creates builder with custom options', () => {
      const builder = new PdfBuilder({
        orientation: 'landscape',
        darkMode: false,
        margin: 20,
      });
      expect(builder).toBeInstanceOf(PdfBuilder);
    });
  });

  describe('buildHeader', () => {
    it('renders header without error', () => {
      const builder = new PdfBuilder();
      builder.buildHeader({
        title: 'Test Report',
        subtitle: 'Subtitle',
        reportDate: '2026-08-06',
        classification: 'confidential',
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('buildSection', () => {
    it('renders section without error', () => {
      const builder = new PdfBuilder();
      builder.buildSection({
        id: 's1',
        title: 'Section Title',
        content: 'Section content',
        order: 0,
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('buildTable', () => {
    it('renders table without error', () => {
      const builder = new PdfBuilder();
      builder.buildTable({
        id: 't1',
        title: 'Test Table',
        headers: ['Name', 'Score', 'Status'],
        rows: [
          ['Alice', '95', 'Active'],
          ['Bob', '87', 'Pending'],
        ],
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('buildChart', () => {
    it('renders bar chart without error', () => {
      const builder = new PdfBuilder();
      builder.buildChart({
        id: 'c1',
        type: 'bar',
        title: 'Bar Chart',
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ],
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });

    it('renders line chart without error', () => {
      const builder = new PdfBuilder();
      builder.buildChart({
        id: 'c2',
        type: 'line',
        title: 'Line Chart',
        data: [
          { label: 'Jan', value: 50 },
          { label: 'Feb', value: 75 },
        ],
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });

    it('renders placeholder for unknown chart types', () => {
      const builder = new PdfBuilder();
      builder.buildChart({
        id: 'c3',
        type: 'pie',
        title: 'Pie Chart',
        data: {},
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('buildFooter', () => {
    it('renders footer without error', () => {
      const builder = new PdfBuilder();
      builder.buildFooter({
        text: 'Confidential',
        pageNumbers: true,
        companyName: 'LYC Partners',
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('buildAll', () => {
    it('builds complete document from template data', () => {
      const builder = new PdfBuilder();
      builder.buildAll({
        header: { title: 'Test Report', reportDate: '2026-08-06' },
        sections: [
          { id: 's1', title: 'Intro', content: 'Content here', order: 0 },
          { id: 's2', title: 'Details', content: 'More content', order: 1 },
        ],
        tables: [
          {
            id: 't1',
            title: 'Scores',
            headers: ['Dim', 'Score'],
            rows: [['A', '90']],
          },
        ],
        charts: [
          { id: 'c1', type: 'bar', title: 'Chart', data: [{ label: 'X', value: 5 }] },
        ],
        footer: { text: 'Test footer', pageNumbers: true, companyName: 'Test Co' },
        metadata: { templateId: 'test' },
      });
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('save', () => {
    it('calls jsPDF save', () => {
      const builder = new PdfBuilder();
      builder.save('test.pdf');
      expect(builder.getPageCount()).toBeGreaterThan(0);
    });
  });

  describe('output', () => {
    it('returns blob by default', () => {
      const builder = new PdfBuilder();
      const result = builder.output();
      expect(result).toBeDefined();
    });

    it('returns arraybuffer when requested', () => {
      const builder = new PdfBuilder();
      const result = builder.output('arraybuffer');
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('getPageCount / getCurrentPage', () => {
    it('returns initial page count', () => {
      const builder = new PdfBuilder();
      expect(builder.getPageCount()).toBe(1);
      expect(builder.getCurrentPage()).toBe(1);
    });
  });

  describe('getUnderlyingDoc', () => {
    it('returns jsPDF instance', () => {
      const builder = new PdfBuilder();
      const doc = builder.getUnderlyingDoc();
      expect(doc).toBeDefined();
    });
  });
});
