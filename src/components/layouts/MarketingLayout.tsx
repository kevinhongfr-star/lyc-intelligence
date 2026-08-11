/**
 * Phase 16 — MarketingLayout (public / marketing identity).
 *
 * No auth required. Chrome: MarketingNav at top + marketing footer.
 * Visual: lots of whitespace, serif-heavy, premium magazine feel.
 * Zero radius, font trio, accent #C108AB.
 */
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import MarketingNav from '@/components/navigation/MarketingNav';
// #1321: Adopt shared design-system barrel. Spread + override only for the
//        one marketing-specific token (`footerBg`) that isn't in the core set.
import { LYC_SHARED_DS } from '@/styles/ds';
const DS = { ...LYC_SHARED_DS, footerBg: '#F9F9F9' };

function MarketingFooter(): React.ReactElement {
  const year = new Date().getFullYear();
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'NEXUS AI', href: '/nexus/chat' },
        { label: 'Assessments', href: '/assessment' },
        { label: 'Match Analysis', href: '/match' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/#about' },
        { label: 'For Business', href: '/b2b' },
        { label: 'Contact', href: 'mailto:hello@lycintelligence.com' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', href: '/terms' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Cookies', href: '/cookies' },
      ],
    },
  ];
  return (
    <footer style={{
      background: DS.footerBg, borderTop: `1px solid ${DS.border}`,
      marginTop: 'auto', fontFamily: DS.bodyFont,
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 32px 32px' }}>
        <div style={{
          display: 'grid', gap: 40,
          gridTemplateColumns: 'minmax(0,1.2fr) repeat(3,minmax(0,1fr))',
        }} className="marketing-footer-grid">
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <span style={{
                width: 32, height: 32, background: DS.accent, color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: DS.headingFont, fontWeight: 700, fontSize: 15,
              }}>L</span>
              <span style={{ fontFamily: DS.headingFont, fontSize: 17, fontWeight: 700, color: DS.text }}>
                LYC Intelligence
              </span>
            </Link>
            <p style={{ fontSize: 14, color: DS.muted, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>
              Executive intelligence for high-achieving leaders. Advisory, assessments, and talent search in one private platform.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: DS.text, letterSpacing: 1,
                textTransform: 'uppercase', marginBottom: 16,
              }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('mailto:') ? (
                      <a href={l.href} style={{ fontSize: 14, color: DS.textSecondary, textDecoration: 'none' }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = DS.accent; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = DS.textSecondary; }}
                      >{l.label}</a>
                    ) : (
                      <Link to={l.href} style={{ fontSize: 14, color: DS.textSecondary, textDecoration: 'none' }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = DS.accent; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = DS.textSecondary; }}
                      >{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          borderTop: `1px solid ${DS.border}`, marginTop: 48, paddingTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 12.5, color: DS.muted }}>
            © {year} LYC Intelligence. All rights reserved.
          </div>
          <div style={{ fontSize: 12.5, color: DS.muted }}>
            Made for leaders.
          </div>
        </div>
      </div>
    </footer>
  );
}

export function MarketingLayout(): React.ReactElement {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: DS.bg, fontFamily: DS.bodyFont,
    }} data-portal-kind="marketing">
      <MarketingNav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <MarketingFooter />
    </div>
  );
}

export default MarketingLayout;
