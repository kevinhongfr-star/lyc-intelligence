'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Target,
  Bell,
  Users,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileBarChart,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
  Shield,
  Settings,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  DollarSign,
  Building2,
  MapPin,
  Award,
} from 'lucide-react';

const REPORT_TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  quarterly_landscape: { label: 'Quarterly Landscape', color: 'bg-purple-100 text-purple-700', icon: BarChart3 },
  comp_snapshot: { label: 'Comp Snapshot', color: 'bg-green-100 text-green-700', icon: DollarSign },
  talent_radar: { label: 'Talent Radar', color: 'bg-blue-100 text-blue-700', icon: Target },
  market_alert: { label: 'Market Alert', color: 'bg-amber-100 text-amber-700', icon: Bell },
  pre_mandate_assessment: { label: 'Pre-Mandate Assessment', color: 'bg-indigo-100 text-indigo-700', icon: FileBarChart },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  generating: { label: 'Generating', color: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  delivered: { label: 'Delivered', color: 'bg-purple-100 text-purple-700' },
  archived: { label: 'Archived', color: 'bg-gray-50 text-gray-500' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-red-600 bg-red-50',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-700 bg-red-100',
  high: 'text-orange-700 bg-orange-100',
  medium: 'text-amber-700 bg-amber-100',
  low: 'text-gray-700 bg-gray-100',
};

const TIER_COLORS: Record<string, string> = {
  premium: 'text-purple-700 bg-purple-100',
  standard: 'text-blue-700 bg-blue-100',
  basic: 'text-gray-700 bg-gray-100',
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  layoff: 'Layoff',
  restructuring: 'Restructuring',
  merger: 'Merger',
  comp_shift: 'Comp Shift',
  talent_movement: 'Talent Movement',
  regulation_change: 'Regulation Change',
  market_expansion: 'Market Expansion',
  market_contraction: 'Market Contraction',
  leadership_change: 'Leadership Change',
  company_expansion: 'Company Expansion',
};

function IntelligenceHub() {
  const [activeTab, setActiveTab] = useState<'reports' | 'radar' | 'signals' | 'subscriptions' | 'oversight'>('reports');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [oversight, setOversight] = useState<any>(null);
  const [radarProfiles, setRadarProfiles] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const res = await fetch('/api/intelligence/reports?status=under_review');
        const data = await res.json();
        if (data.success) setReports(data.reports || []);
      }
      if (activeTab === 'signals') {
        const res = await fetch('/api/intelligence/signals');
        const data = await res.json();
        if (data.success) setSignals(data.signals || []);
      }
      if (activeTab === 'subscriptions') {
        const res = await fetch('/api/intelligence/subscriptions');
        const data = await res.json();
        if (data.success) setSubscriptions(data.subscriptions || []);
      }
      if (activeTab === 'oversight') {
        const res = await fetch('/api/intelligence/oversight');
        const data = await res.json();
        if (data.success) setOversight(data);
      }
      if (activeTab === 'radar') {
        setRadarProfiles([]);
      }
    } catch (e) {
      console.error('Failed to load intelligence data:', e);
    } finally {
      setLoading(false);
    }
  };

  const openReportDetail = async (report: any) => {
    try {
      const res = await fetch(`/api/intelligence/reports/${report.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedReport(data.report);
        setShowReportDetail(true);
      }
    } catch (e) {
      console.error('Failed to load report:', e);
    }
  };

  const handleReview = async (action: string) => {
    setReviewAction(action);
    try {
      const res = await fetch('/api/intelligence/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: selectedReport.id, action, notes: reviewNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setShowReportDetail(false);
        setReviewNotes('');
        loadTabData();
      }
    } catch (e) {
      console.error('Review action failed:', e);
    } finally {
      setReviewAction(null);
    }
  };

  const pendingReviews = reports.filter(r => r.status === 'under_review').length;

  const tabs = [
    { key: 'reports', label: 'Reports', icon: FileBarChart, badge: pendingReviews > 0 ? pendingReviews : null },
    { key: 'radar', label: 'Talent Radar', icon: Target, badge: null },
    { key: 'signals', label: 'Market Signals', icon: Bell, badge: null },
    { key: 'subscriptions', label: 'Subscriptions', icon: Settings, badge: null },
    { key: 'oversight', label: 'Oversight', icon: Activity, badge: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Intelligence Hub</h1>
          <p className="text-text-muted mt-1">Client intelligence reports, market signals, and talent radar</p>
        </div>
        <button
          onClick={loadTabData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-none hover:bg-bg-alt"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-alt rounded-none w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm rounded-none flex items-center gap-2 transition-colors ${
              activeTab === tab.key
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && (
              <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                className="px-3 py-1.5 text-sm border border-border rounded-none bg-card focus:outline-none"
                onChange={e => {
                  const status = e.target.value;
                  if (status === 'all') {
                    fetch('/api/intelligence/reports').then(r => r.json()).then(d => d.success && setReports(d.reports || []));
                  } else {
                    fetch(`/api/intelligence/reports?status=${status}`).then(r => r.json()).then(d => d.success && setReports(d.reports || []));
                  }
                }}
              >
                <option value="under_review">Under Review</option>
                <option value="all">All Reports</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-card border border-border rounded-none p-12 text-center">
              <FileBarChart className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted">No reports found</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-alt">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Confidence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((report: any) => {
                      const typeInfo = REPORT_TYPE_LABELS[report.report_type] || REPORT_TYPE_LABELS.quarterly_landscape;
                      const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.draft;
                      const TypeIcon = typeInfo.icon;
                      return (
                        <tr key={report.id} className="hover:bg-bg-alt/30">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-text-primary">{report.title}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full ${typeInfo.color}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-primary">
                            {report.clients?.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${CONFIDENCE_COLORS[report.overall_confidence] || ''}`}>
                              {report.overall_confidence || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-muted">
                            {new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openReportDetail(report)}
                              className="text-sm text-primary hover:underline flex items-center gap-1 ml-auto"
                            >
                              View <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Talent Radar Tab */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-none p-5">
            <h3 className="font-semibold text-text-primary mb-3">Talent Radar</h3>
            <p className="text-sm text-text-muted mb-4">
              Anonymized view of top talent in the market. Select a client and parameters to generate a radar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Industries</label>
                <input
                  type="text"
                  placeholder="e.g., Technology, Healthcare"
                  className="w-full px-3 py-2 text-sm border border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Functions</label>
                <input
                  type="text"
                  placeholder="e.g., Operations, Finance"
                  className="w-full px-3 py-2 text-sm border border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Count</label>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-none focus:outline-none">
                  <option>10 profiles</option>
                  <option>20 profiles</option>
                  <option>50 profiles</option>
                </select>
              </div>
            </div>
            <p className="text-sm text-text-muted italic">
              <Shield className="w-4 h-4 inline mr-1" />
              All profiles are fully anonymized — no names, no specific companies.
            </p>
          </div>

          <div className="bg-card border border-border rounded-none p-8 text-center">
            <Target className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-text-muted mb-3">Select parameters and generate a Talent Radar</p>
            <button className="px-4 py-2 text-sm bg-primary text-white rounded-none hover:opacity-90 flex items-center gap-2 mx-auto">
              <Sparkles className="w-4 h-4" />
              Generate Radar
            </button>
          </div>
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">{signals.length} signals</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-none hover:opacity-90">
              <Plus className="w-4 h-4" />
              Log Signal
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : signals.length === 0 ? (
            <div className="bg-card border border-border rounded-none p-12 text-center">
              <Bell className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted">No market signals detected</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.slice(0, 20).map((signal: any) => (
                <div key={signal.id} className="bg-card border border-border rounded-none p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-none ${
                        signal.severity === 'critical' ? 'bg-red-50' :
                        signal.severity === 'high' ? 'bg-orange-50' :
                        signal.severity === 'medium' ? 'bg-amber-50' : 'bg-gray-50'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          signal.severity === 'critical' ? 'text-red-500' :
                          signal.severity === 'high' ? 'text-orange-500' :
                          signal.severity === 'medium' ? 'text-amber-500' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{signal.title}</h4>
                        <p className="text-sm text-text-muted mt-1">{signal.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${SEVERITY_COLORS[signal.severity] || ''}`}>
                            {signal.severity}
                          </span>
                          <span className="text-xs text-text-muted capitalize">{signal.source}</span>
                          <span className="text-xs text-text-muted">
                            {new Date(signal.detected_at).toLocaleDateString()}
                          </span>
                        </div>
                        {(signal.affected_industries || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {signal.affected_industries.slice(0, 3).map((ind: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 text-xs bg-bg-alt text-text-muted rounded">
                                {ind}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">
                      {SIGNAL_TYPE_LABELS[signal.signal_type] || signal.signal_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{subscriptions.length} subscriptions</span>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-none hover:opacity-90">
              <Plus className="w-4 h-4" />
              New Subscription
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="bg-card border border-border rounded-none p-12 text-center">
              <Settings className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-text-muted">No client subscriptions configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="bg-card border border-border rounded-none p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-text-primary capitalize">
                        {sub.subscription_type.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-text-muted">Client ID: {sub.client_id?.slice(0, 8)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${TIER_COLORS[sub.tier] || ''}`}>
                        {sub.tier}
                      </span>
                      {sub.is_active ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">Inactive</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {(sub.industry_sectors || []).length > 0 && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                        <span className="text-text-muted">
                          Industries: {sub.industry_sectors.join(', ')}
                        </span>
                      </div>
                    )}
                    {(sub.geographies || []).length > 0 && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                        <span className="text-text-muted">
                          Geographies: {sub.geographies.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Oversight Tab */}
      {activeTab === 'oversight' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-none border border-border bg-card">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                <FileBarChart className="w-4 h-4" />
                Reports This Month
              </div>
              <p className="text-2xl font-bold text-text-primary">{oversight?.reports_this_month?.generated || 0}</p>
              <p className="text-xs text-text-muted mt-1">
                {oversight?.reports_this_month?.delivered || 0} delivered · {oversight?.reports_this_month?.pending_review || 0} pending
              </p>
            </div>
            <div className="p-5 rounded-none border border-border bg-card">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                <Bell className="w-4 h-4" />
                Signals This Month
              </div>
              <p className="text-2xl font-bold text-text-primary">{oversight?.signals_this_month || 0}</p>
              <p className="text-xs text-text-muted mt-1">Market events detected</p>
            </div>
            <div className="p-5 rounded-none border border-border bg-card">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                <Users className="w-4 h-4" />
                Intelligence Queries
              </div>
              <p className="text-2xl font-bold text-text-primary">{oversight?.queries_this_month || 0}</p>
              <p className="text-xs text-text-muted mt-1">Client queries handled</p>
            </div>
            <div className="p-5 rounded-none border border-border bg-card">
              <div className="flex items-center gap-2 text-text-muted text-sm mb-2">
                <Clock className="w-4 h-4" />
                Avg Review Time
              </div>
              <p className="text-2xl font-bold text-text-primary">{oversight?.review_metrics?.avg_review_time_hours || 0}h</p>
              <p className="text-xs text-text-muted mt-1">
                {oversight?.review_metrics?.edit_rate || 0}% edit rate
              </p>
            </div>
          </div>

          {/* Subscriptions by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-none p-5">
              <h3 className="font-semibold text-text-primary mb-4">Subscriptions by Type</h3>
              <div className="space-y-4">
                {Object.entries(oversight?.subscriptions || {}).map(([type, data]: [string, any]) => (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary capitalize">{type.replace(/_/g, ' ')}</span>
                      <span className="text-text-muted">{data.total} total</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(data.premium / (data.total || 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-text-muted">
                      <span>Premium: {data.premium}</span>
                      <span>Standard: {data.standard}</span>
                      <span>Basic: {data.basic}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(oversight?.subscriptions || {}).length === 0 && (
                  <p className="text-sm text-text-muted">No subscriptions yet</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-none p-5">
              <h3 className="font-semibold text-text-primary mb-4">Report Funnel</h3>
              <div className="space-y-3">
                {[
                  { label: 'Generated', value: oversight?.reports_this_month?.generated || 0, color: 'bg-blue-500' },
                  { label: 'Under Review', value: oversight?.reports_this_month?.pending_review || 0, color: 'bg-amber-500' },
                  { label: 'Delivered', value: oversight?.reports_this_month?.delivered || 0, color: 'bg-green-500' },
                  { label: 'Opened', value: oversight?.reports_this_month?.opened || 0, color: 'bg-purple-500' },
                ].map((item, i) => {
                  const total = oversight?.reports_this_month?.generated || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-primary">{item.label}</span>
                        <span className="font-medium text-text-primary">{item.value}</span>
                      </div>
                      <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-none w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{selectedReport.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_LABELS[selectedReport.status]?.color || ''}`}>
                    {STATUS_LABELS[selectedReport.status]?.label || selectedReport.status}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${CONFIDENCE_COLORS[selectedReport.overall_confidence] || ''}`}>
                    {selectedReport.overall_confidence} confidence
                  </span>
                </div>
              </div>
              <button onClick={() => setShowReportDetail(false)} className="text-text-muted hover:text-text-primary">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {selectedReport.executive_summary && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-none">
                  <p className="text-sm text-text-primary leading-relaxed">{selectedReport.executive_summary}</p>
                </div>
              )}

              {selectedReport.content?.narrative && (
                <div className="mb-4">
                  <h4 className="font-medium text-text-primary mb-2">Full Report</h4>
                  <div className="p-4 bg-bg-alt rounded-none text-sm text-text-primary whitespace-pre-line leading-relaxed">
                    {selectedReport.content.narrative}
                  </div>
                </div>
              )}

              {selectedReport.content?.compensation && (
                <div className="mb-4">
                  <h4 className="font-medium text-text-primary mb-2">Compensation Benchmark</h4>
                  {selectedReport.content.compensation.insufficient_data ? (
                    <p className="text-sm text-text-muted">Insufficient data for reliable benchmarking</p>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {['p10', 'p25', 'median', 'p75', 'p90'].map(p => (
                        <div key={p} className="text-center p-2 bg-bg-alt rounded-none">
                          <p className="text-lg font-bold text-text-primary">
                            {selectedReport.content.compensation.base?.[p] || '—'}
                          </p>
                          <p className="text-xs text-text-muted uppercase">{p}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedReport.content?.talent_radar && selectedReport.content.talent_radar.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-text-primary mb-2">
                    Talent Radar ({selectedReport.content.talent_radar.length} profiles)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {selectedReport.content.talent_radar.map((p: any, i: number) => (
                      <div key={i} className="p-3 bg-bg-alt rounded-none">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">{p.label}</span>
                          <span className="text-xs text-text-muted capitalize">{p.seniority?.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{p.geography} · {p.experience || '?'} yrs</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(p.key_skills || []).slice(0, 3).map((s: string, j: number) => (
                            <span key={j} className="px-1.5 py-0.5 text-xs bg-card text-text-muted rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.status === 'under_review' && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="font-medium text-text-primary mb-3">Review Actions</h4>
                  <textarea
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    className="w-full h-20 p-3 border border-border rounded-none text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview('approve')}
                      disabled={reviewAction !== null}
                      className="flex-1 py-2 text-sm bg-green-600 text-white rounded-none hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {reviewAction === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve & Deliver
                    </button>
                    <button
                      onClick={() => handleReview('edit')}
                      disabled={reviewAction !== null}
                      className="px-4 py-2 text-sm border border-border rounded-none hover:bg-bg-alt disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleReview('reject')}
                      disabled={reviewAction !== null}
                      className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-none hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview('escalate')}
                      disabled={reviewAction !== null}
                      className="px-4 py-2 text-sm text-amber-600 border border-amber-200 rounded-none hover:bg-amber-50 disabled:opacity-50"
                    >
                      Escalate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligenceHub;
