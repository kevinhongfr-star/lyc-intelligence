import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';

// ── Landing + Auth ──
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then(m => ({ default: m.SignupPage })));

// ── App Shell ──
const AppShell = lazy(() => import('@/components/shell/AppShell').then(m => ({ default: m.AppShell })));

// ── Internal Ops Pages ──
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })));
const MandatesPage = lazy(() => import('@/pages/MandatesPage').then(m => ({ default: m.MandatesPage })));
const MandateDetailPage = lazy(() => import('@/pages/MandateDetailPage').then(m => ({ default: m.MandateDetailPage })));
const SchedulerPage = lazy(() => import('@/pages/SchedulerPage').then(m => ({ default: m.SchedulerPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// ── Placeholder pages for new routes ──
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));

function Loading() { return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-fuchsia" /></div>; }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, [initialize]);

  return (
    <ErrorBoundary>
    <CreditProvider>
      <ToastContainer />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Internal Ops */}
          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="mandates" element={<MandatesPage />} />
            <Route path="mandates/:id" element={<MandateDetailPage />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="intelligence" element={<PlaceholderPage title="Intelligence" />} />
            <Route path="team" element={<PlaceholderPage title="Team" />} />
            <Route path="tasks" element={<PlaceholderPage title="Tasks" />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
            <Route path="compliance" element={<PlaceholderPage title="Compliance" />} />
            <Route path="nexus-engine" element={<PlaceholderPage title="NEXUS Engine" />} />
            <Route path="advanced-ops" element={<PlaceholderPage title="Advanced Ops" />} />
            <Route path="scheduling-plus" element={<PlaceholderPage title="Scheduling+" />} />
            <Route path="intelligence-plus" element={<PlaceholderPage title="Intelligence+" />} />
            <Route path="platform-settings" element={<PlaceholderPage title="Platform Settings" />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* B2B Client Portal */}
          <Route path="/client" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<PlaceholderPage title="B2B Overview" />} />
            <Route path="pipeline-analytics" element={<PlaceholderPage title="Pipeline Analytics" />} />
            <Route path="talent-intel" element={<PlaceholderPage title="Talent Intelligence" />} />
            <Route path="mandates" element={<PlaceholderPage title="B2B Mandates" />} />
            <Route path="candidates" element={<PlaceholderPage title="B2B Candidates" />} />
            <Route path="nexus-assistant" element={<PlaceholderPage title="NEXUS Assistant" />} />
            <Route path="documents" element={<PlaceholderPage title="Documents & Billing" />} />
            <Route path="admin" element={<PlaceholderPage title="Admin & Security" />} />
            <Route path="collaboration" element={<PlaceholderPage title="Collaboration" />} />
            <Route path="onboarding" element={<PlaceholderPage title="Onboarding" />} />
          </Route>

          {/* B2C Coaching */}
          <Route path="/coaching" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="coach" replace />} />
            <Route path="coach" element={<PlaceholderPage title="Coach" />} />
            <Route path="credits" element={<PlaceholderPage title="Credits & Plans" />} />
            <Route path="intelligence" element={<PlaceholderPage title="B2C Intelligence" />} />
            <Route path="career-intel" element={<PlaceholderPage title="Career Intelligence" />} />
            <Route path="profile" element={<PlaceholderPage title="Profile & Settings" />} />
            <Route path="chat-features" element={<PlaceholderPage title="Chat Features" />} />
            <Route path="career-services" element={<PlaceholderPage title="Career Services" />} />
            <Route path="engagement" element={<PlaceholderPage title="Engagement" />} />
            <Route path="growth" element={<PlaceholderPage title="Growth" />} />
          </Route>

          {/* Candidate Portal */}
          <Route path="/candidate" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PlaceholderPage title="Candidate Dashboard" />} />
            <Route path="applications" element={<PlaceholderPage title="Applications" />} />
            <Route path="offers" element={<PlaceholderPage title="Offers & Decisions" />} />
            <Route path="opportunities" element={<PlaceholderPage title="My Opportunities" />} />
            <Route path="interview-prep" element={<PlaceholderPage title="Interview Prep" />} />
            <Route path="assessments" element={<PlaceholderPage title="Assessments" />} />
            <Route path="career-dev" element={<PlaceholderPage title="Career Development" />} />
            <Route path="community" element={<PlaceholderPage title="Community" />} />
            <Route path="nexus-coach" element={<PlaceholderPage title="NEXUS Coach" />} />
            <Route path="profile" element={<PlaceholderPage title="Candidate Profile" />} />
            <Route path="advanced-assessments" element={<PlaceholderPage title="Advanced Assessments" />} />
            <Route path="settings-plus" element={<PlaceholderPage title="Settings+" />} />
          </Route>
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
