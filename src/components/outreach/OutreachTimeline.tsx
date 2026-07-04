import React, { useState, useEffect } from 'react';
import { Mail, Linkedin, Phone, MessageSquare, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { getOutreachAttempts } from '@/services/supabaseApi';
import type { OutreachAttempt } from '@/types';

interface Props {
  candidateId: string;
  mandateId: string;
  candidateName: string;
}

const CHANNEL_ICONS: Record<string, React.ComponentType<{ style?: React.CSSProperties; className?: string }>> = {
  email: Mail,
  linkedin: Linkedin,
  phone: Phone,
  whatsapp: MessageSquare,
  other: MessageSquare,
};

const CHANNEL_COLORS: Record<string, string> = {
  email: '#3B82F6',
  linkedin: '#0A66C2',
  phone: '#10B981',
  whatsapp: '#25D366',
  other: '#6B7280',
};

const OUTCOME_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  no_response: { bg: '#F3F4F6', text: '#6B7280', label: 'No Response' },
  positive: { bg: '#ECFDF5', text: '#059669', label: 'Positive' },
  interested: { bg: '#EFF6FF', text: '#2563EB', label: 'Interested' },
  scheduled_interview: { bg: '#F0FDF4', text: '#16A34A', label: 'Interview' },
  negative: { bg: '#FEF2F2', text: '#DC2626', label: 'Declined' },
  referred_other: { bg: '#FFF7ED', text: '#EA580C', label: 'Referred' },
  out_of_office: { bg: '#FEFCE8', text: '#CA8A04', label: 'OOO' },
};

export function OutreachTimeline({ candidateId, mandateId, candidateName }: Props) {
  const [attempts, setAttempts] = useState<OutreachAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!candidateId || !mandateId) return;
    getOutreachAttempts(candidateId, mandateId)
      .then((data) => {
        setAttempts(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [candidateId, mandateId]);

  if (loading) {
    return (
      <div className="mt-2 py-2 text-xs text-gray-400">
        Loading outreach history…
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="mt-2 py-2 text-xs text-gray-400 italic">
        No outreach attempts recorded
      </div>
    );
  }

  const visible = expanded ? attempts : attempts.slice(0, 3);

  return (
    <div className="mt-3">
      <div className="relative border-l-2 border-gray-200 ml-2 space-y-3">
        {visible.map((a, idx) => {
          const Icon = CHANNEL_ICONS[a.channel] || CHANNEL_ICONS.other;
          const color = CHANNEL_COLORS[a.channel] || CHANNEL_COLORS.other;
          const outcome = a.outcome ? OUTCOME_BADGE[a.outcome] : null;
          const date = a.attempt_date
            ? new Date(a.attempt_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null;

          return (
            <div key={a.id || idx} className="relative pl-6">
              {/* Dot on timeline */}
              <div
                className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: color }}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon style={{ width: 14, height: 14, color }} />
                  <span className="text-xs font-medium capitalize" style={{ color }}>
                    {a.channel || 'other'}
                  </span>
                  <span className="text-xs text-gray-400">#{a.attempt_number || idx + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  {outcome && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: outcome.bg, color: outcome.text }}
                    >
                      {outcome.label}
                    </span>
                  )}
                  {date && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Calendar style={{ width: 10, height: 10 }} />
                      {date}
                    </span>
                  )}
                </div>
              </div>
              {a.notes && (
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{a.notes}</p>
              )}
              {a.next_action && (
                <p className="text-[10px] text-blue-600 mt-0.5">
                  → {a.next_action}
                  {a.next_action_date && ` by ${new Date(a.next_action_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {attempts.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 ml-2 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>Show less <ChevronUp style={{ width: 12, height: 12 }} /></>
          ) : (
            <>Show {attempts.length - 3} more attempt{attempts.length - 3 > 1 ? 's' : ''} <ChevronDown style={{ width: 12, height: 12 }} /></>
          )}
        </button>
      )}
    </div>
  );
}
