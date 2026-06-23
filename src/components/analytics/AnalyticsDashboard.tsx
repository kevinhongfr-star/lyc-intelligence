// Phase 6.2: Analytics Dashboard - Main Dashboard with Tabs
// Routes through existing data/[[...path]] + dashboard.ts

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BarChart3,
  Clock,
  Award,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useOrganization, useUser } from '@/hooks';
import {
  getAnalyticsDashboard,
  getDateRange,
  type DateRange,
  type FunnelAnalytics,
  type TimeToFillAnalytics,
  type QualityOfHireMetrics,
  type ConsultantPerformance,
} from '@/services/analytics/AnalyticsService';
import { FunnelChart } from './FunnelChart';
import { TimeToFillChart } from './TimeToFillChart';
import { QualityOfHireChart } from './QualityOfHireChart';
import { ConsultantLeaderboard } from './ConsultantLeaderboard';
import { Badge } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

type DatePreset = '30d' | '90d' | '1y' | 'all';
type TabId = 'funnel' | 'time-to-fill' | 'quality' | 'consultants';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'funnel', label: 'Funnel Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'time-to-fill', label: 'Time to Fill', icon: <Clock className="w-4 h-4" /> },
  { id: 'quality', label: 'Quality of Hire', icon: <Award className="w-4 h-4" /> },
  { id: 'consultants', label: 'Consultant Performance', icon: <Users className="w-4 h-4" /> },
];

export function AnalyticsDashboard() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const { organization } = useOrganization();

  const [activeTab, setActiveTab] = useState<TabId>('funnel');
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRange('30d'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics data
  const [funnelData, setFunnelData] = useState<FunnelAnalytics | null>(null);
  const [timeToFillData, setTimeToFillData] = useState<TimeToFillAnalytics | null>(null);
  const [qualityData, setQualityData] = useState<QualityOfHireMetrics | null>(null);
  const [consultantData, setConsultantData] = useState<ConsultantPerformance[]>([]);

  // Date preset handler
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    setDateRange(getDateRange(preset));
  };

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      if (!organization?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/data/analytics?orgId=${organization.id}&start=${dateRange.start}&end=${dateRange.end}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();

        setFunnelData(data.funnel);
        setTimeToFillData(data.timeToFill);
        setQualityData(data.qualityOfHire);
        setConsultantData(data.consultantPerformance || []);
      } catch (err) {
        console.error('[AnalyticsDashboard] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [organization?.id, dateRange]);

  // Refresh handler
  const handleRefresh = () => {
    if (!organization?.id) return;
    const range = getDateRange(datePreset);
    setDateRange({ ...range });
  };

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-text-muted">Loading analytics...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-text-primary font-medium">Error loading analytics</p>
            <p className="text-text-muted text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'funnel':
        return funnelData ? (
          <div className="space-y-6">
            <FunnelChart analytics={funnelData} />
            {funnelData.bottleneck && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Bottleneck Detected</p>
                      <p className="text-sm text-red-600">
                        Stage "{funnelData.bottleneck.label}" has the lowest conversion rate ({funnelData.bottleneck.conversionRate}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null;

      case 'time-to-fill':
        return timeToFillData ? (
          <TimeToFillChart analytics={timeToFillData} />
        ) : null;

      case 'quality':
        return qualityData ? (
          <QualityOfHireChart metrics={qualityData} />
        ) : null;

      case 'consultants':
        return consultantData.length > 0 ? (
          <ConsultantLeaderboard consultants={consultantData} />
        ) : (
          <div className="text-center py-12 text-text-muted">
            No consultant performance data available
          </div>
        );

      default:
        return null;
    }
  };

  // Summary stats for the header
  const summaryStats = useMemo(() => {
    return {
      totalCandidates: funnelData?.totalCandidates || 0,
      totalPlaced: funnelData?.totalPlaced || 0,
      avgTimeToFill: timeToFillData?.overallAvgDays || 0,
      probationPassRate: qualityData?.probationPassRate || 0,
    };
  }, [funnelData, timeToFillData, qualityData]);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <div className="bg-card border-b border-card-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Analytics Dashboard</h1>
              <p className="text-sm text-text-muted">
                Pipeline performance, time-to-fill, and consultant metrics
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Date Range Selector */}
              <div className="flex items-center gap-2 bg-bg-alt rounded-lg p-1">
                {(['30d', '90d', '1y', 'all'] as DatePreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleDatePresetChange(preset)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      datePreset === preset
                        ? 'bg-primary text-white'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {preset === '30d' ? '30 Days' : preset === '90d' ? '90 Days' : preset === '1y' ? '1 Year' : 'All Time'}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg border border-card-border hover:bg-bg-alt transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-text-muted ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-bg-alt rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-text-muted">Total Candidates</span>
              </div>
              <p className="text-xl font-bold text-text-primary mt-1">{summaryStats.totalCandidates}</p>
            </div>
            <div className="bg-bg-alt rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-sm text-text-muted">Total Placed</span>
              </div>
              <p className="text-xl font-bold text-text-primary mt-1">{summaryStats.totalPlaced}</p>
            </div>
            <div className="bg-bg-alt rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-text-muted">Avg Time to Fill</span>
              </div>
              <p className="text-xl font-bold text-text-primary mt-1">
                {summaryStats.avgTimeToFill > 0 ? `${summaryStats.avgTimeToFill} days` : 'N/A'}
              </p>
            </div>
            <div className="bg-bg-alt rounded-lg p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-text-muted">Probation Pass Rate</span>
              </div>
              <p className="text-xl font-bold text-text-primary mt-1">{summaryStats.probationPassRate}%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
