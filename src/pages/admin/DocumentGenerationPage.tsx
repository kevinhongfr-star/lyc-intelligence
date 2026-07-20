/**
 * DocumentGenerationPage.tsx — Issue #45
 * Auto document creation (offer letters, contracts, proposals, reports)
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Plus,
  Download,
  Send,
  PenTool,
  Clock,
  CheckCircle2,
  FileSignature,
  FolderOpen,
  LayoutTemplate,
} from 'lucide-react';

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  variables: string[];
}

interface GeneratedDocument {
  id: string;
  templateId: string;
  name: string;
  status: 'draft' | 'generated' | 'sent' | 'signed';
  createdAt: string;
  generatedAt?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  draft: <PenTool className="w-4 h-4 text-gray-500" />,
  generated: <FileText className="w-4 h-4 text-blue-500" />,
  sent: <Send className="w-4 h-4 text-amber-500" />,
  signed: <FileSignature className="w-4 h-4 text-green-500" />,
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  generated: 'bg-blue-100 text-blue-700',
  sent: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
};

export function DocumentGenerationPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [tmplRes, docRes, statsRes] = await Promise.all([
        fetch('/api/document-generation/templates').then(r => r.json()),
        fetch('/api/document-generation/documents').then(r => r.json()),
        fetch('/api/document-generation/stats').then(r => r.json()),
      ]);
      setTemplates(tmplRes.templates || []);
      setDocuments(docRes.documents || []);
      setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Failed to load document data', e);
    } finally {
      setLoading(false);
    }
  }

  function openGenerate(template: DocumentTemplate) {
    setSelectedTemplate(template);
    setFormValues(Object.fromEntries(template.variables.map(v => [v, ''])));
    setShowGenerateModal(true);
  }

  async function handleGenerate() {
    if (!selectedTemplate) return;
    const res = await fetch('/api/document-generation/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: selectedTemplate.id,
        name: `${selectedTemplate.name} — ${formValues.candidate_name || formValues.client_name || 'New'}`,
        variables: formValues,
      }),
    });
    if (res.ok) {
      setShowGenerateModal(false);
      fetchData();
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Document Generation</h1>
        <p className="text-sm text-gray-500 mt-1">Auto-create offer letters, contracts, proposals, and reports</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><LayoutTemplate className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalTemplates}</div>
              <div className="text-xs text-gray-500">Templates</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><FolderOpen className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <div className="text-xs text-gray-500">Documents</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.byStatus?.signed || 0}</div>
              <div className="text-xs text-gray-500">Signed</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.byStatus?.draft || 0}</div>
              <div className="text-xs text-gray-500">Drafts</div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Templates</h2>
          <div className="space-y-2">
            {templates.map(t => (
              <Card key={t.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                        <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Variables: {t.variables.join(', ')}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openGenerate(t)} className="gap-1">
                    <Plus className="w-3 h-3" />
                    Generate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Recent Documents</h2>
          <div className="space-y-2">
            {documents.map(d => (
              <Card key={d.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcons[d.status]}
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-gray-500">
                        {d.generatedAt ? new Date(d.generatedAt).toLocaleDateString() : 'Draft'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[d.status]}>{d.status}</Badge>
                    {d.status !== 'draft' && (
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Download">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {showGenerateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Generate: {selectedTemplate.name}</h3>
              <button onClick={() => setShowGenerateModal(false)}><Plus className="w-4 h-4 rotate-45" /></button>
            </div>
            <div className="space-y-3">
              {selectedTemplate.variables.map(v => (
                <div key={v}>
                  <label className="text-xs font-medium text-gray-600 capitalize mb-1 block">
                    {v.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={formValues[v] || ''}
                    onChange={e => setFormValues({ ...formValues, [v]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
              <Button onClick={handleGenerate}>Generate Document</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
