import React, { useState } from 'react';
import { ArrowLeft, ThumbsUp, Star } from 'lucide-react';
import { ForumThread } from '@/mocks/advancedFeatures';

interface ThreadViewProps {
  thread: ForumThread;
  onBack: () => void;
}

function ThreadView({ thread, onBack }: ThreadViewProps) {
  const [replyText, setReplyText] = useState('');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        style={{ borderRadius: 0, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} />
        Back to threads
      </button>

      {/* Thread header */}
      <div className="bg-bg-secondary border border-bg-tertiary p-5" style={{ borderRadius: 0 }}>
        <h2 className="font-serif font-semibold text-xl text-text-primary">{thread.title}</h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium text-text-primary">{thread.author}</span>
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
          <span className="text-xs text-text-muted ml-auto">{thread.lastActivity}</span>
        </div>
        <p className="mt-4 text-sm text-text-primary leading-relaxed">{thread.content}</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <ThumbsUp style={{ width: 14, height: 14 }} />
            {thread.upvotes}
          </span>
          <span
            className="px-2 py-0.5 text-xs font-medium bg-bg-tertiary text-text-muted"
            style={{ borderRadius: 0 }}
          >
            {thread.category}
          </span>
        </div>
      </div>

      {/* Comments section */}
      <div>
        <h3 className="font-serif font-semibold text-base text-text-primary mb-3">
          Comments ({thread.comments.length})
        </h3>
        <div className="space-y-3">
          {thread.comments.map((comment, idx) => (
            <div
              key={idx}
              className="bg-bg-secondary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{comment.author}</span>
                <span className="text-xs text-text-muted">{comment.authorRole}</span>
                {comment.isExpert && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ borderRadius: 0, background: '#C108AB' }}
                  >
                    <Star style={{ width: 10, height: 10 }} />
                    Expert
                  </span>
                )}
                <span className="text-xs text-text-muted ml-auto">{comment.date}</span>
              </div>
              <p className="mt-2 text-sm text-text-primary leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                <ThumbsUp style={{ width: 12, height: 12 }} />
                {comment.upvotes}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply input */}
      <div className="bg-bg-secondary border border-bg-tertiary p-4" style={{ borderRadius: 0 }}>
        <h4 className="text-sm font-medium text-text-primary mb-2">Write a reply</h4>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full border border-bg-tertiary bg-bg-primary text-text-primary text-sm p-3 resize-none focus:outline-none"
          style={{ borderRadius: 0, minHeight: 80 }}
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            className="px-4 py-2 text-sm font-medium text-white"
            style={{ borderRadius: 0, background: '#C108AB', border: 'none', cursor: 'pointer' }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThreadView;
