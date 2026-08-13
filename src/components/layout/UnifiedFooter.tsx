import React from 'react';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  bg: '#0A0A12',
  border: '#1E1E2C',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.55)',
  mutedDarker: 'rgba(255,255,255,0.35)',
  radius: '0px',
};

const links = {
  brand: [
    { href: '/', label: 'LYC Intelligence' },
  ],
  platform: [
    { href: '/nexus/chat', label: 'NEXUS AI' },
    { href: '/assessments', label: 'Leadership Assessments' },
  ],
  company: [
    { href: 'https://lyc-partners.ai', label: 'LYC Partners', external: true },
    { href: '/pricing', label: 'Pricing' },
    { href: '/terms', label: 'Terms' },
    { href: '/privacy', label: 'Privacy' },
  ],
};

export function UnifiedFooter() {
  return (
    <footer
      data-role="site-footer"
      style={{
        background: DS.bg,
        borderTop: `1px solid ${DS.border}`,
        padding: '64px 32px 24px',
        margin: 0,
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: '48px',
        }}
      >
        {/* Brand */}
        <div>
          <a
            href="/"
            style={{
              fontFamily: DS.headingFont,
              fontSize: '20px',
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
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              color: DS.muted,
              marginTop: '16px',
              lineHeight: 1.6,
              maxWidth: '280px',
            }}
          >
            Assessment-driven leadership intelligence for executives, boards, and the firms that advise them.
          </p>
          <div
            style={{
              marginTop: '20px',
              fontFamily: DS.monoFont,
              fontSize: '11px',
              color: DS.mutedDarker,
              letterSpacing: '0.08em',
            }}
          >
            NEXUS AI · 6 LEADERSHIP ASSESSMENTS · LYC INTELLIGENCE
          </div>
        </div>

        {/* Platform */}
        <div>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: DS.accent,
              marginBottom: '16px',
            }}
          >
            Platform
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {links.platform.map(l => (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  color: DS.muted,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Company */}
        <div>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: DS.accent,
              marginBottom: '16px',
            }}
          >
            Company
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {links.company.map(l => (
              <a
                key={l.href}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  color: DS.muted,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Contact / CTA */}
        <div>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: DS.accent,
              marginBottom: '16px',
            }}
          >
            Start
          </div>
          <a
            href="/nexus/chat"
            style={{
              display: 'inline-block',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              fontWeight: 700,
              color: '#FFFFFF',
              background: DS.accent,
              padding: '12px 20px',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
 
              marginBottom: '16px',
            }}
          >
            Meet NEXUS
          </a>
          <div
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: DS.mutedDarker,
              lineHeight: 1.6,
            }}
          >
            Executive intelligence on demand. One click from anywhere.
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1120px',
          margin: '56px auto 0',
          paddingTop: '20px',
          borderTop: `1px solid ${DS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            color: DS.mutedDarker,
          }}
        >
          © {new Date().getFullYear()} LYC Intelligence by LYC Partners.
        </div>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '11px',
            color: DS.mutedDarker,
            letterSpacing: '0.08em',
          }}
        >
          KNOW WHERE YOU STAND. KNOW WHERE TO GO.
        </div>
      </div>
    </footer>
  );
}
