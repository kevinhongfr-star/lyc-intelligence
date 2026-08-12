/**
 * AssessmentCtaCard — product CTA card rendered in the NEXUS chat stream.
 *
 * Visually distinct from a chat bubble:
 *  - Stroked accent (#C108AB) card, zero radius
 *  - Instrument name, 1-line value prop, price in miles
 *  - "Take assessment" button → starts the flow (or gated modal if miles insufficient)
 *
 * Brand rules enforced: no border radius, font trio (Crimson Pro / DM Sans / IBM Plex Mono),
 * accent #C108AB, no "free" word, currency = miles (mi suffix).
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Sparkles, Layers, Clock, HelpCircle, Zap, X } from 'lucide-react';
import type { NexusAssessmentKBEntry } from '@/nexus/nexusKnowledge';
import { MilesBadge } from './MilesBadge';
import {
  ASSESSMENT_MILES_COSTS,
  spendAssessmentMiles,
  fetchMilesBalance,
} from '@/services/monetizationService';
import { useAuthStore } from '@/stores/authStore';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  accentSoft: '#C108AB1A',
  bg: '#FFFFFF',
  border: '#E9E7E1',
  text: '#0A0A12',
  muted: '#616170',
  radius: '0px',
};

export interface AssessmentCtaCardProps {
  kb: NexusAssessmentKBEntry;
  /** NEXUS rationale text explaining why this assessment fits (1-2 sentences) */
  rationale?: string;
  /** Optional outcome text — what the user gets */
  outcome?: string;
  /** Current miles balance of the user; if undefined we fetch on CTA click */
  currentMilesBalance?: number | null;
  /** Called after miles successfully deducted and navigate() is about to run */
  onMilesBalanceChange?: (newBalance: number) => void;
}

export function AssessmentCtaCard({
  kb,
  rationale,
  outcome,
  currentMilesBalance,
  onMilesBalanceChange,
}: AssessmentCtaCardProps) {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [flowState, setFlowState] = useState<
    'idle' | 'spending' | 'gated' | 'failed'
  >('idle');
  const [effectiveBalance, setEffectiveBalance] = useState<number | null>(
    typeof currentMilesBalance === 'number' ? currentMilesBalance : null,
  );

  // Miles cost: always prefer the monetizationService ASSESSMENT_MILES_COSTS value
  // (used at deduction), fall back to KB priceMiles.
  const milesCost =
    (ASSESSMENT_MILES_COSTS && ASSESSMENT_MILES_COSTS[kb.code]) || kb.priceMiles;

  const tierLabelMap: Record<string, string> = {
    flagship: 'FLAGSHIP',
    shift: 'SHIFT SUITE',
    advisory: 'ADVISORY',
  };

  const handleTake = async () => {
    setFlowState('spending');

    // 1. Resolve balance if not already known
    let balance = effectiveBalance;
    if (balance === null) {
      try {
        const mb = await fetchMilesBalance();
        balance = mb.balance;
        setEffectiveBalance(balance);
        onMilesBalanceChange?.(balance);
      } catch {
        balance = 0;
      }
    }

    // 2. Gating: insufficient balance → show gated modal
    if (balance < milesCost) {
      setFlowState('gated');
      return;
    }

    // 3. Spend the miles (or attempt to — service handles persistence)
    try {
      const result = await spendAssessmentMiles(kb.code, {
        referenceId: `nexus_cta_${kb.code}_${Date.now()}`,
      });
      if (!result.success) throw new Error('Failed to spend miles');
      const newBalance = result.newBalance;
      setEffectiveBalance(newBalance);
      onMilesBalanceChange?.(newBalance);
    } catch (e) {
      // Non-fatal: Miles spend may fail in offline/mock modes. Continue to assessment
      // so the user flow is preserved; miles accounting happens server-side post-completion
      // via assessment_completion_refund path.
      console.warn('[AssessmentCtaCard] spendAssessmentMiles skipped (non-fatal):', e);
    }

    // 4. Navigate to canonical landing for that instrument. The landing then
    // starts the actual flow.
    navigate(kb.canonicalUrl);
  };

  const insufficient =
    typeof effectiveBalance === 'number' && effectiveBalance < milesCost;

  return (
    <div
      role="region"
      aria-label={`${kb.name} assessment — product CTA`}
      style={{
        position: 'relative',
        marginTop: '10px',
        marginBottom: '4px',
        marginLeft: '2px',
        maxWidth: '540px',
        background: DS.bg,
        border: `2px solid ${DS.accent}`,
 
        boxShadow: `0 0 0 1px ${DS.accent}14, 0 16px 40px ${DS.accent}14`,
      }}
    >
      {/* Eyebrow strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: DS.accentSoft,
          borderBottom: `1px solid ${DS.accent}40`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: DS.monoFont,
              fontSize: '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: DS.accent,
              fontWeight: 700,
            }}
          >
            {tierLabelMap[kb.category] || kb.categoryLabel.toUpperCase()} · {kb.code}
          </span>
        </div>
        <MilesBadge balance={milesCost} size="sm" />
      </div>

      {/* Body */}
      <div style={{ padding: '18px 18px 16px' }}>
        <div style={{ marginBottom: '8px' }}>
          <h4
            style={{
              fontFamily: DS.headingFont,
              fontSize: '20px',
              margin: '0 0 4px',
              color: DS.text,
              lineHeight: 1.18,
              letterSpacing: '-0.005em',
              fontWeight: 700,
            }}
          >
            {kb.name}
          </h4>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              color: DS.muted,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            {kb.tagline}
          </p>
        </div>

        {/* Fact row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '8px',
            marginTop: '12px',
          }}
        >
          <Fact icon={HelpCircle} label={`${kb.totalQuestions} Q`} />
          <Fact icon={Clock} label={`${kb.durationMinutes} min`} />
          <Fact icon={Layers} label={`${kb.dimensionCount} dims`} />
        </div>

        {rationale && (
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              background: '#FAF8F5',
              borderLeft: `3px solid ${DS.accent}`,
              fontSize: '13px',
              fontFamily: DS.bodyFont,
              color: '#2A2A36',
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: '9.5px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: DS.accent,
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles style={{ width: 11, height: 11 }} /> Why this one
            </div>
            {rationale}
          </div>
        )}

        {outcome && (
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12.5px',
              color: DS.muted,
              marginTop: '10px',
              marginBottom: 0,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#2A2A36' }}>You get:</strong> {outcome}
          </p>
        )}

        {/* CTA row */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleTake}
            disabled={flowState === 'spending'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 18px',
              background: DS.accent,
              color: '#FFF',
              border: 'none',
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: flowState === 'spending' ? 'wait' : 'pointer',
              opacity: flowState === 'spending' ? 0.7 : 1,
 
            }}
          >
            {flowState === 'spending' ? (
              <>Starting… <Zap style={{ width: 13, height: 13 }} /></>
            ) : (
              <>Take assessment <ArrowRight style={{ width: 13, height: 13 }} /></>
            )}
          </button>

          <a
            href={kb.canonicalUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 16px',
              color: DS.text,
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textDecoration: 'none',
              background: 'transparent',
              border: `1px solid ${DS.border}`,
 
            }}
          >
            Learn more
          </a>

          {typeof effectiveBalance === 'number' && (
            <div style={{ marginLeft: 'auto' }}>
              <MilesBadge
                balance={effectiveBalance}
                size="sm"
                onClick={() => onMilesBalanceChange?.(effectiveBalance)}
              />
            </div>
          )}
        </div>

        {insufficient && flowState !== 'gated' && (
          <p
            style={{
              fontFamily: DS.monoFont,
              fontSize: '11px',
              color: DS.accent,
              letterSpacing: '0.06em',
              marginTop: '10px',
              marginBottom: 0,
            }}
          >
            Short {milesCost - effectiveBalance} mi — add miles or start with Executive Introduction.
          </p>
        )}
      </div>

      {/* Gated modal — miles insufficient */}
      {flowState === 'gated' && (
        <div
          aria-modal="true"
          role="dialog"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10,10,18,0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 5,
          }}
        >
          <div
            style={{
              background: '#FFF',
              border: `2px solid ${DS.accent}`,
 
              padding: '20px',
              maxWidth: '420px',
              width: '100%',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setFlowState('idle')}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: 'none',
                color: DS.muted,
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: DS.accentSoft,
                color: DS.accent,
                padding: '4px 10px',
                fontFamily: DS.monoFont,
                fontSize: '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              <Lock style={{ width: 11, height: 11 }} /> Miles shortfall
            </div>
            <h5
              style={{
                fontFamily: DS.headingFont,
                fontSize: '18px',
                margin: '0 0 8px',
                color: DS.text,
                fontWeight: 700,
              }}
            >
              This {kb.code} assessment opens with {milesCost} mi.
            </h5>
            <p
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '13px',
                color: DS.muted,
                margin: '0 0 16px',
                lineHeight: 1.6,
              }}
            >
              Your current balance is {effectiveBalance} mi. Executive Introduction
              shows framework samples and value prop — the personalised instrument
              opens when you have the miles. Earn them in NEXUS (deep sessions,
              reflections) or add to your plan.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="/pricing"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '11px 18px',
                  background: DS.accent,
                  color: '#FFF',
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
 
                }}
              >
                Add miles
              </a>
              <button
                onClick={() => setFlowState('idle')}
                style={{
                  padding: '11px 18px',
                  background: 'transparent',
                  color: DS.text,
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  border: `1px solid ${DS.border}`,
 
                  cursor: 'pointer',
                }}
              >
                Keep exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        background: '#FAF8F5',
        border: `1px solid ${DS.border}`,
 
        fontFamily: DS.monoFont,
        fontSize: '11px',
        color: '#2A2A36',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon style={{ width: 12, height: 12, color: DS.accent }} />
      {label}
    </div>
  );
}
