/**
 * src/components/nexus/ProactiveSuggestionsPanel.tsx — S7-T05 (N5)
 *
 * Surfaces pending proactive suggestions (stage changes, new matches, assessment
 * milestones, profile strengths, stale-conversation nudges) to the user inside
 * the Nexus chat surface. Each suggestion has a CTA + dismiss action.
 *
 * Data source: GET /api/nexus/suggestions (RBAC-authenticated).
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell, X, ArrowRight, Loader2, Sparkles, TrendingUp,
  Award, Target, Clock,
} from 'lucide-react';
import { authFetch } from '@/utils/authFetch';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

interface Suggestion {
  id: string;
  trigger_type: 'stage_change' | 'new_match' | 'assessment_complete' | 'profile_strength' | 'stale_conversation';
  title: string;
  body: string;
  cta_label: string | null;
  cta_link: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

const TRIGGER_META: Record<
  Suggestion['trigger_type'],
  { icon: React.ComponentType<{ className?: string }>; tint: string; label: string }
> = {
  stage_change:        { icon: TrendingUp, tint: 'bg-[#EFF6FF] text-[#1D4ED8]',  label: 'Pipeline update' },
  new_match:           { icon: Sparkles,   tint: 'bg-[#ECFDF5] text-[#047857]',  label: 'New match' },
  assessment_complete: { icon: Award,      tint: 'bg-[#F5F3FF] text-[#6D28D9]',  label: 'Milestone' },
  profile_strength:    { icon: Target,     tint: 'bg-[#FFFBEB] text-[#B45309]',  label: 'Strength' },
  stale_conversation:  { icon: Clock,      tint: 'bg-[#FDF2F8] text-[#9D174D]',  label: 'Nudge' },
};

export function ProactiveSuggestionsPanel() {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await authFetch('/api/nexus/suggestions?limit=5');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // Non-blocking — the panel simply stays hidden.
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
    // Refresh every 5 minutes so newly generated suggestions appear.
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const dismiss = async (id: string) => {
    // Optimistic hide.
    setDismissedIds((prev) => new Set(prev).add(id));
    try {
      await authFetch(`/api/nexus/suggestions/${id}/dismiss`, { method: 'POST' });
    } catch {
      // Revert on failure.
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error('Could not dismiss suggestion');
    }
  };

  if (loading || suggestions.length === 0) return null;

  const visible = suggestions.filter((s) => !dismissedIds.has(s.id));
  if (visible.length === 0) return null;

  return (
    <div className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
      <div className="max-w-[800px] mx-auto px-6 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#666] font-semibold">
          <Bell className="w-3 h-3" />
          <span>Proactive suggestions</span>
        </div>
        {visible.slice(0, 3).map((s) => {
          const meta = TRIGGER_META[s.trigger_type] || TRIGGER_META.stale_conversation;
          const Icon = meta.icon;
          return (
            <div
              key={s.id}
              className="flex items-start gap-3 p-3 bg-white border border-[#E5E5E5]"
              style={{ }}
            >
              <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${meta.tint}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#999] font-medium">
                    {meta.label}
                  </span>
                  {s.priority === 'high' || s.priority === 'urgent' ? (
                    <span className="text-[10px] uppercase tracking-wider text-[#DC2626] font-semibold">
                      {s.priority}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm font-medium text-[#1A1A2E] mb-0.5">{s.title}</div>
                <div className="text-xs text-[#555] leading-relaxed">{s.body}</div>
                {s.cta_label && s.cta_link && (
                  <a
                    href={s.cta_link}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#C108AB] hover:text-[#A00790]"
                  >
                    {s.cta_label}
                    <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(s.id)}
                aria-label="Dismiss"
                className="flex-shrink-0 p-1 text-[#999] hover:text-[#333] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
