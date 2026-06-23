// Phase 7.1: Reference Invite Form Component
// Referee System - Send invitation to referee

'use client';

import React, { useState } from 'react';
import {
  Mail,
  User,
  Building,
  Briefcase,
  Loader2,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';

interface ReferenceInviteFormProps {
  candidateId: string;
  candidateName: string;
  mandateId?: string;
  mandateTitle?: string;
  organizationId: string;
  /**
   * Callback when invitation is sent
   */
  onInviteSent?: (requestId: string, refereeEmail: string) => void;
  /**
   * Callback to cancel
   */
  onCancel?: () => void;
}

interface InviteData {
  refereeName: string;
  refereeEmail: string;
  refereeTitle: string;
  refereeCompany: string;
  relationship: string;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'former_manager', label: 'Former Manager' },
  { value: 'current_manager', label: 'Current Manager' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'direct_report', label: 'Direct Report' },
  { value: 'client', label: 'Client' },
  { value: 'vendor', label: 'Vendor/Partner' },
  { value: 'other', label: 'Other' },
];

export function ReferenceInviteForm({
  candidateId,
  candidateName,
  mandateId,
  mandateTitle,
  organizationId,
  onInviteSent,
  onCancel,
}: ReferenceInviteFormProps) {
  const [formData, setFormData] = useState<InviteData>({
    refereeName: '',
    refereeEmail: '',
    refereeTitle: '',
    refereeCompany: '',
    relationship: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InviteData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InviteData, string>> = {};

    if (!formData.refereeName.trim()) {
      newErrors.refereeName = 'Referee name is required';
    }

    if (!formData.refereeEmail.trim()) {
      newErrors.refereeEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.refereeEmail)) {
      newErrors.refereeEmail = 'Invalid email format';
    }

    if (!formData.relationship) {
      newErrors.relationship = 'Please select a relationship';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof InviteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/data/reference-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          mandate_id: mandateId,
          referee_name: formData.refereeName,
          referee_email: formData.refereeEmail,
          referee_title: formData.refereeTitle || null,
          referee_company: formData.refereeCompany || null,
          referee_relationship: formData.relationship,
          organization_id: organizationId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      setIsSuccess(true);
      onInviteSent?.(result.data.request_id, formData.refereeEmail);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Invitation Sent
            </h3>
            <p className="text-text-muted mt-1">
              Reference request has been sent to {formData.refereeEmail}
            </p>
          </div>
          <div className="bg-bg-alt rounded-lg p-4 w-full text-left">
            <p className="text-sm text-text-secondary">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-text-muted mt-2 space-y-1">
              <li>• The referee will receive an email with a secure link</li>
              <li>• The link expires in 14 days</li>
              <li>• You'll receive a notification when the reference is submitted</li>
            </ul>
          </div>
          <Button onClick={onCancel} className="w-full">
            Done
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Request Reference
          </h3>
          <p className="text-sm text-text-muted">
            for {candidateName}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-bg-alt rounded transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Referee Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Referee Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={formData.refereeName}
              onChange={(e) => handleChange('refereeName', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-bg-base text-text-primary ${
                errors.refereeName ? 'border-red-500' : 'border-border'
              }`}
              placeholder="John Smith"
            />
          </div>
          {errors.refereeName && (
            <p className="text-sm text-red-500 mt-1">{errors.refereeName}</p>
          )}
        </div>

        {/* Referee Email */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="email"
              value={formData.refereeEmail}
              onChange={(e) => handleChange('refereeEmail', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-bg-base text-text-primary ${
                errors.refereeEmail ? 'border-red-500' : 'border-border'
              }`}
              placeholder="referee@company.com"
            />
          </div>
          {errors.refereeEmail && (
            <p className="text-sm text-red-500 mt-1">{errors.refereeEmail}</p>
          )}
        </div>

        {/* Referee Title */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Title / Position
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={formData.refereeTitle}
              onChange={(e) => handleChange('refereeTitle', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
              placeholder="VP of Engineering"
            />
          </div>
        </div>

        {/* Referee Company */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Company
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={formData.refereeCompany}
              onChange={(e) => handleChange('refereeCompany', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
              placeholder="Acme Corp"
            />
          </div>
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Relationship to Candidate <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.relationship}
            onChange={(e) => handleChange('relationship', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg bg-bg-base text-text-primary ${
              errors.relationship ? 'border-red-500' : 'border-border'
            }`}
          >
            <option value="">Select relationship...</option>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.relationship && (
            <p className="text-sm text-red-500 mt-1">{errors.relationship}</p>
          )}
        </div>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Compact version for inline use
export function ReferenceInviteButton({
  candidateId,
  candidateName,
  mandateId,
  mandateTitle,
  organizationId,
  onInviteSent,
}: {
  candidateId: string;
  candidateName: string;
  mandateId?: string;
  mandateTitle?: string;
  organizationId: string;
  onInviteSent?: (requestId: string, refereeEmail: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-2">
        <Mail className="w-4 h-4" />
        Request Reference
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <ReferenceInviteForm
              candidateId={candidateId}
              candidateName={candidateName}
              mandateId={mandateId}
              mandateTitle={mandateTitle}
              organizationId={organizationId}
              onInviteSent={(requestId, email) => {
                onInviteSent?.(requestId, email);
                setIsOpen(false);
              }}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ReferenceInviteForm;
