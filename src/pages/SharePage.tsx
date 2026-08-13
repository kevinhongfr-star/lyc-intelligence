
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getShareCard, type ShareCard, type ShareCardType } from '../services/shareCardService';
import { SEO } from '@/components/seo/SEO';
import { DS, WHITE } from '@/tokens';

interface Teaser {
  eyebrow: string;
  name: string;
  headline: string;
  headlineSub?: string;
  metric?: { label: string; value: string };
  insights: string[];
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

function buildTeaser(card: ShareCard): Teaser {
  const data = card.data || {};

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
      };
    }
  }
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: DS.monoFont,
  fontSize: '11px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: DS.eyebrow,
  fontWeight: 600,
};

function Divider() {
  return <div style={{ height: '1px', background: DS.border }} />;
}

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareCard, setShareCard] = useState<ShareCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    loadShareCard(id);
  }, [id]);

  const loadShareCard = async (publicId: string) => {
    try {
      const card = await getShareCard(publicId);
      if (card) {
        setShareCard(card);
      } else {
        setError('Share card not found');
      }
    } catch (e) {
      console.error('Failed to load share card:', e);
      setError('Failed to load share card');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: DS.bgAlt,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          gap: '20px',
        }}
      >
        <div
          role="status"
          aria-busy="true"
          aria-label="Preparing profile"
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${DS.border}`,
            borderTopColor: DS.accent,
            animation: 'echo-spin 1s linear infinite',
          }}
        />
        <div style={{ ...eyebrowStyle, color: DS.muted }}>Preparing profile</div>
      </div>
    );
  }

  if (error || !shareCard) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: DS.bgAlt,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '420px' }}>
          <div style={{ ...eyebrowStyle, marginBottom: '12px' }}>LYC Intelligence</div>
          <h1
            style={{
              fontFamily: DS.headingFont,
              fontSize: '28px',
              fontWeight: 700,
              color: DS.text,
              marginBottom: '8px',
              margin: '0 0 8px',
            }}
          >
            Profile unavailable
          </h1>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, marginBottom: '24px' }}>
            {error || 'This share card may have expired or been removed.'}
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              minHeight: '44px',
              padding: '12px 24px',
              background: DS.accent,
              color: WHITE,
              border: 'none',
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              lineHeight: '20px',
              boxSizing: 'border-box',
              transition: `background ${DS.transition}`,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = DS.accentHover)}
            onMouseOut={(e) => (e.currentTarget.style.background = DS.accent)}
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const teaser = buildTeaser(shareCard);
  const seoTitle = `${teaser.name} — ${teaser.headline} | LYC Intelligence`;
  const seoDescription = `${teaser.name}'s ${teaser.eyebrow.toLowerCase()} profile from LYC Intelligence — a teaser of their cross-border leadership results. Take the assessment yourself to unlock your full report.`;

  return (
    <div style={{ minHeight: '100vh', background: DS.bgAlt, padding: '32px 16px 48px' }}>
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={`/share/${id}`}
        ogImage={shareCard.image_url || undefined}
      />

      <div
        style={{
          maxWidth: '560px',
          margin: '0 auto',
          animation: 'echo-fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {/* Brand wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: DS.text,
              fontWeight: 600,
            }}
          >
            LYC Intelligence
          </span>
        </div>

        {/* Report card */}
        <article
          style={{
            background: DS.card,
            border: `1px solid ${DS.cardBorder}`,
            boxShadow: DS.shadow,
            animation: 'echo-slide-in-up 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Header */}
          <div style={{ padding: '28px 24px 24px' }}>
            <div style={{ ...eyebrowStyle, marginBottom: '12px' }}>{teaser.eyebrow}</div>
            <h1
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(28px, 8vw, 36px)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: DS.text,
                margin: '0 0 10px',
              }}
            >
              {teaser.name}
            </h1>
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: '22px',
                fontWeight: 600,
                color: DS.accent,
                lineHeight: 1.2,
              }}
            >
              {teaser.headline}
            </div>
            {teaser.headlineSub && (
              <div
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  color: DS.muted,
                  marginTop: '8px',
                  lineHeight: 1.5,
                }}
              >
                {teaser.headlineSub}
              </div>
            )}
          </div>

          {/* Metric */}
          {teaser.metric && (
            <>
              <Divider />
              <div
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: '12px',
                }}
              >
                <span style={eyebrowStyle}>{teaser.metric.label}</span>
                <span
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: '20px',
                    fontWeight: 700,
                    color: DS.text,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {teaser.metric.value}
                </span>
              </div>
            </>
          )}

          {/* Key insights */}
          <Divider />
          <div style={{ padding: '24px' }}>
            <div style={{ ...eyebrowStyle, marginBottom: '14px' }}>Key Insights</div>
            {teaser.insights.length > 0 ? (
              <ul
                style={{
                  listStyle: 'none',
                  margin: '0',
                  padding: '0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {teaser.insights.map((insight, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      fontFamily: DS.bodyFont,
                      fontSize: '14px',
                      lineHeight: 1.55,
                      color: DS.textSecondary,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        width: '6px',
                        height: '6px',
                        background: DS.accent,
                        marginTop: '7px',
                      }}
                    />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  color: DS.muted,
                  margin: '0',
                  lineHeight: 1.55,
                }}
              >
                A preview of this profile is available in the full report.
              </p>
            )}
          </div>

          {/* Locked teaser note */}
          <div
            style={{
              padding: '14px 24px',
              background: DS.bgAlt,
              borderTop: `1px solid ${DS.border}`,
            }}
          >
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '12px',
                color: DS.muted,
                margin: '0',
                lineHeight: 1.5,
              }}
            >
              This is a preview. The full report includes all dimensions, narrative analysis,
              and a development roadmap.
            </p>
          </div>
        </article>

        {/* Primary CTA */}
        <div style={{ marginTop: '24px' }}>
          <Link
            to="/assessments"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px',
              padding: '14px 24px',
              background: DS.accent,
              color: WHITE,
              border: 'none',
              fontFamily: DS.bodyFont,
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              boxSizing: 'border-box',
              transition: `background ${DS.transition}`,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = DS.accentHover)}
            onMouseOut={(e) => (e.currentTarget.style.background = DS.accent)}
          >
            Take this assessment yourself →
          </Link>
        </div>

        {/* Sign-in prompt */}
        <div style={{ marginTop: '12px' }}>
          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '48px',
              padding: '13px 24px',
              background: 'transparent',
              color: DS.textSecondary,
              border: `1px solid ${DS.cardBorder}`,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              boxSizing: 'border-box',
              transition: `border-color ${DS.transition}, color ${DS.transition}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = DS.accent;
              e.currentTarget.style.color = DS.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = DS.cardBorder;
              e.currentTarget.style.color = DS.textSecondary;
            }}
          >
            Sign in to unlock your full report
          </Link>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: '32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '11px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: DS.muted,
            }}
          >
            Powered by LYC Intelligence
          </div>
          <Link
            to="/nexus/chat"
            style={{
              display: 'inline-block',
              minHeight: '44px',
              padding: '11px 16px',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 500,
              color: DS.text,
              textDecoration: 'none',
              borderBottom: `1px solid ${DS.border}`,
              boxSizing: 'border-box',
              transition: `border-color ${DS.transition}, color ${DS.transition}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = DS.accent;
              e.currentTarget.style.color = DS.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = DS.border;
              e.currentTarget.style.color = DS.text;
            }}
          >
            Discuss your results with NEXUS AI →
          </Link>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '11px',
              color: DS.muted,
              marginTop: '4px',
            }}
          >
            © 2026 LYC Intelligence
          </div>
        </footer>
      </div>
    </div>
  );
}
