import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import {
  CPDArchetype,
  DimensionId,
  ASSESSMENT_ENGINE,
  ARCHETYPE_INFO,
  DIMENSION_INFO,
} from '../../services/assessmentEngine';
import { ASSESSMENT_CATALOG, type AssessmentInfo } from '@/assessments/catalog';
import type { ScoreResult } from '@/lib/akira/engine';
import { DS, SUCCESS, WARNING, ERROR } from '@/tokens';

/* ============================================================
 * ResultsPanel — variable-dimension / variable-archetype renderer.
 *
 * Two input paths converge on a single normalized render model:
 *  1. Generic path (preferred): `assessmentCode` + `scoreResult`
 *     (an Akira ScoreResult). Dimension/archetype metadata is pulled
 *     from ASSESSMENT_CATALOG. Handles 3–6 dimensions and 0–17
 *     archetypes (SPARK, MOSAIC, QUEST, LEAP, score-only, …).
 *  2. Legacy CPI path: the original CPI props (compositeScore,
 *     dimensionScores, crossBorderScore, archetype). Preserved so
 *     AssessmentWizard keeps working unchanged.
 *
 * Brand rules (non-negotiable): zero border radius everywhere, system
 * serif headings, DM Sans body, IBM Plex Mono for data, one accent
 * color per page, functional motion only (120–350ms), no "free".
 * ============================================================ */

// ── Per-instrument accent (one accent per result page) ─────────────
// LEAP / SPARK / IMPACT carry their own disciplined hero accent (see
// @/tokens OCEAN / AMBER / FOREST_GREEN). Every other instrument uses
// the canonical LYC fuchsia.
const INSTRUMENT_ACCENT: Record<string, string> = {
  LEAP: '#1E4D8C',   // OCEAN
  SPARK: '#B45309',  // AMBER
  IMPACT: '#166534', // FOREST_GREEN
};

function resolveAccent(code?: string, override?: string): string {
  if (override) return override;
  if (code) {
    const upper = code.toUpperCase();
    if (INSTRUMENT_ACCENT[upper]) return INSTRUMENT_ACCENT[upper];
  }
  return DS.accent;
}

/** Semantic score-band color (≥70 strong, ≥50 developing, else gap). */
function scoreColor(score: number): string {
  if (score >= 70) return SUCCESS;
  if (score >= 50) return WARNING;
  return ERROR;
}

/** Compact priority badge color. */
function priorityColor(priority: string, accent: string): string {
  switch (priority) {
    case 'critical': return ERROR;
    case 'high': return WARNING;
    case 'medium': return accent;
    default: return DS.muted;
  }
}

// ── Normalized internal model (both paths converge here) ───────────
interface NormDimension {
  id: string;
  name: string;
  percentage: number;     // 0–100
  verdict?: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}
interface NormArchetype {
  name: string;
  description: string;
  matchScore?: number;
}
interface NormPriority {
  dimensionName: string;
  priority: string;
  rationale: string;
}
interface NormResult {
  assessmentName: string;
  accent: string;
  compositeScore: number;
  compositeBand?: string;
  compositeInterpretation?: string;
  dimensions: NormDimension[];
  matchedArchetype?: NormArchetype;
  rankedArchetypes: NormArchetype[];
  archetypeCount: number;
  priorities: NormPriority[];
  // CPI-legacy only:
  strengths?: string[];
  development?: string[];
  crossBorderScore?: number;
  crossBorderTierLabel?: string;
}

/** One-line narrative per dimension — count tracks the actual dimension count (3–6). */
function dimensionNarrative(d: NormDimension): string {
  const pct = Math.round(d.percentage);
  if (d.verdict) return `${d.verdict} — ${pct}%.`;
  if (pct >= 70) return `Strong — ${pct}%. A clear asset in your profile.`;
  if (pct >= 50) return `Developing — ${pct}%. Solid foundation with room to deepen.`;
  return `Gap — ${pct}%. Priority area for focused development.`;
}

// ── Generic path: ScoreResult + catalog → NormResult ───────────────
function buildFromScoreResult(
  assessmentCode: string,
  result: ScoreResult,
  accent: string
): NormResult {
  const info: AssessmentInfo | undefined = ASSESSMENT_CATALOG[assessmentCode.toUpperCase()];
  const dimMetaById = new Map<string, AssessmentInfo['dimensions'][number]>();
  (info?.dimensions || []).forEach((d) => dimMetaById.set(d.id, d));

  const order = result.dimensions_ordered?.length
    ? result.dimensions_ordered
    : Object.keys(result.dimension_scores);

  const dimensions: NormDimension[] = order.map((id) => {
    const ds = result.dimension_scores[id];
    const meta = dimMetaById.get(id);
    return {
      id,
      name: ds?.name || meta?.name || id,
      percentage: ds?.percentage ?? 0,
      verdict: ds?.verdict || result.dimension_verdicts?.[id]?.verdict,
      description: meta?.description || ds?.verdict_meaning || '',
      lowLabel: meta?.lowLabel || 'Low',
      highLabel: meta?.highLabel || 'High',
    };
  });

  const ranked: NormArchetype[] = (result.archetypes_ranked || []).map((a) => ({
    name: a.name,
    description: a.description || '',
    matchScore: a.match_score,
  }));
  const matched: NormArchetype | undefined = result.archetype
    ? {
        name: result.archetype.name,
        description: result.archetype.description || '',
        matchScore: result.archetype.match_score,
      }
    : ranked[0];

  // archetype_count from catalog is the source of truth; fall back to ranked/matched.
  const archetypeCount =
    info?.archetype_count ?? ranked.length ?? (matched ? 1 : 0);

  const priorities: NormPriority[] = (result.development_priorities || [])
    .slice(0, 3)
    .map((p) => ({
      dimensionName: p.dimension_name,
      priority: p.priority,
      rationale: p.rationale,
    }));

  return {
    assessmentName: info?.b2cName || info?.name || assessmentCode.toUpperCase(),
    accent,
    compositeScore: result.composite?.score ?? 0,
    compositeBand: result.composite?.band,
    compositeInterpretation: result.composite?.interpretation,
    dimensions,
    matchedArchetype: matched,
    rankedArchetypes: ranked,
    archetypeCount,
    priorities,
  };
}

// ── Legacy CPI path: CPI props → NormResult ────────────────────────
function buildFromLegacyCPI(
  compositeScore: number,
  dimensionScores: Record<DimensionId, number>,
  crossBorderScore: number,
  archetype: CPDArchetype,
  accent: string
): NormResult {
  const tier = ASSESSMENT_ENGINE.getCrossBorderTier(crossBorderScore);
  const archetypeData = ARCHETYPE_INFO[archetype];

  const dimensions: NormDimension[] = (
    Object.entries(DIMENSION_INFO) as Array<[DimensionId, { name: string; description: string; low: string; high: string }]>
  ).map(([dimId, info]) => ({
    id: dimId,
    name: info.name,
    percentage: dimensionScores[dimId] ?? 0,
    description: info.description,
    lowLabel: info.low,
    highLabel: info.high,
  }));

  const priorities: NormPriority[] = [...dimensions]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3)
    .map((d) => {
      const priority = d.percentage < 40 ? 'critical' : d.percentage < 60 ? 'high' : 'medium';
      return {
        dimensionName: d.name,
        priority,
        rationale: `${d.name} scored ${Math.round(d.percentage)} — ${
          priority === 'critical'
            ? 'requires focused intervention'
            : 'represents a development opportunity'
        }.`,
      };
    });

  return {
    assessmentName: 'CPI',
    accent,
    compositeScore,
    dimensions,
    matchedArchetype: {
      name: archetype,
      description: archetypeData.description,
    },
    rankedArchetypes: [],
    archetypeCount: 1,
    priorities,
    strengths: archetypeData.strengths,
    development: archetypeData.development,
    crossBorderScore,
    crossBorderTierLabel: tier.label,
  };
}

// ── Animated horizontal score bar (fills on mount, 350ms) ──────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.max(0, Math.min(100, score))), 150);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div style={{ height: 8, background: DS.bgAlt, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${width}%`, background: color,
        transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

// ── Section primitives (zero radius, brand fonts) ──────────────────
const sectionStyle: React.CSSProperties = {
  background: DS.card,
  border: `1px solid ${DS.cardBorder}`,
  padding: '24px',
  marginBottom: '24px',
};
const headingStyle: React.CSSProperties = {
  fontFamily: DS.headingFont,
  fontSize: '16px',
  color: DS.text,
  marginBottom: '16px',
};
const monoStyle: React.CSSProperties = {
  fontFamily: DS.monoFont,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

interface ResultsPanelProps {
  // Generic path (preferred for multi-instrument assessments):
  assessmentCode?: string;
  scoreResult?: ScoreResult;
  accentColor?: string;
  // Legacy CPI path (kept for backward compatibility with AssessmentWizard):
  compositeScore?: number;
  dimensionScores?: Record<DimensionId, number>;
  crossBorderScore?: number;
  archetype?: CPDArchetype;
  // Shared:
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}

export function ResultsPanel(props: ResultsPanelProps) {
  const {
    assessmentCode,
    scoreResult,
    accentColor,
    compositeScore,
    dimensionScores,
    crossBorderScore,
    archetype,
    onDownloadPDF,
    isGeneratingPDF,
  } = props;

  const isGeneric = Boolean(assessmentCode && scoreResult);
  const accent = resolveAccent(assessmentCode, accentColor);

  let result: NormResult;
  if (isGeneric && scoreResult && assessmentCode) {
    result = buildFromScoreResult(assessmentCode, scoreResult, accent);
  } else {
    // Legacy CPI path. archetype is required by the original contract; fall
    // back to the first known CPI archetype only as a defensive guard.
    const fallbackArchetype = (Object.keys(ARCHETYPE_INFO)[0] as CPDArchetype) || archetype!;
    result = buildFromLegacyCPI(
      compositeScore ?? 0,
      dimensionScores ?? ({} as Record<DimensionId, number>),
      crossBorderScore ?? 0,
      archetype ?? fallbackArchetype,
      accent
    );
  }

  const { dimensions, matchedArchetype, rankedArchetypes, archetypeCount } = result;
  const hasArchetypes = archetypeCount > 0 && Boolean(matchedArchetype);
  // 7–17 archetypes (LEAP-style) → compact table, never a card grid.
  // Decision uses the catalog's archetype_count (source of truth).
  const useCompactArchetypeTable = archetypeCount > 6;
  const rankedAlternatives = matchedArchetype
    ? rankedArchetypes.filter((a) => a.name !== matchedArchetype.name)
    : rankedArchetypes;

  // Weakest dimension for the NEXUS bridge narrative (graceful when empty).
  const weakestDimension = [...dimensions].sort((a, b) => a.percentage - b.percentage)[0];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* ── Success Header ─────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ ...monoStyle, color: DS.muted, fontSize: '11px' }}>
          {result.assessmentName} · Results
        </span>
        <h2 style={{
          fontFamily: DS.headingFont,
          fontSize: '28px',
          color: DS.text,
          margin: '8px 0 0',
        }}>
          {matchedArchetype ? matchedArchetype.name : 'Your Assessment Results'}
        </h2>
      </div>

      {/* ── Composite Score + Band ─────────────────────────────── */}
      <div style={{ ...sectionStyle, textAlign: 'center' }}>
        <p style={{ color: DS.muted, fontSize: '13px', marginBottom: '8px', margin: '0 0 8px' }}>
          Overall Assessment Score
        </p>
        <p style={{
          fontFamily: DS.headingFont,
          fontSize: '64px',
          fontWeight: 700,
          color: scoreColor(result.compositeScore),
          margin: '0 0 8px',
          lineHeight: 1,
        }}>
          {Math.round(result.compositeScore)}
        </p>
        <p style={{ ...monoStyle, color: DS.muted, fontSize: '11px', margin: '0 0 12px' }}>
          Out of 100
        </p>
        {result.compositeBand ? (
          <p style={{
            fontFamily: DS.headingFont,
            fontSize: '15px',
            color: accent,
            fontWeight: 600,
            margin: '0 0 6px',
          }}>
            {result.compositeBand}
          </p>
        ) : null}
        {result.compositeInterpretation ? (
          <p style={{ color: DS.textSecondary, fontSize: '14px', lineHeight: 1.6, margin: '0', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            {result.compositeInterpretation}
          </p>
        ) : null}
      </div>

      {/* ── Archetype Badge (conditional) ──────────────────────── */}
      {hasArchetypes && matchedArchetype ? (
        <div style={{
          background: `${accent}12`,
          border: `1px solid ${accent}40`,
          padding: '28px',
          marginBottom: '24px',
        }}>
          <span style={{ ...monoStyle, color: accent, fontSize: '10px', display: 'block', marginBottom: '8px' }}>
            Your Matched Profile
          </span>
          <h3 style={{
            fontFamily: DS.headingFont,
            fontSize: '22px',
            color: DS.text,
            margin: '0 0 10px',
          }}>
            {matchedArchetype.name}
          </h3>
          {matchedArchetype.description ? (
            <p style={{
              color: DS.textSecondary,
              fontSize: '15px',
              margin: '0',
              lineHeight: 1.6,
            }}>
              {matchedArchetype.description}
            </p>
          ) : null}
          {typeof matchedArchetype.matchScore === 'number' ? (
            <p style={{
              ...monoStyle,
              fontSize: '11px',
              color: DS.muted,
              margin: '12px 0 0',
            }}>
              Match strength · {Math.round(matchedArchetype.matchScore)}%
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Dimension Overview Bar Chart (3–6 dims) ────────────── */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>Dimension Breakdown</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {dimensions.map((d) => {
            const color = scoreColor(d.percentage);
            return (
              <div key={d.id}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '6px',
                  gap: '12px',
                }}>
                  <span style={{ color: DS.text, fontSize: '14px' }}>{d.name}</span>
                  <span style={{
                    fontFamily: DS.monoFont,
                    color,
                    fontSize: '14px',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {Math.round(d.percentage)}
                  </span>
                </div>
                <ScoreBar score={d.percentage} color={color} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Dimension Cards (responsive grid, auto-fit minmax(200px, 1fr)) ─ */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>Dimension Detail</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {dimensions.map((d) => {
            const color = scoreColor(d.percentage);
            return (
              <div key={d.id} style={{
                background: DS.bgAlt,
                border: `1px solid ${DS.border}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '6px',
                }}>
                  <span style={{
                    fontFamily: DS.headingFont,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: DS.text,
                  }}>
                    {d.name}
                  </span>
                  <span style={{
                    fontFamily: DS.monoFont,
                    fontSize: '15px',
                    fontWeight: 600,
                    color,
                    flexShrink: 0,
                  }}>
                    {Math.round(d.percentage)}%
                  </span>
                </div>
                {d.verdict ? (
                  <span style={{
                    ...monoStyle,
                    fontSize: '10px',
                    color,
                    marginBottom: '10px',
                  }}>
                    {d.verdict}
                  </span>
                ) : (
                  <span style={{
                    ...monoStyle,
                    fontSize: '10px',
                    color: DS.muted,
                    marginBottom: '10px',
                  }}>
                    {d.lowLabel} → {d.highLabel}
                  </span>
                )}
                <ScoreBar score={d.percentage} color={color} />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                }}>
                  <span style={{ fontSize: '10px', color: DS.muted }}>{d.lowLabel}</span>
                  <span style={{ fontSize: '10px', color: DS.muted }}>{d.highLabel}</span>
                </div>
                {d.description ? (
                  <p style={{
                    fontSize: '12px',
                    color: DS.textSecondary,
                    lineHeight: 1.55,
                    margin: '12px 0 0',
                  }}>
                    {d.description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Ranked Archetypes (conditional) ────────────────────── */}
      {hasArchetypes && rankedAlternatives.length > 0 ? (
        <div style={sectionStyle}>
          <h4 style={headingStyle}>
            {useCompactArchetypeTable ? 'Archetype Rankings' : 'Alternative Profiles'}
          </h4>

          {useCompactArchetypeTable ? (
            // 7–17 archetypes (LEAP) — compact table, never a card grid.
            <div style={{ border: `1px solid ${DS.border}` }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 72px',
                background: DS.bgAlt,
                padding: '10px 12px',
                ...monoStyle,
                fontSize: '10px',
                color: DS.muted,
              }}>
                <span>Rank</span>
                <span>Profile</span>
                <span style={{ textAlign: 'right' }}>Match</span>
              </div>
              {rankedArchetypes.map((a, i) => {
                const isMatched = matchedArchetype && a.name === matchedArchetype.name;
                return (
                  <div key={`${a.name}-${i}`} style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 72px',
                    alignItems: 'baseline',
                    gap: '8px',
                    padding: '10px 12px',
                    borderTop: i === 0 ? 'none' : `1px solid ${DS.border}`,
                    background: isMatched ? `${accent}10` : 'transparent',
                  }}>
                    <span style={{
                      fontFamily: DS.monoFont,
                      fontSize: '12px',
                      color: isMatched ? accent : DS.muted,
                      fontWeight: 600,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{
                        fontFamily: DS.headingFont,
                        fontSize: '14px',
                        fontWeight: 700,
                        color: DS.text,
                        display: 'block',
                      }}>
                        {a.name}
                        {isMatched ? (
                          <span style={{
                            ...monoStyle,
                            fontSize: '9px',
                            color: accent,
                            marginLeft: '8px',
                            fontWeight: 600,
                          }}>
                            · Matched
                          </span>
                        ) : null}
                      </span>
                      {a.description ? (
                        <span style={{
                          fontSize: '12px',
                          color: DS.textSecondary,
                          lineHeight: 1.5,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {a.description}
                        </span>
                      ) : null}
                    </span>
                    <span style={{
                      fontFamily: DS.monoFont,
                      fontSize: '12px',
                      color: isMatched ? accent : DS.muted,
                      textAlign: 'right',
                      fontWeight: 600,
                    }}>
                      {typeof a.matchScore === 'number' ? `${Math.round(a.matchScore)}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            // 1–6 archetypes — card grid.
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}>
              {rankedAlternatives.map((a, i) => (
                <div key={`${a.name}-${i}`} style={{
                  background: DS.bgAlt,
                  border: `1px solid ${DS.border}`,
                  padding: '16px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '8px',
                    gap: '8px',
                  }}>
                    <span style={{
                      fontFamily: DS.headingFont,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: DS.text,
                    }}>
                      {a.name}
                    </span>
                    {typeof a.matchScore === 'number' ? (
                      <span style={{
                        fontFamily: DS.monoFont,
                        fontSize: '12px',
                        color: DS.muted,
                        flexShrink: 0,
                      }}>
                        {Math.round(a.matchScore)}%
                      </span>
                    ) : null}
                  </div>
                  {a.description ? (
                    <p style={{
                      fontSize: '13px',
                      color: DS.textSecondary,
                      lineHeight: 1.55,
                      margin: 0,
                    }}>
                      {a.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* ── Cross-Border Readiness (CPI-legacy only) ───────────── */}
      {typeof result.crossBorderScore === 'number' && result.crossBorderTierLabel ? (
        <div style={sectionStyle}>
          <h4 style={headingStyle}>
            Cross-Border Readiness: {result.crossBorderTierLabel}
          </h4>
          <p style={{ fontSize: '14px', color: DS.textSecondary, margin: 0 }}>
            You scored {Math.round(result.crossBorderScore)} out of 100 for cross-border leadership readiness.
          </p>
        </div>
      ) : null}

      {/* ── Development Priorities (top 3 weakest, handles <3) ─── */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>Development Priorities</h4>
        {result.priorities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {result.priorities.map((p, i) => (
              <div key={`${p.dimensionName}-${i}`} style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                paddingBottom: i < result.priorities.length - 1 ? '14px' : 0,
                borderBottom: i < result.priorities.length - 1 ? `1px solid ${DS.border}` : 'none',
              }}>
                <span style={{
                  fontFamily: DS.monoFont,
                  fontSize: '12px',
                  color: DS.muted,
                  flexShrink: 0,
                  minWidth: '24px',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '4px',
                  }}>
                    <span style={{
                      fontFamily: DS.headingFont,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: DS.text,
                    }}>
                      {p.dimensionName}
                    </span>
                    <span style={{
                      ...monoStyle,
                      fontSize: '10px',
                      color: priorityColor(p.priority, accent),
                      fontWeight: 600,
                    }}>
                      {p.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: DS.textSecondary, lineHeight: 1.55, margin: 0 }}>
                    {p.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: DS.muted, margin: 0 }}>
            No development priorities available for this assessment.
          </p>
        )}
      </div>

      {/* ── Strengths & Development Areas (CPI-legacy narrative) ── */}
      {result.strengths && result.strengths.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={sectionStyle}>
            <h4 style={{ ...headingStyle, color: SUCCESS, marginBottom: '12px' }}>Top Strengths</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: DS.textSecondary }}>
              {result.strengths.map((s, i) => (
                <li key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>{s}</li>
              ))}
            </ul>
          </div>
          {result.development && result.development.length > 0 ? (
            <div style={sectionStyle}>
              <h4 style={{ ...headingStyle, color: WARNING, marginBottom: '12px' }}>Development Areas</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: DS.textSecondary }}>
                {result.development.map((d, i) => (
                  <li key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>{d}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Narrative sections (variable count = dimension count) ── */}
      <div style={sectionStyle}>
        <h4 style={headingStyle}>What Your Scores Mean</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dimensions.map((d) => (
            <div key={`narr-${d.id}`} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'baseline',
            }}>
              <span style={{
                fontFamily: DS.headingFont,
                fontSize: '14px',
                fontWeight: 700,
                color: DS.text,
                minWidth: '120px',
                flexShrink: 0,
              }}>
                {d.name}
              </span>
              <span style={{ fontSize: '13px', color: DS.textSecondary, lineHeight: 1.55 }}>
                {dimensionNarrative(d)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Insight bridge to NEXUS (complimentary, no "free") ──── */}
      {weakestDimension ? (
        <div style={{
          background: `${accent}0D`,
          border: `1px solid ${accent}33`,
          padding: '20px 24px',
          marginBottom: '24px',
        }}>
          <p style={{
            color: DS.text,
            fontSize: '15px',
            lineHeight: 1.6,
            margin: '0 0 16px',
            fontFamily: DS.headingFont,
          }}>
            Your most immediate development area is{' '}
            <strong style={{ color: accent }}>{weakestDimension.name}</strong>.
            {result.compositeScore >= 70
              ? 'Given your strong overall positioning, this is the gap worth closing first.'
              : 'Combined with developing scores, this is where to focus your next 90 days.'}
          </p>
          <a
            href={`/nexus?context=assessment&archetype=${encodeURIComponent(
              matchedArchetype?.name || ''
            )}&score=${Math.round(result.compositeScore)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: accent,
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'opacity 200ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            Build your 90-day plan with NEXUS →
          </a>
        </div>
      ) : null}

      {/* ── Download Report ────────────────────────────────────── */}
      <button
        onClick={onDownloadPDF}
        disabled={isGeneratingPDF}
        style={{
          width: '100%',
          padding: '18px',
          background: accent,
          color: '#FFFFFF',
          border: 'none',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          minHeight: '56px',
          transition: 'opacity 200ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <Download style={{ width: 20, height: 20 }} />
        {isGeneratingPDF ? 'Generating PDF...' : 'Download Your Report'}
      </button>
    </div>
  );
}
