import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

// ── DESIGN TOKENS (shared with NexusLanding.tsx) ──────────────────
const ACCENT = '#C108AB';
const INK = '#0F1115';
const OFF = '#F5F5F3';
const G100 = '#FAFAFA';
const G200 = '#E8E8E5';
const G300 = '#D4D4D1';
const G400 = '#9CA3AF';
const G600 = '#4B5563';
const WHITE = '#FFFFFF';

const monoStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 500,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 940,
  margin: '0 auto',
  padding: '0 32px',
};

const btnBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '14px 28px',
  fontSize: '14px',
  fontWeight: 500,
  textDecoration: 'none',
  border: `1px solid ${INK}`,
  borderRadius: 0,
  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: 'pointer',
  minHeight: 44,
};

const btnPrimary: React.CSSProperties = { ...btnBase, background: ACCENT, color: WHITE, borderColor: ACCENT };
const btnSecondary: React.CSSProperties = { ...btnBase, background: 'transparent', color: INK };
const btnLight: React.CSSProperties = { ...btnBase, background: WHITE, color: INK, borderColor: WHITE };
const btnOutlineLight: React.CSSProperties = { ...btnBase, background: 'transparent', color: WHITE, borderColor: 'rgba(255,255,255,0.3)' };
const sectionLabel: React.CSSProperties = { ...monoStyle, color: ACCENT, marginBottom: 20, display: 'inline-block' };

// ── MOTION: Scroll reveal hook (fadeUp 350ms, IntersectionObserver) ──
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lr-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.lr-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── MOTION: CTA active-state micro-compress (scale 0.98, 120ms) ────
const ctaCompressHandlers = {
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transition = 'transform 120ms cubic-bezier(0.4,0,0.2,1)';
    e.currentTarget.style.transform = 'scale(0.98)';
  },
  onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  },
};

// ── NAV (dark fixed) ───────────────────────────────────────────────
function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      background: 'rgba(15,17,21,0.85)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 20, fontWeight: 700, textDecoration: 'none', color: WHITE }}>
          LYC Intelligence
        </Link>
        <ul className="nav-links-desktop" style={{ display: 'flex', gap: 28, listStyle: 'none', alignItems: 'center', margin: 0, padding: 0 }}>
          {[
            { href: '/nexus', label: 'NEXUS' },
            { href: '#capabilities', label: 'Capabilities' },
            { href: '#who-its-for', label: 'Solutions' },
            { href: '/dex-ai', label: 'DEX AI' },
          ].map(l => (
            <li key={l.href}>
              {l.href.startsWith('#') ? (
                <a href={l.href} style={{ fontSize: 13, fontWeight: 500, color: WHITE, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>{l.label}</a>
              ) : (
                <Link to={l.href} style={{ fontSize: 13, fontWeight: 500, color: WHITE, textDecoration: 'none', opacity: 0.7, transition: 'opacity 120ms ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>{l.label}</Link>
              )}
            </li>
          ))}
        </ul>
        <Link to="/nexus#start" style={{ padding: '10px 20px', background: ACCENT, color: WHITE, fontSize: 13, fontWeight: 500, textDecoration: 'none', borderRadius: 0, transition: 'opacity 200ms ease', minHeight: 40, display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
          Get Started
        </Link>
        <button
          className="nav-toggle-btn"
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle menu"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', color: WHITE }}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: INK, zIndex: 200, padding: '80px 32px 32px', transition: 'transform 350ms cubic-bezier(0.16,1,0.3,1)' }}>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE }}><X size={22} /></button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { href: '/nexus', label: 'NEXUS' },
                { href: '#capabilities', label: 'Capabilities' },
                { href: '#who-its-for', label: 'Solutions' },
                { href: '/dex-ai', label: 'DEX AI' },
                { href: '/nexus#start', label: 'Get Started', primary: true },
              ].map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'block', fontSize: 16, color: WHITE, textDecoration: 'none', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: 44, fontWeight: l.primary ? 600 : 500, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-toggle-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

// ── HERO (dark) ────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      background: INK, color: WHITE,
      padding: '180px 0 140px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '-50%', left: '50%',
        transform: 'translateX(-50%)',
        width: 800, height: 800,
        background: 'radial-gradient(circle, rgba(193,8,171,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{ ...containerStyle, position: 'relative', zIndex: 1 }}>
        <span style={{ ...monoStyle, color: ACCENT, marginBottom: 28, display: 'inline-block' }}>LYC Intelligence presents</span>
        <h1 style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontWeight: 700, fontSize: 52, lineHeight: 1.15,
          color: WHITE, maxWidth: 760, margin: '0 auto 24px',
          letterSpacing: '-0.02em',
        }}>
          Grow as a leader.<br /><em style={{ fontStyle: 'italic', color: ACCENT, fontWeight: 400 }}>Your coach is always on.</em>
        </h1>
        <p style={{ fontSize: 18, maxWidth: 600, margin: '0 auto 40px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          NEXUS is an AI leadership coach built on 10+ years of executive search intelligence. Get instant feedback, benchmark yourself against global leaders, and move your career forward — on your schedule.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 60, flexWrap: 'wrap' }}>
          <Link to="/nexus#start" style={btnLight} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = WHITE; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.borderColor = WHITE; e.currentTarget.style.color = INK; }}>
            Start — Executive Introduction
          </Link>
          <Link to="/nexus" style={btnOutlineLight} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = WHITE; }}>
            See How It Works
          </Link>
        </div>
        {/* Static hero accent line (1px vertical gradient, no animation) */}
        <div style={{ width: 1, height: 60, background: 'linear-gradient(to bottom, rgba(193,8,171,0.5), rgba(255,255,255,0.05))', margin: '0 auto' }} />
        <div style={{ marginTop: 60, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
          Powered by <strong style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: '0.12em' }}>DEX AI</strong>
        </div>
      </div>
    </section>
  );
}

// ── CAPABILITIES (2x2 grid with staggered number reveals) ──────────
const CAPS = [
  { n: '01', title: 'AI Advisory Chat', desc: 'Executive-level coaching on career moves, leadership challenges, and high-stakes decisions — grounded in LYC frameworks and your personal context.', link: 'Talk to your coach →', href: '/nexus' },
  { n: '02', title: 'Leadership Diagnostics', desc: 'The China Leadership Pipeline Diagnostic plus five more leadership assessments — benchmarked against executives in 47 markets.', link: 'See the diagnostics →', href: '/nexus#diagnostics' },
  { n: '03', title: 'Role Fit Analysis', desc: "AI-powered dimensional analysis of how well you fit any role. Know where you're strong and where to invest before you apply.", link: 'Check your fit →', href: '/nexus' },
  { n: '04', title: 'Market Intelligence', desc: 'Understand where you stand in the talent market — compensation benchmarks, demand patterns, and competitive landscape.', link: 'See market data →', href: '/nexus' },
];
function Capabilities() {
  return (
    <section id="capabilities" style={{ padding: '100px 0' }}>
      <div style={containerStyle}>
        <div className="lr-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>What your coach does</span>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: INK, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Four ways NEXUS <em style={{ fontStyle: 'italic', color: ACCENT, fontWeight: 400 }}>moves you forward</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>One AI coach. Four executive capabilities. Built for leaders who take their growth seriously.</p>
        </div>
        <div className="lr-reveal grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: G200, border: `1px solid ${G200}` }}>
          {CAPS.map((c, i) => (
            <div key={c.n} style={{
              background: WHITE, padding: '40px 36px', display: 'flex', flexDirection: 'column',
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = ACCENT; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}>
              {/* Staggered number reveal: 80ms stagger, under 350ms total */}
              <div className="lr-reveal" style={{
                width: 40, height: 40, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: G100, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 14, color: ACCENT, fontWeight: 500,
                transitionDelay: `${i * 80}ms`,
              }}>{c.n}</div>
              <h3 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700, fontSize: 22, marginBottom: 12, lineHeight: 1.25, color: INK }}>{c.title}</h3>
              <p style={{ color: G600, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>{c.desc}</p>
              <Link to={c.href} style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: ACCENT, textDecoration: 'none', fontWeight: 500, marginTop: 'auto' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>{c.link}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WHO IT'S FOR (3-col persona grid, middle featured) ─────────────
const PERSONAS = [
  { icon: '▲', title: 'Ascending Leaders', sub: 'Directors & Senior Managers', desc: "You're on the cusp of the executive level. NEXUS helps you identify gaps, build your leadership brand, and prepare for the next move.", bullets: ['Baseline diagnostic to see where you stand', 'Targeted development recommendations', 'Role-fit analysis for your next role'], featured: false },
  { icon: '◆', title: 'Executives in Transition', sub: 'VP & C-level changers', desc: "You're navigating a career pivot or actively exploring options. NEXUS gives you the intelligence to make the right move.", bullets: ['Market positioning & compensation benchmarking', 'Executive-level interview prep', 'Decision coaching on offers & opportunities'], featured: true },
  { icon: '●', title: 'Sitting Executives', sub: 'C-suite & Business Heads', desc: "You're already at the top. NEXUS keeps you sharp — with fresh perspectives, market context, and an always-available sounding board.", bullets: ['On-demand leadership advisory', 'Talent market intelligence', 'Team & organizational diagnostics'], featured: false },
];
function Personas() {
  return (
    <section id="who-its-for" style={{ padding: '100px 0', background: G100 }}>
      <div style={containerStyle}>
        <div className="lr-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Who it's for</span>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: INK, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Built for leaders <em style={{ fontStyle: 'italic', color: ACCENT, fontWeight: 400 }}>who take growth seriously</em>
          </h2>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>Whether you're climbing the ladder, navigating a transition, or leading at the top — NEXUS meets you where you are.</p>
        </div>
        <div className="lr-reveal grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: G200, border: `1px solid ${G200}` }}>
          {PERSONAS.map(p => {
            const bg = p.featured ? INK : WHITE;
            const text = p.featured ? WHITE : INK;
            const muted = p.featured ? 'rgba(255,255,255,0.7)' : G600;
            const subColor = p.featured ? 'rgba(255,255,255,0.5)' : G400;
            const border = p.featured ? 'rgba(255,255,255,0.1)' : G200;
            return (
              <div key={p.title} style={{
                background: bg, padding: '44px 32px', color: text,
                transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: 24, color: ACCENT, marginBottom: 24, fontWeight: 700 }}>{p.icon}</div>
                <h3 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700, fontSize: 22, marginBottom: 4, lineHeight: 1.25, color: text }}>{p.title}</h3>
                <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: subColor, marginBottom: 16 }}>{p.sub}</div>
                <p style={{ color: muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{p.desc}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {p.bullets.map(b => (
                    <li key={b} style={{ padding: '10px 0', fontSize: 13, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10, color: muted }}>
                      <span style={{ color: ACCENT, fontWeight: 700, fontSize: 11 }}>→</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── B2B TEASER BAND (dark) ─────────────────────────────────────────
function B2BTeaser() {
  return (
    <section id="for-business" style={{ background: INK, color: WHITE, padding: '64px 0' }}>
      <div style={containerStyle}>
        <div className="lr-reveal b2b-teaser-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 48 }}>
          <div>
            <span style={{ ...monoStyle, color: ACCENT, marginBottom: 8, display: 'block', fontSize: 10 }}>Also for business</span>
            <h3 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.2, color: WHITE }}>NEXUS for teams and organizations</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, maxWidth: 480, lineHeight: 1.6 }}>Enterprise-grade diagnostics, screening, and market intelligence for talent teams and search firms.</p>
          </div>
          <Link to="/nexus#for-business" style={{ ...btnOutlineLight, whiteSpace: 'nowrap' }} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = WHITE; }}>
            Enterprise solutions <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── TRUST SECTION ──────────────────────────────────────────────────
const TRUST_ITEMS = [
  { brand: 'LYC Partners', sub: '10+ years executive search' },
  { brand: 'DEX AI', sub: 'The intelligence engine' },
  { brand: '47 Markets', sub: 'Global benchmark data' },
];
function Trust() {
  return (
    <section style={{ padding: '100px 0' }}>
      <div style={containerStyle}>
        <div className="lr-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Why you can trust it</span>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: INK, letterSpacing: '-0.02em' }}>
            Built on real expertise. <em style={{ fontStyle: 'italic', color: ACCENT, fontWeight: 400 }}>Validated by real data.</em>
          </h2>
        </div>
        <div className="lr-reveal trust-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
          {TRUST_ITEMS.map((t, i) => (
            <React.Fragment key={t.brand}>
              {i > 0 && <div style={{ width: 1, height: 40, background: G200 }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 700, color: INK }}>{t.brand}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginTop: 6 }}>{t.sub}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="lr-reveal" style={{ textAlign: 'center', maxWidth: 600, margin: '48px auto 0', paddingTop: 48, borderTop: `1px solid ${G200}` }}>
          <p style={{ fontSize: 17, color: G600, lineHeight: 1.6 }}>Not generic AI. Not HR tech. NEXUS is built by people who've spent 10+ years in executive search and leadership assessment. The frameworks are proven. The data is real — from 47 markets and thousands of executive placements. The AI just puts it in your hands, on demand.</p>
        </div>
      </div>
    </section>
  );
}

// ── FINAL CTA (dark) ───────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ background: INK, color: WHITE, textAlign: 'center', padding: '120px 0' }}>
      <div style={containerStyle}>
        <span style={{ ...monoStyle, color: ACCENT, marginBottom: 20, display: 'block' }}>Ready when you are</span>
        <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", color: WHITE, maxWidth: 640, margin: '0 auto 20px', fontSize: 42, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          Leadership isn't a title.<br /><em style={{ fontStyle: 'italic', color: ACCENT, fontWeight: 400 }}>It's a trajectory.</em>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 36px', fontSize: 17, lineHeight: 1.6 }}>Start with the Executive Introduction. About 15 minutes. Personalized insights. No credit card required.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/nexus#start" style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
            Start — Executive Introduction
          </Link>
          <Link to="/nexus" style={btnOutlineLight} {...ctaCompressHandlers}
            onMouseEnter={(e) => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = INK; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = WHITE; }}>
            Learn more about NEXUS
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────
function Footer() {
  const linkHandlers = {
    enter: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = ACCENT; },
    leave: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = INK; },
  };
  const a = { color: INK, textDecoration: 'none', fontSize: 14, opacity: 0.7, transition: 'opacity 120ms ease, color 120ms ease' };
  return (
    <footer style={{ background: G100, padding: '64px 0 32px', borderTop: `1px solid ${G200}` }}>
      <div style={containerStyle}>
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <h4 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 8, color: INK, lineHeight: 1.2 }}>LYC Intelligence</h4>
            <p style={{ color: G600, fontSize: 14, maxWidth: 280, marginTop: 16, lineHeight: 1.6 }}>AI-powered leadership intelligence for executives and organizations that take talent seriously. Powered by DEX AI.</p>
          </div>
          <div>
            <h5 style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginBottom: 20, fontWeight: 500 }}>Product</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><Link to="/nexus" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>NEXUS</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/pricing" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Pricing</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/b2b" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>For Business</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/dex-ai" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>DEX AI</Link></li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginBottom: 20, fontWeight: 500 }}>Company</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>About</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>LYC Partners</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Careers</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: G400, marginBottom: 20, fontWeight: 500 }}>Legal</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><Link to="/privacy" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Privacy</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/terms" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Terms</Link></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Security</a></li>
            </ul>
          </div>
        </div>
        <div style={{ paddingTop: 32, borderTop: `1px solid ${G200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: G400, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", flexWrap: 'wrap', gap: 12 }}>
          <span>© 2026 LYC Intelligence. All rights reserved.</span>
          <span>Powered by DEX AI</span>
        </div>
      </div>
    </footer>
  );
}

// ── PAGE EXPORT ────────────────────────────────────────────────────
export function Landing() {
  useScrollReveal();
  return (
    <div style={{ background: OFF, color: INK, minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>
      <Nav />
      <main>
        <Hero />
        <Capabilities />
        <Personas />
        <B2BTeaser />
        <Trust />
        <FinalCTA />
      </main>
      <Footer />
      <style>{`
        .lr-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 350ms cubic-bezier(0.16,1,0.3,1), transform 350ms cubic-bezier(0.16,1,0.3,1);
        }
        .lr-reveal.lr-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @media (max-width: 768px) {
          .grid-responsive-2 { grid-template-columns: 1fr !important; }
          .grid-responsive { grid-template-columns: 1fr !important; }
          .b2b-teaser-inner { flex-direction: column !important; text-align: center; align-items: center; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .lr-reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>
    </div>
  );
}

export default Landing;
