/**
 * CandidateAdvancedAssessmentsPage — Candidate Portal advanced assessments
 * Renders inside AppShell → Outlet. Shows specialized assessments,
 * deep-dive evaluations, and certification prep.
 */
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Brain, Target, Award, Clock, Star, ArrowRight, BarChart3, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: 'Cognitive' | 'Personality' | 'Skills' | 'Executive';
  duration: number;
  questions: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'Available' | 'In Progress' | 'Completed';
  score?: number;
  icon: React.ReactNode;
}

const MOCK_ASSESSMENTS: Assessment[] = [
  { id: 'a1', title: 'Executive Leadership Assessment', description: 'Comprehensive 360° leadership evaluation', category: 'Executive', duration: 90, questions: 120, difficulty: 'Expert', status: 'Completed', score: 88, icon: <Award className="w-5 h-5" /> },
  { id: 'a2', title: 'Strategic Thinking Deep Dive', description: 'Case-based strategic reasoning evaluation', category: 'Cognitive', duration: 60, questions: 40, difficulty: 'Advanced', status: 'In Progress', icon: <Brain className="w-5 h-5" /> },
  { id: 'a3', title: 'System Design Mastery', description: 'Senior+ engineering system design', category: 'Skills', duration: 120, questions: 15, difficulty: 'Expert', status: 'Available', icon: <Target className="w-5 h-5" /> },
  { id: 'a4', title: 'EQ & Self-Awareness', description: 'Emotional intelligence profiling', category: 'Personality', duration: 45, questions: 80, difficulty: 'Intermediate', status: 'Available', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'a5', title: 'Board Readiness', description: 'Director/VP level board competencies', category: 'Executive', duration: 75, questions: 60, difficulty: 'Expert', status: 'Available', icon: <Star className="w-5 h-5" /> },
  { id: 'a6', title: 'Crisis Management Simulation', description: 'Real-time crisis decision scenarios', category: 'Cognitive', duration: 90, questions: 25, difficulty: 'Advanced', status: 'Available', icon: <ClipboardCheck className="w-5 h-5" /> },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green/10 text-green',
  Intermediate: 'bg-blue/10 text-blue',
  Advanced: 'bg-amber/10 text-amber',
  Expert: 'bg-fuchsia/10 text-fuchsia',
};

const CATEGORY_COLORS: Record<string, string> = {
  Cognitive: 'bg-blue/10 text-blue',
  Personality: 'bg-amber/10 text-amber',
  Skills: 'bg-green/10 text-green',
  Executive: 'bg-fuchsia/10 text-fuchsia',
};

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-blue/10 text-blue',
  'In Progress': 'bg-amber/10 text-amber',
  Completed: 'bg-green/10 text-green',
};

export function CandidateAdvancedAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Cognitive' | 'Personality' | 'Skills' | 'Executive'>('All');
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAssessments(MOCK_ASSESSMENTS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  const filtered = filter === 'All' ? assessments : assessments.filter(a => a.category === filter);

  const completed = assessments.filter(a => a.status === 'Completed').length;
  const inProgress = assessments.filter(a => a.status === 'In Progress').length;
  const avgScore = assessments.filter(a => a.score).reduce((sum, a) => sum + (a.score || 0), 0) /
    (assessments.filter(a => a.score).length || 1);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Advanced Assessments</h1>
            <p className="text-text-secondary text-sm mt-1">Deep-dive evaluations and specialized assessments for executive roles.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : assessments.length}</div>
              <div className="text-xs text-text-muted">Total Available</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : inProgress}</div>
              <div className="text-xs text-text-muted">In Progress</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : completed}</div>
              <div className="text-xs text-text-muted">Completed</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : Math.round(avgScore)}</div>
              <div className="text-xs text-text-muted">Avg Score</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['All', 'Cognitive', 'Personality', 'Skills', 'Executive'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-fuchsia text-white'
                : 'bg-bg-warm text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-8 text-center text-text-muted text-sm">Loading assessments...</div>
        ) : (
          filtered.map((assessment) => (
            <Card key={assessment.id} className="p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia">
                  {assessment.icon}
                </div>
                <Badge className={STATUS_COLORS[assessment.status]}>{assessment.status}</Badge>
              </div>
              <h3 className="font-serif font-bold text-lg text-text-primary mb-1">{assessment.title}</h3>
              <p className="text-xs text-text-muted mb-3">{assessment.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={CATEGORY_COLORS[assessment.category]}>{assessment.category}</Badge>
                <Badge className={DIFFICULTY_COLORS[assessment.difficulty]}>{assessment.difficulty}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {assessment.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" /> {assessment.questions} questions
                </div>
              </div>
              {assessment.score !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-secondary">Your Score</span>
                    <span className="font-bold text-fuchsia">{assessment.score}/100</span>
                  </div>
                  <Progress value={assessment.score} className="h-2" />
                </div>
              )}
              <Button className="w-full" size="sm" variant={assessment.status === 'Available' ? 'default' : 'outline'}>
                {assessment.status === 'Completed' ? 'View Results' : assessment.status === 'In Progress' ? 'Continue' : 'Start Assessment'}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CandidateAdvancedAssessmentsPage;
