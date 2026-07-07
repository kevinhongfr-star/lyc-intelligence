import React from 'react';
import { FileText } from 'lucide-react';

interface AuditEntry {
  date: string;
  description: string;
}

const MOCK_ENTRIES: AuditEntry[] = [
  { date: 'Jul 7', description: 'Data export requested (candidate #428)' },
  { date: 'Jul 5', description: 'Consent updated (user #312 — marketing off)' },
  { date: 'Jul 3', description: 'Data retention cleanup: 14 records purged' },
];

export function DataAuditLog() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">DATA PROCESSING AUDIT LOG</h3>
      </div>

      <ul>
        {MOCK_ENTRIES.map((entry, idx) => (
          <li
            key={`${entry.date}-${idx}`}
            className="flex items-baseline gap-3 py-3 border-b border-bg-tertiary last:border-b-0"
          >
            <span className="text-xs text-text-muted font-mono w-12 shrink-0">{entry.date}</span>
            <span className="text-sm text-text-primary">{entry.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
