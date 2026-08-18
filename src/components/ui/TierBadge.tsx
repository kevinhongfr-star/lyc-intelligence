/**
 * TierBadge — Reusable Gold/Silver/Bronze/Unranked badge (S5-T06)
 *
 * Visual design per TRAEE_NEXT_SPRINTS spec:
 *   - Gold:   gradient #FFD700 → #FFA500, bold text
 *   - Silver: gradient #C0C0C0 → #808080
 *   - Bronze: gradient #CD7F32 → #8B4513
 *   - Unranked: muted gray
 *
 * Reused across Candidate Portal, Client Portal, and Admin views for a
 * consistent visual language.
 */
import React from 'react';
import { cn } from '@/lib/utils';

export type Tier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';

interface TierBadgeProps {
  tier: Tier | string | null | undefined;
  size?: 'sm' | 'md';
  showEmoji?: boolean;
  className?: string;
}

const TIER_STYLES: Record<Tier, string> = {
  Gold: 'text-white font-bold border-transparent',
  Silver: 'text-white font-semibold border-transparent',
  Bronze: 'text-white font-semibold border-transparent',
  Unranked: 'text-stone-500 font-medium border-stone-300 bg-stone-100',
};

const TIER_GRADIENT: Record<Tier, string> = {
  Gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  Silver: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
  Bronze: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
  Unranked: 'none',
};

const TIER_EMOJI: Record<Tier, string> = {
  Gold: '🥇',
  Silver: '🥈',
  Bronze: '🥉',
  Unranked: '—',
};

export function TierBadge({ tier, size = 'md', showEmoji = true, className }: TierBadgeProps) {
  const resolvedTier: Tier =
    tier === 'Gold' || tier === 'Silver' || tier === 'Bronze' || tier === 'Unranked'
      ? tier
      : 'Unranked';

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';
  const style: React.CSSProperties =
    resolvedTier === 'Unranked'
      ? {}
      : { backgroundImage: TIER_GRADIENT[resolvedTier] };

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
      {showEmoji && <span aria-hidden>{TIER_EMOJI[resolvedTier]}</span>}
      {resolvedTier}
    </span>
  );
}

export default TierBadge;
