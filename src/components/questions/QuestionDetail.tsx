// Phase 7.2: Question Detail Component
// Edit + clone + star individual questions

'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Copy,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

interface Question {
  id: string;
  questionText: string;
  competency: string;
  difficulty: number;
  expectedAnswer: string;
  followUpQuestion: string;
  isSystem: boolean;
  createdBy: string | null;
  starredBy: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface QuestionDetailProps {
  questionId: string;
  userId: string;
  organizationId: string;
  /**
   * Callback to go back
   */
  onBack?: () => void;
  /**
   * Callback after saving
   */
  onSave?: (question: Question) => void;
  /**
   * Callback after cloning
   */
  onClone?: (question: Question) => void;
  /**
   * Callback after deleting
   */
  onDelete?: () => void;
}

const COMPETENCIES = [
  { value: 'technical', label: 'Technical', color: 'bg-blue-100 text-blue-700' },
  { value: 'leadership', label: 'Leadership', color: 'bg-purple-100 text-purple-700' },
  { value: 'communication', label: 'Communication', color: 'bg-green-100 text-green-700' },
  { value: 'problem_solving', label: 'Problem Solving', color: 'bg-amber-100 text-amber-700' },
  { value: 'teamwork', label: 'Teamwork', color: 'bg-pink-100 text-pink-700' },
  { value: 'cultural_fit', label: 'Cultural Fit', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'strategic_thinking', label: 'Strategic Thinking', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'adaptability', label: 'Adaptability', color: 'bg-teal-100 text-teal-700' },
  { value: 'decision_making', label: 'Decision Making', color: 'bg-orange-100 text-orange-700' },
  { value: 'customer_focus', label: 'Customer Focus', color: 'bg-lime-100 text-lime-700' },
  { value: 'innovation', label: 'Innovation', color: 'bg-violet-100 text-violet-700' },
  { value: 'execution', label: 'Execution', color: 'bg-red-100 text-red-700' },
];

const DIFFICULTY_LABELS = {
  1: 'Junior',
  2: 'Mid-Level',
  3: 'Senior',
};

type Mode = 'view' | 'edit' | 'clone';

export function QuestionDetail({
  questionId,
  userId,
  organizationId,
  onBack,
  onSave,
  onClone,
  onDelete,
}: QuestionDetailProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    questionText: '',
    competency: '',
    difficulty: 2,
    expectedAnswer: '',
    followUpQuestion: '',
  });

  // Fetch question
  useEffect(() => {
    async function fetchQuestion() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/data/questions/${questionId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch question');
        }

        const q = result.data;
        setQuestion(q);
        setEditForm({
          questionText: q.questionText,
          competency: q.competency,
          difficulty: q.difficulty,
          expectedAnswer: q.expectedAnswer || '',
          followUpQuestion: q.followUpQuestion || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestion();
  }, [questionId]);

  // Handle star toggle
  const handleStar = async () => {
    if (!question) return;

    try {
      await fetch(`/api/data/questions/${questionId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const isStarred = question.starredBy.includes(userId);
      setQuestion({
        ...question,
        starredBy: isStarred
          ? question.starredBy.filter(id => id !== userId)
          : [...question.starredBy, userId],
      });
    } catch (err) {
      console.error('Failed to star question:', err);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!editForm.questionText.trim() || !editForm.competency) {
      setSaveError('Question text and competency are required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/data/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      setQuestion(result.data);
      setMode('view');
      onSave?.(result.data);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle clone
  const handleClone = async () => {
    if (!question) return;

    setIsSaving(true);

    try {
      const response = await fetch('/api/data/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: question.questionText,
          competency: question.competency,
          difficulty: question.difficulty,
          expected_answer: question.expectedAnswer,
          follow_up_question: question.followUpQuestion,
          organization_id: organizationId,
          created_by: userId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to clone');
      }

      onClone?.(result.data);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to clone');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!question || question.isSystem) return;

    if (!confirm('Are you sure you want to delete this question?')) return;

    setIsSaving(true);

    try {
      await fetch(`/api/data/questions/${questionId}`, {
        method: 'DELETE',
      });

      onDelete?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsSaving(false);
    }
  };

  // Get competency config
  const getCompetencyConfig = (competency: string) => {
    return COMPETENCIES.find(c => c.value === competency) || COMPETENCIES[0];
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading question...</span>
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !question) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-text-primary mt-4">{error || 'Question not found'}</p>
          {onBack && (
            <Button variant="outline" onClick={onBack} className="mt-4">
              Go Back
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const compConfig = getCompetencyConfig(question.competency);
  const isStarred = question.starredBy.includes(userId);
  const canEdit = !question.isSystem && question.createdBy === userId;
  const canDelete = !question.isSystem && question.createdBy === userId;

  // Clone mode - show form with pre-filled values
  if (mode === 'clone') {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Clone Question</h2>
            <Button variant="ghost" onClick={() => setMode('view')}>
              Cancel
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Question Text
            </label>
            <textarea
              value={editForm.questionText}
              onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Competency
              </label>
              <select
                value={editForm.competency}
                onChange={(e) => setEditForm({ ...editForm, competency: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary"
              >
                {COMPETENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Difficulty
              </label>
              <select
                value={editForm.difficulty}
                onChange={(e) => setEditForm({ ...editForm, difficulty: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary"
              >
                {[1, 2, 3].map(d => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Expected Answer (What to Listen For)
            </label>
            <textarea
              value={editForm.expectedAnswer}
              onChange={(e) => setEditForm({ ...editForm, expectedAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Follow-up Question
            </label>
            <textarea
              value={editForm.followUpQuestion}
              onChange={(e) => setEditForm({ ...editForm, followUpQuestion: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={2}
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setMode('view')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Clone Question
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Edit Question</h2>
            <Button variant="ghost" onClick={() => setMode('view')}>
              Cancel
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Question Text
            </label>
            <textarea
              value={editForm.questionText}
              onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Competency
              </label>
              <select
                value={editForm.competency}
                onChange={(e) => setEditForm({ ...editForm, competency: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary"
              >
                {COMPETENCIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Difficulty
              </label>
              <select
                value={editForm.difficulty}
                onChange={(e) => setEditForm({ ...editForm, difficulty: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary"
              >
                {[1, 2, 3].map(d => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Expected Answer (What to Listen For)
            </label>
            <textarea
              value={editForm.expectedAnswer}
              onChange={(e) => setEditForm({ ...editForm, expectedAnswer: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Follow-up Question
            </label>
            <textarea
              value={editForm.followUpQuestion}
              onChange={(e) => setEditForm({ ...editForm, followUpQuestion: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={2}
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-none text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{saveError}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setMode('view')} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // View mode
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <div className="flex items-center gap-2">
          {question.isSystem && (
            <Badge variant="outline">System Question</Badge>
          )}
          <button
            onClick={handleStar}
            className="p-2 hover:bg-amber-50 rounded transition-colors"
          >
            <Star className={`w-5 h-5 ${isStarred ? 'text-amber-500 fill-current' : 'text-text-muted'}`} />
          </button>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Question Text */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {question.questionText}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${compConfig.color}`}>
                {compConfig.label}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(level => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-full ${
                      level <= question.difficulty ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                ))}
                <span className="text-sm text-text-muted ml-1">
                  {DIFFICULTY_LABELS[question.difficulty]}
                </span>
              </div>
              <span className="text-sm text-text-muted">
                Used {question.usageCount} times
              </span>
            </div>
          </div>

          {/* Expected Answer */}
          {question.expectedAnswer && (
            <div className="bg-green-50 border border-green-200 rounded-none p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">
                What to Listen For
              </h3>
              <p className="text-sm text-green-700 whitespace-pre-wrap">
                {question.expectedAnswer}
              </p>
            </div>
          )}

          {/* Follow-up Question */}
          {question.followUpQuestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-none p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Follow-up Question
              </h3>
              <p className="text-sm text-blue-700">
                {question.followUpQuestion}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setMode('clone')}>
              <Copy className="w-4 h-4 mr-2" />
              Clone to My Questions
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => setMode('edit')}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Usage History (placeholder) */}
      <Card className="p-4">
        <h3 className="font-medium text-text-primary mb-3">Usage History</h3>
        <p className="text-sm text-text-muted">
          This question has been used in {question.usageCount} interviews/assessments.
        </p>
      </Card>
    </div>
  );
}

export default QuestionDetail;