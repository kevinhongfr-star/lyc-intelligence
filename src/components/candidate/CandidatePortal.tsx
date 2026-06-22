import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Briefcase, User, FileText, Lightbulb, Settings,
  Bell, ChevronRight, ChevronDown, Menu, X, LogOut, Loader2,
  CheckCircle2, Clock, AlertCircle, Calendar, TrendingUp
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { ApplicationTracker } from './ApplicationTracker';
import { CandidateProfile as CandidateProfileComponent } from './CandidateProfile';
import { CareerInsights } from './CareerInsights';
import { NotificationSettings } from './NotificationSettings';
import {
  getCandidateApplications,
  getCandidateNotifications,
  getCareerInsights,
  markCandidateNotificationsRead,
  type CandidateNotification,
  type CareerInsight,
  type CandidateApplication,
  type CandidateProfile as CandidateProfileType
} from '@/services/supabaseApi';

type NavItem = 'dashboard' | 'applications' | 'profile' | 'assessments' | 'insights' | 'settings';

interface CandidatePortalProps {
  candidateId: string;
  onLogout?: () => void;
}

export function CandidatePortal({ candidateId, onLogout }: CandidatePortalProps) {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [notifications, setNotifications] = useState<CandidateNotification[]>([]);
  const [careerInsights, setCareerInsights] = useState<CareerInsight[]>([]);
  const [profile, setProfile] = useState<CandidateProfileType | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [candidateId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsResult, notifsResult, insights] = await Promise.all([
        getCandidateApplications(),
        getCandidateNotifications(),
        getCareerInsights(),
      ]);
      
      setApplications(appsResult);
      setNotifications(notifsResult.notifications);
      setCareerInsights(insights);
      setUnreadCount(notifsResult.notifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Load candidate data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const activeApps = applications.filter(a => 
      !['rejected', 'withdrawn', 'placed'].includes(a.stage.toLowerCase())
    );
    const recentStageChanges = applications.filter(a => {
      if (!a.updated_at) return false;
      const daysSinceUpdate = (Date.now() - new Date(a.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    });
    const upcomingInterviews = applications.filter(a => 
      ['interview', 'final_round', 'offer'].includes(a.stage.toLowerCase())
    );
    const pendingAssessments = applications.filter(a => 
      a.stage.toLowerCase() === 'assessment'
    );

    return {
      activeApplications: activeApps.length,
      recentChanges: recentStageChanges.length,
      upcomingInterviews: upcomingInterviews.length,
      pendingAssessments: pendingAssessments.length,
    };
  }, [applications]);

  // Navigation items
  const navItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'applications', label: 'Applications', icon: <Briefcase className="w-5 h-5" />, badge: applications.length },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'assessments', label: 'Assessments', icon: <FileText className="w-5 h-5" />, badge: dashboardStats.pendingAssessments },
    { id: 'insights', label: 'Career Insights', icon: <Lightbulb className="w-5 h-5" />, badge: careerInsights.length },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  // Handle notification mark as read
  const handleMarkNotificationRead = async (notificationId: string) => {
    await markCandidateNotificationsRead([notificationId]);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Render dashboard content
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-card-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/10">
              <Briefcase className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{dashboardStats.activeApplications}</div>
              <div className="text-sm text-text-muted">Active Applications</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-card-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{dashboardStats.recentChanges}</div>
              <div className="text-sm text-text-muted">Stage Changes (7d)</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-card-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{dashboardStats.upcomingInterviews}</div>
              <div className="text-sm text-text-muted">Upcoming Interviews</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-card-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <FileText className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{dashboardStats.pendingAssessments}</div>
              <div className="text-sm text-text-muted">Pending Assessments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-card rounded-xl border border-card-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-text-primary">Recent Applications</h3>
          </div>
          <div className="divide-y divide-border">
            {applications.slice(0, 5).map(app => (
              <div 
                key={app.id}
                className="p-4 hover:bg-bg-alt cursor-pointer transition-colors"
                onClick={() => setActiveNav('applications')}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-text-primary">{app.mandate?.title || 'Application'}</span>
                  <Badge variant={getStageVariant(app.stage)}>{app.stage}</Badge>
                </div>
                <div className="text-sm text-text-muted">
                  {app.mandate?.company?.name || 'Company'} • Applied {formatDate(app.created_at)}
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="p-8 text-center text-text-muted">
                No applications yet
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-card-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} unread</Badge>
            )}
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {notifications.slice(0, 5).map(notif => (
              <div 
                key={notif.id}
                className={`p-4 hover:bg-bg-alt cursor-pointer transition-colors ${!notif.read ? 'bg-accent/5' : ''}`}
                onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${!notif.read ? 'text-accent' : 'text-text-muted'}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-primary text-sm">{notif.title}</div>
                    <div className="text-xs text-text-muted mt-1">{notif.message}</div>
                    <div className="text-xs text-text-muted mt-2">{formatDate(notif.created_at)}</div>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  )}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-8 text-center text-text-muted">
                No notifications
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Career Insights Preview */}
      {careerInsights.length > 0 && (
        <div className="bg-card rounded-xl border border-card-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Insights for You</h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveNav('insights')}>
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {careerInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-bg-alt rounded-lg">
                <Lightbulb className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <div className="font-medium text-text-primary text-sm">{insight.title}</div>
                  <div className="text-xs text-text-muted mt-1">{insight.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render content based on active nav
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      );
    }

    switch (activeNav) {
      case 'dashboard':
        return renderDashboard();
      case 'applications':
        return <ApplicationTracker applications={applications} />;
      case 'profile':
        return <CandidateProfileComponent profile={profile} onUpdate={setProfile} />;
      case 'assessments':
        return (
          <div className="bg-card rounded-xl border border-card-border p-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Assessments</h2>
            <p className="text-text-muted">
              Complete your assessments to help our consultants better understand your profile.
            </p>
            {/* Assessment list would go here */}
          </div>
        );
      case 'insights':
        return <CareerInsights insights={careerInsights} />;
      case 'settings':
        return <NotificationSettings />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">LYC</span>
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-text-primary">Candidate Portal</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeNav === item.id
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:bg-bg-alt hover:text-text-primary'
              }`}
            >
              {item.icon}
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge 
                      variant={activeNav === item.id ? 'default' : 'default'}
                      className={activeNav === item.id ? 'bg-white/20 text-white' : ''}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Notifications Bell */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => {/* Toggle notifications panel */}}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-bg-alt transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {sidebarOpen && <span className="flex-1 text-left font-medium">Notifications</span>}
            {unreadCount > 0 && (
              <span className="absolute right-2 top-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User / Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-bg-alt transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="flex-1 text-left font-medium">Logout</span>}
          </button>
        </div>

        {/* Toggle Sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 border-t border-border text-text-muted hover:text-text-primary transition-colors"
        >
          {sidebarOpen ? <ChevronDown className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-bg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-text-primary capitalize">
                {activeNav === 'dashboard' ? 'Dashboard' : activeNav.replace('_', ' ')}
              </h1>
              <p className="text-sm text-text-muted">
                Welcome back! Here's your activity overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

// Helper functions
function getStageVariant(stage: string): 'success' | 'warning' | 'default' | 'danger' {
  const s = stage.toLowerCase();
  if (['placed', 'offer'].includes(s)) return 'success';
  if (['interview', 'assessment', 'shortlisted'].includes(s)) return 'warning';
  if (['rejected', 'withdrawn'].includes(s)) return 'danger';
  return 'default';
}

function getNotificationIcon(type: string): React.ReactNode {
  switch (type) {
    case 'assessment_invitation':
      return <FileText className="w-5 h-5" />;
    case 'interview_reminder':
      return <Calendar className="w-5 h-5" />;
    case 'stage_change':
      return <TrendingUp className="w-5 h-5" />;
    case 'feedback_received':
      return <CheckCircle2 className="w-5 h-5" />;
    case 'career_insight':
      return <Lightbulb className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}