import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingTier, InstrumentUserFacing, PricingCurrency, TierKey } from '@/config/pricingData';

export interface FeatureComparisonTableProps {
  tiers: PricingTier[];
  instruments: Record<string, InstrumentUserFacing>;
  currency: PricingCurrency;
}

const TOTAL_DIAGNOSTICS = 11;

const FEATURE_ROWS: Array<{
  rowKey: string;
  label: React.ReactNode;
  description?: string;
  check: (tier: PricingTier, instruments: Record<string, InstrumentUserFacing>) => boolean | string | number;
}> = [
  {
    rowKey: 'monthly_miles',
    label: 'Monthly diagnostic miles',
    description: 'Miles allocation per billing cycle',
    check: (tier) => tier.monthlyMiles,
  },
  {
    rowKey: 'diagnostic_access',
    label: `Diagnostic access (${TOTAL_DIAGNOSTICS} total)`,
    description: 'All 11 diagnostics unlocked',
    check: (tier) => tier.tier_key !== 'explorer',
  },
  {
    rowKey: 'cpi_access',
    label: 'CPI — China Leadership Pipeline Index (Flagship, 5mi)',
    description: 'Flagship China leadership diagnostic',
    check: (tier) => tier.tier_key !== 'explorer',
  },
  {
    rowKey: 'career_core',
    label: 'Career Core diagnostics access (1mi – 2mi)',
    description: 'LEAP, IMPACT, COACH, DRIVE, QUEST',
    check: (tier) => tier.tier_key !== 'explorer',
  },
  {
    rowKey: 'advisory',
    label: 'Advisory diagnostics access (2mi – 3mi)',
    description: 'PRISM, BRIDGE, MOSAIC, SPARK, FORGE',
    check: (tier) => tier.tier_key !== 'explorer',
  },
  {
    rowKey: 'personalised_reports',
    label: 'Personalised diagnostic reports',
    description: 'PDF export of every diagnostic',
    check: (tier) => tier.tier_key !== 'explorer',
  },
  {
    rowKey: 'benchmarking',
    label: 'Peer benchmarking (regional C-suite)',
    description: 'Against executive peer datasets',
    check: (tier) =>
      tier.tier_key === 'pro' || tier.tier_key === 'executive' || tier.tier_key === 'council',
  },
  {
    rowKey: 'workspace',
    label: 'Deliverable workspace',
    description: 'Canvas, grid, and save outputs',
    check: (tier) =>
      tier.tier_key === 'pro' || tier.tier_key === 'executive' || tier.tier_key === 'council',
  },
  {
    rowKey: 'debriefs',
    label: 'Executive consultant debriefs',
    description: 'Paid sessions on-demand',
    check: (tier) => tier.tier_key === 'executive' || tier.tier_key === 'council',
  },
  {
    rowKey: 'live_events',
    label: 'Live event access',
    description: 'Executive briefings & workshops',
    check: (tier) => tier.tier_key === 'executive' || tier.tier_key === 'council',
  },
  {
    rowKey: 'council_community',
    label: 'Council community & quarterly workshops',
    description: 'Invite-only Council tier',
    check: (tier) => tier.tier_key === 'council',
  },
  {
    rowKey: 'priority_support',
    label: 'Priority support',
    description: 'Dedicated response SLA',
    check: (tier) =>
      tier.tier_key === 'pro' || tier.tier_key === 'executive' || tier.tier_key === 'council',
  },
];

export const FeatureComparisonTable: React.FC<FeatureComparisonTableProps> = ({
  tiers,
  instruments,
  currency,
}) => {
  const orderedTiers = [...tiers].sort((a, b) => a.order - b.order);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="bg-bg-secondary">
            <th className="text-left p-4 border-b border-bg-tertiary sticky left-0 bg-bg-secondary z-10 min-w-[220px]">
              <span className="text-sm font-semibold text-text-primary">Features</span>
            </th>
            {orderedTiers.map((tier) => {
              const isRec = tier.tier_key === 'pro';
              return (
                <th
                  key={tier.tier_key}
                  className={cn(
                    'text-center p-4 border-b border-bg-tertiary min-w-[130px]',
                    isRec && 'bg-accent/5',
                  )}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'font-serif font-bold',
                        isRec ? 'text-accent text-lg' : 'text-text-primary',
                      )}
                    >
                      {tier.display_name}
                    </span>
                    {tier.tier_key === 'explorer' ? (
                      <span className="text-xs text-text-muted">{tier.alias}</span>
                    ) : (
                      <span className="text-xs text-text-muted">
                        {currency === 'CNY' ? `¥${tier.cnyMonthly}` : `$${tier.usdMonthly}`}
                        {currency === 'CNY' ? ' / 月' : ' / mo'}
                      </span>
                    )}
                    <span className="text-[11px] text-text-secondary">
                      {tier.monthlyMiles} mi / mo
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FEATURE_ROWS.map((row, rowIdx) => (
            <tr
              key={row.rowKey}
              className={cn(rowIdx % 2 === 0 ? 'bg-white' : 'bg-bg-secondary/40')}
            >
              <td className="p-4 border-b border-bg-tertiary sticky left-0 bg-inherit z-10">
                <div className="text-sm font-medium text-text-primary">{row.label}</div>
                {row.description && (
                  <div className="text-xs text-text-muted mt-1">{row.description}</div>
                )}
              </td>
              {orderedTiers.map((tier) => {
                const value = row.check(tier, instruments);
                const isRec = tier.tier_key === 'pro';
                return (
                  <td
                    key={tier.tier_key}
                    className={cn(
                      'p-4 border-b border-bg-tertiary text-center align-middle',
                      isRec && 'bg-accent/5',
                    )}
                  >
                    {typeof value === 'number' ? (
                      <span
                        className={cn(
                          'font-bold',
                          value === 0 ? 'text-text-muted' : 'text-text-primary',
                        )}
                      >
                        {value === 0 ? '—' : value}
                      </span>
                    ) : typeof value === 'boolean' ? (
                      value ? (
                        <div className="flex justify-center">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-6 h-6 rounded-full',
                              isRec ? 'bg-accent/15' : 'bg-tier-1Bg',
                            )}
                          >
                            <Check
                              className={cn(
                                'h-4 w-4',
                                isRec ? 'text-accent' : 'text-tier-1',
                              )}
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <X className="h-5 w-5 text-text-muted/60" aria-hidden="true" />
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-text-secondary">{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
