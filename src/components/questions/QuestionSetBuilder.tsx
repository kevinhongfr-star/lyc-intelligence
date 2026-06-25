// Phase 7.2: Question Set Builder Component
// Create + manage question sets

'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  GripVertical,
  Search,
  X,
  ChevronDown,
  ChevronRight,
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
}

interface QuestionSet {
  id: string;
  name: string;
  description: string;
  questionIds: string[];
  isShared: boolean;
  createdAt: string;
}

interface QuestionSetBuilderProps {
  userId: string;
  organizationId: string;
  /**
   * Existing set to edit (optional)
   */
  existingSet?: QuestionSet;
  /**
   * Callback after saving
   */
  onSave?: (set: QuestionSet) => void;
  /**
   * Callback to cancel
   */
  onCancel?: () => void;
}

const COMPETENCY_COLORS: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-700',
  leadership: 'bg-purple-100 text-purple-700',
  communication: 'bg-green-100 text-green-700',
  problem_solving: 'bg-amber-100 text-amber-700',
  teamwork: 'bg-pink-100 text-pink-700',
  cultural_fit: 'bg-indigo-100 text-indigo-700',
  strategic_thinking: 'bg-cyan-100 text-cyan-700',
  adaptability: 'bg-teal-100 text-teal-700',
  decision_making: 'bg-orange-100 text-orange-700',
  customer_focus: 'bg-lime-100 text-lime-700',
  innovation: 'bg-violet-100 text-violet-700',
  execution: 'bg-red-100 text-red-700',
};

const DIFFICULTY_LABELS = {
  1: 'Junior',
  2: 'Mid-Level',
  3: 'Senior',
};

export function QuestionSetBuilder({
  userId,
  organizationId,
  existingSet,
  onSave,
  onCancel,
}: QuestionSetBuilderProps) {
  const [name, setName] = useState(existingSet?.name || '');
  const [description, setDescription] = useState(existingSet?.description || '');
  const [isShared, setIsShared] = useState(existingSet?.isShared || false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);

  // Fetch available questions
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('organization_id', organizationId);

        const response = await authFetch(`/api/data/questions?${params}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch questions');
        }

        setAvailableQuestions(result.data);

        // If editing existing set, load its questions
        if (existingSet?.questionIds?.length > 0) {
          const selected = result.data.filter(q => existingSet.questionIds.includes(q.id));
          setSelectedQuestions(selected);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [organizationId, existingSet]);

  // Filter available questions by search
  const filteredAvailable = availableQuestions.filter(q =>
    !selectedQuestions.find(s => s.id === q.id) &&
    (searchQuery.trim() === '' ||
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.competency.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add question to set
  const handleAddQuestion = (question: Question) => {
    setSelectedQuestions([...selectedQuestions, question]);
    setShowQuestionPicker(false);
    setSearchQuery('');
  };

  // Remove question from set
  const handleRemoveQuestion = (questionId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  // Move question up/down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedQuestions.length) return;

    const newQuestions = [...selectedQuestions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setSelectedQuestions(newQuestions);
  };

  // Save set
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Set name is required');
      return;
    }

    if (selectedQuestions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const body = {
        name,
        description,
        question_ids: selectedQuestions.map(q => q.id),
        is_shared: isShared,
        organization_id: organizationId,
        created_by: userId,
      };

      const url = existingSet
        ? `/api/data/question-sets/${existingSet.id}`
        : '/api/data/question-sets';

      const method = existingSet ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save');
      }

      onSave?.(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Get competency color
  const getCompetencyColor = (competency: string) => {
    return COMPETENCY_COLORS[competency] || 'bg-gray-100 text-gray-700';
  };

  // Render difficulty dots
  const renderDifficulty = (difficulty: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3].map(level => (
          <div
            key={level}
            className={`w-1.5 h-1.5 rounded-full ${
              level <= difficulty ? 'bg-primary' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading questions...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {existingSet ? 'Edit Question Set' : 'Create Question Set'}
          </h2>
          {onCancel && (
            <button onClick={onCancel} className="p-1 hover:bg-bg-alt rounded transition-colors">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </div>

        {/* Set Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
              placeholder="e.g., Executive Leadership Assessment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary resize-none"
              rows={2}
              placeholder="Describe the purpose of this question set..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <label className="text-sm text-text-secondary">
              Share with organization
            </label>
          </div>
        </div>

        {/* Selected Questions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-text-primary">
              Questions ({selectedQuestions.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionPicker(!showQuestionPicker)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </Button>
          </div>

          {selectedQuestions.length === 0 ? (
            <div className="text-center py-8 bg-bg-alt rounded-lg">
              <p className="text-text-muted">No questions added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuestionPicker(true)}
                className="mt-3"
              >
                Add your first question
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center gap-3 p-3 bg-bg-alt rounded-lg"
                >
                  {/* Drag handle + order */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <GripVertical className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium text-text-muted w-6">
                      {index + 1}
                    </span>
                  </div>

                  {/* Question content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary line-clamp-2">
                      {question.questionText}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCompetencyColor(question.competency)}`}>
                        {question.competency.replace('_', ' ')}
                      </span>
                      {renderDifficulty(question.difficulty)}
                    </div>
                  </div>

                  {/* Move buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleMoveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-bg-base rounded disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4 rotate-[-90deg] text-text-muted" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(index, 'down')}
                      disabled={index === selectedQuestions.length - 1}
                      className="p-1 hover:bg-bg-base rounded disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4 rotate-[90deg] text-text-muted" />
                    </button>
                    <button
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question Picker */}
        {showQuestionPicker && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-text-primary">Available Questions</h4>
                <button
                  onClick={() => setShowQuestionPicker(false)}
                  className="p-1 hover:bg-bg-alt rounded"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
                />
              </div>

              {/* Question list */}
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredAvailable.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4">
                    No questions available
                  </p>
                ) : (
                  filteredAvailable.map(question => (
                    <button
                      key={question.id}
                      onClick={() => handleAddQuestion(question)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-bg-alt rounded-lg transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary line-clamp-1">
                          {question.questionText}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCompetencyColor(question.competency)}`}>
                            {question.competency.replace('_', ' ')}
                          </span>
                          {renderDifficulty(question.difficulty)}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Question Set
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Question Set List Component
export function QuestionSetList({
  userId,
  organizationId,
  onSelectSet,
  onEditSet,
}: {
  userId: string;
  organizationId: string;
  onSelectSet?: (set: QuestionSet) => void;
  onEditSet?: (set: QuestionSet) => void;
}) {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sets
  useEffect(() => {
    async function fetchSets() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('organization_id', organizationId);

        const response = await authFetch(`/api/data/question-sets?${params}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch sets');
        }

        setSets(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sets');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSets();
  }, [organizationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mx-auto" />
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>No question sets created yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sets.map(set => (
        <Card
          key={set.id}
          className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
          onClick={() => onSelectSet?.(set)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{set.name}</p>
              <p className="text-sm text-text-muted mt-1">
                {set.questionIds.length} questions
                {set.isShared && ' • Shared'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditSet?.(set);
              }}
            >
              Edit
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default QuestionSetBuilder;