import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DS } from '@/tokens';

// ── DESIGN TOKENS — Phase 9 Batch 6 ticket #1356
// DEX AI is the INTERNAL engine code name; publicly there is only LYC Intelligence (same brand family,
// same accent fuchsia #C108AB as the rest of the site). No teal. Section labels use light gray #9CA3AF.

const monoStyle: React.CSSProperties = {
  fontFamily: DS.monoFont,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
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
  border: `1px solid ${DS.text}`,
  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
  fontFamily: DS.bodyFont,
  cursor: 'pointer',
  minHeight: 44,
};

const btnPrimary: React.CSSProperties = { ...btnBase, background: DS.accent, color: DS.bg, borderColor: DS.accent };
const btnSecondary: React.CSSProperties = { ...btnBase, background: 'transparent', color: DS.text };
// Ticket #1355 — section labels light gray per v1.2 brand spec
const sectionLabel: React.CSSProperties = { ...monoStyle, color: DS.eyebrow, marginBottom: 20, display: 'inline-block' };

// ── MOTION: Scroll reveal hook (fadeUp 350ms, IntersectionObserver) ──
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('da-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.da-reveal').forEach((el) => observer.observe(el));
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

// ── HERO (light, fuchsia LYC accent) ─────────────────────────────────
function Hero() {
  return (
    <section style={{ padding: '180px 0 120px', textAlign: 'center', position: 'relative' }}>
      <div style={containerStyle}>
        {/* Ticket #1355 — eyebrow light gray not accent */}
        <span style={{ ...monoStyle, color: DS.eyebrow, marginBottom: 28, display: 'inline-block' }}>Technology</span>
        <h1 style={{
          fontFamily: DS.headingFont,
          fontWeight: 700, fontSize: 52, lineHeight: 1.15,
          color: DS.text, maxWidth: 720, margin: '0 auto 24px',
          letterSpacing: '-0.02em',
        }}>
          Powered by <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontStyle: 'normal', fontWeight: 600, color: DS.accent, letterSpacing: '-0.02em' }}>NEXUS<span style={{ color: DS.accent }}>.</span></span>
        </h1>
        <p style={{ fontSize: 18, maxWidth: 640, margin: '0 auto 32px', color: DS.muted, lineHeight: 1.6 }}>
          Multi-agent AI systems, specialized assessment models, and talent market data — all working together to power leadership intelligence for executives on the move.
        </p>
        <div style={{ fontFamily: DS.monoFont, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.mutedDim, marginBottom: 40 }}>
          Executive intelligence. Built by LYC Partners.
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/nexus" style={btnPrimary} {...ctaCompressHandlers}
            onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentDark)}
            onMouseLeave={(e) => (e.currentTarget.style.background = DS.accent)}>
            Experience it in NEXUS <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </Link>
        </div>
        {/* Static hero accent line (1px vertical gradient, LYC fuchsia → transparent, no animation) */}
        <div style={{ width: 1, height: 60, background: `linear-gradient(to bottom, ${DS.accent}, transparent)`, margin: '80px auto 0' }} />
      </div>
    </section>
  );
}

// ── ARCHITECTURE (stack diagram + detail cards with staggered reveals) ──
const ARCH_LAYERS_GRID = [
  { label: 'Layer 03 — Agents', title: 'Multi-Agent System', desc: 'Specialized AI agents for different tasks — assessment, matching, analysis, advisory chat. Each optimized for its domain.' },
  { label: 'Layer 02 — Engines', title: 'Assessment Engines', desc: 'Structured scoring models combined with LLM narrative generation. Built on validated leadership frameworks, not generic AI.' },
  { label: 'Layer 02 — Algorithms', title: 'Matching Algorithms', desc: "Multi-dimensional candidate-role fit with transparent scoring breakdowns. No black boxes — you see why a match scores what it does." },
  { label: 'Layer 01 — Data', title: 'Market Intelligence Layer', desc: 'Structured talent market data from multiple sources — compensation, organizational structure, talent movement across industries.' },
];
const ARCH_DETAIL = [
  { icon: '\u2699', title: 'Multi-Agent System', desc: 'Specialized agents handle different types of requests, each with its own prompt engineering and tool access.', items: ['Advisory chat agent', 'Assessment analysis agent', 'Match analysis agent', 'Market intelligence agent'] },
  { icon: '\u{1F4CA}', title: 'Assessment Models', desc: 'Structured scoring with LLM narrative generation. DeepSeek-based processing with LYC framework guardrails.', items: ['5-dimension pipeline diagnostic', '6-diagnostic leadership model', 'Profile classification (6 types)', 'Narrative report generation'] },
  { icon: '\u{1F3AF}', title: 'Match Analysis Engine', desc: 'JD-CV matching with dimensional breakdowns. Transparent scoring that explains the "why" behind every fit assessment.', items: ['Multi-dimensional fit scoring', 'Transparent breakdown', 'JD parsing & normalization', 'CV extraction & analysis'] },
  { icon: '\u{1F4C8}', title: 'Market Data Layer', desc: 'Structured talent market data continuously aggregated and normalized from multiple verified sources.', items: ['Compensation benchmarks', 'Talent movement tracking', 'Organizational structure data', '47 markets benchmarked'] },
];
function Architecture() {
  return (
    <section id="architecture" style={{ padding: '100px 0', background: DS.bgAlt }}>
      <div style={containerStyle}>
        <div className="da-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>System Design</span>
          <h2 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: DS.text, marginBottom: 20, letterSpacing: '-0.02em' }}>
            How it works <em style={{ fontStyle: 'italic', color: DS.accent, fontWeight: 400 }}>under the hood.</em>
          </h2>
          <p style={{ fontSize: 17, color: DS.muted, lineHeight: 1.6 }}>NEXUS isn't a single model. It's a system of specialized AI components that work together — orchestrated to deliver leadership intelligence you can trust, built on 20 years of LYC Partners methodology.</p>
        </div>

        {/* Architecture stack diagram */}
        <div className="da-reveal" style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Top: NEXUS Orchestration (dark) */}
          <div style={{
            border: `1px solid ${DS.text}`, background: DS.text, color: DS.bg,
            padding: '28px 32px', marginBottom: 8,
          }}>
            <span style={{ fontFamily: DS.monoFont, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.eyebrow, marginBottom: 8, display: 'block' }}>Layer 04 — Interface</span>
            <h3 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: 20, marginBottom: 8, lineHeight: 1.2, color: DS.bg }}>NEXUS Orchestration Layer</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Ties everything together in one conversational interface. Routes requests, manages context, and delivers coherent, actionable responses.</p>
          </div>
          {/* Middle: Core AI Systems (2-col grid) */}
          <div className="da-arch-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {ARCH_LAYERS_GRID.map((l, i) => (
              <div key={l.title} className="da-reveal" style={{
                border: `1px solid ${DS.border}`, background: DS.bg, padding: '28px 32px',
                transitionDelay: `${i * 80}ms`,
                transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = DS.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = DS.border; }}>
                <span style={{ fontFamily: DS.monoFont, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.eyebrow, marginBottom: 8, display: 'block' }}>{l.label}</span>
                <h3 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: 20, marginBottom: 8, lineHeight: 1.2, color: DS.text }}>{l.title}</h3>
                <p style={{ fontSize: 14, color: DS.muted, lineHeight: 1.6 }}>{l.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detail cards (2x2 grid) */}
        <div className="da-reveal da-arch-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: DS.border, border: `1px solid ${DS.border}`, marginTop: 64 }}>
          {ARCH_DETAIL.map((c, i) => (
            <div key={c.title} className="da-reveal" style={{
              background: DS.bg, padding: '36px 32px',
              transitionDelay: `${i * 80}ms`,
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = DS.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}>
              <div style={{ width: 36, height: 36, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.bgAlt, fontSize: 18, color: DS.accent }}>{c.icon}</div>
              <h3 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: 20, marginBottom: 12, lineHeight: 1.2, color: DS.text }}>{c.title}</h3>
              <p style={{ color: DS.muted, fontSize: 14, lineHeight: 1.6 }}>{c.desc}</p>
              <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
                {c.items.map(it => (
                  <li key={it} style={{ padding: '6px 0', fontSize: 13, color: DS.muted, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: DS.accent, fontWeight: 500 }}>—</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TRUST & SECURITY (2x2 grid) ────────────────────────────────────
const TRUST_CARDS = [
  { icon: '\u{1F512}', title: 'Data Privacy', desc: "Your assessment data and personal information belong to you. We don't sell data, we don't train public models on your data.", items: ['Encrypted data storage', 'No training on user data', 'Data portability', 'GDPR-aligned practices'] },
  { icon: '\u{1F6E1}', title: 'Secure Infrastructure', desc: 'Enterprise-grade infrastructure with proper access controls, monitoring, and redundancy built in from day one.', items: ['Cloud infrastructure', 'Role-based access controls', 'Audit logging', 'Regular security reviews'] },
  { icon: '\u2713', title: 'Model Quality & Validation', desc: 'Our AI models are grounded in validated leadership frameworks from LYC Partners — not generic AI trained on internet content.', items: ['LYC framework-validated', 'Benchmarked against real data', 'Transparent scoring methodology', 'Continuous quality monitoring'] },
  { icon: '\u2605', title: 'LYC Partners Expertise', desc: 'Every model, every assessment, every benchmark is built on 10+ years of real executive search and assessment work.', items: ['Built by practitioners', 'Real assessment frameworks', 'China / APAC specialization', 'Executive-level benchmarking'] },
];
function TrustSecurity() {
  return (
    <section id="security" style={{ padding: '100px 0' }}>
      <div style={containerStyle}>
        <div className="da-reveal" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }}>
          <span style={sectionLabel}>Trust &amp; Security</span>
          <h2 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: 38, lineHeight: 1.15, color: DS.text, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Built with <em style={{ fontStyle: 'italic', color: DS.accent, fontWeight: 400 }}>security at the core.</em>
          </h2>
          <p style={{ fontSize: 17, color: DS.muted, lineHeight: 1.6 }}>We take data privacy and model quality seriously. Here's what that means in practice.</p>
        </div>
        <div className="da-reveal da-trust-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {TRUST_CARDS.map((c, i) => (
            <div key={c.title} className="da-reveal" style={{
              background: DS.bg, padding: '36px 32px', border: `1px solid ${DS.border}`,
              transitionDelay: `${i * 80}ms`,
              transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = DS.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = DS.border; }}>
              <div style={{ width: 40, height: 40, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: DS.bgAlt, fontSize: 20, color: DS.accent }}>{c.icon}</div>
              <h3 style={{ fontFamily: DS.headingFont, fontWeight: 700, fontSize: 20, marginBottom: 12, lineHeight: 1.2, color: DS.text }}>{c.title}</h3>
              <p style={{ color: DS.muted, fontSize: 14, lineHeight: 1.6 }}>{c.desc}</p>
              <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
                {c.items.map(it => (
                  <li key={it} style={{ padding: '6px 0', fontSize: 13, color: DS.muted, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: DS.accent, fontWeight: 700 }}>{'\u2713'}</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── BACK TO NEXUS CTA (dark) ───────────────────────────────────────
function BackCTA() {
  return (
    <section style={{ textAlign: 'center', padding: '120px 0', background: DS.text, color: DS.bg }}>
      <div style={containerStyle}>
        {/* Ticket #1355 — eyebrow label light gray (use lightened gray for dark bg: DS.mutedDim equivalent works on dark) */}
        <span style={{ ...monoStyle, color: DS.mutedDim, marginBottom: 20, display: 'block' }}>See it in action</span>
        <h2 style={{ fontFamily: DS.headingFont, color: DS.bg, maxWidth: 640, margin: '0 auto 20px', fontSize: 40, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>NEXUS<span style={{ color: DS.accent }}>.</span></span><br />See what it can do for you.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 36px', fontSize: 17, lineHeight: 1.6 }}>The best way to understand NEXUS is to experience it. Start with the Executive Introduction — about 15 minutes.</p>
        <Link to="/nexus#start" style={{ ...btnPrimary, padding: '16px 36px' }} {...ctaCompressHandlers}
          onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentDark)}
          onMouseLeave={(e) => (e.currentTarget.style.background = DS.accent)}>
          Go to NEXUS <ArrowRight size={14} style={{ marginLeft: 6 }} />
        </Link>
      </div>
    </section>
  );
}

// ── FOOTER ─────────────────────────────────────────────────────────
function Footer() {
  const linkHandlers = {
    enter: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = DS.accent; },
    leave: (e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = DS.text; },
  };
  const a = { color: DS.text, textDecoration: 'none', fontSize: 14, opacity: 0.7, transition: 'opacity 120ms ease, color 120ms ease' };
  return (
    <footer style={{ background: DS.bgAlt, padding: '64px 0 32px', borderTop: `1px solid ${DS.border}` }}>
      <div style={containerStyle}>
        <div className="da-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
          <div>
            <h4 style={{ fontFamily: DS.headingFont, fontSize: 20, fontWeight: 700, marginBottom: 8, color: DS.text, lineHeight: 1.2, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontWeight: 600, letterSpacing: '-0.02em' }}>NEXUS<span style={{ color: DS.accent }}>.</span></span>
            </h4>
            <p style={{ color: DS.muted, fontSize: 14, maxWidth: 280, marginTop: 16, lineHeight: 1.6 }}>Multi-agent AI systems, specialized assessment models, and talent market data — powering leadership intelligence for executives on the move.</p>
          </div>
          <div>
            <h5 style={{ fontFamily: DS.monoFont, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.mutedDim, marginBottom: 20, fontWeight: 500 }}>Product</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><Link to="/nexus" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>NEXUS</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/assessments" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Assessments</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/pricing" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: DS.monoFont, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.mutedDim, marginBottom: 20, fontWeight: 500 }}>Company</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>About</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>LYC Partners</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Careers</a></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h5 style={{ fontFamily: DS.monoFont, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: DS.mutedDim, marginBottom: 20, fontWeight: 500 }}>Legal</h5>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ marginBottom: 10 }}><Link to="/privacy" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Privacy</Link></li>
              <li style={{ marginBottom: 10 }}><Link to="/terms" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Terms</Link></li>
              <li style={{ marginBottom: 10 }}><a href="#" style={a} onMouseEnter={linkHandlers.enter} onMouseLeave={linkHandlers.leave}>Security</a></li>
            </ul>
          </div>
        </div>
        <div style={{ paddingTop: 32, borderTop: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: DS.mutedDim, fontFamily: DS.monoFont, flexWrap: 'wrap', gap: 12 }}>
          <span>© 2026 LYC Partners. All rights reserved.</span>
          <span>Made for leaders</span>
        </div>
      </div>
    </footer>
  );
}

// ── PAGE EXPORT ────────────────────────────────────────────────────
export function DexAiPage() {
  useScrollReveal();
  return (
    <div style={{ background: DS.bgAlt, color: DS.text, minHeight: '100vh', fontFamily: DS.bodyFont, lineHeight: 1.6, WebkitFontSmoothing: 'antialiased' }}>
      <main>
        <Hero />
        <Architecture />
        <TrustSecurity />
        <BackCTA />
      </main>
      <Footer />
      <style>{`.da-reveal { opacity: 0; transform: translateY(24px); transition: opacity 350ms cubic-bezier(0.16,1,0.3,1), transform 350ms cubic-bezier(0.16,1,0.3,1); } .da-reveal.da-visible { opacity: 1; transform: translateY(0); } @media (max-width: 768px) { .da-arch-grid { grid-template-columns: 1fr !important; } .da-arch-detail-grid { grid-template-columns: 1fr !important; } .da-trust-grid { grid-template-columns: 1fr !important; } .da-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; } .da-reveal { opacity: 1; transform: none; transition: none; } }`}</style>
    </div>
  );
}

export default DexAiPage;
