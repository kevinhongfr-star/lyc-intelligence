/**
 * AuditLogPage — Security audit trail viewer
 * Issue #35: Audit Logging
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Clock,
  User,
  Monitor,
  ChevronDown,
  Download,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface AuditEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  user_id: string | null;
  user_email: string | null;
  ip_address: string;
  created_at: string;
  metadata: Record<string, any>;
}

export function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/audit', { credentials: 'include' }),
        fetch('/api/audit/stats', { credentials: 'include' }),
      ]);
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        setEvents(eData.data || []);
      }
      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.data);
      }
    } catch {
      setEvents(MOCK_EVENTS);
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = events.filter((e) => {
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q) ||
        e.user_email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B6B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-1">
                <Shield className="h-4 w-4" />
                Security
              </div>
              <h1 className="text-[24px] font-serif text-[#1A1A1A]">Audit Log</h1>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Clock className="h-4 w-4" />} label="Today" value={stats.today_events} />
            <StatCard icon={<Clock className="h-4 w-4" />} label="This Week" value={stats.week_events} />
            <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Warnings" value={stats.severity_distribution?.warning || 0} />
            <StatCard icon={<XCircle className="h-4 w-4" />} label="Errors" value={stats.severity_distribution?.error || 0} />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Search audit events..."
              value={filter}
              onChange={(e: any) => setFilter(e.target.value)}
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9B9B9B]" />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-md border border-[#E5E5E5] px-3 py-2 text-[13px] bg-white"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Events Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                  <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium py-3 px-4">Severity</th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium py-3 px-4">Event</th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium py-3 px-4">User</th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium py-3 px-4">IP</th>
                  <th className="text-left text-[11px] uppercase tracking-wide text-[#9B9B9B] font-medium py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <AuditEventRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#9B9B9B] mb-1">
          {icon}
          {label}
        </div>
        <div className="text-[24px] font-serif text-[#1A1A1A]">{value}</div>
      </CardContent>
    </Card>
  );
}

function AuditEventRow({ event }: { event: AuditEvent }) {
  const severityConfig = {
    info: { icon: <Info className="h-4 w-4 text-blue-500" />, badge: 'outline' as const },
    warning: { icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, badge: 'warning' as const },
    error: { icon: <XCircle className="h-4 w-4 text-red-500" />, badge: 'danger' as const },
    critical: { icon: <AlertTriangle className="h-4 w-4 text-red-600" />, badge: 'default' as const },
  };

  const config = severityConfig[event.severity];

  return (
    <tr className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {config.icon}
          <Badge variant={config.badge} size="sm">{event.severity}</Badge>
        </div>
      </td>
      <td className="py-3 px-4">
        <p className="text-[13px] font-medium text-[#1A1A1A]">{event.action}</p>
        <p className="text-[12px] text-[#6B6B6B]">{event.description}</p>
      </td>
      <td className="py-3 px-4">
        {event.user_email ? (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-[#9B9B9B]" />
            <span className="text-[12px] text-[#6B6B6B]">{event.user_email}</span>
          </div>
        ) : (
          <span className="text-[12px] text-[#9B9B9B]">Anonymous</span>
        )}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <Monitor className="h-3 w-3 text-[#9B9B9B]" />
          <span className="text-[12px] text-[#6B6B6B]">{event.ip_address}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-[12px] text-[#9B9B9B]">
          {new Date(event.created_at).toLocaleTimeString()}
        </span>
      </td>
    </tr>
  );
}

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: 'audit_001',
    event_type: 'auth',
    entity_type: 'user',
    entity_id: 'user_001',
    action: 'login',
    description: 'User logged in',
    severity: 'info',
    user_id: 'user_001',
    user_email: 'admin@lyc-intelligence.com',
    ip_address: '192.168.1.1',
    created_at: '2026-07-17T10:30:00Z',
    metadata: {},
  },
  {
    id: 'audit_002',
    event_type: 'data',
    entity_type: 'mandate',
    entity_id: 'mandate_001',
    action: 'update',
    description: 'Mandate status updated to active',
    severity: 'info',
    user_id: 'user_001',
    user_email: 'admin@lyc-intelligence.com',
    ip_address: '192.168.1.1',
    created_at: '2026-07-17T10:35:00Z',
    metadata: {},
  },
  {
    id: 'audit_003',
    event_type: 'security',
    entity_type: 'user',
    entity_id: 'user_002',
    action: 'password_changed',
    description: 'User changed password',
    severity: 'info',
    user_id: 'user_002',
    user_email: 'user@example.com',
    ip_address: '192.168.1.2',
    created_at: '2026-07-17T11:00:00Z',
    metadata: {},
  },
  {
    id: 'audit_004',
    event_type: 'admin',
    entity_type: 'user',
    entity_id: 'user_003',
    action: 'role_changed',
    description: 'Admin changed user role',
    severity: 'warning',
    user_id: 'user_001',
    user_email: 'admin@lyc-intelligence.com',
    ip_address: '192.168.1.1',
    created_at: '2026-07-17T11:30:00Z',
    metadata: {},
  },
  {
    id: 'audit_005',
    event_type: 'auth',
    entity_type: 'user',
    entity_id: null,
    action: 'login_failed',
    description: 'Failed login attempt',
    severity: 'warning',
    user_id: null,
    user_email: null,
    ip_address: '10.0.0.5',
    created_at: '2026-07-17T12:00:00Z',
    metadata: {},
  },
];

const MOCK_STATS = {
  today_events: 142,
  week_events: 1284,
  severity_distribution: { info: 1024, warning: 156, error: 34, critical: 2 },
};