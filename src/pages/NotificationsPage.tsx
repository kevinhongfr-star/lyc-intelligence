import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle2, Clock, Loader2, Zap, Mail, Linkedin, Phone, Filter, ExternalLink, TrendingUp, ChevronRight, Building2, Users, Briefcase } from 'lucide-react';
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
  const label = score >= 85 ? 'Critical' : score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
      <TrendingUp size={9} />
      {label} {score}
    </span>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications, loading, mutate } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'pending' | 'high'>('all');

  const filtered = useMemo(() => {
    if (filter === 'pending') return notifications.filter(n => n.status === 'Pending');
    if (filter === 'high') return notifications.filter(n => (n.priority_score ?? 0) >= 80);
    return notifications;
  }, [notifications, filter]);

  const pendingCount = notifications.filter(n => n.status === 'Pending').length;
  const highPriorityCount = notifications.filter(n => (n.priority_score ?? 0) >= 80 && n.status !== 'Completed').length;

  // Extract client name from notification data
  const getClientName = (n: any) => {
    return n.client_name || n.organization_name || n.company_name || n.mandate?.organizations?.name || n.related_entity?.client || 'Unknown Client';
  };

  // Extract mandate/position title
  const getPositionTitle = (n: any) => {
    return n.position_title || n.mandate?.position_title || n.related_entity?.position || '';
  };

  // Determine navigation target based on notification type
  const getNavigationTarget = (n: any) => {
    if (n.mandate_id) return `/app/mandates/${n.mandate_id}`;
    if (n.candidate_id) return `/app/candidates/${n.candidate_id}`;
    if (n.org_id || n.organization_id) return `/app/companies`;
    if (n.action_type?.toLowerCase().includes('pipeline')) return '/app/pipeline';
    if (n.action_type?.toLowerCase().includes('candidate')) return '/app/candidates';
    if (n.action_type?.toLowerCase().includes('mandate')) return '/app/mandates';
    return null;
  };

  const handleCardClick = (n: any) => {
    const target = getNavigationTarget(n);
    if (target) navigate(target);
  };

  const handleMarkDone = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation();
    // TODO: Implement mark-as-done via API
    console.log('Mark done:', n.id);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
            const clientName = getClientName(n);
            const positionTitle = getPositionTitle(n);
            const navTarget = getNavigationTarget(n);
            const isClickable = !!navTarget;

            return (
              <div
                key={n.id}
                onClick={() => handleCardClick(n)}
                className={`bg-card border border-border p-4 transition-all ${
                  isClickable 
                    ? 'cursor-pointer hover:border-accent/40 hover:shadow-md active:scale-[0.995]' 
                    : ''
                }`}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                <div className="flex items-start gap-4">
                  {/* Priority + Channel */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
                    <PriorityBadge score={n.priority_score ?? 0} />
                    {CHANNEL_ICONS[n.channel] || <Zap className="w-3.5 h-3.5 text-text-muted" />}
                  </div>

                  {/* Content — Client Name FIRST */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Row 1: Client name — the most important info */}
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm font-bold text-text-primary truncate">
                        {clientName}
                      </span>
                      {positionTitle && (
                        <>
                          <span className="text-text-muted text-xs">·</span>
                          <Briefcase className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          <span className="text-xs text-text-secondary truncate">
                            {positionTitle}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Row 2: Action + Status + Due */}
                    <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Row 3: Action description */}
                    <p className="text-sm text-text-primary leading-relaxed">
                      {n.action_description}
                    </p>

                    {/* Row 4: Commercial rationale (collapsible) */}
                    {n.commercial_rationale && (
                      <div className="bg-bg-tertiary/50 rounded-none p-3">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Commercial Rationale</p>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{n.commercial_rationale}</p>
                      </div>
                    )}
                  </div>

                  {/* Right side: Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {isClickable && (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                    {n.status === 'Pending' && (
                      <button
                        onClick={handleMarkDone}
                        className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                      >
                        ✓ Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
