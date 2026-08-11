/**
 * #1326: EnterpriseSalesModal.tsx
 *
 * "Talk to sales" lead capture modal — shown on pricing page for Enterprise
 * (custom) and Council tiers, and from in-context capacity gates when a user
 * hits limits suitable for enterprise seat packages.
 *
 * Brand rules: zero radius, accent #C108AB, font trio, mono uppercase labels.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, Mail, Calendar, Send, Check, X, User, Briefcase,
  MessageSquare, Users, Sparkles,
} from 'lucide-react';
import {
  submitEnterpriseLead,
  regionFromLocale,
  type LeadSource,
  type CompanySize,
  type BuyingTimeline,
} from '@/services/leadEnrichmentService';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  ink: '#0A0A12',
  muted: '#616170',
  border: '#E5E5E5',
  off: '#FAFAF8',
};

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string; hint?: string }[] = [
  { value: '1-10', label: '1–10', hint: 'Early team' },
  { value: '11-50', label: '11–50', hint: 'Small enterprise' },
  { value: '51-250', label: '51–250', hint: 'Mid-market' },
  { value: '251-1000', label: '251–1,000', hint: 'Scaling' },
  { value: '1001-5000', label: '1,001–5,000', hint: 'Enterprise' },
  { value: '5001+', label: '5,000+', hint: 'Global enterprise' },
];

const TIMELINE_OPTIONS: { value: BuyingTimeline; label: string }[] = [
  { value: 'immediate', label: 'This week — in active evaluation' },
  { value: 'within_30_days', label: 'Within 30 days' },
  { value: 'within_90_days', label: 'Within 90 days' },
  { value: 'this_year', label: 'This fiscal / calendar year' },
  { value: 'just_researching', label: 'Just researching for now' },
];

const ARTIFACT_OPTIONS = [
  { value: 'custom_seat_plan', label: 'Custom seat plan + pricing' },
  { value: 'ssw', label: 'Security / SSO / data residency walkthrough' },
  { value: 'demo', label: 'Guided product demo' },
  { value: 'case_study', label: 'Peer case study from similar scope' },
  { value: 'procurement', label: 'Procurement + billing / MSCS / DPA' },
  { value: 'pilot', label: 'Pilot program scoping' },
];

const SOURCE_COPY: Record<LeadSource, { eyebrow: string; headline: string; lede: string }> = {
  pricing_enterprise: {
    eyebrow: 'Enterprise · Custom seat plan',
    headline: 'Tell us about the outcomes you need, and we will build a plan around them.',
    lede: 'For teams needing volume seat pricing, procurement workflows, SSO, or a custom miles economy — our partnerships team will send a tailored proposal within 1 business day.',
  },
  pricing_council: {
    eyebrow: 'Council Seat · Partnerships',
    headline: 'Join our most senior, invitation-only cohort of leaders.',
    lede: 'Council Seat is limited to 120 members globally per year. Share a bit about you and a partnerships lead will confirm availability, fit, and next steps.',
  },
  capacity_consultant_invites: {
    eyebrow: 'Capacity gate · Invite quota',
    headline: 'Your monthly invite quota is nearly full — let us unlock more seats.',
    lede: 'Share your team or client footprint and we will help you pick the right seat plan or custom volume package.',
  },
  capacity_miles: {
    eyebrow: 'Capacity gate · Miles balance',
    headline: 'Running low on miles? Upgrade your plan or add a bulk top-up.',
    lede: 'We offer bulk miles packages and custom miles economies for teams planning large-scale assessment runs.',
  },
  billing_upgrade_gate: {
    eyebrow: 'In-app upgrade',
    headline: 'Take a moment to scope what you need — we will fast-track it.',
    lede: 'Prefer to talk to a human before upgrading? Share some details and a plan specialist will reach out within a business day.',
  },
  nexus_premium_gate: {
    eyebrow: 'NEXUS · Premium gate',
    headline: 'Unlock higher-priority NEXUS throughput for your team.',
    lede: 'For teams that rely on NEXUS for daily workflows, we offer priority message lanes and context persistence upgrades.',
  },
  assessment_results_lock: {
    eyebrow: 'Assessment results',
    headline: 'Need an enterprise license for your assessment program?',
    lede: 'If you are rolling assessments out to 20+ people or a whole org, we offer volume pricing, white-labelled reports, and consultant debrief packs.',
  },
  account_menu: {
    eyebrow: 'Account · Sales inquiry',
    headline: 'Have a question? Our partnerships team is here.',
    lede: 'Anything from seat upgrades to multi-region rollouts. Tell us what you need and we will follow up within 1 business day.',
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
  source?: LeadSource;
  prefill?: Partial<{
    first_name: string;
    last_name: string;
    work_email: string;
    company_name: string;
    job_title: string;
    use_case: string;
  }>;
}

type Stage = 'form' | 'submitting' | 'success';

export function EnterpriseSalesModal({ open, onClose, source = 'pricing_enterprise', prefill }: Props) {
  const copy = SOURCE_COPY[source] || SOURCE_COPY.pricing_enterprise;

  const [stage, setStage] = useState<Stage>('form');
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState(prefill?.first_name || '');
  const [lastName, setLastName] = useState(prefill?.last_name || '');
  const [workEmail, setWorkEmail] = useState(prefill?.work_email || '');
  const [companyName, setCompanyName] = useState(prefill?.company_name || '');
  const [jobTitle, setJobTitle] = useState(prefill?.job_title || '');
  const [size, setSize] = useState<CompanySize | null>(null);
  const [timeline, setTimeline] = useState<BuyingTimeline | null>(null);
  const [artifacts, setArtifacts] = useState<string[]>(['custom_seat_plan']);
  const [message, setMessage] = useState(prefill?.use_case || '');
  const [gdpr, setGdpr] = useState(false);

  // Reset on open change
  useEffect(() => {
    if (open) {
      setStage('form');
      setError(null);
      setTrackingId(null);
      setFirstName(prefill?.first_name || '');
      setLastName(prefill?.last_name || '');
      setWorkEmail(prefill?.work_email || '');
      setCompanyName(prefill?.company_name || '');
      setJobTitle(prefill?.job_title || '');
      setSize(null);
      setTimeline(null);
      setArtifacts(['custom_seat_plan']);
      setMessage(prefill?.use_case || '');
    }
  }, [open, prefill?.first_name, prefill?.last_name, prefill?.work_email, prefill?.company_name, prefill?.job_title, prefill?.use_case]);

  if (!open) return null;

  const requiredFilled =
    firstName.trim().length > 0 &&
    workEmail.trim().length > 2 &&
    companyName.trim().length > 0 &&
    size !== null &&
    timeline !== null &&
    gdpr;

  const toggleArtifact = (v: string) => {
    setArtifacts((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredFilled) return;
    setStage('submitting');
    setError(null);
    const res = await submitEnterpriseLead({
      source,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      work_email: workEmail.trim(),
      company_name: companyName.trim(),
      job_title: jobTitle.trim() || undefined,
      company_size: size!,
      timeline: timeline!,
      region: regionFromLocale(),
      requested_artifacts: artifacts,
      message: message.trim() || undefined,
    });
    if (res.ok) {
      setTrackingId(res.trackingId);
      setStage('success');
    } else {
      setError(res.error || 'Something went wrong. Please try again or email partnerships@lyc.com.');
      setStage('form');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 18, 0.56)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        fontFamily: DS.bodyFont,
        color: DS.ink,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 760,
          maxHeight: '92vh',
          overflow: 'auto',
          background: '#FFF',
          border: `1px solid ${DS.border}`,
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 28px 18px',
            borderBottom: `1px solid ${DS.border}`,
            background: DS.off,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ maxWidth: 560 }}>
              <div
                style={{
                  fontFamily: DS.monoFont, fontSize: 10.5,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: DS.accent, fontWeight: 700, marginBottom: 8,
                }}
              >
                {copy.eyebrow}
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: DS.headingFont,
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: DS.ink,
                }}
              >
                {copy.headline}
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: DS.muted, lineHeight: 1.55 }}>
                {copy.lede}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                padding: 6,
                background: 'transparent',
                border: `1px solid ${DS.border}`,
                cursor: 'pointer',
                color: DS.ink,
                borderRadius: 0,
              }}
            >
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* Success state */}
        {stage === 'success' ? (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <div
              style={{
                width: 52, height: 52, margin: '0 auto 16px',
                borderRadius: '50%',
                background: '#04785714',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check style={{ width: 24, height: 24 }} />
            </div>
            <div
              style={{
                fontFamily: DS.headingFont,
                fontSize: 20, fontWeight: 700, marginBottom: 6,
              }}
            >
              Message received.
            </div>
            <p style={{ margin: '0 auto 14px', maxWidth: 420, fontSize: 13, color: DS.muted, lineHeight: 1.55 }}>
              A plan specialist will review your request and reply within 1 business day.
              Your tracking reference is below — quote it if you write in separately.
            </p>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                background: DS.off,
                border: `1px solid ${DS.border}`,
                fontFamily: DS.monoFont,
                fontSize: 11,
                letterSpacing: '0.04em',
                color: DS.ink,
                marginBottom: 18,
              }}
            >
              {trackingId}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => { setStage('form'); }}
                style={{
                  padding: '10px 16px',
                  background: 'transparent', color: DS.ink,
                  border: `1px solid ${DS.border}`, cursor: 'pointer',
                  fontFamily: DS.bodyFont, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                Send another request
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  background: DS.accent, color: '#FFF',
                  border: 'none', cursor: 'pointer',
                  fontFamily: DS.bodyFont, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 24 }}>
            {/* Section: You */}
            <SectionTitle icon={User} label="About you" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <Field label="First name" icon={User} required>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alex"
                  style={inputStyle}
                />
              </Field>
              <Field label="Last name" icon={User}>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Chen"
                  style={inputStyle}
                />
              </Field>
              <Field label="Work email" icon={Mail} required>
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={inputStyle}
                />
              </Field>
              <Field label="Job title" icon={Briefcase}>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Chief People Officer"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* Section: Company */}
            <SectionTitle icon={Building2} label="Your company" />
            <div style={{ marginBottom: 18 }}>
              <Field label="Company name" icon={Building2} required>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Northwind Holdings"
                  style={inputStyle}
                />
              </Field>

              <Field label="Company size" icon={Users} required>
                <PillSelect
                  options={COMPANY_SIZE_OPTIONS.map((s) => ({
                    value: s.value,
                    label: s.label,
                    description: s.hint,
                  }))}
                  value={size}
                  onChange={(v) => setSize(v as CompanySize)}
                />
              </Field>
            </div>

            {/* Section: Timeline + needs */}
            <SectionTitle icon={Calendar} label="When & what you need" />
            <div style={{ marginBottom: 18 }}>
              <Field label="When are you looking to decide?" icon={Calendar} required>
                <PillSelect
                  options={TIMELINE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                  value={timeline}
                  onChange={(v) => setTimeline(v as BuyingTimeline)}
                  vertical
                />
              </Field>
            </div>

            <Field label="What would help move this forward? (pick any)" icon={Sparkles}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ARTIFACT_OPTIONS.map((a) => {
                  const selected = artifacts.includes(a.value);
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => toggleArtifact(a.value)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: selected ? `${DS.accent}12` : 'transparent',
                        border: `1px solid ${selected ? DS.accent : DS.border}`,
                        color: selected ? DS.accent : DS.ink,
                        cursor: 'pointer',
                        fontFamily: DS.bodyFont,
                        fontSize: 12.5,
                        fontWeight: selected ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 14, height: 14,
                          border: `1px solid ${selected ? DS.accent : DS.border}`,
                          background: selected ? DS.accent : 'transparent',
                          color: '#FFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {selected && <Check style={{ width: 10, height: 10 }} />}
                      </span>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Message */}
            <div style={{ marginBottom: 18 }}>
              <Field label="Anything else we should know?" icon={MessageSquare}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    source.includes('council')
                      ? 'Tell us about your board, C-suite, or PE network and how you want to use Council.'
                      : 'Scope, use cases, stakeholders, specific assessments or NEXUS scenarios, etc.'
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 92,
                    paddingTop: 10,
                    paddingBottom: 10,
                    fontFamily: DS.bodyFont,
                  }}
                />
              </Field>
            </div>

            {/* GDPR + submit */}
            <div
              style={{
                padding: '14px 16px',
                background: DS.off,
                border: `1px solid ${DS.border}`,
                marginBottom: 16,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  gap: 9,
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  color: DS.ink,
                  lineHeight: 1.55,
                }}
              >
                <input
                  type="checkbox"
                  checked={gdpr}
                  onChange={(e) => setGdpr(e.target.checked)}
                  style={{ marginTop: 3, accentColor: DS.accent }}
                />
                <span>
                  I agree LYC Intelligence can process my information to respond to this
                  request, including sharing it with a plan specialist for follow-up.
                  This stays within LYC — we never sell or rent contact details.
                </span>
              </label>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px', marginBottom: 14,
                  background: '#B91C1C10', border: '1px solid #B91C1C40',
                  color: '#B91C1C', fontSize: 12.5,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11.5, color: DS.muted, fontFamily: DS.monoFont }}>
                Estimated reply: within 1 business day
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '11px 16px',
                    background: 'transparent', color: DS.ink,
                    border: `1px solid ${DS.border}`, cursor: 'pointer',
                    fontFamily: DS.bodyFont, fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!requiredFilled || stage === 'submitting'}
                  style={{
                    padding: '11px 18px',
                    background: requiredFilled ? DS.accent : DS.muted,
                    color: '#FFF',
                    border: 'none',
                    cursor: requiredFilled && stage !== 'submitting' ? 'pointer' : 'not-allowed',
                    fontFamily: DS.bodyFont,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: stage === 'submitting' ? 0.75 : 1,
                  }}
                >
                  {stage === 'submitting' ? 'Sending…' : (
                    <>
                      <Send style={{ width: 12, height: 12 }} />
                      Send request
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  background: '#FFF',
  border: `1px solid #D4D4D8`,
  color: DS.ink,
  fontFamily: DS.bodyFont,
  fontSize: 13,
  outline: 'none',
  borderRadius: 0,
  boxSizing: 'border-box',
};

function SectionTitle({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        margin: '18px 0 10px',
        fontFamily: DS.monoFont,
        fontSize: 10.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: DS.ink,
        fontWeight: 700,
      }}
    >
      <Icon style={{ width: 13, height: 13, color: DS.accent }} />
      {label}
    </div>
  );
}

function Field({
  label, icon: Icon, required, children,
}: {
  label: string;
  icon?: any;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 6,
          fontFamily: DS.monoFont,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: DS.muted,
          fontWeight: 600,
        }}
      >
        {Icon && <Icon style={{ width: 11, height: 11 }} />}
        {label}
        {required && <span style={{ color: DS.accent }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function PillSelect({
  options, value, onChange, vertical,
}: {
  options: { value: string; label: string; description?: string }[];
  value: string | null;
  onChange: (v: string) => void;
  vertical?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        flexDirection: vertical ? 'column' : 'row',
      }}
    >
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: vertical ? '10px 12px' : '8px 12px',
              textAlign: 'left',
              background: selected ? `${DS.accent}10` : '#FFF',
              border: `1px solid ${selected ? DS.accent : DS.border}`,
              color: selected ? DS.accent : DS.ink,
              cursor: 'pointer',
              fontFamily: DS.bodyFont,
              fontSize: 12.5,
              fontWeight: selected ? 700 : 500,
              borderRadius: 0,
              minWidth: vertical ? '100%' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: vertical ? 'space-between' : 'flex-start',
              gap: 6,
            }}
          >
            <div>
              <div>{o.label}</div>
              {o.description && (
                <div
                  style={{
                    fontSize: 11,
                    color: selected ? `${DS.accent}CC` : DS.muted,
                    fontWeight: 400,
                    marginTop: 1,
                  }}
                >
                  {o.description}
                </div>
              )}
            </div>
            {vertical && (
              <span
                style={{
                  width: 13, height: 13,
                  borderRadius: '50%',
                  border: `1px solid ${selected ? DS.accent : DS.border}`,
                  background: selected ? DS.accent : 'transparent',
                  color: '#FFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selected && <Check style={{ width: 9, height: 9 }} />}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default EnterpriseSalesModal;
