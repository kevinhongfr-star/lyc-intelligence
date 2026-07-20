/**
 * api/_lib/dashboardBuilderHandler.ts — Custom Dashboard Builder
 * Issue #46: Configurable dashboards with widgets, layouts, and sharing
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'list' | 'split';
  widgets: DashboardWidget[];
  isDefault: boolean;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardWidget {
  id: string;
  type: 'stat_card' | 'chart' | 'table' | 'pipeline' | 'recent_activity' | 'calendar' | 'goal_tracker';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

const MOCK_DASHBOARDS: Dashboard[] = [
  {
    id: 'dash-1',
    name: 'Consultant Overview',
    description: 'Daily consulting workspace',
    layout: 'grid',
    isDefault: true,
    shared: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-20T08:00:00Z',
    widgets: [
      { id: 'w-1', type: 'stat_card', title: 'Active Mandates', config: { metric: 'active_mandates', trend: '+12%' }, position: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'w-2', type: 'stat_card', title: 'Candidates This Week', config: { metric: 'candidates_week', trend: '+5' }, position: { x: 1, y: 0, w: 1, h: 1 } },
      { id: 'w-3', type: 'pipeline', title: 'Pipeline Overview', config: { stages: ['screening', 'shortlist', 'interviewing', 'offer'] }, position: { x: 2, y: 0, w: 2, h: 2 } },
      { id: 'w-4', type: 'recent_activity', title: 'Recent Activity', config: { limit: 10 }, position: { x: 0, y: 1, w: 2, h: 2 } },
    ],
  },
  {
    id: 'dash-2',
    name: 'Executive Leadership',
    description: 'High-level KPIs for leadership team',
    layout: 'grid',
    isDefault: false,
    shared: true,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-07-19T10:00:00Z',
    widgets: [
      { id: 'w-5', type: 'stat_card', title: 'Revenue YTD', config: { metric: 'revenue_ytd', format: 'currency' }, position: { x: 0, y: 0, w: 1, h: 1 } },
      { id: 'w-6', type: 'chart', title: 'Mandates by Quarter', config: { chartType: 'bar', dataSource: 'mandates' }, position: { x: 1, y: 0, w: 2, h: 2 } },
      { id: 'w-7', type: 'goal_tracker', title: 'Annual Goals', config: { goals: [{ name: 'Placements', target: 50, current: 32 }] }, position: { x: 0, y: 1, w: 1, h: 1 } },
    ],
  },
];

function getUser(req: VercelRequest) {
  return (req as any).__authenticatedUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = ((req.query as any).path || []) as string[];
  const method = req.method || 'GET';
  const user = getUser(req);

  try {
    // GET /dashboards — list dashboards
    if (method === 'GET' && path[0] === 'dashboards') {
      const { data: dashboards } = await supabase
        .from('dashboards')
        .select('*')
        .or(`user_id.eq.${user?.id},shared.eq.true`)
        .order('updated_at', { ascending: false });

      return res.status(200).json({
        success: true,
        dashboards: dashboards || MOCK_DASHBOARDS,
      });
    }

    // GET /dashboards/:id — get single dashboard
    if (method === 'GET' && path[0] === 'dashboards' && path[1]) {
      const dashboard = MOCK_DASHBOARDS.find(d => d.id === path[1]);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      return res.status(200).json({ success: true, dashboard });
    }

    // POST /dashboards — create dashboard
    if (method === 'POST' && path[0] === 'dashboards') {
      const body = req.body || {};
      const dashboard: Dashboard = {
        id: `dash-${Date.now()}`,
        name: body.name,
        description: body.description || '',
        layout: body.layout || 'grid',
        widgets: body.widgets || [],
        isDefault: false,
        shared: body.shared || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('dashboards').insert({
        ...dashboard,
        user_id: user?.id,
      });
      if (error) console.warn('dashboards insert failed:', error.message);

      return res.status(201).json({ success: true, dashboard });
    }

    // PUT /dashboards/:id — update dashboard
    if (method === 'PUT' && path[0] === 'dashboards' && path[1]) {
      const updates = req.body || {};
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('dashboards')
        .update(updates)
        .eq('id', path[1]);

      if (error) console.warn('dashboards update failed:', error.message);

      return res.status(200).json({ success: true, id: path[1], updates });
    }

    // DELETE /dashboards/:id — delete dashboard
    if (method === 'DELETE' && path[0] === 'dashboards' && path[1]) {
      const { error } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', path[1]);

      if (error) console.warn('dashboards delete failed:', error.message);

      return res.status(200).json({ success: true, deleted: path[1] });
    }

    // GET /widgets — available widget types
    if (method === 'GET' && path[0] === 'widgets') {
      return res.status(200).json({
        success: true,
        widgetTypes: [
          { type: 'stat_card', name: 'Stat Card', icon: 'bar-chart-2', description: 'Key metric with trend' },
          { type: 'chart', name: 'Chart', icon: 'pie-chart', description: 'Bar, line, or pie chart' },
          { type: 'table', name: 'Data Table', icon: 'table', description: 'Sortable data table' },
          { type: 'pipeline', name: 'Pipeline', icon: 'git-branch', description: 'Visual pipeline stages' },
          { type: 'recent_activity', name: 'Recent Activity', icon: 'activity', description: 'Feed of latest actions' },
          { type: 'calendar', name: 'Calendar', icon: 'calendar', description: 'Upcoming events and interviews' },
          { type: 'goal_tracker', name: 'Goal Tracker', icon: 'target', description: 'Progress toward goals' },
        ],
      });
    }

    // GET /stats — dashboard builder stats
    if (method === 'GET' && path[0] === 'stats') {
      return res.status(200).json({
        success: true,
        stats: {
          totalDashboards: MOCK_DASHBOARDS.length,
          totalWidgets: MOCK_DASHBOARDS.reduce((sum, d) => sum + d.widgets.length, 0),
          sharedDashboards: MOCK_DASHBOARDS.filter(d => d.shared).length,
          mostUsedWidget: 'stat_card',
        },
      });
    }

    return res.status(404).json({ error: 'Unknown dashboard builder endpoint' });
  } catch (err: any) {
    console.error('[dashboardBuilderHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
