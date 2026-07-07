import React from 'react';
import { Zap } from 'lucide-react';

interface CreditBarProps {
  remaining: number;
  dailyLimit: number;
  plan: string;
}

const PLAN_TIERS = [
  { name: 'Free', limit: '2/day' },
  { name: 'Member', limit: '5/day' },
  { name: 'Council', limit: 'Unlimited' },
];

export function CreditBar({ remaining, dailyLimit, plan }: CreditBarProps) {
  const unlimited = dailyLimit === Infinity || plan.toLowerCase() === 'council';
  const usedPercent = unlimited ? 0 : Math.round(((dailyLimit - remaining) / dailyLimit) * 100);

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <span className="font-serif text-sm font-bold text-text-primary">Daily Credits</span>
          </div>
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1">
              <span>
                {unlimited ? 'Unlimited' : `${remaining} of ${dailyLimit} remaining`}
              </span>
              <span className="uppercase tracking-wider text-text-secondary">{plan}</span>
            </div>
            <div className="h-2 bg-bg-tertiary">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: unlimited ? '100%' : `${100 - usedPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {PLAN_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex items-center gap-1.5 ${
                tier.name.toLowerCase() === plan.toLowerCase()
                  ? 'text-accent'
                  : 'text-text-muted'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 ${
                  tier.name.toLowerCase() === plan.toLowerCase() ? 'bg-accent' : 'bg-bg-tertiary'
                }`}
              />
              <span className="font-medium">{tier.name}</span>
              <span className="text-text-muted">{tier.limit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
