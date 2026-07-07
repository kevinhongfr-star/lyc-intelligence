import { ConsultantLeaderboard } from '@/components/internal/ConsultantLeaderboard';
import { PipelineFunnelChart } from '@/components/internal/PipelineFunnelChart';
import { TimeToFillAnalysis } from '@/components/internal/TimeToFillAnalysis';
import { QualityOfHireMetrics } from '@/components/internal/QualityOfHireMetrics';
import { RevenueAttribution } from '@/components/internal/RevenueAttribution';

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">ANALYTICS</h1>

      <ConsultantLeaderboard />
      <PipelineFunnelChart />
      <TimeToFillAnalysis />
      <QualityOfHireMetrics />
      <RevenueAttribution />
    </div>
  );
}
