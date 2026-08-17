/**
 * Phase 9 Batch 6 ticket #1357 — on-brand 500 / error page.
 * Visual contract: System serif headings (DejaVu Serif / Georgia / Times), DM Sans body, IBM Plex Mono signatures,
 * zero radius, LYC fuchsia accent #C108AB, warm/deterministic tone for executives.
 */
import React from 'react';
import { ArrowRight, Home, Compass, RefreshCw } from 'lucide-react';
import { SEO } from '@/components/seo/SEO';

export default function ErrorPage() {
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
      <SEO title="Error — LYC Intelligence" description="Something went wrong. LYC Intelligence." path="/error" />
      {/* Left accent column */}
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
              fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
              fontSize: 'clamp(72px, 12vw, 160px)',
              lineHeight: 0.92,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            500
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
            Temporary market transition
          </p>
        </div>

        <div style={{ opacity: 0.72, fontSize: 12, letterSpacing: '0.02em' }}>
          <div style={{ marginBottom: 8 }}>LYC Intelligence</div>
          <div>lyc-intelligence.app</div>
        </div>
      </div>

      {/* Right column — narrative + escape hatches */}
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
            fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
            fontSize: 'clamp(28px, 3.4vw, 44px)',
            lineHeight: 1.15,
            fontWeight: 700,
            margin: 0,
            color: '#000000',
            maxWidth: 640,
          }}
        >
          Something interrupted your session.
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
          We hit an unexpected error while processing this request. Our operations team has been
          automatically notified and is looking into it. In the meantime, here are a few reliable
          paths to continue from.
        </p>

        {/* Primary CTA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 56 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 22px',
              background: '#C108AB',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <RefreshCw size={16} />
            Reload this page
            <ArrowRight size={16} />
          </button>
          <a
            href="/"
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
            <Home size={16} />
            Return home
          </a>
          <a
            href="/nexus"
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
            Go to NEXUS
          </a>
        </div>

        {/* Suggested routes */}
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
            Continue elsewhere
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
              { href: '/',                      label: 'Homepage',                 sub: 'Start fresh from the top' },
              { href: '/assessments',           label: 'Leadership Assessments',   sub: 'Browse the catalog' },
              { href: '/pricing',               label: 'Pricing & Tiers',          sub: 'See plans & benefits' },
              { href: '/nexus',                 label: 'NEXUS',                    sub: 'Conversational advisor' },
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
          HTTP 500 · UnexpectedException · if this persists please notify{' '}
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
