/**
 * ClientCollaborationPage — B2B Client Portal collaboration workspace
 * Renders inside AppShell → Outlet. Shows shared projects,
 * team discussions, and document collaboration.
 */
import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, FileText, Calendar, Share2, CheckCircle2, Circle, User, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import {
  collaborationService,
  type CollaborationProject,
  type DiscussionThread,
  type SharedDocument,
} from '@/services/collaborationService';

export function ClientCollaborationPage() {
  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clientAccount, profile } = useTenantContext();

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';
  const orgId = clientAccount?.org_id || '';

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [proj, thr, docs] = await Promise.all([
          collaborationService.getProjects(orgId),
          collaborationService.getThreads(orgId),
          collaborationService.getDocuments(orgId),
        ]);
        if (cancelled) return;
        setProjects(proj);
        setThreads(thr);
        setDocuments(docs);
      } catch (e) {
        console.error('[ClientCollaborationPage] Load error:', e);
        if (!cancelled) setError('Failed to load collaboration data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orgId]);

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <Card key={i} className="p-4">
              <div className="animate-pulse h-12 bg-bg-tertiary rounded" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-red text-sm">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
                  <Users className="w-5 h-5 text-fuchsia" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">{projects.length}</div>
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
                  <div className="text-2xl font-bold text-text-primary">{threads.filter(t => t.unread).length}</div>
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
                  <div className="text-2xl font-bold text-text-primary">{documents.length}</div>
                  <div className="text-xs text-text-muted">Shared Documents</div>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia" />
                <CardTitle>Active Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-sm">No active projects.</div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-bg-warm rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary text-sm">{project.title}</div>
                          <div className="text-xs text-text-muted mt-1">{project.description}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-text-muted">{project.members} members</span>
                            <span className="text-xs text-text-muted">Updated {project.lastUpdated}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-fuchsia rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-8">{project.progress}%</span>
                        <ArrowRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-fuchsia" />
                  <CardTitle>Discussions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {threads.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm">No discussions yet.</div>
                ) : (
                  <div className="space-y-3">
                    {threads.slice(0, 4).map((thread) => (
                      <div key={thread.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-fuchsia-light flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-fuchsia" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary text-sm">{thread.title}</div>
                            <div className="text-xs text-text-muted">
                              {thread.author} · {thread.messages} messages
                            </div>
                          </div>
                        </div>
                        {thread.unread && (
                          <Badge className="bg-fuchsia/10 text-fuchsia text-xs">New</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-fuchsia" />
                  <CardTitle>Shared Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="py-8 text-center text-text-muted text-sm">No shared documents.</div>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 4).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center">
                            {typeIcons[doc.type] || <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary text-sm">{doc.title}</div>
                            <div className="text-xs text-text-muted">
                              {doc.author} · {doc.date} · {doc.size}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default ClientCollaborationPage;