import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Plus,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const MOCK_CLIENT = {
  id: '1',
  name: 'TechCorp',
  industry: 'Technology',
  location: 'Shanghai, China',
  founded: '2018',
  employees: '200-500',
  revenue: '$50M-$100M',
  mandates_won: 3,
  mandates_total: 5,
  total_revenue: 450000,
  nps: 9,
  first_engagement: '2022-03-15',
  last_contact: '2024-06-20',
};

const MOCK_MANDATES = [
  { id: 'm1', title: 'VP Engineering', status: 'won', date: '2024-01-10', fee: 150000 },
  { id: 'm2', title: 'Director of Product', status: 'won', date: '2023-08-20', fee: 120000 },
  { id: 'm3', title: 'Head of Data', status: 'won', date: '2022-11-05', fee: 180000 },
];

const MOCK_CONTACTS = [
  { id: 'c1', name: 'Sarah Chen', title: 'VP People', email: 'sarah@techcorp.com', phone: '+86 138 1234 5678', is_primary: true },
  { id: 'c2', name: 'Michael Zhang', title: 'CEO', email: 'michael@techcorp.com', phone: '+86 139 8765 4321', is_primary: false },
  { id: 'c3', name: 'Emily Wang', title: 'CFO', email: 'emily@techcorp.com', phone: '+86 137 2468 1357', is_primary: false },
];

const MOCK_ACTIVITY = [
  { id: 'a1', type: 'meeting', title: 'Discovery call - VP Eng', date: '2024-06-20', person: 'Sarah Chen' },
  { id: 'a2', type: 'email', title: 'Proposal follow-up', date: '2024-06-18', person: 'Sarah Chen' },
  { id: 'a3', type: 'call', title: 'Intro call', date: '2024-06-15', person: 'Michael Zhang' },
];

export function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const client = MOCK_CLIENT;

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-text-primary">{client.name}</h1>
            <p className="text-text-secondary">{client.industry} · {client.location}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {client.mandates_won} Mandates Won
              </Badge>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                <Star className="w-3 h-3 mr-1" />
                NPS {client.nps}/10
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/bd/opportunities/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Opportunity
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Total Revenue</span>
            </div>
            <p className="text-xl font-bold text-text-primary">{formatCurrency(client.total_revenue)}</p>
            <p className="text-xs text-green-600 mt-1">+18% YoY</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Win Rate</span>
            </div>
            <p className="text-xl font-bold text-text-primary">
              {Math.round((client.mandates_won / client.mandates_total) * 100)}%
            </p>
            <p className="text-xs text-text-muted mt-1">{client.mandates_won}/{client.mandates_total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Key Contacts</span>
            </div>
            <p className="text-xl font-bold text-text-primary">{MOCK_CONTACTS.length}</p>
            <p className="text-xs text-text-muted mt-1">at this company</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted">Client Since</span>
            </div>
            <p className="text-xl font-bold text-text-primary">
              {new Date(client.first_engagement).getFullYear()}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {formatDate(client.first_engagement)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-6">
          {['overview', 'mandates', 'contacts', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-accent text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Past Mandates</CardTitle>
              <Link to="/platform/mandates" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_MANDATES.map((mandate) => (
                <div key={mandate.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">{mandate.title}</p>
                    <p className="text-xs text-text-muted">{formatDate(mandate.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text-primary">
                      {formatCurrency(mandate.fee)}
                    </span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Won
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {MOCK_ACTIVITY.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
                    {activity.type === 'meeting' && <Calendar className="w-4 h-4 text-blue-500" />}
                    {activity.type === 'email' && <Mail className="w-4 h-4 text-purple-500" />}
                    {activity.type === 'call' && <Phone className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                    <p className="text-xs text-text-muted">with {activity.person}</p>
                  </div>
                  <span className="text-xs text-text-muted">{formatDate(activity.date)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Key Contacts</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_CONTACTS.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary text-sm truncate">{contact.name}</p>
                      {contact.is_primary && (
                        <Badge variant="secondary" className="bg-accent/10 text-accent text-[9px]">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">{contact.title}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Industry</span>
                <span className="text-text-primary">{client.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Headcount</span>
                <span className="text-text-primary">{client.employees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Revenue</span>
                <span className="text-text-primary">{client.revenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Founded</span>
                <span className="text-text-primary">{client.founded}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
