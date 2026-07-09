/**
 * ClientCollaborationPage — B2B Client Portal collaboration workspace
 * Renders inside AppShell → Outlet. Shows shared projects,
 * team discussions, and document collaboration.
 */
import React from 'react';
import { Users, MessageSquare, FileText, Calendar, Share2, CheckCircle2, Circle, User, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

// Static content — collaboration UI not backed by a direct table

interface CollaborationProject {
  id: string;
  title: string;
  description: string;
  members: number;
  progress: number;
  lastUpdated: string;
}

interface DiscussionThread {
  id: string;
  title: string;
  author: string;
  messages: number;
  lastMessage: string;
  unread: boolean;
}

interface SharedDocument {
  id: string;
  title: string;
  type: 'Report' | 'Proposal' | 'Document' | 'Spreadsheet';
  author: string;
  date: string;
  size: string;
}

const STATIC_PROJECTS: CollaborationProject[] = [
  { id: 'p1', title: 'Q1 Executive Search', description: 'Enterprise-level leadership recruitment', members: 5, progress: 75, lastUpdated: '2h ago' },
  { id: 'p2', title: 'TechCorp VP Engineering', description: 'Senior technical leadership role', members: 3, progress: 45, lastUpdated: '5h ago' },
  { id: 'p3', title: 'FinScale CFO Search', description: 'Financial leadership mandate', members: 4, progress: 90, lastUpdated: '1d ago' },
  { id: 'p4', title: 'DataMesh Expansion', description: 'Product and engineering roles', members: 6, progress: 30, lastUpdated: '2d ago' },
];

const STATIC_THREADS: DiscussionThread[] = [
  { id: 't1', title: 'Candidate Shortlist Review', author: 'Sarah Kim', messages: 12, lastMessage: 'Let me review these profiles...', unread: true },
  { id: 't2', title: 'Interview Schedule', author: 'Alex Chen', messages: 8, lastMessage: 'Updated calendar invite sent', unread: false },
  { id: 't3', title: 'Compensation Package', author: 'Michael Wong', messages: 15, lastMessage: 'Feedback received from HR', unread: true },
  { id: 't4', title: 'Market Analysis Q1', author: 'Emily Davis', messages: 22, lastMessage: 'Final report attached', unread: false },
];

const STATIC_DOCUMENTS: SharedDocument[] = [
  { id: 'd1', title: 'Q1 Talent Report 2025', type: 'Report', author: 'DEX AI', date: 'Jan 15, 2025', size: '2.4 MB' },
  { id: 'd2', title: 'Executive Search Proposal', type: 'Proposal', author: 'Alex Chen', date: 'Jan 12, 2025', size: '850 KB' },
  { id: 'd3', title: 'Candidate Scorecard', type: 'Spreadsheet', author: 'Sarah Kim', date: 'Jan 10, 2025', size: '120 KB' },
  { id: 'd4', title: 'Market Intelligence Brief', type: 'Document', author: 'DEX AI', date: 'Jan 8, 2025', size: '560 KB' },
];

export function ClientCollaborationPage() {
  const { clientAccount, profile } = useTenantContext();

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  const typeIcons: Record<string, React.ReactNode> = {
    Report: <FileText className="w-4 h-4 text-blue" />,
    Proposal: <FileText className="w-4 h-4 text-green" />,
    Document: <FileText className="w-4 h-4 text-text-muted" />,
    Spreadsheet: <FileText className="w-4 h-4 text-amber" />,
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Collaboration</h1>
            <p className="text-text-secondary text-sm mt-1">Shared projects, discussions, and document collaboration.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{organization}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{STATIC_PROJECTS.length}</div>
              <div className="text-xs text-text-muted">Active Projects</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{STATIC_THREADS.filter(t => t.unread).length}</div>
              <div className="text-xs text-text-muted">Unread Discussions</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{STATIC_DOCUMENTS.length}</div>
              <div className="text-xs text-text-muted">Shared Documents</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia" />
                <CardTitle>Collaboration Projects</CardTitle>
              </div>
              <Button size="sm">New Project</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATIC_PROJECTS.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-bg-warm rounded-lg hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-text-primary">{project.title}</span>
                      <Badge variant="outline" className="text-xs">{project.members} members</Badge>
                    </div>
                    <div className="text-sm text-text-muted mt-1">{project.description}</div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                          <div className="h-full bg-fuchsia rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xs text-text-muted">Updated</div>
                    <div className="text-sm font-medium text-text-secondary">{project.lastUpdated}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-fuchsia" />
                <CardTitle>Discussions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATIC_THREADS.map((thread) => (
                  <button key={thread.id} className="w-full text-left p-3 bg-bg-warm rounded-lg hover:bg-fuchsia-light/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium text-sm ${thread.unread ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {thread.title}
                      </span>
                      {thread.unread && (
                        <span className="w-2 h-2 bg-fuchsia rounded-full" />
                      )}
                    </div>
                    <div className="text-xs text-text-muted">
                      {thread.author} · {thread.messages} messages
                    </div>
                    <div className="text-xs text-text-muted mt-1 truncate">
                      {thread.lastMessage}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-fuchsia" />
                  <CardTitle>Recent Documents</CardTitle>
                </div>
                <button className="text-sm text-fuchsia hover:underline">View All</button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATIC_DOCUMENTS.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-bg-warm rounded-lg cursor-pointer transition-colors">
                    {typeIcons[doc.type]}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{doc.title}</div>
                      <div className="text-xs text-text-muted">{doc.author} · {doc.date}</div>
                    </div>
                    <div className="text-xs text-text-muted">{doc.size}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-fuchsia" />
            <CardTitle>Upcoming Events</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: 'Candidate Review', date: 'Today, 2:00 PM', type: 'Meeting', participants: '3' },
              { title: 'Interview Prep', date: 'Tomorrow, 10:00 AM', type: 'Coaching', participants: '1' },
              { title: 'Pipeline Sync', date: 'Wed, 1:00 PM', type: 'Meeting', participants: '5' },
              { title: 'Final Presentation', date: 'Thu, 3:00 PM', type: 'Review', participants: '8' },
            ].map((event, i) => (
              <div key={i} className="p-4 bg-bg-warm rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{event.type}</Badge>
                  <span className="text-xs text-text-muted">{event.participants} participants</span>
                </div>
                <div className="font-medium text-text-primary text-sm mb-1">{event.title}</div>
                <div className="text-xs text-text-muted">{event.date}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientCollaborationPage;