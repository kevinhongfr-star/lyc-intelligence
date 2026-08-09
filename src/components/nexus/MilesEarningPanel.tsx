import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Zap,
  Clock,
  TrendingUp,
  Gift,
  Calendar,
  Award,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchMilesEarningProgress, type MilesEarningProgress } from '@/services/monetizationService';

export interface MilesEarningItem {
  event_type: string;
  label: string;
  description: string;
  miles: number;
  icon: React.ReactNode;
  lastEarned: string | null;
  totalEarned: number;
  count: number;
  available: boolean;
}

export interface MilesEarningPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Additional className */
  className?: string;
}

const ACCENT = '#C108AB';

const EARNING_CATALOG: Omit<MilesEarningItem, 'lastEarned' | 'totalEarned' | 'count' | 'available'>[] = [
  {
    event_type: 'login_streak',
    label: 'Daily Login',
    description: 'Log in each day to earn streak bonuses',
    miles: 5,
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    event_type: 'assessment_completion',
    label: 'Complete Assessments',
    description: 'Finish any assessment to earn miles',
    miles: 20,
    icon: <Award className="w-5 h-5" />,
  },
  {
    event_type: 'deliverable_generation',
    label: 'Generate Deliverables',
    description: 'Create reports, summaries, and frameworks',
    miles: 15,
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    event_type: 'mock_interview',
    label: 'Mock Interviews',
    description: 'Practice with AI-powered mock interviews',
    miles: 10,
    icon: <Zap className="w-5 h-5" />,
  },
  {
    event_type: 'pdf_export',
    label: 'Export as PDF',
    description: 'Export your reports and documents',
    miles: 3,
    icon: <Gift className="w-5 h-5" />,
  },
  {
    event_type: 'referral_signup',
    label: 'Refer Friends',
    description: 'Invite colleagues to join LYC',
    miles: 50,
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

/**
 * MilesEarningPanel — slide-out drawer showing earning opportunities.
 * Zero border-radius, crimson #C108AB accent.
 * Displays progress per earning event and available actions.
 */
export function MilesEarningPanel({ open, onClose, className }: MilesEarningPanelProps) {
  const [progress, setProgress] = useState<MilesEarningProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);

    fetchMilesEarningProgress()
      .then((data) => {
        if (mounted) setProgress(data);
      })
      .catch(() => {
        if (mounted) setProgress([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  const progressMap = new Map(progress.map((p) => [p.event_type, p]));

  const totalPotential = EARNING_CATALOG.reduce((sum, item) => sum + item.miles, 0);
  const totalEarned = progress.reduce((sum, p) => sum + p.total_earned, 0);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Miles Earning Panel">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-full max-w-md bg-white overflow-y-auto shadow-xl',
          className
        )}
        style={{ }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{
            background: `${ACCENT}12`,
            borderBottom: `2px solid ${ACCENT}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: ACCENT }}>
                Earn Miles
              </h2>
              <p className="text-xs opacity-70" style={{ color: ACCENT }}>
                Complete actions to earn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:opacity-70 transition-opacity"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: ACCENT }} />
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4"
              style={{
                background: `${ACCENT}08`,
                border: `1px solid ${ACCENT}30`,
              }}
            >
              <p className="text-xs opacity-60" style={{ color: ACCENT }}>
                Total Earned
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: ACCENT }}>
                {totalEarned.toLocaleString()}
              </p>
            </div>
            <div
              className="p-4"
              style={{
                background: `${ACCENT}08`,
                border: `1px solid ${ACCENT}30`,
              }}
            >
              <p className="text-xs opacity-60" style={{ color: ACCENT }}>
                Per Action
              </p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: ACCENT }}>
                {totalPotential.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Earning list */}
        <div className="px-6 pb-6 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider opacity-60 mb-3" style={{ color: ACCENT }}>
            Earning Opportunities
          </h3>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse"
                style={{ background: `${ACCENT}10` }}
              />
            ))
          ) : (
            EARNING_CATALOG.map((item) => {
              const progressData = progressMap.get(item.event_type);
              const earned = progressData?.total_earned ?? 0;
              const count = progressData?.count ?? 0;

              return (
                <div
                  key={item.event_type}
                  className="flex items-start gap-4 p-4 transition-colors hover:bg-opacity-50"
                  style={{
                    background: `${ACCENT}08`,
                    border: `1px solid ${ACCENT}20`,
                  }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${ACCENT}20`,
                      color: ACCENT,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm" style={{ color: '#000' }}>
                        {item.label}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Zap className="w-3 h-3" style={{ color: ACCENT }} />
                        <span className="text-sm font-bold tabular-nums" style={{ color: ACCENT }}>
                          {item.miles}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs opacity-60 mt-1" style={{ color: '#333' }}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs opacity-50">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Earned {count}×
                      </span>
                      {earned > 0 && (
                        <span className="flex items-center gap-1" style={{ color: ACCENT }}>
                          <TrendingUp className="w-3 h-3" />
                          +{earned} total
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
