/**
 * DiagnosticResults.tsx — Results page for a single diagnostic attempt.
 *
 * #1341: Loads result via diagnosticApi.getResult(resultId, slug, userId).
 * Reads diagnostic definition via getDiagnostic(slug) for dimension labels,
 * archetype details, and accent color (meta.accent_color).
 *
 * Sections (per #1278 + #1341):
 *   a. Overall score hero (SVG progress ring, no chart library)
 *   b. Dimension breakdown (pure-CSS bars)
 *   c. Archetype card (accent color)
 *   d. Key insights (bullet points)
 *   e. NEXUS deep-dive CTA
 *   f. Share section (copy link only — private/auth-gated)
 *   g. Anonymous user banner (if userId is null)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Link2,
  MessageSquare,
} from 'lucide-react';
import {
  INK,
  OFF,
  G100,
  G200,
  G400,
  G600,
  WHITE,
  monoStyle,
  containerStyle,
  makeBtnPrimary,
  makeBtnSecondary,
  makeSectionLabel,
  ctaCompressHandlers,
} from '../landing/shared';
import { getResult } from '@/services/diagnosticApi';
import { getDiagnostic } from '@/data/diagnostics';
import type {
  DiagnosticDefinition,
  DiagnosticDimension,
  DiagnosticArchetype,
} from '@/types/assessment';
import type { ScoringResult } from '@/services/diagnosticScoring';

// ── Props ──────────────────────────────────────────────────────────
export interface DiagnosticResultsProps {
  /** Diagnostic slug, e.g. "prism" */
  slug: string;
  /** Result ID to load */
  resultId: string;
  /** From auth store; null = anonymous */
  userId: string | null;
}

// ── Motion / layout constants ──────────────────────────────────────
const REVEAL_MS = 350;
const STAGGER_MS = 80;
const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
const HEADING: React.CSSProperties = {
  fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
};
const BODY: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

// ── Score circle (SVG progress ring) ───────────────────────────────
const RING_SIZE = 220;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ScoreCircleProps {
  score: number;
  level: string;
  accent: string;
  animate: boolean;
}

function ScoreCircle({ score, level, accent, animate }: ScoreCircleProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const targetOffset = RING_CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <div
      className="diag-results-ring"
      style={{
        position: 'relative',
        width: RING_SIZE,
        height: RING_SIZE,
        margin: '0 auto',
      }}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={G200}
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={accent}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={animate ? targetOffset : RING_CIRCUMFERENCE}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{ transition: `stroke-dashoffset ${REVEAL_MS}ms ${EASE_EXPO}` }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            ...HEADING,
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1,
            color: INK,
          }}
        >
          {clamped}
        </span>
        <span style={{ ...monoStyle, color: accent, marginTop: 8 }}>{level}</span>
      </div>
    </div>
  );
}

// ── Dimension bar (pure CSS) ───────────────────────────────────────
interface DimensionBarProps {
  name: string;
  score: number;
  level: string;
  lowLabel: string;
  highLabel: string;
  accent: string;
  animate: boolean;
}

function DimensionBar({
  name,
  score,
  level,
  lowLabel,
  highLabel,
  accent,
  animate,
}: DimensionBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <span style={{ ...HEADING, fontSize: 18, fontWeight: 700, color: INK }}>
          {name}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 16,
            fontWeight: 500,
            color: accent,
          }}
        >
          {clamped}
        </span>
      </div>
      <div
        style={{
          height: 10,
          background: G200,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: animate ? `${clamped}%` : '0%',
            background: accent,
            transition: `width ${REVEAL_MS}ms ${EASE_EXPO}`,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <span style={{ ...monoStyle, fontSize: 10, color: G400 }}>{lowLabel}</span>
        <span style={{ ...monoStyle, fontSize: 10, color: accent }}>{level}</span>
        <span style={{ ...monoStyle, fontSize: 10, color: G400 }}>{highLabel}</span>
      </div>
    </div>
  );
}

// ── Load state ─────────────────────────────────────────────────────
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: ScoringResult; definition: DiagnosticDefinition };

// ── Overall summary from definition's result_insights ──────────────
function overallSummary(def: DiagnosticDefinition, score: number): string {
  const { result_insights } = def;
  if (score >= 70) return result_insights.high;
  if (score >= 40) return result_insights.medium;
  return result_insights.low;
}

// ── Main component ─────────────────────────────────────────────────
export function DiagnosticResults({ slug, resultId, userId }: DiagnosticResultsProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [revealed, setRevealed] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const definition = getDiagnostic(slug);
    if (!definition) {
      setState({ status: 'error', message: `Unknown diagnostic: "${slug}".` });
      return;
    }
    try {
      const data = await getResult(resultId, slug, userId);
      if (!data) {
        setState({
          status: 'error',
          message:
            'We could not find this result. It may have expired or been removed.',
        });
        return;
      }
      setState({ status: 'ready', result: data.result, definition });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load results.';
      setState({ status: 'error', message });
    }
  }, [slug, resultId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Trigger staggered reveal + bar fill once data is ready
  useEffect(() => {
    if (state.status !== 'ready') {
      setRevealed(false);
      setAnimateBars(false);
      return;
    }
    const t1 = window.setTimeout(() => setRevealed(true), 60);
    const t2 = window.setTimeout(() => setAnimateBars(true), 280);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [state]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/diagnostics/${slug}/results/${resultId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for non-secure contexts / older browsers
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [slug, resultId]);

  const backHref = `/diagnostics/${slug}`;

  // ── Loading skeleton ───────────────────────────────────────────
  if (state.status === 'loading') {
    return (
      <div style={{ background: OFF, minHeight: '100vh', ...BODY }}>
        <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              className="diag-skel"
              style={{ width: 120, height: 14, margin: '0 auto 20px', background: G200 }}
            />
            <div
              className="diag-skel"
              style={{
                width: 220,
                height: 220,
                margin: '0 auto 32px',
                background: G200,
                borderRadius: '50%',
              }}
            />
            <div
              className="diag-skel"
              style={{ width: 280, height: 24, margin: '0 auto 16px', background: G200 }}
            />
            <div
              className="diag-skel"
              style={{ width: 420, height: 14, margin: '0 auto', background: G200 }}
            />
          </div>
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div
                  className="diag-skel"
                  style={{ width: '40%', height: 16, marginBottom: 12, background: G200 }}
                />
                <div
                  className="diag-skel"
                  style={{ width: '100%', height: 10, background: G200 }}
                />
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes diagPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } } .diag-skel { animation: diagPulse 1.2s ease-in-out infinite; }`}</style>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────
  if (state.status === 'error') {
    return (
      <div style={{ background: OFF, minHeight: '100vh', ...BODY }}>
        <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
          <div
            style={{
              padding: 24,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <AlertTriangle
              style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <h3 style={{ ...HEADING, fontSize: 18, marginBottom: 4 }}>
                Unable to load results
              </h3>
              <p style={{ fontSize: 14, color: G600, marginBottom: 16 }}>{state.message}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to={backHref} style={makeBtnPrimary(INK)}>
                  <ArrowLeft style={{ width: 16, height: 16 }} /> Back to diagnostic
                </Link>
                <button onClick={load} style={makeBtnSecondary(INK)}>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready ──────────────────────────────────────────────────────
  const { result, definition } = state;
  const accent = definition.meta.accent_color;
  const primaryBtn = makeBtnPrimary(accent);

  // Dimension definition lookup (for low/high labels) — cheap, computed inline
  const dimDefByKey: Record<string, DiagnosticDimension> = {};
  for (const d of definition.dimensions) dimDefByKey[d.key] = d;

  // Archetype lookup (for description + key traits)
  const archetype: DiagnosticArchetype | null = result.archetype_key
    ? definition.archetypes.find((a) => a.key === result.archetype_key) ?? null
    : null;

  const summary = overallSummary(definition, result.overall_score);
  const insights: string[] = Array.isArray(result.insights) ? result.insights : [];

  const revealStyle = (index: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity ${REVEAL_MS}ms ${EASE_EXPO}, transform ${REVEAL_MS}ms ${EASE_EXPO}`,
    transitionDelay: `${index * STAGGER_MS}ms`,
  });

  const nexusHref = `/app/nexus?q=${encodeURIComponent(
    `Discuss my ${slug.toUpperCase()} results`
  )}`;

  return (
    <div
      style={{
        background: OFF,
        color: INK,
        minHeight: '100vh',
        ...BODY,
        lineHeight: 1.6,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Slim header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(245,245,243,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${G200}`,
        }}
      >
        <div
          style={{
            ...containerStyle,
            padding: '14px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            to={backHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: INK,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 500,
              ...BODY,
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to diagnostic
          </Link>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...HEADING, fontSize: 18, fontWeight: 700 }}>
              {definition.meta.title}
            </span>
            <span style={{ ...monoStyle, fontSize: 10, color: G400 }}>Results</span>
          </div>
        </div>
      </header>

      <main>
        <div style={containerStyle}>
          {/* a. Overall score hero */}
          <section style={{ paddingTop: 72, paddingBottom: 64, textAlign: 'center' }}>
            <div style={revealStyle(0)}>
              <span
                style={{ ...monoStyle, color: accent, marginBottom: 24, display: 'inline-block' }}
              >
                {definition.meta.subtitle}
              </span>
              <div style={{ marginBottom: 32 }}>
                <ScoreCircle
                  score={result.overall_score}
                  level={result.overall_level}
                  accent={accent}
                  animate={revealed}
                />
              </div>
              <h1
                style={{
                  ...HEADING,
                  fontSize: 40,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: INK,
                  marginBottom: 16,
                }}
              >
                {definition.meta.title}
              </h1>
              <p
                style={{
                  fontSize: 17,
                  color: G600,
                  maxWidth: 560,
                  margin: '0 auto',
                }}
              >
                {summary}
              </p>
            </div>
          </section>

          {/* b. Dimension breakdown */}
          <section style={{ padding: '64px 0', borderTop: `1px solid ${G200}` }}>
            <div style={revealStyle(1)}>
              <span style={makeSectionLabel(accent)}>Dimension breakdown</span>
              <h2
                style={{
                  ...HEADING,
                  fontSize: 30,
                  fontWeight: 700,
                  color: INK,
                  marginBottom: 40,
                  maxWidth: 680,
                }}
              >
                Your five dimensions, <em style={{ fontWeight: 400 }}>scored 0–100</em>
              </h2>
              <div
                style={{
                  maxWidth: 760,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 28,
                }}
              >
                {result.dimension_scores.map((ds) => {
                  const def = dimDefByKey[ds.dimension_key];
                  return (
                    <DimensionBar
                      key={ds.dimension_key}
                      name={ds.dimension_name || def?.name || ds.dimension_key}
                      score={ds.score}
                      level={ds.level}
                      lowLabel={def?.low_label ?? 'Developing'}
                      highLabel={def?.high_label ?? 'Mastery'}
                      accent={accent}
                      animate={animateBars}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* c. Archetype card */}
          {archetype && (
            <section style={{ padding: '64px 0', borderTop: `1px solid ${G200}` }}>
              <div style={revealStyle(2)}>
                <span style={makeSectionLabel(accent)}>Your archetype</span>
                <div
                  style={{
                    padding: 32,
                    background: WHITE,
                    borderLeft: `4px solid ${accent}`,
                    borderTop: `1px solid ${G200}`,
                    borderRight: `1px solid ${G200}`,
                    borderBottom: `1px solid ${G200}`,
                  }}
                >
                  <h3
                    style={{
                      ...HEADING,
                      fontSize: 28,
                      fontWeight: 700,
                      color: accent,
                      marginBottom: 12,
                    }}
                  >
                    {archetype.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      color: G600,
                      lineHeight: 1.6,
                      marginBottom: 24,
                    }}
                  >
                    {archetype.description}
                  </p>
                  {archetype.key_traits.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {archetype.key_traits.map((trait) => (
                        <span
                          key={trait}
                          style={{
                            ...monoStyle,
                            fontSize: 10,
                            padding: '6px 12px',
                            background: G100,
                            color: INK,
                            border: `1px solid ${G200}`,
                          }}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* d. Key insights */}
          {insights.length > 0 && (
            <section style={{ padding: '64px 0', borderTop: `1px solid ${G200}` }}>
              <div style={revealStyle(3)}>
                <span style={makeSectionLabel(accent)}>Key insights</span>
                <h2
                  style={{
                    ...HEADING,
                    fontSize: 30,
                    fontWeight: 700,
                    color: INK,
                    marginBottom: 32,
                  }}
                >
                  What your results mean
                </h2>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    maxWidth: 760,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {insights.map((insight, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 8,
                          height: 8,
                          marginTop: 9,
                          background: accent,
                          borderRadius: '50%',
                        }}
                      />
                      <span style={{ fontSize: 16, color: G600, lineHeight: 1.6 }}>
                        {insight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* e. NEXUS deep-dive CTA */}
          <section style={{ padding: '80px 0', borderTop: `1px solid ${G200}` }}>
            <div
              style={{
                ...revealStyle(4),
                textAlign: 'center',
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <MessageSquare style={{ width: 20, height: 20, color: accent }} />
                <span style={{ ...monoStyle, color: accent }}>NEXUS AI Coach</span>
              </div>
              <h2
                style={{
                  ...HEADING,
                  fontSize: 30,
                  fontWeight: 700,
                  color: INK,
                  marginBottom: 16,
                }}
              >
                Discuss your results with NEXUS
              </h2>
              <p style={{ fontSize: 16, color: G600, marginBottom: 32 }}>
                Continue the conversation with NEXUS, your AI coach. It carries your{' '}
                {definition.meta.title} results into every reply — no need to re-explain your
                scores.
              </p>
              <Link
                to={nexusHref}
                style={primaryBtn}
                {...ctaCompressHandlers}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = WHITE;
                  e.currentTarget.style.color = accent;
                  e.currentTarget.style.borderColor = accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = accent;
                  e.currentTarget.style.color = WHITE;
                  e.currentTarget.style.borderColor = accent;
                }}
              >
                Discuss your results with NEXUS
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </section>

          {/* f. Share section (copy link only — private/auth-gated) */}
          <section style={{ padding: '64px 0', borderTop: `1px solid ${G200}` }}>
            <div style={{ ...revealStyle(5), textAlign: 'center' }}>
              <span style={makeSectionLabel(accent)}>Share</span>
              <h2
                style={{
                  ...HEADING,
                  fontSize: 24,
                  fontWeight: 700,
                  color: INK,
                  marginBottom: 12,
                }}
              >
                Share your results
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: G600,
                  maxWidth: 480,
                  margin: '0 auto 24px',
                }}
              >
                Your results are private. Copy a link to revisit them anytime.
              </p>
              <button
                onClick={handleCopyLink}
                aria-label="Copy results link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  border: `1px solid ${INK}`,
                  background: copied ? INK : WHITE,
                  color: copied ? WHITE : INK,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  minHeight: 44,
                }}
              >
                {copied ? (
                  <>
                    <Check style={{ width: 16, height: 16 }} /> Link copied!
                  </>
                ) : (
                  <>
                    <Link2 style={{ width: 16, height: 16 }} /> Copy link
                  </>
                )}
              </button>
            </div>
          </section>

          {/* g. Anonymous user banner (if userId is null) */}
          {userId === null && (
            <section style={{ padding: '64px 0 96px', borderTop: `1px solid ${G200}` }}>
              <div
                style={{
                  ...revealStyle(6),
                  padding: 32,
                  background: G100,
                  border: `1px solid ${G200}`,
                  textAlign: 'center',
                }}
              >
                <h2
                  style={{
                    ...HEADING,
                    fontSize: 24,
                    fontWeight: 700,
                    color: INK,
                    marginBottom: 12,
                  }}
                >
                  Create an account to save your results permanently
                </h2>
                <p
                  style={{
                    fontSize: 15,
                    color: G600,
                    maxWidth: 520,
                    margin: '0 auto 24px',
                  }}
                >
                  Anonymous results expire after 7 days. Sign up to keep your scores, track
                  progress over time, and sync with NEXUS.
                </p>
                <Link to="/signup" style={primaryBtn} {...ctaCompressHandlers}>
                  Create an account
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .diag-results-ring { transform: scale(0.85); transform-origin: top center; }
        }
      `}</style>
    </div>
  );
}

export default DiagnosticResults;
