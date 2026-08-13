/**
 * Phase 17 / P2-1 — Branded 404 — on-brand, useful links, never drops traffic.
 *
 * Visual contract with LYC brand rollout:
 *   - Accent #C108AB (magenta) for primary CTA / accent bar
 *   - Display headings: System serif stack (DejaVu Serif / Georgia / Times)
 *   - Body copy: DM Sans
 *   - Zero radius everywhere (no rounded corners)
 *   - No drop-shadow chrome — flat premium
 *   - Tone: warm + deterministic (not cutesy) — this is for executives
 */
import React from 'react';
import { ArrowRight, Compass, Home, Search } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';
import { DS, WHITE } from '@/tokens';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: DS.bg,
        display: 'flex',
        alignItems: 'stretch',
        fontFamily: DS.bodyFont,
        color: DS.text,
      }}
    >
      <SEO title="Page Not Found — LYC Intelligence" description="The page you're looking for doesn't exist. Explore LYC Intelligence assessments and NEXUS AI coaching." path="/404" />
      {/* Left column — accent bar + 404 wordmark */}
      <div
        style={{
          width: 'clamp(220px, 32vw, 440px)',
          background: DS.bgDark,
          color: WHITE,
          padding: 'clamp(32px, 6vw, 72px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: `3px solid ${DS.accent}`,
        }}
      >
        <div>
          <div
            aria-hidden
            style={{
              display: 'inline-block',
              height: 6,
              width: 96,
              background: DS.accent,
              marginBottom: 40,
            }}
          />
          <div
            style={{
              fontFamily: DS.headingFont,
              fontSize: 'clamp(72px, 12vw, 160px)',
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            404
          </div>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: DS.eyebrow,
              marginTop: 32,
              marginBottom: 0,
              fontWeight: 600,
            }}
          >
            Route not in market
          </p>
        </div>

        <div style={{ opacity: 0.72, fontSize: 12, letterSpacing: '0.02em' }}>
          <div style={{ marginBottom: 8 }}>LYC Intelligence</div>
          <div>lyc-intelligence.app</div>
        </div>
      </div>

      {/* Right column — narrative + CTAs */}
      <main
        style={{
          flex: 1,
          padding: 'clamp(32px, 6vw, 88px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
        }}
      >
        <h1
          style={{
            fontFamily: DS.headingFont,
            fontSize: 'clamp(28px, 3.4vw, 44px)',
            lineHeight: 1.15,
            fontWeight: 700,
            margin: 0,
            color: DS.text,
            maxWidth: 640,
          }}
        >
          The page you were looking for doesn&rsquo;t trade here anymore.
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: DS.textSecondary,
            maxWidth: 560,
            marginTop: 24,
            marginBottom: 48,
          }}
        >
          The link may be out of date, mis-typed, or the page may have moved during our
          portal re-organisation. We don&rsquo;t want to lose you — try one of the paths below.
        </p>

        {/* Primary CTA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 56 }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 22px',
              background: DS.accent,
              color: WHITE,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            <Home size={16} />
            Return home
            <ArrowRight size={16} />
          </a>
          <a
            href="/nexus/chat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 22px',
              border: `1.5px solid ${DS.text}`,
              color: DS.text,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            <Compass size={16} />
            Ask NEXUS where to go
          </a>
        </div>

        {/* Suggested routes — 4 useful escape hatches */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: DS.eyebrow,
              marginBottom: 16,
            }}
          >
            Popular routes
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              maxWidth: 720,
            }}
          >
            {[
              { href: '/pricing',                  icon: <Search size={15} />,  label: 'Pricing & Tiers',          sub: 'Executive Introduction → Council' },
              { href: '/assessment/prism',         icon: <Search size={15} />,  label: 'PRISM Transition Diagnostic', sub: 'Career transition clarity' },
              { href: '/assessments',              icon: <Search size={15} />,  label: 'All 6 Leadership Assessments', sub: 'Browse the full catalog' },
              { href: '/nexus',                    icon: <Search size={15} />,  label: 'NEXUS AI',                 sub: 'Conversational leadership advisor' },
            ].map((r) => (
              <a
                key={r.href}
                href={r.href}
                style={{
                  padding: '16px 18px',
                  border: `1px solid ${DS.border}`,
                  textDecoration: 'none',
                  color: DS.text,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  transition: 'border-color 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = DS.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = DS.border)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
                  {r.icon}
                  <span>{r.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: DS.accent }} />
                </div>
                <div style={{ fontSize: 13, color: DS.muted }}>{r.sub}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Error signature footer */}
        <div
          style={{
            marginTop: 64,
            fontSize: 12,
            color: DS.mutedDim,
            fontFamily: DS.monoFont,
          }}
        >
          HTTP 404 · NotFoundRoute · if you believe this is a platform error, contact{' '}
          <a
            href="mailto:ops@lyc-intelligence.app"
            style={{ color: DS.accent, textDecoration: 'none' }}
          >
            ops@lyc-intelligence.app
          </a>
        </div>
      </main>
    </div>
  );
}
