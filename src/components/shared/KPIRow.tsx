/**
 * KPIRow — Reusable KPI card row component
 * Used across all portals for key metric display
 */

import React from 'react';

const DS = {
  accent: '#C108AB',
  text: '#000000',
  muted: '#666666',
  border: '#E5E5E5',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  bodyFont: "'DM Sans', system-ui, sans-serif",
  headingFont: "'Libre Baskerville', Georgia, serif",
  success: '#00897B',
  warning: '#F59E0B',
  error: '#DC2626',
};

export interface KPI {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

interface KPIRowProps {
  kpis: KPI[];
  columns?: 2 | 3 | 4 | 5;
}

export function KPIRow({ kpis, columns = 4 }: KPIRowProps) {
  const gridCols: Record<number, string> = {
    2: 'repeat(2, 1fr)',
    3: 'repeat(3, 1fr)',
    4: 'repeat(4, 1fr)',
    5: 'repeat(5, 1fr)',
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols[columns],
      gap: '16px',
      marginBottom: '24px',
    }}>
      {kpis.map((kpi, i) => (
        <div key={i} style={{
          background: DS.bg,
          border: `1px solid ${DS.border}`,
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            {kpi.icon && (
              <div style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${DS.accent}10`,
                color: DS.accent,
                flexShrink: 0,
              }}>
                {kpi.icon}
              </div>
            )}
            <span style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 500,
              color: DS.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {kpi.label}
            </span>
          </div>
          <div style={{
            fontFamily: DS.headingFont,
            fontSize: '28px',
            fontWeight: 700,
            color: DS.text,
            lineHeight: 1,
            marginBottom: kpi.change ? '4px' : 0,
          }}>
            {kpi.value}
          </div>
          {kpi.change && (
            <span style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 500,
              color: kpi.changeType === 'positive' ? DS.success :
                     kpi.changeType === 'negative' ? DS.error :
                     DS.muted,
            }}>
              {kpi.change}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
