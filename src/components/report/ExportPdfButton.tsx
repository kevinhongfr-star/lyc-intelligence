/**
 * components/report/ExportPdfButton.tsx — #89 Export PDF trigger button
 *
 * Wires the PdfReport ref + export service together.
 * Shows in-line progress + error states. Intended to render below the result
 * share controls (web result layout ticket #62/#1343 uses it via renderReport).
 */

import React, { useCallback, useRef, useState } from 'react';
import type { AssessmentResultData } from '@/types/reportTemplates';
import type { PdfPageSize } from './PdfReport';
import { PdfReport } from './PdfReport';
import { exportPdfWithErrorBoundary } from '@/services/pdfExport';
import { cn } from '@/lib/utils';

export interface ExportPdfButtonProps {
  data: AssessmentResultData;
  defaultPageSize?: PdfPageSize;
  disabled?: boolean;
  className?: string;
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  data,
  defaultPageSize = 'a4',
  disabled = false,
  className,
}) => {
  const [pageSize, setPageSize] = useState<PdfPageSize>(defaultPageSize);
  const [isExporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'fonts' | 'capture' | 'write'>('capture');
  const [error, setError] = useState<string | null>(null);

  // We render the PdfReport off-screen while exporting. This way the button
  // itself can trigger capture even when no report preview is visible.
  const renderRef = useRef<HTMLDivElement | null>(null);

  const doExport = useCallback(async () => {
    setError(null);
    setExporting(true);
    setProgress(0);

    try {
      // Force a re-render of the report node to ensure it's attached to DOM
      // at capture time. Let browser settle layout (one frame).
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

      const node = renderRef.current;
      if (!node) {
        throw new Error('Report render node is not ready. Please retry.');
      }

      const res = await exportPdfWithErrorBoundary({
        reportNode: node,
        data,
        pageSize,
        onProgress: (ratio, ph) => {
          setProgress(Math.round(ratio * 100));
          setPhase(ph);
        },
      });
      if (!res.ok) throw res.error;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF export failed. Retry.');
    } finally {
      setExporting(false);
      setProgress(100);
    }
  }, [data, pageSize]);

  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      <div className="inline-flex items-stretch" role="group" aria-label="PDF export controls">
        <select
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value as PdfPageSize)}
          disabled={isExporting || disabled}
          aria-label="PDF page size"
          className="border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-700"
          style={{ borderRadius: 0 }}
        >
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>
        <button
          type="button"
          onClick={doExport}
          disabled={isExporting || disabled}
          aria-busy={isExporting}
          className="px-5 py-2 font-semibold text-white bg-[#C108AB] text-sm disabled:opacity-60"
          style={{ borderRadius: 0 }}
        >
          {isExporting ? (
            <span>
              Exporting… {progress}%{' '}
              <span className="font-mono opacity-70">({phase})</span>
            </span>
          ) : (
            <span>Export PDF</span>
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs font-mono text-red-700 bg-red-50 px-2 py-1 border border-red-200" style={{ borderRadius: 0 }}>
          {error}
        </p>
      )}

      {/* Off-screen render target — visible to html2canvas, out of viewport. */}
      <div aria-hidden={!isExporting} style={{ position: 'absolute', left: '-99999px', top: 0, width: pageSize === 'a4' ? '178mm' : '6.5in' }}>
        <PdfReport ref={renderRef} data={data} pageSize={pageSize} forPdfExport />
      </div>
    </div>
  );
};

export default ExportPdfButton;
