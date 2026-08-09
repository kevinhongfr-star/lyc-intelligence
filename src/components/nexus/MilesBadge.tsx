import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MilesBadgeProps {
  /** Current miles balance */
  balance: number;
  /** Total earned lifetime */
  totalEarned?: number;
  /** Whether to show total earned */
  showTotal?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { icon: 'w-3 h-3', text: 'text-xs', pad: 'px-2 py-0.5' },
  md: { icon: 'w-4 h-4', text: 'text-sm', pad: 'px-3 py-1' },
  lg: { icon: 'w-5 h-5', text: 'text-base', pad: 'px-4 py-2' },
};

const ACCENT = '#C108AB';

/**
 * MilesBadge — compact miles balance display.
 * Zero border-radius, crimson accent (#C108AB).
 * Used in headers, nav bars, and context panels.
 */
export function MilesBadge({
  balance,
  totalEarned,
  showTotal = false,
  size = 'md',
  className,
  onClick,
}: MilesBadgeProps) {
  const s = SIZE_MAP[size];

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 font-medium select-none',
        onClick ? 'cursor-pointer' : '',
        s.pad,
        className
      )}
      style={{
        background: `${ACCENT}12`,
        border: `1px solid ${ACCENT}40`,
        color: ACCENT,
      }}
    >
      <Zap className={s.icon} style={{ color: ACCENT }} />
      <span className={cn(s.text, 'tabular-nums')} style={{ color: ACCENT }}>
        {balance.toLocaleString()}
      </span>
      <span className={cn(s.text, 'opacity-60')} style={{ color: ACCENT }}>
        mi
      </span>
      {showTotal && totalEarned !== undefined && (
        <span
          className={cn(s.text, 'opacity-50 ml-1')}
          style={{ color: ACCENT }}
          title="Total earned lifetime"
        >
          ({totalEarned.toLocaleString()})
        </span>
      )}
    </div>
  );
}
