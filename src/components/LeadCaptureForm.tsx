import React, { useState } from 'react';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface LeadCaptureFormProps {
  type: 'b2b' | 'b2c';
  source: string;
  onSuccess?: (email: string) => void;
  redirectTo?: string;
  heading?: string;
  subheading?: string;
  successMessage?: string;
}

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0a0a0a',
  card: '#1a1a1a',
  cardHover: '#222222',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#333333',
  radius: '12px',
  success: '#22C55E',
  error: '#EF4444',
};

export function LeadCaptureForm({ 
  type,
  source,
  onSuccess,
  redirectTo,
  heading,
  subheading,
  successMessage
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    work_email: type === 'b2b' ? '' : undefined,
    company: type === 'b2b' ? '' : undefined,
    title: undefined as string | undefined,
    current_title: undefined as string | undefined,
    country: undefined as string | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    const emailField = type === 'b2b' ? formData.work_email : formData.email;
    if (!emailField || !validateEmail(emailField)) {
      setError('Please enter a valid email address');
      return;
    }

    if (type === 'b2b' && !formData.company?.trim()) {
      setError('Please enter your company name');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: formData.name,
          email: formData.email,
          work_email: formData.work_email,
          company: formData.company,
          title: formData.title,
          current_title: formData.current_title,
          country: formData.country,
          source
        })
      });

      if (!res.ok) throw new Error('API failed');

      const submittedEmail = type === 'b2b' ? (formData.work_email || '') : (formData.email || '');
      
      if (onSuccess) {
        onSuccess(submittedEmail);
      } else if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        if (type === 'b2b') {
          window.location.href = `/match?email=${encodeURIComponent(submittedEmail)}`;
        } else {
          window.location.href = `/assessment?email=${encodeURIComponent(submittedEmail)}`;
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error('Lead capture error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        borderRadius: DS.radius,
        padding: '32px',
        textAlign: 'center',
      }}>
        <CheckCircle2 style={{ width: 48, height: 48, color: DS.success, margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
          {successMessage || (type === 'b2b' ? 'Demo Scheduled!' : 'Assessment Started!')}
        </h3>
        <p style={{ fontSize: '14px', color: DS.muted, margin: 0 }}>
          {type === 'b2b'
            ? 'Our team will reach out within 24 hours.'
            : 'Check your email for next steps.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: DS.radius,
      padding: '32px',
    }}>
      <h3 style={{
        fontFamily: DS.headingFont,
        fontSize: '20px',
        fontWeight: 600,
        color: DS.text,
        margin: '0 0 8px',
        textAlign: 'center',
      }}>
        {heading || (type === 'b2b' ? 'Schedule Your Demo' : 'Start Your Free Assessment')}
      </h3>
      <p style={{
        fontSize: '14px',
        color: DS.muted,
        margin: '0 0 24px',
        textAlign: 'center',
      }}>
        {subheading || (type === 'b2b'
          ? 'Get 3 free TRIDENT matches when you book a demo'
          : 'Get your personalized leadership archetype in 10 minutes')}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <input
            type="text"
            placeholder="Full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '14px',
              outline: 'none',
              minHeight: '44px',
            }}
          />
        </div>

        <div>
          <input
            type="email"
            placeholder={type === 'b2b' ? 'Work email' : 'Email address'}
            value={type === 'b2b' ? (formData.work_email || '') : (formData.email || '')}
            onChange={(e) => setFormData({
              ...formData,
              [type === 'b2b' ? 'work_email' : 'email']: e.target.value
            })}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: DS.bg,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '14px',
              outline: 'none',
              minHeight: '44px',
            }}
          />
        </div>

        {type === 'b2b' && (
          <>
            <div>
              <input
                type="text"
                placeholder="Company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: DS.bg,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                  color: DS.text,
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Job title (optional)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: DS.bg,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                  color: DS.text,
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
            </div>
          </>
        )}

        {type === 'b2c' && (
          <>
            <div>
              <input
                type="text"
                placeholder="Current title (optional)"
                value={formData.current_title}
                onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: DS.bg,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                  color: DS.text,
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Country (optional)"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: DS.bg,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                  color: DS.text,
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
            </div>
          </>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: `${DS.error}15`,
            borderRadius: '8px',
            color: DS.error,
            fontSize: '13px',
          }}>
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
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
            minHeight: '44px',
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              {type === 'b2b' ? 'Scheduling...' : 'Starting...'}
            </>
          ) : (
            <>
              {type === 'b2b' ? 'Book Demo' : 'Start Assessment'}
              <ArrowRight style={{ width: 16, height: 16 }} />
            </>
          )}
        </button>

        <p style={{
          fontSize: '11px',
          color: DS.muted,
          textAlign: 'center',
          margin: 0,
        }}>
          {type === 'b2b'
            ? 'No credit card required. Free consultation included.'
            : 'Free assessment. No credit card required.'}
        </p>
      </form>

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
