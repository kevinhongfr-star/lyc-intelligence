import React, { useState, useEffect } from 'react';
import { 
  Calendar, Target, TrendingUp, BookOpen, MessageSquare,
  Sparkles, Clock, CheckCircle, ArrowRight, Star
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';

export function CoachingDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/coaching/dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Load coaching dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  const mockData = {
    upcoming_sessions: [
      { id: 's1', title: 'Career Strategy Session', coach: 'Sarah Chen', date: 'Tomorrow, 2:00 PM', duration: '60 min', type: 'strategy' },
      { id: 's2', title: 'Interview Preparation', coach: 'Michael Wang', date: 'Next Wednesday, 10:00 AM', duration: '90 min', type: 'interview' },
      { id: 's3', title: 'Skill Development Review', coach: 'Emily Zhang', date: 'Next Friday, 3:00 PM', duration: '45 min', type: 'skill' },
    ],
    career_milestones: [
      { id: 'm1', title: 'Complete Leadership Assessment', progress: 100, status: 'completed' },
      { id: 'm2', title: 'Build Professional Network', progress: 65, status: 'in_progress' },
      { id: 'm3', title: 'Update Resume & LinkedIn', progress: 80, status: 'in_progress' },
      { id: 'm4', title: 'Target 3 Companies', progress: 40, status: 'in_progress' },
      { id: 'm5', title: 'Schedule Interviews', progress: 20, status: 'pending' },
    ],
    skill_progress: [
      { skill: 'Leadership', current: 72, target: 90, icon: <TrendingUp className="w-4 h-4" /> },
      { skill: 'Strategic Thinking', current: 65, target: 85, icon: <Target className="w-4 h-4" /> },
      { skill: 'Communication', current: 78, target: 90, icon: <MessageSquare className="w-4 h-4" /> },
      { skill: 'Cross-Cultural', current: 55, target: 80, icon: <Sparkles className="w-4 h-4" /> },
    ],
    recent_activity: [
      { id: 1, type: 'session_completed', message: 'Completed session: Career Assessment Review', time: '2 days ago' },
      { id: 2, type: 'milestone', message: 'Milestone achieved: Leadership Assessment', time: '3 days ago' },
      { id: 3, type: 'resource', message: 'New resource: Executive Presence Guide', time: '5 days ago' },
      { id: 4, type: 'progress', message: 'Skill progress updated: Communication +5%', time: '1 week ago' },
    ],
    streak: 12,
    total_sessions: 24,
    goals_completed: 18,
  };

  const data = dashboardData || mockData;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-text-primary">Coaching Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome back. Track your career progress and upcoming sessions.</p>
        </div>
        <Button>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.streak} days</p>
              <p className="text-text-muted text-xs mt-1">Keep it going!</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Total Sessions</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.total_sessions}</p>
              <p className="text-text-muted text-xs mt-1">with your coaches</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Goals Completed</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.goals_completed}</p>
              <p className="text-text-muted text-xs mt-1">milestones achieved</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Career Score</p>
              <p className="text-2xl font-bold text-text-primary mt-1">72</p>
              <p className="text-text-muted text-xs mt-1">out of 100</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Sessions
              </h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {data.upcoming_sessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-bg-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{session.title}</p>
                      <p className="text-sm text-text-muted">
                        {session.coach} | {session.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-text-primary">{session.date}</p>
                    </div>
                    <Badge className={session.type === 'strategy' ? 'bg-purple-100 text-purple-700' : session.type === 'interview' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                      {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Career Milestones
            </h3>
            <div className="space-y-4">
              {data.career_milestones.map((milestone: any) => (
                <div key={milestone.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-primary flex items-center gap-2">
                      {milestone.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {milestone.status === 'in_progress' && <Clock className="w-4 h-4 text-accent" />}
                      {milestone.status === 'pending' && <div className="w-4 h-4 rounded-full bg-text-muted" />}
                      {milestone.title}
                    </span>
                    <span className="text-text-muted text-sm">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Skill Progress
            </h3>
            <div className="space-y-4">
              {data.skill_progress.map((skill: any) => (
                <div key={skill.skill}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-text-muted text-sm flex items-center gap-2">
                      {skill.icon}
                      {skill.skill}
                    </span>
                    <span className="text-text-primary text-sm">{skill.current}/{skill.target}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${(skill.current / skill.target) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {data.recent_activity.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{activity.message}</p>
                    <p className="text-xs text-text-muted mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CoachingDashboardPage;