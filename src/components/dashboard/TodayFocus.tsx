import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Zap } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import { authFetch } from '@/utils/authFetch';
import {
  Card,
  Heading,
  Paragraph,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

type Priority = 'high' | 'medium' | 'low';

interface FocusItem {
  id: string;
  title: string;
  due?: string;
  priority: Priority;
  mandate?: string;
}

const PRIORITY_BADGE: Record<Priority, { variant: 'error' | 'warning' | 'info'; label: string }> = {
  high: { variant: 'error', label: 'High' },
  medium: { variant: 'warning', label: 'Medium' },
  low: { variant: 'info', label: 'Low' },
};

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const normalizePriority = (raw: unknown): Priority => {
  const value = String(raw ?? 'medium').toLowerCase();
  return value === 'high' || value === 'low' ? value : 'medium';
};

export const TodayFocus: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/tasks?filter=today&status=pending');
        const json = await res.json();
        if (!alive) return;

        const rawList: any[] = json.items ?? json.tasks ?? json ?? [];
        const list: FocusItem[] = rawList.map((raw: any) => ({
          id: String(raw.id ?? raw.task_id ?? Math.random()),
          title: raw.title ?? raw.name ?? 'Untitled task',
          due: raw.due_date ?? raw.due ?? raw.due_at,
          priority: normalizePriority(raw.priority),
          mandate: raw.mandate ?? raw.mandate_name,
        }));
        list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
        setItems(list);
      } catch (e: any) {
        if (alive) setError(e.message || 'Failed to load tasks');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card padding="6">
      <Grid columns={1} gap="4">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Zap className="w-4 h-4" style={{ color: COLORS.primary }} />
            <Heading level={5}>Today's Focus</Heading>
          </Flex>
          {items.length > 0 && <Badge>{items.length} items</Badge>}
        </Flex>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING[3],
              padding: `${SPACING[4]}px 0`,
            }}
          >
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: COLORS.primary }} />
            <span style={{ fontSize: SPACING[3], color: COLORS.textSecondary }}>
              Loading today's priorities…
            </span>
          </div>
        ) : error ? (
          <Paragraph color="textSecondary">{error}</Paragraph>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: `${SPACING[6]}px 0` }}>
            <CheckCircle2
              className="w-6 h-6"
              style={{ color: COLORS.success, margin: '0 auto' }}
            />
            <Paragraph color="textMuted">
              You're all caught up — no pending tasks for today.
            </Paragraph>
          </div>
        ) : (
          <Grid columns={1} gap="2">
            {items.map((item) => {
              const badge = PRIORITY_BADGE[item.priority];
              return (
                <button
                  key={item.id}
                  onClick={() => navigate('/app/dashboard')}
                  style={{
                    textAlign: 'left',
                    padding: `${SPACING[3]}px ${SPACING[4]}px`,
                    borderRadius: 8,
                    border: `1px solid ${COLORS.borderLight}`,
                    backgroundColor: COLORS.bgAlt,
                    cursor: 'pointer',
                  }}
                >
                  <Flex justify="between" align="center" gap="2">
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        {item.mandate ?? 'Task'}
                        {item.due ? ` · due ${item.due}` : ''}
                      </span>
                    </Grid>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </Flex>
                </button>
              );
            })}
          </Grid>
        )}
      </Grid>
    </Card>
  );
};
