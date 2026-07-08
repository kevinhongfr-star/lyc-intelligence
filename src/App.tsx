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

// ── Internal platform pages — lazy-loaded via ESM dynamic import ──
const AdvancedOpsPage = lazy(() => import('@/pages/internal/AdvancedOpsPage').then(m => ({ default: m.AdvancedOpsPage })));
const SchedulingPlusPage = lazy(() => import('@/pages/internal/SchedulingPlusPage').then(m => ({ default: m.SchedulingPlusPage })));
const IntelligencePlusPage = lazy(() => import('@/pages/internal/IntelligencePlusPage').then(m => ({ default: m.IntelligencePlusPage })));
const PlatformSettingsPage = lazy(() => import('@/pages/internal/PlatformSettingsPage').then(m => ({ default: m.PlatformSettingsPage })));
const TeamPage = lazy(() => import('@/pages/internal/TeamPage').then(m => ({ default: m.TeamPage })));
const TasksPage = lazy(() => import('@/pages/internal/TasksPage').then(m => ({ default: m.TasksPage })));
const AnalyticsPage = lazy(() => import('@/pages/internal/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const CompliancePage = lazy(() => import('@/pages/internal/CompliancePage').then(m => ({ default: m.CompliancePage })));
const NexusEnginePage = lazy(() => import('@/pages/internal/NexusEnginePage').then(m => ({ default: m.NexusEnginePage })));
const KevinOversightDashboard = lazy(() => import('@/components/kevin/KevinOversightDashboard').then(m => ({ default: m.KevinOversightDashboard })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));

// ── Placeholder pages for new surface routes ──
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));

const ENABLE_PLATFORM = import.meta.env.VITE_ENABLE_PLATFORM === 'true';

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
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/b2b" element={<B2BLanding />} />
          <Route path="/b2c" element={<B2CLanding />} />
          <Route path="/nexus" element={<NexusLanding />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><UserDocumentsPage /></ProtectedRoute>} />
          <Route path="/share/:id" element={<SharePage />} />

          {/* Internal Platform (full implementations) */}
          {ENABLE_PLATFORM && (
            <Route path="/platform" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<ConsultantDashboard />} />
              <Route path="mandates" element={<MandatesPage />} />
              <Route path="mandates/new" element={<ProposalBuilderPage />} />
              <Route path="mandates/:id/edit" element={<ProposalBuilderPage />} />
              <Route path="mandates/:id" element={<MandateDetailPage />} />
              <Route path="mandates/:id/lens" element={<LensExportPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="candidates/:id" element={<ExecutiveProfilePage />} />
              <Route path="candidates/:id/report" element={<CandidateReportPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="batch-scoring" element={<BatchScoringPage />} />
              <Route path="metrix" element={<MetrixPage />} />
              <Route path="scoring-runs" element={<ScoringRunsPage />} />
              <Route path="chat" element={<NexusPage />} />
              <Route path="scheduler" element={<SchedulerPage />} />
              <Route path="documents" element={<PlatformDocumentsPage />} />
              <Route path="org-intel" element={<AdminRoute><OrgIntelligencePage /></AdminRoute>} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="advanced-ops" element={<AdvancedOpsPage />} />
              <Route path="scheduling-plus" element={<SchedulingPlusPage />} />
              <Route path="intelligence-plus" element={<IntelligencePlusPage />} />
              <Route path="platform-settings" element={<PlatformSettingsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="nexus-engine" element={<AdminRoute><NexusEnginePage /></AdminRoute>} />
              <Route path="oversight" element={<AdminRoute><KevinOversightDashboard /></AdminRoute>} />
            </Route>
          )}

          {/* B2B Client Portal (4-surface structure from mockup) */}
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

          {/* B2C Coaching (4-surface structure from mockup) */}
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

          {/* Candidate Portal (4-surface structure from mockup) */}
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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
