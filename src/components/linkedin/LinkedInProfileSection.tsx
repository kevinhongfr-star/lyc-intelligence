'use client';

import React, { useState, useEffect } from 'react';
import {
  Linkedin,
  Briefcase,
  GraduationCap,
  Globe,
  Award,
  Languages,
  RefreshCw,
  Clock,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface LinkedInProfileSectionProps {
  contactId: string;
  linkedinUrl?: string;
  linkedinData?: any;
  onUpdate?: () => void;
}

export function LinkedInProfileSection({
  contactId,
  linkedinUrl,
  linkedinData,
  onUpdate,
}: LinkedInProfileSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isReimporting, setIsReimporting] = useState(false);
  const [experienceExpanded, setExperienceExpanded] = useState(false);
  const [educationExpanded, setEducationExpanded] = useState(false);

  const hasData = linkedinData || linkedinUrl;

  const handleReimport = async () => {
    if (!linkedinUrl) return;
    setIsReimporting(true);
    try {
      const res = await fetch('/api/linkedin/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedinUrl }),
      });
      const data = await res.json();
      if (data.success) {
        // Poll for completion
        setTimeout(() => {
          onUpdate?.();
        }, 5000);
      }
    } catch (e) {
      console.error('Reimport failed:', e);
    } finally {
      setIsReimporting(false);
    }
  };

  const data = linkedinData || {};

  if (!hasData) {
    return (
      <div className="bg-card border border-border rounded-none p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-none bg-blue-50 flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">LinkedIn Profile</h3>
            <p className="text-sm text-text-muted">No LinkedIn data imported yet</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          Import this candidate's LinkedIn profile to enrich their data with skills, experience, education, and more.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-none overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-alt/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-blue-50 flex items-center justify-center">
            <Linkedin className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-text-primary">LinkedIn Profile</h3>
            <p className="text-sm text-text-muted">
              {data.headline || 'Enriched with LinkedIn data'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2 hover:bg-bg-alt rounded-none text-text-muted hover:text-primary"
              title="Open LinkedIn"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReimport}
            disabled={isReimporting || !linkedinUrl}
            className="gap-2"
          >
            {isReimporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Re-import
          </Button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-6 py-4 space-y-6">
          {/* Basic Info */}
          {(data.headline || data.current_company || data.current_title || data.location) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-text-muted" />
                <h4 className="text-sm font-medium text-text-primary">Current</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {data.current_title && (
                  <div>
                    <span className="text-text-muted">Title: </span>
                    <span className="text-text-secondary font-medium">{data.current_title}</span>
                  </div>
                )}
                {data.current_company && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-text-secondary">{data.current_company}</span>
                  </div>
                )}
                {data.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-text-secondary">{data.location}</span>
                  </div>
                )}
                {data.industry && (
                  <div>
                    <span className="text-text-muted">Industry: </span>
                    <span className="text-text-secondary">{data.industry}</span>
                  </div>
                )}
                {data.years_of_experience !== null && data.years_of_experience !== undefined && (
                  <div>
                    <span className="text-text-muted">Experience: </span>
                    <span className="text-text-secondary">{data.years_of_experience} years</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {data.skills?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-text-muted" />
                <h4 className="text-sm font-medium text-text-primary">
                  Skills ({data.skills.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.slice(0, 20).map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-bg-alt rounded text-xs text-text-secondary"
                  >
                    {skill}
                  </span>
                ))}
                {data.skills.length > 20 && (
                  <span className="px-2 py-0.5 text-xs text-text-muted">
                    +{data.skills.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.experience?.length > 0 && (
            <div>
              <button
                onClick={() => setExperienceExpanded(!experienceExpanded)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-text-muted" />
                  <h4 className="text-sm font-medium text-text-primary">
                    Experience ({data.experience.length})
                  </h4>
                </div>
                {experienceExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>
              {experienceExpanded && (
                <div className="mt-3 space-y-4 pl-6">
                  {data.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="font-medium text-text-primary text-sm">
                        {exp.title}
                      </div>
                      <div className="text-sm text-text-secondary">{exp.company}</div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {exp.start} — {exp.end || 'Present'}
                        {exp.duration && ` • ${exp.duration}`}
                      </div>
                      {exp.description && (
                        <p className="text-xs text-text-muted mt-2 whitespace-pre-line">
                          {exp.description.substring(0, 200)}
                          {exp.description.length > 200 && '...'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {data.education?.length > 0 && (
            <div>
              <button
                onClick={() => setEducationExpanded(!educationExpanded)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-text-muted" />
                  <h4 className="text-sm font-medium text-text-primary">
                    Education ({data.education.length})
                  </h4>
                </div>
                {educationExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>
              {educationExpanded && (
                <div className="mt-3 space-y-3 pl-6">
                  {data.education.map((edu: any, idx: number) => (
                    <div key={idx}>
                      <div className="font-medium text-text-primary text-sm">
                        {edu.school}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {edu.degree}
                        {edu.field && `, ${edu.field}`}
                      </div>
                      {edu.year && (
                        <div className="text-xs text-text-muted">{edu.year}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Languages */}
          {data.languages?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-4 h-4 text-text-muted" />
                <h4 className="text-sm font-medium text-text-primary">Languages</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.languages.map((lang: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-bg-alt rounded text-xs text-text-secondary"
                  >
                    {lang.language || lang}
                    {lang.proficiency && ` (${lang.proficiency})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-text-muted" />
                <h4 className="text-sm font-medium text-text-primary">Certifications</h4>
              </div>
              <div className="space-y-1.5">
                {data.certifications.map((cert: any, idx: number) => (
                  <div key={idx} className="text-sm text-text-secondary">
                    <span className="font-medium">{cert.name}</span>
                    {cert.issuer && <span className="text-text-muted"> — {cert.issuer}</span>}
                    {cert.year && <span className="text-text-muted"> ({cert.year})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {data.summary && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-text-muted" />
                <h4 className="text-sm font-medium text-text-primary">About</h4>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {data.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LinkedInProfileSection;
