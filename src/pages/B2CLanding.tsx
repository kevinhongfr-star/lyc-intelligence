import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { IconImpact, IconLeap, IconTrident, IconSpark, IconQuest, IconForge } from '@/components/icons/LycIcons';
import { ArrowRight, Menu, X, Lock } from 'lucide-react';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';

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

export function B2CLanding() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mobileOpen) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLinks = [
    { href: '/b2b', label: 'For Firms' },
    { href: '/nexus', label: 'Nexus' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav */}
      <nav className="nav-sticky" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
        <div className="nav-links">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)', minHeight: '44px', display: 'flex', alignItems: 'center' }}>{l.label}</a>
          ))}
          <a href="/login" className="cta-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: DS.accent, color: '#FFFFFF', borderRadius: '6px', fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
            <Lock style={{ width: 14, height: 14 }} />Platform
          </a>
        </div>
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></button>
      </nav>

      {/* Mobile */}
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X style={{ width: 24, height: 24, color: '#000' }} /></button>
        {navLinks.map(l => (<a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>))}
        <a href="/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.accent, border: 'none', borderBottom: '1px solid #E5E5E5' }}>Platform</a>
      </div>

      {/* Hero — fuchsia glow */}
      <div className="hero-padding section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 60px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(193,8,171,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '16px' }}>
            For Senior Leaders
          </div>
          <h1 className="hero-heading" style={{ fontFamily: DS.headingFont, fontSize: '48px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
            Where do you stand<br />as a cross-border leader?
          </h1>
          <p className="hero-sub" style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: DS.textSecondary, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Take a 10-minute leadership assessment. Get your archetype, benchmark your profile against European and Asian executive markets, and discover opportunities that match.
          </p>
          <div className="cta-row" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/assessment" className="cta-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              Free Assessment <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
            <a href="/nexus" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: '1px solid #000000', color: '#000000', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              Consult Nexus
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="section-divider" />

      {/* What You Get — branded icons */}
      <div className="reveal section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px' }}>
        <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
          Your Assessment Includes
        </div>
        <h2 className="section-heading" style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 400, color: DS.text, textAlign: 'center', margin: '0 0 40px' }}>Your Assessment Includes</h2>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: IconImpact, title: 'Leadership Archetype', desc: "Discover whether you're a Strategist, Operator, Catalyst, or Builder — with personalized insights for your career trajectory." },
            { icon: IconLeap, title: 'Cross-Border Benchmark', desc: 'See how you compare across European and Asian executive markets. Understand your positioning and unlock hidden opportunities.' },
            { icon: IconTrident, title: 'Career Benchmark', desc: 'Get benchmarked across Experience, Skills, and Organizational Fit — see exactly how you compare to what top firms look for in C-suite candidates.' },
          ].map(f => (
            <div key={f.title} className="card-hover" style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', boxShadow: DS.shadow }}>
              <div style={{ color: DS.accent, marginBottom: '12px' }}><f.icon size={24} color={DS.accent} /></div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="reveal" style={{ background: DS.bgAlt, padding: '64px 0' }}>
        <div className="section-padding" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow }}>
            <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
              How It Works
            </div>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px', textAlign: 'center' }}>3 Steps to Your Results</h3>
            {[
              { step: '1', title: 'Enter your details', desc: 'Name, email, title, country — so we can personalize your report.' },
              { step: '2', title: 'Rate yourself', desc: '10 questions across leadership dimensions. Takes under 10 minutes.' },
              { step: '3', title: 'Get your results', desc: 'Instant archetype + scores + downloadable PDF report.' },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: i < 2 ? '20px' : 0 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${DS.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 700, color: DS.accent, flexShrink: 0 }}>
                  {s.step}
                </div>
                <div>
                  <h4 style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>{s.title}</h4>
                  <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="reveal section-padding" style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
        <div style={{ color: DS.accent, marginBottom: '12px' }}><IconForge size={24} color={DS.accent} /></div>
        <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>Your data is yours</h3>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, lineHeight: 1.6, margin: 0 }}>
          Opt in to be discovered by firms seeking your exact profile, or stay private. No spam, no public listings, no data selling. Ever.
        </p>
      </div>

      {/* CTA — dark gradient */}
      <div className="reveal" style={{ position: 'relative', overflow: 'hidden', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0a14 0%, #1a0f1e 40%, #281530 70%, #3a2040 100%)' }} />
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(193,8,171,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ color: '#C108AB', marginBottom: '12px' }}><IconSpark size={24} color="#C108AB" /></div>
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>Ready to find out?</h2>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Free assessment. No credit card. Results in 10 minutes.</p>
          <LeadCaptureForm type="b2c" source="b2c_landing" heading="Get your free leadership profile" subheading="8 minutes. Archetype, benchmarks, and your 90-day priorities." />
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="footer-dark">
        <div className="footer-grid" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '32px' }}>
          <div>
            <span style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>LYC Intelligence</span>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '12px', lineHeight: 1.5 }}>AI-powered executive search and leadership intelligence. Cross-border, data-driven, confidential.</p>
          </div>
          <div>
            <div className="footer-label">Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="/match">Match Analysis</a>
              <a href="/assessment">Assessment</a>
              <a href="/nexus">Nexus</a>
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
        <div className="footer-copy">© 2026 LYC Intelligence by LYC Partners</div>
      </footer>
    </div>
  );
}
