import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { MinimalFooter } from '@/components/MinimalFooter';

import { COLORS, TYPOGRAPHY, RADII, SHADOWS } from '@/styles/tokens';

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMouseEnter = useCallback(() => {
    import('../components/dashboard/ConsultantDashboard');
    import('../components/layout/AppLayout');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
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
      // Redirect to /dashboard which routes users to their role-appropriate portal
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${COLORS.border}` }}>
        <Link to="/" style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '18px', fontWeight: 700, color: COLORS.text, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          LYC Intelligence
        </Link>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '13px', color: COLORS.textMuted, textDecoration: 'none', fontFamily: TYPOGRAPHY.fontFamily.sans }}>Back to site</Link>
        </div>
      </nav>

      {/* Login Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', flex: 1 }}>
        <div style={{ maxWidth: '420px', width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '56px', height: '56px', background: `${COLORS.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Shield style={{ width: 28, height: 28, color: COLORS.primary }} />
            </div>
            <h1 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '32px', fontWeight: 700, color: COLORS.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Platform Access
            </h1>
            <p style={{ fontSize: '14px', color: COLORS.textMuted, lineHeight: 1.6, fontFamily: TYPOGRAPHY.fontFamily.sans }}>
              Leadership Intelligence Platform
            </p>
          </div>

          <div style={{ background: COLORS.white, padding: '36px', boxShadow: SHADOWS.sm }}>
            <form onSubmit={handleSubmit} onMouseEnter={handleMouseEnter}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: TYPOGRAPHY.fontFamily.sans }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: COLORS.textMuted }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    style={{
                      width: '100%', padding: '14px 16px 14px 44px',
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                      color: COLORS.text, fontSize: '15px', outline: 'none', minHeight: '48px',
                      fontFamily: TYPOGRAPHY.fontFamily.sans, transition: 'all 0.2s ease',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: COLORS.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: TYPOGRAPHY.fontFamily.sans }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: COLORS.textMuted }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      width: '100%', padding: '14px 16px 14px 44px',
                      background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                      color: COLORS.text, fontSize: '15px', outline: 'none', minHeight: '48px',
                      fontFamily: TYPOGRAPHY.fontFamily.sans, transition: 'all 0.2s ease',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: 'rgba(192,57,43,0.04)', borderLeft: '2px solid #C0392B', color: '#C0392B', fontSize: '13px', marginBottom: '24px', fontFamily: TYPOGRAPHY.fontFamily.sans }}>
                  <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="cta-glow"
                style={{
                  width: '100%', padding: '16px',
                  background: COLORS.primary, color: '#FFFFFF',
                  border: 'none',
                  fontSize: '15px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  minHeight: '52px', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  fontFamily: TYPOGRAPHY.fontFamily.sans, letterSpacing: '0.01em',
                }}
              >
                {loading ? (
                  <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Signing in...</>
                ) : (
                  <>Sign In <ArrowRight style={{ width: 18, height: 18 }} /></>
                )}
              </button>
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <Link to="/reset-password" style={{ fontSize: '13px', color: COLORS.textMuted, textDecoration: 'none', fontFamily: TYPOGRAPHY.fontFamily.sans }}>
                    Forgot password?
                  </Link>
                  <span style={{ fontSize: '13px', color: COLORS.border }}>·</span>
                  <Link to="/signup" style={{ fontSize: '13px', color: COLORS.primary, textDecoration: 'none', fontFamily: TYPOGRAPHY.fontFamily.sans, fontWeight: 600 }}>
                    Create account
                  </Link>
                </div>
              </div>
            </form>
          </div>

          <p style={{ fontSize: '12px', color: COLORS.textMuted, textAlign: 'center', marginTop: '24px', lineHeight: 1.5, fontFamily: TYPOGRAPHY.fontFamily.sans }}>
            Sign in to access the LYC Intelligence platform.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: ${COLORS.primary} !important; box-shadow: 0 0 0 3px rgba(193,8,171,0.06) !important; }
        input::placeholder { color: #D4D4D4; }
      `}</style>
      <MinimalFooter />
    </div>
  );
}
