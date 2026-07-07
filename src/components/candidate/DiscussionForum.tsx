import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
  replies: number;
  status: string;
  snippet: string;
  author: string;
  timeAgo: string;
}

const MOCK_THREADS: Thread[] = [
  {
    id: '1',
    title: 'Negotiating equity in late-stage startups',
    replies: 15,
    status: 'Active',
    snippet: "What's your strategy for negotiating equity at Series D+ companies? I've got an offer but not sure if the 0.3% is competitive...",
    author: 'Senior Tech Leader',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    title: 'Managing cross-cultural teams in SEA',
    replies: 9,
    status: 'Active',
    snippet: '',
    author: '',
    timeAgo: '',
  },
];

const PREVIEW_THREAD = MOCK_THREADS[0];

export function DiscussionForum() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">DISCUSSION FORUM</h3>
      </div>

      <div>
        {MOCK_THREADS.map((thread, index) => (
          <div
            key={thread.id}
            className={`py-3 flex items-center justify-between ${
              index < MOCK_THREADS.length - 1 ? 'border-b border-bg-tertiary' : ''
            }`}
          >
            <div className="font-medium text-text-primary">{thread.title}</div>
            <div className="text-xs text-text-muted">
              {thread.replies} replies — {thread.status}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-bg-secondary border border-bg-tertiary">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-bg-tertiary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <div className="text-sm font-medium text-text-primary">{PREVIEW_THREAD.author}</div>
            <div className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {PREVIEW_THREAD.timeAgo}
            </div>
          </div>
        </div>
        <p className="text-sm text-text-secondary">{PREVIEW_THREAD.snippet}</p>
      </div>
    </div>
  );
}
