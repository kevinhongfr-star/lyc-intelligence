import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { useContact } from '@/hooks/useSupabaseData';

function getTier(score: number | null): { tier: string; color: string } {
  if (score == null) return { tier: '—', color: '#94A3B8' };
  if (score >= 80) return { tier: 'S', color: '#D4AF37' };
  if (score >= 65) return { tier: 'A', color: '#22C55E' };
  if (score >= 45) return { tier: 'B', color: '#3B82F6' };
  return { tier: 'C', color: '#94A3B8' };
}

const SENIORITY_LABELS: Record<string, string> = {
  c_suite: 'C-Suite', vp: 'VP', director: 'Director', leadership: 'Leadership',
  senior_manager: 'Sr. Manager', manager: 'Manager', partner: 'Partner',
};

export function CandidateReportPage() {
  const { id } = useParams<{ id: string }>();
  const { data: contact, loading } = useContact(id);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-text-muted">Loading report...</div>;
  }
  if (!contact) {
    return <div className="flex items-center justify-center h-screen text-text-muted">Contact not found.</div>;
  }

  const tier = getTier(contact.match_score_best ?? contact.trident_composite);
  const seniorityLabel = contact.seniority ? (SENIORITY_LABELS[contact.seniority] || contact.seniority) : '—';
  const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const company = contact.career_history?.[0]?.company || '—';

  const handlePrint = () => window.print();

  return (
    <div>
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-bg-primary border-b border-border-subtle px-6 py-3 flex items-center justify-between">
        <Link to={`/platform/candidates/${id}`} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent">
          <ArrowLeft size={13} /> Back to Profile
        </Link>
        <Button onClick={handlePrint} className="bg-accent hover:bg-accent/90 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2">
          <Download size={13} /> Export PDF
        </Button>
      </div>

      {/* Printable report */}
      <div id="report" className="max-w-[210mm] mx-auto bg-white text-gray-900 print:shadow-none" style={{ fontFamily: "'Liberation Serif', 'Times New Roman', serif" }}>
        {/* Header */}
        <div className="px-12 pt-10 pb-6 border-b-2 border-gray-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[3px] text-gray-400 font-sans font-bold">LYC Partners — Confidential</p>
              <h1 className="text-3xl font-bold mt-2 text-gray-900" style={{ fontFamily: "'Liberation Serif', serif" }}>Executive Profile Report</h1>
              <p className="text-sm text-gray-500 mt-1 font-sans">{contact.name} — {contact.current_title || 'Executive'}</p>
            </div>
            <div className="text-right">
              <div className="w-14 h-14 rounded-xl text-white font-bold text-2xl flex items-center justify-center uppercase" style={{ backgroundColor: tier.color, fontFamily: "'Liberation Serif', serif" }}>
                {initials}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-sans">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Summary Box */}
        <div className="px-12 py-6 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Full Name</p>
              <p className="text-sm font-bold mt-0.5">{contact.name}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Current Position</p>
              <p className="text-sm font-bold mt-0.5">{contact.current_title || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Company</p>
              <p className="text-sm font-bold mt-0.5">{company}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Location</p>
              <p className="text-sm font-bold mt-0.5">{contact.city ? `${contact.city}, ${contact.country}` : contact.country || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Seniority</p>
              <p className="text-sm font-bold mt-0.5">{seniorityLabel}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Tier</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: tier.color }}>Tier {tier.tier}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Trident Score</p>
              <p className="text-sm font-bold mt-0.5">{contact.trident_composite ?? '—'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">Engagement</p>
              <p className="text-sm font-bold mt-0.5">{contact.engagement_score ?? '—'}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold">CXO Stamp</p>
              <p className="text-sm font-bold mt-0.5">{contact.cxo_stamp ? '✓ Yes' : '—'}</p>
            </div>
          </div>
        </div>

        {/* Career Trajectory */}
        <div className="px-12 py-6 border-b border-gray-200">
          <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-900 mb-4">1. Career Trajectory</h2>
          {contact.career_history && contact.career_history.length > 0 ? (
            <div className="space-y-3">
              {contact.career_history.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />
                    {idx < contact.career_history!.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-bold">{item.role}</p>
                    <p className="text-xs text-gray-500 font-sans">{item.company}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic font-sans">No career history available.</p>
          )}
        </div>

        {/* Education */}
        <div className="px-12 py-6 border-b border-gray-200">
          <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-900 mb-4">2. Academic Credentials</h2>
          {contact.education && contact.education.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {contact.education.map((edu, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-bold">{edu.degree}</p>
                  <p className="text-xs text-gray-500 font-sans">{edu.school}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic font-sans">No education records.</p>
          )}
        </div>

        {/* Skills */}
        <div className="px-12 py-6 border-b border-gray-200">
          <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-900 mb-4">3. Skills & Expertise</h2>
          {contact.skills && contact.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {contact.skills.map((skill, idx) => (
                <span key={idx} className="text-[10px] font-sans px-2 py-0.5 border border-gray-200 rounded bg-gray-50 text-gray-700">{skill}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic font-sans">No skills recorded.</p>
          )}
          {contact.languages && contact.languages.length > 0 && (
            <div className="mt-4">
              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-sans font-bold mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {contact.languages.map((lang, idx) => (
                  <span key={idx} className="text-[10px] font-sans px-2 py-0.5 border border-gray-300 rounded bg-gray-100 text-gray-800 font-semibold">{lang}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Advisory & Governance */}
        {(contact.advisory_lane || contact.advisory_tier || contact.council_tier) && (
          <div className="px-12 py-6 border-b border-gray-200">
            <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-900 mb-4">4. Advisory & Governance</h2>
            <div className="grid grid-cols-2 gap-3">
              {contact.advisory_lane && (
                <div><span className="text-[9px] uppercase text-gray-400 font-sans font-bold">Lane: </span><span className="text-xs font-semibold">{contact.advisory_lane}</span></div>
              )}
              {contact.advisory_tier && (
                <div><span className="text-[9px] uppercase text-gray-400 font-sans font-bold">Advisory Tier: </span><span className="text-xs font-semibold">{contact.advisory_tier}</span></div>
              )}
              {contact.council_tier && (
                <div><span className="text-[9px] uppercase text-gray-400 font-sans font-bold">Council Tier: </span><span className="text-xs font-semibold">{contact.council_tier}</span></div>
              )}
              {contact.market_side && (
                <div><span className="text-[9px] uppercase text-gray-400 font-sans font-bold">Market Side: </span><span className="text-xs font-semibold">{contact.market_side}</span></div>
              )}
              {contact.commercial_readiness && (
                <div><span className="text-[9px] uppercase text-gray-400 font-sans font-bold">Commercial Readiness: </span><span className="text-xs font-semibold">{contact.commercial_readiness}</span></div>
              )}
              {contact.bd_priority && (
                <div><span className="text-[9px] uppercase text-gray-400 font-sans font-bold">BD Priority: </span><span className="text-xs font-semibold">{contact.bd_priority}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Profile Summary */}
        {(contact.headline || contact.summary) && (
          <div className="px-12 py-6 border-b border-gray-200">
            <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-900 mb-4">
              {(contact.advisory_lane || contact.council_tier) ? '5' : '4'}. Profile Summary
            </h2>
            {contact.headline && <p className="text-sm font-bold mb-2">{contact.headline}</p>}
            {contact.summary && <p className="text-xs text-gray-600 leading-relaxed">{contact.summary}</p>}
          </div>
        )}

        {/* Contact Information */}
        <div className="px-12 py-6 border-b border-gray-200">
          <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-2 gap-3 text-xs font-sans">
            {contact.email && <div><span className="text-gray-400">Email: </span><span className="font-semibold">{contact.email}</span></div>}
            {contact.linkedin_url && <div><span className="text-gray-400">LinkedIn: </span><span className="font-semibold text-blue-700">{contact.linkedin_url}</span></div>}
            {contact.location && <div><span className="text-gray-400">Location: </span><span className="font-semibold">{contact.location}</span></div>}
            {contact.is_expat && <div><span className="text-gray-400">Expat: </span><span className="font-semibold">Yes</span></div>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-12 py-4 text-center">
          <p className="text-[9px] text-gray-300 font-sans uppercase tracking-wider">
            LYC Partners · Confidential · Generated {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          #report { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>
    </div>
  );
}

export default CandidateReportPage;
