/**
 * NexusCommandBar — Floating AI assistant bar at bottom of screen
 * Mockup v14 style: centered floating bar with input + send button
 * Phase 1 scope: UI shell only, mock responses
 */
import React, { useState, useRef } from 'react';
import { Send, X, Sparkles, Loader2 } from 'lucide-react';

interface NexusCommandBarProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Mock suggestions for Phase 1
const SUGGESTIONS = [
  'Summarize active mandates',
  'Show candidates at risk',
  'Check interview schedule',
  'Analyze pipeline velocity',
];

// Mock responses for Phase 1
const MOCK_RESPONSES: Record<string, string> = {
  'summarize': 'You have 24 active mandates. 3 are at risk (velocity < 2 candidates/week). Top mandate: VP Engineering at TechCorp - 12 candidates in pipeline.',
  'candidates': '8 candidates flagged as at-risk: 3 with no recent activity, 2 with stalled interviews, 3 approaching deadline without finalist.',
  'interview': '4 interviews scheduled this week. Next: John Smith (VP Engineering) tomorrow 2pm. 2 feedback pending from last week.',
  'pipeline': 'Pipeline velocity: 24 candidates in SWEEP, 18 in CANVA, 12 in GRID, 8 in LENS, 2 PLACED. Conversion rate: 8.3% to placement.',
  'default': 'I can help you analyze your pipeline, track mandate health, or schedule interviews. What would you like to know?',
};

export function NexusCommandBar({ isOpen, onToggle }: NexusCommandBarProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setShowSuggestions(false);

    // Phase 1: Mock response
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let mockResponse = MOCK_RESPONSES.default;
      for (const key of Object.keys(MOCK_RESPONSES)) {
        if (lowerInput.includes(key)) {
          mockResponse = MOCK_RESPONSES[key];
          break;
        }
      }
      setResponse(mockResponse);
      setLoading(false);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInput('');
    setResponse(null);
    setShowSuggestions(true);
  };

  if (!isOpen) {
    // Collapsed state: small floating button
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-fixed">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-3 bg-fuchsia text-white rounded-full shadow-lg hover:bg-fuchsia/90 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">NEXUS</span>
        </button>
      </div>
    );
  }

  // Expanded state: command bar with panel
  return (
    <>
      {/* Response panel above bar */}
      {(response || loading) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-card shadow-modal border border-border p-4 z-fixed">
          {loading ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </div>
          ) : (
            <div className="text-sm text-text-primary">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-fuchsia flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{response}</p>
                </div>
                <button onClick={handleClear} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestion dropdown */}
      {showSuggestions && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-card shadow-modal border border-border p-2 z-fixed">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-bg-warm rounded-md text-sm text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Command bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-fixed">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-lg border border-border px-4 py-2">
          <Sparkles className="w-5 h-5 text-fuchsia" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask NEXUS..."
            className="flex-1 text-sm text-text-primary placeholder:text-text-muted outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`p-2 rounded-full transition-colors ${
              input.trim() && !loading
                ? 'bg-fuchsia text-white hover:bg-fuchsia/90'
                : 'bg-bg-warm text-text-muted'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-bg-warm text-text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default NexusCommandBar;