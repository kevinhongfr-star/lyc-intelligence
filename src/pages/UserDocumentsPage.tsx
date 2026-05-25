
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import { 
  uploadDocument, 
  getUserDocuments, 
  deleteDocument, 
  getMaxDocumentsForTier, 
  Document, 
  DOCUMENT_TYPE_LABELS 
} from '../services/documentService';
import { useAuthStore } from '../stores/authStore';
import { FileText, Trash2, Calendar, ExternalLink } from 'lucide-react';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px',
  success: '#10B981'
};

export function DocumentsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const tier = profile?.tier || 'free';
  const maxDocs = getMaxDocumentsForTier(tier);
  const canUpload = tier !== 'free' && documents.length < maxDocs;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const docs = await getUserDocuments(user.id);
      setDocuments(docs);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File, type: string) => {
    if (!user) return;

    setIsUploading(true);
    try {
      const doc = await uploadDocument(file, type as any, user.id);
      if (doc) {
        await loadDocuments();
      }
    } catch (e) {
      console.error('Failed to upload document:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const success = await deleteDocument(docId);
    if (success) {
      await loadDocuments();
    }
  };

  if (tier === 'free') {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, padding: '48px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <FileText style={{ width: 64, height: 64, color: DS.muted, margin: '0 auto 24px' }} />
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', color: DS.text, marginBottom: '12px' }}>
            Document Storage
          </h1>
          <p style={{ fontSize: '16px', color: DS.muted, marginBottom: '32px' }}>
            Upgrade to Basic or Pro to upload and analyze your documents.
          </p>
          <button 
            onClick={() => navigate('/pricing')} 
            style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 28px', 
              background: DS.accent, 
              color: '#FFF', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '15px', 
              fontWeight: 600, 
              cursor: 'pointer'
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', color: DS.text, marginBottom: '4px' }}>
              Documents
            </h1>
            <p style={{ fontSize: '14px', color: DS.muted, margin: 0 }}>
              {documents.length} of {tier === 'council' ? 'unlimited' : maxDocs} documents
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <DocumentUploader 
            onUpload={handleUpload} 
            isUploading={isUploading} 
          />
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '14px', color: DS.muted }}>Loading...</div>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius }}>
            <FileText style={{ width: 48, height: 48, color: DS.muted, margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px', color: DS.textSecondary }}>No documents uploaded yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{
                padding: '16px 20px',
                background: DS.card,
                border: `1px solid ${DS.border}`,
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `${DS.accent}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText style={{ width: 18, height: 18, color: DS.accent }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: DS.text }}>{doc.name}</div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      fontSize: '12px', 
                      color: DS.muted, 
                      marginTop: '2px' 
                    }}>
                      <span>{DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS]}</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar style={{ width: 12, height: 12 }} />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a 
                    href={doc.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'transparent',
                      border: `1px solid ${DS.border}`,
                      borderRadius: '6px',
                      color: DS.textSecondary,
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = DS.accent;
                      e.currentTarget.style.color = DS.accent;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = DS.border;
                      e.currentTarget.style.color = DS.textSecondary;
                    }}
                  >
                    <ExternalLink style={{ width: 14, height: 14 }} />
                    View
                  </a>
                  <button 
                    onClick={() => handleDelete(doc.id)} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: 'transparent',
                      border: '1px solid #333333',
                      borderRadius: '6px',
                      color: '#EF4444',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#EF4444';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#333333';
                    }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
