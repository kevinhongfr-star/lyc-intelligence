import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, Users, TrendingUp,
  Building2, ChevronRight, RefreshCw, BarChart3, Activity
} from 'lucide-react';
import { Badge, Button, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

interface KevinOversightDashboardProps {
  onMandateClick?: (mandateId: string) => void;
  onClientClick?: (clientId: string) => void;
}

export function KevinOversightDashboard({ onMandateClick, onClientClick }: KevinOversightDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadOversight();
  }, []);

  async function loadOversight() {
    setLoading(true);
    try {
      const res = await fetch('/api/kevin/oversight');
      const data = await res.json();
      if (data.success) {
        setData(data);
      }
    } catch (err) {
      console.error('Load oversight error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-center py-8">No oversight data available</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Kevin's Client Oversight
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor all client engagements, identify at-risk mandates, track pending feedback
          </p>
        </div>
        <Button variant="outline" onClick={loadOversight}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Active Mandates</div>
              <div className="text-2xl font-bold text-gray-800">{data.summary.total_active_mandates}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Active Clients</div>
              <div className="text-2xl font-bold text-gray-800">{data.summary.total_active_clients}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">At-Risk Mandates</div>
              <div className="text-2xl font-bold text-red-600">{data.summary.at_risk_count}</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Pending Feedback</div>
              <div className="text-2xl font-bold text-yellow-600">{data.summary.pending_feedback_count}</div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mandates">All Mandates</TabsTrigger>
          <TabsTrigger value="pending">Pending Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {data.at_risk.length > 0 && (
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                At-Risk Mandates
              </h3>
              <div className="space-y-3">
                {data.at_risk.map((mandate: any) => (
                  <div
                    key={mandate.mandate_id}
                    className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                    onClick={() => onMandateClick?.(mandate.mandate_id)}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{mandate.mandate_title}</div>
                      <div className="text-sm text-gray-500">
                        {mandate.consultant_name} — {mandate.client_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Last Activity</div>
                        <div className="font-medium text-red-600">{mandate.days_since_last_client_activity}d ago</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {data.mandates.slice(0, 5).map((mandate: any) => (
                  <div key={mandate.mandate_id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-800">{mandate.mandate_title}</div>
                      <div className="text-sm text-gray-500">{mandate.consultant_name}</div>
                    </div>
                    <Badge variant={mandate.risk_flags.length > 0 ? 'destructive' : 'outline'}>
                      {mandate.risk_flags.length > 0 ? 'At Risk' : 'Healthy'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Longest Waiting Feedback
              </h3>
              <div className="space-y-3">
                {data.pending_feedback.slice(0, 5).map((feedback: any) => (
                  <div key={`${feedback.mandate_id}-${feedback.contact_id}`} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-800">{feedback.contact_name}</div>
                      <div className="text-sm text-gray-500">{feedback.mandate_title}</div>
                    </div>
                    <Badge className={feedback.days_waiting > 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                      {feedback.days_waiting}d
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mandates">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">All Mandates</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Mandate</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Client</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Consultant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Pipeline</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Last Activity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Engagement</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mandates.map((mandate: any) => (
                    <tr key={mandate.mandate_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{mandate.mandate_title}</div>
                        <div className="text-sm text-gray-500">{mandate.client_org}</div>
                      </td>
                      <td className="py-3 px-4">{mandate.client_name}</td>
                      <td className="py-3 px-4">{mandate.consultant_name}</td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{mandate.pipeline_summary}</td>
                      <td className="py-3 px-4">
                        <Badge className={mandate.days_since_last_client_activity > 7 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {mandate.days_since_last_client_activity}d
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{mandate.client_engagement_score}</span>
                            <span>/100</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${mandate.client_engagement_score > 70 ? 'bg-green-500' : mandate.client_engagement_score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${mandate.client_engagement_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {mandate.risk_flags.length > 0 ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {mandate.risk_flags.length}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Pending Client Feedback</h3>
            <div className="space-y-3">
              {data.pending_feedback.map((feedback: any) => (
                <div key={`${feedback.mandate_id}-${feedback.contact_id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{feedback.contact_name}</div>
                    <div className="text-sm text-gray-500">{feedback.mandate_title}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Waiting</div>
                      <div className="font-medium text-gray-800">{feedback.days_waiting} days</div>
                    </div>
                    <Badge className={feedback.days_waiting > 7 ? 'bg-red-100 text-red-700' : feedback.days_waiting > 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}>
                      {feedback.days_waiting > 7 ? 'Overdue' : feedback.days_waiting > 3 ? 'Delayed' : 'Pending'}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-blue-50">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <TrendingUp className="w-4 h-4" />
          Click on any mandate or feedback item to drill down into the client view and see exactly what they see.
        </div>
      </Card>
    </div>
  );
}
