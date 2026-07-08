/**
 * NexusCommandBar — Floating AI assistant bar at bottom of screen
 * Mockup v14 style: centered floating bar with input + send button
 * EO-8: Wired to DeepSeek via /api/nexus/chat serverless endpoint
 */
import React, { useState, useRef } from 'react';
import { Send, X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { sendNexusCommand } from '@/services/nexusCommandService';

interface NexusCommandBarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SUGGESTIONS = [
  'Summarize active mandates',
  'Show candidates at risk',
  'Check interview schedule',
  'Analyze pipeline velocity',
];

export function NexusCommandBar({ isOpen, onToggle }: NexusCommandBarProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    setResponse(null);

    try {
      const result = await sendNexusCommand(input.trim());
      setResponse(result.response || 'No response received. Please try again.');
    } catch (err: any) {
      console.error('[NexusCommandBar] Error:', err);
      setError(err.message || 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInput('');
    setResponse(null);
    setError(null);
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
      {(response || loading || error) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-card shadow-modal border border-border p-4 z-fixed">
          {loading ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">NEXUS is analyzing...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                </div>
                <button onClick={handleClear} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-text-primary">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-fuchsia flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{response}</p>
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