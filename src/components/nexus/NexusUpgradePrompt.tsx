/**
 * #1326 — In-NEXUS upgrade prompt.
 *
 * Surfaces an "elevate your membership" CTA at the peak-intent moment — after
 * message 3, or when the complimentary message allowance runs out. Deliberately
 * uses premium language ("elevate", "complimentary") rather than "upgrade now"
 * or "free". Links to the pricing/billing flow.
 *
 * Brand rules: zero border radius, Crimson Pro headings, DM Sans body,
 * IBM Plex Mono labels, single accent #C108AB, animations 120-350ms with
 * cubic-bezier(0.4, 0, 0.2, 1).
 */
import React from 'react';
import { Sparkles, ArrowRight, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type TierKey, CANONICAL_TIER_PRICING } from '@/services/monetizationService';

export interface NexusUpgradePromptProps {
  /** Number of messages the user has sent in the current session. */
  messageCount?: number;
  /** When true, the complimentary allowance is fully exhausted. */
  outOfMessages?: boolean;
  /** Tier to recommend elevating to (defaults to Starter — first paid tier). */
  targetTier?: TierKey;
  /** Remaining complimentary messages (for copy). */
  remaining?: number;
  /** Dismiss handler — if omitted, the dismiss button is hidden. */
  onDismiss?: () => void;
  /** Fired when the user clicks the primary CTA. */
  onElevate?: (tier: TierKey) => void;
  /** Optional className hook. */
  className?: string;
}

/** Message index at which the peak-intent prompt first appears. */
export const UPGRADE_PROMPT_TRIGGER_MESSAGE = 3;

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
};

const TRANSITION = '250ms cubic-bezier(0.4, 0, 0.2, 1)';

const TIER_LABEL = (k: TierKey): string =>
  k === 'explorer' ? CANONICAL_TIER_PRICING[k].alias! : CANONICAL_TIER_PRICING[k].label;

const TIER_PRICE = (k: TierKey): string => {
  const t = CANONICAL_TIER_PRICING[k];
  return t.usdMonthly === 0 ? 'Executive Introduction' : `$${t.usdMonthly}/mo`;
};

const ELEVATE_BENEFITS = [
  'A monthly miles allowance across the 11-instrument catalog',
  'Priority NEXUS conversations with deeper, framework-aware reasoning',
  'Personalised reports you can save, share, and revisit',
  'Earn miles through reflections and guided exploration',
];

export function NexusUpgradePrompt({
  messageCount = 0,
  outOfMessages = false,
  targetTier = 'starter',
  remaining,
  onDismiss,
  onElevate,
  className,
}: NexusUpgradePromptProps) {
  // Gate: show after message 3 (peak intent) OR when allowance is exhausted.
  const shouldShow =
    outOfMessages || messageCount >= UPGRADE_PROMPT_TRIGGER_MESSAGE;
  if (!shouldShow) return null;

  const headline = outOfMessages
    ? 'You\u2019ve reached the end of your complimentary messages.'
    : 'You\u2019re at the moment of deepest insight.';

  const subhead = outOfMessages
    ? 'Elevate your membership to keep the conversation going — and unlock the full NEXUS miles economy.'
    : 'This is where the most valuable conversations begin. Elevate your membership to continue without interruption and turn today\u2019s insight into a plan.';

  const remainingLine =
    !outOfMessages && typeof remaining === 'number' && remaining > 0
      ? `${remaining} complimentary message${remaining === 1 ? '' : 's'} remaining`
      : null;

  const handleElevate = () => {
    onElevate?.(targetTier);
  };

  return (
    <div
      className={className}
      role="region"
      aria-label="Elevate your membership"
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: `1px solid ${DS.border}`,
        borderLeft: `3px solid ${DS.accent}`,
        padding: '20px 22px',
        margin: '12px 0',
        animation: `nexusPromptIn ${TRANSITION} both`,
      }}
    >
      <style>{`@keyframes nexusPromptIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: DS.muted,
            padding: '4px',
            transition: `color ${TRANSITION}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DS.ink)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DS.muted)}
        >
          <X size={16} />
        </button>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Eyebrow */}
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
          }}
        >
          <Sparkles size={12} />
          Elevate your membership
        </div>

        {/* Headline */}
        <h3
          style={{
            margin: 0,
            fontFamily: DS.headingFont,
            fontSize: '20px',
            fontWeight: 700,
            color: DS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
            maxWidth: '540px',
          }}
        >
          {headline}
        </h3>

        {/* Subhead */}
        <p
          style={{
            margin: 0,
            fontFamily: DS.bodyFont,
            fontSize: '14px',
            color: DS.textSecondary,
            lineHeight: 1.6,
            maxWidth: '560px',
          }}
        >
          {subhead}
        </p>

        {/* Benefits */}
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px 16px',
          }}
        >
          {ELEVATE_BENEFITS.map((b) => (
            <li
              key={b}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontFamily: DS.bodyFont,
                fontSize: '12.5px',
                color: DS.textSecondary,
                lineHeight: 1.5,
              }}
            >
              <Check size={13} style={{ color: DS.accent, flexShrink: 0, marginTop: '2px' }} />
              {b}
            </li>
          ))}
        </ul>

        {/* CTA row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            marginTop: '4px',
          }}
        >
          <Link
            to="/pricing"
            onClick={handleElevate}
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
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              minHeight: '44px',
              transition: `background-color ${TRANSITION}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = DS.accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = DS.accent)}
          >
            Elevate to {TIER_LABEL(targetTier)}
            <ArrowRight size={14} />
          </Link>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <span
              style={{
                fontFamily: DS.monoFont,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: DS.accent,
                textTransform: 'uppercase',
              }}
            >
              {TIER_PRICE(targetTier)}
            </span>
            {remainingLine && (
              <span
                style={{
                  fontFamily: DS.monoFont,
                  fontSize: '10px',
                  color: DS.muted,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {remainingLine}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NexusUpgradePrompt;
