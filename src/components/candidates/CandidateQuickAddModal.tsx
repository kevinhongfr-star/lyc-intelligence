// CandidateQuickAddModal.tsx — DEX Candidate Tracking (Technical Blueprint 01)
// Quick add modal for creating candidates in ≤30 seconds

'use client';

import React, { useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Link as LinkIcon,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';

interface CandidateQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (candidateId: string) => void;
}

const SOURCES = ['LinkedIn', 'Referral', 'Cold_Outreach', 'Database', 'Event', 'Other'];
const TIERS = ['A', 'B', 'C', null];
const CLASSIFICATIONS = ['CLIENT_SHORTLIST', 'OPERATOR', 'ANALYST_SENIOR', 'ANALYST_JUNIOR', 'MOTIVATION_RISK', 'REVIEW', 'ELIMINATE', null];

export function CandidateQuickAddModal({ isOpen, onClose, onSuccess }: CandidateQuickAddModalProps) {
  const [step, setStep] = useState<'form' | 'saving' | 'success'>('form');
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [tier, setTier] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');

  async function handleSubmit() {
    if (!name) {
      setError('Name is required');
      return;
    }

    setStep('saving');
    setError(null);

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          company_name: companyName || null,
          current_title: currentTitle || null,
          source,
          email: email || null,
          city: city || null,
          country: country || null,
          tier,
          classification,
          linkedin_url: linkedinUrl || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedId(data.data.id);
        setStep('success');
        onSuccess?.(data.data.id);
      } else {
        setError(data.error || 'Failed to create candidate');
        setStep('form');
      }
    } catch (e) {
      setError('Network error');
      setStep('form');
    }
  }

  function resetAndClose() {
    setName('');
    setCompanyName('');
    setCurrentTitle('');
    setSource('LinkedIn');
    setEmail('');
    setCity('');
    setCountry('');
    setTier(null);
    setClassification(null);
    setLinkedinUrl('');
    setError(null);
    setCreatedId(null);
    setStep('form');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 bg-bg-primary">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif font-semibold text-text-primary">Quick Add Candidate</h2>
            <button onClick={resetAndClose} className="text-text-secondary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'form' && (
            <>
              {/* Required Fields */}
              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-text-primary flex items-center gap-1">
                    <User className="w-4 h-4 text-red-500" />
                    Name (required)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Zhang Wei"
                    className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="TechCorp"
                    className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    Current Title
                  </label>
                  <input
                    type="text"
                    value={currentTitle}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                    placeholder="VP Engineering"
                    className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="text-sm font-medium text-text-secondary">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    LinkedIn URL
                  </label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Location */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Shanghai"
                      className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-secondary">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="China"
                      className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Tier & Classification */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-secondary">Tier</label>
                    <select
                      value={tier || ''}
                      onChange={(e) => setTier(e.target.value || null)}
                      className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">None</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-text-secondary">Classification</label>
                    <select
                      value={classification || ''}
                      onChange={(e) => setClassification(e.target.value || null)}
                      className="w-full px-3 py-2 mt-1 text-sm rounded border border-bg-tertiary bg-bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">None</option>
                      {CLASSIFICATIONS.filter(Boolean).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 text-sm text-red-600">{error}</div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={resetAndClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90">
                  Add Candidate
                </Button>
              </div>
            </>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-text-secondary">Creating candidate...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="mt-3 text-lg font-medium text-text-primary">Candidate Created!</p>
              <p className="mt-1 text-sm text-text-secondary">Added as S1: Sourced</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={resetAndClose}>
                  Add Another
                </Button>
                <Button onClick={() => {
                  if (createdId) {
                    // Navigate to detail or close
                    onSuccess?.(createdId);
                  }
                  resetAndClose();
                }}>
                  View Details
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}