import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

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

const ALLOWED_EMAIL = 'kevin.hong@lyc-partners.ai';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
      setError('Access restricted. This platform is invite-only.');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const result = await signInWithPassword(email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/platform');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <Link to="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Back to site</Link>
        </div>
      </nav>

      {/* Login Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${DS.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield style={{ width: 24, height: 24, color: DS.accent }} />
            </div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Platform Access
            </h1>
            <p style={{ fontSize: '14px', color: DS.muted, lineHeight: 1.6 }}>
              Executive Search Platform
            </p>
          </div>

          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: DS.muted }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px',
                      background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px',
                      color: DS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                      fontFamily: DS.bodyFont,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: DS.muted }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '12px 16px 12px 44px',
                      background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px',
                      color: DS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                      fontFamily: DS.bodyFont,
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FEF2F2', borderRadius: '8px', color: '#DC2626', fontSize: '14px', marginBottom: '20px', fontFamily: DS.bodyFont }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="cta-glow"
                style={{
                  width: '100%', padding: '14px',
                  background: DS.accent, color: '#FFFFFF',
                  border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  minHeight: '48px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  fontFamily: DS.bodyFont,
                }}
              >
                {loading ? (
                  <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Signing in...</>
                ) : (
                  <>Sign In <ArrowRight style={{ width: 18, height: 18 }} /></>
                )}
              </button>
            </form>
          </div>

          <p style={{ fontSize: '12px', color: DS.muted, textAlign: 'center', marginTop: '20px', lineHeight: 1.5 }}>
            This platform is invite-only. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: ${DS.accent} !important; box-shadow: 0 0 0 2px rgba(193,8,171,0.2) !important; }
        input::placeholder { color: ${DS.muted}; }
      `}</style>
    </div>
  );
}
