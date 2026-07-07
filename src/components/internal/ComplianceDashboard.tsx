import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

interface ComplianceStatus {
  framework: string;
  status: string;
}

const MOCK_STATUSES: ComplianceStatus[] = [
  { framework: 'GDPR', status: 'Compliant' },
  { framework: 'PIPL', status: 'Compliant' },
];

export function ComplianceDashboard() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">COMPLIANCE STATUS</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_STATUSES.map((s) => (
          <div
            key={s.framework}
            className="bg-bg-secondary border border-bg-tertiary p-5 flex items-center gap-4"
          >
            <CheckCircle2 className="w-8 h-8 text-teal shrink-0" />
            <div>
              <div className="font-serif text-lg font-bold text-text-primary">{s.framework}</div>
              <div className="text-sm text-teal font-medium">{s.status}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-text-muted">Last audit: Jul 1, 2026</div>
    </div>
  );
}
