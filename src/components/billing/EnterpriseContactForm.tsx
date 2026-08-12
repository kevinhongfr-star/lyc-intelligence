/**
 * #1326 — Enterprise contact form (human, not NEXUS bot).
 *
 * Reached from the Pricing page "Talk to sales" / "Request a demo" CTA on the
 * Enterprise/Team tier. Submits to the contacts API so a human (sales) picks
 * it up — this is deliberately NOT routed into NEXUS.
 *
 * Brand rules: zero border radius, Crimson Pro headings, DM Sans body,
 * IBM Plex Mono labels, single accent #C108AB, 200ms transitions.
 */
import React, { useState } from 'react';
import {
  ArrowRight, Loader2, CheckCircle2, AlertCircle, X, Building2, Mail,
} from 'lucide-react';

export interface EnterpriseContactFormProps {
  /** Called after a successful submission. */
  onSuccess?: (payload: EnterpriseContactPayload) => void;
  /** Optional heading override. */
  heading?: string;
  /** Optional subheading override. */
  subheading?: string;
  /** Show the close (X) button — used when rendered in a modal. */
  dismissible?: boolean;
  onClose?: () => void;
}

export interface EnterpriseContactPayload {
  name: string;
  company: string;
  title: string;
  email: string;
  teamSize: string;
  message: string;
  source: string;
}

const TEAM_SIZE_OPTIONS = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '500+',
];

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', 'Courier New', monospace",
  accent: '#C108AB',
  accentHover: '#A00790',
  ink: '#0A0A12',
  textSecondary: '#2B2B3A',
  muted: '#616170',
  border: '#E9E7E1',
  bgAlt: '#F7F6F3',
  success: '#1A7A4A',
  error: '#B91C1C',
};

const TRANSITION = '200ms cubic-bezier(0.4, 0, 0.2, 1)';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EnterpriseContactForm({
  onSuccess,
  heading,
  subheading,
  dismissible,
  onClose,
}: EnterpriseContactFormProps) {
  const [form, setForm] = useState({
    name: '',
    company: '',
    title: '',
    email: '',
    teamSize: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!form.company.trim()) return 'Please enter your company name.';
    if (!form.title.trim()) return 'Please enter your title.';
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid work email.';
    if (!form.teamSize) return 'Please select a team size.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);

    const payload: EnterpriseContactPayload = {
      name: form.name.trim(),
      company: form.company.trim(),
      title: form.title.trim(),
      email: form.email.trim(),
      teamSize: form.teamSize,
      message: form.message.trim(),
      source: 'pricing_enterprise_talk_to_sales',
    };

    try {
      const res = await fetch('/api/data/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'enterprise',
          ...payload,
        }),
      });

      // Fall back to the lead-capture endpoint if the contacts endpoint
      // is unavailable — keeps the human-handoff guarantee intact.
      if (!res.ok) {
        const fallback = await fetch('/api/lead-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'b2b',
            name: payload.name,
            work_email: payload.email,
            company: payload.company,
            title: payload.title,
            team_size: payload.teamSize,
            message: payload.message,
            source: payload.source,
          }),
        });
        if (!fallback.ok) {
          throw new Error('Failed to submit. Please try again.');
        }
      }

      setDone(true);
      onSuccess?.(payload);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: DS.monoFont,
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: DS.muted,
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: '#FFFFFF',
    border: `1px solid ${DS.border}`,
    color: DS.ink,
    fontFamily: DS.bodyFont,
    fontSize: '14px',
    outline: 'none',
    minHeight: '44px',
    boxSizing: 'border-box',
    transition: `border-color ${TRANSITION}`,
  };

  const focusAccent = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = DS.accent);
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = DS.border);

  if (done) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          border: `1px solid ${DS.border}`,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: DS.muted,
            }}
          >
            <X size={18} />
          </button>
        )}
        <div
          style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 18px auto',
            background: `${DS.success}12`,
            border: `1px solid ${DS.success}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={26} style={{ color: DS.success }} />
        </div>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontFamily: DS.headingFont,
            fontSize: '22px',
            fontWeight: 700,
            color: DS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          Thank you — your request is in.
        </h3>
        <p
          style={{
            margin: '0 0 6px 0',
            fontFamily: DS.bodyFont,
            fontSize: '14px',
            color: DS.textSecondary,
            lineHeight: 1.6,
          }}
        >
          A member of our team will reach out to{' '}
          <strong style={{ color: DS.ink, fontWeight: 600 }}>{form.email}</strong> within one business day.
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: DS.monoFont,
            fontSize: '10px',
            color: DS.muted,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Human follow-up · Not a bot
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: `1px solid ${DS.border}`,
        padding: '32px',
      }}
    >
      {dismissible && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: DS.muted,
            transition: `color ${TRANSITION}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DS.ink)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DS.muted)}
        >
          <X size={18} />
        </button>
      )}

      <div
        style={{
          fontFamily: DS.monoFont,
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: DS.accent,
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Building2 size={12} /> For teams & enterprise
      </div>
      <h3
        style={{
          margin: '0 0 8px 0',
          fontFamily: DS.headingFont,
          fontSize: '24px',
          fontWeight: 700,
          color: DS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {heading || 'Talk to our team'}
      </h3>
      <p
        style={{
          margin: '0 0 24px 0',
          fontFamily: DS.bodyFont,
          fontSize: '14px',
          color: DS.textSecondary,
          lineHeight: 1.6,
          maxWidth: '460px',
        }}
      >
        {subheading ||
          'Tell us about your team and we\u2019ll design a deployment that fits — seats, SSO, custom framework training, and a dedicated point of contact. You\u2019ll hear from a human, not a bot.'}
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              style={inputStyle}
              onFocus={focusAccent}
              onBlur={blurBorder}
            />
          </div>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Head of Talent"
              autoComplete="organization-title"
              style={inputStyle}
              onFocus={focusAccent}
              onBlur={blurBorder}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Company</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => update('company', e.target.value)}
              placeholder="Company name"
              autoComplete="organization"
              style={inputStyle}
              onFocus={focusAccent}
              onBlur={blurBorder}
            />
          </div>
          <div>
            <label style={labelStyle}>Work email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              style={inputStyle}
              onFocus={focusAccent}
              onBlur={blurBorder}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Team size</label>
          <select
            value={form.teamSize}
            onChange={(e) => update('teamSize', e.target.value)}
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            onFocus={focusAccent}
            onBlur={blurBorder}
          >
            <option value="" disabled>
              Select team size
            </option>
            {TEAM_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Message <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </label>
          <textarea
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            placeholder="What are you trying to solve? (mandates, bench, hiring velocity…)"
            rows={3}
            style={{ ...inputStyle, minHeight: '84px', resize: 'vertical' }}
            onFocus={focusAccent}
            onBlur={blurBorder}
          />
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 14px',
              background: '#FEF2F2',
              color: DS.error,
              fontFamily: DS.bodyFont,
              fontSize: '13px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 22px',
            background: DS.accent,
            border: 'none',
            color: '#FFFFFF',
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            minHeight: '48px',
            transition: `background-color ${TRANSITION}, opacity ${TRANSITION}`,
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = DS.accentHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = DS.accent;
          }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Sending…</>
          ) : (
            <>Request a demo <ArrowRight size={15} /></>
          )}
        </button>

        <p
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: DS.monoFont,
            fontSize: '10px',
            color: DS.muted,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <Mail size={11} /> Human follow-up within one business day
        </p>
      </form>
    </div>
  );
}

export default EnterpriseContactForm;
