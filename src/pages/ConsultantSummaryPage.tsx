/**
 * #1325 — Consultant summary page.
 *
 * Wraps ConsultantResultsSummary and wires it to a route
 * (/portal/candidates/:id/summary) so consultants can reach the executive-
 * summary view. Currently uses illustrative data; when a backend endpoint
 * for consultant-facing assessment summaries is available, swap the mock
 * for a fetch.
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ConsultantResultsSummary } from '@/components/consultant/ConsultantResultsSummary';

export function ConsultantSummaryPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      <Link
        to={`/portal/candidates/${id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 13,
          color: '#616170',
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to candidate
      </Link>
      <ConsultantResultsSummary
        candidateName="Candidate"
        assessmentName="CPI"
        executiveSummary="Loading summary…"
        headlineLabel="—"
        talkingPoints={[]}
        strengths={[]}
        gaps={[]}
        discussionTopics={[]}
        loading
        fullReportUrl={`/portal/candidates/${id}/report`}
      />
    </div>
  );
}

export default ConsultantSummaryPage;
