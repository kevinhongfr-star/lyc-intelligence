import React from 'react';
import { MapPin, Briefcase } from 'lucide-react';

export interface FitDimension {
  dimension: string;
  score: number;
}

export interface Opportunity {
  id: string;
  role: string;
  company: string;
  location: string;
  industry: string;
  seniority: string;
  fit: number;
  salary: string;
  description: string;
  fitBreakdown: FitDimension[];
  matchReasons: string[];
}

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: '1',
    role: 'CTO',
    company: 'NeoBank',
    location: 'Singapore',
    industry: 'Fintech',
    seniority: 'C-Level',
    fit: 92,
    salary: '$320K – $380K + equity',
    description:
      'Lead the technology vision for a Series C neobank scaling across SEA. Own platform, data, and security; report to the CEO and partner with product on the next 18-month roadmap.',
    fitBreakdown: [
      { dimension: 'Skills', score: 94 },
      { dimension: 'Experience', score: 90 },
      { dimension: 'Leadership', score: 91 },
      { dimension: 'Culture', score: 93 },
    ],
    matchReasons: [
      'Scaled engineering org from 40 to 200+ at TechCorp',
      'Deep fintech regulatory experience across SEA markets',
      'Track record of platform modernization on cloud-native stack',
    ],
  },
  {
    id: '2',
    role: 'VP Engineering',
    company: 'TechCorp',
    location: 'Singapore',
    industry: 'SaaS',
    seniority: 'VP',
    fit: 88,
    salary: '$260K – $300K',
    description:
      'Own the core engineering platform for an enterprise SaaS leader. Drive reliability, hiring, and the migration to a multi-tenant architecture.',
    fitBreakdown: [
      { dimension: 'Skills', score: 90 },
      { dimension: 'Experience', score: 87 },
      { dimension: 'Leadership', score: 88 },
      { dimension: 'Culture', score: 87 },
    ],
    matchReasons: [
      '10+ years leading SaaS platform teams',
      'Strong hiring playbook for senior ICs and managers',
      'Experience with multi-tenant migrations',
    ],
  },
  {
    id: '3',
    role: 'Head of Platform',
    company: 'DataPipe',
    location: 'Remote APAC',
    industry: 'Infrastructure',
    seniority: 'Head of',
    fit: 78,
    salary: '$220K – $260K',
    description:
      'Build and lead the platform team powering a high-growth data infrastructure product. Set the technical direction for reliability and developer experience.',
    fitBreakdown: [
      { dimension: 'Skills', score: 80 },
      { dimension: 'Experience', score: 76 },
      { dimension: 'Leadership', score: 79 },
      { dimension: 'Culture', score: 77 },
    ],
    matchReasons: [
      'Background in distributed systems and data platforms',
      'Has run SRE-adjacent functions at scale',
      'Culture alignment with async, remote-first teams',
    ],
  },
  {
    id: '4',
    role: 'CTO',
    company: 'MediSync',
    location: 'Hong Kong',
    industry: 'Healthcare',
    seniority: 'C-Level',
    fit: 68,
    salary: '$280K – $340K',
    description:
      'Define technology strategy for a healthcare platform expanding into Greater Bay Area markets. Balance compliance, security, and rapid product iteration.',
    fitBreakdown: [
      { dimension: 'Skills', score: 70 },
      { dimension: 'Experience', score: 66 },
      { dimension: 'Leadership', score: 69 },
      { dimension: 'Culture', score: 67 },
    ],
    matchReasons: [
      'Adjacent regulated-industry experience',
      'Familiarity with Hong Kong and GBA market dynamics',
      'Some gap in clinical workflow domain knowledge',
    ],
  },
  {
    id: '5',
    role: 'Director of Engineering',
    company: 'ShopWave',
    location: 'London',
    industry: 'Consumer',
    seniority: 'Director',
    fit: 84,
    salary: '£200K – £240K',
    description:
      'Lead consumer-facing engineering for a fast-growing commerce platform. Own the roadmap for checkout, growth, and personalization systems.',
    fitBreakdown: [
      { dimension: 'Skills', score: 86 },
      { dimension: 'Experience', score: 83 },
      { dimension: 'Leadership', score: 84 },
      { dimension: 'Culture', score: 83 },
    ],
    matchReasons: [
      'Consumer platform experience at scale',
      'Strong growth-experimentation background',
      'Has built personalization systems end-to-end',
    ],
  },
];

export function fitTier(fit: number): { dot: string; text: string; label: string } {
  if (fit >= 85) return { dot: 'bg-teal', text: 'text-teal', label: 'Strong' };
  if (fit >= 70) return { dot: 'bg-warning', text: 'text-warning', label: 'Good' };
  return { dot: 'bg-text-muted', text: 'text-text-muted', label: 'Explore' };
}

interface OpportunityListProps {
  opportunities?: Opportunity[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function OpportunityList({
  opportunities = MOCK_OPPORTUNITIES,
  selectedId,
  onSelect,
}: OpportunityListProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary">
      <div className="p-4 border-b border-bg-tertiary">
        <h2 className="font-serif text-lg font-bold text-text-primary">Matched Roles</h2>
        <p className="text-xs text-text-muted mt-0.5">{opportunities.length} opportunities</p>
      </div>
      <div className="divide-y divide-bg-tertiary">
        {opportunities.map((op) => {
          const tier = fitTier(op.fit);
          const selected = selectedId === op.id;
          return (
            <button
              key={op.id}
              onClick={() => onSelect?.(op.id)}
              className={`w-full text-left p-4 transition-colors ${
                selected ? 'bg-accent-10' : 'hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{op.role}</p>
                  <p className="text-sm text-text-muted truncate">{op.company}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {op.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {op.salary}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 ${tier.dot}`} />
                    <span className={`font-serif text-xl font-bold ${tier.text}`}>{op.fit}%</span>
                  </span>
                  <span className={`text-xs ${tier.text}`}>{tier.label}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
