// Phase 7.2: Question Library Component
// Browse + filter + search questions

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Copy,
  Plus,
  ChevronDown,
  ChevronRight,
  Grid,
  List,
  RefreshCw,
  Loader2,
  X,
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
}

interface QuestionLibraryProps {
  userId: string;
  organizationId: string;
  /**
   * Callback when a question is selected
   */
  onSelectQuestion?: (question: Question) => void;
  /**
   * Callback when a question is cloned
   */
  onCloneQuestion?: (question: Question) => void;
  /**
   * Callback to view question detail
   */
  onViewDetail?: (questionId: string) => void;
  /**
   * Callback to create new question
   */
  onCreateQuestion?: () => void;
  /**
   * Callback to add to set
   */
  onAddToSet?: (question: Question) => void;
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

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Questions' },
  { value: 'system', label: 'System Questions' },
  { value: 'mine', label: 'My Questions' },
  { value: 'org', label: 'Organization' },
];

type ViewMode = 'grid' | 'list';

export function QuestionLibrary({
  userId,
  organizationId,
  onSelectQuestion,
  onCloneQuestion,
  onViewDetail,
  onCreateQuestion,
  onAddToSet,
}: QuestionLibraryProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('usage');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set('organization_id', organizationId);
        params.set('user_id', userId);

        const response = await fetch(`/api/data/questions?${params}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch questions');
        }

        setQuestions(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [organizationId, userId]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let filtered = questions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.questionText.toLowerCase().includes(query) ||
        q.competency.toLowerCase().includes(query) ||
        q.expectedAnswer?.toLowerCase().includes(query)
      );
    }

    // Competency filter
    if (selectedCompetencies.length > 0) {
      filtered = filtered.filter(q => selectedCompetencies.includes(q.competency));
    }

    // Difficulty filter
    if (selectedDifficulty !== null) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Source filter
    if (selectedSource === 'system') {
      filtered = filtered.filter(q => q.isSystem);
    } else if (selectedSource === 'mine') {
      filtered = filtered.filter(q => q.createdBy === userId);
    } else if (selectedSource === 'org') {
      filtered = filtered.filter(q => !q.isSystem && q.createdBy !== userId);
    }

    // Starred filter
    if (showStarredOnly) {
      filtered = filtered.filter(q => q.starredBy.includes(userId));
    }

    // Sort
    if (sortBy === 'usage') {
      filtered = filtered.sort((a, b) => b.usageCount - a.usageCount);
    } else if (sortBy === 'newest') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'alphabetical') {
      filtered = filtered.sort((a, b) => a.questionText.localeCompare(b.questionText));
    }

    return filtered;
  }, [questions, searchQuery, selectedCompetencies, selectedDifficulty, selectedSource, showStarredOnly, sortBy, userId]);

  // Handle star toggle
  const handleStar = async (questionId: string) => {
    try {
      await fetch(`/api/data/questions/${questionId}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      // Update local state
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          const isStarred = q.starredBy.includes(userId);
          return {
            ...q,
            starredBy: isStarred
              ? q.starredBy.filter(id => id !== userId)
              : [...q.starredBy, userId],
          };
        }
        return q;
      }));
    } catch (err) {
      console.error('Failed to star question:', err);
    }
  };

  // Handle competency toggle
  const handleCompetencyToggle = (competency: string) => {
    setSelectedCompetencies(prev =>
      prev.includes(competency)
        ? prev.filter(c => c !== competency)
        : [...prev, competency]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCompetencies([]);
    setSelectedDifficulty(null);
    setSelectedSource('all');
    setShowStarredOnly(false);
  };

  // Get competency config
  const getCompetencyConfig = (competency: string) => {
    return COMPETENCIES.find(c => c.value === competency) || COMPETENCIES[0];
  };

  // Render difficulty dots
  const renderDifficulty = (difficulty: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3].map(level => (
          <div
            key={level}
            className={`w-2 h-2 rounded-full ${
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

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center py-8">
          <X className="w-12 h-12 text-red-500" />
          <p className="text-text-primary mt-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Question Library</h2>
          <p className="text-sm text-text-muted">
            {filteredQuestions.length} questions available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCreateQuestion}>
            <Plus className="w-4 h-4 mr-1" />
            New Question
          </Button>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-3 py-2 border border-border rounded-none bg-bg-base text-text-primary"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(selectedCompetencies.length > 0 || selectedDifficulty || selectedSource !== 'all' || showStarredOnly) && (
            <Badge variant="primary" className="ml-1">
              {selectedCompetencies.length + (selectedDifficulty ? 1 : 0) + (selectedSource !== 'all' ? 1 : 0) + (showStarredOnly ? 1 : 0)}
            </Badge>
          )}
        </Button>

        {/* View Mode */}
        <div className="flex items-center gap-1 bg-bg-alt rounded-none p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-muted'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-border rounded-none bg-bg-base text-text-primary"
        >
          <option value="usage">Most Used</option>
          <option value="newest">Newest</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            {/* Competencies */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Competencies
              </label>
              <div className="flex flex-wrap gap-2">
                {COMPETENCIES.map(comp => (
                  <button
                    key={comp.value}
                    onClick={() => handleCompetencyToggle(comp.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCompetencies.includes(comp.value)
                        ? comp.color
                        : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                    }`}
                  >
                    {comp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === level ? null : level)}
                    className={`px-3 py-1.5 rounded-none text-sm font-medium transition-colors ${
                      selectedDifficulty === level
                        ? 'bg-primary text-white'
                        : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                    }`}
                  >
                    {DIFFICULTY_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Source
              </label>
              <div className="flex gap-2">
                {SOURCE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedSource(option.value)}
                    className={`px-3 py-1.5 rounded-none text-sm font-medium transition-colors ${
                      selectedSource === option.value
                        ? 'bg-primary text-white'
                        : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starred */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStarredOnly(!showStarredOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-none text-sm font-medium transition-colors ${
                  showStarredOnly
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-bg-alt text-text-muted hover:bg-bg-base'
                }`}
              >
                <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
                Starred Only
              </button>
            </div>

            {/* Clear Filters */}
            <Button variant="outline" onClick={clearFilters} className="text-sm">
              Clear All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Questions List/Grid */}
      {filteredQuestions.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-text-muted">No questions match your filters</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear Filters
          </Button>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {filteredQuestions.map(question => {
            const compConfig = getCompetencyConfig(question.competency);
            const isStarred = question.starredBy.includes(userId);

            return (
              <Card
                key={question.id}
                className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
                onClick={() => onViewDetail?.(question.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Star */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStar(question.id);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-amber-50 rounded transition-colors"
                  >
                    <Star className={`w-5 h-5 ${isStarred ? 'text-amber-500 fill-current' : 'text-text-muted'}`} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary line-clamp-2">
                      {question.questionText}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${compConfig.color}`}>
                        {compConfig.label}
                      </span>
                      {renderDifficulty(question.difficulty)}
                      <span className="text-xs text-text-muted">
                        Used {question.usageCount} times
                      </span>
                      {question.isSystem && (
                        <Badge variant="outline" className="text-xs">System</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloneQuestion?.(question);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToSet?.(question);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredQuestions.map(question => {
            const compConfig = getCompetencyConfig(question.competency);
            const isStarred = question.starredBy.includes(userId);

            return (
              <Card
                key={question.id}
                className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
                onClick={() => onViewDetail?.(question.id)}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${compConfig.color}`}>
                      {compConfig.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStar(question.id);
                      }}
                      className="p-1"
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'text-amber-500 fill-current' : 'text-text-muted'}`} />
                    </button>
                  </div>

                  {/* Question */}
                  <p className="text-sm text-text-primary line-clamp-3">
                    {question.questionText}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {renderDifficulty(question.difficulty)}
                    <span className="text-xs text-text-muted">
                      {question.usageCount} uses
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default QuestionLibrary;