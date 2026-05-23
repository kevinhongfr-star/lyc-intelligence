import React from 'react';
import { BarChart3, Shield, Briefcase, ArrowRight, Users, Zap, Star, CheckCircle2 } from 'lucide-react';

const DS = { headingFont: 'Georgia, serif', accent: '#C108AB', bg: '#0A0A0A', card: '#111111', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', radius: '12px' };

export function B2BLanding() {
  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <span style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text }}>LYC Intelligence</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/match" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>TRIDENT Match</a>
          <a href="/b2c" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Leaders</a>
          <a href="/nexus" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Nexus AI</a>
          <a href="/" style={{ fontSize: '13px', color: DS.text, textDecoration: 'none', padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: '6px' }}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '20px' }}>
          <Zap style={{ width: 14, height: 14, color: DS.accent }} />
          <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>AI-Powered Executive Search</span>
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '48px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Find your next<br />C-suite leader in hours,<br />not months
        </h1>
        <p style={{ fontSize: '17px', color: DS.muted, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          TRIDENT Match uses AI to score candidates against your job description across 3 dimensions — Experience, Skills, and Organizational Fit. No more gut feelings.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/match" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}>
            Try TRIDENT Match Free <ArrowRight style={{ width: 16, height: 16 }} />
          </a>
          <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: `1px solid ${DS.border}`, color: DS.textSecondary, borderRadius: '8px', fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px' }}>
            Leadership Assessment
          </a>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, textAlign: 'center', margin: '0 0 40px' }}>How TRIDENT Match Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { step: '01', icon: '📝', title: 'Paste Your JD', desc: 'Drop in the full job description — role, requirements, qualifications, company context.' },
            { step: '02', icon: '👥', title: 'Add Candidates', desc: 'Paste CVs, LinkedIn profiles, or resume text for each candidate you want to evaluate.' },
            { step: '03', icon: '🎯', title: 'Get TRIDENT Scores', desc: 'AI scores each candidate on 3 dimensions with verdicts, match reasons, risks, and approach strategy.' },
          ].map(s => (
            <div key={s.step} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '11px', color: DS.accent, fontWeight: 600, marginBottom: '6px' }}>STEP {s.step}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Breakdown */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px' }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 20px' }}>TRIDENT 3D Scoring Model</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { dim: 'D1', weight: '40%', name: 'Experience & Achievements', desc: 'Career trajectory, role progression, quantifiable impact, leadership scope', color: '#3B82F6' },
              { dim: 'D2', weight: '35%', name: 'Skills / Functional Match', desc: 'Technical competencies, functional expertise, cross-border capability, language fit', color: DS.accent },
              { dim: 'D3', weight: '25%', name: 'Organizational Fit', desc: 'Culture alignment, stakeholder complexity, transformation readiness, board dynamics', color: '#8B5CF6' },
            ].map(d => (
              <div key={d.dim} style={{ background: DS.bg, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 700, color: d.color }}>{d.weight}</span>
                  <span style={{ fontSize: '12px', color: DS.muted }}>{d.dim}</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: DS.text, margin: '0 0 6px' }}>{d.name}</h4>
                <p style={{ fontSize: '12px', color: DS.muted, lineHeight: 1.4, margin: 0 }}>{d.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', padding: '12px 16px', background: DS.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: '#22C55E' }} />
            <span style={{ fontSize: '12px', color: DS.muted }}>Verdict mapping: Strong Fit → T1 Strong Primary · Conditional → T2 Strong Secondary · Weak → T3 Reserve</span>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { icon: BarChart3, title: 'Instant Scoring', desc: 'Each candidate scored in seconds. No waiting for analyst reports.' },
            { icon: Shield, title: 'Confidential', desc: 'Your JDs and candidate data stay private. Never shared with third parties.' },
            { icon: Users, title: 'Batch Processing', desc: 'Score multiple candidates against the same JD in one sweep.' },
          ].map(f => (
            <div key={f.title} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
              <f.icon style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 32px 80px', textAlign: 'center' }}>
        <Star style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>Start matching today</h2>
        <p style={{ fontSize: '15px', color: DS.muted, marginBottom: '24px' }}>Free to try. No credit card required. Score your first candidates in under 2 minutes.</p>
        <a href="/match" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontSize: '16px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}>
          Launch TRIDENT Match <ArrowRight style={{ width: 18, height: 18 }} />
        </a>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, padding: '20px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by Lyc Partners. Cross-border leadership advisory.</span>
      </footer>
    </div>
  );
}
