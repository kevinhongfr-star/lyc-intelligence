/**
 * V4.5.8 — ERROR PAGE (404) — V1 re-skin
 *
 * Route: /404 (and unmatched routes)
 *
 * Centered marketing layout. Editorial, restrained.
 *  - Mono eyebrow: "404"
 *  - Display title: understated, not cutesy
 *  - Sub: one line
 *  - CTA button: "Go back home →"
 *
 * V1 rules: 0px radius, no shadows, cream background, serif display,
 * mono labels, teal primary. No illustrations, no emoji, no silly copy.
 *
 * All routing, SEO, and escape-hatch logic stays the same.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { V1 } from '@/styles/v1-tokens';

const POPULAR_ROUTES = [
  { href: '/nexus', label: 'NEXUS', sub: 'Conversational leadership advisor' },
  { href: '/assessments', label: 'Assessments', sub: 'Browse all 6 lenses' },
  { href: '/pricing', label: 'Membership', sub: 'Executive Introduction → Council' },
  { href: '/login', label: 'Sign in', sub: 'Return to your workspace' },
];

export default function NotFoundPage() {
  return (
    <div className="v1-scope" style={{
      minHeight: '100vh', background: V1.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: V1.bodyFont, color: V1.text,
    }}>
      <style>{`
        @keyframes v1-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .v1-enter { animation: v1-fade-up ${V1.durNormal}ms ${V1.ease} both; }
      `}</style>

      <SEO
        title="Page Not Found — NEXUS"
        description="The page you're looking for doesn't exist. Explore NEXUS assessments and the executive intelligence system."
        path="/404"
      />

      {/* Minimal top bar — wordmark only */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `20px ${V1.shellPad}px`, borderBottom: `1px solid ${V1.border}`,
      }}>
        <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
          NEXUS<span className="v1-dot">.</span>
        </Link>
      </nav>

      {/* Centered editorial 404 */}
      <main className="v1-enter" style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: `${V1.marketingPadY}px 24px`,
      }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          {/* Mono eyebrow */}
          <div className="v1-mono" style={{
            fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
            textTransform: 'uppercase', color: V1.textMuted,
            marginBottom: 24,
          }}>
            404 · Not found
          </div>

          {/* Display title — understated */}
          <h1 style={{
            fontFamily: V1.displayFont, fontSize: V1.textH1, color: V1.text,
            fontWeight: V1.fwRegular, letterSpacing: V1.trackingTight,
            lineHeight: V1.leadingHeading, margin: '0 0 16px',
          }}>
            This page isn&rsquo;t here.
          </h1>

          {/* Sub — one line */}
          <p style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.textSecondary,
            lineHeight: 1.55, margin: '0 0 40px',
          }}>
            The link may be out of date, mistyped, or moved during our last reorganization.
          </p>

          {/* Primary CTA */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 48, padding: '14px 28px',
            background: V1.teal800, color: V1.white,
            border: 'none', fontFamily: V1.bodyFont, fontSize: 15, fontWeight: V1.fwSemibold,
            textDecoration: 'none', boxSizing: 'border-box',
            transition: `background ${V1.durFast}ms ${V1.ease}`,
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal900)}
            onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}>
            Go back home →
          </Link>

          {/* Popular routes — restrained, useful escape hatches */}
          <div style={{ marginTop: 80 }}>
            <div className="v1-mono" style={{
              fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
              textTransform: 'uppercase', color: V1.textMuted, marginBottom: 20,
            }}>
              Or continue to
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1,
              background: V1.border, border: `1px solid ${V1.border}`,
              maxWidth: 560, margin: '0 auto',
            }}>
              {POPULAR_ROUTES.map((r) => (
                <Link
                  key={r.href}
                  to={r.href}
                  style={{
                    padding: '20px 24px', background: V1.surface,
                    textDecoration: 'none', color: V1.text,
                    display: 'flex', flexDirection: 'column', gap: 4,
                    transition: `background ${V1.durFast}ms ${V1.ease}`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = V1.surfaceAlt)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = V1.surface)}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    fontWeight: V1.fwSemibold, color: V1.text,
                  }}>
                    <span>{r.label}</span>
                    <span aria-hidden="true" style={{
                      marginLeft: 'auto', color: V1.teal700, fontSize: V1.textBodySm,
                    }}>→</span>
                  </div>
                  <div className="v1-mono" style={{
                    fontSize: V1.textCaption, color: V1.textMuted,
                    letterSpacing: V1.trackingMono,
                  }}>
                    {r.sub}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Error signature — mono, small, restrained */}
          <div className="v1-mono" style={{
            marginTop: 64, fontSize: V1.textCaption, color: V1.textDim,
            letterSpacing: V1.trackingMono,
          }}>
            HTTP 404 · NotFoundRoute
          </div>
        </div>
      </main>
    </div>
  );
}
