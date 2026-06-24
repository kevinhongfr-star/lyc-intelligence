import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ChevronRight,
  User,
  Shield,
  CreditCard,
  UserX,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MOCK_AUDIT = [
  { id: '1', action: 'credit_grant', user: 'kevin@lycintelligence.com', target: 'alex@lycintelligence.com', resource_type: 'credits', detail: '+500 credits: Monthly allocation', ip: '203.0.113.42', time: '2024-06-24T10:05:00Z' },
  { id: '2', action: 'user_disabled', user: 'kevin@lycintelligence.com', target: 'old@lycintelligence.com', resource_type: 'profile', detail: 'Account disabled', ip: '203.0.113.42', time: '2024-06-24T09:12:00Z' },
  { id: '3', action: 'role_change', user: 'kevin@lycintelligence.com', target: 'new_consultant@lycintelligence.com', resource_type: 'profile', detail: 'Role changed: consultant → team_lead', ip: '203.0.113.42', time: '2024-06-24T08:30:00Z' },
  { id: '4', action: 'mandate_created', user: 'alex@lycintelligence.com', target: 'TechCorp VP Engineering', resource_type: 'mandate', detail: 'New mandate created', ip: '198.51.100.15', time: '2024-06-24T07:45:00Z' },
  { id: '5', action: 'candidate_created', user: 'sarah@lycintelligence.com', target: 'Michael Chen', resource_type: 'candidate', detail: 'Profile imported from LinkedIn', ip: '198.51.100.23', time: '2024-06-23T16:20:00Z' },
  { id: '6', action: 'credit_bulk', user: 'kevin@lycintelligence.com', target: '12 users', resource_type: 'credits', detail: 'Bulk grant: +3,000 credits via CSV', ip: '203.0.113.42', time: '2024-06-23T11:00:00Z' },
  { id: '7', action: 'assessment_completed', user: 'jane@candidate.com', target: 'Leadership Assessment', resource_type: 'assessment', detail: 'Assessment submitted, score: 85', ip: '192.0.2.50', time: '2024-06-23T10:30:00Z' },
  { id: '8', action: 'proposal_sent', user: 'mike@lycintelligence.com', target: 'Retail Group CDO', resource_type: 'mandate', detail: 'Proposal sent to client', ip: '198.51.100.31', time: '2024-06-22T14:00:00Z' },
  { id: '9', action: 'password_reset', user: 'admin', target: 'user@lycintelligence.com', resource_type: 'auth', detail: 'Password reset by admin', ip: '203.0.113.42', time: '2024-06-22T09:00:00Z' },
  { id: '10', action: 'credit_adjustment', user: 'kevin@lycintelligence.com', target: 'sarah@lycintelligence.com', resource_type: 'credits', detail: '-30 credits: Correction', ip: '203.0.113.42', time: '2024-06-21T15:00:00Z' },
];

const ACTION_TYPES = ['all', 'credit_grant', 'credit_bulk', 'credit_adjustment', 'user_disabled', 'role_change', 'mandate_created', 'proposal_sent', 'assessment_completed', 'password_reset'];
const RESOURCE_TYPES = ['all', 'credits', 'profile', 'mandate', 'candidate', 'assessment', 'auth'];

export function AuditLogViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const filtered = MOCK_AUDIT.filter((entry) => {
    const matchesSearch = !searchQuery ||
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.detail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesResource = resourceFilter === 'all' || entry.resource_type === resourceFilter;
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'credit_grant': case 'credit_bulk': case 'credit_adjustment':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'user_disabled': return <UserX className="w-4 h-4 text-red-500" />;
      case 'role_change': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'mandate_created': case 'proposal_sent': return <Briefcase className="w-4 h-4 text-accent" />;
      case 'candidate_created': case 'assessment_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'password_reset': return <User className="w-4 h-4 text-amber-500" />;
      default: return <FileText className="w-4 h-4 text-text-muted" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'credit_grant': case 'credit_bulk': case 'credit_adjustment':
        return 'bg-green-500/10';
      case 'user_disabled': return 'bg-red-500/10';
      case 'role_change': return 'bg-blue-500/10';
      case 'password_reset': return 'bg-amber-500/10';
      default: return 'bg-bg-tertiary';
    }
  };

  const getActionBadge = (action: string) => {
    const labels: Record<string, string> = {
      credit_grant: 'Credit Grant',
      credit_bulk: 'Bulk Credit',
      credit_adjustment: 'Credit Adjust',
      user_disabled: 'User Disabled',
      role_change: 'Role Change',
      mandate_created: 'Mandate Created',
      candidate_created: 'Candidate Created',
      proposal_sent: 'Proposal Sent',
      assessment_completed: 'Assessment Done',
      password_reset: 'Password Reset',
    };
    return labels[action] || action;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatActionLabel = (action: string) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Audit Log</h1>
          <p className="text-text-muted">{MOCK_AUDIT.length} entries · Append-only</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search users, targets, details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm">
              <option value="all">All Actions</option>
              {ACTION_TYPES.filter(a => a !== 'all').map((a) => (
                <option key={a} value={a}>{formatActionLabel(a)}</option>
              ))}
            </select>
            <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm">
              <option value="all">All Resources</option>
              {RESOURCE_TYPES.filter(r => r !== 'all').map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary">
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Action</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">User</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Target</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Resource</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Detail</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">IP</th>
                <th className="text-left text-xs text-text-muted font-medium px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getActionColor(entry.action)}`}>
                        {getActionIcon(entry.action)}
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {getActionBadge(entry.action)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-primary">{entry.user}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-secondary">{entry.target}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-[10px]">{entry.resource_type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-muted max-w-xs truncate block">{entry.detail}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted font-mono">{entry.ip}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-text-muted">{formatDate(entry.time)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">No audit entries matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">Showing {filtered.length} of {MOCK_AUDIT.length} entries (max 1000)</p>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  );
}
