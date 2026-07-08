import React, { useState, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Loader2, Zap, Mail, Linkedin, Phone, Filter, ExternalLink, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useNotifications } from '@/hooks/useSupabaseData';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  Email: <Mail className="w-3.5 h-3.5 text-blue-400" />,
  LinkedIn: <Linkedin className="w-3.5 h-3.5 text-sky-400" />,
  Phone: <Phone className="w-3.5 h-3.5 text-green-400" />,
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Pending: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  'In Progress': { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  Completed: { bg: 'bg-green-500/10', text: 'text-green-400' },
};

function PriorityBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#EF4444' : score >= 70 ? '#F59E0B' : score >= 50 ? '#3B82F6' : '#94A3B8';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
      <TrendingUp size={9} />
      {score}
    </span>
  );
}

export function NotificationsPage() {
  const { data: notifications, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'pending' | 'high'>('all');

  const filtered = useMemo(() => {
    if (filter === 'pending') return notifications.filter(n => n.status === 'Pending');
    if (filter === 'high') return notifications.filter(n => (n.priority_score ?? 0) >= 80);
    return notifications;
  }, [notifications, filter]);

  const pendingCount = notifications.filter(n => n.status === 'Pending').length;
  const highPriorityCount = notifications.filter(n => (n.priority_score ?? 0) >= 80 && n.status !== 'Completed').length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Action Items</h1>
          <p className="text-text-secondary">{pendingCount} pending · {highPriorityCount} high priority</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-2 text-sm rounded-none min-h-[44px] ${filter === 'all' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>All ({notifications.length})</button>
          <button onClick={() => setFilter('pending')} className={`px-3 py-2 text-sm rounded-none min-h-[44px] ${filter === 'pending' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Pending ({pendingCount})</button>
          <button onClick={() => setFilter('high')} className={`px-3 py-2 text-sm rounded-none min-h-[44px] ${filter === 'high' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>High Priority ({highPriorityCount})</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
            <p className="text-text-muted text-sm">No action items match your filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const statusColor = STATUS_COLORS[n.status] || STATUS_COLORS.Pending;
            return (
              <Card key={n.id} className="hover:border-accent/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Priority + Channel */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
                      <PriorityBadge score={n.priority_score ?? 0} />
                      {CHANNEL_ICONS[n.channel] || <Zap className="w-3.5 h-3.5 text-text-muted" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px]">{n.action_type}</Badge>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor.bg} ${statusColor.text}`}>
                          {n.status}
                        </span>
                        {n.due_date && (
                          <span className="text-[10px] text-text-muted flex items-center gap-1">
                            <Clock size={9} />
                            Due: {new Date(n.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-text-primary leading-relaxed">
                        {n.action_description}
                      </p>

                      {n.commercial_rationale && (
                        <div className="bg-bg-tertiary/50 rounded-none p-3 mt-2">
                          <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Commercial Rationale</p>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{n.commercial_rationale}</p>
                        </div>
                      )}

                      {n.deepseek_reasoning && (
                        <p className="text-[10px] text-text-muted italic">{n.deepseek_reasoning}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
