import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Target, Clock, Calendar, CheckCircle, AlertCircle, ArrowRight, BarChart3, PieChart } from 'lucide-react';

interface CompetencyScore {
  id: string;
  competency: string;
  score: number;
  level: string;
  lastUpdated: number;
}

interface SessionRecord {
  id: string;
  date: number;
  type: string;
  title: string;
  duration: number;
  score: number | null;
}

interface ProgressGoal {
  id: string;
  description: string;
  targetDate: number;
  status: string;
  completedMilestones: number;
  totalMilestones: number;
}

interface CoachingProgressProps {
  overallScore: number;
  progressTrend: 'improving' | 'stable' | 'declining';
  competencies: CompetencyScore[];
  sessions: SessionRecord[];
  goals: ProgressGoal[];
  achievements: string[];
  recommendations: string[];
  onViewDetails?: () => void;
}

const LEVEL_COLORS: Record<string, string> = {
  novice: 'bg-gray-400',
  developing: 'bg-amber-500',
  proficient: 'bg-green-500',
  advanced: 'bg-[#C108AB]',
  expert: 'bg-purple-600',
};

const LEVEL_TEXT: Record<string, string> = {
  novice: 'text-gray-600',
  developing: 'text-amber-700',
  proficient: 'text-green-700',
  advanced: 'text-[#C108AB]',
  expert: 'text-purple-700',
};

export function CoachingProgress({
  overallScore,
  progressTrend,
  competencies,
  sessions,
  goals,
  achievements,
  recommendations,
  onViewDetails,
}: CoachingProgressProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'sessions' | 'goals'>('overview');

  const trendIcon = progressTrend === 'improving' ? <TrendingUp className="w-5 h-5 text-green-500" /> :
    progressTrend === 'declining' ? <TrendingUp className="w-5 h-5 text-red-500 rotate-180" /> :
    <BarChart3 className="w-5 h-5 text-amber-500" />;

  const trendLabel = progressTrend === 'improving' ? 'Improving' : progressTrend === 'declining' ? 'Declining' : 'Stable';

  const totalSessionHours = sessions.reduce((s, sess) => s + sess.duration / 3600, 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status !== 'completed').length;

  return (
    <div className="flex flex-col h-full bg-white border border-[#e8e6e3]">
      <div className="px-6 py-4 border-b border-[#e8e6e3] bg-[#fafafa]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1a1a1a]">Coaching Progress</h3>
            <p className="text-xs text-[#555]">Your development journey at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#e8e6e3]">
              {trendIcon}
              <span className="text-sm font-semibold text-[#1a1a1a]">{trendLabel}</span>
            </div>
            <motion.div
              className="relative w-16 h-16 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <svg className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e8e6e3" strokeWidth="4" />
                <motion.circle
                  cx="32" cy="32" r="28"
                  fill="none"
                  stroke="#C108AB"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - overallScore) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-bold text-[#C108AB]">{Math.round(overallScore * 100)}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#e8e6e3]">
        {(['overview', 'competencies', 'sessions', 'goals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#C108AB] border-b-2 border-[#C108AB] bg-white'
                : 'text-[#555] hover:text-[#1a1a1a] hover:bg-[#fafafa]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
                  <div className="text-2xl font-bold text-[#1a1a1a]">{sessions.length}</div>
                  <div className="text-xs text-[#555]">Total Sessions</div>
                </div>
                <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
                  <div className="text-2xl font-bold text-[#1a1a1a]">{totalSessionHours.toFixed(1)}h</div>
                  <div className="text-xs text-[#555]">Coaching Hours</div>
                </div>
                <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
                  <div className="text-2xl font-bold text-[#1a1a1a]">{completedGoals}</div>
                  <div className="text-xs text-[#555]">Goals Achieved</div>
                </div>
                <div className="border border-[#e8e6e3] p-4 bg-[#fafafa]">
                  <div className="text-2xl font-bold text-[#1a1a1a]">{competencies.length}</div>
                  <div className="text-xs text-[#555]">Competencies</div>
                </div>
              </div>

              {achievements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-[#C108AB]" />
                    <span className="text-sm font-semibold text-[#1a1a1a]">Key Achievements</span>
                  </div>
                  <ul className="space-y-2">
                    {achievements.map((ach, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-[#1a1a1a] p-3 bg-green-50 border-l-2 border-green-500"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {ach}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-[#1a1a1a]">Recommendations</span>
                  </div>
                  <ul className="space-y-2">
                    {recommendations.map((rec, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2 text-sm text-[#1a1a1a] p-3 bg-amber-50 border-l-2 border-amber-500"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'competencies' && (
            <motion.div
              key="competencies"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-4"
            >
              {competencies.map((comp, i) => (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-[#e8e6e3] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 ${LEVEL_COLORS[comp.level]}`} />
                      <span className="text-sm font-semibold text-[#1a1a1a] capitalize">{comp.competency.replace('-', '')}</span>
                    </div>
                    <span className={`text-xs font-semibold uppercase ${LEVEL_TEXT[comp.level]}`}>{comp.level}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#e8e6e3]">
                      <motion.div
                        className="h-full bg-[#C108AB]"
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.score * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[#C108AB]">{Math.round(comp.score * 100)}%</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-[#999] text-sm">No sessions recorded yet</div>
                ) : (
                  sessions.map((sess, i) => (
                    <motion.div
                      key={sess.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border border-[#e8e6e3] p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#C108AB] text-white flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#1a1a1a]">{sess.title}</div>
                          <div className="text-xs text-[#555]">
                            {new Date(sess.date).toLocaleDateString()} • {sess.type} • {Math.round(sess.duration / 60)}m
                          </div>
                        </div>
                      </div>
                      {sess.score !== null && (
                        <div className={`text-sm font-bold ${sess.score >= 0.7 ? 'text-green-600' : sess.score >= 0.5 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.round(sess.score * 100)}%
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-3"
            >
              {goals.length === 0 ? (
                <div className="text-center py-8 text-[#999] text-sm">No goals set yet</div>
              ) : (
                goals.map((goal, i) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border p-4 ${
                      goal.status === 'completed' ? 'border-green-500 bg-green-50' :
                      goal.status === 'behind' ? 'border-red-500 bg-red-50' :
                      goal.status === 'ahead' ? 'border-blue-500 bg-blue-50' :
                      'border-[#e8e6e3] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1a1a1a]">{goal.description}</div>
                        <div className="text-xs text-[#555] mt-1">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold uppercase ${
                        goal.status === 'completed' ? 'text-green-700' :
                        goal.status === 'behind' ? 'text-red-700' :
                        goal.status === 'ahead' ? 'text-blue-700' :
                        'text-[#555]'
                      }`}>
                        {goal.status.replace('-', '')}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#e8e6e3]">
                        <motion.div
                          className="h-full bg-[#C108AB]"
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.totalMilestones > 0 ? (goal.completedMilestones / goal.totalMilestones) * 100 : 0}%` }}
                          transition={{ duration: 0.5, delay: i * 0.08 }}
                        />
                      </div>
                      <span className="text-xs text-[#555]">
                        {goal.completedMilestones}/{goal.totalMilestones} milestones
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onViewDetails && (
        <div className="border-t border-[#e8e6e3] p-4 bg-[#fafafa] text-center">
          <button
            onClick={onViewDetails}
            className="flex items-center gap-2 mx-auto text-sm text-[#C108AB] font-semibold hover:underline"
          >
            View Detailed Report
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
