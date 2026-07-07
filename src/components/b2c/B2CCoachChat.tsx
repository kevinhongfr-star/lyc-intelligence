import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { DimensionBars, Dimension } from './DimensionBars';
import { QuickReplyChips } from './QuickReplyChips';
import { AssessmentCard } from './AssessmentCard';

interface ChatMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
}

const WELCOME_DIMENSIONS: Dimension[] = [
  { name: 'Pattern Recognition', score: 6.5, benchmark: 7.8 },
  { name: 'Scenario Planning', score: 7.0, benchmark: 7.5 },
  { name: 'Competitive Analysis', score: 8.2, benchmark: 8.0 },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'coach',
    content:
      "Welcome back. I'm DEX, your dimensional executive coach. Based on your last assessment, here's where you stand across three sub-dimensions of Strategic Depth.",
  },
];

interface B2CCoachChatProps {
  onSend?: (message: string) => void;
}

export function B2CCoachChat({ onSend }: B2CCoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    onSend?.(trimmed);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-bg-tertiary">
        <div className="w-7 h-7 bg-accent flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-serif text-sm font-bold text-text-primary">DEX Coach</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-teal" />
            <span className="text-xs text-text-muted">Online · Dimensional scoring active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-primary border border-bg-tertiary'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        <div className="bg-bg-secondary border border-bg-tertiary p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-text-muted">
              Strategic Depth · Sub-dimensions
            </span>
            <span className="text-xs text-text-secondary">vs benchmark</span>
          </div>
          <DimensionBars dimensions={WELCOME_DIMENSIONS} />
        </div>

        <AssessmentCard
          name="Strategic Depth Assessment"
          creditCost={3}
          questionCount={25}
          durationLabel="~20min"
        />
      </div>

      <div className="border-t border-bg-tertiary p-3 space-y-3 bg-bg-primary">
        <QuickReplyChips onSelect={handleSend} />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(input);
            }}
            placeholder="Ask DEX anything about your leadership profile..."
            className="flex-1 bg-bg-secondary border border-bg-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
            className="flex items-center justify-center w-9 h-9 bg-accent text-white hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
