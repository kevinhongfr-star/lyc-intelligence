/**
 * components/report/ExportPdfButton.tsx — #89 Export PDF trigger button
 *
 * Wires the PdfReport ref + export service together.
 * P2-1: On click, first try the server /api/reports/pdf pipeline with a short
 * 2-second timeout. On success → opens the signed Storage URL in a new tab.
 * On ANY failure (501/4xx/5xx/timeout/network) → silent fallback to the
 * existing html2canvas + jsPDF client pipeline. Users get the same PDF they
 * would have gotten pre-P2-1, never an error.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { AssessmentResultData } from '@/types/reportTemplates';
import type { PdfPageSize } from './PdfReport';
import { PdfReport } from './PdfReport';
import { exportPdfWithErrorBoundary } from '@/services/pdfExport';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from '@/stores/toastStore';

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

  // P2-1 debounce: if the server pipeline failed once within a session, don't
  // re-try for 30 seconds — keeps the second click instant (no 2s wait
  // for nothing). Reset to zero on 30s timer.
  const [serverFailedUntil, setServerFailedUntil] = useState<number>(0);
  useEffect(() => {
    if (!serverFailedUntil) return;
    const ms = serverFailedUntil - Date.now();
    if (ms <= 0) return;
    const t = window.setTimeout(() => setServerFailedUntil(0), ms);
    return () => window.clearTimeout(t);
  }, [serverFailedUntil]);

  // We render the PdfReport off-screen while exporting. This way the button
  // itself can trigger capture even when no report preview is visible.
  const renderRef = useRef<HTMLDivElement | null>(null);

  const runClientPipeline = useCallback(async () => {
    setPhase('capture');
    setProgress(0);
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
  }, [data, pageSize]);

  const doExport = useCallback(async () => {
    setError(null);
    setExporting(true);
    setProgress(0);
    setPhase('capture');

    try {
      // Force a re-render of the report node to ensure it's attached to DOM
      // at capture time. Let browser settle layout (one frame).
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));

      // P2-1: server-first attempt (2s timeout). Skipped if server pipeline
      // already failed in the last 30 seconds.
      let serverSucceeded = false;
      if (Date.now() >= serverFailedUntil) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token || '';
          if (!accessToken) throw new Error('NO_TOKEN');

          const ctrl = new AbortController();
          const to = window.setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch('/api/reports/pdf', {
            method: 'POST',
            signal: ctrl.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              data,
              pageSize,
              response_mode: 'url',
            } satisfies {
              data: typeof data;
              pageSize: PdfPageSize;
              response_mode: 'url';
            }),
          });
          clearTimeout(to);
          const payload = await res.json().catch(() => ({} as any));
          if (res.ok && payload?.ok && typeof payload.download_url === 'string') {
            window.open(payload.download_url, '_blank', 'noopener');
            toast.success('Opening PDF in a new tab…');
            serverSucceeded = true;
          } else {
            // Server said 501/4xx/5xx: fall through to client pipeline.
            if (res.status === 401 || res.status === 403) {
              // Auth-level failures don't count as "server pipeline broken"
              // (may be transient — expired token, etc.).
              toast.info('Re-authenticating… using browser PDF export.');
            } else {
              setServerFailedUntil(Date.now() + 30_000);
              toast.info('Using browser PDF export.');
            }
          }
        } catch (_e: any) {
          // NetworkError / AbortError / JSON parse / NO_TOKEN
          setServerFailedUntil(Date.now() + 30_000);
          toast.info('Using browser PDF export.');
        }
      }

      if (!serverSucceeded) {
        // Client pipeline fallback — existing html2canvas + jsPDF flow.
        // Re-force layout settle since 2 seconds may have elapsed and the
        // hidden renderRef node could be detached.
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
        await runClientPipeline();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF export failed. Retry.');
    } finally {
      setExporting(false);
      setProgress(100);
    }
  }, [data, pageSize, serverFailedUntil, runClientPipeline]);

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
