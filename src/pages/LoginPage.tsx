import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

import { DS } from '@/lib/designSystem';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithPassword, resetPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Check if user arrived from password reset link
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      // Supabase has already handled the token — user just needs to set new password
      // For now, show a message that they can log in with their new password
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const result = await signInWithPassword(email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!email.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    const result = await resetPassword(email.trim());
    setResetLoading(false);

    if (result.success) {
      setResetSent(true);
    } else {
      setResetError(result.error || 'Failed to send reset email');
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
              {mode === 'login' ? 'Platform Access' : 'Reset Password'}
            </h1>
            <p style={{ fontSize: '14px', color: DS.muted, lineHeight: 1.6 }}>
              {mode === 'login' ? 'Sign in to your account' : 'We\'ll send you a reset link'}
            </p>
          </div>

          {mode === 'forgot' && resetSent ? (
            <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow, textAlign: 'center' }}>
              <CheckCircle2 style={{ width: 48, height: 48, color: DS.success, margin: '0 auto 16px' }} />
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', color: DS.text, marginBottom: '8px' }}>Check Your Email</h3>
              <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '20px' }}>
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <button
                onClick={() => { setMode('login'); setResetSent(false); }}
                style={{ padding: '12px 24px', background: 'none', border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px', boxShadow: DS.shadow }}>
              <form onSubmit={mode === 'login' ? handleSubmit : handleResetPassword}>
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

                {mode === 'login' && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: DS.textSecondary }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMode('forgot'); setError(''); }}
                        style={{ fontSize: '12px', color: DS.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: DS.bodyFont }}
                      >
                        Forgot password?
                      </button>
                    </div>
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
                )}

                {(error || resetError) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#FEF2F2', borderRadius: '8px', color: '#DC2626', fontSize: '14px', marginBottom: '20px', fontFamily: DS.bodyFont }}>
                    <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                    {error || resetError}
                  </div>
                )}

                <div style={{ marginBottom: mode === 'login' ? '16px' : '20px' }} />

                <button
                  type="submit"
                  disabled={loading || resetLoading}
                  className="cta-glow"
                  style={{
                    width: '100%', padding: '14px',
                    background: DS.accent, color: '#FFFFFF',
                    border: 'none', borderRadius: '8px',
                    fontSize: '15px', fontWeight: 600,
                    cursor: (loading || resetLoading) ? 'not-allowed' : 'pointer',
                    opacity: (loading || resetLoading) ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    minHeight: '48px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {loading || resetLoading ? (
                    <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />{mode === 'login' ? 'Signing in...' : 'Sending...'}</>
                  ) : mode === 'login' ? (
                    <><span>Sign In</span><ArrowRight style={{ width: 18, height: 18 }} /></>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {mode === 'forgot' && (
                <button
                  onClick={() => { setMode('login'); setResetError(''); }}
                  style={{ width: '100%', padding: '12px', background: 'none', border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.textSecondary, fontSize: '14px', cursor: 'pointer', marginTop: '12px', fontFamily: DS.bodyFont }}
                >
                  Back to Sign In
                </button>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {mode === 'login' && (
              <p style={{ fontSize: '13px', color: DS.muted }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: DS.accent, textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
              </p>
            )}
          </div>
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
