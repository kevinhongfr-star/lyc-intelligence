import React, { useState } from 'react';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  ChevronLeft,
  User,
  Calendar,
  Clock,
  Target
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import type { InterviewRecommendation } from '@/services/supabaseApi';

export interface ScorecardFormData {
  competency_scores: Record<string, number>;
  overall_score: number;
  strengths: string;
  concerns: string;
  recommendation: InterviewRecommendation;
}

export interface InterviewScorecardProps {
  interview: {
    id: string;
    candidate_name: string;
    round: number;
    interview_date: string;
    mandate_title: string;
    client_name: string;
  };
  panelistId: string;
  existingScorecard?: ScorecardFormData;
  onSubmit: (data: ScorecardFormData) => Promise<void>;
  onBack?: () => void;
}

const COMPETENCIES = [
  { id: 'technical', name: 'Technical Expertise', description: 'Depth of technical knowledge and expertise' },
  { id: 'communication', name: 'Communication Skills', description: 'Ability to communicate effectively' },
  { id: 'leadership', name: 'Leadership Potential', description: 'Potential for leadership roles' },
  { id: 'cultural_fit', name: 'Cultural Fit', description: 'Alignment with company culture' },
  { id: 'problem_solving', name: 'Problem-Solving', description: 'Ability to solve complex problems' },
];

const RECOMMENDATION_OPTIONS: Array<{ value: InterviewRecommendation; label: string; color: string }> = [
  { value: 'strong_hire', label: 'Strong Hire', color: 'bg-green-100 text-green-700' },
  { value: 'hire', label: 'Hire', color: 'bg-blue-100 text-blue-700' },
  { value: 'no_hire', label: 'No Hire', color: 'bg-amber-100 text-amber-700' },
  { value: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-100 text-red-700' },
];

export function InterviewScorecard({
  interview,
  panelistId,
  existingScorecard,
  onSubmit,
  onBack,
}: InterviewScorecardProps) {
  const [formData, setFormData] = useState<ScorecardFormData>({
    competency_scores: existingScorecard?.competency_scores || COMPETENCIES.reduce((acc, c) => ({ ...acc, [c.id]: 5 }), {}),
    overall_score: existingScorecard?.overall_score || 5,
    strengths: existingScorecard?.strengths || '',
    concerns: existingScorecard?.concerns || '',
    recommendation: existingScorecard?.recommendation || 'hire',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCompetencyChange = (competencyId: string, score: number) => {
    setFormData(prev => ({
      ...prev,
      competency_scores: {
        ...prev.competency_scores,
        [competencyId]: score,
      },
    }));
  };

  const handleOverallScoreChange = (score: number) => {
    setFormData(prev => ({ ...prev, overall_score: score }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.strengths.trim()) {
      newErrors.strengths = 'Please provide at least one strength';
    }
    if (!formData.recommendation) {
      newErrors.recommendation = 'Please select a recommendation';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        strengths: formData.strengths.trim(),
        concerns: formData.concerns.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-xl font-bold text-text-primary">Interview Scorecard</h1>
        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Interview Info */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <User className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary">{interview.candidate_name}</h2>
            <p className="text-text-muted">{interview.mandate_title}</p>
          </div>
          <Badge variant="default">Round {interview.round}</Badge>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(interview.interview_date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatTime(interview.interview_date)}
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {interview.client_name}
          </span>
        </div>
      </div>

      {/* Competency Scores */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          Competency Scores
        </h3>
        <p className="text-sm text-text-muted mb-6">Rate the candidate on a scale of 1-10 for each competency</p>
        
        <div className="space-y-6">
          {COMPETENCIES.map(competency => (
            <div key={competency.id}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-text-primary">{competency.name}</p>
                  <p className="text-sm text-text-muted">{competency.description}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${getScoreBgColor(formData.competency_scores[competency.id])} flex items-center justify-center`}>
                  <span className={`text-xl font-bold ${getScoreColor(formData.competency_scores[competency.id])}`}>
                    {formData.competency_scores[competency.id]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    key={num}
                    onClick={() => handleCompetencyChange(competency.id, num)}
                    className={`flex-1 h-10 rounded-lg text-sm font-medium transition-all ${
                      formData.competency_scores[competency.id] === num
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          Overall Score
        </h3>
        <p className="text-sm text-text-muted mb-6">Provide an overall rating for this candidate</p>
        
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button
                  key={num}
                  onClick={() => handleOverallScoreChange(num)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    formData.overall_score === num
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div className={`w-20 h-20 rounded-full ${getScoreBgColor(formData.overall_score)} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${getScoreColor(formData.overall_score)}`}>
              {formData.overall_score}
            </span>
          </div>
        </div>
      </div>

      {/* Qualitative Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Strengths */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Strengths
          </h3>
          <p className="text-sm text-text-muted mb-3">What did the candidate do well?</p>
          <textarea
            value={formData.strengths}
            onChange={e => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
            rows={5}
            className={`w-full p-3 rounded-lg border ${errors.strengths ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:border-accent resize-none`}
            placeholder="List the candidate's key strengths and positive attributes..."
          />
          {errors.strengths && (
            <p className="text-red-500 text-sm mt-2">{errors.strengths}</p>
          )}
        </div>

        {/* Concerns */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Concerns
          </h3>
          <p className="text-sm text-text-muted mb-3">What areas need improvement?</p>
          <textarea
            value={formData.concerns}
            onChange={e => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
            rows={5}
            className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-accent resize-none"
            placeholder="List any concerns or areas where the candidate could improve..."
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-card border border-card-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Recommendation
        </h3>
        <p className="text-sm text-text-muted mb-4">What is your recommendation for this candidate?</p>
        
        <div className="grid grid-cols-2 gap-4">
          {RECOMMENDATION_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setFormData(prev => ({ ...prev, recommendation: option.value }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.recommendation === option.value
                  ? 'border-accent bg-accent/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {formData.recommendation === option.value ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className={`font-medium ${option.color.split(' ')[1]}`}>
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
        {errors.recommendation && (
          <p className="text-red-500 text-sm mt-3">{errors.recommendation}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Scorecard
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default InterviewScorecard;
