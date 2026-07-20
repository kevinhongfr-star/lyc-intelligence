/**
 * CandidateInterviewPrepPage — Candidate Portal interview preparation
 * Renders inside AppShell → Outlet. Shows prep tips by category and practice
 * questions with difficulty labels. Checklist state persisted to profile.
 */
import React, { useState, useEffect } from 'react';
import { Lightbulb, BookOpen, CheckCircle2, ChevronRight, Video, FileText, Brain, Target, Star, User, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Progress, Badge } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { supabase } from '@/lib/supabase/client';

// Static content - interview prep educational materials

interface PrepTip {
  id: string;
  category: string;
  icon: string;
  tips: string[];
}

interface PracticeQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  framework: string;
}

const STATIC_TIPS: PrepTip[] = [
  {
    id: 'tip1',
    category: 'Behavioral',
    icon: '💬',
    tips: [
      'Use the STAR framework (Situation, Task, Action, Result) for every story.',
      'Prepare 5–7 signature stories you can adapt to different questions.',
      'Quantify outcomes — numbers make your impact memorable.',
    ],
  },
  {
    id: 'tip2',
    category: 'Leadership',
    icon: '🧭',
    tips: [
      'Anchor examples in trade-offs you weighed, not just decisions you made.',
      'Show how you built and developed teams, not only what you shipped.',
      'Be ready to discuss a failure with clear reflection and what changed.',
    ],
  },
  {
    id: 'tip3',
    category: 'Case Study',
    icon: '🧩',
    tips: [
      'Structure first — lay out your approach before diving into analysis.',
      'Talk through your reasoning out loud so the interviewer can follow.',
      'Sanity-check numbers and tie the conclusion back to the original prompt.',
    ],
  },
  {
    id: 'tip4',
    category: 'Technical',
    icon: '⚙️',
    tips: [
      'Clarify requirements and constraints before writing any code.',
      'Narrate your thought process; silence reads as being stuck.',
      'Test edge cases out loud once you have a working solution.',
    ],
  },
];

const STATIC_QUESTIONS: PracticeQuestion[] = [
  { id: 'q1', question: 'Tell me about a time you led a team through ambiguity.', category: 'Behavioral', difficulty: 'Medium', framework: 'STAR' },
  { id: 'q2', question: 'Describe a strategic decision you made with incomplete data.', category: 'Leadership', difficulty: 'Hard', framework: 'STAR + Trade-offs' },
  { id: 'q3', question: 'Estimate the market size for premium EVs in Southeast Asia.', category: 'Case Study', difficulty: 'Hard', framework: 'Market Sizing' },
  { id: 'q4', question: 'How would you prioritize a roadmap with three competing stakeholder demands?', category: 'Case Study', difficulty: 'Medium', framework: 'RICE / Weighted' },
  { id: 'q5', question: 'Walk me through how you would scale a service to 10x traffic.', category: 'Technical', difficulty: 'Hard', framework: 'System Design' },
  { id: 'q6', question: 'Tell me about a time you influenced a decision without authority.', category: 'Behavioral', difficulty: 'Medium', framework: 'STAR' },
  { id: 'q7', question: 'What is the biggest risk in our current strategy and how would you mitigate it?', category: 'Leadership', difficulty: 'Hard', framework: 'Risk Matrix' },
  { id: 'q8', question: 'Describe a time you had to give difficult feedback to a peer.', category: 'Behavioral', difficulty: 'Easy', framework: 'STAR' },
];

const DIFFICULTY_COLORS: Record<PracticeQuestion['difficulty'], string> = {
  'Easy': 'bg-green/10 text-green',
  'Medium': 'bg-amber/10 text-amber',
  'Hard': 'bg-red/10 text-red',
};

const DEFAULT_CHECKLIST = [
  { id: 'c1', label: 'Research the company and recent news', done: false },
  { id: 'c2', label: 'Review the role spec and success profile', done: false },
  { id: 'c3', label: 'Prepare 5 STAR stories with quantified results', done: false },
  { id: 'c4', label: 'Practice 3 case studies out loud', done: false },
  { id: 'c5', label: 'Prepare thoughtful questions for the interviewer', done: false },
  { id: 'c6', label: 'Test video setup and environment', done: false },
];

export function CandidateInterviewPrepPage() {
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { candidateProfile, profile, user } = useTenantContext();

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  useEffect(() => {
    if (!user?.id) {
      setLoadingChecklist(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingChecklist(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('interview_prep_checklist')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled && !error && data?.interview_prep_checklist) {
          const stored = data.interview_prep_checklist;
          if (Array.isArray(stored) && stored.length > 0) {
            setChecklist(stored);
          }
        }
      } catch (e) {
        console.warn('[InterviewPrepPage] Failed to load checklist:', e);
      } finally {
        if (!cancelled) setLoadingChecklist(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistProgress = checklist.length ? Math.round((checklistDone / checklist.length) * 100) : 0;

  const toggleChecklistItem = async (id: string) => {
    if (!user?.id) return;

    const next = checklist.map(c => c.id === id ? { ...c, done: !c.done } : c);
    setChecklist(next);
    setSavingId(id);

    try {
      await supabase
        .from('profiles')
        .update({ interview_prep_checklist: next })
        .eq('id', user.id);
    } catch (e) {
      console.error('[InterviewPrepPage] Save checklist failed:', e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Interview Prep</h1>
            <p className="text-text-secondary text-sm mt-1">Frameworks, tips, and practice questions to help you perform your best.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Prep Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingChecklist ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse h-5 bg-bg-tertiary rounded" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-secondary">{checklistDone}/{checklist.length} complete</span>
                  <span className="text-fuchsia font-medium">{checklistProgress}%</span>
                </div>
                <Progress value={checklistProgress} className="mb-4" />
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className="flex items-start gap-2 text-sm w-full text-left group"
                    >
                      {savingId === item.id ? (
                        <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin text-fuchsia" />
                      ) : (
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${item.done ? 'text-fuchsia' : 'text-text-muted group-hover:text-fuchsia'}`} />
                      )}
                      <span className={item.done ? 'text-text-muted line-through' : 'text-text-primary'}>{item.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-3">
                  Checklist state is saved to your profile.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="text-left p-4 border border-border bg-white hover:border-fuchsia transition-colors rounded-lg">
                <Video className="w-5 h-5 text-fuchsia mb-2" />
                <div className="font-medium text-text-primary text-sm">Mock Interview</div>
                <div className="text-xs text-text-muted mt-1">Practice with NEXUS Coach</div>
              </button>
              <button className="text-left p-4 border border-border bg-white hover:border-fuchsia transition-colors rounded-lg">
                <FileText className="w-5 h-5 text-fuchsia mb-2" />
                <div className="font-medium text-text-primary text-sm">Company Brief</div>
                <div className="text-xs text-text-muted mt-1">Curated market intel</div>
              </button>
              <button className="text-left p-4 border border-border bg-white hover:border-fuchsia transition-colors rounded-lg">
                <Brain className="w-5 h-5 text-fuchsia mb-2" />
                <div className="font-medium text-text-primary text-sm">Question Bank</div>
                <div className="text-xs text-text-muted mt-1">Role-specific prompts</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-fuchsia" />
            <CardTitle>Prep Tips by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATIC_TIPS.map((tip) => (
              <div key={tip.id} className="p-4 bg-bg-warm rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tip.icon}</span>
                  <h3 className="font-medium text-text-primary text-sm">{tip.category}</h3>
                </div>
                <ul className="space-y-1.5">
                  {tip.tips.map((t, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 text-fuchsia flex-shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-fuchsia" />
            <CardTitle>Practice Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {STATIC_QUESTIONS.map((q) => (
              <div key={q.id} className="flex items-start justify-between p-4 bg-bg-warm rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-fuchsia" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary text-sm">{q.question}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge className={DIFFICULTY_COLORS[q.difficulty]}>{q.difficulty}</Badge>
                      <span className="text-xs text-text-muted">{q.category}</span>
                      <span className="text-xs text-text-muted">·</span>
                      <span className="text-xs text-text-muted">{q.framework}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Star className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateInterviewPrepPage;