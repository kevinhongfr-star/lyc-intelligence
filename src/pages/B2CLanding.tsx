import React, { useEffect } from 'react';
import { initScrollReveal } from '@/lib/utils';
import { Brain, Globe, Award, ArrowRight, Shield, BarChart3, Star, MessageCircle } from 'lucide-react';
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
  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}`, background: DS.bg }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/b2b" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>For Firms</a>
          <a href="/nexus" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>Nexus AI</a>
          <a href="/" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.text, textDecoration: 'none', padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: '6px', transition: 'background-color 0.2s ease' }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 60px', textAlign: 'center' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '16px' }}>
          For Senior Leaders
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '48px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Where do you stand<br />as a cross-border leader?
        </h1>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: DS.textSecondary, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Take a 10-minute leadership assessment. Get your archetype, benchmark your profile against European and Asian executive markets, and discover opportunities that match.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'background-color 0.2s ease, transform 0.15s ease' }}>
            Free Assessment <ArrowRight style={{ width: 16, height: 16 }} />
          </a>
          <a href="/nexus" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: `1px solid #000000`, color: '#000000', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px', transition: 'background-color 0.2s ease' }}>
            <MessageCircle style={{ width: 16, height: 16 }} /> Talk to Nexus AI
          </a>
        </div>
      </div>

      {/* What You Get */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
          Your Assessment Includes
        </div>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 400, color: DS.text, textAlign: 'center', margin: '0 0 40px' }}>Your Assessment Includes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { icon: Brain, title: 'Leadership Archetype', desc: "Discover whether you're a Strategist, Operator, Catalyst, or Builder — with personalized insights for your career trajectory." },
            { icon: Globe, title: 'Cross-Border Benchmark', desc: 'See how you compare across European and Asian executive markets. Understand your positioning and unlock hidden opportunities.' },
            { icon: BarChart3, title: 'Career Benchmark', desc: 'Get benchmarked across Experience, Skills, and Organizational Fit — see exactly how you compare to what top firms look for in C-suite candidates.' },
          ].map(f => (
            <div key={f.title} style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', boxShadow: DS.shadow, transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}>
              <f.icon style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ background: DS.bgAlt, padding: '64px 0' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow }}>
            <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
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
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 32px', textAlign: 'center' }}>
        <Shield style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
        <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>Your data is yours</h3>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, lineHeight: 1.6, margin: 0 }}>
          Opt in to be discovered by firms seeking your exact profile, or stay private. No spam, no public listings, no data selling. Ever.
        </p>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 32px 96px', textAlign: 'center' }}>
        <Star style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>Ready to find out?</h2>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.muted, marginBottom: '24px' }}>Free assessment. No credit card. Results in 10 minutes.</p>
        <LeadCaptureForm type="b2c" source="b2c_landing" />
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, marginTop: '48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by LYC Partners</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/b2b" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none' }}>For Firms</a>
            <a href="/nexus" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none' }}>Nexus AI</a>
            <a href="https://lyc-partners.ai" target="_blank" rel="noopener" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none' }}>LYC Partners</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
