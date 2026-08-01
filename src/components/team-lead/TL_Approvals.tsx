import React, { useMemo, useState } from 'react';
import {
  ClipboardCheck,
  Filter,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

type ApprovalType =
  | 'mandate_creation'
  | 'expense'
  | 'discount'
  | 'candidate_offer'
  | 'client_communication';

type SLAStatus = 'on_track' | 'at_risk' | 'breached';

interface Approval {
  id: string;
  title: string;
  requester: string;
  type: ApprovalType;
  details: string;
  amount?: number;
  submittedDate: string;
  slaStatus: SLAStatus;
  daysInQueue: number;
}

const APPROVAL_TYPES: { value: ApprovalType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'mandate_creation', label: 'Mandate creation' },
  { value: 'expense', label: 'Expense' },
  { value: 'discount', label: 'Discount' },
  { value: 'candidate_offer', label: 'Candidate offer' },
  { value: 'client_communication', label: 'Client communication' },
];

const TYPE_LABEL: Record<ApprovalType, string> = {
  mandate_creation: 'Mandate creation',
  expense: 'Expense',
  discount: 'Discount',
  candidate_offer: 'Candidate offer',
  client_communication: 'Client communication',
};

const SLA_BADGE: Record<SLAStatus, { variant: 'success' | 'warning' | 'error'; label: string }> = {
  on_track: { variant: 'success', label: 'On track' },
  at_risk: { variant: 'warning', label: 'At risk' },
  breached: { variant: 'error', label: 'Breached' },
};

const SLA_ICON: Record<SLAStatus, React.ReactNode> = {
  on_track: <CheckCircle2 className="w-3.5 h-3.5" />,
  at_risk: <AlertTriangle className="w-3.5 h-3.5" />,
  breached: <AlertTriangle className="w-3.5 h-3.5" />,
};

const SEED_APPROVALS: Approval[] = [
  {
    id: 'APR-001',
    title: 'New executive search mandate — Northwind Capital, CFO',
    requester: 'Marie Lavoie',
    type: 'mandate_creation',
    details: 'Retained search for CFO, $180K fee, 90-day target placement.',
    amount: 180000,
    submittedDate: '2026-07-26',
    slaStatus: 'on_track',
    daysInQueue: 1,
  },
  {
    id: 'APR-002',
    title: 'Candidate offer — Jordan Pike, VP Operations @ Helix Manufacturing',
    requester: 'Daniel Otieno',
    type: 'candidate_offer',
    details: 'Base $245K + 15% bonus; sign-on $25K. Offer window 72h.',
    amount: 245000,
    submittedDate: '2026-07-28',
    slaStatus: 'at_risk',
    daysInQueue: 3,
  },
  {
    id: 'APR-003',
    title: 'Client discount request — Brightwave Logistics, advisory retainer',
    requester: 'Priya Nair',
    type: 'discount',
    details: 'Client requesting 12% discount on $95K quarterly retainer.',
    amount: 11400,
    submittedDate: '2026-07-30',
    slaStatus: 'on_track',
    daysInQueue: 1,
  },
  {
    id: 'APR-004',
    title: 'Expense reimbursement — candidate travel, Aethel Partners',
    requester: 'Samuel Greene',
    type: 'expense',
    details: 'Final-round candidate travel from London to Montréal, $3,420.',
    amount: 3420,
    submittedDate: '2026-07-21',
    slaStatus: 'breached',
    daysInQueue: 9,
  },
  {
    id: 'APR-005',
    title: 'External client communication — press quote on succession',
    requester: 'Aïcha Benali',
    type: 'client_communication',
    details: 'Globe & Mail request for comment on K-12 leadership trends.',
    submittedDate: '2026-07-29',
    slaStatus: 'on_track',
    daysInQueue: 2,
  },
  {
    id: 'APR-006',
    title: 'New advisory mandate — Cedar Health Group, board refresh',
    requester: 'Marie Lavoie',
    type: 'mandate_creation',
    details: 'Advisory engagement, 2 independent directors, $120K fee.',
    amount: 120000,
    submittedDate: '2026-07-24',
    slaStatus: 'at_risk',
    daysInQueue: 6,
  },
  {
    id: 'APR-007',
    title: 'Expense reimbursement — assessment tools, Helix search',
    requester: 'Daniel Otieno',
    type: 'expense',
    details: 'Hogan + Korn Ferry assessments, 4 candidates, $7,840.',
    amount: 7840,
    submittedDate: '2026-07-27',
    slaStatus: 'on_track',
    daysInQueue: 4,
  },
  {
    id: 'APR-008',
    title: 'Candidate offer — Lina Marchetti, Chief People Officer @ Brightwave',
    requester: 'Priya Nair',
    type: 'candidate_offer',
    details: 'Base $210K; equity 0.4%; relocation $18K. Offer window 48h.',
    amount: 210000,
    submittedDate: '2026-07-31',
    slaStatus: 'on_track',
    daysInQueue: 1,
  },
];

interface DecisionState {
  approvalId: string;
  decision: 'approve' | 'reject' | null;
  notes: string;
}

const fmtCurrency = (v?: number) =>
  v == null ? '—' : `$${v.toLocaleString('en-CA')}`;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const TL_Approvals: React.FC = () => {
  const [filter, setFilter] = useState<ApprovalType | 'all'>('all');
  const [approvals, setApprovals] = useState<Approval[]>(SEED_APPROVALS);
  const [decision, setDecision] = useState<DecisionState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? approvals : approvals.filter((a) => a.type === filter)),
    [filter, approvals],
  );

  const pendingCount = approvals.length;
  const breachedCount = approvals.filter((a) => a.slaStatus === 'breached').length;

  const startDecision = (id: string, decisionType: 'approve' | 'reject') => {
    setDecision({ approvalId: id, decision: decisionType, notes: '' });
    setToast(null);
  };

  const cancelDecision = () => setDecision(null);

  const confirmDecision = () => {
    if (!decision || !decision.decision) return;
    const acted = approvals.find((a) => a.id === decision.approvalId);
    setApprovals((prev) => prev.filter((a) => a.id !== decision.approvalId));
    setToast(
      `Approval ${acted?.id ?? ''} ${decision.decision === 'approve' ? 'approved' : 'rejected'}${
        decision.notes ? ' with notes' : ''
      }.`,
    );
    setDecision(null);
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>Approval Queue</Heading>
          <Paragraph color="textMuted">
            Review pending approvals, capture decision notes and resolve SLA breaches.
          </Paragraph>
        </Grid>
        <Flex align="center" gap="3">
          <Badge variant="info">{pendingCount} pending</Badge>
          {breachedCount > 0 && (
            <Badge variant="error">{breachedCount} SLA breached</Badge>
          )}
        </Flex>
      </Flex>

      {/* Filter bar */}
      <Card padding="4">
        <Flex justify="between" align="center" gap="4">
          <Flex align="center" gap="2">
            <Filter className="w-4 h-4" style={{ color: COLORS.textMuted }} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ApprovalType | 'all')}
              style={{
                padding: `${SPACING[2]}px ${SPACING[3]}px`,
                fontSize: SPACING[3],
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                backgroundColor: COLORS.white,
                color: COLORS.text,
                outline: 'none',
              }}
            >
              {APPROVAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Flex>
          <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
            Showing {filtered.length} of {approvals.length}
          </span>
        </Flex>
      </Card>

      {/* Approval list */}
      {filtered.length === 0 ? (
        <Card padding="8">
          <Flex align="center" justify="center" gap="3">
            <ClipboardCheck className="w-6 h-6" style={{ color: COLORS.success }} />
            <Heading level={5}>Queue is clear</Heading>
          </Flex>
          <Paragraph color="textMuted" >
            No approvals match this filter.
          </Paragraph>
        </Card>
      ) : (
        <Grid columns={1} gap="3">
          {filtered.map((a) => {
            const sla = SLA_BADGE[a.slaStatus];
            const isDecisionOpen = decision?.approvalId === a.id;
            return (
              <Card key={a.id} padding="5">
                <Grid columns={1} gap="3">
                  <Flex justify="between" align="start" gap="4">
                    <Grid columns={1} gap="1">
                      <Flex align="center" gap="2">
                        <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                          {a.id}
                        </span>
                        <Badge variant="default">{TYPE_LABEL[a.type]}</Badge>
                        <Badge variant={sla.variant}>
                          <Flex align="center" gap="1">
                            {SLA_ICON[a.slaStatus]}
                            {sla.label}
                          </Flex>
                        </Badge>
                      </Flex>
                      <Heading level={5}>{a.title}</Heading>
                      <Paragraph color="textSecondary">{a.details}</Paragraph>
                    </Grid>
                    <Flex justify="end" align="start" gap="6">
                      <Grid columns={1} gap="0" >
                        <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                          Amount
                        </span>
                        <span style={{ fontSize: SPACING[4], fontWeight: 700, color: COLORS.text }}>
                          {fmtCurrency(a.amount)}
                        </span>
                      </Grid>
                    </Flex>
                  </Flex>

                  <Flex justify="between" align="center" gap="4">
                    <Flex align="center" gap="4">
                      <Flex align="center" gap="1">
                        <FileText className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
                        <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                          {a.requester}
                        </span>
                      </Flex>
                      <Flex align="center" gap="1">
                        <Clock className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
                        <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                          Submitted {fmtDate(a.submittedDate)} · {a.daysInQueue}d in queue
                        </span>
                      </Flex>
                    </Flex>

                    {!isDecisionOpen ? (
                      <Flex gap="2">
                        <Button size="sm" variant="outline" onClick={() => startDecision(a.id, 'reject')}>
                          <X className="w-4 h-4" /> Reject
                        </Button>
                        <Button size="sm" onClick={() => startDecision(a.id, 'approve')}>
                          <Check className="w-4 h-4" /> Approve
                        </Button>
                      </Flex>
                    ) : null}
                  </Flex>

                  {/* Inline decision form */}
                  {isDecisionOpen && decision ? (
                    <div
                      style={{
                        borderTop: `1px solid ${COLORS.borderLight}`,
                        paddingTop: SPACING[4],
                      }}
                    >
                      <Grid columns={1} gap="3">
                        <Flex align="center" gap="2">
                          {decision.decision === 'approve' ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.success }} />
                          ) : (
                            <AlertTriangle className="w-4 h-4" style={{ color: COLORS.error }} />
                          )}
                          <Heading level={6}>
                            {decision.decision === 'approve' ? 'Approve' : 'Reject'} {a.id}
                          </Heading>
                        </Flex>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: SPACING[2],
                              fontWeight: 600,
                              color: COLORS.textSecondary,
                              marginBottom: SPACING[1],
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            Decision notes
                          </label>
                          <textarea
                            value={decision.notes}
                            onChange={(e) =>
                              setDecision({ ...decision, notes: e.target.value })
                            }
                            placeholder={
                              decision.decision === 'approve'
                                ? 'Add context for the approval (optional)…'
                                : 'Explain why this is being rejected…'
                            }
                            rows={3}
                            style={{
                              width: '100%',
                              padding: `${SPACING[3]}px`,
                              fontSize: SPACING[3],
                              border: `1px solid ${COLORS.border}`,
                              borderRadius: 8,
                              backgroundColor: COLORS.white,
                              color: COLORS.text,
                              outline: 'none',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>
                        <Flex justify="end" gap="2">
                          <Button size="sm" variant="ghost" onClick={cancelDecision}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant={decision.decision === 'approve' ? 'primary' : 'danger'}
                            onClick={confirmDecision}
                          >
                            Confirm {decision.decision === 'approve' ? 'approval' : 'rejection'}
                          </Button>
                        </Flex>
                      </Grid>
                    </div>
                  ) : null}
                </Grid>
              </Card>
            );
          })}
        </Grid>
      )}

      {toast ? (
        <Card padding="3">
          <Flex align="center" gap="2">
            <CheckCircle2 className="w-4 h-4" style={{ color: COLORS.success }} />
            <span style={{ fontSize: SPACING[3], color: COLORS.text }}>{toast}</span>
          </Flex>
        </Card>
      ) : null}
    </Grid>
  );
};
