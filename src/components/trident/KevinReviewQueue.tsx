import React, { useState, useEffect } from 'react';
import {
  Clock, AlertCircle, CheckCircle, X, ChevronRight, Award,
  TrendingUp, MessageSquare, FileText
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

interface KevinReviewQueueProps {
  onScorecardClick?: (scorecardId: string) => void;
}

interface PendingReview {
  scorecard_id: string;
  contact_id: string;
  full_name: string;
  mandate_id: string;
  mandate_title: string;
  composite_score: number;
  verdict: string;
  segment: string;
  scored_by_name: string;
  scored_at: string;
  preflight_flags: string[];
}

export function KevinReviewQueue({ onScorecardClick }: KevinReviewQueueProps) {
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trident/review-queue');
      const data = await response.json();
      if (data.success) {
        setPending(data.pending);
        setTotalPending(data.total_pending);
      } else if (response.status === 403) {
        alert('Admin access required');
      }
    } catch (err) {
      console.error('Load review queue error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Exceptional Primary': return 'bg-purple-500';
      case 'Strong': return 'bg-green-500';
      case 'Solid': return 'bg-blue-500';
      case 'Conditional': return 'bg-yellow-500';
      case 'Not Recommended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSegmentColor = (seg: string) => {
    switch (seg) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-yellow-600';
      case 'C': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHoursAgo = (isoString: string) => {
    const hours = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getSLAColor = (isoString: string) => {
    const hours = (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60);
    if (hours > 24) return 'error';
    if (hours > 12) return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Clock className="w-8 h-8 mx-auto mb-3 text-accent animate-pulse" />
        <p className="text-text-muted">Loading review queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            Kevin's Review Queue
          </h2>
          <p className="text-sm text-text-muted">
            {totalPending} pending review{totalPending !== 1 ? 's' : ''} • SLA: 24 hours
          </p>
        </div>
        <Button variant="outline" onClick={loadQueue}>
          <Clock className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {pending.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold text-text-primary">All caught up!</h3>
          <p className="text-text-muted mt-1">No pending scorecards to review</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {pending.map(item => (
            <Card
              key={item.scorecard_id}
              className="p-4 hover:bg-bg-alt cursor-pointer transition-colors"
              onClick={() => onScorecardClick?.(item.scorecard_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-3 h-12 rounded-full ${
                    item.segment === 'A' ? 'bg-green-500' :
                    item.segment === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{item.full_name}</h3>
                      {item.preflight_flags.length > 0 && (
                        <Badge variant="warning" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {item.preflight_flags.length} flag{item.preflight_flags.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">{item.mandate_title || 'No mandate'}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span>By {item.scored_by_name}</span>
                      <span>•</span>
                      <span>{getHoursAgo(item.scored_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-text-muted">Composite</div>
                    <div className="text-2xl font-bold text-text-primary">
                      {item.composite_score.toFixed(1)}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-text-muted">Verdict</div>
                    <Badge className={`text-white ${getVerdictColor(item.verdict)}`}>
                      {item.verdict}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-text-muted">Segment</div>
                    <div className={`text-3xl font-bold ${getSegmentColor(item.segment)}`}>
                      {item.segment}
                    </div>
                  </div>

                  <Badge variant={getSLAColor(item.scored_at) as any}>
                    {getHoursAgo(item.scored_at)}
                  </Badge>

                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>

              {item.preflight_flags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-text-muted mb-1">Pre-flight flags:</div>
                  <ul className="text-xs text-yellow-600 space-y-0.5">
                    {item.preflight_flags.slice(0, 2).map((flag, i) => (
                      <li key={i}>• {flag}</li>
                    ))}
                    {item.preflight_flags.length > 2 && (
                      <li>... and {item.preflight_flags.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {totalPending > 0 && (
        <Card className="p-3 bg-bg-alt text-center text-sm text-text-muted">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Top of queue first — review highest composite scores to surface best candidates quickly
        </Card>
      )}
    </div>
  );
}