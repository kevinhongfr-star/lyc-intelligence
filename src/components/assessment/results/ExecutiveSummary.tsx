/**
 * ExecutiveSummary — above-the-fold verdict + key findings (P1 #1322).
 *
 * Gives an executive a 30-second grasp of the result before scrolling into
 * the dimension breakdown. When `config.executiveSummary` is not explicitly
 * provided, the summary is auto-derived from the score, archetype, and
 * dimension data so every instrument gets one without per-page wiring.
 */
import React from 'react';
import {
  INK, G200, G400, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import type { AssessmentResultsConfig, ExecutiveSummary as ExecSummaryData } from './types';

interface Props {
  config: AssessmentResultsConfig;
}

function getScoreBand(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'Established', color: '#2D7A3E' };
  if (score >= 50) return { label: 'Developing', color: '#C108AB' };
  if (score >= 35) return { label: 'Emerging', color: '#C97824' };
  return { label: 'Foundational', color: '#9CA3AF' };
}

/**
 * Auto-derive an executive summary when the instrument doesn't supply one.
 * Surfaces the top strength, the priority gap, and the archetype signature.
 */
export function deriveExecutiveSummary(config: AssessmentResultsConfig): ExecSummaryData {
  const { overallScore, archetype, dimensions } = config;
  const band = getScoreBand(overallScore);

  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const topStrength = sorted[0];
  const priorityGap = sorted[sorted.length - 1];

  const keyFindings = [
    {
      label: 'Top strength',
      text: topStrength
        ? `${topStrength.name} (${topStrength.score}/100) — ${topStrength.highLabel}.`
        : `${archetype.name} profile identified.`,
    },
    {
      label: 'Priority gap',
      text: priorityGap && priorityGap.score < overallScore
        ? `${priorityGap.name} (${priorityGap.score}/100) — ${priorityGap.lowLabel}. Primary development focus.`
        : 'No critical gaps — well-rounded executive profile.',
    },
    {
      label: 'Signature trait',
      text: `${archetype.name}: ${archetype.traits[0] || archetype.description.split('.')[0]}.`,
    },
  ];

  const verdict = `${band.label} profile — ${archetype.name} archetype with an overall score of ${overallScore}/100. ${
    priorityGap && priorityGap.score < 50
      ? `Development priority: ${priorityGap.name}.`
      : 'Strengths outweigh gaps.'
  }`;

  return { verdict, keyFindings };
}

export function ExecutiveSummary({ config }: Props) {
  const { accent, prefix, overallScore, executiveSummary } = config;
  const sectionLabel = makeSectionLabel(accent);
  const summary = executiveSummary || deriveExecutiveSummary(config);
  const band = getScoreBand(overallScore);

  return (
    <section style={{
      padding: '40px 0 80px',
      background: WHITE,
      borderBottom: `1px solid ${G200}`,
    }}>
      <div style={containerStyle}>
        {/* Verdict bar — the one-line "what this means" */}
        <div className={`${prefix}-reveal`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          padding: '28px 32px',
          background: '#FAFAFA',
          border: `1px solid ${G200}`,
          borderLeft: `4px solid ${band.color}`,
          marginBottom: '40px',
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{
              fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
              fontSize: 44, fontWeight: 700, lineHeight: 1,
              color: band.color,
            }}>
              {overallScore}
            </div>
            <div style={{ ...monoStyle, color: G400, marginTop: 4, fontSize: 9 }}>
              / 100
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...monoStyle, color: accent, fontSize: 9, marginBottom: 6, display: 'block' }}>
              Executive verdict
            </span>
            <p style={{
              fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
              fontSize: 20, fontWeight: 600, color: INK,
              lineHeight: 1.35, margin: 0,
            }}>
              {summary.verdict}
            </p>
          </div>
          <div style={{
            flexShrink: 0,
            padding: '6px 14px',
            background: band.color,
            color: WHITE,
          }}>
            <span style={{ ...monoStyle, fontSize: 9, fontWeight: 600 }}>
              {band.label}
            </span>
          </div>
        </div>

        {/* Key findings — 30-second grasp */}
        <div className={`${prefix}-reveal`}>
          <span style={sectionLabel}>Key findings</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 1,
            background: G200,
            border: `1px solid ${G200}`,
          }}>
            {summary.keyFindings.map((finding, i) => (
              <div key={i} style={{
                background: WHITE,
                padding: '28px 24px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                }}>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    fontSize: 10, color: G400, fontWeight: 500,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ ...monoStyle, color: accent, fontSize: 9 }}>
                    {finding.label}
                  </span>
                </div>
                <p style={{
                  fontSize: 14, color: G600, lineHeight: 1.55, margin: 0,
                }}>
                  {finding.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
