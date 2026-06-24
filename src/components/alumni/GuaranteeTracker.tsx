// Phase 4.6: Guarantee Tracker Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

interface CheckInRecord {
  date: string;
  status: string;
  notes: string;
  consultant_id: string;
}

interface GuaranteeTrackerProps {
  alumniId: string;
}

const STATUS_CONFIG = {
  active: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Active' },
  completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' },
  claimed: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Claimed' },
  disputed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Disputed' },
};

export function GuaranteeTracker({ alumniId }: GuaranteeTrackerProps) {
  const [guarantee, setGuarantee] = useState<{
    id: string;
    start_date: string;
    end_date: string;
    duration_months: number;
    status: 'active' | 'completed' | 'claimed' | 'disputed';
    check_in_dates: string[];
    check_ins_completed: CheckInRecord[];
    fee_refund_pct: number | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchGuarantee();
  }, [alumniId]);

  useEffect(() => {
    if (guarantee) {
      const end = new Date(guarantee.end_date);
      const today = new Date();
      const diff = end.getTime() - today.getTime();
      setDaysRemaining(Math.ceil(diff / (1000 * 60 * 60 * 24)));

      const start = new Date(guarantee.start_date);
      const total = end.getTime() - start.getTime();
      const elapsed = today.getTime() - start.getTime();
      setProgress(Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))));
    }
  }, [guarantee]);

  const fetchGuarantee = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/x/alumni/guarantee?alumni_id=${alumniId}`);
      const result = await response.json();

      if (result.success) {
        setGuarantee(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch guarantee:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDatePassed = (dateString: string) => {
    return new Date(dateString) <= new Date();
  };

  const isCheckInCompleted = (dateString: string) => {
    return guarantee?.check_ins_completed.some(c => c.date === dateString);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!guarantee) {
    return (
      <Card className="p-8 text-center">
        <Clock className="w-12 h-12 text-text-muted mx-auto" />
        <p className="text-text-muted mt-4">No guarantee period found</p>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[guarantee.status];
  const StatusIcon = statusConfig.icon;
  const isUrgent = guarantee.status === 'active' && daysRemaining <= 7;
  const isOverdue = daysRemaining < 0;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-primary">Guarantee Period</h3>
          <p className="text-sm text-text-muted mt-1">
            {guarantee.duration_months}-month guarantee
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg}`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
          <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Countdown */}
      <div className={`p-4 rounded-lg mb-6 ${
        isOverdue ? 'bg-red-50' : isUrgent ? 'bg-amber-50' : 'bg-bg-alt'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-text-muted">Days Remaining</div>
            <div className={`text-3xl font-bold ${
              isOverdue ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-text-primary'
            }`}>
              {isOverdue ? `-${Math.abs(daysRemaining)}` : daysRemaining}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-muted">Ends</div>
            <div className="font-medium text-text-primary">{formatDate(guarantee.end_date)}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-bg-base rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverdue ? 'bg-red-500' : isUrgent ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>{formatDate(guarantee.start_date)}</span>
            <span>{progress}% complete</span>
            <span>{formatDate(guarantee.end_date)}</span>
          </div>
        </div>
      </div>

      {/* Check-ins */}
      <div>
        <h4 className="font-medium text-text-primary mb-3">Scheduled Check-ins</h4>
        <div className="space-y-2">
          {guarantee.check_in_dates.map((date, index) => {
            const passed = isDatePassed(date);
            const completed = isCheckInCompleted(date);

            return (
              <div
                key={date}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  completed ? 'bg-green-50' : passed && !completed ? 'bg-red-50' : 'bg-bg-alt'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completed ? 'bg-green-100' : passed && !completed ? 'bg-red-100' : 'bg-bg-base'
                  }`}>
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : passed && !completed ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : (
                      <Calendar className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                  <div>
                    <div className={`font-medium ${
                      completed ? 'text-green-700' : passed && !completed ? 'text-red-700' : 'text-text-primary'
                    }`}>
                      Check-in {index + 1}
                    </div>
                    <div className="text-sm text-text-muted">{formatDate(date)}</div>
                  </div>
                </div>
                {!completed && (
                  <Button variant="outline" size="sm">
                    Record Check-in
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed Check-ins */}
      {guarantee.check_ins_completed.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-text-primary mb-3">Completed Check-ins</h4>
          <div className="space-y-2">
            {guarantee.check_ins_completed.map((checkIn, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-bg-alt rounded-lg">
                <MessageSquare className="w-4 h-4 text-text-muted mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{formatDate(checkIn.date)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      checkIn.status === 'positive' ? 'bg-green-100 text-green-700' :
                      checkIn.status === 'neutral' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {checkIn.status}
                    </span>
                  </div>
                  {checkIn.notes && (
                    <p className="text-sm text-text-muted mt-1">{checkIn.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default GuaranteeTracker;