/**
 * V7.0 — MarketingLayout (v3.5 design system).
 *
 * Shared marketing shell: fixed dark nav + Outlet + dark footer.
 * Replaces the old Phase 16 MarketingLayout entirely.
 * Zero radius, no shadows, rule lines. Editorial minimalism.
 */
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import MarketingNav from '@/components/navigation/MarketingNav';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { V3 } from '@/styles/v3-tokens';
import { Wordmark, MonoLabel } from '@/components/marketing/v7-shell';
import { trackCTA } from '@/analytics/eventTracker';

function MarketingFooter(): React.ReactElement {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Lenses', href: '/lenses' },
        { label: 'Membership', href: '/membership' },
        { label: 'Journal', href: '/journal' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About LYC', href: '/what' },
        { label: 'Contact', href: 'mailto:hello@lycintelligence.com' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Security', href: '/security' },
      ],
    },
  ];

  return (
    <footer
      style={{
        background: V3.ink900,
        borderTop: `1px solid rgba(250,250,250,0.08)`,
        paddingTop: 80,
        paddingBottom: 32,
      }}
    >
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px' }}>
        {/* Top: wordmark + tagline + 3 cols */}
        <div
          className="v3-footer-top"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.2fr) repeat(3,minmax(0,1fr))',
            gap: 48,
            paddingBottom: 64,
          }}
        >
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Wordmark onDark size="md" />
            </Link>
            <p
              style={{
                fontFamily: V3.displayFont,
                fontSize: '1rem',
                lineHeight: 1.5,
                fontWeight: V3.fwLight,
                color: V3.onDarkMuted,
                margin: '16px 0 0 0',
                maxWidth: 280,
              }}
            >
              Executive intelligence. Always on.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <MonoLabel
                color="rgba(250,250,250,0.4)"
                style={{ display: 'block', marginBottom: 20 }}
              >
                {col.title}
              </MonoLabel>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('mailto:') ? (
                      <a
                        href={l.href}
                        style={{
                          fontFamily: V3.bodyFont,
                          fontSize: '0.9rem',
                          color: 'rgba(250,250,250,0.66)',
                          textDecoration: 'none',
                          transition: `color ${V3.durNormal}ms ${V3.ease}`,
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = V3.cream; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(250,250,250,0.66)'; }}
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.href}
                        onClick={() => trackCTA({ location: 'footer', label: l.label, destination: l.href })}
                        style={{
                          fontFamily: V3.bodyFont,
                          fontSize: '0.9rem',
                          color: 'rgba(250,250,250,0.66)',
                          textDecoration: 'none',
                          transition: `color ${V3.durNormal}ms ${V3.ease}`,
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = V3.cream; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(250,250,250,0.66)'; }}
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: `1px solid rgba(250,250,250,0.08)`,
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: V3.monoFont,
              fontSize: '0.68rem',
              letterSpacing: V3.trackingMono,
              textTransform: 'uppercase',
              color: 'rgba(250,250,250,0.4)',
            }}
          >
            © 2026 NEXUS.
          </span>
          <span
            style={{
              fontFamily: V3.monoFont,
              fontSize: '0.68rem',
              letterSpacing: V3.trackingMono,
              textTransform: 'uppercase',
              color: 'rgba(250,250,250,0.4)',
            }}
          >
            Shanghai · Singapore · Paris
          </span>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: V3.cream,
        fontFamily: V3.bodyFont,
      }}
      data-portal-kind="marketing"
    >
      <SkipToContent targetId="main-content" />
      <MarketingNav />
      <main
        id="main-content"
        aria-label="Main content"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: V3.navHeight }}
      >
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}

export default MarketingLayout;
