import React from 'react';
import { MessageSquare, FileText, Calendar, Send } from 'lucide-react';
import { ClientKPIRow } from '@/components/client/ClientKPIRow';
import { ClientPipelineOverview } from '@/components/client/ClientPipelineOverview';
import { PresentedCandidateList } from '@/components/client/PresentedCandidateList';
import { UpcomingInterviews } from '@/components/client/UpcomingInterviews';
import { ReportDownloads } from '@/components/client/ReportDownloads';
import { ClientOrgChart } from '@/components/client/ClientOrgChart';
import { SuccessionRisk } from '@/components/client/SuccessionRisk';
import { OfferPipeline } from '@/components/client/OfferPipeline';
import { NewSearchRequest } from '@/components/client/NewSearchRequest';
import { InvoiceBilling } from '@/components/client/InvoiceBilling';

const MOCK_CLIENT_PROFILE = {
  name: 'Claire Jin',
  title: 'CHRO',
  company: 'FinanceHub Asia',
  activeMandates: 3,
};

const MOCK_KPIs = {
  active: 3,
  presented: 8,
  interviews: 5,
  upcoming: 2,
};

const MOCK_PIPELINE = {
  SWEEP: 6,
  CANVA: 4,
  GRID: 3,
  LENS: 2,
  PLACED: 1,
};

const MOCK_PRESENTED_CANDIDATES = [
  { name: 'David Tan', score: 87, verdict: 'Strong', mandate: 'VP Risk' },
  { name: 'Sophie Lau', score: 84, verdict: 'Strong', mandate: 'VP Risk' },
  { name: 'Michael Chen', score: 78, verdict: 'Good', mandate: 'Head Digital' },
];

const MOCK_INTERVIEWS = [
  { date: 'Jul 8, 14:00', title: 'Client Panel x3', candidates: 3 },
  { date: 'Jul 15, 10:00', title: 'David Tan Final', candidates: 1 },
];

const MOCK_REPORTS = [
  { name: 'Candidate Comparison M-028', type: 'PDF' },
  { name: 'Market Mapping Summary', type: 'PDF' },
  { name: 'Compensation Benchmark', type: 'PDF' },
  { name: 'Monthly Status (Jun)', type: 'PDF' },
];

const MOCK_ORG_CHART = {
  company: 'FinanceHub Asia',
  nodes: [
    { role: 'CEO', name: 'Robert Tan', risk: 'low' },
    { role: 'CHRO', name: 'Claire Jin (You)', risk: 'low' },
    { role: 'CFO', name: 'Michael Wong', risk: 'low' },
    { role: 'CTO', name: 'Priya Sharma', risk: 'medium' },
    { role: 'VP Risk', name: 'VACANT', risk: 'high', candidates: 3 },
  ],
};

const MOCK_SUCCESSION_RISKS = [
  { role: 'CTO', person: 'Priya Sharma', risk: 'Medium', bench: 'Weak bench' },
  { role: 'VP Risk', person: 'Vacant', risk: 'High', bench: '3 presented' },
  { role: 'Head Digital', person: 'Alex Yeo', risk: 'High', bench: '1 internal' },
  { role: 'CFO', person: 'Michael Wong', risk: 'Low', bench: 'Strong bench' },
];

const MOCK_OFFERS = [
  { candidate: 'David Tan', role: 'VP Risk', comp: '$280K+30%', status: 'NEGOTIATING' },
  { candidate: 'Sophie Lau', role: 'VP Risk', comp: '$260K+25%', status: 'PENDING' },
  { candidate: 'Michael Chen', role: 'Head Digital', comp: '$240K', status: 'ACCEPTED' },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-031', desc: 'M-031 CTO Retainer', amount: '$15,000', status: 'DUE' },
  { id: 'INV-2026-028', desc: 'M-028 Retainer', amount: '$12,000', status: 'PAID' },
  { id: 'INV-2026-025', desc: 'M-025 Success Fee', amount: '$72,000', status: 'PENDING' },
];

export function ClientPortalOverview() {
  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-text-primary">Client Portal</h1>
            <p className="text-text-muted mt-1">
              {MOCK_CLIENT_PROFILE.name} — {MOCK_CLIENT_PROFILE.title}, {MOCK_CLIENT_PROFILE.company}
            </p>
            <p className="text-sm text-text-muted mt-0.5">
              {MOCK_CLIENT_PROFILE.activeMandates} active mandates · Org-scoped view
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors">
              <MessageSquare className="w-4 h-4" />
              Ask NEXUS
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-bg-secondary border border-bg-tertiary transition-colors">
              <FileText className="w-4 h-4" />
              Status Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium hover:bg-bg-secondary border border-bg-tertiary transition-colors">
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </div>
      </header>

      <ClientKPIRow kpis={MOCK_KPIs} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientPipelineOverview pipeline={MOCK_PIPELINE} />
        <PresentedCandidateList candidates={MOCK_PRESENTED_CANDIDATES} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingInterviews interviews={MOCK_INTERVIEWS} />
        <ReportDownloads reports={MOCK_REPORTS} />
      </div>

      <ClientOrgChart orgChart={MOCK_ORG_CHART} />

      <SuccessionRisk risks={MOCK_SUCCESSION_RISKS} />

      <OfferPipeline offers={MOCK_OFFERS} />

      <NewSearchRequest />

      <InvoiceBilling invoices={MOCK_INVOICES} />
    </div>
  );
}