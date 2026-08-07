/**
 * ClientWorkflows — Workflow management page (Phase 8)
 *
 * Integrates the WorkflowBuilder with a workflow list,
 * approval queue, and execution history.
 */
import React from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { WorkflowBuilder } from '@/components/client/WorkflowBuilder';
import { fetchApprovals, fetchWorkflows, approveItem, rejectItem, type WorkflowRecord } from '@/services/clientService';

interface ApprovalItem {
  id: string;
  workflow_id: string;
  workflow_name: string;
  node_title: string;
  requester_name: string;
  status: string;
  created_at: string;
}

export function ClientWorkflows() {
  const [tab, setTab] = React.useState<'builder' | 'approvals' | 'history'>('builder');
  const [workflows, setWorkflows] = React.useState<WorkflowRecord[]>([]);
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = async () => {
    const [w, a] = await Promise.all([
      fetchWorkflows(),
      fetchApprovals('pending'),
    ]);
    setWorkflows(w);
    setApprovals(a);
    setLoading(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    const ok = action === 'approve'
      ? await approveItem(id)
      : await rejectItem(id);
    if (ok) {
      setApprovals(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleWorkflowCreated = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted text-sm">
        <Activity className="w-5 h-5 animate-pulse mr-2" />
        Loading workflows...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Workflows</h1>
        <p className="text-sm text-text-muted">Build and manage custom approval workflows</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bg-tertiary">
        {(['builder', 'approvals', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-transparent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
            style={tab === t ? { borderColor: '#C108AB', color: '#C108AB' } : undefined}
          >
            {t === 'builder' && 'Workflow Builder'}
            {t === 'approvals' && (
              <span className="flex items-center gap-1.5">
                Pending Approvals
                {approvals.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white"
                    style={{ background: '#C108AB' }}
                  >
                    {approvals.length}
                  </span>
                )}
              </span>
            )}
            {t === 'history' && 'History'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'builder' && (
        <WorkflowBuilder onWorkflowCreated={handleWorkflowCreated} />
      )}

      {tab === 'approvals' && (
        <div className="bg-white border border-bg-tertiary">
          <div className="px-4 py-3 border-b border-bg-tertiary flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Pending Approvals</h3>
            <span className="text-xs text-text-muted">{approvals.length} awaiting your review</span>
          </div>
          {approvals.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              <CheckCircle className="w-8 h-8 mx-auto text-teal-500 mb-2" />
              No pending approvals. You're all caught up!
            </div>
          ) : (
            <div className="divide-y divide-bg-tertiary">
              {approvals.map(a => (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{a.node_title}</div>
                    <div className="text-xs text-text-muted">
                      {a.requester_name} · {a.workflow_name}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproval(a.id, 'reject')}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 hover:bg-red-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproval(a.id, 'approve')}
                      className="px-3 py-1.5 text-xs font-medium text-white"
                      style={{ background: '#C108AB' }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white border border-bg-tertiary">
          <div className="px-4 py-3 border-b border-bg-tertiary">
            <h3 className="text-sm font-semibold text-text-primary">Workflow History</h3>
          </div>
          {workflows.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">
              <Clock className="w-8 h-8 mx-auto mb-2 text-text-muted" />
              No workflows created yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-secondary border-b border-bg-tertiary">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted">Trigger</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted">Nodes</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-text-muted">Updated</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map(w => (
                  <tr key={w.id} className="border-b border-bg-tertiary hover:bg-bg-secondary">
                    <td className="px-4 py-2 font-medium text-text-primary">{w.name}</td>
                    <td className="px-4 py-2 text-text-muted text-xs">{w.trigger_type}</td>
                    <td className="px-4 py-2 text-text-muted text-xs">{w.nodes?.length || 0}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 ${
                          w.status === 'active' ? 'bg-teal text-white' :
                          w.status === 'completed' ? 'bg-gray-200 text-gray-600' :
                          'bg-bg-tertiary text-text-muted'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-text-muted">
                      {new Date(w.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientWorkflows;