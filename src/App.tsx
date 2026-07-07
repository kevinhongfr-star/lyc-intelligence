import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';

// ── Lazy-loaded page components (ESM dynamic import — works in browser) ──

const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const B2BLanding = lazy(() => import('@/pages/B2BLanding').then(m => ({ default: m.B2BLanding })));
const B2CLanding = lazy(() => import('@/pages/B2CLanding').then(m => ({ default: m.B2CLanding })));
const NexusLanding = lazy(() => import('@/pages/NexusLanding').then(m => ({ default: m.NexusLanding })));
const MatchPage = lazy(() => import('@/pages/MatchPage').then(m => ({ default: m.MatchPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProgressPage = lazy(() => import('@/pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const UserDocumentsPage = lazy(() => import('@/pages/UserDocumentsPage').then(m => ({ default: m.DocumentsPage })));
const SharePage = lazy(() => import('@/pages/SharePage').then(m => ({ default: m.SharePage })));

// ── Platform components — lazy-loaded via ESM dynamic import ──
const AppLayout = lazy(() => import('@/components/layout/AppLayout').then(m => ({ default: m.AppLayout })));
const ConsultantDashboard = lazy(() => import('@/components/dashboard/ConsultantDashboard').then(m => ({ default: m.ConsultantDashboard })));
const MandatesPage = lazy(() => import('@/pages/MandatesPage').then(m => ({ default: m.MandatesPage })));
const CandidatesPage = lazy(() => import('@/pages/CandidatesPage').then(m => ({ default: m.CandidatesPage })));
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const MandateDetailPage = lazy(() => import('@/pages/MandateDetailPage').then(m => ({ default: m.MandateDetailPage })));
const BatchScoringPage = lazy(() => import('@/pages/BatchScoringPage').then(m => ({ default: m.BatchScoringPage })));
const NexusPage = lazy(() => import('@/pages/NexusPage').then(m => ({ default: m.NexusPage })));
const SchedulerPage = lazy(() => import('@/pages/SchedulerPage').then(m => ({ default: m.SchedulerPage })));
const PlatformDocumentsPage = lazy(() => import('@/pages/DocumentsPage').then(m => ({ default: m.DocumentsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })));
const MetrixPage = lazy(() => import('@/pages/MetrixPage').then(m => ({ default: m.MetrixPage })));
const ScoringRunsPage = lazy(() => import('@/pages/ScoringRunsPage').then(m => ({ default: m.ScoringRunsPage })));
const LensExportPage = lazy(() => import('@/pages/LensExportPage').then(m => ({ default: m.LensExportPage })));
const OrgIntelligencePage = lazy(() => import('@/pages/OrgIntelligencePage').then(m => ({ default: m.OrgIntelligencePage })));
const ExecutiveProfilePage = lazy(() => import('@/pages/ExecutiveProfilePage').then(m => ({ default: m.ExecutiveProfilePage })));
const CandidateReportPage = lazy(() => import('@/pages/CandidateReportPage').then(m => ({ default: m.CandidateReportPage })));
const ProposalBuilderPage = lazy(() => import('@/pages/ProposalBuilderPage').then(m => ({ default: m.ProposalBuilderPage })));

const ClientPortalLayout = lazy(() => import('@/components/client/ClientPortalLayout').then(m => ({ default: m.ClientPortalLayout })));
const ClientPortalOverview = lazy(() => import('@/pages/ClientPortalOverview').then(m => ({ default: m.ClientPortalOverview })));
const ClientPortalMandates = lazy(() => import('@/pages/ClientPortalMandates').then(m => ({ default: m.ClientPortalMandates })));
const ClientPortalCandidates = lazy(() => import('@/pages/ClientPortalCandidates').then(m => ({ default: m.ClientPortalCandidates })));
const ClientPortalPipelineAnalytics = lazy(() => import('@/pages/ClientPortalPipelineAnalytics').then(m => ({ default: m.ClientPortalPipelineAnalytics })));
const ClientPortalTalentIntel = lazy(() => import('@/pages/ClientPortalTalentIntel').then(m => ({ default: m.ClientPortalTalentIntel })));
const ClientPortalNexus = lazy(() => import('@/pages/ClientPortalNexus').then(m => ({ default: m.ClientPortalNexus })));
const ClientPortalDocuments = lazy(() => import('@/pages/ClientPortalDocuments').then(m => ({ default: m.ClientPortalDocuments })));
const ClientPortalCollaboration = lazy(() => import('@/pages/ClientPortalCollaboration').then(m => ({ default: m.ClientPortalCollaboration })));
const ClientPortalOnboarding = lazy(() => import('@/pages/ClientPortalOnboarding').then(m => ({ default: m.ClientPortalOnboarding })));
const ClientPortalAdmin = lazy(() => import('@/pages/ClientPortalAdmin').then(m => ({ default: m.ClientPortalAdmin })));

const PortalRouteGuard = lazy(() => import('@/components/shared/PortalRouteGuard').then(m => ({ default: m.PortalRouteGuard })));

// ── B2C Leader Portal — lazy-loaded ──
const B2CPortalLayout = lazy(() => import('@/components/b2c/B2CPortalLayout').then(m => ({ default: m.B2CPortalLayout })));
const B2CCoachPage = lazy(() => import('@/pages/B2CCoachPage').then(m => ({ default: m.B2CCoachPage })));
const B2CIntelligencePage = lazy(() => import('@/pages/B2CIntelligencePage').then(m => ({ default: m.B2CIntelligencePage })));
const B2CCareerIntelPage = lazy(() => import('@/pages/B2CCareerIntelPage').then(m => ({ default: m.B2CCareerIntelPage })));
const B2CGrowthPage = lazy(() => import('@/pages/B2CGrowthPage').then(m => ({ default: m.B2CGrowthPage })));
const B2CCareerServicesPage = lazy(() => import('@/pages/B2CCareerServicesPage').then(m => ({ default: m.B2CCareerServicesPage })));
const B2CEngagementPage = lazy(() => import('@/pages/B2CEngagementPage').then(m => ({ default: m.B2CEngagementPage })));
const B2CCreditsPage = lazy(() => import('@/pages/B2CCreditsPage').then(m => ({ default: m.B2CCreditsPage })));
const B2CChatPlusPage = lazy(() => import('@/pages/B2CChatPlusPage').then(m => ({ default: m.B2CChatPlusPage })));
const B2CProfileSettingsPage = lazy(() => import('@/pages/B2CProfileSettingsPage').then(m => ({ default: m.B2CProfileSettingsPage })));

// ── Candidate Portal — lazy-loaded ──
const CandidatePortalLayout = lazy(() => import('@/components/candidate/CandidatePortalLayout').then(m => ({ default: m.CandidatePortalLayout })));
const CandidateDashboardPage = lazy(() => import('@/pages/CandidateDashboardPage').then(m => ({ default: m.CandidateDashboardPage })));
const CandidateOpportunitiesPage = lazy(() => import('@/pages/CandidateOpportunitiesPage').then(m => ({ default: m.CandidateOpportunitiesPage })));
const CandidateApplicationsPage = lazy(() => import('@/pages/CandidateApplicationsPage').then(m => ({ default: m.CandidateApplicationsPage })));
const CandidateInterviewPrepPage = lazy(() => import('@/pages/CandidateInterviewPrepPage').then(m => ({ default: m.CandidateInterviewPrepPage })));
const CandidateAssessmentsPage = lazy(() => import('@/pages/CandidateAssessmentsPage').then(m => ({ default: m.CandidateAssessmentsPage })));
const CandidateOffersPage = lazy(() => import('@/pages/CandidateOffersPage').then(m => ({ default: m.CandidateOffersPage })));
const CandidateCareerDevPage = lazy(() => import('@/pages/CandidateCareerDevPage').then(m => ({ default: m.CandidateCareerDevPage })));
const CandidateNexusCoachPage = lazy(() => import('@/pages/CandidateNexusCoachPage').then(m => ({ default: m.CandidateNexusCoachPage })));
const CandidateCommunityPage = lazy(() => import('@/pages/CandidateCommunityPage').then(m => ({ default: m.CandidateCommunityPage })));
const CandidateAdvAssessPage = lazy(() => import('@/pages/CandidateAdvAssessPage').then(m => ({ default: m.CandidateAdvAssessPage })));
const CandidateSettingsPage = lazy(() => import('@/pages/CandidateSettingsPage').then(m => ({ default: m.CandidateSettingsPage })));
const CandidateProfilePage = lazy(() => import('@/pages/CandidateProfilePage').then(m => ({ default: m.CandidateProfilePage })));

// ── Reports Module — lazy-loaded (admin/consultant) ──
const ReportsListPage = lazy(() => import('@/pages/ReportsListPage').then(m => ({ default: m.ReportsListPage })));
const CompetitiveIntelReportPage = lazy(() => import('@/pages/CompetitiveIntelReportPage').then(m => ({ default: m.CompetitiveIntelReportPage })));
const OrgHealthReportPage = lazy(() => import('@/pages/OrgHealthReportPage').then(m => ({ default: m.OrgHealthReportPage })));
const TalentDeepDiveReportPage = lazy(() => import('@/pages/TalentDeepDiveReportPage').then(m => ({ default: m.TalentDeepDiveReportPage })));
const ReportBuilderPage = lazy(() => import('@/pages/ReportBuilderPage').then(m => ({ default: m.ReportBuilderPage })));

const ENABLE_PLATFORM = import.meta.env.VITE_ENABLE_PLATFORM === 'true';

function Loading() { return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>; }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  const role = profile?.role ?? (user as any)?.app_metadata?.role ?? null;
  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-center px-6">
        <h1 className="text-2xl font-serif">Admin access required</h1>
        <p className="text-text-muted max-w-md">
          This page is restricted to LYC platform administrators. You are signed in as
          <span className="font-mono text-text-primary ml-1">{user.email}</span>.
        </p>
        <a href="/platform" className="mt-2 text-accent hover:underline">
          Return to dashboard
        </a>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  const { initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
    <CreditProvider>
      <ToastContainer />
      <Suspense fallback={<Loading />}>
        <Routes>
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
            </Route>
          )}
          
          <Route path="/client-portal" element={<ProtectedRoute><PortalRouteGuard requiredRole="client"><ClientPortalLayout /></PortalRouteGuard></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" />} />
            <Route path="overview" element={<ClientPortalOverview />} />
            <Route path="mandates" element={<ClientPortalMandates />} />
            <Route path="candidates" element={<ClientPortalCandidates />} />
            <Route path="pipeline-analytics" element={<ClientPortalPipelineAnalytics />} />
            <Route path="talent-intel" element={<ClientPortalTalentIntel />} />
            <Route path="nexus-assistant" element={<ClientPortalNexus />} />
            <Route path="documents" element={<ClientPortalDocuments />} />
            <Route path="collaboration" element={<ClientPortalCollaboration />} />
            <Route path="onboarding" element={<ClientPortalOnboarding />} />
            <Route path="admin" element={<ClientPortalAdmin />} />
          </Route>

          {/* === B2C LEADER PORTAL === */}
          <Route path="/leader-portal" element={<ProtectedRoute><PortalRouteGuard requiredRole="leader"><B2CPortalLayout /></PortalRouteGuard></ProtectedRoute>}>
            <Route index element={<Navigate to="coach" />} />
            <Route path="coach" element={<B2CCoachPage />} />
            <Route path="intelligence" element={<B2CIntelligencePage />} />
            <Route path="career-intel" element={<B2CCareerIntelPage />} />
            <Route path="growth" element={<B2CGrowthPage />} />
            <Route path="career-services" element={<B2CCareerServicesPage />} />
            <Route path="engagement" element={<B2CEngagementPage />} />
            <Route path="credits" element={<B2CCreditsPage />} />
            <Route path="chat-plus" element={<B2CChatPlusPage />} />
            <Route path="profile-settings" element={<B2CProfileSettingsPage />} />
          </Route>

          {/* === CANDIDATE PORTAL === */}
          <Route path="/candidate" element={<ProtectedRoute><PortalRouteGuard requiredRole="candidate"><CandidatePortalLayout /></PortalRouteGuard></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<CandidateDashboardPage />} />
            <Route path="opportunities" element={<CandidateOpportunitiesPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="interview-prep" element={<CandidateInterviewPrepPage />} />
            <Route path="assessments" element={<CandidateAssessmentsPage />} />
            <Route path="offers" element={<CandidateOffersPage />} />
            <Route path="career-dev" element={<CandidateCareerDevPage />} />
            <Route path="nexus-coach" element={<CandidateNexusCoachPage />} />
            <Route path="community" element={<CandidateCommunityPage />} />
            <Route path="advanced-assess" element={<CandidateAdvAssessPage />} />
            <Route path="settings" element={<CandidateSettingsPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
          </Route>

          {/* === REPORTS MODULE (admin/consultant) === */}
          <Route path="/reports" element={<AdminRoute><ReportsListPage /></AdminRoute>} />
          <Route path="/reports/competitive-intel" element={<AdminRoute><CompetitiveIntelReportPage /></AdminRoute>} />
          <Route path="/reports/org-health" element={<AdminRoute><OrgHealthReportPage /></AdminRoute>} />
          <Route path="/reports/talent-deep-dive" element={<AdminRoute><TalentDeepDiveReportPage /></AdminRoute>} />
          <Route path="/reports/builder" element={<AdminRoute><ReportBuilderPage /></AdminRoute>} />
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
