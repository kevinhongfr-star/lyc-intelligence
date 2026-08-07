// @vitest-environment node
import { describe, it, expect } from 'vitest';

import {
  executeWorkflowNodes,
  executeNode,
  validateWorkflow,
  defaultWorkflow,
  getWorkflowProgress,
  type WorkflowNode,
  type Workflow,
} from '../../../api/_lib/clientWorkflowEngine';

// ── executeNode ────────────────────────────────────────────────────────

describe('executeNode', () => {
  const baseNode: WorkflowNode = {
    id: 'test-1',
    type: 'trigger',
    title: 'Test',
    config: {},
    order: 0,
    status: 'pending',
    assignees: [],
    due_at: null,
    completed_at: null,
    outputs: {},
  };

  it('completes trigger nodes', () => {
    const result = executeNode({ ...baseNode, type: 'trigger' });
    expect(result.status).toBe('completed');
  });

  it('completes review_candidates nodes', () => {
    const result = executeNode({ ...baseNode, type: 'review_candidates' });
    expect(result.status).toBe('completed');
  });

  it('completes collect_feedback nodes', () => {
    const result = executeNode({ ...baseNode, type: 'collect_feedback' });
    expect(result.status).toBe('completed');
  });

  it('fails approval_chain without approvers', () => {
    const result = executeNode({ ...baseNode, type: 'approval_chain', assignees: [] });
    expect(result.status).toBe('failed');
  });

  it('completes approval_chain with approvers', () => {
    const result = executeNode({ ...baseNode, type: 'approval_chain', assignees: ['user-1'] });
    expect(result.status).toBe('completed');
  });

  it('completes notify nodes', () => {
    const result = executeNode({ ...baseNode, type: 'notify' });
    expect(result.status).toBe('completed');
  });

  it('completes escalate nodes', () => {
    const result = executeNode({ ...baseNode, type: 'escalate' });
    expect(result.status).toBe('completed');
  });

  it('completes close nodes', () => {
    const result = executeNode({ ...baseNode, type: 'close' });
    expect(result.status).toBe('completed');
  });

  it('fails on unknown node type', () => {
    const result = executeNode({ ...baseNode, type: 'unknown_type' as any });
    expect(result.status).toBe('failed');
  });
});

// ── executeWorkflowNodes ──────────────────────────────────────────────

describe('executeWorkflowNodes', () => {
  it('executes all nodes in order', () => {
    const nodes: WorkflowNode[] = [
      { id: '1', type: 'trigger', title: 'Start', config: {}, order: 0, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      { id: '2', type: 'notify', title: 'Notify', config: {}, order: 1, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      { id: '3', type: 'close', title: 'End', config: {}, order: 2, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
    ];
    const result = executeWorkflowNodes(nodes);
    expect(result.executed).toBe(3);
    expect(result.completed).toBe(3);
    expect(result.failed).toBe(0);
  });

  it('skips remaining nodes when one fails', () => {
    const nodes: WorkflowNode[] = [
      { id: '1', type: 'trigger', title: 'Start', config: {}, order: 0, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      { id: '2', type: 'approval_chain', title: 'Approve', config: {}, order: 1, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      { id: '3', type: 'close', title: 'End', config: {}, order: 2, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
    ];
    const result = executeWorkflowNodes(nodes);
    expect(result.failed).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('handles empty workflow', () => {
    const result = executeWorkflowNodes([]);
    expect(result.executed).toBe(0);
    expect(result.completed).toBe(0);
  });
});

// ── validateWorkflow ──────────────────────────────────────────────────

describe('validateWorkflow', () => {
  it('returns valid for correct workflow', () => {
    const nodes: WorkflowNode[] = [
      { id: '1', type: 'trigger', title: 'Start', config: {}, order: 0, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      { id: '2', type: 'approval_chain', title: 'Approve', config: {}, order: 1, status: 'pending', assignees: ['user-1'], due_at: null, completed_at: null, outputs: {} },
    ];
    const result = validateWorkflow(nodes);
    expect(result.valid).toBe(true);
  });

  it('errors on empty workflow', () => {
    const result = validateWorkflow([]);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('at least one'))).toBe(true);
  });

  it('errors on duplicate ids', () => {
    const nodes: WorkflowNode[] = [
      { id: '1', type: 'trigger', title: 'A', config: {}, order: 0, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      { id: '1', type: 'notify', title: 'B', config: {}, order: 1, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
    ];
    const result = validateWorkflow(nodes);
    expect(result.valid).toBe(false);
  });

  it('errors on approval chain without approvers', () => {
    const nodes: WorkflowNode[] = [
      { id: '1', type: 'approval_chain', title: 'Approve', config: {}, order: 0, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
    ];
    const result = validateWorkflow(nodes);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('approver'))).toBe(true);
  });
});

// ── defaultWorkflow ────────────────────────────────────────────────────

describe('defaultWorkflow', () => {
  it('creates a complete workflow with 5 nodes', () => {
    const wf = defaultWorkflow('Test WF', 'manual');
    expect(wf.nodes.length).toBe(5);
    expect(wf.status).toBe('draft');
    expect(wf.trigger_type).toBe('manual');
  });

  it('creates nodes in correct order', () => {
    const wf = defaultWorkflow('Test', 'mandate_created');
    for (let i = 0; i < wf.nodes.length; i++) {
      expect(wf.nodes[i].order).toBe(i);
    }
  });
});

// ── getWorkflowProgress ────────────────────────────────────────────────

describe('getWorkflowProgress', () => {
  it('returns 0% for draft workflow', () => {
    const wf: Workflow = {
      id: 'wf-1',
      client_account_id: 'acc-1',
      mandate_id: null,
      name: 'Test',
      description: null,
      trigger_type: 'manual',
      status: 'draft',
      nodes: [
        { id: '1', type: 'trigger', title: 'A', config: {}, order: 0, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
        { id: '2', type: 'notify', title: 'B', config: {}, order: 1, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      ],
      created_by: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const progress = getWorkflowProgress(wf);
    expect(progress.progress_percentage).toBe(0);
    expect(progress.completed_nodes).toBe(0);
  });

  it('tracks completed nodes', () => {
    const wf: Workflow = {
      id: 'wf-1',
      client_account_id: 'acc-1',
      mandate_id: null,
      name: 'Test',
      description: null,
      trigger_type: 'manual',
      status: 'active',
      nodes: [
        { id: '1', type: 'trigger', title: 'A', config: {}, order: 0, status: 'completed', assignees: [], due_at: null, completed_at: null, outputs: {} },
        { id: '2', type: 'notify', title: 'B', config: {}, order: 1, status: 'completed', assignees: [], due_at: null, completed_at: null, outputs: {} },
        { id: '3', type: 'close', title: 'C', config: {}, order: 2, status: 'pending', assignees: [], due_at: null, completed_at: null, outputs: {} },
      ],
      created_by: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const progress = getWorkflowProgress(wf);
    expect(progress.progress_percentage).toBeGreaterThan(0);
    expect(progress.current_node?.id).toBe('3');
  });
});