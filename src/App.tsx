import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ICPRoute } from '@/components/ICPRoute';
import { RoleRoute } from '@/components/RoleRoute';
import { DashboardRouter } from '@/components/DashboardRouter';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';

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
const UserDocumentsPage = lazy(() => import('@/pages/UserDocumentsPage').then(m => ({ default: m.UserDocumentsPage })));
const SharePage = lazy(() => import('@/pages/SharePage').then(m => ({ default: m.SharePage })));

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

const ClientPortal = lazy(() => import('@/components/client/ClientPortal').then(m => ({ default: m.ClientPortal })));
const ClientDashboard = lazy(() => import('@/components/client/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const ClientMandates = lazy(() => import('@/components/client/ClientMandates').then(m => ({ default: m.ClientMandates })));
const ClientMandateDetail = lazy(() => import('@/components/client/ClientMandateDetail').then(m => ({ default: m.ClientMandateDetail })));
const ClientShortlist = lazy(() => import('@/components/client/ClientShortlist').then(m => ({ default: m.ClientShortlist })));
const ClientReports = lazy(() => import('@/components/client/ClientReports').then(m => ({ default: m.ClientReports })));
const ClientSettings = lazy(() => import('@/components/client/ClientSettings').then(m => ({ default: m.ClientSettings })));

const CandidatePortal = lazy(() => import('@/components/candidate/CandidatePortal').then(m => ({ default: m.CandidatePortal })));
const CandidateDashboard = lazy(() => import('@/components/candidate/CandidateDashboard').then(m => ({ default: m.CandidateDashboard })));
const CandidateProfile = lazy(() => import('@/components/candidate/CandidateProfile').then(m => ({ default: m.CandidateProfile })));
const CandidateApplications = lazy(() => import('@/components/candidate/CandidateApplications').then(m => ({ default: m.CandidateApplications })));
const CandidateApplicationDetail = lazy(() => import('@/components/candidate/CandidateApplicationDetail').then(m => ({ default: m.CandidateApplicationDetail })));
const CandidateAssessments = lazy(() => import('@/components/candidate/CandidateAssessments').then(m => ({ default: m.CandidateAssessments })));
const CandidateInsights = lazy(() => import('@/components/candidate/CandidateInsights').then(m => ({ default: m.CandidateInsights })));
const CandidateSettings = lazy(() => import('@/components/candidate/CandidateSettings').then(m => ({ default: m.CandidateSettings })));

const BDPortal = lazy(() => import('@/components/bd/BDPortal').then(m => ({ default: m.BDPortal })));
const BDDashboard = lazy(() => import('@/components/bd/BDDashboard').then(m => ({ default: m.BDDashboard })));
const OpportunityList = lazy(() => import('@/components/bd/OpportunityList').then(m => ({ default: m.OpportunityList })));
const OpportunityDetail = lazy(() => import('@/components/bd/OpportunityDetail').then(m => ({ default: m.OpportunityDetail })));
const OpportunityForm = lazy(() => import('@/components/bd/OpportunityForm').then(m => ({ default: m.OpportunityForm })));
const ClientRelationships = lazy(() => import('@/components/bd/ClientRelationships').then(m => ({ default: m.ClientRelationships })));
const ClientDetail = lazy(() => import('@/components/bd/ClientDetail').then(m => ({ default: m.ClientDetail })));
const BDForecast = lazy(() => import('@/components/bd/BDForecast').then(m => ({ default: m.BDForecast })));
const BDMarketIntel = lazy(() => import('@/components/bd/BDMarketIntel').then(m => ({ default: m.BDMarketIntel })));

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
              <Route path="/platform" element={
                <ProtectedRoute>
                  <ICPRoute allowedICP={['consultant', 'leader']}>
                    <AppLayout />
                  </ICPRoute>
                </ProtectedRoute>
              }>
                <Route index element={<DashboardRouter />} />
                <Route path="mandates" element={<RoleRoute allowedICP={['consultant', 'leader']}><MandatesPage /></RoleRoute>} />
                <Route path="mandates/new" element={<RoleRoute allowedICP={['consultant']}><ProposalBuilderPage /></RoleRoute>} />
                <Route path="mandates/:id/edit" element={<RoleRoute allowedICP={['consultant']}><ProposalBuilderPage /></RoleRoute>} />
                <Route path="mandates/:id" element={<RoleRoute allowedICP={['consultant', 'leader']}><MandateDetailPage /></RoleRoute>} />
                <Route path="mandates/:id/lens" element={<RoleRoute allowedICP={['consultant']}><LensExportPage /></RoleRoute>} />
                <Route path="candidates" element={<RoleRoute allowedICP={['consultant']}><CandidatesPage /></RoleRoute>} />
                <Route path="candidates/:id" element={<RoleRoute allowedICP={['consultant']}><ExecutiveProfilePage /></RoleRoute>} />
                <Route path="candidates/:id/report" element={<RoleRoute allowedICP={['consultant']}><CandidateReportPage /></RoleRoute>} />
                <Route path="companies" element={<RoleRoute allowedICP={['consultant', 'leader']}><CompaniesPage /></RoleRoute>} />
                <Route path="pipeline" element={<RoleRoute allowedICP={['consultant']}><PipelinePage /></RoleRoute>} />
                <Route path="batch-scoring" element={<RoleRoute allowedICP={['consultant']}><BatchScoringPage /></RoleRoute>} />
                <Route path="metrix" element={<RoleRoute allowedICP={['consultant']}><MetrixPage /></RoleRoute>} />
                <Route path="scoring-runs" element={<RoleRoute allowedRoles={['admin']}><ScoringRunsPage /></RoleRoute>} />
                <Route path="chat" element={<RoleRoute allowedICP={['consultant', 'leader']}><NexusPage /></RoleRoute>} />
                <Route path="scheduler" element={<RoleRoute allowedICP={['consultant']}><SchedulerPage /></RoleRoute>} />
                <Route path="documents" element={<RoleRoute allowedICP={['consultant', 'leader']}><PlatformDocumentsPage /></RoleRoute>} />
                <Route path="org-intel" element={<RoleRoute allowedRoles={['admin']}><OrgIntelligencePage /></RoleRoute>} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<RoleRoute allowedRoles={['admin']}><SettingsPage /></RoleRoute>} />
              </Route>
            )}
            <Route path="/client" element={
              <ProtectedRoute>
                <ICPRoute allowedICP="client">
                  <ClientPortal />
                </ICPRoute>
              </ProtectedRoute>
            }>
              <Route index element={<ClientDashboard />} />
              <Route path="mandates" element={<ClientMandates />} />
              <Route path="mandates/:id" element={<ClientMandateDetail />} />
              <Route path="mandates/:id/shortlist" element={<ClientShortlist />} />
              <Route path="reports" element={<ClientReports />} />
              <Route path="settings" element={<ClientSettings />} />
            </Route>
            <Route path="/candidate" element={
              <ProtectedRoute>
                <ICPRoute allowedICP="candidate">
                  <CandidatePortal />
                </ICPRoute>
              </ProtectedRoute>
            }>
              <Route index element={<CandidateDashboard />} />
              <Route path="profile" element={<CandidateProfile />} />
              <Route path="applications" element={<CandidateApplications />} />
              <Route path="applications/:id" element={<CandidateApplicationDetail />} />
              <Route path="assessments" element={<CandidateAssessments />} />
              <Route path="insights" element={<CandidateInsights />} />
              <Route path="settings" element={<CandidateSettings />} />
            </Route>

            {/* BD Portal routes */}
            <Route path="/bd" element={
              <ProtectedRoute>
                <RoleRoute allowedSubtypes={['bd_manager']}>
                  <BDPortal />
                </RoleRoute>
              </ProtectedRoute>
            }>
              <Route index element={<BDDashboard />} />
              <Route path="opportunities" element={<OpportunityList />} />
              <Route path="opportunities/new" element={<OpportunityForm />} />
              <Route path="opportunities/:id" element={<OpportunityDetail />} />
              <Route path="clients" element={<ClientRelationships />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="forecast" element={<BDForecast />} />
              <Route path="market-intel" element={<BDMarketIntel />} />
              <Route path="chat" element={<NexusPage />} />
            </Route>
          </Routes>
        </Suspense>
      </CreditProvider>
    </ErrorBoundary>
  );
}
