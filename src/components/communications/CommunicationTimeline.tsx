'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

interface TimelineItem {
  type: string;
  channel: string;
  timestamp: string;
  summary: string;
  outcome?: string;
  direction?: string;
  subject?: string;
  preview?: string;
  has_attachments?: boolean;
  interaction_type?: string;
  id: string;
}

interface CommunicationTimelineProps {
  contactId: string;
  onEmailThreadClick?: (threadId: string) => void;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  wechat: <MessageCircle className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-600 border-blue-200',
  wechat: 'bg-green-100 text-green-600 border-green-200',
  call: 'bg-purple-100 text-purple-600 border-purple-200',
  meeting: 'bg-amber-100 text-amber-600 border-amber-200',
};

const OUTCOME_COLORS: Record<string, string> = {
  positive: 'text-emerald-600',
  responded: 'text-emerald-600',
  neutral: 'text-gray-500',
  follow_up: 'text-blue-600',
  negative: 'text-red-600',
  no_response: 'text-gray-500',
  meeting_scheduled: 'text-purple-600',
  scheduled: 'text-purple-600',
};

export function CommunicationTimeline({ contactId, onEmailThreadClick }: CommunicationTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [channelStats, setChannelStats] = useState({ email: 0, wechat: 0, other: 0 });

  useEffect(() => {
    loadTimeline();
  }, [contactId]);

  const loadTimeline = async () => {
    if (!contactId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/communications`);
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline || []);
        setChannelStats(data.channels || { email: 0, wechat: 0, other: 0 });
      }
    } catch (e) {
      console.error('Failed to load timeline:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTimeline = timeline.filter(item => {
    if (channelFilter === 'all') return true;
    if (channelFilter === 'email') return item.type === 'email';
    if (channelFilter === 'wechat') return item.type === 'wechat';
    if (channelFilter === 'other') return item.type === 'outreach';
    return true;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getChannelIcon = (item: TimelineItem) => {
    if (item.type === 'email') return CHANNEL_ICONS.email;
    if (item.type === 'wechat') return CHANNEL_ICONS.wechat;
    if (item.channel === 'call') return CHANNEL_ICONS.call;
    if (item.channel === 'meeting') return CHANNEL_ICONS.meeting;
    return <MessageSquare className="w-4 h-4" />;
  };

  const getChannelColor = (item: TimelineItem) => {
    if (item.type === 'email') return CHANNEL_COLORS.email;
    if (item.type === 'wechat') return CHANNEL_COLORS.wechat;
    if (item.channel === 'call') return CHANNEL_COLORS.call;
    if (item.channel === 'meeting') return CHANNEL_COLORS.meeting;
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getChannelLabel = (item: TimelineItem) => {
    if (item.type === 'email') return 'Email';
    if (item.type === 'wechat') return 'WeChat';
    return item.channel || 'Other';
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-none p-8 text-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        <p className="text-text-muted mt-2">Loading communications...</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">Communication Timeline</h3>
            <p className="text-sm text-text-muted mt-0.5">
              {timeline.length} total interactions
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-text-muted">{channelStats.email} email</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-green-500" />
              <span className="text-text-muted">{channelStats.wechat} WeChat</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-text-muted">{channelStats.other} other</span>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="w-4 h-4 text-text-muted" />
          <div className="flex gap-1">
            {['all', 'email', 'wechat', 'other'].map(filter => (
              <button
                key={filter}
                onClick={() => setChannelFilter(filter)}
                className={`px-3 py-1 rounded-none text-xs font-medium transition-colors ${
                  channelFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredTimeline.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-text-muted mx-auto" />
            <h4 className="font-medium text-text-primary mt-4">No communications yet</h4>
            <p className="text-sm text-text-muted mt-1">
              Start tracking outreach for this candidate.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />

            <div className="divide-y divide-border">
              {filteredTimeline.map((item, index) => (
                <div
                  key={item.id}
                  className="relative pl-16 pr-6 py-4 hover:bg-bg-alt/30 transition-colors"
                >
                  {/* Icon dot */}
                  <div className={`absolute left-5 w-7 h-7 rounded-full border-2 flex items-center justify-center ${getChannelColor(item)} bg-card`}>
                    {getChannelIcon(item)}
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-text-secondary uppercase">
                        {getChannelLabel(item)}
                      </span>
                      {item.direction && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          {item.direction === 'outbound' ? (
                            <><ArrowRight className="w-3 h-3" /> Sent</>
                          ) : (
                            <><ArrowLeft className="w-3 h-3" /> Received</>
                          )}
                        </span>
                      )}
                      {item.outcome && (
                        <span className={`text-xs font-medium ${OUTCOME_COLORS[item.outcome] || 'text-gray-500'}`}>
                          {item.outcome.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mt-2">
                    {item.subject && (
                      <h4 className="font-medium text-text-primary">{item.subject}</h4>
                    )}
                    <p className="text-sm text-text-secondary mt-1">{item.summary}</p>

                    {/* Preview (expandable) */}
                    {item.preview && (
                      <div>
                        {expandedId === item.id ? (
                          <div>
                            <p className="text-sm text-text-muted mt-2">{item.preview}</p>
                            {item.type === 'email' && item.thread_id && onEmailThreadClick && (
                              <button
                                onClick={() => onEmailThreadClick(item.thread_id!)}
                                className="text-xs text-primary hover:text-primary/80 mt-2 font-medium"
                              >
                                View full thread →
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedId(null)}
                              className="text-xs text-text-muted flex items-center gap-1 mt-2"
                            >
                              <ChevronUp className="w-3 h-3" />
                              Show less
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setExpandedId(item.id)}
                            className="text-xs text-text-muted flex items-center gap-1 mt-2 hover:text-text-secondary"
                          >
                            <ChevronDown className="w-3 h-3" />
                            Show preview
                          </button>
                        )}
                      </div>
                    )}

                    {/* WeChat interaction type */}
                    {item.interaction_type && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-bg-alt rounded text-text-muted">
                        {item.interaction_type.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunicationTimeline;
