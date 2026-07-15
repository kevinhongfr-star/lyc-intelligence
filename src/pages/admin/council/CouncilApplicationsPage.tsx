/**
 * CouncilApplicationsPage — Admin review of Council membership applications.
 * Review applicant details, approve / reject / waitlist, and assign tier on approval.
 * Self-contained with mock data; wire to /api/admin/council/applications for persistence.
 */
import React, { useMemo, useState } from 'react';
import {
  Check,
  X,
  Eye,
  Clock,
  FileText,
  Mail,
  Loader2,
  AlertTriangle,
  UserCircle,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type TierId = 'founding' | 'individual' | 'corporate' | 'pe-partner';
type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';

interface Application {
  id: string;
  applicantName: string;
  email: string;
  desiredTier: TierId;
  appliedAt: string; // ISO
  status: ApplicationStatus;
  assignedTier: TierId | null;
  role: string;
  company: string;
  resumeUrl: string;
  bio: string;
  answers: { question: string; answer: string }[];
}

/* ------------------------------------------------------------------ */
/* Label / meta maps                                                   */
/* ------------------------------------------------------------------ */

const TIER_LABEL: Record<TierId, string> = {
  founding: 'Founding',
  individual: 'Individual',
  corporate: 'Corporate',
  'pe-partner': 'PE Partner',
};

const TIER_OPTIONS: TierId[] = ['founding', 'individual', 'corporate', 'pe-partner'];

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'fuchsia' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  waitlisted: { label: 'Waitlisted', variant: 'default' },
};

function tierBadgeVariant(tier: TierId): 'fuchsia' | 'default' | 'success' | 'warning' {
  switch (tier) {
    case 'founding':
      return 'fuchsia';
    case 'pe-partner':
      return 'warning';
    case 'corporate':
      return 'success';
    default:
      return 'default';
  }
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app_001',
    applicantName: 'Priya Nair',
    email: 'priya@summitpe.com',
    desiredTier: 'pe-partner',
    appliedAt: '2026-07-15T09:24:00Z',
    status: 'pending',
    assignedTier: null,
    role: 'Partner',
    company: 'Summit Partners',
    resumeUrl: 'https://cdn.lyc.io/resumes/priya-nair.pdf',
    bio: 'Growth equity investor focused on enterprise SaaS. 12 years investing across Series B–D. Previously held operating roles at two unicorns.',
    answers: [
      {
        question: 'Why do you want to join The Council?',
        answer: 'Looking for a peer network of operating leaders and deal-flow access beyond my current circle.',
      },
      {
        question: 'What is your biggest career inflection right now?',
        answer: 'Considering a move from investing to an operating role as Chief Strategy Officer.',
      },
    ],
  },
  {
    id: 'app_002',
    applicantName: 'Marcus Wei',
    email: 'm.wei@brightwave.io',
    desiredTier: 'individual',
    appliedAt: '2026-07-15T07:11:00Z',
    status: 'pending',
    assignedTier: null,
    role: 'CFO',
    company: 'Brightwave',
    resumeUrl: 'https://cdn.lyc.io/resumes/marcus-wei.pdf',
    bio: 'CFO at a Series D climate-tech startup. Led three funding rounds totalling $180M. Ex-investment banker.',
    answers: [
      {
        question: 'Why do you want to join The Council?',
        answer: 'Compensation benchmarking and coaching as I evaluate a move into a public-company CFO role.',
      },
      {
        question: 'What is your biggest career inflection right now?',
        answer: 'Preparing for IPO readiness and board seat selection.',
      },
    ],
  },
  {
    id: 'app_003',
    applicantName: 'Elena Rodriguez',
    email: 'elena.r@horizoncap.com',
    desiredTier: 'corporate',
    appliedAt: '2026-07-14T18:42:00Z',
    status: 'pending',
    assignedTier: null,
    role: 'VP Strategy',
    company: 'Horizon Capital',
    resumeUrl: 'https://cdn.lyc.io/resumes/elena-rodriguez.pdf',
    bio: 'VP of Strategy at a Fortune 500 manufacturer. Leads M&A and corporate development for the APAC region.',
    answers: [
      {
        question: 'Why do you want to join The Council?',
        answer: 'Team intelligence reports and upskilling for our 5-person leadership cohort.',
      },
      {
        question: 'How many seats do you need?',
        answer: '5 — full leadership team.',
      },
    ],
  },
  {
    id: 'app_004',
    applicantName: 'Tomas Berg',
    email: 'tomas.b@northstar.co',
    desiredTier: 'founding',
    appliedAt: '2026-07-14T15:05:00Z',
    status: 'approved',
    assignedTier: 'founding',
    role: 'Founder & CEO',
    company: 'Northstar',
    resumeUrl: 'https://cdn.lyc.io/resumes/tomas-berg.pdf',
    bio: 'Founder of a profitable AI infrastructure company. 8 years scaling from 0 to $40M ARR.',
    answers: [
      {
        question: 'Why do you want to join The Council?',
        answer: 'Want the founding rate and a long-term peer network as I scale toward $100M ARR.',
      },
      {
        question: 'What is your biggest career inflection right now?',
        answer: 'Building out an executive team and stepping back from day-to-day operations.',
      },
    ],
  },
  {
    id: 'app_005',
    applicantName: 'Aisha Khan',
    email: 'aisha.k@vertexventures.com',
    desiredTier: 'individual',
    appliedAt: '2026-07-13T11:38:00Z',
    status: 'waitlisted',
    assignedTier: null,
    role: 'Director of Product',
    company: 'Vertex Ventures',
    resumeUrl: 'https://cdn.lyc.io/resumes/aisha-khan.pdf',
    bio: 'Product leader transitioning from IC to VP. Currently leading a 20-person product org.',
    answers: [
      {
        question: 'Why do you want to join The Council?',
        answer: 'Coaching for the step up to VP Product, and peer product leaders to learn from.',
      },
    ],
  },
  {
    id: 'app_006',
    applicantName: 'Daniel Cho',
    email: 'd.cho@meridian.io',
    desiredTier: 'corporate',
    appliedAt: '2026-07-12T08:20:00Z',
    status: 'rejected',
    assignedTier: null,
    role: 'Senior Manager',
    company: 'Meridian',
    resumeUrl: 'https://cdn.lyc.io/resumes/daniel-cho.pdf',
    bio: 'Senior Manager at a mid-cap consulting firm. Looking for executive-level access.',
    answers: [
      {
        question: 'Why do you want to join The Council?',
        answer: 'Networking with C-suite to source new consulting engagements.',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatAppliedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/* Detail modal (with approve + tier assignment)                       */
/* ------------------------------------------------------------------ */

function ApplicationDetailModal({
  isOpen,
  application,
  onClose,
  onApprove,
  onReject,
  onWaitlist,
  processing,
}: {
  isOpen: boolean;
  application: Application | null;
  onClose: () => void;
  onApprove: (tier: TierId) => void;
  onReject: () => void;
  onWaitlist: () => void;
  processing: boolean;
}) {
  const [selectedTier, setSelectedTier] = useState<TierId | null>(null);

  React.useEffect(() => {
    // Reset tier selection whenever a new application is opened.
    setSelectedTier(application ? application.desiredTier : null);
  }, [application]);

  if (!isOpen || !application) return null;

  const isPending = application.status === 'pending';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-detail-title"
      >
        {/* Header */}
        <div className="border-b border-[#E5E5E5] px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center bg-[rgba(193,8,171,0.08)]">
                <UserCircle className="h-6 w-6 text-[#C108AB]" />
              </div>
              <div>
                <h3 id="app-detail-title" className="text-base font-semibold text-[#1C1C1C]">
                  {application.applicantName}
                </h3>
                <p className="mt-0.5 text-sm text-[#737373]">
                  {application.role} · {application.company}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-[#737373] hover:text-[#1C1C1C]" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_META[application.status].variant}>
              {STATUS_META[application.status].label}
            </Badge>
            <Badge variant={tierBadgeVariant(application.desiredTier)}>
              Desired: {TIER_LABEL[application.desiredTier]}
            </Badge>
            {application.assignedTier && (
              <Badge variant="success">Assigned: {TIER_LABEL[application.assignedTier]}</Badge>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="space-y-6 px-6 py-5">
          {/* Contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A3A3A3]" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">Email</p>
                <p className="truncate text-sm text-[#1C1C1C]">{application.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#A3A3A3]" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">Applied</p>
                <p className="text-sm text-[#1C1C1C]">{formatAppliedDate(application.appliedAt)}</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">Bio</p>
            <p className="mt-1 text-sm leading-relaxed text-[#1C1C1C]">{application.bio}</p>
          </div>

          {/* Resume */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">Resume</p>
            <a
              href={application.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-2 border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 text-sm text-[#C108AB] transition-colors hover:border-[#C108AB]/30 hover:bg-white"
            >
              <FileText className="h-4 w-4" />
              View resume (PDF)
            </a>
          </div>

          {/* Answers */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">Application answers</p>
            <div className="mt-2 space-y-3">
              {application.answers.map((a, i) => (
                <div key={i} className="border border-[#E5E5E5] bg-[#FAFAFA] p-4">
                  <p className="text-xs font-semibold text-[#1C1C1C]">{a.question}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#525252]">{a.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier assignment (only for pending approval) */}
          {isPending && (
            <div className="border-t border-[#E5E5E5] pt-5">
              <p className="text-sm font-medium text-[#1C1C1C]">Assign tier on approval</p>
              <p className="mt-0.5 text-xs text-[#737373]">
                Defaults to the applicant's desired tier. Adjust if needed.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIER_OPTIONS.map((t) => {
                  const active = selectedTier === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'border-[#C108AB] bg-[#C108AB] text-white'
                          : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
                      }`}
                    >
                      {TIER_LABEL[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          {isPending ? (
            <>
              <Button variant="outline" size="sm" onClick={onWaitlist} disabled={processing}>
                <Clock className="h-4 w-4" />
                Waitlist
              </Button>
              <Button variant="danger" size="sm" onClick={onReject} disabled={processing} aria-busy={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                Reject
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => selectedTier && onApprove(selectedTier)}
                disabled={processing || !selectedTier}
                aria-busy={processing}
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve &amp; Assign
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reject confirmation                                                 */
/* ------------------------------------------------------------------ */

function RejectConfirm({
  isOpen,
  applicantName,
  onCancel,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  applicantName: string;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        className="relative z-10 mx-4 w-full max-w-md bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3 px-6 py-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[rgba(220,38,38,0.08)] text-[#DC2626]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1C1C1C]">Reject application?</h3>
            <p className="mt-1 text-sm text-[#525252]">
              You are about to reject the application from{' '}
              <span className="font-medium text-[#1C1C1C]">{applicantName}</span>. The applicant will be
              notified and can re-apply after 90 days.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Reject Application
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CouncilApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  const [detailId, setDetailId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const detailApplication = applications.find((a) => a.id === detailId) ?? null;

  const updateStatus = (id: string, status: ApplicationStatus, assignedTier: TierId | null = null) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status, assignedTier: assignedTier ?? a.assignedTier } : a,
      ),
    );
  };

  const handleApprove = (tier: TierId) => {
    if (!detailApplication) return;
    const id = detailApplication.id;
    setProcessingId(id);
    setTimeout(() => {
      updateStatus(id, 'approved', tier);
      setProcessingId(null);
      setDetailId(null);
    }, 500);
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setProcessingId(id);
    setTimeout(() => {
      updateStatus(id, 'rejected');
      setProcessingId(null);
      setRejectTarget(null);
      setDetailId(null);
    }, 500);
  };

  const handleWaitlist = () => {
    if (!detailApplication) return;
    const id = detailApplication.id;
    setProcessingId(id);
    setTimeout(() => {
      updateStatus(id, 'waitlisted');
      setProcessingId(null);
      setDetailId(null);
    }, 500);
  };

  const handleQuickReject = (app: Application) => {
    setRejectTarget(app);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.applicantName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        TIER_LABEL[a.desiredTier].toLowerCase().includes(q)
      );
    });
  }, [applications, query, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<ApplicationStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      waitlisted: 0,
    };
    applications.forEach((a) => {
      c[a.status] += 1;
    });
    return c;
  }, [applications]);

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-2">
              Council Admin
            </div>
            <h1
              className="text-2xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Applications
            </h1>
            <p className="mt-1 text-sm text-[#737373]">
              Review membership applications, approve with tier assignment, or reject / waitlist.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning">{counts.pending} pending</Badge>
            <Badge variant="success">{counts.approved} approved</Badge>
          </div>
        </div>

        {/* ---------- Filters ---------- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStatusFilter('all')}
              className={`border px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'border-[#C108AB] bg-[#C108AB] text-white'
                  : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
              }`}
            >
              All Status
            </button>
            {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'border-[#C108AB] bg-[#C108AB] text-white'
                    : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
                }`}
              >
                {STATUS_META[s].label}
                <span className="text-[11px] opacity-70">({counts[s]})</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, company…"
              aria-label="Search applications"
            />
          </div>
        </div>

        {/* ---------- Table ---------- */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <FileText className="h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm font-medium text-[#1C1C1C]">No applications found</p>
                <p className="mt-1 text-xs text-[#737373]">
                  Adjust your filters to see more applications.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                      <th className="px-6 py-3 font-semibold">Applicant</th>
                      <th className="px-6 py-3 font-semibold">Desired Tier</th>
                      <th className="px-6 py-3 font-semibold">Applied</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const status = STATUS_META[a.status];
                      const isPending = a.status === 'pending';
                      const isProcessing = processingId === a.id;
                      return (
                        <tr
                          key={a.id}
                          className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[rgba(193,8,171,0.08)] text-[11px] font-semibold uppercase text-[#C108AB]">
                                {a.applicantName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#1C1C1C]">{a.applicantName}</p>
                                <p className="mt-0.5 truncate text-xs text-[#A3A3A3]">
                                  {a.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={tierBadgeVariant(a.desiredTier)}>
                              {TIER_LABEL[a.desiredTier]}
                            </Badge>
                            {a.assignedTier && a.assignedTier !== a.desiredTier && (
                              <div className="mt-1">
                                <Badge variant="success">
                                  Assigned: {TIER_LABEL[a.assignedTier]}
                                </Badge>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#525252]">
                            {formatAppliedDate(a.appliedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setDetailId(a.id)}
                                title="View details"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#C108AB]"
                                aria-label={`View details for ${a.applicantName}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleQuickReject(a)}
                                    title="Reject"
                                    className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#DC2626]"
                                    aria-label={`Reject ${a.applicantName}`}
                                    disabled={isProcessing}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDetailId(a.id)}
                                    title="Approve"
                                    className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#1A7D42]"
                                    aria-label={`Approve ${a.applicantName}`}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ApplicationDetailModal
        isOpen={detailId !== null}
        application={detailApplication}
        onClose={() => setDetailId(null)}
        onApprove={handleApprove}
        onReject={() => detailApplication && setRejectTarget(detailApplication)}
        onWaitlist={handleWaitlist}
        processing={processingId === detailId}
      />

      <RejectConfirm
        isOpen={rejectTarget !== null}
        applicantName={rejectTarget?.applicantName ?? ''}
        onCancel={() => setRejectTarget(null)}
        onConfirm={handleReject}
        submitting={processingId === rejectTarget?.id}
      />
    </div>
  );
}

export default CouncilApplicationsPage;
