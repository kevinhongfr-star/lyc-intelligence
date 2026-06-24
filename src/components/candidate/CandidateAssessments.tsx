import React from 'react';
import {
  BarChart3,
  Award,
  Calendar,
  Download,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

export function CandidateAssessments() {
  const assessments = [
    {
      id: '1',
      date: 'Jun 10, 2024',
      archetype: 'The Architect',
      overallScore: 87,
      status: 'completed',
      dimensions: [
        { name: 'Strategic Thinking', score: 92 },
        { name: 'Leadership Impact', score: 85 },
        { name: 'Operational Excellence', score: 78 },
        { name: 'Cognitive Agility', score: 90 },
        { name: 'Emotional Intelligence', score: 82 },
      ],
    },
  ];

  const latest = assessments[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">My Assessments</h1>
          <p className="text-text-muted">Your leadership archetype and dimension scores</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retake Assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted mb-4">You haven't taken an assessment yet</p>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-accent/5 to-purple-50 border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="bg-accent/20 text-accent mb-3">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Latest Result
                  </Badge>
                  <h2 className="text-3xl font-serif font-bold text-text-primary mb-1">
                    {latest.archetype}
                  </h2>
                  <p className="text-text-muted">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Taken on {latest.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">Overall Score</p>
                  <p className="text-5xl font-bold text-accent">{latest.overallScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Dimension Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latest.dimensions.map((dim) => (
                <div key={dim.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-text-primary">{dim.name}</span>
                    <span className="text-text-muted">{dim.score}/100</span>
                  </div>
                  <Progress value={dim.score} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{assessment.archetype}</p>
                        <p className="text-sm text-text-muted">{assessment.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-text-primary">{assessment.overallScore}</p>
                        <p className="text-xs text-text-muted">score</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
