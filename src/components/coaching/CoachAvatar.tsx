import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Mic, Send, Bot, User } from 'lucide-react';

interface CoachAvatarProps {
  name: string;
  role: string;
  personality: {
    empathy: number;
    assertiveness: number;
    openness: number;
    conscientiousness: number;
  };
  status: 'listening' | 'speaking' | 'idle' | 'thinking';
  currentMessage?: string;
  onSendMessage: (message: string) => void;
  avatarColor?: string;
}

export function CoachAvatar({
  name,
  role,
  personality,
  status,
  currentMessage,
  onSendMessage,
  avatarColor = '#C108AB',
}: CoachAvatarProps) {
  const [inputValue, setInputValue] = useState('');
  const [displayMessage, setDisplayMessage] = useState<string | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentMessage) {
      setIsAnimating(true);
      setDisplayMessage(currentMessage);
      const timer = setTimeout(() => setIsAnimating(false), currentMessage.length * 30);
      return () => clearTimeout(timer);
    }
  }, [currentMessage]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const statusConfig = {
    listening: { color: 'bg-green-500', label: 'Listening...', pulse: true },
    speaking: { color: 'bg-[#C108AB]', label: 'Speaking...', pulse: true },
    idle: { color: 'bg-gray-400', label: 'Ready', pulse: false },
    thinking: { color: 'bg-amber-500', label: 'Thinking...', pulse: true },
  };

  const currentStatus = statusConfig[status];
  const empathyLevel = Math.round(personality.empathy * 100);
  const assertivenessLevel = Math.round(personality.assertiveness * 100);

  return (
    <div className="flex flex-col h-full bg-white border border-[#e8e6e3]">
      <div className="px-6 py-4 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              className="w-14 h-14 flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: avatarColor }}
              animate={
                status === 'speaking'
                  ? { scale: [1, 1.05, 1] }
                  : status === 'listening'
                    ? { scale: [1, 1.02, 1] }
                    : { scale: 1 }
              }
              transition={{ duration: 0.8, repeat: status !== 'idle' ? Infinity : 0 }}
            >
              {name.charAt(0)}
            </motion.div>
            {currentStatus.pulse && (
              <motion.div
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${currentStatus.color} border-2 border-white`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#1a1a1a]">{name}</h3>
              <motion.span
                className={`w-2 h-2 ${currentStatus.color}`}
                animate={{ opacity: currentStatus.pulse ? [1, 0.3, 1] : 1 }}
                transition={{ duration: 1, repeat: currentStatus.pulse ? Infinity : 0 }}
              />
            </div>
            <p className="text-xs text-[#555]">{role}</p>
            <p className="text-xs text-[#999] mt-0.5">{currentStatus.label}</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs text-[#555]">Empathy</div>
              <div className="text-sm font-semibold text-[#C108AB]">{empathyLevel}%</div>
            </div>
            <div>
              <div className="text-xs text-[#555]">Assertiveness</div>
              <div className="text-sm font-semibold text-[#C108AB]">{assertivenessLevel}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {displayMessage && isAnimating ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md"
            >
              <div className="flex gap-2 items-center">
                <motion.div
                  className="w-2 h-2 bg-[#C108AB]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#C108AB]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-[#C108AB]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
                <span className="text-sm text-[#555] ml-2">Thinking...</span>
              </div>
            </motion.div>
          ) : displayMessage ? (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <Bot className="w-5 h-5 text-[#C108AB] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="px-4 py-3 bg-[#fafafa] border border-[#e8e6e3] text-sm text-[#1a1a1a] leading-relaxed">
                  {displayMessage}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <MessageCircle className="w-12 h-12 text-[#C108AB] mb-4" />
              <p className="text-sm text-[#555] max-w-xs">
                Hello, I'm {name}. I'm here to help you explore your {role.toLowerCase()} goals and challenges.
              </p>
              <p className="text-xs text-[#999] mt-4">What would you like to discuss today?</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-[#e8e6e3] p-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#fafafa] border border-[#e8e6e3]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Share your thoughts..."
              className="flex-1 bg-transparent text-sm text-[#1a1a1a] placeholder-[#999] focus:outline-none"
            />
            <Sparkles className="w-4 h-4 text-[#C108AB]" />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-3 bg-[#C108AB] text-white hover:bg-[#A00790] disabled:bg-[#e8e6e3] disabled:text-[#999] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex-1 h-1 bg-[#e8e6e3]">
            <motion.div
              className="h-full bg-[#C108AB]"
              initial={{ width: 0 }}
              animate={{ width: `${empathyLevel}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <span className="text-xs text-[#999]">Personality calibration</span>
        </div>
      </div>
    </div>
  );
}
