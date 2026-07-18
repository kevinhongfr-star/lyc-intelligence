import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { SkipLink } from '@/components/ui/SkipLink';
import { I18nProvider } from '@/i18n/I18nContext';

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
const PublicHomePage = lazy(() => import('@/pages/public/PublicHomePage').then(m => ({ default: m.PublicHomePage })));
const PublicPricingPage = lazy(() => import('@/pages/public/PublicPricingPage').then(m => ({ default: m.PublicPricingPage })));

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
const ActivitiesPage = lazy(() => import('@/pages/internal/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
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
const ClientTalentIntelPage = lazy(() => import('@/pages/client/ClientTalentIntelPage').then(m => ({ default: m.ClientTalentIntelPage })));
const ClientNexusAssistantPage = lazy(() => import('@/pages/client/ClientNexusAssistantPage').then(m => ({ default: m.ClientNexusAssistantPage })));
const ClientAdminPage = lazy(() => import('@/pages/client/ClientAdminPage').then(m => ({ default: m.ClientAdminPage })));
const ClientCollaborationPage = lazy(() => import('@/pages/client/ClientCollaborationPage').then(m => ({ default: m.ClientCollaborationPage })));
const ClientOnboardingPage = lazy(() => import('@/pages/client/ClientOnboardingPage').then(m => ({ default: m.ClientOnboardingPage })));

// ── Candidate Portal pages (EO-4) ──
const CandidateDashboardPage = lazy(() => import('@/pages/candidate/CandidateDashboardPage').then(m => ({ default: m.CandidateDashboardPage })));
const CandidateApplicationsPage = lazy(() => import('@/pages/candidate/CandidateApplicationsPage').then(m => ({ default: m.CandidateApplicationsPage })));
const CandidateAssessmentsPage = lazy(() => import('@/pages/candidate/CandidateAssessmentsPage').then(m => ({ default: m.CandidateAssessmentsPage })));
const CandidateCommunityPage = lazy(() => import('@/pages/candidate/CandidateCommunityPage').then(m => ({ default: m.CandidateCommunityPage })));
const CandidateInterviewPrepPage = lazy(() => import('@/pages/candidate/CandidateInterviewPrepPage').then(m => ({ default: m.CandidateInterviewPrepPage })));
const CandidateOffersPage = lazy(() => import('@/pages/candidate/CandidateOffersPage').then(m => ({ default: m.CandidateOffersPage })));
const CandidateOpportunitiesPage = lazy(() => import('@/pages/candidate/CandidateOpportunitiesPage').then(m => ({ default: m.CandidateOpportunitiesPage })));
const CandidateCareerDevPage = lazy(() => import('@/pages/candidate/CandidateCareerDevPage').then(m => ({ default: m.CandidateCareerDevPage })));
const CandidateNexusCoachPage = lazy(() => import('@/pages/candidate/CandidateNexusCoachPage').then(m => ({ default: m.CandidateNexusCoachPage })));
const CandidateProfilePage = lazy(() => import('@/pages/candidate/CandidateProfilePage').then(m => ({ default: m.CandidateProfilePage })));
const CandidateAdvancedAssessmentsPage = lazy(() => import('@/pages/candidate/CandidateAdvancedAssessmentsPage').then(m => ({ default: m.CandidateAdvancedAssessmentsPage })));
const CandidateSettingsPlusPage = lazy(() => import('@/pages/candidate/CandidateSettingsPlusPage').then(m => ({ default: m.CandidateSettingsPlusPage })));
const CandidateMessagesPage = lazy(() => import('@/pages/candidate/CandidateMessagesPage').then(m => ({ default: m.CandidateMessagesPage })));
const CandidateDocumentsPage = lazy(() => import('@/pages/candidate/CandidateDocumentsPage').then(m => ({ default: m.CandidateDocumentsPage })));
const CohortAnalyticsDashboard = lazy(() => import('@/pages/admin/CohortAnalyticsDashboard').then(m => ({ default: m.CohortAnalyticsDashboard })));
const CandidateLandingPage = lazy(() => import('@/pages/candidate/CandidateLandingPage').then(m => ({ default: m.CandidateLandingPage })));
const BrowseMandatesPage = lazy(() => import('@/pages/candidate/BrowseMandatesPage').then(m => ({ default: m.BrowseMandatesPage })));
const MandateDetailPublicPage = lazy(() => import('@/pages/candidate/MandateDetailPublicPage').then(m => ({ default: m.MandateDetailPublicPage })));
// ── B2C Coaching Portal pages (EO-5) ──
const CoachingCoachPage = lazy(() => import('@/pages/coaching/CoachingCoachPage').then(m => ({ default: m.CoachingCoachPage })));
const CoachingCreditsPage = lazy(() => import('@/pages/coaching/CoachingCreditsPage').then(m => ({ default: m.CoachingCreditsPage })));
const CoachingCareerIntelPage = lazy(() => import('@/pages/coaching/CoachingCareerIntelPage').then(m => ({ default: m.CoachingCareerIntelPage })));
const CoachingGrowthPage = lazy(() => import('@/pages/coaching/CoachingGrowthPage').then(m => ({ default: m.CoachingGrowthPage })));
const CoachingIntelligencePage = lazy(() => import('@/pages/coaching/CoachingIntelligencePage').then(m => ({ default: m.CoachingIntelligencePage })));
const CoachingProfileSettingsPage = lazy(() => import('@/pages/coaching/CoachingProfileSettingsPage').then(m => ({ default: m.CoachingProfileSettingsPage })));
const CoachingChatFeaturesPage = lazy(() => import('@/pages/coaching/CoachingChatFeaturesPage').then(m => ({ default: m.CoachingChatFeaturesPage })));
const CoachingCareerServicesPage = lazy(() => import('@/pages/coaching/CoachingCareerServicesPage').then(m => ({ default: m.CoachingCareerServicesPage })));
const CoachingEngagementPage = lazy(() => import('@/pages/coaching/CoachingEngagementPage').then(m => ({ default: m.CoachingEngagementPage })));

// ── Council Portal pages ──
const CouncilLandingPage = lazy(() => import('@/pages/council/CouncilLandingPage').then(m => ({ default: m.CouncilLandingPage })));
const CouncilTiersPage = lazy(() => import('@/pages/council/CouncilTiersPage').then(m => ({ default: m.CouncilTiersPage })));
const DexChatPage = lazy(() => import('@/pages/council/DexChatPage').then(m => ({ default: m.DexChatPage })));
const CreditStorePage = lazy(() => import('@/pages/council/CreditStorePage').then(m => ({ default: m.CreditStorePage })));
const CouncilDashboardPage = lazy(() => import('@/pages/council/CouncilDashboardPage').then(m => ({ default: m.CouncilDashboardPage })));
const CouncilCoachingPage = lazy(() => import('@/pages/council/CouncilCoachingPage').then(m => ({ default: m.CouncilCoachingPage })));
const CouncilEventDetailPage = lazy(() => import('@/pages/council/CouncilEventDetailPage').then(m => ({ default: m.CouncilEventDetailPage })));
const CouncilCommunityPage = lazy(() => import('@/pages/council/CouncilCommunityPage').then(m => ({ default: m.CouncilCommunityPage })));
const CouncilDirectoryPage = lazy(() => import('@/pages/council/CouncilDirectoryPage').then(m => ({ default: m.CouncilDirectoryPage })));
const CouncilProfilePage = lazy(() => import('@/pages/council/CouncilProfilePage').then(m => ({ default: m.CouncilProfilePage })));
const CouncilBenefitsPage = lazy(() => import('@/pages/council/CouncilBenefitsPage').then(m => ({ default: m.CouncilBenefitsPage })));

// ── Council Admin pages ──
const CouncilAdminDashboardPage = lazy(() => import('@/pages/admin/council/CouncilAdminDashboardPage').then(m => ({ default: m.CouncilAdminDashboardPage })));
const CouncilEventManagerPage = lazy(() => import('@/pages/admin/council/CouncilEventManagerPage').then(m => ({ default: m.CouncilEventManagerPage })));
const CouncilCoachingManagerPage = lazy(() => import('@/pages/admin/council/CouncilCoachingManagerPage').then(m => ({ default: m.CouncilCoachingManagerPage })));
const CouncilApplicationsPage = lazy(() => import('@/pages/admin/council/CouncilApplicationsPage').then(m => ({ default: m.CouncilApplicationsPage })));

// ── Academy Admin pages (Issue #17) ──
const AcademyAdminPage = lazy(() => import('@/pages/admin/academy/AcademyAdminPage').then(m => ({ default: m.AcademyAdminPage })));
const AcademyCourseEditorPage = lazy(() => import('@/pages/admin/academy/AcademyCourseEditorPage').then(m => ({ default: m.AcademyCourseEditorPage })));
const AcademyEnrollmentsPage = lazy(() => import('@/pages/admin/academy/AcademyEnrollmentsPage').then(m => ({ default: m.AcademyEnrollmentsPage })));

// ── Intelligence Layer pages ──
const IntelligenceDashboardPage = lazy(() => import('@/pages/intelligence/IntelligenceDashboardPage').then(m => ({ default: m.IntelligenceDashboardPage })));
const CompanyIntelligencePage = lazy(() => import('@/pages/intelligence/CompanyIntelligencePage').then(m => ({ default: m.CompanyIntelligencePage })));
const IntelligenceSourcesPage = lazy(() => import('@/pages/admin/IntelligenceSourcesPage').then(m => ({ default: m.IntelligenceSourcesPage })));

// ── Placeholder + not found ──
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));


function Loading() {
  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      {/* Sidebar skeleton */}
      <div className="w-60 bg-white border-r border-[#E5E5E5] p-4 space-y-3 hidden md:block">
        <div className="h-8 bg-[#F7F7F7] rounded animate-pulse" />
        <div className="space-y-2 mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-5 bg-[#F7F7F7] rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="h-8 bg-[#F7F7F7] rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-lg border border-[#E5E5E5] p-4 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="h-4 bg-[#F7F7F7] rounded w-2/3 mb-3" />
              <div className="h-8 bg-[#F7F7F7] rounded w-1/2" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-lg border border-[#E5E5E5] p-4 animate-pulse" style={{ animationDelay: `${(i + 3) * 150}ms` }}>
              <div className="h-4 bg-[#F7F7F7] rounded w-1/3 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-[#F7F7F7] rounded w-full" />
                <div className="h-3 bg-[#F7F7F7] rounded w-4/5" />
                <div className="h-3 bg-[#F7F7F7] rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    <I18nProvider>
    <SkipLink />
    <CreditProvider>
      <ToastContainer />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* ── Public pages ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<PublicHomePage />} />
          <Route path="/pricing-v2" element={<PublicPricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/b2b" element={<B2BLanding />} />
          <Route path="/b2c" element={<B2CLanding />} />
          <Route path="/nexus" element={<NexusLanding />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* ── Candidate Portal (public pages) ── */}
          <Route path="/candidates" element={<CandidateLandingPage />} />
          <Route path="/candidates/mandates" element={<BrowseMandatesPage />} />
          <Route path="/candidates/mandates/:id" element={<MandateDetailPublicPage />} />

          {/* ── Council Portal (public pages) ── */}
          <Route path="/council" element={<CouncilLandingPage />} />
          <Route path="/council/tiers" element={<CouncilTiersPage />} />

          {/* ── Council Member Portal (auth required) ── */}
          <Route path="/council/dashboard" element={<ProtectedRoute><CouncilDashboardPage /></ProtectedRoute>} />
          <Route path="/council/coaching" element={<ProtectedRoute><CouncilCoachingPage /></ProtectedRoute>} />
          <Route path="/council/events/:id" element={<ProtectedRoute><CouncilEventDetailPage /></ProtectedRoute>} />
          <Route path="/council/community" element={<ProtectedRoute><CouncilCommunityPage /></ProtectedRoute>} />
          <Route path="/council/directory" element={<ProtectedRoute><CouncilDirectoryPage /></ProtectedRoute>} />
          <Route path="/council/profile" element={<ProtectedRoute><CouncilProfilePage /></ProtectedRoute>} />
          <Route path="/council/benefits" element={<ProtectedRoute><CouncilBenefitsPage /></ProtectedRoute>} />

          {/* ── Council Admin (auth + admin required) ── */}
          <Route path="/admin/council" element={<AdminRoute><CouncilAdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/council/events" element={<AdminRoute><CouncilEventManagerPage /></AdminRoute>} />
          <Route path="/admin/council/coaching" element={<AdminRoute><CouncilCoachingManagerPage /></AdminRoute>} />
          <Route path="/admin/council/applications" element={<AdminRoute><CouncilApplicationsPage /></AdminRoute>} />

          {/* ── Academy Admin (auth + admin required) — Issue #17 ── */}
          <Route path="/admin/academy" element={<AdminRoute><AcademyAdminPage /></AdminRoute>} />
          <Route path="/admin/academy/courses/:id" element={<AdminRoute><AcademyCourseEditorPage /></AdminRoute>} />
          <Route path="/admin/academy/enrollments" element={<AdminRoute><AcademyEnrollmentsPage /></AdminRoute>} />

          {/* ── DEX AI B2C (auth required) ── */}
          <Route path="/dex/chat" element={<ProtectedRoute><DexChatPage /></ProtectedRoute>} />
          <Route path="/dex/credits" element={<ProtectedRoute><CreditStorePage /></ProtectedRoute>} />

          {/* ── Internal Operations (mockup surface) ── */}
          
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
              <Route path="activities" element={<ActivitiesPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="nexus-engine" element={<AdminRoute><NexusEnginePage /></AdminRoute>} />
              <Route path="oversight" element={<AdminRoute><KevinOversightDashboard /></AdminRoute>} />
              <Route path="intelligence" element={<IntelligenceDashboardPage />} />
              <Route path="intelligence/companies/:id" element={<CompanyIntelligencePage />} />
              <Route path="admin/intelligence/sources" element={<AdminRoute><IntelligenceSourcesPage /></AdminRoute>} />
            </Route>

          {/* Backward compat: redirect old /platform/* to /app */}
          <Route path="/platform/*" element={<Navigate to="/app" replace />} />

          {/* ── B2B Client Portal (mockup surface) ── */}
          <Route path="/client" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ClientOverviewPage />} />
            <Route path="pipeline-analytics" element={<ClientPipelineAnalyticsPage />} />
            <Route path="talent-intel" element={<ClientTalentIntelPage />} />
            <Route path="mandates" element={<ClientMandatesPage />} />
            <Route path="candidates" element={<ClientCandidatesPage />} />
            <Route path="nexus-assistant" element={<ClientNexusAssistantPage />} />
            <Route path="documents" element={<ClientDocumentsPage />} />
            <Route path="admin" element={<ClientAdminPage />} />
            <Route path="collaboration" element={<ClientCollaborationPage />} />
            <Route path="onboarding" element={<ClientOnboardingPage />} />
          </Route>

          {/* ── B2C Coaching (mockup surface) ── */}
          <Route path="/coaching" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="coach" replace />} />
            <Route path="coach" element={<CoachingCoachPage />} />
            <Route path="credits" element={<CoachingCreditsPage />} />
            <Route path="intelligence" element={<CoachingIntelligencePage />} />
            <Route path="career-intel" element={<CoachingCareerIntelPage />} />
            <Route path="profile" element={<CoachingProfileSettingsPage />} />
            <Route path="chat-features" element={<CoachingChatFeaturesPage />} />
            <Route path="career-services" element={<CoachingCareerServicesPage />} />
            <Route path="engagement" element={<CoachingEngagementPage />} />
            <Route path="growth" element={<CoachingGrowthPage />} />
          </Route>

          {/* ── Candidate Portal (mockup surface) ── */}
          <Route path="/candidate" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboardPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="offers" element={<CandidateOffersPage />} />
            <Route path="opportunities" element={<CandidateOpportunitiesPage />} />
            <Route path="interview-prep" element={<CandidateInterviewPrepPage />} />
            <Route path="assessments" element={<CandidateAssessmentsPage />} />
            <Route path="career-dev" element={<CandidateCareerDevPage />} />
            <Route path="community" element={<CandidateCommunityPage />} />
            <Route path="nexus-coach" element={<CandidateNexusCoachPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
            <Route path="advanced-assessments" element={<CandidateAdvancedAssessmentsPage />} />
            <Route path="settings-plus" element={<CandidateSettingsPlusPage />} />
            <Route path="messages" element={<CandidateMessagesPage />} />
            <Route path="documents" element={<CandidateDocumentsPage />} />
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
    </I18nProvider>
    </ErrorBoundary>
  );
}
