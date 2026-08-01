import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, DollarSign, Target, Briefcase, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SPACING } from '@/styles/tokens';
import { authFetch } from '@/utils/authFetch';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Badge,
  Flex,
  Grid,
  StatCard,
} from '@/components/design-system';

interface ForecastPoint {
  month: string;
  value: number;
}

interface Opportunity {
  id: string;
  title: string;
  client: string;
  stage: string;
  value: number;
}

interface BDDashboardData {
  pipeline_value: number;
  win_rate: number;
  active_deals: number;
  monthly_target: number;
  revenue_forecast?: ForecastPoint[];
  opportunities?: Opportunity[];
}

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const BDDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [data, setData] = useState<BDDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/bd/dashboard');
        const json = await res.json();
        if (!alive) return;
        if (json.success === false) {
          throw new Error(json.error || 'Failed to load dashboard');
        }
        setData((json.data ?? json) as BDDashboardData);
      } catch (e: any) {
        if (alive) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING[20],
        }}
      >
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.primary }} />
        <span style={{ marginLeft: SPACING[3], color: COLORS.textSecondary }}>
          Loading BD dashboard…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card padding="8">
        <Grid columns={1} gap="3">
          <Heading level={4}>Couldn't load the dashboard</Heading>
          <Paragraph color="textSecondary">{error || 'No data available.'}</Paragraph>
          <Flex justify="start" gap="2">
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Flex>
        </Grid>
      </Card>
    );
  }

  const forecast = data.revenue_forecast ?? [];
  const opportunities = data.opportunities ?? [];
  const maxForecast = Math.max(...forecast.map((f) => f.value), 1);

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>BD Dashboard</Heading>
          <Paragraph color="textMuted">
            Pipeline summary, revenue forecast and active opportunities
          </Paragraph>
        </Grid>
        <Badge variant="info">{profile?.organization_id ? 'Org view' : 'Personal view'}</Badge>
      </Flex>

      {/* Stat cards */}
      <Grid columns={4} gap="4">
        <StatCard
          title="Pipeline Value"
          value={currency(data.pipeline_value)}
          icon={<DollarSign className="w-5 h-5" style={{ color: COLORS.primary }} />}
        />
        <StatCard
          title="Win Rate"
          value={`${Math.round(data.win_rate || 0)}%`}
          icon={<Target className="w-5 h-5" style={{ color: COLORS.success }} />}
        />
        <StatCard
          title="Active Deals"
          value={data.active_deals || 0}
          icon={<Briefcase className="w-5 h-5" style={{ color: COLORS.info }} />}
        />
        <StatCard
          title="Monthly Target"
          value={currency(data.monthly_target)}
          icon={<TrendingUp className="w-5 h-5" style={{ color: COLORS.warning }} />}
        />
      </Grid>

      {/* Forecast + opportunities */}
      <Grid columns={2} gap="6">
        <Card padding="6">
          <Grid columns={1} gap="4">
            <Heading level={5}>Revenue Forecast</Heading>
            {forecast.length === 0 ? (
              <Paragraph color="textMuted">No forecast data yet.</Paragraph>
            ) : (
              <Grid columns={1} gap="3">
                {forecast.map((f) => {
                  const pct = Math.round(((f.value || 0) / maxForecast) * 100);
                  return (
                    <div key={f.month}>
                      <Flex justify="between" align="center">
                        <span style={{ fontSize: SPACING[3], color: COLORS.textSecondary }}>
                          {f.month}
                        </span>
                        <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                          {currency(f.value)}
                        </span>
                      </Flex>
                      <div
                        style={{
                          marginTop: SPACING[1],
                          height: SPACING[1],
                          backgroundColor: COLORS.borderLight,
                          borderRadius: 9999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor: COLORS.primary,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Grid>
            )}
          </Grid>
        </Card>

        <Card padding="6">
          <Grid columns={1} gap="4">
            <Flex justify="between" align="center">
              <Heading level={5}>Active Opportunities</Heading>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/bd/opportunities')}>
                View all
              </Button>
            </Flex>
            {opportunities.length === 0 ? (
              <Paragraph color="textMuted">No active opportunities.</Paragraph>
            ) : (
              <Grid columns={1} gap="2">
                {opportunities.slice(0, 6).map((o) => (
                  <Flex key={o.id} justify="between" align="center" gap="2">
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                        {o.title}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        {o.client} · {o.stage}
                      </span>
                    </Grid>
                    <Badge variant="success">{currency(o.value)}</Badge>
                  </Flex>
                ))}
              </Grid>
            )}
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
};
