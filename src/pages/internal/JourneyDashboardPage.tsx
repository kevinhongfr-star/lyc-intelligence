/**
 * JourneyDashboardPage.tsx — Issue #44
 * Nexus Journey Intelligence Dashboard — visualizes the end-to-end
 * candidate/client journey across touchpoints with Nexus interactions,
 * milestone progression, and drop-off analytics.
 */
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Route,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Filter,
} from 'lucide-react';

interface JourneyStage {
  id: string;
  label: string;
  count: number;
  conversionRate: number;
  avgTimeDays: number;
  dropOff: number;
}

interface JourneyRecord {
  id: string;
  entity: string;
  type: 'candidate' | 'client' | 'council-member';
  currentStage: string;
  stageIndex: number;
  startedAt: string;
  lastActivity: string;
  nexusInteractions: number;
  status: 'active' | 'stalled' | 'completed' | 'dropped';
}

const STAGES: JourneyStage[] = [
  { id: 'awareness', label: 'Awareness', count: 1240, conversionRate: 100, avgTimeDays: 0, dropOff: 0 },
  { id: 'engagement', label: 'Engagement', count: 856, conversionRate: 69, avgTimeDays: 3, dropOff: 384 },
  { id: 'consideration', label: 'Consideration', count: 412, conversionRate: 48, avgTimeDays: 9, dropOff: 444 },
  { id: 'assessment', label: 'Assessment', count: 198, conversionRate: 48, avgTimeDays: 14, dropOff: 214 },
  { id: 'shortlist', label: 'Shortlist', count: 96, conversionRate: 48, avgTimeDays: 21, dropOff: 102 },
  { id: 'offer', label: 'Offer', count: 41, conversionRate: 43, avgTimeDays: 32, dropOff: 55 },
  { id: 'placement', label: 'Placement', count: 28, conversionRate: 68, avgTimeDays: 47, dropOff: 13 },
];

const RECORDS: JourneyRecord[] = [
  { id: 'jr-1', entity: 'Sarah Chen', type: 'candidate', currentStage: 'shortlist', stageIndex: 4, startedAt: '2026-06-20T10:00:00Z', lastActivity: '2026-07-20T14:00:00Z', nexusInteractions: 14, status: 'active' },
  { id: 'jr-2', entity: 'ACME Corp', type: 'client', currentStage: 'assessment', stageIndex: 3, startedAt: '2026-06-15T10:00:00Z', lastActivity: '2026-07-21T09:30:00Z', nexusInteractions: 28, status: 'active' },
  { id: 'jr-3', entity: 'Michael Tan', type: 'council-member', currentStage: 'engagement', stageIndex: 1, startedAt: '2026-07-10T10:00:00Z', lastActivity: '2026-07-19T16:00:00Z', nexusInteractions: 6, status: 'stalled' },
  { id: 'jr-4', entity: 'Priya Kumar', type: 'candidate', currentStage: 'placement', stageIndex: 6, startedAt: '2026-05-01T10:00:00Z', lastActivity: '2026-07-18T11:00:00Z', nexusInteractions: 42, status: 'completed' },
  { id: 'jr-5', entity: 'FinBank Asia', type: 'client', currentStage: 'consideration', stageIndex: 2, startedAt: '2026-06-28T10:00:00Z', lastActivity: '2026-07-15T10:00:00Z', nexusInteractions: 19, status: 'stalled' },
];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  active: { color: 'text-blue-600', bg: 'bg-blue-50', icon: <TrendingUp className="w-3 h-3" /> },
  stalled: { color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertCircle className="w-3 h-3" /> },
  completed: { color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 className="w-3 h-3" /> },
  dropped: { color: 'text-red-600', bg: 'bg-red-50', icon: <TrendingDown className="w-3 h-3" /> },
};

export function JourneyDashboardPage() {
  const [filter, setFilter] = useState<'all' | 'candidate' | 'client' | 'council-member'>('all');

  const filteredRecords = useMemo(
    () => (filter === 'all' ? RECORDS : RECORDS.filter((r) => r.type === filter)),
    [filter],
  );

  const totalDropOff = STAGES.reduce((s, st) => s + st.dropOff, 0);
  const completed = STAGES[STAGES.length - 1].count;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Route className="w-6 h-6 text-blue-600" />
          Journey Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          End-to-end journey visualization across candidates, clients, and council members
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3 h-3" /> Total Journeys
          </div>
          <div className="text-2xl font-bold mt-1">{STAGES[0].count}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600">{completed}</div>
          <div className="text-[10px] text-gray-400">
            {((completed / STAGES[0].count) * 100).toFixed(1)}% end-to-end rate
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingDown className="w-3 h-3" /> Drop-Off
          </div>
          <div className="text-2xl font-bold mt-1 text-red-600">{totalDropOff}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" /> Avg Cycle Time
          </div>
          <div className="text-2xl font-bold mt-1">47 days</div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Journey Funnel</h2>
        <div className="space-y-2">
          {STAGES.map((stage, i) => {
            const widthPct = (stage.count / STAGES[0].count) * 100;
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="w-28 text-sm text-gray-700 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {stage.label}
                </div>
                <div className="flex-1 relative h-8 bg-gray-50 rounded">
                  <div
                    className="h-full rounded flex items-center px-3 text-white text-xs font-medium transition-all"
                    style={{
                      width: `${Math.max(widthPct, 8)}%`,
                      background: `linear-gradient(90deg, #3B82F6 ${100 - i * 8}%, #8B5CF6 100%)`,
                    }}
                  >
                    {stage.count.toLocaleString()}
                  </div>
                </div>
                <div className="w-20 text-right text-xs">
                  <span className="text-gray-900 font-medium">{stage.conversionRate}%</span>
                  <span className="text-gray-400"> conv</span>
                </div>
                <div className="w-24 text-right text-xs text-gray-500">
                  {stage.dropOff > 0 ? (
                    <span className="text-red-500">-{stage.dropOff}</span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 mt-3 pl-28 pr-44">
          <span>Stage</span>
          <span>Conversion</span>
          <span>Drop-off</span>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Active Journeys</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded bg-white"
            >
              <option value="all">All Types</option>
              <option value="candidate">Candidates</option>
              <option value="client">Clients</option>
              <option value="council-member">Council Members</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          {filteredRecords.map((r) => {
            const sc = statusConfig[r.status];
            const progress = ((r.stageIndex + 1) / STAGES.length) * 100;
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{r.entity}</span>
                      <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                      <Badge className={`text-[10px] border-0 ${sc.bg} ${sc.color}`}>
                        {sc.icon}
                        <span className="ml-1 capitalize">{r.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Stage: {STAGES[r.stageIndex].label}</span>
                      <span>· Started {new Date(r.startedAt).toLocaleDateString()}</span>
                      <span>· Last activity {new Date(r.lastActivity).toLocaleDateString()}</span>
                      <span>· {r.nexusInteractions} Nexus interactions</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
