import React from 'react';
import { Download } from 'lucide-react';

interface Report {
  name: string;
  type: string;
}

interface ReportDownloadsProps {
  reports: Report[];
}

export function ReportDownloads({ reports }: ReportDownloadsProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Reports & Downloads</h2>
      
      <div className="space-y-2">
        {reports.map((report) => (
          <button
            key={report.name}
            className="w-full flex items-center justify-between p-3 bg-bg-primary border border-bg-tertiary hover:border-accent/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{report.name}</p>
              <p className="text-xs text-text-muted">{report.type}</p>
            </div>
            <Download className="w-4 h-4 text-text-muted hover:text-accent transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}