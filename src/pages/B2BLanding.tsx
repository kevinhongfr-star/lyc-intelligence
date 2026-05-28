import React, { useEffect, useState } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { IconTrident, IconForge, IconPrism, IconBridge, IconImpact, IconSpark } from '@/components/icons/LycIcons';
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

export function B2BLanding() {
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
    { href: '/match', label: 'Match Analysis' },
    { href: '/b2c', label: 'For Leaders' },
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
            AI-Powered Executive Search
          </div>
          <h1 className="hero-heading" style={{ fontFamily: DS.headingFont, fontSize: '48px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
            Find Your Next<br />C-Suite Leader in Hours,<br />Not Months
          </h1>
          <p className="hero-sub" style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: DS.textSecondary, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Paste a job description, add candidate profiles, and get instant 3-dimensional match scores. See who fits before you schedule the first call.
          </p>
          <div className="cta-row" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/match" className="cta-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              Try Match Analysis Free <ArrowRight style={{ width: 16, height: 16 }} />
            </a>
            <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: '1px solid #000000', color: '#000000', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
              Leadership Assessment
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="section-divider" />

      {/* How It Works — branded icons */}
      <div className="reveal section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px 40px' }}>
        <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
          How It Works
        </div>
        <h2 className="section-heading" style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 400, color: DS.text, textAlign: 'center', margin: '0 0 40px' }}>How Match Analysis Works</h2>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', icon: IconPrism, title: 'Paste Your JD', desc: 'Drop in the full job description — role, requirements, qualifications, company context.' },
            { step: '02', icon: IconBridge, title: 'Add Candidates', desc: 'Paste CVs, LinkedIn profiles, or resume text for each candidate you want to evaluate.' },
            { step: '03', icon: IconTrident, title: 'Get Match Scores', desc: 'AI scores each candidate on 3 dimensions with verdicts, match reasons, risks, and approach strategy.' },
          ].map(s => (
            <div key={s.step} className="card-hover" style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', boxShadow: DS.shadow }}>
              <div style={{ color: DS.accent, marginBottom: '12px' }}><s.icon size={32} color={DS.accent} /></div>
              <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '6px' }}>Step {s.step}</div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{s.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Dimensions */}
      <div className="reveal" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px', background: DS.bgAlt }}>
        <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px' }}>
          Scoring Dimensions
        </div>
        <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 20px' }}>How Scoring Works</h3>
          <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { name: 'Experience & Achievements', desc: 'Career trajectory, role progression, quantifiable impact, leadership scope', color: '#000000' },
              { name: 'Skills & Expertise', desc: 'Technical competencies, functional expertise, cross-border capability, language fit', color: DS.accent },
              { name: 'Organizational Fit', desc: 'Culture alignment, stakeholder complexity, transformation readiness, board dynamics', color: '#333333' },
            ].map(d => (
              <div key={d.name} style={{ background: DS.bgAlt, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <h4 style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 600, color: DS.text, margin: 0 }}>{d.name}</h4>
                </div>
                <p style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted, lineHeight: 1.4, margin: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', padding: '12px 16px', background: DS.bgAlt, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconForge size={14} color={DS.accent} />
            <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>Each candidate receives a match verdict: Strong Fit, Good Fit, or Potential Fit — with detailed reasoning and approach strategy.</span>
          </div>
        </div>
      </div>

      {/* Why Match Analysis — branded icons */}
      <div className="reveal section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px 40px' }}>
        <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
          Why Match Analysis
        </div>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { icon: IconSpark, title: 'Instant Scoring', desc: 'Each candidate scored in seconds. No waiting for analyst reports.' },
            { icon: IconImpact, title: 'Confidential', desc: 'Your JDs and candidate data stay private. Never shared with third parties.' },
            { icon: IconBridge, title: 'Batch Processing', desc: 'Score multiple candidates against the same JD in one sweep.' },
          ].map(f => (
            <div key={f.title} className="card-hover" style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', boxShadow: DS.shadow }}>
              <div style={{ color: DS.accent, marginBottom: '12px' }}><f.icon size={24} color={DS.accent} /></div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — dark gradient */}
      <div className="reveal" style={{ position: 'relative', overflow: 'hidden', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0a14 0%, #1a0f1e 40%, #281530 70%, #3a2040 100%)' }} />
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(193,8,171,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ width: '48px', height: '3px', background: '#C108AB', margin: '0 auto 16px', borderRadius: '2px' }} />
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>Start matching today</h2>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Free to try. No credit card required. Score your first candidates in under 2 minutes.</p>
          <LeadCaptureForm type="b2b" source="b2b_landing" heading="Get 3 free candidate matches" subheading="Paste a job description, add CVs, get ranked results. No credit card." />
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
