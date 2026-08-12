import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  INK, G100, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle, makeSectionLabel,
} from '../landing/shared';
import {
  getUserAssessmentContext,
  getCrossDiagnosticSynthesis,
  getRecommendedNextAssessment,
  type AssessmentResult,
  type CrossDiagnosticInsight,
  type NextAssessmentRecommendation,
} from '@/nexus/assessmentContext';

interface Props {
  /** The assessment currently being viewed (excluded from the recommendation pool logic labels) */
  assessmentCode: string;
  /** Page accent color */
  accent: string;
  /** Scroll-reveal class prefix */
  prefix: string;
  /** Path to NEXUS chat (for the recommendation CTA) */
  nexusPath: string;
}

/**
 * CrossDiagnosticSummary — renders only when the signed-in user has 2+
 * assessment results. Synthesizes recurring strengths, recurring gaps, and
 * recommended focus areas, plus a "based on your results, take [Y]" CTA (#1324).
 *
 * Brand rules: zero border radius, Crimson Pro headings, DM Sans body, IBM Plex
 * Mono labels, single accent color. Premium, not SaaS.
 */
export function CrossDiagnosticSummary({ assessmentCode, accent, prefix, nexusPath }: Props) {
  const { user } = useAuthStore();
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [insights, setInsights] = useState<CrossDiagnosticInsight[]>([]);
  const [recommendation, setRecommendation] = useState<NextAssessmentRecommendation | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setResults([]);
      return;
    }
    getUserAssessmentContext(user.id)
      .then((r) => {
        if (cancelled) return;
        setResults(r);
        setInsights(getCrossDiagnosticSynthesis(r));
        setRecommendation(getRecommendedNextAssessment(r));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Render nothing while loading, when anonymous, or when fewer than 2 results.
  if (!results || results.length < 2) return null;

  const sectionLabel = makeSectionLabel(accent);
  const strengths = insights.filter((i) => i.type === 'strength');
  const gaps = insights.filter((i) => i.type === 'gap');
  const focuses = insights.filter((i) => i.type === 'focus');

  return (
    <section style={{ padding: '100px 0', background: G100 }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`} style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Cross-diagnostic synthesis</span>
          <h2 className="section-heading" style={{
            fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
            fontSize: 36, lineHeight: 1.2, color: INK, marginBottom: 20,
          }}>
            Patterns across your <em style={{ fontWeight: 400 }}>{results.length} diagnostics</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>
            When assessments are read together, recurring strengths and gaps surface that no single
            diagnostic reveals alone. These are the threads worth pulling on.
          </p>
        </div>

        <div className={`${prefix}-reveal`} style={{ maxWidth: 820, margin: '0 auto' }}>
          {/* Assessed instruments row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 48,
            justifyContent: 'center',
          }}>
            {results.map((r) => (
              <span key={r.id} style={{
                ...monoStyle, fontSize: 10, color: r.code === assessmentCode.toUpperCase() ? accent : G400,
                padding: '4px 10px', border: `1px solid ${G300}`,
              }}>
                {r.code}
              </span>
            ))}
          </div>

          {/* Synthesis groups */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
            <InsightGroup
              title="Recurring strengths"
              accent="#2D7A3E"
              icon={<TrendingUp style={{ width: 18, height: 18, color: '#2D7A3E' }} />}
              items={strengths}
              emptyText="No dimension scored consistently high across your diagnostics yet."
            />
            <InsightGroup
              title="Recurring gaps"
              accent="#C97824"
              icon={<TrendingDown style={{ width: 18, height: 18, color: '#C97824' }} />}
              items={gaps}
              emptyText="No dimension scored consistently low across your diagnostics — a strong signal."
            />
            <InsightGroup
              title="Recommended focus areas"
              accent={accent}
              icon={<Target style={{ width: 18, height: 18, color: accent }} />}
              items={focuses}
              emptyText="No dimension data available to prioritise focus."
            />
          </div>

          {/* Recommendation CTA */}
          {recommendation && (
            <div style={{
              marginTop: 56, background: INK, padding: '40px 36px',
              border: `1px solid ${INK}`,
            }}>
              <span style={{
                ...monoStyle, color: accent, marginBottom: 16, display: 'inline-block',
              }}>
                Recommended next diagnostic
              </span>
              <h3 style={{
                fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 700,
                fontSize: 26, lineHeight: 1.25, color: WHITE, marginBottom: 14,
              }}>
                Based on your results, take <em style={{ fontWeight: 400, color: accent }}>{recommendation.name}</em>
              </h3>
              <p style={{ fontSize: 15, color: G300, lineHeight: 1.6, marginBottom: 28 }}>
                {recommendation.rationale}
              </p>
              <Link
                to={`${nexusPath}?q=${encodeURIComponent(
                  `I've completed ${results.map((r) => r.name).join(', ')}. Why is ${recommendation.name} the right next diagnostic for me?`,
                )}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px', background: accent, color: WHITE,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  border: `1px solid ${accent}`, minHeight: 44,
                  transition: 'background 200ms cubic-bezier(0.4,0,0.2,1), color 200ms cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = WHITE; }}
              >
                Ask NEXUS why <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Insight group sub-component ──────────────────────────────────────
function InsightGroup({
  title,
  accent,
  icon,
  items,
  emptyText,
}: {
  title: string;
  accent: string;
  icon: React.ReactNode;
  items: CrossDiagnosticInsight[];
  emptyText: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        {icon}
        <span style={{ ...monoStyle, color: accent }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 14, color: G400, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ border: `1px solid ${G200}`, background: WHITE }}>
          {items.map((item, i) => (
            <div key={i} style={{
              padding: '20px 24px',
              borderBottom: i < items.length - 1 ? `1px solid ${G200}` : 'none',
            }}>
              <div style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: 17, fontWeight: 700, color: INK, marginBottom: 6, lineHeight: 1.3,
              }}>
                {item.title}
              </div>
              <p style={{ fontSize: 14, color: G600, lineHeight: 1.55, margin: '0 0 8px' }}>
                {item.detail}
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {item.sources.map((s) => (
                  <span key={s} style={{
                    ...monoStyle, fontSize: 9, color: G400, padding: '2px 7px',
                    border: `1px solid ${G300}`,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
