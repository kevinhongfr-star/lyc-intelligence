import React from 'react';
import { Heart, X, Bookmark } from 'lucide-react';

interface InterestButtonProps {
  onInterest?: () => void;
  onPass?: () => void;
  onSave?: () => void;
}

export function InterestButton({ onInterest, onPass, onSave }: InterestButtonProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onInterest}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        <Heart className="w-4 h-4" />
        Express Interest
      </button>
      <button
        onClick={onPass}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-tertiary text-text-muted text-sm font-medium hover:bg-bg-hover transition-colors"
      >
        <X className="w-4 h-4" />
        Pass
      </button>
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-bg-primary text-text-primary text-sm font-medium border border-bg-tertiary hover:bg-bg-tertiary transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        Save for Later
      </button>
    </div>
  );
}
