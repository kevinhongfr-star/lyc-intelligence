/**
 * PricingPageShell — 5-column tier comparison layout.
 *
 * Batch 1.5 / Ticket 4: STRUCTURAL SHELL ONLY — no real copy.
 * All tier data is data-driven from @/config/tiers (single source of truth).
 * Emily's copy will plug into this structure later.
 *
 * Features:
 *  - 5-column layout (Explorer / Starter / Professional / Executive / Council)
 *  - Billing toggle (monthly / annual, annual = 15% off)
 *  - "Most Popular" badge on Professional
 *  - Data-driven feature rows from TIERS config (not hardcoded)
 *  - Placeholder text only — marked [placeholder]
 *  - Zero visual design work — structure only
 */
import React, { useState, useMemo } from 'react';
import { Check, Minus } from 'lucide-react';
import {
  TIER_ORDER,
  TIERS,
  TIER_PRICING,
  RECOMMENDED_TIER,
  computeTierPrice,
  formatPrice,
  ANNUAL_DISCOUNT_PERCENT,
  type TierKey,
  type BillingCycle,
  type TierFeatures,
} from '@/config/tiers';
import { useTier } from '@/components/tier/TierProvider';

const ACCENT = '#C108AB';

/**
 * Feature row definitions — each row specifies which feature flag/limit
 * to read from the tier config. The label is placeholder copy.
 * Rows render in this order on the pricing page.
 */
interface FeatureRowDef {
  /** Placeholder label for the feature row. */
  label: string;
  /** Key in TierFeatures to read. */
  key: keyof TierFeatures;
  /** How to render the value. */
  render: 'boolean' | 'number' | 'null-unlimited' | 'number-or-dash';
  /** Suffix for number values (e.g., " / day"). */
  suffix?: string;
}

const FEATURE_ROWS: FeatureRowDef[] = [
  { label: '[NEXUS daily messages]', key: 'nexusDailyMessages', render: 'null-unlimited', suffix: ' / day' },
  { label: '[NEXUS priority responses]', key: 'nexusPriority', render: 'boolean' },
  { label: '[Assessment baselines]', key: 'assessmentBaselines', render: 'number-or-dash' },
  { label: '[Unlimited retakes]', key: 'assessmentUnlimitedRetakes', render: 'boolean' },
  { label: '[Branded PDF reports]', key: 'brandedPdfReports', render: 'boolean' },
  { label: '[Advanced insights]', key: 'advancedInsights', render: 'boolean' },
  { label: '[Peer benchmarking]', key: 'peerBenchmarking', render: 'boolean' },
  { label: '[Monthly miles]', key: 'monthlyMiles', render: 'number-or-dash' },
  { label: '[Miles earning]', key: 'earnsMiles', render: 'boolean' },
  { label: '[Council community]', key: 'councilCommunity', render: 'boolean' },
  { label: '[Executive workshops]', key: 'executiveWorkshops', render: 'boolean' },
  { label: '[Priority support]', key: 'prioritySupport', render: 'boolean' },
  { label: '[Dedicated contact]', key: 'dedicatedContact', render: 'boolean' },
];

function renderFeatureValue(features: TierFeatures, row: FeatureRowDef): React.ReactNode {
  const val = features[row.key];
  switch (row.render) {
    case 'boolean':
      return val ? <Check size={16} style={{ color: ACCENT }} /> : <Minus size={16} style={{ color: '#CCC' }} />;
    case 'null-unlimited':
      if (val === null || val === undefined) return 'Unlimited';
      return `${val}${row.suffix ?? ''}`;
    case 'number-or-dash':
      if (typeof val !== 'number' || val === 0) return <Minus size={16} style={{ color: '#CCC' }} />;
      return `${val}${row.suffix ?? ''}`;
    case 'number':
      return typeof val === 'number' ? `${val}${row.suffix ?? ''}` : '—';
    default:
      return '—';
  }
}

export interface PricingPageShellProps {
  /** Called when a tier's CTA button is clicked. */
  onSelectTier?: (tier: TierKey) => void;
}

export function PricingPageShell({ onSelectTier }: PricingPageShellProps): React.ReactElement {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const { tier: currentTier } = useTier();

  const cycleLabel = cycle === 'monthly' ? '/ mo' : '/ mo (billed annually)';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── HEADER (placeholder) ── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 32px', textAlign: 'center' }}>
        <div style={{
          fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase',
          color: '#666', fontWeight: 600, marginBottom: 14,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          [Plans & Pricing — placeholder]
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 4.5vw, 44px)', fontWeight: 700,
          color: '#000', lineHeight: 1.12, letterSpacing: '-0.02em', margin: 0,
          fontFamily: "'DejaVu Serif', 'Georgia', serif",
        }}>
          [Pricing headline — placeholder]
        </h1>
        <p style={{
          fontSize: 16, color: '#666', lineHeight: 1.6,
          marginTop: 16, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto',
        }}>
          [Pricing subheadline — placeholder copy goes here.]
        </p>

        {/* Billing cycle toggle */}
        <div style={{
          marginTop: 32, display: 'inline-flex',
          background: '#F5F5F5', border: '1px solid #E5E5E5',
        }}>
          {(['monthly', 'annual'] as BillingCycle[]).map((c) => {
            const isActive = cycle === c;
            return (
              <button
                key={c}
                onClick={() => setCycle(c)}
                aria-pressed={isActive}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '10px 20px',
                  background: isActive ? ACCENT : 'transparent',
                  color: isActive ? '#fff' : '#666',
                  border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {c}
                {c === 'annual' && (
                  <span style={{
                    fontSize: 10, letterSpacing: '0.08em',
                    background: isActive ? 'rgba(255,255,255,0.25)' : `${ACCENT}1A`,
                    color: isActive ? '#fff' : ACCENT, padding: '2px 6px',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                    SAVE {ANNUAL_DISCOUNT_PERCENT}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5-COLUMN TIER CARDS ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 16,
        }} className="pricing-grid-5col">
          {TIER_ORDER.map((tierKey) => {
            const meta = TIERS[tierKey];
            const isRecommended = tierKey === RECOMMENDED_TIER;
            const isCurrent = tierKey === currentTier;
            const isEntry = tierKey === 'explorer';
            const price = computeTierPrice(tierKey, 'USD', cycle);

            return (
              <div
                key={tierKey}
                style={{
                  position: 'relative',
                  background: '#fff',
                  border: `1px solid ${isRecommended ? ACCENT : '#E5E5E5'}`,
                  padding: '32px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Most Popular badge */}
                {isRecommended && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{
                      background: ACCENT, color: '#fff',
                      fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                      padding: '5px 14px', fontWeight: 600, whiteSpace: 'nowrap',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current tier badge */}
                {isCurrent && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span style={{
                      fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: '#999', fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      Current
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <h3 style={{
                  fontSize: 20, fontWeight: 700, color: '#000',
                  letterSpacing: '-0.01em', margin: 0,
                  fontFamily: "'DejaVu Serif', 'Georgia', serif",
                }}>
                  {meta.displayName}
                </h3>
                <p style={{
                  fontSize: 12, color: '#999', marginTop: 4,
                }}>
                  {meta.tagline}
                </p>

                {/* Price */}
                <div style={{
                  marginTop: 20, marginBottom: 20, paddingBottom: 20,
                  borderBottom: '1px solid #E5E5E5',
                }}>
                  {price.isZero ? (
                    <div>
                      <div style={{
                        fontSize: 28, fontWeight: 700, color: '#000',
                        letterSpacing: '-0.02em',
                        fontFamily: "'DejaVu Serif', 'Georgia', serif",
                      }}>
                        Complimentary
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                        [No card required — placeholder]
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 32, fontWeight: 700, color: '#000',
                        letterSpacing: '-0.02em',
                        fontFamily: "'DejaVu Serif', 'Georgia', serif",
                      }}>
                        {formatPrice(price.perMonth, 'USD')}
                      </span>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {cycleLabel}
                      </span>
                    </div>
                  )}
                  {!isEntry && (
                    <div style={{
                      fontSize: 10, color: '#999', marginTop: 6,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>
                      {TIER_PRICING[tierKey].usdMonthly === 0 ? '' : `${meta.features.monthlyMiles} miles / mo`}
                    </div>
                  )}
                </div>

                {/* CTA button */}
                <button
                  onClick={() => onSelectTier?.(tierKey)}
                  disabled={isCurrent}
                  style={{
                    width: '100%', fontSize: 13, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                    padding: '12px 16px', minHeight: 44,
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent
                      ? 'transparent'
                      : isRecommended
                        ? ACCENT
                        : isEntry
                          ? 'transparent'
                          : '#000',
                    color: isCurrent
                      ? '#999'
                      : isRecommended
                        ? '#fff'
                        : isEntry
                          ? '#000'
                          : '#fff',
                    border: `1px solid ${
                      isCurrent ? '#E5E5E5'
                      : isRecommended ? ACCENT
                      : isEntry ? '#000' : '#000'
                    }`,
                    marginBottom: 20,
                  }}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : isEntry
                      ? '[Start — placeholder]'
                      : `[Choose ${meta.displayName} — placeholder]`}
                </button>

                {/* Feature rows — data-driven from config */}
                <ul style={{
                  listStyle: 'none', padding: 0, margin: 0,
                  display: 'flex', flexDirection: 'column', gap: 10,
                  flex: 1,
                }}>
                  {FEATURE_ROWS.map((row) => (
                    <li key={row.key} style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      fontSize: 12.5, color: '#333', lineHeight: 1.4,
                    }}>
                      <span style={{ flexShrink: 0, marginTop: 1, display: 'flex' }}>
                        {renderFeatureValue(meta.features, row)}
                      </span>
                      <span>{row.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Responsive: collapse to 2-col on tablet, 1-col on mobile */}
      <style>{`
        @media (max-width: 1024px) {
          .pricing-grid-5col { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .pricing-grid-5col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default PricingPageShell;
