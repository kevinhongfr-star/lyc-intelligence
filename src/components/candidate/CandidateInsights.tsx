import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase,
  DollarSign,
  MapPin,
  Sparkles,
  ChevronRight,
  Target,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function CandidateInsights() {
  const marketTrends = [
    { title: 'VP Engineering Demand', change: '+23%', trend: 'up', period: 'Q2 2024 vs Q1', description: 'Strong demand for engineering leaders in SaaS sector' },
    { title: 'Product Leadership', change: '+18%', trend: 'up', period: '6 month trend', description: 'Consumer tech companies scaling product orgs' },
    { title: 'Traditional Industry Tech Leaders', change: '-5%', trend: 'down', period: 'Q2 2024', description: 'Slowdown in manufacturing digital transformation roles' },
  ];

  const salaryInsights = [
    { role: 'VP Engineering', location: 'Shanghai', range: '$180K - $280K', percentile: '75th' },
    { role: 'VP Engineering', location: 'Singapore', range: '$200K - $320K', percentile: '75th' },
    { role: 'Director of Engineering', location: 'Shanghai', range: '$120K - $180K', percentile: '60th' },
  ];

  const skills = [
    { skill: 'AI/ML Leadership', demand: 'High', trend: 'up' },
    { skill: 'Platform Engineering', demand: 'Very High', trend: 'up' },
    { skill: 'FinTech Domain', demand: 'Growing', trend: 'up' },
    { skill: 'Team Scaling', demand: 'High', trend: 'stable' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">Career Insights</h1>
        <p className="text-text-muted">Market trends and personalized insights for your profile</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Matching Roles</p>
                <p className="text-3xl font-bold text-text-primary mt-1">12</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Market Value</p>
                <p className="text-3xl font-bold text-text-primary mt-1">$220K</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Estimated base for VP Engineering, Shanghai
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Demand Score</p>
                <p className="text-3xl font-bold text-text-primary mt-1">88/100</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Target className="w-6 h-6 text-accent" />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Based on your archetype and experience
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {marketTrends.map((trend, i) => (
              <div key={i} className="flex items-start justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-text-primary">{trend.title}</h4>
                    <Badge
                      variant="secondary"
                      className={trend.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                    >
                      {trend.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {trend.change}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-1">{trend.description}</p>
                  <p className="text-xs text-text-muted mt-1">{trend.period}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              Salary Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {salaryInsights.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{item.role}</p>
                  <p className="text-sm text-text-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-accent">{item.range}</p>
                  <p className="text-xs text-text-muted">{item.percentile} percentile</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            In-Demand Skills for Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {skills.map((skill) => (
              <div key={skill.skill} className="p-3 bg-bg-tertiary rounded-lg">
                <p className="font-medium text-text-primary">{skill.skill}</p>
                <Badge
                  variant="secondary"
                  className={`mt-2 ${
                    skill.demand === 'Very High' ? 'bg-green-100 text-green-700' :
                    skill.demand === 'High' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}
                >
                  {skill.demand}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/5 to-purple-50 border-accent/20">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-xl">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-text-primary">
                Get AI-Powered Career Guidance
              </h3>
              <p className="text-text-muted">
                Nexus AI can analyze your profile and suggest personalized career moves
              </p>
            </div>
          </div>
          <Button>
            Talk to Nexus
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
