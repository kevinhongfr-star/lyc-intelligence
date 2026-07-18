/**
 * CandidateDocumentsPage — Document management for candidates
 * Issue #14: Candidate Portal v2.1
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  X,
  File,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState, Select } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

interface CandidateDocument {
  id: string;
  document_type: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  expiry_date: string | null;
  tags: string[];
  visibility: string;
  created_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  cover_letter: 'Cover Letter',
  certificate: 'Certificate',
  portfolio: 'Portfolio',
  reference: 'Reference Letter',
  other: 'Other',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  cv: 'bg-blue-100 text-blue-700',
  cover_letter: 'bg-green-100 text-green-700',
  certificate: 'bg-amber-100 text-amber-700',
  portfolio: 'bg-purple-100 text-purple-700',
  reference: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString();
}

export function CandidateDocumentsPage() {
  const { session } = useAuthStore();
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [uploadData, setUploadData] = useState({
    title: '',
    document_type: 'cv',
    file_url: '',
    file_name: '',
    visibility: 'consultant_visible',
  });

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/candidate-portal/documents', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [session]);

  const handleUpload = async () => {
    if (!uploadData.title || !uploadData.file_url || !uploadData.file_name) return;
    try {
      const res = await fetch('/api/candidate-portal/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(uploadData),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => [data.document, ...prev]);
        setShowUpload(false);
        setUploadData({
          title: '',
          document_type: 'cv',
          file_url: '',
          file_name: '',
          visibility: 'consultant_visible',
        });
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await fetch(`/api/candidate-portal/documents/${id}`, {
        method: 'DELETE',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const filteredDocs = filterType === 'all'
    ? documents
    : documents.filter(d => d.document_type === filterType);

  const docTypeIcons: Record<string, React.ReactNode> = {
    cv: <FileText className="w-5 h-5 text-blue-600" />,
    cover_letter: <FileText className="w-5 h-5 text-green-600" />,
    certificate: <FileText className="w-5 h-5 text-amber-600" />,
    portfolio: <FileText className="w-5 h-5 text-purple-600" />,
    reference: <FileText className="w-5 h-5 text-pink-600" />,
    other: <File className="w-5 h-5 text-gray-600" />,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#F5F5F5] animate-pulse rounded" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#F5F5F5] animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#171717]">My Documents</h1>
          <p className="text-sm text-[#737373] mt-1">Manage your CV, certificates, and other documents.</p>
        </div>
        <Button onClick={() => setShowUpload(true)} size="sm">
          <Upload className="w-4 h-4 mr-1" />
          Upload
        </Button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[#171717]">Upload Document</h3>
            <button onClick={() => setShowUpload(false)} className="text-[#737373] hover:text-[#171717]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">Title</label>
              <input
                type="text"
                value={uploadData.title}
                onChange={e => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="e.g., My Resume 2026"
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C108AB]"
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">Document Type</label>
              <Select
                value={uploadData.document_type}
                onChange={e => setUploadData({ ...uploadData, document_type: e.target.value })}
                options={Object.entries(DOC_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">File URL</label>
              <input
                type="text"
                value={uploadData.file_url}
                onChange={e => setUploadData({ ...uploadData, file_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C108AB]"
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">File Name</label>
              <input
                type="text"
                value={uploadData.file_name}
                onChange={e => setUploadData({ ...uploadData, file_name: e.target.value })}
                placeholder="resume.pdf"
                className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C108AB]"
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1.5">Visibility</label>
              <Select
                value={uploadData.visibility}
                onChange={e => setUploadData({ ...uploadData, visibility: e.target.value })}
                options={[
                  { value: 'private', label: 'Private (just me)' },
                  { value: 'consultant_visible', label: 'Consultant Visible' },
                  { value: 'client_visible', label: 'Client Visible' },
                ]}
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={handleUpload} disabled={!uploadData.title || !uploadData.file_url}>
              <Upload className="w-4 h-4 mr-1" />
              Upload Document
            </Button>
          </div>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            filterType === 'all' ? 'bg-[#C108AB] text-white' : 'bg-[#F5F5F5] text-[#737373] hover:bg-[#EBEBEB]'
          }`}
          style={{ borderRadius: 0 }}
        >
          All
        </button>
        {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filterType === value ? 'bg-[#C108AB] text-white' : 'bg-[#F5F5F5] text-[#737373] hover:bg-[#EBEBEB]'
            }`}
            style={{ borderRadius: 0 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-10 h-10 text-[#D4D4D4]" />}
          title="No documents yet"
          description="Upload your CV, certificates, and other documents to share with recruiters."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredDocs.map(doc => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#F5F5F5] flex items-center justify-center flex-shrink-0" style={{ borderRadius: 0 }}>
                  {docTypeIcons[doc.document_type] || docTypeIcons.other}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-[#171717] truncate">{doc.title}</span>
                    {doc.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-0.5" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs ${DOC_TYPE_COLORS[doc.document_type] || DOC_TYPE_COLORS.other}`}>
                      {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </Badge>
                    <span className="text-xs text-[#A3A3A3]">{formatFileSize(doc.file_size)}</span>
                  </div>
                  <p className="text-xs text-[#737373] truncate">{doc.file_name}</p>
                  {doc.expiry_date && (
                    <p className="text-xs text-amber-600 mt-1">
                      Expires: {formatDate(doc.expiry_date)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-[#E5E5E5]">
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="xs">
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </a>
                <a href={doc.file_url} download>
                  <Button variant="ghost" size="xs">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </a>
                <Button variant="ghost" size="xs" onClick={() => handleDelete(doc.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CandidateDocumentsPage;