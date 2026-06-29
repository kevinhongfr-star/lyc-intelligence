'use client';

import React from 'react';
import { Award, Trophy, Star, AlertTriangle, XCircle } from 'lucide-react';

interface MatchQualityBadgeProps {
  score: number;
  grade?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GRADE_CONFIG = {
  EXCEPTIONAL: {
    label: 'EXCEPTIONAL',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    barColor: 'bg-emerald-500',
    icon: Trophy,
    iconColor: 'text-emerald-500',
    minScore: 85,
  },
  STRONG: {
    label: 'STRONG',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    barColor: 'bg-blue-500',
    icon: Award,
    iconColor: 'text-blue-500',
    minScore: 70,
  },
  MODERATE: {
    label: 'MODERATE',
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    barColor: 'bg-amber-500',
    icon: Star,
    iconColor: 'text-amber-500',
    minScore: 50,
  },
  WEAK: {
    label: 'WEAK',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    barColor: 'bg-orange-500',
    icon: AlertTriangle,
    iconColor: 'text-orange-500',
    minScore: 30,
  },
  MISMATCH: {
    label: 'MISMATCH',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    barColor: 'bg-gray-400',
    icon: XCircle,
    iconColor: 'text-gray-400',
    minScore: 0,
  },
};

export function getGradeFromScore(score: number): keyof typeof GRADE_CONFIG {
  if (score >= 85) return 'EXCEPTIONAL';
  if (score >= 70) return 'STRONG';
  if (score >= 50) return 'MODERATE';
  if (score >= 30) return 'WEAK';
  return 'MISMATCH';
}

export function MatchQualityBadge({ score, grade, showLabel = true, size = 'md' }: MatchQualityBadgeProps) {
  const effectiveGrade = grade || getGradeFromScore(score);
  const config = GRADE_CONFIG[effectiveGrade as keyof typeof GRADE_CONFIG] || GRADE_CONFIG.MISMATCH;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.color} ${sizeClasses[size]}`}>
      <Icon className={iconSizeClasses[size]} />
      {showLabel && <span>{score.toFixed(0)}</span>}
    </span>
  );
}

export function MatchScoreBar({ score, grade, showScore = true, height = 'h-2' }: {
  score: number;
  grade?: string;
  showScore?: boolean;
  height?: string;
}) {
  const effectiveGrade = grade || getGradeFromScore(score);
  const config = GRADE_CONFIG[effectiveGrade as keyof typeof GRADE_CONFIG] || GRADE_CONFIG.MISMATCH;

  return (
    <div className="w-full">
      <div className={`w-full bg-bg-alt rounded-full overflow-hidden ${height}`}>
        <div
          className={`${config.barColor} ${height} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      {showScore && (
        <div className="flex justify-between mt-1">
          <span className="text-xs font-medium text-text-secondary">{effectiveGrade}</span>
          <span className="text-xs font-bold text-text-primary">{score.toFixed(1)}/100</span>
        </div>
      )}
    </div>
  );
}

export default MatchQualityBadge;
