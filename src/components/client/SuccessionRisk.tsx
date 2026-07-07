import React from 'react';

interface RiskItem {
  role: string;
  person: string;
  risk: string;
  bench: string;
}

interface SuccessionRiskProps {
  risks: RiskItem[];
}

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-teal/10 text-teal',
  Medium: 'bg-warning/10 text-warning',
  High: 'bg-error/10 text-error',
};

export function SuccessionRisk({ risks }: SuccessionRiskProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Succession & Retention Risk</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Person</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Risk Level</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Bench Strength</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr key={risk.role} className="border-b border-bg-tertiary">
                <td className="py-3 px-4 text-sm font-medium text-text-primary">{risk.role}</td>
                <td className="py-3 px-4 text-sm text-text-secondary">{risk.person}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 text-xs font-medium ${RISK_COLORS[risk.risk] || 'bg-bg-tertiary text-text-muted'}`}>
                    {risk.risk}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-text-muted">{risk.bench}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}