import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Briefcase,
  DollarSign,
  TrendingUp,
  ChevronRight,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const STAGES = ['prospect', 'meeting_booked', 'meeting_done', 'proposal_sent', 'negotiation', 'won'];
const STAGE_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  meeting_booked: 'Meeting Booked',
  meeting_done: 'Meeting Held',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  prospect: 'border-l-gray-400',
  meeting_booked: 'border-l-blue-500',
  meeting_done: 'border-l-blue-600',
  proposal_sent: 'border-l-purple-500',
  negotiation: 'border-l-amber-500',
  won: 'border-l-green-500',
  lost: 'border-l-red-500',
};

const MOCK_OPPORTUNITIES = [
  { id: '1', title: 'VP Engineering', company_name: 'TechCorp', stage: 'negotiation', estimated_fee_usd: 150000, probability: 70, contact_name: 'Sarah Chen', next_action: 'Final negotiation call', next_action_at: '2024-06-25', days_in_stage: 7 },
  { id: '2', title: 'Managing Director', company_name: 'FinanceCo', stage: 'proposal_sent', estimated_fee_usd: 180000, probability: 50, contact_name: 'Michael Zhang', next_action: 'Follow up on proposal', next_action_at: '2024-06-24', days_in_stage: 5 },
  { id: '3', title: 'CFO', company_name: 'ScaleUp Inc', stage: 'meeting_done', estimated_fee_usd: 120000, probability: 40, contact_name: 'Lisa Wang', next_action: 'Send proposal draft', next_action_at: '2024-06-26', days_in_stage: 3 },
  { id: '4', title: 'Head of Product', company_name: 'Retail Group', stage: 'prospect', estimated_fee_usd: 90000, probability: 15, contact_name: 'David Liu', next_action: 'Initial outreach', next_action_at: '2024-06-24', days_in_stage: 14 },
  { id: '5', title: 'COO', company_name: 'HealthTech Co', stage: 'meeting_booked', estimated_fee_usd: 135000, probability: 25, contact_name: 'Emily Zhao', next_action: 'Discovery call', next_action_at: '2024-06-27', days_in_stage: 2 },
  { id: '6', title: 'CTO', company_name: 'FinTech Startup', stage: 'prospect', estimated_fee_usd: 110000, probability: 10, contact_name: 'James Wu', next_action: 'Research company', next_action_at: '2024-06-28', days_in_stage: 5 },
  { id: '7', title: 'CHRO', company_name: 'Industrial Giant', stage: 'won', estimated_fee_usd: 160000, probability: 100, contact_name: 'Amy Sun', next_action: 'Convert to mandate', next_action_at: '2024-06-23', days_in_stage: 1 },
];

export function OpportunityList() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const filtered = MOCK_OPPORTUNITIES.filter(
    (o) =>
      o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOpportunitiesForStage = (stage: string) =>
    filtered.filter((o) => o.stage === stage);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const handleDragStart = (id: string) => setDraggedItem(id);
  const handleDragEnd = () => { setDraggedItem(null); setDragOverStage(null); };
  const handleDragOver = (e: React.DragEvent, stage: string) => { e.preventDefault(); setDragOverStage(stage); };
  const handleDrop = (stage: string) => {
    console.log(`Move ${draggedItem} to ${stage}`);
    handleDragEnd();
  };

  const stageTotal = (stage: string) =>
    getOpportunitiesForStage(stage).reduce((sum, o) => sum + (o.estimated_fee_usd || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Opportunities</h1>
          <p className="text-text-muted">{MOCK_OPPORTUNITIES.length} active deals in pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-tertiary rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors min-h-[36px] ${
                view === 'kanban' ? 'bg-bg-secondary text-text-primary font-medium' : 'text-text-muted'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 inline mr-1.5" />
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors min-h-[36px] ${
                view === 'list' ? 'bg-bg-secondary text-text-primary font-medium' : 'text-text-muted'
              }`}
            >
              <List className="w-3.5 h-3.5 inline mr-1.5" />
              List
            </button>
          </div>
          <Link to="/bd/opportunities/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Opportunity
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {STAGES.map((stage) => {
            const opps = getOpportunitiesForStage(stage);
            const total = stageTotal(stage);
            const isDragOver = dragOverStage === stage;
            return (
              <div
                key={stage}
                className={`w-72 flex-shrink-0 ${isDragOver ? 'opacity-75' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDrop={() => handleDrop(stage)}
              >
                <div className="sticky top-0 bg-bg-secondary z-10 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-text-primary text-sm flex items-center gap-2">
                      <span className={`w-1 h-4 rounded-full ${STAGE_COLORS[stage]?.replace('border-l-', 'bg-')}`} />
                      {STAGE_LABELS[stage]}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {opps.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">{formatCurrency(total)}</p>
                </div>
                <div className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${isDragOver ? 'bg-accent/5' : ''}`}>
                  {opps.map((opp) => (
                    <div
                      key={opp.id}
                      draggable
                      onDragStart={() => handleDragStart(opp.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing ${draggedItem === opp.id ? 'opacity-50' : ''}`}
                    >
                      <Link to={`/bd/opportunities/${opp.id}`}>
                        <Card className={`border-l-4 ${STAGE_COLORS[opp.stage]} hover:shadow-md transition-shadow`}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-text-primary text-sm flex-1">{opp.title}</h4>
                              <button className="text-text-muted hover:text-text-primary">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-text-muted mb-2">{opp.company_name}</p>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-text-primary text-sm">
                                {formatCurrency(opp.estimated_fee_usd)}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {opp.probability}%
                              </Badge>
                            </div>
                            {opp.next_action && (
                              <div className="mt-2 pt-2 border-t border-border text-[11px] text-text-muted">
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                                {opp.next_action}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  ))}
                  {opps.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-text-muted text-xs border-2 border-dashed border-border rounded-lg">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-muted text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Probability</th>
                  <th className="px-4 py-3">Next Action</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((opp) => (
                  <tr key={opp.id} className="border-b border-border hover:bg-bg-tertiary">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">{opp.title}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{opp.company_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {STAGE_LABELS[opp.stage]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {formatCurrency(opp.estimated_fee_usd)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${opp.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted">{opp.probability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{opp.next_action}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/bd/opportunities/${opp.id}`}>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
