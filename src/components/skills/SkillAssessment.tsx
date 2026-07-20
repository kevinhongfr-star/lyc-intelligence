/**
 * Skill Assessment Auto-Scoring — Issue #39
 *
 * Automated skill evaluation system with rubric-based scoring.
 */
import React, { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Star, Target, Award, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';

interface Skill {
  id: string;
  name: string;
  category: string;
  score: number;
  maxScore: number;
  evidence: string[];
  gaps: string[];
  verified: boolean;
}

interface AssessmentResult {
  overallScore: number;
  percentile: number;
  level: 'novice' | 'intermediate' | 'advanced' | 'expert';
  strengths: string[];
  developmentAreas: string[];
}

export function SkillAssessmentPanel({ skills: initialSkills }: { skills?: Skill[] }) {
  const [skills] = useState<Skill[]>(initialSkills || MOCK_SKILLS);

  const totalScore = skills.reduce((acc, s) => acc + (s.score / s.maxScore) * 100, 0) / skills.length;

  const result: AssessmentResult = {
    overallScore: Math.round(totalScore),
    percentile: 72,
    level: totalScore >= 85 ? 'expert' : totalScore >= 70 ? 'advanced' : totalScore >= 50 ? 'intermediate' : 'novice',
    strengths: skills.filter((s) => s.score / s.maxScore >= 0.8).map((s) => s.name),
    developmentAreas: skills.filter((s) => s.score / s.maxScore < 0.6).map((s) => s.name),
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mb-1">Overall Assessment</p>
              <div className="text-[40px] font-serif text-[#1A1A1A]">{result.overallScore}%</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={result.level === 'expert' ? 'success' : 'default'}>
                  {result.level.charAt(0).toUpperCase() + result.level.slice(1)}
                </Badge>
                <span className="text-[12px] text-[#6B6B6B]">Top {100 - result.percentile}% percentile</span>
              </div>
            </div>
            <div className="w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E5E5"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#1A1A1A"
                  strokeWidth="3"
                  strokeDasharray={`${result.overallScore}, 100`}
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[#1A1A1A]">{skill.name}</span>
                  <div className="flex items-center gap-2">
                    {skill.verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    <span className="text-[12px] text-[#6B6B6B]">{skill.score}/{skill.maxScore}</span>
                  </div>
                </div>
                <Progress value={(skill.score / skill.maxScore) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Development */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <CardTitle>Strengths</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {result.strengths.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">No top strengths identified yet.</p>
            ) : (
              <ul className="space-y-2">
                {result.strengths.map((s) => (
                  <li key={s} className="text-[13px] text-[#4A4A4A] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              <CardTitle>Development Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {result.developmentAreas.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">Great work! No development areas identified.</p>
            ) : (
              <ul className="space-y-2">
                {result.developmentAreas.map((s) => (
                  <li key={s} className="text-[13px] text-[#4A4A4A] flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const MOCK_SKILLS: Skill[] = [
  { id: '1', name: 'Strategic Thinking', category: 'leadership', score: 8, maxScore: 10, evidence: ['Led 3 strategic initiatives'], gaps: [], verified: true },
  { id: '2', name: 'Team Leadership', category: 'leadership', score: 7, maxScore: 10, evidence: ['Managed 15-person team'], gaps: ['Delegation'], verified: true },
  { id: '3', name: 'Financial Acumen', category: 'business', score: 6, maxScore: 10, evidence: ['P&L responsibility'], gaps: ['Financial modeling'], verified: false },
  { id: '4', name: 'Communication', category: 'soft', score: 9, maxScore: 10, evidence: ['Board presentations'], gaps: [], verified: true },
  { id: '5', name: 'Digital Transformation', category: 'technical', score: 5, maxScore: 10, evidence: [], gaps: ['Cloud architecture', 'Data analytics'], verified: false },
  { id: '6', name: 'Change Management', category: 'leadership', score: 7, maxScore: 10, evidence: ['M&A integration'], gaps: [], verified: true },
];