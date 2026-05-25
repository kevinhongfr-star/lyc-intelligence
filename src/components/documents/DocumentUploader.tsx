
import React, { useState } from 'react';
import { Upload, X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '../../services/documentService';

const DS = {
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  error: '#EF4444',
  success: '#10B981',
  radius: '12px'
};

interface Props {
  onUpload: (file: File, type: DocumentType) => void;
  isUploading: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export function DocumentUploader({ 
  onUpload, 
  isUploading, 
  accept = '.pdf,.docx,.txt',
  maxSizeMB = 10 
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>('CV');
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) validateAndSelectFile(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const validateAndSelectFile = (file: File) => {
    setError(null);
    
    // Size check
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large (max ${maxSizeMB}MB)`);
      return;
    }

    // Type check
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !['.pdf','.docx','.txt'].some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError('Invalid file type (PDF, DOCX, TXT only)');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile, selectedType);
      setSelectedFile(null);
      setSelectedType('CV');
    }
  };

  return (
    <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
      {selectedFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText style={{ width: 24, height: 24, color: DS.accent }} />
              <div>
                <p style={{ fontSize: '14px', color: DS.text, margin: 0, fontWeight: 500 }}>{selectedFile.name}</p>
                <p style={{ fontSize: '12px', color: DS.muted, margin: '4px 0 0' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedFile(null)} disabled={isUploading} style={{ background: 'none', border: 'none', color: DS.muted, cursor: 'pointer', padding: '4px' }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: DS.muted, marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Document Type
            </label>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: DS.bg,
                border: `1px solid ${DS.border}`,
                borderRadius: '8px',
                color: DS.text,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', background: `${DS.error}15`, border: `1px solid ${DS.error}30`, borderRadius: '8px' }}>
              <AlertCircle style={{ width: 16, height: 16, color: DS.error }} />
              <span style={{ fontSize: '13px', color: DS.textSecondary }}>{error}</span>
            </div>
          )}

          <button 
            onClick={handleSubmit} 
            disabled={isUploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: DS.accent,
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.6 : 1
            }}
          >
            {isUploading ? (
              <>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? DS.accent : DS.border}`,
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            background: dragOver ? `${DS.accent}10` : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <Upload style={{ width: 36, height: 36, color: dragOver ? DS.accent : DS.muted, marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', color: DS.text, marginBottom: '8px' }}>
            Drag and drop your file here, or
          </p>
          <label style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: `${DS.accent}20`,
            color: DS.accent,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            Browse Files
            <input type="file" accept={accept} hidden onChange={handleFileSelect} />
          </label>
          <p style={{ fontSize: '12px', color: DS.muted, marginTop: '16px' }}>
            PDF, DOCX, or TXT (max {maxSizeMB}MB)
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
