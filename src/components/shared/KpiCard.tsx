/**
 * KpiCard — Dashboard KPI display card
 * Mockup v14 style: stat card with value + label + optional trend
 */
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function KpiCard({ value, label, trend, trendValue, onClick, icon }: KpiCardProps) {
  const trendIcon = trend === 'up' ? <TrendingUp className="w-4 h-4" /> 
    : trend === 'down' ? <TrendingDown className="w-4 h-4" /> 
    : trend ? <Minus className="w-4 h-4" /> : null;
  
  const trendColor = trend === 'up' ? 'text-green' 
    : trend === 'down' ? 'text-red' 
    : 'text-text-muted';

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-card shadow-card border border-border p-4 
        ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-fuchsia transition-all' : ''}
      `}
    >
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <div className="text-3xl font-serif font-bold text-text-primary">{value}</div>
      <div className="text-sm text-text-secondary mt-1">{label}</div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
          {trendIcon}
          <span className="text-xxs font-semibold">{trendValue}</span>
        </div>
      )}
    </div>
  );
}

export default KpiCard;