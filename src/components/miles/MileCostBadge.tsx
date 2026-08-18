/**
 * MileCostBadge — Displays mile cost next to assessment name.
 *
 * Batch 2 / Ticket 4: "3 miles" shown next to assessment name when
 * NEXUS recommends it. Plain text, no tooltip, no explainer.
 */
import React from 'react';
import { getInstrumentMileCost } from '@/config/miles';

export interface MileCostBadgeProps {
  instrumentCode: string;
  /** Override the cost (e.g., 0 for free Explorer token). */
  overrideCost?: number;
  variant?: 'inline' | 'badge';
}

export function MileCostBadge({ instrumentCode, overrideCost, variant = 'inline' }: MileCostBadgeProps): React.ReactElement | null {
  const cost = overrideCost ?? getInstrumentMileCost(instrumentCode);

  if (cost === 0) {
    if (variant === 'badge') {
      return <span style={badgeStyle('#2D7A3E')}>Complimentary</span>;
    }
    return <span style={{ fontSize: 13, color: '#2D7A3E', fontWeight: 600 }}>Complimentary</span>;
  }

  if (variant === 'badge') {
    return <span style={badgeStyle('#666')}>{cost} miles</span>;
  }

  return (
    <span style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>
      {cost} {cost === 1 ? 'mile' : 'miles'}
    </span>
  );
}

function badgeStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'IBM Plex Mono', monospace",
    color,
    border: `1px solid ${color}33`,
    background: `${color}0D`,
    whiteSpace: 'nowrap',
  };
}

export default MileCostBadge;
