/**
 * api/_lib/featureFlagsHandler.ts — Feature Flag API
 * Dynamic feature rollout management
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getFeatureFlags,
  getFeatureFlag,
  isFeatureEnabled,
  updateFeatureFlag,
  createFeatureFlag,
  deleteFeatureFlag,
} from '../src/lib/featureFlags';

function getUser(req: VercelRequest) {
  return (req as any).__authenticatedUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = ((req.query as any).path || []) as string[];
  const method = req.method || 'GET';
  const user = getUser(req);

  try {
    if (method === 'GET' && path[0] === 'flags') {
      const flags = getFeatureFlags();
      return res.status(200).json({ success: true, flags });
    }

    if (method === 'GET' && path[0] === 'flags' && path[1]) {
      const flag = getFeatureFlag(path[1]);
      if (!flag) return res.status(404).json({ error: 'Feature flag not found' });
      return res.status(200).json({ success: true, flag });
    }

    if (method === 'GET' && path[0] === 'check') {
      const { feature } = req.query;
      if (!feature) return res.status(400).json({ error: 'Feature name required' });
      const enabled = isFeatureEnabled(String(feature), user?.id, user?.role);
      return res.status(200).json({ success: true, feature: String(feature), enabled });
    }

    if (method === 'POST' && path[0] === 'flags') {
      const body = req.body || {};
      const flag = await createFeatureFlag(body);
      return res.status(201).json({ success: true, flag });
    }

    if (method === 'PUT' && path[0] === 'flags' && path[1]) {
      const updates = req.body || {};
      const flag = await updateFeatureFlag(path[1], updates);
      if (!flag) return res.status(404).json({ error: 'Feature flag not found' });
      return res.status(200).json({ success: true, flag });
    }

    if (method === 'DELETE' && path[0] === 'flags' && path[1]) {
      const deleted = await deleteFeatureFlag(path[1]);
      return res.status(200).json({ success: deleted });
    }

    return res.status(404).json({ error: 'Unknown feature flags endpoint' });
  } catch (err: any) {
    console.error('[featureFlagsHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
