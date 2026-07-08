import React, { useState } from 'react';
import { Clock, Filter } from 'lucide-react';
import { MOCK_EXECUTION_LOGS } from '@/mocks/internalPortal';

const statusColors: Record<string, string> = {
  completed: 'bg-green-500/15 text-green-700',
  running: 'bg-amber-500/15 text-amber-700',
  failed: 'bg-red-500/15 text-red-600',
};

export default function OpsExecutionLogs() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all'
    ? MOCK_EXECUTION_LOGS
    : MOCK_EXECUTION_LOGS.filter(l => l.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-bg-tertiary">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-secondary text-text-muted text-left">
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-t border-bg-tertiary hover:bg-bg-secondary transition-colors">
                <td className="px-4 py-3 font-medium text-text-primary">{log.agent}</td>
                <td className="px-4 py-3 text-text-secondary">{log.action}</td>
                <td className="px-4 py-3 text-text-secondary">{log.target}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${statusColors[log.status]}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.duration}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">No logs matching this filter.</p>
      )}
    </div>
  );
}
