/**
 * WorkflowBuilder — Custom workflow editor (Phase 8)
 *
 * Visual workflow builder that allows client users to:
 *   - Create multi-step approval chains
 *   - Add node types (review, approval, notify, escalate, close)
 *   - Set assignees and due dates per node
 *   - Preview workflow execution order
 *   - Trigger workflows manually
 */
import React from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Play,
  Save,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  GitBranch,
  Activity,
} from 'lucide-react';
import { createWorkflow, fetchWorkflows, type WorkflowRecord } from '@/services/clientService';

type NodeType = 'trigger' | 'review_candidates' | 'collect_feedback' | 'approval_chain' | 'notify' | 'escalate' | 'close';

const NODE_TYPES: { type: NodeType; label: string; color: string; description: string }[] = [
  { type: 'trigger', label: 'Trigger', color: '#6366F1', description: 'Start the workflow' },
  { type: 'review_candidates', label: 'Review Candidates', color: '#C108AB', description: 'Candidate review step' },
  { type: 'collect_feedback', label: 'Collect Feedback', color: '#0891B2', description: 'Gather stakeholder feedback' },
  { type: 'approval_chain', label: 'Approval Chain', color: '#D97706', description: 'Sequential approvals' },
  { type: 'notify', label: 'Notify', color: '#10B981', description: 'Send notifications' },
  { type: 'escalate', label: 'Escalate', color: '#EF4444', description: 'Escalate to management' },
  { type: 'close', label: 'Close', color: '#6B7280', description: 'End the workflow' },
];

interface WorkflowNode {
  id: string;
  type: NodeType;
  title: string;
  assignees: string[];
  due_days: number | null;
  status: 'pending' | 'completed' | 'failed';
}

interface Props {
  mandateId?: string;
  onWorkflowCreated?: () => void;
}

export function WorkflowBuilder({ mandateId, onWorkflowCreated }: Props) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [nodes, setNodes] = React.useState<WorkflowNode[]>([]);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [existingWorkflows, setExistingWorkflows] = React.useState<WorkflowRecord[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const wfs = await fetchWorkflows();
      if (!cancelled) setExistingWorkflows(wfs);
    })();
    return () => { cancelled = true; };
  }, []);

  const addNode = (type: NodeType) => {
    const meta = NODE_TYPES.find(n => n.type === type)!;
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title: meta.label,
      assignees: [],
      due_days: null,
      status: 'pending',
    };
    setNodes(prev => [...prev, newNode]);
    setExpanded(prev => new Set(prev).add(newNode.id));
  };

  const updateNode = (id: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
  };

  const moveNode = (id: string, direction: 'up' | 'down') => {
    setNodes(prev => {
      const idx = prev.findIndex(n => n.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
      return copy;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addAssignee = (id: string, assignee: string) => {
    setNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, assignees: [...n.assignees, assignee] } : n)),
    );
  };

  const removeAssignee = (id: string, assignee: string) => {
    setNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, assignees: n.assignees.filter(a => a !== assignee) } : n)),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a workflow name');
      return;
    }
    if (nodes.length === 0) {
      setError('Please add at least one node');
      return;
    }

    setSaving(true);
    setError('');

    const ok = await createWorkflow({
      name: name.trim(),
      description: description.trim() || undefined,
      trigger_type: 'manual',
      mandate_id: mandateId,
      nodes: nodes.map((n, i) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        config: {},
        order: i,
        status: 'pending',
        assignees: n.assignees,
        due_at: n.due_days ? new Date(Date.now() + n.due_days * 86400000).toISOString() : null,
        completed_at: null,
        outputs: {},
      })),
    });

    setSaving(false);

    if (ok) {
      setName('');
      setDescription('');
      setNodes([]);
      onWorkflowCreated?.();
      // Refresh workflows list
      const wfs = await fetchWorkflows();
      setExistingWorkflows(wfs);
    } else {
      setError('Failed to save workflow');
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing workflows */}
      {existingWorkflows.length > 0 && (
        <div className="bg-white border border-bg-tertiary">
          <div className="px-4 py-3 border-b border-bg-tertiary">
            <h3 className="text-sm font-semibold text-text-primary">Existing Workflows</h3>
          </div>
          <div className="divide-y divide-bg-tertiary">
            {existingWorkflows.slice(0, 5).map(w => (
              <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-text-primary">{w.name}</div>
                  <div className="text-xs text-text-muted">
                    {w.nodes?.length || 0} nodes · {w.status}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 ${
                    w.status === 'active' ? 'bg-teal text-white' :
                    w.status === 'completed' ? 'bg-gray-200 text-gray-600' :
                    'bg-bg-tertiary text-text-muted'
                  }`}
                >
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Builder */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">Workflow Builder</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Name & description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Executive Search Approval"
                className="w-full mt-1 px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full mt-1 px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
              />
            </div>
          </div>

          {/* Add node buttons */}
          <div>
            <label className="text-xs font-medium text-text-muted">Add Node</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {NODE_TYPES.map(nt => (
                <button
                  key={nt.type}
                  type="button"
                  onClick={() => addNode(nt.type)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white"
                  style={{ background: nt.color }}
                  title={nt.description}
                >
                  <Plus className="w-3 h-3" />
                  {nt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nodes list */}
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <GitBranch className="w-8 h-8 mb-2" />
              <p className="text-sm">No nodes yet. Add a node to start building.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nodes.map((node, index) => {
                const meta = NODE_TYPES.find(n => n.type === node.type)!;
                const isExpanded = expanded.has(node.id);
                return (
                  <div
                    key={node.id}
                    className="border border-bg-tertiary overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-secondary"
                      onClick={() => toggleExpand(node.id)}
                    >
                      <GripVertical className="w-3 h-3 text-text-muted" />
                      <span
                        className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: meta.color }}
                      >
                        {index + 1}
                      </span>
                      <span
                        className="w-2 h-2"
                        style={{ background: meta.color }}
                      />
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      )}
                      <span className="text-sm font-medium text-text-primary flex-1">{node.title}</span>
                      <span className="text-xs text-text-muted">{meta.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'up'); }}
                          disabled={index === 0}
                          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveNode(node.id, 'down'); }}
                          disabled={index === nodes.length - 1}
                          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                          className="p-1 text-text-muted hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-3 py-3 border-t border-bg-tertiary bg-bg-secondary space-y-3">
                        <div>
                          <label className="text-xs font-medium text-text-muted">Title</label>
                          <input
                            type="text"
                            value={node.title}
                            onChange={e => updateNode(node.id, { title: e.target.value })}
                            className="w-full mt-1 px-2 py-1 text-sm bg-white border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
                          />
                        </div>

                        {node.type === 'approval_chain' && (
                          <div>
                            <label className="text-xs font-medium text-text-muted">Assignees (approvers)</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {node.assignees.map(a => (
                                <span
                                  key={a}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white border border-bg-tertiary"
                                >
                                  <User className="w-3 h-3" />
                                  {a}
                                  <button
                                    onClick={() => removeAssignee(node.id, a)}
                                    className="hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="Add assignee email"
                                className="flex-1 px-2 py-1 text-sm bg-white border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const v = (e.target as HTMLInputElement).value.trim();
                                    if (v) {
                                      addAssignee(node.id, v);
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-medium text-text-muted">Due in days (optional)</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-text-muted" />
                            <input
                              type="number"
                              min={0}
                              placeholder="e.g., 3"
                              value={node.due_days ?? ''}
                              onChange={e => updateNode(node.id, { due_days: e.target.value ? parseInt(e.target.value) : null })}
                              className="w-24 px-2 py-1 text-sm bg-white border border-bg-tertiary focus:border-[#C108AB] focus:outline-none"
                            />
                            <span className="text-xs text-text-muted">days</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 border border-red-300 bg-red-50 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-bg-tertiary">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: '#C108AB' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Workflow'}
            </button>
            <button
              type="button"
              onClick={() => { setNodes([]); setName(''); setDescription(''); }}
              className="px-3 py-2 text-sm font-medium text-text-secondary border border-bg-tertiary hover:bg-bg-tertiary"
            >
              Clear
            </button>
            <div className="ml-auto text-xs text-text-muted flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} configured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilder;