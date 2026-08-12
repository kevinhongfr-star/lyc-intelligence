/**
 * #1325 — QuickAssignAssessment modal.
 *
 * Simplified assignment flow for consultants: 3 steps, ideally ≤3 clicks from
 * dashboard to sent.
 *   Step 1 — Select assessment
 *   Step 2 — Enter candidate name + email
 *   Step 3 — Review + send (renders a branded invite preview)
 *
 * Uses the branded invite email template. Brand rules: zero border radius,
 * Crimson Pro headings, DM Sans body, IBM Plex Mono labels, single accent
 * #C108AB, 200ms transitions, cubic-bezier(0.4,0,0.2,1).
 */
import React, { useMemo, useState } from 'react';
import {
  X, ArrowRight, ArrowLeft, Check, Loader2, Mail, AlertCircle,
  ClipboardCheck, Send,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import {
  generateAssessmentInviteHTML,
} from '@/services/inviteEmailTemplate';

export interface QuickAssignAssessmentProps {
  open: boolean;
  onClose: () => void;
  onSent?: (payload: SentInvitePayload) => void;
}

export interface SentInvitePayload {
  assessmentCode: string;
  candidateName: string;
  candidateEmail: string;
}

interface AssessmentOption {
  code: string;
  name: string;
  blurb: string;
}

/** Curated subset of the 11-instrument catalog with consultant-friendly blurbs. */
const ASSESSMENTS: AssessmentOption[] = [
  { code: 'CPI', name: 'CPI', blurb: 'Career Positioning Index — flagship leadership profile.' },
  { code: 'SHIFT', name: 'SHIFT', blurb: 'Leadership transition readiness across six dimensions.' },
  { code: 'PRISM', name: 'PRISM', blurb: 'Behavioral and cognitive style mapping for execs.' },
  { code: 'SPARK', name: 'SPARK', blurb: 'Motivation and drivers assessment.' },
  { code: 'LEAP', name: 'LEAP', blurb: 'Leadership effectiveness and potential.' },
  { code: 'QUEST', name: 'QUEST', blurb: 'Strategic decision-making profile.' },
  { code: 'IMPACT', name: 'IMPACT', blurb: 'Board readiness and governance impact.' },
  { code: 'FORGE', name: 'FORGE', blurb: 'Operating rhythm and execution capability.' },
  { code: 'DRIVE', name: 'DRIVE', blurb: 'Ambition, pace, and achievement orientation.' },
  { code: 'COACH', name: 'COACH', blurb: 'Coaching receptivity and development areas.' },
  { code: 'BRIDGE', name: 'BRIDGE', blurb: 'Stakeholder and relationship bridge-building.' },
  { code: 'MOSAIC', name: 'MOSAIC', blurb: 'Composite leadership identity across contexts.' },
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
  error: '#B91C1C',
  success: '#1A7A4A',
  radius: '0px',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TRANSITION = '200ms cubic-bezier(0.4, 0, 0.2, 1)';

export function QuickAssignAssessment({
  open,
  onClose,
  onSent,
}: QuickAssignAssessmentProps) {
  const { profile } = useAuthStore();
  const consultantName = profile?.name || 'Your LYC advisor';

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [assessmentCode, setAssessmentCode] = useState<string>('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [selectionReason, setSelectionReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selected = useMemo(
    () => ASSESSMENTS.find((a) => a.code === assessmentCode) || null,
    [assessmentCode],
  );

  // Reset state when the modal is closed/reopened.
  React.useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        setStep(1);
        setAssessmentCode('');
        setCandidateName('');
        setCandidateEmail('');
        setSelectionReason('');
        setSending(false);
        setError(null);
        setDone(false);
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const canAdvanceStep1 = !!assessmentCode;
  const canAdvanceStep2 =
    candidateName.trim().length > 0 && EMAIL_RE.test(candidateEmail.trim());

  const ctaUrl = `${window.location.origin}/assessment/${(assessmentCode || '').toLowerCase()}`;

  const inviteHtml = useMemo(() => {
    if (step !== 3 || !selected) return '';
    return generateAssessmentInviteHTML({
      consultantName,
      assessmentName: selected.name,
      candidateName,
      assessmentValue: selected.blurb,
      selectionReason:
        selectionReason.trim() ||
        'Your background stood out to us as a strong fit for the kind of leader this instrument is designed to serve.',
      ctaUrl,
      assessmentCode: selected.code,
    });
  }, [step, selected, consultantName, candidateName, selectionReason, ctaUrl]);

  const handleSend = async () => {
    if (!selected) return;
    setError(null);
    setSending(true);
    try {
      const res = await authFetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assessment_invite',
          to: candidateEmail.trim(),
          subject: `${consultantName} has invited you to ${selected.name}`,
          html: inviteHtml,
          data: {
            consultantName,
            assessmentCode: selected.code,
            assessmentName: selected.name,
            candidateName: candidateName.trim(),
            candidateEmail: candidateEmail.trim(),
            ctaUrl,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to send invite (${res.status})`);
      }

      setDone(true);
      onSent?.({
        assessmentCode: selected.code,
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim(),
      });
    } catch (e: any) {
      setError(e.message || 'Failed to send invite. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const close = () => {
    if (sending) return;
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Assign assessment"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(10,10,18,0.55)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          border: `1px solid ${DS.border}`,
          boxShadow: '0 24px 60px rgba(10,10,18,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${DS.border}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: DS.accent,
                marginBottom: '6px',
              }}
            >
              Quick Assign
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: DS.headingFont,
                fontSize: '22px',
                fontWeight: 700,
                color: DS.ink,
                letterSpacing: '-0.01em',
              }}
            >
              Assign an assessment
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            disabled={sending}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: sending ? 'not-allowed' : 'pointer',
              color: DS.muted,
              padding: '6px',
              opacity: sending ? 0.4 : 1,
              transition: `color ${TRANSITION}`,
            }}
            onMouseEnter={(e) => {
              if (!sending) e.currentTarget.style.color = DS.ink;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = DS.muted;
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        {!done && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 24px',
              borderBottom: `1px solid ${DS.border}`,
              background: DS.bgAlt,
            }}
          >
            {[1, 2, 3].map((s) => {
              const active = step === s;
              const complete = step > s;
              return (
                <React.Fragment key={s}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: DS.monoFont,
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: active || complete ? DS.accent : DS.muted,
                      transition: `color ${TRANSITION}`,
                    }}
                  >
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: complete ? DS.accent : active ? '#FFFFFF' : DS.bgAlt,
                        border: `1px solid ${complete || active ? DS.accent : DS.border}`,
                        color: complete ? '#FFFFFF' : active ? DS.accent : DS.muted,
                        transition: `all ${TRANSITION}`,
                      }}
                    >
                      {complete ? <Check size={12} /> : s}
                    </span>
                    {s === 1 ? 'Select' : s === 2 ? 'Candidate' : 'Review'}
                  </div>
                  {s < 3 && (
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        background: step > s ? DS.accent : DS.border,
                        transition: `background-color ${TRANSITION}`,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {done ? (
            <SentConfirmation
              assessmentName={selected?.name || ''}
              candidateName={candidateName}
              candidateEmail={candidateEmail}
              onClose={close}
            />
          ) : step === 1 ? (
            <StepSelect
              assessments={ASSESSMENTS}
              selectedCode={assessmentCode}
              onSelect={(code) => setAssessmentCode(code)}
            />
          ) : step === 2 ? (
            <StepCandidate
              candidateName={candidateName}
              candidateEmail={candidateEmail}
              selectionReason={selectionReason}
              onName={setCandidateName}
              onEmail={setCandidateEmail}
              onReason={setSelectionReason}
            />
          ) : (
            <StepReview
              consultantName={consultantName}
              assessment={selected}
              candidateName={candidateName}
              candidateEmail={candidateEmail}
              selectionReason={selectionReason}
              ctaUrl={ctaUrl}
            />
          )}

          {error && step !== 3 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
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
        </div>

        {/* Footer actions */}
        {!done && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '16px 24px',
              borderTop: `1px solid ${DS.border}`,
              background: DS.bgAlt,
            }}
          >
            <button
              type="button"
              onClick={step === 1 ? close : () => setStep((s) => (s - 1) as 1 | 2 | 3)}
              disabled={sending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid transparent',
                color: DS.muted,
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                fontWeight: 600,
                cursor: sending ? 'not-allowed' : 'pointer',
                transition: `color ${TRANSITION}`,
              }}
              onMouseEnter={(e) => {
                if (!sending) e.currentTarget.style.color = DS.ink;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = DS.muted;
              }}
            >
              {step === 1 ? 'Cancel' : <><ArrowLeft size={14} /> Back</>}
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                disabled={
                  (step === 1 && !canAdvanceStep1) ||
                  (step === 2 && !canAdvanceStep2)
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  background: DS.accent,
                  border: 'none',
                  color: '#FFFFFF',
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor:
                    (step === 1 && !canAdvanceStep1) ||
                    (step === 2 && !canAdvanceStep2) ||
                    sending
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    (step === 1 && !canAdvanceStep1) ||
                    (step === 2 && !canAdvanceStep2)
                      ? 0.4
                      : 1,
                  transition: `background-color ${TRANSITION}, opacity ${TRANSITION}`,
                }}
                onMouseEnter={(e) => {
                  const ok =
                    !((step === 1 && !canAdvanceStep1) || (step === 2 && !canAdvanceStep2));
                  if (ok) e.currentTarget.style.background = DS.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = DS.accent;
                }}
              >
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  background: DS.accent,
                  border: 'none',
                  color: '#FFFFFF',
                  fontFamily: DS.bodyFont,
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.7 : 1,
                  transition: `background-color ${TRANSITION}, opacity ${TRANSITION}`,
                }}
                onMouseEnter={(e) => {
                  if (!sending) e.currentTarget.style.background = DS.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = DS.accent;
                }}
              >
                {sending ? (
                  <><Loader2 size={14} className="animate-spin" /> Sending…</>
                ) : (
                  <><Send size={14} /> Send invite</>
                )}
              </button>
            )}
          </div>
        )}

        {error && step === 3 && !done && !sending && (
          <div
            style={{
              margin: '0 24px 20px 24px',
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
      </div>
    </div>
  );
}

/* ── Step 1: Select assessment ─────────────────────────────────────── */
function StepSelect({
  assessments,
  selectedCode,
  onSelect,
}: {
  assessments: AssessmentOption[];
  selectedCode: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div>
      <p
        style={{
          margin: '0 0 16px 0',
          fontFamily: DS.bodyFont,
          fontSize: '14px',
          color: DS.textSecondary,
          lineHeight: 1.6,
        }}
      >
        Choose the instrument to send. The candidate will receive a branded
        invitation they can accept in one click.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}
      >
        {assessments.map((a) => {
          const active = a.code === selectedCode;
          return (
            <button
              key={a.code}
              type="button"
              onClick={() => onSelect(a.code)}
              style={{
                textAlign: 'left',
                padding: '14px',
                background: active ? '#FFFFFF' : DS.bgAlt,
                border: `1px solid ${active ? DS.accent : DS.border}`,
                cursor: 'pointer',
                transition: `border-color ${TRANSITION}, background-color ${TRANSITION}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = DS.accent;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = DS.border;
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: DS.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {a.name}
                </span>
                {active && (
                  <Check size={14} style={{ color: DS.accent }} />
                )}
              </div>
              <span
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  color: DS.muted,
                  lineHeight: 1.5,
                }}
              >
                {a.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step 2: Candidate details ─────────────────────────────────────── */
function StepCandidate({
  candidateName,
  candidateEmail,
  selectionReason,
  onName,
  onEmail,
  onReason,
}: {
  candidateName: string;
  candidateEmail: string;
  selectionReason: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onReason: (v: string) => void;
}) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p
        style={{
          margin: 0,
          fontFamily: DS.bodyFont,
          fontSize: '14px',
          color: DS.textSecondary,
          lineHeight: 1.6,
        }}
      >
        Who should we send it to? We&rsquo;ll personalize the invitation with
        their name and your message.
      </p>

      <div>
        <label
          style={{
            display: 'block',
            fontFamily: DS.monoFont,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: DS.muted,
            marginBottom: '6px',
          }}
        >
          Candidate name
        </label>
        <input
          type="text"
          value={candidateName}
          onChange={(e) => onName(e.target.value)}
          placeholder="Full name"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = DS.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = DS.border)}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontFamily: DS.monoFont,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: DS.muted,
            marginBottom: '6px',
          }}
        >
          Candidate email
        </label>
        <input
          type="email"
          value={candidateEmail}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="name@company.com"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = DS.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = DS.border)}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontFamily: DS.monoFont,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: DS.muted,
            marginBottom: '6px',
          }}
        >
          Why you selected them <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </label>
        <textarea
          value={selectionReason}
          onChange={(e) => onReason(e.target.value)}
          placeholder="e.g. Your CFO track record and APAC expansion experience stood out."
          rows={3}
          style={{
            ...inputStyle,
            minHeight: '80px',
            resize: 'vertical',
            padding: '12px 14px',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = DS.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = DS.border)}
        />
      </div>
    </div>
  );
}

/* ── Step 3: Review + send ─────────────────────────────────────────── */
function StepReview({
  consultantName,
  assessment,
  candidateName,
  candidateEmail,
  selectionReason,
  ctaUrl,
}: {
  consultantName: string;
  assessment: AssessmentOption | null;
  candidateName: string;
  candidateEmail: string;
  selectionReason: string;
  ctaUrl: string;
}) {
  if (!assessment) return null;

  const rows: { label: string; value: string }[] = [
    { label: 'Assessment', value: `${assessment.name} — ${assessment.blurb}` },
    { label: 'From', value: consultantName },
    { label: 'To', value: `${candidateName} <${candidateEmail}>` },
    { label: 'Landing URL', value: ctaUrl },
  ];

  const reason = selectionReason.trim()
    ? selectionReason.trim()
    : 'Your background stood out to us as a strong fit for the kind of leader this instrument is designed to serve.';

  return (
    <div>
      <p
        style={{
          margin: '0 0 16px 0',
          fontFamily: DS.bodyFont,
          fontSize: '14px',
          color: DS.textSecondary,
          lineHeight: 1.6,
        }}
      >
        Review the invitation before it goes out. The candidate will receive a
        branded HTML email with a one-click CTA.
      </p>

      <div
        style={{
          border: `1px solid ${DS.border}`,
          background: DS.bgAlt,
        }}
      >
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: i < rows.length - 1 ? `1px solid ${DS.border}` : 'none',
            }}
          >
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: DS.muted,
                paddingTop: '2px',
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                color: DS.ink,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px' }}>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: DS.accent,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Mail size={12} /> Invite preview
        </div>
        <div
          style={{
            border: `1px solid ${DS.border}`,
            background: '#FFFFFF',
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: DS.accent,
              marginBottom: '8px',
            }}
          >
            {assessment.code}
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontFamily: DS.headingFont,
              fontSize: '20px',
              fontWeight: 700,
              color: DS.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            A complimentary assessment, selected for you.
          </h3>
          <p
            style={{
              margin: '0 0 8px 0',
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              color: DS.textSecondary,
              lineHeight: 1.55,
            }}
          >
            Dear {candidateName}, I&rsquo;m {consultantName}, and I work with
            executive leaders at LYC Intelligence. I&rsquo;d like to extend a
            complimentary invitation to complete{' '}
            <strong style={{ color: DS.ink, fontWeight: 600 }}>
              {assessment.name}
            </strong>
            .
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              color: DS.muted,
              lineHeight: 1.55,
            }}
          >
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Sent confirmation ─────────────────────────────────────────────── */
function SentConfirmation({
  assessmentName,
  candidateName,
  candidateEmail,
  onClose,
}: {
  assessmentName: string;
  candidateName: string;
  candidateEmail: string;
  onClose: () => void;
}) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 8px 8px 8px' }}>
      <div
        style={{
          width: '52px',
          height: '52px',
          margin: '0 auto 16px auto',
          background: '#FFFFFF',
          border: `1px solid ${DS.success}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ClipboardCheck size={24} style={{ color: DS.success }} />
      </div>
      <h3
        style={{
          margin: '0 0 6px 0',
          fontFamily: DS.headingFont,
          fontSize: '22px',
          fontWeight: 700,
          color: DS.ink,
          letterSpacing: '-0.01em',
        }}
      >
        Invitation sent
      </h3>
      <p
        style={{
          margin: '0 0 4px 0',
          fontFamily: DS.bodyFont,
          fontSize: '14px',
          color: DS.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {assessmentName} invite is on its way to{' '}
        <strong style={{ color: DS.ink, fontWeight: 600 }}>
          {candidateName}
        </strong>{' '}
        at{' '}
        <span style={{ fontFamily: DS.monoFont, fontSize: '13px' }}>
          {candidateEmail}
        </span>
        .
      </p>
      <p
        style={{
          margin: '0 0 20px 0',
          fontFamily: DS.bodyFont,
          fontSize: '12px',
          color: DS.muted,
          lineHeight: 1.6,
        }}
      >
        You&rsquo;ll see activity in your pipeline when they accept.
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 22px',
          background: DS.ink,
          border: 'none',
          color: '#FFFFFF',
          fontFamily: DS.bodyFont,
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: `background-color ${TRANSITION}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a27')}
        onMouseLeave={(e) => (e.currentTarget.style.background = DS.ink)}
      >
        Done
      </button>
    </div>
  );
}

export default QuickAssignAssessment;
