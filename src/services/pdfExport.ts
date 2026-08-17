/**
 * services/pdfExport.ts — #89 Client-side PDF export service
 *
 * Exports any rendered report DOM node to a multi-page A4/Letter PDF.
 * Uses:
 *   • html2canvas (raster each page into a crisp image at 2× scale)
 *   • jsPDF (already in project deps)
 *
 * Why html2canvas → jpg raster pipeline?
 *   • Google Fonts (System serif / DM Sans / IBM Plex Mono) need to be loaded
 *     before capture — we wait for `document.fonts.ready`.
 *   • html2canvas 1.x has good table + SVG gauge fidelity (PdfReport uses
 *     <svg>, not external chart libs).
 *   • jsPDF's native `.html()` renderer often falls over with CSS custom
 *     properties and layered CSS, so we drive the pipeline ourselves.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { PdfPageSize } from '@/components/report/PdfReport';
import type { AssessmentResultData } from '@/types/reportTemplates';

/** Physical page dimensions — mirror reportTokens.css .report-a4 / .report-letter.
 *  All mm values converted to PDF user units (1 pt = 1/72 in). Use jsPDF's mm unit. */
const PAGE_MM: Record<PdfPageSize, { w: number; h: number }> = {
  a4:     { w: 210, h: 297 },
  letter: { w: 215.9, h: 279.4 },
};

/** Per the spec #89. */
const PAGE_FILENAME_DATE = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};

export interface ExportAssessmentPdfOptions {
  /** DOM node returned from the PdfReport component's forwardRef */
  reportNode: HTMLElement;
  /** Result data — used for filename + accent */
  data: AssessmentResultData;
  pageSize?: PdfPageSize;
  /** Optional hook to show progress in UI (0–1) */
  onProgress?: (ratio: number, phase: 'fonts' | 'capture' | 'write') => void;
  /** Optional scale — 2x gives sharp 300dpi-equivalent text on A4 */
  scale?: number;
}

/**
 * Primary entry point — capture a rendered PdfReport and save the PDF file.
 *
 * Implementation notes:
 *   1. Ensure fonts are ready so all three brand fonts (system serif/DM Sans/IBM Plex Mono)
 *      render correctly in the raster and thus in the PDF.
 *   2. Split pages by `section[data-report-section]` children of the report node.
 *      Each chapter becomes one PDF page. If a section is taller than the page
 *      (edge case for very long dimension lists), it will page-break as
 *      html2canvas scales down using the page width.
 *   3. Compose into jsPDF using `.addImage()` with JPEG encoding — ~40% smaller
 *      output than PNG with imperceptible quality loss at scale=2.
 */
export async function exportAssessmentPdf({
  reportNode,
  data,
  pageSize = 'a4',
  onProgress,
  scale = 2,
}: ExportAssessmentPdfOptions): Promise<void> {
  onProgress?.(0.02, 'fonts');

  // 1. Wait for fonts so headings + body render with the correct typefaces.
  try {
    if (typeof document !== 'undefined' && 'fonts' in document && 'ready' in (document as any).fonts) {
      // Best-effort — don't hang if fonts promise doesn't settle within 3s.
      await Promise.race([(document as Document).fonts.ready, new Promise((r) => setTimeout(r, 3000))]);
    }
  } catch {
    /* ignore */
  }

  onProgress?.(0.1, 'capture');

  // 2. Collect page sections. Fallback: treat the entire node as one page if no sections.
  const sections = Array.from(
    reportNode.querySelectorAll<HTMLElement>('[data-report-section]'),
  );
  const pageSources: HTMLElement[] = sections.length ? sections : [reportNode];

  const { w: PAGE_W_MM, h: PAGE_H_MM } = PAGE_MM[pageSize];

  const pdf = new jsPDF({
    unit: 'mm',
    format: pageSize,
    orientation: 'portrait',
    compress: true,
  });

  const MARGIN_MM = 16; // matches reportTokens.css .report-a4 padding:16mm
  const CONTENT_W_MM = PAGE_W_MM - MARGIN_MM * 2;
  const CONTENT_H_MM = PAGE_H_MM - MARGIN_MM * 2;

  // 3. Capture each section → canvas → JPEG → PDF page.
  for (let i = 0; i < pageSources.length; i++) {
    if (i > 0) {
      pdf.addPage([PAGE_W_MM, PAGE_H_MM], 'portrait');
    }

    const section = pageSources[i];
    const canvas = await html2canvas(section, {
      scale,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: section.scrollWidth,
      windowHeight: section.scrollHeight,
    });

    // Convert canvas → JPEG data URL.
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Compute page-anchored draw region: scale image to CONTENT_W_MM,
    // preserve aspect ratio, center vertically if it fits on one page.
    const imgAspect = canvas.width / canvas.height;
    let drawW = CONTENT_W_MM;
    let drawH = drawW / imgAspect;

    // If the section image is taller than a page, shrink-fit to page height.
    // This rarely happens because PdfReport sections are designed to A4.
    if (drawH > CONTENT_H_MM) {
      drawH = CONTENT_H_MM;
      drawW = drawH * imgAspect;
    }

    const x = MARGIN_MM + (CONTENT_W_MM - drawW) / 2;
    const y = MARGIN_MM + (CONTENT_H_MM - drawH) / 2;

    pdf.addImage({
      imageData: dataUrl,
      format: 'JPEG',
      x,
      y,
      w: drawW,
      h: drawH,
      compression: 'FAST',
    });

    onProgress?.(
      0.1 + 0.8 * ((i + 1) / pageSources.length),
      'write',
    );
  }

  onProgress?.(0.95, 'write');

  // 4. Metadata — consistent across all diagnostic PDFs.
  pdf.setProperties({
    title: `LYC ${data.definition.title} — Assessment Report`,
    subject: `${data.definition.title} assessment results for ${data.recipient.name}`,
    author: 'LYC Partners — NEXUS',
    keywords: [
      'LYC',
      data.definition.assessment_id,
      data.definition.title,
      'assessment',
      'executive',
      'NEXUS',
    ].join(', '),
    creator: 'LYC Partners Report Engine (Batch 2 — #89)',
  });

  // 5. Save file — filename per #89: "LYC-{diagnostic}-Assessment-{date}.pdf"
  const slug = (data.definition.assessment_id || 'assessment').toUpperCase();
  const filename = `LYC-${slug}-Assessment-${PAGE_FILENAME_DATE()}.pdf`;
  pdf.save(filename);

  onProgress?.(1, 'write');
}

/**
 * Convenience hook-returnable action — returns { isExporting, error, trigger }
 * pattern for components that drive the export button. Keep it plain function
 * here; components wrap with useState/useCallback as needed.
 */
export async function exportPdfWithErrorBoundary(
  opts: ExportAssessmentPdfOptions,
): Promise<{ ok: true; filename: string } | { ok: false; error: Error }> {
  try {
    await exportAssessmentPdf(opts);
    const slug = (opts.data.definition.assessment_id || 'assessment').toUpperCase();
    return { ok: true, filename: `LYC-${slug}-Assessment-${PAGE_FILENAME_DATE()}.pdf` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
