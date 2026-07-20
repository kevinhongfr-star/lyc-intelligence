/**
 * SoftCTA Block Component (T-601)
 * Universal soft CTA block used on every page.
 * Links to: Quick Diagnostic | Nexus Advisory | Exec Search | Council | Roundtable
 */

import React from 'react';

interface SoftCTABlockProps {
  instrumentColor?: string;
  className?: string;
}

const CTAS = [
  { label: 'Quick Diagnostic', href: '/platform', description: 'Free 5-minute assessment', icon: '🎯' },
  { label: 'Nexus Advisory', href: '/advisory', description: 'Strategic leadership advisory', icon: '🧭' },
  { label: 'Executive Search', href: '/b2b', description: 'Find your next transformational leader', icon: '🔍' },
  { label: 'The Invitation Council', href: '/council', description: 'Peer network for APAC leaders', icon: '🏛️' },
  { label: 'Executive Roundtable', href: '/roundtable', description: 'Monthly deep-dive sessions', icon: '💎' },
];

export const SoftCTABlock: React.FC<SoftCTABlockProps> = ({ instrumentColor = '#475569', className = '' }) => {
  return (
    <section className={`rounded-2xl bg-gray-50 p-8 ${className}`}>
      <h3 className="mb-2 text-center text-xl font-semibold text-gray-900">Continue Your Journey</h3>
      <p className="mb-6 text-center text-sm text-gray-600">Explore how LYC Intelligence can support your next chapter</p>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CTAS.map(cta => (
          <a
            key={cta.label}
            href={cta.href}
            className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:border-gray-300 hover:shadow-md"
          >
            <span className="mb-2 text-2xl">{cta.icon}</span>
            <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">{cta.label}</span>
            <span className="mt-1 text-xs text-gray-500">{cta.description}</span>
          </a>
        ))}
      </div>
    </section>
  );
};

export default SoftCTABlock;
