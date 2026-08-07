import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Clock, Users, Target, AlertTriangle, ChevronRight, Sparkles, TrendingUp, Award } from 'lucide-react';

interface SimulationCanvasProps {
  scenario: {
    id: string;
    title: string;
    background: string;
    objectives: string[];
    constraints: Array<{ description: string; impact: number }>;
    stakeholders: Array<{ name: string; role: string; perspective: string }>;
    possibleActions: string[];
  };
  state: {
    currentTurn: number;
    maxTurns: number;
    score: number;
    completed: boolean;
    status: string;
    turns: Array<{ playerAction: string; coachResponse: string; decisionQuality: number }>;
  };
  onAction: (action: string) => void;
  onReset: () => void;
  onStart: () => void;
}

export function SimulationCanvas({
  scenario,
  state,
  onAction,
  onReset,
  onStart,
}: SimulationCanvasProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const progress = (state.currentTurn / state.maxTurns) * 100;

  const handleSubmit = useCallback(() => {
    if (!selectedAction) return;
    onAction(selectedAction);
    setSelectedAction(null);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  }, [selectedAction, onAction]);

  const statusColors: Record<string, string> = {
    'not-started': 'bg-[#C108AB]',
    'in-progress': 'bg-amber-500',
    'completed': 'bg-green-600',
    'paused': 'bg-gray-500',
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border border-[#e8e6e3]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 ${statusColors[state.status] ?? 'bg-gray-400'}`} />
          <h2 className="text-lg font-semibold text-[#1a1a1a]">{scenario.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#555]">Turn {state.currentTurn}/{state.maxTurns}</span>
          <div className="w-40 h-1 bg-[#e8e6e3]">
            <motion.div
              className="h-full bg-[#C108AB]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#C108AB]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#555]">Background</span>
              </div>
              <p className="text-sm text-[#1a1a1a] leading-relaxed">{scenario.background}</p>
            </div>

            <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#C108AB]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#555]">Objectives</span>
              </div>
              <ul className="space-y-2">
                {scenario.objectives.map((obj, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-[#1a1a1a]"
                  >
                    <span className="w-5 h-5 bg-[#C108AB] text-white text-xs flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {obj}
                  </motion.li>
                ))}
              </ul>
            </div>

            {state.status === 'completed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-2 border-[#C108AB] p-6 bg-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-[#C108AB]" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#C108AB]">Simulation Complete</span>
                    <div className="text-2xl font-bold text-[#1a1a1a]">Score: {Math.round(state.score * 100)}%</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {state.turns.map((turn, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-[#555] text-xs w-8">T{i + 1}</span>
                      <span className="flex-1 text-[#1a1a1a] truncate">{turn.playerAction}</span>
                      <span className={`text-xs font-semibold ${turn.decisionQuality >= 0.7 ? 'text-green-600' : turn.decisionQuality >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
                        {Math.round(turn.decisionQuality * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {state.status !== 'not-started' && !state.completed && state.turns.length > 0 && (
              <AnimatePresence>
                {state.turns.slice(-1).map((turn, i) => (
                  <motion.div
                    key={turn.id ?? i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-l-4 border-[#C108AB] pl-4 py-2 bg-[#fafafa]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-[#C108AB]" />
                      <span className="text-xs font-semibold text-[#555]">Coach Feedback</span>
                    </div>
                    <p className="text-sm text-[#1a1a1a]">{turn.coachResponse}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="space-y-4">
            <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#555]">Constraints</span>
              </div>
              <ul className="space-y-2">
                {scenario.constraints.map((c, i) => (
                  <li key={i} className="text-xs text-[#1a1a1a] flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 mt-1.5 flex-shrink-0" />
                    {c.description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#C108AB]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#555]">Stakeholders</span>
              </div>
              <ul className="space-y-3">
                {scenario.stakeholders.map((s, i) => (
                  <li key={i} className="border-l-2 border-[#C108AB] pl-3">
                    <div className="text-sm font-medium text-[#1a1a1a]">{s.name}</div>
                    <div className="text-xs text-[#555] mb-1">{s.role}</div>
                    <div className="text-xs text-[#555] italic">{s.perspective}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {state.status === 'not-started' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <Clock className="w-12 h-12 text-[#C108AB] mb-4" />
            <p className="text-[#555] mb-4 text-sm">Ready to begin this simulation?</p>
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-3 bg-[#C108AB] text-white font-semibold hover:bg-[#A00790] transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Simulation
            </button>
          </motion.div>
        ) : !state.completed ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[#e8e6e3] pt-6">
            <h3 className="text-sm font-semibold text-[#1a1a1a] mb-4">Choose your action for Turn {state.currentTurn + 1}:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {scenario.possibleActions.map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, backgroundColor: '#f7f6f4' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAction(action)}
                  className={`text-left p-4 border transition-colors ${
                    selectedAction === action
                      ? 'border-[#C108AB] bg-[rgba(193,8,171,0.08)]'
                      : 'border-[#e8e6e3] bg-white hover:border-[#C108AB]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedAction === action ? 'text-[#C108AB]' : 'text-[#999]'}`} />
                    <span className="text-sm text-[#1a1a1a]">{action}</span>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#555]">
                Score: <span className="font-semibold text-[#C108AB]">{Math.round(state.score * 100)}%</span>
              </span>
              <button
                onClick={handleSubmit}
                disabled={!selectedAction}
                className="flex items-center gap-2 px-6 py-3 bg-[#C108AB] text-white font-semibold disabled:bg-[#e8e6e3] disabled:text-[#999] hover:bg-[#A00790] transition-colors"
              >
                Submit Decision
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-[#e8e6e3] pt-6 flex justify-center">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#C108AB] text-[#C108AB] font-semibold hover:bg-[rgba(193,8,171,0.08)] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Run Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
