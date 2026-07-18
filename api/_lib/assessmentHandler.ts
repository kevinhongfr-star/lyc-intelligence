/**
 * Assessment handler — Online Diagnostic Assessment Engine
 * Issue #20: SHIFT Assessment Delivery
 *
 * Routes:
 *   GET    /api/assessments              — List available assessments
 *   GET    /api/assessments/:id          — Get assessment details
 *   POST   /api/assessments/:id/start    — Start a new assessment instance
 *   GET    /api/assessments/instance/:id — Get current instance state
 *   POST   /api/assessments/instance/:id/response — Submit response
 *   PATCH  /api/assessments/instance/:id/complete — Complete assessment
 *   GET    /api/assessments/instance/:id/results — Get results
 *   GET    /api/assessments/instance/:id/next-item — Get next item (adaptive)
 */

import type { VercelRequest, VercalResponse } from '@vercel/node';
import { selectMany, selectOne, insert, update, handleError, isSupabaseConfigured } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const handler = handleAssessments;

async function handleAssessments(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: authError || 'Unauthorized' });
    }

    const path = (req.query as any).path || [];
    const resource = path[0];
    const id = path[1];
    const action = path[2];

    // List available assessments
    if (resource === 'assessments' && !id && req.method === 'GET') {
      return handleListAssessments(req, res);
    }

    // Get assessment details
    if (resource === 'assessments' && id && !action && req.method === 'GET') {
      return handleGetAssessment(req, res, id);
    }

    // Start assessment
    if (resource === 'assessments' && id && action === 'start' && req.method === 'POST') {
      return handleStartAssessment(req, res, user, id);
    }

    // Instance operations
    if (resource === 'assessments' && id === 'instance') {
      const instanceId = path[2];
      const instanceAction = path[3];

      if (!instanceId) {
        return res.status(400).json({ success: false, error: 'Instance ID required' });
      }

      if (req.method === 'GET' && !instanceAction) return handleGetInstance(req, res, instanceId, user);
      if (req.method === 'POST' && instanceAction === 'response') return handleSubmitResponse(req, res, instanceId, user);
      if (req.method === 'PATCH' && instanceAction === 'complete') return handleCompleteAssessment(req, res, instanceId, user);
      if (req.method === 'GET' && instanceAction === 'results') return handleGetResults(req, res, instanceId, user);
      if (req.method === 'GET' && instanceAction === 'next-item') return handleGetNextItem(req, res, instanceId, user);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleError(res, 'assessments', err);
  }
}

async function handleListAssessments(req: VercelRequest, res: VercalResponse) {
  const templates = await selectMany(
    'shift_assessment_templates',
    { select: 'id,name,description,version,dimensions', where: [{ column: 'is_active', value: true }] },
    ['created_at DESC'],
    20,
    0,
    '*',
  );

  return res.status(200).json({ success: true, assessments: templates || [] });
}

async function handleGetAssessment(req: VercelRequest, res: VercalResponse, templateId: string) {
  const template = await selectOne('shift_assessment_templates', {
    select: '*',
    column: 'id',
    value: templateId,
  });

  if (!template || !template.is_active) {
    return res.status(404).json({ success: false, error: 'Assessment not found' });
  }

  const items = await selectMany(
    'shift_assessment_items',
    { select: 'id,dimension,facet,item_type,item_text,options,order_index', where: [{ column: 'template_id', value: templateId }, { column: 'is_active', value: true }] },
    ['order_index ASC'],
    200,
    0,
    '*',
  );

  return res.status(200).json({
    success: true,
    assessment: {
      ...template,
      items: items || [],
    },
  });
}

async function handleStartAssessment(
  req: VercelRequest,
  res: VercalResponse,
  user: any,
  templateId: string,
) {
  // Check for existing in-progress instance
  const existing = await selectOne('shift_assessment_instances', {
    select: 'id,status',
    where: [
      { column: 'user_id', value: user.id },
      { column: 'template_id', value: templateId },
      { column: 'status', value: 'in_progress' },
    ],
  });

  if (existing) {
    return res.status(200).json({
      success: true,
      instance: existing,
      message: 'Resuming existing assessment',
    });
  }

  // Create new instance
  const instance = await insert('shift_assessment_instances', {
    user_id: user.id,
    template_id: templateId,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
  });

  return res.status(201).json({ success: true, instance });
}

async function handleGetInstance(
  req: VercelRequest,
  res: VercalResponse,
  instanceId: string,
  user: any,
) {
  const instance = await selectOne('shift_assessment_instances', {
    select: '*',
    column: 'id',
    value: instanceId,
  });

  if (!instance || instance.user_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  // Get responses count
  const responses = await selectMany(
    'shift_assessment_responses',
    { select: 'id', where: [{ column: 'instance_id', value: instanceId }] },
    [],
    500,
    0,
    '*',
  );

  return res.status(200).json({
    success: true,
    instance: {
      ...instance,
      responses_count: responses?.length || 0,
    },
  });
}

async function handleSubmitResponse(
  req: VercelRequest,
  res: VercalResponse,
  instanceId: string,
  user: any,
) {
  const instance = await selectOne('shift_assessment_instances', {
    select: 'id,status,user_id,template_id',
    column: 'id',
    value: instanceId,
  });

  if (!instance || instance.user_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  if (instance.status !== 'in_progress') {
    return res.status(400).json({ success: false, error: 'Assessment not in progress' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { item_id, response_value, response_time_ms } = body;

  if (!item_id || !response_value) {
    return res.status(400).json({ success: false, error: 'item_id and response_value required' });
  }

  // Get item for scoring
  const item = await selectOne('shift_assessment_items', {
    select: 'id,dimension,facet,scoring_key',
    column: 'id',
    value: item_id,
  });

  if (!item) {
    return res.status(400).json({ success: false, error: 'Invalid item' });
  }

  // Calculate score (simplified - real would use IRT)
  let dimensionScore = 0;
  let facetScores: Record<string, number> = {};
  
  if (item.scoring_key && typeof response_value === 'object' && 'selected' in response_value) {
    const selected = response_value.selected;
    const scoringKey = item.scoring_key as Record<string, any>;
    if (scoringKey.dimension_scores && scoringKey.dimension_scores[selected]) {
      dimensionScore = scoringKey.dimension_scores[selected];
    } else if (typeof selected === 'number') {
      // Likert scale: 1-5 normalized to 0-100
      dimensionScore = (selected - 1) * 25;
    }
    if (item.facet) {
      facetScores[item.facet] = dimensionScore;
    }
  }

  // Upsert response
  const response = await insert('shift_assessment_responses', {
    instance_id: instanceId,
    item_id,
    response_value,
    response_time_ms: response_time_ms || null,
    dimension_score: dimensionScore,
    facet_scores: facetScores,
  });

  // Update instance time
  await update('shift_assessment_instances', instanceId, {
    time_spent_seconds: Math.floor(((body.total_time_seconds || 0) || 0) + (response_time_ms || 0) / 1000),
  });

  return res.status(201).json({ success: true, response });
}

async function handleCompleteAssessment(
  req: VercelRequest,
  res: VercalResponse,
  instanceId: string,
  user: any,
) {
  const instance = await selectOne('shift_assessment_instances', {
    select: 'id,status,user_id,template_id',
    column: 'id',
    value: instanceId,
  });

  if (!instance || instance.user_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  if (instance.status !== 'in_progress') {
    return res.status(400).json({ success: false, error: 'Assessment not in progress' });
  }

  // Calculate dimension scores
  const responses = await selectMany(
    'shift_assessment_responses',
    { select: 'id,dimension_score,facet_scores', where: [{ column: 'instance_id', value: instanceId }] },
    [],
    500,
    0,
    '*',
  );

  // Aggregate by dimension
  const dimensionTotals: Record<string, { sum: number; count: number }> = {};
  for (const r of responses || []) {
    // Get item dimension
    const item = await selectOne('shift_assessment_items', {
      select: 'dimension',
      column: 'id',
      value: (r as any).item_id || r.id,
    });
    if (item) {
      const dim = item.dimension;
      if (!dimensionTotals[dim]) dimensionTotals[dim] = { sum: 0, count: 0 };
      dimensionTotals[dim].sum += r.dimension_score || 0;
      dimensionTotals[dim].count += 1;
    }
  }

  // Insert dimension scores
  for (const [dimension, data] of Object.entries(dimensionTotals)) {
    const avgScore = data.count > 0 ? data.sum / data.count : 0;
    await insert('shift_dimension_scores', {
      instance_id: instanceId,
      dimension,
      raw_score: avgScore,
    });
  }

  // Create composite profile
  const avgScores = Object.values(dimensionTotals).map(d => d.count > 0 ? d.sum / d.count : 0);
  const compositeScore = avgScores.length > 0 ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 0;

  const profile = await insert('shift_composite_profiles', {
    user_id: user.id,
    instance_id: instanceId,
    composite_score: compositeScore,
    is_valid: true,
    expires_at: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years
  });

  // Update instance status
  await update('shift_assessment_instances', instanceId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  return res.status(200).json({ success: true, profile });
}

async function handleGetResults(
  req: VercelRequest,
  res: VercalResponse,
  instanceId: string,
  user: any,
) {
  const instance = await selectOne('shift_assessment_instances', {
    select: 'id,status,user_id,template_id,completed_at',
    column: 'id',
    value: instanceId,
  });

  if (!instance || instance.user_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  if (instance.status !== 'completed') {
    return res.status(400).json({ success: false, error: 'Assessment not completed' });
  }

  const dimensionScores = await selectMany(
    'shift_dimension_scores',
    { select: '*', where: [{ column: 'instance_id', value: instanceId }] },
    ['dimension ASC'],
    20,
    0,
    '*',
  );

  const profile = await selectOne('shift_composite_profiles', {
    select: '*',
    column: 'instance_id',
    value: instanceId,
  });

  return res.status(200).json({
    success: true,
    results: {
      instance,
      dimension_scores: dimensionScores || [],
      profile,
    },
  });
}

async function handleGetNextItem(
  req: VercelRequest,
  res: VercalResponse,
  instanceId: string,
  user: any,
) {
  // Simplified adaptive logic - real would use IRT/CAT
  const instance = await selectOne('shift_assessment_instances', {
    select: 'id,status,user_id,template_id',
    column: 'id',
    value: instanceId,
  });

  if (!instance || instance.user_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Instance not found' });
  }

  // Get already answered items
  const answeredResponses = await selectMany(
    'shift_assessment_responses',
    { select: 'item_id', where: [{ column: 'instance_id', value: instanceId }] },
    [],
    500,
    0,
    '*',
  );
  const answeredIds = new Set((answeredResponses || []).map(r => (r as any).item_id));

  // Get next unanswered item
  const allItems = await selectMany(
    'shift_assessment_items',
    { select: 'id,dimension,item_type,item_text,options', where: [{ column: 'template_id', value: instance.template_id }, { column: 'is_active', value: true }] },
    ['order_index ASC'],
    200,
    0,
    '*',
  );

  const nextItem = (allItems || []).find(item => !answeredIds.has(item.id));

  if (!nextItem) {
    return res.status(200).json({
      success: true,
      completed: true,
      message: 'All items answered',
    });
  }

  return res.status(200).json({
    success: true,
    item: nextItem,
    progress: {
      answered: answeredIds.size,
      total: allItems?.length || 0,
    },
  });
}