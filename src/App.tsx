import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { PortalRouteGuard } from '@/components/shared/PortalRouteGuard';

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

// ── Portal pages — lazy-loaded via ESM dynamic import ──
const ClientOverview = lazy(() => import('@/pages/client/ClientOverview').then(m => ({ default: m.ClientOverview })));

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

          {/* ── B2B Client Portal ── */}
          <Route path="/client-portal" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>}>
          </Route>
          <Route path="/client-portal/overview" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />
          <Route path="/client-portal/mandates" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />
          <Route path="/client-portal/candidates" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />
          <Route path="/client-portal/pipeline-analytics" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />
          <Route path="/client-portal/talent-intel" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />
          <Route path="/client-portal/nexus-assistant" element={<PortalRouteGuard requiredRole="client"><NexusPage /></PortalRouteGuard>} />
          <Route path="/client-portal/documents" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />
          <Route path="/client-portal/collaboration" element={<PortalRouteGuard requiredRole="client"><ClientOverview /></PortalRouteGuard>} />

          {/* ── B2C Leader Portal ── */}
          <Route path="/leader-portal" element={<PortalRouteGuard requiredRole="leader"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/leader-portal/coach" element={<PortalRouteGuard requiredRole="leader"><NexusPage /></PortalRouteGuard>} />
          <Route path="/leader-portal/intelligence" element={<PortalRouteGuard requiredRole="leader"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/leader-portal/career-intel" element={<PortalRouteGuard requiredRole="leader"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/leader-portal/growth" element={<PortalRouteGuard requiredRole="leader"><ProgressPage /></PortalRouteGuard>} />
          <Route path="/leader-portal/credits" element={<PortalRouteGuard requiredRole="leader"><PricingPage /></PortalRouteGuard>} />
          <Route path="/leader-portal/profile-settings" element={<PortalRouteGuard requiredRole="leader"><ProfilePage /></PortalRouteGuard>} />

          {/* ── Candidate Portal ── */}
          <Route path="/candidate" element={<PortalRouteGuard requiredRole="candidate"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/candidate/dashboard" element={<PortalRouteGuard requiredRole="candidate"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/candidate/opportunities" element={<PortalRouteGuard requiredRole="candidate"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/candidate/applications" element={<PortalRouteGuard requiredRole="candidate"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/candidate/interview-prep" element={<PortalRouteGuard requiredRole="candidate"><NexusPage /></PortalRouteGuard>} />
          <Route path="/candidate/assessments" element={<PortalRouteGuard requiredRole="candidate"><AssessmentPage /></PortalRouteGuard>} />
          <Route path="/candidate/offers" element={<PortalRouteGuard requiredRole="candidate"><DashboardPage /></PortalRouteGuard>} />
          <Route path="/candidate/career-dev" element={<PortalRouteGuard requiredRole="candidate"><ProgressPage /></PortalRouteGuard>} />
          <Route path="/candidate/nexus-coach" element={<PortalRouteGuard requiredRole="candidate"><NexusPage /></PortalRouteGuard>} />
          <Route path="/candidate/profile" element={<PortalRouteGuard requiredRole="candidate"><ProfilePage /></PortalRouteGuard>} />
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
