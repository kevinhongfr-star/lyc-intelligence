import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const B2BLanding = lazy(() => import('@/pages/B2BLanding').then(m => ({ default: m.B2BLanding })));
const B2CLanding = lazy(() => import('@/pages/B2CLanding').then(m => ({ default: m.B2CLanding })));
const NexusLanding = lazy(() => import('@/pages/NexusLanding').then(m => ({ default: m.NexusLanding })));
const MatchPage = lazy(() => import('@/pages/MatchPage').then(m => ({ default: m.MatchPage })));

function Loading() { return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>; }

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

import { ConsultantDashboard } from '@/components/dashboard/ConsultantDashboard';
import { MandatesPage } from '@/pages/MandatesPage';
import { CandidatesPage } from '@/pages/CandidatesPage';
import { MandateDetailPage } from '@/pages/MandateDetailPage';
import { BatchScoringPage } from '@/pages/BatchScoringPage';
import { NexusPage } from '@/pages/NexusPage';
import { SchedulerPage } from '@/pages/SchedulerPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { MetrixPage } from '@/pages/MetrixPage';
import { ScoringRunsPage } from '@/pages/ScoringRunsPage';
import { LensExportPage } from '@/pages/LensExportPage';

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/b2b" element={<B2BLanding />} />
        <Route path="/b2c" element={<B2CLanding />} />
        <Route path="/nexus" element={<NexusLanding />} />
        <Route path="/match" element={<MatchPage />} />
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
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
