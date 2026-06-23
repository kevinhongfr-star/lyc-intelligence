// Phase 4.6: Alumni Referral Form Component
'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Select } from '@/components/ui';

interface ReferralFormProps {
  alumniId: string;
  orgId: string;
  onSuccess?: () => void;
}

export function ReferralForm({ alumniId, orgId, onSuccess }: ReferralFormProps) {
  const [formData, setFormData] = useState({
    referred_name: '',
    referred_email: '',
    referred_phone: '',
    mandate_id: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.referred_name) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/alumni/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumni_id: alumniId,
          org_id: orgId,
          ...formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to create referral:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      referred_name: '',
      referred_email: '',
      referred_phone: '',
      mandate_id: '',
      notes: '',
    });
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="font-semibold text-text-primary mt-4">Referral Submitted!</h4>
        <p className="text-text-muted mt-2">
          Thank you for your referral. We will reach out to {formData.referred_name} shortly.
        </p>
        <Button variant="outline" onClick={handleReset} className="mt-4">
          Submit Another Referral
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Refer a Candidate</h3>
          <p className="text-sm text-text-muted">Help us find great talent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Referred Name *
          </label>
          <Input
            value={formData.referred_name}
            onChange={(e) => setFormData({ ...formData, referred_name: e.target.value })}
            placeholder="Full name of the candidate"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <Input
              type="email"
              value={formData.referred_email}
              onChange={(e) => setFormData({ ...formData, referred_email: e.target.value })}
              placeholder="candidate@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone
            </label>
            <Input
              type="tel"
              value={formData.referred_phone}
              onChange={(e) => setFormData({ ...formData, referred_phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Target Mandate (optional)
          </label>
          <Select
            value={formData.mandate_id}
            onValueChange={(value) => setFormData({ ...formData, mandate_id: value })}
            className="mt-1"
          >
            <option value="">Select a mandate</option>
            <option value="mandate-1">Executive Search - VP Engineering</option>
            <option value="mandate-2">Retained - Director of Operations</option>
            <option value="mandate-3">Contingency - Senior Product Manager</option>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes (optional)
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional information about the candidate..."
            rows={3}
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !formData.referred_name}
          className="w-full gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Referral'}
        </Button>
      </form>

      <p className="text-xs text-text-muted mt-4 text-center">
        By submitting this referral, you agree to our referral program terms.
        Referral fees apply when candidates are successfully placed.
      </p>
    </Card>
  );
}

export default ReferralForm;