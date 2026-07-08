import React, { useState } from 'react';
import { MessageSquare, ChevronRight, Clock, ThumbsUp } from 'lucide-react';
import { MOCK_FORUM_THREADS, type ForumThread } from '@/mocks/advancedFeatures';
import { Badge } from '@/components/ui';
import { CandidateThreadView } from './CandidateThreadView';

const CANDIDATE_CATEGORIES = ['All', 'Job Search', 'Interview Tips', 'Industry Q&A'];

const categoryMap: Record<string, string> = {
  'Career Advice': 'Interview Tips',
  'Industry Trends': 'Industry Q&A',
  'Leadership': 'Job Search',
};

function mapThreadCategory(thread: ForumThread): string {
  return categoryMap[thread.category] || 'Industry Q&A';
}

export default function CandidateForumList() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);

  const filteredThreads =
    activeCategory === 'All'
      ? MOCK_FORUM_THREADS
      : MOCK_FORUM_THREADS.filter((t) => mapThreadCategory(t) === activeCategory);

  if (selectedThread) {
    return (
      <CandidateThreadView
        thread={selectedThread}
        onBack={() => setSelectedThread(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary pb-3">
        {CANDIDATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-accent text-white'
                : 'text-text-muted hover:bg-bg-tertiary'
            }`}
            style={{ borderRadius: 0 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className="space-y-2">
        {filteredThreads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => setSelectedThread(thread)}
            className="w-full text-left bg-bg-primary border border-bg-tertiary p-4 hover:bg-bg-secondary transition-colors"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                    {mapThreadCategory(thread)}
                  </Badge>
                </div>
                <h4 className="font-serif font-semibold text-text-primary truncate">
                  {thread.title}
                </h4>
                <p className="text-sm text-text-muted mt-1 line-clamp-2">
                  {thread.content}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                  <span>{thread.author}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {thread.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {thread.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {thread.lastActivity}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}

        {filteredThreads.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            No threads found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
