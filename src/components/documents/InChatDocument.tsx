import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { V1 } from '@/styles/v1-tokens';
import '@/styles/v1-motion.css';
import { ThreeDots } from '@/components/nexus/V1LoadingStates';

interface InChatUploadOverlayProps {
  isActive: boolean;
  onDrop?: (files: File[]) => void;
  children?: ReactNode;
}

export const InChatUploadOverlay: React.FC<InChatUploadOverlayProps> = ({
  isActive,
  onDrop,
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (onDrop && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        onDrop(files);
      }
    },
    [onDrop]
  );

  return (
    <div
      ref={wrapperRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {children}
      {(isActive || dragOver) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            border: `2px dashed ${V1.teal600}`,
            borderRadius: V1.radius,
            backgroundColor: 'rgba(224, 242, 241, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px',
            padding: '32px',
          }}
        >
          <div
            style={{
              fontFamily: V1.monoFont,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: V1.teal700,
            }}
          >
            Drop to upload
          </div>
          <div
            style={{
              fontFamily: V1.displayFont,
              fontSize: '32px',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: V1.teal900,
            }}
          >
            Add this document to the conversation
          </div>
          <div
            style={{
              fontFamily: V1.bodyFont,
              fontSize: '15px',
              color: V1.ink700,
              textAlign: 'center',
              maxWidth: '440px',
            }}
          >
            NEXUS will read and reference it throughout. Pro+ feature. · Supported: PDF, TXT, MD, DOCX.
          </div>
        </div>
      )}
    </div>
  );
};

interface UploadingIndicatorProps {
  filename: string;
  sizeKB: number;
  progress: number;
  onCancel?: () => void;
}

export const UploadingIndicator: React.FC<UploadingIndicatorProps> = ({
  filename,
  sizeKB,
  progress,
  onCancel,
}) => {
  return (
    <div
      style={{
        padding: '8px 24px',
        borderTop: `1px solid ${V1.ink100}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '6px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: V1.monoFont,
              fontSize: '14px',
              color: V1.teal600,
            }}
          >
            +
          </span>
          <span
            style={{
              fontFamily: V1.bodyFont,
              fontSize: '14px',
              color: V1.ink900,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {filename}
          </span>
          <span
            style={{
              fontFamily: V1.monoFont,
              fontSize: '11px',
              color: V1.ink400,
              whiteSpace: 'nowrap',
            }}
          >
            {sizeKB} KB
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.7rem',
            color: V1.ink500,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            whiteSpace: 'nowrap',
          }}
        >
          Cancel ×
        </button>
      </div>
      <div
        style={{
          width: '100%',
          height: '2px',
          backgroundColor: V1.ink100,
          borderRadius: V1.radius,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: V1.teal600,
            transition: `width 200ms ${V1.ease}`,
          }}
        />
      </div>
    </div>
  );
};

interface DocumentMessageCardProps {
  filename: string;
  sizeKB: number;
  onView?: () => void;
}

export const DocumentMessageCard: React.FC<DocumentMessageCardProps> = ({
  filename,
  sizeKB,
  onView,
}) => {
  return (
    <div style={{ marginLeft: '44px' }}>
      <div
        style={{
          border: `1px solid ${V1.ink200}`,
          borderRadius: V1.radius,
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: V1.white,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '40px',
            border: `1px solid ${V1.ink300}`,
            borderRadius: V1.radius,
            backgroundColor: V1.ink50,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '8px',
              height: '8px',
              borderLeft: `1px solid ${V1.ink300}`,
              borderBottom: `1px solid ${V1.ink300}`,
              backgroundColor: V1.white,
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: V1.displayFont,
              fontSize: '15px',
              color: V1.ink900,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {filename}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontFamily: V1.monoFont,
                fontSize: '11px',
                color: V1.ink500,
              }}
            >
              {sizeKB} KB
            </span>
            <button
              type="button"
              onClick={onView}
              style={{
                fontFamily: V1.monoFont,
                fontSize: '11px',
                color: V1.teal600,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                letterSpacing: '0.04em',
              }}
            >
              View →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DocumentViewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filename?: string;
  previewContent?: string;
  fileType?: string;
}

const PLACEHOLDER_PREVIEW = `Document preview
======================================================================

Section 1 — Overview

This document outlines the strategic priorities for the engagement,
including key milestones, success metrics, and timeline considerations.
The framework below establishes a shared vocabulary for the review
process that follows.

1.1 Context Setting

The mandate spans a 12-week horizon with three checkpoints: intake,
mid-point calibration, and final shortlist presentation. Each phase
carries specific deliverables documented in the appendices.

1.2 Success Profile

Candidate specifications are defined across four dimensions. The
weighting emphasizes leadership orientation (40%) followed by
functional expertise (30%), cultural alignment (20%), and pace
compatibility (10%).`;

export const DocumentViewerDrawer: React.FC<DocumentViewerDrawerProps> = ({
  isOpen,
  onClose,
  filename = 'Untitled document',
  previewContent,
  fileType = 'txt',
}) => {
  if (!isOpen) return null;

  const displayContent =
    previewContent ??
    (fileType.toLowerCase() === 'pdf'
      ? '[PDF preview: first page summary]'
      : PLACEHOLDER_PREVIEW);

  return (
    <>
      <div
        className="v1-modal-bg"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          backgroundColor: 'rgba(15, 17, 21, 0.32)',
        }}
      />
      <aside
        className="v1-modal-panel"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100%',
          width: '360px',
          maxWidth: '100%',
          backgroundColor: V1.white,
          borderLeft: `1px solid ${V1.ink200}`,
          zIndex: 81,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            padding: '20px',
            borderBottom: `1px solid ${V1.ink100}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: V1.teal600,
              }}
            >
              Document
            </span>
            <span
              style={{
                fontFamily: V1.displayFont,
                fontSize: '20px',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: V1.ink900,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {filename}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            style={{
              fontSize: '24px',
              lineHeight: 1,
              color: V1.ink500,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              fontFamily: V1.bodyFont,
            }}
          >
            ×
          </button>
        </header>
        <div
          style={{
            padding: '20px',
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span
              style={{
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: V1.ink500,
              }}
            >
              NEXUS is reading this
            </span>
            <ThreeDots />
          </div>
          <div
            style={{
              border: `1px solid ${V1.ink100}`,
              borderRadius: V1.radius,
              padding: '16px',
              fontFamily: V1.monoFont,
              fontSize: '13px',
              lineHeight: 1.6,
              color: V1.ink700,
              maxHeight: '320px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: V1.ink50,
            }}
          >
            {displayContent}
          </div>
        </div>
      </aside>
    </>
  );
};

export default DocumentViewerDrawer;
