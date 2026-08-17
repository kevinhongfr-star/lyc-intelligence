/**
 * MileAdminDashboard — Internal admin tool for mile management.
 *
 * Batch 2 / Ticket 7: View user balances, transaction history,
 * manual adjustments, expiry queue, usage analytics.
 *
 * Minimal UI — structure only. Access restricted to admin role.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import {
  type MileBalance,
  type MileTransaction,
  getBalance,
  getTransactionHistory,
  getExpiringPacks,
  getMilePacks,
} from '@/services/mileEngine';
import { INSTRUMENT_MILE_COST, MILE_PACKS, MONTHLY_ALLOCATION } from '@/config/miles';

export function MileAdminDashboard(): React.ReactElement {
  const { profile } = useAuthStore();
  const [searchUserId, setSearchUserId] = useState('');
  const [balance, setBalance] = useState<MileBalance | null>(null);
  const [transactions, setTransactions] = useState<MileTransaction[]>([]);
  const [expiring, setExpiring] = useState<Array<any>>([]);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  // Admin-only guard
  if (profile?.role !== 'admin') {
    return <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>Admin access required.</div>;
  }

  const searchUser = async () => {
    if (!searchUserId.trim()) return;
    const bal = await getBalance(searchUserId.trim());
    setBalance(bal);
    const txns = await getTransactionHistory(searchUserId.trim(), 100);
    setTransactions(txns);
    const exp = await getExpiringPacks(searchUserId.trim(), 60);
    setExpiring(exp);
  };

  const manualAdjust = async () => {
    if (!searchUserId || adjustAmount === 0) return;
    await supabase.from('credit_transactions').insert({
      user_id: searchUserId,
      amount: adjustAmount,
      type: 'admin_adjust',
      balance_type: adjustAmount > 0 ? 'allocated' : 'allocated',
      description: adjustReason || `Admin adjustment (${adjustAmount > 0 ? '+' : ''}${adjustAmount})`,
    });
    // Update balance
    await supabase.rpc('increment_credits_balanced', {
      p_user_id: searchUserId,
      p_amount: adjustAmount,
    });
    // Refresh
    await searchUser();
    setAdjustAmount(0);
    setAdjustReason('');
  };

  // Analytics: aggregate transaction data
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('credit_transactions')
        .select('type, amount, instrument_code, balance_type')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
      if (!data) return;
      const byType: Record<string, number> = {};
      const byInstrument: Record<string, number> = {};
      let totalSpent = 0, totalPurchased = 0;
      for (const t of data) {
        byType[t.type] = (byType[t.type] || 0) + Math.abs(t.amount);
        if (t.instrument_code) byInstrument[t.instrument_code] = (byInstrument[t.instrument_code] || 0) + Math.abs(t.amount);
        if (t.type === 'spend') totalSpent += Math.abs(t.amount);
        if (t.type === 'purchase') totalPurchased += Math.abs(t.amount);
      }
      setAnalytics({ byType, byInstrument, totalSpent, totalPurchased, count: data.length });
    })();
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'DejaVu Serif', serif", fontSize: 28, marginBottom: 24 }}>Mile Engine Admin</h1>

      {/* User search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="User ID"
          value={searchUserId}
          onChange={(e) => setSearchUserId(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', fontSize: 14, border: '1px solid #E5E5E5' }}
        />
        <button onClick={searchUser} style={{ padding: '10px 24px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          Search
        </button>
      </div>

      {balance && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="Allocated" value={balance.allocated_miles} />
          <StatCard label="Rollover" value={balance.rollover_miles} />
          <StatCard label="Purchased" value={balance.purchased_miles} />
          <StatCard label="Total" value={balance.total} highlight />
        </div>
      )}

      {/* Manual adjustment */}
      {balance && (
        <div style={{ background: '#F9F9F9', padding: 16, marginBottom: 24, border: '1px solid #E5E5E5' }}>
          <h3 style={{ fontSize: 14, margin: '0 0 12px' }}>Manual Adjustment</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(Number(e.target.value))}
              placeholder="Amount (+/-)" style={{ width: 120, padding: '8px 12px', fontSize: 14, border: '1px solid #E5E5E5' }} />
            <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Reason" style={{ flex: 1, padding: '8px 12px', fontSize: 14, border: '1px solid #E5E5E5' }} />
            <button onClick={manualAdjust} style={{ padding: '8px 20px', background: '#C108AB', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Transaction History ({transactions.length})</h3>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E5E5', textAlign: 'left' }}>
                <th style={th}>Date</th><th style={th}>Type</th><th style={th}>Amount</th>
                <th style={th}>Balance</th><th style={th}>Instrument</th><th style={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 20).map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <td style={td}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                  <td style={td}>{t.type}</td>
                  <td style={{ ...td, color: (t.amount || 0) < 0 ? '#C00' : '#2D7A3E', fontWeight: 600 }}>{t.amount}</td>
                  <td style={td}>{(t as any).balance_type || '—'}</td>
                  <td style={td}>{t.instrument_code || '—'}</td>
                  <td style={td}>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expiry queue */}
      {expiring.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Expiring Packs ({expiring.length})</h3>
          {expiring.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid #F0F0F0', fontSize: 13 }}>
              <span>{p.pack_id}</span>
              <span>{p.remaining} miles remaining</span>
              <span style={{ color: '#C00' }}>Expires: {new Date(p.expires_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Analytics */}
      {analytics && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Usage Analytics (30 days)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <StatCard label="Total Miles Spent" value={analytics.totalSpent} />
            <StatCard label="Total Miles Purchased" value={analytics.totalPurchased} />
            <StatCard label="Transactions" value={analytics.count} />
          </div>
          {analytics.byInstrument && Object.keys(analytics.byInstrument).length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, marginBottom: 8 }}>By Instrument</h4>
              {Object.entries(analytics.byInstrument).map(([code, miles]) => (
                <div key={code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span>{code}</span>
                  <span>{miles} miles</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Config reference */}
      <div style={{ background: '#F9F9F9', padding: 16, border: '1px solid #E5E5E5' }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Instrument Costs</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 13 }}>
          {Object.entries(INSTRUMENT_MILE_COST).map(([code, cost]) => (
            <div key={code} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#fff', border: '1px solid #F0F0F0' }}>
              <span>{code}</span>
              <span style={{ fontWeight: 600 }}>{cost} mi</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999' };
const td: React.CSSProperties = { padding: '8px 12px', fontSize: 13 };

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{
      padding: 16, background: highlight ? '#C108AB0D' : '#fff',
      border: `1px solid ${highlight ? '#C108AB33' : '#E5E5E5'}`,
    }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</div>
    </div>
  );
}

export default MileAdminDashboard;
