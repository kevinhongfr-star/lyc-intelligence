import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CookieConsent } from '@/components/CookieConsent';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
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
const NexusLanding = lazy(() => import('@/pages/NexusLanding').then(m => ({ default: m.NexusLanding })));
const DexAiPage = lazy(() => import('@/pages/DexAiPage').then(m => ({ default: m.DexAiPage })));
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
const ConsultantPerformancePage = lazy(() => import('@/pages/internal/ConsultantPerformancePage').then(m => ({ default: m.ConsultantPerformancePage })));
const CompliancePage = lazy(() => import('@/pages/internal/CompliancePage').then(m => ({ default: m.CompliancePage })));
const NexusEnginePage = lazy(() => import('@/pages/internal/NexusEnginePage').then(m => ({ default: m.NexusEnginePage })));
const AdminRankingDashboard = lazy(() => import('@/pages/internal/AdminRankingDashboard').then(m => ({ default: m.AdminRankingDashboard })));
const ScoringConfigPage = lazy(() => import('@/pages/internal/ScoringConfigPage').then(m => ({ default: m.ScoringConfigPage })));
const KevinOversightDashboard = lazy(() => import('@/components/kevin/KevinOversightDashboard').then(m => ({ default: m.KevinOversightDashboard })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const ReportDetailPage = lazy(() => import('@/pages/ReportDetailPage').then(m => ({ default: m.ReportDetailPage })));
// ── Phase 7.5 Coaching Excellence (Coach route only) ──
const CoachingPage = lazy(() => import('@/pages/CoachingPage').then(m => ({ default: m.CoachingPage })));
// ── Phase 9 GRID Market Mapping ──
const GridPage = lazy(() => import('@/pages/GridPage'));
// ── Phase 10 TRIDENT + CANVAS ──
const TridentPage = lazy(() => import('@/pages/TridentPage'));
const CanvasPage = lazy(() => import('@/pages/CanvasPage'));
// ── Phase 11 SHIFT Suite ──
const ShiftPage = lazy(() => import('@/pages/ShiftPage'));
// ── Phase 12 CPI Portal Integration ──
const CpiPage = lazy(() => import('@/pages/CpiPage'));

// ── Candidate Portal pages (EO-4) ──
const CandidateDashboardPage = lazy(() => import('@/pages/candidate/CandidateDashboardPage').then(m => ({ default: m.CandidateDashboardPage })));
const CandidateApplicationsPage = lazy(() => import('@/pages/candidate/CandidateApplicationsPage').then(m => ({ default: m.CandidateApplicationsPage })));
const CandidateAssessmentsPage = lazy(() => import('@/pages/candidate/CandidateAssessmentsPage').then(m => ({ default: m.CandidateAssessmentsPage })));
const CandidateCommunityPage = lazy(() => import('@/pages/candidate/CandidateCommunityPage').then(m => ({ default: m.CandidateCommunityPage })));
const CandidateInterviewPrepPage = lazy(() => import('@/pages/candidate/CandidateInterviewPrepPage').then(m => ({ default: m.CandidateInterviewPrepPage })));
const CandidateOpportunitiesPage = lazy(() => import('@/pages/candidate/CandidateOpportunitiesPage').then(m => ({ default: m.CandidateOpportunitiesPage })));

// ── B2B Client Portal pages (EO-1 / SPRINT 3) ──
const ClientOverviewPage = lazy(() => import('@/pages/client/ClientOverviewPage').then(m => ({ default: m.ClientOverviewPage })));
const ClientMandatesPage = lazy(() => import('@/pages/client/ClientMandatesPage').then(m => ({ default: m.ClientMandatesPage })));
const ClientDocumentsPage = lazy(() => import('@/pages/client/ClientDocumentsPage').then(m => ({ default: m.ClientDocumentsPage })));
const ClientPipelineAnalyticsPage = lazy(() => import('@/pages/client/ClientPipelineAnalyticsPage').then(m => ({ default: m.ClientPipelineAnalyticsPage })));

// ── Phase 8 Client Portal ──
const ClientShell = lazy(() => import('@/components/client/ClientShell').then(m => ({ default: m.ClientShell })));
const ClientDashboard = lazy(() => import('@/pages/client/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const CandidatePipeline = lazy(() => import('@/pages/client/CandidatePipeline').then(m => ({ default: m.CandidatePipeline })));
const CandidateReview = lazy(() => import('@/pages/client/CandidateReview').then(m => ({ default: m.CandidateReview })));
const ClientWorkflows = lazy(() => import('@/pages/client/ClientWorkflows').then(m => ({ default: m.ClientWorkflows })));
const ClientEngagement = lazy(() => import('@/pages/client/ClientEngagement').then(m => ({ default: m.ClientEngagement })));

// ── DEX AI B2C Portal pages (EO-5 / SPRINT 2) ──
const DexLandingPage = lazy(() => import('@/pages/dex/DexLandingPage').then(m => ({ default: m.DexLandingPage })));
const DexChatPage = lazy(() => import('@/pages/dex/DexChatPage').then(m => ({ default: m.DexChatPage })));
const DexAssessPage = lazy(() => import('@/pages/dex/DexAssessPage').then(m => ({ default: m.DexAssessPage })));
const DexPlanPage = lazy(() => import('@/pages/dex/DexPlanPage').then(m => ({ default: m.DexPlanPage })));
const DexBookPage = lazy(() => import('@/pages/dex/DexBookPage').then(m => ({ default: m.DexBookPage })));
const DexJourneyPage = lazy(() => import('@/pages/dex/DexJourneyPage').then(m => ({ default: m.DexJourneyPage })));
const CreditStorePage = lazy(() => import('@/pages/dex/CreditStorePage').then(m => ({ default: m.CreditStorePage })));

// ── Legal pages (S4-T03) ──
const TermsPage = lazy(() => import('@/pages/LegalPages').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/LegalPages').then(m => ({ default: m.PrivacyPage })));
const CookiesPage = lazy(() => import('@/pages/LegalPages').then(m => ({ default: m.CookiesPage })));

// ── Billing dashboard (S6-T05) ──
const BillingDashboard = lazy(() => import('@/components/billing/BillingDashboard').then(m => ({ default: m.BillingDashboard })));
// ── Revenue analytics (S6-T06) ──
const RevenueAnalyticsPage = lazy(() => import('@/components/internal/RevenueAnalytics').then(m => ({ default: m.default })));

// ── Placeholder + not found ──
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const PlaceholderPage = lazy(() => import('@/pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));

// ── Admin Portal pages (Phase 4) ──
const AdminShell = lazy(() => import('@/components/admin/AdminShell').then(m => ({ default: m.default })));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then(m => ({ default: m.default })));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then(m => ({ default: m.default })));
const AdminOrganizations = lazy(() => import('@/pages/admin/AdminOrganizations').then(m => ({ default: m.default })));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics').then(m => ({ default: m.default })));
const AdminBilling = lazy(() => import('@/pages/admin/AdminBilling').then(m => ({ default: m.default })));
const AdminConfig = lazy(() => import('@/pages/admin/AdminConfig').then(m => ({ default: m.default })));
const ContentModeration = lazy(() => import('@/components/admin/ContentModeration').then(m => ({ default: m.default })));
const AuditLog = lazy(() => import('@/components/admin/AuditLog').then(m => ({ default: m.default })));
const RolePermissions = lazy(() => import('@/components/admin/RolePermissions').then(m => ({ default: m.default })));

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
      <CookieConsent />
      <OnboardingWizard />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* ── Public pages ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/assessment" element={<Navigate to="/china-leadership-pipeline" replace />} />
          <Route path="/cpi" element={<Navigate to="/china-leadership-pipeline" replace />} />
          <Route path="/china-leadership-pipeline" element={<AssessmentPage />} />
          <Route path="/b2b" element={<B2BLanding />} />
          <Route path="/b2c" element={<Navigate to="/nexus" replace />} />
          <Route path="/nexus" element={<NexusLanding />} />
          <Route path="/nexus/chat" element={<ProtectedRoute><NexusPage /></ProtectedRoute>} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* ── Legal pages (S4-T03) ── */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiesPage />} />

          {/* ── DEX AI credibility page + deprecated route redirect ── */}
          <Route path="/dex-ai" element={<DexAiPage />} />
          <Route path="/dex" element={<Navigate to="/dex-ai" replace />} />
          <Route path="/dex/chat" element={<ProtectedRoute><DexChatPage /></ProtectedRoute>} />
          <Route path="/dex/assess" element={<ProtectedRoute><DexAssessPage /></ProtectedRoute>} />
          <Route path="/dex/plan" element={<ProtectedRoute><DexPlanPage /></ProtectedRoute>} />
          <Route path="/dex/book" element={<ProtectedRoute><DexBookPage /></ProtectedRoute>} />
          <Route path="/dex/journey" element={<ProtectedRoute><DexJourneyPage /></ProtectedRoute>} />
          <Route path="/dex/credits" element={<ProtectedRoute><CreditStorePage /></ProtectedRoute>} />

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
              <Route path="trident" element={<TridentPage />} />
              <Route path="canvas" element={<CanvasPage />} />
              <Route path="shift" element={<ShiftPage />} />
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
              <Route path="consultants" element={<AdminRoute><ConsultantPerformancePage /></AdminRoute>} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="nexus-engine" element={<AdminRoute><NexusEnginePage /></AdminRoute>} />
              <Route path="rankings" element={<AdminRoute><AdminRankingDashboard /></AdminRoute>} />
              <Route path="scoring" element={<AdminRoute><ScoringConfigPage /></AdminRoute>} />
              <Route path="oversight" element={<AdminRoute><KevinOversightDashboard /></AdminRoute>} />
              {/* Revenue analytics (S6-T06) */}
              <Route path="revenue" element={<AdminRoute><RevenueAnalyticsPage /></AdminRoute>} />
              <Route path="intelligence" element={<PlaceholderPage title="Intelligence" />} />
              {/* Phase 7 — Reports & Documents */}
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:id" element={<ReportDetailPage />} />
            </Route>
          )}

          {/* Backward compat: redirect old /platform/* to /app */}
          <Route path="/platform/*" element={<Navigate to="/app" replace />} />

          {/* ── B2B Client Portal (real implementation — SPRINT 3 / EO_1) ── */}
          <Route path="/client" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ClientOverviewPage />} />
            <Route path="mandates" element={<ClientMandatesPage />} />
            <Route path="pipeline-analytics" element={<ClientPipelineAnalyticsPage />} />
            <Route path="talent-intel" element={<PlaceholderPage title="Talent Intelligence" />} />
            <Route path="candidates" element={<PlaceholderPage title="B2B Candidates" />} />
            <Route path="nexus-assistant" element={<PlaceholderPage title="NEXUS Assistant" />} />
            <Route path="documents" element={<ClientDocumentsPage />} />
            <Route path="admin" element={<PlaceholderPage title="Admin & Security" />} />
            <Route path="collaboration" element={<PlaceholderPage title="Collaboration" />} />
            <Route path="onboarding" element={<PlaceholderPage title="Onboarding" />} />
          </Route>

          {/* ── Phase 8 Client Portal ── */}
          <Route path="/client-portal" element={<ProtectedRoute><ClientShell /></ProtectedRoute>}>
            <Route index element={<ClientDashboard />} />
            <Route path="pipeline" element={<CandidatePipeline />} />
            <Route path="reviews" element={<CandidateReview />} />
            <Route path="workflows" element={<ClientWorkflows />} />
            <Route path="engagement" element={<ClientEngagement />} />
          </Route>

          {/* ── B2C Coaching (mockup surface) ── */}
          <Route path="/coaching" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="coach" replace />} />
            {/* Phase 7.5 — primary coach route (integrated) */}
            <Route path="coach" element={<CoachingPage />} />
            {/* Phase 12 — CPI Assessment (portal-integrated) */}
            <Route path="cpi" element={<CpiPage />} />
            <Route path="credits" element={<PlaceholderPage title="Credits & Plans" />} />
            <Route path="intelligence" element={<PlaceholderPage title="B2C Intelligence" />} />
            <Route path="career-intel" element={<PlaceholderPage title="Career Intelligence" />} />
            <Route path="profile" element={<PlaceholderPage title="Profile & Settings" />} />
            <Route path="chat-features" element={<PlaceholderPage title="Chat Features" />} />
            <Route path="career-services" element={<PlaceholderPage title="Career Services" />} />
            <Route path="engagement" element={<PlaceholderPage title="Engagement" />} />
            <Route path="growth" element={<PlaceholderPage title="Growth" />} />
          </Route>

          {/* ── Phase 9 GRID Market Mapping ── */}
          <Route path="/grid" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<GridPage />} />
            <Route path="review" element={<GridPage />} />
          </Route>

          {/* ── Admin Portal (Phase 4) ── */}
          <Route path="/admin" element={<AdminRoute><AdminShell /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="moderation" element={<ContentModeration />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="config" element={<AdminConfig />} />
            <Route path="rbac" element={<RolePermissions />} />
          </Route>

          {/* ── Candidate Portal (mockup surface) ── */}
          <Route path="/candidate" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboardPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="offers" element={<PlaceholderPage title="Offers & Decisions" />} />
            <Route path="opportunities" element={<CandidateOpportunitiesPage />} />
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
          {/* Billing dashboard (S6-T05) */}
          <Route path="/account/billing" element={<ProtectedRoute><BillingDashboard /></ProtectedRoute>} />
          <Route path="/share/:id" element={<SharePage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
