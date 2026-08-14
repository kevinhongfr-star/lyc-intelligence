import React, { useState } from 'react';
import { Download, Share2, Link2, Mail, Check, X } from 'lucide-react';
import type { ScoreResult } from '@/lib/akira/engine';
import { ExportPdfButton } from '@/components/report/ExportPdfButton';
import { scoreResultToPdfData } from '@/services/resultToPdfData';
import { DS, SUCCESS } from '@/tokens';

export interface ResultExportBarProps {
  assessmentCode: string;
  scoreResult: ScoreResult;
  matchedArchetype?: { name: string; description: string; key_traits?: string[] };
  accent?: string;
  aiInsights?: { summary: string; strengths: string[]; growthAreas: string[]; nextSteps: string[] };
}

export const ResultExportBar: React.FC<ResultExportBarProps> = ({
  assessmentCode,
  scoreResult,
  matchedArchetype,
  accent,
  aiInsights,
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const accentColor = accent ?? DS.accent;
  const code = assessmentCode.toUpperCase();

  const pdfData = scoreResultToPdfData({
    assessmentCode,
    scoreResult,
    matchedArchetype,
    aiInsights,
  });

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/assessment/${code.toLowerCase()}/results#token=PUBLIC_TOKEN_PLACEHOLDER`
    : `/assessment/${code.toLowerCase()}/results#token=PUBLIC_TOKEN_PLACEHOLDER`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pageUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = pageUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // noop
    }
  };

  const handleCopyEmailLink = async () => {
    const subject = encodeURIComponent(`My ${code} Assessment Report from LYC`);
    const body = encodeURIComponent(`Here are my ${code} assessment results:\n\n${pageUrl}\n\nView the full report online.`);
    const mailto = `mailto:?subject=${subject}&body=${body}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(mailto);
      } else {
        const ta = document.createElement('textarea');
        ta.value = mailto;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // noop
    }
  };

  const openLinkedIn = () => {
    const url = encodeURIComponent(pageUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const openTwitter = () => {
    const url = encodeURIComponent(pageUrl);
    const text = encodeURIComponent(`My ${code} Assessment Report from LYC`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer,width=600,height=600');
  };

  const openMailto = () => {
    const subject = encodeURIComponent(`My ${code} Assessment Report from LYC`);
    const body = encodeURIComponent(`Here are my ${code} assessment results:\n\n${pageUrl}\n\nView the full report online.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
    border: `1px solid ${DS.border}`,
    color: DS.textSecondary,
    background: DS.card,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'border-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    background: DS.card,
    border: `1px solid ${DS.cardBorder}`,
    maxWidth: '480px',
    width: '100%',
    padding: '28px',
    position: 'relative',
  };

  const modalHeading: React.CSSProperties = {
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
    fontSize: '20px',
    fontWeight: 700,
    color: DS.text,
    margin: '0 0 6px',
  };

  const modalSub: React.CSSProperties = {
    fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    color: DS.muted,
    margin: '0 0 20px',
  };

  const shareRowBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${DS.border}`,
    background: DS.bgAlt,
    color: DS.text,
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
    cursor: 'pointer',
    transition: 'border-color 200ms cubic-bezier(0.16,1,0.3,1)',
    textAlign: 'left' as const,
  };

  const shareRowHint: React.CSSProperties = {
    fontFamily: 'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '10px',
    color: DS.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginLeft: 'auto',
  };

  const closeBtn: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    color: DS.muted,
    cursor: 'pointer',
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <ExportPdfButton data={pdfData} />

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          style={{
            ...chipBase,
            borderColor: `${accentColor}40`,
            color: accentColor,
          }}
        >
          <Share2 style={{ width: 15, height: 15 }} />
          Share
        </button>

        <button
          type="button"
          onClick={handleCopyEmailLink}
          style={chipBase}
        >
          {copiedEmail ? (
            <>
              <Check style={{ width: 15, height: 15, color: SUCCESS }} />
              <span style={{ color: SUCCESS }}>Email link copied</span>
            </>
          ) : (
            <>
              <Mail style={{ width: 15, height: 15 }} />
              Email results
            </>
          )}
        </button>
      </div>

      {shareOpen ? (
        <div style={overlayStyle} onClick={() => setShareOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button style={closeBtn} onClick={() => setShareOpen(false)} aria-label="Close">
              <X style={{ width: 18, height: 18 }} />
            </button>

            <h3 style={modalHeading}>Share your {code} report</h3>
            <p style={modalSub}>Send results to a colleague, post publicly, or save for later.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" onClick={handleCopyLink} style={shareRowBtn}>
                {copiedLink ? (
                  <Check style={{ width: 18, height: 18, color: SUCCESS }} />
                ) : (
                  <Link2 style={{ width: 18, height: 18, color: accentColor }} />
                )}
                <span style={{ fontFamily: copiedLink ? 'DM Sans' : 'inherit', color: copiedLink ? SUCCESS : 'inherit' }}>
                  {copiedLink ? 'Link copied to clipboard' : 'Copy share link'}
                </span>
                <span style={shareRowHint}>Public URL</span>
              </button>

              <button type="button" onClick={openLinkedIn} style={shareRowBtn}>
                <span aria-hidden style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0A66C2', fontSize: '14px' }}>in</span>
                <span>Share on LinkedIn</span>
                <span style={shareRowHint}>Opens in tab</span>
              </button>

              <button type="button" onClick={openTwitter} style={shareRowBtn}>
                <span aria-hidden style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>𝕏</span>
                <span>Post on X / Twitter</span>
                <span style={shareRowHint}>Opens in tab</span>
              </button>

              <button type="button" onClick={openMailto} style={shareRowBtn}>
                <Mail style={{ width: 18, height: 18, color: accentColor }} />
                <span>Email report link</span>
                <span style={shareRowHint}>Mail client</span>
              </button>
            </div>

            <div style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: `1px solid ${DS.border}`,
              fontFamily: 'DM Sans, system-ui, -apple-system, sans-serif',
              fontSize: '11px',
              color: DS.muted,
              lineHeight: 1.5,
            }}>
              Shared links include a read-only public token. Recipients see the Executive Introduction view by default.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ResultExportBar;
