/**
 * HealthCard — Health Monitor card with icon, value, progress bar, sparkline
 * Mockup v14: dead/low-vel/no-interview/stalled categories
 */
import React from 'react';
import { Skull, Gauge, CalendarX, Pause } from 'lucide-react';

export type HealthIconType = 'dead' | 'low-vel' | 'no-interview' | 'stalled';
export type HealthBarType = 'critical' | 'warning' | 'caution' | 'neutral';

interface HealthCardProps {
  icon: string;
  iconType: HealthIconType;
  value: number;
  label: string;
  sublabel?: string;
  barPercent: number;
  barType: HealthBarType;
  sparklineData: number[];
  detailText?: string;
  onClick?: () => void;
}

const ICON_MAP: Record<HealthIconType, React.ReactNode> = {
  'dead': <Skull className="w-5 h-5" />,
  'low-vel': <Gauge className="w-5 h-5" />,
  'no-interview': <CalendarX className="w-5 h-5" />,
  'stalled': <Pause className="w-5 h-5" />,
};

const BAR_COLORS: Record<HealthBarType, string> = {
  'critical': 'bg-red',
  'warning': 'bg-amber',
  'caution': 'bg-blue',
  'neutral': 'bg-text-muted',
};

const CARD_BORDER: Record<HealthBarType, string> = {
  'critical': 'border-red/20',
  'warning': 'border-amber/20',
  'caution': 'border-blue/20',
  'neutral': 'border-text-muted/20',
};

const SPARK_COLORS: Record<HealthBarType, string> = {
  'critical': 'bg-red/40',
  'warning': 'bg-amber/40',
  'caution': 'bg-blue/40',
  'neutral': 'bg-text-muted/40',
};

export function HealthCard({ iconType, value, label, sublabel, barPercent, barType, sparklineData, detailText, onClick }: HealthCardProps) {
  const maxSpark = Math.max(...sparklineData, 1);
  
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-card shadow-card border ${CARD_BORDER[barType]} p-4 cursor-pointer
        hover:shadow-card-hover transition-all
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${BAR_COLORS[barType].replace('bg-', 'bg-')}/10 ${BAR_COLORS[barType]}`}>
            {ICON_MAP[iconType]}
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-text-primary">{value}</div>
            <div className="text-xs text-text-secondary">{label}</div>
          </div>
        </div>
        {sublabel && <div className="text-xxs text-text-muted">{sublabel}</div>}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2 bg-bg-warm rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${BAR_COLORS[barType]} transition-all`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex items-end gap-0.5 h-6 mb-3">
        {sparklineData.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${SPARK_COLORS[barType]}`}
            style={{ height: `${(v / maxSpark) * 100}%`, minHeight: '2px' }}
          />
        ))}
      </div>

      {/* Detail link */}
      {detailText && (
        <div className="text-xxs text-fuchsia hover:underline">
          {detailText}
        </div>
      )}
    </div>
  );
}

export default HealthCard;
