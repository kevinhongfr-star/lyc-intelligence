/**
 * DashboardBuilderPage.tsx — Issue #46
 * Configurable dashboards with widgets, layouts, and sharing
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  Plus,
  Grid3X3,
  List,
  Columns,
  Save,
  Trash2,
  Share2,
  Star,
  GripVertical,
  X,
} from 'lucide-react';

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: any;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'list' | 'split';
  widgets: DashboardWidget[];
  isDefault: boolean;
  shared: boolean;
}

const widgetTypeIcons: Record<string, React.ReactNode> = {
  stat_card: <Grid3X3 className="w-4 h-4" />,
  chart: <Columns className="w-4 h-4" />,
  table: <List className="w-4 h-4" />,
  pipeline: <Grid3X3 className="w-4 h-4" />,
  recent_activity: <List className="w-4 h-4" />,
  calendar: <Grid3X3 className="w-4 h-4" />,
  goal_tracker: <Star className="w-4 h-4" />,
};

export function DashboardBuilderPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [widgetTypes, setWidgetTypes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ name: '', description: '', layout: 'grid' as const });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [dashRes, widgetRes, statsRes] = await Promise.all([
        fetch('/api/dashboard-builder/dashboards').then(r => r.json()),
        fetch('/api/dashboard-builder/widgets').then(r => r.json()),
        fetch('/api/dashboard-builder/stats').then(r => r.json()),
      ]);
      setDashboards(dashRes.dashboards || []);
      setWidgetTypes(widgetRes.widgetTypes || []);
      setStats(statsRes.stats || null);
      if (dashRes.dashboards?.length > 0 && !activeDashboard) {
        setActiveDashboard(dashRes.dashboards[0]);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  }

  async function createDashboard() {
    const res = await fetch('/api/dashboard-builder/dashboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDashboard),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setNewDashboard({ name: '', description: '', layout: 'grid' });
      fetchData();
    }
  }

  async function addWidget(type: string, title: string) {
    if (!activeDashboard) return;
    const widget: DashboardWidget = {
      id: `w-${Date.now()}`,
      type,
      title,
      config: {},
    };
    const updated = {
      ...activeDashboard,
      widgets: [...activeDashboard.widgets, widget],
    };
    const res = await fetch(`/api/dashboard-builder/dashboards/${activeDashboard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets: updated.widgets }),
    });
    if (res.ok) {
      setActiveDashboard(updated);
      setShowAddWidget(false);
    }
  }

  async function removeWidget(widgetId: string) {
    if (!activeDashboard) return;
    const updated = {
      ...activeDashboard,
      widgets: activeDashboard.widgets.filter(w => w.id !== widgetId),
    };
    const res = await fetch(`/api/dashboard-builder/dashboards/${activeDashboard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgets: updated.widgets }),
    });
    if (res.ok) setActiveDashboard(updated);
  }

  async function toggleShare(dashboard: Dashboard) {
    const res = await fetch(`/api/dashboard-builder/dashboards/${dashboard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shared: !dashboard.shared }),
    });
    if (res.ok) fetchData();
  }

  async function deleteDashboard(id: string) {
    if (!confirm('Delete this dashboard?')) return;
    const res = await fetch(`/api/dashboard-builder/dashboards/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setActiveDashboard(null);
      fetchData();
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Create and customize your workspace dashboards</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Dashboard
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><LayoutDashboard className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalDashboards}</div>
              <div className="text-xs text-gray-500">Dashboards</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Grid3X3 className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalWidgets}</div>
              <div className="text-xs text-gray-500">Widgets</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Share2 className="w-5 h-5 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.sharedDashboards}</div>
              <div className="text-xs text-gray-500">Shared</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Star className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.mostUsedWidget}</div>
              <div className="text-xs text-gray-500">Top Widget</div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex gap-2 overflow-auto pb-2">
        {dashboards.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDashboard(d)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeDashboard?.id === d.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {d.isDefault && <Star className="w-3 h-3" />}
            {d.name}
            {d.shared && <Share2 className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {activeDashboard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">{activeDashboard.name}</h2>
              <p className="text-sm text-gray-500">{activeDashboard.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddWidget(true)} className="gap-1">
                <Plus className="w-3 h-3" />
                Add Widget
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleShare(activeDashboard)} className="gap-1">
                <Share2 className="w-3 h-3" />
                {activeDashboard.shared ? 'Unshare' : 'Share'}
              </Button>
              <button
                onClick={() => deleteDashboard(activeDashboard.id)}
                className="p-2 hover:bg-red-50 rounded-lg text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${
            activeDashboard.layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            activeDashboard.layout === 'split' ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1'
          }`}>
            {activeDashboard.widgets.map(widget => (
              <Card key={widget.id} className={`p-4 ${widget.type === 'pipeline' || widget.type === 'recent_activity' ? 'md:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {widgetTypeIcons[widget.type] || <Grid3X3 className="w-4 h-4" />}
                    <span className="font-medium text-sm">{widget.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-100 rounded cursor-grab">
                      <GripVertical className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>
                <WidgetPlaceholder type={widget.type} config={widget.config} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="font-medium">Create Dashboard</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input
                  type="text"
                  value={newDashboard.name}
                  onChange={e => setNewDashboard({ ...newDashboard, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="My Dashboard"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <input
                  type="text"
                  value={newDashboard.description}
                  onChange={e => setNewDashboard({ ...newDashboard, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Layout</label>
                <div className="flex gap-2">
                  {(['grid', 'split', 'list'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setNewDashboard({ ...newDashboard, layout: l })}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border capitalize transition-colors ${
                        newDashboard.layout === l
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={createDashboard}>Create</Button>
            </div>
          </Card>
        </div>
      )}

      {showAddWidget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Add Widget</h3>
              <button onClick={() => setShowAddWidget(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-auto">
              {widgetTypes.map(wt => (
                <button
                  key={wt.type}
                  onClick={() => addWidget(wt.type, wt.name)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="p-2 bg-gray-50 rounded">
                    {widgetTypeIcons[wt.type] || <Grid3X3 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{wt.name}</div>
                    <div className="text-xs text-gray-500">{wt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function WidgetPlaceholder({ type, config }: { type: string; config: any }) {
  if (type === 'stat_card') {
    return (
      <div>
        <div className="text-3xl font-bold text-gray-900">{config.metric === 'active_mandates' ? '12' : config.metric === 'candidates_week' ? '28' : '$2.4M'}</div>
        <div className="text-xs text-green-600 mt-1">{config.trend || '+8%'}</div>
      </div>
    );
  }
  if (type === 'pipeline') {
    return (
      <div className="flex items-center gap-2">
        {['Screening', 'Shortlist', 'Interview', 'Offer'].map((s, i) => (
          <div key={s} className="flex-1">
            <div className="h-8 bg-blue-100 rounded flex items-center justify-center text-xs font-medium" style={{ opacity: 1 - i * 0.15 }}>
              {8 - i * 2}
            </div>
            <div className="text-[10px] text-center text-gray-500 mt-1">{s}</div>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'chart') {
    return (
      <div className="h-24 flex items-end gap-2">
        {[40, 65, 50, 80, 60, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%`, opacity: 0.7 + i * 0.05 }} />
        ))}
      </div>
    );
  }
  if (type === 'recent_activity') {
    return (
      <div className="space-y-2">
        {['Sarah Chen moved to Interviewing', 'New mandate: CTO Apex Digital', 'Offer extended to James Wilson'].map((a, i) => (
          <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {a}
          </div>
        ))}
      </div>
    );
  }
  if (type === 'goal_tracker') {
    const goal = config.goals?.[0];
    const pct = goal ? Math.round((goal.current / goal.target) * 100) : 64;
    return (
      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{goal?.name || 'Placements'}</span>
          <span>{goal?.current || 32} / {goal?.target || 50}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }
  return <div className="text-xs text-gray-400">Widget preview</div>;
}
