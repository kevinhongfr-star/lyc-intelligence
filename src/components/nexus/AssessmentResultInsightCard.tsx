/**
 * #1324: AssessmentResultInsightCard.tsx
 *
 * In-stream NEXUS card that "explains" a user's completed assessment result —
 *   1. Headline + bracket
 *   2. Dimension score strip (top strengths + gaps)
 *   3. Synthesized 90-day plan (30/60/90 windows, progressive)
 *   4. Deep link to the canonical full results page
 *
 * Rendered from NexusChat when:
 *   (a) intent detection sees a result query, OR
 *   (b) the AI response tags itself as `type: 'result_explanation'`
 *
 * Brand rules: zero radius, accent stroke, Libre Baskerville / DM Sans /
 * IBM Plex Mono font trio, currency = miles (never "free").
 */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, TrendingDown, Target, Calendar,
  Sparkles, ChevronDown, ChevronUp, BarChart3,
} from 'lucide-react';
import type {
  UserAssessmentSummary,
  Nexus90DayPlan,
} from '@/services/assessmentResultService';
import {
  synthesizeExecutiveSummary,
  synthesize90DayPlan,
  scoreToBracket,
} from '@/services/assessmentResultService';
import { NEXUS_ASSESSMENT_KB } from '@/nexus/nexusKnowledge';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accentSoft: (accent: string) => `${accent}14`,
  border: '#E9E7E1',
  ink: '#0A0A12',
  muted: '#616170',
  off: '#FAFAF8',
  radius: '0px',
};

export interface AssessmentResultInsightCardProps {
  summary: UserAssessmentSummary;
  /** Optional mode: 'summary' (default) | 'plan' (emphasize the 90-day plan) */
  mode?: 'summary' | 'plan';
  /** Pass through a pre-fetched plan to avoid recomputation */
  plan?: Nexus90DayPlan;
  onDeepDive?: () => void;
}

export function AssessmentResultInsightCard({
  summary,
  mode = 'summary',
  plan: planOverride,
  onDeepDive,
}: AssessmentResultInsightCardProps) {
  const navigate = useNavigate();
  const [planOpen, setPlanOpen] = useState(mode === 'plan');
  const accent = summary.accent;

  const execSummary = useMemo(
    () => synthesizeExecutiveSummary(summary),
    [summary],
  );
  const plan = useMemo(
    () => planOverride || synthesize90DayPlan(summary),
    [planOverride, summary],
  );

  const kb = NEXUS_ASSESSMENT_KB[summary.instrumentCode];
  const resultsUrl =
    summary.instrumentCode === 'CPI'
      ? '/assessment/cpi'
      : `/assessment/${summary.instrumentCode.toLowerCase()}`;

  const dateLabel = summary.completedAt
    ? new Date(summary.completedAt).toLocaleDateString('en-SG', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : null;

  const toneColor = (tone: 'strength' | 'gap' | 'neutral', fallback: string) => {
    if (tone === 'strength') return '#047857';
    if (tone === 'gap') return fallback;
    return DS.muted;
  };

  return (
    <div
      role="region"
      aria-label={`${summary.instrumentName} — result explanation`}
      style={{
        position: 'relative',
        marginTop: 10,
        marginBottom: 6,
        marginLeft: 2,
        maxWidth: 600,
        background: '#FFF',
        border: `2px solid ${accent}`,
        borderRadius: DS.radius,
        boxShadow: `0 0 0 1px ${accent}14, 0 16px 40px ${accent}12`,
      }}
    >
      {/* Eyebrow strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 14px',
          background: DS.accentSoft(accent),
          borderBottom: `1px solid ${accent}40`,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 style={{ width: 12, height: 12, color: accent }} />
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 700,
            }}
          >
            {summary.instrumentCode} · Your results · {summary.bracket}
          </span>
        </div>
        {dateLabel && (
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.1em',
              color: DS.muted,
            }}
          >
            COMPLETED {dateLabel}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '18px 18px 16px' }}>
        {/* Score row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <h4
              style={{
                fontFamily: DS.headingFont,
                fontSize: 18,
                margin: 0,
                color: DS.ink,
                lineHeight: 1.2,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {execSummary.headline}
            </h4>
            {summary.archetype && (
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10.5,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: accent,
                  marginBottom: 8,
                }}
              >
                Archetype · {summary.archetype}
              </div>
            )}
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 13,
                color: DS.muted,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {execSummary.synopsis.length > 220
                ? `${execSummary.synopsis.slice(0, 220)}…`
                : execSummary.synopsis}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                letterSpacing: '0.12em',
                color: DS.muted,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Overall
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 44,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: DS.ink,
                }}
              >
                {summary.overallScore}
              </span>
              <span
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 12,
                  color: DS.muted,
                }}
              >
                / 100
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: '4px 10px',
                border: `1px solid ${accent}`,
                color: accent,
                fontFamily: DS.bodyFont,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {summary.bracket}
            </div>
          </div>
        </div>

        {/* Dimension strip */}
        {(summary.topStrengths.length > 0 || summary.topGaps.length > 0) && (
          <div
            style={{
              marginTop: 14,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {summary.topStrengths.length > 0 && (
              <DimensionBlock
                accent={accent}
                icon={TrendingUp}
                tone="strength"
                title="Strengths"
                items={summary.topStrengths}
              />
            )}
            {summary.topGaps.length > 0 && (
              <DimensionBlock
                accent={accent}
                icon={TrendingDown}
                tone="gap"
                title="Focus areas"
                items={summary.topGaps}
              />
            )}
          </div>
        )}

        {/* Cross-border callout */}
        {typeof summary.crossBorderScore === 'number' && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              background: DS.off,
              border: `1px solid ${DS.border}`,
              borderLeft: `3px solid ${accent}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: accent,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Target style={{ width: 11, height: 11 }} /> Cross-border Adaptability
              </div>
              <div
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 18,
                  fontWeight: 700,
                  color: DS.ink,
                }}
              >
                {summary.crossBorderScore}
                <span style={{ fontSize: 12, color: DS.muted, fontFamily: DS.monoFont }}>
                  /100 · {scoreToBracket(summary.crossBorderScore)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Key takeaways (narrative, 3 bullets) */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles style={{ width: 11, height: 11 }} /> 3 takeaways
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {execSummary.keyTakeaways.map((kt, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background: '#FFF',
                  border: `1px solid ${DS.border}`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -1, left: 12, right: 12, height: 2,
                    background: toneColor(kt.tone, accent),
                  }}
                />
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: DS.ink,
                    marginBottom: 4,
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {kt.label}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: DS.muted,
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {kt.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 90-day plan (collapsible) */}
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setPlanOpen((v) => !v)}
            aria-expanded={planOpen}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              background: DS.accentSoft(accent),
              border: `1px solid ${accent}30`,
              color: DS.ink,
              fontFamily: DS.bodyFont,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              borderRadius: DS.radius,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar style={{ width: 13, height: 13, color: accent }} />
              Your 90-day development plan
            </span>
            {planOpen
              ? <ChevronUp style={{ width: 15, height: 15, color: accent }} />
              : <ChevronDown style={{ width: 15, height: 15, color: accent }} />}
          </button>

          {planOpen && (
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {(['day30', 'day60', 'day90'] as const).map((w) => {
                const items = plan.windows[w];
                if (!items.length) return null;
                const label =
                  w === 'day30' ? 'Days 0–30 · Structural sprint' :
                  w === 'day60' ? 'Days 30–60 · Signature strengths' :
                  'Days 60–90 · Narrative & proof';
                const bg =
                  w === 'day30' ? '#FFF7ED' :
                  w === 'day60' ? '#EFF6FF' :
                  '#F0FDF4';
                const dim =
                  w === 'day30' ? '#9A3412' :
                  w === 'day60' ? '#1D4ED8' :
                  '#047857';
                return (
                  <div
                    key={w}
                    style={{
                      padding: '10px 12px',
                      background: bg,
                      border: `1px solid ${dim}30`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: DS.monoFont,
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: dim,
                        marginBottom: 8,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              width: 22, height: 22,
                              background: dim,
                              color: '#FFF',
                              fontSize: 11,
                              fontWeight: 700,
                              fontFamily: DS.headingFont,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {i + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: DS.ink,
                                marginBottom: 2,
                              }}
                            >
                              {a.dimension}
                              {a.impactLabel && (
                                <span
                                  style={{
                                    fontFamily: DS.monoFont,
                                    fontSize: 9.5,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: dim,
                                    marginLeft: 6,
                                    fontWeight: 500,
                                  }}
                                >
                                  · {a.impactLabel}
                                </span>
                              )}
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                lineHeight: 1.5,
                                color: DS.muted,
                              }}
                            >
                              {a.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 18,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => { onDeepDive?.(); navigate(resultsUrl); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 16px',
              background: accent,
              color: '#FFF',
              border: 'none',
              fontFamily: DS.bodyFont,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: DS.radius,
            }}
          >
            Full results <ArrowRight style={{ width: 12, height: 12 }} />
          </button>

          {kb && (
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10.5,
                color: DS.muted,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {kb.categoryLabel} · {kb.dimensionCount} dims · {kb.totalQuestions} Q
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponent: Strengths / Gaps column ─────────────────────────────

function DimensionBlock({
  accent,
  icon: Icon,
  tone,
  title,
  items,
}: {
  accent: string;
  icon: any;
  tone: 'strength' | 'gap';
  title: string;
  items: Array<{ name: string; score: number }>;
}) {
  const toneColor = tone === 'strength' ? '#047857' : accent;
  return (
    <div
      style={{
        padding: '10px 12px',
        background: tone === 'strength' ? '#ECFDF5' : '#FFF1F2',
        border: `1px solid ${toneColor}20`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          fontFamily: DS.monoFont,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: toneColor,
        }}
      >
        <Icon style={{ width: 11, height: 11 }} />
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 3,
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  color: DS.ink,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {it.name}
              </span>
              <span
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 14,
                  fontWeight: 700,
                  color: toneColor,
                  flexShrink: 0,
                }}
              >
                {it.score}
              </span>
            </div>
            <div style={{ height: 4, background: '#FFF', border: `1px solid ${toneColor}20` }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(5, Math.min(100, it.score))}%`,
                  background: toneColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
