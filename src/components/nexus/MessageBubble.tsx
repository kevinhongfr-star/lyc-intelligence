import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px'
};

const customComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse border border-gray-700 rounded-lg overflow-hidden">
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
    if (inline) return <code className="bg-gray-800 rounded px-1.5 py-0.5 text-sm text-accent" {...props}>{children}</code>;
    return (
      <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto my-3">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-1 text-gray-300 my-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 space-y-1 text-gray-300 my-2">{children}</ol>,
  li: ({ children }: any) => <li className="text-gray-300">{children}</li>,
  a: ({ href, children }: any) => <a href={href} className="text-accent underline hover:text-purple-400" target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p className="text-gray-300 mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold text-white mb-3 mt-4">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold text-white mb-2 mt-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold text-white mb-2 mt-2">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-sm font-semibold text-gray-200 mb-1 mt-2">{children}</h4>,
  strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-gray-300">{children}</em>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-accent pl-4 my-3 italic text-gray-400">
      {children}
    </blockquote>
  ),
};

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div style={{ alignSelf: role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
      <div style={{
        padding: '12px 16px',
        borderRadius: role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: role === 'user' ? DS.accent : DS.card,
        border: role === 'user' ? 'none' : `1px solid ${DS.border}`,
        color: role === 'user' ? '#FFF' : DS.textSecondary,
        fontSize: '14px',
        lineHeight: 1.6
      }}>
        {role === 'user' ? (
          content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
