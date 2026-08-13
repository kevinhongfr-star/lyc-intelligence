import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { DS } from '@/tokens';
import { ArrowRight, Menu, X, Lock, Layers, BadgeDollarSign, UserCheck } from 'lucide-react';
import { ASSESSMENT_CATALOG, FLAGSHIP_KEYS, SHIFT_SUITE_KEYS, ADVISORY_PRODUCT_KEYS, type AssessmentInfo } from '@/assessments/catalog';
import { UnifiedFooter } from '@/components/layout/UnifiedFooter';
import { SEO } from '@/components/seo/SEO';
import { trackCTA, trackNexusChatInitiation, trackAssessmentStart } from '@/analytics/eventTracker';
import { ResultMockup, NexusChatMockup } from '@/components/visual/ProductMockup';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';

// ── 5 Subscription Tiers (Canonical NEXUS Pricing v1.0) ──
interface PricingTierRow {
  key: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
  name: string;
  label: string;
  priceUsd: string;
  miles: number;
  features: string[];
  highlight?: boolean;
  cta: string;
  ctaHref: string;
}

const SUBSCRIPTION_TIERS: PricingTierRow[] = [
  {
    key: 'explorer',
    name: 'Executive Introduction',
    label: 'Complimentary access',
    priceUsd: '—',
    miles: 0,
    features: [
      'NEXUS AI — introductory sessions',
      'Framework exploration and sample outputs',
      'Assessment previews (no personalised reports)',
      'Community forum',
    ],
    cta: 'Begin exploration',
    ctaHref: '/nexus/chat',
  },
  {
    key: 'starter',
    name: 'Starter',
    label: 'Engaged executive',
    priceUsd: '$25',
    miles: 50,
    features: [
      'Unlimited NEXUS AI',
      'Full framework awareness',
      'Miles earning enabled',
      'Full assessments — pay per mile',
      'Detailed AI reports',
    ],
    cta: 'Start with Starter',
    ctaHref: '/pricing',
  },
  {
    key: 'pro',
    name: 'Pro',
    label: 'Serious transition',
    priceUsd: '$99',
    miles: 150,
    features: [
      'Everything in Starter',
      '360° rater access',
      'Peer benchmarking deep',
      'Historical tracking',
      'Content library',
    ],
    highlight: true,
    cta: 'Upgrade to Pro',
    ctaHref: '/pricing',
  },
  {
    key: 'executive',
    name: 'Executive',
    label: 'Board and C-suite',
    priceUsd: '$199',
    miles: 300,
    features: [
      'Everything in Pro',
      'Executive reviews',
      'Events access',
      'Priority support',
    ],
    cta: 'Go Executive',
    ctaHref: '/pricing',
  },
  {
    key: 'council',
    name: 'Council',
    label: 'Principal investors + board chairs',
    priceUsd: '$499',
    miles: 600,
    features: [
      'Everything in Executive',
      'Council community',
      'Live sessions / workshops',
      'Dedicated concierge',
    ],
    cta: 'Apply for Council',
    ctaHref: '/pricing',
  },
];

// ── 3 Capability cards
// Phase 9 Batch 6 ticket #1353: remove "Miles economy" from visitor-facing capability cards.
// Ticket #1351: fix 11→6 diagnostic count.
const CAPABILITIES = [
  {
    icon: Layers,
    title: 'Framework-aware conversations',
    desc: 'NEXUS knows all 6 leadership assessment frameworks end-to-end. Ask about positioning, governance, cross-border fit, or team transitions — it speaks the language of executive leadership, not generic advice.',
    href: '/nexus/chat',
    cta: 'Start a conversation',
  },
  {
    icon: BadgeDollarSign,
    title: 'Simple transparent pricing',
    desc: 'Pay for assessments à la carte from $99, or subscribe for a monthly allocation and deeper benefits. No fluff, no hidden fees.',
    href: '/pricing',
    cta: 'View pricing',
  },
  {
    icon: UserCheck,
    title: 'Personalized recommendations',
    desc: 'Based on what you discuss, NEXUS surfaces the right diagnostic at the right moment — not generic personality tests, but targeted assessments matched to your current transition point.',
    href: '/assessments',
    cta: 'Browse assessments',
  },
];

function TierBadge({ label, color = DS.accent }: { label: string; color?: string }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: color,
        color: DS.bg,
        fontFamily: DS.monoFont,
        fontSize: '10px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
 
      }}
    >
      {label}
    </div>
  );
}

function AssessmentCard({ a, wide }: { a: AssessmentInfo; wide?: boolean }) {
  // Phase 9 Batch 6 ticket #1353: USD-first for visitors. Miles ≈ USD.
  const priceUsd = a.priceMiles; // miles and USD are 1:1
  return (
    <a
      href={`/assessment/${a.code.toLowerCase()}`}
      onClick={() => {
        trackCTA({ location: 'assessment_card', label: `Assessment: ${a.code}`, destination: `/assessment/${a.code.toLowerCase()}`, context_id: a.code });
        trackAssessmentStart(a.code, a.name, 'landing');
      }}
      className="card-hover"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: DS.card,
        border: `1px solid ${DS.cardBorder}`,
 
        padding: wide ? '32px 28px' : '24px 20px',
        boxShadow: DS.shadow,
        transition: 'all 0.25s ease',
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.2em',
              // Ticket #1355: eyebrow labels are light gray, not accent
              color: DS.eyebrow,
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {a.code}
          </div>
          <h3
            style={{
              fontFamily: DS.headingFont,
              fontSize: wide ? '22px' : '17px',
              fontWeight: 700,
              color: DS.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {a.name}
          </h3>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '2px',
            fontFamily: DS.headingFont,
            fontSize: wide ? '28px' : '20px',
            fontWeight: 700,
            color: DS.text,
            lineHeight: 1,
          }}
        >
          ${priceUsd}
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: '9px',
              letterSpacing: '0.1em',
              fontWeight: 500,
              textTransform: 'uppercase',
              marginLeft: '6px',
              color: DS.mutedDim,
            }}
          >
            USD
          </span>
        </span>
      </div>
      <p
        style={{
          fontFamily: DS.bodyFont,
          fontSize: '13px',
          lineHeight: 1.55,
          color: DS.textSecondary,
          margin: '0 0 16px',
          minHeight: wide ? '48px' : '60px',
        }}
      >
        {a.tagline || `${a.b2cName} — ${a.dimensions.length} dimensions, ${a.archetype_count} archetypes.`}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: DS.monoFont,
          fontSize: '11px',
          color: DS.muted,
          letterSpacing: '0.04em',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <span>{a.total_questions} Q</span>
        <span style={{ color: DS.cardBorder }}>·</span>
        <span>{a.duration_minutes} MIN</span>
        <span style={{ color: DS.cardBorder }}>·</span>
        <span>{a.archetype_count} ARCHETYPES</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${DS.border}`,
          paddingTop: '12px',
        }}
      >
        <span
          style={{
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            fontWeight: 600,
            color: DS.text,
          }}
        >
          Learn more
        </span>
        <ArrowRight style={{ width: 14, height: 14, color: DS.text }} />
      </div>
    </a>
  );
}

function renderTierGroup(label: string, accent: string, keys: string[]) {
  const assessments = keys.map(k => ASSESSMENT_CATALOG[k]).filter(Boolean);
  if (assessments.length === 0) return null;
  const wide = keys.length === 1; // Flagship single card = wide
  return (
    <section id={`tier-${label.toLowerCase().replace(/\s+/g, '-')}`} style={{ marginBottom: '72px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px', borderBottom: `1px solid ${DS.border}`, paddingBottom: '12px' }}>
        <div>
          <div
            style={{
              display: 'inline-block',
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.2em',
              // Ticket #1355: eyebrow labels → #9CA3AF light gray per v1.2 brand spec
              color: DS.eyebrow,
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            {assessments.length} {assessments.length === 1 ? 'ASSESSMENT' : 'ASSESSMENTS'}
          </div>
          <h3
            style={{
              fontFamily: DS.headingFont,
              fontSize: '24px',
              fontWeight: 700,
              color: DS.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {label}
          </h3>
        </div>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '11px',
            color: DS.muted,
            letterSpacing: '0.1em',
          }}
          >
            {/* Ticket #1353: USD labels on catalog tiers */}
            {assessments.length === 1
              ? 'FROM $99 USD'
              : label.includes('Premium') ? 'PREMIUM · $149 USD' : 'STANDARD · $99 USD'}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: wide ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {assessments.map(a => (
          <AssessmentCard key={a.code} a={a} wide={wide} />
        ))}
      </div>
    </section>
  );
}

function PricingTableCard({ t }: { t: PricingTierRow }) {
  const highlight = !!t.highlight;
  return (
    <div
      className="card-hover"
      style={{
        background: highlight ? DS.bgDark : DS.card,
        border: highlight ? `2px solid ${DS.accent}` : `1px solid ${DS.cardBorder}`,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: highlight ? `0 0 0 1px ${DS.accent}14, 0 20px 50px ${DS.accent}18` : DS.shadow,
        position: 'relative',
      }}
    >
      {highlight && (
        <div
          style={{
            position: 'absolute',
            top: '-1px',
            right: '24px',
            transform: 'translateY(-50%)',
            background: DS.accent,
            color: DS.bg,
            fontFamily: DS.monoFont,
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.2em',
            padding: '4px 10px',
            textTransform: 'uppercase',
          }}
        >
          Recommended
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <TierBadge label={t.key.toUpperCase()} color={highlight ? DS.accent : DS.bgDark} />
      </div>
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: '22px',
          fontWeight: 700,
          color: highlight ? DS.bg : DS.text,
          marginBottom: '4px',
          letterSpacing: '-0.01em',
        }}
      >
        {t.name}
      </div>
      <div
        style={{
          fontFamily: DS.bodyFont,
          fontSize: '12px',
          color: highlight ? 'rgba(255,255,255,0.6)' : DS.muted,
          marginBottom: '16px',
        }}
      >
        {t.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
        <span
          style={{
            fontFamily: DS.headingFont,
            fontSize: '28px',
            fontWeight: 700,
            color: highlight ? DS.bg : DS.text,
            lineHeight: 1,
          }}
        >
          {t.priceUsd}
        </span>
        {t.priceUsd !== '—' && (
          <span
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: highlight ? 'rgba(255,255,255,0.5)' : DS.muted,
            }}
          >
            /mo
          </span>
        )}
      </div>
      {/* Ticket #1353: Miles made secondary (small, muted) — visitor-facing page shows USD as primary */}
      {t.priceUsd !== '—' && t.miles > 0 && (
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '10px',
            color: highlight ? 'rgba(255,255,255,0.4)' : DS.mutedDim,
            letterSpacing: '0.1em',
            marginBottom: '18px',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {t.miles} mi included / mo
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {t.features.map(f => (
          <li
            key={f}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              fontFamily: DS.bodyFont,
              fontSize: '12.5px',
              lineHeight: 1.5,
              color: highlight ? 'rgba(255,255,255,0.8)' : DS.textSecondary,
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                marginTop: '7px',
                background: DS.accent,
                flexShrink: 0,
              }}
            />
            {f}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto' }}>
        <a
          href={t.ctaHref}
          onClick={() => trackCTA({ location: 'pricing_tier', label: `Pricing: ${t.cta}`, destination: t.ctaHref, context_id: t.key })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 18px',
            background: highlight ? DS.accent : DS.bgDark,
            color: DS.bg,
            textDecoration: 'none',
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            transition: 'background 0.2s ease',
            boxSizing: 'border-box',
          }}
        >
          {t.cta} <ArrowRight style={{ width: 13, height: 13 }} />
        </a>
      </div>
    </div>
  );
}

export function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, color: DS.text }}>
      <SEO page="landing" />

      <style>{`
        @keyframes radar-draw {
          from { stroke-dashoffset: 800; opacity: 0; }
          to { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes radar-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        .radar-accent {
          stroke-dasharray: 800;
          animation: radar-draw 350ms ease-out both;
        }
        .radar-pulse {
          transform-origin: 210px 210px;
          animation: radar-pulse 2.2s ease-in-out infinite;
        }
        .hero-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 48px;
          align-items: center;
        }
        .hero-text { grid-column: 1 / span 3; }
        .hero-visual { grid-column: 4 / span 3; }
        .lineup-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }
        .lineup-cpi { grid-column: 1 / span 6; grid-row: span 2; }
        .lineup-leap { grid-column: 7 / span 3; }
        .lineup-spark { grid-column: 10 / span 3; }
        .lineup-impact { grid-column: 7 / span 6; }
        .nexus-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 32px;
          align-items: center;
        }
        .nexus-text { grid-column: 1 / span 6; }
        .nexus-visual { grid-column: 8 / span 5; }
        @media (max-width: 1023px) {
          .lineup-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .lineup-cpi { grid-column: 1 / span 2; grid-row: auto; }
          .lineup-leap { grid-column: 1 / span 1; }
          .lineup-spark { grid-column: 2 / span 1; }
          .lineup-impact { grid-column: 1 / span 2; }
        }
        @media (max-width: 767px) {
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .hero-text, .hero-visual { grid-column: auto; }
          .hero-visual { order: -1; }
          .lineup-grid {
            grid-template-columns: 1fr;
          }
          .lineup-cpi, .lineup-leap, .lineup-spark, .lineup-impact {
            grid-column: 1 / -1;
          }
          .nexus-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .nexus-text, .nexus-visual { grid-column: auto; }
          .nexus-visual { order: -1; }
        }
      `}</style>

      {/* SECTION 1: HERO (V2-1 / V2-5 / V2-6) */}
      <section
        style={{
          background: DS.bg,
          padding: 'clamp(72px, 10vw, 120px) 32px',
          maxWidth: '1280px',
          margin: '0 auto',
        }}
      >
        <div className="hero-grid">
          <div className="hero-text">
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.28em',
                color: DS.eyebrow,
                marginBottom: '16px',
              }}
            >
              POWERED BY NEXUS
            </div>
            <h1
              style={{
                fontFamily: DS.headingFont,
                fontWeight: 700,
                fontSize: 'clamp(38px, 5.6vw, 62px)',
                lineHeight: 1.08,
                letterSpacing: '-0.015em',
                color: DS.text,
                marginBottom: '16px',
                maxWidth: '620px',
                margin: 0,
              }}
            >
              Executive Intelligence, Built for Leaders Who Think
            </h1>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 'clamp(15px, 1.6vw, 18px)',
                color: DS.textSecondary,
                maxWidth: '560px',
                lineHeight: 1.6,
                marginBottom: '36px',
                marginTop: '16px',
              }}
            >
              11 leadership assessments built on executive search methodology. Powered by NEXUS, LYC's intelligence system.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="/assessments"
                onClick={() => trackCTA({ location: 'hero_v2', label: 'Explore Assessments', destination: '/assessments' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 32px',
                  background: DS.accent,
                  color: DS.bg,
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  textDecoration: 'none',
                  transition: DS.transition,
                }}
              >
                Explore Assessments <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
              <a
                href="#nexus"
                onClick={() => trackCTA({ location: 'hero_v2', label: 'What is NEXUS?', destination: '#nexus' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '16px 32px',
                  border: `1px solid ${DS.border}`,
                  color: DS.text,
                  background: 'transparent',
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  textDecoration: 'none',
                  transition: DS.transition,
                }}
              >
                What is NEXUS?
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <svg
              viewBox="0 0 420 420"
              width="100%"
              height="auto"
              role="img"
              aria-label="6 leadership dimensions radar — Strategic Positioning highlighted"
            >
              <g transform="translate(210, 210)">
                {/* 4 concentric radar grid polygons */}
                {[60, 110, 155, 195].map((r, i) => {
                  const pts = [];
                  for (let j = 0; j < 6; j++) {
                    const angle = (Math.PI / 3) * j - Math.PI / 2;
                    pts.push(`${Math.cos(angle) * r},${Math.sin(angle) * r}`);
                  }
                  return (
                    <polygon
                      key={i}
                      points={pts.join(' ')}
                      fill="none"
                      stroke={DS.border}
                      strokeWidth="1"
                    />
                  );
                })}

                {/* 6 axis lines from center */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const angle = (Math.PI / 3) * i - Math.PI / 2;
                  const isAccent = i === 0;
                  return (
                    <line
                      key={i}
                      x1="0"
                      y1="0"
                      x2={Math.cos(angle) * 195}
                      y2={Math.sin(angle) * 195}
                      stroke={isAccent ? DS.accent : DS.border}
                      strokeWidth={isAccent ? 2 : 1}
                      className={isAccent ? 'radar-accent' : ''}
                    />
                  );
                })}

                {/* Sample data polygon — light fill */}
                <polygon
                  points={(() => {
                    const vals = [165, 120, 100, 130, 90, 115];
                    return vals.map((v, i) => {
                      const angle = (Math.PI / 3) * i - Math.PI / 2;
                      return `${Math.cos(angle) * v},${Math.sin(angle) * v}`;
                    }).join(' ');
                  })()}
                  fill={`${DS.accent}10`}
                  stroke={DS.mutedDim}
                  strokeWidth="1"
                />

                {/* Strategic Positioning accent data point with pulse */}
                <g className="radar-pulse">
                  <circle
                    cx={Math.cos(-Math.PI / 2) * 165}
                    cy={Math.sin(-Math.PI / 2) * 165}
                    r="8"
                    fill={DS.accent}
                    opacity="0.18"
                  />
                </g>
                <circle
                  cx={Math.cos(-Math.PI / 2) * 165}
                  cy={Math.sin(-Math.PI / 2) * 165}
                  r="5"
                  fill={DS.accent}
                />
              </g>

              {/* Dimension labels around perimeter */}
              {[
                { label: 'Strategic Positioning', angle: -Math.PI / 2, accent: true },
                { label: 'Cross-Border Adaptability', angle: -Math.PI / 2 + Math.PI / 3 },
                { label: 'Stakeholder Influence', angle: -Math.PI / 2 + (2 * Math.PI) / 3 },
                { label: 'Execution Rigour', angle: -Math.PI / 2 + Math.PI },
                { label: 'Executive Presence', angle: -Math.PI / 2 + (4 * Math.PI) / 3 },
                { label: 'Governance & Fiduciary', angle: -Math.PI / 2 + (5 * Math.PI) / 3 },
              ].map((d, i) => {
                const r = 195;
                const labelR = r + 28;
                const x = 210 + Math.cos(d.angle) * labelR;
                const y = 210 + Math.sin(d.angle) * labelR;
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily={DS.monoFont}
                    fontSize="10"
                    textTransform="uppercase"
                    fill={d.accent ? DS.accent : DS.muted}
                    letterSpacing="0.12em"
                    fontWeight={d.accent ? 600 : 400}
                  >
                    {d.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* SECTION 2: HERO LINEUP (V2-3: 4 assessment cards) */}
      <section
        id="lineup"
        style={{
          background: DS.bg,
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 32px 96px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              textTransform: 'uppercase',
              fontSize: '10px',
              letterSpacing: '0.28em',
              color: DS.eyebrow,
              marginBottom: '12px',
            }}
          >
            FLAGSHIP + CORE
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontWeight: 700,
              fontSize: 'clamp(26px, 3vw, 34px)',
              color: DS.text,
              marginBottom: '12px',
              margin: '0 0 12px',
            }}
          >
            Four assessments. One methodology.
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              color: DS.muted,
              maxWidth: '620px',
              margin: '0 auto 48px',
              lineHeight: 1.6,
            }}
          >
            The flagship CPI for general executives, plus three targeted diagnostics for career transitions, AI readiness, and board governance.
          </p>
        </div>

        <div className="lineup-grid">
          {/* CPI — FLAGSHIP, cols 1-6, spans 2 rows */}
          <Card variant="accent" className="lineup-cpi" interactive={false} style={{ position: 'relative', height: '100%' }}>
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontFamily: DS.monoFont,
                fontSize: '9px',
                fontWeight: 600,
                textTransform: 'uppercase',
                padding: '3px 8px',
                background: DS.accent,
                color: DS.bg,
                letterSpacing: '0.16em',
              }}
            >
              FLAGSHIP
            </div>
            <CardHeader style={{ paddingBottom: '12px' }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: DS.eyebrow,
                  letterSpacing: '0.22em',
                  marginBottom: '6px',
                }}
              >
                5 dimensions · 12 archetypes · 36 questions
              </div>
              <CardTitle
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: DS.text,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Leadership Composite Index
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <CardDescription
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  color: DS.textSecondary,
                  lineHeight: 1.6,
                  margin: '0 0 24px',
                }}
              >
                General executive positioning across 5 validated leadership dimensions.
              </CardDescription>
              <div style={{ marginTop: 'auto' }}>
                <a
                  href="/assessment/cpi"
                  onClick={() => trackCTA({ location: 'lineup_cpi', label: 'CPI Learn more', destination: '/assessment/cpi' })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    minHeight: '44px',
                    fontFamily: DS.bodyFont,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: DS.textSecondary,
                    textDecoration: 'none',
                    transition: DS.transition,
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = DS.text;
                    e.currentTarget.style.background = DS.border;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = DS.textSecondary;
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Learn more <ArrowRight style={{ width: 14, height: 14 }} />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* LEAP — cols 7-9 */}
          <Card variant="flat" className="lineup-leap" interactive={false} style={{ height: '100%' }}>
            <CardHeader style={{ paddingBottom: '12px' }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: DS.eyebrow,
                  letterSpacing: '0.22em',
                  marginBottom: '6px',
                }}
              >
                5 dimensions · 16 archetypes · 32 questions
              </div>
              <CardTitle
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: DS.text,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Leadership Transition Profile
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '0 20px 20px' }}>
              <CardDescription
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  color: DS.textSecondary,
                  lineHeight: 1.55,
                  margin: '0 0 16px',
                  minHeight: '48px',
                }}
              >
                Executive career positioning, proof, visibility, and transition readiness.
              </CardDescription>
              <a
                href="/assessment/leap"
                onClick={() => trackCTA({ location: 'lineup_leap', label: 'LEAP Learn more', destination: '/assessment/leap' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  minHeight: '44px',
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: DS.textSecondary,
                  textDecoration: 'none',
                  transition: DS.transition,
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = DS.text;
                  e.currentTarget.style.background = DS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = DS.textSecondary;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Learn more <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </CardContent>
          </Card>

          {/* SPARK — cols 10-12 */}
          <Card variant="flat" className="lineup-spark" interactive={false} style={{ height: '100%' }}>
            <CardHeader style={{ paddingBottom: '12px' }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: DS.eyebrow,
                  letterSpacing: '0.22em',
                  marginBottom: '6px',
                }}
              >
                3 dimensions · 9 archetypes · 28 questions
              </div>
              <CardTitle
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: DS.text,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                AI Readiness Profile
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '0 20px 20px' }}>
              <CardDescription
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  color: DS.textSecondary,
                  lineHeight: 1.55,
                  margin: '0 0 16px',
                  minHeight: '48px',
                }}
              >
                Executive and organisational readiness for AI adoption, governance, and leverage.
              </CardDescription>
              <a
                href="/assessment/spark"
                onClick={() => trackCTA({ location: 'lineup_spark', label: 'SPARK Learn more', destination: '/assessment/spark' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  minHeight: '44px',
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: DS.textSecondary,
                  textDecoration: 'none',
                  transition: DS.transition,
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = DS.text;
                  e.currentTarget.style.background = DS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = DS.textSecondary;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Learn more <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </CardContent>
          </Card>

          {/* IMPACT — cols 7-12 */}
          <Card variant="flat" className="lineup-impact" interactive={false} style={{ height: '100%' }}>
            <CardHeader style={{ paddingBottom: '12px' }}>
              <div
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  color: DS.eyebrow,
                  letterSpacing: '0.22em',
                  marginBottom: '6px',
                }}
              >
                5 dimensions · 11 archetypes · 30 questions
              </div>
              <CardTitle
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: DS.text,
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Board Governance Index
              </CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '0 24px 24px' }}>
              <CardDescription
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  color: DS.textSecondary,
                  lineHeight: 1.55,
                  margin: '0 0 20px',
                }}
              >
                Director effectiveness: fiduciary rigour, stakeholder influence, and legacy impact.
              </CardDescription>
              <a
                href="/assessment/impact"
                onClick={() => trackCTA({ location: 'lineup_impact', label: 'IMPACT Learn more', destination: '/assessment/impact' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  minHeight: '44px',
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: DS.textSecondary,
                  textDecoration: 'none',
                  transition: DS.transition,
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = DS.text;
                  e.currentTarget.style.background = DS.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = DS.textSecondary;
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Learn more <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </CardContent>
          </Card>
        </div>

        <div style={{ textAlign: 'right', marginTop: '32px' }}>
          <a
            href="/assessments"
            onClick={() => trackCTA({ location: 'lineup_seeall', label: 'See all 11 assessments', destination: '/assessments' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 600,
              color: DS.text,
              textDecoration: 'none',
            }}
          >
            See all 11 assessments <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      </section>

      {/* SECTION 3: PROOF POINT (V2-4) */}
      <section
        id="nexus"
        style={{
          background: DS.bgDark,
          color: DS.bg,
          padding: 'clamp(80px, 10vw, 112px) 32px',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
          }}
          className="nexus-grid"
        >
          <div className="nexus-text">
            <div
              style={{
                fontFamily: DS.monoFont,
                textTransform: 'uppercase',
                fontSize: '10px',
                letterSpacing: '0.28em',
                color: DS.mutedDim,
                marginBottom: '16px',
              }}
            >
              METHODOLOGY, NOT HYPE
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 36px)',
                color: DS.bg,
                lineHeight: 1.18,
                marginBottom: '20px',
                maxWidth: '520px',
                margin: '0 0 20px',
                letterSpacing: '-0.01em',
              }}
            >
              We didn't invent these frameworks. We tested them across decades of executive placements.
            </h2>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '15px',
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: '520px',
                marginBottom: '14px',
              }}
            >
              Every assessment here is calibrated against LYC Partners' 20-year placement database across APAC. Dimensions aren't theoretical — they're the signals that consistently predict retention, promotion, and board-level outcomes for C-suite and VP-level executives.
            </p>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '15px',
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: '520px',
                marginBottom: '28px',
              }}
            >
              Questions are statistically validated. Archetype distributions mirror real placement populations. Results show you where you stand against actual executive benchmarks, not an abstract norm group.
            </p>
            <a
              href="#assessment-catalog"
              onClick={() => trackCTA({ location: 'nexus_proof', label: 'See how it works', destination: '#assessment-catalog' })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                border: '1px solid rgba(255,255,255,0.35)',
                color: DS.bg,
                fontFamily: DS.bodyFont,
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                textDecoration: 'none',
                background: 'transparent',
                transition: DS.transition,
              }}
            >
              See how it works <ArrowRight style={{ width: 14, height: 14 }} />
            </a>
          </div>

          <div className="nexus-visual">
            <svg
              viewBox="0 0 520 260"
              width="100%"
              height="auto"
              role="img"
              aria-label="Assessment flow: Question → Dimension scoring → Archetype matching → Composite score → NEXUS analysis → Actionable report"
            >
              {/* Arrow markers definition */}
              <defs>
                <marker
                  id="arrow-right"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={DS.mutedDim} />
                </marker>
              </defs>

              {/* 6 flow nodes */}
              {[
                { label: 'QUESTIONS', x: 20, w: 66, highlight: false },
                { label: 'DIMENSIONS', x: 106, w: 76, highlight: false },
                { label: 'ARCHETYPES', x: 202, w: 78, highlight: false },
                { label: 'COMPOSITE', x: 300, w: 76, highlight: true },
                { label: 'NEXUS', x: 396, w: 56, highlight: false },
                { label: 'REPORT', x: 472, w: 56, highlight: false },
              ].map((node, i) => (
                <g key={i}>
                  <rect
                    x={node.x}
                    y="90"
                    width={node.w}
                    height="60"
                    fill={node.highlight ? DS.accent : `${DS.mutedDim}18`}
                    stroke={node.highlight ? DS.accent : DS.mutedDim}
                    strokeWidth="1"
                  />
                  <text
                    x={node.x + node.w / 2}
                    y="122"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily={DS.monoFont}
                    fontSize="9"
                    textTransform="uppercase"
                    letterSpacing="0.12em"
                    fontWeight={node.highlight ? 600 : 400}
                    fill={node.highlight ? DS.bg : DS.mutedDim}
                  >
                    {node.label}
                  </text>
                  {/* Step label under box */}
                  <text
                    x={node.x + node.w / 2}
                    y="185"
                    textAnchor="middle"
                    fontFamily={DS.monoFont}
                    fontSize="9"
                    textTransform="uppercase"
                    letterSpacing="0.14em"
                    fill={node.highlight ? DS.accent : DS.mutedDim}
                    fontWeight={node.highlight ? 600 : 400}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </text>
                </g>
              ))}

              {/* Arrow connector lines between steps */}
              {[
                [86, 136],
                [182, 232],
                [280, 308],
                [376, 404],
                [452, 468],
              ].map(([x1, x2], i) => (
                <line
                  key={i}
                  x1={x1}
                  y1="120"
                  x2={x2}
                  y2="120"
                  stroke={DS.mutedDim}
                  strokeWidth="1"
                  markerEnd="url(#arrow-right)"
                />
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section style={{ background: DS.bgAlt, padding: '44px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <div
          className="reveal grid-responsive"
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          {[
            { v: '6', l: 'Leadership assessments' },
            { v: '47', l: 'Markets covered' },
            { v: '93%', l: 'Executive retention' },
            { v: '20yr', l: 'APAC placement data' },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.accent, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '11px', color: DS.muted, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES — 3 CARDS */}
      <section
        className="reveal section-padding"
        style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              // Ticket #1355: light gray eyebrow #9CA3AF
              color: DS.eyebrow,
              marginBottom: '12px',
            }}
          >
            How NEXUS works
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            One thinking partner.<br />Every executive framework.
          </h2>
        </div>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {CAPABILITIES.map(c => (
            <a
              key={c.title}
              href={c.href}
              onClick={() => trackCTA({ location: 'match_cta', label: `Capability: ${c.cta}`, destination: c.href })}
              className="card-hover"
              style={{
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
 
                padding: '28px 24px',
                textDecoration: 'none',
                boxShadow: DS.shadow,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'inline-flex', width: '40px', height: '40px', background: `${DS.accent}12`, color: DS.accent, alignItems: 'center', justifyContent: 'center' }}>
                <c.icon style={{ width: 18, height: 18 }} />
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, margin: 0, letterSpacing: '-0.01em' }}>
                {c.title}
              </h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13.5px', color: DS.textSecondary, margin: 0, lineHeight: 1.6 }}>
                {c.desc}
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  fontFamily: DS.bodyFont,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: DS.text,
                }}
              >
                {c.cta} <ArrowRight style={{ width: 13, height: 13 }} />
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* #1370 — SEE IT IN ACTION: CSS-illustrated product mockups (premium visual assets) */}
      <section
        className="reveal section-padding"
        style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              color: DS.eyebrow,
              marginBottom: '12px',
            }}
          >
            See it in action
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            Premium reports. AI coaching. One platform.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start', justifyItems: 'center' }}>
          <ResultMockup style={{ maxWidth: 340, width: '100%' }} />
          <NexusChatMockup style={{ maxWidth: 340, width: '100%' }} />
        </div>
      </section>

      {/* ASSESSMENT CATALOG — 3 TIER */}
      <section
        id="assessment-catalog"
        style={{ background: DS.bgAlt, padding: '96px 32px', borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}` }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.26em',
                // Ticket #1355: light gray eyebrow
              color: DS.eyebrow,
              marginBottom: '12px',
            }}
          >
            Assessment Catalog
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(26px, 3vw, 34px)',
                fontWeight: 700,
                color: DS.text,
                maxWidth: '680px',
                margin: '0 auto 12px',
                lineHeight: 1.18,
                letterSpacing: '-0.01em',
              }}
            >
              Six leadership assessments.<br />Exactly one right fit per moment.
            </h2>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '14px',
                color: DS.muted,
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Pay for exactly what you need — a targeted diagnostic for a specific
              transition moment, or subscribe for the full suite.
            </p>
          </div>

          {renderTierGroup('Leadership Assessments', DS.accent, ADVISORY_PRODUCT_KEYS)}
        </div>
      </section>

      {/* PRICING — 5 TIERS */}
      <section id="pricing" className="reveal section-padding" style={{ maxWidth: '1120px', margin: '0 auto', padding: '96px 32px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              // Ticket #1355: light gray eyebrow
              color: DS.eyebrow,
              marginBottom: '12px',
            }}
          >
            Subscription plans
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(26px, 3vw, 34px)',
              fontWeight: 700,
              color: DS.text,
              maxWidth: '720px',
              margin: '0 auto 12px',
              lineHeight: 1.18,
              letterSpacing: '-0.01em',
            }}
          >
            Start with an Executive Introduction. Scale when you're ready.
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              color: DS.muted,
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            All USD pricing shown. Monthly allocations and member benefits are explained after sign-up.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            alignItems: 'stretch',
          }}
        >
          {SUBSCRIPTION_TIERS.map(t => (
            <PricingTableCard key={t.key} t={t} />
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section
        className="reveal"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 32px',
          textAlign: 'center',
          marginTop: '48px',
          background: DS.bg,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${DS.accent}08 0%, ${DS.accent}04 40%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '720px',
            height: '480px',
            background: `radial-gradient(circle, ${DS.accent}0A 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto' }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              color: DS.muted,
              marginBottom: '16px',
            }}
          >
            Begin today
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: DS.text,
              margin: '0 0 16px',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Start with NEXUS.<br />One conversation in.
          </h2>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '15px',
              color: DS.textSecondary,
              maxWidth: '440px',
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            The intelligent front door is open. NEXUS will ask the questions you haven't yet thought to ask.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/nexus/chat"
              className=""
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 36px',
                background: DS.accent,
                color: DS.bg,
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textDecoration: 'none',
              }}
            >
              Try NEXUS <ArrowRight style={{ width: 14, height: 14 }} />
            </a>
            <a
              href="/assessment"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '18px 32px',
                border: `1px solid ${DS.accent}73`,
                color: DS.accent,
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textDecoration: 'none',
              }}
            >
              Browse assessments
            </a>
          </div>
        </div>
      </section>

      <UnifiedFooter />
    </div>
  );
}
