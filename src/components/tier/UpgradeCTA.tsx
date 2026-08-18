/**
 * UpgradeCTA — configurable upgrade call-to-action component.
 *
 * Batch 1.5 / Ticket 2: Links to the pricing page. Can be called from
 * chat, soft gates, or any feature without losing context (uses Link,
 * so browser back-button returns to the calling page).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TIERS, type TierKey } from '@/config/tiers';

const ACCENT = '#C108AB';

export interface UpgradeCTAProps {
  /** Tier the user should upgrade to. */
  targetTier: TierKey;
  /** Visual variant. */
  variant?: 'full' | 'compact';
  /** Override CTA label. Defaults to "Upgrade to {displayName}". */
  label?: string;
  /** Called on click (in addition to navigation). */
  onUpgrade?: () => void;
  /** Whether to preserve current URL as ?return_to= query param. */
  preserveContext?: boolean;
}

export function UpgradeCTA({
  targetTier,
  variant = 'full',
  label,
  onUpgrade,
  preserveContext = true,
}: UpgradeCTAProps): React.ReactElement {
  const meta = TIERS[targetTier];
  const ctaLabel = label ?? `Upgrade to ${meta.displayName}`;

  const href = preserveContext
    ? `/pricing?return_to=${encodeURIComponent(window.location.pathname)}`
    : '/pricing';

  const handleClick = () => {
    onUpgrade?.();
  };

  if (variant === 'compact') {
    return (
      <Link
        to={href}
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          background: ACCENT,
          color: '#fff',
          textDecoration: 'none',
          border: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {ctaLabel}
        <ArrowRight size={14} />
      </Link>
    );
  }

  return (
    <Link
      to={href}
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '12px 24px',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: ACCENT,
        color: '#fff',
        textDecoration: 'none',
        border: 'none',
        minHeight: 48,
      }}
    >
      {ctaLabel}
      <ArrowRight size={16} />
    </Link>
  );
}

export default UpgradeCTA;
