import React from 'react';
import { Brain, Globe, Award, ArrowRight, Shield, BarChart3, Star, MessageCircle } from 'lucide-react';

const DS = { headingFont: 'Georgia, serif', accent: '#C108AB', bg: '#0A0A0A', card: '#111111', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', radius: '12px' };

export function B2CLanding() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <span style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text }}>LYC Intelligence</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/b2b" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Firms</a>
          <a href="/nexus" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Nexus AI</a>
          <a href="/" style={{ fontSize: '13px', color: DS.text, textDecoration: 'none', padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: '6px' }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '20px' }}>
          <Award style={{ width: 14, height: 14, color: DS.accent }} />
          <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>For Senior Leaders</span>
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '48px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Where do you stand<br />as a cross-border leader?
        </h1>
        <p style={{ fontSize: '17px', color: DS.muted, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Take a 10-minute leadership assessment. Get your archetype, benchmark your profile against European and Asian executive markets, and discover opportunities that match.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}>
            Free Assessment <ArrowRight style={{ width: 16, height: 16 }} />
          </a>
          <a href="/nexus" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: `1px solid ${DS.border}`, color: DS.textSecondary, borderRadius: '8px', fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px' }}>
            <MessageCircle style={{ width: 16, height: 16 }} /> Talk to Nexus AI
          </a>
        </div>
      </div>

      {/* What You Get */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, textAlign: 'center', margin: '0 0 40px' }}>Your Assessment Includes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: Brain, title: 'Leadership Archetype', desc: 'Discover whether you\'re a Strategist, Operator, Catalyst, or Builder — with personalized insights for your career trajectory.' },
            { icon: Globe, title: 'Cross-Border Benchmark', desc: 'See how you compare across European and Asian executive markets. Understand your positioning and unlock hidden opportunities.' },
            { icon: BarChart3, title: 'TRIDENT Score', desc: 'Get scored on Experience, Skills, and Organizational Fit — the same framework top search firms use to evaluate C-suite candidates.' },
          ].map(f => (
            <div key={f.title} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
              <f.icon style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px' }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 24px', textAlign: 'center' }}>3 Steps to Your Results</h3>
          {[
            { step: '1', title: 'Enter your details', desc: 'Name, email, title, country — so we can personalize your report.' },
            { step: '2', title: 'Rate yourself', desc: '10 questions across leadership dimensions. Takes under 10 minutes.' },
            { step: '3', title: 'Get your results', desc: 'Instant archetype + scores + downloadable PDF report.' },
          ].map((s, i) => (
            <div key={s.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: i < 2 ? '20px' : 0 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${DS.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: DS.accent, flexShrink: 0 }}>
                {s.step}
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: DS.text, margin: '0 0 4px' }}>{s.title}</h4>
                <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 32px', textAlign: 'center' }}>
        <Shield style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
        <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>Your data is yours</h3>
        <p style={{ fontSize: '14px', color: DS.muted, lineHeight: 1.6, margin: 0 }}>
          Opt in to be discovered by firms seeking your exact profile, or stay private. No spam, no public listings, no data selling. Ever.
        </p>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 32px 80px', textAlign: 'center' }}>
        <Star style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>Ready to find out?</h2>
        <p style={{ fontSize: '15px', color: DS.muted, marginBottom: '24px' }}>Free assessment. No credit card. Results in 10 minutes.</p>
        <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontSize: '16px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}>
          Start Free Assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </a>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, padding: '20px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by Lyc Partners. Cross-border leadership advisory.</span>
      </footer>
    </div>
  );
}
