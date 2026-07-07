import React from 'react';
import { FileText, Clock, Play, ChevronRight, CheckCircle2 } from 'lucide-react';

export interface Assessment {
  id: string;
  name: string;
  duration: string;
  questions: number;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
  score?: number;
  percentile?: string;
}

const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'shift-behavioral',
    name: 'SHIFT Behavioral Assessment',
    duration: '45 min',
    questions: 120,
    description: 'Comprehensive personality & behavioral analysis',
    status: 'not_started',
  },
  {
    id: 'cognitive-ability',
    name: 'Cognitive Ability Test',
    duration: '30 min',
    questions: 50,
    description: 'Problem solving & critical reasoning',
    status: 'completed',
    score: 82,
    percentile: '82nd percentile',
  },
  {
    id: 'leadership-style',
    name: 'Leadership Style Deep-Dive',
    duration: '25 min',
    questions: 60,
    description: '8 leadership dimensions',
    status: 'in_progress',
    progress: 50,
  },
  {
    id: 'cultural-fit',
    name: 'Cultural Fit Assessment',
    duration: '20 min',
    questions: 40,
    description: 'Values & culture alignment',
    status: 'not_started',
  },
];

interface PremiumAssessmentsProps {
  assessments?: Assessment[];
}

export function PremiumAssessments({ assessments = MOCK_ASSESSMENTS }: PremiumAssessmentsProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary">
      <div className="flex items-center gap-2 p-4 border-b border-bg-tertiary">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="font-serif text-sm font-bold text-text-primary tracking-wider">AVAILABLE ASSESSMENTS</h2>
      </div>
      <div>
        {assessments.map((assessment, index) => (
          <div
            key={assessment.id}
            className={`flex justify-between items-center p-4 ${
              index < assessments.length - 1 ? 'border-b border-bg-tertiary' : ''
            }`}
          >
            <div className="flex-1">
              <h3 className="font-serif font-medium text-text-primary">{assessment.name}</h3>
              <p className="text-sm text-text-muted mt-1">{assessment.description}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>{assessment.duration}</span>
                <span> | </span>
                <span>{assessment.questions} questions</span>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-6">
              {assessment.status === 'not_started' && (
                <>
                  <span className="text-xs text-text-muted">Not started</span>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
                    <Play className="w-4 h-4" />
                    Start Assessment
                  </button>
                </>
              )}
              {assessment.status === 'in_progress' && (
                <>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-warning">In progress</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-bg-tertiary">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${assessment.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">30/60</span>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 px-4 py-2 border border-accent text-accent text-sm hover:bg-accent hover:text-white transition-colors">
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              {assessment.status === 'completed' && (
                <>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-teal">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                    <div className="font-serif font-bold text-text-primary">
                      {assessment.percentile}
                    </div>
                  </div>
                  <button className="text-accent text-sm hover:underline">
                    View Results
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
