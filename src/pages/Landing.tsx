import React from 'react';
import { ArrowRight, BarChart3, Brain, MessageCircle, Users, Briefcase } from 'lucide-react';

const DS = { headingFont: 'Georgia, serif', accent: '#C108AB', bg: '#0A0A0A', card: '#111111', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', radius: '12px' };

export function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <span style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text }}>LYC Intelligence</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/match" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>TRIDENT Match</a>
          <a href="/b2b" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Firms</a>
          <a href="/b2c" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Leaders</a>
          <a href="/nexus" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Nexus AI</a>
          <a href="/platform" style={{ fontSize: '13px', color: DS.accent, textDecoration: 'none', fontWeight: 600 }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '52px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Cross-border<br />leadership intelligence
        </h1>
        <p style={{ fontSize: '17px', color: DS.muted, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          AI-powered executive search. TRIDENT scoring. Pipeline management. From Europe to Asia.
        </p>

        {/* Dual CTA Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <a 
            href="/b2c" 
            style={{ 
              background: DS.card, 
              border: `1px solid ${DS.border}`, 
              borderRadius: DS.radius, 
              padding: '32px 24px', 
              textDecoration: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              transition: 'border-color 0.2s',
              cursor: 'pointer'
            }}
          >
            <Users style={{ width: 32, height: 32, color: DS.accent, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>I'm a leader</h3>
            <p style={{ fontSize: '14px', color: DS.muted, margin: '0 0 20px', lineHeight: 1.5 }}>Get your leadership archetype, benchmark your profile, and explore opportunities.</p>
            <span style={{ fontSize: '15px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Started <ArrowRight style={{ width: 16, height: 16 }} />
            </span>
          </a>
          <a 
            href="/b2b" 
            style={{ 
              background: DS.card, 
              border: `1px solid ${DS.border}`, 
              borderRadius: DS.radius, 
              padding: '32px 24px', 
              textDecoration: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              transition: 'border-color 0.2s',
              cursor: 'pointer'
            }}
          >
            <Briefcase style={{ width: 32, height: 32, color: DS.accent, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>I'm hiring</h3>
            <p style={{ fontSize: '14px', color: DS.muted, margin: '0 0 20px', lineHeight: 1.5 }}>Meet exceptional cross-border leaders, score candidates, and build your team.</p>
            <span style={{ fontSize: '15px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Started <ArrowRight style={{ width: 16, height: 16 }} />
            </span>
          </a>
        </div>

        {/* Product Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '60px' }}>
          {[
            { icon: BarChart3, title: 'TRIDENT Match', desc: 'AI-powered JD ↔ CV matching engine. Score candidates instantly.', href: '/match', cta: 'Try Free' },
            { icon: Brain, title: 'Leadership Assessment', desc: 'Discover your archetype. Benchmark against global executives.', href: '/assessment', cta: 'Take Assessment' },
            { icon: MessageCircle, title: 'Nexus AI', desc: 'Talk to our AI about career positioning, scoring, and opportunities.', href: '/nexus', cta: 'Start Chat' },
          ].map(p => (
            <a key={p.title} href={p.href} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
              <p.icon style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: '0 0 16px' }}>{p.desc}</p>
              <span style={{ fontSize: '13px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {p.cta} <ArrowRight style={{ width: 14, height: 14 }} />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, padding: '20px 32px', textAlign: 'center', marginTop: '40px' }}>
        <span style={{ fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by LYC Partners</span>
      </footer>
    </div>
  );
}
