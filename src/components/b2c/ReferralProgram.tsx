import React from 'react';
import { Gift, Share2 } from 'lucide-react';

interface ReferralProgramProps {
  referrals?: number;
  successful?: number;
  earned?: string;
}

export function ReferralProgram({
  referrals = 3,
  successful = 1,
  earned = '$2,500',
}: ReferralProgramProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            REFERRAL PROGRAM
          </h3>
        </div>
        <p className="text-xs text-text-muted">
          Earn rewards for referring colleagues
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-bg-secondary border border-bg-tertiary">
          <div className="font-serif text-xl font-bold text-text-primary">
            {referrals}
          </div>
          <div className="text-xs text-text-muted mt-0.5">Your referrals</div>
        </div>
        <div className="text-center p-3 bg-bg-secondary border border-bg-tertiary">
          <div className="font-serif text-xl font-bold text-text-primary">
            {successful}
          </div>
          <div className="text-xs text-text-muted mt-0.5">Successful</div>
        </div>
        <div className="text-center p-3 bg-bg-secondary border border-bg-tertiary">
          <div className="font-serif text-xl font-bold text-accent">{earned}</div>
          <div className="text-xs text-text-muted mt-0.5">Earned</div>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4 leading-relaxed">
        Earn $2,500 for every successful placement. Refer as many colleagues as
        you'd like — no limits.
      </p>

      <button className="w-full flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors">
        <Share2 className="w-4 h-4" />
        Refer a Colleague
      </button>
    </div>
  );
}
