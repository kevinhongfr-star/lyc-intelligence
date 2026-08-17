/**
 * Phase 17 / P2-1 — Branded 404 — on-brand, useful links, never drops traffic.
 *
 * Visual contract with LYC brand rollout:
 *   - Accent #C108AB (magenta) for primary CTA / accent bar
 *   - Display headings: Libre Baskerville serif
 *   - Body copy: DM Sans
 *   - Zero radius everywhere (no rounded corners)
 *   - No drop-shadow chrome — flat premium
 *   - Tone: warm + deterministic (not cutesy) — this is for executives
 */
import React from 'react';
import { ArrowRight, Compass, Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'stretch',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: '#000000',
      }}
    >
      {/* Left column — accent bar + 404 wordmark */}
      <div
        style={{
          width: 'clamp(220px, 32vw, 440px)',
          background: '#0A0A0A',
          color: '#FFFFFF',
          padding: 'clamp(32px, 6vw, 72px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: `3px solid #C108AB`,
        }}
      >
        <div>
          <div
            aria-hidden
            style={{
              display: 'inline-block',
              height: 6,
              width: 96,
              background: '#C108AB',
              marginBottom: 40,
            }}
          />
          <div
            style={{
              fontFamily: "'Libre Baskerville', Georgia, serif",
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
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: '#C108AB',
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
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontSize: 'clamp(28px, 3.4vw, 44px)',
            lineHeight: 1.15,
            fontWeight: 700,
            margin: 0,
            color: '#000000',
            maxWidth: 640,
          }}
        >
          The page you were looking for doesn&rsquo;t trade here anymore.
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: '#444444',
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
              background: '#C108AB',
              color: '#FFFFFF',
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
              border: '1.5px solid #000000',
              color: '#000000',
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
              color: '#666666',
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
              { href: '/pricing',                  icon: <Search size={15} />,  label: 'Pricing & Tiers',          sub: 'Explorer → Executive → Council' },
              { href: '/assessment/cpi',           icon: <Search size={15} />,  label: 'CPI Diagnostic',          sub: 'China Leadership Pipeline Index' },
              { href: '/assessment',               icon: <Search size={15} />,  label: 'Career Core Diagnostics', sub: 'Career transition radar & more' },
              { href: '/b2b',                      icon: <Search size={15} />,  label: 'Executive Search (B2B)',  sub: 'Client / consultant portal' },
            ].map((r) => (
              <a
                key={r.href}
                href={r.href}
                style={{
                  padding: '16px 18px',
                  border: '1px solid #E5E5E5',
                  textDecoration: 'none',
                  color: '#000000',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  transition: 'border-color 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#C108AB')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E5E5')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
                  {r.icon}
                  <span>{r.label}</span>
                  <ArrowRight size={14} style={{ marginLeft: 'auto', color: '#C108AB' }} />
                </div>
                <div style={{ fontSize: 13, color: '#666666' }}>{r.sub}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Error signature footer */}
        <div
          style={{
            marginTop: 64,
            fontSize: 12,
            color: '#AAAAAA',
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          }}
        >
          HTTP 404 · NotFoundRoute · if you believe this is a system error, contact{' '}
          <a
            href="mailto:ops@lyc-intelligence.app"
            style={{ color: '#C108AB', textDecoration: 'none' }}
          >
            ops@lyc-intelligence.app
          </a>
        </div>
      </main>
    </div>
  );
}
