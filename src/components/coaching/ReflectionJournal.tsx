import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, BookOpen, Sparkles, ChevronRight, Send, Save, Lightbulb, Target, TrendingUp, Star } from 'lucide-react';

interface ReflectionPrompt {
  id: string;
  category: string;
  prompt: string;
  depth: string;
}

interface ReflectionEntry {
  id: string;
  prompt: string;
  response: string;
  category: string;
  depth: string;
  insights: string[];
  actionItems: string[];
  createdAt: number;
}

interface ReflectionJournalProps {
  prompts: ReflectionPrompt[];
  onSubmit: (entries: ReflectionEntry[]) => void;
  initialEntries?: ReflectionEntry[];
}

const DEPTH_COLORS: Record<string, string> = {
  surface: 'bg-gray-400',
  actionable: 'bg-amber-500',
  deep: 'bg-[#C108AB]',
  transformative: 'bg-green-600',
};

const DEPTH_LABELS: Record<string, string> = {
  surface: 'Surface',
  actionable: 'Actionable',
  deep: 'Deep',
  transformative: 'Transformative',
};

export function ReflectionJournal({ prompts, onSubmit, initialEntries = [] }: ReflectionJournalProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const [entries, setEntries] = useState<ReflectionEntry[]>(initialEntries);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [depthScore, setDepthScore] = useState(0);

  const activePrompt = prompts[activePromptIdx];

  const handleResponseChange = (value: string) => {
    setResponses(prev => ({ ...prev, [activePrompt.id]: value }));
  };

  const generateEntry = useCallback((prompt: ReflectionPrompt, response: string): ReflectionEntry => {
    const insights: string[] = [];
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      insights.push(sentences.reduce((a, b) => a.length > b.length ? a : b, '').trim());
    }
    const actionItems: string[] = [];
    const actionPattern = /(?:i will|i\'ll|i\'m going to|i plan to|my next step is)/gi;
    sentences.forEach(s => {
      if (actionPattern.test(s)) actionItems.push(s.trim());
    });
    return {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      prompt: prompt.prompt,
      response,
      category: prompt.category,
      depth: prompt.depth,
      insights,
      actionItems,
      createdAt: Date.now(),
    };
  }, []);

  const handleNext = () => {
    if (!activePrompt) return;
    const response = responses[activePrompt.id]?.trim();
    if (response) {
      const entry = generateEntry(activePrompt, response);
      setEntries(prev => [...prev, entry]);
      setDepthScore(prev => Math.min(100, prev + 20));
    }
    if (activePromptIdx < prompts.length - 1) {
      setActivePromptIdx(prev => prev + 1);
    } else {
      analyzeAndSubmit();
    }
  };

  const analyzeAndSubmit = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 1200));
    const allEntries = [...entries];
    Object.entries(responses).forEach(([promptId, response]) => {
      const prompt = prompts.find(p => p.id === promptId);
      if (prompt && response.trim()) {
        allEntries.push(generateEntry(prompt, response.trim()));
      }
    });
    const depthScores = allEntries.map(e => {
      const scores: Record<string, number> = { surface: 25, actionable: 50, deep: 75, transformative: 100 };
      return scores[e.depth] ?? 25;
    });
    const avgDepth = depthScores.length > 0 ? Math.round(depthScores.reduce((a, b) => a + b, 0) / depthScores.length) : 0;
    setDepthScore(avgDepth);
    onSubmit(allEntries);
    setIsAnalyzing(false);
  };

  const totalInsights = entries.reduce((s, e) => s + e.insights.length, 0);
  const totalActions = entries.reduce((s, e) => s + e.actionItems.length, 0);
  const completedPrompts = Object.values(responses).filter(v => v.trim()).length;

  return (
    <div className="flex flex-col h-full bg-white border border-[#e8e6e3]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-[#C108AB]" />
          <h3 className="font-semibold text-[#1a1a1a]">Reflection Journal</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C108AB]" />
            <span className="text-[#555]">{totalInsights} insights</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-green-600" />
            <span className="text-[#555]">{totalActions} actions</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span className="text-[#555]">Depth: {depthScore}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activePrompt && (
            <motion.div
              key={activePrompt.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-3 border-b border-[#e8e6e3] bg-[#fafafa]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${DEPTH_COLORS[activePrompt.depth]}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#555]">
                    {DEPTH_LABELS[activePrompt.depth]} Reflection
                  </span>
                </div>
                <span className="text-xs text-[#999]">
                  {activePromptIdx + 1} / {prompts.length}
                </span>
              </div>

              <div className="flex-1 p-6 space-y-6">
                <div>
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-[#C108AB] mt-1 flex-shrink-0" />
                    <p className="text-lg text-[#1a1a1a] font-medium leading-relaxed">
                      {activePrompt.prompt}
                    </p>
                  </div>
                </div>

                <div>
                  <textarea
                    value={responses[activePrompt.id] ?? ''}
                    onChange={(e) => handleResponseChange(e.target.value)}
                    placeholder="Take your time. Write freely about your thoughts, feelings, and insights..."
                    rows={8}
                    className="w-full px-4 py-3 text-sm text-[#1a1a1a] border border-[#e8e6e3] bg-[#fafafa] focus:outline-none focus:border-[#C108AB] resize-none"
                  />
                  <div className="mt-1 text-xs text-[#999] text-right">
                    {(responses[activePrompt.id] ?? '').length} characters
                  </div>
                </div>

                <div className="border-l-2 border-[#C108AB] pl-4 py-2 bg-[rgba(193,8,171,0.04)]">
                  <p className="text-xs text-[#555] italic">
                    💡 Tip: Write from experience. The more specific your reflection, the deeper the insight.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e8e6e3] px-6 py-4 flex items-center justify-between bg-white">
                <div className="text-sm text-[#555]">
                  {completedPrompts} of {prompts.length} prompts completed
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleNext}
                    disabled={!responses[activePrompt.id]?.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-[#C108AB] text-white text-sm font-semibold hover:bg-[#A00790] disabled:bg-[#e8e6e3] disabled:text-[#999] transition-colors"
                  >
                    {activePromptIdx === prompts.length - 1 ? 'Submit Journal' : 'Next Prompt'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 flex items-center justify-center z-10"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-2 border-[#C108AB] border-t-transparent mx-auto mb-4"
                />
                <p className="text-sm text-[#555]">Analyzing your reflections...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
