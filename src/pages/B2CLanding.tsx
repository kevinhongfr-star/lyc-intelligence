import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { IconImpact, IconLeap, IconTrident, IconSpark, IconQuest, IconForge } from '@/components/icons/LycIcons';
import { ArrowRight, Menu, X, Lock } from 'lucide-react';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';
import { Link } from 'react-router-dom';

import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '@/styles/tokens';

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
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      {/* Nav */}
      <nav className="nav-sticky" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
        <Link to="/" style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '18px', fontWeight: 700, color: COLORS.text, textDecoration: 'none' }}>LYC Intelligence</Link>
        <div className="nav-links">
          {navLinks.map(l => (
            <Link key={l.href} to={l.href} style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', color: COLORS.textSecondary, textDecoration: 'none', transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)', minHeight: '44px', display: 'flex', alignItems: 'center' }}>{l.label}</Link>
          ))}
          <Link to="/login" className="cta-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: COLORS.primary, color: '#FFFFFF', borderRadius: '0px', fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
            <Lock style={{ width: 14, height: 14 }} />Platform
          </Link>
        </div>
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></button>
      </nav>

      {/* Mobile */}
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X style={{ width: 24, height: 24, color: '#000' }} /></button>
        {navLinks.map(l => (<Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)}>{l.label}</Link>))}
        <Link to="/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '15px', fontWeight: 600, color: COLORS.primary, border: 'none', borderBottom: '1px solid #E5E5E5' }}>Platform</Link>
      </div>

      {/* Hero — fuchsia glow */}
      <div className="hero-padding section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 60px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(193,8,171,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-label" style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: COLORS.primary, marginBottom: '16px' }}>
            For Senior Leaders
          </div>
          <h1 className="hero-heading" style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '48px', fontWeight: 700, color: COLORS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
            Know where you stand.<br />Know where to go.
          </h1>
          <p className="hero-sub" style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '17px', color: COLORS.textSecondary, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Understand your trajectory. Benchmark your leadership. Discover opportunities that match where you're headed.
          </p>
          <div className="cta-row" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/assessment" className="cta-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: COLORS.primary, color: '#FFF', borderRadius: '0px', fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              Free Assessment <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link to="/nexus" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: '1px solid #000000', color: '#000000', borderRadius: '0px', fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              Consult Nexus
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="section-divider" />

      {/* What You Get — branded icons */}
      <div className="reveal section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px' }}>
        <div className="section-label" style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: COLORS.primary, marginBottom: '8px', textAlign: 'center' }}>
          Your Assessment Includes
        </div>
        <h2 className="section-heading" style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '32px', fontWeight: 400, color: COLORS.text, textAlign: 'center', margin: '0 0 40px' }}>Your Assessment Includes</h2>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: IconImpact, title: 'Leadership Archetype', desc: "Discover whether you're a Strategist, Operator, Catalyst, or Builder — with personalized insights for your career trajectory." },
            { icon: IconLeap, title: 'Market Benchmark', desc: 'See how you compare across executive markets. Understand your positioning and unlock opportunities that match your trajectory.' },
            { icon: IconTrident, title: 'Career Benchmark', desc: 'Get benchmarked across Experience, Skills, and Organizational Fit — see exactly how you compare to what top firms look for in C-suite candidates.' },
          ].map(f => (
            <div key={f.title} className="card-hover" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: `${RADII.none}px`, padding: '24px', boxShadow: SHADOWS.sm }}>
              <div style={{ color: COLORS.primary, marginBottom: '12px' }}><f.icon size={24} color={COLORS.primary} /></div>
              <h3 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '15px', fontWeight: 600, color: COLORS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="reveal" style={{ background: COLORS.bgAlt, padding: '64px 0' }}>
        <div className="section-padding" style={{ maxWidth: '700px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: `${RADII.none}px`, padding: '32px', boxShadow: SHADOWS.sm }}>
            <div className="section-label" style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: COLORS.primary, marginBottom: '8px', textAlign: 'center' }}>
              How It Works
            </div>
            <h3 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '20px', fontWeight: 600, color: COLORS.text, margin: '0 0 24px', textAlign: 'center' }}>3 Steps to Your Results</h3>
            {[
              { step: '1', title: 'Enter your details', desc: 'Name, email, title, country — so we can personalize your report.' },
              { step: '2', title: 'Rate yourself', desc: '10 questions across leadership dimensions. Takes under 10 minutes.' },
              { step: '3', title: 'Get your results', desc: 'Instant archetype + scores + downloadable PDF report.' },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: i < 2 ? '20px' : 0 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${COLORS.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '14px', fontWeight: 700, color: COLORS.primary, flexShrink: 0 }}>
                  {s.step}
                </div>
                <div>
                  <h4 style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '14px', fontWeight: 600, color: COLORS.text, margin: '0 0 4px' }}>{s.title}</h4>
                  <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', color: COLORS.textMuted, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="reveal section-padding" style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
        <div style={{ color: COLORS.primary, marginBottom: '12px' }}><IconForge size={24} color={COLORS.primary} /></div>
        <h3 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '20px', fontWeight: 600, color: COLORS.text, margin: '0 0 8px' }}>Your data is yours</h3>
        <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '14px', color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>
          Opt in to be discovered by firms seeking your exact profile, or stay private. No spam, no public listings, no data selling. Ever.
        </p>
      </div>

      {/* CTA — dark gradient */}
      <div className="reveal" style={{ position: 'relative', overflow: 'hidden', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0a14 0%, #1a0f1e 40%, #281530 70%, #3a2040 100%)' }} />
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(193,8,171,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ color: '#C108AB', marginBottom: '12px' }}><IconSpark size={24} color="#C108AB" /></div>
          <h2 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>Ready to find out?</h2>
          <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Leadership isn't a title — it's a trajectory. See it, shape it, accelerate it.</p>
          <LeadCaptureForm type="b2c" source="b2c_landing" heading="Get your free leadership profile" subheading="8 minutes. Archetype, benchmarks, and your 90-day priorities." />
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="footer-dark">
        <div className="footer-grid" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '32px' }}>
          <div>
            <span style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>LYC Intelligence</span>
            <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '12px', lineHeight: 1.5 }}>Career advisory, candidate scoring, and leadership alignment. For leaders at every stage.</p>
          </div>
          <div>
            <div className="footer-label">Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link to="/match">Match Analysis</Link>
              <Link to="/assessment">Assessment</Link>
              <Link to="/nexus">Nexus</Link>
            </div>
          </div>
          <div>
            <div className="footer-label">Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <a href="https://lyc-partners.ai" target="_blank" rel="noopener">LYC Partners</a>
              <Link to="/pricing">Contact</Link>
            </div>
          </div>
        </div>
        <div className="footer-copy">© 2026 LYC Intelligence by LYC Partners. Know where you stand. Know where to go.</div>
      </footer>
    </div>
  );
}
