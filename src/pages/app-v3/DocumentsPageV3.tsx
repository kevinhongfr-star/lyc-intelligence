import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { normalizeTier } from '@/config/tierConfig';
import { V3 } from '@/styles/v3-tokens';
import {
  Badge,
  Button,
  EmptyState,
  FormRow,
  IconButton,
  ListRow,
  Modal,
  MonoLabel,
  PageHeader,
  Select,
  Skeleton,
  Tabs,
} from '@/components/app-v3/ui';
import {
  DOCUMENT_TYPE_LABELS,
  deleteDocument,
  getMaxDocumentsForTier,
  getUserDocuments,
  uploadDocument,
  type Document,
  type DocumentType,
} from '@/services/documentService';

const TIER_CANONICAL_TO_LEGACY: Record<string, string> = {
  executive_introduction: 'explorer',
  professional: 'starter',
  executive: 'pro',
  council: 'executive',
  enterprise: 'council',
};

const DOC_TYPES_FOR_SELECT: DocumentType[] = [
  'CV',
  'LINKEDIN',
  'JD',
  'PERFORMANCE_REVIEW',
  'EXECUTIVE_BIO',
  'BOARD_PRESENTATION',
  'OTHER',
];

type TabKey = 'all' | DocumentType;

const DOC_TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'CV', label: 'CVs' },
  { key: 'LINKEDIN', label: 'LinkedIn' },
  { key: 'JD', label: 'JDs' },
  { key: 'PERFORMANCE_REVIEW', label: 'Performance' },
  { key: 'OTHER', label: 'Other' },
];

function docIconSvg() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 1.5h5.5l4 4V14.5c0 .3-.2.5-.5.5h-9c-.3 0-.5-.2-.5-.5V2c0-.3.2-.5.5-.5z" />
      <path d="M8.5 1.5V6H12.5" />
      <path d="M5 8h6" />
      <path d="M5 10.5h6" />
      <path d="M5 13h4" />
    </svg>
  );
}

function folderIconSvg() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 11c0-1.1.9-2 2-2h8l3 3h17c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V11z" />
    </svg>
  );
}

function trashIconSvg() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 4h10" />
      <path d="M5.5 4V2.5c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5V4" />
      <path d="M3.5 4l.5 7.5c0 .3.2.5.5.5h5c.3 0 .5-.2.5-.5L10.5 4" />
      <path d="M6 6.5v4" />
      <path d="M8 6.5v4" />
    </svg>
  );
}

function formatBytesMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb < 0.01 ? '<0.01' : mb.toFixed(2);
}

function estimateWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function DocumentsPageV3(): React.ReactElement {
  const { user, profile } = useAuthStore();
  const canonicalTier = normalizeTier(profile?.tier) ?? profile?.tier ?? 'executive_introduction';
  const legacyTier = TIER_CANONICAL_TO_LEGACY[canonicalTier ?? ''] ?? canonicalTier ?? 'explorer';
  const maxDocs = getMaxDocumentsForTier(legacyTier);

  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType>('CV');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDocs = async () => {
    if (!user?.id) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await getUserDocuments(user.id);
    setDocs(list);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        if (!cancelled) {
          setDocs([]);
          setLoading(false);
        }
        return;
      }
      const list = await getUserDocuments(user.id);
      if (!cancelled) {
        setDocs(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const docCount = docs.length;
  const storageMB = useMemo(
    () => docs.reduce((acc, d) => acc + d.file_size_bytes / (1024 * 1024), 0),
    [docs]
  );
  const extractedWords = useMemo(
    () => docs.reduce((acc, d) => acc + estimateWords(d.extracted_text), 0),
    [docs]
  );

  const isExplorer = maxDocs === 0;

  const filteredDocs = useMemo(() => {
    if (activeTab === 'all') return docs;
    return docs.filter((d) => d.type === activeTab);
  }, [docs, activeTab]);

  const tierBadgeVariant =
    canonicalTier === 'council' || canonicalTier === 'enterprise'
      ? 'tier-council'
      : canonicalTier === 'executive'
      ? 'tier-executive'
      : canonicalTier === 'professional'
      ? 'tier-pro'
      : 'status-draft';

  const handleUpload = async () => {
    if (!uploadFile || !user?.id) return;
    setUploadError(null);
    setUploading(true);
    const result = await uploadDocument(uploadFile, uploadType, user.id);
    setUploading(false);
    if (!result) {
      setUploadError('Upload failed. Please try again.');
      return;
    }
    setUploadOpen(false);
    setUploadFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await loadDocs();
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    await deleteDocument(deleteDoc.id);
    setDeleting(false);
    setDeleteDoc(null);
    await loadDocs();
  };

  return (
    <div
      style={{
        background: V3.cream,
        minHeight: '100vh',
        paddingTop: V3.appPageHeaderPad,
        paddingBottom: 64,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <PageHeader
        kicker="DOCUMENTS"
        title="Your reports & records."
        description="Readouts, debrief transcripts, and LYC-generated documents. Everything NEXUS uses to form its baseline picture of you."
        right={
          <Button variant="primary" size="large" onClick={() => !isExplorer && setUploadOpen(true)} disabled={isExplorer}>
            + Upload
          </Button>
        }
      />

      <div
        style={{
          maxWidth: V3.appContentMax,
          margin: '48px auto 0',
        }}
      >
        {loading ? (
          <div aria-busy style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="100%" height={56} />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="100%" height={56} />
            ))}
          </div>
        ) : isExplorer ? (
          <div
            style={{
              background: V3.white,
              border: `1px solid ${V3.ink200}`,
              padding: 32,
              maxWidth: V3.appContentMax,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 32,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Badge variant="status-draft">Explorer</Badge>
                <MonoLabel>STATUS-DRAFT</MonoLabel>
              </div>
              <div
                style={{
                  fontFamily: V3.displayFont,
                  fontSize: '26px',
                  fontWeight: V3.fwRegular,
                  color: V3.fuchsia700,
                  lineHeight: 1.2,
                  marginBottom: 12,
                }}
              >
                Upload is available on Starter tier and above.
              </div>
              <div
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '14px',
                  color: V3.ink500,
                  lineHeight: 1.6,
                  maxWidth: 520,
                }}
              >
                Start with 3 document slots at Starter, expand to 10 on Professional, 20 on Executive, unlimited at Council.
              </div>
            </div>
            <Button variant="dark-cta" to="/membership">
              View tiers
            </Button>
          </div>
        ) : (
          <>
            <div
              style={{
                height: 56,
                borderTop: `1px solid ${V3.ink200}`,
                borderBottom: `1px solid ${V3.ink200}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                alignItems: 'center',
              }}
            >
              <div style={{ padding: '0 20px' }}>
                <MonoLabel style={{ display: 'block', marginBottom: 6 }}>Stored</MonoLabel>
                <div
                  style={{
                    fontFamily: V3.displayFont,
                    fontSize: '20px',
                    fontWeight: V3.fwSemibold,
                    color: V3.ink900,
                  }}
                >
                  {docCount}
                  <span style={{ color: V3.ink400, fontWeight: V3.fwRegular }}>
                    {' '}
                    of {maxDocs === Infinity ? '∞' : maxDocs}
                  </span>
                </div>
              </div>
              <div style={{ padding: '0 20px', borderLeft: `1px solid ${V3.ink100}` }}>
                <MonoLabel style={{ display: 'block', marginBottom: 6 }}>Storage</MonoLabel>
                <div
                  style={{
                    fontFamily: V3.displayFont,
                    fontSize: '20px',
                    fontWeight: V3.fwSemibold,
                    color: V3.ink900,
                  }}
                >
                  {storageMB.toFixed(2)}
                  <span style={{ color: V3.ink400, fontWeight: V3.fwRegular }}> MB</span>
                </div>
              </div>
              <div style={{ padding: '0 20px', borderLeft: `1px solid ${V3.ink100}` }}>
                <MonoLabel style={{ display: 'block', marginBottom: 6 }}>Extracted words</MonoLabel>
                <div
                  style={{
                    fontFamily: V3.displayFont,
                    fontSize: '20px',
                    fontWeight: V3.fwSemibold,
                    color: V3.ink900,
                  }}
                >
                  {extractedWords.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  padding: '0 20px',
                  borderLeft: `1px solid ${V3.ink100}`,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Badge variant={tierBadgeVariant}>
                  {maxDocs === Infinity ? 'Unlimited' : `${maxDocs} slots`}
                </Badge>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <Tabs tabs={DOC_TABS} active={activeTab} onChange={(k) => setActiveTab(k as TabKey)} />
            </div>

            <div style={{ border: `1px solid ${V3.ink200}`, marginTop: -1 }}>
              {filteredDocs.length === 0 ? (
                <EmptyState
                  iconSvg={folderIconSvg()}
                  title="No documents yet"
                  description="Upload to enrich the baseline picture NEXUS builds for you."
                />
              ) : (
                filteredDocs.map((doc, idx) => (
                  <ListRow
                    key={doc.id}
                    borderColor={idx === filteredDocs.length - 1 ? 'transparent' : V3.ink100}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: V3.teal500,
                          flexShrink: 0,
                        }}
                      >
                        {docIconSvg()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontFamily: V3.bodyFont,
                            fontSize: '14px',
                            fontWeight: V3.fwSemibold,
                            color: V3.ink800,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3,
                          }}
                        >
                          {doc.name}
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <MonoLabel>
                            {DOCUMENT_TYPE_LABELS[doc.type]} · {formatDate(doc.created_at)} ·{' '}
                            {formatBytesMB(doc.file_size_bytes)} MB
                          </MonoLabel>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <Button variant="ghost" size="small">
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          if (doc.file_url) window.open(doc.file_url, '_blank');
                        }}
                      >
                        Download
                      </Button>
                      <IconButton label="Delete" onClick={() => setDeleteDoc(doc)}>
                        {trashIconSvg()}
                      </IconButton>
                    </div>
                  </ListRow>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        title="Upload a document"
        footer={
          <>
            <Button variant="ghost" onClick={() => !uploading && setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
          <FormRow label="File type" helper="Helps NEXUS classify the extract correctly.">
            <div style={{ width: 220 }}>
              <Select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as DocumentType)}
              >
                {DOC_TYPES_FOR_SELECT.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
          </FormRow>

          <FormRow label="File">
            <div style={{ width: 220 }}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setUploadFile(f);
                  setUploadError(null);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  fontFamily: V3.bodyFont,
                  fontSize: '13px',
                  color: V3.ink700,
                }}
              />
            </div>
          </FormRow>

          {maxDocs !== Infinity && (
            <MonoLabel color={V3.ink400}>
              {docCount}/{maxDocs} used
            </MonoLabel>
          )}

          {uploadError && (
            <div
              style={{
                fontFamily: V3.bodyFont,
                fontSize: '13px',
                color: V3.fuchsia700,
              }}
            >
              {uploadError}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!deleteDoc}
        onClose={() => !deleting && setDeleteDoc(null)}
        title="Delete this document?"
        footer={
          <>
            <Button variant="ghost" onClick={() => !deleting && setDeleteDoc(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        This removes the file from our servers and NEXUS will no longer reference it in conversation.
      </Modal>
    </div>
  );
}
