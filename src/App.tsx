import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// ── Lazy-loaded page components (ESM dynamic import — works in browser) ──

const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const B2BLanding = lazy(() => import('@/pages/B2BLanding').then(m => ({ default: m.B2BLanding })));
const B2CLanding = lazy(() => import('@/pages/B2CLanding').then(m => ({ default: m.B2CLanding })));
const NexusLanding = lazy(() => import('@/pages/NexusLanding').then(m => ({ default: m.NexusLanding })));
const MatchPage = lazy(() => import('@/pages/MatchPage').then(m => ({ default: m.MatchPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
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

const ENABLE_PLATFORM = import.meta.env.VITE_ENABLE_PLATFORM === 'true';

function Loading() { return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>; }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
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
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
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
              <Route path="mandates/:id" element={<MandateDetailPage />} />
              <Route path="mandates/:id/lens" element={<LensExportPage />} />
              <Route path="candidates" element={<CandidatesPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="batch-scoring" element={<BatchScoringPage />} />
              <Route path="metrix" element={<MetrixPage />} />
              <Route path="scoring-runs" element={<ScoringRunsPage />} />
              <Route path="chat" element={<NexusPage />} />
              <Route path="scheduler" element={<SchedulerPage />} />
              <Route path="documents" element={<PlatformDocumentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          )}
        </Routes>
      </Suspense>
    </CreditProvider>
    </ErrorBoundary>
  );
}
