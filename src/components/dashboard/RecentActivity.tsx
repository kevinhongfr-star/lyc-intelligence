import React from 'react';
import {
  Award,
  Users,
  MessageSquare,
  FileText,
  Briefcase,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ActivityItem {
  id: string;
  type: 'scoring' | 'pipeline' | 'nexus' | 'document' | 'mandate' | 'interview';
  title: string;
  detail: string;
  timestamp: string;
  mandateId?: string;
}

interface RecentActivityProps {
  items?: ActivityItem[];
  loading?: boolean;
  limit?: number;
}

const defaultItems: ActivityItem[] = [
  {
    id: '1',
    type: 'scoring',
    title: 'Completed TRIDENT scoring',
    detail: '15 candidates scored for VP Engineering mandate',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    mandateId: '1',
  },
  {
    id: '2',
    type: 'pipeline',
    title: 'Moved 3 candidates to shortlist',
    detail: 'VP Engineering — GRID stage',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    mandateId: '1',
  },
  {
    id: '3',
    type: 'nexus',
    title: 'Nexus AI session',
    detail: 'Compensation benchmark analysis for TechCorp',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'document',
    title: 'Uploaded candidate profiles',
    detail: '3 LinkedIn profiles imported for Managing Director search',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    mandateId: '2',
  },
  {
    id: '5',
    type: 'mandate',
    title: 'Created new mandate',
    detail: 'Head of Product at ScaleUp Inc',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    mandateId: '3',
  },
  {
    id: '6',
    type: 'interview',
    title: 'Scheduled interviews',
    detail: '2 candidates for VP Engineering Round 2',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mandateId: '1',
  },
];

export function RecentActivity({ items = defaultItems, loading, limit = 8 }: RecentActivityProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scoring':
        return <Award className="w-4 h-4" />;
      case 'pipeline':
        return <Users className="w-4 h-4" />;
      case 'nexus':
        return <MessageSquare className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'mandate':
        return <Briefcase className="w-4 h-4" />;
      case 'interview':
        return <Calendar className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scoring':
        return 'text-accent bg-accent/10';
      case 'pipeline':
        return 'text-blue-500 bg-blue-500/10';
      case 'nexus':
        return 'text-purple-500 bg-purple-500/10';
      case 'document':
        return 'text-green-500 bg-green-500/10';
      case 'mandate':
        return 'text-amber-500 bg-amber-500/10';
      case 'interview':
        return 'text-pink-500 bg-pink-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-bg-tertiary rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {items.slice(0, limit).map((item, i) => (
              <div
                key={item.id}
                className="flex items-start gap-3 py-2.5 border-b border-bg-tertiary last:border-0"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(item.type)}`}
                >
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{item.title}</p>
                  <p className="text-xs text-text-muted truncate">{item.detail}</p>
                </div>
                <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
                  {timeAgo(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
