import React, { useState } from 'react';
import { ClipboardList, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

type ExecutionStatus = 'OK' | 'Slow' | 'Fail';
type StatusFilter = ExecutionStatus | 'All';

interface ExecutionRow {
  time: string;
  rule: string;
  status: ExecutionStatus;
  duration: string;
}

const MOCK_LOGS: ExecutionRow[] = [
  { time: '14:32:01', rule: 'ScoreMatch', status: 'OK', duration: '234ms' },
  { time: '14:31:45', rule: 'EnrichProfile', status: 'OK', duration: '1.2s' },
  { time: '14:30:12', rule: 'BatchScore', status: 'Slow', duration: '8.4s' },
  { time: '14:28:55', rule: 'SendNotif', status: 'Fail', duration: 'timeout' },
  { time: '14:27:30', rule: 'AutoEnrich', status: 'OK', duration: '890ms' },
];

const FILTERS: StatusFilter[] = ['All', 'OK', 'Slow', 'Fail'];

function renderStatus(status: ExecutionStatus) {
  switch (status) {
    case 'OK':
      return (
        <span className="inline-flex items-center gap-1.5 text-teal">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">OK</span>
        </span>
      );
    case 'Slow':
      return (
        <span className="inline-flex items-center gap-1.5 text-warning">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Slow</span>
        </span>
      );
    case 'Fail':
      return (
        <span className="inline-flex items-center gap-1.5 text-error">
          <XCircle className="w-4 h-4" />
          <span className="text-sm">Fail</span>
        </span>
      );
    default:
      return null;
  }
}

export function ExecutionLogViewer() {
  const [filter, setFilter] = useState<StatusFilter>('All');
  const rows =
    filter === 'All' ? MOCK_LOGS : MOCK_LOGS.filter((row) => row.status === filter);

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">EXECUTION LOG</h3>
        </div>
        <div className="flex gap-3 text-xs">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? 'text-accent font-semibold'
                  : 'text-text-muted hover:text-text-primary transition-colors'
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-tertiary text-text-muted text-xs uppercase tracking-wider">
            <th className="text-left py-2 pr-3 font-medium">Time</th>
            <th className="text-left py-2 px-3 font-medium">Rule</th>
            <th className="text-left py-2 px-3 font-medium">Status</th>
            <th className="text-right py-2 pl-3 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.time}-${row.rule}`} className="border-b border-bg-tertiary">
              <td className="py-3 pr-3 text-text-muted font-mono text-xs">{row.time}</td>
              <td className="py-3 px-3 text-text-primary font-medium">{row.rule}</td>
              <td className="py-3 px-3">{renderStatus(row.status)}</td>
              <td className="py-3 pl-3 text-right text-text-secondary font-mono text-xs">
                {row.duration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
