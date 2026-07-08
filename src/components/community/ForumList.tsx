import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Star } from 'lucide-react';
import { MOCK_FORUM_THREADS, ForumThread } from '@/mocks/advancedFeatures';
import ThreadView from './ThreadView';

const CATEGORIES = ['All', 'Career Advice', 'Industry Trends', 'Leadership'] as const;

function ForumList() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);

  if (selectedThread) {
    return <ThreadView thread={selectedThread} onBack={() => setSelectedThread(null)} />;
  }

  const filtered = activeCategory === 'All'
    ? MOCK_FORUM_THREADS
    : MOCK_FORUM_THREADS.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex gap-1 border-b border-bg-tertiary">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderRadius: 0,
              borderBottom: activeCategory === cat ? '2px solid #C108AB' : '2px solid transparent',
              color: activeCategory === cat ? '#C108AB' : '#666666',
              background: 'none',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className="space-y-2">
        {filtered.map((thread) => (
          <button
            key={thread.id}
            onClick={() => setSelectedThread(thread)}
            className="w-full text-left bg-bg-secondary border border-bg-tertiary p-4 hover:bg-bg-tertiary transition-colors"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-semibold text-text-primary text-base truncate">
                  {thread.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-text-muted">{thread.author}</span>
                  <span className="text-xs text-text-muted">{thread.authorRole}</span>
                  {thread.isExpert && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ borderRadius: 0, background: '#C108AB' }}
                    >
                      <Star style={{ width: 10, height: 10 }} />
                      Expert
                    </span>
                  )}
                </div>
              </div>

              <span
                className="shrink-0 px-2 py-0.5 text-xs font-medium bg-bg-tertiary text-text-muted"
                style={{ borderRadius: 0 }}
              >
                {thread.category}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1">
                <MessageSquare style={{ width: 14, height: 14 }} />
                {thread.replies}
              </span>
              <span className="inline-flex items-center gap-1">
                <ThumbsUp style={{ width: 14, height: 14 }} />
                {thread.upvotes}
              </span>
              <span>{thread.lastActivity}</span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p className="text-text-muted text-sm py-8 text-center">
            No threads in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default ForumList;
