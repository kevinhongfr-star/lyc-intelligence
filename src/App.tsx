import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';

// ── Admin route wrapper ──
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  // TODO: Check admin role from user metadata
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── Landing + Auth ──
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then(m => ({ default: m.SignupPage })));

// ── App Shell (mockup 4-surface structure) ──
const AppShell = lazy(() => import('@/components/shell/AppShell').then(m => ({ default: m.AppShell })));

// ── Public product landing pages ──
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const B2BLanding = lazy(() => import('@/pages/B2BLanding').then(m => ({ default: m.B2BLanding })));
const B2CLanding = lazy(() => import('@/pages/B2CLanding').then(m => ({ default: m.B2CLanding })));
const NexusLanding = lazy(() => import('@/pages/NexusPage').then(m => ({ default: m.NexusPage })));
const MatchPage = lazy(() => import('@/pages/MatchPage').then(m => ({ default: m.MatchPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));

// ── Authenticated user pages ──
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProgressPage = lazy(() => import('@/pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const UserDocumentsPage = lazy(() => import('@/pages/UserDocumentsPage').then(m => ({ default: m.UserDocumentsPage })));
const SharePage = lazy(() => import('@/pages/SharePage').then(m => ({ default: m.SharePage })));
const ConsultantDashboard = lazy(() => import('@/components/dashboard/ConsultantDashboard').then(m => ({ default: m.ConsultantDashboard })));

// ── Internal platform pages (real implementations) ──
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })));
const MandatesPage = lazy(() => import('@/pages/MandatesPage').then(m => ({ default: m.MandatesPage })));
const MandateDetailPage = lazy(() => import('@/pages/MandateDetailPage').then(m => ({ default: m.MandateDetailPage })));
const SchedulerPage = lazy(() => import('@/pages/SchedulerPage').then(m => ({ default: m.SchedulerPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CandidatesPage = lazy(() => import('@/pages/CandidatesPage').then(m => ({ default: m.CandidatesPage })));
const ExecutiveProfilePage = lazy(() => import('@/pages/ExecutiveProfilePage').then(m => ({ default: m.ExecutiveProfilePage })));
const CandidateReportPage = lazy(() => import('@/pages/CandidateReportPage').then(m => ({ default: m.CandidateReportPage })));
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const BatchScoringPage = lazy(() => import('@/pages/BatchScoringPage').then(m => ({ default: m.BatchScoringPage })));
const MetrixPage = lazy(() => import('@/pages/MetrixPage').then(m => ({ default: m.MetrixPage })));
const ScoringRunsPage = lazy(() => import('@/pages/ScoringRunsPage').then(m => ({ default: m.ScoringRunsPage })));
const NexusPage = lazy(() => import('@/pages/NexusPage').then(m => ({ default: m.NexusPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const OrgIntelligencePage = lazy(() => import('@/pages/OrgIntelligencePage').then(m => ({ default: m.OrgIntelligencePage })));
const ProposalBuilderPage = lazy(() => import('@/pages/ProposalBuilderPage').then(m => ({ default: m.ProposalBuilderPage })));
const LensExportPage = lazy(() => import('@/pages/LensExportPage').then(m => ({ default: m.LensExportPage })));
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

// ── B2B Client Portal pages (EO-1) ──
const ClientOverviewPage = lazy(() => import('@/pages/client/ClientOverviewPage').then(m => ({ default: m.ClientOverviewPage })));
const ClientPipelineAnalyticsPage = lazy(() => import('@/pages/client/ClientPipelineAnalyticsPage').then(m => ({ default: m.ClientPipelineAnalyticsPage })));
const ClientMandatesPage = lazy(() => import('@/pages/client/ClientMandatesPage').then(m => ({ default: m.ClientMandatesPage })));
const ClientCandidatesPage = lazy(() => import('@/pages/client/ClientCandidatesPage').then(m => ({ default: m.ClientCandidatesPage })));
const ClientDocumentsPage = lazy(() => import('@/pages/client/ClientDocumentsPage').then(m => ({ default: m.ClientDocumentsPage })));

// ── Candidate Portal pages (EO-4) ──
const CandidateDashboardPage = lazy(() => import('@/pages/candidate/CandidateDashboardPage').then(m => ({ default: m.CandidateDashboardPage })));
const CandidateApplicationsPage = lazy(() => import('@/pages/candidate/CandidateApplicationsPage').then(m => ({ default: m.CandidateApplicationsPage })));
const CandidateAssessmentsPage = lazy(() => import('@/pages/candidate/CandidateAssessmentsPage').then(m => ({ default: m.CandidateAssessmentsPage })));
const CandidateCommunityPage = lazy(() => import('@/pages/candidate/CandidateCommunityPage').then(m => ({ default: m.CandidateCommunityPage })));
const CandidateInterviewPrepPage = lazy(() => import('@/pages/candidate/CandidateInterviewPrepPage').then(m => ({ default: m.CandidateInterviewPrepPage })));
// ── B2C Coaching Portal pages (EO-5) ──
const CoachingCoachPage = lazy(() => import('@/pages/coaching/CoachingCoachPage').then(m => ({ default: m.CoachingCoachPage })));
const CoachingCreditsPage = lazy(() => import('@/pages/coaching/CoachingCreditsPage').then(m => ({ default: m.CoachingCreditsPage })));
const CoachingCareerIntelPage = lazy(() => import('@/pages/coaching/CoachingCareerIntelPage').then(m => ({ default: m.CoachingCareerIntelPage })));
const CoachingGrowthPage = lazy(() => import('@/pages/coaching/CoachingGrowthPage').then(m => ({ default: m.CoachingGrowthPage })));

// ── Placeholder + not found ──
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
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
          {/* ── Public pages ── */}
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

          {/* ── Internal Operations (mockup surface) ── */}
          {ENABLE_PLATFORM && (
            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ConsultantDashboard />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="mandates" element={<MandatesPage />} />
              <Route path="mandates/new" element={<ProposalBuilderPage />} />
              <Route path="mandates/:id/edit" element={<ProposalBuilderPage />} />
              <Route path="mandates/:id" element={<MandateDetailPage />} />
              <Route path="mandates/:id/lens" element={<LensExportPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="candidates/:id" element={<ExecutiveProfilePage />} />
              <Route path="candidates/:id/report" element={<CandidateReportPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="batch-scoring" element={<BatchScoringPage />} />
              <Route path="metrix" element={<MetrixPage />} />
              <Route path="scoring-runs" element={<ScoringRunsPage />} />
              <Route path="chat" element={<NexusPage />} />
              <Route path="scheduler" element={<SchedulerPage />} />
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
              <Route path="intelligence" element={<PlaceholderPage title="Intelligence" />} />
            </Route>
          )}

          {/* Backward compat: redirect old /platform/* to /app */}
          <Route path="/platform/*" element={<Navigate to="/app" replace />} />

          {/* ── B2B Client Portal (mockup surface) ── */}
          <Route path="/client" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ClientOverviewPage />} />
            <Route path="pipeline-analytics" element={<ClientPipelineAnalyticsPage />} />
            <Route path="talent-intel" element={<PlaceholderPage title="Talent Intelligence" />} />
            <Route path="mandates" element={<ClientMandatesPage />} />
            <Route path="candidates" element={<ClientCandidatesPage />} />
            <Route path="nexus-assistant" element={<PlaceholderPage title="NEXUS Assistant" />} />
            <Route path="documents" element={<ClientDocumentsPage />} />
            <Route path="admin" element={<PlaceholderPage title="Admin & Security" />} />
            <Route path="collaboration" element={<PlaceholderPage title="Collaboration" />} />
            <Route path="onboarding" element={<PlaceholderPage title="Onboarding" />} />
          </Route>

          {/* ── B2C Coaching (mockup surface) ── */}
          <Route path="/coaching" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="coach" replace />} />
            <Route path="coach" element={<CoachingCoachPage />} />
            <Route path="credits" element={<CoachingCreditsPage />} />
            <Route path="intelligence" element={<PlaceholderPage title="B2C Intelligence" />} />
            <Route path="career-intel" element={<CoachingCareerIntelPage />} />
            <Route path="profile" element={<PlaceholderPage title="Profile & Settings" />} />
            <Route path="chat-features" element={<PlaceholderPage title="Chat Features" />} />
            <Route path="career-services" element={<PlaceholderPage title="Career Services" />} />
            <Route path="engagement" element={<PlaceholderPage title="Engagement" />} />
            <Route path="growth" element={<CoachingGrowthPage />} />
          </Route>

          {/* ── Candidate Portal (mockup surface) ── */}
          <Route path="/candidate" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboardPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="offers" element={<PlaceholderPage title="Offers & Decisions" />} />
            <Route path="opportunities" element={<PlaceholderPage title="My Opportunities" />} />
            <Route path="interview-prep" element={<CandidateInterviewPrepPage />} />
            <Route path="assessments" element={<CandidateAssessmentsPage />} />
            <Route path="career-dev" element={<PlaceholderPage title="Career Development" />} />
            <Route path="community" element={<CandidateCommunityPage />} />
            <Route path="nexus-coach" element={<PlaceholderPage title="NEXUS Coach" />} />
            <Route path="profile" element={<PlaceholderPage title="Candidate Profile" />} />
            <Route path="advanced-assessments" element={<PlaceholderPage title="Advanced Assessments" />} />
            <Route path="settings-plus" element={<PlaceholderPage title="Settings+" />} />
          </Route>

          {/* ── Authenticated user pages (standalone) ── */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><UserDocumentsPage /></ProtectedRoute>} />
          <Route path="/share/:id" element={<SharePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
