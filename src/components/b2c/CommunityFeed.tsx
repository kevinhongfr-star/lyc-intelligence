import React from 'react';
import { MessageSquare, Clock } from 'lucide-react';

export interface Thread {
  id: string;
  title: string;
  replyCount: number;
  lastActivity: string;
}

interface CommunityFeedProps {
  threads?: Thread[];
}

const DEFAULT_THREADS: Thread[] = [
  {
    id: '1',
    title: 'Navigating board relationships as new CTO',
    replyCount: 12,
    lastActivity: '2h ago',
  },
  {
    id: '2',
    title: 'Cross-border move: Singapore → Shanghai tips',
    replyCount: 8,
    lastActivity: '5h ago',
  },
  {
    id: '3',
    title: 'Best exec education programs 2026?',
    replyCount: 5,
    lastActivity: '1d ago',
  },
];

export function CommunityFeed({ threads = DEFAULT_THREADS }: CommunityFeedProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">
            FORUM: Latest Discussions
          </h3>
        </div>
        <button className="text-accent text-sm font-medium hover:underline">
          Start New Thread
        </button>
      </div>
      <div className="divide-y divide-bg-tertiary">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium hover:text-accent cursor-pointer truncate">
                {thread.title}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">{thread.replyCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">{thread.lastActivity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
