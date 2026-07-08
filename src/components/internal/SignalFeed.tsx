import React, { useState } from 'react';
import { Radio, Filter } from 'lucide-react';
import { MOCK_SIGNALS } from '@/mocks/internalPortal';

const sourceColors: Record<string, string> = {
  LinkedIn: 'bg-blue-500/15 text-blue-700',
  News: 'bg-green-500/15 text-green-700',
  'Web Scraper': 'bg-purple-500/15 text-purple-700',
  CRM: 'bg-amber-500/15 text-amber-700',
};

const typeColors: Record<string, string> = {
  role_change: 'bg-[#C108AB]/15 text-[#C108AB]',
  funding: 'bg-green-500/15 text-green-700',
  hiring_signal: 'bg-amber-500/15 text-amber-700',
  engagement: 'bg-blue-500/15 text-blue-700',
};

const typeLabels: Record<string, string> = {
  role_change: 'Role Change',
  funding: 'Funding',
  hiring_signal: 'Hiring Signal',
  engagement: 'Engagement',
};

export default function SignalFeed() {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const sources = Array.from(new Set(MOCK_SIGNALS.map(s => s.source)));
  const types = Array.from(new Set(MOCK_SIGNALS.map(s => s.type)));

  const filtered = MOCK_SIGNALS.filter(s => {
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Sources</option>
          {sources.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{typeLabels[t] || t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(signal => (
          <div
            key={signal.id}
            className="border border-bg-tertiary bg-bg-primary p-4"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Radio className="w-3 h-3 text-[#C108AB] animate-pulse" />
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${sourceColors[signal.source] || 'bg-bg-tertiary text-text-muted'}`}>
                    {signal.source}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${typeColors[signal.type] || 'bg-bg-tertiary text-text-muted'}`}>
                    {typeLabels[signal.type] || signal.type}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-sm text-text-primary">{signal.entity}</span>
                  <p className="text-sm text-text-secondary mt-0.5">{signal.detail}</p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-medium text-text-primary">{signal.confidence}%</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">Confidence</div>
              </div>
            </div>
            <div className="text-xs text-text-muted mt-2">{signal.timestamp}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">No signals matching this filter.</p>
      )}
    </div>
  );
}
