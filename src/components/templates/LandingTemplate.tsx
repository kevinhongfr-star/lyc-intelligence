/**
 * W2-1 — Shared Landing Template for hero assessments (LEAP, SPARK, IMPACT).
 *
 * Props-driven, DRY component that mirrors the CPI flagship landing depth:
 *  Hero (split + SVG radar) · What You'll Discover · Methodology (3-step flow
 *  + dimension cards + archetype grid + composite score dial) · Who It's For
 *  · What Makes It Different · Mid-page CTA · Final CTA · FAQ.
 *
 * Brand rules enforced (non-negotiable, same as V1/W1):
 *  - Zero border radius everywhere.
 *  - System serif headings (DS.headingFont) · DM Sans body · IBM Plex Mono labels.
 *  - ONE accent per page — passed via `accent` prop. Eyebrows use DS.eyebrow
 *    (gray-500), NEVER the accent.
 *  - "complimentary" not "free" · "Executive Introduction" not "free tier".
 *  - No "AI-powered" headline feature. No internal framework names exposed.
 *  - 100% inline SVG — no image files. 120–350ms motion envelope only.
 *
 * Reuses the proven scroll-reveal + CTA micro-compress helpers from
 * `assessment/landing/shared` so motion stays brand-compliant and isolated
 * per page via a unique `prefix`.
 */
import React, { useState } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { DS } from '@/tokens';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/Card';
import { SEO } from '@/components/seo/SEO';
import {
  useScrollReveal,
  RevealStyles,
  ctaCompressHandlers,
} from '@/components/assessment/landing/shared';

// ── TYPES ───────────────────────────────────────────────────────────

export interface LandingDimension {
  id: string;
  name: string;
  /** Short label rendered on the radar chart axis. Defaults to `name`. */
  short?: string;
  description: string;
  /** Optional weighting label, e.g. "20%" or "Meta". */
  weight?: string;
  weightNote?: string;
}

export interface LandingArchetype {
  code: string;
  name: string;
  tagline: string;
}

export interface LandingMethodologyStep {
  mono: string;
  title: string;
  body: string;
}

export interface LandingPersona {
  title: string;
  desc: string;
}

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface LandingStat {
  num: string;
  label: string;
  sub: string;
}

export interface LandingTemplateProps {
  /** Instrument code, e.g. "LEAP" */
  code: string;
  /** Display name, e.g. "LEAP" */
  name: string;
  /** Full instrument name, e.g. "Leadership Archetype & APAC Translation" */
  fullName: string;
  /** Hero subhead (one line). */
  tagline: string;
  /** Longer hero paragraph. */
  heroDescription: string;
  /** Hero eyebrow / category label, e.g. "Leadership Self-Awareness". */
  categoryLabel: string;
  /** Tier badge text, e.g. "HERO ASSESSMENT". */
  tierBadge: string;

  /** Page accent (hex). ONE accent per page. */
  accent: string;
  /** Darker accent variant for hover states. */
  accentDark: string;

  /** Assessment content. */
  dimensions: LandingDimension[];
  archetypes: LandingArchetype[];
  methodologySteps: LandingMethodologyStep[];
  whoItsFor: LandingPersona[];
  whatMakesDifferent: string[];
  faq: LandingFaqItem[];
  /** Credibility stat row (usually 3 stats). */
  stats: LandingStat[];

  /** CTA config. */
  ctaHref: string;
  ctaLabel: string;
  finalCtaLabel: string;
  finalSubtext: string;

  /** SEO. */
  seoTitle: string;
  seoDescription: string;
  seoPath: string;

  /** Unique scroll-reveal class prefix (e.g. "leap"). */
  prefix: string;
  /** Sample radar values (0–1 fractions of max radius) per dimension. */
  heroSampleValues?: number[];
}

// ── SHARED STYLE FRAGMENTS ──────────────────────────────────────────

const COLOR_BG_DARK = DS.bgDark;
const COLOR_TEXT_ON_DARK = DS.bg;
const COLOR_MUTED_ON_DARK = 'rgba(255,255,255,0.62)';

const EYEBROW_MONO: React.CSSProperties = {
  fontFamily: DS.monoFont,
  fontSize: 10,
  letterSpacing: '0.24em',
  color: DS.muted,
  textTransform: 'uppercase',
  marginBottom: 12,
  fontWeight: 600,
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: DS.headingFont,
  fontSize: 'clamp(28px, 3.6vw, 40px)',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  margin: 0,
  color: DS.text,
  lineHeight: 1.15,
};

const SECTION_LEAD: React.CSSProperties = {
  fontFamily: DS.bodyFont,
  color: DS.textSecondary,
  maxWidth: 620,
  marginTop: 12,
  lineHeight: 1.6,
};

// ── INLINE SVG: HEX ICON (archetype grid) ───────────────────────────

function HexIcon({ size = 28, accent }: { size?: number; accent: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <polygon points="20,3 36,12 36,28 20,37 4,28 4,12" fill="none" stroke={accent} strokeWidth="1.5" />
    </svg>
  );
}

function CheckMark({ accent }: { accent: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="M4 10.5L8.5 15L16 6" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── HERO RADAR (N-axis polygon, accent draw-in) ─────────────────────

function HeroRadar({
  dimensions,
  accent,
  sampleValues,
}: {
  dimensions: LandingDimension[];
  accent: string;
  sampleValues?: number[];
}) {
  const n = dimensions.length;
  const R_MAX = 200;
  const values =
    sampleValues && sampleValues.length === n
      ? sampleValues
      : dimensions.map((_, i) => 0.55 + 0.12 * ((i * 37) % 5) / 4 + (i % 2) * 0.08);

  const pointAt = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, angle };
  };

  return (
    <svg viewBox="0 0 560 560" style={{ maxWidth: '100%', display: 'block' }} aria-label={`${n}-dimension assessment framework`}>
      <defs>
        <style>{`
          .${'lt-radar-ring'} { stroke: rgba(255,255,255,0.1); stroke-width: 1; fill: none; }
          .${'lt-radar-axis'} { stroke: rgba(255,255,255,0.08); stroke-width: 1; }
          .${'lt-radar-poly'} { stroke-dasharray: 1200; stroke-dashoffset: 0; animation: ltDrawIn 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .${'lt-dim-label'} { fill: rgba(255,255,255,0.75); font-family: ${DS.bodyFont}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
          @keyframes ltDrawIn { from { stroke-dashoffset: 1200; } to { stroke-dashoffset: 0; } }
        `}</style>
      </defs>
      <g transform="translate(280, 280)">
        {[40, 80, 120, 160, 200].map((r) => (
          <circle key={r} className="lt-radar-ring" r={r} />
        ))}
        {dimensions.map((_, i) => {
          const p = pointAt(i, 210);
          return <line key={i} className="lt-radar-axis" x1="0" y1="0" x2={p.x} y2={p.y} />;
        })}
        <polygon
          className="lt-radar-poly"
          points={dimensions
            .map((_, i) => {
              const p = pointAt(i, values[i] * R_MAX);
              return `${p.x},${p.y}`;
            })
            .join(' ')}
          fill={`${accent}2E`}
          stroke={accent}
          strokeWidth="2"
        />
        {dimensions.map((dim, i) => {
          const p = pointAt(i, values[i] * R_MAX);
          const lp = pointAt(i, 240);
          const highlight = i === 0;
          return (
            <g key={dim.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={highlight ? 5 : 3.5}
                fill={highlight ? accent : 'rgba(255,255,255,0.5)'}
                stroke={highlight ? accent : 'rgba(255,255,255,0.3)'}
                strokeWidth="1.5"
              />
              <text
                className="lt-dim-label"
                x={lp.x}
                y={lp.y}
                textAnchor={Math.abs(lp.x) < 10 ? 'middle' : lp.x > 0 ? 'start' : 'end'}
                dominantBaseline={Math.abs(lp.y) < 10 ? 'middle' : lp.y > 0 ? 'hanging' : 'alphabetic'}
              >
                {dim.short || dim.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── COMPOSITE SCORE DIAL ────────────────────────────────────────────

function ScoreDial({ accent, value = 76 }: { accent: string; value?: number }) {
  const arc = Math.PI * 160;
  const offset = arc * (1 - value / 100);
  return (
    <svg viewBox="0 0 400 220" style={{ maxWidth: '100%', display: 'block' }} aria-label="Composite score illustration">
      <g transform="translate(200, 200)">
        <path d="M -160 0 A 160 160 0 0 1 160 0" fill="none" stroke={DS.border} strokeWidth="20" strokeLinecap="butt" />
        <path
          d="M -160 0 A 160 160 0 0 1 160 0"
          fill="none"
          stroke={accent}
          strokeWidth="20"
          strokeLinecap="butt"
          strokeDasharray={`${arc} ${arc}`}
          strokeDashoffset={offset}
        />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = Math.PI * (1 - i / 5);
          const r = 160;
          const rIn = 135;
          return (
            <line
              key={i}
              x1={Math.cos(angle) * r}
              y1={-Math.sin(angle) * r}
              x2={Math.cos(angle) * rIn}
              y2={-Math.sin(angle) * rIn}
              stroke={DS.mutedDim}
              strokeWidth="2"
            />
          );
        })}
        <text x="0" y="-40" textAnchor="middle" fontFamily={DS.headingFont} fontSize="48" fontWeight="700" fill={DS.text}>
          {value}
        </text>
        <text x="0" y="-8" textAnchor="middle" fontFamily={DS.monoFont} fontSize="11" fill={DS.muted} letterSpacing="0.15em">
          COMPOSITE SCORE
        </text>
        <text x="-170" y="20" textAnchor="middle" fontFamily={DS.monoFont} fontSize="10" fill={DS.mutedDim}>
          0
        </text>
        <text x="170" y="20" textAnchor="middle" fontFamily={DS.monoFont} fontSize="10" fill={DS.mutedDim}>
          100
        </text>
      </g>
    </svg>
  );
}

// ── PRIMARY CTA BUTTON (accent, zero radius) ────────────────────────

function CtaButton({
  href,
  label,
  accent,
  accentDark,
  size = 'md',
  onClick,
}: {
  href: string;
  label: string;
  accent: string;
  accentDark: string;
  size?: 'md' | 'lg';
  onClick?: () => void;
}) {
  const pad = size === 'lg' ? '20px 40px' : '14px 22px';
  const fs = size === 'lg' ? 14 : 13;
  return (
    <a
      href={href}
      onClick={onClick}
      {...ctaCompressHandlers}
      style={{
        background: accent,
        color: DS.bg,
        border: `1px solid ${accent}`,
        fontFamily: DS.bodyFont,
        fontSize: fs,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: size === 'lg' ? '0.18em' : '0.15em',
        padding: pad,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: `background ${DS.transition}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = accentDark)}
      onMouseLeave={(e) => (e.currentTarget.style.background = accent)}
    >
      {label}
    </a>
  );
}

// ── MAIN TEMPLATE ───────────────────────────────────────────────────

export function LandingTemplate(props: LandingTemplateProps) {
  const {
    code,
    name,
    fullName,
    tagline,
    heroDescription,
    categoryLabel,
    tierBadge,
    accent,
    accentDark,
    dimensions,
    archetypes,
    methodologySteps,
    whoItsFor,
    whatMakesDifferent,
    faq,
    stats,
    ctaHref,
    ctaLabel,
    finalCtaLabel,
    finalSubtext,
    seoTitle,
    seoDescription,
    seoPath,
    prefix,
    heroSampleValues,
  } = props;

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useScrollReveal(prefix);

  return (
    <>
      <SEO page="landing" title={seoTitle} description={seoDescription} path={seoPath} />
      <main data-lt-page={prefix}>
        <style>{`
          [data-lt-page="${prefix}"] .lt-hero-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.05fr); gap: 56px; }
          [data-lt-page="${prefix}"] .lt-methodology-svg { display: block; }
          [data-lt-page="${prefix}"] .lt-methodology-stack { display: none; }
          @media (max-width: 768px) {
            [data-lt-page="${prefix}"] .lt-hero-grid { grid-template-columns: 1fr !important; }
            [data-lt-page="${prefix}"] .lt-methodology-svg { display: none !important; }
            [data-lt-page="${prefix}"] .lt-methodology-stack { display: grid !important; grid-template-columns: 1fr; gap: 16px; }
            [data-lt-page="${prefix}"] .lt-stats-row { flex-direction: column !important; }
            [data-lt-page="${prefix}"] .lt-stats-divider { width: 80px !important; height: 1px !important; margin: 20px auto !important; }
            [data-lt-page="${prefix}"] .lt-final-btn-wrap { width: 100%; }
            [data-lt-page="${prefix}"] .lt-final-btn-wrap a { width: 100%; }
          }
        `}</style>

        {/* 1. HERO */}
        <section id={`${prefix}-hero`} style={{ background: COLOR_BG_DARK }}>
          <div className="lt-hero-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px' }}>
            <div className={`${prefix}-reveal`}>
              <div
                style={{
                  background: accent,
                  color: DS.bg,
                  fontFamily: DS.monoFont,
                  fontSize: 10,
                  letterSpacing: '0.20em',
                  padding: '4px 10px',
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {tierBadge}
              </div>
              <h1
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 'clamp(40px, 6vw, 68px)',
                  fontWeight: 700,
                  color: COLOR_TEXT_ON_DARK,
                  lineHeight: 1.08,
                  letterSpacing: '-0.02em',
                  maxWidth: 580,
                  margin: 0,
                  marginTop: 28,
                }}
              >
                {name} — {fullName}
              </h1>
              <p
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 'clamp(15px, 1.5vw, 17px)',
                  color: COLOR_MUTED_ON_DARK,
                  lineHeight: 1.55,
                  maxWidth: 540,
                  marginTop: 18,
                }}
              >
                {heroDescription}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <CtaButton href={ctaHref} label={ctaLabel} accent={accent} accentDark={accentDark} />
                <button
                  type="button"
                  onClick={() => scrollToId(`${prefix}-methodology`)}
                  style={{
                    background: 'transparent',
                    color: COLOR_TEXT_ON_DARK,
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: '14px 22px',
                    minHeight: 44,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    transition: `background ${DS.transition}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  See How It Works
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  fontFamily: DS.monoFont,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: COLOR_MUTED_ON_DARK,
                  marginTop: 40,
                }}
              >
                <span>{categoryLabel}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span>{dimensions.length} Dimensions</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                <span>{archetypes.length} Archetypes</span>
              </div>
            </div>
            <div className={`${prefix}-reveal`}>
              <HeroRadar dimensions={dimensions} accent={accent} sampleValues={heroSampleValues} />
            </div>
          </div>
        </section>

        {/* 2. WHAT YOU'LL DISCOVER */}
        <section id={`${prefix}-discover`} style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div className={`${prefix}-reveal`}>
              <div style={EYEBROW_MONO}>WHAT YOU WALK AWAY WITH</div>
              <h2 style={SECTION_TITLE}>
                {dimensions.length} dimensions of professional self-awareness
              </h2>
              <p style={SECTION_LEAD}>{tagline}</p>
            </div>
            <div
              className={`${prefix}-reveal`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
                marginTop: 48,
              }}
            >
              {dimensions.map((dim, i) => {
                const highlighted = i === 0;
                return (
                  <Card
                    key={dim.id}
                    variant="flat"
                    interactive={false}
                    style={{ borderLeft: highlighted ? `3px solid ${accent}` : `1px solid ${DS.cardBorder}`, padding: 0 }}
                  >
                    <CardContent style={{ padding: 24 }}>
                      <CardTitle style={{ fontSize: 18, fontWeight: 600, color: DS.text }}>{dim.name}</CardTitle>
                      <div
                        style={{
                          fontFamily: DS.monoFont,
                          fontSize: 9,
                          color: accent,
                          textTransform: 'uppercase',
                          letterSpacing: '0.18em',
                          marginTop: 6,
                        }}
                      >
                        {dim.short || dim.name}
                      </div>
                      <CardDescription style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 10 }}>
                        {dim.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. METHODOLOGY */}
        <section id={`${prefix}-methodology`} style={{ background: DS.bgAlt, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1120, margin: '0 auto' }}>
            <div className={`${prefix}-reveal`}>
              <div style={EYEBROW_MONO}>HOW IT WORKS</div>
              <h2 style={SECTION_TITLE}>A structured path to a clear profile.</h2>
              <p style={SECTION_LEAD}>
                The depth is the difference. {name} moves through deliberate stages so the profile reflects
                real operating patterns, not a single snapshot.
              </p>
            </div>

            {/* 3A. PROCESS FLOW (SVG desktop / stacked cards mobile) */}
            <div className={`${prefix}-reveal`} style={{ marginTop: 56 }}>
              <svg className="lt-methodology-svg" viewBox="0 0 1100 340" style={{ maxWidth: '100%' }}>
                <defs>
                  <marker id={`${prefix}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={accent} />
                  </marker>
                </defs>
                {methodologySteps.map((step, i) => {
                  const x = 40 + i * 350;
                  return (
                    <g key={i}>
                      <rect x={x} y="40" width="310" height="260" fill={DS.bg} stroke={DS.cardBorder} strokeWidth="1" />
                      <circle cx={x + 155} cy="28" r="18" fill={accent} />
                      <text x={x + 155} y="34" textAnchor="middle" fill={DS.bg} fontFamily={DS.monoFont} fontSize="12" fontWeight="600">
                        {i + 1}
                      </text>
                      <text x={x + 24} y="88" fill={accent} fontFamily={DS.monoFont} fontSize="10" letterSpacing="0.2em">
                        {step.mono.toUpperCase()}
                      </text>
                      <foreignObject x={x + 24} y="110" width="262" height="160">
                        <div style={{ fontFamily: DS.bodyFont }}>
                          <h4 style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 600, color: DS.text, margin: 0, lineHeight: 1.35 }}>
                            {step.title}
                          </h4>
                          <p style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, margin: 0, marginTop: 12 }}>{step.body}</p>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
                {methodologySteps.slice(1).map((_, i) => {
                  const x1 = 350 + i * 350;
                  return <line key={i} x1={x1} y1="170" x2={x1 + 40} y2="170" stroke={accent} strokeWidth="2" markerEnd={`url(#${prefix}-arrow)`} />;
                })}
              </svg>

              <div className="lt-methodology-stack">
                {methodologySteps.map((step, i) => (
                  <Card key={i} variant="flat" interactive={false}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            background: accent,
                            color: DS.bg,
                            fontFamily: DS.monoFont,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {i + 1}
                        </div>
                        <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>
                          {step.mono}
                        </div>
                      </div>
                      <CardTitle style={{ fontSize: 18, fontWeight: 600, color: DS.text, marginTop: 16 }}>{step.title}</CardTitle>
                      <CardDescription style={{ fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, marginTop: 10 }}>{step.body}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3B. ARCHETYPE GRID */}
            <div className={`${prefix}-reveal`} style={{ marginTop: 88 }}>
              <div style={EYEBROW_MONO}>DISCOVER YOUR OPERATING PATTERN</div>
              <h3 style={{ ...SECTION_TITLE, fontSize: 'clamp(24px, 3vw, 32px)' }}>
                {archetypes.length} archetypes of executive operation.
              </h3>
              <p style={SECTION_LEAD}>
                Your archetype isn't a personality type — it's a professional operating pattern derived from your
                dimension profile. Most leaders show one primary and one secondary archetype.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 16,
                  marginTop: 40,
                }}
              >
                {archetypes.map((a) => (
                  <Card key={a.code} variant="flat" interactive={false} style={{ textAlign: 'center' }}>
                    <CardContent style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <HexIcon size={32} accent={accent} />
                      </div>
                      <div style={{ fontFamily: DS.monoFont, fontSize: 22, color: accent, fontWeight: 600 }}>{a.code}</div>
                      <CardTitle style={{ fontSize: 16, fontWeight: 600, color: DS.text, marginTop: 4 }}>{a.name}</CardTitle>
                      <CardDescription
                        style={{ fontSize: 12, color: DS.textSecondary, lineHeight: 1.45, marginTop: 8, maxWidth: 170, marginLeft: 'auto', marginRight: 'auto' }}
                      >
                        {a.tagline}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 3C. SCORING MODEL */}
            <div className={`${prefix}-reveal`} style={{ marginTop: 88 }}>
              <div style={EYEBROW_MONO}>SCORING</div>
              <h3 style={{ ...SECTION_TITLE, fontSize: 'clamp(24px, 3vw, 32px)' }}>A score you can use, not just read.</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 40, alignItems: 'center' }}>
                <div>
                  <ScoreDial accent={accent} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {[
                    { label: 'OVERALL', title: 'Composite score 0–100', desc: 'A single calibrated number capturing your full dimensional profile, benchmarked against real executive populations.' },
                    { label: 'DIMENSIONS', title: 'Individual dimension scores', desc: `${dimensions.length} independent 0–100 dimension scores with written interpretation. See exactly where you stand on each axis.` },
                    { label: 'ARCHETYPE', title: 'Archetype match strength', desc: 'Primary + secondary archetype classification with match confidence and pattern explanations tied to real operating behaviors.' },
                  ].map((s) => (
                    <Card key={s.label} variant="flat" interactive={false}>
                      <CardContent style={{ padding: 24 }}>
                        <div style={{ fontFamily: DS.monoFont, fontSize: 10, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>{s.label}</div>
                        <CardTitle style={{ fontSize: 17, fontWeight: 600, marginTop: 8 }}>{s.title}</CardTitle>
                        <CardDescription style={{ fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>{s.desc}</CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. WHO IT'S FOR */}
        <section id={`${prefix}-who`} style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className={`${prefix}-reveal`}>
              <div style={EYEBROW_MONO}>WHO USES {code}</div>
              <h2 style={SECTION_TITLE}>Built for leaders who need a clear read.</h2>
              <p style={SECTION_LEAD}>{name} serves executives across the core use cases below.</p>
            </div>
            <div
              className={`${prefix}-reveal`}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 48 }}
            >
              {whoItsFor.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flexShrink: 0, color: accent, marginTop: 2 }}>
                    <HexIcon size={22} accent={accent} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: DS.headingFont, fontSize: 18, fontWeight: 600, color: DS.text, margin: 0 }}>{item.title}</h4>
                    <p style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary, lineHeight: 1.55, margin: 0, marginTop: 6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. WHAT MAKES IT DIFFERENT */}
        <section id={`${prefix}-different`} style={{ background: DS.bgAlt, padding: '96px 32px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className={`${prefix}-reveal`}>
              <div style={EYEBROW_MONO}>WHAT SETS IT APART</div>
              <h2 style={SECTION_TITLE}>Not another personality quiz.</h2>
            </div>
            <div className={`${prefix}-reveal`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 40 }}>
              {whatMakesDifferent.map((pt, i) => (
                <Card key={i} variant="flat" interactive={false}>
                  <CardContent style={{ padding: 24 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 2 }}>
                        <CheckMark accent={accent} />
                      </div>
                      <p style={{ fontFamily: DS.bodyFont, fontSize: 15, color: DS.text, lineHeight: 1.6, margin: 0 }}>{pt}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 6. MID-PAGE CTA */}
        <section style={{ background: DS.bg, padding: '56px 32px', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CtaButton href={ctaHref} label={`${ctaLabel} →`} accent={accent} accentDark={accentDark} />
          </span>
        </section>

        {/* 7. FINAL CTA */}
        <section id={`${prefix}-final-cta`} style={{ background: COLOR_BG_DARK, position: 'relative', overflow: 'hidden' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 40%, ${accent}0F 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ maxWidth: 680, margin: '0 auto', padding: '112px 32px', position: 'relative', textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 700,
                color: COLOR_TEXT_ON_DARK,
                lineHeight: 1.15,
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              Discover your {name} profile.
            </h2>
            <p
              style={{
                fontFamily: DS.bodyFont,
                color: COLOR_MUTED_ON_DARK,
                fontSize: 15,
                lineHeight: 1.6,
                marginTop: 20,
                maxWidth: 480,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {finalSubtext}
            </p>
            <div className="lt-final-btn-wrap" style={{ marginTop: 32 }}>
              <CtaButton href={ctaHref} label={finalCtaLabel} accent={accent} accentDark={accentDark} size="lg" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 28 }}>
              {['COMPLIMENTARY BASELINE', 'EXECUTIVE INTRODUCTION TIER', 'NO CREDIT CARD REQUIRED'].map((t, i, arr) => (
                <React.Fragment key={t}>
                  <span style={{ fontFamily: DS.monoFont, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.mutedDim }}>{t}</span>
                  {i < arr.length - 1 && <span style={{ color: DS.mutedDim }}>·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 8. FAQ */}
        <section id={`${prefix}-faq`} style={{ background: DS.bg, padding: '96px 32px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div className={`${prefix}-reveal`}>
              <div style={EYEBROW_MONO}>FREQUENTLY ASKED</div>
              <h2 style={SECTION_TITLE}>Questions about {name}.</h2>
            </div>
            <div className={`${prefix}-reveal`} style={{ marginTop: 40 }}>
              {faq.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} style={{ borderBottom: `1px solid ${DS.cardBorder}` }}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '24px 8px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: `background ${DS.transition}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = DS.bgAlt)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: DS.headingFont, fontSize: 17, fontWeight: 600, color: DS.text, lineHeight: 1.4 }}>{item.q}</span>
                      <ChevronDown
                        size={20}
                        color={open ? accent : DS.muted}
                        style={{ flexShrink: 0, marginLeft: 16, transition: `transform ${DS.transition}`, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                    <div style={{ maxHeight: open ? 400 : 0, overflow: 'hidden', transition: `max-height ${DS.transition}` }}>
                      <p style={{ fontFamily: DS.bodyFont, fontSize: 15, color: DS.textSecondary, lineHeight: 1.65, padding: '0 8px 24px', margin: 0 }}>
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <RevealStyles prefix={prefix} />
    </>
  );
}

export default LandingTemplate;
