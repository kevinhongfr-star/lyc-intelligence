import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle2, Clock, Loader2, Zap, Mail, Linkedin, Phone, Filter, ExternalLink, TrendingUp, ChevronRight, Building2, Users, Briefcase } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useNotifications } from '@/hooks/useSupabaseData';

const CHANNEL_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  Email:   { icon: <Mail className="w-3.5 h-3.5" />, bg: 'rgba(44,82,130,0.08)' },
  LinkedIn:{ icon: <Linkedin className="w-3.5 h-3.5" />, bg: 'rgba(44,82,130,0.08)' },
  Phone:   { icon: <Phone className="w-3.5 h-3.5" />, bg: 'rgba(26,125,66,0.08)' },
};

function PriorityBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#C0392B' : score >= 70 ? '#B8860B' : score >= 50 ? '#2C5282' : '#A3A3A3';
  const label = score >= 85 ? 'Critical' : score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}15`, color }}>
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

  const getClientName = (n: any) => {
    return n.client_name || n.organization_name || n.company_name || n.mandate?.organizations?.name || n.related_entity?.client || 'Unknown Client';
  };

  const getPositionTitle = (n: any) => {
    return n.position_title || n.mandate?.position_title || n.related_entity?.position || '';
  };

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
    console.log('Mark done:', n.id);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-[#C108AB]" />
      <span className="ml-3 text-sm text-[#A3A3A3]">Loading action items...</span>
    </div>
  );

  const filterBtns: { key: 'all' | 'pending' | 'high'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'high', label: 'High Priority', count: highPriorityCount },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#171717] tracking-tight">Action Items</h1>
          <p className="text-sm text-[#A3A3A3] mt-1">{pendingCount} pending · {highPriorityCount} high priority</p>
        </div>
        <div className="flex gap-1 p-1 bg-[#F7F7F7]">
          {filterBtns.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-4 py-2 text-xs font-semibold transition-all duration-200 min-h-[36px] ${
                filter === btn.key
                  ? 'bg-white text-[#171717] shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#171717]'
              }`}
            >
              {btn.label} ({btn.count})
            </button>
          ))}
        </div>
      </div>

      {/* Notification Cards */}
      {filtered.length === 0 ? (
        <div
          className="bg-white p-16 text-center"
          style={{ boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' }}
        >
          <Bell className="w-12 h-12 mx-auto mb-4 text-[#D4D4D4] opacity-40" />
          <p className="text-[#A3A3A3] text-sm">No action items match your filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const clientName = getClientName(n);
            const positionTitle = getPositionTitle(n);
            const navTarget = getNavigationTarget(n);
            const isClickable = !!navTarget;
            const channelInfo = CHANNEL_ICONS[n.channel];

            const statusStyle =
              n.status === 'Pending' ? { bg: 'rgba(184,134,11,0.08)', text: '#B8860B' } :
              n.status === 'In Progress' ? { bg: 'rgba(44,82,130,0.08)', text: '#2C5282' } :
              { bg: 'rgba(26,125,66,0.08)', text: '#1A7D42' };

            return (
              <div
                key={n.id}
                onClick={() => isClickable && handleCardClick(n)}
                className={`bg-white p-5 transition-all duration-300 group ${
                  isClickable ? 'cursor-pointer hover:-translate-y-0.5' : ''
                }`}
                style={{
                  boxShadow: '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)',
                }}
                onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(26,23,20,0.08), 0 4px 8px rgba(26,23,20,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)'; }}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
              >
                <div className="flex items-start gap-4">
                  {/* Left: Priority + Channel */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
                    <PriorityBadge score={n.priority_score ?? 0} />
                    {channelInfo && (
                      <div className="w-7 h-7 flex items-center justify-center" style={{ background: channelInfo.bg }}>
                        {channelInfo.icon}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Client name — most important */}
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#C108AB] flex-shrink-0" />
                      <span className="text-sm font-bold text-[#171717] truncate">
                        {clientName}
                      </span>
                      {positionTitle && (
                        <>
                          <span className="text-[#EBEBEB] text-xs">·</span>
                          <Briefcase className="w-3.5 h-3.5 text-[#A3A3A3] flex-shrink-0" />
                          <span className="text-xs text-[#525252] truncate">
                            {positionTitle}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Status row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="text-[10px]">{n.action_type}</Badge>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5"
                        style={{ background: statusStyle.bg, color: statusStyle.text }}
                      >
                        {n.status}
                      </span>
                      {n.due_date && (
                        <span className="text-[10px] text-[#A3A3A3] flex items-center gap-1 font-medium">
                          <Clock size={9} />
                          Due: {new Date(n.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[#525252] leading-relaxed">
                      {n.action_description}
                    </p>

                    {/* Commercial rationale */}
                    {n.commercial_rationale && (
                      <div className="p-3" style={{ background: '#FAFAFA', borderLeft: '2px solid #C108AB' }}>
                        <p className="text-[10px] font-bold text-[#C108AB] uppercase tracking-[1.5px] mb-1">Commercial Rationale</p>
                        <p className="text-[11px] text-[#525252] leading-relaxed">{n.commercial_rationale}</p>
                      </div>
                    )}
                  </div>

                  {/* Right side: Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-[#D4D4D4] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {n.status === 'Pending' && (
                      <button
                        onClick={(e) => handleMarkDone(e, n)}
                        className="text-[10px] font-bold px-2.5 py-1 transition-colors duration-200"
                        style={{ background: 'rgba(26,125,66,0.08)', color: '#1A7D42' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,125,66,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(26,125,66,0.08)'; }}
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
