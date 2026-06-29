// MotivationScreeningPanel.tsx — DEX Candidate Tracking (Technical Blueprint 01)
// 5-factor motivation screening form for GRID v2.0 S2→S3 gate

'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Circle,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface MotivationScreeningPanelProps {
  contactId: string;
  currentMotivation?: {
    overall: string;
    assessment: Record<string, any>;
  };
  onSubmit?: (result: { overall: string; assessment: Record<string, any> }) => void;
}

const MOTIVATION_FACTORS = [
  { key: 'career_trajectory', label: 'Career Trajectory', description: 'Alignment of career direction with role opportunity' },
  { key: 'comp_realism', label: 'Compensation Realism', description: 'Expectations match our budget range' },
  { key: 'geographic_flexibility', label: 'Geographic Flexibility', description: 'Willingness to relocate or work remotely' },
  { key: 'mobility_signals', label: 'Mobility Signals', description: 'Active job search, recent interviews, expressed openness' },
  { key: 'timing_signals', label: 'Timing Signals', description: 'Ready to move now, no competing offers, no blocking constraints' },
];

const FACTOR_COLORS = {
  GREEN: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', icon: <CheckCircle2 className="w-5 h-5" /> },
  YELLOW: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', icon: <AlertTriangle className="w-5 h-5" /> },
  RED: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', icon: <XCircle className="w-5 h-5" /> },
  UNKNOWN: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', icon: <Circle className="w-5 h-5" /> },
};

export function MotivationScreeningPanel({ contactId, currentMotivation, onSubmit }: MotivationScreeningPanelProps) {
  const [assessments, setAssessments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const factor of MOTIVATION_FACTORS) {
      initial[factor.key] = currentMotivation?.assessment?.[factor.key] || 'UNKNOWN';
    }
    return initial;
  });
  const [notes, setNotes] = useState(currentMotivation?.assessment?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate overall
  function calculateOverall(): string {
    const values = Object.values(assessments);
    if (values.some(v => v === 'RED')) return 'RED';
    if (values.some(v => v === 'YELLOW')) return 'YELLOW';
    if (values.every(v => v === 'GREEN')) return 'GREEN';
    return 'UNKNOWN';
  }

  const overall = calculateOverall();

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/candidates/${contactId}/motivation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment: {
            ...assessments,
            notes,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSubmit?.(data.data);
      } else {
        setError(data.error || 'Failed to submit assessment');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Motivation Screening</span>
          <Badge
            variant={overall === 'GREEN' ? 'success' : overall === 'RED' ? 'danger' : overall === 'YELLOW' ? 'warning' : 'default'}
            className="px-3 py-1"
          >
            Overall: {overall}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Factor Assessment Grid */}
          {MOTIVATION_FACTORS.map((factor) => (
            <div key={factor.key} className="border rounded-lg p-3">
              {/* Factor Label */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-text-primary">{factor.label}</div>
                  <div className="text-xs text-text-secondary">{factor.description}</div>
                </div>
                {/* Current Value Badge */}
                <Badge
                  variant={assessments[factor.key] === 'GREEN' ? 'success' : assessments[factor.key] === 'RED' ? 'danger' : 'warning'}
                >
                  {assessments[factor.key]}
                </Badge>
              </div>

              {/* Value Selection */}
              <div className="flex gap-2 mt-2">
                {(['GREEN', 'YELLOW', 'RED', 'UNKNOWN'] as const).map((value) => {
                  const colors = FACTOR_COLORS[value];
                  const isSelected = assessments[factor.key] === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setAssessments({ ...assessments, [factor.key]: value })}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                        isSelected ? `${colors.bg} ${colors.border} ${colors.text}` : 'bg-bg-tertiary border-bg-tertiary text-text-secondary hover:bg-gray-50'
                      }`}
                    >
                      {colors.icon}
                      <span className="text-sm font-medium">{value}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-text-primary">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Assessment rationale..."
              rows={3}
              className="w-full px-3 py-2 mt-1 text-sm rounded-lg border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Overall Result */}
          <div className={`p-4 rounded-lg ${
            overall === 'GREEN' ? 'bg-green-50 border border-green-200' :
            overall === 'RED' ? 'bg-red-50 border border-red-200' :
            overall === 'YELLOW' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {FACTOR_COLORS[overall].icon}
              <span className={`font-medium ${FACTOR_COLORS[overall].text}`}>
                Overall Motivation: {overall}
              </span>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {overall === 'GREEN' && 'All factors are positive. Candidate is ready for contact.'}
              {overall === 'YELLOW' && 'Some concerns. Proceed with caution, verify concerns before contact.'}
              {overall === 'RED' && 'DO NOT CONTACT. Significant blockers identified. Reassess or archive.'}
              {overall === 'UNKNOWN' && 'Complete all factor assessments to unlock gate.'}
            </div>
          </div>

          {/* S2→S3 Gate Status */}
          {overall === 'RED' && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              <strong>Gate Blocked:</strong> Motivation is RED — candidate cannot advance to S3_Contacted.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.values(assessments).every(v => v === 'UNKNOWN')}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}