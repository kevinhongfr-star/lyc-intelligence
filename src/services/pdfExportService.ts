/**
 * T29 + T11: PDF Export Service
 * Server-side HTML → PDF generation via Puppeteer-edge;
 * Client-side fallback via jsPDF for simple reports.
 * T11: 3 brand presets (LYC, CO_BRANDED, WHITE_LABEL).
 */

import { REPORT_TOKENS, ReportBrandKey } from '@/styles/tokens';
import { generatePDF as clientPdf } from './reportGenerator';
import type { AssessmentType, AssessmentReport } from '@/types';

export interface PdfExportOptions {
  html?: string;
  template?: string;
  title?: string;
  brand: ReportBrandKey;
  paperSize?: 'A4' | 'Letter';
  includeWatermark?: boolean;
  /** client-side: reportGenerator uses jsPDF (fallback */
  assessmentType?: AssessmentType;
  assessmentResult?: { scores: Record<string, number>; archetype: string; percentile: Record<string, number> };
  assessmentReport?: AssessmentReport;
  userName?: string;
}

export interface PdfResult {
  ok: boolean;
  url?: string; // client blob URL or server filename
  sizeBytes?: number;
  warnings?: string[];
  filename: string;
}

/**
 * T11 PDF export — T11.3 brands.
 * Prefers server-side if window is undefined; client fallback otherwise.
 */
export async function exportToPdf(opts: PdfExportOptions): Promise<PdfResult> {
  const brand = REPORT_TOKENS.brands[opts.brand];
  const warnings: string[] = [];
  const filename = buildFilename(opts);

  // 1. client-side Assessment reports via reportGenerator path:
  if (opts.assessmentType && opts.assessmentResult && opts.assessmentReport) {
    try {
      await clientPdf(opts.assessmentType, opts.assessmentResult, opts.assessmentReport, opts.userName);
      return { ok: true, filename, warnings };
    } catch (e) {
      warnings.push(`client jsPDF failed: ${(e as Error).message}`);
    }
  }

  // 2. Server-side Puppeteer route (server-side/edge: api/_lib/documentGenerationHandler)
  if (opts.html || opts.template) {
    try {
      const res = await fetch('/api/documents/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: opts.html,
          template: opts.template,
          title: opts.title || filename,
          brand: opts.brand,
          paperSize: opts.paperSize || REPORT_TOKENS.paperSize,
          includeWatermark: opts.includeWatermark !== false,
          watermark: brand ? REPORT_TOKENS.watermark : '',
          footerText: brand.footerText,
          tagline: brand.tagline,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      triggerDownload(url, filename);
      return { ok: true, url, sizeBytes: blob.size, filename, warnings };
    } catch (e) {
      warnings.push(`server PDF route failed: ${(e as Error).message}; fallback to download html fallback`);
      // Last resort: HTML download as .html file
      if (opts.html) {
        const fallbackBlob = new Blob([opts.html], { type: 'text/html' });
        const url = URL.createObjectURL(fallbackBlob);
        triggerDownload(url, filename.replace('.pdf', '.html'));
        return { ok: true, url, filename: filename.replace('.pdf', '.html'), warnings };
      }
      return { ok: false, filename, warnings };
    }
  }

  return { ok: false, filename, warnings: ['No input HTML or assessment data provided.'].concat(warnings) };
}

function buildFilename(opts: PdfExportOptions): string {
  const brandPrefix = opts.brand === 'LYC' ? 'LYC' : opts.brand === 'CO_BRANDED' ? 'CoBranded' : 'Report';
  const date = new Date().toISOString().slice(0, 10);
  const titleSlug = (opts.title || 'Report').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
  return `${brandPrefix}_${titleSlug}_${date}.pdf`;
}

function triggerDownload(url: string, filename: string): void {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    window.open(url, '_blank', 'noopener');
  }
}

/**
 * T11: quick helpers · quick list brand profiles available.
 */
export const PDF_BRAND_PRESETS: { key: ReportBrandKey; label: string }[] = [
  { key: 'LYC', label: 'LYC Only' },
  { key: 'CO_BRANDED', label: 'Co-Branded' },
  { key: 'WHITE_LABEL', label: 'White Label (no LYC logo' },
];

export default {
  exportToPdf,
  PDF_BRAND_PRESETS,
};
