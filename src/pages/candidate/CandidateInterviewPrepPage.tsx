/**
 * CandidateInterviewPrepPage — Candidate Portal interview preparation
 * Renders inside AppShell → Outlet. Shows prep tips by category and practice
 * questions with difficulty labels.
 */
import React, { useState } from 'react';
import { Lightbulb, BookOpen, CheckCircle2, ChevronRight, Video, FileText, Brain, Target, Star, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Progress } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

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

interface PrepChecklistItem {
  id: string;
  label: string;
  done: boolean;
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

const STATIC_CHECKLIST: PrepChecklistItem[] = [
  { id: 'c1', label: 'Research the company and recent news', done: true },
  { id: 'c2', label: 'Review the role spec and success profile', done: true },
  { id: 'c3', label: 'Prepare 5 STAR stories with quantified results', done: true },
  { id: 'c4', label: 'Practice 3 case studies out loud', done: false },
  { id: 'c5', label: 'Prepare thoughtful questions for the interviewer', done: false },
  { id: 'c6', label: 'Test video setup and environment', done: false },
];

export function CandidateInterviewPrepPage() {
  const tips = STATIC_TIPS;
  const questions = STATIC_QUESTIONS;
  const checklist = STATIC_CHECKLIST;
  const { candidateProfile, profile } = useTenantContext();

  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistProgress = checklist.length ? Math.round((checklistDone / checklist.length) * 100) : 0;

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  return (
    <div className="space-y-6">
      {/* Page header */}
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

      {/* Prep checklist + resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Prep Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary">{checklistDone}/{checklist.length} complete</span>
              <span className="text-fuchsia font-medium">{checklistProgress}%</span>
            </div>
            <Progress value={checklistProgress} className="mb-4" />
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.done ? 'text-fuchsia' : 'text-text-muted'}`} />
                  <span className={item.done ? 'text-text-muted line-through' : 'text-text-primary'}>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick resources */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button className="text-left p-4 border border-border bg-white hover:border-fuchsia transition-colors" style={{ borderRadius: 0 }}>
                <Video className="w-5 h-5 text-fuchsia mb-2" />
                <div className="font-medium text-text-primary text-sm">Mock Interview</div>
                <div className="text-xs text-text-muted mt-1">Practice with NEXUS Coach</div>
              </button>
              <button className="text-left p-4 border border-border bg-white hover:border-fuchsia transition-colors" style={{ borderRadius: 0 }}>
                <FileText className="w-5 h-5 text-fuchsia mb-2" />
                <div className="font-medium text-text-primary text-sm">Company Brief</div>
                <div className="text-xs text-text-muted mt-1">Curated market intel</div>
              </button>
              <button className="text-left p-4 border border-border bg-white hover:border-fuchsia transition-colors" style={{ borderRadius: 0 }}>
                <Brain className="w-5 h-5 text-fuchsia mb-2" />
                <div className="font-medium text-text-primary text-sm">Question Bank</div>
                <div className="text-xs text-text-muted mt-1">Role-specific prompts</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips by category */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-fuchsia" />
          <h2 className="font-serif font-semibold text-lg text-text-primary">Tips by Category</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tips.map((tip) => (
            <Card key={tip.id} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{tip.icon}</span>
                <h3 className="font-serif font-semibold text-text-primary">{tip.category}</h3>
              </div>
              <ul className="space-y-2">
                {tip.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <ChevronRight className="w-3 h-3 mt-1 text-fuchsia flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      {/* Practice questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Practice Questions</CardTitle>
            <Button variant="outline" size="sm">
              <Star className="w-3 h-3" /> Save a set
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 py-3 border-b border-border last:border-b-0 hover:bg-bg-warm transition-colors -mx-4 px-4"
              >
                <div className="w-8 h-8 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-fuchsia" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{q.question}</p>
                  <div className="flex items-center gap-3 text-xs text-text-muted mt-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded bg-fuchsia-light text-fuchsia">{q.category}</span>
                      <span className={`px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                      <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3" /> {q.framework}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">Practice</Button>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateInterviewPrepPage;
