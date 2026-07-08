import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { MOCK_PEER_CONNECTIONS } from '@/mocks/advancedFeatures';

const INDUSTRIES = ['All', ...Array.from(new Set(MOCK_PEER_CONNECTIONS.map((p) => p.industry)))];

function PeerConnections() {
  const [activeIndustry, setActiveIndustry] = useState<string>('All');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const filtered = activeIndustry === 'All'
    ? MOCK_PEER_CONNECTIONS
    : MOCK_PEER_CONNECTIONS.filter((p) => p.industry === activeIndustry);

  const toggleConnect = (id: string) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Industry filter */}
      <div className="flex gap-1 border-b border-bg-tertiary">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            onClick={() => setActiveIndustry(ind)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderRadius: 0,
              borderBottom: activeIndustry === ind ? '2px solid #C108AB' : '2px solid transparent',
              color: activeIndustry === ind ? '#C108AB' : '#666666',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Peer cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((peer) => {
          const isPending = pendingIds.has(peer.id);
          return (
            <div
              key={peer.id}
              className="bg-bg-secondary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar dot */}
                <span
                  className="shrink-0 w-10 h-10 flex items-center justify-center text-white text-sm font-semibold"
                  style={{ borderRadius: 0, background: peer.avatarColor }}
                >
                  {peer.name.charAt(0)}
                </span>

                <div className="flex-1 min-w-0">
                  <h4 className="font-serif font-semibold text-sm text-text-primary">{peer.name}</h4>
                  <p className="text-xs text-text-muted">
                    {peer.title}, {peer.company}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{peer.industry}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Users style={{ width: 12, height: 12, color: '#C108AB' }} />
                    <span className="text-xs text-text-muted">{peer.matchReason}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleConnect(peer.id)}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium"
                  style={{
                    borderRadius: 0,
                    background: isPending ? '#E5E5E5' : '#C108AB',
                    color: isPending ? '#666666' : '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isPending ? 'Pending' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm py-8 text-center">
          No peers in this industry.
        </p>
      )}
    </div>
  );
}

export default PeerConnections;
