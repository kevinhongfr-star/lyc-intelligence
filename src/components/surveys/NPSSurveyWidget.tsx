/**
 * NPS Survey Engine — Issue #33: Candidate NPS Survey Engine
 *
 * Net Promoter Score surveys for candidates.
 * Tracks satisfaction and collects feedback.
 */
import React, { useState, useCallback } from 'react';
import { Star, Send, ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface NPSSurveyProps {
  surveyId: string;
  candidateId: string;
  onClose?: () => void;
  onSubmit?: (response: NPSResponse) => void;
}

interface NPSResponse {
  score: number;
  category: 'detractor' | 'passive' | 'promoter';
  feedback?: string;
  tags?: string[];
}

const FEEDBACK_TAGS = [
  { id: 'communication', label: 'Communication' },
  { id: 'transparency', label: 'Transparency' },
  { id: 'process', label: 'Process' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'support', label: 'Support' },
  { id: 'expertise', label: 'Expertise' },
];

/* ------------------------------------------------------------------ */
/* Survey Component                                                    */
/* ------------------------------------------------------------------ */

export function NPSSurveyWidget({ surveyId, candidateId, onClose, onSubmit }: NPSSurveyProps) {
  const [step, setStep] = useState<'score' | 'feedback' | 'thanks'>('score');
  const [score, setScore] = useState<number | null>(null);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleScoreSelect = useCallback((selectedScore: number) => {
    setScore(selectedScore);
  }, []);

  const handleContinue = useCallback(() => {
    if (score !== null) {
      setStep('feedback');
    }
  }, [score]);

  const handleSubmit = useCallback(async () => {
    if (score === null) return;

    setSubmitting(true);

    const category: 'detractor' | 'passive' | 'promoter' =
      score <= 6 ? 'detractor' : score <= 8 ? 'passive' : 'promoter';

    const response: NPSResponse = {
      score,
      category,
      feedback: feedback || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      await fetch('/api/nps-surveys/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          survey_id: surveyId,
          candidate_id: candidateId,
          ...response,
        }),
      });
    } catch {
      // Silently fail for now
    }

    onSubmit?.(response);
    setStep('thanks');
    setSubmitting(false);
  }, [score, feedback, tags, surveyId, candidateId, onSubmit]);

  const toggleTag = (tagId: string) => {
    setTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[16px]">
          {step === 'thanks' ? 'Thank you!' : 'How was your experience?'}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {step === 'score' && (
          <>
            <p className="text-[13px] text-[#6B6B6B] mb-4">
              On a scale of 0-10, how likely are you to recommend LYC Intelligence to a colleague?
            </p>

            {/* Score buttons */}
            <div className="flex justify-between mb-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleScoreSelect(i)}
                  onMouseEnter={() => setHoveredScore(i)}
                  onMouseLeave={() => setHoveredScore(null)}
                  className={`w-8 h-8 rounded-full text-[13px] font-medium transition-all ${
                    score === i
                      ? 'bg-[#1A1A1A] text-white'
                      : hoveredScore === i
                      ? 'bg-[#E5E5E5] text-[#1A1A1A]'
                      : 'bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#E5E5E5]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            {/* Labels */}
            <div className="flex justify-between text-[11px] text-[#9B9B9B] mb-4">
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3" />
                Not likely
              </span>
              <span className="flex items-center gap-1">
                Very likely
                <ThumbsUp className="h-3 w-3" />
              </span>
            </div>

            <Button
              className="w-full"
              onClick={handleContinue}
              disabled={score === null}
            >
              Continue
            </Button>
          </>
        )}

        {step === 'feedback' && (
          <>
            {/* Score display */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F0F0F0] mb-2">
                <span className="text-[20px] font-serif">{score}</span>
              </div>
              <p className="text-[13px] text-[#6B6B6B]">
                {score! <= 6 && 'We\'re sorry your experience wasn\'t great.'}
                {score! >= 7 && score! <= 8 && 'Thanks for your feedback!'}
                {score! >= 9 && 'Great to hear you enjoyed your experience!'}
              </p>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <p className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-2">
                What influenced your score?
              </p>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] transition-all ${
                      tags.includes(tag.id)
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F0F0F0] text-[#6B6B6B] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback textarea */}
            <div className="mb-4">
              <p className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-2">
                Any additional feedback?
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more..."
                rows={3}
                className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Submit Feedback
                </>
              )}
            </Button>
          </>
        )}

        {step === 'thanks' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
              <ThumbsUp className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-[14px] font-medium text-[#1A1A1A] mb-1">
              Thank you for your feedback!
            </p>
            <p className="text-[13px] text-[#6B6B6B]">
              Your input helps us improve our services.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Dashboard for NPS                                             */
/* ------------------------------------------------------------------ */

export function NPSDashboard() {
  return (
    <div className="space-y-6">
      {/* NPS Score */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-1">
              Net Promoter Score
            </p>
            <div className="text-[48px] font-serif text-[#1A1A1A]">+42</div>
            <p className="text-[13px] text-emerald-600">+8 vs last month</p>
          </div>
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6B6B6B]">Promoters (9-10)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[#E5E5E5] rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62%' }} />
                </div>
                <span className="text-[13px] font-medium">62%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6B6B6B]">Passives (7-8)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[#E5E5E5] rounded-full">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }} />
                </div>
                <span className="text-[13px] font-medium">24%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#6B6B6B]">Detractors (0-6)</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[#E5E5E5] rounded-full">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '14%' }} />
                </div>
                <span className="text-[13px] font-medium">14%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}