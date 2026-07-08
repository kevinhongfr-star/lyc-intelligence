import React, { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import { MOCK_AUDIT_LOG } from '@/mocks/internalPortal';

export default function AuditLog() {
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [search, setSearch] = useState('');

  const uniqueUsers = useMemo(() => [...new Set(MOCK_AUDIT_LOG.map((l) => l.user))], []);
  const uniqueActions = useMemo(() => [...new Set(MOCK_AUDIT_LOG.map((l) => l.action))], []);

  const filtered = useMemo(() => {
    return MOCK_AUDIT_LOG.filter((entry) => {
      if (filterUser !== 'all' && entry.user !== filterUser) return false;
      if (filterAction !== 'all' && entry.action !== filterAction) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          entry.user.toLowerCase().includes(s) ||
          entry.action.toLowerCase().includes(s) ||
          entry.target.toLowerCase().includes(s) ||
          entry.ip.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [filterUser, filterAction, search]);

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary focus:border-accent"
            style={{ borderRadius: 0 }}
          />
        </div>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Users</option>
          {uniqueUsers.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 text-sm bg-bg-primary border border-bg-tertiary text-text-primary"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bg-tertiary bg-bg-secondary">
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Target</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="border-b border-bg-tertiary hover:bg-bg-secondary transition-colors">
                <td className="px-4 py-3 text-sm text-text-primary font-medium">{entry.user}</td>
                <td className="px-4 py-3 text-sm text-text-primary">{entry.action}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{entry.target}</td>
                <td className="px-4 py-3 text-sm text-text-muted font-mono">{entry.ip}</td>
                <td className="px-4 py-3 text-sm text-text-muted">{entry.timestamp}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No audit entries match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
