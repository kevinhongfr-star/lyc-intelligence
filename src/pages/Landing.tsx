import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { ArrowRight, BarChart3, Brain, MessageCircle, Users, Briefcase, Menu, X } from 'lucide-react';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

export function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/match', label: 'Match Analysis' },
    { href: '/b2b', label: 'For Firms' },
    { href: '/b2c', label: 'For Leaders' },
    { href: '/nexus', label: 'Nexus AI' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav — sticky with backdrop blur */}
      <nav className="nav-sticky" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
        <div className="nav-links">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)', minHeight: '44px', display: 'flex', alignItems: 'center' }}>{l.label}</a>
          ))}
          <a href="/platform" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.text, textDecoration: 'none', padding: '10px 20px', border: `1px solid ${DS.border}`, borderRadius: '6px', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Sign In</a>
        </div>
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile menu */}
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X style={{ width: 24, height: 24, color: '#000' }} />
        </button>
        {navLinks.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
        ))}
        <a href="/platform" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.accent, border: 'none', borderBottom: '1px solid #E5E5E5' }}>Sign In</a>
      </div>

      {/* Hero */}
      <div className="reveal hero-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 48px', textAlign: 'center' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '16px' }}>
          Platform
        </div>
        <h1 className="hero-heading" style={{ fontFamily: DS.headingFont, fontSize: '52px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Cross-border<br />leadership intelligence
        </h1>
        <p className="hero-sub" style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: DS.textSecondary, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          AI-powered executive search. Score candidates instantly. From Europe to Asia.
        </p>

        {/* Dual CTA Section */}
        <div className="grid-responsive-2 reveal reveal-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <a
            className="card-hover"
            href="/b2c"
            style={{
              background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius,
              padding: '32px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: DS.shadow, cursor: 'pointer'
            }}
          >
            <Users style={{ width: 32, height: 32, color: DS.accent, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>I'm a leader</h3>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, margin: '0 0 20px', lineHeight: 1.5 }}>Get your leadership archetype, benchmark your profile, and explore opportunities.</p>
            <span style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Started <ArrowRight style={{ width: 16, height: 16 }} />
            </span>
          </a>
          <a
            href="/b2b"
            style={{
              background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius,
              padding: '32px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: DS.shadow, transition: 'box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)', cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = DS.shadowHover; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = DS.shadow; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Briefcase style={{ width: 32, height: 32, color: DS.accent, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>I'm hiring</h3>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, margin: '0 0 20px', lineHeight: 1.5 }}>Meet exceptional cross-border leaders, score candidates, and build your team.</p>
            <span style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Started <ArrowRight style={{ width: 16, height: 16 }} />
            </span>
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="section-divider" />

      {/* Product Cards */}
      <div className="reveal section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px 64px' }}>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { icon: BarChart3, title: 'Match Analysis', desc: 'AI-powered JD-CV matching engine. Score candidates instantly.', href: '/match', cta: 'Try Free' },
            { icon: Brain, title: 'Leadership Assessment', desc: 'Discover your archetype. Benchmark against global executives.', href: '/assessment', cta: 'Take Assessment' },
            { icon: MessageCircle, title: 'Nexus AI', desc: 'Talk to our AI about career positioning, scoring, and opportunities.', href: '/nexus', cta: 'Start Chat' },
          ].map(p => (
            <a key={p.title} href={p.href} className="card-hover" style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', textDecoration: 'none', display: 'block', boxShadow: DS.shadow }}>
              <p.icon style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: '0 0 16px' }}>{p.desc}</p>
              <span style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {p.cta} <ArrowRight style={{ width: 14, height: 14 }} />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="footer-dark">
        <div className="footer-grid" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          <div>
            <span style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>LYC Intelligence</span>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '12px', lineHeight: 1.5 }}>AI-powered executive search and leadership intelligence. Cross-border, data-driven, confidential.</p>
          </div>
          <div>
            <div className="footer-label">Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="/match">Match Analysis</a>
              <a href="/assessment">Assessment</a>
              <a href="/nexus">Nexus AI</a>
            </div>
          </div>
          <div>
            <div className="footer-label">Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="https://lyc-partners.ai" target="_blank" rel="noopener">LYC Partners</a>
              <a href="/pricing">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-copy">© 2026 LYC Intelligence by LYC Partners. Cross-border leadership advisory.</div>
      </footer>
    </div>
  );
}
