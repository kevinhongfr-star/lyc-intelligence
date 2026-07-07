import React from 'react';
import { TrendingUp, Award, ShieldCheck } from 'lucide-react';

export interface CareerHealthData {
  ctoReadiness: number;
  readinessDelta: number;
  leadership: number;
  profileStrength: number;
}

const MOCK_CAREER_HEALTH: CareerHealthData = {
  ctoReadiness: 72,
  readinessDelta: 3,
  leadership: 8.4,
  profileStrength: 87,
};

interface CareerHealthGridProps {
  data?: CareerHealthData;
}

export function CareerHealthGrid({ data = MOCK_CAREER_HEALTH }: CareerHealthGridProps) {
  const cards = [
    {
      key: 'cto',
      label: 'CTO Readiness',
      value: `${data.ctoReadiness}%`,
      icon: <ShieldCheck className="w-5 h-5 text-accent" />,
      sub: (
        <span className="inline-flex items-center gap-1 text-xs text-teal">
          <TrendingUp className="w-3 h-3" />
          +{data.readinessDelta}% this quarter
        </span>
      ),
    },
    {
      key: 'leadership',
      label: 'Leadership',
      value: data.leadership.toFixed(1),
      icon: <Award className="w-5 h-5 text-accent" />,
      sub: <span className="text-xs text-text-muted">out of 10 · peer benchmark</span>,
    },
    {
      key: 'profile',
      label: 'Profile Strength',
      value: `${data.profileStrength}%`,
      icon: <TrendingUp className="w-5 h-5 text-accent" />,
      sub: <span className="text-xs text-text-muted">complete & verified</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.key} className="bg-bg-secondary border border-bg-tertiary p-5">
          <div className="flex items-center gap-2 mb-4">
            {c.icon}
            <span className="text-xs uppercase tracking-wider text-text-muted">{c.label}</span>
          </div>
          <p className="font-serif text-3xl font-bold text-text-primary">{c.value}</p>
          <div className="mt-3">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
