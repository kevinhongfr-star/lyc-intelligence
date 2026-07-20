/**
 * CandidatePortalV2Page.tsx — Issue #14
 * Candidate Portal v2.1 enhanced dashboard
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Briefcase,
  MessageSquare,
  FileText,
  Star,
  TrendingUp,
  Bell,
  Calendar,
  Award,
  Zap,
  ChevronRight,
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  status: 'new' | 'applied' | 'interview' | 'offer';
  postedAt: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  time: string;
  read: boolean;
}

const OPPORTUNITIES: Opportunity[] = [
  { id: 'opp-1', title: 'VP Engineering', company: 'Apex Digital', location: 'Singapore', salary: '$300-350K', matchScore: 94, status: 'interview', postedAt: '2026-07-18' },
  { id: 'opp-2', title: 'CTO', company: 'Fintech Scale-up', location: 'Hong Kong', salary: '$400-500K', matchScore: 88, status: 'applied', postedAt: '2026-07-19' },
  { id: 'opp-3', title: 'Head of Product', company: 'HealthTech Co', location: 'Tokyo', salary: '$200-250K', matchScore: 82, status: 'new', postedAt: '2026-07-20' },
];

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'interview', message: 'Interview scheduled for VP Engineering at Apex Digital', time: '2h ago', read: false },
  { id: 'n2', type: 'assessment', message: 'Complete your TRIDENT assessment to unlock more matches', time: '5h ago', read: false },
  { id: 'n3', type: 'message', message: 'Kevin Hong sent you a message about the CTO role', time: '1d ago', read: true },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  applied: 'bg-blue-100 text-blue-700',
  interview: 'bg-amber-100 text-amber-700',
  offer: 'bg-green-100 text-green-700',
};

export function CandidatePortalV2Page() {
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'documents' | 'messages'>('overview');
  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Welcome back, Sarah</h1>
            <p className="text-sm text-gray-500">Your candidate dashboard v2.1</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 relative">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button size="sm" className="gap-1">
            <Zap className="w-4 h-4" />
            DEX AI Coach
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Briefcase className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs text-gray-500">Active Applications</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Star className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">88</div>
            <div className="text-xs text-gray-500">Avg Match Score</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">92%</div>
            <div className="text-xs text-gray-500">Profile Completeness</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><Award className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">2</div>
            <div className="text-xs text-gray-500">Certificates</div>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        {(['overview', 'opportunities', 'documents', 'messages'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-medium">Recommended Opportunities</h2>
            {OPPORTUNITIES.map(opp => (
              <Card key={opp.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{opp.title}</div>
                    <div className="text-xs text-gray-500">{opp.company} · {opp.location} · {opp.salary}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={STATUS_COLORS[opp.status]}>{opp.status}</Badge>
                      <span className="text-xs text-gray-400">Posted {opp.postedAt}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{opp.matchScore}%</div>
                    <div className="text-[10px] text-gray-500">Match</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium">Recent Notifications</h2>
            {NOTIFICATIONS.map(n => (
              <div key={n.id} className={`p-3 rounded-lg ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                <div className="text-sm">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
              </div>
            ))}

            <Card className="p-4">
              <h3 className="text-sm font-medium mb-2">Upcoming</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                VP Engineering interview — Jul 22, 10:00 AM
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div className="space-y-3">
          {OPPORTUNITIES.map(opp => (
            <Card key={opp.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold">
                    {opp.company.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{opp.title}</div>
                    <div className="text-xs text-gray-500">{opp.company} · {opp.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={STATUS_COLORS[opp.status]}>{opp.status}</Badge>
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">{opp.matchScore}%</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Resume.pdf', 'Cover Letter.pdf', 'TRIDENT Report.pdf', 'Offer Letter — Apex.pdf'].map(doc => (
            <Card key={doc} className="p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
              <FileText className="w-8 h-8 text-red-400" />
              <div>
                <div className="text-sm font-medium">{doc}</div>
                <div className="text-xs text-gray-500">PDF · 2.4 MB</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-2">
          {['Kevin Hong', 'Apex Digital HR', 'LYC Consultant'].map((sender, i) => (
            <Card key={sender} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                {sender.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{sender}</div>
                <div className="text-xs text-gray-500">
                  {i === 0 ? 'Looking forward to your interview on Tuesday' : i === 1 ? 'Please review the attached offer details' : 'Your profile has been shortlisted'}
                </div>
              </div>
              <div className="text-xs text-gray-400">{i === 0 ? '2h' : i === 1 ? '1d' : '3d'}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
