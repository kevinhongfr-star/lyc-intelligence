import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, Check } from 'lucide-react';
import {
  INK, OFF, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle,
  useScrollReveal, RevealStyles,
  makeSectionLabel, ctaCompressHandlers,
  BRAND_ACCENT, EYEBROW_GRAY, ASSESSMENT_SUBTITLE,
  type AssessmentLandingConfig,
} from './shared';
import { ASSESSMENT_CATALOG, type AssessmentInfo } from '@/assessments/catalog';

interface Props {
  config: AssessmentLandingConfig;
}

// ── BRAND ──────────────────────────────────────────────────────────
// #1376 — ECHO brand spec v1.2. One accent (LYC fuchsia #C108AB) for CTAs +
// key highlights. Section eyebrows are light gray #9CA3AF. config.accent is
// intentionally ignored so every assessment lands on the same brand accent
// (SparkLanding previously passed teal #0D9488 — a brand violation).
const ACCENT = BRAND_ACCENT;

// Deterministic sample percentages for the result-preview mockup (divs, not images).
const SAMPLE_PCTS = [82, 67, 91, 54, 76, 70];

// Shared typography helpers.
const serif = "'Crimson Pro', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

function firstSentence(s: string): string {
  if (!s) return '';
  const parts = s.split(/\. (?=[A-Z0-9])/);
  return parts.length > 1 ? `${parts[0]}.` : s;
}

// ── NAV ────────────────────────────────────────────────────────────
function Nav({ config }: { config: AssessmentLandingConfig }) {
  const { name } = config;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinkStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 500, color: INK, textDecoration: 'none',
    opacity: 0.7, transition: 'opacity 120ms ease',
  };
  const startBtn: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: WHITE, textDecoration: 'none',
    padding: '8px 20px', background: ACCENT, minHeight: 36,
    display: 'inline-flex', alignItems: 'center', transition: 'opacity 120ms ease',
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: scrolled ? 'rgba(245,245,243,0.96)' : 'rgba(245,245,243,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 100,
      borderBottom: scrolled ? `1px solid ${G200}` : '1px solid transparent',
      transition: 'border-color 200ms ease, background 200ms ease',
    }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{
          fontFamily: serif, fontSize: 20, fontWeight: 700, textDecoration: 'none', color: INK,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          {name} <span style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 10, fontWeight: 400, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: EYEBROW_GRAY,
          }}>by LYC</span>
        </Link>
        <ul className="al-nav-desktop" style={{ display: 'flex', gap: 28, listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
          <li><a href="#discover" style={navLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>What you'll discover</a></li>
          <li><a href="#how-it-works" style={navLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>How it works</a></li>
          <li><a href="#pricing" style={navLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>Pricing</a></li>
          <li><Link to={config.ctaHref} style={startBtn}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>Start</Link></li>
        </ul>
        <button className="al-nav-toggle" onClick={() => setMobileOpen(true)} style={{
          display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: INK,
        }} aria-label="Open menu"><Menu style={{ width: 24, height: 24 }} /></button>
      </div>
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
          background: WHITE, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 200,
          padding: '80px 32px 32px',
        }}>
          <button onClick={() => setMobileOpen(false)} style={{
            position: 'absolute', top: 20, right: 20, background: 'none',
            border: 'none', cursor: 'pointer', color: INK,
          }} aria-label="Close menu"><X style={{ width: 24, height: 24 }} /></button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <a href="#discover" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: INK, textDecoration: 'none' }}>What you'll discover</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: INK, textDecoration: 'none' }}>How it works</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: INK, textDecoration: 'none' }}>Pricing</a>
            <Link to={config.ctaHref} onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>Start assessment</Link>
          </div>
        </div>
      )}
      <style>{`@media (max-width: 768px) { .al-nav-desktop { display: none !important; } .al-nav-toggle { display: block !important; } }`}</style>
    </nav>
  );
}

// ── SECTION HEADING (eyebrow + serif heading) ──────────────────────
function SectionHead({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto 64px', textAlign: 'center' }}>
      <span style={makeSectionLabel(ACCENT)}>{eyebrow}</span>
      <h2 style={{
        fontFamily: serif, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 38px)',
        lineHeight: 1.18, color: INK, letterSpacing: '-0.01em', margin: 0,
      }}>
        {children}
      </h2>
    </div>
  );
}

// ── HERO ───────────────────────────────────────────────────────────
function Hero({ config, catalog }: { config: AssessmentLandingConfig; catalog: AssessmentInfo | undefined }) {
  const { prefix, ctaHref } = config;
  const category = ASSESSMENT_SUBTITLE[config.code] || config.tagline || catalog?.tagline || '';
  const tagline = catalog?.tagline || config.heroDescription;
  const duration = catalog?.duration_minutes ?? 10;
  const questions = catalog?.total_questions ?? 0;
  const dimCount = catalog?.dimensions.length ?? config.dimensions.length;
  const archetypes = catalog?.archetype_count ?? config.personas.length;

  const meta = [
    questions ? `${questions} questions` : '',
    `${duration} minutes`,
    `${dimCount} dimensions`,
    `${archetypes} archetypes`,
  ].filter(Boolean);

  const ctaBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '16px 32px', background: ACCENT, color: WHITE,
    fontFamily: sans, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
    textDecoration: 'none', border: `1px solid ${ACCENT}`, cursor: 'pointer',
    minHeight: 52, transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  };
  const ghostBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: INK, fontFamily: sans, fontSize: 14, fontWeight: 500,
    textDecoration: 'none', padding: '16px 8px', minHeight: 52,
    opacity: 0.7, transition: 'opacity 120ms ease',
  };

  return (
    <section style={{ paddingTop: 160, paddingBottom: 96, background: WHITE, borderBottom: `1px solid ${G200}` }}>
      <div style={containerStyle} className={`${prefix}-reveal`}>
        <div style={{ width: 48, height: 3, background: ACCENT, marginBottom: 32 }} />
        <div style={{ ...monoStyle, color: EYEBROW_GRAY, marginBottom: 24, letterSpacing: '0.18em' }}>
          {category}
        </div>
        <h1 className="hero-heading" style={{
          fontFamily: serif, fontWeight: 700, color: INK,
          fontSize: 'clamp(44px, 7vw, 76px)', lineHeight: 1.05, letterSpacing: '-0.02em',
          margin: '0 0 24px', maxWidth: 820,
        }}>
          {config.name}
        </h1>
        <p className="hero-sub" style={{
          fontFamily: sans, fontSize: 'clamp(17px, 2vw, 21px)', color: G600,
          lineHeight: 1.5, margin: '0 0 36px', maxWidth: 620,
        }}>
          {tagline}
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <Link to={ctaHref} style={ctaBtn} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}>
            Start assessment <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
          <a href="#how-it-works" style={ghostBtn}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>
            See how it works <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: EYEBROW_GRAY,
        }}>
          {meta.map((m, i) => (
            <React.Fragment key={m}>
              {i > 0 && <span style={{ color: G300 }}>·</span>}
              <span>{m}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WHAT YOU'LL DISCOVER ───────────────────────────────────────────
function WhatYoullDiscover({ config, catalog }: { config: AssessmentLandingConfig; catalog: AssessmentInfo | undefined }) {
  const { prefix } = config;
  const dims = (catalog?.dimensions?.length ? catalog.dimensions : config.dimensions).slice(0, 4);

  return (
    <section id="discover" style={{ padding: '96px 0', background: OFF }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`}><SectionHead eyebrow="What you'll discover">
          A clear picture of <em style={{ fontWeight: 400, fontStyle: 'italic' }}>where you stand</em>
        </SectionHead></div>
        <div className={`${prefix}-reveal`} style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 1, background: G200, border: `1px solid ${G200}`,
        }}>
          {dims.map((d, i) => (
            <div key={d.id} style={{ background: WHITE, padding: '36px 32px' }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 11, color: EYEBROW_GRAY, letterSpacing: '0.14em',
                textTransform: 'uppercase', marginBottom: 20,
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 style={{
                fontFamily: serif, fontWeight: 700, fontSize: 22, color: INK,
                lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.01em',
              }}>
                {d.name}
              </h3>
              <p style={{ fontFamily: sans, fontSize: 15, color: G600, lineHeight: 1.6, margin: 0 }}>
                {firstSentence(d.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS ───────────────────────────────────────────────────
function HowItWorks({ config, catalog }: { config: AssessmentLandingConfig; catalog: AssessmentInfo | undefined }) {
  const { prefix } = config;
  const duration = catalog?.duration_minutes ?? 10;
  const questions = catalog?.total_questions ?? 0;

  const steps = [
    {
      step: '01',
      title: `Takes ~${duration} minutes`,
      desc: questions
        ? `Answer ${questions} targeted questions calibrated to real executive decision-making. No right answers — just honest ones.`
        : 'Answer targeted questions calibrated to real executive decision-making. No right answers — just honest ones.',
    },
    {
      step: '02',
      title: 'Get instant results',
      desc: 'Your dimension scorecard and archetype appear the moment you finish. No waiting, no consultant scheduling.',
    },
    {
      step: '03',
      title: 'Unlock the full report',
      desc: 'The Professional tier adds your development roadmap, benchmark percentiles, and a NEXUS AI coaching session.',
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: '96px 0', background: WHITE }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`}><SectionHead eyebrow="How it works">
          Three steps, <em style={{ fontWeight: 400, fontStyle: 'italic' }}>~{duration} minutes</em>
        </SectionHead></div>
        <div className={`${prefix}-reveal`} style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 1, background: G200, border: `1px solid ${G200}`,
        }}>
          {steps.map((s) => (
            <div key={s.step} style={{ background: WHITE, padding: '40px 32px' }}>
              <div style={{
                width: 44, height: 44, marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: OFF, border: `1px solid ${G200}`,
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 14, color: ACCENT, fontWeight: 600,
              }}>
                {s.step}
              </div>
              <h3 style={{
                fontFamily: serif, fontWeight: 700, fontSize: 22, color: INK,
                lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.01em',
              }}>
                {s.title}
              </h3>
              <p style={{ fontFamily: sans, fontSize: 15, color: G600, lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SAMPLE RESULT PREVIEW (CSS-illustrated mockup, divs only) ──────
function SamplePreview({ config, catalog }: { config: AssessmentLandingConfig; catalog: AssessmentInfo | undefined }) {
  const { prefix } = config;
  const dims = (catalog?.dimensions?.length ? catalog.dimensions : config.dimensions).slice(0, 5);
  const bands = catalog?.compositeBands ?? [];
  const composite = bands.length ? bands[Math.min(1, bands.length - 1)].band : 'Established';
  const archetype = catalog?.archetypes[0]?.name ?? 'Your archetype';

  return (
    <section id="preview" style={{ padding: '96px 0', background: OFF }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`}><SectionHead eyebrow="Sample result">
          See what your report <em style={{ fontWeight: 400, fontStyle: 'italic' }}>looks like</em>
        </SectionHead></div>
        <div className={`${prefix}-reveal`} style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            background: WHITE, border: `1px solid ${G200}`, boxShadow: '0 1px 2px rgba(10,10,18,0.04)',
            padding: '36px 36px 32px',
          }}>
            {/* Header row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: 24, borderBottom: `1px solid ${G200}`, marginBottom: 28,
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: EYEBROW_GRAY,
              }}>
                {config.code} · Sample profile
              </div>
              <span style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: ACCENT, border: `1px solid ${ACCENT}`, padding: '3px 8px',
              }}>
                Preview
              </span>
            </div>

            {/* Composite band */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontFamily: sans, fontSize: 13, color: G600 }}>Composite band</span>
              <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: INK }}>{composite}</span>
            </div>
            <div style={{ width: '100%', height: 6, background: G200, marginBottom: 32 }}>
              <div style={{ width: '76%', height: '100%', background: ACCENT }} />
            </div>

            {/* Dimension bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
              {dims.map((d, i) => {
                const pct = SAMPLE_PCTS[i % SAMPLE_PCTS.length];
                return (
                  <div key={d.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontFamily: sans, fontSize: 14, color: INK, fontWeight: 500 }}>{d.name}</span>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                        fontSize: 12, color: G600,
                      }}>{pct}</span>
                    </div>
                    <div style={{ width: '100%', height: 5, background: G200 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: ACCENT }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Archetype chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingTop: 24, borderTop: `1px solid ${G200}`,
            }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: EYEBROW_GRAY,
              }}>Archetype</span>
              <span style={{ fontFamily: serif, fontSize: 17, fontWeight: 700, color: INK }}>{archetype}</span>
            </div>
          </div>
          <p style={{
            textAlign: 'center', fontFamily: sans, fontSize: 13, color: G400,
            marginTop: 20, lineHeight: 1.5,
          }}>
            Illustrative preview. Your real report reflects your own responses across every dimension.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── WHO IT'S FOR ───────────────────────────────────────────────────
function WhoItsFor({ config }: { config: AssessmentLandingConfig }) {
  const { prefix, personas } = config;
  const list = personas && personas.length ? personas : [];

  return (
    <section id="who" style={{ padding: '96px 0', background: WHITE }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`}><SectionHead eyebrow="Who it's for">
          Built for leaders <em style={{ fontWeight: 400, fontStyle: 'italic' }}>in transition</em>
        </SectionHead></div>
        {list.length > 0 ? (
          <div className={`${prefix}-reveal`} style={{
            display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
            gap: 1, background: G200, border: `1px solid ${G200}`,
          }}>
            {list.map((p) => (
              <div key={p.title} style={{ background: WHITE, padding: '40px 32px' }}>
                <div style={{ width: 48, height: 3, background: ACCENT, marginBottom: 24 }} />
                <h3 style={{
                  fontFamily: serif, fontWeight: 700, fontSize: 22, color: INK,
                  lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.01em',
                }}>
                  {p.title}
                </h3>
                <p style={{ fontFamily: sans, fontSize: 15, color: G600, lineHeight: 1.6, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: G600, fontFamily: sans }}>
            Designed for executives navigating their next mandate.
          </p>
        )}
      </div>
    </section>
  );
}

// ── PRICING ────────────────────────────────────────────────────────
function Pricing({ config, catalog }: { config: AssessmentLandingConfig; catalog: AssessmentInfo | undefined }) {
  const { prefix } = config;
  const priceUsd = catalog?.priceMiles ?? 99;
  const priceTierLabel = priceUsd >= 149 ? 'Premium' : 'Standard';
  const tiers = catalog?.pricing ?? [];

  const ctaBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '14px 28px', background: ACCENT, color: WHITE,
    fontFamily: sans, fontSize: 14, fontWeight: 600,
    textDecoration: 'none', border: `1px solid ${ACCENT}`, cursor: 'pointer',
    minHeight: 48, transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  };

  return (
    <section id="pricing" style={{ padding: '96px 0', background: OFF }}>
      <div style={containerStyle}>
        <div className={`${prefix}-reveal`}><SectionHead eyebrow="Pricing">
          One assessment, <em style={{ fontWeight: 400, fontStyle: 'italic' }}>three depths</em>
        </SectionHead></div>

        {/* Per-assessment callout */}
        <div className={`${prefix}-reveal`} style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, background: WHITE, border: `1px solid ${G200}`, padding: '32px 36px', marginBottom: 24,
        }}>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: EYEBROW_GRAY, marginBottom: 10,
            }}>
              {priceTierLabel} · per assessment
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, color: INK, lineHeight: 1 }}>${priceUsd}</span>
              <span style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: G600,
              }}>USD</span>
            </div>
            <p style={{ fontFamily: sans, fontSize: 14, color: G600, margin: '10px 0 0', lineHeight: 1.5 }}>
              One-time. Full assessment plus your PDF scorecard and archetype profile.
            </p>
          </div>
          <Link to={config.ctaHref} style={ctaBtn} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = INK; e.currentTarget.style.borderColor = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; }}>
            Start assessment <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>

        {/* Tier strip */}
        {tiers.length > 0 && (
          <div className={`${prefix}-reveal`} style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 1,
            background: G200, border: `1px solid ${G200}`,
          }}>
            {tiers.map((t) => {
              const isPro = t.tier === 'professional';
              return (
                <div key={t.tier} style={{
                  background: isPro ? INK : WHITE, padding: '28px 24px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                    fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: isPro ? ACCENT : EYEBROW_GRAY, marginBottom: 12,
                  }}>
                    {t.tier === 'intro' ? 'Executive Introduction' : t.tier === 'professional' ? 'Professional · Recommended' : 'Executive Advisory'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                    <span style={{
                      fontFamily: serif, fontSize: 26, fontWeight: 700, lineHeight: 1,
                      color: isPro ? WHITE : INK,
                    }}>${t.miles_cost}</span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: isPro ? G300 : G600,
                    }}>USD</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {t.features.slice(0, 3).map((f) => (
                      <li key={f} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        fontFamily: sans, fontSize: 13, lineHeight: 1.45,
                        color: isPro ? G300 : G600,
                      }}>
                        <span style={{
                          width: 14, height: 14, flexShrink: 0, marginTop: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: ACCENT,
                        }}>
                          <Check style={{ width: 9, height: 9, color: WHITE }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        <p style={{
          textAlign: 'center', fontFamily: sans, fontSize: 13, color: G600,
          marginTop: 24, lineHeight: 1.5,
        }}>
          Full report and development roadmap included with the <strong style={{ color: INK, fontWeight: 600 }}>Professional tier</strong> ($149 USD).
        </p>
      </div>
    </section>
  );
}

// ── FINAL CTA ──────────────────────────────────────────────────────
function FinalCTA({ config }: { config: AssessmentLandingConfig }) {
  const { name, prefix, ctaHref } = config;
  const ctaBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '16px 36px', background: ACCENT, color: WHITE,
    fontFamily: sans, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
    textDecoration: 'none', border: `1px solid ${ACCENT}`, cursor: 'pointer',
    minHeight: 52, transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  };

  return (
    <section style={{ padding: '112px 0', background: INK }}>
      <div style={containerStyle} className={`${prefix}-reveal`}>
        <div style={{ width: 48, height: 3, background: ACCENT, margin: '0 auto 24px' }} />
        <h2 style={{
          fontFamily: serif, fontWeight: 700, fontSize: 'clamp(28px, 4vw, 38px)',
          lineHeight: 1.18, color: WHITE, textAlign: 'center', letterSpacing: '-0.01em',
          maxWidth: 620, margin: '0 auto 16px',
        }}>
          Ready to discover your <em style={{ fontWeight: 400, fontStyle: 'italic' }}>{name} profile?</em>
        </h2>
        <p style={{
          fontFamily: sans, fontSize: 17, color: G300, textAlign: 'center',
          maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.6,
        }}>
          A few minutes. A clear scorecard. A concrete next step.
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link to={ctaHref} style={ctaBtn} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; e.currentTarget.style.borderColor = WHITE; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = WHITE; e.currentTarget.style.borderColor = ACCENT; }}>
            Start assessment <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────
function Footer({ config }: { config: AssessmentLandingConfig }) {
  const { name } = config;
  const footerLink: React.CSSProperties = { color: G600, textDecoration: 'none', fontSize: 13, lineHeight: 2 };

  return (
    <footer style={{ background: OFF, borderTop: `1px solid ${G200}`, padding: '64px 0 32px' }}>
      <div style={containerStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          <div>
            <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: INK }}>{name}</span>
            <p style={{ fontSize: 13, color: G600, marginTop: 12, lineHeight: 1.5 }}>
              Part of the LYC Intelligence assessment suite. Know where you stand. Know where to go.
            </p>
          </div>
          <div>
            <div style={{ ...monoStyle, color: EYEBROW_GRAY, marginBottom: 12 }}>Assessments</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/prism" style={footerLink}>PRISM</Link>
              <Link to="/spark" style={footerLink}>SPARK</Link>
              <Link to="/forge" style={footerLink}>FORGE</Link>
              <Link to="/bridge" style={footerLink}>BRIDGE</Link>
              <Link to="/mosaic" style={footerLink}>MOSAIC</Link>
              <Link to="/drive" style={footerLink}>DRIVE</Link>
            </div>
          </div>
          <div>
            <div style={{ ...monoStyle, color: EYEBROW_GRAY, marginBottom: 12 }}>Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/nexus" style={footerLink}>NEXUS</Link>
              <Link to="/dex-ai" style={footerLink}>LYC Intelligence</Link>
              <Link to="/pricing" style={footerLink}>Pricing</Link>
              <Link to="/login" style={footerLink}>Login</Link>
            </div>
          </div>
        </div>
        <div style={{
          paddingTop: 32, borderTop: `1px solid ${G200}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: 12, color: EYEBROW_GRAY }}>© 2026 LYC Intelligence by LYC Partners.</span>
          <span style={{ ...monoStyle, color: ACCENT }}>{name}</span>
        </div>
      </div>
    </footer>
  );
}

// ── MAIN WRAPPER ───────────────────────────────────────────────────
export function AssessmentLanding({ config }: Props) {
  useScrollReveal(config.prefix);
  // #1376 — pull canonical data for all 6 assessments from the catalog so the
  // template never hardcodes content. Falls back to config when a code is not
  // in the catalog (defensive — keeps the template robust for any caller).
  const catalog = ASSESSMENT_CATALOG[config.code] as AssessmentInfo | undefined;

  return (
    <div style={{
      background: OFF, color: INK, minHeight: '100vh',
      fontFamily: sans, lineHeight: 1.6, WebkitFontSmoothing: 'antialiased',
    }}>
      <Nav config={config} />
      <main>
        <Hero config={config} catalog={catalog} />
        <WhatYoullDiscover config={config} catalog={catalog} />
        <HowItWorks config={config} catalog={catalog} />
        <SamplePreview config={config} catalog={catalog} />
        <WhoItsFor config={config} />
        <Pricing config={config} catalog={catalog} />
        <FinalCTA config={config} />
      </main>
      <Footer config={config} />
      <RevealStyles prefix={config.prefix} />
    </div>
  );
}
