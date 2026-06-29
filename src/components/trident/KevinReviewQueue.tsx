import React, { useState, useEffect } from 'react';
import {
  Clock, AlertCircle, CheckCircle, X, ChevronRight, Award,
  TrendingUp, MessageSquare, FileText, Sparkles
} from 'lucide-react';
import { Badge, Button, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

interface KevinReviewQueueProps {
  onScorecardClick?: (scorecardId: string) => void;
  onProfileClick?: (profileId: string) => void;
}

interface TridentPending {
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
  preflight_flags?: string[];
}

interface CanvasPending {
  profile_id: string;
  contact_id: string;
  full_name: string;
  mandate_id: string;
  mandate_title: string;
  canvas_grade: string;
  generated_by_name: string;
  generated_at: string;
}

type PendingItem = ({ type: 'trident' } & TridentPending) | ({ type: 'canvas' } & CanvasPending);

export function KevinReviewQueue({ onScorecardClick, onProfileClick }: KevinReviewQueueProps) {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [tridentCount, setTridentCount] = useState(0);
  const [canvasCount, setCanvasCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const [tridentRes, canvasRes] = await Promise.all([
        fetch('/api/trident/review-queue'),
        fetch('/api/canvas/review-queue'),
      ]);

      const tridentData = await tridentRes.json();
      const canvasData = await canvasRes.json();

      const tridentItems: PendingItem[] = tridentData.success ?
        tridentData.pending.map((item: TridentPending) => ({ ...item, type: 'trident' as const })) : [];

      const canvasItems: PendingItem[] = canvasData.success ?
        canvasData.pending.map((item: CanvasPending) => ({ ...item, type: 'canvas' as const })) : [];

      const combined = [...tridentItems, ...canvasItems].sort((a, b) => {
        const scoreA = a.type === 'trident' ? a.composite_score : (a.canvas_grade === 'A+' ? 9.5 : a.canvas_grade === 'A' ? 8.5 : a.canvas_grade === 'B' ? 7.5 : a.canvas_grade === 'C' ? 6.5 : 5);
        const scoreB = b.type === 'trident' ? b.composite_score : (b.canvas_grade === 'A+' ? 9.5 : b.canvas_grade === 'A' ? 8.5 : b.canvas_grade === 'B' ? 7.5 : b.canvas_grade === 'C' ? 6.5 : 5);
        return scoreB - scoreA;
      });

      setPending(combined);
      setTridentCount(tridentItems.length);
      setCanvasCount(canvasItems.length);
      setTotalPending(combined.length);
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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-500';
      case 'A': return 'bg-emerald-500';
      case 'B': return 'bg-amber-500';
      case 'C': return 'bg-orange-500';
      case 'F': return 'bg-red-500';
      default: return 'bg-gray-500';
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
    if (hours > 24) return 'destructive';
    if (hours > 12) return 'warning';
    return 'outline';
  };

  const filteredPending = pending.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

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
            {totalPending} pending review{totalPending !== 1 ? 's' : ''} • {tridentCount} TRIDENT + {canvasCount} CANVAS • SLA: 24 hours
          </p>
        </div>
        <Button variant="outline" onClick={loadQueue}>
          <Clock className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({totalPending})</TabsTrigger>
          <TabsTrigger value="trident">TRIDENT ({tridentCount})</TabsTrigger>
          <TabsTrigger value="canvas">CANVAS ({canvasCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderQueue('all')}
        </TabsContent>
        <TabsContent value="trident">
          {renderQueue('trident')}
        </TabsContent>
        <TabsContent value="canvas">
          {renderQueue('canvas')}
        </TabsContent>
      </Tabs>

      {totalPending > 0 && (
        <Card className="p-3 bg-bg-alt text-center text-sm text-text-muted">
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Top of queue first — review highest composite scores to surface best candidates quickly
        </Card>
      )}
    </div>
  );

  function renderQueue(filter: 'all' | 'trident' | 'canvas') {
    const items = filter === 'all' ? filteredPending : pending.filter(item => item.type === filter);

    if (items.length === 0) {
      return (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold text-text-primary">All caught up!</h3>
          <p className="text-text-muted mt-1">No pending {filter === 'all' ? '' : filter} reviews</p>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {items.map(item => (
          <Card
            key={item.type === 'trident' ? item.scorecard_id : item.profile_id}
            className="p-4 hover:bg-bg-alt cursor-pointer transition-colors"
            onClick={() => {
              if (item.type === 'trident') {
                onScorecardClick?.(item.scorecard_id);
              } else {
                onProfileClick?.(item.profile_id);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-3 h-12 rounded-full ${
                  item.type === 'trident'
                    ? item.segment === 'A' ? 'bg-green-500' : item.segment === 'B' ? 'bg-yellow-500' : 'bg-red-500'
                    : getGradeColor(item.canvas_grade).replace('bg-', 'bg-')
                }`} />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{item.full_name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {item.type === 'trident' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      {item.type === 'trident' ? 'TRIDENT' : 'CANVAS'}
                    </Badge>
                    {item.type === 'trident' && item.preflight_flags && item.preflight_flags.length > 0 && (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {item.preflight_flags.length} flag{item.preflight_flags.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-text-muted">{item.mandate_title || 'No mandate'}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span>By {item.type === 'trident' ? item.scored_by_name : item.generated_by_name}</span>
                    <span>•</span>
                    <span>{getHoursAgo(item.type === 'trident' ? item.scored_at : item.generated_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {item.type === 'trident' ? (
                  <>
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
                      <div className={`text-3xl font-bold ${
                        item.segment === 'A' ? 'text-green-600' : item.segment === 'B' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.segment}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-sm text-text-muted">CANVAS Grade</div>
                    <Badge className={`text-white text-xl px-4 py-2 ${getGradeColor(item.canvas_grade)}`}>
                      {item.canvas_grade}
                    </Badge>
                  </div>
                )}

                <Badge variant={getSLAColor(item.type === 'trident' ? item.scored_at : item.generated_at)}>
                  {getHoursAgo(item.type === 'trident' ? item.scored_at : item.generated_at)}
                </Badge>

                <ChevronRight className="w-5 h-5 text-text-muted" />
              </div>
            </div>

            {item.type === 'trident' && item.preflight_flags && item.preflight_flags.length > 0 && (
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
    );
  }
}
