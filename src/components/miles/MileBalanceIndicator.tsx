/**
 * MileBalanceIndicator — Shows user's current mile balance.
 *
 * Batch 2 / Ticket 1: Minimal UI. "5 miles remaining" — plain text.
 */
import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getBalance } from '@/services/mileEngine';
import { useEffect, useState } from 'react';

export function MileBalanceIndicator(): React.ReactElement {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const b = await getBalance(user.id);
      if (!cancelled) setBalance(b?.total ?? 0);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (balance === null) {
    return <span style={{ fontSize: 13, color: '#999' }}>—</span>;
  }

  return (
    <span style={{
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "'IBM Plex Mono', monospace",
      color: balance > 0 ? '#333' : '#999',
    }}>
      {balance} {balance === 1 ? 'mile' : 'miles'}
    </span>
  );
}

export default MileBalanceIndicator;
