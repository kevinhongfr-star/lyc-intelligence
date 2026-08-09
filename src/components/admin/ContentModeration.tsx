/**
 * ContentModeration — Content review queue with flag, approve, reject, remove.
 */
import React, { useState, useEffect } from 'react';
import {
  Flag,
  CheckCircle,
  XCircle,
  Trash2,
  RotateCcw,
  Search,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  author_id: string;
  status: string;
  flag_reason: string | null;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  removed: 'bg-gray-100 text-gray-700',
};

const CONTENT_TYPE_ICONS: Record<string, string> = {
  comment: '💬',
  post: '📝',
  document: '📄',
  profile: '👤',
  campaign: '📢',
  message: '✉️',
};

const ContentModeration: React.FC = () => {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, removed: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [queueResult, statsResult] = await Promise.all([
        adminService.moderation.queue(statusFilter ? { status: statusFilter } : {}),
        adminService.moderation.stats(),
      ]);
      setItems(queueResult.items);
      setStats({
        pending: 0, approved: 0, rejected: 0, removed: 0,
        ...statsResult.stats,
      });
    } catch (err) {
      console.error('Failed to load moderation data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(item => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      item.content_type.toLowerCase().includes(term) ||
      (item.flag_reason || '').toLowerCase().includes(term) ||
      item.content_id.toLowerCase().includes(term)
    );
  });

  async function handleAction(id: string, action: 'approve' | 'reject' | 'remove' | 'restore') {
    setActionLoading(id);
    const note = noteInput[id] || '';
    try {
      if (action === 'approve') {
        await adminService.moderation.review(id, { status: 'approved', notes: note });
      } else if (action === 'reject') {
        await adminService.moderation.review(id, { status: 'rejected', notes: note });
      } else if (action === 'remove') {
        if (!confirm('Permanently remove this content?')) return;
        await adminService.moderation.remove(id, note || 'Admin removal');
      } else if (action === 'restore') {
        await adminService.moderation.restore(id, note || 'Admin restore');
      }
      setNoteInput(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadData();
    } catch (err) {
      alert('Action failed:' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Content Moderation</h1>
        <p className="text-sm text-text-muted mt-1">
          Review, approve, reject, and remove user-generated content.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Pending" value={stats.pending} icon={<AlertTriangle className="w-4 h-4" />} color="bg-amber-50 text-amber-700" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="w-4 h-4" />} color="bg-green-50 text-green-700" />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="w-4 h-4" />} color="bg-red-50 text-red-700" />
        <StatCard label="Removed" value={stats.removed} icon={<Trash2 className="w-4 h-4" />} color="bg-gray-100 text-gray-700" />
        <StatCard label="Total Today" value={0} icon={<Flag className="w-4 h-4" />} color="bg-fuchsia/10 text-fuchsia" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search by type, reason, or ID..."
            className="pl-10 pr-4 py-2 bg-white border border-border text-sm w-64 focus:outline-none focus:border-fuchsia"
          />
        </div>

        <div className="flex gap-1">
          {['', 'pending', 'approved', 'rejected', 'removed'].map(s => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-fuchsia text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-bg-warm'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-text-muted">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading moderation queue...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-border p-12 text-center text-text-muted">
            No moderation items found.
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white border border-border p-4 flex flex-col md:flex-row md:items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{CONTENT_TYPE_ICONS[item.content_type] || '📄'}</span>
                  <span className="font-medium capitalize text-sm">{item.content_type}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-700'}`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-text-secondary mb-2">
                  <span className="font-medium">Flag reason:</span> {item.flag_reason || 'No reason provided'}
                </p>

                <p className="text-xs text-text-muted">
                  Content ID: <code className="bg-bg px-1 py-0.5">{item.content_id}</code>
                  {'·'}
                  Reported: {new Date(item.created_at).toLocaleString()}
                </p>

                {item.review_notes && (
                  <p className="mt-2 text-xs bg-bg p-2">
                    <span className="font-medium">Review notes:</span> {item.review_notes}
                  </p>
                )}

                {item.status === 'pending' && (
                  <input
                    type="text"
                    value={noteInput[item.id] || ''}
                    onChange={e => setNoteInput({ ...noteInput, [item.id]: e.target.value })}
                    placeholder="Add review notes (optional)..."
                    className="mt-3 w-full px-3 py-2 bg-bg border border-border text-xs focus:outline-none focus:border-fuchsia"
                  />
                )}
              </div>

              <div className="flex md:flex-col gap-2 md:gap-1">
                {item.status === 'pending' || item.status === 'rejected' ? (
                  <button
                    onClick={() => handleAction(item.id, 'approve')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Approve
                  </button>
                ) : null}

                {item.status === 'pending' || item.status === 'approved' ? (
                  <button
                    onClick={() => handleAction(item.id, 'reject')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Reject
                  </button>
                ) : null}

                {item.status !== 'removed' ? (
                  <button
                    onClick={() => handleAction(item.id, 'remove')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(item.id, 'restore')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 text-xs font-medium bg-fuchsia/10 text-fuchsia border border-fuchsia/20 hover:bg-fuchsia/20 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({
  label, value, icon, color,
}) => (
  <div className="bg-white border border-border p-4">
    <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
      <span className={`p-1 ${color}`}>{icon}</span>
      {label}
    </div>
    <p className="text-2xl font-serif font-semibold">{value}</p>
  </div>
);

export default ContentModeration;
