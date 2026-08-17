/**
 * FeatureComparisonTable.tsx — Full feature comparison table (Batch 3 / Ticket 3).
 *
 * Feature-by-feature comparison across all 5 tiers. Categories: NEXUS Chat,
 * Assessment Miles, Human Debriefs, Document Upload, Reports, Ensemble/Advanced,
 * Support. Sticky tier headers on scroll. Mobile: horizontal scroll.
 *
 * All values come from FEATURE_ROWS in pricingData.ts — no hardcoded numbers.
 */
import React from 'react';
import { DS } from '@/tokens';
import {
  PRICING_TIERS,
  FEATURE_ROWS,
  FEATURE_CATEGORIES,
  type FeatureRow,
  type FeatureCellValue,
  type FeatureCellRender,
} from '@/config/pricingData';

export function FeatureComparisonTable() {
  return (
    <section
      style={{
        background: DS.bg,
        padding: '64px 24px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Section heading */}
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              fontFamily: DS.monoFont,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: DS.eyebrow,
              marginBottom: 16,
            }}
          >
            [Emily: comparison table eyebrow]
          </div>
          <h2
            style={{
              fontFamily: DS.headingFont,
              fontSize: 36,
              lineHeight: 1.2,
              color: DS.text,
              margin: 0,
              fontWeight: 600,
            }}
          >
            [Emily: comparison table headline]
          </h2>
        </div>

        {/* Table — horizontal scroll on mobile */}
        <div
          style={{
            overflowX: 'auto',
            border: `1px solid ${DS.border}`,
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: DS.bodyFont,
              minWidth: 800,
            }}
          >
            {/* Sticky header row */}
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <th
                  style={{
                    background: DS.bgDark,
                    color: DS.bg,
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontFamily: DS.monoFont,
                    fontSize: 12,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    width: '30%',
                  }}
                >
                  Feature
                </th>
                {PRICING_TIERS.map((tier) => (
                  <th
                    key={tier.key}
                    style={{
                      background: tier.isRecommended ? DS.accent : DS.bgDark,
                      color: DS.bg,
                      padding: '16px 20px',
                      textAlign: 'center',
                      fontFamily: DS.headingFont,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {tier.displayName}
                    {tier.isInviteOnly && (
                      <div
                        style={{
                          fontFamily: DS.monoFont,
                          fontSize: 10,
                          fontWeight: 400,
                          letterSpacing: '0.1em',
                          marginTop: 4,
                          opacity: 0.8,
                        }}
                      >
                        Invite Only
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {FEATURE_CATEGORIES.map((category) => (
                <CategoryGroup key={category} category={category} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function CategoryGroup({ category }: { category: string }) {
  const rows = FEATURE_ROWS.filter((r) => r.category === category);
  return (
    <>
      {/* Category header row */}
      <tr>
        <td
          colSpan={6}
          style={{
            background: DS.bgAlt,
            padding: '12px 20px',
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: DS.accent,
            borderBottom: `1px solid ${DS.border}`,
            borderTop: `2px solid ${DS.borderStrong}`,
          }}
        >
          {category}
        </td>
      </tr>
      {rows.map((row, i) => (
        <FeatureRowComponent key={i} row={row} />
      ))}
    </>
  );
}

function FeatureRowComponent({ row }: { row: FeatureRow }) {
  return (
    <tr style={{ borderBottom: `1px solid ${DS.divider}` }}>
      {/* Feature label */}
      <td
        style={{
          padding: '14px 20px',
          fontFamily: DS.bodyFont,
          fontSize: 14,
          color: DS.textSecondary,
        }}
      >
        {row.label}
      </td>
      {/* Per-tier values */}
      {PRICING_TIERS.map((tier) => (
        <td
          key={tier.key}
          style={{
            padding: '14px 20px',
            textAlign: 'center',
            fontFamily: DS.bodyFont,
            fontSize: 14,
            color: DS.text,
          }}
        >
          <FeatureCell value={row.values[tier.key]} render={row.render} suffix={row.suffix} />
        </td>
      ))}
    </tr>
  );
}

function FeatureCell({
  value,
  render,
  suffix,
}: {
  value: FeatureCellValue;
  render: FeatureCellRender;
  suffix?: string;
}) {
  if (render === 'check') {
    return value ? <span style={{ color: DS.accent, fontWeight: 600 }}>✓</span> : <span style={{ color: DS.mutedDim }}>—</span>;
  }
  if (render === 'unlimited') {
    if (value === null || value === undefined) return <span style={{ fontWeight: 600 }}>Unlimited</span>;
    return <span>{`${value}${suffix ?? ''}`}</span>;
  }
  if (render === 'number') {
    if (value === 0 || value === null || value === undefined) return <span style={{ color: DS.mutedDim }}>—</span>;
    return <span>{`${value}${suffix ?? ''}`}</span>;
  }
  // text
  return <span>{String(value)}</span>;
}
