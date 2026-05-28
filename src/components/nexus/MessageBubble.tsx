import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

const customComponents = {
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', overflow: 'hidden' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th style={{ border: `1px solid ${DS.cardBorder}`, padding: '10px 14px', fontWeight: 700, color: '#E5E5E5', background: '#FFFFFF', fontSize: '12px', textAlign: 'left' }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td style={{ border: `1px solid ${DS.cardBorder}`, padding: '10px 14px', color: DS.textSecondary, fontSize: '13px' }}>
      {children}
    </td>
  ),
  tr: ({ children, index }: any) => (
    <tr style={{ background: index !== undefined && index % 2 === 0 ? '#111111' : '#0A0A0A' }}>
      {children}
    </tr>
  ),
  code: ({ inline, children, ...props }: any) => {
    if (inline) return <code style={{ background: '#FFFFFF', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: DS.accent, fontFamily: 'monospace' }} {...props}>{children}</code>;
    return (
      <pre style={{ background: '#FFFFFF', padding: '14px', borderRadius: '8px', overflowX: 'auto', margin: '8px 0', fontSize: '12px', color: DS.textSecondary, fontFamily: 'monospace', lineHeight: 1.5 }}>
        <code {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul style={{ paddingLeft: '22px', color: DS.textSecondary, fontSize: '13px', lineHeight: 1.7, margin: '4px 0' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ paddingLeft: '22px', color: DS.textSecondary, fontSize: '13px', lineHeight: 1.7, margin: '4px 0' }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ marginBottom: '2px' }}>{children}</li>,
  a: ({ href, children }: any) => <a href={href} style={{ color: DS.accent, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ margin: '6px 0', fontSize: '13px', lineHeight: 1.6, color: DS.textSecondary }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text, margin: '12px 0 4px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, margin: '10px 0 4px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '8px 0 4px' }}>{children}</h3>,
  h4: ({ children }: any) => <h4 style={{ fontFamily: DS.headingFont, fontSize: '14px', fontWeight: 600, color: DS.textSecondary, margin: '6px 0 2px' }}>{children}</h4>,
  strong: ({ children }: any) => <strong style={{ color: DS.text, fontWeight: 600 }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: DS.textSecondary }}>{children}</em>,
  blockquote: ({ children }: any) => (
    <blockquote style={{ borderLeft: `3px solid ${DS.accent}`, paddingLeft: '14px', margin: '8px 0', color: DS.muted, fontStyle: 'italic' }}>
      {children}
    </blockquote>
  ),
  hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${DS.border}`, margin: '12px 0' }} />,
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
