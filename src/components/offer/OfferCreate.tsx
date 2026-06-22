import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Save,
  Loader2,
  ChevronRight,
  Eye,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export type OfferStatus = 'draft' | 'pending_partner_approval' | 'pending_client_approval' | 'sent' | 'accepted' | 'rejected' | 'withdrawn';

export interface Compensation {
  base_salary: number;
  bonus?: number;
  bonus_percentage?: number;
  equity?: string;
  benefits?: string;
  total_compensation?: number;
}

export interface OfferFormData {
  position_title: string;
  start_date: string;
  compensation: Compensation;
  conditions: string;
  expiration_date: string;
  cover_letter: string;
  additional_notes: string;
}

export interface OfferCreateProps {
  candidateId: string;
  mandateId?: string;
  candidateName: string;
  clientName: string;
  onSave: (offer: OfferFormData, submitForApproval?: boolean) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<OfferFormData>;
  mode?: 'create' | 'edit';
}

const INITIAL_FORM_DATA: OfferFormData = {
  position_title: '',
  start_date: '',
  compensation: {
    base_salary: 0,
    bonus: 0,
    equity: '',
    benefits: '',
  },
  conditions: 'This offer is contingent upon:\n- Successful completion of background check\n- Verification of references\n- Signing of employment agreement\n- Any other conditions as agreed',
  expiration_date: '',
  cover_letter: '',
  additional_notes: '',
};

export function OfferCreate({
  candidateId,
  mandateId,
  candidateName,
  clientName,
  onSave,
  onCancel,
  initialData,
  mode = 'create',
}: OfferCreateProps) {
  const [formData, setFormData] = useState<OfferFormData>(initialData || INITIAL_FORM_DATA);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Set default expiration date (7 days from now)
  useEffect(() => {
    if (!formData.expiration_date && mode === 'create') {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        expiration_date: expirationDate.toISOString().split('T')[0],
      }));
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.position_title.trim()) {
      newErrors.position_title = 'Position title is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.compensation.base_salary || formData.compensation.base_salary <= 0) {
      newErrors.base_salary = 'Base salary is required';
    }
    if (!formData.expiration_date) {
      newErrors.expiration_date = 'Expiration date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (submitForApproval = false) => {
    if (!validate()) return;

    setSaving(true);
    try {
      // Calculate total compensation
      const totalComp = formData.compensation.base_salary + (formData.compensation.bonus || 0);
      const offerData = {
        ...formData,
        compensation: {
          ...formData.compensation,
          total_compensation: totalComp,
        },
      };

      await onSave(offerData, submitForApproval);
    } catch (err) {
      console.error('[OfferCreate] save error:', err);
      setErrors({ submit: 'Failed to save offer. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCompensationChange = (field: keyof Compensation, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        [field]: value,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {mode === 'create' ? 'Create Offer' : 'Edit Offer'}
            </h1>
            <p className="text-text-muted">
              Creating offer for {candidateName} at {clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {showPreview ? (
        /* Offer Preview */
        <OfferPreview
          formData={formData}
          candidateName={candidateName}
          clientName={clientName}
          onClose={() => setShowPreview(false)}
          onSave={() => handleSave(false)}
          saving={saving}
        />
      ) : (
        /* Offer Form */
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent" />
              Position Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Position Title *
                </label>
                <input
                  type="text"
                  value={formData.position_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, position_title: e.target.value }))}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                {errors.position_title && (
                  <p className="text-red-500 text-sm mt-1">{errors.position_title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                {errors.start_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Compensation Package
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Base Salary (Annual) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    value={formData.compensation.base_salary || ''}
                    onChange={(e) => handleCompensationChange('base_salary', parseInt(e.target.value) || 0)}
                    placeholder="150,000"
                    className="w-full pl-8 pr-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                {errors.base_salary && (
                  <p className="text-red-500 text-sm mt-1">{errors.base_salary}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Signing Bonus
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    value={formData.compensation.bonus || ''}
                    onChange={(e) => handleCompensationChange('bonus', parseInt(e.target.value) || 0)}
                    placeholder="25,000"
                    className="w-full pl-8 pr-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Equity / Stock Options
                </label>
                <input
                  type="text"
                  value={formData.compensation.equity || ''}
                  onChange={(e) => handleCompensationChange('equity', e.target.value)}
                  placeholder="e.g., 10,000 RSUs over 4 years"
                  className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Benefits
                </label>
                <input
                  type="text"
                  value={formData.compensation.benefits || ''}
                  onChange={(e) => handleCompensationChange('benefits', e.target.value)}
                  placeholder="e.g., Health, 401k, PTO"
                  className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            {/* Total Compensation Summary */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-800">Estimated Total First Year Compensation</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    (formData.compensation.base_salary || 0) + (formData.compensation.bonus || 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Offer Conditions
            </h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Conditions (one per line)
              </label>
              <textarea
                value={formData.conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, conditions: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
              <p className="text-xs text-text-muted mt-1">
                These conditions will appear in the offer letter (background check, references, etc.)
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Offer Timeline
            </h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Offer Expiration Date *
              </label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              {errors.expiration_date && (
                <p className="text-red-500 text-sm mt-1">{errors.expiration_date}</p>
              )}
              <p className="text-xs text-text-muted mt-1">
                The candidate must respond before this date
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Additional Notes
            </h2>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Cover Letter / Additional Notes
              </label>
              <textarea
                value={formData.cover_letter}
                onChange={(e) => setFormData(prev => ({ ...prev, cover_letter: e.target.value }))}
                placeholder="Optional cover letter or additional notes for the offer..."
                rows={4}
                className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <ChevronRight className="w-4 h-4 mr-2" />
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Offer Preview Component
interface OfferPreviewProps {
  formData: OfferFormData;
  candidateName: string;
  clientName: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}

function OfferPreview({ formData, candidateName, clientName, onClose, onSave, saving }: OfferPreviewProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Preview Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Offer Letter Preview</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Edit
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {saving ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </div>
      </div>

      {/* Letter Content */}
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{clientName}</h1>
          <p className="text-gray-600">Offer of Employment</p>
        </div>

        <div className="space-y-6 text-gray-700">
          <p>Dear {candidateName},</p>

          <p>
            We are pleased to offer you the position of <strong>{formData.position_title}</strong> at{' '}
            <strong>{clientName}</strong>. We believe your skills and experience will be a valuable
            addition to our team.
          </p>

          <div className="border-t border-b border-gray-200 py-4 my-4">
            <h3 className="font-semibold mb-3">Compensation Package</h3>
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2">Base Salary (Annual)</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(formData.compensation.base_salary)}
                  </td>
                </tr>
                {formData.compensation.bonus ? (
                  <tr>
                    <td className="py-2">Signing Bonus</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(formData.compensation.bonus)}
                    </td>
                  </tr>
                ) : null}
                {formData.compensation.equity ? (
                  <tr>
                    <td className="py-2">Equity</td>
                    <td className="py-2 text-right font-medium">
                      {formData.compensation.equity}
                    </td>
                  </tr>
                ) : null}
                {formData.compensation.benefits ? (
                  <tr>
                    <td className="py-2">Benefits</td>
                    <td className="py-2 text-right font-medium">
                      {formData.compensation.benefits}
                    </td>
                  </tr>
                ) : null}
                <tr className="font-bold text-lg">
                  <td className="pt-4">Estimated Total Compensation</td>
                  <td className="pt-4 text-right text-green-600">
                    {formatCurrency(
                      (formData.compensation.base_salary || 0) + (formData.compensation.bonus || 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Start Date</h3>
            <p>Your anticipated start date is <strong>{formatDate(formData.start_date)}</strong>.</p>
          </div>

          {formData.conditions && (
            <div>
              <h3 className="font-semibold mb-2">Conditions</h3>
              <div className="whitespace-pre-line text-sm">
                {formData.conditions}
              </div>
            </div>
          )}

          {formData.cover_letter && (
            <div>
              <h3 className="font-semibold mb-2">Additional Notes</h3>
              <div className="whitespace-pre-line text-sm">
                {formData.cover_letter}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Please respond by:</strong> {formatDate(formData.expiration_date)}
            </p>
          </div>

          <p>
            We are excited about the possibility of you joining our team and look forward to
            your response.
          </p>

          <p>Sincerely,<br />
          <strong>The Hiring Team</strong><br />
          {clientName}
          </p>
        </div>
      </div>
    </div>
  );
}