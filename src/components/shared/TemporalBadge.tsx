/**
 * TemporalBadge — Trend indicator badge
 * Mockup v14: trend-up (green), trend-down (red), trend-flat (gray), trend-info (blue)
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

type TrendType = 'trend-up' | 'trend-down' | 'trend-flat' | 'trend-info';

interface TemporalBadgeProps {
  type: TrendType;
  value?: string;
}

const TREND_STYLES: Record<TrendType, { icon: React.ReactNode; bg: string; text: string }> = {
  'trend-up': { icon: <TrendingUp className="w-3 h-3" />, bg: 'bg-green/10', text: 'text-green' },
  'trend-down': { icon: <TrendingDown className="w-3 h-3" />, bg: 'bg-red/10', text: 'text-red' },
  'trend-flat': { icon: <Minus className="w-3 h-3" />, bg: 'bg-text-muted/10', text: 'text-text-muted' },
  'trend-info': { icon: <Info className="w-3 h-3" />, bg: 'bg-blue/10', text: 'text-blue' },
};

export function TemporalBadge({ type, value }: TemporalBadgeProps) {
  const style = TREND_STYLES[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${style.bg} ${style.text} text-xxs font-semibold`}>
      {style.icon}
      {value}
    </span>
  );
}

export default TemporalBadge;
