import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, MessageCircle, BookOpen, Users, TrendingUp,
  Sparkles, ChevronRight, ArrowLeft, RotateCcw,
  Target, Award, Clock, BarChart3, Calendar,
  Layers, Compass, UserCircle
} from 'lucide-react';
import { SimulationCanvas } from '@/components/coaching/SimulationCanvas';
import { ScenarioPlayer } from '@/components/coaching/ScenarioPlayer';
import { CoachingSessionView } from '@/components/coaching/CoachingSessionView';
import { CoachAvatar } from '@/components/coaching/CoachAvatar';
import { ReflectionJournal } from '@/components/coaching/ReflectionJournal';
import { PeerMatchCard } from '@/components/coaching/PeerMatchCard';
import { LearningPath } from '@/components/coaching/LearningPath';
import { CoachingProgress } from '@/components/coaching/CoachingProgress';
import { coachingService } from '@/services/coachingService';

type ViewMode = 'hub' | 'simulation' | 'player' | 'session' | 'journal' | 'peers' | 'curriculum' | 'progress';

interface HubCard {
  id: ViewMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  count?: string;
}

const HUB_CARDS: HubCard[] = [
  {
    id: 'simulation',
    title: 'Scenario Simulation',
    description: 'Practice real-world leadership and career scenarios in a safe environment.',
    icon: <Play className="w-6 h-6" />,
    color: 'bg-[#C108AB]',
    count: '3 active',
  },
  {
    id: 'session',
    title: 'Coaching Sessions',
    description: 'Engage in multi-agent coaching conversations with NEXUS.',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'bg-blue-600',
    count: '5 scheduled',
  },
  {
    id: 'journal',
    title: 'Reflection Journal',
    description: 'Deepen your learning through structured reflection prompts.',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-amber-600',
    count: '12 entries',
  },
  {
    id: 'peers',
    title: 'Peer Matching',
    description: 'Connect with peers for group coaching and mutual learning.',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-green-600',
    count: '8 matches',
  },
  {
    id: 'curriculum',
    title: 'Learning Paths',
    description: 'Follow structured curricula tailored to your development goals.',
    icon: <Layers className="w-6 h-6" />,
    color: 'bg-purple-600',
    count: '3 paths',
  },
  {
    id: 'progress',
    title: 'Progress Dashboard',
    description: 'Track your competency development and coaching journey.',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'bg-[#C108AB]',
    count: '75% complete',
  },
];

export function CoachingPage() {
  const [view, setView] = useState<ViewMode>('hub');
  const [simState, setSimState] = useState(() =>
    coachingService.simulation.initialize('sci-leadership-001')
  );
  const [session, setSession] = useState(() =>
    coachingService.session.create('user-001', 'leadership', 'GROW')
  );
  const [reflectionEntries, setReflectionEntries] = useState<ReflectionEntry[]>([]);

  const prompts = useMemo(
    () => coachingService.reflection.getPrompts().slice(0, 4),
    []
  );

  const peerMatches = useMemo(() => {
    const peer = coachingService.peer.getById('peer-002');
    if (!peer) return [];
    return coachingService.peer.match(peer, { maxResults: 3 });
  }, []);

  const learningPath = useMemo(() => {
    return coachingService.curriculum.getById('path-leadership-foundation')!;
  }, []);

  const progressData = useMemo(() => {
    const competencies = coachingService.progress.initializeScores('user-001', 'leadership');
    const sessions: SessionRecord[] = [
      { id: 's1', date: Date.now() - 7 * 86400000, type: 'coaching', title: 'Leadership Foundations', duration: 3600, score: 0.82 },
      { id: 's2', date: Date.now() - 5 * 86400000, type: 'simulation', title: 'Performance Conversation', duration: 1800, score: 0.75 },
      { id: 's3', date: Date.now() - 2 * 86400000, type: 'peer', title: 'Peer Discussion', duration: 3600, score: 0.88 },
    ];
    const goals: ProgressGoal[] = [
      { id: 'g1', description: 'Complete Leadership Assessment', targetDate: Date.now() + 14 * 86400000, status: 'on-track', completedMilestones: 2, totalMilestones: 3 },
      { id: 'g2', description: 'Improve Feedback Delivery Skills', targetDate: Date.now() + 30 * 86400000, status: 'ahead', completedMilestones: 3, totalMilestones: 4 },
      { id: 'g3', description: 'Develop Team Coaching Capability', targetDate: Date.now() + 45 * 86400000, status: 'on-track', completedMilestones: 1, totalMilestones: 5 },
    ];
    return {
      overallScore: 0.72,
      progressTrend: 'improving' as const,
      competencies,
      sessions,
      goals,
      achievements: [
        'Successfully completed 3 coaching sessions this month',
        'Improved decision quality scores by 15%',
        'Received "excellent" feedback on communication exercises',
      ],
      recommendations: [
        'Schedule next session to reinforce GROW model learnings',
        'Complete remaining modules in Leadership Foundations path',
        'Pair with a peer coach for additional perspective',
      ],
    };
  }, []);

  const handleStartSimulation = useCallback(() => {
    setSimState(coachingService.simulation.start(simState));
  }, [simState]);

  const handleSimAction = useCallback((action: string) => {
    setSimState(prev => coachingService.simulation.submitTurn(prev, action));
  }, []);

  const handleSimReset = useCallback(() => {
    setSimState(coachingService.simulation.initialize('sci-leadership-001'));
  }, []);

  const handleStartSession = useCallback(() => {
    setSession(coachingService.session.start(session));
  }, [session]);

  const handleSendMessage = useCallback((content: string) => {
    setSession(prev => coachingService.session.respond(prev, content));
  }, []);

  const handleAssignAction = useCallback((description: string) => {
    setSession(prev => coachingService.session.assignAction(prev, description));
  }, []);

  const handleEndSession = useCallback(() => {
    setSession(prev => coachingService.session.end(prev));
  }, []);

  const handleReflectionSubmit = useCallback((entries: ReflectionEntry[]) => {
    setReflectionEntries(entries);
  }, []);

  const renderHub = () => (
    <div className="flex flex-col h-full bg-[#fafafa]">
      <div className="px-6 py-6 border-b border-[#e8e6e3] bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-5 h-5 text-[#C108AB]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C108AB]">Phase 7.5</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Coaching Excellence</h1>
            <p className="text-sm text-[#555] mt-1">
              Develop your leadership capabilities through simulation, coaching, and structured reflection.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(193,8,171,0.08)] border border-[#C108AB]">
              <Sparkles className="w-4 h-4 text-[#C108AB]" />
              <span className="text-sm font-semibold text-[#C108AB]">75% Complete</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#555]">
              <Clock className="w-4 h-4" />
              2.5h this week
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {HUB_CARDS.map((card, idx) => (
            <motion.button
              key={card.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              onClick={() => setView(card.id)}
              className="text-left border border-[#e8e6e3] bg-white p-6 flex flex-col group"
            >
              <div className={`w-12 h-12 ${card.color} text-white flex items-center justify-center mb-4`}>
                {card.icon}
              </div>
              <h3 className="font-semibold text-[#1a1a1a] mb-2">{card.title}</h3>
              <p className="text-sm text-[#555] flex-1 mb-4">{card.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#999]">{card.count}</span>
                <div className="flex items-center gap-1 text-[#C108AB] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="lg:col-span-2 border border-[#e8e6e3] bg-white p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setView('simulation')}
                className="flex items-center gap-3 p-4 bg-[rgba(193,8,171,0.08)] border border-[#C108AB] hover:bg-[rgba(193,8,171,0.15)] transition-colors text-left"
              >
                <Target className="w-5 h-5 text-[#C108AB]" />
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">Start a Simulation</div>
                  <div className="text-xs text-[#555]">Practice a leadership scenario</div>
                </div>
              </button>
              <button
                onClick={() => setView('session')}
                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-500 hover:bg-blue-100 transition-colors text-left"
              >
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">Book a Session</div>
                  <div className="text-xs text-[#555]">Chat with NEXUS</div>
                </div>
              </button>
              <button
                onClick={() => setView('journal')}
                className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-500 hover:bg-amber-100 transition-colors text-left"
              >
                <BookOpen className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">Reflect & Journal</div>
                  <div className="text-xs text-[#555]">Process recent learnings</div>
                </div>
              </button>
              <button
                onClick={() => setView('peers')}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-500 hover:bg-green-100 transition-colors text-left"
              >
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-semibold text-[#1a1a1a]">Find a Peer</div>
                  <div className="text-xs text-[#555]">Connect for group coaching</div>
                </div>
              </button>
            </div>
          </div>

          <div className="border border-[#e8e6e3] bg-white p-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-3">Recent Activity</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#C108AB] text-white flex items-center justify-center flex-shrink-0">
                  <Play className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-sm text-[#1a1a1a]">Completed: "The Underperforming Direct Report"</div>
                  <div className="text-xs text-[#555]">Score: 82% • 2 days ago</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-sm text-[#1a1a1a]">New coaching session scheduled</div>
                  <div className="text-xs text-[#555]">Tomorrow at 10:00 AM</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3 h-3" />
                </div>
                <div>
                  <div className="text-sm text-[#1a1a1a]">Reflection journal entry added</div>
                  <div className="text-xs text-[#555]">3 insights captured</div>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderSimulation = () => (
    <SimulationCanvas
      scenario={coachingService.simulation.getById('sci-leadership-001')!}
      state={simState}
      onAction={handleSimAction}
      onReset={handleSimReset}
      onStart={handleStartSimulation}
    />
  );

  const renderPlayer = () => <ScenarioPlayer onComplete={() => {}} />;

  const renderSession = () => (
    <CoachingSessionView
      sessionId={session.id}
      focus={session.focus}
      methodology={session.methodology}
      agents={session.agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        color: '#C108AB',
        isActive: true,
      }))}
      messages={session.messages.map(m => ({
        id: m.id,
        role: m.role,
        sender: m.agentId === 'user-001' ? 'You' : session.agents.find(a => a.id === m.agentId)?.name ?? 'Coach',
        content: m.content,
        timestamp: m.timestamp,
      }))}
      onSendMessage={handleSendMessage}
      onAssignAction={handleAssignAction}
      onEndSession={handleEndSession}
      progress={session.progress}
    />
  );

  const renderJournal = () => (
    <ReflectionJournal
      prompts={prompts}
      onSubmit={handleReflectionSubmit}
      initialEntries={reflectionEntries}
    />
  );

  const renderPeers = () => (
    <div className="flex flex-col h-full bg-[#fafafa]">
      <div className="px-6 py-4 border-b border-[#e8e6e3] bg-white">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Peer Matching</h2>
        <p className="text-sm text-[#555]">Connect with peers for group coaching and mutual learning</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {peerMatches.map((match, i) => (
            <PeerMatchCard
              key={match.peer.id}
              peer={{
                id: match.peer.id,
                name: match.peer.name,
                role: match.peer.role,
                organization: match.peer.organization,
                level: match.peer.level,
                skills: match.peer.skills,
                strengths: match.peer.strengths,
                developmentAreas: match.peer.developmentAreas,
                rating: match.peer.rating,
                completedSessions: match.peer.completedSessions,
                timezone: match.peer.timezone,
                availability: match.peer.availability,
                preferredMethodology: match.peer.preferredMethodology,
              }}
              score={match.score}
              quality={match.quality}
              onAccept={() => {}}
              onDecline={() => {}}
              onViewProfile={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurriculum = () => (
    <LearningPath
      title={learningPath.title}
      description={learningPath.description}
      progress={65}
      modules={learningPath.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        level: m.level,
        estimatedDuration: m.estimatedDuration,
        status: m.id === learningPath.modules[0].id ? 'completed' : m.id === learningPath.modules[1].id ? 'in-progress' : 'not-started',
        steps: m.resources.map((r, i) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          status: i === 0 ? 'completed' : 'not-started',
          type: r.type,
          duration: r.duration,
          score: i === 0 ? 0.85 : undefined,
        })),
      }))}
      onStepClick={() => {}}
      onModuleComplete={() => {}}
    />
  );

  const renderProgress = () => (
    <CoachingProgress
      overallScore={progressData.overallScore}
      progressTrend={progressData.progressTrend}
      competencies={progressData.competencies}
      sessions={progressData.sessions}
      goals={progressData.goals}
      achievements={progressData.achievements}
      recommendations={progressData.recommendations}
    />
  );

  const views: Record<ViewMode, () => React.ReactNode> = {
    hub: renderHub,
    simulation: renderSimulation,
    player: renderPlayer,
    session: renderSession,
    journal: renderJournal,
    peers: renderPeers,
    curriculum: renderCurriculum,
    progress: renderProgress,
  };

  const showBackButton = view !== 'hub';

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <AnimatePresence mode="wait">
        {showBackButton && (
          <motion.div
            key="back-button"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-b border-[#e8e6e3] bg-white px-6 py-2"
          >
            <button
              onClick={() => setView('hub')}
              className="flex items-center gap-2 text-sm text-[#555] hover:text-[#C108AB] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Coaching Hub
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {views[view]()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import type { ReflectionEntry } from '@/api/_lib/reflectionJournal';
import type { SessionRecord, ProgressGoal } from '@/api/_lib/coachingProgressTracker';
