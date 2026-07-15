/**
 * CouncilCoachingManagerPage — Admin CRUD for Council coaching sessions.
 * Schedule sessions, assign coaches, track status, add notes.
 * Self-contained with mock data; wire to /api/admin/council/coaching for persistence.
 */
import React, { useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  X,
  AlertTriangle,
  Loader2,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

interface CoachingSession {
  id: string;
  memberName: string;
  memberEmail: string;
  coachName: string;
  date: string; // ISO
  durationMin: number;
  status: SessionStatus;
  notes: string;
}

interface SessionForm {
  memberName: string;
  memberEmail: string;
  coachName: string;
  date: string;
  durationMin: number;
  status: SessionStatus;
  notes: string;
}

/* ------------------------------------------------------------------ */
/* Label / meta maps                                                   */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<
  SessionStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'fuchsia' }
> = {
  scheduled: { label: 'Scheduled', variant: 'fuchsia' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  'no-show': { label: 'No-show', variant: 'warning' },
};

const COACHES: string[] = [
  'Sarah Chen',
  'David Park',
  'Wei Zhang',
  'Elena Rodriguez',
  'Marcus Wei',
];

const EMPTY_FORM: SessionForm = {
  memberName: '',
  memberEmail: '',
  coachName: COACHES[0],
  date: '',
  durationMin: 60,
  status: 'scheduled',
  notes: '',
};

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_SESSIONS: CoachingSession[] = [
  {
    id: 'cs_001',
    memberName: 'Priya Nair',
    memberEmail: 'priya@summitpe.com',
    coachName: 'Sarah Chen',
    date: '2026-07-16T15:00:00Z',
    durationMin: 60,
    status: 'scheduled',
    notes: 'Career transition strategy — PE to operating role.',
  },
  {
    id: 'cs_002',
    memberName: 'Tomas Berg',
    memberEmail: 'tomas.b@northstar.co',
    coachName: 'David Park',
    date: '2026-07-12T10:30:00Z',
    durationMin: 45,
    status: 'completed',
    notes: 'Compensation negotiation prep for CFO offer. Strong outcome.',
  },
  {
    id: 'cs_003',
    memberName: 'Aisha Khan',
    memberEmail: 'aisha.k@vertexventures.com',
    coachName: 'Wei Zhang',
    date: '2026-07-10T18:00:00Z',
    durationMin: 60,
    status: 'no-show',
    notes: 'Member did not join. Rescheduling requested.',
  },
  {
    id: 'cs_004',
    memberName: 'Elena Rodriguez',
    memberEmail: 'elena.r@horizoncap.com',
    coachName: 'Elena Rodriguez',
    date: '2026-07-18T11:00:00Z',
    durationMin: 90,
    status: 'scheduled',
    notes: 'Board readiness — first-time board seat prep.',
  },
  {
    id: 'cs_005',
    memberName: 'Marcus Wei',
    memberEmail: 'm.wei@brightwave.io',
    coachName: 'Marcus Wei',
    date: '2026-07-05T14:00:00Z',
    durationMin: 60,
    status: 'cancelled',
    notes: 'Cancelled by member due to conflict. Credits refunded.',
  },
  {
    id: 'cs_006',
    memberName: 'Sarah Chen',
    memberEmail: 'sarah.chen@horizoncap.com',
    coachName: 'David Park',
    date: '2026-07-20T09:00:00Z',
    durationMin: 60,
    status: 'scheduled',
    notes: 'Annual career review and goal-setting.',
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatSessionDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateTimeLocal(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

/* ------------------------------------------------------------------ */
/* Session form modal                                                  */
/* ------------------------------------------------------------------ */

function SessionFormModal({
  isOpen,
  isEdit,
  form,
  onClose,
  onChange,
  onSubmit,
  submitting,
}: {
  isOpen: boolean;
  isEdit: boolean;
  form: SessionForm;
  onClose: () => void;
  onChange: (patch: Partial<SessionForm>) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  if (!isOpen) return null;

  const fieldLabel = 'block text-sm font-medium text-[#1C1C1C] mb-1.5';
  const selectClass =
    'w-full appearance-none border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <h3 id="session-modal-title" className="text-base font-semibold text-[#1C1C1C]">
            {isEdit ? 'Edit Session' : 'Schedule Session'}
          </h3>
          <button onClick={onClose} className="p-1 text-[#737373] hover:text-[#1C1C1C]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="cs-member-name">
                Member name <span className="text-[#C108AB]">*</span>
              </label>
              <Input
                id="cs-member-name"
                value={form.memberName}
                onChange={(e) => onChange({ memberName: e.target.value })}
                placeholder="e.g. Priya Nair"
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="cs-member-email">
                Member email
              </label>
              <Input
                id="cs-member-email"
                type="email"
                value={form.memberEmail}
                onChange={(e) => onChange({ memberEmail: e.target.value })}
                placeholder="member@company.com"
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="cs-coach">
              Coach assignment <span className="text-[#C108AB]">*</span>
            </label>
            <div className="relative">
              <select
                id="cs-coach"
                value={form.coachName}
                onChange={(e) => onChange({ coachName: e.target.value })}
                className={selectClass}
              >
                {COACHES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={fieldLabel} htmlFor="cs-date">
                Date &amp; time <span className="text-[#C108AB]">*</span>
              </label>
              <Input
                id="cs-date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => onChange({ date: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="cs-duration">
                Duration (min)
              </label>
              <Input
                id="cs-duration"
                type="number"
                min={15}
                step={15}
                value={form.durationMin}
                onChange={(e) => onChange({ durationMin: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="cs-status">
              Status
            </label>
            <select
              id="cs-status"
              value={form.status}
              onChange={(e) => onChange({ status: e.target.value as SessionStatus })}
              className={selectClass}
            >
              {(Object.keys(STATUS_META) as SessionStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="cs-notes">
              Notes
            </label>
            <textarea
              id="cs-notes"
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={4}
              placeholder="Agenda, focus area, or follow-up notes…"
              className="w-full resize-y border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Schedule Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation                                                 */
/* ------------------------------------------------------------------ */

function DeleteConfirm({
  isOpen,
  memberName,
  onCancel,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  memberName: string;
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
            <h3 className="text-base font-semibold text-[#1C1C1C]">Delete session?</h3>
            <p className="mt-1 text-sm text-[#525252]">
              You are about to permanently delete the coaching session for{' '}
              <span className="font-medium text-[#1C1C1C]">{memberName}</span>. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CouncilCoachingManagerPage() {
  const [sessions, setSessions] = useState<CoachingSession[]>(MOCK_SESSIONS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CoachingSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (session: CoachingSession) => {
    setEditId(session.id);
    setForm({
      memberName: session.memberName,
      memberEmail: session.memberEmail,
      coachName: session.coachName,
      date: toDateTimeLocal(session.date),
      durationMin: session.durationMin,
      status: session.status,
      notes: session.notes,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      if (editId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === editId
              ? {
                  ...s,
                  memberName: form.memberName,
                  memberEmail: form.memberEmail,
                  coachName: form.coachName,
                  date: fromDateTimeLocal(form.date),
                  durationMin: form.durationMin,
                  status: form.status,
                  notes: form.notes,
                }
              : s,
          ),
        );
      } else {
        const newSession: CoachingSession = {
          id: `cs_${Date.now()}`,
          memberName: form.memberName,
          memberEmail: form.memberEmail,
          coachName: form.coachName,
          date: fromDateTimeLocal(form.date),
          durationMin: form.durationMin,
          status: form.status,
          notes: form.notes,
        };
        setSessions((prev) => [newSession, ...prev]);
      }
      setSubmitting(false);
      setModalOpen(false);
    }, 400);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleting(false);
      setDeleteTarget(null);
    }, 400);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (coachFilter !== 'all' && s.coachName !== coachFilter) return false;
      if (!q) return true;
      return (
        s.memberName.toLowerCase().includes(q) ||
        s.memberEmail.toLowerCase().includes(q) ||
        s.coachName.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
      );
    });
  }, [sessions, query, statusFilter, coachFilter]);

  const counts = useMemo(() => {
    const c: Record<SessionStatus, number> = {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      'no-show': 0,
    };
    sessions.forEach((s) => {
      c[s.status] += 1;
    });
    return c;
  }, [sessions]);

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
              Coaching Manager
            </h1>
            <p className="mt-1 text-sm text-[#737373]">
              Schedule coaching sessions, assign coaches, and track outcomes.
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Schedule Session
          </Button>
        </div>

        {/* ---------- Status summary ---------- */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(STATUS_META) as SessionStatus[]).map((s) => (
            <Card key={s} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[#737373]">
                  {STATUS_META[s].label}
                </span>
                <Badge variant={STATUS_META[s].variant}>{counts[s]}</Badge>
              </div>
            </Card>
          ))}
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
            {(Object.keys(STATUS_META) as SessionStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`border px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'border-[#C108AB] bg-[#C108AB] text-white'
                    : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <select
                value={coachFilter}
                onChange={(e) => setCoachFilter(e.target.value)}
                aria-label="Filter by coach"
                className="appearance-none border border-[#E5E5E5] bg-white px-4 py-2.5 pr-9 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
              >
                <option value="all">All Coaches</option>
                {COACHES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full sm:w-72">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search member, coach, notes…"
                aria-label="Search coaching sessions"
              />
            </div>
          </div>
        </div>

        {/* ---------- Table ---------- */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <GraduationCap className="h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm font-medium text-[#1C1C1C]">No coaching sessions found</p>
                <p className="mt-1 text-xs text-[#737373]">
                  Adjust your filters or schedule a new session.
                </p>
                <Button size="sm" className="mt-4" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Schedule Session
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                      <th className="px-6 py-3 font-semibold">Member</th>
                      <th className="px-6 py-3 font-semibold">Coach</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Notes</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const status = STATUS_META[s.status];
                      return (
                        <tr
                          key={s.id}
                          className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-[#1C1C1C]">{s.memberName}</p>
                            <p className="mt-0.5 text-xs text-[#A3A3A3]">{s.memberEmail}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-[rgba(193,8,171,0.08)] text-[10px] font-semibold uppercase text-[#C108AB]">
                                {s.coachName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-sm text-[#525252]">{s.coachName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-[#525252]">
                              <CalendarClock className="h-3.5 w-3.5 text-[#A3A3A3]" />
                              {formatSessionDate(s.date)}
                            </div>
                            <p className="mt-0.5 text-[11px] text-[#A3A3A3]">{s.durationMin} min</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <p className="max-w-xs truncate text-sm text-[#525252]" title={s.notes}>
                              {s.notes || '—'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(s)}
                                title="Edit"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#C108AB]"
                                aria-label={`Edit session for ${s.memberName}`}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(s)}
                                title="Delete"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#DC2626]"
                                aria-label={`Delete session for ${s.memberName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

      <SessionFormModal
        isOpen={modalOpen}
        isEdit={editId !== null}
        form={form}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <DeleteConfirm
        isOpen={deleteTarget !== null}
        memberName={deleteTarget?.memberName ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        submitting={deleting}
      />
    </div>
  );
}

export default CouncilCoachingManagerPage;
