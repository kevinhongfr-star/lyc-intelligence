import React from 'react';
import { History } from 'lucide-react';

interface AuditEntry {
  date: string;
  actor: 'Admin' | 'System';
  description: string;
}

const MOCK_ENTRIES: AuditEntry[] = [
  { date: 'Jul 7 14:00', actor: 'Admin', description: 'changed "ScoreMatch" weight' },
  { date: 'Jul 6 09:15', actor: 'Admin', description: 'added rule "AutoEnrich"' },
  { date: 'Jul 5 16:30', actor: 'System', description: 'updated threshold to 75' },
];

export function RuleAuditTrail() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <History className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">RULE AUDIT TRAIL</h3>
      </div>

      <ol>
        {MOCK_ENTRIES.map((entry, idx) => {
          const isLast = idx === MOCK_ENTRIES.length - 1;
          const actorClass = entry.actor === 'Admin' ? 'bg-accent' : 'bg-teal';
          const actorTextClass = entry.actor === 'Admin' ? 'text-accent' : 'text-teal';
          return (
            <li key={`${entry.date}-${idx}`} className="relative flex gap-4 pb-5 last:pb-0">
              <div className="flex flex-col items-center">
                <span className={`w-3 h-3 ${actorClass}`} aria-hidden="true" />
                {!isLast && <span className="w-px flex-1 mt-1 bg-bg-tertiary" aria-hidden="true" />}
              </div>
              <div>
                <div className="text-xs text-text-muted">{entry.date}</div>
                <div className="text-sm text-text-primary mt-1">
                  <span className={`font-semibold ${actorTextClass}`}>{entry.actor}</span>{' '}
                  {entry.description}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
