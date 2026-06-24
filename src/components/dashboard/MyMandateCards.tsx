import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Clock,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { STAGE_ORDER, STAGE_CONFIG } from '@/types/mandate';

interface MandateCard {
  id: string;
  title: string;
  company: string;
  status: string;
  candidateCount: number;
  shortlistedCount: number;
  interviewCount: number;
  nextAction: string;
  lastUpdate: string;
  tier1_count?: number;
  tier2_count?: number;
  shortlisted_count?: number;
  interview_count?: number;
  placed_count?: number;
}

interface MyMandateCardsProps {
  mandates?: MandateCard[];
  loading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  '1_search': 'SWEEP',
  '2_call': 'CANVA',
  '3_deliver': 'GRID/LENS',
  'won': 'Won',
  'on_hold': 'On Hold',
  'lost': 'Lost',
  'completed': 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  '1_search': 'bg-sweep/20 text-sweep-light',
  '2_call': 'bg-amber-500/20 text-amber-600',
  '3_deliver': 'bg-green-500/20 text-green-600',
  'won': 'bg-green-500/20 text-green-600',
  'on_hold': 'bg-yellow-500/20 text-yellow-600',
  'lost': 'bg-red-500/20 text-red-600',
  'completed': 'bg-gray-500/20 text-gray-600',
};

export function MyMandateCards({ mandates, loading }: MyMandateCardsProps) {
  const defaultMandates: MandateCard[] = [
    {
      id: '1',
      title: 'VP Engineering',
      company: 'TechCorp',
      status: '3_deliver',
      candidateCount: 45,
      shortlistedCount: 5,
      interviewCount: 2,
      nextAction: 'Prepare LENS report for client',
      lastUpdate: '2h ago',
    },
    {
      id: '2',
      title: 'Managing Director',
      company: 'FinanceCo',
      status: '2_call',
      candidateCount: 32,
      shortlistedCount: 0,
      interviewCount: 0,
      nextAction: 'Schedule client kickoff call',
      lastUpdate: '1d ago',
    },
    {
      id: '3',
      title: 'Head of Product',
      company: 'ScaleUp Inc',
      status: '1_search',
      candidateCount: 78,
      shortlistedCount: 0,
      interviewCount: 0,
      nextAction: 'Review top 20 candidates',
      lastUpdate: '3h ago',
    },
  ];

  const displayMandates = mandates || defaultMandates;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-accent" />
          My Active Mandates
        </CardTitle>
        <Link to="/platform/mandates" className="text-sm text-accent hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-bg-tertiary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : displayMandates.length === 0 ? (
          <div className="py-8 text-center">
            <Briefcase className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="text-text-muted">No active mandates</p>
            <Link
              to="/platform/mandates/new"
              className="text-accent text-sm hover:underline inline-block mt-2"
            >
              Create your first mandate
            </Link>
          </div>
        ) : (
          displayMandates.slice(0, 4).map((mandate) => (
            <Link
              key={mandate.id}
              to={`/platform/mandates/${mandate.id}`}
              className="block"
            >
              <div className="p-4 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-text-primary">{mandate.title}</h3>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[mandate.status] || 'bg-gray-100 text-gray-700'}
                      >
                        {STATUS_LABELS[mandate.status] || mandate.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-text-muted mt-0.5">{mandate.company}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </div>

                <div className="flex gap-1 mb-3">
                  {STAGE_ORDER.map((s) => {
                    const c =
                      s === 'SWEEP'
                        ? mandate.tier1_count || 0
                        : s === 'CANVA'
                        ? mandate.tier2_count || 0
                        : s === 'GRID'
                        ? mandate.shortlisted_count || mandate.shortlistedCount
                        : s === 'LENS'
                        ? mandate.interview_count || mandate.interviewCount
                        : mandate.placed_count || 0;
                    return (
                      <div
                        key={s}
                        className="flex-1 h-7 rounded flex items-center justify-center text-[10px] font-medium"
                        style={{
                          backgroundColor: `${STAGE_CONFIG[s].color}20`,
                          color: STAGE_CONFIG[s].color,
                        }}
                      >
                        {c}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {mandate.candidateCount} candidates
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {mandate.nextAction}
                    </span>
                  </div>
                  <span className="text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {mandate.lastUpdate}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
