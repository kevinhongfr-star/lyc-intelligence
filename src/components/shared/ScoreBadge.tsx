/**
 * ScoreBadge — Candidate score display
 * Mockup v14 style: score indicator with tier color
 */
import React from 'react';

type ScoreTier = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4';

interface ScoreBadgeProps {
  score: number;
  tier?: ScoreTier;
  size?: 'sm' | 'md' | 'lg';
}

function getTierFromScore(score: number): ScoreTier {
  if (score >= 80) return 'tier-1';
  if (score >= 60) return 'tier-2';
  if (score >= 40) return 'tier-3';
  return 'tier-4';
}

const TIER_COLORS: Record<ScoreTier, { bg: string; text: string }> = {
  'tier-1': { bg: 'bg-tier-1Bg', text: 'text-tier-1' },
  'tier-2': { bg: 'bg-tier-2Bg', text: 'text-tier-2' },
  'tier-3': { bg: 'bg-tier-3Bg', text: 'text-tier-3' },
  'tier-4': { bg: 'bg-red/10', text: 'text-red' },
};

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xxs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function ScoreBadge({ score, tier, size = 'md' }: ScoreBadgeProps) {
  const actualTier = tier || getTierFromScore(score);
  const colors = TIER_COLORS[actualTier];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div className={`${colors.bg} ${colors.text} rounded-lg ${sizeClass} flex items-center justify-center font-bold`}>
      {Math.round(score)}
    </div>
  );
}

export default ScoreBadge;