import React, { useEffect } from 'react';
import { initScrollReveal } from '@/lib/scrollReveal';
import { BarChart3, Shield, Briefcase, ArrowRight, Users, Zap, FileText, UserPlus, Award } from 'lucide-react';
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
  useEffect(() => {
    const observer = initScrollReveal();
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}`, background: DS.bg }}>
        <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/match" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>Match Analysis</a>
          <a href="/b2c" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>For Leaders</a>
          <a href="/nexus" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none', transition: 'color 0.15s ease' }}>Nexus AI</a>
          <a href="/" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.text, textDecoration: 'none', padding: '8px 16px', border: `1px solid ${DS.border}`, borderRadius: '6px', transition: 'background-color 0.2s ease' }}>Sign In</a>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '96px 32px 60px', textAlign: 'center' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '16px' }}>
          AI-Powered Executive Search
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '20px' }}>
          <Zap style={{ width: 14, height: 14, color: DS.accent }} />
          <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.accent, fontWeight: 600 }}>AI-Powered Executive Search</span>
        </div>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '48px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Find Your Next<br />C-Suite Leader in Hours,<br />Not Months
        </h1>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '17px', color: DS.textSecondary, maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
          Paste a job description, add candidate profiles, and get instant 3-dimensional match scores. See who fits before you schedule the first call.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/match" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 600, textDecoration: 'none', minHeight: '44px', transition: 'background-color 0.2s ease, transform 0.15s ease' }}>
            Try Match Analysis Free <ArrowRight style={{ width: 16, height: 16 }} />
          </a>
          <a href="/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', border: `1px solid #000000`, color: '#000000', borderRadius: '8px', fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 500, textDecoration: 'none', minHeight: '44px', transition: 'background-color 0.2s ease' }}>
            Leadership Assessment
          </a>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px 40px' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
          How It Works
        </div>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 400, color: DS.text, textAlign: 'center', margin: '0 0 40px' }}>How Match Analysis Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[
            { step: '01', icon: FileText, title: 'Paste Your JD', desc: 'Drop in the full job description — role, requirements, qualifications, company context.' },
            { step: '02', icon: UserPlus, title: 'Add Candidates', desc: 'Paste CVs, LinkedIn profiles, or resume text for each candidate you want to evaluate.' },
            { step: '03', icon: Award, title: 'Get Match Scores', desc: 'AI scores each candidate on 3 dimensions with verdicts, match reasons, risks, and approach strategy.' },
          ].map(s => (
            <div key={s.step} style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', boxShadow: DS.shadow, transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}>
              <s.icon style={{ width: 32, height: 32, color: DS.accent, marginBottom: '12px' }} />
              <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '6px' }}>Step {s.step}</div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{s.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px', background: DS.bgAlt }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px' }}>
          Scoring Dimensions
        </div>
        <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 20px' }}>How Scoring Works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
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
            <Briefcase style={{ width: 14, height: 14, color: '#1A7A4A' }} />
            <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>Each candidate receives a match verdict: Strong Fit, Good Fit, or Potential Fit — with detailed reasoning and approach strategy.</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 32px 40px' }}>
        <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px', textAlign: 'center' }}>
          Why Match Analysis
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[
            { icon: BarChart3, title: 'Instant Scoring', desc: 'Each candidate scored in seconds. No waiting for analyst reports.' },
            { icon: Shield, title: 'Confidential', desc: 'Your JDs and candidate data stay private. Never shared with third parties.' },
            { icon: Users, title: 'Batch Processing', desc: 'Score multiple candidates against the same JD in one sweep.' },
          ].map(f => (
            <div key={f.title} style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px', boxShadow: DS.shadow, transition: 'box-shadow 0.2s ease, transform 0.2s ease' }}>
              <f.icon style={{ width: 24, height: 24, color: DS.accent, marginBottom: '12px' }} />
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '15px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 32px 96px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '3px', background: DS.accent, margin: '0 auto 16px', borderRadius: '2px' }} />
        <h2 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>Start matching today</h2>
        <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.muted, marginBottom: '24px' }}>Free to try. No credit card required. Score your first candidates in under 2 minutes.</p>
        <LeadCaptureForm type="b2b" source="b2b_landing" />
      </div>

      <footer style={{ borderTop: `1px solid ${DS.border}`, marginTop: '48px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by LYC Partners</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="/b2c" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none' }}>For Leaders</a>
            <a href="/nexus" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none' }}>Nexus AI</a>
            <a href="https://lyc-partners.ai" target="_blank" rel="noopener" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.textSecondary, textDecoration: 'none' }}>LYC Partners</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
