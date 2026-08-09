/**
 * AuditLog — Audit trail viewer for admin actions.
 */
import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  Calendar,
  Loader2,
  FileText,
  User,
  Action,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface AuditEntry {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: any;
  ip_address: string | null;
  created_at: string;
}

const AuditLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    loadData();
  }, [actionFilter, actorFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (actorFilter) params.actor_id = actorFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const [logData, statsData] = await Promise.all([
        adminService.audit.list(params),
        adminService.audit.stats(),
      ]);
      setEntries(logData.entries);
      setStats(statsData.stats);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredEntries = entries.filter(e => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      e.action.toLowerCase().includes(term) ||
      e.actor_id.toLowerCase().includes(term) ||
      (e.entity_id || '').toLowerCase().includes(term) ||
      (e.metadata ? JSON.stringify(e.metadata).toLowerCase().includes(term) : false)
    );
  });

  async function handleExport() {
    try {
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (actorFilter) params.actor_id = actorFilter;
      const { csv } = await adminService.audit.export(params);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed:' + (err as Error).message);
    }
  }

  const uniqueActions = [...new Set(entries.map(e => e.action))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Audit Log</h1>
          <p className="text-sm text-text-muted mt-1">
            Comprehensive trail of all admin actions across the platform.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-border text-sm font-medium hover:bg-bg-warm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">Total Entries</p>
            <p className="text-2xl font-serif font-semibold">{stats.total_entries || 0}</p>
          </div>
          <div className="bg-white border border-border p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">Unique Actors</p>
            <p className="text-2xl font-serif font-semibold">{stats.unique_actors || 0}</p>
          </div>
          <div className="bg-white border border-border p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">Actions Today</p>
            <p className="text-2xl font-serif font-semibold">{stats.actions_today || 0}</p>
          </div>
          <div className="bg-white border border-border p-4">
            <p className="text-xs text-text-muted uppercase tracking-wider">Most Common</p>
            <p className="text-lg font-serif font-semibold truncate">
              {stats.most_common_actions?.[0]?.action?.replace(/_/g, '') || '—'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actions, actors, IDs..."
            className="pl-10 pr-4 py-2 bg-white border border-border text-sm w-64 focus:outline-none focus:border-fuchsia"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-border text-sm focus:outline-none focus:border-fuchsia"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-text-muted" />
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-2 bg-white border border-border text-xs focus:outline-none focus:border-fuchsia"
          />
          <span className="text-text-muted text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-2 py-2 bg-white border border-border text-xs focus:outline-none focus:border-fuchsia"
          />
        </div>
      </div>

      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-text-secondary">Timestamp</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Actor</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Action</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Entity</th>
                <th className="px-4 py-3 font-medium text-text-secondary">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading audit log...
                    </div>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="border-t border-border hover:bg-bg-warm cursor-pointer"
                  >
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{entry.actor_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs bg-fuchsia/10 text-fuchsia font-medium">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {entry.entity_type}
                      {entry.entity_id && `: ${entry.entity_id}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{entry.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white border border-border p-6 w-full max-w-lg"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-fuchsia" />
              Audit Entry Details
            </h3>
            <div className="space-y-3 text-sm">
              <DetailRow label="ID" value={selectedEntry.id} />
              <DetailRow label="Timestamp" value={new Date(selectedEntry.created_at).toLocaleString()} />
              <DetailRow label="Actor" value={selectedEntry.actor_id} />
              <DetailRow label="Action" value={selectedEntry.action} />
              <DetailRow label="Entity Type" value={selectedEntry.entity_type} />
              <DetailRow label="Entity ID" value={selectedEntry.entity_id || '—'} />
              <DetailRow label="IP Address" value={selectedEntry.ip_address || '—'} />
              <DetailRow label="Metadata" value={selectedEntry.metadata ? JSON.stringify(selectedEntry.metadata, null, 2) : '—'} mono />
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
              className="mt-6 w-full px-4 py-2 bg-fuchsia text-white text-sm font-medium hover:bg-fuchsia/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex">
    <span className="w-32 text-text-muted text-xs">{label}</span>
    <span className={`flex-1 ${mono ? 'font-mono text-xs bg-bg p-2 break-all' : ''}`}>{value}</span>
  </div>
);

export default AuditLog;
