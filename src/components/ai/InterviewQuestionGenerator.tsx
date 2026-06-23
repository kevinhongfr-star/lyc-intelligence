// Phase 6.4: Interview Question Generator Component
// AI-Assisted Features - Generate interview questions from success profile

'use client';

import React, { useState, useCallback } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  Edit3,
  Save,
  Sparkles,
  X,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { generateInterviewQuestions, type InterviewQuestion, isAIConfigured } from '@/services/ai/aiService';
import { Button } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface SuccessProfile {
  id: string;
  required_experience_years: number;
  required_industries: string[];
  target_disc_profile: string;
  personality_indicators: Array<{
    trait: string;
    description: string;
  }>;
}

interface MandateInfo {
  id: string;
  title: string;
  keywords: string;
  location: string;
  seniority_level?: string;
}

interface InterviewQuestionGeneratorProps {
  mandate: MandateInfo;
  successProfile: SuccessProfile;
  /**
   * Callback when questions are saved
   */
  onSave?: (questions: InterviewQuestion[]) => void;
  /**
   * Existing questions to load (for editing)
   */
  existingQuestions?: InterviewQuestion[];
  /**
   * Callback to cancel
   */
  onCancel?: () => void;
}

type Step = 'configure' | 'generating' | 'review' | 'saving';
type CompetencyArea = 'Technical' | 'Leadership' | 'Cultural Fit' | 'Problem Solving';

const COMPETENCY_COLORS: Record<CompetencyArea, { bg: string; text: string }> = {
  Technical: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Leadership: { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Cultural Fit': { bg: 'bg-green-100', text: 'text-green-700' },
  'Problem Solving': { bg: 'bg-amber-100', text: 'text-amber-700' },
};

export function InterviewQuestionGenerator({
  mandate,
  successProfile,
  onSave,
  existingQuestions = [],
  onCancel,
}: InterviewQuestionGeneratorProps) {
  const [step, setStep] = useState<Step>(existingQuestions.length > 0 ? 'review' : 'configure');
  const [questions, setQuestions] = useState<InterviewQuestion[]>(existingQuestions);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const aiConfigured = isAIConfigured();

  // Generate questions
  const handleGenerate = async () => {
    if (!aiConfigured) {
      setError('AI is not configured. Please set VITE_DEEPSEEK_API_KEY.');
      return;
    }

    setStep('generating');
    setError(null);

    try {
      const result = await generateInterviewQuestions(mandate, successProfile);

      if (result.success && result.data) {
        setQuestions(result.data);
        setStep('review');
        // Expand all by default
        setExpandedQuestions(new Set(result.data.map(q => q.id)));
      } else {
        setError(result.error || 'Failed to generate questions');
        setStep('configure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      setStep('configure');
    }
  };

  // Add new question
  const handleAddQuestion = () => {
    const newQuestion: InterviewQuestion = {
      id: `manual-${Date.now()}`,
      question: '',
      competencyArea: 'Technical',
      whatToListenFor: '',
      followUpQuestion: '',
    };
    setQuestions([...questions, newQuestion]);
    setEditingId(newQuestion.id);
    setExpandedQuestions(new Set([...expandedQuestions, newQuestion.id]));
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // Update question
  const handleUpdateQuestion = (id: string, updates: Partial<InterviewQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  // Toggle expand
  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedQuestions(newExpanded);
  };

  // Save questions
  const handleSave = async () => {
    // Validate
    const emptyQuestions = questions.filter(q => !q.question.trim());
    if (emptyQuestions.length > 0) {
      setError('Please fill in all question text before saving');
      return;
    }

    setStep('saving');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave?.(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('review');
    }
  };

  // Group questions by competency
  const questionsByCompetency = questions.reduce((acc, q) => {
    const area = q.competencyArea as CompetencyArea;
    if (!acc[area]) acc[area] = [];
    acc[area].push(q);
    return acc;
  }, {} as Record<CompetencyArea, InterviewQuestion[]>);

  // Render configure step
  const renderConfigure = () => (
    <div className="space-y-6">
      <div className="bg-bg-alt rounded-lg p-4">
        <h3 className="font-medium text-text-primary mb-2">Mandate</h3>
        <p className="text-sm text-text-secondary">{mandate.title}</p>
        <p className="text-xs text-text-muted mt-1">
          {mandate.keywords} • {mandate.location}
        </p>
      </div>

      <div className="bg-bg-alt rounded-lg p-4">
        <h3 className="font-medium text-text-primary mb-2">Success Profile</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Experience:</span>
            <span className="ml-2 text-text-primary">{successProfile.required_experience_years} years</span>
          </div>
          <div>
            <span className="text-text-muted">DISC:</span>
            <span className="ml-2 text-text-primary">{successProfile.target_disc_profile}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-text-muted">Industries:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {successProfile.required_industries.map(industry => (
              <span key={industry} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                {industry}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-text-muted">Competencies:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {successProfile.personality_indicators.map(p => (
              <span key={p.trait} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                {p.trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleGenerate} className="flex-1">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Questions
        </Button>
      </div>
    </div>
  );

  // Render generating step
  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-text-primary">Generating Questions...</p>
        <p className="text-sm text-text-muted mt-1">
          Creating competency-based interview questions
        </p>
      </div>
    </div>
  );

  // Render question editor
  const renderQuestionEditor = (question: InterviewQuestion) => {
    const isEditing = editingId === question.id;
    const isExpanded = expandedQuestions.has(question.id);
    const competencyColor = COMPETENCY_COLORS[question.competencyArea as CompetencyArea] || COMPETENCY_COLORS.Technical;

    return (
      <div
        key={question.id}
        className={`border rounded-lg transition-colors ${
          isEditing ? 'border-primary' : 'border-border'
        }`}
      >
        {/* Question Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-alt transition-colors"
          onClick={() => handleToggleExpand(question.id)}
        >
          <button className="text-text-muted">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${competencyColor.bg} ${competencyColor.text}`}>
                {question.competencyArea}
              </span>
            </div>
            <p className="text-text-primary line-clamp-2">
              {question.question || '(No question text)'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(isEditing ? null : question.id);
              }}
              className="p-1 hover:bg-bg-alt rounded transition-colors"
            >
              <Edit3 className="w-4 h-4 text-text-muted" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteQuestion(question.id);
              }}
              className="p-1 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border">
            {isEditing ? (
              <>
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Question
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) => handleUpdateQuestion(question.id, { question: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary resize-none"
                    rows={2}
                    placeholder="Enter the interview question..."
                  />
                </div>

                {/* Competency Area */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Competency Area
                  </label>
                  <select
                    value={question.competencyArea}
                    onChange={(e) => handleUpdateQuestion(question.id, { competencyArea: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Leadership">Leadership</option>
                    <option value="Cultural Fit">Cultural Fit</option>
                    <option value="Problem Solving">Problem Solving</option>
                  </select>
                </div>

                {/* What to Listen For */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    What to Listen For
                  </label>
                  <textarea
                    value={question.whatToListenFor}
                    onChange={(e) => handleUpdateQuestion(question.id, { whatToListenFor: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary resize-none"
                    rows={2}
                    placeholder="Key indicators in a good answer..."
                  />
                </div>

                {/* Follow-up Question */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Follow-up Question
                  </label>
                  <textarea
                    value={question.followUpQuestion}
                    onChange={(e) => handleUpdateQuestion(question.id, { followUpQuestion: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary resize-none"
                    rows={2}
                    placeholder="A probing follow-up question..."
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => setEditingId(null)}
                  className="w-full"
                >
                  Done Editing
                </Button>
              </>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">What to Listen For</h4>
                  <p className="text-sm text-text-primary">{question.whatToListenFor || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-1">Follow-up Question</h4>
                  <p className="text-sm text-text-primary">{question.followUpQuestion || 'Not specified'}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render review step
  const renderReview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Generated Questions ({questions.length})
        </h3>
        <Button size="sm" variant="outline" onClick={handleAddQuestion}>
          <Plus className="w-4 h-4 mr-1" />
          Add Question
        </Button>
      </div>

      {/* Grouped by Competency */}
      {(['Technical', 'Leadership', 'Cultural Fit', 'Problem Solving'] as CompetencyArea[]).map(area => {
        const areaQuestions = questionsByCompetency[area];
        if (!areaQuestions?.length) return null;

        const competencyColor = COMPETENCY_COLORS[area];

        return (
          <div key={area}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 text-xs font-medium rounded ${competencyColor.bg} ${competencyColor.text}`}>
                {area}
              </span>
              <span className="text-sm text-text-muted">
                {areaQuestions.length} questions
              </span>
            </div>
            <div className="space-y-2">
              {areaQuestions.map(q => renderQuestionEditor(q))}
            </div>
          </div>
        );
      })}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => {
            setStep('configure');
            setQuestions([]);
          }}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
        <Button
          onClick={handleSave}
          disabled={step === 'saving'}
          className="flex-1"
        >
          {step === 'saving' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Question Set
        </Button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="space-y-4">
      {step === 'configure' && renderConfigure()}
      {step === 'generating' && renderGenerating()}
      {step === 'review' && renderReview()}
    </div>
  );
}

// Compact button version
export function InterviewQuestionGeneratorButton({
  mandate,
  successProfile,
  onQuestionsGenerated,
}: {
  mandate: MandateInfo;
  successProfile: SuccessProfile;
  onQuestionsGenerated: (questions: InterviewQuestion[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Generate Interview Questions
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Interview Question Generator
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-bg-alt rounded transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <CardContent className="p-6">
              <InterviewQuestionGenerator
                mandate={mandate}
                successProfile={successProfile}
                onSave={(questions) => {
                  onQuestionsGenerated(questions);
                  setIsOpen(false);
                }}
                onCancel={() => setIsOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default InterviewQuestionGenerator;
