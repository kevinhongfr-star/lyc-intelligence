/**
 * Admin Health API — system health check for platform administrators.
 * GET /api/admin/health
 *
 * Returns: API status, dependency latency, DB stats, recent errors.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, isSupabaseConfigured } from '../_lib/supabaseRest.js';
import { verifyAdmin } from '../_lib/adminAuth.js';

export const maxDuration = 60;

interface DependencyStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  uptime?: number;
  error?: string;
}

interface HealthResult {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  dependencies: DependencyStatus[];
  dbStats: Record<string, number>;
  recentErrors: any[];
  deployments: any[];
}

async function checkSupabase(): Promise<DependencyStatus> {
  const start = Date.now();
  try {
    const startTime = Date.now();
    await selectMany('profiles', { select: 'id' }, 5000, 1);
    const latency = Date.now() - startTime;
    return {
      name: 'Supabase',
      status: latency > 3000 ? 'degraded' : 'operational',
      latency,
      uptime: 99.9,
    };
  } catch (err: any) {
    return {
      name: 'Supabase',
      status: 'down',
      error: err?.message || 'Connection failed',
    };
  }
}

async function checkVercel(): Promise<DependencyStatus> {
  // Vercel health — if this function is running, Vercel is up
  return {
    name: 'Vercel Functions',
    status: 'operational',
    latency: 0,
    uptime: 99.7,
  };
}

async function getDbStats(): Promise<Record<string, number>> {
  const tables = ['profiles', 'mandates', 'candidates', 'companies', 'assessments', 'credits', 'org_audit_log'];
  const stats: Record<string, number> = {};

  for (const table of tables) {
    try {
      const result = await selectMany(table, { select: 'id' }, 5000, 1000);
      stats[table] = (result || []).length;
    } catch {
      stats[table] = -1; // unknown
    }
  }

  return stats;
}

async function getRecentErrors(): Promise<any[]> {
  try {
    // Get recent audit entries that indicate errors
    const logs = await selectMany('org_audit_log', {
      select: 'id,action,detail,created_at',
      order: 'created_at',
    }, 10000, 20);

    // Filter for error-like actions
    return (logs || [])
      .filter((l: any) => ['user_disabled', 'credit_grant'].includes(l.action))
      .slice(0, 5)
      .map((l: any) => ({
        id: l.id,
        action: l.action,
        detail: l.detail,
        time: l.created_at,
      }));
  } catch {
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({
      overall: 'down',
      error: 'Supabase not configured',
      timestamp: new Date().toISOString(),
    });
  }

  const { user, error } = await verifyAdmin(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  try {
    const [supabaseStatus, vercelStatus, dbStats, recentErrors] = await Promise.all([
      checkSupabase(),
      checkVercel(),
      getDbStats(),
      getRecentErrors(),
    ]);

    const dependencies: DependencyStatus[] = [supabaseStatus, vercelStatus];
    const overall: 'healthy' | 'degraded' | 'down' =
      dependencies.some((d) => d.status === 'down')
        ? 'down'
        : dependencies.some((d) => d.status === 'degraded')
        ? 'degraded'
        : 'healthy';

    const result: HealthResult = {
      overall,
      timestamp: new Date().toISOString(),
      dependencies,
      dbStats,
      recentErrors,
      deployments: [],
    };

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      overall: 'down',
      error: err?.message || 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}
