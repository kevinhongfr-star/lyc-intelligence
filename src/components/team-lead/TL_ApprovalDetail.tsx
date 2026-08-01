import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  User,
  Building2,
  Briefcase,
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

interface DecisionEvent {
  id: string;
  actor: string;
  action: 'submitted' | 'approved' | 'rejected' | 'commented' | 'escalated';
  timestamp: string;
  note: string;
}

interface Attachment {
  id: string;
  name: string;
  size: string;
}

interface ApprovalDetail {
  id: string;
  title: string;
  type: ApprovalType;
  status: SLAStatus;
  amount?: number;
  details: string;
  requester: {
    name: string;
    role: string;
    email: string;
    team: string;
  };
  submittedDate: string;
  daysInQueue: number;
  related: {
    kind: 'mandate' | 'opportunity';
    name: string;
    client: string;
    stage: string;
    value: number;
  };
  history: DecisionEvent[];
  attachments: Attachment[];
}

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

const ACTION_LABEL: Record<DecisionEvent['action'], string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  commented: 'Commented',
  escalated: 'Escalated',
};

// Seed store keyed by approval id so details stay realistic across the sample set.
const SEED_DETAILS: Record<string, ApprovalDetail> = {
  'APR-001': {
    id: 'APR-001',
    title: 'New executive search mandate — Northwind Capital, CFO',
    type: 'mandate_creation',
    status: 'on_track',
    amount: 180000,
    details:
      'Retained search for CFO at Northwind Capital. Fee $180K (33% upfront, 33% shortlist, 34% placement). Target placement window: 90 days.',
    requester: {
      name: 'Marie Lavoie',
      role: 'Senior Consultant',
      email: 'marie.lavoie@lycpartners.ca',
      team: 'T1 — Financial Services',
    },
    submittedDate: '2026-07-26',
    daysInQueue: 1,
    related: {
      kind: 'mandate',
      name: 'Northwind Capital — CFO Search',
      client: 'Northwind Capital',
      stage: 'Mandate kickoff',
      value: 180000,
    },
    history: [
      {
        id: 'H1',
        actor: 'Marie Lavoie',
        action: 'submitted',
        timestamp: '2026-07-26T09:12:00',
        note: 'Submitted for TL approval; signed client term sheet attached.',
      },
      {
        id: 'H2',
        actor: 'Daniel Otieno',
        action: 'commented',
        timestamp: '2026-07-26T14:40:00',
        note: 'Confirming we have 2 sourcing consultants available for kickoff.',
      },
    ],
    attachments: [
      { id: 'A1', name: 'Northwind_TermSheet.pdf', size: '420 KB' },
      { id: 'A2', name: 'CFO_Role_Brief.docx', size: '88 KB' },
    ],
  },
  'APR-004': {
    id: 'APR-004',
    title: 'Expense reimbursement — candidate travel, Aethel Partners',
    type: 'expense',
    status: 'breached',
    amount: 3420,
    details:
      'Final-round candidate travel from London to Montréal for Aethel Partners COO search. Flights $2,180, hotel $980, ground transport $260.',
    requester: {
      name: 'Samuel Greene',
      role: 'Consultant',
      email: 'samuel.greene@lycpartners.ca',
      team: 'T2 — Industrial & Operations',
    },
    submittedDate: '2026-07-21',
    daysInQueue: 9,
    related: {
      kind: 'mandate',
      name: 'Aethel Partners — COO Search',
      client: 'Aethel Partners',
      stage: 'Final interviews',
      value: 145000,
    },
    history: [
      {
        id: 'H1',
        actor: 'Samuel Greene',
        action: 'submitted',
        timestamp: '2026-07-21T17:05:00',
        note: 'Submitted receipts; client requested premium economy for candidate.',
      },
      {
        id: 'H2',
        actor: 'System',
        action: 'escalated',
        timestamp: '2026-07-28T08:00:00',
        note: 'Auto-escalated: expense approval SLA exceeded 5 business days.',
      },
    ],
    attachments: [
      { id: 'A1', name: 'Flight_Receipt.pdf', size: '120 KB' },
      { id: 'A2', name: 'Hotel_Invoice.pdf', size: '96 KB' },
      { id: 'A3', name: 'Ground_Transport.pdf', size: '54 KB' },
    ],
  },
};

const FALLBACK: ApprovalDetail = {
  id: 'APR-000',
  title: 'Approval request',
  type: 'mandate_creation',
  status: 'on_track',
  amount: 0,
  details: 'No detail record found for this approval. Request full context from the requester.',
  requester: {
    name: 'Unknown',
    role: '—',
    email: '—',
    team: '—',
  },
  submittedDate: '2026-07-31',
  daysInQueue: 1,
  related: {
    kind: 'mandate',
    name: '—',
    client: '—',
    stage: '—',
    value: 0,
  },
  history: [],
  attachments: [],
};

const fmtCurrency = (v?: number) => (v == null ? '—' : `$${v.toLocaleString('en-CA')}`);

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const TL_ApprovalDetail: React.FC<{ approvalId: string }> = ({ approvalId }) => {
  const detail = useMemo<ApprovalDetail>(
    () => SEED_DETAILS[approvalId] ?? { ...FALLBACK, id: approvalId },
    [approvalId],
  );

  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [resolved, setResolved] = useState<{ kind: 'approve' | 'reject'; note: string } | null>(null);

  const sla = SLA_BADGE[detail.status];

  const confirm = () => {
    if (!decision) return;
    setResolved({ kind: decision, note: notes });
    setDecision(null);
    setNotes('');
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="1">
          <Flex align="center" gap="2">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>{detail.id}</span>
            <Badge variant="default">{TYPE_LABEL[detail.type]}</Badge>
            <Badge variant={sla.variant}>{sla.label}</Badge>
          </Flex>
          <Heading level={3}>{detail.title}</Heading>
          <Flex align="center" gap="3">
            <Flex align="center" gap="1">
              <Clock className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
              <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                Submitted {fmtDate(detail.submittedDate)} · {detail.daysInQueue}d in queue
              </span>
            </Flex>
            <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
              Amount {fmtCurrency(detail.amount)}
            </span>
          </Flex>
        </Grid>
      </Flex>

      {resolved ? (
        <Card padding="4">
          <Flex align="center" gap="2">
            {resolved.kind === 'approve' ? (
              <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
            ) : (
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
            )}
            <Grid columns={1} gap="0">
              <Heading level={6}>
                Decision recorded: {resolved.kind === 'approve' ? 'Approved' : 'Rejected'}
              </Heading>
              {resolved.note ? (
                <Paragraph color="textSecondary">{resolved.note}</Paragraph>
              ) : null}
            </Grid>
          </Flex>
        </Card>
      ) : null}

      <Grid columns={3} gap="6">
        {/* Left column: overview + decision form */}
        <div style={{ gridColumn: 'span 2' }}>
          <Grid columns={1} gap="6">
            {/* Request overview */}
            <Card padding="6">
              <Grid columns={1} gap="3">
                <Flex align="center" gap="2">
                  <FileText className="w-4 h-4" style={{ color: COLORS.primary }} />
                  <Heading level={5}>Request overview</Heading>
                </Flex>
                <Paragraph color="textSecondary">{detail.details}</Paragraph>
                <Flex gap="6" align="start">
                  <Grid columns={1} gap="0">
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                      Request type
                    </span>
                    <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                      {TYPE_LABEL[detail.type]}
                    </span>
                  </Grid>
                  <Grid columns={1} gap="0">
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Amount</span>
                    <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                      {fmtCurrency(detail.amount)}
                    </span>
                  </Grid>
                  <Grid columns={1} gap="0">
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>SLA</span>
                    <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                      {sla.label}
                    </span>
                  </Grid>
                </Flex>
              </Grid>
            </Card>

            {/* Decision history */}
            <Card padding="6">
              <Grid columns={1} gap="4">
                <Heading level={5}>Decision history</Heading>
                {detail.history.length === 0 ? (
                  <Paragraph color="textMuted">No activity recorded yet.</Paragraph>
                ) : (
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {detail.history.map((h, idx) => (
                      <li
                        key={h.id}
                        style={{
                          display: 'flex',
                          gap: SPACING[3],
                          paddingBottom: SPACING[3],
                          borderBottom:
                            idx < detail.history.length - 1
                              ? `1px solid ${COLORS.borderLight}`
                              : 'none',
                        }}
                      >
                        <div
                          style={{
                            width: SPACING[6],
                            height: SPACING[6],
                            borderRadius: '50%',
                            backgroundColor: COLORS.primaryLight,
                            color: COLORS.primary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: SPACING[2],
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {h.actor.slice(0, 1).toUpperCase()}
                        </div>
                        <Grid columns={1} gap="0">
                          <Flex align="center" gap="2">
                            <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                              {h.actor}
                            </span>
                            <Badge variant="info">{ACTION_LABEL[h.action]}</Badge>
                            <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                              {fmtDate(h.timestamp)}
                            </span>
                          </Flex>
                          <span style={{ fontSize: SPACING[3], color: COLORS.textSecondary }}>
                            {h.note}
                          </span>
                        </Grid>
                      </li>
                    ))}
                  </ol>
                )}
              </Grid>
            </Card>

            {/* Attachments */}
            <Card padding="6">
              <Grid columns={1} gap="3">
                <Flex align="center" gap="2">
                  <Paperclip className="w-4 h-4" style={{ color: COLORS.primary }} />
                  <Heading level={5}>Attachments</Heading>
                </Flex>
                {detail.attachments.length === 0 ? (
                  <Paragraph color="textMuted">No attachments.</Paragraph>
                ) : (
                  <Grid columns={1} gap="2">
                    {detail.attachments.map((att) => (
                      <Flex
                        key={att.id}
                        justify="between"
                        align="center"
                        gap="2"
                      >
                        <Flex align="center" gap="2">
                          <FileText className="w-4 h-4" style={{ color: COLORS.textMuted }} />
                          <span style={{ fontSize: SPACING[3], color: COLORS.text }}>
                            {att.name}
                          </span>
                          <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                            {att.size}
                          </span>
                        </Flex>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </Flex>
                    ))}
                  </Grid>
                )}
              </Grid>
            </Card>
          </Grid>
        </div>

        {/* Right column: requester + related */}
        <div>
          <Grid columns={1} gap="6">
            <Card padding="6">
              <Grid columns={1} gap="3">
                <Flex align="center" gap="2">
                  <User className="w-4 h-4" style={{ color: COLORS.primary }} />
                  <Heading level={5}>Requester</Heading>
                </Flex>
                <Grid columns={1} gap="2">
                  <Flex align="center" gap="2">
                    <div
                      style={{
                        width: SPACING[10],
                        height: SPACING[10],
                        borderRadius: '50%',
                        backgroundColor: COLORS.primaryLight,
                        color: COLORS.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: SPACING[4],
                      }}
                    >
                      {detail.requester.name.slice(0, 1)}
                    </div>
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                        {detail.requester.name}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                        {detail.requester.role}
                      </span>
                    </Grid>
                  </Flex>
                  <div>
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Email</span>
                    <div style={{ fontSize: SPACING[3], color: COLORS.text }}>
                      {detail.requester.email}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Team</span>
                    <div style={{ fontSize: SPACING[3], color: COLORS.text }}>
                      {detail.requester.team}
                    </div>
                  </div>
                </Grid>
              </Grid>
            </Card>

            <Card padding="6">
              <Grid columns={1} gap="3">
                <Flex align="center" gap="2">
                  {detail.related.kind === 'mandate' ? (
                    <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
                  ) : (
                    <Building2 className="w-4 h-4" style={{ color: COLORS.primary }} />
                  )}
                  <Heading level={5}>
                    Related {detail.related.kind === 'mandate' ? 'mandate' : 'opportunity'}
                  </Heading>
                </Flex>
                <Grid columns={1} gap="2">
                  <div>
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Name</span>
                    <div style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                      {detail.related.name}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Client</span>
                    <div style={{ fontSize: SPACING[3], color: COLORS.text }}>
                      {detail.related.client}
                    </div>
                  </div>
                  <Flex gap="6" align="start">
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Stage</span>
                      <span style={{ fontSize: SPACING[3], color: COLORS.text }}>
                        {detail.related.stage}
                      </span>
                    </Grid>
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>Value</span>
                      <span style={{ fontSize: SPACING[3], color: COLORS.text }}>
                        {fmtCurrency(detail.related.value)}
                      </span>
                    </Grid>
                  </Flex>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </div>
      </Grid>

      {/* Decision form */}
      {!resolved ? (
        <Card padding="6">
          <Grid columns={1} gap="3">
            <Heading level={5}>Decision</Heading>
            {decision ? (
              <>
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
                    {decision === 'approve' ? 'Approval notes' : 'Rejection rationale'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      decision === 'approve'
                        ? 'Add context for the approval (optional)…'
                        : 'Explain why this is being rejected…'
                    }
                    rows={4}
                    style={{
                      width: '100%',
                      padding: SPACING[3],
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
                  <Button variant="ghost" onClick={() => setDecision(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant={decision === 'approve' ? 'primary' : 'danger'}
                    onClick={confirm}
                  >
                    <Check className="w-4 h-4" />
                    Confirm {decision === 'approve' ? 'approval' : 'rejection'}
                  </Button>
                </Flex>
              </>
            ) : (
              <Flex gap="2">
                <Button variant="outline" onClick={() => setDecision('reject')}>
                  <X className="w-4 h-4" /> Reject
                </Button>
                <Button onClick={() => setDecision('approve')}>
                  <Check className="w-4 h-4" /> Approve
                </Button>
              </Flex>
            )}
          </Grid>
        </Card>
      ) : null}
    </Grid>
  );
};
