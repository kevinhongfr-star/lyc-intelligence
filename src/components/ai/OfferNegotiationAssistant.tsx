// Phase 6.4: Offer Negotiation Assistant Component
// AI-Assisted Features - Suggest and adjust offers

'use client';

import React, { useState } from 'react';
import {
  Loader2,
  DollarSign,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  suggestOffer,
  type OfferSuggestion,
  isAIConfigured,
} from '@/services/ai/aiService';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';

interface CandidateProfile {
  id: string;
  title: string;
  yearsExperience: number;
  skills: string[];
  currentCompensation?: {
    base?: number;
    bonus?: number;
    equity?: string;
  };
}

interface MandateInfo {
  id: string;
  title: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  seniorityLevel?: string;
  location?: string;
  clientName?: string;
}

interface MarketData {
  avgBaseSalary?: number;
  avgTotalComp?: number;
  dataSource?: string;
}

interface OfferNegotiationAssistantProps {
  candidate: CandidateProfile;
  mandate: MandateInfo;
  marketData?: MarketData;
  /**
   * Callback when offer is created
   */
  onCreateOffer?: (offerData: {
    baseSalary: number;
    bonusPercentage: number;
    equity: string;
    benefits: string[];
    rationale: string;
  }) => void;
  /**
   * Callback to cancel
   */
  onCancel?: () => void;
}

type Step = 'loading' | 'suggestion' | 'adjusting' | 'creating';

export function OfferNegotiationAssistant({
  candidate,
  mandate,
  marketData,
  onCreateOffer,
  onCancel,
}: OfferNegotiationAssistantProps) {
  const [step, setStep] = useState<Step>('loading');
  const [suggestion, setSuggestion] = useState<OfferSuggestion | null>(null);
  const [adjustedOffer, setAdjustedOffer] = useState<{
    baseSalary: number;
    bonusPercentage: number;
    equity: string;
    benefits: string[];
    rationale: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('breakdown');

  const aiConfigured = isAIConfigured();

  // Generate suggestion on mount
  React.useEffect(() => {
    const generate = async () => {
      if (!aiConfigured) {
        setError('AI is not configured. Please contact your administrator if this issue persists.');
        setStep('suggestion');
        return;
      }

      setStep('loading');
      setError(null);

      try {
        const result = await suggestOffer(
          {
            title: candidate.title,
            yearsExperience: candidate.yearsExperience,
            skills: candidate.skills,
            currentCompensation: candidate.currentCompensation,
          },
          {
            title: mandate.title,
            budgetRange: mandate.budgetRange,
            seniorityLevel: mandate.seniorityLevel,
            location: mandate.location,
          },
          marketData
        );

        if (result.success && result.data) {
          setSuggestion(result.data);
          setAdjustedOffer({
            baseSalary: result.data.baseSalaryRange.recommended,
            bonusPercentage: result.data.bonusStructure.percentage,
            equity: result.data.equity.type === 'none' ? '' : result.data.equity.value || '',
            benefits: result.data.benefits,
            rationale: result.data.negotiationStrategy,
          });
          setStep('suggestion');
        } else {
          setError(result.error || 'Failed to generate offer suggestion');
          setStep('suggestion');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate suggestion');
        setStep('suggestion');
      }
    };

    generate();
  }, [candidate, mandate, marketData, aiConfigured]);

  // Handle field adjustment
  const handleAdjust = (field: keyof typeof adjustedOffer, value: any) => {
    if (!adjustedOffer) return;
    setAdjustedOffer({ ...adjustedOffer, [field]: value });
  };

  // Create offer
  const handleCreateOffer = () => {
    if (!adjustedOffer) return;
    setStep('creating');

    // Simulate save
    setTimeout(() => {
      onCreateOffer?.(adjustedOffer);
    }, 500);
  };

  // Calculate total compensation
  const calculateTotalComp = () => {
    if (!adjustedOffer) return 0;
    const base = adjustedOffer.baseSalary || 0;
    const bonus = base * (adjustedOffer.bonusPercentage / 100);
    return base + bonus;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render loading
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-text-primary">Analyzing Offer Data...</p>
          <p className="text-sm text-text-muted mt-1">
            Generating competitive offer suggestion
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !suggestion) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Failed to Generate Suggestion</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onCancel} className="w-full">
          Close
        </Button>
      </div>
    );
  }

  // Render suggestion
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">AI Offer Suggestion</h3>
            <p className="text-sm text-text-muted">
              {mandate.title} • {candidate.title}
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="p-1 hover:bg-bg-alt rounded transition-colors">
          <X className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Market Context */}
      {marketData?.avgBaseSalary && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Market Context</p>
            <p>Average base for similar roles: {formatCurrency(marketData.avgBaseSalary)}</p>
            <p className="text-xs mt-1 opacity-75">
              Source: {marketData.dataSource || 'Market Research'}
            </p>
          </div>
        </div>
      )}

      {/* Total Compensation Card */}
      <div className="bg-primary rounded-xl p-6 text-white">
        <p className="text-sm opacity-75 mb-1">Suggested Total Compensation</p>
        <p className="text-4xl font-bold">{formatCurrency(calculateTotalComp())}</p>
        <p className="text-sm opacity-75 mt-1">
          Base {formatCurrency(adjustedOffer?.baseSalary || 0)} + {adjustedOffer?.bonusPercentage || 0}% bonus
        </p>
      </div>

      {/* Breakdown Sections */}
      <div className="space-y-3">
        {/* Base Salary */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-bg-alt transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'breakdown' ? null : 'breakdown')}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium text-text-primary">Base Salary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-text-primary">
                {formatCurrency(adjustedOffer?.baseSalary || 0)}
              </span>
              {expandedSection === 'breakdown' ? (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-muted" />
              )}
            </div>
          </button>
          {expandedSection === 'breakdown' && (
            <div className="px-4 pb-4 pt-0 space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Annual Base Salary
                </label>
                <input
                  type="number"
                  value={adjustedOffer?.baseSalary || ''}
                  onChange={(e) => handleAdjust('baseSalary', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
                />
              </div>
              {suggestion?.baseSalaryRange && (
                <div className="text-sm text-text-muted">
                  Range: {formatCurrency(suggestion.baseSalaryRange.min)} - {formatCurrency(suggestion.baseSalaryRange.max)}
                  {suggestion.baseSalaryRange.recommended !== adjustedOffer?.baseSalary && (
                    <span className="ml-2 text-primary">
                      (AI recommended: {formatCurrency(suggestion.baseSalaryRange.recommended)})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bonus */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-bg-alt transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'bonus' ? null : 'bonus')}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center text-green-600 font-bold">%</div>
              <span className="font-medium text-text-primary">Bonus</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-text-primary">
                {adjustedOffer?.bonusPercentage || 0}%
              </span>
              {expandedSection === 'bonus' ? (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-muted" />
              )}
            </div>
          </button>
          {expandedSection === 'bonus' && (
            <div className="px-4 pb-4 pt-0 space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Target Bonus Percentage
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={adjustedOffer?.bonusPercentage || 0}
                  onChange={(e) => handleAdjust('bonusPercentage', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
                />
              </div>
              <p className="text-sm text-text-muted">
                Estimated bonus: {formatCurrency(calculateTotalComp() * (adjustedOffer?.bonusPercentage || 0) / 100)}
              </p>
            </div>
          )}
        </div>

        {/* Equity */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-bg-alt transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'equity' ? null : 'equity')}
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center text-purple-600 font-bold">$</div>
              <span className="font-medium text-text-primary">Equity / RSU</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-text-primary">
                {adjustedOffer?.equity || 'None'}
              </span>
              {expandedSection === 'equity' ? (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-muted" />
              )}
            </div>
          </button>
          {expandedSection === 'equity' && (
            <div className="px-4 pb-4 pt-0">
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Equity / RSU Value (optional)
              </label>
              <input
                type="text"
                value={adjustedOffer?.equity || ''}
                onChange={(e) => handleAdjust('equity', e.target.value)}
                placeholder="e.g., 0.1% over 4 years, $100K RSU"
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
              />
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-bg-alt transition-colors"
            onClick={() => setExpandedSection(expandedSection === 'benefits' ? null : 'benefits')}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-text-primary">Benefits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">
                {adjustedOffer?.benefits?.length || 0} items
              </span>
              {expandedSection === 'benefits' ? (
                <ChevronDown className="w-5 h-5 text-text-muted" />
              ) : (
                <ChevronRight className="w-5 h-5 text-text-muted" />
              )}
            </div>
          </button>
          {expandedSection === 'benefits' && (
            <div className="px-4 pb-4 pt-0 space-y-2">
              {adjustedOffer?.benefits?.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-text-primary">{benefit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Negotiation Strategy */}
        {adjustedOffer?.rationale && (
          <div className="border border-border rounded-lg p-4 bg-amber-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">Negotiation Strategy</span>
            </div>
            <p className="text-sm text-amber-700">{adjustedOffer.rationale}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleCreateOffer}
          disabled={step === 'creating'}
          className="flex-1"
        >
          {step === 'creating' ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Create Offer
        </Button>
      </div>
    </div>
  );
}

// Compact button version
export function OfferNegotiationButton({
  candidate,
  mandate,
  marketData,
  onOfferCreated,
}: {
  candidate: CandidateProfile;
  mandate: MandateInfo;
  marketData?: MarketData;
  onOfferCreated: (offerData: {
    baseSalary: number;
    bonusPercentage: number;
    equity: string;
    benefits: string[];
    rationale: string;
  }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Get AI Offer Suggestion
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Offer Negotiation Assistant
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-bg-alt rounded transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="p-6">
              <OfferNegotiationAssistant
                candidate={candidate}
                mandate={mandate}
                marketData={marketData}
                onCreateOffer={(offerData) => {
                  onOfferCreated(offerData);
                  setIsOpen(false);
                }}
                onCancel={() => setIsOpen(false)}
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default OfferNegotiationAssistant;
