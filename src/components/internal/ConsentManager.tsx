import React, { useState, useMemo } from 'react';
import { Shield } from 'lucide-react';
import { MOCK_CONSENTS } from '@/mocks/internalPortal';

export default function ConsentManager() {
  const [filterType, setFilterType] = useState<string>('all');

  const uniqueTypes = useMemo(() => [...new Set(MOCK_CONSENTS.map((c) => c.type))], []);

  const filtered = useMemo(() => {
    if (filterType === 'all') return MOCK_CONSENTS;
    return MOCK_CONSENTS.filter((c) => c.type === filterType);
  }, [filterType]);

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary flex items-center gap-3">
        <Shield className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-muted">Filter by type:</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary bg-bg-secondary">
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-bg-tertiary hover:bg-bg-secondary transition-colors">
                <td className="px-4 py-3 text-sm text-text-primary font-medium">{entry.user}</td>
                <td className="px-4 py-3 text-sm text-text-primary">{entry.type}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-semibold"
                    style={{
                      borderRadius: 0,
                      backgroundColor: entry.granted ? '#22c55e20' : '#ef444420',
                      color: entry.granted ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {entry.granted ? 'Granted' : 'Denied'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-text-muted">{entry.date}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{entry.expiry || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
