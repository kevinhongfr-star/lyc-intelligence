/**
 * src/pages/dex/DexJourneyPage.tsx — S7-T06 (N6)
 *
 * Journey Dashboard: a unified visual timeline of the user's Nexus journey.
 * Aggregates conversations, insights, pipeline milestones, and proactive
 * suggestions into a single chronological view, with summary KPIs at the top.
 *
 * Data source: GET /api/nexus/journey
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, MessageSquare, Sparkles, TrendingUp, Award,
  Target, Clock, Bell, Calendar, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';

type EntryType =
  | 'conversation' | 'insight' | 'milestone' | 'application'
  | 'stage_change' | 'suggestion' | 'assessment';

interface JourneyEntry {
  id: string;
  type: EntryType;
  timestamp: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  link?: string;
}

interface JourneySummary {
  first_interaction_at: string | null;
  last_interaction_at: string | null;
  total_conversations: number;
  total_messages: number;
  total_insights: number;
  total_applications: number;
  active_applications: number;
  total_suggestions: number;
  pending_suggestions: number;
  milestones_reached: number;
  diagnostic_progress_avg: number;
}

const ENTRY_META: Record<EntryType, {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  label: string;
}> = {
  conversation:  { icon: MessageSquare, tint: 'bg-[#F3F4F6] text-[#374151]', label: 'Conversation' },
  insight:       { icon: Sparkles,      tint: 'bg-[#ECFDF5] text-[#047857]', label: 'Insight' },
  milestone:     { icon: Award,         tint: 'bg-[#FFFBEB] text-[#B45309]', label: 'Milestone' },
  application:   { icon: Target,        tint: 'bg-[#EFF6FF] text-[#1D4ED8]', label: 'Application' },
  stage_change:  { icon: TrendingUp,    tint: 'bg-[#EFF6FF] text-[#1D4ED8]', label: 'Stage change' },
  suggestion:    { icon: Bell,          tint: 'bg-[#FDF2F8] text-[#9D174D]', label: 'Suggestion' },
  assessment:    { icon: Award,         tint: 'bg-[#F5F3FF] text-[#6D28D9]', label: 'Assessment' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function DexJourneyPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JourneyEntry[]>([]);
  const [summary, setSummary] = useState<JourneySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await authFetch('/api/nexus/journey?limit=100');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        setSummary(data.summary || null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load journey');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Group entries by day for the timeline visual.
  const grouped = entries.reduce<Record<string, JourneyEntry[]>>((acc, e) => {
    const day = formatDate(e.timestamp);
    (acc[day] ||= []).push(e);
    return acc;
  }, {});
  const days = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] bg-white sticky top-0 z-10">
        <div className="max-w-[1000px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dex/chat"
              className="p-2 -ml-2 text-[#666] hover:text-[#1A1A2E] transition-colors"
              aria-label="Back to Nexus"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-serif text-xl text-[#1A1A2E]" style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}>
                Your Journey
              </h1>
              <p className="text-xs text-[#666]">
                {summary?.first_interaction_at
                  ? `Since ${formatDate(summary.first_interaction_at)}`
                  : 'A timeline of your progress with Nexus'}
              </p>
            </div>
          </div>
          <Link
            to="/dex/chat"
            className="text-sm text-[#C108AB] hover:text-[#A00790] font-medium"
          >
            Continue with Nexus →
          </Link>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[#C108AB] animate-spin" />
            <p className="text-sm text-[#666]">Assembling your timeline…</p>
          </div>
        ) : error ? (
          <div className="border border-[#E5E5E5] p-6 text-center">
            <p className="text-sm text-[#DC2626] mb-3">{error}</p>
            <button
              onClick={load}
              className="text-sm text-[#C108AB] hover:text-[#A00790] font-medium"
            >
              Try again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <EmptyJourney />
        ) : (
          <>
            {/* Summary KPIs */}
            {summary && <SummaryKpis summary={summary} />}

            {/* Timeline */}
            <section className="mt-10">
              <h2 className="text-xs uppercase tracking-wider text-[#999] font-semibold mb-4">
                Timeline
              </h2>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-[#E5E5E5]" />
                <div className="flex flex-col gap-8">
                  {days.map((day) => (
                    <div key={day} className="relative">
                      <div className="flex items-center gap-3 mb-3 ml-12">
                        <Calendar className="w-3.5 h-3.5 text-[#999]" />
                        <span className="text-xs font-semibold text-[#666] uppercase tracking-wider">
                          {day}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {grouped[day].map((entry) => (
                          <TimelineCard key={`${entry.type}-${entry.id}`} entry={entry} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function SummaryKpis({ summary }: { summary: JourneySummary }) {
  const kpis = [
    { label: 'Conversations', value: summary.total_conversations, icon: MessageSquare, tint: 'text-[#374151]' },
    { label: 'Messages exchanged', value: summary.total_messages, icon: Sparkles, tint: 'text-[#047857]' },
    { label: 'Insights captured', value: summary.total_insights, icon: Target, tint: 'text-[#1D4ED8]' },
    { label: 'Active applications', value: summary.active_applications, icon: TrendingUp, tint: 'text-[#1D4ED8]' },
    { label: 'Milestones reached', value: summary.milestones_reached, icon: Award, tint: 'text-[#B45309]' },
    { label: 'Pending suggestions', value: summary.pending_suggestions, icon: Bell, tint: 'text-[#9D174D]' },
  ];
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div key={k.label} className="border border-[#E5E5E5] p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${k.tint}`} />
              <span className="text-[10px] uppercase tracking-wider text-[#999] font-medium">
                {k.label}
              </span>
            </div>
            <div className="text-2xl font-semibold text-[#1A1A2E]" style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}>
              {k.value}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function TimelineCard({ entry }: { entry: JourneyEntry }) {
  const meta = ENTRY_META[entry.type] || ENTRY_META.conversation;
  const Icon = meta.icon;
  const content = (
    <div className="flex items-start gap-3 ml-12 p-3 border border-[#E5E5E5] bg-white hover:border-[#C108AB]/40 transition-colors">
      <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center ${meta.tint}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#999] font-medium">
            {meta.label}
          </span>
          <span className="text-[10px] text-[#999]">· {formatDateTime(entry.timestamp)}</span>
        </div>
        <div className="text-sm font-medium text-[#1A1A2E] mb-0.5">{entry.title}</div>
        {entry.description && (
          <div className="text-xs text-[#555] leading-relaxed">{entry.description}</div>
        )}
      </div>
      {entry.link && (
        <ChevronRight className="w-4 h-4 text-[#999] flex-shrink-0" />
      )}
    </div>
  );

  // Anchor to the timeline dot.
  return (
    <div className="relative">
      <div className={`absolute left-[15px] top-3 w-2.5 h-2.5 ${meta.tint.split('')[0]} border-2 border-white`} />
      {entry.link ? (
        <Link to={entry.link} className="block">{content}</Link>
      ) : (
        content
      )}
    </div>
  );
}

function EmptyJourney() {
  return (
    <div className="text-center py-20">
      <Clock className="w-10 h-10 text-[#C108AB] mx-auto mb-4" />
      <h2 className="font-serif text-xl text-[#1A1A2E] mb-2" style={{ fontFamily: "'Crimson Pro', Georgia, serif" }}>
        Your journey starts here
      </h2>
      <p className="text-sm text-[#666] mb-6 max-w-md mx-auto">
        Once you start chatting with Nexus, applying to mandates, or completing
        assessments, your timeline will populate here.
      </p>
      <Link
        to="/dex/chat"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C108AB] text-white text-sm font-medium hover:bg-[#A00790] transition-colors"
        style={{ }}
      >
        Start a conversation
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
