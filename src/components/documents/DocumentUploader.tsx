/**
 * V4.5.2 — Document uploader (V1 re-skin)
 *
 * Shared drop-zone + type selector. All upload logic, file validation,
 * type catalog, and drag/drop behavior preserved verbatim. Only the
 * rendering surface changes (V1 line-art system: dashed border, text
 * symbols, mono labels, teal primary, 0px radius, no shadows).
 */
import React, { useState } from 'react';
import { DocumentType, DOCUMENT_TYPE_LABELS } from '../../services/documentService';
import { V1 } from '@/styles/v1-tokens';

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
  maxSizeMB = 10,
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
    <div className="v1-scope" style={{ background: V1.surface, border: `1px solid ${V1.border}` }}>
      {selectedFile ? (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected file row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, padding: '14px 16px',
            background: V1.bg, border: `1px solid ${V1.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div className="v1-mono" style={{
                width: 32, height: 32, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${V1.borderStrong}`,
                color: V1.teal700, fontSize: 14,
              }} aria-hidden="true">
                ↑
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 14, color: V1.text, margin: 0,
                  fontWeight: V1.fwMedium, fontFamily: V1.bodyFont,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{selectedFile.name}</p>
                <p className="v1-mono" style={{
                  fontSize: V1.textCaption, color: V1.textMuted,
                  margin: '4px 0 0', letterSpacing: V1.trackingMono,
                }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              aria-label="Remove file"
              className="v1-mono"
              style={{
                background: 'none', border: 'none',
                color: V1.textMuted, cursor: isUploading ? 'not-allowed' : 'pointer',
                padding: '4px 8px', fontSize: V1.textBodySm,
                fontFamily: V1.bodyFont,
              }}
            >
              Remove
            </button>
          </div>

          {/* Type selector */}
          <div>
            <label className="v1-mono" style={{
              display: 'block', fontSize: V1.textMonoPx,
              letterSpacing: V1.trackingMono, textTransform: 'uppercase',
              color: V1.textMuted, marginBottom: 8,
            }}>
              Document type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              disabled={isUploading}
              style={{
                width: '100%', padding: '12px 16px',
                background: V1.bg, border: `1px solid ${V1.borderStrong}`,
                color: V1.text, fontSize: 15, outline: 'none',
                minHeight: 44, fontFamily: V1.bodyFont,
                boxSizing: 'border-box', cursor: 'pointer',
                appearance: 'none', WebkitAppearance: 'none',
              }}
            >
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              border: `1px solid ${V1.fuchsia600}`,
              background: V1.fuchsia50,
              color: V1.fuchsia700,
              fontSize: V1.textBodySm, fontFamily: V1.bodyFont,
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isUploading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 24px',
              background: V1.teal800, color: V1.white,
              border: 'none', fontSize: 15, fontWeight: V1.fwSemibold,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.7 : 1,
              minHeight: 48, fontFamily: V1.bodyFont,
              transition: `background ${V1.durFast}ms ${V1.ease}`,
            }}
            onMouseEnter={(e) => !isUploading && (e.currentTarget.style.background = V1.teal900)}
            onMouseLeave={(e) => (e.currentTarget.style.background = V1.teal800)}
          >
            {isUploading ? 'Uploading...' : 'Upload document →'}
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `1px dashed ${dragOver ? V1.teal600 : V1.borderStrong}`,
            padding: '48px 24px',
            textAlign: 'center',
            background: dragOver ? V1.teal50 : V1.surface,
            transition: `border-color ${V1.durFast}ms ${V1.ease}, background ${V1.durFast}ms ${V1.ease}`,
          }}
        >
          {/* Line-art upload mark */}
          <div aria-hidden="true" style={{
            width: 48, height: 48, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${V1.borderStrong}`,
            color: dragOver ? V1.teal700 : V1.textMuted,
            fontFamily: V1.monoFont, fontSize: 20,
          }}>
            ↑
          </div>
          <p style={{
            fontFamily: V1.bodyFont, fontSize: V1.textBody,
            color: V1.text, margin: '0 0 12px',
          }}>
            Drag files here or{' '}
            <label style={{
              display: 'inline-block',
              color: V1.teal700,
              fontWeight: V1.fwMedium,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}>
              click to upload
              <input type="file" accept={accept} hidden onChange={handleFileSelect} />
            </label>
          </p>
          <p className="v1-mono" style={{
            fontSize: V1.textCaption, color: V1.textMuted,
            letterSpacing: V1.trackingMono, textTransform: 'uppercase',
            margin: 0,
          }}>
            PDF, DOCX, TXT · max {maxSizeMB}MB
          </p>
        </div>
      )}
    </div>
  );
}
