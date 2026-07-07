import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';

export interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface ChatHistoryPanelProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
}

export function ChatHistoryPanel({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: ChatHistoryPanelProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-sm font-bold text-text-primary">History</h3>
        </div>
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.map((convo) => {
          const isActive = convo.id === activeId;
          return (
            <button
              key={convo.id}
              onClick={() => onSelect?.(convo.id)}
              className={`w-full text-left px-4 py-3 border-b border-bg-tertiary transition-colors ${
                isActive
                  ? 'bg-accent-10 text-accent'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium leading-snug truncate">{convo.title}</span>
                {isActive && <span className="w-1.5 h-1.5 bg-accent mt-1.5 shrink-0" />}
              </div>
              <span className="text-xs text-text-muted">{convo.date}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
