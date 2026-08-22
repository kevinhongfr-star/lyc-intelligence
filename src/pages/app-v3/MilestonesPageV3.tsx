import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchMilestones, type MilestoneItem } from '@/services/qualityService';
import { V3 } from '@/styles/v3-tokens';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  FormRow,
  Input,
  ListRow,
  Modal,
  MonoLabel,
  PageHeader,
  ScoreBar,
  Skeleton,
  Tabs,
  Textarea,
  Select,
  scoreColor,
} from '@/components/app-v3/ui';

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getProgressPct(item: MilestoneItem): number {
  if ((item as any).progress != null && typeof (item as any).progress === 'number') {
    return Math.max(0, Math.min(100, (item as any).progress));
  }
  const status = (item.status ?? '').toLowerCase();
  if (status === 'completed') return 100;
  if (status === 'in_progress') return 50;
  if (status === 'overdue') return 40;
  if (status === 'pending') return 10;
  return 0;
}

function categorize(items: MilestoneItem[]) {
  const active: MilestoneItem[] = [];
  const completed: MilestoneItem[] = [];
  const queued: MilestoneItem[] = [];
  for (const item of items) {
    const s = (item.status ?? '').toLowerCase();
    if (s === 'completed') {
      completed.push(item);
    } else if (s === 'queued' || s === 'draft') {
      queued.push(item);
    } else {
      active.push(item);
    }
  }
  return { active, completed, queued };
}

function badgeForStatus(status: string): { variant: any; label: string } {
  const s = (status ?? '').toLowerCase();
  if (s === 'completed') return { variant: 'status-ready', label: 'Completed' };
  if (s === 'at_risk' || s === 'at-risk') return { variant: 'status-at-risk', label: 'At Risk' };
  if (s === 'in_progress' || s === 'in-progress' || s === 'pending' || s === 'overdue') {
    return { variant: 'status-in-progress', label: 'In motion' };
  }
  if (s === 'queued') return { variant: 'count', label: 'Queued' };
  if (s === 'draft') return { variant: 'status-draft', label: 'Draft' };
  return { variant: 'status-ready', label: 'Active' };
}

const ROAD_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 34h28" />
    <path d="M10 34V18" />
    <path d="M10 18l18-6v14" />
    <path d="M28 26l-18 6" />
    <path d="M18 34V22" />
    <path d="M18 22l10-4" />
    <path d="M14 12L8 8l6-4 1.5 3 4.5 1-3 4.5L14 12z" />
  </svg>
);

const FLAG_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 36V6" />
    <path d="M8 8l22-4v18L8 22" />
  </svg>
);

const CHECKPOINT_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="28" height="28" />
    <path d="M13 20l5 5 9-11" />
  </svg>
);

function MilestoneRow({ item }: { item: MilestoneItem }): React.ReactElement {
  const targetDate = (item as any).targetDate ?? (item as any).date ?? item.dueDate;
  const badge = badgeForStatus(item.status);
  const progressPct = getProgressPct(item);

  return (
    <div style={{ borderBottom: `1px solid ${V3.ink100}`, paddingBottom: 2, background: V3.white }}>
      <ListRow style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar name={item.title} size="md" />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '14px',
                fontWeight: V3.fwSemibold,
                color: V3.ink800,
                lineHeight: 1.3,
              }}
            >
              {item.title}
            </div>
            <div style={{ marginTop: 4 }}>
              <MonoLabel size="sm" color={V3.ink400}>
                TARGET · {formatShortDate(targetDate)}
              </MonoLabel>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <Button variant="ghost" size="small" to="/app/v3/milestones">→</Button>
        </div>
      </ListRow>
      <div style={{ padding: '0 20px 20px 64px', marginTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, marginTop: 4 }}>
          <MonoLabel size="sm" color={V3.ink400}>PROGRESS</MonoLabel>
          <span
            style={{
              fontFamily: V3.displayFont,
              fontSize: '14px',
              fontWeight: V3.fwSemibold,
              color: scoreColor(progressPct),
              lineHeight: 1,
            }}
          >
            {progressPct}%
          </span>
        </div>
        <ScoreBar score={progressPct} />
      </div>
    </div>
  );
}

function MilestoneList({
  eyebrow,
  eyebrowColor,
  title,
  description,
  items,
  emptyIcon,
  emptyTitle,
  emptyDesc,
}: {
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  description: string;
  items: MilestoneItem[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyDesc: string;
}): React.ReactElement {
  if (!items.length) {
    return <EmptyState iconSvg={emptyIcon} title={emptyTitle} description={emptyDesc} />;
  }
  return (
    <section style={{ marginTop: 32 }}>
      <MonoLabel color={eyebrowColor} style={{ display: 'block', marginBottom: 12 }}>
        {eyebrow}
      </MonoLabel>
      <div
        style={{
          fontFamily: V3.displayFont,
          fontSize: '20px',
          fontWeight: V3.fwRegular,
          color: V3.ink800,
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      <p
        style={{
          marginTop: 8,
          fontFamily: V3.bodyFont,
          fontSize: '14px',
          color: V3.ink500,
          lineHeight: 1.6,
          maxWidth: 520,
          marginBottom: 0,
        }}
      >
        {description}
      </p>
      <div
        style={{
          marginTop: 32,
          border: `1px solid ${V3.border}`,
          background: V3.white,
        }}
      >
        {items.map((item) => (
          <MilestoneRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function MilestonesPageV3(): React.ReactElement {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('active');
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImpact, setNewImpact] = useState('medium');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setLoaded(true);
        return;
      }
      try {
        const data = await fetchMilestones(user.id);
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setItems([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const collections = useMemo(() => categorize(items), [items]);

  const inMotionCount = collections.active.filter(
    (i) => (i.status ?? '').toLowerCase() === 'in_progress'
      || (i.status ?? '').toLowerCase() === 'pending'
      || (i.status ?? '').toLowerCase() === 'overdue',
  ).length;
  const completedCount = collections.completed.length;
  const atRiskCount = collections.active.filter(
    (i) => (i.status ?? '').toLowerCase() === 'at_risk' || (i.status ?? '').toLowerCase() === 'at-risk',
  ).length;

  const nextQueuedItem = [...collections.queued].sort((a, b) => {
    const ad = new Date((a as any).targetDate ?? (a as any).date ?? a.dueDate ?? '').getTime();
    const bd = new Date((b as any).targetDate ?? (b as any).date ?? b.dueDate ?? '').getTime();
    if (Number.isNaN(ad) && Number.isNaN(bd)) return 0;
    if (Number.isNaN(ad)) return 1;
    if (Number.isNaN(bd)) return -1;
    return ad - bd;
  })[0];
  const nextMilestoneShort = formatShortDate(
    (nextQueuedItem as any)?.targetDate ?? (nextQueuedItem as any)?.date ?? nextQueuedItem?.dueDate,
  );

  const activeItems = collections.active;
  const completedItems = collections.completed;
  const queuedItems = collections.queued;

  const resetModal = () => {
    setNewName('');
    setNewDate('');
    setNewDesc('');
    setNewImpact('medium');
  };

  return (
    <>
      <PageHeader
        kicker="MILESTONES"
        title="Your roadmap."
        description="Quarterly goals, tracked progress, and status cadence. Set a target and NEXUS stays with you all the way there."
        right={
          <Button variant="primary" size="large" onClick={() => setModalOpen(true)}>
            + New milestone
          </Button>
        }
      />

      <div
        style={{
          display: 'block',
          maxWidth: V3.appContentMax,
          margin: '0 auto',
          marginTop: 48,
          borderBottom: `1px solid ${V3.ink200}`,
        }}
      >
        <Tabs
          tabs={[
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
            { key: 'queued', label: 'Queued' },
          ]}
          active={activeTab}
          onChange={(key) => setActiveTab(key)}
        />
      </div>

      <div style={{ maxWidth: V3.appContentMax, margin: '0 auto' }}>
        {!loaded ? (
          <div aria-busy style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 32 }}>
            <Skeleton width="100%" height={56} />
            <div style={{ border: `1px solid ${V3.ink100}`, padding: 20, background: V3.white, marginTop: 32 }}>
              <Skeleton width={200} height={14} style={{ marginBottom: 14 }} />
              <Skeleton width={120} height={10} style={{ marginBottom: 22 }} />
              <Skeleton width="100%" height={2} style={{ marginBottom: 18 }} />
              <Skeleton width={200} height={14} style={{ marginBottom: 14 }} />
              <Skeleton width={120} height={10} style={{ marginBottom: 22 }} />
              <Skeleton width="100%" height={2} />
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                height: 56,
                borderTop: `1px solid ${V3.border}`,
                borderBottom: `1px solid ${V3.border}`,
                display: 'flex',
                alignItems: 'center',
                marginTop: 0,
              }}
            >
              {([
                { key: 'in-motion', label: 'In motion', value: String(inMotionCount).padStart(2, '0') },
                { key: 'completed', label: 'Completed', value: String(completedCount).padStart(2, '0') },
                { key: 'at-risk', label: 'At risk', value: String(atRiskCount).padStart(2, '0') },
                { key: 'next', label: 'Next milestone', value: nextMilestoneShort },
              ] as const).map((c, i) => (
                <div
                  key={c.key}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    padding: i === 0 ? '0 16px 0 0' : '0 16px',
                    borderLeft: i === 0 ? 'none' : `1px solid ${V3.dividerSurface}`,
                  }}
                >
                  <MonoLabel size="sm" color={V3.ink400}>{c.label}</MonoLabel>
                  <span
                    style={{
                      fontFamily: V3.displayFont,
                      fontSize: '20px',
                      fontWeight: V3.fwSemibold,
                      color: V3.ink900,
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {c.value}
                  </span>
                </div>
              ))}
            </div>

            {activeTab === 'active' && (
              <MilestoneList
                eyebrow="ACTIVE MILESTONES"
                eyebrowColor={V3.ocean600}
                title="Milestones in motion."
                description="Targets actively being tracked — with cadence, progress bands, and NEXUS check-ins."
                items={activeItems}
                emptyIcon={ROAD_SVG}
                emptyTitle="No active milestones yet."
                emptyDesc="Your active milestones will appear here. Create one to begin tracking progress."
              />
            )}

            {activeTab === 'completed' && (
              <MilestoneList
                eyebrow="COMPLETED MILESTONES"
                eyebrowColor={V3.teal600}
                title="Targets reached."
                description="Milestones that have crossed the finish line — archived with final progress and dates."
                items={completedItems}
                emptyIcon={CHECKPOINT_SVG}
                emptyTitle="No completed milestones yet."
                emptyDesc="Completed milestones will appear here once you mark targets as finished."
              />
            )}

            {activeTab === 'queued' && (
              <MilestoneList
                eyebrow="QUEUED MILESTONES"
                eyebrowColor={V3.ocean600}
                title="Up next on the roadmap."
                description="Drafted and queued targets — waiting to be activated into the tracking cadence."
                items={queuedItems}
                emptyIcon={FLAG_SVG}
                emptyTitle="Nothing in the queue."
                emptyDesc="Queued milestones and drafts will appear here."
              />
            )}
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetModal(); }}
        title="New milestone"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetModal(); }}>Cancel</Button>
            <Button variant="primary" onClick={() => { setModalOpen(false); resetModal(); }}>Create milestone</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FormRow label="Name" helper="Short, memorable milestone title.">
            <div style={{ width: 260 }}>
              <Input
                defaultValue={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Q4 Board prep"
              />
            </div>
          </FormRow>
          <FormRow label="Target date" helper="Completion horizon.">
            <div style={{ width: 260 }}>
              <Input
                type="date"
                defaultValue={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </FormRow>
          <FormRow label="Description" helper="Context, success criteria, notes.">
            <div style={{ width: 260 }}>
              <Textarea
                rows={3}
                defaultValue={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What does success look like?"
              />
            </div>
          </FormRow>
          <FormRow label="Impact level" helper="Relative priority.">
            <div style={{ width: 260 }}>
              <Select
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
          </FormRow>
        </div>
      </Modal>
    </>
  );
}

export default MilestonesPageV3;
