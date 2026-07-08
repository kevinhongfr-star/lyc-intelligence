import React, { useState } from 'react';
import { Copy, Award } from 'lucide-react';
import { MOCK_REFERRAL_STATS } from '@/mocks/advancedFeatures';

const REFERRAL_LINK = 'https://lyc.partners/ref/YOUR_CODE';

const MOCK_RECENT_REFERRALS = [
  { id: 'r1', name: 'Alex Johnson', date: '2026-01-20', status: 'successful' as const },
  { id: 'r2', name: 'Morgan Lee', date: '2026-01-18', status: 'pending' as const },
  { id: 'r3', name: 'Casey Rivera', date: '2026-01-15', status: 'pending' as const },
];

const STAT_CARDS = [
  { label: 'Total Referrals', value: MOCK_REFERRAL_STATS.totalReferrals },
  { label: 'Successful', value: MOCK_REFERRAL_STATS.successfulReferrals },
  { label: 'Credits Earned', value: MOCK_REFERRAL_STATS.creditsEarned },
  { label: 'Leaderboard Rank', value: `#${MOCK_REFERRAL_STATS.leaderboardRank}` },
];

function ReferralTracker() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_LINK).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CARDS.map((stat) => (
          <div
            key={stat.label}
            className="bg-bg-secondary border border-bg-tertiary p-4 text-center"
            style={{ borderRadius: 0 }}
          >
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-bg-secondary border border-bg-tertiary p-4" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Award style={{ width: 16, height: 16, color: '#C108AB' }} />
          <h4 className="text-sm font-medium text-text-primary">Your Referral Link</h4>
        </div>
        <div className="flex items-stretch gap-0">
          <input
            readOnly
            value={REFERRAL_LINK}
            className="flex-1 border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-2"
            style={{ borderRadius: 0 }}
          />
          <button
            onClick={handleCopy}
            className="px-4 text-sm font-medium text-white inline-flex items-center gap-1.5"
            style={{
              borderRadius: 0,
              background: '#C108AB',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Copy style={{ width: 14, height: 14 }} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Recent referrals */}
      <div>
        <h4 className="text-sm font-medium text-text-primary mb-2">Recent Referrals</h4>
        <div className="space-y-2">
          {MOCK_RECENT_REFERRALS.map((ref) => (
            <div
              key={ref.id}
              className="bg-bg-secondary border border-bg-tertiary px-4 py-3 flex items-center justify-between"
              style={{ borderRadius: 0 }}
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{ref.name}</p>
                <p className="text-xs text-text-muted">{ref.date}</p>
              </div>
              <span
                className="px-2 py-0.5 text-xs font-medium"
                style={{
                  borderRadius: 0,
                  background: ref.status === 'successful' ? '#16A34A15' : '#D9770600',
                  color: ref.status === 'successful' ? '#16A34A' : '#D97706',
                  border: ref.status === 'successful' ? '1px solid #16A34A30' : '1px solid #D9770630',
                }}
              >
                {ref.status === 'successful' ? 'Successful' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReferralTracker;
