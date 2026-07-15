/**
 * CouncilEventManagerPage — Admin CRUD for Council events.
 * Create / edit / delete events, track registration & attendance, manage status.
 * Self-contained with mock data; wire to /api/admin/council/events for persistence.
 */
import React, { useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  CalendarDays,
  Users,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type EventType = 'workshop' | 'roundtable' | 'webinar' | 'dinner' | 'networking';
type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled';

interface CouncilEvent {
  id: string;
  title: string;
  date: string; // ISO
  type: EventType;
  capacity: number;
  registered: number;
  attended: number;
  status: EventStatus;
  location: string;
}

interface EventForm {
  title: string;
  date: string;
  type: EventType;
  capacity: number;
  location: string;
  status: EventStatus;
}

interface AttendanceRow {
  id: string;
  name: string;
  email: string;
  attended: boolean;
}

/* ------------------------------------------------------------------ */
/* Label / meta maps                                                   */
/* ------------------------------------------------------------------ */

const TYPE_LABEL: Record<EventType, string> = {
  workshop: 'Workshop',
  roundtable: 'Roundtable',
  webinar: 'Webinar',
  dinner: 'Networking Dinner',
  networking: 'Networking',
};

const STATUS_META: Record<
  EventStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'fuchsia' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  published: { label: 'Published', variant: 'fuchsia' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

const EMPTY_FORM: EventForm = {
  title: '',
  date: '',
  type: 'workshop',
  capacity: 50,
  location: '',
  status: 'draft',
};

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_EVENTS: CouncilEvent[] = [
  {
    id: 'evt_001',
    title: 'AI Leadership Roundtable: Scaling Enterprise ML',
    date: '2026-07-22T18:00:00Z',
    type: 'roundtable',
    capacity: 24,
    registered: 21,
    attended: 0,
    status: 'published',
    location: 'Shanghai · Jing\'an',
  },
  {
    id: 'evt_002',
    title: 'Compensation Benchmarking Workshop',
    date: '2026-07-10T14:00:00Z',
    type: 'workshop',
    capacity: 40,
    registered: 38,
    attended: 35,
    status: 'completed',
    location: 'Virtual · Zoom',
  },
  {
    id: 'evt_003',
    title: 'PE Deal Flow Networking Dinner',
    date: '2026-08-05T19:30:00Z',
    type: 'dinner',
    capacity: 16,
    registered: 14,
    attended: 0,
    status: 'published',
    location: 'Beijing · Chaoyang',
  },
  {
    id: 'evt_004',
    title: 'Executive Transitions Webinar',
    date: '2026-08-12T11:00:00Z',
    type: 'webinar',
    capacity: 200,
    registered: 142,
    attended: 0,
    status: 'published',
    location: 'Virtual · Zoom',
  },
  {
    id: 'evt_005',
    title: 'Career Strategy Workshop',
    date: '2026-06-28T10:00:00Z',
    type: 'workshop',
    capacity: 30,
    registered: 12,
    attended: 0,
    status: 'cancelled',
    location: 'Shenzhen · Futian',
  },
  {
    id: 'evt_006',
    title: 'Founding Member Mixer',
    date: '2026-08-20T18:30:00Z',
    type: 'networking',
    capacity: 20,
    registered: 0,
    attended: 0,
    status: 'draft',
    location: 'Shanghai · Xuhui',
  },
];

const MOCK_ATTENDEES: AttendanceRow[] = [
  { id: 'att_001', name: 'Sarah Chen', email: 'sarah.chen@horizoncap.com', attended: true },
  { id: 'att_002', name: 'David Park', email: 'd.park@brightwave.io', attended: true },
  { id: 'att_003', name: 'Wei Zhang', email: 'w.zhang@summitpe.com', attended: false },
  { id: 'att_004', name: 'Elena Rodriguez', email: 'elena.r@horizoncap.com', attended: true },
  { id: 'att_005', name: 'Marcus Wei', email: 'm.wei@brightwave.io', attended: false },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatEventDate(iso: string): string {
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
/* Event form modal                                                    */
/* ------------------------------------------------------------------ */

function EventFormModal({
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
  form: EventForm;
  onClose: () => void;
  onChange: (patch: Partial<EventForm>) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  if (!isOpen) return null;

  const fieldLabel = 'block text-sm font-medium text-[#1C1C1C] mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <h3 id="event-modal-title" className="text-base font-semibold text-[#1C1C1C]">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h3>
          <button onClick={onClose} className="p-1 text-[#737373] hover:text-[#1C1C1C]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className={fieldLabel} htmlFor="evt-title">
              Title <span className="text-[#C108AB]">*</span>
            </label>
            <Input
              id="evt-title"
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. AI Leadership Roundtable"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="evt-date">
                Date &amp; time <span className="text-[#C108AB]">*</span>
              </label>
              <Input
                id="evt-date"
                type="datetime-local"
                value={form.date}
                onChange={(e) => onChange({ date: e.target.value })}
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="evt-type">
                Type
              </label>
              <select
                id="evt-type"
                value={form.type}
                onChange={(e) => onChange({ type: e.target.value as EventType })}
                className="w-full appearance-none border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
              >
                {(Object.keys(TYPE_LABEL) as EventType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={fieldLabel} htmlFor="evt-capacity">
                Capacity
              </label>
              <Input
                id="evt-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => onChange({ capacity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="evt-status">
                Status
              </label>
              <select
                id="evt-status"
                value={form.status}
                onChange={(e) => onChange({ status: e.target.value as EventStatus })}
                className="w-full appearance-none border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
              >
                {(Object.keys(STATUS_META) as EventStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={fieldLabel} htmlFor="evt-location">
              Location
            </label>
            <Input
              id="evt-location"
              value={form.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="e.g. Shanghai · Jing'an or Virtual · Zoom"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Attendance modal                                                    */
/* ------------------------------------------------------------------ */

function AttendanceModal({
  isOpen,
  event,
  attendees,
  onClose,
  onToggle,
}: {
  isOpen: boolean;
  event: CouncilEvent | null;
  attendees: AttendanceRow[];
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  if (!isOpen || !event) return null;

  const presentCount = attendees.filter((a) => a.attended).length;
  const rate = attendees.length ? Math.round((presentCount / attendees.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <div>
            <h3 id="attendance-modal-title" className="text-base font-semibold text-[#1C1C1C]">
              Attendance — {event.title}
            </h3>
            <p className="mt-0.5 text-xs text-[#737373]">
              {presentCount} / {attendees.length} present · {rate}% attendance rate
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-[#737373] hover:text-[#1C1C1C]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {attendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Users className="h-8 w-8 text-[#A3A3A3]" />
              <p className="mt-3 text-sm font-medium text-[#1C1C1C]">No registrants yet</p>
              <p className="mt-1 text-xs text-[#737373]">Attendance tracking becomes available once members register.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold text-center">Present</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a) => (
                  <tr key={a.id} className="border-t border-[#E5E5E5] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1C1C1C]">{a.name}</p>
                      <p className="mt-0.5 text-xs text-[#A3A3A3]">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onToggle(a.id)}
                        className={`inline-flex h-6 w-6 items-center justify-center border transition-colors ${
                          a.attended
                            ? 'border-[#1A7D42] bg-[#1A7D42] text-white'
                            : 'border-[#E5E5E5] bg-white text-transparent hover:border-[#C108AB]/30'
                        }`}
                        aria-label={a.attended ? `Mark ${a.name} absent` : `Mark ${a.name} present`}
                        aria-pressed={a.attended}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
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
  eventTitle,
  onCancel,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  eventTitle: string;
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
            <h3 className="text-base font-semibold text-[#1C1C1C]">Delete event?</h3>
            <p className="mt-1 text-sm text-[#525252]">
              You are about to permanently delete{' '}
              <span className="font-medium text-[#1C1C1C]">{eventTitle}</span>. All registrations and
              attendance records for this event will be removed. This cannot be undone.
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

export function CouncilEventManagerPage() {
  const [events, setEvents] = useState<CouncilEvent[]>(MOCK_EVENTS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CouncilEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [attendanceTarget, setAttendanceTarget] = useState<CouncilEvent | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRow[]>(MOCK_ATTENDEES);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (evt: CouncilEvent) => {
    setEditId(evt.id);
    setForm({
      title: evt.title,
      date: toDateTimeLocal(evt.date),
      type: evt.type,
      capacity: evt.capacity,
      location: evt.location,
      status: evt.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      if (editId) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === editId
              ? {
                  ...e,
                  title: form.title,
                  date: fromDateTimeLocal(form.date),
                  type: form.type,
                  capacity: form.capacity,
                  location: form.location,
                  status: form.status,
                }
              : e,
          ),
        );
      } else {
        const newEvent: CouncilEvent = {
          id: `evt_${Date.now()}`,
          title: form.title,
          date: fromDateTimeLocal(form.date),
          type: form.type,
          capacity: form.capacity,
          registered: 0,
          attended: 0,
          status: form.status,
          location: form.location,
        };
        setEvents((prev) => [newEvent, ...prev]);
      }
      setSubmitting(false);
      setModalOpen(false);
    }, 400);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleting(false);
      setDeleteTarget(null);
    }, 400);
  };

  const toggleAttendee = (id: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === id ? { ...a, attended: !a.attended } : a)),
    );
  };

  const openAttendance = (evt: CouncilEvent) => {
    setAttendanceTarget(evt);
    // In production, fetch registrants for this event. Using mock list here.
    setAttendees(MOCK_ATTENDEES.slice(0, evt.registered));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        TYPE_LABEL[e.type].toLowerCase().includes(q)
      );
    });
  }, [events, query, statusFilter]);

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
              Event Manager
            </h1>
            <p className="mt-1 text-sm text-[#737373]">
              Create, edit, and track Council events and attendance.
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
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
            {(Object.keys(STATUS_META) as EventStatus[]).map((s) => (
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
          <div className="relative w-full sm:w-72">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, type, location…"
              aria-label="Search events"
            />
          </div>
        </div>

        {/* ---------- Table ---------- */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <CalendarDays className="h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm font-medium text-[#1C1C1C]">No events found</p>
                <p className="mt-1 text-xs text-[#737373]">
                  Adjust your filters or create a new event to get started.
                </p>
                <Button size="sm" className="mt-4" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                      <th className="px-6 py-3 font-semibold">Title</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Type</th>
                      <th className="px-6 py-3 font-semibold">Capacity</th>
                      <th className="px-6 py-3 font-semibold">Registered</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => {
                      const status = STATUS_META[e.status];
                      const fillPct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
                      return (
                        <tr
                          key={e.id}
                          className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-[#1C1C1C]">{e.title}</p>
                            <p className="mt-0.5 text-xs text-[#A3A3A3]">{e.location}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#525252]">
                            {formatEventDate(e.date)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="default">{TYPE_LABEL[e.type]}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#525252]">{e.capacity}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#1C1C1C]">
                                {e.registered}
                              </span>
                              <div className="hidden sm:block w-16 h-1.5 bg-[#F7F7F7]">
                                <div
                                  className={`h-full ${fillPct >= 90 ? 'bg-[#C0392B]' : 'bg-[#C108AB]'}`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openAttendance(e)}
                                title="Attendance"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#C108AB]"
                                aria-label={`View attendance for ${e.title}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openEdit(e)}
                                title="Edit"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#C108AB]"
                                aria-label={`Edit ${e.title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(e)}
                                title="Delete"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#DC2626]"
                                aria-label={`Delete ${e.title}`}
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

      <EventFormModal
        isOpen={modalOpen}
        isEdit={editId !== null}
        form={form}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <AttendanceModal
        isOpen={attendanceTarget !== null}
        event={attendanceTarget}
        attendees={attendees}
        onClose={() => setAttendanceTarget(null)}
        onToggle={toggleAttendee}
      />

      <DeleteConfirm
        isOpen={deleteTarget !== null}
        eventTitle={deleteTarget?.title ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        submitting={deleting}
      />
    </div>
  );
}

export default CouncilEventManagerPage;
