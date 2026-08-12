/**
 * #1326 — Progressive profiling modal.
 *
 * Shown post-assessment to collect title + company — lightly, non-intrusively,
 * dismissible. Premium tone: "To personalize your results and recommendations…"
 *
 * Persists the captured fields to the profile via the auth store, and remembers
 * a dismissal in localStorage so we don't nag on every assessment.
 *
 * Brand rules: zero border radius, Crimson Pro headings, DM Sans body,
 * IBM Plex Mono labels, single accent #C108AB, 200ms transitions.
 */
import React, { useEffect, useState } from 'react';
import { X, Briefcase, Building2, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export interface ProgressiveProfileModalProps {
  /** Control visibility externally. When omitted, the modal self-gates on
   *  profile gaps + a dismissal flag in localStorage. */
  open?: boolean;
  /** Assessment code/name just completed — used in the copy. */
  assessmentName?: string;
  /** Called after a successful save. */
  onComplete?: (data: { title: string; company: string }) => void;
  /** Called when the user dismisses the modal. */
  onDismiss?: () => void;
}

const DISMISS_KEY = 'lyc.progressive_profile.dismissed';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

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
};

const TRANSITION = '200ms cubic-bezier(0.4, 0, 0.2, 1)';

function isDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function ProgressiveProfileModal({
  open,
  assessmentName,
  onComplete,
  onDismiss,
}: ProgressiveProfileModalProps) {
  const { profile, updateProfile } = useAuthStore();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  // Self-gating: open when profile is missing both title & company AND not
  // recently dismissed. External `open` prop takes precedence.
  useEffect(() => {
    if (open !== undefined) {
      setInternalOpen(open);
      return;
    }
    if (!profile) return;
    const hasTitle = Boolean((profile as any).current_title || (profile as any).title);
    const hasCompany = Boolean((profile as any).company);
    if (hasTitle && hasCompany) return;
    if (isDismissed()) return;
    // Small delay so it doesn't fight with the results page first paint.
    const t = window.setTimeout(() => setInternalOpen(true), 800);
    return () => window.clearTimeout(t);
  }, [open, profile]);

  // Pre-fill from profile if available.
  useEffect(() => {
    if (profile) {
      setTitle((profile as any).current_title || (profile as any).title || '');
      setCompany((profile as any).company || '');
    }
  }, [profile]);

  const handleClose = () => {
    setInternalOpen(false);
    markDismissed();
    onDismiss?.();
  };

  const handleSave = async () => {
    setSaving(true);
    // Persist whatever was provided. The auth store strips privileged columns.
    const updates: Record<string, string> = {};
    if (title.trim()) updates.current_title = title.trim();
    if (company.trim()) updates.company = company.trim();
    if (Object.keys(updates).length === 0) {
      setSaving(false);
      setDone(true);
      return;
    }
    const res = await updateProfile(updates as any);
    setSaving(false);
    if (res.success) {
      setDone(true);
      onComplete?.({ title: title.trim(), company: company.trim() });
    }
  };

  if (!internalOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px 12px 42px',
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personalize your results"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(10,10,18,0.55)',
        animation: `ppFade 200ms cubic-bezier(0.4, 0, 0.2, 1) both`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) handleClose();
      }}
    >
      <style>{`@keyframes ppFade { from { opacity: 0; } to { opacity: 1; } }`}</style>

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          border: `1px solid ${DS.border}`,
          boxShadow: '0 24px 60px rgba(10,10,18,0.18)',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'relative',
            padding: '24px 28px 20px 28px',
            borderBottom: `1px solid ${DS.border}`,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Dismiss"
            disabled={saving}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              color: DS.muted,
              padding: '4px',
              opacity: saving ? 0.4 : 1,
              transition: `color ${TRANSITION}`,
            }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.color = DS.ink;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = DS.muted;
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: DS.monoFont,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: DS.accent,
              marginBottom: '10px',
            }}
          >
            <Sparkles size={12} /> One quick thing
          </div>

          {done ? (
            <h2
              style={{
                margin: 0,
                fontFamily: DS.headingFont,
                fontSize: '22px',
                fontWeight: 700,
                color: DS.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              All set.
            </h2>
          ) : (
            <h2
              style={{
                margin: 0,
                fontFamily: DS.headingFont,
                fontSize: '22px',
                fontWeight: 700,
                color: DS.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              To personalize your results and recommendations…
            </h2>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '8px 0 4px 0' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 16px auto',
                  background: `${DS.success}12`,
                  border: `1px solid ${DS.success}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={24} style={{ color: DS.success }} />
              </div>
              <p
                style={{
                  margin: '0 0 20px 0',
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  color: DS.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                Your recommendations will be sharper for it.
                {assessmentName ? ` Continue exploring your ${assessmentName} results.` : ''}
              </p>
              <button
                type="button"
                onClick={handleClose}
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
                Continue <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <p
                style={{
                  margin: '0 0 18px 0',
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  color: DS.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {assessmentName
                  ? `Now that you\u2019ve completed ${assessmentName}, a couple of details will let us tailor your benchmarks, peer comparisons, and next-step recommendations to your context.`
                  : 'A couple of details will let us tailor your benchmarks, peer comparisons, and next-step recommendations to your context.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Your title</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: DS.muted,
                      }}
                    />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. VP of Engineering"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = DS.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = DS.border)}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Company</label>
                  <div style={{ position: 'relative' }}>
                    <Building2
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: DS.muted,
                      }}
                    />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Holdings"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = DS.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = DS.border)}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginTop: '22px',
                }}
              >
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: DS.muted,
                    fontFamily: DS.bodyFont,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    padding: '8px 4px',
                    transition: `color ${TRANSITION}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.color = DS.ink;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = DS.muted;
                  }}
                >
                  Maybe later
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
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
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                    minHeight: '44px',
                    transition: `background-color ${TRANSITION}, opacity ${TRANSITION}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.background = DS.accentHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = DS.accent;
                  }}
                >
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  ) : (
                    <>Save <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressiveProfileModal;
