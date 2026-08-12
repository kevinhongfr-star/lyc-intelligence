import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import {
  INK, OFF, G200, G400, G600, WHITE,
  monoStyle, containerStyle,
  useScrollReveal, RevealStyles,
  type AssessmentLandingConfig,
} from './shared';
import { AssessmentHero } from './AssessmentHero';
import { WhatItMeasures } from './WhatItMeasures';
import { HowItWorks } from './HowItWorks';
import { DimensionsDetail } from './DimensionsDetail';
import { WhoItsFor } from './WhoItsFor';
import { WhatYouGet } from './WhatYouGet';
import { AssessmentCTA } from './AssessmentCTA';

interface Props {
  config: AssessmentLandingConfig;
}

// ── NAV ────────────────────────────────────────────────────────────
function Nav({ config }: { config: AssessmentLandingConfig }) {
  const { name, accent } = config;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: 20, fontWeight: 700, textDecoration: 'none', color: INK,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          {name} <span style={{
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
            fontSize: 10, fontWeight: 400, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: G400,
          }}>by LYC</span>
        </Link>
        <ul className="al-nav-desktop" style={{ display: 'flex', gap: 28, listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
          <li><a href="#what-it-measures" style={{ fontSize: 13, fontWeight: 500, color: INK, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>What it measures</a></li>
          <li><a href="#how-it-works" style={{ fontSize: 13, fontWeight: 500, color: INK, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>How it works</a></li>
          <li><Link to="/nexus" style={{ fontSize: 13, fontWeight: 500, color: INK, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>NEXUS</Link></li>
          <li><Link to="/login" style={{
            fontSize: 13, fontWeight: 500, color: WHITE, textDecoration: 'none',
            padding: '8px 20px', background: accent,
            transition: 'opacity 120ms ease', minHeight: 36, display: 'inline-flex', alignItems: 'center',
          }}
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
          transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1)',
        }}>
          <button onClick={() => setMobileOpen(false)} style={{
            position: 'absolute', top: 20, right: 20, background: 'none',
            border: 'none', cursor: 'pointer', color: INK,
          }} aria-label="Close menu"><X style={{ width: 24, height: 24 }} /></button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <a href="#what-it-measures" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: INK, textDecoration: 'none' }}>What it measures</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: INK, textDecoration: 'none' }}>How it works</a>
            <Link to="/nexus" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: INK, textDecoration: 'none' }}>NEXUS</Link>
            <Link to="/login" onClick={() => setMobileOpen(false)} style={{ fontSize: 15, color: accent, textDecoration: 'none', fontWeight: 600 }}>Start</Link>
          </div>
        </div>
      )}
      <style>{`@media (max-width: 768px) { .al-nav-desktop { display: none !important; } .al-nav-toggle { display: block !important; } }`}</style>
    </nav>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────
function Footer({ config }: { config: AssessmentLandingConfig }) {
  const { name, accent } = config;
  const footerLink: React.CSSProperties = { color: G600, textDecoration: 'none', fontSize: 13, lineHeight: 2 };

  return (
    <footer style={{ background: OFF, borderTop: `1px solid ${G200}`, padding: '64px 0 32px' }}>
      <div style={containerStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <span style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 18, fontWeight: 700, color: INK,
            }}>{name}</span>
            <p style={{
              fontSize: 13, color: G600, marginTop: 12, lineHeight: 1.5,
            }}>
              Part of the LYC Intelligence diagnostic suite. Know where you stand. Know where to go.
            </p>
          </div>
          <div>
            <div style={{ ...monoStyle, color: G400, marginBottom: 12 }}>Diagnostics</div>
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
            <div style={{ ...monoStyle, color: G400, marginBottom: 12 }}>Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to="/nexus" style={footerLink}>NEXUS</Link>
              <Link to="/dex-ai" style={footerLink}>DEX AI</Link>
              <Link to="/pricing" style={footerLink}>Pricing</Link>
              <Link to="/login" style={footerLink}>Login</Link>
            </div>
          </div>
        </div>
        <div style={{
          paddingTop: 32, borderTop: `1px solid ${G200}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: G400 }}>
            © 2026 LYC Intelligence by LYC Partners.
          </span>
          <span style={{ ...monoStyle, color: accent }}>
            {name}
          </span>
        </div>
      </div>
    </footer>
  );
}

// ── MAIN WRAPPER ───────────────────────────────────────────────────
export function AssessmentLanding({ config }: Props) {
  useScrollReveal(config.prefix);

  return (
    <div style={{
      background: OFF, color: INK, minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      lineHeight: 1.6, WebkitFontSmoothing: 'antialiased',
    }}>
      <Nav config={config} />
      <main>
        <AssessmentHero config={config} />
        <div id="what-it-measures">
          <WhatItMeasures config={config} />
        </div>
        <div id="how-it-works">
          <HowItWorks config={config} />
        </div>
        <DimensionsDetail config={config} />
        <WhoItsFor config={config} />
        <WhatYouGet config={config} />
        <AssessmentCTA config={config} />
      </main>
      <Footer config={config} />
      <RevealStyles prefix={config.prefix} />
    </div>
  );
}
