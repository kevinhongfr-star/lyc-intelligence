import React, { useState, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, X, Edit, Download, Send, History,
  Target, TrendingUp, Award, Clock, FileText, ChevronRight
} from 'lucide-react';
import { Badge, Button, Card, Progress, Textarea } from '@/components/ui';

interface ScorecardViewProps {
  scorecardId: string;
  onEdit?: () => void;
  onSendForReview?: () => void;
}

interface Scorecard {
  id: string;
  contact_id: string;
  mandate_id: string;
  scored_by: string;
  d1_score: number;
  d2_score: number;
  d3_score: number;
  d1_sub: any;
  d2_sub: any;
  d3_sub: any;
  d1_evidence: string;
  d2_evidence: string;
  d3_evidence: string;
  d1_confidence: string;
  d2_confidence: string;
  d3_confidence: string;
  composite_score: number;
  verdict: string;
  segment: string;
  recommendation: string | null;
  preflight: any;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  original_d1: number | null;
  original_d2: number | null;
  original_d3: number | null;
  original_composite: number | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  scored_at: string;
  stale_flag: boolean;
  credits_consumed: number;
}

interface Contact {
  id: string;
  full_name: string;
  company_name: string;
  title: string;
  current_title: string;
  pipeline_stage: string;
  linkedin_url: string;
}

export function ScorecardView({ scorecardId, onEdit, onSendForReview }: ScorecardViewProps) {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreHistory, setScoreHistory] = useState<Scorecard[]>([]);

  useEffect(() => {
    loadScorecard();
  }, [scorecardId]);

  const loadScorecard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trident/scorecard/${scorecardId}`);
      const data = await response.json();
      if (data.success) {
        setScorecard(data.scorecard);
        setContact(data.contact);
        // Load score history for this contact
        if (data.contact) {
          const historyRes = await fetch(`/api/trident/scorecards?contact_id=${data.contact.id}`);
          const historyData = await historyRes.json();
          if (historyData.success) {
            setScoreHistory(historyData.data || []);
          }
        }
      }
    } catch (err) {
      console.error('Load scorecard error:', err);
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

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'adjusted': return 'warning';
      case 'info_requested': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const DimensionCard = ({
    title,
    score,
    evidence,
    confidence,
    subDimensions,
    icon,
    weight,
  }: {
    title: string;
    score: number;
    evidence: string;
    confidence: string;
    subDimensions: Record<string, number>;
    icon: React.ReactNode;
    weight: string;
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-text-primary">{title}</h4>
          <Badge variant="secondary">{weight}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${getConfidenceColor(confidence)}`}>
            {confidence} Confidence
          </span>
          <span className="text-2xl font-bold text-text-primary">{score.toFixed(1)}</span>
        </div>
      </div>
      <Progress value={score * 10} className="h-2 mb-3" />

      {evidence && (
        <div className="mb-3">
          <div className="text-xs text-text-muted mb-1">Evidence</div>
          <p className="text-sm text-text-primary">{evidence}</p>
        </div>
      )}

      {subDimensions && Object.keys(subDimensions).length > 0 && (
        <div>
          <div className="text-xs text-text-muted mb-2">Sub-dimensions</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(subDimensions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-text-primary">{value?.toFixed(1) || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Target className="w-8 h-8 mx-auto mb-3 text-accent animate-pulse" />
        <p className="text-text-muted">Loading scorecard...</p>
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div className="p-8 text-center text-text-muted">
        <AlertCircle className="w-12 h-12 mx-auto mb-3" />
        <p>Scorecard not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              SCORECARD: {contact?.full_name}
            </h2>
            <p className="text-sm text-text-muted">
              {contact?.current_title} at {contact?.company_name}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Scored: {new Date(scorecard.scored_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            {onSendForReview && scorecard.review_status === 'pending' && (
              <Button onClick={onSendForReview}>
                <Send className="w-4 h-4 mr-1" /> Send for Review
              </Button>
            )}
          </div>
        </div>

        {scorecard.stale_flag && (
          <Badge variant="warning" className="mb-3">
            <Clock className="w-3 h-3 mr-1" /> Stale (scored &gt;6 months ago)
          </Badge>
        )}

        {scorecard.original_composite && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-none p-3 mb-3">
            <div className="text-sm text-yellow-800">
              <strong>Adjusted by Kevin</strong> — Original: D1={scorecard.original_d1}, D2={scorecard.original_d2}, D3={scorecard.original_d3}, Composite={scorecard.original_composite?.toFixed(1)}
            </div>
          </div>
        )}
      </Card>

      {/* Pre-flight */}
      {scorecard.preflight && (
        <Card className="p-4">
          <h3 className="font-medium text-text-primary mb-3">Pre-flight Check</h3>
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(scorecard.preflight).filter(([k]) => k.endsWith('_verification') || k === 'jd_alignment' || k === 'signal_integrity' || k === 'trident_readiness' || k === 'compliance_conflict').map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value === 'PASS' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {value === 'WARN' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                {value === 'HALT' && <X className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-text-muted capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
          {scorecard.preflight.flags && scorecard.preflight.flags.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-text-muted mb-1">Flags</div>
              <ul className="space-y-1">
                {scorecard.preflight.flags.map((flag: string, i: number) => (
                  <li key={i} className="text-sm text-yellow-600">• {flag}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* 3 Dimensions */}
      <div className="space-y-3">
        <DimensionCard
          title="D1: Domain & Intelligence"
          score={scorecard.d1_score}
          evidence={scorecard.d1_evidence}
          confidence={scorecard.d1_confidence}
          subDimensions={scorecard.d1_sub || {}}
          icon={<Target className="w-5 h-5 text-accent" />}
          weight="30%"
        />
        <DimensionCard
          title="D2: Delivery & Influence"
          score={scorecard.d2_score}
          evidence={scorecard.d2_evidence}
          confidence={scorecard.d2_confidence}
          subDimensions={scorecard.d2_sub || {}}
          icon={<TrendingUp className="w-5 h-5 text-accent" />}
          weight="40%"
        />
        <DimensionCard
          title="D3: Drive & Dynamics"
          score={scorecard.d3_score}
          evidence={scorecard.d3_evidence}
          confidence={scorecard.d3_confidence}
          subDimensions={scorecard.d3_sub || {}}
          icon={<Award className="w-5 h-5 text-accent" />}
          weight="30%"
        />
      </div>

      {/* Composite & Verdict */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-text-muted">COMPOSITE</div>
            <div className="text-4xl font-bold text-text-primary">{scorecard.composite_score.toFixed(1)}</div>
            <div className="text-xs text-text-muted">/ 10.0</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted">VERDICT</div>
            <Badge className={`text-lg px-3 py-1 text-white ${getVerdictColor(scorecard.verdict)}`}>
              {scorecard.verdict}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted">SEGMENT</div>
            <div className={`text-5xl font-bold ${getSegmentColor(scorecard.segment)}`}>
              {scorecard.segment}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-muted">REVIEW</div>
            <Badge variant={getReviewStatusColor(scorecard.review_status) as any}>
              {scorecard.review_status}
            </Badge>
          </div>
        </div>

        {scorecard.review_notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm text-text-muted mb-1">Review Notes</div>
            <p className="text-sm text-text-primary">{scorecard.review_notes}</p>
          </div>
        )}
      </Card>

      {/* Recommendation */}
      {scorecard.recommendation && (
        <Card className="p-4">
          <h3 className="font-medium text-text-primary mb-2">Recommendation</h3>
          <p className="text-text-primary">{scorecard.recommendation}</p>
        </Card>
      )}

      {/* Score History */}
      {scoreHistory.length > 1 && (
        <Card className="p-4">
          <h3 className="font-medium text-text-primary mb-3 flex items-center gap-2">
            <History className="w-4 h-4" /> Score History
          </h3>
          <div className="space-y-2">
            {scoreHistory.map(hist => (
              <div key={hist.id} className="flex items-center justify-between p-2 bg-bg-alt rounded">
                <div>
                  <div className="text-sm text-text-primary">
                    Composite: {hist.composite_score.toFixed(1)} — {hist.verdict} (Seg {hist.segment})
                  </div>
                  <div className="text-xs text-text-muted">
                    {new Date(hist.scored_at).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}