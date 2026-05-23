import React from 'react';
import { ArrowRight, BarChart3, Brain, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';

const DS = { headingFont: 'Georgia, serif', accent: '#C108AB', bg: '#0A0A0A', card: '#111111', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', radius: '12px' };

export function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { if (user) navigate('/platform'); }, [user, navigate]);

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    await login(email);
    setLoading(false);
  };

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
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 32px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '52px', fontWeight: 700, color: DS.text, margin: '0 0 16px', lineHeight: 1.1 }}>
          Cross-border<br />leadership intelligence
        </h1>
        <p style={{ fontSize: '17px', color: DS.muted, maxWidth: '520px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          AI-powered executive search. TRIDENT scoring. Pipeline management. From Europe to Asia.
        </p>

        {/* Product Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
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

        {/* Sign In */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', color: DS.muted, marginBottom: '12px' }}>Already have access? Sign in to the platform:</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email" placeholder="Your email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ flex: 1, padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }}
            />
            <button onClick={handleLogin} disabled={loading || !email} style={{ padding: '12px 20px', background: DS.accent, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: (loading || !email) ? 0.5 : 1, minHeight: '44px' }}>
              {loading ? '...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${DS.border}`, padding: '20px 32px', textAlign: 'center', marginTop: '40px' }}>
        <span style={{ fontSize: '12px', color: DS.muted }}>© 2026 LYC Intelligence by Lyc Partners</span>
      </footer>
    </div>
  );
}
