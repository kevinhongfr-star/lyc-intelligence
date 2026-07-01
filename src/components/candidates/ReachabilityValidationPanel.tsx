// ReachabilityValidationPanel.tsx — DEX Candidate Tracking (Technical Blueprint 01)
// Reachability validation form for GRID v2.0 S2→S3 gate

'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  MessageSquare,
  Linkedin,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface ReachabilityValidationPanelProps {
  contactId: string;
  currentReachability?: {
    verified: boolean;
    unknowns: number;
    channel: string | null;
    details: Record<string, any>;
  };
  onSubmit?: (result: { verified: boolean; unknowns: number; channel: string }) => void;
}

const REACHABILITY_CHECKS = [
  { key: 'employment_verified', label: 'Employment Verified', description: 'Current employer confirmed' },
  { key: 'location_confirmed', label: 'Location Confirmed', description: 'City/country verified' },
  { key: 'language_confirmed', label: 'Language Confirmed', description: 'Communication language verified' },
  { key: 'openness_signals', label: 'Openness Signals', description: 'Candidate has shown openness to contact' },
  { key: 'contact_channel_available', label: 'Contact Channel Available', description: 'Valid email/LinkedIn/WeChat exists' },
];

const CHANNEL_OPTIONS = [
  { value: 'LINKEDIN', label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" /> },
  { value: 'EMAIL', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { value: 'WECHAT', label: 'WeChat', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'NONE', label: 'None Available', icon: <XCircle className="w-4 h-4" /> },
];

export function ReachabilityValidationPanel({ contactId, currentReachability, onSubmit }: ReachabilityValidationPanelProps) {
  const [checks, setChecks] = useState<Record<string, boolean | 'unknown'>>(() => {
    const initial: Record<string, boolean | 'unknown'> = {};
    for (const check of REACHABILITY_CHECKS) {
      const existing = currentReachability?.details?.[check.key];
      initial[check.key] = existing === true ? true : existing === false ? false : 'unknown';
    }
    return initial;
  });
  const [contactChannel, setContactChannel] = useState<string>(
    currentReachability?.channel || 'NONE'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Count unknowns
  function countUnknowns(): number {
    return Object.values(checks).filter(v => v === 'unknown').length;
  }

  const unknowns = countUnknowns();
  const verified = unknowns <= 1;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/candidates/${contactId}/reachability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          details: checks,
          contact_channel: contactChannel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSubmit?.(data.data);
      } else {
        setError(data.error || 'Failed to submit validation');
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
          <span>Reachability Validation</span>
          <Badge
            variant={verified ? 'success' : 'danger'}
            className="px-3 py-1"
          >
            {verified ? 'PASS' : 'FAIL'} ({unknowns} unknowns)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Reachability Checks */}
          {REACHABILITY_CHECKS.map((check) => (
            <div key={check.key} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-text-primary">{check.label}</div>
                  <div className="text-xs text-text-secondary">{check.description}</div>
                </div>
              </div>

              {/* Value Selection */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setChecks({ ...checks, [check.key]: true })}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                    checks[check.key] === true
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'bg-bg-tertiary border-bg-tertiary text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Yes</span>
                </button>
                <button
                  onClick={() => setChecks({ ...checks, [check.key]: false })}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                    checks[check.key] === false
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-bg-tertiary border-bg-tertiary text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">No</span>
                </button>
                <button
                  onClick={() => setChecks({ ...checks, [check.key]: 'unknown' })}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                    checks[check.key] === 'unknown'
                      ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                      : 'bg-bg-tertiary border-bg-tertiary text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unknown</span>
                </button>
              </div>
            </div>
          ))}

          {/* Contact Channel Selection */}
          <div className="border rounded-lg p-3">
            <div className="font-medium text-text-primary mb-2">Primary Contact Channel</div>
            <div className="grid grid-cols-2 gap-2">
              {CHANNEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setContactChannel(option.value)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    contactChannel === option.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-bg-tertiary border-bg-tertiary text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {option.icon}
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Validation Result */}
          <div className={`p-4 rounded-lg ${
            verified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {verified ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${verified ? 'text-green-700' : 'text-red-700'}`}>
                Validation: {verified ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {verified
                ? `${unknowns} unknowns (≤1 allowed). Ready for S3_Contacted transition.`
                : `${unknowns} unknowns (max 1 allowed). Resolve unknowns before contact.`
            }
            </div>
          </div>

          {/* S2→S3 Gate Status */}
          {!verified && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              <strong>Gate Blocked:</strong> Too many unknowns — candidate cannot advance to S3_Contacted.
            </div>
          )}
          {contactChannel === 'NONE' && (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-700">
              <strong>Warning:</strong> No contact channel selected — S2→S3 gate will be blocked.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              'Submit Validation'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}