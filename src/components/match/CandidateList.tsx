import React from 'react';
import { Plus, X, User, FileText, Users, Upload } from 'lucide-react';
import { CandidateInput } from '../../services/tridentScoring';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF', bgAlt: '#F5F5F5',
  card: '#FFFFFF', cardBorder: '#E5E5E5',
  text: '#000000', textSecondary: '#333333', muted: '#666666',
  border: '#E5E5E5',
  radius: '12px', radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
  success: '#00897B', warning: '#F59E0B', error: '#EF4444',
};

interface CandidateListProps {
  candidates: CandidateInput[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof CandidateInput, value: string) => void;
  onUploadCV?: (type: 'jd' | 'cv', index?: number) => void;
}

export function CandidateList({ candidates, onAdd, onRemove, onUpdate, onUploadCV }: CandidateListProps) {
  const validCandidates = candidates.filter(c => c.name && c.cv);
  
  return (
    <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ 
          fontFamily: DS.headingFont, 
          fontSize: '16px', 
          fontWeight: 600, 
          color: DS.text,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Users style={{ width: 18, height: 18, color: DS.accent }} />
          Candidates ({validCandidates.length} ready)
        </h3>
        
        <button
          onClick={onAdd}
          style={{
            padding: '8px 16px',
            background: DS.bg,
            border: `1px solid ${DS.cardBorder}`,
            borderRadius: '8px',
            color: DS.textSecondary,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minHeight: '44px'
          }}
        >
          <Plus style={{ width: 14, height: 14 }} /> 
          Add Candidate
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {candidates.map((candidate, index) => (
          <div 
            key={index} 
            style={{ 
              background: DS.bg, 
              border: `1px solid ${DS.cardBorder}`, 
              borderRadius: '8px', 
              padding: '16px' 
            }}
          >
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <User style={{ width: 16, height: 16, color: DS.muted }} />
              <input 
                placeholder="Candidate name"
                value={candidate.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '10px 14px', 
                  background: DS.card, 
                  border: `1px solid ${DS.cardBorder}`, 
                  borderRadius: '6px', 
                  color: DS.text, 
                  fontSize: '13px', 
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
              {candidates.length > 1 && (
                <button 
                  onClick={() => onRemove(index)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: DS.muted, 
                    cursor: 'pointer', 
                    padding: '4px'
                  }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <FileText style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '12px', 
                  width: 16, height: 16, 
                  color: DS.muted,
                  pointerEvents: 'none'
                }} />
                <textarea 
                  placeholder="Paste CV, LinkedIn profile, or resume text...

Include: work history, education, key achievements, skills"
                  value={candidate.cv}
                  onChange={(e) => onUpdate(index, 'cv', e.target.value)}
                  style={{ 
                    width: '100%', 
                    minHeight: '100px', 
                    background: DS.card, 
                    border: `1px solid ${DS.cardBorder}`, 
                    borderRadius: '6px', 
                    padding: '10px 10px 10px 38px', 
                    color: DS.text, 
                    fontSize: '12px', 
                    lineHeight: 1.5, 
                    resize: 'vertical', 
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif'
                  }}
                />
              </div>
              
              {onUploadCV && (
                <button
                  onClick={() => onUploadCV('cv', index)}
                  style={{
                    padding: '10px 16px',
                    background: DS.card,
                    border: `1px solid ${DS.cardBorder}`,
                    borderRadius: '6px',
                    color: DS.textSecondary,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '44px',
                    marginTop: '2px'
                  }}
                >
                  <Upload style={{ width: 14, height: 14 }} />
                  Upload
                </button>
              )}
            </div>

            {candidate.cv.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: DS.muted }}>
                {candidate.cv.length.toLocaleString()} characters
              </div>
            )}
          </div>
        ))}
      </div>

      {validCandidates.length === 0 && (
        <div style={{
          marginTop: '16px',
          padding: '20px',
          background: `${DS.warning}10`,
          border: `1px solid ${DS.warning}30`,
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '13px', color: DS.textSecondary, margin: 0 }}>
            Add at least one candidate with name and CV to run scoring
          </p>
        </div>
      )}

      {validCandidates.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: `${DS.success}10`,
          border: `1px solid ${DS.success}30`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DS.success }} />
          <span style={{ fontSize: '12px', color: DS.textSecondary }}>
            {validCandidates.length} candidate{validCandidates.length !== 1 ? 's' : ''} ready to score
          </span>
        </div>
      )}
    </div>
  );
}