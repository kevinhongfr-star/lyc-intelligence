import React from 'react';
import { Lightbulb, Eye } from 'lucide-react';

export type InsightVariant = 'insight' | 'blind-spot';

interface CQInsightCardProps {
  variant: InsightVariant;
  title: string;
  body: string;
}

export function CQInsightCard({ variant, title, body }: CQInsightCardProps) {
  const isInsight = variant === 'insight';
  const Icon = isInsight ? Lightbulb : Eye;
  const accentColor = isInsight ? 'text-ocean-deep' : 'text-warning';
  const tintStyle: React.CSSProperties = isInsight
    ? { backgroundColor: 'rgba(79, 195, 247, 0.12)' }
    : { backgroundColor: 'rgba(245, 158, 11, 0.12)' };

  return (
    <div className={`bg-bg-primary border border-bg-tertiary p-5`}>
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={tintStyle}>
          <Icon className={`w-4 h-4 ${accentColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-0.5">
            {isInsight ? 'Key Insight' : 'Blind Spot'}
          </div>
          <h4 className="font-serif text-base font-bold text-text-primary leading-snug">
            {title}
          </h4>
        </div>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
    </div>
  );
}
