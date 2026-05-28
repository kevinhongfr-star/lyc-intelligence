import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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

type LoginMode = 'magic_link' | 'password';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithMagicLink, signInWithPassword } = useAuthStore();
  
  const [mode, setMode] = useState<LoginMode>('magic_link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await signInWithMagicLink(email);
    setLoading(false);

    if (result.success) {
      setMagicLinkSent(true);
    } else {
      setError(result.error || 'Failed to send magic link');
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signInWithPassword(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Failed to sign in');
    }
  };

  if (magicLinkSent) {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '48px 40px', textAlign: 'center' }}>
          <CheckCircle2 style={{ width: 56, height: 56, color: DS.success, margin: '0 auto 24px' }} />
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 600, color: DS.text, margin: '0 0 12px' }}>
            Check your email
          </h1>
          <p style={{ fontSize: '15px', color: DS.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
            We sent a magic link to <strong style={{ color: DS.text }}>{email}</strong>.
            Click the link in the email to sign in.
          </p>
          <p style={{ fontSize: '13px', color: DS.muted }}>
            Didn't receive it? Check your spam folder or{' '}
            <button onClick={() => setMagicLinkSent(false)} style={{ background: 'none', border: 'none', color: DS.accent, cursor: 'pointer', fontSize: '13px' }}>
              try again
            </button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <Link to="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/signup" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Sign up</Link>
          <Link to="/nexus" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Talk to Nexus AI</Link>
        </div>
      </nav>

      {/* Login Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '15px', color: DS.muted }}>
              Sign in to access your profile and assessments
            </p>
          </div>

          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: DS.card, borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
            <button
              onClick={() => { setMode('magic_link'); setError(''); setPassword(''); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: mode === 'magic_link' ? DS.accent : 'transparent',
                color: mode === 'magic_link' ? '#FFF' : DS.muted,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Magic Link
            </button>
            <button
              onClick={() => { setMode('password'); setError(''); setMagicLinkSent(false); }}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: mode === 'password' ? DS.accent : 'transparent',
                color: mode === 'password' ? '#FFF' : DS.muted,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Password
            </button>
          </div>

          {/* Form */}
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px' }}>
            <form onSubmit={mode === 'magic_link' ? handleMagicLink : handlePassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: DS.textSecondary, marginBottom: '8px' }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: DS.muted }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      background: DS.bg,
                      border: `1px solid ${DS.cardBorder}`,
                      borderRadius: '8px',
                      color: DS.text,
                      fontSize: '15px',
                      outline: 'none',
                      minHeight: '44px',
                    }}
                  />
                </div>
              </div>

              {mode === 'password' && (
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
                      placeholder="Your password"
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 44px',
                        background: DS.bg,
                        border: `1px solid ${DS.cardBorder}`,
                        borderRadius: '8px',
                        color: DS.text,
                        fontSize: '15px',
                        outline: 'none',
                        minHeight: '44px',
                      }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: `${DS.error}15`, borderRadius: '8px', color: DS.error, fontSize: '14px', marginBottom: '20px' }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: DS.accent,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '48px',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                    {mode === 'magic_link' ? 'Sending link...' : 'Signing in...'}
                  </>
                ) : (
                  <>
                    {mode === 'magic_link' ? 'Send Magic Link' : 'Sign In'}
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </>
                )}
              </button>
            </form>

            <p style={{ fontSize: '13px', color: DS.muted, textAlign: 'center', marginTop: '20px' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: DS.accent, textDecoration: 'none', fontWeight: 500 }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: ${DS.accent} !important;
        }
        input::placeholder {
          color: ${DS.muted};
        }
      `}</style>
    </div>
  );
}
