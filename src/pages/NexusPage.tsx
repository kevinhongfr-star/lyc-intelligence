import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuth } from '@/contexts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message { role: 'user' | 'assistant'; content: string; }

const customComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse border border-gray-700 rounded-none overflow-hidden">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-gray-600 bg-gray-800 px-4 py-3 font-bold text-gray-200 text-left">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-gray-600 px-4 py-3 text-gray-300">
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr className="even:bg-gray-900 odd:bg-gray-800">
      {children}
    </tr>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code className="bg-gray-800 rounded px-1.5 py-0.5 text-xs text-accent" {...props}>{children}</code>;
    return (
      <pre className="bg-gray-900 rounded-none p-3 overflow-x-auto my-2 text-xs">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-1 text-gray-300 my-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 space-y-1 text-gray-300 my-2">{children}</ol>,
  li: ({ children }: any) => <li className="text-gray-300">{children}</li>,
  a: ({ href, children }: any) => <a href={href} className="text-accent underline hover:text-purple-400" target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p className="text-gray-300 mb-2 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-lg font-bold text-white mb-2 mt-3">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-base font-bold text-white mb-2 mt-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold text-white mb-1 mt-2">{children}</h3>,
  strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-gray-300">{children}</em>,
};

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
          <p className="text-text-muted text-sm">Your LYC Intelligence assistant — ask about cross-border leadership, career strategy, and executive positioning</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text-primary bg-bg-tertiary rounded-none min-h-[44px]">
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-bg-secondary rounded-none border border-bg-tertiary p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-text-muted text-center py-12">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium mb-2">Nexus is ready</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto text-sm">
              {['How do I position for a cross-border role?', 'What makes a strong leadership profile?', 'What do boards look for in C-suite candidates?', 'How should I prepare for a board interview?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="p-2 bg-bg-tertiary rounded-none hover:bg-bg-hover text-text-secondary text-left transition-colors">{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-none px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-primary'}`}>
              {m.role === 'assistant' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={customComponents}
                >
                  {m.content}
                </ReactMarkdown>
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-tertiary rounded-none px-4 py-3 flex items-center gap-2">
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
          placeholder="Ask Nexus about career positioning, cross-border leadership..."
          className="flex-1 px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent min-h-[44px]"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-accent hover:bg-accent-light text-white rounded-none min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
