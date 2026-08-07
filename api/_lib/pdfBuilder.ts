import { jsPDF } from 'jspdf';
import type {
  ReportTemplateData,
  ReportSection,
  ReportTable,
  ReportChart,
  ReportHeader,
  ReportFooter,
} from './reportTemplates';

const BRAND_COLOR = { r: 193, g: 8, b: 171 };
const DARK_BG = { r: 10, g: 10, b: 10 };
const LIGHT_TEXT = { r: 220, g: 220, b: 220 };
const MUTED_TEXT = { r: 136, g: 136, b: 136 };

export interface PdfBuildOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  unit?: 'mm' | 'pt';
  margin?: number;
  darkMode?: boolean;
}

const DEFAULT_OPTS: Required<PdfBuildOptions> = {
  orientation: 'portrait',
  format: 'a4',
  unit: 'mm',
  margin: 18,
  darkMode: true,
};

export class PdfBuilder {
  private doc: jsPDF;
  private width: number;
  private height: number;
  private y: number;
  private opts: Required<PdfBuildOptions>;
  private pageCount: number = 0;
  private currentPage: number = 1;

  constructor(opts?: PdfBuildOptions) {
    this.opts = { ...DEFAULT_OPTS, ...opts };
    this.doc = new jsPDF({
      orientation: this.opts.orientation,
      unit: this.opts.unit,
      format: this.opts.format,
    });
    this.width = this.doc.internal.pageSize.getWidth();
    this.height = this.doc.internal.pageSize.getHeight();
    this.y = this.opts.margin;
    this.setupPage();
  }

  private setupPage(): void {
    this.pageCount++;
    if (this.opts.darkMode) {
      this.doc.setFillColor(DARK_BG.r, DARK_BG.g, DARK_BG.b);
      this.doc.rect(0, 0, this.width, this.height, 'F');
    }
    this.y = this.opts.margin;
  }

  private ensureSpace(needed: number): void {
    if (this.y + needed > this.height - this.opts.margin) {
      this.doc.addPage();
      this.currentPage++;
      this.setupPage();
    }
  }

  private setBrandColor(): void {
    this.doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    this.doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  }

  private setLightText(): void {
    this.doc.setTextColor(LIGHT_TEXT.r, LIGHT_TEXT.g, LIGHT_TEXT.b);
  }

  private setMutedText(): void {
    this.doc.setTextColor(MUTED_TEXT.r, MUTED_TEXT.g, MUTED_TEXT.b);
  }

  buildHeader(header: ReportHeader): void {
    this.setBrandColor();
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.text(header.title, this.opts.margin, this.y + 10);
    this.y += 10;

    if (header.subtitle) {
      this.doc.setFontSize(10);
      this.setMutedText();
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(header.subtitle, this.opts.margin, this.y + 7);
      this.y += 7;
    }

    if (header.reportDate || header.classification) {
      this.doc.setFontSize(8);
      this.setMutedText();
      const parts: string[] = [];
      if (header.reportDate) parts.push(header.reportDate);
      if (header.classification) parts.push(header.classification.toUpperCase());
      this.doc.text(parts.join(' • '), this.width - this.opts.margin, this.y + 7, { align: 'right' });
      this.y += 7;
    }

    this.y += 5;
    this.doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    this.doc.rect(this.opts.margin, this.y, this.width - this.opts.margin * 2, 0.5, 'F');
    this.y += 10;
  }

  buildSection(section: ReportSection): void {
    const lines = this.doc.splitTextToSize(section.content, this.width - this.opts.margin * 2);
    const sectionHeight = 15 + lines.length * 5 + 5;
    this.ensureSpace(sectionHeight);

    this.setBrandColor();
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text(section.title, this.opts.margin, this.y);
    this.y += 7;

    this.setLightText();
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text(lines, this.opts.margin, this.y);
    this.y += lines.length * 5 + 8;
  }

  buildTable(table: ReportTable): void {
    const headerHeight = 10;
    const rowHeight = 7;
    const totalHeight = headerHeight + table.rows.length * rowHeight + 8;
    this.ensureSpace(totalHeight);

    this.setBrandColor();
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text(table.title, this.opts.margin, this.y);
    this.y += 6;

    const colWidth = (this.width - this.opts.margin * 2) / table.headers.length;
    const cellMargin = 2;

    this.doc.setFillColor(30, 30, 30);
    this.doc.rect(this.opts.margin, this.y, this.width - this.opts.margin * 2, headerHeight, 'F');

    this.setBrandColor();
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    table.headers.forEach((header, i) => {
      this.doc.text(String(header), this.opts.margin + i * colWidth + cellMargin, this.y + 6);
    });
    this.y += headerHeight;

    this.setLightText();
    this.doc.setFont('helvetica', 'normal');
    table.rows.forEach((row, ri) => {
      const rowBg = ri % 2 === 0 ? 20 : 25;
      this.doc.setFillColor(rowBg, rowBg, rowBg);
      this.doc.rect(this.opts.margin, this.y, this.width - this.opts.margin * 2, rowHeight, 'F');
      this.setLightText();
      row.forEach((cell, ci) => {
        this.doc.text(String(cell), this.opts.margin + ci * colWidth + cellMargin, this.y + 5);
      });
      this.y += rowHeight;
    });
    this.y += 8;
  }

  buildChart(chart: ReportChart): void {
    const chartHeight = 50;
    this.ensureSpace(chartHeight + 20);

    this.setBrandColor();
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text(chart.title, this.opts.margin, this.y);
    this.y += 6;

    const chartLeft = this.opts.margin;
    const chartTop = this.y;
    const chartWidth = this.width - this.opts.margin * 2;
    const chartH = chartHeight;

    this.doc.setFillColor(20, 20, 20);
    this.doc.rect(chartLeft, chartTop, chartWidth, chartH, 'F');

    this.doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);

    if (chart.type === 'bar' && Array.isArray(chart.data)) {
      const data = chart.data as Array<{ label: string; value: number }>;
      const barCount = data.length;
      const barWidth = (chartWidth - 10) / barCount - 2;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      data.forEach((d, i) => {
        const h = (d.value / maxVal) * (chartH - 15);
        const x = chartLeft + 5 + i * (barWidth + 2);
        const y = chartTop + chartH - 10 - h;
        this.doc.rect(x, y, barWidth, h, 'F');
        this.setMutedText();
        this.doc.setFontSize(7);
        this.doc.text(d.label, x + barWidth / 2, chartTop + chartH - 3, { align: 'center' });
        this.doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      });
    } else if (chart.type === 'line' && Array.isArray(chart.data)) {
      const data = chart.data as Array<{ label: string; value: number }>;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const points = data.map((d, i) => {
        const x = chartLeft + 5 + (i / (data.length - 1 || 1)) * (chartWidth - 10);
        const y = chartTop + chartH - 10 - (d.value / maxVal) * (chartH - 15);
        return { x, y };
      });
      this.doc.setDrawColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      this.doc.setLineWidth(0.5);
      for (let i = 0; i < points.length - 1; i++) {
        this.doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
      }
      this.doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      points.forEach((p) => {
        this.doc.circle(p.x, p.y, 1.5, 'F');
      });
    } else {
      this.setMutedText();
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.text(`[${chart.type.toUpperCase()} chart: ${chart.title}]`, chartLeft + chartWidth / 2, chartTop + chartH / 2, { align: 'center' });
    }

    this.y += chartH + 10;
  }

  buildFooter(footer: ReportFooter): void {
    if (footer.pageNumbers) {
      this.setMutedText();
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.text(`Page ${this.currentPage} / ${this.pageCount}`, this.width - this.opts.margin, this.height - 10, { align: 'right' });
    }
    if (footer.text) {
      this.setMutedText();
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.text(footer.text, this.opts.margin, this.height - 10);
    }
    if (footer.companyName) {
      this.setMutedText();
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.text(`© ${new Date().getFullYear()} ${footer.companyName}`, this.opts.margin, this.height - 5);
    }
  }

  buildAll(data: ReportTemplateData): void {
    this.buildHeader(data.header);
    for (const section of data.sections.sort((a, b) => a.order - b.order)) {
      this.buildSection(section);
    }
    for (const table of data.tables) {
      this.buildTable(table);
    }
    for (const chart of data.charts) {
      this.buildChart(chart);
    }
    this.buildFooter(data.footer);
  }

  getPageCount(): number {
    return this.pageCount;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  output(type: 'blob' | 'arraybuffer' | 'base64' = 'blob'): Blob | ArrayBuffer | string {
    switch (type) {
      case 'arraybuffer':
        return this.doc.output('arraybuffer');
      case 'base64':
        return this.doc.output('datauristring');
      default:
        return this.doc.output('blob');
    }
  }

  getUnderlyingDoc(): jsPDF {
    return this.doc;
  }
}
