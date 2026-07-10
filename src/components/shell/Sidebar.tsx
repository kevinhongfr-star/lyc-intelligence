/**
 * Sidebar — Notion/Vercel-style left navigation
 * Collapsible surface sections with sub-page links
 * Clean, minimal, professional
 */
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  GraduationCap,
  User,
  ChevronRight,
  LayoutDashboard,
  GitBranch,
  FileText,
  Users,
  Building,
  Calendar,
  Bell,
  MessageSquare,
  BarChart3,
  CheckSquare,
  Shield,
  Settings,
  Eye,
  TrendingUp,
  Target,
  FileCheck,
  CreditCard,
  UserCheck,
  HelpCircle,
  Heart,
  Zap,
  Star,
  Award,
  Search,
  FileSignature,
  Handshake,
  BriefcaseBusiness,
  ClipboardList,
  GraduationCap as GradCap2,
  TestTube,
  BookOpen,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export type Surface = 'internal' | 'client' | 'coaching' | 'candidate';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SurfaceDef {
  id: Surface;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const SURFACES: SurfaceDef[] = [
  {
    id: 'internal',
    label: 'Internal',
    icon: <Briefcase className="w-4 h-4" />,
    items: [
      { path: '/app/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: '/app/pipeline', label: 'Pipeline', icon: <GitBranch className="w-4 h-4" /> },
      { path: '/app/mandates', label: 'Mandates', icon: <FileText className="w-4 h-4" /> },
      { path: '/app/candidates', label: 'Candidates', icon: <Users className="w-4 h-4" /> },
      { path: '/app/companies', label: 'Companies', icon: <Building className="w-4 h-4" /> },
      { path: '/app/scheduler', label: 'Scheduler', icon: <Calendar className="w-4 h-4" /> },
      { path: '/app/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      { path: '/app/chat', label: 'NEXUS', icon: <MessageSquare className="w-4 h-4" /> },
      { path: '/app/org-intel', label: 'Org Intelligence', icon: <BarChart3 className="w-4 h-4" /> },
      { path: '/app/analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
      { path: '/app/tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
      { path: '/app/compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> },
      { path: '/app/platform-settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
  {
    id: 'client',
    label: 'Clients',
    icon: <Building2 className="w-4 h-4" />,
    items: [
      { path: '/client/overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: '/client/pipeline-analytics', label: 'Pipeline Analytics', icon: <TrendingUp className="w-4 h-4" /> },
      { path: '/client/talent-intel', label: 'Talent Intelligence', icon: <Eye className="w-4 h-4" /> },
      { path: '/client/mandates', label: 'Mandates & Pipeline', icon: <Target className="w-4 h-4" /> },
      { path: '/client/candidates', label: 'Candidates', icon: <Users className="w-4 h-4" /> },
      { path: '/client/nexus-assistant', label: 'NEXUS Assistant', icon: <MessageSquare className="w-4 h-4" /> },
      { path: '/client/documents', label: 'Documents & Billing', icon: <CreditCard className="w-4 h-4" /> },
      { path: '/client/collaboration', label: 'Collaboration', icon: <Handshake className="w-4 h-4" /> },
      { path: '/client/onboarding', label: 'Onboarding', icon: <UserCheck className="w-4 h-4" /> },
      { path: '/client/admin', label: 'Admin & Security', icon: <Shield className="w-4 h-4" /> },
    ],
  },
  {
    id: 'coaching',
    label: 'Coaching',
    icon: <GraduationCap className="w-4 h-4" />,
    items: [
      { path: '/coaching/coach', label: 'Coach', icon: <HelpCircle className="w-4 h-4" /> },
      { path: '/coaching/credits', label: 'Credits & Plans', icon: <Star className="w-4 h-4" /> },
      { path: '/coaching/intelligence', label: 'Intelligence', icon: <BarChart3 className="w-4 h-4" /> },
      { path: '/coaching/career-intel', label: 'Career Intelligence', icon: <TrendingUp className="w-4 h-4" /> },
      { path: '/coaching/profile', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
      { path: '/coaching/chat-features', label: 'Chat Features', icon: <MessageSquare className="w-4 h-4" /> },
      { path: '/coaching/career-services', label: 'Career Services', icon: <Briefcase className="w-4 h-4" /> },
      { path: '/coaching/engagement', label: 'Engagement', icon: <Heart className="w-4 h-4" /> },
      { path: '/coaching/growth', label: 'Growth', icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    id: 'candidate',
    label: 'Candidates',
    icon: <User className="w-4 h-4" />,
    items: [
      { path: '/candidate/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: '/candidate/applications', label: 'Applications', icon: <FileSignature className="w-4 h-4" /> },
      { path: '/candidate/offers', label: 'Offers & Decisions', icon: <Award className="w-4 h-4" /> },
      { path: '/candidate/opportunities', label: 'My Opportunities', icon: <Search className="w-4 h-4" /> },
      { path: '/candidate/interview-prep', label: 'Interview Prep', icon: <TestTube className="w-4 h-4" /> },
      { path: '/candidate/assessments', label: 'Assessments', icon: <ClipboardList className="w-4 h-4" /> },
      { path: '/candidate/career-dev', label: 'Career Development', icon: <BookOpen className="w-4 h-4" /> },
      { path: '/candidate/community', label: 'Community', icon: <Globe className="w-4 h-4" /> },
      { path: '/candidate/nexus-coach', label: 'NEXUS Coach', icon: <Sparkles className="w-4 h-4" /> },
      { path: '/candidate/profile', label: 'Profile & Settings', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

function getSurfaceFromPath(path: string): Surface {
  if (path.startsWith('/app') || path.startsWith('/platform')) return 'internal';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/coaching')) return 'coaching';
  if (path.startsWith('/candidate')) return 'candidate';
  return 'internal';
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user } = useAuthStore();
  const currentSurface = getSurfaceFromPath(location.pathname);

  // All surfaces start expanded if they're the active one, collapsed otherwise
  const [expanded, setExpanded] = useState<Record<Surface, boolean>>(() => ({
    internal: currentSurface === 'internal',
    client: currentSurface === 'client',
    coaching: currentSurface === 'coaching',
    candidate: currentSurface === 'candidate',
  }));

  const toggleSurface = (surface: Surface) => {
    setExpanded((prev) => ({ ...prev, [surface]: !prev[surface] }));
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#FAFAFA] border-r border-[#E5E5E5] flex flex-col z-40">
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-[#E5E5E5] flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="font-bold text-base text-[#171717] tracking-tight">LYC</span>
          <span className="text-sm font-medium text-[#737373]">Intelligence</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'thin' }}>
        {SURFACES.map((surface) => {
          const isExpanded = expanded[surface.id];
          const isActiveSurface = currentSurface === surface.id;
          const hasActiveChild = surface.items.some((item) => isActivePath(item.path));

          return (
            <div key={surface.id} className="mb-1">
              {/* Surface header */}
              <button
                onClick={() => toggleSurface(surface.id)}
                className={`
                  w-full flex items-center gap-2 px-4 py-2 text-[13px] font-semibold
                  transition-colors duration-150
                  ${isActiveSurface || hasActiveChild
                    ? 'text-[#171717]'
                    : 'text-[#737373] hover:text-[#171717]'
                  }
                `}
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
                {surface.icon}
                <span>{surface.label}</span>
              </button>

              {/* Sub-items */}
              {isExpanded && (
                <div className="mb-2">
                  {surface.items.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                          w-full flex items-center gap-2.5 pl-10 pr-4 py-1.5 text-[13px]
                          transition-colors duration-150
                          ${isActive
                            ? 'text-[#171717] bg-[#EDEDED] font-medium'
                            : 'text-[#525252] hover:text-[#171717] hover:bg-[#F0F0F0]'
                          }
                        `}
                      >
                        <span className={`flex-shrink-0 ${isActive ? 'text-[#171717]' : 'text-[#737373]'}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-[#E5E5E5] p-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-[#404040] bg-[#E5E5E5] flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#171717] truncate">
              {profile?.full_name?.split(' ')[0] || 'User'}
            </div>
            <div className="text-[11px] text-[#737373] truncate">
              {profile?.role || 'Member'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
