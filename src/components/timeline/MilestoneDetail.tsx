import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Circle,
  X,
  Save,
  Loader2,
  ChevronRight,
  Info
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import {
  Milestone,
  MilestoneStatus,
  calculateMilestoneStatus,
  getStatusColor,
  getStatusLabel,
  MILESTONE_LABELS,
  DEFAULT_SLA_DAYS,
} from './TimelineView';

export interface MilestoneDetailProps {
  milestoneKey: string;
  milestone: Milestone;
  mandateCreatedAt: string;
  onSave: (milestoneKey: string, milestone: Milestone) => Promise<void>;
  onClose: () => void;
}

export function MilestoneDetail({
  milestoneKey,
  milestone,
  mandateCreatedAt,
  onSave,
  onClose,
}: MilestoneDetailProps) {
  const [targetDate, setTargetDate] = useState<string>(milestone.target_date || '');
  const [actualDate, setActualDate] = useState<string>(milestone.actual_date || '');
  const [notes, setNotes] = useState<string>(milestone.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const computedStatus = calculateMilestoneStatus(
    { ...milestone, target_date: targetDate || null, actual_date: actualDate || null },
    today
  );
  const statusColors = getStatusColor(computedStatus);
  const StatusIcon = statusColors.icon;
  const label = MILESTONE_LABELS[milestoneKey] || milestoneKey;

  // Calculate default target date based on SLA
  useEffect(() => {
    if (!targetDate && mandateCreatedAt) {
      const defaultDays = DEFAULT_SLA_DAYS[milestoneKey] || 0;
      const createdDate = new Date(mandateCreatedAt);
      createdDate.setDate(createdDate.getDate() + defaultDays);
      setTargetDate(createdDate.toISOString().split('T')[0]);
    }
  }, [mandateCreatedAt, milestoneKey]);

  const handleSave = async () => {
    if (!targetDate) {
      setError('Target date is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updatedMilestone: Milestone = {
        target_date: targetDate,
        actual_date: actualDate || null,
        status: computedStatus,
        notes: notes.trim(),
      };

      await onSave(milestoneKey, updatedMilestone);
      onClose();
    } catch (err) {
      setError('Failed to save milestone');
      console.error('[MilestoneDetail] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const daysUntilDue = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const daysLate = actualDate && targetDate
    ? Math.ceil((new Date(actualDate).getTime() - new Date(targetDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-card-border bg-bg-alt flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${statusColors.bg} flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 ${statusColors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{label}</h3>
            <Badge className={`${statusColors.bg} ${statusColors.text} mt-1`}>
              {getStatusLabel(computedStatus)}
            </Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Info */}
        <div className={`p-4 rounded-xl border ${statusColors.bg} ${statusColors.border}`}>
          <div className="flex items-start gap-3">
            <Info className={`w-5 h-5 ${statusColors.text} flex-shrink-0 mt-0.5`} />
            <div>
              {computedStatus === 'completed' && (
                <p className={`text-sm ${statusColors.text}`}>
                  This milestone was completed on time. Great job!
                </p>
              )}
              {computedStatus === 'completed_late' && daysLate && (
                <p className={`text-sm ${statusColors.text}`}>
                  This milestone was completed {daysLate} day{daysLate > 1 ? 's' : ''} late.
                </p>
              )}
              {computedStatus === 'on_track' && daysUntilDue && (
                <p className={`text-sm ${statusColors.text}`}>
                  This milestone is on track. {daysUntilDue} day{daysUntilDue > 1 ? 's' : ''} until due.
                </p>
              )}
              {computedStatus === 'at_risk' && daysUntilDue && (
                <p className={`text-sm ${statusColors.text}`}>
                  This milestone is at risk. Only {daysUntilDue} day{daysUntilDue > 1 ? 's' : ''} left!
                </p>
              )}
              {computedStatus === 'overdue' && daysUntilDue && (
                <p className={`text-sm ${statusColors.text}`}>
                  This milestone is overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) > 1 ? 's' : ''}.
                </p>
              )}
              {computedStatus === 'pending' && (
                <p className={`text-sm ${statusColors.text}`}>
                  This milestone has not started yet. Target date has not been set.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Target Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <p className="text-xs text-text-muted mt-1">
            Default SLA: {DEFAULT_SLA_DAYS[milestoneKey] || 0} days from mandate creation
          </p>
        </div>

        {/* Actual Date */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            <CheckCircle2 className="w-4 h-4 inline-block mr-1" />
            Actual Completion Date
          </label>
          <input
            type="date"
            value={actualDate}
            onChange={(e) => setActualDate(e.target.value)}
            placeholder="Leave empty if not completed"
            className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <p className="text-xs text-text-muted mt-1">
            Leave empty if the milestone is not yet completed
          </p>
        </div>

        {/* Days Info */}
        {daysUntilDue !== null && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-bg-alt rounded-lg">
              <div className="flex items-center gap-2 text-text-muted mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Days Until Due</span>
              </div>
              <p className={`text-2xl font-bold ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
                {daysUntilDue < 0 ? Math.abs(daysUntilDue) : daysUntilDue}
              </p>
              <p className="text-xs text-text-muted">
                {daysUntilDue < 0 ? 'day(s) overdue' : daysUntilDue === 0 ? 'Due today' : 'day(s) remaining'}
              </p>
            </div>
            {actualDate && daysLate !== null && (
              <div className="p-4 bg-bg-alt rounded-lg">
                <div className="flex items-center gap-2 text-text-muted mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Days Late/Early</span>
                </div>
                <p className={`text-2xl font-bold ${daysLate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {daysLate > 0 ? `+${daysLate}` : daysLate}
                </p>
                <p className="text-xs text-text-muted">
                  {daysLate > 0 ? 'day(s) late' : daysLate === 0 ? 'On time' : 'day(s) early'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this milestone..."
            rows={4}
            className="w-full px-4 py-2.5 bg-bg-alt border border-card-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-card-border bg-bg-alt flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}