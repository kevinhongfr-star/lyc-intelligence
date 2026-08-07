import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Play, Clock, BookOpen, ChevronRight, Sparkles, Target, Award } from 'lucide-react';

interface LearningPathStep {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'locked';
  type: 'article' | 'video' | 'exercise' | 'case-study' | 'assessment' | 'peer-session';
  duration: number;
  score?: number;
}

interface LearningPathModule {
  id: string;
  title: string;
  description: string;
  level: 'foundational' | 'intermediate' | 'advanced' | 'mastery';
  estimatedDuration: number;
  steps: LearningPathStep[];
  status: 'not-started' | 'in-progress' | 'completed' | 'locked';
}

interface LearningPathProps {
  title: string;
  description: string;
  progress: number;
  modules: LearningPathModule[];
  onStepClick: (moduleId: string, stepId: string) => void;
  onModuleComplete: (moduleId: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  article: <BookOpen className="w-3 h-3" />,
  video: <Play className="w-3 h-3" />,
  exercise: <Target className="w-3 h-3" />,
  'case-study': <Sparkles className="w-3 h-3" />,
  assessment: <Award className="w-3 h-3" />,
  'peer-session': <Users className="w-3 h-3" />,
};

const TYPE_COLORS: Record<string, string> = {
  article: 'bg-blue-100 text-blue-700',
  video: 'bg-red-100 text-red-700',
  exercise: 'bg-green-100 text-green-700',
  'case-study': 'bg-purple-100 text-purple-700',
  assessment: 'bg-amber-100 text-amber-700',
  'peer-session': 'bg-[rgba(193,8,171,0.1)] text-[#C108AB]',
};

const LEVEL_COLORS: Record<string, string> = {
  foundational: 'border-green-500',
  intermediate: 'border-amber-500',
  advanced: 'border-[#C108AB]',
  mastery: 'border-purple-600',
};

function Users(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function LearningPath({
  title,
  description,
  progress,
  modules,
  onStepClick,
  onModuleComplete,
}: LearningPathProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const completedModules = modules.filter(m => m.status === 'completed').length;
  const totalSteps = modules.reduce((s, m) => s + m.steps.length, 0);
  const completedSteps = modules.reduce((s, m) => s + m.steps.filter(st => st.status === 'completed').length, 0);

  return (
    <div className="flex flex-col h-full bg-white border border-[#e8e6e3]">
      <div className="px-6 py-4 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1a1a1a]">{title}</h3>
            <p className="text-xs text-[#555]">{description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#C108AB]">{Math.round(progress)}%</div>
            <div className="text-xs text-[#555]">Complete</div>
          </div>
        </div>
        <div className="mt-3 h-2 bg-[#e8e6e3]">
          <motion.div
            className="h-full bg-[#C108AB]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-[#555]">
          <span>{completedSteps} / {totalSteps} activities</span>
          <span>{completedModules} / {modules.length} modules</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#e8e6e3]" />
          {modules.map((module, idx) => {
            const isExpanded = expandedModule === module.id;
            const moduleComplete = module.status === 'completed';
            const moduleLocked = module.status === 'locked';
            const completedCount = module.steps.filter(s => s.status === 'completed').length;

            return (
              <motion.div
                key={module.id}
                layout
                className="relative mb-4 pl-12"
              >
                <motion.div
                  className={`absolute left-2 top-4 w-5 h-5 flex items-center justify-center text-xs font-bold text-white ${
                    moduleComplete ? 'bg-green-500' :
                    moduleLocked ? 'bg-gray-400' :
                    module.status === 'in-progress' ? 'bg-[#C108AB]' : 'bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {moduleComplete ? <CheckCircle className="w-3 h-3" /> : idx + 1}
                </motion.div>

                <motion.div
                  layout
                  className={`border bg-white transition-all ${
                    isExpanded ? 'shadow-card' : ''
                  } ${moduleComplete ? 'border-green-500' : moduleLocked ? 'border-gray-300' : 'border-[#e8e6e3]'}`}
                >
                  <motion.button
                    layout
                    onClick={() => {
                      if (!moduleLocked) {
                        setExpandedModule(isExpanded ? null : module.id);
                      }
                    }}
                    className={`w-full flex items-start justify-between p-4 text-left ${
                      moduleLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1 h-4 ${LEVEL_COLORS[module.level]}`} />
                        <h4 className="font-semibold text-[#1a1a1a] text-sm">{module.title}</h4>
                        {moduleLocked && <Lock className="w-3 h-3 text-gray-400" />}
                      </div>
                      <p className="text-xs text-[#555] mb-2">{module.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#999]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.round(module.estimatedDuration / 60)} min
                        </span>
                        <span>{completedCount}/{module.steps.length} completed</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-[#999] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && !moduleLocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[#e8e6e3] p-4 bg-[#fafafa]">
                          <div className="space-y-2">
                            {module.steps.map((step) => (
                              <motion.button
                                key={step.id}
                                layout
                                whileHover={{ x: 4 }}
                                onClick={() => onStepClick(module.id, step.id)}
                                disabled={step.status === 'locked'}
                                className={`w-full flex items-center gap-3 p-3 text-left border transition-all ${
                                  step.status === 'completed' ? 'border-green-500 bg-green-50' :
                                  step.status === 'in-progress' ? 'border-[#C108AB] bg-[rgba(193,8,171,0.04)]' :
                                  step.status === 'locked' ? 'border-gray-200 bg-gray-50 opacity-50' :
                                  'border-[#e8e6e3] bg-white hover:border-[#C108AB]'
                                }`}
                              >
                                <span className={`flex items-center justify-center w-6 h-6 ${TYPE_COLORS[step.type] ?? 'bg-gray-100'}`}>
                                  {TYPE_ICONS[step.type]}
                                </span>
                                <div className="flex-1">
                                  <div className={`text-sm ${step.status === 'completed' ? 'text-green-700 line-through' : 'text-[#1a1a1a]'}`}>
                                    {step.title}
                                  </div>
                                  <div className="text-xs text-[#555]">{step.description}</div>
                                </div>
                                {step.status === 'completed' && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                                {step.score !== undefined && (
                                  <span className="text-xs font-bold text-[#C108AB]">
                                    {Math.round(step.score * 100)}%
                                  </span>
                                )}
                              </motion.button>
                            ))}
                          </div>
                          {!moduleComplete && (
                            <button
                              onClick={() => onModuleComplete(module.id)}
                              className="mt-4 w-full py-2 bg-[#C108AB] text-white text-sm font-semibold hover:bg-[#A00790] transition-colors"
                            >
                              Mark Module Complete
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
