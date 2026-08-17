/**
 * Phase 16 — Full Portal Separation (formerly Phase B).
 *
 * THREE IDENTITIES + ONE INTERNAL ADMIN SURFACE, ONE CODEBASE:
 *
 *   1. <MarketingLayout>        — PUBLIC / MARKETING
 *      Routes: /, /pricing, /nexus/chat, /assessment*, /b2b, /match,
 *              /share/:id, login / signup / reset, legal pages, /dex
 *      No auth required.
 *
 *   2. <LeaderPortalLayout>     — LEADER PORTAL (B2C), route prefix /app/*
 *      For individual executives — NEXUS + assessments + miles + DEX.
 *      Auth required; consultants bounced to /portal/dashboard.
 *
 *   3. <ConsultantPortalLayout> — CONSULTANT PORTAL (B2B), /portal/*
 *      <ClientPortalLayout>     — CLIENT PORTAL (B2B), /client/*
 *      For LYC consultants and B2B client organizations respectively.
 *      ConsultantNav adapts IA per role.
 *
 *   4. <AdminLayout>            — ADMIN (internal), route prefix /admin/*
 *      Only admin/lyc_admin/super_admin roles. Dense data UI.
 *
 *   5. <CandidatePortalLayout>  — CANDIDATE /candidate/*
 *      Specialized candidate workspace (classified as "leader" role but
 *      separate IA from B2C executive portal).
 *
 * Additional constraints honored:
 *   • Single codebase — shared auth store, shared monetization constants.
 *   • Lazy() code-splitting at page level preserves per-portal bundle chunks
 *     (marketing visitors don't download the admin surface).
 *   • All routes keep working — old URLs get `replace` redirects (301-style)
 *     to the new URL structure so Phase 17 SEO/sitemap work is stable.
 *   • No new serverless functions — only route/shell changes on top of
 *     existing page handlers.
 *   • Brand: zero radius, font trio (System serif / DM Sans / IBM Plex
 *     Mono), single accent #C108AB.
 */
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { CreditProvider } from '@/contexts/CreditContext';
import { TierProvider } from '@/components/tier/TierProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CookieConsent } from '@/components/CookieConsent';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';
// Phase 17 / T02 (#1288) — Vercel analytics + performance
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { installGlobalErrorHandlers, reportError } from '@/analytics/errorMonitor';
import {
  useRoutePageViewTracker,
  setTrackingUser,
} from '@/analytics/eventTracker';
// Phase 17 / P1-1 — Per-page SEO / OG / twitter cards. Call once inside <BrowserRouter>.
import { usePageMetadata } from '@/hooks/usePageMetadata';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

// Install window.onerror + unhandledrejection listeners once, at module import
// (idempotent, SSR-safe).
installGlobalErrorHandlers();

// ── Phase 16 — Portal layout wrappers ────────────────────────────────
const MarketingLayout = lazy(() => import('@/components/layouts/MarketingLayout').then(m => ({ default: m.MarketingLayout })));
const LeaderPortalLayout = lazy(() => import('@/components/layouts/LeaderPortalLayout').then(m => ({ default: m.LeaderPortalLayout })));
const ConsultantPortalLayout = lazy(() => import('@/components/layouts/ConsultantPortalLayout').then(m => ({ default: m.ConsultantPortalLayout })));
const ClientPortalLayout = lazy(() => import('@/components/layouts/ConsultantPortalLayout').then(m => ({ default: m.ClientPortalLayout })));
const AdminLayout = lazy(() => import('@/components/layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const CandidatePortalLayout = lazy(() => import('@/components/layouts/CandidatePortalLayout').then(m => ({ default: m.CandidatePortalLayout })));

// ── Landing + Auth ──
const Landing = lazy(() => import('@/pages/Landing').then(m => ({ default: m.Landing })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const SignupPage = lazy(() => import('@/pages/SignupPage').then(m => ({ default: m.SignupPage })));

// ── Public product landing pages (Canonical — consolidated IA) ──
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage').then(m => ({ default: m.AssessmentPage })));
const B2BLanding = lazy(() => import('@/pages/B2BLanding').then(m => ({ default: m.B2BLanding })));
// W4-1/W4-3 (#1295) — NEXUS landing page at /nexus (answers "what is NEXUS?")
const NexusLandingPage = lazy(() => import('@/pages/NexusLandingPage').then(m => ({ default: m.NexusLandingPage })));
const NexusChatPage = lazy(() => import('@/pages/NexusPage').then(m => ({ default: m.NEXUSPage })));
const MatchPage = lazy(() => import('@/pages/MatchPage').then(m => ({ default: m.MatchPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const AssessmentCatalogPage = lazy(() => import('@/pages/AssessmentCatalogPage').then(m => ({ default: m.AssessmentCatalogPage })));

// ── Assessment canonical routes (6 real instruments — PRISM, SPARK, FORGE, BRIDGE, MOSAIC, DRIVE) ──
// Mixed exports in this codebase; use `.default` for named-default pages and
// direct member exports for named ones.
const CanonicalInstrumentLanding = lazy(() => import('@/pages/CanonicalInstrumentLanding').then(m => ({ default: m.CanonicalInstrumentLanding })));
const CpiPage = lazy(() => import('@/pages/CpiPage'));
const CpiResultsPage = lazy(() => import('@/pages/CpiResultsPage').then(m => ({ default: m.CpiResultsPage })));
const CpiTakePage = lazy(() => import('@/pages/CpiTakePage').then(m => ({ default: m.CpiTakePage })));
const ShiftPage = lazy(() => import('@/pages/ShiftPage'));
const CpiFlagshipLanding = lazy(() => import('@/pages/CpiFlagshipLanding').then(m => ({ default: m.CpiFlagshipLanding })));
const PrismLanding = lazy(() => import('@/pages/PrismLanding').then(m => ({ default: m.PrismLanding })));
const PrismResultsPage = lazy(() => import('@/pages/PrismResultsPage').then(m => ({ default: m.PrismResultsPage })));
const SparkLanding = lazy(() => import('@/pages/SparkLanding').then(m => ({ default: m.SparkLanding })));
const LeapLanding = lazy(() => import('@/pages/LeapLanding').then(m => ({ default: m.LeapLanding })));
const ImpactLanding = lazy(() => import('@/pages/ImpactLanding').then(m => ({ default: m.ImpactLanding })));
const SparkResultsPage = lazy(() => import('@/pages/SparkResultsPage').then(m => ({ default: m.SparkResultsPage })));
const SparkTakePage = lazy(() => import('@/pages/SparkTakePage').then(m => ({ default: m.SparkTakePage })));
const LeapResultsPage = lazy(() => import('@/pages/LeapResultsPage').then(m => ({ default: m.LeapResultsPage })));
const LeapTakePage = lazy(() => import('@/pages/LeapTakePage').then(m => ({ default: m.LeapTakePage })));
const QuestResultsPage = lazy(() => import('@/pages/QuestResultsPage').then(m => ({ default: m.QuestResultsPage })));
const ImpactResultsPage = lazy(() => import('@/pages/ImpactResultsPage').then(m => ({ default: m.ImpactResultsPage })));
const ImpactTakePage = lazy(() => import('@/pages/ImpactTakePage').then(m => ({ default: m.ImpactTakePage })));
const ForgeResultsPage = lazy(() => import('@/pages/ForgeResultsPage').then(m => ({ default: m.ForgeResultsPage })));
const DriveResultsPage = lazy(() => import('@/pages/DriveResultsPage').then(m => ({ default: m.DriveResultsPage })));
const CoachResultsPage = lazy(() => import('@/pages/CoachResultsPage').then(m => ({ default: m.CoachResultsPage })));
const BridgeResultsPage = lazy(() => import('@/pages/BridgeResultsPage').then(m => ({ default: m.BridgeResultsPage })));
const MosaicResultsPage = lazy(() => import('@/pages/MosaicResultsPage').then(m => ({ default: m.MosaicResultsPage })));
// X3: Nav 7 take pages
const PrismTakePage = lazy(() => import('@/pages/PrismTakePage').then(m => ({ default: m.PrismTakePage })));
const ForgeTakePage = lazy(() => import('@/pages/ForgeTakePage').then(m => ({ default: m.ForgeTakePage })));
const BridgeTakePage = lazy(() => import('@/pages/BridgeTakePage').then(m => ({ default: m.BridgeTakePage })));
const DriveTakePage = lazy(() => import('@/pages/DriveTakePage').then(m => ({ default: m.DriveTakePage })));
const QuestTakePage = lazy(() => import('@/pages/QuestTakePage').then(m => ({ default: m.QuestTakePage })));
const MosaicTakePage = lazy(() => import('@/pages/MosaicTakePage').then(m => ({ default: m.MosaicTakePage })));
const CoachTakePage = lazy(() => import('@/pages/CoachTakePage').then(m => ({ default: m.CoachTakePage })));

// ── Phase 7: Canonical diagnostic pages (branching-native engine + #1341 data model) ──
const DiagnosticLandingPage = lazy(() => import('@/pages/DiagnosticLandingPage').then(m => ({ default: m.DiagnosticLandingPage })));
const DiagnosticTakePage = lazy(() => import('@/pages/DiagnosticTakePage').then(m => ({ default: m.DiagnosticTakePage })));
const DiagnosticResultsPage = lazy(() => import('@/pages/DiagnosticResultsPage').then(m => ({ default: m.DiagnosticResultsPage })));

// ── Authenticated user pages — shared across leader / (in future) candidate ──
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProgressPage = lazy(() => import('@/pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const DocumentsPage = lazy(() => import('@/pages/UserDocumentsPage').then(m => ({ default: m.DocumentsPage })));
const SharePage = lazy(() => import('@/pages/SharePage').then(m => ({ default: m.SharePage })));
const ConsultantDashboard = lazy(() => import('@/components/dashboard/ConsultantDashboard').then(m => ({ default: m.ConsultantDashboard })));

// ── DEX AI B2C Portal pages (EO-5 / SPRINT 2) ──
const DexLandingPage = lazy(() => import('@/pages/dex/DexLandingPage').then(m => ({ default: m.DexLandingPage })));
const DexChatPage = lazy(() => import('@/pages/dex/DexChatPage').then(m => ({ default: m.DexChatPage })));
const DexAssessPage = lazy(() => import('@/pages/dex/DexAssessPage').then(m => ({ default: m.DexAssessPage })));
const DexPlanPage = lazy(() => import('@/pages/dex/DexPlanPage').then(m => ({ default: m.DexPlanPage })));
const DexBookPage = lazy(() => import('@/pages/dex/DexBookPage').then(m => ({ default: m.DexBookPage })));
const DexJourneyPage = lazy(() => import('@/pages/dex/DexJourneyPage').then(m => ({ default: m.DexJourneyPage })));
const CreditStorePage = lazy(() => import('@/pages/dex/CreditStorePage').then(m => ({ default: m.CreditStorePage })));

// ── Consultant platform pages (real implementations, now under /portal/*) ──
const PipelinePage = lazy(() => import('@/pages/PipelinePage').then(m => ({ default: m.PipelinePage })));
const MandatesPage = lazy(() => import('@/pages/MandatesPage').then(m => ({ default: m.MandatesPage })));
const MandateDetailPage = lazy(() => import('@/pages/MandateDetailPage').then(m => ({ default: m.MandateDetailPage })));
const SchedulerPage = lazy(() => import('@/pages/SchedulerPage').then(m => ({ default: m.SchedulerPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const CandidatesPage = lazy(() => import('@/pages/CandidatesPage').then(m => ({ default: m.CandidatesPage })));
const ExecutiveProfilePage = lazy(() => import('@/pages/ExecutiveProfilePage').then(m => ({ default: m.ExecutiveProfilePage })));
const CandidateReportPage = lazy(() => import('@/pages/CandidateReportPage').then(m => ({ default: m.CandidateReportPage })));
const ConsultantSummaryPage = lazy(() => import('@/pages/ConsultantSummaryPage').then(m => ({ default: m.ConsultantSummaryPage })));
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage').then(m => ({ default: m.CompaniesPage })));
const BatchScoringPage = lazy(() => import('@/pages/BatchScoringPage').then(m => ({ default: m.BatchScoringPage })));
const MetrixPage = lazy(() => import('@/pages/MetrixPage').then(m => ({ default: m.MetrixPage })));
const ScoringRunsPage = lazy(() => import('@/pages/ScoringRunsPage').then(m => ({ default: m.ScoringRunsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ProposalBuilderPage = lazy(() => import('@/pages/ProposalBuilderPage').then(m => ({ default: m.ProposalBuilderPage })));
const LensExportPage = lazy(() => import('@/pages/LensExportPage').then(m => ({ default: m.LensExportPage })));

// ── Admin-only pages (now under /admin/*) ──
// These all use default export, so import directly.
const AdvancedOpsPage = lazy(() => import('@/pages/internal/AdvancedOpsPage'));
const SchedulingPlusPage = lazy(() => import('@/pages/internal/SchedulingPlusPage'));
const IntelligencePlusPage = lazy(() => import('@/pages/internal/IntelligencePlusPage'));
const PlatformSettingsPage = lazy(() => import('@/pages/internal/PlatformSettingsPage'));
const TeamPage = lazy(() => import('@/pages/internal/TeamPage'));
const TasksPage = lazy(() => import('@/pages/internal/TasksPage'));
const AnalyticsPage = lazy(() => import('@/pages/internal/AnalyticsPage'));
const ConsultantPerformancePage = lazy(() => import('@/pages/internal/ConsultantPerformancePage').then(m => ({ default: m.ConsultantPerformancePage })));
const CompliancePage = lazy(() => import('@/pages/internal/CompliancePage'));
const NexusEnginePage = lazy(() => import('@/pages/internal/NexusEnginePage'));
const AdminRankingDashboard = lazy(() => import('@/pages/internal/AdminRankingDashboard').then(m => ({ default: m.AdminRankingDashboard })));
const ScoringConfigPage = lazy(() => import('@/pages/internal/ScoringConfigPage').then(m => ({ default: m.ScoringConfigPage })));
const KevinOversightDashboard = lazy(() => import('@/components/kevin/KevinOversightDashboard').then(m => ({ default: m.KevinOversightDashboard })));
const RevenueAnalyticsPage = lazy(() => import('@/components/internal/RevenueAnalytics').then(m => ({ default: m.default })));
const OrgIntelligencePage = lazy(() => import('@/pages/OrgIntelligencePage').then(m => ({ default: m.OrgIntelligencePage })));

// ── Phase 9 Batch 5 · B2C Assessment Admin pages (#84 / #1346) ──
const AdminResultsPage = lazy(() => import('@/pages/admin/AdminResultsPage'));
const AdminResultDetailPage = lazy(() => import('@/pages/admin/AdminResultDetailPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminAiOpsPage = lazy(() => import('@/pages/admin/AdminAiOpsPage'));
const AdminEmailOpsPage = lazy(() => import('@/pages/admin/AdminEmailOpsPage'));

// ── Candidate Portal pages (EO-4) ──
const CandidateDashboardPage = lazy(() => import('@/pages/candidate/CandidateDashboardPage').then(m => ({ default: m.CandidateDashboardPage })));
const CandidateApplicationsPage = lazy(() => import('@/pages/candidate/CandidateApplicationsPage').then(m => ({ default: m.CandidateApplicationsPage })));
const CandidateAssessmentsPage = lazy(() => import('@/pages/candidate/CandidateAssessmentsPage').then(m => ({ default: m.CandidateAssessmentsPage })));
const CandidateCommunityPage = lazy(() => import('@/pages/candidate/CandidateCommunityPage').then(m => ({ default: m.CandidateCommunityPage })));
const CandidateInterviewPrepPage = lazy(() => import('@/pages/candidate/CandidateInterviewPrepPage').then(m => ({ default: m.CandidateInterviewPrepPage })));
const CandidateOpportunitiesPage = lazy(() => import('@/pages/candidate/CandidateOpportunitiesPage').then(m => ({ default: m.CandidateOpportunitiesPage })));

// ── B2B Client Portal pages (EO-1 / SPRINT 3) — now under /client/* ──
const ClientOverviewPage = lazy(() => import('@/pages/client/ClientOverviewPage').then(m => ({ default: m.ClientOverviewPage })));
const ClientMandatesPage = lazy(() => import('@/pages/client/ClientMandatesPage').then(m => ({ default: m.ClientMandatesPage })));
const ClientDocumentsPage = lazy(() => import('@/pages/client/ClientDocumentsPage').then(m => ({ default: m.ClientDocumentsPage })));
const ClientPipelineAnalyticsPage = lazy(() => import('@/pages/client/ClientPipelineAnalyticsPage').then(m => ({ default: m.ClientPipelineAnalyticsPage })));

// ── Legal pages (S4-T03) ──
const TermsPage = lazy(() => import('@/pages/LegalPages').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/LegalPages').then(m => ({ default: m.PrivacyPage })));
const CookiesPage = lazy(() => import('@/pages/LegalPages').then(m => ({ default: m.CookiesPage })));

// ── Billing dashboard (S6-T05) — leader portal /app/billing ──
const BillingDashboard = lazy(() => import('@/components/billing/BillingDashboard').then(m => ({ default: m.BillingDashboard })));

// ── Placeholder + not found ──
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function DiagnosticsRedirect() {
  const { pathname, search, hash } = useLocation();
  const sub = pathname.replace(/^\/diagnostics/, '');
  return <Navigate to={'/assessment' + (sub || '') + search + hash} replace />;
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-fuchsia" />
    </div>
  );
}

export default function App() {
  const { initialize, profile, user } = useAuthStore();
  useEffect(() => { initialize(); }, [initialize]);

  // Keep tracking user context in sync with auth state.
  useEffect(() => {
    setTrackingUser({ id: user?.id ?? null, role: profile?.role ?? null });
  }, [user?.id, profile?.role]);

  // Auto-track route changes (page_view events + landing funnel step 0).
  // Must be called inside <Routes>'s Router context (main.tsx mounts BrowserRouter).
  useRoutePageViewTracker();

  // Phase 17 / P1-1 — drive <title>, meta description, OG/twitter cards,
  // canonical, and robots from per-route registry (30+ rules for marketing
  // routes, 6 assessments, and noindex for all 5 portals).
  usePageMetadata();

  // Phase 3 / #1311 — idle + absolute session timeout. Mounts activity
  // listeners, periodic check, and tab-visibility validation.
  useSessionTimeout();

  // Any uncaught error thrown in the app root report block:
  // errors from page renders are caught by ErrorBoundary above; global ones
  // are caught by window.onerror/unhandledrejection (installed at import).
  void reportError;

  return (
    <ErrorBoundary>
    <TierProvider>
    <CreditProvider>
      <ToastContainer />
      <CookieConsent />
      <OnboardingWizard />
      <Analytics />
      <SpeedInsights />
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* ═══════════════════════════════════════════════════════════
              PHASE 16 · MARKETING LAYOUT — no auth, premium marketing chrome
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/" element={<MarketingLayout />}>
            <Route index element={<Landing />} />

            {/* Auth entry points (public, sit under marketing chrome) */}
            <Route path="login" element={<LoginPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="signup" element={<SignupPage />} />

            {/* Public product pages */}
            {/* W4-1/W4-3 (#1295) — /nexus renders the NEXUS landing page (what is NEXUS?) */}
            <Route path="nexus" element={<NexusLandingPage />} />
            <Route path="nexus/chat" element={<NexusChatPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="b2b" element={<B2BLanding />} />
            <Route path="match" element={<MatchPage />} />

            {/* DEX B2C public landing. DEX /app/dex/* routes are auth'd. */}
            <Route path="dex" element={<DexLandingPage />} />

            {/* Assessment catalog — #1363 canonical URL is /assessments (plural, user-centric).
                /assessment and /diagnostics kept as redirects so no link or bookmark 404s. */}
            <Route path="assessments" element={<AssessmentCatalogPage />} />
            <Route path="assessment" element={<Navigate to="/assessments" replace />} />

            {/* ── Canonical singular assessment landing routes (V3-2) ── */}
            <Route path="assessment/prism" element={<PrismLanding />} />
            <Route path="assessment/prism/take" element={<PrismTakePage />} />
            <Route path="assessment/spark" element={<SparkLanding />} />
            <Route path="assessment/spark/take" element={<SparkTakePage />} />
            <Route path="assessment/spark/results/:id" element={<SparkResultsPage />} />
            {/* Explicit redirects for instruments that have no landing data */}
            <Route path="assessment/cpi" element={<CpiFlagshipLanding />} />
            <Route path="assessment/cpi/take" element={<CpiTakePage />} />
            <Route path="assessment/shift" element={<Navigate to="/assessments" replace />} />
            <Route path="assessment/leap" element={<LeapLanding />} />
            <Route path="assessment/leap/take" element={<LeapTakePage />} />
            <Route path="assessment/leap/results/:id" element={<LeapResultsPage />} />
            <Route path="assessment/quest" element={<Navigate to="/assessments" replace />} />
            <Route path="assessment/quest/take" element={<QuestTakePage />} />
            <Route path="assessment/impact" element={<ImpactLanding />} />
            <Route path="assessment/impact/take" element={<ImpactTakePage />} />
            <Route path="assessment/impact/results/:id" element={<ImpactResultsPage />} />
            <Route path="assessment/coach" element={<Navigate to="/assessments" replace />} />
            <Route path="assessment/coach/take" element={<CoachTakePage />} />
            {/* X3: Nav 7 explicit take routes — must come before :code catch-all */}
            <Route path="assessment/forge/take" element={<ForgeTakePage />} />
            <Route path="assessment/bridge/take" element={<BridgeTakePage />} />
            <Route path="assessment/drive/take" element={<DriveTakePage />} />
            <Route path="assessment/mosaic/take" element={<MosaicTakePage />} />
            {/* Generic canonical landing for 4 remaining instruments: FORGE, BRIDGE, MOSAIC, DRIVE */}
            <Route path="assessment/:code" element={<CanonicalInstrumentLanding />} />

            {/* Results routes — post-assessment (shareable / bookmarkable) */}
            {/* Keep all results routes — bookmarks from prior sessions must not break. */}
            <Route path="assessment/cpi/results" element={<CpiResultsPage />} />
            <Route path="assessment/prism/results" element={<PrismResultsPage />} />
            <Route path="assessment/spark/results" element={<SparkResultsPage />} />
            <Route path="assessment/leap/results" element={<LeapResultsPage />} />
            <Route path="assessment/quest/results" element={<QuestResultsPage />} />
            <Route path="assessment/impact/results" element={<ImpactResultsPage />} />
            <Route path="assessment/forge/results" element={<ForgeResultsPage />} />
            <Route path="assessment/drive/results" element={<DriveResultsPage />} />
            <Route path="assessment/coach/results" element={<CoachResultsPage />} />
            <Route path="assessment/bridge/results" element={<BridgeResultsPage />} />
            <Route path="assessment/mosaic/results" element={<MosaicResultsPage />} />

            {/* ── Diagnostics → canonical /assessment/* (V3-2 + V3-8 SPA fallback) ── */}
            <Route path="diagnostics/*" element={<DiagnosticsRedirect />} />

            {/* Share pages — publicly accessible shortlinks */}
            <Route path="share/:id" element={<SharePage />} />

            {/* Legal (S4-T03) */}
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="cookies" element={<CookiesPage />} />
          </Route>

          {/* ═══════════════════════════════════════════════════════════
              PHASE 16 · LEADER PORTAL — /app/* (B2C executives)
              Auth required. Role-guarded in LeaderPortalLayout
              (consultants auto-bounced to /portal/dashboard).
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/app" element={<LeaderPortalLayout />}>
            <Route index element={<Navigate to="nexus" replace />} />
            <Route path="nexus" element={<NexusChatPage />} />
            <Route path="chat" element={<Navigate to="nexus" replace />} />

            {/* Exec user workspace */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="results" element={<ProgressPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="documents" element={<DocumentsPage />} />

            {/* Assessment flow deep-links (auth'd access to take/purchase) */}
            <Route path="assessments" element={<AssessmentPage />} />
            <Route path="assessment/:code" element={<CanonicalInstrumentLanding />} />

            {/* Billing + subscription self-serve */}
            <Route path="billing" element={<BillingDashboard />} />
            <Route path="subscription" element={<Navigate to="billing" replace />} />

            {/* DEX B2C — SPRINT 2 authenticated routes */}
            <Route path="dex/chat" element={<DexChatPage />} />
            <Route path="dex/assess" element={<DexAssessPage />} />
            <Route path="dex/plan" element={<DexPlanPage />} />
            <Route path="dex/book" element={<DexBookPage />} />
            <Route path="dex/journey" element={<DexJourneyPage />} />
            <Route path="dex/store" element={<CreditStorePage />} />
            <Route path="dex/credits" element={<Navigate to="dex/store" replace />} />
          </Route>

          {/* ═══════════════════════════════════════════════════════════
              PHASE 16 · CONSULTANT PORTAL — /portal/* (LYC consultants)
              ConsultantPortalLayout enforces consultant+ role gating.
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/portal" element={<ConsultantPortalLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ConsultantDashboard />} />

            {/* Mandates + GRID pipeline */}
            <Route path="mandates" element={<MandatesPage />} />
            <Route path="mandates/new" element={<ProposalBuilderPage />} />
            <Route path="mandates/:id/edit" element={<ProposalBuilderPage />} />
            <Route path="mandates/:id" element={<MandateDetailPage />} />
            <Route path="mandates/:id/lens" element={<LensExportPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="grid" element={<Navigate to="pipeline" replace />} />

            {/* TRIDENT candidates + CANVAS + METRIX */}
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="candidates/:id" element={<ExecutiveProfilePage />} />
            <Route path="candidates/:id/report" element={<CandidateReportPage />} />
            <Route path="candidates/:id/summary" element={<ConsultantSummaryPage />} />
            <Route path="trident" element={<Navigate to="candidates" replace />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="canvas" element={<Navigate to="metrix" replace />} />
            <Route path="metrix" element={<MetrixPage />} />

            {/* NEXUS chat (context-aware consultant system prompt handled inside page) */}
            <Route path="nexus" element={<NexusChatPage />} />

            {/* Intelligence suite — scoring + runs + org intel */}
            <Route path="intelligence" element={<AnalyticsPage />} />
            <Route path="batch-scoring" element={<BatchScoringPage />} />
            <Route path="scoring-runs" element={<ScoringRunsPage />} />
            <Route path="reports" element={<Navigate to="/app/results" replace />} />

            {/* Ops + scheduling */}
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Account-level surface for consultants */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* SHIFT assessment deep-link (consultant can launch from portal) */}
            <Route path="shift" element={<Navigate to="/assessment/shift" replace />} />
          </Route>

          {/* ═══════════════════════════════════════════════════════════
              PHASE 16 · CLIENT PORTAL — /client/* (B2B org users)
              ClientPortalLayout enforces client role gating and shows
              the client-subset of ConsultantNav.
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/client" element={<ClientPortalLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<ClientOverviewPage />} />
            <Route path="mandates" element={<ClientMandatesPage />} />
            <Route path="pipeline-analytics" element={<ClientPipelineAnalyticsPage />} />
            <Route path="documents" element={<ClientDocumentsPage />} />
            {/* NEXUS client assistant */}
            <Route path="nexus-assistant" element={<NexusChatPage />} />

            {/* Backward-compat placeholder routes */}
            <Route path="talent-intel" element={<Navigate to="overview" replace />} />
            <Route path="candidates" element={<Navigate to="mandates" replace />} />
            <Route path="admin" element={<Navigate to="overview" replace />} />
            <Route path="collaboration" element={<Navigate to="overview" replace />} />
            <Route path="onboarding" element={<Navigate to="overview" replace />} />
          </Route>

          {/* ═══════════════════════════════════════════════════════════
              PHASE 16 · ADMIN — /admin/* (internal LYC ops staff only)
              AdminLayout enforces admin/lyc_admin/super_admin role gating.
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="results" replace />} />
            <Route path="dashboard" element={<KevinOversightDashboard />} />

            {/* Phase 9 B2C Assessment Admin (#84 / #1346) */}
            <Route path="results" element={<AdminResultsPage />} />
            <Route path="results/:id" element={<AdminResultDetailPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="ai-ops" element={<AdminAiOpsPage />} />
            <Route path="email-ops" element={<AdminEmailOpsPage />} />

            {/* Users + team + tasks */}
            <Route path="team" element={<TeamPage />} />
            <Route path="consultants" element={<ConsultantPerformancePage />} />
            <Route path="tasks" element={<TasksPage />} />

            {/* Analytics + revenue */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="revenue" element={<RevenueAnalyticsPage />} />
            <Route path="oversight" element={<KevinOversightDashboard />} />

            {/* Scoring + ranking config */}
            <Route path="rankings" element={<AdminRankingDashboard />} />
            <Route path="scoring" element={<ScoringConfigPage />} />
            <Route path="org-intel" element={<OrgIntelligencePage />} />
            <Route path="nexus-engine" element={<NexusEnginePage />} />

            {/* Ops + compliance */}
            <Route path="advanced-ops" element={<AdvancedOpsPage />} />
            <Route path="scheduling-plus" element={<SchedulingPlusPage />} />
            <Route path="intelligence-plus" element={<IntelligencePlusPage />} />
            <Route path="compliance" element={<CompliancePage />} />

            {/* Platform-wide configuration */}
            <Route path="platform-settings" element={<PlatformSettingsPage />} />
            <Route path="settings" element={<PlatformSettingsPage />} />
          </Route>

          {/* ═══════════════════════════════════════════════════════════
              CANDIDATE PORTAL — /candidate/* (EO-4, Phase 16: keep IA)
              Reuses leader-style sidebar for visual consistency.
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/candidate" element={<CandidatePortalLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<CandidateDashboardPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="opportunities" element={<CandidateOpportunitiesPage />} />
            <Route path="interview-prep" element={<CandidateInterviewPrepPage />} />
            <Route path="assessments" element={<CandidateAssessmentsPage />} />
            <Route path="community" element={<CandidateCommunityPage />} />
            {/* Placeholder-only sub-routes → redirect (Phase 15.3 C1) */}
            <Route path="offers" element={<Navigate to="opportunities" replace />} />
            <Route path="career-dev" element={<Navigate to="assessments" replace />} />
            <Route path="nexus-coach" element={<Navigate to="/nexus/chat" replace />} />
            <Route path="profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="advanced-assessments" element={<Navigate to="assessments" replace />} />
            <Route path="settings-plus" element={<Navigate to="/app/dashboard" replace />} />
          </Route>

          {/* ═══════════════════════════════════════════════════════════
              PHASE 16 · ROUTE 301 REDIRECTS — old flat URLs → new URLs
              ═══════════════════════════════════════════════════════════ */}

          {/* Legacy /nexus shortcuts → canonical marketing or /app/nexus.
              NOTE: /nexus itself now renders <NexusLandingPage> inside the
              MarketingLayout block above (W4-1/W4-3). Only the legacy
              /nexus-landing alias + /b2c shortcut redirect here. */}
          <Route path="/nexus-landing" element={<Navigate to="/nexus" replace />} />
          <Route path="/b2c" element={<Navigate to="/app/nexus" replace />} />

          {/* Legacy instrument root URLs → canonical /assessment/:code */}
          <Route path="/cpi" element={<Navigate to="/assessment/cpi" replace />} />
          <Route path="/cpi/results" element={<Navigate to="/assessment/cpi/results" replace />} />
          <Route path="/shift" element={<Navigate to="/assessment/shift" replace />} />
          <Route path="/prism" element={<Navigate to="/assessment/prism" replace />} />
          <Route path="/prism/results" element={<Navigate to="/assessment/prism/results" replace />} />
          <Route path="/spark" element={<Navigate to="/assessment/spark" replace />} />
          <Route path="/spark/results" element={<Navigate to="/assessment/spark/results" replace />} />
          <Route path="/leap" element={<Navigate to="/assessment/leap" replace />} />
          <Route path="/leap/results" element={<Navigate to="/assessment/leap/results" replace />} />
          <Route path="/quest" element={<Navigate to="/assessment/quest" replace />} />
          <Route path="/quest/results" element={<Navigate to="/assessment/quest/results" replace />} />
          <Route path="/impact" element={<Navigate to="/assessment/impact" replace />} />
          <Route path="/impact/results" element={<Navigate to="/assessment/impact/results" replace />} />
          <Route path="/forge" element={<Navigate to="/assessment/forge" replace />} />
          <Route path="/forge/results" element={<Navigate to="/assessment/forge/results" replace />} />
          <Route path="/drive" element={<Navigate to="/assessment/drive" replace />} />
          <Route path="/drive/results" element={<Navigate to="/assessment/drive/results" replace />} />
          <Route path="/coach" element={<Navigate to="/assessment/coach" replace />} />
          <Route path="/coach/results" element={<Navigate to="/assessment/coach/results" replace />} />
          <Route path="/bridge" element={<Navigate to="/assessment/bridge" replace />} />
          <Route path="/bridge/results" element={<Navigate to="/assessment/bridge/results" replace />} />
          <Route path="/mosaic" element={<Navigate to="/assessment/mosaic" replace />} />
          <Route path="/mosaic/results" element={<Navigate to="/assessment/mosaic/results" replace />} />

          {/* Old legacy DEX auth URLs → /app/dex/* */}
          <Route path="/dex/chat" element={<Navigate to="/app/dex/chat" replace />} />
          <Route path="/dex/assess" element={<Navigate to="/app/dex/assess" replace />} />
          <Route path="/dex/plan" element={<Navigate to="/app/dex/plan" replace />} />
          <Route path="/dex/book" element={<Navigate to="/app/dex/book" replace />} />
          <Route path="/dex/journey" element={<Navigate to="/app/dex/journey" replace />} />
          <Route path="/dex/credits" element={<Navigate to="/app/dex/store" replace />} />

          {/* Old /coaching/* (previous B2C shell) → /app/* */}
          <Route path="/coaching" element={<Navigate to="/app/nexus" replace />} />
          <Route path="/coaching/nexus-chat" element={<Navigate to="/app/nexus" replace />} />
          <Route path="/coaching/assessments" element={<Navigate to="/app/assessments" replace />} />
          <Route path="/coaching/results" element={<Navigate to="/app/results" replace />} />
          <Route path="/coaching/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/coaching/coach" element={<Navigate to="/app/nexus" replace />} />
          <Route path="/coaching/credits" element={<Navigate to="/app/billing" replace />} />
          <Route path="/coaching/intelligence" element={<Navigate to="/app/results" replace />} />
          <Route path="/coaching/career-intel" element={<Navigate to="/app/results" replace />} />
          <Route path="/coaching/chat-features" element={<Navigate to="/app/nexus" replace />} />
          <Route path="/coaching/career-services" element={<Navigate to="/app/assessments" replace />} />
          <Route path="/coaching/engagement" element={<Navigate to="/app/results" replace />} />
          <Route path="/coaching/growth" element={<Navigate to="/app/profile" replace />} />

          {/* Old standalone auth-only flat routes → /app/* counterparts */}
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/progress" element={<Navigate to="/app/results" replace />} />
          <Route path="/documents" element={<Navigate to="/app/documents" replace />} />
          <Route path="/account/billing" element={<Navigate to="/app/billing" replace />} />

          {/* Backward compat: redirect old /platform/* → /portal/* */}
          <Route path="/platform" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/platform/*" element={<Navigate to="/portal/dashboard" replace />} />

          {/* Old /app/* (previous consultant shell) → /portal/*
             (except /app/[nexus|dashboard|results|profile|documents|assessments|billing|dex/*]
             which are now B2C leader routes — already matched earlier since this
             section is a wildcard fallback.) */}
          <Route path="/app/pipeline" element={<Navigate to="/portal/pipeline" replace />} />
          <Route path="/app/mandates" element={<Navigate to="/portal/mandates" replace />} />
          <Route path="/app/mandates/new" element={<Navigate to="/portal/mandates/new" replace />} />
          <Route path="/app/mandates/:id/edit" element={<Navigate to="/portal/mandates/:id/edit" replace />} />
          <Route path="/app/mandates/:id" element={<Navigate to="/portal/mandates/:id" replace />} />
          <Route path="/app/mandates/:id/lens" element={<Navigate to="/portal/mandates/:id/lens" replace />} />
          <Route path="/app/candidates" element={<Navigate to="/portal/candidates" replace />} />
          <Route path="/app/candidates/:id" element={<Navigate to="/portal/candidates/:id" replace />} />
          <Route path="/app/candidates/:id/report" element={<Navigate to="/portal/candidates/:id/report" replace />} />
          <Route path="/app/companies" element={<Navigate to="/portal/companies" replace />} />
          <Route path="/app/batch-scoring" element={<Navigate to="/portal/batch-scoring" replace />} />
          <Route path="/app/metrix" element={<Navigate to="/portal/metrix" replace />} />
          <Route path="/app/scoring-runs" element={<Navigate to="/portal/scoring-runs" replace />} />
          <Route path="/app/scheduler" element={<Navigate to="/portal/scheduler" replace />} />
          <Route path="/app/notifications" element={<Navigate to="/portal/notifications" replace />} />
          <Route path="/app/settings" element={<Navigate to="/portal/settings" replace />} />
          <Route path="/app/advanced-ops" element={<Navigate to="/admin/advanced-ops" replace />} />
          <Route path="/app/scheduling-plus" element={<Navigate to="/admin/scheduling-plus" replace />} />
          <Route path="/app/intelligence-plus" element={<Navigate to="/admin/intelligence-plus" replace />} />
          <Route path="/app/platform-settings" element={<Navigate to="/admin/platform-settings" replace />} />
          <Route path="/app/team" element={<Navigate to="/admin/team" replace />} />
          <Route path="/app/tasks" element={<Navigate to="/admin/tasks" replace />} />
          <Route path="/app/analytics" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/app/consultants" element={<Navigate to="/admin/consultants" replace />} />
          <Route path="/app/compliance" element={<Navigate to="/admin/compliance" replace />} />
          <Route path="/app/nexus-engine" element={<Navigate to="/admin/nexus-engine" replace />} />
          <Route path="/app/rankings" element={<Navigate to="/admin/rankings" replace />} />
          <Route path="/app/scoring" element={<Navigate to="/admin/scoring" replace />} />
          <Route path="/app/oversight" element={<Navigate to="/admin/oversight" replace />} />
          <Route path="/app/revenue" element={<Navigate to="/admin/revenue" replace />} />
          <Route path="/app/org-intel" element={<Navigate to="/admin/org-intel" replace />} />
          <Route path="/app/trident" element={<Navigate to="/match" replace />} />
          <Route path="/app/canvas" element={<Navigate to="/portal/metrix" replace />} />
          <Route path="/app/shift" element={<Navigate to="/assessment/shift" replace />} />
          <Route path="/app/reports" element={<Navigate to="/app/results" replace />} />
          <Route path="/app/intelligence" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/app/chat" element={<Navigate to="/app/nexus" replace />} />

          {/* Catchall 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </CreditProvider>
    </TierProvider>
    </ErrorBoundary>
  );
}
