import React, { useState, useMemo } from 'react';
import { Trophy, TrendingUp, ChevronDown, ChevronUp, Edit3, Save, X, GripVertical, Star } from 'lucide-react';
import type { TargetCompany, SuccessProfile } from '@/types';

interface Props {
  companies: TargetCompany[];
  successProfile?: SuccessProfile | null;
  mandateId: string;
  onRanksChanged?: (companies: TargetCompany[]) => void;
  onFitScoreCalculated?: (companyId: string, score: number) => void;
}

function calculateFitScore(company: TargetCompany, profile: SuccessProfile | null | undefined): number {
  if (!profile) return company.fit_score ?? 0;

  let score = 0;
  const profileIndustries = profile.required_industries || [];
  const profileGeographies = profile.required_geographies || [];
  const companyIndustry = company.industry || '';
  const companyLocation = company.location || '';

  // Industry match (40 points)
  if (profileIndustries.length > 0) {
    if (profileIndustries.some(i => i.toLowerCase() === companyIndustry.toLowerCase())) {
      score += 40;
    } else if (profileIndustries.some(i => 
      companyIndustry.toLowerCase().includes(i.toLowerCase()) ||
      i.toLowerCase().includes(companyIndustry.toLowerCase())
    )) {
      score += 20;
    } else if (profileIndustries.some(i => {
      const keywords = i.split(/[\s,&-]+/).filter(Boolean);
      return keywords.some(kw => companyIndustry.toLowerCase().includes(kw.toLowerCase()));
    })) {
      score += 10;
    }
  } else {
    score += 20; // No industry requirement, give partial credit
  }

  // Geography match (30 points)
  if (profileGeographies.length > 0) {
    if (profileGeographies.some(g => 
      companyLocation.toLowerCase().includes(g.toLowerCase()) ||
      g.toLowerCase().includes(companyLocation.toLowerCase())
    )) {
      score += 30;
    } else if (profileGeographies.some(g => {
      const region = g.toLowerCase();
      return region.includes('apac') && (
        companyLocation.toLowerCase().includes('china') ||
        companyLocation.toLowerCase().includes('singapore') ||
        companyLocation.toLowerCase().includes('hong kong') ||
        companyLocation.toLowerCase().includes('japan')
      ) || region.includes('emea') && (
        companyLocation.toLowerCase().includes('uk') ||
        companyLocation.toLowerCase().includes('london') ||
        companyLocation.toLowerCase().includes('europe')
      ) || region.includes('americas') && (
        companyLocation.toLowerCase().includes('usa') ||
        companyLocation.toLowerCase().includes('united states') ||
        companyLocation.toLowerCase().includes('new york')
      );
    })) {
      score += 15;
    }
  } else {
    score += 15; // No geography requirement
  }

  // Size match (20 points)
  const sizeStr = company.size || '';
  const employeeMatch = sizeStr.match(/(\d+)[kK]?/);
  const employeeCount = employeeMatch ? parseInt(employeeMatch[1]) * 1000 : 0;
  
  // Simplified size matching against team_size_managed
  if (profile.team_size_managed) {
    const targetTeam = profile.team_size_managed;
    if (employeeCount >= targetTeam * 0.5 && employeeCount <= targetTeam * 2) {
      score += 20;
    } else if (employeeCount >= targetTeam * 0.25 && employeeCount <= targetTeam * 4) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    score += 10; // No size requirement
  }

  // Talent density (10 points)
  if (company.talent_density_score) {
    score += Math.min(10, Math.round(company.talent_density_score));
  } else {
    score += 5; // Default partial credit
  }

  return Math.min(100, Math.max(0, score));
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-100';
  if (score >= 60) return 'text-blue-600 bg-blue-100';
  if (score >= 40) return 'text-amber-600 bg-amber-100';
  if (score >= 20) return 'text-orange-600 bg-orange-100';
  return 'text-slate-600 bg-slate-100';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Low';
  return 'Poor';
}

function ScoreBar({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${getScoreColor(score).split(' ')[1].replace('100', '500')}`}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>
      <div className="flex items-center gap-1 min-w-[60px]">
        <span className={`text-xs font-bold ${getScoreColor(score).split(' ')[0]}`}>{score}</span>
        {showLabel && (
          <span className="text-xs text-text-muted">{getScoreLabel(score)}</span>
        )}
      </div>
    </div>
  );
}

export function CompanyRanking({ companies, successProfile, mandateId, onRanksChanged, onFitScoreCalculated }: Props) {
  const [sortBy, setSortBy] = useState<'fit_score' | 'name' | 'industry'>('fit_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');

  const companiesWithScores = useMemo(() => {
    return companies.map(company => ({
      ...company,
      calculatedScore: calculateFitScore(company, successProfile),
    })).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'fit_score') {
        comparison = (b.calculatedScore || 0) - (a.calculatedScore || 0);
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'industry') {
        comparison = (a.industry || '').localeCompare(b.industry || '');
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [companies, successProfile, sortBy, sortOrder]);

  function handleSort(field: 'fit_score' | 'name' | 'industry') {
    if (sortBy === field) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }

  function handleStartEditNotes(company: TargetCompany) {
    setEditingNotes(company.id);
    setNotesValue(company.ranking_notes || '');
  }

  function handleSaveNotes(company: TargetCompany) {
    // In a real implementation, this would call an API to save the notes
    const updated = companies.map(c => 
      c.id === company.id ? { ...c, ranking_notes: notesValue } : c
    );
    onRanksChanged?.(updated);
    setEditingNotes(null);
    setNotesValue('');
  }

  function handleCancelEditNotes() {
    setEditingNotes(null);
    setNotesValue('');
  }

  const SortIcon = ({ field }: { field: 'fit_score' | 'name' | 'industry' }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'desc' ? (
      <ChevronDown className="w-4 h-4" />
    ) : (
      <ChevronUp className="w-4 h-4" />
    );
  };

  const topCompanies = companiesWithScores.slice(0, 3);
  const avgScore = companiesWithScores.length > 0
    ? Math.round(companiesWithScores.reduce((sum, c) => sum + (c.calculatedScore || 0), 0) / companiesWithScores.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-bg-secondary border border-border rounded-none p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-medium">Top Company</span>
          </div>
          <p className="text-lg font-bold text-text-primary truncate">
            {topCompanies[0]?.name || '—'}
          </p>
          {topCompanies[0] && (
            <p className="text-xs text-accent font-medium">
              Score: {topCompanies[0].calculatedScore}
            </p>
          )}
        </div>

        <div className="bg-bg-secondary border border-border rounded-none p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Average Score</span>
          </div>
          <p className="text-lg font-bold text-text-primary">{avgScore}</p>
          <p className="text-xs text-text-muted">{getScoreLabel(avgScore)} fit</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-none p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">Excellent (80+)</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">
            {companiesWithScores.filter(c => c.calculatedScore >= 80).length}
          </p>
          <p className="text-xs text-text-muted">companies</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-none p-4">
          <div className="flex items-center gap-2 text-text-muted mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-medium">Total Companies</span>
          </div>
          <p className="text-lg font-bold text-text-primary">{companies.length}</p>
          <p className="text-xs text-text-muted">in market map</p>
        </div>
      </div>

      {/* Podium for top 3 */}
      {topCompanies.length >= 3 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4 text-center">
            Top 3 Target Companies
          </h3>
          <div className="flex items-end justify-center gap-4">
            {/* 2nd place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-400 flex items-center justify-center text-lg font-bold text-white mb-2">
                {topCompanies[1].name?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <p className="text-sm font-medium text-white/80 text-center max-w-[100px] truncate">
                {topCompanies[1].name}
              </p>
              <p className="text-xs text-slate-400">2nd</p>
              <p className="text-lg font-bold text-slate-300">{topCompanies[1].calculatedScore}</p>
            </div>

            {/* 1st place */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center text-xl font-bold text-white mb-2 ring-4 ring-amber-400">
                {topCompanies[0].name?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <p className="text-sm font-semibold text-white text-center max-w-[120px] truncate">
                {topCompanies[0].name}
              </p>
              <p className="text-xs text-amber-400">1st</p>
              <p className="text-2xl font-bold text-amber-400">{topCompanies[0].calculatedScore}</p>
            </div>

            {/* 3rd place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-700 flex items-center justify-center text-lg font-bold text-white mb-2">
                {topCompanies[2].name?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <p className="text-sm font-medium text-white/80 text-center max-w-[100px] truncate">
                {topCompanies[2].name}
              </p>
              <p className="text-xs text-slate-400">3rd</p>
              <p className="text-lg font-bold text-amber-600">{topCompanies[2].calculatedScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rankings table */}
      <div className="bg-bg-secondary border border-border rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide w-12">
                  <GripVertical className="w-4 h-4" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Company
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('industry')}
                >
                  <div className="flex items-center gap-1">
                    Industry
                    <SortIcon field="industry" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Location
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-primary"
                  onClick={() => handleSort('fit_score')}
                >
                  <div className="flex items-center gap-1">
                    Fit Score
                    <SortIcon field="fit_score" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {companiesWithScores.map((company, index) => (
                <tr key={company.id} className="border-b border-border hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-slate-200 text-slate-700' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-text-primary">{company.name}</p>
                    {company.domain && (
                      <a
                        href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        {company.domain}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-primary">{company.industry || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-text-primary">{company.location || '—'}</span>
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <ScoreBar score={company.calculatedScore || 0} />
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {editingNotes === company.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add ranking notes..."
                          rows={2}
                          className="w-full text-sm bg-white border border-border rounded-none px-2 py-1 resize-none"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSaveNotes(company)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEditNotes}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted truncate max-w-[140px]">
                          {company.ranking_notes || '—'}
                        </span>
                        <button
                          onClick={() => handleStartEditNotes(company)}
                          className="p-1 text-slate-400 hover:text-accent hover:bg-slate-100 rounded flex-shrink-0"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {companies.length === 0 && (
          <div className="py-10 text-center text-text-muted">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No companies ranked yet</p>
            <p className="text-sm">Add target companies to see rankings</p>
          </div>
        )}
      </div>
    </div>
  );
}
