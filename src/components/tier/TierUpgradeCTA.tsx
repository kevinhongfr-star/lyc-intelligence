/**
 * components/tier/TierUpgradeCTA.tsx — #94/#1344 Upgrade CTA
 *
 * Drop-in component for gating points. Reads the same verdict shape
 * produced by useAssessmentAccess(). Renders differently based on tier
 * shortfall and billing_enabled feature flag.
 *
 * Place it anywhere the viewer hits a capability boundary, e.g.:
 *   • above the "Export PDF" button (EI → Professional)
 *   • above NEXUS chat entry
 *   • locked-dimension boundary (shown dim 3, hide dims 4–6)
 *   • on share-by-email prompts that require Professional
 */

import React from 'react';
import type { AssessmentAccessVerdict } from '@/hooks/useAssessmentAccess';
import { TIER_META } from '@/config/tierConfig';
import { cn } from '@/lib/utils';

export type TierCtaContext =
  | 'pdf_export'
  | 'nexus_discuss'
  | 'full_dimensions'
  | 'ai_insights'
  | 'share_result'
  | 'assessment_run';

export interface TierUpgradeCTAProps {
  verdict: AssessmentAccessVerdict;
  /** Which surface is being gated — controls copy + icon. */
  context: TierCtaContext;
  /** Override heading. */
  heading?: string;
  /** Override body copy. */
  description?: string;
  /** billing_enabled feature flag — #45 keys unavailable → hide "Buy" CTA. */
  billingEnabled?: boolean;
  /** Optional handler invoked on "Upgrade" button click. */
  onUpgrade?: () => void;
  /** Optional handler invoked on "Learn more" link. */
  onLearnMore?: () => void;
  className?: string;
}

const COPY_BY_CONTEXT: Record<TierCtaContext, { heading: string; description: string }> = {
  pdf_export: {
    heading: 'Export this report as a branded PDF',
    description:
      'Upgrade to Professional to download a fully branded, print-optimised PDF of your assessment result.',
  },
  nexus_discuss: {
    heading: 'Discuss your result with NEXUS',
    description:
      'Upgrade for one-on-one coaching conversations with NEXUS. Get role-played scenarios, development plans, and weekly check-ins tailored to your profile.',
  },
  full_dimensions: {
    heading: 'Unlock all 6 dimensions',
    description:
      'Your Executive Introduction shows 3 of 6 dimensions plus a truncated AI summary. Upgrade to Professional to see your complete profile.',
  },
  ai_insights: {
    heading: 'Unlock complete AI insights',
    description:
      'Your Executive Introduction summary shows strengths only. Upgrade for growth areas, prioritised next steps, and full dimension-level AI commentary.',
  },
  share_result: {
    heading: 'Share this report with stakeholders',
    description:
      'Upgrade to share branded PDFs or view-only share links that colleagues can open in their browser.',
  },
  assessment_run: {
    heading: 'Complete the full assessment',
    description:
      'The Executive Introduction preview shows a subset of the diagnostic. Upgrade for the complete 45–60 minute assessment experience.',
  },
};

export const TierUpgradeCTA: React.FC<TierUpgradeCTAProps> = ({
  verdict,
  context,
  heading,
  description,
  billingEnabled = false,
  onUpgrade,
  onLearnMore,
  className,
}) => {
  // No shortfall → render nothing.
  if (!verdict.upgradeTier || !verdict.upgradeDisplayTier) {
    if (verdict.isAdmin) return null;
    return null;
  }

  const copy = COPY_BY_CONTEXT[context];
  const title = heading ?? copy.heading;
  const body = description ?? copy.description;
  const accent = verdict.viewerTier === 'executive_introduction' ? '#C108AB' : '#1E40AF';

  return (
    <aside
      className={cn(
        'relative p-6 border w-full',
        className,
      )}
      style={{
        borderTop: `4px solid ${accent}`,
        background: `linear-gradient(180deg, rgba(193,8,171,0.03) 0%, #FFFFFF 100%)`,
        borderColor: '#E5E7EB',
        borderRadius: 0,
      }}
      data-gated-context={context}
      aria-label={`Upgrade required to access ${context}`}
    >
      <p
        className="mb-1 text-[11px] font-mono tracking-[0.2em]"
        style={{ color: accent }}
      >
        {verdict.viewerTier === 'executive_introduction'
          ? 'EXECUTIVE INTRODUCTION — UPGRADE'
          : `UPGRADE TO ${verdict.upgradeDisplayTier.toUpperCase()}`}
      </p>
      <h3
        className="m-0"
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: 22,
          lineHeight: 1.2,
          color: '#0B0B0B',
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <p
        className="mt-3 m-0"
        style={{
          fontFamily: "'DM Sans', Arial, sans-serif",
          fontSize: 14,
          lineHeight: 1.55,
          color: '#44403C',
          maxWidth: 620,
        }}
      >
        {body}
      </p>

      <ul className="mt-5 list-none p-0 m-0 flex flex-wrap gap-2">
        {featureHighlights(verdict.upgradeTier, context).map((h) => (
          <li
            key={h}
            className="text-xs font-mono px-3 py-1.5 border"
            style={{
              borderColor: '#E5E7EB',
              background: '#FFFFFF',
              color: '#1C1917',
              borderRadius: 0,
            }}
          >
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-3 flex-wrap items-center">
        {billingEnabled ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="px-5 py-2.5 font-semibold text-sm text-white"
            style={{ background: accent, borderRadius: 0 }}
          >
            Upgrade to {verdict.upgradeDisplayTier}
          </button>
        ) : (
          <span
            aria-hidden="false"
            className="inline-flex items-center px-5 py-2.5 font-semibold text-sm text-white"
            style={{ background: accent, borderRadius: 0 }}
          >
            Upgrade to {verdict.upgradeDisplayTier} — Contact LYC Partners
          </span>
        )}
        {billingEnabled && onLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            className="px-5 py-2.5 font-semibold text-sm border text-stone-800 bg-white border-stone-300"
            style={{ borderRadius: 0 }}
          >
            Learn more
          </button>
        ) : null}
        <span className="font-mono text-[11px] text-stone-500">
          Currently: {TIER_META[verdict.viewerTier].displayName}
        </span>
      </div>
    </aside>
  );
};

function featureHighlights(upgradeTier: string, ctx: TierCtaContext): string[] {
  const base: Record<TierCtaContext, string[]> = {
    pdf_export:   ['Branded PDF export'],
    nexus_discuss:['NEXUS coaching', 'Development plans'],
    full_dimensions: ['All 6 dimensions'],
    ai_insights:  ['Full AI insights', 'Growth areas + next steps'],
    share_result: ['View-only share links', 'Email share'],
    assessment_run:['Full 45–60 min assessment', 'Full dimension profile'],
  };
  const extras =
    upgradeTier === 'professional'
      ? ['Branded PDF export', '6-dimension results']
      : upgradeTier === 'executive'
        ? ['Advanced NEXUS', 'Priority support']
        : upgradeTier === 'council'
          ? ['Council network']
          : [];
  return Array.from(new Set([...(base[ctx] ?? []), ...extras])).slice(0, 4);
}

export default TierUpgradeCTA;
