import React from 'react';
import type { ExecutiveSummary as ExecSummaryType } from './types';
import {
  INK, OFF, G200, G400, G600, WHITE,
  monoStyle, containerStyle,
} from '../landing/shared';

interface Props {
  summary: ExecSummaryType;
  accent: string;
  revealClass: string;
  overallScore: number;
  assessmentName: string;
}

const toneColor = (tone: 'strength' | 'gap' | 'neutral', accent: string): string => {
  if (tone === 'strength') return '#00897B'; // LYC_SHARED_DS.success
  if (tone === 'gap') return accent;
  return G600;
};

/**
 * #1322 Assessment Results — Executive Summary block.
 *
 * Shown *immediately* after the hero score / archetype reveal, BEFORE the
 * full dimension scorecard. This gives the executive reader a 30-second
 * "what this means to me" takeaway before they invest the 2–3 minutes to
 * digest the full report. It's the narrative arc "pivot" between hero reveal
 * and deep dive.
 */
export function ExecutiveSummary({ summary, accent, revealClass, overallScore, assessmentName }: Props) {
  return (
    <section style={{ padding: '80px 0 48px', background: WHITE, borderBottom: `1px solid ${G200}` }}>
      <div style={containerStyle}>
        <div className={revealClass}>
          {/* ── Header label */}
          <div style={{
            ...monoStyle,
            color: accent,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 18,
            fontSize: 11,
          }}>
            Executive Summary · {assessmentName} · {summary.bracket}
          </div>

          {/* ── Headline + synopsis */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            gap: 48,
            alignItems: 'start',
          }}>
            <div>
              <h2 style={{
                fontFamily: "'Libre Baskerville', Georgia, serif",
                fontSize: 40,
                lineHeight: 1.15,
                color: INK,
                fontWeight: 700,
                margin: 0,
              }}>
                {summary.headline}
              </h2>
              <p style={{
                fontSize: 17,
                color: INK,
                lineHeight: 1.65,
                marginTop: 20,
                maxWidth: 640,
              }}>
                {summary.synopsis}
              </p>
            </div>

            {/* ── Score + bracket side card */}
            <aside style={{
              background: OFF,
              border: `1px solid ${G200}`,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <div style={{ ...monoStyle, color: G400, fontSize: 11 }}>
                OVERALL SCORE
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{
                  fontFamily: "'Libre Baskerville', Georgia, serif",
                  fontSize: 64,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: INK,
                }}>
                  {overallScore}
                </span>
                <span style={{ ...monoStyle, color: G600, fontSize: 12 }}>/ 100</span>
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: INK,
                padding: '6px 14px',
                border: `1px solid ${accent}`,
              }}>
                {summary.bracket}
              </div>
            </aside>
          </div>

          {/* ── 3 key takeaways (narrative bullets) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 28,
            marginTop: 56,
          }}>
            {summary.keyTakeaways.map((kt, i) => (
              <div key={i} style={{
                padding: '24px 24px 20px',
                border: `1px solid ${G200}`,
                background: '#fff',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -1,
                  left: 24,
                  right: 24,
                  height: 2,
                  background: toneColor(kt.tone, accent),
                }} />
                <div style={{
                  ...monoStyle,
                  color: toneColor(kt.tone, accent),
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {kt.tone === 'strength' ? 'Strength' : kt.tone === 'gap' ? 'Focus' : 'Note'}
                </div>
                <div style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: INK,
                  marginBottom: 6,
                }}>
                  {kt.label}
                </div>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: G600,
                }}>
                  {kt.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
