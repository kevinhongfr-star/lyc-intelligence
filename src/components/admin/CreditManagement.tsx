'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Heading, Button, Badge, Input, Grid, Flex } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  Loader2,
  AlertCircle,
  Plus,
  Coins,
  TrendingDown,
  Clock,
  DollarSign,
} from 'lucide-react';

type TransactionType = 'Grant' | 'Purchase' | 'Use' | 'Expire';
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface CreditTransaction {
  id: string;
  user: string;
  userEmail?: string;
  amount: number;
  type: TransactionType;
  date: string;
  balance?: number;
}

interface CreditOverview {
  totalIssued: number;
  totalUsed: number;
  totalExpired: number;
  revenue: number;
  transactions: CreditTransaction[];
}

const EMPTY_OVERVIEW: CreditOverview = {
  totalIssued: 0,
  totalUsed: 0,
  totalExpired: 0,
  revenue: 0,
  transactions: [],
};

function normalizeType(raw: string): TransactionType {
  const t = String(raw || '').toLowerCase();
  if (t.includes('grant')) return 'Grant';
  if (t.includes('purchas') || t.includes('buy') || t.includes('earn')) return 'Purchase';
  if (t.includes('use') || t.includes('spend') || t.includes('debit')) return 'Use';
  if (t.includes('expire')) return 'Expire';
  return 'Grant';
}

function getTypeBadgeVariant(type: TransactionType): BadgeVariant {
  switch (type) {
    case 'Grant':
      return 'success';
    case 'Purchase':
      return 'info';
    case 'Use':
      return 'warning';
    case 'Expire':
      return 'error';
    default:
      return 'default';
  }
}

function extractOverview(payload: any): CreditOverview {
  if (!payload) return EMPTY_OVERVIEW;
  if (payload.success === false) return EMPTY_OVERVIEW;

  const data = payload.data || payload;
  const overview = data.creditOverview || data.credits || data.credit || {};
  const txRaw = data.transactions || data.creditTransactions || data.credit_transactions || overview.transactions || [];

  const transactions: CreditTransaction[] = Array.isArray(txRaw)
    ? txRaw.map((t: any, idx: number) => ({
        id: t.id || `tx-${idx}`,
        user: t.user || t.full_name || t.userName || 'Unknown',
        userEmail: t.userEmail || t.email,
        amount: Number(t.amount ?? 0),
        type: normalizeType(t.type || t.transaction_type),
        date: t.date || t.created_at || new Date().toISOString(),
        balance: typeof t.balance === 'number' ? t.balance : undefined,
      }))
    : [];

  return {
    totalIssued: Number(data.totalIssued ?? overview.totalIssued ?? overview.issued ?? 0),
    totalUsed: Number(data.totalUsed ?? overview.totalUsed ?? overview.used ?? 0),
    totalExpired: Number(data.totalExpired ?? overview.totalExpired ?? overview.expired ?? 0),
    revenue: Number(data.revenue ?? overview.revenue ?? data.monthlyRevenue ?? 0),
    transactions,
  };
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString();
}

function formatDate(value: string): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export const CreditManagement: React.FC = () => {
  const { profile } = useAuthStore();
  const [overview, setOverview] = useState<CreditOverview>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGrantForm, setShowGrantForm] = useState(false);
  const [grantForm, setGrantForm] = useState({ email: '', amount: '', reason: '' });
  const [granting, setGranting] = useState(false);
  const [grantMessage, setGrantMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = profile?.role === 'admin';

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const json = await res.json();
      setOverview(extractOverview(json));
    } catch (e: any) {
      setError(e?.message || 'Failed to load credit overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const resetGrantForm = () => {
    setGrantForm({ email: '', amount: '', reason: '' });
    setShowGrantForm(false);
  };

  const handleGrantSubmit = async () => {
    const amount = Number(grantForm.amount);
    const email = grantForm.email.trim();
    if (!email || !Number.isFinite(amount) || amount <= 0) {
      setGrantMessage({ type: 'error', text: 'Please enter a valid user email and a positive credit amount.' });
      return;
    }
    setGranting(true);
    setGrantMessage(null);
    try {
      const res = await fetch('/api/admin/credits/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, reason: grantForm.reason.trim() }),
      });
      if (!res.ok) throw new Error(`Grant failed (status ${res.status})`);

      const tx: CreditTransaction = {
        id: `tx-local-${Date.now()}`,
        user: email.split('@')[0],
        userEmail: email,
        amount,
        type: 'Grant',
        date: new Date().toISOString(),
      };
      setOverview((prev) => ({
        ...prev,
        totalIssued: prev.totalIssued + amount,
        transactions: [tx, ...prev.transactions],
      }));
      setGrantMessage({ type: 'success', text: `Granted ${formatNumber(amount)} credits to ${email}.` });
      resetGrantForm();
    } catch (e: any) {
      setGrantMessage({ type: 'error', text: e?.message || 'Failed to grant credits.' });
    } finally {
      setGranting(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card padding="8">
        <Flex direction="column" align="center" gap="4">
          <AlertCircle size={SPACING[10]} color={COLORS.warning} />
          <Heading level={3}>Admin access required</Heading>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', maxWidth: 480 }}>
            You must be signed in as an administrator to manage credits.
          </p>
        </Flex>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card padding="8">
        <Flex align="center" gap="3" justify="center">
          <Loader2 size={SPACING[6]} color={COLORS.primary} className="animate-spin" />
          <span style={{ color: COLORS.textMuted }}>Loading credit overview...</span>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="8">
        <Flex direction="column" align="center" gap="4">
          <AlertCircle size={SPACING[10]} color={COLORS.error} />
          <Heading level={3}>Failed to load credit data</Heading>
          <p style={{ color: COLORS.textMuted, textAlign: 'center' }}>{error}</p>
          <Button variant="outline" onClick={fetchOverview}>Retry</Button>
        </Flex>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[5] }}>
      <Flex justify="between" align="center" gap="4" className="flex-wrap">
        <Heading level={2}>Credit Management</Heading>
        <Button variant="primary" onClick={() => setShowGrantForm((v) => !v)}>
          <Plus size={SPACING[4]} /> Grant Credits
        </Button>
      </Flex>

      {grantMessage && (
        <div
          style={{
            padding: `${SPACING[3]}px ${SPACING[4]}px`,
            borderRadius: SPACING[2],
            backgroundColor: grantMessage.type === 'success' ? COLORS.successLight : COLORS.errorLight,
            color: grantMessage.type === 'success' ? COLORS.successDark : COLORS.errorDark,
            fontSize: SPACING[3],
          }}
        >
          {grantMessage.text}
        </div>
      )}

      {showGrantForm && (
        <Card padding="6">
          <Flex direction="column" gap="4">
            <Heading level={4}>Grant Credits</Heading>
            <Grid columns={2} gap="4">
              <Input
                type="email"
                label="User Email"
                value={grantForm.email}
                onChange={(e) => setGrantForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@example.com"
              />
              <Input
                type="number"
                label="Amount"
                value={grantForm.amount}
                onChange={(e) => setGrantForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="e.g. 100"
              />
            </Grid>
            <Input
              type="text"
              label="Reason"
              value={grantForm.reason}
              onChange={(e) => setGrantForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Reason for granting credits (optional)"
            />
            <Flex gap="3" justify="end" className="flex-wrap">
              <Button variant="ghost" onClick={resetGrantForm} disabled={granting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGrantSubmit} disabled={granting}>
                {granting ? 'Granting...' : 'Grant Credits'}
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}

      <Grid columns={4} gap="4">
        <StatTile
          label="Total Credits Issued"
          value={formatNumber(overview.totalIssued)}
          icon={<Coins size={SPACING[5]} />}
          color={COLORS.info}
        />
        <StatTile
          label="Credits Used"
          value={formatNumber(overview.totalUsed)}
          icon={<TrendingDown size={SPACING[5]} />}
          color={COLORS.warning}
        />
        <StatTile
          label="Credits Expired"
          value={formatNumber(overview.totalExpired)}
          icon={<Clock size={SPACING[5]} />}
          color={COLORS.error}
        />
        <StatTile
          label="Revenue from Credits"
          value={formatCurrency(overview.revenue)}
          icon={<DollarSign size={SPACING[5]} />}
          color={COLORS.success}
        />
      </Grid>

      <Card padding="0">
        <div style={{ padding: `${SPACING[4]}px ${SPACING[5]}px`, borderBottom: `1px solid ${COLORS.border}` }}>
          <Heading level={4}>Transaction Log</Heading>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: COLORS.bg }}>
                <Th>User</Th>
                <Th>Amount</Th>
                <Th>Type</Th>
                <Th>Date</Th>
                <Th>Balance</Th>
              </tr>
            </thead>
            <tbody>
              {overview.transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <Td>
                    <div style={{ fontWeight: 600, color: COLORS.text }}>{tx.user}</div>
                    {tx.userEmail && (
                      <div style={{ fontSize: SPACING[3], color: COLORS.textMuted }}>{tx.userEmail}</div>
                    )}
                  </Td>
                  <Td>
                    <span style={{ color: tx.amount >= 0 ? COLORS.success : COLORS.error, fontWeight: 600 }}>
                      {tx.amount >= 0 ? '+' : ''}{formatNumber(tx.amount)}
                    </span>
                  </Td>
                  <Td><Badge variant={getTypeBadgeVariant(tx.type)}>{tx.type}</Badge></Td>
                  <Td><span style={{ color: COLORS.textSecondary }}>{formatDate(tx.date)}</span></Td>
                  <Td><span style={{ color: COLORS.text }}>{tx.balance ?? '—'}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {overview.transactions.length === 0 && (
            <div style={{ padding: SPACING[8], textAlign: 'center', color: COLORS.textMuted }}>
              No credit transactions recorded.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const StatTile: React.FC<{ label: string; value: string; icon?: React.ReactNode; color?: string }> = ({
  label,
  value,
  icon,
  color,
}) => (
  <Card padding="5">
    <Flex justify="between" align="center" gap="3">
      <div>
        <div
          style={{
            fontSize: SPACING[3],
            color: COLORS.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: SPACING[2],
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: SPACING[8], fontWeight: 700, color: COLORS.text, lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
      {icon && (
        <div
          style={{
            width: SPACING[10],
            height: SPACING[10],
            borderRadius: SPACING[3],
            backgroundColor: COLORS.primaryLight,
            color: color || COLORS.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
    </Flex>
  </Card>
);

const Th: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th
    style={{
      textAlign: 'left',
      padding: `${SPACING[3]}px ${SPACING[4]}px`,
      fontSize: SPACING[3],
      fontWeight: 600,
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: `1px solid ${COLORS.border}`,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </th>
);

const Td: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <td
    style={{
      padding: `${SPACING[3]}px ${SPACING[4]}px`,
      fontSize: SPACING[3],
      color: COLORS.text,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </td>
);

export default CreditManagement;
