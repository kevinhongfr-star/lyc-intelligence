/**
 * EmailGate Component (T-113)
 * Email gate for unlocking full diagnostic reports.
 * Free tier: archetype name + teaser → Gate → Full report (radar chart + modifiers)
 */

import React, { useState } from 'react';
import { InstrumentId } from '@/types/assessment';
import { INSTRUMENT_COLORS, InstrumentColorKey } from '@/data/instrumentColors';

interface EmailGateProps {
  instrument: InstrumentId;
  archetypeName: string;
  onUnlock: (email: string) => void;
  isUnlocked?: boolean;
  children?: React.ReactNode; // Full report content
  className?: string;
}

export const EmailGate: React.FC<EmailGateProps> = ({
  instrument,
  archetypeName,
  onUnlock,
  isUnlocked = false,
  children,
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colors = INSTRUMENT_COLORS[instrument] ?? INSTRUMENT_COLORS.shift;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      onUnlock(email);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUnlocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`rounded-2xl border-2 p-8 text-center ${className}`} style={{ borderColor: colors.main, backgroundColor: colors.light }}>
      <div className="mb-4 text-4xl">🔓</div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">
        Unlock Your Full {instrument.toUpperCase()} Report
      </h3>
      <p className="mb-4 text-gray-600">
        You are <strong style={{ color: colors.main }}>{archetypeName}</strong>. 
        Enter your email to receive your complete analysis with dimension breakdown, modifiers, and development priorities.
      </p>
      
      <form onSubmit={handleSubmit} className="mx-auto max-w-md">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: colors.main }}
          >
            {isSubmitting ? 'Sending...' : 'Unlock Report'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">No spam. Unsubscribe anytime.</p>
      </form>

      {/* Teaser of what's behind the gate */}
      <div className="mt-6 grid grid-cols-1 gap-3 text-left text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-white/60 p-3">
          <span className="font-medium text-gray-900">📊 Dimension Radar</span>
          <p className="mt-1 text-xs text-gray-600">Visual breakdown of your scores</p>
        </div>
        <div className="rounded-lg bg-white/60 p-3">
          <span className="font-medium text-gray-900">⚡ Modifiers</span>
          <p className="mt-1 text-xs text-gray-600">Contextual factors affecting your result</p>
        </div>
        <div className="rounded-lg bg-white/60 p-3">
          <span className="font-medium text-gray-900">🎯 Development Plan</span>
          <p className="mt-1 text-xs text-gray-600">Priorities for your growth</p>
        </div>
      </div>
    </div>
  );
};

export default EmailGate;
