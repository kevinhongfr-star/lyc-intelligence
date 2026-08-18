/**
 * components/report/PdfReport.tsx — #89 Client-side printable PDF report
 *
 * Renders assessment result reports using #61's reportTokens.css classes.
 * Same component is rendered both:
 *   • on-screen (preview inside the modal)
 *   • when html2canvas + jsPDF capture it (via `forPdfExport=true` prop)
 *
 * Structure per #89 spec (6 pages/sections, page-break between each):
 *   1. Cover page — brand strip, diagnostic name + subtitle, score hero,
 *      recipient, confidentiality footer
 *   2. Executive summary — overall score/level, 1-paragraph key insight,
 *      3-top-dimension KPI grid
 *   3. Dimension breakdown — every dimension with score bar track + fill,
 *      dimension label + short insight. Tier redaction caps at 3 for EI.
 *   4. AI insights — section with strengths list + gaps list + recs list.
 *      EI tier shows only summary + 1 strength (tier redactions from #76).
 *   5. Archetype — matched archetype name + description + key traits bullet list
 *   6. NEXUS CTA — tier-appropriate block (EI = upgrade CTA, Pro+ = discuss)
 *
 * Zero border radius enforced by reportTokens.css.
 */

import React, { forwardRef } from 'react';
import type { AssessmentResultData } from '@/types/reportTemplates';
import { DIAGNOSTIC_ACCENTS, REPORT_LEVELS, scoreToReportLevel, CONFIDENTIALITY_STATEMENTS, reportShellClass } from '@/types/reportTokens';
import { cn } from '@/lib/utils';

export type PdfPageSize = 'a4' | 'letter';

export interface PdfReportProps {
  data: AssessmentResultData;
  pageSize?: PdfPageSize;
  /** Set true during the actual PDF snapshot so chrome/print helpers apply */
  forPdfExport?: boolean;
  /** Diagnostic accent override (falls back to slug lookup → canonical map) */
  accentOverride?: string;
}

/**
 * forwardRef so callers can pass a ref to the root element and use it
 * as the html2canvas source.
 */
export const PdfReport = forwardRef<HTMLDivElement, PdfReportProps>(function PdfReport(
  { data, pageSize = 'a4', forPdfExport = false, accentOverride },
  ref,
) {
  const slug = data.definition.assessment_id as keyof typeof DIAGNOSTIC_ACCENTS;
  const accent = accentOverride ?? DIAGNOSTIC_ACCENTS[slug]?.accent ?? '#C108AB';
  const accentCss = { ['--report-accent' as any]: accent };
  const lvl = scoreToReportLevel(data.result.overall_score ?? 0);

  return (
    <div
      ref={ref}
      className={cn(reportShellClass(slug, pageSize), forPdfExport && 'report-no-print-hide')}
      style={accentCss}
    >
      {/* ===== 1. COVER ===== */}
      <section className="report-cover" data-report-section="cover">
        <div className="report-brand-strip" aria-hidden="true" />
        <div className="pt-[18mm] flex flex-col justify-between h-[220mm]">
          <div>
            <p className="report-brand-mark tracking-[0.24em]">LYC PARTNERS — EXECUTIVE ASSESSMENT</p>
            <h1 className="report-h1 mt-4" style={{ color: accent, fontSize: 'var(--report-text-cover-h1)' }}>
              {data.definition.title}
            </h1>
            <p className="report-lead mt-2 text-[var(--report-text-secondary)]">
              {data.definition.subtitle}
            </p>
          </div>

          {/* Score hero */}
          <div className="my-16 flex gap-12 items-center">
            <div className="report-gauge-wrap" aria-hidden="false">
              <svg className="report-gauge-svg" viewBox="0 0 200 200">
                <circle className="report-gauge-track" cx="100" cy="100" r="82" />
                <circle
                  className="report-gauge-fill"
                  cx="100"
                  cy="100"
                  r="82"
                  strokeDasharray={`${Math.round(((data.result.overall_score ?? 0) / 100) * 2 * Math.PI * 82)} ${2 * Math.PI * 82}`}
                  strokeDashoffset={(2 * Math.PI * 82) / 4}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="report-gauge-value">{data.result.overall_score ?? '—'}</div>
              <div className="report-gauge-label" style={{ color: lvl.color }}>
                {lvl.label}
              </div>
            </div>
            <div className="flex-1">
              <p className="report-caption" style={{ color: lvl.color }}>
                {lvl.label} LEVEL
              </p>
              <p className="report-body mt-2 leading-relaxed max-w-[36ch]">
                {lvl.description}
              </p>
              <p className="report-mono mt-8 text-[var(--report-muted)]">
                {formatReportDate(data.result.completed_at)}
              </p>
            </div>
          </div>

          <div>
            <p className="report-h3 mb-1">Prepared for</p>
            <p className="report-h2">{data.recipient.name}</p>
            {data.recipient.email && (
              <p className="report-caption mt-1 text-[var(--report-muted)]">
                {data.recipient.email}
              </p>
            )}
          </div>
        </div>

        <div className="report-footer-row">
          <div className="report-footer-left">LYC PARTNERS</div>
          <div className="report-footer-center">CONFIDENTIAL</div>
          <div className="report-footer-right">{slug.toUpperCase()}</div>
        </div>
        <div className="mt-2 report-confidential">{CONFIDENTIALITY_STATEMENTS.standard}</div>
      </section>

      {/* ===== 2. EXECUTIVE SUMMARY ===== */}
      <section className="report-chapter" data-report-section="exec-summary">
        <p className="report-brand-mark tracking-[0.2em]">02 / EXECUTIVE SUMMARY</p>
        <hr className="report-rule-accent" />
        <h2 className="report-h1">Executive Summary</h2>

        <p className="report-lead mt-4">
          {data.aiInsights?.summary ??
            'Your report reflects a balanced profile with demonstrated strengths and targeted growth opportunities. Detailed dimension-level insights follow below.'}
        </p>

        {/* KPI grid 3-cols: overall + top dim + bottom dim */}
        <div className="report-kpi-grid mt-8">
          <div className="report-kpi">
            <span className="kpi-label">Overall Score</span>
            <span className="kpi-value">{data.result.overall_score ?? '—'}</span>
            <span className="kpi-sub" style={{ color: lvl.color }}>
              {lvl.label}
            </span>
          </div>
          {topNDimensions(data.dimensions, 1, 'desc').map((d) => (
            <div key={`top-${d.dimension_key}`} className="report-kpi">
              <span className="kpi-label">Top Dimension</span>
              <span className="kpi-value">{d.score}</span>
              <span className="kpi-sub">{d.dimension_name ?? d.dimension_key}</span>
            </div>
          ))}
          {topNDimensions(data.dimensions, 1, 'asc').map((d) => (
            <div key={`bot-${d.dimension_key}`} className="report-kpi">
              <span className="kpi-label">Focus Dimension</span>
              <span className="kpi-value">{d.score}</span>
              <span className="kpi-sub">{d.dimension_name ?? d.dimension_key}</span>
            </div>
          ))}
        </div>

        {data.aiInsights?.strengths?.[0] && (
          <div className="report-insight mt-8">
            <span className="report-insight-label">Key Insight — Top Strength</span>
            <p className="report-insight-body">{data.aiInsights.strengths[0]}</p>
          </div>
        )}
      </section>

      {/* ===== 3. DIMENSION BREAKDOWN ===== */}
      <section className="report-chapter" data-report-section="dimensions">
        <p className="report-brand-mark tracking-[0.2em]">03 / DIMENSION BREAKDOWN</p>
        <hr className="report-rule-accent" />
        <h2 className="report-h1">Dimension Breakdown</h2>
        <p className="report-caption mt-2 text-[var(--report-muted)]">
          {data.dimensions.length} of {data.definition.total_dimensions ?? 6} dimensions shown
          {data.viewerTier === 'executive_introduction' && ' — Executive Introduction preview'}
        </p>

        <div className="mt-6">
          {data.dimensions.map((d, i) => (
            <div
              key={d.dimension_key}
              className="report-card-alt mt-2 p-3"
              style={{ borderTop: `3px solid var(--report-dim-${(i % 6) + 1}, var(--report-accent))` }}
            >
              <div className="report-dim-row" style={{ borderBottom: 'none', padding: '8px 0' }}>
                <div className="report-dim-label font-[var(--report-font-display)] text-[var(--report-ink)]">
                  {i + 1}. {d.dimension_name ?? d.dimension_key}
                </div>
                <div className="report-dim-track">
                  <div
                    className="report-dim-fill"
                    style={
                      {
                        ['--dim-fill' as any]: `${Math.max(0, Math.min(100, d.score ?? 0))}%`,
                        background: `var(--report-accent)`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <div className="report-dim-score">{d.score ?? 0}</div>
              </div>
              {d.description && (
                <p className="mt-1 report-body text-[var(--report-text-secondary)] leading-snug pl-0">
                  {d.description}
                </p>
              )}
              <p className="mt-1 report-caption text-[var(--report-muted)]">
                LEVEL: {d.level ?? scoreToReportLevel(d.score ?? 0).label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 4. AI INSIGHTS ===== */}
      <section className="report-chapter" data-report-section="ai-insights">
        <p className="report-brand-mark tracking-[0.2em]">04 / INSIGHTS</p>
        <hr className="report-rule-accent" />
        <h2 className="report-h1">NEXUS Insights</h2>
        <p className="report-caption mt-2 text-[var(--report-muted)]">
          AI-generated summary of your assessment results.
          {data.viewerTier === 'executive_introduction' &&
            ' Executive Introduction — upgrade for the complete insights package.'}
        </p>

        {data.aiInsights?.summary && (
          <div className="report-insight mt-6">
            <span className="report-insight-label">Executive Narrative</span>
            <p className="report-insight-body">{data.aiInsights.summary}</p>
          </div>
        )}

        {data.aiInsights?.strengths && data.aiInsights.strengths.length > 0 && (
          <div className="mt-6">
            <h3 className="report-h3 text-[var(--report-accent-ink)]">Strengths</h3>
            <ul className="mt-3 pl-0 list-none">
              {data.aiInsights.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 py-2 border-b border-[var(--report-border-subtle)]">
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center report-mono text-[var(--report-on-accent)] bg-[var(--report-accent)]">
                    {i + 1}
                  </span>
                  <span className="report-body text-[var(--report-text)]">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.aiInsights?.growthAreas && data.aiInsights.growthAreas.length > 0 && (
          <div className="mt-6">
            <h3 className="report-h3 text-[var(--report-text-secondary)]">Growth Areas</h3>
            <ul className="mt-3 pl-0 list-none">
              {data.aiInsights.growthAreas.map((g, i) => (
                <li key={i} className="flex gap-3 py-2 border-b border-[var(--report-border-subtle)]">
                  <span className="shrink-0 w-6 h-6 flex items-center justify-center report-mono text-[var(--report-text-secondary)] border border-[var(--report-border-strong)]">
                    {i + 1}
                  </span>
                  <span className="report-body text-[var(--report-text)]">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.aiInsights?.nextSteps && data.aiInsights.nextSteps.length > 0 && (
          <div className="mt-6 report-card">
            <p className="report-insight-label mb-2">Recommended Next Steps</p>
            <ol className="pl-5 m-0">
              {data.aiInsights.nextSteps.map((step, i) => (
                <li key={i} className="report-body py-1 text-[var(--report-ink-soft)]">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* ===== 5. ARCHETYPE ===== */}
      {data.archetype && (
        <section className="report-chapter" data-report-section="archetype">
          <p className="report-brand-mark tracking-[0.2em]">05 / ARCHETYPE</p>
          <hr className="report-rule-accent" />
          <h2 className="report-h1">Your Archetype</h2>

          <div className="mt-6 report-card">
            <div className="flex items-center gap-6">
              <div
                aria-hidden="true"
                className="h-20 w-20 flex items-center justify-center font-[var(--report-font-display)] font-bold text-[26px] text-[var(--report-on-accent)] bg-[var(--report-accent)]"
              >
                {((data.archetype.canonName ?? data.archetype.name) || 'A').slice(0, 1)}
              </div>
              <div className="flex-1">
                <p className="report-caption text-[var(--report-accent-ink)]">
                  MATCHED ARCHETYPE
                </p>
                <h3 className="report-h2 mt-1 text-[var(--report-ink)]">{data.archetype.canonName ?? data.archetype.name}</h3>
                <p className="report-body mt-1 text-[var(--report-text-secondary)]">
                  {data.archetype.description}
                </p>
              </div>
            </div>

            {data.archetype.key_traits && data.archetype.key_traits.length > 0 && (
              <div className="mt-6 border-t border-[var(--report-border-subtle)] pt-4">
                <p className="report-h3 text-[var(--report-text-secondary)]">Key traits</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.archetype.key_traits.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 text-[11px] font-[var(--report-font-mono)] text-[var(--report-accent-ink)] bg-[var(--report-accent-5)] border border-[var(--report-accent-10)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== 6. NEXUS CTA ===== */}
      <section className="report-chapter" data-report-section="nexus">
        <p className="report-brand-mark tracking-[0.2em]">06 / NEXUS</p>
        <hr className="report-rule-accent" />

        {data.viewerTier === 'executive_introduction' ? (
          <div className="mt-6 report-card" style={{ borderTop: '4px solid var(--report-accent)' }}>
            <p className="report-insight-label">Upgrade to Professional</p>
            <h3 className="report-h2 mt-1 text-[var(--report-ink)]">
              Unlock all {data.definition.total_dimensions} dimensions and AI insights.
            </h3>
            <p className="report-body mt-2 text-[var(--report-text-secondary)] max-w-[52ch]">
              Your Executive Introduction report includes {data.dimensions.length} of {data.definition.total_dimensions} dimensions.
              Upgrade for full AI-generated insights, PDF export, and integrated coaching discussions with NEXUS.
            </p>
            <div className="mt-5 flex gap-3 items-center">
              <span
                aria-hidden="true"
                className="inline-flex px-4 py-2 text-sm font-medium text-[var(--report-on-accent)] bg-[var(--report-accent)]"
              >
                Upgrade to Professional
              </span>
              <span className="report-mono text-[var(--report-muted)]">
                See pricing on LYC Partners site
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 report-card">
            <p className="report-insight-label">Discuss with NEXUS</p>
            <h3 className="report-h2 mt-1 text-[var(--report-ink)]">
              Bring your report to a NEXUS conversation.
            </h3>
            <p className="report-body mt-2 text-[var(--report-text-secondary)] max-w-[52ch]">
              Ask NEXUS to unpack any dimension, role-play difficult conversations, or build a 30/60/90-day
              development plan from this result. Your assessment data is already contextually loaded.
            </p>
            <ul className="mt-4 list-none pl-0 grid grid-cols-1 gap-2 max-w-[52ch]">
              {[
                'Walk me through my biggest growth area with examples',
                'Role-play my next career conversation using this profile',
                'Create a 90-day development plan from my results',
              ].map((p, i) => (
                <li
                  key={i}
                  className="report-body p-3 pl-4 text-[var(--report-text)] bg-[var(--report-paper-alt)] border-l-2 border-[var(--report-accent)]"
                >
                  <span className="report-mono mr-3 text-[var(--report-accent-ink)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Final footer */}
      <div className="report-footer-row mt-16">
        <div className="report-footer-left">LYC PARTNERS © {new Date().getFullYear()}</div>
        <div className="report-footer-center">Generated {formatReportDate(data.result.completed_at)}</div>
        <div className="report-footer-right">{slug.toUpperCase()}-{String(data.result.result_id ?? '').slice(0, 6).toUpperCase()}</div>
      </div>
      <div className="mt-2 report-confidential">{CONFIDENTIALITY_STATEMENTS.forClient}</div>

      {/* Reference report levels definition to ensure they're used so colors ship */}
      <span aria-hidden="true" className="hidden">
        {REPORT_LEVELS.map((r) => r.level).join(',')}
      </span>
    </div>
  );
});

/* ── helpers ──────────────────────────────────────────────────────── */

function topNDimensions<T extends { score?: number; dimension_key: string; dimension_name?: string }>(
  dims: T[],
  n: number,
  order: 'asc' | 'desc',
): T[] {
  if (!dims || dims.length === 0) return [];
  const sorted = [...dims].sort(
    (a, b) => (order === 'desc' ? 1 : -1) * ((a.score ?? 0) - (b.score ?? 0)),
  );
  return sorted.slice(0, n);
}

function formatReportDate(iso?: string | null): string {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export default PdfReport;
