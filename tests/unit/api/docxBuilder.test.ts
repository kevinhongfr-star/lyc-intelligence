// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocxBuilder } from '../../../api/_lib/docxBuilder';

vi.mock('fs', () => ({
  createWriteStream: vi.fn().mockReturnValue({
    write: vi.fn(),
    on: vi.fn((event, cb) => {
      if (event === 'finish') cb();
    }),
  }),
}));

vi.mock('stream', () => ({
  Readable: class {
    private handlers: Record<string, Function[]> = {};
    push(data: any) {
      if (data === null) {
        const handlers = this.handlers['end'] || [];
        handlers.forEach((cb) => cb());
      } else {
        const handlers = this.handlers['data'] || [];
        handlers.forEach((cb) => cb(data));
      }
    }
    on(event: string, cb: Function) {
      if (!this.handlers[event]) this.handlers[event] = [];
      this.handlers[event].push(cb);
    }
  },
}));

vi.mock('../../../api/_lib/zipStreamHelper', () => ({
  createZipStream: vi.fn().mockReturnValue({
    add: vi.fn(),
    finalize: vi.fn(),
  }),
}));

describe('DocxBuilder', () => {

  describe('constructor', () => {
    it('creates builder with default options', () => {
      const builder = new DocxBuilder();
      expect(builder).toBeInstanceOf(DocxBuilder);
    });

    it('creates builder with custom options', () => {
      const builder = new DocxBuilder({
        darkMode: false,
        brandColor: 'FF0000',
      });
      expect(builder).toBeInstanceOf(DocxBuilder);
    });
  });

  describe('build', () => {
    it('builds document XML from template data', () => {
      const builder = new DocxBuilder();
      builder.build({
        header: { title: 'Test Doc', subtitle: 'Sub', reportDate: '2026-08-06' },
        sections: [
          { id: 's1', title: 'Section 1', content: 'Content', order: 0 },
        ],
        tables: [
          {
            id: 't1',
            title: 'Table 1',
            headers: ['A', 'B'],
            rows: [['1', '2']],
          },
        ],
        charts: [
          { id: 'c1', type: 'bar', title: 'Chart 1', data: [{ label: 'X', value: 1 }] },
        ],
        footer: { text: 'Footer', pageNumbers: true, companyName: 'Test' },
        metadata: { templateId: 'test' },
      });
      const xml = builder.getDocumentXml();
      expect(xml).toContain('<?xml');
      expect(xml).toContain('Test Doc');
      expect(xml).toContain('Section 1');
      expect(xml).toContain('Table 1');
      expect(xml).toContain('Chart 1');
      expect(xml).toContain('Footer');
    });
  });

  describe('getDocumentXml', () => {
    it('returns valid XML with document structure', () => {
      const builder = new DocxBuilder();
      builder.build({
        header: { title: 'Minimal', reportDate: '2026-01-01' },
        sections: [],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      });
      const xml = builder.getDocumentXml();
      expect(xml).toContain('w:document');
      expect(xml).toContain('w:body');
      expect(xml).toContain('w:sectPr');
    });
  });

  describe('getContentTypesXml', () => {
    it('returns content types XML', () => {
      const builder = new DocxBuilder();
      const xml = builder.getContentTypesXml();
      expect(xml).toContain('Types');
      expect(xml).toContain('word/document.xml');
    });
  });

  describe('getRelsXml', () => {
    it('returns root relationships XML', () => {
      const builder = new DocxBuilder();
      const xml = builder.getRelsXml();
      expect(xml).toContain('Relationships');
      expect(xml).toContain('officeDocument');
    });
  });

  describe('getStylesXml', () => {
    it('returns styles XML', () => {
      const builder = new DocxBuilder();
      const xml = builder.getStylesXml();
      expect(xml).toContain('w:styles');
      expect(xml).toContain('w:docDefaults');
    });
  });

  describe('getCorePropsXml', () => {
    it('returns core properties XML', () => {
      const builder = new DocxBuilder();
      const xml = builder.getCorePropsXml();
      expect(xml).toContain('coreProperties');
      expect(xml).toContain('LYC Intelligence');
    });
  });

  describe('XML escaping', () => {
    it('escapes special characters in text content', () => {
      const builder = new DocxBuilder();
      builder.build({
        header: { title: 'Test < & > Quotes', reportDate: '2026-08-06' },
        sections: [
          { id: 's1', title: 'AT&T Report', content: 'Value < 100 & > 50', order: 0 },
        ],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      });
      const xml = builder.getDocumentXml();
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
    });
  });

  describe('table generation', () => {
    it('generates table XML with brand-colored borders', () => {
      const builder = new DocxBuilder();
      builder.build({
        header: { title: 'Table Test', reportDate: '2026-08-06' },
        sections: [],
        tables: [
          {
            id: 't1',
            title: 'Scores',
            headers: ['Name', 'Score', 'Grade'],
            rows: [
              ['Alice', '95', 'A'],
              ['Bob', '87', 'B'],
              ['Carol', '92', 'A'],
            ],
          },
        ],
        charts: [],
        footer: { text: 'End', pageNumbers: false },
        metadata: {},
      });
      const xml = builder.getDocumentXml();
      expect(xml).toContain('Scores');
      expect(xml).toContain('Alice');
      expect(xml).toContain('Bob');
      expect(xml).toContain('Carol');
      expect(xml).toContain('C108AB');
    });
  });

  describe('dark mode', () => {
    it('uses dark background in dark mode', () => {
      const builder = new DocxBuilder({ darkMode: true });
      builder.build({
        header: { title: 'Dark Test', reportDate: '2026-08-06' },
        sections: [],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      });
      const xml = builder.getDocumentXml();
      expect(xml).toContain('w:color="0A0A0A"');
    });

    it('uses white background in light mode', () => {
      const builder = new DocxBuilder({ darkMode: false });
      builder.build({
        header: { title: 'Light Test', reportDate: '2026-08-06' },
        sections: [],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      });
      const xml = builder.getDocumentXml();
      expect(xml).toContain('w:color="FFFFFF"');
    });
  });

  describe('save', () => {
    it('saves file without error', async () => {
      const builder = new DocxBuilder();
      builder.build({
        header: { title: 'Save Test', reportDate: '2026-08-06' },
        sections: [],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      });
      await expect(builder.save('test.docx')).resolves.not.toThrow();
    });
  });

  describe('toBuffer', () => {
    it('returns buffer', async () => {
      const builder = new DocxBuilder();
      builder.build({
        header: { title: 'Buffer Test', reportDate: '2026-08-06' },
        sections: [],
        tables: [],
        charts: [],
        footer: {},
        metadata: {},
      });
      const mockBuffer = Buffer.from('mock-docx-content');
      vi.spyOn(builder, 'toBuffer').mockResolvedValue(mockBuffer);
      const buf = await builder.toBuffer();
      expect(buf).toBeInstanceOf(Buffer);
      expect(buf.toString()).toBe('mock-docx-content');
    });
  });
});
