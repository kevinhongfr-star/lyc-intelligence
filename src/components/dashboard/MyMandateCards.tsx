'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, Clock } from 'lucide-react';

interface SeedMandate {
  id: string;
  title: string;
  client: string;
  location: string;
  stage: string;
  nextAction: string;
  daysInStage: number;
  value: string;
}

const STAGE_STYLES: Record<string, { bg: string; text: string }> = {
  SWEEP: { bg: 'rgba(0,137,123,0.1)', text: '#00897B' },
  CANVA: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
  GRID: { bg: 'rgba(16,185,129,0.1)', text: '#10B981' },
  LENS: { bg: 'rgba(6,182,212,0.1)', text: '#06B6D4' },
  PLACED: { bg: 'rgba(124,58,237,0.1)', text: '#7C3AED' },
};

const SEED_MANDATES: SeedMandate[] = [
  {
    id: 'm-001',
    title: 'Chief Technology Officer',
    client: 'Tencent',
    location: 'Shenzhen',
    stage: 'CANVA',
    nextAction: 'Client shortlist review',
    daysInStage: 12,
    value: '$180k',
  },
  {
    id: 'm-002',
    title: 'Head of Investment Banking',
    client: 'CICC',
    location: 'Beijing',
    stage: 'GRID',
    nextAction: 'Final interviews scheduled',
    daysInStage: 8,
    value: '$250k',
  },
  {
    id: 'm-003',
    title: 'VP of Engineering',
    client: 'Sea Limited',
    location: 'Singapore',
    stage: 'SWEEP',
    nextAction: 'Deliver longlist of 12',
    daysInStage: 5,
    value: '$150k',
  },
  {
    id: 'm-004',
    title: 'Chief Financial Officer',
    client: 'Ant Group',
    location: 'Shanghai',
    stage: 'LENS',
    nextAction: 'Submit candidate report',
    daysInStage: 18,
    value: '$220k',
  },
  {
    id: 'm-005',
    title: 'Head of Product',
    client: 'Grab',
    location: 'Singapore',
    stage: 'CANVA',
    nextAction: 'Client interviews underway',
    daysInStage: 3,
    value: '$140k',
  },
];

export function MyMandateCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {SEED_MANDATES.map((m) => {
        const stageStyle = STAGE_STYLES[m.stage] || { bg: 'rgba(115,115,115,0.1)', text: '#737373' };
        return (
          <Link
            key={m.id}
            to={`/app/mandates/${m.id}`}
            className="block border border-[#E5E5E5] bg-white p-5 hover:shadow-md hover:border-[#C108AB]/20 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-medium text-[#171717] group-hover:text-[#C108AB] transition-colors line-clamp-2">
                {m.title}
              </h3>
              <span
                className="text-xs font-semibold px-2 py-0.5 flex-shrink-0 ml-2 whitespace-nowrap"
                style={{ backgroundColor: stageStyle.bg, color: stageStyle.text }}
              >
                {m.stage}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-[#737373] mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{m.client}</span>
              <span className="text-[#A3A3A3]">·</span>
              <span className="text-xs">{m.location}</span>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-[#404040]">
                <ArrowRight className="w-3 h-3 text-[#C108AB]" />
                <span className="truncate">{m.nextAction}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#737373]">
                <Clock className="w-3 h-3" />
                <span>{m.daysInStage} days in stage</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between">
              <span className="text-xs text-[#737373]">Engagement value</span>
              <span className="text-sm font-semibold text-[#171717] tabular-nums">{m.value}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
