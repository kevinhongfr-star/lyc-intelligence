import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, MoreVertical, Users, User, Bot, Sparkles, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'coach' | 'coachee' | 'system';
  sender: string;
  content: string;
  timestamp: number;
  avatar?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  isActive: boolean;
}

interface CoachingSessionViewProps {
  sessionId: string;
  focus: string;
  methodology: string;
  agents: Agent[];
  messages: Message[];
  onSendMessage: (content: string) => void;
  onAssignAction: (description: string) => void;
  onEndSession: () => void;
  progress: number;
}

export function CoachingSessionView({
  sessionId,
  focus,
  methodology,
  agents,
  messages,
  onSendMessage,
  onAssignAction,
  onEndSession,
  progress,
}: CoachingSessionViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeAgentId, setActiveAgentId] = useState<string>(agents[0]?.id ?? '');
  const [showActions, setShowActions] = useState(false);
  const [actionInput, setActionInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeAgent = agents.find(a => a.id === activeAgentId) ?? agents[0];

  return (
    <div className="flex flex-col h-full bg-white border border-[#e8e6e3]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {agents.map((agent) => (
              <motion.button
                key={agent.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveAgentId(agent.id)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold text-white transition-all ${
                  activeAgentId === agent.id ? 'ring-2 ring-offset-2 ring-[#C108AB]' : ''
                }`}
                style={{ backgroundColor: agent.color }}
                title={`${agent.name} — ${agent.role}`}
              >
                {agent.name.charAt(0)}
              </motion.button>
            ))}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1a1a1a]">
              {focus.replace('-', ' ')} Session
            </div>
            <div className="text-xs text-[#555]">{methodology} Framework</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#555]">Progress</span>
            <div className="w-24 h-1.5 bg-[#e8e6e3]">
              <motion.div
                className="h-full bg-[#C108AB]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs font-semibold text-[#C108AB]">{progress}%</span>
          </div>
          <button
            onClick={onEndSession}
            className="px-3 py-1.5 text-xs font-semibold text-[#C108AB] border border-[#C108AB] hover:bg-[rgba(193,8,171,0.08)] transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'coachee' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                  msg.role === 'coachee' ? 'bg-[#555]' : msg.role === 'system' ? 'bg-gray-400' : 'bg-[#C108AB]'
                }`}
              >
                {msg.role === 'system' ? <Sparkles className="w-3 h-3" /> : msg.sender.charAt(0)}
              </div>
              <div className={`flex-1 max-w-[75%] ${msg.role === 'coachee' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'system' ? (
                  <div className="text-center py-2 px-4 bg-[#fafafa] border border-[#e8e6e3] text-xs text-[#555] mx-auto max-w-md">
                    {msg.content}
                  </div>
                ) : (
                  <>
                    <div className={`text-xs text-[#555] mb-1 ${msg.role === 'coachee' ? 'text-right' : ''}`}>
                      {msg.sender}
                    </div>
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'coachee'
                          ? 'bg-[#C108AB] text-white'
                          : 'bg-[#fafafa] text-[#1a1a1a] border border-[#e8e6e3]'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#e8e6e3] bg-white">
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-[#e8e6e3] overflow-hidden"
            >
              <div className="p-4 bg-[#fafafa]">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-[#C108AB]" />
                  <span className="text-sm font-semibold text-[#1a1a1a]">Create Action Item</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    placeholder="Describe the action to be taken..."
                    className="flex-1 px-3 py-2 text-sm border border-[#e8e6e3] bg-white focus:outline-none focus:border-[#C108AB]"
                  />
                  <button
                    onClick={() => {
                      if (actionInput.trim()) {
                        onAssignAction(actionInput.trim());
                        setActionInput('');
                        setShowActions(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#C108AB] text-white text-sm font-semibold hover:bg-[#A00790] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 p-3">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-[#555] hover:text-[#C108AB] transition-colors"
            title="Action Items"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-[#555]">
            <Bot className="w-3 h-3 text-[#C108AB]" />
            <span>Responding as <span className="font-semibold">{activeAgent?.name}</span></span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 px-3 py-2 bg-[#fafafa] border border-[#e8e6e3] flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${activeAgent?.name}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#999] resize-none focus:outline-none"
              style={{ minHeight: '24px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 bg-[#C108AB] text-white hover:bg-[#A00790] disabled:bg-[#e8e6e3] disabled:text-[#999] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
