import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Agent Management ─── */
async function handleAgents(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const agentId = path[1];

  try {
    if (req.method === 'GET') {
      if (agentId) {
        if (path[2] === 'performance') {
          const period = req.query.period as string || '30d';
          const tasks = await selectMany('tasks', { where: [{ column: 'assigned_agent', value: agentId }] });
          const completed = tasks.filter((t: any) => t.status === 'completed');
          const failed = tasks.filter((t: any) => t.status === 'failed');
          const totalCost = completed.reduce((sum: number, t: any) => sum + (t.cost?.total_cny || 0), 0);

          return res.status(200).json({
            success: true,
            agent_id: agentId,
            period,
            tasks_total: tasks.length,
            tasks_completed: completed.length,
            tasks_failed: failed.length,
            success_rate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 1000) / 1000 : 0,
            total_cost_cny: Math.round(totalCost * 100) / 100,
            avg_quality_score: completed.length > 0 ? Math.round(completed.reduce((s: number, t: any) => s + (t.quality_score || 0), 0) / completed.length * 10) / 10 : 0,
          });
        }

        const agent = await selectOne('agent_registry', { where: [{ column: 'id', value: agentId }] });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        return res.status(200).json({ success: true, agent });
      }

      const status = req.query.status as string;
      const where: any[] = [];
      if (status) where.push({ column: 'status', value: status });
      const agents = await selectMany('agent_registry', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, agents });
    }

    if (req.method === 'PATCH' && agentId) {
      await update('agent_registry', agentId, { ...req.body, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Agents] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Task Management ─── */
async function handleTasks(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const taskId = path[1];

  try {
    if (req.method === 'POST' && !taskId) {
      const task = await insert('tasks', {
        ...req.body,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // Auto-assign if no agent specified
      if (!req.body.assigned_agent) {
        const assigned = await autoAssignTask(task.id);
        if (assigned) {
          await update('tasks', task.id, { assigned_agent: assigned.agent_id, status: 'dispatched', dispatched_at: new Date().toISOString() });
        }
      }

      return res.status(201).json({ success: true, task });
    }

    if (req.method === 'GET') {
      if (taskId) {
        const task = await selectOne('tasks', { where: [{ column: 'id', value: taskId }] });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        return res.status(200).json({ success: true, task });
      }
      const status = req.query.status as string;
      const agentId = req.query.agent_id as string;
      const where: any[] = [];
      if (status) where.push({ column: 'status', value: status });
      if (agentId) where.push({ column: 'assigned_agent', value: agentId });
      const tasks = await selectMany('tasks', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, tasks });
    }

    if (req.method === 'PATCH' && taskId) {
      await update('tasks', taskId, { ...req.body, updated_at: new Date().toISOString() });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST' && taskId) {
      const subAction = path[2];

      if (subAction === 'dispatch') {
        await update('tasks', taskId, { status: 'dispatched', dispatched_at: new Date().toISOString() });
        return res.status(200).json({ success: true });
      }

      if (subAction === 'complete') {
        const { outputs, cost, quality_score, notes } = req.body;
        await update('tasks', taskId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          outputs: outputs || [],
          cost: cost || { tokens_input: 0, tokens_output: 0, api_calls: 0, total_cny: 0 },
          quality_score,
          metadata: { ...((await selectOne('tasks', { where: [{ column: 'id', value: taskId }] }))?.metadata || {}), notes },
        });
        return res.status(200).json({ success: true });
      }

      if (subAction === 'fail') {
        await update('tasks', taskId, { status: 'failed', completed_at: new Date().toISOString() });
        return res.status(200).json({ success: true });
      }

      if (subAction === 'escalate') {
        const task = await selectOne('tasks', { where: [{ column: 'id', value: taskId }] });
        await update('tasks', taskId, {
          status: 'review',
          escalation_count: (task?.escalation_count || 0) + 1,
        });
        return res.status(200).json({ success: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Tasks] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function autoAssignTask(taskId: string): Promise<{ agent_id: string; score: number } | null> {
  const task = await selectOne('tasks', { where: [{ column: 'id', value: taskId }] });
  if (!task) return null;

  const agents = await selectMany('agent_registry', { where: [{ column: 'status', value: 'active' }] });
  const candidates: { agent_id: string; score: number }[] = [];

  for (const agent of agents) {
    const capabilities = agent.capabilities || [];
    const limitations = agent.limitations || [];

    if (!capabilities.includes(task.type)) continue;

    const activeTasks = await selectMany('tasks', {
      where: [
        { column: 'assigned_agent', value: agent.id },
        { column: 'status', value: ['pending', 'dispatched', 'in_progress'], op: 'in' },
      ],
    });

    if (activeTasks.length >= (agent.max_concurrent_tasks || 3)) continue;

    let score = 0;
    score += (1 - activeTasks.length / (agent.max_concurrent_tasks || 3)) * 0.3;
    if (['research', 'analysis'].includes(task.type)) {
      score += (1 - (agent.avg_cost_per_task || 3.5) / 10) * 0.2;
    }
    score += (agent.quality_score || 50) / 100 * 0.3;
    score += 0.2;

    candidates.push({ agent_id: agent.id, score: Math.round(score * 100) / 100 });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

/* ─── Work Logs ─── */
async function handleWorkLogs(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'POST') {
      const log = await insert('work_logs', {
        ...req.body,
        timestamp: new Date().toISOString(),
      });
      return res.status(201).json({ success: true, log });
    }

    if (req.method === 'GET') {
      if (action === 'eod-summary') {
        const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
        const summary = await generateEodSummary(date);
        return res.status(200).json({ success: true, ...summary });
      }

      const agentId = req.query.agent_id as string;
      const dateFrom = req.query.date_from as string;
      const where: any[] = [];
      if (agentId) where.push({ column: 'agent_id', value: agentId });
      if (dateFrom) where.push({ column: 'timestamp', value: dateFrom, op: 'gte' });
      const logs = await selectMany('work_logs', where.length > 0 ? { where } : {}, 50);
      return res.status(200).json({ success: true, logs });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[WorkLogs] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateEodSummary(date: string) {
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;

  const tasks = await selectMany('tasks', {
    where: [
      { column: 'completed_at', value: startOfDay, op: 'gte' },
      { column: 'completed_at', value: endOfDay, op: 'lte' },
    ],
  });

  const agents = await selectMany('agent_registry', {});
  const agentSummary: any[] = [];

  for (const agent of agents) {
    const agentTasks = tasks.filter((t: any) => t.assigned_agent === agent.id);
    const totalCost = agentTasks.reduce((sum: number, t: any) => sum + (t.cost?.total_cny || 0), 0);
    agentSummary.push({
      agent_id: agent.id,
      display_name: agent.display_name || agent.name,
      tasks_completed: agentTasks.length,
      total_cost_cny: Math.round(totalCost * 100) / 100,
      task_details: agentTasks.map((t: any) => ({
        title: t.title,
        duration_min: t.estimated_duration_minutes || 0,
        cost_cny: t.cost?.total_cny || 0,
      })),
    });
  }

  const totalCost = tasks.reduce((sum: number, t: any) => sum + (t.cost?.total_cny || 0), 0);

  return {
    date,
    agents_active: agents.length,
    total_tasks_completed: tasks.length,
    total_cost_cny: Math.round(totalCost * 100) / 100,
    by_agent: agentSummary,
  };
}

/* ─── Cost Tracking ─── */
async function handleCosts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'GET' && action === 'overview') {
      const period = req.query.period as string || 'today';
      const tasks = await selectMany('tasks', { where: [{ column: 'status', value: 'completed' }] });
      const totalCny = tasks.reduce((sum: number, t: any) => sum + (t.cost?.total_cny || 0), 0);

      const byAgent: Record<string, number> = {};
      const byModel: Record<string, number> = {};
      for (const t of tasks) {
        const agent = t.assigned_agent || 'unassigned';
        byAgent[agent] = (byAgent[agent] || 0) + (t.cost?.total_cny || 0);
        byModel['deepseek'] = (byModel['deepseek'] || 0) + (t.cost?.total_cny || 0);
      }

      return res.status(200).json({
        success: true,
        period,
        total_cny: Math.round(totalCny * 100) / 100,
        budget_total: 1800,
        budget_used_pct: Math.round((totalCny / 1800) * 1000) / 10,
        by_agent: byAgent,
        by_model: byModel,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Costs] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'agents':
      return handleAgents(req, res);
    case 'tasks':
      return handleTasks(req, res);
    case 'work-logs':
      return handleWorkLogs(req, res);
    case 'costs':
      return handleCosts(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v11/${resource}` });
  }
}