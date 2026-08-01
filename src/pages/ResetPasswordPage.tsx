import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

import { COLORS, TYPOGRAPHY, RADII } from '@/styles/tokens';

const CUSTOM_DS = {
  bodyFont: "'DM Sans', system-ui, sans-serif",
  bg: '#FFFFFF',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
};

export function ResetPasswordPage() {
  const { supabase } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !supabase) return;

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: CUSTOM_DS.bg }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${COLORS.border}` }}>
        <Link to="/" style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '18px', fontWeight: 700, color: CUSTOM_DS.text, textDecoration: 'none' }}>
          LYC Intelligence
        </Link>
        <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: CUSTOM_DS.muted, textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to login
        </Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '24px', fontWeight: 600, color: CUSTOM_DS.text, margin: '0 0 8px' }}>
              Reset Password
            </h1>
            <p style={{ fontSize: '14px', color: CUSTOM_DS.muted, lineHeight: 1.6 }}>
              {sent ? 'Check your email for the reset link' : 'Enter your email to receive a password reset link'}
            </p>
          </div>

          {sent ? (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: `${RADII.lg}px`, padding: '32px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 48, height: 48, color: '#16A34A', margin: '0 auto 16px' }} />
              <p style={{ fontSize: '15px', color: '#166534', fontFamily: CUSTOM_DS.bodyFont }}>
                If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
              </p>
              <Link to="/login" style={{ display: 'inline-block', marginTop: '20px', color: COLORS.primary, fontSize: '14px', fontFamily: CUSTOM_DS.bodyFont }}>
                Return to login
              </Link>
            </div>
          ) : (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: `${RADII.lg}px`, padding: '32px' }}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: CUSTOM_DS.textSecondary, marginBottom: '8px' }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: CUSTOM_DS.muted }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      style={{
                        width: '100%', padding: '12px 16px 12px 44px',
                        background: CUSTOM_DS.bg, border: `1px solid ${COLORS.border}`, borderRadius: '0px',
                        color: CUSTOM_DS.text, fontSize: '15px', outline: 'none', minHeight: '44px',
                        fontFamily: CUSTOM_DS.bodyFont,
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ padding: '12px 16px', background: '#FEF2F2', borderRadius: '0px', color: '#DC2626', fontSize: '14px', marginBottom: '20px', fontFamily: CUSTOM_DS.bodyFont }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: COLORS.primary, color: '#FFFFFF',
                    border: 'none', borderRadius: '0px',
                    fontSize: '15px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    minHeight: '48px', fontFamily: CUSTOM_DS.bodyFont,
                  }}
                >
                  {loading ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Sending...</> : 'Send Reset Link'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: ${COLORS.primary} !important; box-shadow: 0 0 0 2px rgba(193,8,171,0.2) !important; }
      `}</style>
    </div>
  );
}
