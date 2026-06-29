// EnrichmentStatusBadge.tsx — DEX Platform Foundation T1
// Shows enrichment status badge on contact cards

'use client';

import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui';

type EnrichmentStatus = 'raw' | 'linkedin_parsed' | 'scored' | 'narrated' | 'complete';

interface EnrichmentStatusBadgeProps {
  status: EnrichmentStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<EnrichmentStatus, {
  label: string;
  variant: 'default' | 'warning' | 'success' | 'danger';
  icon: React.ReactNode;
  description: string;
}> = {
  raw: {
    label: 'Raw',
    variant: 'default',
    icon: <AlertCircle className="w-3 h-3" />,
    description: 'Contact needs enrichment',
  },
  linkedin_parsed: {
    label: 'Parsed',
    variant: 'warning',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    description: 'LinkedIn data extracted',
  },
  scored: {
    label: 'Scored',
    variant: 'warning',
    icon: <Sparkles className="w-3 h-3" />,
    description: 'TRIDENT scoring complete',
  },
  narrated: {
    label: 'Narrated',
    variant: 'success',
    icon: <CheckCircle2 className="w-3 h-3" />,
    description: 'CANVAS narration complete',
  },
  complete: {
    label: 'Complete',
    variant: 'success',
    icon: <CheckCircle2 className="w-3 h-3" />,
    description: 'Fully enriched',
  },
};

export function EnrichmentStatusBadge({
  status,
  size = 'md',
  showLabel = true,
}: EnrichmentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.raw;

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <div className="relative group">
      <Badge
        variant={config.variant}
        className={`${sizeClasses} cursor-help`}
      >
        <span className="flex items-center gap-1">
          {config.icon}
          {showLabel && <span>{config.label}</span>}
        </span>
      </Badge>

      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap">
          <div className="font-medium">{config.description}</div>
          <div className="text-gray-400 mt-0.5">
            Status: {config.label}
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-3 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

// Compact version for inline use
export function EnrichmentDot({ status }: { status: EnrichmentStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.raw;

  const colorClasses: Record<string, string> = {
    default: 'bg-gray-400',
    warning: 'bg-amber-400',
    success: 'bg-green-500',
    danger: 'bg-red-500',
  };

  return (
    <div className="relative group">
      <div className={`w-2 h-2 rounded-full ${colorClasses[config.variant]}`} />

      {/* Tooltip */}
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap">
          {config.description}
        </div>
        <div className="absolute top-full left-2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
