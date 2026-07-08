/**
 * VerdictLabel — Candidate verdict indicator
 * Mockup v14: hire=green, watch=amber, pass=red
 */
import React from 'react';

type Verdict = 'hire' | 'watch' | 'pass';

interface VerdictLabelProps {
  verdict: Verdict;
}

const VERDICT_STYLES: Record<Verdict, { bg: string; text: string; label: string }> = {
  hire: { bg: 'bg-green/10', text: 'text-green', label: 'Hire' },
  watch: { bg: 'bg-amber/10', text: 'text-amber', label: 'Watch' },
  pass: { bg: 'bg-red/10', text: 'text-red', label: 'Pass' },
};

export function VerdictLabel({ verdict }: VerdictLabelProps) {
  const style = VERDICT_STYLES[verdict];
  return (
    <span className={`${style.bg} ${style.text} px-3 py-1 rounded-full text-xs font-semibold`}>
      {style.label}
    </span>
  );
}

export default VerdictLabel;
