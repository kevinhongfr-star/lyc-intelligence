import React from 'react';
import { ChevronLeft, MessageSquare, ThumbsUp } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { ForumThread } from '@/mocks/advancedFeatures';

interface CandidateThreadViewProps {
  thread: ForumThread;
  onBack: () => void;
}

export default function CandidateThreadView({ thread, onBack }: CandidateThreadViewProps) {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back to Forums
      </Button>

      {/* Thread header */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-3">
          {thread.title}
        </h2>
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span className="font-medium text-text-primary">{thread.author}</span>
          <Badge variant="default">{thread.authorRole}</Badge>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {thread.replies} replies
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {thread.upvotes}
          </span>
        </div>
      </div>

      {/* Original post */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm"
            style={{ borderRadius: 0 }}
          >
            {thread.author.charAt(0)}
          </div>
          <div>
            <span className="font-medium text-text-primary text-sm">{thread.author}</span>
            <span className="text-text-muted text-sm ml-2">{thread.authorRole}</span>
          </div>
        </div>
        <p className="text-text-primary leading-relaxed">{thread.content}</p>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold text-text-primary">
          Comments ({thread.comments.length})
        </h3>
        {thread.comments.map((comment, idx) => (
          <div
            key={idx}
            className="bg-bg-primary border border-bg-tertiary p-5"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-7 h-7 bg-bg-tertiary flex items-center justify-center text-text-secondary font-semibold text-xs"
                style={{ borderRadius: 0 }}
              >
                {comment.author.charAt(0)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary text-sm">{comment.author}</span>
                <Badge variant="default">{comment.authorRole}</Badge>
              </div>
            </div>
            <p className="text-text-primary text-sm leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {comment.upvotes}
              </span>
              <span>{comment.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
