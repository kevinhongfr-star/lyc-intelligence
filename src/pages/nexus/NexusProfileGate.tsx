import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { V1 } from '@/styles/v1-tokens';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface NexusUserProfile {
  name: string;
  role: string;
  industry: string;
  companySize: string;
  yearsInRole: string;
  location: string;
  challenge: string;
  goal: string;
  seniority: string;
  todayMotivation: string;
}

const LS_KEY = 'nexus_user_profile_v1';

const INDUSTRIES = [
  'Management Consulting',
  'Technology',
  'Financial Services',
  'Consumer/Retail',
  'Manufacturing',
  'Healthcare',
  'Energy',
  'Other',
];

const COMPANY_SIZES = ['<100', '100-500', '500-2000', '2000-10000', '10000+'];
const YEARS_OPTIONS = ['<1', '1-3', '3-5', '5-10', '10+'];
const SENIORITY_OPTIONS = [
  'Individual Contributor',
  'Manager',
  'Senior Manager',
  'Director',
  'VP',
  'C-Suite/Board',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function getSavedProfile(): NexusUserProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name && parsed.role) return parsed as NexusUserProfile;
    return null;
  } catch {
    return null;
  }
}

export function clearSavedProfile(): void {
  localStorage.removeItem(LS_KEY);
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const WARM_CHARCOAL = '#3A3632';
const WARM_OFFWHITE = '#F2EFEA';
const TEAL = V1.teal600;
const TEAL_LIGHT = V1.teal400;

const labelStyle: React.CSSProperties = {
  fontFamily: V1.monoFont,
  fontSize: '0.65rem',
  letterSpacing: V1.trackingMono,
  textTransform: 'uppercase',
  color: TEAL_LIGHT,
  lineHeight: V1.leadingLabel,
  fontWeight: V1.fwSemibold,
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  fontFamily: V1.bodyFont,
  fontSize: 15,
  color: WARM_OFFWHITE,
  lineHeight: V1.leadingBody,
  background: 'rgba(255,255,255,0.06)',
  outline: 'none',
  transition: `border-color ${V1.durFast}ms ${V1.ease}`,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23F2EFEA' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
};

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  onComplete: (profile: NexusUserProfile) => void;
}

export function NexusProfileGate({ onComplete }: Props): React.ReactElement {
  const [form, setForm] = useState<NexusUserProfile>({
    name: '',
    role: '',
    industry: '',
    companySize: '',
    yearsInRole: '',
    location: '',
    challenge: '',
    goal: '',
    seniority: '',
    todayMotivation: '',
  });

  const set = (key: keyof NexusUserProfile, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const canSubmit = form.name.trim().length > 0 && form.role.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    localStorage.setItem(LS_KEY, JSON.stringify(form));
    onComplete(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: WARM_CHARCOAL,
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 20px 60px',
      }}
    >
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 520,
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${V1.teal500}, ${V1.teal800})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: V1.monoFont }}>N</span>
          </div>
          <h1
            style={{
              fontFamily: V1.displayFont,
              fontSize: 26,
              fontWeight: V1.fwSemibold,
              color: WARM_OFFWHITE,
              margin: '0 0 8px',
              lineHeight: V1.leadingHeading,
            }}
          >
            Let&apos;s get to know you
          </h1>
          <p
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 14,
              color: 'rgba(242,239,234,0.55)',
              margin: 0,
              lineHeight: V1.leadingBody,
            }}
          >
            This helps NEXUS tailor every response to your context.
          </p>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Q1: Name */}
          <div>
            <label style={labelStyle}>1. What&apos;s your name?</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Alex Chen"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Q2: Role */}
          <div>
            <label style={labelStyle}>2. Current role / title</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. VP of Operations"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Q3: Industry */}
          <div>
            <label style={labelStyle}>3. Industry</label>
            <select
              style={selectStyle}
              value={form.industry}
              onChange={(e) => set('industry', e.target.value)}
            >
              <option value="" style={{ background: WARM_CHARCOAL }}>Select industry…</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} style={{ background: WARM_CHARCOAL }}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Q4: Company size */}
          <div>
            <label style={labelStyle}>4. Company size</label>
            <select
              style={selectStyle}
              value={form.companySize}
              onChange={(e) => set('companySize', e.target.value)}
            >
              <option value="" style={{ background: WARM_CHARCOAL }}>Select size…</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s} style={{ background: WARM_CHARCOAL }}>{s} employees</option>
              ))}
            </select>
          </div>

          {/* Q5: Years in role */}
          <div>
            <label style={labelStyle}>5. Years in current role</label>
            <select
              style={selectStyle}
              value={form.yearsInRole}
              onChange={(e) => set('yearsInRole', e.target.value)}
            >
              <option value="" style={{ background: WARM_CHARCOAL }}>Select…</option>
              {YEARS_OPTIONS.map((y) => (
                <option key={y} value={y} style={{ background: WARM_CHARCOAL }}>{y} years</option>
              ))}
            </select>
          </div>

          {/* Q6: Location */}
          <div>
            <label style={labelStyle}>6. Location / city</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Shanghai, London, Singapore"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Q7: Top challenge */}
          <div>
            <label style={labelStyle}>7. What&apos;s the top challenge you&apos;re facing right now?</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }}
              placeholder="2-3 sentences…"
              value={form.challenge}
              onChange={(e) => set('challenge', e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Q8: 12-month goal */}
          <div>
            <label style={labelStyle}>8. Where do you want to be in 12 months?</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }}
              placeholder="Your aspiration…"
              value={form.goal}
              onChange={(e) => set('goal', e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>

          {/* Q9: Seniority */}
          <div>
            <label style={labelStyle}>9. What&apos;s your seniority level?</label>
            <select
              style={selectStyle}
              value={form.seniority}
              onChange={(e) => set('seniority', e.target.value)}
            >
              <option value="" style={{ background: WARM_CHARCOAL }}>Select level…</option>
              {SENIORITY_OPTIONS.map((s) => (
                <option key={s} value={s} style={{ background: WARM_CHARCOAL }}>{s}</option>
              ))}
            </select>
          </div>

          {/* Q10: What brought you here */}
          <div>
            <label style={labelStyle}>10. What brought you to NEXUS today?</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const }}
              placeholder="Brief — one thought is enough…"
              value={form.todayMotivation}
              onChange={(e) => set('todayMotivation', e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            />
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.01 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          style={{
            width: '100%',
            marginTop: 32,
            padding: '14px 24px',
            background: canSubmit ? TEAL : 'rgba(255,255,255,0.08)',
            color: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
            fontFamily: V1.monoFont,
            fontSize: '0.75rem',
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            borderRadius: 12,
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontWeight: V1.fwSemibold,
            lineHeight: V1.leadingLabel,
            transition: `background-color ${V1.durFast}ms ${V1.ease}`,
          }}
        >
          Start my conversation
        </motion.button>
      </motion.form>
    </div>
  );
}

export default NexusProfileGate;
