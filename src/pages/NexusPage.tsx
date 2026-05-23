import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuth } from '@/contexts';

interface Message { role: 'user' | 'assistant'; content: string; }

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-bg-primary rounded p-3 my-2 overflow-x-auto text-xs"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-bg-primary px-1.5 py-0.5 rounded text-accent text-xs">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-text-primary mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-text-primary mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-text-primary mt-3 mb-1">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-text-secondary">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-text-secondary">$1</li>')
    .replace(/\n/g, '<br/>');
  return html;
}

export function NexusPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const response = await sendChatMessage(userMsg, user?.id || 'anonymous', messages.slice(-10));
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Nexus</h1>
          <p className="text-text-muted text-sm">Your LYC Intelligence assistant — ask about mandates, candidates, TRIDENT scores, pipeline health</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text-primary bg-bg-tertiary rounded-lg min-h-[44px]">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-bg-secondary rounded-lg border border-bg-tertiary p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-text-muted text-center py-12">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-2">Nexus is ready</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-sm">
              {['What is TRIDENT scoring?', 'Show PHI health overview', 'Explain pipeline stages', 'How does Proximity work?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="p-2 bg-bg-tertiary rounded-lg hover:bg-bg-hover text-text-secondary text-left transition-colors">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-primary'}`}>
              {m.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-tertiary rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-sm text-text-muted">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask Nexus anything about your pipeline..."
          className="flex-1 px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent min-h-[44px]"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-accent hover:bg-accent-light text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
