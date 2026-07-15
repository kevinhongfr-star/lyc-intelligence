import { useState, useMemo } from 'react';
import { Activity, Filter, Search, Clock, User, Briefcase, FileText, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ActivityEntry {
  id: string;
  type: 'candidate' | 'mandate' | 'report' | 'message' | 'task';
  title: string;
  description: string;
  user: string;
  entity_type: string;
  entity_name: string;
  created_at: string;
}

const MOCK_ACTIVITIES: ActivityEntry[] = [
  { id: '1', type: 'candidate', title: 'Candidate advanced', description: 'Sarah Chen moved to Interview stage', user: 'Kevin H.', entity_type: 'Mandate', entity_name: 'CFO — TechCorp', created_at: '2026-07-15T10:30:00Z' },
  { id: '2', type: 'mandate', title: 'New mandate created', description: 'VP Operations — Global Manufacturing Co.', user: 'Alessio R.', entity_type: 'Mandate', entity_name: 'VP Ops — Global Mfg', created_at: '2026-07-15T09:15:00Z' },
  { id: '3', type: 'report', title: 'Report generated', description: 'TRIDENT assessment for Michael Zhang', user: 'System', entity_type: 'Report', entity_name: 'TRIDENT — M. Zhang', created_at: '2026-07-15T08:45:00Z' },
  { id: '4', type: 'message', title: 'Message received', description: 'Client feedback on shortlist for CEO mandate', user: 'TechCorp HR', entity_type: 'Mandate', entity_name: 'CEO — TechCorp', created_at: '2026-07-14T16:20:00Z' },
  { id: '5', type: 'task', title: 'Task completed', description: 'Reference check for Jennifer Liu', user: 'Marie L.', entity_type: 'Candidate', entity_name: 'Jennifer Liu', created_at: '2026-07-14T14:10:00Z' },
  { id: '6', type: 'candidate', title: 'New candidate added', description: 'David Wang — former VP at Siemens', user: 'Kevin H.', entity_type: 'Mandate', entity_name: 'VP Ops — Global Mfg', created_at: '2026-07-14T11:30:00Z' },
  { id: '7', type: 'mandate', title: 'Mandate stage updated', description: 'CEO — TechCorp moved to Shortlist', user: 'Alessio R.', entity_type: 'Mandate', entity_name: 'CEO — TechCorp', created_at: '2026-07-14T10:00:00Z' },
  { id: '8', type: 'report', title: 'Report shared', description: 'Compensation benchmark shared with client', user: 'System', entity_type: 'Report', entity_name: 'Comp Benchmark Q3', created_at: '2026-07-13T15:45:00Z' },
];

const TYPE_ICONS = {
  candidate: User,
  mandate: Briefcase,
  report: FileText,
  message: MessageSquare,
  task: CheckCircle2,
};

const TYPE_COLORS = {
  candidate: '#C108AB',
  mandate: '#3B82F6',
  report: '#F59E0B',
  message: '#10B981',
  task: '#8B5CF6',
};

export function ActivitiesPage() {
  const [activities] = useState<ActivityEntry[]>(MOCK_ACTIVITIES);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (filter !== 'all' && a.type !== filter) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activities, filter, search]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]" style={{ fontFamily: '"Libre Baskerville", serif' }}>
              Activity Log
            </h1>
            <p className="text-sm text-[#666] mt-1">Timeline of all actions across mandates and candidates</p>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <input
              type="text"
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-[#E5E5E5] bg-white focus:outline-none focus:border-[#C108AB]"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div className="flex items-center gap-1">
            {['all', 'candidate', 'mandate', 'report', 'message', 'task'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-[#C108AB] text-white'
                    : 'bg-white text-[#666] border border-[#E5E5E5] hover:border-[#C108AB]'
                }`}
                style={{ borderRadius: 0 }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-[#E5E5E5]">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-[#999] mx-auto mb-3" />
              <p className="text-sm text-[#666]">No activities found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0F0F0]">
              {filtered.map((activity) => {
                const Icon = TYPE_ICONS[activity.type];
                const color = TYPE_COLORS[activity.type];
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-[#FAFAFA] transition-colors">
                    <div
                      className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, borderRadius: 0 }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#1C1C1C]">{activity.title}</p>
                        <span
                          className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                          style={{ backgroundColor: `${color}15`, color, borderRadius: 0 }}
                        >
                          {activity.type}
                        </span>
                      </div>
                      <p className="text-sm text-[#666] mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#999]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[#C108AB]">{activity.entity_name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}