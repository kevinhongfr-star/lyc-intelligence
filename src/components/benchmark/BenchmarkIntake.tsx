// Phase 7.5: BENCHMARK Intake UI Component
'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  BarChart3,
  Users,
  Filter,
  Play,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Select } from '@/components/ui';
import { Checkbox } from '@/components/ui';

interface BenchmarkIntakeProps {
  organizationId: string;
  userId: string;
  onComplete: (benchmarkId: string) => void;
}

const ASSESSMENT_TYPES = [
  { value: 'SHIFT_LEAP', label: 'SHIFT LEAP', description: 'Leadership & Executive Assessment' },
  { value: 'SHIFT_QUEST', label: 'SHIFT QUEST', description: 'Analytical & Problem-Solving' },
  { value: 'SHIFT_DRIVE', label: 'SHIFT DRIVE', description: 'Goal & Performance Focus' },
  { value: 'SHIFT_COACH', label: 'SHIFT COACH', description: 'Coaching & Development' },
  { value: 'SHIFT_IMPACT', label: 'SHIFT IMPACT', description: 'Influence & Stakeholder Management' },
];

const BENCHMARK_SCOPES = [
  { value: 'industry', label: 'Industry', description: 'Compare against industry peers' },
  { value: 'function', label: 'Function', description: 'Compare against functional peers' },
  { value: 'seniority', label: 'Seniority', description: 'Compare against seniority level peers' },
  { value: 'custom', label: 'Custom', description: 'Define custom peer group filters' },
];

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Energy', 'Media', 'Consulting'];
const FUNCTIONS = ['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Legal', 'Product'];
const SENIORITIES = ['C-level', 'VP', 'Director', 'Manager', 'Senior', 'Junior'];

export function BenchmarkIntake({ organizationId, userId, onComplete }: BenchmarkIntakeProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [shiftResultCount, setShiftResultCount] = useState(0);
  const [peerCount, setPeerCount] = useState(0);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; has_result: boolean }>>([]);

  // Form state
  const [assessmentType, setAssessmentType] = useState('SHIFT_LEAP');
  const [benchmarkScope, setBenchmarkScope] = useState('industry');
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [functionFilter, setFunctionFilter] = useState<string[]>([]);
  const [seniorityFilter, setSeniorityFilter] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchShiftResultCount();
  }, [assessmentType]);

  useEffect(() => {
    fetchPeerCount();
  }, [benchmarkScope, industryFilter, functionFilter, seniorityFilter]);

  useEffect(() => {
    fetchTeamMembers();
  }, [organizationId, assessmentType]);

  const fetchShiftResultCount = async () => {
    try {
      const response = await authFetch(`/api/scoring/compute?action=count&type=${assessmentType}`);
      const result = await response.json();
      if (result.success) {
        setShiftResultCount(result.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch SHIFT result count:', err);
    }
  };

  const fetchPeerCount = async () => {
    try {
      const params = new URLSearchParams({
        action: 'peer-count',
        type: assessmentType,
        scope: benchmarkScope,
      });
      if (industryFilter.length) params.set('industry', industryFilter.join(','));
      if (functionFilter.length) params.set('function', functionFilter.join(','));
      if (seniorityFilter.length) params.set('seniority', seniorityFilter.join(','));

      const response = await authFetch(`/api/scoring/compute?${params}`);
      const result = await response.json();
      if (result.success) {
        setPeerCount(result.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch peer count:', err);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await authFetch(`/api/scoring/compute?action=team-members&type=${assessmentType}&org_id=${organizationId}`);
      const result = await response.json();
      if (result.success) {
        setTeamMembers(result.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleRunBenchmark = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/api/scoring/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'benchmark',
          assessment_type: assessmentType,
          benchmark_scope: benchmarkScope,
          industry_filter: industryFilter,
          function_filter: functionFilter,
          seniority_filter: seniorityFilter,
          team_member_ids: selectedMembers,
          organization_id: organizationId,
          created_by: userId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onComplete(result.benchmark_id);
      }
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleFilter = (type: 'industry' | 'function' | 'seniority', value: string) => {
    const setter = type === 'industry' ? setIndustryFilter : type === 'function' ? setFunctionFilter : setSeniorityFilter;
    const current = type === 'industry' ? industryFilter : type === 'function' ? functionFilter : seniorityFilter;
    
    setter(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return shiftResultCount >= 50;
      case 2:
        return peerCount >= 50;
      case 3:
        return selectedMembers.length >= 1 && selectedMembers.length <= 20;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const eligibleMembers = teamMembers.filter(m => m.has_result);

  return (
    <Card className="p-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h2 className="font-semibold text-text-primary">BENCHMARK Assessment</h2>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`w-8 h-2 rounded-full ${s <= step ? 'bg-primary' : 'bg-bg-alt'}`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Select Assessment Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-text-primary mb-2">Step 1: Select Assessment Type</h3>
            <p className="text-sm text-text-muted mb-4">
              Choose the SHIFT assessment type to benchmark
            </p>
          </div>

          <div className="grid gap-3">
            {ASSESSMENT_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setAssessmentType(type.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  assessmentType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-text-muted'
                }`}
              >
                <div className="font-medium text-text-primary">{type.label}</div>
                <div className="text-sm text-text-muted">{type.description}</div>
              </button>
            ))}
          </div>

          <div className={`p-4 rounded-lg ${shiftResultCount >= 50 ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-2">
              {shiftResultCount >= 50 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className={`font-medium ${shiftResultCount >= 50 ? 'text-green-700' : 'text-amber-700'}`}>
                {shiftResultCount} SHIFT results available
              </span>
            </div>
            {shiftResultCount < 50 && (
              <p className="text-sm text-amber-600 mt-2">
                Minimum 50 SHIFT results required for benchmarking
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Define Peer Group */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-text-primary mb-2">Step 2: Define Peer Group</h3>
            <p className="text-sm text-text-muted mb-4">
              Select the scope and filters for peer comparison
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-text-muted">Benchmark Scope</label>
            <Select
              value={benchmarkScope}
              onValueChange={(value) => setBenchmarkScope(value)}
              className="mt-1"
            >
              {BENCHMARK_SCOPES.map(scope => (
                <option key={scope.value} value={scope.value}>{scope.label}</option>
              ))}
            </Select>
          </div>

          {/* Filters based on scope */}
          {(benchmarkScope === 'industry' || benchmarkScope === 'custom') && (
            <div>
              <label className="text-sm font-medium text-text-muted">Industries</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INDUSTRIES.map(ind => (
                  <button
                    key={ind}
                    onClick={() => toggleFilter('industry', ind)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      industryFilter.includes(ind)
                        ? 'bg-primary text-white'
                        : 'bg-bg-alt text-text-muted'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(benchmarkScope === 'function' || benchmarkScope === 'custom') && (
            <div>
              <label className="text-sm font-medium text-text-muted">Functions</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FUNCTIONS.map(func => (
                  <button
                    key={func}
                    onClick={() => toggleFilter('function', func)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      functionFilter.includes(func)
                        ? 'bg-primary text-white'
                        : 'bg-bg-alt text-text-muted'
                    }`}
                  >
                    {func}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(benchmarkScope === 'seniority' || benchmarkScope === 'custom') && (
            <div>
              <label className="text-sm font-medium text-text-muted">Seniority Levels</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SENIORITIES.map(sen => (
                  <button
                    key={sen}
                    onClick={() => toggleFilter('seniority', sen)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      seniorityFilter.includes(sen)
                        ? 'bg-primary text-white'
                        : 'bg-bg-alt text-text-muted'
                    }`}
                  >
                    {sen}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`p-4 rounded-lg ${peerCount >= 50 ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-2">
              {peerCount >= 50 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className={`font-medium ${peerCount >= 50 ? 'text-green-700' : 'text-amber-700'}`}>
                {peerCount} SHIFT results match this peer group
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select Team Members */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-text-primary mb-2">Step 3: Select Team Members</h3>
            <p className="text-sm text-text-muted mb-4">
              Choose team members who have completed the selected SHIFT assessment
            </p>
          </div>

          {eligibleMembers.length === 0 ? (
            <div className="p-8 text-center bg-bg-alt rounded-lg">
              <Users className="w-12 h-12 text-text-muted mx-auto" />
              <p className="text-text-muted mt-4">No team members have completed this assessment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligibleMembers.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMembers.includes(member.id)
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-bg-alt border-2 border-transparent hover:border-border'
                  }`}
                  onClick={() => toggleMember(member.id)}
                >
                  <Checkbox
                    checked={selectedMembers.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <div className="flex-1">
                    <span className="font-medium text-text-primary">{member.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-text-muted">
            Selected: {selectedMembers.length} members (max 20)
          </div>
        </div>
      )}

      {/* Step 4: Review & Run */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-text-primary mb-2">Step 4: Review & Run</h3>
            <p className="text-sm text-text-muted mb-4">
              Confirm your benchmark configuration
            </p>
          </div>

          <div className="p-4 bg-bg-alt rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Assessment Type</span>
              <span className="font-medium text-text-primary">{assessmentType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Benchmark Scope</span>
              <span className="font-medium text-text-primary">{benchmarkScope}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Peer Sample Size</span>
              <span className="font-medium text-text-primary">{peerCount} results</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Team Members</span>
              <span className="font-medium text-text-primary">{selectedMembers.length}</span>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <div>
                <span className="font-medium text-text-primary">15 Credits</span>
                <span className="text-sm text-text-muted ml-2">will be charged to your organization</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleRunBenchmark}
            disabled={isLoading}
            className="w-full gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Running Benchmark...' : 'Run Benchmark'}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        {step < 4 && (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export default BenchmarkIntake;