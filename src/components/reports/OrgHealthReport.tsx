import React from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { OrgRiskOverlay } from './OrgRiskOverlay';
import { SuccessionGap } from './SuccessionGap';

export interface RetentionRisk {
  role: string;
  riskScore: number;
}

export interface VacancyImpact {
  role: string;
  note: string;
}

export interface OrgHealthReportProps {
  retentionRisks?: RetentionRisk[];
  vacancies?: VacancyImpact[];
}

const DEFAULT_RETENTION_RISKS: RetentionRisk[] = [
  { role: 'VP Product — Sarah Wong', riskScore: 82 },
  { role: 'Director, Data — Marc L.', riskScore: 74 },
  { role: 'VP Engineering — David Tan', riskScore: 61 },
];

const DEFAULT_VACANCIES: VacancyImpact[] = [
  { role: 'Director, Data', note: 'Open 4 months — analytics roadmap slipping, 2 PMs unblocked.' },
  { role: 'PM Lead, Core', note: 'Open 6 weeks — Q3 release at risk without backfill.' },
];

function riskTone(score: number): string {
  if (score >= 75) return 'text-error';
  if (score >= 60) return 'text-warning';
  return 'text-teal';
}

export function OrgHealthReport({
  retentionRisks = DEFAULT_RETENTION_RISKS,
  vacancies = DEFAULT_VACANCIES,
}: OrgHealthReportProps) {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          <h2 className="font-serif text-2xl font-bold text-text-primary">ORGANIZATIONAL HEALTH</h2>
        </div>
        <p className="text-text-muted mt-1 ml-7">Risk overlay, succession depth, and vacancy impact.</p>
      </header>

      <OrgRiskOverlay />
      <SuccessionGap />

      {/* Retention Risk */}
      <div className="bg-bg-primary border border-bg-tertiary p-5">
        <h3 className="font-serif text-lg font-bold text-text-primary mb-4">Retention Risk</h3>
        <ul className="divide-y divide-bg-tertiary">
          {retentionRisks.map((r) => (
            <li
              key={r.role}
              className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-text-secondary">{r.role}</span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-32 h-2 bg-bg-tertiary">
                  <div
                    className={`h-full ${r.riskScore >= 75 ? 'bg-error' : r.riskScore >= 60 ? 'bg-warning' : 'bg-teal'}`}
                    style={{ width: `${Math.min(100, r.riskScore)}%` }}
                  />
                </div>
                <span className={`text-sm font-bold tabular-nums w-10 text-right ${riskTone(r.riskScore)}`}>
                  {r.riskScore}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Vacancy Impact */}
      <div className="bg-bg-primary border border-bg-tertiary p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">Vacancy Impact</h3>
        </div>
        <ul className="space-y-4">
          {vacancies.map((v) => (
            <li key={v.role} className="border-l-2 border-accent pl-4">
              <div className="font-serif text-text-primary font-medium">{v.role}</div>
              <p className="text-sm text-text-secondary mt-1">{v.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
