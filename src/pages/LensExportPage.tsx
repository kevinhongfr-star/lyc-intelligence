import React, { useState, useMemo } from 'react';
import { FileDown, Loader2, Users, Eye, Shield, Mail, Copy, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from '@/components/ui';
import { useMandateDetail } from '@/hooks/useSupabaseData';
import { useParams } from 'react-router-dom';
import type { CandidatePipeline, Mandate } from '@/services/supabaseApi';
import { sendEmail } from '@/services/serverApi';

function clientVerdict(tier: string | null): { label: string; color: string } {
  if (!tier) return { label: 'Not Rated', color: '#9CA3AF' };
  const t = tier.toUpperCase();
  if (t.includes('T1') || t === 'STRONG PRIMARY') return { label: 'Strong Primary', color: '#34D399' };
  if (t.includes('T2') || t === 'STRONG SECONDARY') return { label: 'Strong Secondary', color: '#FBBF24' };
  return { label: 'Reserve', color: '#F87171' };
}

function ScopeBar({ mandate }: { mandate: Mandate }) {
  const cells = [
    { label: 'Mandate', value: mandate.title || 'Untitled' },
    { label: 'Client', value: mandate.company?.name || 'N/A' },
    { label: 'Location', value: mandate.company?.city || mandate.company?.country || 'N/A' },
    { label: 'Reference', value: mandate.id.slice(0, 8).toUpperCase() },
    { label: 'Candidates', value: String(mandate.total_candidates) },
  ];
  return (
    <div className="flex border border-bg-tertiary rounded-lg overflow-hidden">
      {cells.map((c, i) => (
        <div key={i} className={`flex-1 p-3 ${i < cells.length - 1 ? 'border-r border-bg-tertiary' : ''}`}>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">{c.label}</p>
          <p className="text-sm font-medium text-text-primary truncate">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function LensCandidateCard({ candidate }: { candidate: CandidatePipeline }) {
  const v = clientVerdict(candidate.sweep_tier);
  const name = candidate.contact?.name || 'Unknown Candidate';
  const title = candidate.contact?.current_title || '';
  const company = candidate.contact?.company?.name || '';
  const composite = candidate.trident_composite;
  const d1 = candidate.trident_d1;
  const d2 = candidate.trident_d2;
  const d3 = candidate.trident_d3;
  const keyMatch = candidate.key_match_reasons || candidate.match_reasons || '';

  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-text-primary">{name}</h4>
          <p className="text-xs text-text-muted">{title}{company ? ` at ${company}` : ''}</p>
        </div>
        <Badge variant={v.color === '#34D399' ? 'success' : v.color === '#FBBF24' ? 'warning' : 'danger'}>{v.label}</Badge>
      </div>
      <div className="space-y-2 mt-3">
        {[
          { label: 'Experience', value: d1 },
          { label: 'Skills', value: d2 },
          { label: 'Organizational Fit', value: d3 },
        ].map(dim => (
          <div key={dim.label}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <span className="text-text-muted">{dim.label}</span>
              <span className="text-text-secondary">{dim.value != null ? `${Math.round(dim.value)}%` : 'N/A'}</span>
            </div>
            <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, dim.value ?? 0)}%`, backgroundColor: v.color }} />
            </div>
          </div>
        ))}
      </div>
      {composite != null && <div className="mt-2 text-xs text-text-muted">Composite: <span className="text-text-primary font-medium">{composite.toFixed(1)}</span></div>}
      {keyMatch && <div className="mt-2 p-2 bg-bg-tertiary rounded text-xs text-text-secondary">{typeof keyMatch === 'string' ? keyMatch : JSON.stringify(keyMatch)}</div>}
      {candidate.approach_strategy && <div className="mt-2 text-xs text-text-muted"><strong className="text-text-secondary">Approach:</strong> {candidate.approach_strategy}</div>}
    </div>
  );
}

export function LensExportPage() {
  const { id } = useParams<{ id: string }>();
  const { mandate, pipeline, loading } = useMandateDetail(id || '');
  const [exporting, setExporting] = useState(false);
  const [showConfidential, setShowConfidential] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sortedPipeline = useMemo(() => {
    return [...pipeline].sort((a, b) => (b.trident_composite ?? 0) - (a.trident_composite ?? 0));
  }, [pipeline]);

  // Generate email draft text
  const emailDraft = useMemo(() => {
    if (!mandate) return '';
    const t1 = sortedPipeline.filter(p => p.sweep_tier === 'T1');
    const t2 = sortedPipeline.filter(p => p.sweep_tier === 'T2');
    const clientName = mandate.company?.name || 'the client';
    const lines = [
      `Subject: Candidate Shortlist Report — ${mandate.title}`,
      '',
      `Dear ${clientName},`,
      '',
      `Please find below our shortlist for the ${mandate.title} mandate. We have identified ${sortedPipeline.length} candidates, including ${t1.length} Strong Primary and ${t2.length} Strong Secondary profiles.`,
      '',
      'SHORTLIST SUMMARY:',
      ...sortedPipeline.slice(0, 10).map((c, i) => {
        const v = clientVerdict(c.sweep_tier);
        return `${i + 1}. ${c.contact?.name || 'Unknown'} — ${c.contact?.current_title || 'N/A'} ${c.contact?.company?.name ? 'at ' + c.contact?.company?.name : ''} [${v.label}]${c.trident_composite != null ? ` — Composite: ${c.trident_composite.toFixed(1)}` : ''}`;
      }),
      '',
      sortedPipeline.length > 10 ? `... and ${sortedPipeline.length - 10} more candidates in the full report.` : '',
      'A detailed PDF report with individual candidate assessments is attached.',
      '',
      'Best regards,',
      'LYC Intelligence',
    ];
    return lines.join('\n');
  }, [mandate, sortedPipeline]);

  async function handleExportPDF() {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = margin;

      doc.setFillColor(10, 10, 10); doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
      doc.text('Candidate Shortlist Report', margin, y += 15);
      doc.setFontSize(11); doc.setTextColor(160, 160, 178);
      doc.text(mandate?.title || 'Mandate', margin, y += 8);
      doc.text(mandate?.company?.name || '', margin, y += 6);
      doc.text(`Reference: ${mandate?.id?.slice(0, 8).toUpperCase() || 'N/A'}`, margin, y += 6);
      y += 8;
      doc.setFillColor(193, 8, 171); doc.rect(margin, y, pw - margin * 2, 0.5, 'F'); y += 8;

      doc.setFontSize(9); doc.setTextColor(160, 160, 178);
      doc.text(`Total: ${pipeline.length} | T1: ${pipeline.filter(p => p.sweep_tier === 'T1').length} | T2: ${pipeline.filter(p => p.sweep_tier === 'T2').length} | T3: ${pipeline.filter(p => p.sweep_tier === 'T3').length}`, margin, y);
      y += 10;

      for (const c of sortedPipeline) {
        if (y > 250) { doc.addPage(); doc.setFillColor(10, 10, 10); doc.rect(0, 0, pw, doc.internal.pageSize.getHeight(), 'F'); y = margin; }
        const v = clientVerdict(c.sweep_tier);
        const name = c.contact?.name || 'Unknown';
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
        doc.text(name, margin, y); y += 5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(160, 160, 178);
        doc.text(`${c.contact?.current_title || ''} ${c.contact?.company?.name ? 'at ' + c.contact?.company?.name : ''}`, margin, y); y += 4;
        doc.setTextColor(v.color === '#34D399' ? 52 : v.color === '#FBBF24' ? 251 : 248, v.color === '#34D399' ? 211 : v.color === '#FBBF24' ? 191 : 113, v.color === '#34D399' ? 153 : v.color === '#FBBF24' ? 36 : 113);
        doc.text(`Verdict: ${v.label}`, margin, y); y += 4;
        if (c.trident_composite != null) {
          doc.setTextColor(160, 160, 178);
          doc.text(`Experience: ${c.trident_d1 ?? 'N/A'}% | Skills: ${c.trident_d2 ?? 'N/A'}% | Fit: ${c.trident_d3 ?? 'N/A'}% | Composite: ${c.trident_composite.toFixed(1)}`, margin, y);
          y += 5;
        }
        y += 4;
      }

      doc.setFontSize(7); doc.setTextColor(100, 100, 120);
      doc.text('LYC Intelligence — Confidential', margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pw - margin - 40, doc.internal.pageSize.getHeight() - 10);
      doc.save(`LYC_LENS_${mandate?.id?.slice(0, 8) || 'report'}.pdf`);
    } catch (err) { console.error('PDF export failed:', err); }
    setExporting(false);
  }

  function handleEmailDraft() {
    // Open mailto: with pre-filled subject and body
    const subject = encodeURIComponent(`Candidate Shortlist Report — ${mandate?.title || 'Mandate'}`);
    const body = encodeURIComponent(emailDraft);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_blank');
  }

  function handleCopyDraft() {
    navigator.clipboard.writeText(emailDraft).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    });
  }

  async function handleSendEmail() {
    if (!emailTo) return;
    setSending(true);
    const result = await sendEmail({
      to: emailTo,
      subject: `Candidate Shortlist Report — ${mandate?.title || 'Mandate'}`,
      text: emailDraft,
      html: emailDraft.replace(/\n/g, '<br>'),
      mandateId: mandate?.id,
    });
    setSending(false);
    if (result.success) { setSent(true); setTimeout(() => setSent(false), 3000); }
    else { alert('Failed to send: ' + (result.error || 'Unknown error')); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!mandate) return <div className="text-text-muted text-center py-20">Mandate not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Candidate Shortlist</h1>
          <p className="text-text-secondary">Client-safe candidate report</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfidential(!showConfidential)} size="sm">
            <Shield className="w-4 h-4" />{showConfidential ? 'Hide Internal' : 'Show Internal'}
          </Button>
          <Button variant="outline" onClick={() => setEmailMode(!emailMode)} size="sm">
            <Mail className="w-4 h-4" />Email Draft
          </Button>
          <Button onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      {!showConfidential && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-400">Client-safe view — TRIDENT formulas, weights, run IDs, and internal stage names are hidden.</p>
        </div>
      )}

      {emailMode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Email Draft</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyDraft}>
                  {emailCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {emailCopied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleEmailDraft}>
                  <Mail className="w-4 h-4" />Open in Mail Client
                </Button>
                <Button size="sm" onClick={handleSendEmail} disabled={sending || !emailTo}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <CheckCircle2 className="w-4 h-4" /> : null}
                  {sent ? 'Sent!' : 'Send via Server'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <label className="text-xs text-text-muted mb-1 block">Client Email (optional)</label>
              <Input placeholder="client@company.com" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            </div>
            <pre className="bg-bg-tertiary p-4 rounded-lg text-sm text-text-secondary whitespace-pre-wrap overflow-auto max-h-96 font-sans">{emailDraft}</pre>
          </CardContent>
        </Card>
      )}

      <ScopeBar mandate={mandate} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-text-muted mb-1">Shortlisted</p><p className="text-2xl font-bold text-text-primary">{pipeline.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-muted mb-1">Strong Primary</p><p className="text-2xl font-bold text-green-400">{sortedPipeline.filter(p => p.sweep_tier === 'T1').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-muted mb-1">Strong Secondary</p><p className="text-2xl font-bold text-amber-400">{sortedPipeline.filter(p => p.sweep_tier === 'T2').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-text-muted mb-1">Reserve</p><p className="text-2xl font-bold text-red-400">{sortedPipeline.filter(p => p.sweep_tier === 'T3').length}</p></CardContent></Card>
      </div>

      {sortedPipeline.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-text-muted">No candidates in pipeline for this mandate.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sortedPipeline.map(candidate => <LensCandidateCard key={candidate.id} candidate={candidate} />)}
        </div>
      )}
    </div>
  );
}
