import React from 'react';
import { ArrowRight, BarChart3, Brain, MessageCircle, Users, Briefcase } from 'lucide-react';

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
  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}`, background: DS.bg }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/match" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>Match Analysis</a>
          <a href="/b2b" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>For Firms</a>
          <a href="/b2c" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>For Leaders</a>
          <a href="/nexus" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>Nexus AI</a>
          <a href="/platform" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.text, textDecoration: 'none', padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: '6px', transition: 'background-color 0.2s ease' }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 48px', textAlign: 'center' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '16px' }}>
          Platform
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '52px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Cross-border<br />leadership intelligence
        </h1>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: DS.textSecondary, maxWidth: '520px', margin: '0 auto 48px', lineHeight: 1.6 }}>
          AI-powered executive search. Score candidates instantly. From Europe to Asia.
        </p>

        {/* Dual CTA Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <a 
            href="/b2c" 
            style={{ 
              background: DS.card, 
              border: `1px solid ${DS.cardBorder}`, 
              borderRadius: DS.radius, 
              padding: '32px 24px', 
              textDecoration: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              boxShadow: DS.shadow,
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              cursor: 'pointer'
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
              background: DS.card, 
              border: `1px solid ${DS.cardBorder}`, 
              borderRadius: DS.radius, 
              padding: '32px 24px', 
              textDecoration: 'none', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              boxShadow: DS.shadow,
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <Briefcase style={{ width: 32, height: 32, color: DS.accent, marginBottom: '16px' }} />
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>I'm hiring</h3>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, margin: '0 0 20px', lineHeight: 1.5 }}>Meet exceptional cross-border leaders, score candidates, and build your team.</p>
            <span style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.accent, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Started <ArrowRight style={{ width: 16, height: 16 }} />
            </span>
          </a>
        </div>


        {/* Stats Bar */}
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 32px 48px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '64px', flexWrap: 'wrap' }}>
            {[
              { value: '47', label: 'Markets' },
              { value: '500+', label: 'Placements' },
              { value: '92%', label: 'Retention' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: DS.headingFont, fontSize: '36px', fontWeight: 700, color: DS.text, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.muted, marginTop: '8px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Product Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '60px' }}>
          {[
            { icon: BarChart3, title: 'Match Analysis', desc: 'AI-powered JD-CV matching engine. Score candidates instantly.', href: '/match', cta: 'Try Free' },
            { icon: Brain, title: 'Leadership Assessment', desc: 'Discover your archetype. Benchmark against global executives.', href: '/assessment', cta: 'Take Assessment' },
            { icon: MessageCircle, title: 'Nexus AI', desc: 'Talk to our AI about career positioning, scoring, and opportunities.', href: '/nexus', cta: 'Start Chat' },
          ].map(p => (
            <a key={p.title} href={p.href} style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', textDecoration: 'none', display: 'block', boxShadow: DS.shadow, transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}>
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

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, padding: '20px 32px', textAlign: 'center', marginTop: '40px' }}>
        <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by LYC Partners</span>
      </footer>
    </div>
  );
}
