import {
  ReportTemplateData,
  ReportSection,
  ReportTable,
  ReportChart,
  ReportHeader,
  ReportFooter,
} from './reportTemplates';

export interface DocxBuildOptions {
  darkMode?: boolean;
  brandColor?: string;
}

const DEFAULT_BRAND = 'C108AB';

export class DocxBuilder {
  private opts: Required<DocxBuildOptions>;
  private parts: string[];

  constructor(opts?: DocxBuildOptions) {
    this.opts = {
      darkMode: opts?.darkMode ?? true,
      brandColor: opts?.brandColor ?? DEFAULT_BRAND,
    };
    this.parts = [];
  }

  private openXml(tag: string, attrs?: Record<string, string | number>): string {
    const attrStr = attrs
      ? Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ')
      : '';
    return `<${tag}${attrStr ? ' ' + attrStr : ''}>`;
  }

  private closeXml(tag: string): string {
    return `</${tag}>`;
  }

  private runText(text: string, opts?: { bold?: boolean; color?: string; size?: number; font?: string }): string {
    const runs: string[] = [];
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const rPr: string[] = [];
    if (opts?.bold) rPr.push(this.openXml('w:b') + this.closeXml('w:b'));
    if (opts?.color) rPr.push(this.openXml('w:color', { 'w:val': opts.color }) + this.closeXml('w:color'));
    if (opts?.size) rPr.push(this.openXml('w:sz', { 'w:val': opts.size }) + this.closeXml('w:sz'));
    if (opts?.font) rPr.push(this.openXml('w:rFonts', { 'w:ascii': opts.font, 'w:hAnsi': opts.font }) + this.closeXml('w:rFonts'));
    const rPrStr = rPr.length ? this.openXml('w:rPr') + rPr.join('') + this.closeXml('w:rPr') : '';
    runs.push(
      this.openXml('w:r') +
        rPrStr +
        this.openXml('w:t', { 'xml:space': 'preserve' }) +
        escaped +
        this.closeXml('w:t') +
        this.closeXml('w:r')
    );
    return runs.join('');
  }

  private paragraph(text: string, opts?: { bold?: boolean; color?: string; size?: number; align?: string; spacing?: number }): string {
    const pPr: string[] = [];
    if (opts?.align) {
      pPr.push(this.openXml('w:jc', { 'w:val': opts.align }) + this.closeXml('w:jc'));
    }
    if (opts?.spacing) {
      pPr.push(this.openXml('w:spacing', { 'w:line': opts.spacing, 'w:lineRule': 'auto' }) + this.closeXml('w:spacing'));
    }
    const pPrStr = pPr.length ? this.openXml('w:pPr') + pPr.join('') + this.closeXml('w:pPr') : '';
    return this.openXml('w:p') + pPrStr + this.runText(text, opts) + this.closeXml('w:p');
  }

  private buildHeaderXml(header: ReportHeader): string {
    const brandHex = this.opts.brandColor;
    const children: string[] = [];
    children.push(this.paragraph(header.title, { bold: true, color: brandHex, size: 36 }));
    if (header.subtitle) {
      children.push(this.paragraph(header.subtitle, { color: '888888', size: 24 }));
    }
    const metaParts: string[] = [];
    if (header.reportDate) metaParts.push(header.reportDate);
    if (header.classification) metaParts.push(header.classification.toUpperCase());
    if (metaParts.length) {
      children.push(this.paragraph(metaParts.join('  •  '), { color: '888888', size: 16, align: 'right' }));
    }
    children.push(this.openXml('w:p') + this.openXml('w:r') +
      this.openXml('w:pict') +
      '<v:shape style="width:540pt;height:1.5pt" filled="f" stroked="f">' +
      '<v:fill color="#' + brandHex + '" focid="0" />' +
      '</v:shape>' +
      this.closeXml('w:pict') + this.closeXml('w:r') + this.closeXml('w:p'));
    return children.join('');
  }

  private buildSectionXml(section: ReportSection): string {
    const children: string[] = [];
    children.push(this.paragraph(section.title, { bold: true, color: this.opts.brandColor, size: 28 }));
    children.push(this.paragraph(section.content, { size: 22 }));
    return children.join('');
  }

  private buildTableXml(table: ReportTable): string {
    const brandHex = this.opts.brandColor;
    const parts: string[] = [];

    parts.push(this.paragraph(table.title, { bold: true, color: brandHex, size: 24 }));

    const rows: string[] = [];

    const headerCells = table.headers.map((h) =>
      this.openXml('w:tc') +
        this.openXml('w:tcPr') +
          this.openXml('w:shd', { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': '1E1E1E' }) +
          this.closeXml('w:shd') +
        this.closeXml('w:tcPr') +
        this.paragraph(String(h), { bold: true, color: brandHex, size: 20 }) +
        this.closeXml('w:tc')
    );
    rows.push(this.openXml('w:tr') + headerCells.join('') + this.closeXml('w:tr'));

    table.rows.forEach((row, ri) => {
      const bgColor = ri % 2 === 0 ? '141414' : '191919';
      const cells = row.map((cell) =>
        this.openXml('w:tc') +
          this.openXml('w:tcPr') +
            this.openXml('w:shd', { 'w:val': 'clear', 'w:color': 'auto', 'w:fill': bgColor }) +
              this.closeXml('w:shd') +
          this.closeXml('w:tcPr') +
          this.paragraph(String(cell), { size: 20 }) +
          this.closeXml('w:tc')
      );
      rows.push(this.openXml('w:tr') + cells.join('') + this.closeXml('w:tr'));
    });

    const tableXml = this.openXml('w:tbl') +
      this.openXml('w:tblPr') +
        this.openXml('w:tblBorders') +
          '<w:top w:val="single" w:sz="4" w:space="0" w:color="' + brandHex + '" />' +
          '<w:left w:val="single" w:sz="4" w:space="0" w:color="' + brandHex + '" />' +
          '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="' + brandHex + '" />' +
          '<w:right w:val="single" w:sz="4" w:space="0" w:color="' + brandHex + '" />' +
          '<w:insideH w:val="single" w:sz="2" w:space="0" w:color="333333" />' +
          '<w:insideV w:val="single" w:sz="2" w:space="0" w:color="333333" />' +
        this.closeXml('w:tblBorders') +
      this.closeXml('w:tblPr') +
      rows.join('') +
      this.closeXml('w:tbl');

    parts.push(tableXml);
    return parts.join('');
  }

  private buildChartXml(chart: ReportChart): string {
    return this.paragraph(`[Chart: ${chart.title} — ${chart.type.toUpperCase()}]`, {
      color: '888888',
      size: 20,
      align: 'center',
    });
  }

  private buildFooterXml(footer: ReportFooter): string {
    const children: string[] = [];
    if (footer.text) {
      children.push(this.paragraph(footer.text, { color: '666666', size: 16 }));
    }
    if (footer.companyName) {
      children.push(this.paragraph(`© ${new Date().getFullYear()} ${footer.companyName}`, { color: '666666', size: 16 }));
    }
    return children.join('');
  }

  build(data: ReportTemplateData): void {
    const children: string[] = [];
    children.push(this.buildHeaderXml(data.header));
    for (const section of data.sections.sort((a, b) => a.order - b.order)) {
      children.push(this.buildSectionXml(section));
    }
    for (const table of data.tables) {
      children.push(this.buildTableXml(table));
    }
    for (const chart of data.charts) {
      children.push(this.buildChartXml(chart));
    }
    children.push(this.buildFooterXml(data.footer));
    this.parts = children;
  }

  getDocumentXml(): string {
    const color = this.opts.darkMode ? '0A0A0A' : 'FFFFFF';
    const textColor = this.opts.darkMode ? 'E0E0E0' : '1A1A1A';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
            mc:Ignorable="w14 wp14">
  <w:background w:color="${color}"/>
  <w:body>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:color w:val="${textColor}"/>
    </w:sectPr>
    ${this.parts.join('')}
  </w:body>
</w:document>`;
  }

  getContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
  }

  getRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;
  }

  getDocumentRelsXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  }

  getStylesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
  }

  getCorePropsXml(): string {
    const now = new Date().toISOString();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                    xmlns:dc="http://purl.org/dc/elements/1.1/"
                    xmlns:dcterms="http://purl.org/dc/terms/"
                    xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>LYC Intelligence</dc:creator>
  <cp:lastModifiedBy>LYC Intelligence</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
  }

  async save(filename: string): Promise<void> {
    const { createWriteStream } = await import('fs');
    const { createZipStream } = await import('./zipStreamHelper');
    const stream = createWriteStream(filename);
    const zip = createZipStream(stream);

    zip.add('[Content_Types].xml', this.getContentTypesXml());
    zip.add('_rels/.rels', this.getRelsXml());
    zip.add('word/document.xml', this.getDocumentXml());
    zip.add('word/_rels/document.xml.rels', this.getDocumentRelsXml());
    zip.add('word/styles.xml', this.getStylesXml());
    zip.add('docProps/core.xml', this.getCorePropsXml());

    zip.finalize();
    return new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  async toBuffer(): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const { Readable } = await import('stream');
    const { createZipStream } = await import('./zipStreamHelper');
    const bufferStream = new Readable();
    const zip = createZipStream(bufferStream as any);

    zip.add('[Content_Types].xml', this.getContentTypesXml());
    zip.add('_rels/.rels', this.getRelsXml());
    zip.add('word/document.xml', this.getDocumentXml());
    zip.add('word/_rels/document.xml.rels', this.getDocumentRelsXml());
    zip.add('word/styles.xml', this.getStylesXml());
    zip.add('docProps/core.xml', this.getCorePropsXml());

    bufferStream.push(null);
    zip.finalize();

    return new Promise<Buffer>((resolve) => {
      bufferStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      bufferStream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
