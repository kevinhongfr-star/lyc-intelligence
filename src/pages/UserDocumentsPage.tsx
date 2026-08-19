/**
 * V4.5.2 — DOCUMENTS PAGE
 *
 * Route: /app/documents (inside LeaderPortalLayout auth guard, but renders
 * its own V1 3-column app shell — same pattern as V4 milestones/coaching).
 *
 * 3-column app shell (V1 line-art system):
 *   LEFT (220)  — Workspace / Depth / Human Layer / Account nav groups
 *                 (Documents active)
 *   MAIN        — Page header, upload drop zone, document list (bordered
 *                 rows: name · type · size · date · status · actions)
 *   RIGHT (280) — Storage used (+2px progress bar), Supported formats,
 *                 NEXUS tip (italic serif)
 *
 * All upload/delete/storage logic preserved verbatim. Only the rendering
 * surface changes. DocumentUploader is a separate V1-re-skinned component.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import { DocumentUploader } from '../components/documents/DocumentUploader';
import {
  uploadDocument,
  getUserDocuments,
  deleteDocument,
  getMaxDocumentsForTier,
  Document,
  DOCUMENT_TYPE_LABELS,
} from '../services/documentService';
import { useAuthStore } from '../stores/authStore';
import { toast } from '@/stores/toastStore';
import { V1 } from '@/styles/v1-tokens';

// V1 storage cap (presentation-layer constant; backend limits unchanged)
const STORAGE_CAP_MB = 500;
const SUPPORTED_FORMATS = ['PDF', 'DOCX', 'TXT', 'MD', 'CSV'];

type DocStatus = 'Processed' | 'Processing' | 'Failed';

function docStatus(doc: Document): DocStatus {
  // Derive a status from the existing data model. Backend doesn't expose
  // a real async status today, so we infer from extracted_text presence.
  if (doc.extracted_text && doc.extracted_text.trim().length > 0) return 'Processed';
  return 'Processing';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatUploadedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const tier = profile?.tier || 'explorer';
  const maxDocs = getMaxDocumentsForTier(tier);
  const canUpload = tier !== 'explorer' && documents.length < maxDocs;

  // Storage summary (presentation only)
  const usedBytes = useMemo(
    () => documents.reduce((sum, d) => sum + (d.file_size_bytes || 0), 0),
    [documents],
  );
  const usedMB = usedBytes / (1024 * 1024);
  const usedPct = Math.min(100, (usedMB / STORAGE_CAP_MB) * 100);

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

  const handleUpload = async (file: File, type: any) => {
    if (!user) return;
    setIsUploading(true);
    try {
      const doc = await uploadDocument(file, type as any, user.id);
      if (doc) {
        toast.success('Document uploaded successfully');
        await loadDocuments();
      }
    } catch (e: any) {
      toast.error('Failed to upload document:' + (e.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (deletingId !== docId) {
      setDeletingId(docId);
      return;
    }
    const success = await deleteDocument(docId);
    setDeletingId(null);
    if (success) {
      toast.success('Document deleted');
      await loadDocuments();
    } else {
      toast.error('Failed to delete document');
    }
  };

  const cancelDelete = () => setDeletingId(null);

  // ── Explorer tier: upgrade prompt (V1 editorial) ──
  if (tier === 'explorer') {
    return (
      <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
        <SEO page="documents" />
        <SkipToContent />
        <DocsNav user={user} profile={profile} />
        <main id="main-content" tabIndex={-1} style={{ marginTop: V1.navHeight }}>
          <div className="docs-enter" style={{
            maxWidth: 560, margin: '0 auto', padding: '96px 24px', textAlign: 'center',
          }}>
            <div aria-hidden="true" style={{
              width: 56, height: 56, margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${V1.borderStrong}`,
              color: V1.textMuted, fontFamily: V1.monoFont, fontSize: 22,
            }}>
              ▢
            </div>
            <div className="v1-eyebrow" style={{ marginBottom: 12 }}>Workspace</div>
            <h1 className="v1-display" style={{
              fontFamily: V1.displayFont, fontSize: V1.textH1,
              color: V1.text, fontWeight: V1.fwRegular,
              letterSpacing: V1.trackingTight, lineHeight: V1.leadingDisplay,
              margin: '0 0 16px',
            }}>
              Document storage opens at the Starter tier.
            </h1>
            <p style={{
              fontFamily: V1.bodyFont, fontSize: V1.textBodyLg,
              color: V1.textSecondary, lineHeight: V1.leadingBody,
              margin: '0 0 32px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Upgrade to upload and analyze your documents. Conversation comes
              first either way — documents just enrich the baseline picture.
            </p>
            <Link to="/pricing" className="v1-btn v1-btn-primary" style={primaryBtnStyle}>
              See membership <span aria-hidden="true">→</span>
            </Link>
          </div>
        </main>
        <DocsRevealKeyframes />
      </div>
    );
  }

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="documents" />
      <SkipToContent />
      <DocsNav user={user} profile={profile} />

      {/* ══════════ 3-COLUMN APP SHELL ══════════ */}
      <div
        className="v1-appshell"
        style={{ marginTop: V1.navHeight, minHeight: `calc(100vh - ${V1.navHeight}px)` }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <aside className="v1-appshell-col" aria-label="Workspace navigation">
          <div className="v1-sidebar-sticky">
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Workspace</div>
              <Link to="/nexus/chat" className="v1-sidebar-link">Chat</Link>
              <Link to="/nexus/lenses" className="v1-sidebar-link">Lenses</Link>
              <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
              <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
              <Link to="/app/documents" className="v1-sidebar-link v1-active">Documents</Link>
              <Link to="/nexus/settings" className="v1-sidebar-link">Settings</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map((area) => (
                <Link to="/nexus/lenses" key={area} className="v1-sidebar-link">
                  {area}
                  <span className="v1-sidebar-meta">practice</span>
                </Link>
              ))}
              <Link to="/nexus/lenses" className="v1-sidebar-link">
                All eleven lenses <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Human Layer</div>
              <Link to="/nexus/coaching" className="v1-sidebar-link">Coaching hours</Link>
              <Link to="/app/bookings" className="v1-sidebar-link">Upcoming sessions</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="v1-appshell-main" id="main-content" tabIndex={-1}>
          <div style={{ padding: V1.shellPad, maxWidth: V1.contentMax, width: '100%' }}>
            {/* ═══ Page header ═══ */}
            <div className="docs-enter" style={{ marginBottom: V1.shellPad }}>
              <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Workspace</div>
              <h1 className="v1-display" style={{
                fontFamily: V1.displayFont, fontSize: V1.textH1,
                margin: '0 0 10px', letterSpacing: V1.trackingTight,
                lineHeight: V1.leadingDisplay, color: V1.text,
                fontWeight: V1.fwRegular,
              }}>
                Your documents.
              </h1>
              <p style={{
                fontFamily: V1.bodyFont, fontSize: V1.textBodyLg,
                color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody,
                maxWidth: 560,
              }}>
                Reference material NEXUS can draw on. Documents enrich the
                baseline picture but aren't required — conversation comes first.
              </p>
              <div className="v1-mono" style={{
                fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: V1.textMuted,
                marginTop: 12,
              }}>
                {documents.length} of {tier === 'council' ? 'unlimited' : maxDocs} documents
              </div>
            </div>

            {/* ═══ Upload drop zone ═══ */}
            <div className="docs-enter docs-enter-d1" style={{ marginBottom: V1.shellPad }}>
              {canUpload ? (
                <DocumentUploader
                  onUpload={handleUpload}
                  isUploading={isUploading}
                />
              ) : (
                <div style={{
                  border: `1px dashed ${V1.borderStrong}`,
                  padding: '32px 24px', textAlign: 'center',
                  background: V1.surface,
                }}>
                  <p style={{
                    fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
                    color: V1.textSecondary, margin: 0,
                  }}>
                    You've reached your document limit for this tier.{' '}
                    <Link to="/pricing" style={{ color: V1.teal700, textDecoration: 'none' }}>
                      Upgrade for more →
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* ═══ Document list ═══ */}
            <section className="docs-enter docs-enter-d2" aria-label="Your documents">
              <SectionLabel>Documents</SectionLabel>

              {isLoading ? (
                <SkeletonRows count={3} />
              ) : documents.length === 0 ? (
                <EmptyDocsState />
              ) : (
                <div style={{ borderTop: `1px solid ${V1.border}` }}>
                  {documents.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      isDeleting={deletingId === doc.id}
                      onAskDelete={() => handleDelete(doc.id)}
                      onConfirmDelete={() => handleDelete(doc.id)}
                      onCancelDelete={cancelDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col" aria-label="Documents context">
          <div className="v1-sidebar-sticky">
            {/* 1. Storage used */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Storage used</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontFamily: V1.displayFont, fontSize: 28,
                    color: V1.text, lineHeight: 1, fontWeight: V1.fwRegular,
                  }}>
                    {usedMB.toFixed(1)}
                  </span>
                  <span className="v1-mono" style={{
                    fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase', color: V1.textMuted,
                  }}>
                    of {STORAGE_CAP_MB} MB
                  </span>
                </div>
                {/* 2px progress bar */}
                <div style={{ height: 2, background: V1.borderSubtle, overflow: 'hidden' }}>
                  <div className="docs-progress-fill" style={{
                    height: '100%', width: `${usedPct}%`,
                    background: V1.teal600,
                  }} />
                </div>
                <div className="v1-mono" style={{
                  fontSize: V1.textCaption, color: V1.textDim,
                  letterSpacing: V1.trackingMono,
                }}>
                  {usedPct.toFixed(1)}% used
                </div>
              </div>
            </div>

            {/* 2. Supported formats */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Supported formats</div>
              <ul style={{
                listStyle: 'none', padding: 0, margin: '8px 0 0',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {SUPPORTED_FORMATS.map((fmt) => (
                  <li key={fmt} className="v1-mono" style={{
                    fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase', color: V1.textSecondary,
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{fmt}</span>
                    <span style={{ color: V1.teal700 }}>✓</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. NEXUS tip */}
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">NEXUS tip</div>
              <p style={{
                fontFamily: V1.displayFont, fontStyle: 'italic',
                fontSize: V1.textBodySm, color: V1.textSecondary,
                lineHeight: 1.55, margin: '8px 0 0',
                paddingLeft: 14, borderLeft: `1px solid ${V1.teal300}`,
              }}>
                Documents enrich the baseline picture but aren't required —
                conversation comes first.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <DocsRevealKeyframes />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '14px 28px', background: V1.teal800, color: V1.white,
  border: 'none', fontSize: 15, fontWeight: V1.fwSemibold,
  fontFamily: V1.bodyFont, textDecoration: 'none',
  minHeight: 48, cursor: 'pointer',
  transition: `background ${V1.durFast}ms ${V1.ease}`,
};

function DocsNav({ user, profile }: { user: any; profile: any }) {
  return (
    <nav className="v1-nav" aria-label="Primary">
      <div className="v1-nav-inner">
        <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
          NEXUS<span className="v1-dot">.</span>
        </Link>
        <div className="v1-nav-links v1-hidden-mobile">
          <Link to="/nexus/chat">Chat</Link>
          <Link to="/nexus/lenses">Lenses</Link>
          <Link to="/nexus/milestones">Milestones</Link>
        </div>
        <div className="v1-nav-cta">
          {!user ? (
            <Link to="/login" className="v1-btn v1-btn-secondary">Sign in</Link>
          ) : (
            <span className="v1-avatar v1-avatar-sm" title={profile?.name || user?.email || ''}>
              {(profile?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

function DocsRevealKeyframes() {
  return (
    <style>{`
      @keyframes docs-reveal { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      .docs-enter { animation: docs-reveal ${V1.durNormal}ms ${V1.ease} both; }
      .docs-enter-d1 { animation: docs-reveal ${V1.durNormal}ms ${V1.ease} 80ms both; }
      .docs-enter-d2 { animation: docs-reveal ${V1.durNormal}ms ${V1.ease} 160ms both; }
      @keyframes docs-fill { from { width: 0%; } }
      .docs-progress-fill { animation: docs-fill 500ms ${V1.ease} both; }
      /* V4-specified TEAL focus ring scoped */
      .v1-scope :focus-visible {
        outline: 2px solid ${V1.teal600} !important;
        outline-offset: 2px;
        border-radius: 0;
      }
      /* Card hover: border shift only (no shadow/lift) */
      .v1-scope .v1-card-hover {
        transition: border-color ${V1.durFast}ms ${V1.ease};
      }
      .v1-scope .v1-card-hover:hover {
        border-color: ${V1.teal600};
      }
      /* Shimmer skeleton */
      @keyframes docs-shimmer {
        0% { background-position: -480px 0; }
        100% { background-position: 480px 0; }
      }
      .docs-skeleton {
        background: linear-gradient(90deg, ${V1.ink50} 0%, ${V1.ink100} 50%, ${V1.ink50} 100%);
        background-size: 960px 100%;
        animation: docs-shimmer 1.4s linear infinite;
      }
      @media (max-width: 768px) {
        .v1-scope .v1-appshell-main > div { padding: 20px 16px; }
      }
    `}</style>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 16,
    }}>
      <h2 className="v1-display" style={{
        fontFamily: V1.displayFont, fontSize: V1.textH3,
        margin: 0, color: V1.text, fontWeight: V1.fwRegular,
      }}>
        {children}
      </h2>
    </div>
  );
}

function DocRow({
  doc,
  isDeleting,
  onAskDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  doc: Document;
  isDeleting: boolean;
  onAskDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const status = docStatus(doc);
  return (
    <div className="v1-card-hover" style={{
      borderBottom: `1px solid ${V1.border}`,
      padding: '18px 0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      {/* Left: name + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        <div aria-hidden="true" className="v1-mono" style={{
          width: 36, height: 36, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${V1.borderStrong}`,
          color: V1.teal700, fontSize: 14,
        }}>
          ▢
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: V1.displayFont, fontSize: 17,
            color: V1.text, fontWeight: V1.fwRegular, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {doc.name}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 4,
            flexWrap: 'wrap',
          }}>
            <span className="v1-mono" style={metaStyle}>
              {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS]}
            </span>
            <Sep />
            <span className="v1-mono" style={metaStyle}>
              {formatBytes(doc.file_size_bytes)}
            </span>
            <Sep />
            <span className="v1-mono" style={metaStyle}>
              {formatUploadedDate(doc.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: status + actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <StatusBadge status={status} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="v1-btn v1-btn-secondary"
            style={viewActionStyle}
          >
            View
          </a>
          {isDeleting ? (
            <>
              <button
                onClick={onConfirmDelete}
                style={confirmDeleteStyle}
                className="v1-btn"
              >
                Confirm delete
              </button>
              <button
                onClick={onCancelDelete}
                style={cancelActionStyle}
                className="v1-btn"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onAskDelete}
              style={deleteActionStyle}
              className="v1-btn"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const metaStyle: React.CSSProperties = {
  fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
  textTransform: 'uppercase', color: V1.textMuted,
};

function Sep() {
  return <span style={{ color: V1.border, fontSize: 10 }}>·</span>;
}

function StatusBadge({ status }: { status: DocStatus }) {
  const color =
    status === 'Processed' ? V1.teal700 :
    status === 'Processing' ? V1.fuchsia600 :
    V1.fuchsia700;
  return (
    <span className="v1-mono" style={{
      fontSize: V1.textMonoPx, letterSpacing: V1.trackingMono,
      textTransform: 'uppercase', color,
      border: `1px solid ${V1.borderStrong}`,
      padding: '3px 8px', background: V1.surface,
    }}>
      {status}
    </span>
  );
}

const viewActionStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '8px 14px', background: 'transparent',
  border: `1px solid ${V1.borderStrong}`, color: V1.textSecondary,
  fontSize: V1.textBodySm, fontFamily: V1.bodyFont,
  cursor: 'pointer', textDecoration: 'none', minHeight: 36,
};

const deleteActionStyle: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent',
  border: `1px solid ${V1.fuchsia600}`, color: V1.fuchsia700,
  fontSize: V1.textBodySm, fontFamily: V1.bodyFont,
  cursor: 'pointer', minHeight: 36,
};

const confirmDeleteStyle: React.CSSProperties = {
  padding: '8px 14px', background: V1.fuchsia600, color: V1.white,
  border: `1px solid ${V1.fuchsia600}`,
  fontSize: V1.textBodySm, fontFamily: V1.bodyFont,
  fontWeight: V1.fwMedium, cursor: 'pointer', minHeight: 36,
};

const cancelActionStyle: React.CSSProperties = {
  padding: '8px 14px', background: 'transparent',
  border: `1px solid ${V1.borderStrong}`, color: V1.textMuted,
  fontSize: V1.textBodySm, fontFamily: V1.bodyFont,
  cursor: 'pointer', minHeight: 36,
};

function EmptyDocsState() {
  return (
    <div style={{
      border: `1px dashed ${V1.borderStrong}`, padding: '64px 24px',
      textAlign: 'center', background: V1.surface,
    }}>
      <div aria-hidden="true" style={{
        width: 48, height: 48, margin: '0 auto 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${V1.borderStrong}`,
        color: V1.textMuted, fontFamily: V1.monoFont, fontSize: 18,
      }}>
        ▢
      </div>
      <h3 className="v1-display" style={{
        fontFamily: V1.displayFont, fontSize: V1.textH3,
        color: V1.text, fontWeight: V1.fwRegular, margin: '0 0 8px',
      }}>
        No documents yet.
      </h3>
      <p style={{
        fontFamily: V1.bodyFont, fontSize: V1.textBodySm,
        color: V1.textSecondary, margin: '0 auto', maxWidth: 420,
        lineHeight: 1.5,
      }}>
        Upload a CV, JD, or bio to give NEXUS context. Conversation still
        comes first — these just enrich the baseline.
      </p>
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div style={{ borderTop: `1px solid ${V1.border}` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          borderBottom: `1px solid ${V1.border}`,
          padding: '18px 0',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div className="docs-skeleton" style={{ width: 36, height: 36, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="docs-skeleton" style={{ width: '40%', height: 14 }} />
            <div className="docs-skeleton" style={{ width: '55%', height: 10 }} />
          </div>
          <div className="docs-skeleton" style={{ width: 80, height: 22 }} />
        </div>
      ))}
    </div>
  );
}
