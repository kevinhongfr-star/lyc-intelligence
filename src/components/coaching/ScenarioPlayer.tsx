import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, RotateCcw, Volume2, Users, Clock, Zap } from 'lucide-react';

interface ScenarioPlayerProps {
  onComplete: (score: number, insights: string[]) => void;
}

interface PlaybackState {
  turn: number;
  action: string;
  feedback: string;
  score: number;
  isPlaying: boolean;
}

const DEMO_SCENARIO = {
  title: 'The Performance Conversation',
  actions: [
    { text: 'Ask open-ended questions to understand their perspective', score: 0.85, feedback: 'Excellent! This builds trust and demonstrates respect.' },
    { text: 'Share specific examples using SBI model (Situation-Behavior-Impact)', score: 0.92, feedback: 'Perfect approach! Concrete examples make feedback actionable.' },
    { text: 'Co-create a development plan with clear milestones', score: 0.88, feedback: 'Strong collaboration. This builds ownership and commitment.' },
  ],
};

export function ScenarioPlayer({ onComplete }: ScenarioPlayerProps) {
  const [playback, setPlayback] = useState<PlaybackState>({
    turn: 0,
    action: '',
    feedback: '',
    score: 0,
    isPlaying: false,
  });
  const [timeline, setTimeline] = useState<PlaybackState[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const playStep = useCallback(() => {
    if (currentActionIndex >= DEMO_SCENARIO.actions.length) {
      setIsComplete(true);
      const avg = totalScore / DEMO_SCENARIO.actions.length;
      onComplete(avg, ['Active listening', 'Data-driven feedback', 'Collaborative planning']);
      return;
    }
    const action = DEMO_SCENARIO.actions[currentActionIndex];
    const state: PlaybackState = {
      turn: currentActionIndex + 1,
      action: action.text,
      feedback: action.feedback,
      score: action.score,
      isPlaying: true,
    };
    setPlayback(state);
    setTimeline(prev => [...prev, state]);
    setTotalScore(prev => prev + action.score);
    setCurrentActionIndex(prev => prev + 1);
  }, [currentActionIndex, totalScore, onComplete]);

  const reset = useCallback(() => {
    setPlayback({ turn: 0, action: '', feedback: '', score: 0, isPlaying: false });
    setTimeline([]);
    setCurrentActionIndex(0);
    setTotalScore(0);
    setIsComplete(false);
  }, []);

  const avgScore = timeline.length > 0
    ? Math.round((timeline.reduce((s, t) => s + t.score, 0) / timeline.length) * 100)
    : 0;

  return (
    <div className="w-full h-full flex flex-col bg-white border border-[#e8e6e3]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-[#C108AB]" />
          <h3 className="font-semibold text-[#1a1a1a]">Scenario Player</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={playStep}
            disabled={isComplete}
            className="flex items-center gap-2 px-4 py-2 bg-[#C108AB] text-white text-sm font-semibold hover:bg-[#A00790] disabled:bg-[#e8e6e3] disabled:text-[#999] transition-colors"
          >
            <Play className="w-3 h-3" />
            {timeline.length === 0 ? 'Play' : 'Next Step'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-2 border border-[#e8e6e3] text-[#555] text-sm hover:border-[#C108AB] hover:text-[#C108AB] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">{DEMO_SCENARIO.title}</h2>
            <p className="text-sm text-[#555]">Observe how a skilled coach handles this scenario step by step.</p>
          </div>

          <AnimatePresence mode="popLayout">
            {timeline.map((step, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.4 }}
                className="border border-[#e8e6e3] p-4 bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#C108AB] uppercase tracking-wider">Step {step.turn}</span>
                  <span className={`text-xs font-bold ${step.score >= 0.8 ? 'text-green-600' : step.score >= 0.6 ? 'text-amber-600' : 'text-red-600'}`}>
                    {Math.round(step.score * 100)}%
                  </span>
                </div>
                <div className="mb-3">
                  <div className="text-xs text-[#555] mb-1">Action:</div>
                  <p className="text-sm text-[#1a1a1a]">{step.action}</p>
                </div>
                <div className="border-l-2 border-[#C108AB] pl-3">
                  <div className="text-xs text-[#555] mb-1">Coach Feedback:</div>
                  <p className="text-sm text-[#1a1a1a]">{step.feedback}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isComplete && timeline.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-2 border-dashed border-[#e8e6e3] p-8 text-center"
            >
              <Play className="w-10 h-10 text-[#C108AB] mx-auto mb-3" />
              <p className="text-sm text-[#555]">Press Play to start the walkthrough</p>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-[#C108AB] p-6 bg-white"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-[#C108AB] mb-2">{avgScore}%</div>
                <p className="text-sm text-[#555] mb-4">Overall Effectiveness</p>
                <div className="grid grid-cols-3 gap-4 text-left">
                  <div className="border-l-2 border-green-500 pl-3">
                    <div className="text-xs text-[#555]">Strength 1</div>
                    <div className="text-sm font-medium text-[#1a1a1a]">Active Listening</div>
                  </div>
                  <div className="border-l-2 border-green-500 pl-3">
                    <div className="text-xs text-[#555]">Strength 2</div>
                    <div className="text-sm font-medium text-[#1a1a1a]">Data-Driven</div>
                  </div>
                  <div className="border-l-2 border-green-500 pl-3">
                    <div className="text-xs text-[#555]">Strength 3</div>
                    <div className="text-sm font-medium text-[#1a1a1a]">Collaborative</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="border-t border-[#e8e6e3] px-6 py-4 bg-[#fafafa]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <Clock className="w-4 h-4" />
              {timeline.length} / {DEMO_SCENARIO.actions.length} steps
            </div>
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <Users className="w-4 h-4" />
              {DEMO_SCENARIO.actions.length} stakeholders
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-[#e8e6e3]">
              <motion.div
                className="h-full bg-[#C108AB]"
                initial={{ width: 0 }}
                animate={{ width: `${(timeline.length / DEMO_SCENARIO.actions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-[#C108AB]">{Math.round((timeline.length / DEMO_SCENARIO.actions.length) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
