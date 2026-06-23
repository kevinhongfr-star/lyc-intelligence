// Phase 7.4: Background Check Form Component
'use client';

import React, { useState } from 'react';
import { FileCheck, Calendar, User } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select } from '@/components/ui';

interface BackgroundCheckFormProps {
  candidateId: string;
  organizationId: string;
  onSubmit: (data: BackgroundCheckFormData) => void;
}

export interface BackgroundCheckFormData {
  candidate_id: string;
  mandate_id?: string;
  check_type: string;
  provider: string;
  order_date: string;
  due_date: string;
  ordered_by: string;
  organization_id: string;
}

const CHECK_TYPES = [
  { value: 'criminal', label: 'Criminal Record' },
  { value: 'employment', label: 'Employment Verification' },
  { value: 'education', label: 'Education Verification' },
  { value: 'credit', label: 'Credit Check' },
  { value: 'drug_screening', label: 'Drug Screening' },
  { value: 'comprehensive', label: 'Comprehensive' },
];

export function BackgroundCheckForm({ candidateId, organizationId, onSubmit }: BackgroundCheckFormProps) {
  const [formData, setFormData] = useState({
    candidate_id: candidateId,
    mandate_id: '',
    check_type: 'comprehensive',
    provider: '',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
    ordered_by: '',
    organization_id: organizationId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.provider || !formData.due_date || !formData.ordered_by) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        candidate_id: candidateId,
        mandate_id: '',
        check_type: 'comprehensive',
        provider: '',
        order_date: new Date().toISOString().split('T')[0],
        due_date: '',
        ordered_by: '',
        organization_id: organizationId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileCheck className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-text-primary">Order Background Check</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-muted">Check Type *</label>
          <Select
            value={formData.check_type}
            onValueChange={(value) => setFormData({ ...formData, check_type: value })}
            className="mt-1"
          >
            {CHECK_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted">Provider *</label>
          <Input
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="e.g., HireRight, Sterling"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Order Date *
            </label>
            <Input
              type="date"
              value={formData.order_date}
              onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
              min={today}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due Date *
            </label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              min={today}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <User className="w-4 h-4" />
            Ordered By *
          </label>
          <Input
            value={formData.ordered_by}
            onChange={(e) => setFormData({ ...formData, ordered_by: e.target.value })}
            placeholder="Consultant name or ID"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted">Mandate ID (optional)</label>
          <Input
            value={formData.mandate_id}
            onChange={(e) => setFormData({ ...formData, mandate_id: e.target.value })}
            placeholder="Optional mandate reference"
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !formData.provider || !formData.due_date || !formData.ordered_by}
          className="w-full"
        >
          {isSubmitting ? 'Ordering...' : 'Order Check'}
        </Button>
      </form>
    </Card>
  );
}

export default BackgroundCheckForm;