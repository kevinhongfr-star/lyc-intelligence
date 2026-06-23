// Phase 7.1: Reference Detail View Component
// Referee System - Consultant view of single reference

'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  User,
  Building,
  Briefcase,
  Calendar,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui';

interface ReferenceResponse {
  questionNumber: number;
  questionText: string;
  rating: number | null;
  responseText: string;
}

interface ReferenceRequest {
  id: string;
  candidateId: string;
  candidateName: string;
  mandateTitle: string;
  refereeName: string;
  refereeEmail: string;
  refereeTitle: string;
  refereeCompany: string;
  relationship: string;
  status: 'invited' | 'reminded' | 'submitted' | 'expired' | 'declined';
  invitedAt: string;
  submittedAt: string | null;
  expiresAt: string;
}

interface ReferenceDetailProps {
  referenceRequestId: string;
  /**
   * Callback to go back
   */
  onBack?: () => void;
}

const STATUS_CONFIG = {
  invited: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  reminded: {
    label: 'Reminded',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: AlertCircle,
  },
  submitted: {
    label: 'Submitted',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expired',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
  declined: {
    label: 'Declined',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

export function ReferenceDetail({ referenceRequestId, onBack }: ReferenceDetailProps) {
  const [request, setRequest] = useState<ReferenceRequest | null>(null);
  const [responses, setResponses] = useState<ReferenceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reference detail
  useEffect(() => {
    async function fetchDetail() {
      try {
        const response = await fetch(`/api/data/reference-detail/${referenceRequestId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch reference');
        }

        setRequest(result.data.request);
        setResponses(result.data.responses || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reference');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetail();
  }, [referenceRequestId]);

  // Calculate average rating from rating questions
  const calculateAvgRating = () => {
    const ratingResponses = responses.filter(r => r.rating !== null);
    if (ratingResponses.length === 0) return null;

    const sum = ratingResponses.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / ratingResponses.length).toFixed(1);
  };

  // Get recommendation score (from yes/no/maybe question)
  const getRecommendationScore = () => {
    const recommendResponse = responses.find(r =>
      r.questionText.toLowerCase().includes('would you hire')
    );
    if (!recommendResponse?.rating) return null;

    // 5 = yes, 3 = maybe, 1 = no
    if (recommendResponse.rating >= 4) return 'positive';
    if (recommendResponse.rating >= 2) return 'neutral';
    return 'negative';
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading reference...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 className="font-medium text-text-primary mt-4">Failed to Load</h3>
          <p className="text-sm text-text-muted mt-1">{error || 'Reference not found'}</p>
          {onBack && (
            <button onClick={onBack} className="mt-4 text-primary hover:underline">
              Go Back
            </button>
          )}
        </div>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status];
  const StatusIcon = statusConfig.icon;
  const avgRating = calculateAvgRating();
  const recommendation = getRecommendationScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
          <StatusIcon className="w-4 h-4 inline mr-1" />
          {statusConfig.label}
        </span>
      </div>

      {/* Referee Info */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">{request.refereeName}</h2>
            <div className="mt-2 space-y-1">
              {request.refereeTitle && (
                <p className="text-sm text-text-secondary flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {request.refereeTitle}
                </p>
              )}
              {request.refereeCompany && (
                <p className="text-sm text-text-secondary flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {request.refereeCompany}
                </p>
              )}
              <p className="text-sm text-text-muted">
                {request.relationship.replace('_', ' ')} for {request.candidateName}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      {request.status === 'submitted' && (
        <div className="grid grid-cols-3 gap-4">
          {/* Average Rating */}
          <Card className="p-4 text-center">
            {avgRating ? (
              <>
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(parseFloat(avgRating))
                          ? 'fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-2xl font-bold text-text-primary mt-2">{avgRating}</p>
                <p className="text-xs text-text-muted">Avg Rating</p>
              </>
            ) : (
              <p className="text-text-muted">No ratings</p>
            )}
          </Card>

          {/* Recommendation */}
          <Card className="p-4 text-center">
            {recommendation && (
              <>
                <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                  recommendation === 'positive'
                    ? 'bg-green-100'
                    : recommendation === 'negative'
                    ? 'bg-red-100'
                    : 'bg-amber-100'
                }`}>
                  {recommendation === 'positive' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : recommendation === 'negative' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <p className="text-lg font-semibold text-text-primary mt-2 capitalize">
                  {recommendation}
                </p>
                <p className="text-xs text-text-muted">Recommendation</p>
              </>
            )}
          </Card>

          {/* Date */}
          <Card className="p-4 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto" />
            <p className="text-lg font-semibold text-text-primary mt-2">
              {formatDate(request.submittedAt)}
            </p>
            <p className="text-xs text-text-muted">Submitted</p>
          </Card>
        </div>
      )}

      {/* Pending state message */}
      {request.status !== 'submitted' && (
        <Card className="p-6 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-medium text-text-primary mt-4">
            {request.status === 'expired'
              ? 'Reference Request Expired'
              : request.status === 'declined'
              ? 'Reference Declined'
              : 'Awaiting Reference'}
          </h3>
          <p className="text-sm text-text-muted mt-1">
            {request.status === 'expired'
              ? 'The reference link has expired.'
              : request.status === 'declined'
              ? 'The referee declined to provide a reference.'
              : 'This reference has not been submitted yet.'}
          </p>
          <p className="text-xs text-text-muted mt-2">
            Invited on {formatDate(request.invitedAt)}
          </p>
        </Card>
      )}

      {/* Responses */}
      {request.status === 'submitted' && responses.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-text-primary">Responses</h3>
          {responses.map((response) => (
            <Card key={response.questionNumber} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="font-medium text-text-primary text-sm">
                  Q{response.questionNumber}: {response.questionText}
                </p>
                {response.rating !== null && (
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`w-4 h-4 ${
                          value <= response.rating!
                            ? 'text-amber-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {response.responseText && (
                <p className="text-text-secondary text-sm whitespace-pre-wrap">
                  {response.responseText}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Key Insights (placeholder for AI extraction) */}
      {request.status === 'submitted' && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <h4 className="font-medium text-text-primary flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Key Insights
          </h4>
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <p className="text-text-muted">Strengths:</p>
              <p className="text-text-primary">
                {responses.find(r => r.questionText.includes('greatest strengths'))?.responseText || 'N/A'}
              </p>
            </div>
            <div className="mt-2">
              <p className="text-text-muted">Areas for Improvement:</p>
              <p className="text-text-primary">
                {responses.find(r => r.questionText.includes('improve'))?.responseText || 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ReferenceDetail;
