import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, MessageSquare, Calendar, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import type { OutreachAttempt, OutreachChannel, OutreachOutcome } from '@/types';
import { CHANNEL_LABELS, OUTCOME_LABELS } from '@/types';
import { getOutreachAttempts, saveOutreachAttempt, deleteOutreachAttempt } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  candidateId: string;
  mandateId: string;
  candidateName: string;
  onAttemptSaved?: () => void;
}

const POSITIVE_OUTCOMES: OutreachOutcome[] = ['positive', 'interested', 'scheduled_interview', 'referred_other'];
const NEGATIVE_OUTCOMES: OutreachOutcome[] = ['negative', 'not_interested'];
const NO_RESPONSE_OUTCOMES: OutreachOutcome[] = ['no_response'];
const INVALID_OUTCOMES: OutreachOutcome[] = ['invalid_contact'];

function getOutcomeBadgeStyle(outcome: OutreachOutcome | null | undefined): string {
  if (!outcome) return 'bg-slate-100 text-slate-700 border-slate-200';
  if (POSITIVE_OUTCOMES.includes(outcome)) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (NEGATIVE_OUTCOMES.includes(outcome)) return 'bg-red-100 text-red-800 border-red-200';
  if (NO_RESPONSE_OUTCOMES.includes(outcome)) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (INVALID_OUTCOMES.includes(outcome)) return 'bg-slate-200 text-slate-700 border-slate-300';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getTimelineNodeStyle(outcome: OutreachOutcome | null | undefined): string {
  if (!outcome) return 'bg-slate-400';
  if (POSITIVE_OUTCOMES.includes(outcome)) return 'bg-emerald-500';
  if (NEGATIVE_OUTCOMES.includes(outcome)) return 'bg-red-500';
  if (NO_RESPONSE_OUTCOMES.includes(outcome)) return 'bg-amber-500';
  if (INVALID_OUTCOMES.includes(outcome)) return 'bg-slate-500';
  return 'bg-slate-400';
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function OutreachTimeline({ candidateId, mandateId, candidateName, onAttemptSaved }: Props) {
  const { profile: userProfile } = useAuthStore();
  const [attempts, setAttempts] = useState<OutreachAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [attemptDate, setAttemptDate] = useState(todayDateString());
  const [outcome, setOutcome] = useState<OutreachOutcome>('no_response');
  const [responseText, setResponseText] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAttempts = useCallback(async () => {
    setLoading(true);
    const data = await getOutreachAttempts(candidateId, mandateId);
    setAttempts(data);
    setLoading(false);
  }, [candidateId, mandateId]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const nextAttemptNumber = attempts.length > 0
      ? Math.max(...attempts.map(a => a.attempt_number), 0) + 1
      : 1;

    const ok = await saveOutreachAttempt({
      candidate_id: candidateId,
      mandate_id: mandateId,
      channel,
      attempt_number: nextAttemptNumber,
      attempt_date: attemptDate,
      outcome: outcome || null,
      response_text: responseText || null,
      notes: notes || null,
      next_action: nextAction || null,
      next_action_date: nextActionDate || null,
      created_by: userProfile?.id || null,
      organization_id: userProfile?.organization_id || null,
    });

    setSaving(false);

    if (ok) {
      setShowForm(false);
      resetForm();
      loadAttempts();
      onAttemptSaved?.();
    }
  }

  function resetForm() {
    setChannel('email');
    setAttemptDate(todayDateString());
    setOutcome('no_response');
    setResponseText('');
    setNotes('');
    setNextAction('');
    setNextActionDate('');
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this outreach attempt?')) return;
    setDeletingId(id);
    const ok = await deleteOutreachAttempt(id);
    setDeletingId(null);
    if (ok) loadAttempts();
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-text-primary">Outreach Timeline — {candidateName}</h3>
          <p className="text-sm text-text-muted mt-1">
            {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'} logged
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Log New Attempt
        </button>
      </div>

      {/* Log New Attempt Form */}
      {showForm && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              New Outreach Attempt
            </h4>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-text-muted hover:text-text-primary p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as OutreachChannel)}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[44px]"
                  required
                >
                  {(Object.keys(CHANNEL_LABELS) as OutreachChannel[]).map((c) => (
                    <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                <input
                  type="date"
                  value={attemptDate}
                  onChange={(e) => setAttemptDate(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[44px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as OutreachOutcome)}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[44px]"
                required
              >
                {(Object.keys(OUTCOME_LABELS) as OutreachOutcome[]).map((o) => (
                  <option key={o} value={o}>{OUTCOME_LABELS[o]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Response Text</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="What did the candidate say? (optional)"
                rows={2}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes on this outreach attempt"
                rows={2}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Next Action
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="e.g., Send proposal deck"
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Next Action Date
                </label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-accent/30 focus:border-accent min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-border rounded-lg min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {saving ? 'Saving...' : 'Save Attempt'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="py-8 text-center text-text-muted">Loading outreach history...</div>
      ) : attempts.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border rounded-xl">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-text-primary font-medium">No outreach attempts yet</p>
          <p className="text-sm text-text-muted mt-1">Start tracking your engagement with this candidate</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline */}
          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" aria-hidden="true" />
          <div className="space-y-4">
            {[...attempts].sort((a, b) => new Date(b.attempt_date).getTime() - new Date(a.attempt_date).getTime()).map((attempt) => (
              <div key={attempt.id} className="relative pl-8">
                {/* Timeline node */}
                <div className={`absolute left-0 top-2 w-[14px] h-[14px] rounded-full ${getTimelineNodeStyle(attempt.outcome)} border-2 border-white shadow`} aria-hidden="true" />

                {/* Card */}
                <div className="bg-bg-secondary border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-semibold text-text-muted bg-slate-100 px-2 py-0.5 rounded">
                          Attempt #{attempt.attempt_number}
                        </span>
                        <span className="text-sm font-medium text-text-primary">
                          {CHANNEL_LABELS[attempt.channel]}
                        </span>
                        <span className="text-xs text-text-muted">
                          {new Date(attempt.attempt_date).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                        {attempt.outcome && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getOutcomeBadgeStyle(attempt.outcome)}`}>
                            {OUTCOME_LABELS[attempt.outcome]}
                          </span>
                        )}
                      </div>

                      {attempt.response_text && (
                        <p className="mt-2 text-sm text-text-primary bg-white/50 rounded-lg p-3 border border-border">
                          &ldquo;{attempt.response_text}&rdquo;
                        </p>
                      )}

                      {attempt.notes && (
                        <p className="mt-2 text-sm text-text-muted leading-relaxed">
                          {attempt.notes}
                        </p>
                      )}

                      {attempt.next_action && (
                        <div className="mt-3 flex items-start gap-2 pt-2 border-t border-border">
                          <Calendar className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text-primary">{attempt.next_action}</div>
                            {attempt.next_action_date && (
                              <div className="text-xs text-text-muted mt-0.5">
                                Scheduled: {new Date(attempt.next_action_date).toLocaleDateString('en-US', {
                                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(attempt.id)}
                      disabled={deletingId === attempt.id}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      aria-label="Delete attempt"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
