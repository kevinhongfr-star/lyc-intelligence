import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initScrollReveal } from '@/lib/utils';
import { V3 } from '@/styles/v3-tokens';
import { SEO } from '@/components/seo/SEO';
import { trackCTA } from '@/analytics/eventTracker';
import { HOME_TIERS } from '@/config/marketing-data';

/**
 * V7.0 — Landing page (home). Replaces the V6.1 landing.
 *
 * Rendered inside the shared MarketingLayout, which supplies the fixed nav
 * + footer — this file contains page content only (no nav, no footer).
 *
 * Canon: Ocean primary, Teal secondary (cyan-leaning), Fuchsia punctuation
 * only. Editorial minimalism — rule lines (1px solid), zero radius, no
 * shadows, no gradients (sole exception: a subtle radial glow in the final
 * CTA). NEXUS. wordmark (no space before dot). Hero video with a 60% SOLID
 * black scrim, pulled behind the fixed nav via marginTop: -navHeight.
 *
 * Copy is locked per spec. All CTAs route to /auth and fire trackCTA with a
 * location string (hero | tiers | capabilities | final-cta).
 */

const AUTH = '/auth';
const MEMBERSHIP = '/membership';

// ── 11 lenses (compact capabilities row) ──
const LENSES: string[] = [
  'PRISM',
  'LEAP',
  'MOSAIC',
  'BRIDGE',
  'COACH',
  'IMPACT',
  'DRIVE',
  'QUEST',
  'SPARK',
  'FORGE',
  'CPI',
];

// ── What It Is — 4 numbered items ──
const PILLARS: Array<{ n: string; body: string }> = [
  {
    n: '01',
    body: "Talk through what's on your mind. NEXUS listens, remembers everything, and asks the questions you haven't thought to ask yourself yet.",
  },
  {
    n: '02',
    body: "Your thinking builds over time. You can see the shape of your progression across four pillars — positioning, leadership, operating, narrative — not just a list of tasks.",
  },
  {
    n: '03',
    body: 'When you want structure, use a lens. Eleven different ways of looking at the same situation, each built around how senior leaders actually think.',
  },
  {
    n: '04',
    body: "Sometimes you need a human in the room. Book a debrief with an LYC advisor who already knows your context. No intake forms, no catching up.",
  },
];

// ── Shared style helpers ──
const eyebrowStyle: React.CSSProperties = {
  fontFamily: V3.monoFont,
  fontSize: '0.68rem',
  letterSpacing: V3.trackingMono,
  textTransform: 'uppercase',
  fontWeight: V3.fwRegular,
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: V3.displayFont,
  fontSize: V3.textSectionTitle,
  lineHeight: V3.leadingSectionTitle,
  fontWeight: V3.fwRegular,
  color: V3.ink900,
  letterSpacing: V3.trackingDisplay,
  margin: 0,
};

const bodySerifStyle: React.CSSProperties = {
  fontFamily: V3.displayFont,
  fontSize: V3.textBodySerif,
  lineHeight: V3.leadingBodySerif,
  fontWeight: V3.fwRegular,
  color: V3.ink700,
};

// ═══════════════════════════════════════════════════════════════════════
// V7.0-2b — Hero (full viewport, video bg, 60% SOLID black scrim)
// ═══════════════════════════════════════════════════════════════════════

function Hero(): React.ReactElement {
  const primaryCtaStyle: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: V3.bodyFont,
    fontSize: '0.9rem',
    fontWeight: V3.fwMedium,
    color: V3.cream,
    background: V3.ink900,
    padding: '14px 28px',
    border: 'none',
    textDecoration: 'none',
    transition: `background ${V3.durNormal}ms ${V3.ease}`,
  };

  const secondaryCtaStyle: React.CSSProperties = {
    fontFamily: V3.bodyFont,
    fontSize: '0.9rem',
    color: V3.teal300,
    textDecoration: 'none',
    borderBottom: `1px solid ${V3.teal300}`,
    paddingBottom: 2,
  };

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: V3.ink900, // #0A0A0A fallback if video fails
        marginTop: -V3.navHeight, // pull behind the fixed nav
      }}
    >
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* 60% SOLID black scrim — NOT a gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10,10,10,0.6)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        className="v3-hero-content"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: V3.contentMax,
          margin: '0 auto',
          padding: '0 32px',
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <p
            className="reveal v3-eyebrow"
            style={{
              ...eyebrowStyle,
              color: V3.teal400,
              margin: '0 0 24px 0',
            }}
          >
            Executive Intelligence
          </p>

          <h1
            className="reveal v3-headline"
            style={{
              fontFamily: V3.displayFont,
              fontSize: V3.textHero,
              lineHeight: V3.leadingHero,
              fontWeight: V3.fwLight,
              color: V3.cream,
              letterSpacing: V3.trackingDisplay,
              margin: '0 0 36px 0',
            }}
          >
            Know where you stand.
            <br />
            <span style={{ fontStyle: 'italic', color: V3.teal300 }}>
              Know where to go.
            </span>
          </h1>

          <div className="reveal" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <Link
              to={AUTH}
              onClick={() => trackCTA({ location: 'hero', label: 'Start here', destination: AUTH })}
              style={primaryCtaStyle}
              className="v3-cta-primary"
            >
              Start here
            </Link>
            <Link
              to="/what"
              onClick={() => trackCTA({ location: 'hero', label: 'What it is', destination: '/what' })}
              style={secondaryCtaStyle}
            >
              What it is
            </Link>
          </div>
        </div>

        {/* Fuchsia focal dot at right edge */}
        <span
          className="v3-focal-dot"
          aria-hidden
          style={{
            position: 'absolute',
            right: 32,
            top: '50%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: V3.fuchsia600,
            transform: 'translateY(-50%)',
          }}
        />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V7.0-2c — What It Is
// ═══════════════════════════════════════════════════════════════════════

function WhatItIs(): React.ReactElement {
  return (
    <section
      id="what-it-is"
      className="reveal"
      style={{
        background: V3.cream,
        padding: `${V3.marketingPadY}px 32px`,
      }}
    >
      <div style={{ maxWidth: V3.contentMax, margin: '0 auto' }}>
        <p className="reveal v3-eyebrow" style={{ ...eyebrowStyle, color: V3.ocean600, margin: '0 0 20px 0' }}>What it is</p>
        <h2 className="reveal v3-headline" style={{ ...sectionTitleStyle, marginBottom: 24 }}>
          A place for the thinking
          <br />
          you can't take anywhere else.
        </h2>
        <p className="reveal" style={{ ...bodySerifStyle, maxWidth: 680, marginBottom: 64 }}>
          The full picture of where you are and where you're heading. Always on. Fully discreet. Gets sharper the more you talk.
        </p>

        <div>
          {PILLARS.map((p, i) => (
            <div
              key={p.n}
              className={`v3-what-item v3-stagger-${i + 1} reveal`}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: 32,
                padding: '32px 0',
                borderTop: i === 0 ? `1px solid ${V3.ink200}` : 'none',
                borderBottom: `1px solid ${V3.ink200}`,
              }}
            >
              <span
                style={{
                  fontFamily: V3.monoFont,
                  fontSize: '0.9rem',
                  color: V3.ocean600,
                  letterSpacing: V3.trackingMono,
                  paddingTop: 4,
                }}
              >
                {p.n}
              </span>
              <p style={{ ...bodySerifStyle, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V7.0-2d — Capabilities (11 lenses, single row, vertical rule lines)
// ═══════════════════════════════════════════════════════════════════════

function LensGlyph({ code }: { code: string }): React.ReactElement {
  // Minimal SVG line icon (24x24) — concentric framing, stroke 1.2, ocean-500.
  // Same visual primitive for all 11; the name differentiates.
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="v3-lens-icon" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="9" stroke={V3.ocean500} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="4" stroke={V3.ocean500} strokeWidth="1.2" />
      <line x1="12" y1="2" x2="12" y2="5" stroke={V3.ocean500} strokeWidth="1.2" />
      <line x1="12" y1="19" x2="12" y2="22" stroke={V3.ocean500} strokeWidth="1.2" />
    </svg>
  );
}

function Capabilities(): React.ReactElement {
  return (
    <section
      id="capabilities"
      className="reveal"
      style={{
        background: V3.cream,
        padding: `${V3.marketingPadY}px 32px`,
        borderTop: `1px solid ${V3.ink200}`,
      }}
    >
      <div style={{ maxWidth: V3.contentMax, margin: '0 auto' }}>
        <p className="reveal v3-eyebrow" style={{ ...eyebrowStyle, color: V3.ocean600, margin: '0 0 20px 0' }}>Capabilities</p>
        <h2 className="reveal v3-headline" style={{ ...sectionTitleStyle, marginBottom: 24 }}>
          Eleven ways to look deeper.
          <br />
          One place that holds them all.
        </h2>
        <p className="reveal" style={{ ...bodySerifStyle, maxWidth: 680, marginBottom: 56 }}>
          Use them one at a time. Or just talk through what's on your mind — the right lens finds you.
        </p>

        {/* Single row of 11 lens cells with vertical rule lines */}
        <div
          className="v3-lens-row"
          style={{
            display: 'flex',
            borderTop: `1px solid ${V3.ink200}`,
            borderBottom: `1px solid ${V3.ink200}`,
          }}
        >
          {LENSES.map((code, i) => (
            <div
              key={code}
              className={`v3-lens-cell v3-stagger-${i + 1} reveal`}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                padding: '28px 12px',
                borderLeft: i === 0 ? 'none' : `1px solid ${V3.ink200}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <LensGlyph code={code} />
              <span
                style={{
                  fontFamily: V3.monoFont,
                  fontSize: '0.62rem',
                  letterSpacing: V3.trackingMono,
                  textTransform: 'uppercase',
                  color: V3.ink700,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {code}
              </span>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div
          className="v3-cap-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 28,
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              fontFamily: V3.bodyFont,
              fontSize: '0.85rem',
              color: V3.ink500,
              margin: 0,
            }}
          >
            CPI is the flagship — a private day with your advisor, by introduction only.
          </p>
          <Link
            to="/how"
            onClick={() => trackCTA({ location: 'capabilities', label: 'See how it works', destination: '/how' })}
            style={{
              fontFamily: V3.bodyFont,
              fontSize: '0.85rem',
              color: V3.ocean600,
              textDecoration: 'none',
              borderBottom: `1px solid ${V3.ocean600}`,
              paddingBottom: 2,
            }}
          >
            See how it works →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V7.0-2e — Membership (5 tiers, Pro featured dark)
// ═══════════════════════════════════════════════════════════════════════

function Membership(): React.ReactElement {
  return (
    <section
      id="membership"
      className="reveal"
      style={{
        background: V3.cream,
        padding: `${V3.marketingPadY}px 32px`,
        borderTop: `1px solid ${V3.ink200}`,
      }}
    >
      <div style={{ maxWidth: V3.contentMax, margin: '0 auto' }}>
        <p className="reveal v3-eyebrow" style={{ ...eyebrowStyle, color: V3.ocean600, margin: '0 0 20px 0' }}>Membership</p>
        <h2 className="reveal v3-headline" style={{ ...sectionTitleStyle, marginBottom: 24 }}>
          Five levels.
          <br />
          One standard of discretion.
        </h2>
        <p className="reveal" style={{ ...bodySerifStyle, maxWidth: 680, marginBottom: 56 }}>
          Start wherever it makes sense. Move up when the work calls for it. Every tier gets the same measured, competent attention.
        </p>

        {/* 5-column grid with rule lines (not cards) */}
        <div
          className="v3-tier-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            borderTop: `1px solid ${V3.ink200}`,
            borderBottom: `1px solid ${V3.ink200}`,
          }}
        >
          {HOME_TIERS.map((tier, i) => {
            const featured = tier.featured === true;
            return (
              <div
                key={tier.name}
                className={`v3-tier-col v3-stagger-${i + 1} reveal`}
                style={{
                  padding: '36px 24px',
                  borderLeft: i === 0 ? 'none' : `1px solid ${featured ? 'rgba(255,255,255,0.1)' : V3.ink200}`,
                  background: featured ? V3.ink900 : 'transparent',
                  color: featured ? V3.cream : V3.ink900,
                  borderTop: featured ? `3px solid ${V3.teal400}` : '3px solid transparent',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <span
                  style={{
                    ...eyebrowStyle,
                    color: featured ? V3.teal400 : V3.ink500,
                    margin: '0 0 16px 0',
                  }}
                >
                  {tier.level}
                </span>
                <h3
                  style={{
                    fontFamily: V3.displayFont,
                    fontSize: '1.3rem',
                    fontWeight: V3.fwRegular,
                    lineHeight: 1.2,
                    margin: '0 0 8px 0',
                    color: featured ? V3.cream : V3.ink900,
                  }}
                >
                  {tier.name}
                </h3>
                <p
                  style={{
                    fontFamily: V3.displayFont,
                    fontSize: '1.1rem',
                    fontWeight: V3.fwRegular,
                    color: featured ? V3.teal300 : V3.ink700,
                    margin: '0 0 28px 0',
                  }}
                >
                  {tier.price}
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 32px 0',
                    flex: 1,
                  }}
                >
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontFamily: V3.bodyFont,
                        fontSize: '0.82rem',
                        lineHeight: 1.5,
                        color: featured ? 'rgba(250,250,250,0.82)' : V3.ink700,
                        padding: '8px 0',
                        borderBottom: `1px solid ${featured ? 'rgba(255,255,255,0.08)' : V3.ink200}`,
                      }}
                    >
                      <span style={{ color: featured ? V3.teal300 : V3.ocean500, marginRight: 8 }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={MEMBERSHIP}
                  onClick={() => trackCTA({ location: 'tiers', label: tier.cta, destination: MEMBERSHIP, context_id: tier.name })}
                  style={{
                    fontFamily: V3.bodyFont,
                    fontSize: '0.82rem',
                    color: featured ? V3.cream : V3.ocean600,
                    textDecoration: 'none',
                    borderBottom: `1px solid ${featured ? V3.cream : V3.ocean600}`,
                    paddingBottom: 2,
                    alignSelf: 'flex-start',
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V7.0-2f — Testimonial
// ═══════════════════════════════════════════════════════════════════════

function Testimonial(): React.ReactElement {
  return (
    <section
      className="reveal"
      style={{
        background: V3.cream,
        padding: `${V3.marketingPadY}px 32px`,
        borderTop: `1px solid ${V3.ink200}`,
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <span
          className="v3-quote-mark reveal"
          aria-hidden
          style={{
            display: 'block',
            fontFamily: V3.displayFont,
            fontSize: '6rem',
            lineHeight: 1,
            color: V3.ocean200,
            margin: '0 0 8px 0',
          }}
        >
          &ldquo;
        </span>
        <p
          style={{
            fontFamily: V3.displayFont,
            fontSize: '1.5rem',
            lineHeight: 1.4,
            fontWeight: V3.fwRegular,
            color: V3.ink900,
            margin: '0 0 32px 0',
          }}
        >
          I've had three coaches over the last ten years. None of them remembered the things I said three sessions ago. NEXUS does.
        </p>
        <p
          style={{
            ...eyebrowStyle,
            color: V3.ink500,
            margin: 0,
          }}
        >
          Willy Te / VP Operations · Fortune 500
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// V7.0-2g — Final CTA (dark, subtle radial glow)
// ═══════════════════════════════════════════════════════════════════════

function FinalCTA(): React.ReactElement {
  return (
    <section
      className="reveal"
      style={{
        position: 'relative',
        background: V3.ink900,
        padding: `${V3.marketingPadY}px 32px`,
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow — ocean-600 at ~26% opacity (the only gradient exception) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 600,
          height: 600,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${V3.ocean600}42 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
        <p className="reveal v3-eyebrow" style={{ ...eyebrowStyle, color: V3.teal400, margin: '0 0 20px 0' }}>Begin</p>
        <h2
          className="reveal v3-headline"
          style={{
            fontFamily: V3.displayFont,
            fontSize: V3.textSectionTitle,
            lineHeight: V3.leadingSectionTitle,
            fontWeight: V3.fwRegular,
            color: V3.cream,
            margin: '0 0 20px 0',
          }}
        >
          First session.
          <br />
          Complimentary.
        </h2>
        <p
          className="reveal"
          style={{
            fontFamily: V3.displayFont,
            fontSize: V3.textBodySerif,
            lineHeight: V3.leadingBodySerif,
            color: V3.onDarkMuted,
            margin: '0 0 36px 0',
          }}
        >
          A conversation about what's on your mind, and whether this is the right fit. You'll know quickly.
        </p>
        <Link
          to={AUTH}
          onClick={() => trackCTA({ location: 'final-cta', label: 'Start here', destination: AUTH })}
          style={{
            display: 'inline-block',
            fontFamily: V3.bodyFont,
            fontSize: '0.9rem',
            fontWeight: V3.fwMedium,
            color: V3.ink900,
            background: V3.cream,
            padding: '14px 28px',
            border: 'none',
            textDecoration: 'none',
            transition: `background ${V3.durNormal}ms ${V3.ease}`,
          }}
          className="v3-cta-primary"
        >
          Start here
        </Link>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Landing — page assembly
// ═══════════════════════════════════════════════════════════════════════

export function Landing(): React.ReactElement {
  useEffect(() => {
    const observer = initScrollReveal();
    return () => { if (observer) observer.disconnect(); };
  }, []);

  return (
    <>
      <SEO page="landing" />
      <Hero />
      <WhatItIs />
      <Capabilities />
      <Membership />
      <Testimonial />
      <FinalCTA />
    </>
  );
}

export default Landing;
