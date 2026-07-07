import React from 'react';
import { Send, Plus, CheckCircle2, Clock } from 'lucide-react';

type ReferralStatus = 'pending' | 'connected';

interface ReferralRequest {
  id: string;
  text: string;
  status: ReferralStatus;
}

const MOCK_REFERRALS: ReferralRequest[] = [
  { id: '1', text: 'Seeking intro to CTO at NeoBank', status: 'pending' },
  { id: '2', text: 'Seeking intro to VP Eng at Grab', status: 'connected' },
];

export function ReferralRequests() {
  const getStatusStyle = (status: ReferralStatus): React.CSSProperties => {
    if (status === 'pending') {
      return { backgroundColor: 'rgba(245,158,11,0.1)' };
    }
    return { backgroundColor: 'rgba(0,137,123,0.1)' };
  };

  const getStatusIcon = (status: ReferralStatus) => {
    if (status === 'pending') {
      return <Clock className="w-3 h-3" />;
    }
    return <CheckCircle2 className="w-3 h-3" />;
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-accent" />
            <h3 className="font-serif text-lg font-bold text-text-primary">REFERRAL REQUESTS</h3>
          </div>
          <p className="text-sm text-text-muted mt-1">Warm intros through your network</p>
        </div>
        <button className="text-accent text-sm flex items-center gap-1 border border-accent px-3 py-1 hover:bg-accent hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      <div className="border-b border-bg-tertiary">
        {MOCK_REFERRALS.map((referral, index) => (
          <div
            key={referral.id}
            className={`py-3 flex items-center justify-between ${
              index < MOCK_REFERRALS.length - 1 ? 'border-b border-bg-tertiary' : ''
            }`}
          >
            <div className="font-medium text-text-primary">{referral.text}</div>
            <span
              className={`text-xs px-2 py-0.5 flex items-center gap-1 ${
                referral.status === 'pending' ? 'text-warning' : 'text-teal'
              }`}
              style={getStatusStyle(referral.status)}
            >
              {getStatusIcon(referral.status)}
              {referral.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
