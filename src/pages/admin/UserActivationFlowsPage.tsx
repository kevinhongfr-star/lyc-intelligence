/**
 * UserActivationFlowsPage.tsx — Issue #35
 * Per-portal user activation and onboarding flow configuration
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  UserCheck,
  Briefcase,
  GraduationCap,
  Users,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  Circle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface ActivationFlow {
  id: string;
  portal: string;
  name: string;
  description: string;
  steps: FlowStep[];
  active: boolean;
  completionRate: number;
  totalUsers: number;
  icon: React.ReactNode;
}

interface FlowStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed?: boolean;
}

const FLOWS: ActivationFlow[] = [
  {
    id: 'flow-b2c',
    portal: 'B2C',
    name: 'Executive Candidate Onboarding',
    description: 'First-run experience for executive candidates using DEX AI',
    icon: <UserCheck className="w-5 h-5" />,
    active: true,
    completionRate: 78,
    totalUsers: 1240,
    steps: [
      { id: 's1', title: 'Profile Setup', description: 'Upload CV and basic info', required: true },
      { id: 's2', title: 'TRIDENT Assessment', description: 'Complete capability assessment', required: true },
      { id: 's3', title: 'Career Preferences', description: 'Set target roles and locations', required: true },
      { id: 's4', title: 'Connect Calendar', description: 'Enable interview scheduling', required: false },
      { id: 's5', title: 'DEX AI Tutorial', description: 'Learn to use the AI coach', required: false },
    ],
  },
  {
    id: 'flow-client',
    portal: 'Client',
    name: 'Client Portal Onboarding',
    description: 'First-run for new client users accessing mandate data',
    icon: <Briefcase className="w-5 h-5" />,
    active: true,
    completionRate: 92,
    totalUsers: 85,
    steps: [
      { id: 's1', title: 'Company Profile', description: 'Verify company information', required: true },
      { id: 's2', title: 'User Permissions', description: 'Set team access levels', required: true },
      { id: 's3', title: 'Mandate Briefing', description: 'Review active mandates', required: true },
      { id: 's4', title: 'Collaboration Setup', description: 'Configure notifications', required: false },
    ],
  },
  {
    id: 'flow-student',
    portal: 'Student',
    name: 'Student LMS Onboarding',
    description: 'Activation flow for academy students',
    icon: <GraduationCap className="w-5 h-5" />,
    active: true,
    completionRate: 65,
    totalUsers: 340,
    steps: [
      { id: 's1', title: 'Account Creation', description: 'Set up student profile', required: true },
      { id: 's2', title: 'Learning Plan', description: 'Select courses and track', required: true },
      { id: 's3', title: 'Diagnostic Test', description: 'Initial skills assessment', required: true },
      { id: 's4', title: 'Schedule Sessions', description: 'Book coaching calls', required: false },
      { id: 's5', title: 'Community Join', description: 'Connect with peers', required: false },
    ],
  },
  {
    id: 'flow-council',
    portal: 'Council',
    name: 'Signal Council Onboarding',
    description: 'Activation for council members and contributors',
    icon: <Users className="w-5 h-5" />,
    active: true,
    completionRate: 85,
    totalUsers: 156,
    steps: [
      { id: 's1', title: 'Member Verification', description: 'Verify professional credentials', required: true },
      { id: 's2', title: 'Expertise Tags', description: 'Select areas of expertise', required: true },
      { id: 's3', title: 'Availability', description: 'Set coaching availability', required: true },
      { id: 's4', title: 'First Contribution', description: 'Submit initial insight', required: false },
    ],
  },
  {
    id: 'flow-consultant',
    portal: 'Internal',
    name: 'Consultant Workspace Setup',
    description: 'Internal consultant onboarding and workspace config',
    icon: <LayoutDashboard className="w-5 h-5" />,
    active: true,
    completionRate: 96,
    totalUsers: 24,
    steps: [
      { id: 's1', title: 'Account Provisioning', description: 'IT setup and access', required: true },
      { id: 's2', title: 'Pipeline Training', description: 'Learn mandate workflow', required: true },
      { id: 's3', title: 'Tool Access', description: 'Configure integrations', required: true },
    ],
  },
];

export function UserActivationFlowsPage() {
  const [flows, setFlows] = useState<ActivationFlow[]>(FLOWS);
  const [selectedFlow, setSelectedFlow] = useState<ActivationFlow | null>(null);

  function toggleFlow(id: string) {
    setFlows(flows.map(f => f.id === id ? { ...f, active: !f.active } : f));
  }

  const avgCompletion = Math.round(flows.reduce((s, f) => s + f.completionRate, 0) / flows.length);
  const totalUsers = flows.reduce((s, f) => s + f.totalUsers, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User Activation Flows</h1>
        <p className="text-sm text-gray-500 mt-1">Configure and monitor per-portal onboarding experiences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><UserCheck className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{flows.length}</div>
            <div className="text-xs text-gray-500">Active Flows</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Onboarded</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{avgCompletion}%</div>
            <div className="text-xs text-gray-500">Avg Completion</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><ArrowRight className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{flows.filter(f => f.active).length}</div>
            <div className="text-xs text-gray-500">Enabled</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {flows.map(flow => (
          <Card
            key={flow.id}
            className={`p-5 cursor-pointer hover:shadow-md transition-shadow ${selectedFlow?.id === flow.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedFlow(flow)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">{flow.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{flow.name}</span>
                    <Badge className="text-[10px]">{flow.portal}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{flow.description}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFlow(flow.id); }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {flow.active ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
              </button>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Completion rate</span>
                <span>{flow.completionRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${flow.completionRate}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span>{flow.steps.length} steps</span>
              <span>{flow.totalUsers} users</span>
              <span>{flow.steps.filter(s => s.required).length} required</span>
            </div>
          </Card>
        ))}
      </div>

      {selectedFlow && (
        <Card className="p-5 border-blue-200">
          <h3 className="font-medium text-sm mb-4">{selectedFlow.name} — Steps</h3>
          <div className="space-y-2">
            {selectedFlow.steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-white border flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {step.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
