/**
 * components/report/WebResultPage.tsx — #62/#1343 Shared web result page wrapper.
 *
 * Renders all 6 diagnostics the same way (score hero → dimension breakdown →
 * AI insights → archetype → NEXUS CTA → share controls → PDF export).
 * Diagnostic-specific differentiation comes from the accent color CSS class
 * (which drives CSS variables) + the diagnostic name/subtitle/data.
 *
 * Tier redaction (#1343) is applied by the rendering pipeline BEFORE this
 * component receives data, so this component simply renders whatever it's
 * given and trusts the data shape.
 */

import React from 'react';
import type { AssessmentResultData } from '@/types/reportTemplates';
import { DIAGNOSTIC_ACCENTS, scoreToReportLevel, reportShellClass } from '@/types/reportTokens';
import { cn } from '@/lib/utils';
import { ExportPdfButton } from './ExportPdfButton';

export interface WebResultPageProps {
  data: AssessmentResultData;
  /** Passed through from template rendering pipeline (see #76) */
  ctaVariant?: string | null;
  /** Optional UI actions (share link / share email handlers injected by page) */
  actions?: {
    onShareLink?: () => void;
    onShareEmail?: () => void;
    onNexusDiscuss?: () => void;
  };
}

export const WebResultPage: React.FC<WebResultPageProps> = ({ data, ctaVariant, actions }) => {
  const slug = data.definition.assessment_id as keyof typeof DIAGNOSTIC_ACCENTS;
  const accent = DIAGNOSTIC_ACCENTS[slug]?.accent ?? '#C108AB';
  const overall = data.result.overall_score ?? 0;
  const lvl = scoreToReportLevel(overall);

  return (
    <div className={cn(reportShellClass(slug, 'a4'), 'bg-white')} style={{ ['--report-accent' as any]: accent, width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      {/* ── Score hero ─────────────────────────────────────────────── */}
      <header
        className="px-8 py-12"
        style={{ borderTop: '8px solid var(--report-accent)' }}
      >
        <p className="report-brand-mark tracking-[0.24em]">
          LYC PARTNERS · EXECUTIVE ASSESSMENT
        </p>
        <h1 className="report-h1 mt-4" style={{ color: 'var(--report-accent)' }}>
          {data.definition.title}
        </h1>
        <p className="report-lead mt-3 text-[var(--report-text-secondary)] max-w-[60ch]">
          {data.definition.subtitle}
        </p>

        <div className="mt-10 flex flex-col md:flex-row gap-10 items-center md:items-start">
          {/* Score gauge */}
          <div
            aria-label={`Overall score ${overall} — ${lvl.label}`}
            className="relative shrink-0"
          >
            <svg viewBox="0 0 220 220" width="220" height="220" className="block">
              <circle cx="110" cy="110" r="90" fill="none" stroke="var(--report-border-subtle)" strokeWidth="16" />
              <circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke="var(--report-accent)"
                strokeWidth="16"
                strokeDasharray={`${(overall / 100) * 2 * Math.PI * 90} ${2 * Math.PI * 90}`}
                strokeDashoffset={2 * Math.PI * 90 * 0.25}
                transform="rotate(-90 110 110)"
                strokeLinecap="butt"
              />
              <circle cx="110" cy="110" r="76" fill="#FFFFFF" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div style={{ fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif", fontSize: '72px', lineHeight: 1, color: 'var(--report-ink)' }}>
                {overall}
              </div>
              <div
                className="mt-1 px-3 py-1 text-xs font-semibold tracking-wider"
                style={{
                  color: lvl.color,
                  border: `1px solid ${lvl.color}22`,
                  background: `${lvl.color}0A`,
                }}
              >
                {lvl.label.toUpperCase()} LEVEL
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="report-h3 text-[var(--report-text-secondary)]">Prepared for</p>
            <h2 className="report-h2 mt-1">{data.recipient.name}</h2>
            {data.recipient.email && (
              <p className="report-mono mt-1 text-[var(--report-muted)]">
                {data.recipient.email}
              </p>
            )}

            <p className="report-body mt-6 max-w-[48ch] leading-relaxed">
              {data.aiInsights?.summary ?? lvl.description}
            </p>

            <div className="mt-6 flex gap-3 items-center flex-wrap">
              <span
                className="report-mono px-3 py-1 text-xs tracking-wider"
                style={{
                  background: 'var(--report-accent-5)',
                  color: 'var(--report-accent-ink)',
                  border: '1px solid var(--report-accent-10)',
                }}
              >
                TIER · {String(data.viewerTier ?? 'user').replace(/_/g, ' ').toUpperCase()}
              </span>
              {ctaVariant === 'executive_introduction_upgrade' && (
                <span className="report-mono px-3 py-1 text-xs tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  EXECUTIVE INTRODUCTION PREVIEW
                </span>
              )}
              <span className="report-caption text-[var(--report-muted)]">
                Completed {formatDate(data.result.completed_at)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Dimension breakdown ────────────────────────────────────── */}
      <section className="px-8 py-10 border-t border-stone-200">
        <p className="report-brand-mark tracking-[0.2em] text-[var(--report-muted)]">
          02 · DIMENSION BREAKDOWN
        </p>
        <hr className="report-rule-accent" />
        <h2 className="report-h1">Dimension Breakdown</h2>
        <p className="report-caption mt-2 text-[var(--report-muted)]">
          {data.dimensions.length} of {data.definition.total_dimensions ?? 6} dimensions
          {data.viewerTier === 'executive_introduction' && ' · Executive Introduction preview'}
        </p>

        <div className="mt-6 space-y-3">
          {data.dimensions.map((d, i) => (
            <div
              key={d.dimension_key}
              className="p-4"
              style={{
                background: i % 2 === 0 ? 'transparent' : 'var(--report-paper-alt)',
                borderLeft: `3px solid var(--report-accent)`,
              }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="report-h3 mb-1 text-[var(--report-ink)]">
                    {i + 1}. {d.dimension_name ?? d.dimension_key}
                  </p>
                  {d.description && (
                    <p className="report-body mt-1 text-[var(--report-text-secondary)] leading-snug max-w-[60ch]">
                      {d.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right w-[140px]">
                  <div className="report-mono text-2xl font-semibold text-[var(--report-ink)]">{d.score}</div>
                  <p className="report-caption mt-1" style={{ color: scoreToReportLevel(d.score ?? 0).color }}>
                    {d.level ?? scoreToReportLevel(d.score ?? 0).label}
                  </p>
                </div>
              </div>
              <div
                role="progressbar"
                aria-valuenow={d.score ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-3 h-2 bg-stone-200"
              >
                <div
                  className="h-2"
                  style={{
                    width: `${Math.max(0, Math.min(100, d.score ?? 0))}%`,
                    background: 'var(--report-accent)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Insights ────────────────────────────────────────────── */}
      <section className="px-8 py-10 border-t border-stone-200">
        <p className="report-brand-mark tracking-[0.2em] text-[var(--report-muted)]">
          03 · NEXUS INSIGHTS
        </p>
        <hr className="report-rule-accent" />
        <h2 className="report-h1">NEXUS Insights</h2>

        {data.aiInsights?.summary && (
          <div className="mt-6 report-insight">
            <span className="report-insight-label">Executive Narrative</span>
            <p className="report-insight-body">{data.aiInsights.summary}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {data.aiInsights?.strengths?.length ? (
            <div>
              <h3 className="report-h3 text-[var(--report-accent-ink)]">Strengths</h3>
              <ul className="mt-3 list-none pl-0 space-y-2">
                {data.aiInsights.strengths.map((s, i) => (
                  <li key={i} className="flex gap-3 p-3 bg-white border border-stone-200">
                    <span
                      aria-hidden="true"
                      className="shrink-0 w-7 h-7 flex items-center justify-center report-mono text-xs"
                      style={{ background: 'var(--report-accent)', color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                    <span className="report-body text-[var(--report-text)]">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.aiInsights?.growthAreas?.length ? (
            <div>
              <h3 className="report-h3 text-stone-700">Growth Areas</h3>
              <ul className="mt-3 list-none pl-0 space-y-2">
                {data.aiInsights.growthAreas.map((g, i) => (
                  <li key={i} className="flex gap-3 p-3 bg-stone-50 border border-stone-200">
                    <span
                      aria-hidden="true"
                      className="shrink-0 w-7 h-7 flex items-center justify-center report-mono text-xs text-stone-700 border border-stone-300"
                    >
                      {i + 1}
                    </span>
                    <span className="report-body text-[var(--report-text)]">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {data.aiInsights?.nextSteps?.length ? (
          <div className="mt-8 report-card">
            <p className="report-insight-label mb-2">Recommended Next Steps</p>
            <ol className="pl-5 m-0 space-y-1">
              {data.aiInsights.nextSteps.map((n, i) => (
                <li key={i} className="report-body text-[var(--report-ink-soft)] leading-relaxed">
                  {n}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      {/* ── Archetype ──────────────────────────────────────────────── */}
      {data.archetype && (
        <section className="px-8 py-10 border-t border-stone-200">
          <p className="report-brand-mark tracking-[0.2em] text-[var(--report-muted)]">
            04 · YOUR ARCHETYPE
          </p>
          <hr className="report-rule-accent" />
          <h2 className="report-h1">Your Archetype</h2>

          <div
            className="mt-6 flex gap-6 items-stretch p-6"
            style={{ background: 'var(--report-paper-alt)', border: '1px solid var(--report-border-subtle)' }}
          >
            <div
              aria-hidden="true"
              className="shrink-0 w-24 h-24 flex items-center justify-center font-[var(--report-font-display)] font-bold text-3xl text-white"
              style={{ background: 'var(--report-accent)' }}
            >
              {(data.archetype.name || 'A').slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="report-caption tracking-widest" style={{ color: 'var(--report-accent-ink)' }}>
                MATCHED ARCHETYPE
              </p>
              <h3 className="report-h2 mt-1 text-[var(--report-ink)]">{data.archetype.name}</h3>
              <p className="report-body mt-2 text-[var(--report-text-secondary)] leading-relaxed">
                {data.archetype.description}
              </p>
              {data.archetype.key_traits?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.archetype.key_traits.map((t) => (
                    <span
                      key={t}
                      className="report-mono text-[11px] px-3 py-1"
                      style={{
                        color: 'var(--report-accent-ink)',
                        background: 'var(--report-accent-5)',
                        border: '1px solid var(--report-accent-10)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      {/* ── NEXUS CTA ──────────────────────────────────────────────── */}
      <section className="px-8 py-10 border-t border-stone-200">
        <p className="report-brand-mark tracking-[0.2em] text-[var(--report-muted)]">
          05 · NEXT STEPS WITH NEXUS
        </p>
        <hr className="report-rule-accent" />

        {ctaVariant === 'executive_introduction_upgrade' || data.viewerTier === 'executive_introduction' ? (
          <div
            className="mt-6 p-8"
            style={{
              border: '1px solid var(--report-border-subtle)',
              background: `linear-gradient(180deg, var(--report-accent-5) 0%, #FFFFFF 100%)`,
              borderTop: `4px solid var(--report-accent)`,
            }}
          >
            <p className="report-insight-label">Unlock the complete report</p>
            <h3 className="report-h2 mt-1 text-[var(--report-ink)]">
              Upgrade to Professional for all {data.definition.total_dimensions} dimensions and full AI insights.
            </h3>
            <p className="report-body mt-3 text-[var(--report-text-secondary)] max-w-[60ch]">
              Your Executive Introduction report includes {data.dimensions.length} of {data.definition.total_dimensions} dimensions
              plus a truncated NEXUS summary. Upgrade to Professional for full AI-generated insights,
              branded PDF export, and one-on-one coaching discussions with NEXUS.
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                type="button"
                className="px-6 py-3 font-semibold text-white"
                style={{ background: 'var(--report-accent)' }}
                data-cta-variant="executive_introduction_upgrade"
              >
                Upgrade to Professional
              </button>
              <button
                type="button"
                onClick={actions?.onShareLink}
                className="px-6 py-3 font-semibold text-[var(--report-ink)] bg-white border border-stone-300"
              >
                Share this preview
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mt-6 p-8"
            style={{
              border: '1px solid var(--report-border-subtle)',
              background: 'var(--report-paper-alt)',
            }}
          >
            <p className="report-insight-label">Discuss with NEXUS</p>
            <h3 className="report-h2 mt-1 text-[var(--report-ink)]">
              Bring your report to a NEXUS conversation.
            </h3>
            <p className="report-body mt-3 text-[var(--report-text-secondary)] max-w-[60ch]">
              Ask NEXUS to unpack any dimension, role-play difficult conversations, or build a
              30/60/90-day development plan from this result. Your assessment data is already
              contextually loaded.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={actions?.onNexusDiscuss}
                className="px-6 py-3 font-semibold text-white"
                style={{ background: 'var(--report-accent)' }}
              >
                Discuss with NEXUS · 1 mile
              </button>
            </div>
            <ul className="mt-6 list-none pl-0 space-y-2 max-w-[60ch]">
              {[
                'Walk me through my biggest growth area with examples',
                'Role-play my next career conversation using this profile',
                'Create a 90-day development plan from my results',
              ].map((p, i) => (
                <li
                  key={i}
                  className="report-body p-3"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--report-border-subtle)',
                    borderLeft: `3px solid var(--report-accent)`,
                  }}
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

      {/* ── Share + Export controls ────────────────────────────────── */}
      <section className="px-8 py-10 border-t border-stone-200">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h3 className="report-h2 text-[var(--report-ink)]">Share & export</h3>
            <p className="report-caption mt-1 text-[var(--report-muted)]">
              Save a PDF for your records or share this result with stakeholders.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={actions?.onShareLink}
              className="px-5 py-2 font-semibold text-[var(--report-ink)] bg-white border border-stone-300 text-sm"
            >
              Copy share link
            </button>
            <button
              type="button"
              onClick={actions?.onShareEmail}
              className="px-5 py-2 font-semibold text-[var(--report-ink)] bg-white border border-stone-300 text-sm"
            >
              Send by email
            </button>
            <ExportPdfButton data={data} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-10 border-t border-stone-200 bg-stone-50">
        <div className="flex justify-between items-start gap-8 flex-wrap">
          <div>
            <p className="report-brand-mark tracking-[0.24em]">LYC PARTNERS</p>
            <p className="report-caption mt-3 text-[var(--report-muted)] max-w-[44ch]">
              Executive assessments powered by NEXUS. Every report is generated from responses you submit
              and reviewed by NEXUS against LYC Partners brand voice guardrails.
            </p>
          </div>
          <div className="text-right">
            <p className="report-caption text-[var(--report-muted)]">
              Generated {formatDate(data.result.completed_at)}
            </p>
            <p className="report-mono mt-1 text-xs" style={{ color: 'var(--report-muted)' }}>
              {slug.toUpperCase()} · {String(data.result.result_id ?? '').slice(0, 6).toUpperCase()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function formatDate(iso?: string | null): string {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

export default WebResultPage;
