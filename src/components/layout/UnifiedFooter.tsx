import React from 'react';

/**
 * #1377 — Footer redesign (premium, B2C-focused).
 *
 * Brand spec v1.2:
 *   - Light background (#F9FAFB) with dark text — clean, modern, not SaaS-y
 *   - Column headers as light-gray eyebrows (#9CA3AF), not accent color
 *   - Zero border radius (global CSS enforces this)
 *   - Crimson Pro brand wordmark, DM Sans body, IBM Plex Mono bottom bar
 *   - One accent (#C108AB) used only for the CTA button
 *   - B2B links removed from main columns; tiny "For Business" in bottom bar
 *   - Mobile-responsive: single-column stack below 768px
 */

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  bg: '#F9FAFB',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#374151',
  muted: '#6B7280',
  eyebrow: '#9CA3AF',
};

const links = {
  product: [
    { href: '/assessments', label: 'Leadership Assessments' },
    { href: '/nexus', label: 'NEXUS AI' },
    { href: '/pricing', label: 'Pricing' },
  ],
  resources: [
    { href: '/terms', label: 'Terms' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/cookies', label: 'Cookies' },
  ],
};

export function UnifiedFooter() {
  return (
    <footer
      data-role="site-footer"
      style={{
        background: DS.bg,
        borderTop: `1px solid ${DS.border}`,
        padding: '56px 32px 24px',
        margin: 0,
        width: '100%',
        fontFamily: DS.bodyFont,
      }}
    >
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: '40px',
        }}
        className="footer-grid"
      >
        {/* Brand */}
        <div>
          <a
            href="/"
            style={{
              fontFamily: DS.headingFont,
              fontSize: '22px',
              fontWeight: 700,
              color: DS.text,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            LYC Intelligence
          </a>
          <p
            style={{
              fontSize: '13px',
              color: DS.muted,
              marginTop: '14px',
              lineHeight: 1.6,
              maxWidth: '260px',
            }}
          >
            Assessment-driven leadership intelligence for executives navigating
            cross-border careers and senior transitions.
          </p>
          <div
            style={{
              marginTop: '18px',
              fontFamily: DS.monoFont,
              fontSize: '10px',
              color: DS.eyebrow,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            6 Assessments · NEXUS AI · APAC
          </div>
        </div>

        {/* Product */}
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: DS.eyebrow,
              marginBottom: '16px',
            }}
          >
            Product
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-label="Product">
            {links.product.map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: '13px',
                  color: DS.textSecondary,
                  textDecoration: 'none',
                  transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
                  minHeight: '20px',
                  display: 'inline-block',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.textSecondary)}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Resources */}
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: DS.eyebrow,
              marginBottom: '16px',
            }}
          >
            Legal
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} aria-label="Legal">
            {links.resources.map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontSize: '13px',
                  color: DS.textSecondary,
                  textDecoration: 'none',
                  transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
                  minHeight: '20px',
                  display: 'inline-block',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = DS.accent)}
                onMouseLeave={e => (e.currentTarget.style.color = DS.textSecondary)}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* CTA */}
        <div>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: DS.eyebrow,
              marginBottom: '16px',
            }}
          >
            Get Started
          </div>
          <a
            href="/nexus"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FFFFFF',
              background: DS.accent,
              padding: '12px 22px',
              textDecoration: 'none',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              minHeight: '44px',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A00790')}
            onMouseLeave={e => (e.currentTarget.style.background = DS.accent)}
          >
            Meet NEXUS
          </a>
          <p
            style={{
              fontSize: '12px',
              color: DS.muted,
              lineHeight: 1.6,
              marginTop: '14px',
            }}
          >
            3 complimentary messages. No credit card.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '1080px',
          margin: '48px auto 0',
          paddingTop: '20px',
          borderTop: `1px solid ${DS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '12px', color: DS.muted }}>
          &copy; {new Date().getFullYear()} LYC Intelligence by LYC Partners.
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a
            href="/b2b"
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              color: DS.eyebrow,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = DS.textSecondary)}
            onMouseLeave={e => (e.currentTarget.style.color = DS.eyebrow)}
          >
            For Business
          </a>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              color: DS.eyebrow,
              letterSpacing: '0.12em',
            }}
          >
            Know where you stand. Know where to go.
          </div>
        </div>
      </div>
    </footer>
  );
}
