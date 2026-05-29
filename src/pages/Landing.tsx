import React, { useEffect, useState, useRef } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { IconTrident, IconQuest, IconSpark, IconBridge, IconLeap, IconImpact, IconPrism, IconCompass } from '@/components/icons/LycIcons';
import { Menu, X, Lock, ArrowRight } from 'lucide-react';
import { LeadCaptureForm } from '@/components/LeadCaptureForm';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  teal: '#00897B',
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

const HERO_VIDEO = '/hero-bg.mp4';
const HERO_POSTER = 'https://www.lyc-partners.ai/images/heroes/hero-boardroom.webp';

export function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {/* autoplay blocked */});
    }
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
    { href: '/nexus', label: 'Nexus' },
  ];

  const services = [
    { icon: IconTrident, animClass: 'anim-trident', title: 'Match Analysis', desc: 'AI-powered JD-CV matching engine. Score candidates instantly against role requirements.', href: '/match', cta: 'Try Free' },
    { icon: IconImpact, animClass: 'anim-impact', title: 'Leadership Assessment', desc: 'Discover your archetype. Benchmark against global executives across 47 markets.', href: '/assessment', cta: 'Take Assessment' },
    { icon: IconCompass, animClass: 'anim-compass', title: 'Nexus', desc: 'Executive advisory on career positioning, talent scoring, and leadership alignment.', href: '/nexus', cta: 'Consult' },
  ];

  const stats = [
    { value: '500+', label: 'Executive Placements' },
    { value: '47', label: 'Markets Covered' },
    { value: '93%', label: 'Retention Rate' },
    { value: '18mo', label: 'Avg. Tenure Guarantee' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav — sticky with backdrop blur */}
      <nav className="nav-sticky" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </a>
        <div className="nav-links">
          {navLinks.map(l => (
            <a key={l.href} href={l.href} style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.2s cubic-bezier(0.4,0,0.2,1)', minHeight: '44px', display: 'flex', alignItems: 'center' }}>{l.label}</a>
          ))}
          <a href="/login" className="cta-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: DS.accent, color: '#FFFFFF', borderRadius: '6px', fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
            <Lock style={{ width: 14, height: 14 }} />Platform
          </a>
        </div>
        <button className="nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu />
        </button>
      </nav>

      {/* Mobile overlay */}
      <div className={`nav-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-mobile ${mobileOpen ? 'open' : ''}`}>
        <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X style={{ width: 24, height: 24, color: '#000' }} />
        </button>
        {navLinks.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}>{l.label}</a>
        ))}
        <a href="/login" onClick={() => setMobileOpen(false)} style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, color: DS.accent, border: 'none', borderBottom: '1px solid #E5E5E5' }}>Platform</a>
      </div>

      {/* Hero — VIDEO BACKGROUND with dark overlay */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Video layer */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_POSTER}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            minWidth: '100%',
            minHeight: '100%',
            width: 'auto',
            height: 'auto',
            transform: 'translate(-50%, -50%)',
            objectFit: 'cover',
            zIndex: 0,
            filter: 'blur(3px)',
          }}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        {/* Dark overlay gradient — warm purple-black matching brand */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(10,6,14,0.78) 30%, rgba(20,10,24,0.75) 60%, rgba(0,0,0,0.9) 100%)',
          zIndex: 1,
        }} />

        {/* Fuchsia glow orb */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(193,8,171,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 3, maxWidth: '900px', margin: '0 auto', padding: '96px 32px 48px', textAlign: 'center' }}>
          <div className="section-label-dark" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            Leadership Intelligence
          </div>
          <h1 className="hero-heading" style={{ fontFamily: DS.headingFont, fontSize: '56px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.1 }}>
            Know where you stand.<br />Know where to go.
          </h1>
          <p className="hero-sub" style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: 'rgba(255,255,255,0.7)', maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.6 }}>
            We help leaders understand their trajectory, organizations identify the right talent, and teams align to accelerate results.
          </p>

          {/* Dual CTA — white text on dark */}
          <div className="grid-responsive-2 reveal reveal-delay-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <a
              className="card-hover"
              href="/b2c"
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: DS.radius,
                padding: '32px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer'
              }}
            >
              <div style={{ color: '#C108AB', marginBottom: '16px' }}><IconLeap size={32} color="#C108AB" /></div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 8px' }}>I'm a leader</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', lineHeight: 1.5 }}>Get your leadership archetype, benchmark your profile, and explore opportunities.</p>
              <span style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: '#C108AB', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Get Started <ArrowRight style={{ width: 16, height: 16 }} />
              </span>
            </a>
            <a
              href="/b2b"
              className="card-hover"
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: DS.radius,
                padding: '32px 24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer'
              }}
            >
              <div style={{ color: '#C108AB', marginBottom: '16px' }}><IconBridge size={32} color="#C108AB" /></div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 8px' }}>I'm hiring</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', lineHeight: 1.5 }}>Meet exceptional leaders, score candidates, and build your team.</p>
              <span style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: '#C108AB', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Get Started <ArrowRight style={{ width: 16, height: 16 }} />
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Trust Bar — stats on cream background */}
      <div className="reveal" style={{ background: '#FAFAFA', padding: '48px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.accent, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Cards — branded animated icons */}
      <div className="reveal section-padding" style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px' }}>
        <div className="section-label" style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '12px', textAlign: 'center' }}>
          Our Platform
        </div>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, textAlign: 'center', margin: '0 auto 40px', maxWidth: '500px' }}>
          Leadership intelligence, for every stage
        </h2>
        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {services.map(p => (
            <a key={p.title} href={p.href} className="card-hover" style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '28px 24px', textDecoration: 'none', display: 'block', boxShadow: DS.shadow }}>
              <div style={{ color: DS.accent, marginBottom: '16px' }} className={p.animClass}>
                {p.icon ? <p.icon size={28} color={DS.accent} /> : <div style={{ width: '40px', height: '3px', background: DS.accent, borderRadius: '1px' }} />}
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: '0 0 16px' }}>{p.desc}</p>
              <span style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {p.cta} <ArrowRight style={{ width: 14, height: 14 }} />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* CTA Section — fuchsia glow on dark bg */}
      <div className="reveal" style={{ position: 'relative', overflow: 'hidden', padding: '80px 32px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d0a14 0%, #1a0f1e 40%, #281530 70%, #3a2040 100%)' }} />
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(193,8,171,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <div className="section-label-dark" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
            Get Started
          </div>
          <h2 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.2 }}>
            Leadership isn't a title —<br />it's a trajectory.
          </h2>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '420px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            See it, shape it, accelerate it. Leadership intelligence starts here.
          </p>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <LeadCaptureForm type="b2c" source="landing_cta" heading="Start Your Free Assessment" subheading="Get your leadership archetype in 10 minutes. No credit card." />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
            <a href="/b2c" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>For Leaders</a>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
            <a href="/b2b" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}>For Firms</a>
          </div>
        </div>
      </div>

      {/* Dark Footer */}
      <footer className="footer-dark">
        <div className="footer-grid" style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
          <div>
            <span style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>LYC Intelligence</span>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '12px', lineHeight: 1.5 }}>Career advisory, candidate scoring, and leadership alignment. For leaders at every stage.</p>
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
        <div className="footer-copy">© 2026 LYC Intelligence by LYC Partners. Know where you stand. Know where to go.</div>
      </footer>
    </div>
  );
}
