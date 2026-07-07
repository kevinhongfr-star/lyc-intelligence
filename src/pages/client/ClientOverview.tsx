/**
 * B2B Client Portal — Overview Page
 * Route: /client-portal/overview
 * 
 * KPIs + Pipeline + Candidates + Reports + Org Chart + Offers + Search Request + Billing
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { SubTabBar, SubTab } from '@/components/shared/SubTabBar';
import { KPIRow, KPI } from '@/components/shared/KPIRow';
import { ImpersonationBanner } from '@/components/shared/PortalRouteGuard';
import { PortalSwitcher } from '@/components/shared/PortalSwitcher';
import {
  Briefcase, Users, Calendar, FileText, Plus,
  Building2, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Download
} from 'lucide-react';

const DS = {
  accent: '#C108AB',
  accentHover: '#A00790',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  bgWarm: '#FAF8F5',
  card: '#FFFFFF',
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  success: '#00897B',
  warning: '#F59E0B',
  error: '#DC2626',
};

const CLIENT_TABS: SubTab[] = [
  { id: 'overview', label: 'Overview', path: '/client-portal/overview' },
  { id: 'mandates', label: 'Mandates', path: '/client-portal/mandates', badge: 3 },
  { id: 'candidates', label: 'Candidates', path: '/client-portal/candidates' },
  { id: 'pipeline-analytics', label: 'Pipeline Analytics', path: '/client-portal/pipeline-analytics' },
  { id: 'talent-intel', label: 'Talent Intel', path: '/client-portal/talent-intel' },
  { id: 'nexus-assistant', label: 'NEXUS', path: '/client-portal/nexus-assistant' },
  { id: 'documents', label: 'Documents', path: '/client-portal/documents' },
  { id: 'collaboration', label: 'Collaboration', path: '/client-portal/collaboration' },
];

export function ClientOverview() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  // Mock data — will be replaced with Supabase queries
  const kpis: KPI[] = [
    { label: 'Active Mandates', value: 3, icon: <Briefcase style={{ width: 14, height: 14 }} />, change: '+1 this month', changeType: 'positive' },
    { label: 'Presented', value: 8, icon: <Users style={{ width: 14, height: 14 }} /> },
    { label: 'Interviews', value: 5, icon: <Calendar style={{ width: 14, height: 14 }} /> },
    { label: 'Upcoming', value: 2, icon: <Clock style={{ width: 14, height: 14 }} /> },
  ];

  const pipelineStages = [
    { label: 'SWEEP', count: 6, color: DS.muted },
    { label: 'CANVA', count: 4, color: DS.warning },
    { label: 'GRID', count: 3, color: DS.accent },
    { label: 'LENS', count: 2, color: '#6366F1' },
    { label: 'PLACED', count: 1, color: DS.success },
  ];

  const candidates = [
    { name: 'David Tan', score: 87, verdict: 'Strong Fit', role: 'VP Risk', stage: 'Interview' },
    { name: 'Sophie Lau', score: 84, verdict: 'Strong Fit', role: 'VP Risk', stage: 'Presented' },
    { name: 'Michael Chen', score: 78, verdict: 'Good Fit', role: 'Head Digital', stage: 'Offer' },
  ];

  const upcomingInterviews = [
    { date: 'Jul 8, 14:00', title: 'Client Panel x3', candidate: 'David Tan' },
    { date: 'Jul 15, 10:00', title: 'Final Round', candidate: 'David Tan' },
  ];

  const reports = [
    'Candidate Comparison M-028',
    'Market Mapping Summary',
    'Compensation Benchmark',
    'Monthly Status (Jun)',
  ];

  const orgNodes = [
    { name: 'Robert Tan', title: 'CEO', risk: 'none' },
    { name: 'You', title: 'CHRO', risk: 'none' },
    { name: 'Michael Wong', title: 'CFO', risk: 'low' },
    { name: 'Priya Sharma', title: 'CTO', risk: 'medium' },
    { name: 'VACANT', title: 'VP Risk', risk: 'high', candidates: 3 },
    { name: 'Alex Yeo', title: 'Head Digital', risk: 'high' },
  ];

  const offers = [
    { candidate: 'David Tan', role: 'VP Risk', comp: '$280K+30%', status: 'Negotiating', statusColor: DS.warning },
    { candidate: 'Sophie Lau', role: 'VP Risk', comp: '$260K+25%', status: 'Pending', statusColor: DS.muted },
    { candidate: 'Michael Chen', role: 'Head Digital', comp: '$240K', status: 'Accepted', statusColor: DS.success },
  ];

  const invoices = [
    { id: 'INV-2026-031', desc: 'M-031 CTO Retainer', amount: '$15K', status: 'DUE', statusColor: DS.warning },
    { id: 'INV-2026-028', desc: 'M-028 Retainer', amount: '$12K', status: 'PAID', statusColor: DS.success },
    { id: 'INV-2026-025', desc: 'M-025 Success Fee', amount: '$72K', status: 'PEND', statusColor: DS.muted },
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bgWarm }}>
      <ImpersonationBanner portalName="Client" />

      {/* Top Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 32px',
        borderBottom: `1px solid ${DS.border}`,
        background: DS.bg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{
            fontFamily: DS.headingFont,
            fontSize: '18px',
            fontWeight: 700,
            color: DS.text,
            textDecoration: 'none',
          }}>
            LYC Intelligence
          </a>
          <span style={{ color: DS.border }}>|</span>
          <span style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted }}>
            Client Portal — {profile?.name || 'Claire Jin'}, CHRO, FinanceHub Asia
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <PortalSwitcher />
          <a href="/settings" style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted }}>Settings</a>
          <a href="/platform" onClick={(e) => { e.preventDefault(); navigate('/platform'); }} style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.accent }}>Internal</a>
        </div>
      </nav>

      {/* Sub-tabs */}
      <SubTabBar tabs={CLIENT_TABS} basePath="/client-portal" />

      {/* Content */}
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* KPIs */}
        <KPIRow kpis={kpis} columns={4} />

        {/* Actions row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button onClick={() => navigate('/client-portal/nexus-assistant')} style={{
            padding: '10px 20px',
            background: DS.accent,
            color: '#FFFFFF',
            border: 'none',
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            Ask NEXUS <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
          <button style={{
            padding: '10px 20px',
            background: DS.bg,
            color: DS.text,
            border: `1px solid ${DS.border}`,
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Status Report
          </button>
          <button style={{
            padding: '10px 20px',
            background: DS.bg,
            color: DS.text,
            border: `1px solid ${DS.border}`,
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}>
            Schedule
          </button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Pipeline Overview */}
          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
              Pipeline Overview
            </h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {pipelineStages.map(stage => (
                <div key={stage.label} style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '12px 8px',
                  background: `${stage.color}10`,
                  border: `1px solid ${stage.color}30`,
                }}>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '20px', fontWeight: 700, color: stage.color }}>
                    {stage.count}
                  </div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '10px', color: DS.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>
            <span style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>
              All Mandates — Total: {pipelineStages.reduce((a, s) => a + s.count, 0)} candidates
            </span>
          </div>

          {/* Presented Candidates */}
          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
              Presented Candidates
            </h3>
            {candidates.map(c => (
              <div key={c.name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${DS.border}`,
              }}>
                <div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 500, color: DS.text }}>
                    {c.name}
                  </div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>
                    {c.role} · {c.stage}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: DS.bodyFont,
                    fontSize: '14px',
                    fontWeight: 700,
                    color: c.score >= 85 ? DS.success : c.score >= 75 ? DS.warning : DS.muted,
                  }}>
                    {c.score}
                  </span>
                  <span style={{
                    fontFamily: DS.bodyFont,
                    fontSize: '11px',
                    padding: '2px 8px',
                    background: c.verdict === 'Strong Fit' ? `${DS.success}15` : `${DS.warning}15`,
                    color: c.verdict === 'Strong Fit' ? DS.success : DS.warning,
                  }}>
                    {c.verdict}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Second row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Upcoming Interviews */}
          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
              Upcoming Interviews
            </h3>
            {upcomingInterviews.map((iv, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: `1px solid ${DS.border}`,
              }}>
                <Calendar style={{ width: 16, height: 16, color: DS.accent }} />
                <div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 500, color: DS.text }}>
                    {iv.title}
                  </div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>
                    {iv.date} · {iv.candidate}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reports & Downloads */}
          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
              Reports & Downloads
            </h3>
            {reports.map((r, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${DS.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText style={{ width: 14, height: 14, color: DS.muted }} />
                  <span style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.text }}>{r}</span>
                </div>
                <Download style={{ width: 14, height: 14, color: DS.accent, cursor: 'pointer' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Org Chart */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
            Your Organization — FinanceHub Asia
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {orgNodes.map(node => (
              <div key={node.name} style={{
                padding: '12px 16px',
                border: `1px solid ${node.risk === 'high' ? DS.error : node.risk === 'medium' ? DS.warning : DS.border}`,
                background: node.name === 'VACANT' ? `${DS.error}08` : DS.bg,
              }}>
                <div style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 600, color: DS.text }}>
                  {node.name}
                </div>
                <div style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>
                  {node.title}
                </div>
                {node.candidates && (
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '11px', color: DS.error, marginTop: '4px' }}>
                    {node.candidates} candidates presented
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Offers + Invoices row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Offer Pipeline */}
          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
              Offer Pipeline
            </h3>
            {offers.map(o => (
              <div key={o.candidate} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${DS.border}`,
              }}>
                <div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 500, color: DS.text }}>
                    {o.candidate}
                  </div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '12px', color: DS.muted }}>
                    {o.role} · {o.comp}
                  </div>
                </div>
                <span style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: o.statusColor,
                }}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>

          {/* Invoice & Billing */}
          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
              Invoice & Billing
            </h3>
            {invoices.map(inv => (
              <div key={inv.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${DS.border}`,
              }}>
                <div>
                  <div style={{ fontFamily: DS.bodyFont, fontSize: '13px', fontWeight: 500, color: DS.text }}>
                    {inv.id} — {inv.desc}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: DS.bodyFont, fontSize: '14px', fontWeight: 600, color: DS.text }}>
                    {inv.amount}
                  </span>
                  <span style={{
                    fontFamily: DS.bodyFont,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: inv.statusColor,
                    padding: '2px 8px',
                    background: `${inv.statusColor}15`,
                  }}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New Search Request */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, padding: '24px' }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, margin: '0 0 16px', color: DS.text }}>
            Submit New Search Request
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <input placeholder="Position Title" style={{
              padding: '10px 14px',
              border: `1px solid ${DS.border}`,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              outline: 'none',
            }} />
            <select style={{
              padding: '10px 14px',
              border: `1px solid ${DS.border}`,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              background: DS.bg,
              color: DS.text,
            }}>
              <option>Department</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Operations</option>
              <option>Risk</option>
            </select>
            <select style={{
              padding: '10px 14px',
              border: `1px solid ${DS.border}`,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              background: DS.bg,
              color: DS.text,
            }}>
              <option>Seniority</option>
              <option>C-Suite</option>
              <option>VP</option>
              <option>Director</option>
              <option>Head</option>
            </select>
            <input placeholder="Location" style={{
              padding: '10px 14px',
              border: `1px solid ${DS.border}`,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              outline: 'none',
            }} />
          </div>
          <textarea placeholder="Role Requirements" rows={3} style={{
            width: '100%',
            padding: '10px 14px',
            border: `1px solid ${DS.border}`,
            fontFamily: DS.bodyFont,
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            marginBottom: '12px',
          }} />
          <button style={{
            padding: '10px 24px',
            background: DS.accent,
            color: '#FFFFFF',
            border: 'none',
            fontFamily: DS.bodyFont,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Plus style={{ width: 16, height: 16 }} />
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}
