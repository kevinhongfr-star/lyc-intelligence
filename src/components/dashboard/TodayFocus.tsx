import React from 'react';
import {
  Users,
  Calendar,
  MessageSquare,
  FileText,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link } from 'react-router-dom';

interface FocusItem {
  id: string;
  type: 'review' | 'interview' | 'followup' | 'deadline';
  title: string;
  description: string;
  mandateId: string;
  mandateTitle: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface TodayFocusProps {
  items?: FocusItem[];
  loading?: boolean;
}

const defaultItems: FocusItem[] = [
  {
    id: '1',
    type: 'review',
    title: 'Review 5 new candidates',
    description: 'New candidates added to VP Engineering sweep',
    mandateId: '1',
    mandateTitle: 'VP Engineering',
    priority: 'high',
    dueDate: 'Today',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview prep for 2 candidates',
    description: 'TechCorp VP Engineering — Round 2 interviews tomorrow',
    mandateId: '1',
    mandateTitle: 'VP Engineering',
    priority: 'high',
    dueDate: 'Tomorrow',
  },
  {
    id: '3',
    type: 'followup',
    title: 'Client follow-up call',
    description: 'Weekly update with FinanceCo MD search',
    mandateId: '2',
    mandateTitle: 'Managing Director',
    priority: 'medium',
    dueDate: 'Today',
  },
  {
    id: '4',
    type: 'deadline',
    title: 'Shortlist report due',
    description: 'LENS report for Head of Product mandate',
    mandateId: '3',
    mandateTitle: 'Head of Product',
    priority: 'medium',
    dueDate: 'Jun 26',
  },
];

export function TodayFocus({ items = defaultItems, loading }: TodayFocusProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review':
        return <Users className="w-4 h-4" />;
      case 'interview':
        return <Calendar className="w-4 h-4" />;
      case 'followup':
        return <MessageSquare className="w-4 h-4" />;
      case 'deadline':
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-500 bg-red-500/10';
    switch (type) {
      case 'review':
        return 'text-blue-500 bg-blue-500/10';
      case 'interview':
        return 'text-purple-500 bg-purple-500/10';
      case 'followup':
        return 'text-amber-500 bg-amber-500/10';
      case 'deadline':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'review':
        return 'Review';
      case 'interview':
        return 'Interview';
      case 'followup':
        return 'Follow-up';
      case 'deadline':
        return 'Deadline';
      default:
        return type;
    }
  };

  const highPriorityCount = items.filter((i) => i.priority === 'high').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-accent" />
          Today's Focus
          {highPriorityCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {highPriorityCount} high priority
            </Badge>
          )}
        </CardTitle>
        <Link to="/platform/pipeline" className="text-sm text-accent hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-bg-tertiary rounded-lg" />
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-text-muted">All caught up! Nothing pending today.</p>
          </div>
        ) : (
          items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              to={`/platform/mandates/${item.mandateId}`}
              className="block"
            >
              <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(item.type, item.priority)}`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                    {item.priority === 'high' && (
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted truncate">{item.description}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{item.mandateTitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {getTypeLabel(item.type)}
                  </Badge>
                  <p className="text-[11px] text-text-muted mt-1">{item.dueDate}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
