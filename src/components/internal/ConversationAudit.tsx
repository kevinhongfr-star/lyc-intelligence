import React, { useState } from 'react';
import { MessageCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { MOCK_CONVERSATION_AUDIT } from '@/mocks/internalPortal';

const PORTAL_COLORS: Record<string, { bg: string; text: string }> = {
  b2b_client: { bg: '#3b82f620', text: '#2563eb' },
  b2c_leader: { bg: '#C108AB15', text: '#C108AB' },
  candidate: { bg: '#22c55e15', text: '#16a34a' },
  admin: { bg: '#f59e0b15', text: '#b45309' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: '#22c55e15', text: '#16a34a' },
  completed: { bg: '#9ca3af15', text: '#6b7280' },
};

const MOCK_MESSAGES: Record<string, Array<{ sender: string; text: string }>> = {
  ca1: [
    { sender: 'user', text: 'What are the key considerations for transitioning from a CTO role to a board advisory position?' },
    { sender: 'bot', text: 'Key considerations include: 1) Building a governance track record, 2) Expanding your network to include board placement specialists, 3) Developing financial literacy beyond technical domains...' },
    { sender: 'user', text: 'How should I position my technical background as an advantage?' },
    { sender: 'bot', text: 'Your technical expertise is increasingly valuable at the board level. Frame it as "digital transformation governance" experience rather than purely operational...' },
  ],
  ca2: [
    { sender: 'user', text: 'Help me prepare for a VP of Engineering interview at a Series B startup.' },
    { sender: 'bot', text: 'Let me structure a preparation framework. For VP-level interviews at growth-stage companies, focus on: scaling teams, technical strategy, and cross-functional leadership...' },
    { sender: 'user', text: 'What questions should I expect about team scaling?' },
    { sender: 'bot', text: 'Expect questions about: hiring velocity vs quality, engineering culture at scale, org design decisions, and how you handle technical debt during rapid growth...' },
  ],
  ca3: [
    { sender: 'user', text: 'What compensation benchmarks should I reference for a CTO role in Singapore?' },
    { sender: 'bot', text: 'For CTO roles in Singapore, base compensation ranges from SGD 280k-450k depending on company stage. Total compensation including equity can range significantly higher...' },
    { sender: 'user', text: 'How do I negotiate equity effectively?' },
    { sender: 'bot', text: 'Key negotiation strategies: 1) Benchmark against comparable roles, 2) Understand the cap table context, 3) Negotiate vesting terms, 4) Consider acceleration clauses...' },
  ],
  ca4: [
    { sender: 'user', text: 'Can you provide a market overview for CFO roles in the APAC region?' },
    { sender: 'bot', text: 'The APAC CFO market is active with demand driven by: regulatory complexity requiring local expertise, IPO pipeline creating pre-listing CFO needs, and regional HQ consolidation...' },
  ],
};

export default function ConversationAudit() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary flex items-center gap-2">
        <MessageCircle className="w-5 h-5" style={{ color: '#C108AB' }} />
        <span className="text-sm font-medium text-text-primary">Conversation Audit</span>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {MOCK_CONVERSATION_AUDIT.map((conv) => {
          const isExpanded = expandedId === conv.id;
          const portalStyle = PORTAL_COLORS[conv.portal] || { bg: '#e5e7eb20', text: '#6b7280' };
          const statusStyle = STATUS_STYLES[conv.status] || STATUS_STYLES.completed;

          return (
            <div key={conv.id}>
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-secondary transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : conv.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                )}
                <span className="text-sm text-text-primary font-mono shrink-0">{conv.userId}</span>
                <span
                  className="inline-block px-2 py-0.5 text-xs font-semibold shrink-0"
                  style={{ borderRadius: 0, backgroundColor: portalStyle.bg, color: portalStyle.text }}
                >
                  {conv.portal}
                </span>
                <span className="text-sm text-text-muted shrink-0">{conv.messages} msgs</span>
                <span className="text-sm text-text-muted shrink-0">{conv.startedAt}</span>
                <span
                  className="inline-block px-2 py-0.5 text-xs font-semibold shrink-0 ml-auto"
                  style={{ borderRadius: 0, backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                  {conv.status}
                </span>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pl-11">
                  <div className="border border-bg-tertiary divide-y divide-bg-tertiary">
                    {(MOCK_MESSAGES[conv.id] || []).map((msg, i) => (
                      <div key={i} className="px-3 py-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: msg.sender === 'user' ? '#C108AB' : '#6b7280' }}
                        >
                          {msg.sender === 'user' ? 'User' : 'NEXUS'}
                        </span>
                        <p className="text-sm text-text-primary mt-0.5">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
