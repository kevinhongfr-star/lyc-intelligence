/**
 * V4.5.4 — SHARE / PUBLIC READOUT PAGE (V1 re-skin)
 *
 * Route: /share/[id]
 * Standalone page — NOT in app shell. Public-facing.
 *
 * Layout:
 *  - Header: NEXUS wordmark (small, top-left) + "Shared readout" (mono, top-right)
 *  - Main: readout content (simplified, no right rail)
 *  - Footer: "Shared by [name] · [date]" (mono, small)
 *  - CTA bar at bottom: "Experience the full version →" (links to /nexus)
 *
 * V1 rules: 0px radius, no shadows, rule lines, mono labels, serif display,
 * cream background, teal primary, fuchsia accent sparingly.
 *
 * Share logic, access control, readout data — all stay the same.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getShareCard, type ShareCard, type ShareCardType } from '../services/shareCardService';
import type { SharedAssessmentPayload } from '../services/assessmentShareService';
import { SEO } from '@/components/seo/SEO';
import { V1 } from '@/styles/v1-tokens';

interface Teaser {
  eyebrow: string;
  name: string;
  headline: string;
  headlineSub?: string;
  metric?: { label: string; value: string };
  insights: string[];
  /** Sharer attribution — surfaced in the V1 footer ("Shared by · · ·"). */
  sharedBy?: string;
  sharedAt?: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  strategic_orientation: 'Strategic Orientation',
  cross_border_adaptability: 'Cross-border Adaptability',
  stakeholder_influence: 'Stakeholder Influence',
  experience: 'Experience',
  skills: 'Skills',
  fit: 'Fit',
};

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function topDimension(
  scores: Record<string, number> | undefined
): { label: string; score: number } | null {
  if (!scores) return null;
  const entries = Object.entries(scores).filter(
    ([, v]) => typeof v === 'number' && !Number.isNaN(v)
  );
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [key, score] = entries[0];
  return { label: DIMENSION_LABELS[key] || humanizeKey(key), score };
}

function fmtDate(value?: string | number | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildTeaserFromCard(card: ShareCard): Teaser {
  const data = card.data || {};
  const sharedBy =
    (typeof data.owner_name === 'string' && data.owner_name) ||
    (typeof data.sharer_name === 'string' && data.sharer_name) ||
    (typeof data.author_name === 'string' && data.author_name) ||
    undefined;
  const sharedAt =
    fmtDate(card.created_at) ||
    fmtDate(data.shared_at) ||
    fmtDate(data.created_at);

  switch (card.type as ShareCardType) {
    case 'trident': {
      const top = topDimension(data.dimension_scores);
      const insights: string[] = [];
      if (data.verdict) insights.push(String(data.verdict));
      if (top) insights.push(`Leading dimension: ${top.label} (${top.score}/100).`);
      return {
        eyebrow: 'Match Scorecard',
        name: data.candidate_name || 'Candidate',
        headline: data.verdict || 'Strong Primary',
        headlineSub: data.role || 'Assessed for Executive Role',
        metric:
          typeof data.composite_score === 'number'
            ? { label: 'Composite Score', value: `${data.composite_score}/100` }
            : undefined,
        insights: insights.slice(0, 2),
        sharedBy,
        sharedAt,
      };
    }

    case 'progress': {
      const dims = [
        { old: data.strategic_old, new: data.strategic_new, label: 'Strategic Orientation' },
        { old: data.adaptability_old, new: data.adaptability_new, label: 'Cross-border Adaptability' },
        { old: data.influence_old, new: data.influence_new, label: 'Stakeholder Influence' },
      ].filter(
        (d) => typeof d.old === 'number' && typeof d.new === 'number'
      ) as { old: number; new: number; label: string }[];
      const topGain = dims
        .map((d) => ({ ...d, delta: d.new - d.old }))
        .sort((a, b) => b.delta - a.delta)[0];
      const insights: string[] = [];
      if (topGain && topGain.delta > 0) {
        insights.push(`+${topGain.delta} pts in ${topGain.label}.`);
      }
      insights.push('Cross-border readiness strengthened over the quarter.');
      return {
        eyebrow: 'Quarterly Progress',
        name: data.name || 'Executive',
        headline: `${data.readiness_old || 'Developing'} → ${data.readiness_new || 'Advanced'}`,
        headlineSub: 'Cross-border readiness, 3-month change',
        metric: undefined,
        insights: insights.slice(0, 2),
        sharedBy,
        sharedAt,
      };
    }

    case 'assessment':
    default: {
      const insights: string[] = [];
      if (Array.isArray(data.keyFindings)) {
        for (const f of data.keyFindings) {
          if (typeof f === 'string' && f.trim()) insights.push(f.trim());
          if (insights.length >= 2) break;
        }
      }
      if (insights.length === 0) {
        const top = topDimension(data.dimension_scores);
        if (top) insights.push(`Strongest dimension: ${top.label} (${top.score}/100).`);
      }
      const readiness = data.cross_border_readiness;
      const hasReadiness =
        readiness && (readiness.label || typeof readiness.score === 'number');
      return {
        eyebrow: 'Assessment',
        name: data.name || 'Executive',
        headline: data.archetype || 'Strategic Architect',
        headlineSub: data.tagline,
        metric: hasReadiness
          ? {
              label: 'Cross-border Readiness',
              value: `${readiness.label || 'Advanced'}${
                typeof readiness.score === 'number' ? ` · ${readiness.score}/100` : ''
              }`,
            }
          : undefined,
        insights: insights.slice(0, 2),
        sharedBy,
        sharedAt,
      };
    }
  }
}

/** Build a teaser from the newer assessment_shares SharedAssessmentPayload shape. */
function buildTeaserFromPayload(payload: SharedAssessmentPayload): Teaser {
  const insights: string[] = [];
  const dims = payload.dimensions || [];
  const sorted = [...dims].sort(
    (a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0)
  );
  if (sorted[0]) {
    insights.push(
      `Leading dimension: ${sorted[0].name} (${Math.round(sorted[0].score)}/100).`
    );
  }
  if (payload.composite_interpretation) {
    insights.push(String(payload.composite_interpretation).slice(0, 240));
  } else if (sorted[sorted.length - 1]) {
    const w = sorted[sorted.length - 1];
    insights.push(
      `Priority growth: ${w.name} (${Math.round(w.score)}/100).`
    );
  }

  const headline = payload.archetype || payload.overall_tier || 'Leadership Profile';
  const headlineSub = payload.archetype_description
    ? String(payload.archetype_description).slice(0, 180)
    : payload.assessment_name || 'Executive Assessment';

  return {
    eyebrow: payload.assessment_code
      ? `${payload.assessment_code} · Assessment Result`
      : 'Assessment Result',
    name: 'Shared Result',
    headline,
    headlineSub,
    metric: {
      label: payload.assessment_code ? `${payload.assessment_code} Composite Score` : 'Composite Score',
      value: `${Math.round(payload.overall_score)}/100${
        payload.overall_tier ? ` · ${payload.overall_tier}` : ''
      }`,
    },
    insights: insights.slice(0, 2),
    sharedBy:
      (typeof (payload as { sharer_name?: string }).sharer_name === 'string' &&
        (payload as { sharer_name?: string }).sharer_name) ||
      undefined,
    sharedAt:
      fmtDate((payload as { shared_at?: string }).shared_at) ||
      fmtDate((payload as { created_at?: string }).created_at),
  };
}

/** SharedAssessmentPayload-aware dimension table rows (extra panel when payload available). */
interface PayloadDimsRow {
  label: string;
  score: number;
  tier: string;
}
function getDimsRows(payload: SharedAssessmentPayload): PayloadDimsRow[] {
  return (payload.dimensions || []).map((d) => ({
    label: d.name,
    score: typeof d.score === 'number' ? d.score : 0,
    tier: d.tier || '',
  }));
}

function V1Divider({ subtle = false }: { subtle?: boolean }) {
  return (
    <div
      role="presentation"
      style={{ height: 1, background: subtle ? V1.borderSubtle : V1.border }}
    />
  );
}

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareCard, setShareCard] = useState<ShareCard | null>(null);
  const [sharedPayload, setSharedPayload] = useState<SharedAssessmentPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    loadShareData(id);
  }, [id]);

  /**
   * Y1-4 dual-fallback loader:
   * 1. Legacy share_cards path (public_uuid) — Trident/progress/cards pre-Y1
   * 2. Newer assessment_shares capability-URL path (/api/assessments/meta?action=share&token=X)
   *    — Assessment share links created via createShareLink / POST share endpoint.
   */
  const loadShareData = async (publicId: string) => {
    try {
      // 1. Try legacy share_cards table via supabase direct
      const card = await getShareCard(publicId);
      if (card) {
        setShareCard(card);
        return;
      }

      // 2. Fallback: assessment_shares capability token via public API
      const api = await fetch(`/api/assessments/meta?action=share&token=${encodeURIComponent(publicId)}`);
      if (api.ok) {
        const body = await api.json();
        if (body?.ok && body?.payload) {
          setSharedPayload(body.payload as SharedAssessmentPayload);
          return;
        }
        if (body?.error) {
          setError(body.error);
          return;
        }
      }

      setError('Share card not found');
    } catch (e) {
      console.error('Failed to load share card:', e);
      setError('Failed to load share card');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading: V1 skeleton, no spinner ──────────────────────────────
  if (isLoading) {
    return (
      <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
        <style>{`
          @keyframes v1-shimmer {
            0% { background-position: -480px 0; }
            100% { background-position: 480px 0; }
          }
          .v1-skel {
            background: linear-gradient(90deg, ${V1.surfaceAlt} 0%, ${V1.borderSubtle} 50%, ${V1.surfaceAlt} 100%);
            background-size: 960px 100%;
            animation: v1-shimmer 1.4s linear infinite;
          }
          @keyframes v1-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          .v1-enter { animation: v1-fade-in ${V1.durNormal}ms ${V1.ease} both; }
        `}</style>

        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `20px ${V1.shellPad}px`, borderBottom: `1px solid ${V1.border}`,
        }}>
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <span className="v1-mono" style={{
            fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
          }}>
            Shared readout
          </span>
        </header>

        {/* Skeleton body */}
        <main style={{
          maxWidth: 640, margin: '0 auto',
          padding: `${V1.marketingPadY}px 24px`,
        }}>
          <div className="v1-skel" style={{ height: 12, width: 140, marginBottom: 24 }} />
          <div className="v1-skel" style={{ height: 32, width: '70%', marginBottom: 12 }} />
          <div className="v1-skel" style={{ height: 20, width: '50%', marginBottom: 32 }} />
          <div style={{
            border: `1px solid ${V1.border}`, background: V1.surface, padding: 32,
          }}>
            <div className="v1-skel" style={{ height: 12, width: 120, marginBottom: 16 }} />
            <div className="v1-skel" style={{ height: 24, width: '60%', marginBottom: 10 }} />
            <div className="v1-skel" style={{ height: 16, width: '40%', marginBottom: 24 }} />
            <div style={{ height: 1, background: V1.border, margin: '0 -32px 24px' }} />
            <div className="v1-skel" style={{ height: 12, width: 100, marginBottom: 14 }} />
            <div className="v1-skel" style={{ height: 14, width: '90%', marginBottom: 8 }} />
            <div className="v1-skel" style={{ height: 14, width: '75%' }} />
          </div>
        </main>
      </div>
    );
  }

  // ── Error / not found: V1 EmptyState ──────────────────────────────
  if (error || (!shareCard && !sharedPayload)) {
    return (
      <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `20px ${V1.shellPad}px`, borderBottom: `1px solid ${V1.border}`,
        }}>
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <span className="v1-mono" style={{
            fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
          }}>
            Shared readout
          </span>
        </header>

        <main style={{
          maxWidth: 480, margin: '0 auto',
          padding: `${V1.marketingPadY}px 24px`,
          textAlign: 'center',
        }}>
          <div className="v1-mono" style={{
            fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
            marginBottom: 16,
          }}>
            404 · Readout unavailable
          </div>
          <h1 style={{
            fontFamily: V1.displayFont, fontSize: V1.textH2, color: V1.text,
            fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
            lineHeight: V1.leadingHeading, margin: '0 0 12px',
          }}>
            This readout can&rsquo;t be shown
          </h1>
          <p style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary,
            lineHeight: 1.5, margin: '0 0 32px',
          }}>
            {error || 'This share link may have expired or been revoked by the original owner.'}
          </p>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 48, padding: '14px 24px',
            background: V1.teal800, color: V1.white,
            border: 'none', fontFamily: V1.bodyFont, fontSize: 15, fontWeight: V1.fwSemibold,
            textDecoration: 'none', boxSizing: 'border-box',
            transition: `background ${V1.durFast}ms ${V1.ease}`,
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal900)}
            onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}>
            Go home →
          </Link>
        </main>
      </div>
    );
  }

  const teaser = shareCard
    ? buildTeaserFromCard(shareCard)
    : buildTeaserFromPayload(sharedPayload!);
  const seoTitle = `${teaser.headline} — ${teaser.eyebrow} | NEXUS`;
  const seoDescription =
    `${teaser.eyebrow} from NEXUS — ${teaser.headline}${
      teaser.metric ? ` · ${teaser.metric.label}: ${teaser.metric.value}` : ''
    }. Experience the full version to unlock your complete report.`;
  const payloadDims = sharedPayload ? getDimsRows(sharedPayload) : [];

  const sharedByLine = teaser.sharedBy
    ? `Shared by ${teaser.sharedBy}${teaser.sharedAt ? ` · ${teaser.sharedAt}` : ''}`
    : teaser.sharedAt
      ? `Shared · ${teaser.sharedAt}`
      : 'Shared readout';

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <style>{`
        @keyframes v1-fade-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .v1-enter { animation: v1-fade-in ${V1.durNormal}ms ${V1.ease} both; }
      `}</style>

      <SEO
        title={seoTitle}
        description={seoDescription}
        path={`/share/${id}`}
        ogImage={shareCard?.image_url || undefined}
      />

      {/* ── Header: wordmark (left) + "Shared readout" (right, mono) ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `20px ${V1.shellPad}px`, borderBottom: `1px solid ${V1.border}`,
      }}>
        <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
          NEXUS<span className="v1-dot">.</span>
        </Link>
        <span className="v1-mono" style={{
          fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted,
        }}>
          Shared readout
        </span>
      </header>

      {/* ── Main: readout content (simplified, no right rail) ── */}
      <main className="v1-enter" style={{
        maxWidth: 640, margin: '0 auto',
        padding: `${V1.marketingPadY}px 24px 48px`,
      }}>
        {/* Eyebrow */}
        <div className="v1-mono" style={{
          fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted,
          marginBottom: 16,
        }}>
          {teaser.eyebrow}
        </div>

        {/* Name (serif display) */}
        <h1 style={{
          fontFamily: V1.displayFont, fontSize: 44, color: V1.text,
          fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
          lineHeight: V1.leadingDisplay, margin: '0 0 10px',
        }}>
          {teaser.name}
        </h1>

        {/* Headline (teal accent, serif) */}
        <div style={{
          fontFamily: V1.displayFont, fontSize: 22, color: V1.teal700,
          fontWeight: V1.fwRegular, lineHeight: 1.3, marginBottom: 8,
        }}>
          {teaser.headline}
        </div>

        {/* Headline sub (inter, secondary) */}
        {teaser.headlineSub && (
          <p style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary,
            lineHeight: 1.5, margin: '0 0 32px',
          }}>
            {teaser.headlineSub}
          </p>
        )}

        {/* ── Readout card ── */}
        <article style={{
          border: `1px solid ${V1.border}`,
          background: V1.surface,
        }}>
          {/* Metric row */}
          {teaser.metric && (
            <>
              <div style={{
                padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                gap: 12,
              }}>
                <span className="v1-mono" style={{
                  fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase', color: V1.textMuted,
                }}>
                  {teaser.metric.label}
                </span>
                <span style={{
                  fontFamily: V1.displayFont, fontSize: 22, color: V1.text,
                  fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
                  whiteSpace: 'nowrap',
                }}>
                  {teaser.metric.value}
                </span>
              </div>
              <V1Divider />
            </>
          )}

          {/* Key insights */}
          <div style={{ padding: '24px' }}>
            <div className="v1-mono" style={{
              fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted, marginBottom: 14,
            }}>
              Key insights
            </div>
            {teaser.insights.length > 0 ? (
              <ul style={{
                listStyle: 'none', margin: 0, padding: 0,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {teaser.insights.map((insight, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    lineHeight: 1.55, color: V1.textSecondary,
                  }}>
                    <span aria-hidden="true" style={{
                      flexShrink: 0, width: 6, height: 6,
                      background: V1.teal600, marginTop: 8,
                    }} />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textMuted,
                margin: 0, lineHeight: 1.55,
              }}>
                A preview of this profile is available in the full report.
              </p>
            )}
          </div>

          {/* Dimension breakdown (assessment_shares payloads only) */}
          {payloadDims.length > 0 && (
            <>
              <V1Divider />
              <div style={{ padding: '24px' }}>
                <div className="v1-mono" style={{
                  fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase', color: V1.textMuted, marginBottom: 14,
                }}>
                  Dimension breakdown
                </div>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  {payloadDims.map((d) => (
                    <div key={d.label}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        gap: 12, marginBottom: 6,
                      }}>
                        <span style={{
                          fontFamily: V1.bodyFont, fontSize: 13,
                          fontWeight: V1.fwMedium, color: V1.text,
                        }}>
                          {d.label}
                        </span>
                        <span className="v1-mono" style={{
                          fontSize: V1.textCaption, color: V1.textSecondary,
                          whiteSpace: 'nowrap', letterSpacing: V1.trackingMono,
                        }}>
                          {Math.round(d.score)}/100{d.tier ? ` · ${d.tier}` : ''}
                        </span>
                      </div>
                      {/* 2px progress bar — V1 standard */}
                      <div role="presentation" style={{
                        width: '100%', height: 2, background: V1.borderSubtle,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.max(0, Math.min(100, d.score))}%`,
                          height: '100%', background: V1.teal600,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Privacy / sharer banner */}
          <V1Divider subtle />
          <div style={{ padding: '16px 24px', background: V1.surfaceAlt }}>
            <p className="v1-mono" style={{
              fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted,
              margin: '0 0 6px', fontWeight: V1.fwSemibold,
            }}>
              Privacy
            </p>
            <p style={{
              fontFamily: V1.bodyFont, fontSize: V1.textCaption, color: V1.textMuted,
              margin: '0 0 6px', lineHeight: 1.5,
            }}>
              This share was created by the original assessment owner and contains no
              personally identifiable information. Share links can be revoked by the owner at
              any time.
            </p>
            <p style={{
              fontFamily: V1.bodyFont, fontSize: V1.textCaption, color: V1.textMuted,
              margin: 0, lineHeight: 1.5,
            }}>
              This is a preview. Full reports include executive narrative, archetype deep
              dive, prioritized development roadmap, and a downloadable branded PDF.
            </p>
          </div>
        </article>

        {/* Secondary text link — Sign in to unlock full report */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/login" style={{
            display: 'inline-block', padding: '11px 16px',
            fontFamily: V1.bodyFont, fontSize: V1.textBodySm, fontWeight: V1.fwMedium,
            color: V1.text, textDecoration: 'none',
            borderBottom: `1px solid ${V1.border}`,
            transition: `border-color ${V1.durFast}ms ${V1.ease}, color ${V1.durFast}ms ${V1.ease}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = V1.teal600;
            e.currentTarget.style.color = V1.teal700;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = V1.border;
            e.currentTarget.style.color = V1.text;
          }}>
            Sign in to unlock the full report →
          </Link>
        </div>
      </main>

      {/* ── Footer: "Shared by [name] · [date]" (mono, small) ── */}
      <footer style={{
        borderTop: `1px solid ${V1.border}`,
        padding: `20px ${V1.shellPad}px`,
        textAlign: 'center',
      }}>
        <div className="v1-mono" style={{
          fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.textMuted,
        }}>
          {sharedByLine}
        </div>
      </footer>

      {/* ── CTA bar at bottom: "Experience the full version →" (links to /nexus) ── */}
      <div style={{
        background: V1.teal900, padding: '32px 24px',
        textAlign: 'center',
      }}>
        <div className="v1-mono" style={{
          fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
          textTransform: 'uppercase', color: V1.onDarkMuted,
          marginBottom: 10,
        }}>
          The full version
        </div>
        <h2 style={{
          fontFamily: V1.displayFont, fontSize: 28, color: V1.onDark,
          fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
          lineHeight: V1.leadingHeading, margin: '0 0 20px',
        }}>
          See what NEXUS sees.
        </h2>
        <Link to="/nexus" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          minHeight: 48, padding: '14px 28px',
          background: V1.white, color: V1.teal900,
          border: 'none', fontFamily: V1.bodyFont, fontSize: 15, fontWeight: V1.fwSemibold,
          textDecoration: 'none', boxSizing: 'border-box',
          transition: `background ${V1.durFast}ms ${V1.ease}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal50)}
        onMouseLeave={(e) => (e.currentTarget.style.background = V1.white)}>
          Experience the full version →
        </Link>
      </div>
    </div>
  );
}
