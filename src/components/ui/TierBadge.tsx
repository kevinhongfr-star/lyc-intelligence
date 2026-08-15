/**
 * TierBadge — Brand-aligned typographic tier labels (ECHO v1.2)
 *
 * The `Tier` type retains its legacy values ('Gold' | 'Silver' | 'Bronze' |
 * 'Unranked') for backwards compatibility with existing callers, but the
 * rendered labels and visual treatment follow the ECHO v1.2 brand system:
 *
 *   - Gold   → "Executive"    — dark ink (#0A0A12) bg, fuchsia accent border
 *   - Silver → "Professional" — solid fuchsia (#C108AB) bg
 *   - Bronze → "Core"         — no fill, gray eyebrow label (#616170)
 *   - Unranked               — muted gray text, no background
 *
 * No metallic gradients. No trophy emojis. Typographic tier labels only.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type Tier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';

interface TierBadgeProps {
  tier: Tier | string | null | undefined;
  size?: 'sm' | 'md';
  /** Kept for API compatibility. Emojis are never rendered (ECHO v1.2). */
  showEmoji?: boolean;
  className?: string;
}

const TIER_STYLES: Record<Tier, string> = {
  Gold: 'text-white font-semibold border-[#C108AB]',
  Silver: 'text-white font-semibold border-transparent',
  Bronze: 'text-[#616170] uppercase tracking-wide text-xs font-medium border-transparent',
  Unranked: 'text-stone-500 font-medium border-transparent',
};

// Solid brand accent backgrounds (no gradients). Named TIER_GRADIENT for
// backwards compatibility with internal references; values are plain colors.
const TIER_GRADIENT: Record<Tier, string> = {
  Gold: '#0A0A12',
  Silver: '#C108AB',
  Bronze: 'transparent',
  Unranked: 'transparent',
};

const TIER_LABEL: Record<Tier, string> = {
  Gold: 'Executive',
  Silver: 'Professional',
  Bronze: 'Core',
  Unranked: 'Unranked',
};

export function TierBadge({ tier, size = 'md', className }: TierBadgeProps) {
  const resolvedTier: Tier =
    tier === 'Gold' || tier === 'Silver' || tier === 'Bronze' || tier === 'Unranked'
      ? tier
      : 'Unranked';

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  const style: React.CSSProperties = { background: TIER_GRADIENT[resolvedTier] };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border whitespace-nowrap',
        sizeClasses,
        TIER_STYLES[resolvedTier],
        className,
      )}
      style={style}
    >
      {TIER_LABEL[resolvedTier]}
    </span>
  );
}

export default TierBadge;
