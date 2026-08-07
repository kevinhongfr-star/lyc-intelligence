/**
 * clientWorkflowEngine — Custom workflows, approval chains (Phase 8)
 *
 * Routes:
 *   GET    /api/client-workflow/workflows           — List client workflows
 *   POST   /api/client-workflow/workflows           — Create new workflow
 *   GET    /api/client-workflow/workflows/:id       — Get workflow detail
 *   PATCH  /api/client-workflow/workflows/:id       — Update workflow
 *   POST   /api/client-workflow/workflows/:id/activate — Activate workflow
 *   POST   /api/client-workflow/workflows/:id/deactivate — Deactivate workflow
 *   POST   /api/client-workflow/workflows/:id/execute  — Execute workflow
 *   GET    /api/client-workflow/approvals           — List approval items
 *   POST   /api/client-workflow/approvals/:id/approve  — Approve
 *   POST   /api/client-workflow/approvals/:id/reject   — Reject
 *   POST   /api/client-workflow/approvals/:id/delegate — Delegate
 *
 * Pure-logic workflow engine with node graph execution.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 30;

// ── Types ───────────────────────────────────────────────────────────────

export type WorkflowNodeType =
  | 'trigger'
  | 'review_candidates'
  | 'collect_feedback'
  | 'approval_chain'
  | 'notify'
  | 'escalate'
  | 'close';

export type NodeStatus = 'pending' | 'active' | 'completed' | 'failed' | 'skipped';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  config: Record<string, any>;
  order: number;
  status: NodeStatus;
  assignees: string[];
  due_at: string | null;
  completed_at: string | null;
  outputs: Record<string, any>;
}

export interface Workflow {
  id: string;
  client_account_id: string;
  mandate_id: string | null;
  name: string;
  description: string | null;
  trigger_type: 'mandate_created' | 'shortlist_shared' | 'interview_scheduled' | 'manual';
  status: 'draft' | 'active' | 'paused' | 'completed';
  nodes: WorkflowNode[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalItem {
  id: string;
  workflow_id: string;
  node_id: string;
  candidate_id: string | null;
  mandidate_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  decision: string | null;
  comments: string | null;
  created_at: string;
  decided_at: string | null;
}

// ── Main handler ────────────────────────────────────────────────────────

export async function handleClientWorkflow(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    if (resource === 'workflows' && !id && req.method === 'GET') return handleListWorkflows(req, res);
    if (resource === 'workflows' && !id && req.method === 'POST') return handleCreateWorkflow(req, res);
    if (resource === 'workflows' && id && !subResource && req.method === 'GET') return handleGetWorkflow(req, res, id);
    if (resource === 'workflows' && id && !subResource && req.method === 'PATCH') return handleUpdateWorkflow(req, res, id);
    if (resource === 'workflows' && id && subResource === 'activate' && req.method === 'POST') return handleActivateWorkflow(req, res, id);
    if (resource === 'workflows' && id && subResource === 'deactivate' && req.method === 'POST') return handleDeactivateWorkflow(req, res, id);
    if (resource === 'workflows' && id && subResource === 'execute' && req.method === 'POST') return handleExecuteWorkflow(req, res, id);
    if (resource === 'approvals' && !id && req.method === 'GET') return handleListApprovals(req, res);
    if (resource === 'approvals' && id && subResource === 'approve' && req.method === 'POST') return handleApprove(req, res, id);
    if (resource === 'approvals' && id && subResource === 'reject' && req.method === 'POST') return handleReject(req, res, id);
    if (resource === 'approvals' && id && subResource === 'delegate' && req.method === 'POST') return handleDelegate(req, res, id);

    return res.status(404).json({ success: false, error: 'Workflow route not found' });
  } catch (err) {
    return handleError(res, 'client-workflow', err);
  }
}

// ── Workflow handlers ───────────────────────────────────────────────────

async function handleListWorkflows(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflows = await selectMany('client_workflows', {
      client_account_id: account.id,
    }, ['updated_at DESC'], 50, 0, '*');

    return res.json({ success: true, workflows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleCreateWorkflow(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { name, description, mandate_id, trigger_type, nodes } = req.body || {};

  if (!name || !trigger_type) {
    return res.status(400).json({ success: false, error: 'name and trigger_type are required' });
  }

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflow = await insert('client_workflows', {
      client_account_id: account.id,
      mandate_id: mandate_id || null,
      name,
      description: description || null,
      trigger_type,
      status: 'draft',
      nodes: JSON.stringify(nodes || []),
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return res.json({ success: true, workflow });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetWorkflow(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflow = await selectOne('client_workflows', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!workflow || workflow.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    return res.json({ success: true, workflow });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleUpdateWorkflow(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflow = await selectOne('client_workflows', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!workflow || workflow.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const { name, description, nodes } = req.body || {};
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (nodes !== undefined) updateData.nodes = JSON.stringify(nodes);

    const updated = await update('client_workflows', id, updateData);
    return res.json({ success: true, workflow: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleActivateWorkflow(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflow = await selectOne('client_workflows', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!workflow || workflow.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    if (workflow.status === 'active') {
      return res.status(400).json({ success: false, error: 'Workflow is already active' });
    }

    const activated = await update('client_workflows', id, {
      status: 'active',
      updated_at: new Date().toISOString(),
    });

    return res.json({ success: true, workflow: activated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleDeactivateWorkflow(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflow = await selectOne('client_workflows', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!workflow || workflow.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    const deactivated = await update('client_workflows', id, {
      status: 'paused',
      updated_at: new Date().toISOString(),
    });

    return res.json({ success: true, workflow: deactivated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleExecuteWorkflow(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const workflow = await selectOne('client_workflows', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!workflow || workflow.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    if (workflow.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Workflow must be active to execute' });
    }

    const execution = executeWorkflowNodes(workflow.nodes ? JSON.parse(workflow.nodes) : []);

    return res.json({
      success: true,
      execution,
      workflow_id: id,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Approval handlers ───────────────────────────────────────────────────

async function handleListApprovals(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { status } = req.query as Record<string, string>;

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const where: Record<string, any> = { approver_id: account.id };
    if (status) where.status = status;

    const approvals = await selectMany('client_approvals', where, ['created_at DESC'], 50, 0, '*');
    return res.json({ success: true, approvals });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleApprove(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { comments, decision } = req.body || {};

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const approval = await selectOne('client_approvals', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!approval || approval.approver_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Approval already decided' });
    }

    const updated = await update('client_approvals', id, {
      status: 'approved',
      decision: decision || 'approved',
      comments: comments || null,
      decided_at: new Date().toISOString(),
    });

    return res.json({ success: true, approval: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleReject(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { comments, decision } = req.body || {};

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const approval = await selectOne('client_approvals', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!approval || approval.approver_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Approval already decided' });
    }

    const updated = await update('client_approvals', id, {
      status: 'rejected',
      decision: decision || 'rejected',
      comments: comments || null,
      decided_at: new Date().toISOString(),
    });

    return res.json({ success: true, approval: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleDelegate(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { delegate_to } = req.body || {};
  if (!delegate_to) {
    return res.status(400).json({ success: false, error: 'delegate_to is required' });
  }

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const approval = await selectOne('client_approvals', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!approval || approval.approver_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Approval not found' });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Approval already decided' });
    }

    const updated = await update('client_approvals', id, {
      status: 'delegated',
      approver_id: delegate_to,
      decided_at: new Date().toISOString(),
    });

    return res.json({ success: true, approval: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Pure-logic workflow engine (exported for testing) ───────────────────

export function executeWorkflowNodes(nodes: WorkflowNode[]): {
  executed: number;
  completed: number;
  failed: number;
  skipped: number;
  results: Array<{ node_id: string; status: NodeStatus; message: string }>;
} {
  const sorted = [...nodes].sort((a, b) => a.order - b.order);
  const results: Array<{ node_id: string; status: NodeStatus; message: string }> = [];

  let completed = 0;
  let failed = 0;
  let skipped = 0;
  let executionBlocked = false;

  for (const node of sorted) {
    if (executionBlocked) {
      results.push({
        node_id: node.id,
        status: 'skipped',
        message: 'Skipped due to prior node failure',
      });
      skipped++;
      continue;
    }

    const result = executeNode(node);
    results.push(result);

    if (result.status === 'completed') completed++;
    else if (result.status === 'failed') {
      failed++;
      executionBlocked = true;
    } else if (result.status === 'skipped') skipped++;
  }

  return {
    executed: sorted.length,
    completed,
    failed,
    skipped,
    results,
  };
}

export function executeNode(node: WorkflowNode): { node_id: string; status: NodeStatus; message: string } {
  switch (node.type) {
    case 'trigger':
      return { node_id: node.id, status: 'completed', message: 'Trigger activated' };

    case 'review_candidates':
      return { node_id: node.id, status: 'completed', message: 'Candidates marked for review' };

    case 'collect_feedback':
      return { node_id: node.id, status: 'completed', message: 'Feedback collection initiated' };

    case 'approval_chain': {
      const approvers = node.assignees.length;
      if (approvers === 0) {
        return { node_id: node.id, status: 'failed', message: 'No approvers configured' };
      }
      return { node_id: node.id, status: 'completed', message: `Approval chain initiated with ${approvers} approvers` };
    }

    case 'notify':
      return { node_id: node.id, status: 'completed', message: 'Notifications sent' };

    case 'escalate':
      return { node_id: node.id, status: 'completed', message: 'Escalation triggered' };

    case 'close':
      return { node_id: node.id, status: 'completed', message: 'Workflow closed' };

    default:
      return { node_id: node.id, status: 'failed', message: `Unknown node type: ${node.type}` };
  }
}

export function validateWorkflow(nodes: WorkflowNode[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push('Workflow must have at least one node');
  }

  const nodeIds = new Set<string>();
  const orderValues = new Set<number>();

  for (const node of nodes) {
    if (!node.id) errors.push(`Node missing id`);
    if (!node.type) errors.push(`Node ${node.id} missing type`);
    if (!node.title) errors.push(`Node ${node.id} missing title`);
    if (nodeIds.has(node.id)) errors.push(`Duplicate node id: ${node.id}`);
    if (orderValues.has(node.order)) errors.push(`Duplicate order value: ${node.order}`);

    nodeIds.add(node.id);
    orderValues.add(node.order);

    if (node.type === 'approval_chain' && node.assignees.length === 0) {
      errors.push(`Approval chain node "${node.title}" must have at least one approver`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function defaultWorkflow(name: string, triggerType: Workflow['trigger_type']): Omit<Workflow, 'id' | 'client_account_id' | 'created_at' | 'updated_at' | 'created_by'> {
  return {
    name,
    description: `${name} — automated workflow`,
    trigger_type: triggerType,
    status: 'draft',
    mandate_id: null,
    nodes: [
      {
        id: 'node-1',
        type: 'trigger',
        title: 'Trigger',
        config: {},
        order: 0,
        status: 'pending',
        assignees: [],
        due_at: null,
        completed_at: null,
        outputs: {},
      },
      {
        id: 'node-2',
        type: 'review_candidates',
        title: 'Review Candidates',
        config: { tier_filter: 'Gold' },
        order: 1,
        status: 'pending',
        assignees: [],
        due_at: null,
        completed_at: null,
        outputs: {},
      },
      {
        id: 'node-3',
        type: 'collect_feedback',
        title: 'Collect Feedback',
        config: { deadline_hours: 48 },
        order: 2,
        status: 'pending',
        assignees: [],
        due_at: null,
        completed_at: null,
        outputs: {},
      },
      {
        id: 'node-4',
        type: 'approval_chain',
        title: 'Approval Chain',
        config: { require_unanimous: false },
        order: 3,
        status: 'pending',
        assignees: [],
        due_at: null,
        completed_at: null,
        outputs: {},
      },
      {
        id: 'node-5',
        type: 'notify',
        title: 'Notify Stakeholders',
        config: { channels: ['email', 'in_app'] },
        order: 4,
        status: 'pending',
        assignees: [],
        due_at: null,
        completed_at: null,
        outputs: {},
      },
    ],
  };
}

export function getWorkflowProgress(workflow: Workflow): {
  total_nodes: number;
  completed_nodes: number;
  progress_percentage: number;
  current_node: WorkflowNode | null;
} {
  const nodes = workflow.nodes;
  const total = nodes.length;
  const completed = nodes.filter(n => n.status === 'completed').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const current = nodes.find(n => n.status === 'active') ||
    nodes.find(n => n.status === 'pending') || null;

  return {
    total_nodes: total,
    completed_nodes: completed,
    progress_percentage: percentage,
    current_node: current,
  };
}