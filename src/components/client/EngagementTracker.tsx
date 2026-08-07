/**
 * EngagementTracker — NPS, surveys, and engagement metrics (Phase 8)
 *
 * Tracks client engagement through:
 *   - Net Promoter Score (NPS) with 0-10 scale
 *   - Engagement metrics (logins, response time, documents viewed)
 *   - Engagement level classification (active, moderate, low, inactive)
 *   - NPS history chart
 */
import React from 'react';
import {
  Smile,
  Meh,
  Frown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle,
  Send,
  Calendar,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  submitNPS,
  fetchNPS,
  fetchEngagementMetrics,
  type NPSRecord,
  type EngagementMetrics,
} from '@/services/clientService';

type NPSScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

const NPS_CATEGORIES: { range: [number, number]; label: string; icon: any; className: string }[] = [
  { range: [9, 10], label: 'Promoter', icon: Smile, className: 'text-teal-700 border-teal-300 bg-teal-50' },
  { range: [7, 8], label: 'Passive', icon: Meh, className: 'text-amber-700 border-amber-300 bg-amber-50' },
  { range: [0, 6], label: 'Detractor', icon: Frown, className: 'text-red-700 border-red-300 bg-red-50' },
];

function getNPSCategory(score: number) {
  return NPS_CATEGORIES.find(c => score >= c.range[0] && score <= c.range[1]) || NPS_CATEGORIES[2];
}

export function EngagementTracker() {
  const [nps, setNps] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [npsData, setNpsData] = React.useState<{ nps: number; records: NPSRecord[] } | null>(null);
  const [metrics, setMetrics] = React.useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, m] = await Promise.all([fetchNPS(), fetchEngagementMetrics()]);
      if (!cancelled) {
        setNpsData(n);
        setMetrics(m);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmitNPS = async () => {
    if (nps == null) return;
    setSubmitting(true);
    const ok = await submitNPS(nps, undefined, comment.trim() || undefined);
    setSubmitting(false);
    if (ok) {
      setSubmitted(true);
      setComment('');
      const updated = await fetchNPS();
      if (updated) setNpsData(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted text-sm">
        <BarChart3 className="w-5 h-5 animate-pulse mr-2" />
        Loading engagement data...
      </div>
    );
  }

  const currentNPS = npsData?.nps ?? 0;

  const promoters = npsData?.records.filter(r => r.category === 'promoter').length ?? 0;
  const passives = npsData?.records.filter(r => r.category === 'passive').length ?? 0;
  const detractors = npsData?.records.filter(r => r.category === 'detractor').length ?? 0;
  const total = npsData?.records.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Top row — NPS + Engagement Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NPS Score card */}
        <div className="bg-white border border-bg-tertiary p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Net Promoter Score</h3>
            <BarChart3 className="w-4 h-4 text-text-muted" />
          </div>

          <div className="flex items-center gap-4">
            <div
              className="text-4xl font-bold"
              style={{ color: currentNPS >= 0 ? '#C108AB' : '#EF4444' }}
            >
              {currentNPS > 0 ? `+${currentNPS}` : currentNPS}
            </div>
            <div className="text-xs text-text-muted">
              <div>{total} response{total !== 1 ? 's' : ''}</div>
              <div>
                <span style={{ color: '#10B981' }}>{promoters}P</span> ·{' '}
                <span className="text-amber-600">{passives}N</span> ·{' '}
                <span className="text-red-500">{detractors}D</span>
              </div>
            </div>
          </div>

          {/* NPS Formula bar */}
          <div className="mt-4 h-3 flex">
            <div
              className="h-full bg-red-400"
              style={{ width: total ? `${(detractors / total) * 100}%` : '0%' }}
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: total ? `${(passives / total) * 100}%` : '0%' }}
            />
            <div
              className="h-full"
              style={{
                width: total ? `${(promoters / total) * 100}%` : '0%',
                background: '#C108AB',
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted mt-1">
            <span>Detractors</span>
            <span>Passives</span>
            <span>Promoters</span>
          </div>
        </div>

        {/* Engagement Level card */}
        <div className="bg-white border border-bg-tertiary p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Engagement Level</h3>
            <TrendingUp className="w-4 h-4" style={{ color: '#C108AB' }} />
          </div>

          {metrics ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: '#C108AB' }}
                >
                  {metrics.engagement_level.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-semibold text-text-primary capitalize">
                    {metrics.engagement_level}
                  </div>
                  <div className="text-xs text-text-muted">Based on your activity</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  <div>
                    <div className="font-medium text-text-primary">{metrics.total_logins}</div>
                    <div className="text-xs text-text-muted">Total logins</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" />
                  <div>
                    <div className="font-medium text-text-primary">{metrics.login_streak_days}d</div>
                    <div className="text-xs text-text-muted">Login streak</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium text-text-primary">{metrics.documents_viewed}</div>
                    <div className="text-xs text-text-muted">Docs viewed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  <div>
                    <div className="font-medium text-text-primary">{metrics.feedback_submitted}</div>
                    <div className="text-xs text-text-muted">Feedback submitted</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-muted">No engagement data yet.</div>
          )}
        </div>
      </div>

      {/* Submit NPS */}
      <div className="bg-white border border-bg-tertiary">
        <div className="px-4 py-3 border-b border-bg-tertiary">
          <h3 className="text-sm font-semibold text-text-primary">How likely are you to recommend us?</h3>
          <p className="text-xs text-text-muted mt-0.5">Your feedback helps us improve our service</p>
        </div>
        <div className="p-4">
          {submitted ? (
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5 text-teal-500" />
              <span className="text-text-primary">Thank you for your feedback!</span>
              <button
                onClick={() => { setSubmitted(false); setNps(null); }}
                className="ml-auto text-xs font-medium underline text-text-muted hover:text-text-primary"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-1">
                {Array.from({ length: 11 }, (_, i) => i).map(score => {
                  const isSelected = nps === score;
                  const category = getNPSCategory(score);
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNps(score as NPSScore)}
                      className={`w-8 h-10 flex items-center justify-center text-sm font-medium border transition-all ${
                        isSelected
                          ? 'text-white scale-110'
                          : 'text-text-secondary border-bg-tertiary hover:border-text-muted'
                      }`}
                      style={isSelected ? { background: '#C108AB', borderColor: '#C108AB' } : undefined}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>

              {nps != null && (
                <div className="mt-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-2 border ${getNPSCategory(nps).className}`}>
                    <getNPSCategory(nps).icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{getNPSCategory(nps).label}</span>
                    <span className="text-xs opacity-75">· {nps}/10</span>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>Optional comment</span>
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-bg-secondary border border-bg-tertiary focus:border-[#C108AB] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end mt-3">
                <button
                  onClick={handleSubmitNPS}
                  disabled={nps == null || submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: '#C108AB' }}
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent NPS records */}
      {npsData && npsData.records.length > 0 && (
        <div className="bg-white border border-bg-tertiary">
          <div className="px-4 py-3 border-b border-bg-tertiary">
            <h3 className="text-sm font-semibold text-text-primary">Your Recent Responses</h3>
          </div>
          <div className="divide-y divide-bg-tertiary max-h-48 overflow-auto">
            {npsData.records.slice(0, 5).map(r => (
              <div key={r.id} className="px-4 py-2 flex items-center gap-3">
                <div
                  className={`w-8 h-8 flex items-center justify-center text-xs font-bold ${
                    r.category === 'promoter' ? 'bg-teal-100 text-teal-700' :
                    r.category === 'passive' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {r.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-text-primary capitalize">{r.category}</div>
                  {r.comment && (
                    <div className="text-xs text-text-muted truncate">{r.comment}</div>
                  )}
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EngagementTracker;