import React, { useState } from 'react';
import { 
  LayoutDashboard, BookOpen, Target, Lightbulb, Calendar,
  ChevronRight, ChevronLeft, User, Bell, Settings, LogOut,
  Sparkles, TrendingUp, MessageSquare, FileText
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { ReactNode } from 'react';

interface CoachingPortalProps {
  children: ReactNode;
}

type NavItem = 'dashboard' | 'sessions' | 'career-plan' | 'skill-development' | 'resources';

export function CoachingPortal({ children }: CoachingPortalProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');

  const navItems: { id: NavItem; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'sessions', label: 'Coaching Sessions', icon: <Calendar className="w-5 h-5" />, badge: 3 },
    { id: 'career-plan', label: 'Career Plan', icon: <Target className="w-5 h-5" /> },
    { id: 'skill-development', label: 'Skill Development', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'resources', label: 'Resources', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-bg-primary">
      <aside 
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-bg-secondary border-r border-bg-tertiary flex flex-col transition-all duration-300`}
      >
        <div className="h-16 flex items-center justify-center border-b border-bg-tertiary">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="ml-3 font-bold text-text-primary">LYC Coaching</span>
          )}
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    activeNav === item.id
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-white/20 text-white text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-bg-tertiary">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-bg-secondary border-b border-bg-tertiary flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-medium text-text-primary capitalize">
              {activeNav === 'dashboard' ? 'Coaching Dashboard' : activeNav.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l border-bg-tertiary">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-text-primary">Your Name</p>
                <p className="text-xs text-text-muted">Premium Member</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default CoachingPortal;